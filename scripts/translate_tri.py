import asyncio, json, os, re, sys
from emergentintegrations.llm.chat import LlmChat, UserMessage

KEY = "sk-emergent-5F5F5E00e2dE0A1197"
SRC = "/app/scripts/tri_strings.json"
OUT = "/app/scripts/tri_translations.json"
BATCH = 30

SYSTEM = (
    "You are a professional UI localization translator for MikiLab, an artisan home-baking web app "
    "(sourdough/lievito madre, biga, poolish, panettone, focaccia, pizza, pastry). "
    "Translate short Italian UI strings into French (fr) and Persian/Farsi (fa). "
    "Rules: keep the SAME meaning and tone; preserve emojis, %, numbers, units (g, °C, min), line breaks (\\n), "
    "and punctuation exactly; do NOT translate brand/proper names (MikiLab, Mikilab, Michele, Mohammadreza, "
    "Matera, Altamura, Brezel, Biga, Poolish); use natural, concise wording suitable for buttons/labels. "
    "Persian must be fluent modern Farsi. Return ONLY strict JSON, no markdown, no commentary."
)

def load_done():
    if os.path.exists(OUT):
        try:
            return json.load(open(OUT))
        except Exception:
            return {}
    return {}

def extract_json(text):
    text = text.strip()
    text = re.sub(r"^```(?:json)?", "", text).strip()
    text = re.sub(r"```$", "", text).strip()
    # find first [ ... ] block
    start = text.find("[")
    end = text.rfind("]")
    if start != -1 and end != -1:
        text = text[start:end+1]
    return json.loads(text)

async def translate_batch(strings, idx):
    chat = LlmChat(api_key=KEY, session_id=f"tri-trans-{idx}", system_message=SYSTEM).with_model("anthropic", "claude-sonnet-4-6")
    payload = json.dumps(strings, ensure_ascii=False)
    msg = (
        f"Translate these {len(strings)} Italian UI strings. "
        f"Return a JSON array of objects, each {{\"i\": <index>, \"fr\": <french>, \"fa\": <farsi>}}, "
        f"in the SAME order and same count ({len(strings)} items). Input array:\n{payload}"
    )
    resp = await chat.send_message(UserMessage(text=msg))
    data = extract_json(resp)
    return data

async def main():
    strings = json.load(open(SRC))
    done = load_done()  # maps italian -> {fr, fa}
    todo = [s for s in strings if s not in done]
    print(f"total={len(strings)} done={len(done)} todo={len(todo)}", flush=True)
    batches = [todo[i:i+BATCH] for i in range(0, len(todo), BATCH)]
    for bi, batch in enumerate(batches):
        for attempt in range(3):
            try:
                data = await translate_batch(batch, f"{bi}-{attempt}")
                if not isinstance(data, list):
                    raise ValueError("not a list")
                for obj in data:
                    i = obj.get("i")
                    if i is None or i < 0 or i >= len(batch):
                        continue
                    done[batch[i]] = {"fr": obj.get("fr", ""), "fa": obj.get("fa", "")}
                # verify all covered; fill missing by re-mapping order if needed
                missing = [s for s in batch if s not in done]
                if missing and len(data) == len(batch):
                    for k, s in enumerate(batch):
                        if s not in done:
                            done[s] = {"fr": data[k].get("fr", ""), "fa": data[k].get("fa", "")}
                json.dump(done, open(OUT, "w"), ensure_ascii=False)
                print(f"batch {bi+1}/{len(batches)} ok ({len(batch)}), total done={len(done)}", flush=True)
                break
            except Exception as e:
                print(f"batch {bi+1} attempt {attempt+1} FAILED: {e}", flush=True)
                await asyncio.sleep(2)
        else:
            print(f"batch {bi+1} PERMANENTLY FAILED", flush=True)
    # final coverage
    missing = [s for s in strings if s not in done]
    print(f"DONE. covered={len(done)}/{len(strings)} missing={len(missing)}", flush=True)
    if missing:
        json.dump(missing, open("/app/scripts/tri_missing.json", "w"), ensure_ascii=False)

if __name__ == "__main__":
    asyncio.run(main())
