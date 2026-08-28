"""Backfill doppia nomenclatura (real_name) + traduzioni IT/EN/FR/ES per le ricette MikiLab.
Idempotente e resumable: riempie SOLO i campi mancanti. Esegui in background:
    python backfill_recipe_i18n.py > /tmp/backfill_i18n.log 2>&1 &
"""
import asyncio, os, json, re, sys
from dotenv import load_dotenv
load_dotenv()
from motor.motor_asyncio import AsyncIOMotorClient
from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

KEY = os.environ.get("EMERGENT_LLM_KEY")
client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

LANG_NAMES = {"en": "inglese", "es": "spagnolo", "fr": "francese"}
BODY = ["flour_type", "notes", "procedure"]
TARGETS = ["en", "es", "fr"]


def missing_fields(r):
    """Ritorna la lista di chiavi da chiedere all'LLM per questa ricetta."""
    need = {}
    # nome reale IT (doppia nomenclatura)
    if not (r.get("real_name") or "").strip():
        need["real_name"] = True
    # nome fantastico + reale nelle 3 lingue
    for lg in TARGETS:
        if not (r.get(f"name_{lg}") or "").strip():
            need[f"name_{lg}"] = True
        # real_name_<lg> lo compiliamo se abbiamo (o creeremo) un real_name
        if not (r.get(f"real_name_{lg}") or "").strip():
            need[f"real_name_{lg}"] = True
    # corpo (flour_type/notes/procedure) nelle 3 lingue, solo se il campo IT esiste
    for base in BODY:
        if (r.get(base) or "").strip():
            for lg in TARGETS:
                if not (r.get(f"{base}_{lg}") or "").strip():
                    need[f"{base}_{lg}"] = True
    return list(need.keys())


async def translate_recipe(r):
    keys = missing_fields(r)
    if not keys:
        return {}
    src = {
        "name": r.get("name"),
        "real_name_it_esistente": r.get("real_name") or "",
        "flour_type": r.get("flour_type") or "",
        "notes": r.get("notes") or "",
        "procedure": r.get("procedure") or "",
    }
    sys_msg = (
        "Sei un traduttore esperto di panificazione artigianale professionale. "
        "La ricetta ha un NOME FANTASTICO/creativo (campo 'name'). Devi anche fornire il NOME REALE e comprensibile "
        "del prodotto (es. 'Teca di Riccio' -> 'Pane alle Noci'; 'Filo di Francia' -> 'Baguette'). "
        "Se 'real_name_it_esistente' è già valorizzato, USALO come nome reale italiano (non cambiarlo). "
        "Mantieni invariati i termini tecnici (Lievito Madre, Poolish, Biga, Sauerteig, Panettone, Kochstück, Quellstück) "
        "e i nomi propri (MikiLab, Michele, Matera, Altamura). Preserva FEDELMENTE il processo tecnico: metodo, idratazione %, "
        "temperature, ordine dei passaggi. Non riordinare né semplificare. Rispondi SOLO con JSON valido, senza commenti."
    )
    fields_desc = ", ".join(keys)
    prompt = (
        f"Dati della ricetta:\n{json.dumps(src, ensure_ascii=False)}\n\n"
        f"Restituisci un JSON con ESATTAMENTE queste chiavi (e SOLO queste): {fields_desc}.\n"
        "Regole:\n"
        "- 'real_name' = nome reale/comprensibile del prodotto in ITALIANO.\n"
        "- 'name_en/es/fr' = traduzione del NOME FANTASTICO nella lingua (mantieni il tono creativo).\n"
        "- 'real_name_en/es/fr' = traduzione del NOME REALE del prodotto nella lingua.\n"
        "- 'flour_type_en/es/fr', 'notes_en/es/fr', 'procedure_en/es/fr' = traduzione fedele dei rispettivi campi.\n"
        "Lingue: en=inglese, es=spagnolo, fr=francese."
    )
    try:
        chat = LlmChat(api_key=KEY, session_id=f"bf-{r.get('id','x')}", system_message=sys_msg
                       ).with_model("anthropic", "claude-sonnet-4-6").with_params(max_tokens=4000)
        full = ""
        async for ev in chat.stream_message(UserMessage(text=prompt)):
            if isinstance(ev, TextDelta):
                full += ev.content
            elif isinstance(ev, StreamDone):
                break
        m = re.search(r"\{.*\}", full, re.S)
        if not m:
            return {}
        data = json.loads(m.group(0))
        # tieni solo le chiavi richieste e non vuote
        out = {k: v for k, v in data.items() if k in keys and isinstance(v, str) and v.strip()}
        return out
    except Exception as e:
        print(f"  ! errore {r.get('name')}: {e}", flush=True)
        return {}


async def main():
    cur = db.recipes.find({"collection_name": "mikilab"}, {"_id": 0})
    recs = await cur.to_list(1000)
    print(f"Ricette MikiLab: {len(recs)}", flush=True)
    done = 0
    for i, r in enumerate(recs, 1):
        keys = missing_fields(r)
        if not keys:
            continue
        upd = await translate_recipe(r)
        if upd:
            await db.recipes.update_one({"id": r["id"]}, {"$set": upd})
            done += 1
            print(f"[{i}/{len(recs)}] {r.get('name')}: +{len(upd)} campi ({', '.join(list(upd.keys())[:6])}{'…' if len(upd)>6 else ''})", flush=True)
        else:
            print(f"[{i}/{len(recs)}] {r.get('name')}: nessun aggiornamento", flush=True)
    print(f"FATTO. Ricette aggiornate: {done}", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
