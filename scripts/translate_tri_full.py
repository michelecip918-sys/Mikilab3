#!/usr/bin/env python3
"""Genera fr/fa/ar/tr per TUTTE le stringhe IT di tri() e le fonde in triTranslations.json.
Usa Claude (haiku) via emergentintegrations + EMERGENT_LLM_KEY. Idempotente: non sovrascrive valori esistenti."""
import os, sys, json, asyncio, re

sys.path.insert(0, "/app/backend")
from dotenv import load_dotenv
load_dotenv("/app/backend/.env")

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta

KEY = os.environ.get("EMERGENT_LLM_KEY")
MODEL = "claude-haiku-4-5-20251001"
MAP = "/app/frontend/src/i18n/triTranslations.json"
WORK = "/app/scripts/_tri_work.json"
PARTIAL = "/app/scripts/_tri_partial.json"
LOG = "/app/scripts/_tri_gen.log"
BATCH = 20

def log(msg):
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(msg + "\n")
    print(msg, flush=True)

SYS = (
    "You are a professional UI localizer for a bakery/pizzeria/pastry management software. "
    "Translate short Italian UI strings into French (fr), Persian/Farsi (fa), Arabic (ar) and Turkish (tr). "
    "Rules: keep it natural, concise and professional (corporate bakery tone). "
    "Preserve EXACTLY any emojis, numbers, punctuation, symbols, %, and placeholder tokens (like {x}, %s, backslash-n). "
    "Do NOT translate proper nouns/brand names (MikiLab, Sitor). "
    "Return ONLY a JSON object, no prose, no code fences."
)

def build_prompt(batch):
    items = {str(i): s for i, s in enumerate(batch)}
    return (
        "Translate each Italian string below. Return a JSON object where each key is the same index and "
        'the value is an object {"fr":"...","fa":"...","ar":"...","tr":"..."}.\n'
        "Input (JSON index->italian):\n" + json.dumps(items, ensure_ascii=False)
    )

def extract_json(text):
    text = text.strip()
    text = re.sub(r"^```(json)?", "", text).strip()
    text = re.sub(r"```$", "", text).strip()
    a, b = text.find("{"), text.rfind("}")
    if a >= 0 and b > a:
        return json.loads(text[a:b+1])
    raise ValueError("no json")

async def translate_batch(batch):
    chat = LlmChat(api_key=KEY, session_id="tri-gen", system_message=SYS).with_model("anthropic", MODEL).with_params(max_tokens=4000)
    out = ""
    async for ev in chat.stream_message(UserMessage(text=build_prompt(batch))):
        if isinstance(ev, TextDelta):
            out += ev.content or ""
    return extract_json(out)

async def main():
    open(LOG, "w").close()
    work = json.load(open(WORK, encoding="utf-8"))
    all_strings = work["all_strings"]
    log(f"Da tradurre: {len(all_strings)} stringhe, batch={BATCH}")
    results = {}
    if os.path.exists(PARTIAL):
        try:
            results = json.load(open(PARTIAL, encoding="utf-8"))
            log(f"Ripresa da partial: {len(results)} gia fatte")
        except Exception:
            results = {}
    todo = [s for s in all_strings if s not in results]
    for bi in range(0, len(todo), BATCH):
        batch = todo[bi:bi+BATCH]
        for attempt in range(3):
            try:
                res = await translate_batch(batch)
                for i, s in enumerate(batch):
                    r = res.get(str(i)) or {}
                    if r.get("fr") and r.get("fa") and r.get("ar") and r.get("tr"):
                        results[s] = {"fr": r["fr"], "fa": r["fa"], "ar": r["ar"], "tr": r["tr"]}
                break
            except Exception as e:
                log(f"  batch {bi} tentativo {attempt+1} errore: {e}")
                await asyncio.sleep(2)
        json.dump(results, open(PARTIAL, "w", encoding="utf-8"), ensure_ascii=False)
        log(f"Progresso: {len(results)}/{len(all_strings)}")
    data = json.load(open(MAP, encoding="utf-8"))
    added = {"fr": 0, "fa": 0, "ar": 0, "tr": 0}
    for s, tr in results.items():
        entry = data.get(s) or {}
        for l in ("fr", "fa", "ar", "tr"):
            if not entry.get(l) and tr.get(l):
                entry[l] = tr[l]
                added[l] += 1
        data[s] = entry
    json.dump(data, open(MAP, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    log(f"MERGE fatto. Aggiunte: {added}. Chiavi totali ora: {len(data)}")
    log("DONE")

if __name__ == "__main__":
    asyncio.run(main())
