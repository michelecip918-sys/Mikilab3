import asyncio, json, re
from emergentintegrations.llm.chat import LlmChat, UserMessage

KEY = "sk-emergent-5F5F5E00e2dE0A1197"
SRC = "/app/frontend/src/sections/Glossario.jsx"
OUT = "/app/frontend/src/i18n/glossary_i18n.json"

code = open(SRC).read()
# estrai coppie { t: "...", d: "..." }
pairs = re.findall(r'\{\s*t:\s*"((?:[^"\\]|\\.)*)",\s*d:\s*"((?:[^"\\]|\\.)*)"\s*\}', code)
terms = [{"t": t.encode().decode('unicode_escape') if '\\' in t else t, "d": d.encode().decode('unicode_escape') if '\\' in d else d} for t, d in pairs]
print("terms found:", len(terms))

SYSTEM = (
    "You are a professional baking-glossary translator for MikiLab. Translate Italian bakery glossary "
    "entries (term + definition) into German (de), English (en), Spanish (es), French (fr) and Persian/Farsi (fa). "
    "Keep technical accuracy; keep proper terms like Biga, Poolish, Li.Co.Li., Kochstück/Tangzhong, W recognisable; "
    "fluent modern Farsi. Return ONLY strict JSON."
)

def extract_json(text):
    text = text.strip()
    text = re.sub(r"^```(?:json)?", "", text).strip()
    text = re.sub(r"```$", "", text).strip()
    s = text.find("["); e = text.rfind("]")
    return json.loads(text[s:e+1])

async def run_batch(batch, idx):
    chat = LlmChat(api_key=KEY, session_id=f"gloss-{idx}", system_message=SYSTEM).with_model("anthropic", "claude-sonnet-4-6")
    payload = json.dumps(batch, ensure_ascii=False)
    msg = (f"Translate these {len(batch)} glossary entries. Return a JSON array (same order, same count) of objects: "
           f'{{"i":<idx>,"t":{{"de":..,"en":..,"es":..,"fr":..,"fa":..}},"d":{{"de":..,"en":..,"es":..,"fr":..,"fa":..}}}}. '
           f"Input:\n{payload}")
    resp = await chat.send_message(UserMessage(text=msg))
    return extract_json(resp)

async def main():
    out = {}
    B = 10
    batches = [terms[i:i+B] for i in range(0, len(terms), B)]
    for bi, batch in enumerate(batches):
        for attempt in range(4):
            try:
                data = await run_batch(batch, f"{bi}-{attempt}")
                for k, entry in enumerate(batch):
                    obj = next((o for o in data if o.get("i") == k), None) or (data[k] if k < len(data) else None)
                    if obj:
                        out[entry["t"]] = {"t": obj.get("t", {}), "d": obj.get("d", {})}
                print(f"batch {bi+1}/{len(batches)} ok, total={len(out)}", flush=True)
                break
            except Exception as ex:
                print(f"batch {bi+1} attempt {attempt+1} fail: {ex}", flush=True)
                await asyncio.sleep(2)
    json.dump(out, open(OUT, "w"), ensure_ascii=False)
    print("DONE, entries:", len(out))

if __name__ == "__main__":
    asyncio.run(main())
