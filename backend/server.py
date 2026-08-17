from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
def now_iso():
    return datetime.now(timezone.utc).isoformat()


class Recipe(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    collection_name: str = "mikilab"  # "mikilab" | "personal"
    name: str
    flour_type: Optional[str] = ""
    hydration_percent: Optional[float] = None
    flour_grams: Optional[float] = None
    water_grams: Optional[float] = None
    sourdough_grams: Optional[float] = None
    salt_grams: Optional[float] = None
    bulk_fermentation_hours: Optional[float] = None
    proofing_hours: Optional[float] = None
    notes: Optional[str] = ""
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class RecipeCreate(BaseModel):
    collection_name: str = "mikilab"
    name: str
    flour_type: Optional[str] = ""
    hydration_percent: Optional[float] = None
    flour_grams: Optional[float] = None
    water_grams: Optional[float] = None
    sourdough_grams: Optional[float] = None
    salt_grams: Optional[float] = None
    bulk_fermentation_hours: Optional[float] = None
    proofing_hours: Optional[float] = None
    notes: Optional[str] = ""


class RecipeUpdate(BaseModel):
    name: Optional[str] = None
    flour_type: Optional[str] = None
    hydration_percent: Optional[float] = None
    flour_grams: Optional[float] = None
    water_grams: Optional[float] = None
    sourdough_grams: Optional[float] = None
    salt_grams: Optional[float] = None
    bulk_fermentation_hours: Optional[float] = None
    proofing_hours: Optional[float] = None
    notes: Optional[str] = None


class OvenProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    preheat_temp: Optional[float] = None
    phase1_temp: Optional[float] = None
    phase1_minutes: Optional[float] = None
    phase2_temp: Optional[float] = None
    phase2_minutes: Optional[float] = None
    phase3_temp: Optional[float] = None
    phase3_minutes: Optional[float] = None
    notes: Optional[str] = ""
    created_at: str = Field(default_factory=now_iso)


class OvenProfileCreate(BaseModel):
    name: str
    preheat_temp: Optional[float] = None
    phase1_temp: Optional[float] = None
    phase1_minutes: Optional[float] = None
    phase2_temp: Optional[float] = None
    phase2_minutes: Optional[float] = None
    phase3_temp: Optional[float] = None
    phase3_minutes: Optional[float] = None
    notes: Optional[str] = ""


class ChatRequest(BaseModel):
    session_id: str
    message: str


# ---------------------------------------------------------------------------
# Seed data for Mikilab
# ---------------------------------------------------------------------------
MIKILAB_SEED = [
    {
        "name": "Pane di Altamura DOP",
        "flour_type": "Semola Rimacinata di Grano Duro",
        "hydration_percent": 75,
        "flour_grams": 1000, "water_grams": 750, "sourdough_grams": 200, "salt_grams": 20,
        "bulk_fermentation_hours": 4, "proofing_hours": 2,
        "notes": "Crosta spessa, mollica fitta e dorata. Tipica lavorazione pugliese con farina rimacinata.",
    },
    {
        "name": "Ciabatta ad Alta Idratazione",
        "flour_type": "Farina Tipo 0 W350",
        "hydration_percent": 82,
        "flour_grams": 1000, "water_grams": 820, "sourdough_grams": 150, "salt_grams": 22,
        "bulk_fermentation_hours": 5, "proofing_hours": 1.5,
        "notes": "Alveolatura aperta, crosta croccante. Richiede pieghe in ciotola ogni 30 minuti.",
    },
    {
        "name": "Pane Rustico al Farro e Miele",
        "flour_type": "70% Farina Tipo 1 + 30% Farro Integrale",
        "hydration_percent": 70,
        "flour_grams": 1000, "water_grams": 700, "sourdough_grams": 180, "salt_grams": 18,
        "bulk_fermentation_hours": 4, "proofing_hours": 2,
        "notes": "Aroma nocciolato, miele di acacia per favorire la doratura della crosta.",
    },
]


async def seed_mikilab_if_empty():
    count = await db.recipes.count_documents({"collection_name": "mikilab"})
    if count == 0:
        for item in MIKILAB_SEED:
            recipe = Recipe(collection_name="mikilab", **item)
            await db.recipes.insert_one(recipe.model_dump())


# ---------------------------------------------------------------------------
# Recipe endpoints
# ---------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"message": "Mikilab API attiva"}


@api_router.get("/recipes", response_model=List[Recipe])
async def get_recipes(collection_name: str = "mikilab"):
    if collection_name == "mikilab":
        await seed_mikilab_if_empty()
    docs = await db.recipes.find({"collection_name": collection_name}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    return docs


@api_router.post("/recipes", response_model=Recipe)
async def create_recipe(payload: RecipeCreate):
    recipe = Recipe(**payload.model_dump())
    await db.recipes.insert_one(recipe.model_dump())
    return recipe


@api_router.put("/recipes/{recipe_id}", response_model=Recipe)
async def update_recipe(recipe_id: str, payload: RecipeUpdate):
    existing = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Ricetta non trovata")
    # Full-state save from the recipe dialog: apply all provided fields,
    # including explicit nulls (so a cleared field is actually cleared).
    updates = payload.model_dump()
    updates["updated_at"] = now_iso()
    await db.recipes.update_one({"id": recipe_id}, {"$set": updates})
    merged = {**existing, **updates}
    return merged


@api_router.delete("/recipes/{recipe_id}")
async def delete_recipe(recipe_id: str):
    res = await db.recipes.delete_one({"id": recipe_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ricetta non trovata")
    return {"success": True}


# ---------------------------------------------------------------------------
# Oven profile endpoints
# ---------------------------------------------------------------------------
@api_router.get("/oven-profiles", response_model=List[OvenProfile])
async def get_oven_profiles():
    docs = await db.oven_profiles.find({}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    return docs


@api_router.post("/oven-profiles", response_model=OvenProfile)
async def create_oven_profile(payload: OvenProfileCreate):
    profile = OvenProfile(**payload.model_dump())
    await db.oven_profiles.insert_one(profile.model_dump())
    return profile


@api_router.put("/oven-profiles/{profile_id}", response_model=OvenProfile)
async def update_oven_profile(profile_id: str, payload: OvenProfileCreate):
    existing = await db.oven_profiles.find_one({"id": profile_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Profilo non trovato")
    updates = payload.model_dump()
    await db.oven_profiles.update_one({"id": profile_id}, {"$set": updates})
    return {**existing, **updates}


@api_router.delete("/oven-profiles/{profile_id}")
async def delete_oven_profile(profile_id: str):
    res = await db.oven_profiles.delete_one({"id": profile_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Profilo non trovato")
    return {"success": True}


# ---------------------------------------------------------------------------
# Maestro AI chat (Claude Sonnet 4.6, streaming)
# ---------------------------------------------------------------------------
MAESTRO_SYSTEM = (
    "Sei 'Il Maestro del Pane', un mastro panettiere artigiano esperto di panificazione "
    "a lievitazione naturale, con profonda conoscenza sia della tradizione italiana sia "
    "delle farine e delle abitudini tedesche (zona Stoccarda, Baden-Württemberg). "
    "Rispondi SEMPRE in italiano, in modo caldo, chiaro e pratico, come un maestro che "
    "insegna a un allievo. Dai consigli concreti su idratazione, lievito madre, farine "
    "(inclusa la corrispondenza tra tipi italiani 00/0/1/2 e tedeschi Type 405/550/812/1050, "
    "e Dinkelmehl per il farro), temperature, tempi, cottura e vapore. "
    "Quando utile, cita fonti locali di Stoccarda (mulini, mercati bio, grani antichi). "
    "Il motto della sezione è: 'Chiedi e ti sarà dato'. Sii incoraggiante e mai prolisso."
)


async def maestro_stream(session_id: str, message: str):
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=MAESTRO_SYSTEM,
    ).with_model("anthropic", "claude-sonnet-4-6")

    # Load prior history for this session into the chat for continuity
    prior = await db.chat_messages.find(
        {"session_id": session_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(200)

    # Persist user message
    await db.chat_messages.insert_one({
        "id": str(uuid.uuid4()), "session_id": session_id,
        "role": "user", "content": message, "created_at": now_iso(),
    })

    # Reconstruct context by prefixing prior turns into the current message is not ideal;
    # instead we rely on a fresh chat and feed a compact context of prior turns.
    context_prefix = ""
    if prior:
        lines = []
        for m in prior[-10:]:
            who = "Utente" if m["role"] == "user" else "Maestro"
            lines.append(f"{who}: {m['content']}")
        context_prefix = "Conversazione precedente:\n" + "\n".join(lines) + "\n\nNuova domanda:\n"

    full_text = ""
    user_msg = UserMessage(text=context_prefix + message)
    async for event in chat.stream_message(user_msg):
        if isinstance(event, TextDelta):
            full_text += event.content
            yield f"data: {event.content}\n\n"
        elif isinstance(event, StreamDone):
            break

    await db.chat_messages.insert_one({
        "id": str(uuid.uuid4()), "session_id": session_id,
        "role": "assistant", "content": full_text, "created_at": now_iso(),
    })
    yield "data: [DONE]\n\n"


@api_router.post("/maestro/chat")
async def maestro_chat(payload: ChatRequest):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key non configurata")
    return StreamingResponse(
        maestro_stream(payload.session_id, payload.message),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@api_router.get("/maestro/history/{session_id}")
async def maestro_history(session_id: str):
    docs = await db.chat_messages.find(
        {"session_id": session_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    return docs


# ---------------------------------------------------------------------------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
