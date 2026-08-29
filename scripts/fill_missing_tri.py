"""Estrae le stringhe italiane statiche (tri/tri3/mkTri/L/it:) dai componenti frontend,
trova quelle senza traduzione fa/fr in src/i18n/triTranslations.json, le traduce e le fonde.
"""
import asyncio, json, os, re, glob
from emergentintegrations.llm.chat import LlmChat, UserMessage
from dotenv import load_dotenv
load_dotenv("/app/backend/.env")

KEY = os.environ.get("EMERGENT_LLM_KEY")
TRI = "/app/frontend/src/i18n/triTranslations.json"
SRC_DIRS = ["/app/frontend/src/sections", "/app/frontend/src/components"]
BATCH = 25

PATTERNS = [
    re.compile(r'mkTri\(lang\)\(\s*"((?:[^"\\]|\\.)*)"'),
    re.compile(r'\btri3?\(\s*lang\s*,\s*"((?:[^"\\]|\\.)*)"'),
    re.compile(r'\btri\(\s*"((?:[^"\\]|\\.)*)"'),
    re.compile(r'\bL\(\s*"((?:[^"\\]|\\.)*)"'),
    re.compile(r'\bit:\s*"((?:[^"\\]|\\.)*)"'),
]
LETTER = re.compile(r"[A-Za-zÀ-ÿ]")

SYSTEM = (
    "You are a professional UI localization translator for MikiLab, an artisan baking web app "
    "(lievito madre/sourdough, biga, poolish, panettone, focaccia, pastry, professional bakery). "
    "Translate short Italian UI strings into French (fr) and Persian/Farsi (fa). "
    "Keep the SAME meaning and tone; preserve emojis, %, numbers, units (g, °C, min), line breaks and punctuation EXACTLY; "
    "do NOT translate brand/proper names or technical terms (MikiLab, Michele, Mohammadreza, Matera, Altamura, Brezel, "
    "Biga, Poolish, Lievito Madre, Kochstück, Sauerteig, LiCoLi). Persian must be fluent modern Farsi. "
    "Return ONLY strict JSON array, no markdown."
)


def unescape(s):
    return s.replace('\\"', '"').replace("\\n", "\n").replace("\\\\", "\\")


def extract():
    found = set()
    for d in SRC_DIRS:
        for fp in glob.glob(os.path.join(d, "**", "*.jsx"), recursive=True) + glob.glob(os.path.join(d, "**", "*.js"), recursive=True):
            txt = open(fp, encoding="utf-8").read()
            for pat in PATTERNS:
                for m in pat.findall(txt):
                    s = unescape(m).strip()
                    if len(s) >= 2 and LETTER.search(s):
                        found.add(s)
    return found


def extract_json(text):
    text = re.sub(r"^```(?:json)?", "", text.strip()).strip()
    text = re.sub(r"```$", "", text).strip()
    a, b = text.find("["), text.rfind("]")
    return json.loads(text[a:b + 1])


async def translate_batch(strings, idx):
    chat = LlmChat(api_key=KEY, session_id=f"fill-tri-{idx}", system_message=SYSTEM).with_model("anthropic", "claude-sonnet-4-6").with_params(max_tokens=4000)
    payload = json.dumps(strings, ensure_ascii=False)
    msg = (f'Translate these {len(strings)} Italian UI strings. Return a JSON array of objects '
           f'{{"i":<index>,"fr":<french>,"fa":<farsi>}} in the SAME order and count. Input:\n{payload}')
    resp = await chat.send_message(UserMessage(text=msg))
    return extract_json(resp)


async def main():
    tri = json.load(open(TRI))
    found = extract()
    missing = [s for s in found if s not in tri or not (tri.get(s, {}).get("fa"))]
    print(f"strings trovate={len(found)} da tradurre(mancano fa)={len(missing)}", flush=True)
    if not missing:
        print("Niente da fare.")
        return
    batches = [missing[i:i + BATCH] for i in range(0, len(missing), BATCH)]
    for bi, batch in enumerate(batches):
        for attempt in range(3):
            try:
                data = await translate_batch(batch, f"{bi}-{attempt}")
                for obj in data:
                    i = obj.get("i")
                    if isinstance(i, int) and 0 <= i < len(batch):
                        tri[batch[i]] = {"fr": obj.get("fr", ""), "fa": obj.get("fa", "")}
                json.dump(tri, open(TRI, "w"), ensure_ascii=False, indent=0)
                print(f"batch {bi+1}/{len(batches)} ok (+{len(batch)}) totale={len(tri)}", flush=True)
                break
            except Exception as e:
                print(f"batch {bi+1} tentativo {attempt+1} FALLITO: {e}", flush=True)
                await asyncio.sleep(2)
    print(f"FATTO. voci totali={len(tri)}", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
