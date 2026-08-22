import asyncio, json, os
from dotenv import load_dotenv
load_dotenv("/app/backend/.env")
from emergentintegrations.llm.chat import LlmChat, UserMessage

KEY = os.environ["EMERGENT_LLM_KEY"]
SEED = "/app/backend/mikilab_seed_data.json"
FIELDS = ["name", "real_name", "flour_type", "notes", "procedure"]

SYSTEM = ("You are a professional bakery translator. Translate Italian bakery text to natural, "
          "professional English used by bakers. Keep numbers, %, °C, times and proper names. "
          "Return ONLY the translated text, no quotes, no notes.")

async def tr(chat, text):
    text = (text or "").strip()
    if not text:
        return ""
    resp = await chat.send_message(UserMessage(text=f"Translate to English:\n\n{text}"))
    return (resp or "").strip()

async def main():
    recs = json.load(open(SEED))
    total = len(recs)
    for i, r in enumerate(recs):
        chat = LlmChat(api_key=KEY, session_id=f"tr-{i}", system_message=SYSTEM).with_model("anthropic", "claude-sonnet-4-6")
        for f in FIELDS:
            if f in r and r.get(f) and not r.get(f + "_en"):
                try:
                    r[f + "_en"] = await tr(chat, r[f])
                except Exception as e:
                    print(f"  ! r{i} {f}: {e}", flush=True)
        print(f"[{i+1}/{total}] {r.get('name')} -> {r.get('name_en')}", flush=True)
        # salvataggio incrementale
        json.dump(recs, open(SEED, "w"), ensure_ascii=False, indent=2)
    print("DONE", flush=True)

asyncio.run(main())
