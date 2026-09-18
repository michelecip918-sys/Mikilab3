#!/usr/bin/env python3
"""Completa le traduzioni AR + TR mancanti in triTranslations.json usando Claude (Emergent key).
Batch di 30 stringhe, salvataggio incrementale, ri-eseguibile per completare i residui."""
import os, sys, json, asyncio, re
sys.path.insert(0, "/app/backend")
from dotenv import load_dotenv
load_dotenv("/app/backend/.env")
from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

KEY = os.environ["EMERGENT_LLM_KEY"]
MODEL = "claude-haiku-4-5-20251001"
PATH = "/app/frontend/src/i18n/triTranslations.json"
BATCH = 30

SYS = (
    "You are a professional UI localizer for a bakery/pizzeria/pastry SaaS. "
    "Translate each Italian UI string into Modern Standard Arabic (ar) and Turkish (tr). "
    "Keep it natural, concise, same register (professional, no emoji added/removed). "
    "PRESERVE any placeholders like {name}, {n}, %s, emoji already present, and line breaks. "
    "Do NOT translate brand names (MikiLab, Sitor). "
    "Return ONLY a JSON array; item i = {\"i\": <index>, \"ar\": \"...\", \"tr\": \"...\"} for each input index. No prose."
)


async def translate_batch(items):
    # items: list of (idx, italian, english)
    lines = [f"[{i}] IT: {it}" + (f"  (EN: {en})" if en else "") for (i, it, en) in items]
    chat = LlmChat(api_key=KEY, session_id=f"tr-{items[0][0]}", system_message=SYS).with_model("anthropic", MODEL).with_params(max_tokens=8000)
    full = ""
    async for ev in chat.stream_message(UserMessage(text="Translate these UI strings:\n" + "\n".join(lines))):
        if isinstance(ev, TextDelta):
            full += ev.content
        elif isinstance(ev, StreamDone):
            break
    m = re.search(r"\[.*\]", full, re.S)
    if not m:
        raise ValueError("no json array")
    return json.loads(m.group(0))


async def main():
    data = json.load(open(PATH))
    todo = [k for k in data if not (data[k].get("ar") and data[k].get("tr"))]
    print(f"da tradurre: {len(todo)}", flush=True)
    keys = list(data.keys())
    done = 0
    for start in range(0, len(todo), BATCH):
        chunk = todo[start:start + BATCH]
        items = [(keys.index(k), k, data[k].get("en") or "") for k in chunk]
        # remap index to local position for robustness
        local = [(n, it, en) for n, (_, it, en) in enumerate(items)]
        try:
            res = await translate_batch(local)
        except Exception as e:
            print(f"batch {start} FAIL: {str(e)[:100]}", flush=True)
            continue
        by_i = {r["i"]: r for r in res if isinstance(r, dict) and "i" in r}
        for n, k in enumerate(chunk):
            r = by_i.get(n)
            if r and r.get("ar") and r.get("tr"):
                data[k]["ar"] = r["ar"].strip()
                data[k]["tr"] = r["tr"].strip()
                done += 1
        # salvataggio incrementale ogni batch
        json.dump(data, open(PATH, "w"), ensure_ascii=False, indent=0)
        print(f"progress {start + len(chunk)}/{len(todo)} · tradotte {done}", flush=True)
    # report finale
    miss = sum(1 for k in data if not (data[k].get("ar") and data[k].get("tr")))
    print(f"FATTO. tradotte {done}, mancanti residue {miss}", flush=True)


asyncio.run(main())
