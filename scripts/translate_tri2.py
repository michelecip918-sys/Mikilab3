import asyncio, json, os, re
from emergentintegrations.llm.chat import LlmChat, UserMessage

KEY = "sk-emergent-5F5F5E00e2dE0A1197"
SRC = "/app/scripts/tri_strings.json"
OUT = "/app/scripts/tri_translations.json"
BATCH = 18

SYSTEM = (
    "You are a professional UI localization translator for MikiLab, an artisan home-baking web app "
    "(sourdough/lievito madre, biga, poolish, panettone, focaccia, pizza, pastry). "
    "Translate short Italian UI strings into French (fr) and Persian/Farsi (fa). "
    "Rules: keep the SAME meaning and tone; preserve emojis, %, numbers, units (g, C, min), line breaks (\\n), "
    "and punctuation exactly; do NOT translate brand/proper names (MikiLab, Mikilab, Michele, Mohammadreza, "
    "Matera, Altamura, Brezel, Biga, Poolish); natural concise wording for buttons/labels; fluent modern Farsi. "
    "OUTPUT: return ONE single JSON array only. No markdown fences, no explanations, no newline-delimited objects."
)

def extract_json(text):
    text = text.strip()
    text = re.sub(r"^```(?:json)?", "", text).strip()
    text = re.sub(r"```$", "", text).strip()
    try:
        d = json.loads(text)
        if isinstance(d, list): return d
        if isinstance(d, dict):
            for v in d.values():
                if isinstance(v, list): return v
    except Exception:
        pass
    # bracket-match outermost array
    start = text.find("[")
    if start != -1:
        depth = 0
        for j in range(start, len(text)):
            if text[j] == "[": depth += 1
            elif text[j] == "]":
                depth -= 1
                if depth == 0:
                    try:
                        return json.loads(text[start:j+1])
                    except Exception:
                        break
    # JSONL fallback: parse each brace object
    objs = []
    for m in re.finditer(r"\{[^{}]*\}", text):
        try:
            objs.append(json.loads(m.group(0)))
        except Exception:
            pass
    if objs: return objs
    raise ValueError("unparseable")

async def translate_batch(strings, idx):
    chat = LlmChat(api_key=KEY, session_id=f"tri2-{idx}", system_message=SYSTEM).with_model("anthropic", "claude-sonnet-4-6")
    payload = json.dumps(strings, ensure_ascii=False)
    msg = (
        f"Translate these {len(strings)} Italian UI strings. Return a SINGLE JSON array of exactly {len(strings)} "
        f"objects, each {{\"i\": <index 0-based>, \"fr\": <french>, \"fa\": <farsi>}}, in the SAME order. "
        f"Input array:\n{payload}"
    )
    resp = await chat.send_message(UserMessage(text=msg))
    return extract_json(resp)

async def main():
    strings = json.load(open(SRC))
    done = json.load(open(OUT)) if os.path.exists(OUT) else {}
    todo = [s for s in strings if s not in done]
    print(f"total={len(strings)} done={len(done)} todo={len(todo)}", flush=True)
    batches = [todo[i:i+BATCH] for i in range(0, len(todo), BATCH)]
    for bi, batch in enumerate(batches):
        ok = False
        for attempt in range(4):
            try:
                data = await translate_batch(batch, f"{bi}-{attempt}")
                if not isinstance(data, list):
                    raise ValueError("not list")
                # map by index if present, else by order
                by_i = {}
                for obj in data:
                    if isinstance(obj, dict) and "i" in obj:
                        by_i[obj["i"]] = obj
                for k, s in enumerate(batch):
                    obj = by_i.get(k)
                    if obj is None and k < len(data) and isinstance(data[k], dict):
                        obj = data[k]
                    if obj:
                        done[s] = {"fr": obj.get("fr", ""), "fa": obj.get("fa", "")}
                json.dump(done, open(OUT, "w"), ensure_ascii=False)
                miss = [s for s in batch if s not in done]
                print(f"batch {bi+1}/{len(batches)} ok, missing_in_batch={len(miss)}, total={len(done)}", flush=True)
                ok = True
                break
            except Exception as e:
                print(f"batch {bi+1} attempt {attempt+1} FAIL: {e}", flush=True)
                await asyncio.sleep(2)
        if not ok:
            print(f"batch {bi+1} PERMANENTLY FAILED", flush=True)
    missing = [s for s in strings if s not in done]
    print(f"DONE covered={len(done)}/{len(strings)} missing={len(missing)}", flush=True)
    json.dump(missing, open("/app/scripts/tri_missing.json", "w"), ensure_ascii=False)

if __name__ == "__main__":
    asyncio.run(main())
