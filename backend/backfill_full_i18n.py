"""Backfill COMPLETO i18n ricette MikiLab:
  Fase 1: traduce i nomi degli INGREDIENTI EXTRA (unici) in de/en/es/fr/fa e li riscrive
          in ogni ricetta come name_de/name_en/name_es/name_fr/name_fa.
  Fase 2: traduce i campi ricetta in PERSIANO (fa): name, real_name, flour_type, notes, procedure.
Idempotente e resumable. Esegui in background:
    python backfill_full_i18n.py > /tmp/backfill_full.log 2>&1 &
"""
import asyncio, os, json, re
from dotenv import load_dotenv
load_dotenv()
from motor.motor_asyncio import AsyncIOMotorClient
from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

KEY = os.environ.get("EMERGENT_LLM_KEY")
client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

LANGS = ["de", "en", "es", "fr", "fa"]
LANG_NAMES = {"de": "tedesco", "en": "inglese", "es": "spagnolo", "fr": "francese", "fa": "persiano (farsi)"}
TECH = ("Lievito Madre, Poolish, Biga, Sauerteig, Panettone, Backmittel, Kochstück, Quellstück, LiCoLi")


async def _ask(system_message, prompt, session_id, max_tokens=3000):
    chat = LlmChat(api_key=KEY, session_id=session_id, system_message=system_message
                   ).with_model("anthropic", "claude-sonnet-4-6").with_params(max_tokens=max_tokens)
    full = ""
    async for ev in chat.stream_message(UserMessage(text=prompt)):
        if isinstance(ev, TextDelta):
            full += ev.content
        elif isinstance(ev, StreamDone):
            break
    m = re.search(r"\{.*\}", full, re.S)
    return json.loads(m.group(0)) if m else {}


# ---------------- FASE 1: ingredienti extra ----------------
async def translate_ingredients():
    recs = await db.recipes.find({"collection_name": "mikilab"}, {"_id": 0}).to_list(1000)
    names = set()
    for r in recs:
        for e in (r.get("extra_ingredients") or []):
            n = (e.get("name") or "").strip()
            # tradurre solo se manca almeno una lingua
            if n and any(not (e.get(f"name_{lg}") or "").strip() for lg in LANGS):
                names.add(n)
    names = sorted(names)
    print(f"[FASE1] ingredienti da tradurre: {len(names)}", flush=True)
    cache = {}
    sys_msg = (
        "Sei un traduttore esperto di ingredienti da panificazione/pasticceria professionale. "
        f"Mantieni invariati i termini tecnici ({TECH}) e i marchi. Traduci fedelmente, in modo conciso, "
        "SENZA aggiungere spiegazioni. Rispondi SOLO con JSON valido."
    )
    BATCH = 30
    for i in range(0, len(names), BATCH):
        chunk = names[i:i + BATCH]
        prompt = (
            "Traduci ognuno di questi nomi di ingrediente nelle 5 lingue (de=tedesco, en=inglese, es=spagnolo, "
            "fr=francese, fa=persiano). Restituisci un JSON dove OGNI chiave è il nome italiano ESATTO fornito e "
            'il valore è {"de":..,"en":..,"es":..,"fr":..,"fa":..}. Mantieni le percentuali/quantità tra parentesi.\n'
            + json.dumps(chunk, ensure_ascii=False)
        )
        try:
            data = await _ask(sys_msg, prompt, f"ing-{i}", max_tokens=4000)
            for k, v in data.items():
                if isinstance(v, dict):
                    cache[k] = v
            print(f"[FASE1] batch {i//BATCH+1}: +{len(data)} nomi (cache={len(cache)})", flush=True)
        except Exception as e:
            print(f"[FASE1] errore batch {i}: {e}", flush=True)
    # riscrivi nelle ricette
    updated = 0
    for r in recs:
        exs = r.get("extra_ingredients") or []
        changed = False
        for e in exs:
            n = (e.get("name") or "").strip()
            tr = cache.get(n)
            if not tr:
                continue
            for lg in LANGS:
                val = (tr.get(lg) or "").strip()
                if val and not (e.get(f"name_{lg}") or "").strip():
                    e[f"name_{lg}"] = val
                    changed = True
        if changed:
            await db.recipes.update_one({"id": r["id"]}, {"$set": {"extra_ingredients": exs}})
            updated += 1
    print(f"[FASE1] ricette aggiornate con ingredienti tradotti: {updated}", flush=True)


# ---------------- FASE 2: campi ricetta in FA ----------------
FA_FIELDS = ["name", "real_name", "flour_type", "notes", "procedure"]


async def translate_fa():
    recs = await db.recipes.find({"collection_name": "mikilab"}, {"_id": 0}).to_list(1000)
    todo = [r for r in recs if any((r.get(f) or "").strip() and not (r.get(f"{f}_fa") or "").strip() for f in FA_FIELDS)]
    print(f"[FASE2] ricette da tradurre in FA: {len(todo)}", flush=True)
    sys_msg = (
        "Sei un traduttore esperto di panificazione artigianale verso il PERSIANO (farsi). "
        f"Mantieni invariati i termini tecnici ({TECH}) e i nomi propri (MikiLab, Michele, Matera, Altamura). "
        "Per i NOMI di fantasia, traduci fedelmente la parte descrittiva tra parentesi. Preserva metodo, idratazione %, "
        "temperature e ordine dei passaggi. Rispondi SOLO con JSON valido."
    )
    done = 0
    for idx, r in enumerate(todo, 1):
        fields = {f: r.get(f) for f in FA_FIELDS if (r.get(f) or "").strip() and not (r.get(f"{f}_fa") or "").strip()}
        if not fields:
            continue
        keys = ", ".join(f"{k}_fa" for k in fields)
        prompt = (f"Traduci in persiano e restituisci un JSON con SOLO le chiavi {keys} corrispondenti ai campi:\n"
                  + json.dumps(fields, ensure_ascii=False))
        try:
            data = await _ask(sys_msg, prompt, f"fa-{r.get('id','x')}", max_tokens=3000)
            upd = {k: v for k, v in data.items() if k.endswith("_fa") and isinstance(v, str) and v.strip()}
            if upd:
                await db.recipes.update_one({"id": r["id"]}, {"$set": upd})
                done += 1
                print(f"[FASE2] [{idx}/{len(todo)}] {r.get('name')}: +{len(upd)} campi FA", flush=True)
        except Exception as e:
            print(f"[FASE2] errore {r.get('name')}: {e}", flush=True)
    print(f"[FASE2] ricette FA aggiornate: {done}", flush=True)


async def main():
    await translate_ingredients()
    await translate_fa()
    print("FATTO backfill completo i18n.", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
