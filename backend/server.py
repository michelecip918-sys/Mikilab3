from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Depends, Request
from fastapi.responses import StreamingResponse, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import logging
import re
import asyncio
import requests
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
import bcrypt
import secrets
from datetime import datetime, timezone, timedelta

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone, ImageContent
from elevenlabs import ElevenLabs, VoiceSettings

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# ---------------------------------------------------------------------------
# Object Storage (archivio immagini dedicato)
# ---------------------------------------------------------------------------
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
APP_NAME = "mikilab"
MIME_TYPES = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "gif": "image/gif", "webp": "image/webp",
}
_storage_key = None


def init_storage(force: bool = False):
    global _storage_key
    if _storage_key and not force:
        return _storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_LLM_KEY}, timeout=30)
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    return _storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120,
    )
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data, timeout=120,
        )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

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
    preferment_type: Optional[str] = None
    mix_minutes: Optional[float] = None
    rest_minutes: Optional[float] = None
    bake_temp: Optional[float] = None
    bake_minutes: Optional[float] = None
    oven_type: Optional[str] = None
    method_type: Optional[str] = None
    image_url: Optional[str] = None
    origin: Optional[str] = None
    dough_category: Optional[str] = None
    water_temp_c: Optional[float] = None
    notes: Optional[str] = ""
    procedure: Optional[str] = ""
    name_de: Optional[str] = None
    flour_type_de: Optional[str] = None
    notes_de: Optional[str] = None
    procedure_de: Optional[str] = None
    name_en: Optional[str] = None
    flour_type_en: Optional[str] = None
    notes_en: Optional[str] = None
    procedure_en: Optional[str] = None
    name_es: Optional[str] = None
    flour_type_es: Optional[str] = None
    notes_es: Optional[str] = None
    procedure_es: Optional[str] = None
    real_name: Optional[str] = None
    real_name_de: Optional[str] = None
    real_name_en: Optional[str] = None
    menu_category: Optional[str] = None  # basi | pane | panini | panettoni
    extra_ingredients: Optional[List[dict]] = None
    work_phases: Optional[List[dict]] = None
    biga: Optional[dict] = None  # Vorteig/Biga: {flour_g, water_g, yeast_g, hours, hours_de, hours_en}
    costing: Optional[dict] = None
    label: Optional[dict] = None  # Etichetta UE: valori nutrizionali per 100g + allergeni + ingredienti + peso
    locked: Optional[bool] = None  # True = versione "assaggio" (metodo bloccato per non-PRO)
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
    preferment_type: Optional[str] = None
    mix_minutes: Optional[float] = None
    rest_minutes: Optional[float] = None
    bake_temp: Optional[float] = None
    bake_minutes: Optional[float] = None
    oven_type: Optional[str] = None
    method_type: Optional[str] = None
    image_url: Optional[str] = None
    origin: Optional[str] = None
    dough_category: Optional[str] = None
    water_temp_c: Optional[float] = None
    notes: Optional[str] = ""
    procedure: Optional[str] = ""
    name_de: Optional[str] = None
    flour_type_de: Optional[str] = None
    notes_de: Optional[str] = None
    procedure_de: Optional[str] = None
    name_en: Optional[str] = None
    flour_type_en: Optional[str] = None
    notes_en: Optional[str] = None
    procedure_en: Optional[str] = None
    name_es: Optional[str] = None
    flour_type_es: Optional[str] = None
    notes_es: Optional[str] = None
    procedure_es: Optional[str] = None
    real_name: Optional[str] = None
    real_name_de: Optional[str] = None
    real_name_en: Optional[str] = None
    menu_category: Optional[str] = None
    extra_ingredients: Optional[List[dict]] = None
    work_phases: Optional[List[dict]] = None
    costing: Optional[dict] = None
    label: Optional[dict] = None


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
    preferment_type: Optional[str] = None
    mix_minutes: Optional[float] = None
    rest_minutes: Optional[float] = None
    bake_temp: Optional[float] = None
    bake_minutes: Optional[float] = None
    oven_type: Optional[str] = None
    method_type: Optional[str] = None
    image_url: Optional[str] = None
    origin: Optional[str] = None
    dough_category: Optional[str] = None
    water_temp_c: Optional[float] = None
    notes: Optional[str] = None
    procedure: Optional[str] = None
    real_name: Optional[str] = None
    real_name_de: Optional[str] = None
    menu_category: Optional[str] = None
    extra_ingredients: Optional[List[dict]] = None
    work_phases: Optional[List[dict]] = None
    costing: Optional[dict] = None
    label: Optional[dict] = None


class OvenProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    oven_type: Optional[str] = "statico"  # "statico" | "ventilato"
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
    oven_type: Optional[str] = "statico"
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
    lang: str = "it"
    machines: Optional[List[str]] = None


class VisionRequest(BaseModel):
    mode: str  # "difetti" | "ingredienti"
    image_base64: str
    lang: str = "it"


class LabConfig(BaseModel):
    mixers: List[dict] = []          # [{name, capacity_kg, type}]
    cells: List[dict] = []           # [{name, type: frigo|freezer|lievitazione, temp_c, contents}]
    staff: Optional[int] = None
    standard_temp_c: Optional[float] = 26.0
    updated_at: str = Field(default_factory=now_iso)


class CapoPlanRequest(BaseModel):
    items: List[dict] = []           # [{recipe_id, name, quantity, unit, day}]
    mixers: List[dict] = []
    cells: List[dict] = []
    staff: Optional[int] = None
    start_time: Optional[str] = None
    lab_temp_c: Optional[float] = None
    standard_temp_c: Optional[float] = 26.0
    notes: Optional[str] = ""
    mode: str = "pro"                # "pro" (laboratorio) | "home" (pane a casa)
    phase: str = "full"              # "full" | "weekly" | "daily" (per evitare troncamenti)
    use_weekly: bool = False         # se True, unisce anche il Piano settimanale salvato
    freezer_stock: List[dict] = []   # [{name, qty, min_qty}] giacenze freezer attuali
    preferment_choice: Optional[str] = None  # "solido" | "licoli" | "poolish" | "lievito_birra"
    active_modules: Optional[List[str]] = None  # moduli opzionali attivi; None = tutti attivi (retrocompat)
    machines: Optional[List[str]] = None  # macchinari attivi nel laboratorio (Parco Macchine)
    lang: str = "it"


class PhaseItem(BaseModel):
    name: str
    hours: float = 0


class ProductionPlan(BaseModel):
    bake_time: str
    phases: List[PhaseItem]
    updated_at: str = Field(default_factory=now_iso)


class Announcement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    details: Optional[str] = ""
    region: Optional[str] = "germania"
    created_at: str = Field(default_factory=now_iso)


class AnnouncementCreate(BaseModel):
    title: str
    details: Optional[str] = ""
    region: Optional[str] = "germania"


class WeeklyItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    day: str  # "lun","mar","mer","gio","ven","sab","dom"
    recipe_id: str
    recipe_name: str
    pieces: float = 1
    grams_per_piece: float = 100
    to_proof: Optional[float] = None    # pezzi in cella lievitazione (per oggi)
    to_fridge: Optional[float] = None   # pezzi in frigo (per domani)
    to_freezer: Optional[float] = None  # pezzi in freezer (il resto)
    sale_point: Optional[str] = None    # destinazione: punto vendita (nome)


class WeeklyPlan(BaseModel):
    items: List[WeeklyItem] = []
    updated_at: str = Field(default_factory=now_iso)


class CapoLastPlan(BaseModel):
    """Ultimo Piano di Produzione IA generato: testo + stato del form per il ripristino."""
    plan_text: str = ""
    state: dict = {}
    saved_at: str = Field(default_factory=now_iso)


# ---------------------------------------------------------------------------
# Seed data for Mikilab (insert-only, non destructive)
# ---------------------------------------------------------------------------
SEED_FILE = ROOT_DIR / "mikilab_seed_data.json"
SEED_VERSION = "2026-06-v55-speciali-colorate"  # bump quando cambia mikilab_seed_data.json
# Vecchie schede da rimuovere alla sincronizzazione (solo se non modificate a mano).
SEED_RETIRED_NAMES = [
    "Kochstück",
    "Miglioratore Naturale al Malto", "Miglioratore Naturale", "Miglioratore al Malto", "Bretzel del Maestro",
    "Lievito Madre / Licoli (Liko)",
    "Panettone Mikilab",
    "Panettone Mikilab — Amarena e Cioccolato", "Panettone Mikilab — Arancia e Cioccolato Fondente",
    "Panettone Mikilab — Caffè e Nocciola", "Panettone Mikilab — Cioccolato e Noci",
    "Panettone Mikilab — Fichi e Mandorle", "Panettone Mikilab — Frutti di Bosco",
    "Panettone Mikilab — Marron Glacé (Castagne)", "Panettone Mikilab — Pere e Cioccolato",
    "Panettone Mikilab — Pistacchio e Cioccolato Bianco", "Panettone Mikilab — Uvetta e Canditi (Classico)",
    "Panettone Mikilab — Verde Canapa",
]
LEGACY_STALE_NAMES = ["Ciabatta ad Alta Idratazione", "Pane Rustico al Farro e Miele"]


def _load_mikilab_seed():
    try:
        with open(SEED_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logging.getLogger(__name__).error(f"Impossibile leggere il seed Mikilab: {e}")
        return []


async def seed_mikilab_if_empty(force: bool = False):
    """Sincronizza il ricettario Mikilab (upsert per nome) quando cambia la versione del seed.
    Non cancella le ricette aggiunte dall'utente; rimuove solo le vecchie generiche note."""
    meta = await db.app_meta.find_one({"_key": "mikilab_meta"}, {"_id": 0})
    if not force and meta and meta.get("seed_version") == SEED_VERSION:
        return await db.recipes.count_documents({"collection_name": "mikilab"})
    items = _load_mikilab_seed()
    if not items:
        return await db.recipes.count_documents({"collection_name": "mikilab"})
    for item in items:
        item = dict(item)
        item.pop("collection_name", None)
        doc = Recipe(collection_name="mikilab", **item).model_dump()
        seed_id = doc.pop("id", None)
        seed_created = doc.pop("created_at", now_iso())
        existing = await db.recipes.find_one(
            {"collection_name": "mikilab", "name": doc["name"]}, {"_id": 0, "user_edited": 1}
        )
        # Non sovrascrivere MAI le ricette che Michele ha modificato a mano.
        if existing and existing.get("user_edited"):
            continue
        doc["updated_at"] = now_iso()
        doc["hidden"] = False
        await db.recipes.update_one(
            {"collection_name": "mikilab", "name": doc["name"]},
            {"$set": doc, "$setOnInsert": {"id": seed_id, "created_at": seed_created}},
            upsert=True,
        )
    await db.app_meta.update_one(
        {"_key": "mikilab_meta"},
        {"$set": {"_key": "mikilab_meta", "seed_version": SEED_VERSION, "synced_at": now_iso()}},
        upsert=True,
    )
    # Le vecchie schede ritirate vengono SEMPRE nascoste (sono nomi legacy noti, da eliminare
    # anche se erano state modificate a mano): così i doppioni con i nomi nuovi spariscono.
    for old_name in SEED_RETIRED_NAMES:
        await db.recipes.update_one({"collection_name": "mikilab", "name": old_name},
            {"$set": {"hidden": True, "updated_at": now_iso()}})
    # Dedup: per ogni nome del seed tieni UNA sola scheda visibile; i doppioni vengono NASCOSTI (non cancellati).
    seed_names = {dict(it).get("name") for it in items}
    for nm in seed_names:
        docs = []
        async for dd in db.recipes.find({"collection_name": "mikilab", "name": nm}, {"_id": 1, "user_edited": 1}):
            docs.append(dd)
        if len(docs) <= 1:
            continue
        keep = next((x for x in docs if x.get("user_edited")), docs[0])
        for x in docs:
            if x["_id"] != keep["_id"]:
                await db.recipes.update_one({"_id": x["_id"]}, {"$set": {"hidden": True}})
    return await db.recipes.count_documents({"collection_name": "mikilab", "hidden": {"$ne": True}})


# ---------------------------------------------------------------------------
# Recipe endpoints
# ---------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"message": "Mikilab API attiva"}


EMERGENT_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
SESSION_DAYS = 7
# Email PROPRIETARIO: sempre admin (accesso completo a tutto), a prescindere dall'ordine di registrazione.
OWNER_EMAILS = {"michelecip918@gmail.com", "admin@mikilab.de"}


class RegisterReq(BaseModel):
    email: str
    password: str
    name: Optional[str] = ""
    origin_url: Optional[str] = None
    lang: Optional[str] = "it"


class LoginReq(BaseModel):
    email: str
    password: str


class ResendVerifyReq(BaseModel):
    email: str
    origin_url: Optional[str] = None
    lang: Optional[str] = "it"


class GoogleReq(BaseModel):
    session_id: str


def _validate_password(pw: str, lang: str = "it") -> None:
    """Password forte: min 8 caratteri, almeno una lettera e un numero."""
    import re as _re
    msgs = {
        "it": "La password deve avere almeno 8 caratteri, con lettere e numeri.",
        "en": "Password must be at least 8 characters, with letters and numbers.",
        "de": "Das Passwort muss mindestens 8 Zeichen mit Buchstaben und Zahlen haben.",
        "es": "La contraseña debe tener al menos 8 caracteres, con letras y números.",
    }
    ok = pw and len(pw) >= 8 and _re.search(r"[A-Za-z]", pw) and _re.search(r"\d", pw)
    if not ok:
        raise HTTPException(status_code=400, detail=msgs.get(lang, msgs["it"]))


def _hash_pw(pw):
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def _check_pw(pw, h):
    try:
        return bcrypt.checkpw(pw.encode(), h.encode())
    except Exception:
        return False


def _client_ip(request) -> str:
    return (request.headers.get("x-forwarded-for", "").split(",")[0].strip()
            or (request.client.host if request.client else "?"))


async def _rate_limit(scope: str, key: str, max_count: int, window_seconds: int) -> bool:
    """Rate limit basato su Mongo (finestra fissa). Ritorna False se il limite è superato."""
    if not key or key == "?":
        return True
    ident = f"{scope}:{key}"
    now = datetime.now(timezone.utc)
    rec = await db.rate_limits.find_one({"_id": ident})
    if rec and rec.get("window_start"):
        try:
            ws = datetime.fromisoformat(rec["window_start"])
        except Exception:
            ws = None
        if ws and (now - ws).total_seconds() < window_seconds:
            if int(rec.get("count", 0)) >= max_count:
                return False
            await db.rate_limits.update_one({"_id": ident}, {"$inc": {"count": 1}})
            return True
    await db.rate_limits.update_one(
        {"_id": ident},
        {"$set": {"window_start": now.isoformat(), "count": 1, "ts": now}}, upsert=True)
    return True


async def _make_session(user_id, token=None):
    token = token or secrets.token_urlsafe(32)
    exp = (datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)).isoformat()
    await db.user_sessions.update_one(
        {"session_token": token},
        {"$set": {"user_id": user_id, "session_token": token, "expires_at": exp, "created_at": now_iso()}},
        upsert=True,
    )
    return token


def _set_cookie(resp, token):
    resp.set_cookie("session_token", token, httponly=True, secure=True, samesite="lax", path="/", max_age=SESSION_DAYS * 86400)


def _public_user(u):
    return {"user_id": u["user_id"], "email": u["email"], "name": u.get("name", ""), "picture": u.get("picture", ""), "role": u.get("role", "user")}


async def _role_for_new_user():
    return "admin" if await db.users.count_documents({}) == 0 else "user"


async def current_user(request: Request):
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Non autenticato")
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=401, detail="Sessione non valida")
    exp = sess["expires_at"]
    if isinstance(exp, str):
        exp = datetime.fromisoformat(exp)
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Sessione scaduta")
    u = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0})
    if not u:
        raise HTTPException(status_code=401, detail="Utente non trovato")
    # Promozione automatica: l'email del proprietario è sempre admin.
    if (u.get("email") or "").strip().lower() in OWNER_EMAILS and u.get("role") != "admin":
        await db.users.update_one({"user_id": u["user_id"]}, {"$set": {"role": "admin"}})
        u["role"] = "admin"
    return u


async def optional_user(request: Request):
    try:
        return await current_user(request)
    except HTTPException:
        return None


# ---------------------------------------------------------------------------
# Entitlement / PRO helpers (blindatura server-side)
# ---------------------------------------------------------------------------
async def _email_has_pro(email: Optional[str]) -> bool:
    if not email:
        return False
    ent = await db.entitlements.find_one({"email": email.strip().lower()}, {"_id": 0})
    if not ent or not ent.get("pro"):
        return False
    exp = ent.get("expires_at")
    return True if not exp else exp > now_iso()


async def user_is_pro(user: Optional[dict]) -> bool:
    """PRO se abbonato/prova attiva OPPURE admin (accesso completo)."""
    if not user:
        return False
    if user.get("role") == "admin":
        return True
    return await _email_has_pro(user.get("email"))


async def require_pro(user: dict = Depends(current_user)):
    """Dependency: richiede utente loggato CON accesso PRO attivo (o admin)."""
    if not await user_is_pro(user):
        raise HTTPException(status_code=403, detail="Abbonamento PRO richiesto")
    return user


async def require_admin(user: dict = Depends(current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accesso riservato all'amministratore")
    return user


# --- Accesso Academy ("Impara da Casa") + acquisto singolo ricette -----------
RECIPE_PRICES = {"single": 499, "panettoni": 2999, "all": 14900}  # centesimi EUR
# Pacchetti ricette per categoria (centesimi EUR)
BUNDLE_DEFS = {
    "pasticceria": {"amount": 5000, "name": "Pacchetto Pasticceria Lievitata & Viennoiserie", "cat": "pasticceria",
                    "name_de": "Paket Feine Hefebackwaren & Viennoiserie",
                    "name_en": "Leavened Pastry & Viennoiserie Pack",
                    "name_es": "Paquete Bollería Fermentada y Viennoiserie"},
    "pane": {"amount": 4000, "name": "Pacchetto Ricette Pane & Panificati", "cat": "pane",
             "name_de": "Paket Brot & Backwaren", "name_en": "Bread & Baked Goods Pack", "name_es": "Paquete Pan y Panificados"},
    "panini": {"amount": 2000, "name": "Pacchetto Ricette Panini", "cat": "panini",
               "name_de": "Brötchen-Rezeptpaket", "name_en": "Rolls Recipes Pack", "name_es": "Paquete Recetas de Bollos"},
    "snack": {"amount": 1000, "name": "Pacchetto Snack & Sfizi Salati", "cat": "snack",
              "name_de": "Paket Snacks & herzhafte Häppchen", "name_en": "Snacks & Savory Bites Pack", "name_es": "Paquete Snacks y Aperitivos Salados"},
    # Legacy (deprecato): mantenuto per fulfillment di eventuali acquisti pregressi.
    "panettoni": {"amount": 5000, "name": "Pacchetto Grandi Lievitati (Panettoni & Colombe)", "cat": "pasticceria",
                  "name_de": "Paket Große Hefegebäcke (Panettone & Colombe)",
                  "name_en": "Large Leavened Cakes Pack (Panettone & Colombe)",
                  "name_es": "Paquete Grandes Levados (Panettone y Colombe)"},
}


def _bundle_name(b: dict, lang: str) -> str:
    if lang == "de":
        return b.get("name_de") or b["name"]
    if lang == "en":
        return b.get("name_en") or b["name"]
    if lang == "es":
        return b.get("name_es") or b.get("name_en") or b["name"]
    return b["name"]


def _recipe_bundle(d) -> str:
    cat = (d.get("menu_category") or "").lower()
    if cat == "viennoiserie" or _is_panettone_recipe(d):
        return "pasticceria"
    if cat == "panini":
        return "panini"
    if cat == "snack":
        return "snack"
    if cat in ("pane", "focacce", "basi"):
        return "pane"
    s = f"{d.get('category','')} {cat} {d.get('name','')}".lower()
    if "panin" in s:
        return "panini"
    if "snack" in s or "grissini" in s or "taralli" in s or "cracker" in s:
        return "snack"
    return "pane"
DIAGNOSI_MONTHLY_LIMIT = 10  # per il piano "Impara da Casa" (home)


def _ent_active(ent: Optional[dict]) -> bool:
    if not ent:
        return False
    exp = ent.get("expires_at")
    return True if not exp else exp > now_iso()


async def user_academy_access(user: Optional[dict]) -> bool:
    """Accesso all'Academy: PRO completo, piano home attivo, oppure admin."""
    if not user:
        return False
    if user.get("role") == "admin":
        return True
    if await user_is_pro(user):
        return True
    ent = await db.entitlements.find_one({"email": (user.get("email") or "").strip().lower()}, {"_id": 0})
    return bool(ent and ent.get("academy")) and _ent_active(ent)


def _is_panettone_recipe(doc: dict) -> bool:
    if (doc.get("menu_category") or "") == "panettoni":
        return True
    return bool(re.search(r"panettone", (doc.get("name") or ""), re.I))


async def require_diagnosi(user: dict = Depends(current_user)):
    """Diagnosi: illimitata per PRO/admin; fino a 10/mese per il piano 'Impara da Casa' (home)."""
    if await user_is_pro(user):
        return user
    email = (user.get("email") or "").strip().lower()
    ent = await db.entitlements.find_one({"email": email}, {"_id": 0})
    if not (ent and ent.get("academy") and _ent_active(ent)):
        raise HTTPException(status_code=403, detail="Abbonamento richiesto")
    mk = datetime.now(timezone.utc).strftime("%Y-%m")
    used = int(ent.get("diagnosi_count") or 0) if ent.get("diagnosi_month") == mk else 0
    if used >= DIAGNOSI_MONTHLY_LIMIT:
        raise HTTPException(status_code=429, detail=f"Limite mensile Diagnosi raggiunto ({DIAGNOSI_MONTHLY_LIMIT}/mese). Passa a PRO per l'accesso illimitato.")
    await db.entitlements.update_one({"email": email},
        {"$set": {"diagnosi_month": mk, "diagnosi_count": used + 1, "updated_at": now_iso()}})
    return user



def _teaser_recipe(doc: dict) -> dict:
    """Versione 'assaggio': mostra nome/foto/ingredienti base, blocca metodo ed extra."""
    d = dict(doc)
    d["procedure"] = ""
    d["procedure_de"] = ""
    d["procedure_en"] = ""
    d["notes"] = ""
    d["notes_de"] = ""
    d["notes_en"] = ""
    d["work_phases"] = []
    d["extra_ingredients"] = []
    d["biga"] = None
    d["costing"] = None
    d["locked"] = True
    return d


# 2 ricette DEMO sempre complete (vetrina gratuita per non-PRO): una semplice + un panettone.
DEMO_RECIPE_NAMES = {"Cuore Italiano", "Focaccia Genovese"}


async def _translate_recipe_de(doc):
    """Traduce in tedesco i campi principali della ricetta (best-effort)."""
    try:
        fields = {k: doc.get(k) for k in ["name", "flour_type", "notes", "procedure"] if doc.get(k)}
        if not fields:
            return {}
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY, session_id=f"trrec-{doc.get('id', 'x')}",
            system_message=("Traduttore IT->DE per panificazione artigianale professionale. Mantieni invariati i termini tecnici: "
                            "Lievito Madre, Poolish, Biga, Sauerteig, Panettone, Backmittel, Kochstück, Quellstück. "
                            "Preserva FEDELMENTE il processo tecnico: metodo (diretto/indiretto), idratazione %, temperature "
                            "(acqua e impasto), l'ordine dei passaggi, l'acqua a filo, i pre-fermenti a inizio impasto e le "
                            "sospensioni (uvetta/noci/canditi) come ultimo ingrediente. Non riordinare né semplificare i passaggi. "
                            "Non tradurre nomi propri (Mikilab, Michele). Rispondi SOLO con JSON valido."),
        ).with_model("anthropic", "claude-sonnet-4-6").with_params(max_tokens=2000)
        prompt = ("Traduci in tedesco e restituisci un JSON con SOLO le chiavi tra name_de, flour_type_de, notes_de, "
                  "procedure_de corrispondenti ai campi forniti:\n" + json.dumps(fields, ensure_ascii=False))
        full = ""
        async for ev in chat.stream_message(UserMessage(text=prompt)):
            if isinstance(ev, TextDelta):
                full += ev.content
            elif isinstance(ev, StreamDone):
                break
        m = re.search(r"\{.*\}", full, re.S)
        return json.loads(m.group(0)) if m else {}
    except Exception as e:
        logging.warning(f"translate_de failed: {e}")
        return {}


def _verify_email_html(link: str, lang: str) -> str:
    if lang == "de":
        return (f"<div style='font-family:Arial,sans-serif;max-width:520px;margin:auto'><h2 style='color:#234b6e'>Willkommen bei MikiLab 🥖</h2>"
                f"<p>Bestätige deine E-Mail, um dein Konto zu aktivieren:</p>"
                f"<p><a href='{link}' style='background:#3f7cac;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold'>E-Mail bestätigen</a></p>"
                f"<p style='color:#888;font-size:12px'>Der Link läuft in 24 Stunden ab.</p></div>")
    if lang == "es":
        return (f"<div style='font-family:Arial,sans-serif;max-width:520px;margin:auto'><h2 style='color:#234b6e'>¡Bienvenido a MikiLab 🥖</h2>"
                f"<p>Confirma tu correo para activar tu cuenta:</p>"
                f"<p><a href='{link}' style='background:#3f7cac;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold'>Confirmar correo</a></p>"
                f"<p style='color:#888;font-size:12px'>El enlace caduca en 24 horas.</p></div>")
    if lang == "en":
        return (f"<div style='font-family:Arial,sans-serif;max-width:520px;margin:auto'><h2 style='color:#234b6e'>Welcome to MikiLab 🥖</h2>"
                f"<p>Confirm your email to activate your account:</p>"
                f"<p><a href='{link}' style='background:#3f7cac;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold'>Confirm email</a></p>"
                f"<p style='color:#888;font-size:12px'>The link expires in 24 hours.</p></div>")
    return (f"<div style='font-family:Arial,sans-serif;max-width:520px;margin:auto'><h2 style='color:#234b6e'>Benvenuto in MikiLab 🥖</h2>"
            f"<p>Conferma la tua email per attivare l'account:</p>"
            f"<p><a href='{link}' style='background:#3f7cac;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold'>Conferma email</a></p>"
            f"<p style='color:#888;font-size:12px'>Il link scade tra 24 ore.</p></div>")


async def _send_verification(email: str, origin_url: str, lang: str):
    if not RESEND_API_KEY:
        return None
    token = secrets.token_urlsafe(32)
    exp = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
    await db.email_verifications.update_one(
        {"email": email}, {"$set": {"email": email, "token": token, "expires_at": exp, "created_at": now_iso()}}, upsert=True)
    origin = (origin_url or "").rstrip("/")
    link = f"{origin}/?verify={token}"
    subj = {"de": "MikiLab · E-Mail bestätigen", "en": "MikiLab · Confirm your email",
            "es": "MikiLab · Confirma tu correo"}.get(lang, "MikiLab · Conferma la tua email")
    try:
        await asyncio.to_thread(_resend.Emails.send, {"from": f"MikiLab <{SENDER_EMAIL}>", "to": [email],
                                                       "subject": subj, "html": _verify_email_html(link, lang)})
    except Exception as e:
        logging.getLogger(__name__).error(f"verification email failed: {e}")
    return token


@api_router.post("/auth/register")
async def auth_register(payload: RegisterReq, request: Request, response: Response):
    email = payload.email.strip().lower()
    lang = payload.lang if payload.lang in ("it", "de", "en", "es") else "it"
    # Anti-spam: max 5 registrazioni all'ora per dispositivo/IP
    if not await _rate_limit("register", _client_ip(request), 5, 3600):
        raise HTTPException(status_code=429, detail="Troppe registrazioni da questo dispositivo. Riprova più tardi.")
    if not email or not payload.password:
        raise HTTPException(status_code=400, detail="Email e password richieste")
    _validate_password(payload.password, lang)
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email già registrata")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    verify_enabled = bool(RESEND_API_KEY)
    await db.users.insert_one({
        "user_id": user_id, "email": email, "name": payload.name or email.split("@")[0],
        "picture": "", "role": await _role_for_new_user(), "auth_provider": "email",
        "password_hash": _hash_pw(payload.password), "created_at": now_iso(),
        "email_verified": not verify_enabled,
    })
    if verify_enabled:
        await _send_verification(email, payload.origin_url or "", lang)
        return {"needs_verification": True,
                "message": {"it": "Ti abbiamo inviato un'email di conferma. Controlla la posta per attivare l'account.",
                            "de": "Wir haben dir eine Bestätigungs-E-Mail gesendet. Prüfe dein Postfach.",
                            "en": "We've sent you a confirmation email. Check your inbox to activate your account.",
                            "es": "Te hemos enviado un correo de confirmación. Revisa tu bandeja para activar la cuenta."}.get(lang, "")}
    token = await _make_session(user_id)
    _set_cookie(response, token)
    u = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"user": _public_user(u), "session_token": token}


@api_router.post("/auth/verify-email")
async def verify_email(body: dict, response: Response):
    token = (body or {}).get("token", "")
    if not isinstance(token, str) or not token:
        raise HTTPException(status_code=400, detail="Token non valido")
    rec = await db.email_verifications.find_one({"token": token}, {"_id": 0})
    if not rec:
        raise HTTPException(status_code=400, detail="Link non valido o già usato")
    if rec.get("expires_at") and rec["expires_at"] < datetime.now(timezone.utc).isoformat():
        raise HTTPException(status_code=400, detail="Link scaduto, richiedine uno nuovo")
    u = await db.users.find_one({"email": rec["email"]}, {"_id": 0})
    if not u:
        raise HTTPException(status_code=400, detail="Utente non trovato")
    await db.users.update_one({"email": rec["email"]}, {"$set": {"email_verified": True}})
    await db.email_verifications.delete_one({"token": token})
    tok = await _make_session(u["user_id"])
    _set_cookie(response, tok)
    u = await db.users.find_one({"email": rec["email"]}, {"_id": 0})
    return {"user": _public_user(u), "session_token": tok}


@api_router.post("/auth/resend-verification")
async def resend_verification(body: ResendVerifyReq):
    email = (body.email or "").strip().lower()
    lang = body.lang if body.lang in ("it", "de", "en", "es") else "it"
    u = await db.users.find_one({"email": email, "auth_provider": "email"})
    if u and not u.get("email_verified"):
        await _send_verification(email, body.origin_url or "", lang)
    return {"ok": True}


@api_router.post("/auth/login")
async def auth_login(payload: LoginReq, request: Request, response: Response):
    email = payload.email.strip().lower()
    ip = (request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (request.client.host if request.client else "?"))
    ident = f"{ip}:{email}"
    # Protezione forza-bruta: max 5 tentativi falliti, blocco 15 min
    att = await db.login_attempts.find_one({"identifier": ident})
    now = datetime.now(timezone.utc)
    if att and att.get("locked_until") and att["locked_until"] > now.isoformat():
        raise HTTPException(status_code=429, detail="Troppi tentativi. Riprova tra qualche minuto.")
    u = await db.users.find_one({"email": email}, {"_id": 0})
    if not u or not u.get("password_hash") or not _check_pw(payload.password, u["password_hash"]):
        fails = (att.get("fails", 0) if att else 0) + 1
        upd = {"identifier": ident, "fails": fails, "updated_at": now.isoformat()}
        if fails >= 5:
            upd["locked_until"] = (now + timedelta(minutes=15)).isoformat()
            upd["fails"] = 0
        await db.login_attempts.update_one({"identifier": ident}, {"$set": upd}, upsert=True)
        raise HTTPException(status_code=401, detail="Credenziali non valide")
    if u.get("auth_provider") == "email" and u.get("email_verified") is False:
        raise HTTPException(status_code=403, detail="verify_email")
    await db.login_attempts.delete_one({"identifier": ident})
    token = await _make_session(u["user_id"])
    _set_cookie(response, token)
    return {"user": _public_user(u), "session_token": token}


@api_router.post("/auth/google/session")
async def auth_google(payload: GoogleReq, response: Response):
    try:
        r = requests.get(EMERGENT_SESSION_URL, headers={"X-Session-ID": payload.session_id}, timeout=30)
        r.raise_for_status()
        data = r.json()
    except Exception:
        raise HTTPException(status_code=401, detail="Sessione Google non valida")
    email = (data.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=401, detail="Email mancante")
    u = await db.users.find_one({"email": email}, {"_id": 0})
    if not u:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id, "email": email, "name": data.get("name", ""),
            "picture": data.get("picture", ""), "role": await _role_for_new_user(),
            "auth_provider": "google", "created_at": now_iso(),
        })
        u = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    token = await _make_session(u["user_id"], data.get("session_token"))
    _set_cookie(response, token)
    return {"user": _public_user(u), "session_token": token}


@api_router.get("/auth/me")
async def auth_me(user: dict = Depends(current_user)):
    return _public_user(user)


@api_router.post("/auth/logout")
async def auth_logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"success": True}


@api_router.get("/recipes", response_model=List[Recipe])
async def get_recipes(collection_name: str = "mikilab", user: Optional[dict] = Depends(optional_user)):
    if collection_name == "mikilab":
        await seed_mikilab_if_empty()
        docs = await db.recipes.find({"collection_name": "mikilab", "hidden": {"$ne": True}}, {"_id": 0}).sort("name", 1).to_list(1000)
        # Il ricettario del proprietario: includi anche le ricette PERSONALI dell'owner/admin
        # (le "mie ricette"), così abbonati / VIP / owner possono usarle come parte del ricettario.
        owner_users = await db.users.find(
            {"$or": [{"email": {"$in": [e.lower() for e in OWNER_EMAILS]}}, {"role": "admin"}]},
            {"_id": 0, "user_id": 1},
        ).to_list(100)
        # Escludi le ricette dell'utente corrente: le riceve già dalla lista "personal" (no duplicati).
        owner_ids = [u["user_id"] for u in owner_users if not (user and user.get("user_id") == u["user_id"])]
        if owner_ids:
            owner_personal = await db.recipes.find(
                {"collection_name": "personal", "owner_id": {"$in": owner_ids}, "hidden": {"$ne": True}}, {"_id": 0},
            ).sort("name", 1).to_list(1000)
            for d in owner_personal:
                d.pop("owner_id", None)
            docs = docs + owner_personal
        # Modalità "assaggio": i non-PRO vedono nome/foto/ingredienti base, il metodo è bloccato.
        # Eccezione: 2 ricette DEMO + ricette sbloccate con acquisto singolo restano complete.
        if not await user_is_pro(user):
            ent = {}
            if user:
                ent = await db.entitlements.find_one({"email": (user.get("email") or "").strip().lower()}, {"_id": 0}) or {}
            unlock_all = bool(ent.get("unlock_all"))
            unlock_pan = bool(ent.get("unlock_panettoni"))
            unlocked = set(ent.get("unlocked_recipes") or [])
            unlocked_bundles = set(ent.get("unlocked_bundles") or [])
            # Retro-compatibilità: chi ha acquistato il vecchio pacchetto "panettoni"
            # mantiene l'accesso alla nuova categoria "pasticceria" (viennoiserie).
            if "panettoni" in unlocked_bundles:
                unlocked_bundles.add("pasticceria")

            def _visible(d):
                if d.get("name") in DEMO_RECIPE_NAMES or unlock_all:
                    return True
                if unlock_pan and _is_panettone_recipe(d):
                    return True
                if unlocked_bundles and _recipe_bundle(d) in unlocked_bundles:
                    return True
                return d.get("id") in unlocked
            docs = [d if _visible(d) else _teaser_recipe(d) for d in docs]
        return docs
    if not user:
        raise HTTPException(status_code=401, detail="Accesso richiesto per le ricette personali")
    docs = await db.recipes.find({"collection_name": collection_name, "owner_id": user["user_id"]}, {"_id": 0}).sort("name", 1).to_list(1000)
    return docs


class WhatCanIMake(BaseModel):
    ingredients: str
    collection_name: str = "mikilab"
    lang: str = "it"


@api_router.post("/recipes/what-can-i-make")
async def what_can_i_make(payload: WhatCanIMake, user: dict = Depends(current_user)):
    if not (payload.ingredients or "").strip():
        return {"makable": [], "almost": []}
    q = {"collection_name": payload.collection_name}
    if payload.collection_name == "personal":
        q["owner_id"] = user["user_id"]
    docs = await db.recipes.find(q, {"_id": 0}).to_list(300)
    by_id = {d.get("id"): d for d in docs}
    items = []
    for d in docs[:80]:
        extra = d.get("extra_ingredients") or []
        extra_names = ", ".join([e.get("name", "") for e in extra if isinstance(e, dict)][:8])
        items.append({"id": d.get("id"), "name": d.get("name"), "farina": d.get("flour_type") or "", "prefermento": d.get("preferment_type") or "", "extra": extra_names})
    if not items:
        return {"makable": [], "almost": []}
    lang_name = {"de": "tedesco", "en": "inglese", "es": "spagnolo"}.get(payload.lang, "italiano")
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY, session_id=f"wcim-{uuid.uuid4().hex[:8]}",
            system_message=("Sei un assistente da panificio. L'utente elenca gli ingredienti che ha in casa. "
                            "Data la lista di ricette (con farina, prefermento, ingredienti extra), decidi quali può fare ORA "
                            "e quali gli mancano per 1-2 ingredienti. Considera che acqua e sale sono quasi sempre disponibili; "
                            "farina, lievito/lievito madre e gli extra sono i veri discriminanti. Sii pratico e non troppo severo. "
                            "REGOLA FERREA: se per una ricetta manca anche UN SOLO ingrediente chiave (una farina specifica, il lievito/lievito madre, o un extra citato tipo olive/noci/semi/uvetta), NON metterla in 'makable' ma in 'almost' con cosa manca. In 'makable' vanno SOLO ricette per cui l'utente ha davvero tutto. "
                            f"Rispondi SOLO con JSON valido. Le note ('note' e 'missing') scrivile in {lang_name}."),
        ).with_model("anthropic", "claude-sonnet-4-6").with_params(max_tokens=3500)
        prompt = (f"INGREDIENTI CHE HO: {payload.ingredients}\n\nRICETTE:\n{json.dumps(items, ensure_ascii=False)}\n\n"
                  "Restituisci SOLO JSON compatto (niente markdown, niente testo fuori dal JSON): "
                  "{\"makable\":[{\"id\":\"..\",\"note\":\"max 5 parole\"}], "
                  "\"almost\":[{\"id\":\"..\",\"missing\":\"1-2 parole\"}]}. "
                  "Note e missing MOLTO brevi. Max 12 in makable, max 8 in almost.")
        full = ""
        async for ev in chat.stream_message(UserMessage(text=prompt)):
            if isinstance(ev, TextDelta):
                full += ev.content
            elif isinstance(ev, StreamDone):
                break
        full = full.strip().replace("```json", "").replace("```", "")
        m = re.search(r"\{.*\}", full, re.S)
        parsed = json.loads(m.group(0)) if m else {"makable": [], "almost": []}
    except Exception as e:
        logging.warning(f"what-can-i-make failed: {e}")
        return {"makable": [], "almost": [], "error": True}

    def enrich(arr, key):
        out = []
        for it in (arr or []):
            d = by_id.get(it.get("id"))
            if not d:
                continue
            out.append({"id": d.get("id"), "name": d.get("name"), "image_url": d.get("image_url"), key: it.get(key, "")})
        return out
    return {"makable": enrich(parsed.get("makable"), "note"), "almost": enrich(parsed.get("almost"), "missing")}



# ==========================================================================
# GENERATORE DI RICETTE CUSTOM (Il Tuo Laboratorio) — metodo Mickey Lab
# Calcolo deterministico con percentuali del panificatore + procedimento AI.
# ==========================================================================
GEN_EXTRAS = {
    # key: (label_it, percent_su_farina)
    "olio_oliva": ("Olio extravergine d'oliva", 4.0),
    "strutto": ("Strutto", 3.0),
    "burro": ("Burro", 8.0),
    "zucchero": ("Zucchero", 5.0),
    "miele": ("Miele", 3.0),
    "latte": ("Latte (sostituisce parte dell'acqua)", 0.0),
    "uova": ("Uova", 10.0),
    "farina_canapa": ("Farina di canapa", 8.0),
    "semi_misti": ("Semi misti (lino, girasole, sesamo)", 12.0),
    "erbe": ("Erbe aromatiche (rosmarino/origano)", 1.5),
    "olive": ("Olive denocciolate", 15.0),
    "pomodori_secchi": ("Pomodori secchi", 12.0),
    "noci": ("Noci", 15.0),
    "uvetta": ("Uvetta", 20.0),
    "malto": ("Malto diastasico", 0.8),
}

# Prezzi indicativi €/kg per il food cost del generatore
GEN_PRICE_KG = {
    "olio_oliva": 8.0, "strutto": 4.0, "burro": 9.0, "zucchero": 1.2, "miele": 9.0,
    "latte": 1.2, "uova": 4.0, "farina_canapa": 14.0, "semi_misti": 6.0, "erbe": 25.0,
    "olive": 7.0, "pomodori_secchi": 12.0, "noci": 14.0, "uvetta": 4.5, "malto": 6.0,
}
GEN_PRICE_SALT_KG = 0.5
GEN_PRICE_YEAST_KG = 6.0
GEN_PRICE_SOURDOUGH_KG = 1.5

GEN_PREFERMENT = {
    "poolish": {"label": "Poolish", "flour_share": 0.30, "hyd": 1.00, "yeast_pct": 0.3, "method": "indiretto"},
    "biga": {"label": "Biga", "flour_share": 0.40, "hyd": 0.45, "yeast_pct": 1.0, "method": "indiretto"},
    "lm": {"label": "Lievito Madre", "flour_share": 0.0, "lm_pct": 25.0, "yeast_pct": 0.0, "method": "indiretto"},
    "diretto": {"label": "Lievito di Birra (diretto)", "flour_share": 0.0, "yeast_pct": 1.5, "method": "diretto"},
    "misto": {"label": "Poolish + Lievito Madre (misto)", "flour_share": 0.20, "hyd": 1.00, "lm_pct": 10.0, "yeast_pct": 0.4, "method": "indiretto"},
}


class RecipeGenReq(BaseModel):
    product: str
    preferment: str = "diretto"       # poolish | biga | lm | diretto | misto
    hydration: int = 70               # 50..100
    extras: List[str] = []
    total_weight: int = 1000          # grammi impasto finale desiderato
    lang: str = "it"
    # Scalatura per pezzatura
    mode: str = "weight"              # weight | pieces
    pieces: int = 0
    piece_weight: int = 0             # grammi a pezzo
    waste_percent: float = 10.0       # sfrido %
    # Temperatura acqua d'impasto
    target_dough_temp: float = 24.0
    ambient_temp: float = 20.0
    flour_temp: float = 20.0
    friction: float = 3.0
    # Food cost
    flour_price_kg: float = 1.2
    food_cost_ratio: float = 0.30     # incidenza materia prima sul prezzo di vendita


def _round5(x: float) -> float:
    return round(x, 1) if x < 20 else round(x)


@api_router.post("/recipes/generate")
async def generate_recipe(body: RecipeGenReq, user: dict = Depends(current_user)):
    if not await user_is_pro(user):
        raise HTTPException(status_code=403, detail="Serve l'abbonamento PRO")
    lang = body.lang if body.lang in ("it", "de", "en", "es") else "it"
    hyd = max(50, min(100, int(body.hydration)))
    pf = GEN_PREFERMENT.get(body.preferment, GEN_PREFERMENT["diretto"])
    salt_pct = 2.0
    extra_defs = [(k, GEN_EXTRAS[k][0], GEN_EXTRAS[k][1]) for k in body.extras if k in GEN_EXTRAS]
    extras_pct_sum = sum(p for _, _, p in extra_defs)
    lm_pct = pf.get("lm_pct", 0.0)
    yeast_pct = pf.get("yeast_pct", 0.0)

    # Scalatura: da pezzatura o da peso totale
    pieces_n = max(0, int(body.pieces or 0))
    piece_w = max(0, int(body.piece_weight or 0))
    waste = max(0.0, float(body.waste_percent or 0))
    if body.mode == "pieces" and pieces_n > 0 and piece_w > 0:
        total_weight = int(round(pieces_n * piece_w * (1 + waste / 100.0)))
    else:
        total_weight = max(100, int(body.total_weight or 1000))

    # Farina totale: totale = farina * (1 + idr + sale + extra + lm + lievito)/100
    total_pct = 100 + hyd + salt_pct + extras_pct_sum + lm_pct + yeast_pct
    flour_total = total_weight / (total_pct / 100.0)
    water_total = flour_total * hyd / 100.0
    salt_g = flour_total * salt_pct / 100.0
    yeast_g = flour_total * yeast_pct / 100.0
    lm_g = flour_total * lm_pct / 100.0
    extras_g = [{"name": lbl, "grams": _round5(flour_total * p / 100.0), "percent": p} for _, lbl, p in extra_defs]

    # Split pre-fermento
    preferment_block = None
    fshare = pf.get("flour_share", 0.0)
    if fshare > 0:
        pf_flour = flour_total * fshare
        pf_water = pf_flour * pf.get("hyd", 1.0)
        pf_yeast = pf_flour * pf.get("yeast_pct", 0.0) / 100.0
        preferment_block = {
            "type": pf["label"],
            "flour_g": _round5(pf_flour), "water_g": _round5(pf_water), "yeast_g": _round5(pf_yeast),
            "hours": "12-16h a 18°C" if body.preferment == "biga" else "8-12h a 20°C",
        }
        final_flour = flour_total - pf_flour
        final_water = water_total - pf_water
    else:
        final_flour = flour_total
        final_water = water_total

    ingredients = {
        "flour_total_g": _round5(flour_total),
        "water_total_g": _round5(water_total),
        "final_flour_g": _round5(final_flour),
        "final_water_g": _round5(final_water),
        "salt_g": _round5(salt_g),
        "yeast_g": _round5(yeast_g) if yeast_g else 0,
        "sourdough_g": _round5(lm_g) if lm_g else 0,
        "extras": extras_g,
        "hydration_percent": hyd,
        "preferment": preferment_block,
    }

    # --- Temperatura acqua d'impasto (metodo Mickey Lab) ---
    has_pf = bool(preferment_block) or lm_g > 0
    factor = 4 if has_pf else 3
    d, fl, amb, fr = body.target_dough_temp, body.flour_temp, body.ambient_temp, body.friction
    if has_pf:
        water_temp = factor * d - (fl + amb + fr + amb)  # pre-fermento ~ temp. ambiente
    else:
        water_temp = factor * d - (fl + amb + fr)
    water_temp = round(max(1.0, min(60.0, water_temp)), 1)
    water_status = "hot" if amb >= 29 or water_temp < 2 else ("cold" if amb <= 15 or water_temp > 40 else "ok")
    water_temp_block = {
        "water_c": water_temp, "target_dough_c": d, "flour_c": fl, "ambient_c": amb,
        "friction_c": fr, "status": water_status, "factor": factor,
    }

    # --- Food cost ---
    def _cost(grams, price_kg):
        return (grams / 1000.0) * price_kg
    cost_flour = _cost(flour_total, body.flour_price_kg)
    cost_salt = _cost(salt_g, GEN_PRICE_SALT_KG)
    cost_yeast = _cost(yeast_g, GEN_PRICE_YEAST_KG) + (_cost(preferment_block["yeast_g"], GEN_PRICE_YEAST_KG) if preferment_block else 0)
    cost_sour = _cost(lm_g, GEN_PRICE_SOURDOUGH_KG)
    cost_extras = 0.0
    for k, lbl, p in extra_defs:
        cost_extras += _cost(flour_total * p / 100.0, GEN_PRICE_KG.get(k, 3.0))
    material_cost = cost_flour + cost_salt + cost_yeast + cost_sour + cost_extras
    n_pieces = pieces_n if (body.mode == "pieces" and pieces_n > 0) else max(1, int(round(total_weight / 500.0)))
    cost_piece = material_cost / n_pieces if n_pieces else material_cost
    ratio = body.food_cost_ratio if 0.05 <= body.food_cost_ratio <= 0.9 else 0.30
    suggested_price = cost_piece / ratio
    food_cost_block = {
        "material_cost": round(material_cost, 2),
        "pieces": n_pieces,
        "cost_per_piece": round(cost_piece, 2),
        "food_cost_ratio": round(ratio * 100),
        "suggested_price_piece": round(suggested_price, 2),
        "currency": "EUR",
    }

    # --- Pezzatura ---
    portioning = {
        "mode": body.mode,
        "total_dough_g": total_weight,
        "pieces": pieces_n if body.mode == "pieces" else None,
        "piece_weight_g": piece_w if body.mode == "pieces" else None,
        "waste_percent": waste if body.mode == "pieces" else None,
    }

    # --- Alert Ricetta Intelligente (coerenza idratazione/farina/pre-fermento) ---
    W = {
        "it": {
            "hyd_extreme": "Idratazione oltre l'85%: usa una farina MOLTO forte (W320+/Manitoba) e gestisci con pieghe e bassinage, altrimenti l'impasto collassa.",
            "hyd_high": "Idratazione alta (80%+): consigliata farina forte (W300+) e almeno 3 giri di pieghe.",
            "hyd_low_focaccia": "Per focacce/ciabatte questa idratazione è bassa: sali almeno al 70-75% per un'alveolatura aperta.",
            "biga_high": "Biga con idratazione totale molto alta: la biga è un pre-fermento SOLIDO, tienila al 45% e porta l'acqua nell'impasto finale (bassinage).",
            "lm_high": "Lievito Madre con idratazione estrema: parti da rinfreschi in forza e aggiungi l'acqua a filo.",
            "diretto_long": "Metodo diretto con idratazione alta: valuta un pre-fermento (poolish/biga) per più forza e profumo.",
            "piece_small": "Pezzatura molto piccola: verifica lo sfrido e i tempi di cottura ridotti.",
        },
        "en": {
            "hyd_extreme": "Hydration above 85%: use a VERY strong flour (W320+/Manitoba) and manage with folds and bassinage, or the dough will collapse.",
            "hyd_high": "High hydration (80%+): a strong flour (W300+) and at least 3 sets of folds are recommended.",
            "hyd_low_focaccia": "For focaccia/ciabatta this hydration is low: go to at least 70-75% for an open crumb.",
            "biga_high": "Biga with very high total hydration: biga is a STIFF preferment, keep it at 45% and add the water in the final dough (bassinage).",
            "lm_high": "Sourdough with extreme hydration: start from strong refreshments and add water gradually.",
            "diretto_long": "Direct method with high hydration: consider a preferment (poolish/biga) for more strength and aroma.",
            "piece_small": "Very small piece weight: check waste and reduced baking times.",
        },
        "de": {
            "hyd_extreme": "Hydration über 85%: sehr starkes Mehl (W320+/Manitoba) verwenden und mit Falten und Bassinage führen, sonst kollabiert der Teig.",
            "hyd_high": "Hohe Hydration (80%+): starkes Mehl (W300+) und mindestens 3 Faltdurchgänge empfohlen.",
            "hyd_low_focaccia": "Für Focaccia/Ciabatta ist diese Hydration niedrig: mindestens 70-75% für eine offene Krume.",
            "biga_high": "Biga mit sehr hoher Gesamthydration: Biga ist ein FESTER Vorteig, bei 45% halten und Wasser im Hauptteig zugeben (Bassinage).",
            "lm_high": "Sauerteig mit extremer Hydration: mit kräftigen Auffrischungen starten und Wasser nach und nach zugeben.",
            "diretto_long": "Direkte Methode mit hoher Hydration: einen Vorteig (Poolish/Biga) für mehr Kraft und Aroma erwägen.",
            "piece_small": "Sehr kleines Stückgewicht: Verschnitt und kürzere Backzeiten prüfen.",
        },
        "es": {
            "hyd_extreme": "Hidratación por encima del 85%: usa una harina MUY fuerte (W320+/Manitoba) y gestiona con pliegues y bassinage, o la masa colapsará.",
            "hyd_high": "Hidratación alta (80%+): se recomienda harina fuerte (W300+) y al menos 3 tandas de pliegues.",
            "hyd_low_focaccia": "Para focaccia/chapata esta hidratación es baja: sube al menos al 70-75% para una miga abierta.",
            "biga_high": "Biga con hidratación total muy alta: la biga es un prefermento SÓLIDO, mantenla al 45% y añade el agua en la masa final (bassinage).",
            "lm_high": "Masa madre con hidratación extrema: parte de refrescos en fuerza y añade el agua poco a poco.",
            "diretto_long": "Método directo con hidratación alta: valora un prefermento (poolish/biga) para más fuerza y aroma.",
            "piece_small": "Pieza muy pequeña: revisa el desperdicio y los tiempos de cocción reducidos.",
        },
    }
    wl = W.get(lang, W["it"])
    prod_l = body.product.lower()
    warnings = []
    if hyd > 85:
        warnings.append({"level": "danger", "text": wl["hyd_extreme"]})
    elif hyd >= 80:
        warnings.append({"level": "warn", "text": wl["hyd_high"]})
    if hyd < 65 and any(x in prod_l for x in ["focacc", "ciabatt", "cristall"]):
        warnings.append({"level": "warn", "text": wl["hyd_low_focaccia"]})
    if body.preferment == "biga" and hyd > 78:
        warnings.append({"level": "warn", "text": wl["biga_high"]})
    if body.preferment in ("lm", "misto") and hyd > 85:
        warnings.append({"level": "warn", "text": wl["lm_high"]})
    if body.preferment == "diretto" and hyd >= 80:
        warnings.append({"level": "info", "text": wl["diretto_long"]})
    if body.mode == "pieces" and 0 < piece_w < 40:
        warnings.append({"level": "info", "text": wl["piece_small"]})


    # Titolo leggibile
    pf_label = pf["label"]
    title_map = {
        "it": f"{body.product} con {pf_label} al {hyd}% di Idratazione",
        "de": f"{body.product} mit {pf_label}, {hyd}% Hydration",
        "en": f"{body.product} with {pf_label} at {hyd}% Hydration",
        "es": f"{body.product} con {pf_label} al {hyd}% de Hidratación",
    }
    title = title_map.get(lang, title_map["it"])

    # Procedimento AI su misura nella lingua attiva
    procedure = ""
    if EMERGENT_LLM_KEY:
        lang_name = _LANG_NAMES.get(lang, "italiano")
        extras_txt = ", ".join(f"{e['name']} {e['grams']}g" for e in extras_g) or "nessuno"
        pf_txt = (f"{preferment_block['type']}: {preferment_block['flour_g']}g farina + "
                  f"{preferment_block['water_g']}g acqua + {preferment_block['yeast_g']}g lievito ({preferment_block['hours']})"
                  if preferment_block else (f"Lievito Madre {ingredients['sourdough_g']}g" if lm_g else "Lievito di birra diretto"))
        sys = (f"Sei un Maestro Panificatore. Scrivi SOLO in {lang_name}. "
               "Genera un procedimento professionale passo-passo (numerato) per la ricetta indicata, "
               "coerente col pre-fermento, l'idratazione e gli ingredienti dati. "
               "Includi: gestione del pre-fermento, eventuale autolisi, impasto e incordatura, inserimento di olio/aromi "
               "come da regola (grassi e aromi verso fine impasto), puntata, pieghe, formatura, appretto e cottura "
               "con temperatura e tempi realistici per il prodotto. Niente introduzioni, solo i passaggi.")
        prompt = (f"Prodotto: {body.product}\nPre-fermento: {pf_txt}\nIdratazione: {hyd}%\n"
                  f"Farina totale: {ingredients['flour_total_g']}g, Acqua totale: {ingredients['water_total_g']}g, "
                  f"Sale: {ingredients['salt_g']}g. Ingredienti speciali: {extras_txt}.\n"
                  f"Peso impasto finale: {total_weight}g. Temperatura acqua consigliata: {water_temp}°C.")
        try:
            chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"gen-{uuid.uuid4().hex[:8]}",
                           system_message=sys).with_model("anthropic", "claude-sonnet-4-6").with_params(max_tokens=1600)
            full = ""
            async for ev in chat.stream_message(UserMessage(text=prompt)):
                if isinstance(ev, TextDelta):
                    full += ev.content
                elif isinstance(ev, StreamDone):
                    break
            procedure = full.strip()
        except Exception as e:
            logging.warning(f"generate_recipe procedure failed: {e}")

    return {"title": title, "ingredients": ingredients, "procedure": procedure,
            "water_temp": water_temp_block, "food_cost": food_cost_block,
            "portioning": portioning, "warnings": warnings,
            "preferment_key": body.preferment, "product": body.product, "lang": lang}


async def _translate_text_multi(text: str) -> dict:
    """Traduce un breve testo (post/commento community) in DE/EN/ES con una sola chiamata.
    Ritorna {text_de, text_en, text_es}. Best-effort: in caso di errore ritorna {}."""
    text = (text or "").strip()
    if not text or not EMERGENT_LLM_KEY:
        return {}
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY, session_id=f"ctr-{uuid.uuid4().hex[:8]}",
            system_message=("Sei un traduttore per una community di panificatori. Traduci il messaggio in "
                            "tedesco, inglese e spagnolo mantenendo tono naturale e termini tecnici (Lievito Madre, "
                            "Poolish, Biga, Sauerteig, Panettone). Se il testo è già in una di quelle lingue, "
                            "fornisci comunque la traduzione corretta. Rispondi SOLO con JSON valido "
                            '{"de": "...", "en": "...", "es": "..."} senza altro testo.'),
        ).with_model("anthropic", "claude-sonnet-4-6").with_params(max_tokens=1200)
        full = ""
        async for ev in chat.stream_message(UserMessage(text=text)):
            if isinstance(ev, TextDelta):
                full += ev.content
            elif isinstance(ev, StreamDone):
                break
        m = re.search(r"\{.*\}", full, re.S)
        if not m:
            return {}
        data = json.loads(m.group(0))
        out = {}
        if data.get("de"):
            out["text_de"] = data["de"]
        if data.get("en"):
            out["text_en"] = data["en"]
        if data.get("es"):
            out["text_es"] = data["es"]
        return out
    except Exception as e:
        logging.warning(f"translate_text_multi failed: {e}")
        return {}




@api_router.post("/recipes", response_model=Recipe)
async def create_recipe(payload: RecipeCreate, user: dict = Depends(current_user)):
    if payload.collection_name == "mikilab" and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Solo l'admin può modificare le ricette Mikilab")
    recipe = Recipe(**payload.model_dump())
    doc = recipe.model_dump()
    if payload.collection_name != "mikilab":
        doc["owner_id"] = user["user_id"]
    tr = await _translate_recipe_de(doc)
    for k in ("name_de", "flour_type_de", "notes_de", "procedure_de"):
        if tr.get(k):
            doc[k] = tr[k]
    await db.recipes.insert_one(doc)
    return Recipe(**{k: v for k, v in doc.items() if k != "owner_id"})


@api_router.post("/upload")
async def upload_image(file: UploadFile = File(...), user: dict = Depends(current_user)):
    """Carica una foto nell'archivio immagini dedicato e restituisce l'URL servito dal backend."""
    ext = (file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg").lower()
    if ext not in MIME_TYPES:
        ext = "jpg"
    content_type = MIME_TYPES.get(ext, file.content_type or "image/jpeg")
    file_id = str(uuid.uuid4())
    path = f"{APP_NAME}/uploads/{file_id}.{ext}"
    data = await file.read()
    result = put_object(path, data, content_type)
    storage_path = result["path"]
    await db.files.insert_one({
        "id": file_id,
        "storage_path": storage_path,
        "original_filename": file.filename or f"{file_id}.{ext}",
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "is_deleted": False,
        "created_at": now_iso(),
    })
    return {"url": f"/api/files/{storage_path}", "path": storage_path, "id": file_id}


@api_router.get("/files/{path:path}")
async def download_image(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="File non trovato")
    data, content_type = get_object(path)
    return Response(content=data, media_type=record.get("content_type", content_type))


@api_router.put("/recipes/{recipe_id}", response_model=Recipe)
async def update_recipe(recipe_id: str, payload: RecipeUpdate, user: dict = Depends(current_user)):
    existing = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Ricetta non trovata")
    if existing.get("collection_name") == "mikilab":
        if user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Solo l'admin può modificare le ricette Mikilab")
    elif existing.get("owner_id") != user["user_id"]:
        raise HTTPException(status_code=403, detail="Non autorizzato")
    # Full-state save from the recipe dialog: apply all provided fields,
    # including explicit nulls (so a cleared field is actually cleared).
    updates = payload.model_dump(exclude_unset=True)
    # Never null out the required 'name': keep existing if not provided.
    if updates.get("name") is None:
        updates.pop("name", None)
    updates["updated_at"] = now_iso()
    # Segna la ricetta come modificata a mano: il seed non la sovrascriverà più.
    updates["user_edited"] = True
    # Ritraduci in tedesco SOLO se i campi tradotti sono davvero cambiati
    # (così modificare solo 'real_name'/costi non fa partire la traduzione lenta).
    translatable = ("name", "flour_type", "notes", "procedure")
    changed = [k for k in translatable if k in updates and (updates.get(k) or "") != (existing.get(k) or "")]
    if changed:
        base = {**existing, **updates}
        tr = await _translate_recipe_de(base)
        for k in ("name_de", "flour_type_de", "notes_de", "procedure_de"):
            if tr.get(k):
                updates[k] = tr[k]
    await db.recipes.update_one({"id": recipe_id}, {"$set": updates})
    merged = {**existing, **updates}
    return merged


_LANG_NAMES = {"it": "italiano", "de": "tedesco", "en": "inglese", "es": "spagnolo"}


async def _translate_recipe_lang(doc, target):
    """Traduce nome + campi ricetta nella lingua target (it/de/en/es). Ritorna dict {campo_<lang>: valore}."""
    if target not in ("it", "de", "en", "es"):
        return {}
    try:
        fields = {k: doc.get(k) for k in ["name", "flour_type", "notes", "procedure"] if doc.get(k)}
        if not fields:
            return {}
        lang_name = _LANG_NAMES[target]
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY, session_id=f"trrec-{target}-{doc.get('id', 'x')}",
            system_message=(f"Traduttore per panificazione artigianale professionale verso il {lang_name}. Mantieni invariati i termini tecnici "
                            "(Lievito Madre, Poolish, Biga, Sauerteig, Panettone, Backmittel, Kochstück, Quellstück) e i nomi propri "
                            "(Mikilab, Michele). Preserva FEDELMENTE il processo tecnico: metodo (diretto/indiretto), idratazione %, "
                            "temperature (acqua e impasto), l'ordine dei passaggi, l'acqua a filo, i pre-fermenti a inizio impasto e le "
                            "sospensioni (uvetta/noci/canditi) come ultimo ingrediente. Non riordinare né semplificare i passaggi. "
                            "Rispondi SOLO con JSON valido."),
        ).with_model("anthropic", "claude-sonnet-4-6").with_params(max_tokens=2000)
        prompt = (f"Traduci in {lang_name} e restituisci un JSON con SOLO le chiavi name_{target}, flour_type_{target}, "
                  f"notes_{target}, procedure_{target} corrispondenti ai campi forniti:\n" + json.dumps(fields, ensure_ascii=False))
        full = ""
        async for ev in chat.stream_message(UserMessage(text=prompt)):
            if isinstance(ev, TextDelta):
                full += ev.content
            elif isinstance(ev, StreamDone):
                break
        m = re.search(r"\{.*\}", full, re.S)
        return json.loads(m.group(0)) if m else {}
    except Exception as e:
        logging.warning(f"translate {target} failed: {e}")
        return {}


@api_router.post("/recipes/{recipe_id}/translate")
async def translate_recipe(recipe_id: str, lang: str = "en", user: dict = Depends(current_user)):
    existing = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Ricetta non trovata")
    if existing.get("collection_name") == "mikilab":
        # Le ricette MikiLab restano modificabili/traducibili solo dall'admin (Michele).
        if user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Non autorizzato")
    else:
        # Ricette personali: ogni utente può tradurre le PROPRIE (nessun PRO richiesto).
        if existing.get("owner_id") != user["user_id"]:
            raise HTTPException(status_code=403, detail="Non autorizzato")
    tr = await _translate_recipe_lang(existing, lang)
    if not tr:
        raise HTTPException(status_code=502, detail="Traduzione non riuscita, riprova")
    await db.recipes.update_one({"id": recipe_id}, {"$set": {**tr, "updated_at": now_iso()}})
    return {**existing, **tr}



@api_router.delete("/recipes/{recipe_id}")
async def delete_recipe(recipe_id: str, user: dict = Depends(current_user)):
    existing = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Ricetta non trovata")
    if existing.get("collection_name") == "mikilab":
        if user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Solo l'admin può modificare le ricette Mikilab")
    elif existing.get("owner_id") != user["user_id"]:
        raise HTTPException(status_code=403, detail="Non autorizzato")
    await db.recipes.delete_one({"id": recipe_id})
    return {"success": True}


# ---------------------------------------------------------------------------
# Oven profile endpoints
# ---------------------------------------------------------------------------
@api_router.get("/oven-profiles", response_model=List[OvenProfile])
async def get_oven_profiles():
    docs = await db.oven_profiles.find({}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    return docs


@api_router.post("/oven-profiles", response_model=OvenProfile)
async def create_oven_profile(payload: OvenProfileCreate, user: dict = Depends(current_user)):
    profile = OvenProfile(**payload.model_dump())
    await db.oven_profiles.insert_one(profile.model_dump())
    return profile


@api_router.put("/oven-profiles/{profile_id}", response_model=OvenProfile)
async def update_oven_profile(profile_id: str, payload: OvenProfileCreate, user: dict = Depends(current_user)):
    existing = await db.oven_profiles.find_one({"id": profile_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Profilo non trovato")
    updates = payload.model_dump()
    await db.oven_profiles.update_one({"id": profile_id}, {"$set": updates})
    return {**existing, **updates}


@api_router.delete("/oven-profiles/{profile_id}")
async def delete_oven_profile(profile_id: str, user: dict = Depends(current_user)):
    res = await db.oven_profiles.delete_one({"id": profile_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Profilo non trovato")
    return {"success": True}


# ---------------------------------------------------------------------------
# Production plan (single persisted plan)
# ---------------------------------------------------------------------------
@api_router.get("/production-plan")
async def get_production_plan():
    doc = await db.production_plan.find_one({"_key": "default"}, {"_id": 0, "_key": 0})
    return doc  # may be null if never saved


@api_router.put("/production-plan", response_model=ProductionPlan)
async def save_production_plan(payload: ProductionPlan, user: dict = Depends(current_user)):
    payload.updated_at = now_iso()
    doc = payload.model_dump()
    await db.production_plan.update_one(
        {"_key": "default"}, {"$set": {**doc, "_key": "default"}}, upsert=True
    )
    return payload


# ---------------------------------------------------------------------------
# Weekly plan (single persisted plan)
# ---------------------------------------------------------------------------
@api_router.get("/weekly-plan")
async def get_weekly_plan():
    doc = await db.weekly_plan.find_one({"_key": "default"}, {"_id": 0, "_key": 0})
    return doc  # may be null if never saved


@api_router.put("/weekly-plan", response_model=WeeklyPlan)
async def save_weekly_plan(payload: WeeklyPlan, user: dict = Depends(current_user)):
    payload.updated_at = now_iso()
    doc = payload.model_dump()
    await db.weekly_plan.update_one(
        {"_key": "default"}, {"$set": {**doc, "_key": "default"}}, upsert=True
    )
    return payload


# ---------------------------------------------------------------------------
# Piano di Produzione IA — ultimo piano generato (per utente)
# ---------------------------------------------------------------------------
@api_router.get("/capo/last-plan")
async def get_capo_last_plan(user: dict = Depends(current_user)):
    doc = await db.capo_last_plan.find_one({"_key": user["user_id"]}, {"_id": 0, "_key": 0})
    return doc  # null se mai salvato


@api_router.put("/capo/last-plan", response_model=CapoLastPlan)
async def save_capo_last_plan(payload: CapoLastPlan, user: dict = Depends(current_user)):
    payload.saved_at = now_iso()
    doc = payload.model_dump()
    await db.capo_last_plan.update_one(
        {"_key": user["user_id"]}, {"$set": {**doc, "_key": user["user_id"]}}, upsert=True
    )
    return payload


@api_router.delete("/capo/last-plan")
async def delete_capo_last_plan(user: dict = Depends(current_user)):
    await db.capo_last_plan.delete_one({"_key": user["user_id"]})
    return {"success": True}


# ---------------------------------------------------------------------------
# Mappa dei Fornai — pin opt-in (nome + città + bio + posizione approssimata)
# ---------------------------------------------------------------------------
def _norm_link(v: str) -> str:
    if not v:
        return ""
    return v if (v.startswith("http://") or v.startswith("https://")) else ("https://" + v)


class BakerPin(BaseModel):
    name: str = ""
    city: str = ""
    country: Optional[str] = ""
    bio: Optional[str] = ""
    link: Optional[str] = ""
    lat: float
    lng: float


@api_router.get("/bakers/map")
async def get_bakers_map(user: dict = Depends(current_user)):
    docs = await db.baker_pins.find({}, {"_id": 0, "user_id": 0}).to_list(2000)
    return docs


@api_router.get("/bakers/me")
async def get_baker_me(user: dict = Depends(current_user)):
    doc = await db.baker_pins.find_one({"user_id": user["user_id"]}, {"_id": 0, "user_id": 0})
    return doc  # null se non presente


@api_router.put("/bakers/me")
async def save_baker_me(payload: BakerPin, user: dict = Depends(current_user)):
    # Privacy: posizione approssimata (~1km) arrotondando le coordinate.
    doc = {
        "name": (payload.name or user.get("name") or "Fornaio").strip()[:60],
        "city": (payload.city or "").strip()[:80],
        "country": (payload.country or "").strip()[:60],
        "bio": (payload.bio or "").strip()[:200],
        "link": _norm_link((payload.link or "").strip()[:200]),
        "lat": round(float(payload.lat), 2),
        "lng": round(float(payload.lng), 2),
        "updated_at": now_iso(),
    }
    await db.baker_pins.update_one({"user_id": user["user_id"]}, {"$set": {**doc, "user_id": user["user_id"]}}, upsert=True)
    return doc


@api_router.delete("/bakers/me")
async def delete_baker_me(user: dict = Depends(current_user)):
    await db.baker_pins.delete_one({"user_id": user["user_id"]})
    return {"success": True}



# ---------------------------------------------------------------------------
# Archivio Piani di Lavoro salvati (per utente): più piani con nome + data.
# kind: "weekly" (Piano settimanale) | "capo" (Piano IA). Payload libero.
# ---------------------------------------------------------------------------
class SavedPlanCreate(BaseModel):
    name: str
    kind: str  # "weekly" | "capo"
    payload: dict = {}


@api_router.get("/plans/archive")
async def list_saved_plans(kind: Optional[str] = None, user: dict = Depends(current_user)):
    q = {"user_id": user["user_id"]}
    if kind in ("weekly", "capo"):
        q["kind"] = kind
    docs = await db.saved_plans.find(q, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs


@api_router.post("/plans/archive")
async def create_saved_plan(payload: SavedPlanCreate, user: dict = Depends(current_user)):
    if payload.kind not in ("weekly", "capo"):
        raise HTTPException(status_code=400, detail="kind non valido")
    name = (payload.name or "").strip()[:80]
    if not name:
        raise HTTPException(status_code=400, detail="Nome richiesto")
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "name": name,
        "kind": payload.kind,
        "payload": payload.payload or {},
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.saved_plans.insert_one(dict(doc))
    return doc


@api_router.delete("/plans/archive/{plan_id}")
async def delete_saved_plan(plan_id: str, user: dict = Depends(current_user)):
    res = await db.saved_plans.delete_one({"id": plan_id, "user_id": user["user_id"]})
    return {"success": res.deleted_count > 0}


class SavedPlanRename(BaseModel):
    name: str


@api_router.patch("/plans/archive/{plan_id}")
async def rename_saved_plan(plan_id: str, payload: SavedPlanRename, user: dict = Depends(current_user)):
    name = (payload.name or "").strip()[:80]
    if not name:
        raise HTTPException(status_code=400, detail="Nome richiesto")
    res = await db.saved_plans.update_one(
        {"id": plan_id, "user_id": user["user_id"]},
        {"$set": {"name": name, "updated_at": now_iso()}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Piano non trovato")
    return {"success": True, "name": name}


# ---------------------------------------------------------------------------
# News curate dall'admin (feed "arte bianca" mostrato in Home). Trilingue.
# ---------------------------------------------------------------------------
class NewsItemIn(BaseModel):
    title: str = ""
    title_de: str = ""
    title_en: str = ""
    body: str = ""
    body_de: str = ""
    body_en: str = ""
    tag: str = ""
    link: str = ""


@api_router.get("/news-items")
async def list_news_items():
    return await db.news_items.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)


@api_router.post("/news-items")
async def create_news_item(payload: NewsItemIn, user: dict = Depends(current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Non autorizzato")
    doc = {"id": str(uuid.uuid4()), **payload.model_dump(), "created_at": now_iso(), "updated_at": now_iso()}
    await db.news_items.insert_one(dict(doc))
    return doc


@api_router.put("/news-items/{nid}")
async def update_news_item(nid: str, payload: NewsItemIn, user: dict = Depends(current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Non autorizzato")
    res = await db.news_items.update_one({"id": nid}, {"$set": {**payload.model_dump(), "updated_at": now_iso()}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="News non trovata")
    return {"success": True}


@api_router.delete("/news-items/{nid}")
async def delete_news_item(nid: str, user: dict = Depends(current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Non autorizzato")
    await db.news_items.delete_one({"id": nid})
    return {"success": True}


# ---------------------------------------------------------------------------
# Capo Laboratorio — configurazione attrezzature/celle (single persisted doc)
# ---------------------------------------------------------------------------
@api_router.get("/lab-config")
async def get_lab_config():
    doc = await db.lab_config.find_one({"_key": "default"}, {"_id": 0, "_key": 0})
    return doc  # null if never saved


@api_router.put("/lab-config", response_model=LabConfig)
async def save_lab_config(payload: LabConfig, user: dict = Depends(current_user)):
    payload.updated_at = now_iso()
    doc = payload.model_dump()
    await db.lab_config.update_one(
        {"_key": "default"}, {"$set": {**doc, "_key": "default"}}, upsert=True
    )
    return payload


# ---------------------------------------------------------------------------
# Memoria temperatura impasto per ricetta (termostato)
# ---------------------------------------------------------------------------
class RecipeTemp(BaseModel):
    recipe_id: str
    recipe_name: Optional[str] = ""
    target_c: Optional[float] = None   # temperatura impasto desiderata
    actual_c: float                    # temperatura misurata oggi
    date: str = Field(default_factory=now_iso)


@api_router.get("/recipe-temp")
async def list_recipe_temp():
    docs = await db.recipe_temps.find({}, {"_id": 0}).to_list(1000)
    return docs


@api_router.post("/recipe-temp", response_model=RecipeTemp)
async def save_recipe_temp(payload: RecipeTemp, user: dict = Depends(current_user)):
    payload.date = now_iso()
    doc = payload.model_dump()
    await db.recipe_temps.update_one(
        {"recipe_id": payload.recipe_id}, {"$set": doc}, upsert=True
    )
    return payload



# ---------------------------------------------------------------------------
# Stuttgart announcements
# ---------------------------------------------------------------------------
ANNOUNCEMENT_SEED = [
    {
        "title": "Mulini di qualità in Germania",
        "details": "Cerca farina biologica macinata a pietra nei mulini regionali. Chiedi la 'Type' per scegliere la forza giusta.",
    },
    {
        "title": "Scambio lievito madre tra appassionati",
        "details": "Incontri informali tra appassionati italiani e tedeschi: scambio di pasta madre, grani antichi e consigli di cottura.",
    },
]


async def seed_announcements_if_empty():
    # Solo inserimento se la collezione è vuota (nessuna cancellazione: sicuro anche per richiesta).
    if await db.announcements.count_documents({}) == 0:
        for item in ANNOUNCEMENT_SEED:
            ann = Announcement(**item)
            await db.announcements.insert_one(ann.model_dump())


@api_router.get("/announcements", response_model=List[Announcement])
async def get_announcements():
    await seed_announcements_if_empty()
    # Filtro legale in LETTURA (non distruttivo): nasconde eventuali annunci storici con riferimenti locali.
    query = {"title": {"$not": {"$regex": "Stoccarda|Stuttgart|Cannstatt", "$options": "i"}},
             "details": {"$not": {"$regex": "Stoccarda|Stuttgart|Cannstatt", "$options": "i"}}}
    docs = await db.announcements.find(query, {"_id": 0}).sort("created_at", 1).to_list(500)
    return docs


@api_router.post("/announcements", response_model=Announcement)
async def create_announcement(payload: AnnouncementCreate, admin: dict = Depends(require_admin)):
    if not payload.title.strip():
        raise HTTPException(status_code=422, detail="Il titolo è obbligatorio")
    data = payload.model_dump()
    data["title"] = data["title"].strip()
    ann = Announcement(**data)
    await db.announcements.insert_one(ann.model_dump())
    return ann


@api_router.put("/announcements/{ann_id}", response_model=Announcement)
async def update_announcement(ann_id: str, payload: AnnouncementCreate, admin: dict = Depends(require_admin)):
    if not payload.title.strip():
        raise HTTPException(status_code=422, detail="Il titolo è obbligatorio")
    existing = await db.announcements.find_one({"id": ann_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Annuncio non trovato")
    updates = payload.model_dump()
    updates["title"] = updates["title"].strip()
    await db.announcements.update_one({"id": ann_id}, {"$set": updates})
    return {**existing, **updates}


@api_router.delete("/announcements/{ann_id}")
async def delete_announcement(ann_id: str, admin: dict = Depends(require_admin)):
    res = await db.announcements.delete_one({"id": ann_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Annuncio non trovato")
    return {"success": True}


# ---------------------------------------------------------------------------
# Maestro AI chat (Claude Sonnet 4.6, streaming)
# ---------------------------------------------------------------------------
MAESTRO_SYSTEM = (
    "Sei 'Il Maestro del Pane', un mastro panettiere artigiano esperto di panificazione "
    "a lievitazione naturale, con profonda conoscenza sia della tradizione italiana sia "
    "delle farine e delle abitudini tedesche. "
    "Rispondi in modo caldo, chiaro e pratico, come un maestro che "
    "insegna a un allievo. Dai consigli concreti su idratazione, lievito madre, farine "
    "(inclusa la corrispondenza tra tipi italiani 00/0/1/2 e tedeschi Type 405/550/812/1050, "
    "e Dinkelmehl per il farro), temperature, tempi, cottura e vapore. "
    "Il motto della sezione è: 'Chiedi e ti sarà dato'. Sii incoraggiante e mai prolisso. "
    "Quando l'utente chiede di 'imparare un metodo' o 'insegnami un metodo', rispondi SEMPRE "
    "con un metodo logico passo-passo NUMERATO e ordinato: 1) scelta di farina e prefermento "
    "(poolish, lievito madre/Sauerteig, biga), 2) impasto (tempi e temperatura acqua/impasto), "
    "3) riposi con durate e temperature, 4) formatura, 5) appretto, 6) cottura con forno "
    "(statico/ventilato/rotor), gradi, minuti e vapore. Chiaro e facile da seguire in laboratorio."
    "\n\n=== PROTOCOLLO TECNICO OBBLIGATORIO (quando GENERI o FORMATTI una ricetta) ===\n"
    "Sei un Maestro Fornaio e Pasticcere esperto in grandi lievitati, impasti ad alta idratazione e "
    "panificazione professionale. Rispetta RIGOROSAMENTE queste regole di processo.\n"
    "1) METODO (DIRETTO vs INDIRETTO): indica sempre a inizio scheda il Metodo e l'Idratazione % complessiva. "
    "DIRETTO = tutti gli ingredienti in un'unica fase: inserisci farina + lievito + 70-80% dell'acqua all'inizio; "
    "sale e acqua restante SOLO dopo la formazione della maglia glutenica. "
    "INDIRETTO = pre-fermento/massa madre (Poolish, Biga, Lievito Madre, Roggen-Sauerteig, Kochstück, Quellstück) che "
    "fermenta separatamente PRIMA. I pre-fermenti si uniscono SEMPRE all'inizio della prima fase dell'impasto/rinfresco con la farina, MAI alla fine.\n"
    "2) ALTA IDRATAZIONE (>=86%): Fase 1 impasta farina, lievito/pre-fermento e solo 65-70% dell'acqua fino a completa incordatura "
    "(maglia liscia e resistente). Fase 2 aggiungi il sale e subito dopo l'acqua restante A FILO, poca per volta, facendola assorbire "
    "senza spezzare la massa. Fase 3 chiudi controllando la temperatura finale (max 25-26°C).\n"
    "3) DUE IMPASTI (Panettone/grandi lievitati): Primo Impasto contiene TUTTO il lievito madre/prefermento, farina, liquidi, zuccheri e grassi "
    "della prima fase; lievita fino al triplicamento (1+2). Secondo Impasto (giorno 2) parte dal primo lievitato e aggiunge farina, zuccheri, tuorli, burro. "
    "TASSATIVO: il lievito madre va SOLO nel primo impasto (mai di nuovo nel secondo). Uvetta/noci/sultanine SOLO a fine secondo impasto, a velocità bassissima, solo per distribuire.\n"
    "4) SOSPENSIONI (uvetta, noci, semi, canditi): sempre come ULTIMO ingrediente, a maglia perfettamente formata, a velocità minima per non stracciare l'impasto.\n"
    "5) STRUTTURA MANUALE TECNICO: indica Metodo e Idratazione %; Temperature Target (temperatura acqua calcolata su ambiente e farina, e temperatura finale impasto); "
    "passaggi MOTIVATI (spiega PERCHE' un ingrediente o l'acqua a filo entra in quel momento); indicazioni di pieghe (Stretch & Fold / Laminazione) e gestione della "
    "fermentazione (tempi e spie di raddoppio/triplicamento)."
)

LANG_DIRECTIVE = {
    "it": " Rispondi SEMPRE in italiano.",
    "de": " Antworte IMMER auf Deutsch (respond always in German).",
}

MACHINE_PROTOCOL = (
    "Sei un Consulente Tecnico di Panificazione Industriale e Artigianale. In base ai MACCHINARI ATTIVI qui sopra, "
    "RICALCOLA e ADATTA la ricetta e il procedimento. Regole:\n"
    "A) VELOCITA' E TEMPI: riduci drasticamente i tempi di formatura/divisione manuale (es. da ~45 min a mano a ~5 min con Reon/formatrice automatica o spezzatrice-arrotondatrice). "
    "Ricalcola puntata in vasca e fermalievitazione tenendo conto che la lavorazione meccanica e' ultra-rapida.\n"
    "B) STRESS MECCANICO/TERMICO: con estrusione/formatura (Rheon, estrusore) l'impasto subisce piu' stress: consiglia temperatura finale piu' bassa (22-24°C) e/o una tenuta glutenica leggermente superiore per non stracciare l'impasto. "
    "Con formatrice Brezel automatica regola idratazione e tempi di riposo prima del passaggio in macchina. Con spirale/bracci tuffanti ad alta capacita' adatta i tempi di incordatura. "
    "Con cella CLIMATHERM sfrutta il freddo per gestire lievitazione e maturazione; con forno Rotovent o piano di pietra con vapore ad alta pressione indica gradi, minuti e gestione del vapore.\n"
    "C) VISUALIZZAZIONE OBBLIGATORIA nella scheda ricetta, aggiungi in fondo queste 3 righe:\n"
    "- 'Modalita' di Produzione:' Manuale / Semiautomatica / Industriale (in base alle macchine ON).\n"
    "- 'Resa Oraria Stimata:' pezzi o kg al minuto/ora producibili con l'attrezzatura attiva (stima realistica).\n"
    "- 'Punti di Attenzione Macchina:' avvisi pratici (es. 'Incrocia il nastro della Rheon a velocita' 3 per evitare il surriscaldamento dell'impasto').\n"
    "Se NON ci sono macchine attive, considera lavorazione manuale/artigianale classica."
)




async def maestro_stream(session_id: str, message: str, lang: str = "it", machines: Optional[List[str]] = None):
    machine_directive = ""
    if machines:
        machine_directive = (
            "\n\n=== MACCHINARI ATTIVI NEL LABORATORIO (ON): " + ", ".join(machines) + " ===\n"
            + MACHINE_PROTOCOL
        )
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=MAESTRO_SYSTEM + LANG_DIRECTIVE.get(lang, LANG_DIRECTIVE["it"]) + machine_directive,
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
        labels = {"it": ("Utente", "Maestro", "Conversazione precedente", "Nuova domanda"),
                  "de": ("Nutzer", "Meister", "Bisheriges Gespräch", "Neue Frage")}
        u, a, hdr, nq = labels.get(lang, labels["it"])
        for m in prior[-10:]:
            who = u if m["role"] == "user" else a
            lines.append(f"{who}: {m['content']}")
        context_prefix = f"{hdr}:\n" + "\n".join(lines) + f"\n\n{nq}:\n"

    full_text = ""
    user_msg = UserMessage(text=context_prefix + message)
    async for event in chat.stream_message(user_msg):
        if isinstance(event, TextDelta):
            full_text += event.content
            yield f"data: {json.dumps({'d': event.content})}\n\n"
        elif isinstance(event, StreamDone):
            break

    await db.chat_messages.insert_one({
        "id": str(uuid.uuid4()), "session_id": session_id,
        "role": "assistant", "content": full_text, "created_at": now_iso(),
    })
    yield f"data: {json.dumps({'done': True})}\n\n"


@api_router.post("/maestro/chat")
async def maestro_chat(payload: ChatRequest):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key non configurata")
    return StreamingResponse(
        maestro_stream(payload.session_id, payload.message, payload.lang, payload.machines),
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
# Mohammed — assistente di "Il Tuo Laboratorio" (Claude Sonnet 4.6, streaming)
# ---------------------------------------------------------------------------
MOHAMMED_SYSTEM = (
    "Sei 'Mohammadreza Jafari' (puoi presentarti come Mohammadreza), l'assistente PERSONALE di Michele, il creatore di MikiLab, e mastro panettiere della sezione 'Il Tuo Laboratorio'. Presentati sempre come l'assistente di Michele/MikiLab. "
    "COMPITI PRINCIPALI: 1) Accogli l'utente e guidalo nell'uso della sezione 'Il Tuo Laboratorio', che e' organizzata in 2 PASSI: "
    "PASSO 1 = 'Piano di Produzione con IA' (il cuore della sezione), PASSO 2 = 'Laboratorio & Strumenti'. "
    "2) Spiega con chiarezza le COSE FONDAMENTALI per GENERARE il Piano di Produzione con l'IA: "
    "a) scegliere le RICETTE e le relative QUANTITA' (sono i campi OBBLIGATORI), "
    "b) scegliere da quale IMPASTO PARTIRE con il tasto 'Parti da qui' (l'IA ordina la sequenza a partire da quello), "
    "c) premere 'Genera': l'IA crea il piano di lavoro con tempi, sequenza impasti e avvisi. "
    "3) Spiega le OPZIONI EXTRA che si possono collegare al piano tramite l'IA per un risultato piu' completo: "
    "Giacenze Freezer & Celle Frigo (l'IA usa prima le scorte e scala i pezzi usati), Piano Giornaliero/Settimanale, "
    "Lista Spesa & Ordini fornitori, Food Cost, Punti Vendita, Turni & Ruoli, Orari d'Inizio e Digital Twin (previsione dell'ora del PICCO del volume dell'impasto). "
    "4) Se richiesto, spiega anche gli strumenti operativi del PASSO 2: Bilancia Smart e Pesata Guidata, Diario Impasti, "
    "Termostato & sensori, Registro HACCP, Tracciabilita Lotti, Anti-Spreco, Shelf-Life. "
    "Spiega sempre in modo semplice e pratico, da vero collega panettiere. "
    "REGOLE FONDAMENTALI: AMBITO ESCLUSIVO - rispondi SOLO a domande legate alla sezione 'Il Tuo Laboratorio', alla "
    "gestione del forno e all'uso dei relativi strumenti dell'app. FUORI AMBITO - se l'utente fa domande NON pertinenti "
    "al laboratorio o al forno (es. meteo, programmazione, ricette generiche non legate all'organizzazione del forno), "
    "rispondi garbatamente ESATTAMENTE: \"Sono Mohammadreza, il tuo assistente per 'Il Tuo Laboratorio'. Posso aiutarti "
    "esclusivamente nell'organizzazione del tuo forno e nell'uso degli strumenti di questa sezione!\". "
    "TONO DI VOCE: professionale, pratico, chiaro, accogliente e da vero collega panettiere. "
    "FORMATO RISPOSTE: usa SEMPRE elenchi puntati o passaggi numerati (1, 2, 3...) per rendere le spiegazioni "
    "'passo per passo' facili e veloci da leggere durante il lavoro. Non essere prolisso."
)
MOHAMMED_LANG = {
    "it": " Rispondi SEMPRE in italiano.",
    "de": " Antworte IMMER auf Deutsch. Wenn du eine Standardantwort geben musst, uebersetze sie sinngemaess.",
    "en": " Always answer in English. Translate the fixed out-of-scope reply accordingly.",
}


async def _lab_assistant_stream(system: str, lang_map: dict, session_id: str, message: str, lang: str = "it"):
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system + lang_map.get(lang, lang_map["it"]),
    ).with_model("anthropic", "claude-sonnet-4-6")

    prior = await db.chat_messages.find({"session_id": session_id}, {"_id": 0}).sort("created_at", 1).to_list(200)
    await db.chat_messages.insert_one({
        "id": str(uuid.uuid4()), "session_id": session_id,
        "role": "user", "content": message, "created_at": now_iso(),
    })
    context_prefix = ""
    if prior:
        lines = [f"{'Utente' if m['role'] == 'user' else 'Mohammadreza'}: {m['content']}" for m in prior[-10:]]
        context_prefix = "Conversazione precedente:\n" + "\n".join(lines) + "\n\nNuova domanda:\n"

    full_text = ""
    async for event in chat.stream_message(UserMessage(text=context_prefix + message)):
        if isinstance(event, TextDelta):
            full_text += event.content
            yield f"data: {json.dumps({'d': event.content})}\n\n"
        elif isinstance(event, StreamDone):
            break
    await db.chat_messages.insert_one({
        "id": str(uuid.uuid4()), "session_id": session_id,
        "role": "assistant", "content": full_text, "created_at": now_iso(),
    })
    yield f"data: {json.dumps({'done': True})}\n\n"


@api_router.post("/mohammed/chat")
async def mohammed_chat(payload: ChatRequest):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key non configurata")
    return StreamingResponse(
        _lab_assistant_stream(MOHAMMED_SYSTEM, MOHAMMED_LANG, payload.session_id, payload.message, payload.lang),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@api_router.get("/mohammed/history/{session_id}")
async def mohammed_history(session_id: str):
    docs = await db.chat_messages.find({"session_id": session_id}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return docs


# ---------------------------------------------------------------------------
# Capo Laboratorio — pianificazione intelligente del lavoro (Claude, streaming)
# ---------------------------------------------------------------------------
CAPO_SYSTEM = (
    "Sei il 'Capo Laboratorio', un mastro panettiere che organizza il lavoro di una panetteria "
    "artigianale in modo pratico e ottimizzato. Conosci il metodo di Michele: metodo INDIRETTO con "
    "lievito madre e Miglioratore naturale; dopo l'impasto RIPOSO in CELLA a 16°C per il lievito madre "
    "(max 6 ore) oppure in FRIGO 4-6°C per lievito di birra e sfogliati; i semi richiedono il Quellstück "
    "(ammollo la sera prima). Ragiona come un capo turno: parti dai prefermenti e dagli impasti con "
    "lievitazione più lunga, sfrutta la portata (kg) delle impastatrici senza superarla, assegna le celle "
    "(frigo/freezer/lievitazione) in base al prodotto, distribuisci i compiti al personale disponibile e "
    "indica orari concreti a partire dall'ora di inizio."
)

CAPO_HOME_SYSTEM = (
    "Sei un fornaio esperto e paziente che aiuta chi fa il pane A CASA (forno domestico, niente attrezzature "
    "professionali). Spieghi tutto con parole semplici, passo-passo, senza tecnicismi. Conosci il metodo di "
    "Michele: prefermento la sera prima (poolish o lievito madre), impasto delicato con pieghe, lunga "
    "lievitazione lenta in frigo per più sapore, cottura in forno di casa ben caldo con un pentolino d'acqua "
    "per il vapore. Sei incoraggiante e rassicurante: va bene sbagliare, l'importante è divertirsi."
)

DAY_NAMES_L = {
    "it": {"lun": "Lunedì", "mar": "Martedì", "mer": "Mercoledì", "gio": "Giovedì",
           "ven": "Venerdì", "sab": "Sabato", "dom": "Domenica"},
    "de": {"lun": "Montag", "mar": "Dienstag", "mer": "Mittwoch", "gio": "Donnerstag",
           "ven": "Freitag", "sab": "Samstag", "dom": "Sonntag"},
}
DAY_NAMES = DAY_NAMES_L["it"]
DAY_ORDER = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"]


def _capo_lang(lang):
    return LANG_DIRECTIVE.get(lang, LANG_DIRECTIVE["it"])


async def _capo_item_line(it, lang="it"):
    """Formatta un prodotto con i dettagli ricetta dal DB."""
    de = lang == "de"
    rid = it.get("recipe_id")
    rec = await db.recipes.find_one({"id": rid}, {"_id": 0}) if rid else None
    qty = it.get("quantity")
    unit = it.get("unit") or ("Stück" if de else "pezzi")
    name = (rec or {}).get("name") or it.get("name") or "?"
    line = f"- {name}: {qty} {unit}" if qty else f"- {name}"
    dest = []
    if it.get("to_proof"):
        dest.append(f"{it['to_proof']} in GÄRKAMMER (für heute)" if de else f"{it['to_proof']} in cella LIEVITAZIONE (per oggi)")
    if it.get("to_fridge"):
        dest.append(f"{it['to_fridge']} in KÜHLSCHRANK 4-6°C (für morgen)" if de else f"{it['to_fridge']} in FRIGO 4-6°C (per domani)")
    if it.get("to_freezer"):
        dest.append(f"{it['to_freezer']} ins GEFRIERFACH (Vorrat)" if de else f"{it['to_freezer']} in FREEZER (scorta)")
    if dest:
        line += (" → Ziele: " if de else " → destinazioni: ") + ", ".join(dest)
    if rec:
        extra = []
        if rec.get("dough_category"):
            extra.append(f"{'Art' if de else 'tipologia'}={rec['dough_category']}")
        if rec.get("preferment_type") and rec["preferment_type"] != "none":
            extra.append(f"{'Vorteig' if de else 'prefermento'}={rec['preferment_type']}")
        if rec.get("water_temp_c") is not None:
            extra.append(f"{'Wasser' if de else 'acqua'}={rec['water_temp_c']}°C")
        if rec.get("mix_minutes"):
            extra.append(f"{'Kneten' if de else 'impasto'}={rec['mix_minutes']}min")
        if rec.get("bulk_fermentation_hours"):
            extra.append(f"{'Stockgare' if de else 'puntata'}={rec['bulk_fermentation_hours']}h")
        if rec.get("proofing_hours"):
            extra.append(f"{'Stückgare' if de else 'appretto'}={rec['proofing_hours']}h")
        if rec.get("bake_temp"):
            extra.append(f"{'Backen' if de else 'cottura'}={rec['bake_temp']}°/{rec.get('bake_minutes','?')}min {rec.get('oven_type','')}")
        if extra:
            line += " (" + ", ".join(extra) + ")"
    return line


async def _capo_build_products_block(items, lang="it"):
    """Raggruppa i prodotti per giorno (se indicato). Ritorna (testo, has_days)."""
    names = DAY_NAMES_L.get(lang, DAY_NAMES_L["it"])
    by_day, no_day = {}, []
    for it in items:
        line = await _capo_item_line(it, lang)
        day = (it.get("day") or "").strip().lower()
        if day in names:
            by_day.setdefault(day, []).append(line)
        else:
            no_day.append(line)
    if not by_day:
        return ("\n".join(no_day) or ("(keine Produkte)" if lang == "de" else "(nessun prodotto)")), False
    parts = []
    for d in DAY_ORDER:
        if by_day.get(d):
            parts.append(f"**{names[d]}**\n" + "\n".join(by_day[d]))
    if no_day:
        parts.append(("**Ohne zugewiesenen Tag**\n" if lang == "de" else "**Senza giorno assegnato**\n") + "\n".join(no_day))
    return "\n\n".join(parts), True


async def capo_plan_stream(payload: CapoPlanRequest):
    items = list(payload.items or [])
    # Unisce anche il Piano settimanale salvato, se richiesto.
    if payload.use_weekly:
        wp = await db.weekly_plan.find_one({"_key": "default"}, {"_id": 0})
        for w in (wp or {}).get("items", []):
            items.append({
                "recipe_id": w.get("recipe_id"), "name": w.get("recipe_name"),
                "quantity": w.get("pieces"), "unit": "pezzi", "day": w.get("day"),
                "to_proof": w.get("to_proof"), "to_fridge": w.get("to_fridge"), "to_freezer": w.get("to_freezer"),
            })

    de = payload.lang == "de"
    _mods = payload.active_modules
    _all_on = _mods is None
    def mod_on(name):
        return _all_on or (name in (_mods or []))
    products_txt, has_days = await _capo_build_products_block(items, payload.lang)
    if payload.machines:
        products_txt += ("\n\n[MASCHINEN] Aktive Maschinen im Labor: " + ", ".join(payload.machines) +
                         ". Passe Zeiten (Formen/Teilen ultra-schnell), Teigtemperatur (bei Extrusion 22-24°C) und Reihenfolge an; "
                         "gib pro Produkt eine kurze Zeile 'Maschine:' mit Produktionsmodus (Manuell/Halbautomatisch/Industriell), geschätzter Stundenleistung und einem Hinweis."
                         if de else
                         "\n\n[MACCHINE] Macchine attive in laboratorio: " + ", ".join(payload.machines) +
                         ". Adatta i tempi (formatura/divisione ultra-rapide), la temperatura dell'impasto (22-24°C con estrusione) e la sequenza; "
                         "per ogni prodotto aggiungi una breve riga 'Macchina:' con Modalità di Produzione (Manuale/Semiautomatica/Industriale), Resa Oraria Stimata e un punto di attenzione.")
    # Il panettiere può scegliere la PRIMA ricetta da cui far partire la produzione.
    start_names = [str(it.get("name")) for it in items if it.get("start") and it.get("name")]
    if start_names:
        sn = start_names[0]
        products_txt += (
            f"\n\n[START] Der Bäcker will die Produktion mit «{sn}» BEGINNEN: setze diesen Teig als ERSTES an (zuerst kneten/ansetzen) und richte alle anderen Zeiten danach aus."
            if de else
            f"\n\n[PARTENZA] Il panettiere vuole INIZIARE la produzione da «{sn}»: avvia questo impasto per PRIMO (primo da impastare/avviare) e allinea tutti gli altri tempi di conseguenza."
        )
    # Direttiva di lingua FORTE, sia in apertura che in chiusura del prompt utente.
    lang_lead = ("[SPRACHE: DEUTSCH] Schreibe den GESAMTEN Plan AUSSCHLIESSLICH auf DEUTSCH.\n\n"
                 if de else "[LINGUA: ITALIANO] Scrivi TUTTO il piano in ITALIANO.\n\n")
    lang_instr = ("\n\nWICHTIG: Der gesamte Plan MUSS auf DEUTSCH sein."
                  if de else "\n\nIMPORTANTE: tutto il piano DEVE essere in ITALIANO.")

    if payload.mode == "home":
        if de:
            sections = (("1) **Wochenplan**: was an jedem Tag vorbereiten und was für den nächsten Tag ruhen lassen (Vorteige am Vorabend).\n"
                         "2) **Tagesplan Schritt für Schritt**: ungefähre Uhrzeiten vom Vorabend bis zum Backen (Vorteig → Teig → Falten → Gare im Kühlschrank → Formen → Backen mit Dampf).\n"
                         "3) **Einfache Tipps**: Wassertemperatur, wie man erkennt, dass der Teig reif ist, Backen im Hausofen.\n")
                        if has_days else
                        ("1) **Schritt-für-Schritt-Plan**: ungefähre Uhrzeiten vom Vorabend bis zum Backen (Vorteig → Teig → Falten → Gare im Kühlschrank → Formen → Backen mit Dampf).\n"
                         "2) **Einfache Tipps**: Wassertemperatur, wie man erkennt, dass der Teig reif ist, Backen im Hausofen.\n"))
            prompt = (
                lang_lead
                + "Hilf mir, das Brot für ZU HAUSE mit einem KLAREN und VOLLSTÄNDIGEN Plan zu organisieren.\n\n"
                f"WAS ICH MACHEN MÖCHTE:\n{products_txt}\n"
                + (f"\nWANN ICH STARTE / WANN ES FERTIG SEIN SOLL: {payload.start_time}\n" if payload.start_time else "")
                + (f"\nNOTIZEN: {payload.notes}\n" if payload.notes else "")
                + "\nErstelle den Plan mit DIESEN Abschnitten (Fettdruck und Listen):\n"
                + sections
                + "Sprich einfach und ermutigend, wie zu einem Anfänger. Sei vollständig, aber nicht verwirrend."
            )
        else:
            sections = (("1) **Piano della settimana**: cosa preparare ogni giorno e cosa lasciar riposare per il giorno dopo (prefermenti la sera prima).\n"
                         "2) **Piano del giorno passo-passo**: orari indicativi dalla sera prima alla sfornata (prefermento → impasto → pieghe → lievitazione in frigo → formatura → cottura col vapore).\n"
                         "3) **Consigli semplici**: temperatura acqua, come capire quando è lievitato, cottura nel forno di casa.\n")
                        if has_days else
                        ("1) **Piano passo-passo**: orari indicativi dalla sera prima alla sfornata (prefermento → impasto → pieghe → lievitazione in frigo → formatura → cottura col vapore).\n"
                         "2) **Consigli semplici**: temperatura acqua, come capire quando è lievitato, cottura nel forno di casa.\n"))
            prompt = (
                lang_lead
                + "Aiutami a organizzare il pane da fare A CASA con un piano CHIARO e COMPLETO.\n\n"
                f"COSA VOGLIO FARE:\n{products_txt}\n"
                + (f"\nQUANDO INIZIO / QUANDO MI SERVE PRONTO: {payload.start_time}\n" if payload.start_time else "")
                + (f"\nNOTE: {payload.notes}\n" if payload.notes else "")
                + "\nProduci il piano con QUESTE sezioni (usa grassetti ed elenchi):\n"
                + sections
                + "Parla in modo semplice e incoraggiante, come a un principiante. Sii completo ma senza confondere."
            )
        system = CAPO_HOME_SYSTEM
        max_tokens = 2600
    else:
        mixers = payload.mixers or []
        cells = payload.cells or []
        if de:
            mixer_txt = "\n".join(
                f"- {m.get('name','Knetmaschine')}: Kapazität {m.get('capacity_kg','?')} kg"
                + (f", Typ {m.get('type')}" if m.get("type") else "")
                for m in mixers
            ) or "(keine Knetmaschine angegeben)"
            cell_txt = "\n".join(
                f"- {c.get('name','Kammer')} [{c.get('type','')}]"
                + (f" {c.get('temp_c')}°C" if c.get("temp_c") not in (None, "") else "")
                + (f" — gewünschter Inhalt: {c.get('contents')}" if c.get("contents") else "")
                for c in cells
            ) or "(keine Kammer angegeben)"
        else:
            mixer_txt = "\n".join(
                f"- {m.get('name','Impastatrice')}: portata {m.get('capacity_kg','?')} kg"
                + (f", tipo {m.get('type')}" if m.get("type") else "")
                for m in mixers
            ) or "(nessuna impastatrice indicata)"
            cell_txt = "\n".join(
                f"- {c.get('name','Cella')} [{c.get('type','')}]"
                + (f" {c.get('temp_c')}°C" if c.get("temp_c") not in (None, "") else "")
                + (f" — contenuto desiderato: {c.get('contents')}" if c.get("contents") else "")
                for c in cells
            ) or "(nessuna cella indicata)"

        # Giacenze freezer attuali: l'AI deve sapere in DETTAGLIO cosa c'è già congelato.
        fz = payload.freezer_stock or []
        if de:
            freezer_txt = "\n".join(
                f"- {x.get('name')}: {x.get('qty', 0)} vorrätig"
                + (f" (Min. {x.get('min_qty')})" if x.get("min_qty") else "")
                for x in fz if (x.get("name") or "").strip()
            ) or "(kein Gefrierbestand angegeben)"
        else:
            freezer_txt = "\n".join(
                f"- {x.get('name')}: {x.get('qty', 0)} in giacenza"
                + (f" (min. {x.get('min_qty')})" if x.get("min_qty") else "")
                for x in fz if (x.get("name") or "").strip()
            ) or "(nessuna giacenza freezer indicata)"

        temp_note = ""
        std = payload.standard_temp_c or 26.0
        if payload.lab_temp_c not in (None, ""):
            diff = float(payload.lab_temp_c) - float(std)
            if abs(diff) >= 1:
                if de:
                    verso = "WÄRMER" if diff > 0 else "KÄLTER"
                    temp_note = (
                        f"\nACHTUNG Klima: die Backstube ist {payload.lab_temp_c}°C, {verso} als der Standard "
                        f"({std}°C). Passe Wassertemperatur und Gärzeiten entsprechend an."
                    )
                else:
                    verso = "più CALDO" if diff > 0 else "più FREDDO"
                    temp_note = (
                        f"\nATTENZIONE clima: il laboratorio è {payload.lab_temp_c}°C, {verso} dello standard "
                        f"({std}°C). Adatta la temperatura dell'acqua e i tempi di lievitazione di conseguenza."
                    )

        if de:
            context = (
                f"TAGESBEGINN: {payload.start_time or 'nicht angegeben'}\n"
                f"VERFÜGBARES PERSONAL: {payload.staff if payload.staff is not None else 'nicht angegeben'}\n\n"
                f"ZU VORBEREITENDE PRODUKTE:\n{products_txt}\n\n"
                f"KNETMASCHINEN:\n{mixer_txt}\n\n"
                f"KAMMERN (Kühlschrank / Gefrierfach / Gärkammer):\n{cell_txt}\n"
                f"AKTUELLER GEFRIERBESTAND (bereits vorhanden, zuerst verwenden!):\n{freezer_txt}\n"
                f"{temp_note}\n"
                + (f"\nNOTIZEN: {payload.notes}\n" if payload.notes else "")
            )
        else:
            context = (
                f"ORA DI INIZIO GIORNATA: {payload.start_time or 'non indicata'}\n"
                f"PERSONALE DISPONIBILE: {payload.staff if payload.staff is not None else 'non indicato'}\n\n"
                f"PRODOTTI DA PREPARARE:\n{products_txt}\n\n"
                f"IMPASTATRICI:\n{mixer_txt}\n\n"
                f"CELLE (frigo / freezer / lievitazione):\n{cell_txt}\n"
                f"GIACENZE FREEZER ATTUALI (già disponibili, usale per prime!):\n{freezer_txt}\n"
                f"{temp_note}\n"
                + (f"\nNOTE: {payload.notes}\n" if payload.notes else "")
            )

        if payload.phase == "weekly":
            if de:
                prompt = (
                    lang_lead
                    + "Organisiere NUR den WOCHENPLAN der Backstube (Übersicht nach Tagen), knapp aber vollständig.\n\n"
                    + context
                    + "\nErstelle (Fettdruck und Listen pro Tag):\n"
                    "1) **Wochenübersicht**: für jeden Tag was zu kneten ist und welche Vorteige/Auffrischungen am Vortag anzusetzen sind (Sauerteig, Poolish, Quellstück für Saaten).\n"
                    "2) **Ziele**: für jedes Produkt die angegebene Aufteilung beachten (X in Gärkammer = heute backen, Y in Kühlschrank = morgen backen, Rest ins Gefrierfach als Vorrat) und erinnern, wann Kühlschrank/Gefrierfach wieder herausnehmen.\n"
                    "Sei knapp und konkret (max ~450 Wörter). Schreibe NICHT den Stundenplan: der kommt danach."
                )
            else:
                prompt = (
                    lang_lead
                    + "Organizza SOLO il PIANO SETTIMANALE del laboratorio (panoramica per giorni), sintetico ma completo.\n\n"
                    + context
                    + "\nProduci (usa grassetti ed elenchi per ogni giorno):\n"
                    "1) **Panoramica settimanale**: per ogni giorno cosa impastare e quali prefermenti/rinfreschi avviare il giorno prima (lievito madre, poolish, Quellstück per i semi).\n"
                    "2) **Destinazioni**: per ogni prodotto rispetta la ripartizione indicata (X in cella lievitazione = da cuocere oggi, Y in frigo = da cuocere domani, resto in freezer come scorta) e ricorda quando riprendere frigo/freezer.\n"
                    "Sii sintetico e concreto (max ~450 parole). NON scrivere il piano ora-per-ora: quello arriva dopo."
                )
            max_tokens = 1600
        elif payload.phase == "daily":
            if de:
                prompt = (
                    lang_lead
                    + "Erstelle den TAGESPLAN Stunde für Stunde der Backstube, PRÄZISE und VOLLSTÄNDIG, basierend auf dem Wochenplan.\n\n"
                    + context
                    + "\nErstelle (Fettdruck und Listen, konkrete Uhrzeiten ab Tagesbeginn):\n"
                    "1) **Stundenablauf des Tages**: Vorteige/Quellstück → Teige (welche Knetmaschine, wie viele kg, ohne Kapazität zu überschreiten) → Ruhe Gärkammer 16°C oder Kühlschrank 4-6°C → Formen → Stückgare → Backen (Temperatur und Ofen).\n"
                    "2) **Kammer- und Zielverwaltung**: was in die Gärkammer (heute backen), was in den Kühlschrank (morgen), was ins Gefrierfach (Vorrat) und wann herausnehmen/auftauen.\n"
                    "3) **Team-Aufgaben** und **Hinweise** zu Klima/Gärung.\n"
                    "Sei präzise und vollständig bis zum Backen, ohne abzuschneiden. Maximal ~700 Wörter."
                )
            else:
                prompt = (
                    lang_lead
                    + "Crea il PIANO QUOTIDIANO ora-per-ora del laboratorio, PRECISO e COMPLETO, basandoti sul piano settimanale.\n\n"
                    + context
                    + "\nProduci (usa grassetti ed elenchi, orari concreti dall'ora di inizio):\n"
                    "1) **Sequenza oraria del giorno**: prefermenti/Quellstück → impasti (quale impastatrice, quanti kg, senza superare la portata) → riposi cella 16°C o frigo 4-6°C → formatura → appretto → cottura (temperatura e forno).\n"
                    "2) **Gestione celle e destinazioni**: cosa mettere in cella lievitazione (da cuocere oggi), cosa in frigo (domani), cosa in freezer (scorta), e quando spostarlo/scongelarlo.\n"
                    "3) **Compiti squadra** e **Avvisi** clima/lievitazione.\n"
                    "Sii preciso e completo fino alla cottura, senza troncare. Massimo ~700 parole."
                )
            max_tokens = 2400
        else:
            if de:
                prompt = (
                    lang_lead
                    + "Organisiere den ARBEITSPLAN der Backstube, PRÄZISE aber KNAPP.\n\n"
                    + context
                    + "\nErstelle mit Abschnitten (Fettdruck und Listen): Wochenübersicht (falls Tage vorhanden), Tagesplan Stunde für Stunde, Reihenfolge der Teige, Kammern und Ziele, Team-Aufgaben und Hinweise. Max ~600 Wörter, vollständig bis zum Backen."
                )
            else:
                prompt = (
                    lang_lead
                    + "Organizza il PIANO DI LAVORO del laboratorio, PRECISO ma SINTETICO.\n\n"
                    + context
                    + "\nProduci con sezioni (grassetti ed elenchi): panoramica settimanale (se ci sono giorni), piano quotidiano ora-per-ora, sequenza impasti, celle e destinazioni, compiti squadra e avvisi. Max ~600 parole, completa fino alla cottura."
                )
            max_tokens = 3000
        system = CAPO_SYSTEM

    # Direttiva v7.8 — LiCoLi/Poolish: riduzione automatica dell'idratazione.
    pref = (payload.preferment_choice or "").lower()
    if pref in ("licoli", "poolish"):
        pref_name = "LiCoLi" if pref == "licoli" else "Poolish"
        if de:
            prompt += (f"\n\nWICHTIG (Vorteig {pref_name}): Es wird {pref_name} verwendet (100% Hydratation, flüssig). "
                       "Reduziere das Wasser im Hauptteig, indem du das im Vorteig enthaltene Wasser abziehst (bei 100% Hydratation ist die Hälfte des Vorteiggewichts Wasser), damit die Endhydratation gleich bleibt. Erkläre den Abzug kurz.")
        else:
            prompt += (f"\n\nIMPORTANTE (prefermento {pref_name}): si usa il {pref_name} (idratazione 100%, liquido). "
                       "Riduci l'acqua dell'impasto principale scomputando l'acqua già presente nel prefermento (con idratazione al 100% la metà del suo peso è acqua), così l'idratazione finale resta invariata. Spiega brevemente lo scomputo.")

    # Direttiva — logica freezer (oggi/domani/scorta) + AVVISI automatici (l'AI fa tutto).
    if payload.mode != "home" and mod_on("freezer"):
        if de:
            prompt += (
                "\n\nWICHTIG — GEFRIER-LOGIK & AUTOMATISCHE HINWEISE:\n"
                "Für JEDES Produkt teile die Menge sinnvoll auf: eine Portion für HEUTE, eine für MORGEN (Kühlschrank), "
                "der REST ins Gefrierfach als Vorrat. Schätze anhand des Tagesverbrauchs, WIE LANGE der Gefriervorrat reicht "
                "(z. B. „600 Baguette am Do: 100 heute, 100 morgen, 400 tiefgekühlt — Vorrat bis Freitag“). "
                "Gib eine kurze Tabelle/Liste pro Produkt: heute / morgen / Gefrierfach / Vorrat reicht bis.\n"
                "Füge AUTOMATISCHE HINWEISE mit Uhrzeit/Auslöser hinzu: wann die Teige/Vorteige (am Vortag) ansetzen, "
                "wann den Sauerteig auffrischen, wann aus Gefrierfach/Kühlschrank herausnehmen und auftauen/wieder aufgehen lassen, "
                "und eine WARNUNG, wann der Gefriervorrat zur Neige geht und nachproduziert werden muss. Der Bäcker soll nichts selbst berechnen müssen."
                " Berücksichtige den AKTUELLEN GEFRIERBESTAND: nutze ihn ZUERST und produziere nur die Differenz nach; aktualisiere am Ende, was neu ins Gefrierfach geht."
            )
        else:
            prompt += (
                "\n\nIMPORTANTE — LOGICA FREEZER (oggi/domani/scorta) + AVVISI AUTOMATICI:\n"
                "Per OGNI prodotto ripartisci la quantità con logica: una parte per OGGI, una per DOMANI (frigo), "
                "il RESTO in freezer come scorta. Stima in base al consumo giornaliero PER QUANTO dura la scorta congelata "
                "(es. «Baguette giovedì 600 pezzi: 100 oggi, 100 domani, 400 in freezer — scorta fino a venerdì»). "
                "Dai una breve tabella/elenco per prodotto: oggi / domani / freezer / scorta fino a.\n"
                "Inserisci AVVISI AUTOMATICI con orario/innesco: quando attaccare gli impasti/prefermenti (il giorno prima), "
                "quando rinfrescare il lievito madre, quando tirare fuori dal freezer/frigo e scongelare/far riprendere, "
                "e un AVVISO di quando la scorta in freezer sta per finire e va riprodotta. Il panettiere non deve calcolare nulla da solo."
                " Tieni conto delle GIACENZE FREEZER ATTUALI: usale PER PRIME e produci solo la differenza mancante; alla fine aggiorna cosa entra di nuovo nel freezer."
            )

    # Moduli opzionali extra (toggle ON dal frontend).
    if payload.mode != "home":
        if mod_on("punti"):
            prompt += ("\n\nVERKAUFSPUNKTE: Berücksichtige die Verteilung auf mehrere Verkaufspunkte — schlage vor, wie viel pro Punkt und wann geliefert/vorbereitet werden soll."
                       if de else
                       "\n\nPUNTI VENDITA: considera la distribuzione su più punti vendita — proponi quanto destinare a ciascun punto e quando consegnare/preparare.")
        if mod_on("antispreco"):
            prompt += ("\n\nANTI-VERSCHWENDUNG: Gib konkrete Tipps, um Reste/Überschuss zu vermeiden (Mengen anpassen, Reste weiterverwenden, was einfrieren)."
                       if de else
                       "\n\nANTI-SPRECO: dai consigli concreti per evitare avanzi/eccedenze (adatta le quantità, riusa gli avanzi, cosa congelare).")
        if mod_on("spesa"):
            prompt += ("\n\nEINKAUFSLISTE: Füge am Ende eine kurze Einkaufsliste hinzu (Mehle nach Typ, Wasser, Vorteig, Salz, Zusätze)."
                       if de else
                       "\n\nLISTA SPESA: aggiungi in fondo una breve lista della spesa (farine per tipo, acqua, prefermento, sale, extra).")
        if mod_on("infornate"):
            prompt += (
                "\n\nWICHTIG — BACK-TABELLE (Backfahrplan): Füge GANZ AM ENDE des Plans einen eigenen Abschnitt "
                "**## 🔥 Backfahrplan** mit einer klaren TABELLE (Markdown) hinzu, konsolidiert aus dem Tages-/Wochenplan. "
                "Spalten: Uhrzeit (konkrete Backuhrzeit) | Produkt | Menge | Ofen | Temperatur °C | Minuten | Dampf (ja/nein). "
                "Ordne die Zeilen chronologisch nach Backuhrzeit und staffle die Chargen so, dass der Ofen nicht überlastet wird "
                "(Ofenkapazität und Reihenfolge beachten: gleiche Temperaturen bündeln, zuerst was länger backt). "
                "Berechne die Backuhrzeit rückwärts aus Formen + Stückgare je Produkt. Wenn eine Ofentemperatur/Backzeit im Rezept fehlt, gib einen sinnvollen Richtwert an und markiere ihn mit (Richtwert)."
                if de else
                "\n\nIMPORTANTE — TABELLA INFORNATE (piano di cottura): aggiungi ALLA FINE del piano una sezione dedicata "
                "**## 🔥 Orario Infornate** con una TABELLA chiara (markdown), consolidata dal piano giornaliero/settimanale. "
                "Colonne: Ora (orario concreto di infornata) | Prodotto | Quantità | Forno | Temperatura °C | Minuti | Vapore (sì/no). "
                "Ordina le righe in ordine cronologico di infornata e scaglia le infornate per non intasare il forno "
                "(rispetta la capienza del forno e l'ordine: raggruppa le stesse temperature, gestisci prima ciò che cuoce più a lungo). "
                "Calcola l'ora di infornata a ritroso da formatura + appretto di ogni prodotto. Se in ricetta manca temperatura/tempo di cottura, proponi un valore sensato e segnalalo con (indicativo)."
            )
            prompt += ("\n\nWICHTIG: Dieser Abschnitt **## 🔥 Backfahrplan** ist PFLICHT und muss IMMER vollständig erscheinen. Wenn der Platz knapp wird, kürze die anderen Abschnitte (Team, Hinweise, Einkaufsliste), aber lasse die Back-Tabelle NIE weg."
                       if de else
                       "\n\nIMPORTANTE: la sezione **## 🔥 Orario Infornate** è OBBLIGATORIA e deve SEMPRE comparire completa. Se lo spazio scarseggia, accorcia le altre sezioni (squadra, avvisi, lista spesa) ma NON omettere mai la tabella delle infornate.")
            max_tokens = max(max_tokens, 4500)

    prompt += lang_instr
    prompt += "\n\n---\nTermina SEMPRE la risposta con un'ultima riga che contiene ESATTAMENTE il marcatore [[PLAN_END]] (verrà rimosso automaticamente). Non scrivere nulla dopo il marcatore."
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"capo-{uuid.uuid4()}",
        system_message=system + _capo_lang(payload.lang),
    ).with_model("anthropic", "claude-sonnet-4-6").with_params(max_tokens=max_tokens)

    acc = ""
    try:
        async for event in chat.stream_message(UserMessage(text=prompt)):
            if isinstance(event, TextDelta):
                acc += event.content
                yield f"data: {json.dumps({'d': event.content})}\n\n"
            elif isinstance(event, StreamDone):
                break
    except Exception:
        logger.exception("capo plan stream error")
        yield f"data: {json.dumps({'d': '[Errore nella generazione del piano. Riprova.]'})}\n\n"
        yield f"data: {json.dumps({'done': True, 'truncated': False, 'error': True})}\n\n"
        return
    truncated = "[[PLAN_END]]" not in acc
    yield f"data: {json.dumps({'done': True, 'truncated': truncated})}\n\n"


@api_router.post("/capo/plan")
async def capo_plan(payload: CapoPlanRequest, user: Optional[dict] = Depends(optional_user)):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key non configurata")
    # La modalità "pro" (Capo Laboratorio) è riservata agli abbonati; "home" resta gratuita.
    if payload.mode == "pro" and not await user_is_pro(user):
        raise HTTPException(status_code=403, detail="Abbonamento PRO richiesto")
    return StreamingResponse(
        capo_plan_stream(payload),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ---------------------------------------------------------------------------
# Vision: trova difetti / trova ingredienti (photo analysis, streaming)
# ---------------------------------------------------------------------------
VISION_PROMPTS = {
    "difetti": (
        "Sei un mastro panettiere esperto. Analizza a fondo la foto (o fotogramma) del pane o dell'impasto e DIMMI TUTTO quello che riesci a capire. "
        "1) STATO generale: se è un impasto, dì se è PRONTO, POCO LIEVITATO o TROPPO LIEVITATO e da cosa lo capisci; "
        "se è un pane cotto, valuta la cottura (giusta, poco cotta, troppo cotta). "
        "2) ANALISI COMPLETA punto per punto di TUTTO ciò che vedi: crosta (colore, spessore, croccantezza), alveolatura, mollica "
        "(umidità, struttura, colore), forma e volume, colore/doratura, cottura, lievitazione, incisione/taglio, eventuale gommosità o crudo al centro. "
        "3) Per OGNI difetto individuato scrivi in modo chiaro: **cosa vedi** → **causa probabile** → **rimedio pratico** (cosa cambiare la prossima volta: idratazione, tempi, temperatura, forza farina, cottura, vapore, formatura). "
        "Non tralasciare nulla: analizza tutto quello che puoi. Usa titoli in grassetto ed elenchi puntati chiari. "
        "IMPORTANTISSIMO: nell'ULTIMA riga scrivi ESATTAMENTE '[OK]' se il pane/impasto è fatto bene e senza difetti rilevanti, "
        "oppure '[FIX]' se ci sono difetti da correggere. Non aggiungere altro dopo quel simbolo."
    ),
    "impasto": (
        "Sei un mastro panettiere esperto. Guarda la foto (o fotogramma) dell'IMPASTO. Dimmi in modo chiaro se è: "
        "PRONTO da lavorare/infornare, ANCORA INDIETRO (poco lievitato) o TROPPO LIEVITATO/collassato. "
        "Spiega i segnali che osservi (volume, bolle, cupola, superficie, tenuta) e cosa fare ADESSO in pratica. "
        "Se possibile stima quanto manca o cosa correggere. Sii pratico e conciso. "
        "Nell'ULTIMA riga scrivi ESATTAMENTE '[OK]' se l'impasto è al punto giusto, altrimenti '[FIX]'."
    ),
    "scopri": (
        "Sei un mastro panettiere innovatore e curioso. Guarda la foto e proponi al fornaio UNA o DUE idee "
        "che probabilmente NON conosce per innovare e migliorare: una tecnica poco nota, un abbinamento di farine/ingredienti, "
        "una lavorazione o una presentazione originale, coerente con ciò che vedi. Spiega brevemente il PERCHÉ e come provarla. "
        "Tono ispirante, sorprendente ma concreto. Elenco puntato breve."
    ),
    "ingredienti": (
        "Sei un mastro panettiere esperto. Guarda a fondo la foto ed ELENCA TUTTI gli ingredienti che riesci a riconoscere o dedurre — non tralasciare nulla. "
        "Se vedi materie prime (farine e loro tipo, semi, cereali, frutta secca, canditi, lievito/lievito madre, grassi, zuccheri, sale, spezie, ecc.) elencale una per una. "
        "Se è un prodotto FINITO (pane, focaccia, panettone, dolce), deduci la RICETTA PROBABILE: tipo e forza della farina, presenza di prefermento (poolish/lievito madre/biga), "
        "idratazione stimata, grassi e zuccheri, eventuali semi o sospensioni, e per ciascuno una PERCENTUALE APPROSSIMATIVA sul peso della farina. "
        "Organizza la risposta con: **Ingredienti riconosciuti** (elenco completo), **Ricetta probabile** (proporzioni stimate), **Cosa puoi preparare** (1-2 idee). "
        "Analizza tutto quello che puoi, in modo chiaro e ordinato con elenchi puntati."
    ),
    "forni": (
        "Sei un mastro panettiere esperto di forni professionali. Guarda la foto del/dei forno/i. "
        "Riconosci il TIPO di forno (statico a suola/deck, ventilato con carrello, rotor/rotativo a carrello, "
        "a legna, elettrico o a gas), notando indizi come ventola, camera, carrello rotante, iniezione di vapore, "
        "pietra/suola. Se nella foto ci sono DUE forni, confrontali e spiega la DIFFERENZA pratica in cottura. "
        "Poi dai consigli concreti: come regolare GRADI e MINUTI e il vapore per ottenere lo stesso risultato, "
        "e cosa cambia per crosta e alveolatura. Sii pratico, rassicurante e conciso, con un breve elenco puntato."
    ),
    "macchine": (
        "Sei un tecnico esperto di macchinari e ATTREZZI per panetteria e pasticceria. Guarda con attenzione "
        "la foto e RICONOSCI cosa vedi. "
        "PRIORITÀ ASSOLUTA — DIAGNOSI GUASTI: se nell'immagine vedi un DISPLAY, un pannello, un menu, una spia o un "
        "messaggio di ERRORE/ALLARME (es. 'Störung', 'Error', 'Alarm', 'Fehler', codici tipo E01/F5/Err, spie rosse, "
        "simboli di guasto, avvisi di temperatura/sonda/motore/porta) allora per PRIMA cosa: "
        "1) **Errore rilevato**: leggi e riporta ESATTAMENTE il testo/codice mostrato (anche se in tedesco) e su quale "
        "macchina sembra essere (forno, impastatrice, cella/Rehon, abbattitore...). "
        "2) **Cosa significa**: spiega in parole semplici qual è il problema (causa più probabile). "
        "3) **Come risolverlo — passo passo**: dai i rimedi pratici numerati, dal più semplice e sicuro al più tecnico "
        "(es. controlla la porta/guarnizione, riavvia/reset, verifica sonda/temperatura, controlla acqua/vapore, "
        "chiama il tecnico se X). Segnala eventuali rischi di sicurezza (corrente, parti calde). "
        "Se il codice non è universale, indica cosa controllare sul manuale e le cause tipiche di quel tipo di allarme. "
        "SE INVECE non c'è alcun errore: riconosci la MACCHINA o l'ATTREZZO (impastatrice a spirale/a bracci tuffanti/"
        "planetaria, spezzatrice, formatrice, sfogliatrice, cella di lievitazione, abbattitore, cella frigo/freezer, "
        "forno, tavolo refrigerato, affettatrice, dosatore, oppure raschietto/coppapasta/grignette/banneton/termometro/"
        "bilancia, ecc.). Se sono visibili marca o modello, indicali. "
        "Poi fornisci una SCHEDA con: **Cosa è**, **A cosa serve**, **Come si usa** (passo passo), "
        "**Impostazioni/capacità tipiche** (kg, velocità, temperatura, umidità), **Consigli d'uso e sicurezza**, "
        "**Pulizia/manutenzione**. Se non riconosci con certezza, elenca le ipotesi più probabili e come distinguerle. "
        "Usa titoli in grassetto ed elenchi puntati, tono chiaro e professionale."
    ),
    "laboratorio": (
        "Sei il 'Capo Laboratorio', un mastro panettiere che organizza gli spazi e il lavoro. Guarda la foto (o "
        "fotogramma del video) del laboratorio/postazione dove si fanno gli impasti. "
        "PRIMA riconosci le ATTREZZATURE visibili e descrivile: IMPASTATRICI (tipo — a spirale, a bracci tuffanti, "
        "planetaria — e stima la portata in kg dalla vasca), FORNI (statico a suola/deck, ventilato, rotor a carrello), "
        "CELLE (frigo/freezer/lievitazione), spezzatrici, sfogliatrici, tavoli e altri macchinari. "
        "POI, sulla base di ciò che vedi, dai indicazioni OPERATIVE e INTELLIGENTI: "
        "in QUALE impastatrice conviene lavorare ciascun tipo di impasto (in base a portata e tipo) e perché, "
        "QUANDO impastare (ordine e momento) per non sovraccaricare le macchine e rispettare i tempi di lievitazione, "
        "come usare al meglio forni e celle nel flusso, e come disporre le postazioni per un lavoro scorrevole. "
        "Segnala colli di bottiglia (una sola impastatrice, forno piccolo, poca cella) e come aggirarli. "
        "Concludi con 3-5 azioni concrete da fare subito. Usa titoli in grassetto ed elenchi puntati, tono concreto e da capo turno."
    ),
}


async def vision_stream(mode: str, image_b64: str, lang: str = "it"):
    prompt = VISION_PROMPTS.get(mode, VISION_PROMPTS["difetti"])
    prompt = prompt + LANG_DIRECTIVE.get(lang, LANG_DIRECTIVE["it"])
    # Strip data URL prefix if present
    if "," in image_b64 and image_b64.strip().startswith("data:"):
        image_b64 = image_b64.split(",", 1)[1]

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"vision-{uuid.uuid4()}",
        system_message="Sei 'Il Maestro del Pane', esperto di panificazione artigianale.",
    ).with_model("anthropic", "claude-sonnet-4-6")

    image_content = ImageContent(image_base64=image_b64)
    user_msg = UserMessage(text=prompt, file_contents=[image_content])
    try:
        async for event in chat.stream_message(user_msg):
            if isinstance(event, TextDelta):
                yield f"data: {json.dumps({'d': event.content})}\n\n"
            elif isinstance(event, StreamDone):
                break
    except Exception as e:  # noqa
        logger.exception("vision stream error")
        yield f"data: {json.dumps({'d': '[Errore nell analisi. Riprova.]'})}\n\n"
    yield f"data: {json.dumps({'done': True})}\n\n"


@api_router.post("/maestro/vision")
async def maestro_vision(payload: VisionRequest, user: dict = Depends(require_diagnosi)):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key non configurata")
    return StreamingResponse(
        vision_stream(payload.mode, payload.image_base64, payload.lang),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


class DiagnosiSave(BaseModel):
    mode: str
    result: str
    thumb: Optional[str] = None


@api_router.post("/diagnosi/save")
async def diagnosi_save(payload: DiagnosiSave, user: dict = Depends(current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "mode": payload.mode,
        "result": (payload.result or "")[:6000],
        "thumb": payload.thumb,
        "created_at": now_iso(),
    }
    await db.diagnoses.insert_one(dict(doc))
    # Conserva solo le ultime 10 diagnosi per utente.
    olds = await db.diagnoses.find({"user_id": user["user_id"]}, {"_id": 0, "id": 1, "created_at": 1}).sort("created_at", -1).to_list(1000)
    for o in olds[10:]:
        await db.diagnoses.delete_one({"id": o["id"]})
    return {"ok": True, "id": doc["id"]}


@api_router.get("/diagnosi/recent")
async def diagnosi_recent(user: dict = Depends(current_user)):
    return await db.diagnoses.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(10)


@api_router.delete("/diagnosi/{diag_id}")
async def diagnosi_delete(diag_id: str, user: dict = Depends(current_user)):
    await db.diagnoses.delete_one({"id": diag_id, "user_id": user["user_id"]})
    return {"ok": True}


class SoundDiagnosiReq(BaseModel):
    features: dict
    lang: str = "it"


@api_router.post("/diagnosi/sound")
async def diagnosi_sound(payload: SoundDiagnosiReq, user: dict = Depends(require_diagnosi)):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key non configurata")
    f = payload.features or {}
    prompt = (
        "Sei un mastro fornaio esperto. Un fornaio ha registrato il SUONO dell'impastatrice mentre lavora l'impasto. "
        "Non hai l'audio, solo queste misure acustiche estratte dal microfono: "
        f"volume medio={f.get('loudness')}, variabilita del volume={f.get('variability')}, "
        f"regolarita del ritmo (0=irregolare, 1=molto ritmico)={f.get('regularity')}, durata s={f.get('duration')}. "
        "Regola d'interpretazione: un ritmo REGOLARE (regolarita alta) con schiaffo netto indica impasto BEN INCORDATO/quasi pronto; "
        "un suono IRREGOLARE, con carico pesante e poca ritmicita (regolarita bassa, alta variabilita) indica impasto ANCORA DURO/non incordato. "
        "Rispondi BREVE (max 6 righe) con: 1) Stato stimato (Ancora duro / In incordatura / Pronto), "
        "2) Cosa fare adesso (es. continua N minuti, aggiungi acqua a filo, cambia velocita), 3) Tra quanto ricontrollare. "
        "Precisa che e una stima 'a orecchio', non un sensore di laboratorio."
    )
    prompt += LANG_DIRECTIVE.get(payload.lang, LANG_DIRECTIVE["it"])
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"sound-{uuid.uuid4()}",
        system_message="Sei 'Il Maestro del Pane', esperto di panificazione artigianale.",
    ).with_model("anthropic", "claude-sonnet-4-6")
    full = ""
    try:
        async for ev in chat.stream_message(UserMessage(text=prompt)):
            if isinstance(ev, TextDelta):
                full += ev.content
            elif isinstance(ev, StreamDone):
                break
    except Exception:
        logger.exception("sound diagnosi error")
        raise HTTPException(status_code=500, detail="Errore analisi")
    return {"result": full.strip()}


_ELEVEN_KEY = os.environ.get("ELEVEN_API_KEY")
_eleven_client = ElevenLabs(api_key=_ELEVEN_KEY) if _ELEVEN_KEY else None
MOMY_VOICE_ID = os.environ.get("MOMY_VOICE_ID", "nPczCjzI2devNBz1zQrb")  # Brian — profondo, rassicurante (assistente)
MICHELE_VOICE_ID = os.environ.get("MICHELE_VOICE_ID", "JBFqnCBsd6RMkjVDRZzb")  # George — caldo, narratore (fondatore)
_VOICE_MAP = {"momy": MOMY_VOICE_ID, "michele": MICHELE_VOICE_ID}


class TTSReq(BaseModel):
    text: str
    lang: str = "it"
    voice: str = "momy"
    voice_id: Optional[str] = None


@api_router.post("/tts")
def tts_generate(payload: TTSReq):
    """Genera audio TTS (voce umana ElevenLabs) per gli avatar (Momy / Michele)."""
    if not _eleven_client:
        raise HTTPException(status_code=503, detail="TTS non configurato")
    text = (payload.text or "").strip()[:1200]
    if not text:
        raise HTTPException(status_code=400, detail="Testo vuoto")
    voice_id = payload.voice_id or _VOICE_MAP.get((payload.voice or "momy").lower(), MOMY_VOICE_ID)
    try:
        gen = _eleven_client.text_to_speech.convert(
            text=text,
            voice_id=voice_id,
            model_id="eleven_multilingual_v2",
            voice_settings=VoiceSettings(stability=0.45, similarity_boost=0.8, style=0.35, use_speaker_boost=True),
        )
        audio = b"".join(gen)
    except Exception:
        logger.exception("tts error")
        raise HTTPException(status_code=502, detail="Errore TTS")
    return StreamingResponse(iter([audio]), media_type="audio/mpeg", headers={"Cache-Control": "public, max-age=86400"})


class ScanRecipeRequest(BaseModel):
    image_base64: str
    lang: str = "it"


SCAN_PROMPT = (
    "Sei un assistente di panificazione. Nella foto c'è una RICETTA (scritta a mano o stampata). "
    "Leggila e trasformala in DATI STRUTTURATI. Rispondi SOLO con un oggetto JSON valido, senza testo prima o dopo, "
    "con ESATTAMENTE queste chiavi (usa null se un dato non è presente, NON inventare):\n"
    '{"name": string, "flour_type": string, "hydration_percent": number|null, '
    '"flour_grams": number|null, "water_grams": number|null, "sourdough_grams": number|null, "salt_grams": number|null, '
    '"preferment_type": "none"|"lm"|"poolish"|"biga", "method_type": "diretto"|"indiretto", '
    '"dough_category": string|null, "water_temp_c": number|null, "mix_minutes": number|null, '
    '"bake_temp": number|null, "bake_minutes": number|null, "oven_type": string|null, '
    '"bulk_fermentation_hours": number|null, "proofing_hours": number|null, "origin": string|null, '
    '"extra_ingredients": [{"name": string, "percent": number|null, "grams": number|null}], '
    '"procedure": string, "notes": string}\n'
    "Converti tutte le quantità in grammi quando possibile. Metti il procedimento passo-passo in 'procedure'. "
    "Non aggiungere spiegazioni: SOLO il JSON."
)


@api_router.post("/maestro/scan-recipe")
async def scan_recipe(payload: ScanRecipeRequest, user: dict = Depends(require_pro)):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key non configurata")
    img = payload.image_base64
    if "," in img and img.strip().startswith("data:"):
        img = img.split(",", 1)[1]
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"scan-{uuid.uuid4()}",
        system_message="Estrai ricette da foto e restituisci solo JSON valido.",
    ).with_model("anthropic", "claude-sonnet-4-6").with_params(max_tokens=2000)
    user_msg = UserMessage(text=SCAN_PROMPT, file_contents=[ImageContent(image_base64=img)])
    text = ""
    try:
        async for event in chat.stream_message(user_msg):
            if isinstance(event, TextDelta):
                text += event.content
            elif isinstance(event, StreamDone):
                break
    except Exception:
        logger.exception("scan-recipe error")
        raise HTTPException(status_code=500, detail="Errore nell'analisi della foto")
    raw = text.strip()
    if raw.startswith("```"):
        raw = raw.strip("`")
        raw = raw[raw.find("{"):]
    s, e = raw.find("{"), raw.rfind("}")
    if s == -1 or e == -1:
        raise HTTPException(status_code=422, detail="Ricetta non riconosciuta nella foto")
    try:
        data = json.loads(raw[s:e + 1])
    except Exception:
        raise HTTPException(status_code=422, detail="Impossibile leggere la ricetta dalla foto")
    return data


import xml.etree.ElementTree as ET


def _fetch_rss(query: str, hl: str, gl: str, ceid: str, region: str, limit: int = 5):
    url = f"https://news.google.com/rss/search?q={requests.utils.quote(query)}&hl={hl}&gl={gl}&ceid={ceid}"
    out = []
    try:
        r = requests.get(url, timeout=12, headers={"User-Agent": "Mozilla/5.0"})
        r.raise_for_status()
        root = ET.fromstring(r.content)
        for item in root.iter("item"):
            title = (item.findtext("title") or "").strip()
            link = (item.findtext("link") or "").strip()
            pub = (item.findtext("pubDate") or "").strip()
            src_el = item.find("{http://www.w3.org/2005/Atom}source") or item.find("source")
            src = (src_el.text if src_el is not None and src_el.text else "").strip()
            if not title:
                continue
            details = " · ".join([x for x in [src, pub[:16]] if x])
            out.append({"title": title, "details": details, "link": link, "region": region})
            if len(out) >= limit:
                break
    except Exception as e:
        logging.getLogger(__name__).error(f"RSS fetch error ({region}): {e}")
    return out


@api_router.get("/news")
async def get_news():
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    cached = await db.news_cache.find_one({"_key": "news"}, {"_id": 0})
    if cached and cached.get("date") == today and cached.get("items"):
        return cached["items"]
    items = []
    items += _fetch_rss("Handwerksbäckerei OR Sauerteig OR Brot Deutschland", "de", "DE", "DE:de", "germania", 6)
    items += _fetch_rss("panificazione OR pane artigianale OR lievito madre", "it", "IT", "IT:it", "italia", 4)
    if items:
        await db.news_cache.update_one(
            {"_key": "news"}, {"$set": {"_key": "news", "date": today, "items": items}}, upsert=True
        )
    elif cached and cached.get("items"):
        return cached["items"]  # fallback to last good cache
    return items


# ---------------------------------------------------------------------------
import stripe as _stripe
_stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET")
PRICE_LOOKUP = {"monthly": "pro_monthly", "yearly": "pro_yearly"}

# Listino interno (prezzi gestiti lato codice, in centesimi EUR)
INTERNAL_PRICES = {
    ("lab", "monthly"): {"amount": 2999, "interval": "month", "name": "Il Tuo Laboratorio — Mensile"},
    ("lab", "yearly"): {"amount": 24900, "interval": "year", "name": "Il Tuo Laboratorio — Annuale"},
    ("home", "monthly"): {"amount": 1299, "interval": "month", "name": "Impara da Casa — Mensile"},
    ("home", "yearly"): {"amount": 9900, "interval": "year", "name": "Impara da Casa — Annuale"},
}


class CheckoutReq(BaseModel):
    plan: str = "monthly"        # monthly | yearly
    tier: str = "lab"           # lab (Il Tuo Laboratorio) | home (Impara da Casa)
    origin_url: str
    coupon: Optional[str] = None


@api_router.post("/subscription/checkout")
async def create_checkout(body: CheckoutReq, user: dict = Depends(current_user)):
    email = user["email"]
    p = INTERNAL_PRICES.get((body.tier, body.plan)) or INTERNAL_PRICES[("lab", "monthly")]
    # Cliente per email (riuso se esiste)
    existing = _stripe.Customer.list(email=email, limit=1).data
    customer = existing[0] if existing else _stripe.Customer.create(email=email)
    session = _stripe.checkout.Session.create(
        mode="subscription",
        managed_payments={"enabled": False},
        customer=customer.id,
        line_items=[{"price_data": {"currency": "eur", "unit_amount": p["amount"],
                                    "recurring": {"interval": p["interval"]},
                                    "product_data": {"name": p["name"]}}, "quantity": 1}],
        allow_promotion_codes=True,
        success_url=body.origin_url.rstrip("/") + "/?sub=success&session_id={CHECKOUT_SESSION_ID}",
        cancel_url=body.origin_url.rstrip("/") + "/?sub=cancel",
        metadata={"email": email, "plan": body.plan, "tier": body.tier},
    )
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()), "session_id": session.id, "email": email,
        "plan": body.plan, "amount": p["amount"], "currency": "eur",
        "payment_status": "initiated", "created_at": now_iso(),
    })
    return {"url": session.url, "session_id": session.id}


class BundleCheckoutReq(BaseModel):
    bundle: str  # pane | panini | snack | panettoni
    origin_url: str
    lang: str = "it"


@api_router.post("/recipes/bundle-checkout")
async def bundle_checkout(body: BundleCheckoutReq, user: dict = Depends(current_user)):
    b = BUNDLE_DEFS.get(body.bundle)
    if not b:
        raise HTTPException(400, "Pacchetto non valido")
    lang = body.lang if body.lang in ("it", "de", "en", "es") else "it"
    email = user["email"]
    existing = _stripe.Customer.list(email=email, limit=1).data
    customer = existing[0] if existing else _stripe.Customer.create(email=email)
    session = _stripe.checkout.Session.create(
        mode="payment",
        customer=customer.id,
        managed_payments={"enabled": False},
        line_items=[{"price_data": {"currency": "eur", "unit_amount": b["amount"],
                                    "product_data": {"name": _bundle_name(b, lang)}}, "quantity": 1}],
        success_url=body.origin_url.rstrip("/") + "/?bundle=success&session_id={CHECKOUT_SESSION_ID}",
        cancel_url=body.origin_url.rstrip("/") + "/?bundle=cancel",
        metadata={"email": email, "bundle": body.bundle, "kind": "bundle", "lang": lang},
    )
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()), "session_id": session.id, "email": email,
        "bundle": body.bundle, "amount": b["amount"], "currency": "eur", "lang": lang,
        "payment_status": "initiated", "created_at": now_iso(),
    })
    return {"url": session.url, "session_id": session.id}

def _r_field(d: dict, base: str, lang: str) -> str:
    if lang == "de":
        return d.get(f"{base}_de") or d.get(base) or ""
    if lang == "en":
        return d.get(f"{base}_en") or d.get(base) or ""
    if lang == "es":
        return d.get(f"{base}_es") or d.get(f"{base}_en") or d.get(base) or ""
    return d.get(base) or ""


def _build_bundle_pdf(recipes: list, bundle_name: str, lang: str) -> bytes:
    """PDF con tutte le ricette del pacchetto (nome, ingredienti, procedimento, fasi)."""
    from io import BytesIO
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, PageBreak)

    L = {"it": {"ing": "Ingredienti", "proc": "Procedimento", "phases": "Fasi di lavorazione",
                "notes": "Note", "flour": "Farina", "hyd": "Idratazione", "made": "Realizzato con MikiLab",
                "water": "Acqua", "sourdough": "Lievito madre", "salt": "Sale"},
         "de": {"ing": "Zutaten", "proc": "Zubereitung", "phases": "Arbeitsschritte",
                "notes": "Notizen", "flour": "Mehl", "hyd": "Hydration", "made": "Erstellt mit MikiLab",
                "water": "Wasser", "sourdough": "Sauerteig", "salt": "Salz"},
         "en": {"ing": "Ingredients", "proc": "Method", "phases": "Work phases",
                "notes": "Notes", "flour": "Flour", "hyd": "Hydration", "made": "Made with MikiLab",
                "water": "Water", "sourdough": "Sourdough", "salt": "Salt"},
         "es": {"ing": "Ingredientes", "proc": "Elaboración", "phases": "Fases de trabajo",
                "notes": "Notas", "flour": "Harina", "hyd": "Hidratación", "made": "Hecho con MikiLab",
                "water": "Agua", "sourdough": "Masa madre", "salt": "Sal"}}.get(lang, None)
    if L is None:
        L = {"ing": "Ingredienti", "proc": "Procedimento", "phases": "Fasi di lavorazione",
             "notes": "Note", "flour": "Farina", "hyd": "Idratazione", "made": "Realizzato con MikiLab",
             "water": "Acqua", "sourdough": "Lievito madre", "salt": "Sale"}

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=18 * mm, bottomMargin=18 * mm,
                            leftMargin=18 * mm, rightMargin=18 * mm, title=bundle_name)
    ss = getSampleStyleSheet()
    ACC = colors.HexColor("#234b6e")
    h1 = ParagraphStyle("h1", parent=ss["Title"], textColor=ACC, fontSize=26, spaceAfter=6)
    h2 = ParagraphStyle("h2", parent=ss["Heading1"], textColor=ACC, fontSize=17, spaceBefore=6, spaceAfter=4)
    sub = ParagraphStyle("sub", parent=ss["Normal"], textColor=colors.HexColor("#7E8A93"), fontSize=11, spaceAfter=8)
    lab = ParagraphStyle("lab", parent=ss["Heading2"], textColor=colors.HexColor("#3f7cac"), fontSize=12, spaceBefore=8, spaceAfter=2)
    body = ParagraphStyle("body", parent=ss["Normal"], fontSize=10.5, leading=15)

    def esc(s):
        return (str(s or "")).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    story = [Paragraph(esc(bundle_name), h1),
             Paragraph("MikiLab · " + L["made"], sub), Spacer(1, 6 * mm)]

    LOGO_PATH = "/app/frontend/public/logo.png"

    def _cover(canvas, doc_):
        w, h = A4
        canvas.saveState()
        canvas.setFillColor(colors.HexColor("#234b6e"))
        canvas.rect(0, 0, w, h, fill=1, stroke=0)
        canvas.setFillColor(colors.HexColor("#C88A2B"))
        canvas.rect(0, h * 0.60 - 3, w, 5, fill=1, stroke=0)
        canvas.rect(0, h * 0.60 + 92 * mm, w, 5, fill=1, stroke=0)
        try:
            lw = 46 * mm
            canvas.drawImage(LOGO_PATH, (w - lw) / 2, h * 0.60 + 30 * mm, width=lw, height=lw,
                             preserveAspectRatio=True, mask="auto")
        except Exception:
            pass
        canvas.setFillColor(colors.white)
        canvas.setFont("Helvetica-Bold", 30)
        canvas.drawCentredString(w / 2, h * 0.60 + 8 * mm, "MikiLab")
        canvas.setFont("Helvetica-Bold", 19)
        title = bundle_name if len(bundle_name) <= 42 else bundle_name[:40] + "…"
        canvas.drawCentredString(w / 2, h * 0.60 - 18 * mm, title)
        canvas.setFillColor(colors.HexColor("#a9d2ec"))
        canvas.setFont("Helvetica", 12)
        canvas.drawCentredString(w / 2, h * 0.60 - 30 * mm, L["made"])
        canvas.setFont("Helvetica-Oblique", 10)
        canvas.drawCentredString(w / 2, 22 * mm, "Il Laboratorio di Michele · mikilab.de")
        canvas.restoreState()

    for i, r in enumerate(recipes):
        if i > 0:
            story.append(PageBreak())
        name = _r_field(r, "name", lang) or r.get("name") or ""
        story.append(Paragraph(esc(name), h2))
        rn = _r_field(r, "real_name", lang)
        if rn:
            story.append(Paragraph(esc(rn), sub))
        ft = _r_field(r, "flour_type", lang)
        meta = []
        if ft:
            meta.append(f"{L['flour']}: {esc(ft)}")
        if r.get("hydration_percent"):
            meta.append(f"{L['hyd']}: {esc(r.get('hydration_percent'))}%")
        if meta:
            story.append(Paragraph(" · ".join(meta), body))

        # Ingredienti base + extra
        ing_lines = []
        for key, ilabel in [("flour_grams", L["flour"]), ("water_grams", L["water"]),
                            ("sourdough_grams", L["sourdough"]), ("salt_grams", L["salt"])]:
            v = r.get(key)
            if v:
                ing_lines.append(f"{ilabel}: {esc(v)} g")
        for ex in (r.get("extra_ingredients") or []):
            nm = ex.get("name") or ""
            pc = ex.get("percent")
            gr = ex.get("grams")
            det = []
            if gr:
                det.append(f"{esc(gr)} g")
            if pc:
                det.append(f"{esc(pc)}%")
            ing_lines.append(f"{esc(nm)}" + (f" — {' · '.join(det)}" if det else ""))
        if ing_lines:
            story.append(Paragraph(L["ing"], lab))
            story.append(Paragraph("<br/>".join(ing_lines), body))

        proc = _r_field(r, "procedure", lang)
        if proc:
            story.append(Paragraph(L["proc"], lab))
            story.append(Paragraph(esc(proc).replace("\n", "<br/>"), body))

        phases = r.get("work_phases") or []
        if phases:
            story.append(Paragraph(L["phases"], lab))
            pl = []
            for ph in phases:
                t = ph.get("title") or ph.get("name") or ""
                de = ph.get("desc") or ph.get("detail") or ""
                pl.append(f"<b>{esc(t)}</b>" + (f" — {esc(de)}" if de else ""))
            story.append(Paragraph("<br/>".join(pl), body))

        notes = _r_field(r, "notes", lang)
        if notes:
            story.append(Paragraph(L["notes"], lab))
            story.append(Paragraph(esc(notes).replace("\n", "<br/>"), body))

    from reportlab.platypus import PageBreak as _PB
    doc.build([_PB()] + story, onFirstPage=_cover)
    return buf.getvalue()


def _bundle_email_html(bundle_name: str, lang: str) -> str:
    if lang == "de":
        return (f"<div style='font-family:Arial,sans-serif;max-width:520px;margin:auto'>"
                f"<h2 style='color:#234b6e'>Danke für deinen Einkauf! 🥖</h2>"
                f"<p>Dein Paket <b>{bundle_name}</b> ist freigeschaltet. Alle Rezepte findest du "
                f"jetzt in deinem Labor in der MikiLab-App.</p>"
                f"<p>Im Anhang findest du die <b>PDF-Datei</b> mit allen Rezepten des Pakets zum Ausdrucken.</p>"
                f"<p style='color:#888;font-size:12px'>MikiLab · Das Labor von Michele</p></div>")
    if lang == "en":
        return (f"<div style='font-family:Arial,sans-serif;max-width:520px;margin:auto'>"
                f"<h2 style='color:#234b6e'>Thank you for your purchase! 🥖</h2>"
                f"<p>Your <b>{bundle_name}</b> pack is unlocked. All recipes are now available "
                f"in your lab inside the MikiLab app.</p>"
                f"<p>Attached you'll find a <b>PDF</b> with all the recipes in the pack, ready to print.</p>"
                f"<p style='color:#888;font-size:12px'>MikiLab · Michele's Lab</p></div>")
    if lang == "es":
        return (f"<div style='font-family:Arial,sans-serif;max-width:520px;margin:auto'>"
                f"<h2 style='color:#234b6e'>¡Gracias por tu compra! 🥖</h2>"
                f"<p>Tu paquete <b>{bundle_name}</b> ha sido desbloqueado. Todas las recetas están ahora "
                f"disponibles en tu laboratorio dentro de la app MikiLab.</p>"
                f"<p>Adjunto encontrarás un <b>PDF</b> con todas las recetas del paquete, listo para imprimir.</p>"
                f"<p style='color:#888;font-size:12px'>MikiLab · El Laboratorio de Michele</p></div>")
    return (f"<div style='font-family:Arial,sans-serif;max-width:520px;margin:auto'>"
            f"<h2 style='color:#234b6e'>Grazie per il tuo acquisto! 🥖</h2>"
            f"<p>Il pacchetto <b>{bundle_name}</b> è stato sbloccato. Trovi tutte le ricette "
            f"nel tuo laboratorio, dentro l'app MikiLab.</p>"
            f"<p>In allegato trovi un <b>PDF</b> con tutte le ricette del pacchetto, pronto da stampare.</p>"
            f"<p style='color:#888;font-size:12px'>MikiLab · Il Laboratorio di Michele</p></div>")


async def _bundle_fulfill(session_obj, lang: str = "it"):
    """Sblocca il pacchetto, marca pagato e invia email Resend con PDF (idempotente)."""
    sid = session_obj.get("id")
    meta = session_obj.get("metadata") or {}
    tx = await db.payment_transactions.find_one({"session_id": sid})
    email = (tx or {}).get("email") or meta.get("email")
    bundle = (tx or {}).get("bundle") or meta.get("bundle")
    # Lingua: metadata Stripe > transazione salvata > parametro (fallback)
    lang = meta.get("lang") or (tx or {}).get("lang") or lang
    if lang not in ("it", "de", "en", "es"):
        lang = "it"
    if not email or bundle not in BUNDLE_DEFS:
        return
    email = email.strip().lower()
    already_paid = bool(tx and tx.get("payment_status") == "paid")
    # Sblocco entitlement (sempre idempotente via $addToSet)
    await db.entitlements.update_one({"email": email},
        {"$addToSet": {"unlocked_bundles": bundle},
         "$set": {"email": email, "updated_at": now_iso()}}, upsert=True)
    await db.payment_transactions.update_one({"session_id": sid},
        {"$set": {"payment_status": "paid", "paid_at": now_iso()}})
    if already_paid:
        return  # email già inviata in un fulfillment precedente
    # Genera PDF + invia email (best-effort)
    if not RESEND_API_KEY:
        return
    try:
        b = BUNDLE_DEFS[bundle]
        bname = _bundle_name(b, lang)
        docs = await db.recipes.find({"collection_name": "mikilab"}, {"_id": 0}).to_list(1000)
        recipes = [d for d in docs if _recipe_bundle(d) == b["cat"]]
        recipes.sort(key=lambda d: (d.get("name") or "").lower())
        pdf_bytes = await asyncio.to_thread(_build_bundle_pdf, recipes, bname, lang)
        subj = {"de": f"MikiLab · Dein Paket: {bname}",
                "en": f"MikiLab · Your pack: {bname}",
                "es": f"MikiLab · Tu paquete: {bname}"}.get(lang, f"MikiLab · Il tuo pacchetto: {bname}")
        fname = (b["cat"] + "_mikilab.pdf")
        params = {"from": f"MikiLab <{SENDER_EMAIL}>", "to": [email], "subject": subj,
                  "html": _bundle_email_html(bname, lang),
                  "attachments": [{"filename": fname, "content": list(pdf_bytes)}]}
        await asyncio.to_thread(_resend.Emails.send, params)
    except Exception as e:
        logging.getLogger(__name__).error(f"bundle email/pdf failed: {e}")


@api_router.get("/recipes/bundle/checkout/status/{session_id}")
async def bundle_checkout_status(session_id: str, lang: str = "it", user: dict = Depends(current_user)):
    try:
        s = _stripe.checkout.Session.retrieve(session_id)
    except Exception:
        raise HTTPException(404, "Sessione non trovata")
    paid = s.get("payment_status") == "paid"
    if paid:
        await _bundle_fulfill(s, lang=lang)
    return {"payment_status": s.get("payment_status"), "paid": paid}





async def _grant_from_email(email, source="stripe", days=None, tier="lab"):
    """Concede accesso. tier='lab' → PRO completo (laboratorio). tier='home' → solo Academy 'Impara da Casa'."""
    email = (email or "").strip().lower()
    exp = None
    if days:
        exp = (datetime.now(timezone.utc) + timedelta(days=int(days))).isoformat()
    is_lab = tier != "home"
    await db.entitlements.update_one({"email": email},
        {"$set": {"email": email, "pro": is_lab, "academy": True, "plan_tier": tier,
                  "source": source, "expires_at": exp, "updated_at": now_iso()}},
        upsert=True)


# --- Accesso Academy ("Impara da Casa") + acquisto singolo ricette -----------




@api_router.get("/subscription/status")
async def subscription_status(user: Optional[dict] = Depends(optional_user)):
    if not user:
        return {"pro": False, "academy": False, "plan_tier": None, "source": None, "expires_at": None,
                "trial_used": False, "is_admin": False, "unlock_all": False, "unlock_panettoni": False,
                "unlocked_recipes": [], "diagnosi_used": 0, "diagnosi_limit": 0}
    email = user["email"].strip().lower()
    ent = await db.entitlements.find_one({"email": email}, {"_id": 0})
    is_admin = user.get("role") == "admin"
    pro = is_admin
    if ent and ent.get("pro"):
        exp = ent.get("expires_at")
        pro = True if not exp else exp > now_iso()
    academy = pro or (bool((ent or {}).get("academy")) and _ent_active(ent))
    plan_tier = "lab" if pro else ((ent or {}).get("plan_tier") if academy else None)
    # Uso Diagnosi del mese corrente (limite solo per piano home, illimitato per PRO/admin)
    diag_used = 0
    if academy and not pro:
        mk = datetime.now(timezone.utc).strftime("%Y-%m")
        if (ent or {}).get("diagnosi_month") == mk:
            diag_used = int((ent or {}).get("diagnosi_count") or 0)
    return {"pro": pro, "academy": academy, "plan_tier": plan_tier,
            "source": "admin" if (is_admin and not (ent or {}).get("source")) else (ent or {}).get("source"),
            "expires_at": (ent or {}).get("expires_at"),
            "trial_used": bool((ent or {}).get("trial_used")),
            "is_admin": is_admin,
            "unlock_all": bool((ent or {}).get("unlock_all")),
            "unlock_panettoni": bool((ent or {}).get("unlock_panettoni")),
            "unlocked_recipes": list((ent or {}).get("unlocked_recipes") or []),
            "unlocked_bundles": list((ent or {}).get("unlocked_bundles") or []),
            "diagnosi_used": diag_used,
            "diagnosi_limit": (None if pro else (DIAGNOSI_MONTHLY_LIMIT if academy else 0))}


class TrialReq(BaseModel):
    hours: int = 24          # 1 oppure 24


@api_router.post("/trial/activate")
async def activate_trial(body: TrialReq, request: Request, user: dict = Depends(current_user)):
    email = user["email"].strip().lower()
    # SEC-004: blocca domini email usa-e-getta (anti-abuso prova ripetuta)
    DISPOSABLE = {"mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com", "temp-mail.org",
                  "yopmail.com", "trashmail.com", "getnada.com", "throwawaymail.com", "sharklasers.com",
                  "maildrop.cc", "fakeinbox.com", "dispostable.com", "mailnesia.com", "moakt.com", "emailondeck.com"}
    domain = email.split("@")[-1] if "@" in email else ""
    is_admin = user.get("role") == "admin"
    if domain in DISPOSABLE and not is_admin:
        raise HTTPException(400, "Per la prova gratuita usa un indirizzo email valido (non temporaneo).")
    ent = await db.entitlements.find_one({"email": email})
    if ent and ent.get("trial_used"):
        raise HTTPException(400, "Prova già utilizzata")
    # SEC-004: stesso dispositivo/IP non può riattivare la prova con email diverse (30 giorni)
    ip = (request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (request.client.host if request.client else "?"))
    if ip and ip != "?" and not is_admin:
        prior = await db.trial_fingerprints.find_one({"ip": ip, "email": {"$ne": email}})
        if prior:
            raise HTTPException(400, "Una prova gratuita è già stata attivata da questo dispositivo.")
    hours = 1 if int(body.hours) == 1 else 24
    exp = (datetime.now(timezone.utc) + timedelta(hours=hours)).isoformat()
    await db.entitlements.update_one({"email": email},
        {"$set": {"email": email, "pro": True, "source": "trial",
                  "expires_at": exp, "trial_used": True, "updated_at": now_iso()}}, upsert=True)
    if ip and ip != "?":
        await db.trial_fingerprints.update_one({"ip": ip, "email": email},
            {"$set": {"ip": ip, "email": email, "created_at": now_iso()}}, upsert=True)
    return {"pro": True, "source": "trial", "expires_at": exp}


class TrialCardReq(BaseModel):
    origin_url: str


@api_router.post("/trial/checkout")
async def trial_checkout(body: TrialCardReq, user: dict = Depends(current_user)):
    """Prova 7 giorni: raccoglie la carta con Stripe (mode=setup) SENZA addebitare nulla."""
    email = user["email"].strip().lower()
    ent = await db.entitlements.find_one({"email": email})
    if ent and ent.get("trial_used"):
        raise HTTPException(400, "Prova già utilizzata")
    existing = _stripe.Customer.list(email=email, limit=1).data
    customer = existing[0] if existing else _stripe.Customer.create(email=email)
    origin = body.origin_url.rstrip("/")
    session = _stripe.checkout.Session.create(
        mode="setup",
        customer=customer.id,
        managed_payments={"enabled": False},
        payment_method_types=["card"],
        success_url=origin + "/?trial=success&session_id={CHECKOUT_SESSION_ID}",
        cancel_url=origin + "/?trial=cancel",
        metadata={"email": email, "kind": "trial_setup"},
    )
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()), "session_id": session.id, "email": email,
        "kind": "trial_setup", "amount": 0, "currency": "eur",
        "payment_status": "initiated", "created_at": now_iso(),
    })
    return {"url": session.url, "session_id": session.id}


async def _activate_card_trial(email: str, session) -> dict:
    """Concede la prova 7 giorni dopo il salvataggio della carta. NESSUN addebito automatico."""
    email = (email or "").strip().lower()
    ent = await db.entitlements.find_one({"email": email})
    if ent and ent.get("trial_used"):
        return {"pro": bool(ent.get("pro")), "source": ent.get("source"), "expires_at": ent.get("expires_at")}
    pm_id = None
    cust_id = None
    try:
        si = session.get("setup_intent")
        if isinstance(si, str):
            si = _stripe.SetupIntent.retrieve(si)
        if si:
            pm_id = si.get("payment_method")
        cust_id = session.get("customer")
    except Exception:
        pass
    exp = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    await db.entitlements.update_one({"email": email},
        {"$set": {"email": email, "pro": True, "source": "trial_card",
                  "expires_at": exp, "trial_used": True,
                  "stripe_customer_id": cust_id, "stripe_payment_method_id": pm_id,
                  "trial_autocharge": False, "updated_at": now_iso()}}, upsert=True)
    return {"pro": True, "source": "trial_card", "expires_at": exp}


@api_router.get("/trial/checkout/status/{session_id}")
async def trial_checkout_status(session_id: str, user: dict = Depends(current_user)):
    email = user["email"].strip().lower()
    try:
        session = _stripe.checkout.Session.retrieve(session_id, expand=["setup_intent"])
    except Exception:
        raise HTTPException(404, "Sessione non trovata")
    if (session.get("metadata") or {}).get("email") != email:
        raise HTTPException(403, "Non autorizzato")
    if session.get("status") == "complete":
        await db.payment_transactions.update_one({"session_id": session_id},
            {"$set": {"payment_status": "paid", "paid_at": now_iso()}})
        res = await _activate_card_trial(email, session)
        return {"activated": True, **res}
    return {"activated": False}


@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = _stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(400, "Firma non valida")
    t = event["type"]
    obj = event["data"]["object"]
    if t == "checkout.session.completed":
        meta = obj.get("metadata") or {}
        email = meta.get("email") or obj.get("customer_email")
        if meta.get("academy_kind"):
            await _academy_fulfill(obj)
        elif meta.get("recipe_kind"):
            await _recipe_fulfill(obj)
        elif meta.get("kind") == "bundle" and email and meta.get("bundle") in BUNDLE_DEFS:
            await _bundle_fulfill(obj, lang=meta.get("lang", "it"))
        elif meta.get("kind") == "trial_setup" and email:
            try:
                full = _stripe.checkout.Session.retrieve(obj.get("id"), expand=["setup_intent"])
            except Exception:
                full = obj
            await _activate_card_trial(email, full)
        else:
            await db.payment_transactions.update_one({"session_id": obj.get("id")},
                {"$set": {"payment_status": "paid", "paid_at": now_iso()}})
            if email:
                await _grant_from_email(email, "stripe", tier=meta.get("tier", "lab"))
    elif t == "customer.subscription.deleted":
        cust = obj.get("customer")
        try:
            c = _stripe.Customer.retrieve(cust)
            if c.get("email"):
                await db.entitlements.update_one({"email": c["email"]}, {"$set": {"pro": False, "updated_at": now_iso()}})
        except Exception:
            pass
    return {"received": True}


# ---------------------------------------------------------------------------
# ACADEMY: corsi video con paywall (pagamento una tantum) + consulenze 1-to-1
# ---------------------------------------------------------------------------
_DEMO_VIDEO = "https://customer-assets-agu9un31.emergentagent.net/job_edit-33/artifacts/jvsy7ppn_20260820_115442.mp4"
ACADEMY_COURSES = [
    {"id": "corso-lievito-madre", "title": "Lievito Madre da Zero", "title_de": "Sauerteig von Grund auf", "title_en": "Sourdough from Scratch",
     "desc": "Crea e gestisci il tuo lievito madre solido e LiCoLi, dalla nascita al panettone.",
     "desc_de": "Erstelle und pflege deinen festen Sauerteig und LiCoLi, von Anfang bis Panettone.",
     "desc_en": "Create and manage your stiff sourdough and LiCoLi, from birth to panettone.",
     "price_cents": 4900, "duration": "8 lezioni · 2h", "duration_de": "8 Lektionen · 2h", "duration_en": "8 lessons · 2h", "video_url": _DEMO_VIDEO},
    {"id": "corso-panettone", "title": "Panettone Perfetto", "title_de": "Perfekter Panettone", "title_en": "Perfect Panettone",
     "desc": "Il metodo completo per un panettone soffice: impasti, pieghe, cottura e conservazione.",
     "desc_de": "Die komplette Methode für einen fluffigen Panettone: Teige, Faltungen, Backen, Lagerung.",
     "desc_en": "The complete method for a fluffy panettone: doughs, folds, baking and storage.",
     "price_cents": 7900, "duration": "12 lezioni · 3h", "duration_de": "12 Lektionen · 3h", "duration_en": "12 lessons · 3h", "video_url": _DEMO_VIDEO},
    {"id": "corso-brezel", "title": "Brezel & Laugengebäck", "title_de": "Brezel & Laugengebäck", "title_en": "Pretzels & Lye Bakes",
     "desc": "Tecnica tedesca: impasto, formatura, bagno in soda e cottura professionale.",
     "desc_de": "Deutsche Technik: Teig, Formen, Laugenbad und professionelles Backen.",
     "desc_en": "German technique: dough, shaping, lye bath and professional baking.",
     "price_cents": 3900, "duration": "6 lezioni · 1.5h", "duration_de": "6 Lektionen · 1.5h", "duration_en": "6 lessons · 1.5h", "video_url": _DEMO_VIDEO},
]
CONSULT = {"id": "consult-1to1", "title": "Consulenza 1-to-1 con il Maestro", "title_de": "1-zu-1-Beratung mit dem Meister",
           "title_en": "1-to-1 consultation with the Master", "price_cents": 12000, "duration": "60 min · videochiamata",
           "duration_de": "60 Min · Videocall", "duration_en": "60 min · video call"}
_COURSE_BY_ID = {c["id"]: c for c in ACADEMY_COURSES}


def _course_public(c):
    return {k: v for k, v in c.items() if k != "video_url"}


class AcademyCheckoutReq(BaseModel):
    kind: str                       # "course" | "consult"
    origin_url: str
    course_id: Optional[str] = None
    booking: Optional[dict] = None  # {name, date, topic, phone} per consulenza


@api_router.get("/academy/catalog")
async def academy_catalog():
    return {"courses": [_course_public(c) for c in ACADEMY_COURSES], "consult": CONSULT}


@api_router.get("/academy/my")
async def academy_my(user: dict = Depends(current_user)):
    email = user["email"].strip().lower()
    access = await db.academy_access.find({"email": email}, {"_id": 0}).to_list(100)
    owned = {a["course_id"] for a in access}
    courses = [{"id": c["id"], "video_url": c["video_url"], "title": c["title"]} for c in ACADEMY_COURSES if c["id"] in owned]
    bookings = await db.academy_orders.find({"email": email, "kind": "consult", "payment_status": "paid"}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"courses": courses, "bookings": bookings}


@api_router.post("/academy/checkout")
async def academy_checkout(body: AcademyCheckoutReq, user: dict = Depends(current_user)):
    email = user["email"].strip().lower()
    origin = body.origin_url.rstrip("/")
    if body.kind == "course":
        c = _COURSE_BY_ID.get(body.course_id or "")
        if not c:
            raise HTTPException(400, "Corso non trovato")
        title, cents, item_id = c["title"], c["price_cents"], c["id"]
    elif body.kind == "consult":
        title, cents, item_id = CONSULT["title"], CONSULT["price_cents"], CONSULT["id"]
    else:
        raise HTTPException(400, "Tipo non valido")
    session = _stripe.checkout.Session.create(
        mode="payment",
        customer_email=email,
        managed_payments={"enabled": False},
        line_items=[{"price_data": {"currency": "eur", "product_data": {"name": title}, "unit_amount": cents}, "quantity": 1}],
        success_url=origin + "/?academy=success&session_id={CHECKOUT_SESSION_ID}",
        cancel_url=origin + "/?academy=cancel",
        metadata={"email": email, "academy_kind": body.kind, "academy_item": item_id},
    )
    await db.academy_orders.insert_one({
        "id": str(uuid.uuid4()), "session_id": session.id, "email": email,
        "kind": body.kind, "item_id": item_id, "amount": cents, "currency": "eur",
        "booking": body.booking or None, "payment_status": "initiated", "created_at": now_iso(),
    })
    return {"url": session.url, "session_id": session.id}


async def _academy_fulfill(session_obj):
    """Marca l'ordine come pagato e sblocca corso / conferma consulenza."""
    order = await db.academy_orders.find_one({"session_id": session_obj.get("id")})
    if not order or order.get("payment_status") == "paid":
        return order
    await db.academy_orders.update_one({"session_id": session_obj.get("id")},
        {"$set": {"payment_status": "paid", "paid_at": now_iso()}})
    if order["kind"] == "course":
        await db.academy_access.update_one(
            {"email": order["email"], "course_id": order["item_id"]},
            {"$set": {"email": order["email"], "course_id": order["item_id"], "granted_at": now_iso()}}, upsert=True)
    return {**order, "payment_status": "paid"}


@api_router.get("/academy/checkout/status/{session_id}")
async def academy_checkout_status(session_id: str, user: dict = Depends(current_user)):
    try:
        s = _stripe.checkout.Session.retrieve(session_id)
    except Exception:
        raise HTTPException(404, "Sessione non trovata")
    paid = s.get("payment_status") == "paid"
    order = None
    if paid:
        order = await _academy_fulfill(s)
    else:
        order = await db.academy_orders.find_one({"session_id": session_id}, {"_id": 0})
    return {"payment_status": s.get("payment_status"), "paid": paid,
            "kind": (order or {}).get("kind"), "item_id": (order or {}).get("item_id")}



# ---------------------------------------------------------------------------
# Acquisto SINGOLO ricette (pagamento una tantum, senza abbonamento)
# ---------------------------------------------------------------------------
class RecipeCheckoutReq(BaseModel):
    kind: str                       # "single" | "panettoni" | "all"
    origin_url: str
    recipe_id: Optional[str] = None


@api_router.post("/recipe/checkout")
async def recipe_checkout(body: RecipeCheckoutReq, user: dict = Depends(current_user)):
    email = user["email"].strip().lower()
    cents = RECIPE_PRICES.get(body.kind)
    if not cents:
        raise HTTPException(400, "Tipo non valido")
    if body.kind == "single":
        if not body.recipe_id:
            raise HTTPException(400, "Ricetta mancante")
        rec = await db.recipes.find_one({"id": body.recipe_id}, {"_id": 0})
        if not rec:
            raise HTTPException(404, "Ricetta non trovata")
        title = f"Ricetta: {rec.get('name', '')}"
    elif body.kind == "panettoni":
        title = "Tutti i Panettoni MikiLab"
    else:
        title = "Tutte le ricette MikiLab"
    origin = body.origin_url.rstrip("/")
    session = _stripe.checkout.Session.create(
        mode="payment",
        customer_email=email,
        managed_payments={"enabled": False},
        line_items=[{"price_data": {"currency": "eur", "product_data": {"name": title}, "unit_amount": cents}, "quantity": 1}],
        success_url=origin + "/?recipe=success&session_id={CHECKOUT_SESSION_ID}",
        cancel_url=origin + "/?recipe=cancel",
        metadata={"email": email, "recipe_kind": body.kind, "recipe_id": body.recipe_id or ""},
    )
    await db.recipe_orders.insert_one({
        "id": str(uuid.uuid4()), "session_id": session.id, "email": email,
        "kind": body.kind, "recipe_id": body.recipe_id, "amount": cents, "currency": "eur",
        "payment_status": "initiated", "created_at": now_iso(),
    })
    return {"url": session.url, "session_id": session.id}


async def _recipe_fulfill(session_obj):
    order = await db.recipe_orders.find_one({"session_id": session_obj.get("id")})
    meta = session_obj.get("metadata") or {}
    email = (order or {}).get("email") or meta.get("email")
    kind = (order or {}).get("kind") or meta.get("recipe_kind")
    rid = (order or {}).get("recipe_id") or meta.get("recipe_id")
    if not email or not kind:
        return order
    if order and order.get("payment_status") == "paid":
        return order
    email = email.strip().lower()
    if kind == "all":
        upd = {"$set": {"unlock_all": True, "updated_at": now_iso()}}
    elif kind == "panettoni":
        upd = {"$set": {"unlock_panettoni": True, "updated_at": now_iso()}}
    else:
        upd = {"$addToSet": {"unlocked_recipes": rid}, "$set": {"updated_at": now_iso()}}
    await db.entitlements.update_one({"email": email}, {**upd, "$setOnInsert": {"email": email}}, upsert=True)
    if order:
        await db.recipe_orders.update_one({"session_id": session_obj.get("id")},
            {"$set": {"payment_status": "paid", "paid_at": now_iso()}})
    return {**(order or {}), "payment_status": "paid"}


@api_router.get("/recipe/checkout/status/{session_id}")
async def recipe_checkout_status(session_id: str, user: dict = Depends(current_user)):
    try:
        s = _stripe.checkout.Session.retrieve(session_id)
    except Exception:
        raise HTTPException(404, "Sessione non trovata")
    paid = s.get("payment_status") == "paid"
    if paid:
        await _recipe_fulfill(s)
    return {"payment_status": s.get("payment_status"), "paid": paid}


# ---------------------------------------------------------------------------
# Admin: coupon / inviti VIP (accesso PRO gratuito, illimitato o a tempo)
# ---------------------------------------------------------------------------
class GrantReq(BaseModel):
    email: str
    days: Optional[int] = None   # None = illimitato
    tier: str = "lab"            # "lab" (PRO completo) | "home" (Academy)


@api_router.get("/admin/entitlements")
async def admin_list_entitlements(admin: dict = Depends(require_admin)):
    ents = await db.entitlements.find({}, {"_id": 0}).sort("updated_at", -1).to_list(500)
    out = []
    for e in ents:
        exp = e.get("expires_at")
        active = bool(e.get("pro")) and (not exp or exp > now_iso())
        out.append({"email": e.get("email"), "pro": bool(e.get("pro")), "active": active,
                    "source": e.get("source"), "expires_at": exp, "trial_used": bool(e.get("trial_used"))})
    return out


@api_router.post("/admin/grant")
async def admin_grant(body: GrantReq, admin: dict = Depends(require_admin)):
    email = (body.email or "").strip().lower()
    if not email or "@" not in email:
        raise HTTPException(400, "Email non valida")
    await _grant_from_email(email, source="vip", days=body.days, tier=body.tier)
    ent = await db.entitlements.find_one({"email": email}, {"_id": 0})
    return {"ok": True, "email": email, "expires_at": (ent or {}).get("expires_at")}


@api_router.post("/admin/revoke")
async def admin_revoke(body: GrantReq, admin: dict = Depends(require_admin)):
    email = (body.email or "").strip().lower()
    await db.entitlements.update_one({"email": email},
        {"$set": {"pro": False, "academy": False, "plan_tier": None, "expires_at": None, "updated_at": now_iso()}})
    return {"ok": True, "email": email}


# ---------------------------------------------------------------------------
# Password reset (Resend email)
# ---------------------------------------------------------------------------
import resend as _resend
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "noreply@mikilab.de")
if RESEND_API_KEY:
    _resend.api_key = RESEND_API_KEY


class ForgotReq(BaseModel):
    email: str
    origin_url: Optional[str] = None
    lang: str = "it"


class ResetReq(BaseModel):
    token: str
    password: str


def _reset_email_html(link: str, de: bool) -> str:
    if de:
        return (f"<div style='font-family:Arial,sans-serif;max-width:480px;margin:auto'>"
                f"<h2 style='color:#B34A26'>Mikilab · Passwort zurücksetzen</h2>"
                f"<p>Du hast angefordert, dein Passwort zurückzusetzen. Klicke auf den Button "
                f"(gültig für 1 Stunde):</p>"
                f"<p><a href='{link}' style='background:#B34A26;color:#fff;text-decoration:none;"
                f"padding:12px 22px;border-radius:12px;font-weight:bold;display:inline-block'>Passwort ändern</a></p>"
                f"<p style='color:#888;font-size:12px'>Wenn du das nicht warst, ignoriere diese E-Mail.</p></div>")
    return (f"<div style='font-family:Arial,sans-serif;max-width:480px;margin:auto'>"
            f"<h2 style='color:#B34A26'>Mikilab · Reimposta la password</h2>"
            f"<p>Hai richiesto di reimpostare la password. Clicca sul pulsante "
            f"(valido per 1 ora):</p>"
            f"<p><a href='{link}' style='background:#B34A26;color:#fff;text-decoration:none;"
            f"padding:12px 22px;border-radius:12px;font-weight:bold;display:inline-block'>Cambia password</a></p>"
            f"<p style='color:#888;font-size:12px'>Se non sei stato tu, ignora questa email.</p></div>")


@api_router.post("/auth/forgot-password")
async def forgot_password(body: ForgotReq, request: Request):
    email = (body.email or "").strip().lower()
    # Anti-spam: max 10 richieste/ora per IP e 3/ora per email
    if not await _rate_limit("forgot_ip", _client_ip(request), 10, 3600):
        raise HTTPException(status_code=429, detail="Troppe richieste. Riprova più tardi.")
    if email and not await _rate_limit("forgot_email", email, 3, 3600):
        raise HTTPException(status_code=429, detail="Troppe richieste per questa email. Riprova più tardi.")
    # Non riveliamo se l'email esiste (anti-enumeration). Rispondiamo sempre ok.
    u = await db.users.find_one({"email": email, "auth_provider": "email"})
    if u and RESEND_API_KEY:
        token = secrets.token_urlsafe(32)
        exp = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
        await db.password_resets.update_one(
            {"email": email},
            {"$set": {"email": email, "token": token, "expires_at": exp, "created_at": now_iso()}},
            upsert=True,
        )
        origin = (body.origin_url or "").rstrip("/")
        link = f"{origin}/?reset={token}"
        try:
            params = {"from": f"Mikilab <{SENDER_EMAIL}>", "to": [email],
                      "subject": "Mikilab · Reset password" if body.lang != "de" else "Mikilab · Passwort zurücksetzen",
                      "html": _reset_email_html(link, body.lang == "de")}
            await asyncio.to_thread(_resend.Emails.send, params)
        except Exception as e:
            logging.getLogger(__name__).error(f"reset email send failed: {e}")
    return {"ok": True}


@api_router.post("/auth/reset-password")
async def reset_password(body: ResetReq):
    _validate_password(body.password or "")
    rec = await db.password_resets.find_one({"token": body.token}, {"_id": 0})
    if not rec:
        raise HTTPException(400, "Link non valido o già usato")
    exp = rec.get("expires_at")
    if exp and exp < now_iso():
        raise HTTPException(400, "Link scaduto, richiedine uno nuovo")
    await db.users.update_one({"email": rec["email"]}, {"$set": {"password_hash": _hash_pw(body.password)}})
    await db.password_resets.delete_one({"token": body.token})
    # invalida tutte le sessioni esistenti dell'utente
    u = await db.users.find_one({"email": rec["email"]}, {"_id": 0, "user_id": 1})
    if u:
        await db.user_sessions.delete_many({"user_id": u["user_id"]})
    return {"ok": True}


# ---------------------------------------------------------------------------
# Scorte Freezer + avviso email (soglia minima) — per utente loggato
# ---------------------------------------------------------------------------
class FreezerItem(BaseModel):
    name: str
    qty: float = 0
    min_qty: float = 0


class FreezerSave(BaseModel):
    items: List[FreezerItem] = []


def _freezer_email_html(low, de: bool) -> str:
    rows = "".join(
        f"<tr><td style='padding:6px 10px'>{i['name']}</td>"
        f"<td style='padding:6px 10px;text-align:right;color:#B4442A;font-weight:bold'>{i['qty']}</td>"
        f"<td style='padding:6px 10px;text-align:right;color:#8C7567'>{i['min_qty']}</td></tr>"
        for i in low
    )
    if de:
        return (f"<div style='font-family:Arial,sans-serif;max-width:520px;margin:auto'>"
                f"<h2 style='color:#B34A26'>Mikilab · Gefrier-Bestand niedrig</h2>"
                f"<p>Folgende Produkte sind unter der Mindestmenge:</p>"
                f"<table style='border-collapse:collapse;width:100%'><tr style='background:#F5EFE6'>"
                f"<th style='padding:6px 10px;text-align:left'>Produkt</th><th style='padding:6px 10px'>Bestand</th><th style='padding:6px 10px'>Min.</th></tr>{rows}</table></div>")
    return (f"<div style='font-family:Arial,sans-serif;max-width:520px;margin:auto'>"
            f"<h2 style='color:#B34A26'>Mikilab · Scorta freezer bassa</h2>"
            f"<p>Questi prodotti sono sotto la soglia minima:</p>"
            f"<table style='border-collapse:collapse;width:100%'><tr style='background:#F5EFE6'>"
            f"<th style='padding:6px 10px;text-align:left'>Prodotto</th><th style='padding:6px 10px'>Scorta</th><th style='padding:6px 10px'>Min.</th></tr>{rows}</table></div>")


@api_router.get("/freezer")
async def get_freezer(user: dict = Depends(current_user)):
    doc = await db.freezer_stock.find_one({"owner_id": user["user_id"]}, {"_id": 0})
    return {"items": (doc or {}).get("items", [])}


@api_router.put("/freezer")
async def save_freezer(body: FreezerSave, lang: str = "it", user: dict = Depends(current_user)):
    items = [i.model_dump() for i in body.items]
    await db.freezer_stock.update_one(
        {"owner_id": user["user_id"]},
        {"$set": {"owner_id": user["user_id"], "items": items, "updated_at": now_iso()}},
        upsert=True,
    )
    low = [i for i in items if i.get("min_qty") and float(i["qty"]) < float(i["min_qty"])]
    emailed = False
    if low and RESEND_API_KEY and user.get("email"):
        try:
            params = {"from": f"Mikilab <{SENDER_EMAIL}>", "to": [user["email"]],
                      "subject": "Mikilab · Scorta freezer bassa" if lang != "de" else "Mikilab · Gefrier-Bestand niedrig",
                      "html": _freezer_email_html(low, lang == "de")}
            await asyncio.to_thread(_resend.Emails.send, params)
            emailed = True
        except Exception as e:
            logging.getLogger(__name__).error(f"freezer email failed: {e}")
    return {"ok": True, "low": low, "emailed": emailed}


# ---------------------------------------------------------------------------
# Shop & Academy ("Coming Soon") — catalogo + lista d'attesa + toggle admin
# ---------------------------------------------------------------------------
SHOP_SEED = [
    {"id": "p-classico", "kind": "panettone", "name": "Panettone Classico", "name_de": "Panettone Klassik", "name_en": "Classic Panettone", "name_es": "Panettone Clásico",
     "desc": "Uvetta e canditi, lievito madre, 36h di lievitazione.", "desc_de": "Rosinen und kandierte Früchte, Sauerteig, 36h Gärung.", "desc_en": "Raisins and candied fruit, sourdough, 36h leavening.", "desc_es": "Pasas y frutas confitadas, masa madre, 36h de fermentación.",
     "sizes": ["500g", "750g", "1000g"], "image_url": "/recipes/pan_classico.jpg",
     "allergens": "Glutine, Uova, Latte", "allergens_de": "Gluten, Eier, Milch", "allergens_en": "Gluten, Eggs, Milk", "allergens_es": "Gluten, Huevos, Leche", "active": True},
    {"id": "p-cioccolato", "kind": "panettone", "name": "Panettone Cioccolato e Noci", "name_de": "Panettone Schokolade & Nüsse", "name_en": "Chocolate & Walnut Panettone", "name_es": "Panettone Chocolate y Nueces",
     "desc": "Gocce di cioccolato fondente e noci.", "desc_de": "Zartbitter-Schokostückchen und Walnüsse.", "desc_en": "Dark chocolate chips and walnuts.", "desc_es": "Pepitas de chocolate negro y nueces.",
     "sizes": ["500g", "1000g"], "image_url": "/recipes/pan_cioc_noci.jpg",
     "allergens": "Glutine, Uova, Latte, Frutta a guscio", "allergens_de": "Gluten, Eier, Milch, Schalenfrüchte", "allergens_en": "Gluten, Eggs, Milk, Nuts", "allergens_es": "Gluten, Huevos, Leche, Frutos secos", "active": True},
    {"id": "p-pistacchio", "kind": "panettone", "name": "Panettone Pistacchio", "name_de": "Panettone Pistazie", "name_en": "Pistachio Panettone", "name_es": "Panettone Pistacho",
     "desc": "Cioccolato bianco e pistacchio.", "desc_de": "Weiße Schokolade und Pistazie.", "desc_en": "White chocolate and pistachio.", "desc_es": "Chocolate blanco y pistacho.",
     "sizes": ["500g", "1000g"], "image_url": "/recipes/pan_pistacchio.jpg",
     "allergens": "Glutine, Uova, Latte, Frutta a guscio", "allergens_de": "Gluten, Eier, Milch, Schalenfrüchte", "allergens_en": "Gluten, Eggs, Milk, Nuts", "allergens_es": "Gluten, Huevos, Leche, Frutos secos", "active": True},
    {"id": "c-lievitati", "kind": "corso", "name": "Masterclass Grandi Lievitati", "name_de": "Masterclass Große Hefegebäcke", "name_en": "Big Leavened Cakes Masterclass", "name_es": "Masterclass Grandes Levados",
     "desc": "Corso online sul panettone col metodo Mikilab (lievito madre, 2 impasti).", "desc_de": "Online-Kurs zum Panettone nach Mikilab-Methode (Sauerteig, 2 Teige).", "desc_en": "Online panettone course with the Mikilab method (sourdough, 2 doughs).", "desc_es": "Curso online de panettone con el método Mikilab (masa madre, 2 masas).",
     "sizes": ["Online"], "image_url": "/recipes/r_panettone_base.jpg",
     "allergens": "", "active": True},
    {"id": "c-basi", "kind": "corso", "name": "Corso Basi del Pane", "name_de": "Kurs Brot-Grundlagen", "name_en": "Bread Basics Course", "name_es": "Curso Bases del Pan",
     "desc": "Per principianti: pane casereccio, pizza in teglia, focaccia.", "desc_de": "Für Anfänger: Hausbrot, Blechpizza, Focaccia.", "desc_en": "For beginners: home bread, pan pizza, focaccia.", "desc_es": "Para principiantes: pan casero, pizza en bandeja, focaccia.",
     "sizes": ["Online"], "image_url": "/recipes/r_cuore.jpg",
     "allergens": "", "active": True},
]


async def seed_shop_if_empty():
    if await db.shop_products.count_documents({}) == 0:
        await db.shop_products.insert_many([dict(p) for p in SHOP_SEED])
    else:
        # patch idempotente delle traduzioni EN/DE sui prodotti già esistenti
        for p in SHOP_SEED:
            tr = {k: v for k, v in p.items() if k.endswith("_en") or k.endswith("_de") or k.endswith("_es")}
            if tr:
                await db.shop_products.update_one({"id": p["id"]}, {"$set": tr})
    if not await db.app_meta.find_one({"_key": "shop_settings"}):
        await db.app_meta.update_one({"_key": "shop_settings"},
            {"$set": {"_key": "shop_settings", "enabled": False}}, upsert=True)  # default: Coming Soon


@api_router.get("/shop/products")
async def shop_products():
    await seed_shop_if_empty()
    settings = await db.app_meta.find_one({"_key": "shop_settings"}, {"_id": 0})
    prods = await db.shop_products.find({"active": True}, {"_id": 0}).to_list(200)
    return {"enabled": bool((settings or {}).get("enabled")), "products": prods}


class WaitlistReq(BaseModel):
    email: str
    product_id: Optional[str] = None
    lang: str = "it"


@api_router.post("/shop/waitlist")
async def shop_waitlist(body: WaitlistReq):
    email = (body.email or "").strip().lower()
    if not email or "@" not in email:
        raise HTTPException(400, "Email non valida")
    await db.shop_waitlist.update_one(
        {"email": email, "product_id": body.product_id},
        {"$set": {"email": email, "product_id": body.product_id, "created_at": now_iso()}},
        upsert=True,
    )
    return {"ok": True}


@api_router.get("/admin/shop/settings")
async def admin_shop_get(admin: dict = Depends(require_admin)):
    settings = await db.app_meta.find_one({"_key": "shop_settings"}, {"_id": 0})
    n = await db.shop_waitlist.count_documents({})
    return {"enabled": bool((settings or {}).get("enabled")), "waitlist_count": n}


class ShopSettingsReq(BaseModel):
    enabled: bool


@api_router.put("/admin/shop/settings")
async def admin_shop_set(body: ShopSettingsReq, admin: dict = Depends(require_admin)):
    await db.app_meta.update_one({"_key": "shop_settings"},
        {"$set": {"_key": "shop_settings", "enabled": bool(body.enabled)}}, upsert=True)
    return {"ok": True, "enabled": bool(body.enabled)}


@api_router.get("/admin/shop/waitlist")
async def admin_shop_waitlist(admin: dict = Depends(require_admin)):
    rows = await db.shop_waitlist.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return rows


# ---------------------------------------------------------------------------
# Impostazioni sito editabili dall'admin: numero WhatsApp, testi fumetti avatar,
# copertine delle cartelle ricette. Lettura pubblica, scrittura solo admin.
# ---------------------------------------------------------------------------
DEFAULT_SITE_SETTINGS = {
    "whatsapp_number": "491601253378",
    "avatar_bubbles": {},   # override keyed "impara.michele" -> {"it": "...", "de": "..."}
    "folder_covers": {},    # {"pane": "<url>", "panettoni": "<url>", ...}
}


def _merge_site_settings(doc):
    s = dict(DEFAULT_SITE_SETTINGS)
    if doc:
        for k in ("whatsapp_number", "avatar_bubbles", "folder_covers"):
            if doc.get(k) is not None:
                s[k] = doc[k]
    return s


@api_router.get("/site-settings")
async def get_site_settings():
    doc = await db.app_meta.find_one({"_key": "site_settings"}, {"_id": 0, "_key": 0})
    return _merge_site_settings(doc)


class SiteSettingsReq(BaseModel):
    whatsapp_number: Optional[str] = None
    avatar_bubbles: Optional[dict] = None
    folder_covers: Optional[dict] = None


@api_router.put("/admin/site-settings")
async def admin_site_settings_set(body: SiteSettingsReq, admin: dict = Depends(require_admin)):
    update = {"_key": "site_settings"}
    if body.whatsapp_number is not None:
        num = "".join(ch for ch in body.whatsapp_number if ch.isdigit())
        if num.startswith("00"):
            num = num[2:]  # 0049... -> 49... (prefisso internazionale per wa.me)
        update["whatsapp_number"] = num
    if body.avatar_bubbles is not None:
        update["avatar_bubbles"] = body.avatar_bubbles
    if body.folder_covers is not None:
        update["folder_covers"] = body.folder_covers
    await db.app_meta.update_one({"_key": "site_settings"}, {"$set": update}, upsert=True)
    doc = await db.app_meta.find_one({"_key": "site_settings"}, {"_id": 0, "_key": 0})
    return _merge_site_settings(doc)



# ---------------------------------------------------------------------------
# Community B2B — bacheca condivisa (consigli, foto, ricette) tra panettieri
# ---------------------------------------------------------------------------
COMMUNITY_CATEGORIES = {"consiglio", "foto", "ricetta", "domanda"}


class CommunityPostReq(BaseModel):
    category: str = "consiglio"
    text: str = Field("", max_length=4000)
    image_url: Optional[str] = None


class CommunityCommentReq(BaseModel):
    text: str = Field(..., max_length=1000)


def _post_public(doc: dict, user: Optional[dict]) -> dict:
    likes = doc.get("likes", []) or []
    return {
        "id": doc["id"],
        "author_id": doc.get("author_id"),
        "author_name": doc.get("author_name") or "Fornaio",
        "category": doc.get("category", "consiglio"),
        "text": doc.get("text", ""),
        "text_de": doc.get("text_de"),
        "text_en": doc.get("text_en"),
        "text_es": doc.get("text_es"),
        "image_url": doc.get("image_url"),
        "created_at": doc.get("created_at"),
        "like_count": len(likes),
        "liked_by_me": bool(user and user.get("user_id") in likes),
        "comments": doc.get("comments", []) or [],
        "can_delete": bool(user and (user.get("user_id") == doc.get("author_id") or user.get("role") == "admin")),
    }


@api_router.get("/community/posts")
async def community_list(request: Request, limit: int = 200):
    user = await optional_user(request)
    limit = max(1, min(limit, 500))
    docs = await db.community_posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return [_post_public(d, user) for d in docs]


@api_router.post("/community/posts")
async def community_create(body: CommunityPostReq, user: dict = Depends(current_user)):
    text = (body.text or "").strip()
    if not text and not body.image_url:
        raise HTTPException(400, "Scrivi un messaggio o allega una foto")
    cat = body.category if body.category in COMMUNITY_CATEGORIES else "consiglio"
    tr = await _translate_text_multi(text) if text else {}
    doc = {
        "id": str(uuid.uuid4()),
        "author_id": user["user_id"],
        "author_name": user.get("name") or (user.get("email") or "Fornaio").split("@")[0],
        "category": cat,
        "text": text,
        "text_de": tr.get("text_de"),
        "text_en": tr.get("text_en"),
        "text_es": tr.get("text_es"),
        "image_url": body.image_url,
        "created_at": now_iso(),
        "likes": [],
        "comments": [],
    }
    await db.community_posts.insert_one(doc)
    return _post_public(doc, user)


@api_router.post("/community/posts/{post_id}/like")
async def community_like(post_id: str, user: dict = Depends(current_user)):
    doc = await db.community_posts.find_one({"id": post_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Post non trovato")
    likes = set(doc.get("likes", []) or [])
    uid_ = user["user_id"]
    added = uid_ not in likes
    if uid_ in likes:
        likes.discard(uid_)
    else:
        likes.add(uid_)
    await db.community_posts.update_one({"id": post_id}, {"$set": {"likes": list(likes)}})
    doc["likes"] = list(likes)
    if added:
        await _notify(doc.get("author_id"), uid_, "like", post_id, user.get("name") or (user.get("email") or "Fornaio").split("@")[0], doc.get("text", ""))
    return _post_public(doc, user)


@api_router.post("/community/posts/{post_id}/comments")
async def community_comment(post_id: str, body: CommunityCommentReq, user: dict = Depends(current_user)):
    text = (body.text or "").strip()
    if not text:
        raise HTTPException(400, "Commento vuoto")
    doc = await db.community_posts.find_one({"id": post_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Post non trovato")
    actor = user.get("name") or (user.get("email") or "Fornaio").split("@")[0]
    ctr = await _translate_text_multi(text)
    comment = {
        "id": str(uuid.uuid4()),
        "author_id": user["user_id"],
        "author_name": actor,
        "text": text,
        "text_de": ctr.get("text_de"),
        "text_en": ctr.get("text_en"),
        "text_es": ctr.get("text_es"),
        "created_at": now_iso(),
    }
    await db.community_posts.update_one({"id": post_id}, {"$push": {"comments": comment}})
    doc.setdefault("comments", []).append(comment)
    await _notify(doc.get("author_id"), user["user_id"], "comment", post_id, actor, text)
    return _post_public(doc, user)


@api_router.delete("/community/posts/{post_id}")
async def community_delete(post_id: str, user: dict = Depends(current_user)):
    doc = await db.community_posts.find_one({"id": post_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Post non trovato")
    if doc.get("author_id") != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(403, "Non puoi eliminare questo post")
    await db.community_posts.delete_one({"id": post_id})
    await db.notifications.delete_many({"post_id": post_id})
    return {"ok": True}


# --- Sistema Amici (richieste + accetta/rifiuta + elenco utenti) --------------
class FriendReq(BaseModel):
    to_id: str

class FriendRespReq(BaseModel):
    from_id: str
    action: str  # accept | decline

class FriendRemoveReq(BaseModel):
    other_id: str


def _user_card(u: dict) -> dict:
    return {
        "user_id": u.get("user_id"),
        "name": u.get("name") or (u.get("email") or "Fornaio").split("@")[0],
        "picture": u.get("picture") or "",
    }


async def _friendship(a: str, b: str):
    return await db.friendships.find_one(
        {"$or": [{"from_id": a, "to_id": b}, {"from_id": b, "to_id": a}]}, {"_id": 0}
    )


def _rel_status(fr: dict, me: str) -> str:
    if not fr:
        return "none"
    if fr.get("status") == "accepted":
        return "friends"
    return "outgoing" if fr.get("from_id") == me else "incoming"


@api_router.get("/users/directory")
async def users_directory(user: dict = Depends(current_user)):
    me = user["user_id"]
    users = await db.users.find({"user_id": {"$ne": me}}, {"_id": 0}).to_list(500)
    frs = await db.friendships.find(
        {"$or": [{"from_id": me}, {"to_id": me}]}, {"_id": 0}
    ).to_list(1000)
    rel = {}
    for f in frs:
        other = f["to_id"] if f["from_id"] == me else f["from_id"]
        rel[other] = _rel_status(f, me)
    out = []
    for u in users:
        card = _user_card(u)
        card["status"] = rel.get(u.get("user_id"), "none")
        out.append(card)
    out.sort(key=lambda c: (c["status"] != "friends", c["name"].lower()))
    return out


@api_router.get("/friends")
async def friends_list(user: dict = Depends(current_user)):
    me = user["user_id"]
    frs = await db.friendships.find(
        {"$or": [{"from_id": me}, {"to_id": me}]}, {"_id": 0}
    ).to_list(1000)
    friend_ids, incoming_ids, outgoing_ids = [], [], []
    for f in frs:
        other = f["to_id"] if f["from_id"] == me else f["from_id"]
        st = _rel_status(f, me)
        (friend_ids if st == "friends" else incoming_ids if st == "incoming" else outgoing_ids).append(other)

    async def cards(ids):
        if not ids:
            return []
        us = await db.users.find({"user_id": {"$in": ids}}, {"_id": 0}).to_list(500)
        return [_user_card(u) for u in us]

    return {"friends": await cards(friend_ids), "incoming": await cards(incoming_ids), "outgoing": await cards(outgoing_ids)}


@api_router.post("/friends/request")
async def friends_request(body: FriendReq, user: dict = Depends(current_user)):
    me = user["user_id"]
    if body.to_id == me:
        raise HTTPException(400, "Non puoi aggiungere te stesso")
    target = await db.users.find_one({"user_id": body.to_id}, {"_id": 0})
    if not target:
        raise HTTPException(404, "Utente non trovato")
    existing = await _friendship(me, body.to_id)
    if existing:
        return {"status": _rel_status(existing, me)}
    await db.friendships.insert_one({
        "id": str(uuid.uuid4()), "from_id": me, "to_id": body.to_id,
        "status": "pending", "created_at": now_iso(),
    })
    return {"status": "outgoing"}


@api_router.post("/friends/respond")
async def friends_respond(body: FriendRespReq, user: dict = Depends(current_user)):
    me = user["user_id"]
    fr = await db.friendships.find_one({"from_id": body.from_id, "to_id": me, "status": "pending"}, {"_id": 0})
    if not fr:
        raise HTTPException(404, "Richiesta non trovata")
    if body.action == "accept":
        await db.friendships.update_one({"id": fr["id"]}, {"$set": {"status": "accepted", "accepted_at": now_iso()}})
        return {"status": "friends"}
    await db.friendships.delete_one({"id": fr["id"]})
    return {"status": "none"}


@api_router.post("/friends/remove")
async def friends_remove(body: FriendRemoveReq, user: dict = Depends(current_user)):
    me = user["user_id"]
    fr = await _friendship(me, body.other_id)
    if fr:
        await db.friendships.delete_one({"id": fr["id"]})
    return {"status": "none"}



# --- Notifiche Community (like/commenti sui propri post) ---
async def _notify(recipient_id, actor_id, ntype, post_id, actor_name, snippet):
    if not recipient_id or recipient_id == actor_id:
        return  # non notificare sé stessi
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()), "user_id": recipient_id, "actor_id": actor_id,
        "type": ntype, "post_id": post_id, "actor_name": actor_name,
        "snippet": (snippet or "")[:80], "read": False, "created_at": now_iso(),
    })


@api_router.get("/notifications")
async def notifications_list(user: dict = Depends(current_user)):
    docs = await db.notifications.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    unread = await db.notifications.count_documents({"user_id": user["user_id"], "read": False})
    return {"items": docs, "unread": unread}


@api_router.post("/notifications/read")
async def notifications_read(user: dict = Depends(current_user)):
    await db.notifications.update_many({"user_id": user["user_id"], "read": False}, {"$set": {"read": True}})
    return {"ok": True}


# ---------------------------------------------------------------------------
# Enterprise — Multi-Negozio (21) + Ordini Multi-Fornitore (23)
# Dati salvati sul backend e separati per proprietario (user) e per negozio.
# ---------------------------------------------------------------------------
class StoreReq(BaseModel):
    name: str = Field(..., max_length=120)
    address: Optional[str] = Field("", max_length=300)
    phone: Optional[str] = Field("", max_length=60)
    note: Optional[str] = Field("", max_length=1000)


def _store_public(d: dict) -> dict:
    return {"id": d["id"], "name": d.get("name"), "address": d.get("address", ""), "phone": d.get("phone", ""), "note": d.get("note", ""), "created_at": d.get("created_at")}


@api_router.get("/stores")
async def stores_list(user: dict = Depends(require_pro)):
    docs = await db.stores.find({"owner_id": user["user_id"]}, {"_id": 0}).sort("created_at", 1).to_list(200)
    return [_store_public(d) for d in docs]


@api_router.post("/stores")
async def stores_create(body: StoreReq, user: dict = Depends(require_pro)):
    doc = {"id": str(uuid.uuid4()), "owner_id": user["user_id"], "name": body.name.strip(), "address": (body.address or "").strip(), "phone": (body.phone or "").strip(), "note": (body.note or "").strip(), "created_at": now_iso()}
    await db.stores.insert_one(doc)
    return _store_public(doc)


@api_router.put("/stores/{store_id}")
async def stores_update(store_id: str, body: StoreReq, user: dict = Depends(require_pro)):
    doc = await db.stores.find_one({"id": store_id, "owner_id": user["user_id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Negozio non trovato")
    upd = {"name": body.name.strip(), "address": (body.address or "").strip(), "phone": (body.phone or "").strip(), "note": (body.note or "").strip()}
    await db.stores.update_one({"id": store_id}, {"$set": upd})
    doc.update(upd)
    return _store_public(doc)


@api_router.delete("/stores/{store_id}")
async def stores_delete(store_id: str, user: dict = Depends(require_pro)):
    res = await db.stores.delete_one({"id": store_id, "owner_id": user["user_id"]})
    if res.deleted_count == 0:
        raise HTTPException(404, "Negozio non trovato")
    return {"ok": True}


ORDER_STATUSES = {"bozza", "inviato", "ricevuto"}


class OrderItem(BaseModel):
    name: str = Field(..., max_length=160)
    qty: float = 0
    unit: str = Field("kg", max_length=20)
    price: Optional[float] = None


class OrderReq(BaseModel):
    store_id: Optional[str] = None
    supplier: str = Field(..., max_length=160)
    supplier_email: Optional[str] = Field("", max_length=160)
    items: List[OrderItem] = []
    note: Optional[str] = Field("", max_length=1000)
    status: Optional[str] = "bozza"


def _order_total(items: List[dict]) -> float:
    tot = 0.0
    for it in items:
        q = it.get("qty") or 0
        p = it.get("price")
        if p is not None:
            tot += float(q) * float(p)
    return round(tot, 2)


def _order_public(d: dict) -> dict:
    return {
        "id": d["id"], "store_id": d.get("store_id"), "supplier": d.get("supplier"),
        "supplier_email": d.get("supplier_email", ""), "items": d.get("items", []),
        "note": d.get("note", ""), "status": d.get("status", "bozza"),
        "total": d.get("total", 0), "created_at": d.get("created_at"),
    }


@api_router.get("/purchase-orders")
async def orders_list(user: dict = Depends(require_pro), store_id: Optional[str] = None):
    q = {"owner_id": user["user_id"]}
    if store_id:
        q["store_id"] = store_id
    docs = await db.purchase_orders.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [_order_public(d) for d in docs]


@api_router.post("/purchase-orders")
async def orders_create(body: OrderReq, user: dict = Depends(require_pro)):
    items = [i.dict() for i in body.items]
    status = body.status if body.status in ORDER_STATUSES else "bozza"
    doc = {
        "id": str(uuid.uuid4()), "owner_id": user["user_id"], "store_id": body.store_id,
        "supplier": body.supplier.strip(), "supplier_email": (body.supplier_email or "").strip(),
        "items": items, "note": (body.note or "").strip(), "status": status,
        "total": _order_total(items), "created_at": now_iso(),
    }
    await db.purchase_orders.insert_one(doc)
    return _order_public(doc)


@api_router.put("/purchase-orders/{order_id}")
async def orders_update(order_id: str, body: OrderReq, user: dict = Depends(require_pro)):
    doc = await db.purchase_orders.find_one({"id": order_id, "owner_id": user["user_id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Ordine non trovato")
    items = [i.dict() for i in body.items]
    status = body.status if body.status in ORDER_STATUSES else doc.get("status", "bozza")
    upd = {
        "store_id": body.store_id, "supplier": body.supplier.strip(),
        "supplier_email": (body.supplier_email or "").strip(), "items": items,
        "note": (body.note or "").strip(), "status": status, "total": _order_total(items),
    }
    await db.purchase_orders.update_one({"id": order_id}, {"$set": upd})
    doc.update(upd)
    return _order_public(doc)


@api_router.delete("/purchase-orders/{order_id}")
async def orders_delete(order_id: str, user: dict = Depends(require_pro)):
    res = await db.purchase_orders.delete_one({"id": order_id, "owner_id": user["user_id"]})
    if res.deleted_count == 0:
        raise HTTPException(404, "Ordine non trovato")
    return {"ok": True}


# ---------------------------------------------------------------------------
# QR pubblico del Lotto (25) — pubblica una scheda lotto e servi una pagina
# pubblica di tracciabilità (nessuna autenticazione in lettura).
# ---------------------------------------------------------------------------
class PubBatchReq(BaseModel):
    code: str = Field(..., max_length=60)
    product: str = Field(..., max_length=160)
    prod_date: Optional[str] = Field("", max_length=40)
    expiry: Optional[str] = Field("", max_length=40)
    flour: Optional[str] = Field("", max_length=200)
    flour_lot: Optional[str] = Field("", max_length=120)
    qty: Optional[str] = Field("", max_length=80)
    operator: Optional[str] = Field("", max_length=120)
    note: Optional[str] = Field("", max_length=1000)
    store_name: Optional[str] = Field("", max_length=160)


def _pub_batch_public(d: dict) -> dict:
    return {
        "id": d["id"], "code": d.get("code"), "product": d.get("product"),
        "prod_date": d.get("prod_date", ""), "expiry": d.get("expiry", ""),
        "flour": d.get("flour", ""), "flour_lot": d.get("flour_lot", ""),
        "qty": d.get("qty", ""), "operator": d.get("operator", ""),
        "note": d.get("note", ""), "store_name": d.get("store_name", ""),
        "created_at": d.get("created_at"),
    }


@api_router.post("/batches")
async def pub_batch_create(body: PubBatchReq, user: dict = Depends(require_pro)):
    doc = {"id": str(uuid.uuid4()), "owner_id": user["user_id"], "created_at": now_iso(), **body.dict()}
    await db.pub_batches.insert_one(doc)
    return _pub_batch_public(doc)


@api_router.get("/batches")
async def pub_batch_list(user: dict = Depends(require_pro)):
    docs = await db.pub_batches.find({"owner_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [_pub_batch_public(d) for d in docs]


@api_router.delete("/batches/{batch_id}")
async def pub_batch_delete(batch_id: str, user: dict = Depends(require_pro)):
    res = await db.pub_batches.delete_one({"id": batch_id, "owner_id": user["user_id"]})
    if res.deleted_count == 0:
        raise HTTPException(404, "Lotto non trovato")
    return {"ok": True}


@api_router.get("/public/batch/{batch_id}")
async def pub_batch_get(batch_id: str):
    doc = await db.pub_batches.find_one({"id": batch_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Lotto non trovato")
    return _pub_batch_public(doc)


# ---------------------------------------------------------------------------
# Enterprise (e) — Pianificazione Turni del personale (scoped owner + negozio)
# ---------------------------------------------------------------------------
class ShiftReq(BaseModel):
    store_id: Optional[str] = None
    employee: str = Field(..., max_length=120)
    role: Optional[str] = Field("", max_length=80)
    day: str = Field(..., max_length=20)          # YYYY-MM-DD
    start: str = Field(..., max_length=5)          # HH:MM
    end: str = Field(..., max_length=5)            # HH:MM
    station: Optional[str] = Field("", max_length=80)
    note: Optional[str] = Field("", max_length=300)


def _shift_hours(start: str, end: str) -> float:
    try:
        sh, sm = [int(x) for x in start.split(":")]
        eh, em = [int(x) for x in end.split(":")]
        mins = (eh * 60 + em) - (sh * 60 + sm)
        if mins < 0:
            mins += 24 * 60  # turno notturno
        return round(mins / 60, 2)
    except Exception:
        return 0.0


def _shift_public(d: dict) -> dict:
    return {"id": d["id"], "store_id": d.get("store_id"), "employee": d.get("employee"),
            "role": d.get("role", ""), "day": d.get("day"), "start": d.get("start"),
            "end": d.get("end"), "station": d.get("station", ""), "note": d.get("note", ""),
            "hours": d.get("hours", 0)}


@api_router.get("/shifts")
async def shifts_list(user: dict = Depends(require_pro), store_id: Optional[str] = None):
    q = {"owner_id": user["user_id"]}
    if store_id:
        q["store_id"] = store_id
    docs = await db.shifts.find(q, {"_id": 0}).sort("day", 1).to_list(2000)
    return [_shift_public(d) for d in docs]


@api_router.post("/shifts")
async def shifts_create(body: ShiftReq, user: dict = Depends(require_pro)):
    doc = {"id": str(uuid.uuid4()), "owner_id": user["user_id"], "created_at": now_iso(),
           "hours": _shift_hours(body.start, body.end), **body.dict()}
    doc["employee"] = body.employee.strip()
    await db.shifts.insert_one(doc)
    return _shift_public(doc)


@api_router.put("/shifts/{shift_id}")
async def shifts_update(shift_id: str, body: ShiftReq, user: dict = Depends(require_pro)):
    doc = await db.shifts.find_one({"id": shift_id, "owner_id": user["user_id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Turno non trovato")
    upd = {**body.dict(), "employee": body.employee.strip(), "hours": _shift_hours(body.start, body.end)}
    await db.shifts.update_one({"id": shift_id}, {"$set": upd})
    doc.update(upd)
    return _shift_public(doc)


@api_router.delete("/shifts/{shift_id}")
async def shifts_delete(shift_id: str, user: dict = Depends(require_pro)):
    res = await db.shifts.delete_one({"id": shift_id, "owner_id": user["user_id"]})
    if res.deleted_count == 0:
        raise HTTPException(404, "Turno non trovato")
    return {"ok": True}


# ---------------------------------------------------------------------------
# Laboratorio Smart — Sessioni Impasto & Algoritmo "Giorno Dopo" (Fase 2)
# ---------------------------------------------------------------------------
class DoughSessionReq(BaseModel):
    recipe_id: Optional[str] = Field("", max_length=80)
    recipe_name: str = Field(..., max_length=160)
    date: Optional[str] = Field("", max_length=40)
    target_temp_c: Optional[float] = None      # temperatura impasto desiderata
    dough_temp_c: float                         # temperatura impasto finale misurata
    room_temp_c: Optional[float] = None         # temperatura ambiente / camera
    humidity: Optional[float] = None            # umidità %
    water_temp_c: Optional[float] = None        # temperatura acqua usata
    flour_temp_c: Optional[float] = None        # temperatura farina (opz.)
    source: Optional[str] = Field("", max_length=40)   # es. "pesata" (Pesata Guidata) o "" (manuale)
    note: Optional[str] = Field("", max_length=1000)


def _dough_session_public(d: dict) -> dict:
    return {k: d.get(k) for k in ("id", "recipe_id", "recipe_name", "date", "target_temp_c",
            "dough_temp_c", "room_temp_c", "humidity", "water_temp_c", "flour_temp_c", "source", "note", "created_at")}


@api_router.get("/dough-sessions")
async def dough_sessions_list(user: dict = Depends(current_user), recipe_id: Optional[str] = None):
    q = {"owner_id": user["user_id"]}
    if recipe_id:
        q["recipe_id"] = recipe_id
    docs = await db.dough_sessions.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [_dough_session_public(d) for d in docs]


@api_router.post("/dough-sessions")
async def dough_sessions_create(body: DoughSessionReq, user: dict = Depends(current_user)):
    doc = {"id": str(uuid.uuid4()), "owner_id": user["user_id"], "created_at": now_iso(), **body.dict()}
    if not doc.get("date"):
        doc["date"] = now_iso()[:10]
    await db.dough_sessions.insert_one(doc)
    return _dough_session_public(doc)


@api_router.delete("/dough-sessions/{session_id}")
async def dough_sessions_delete(session_id: str, user: dict = Depends(current_user)):
    res = await db.dough_sessions.delete_one({"id": session_id, "owner_id": user["user_id"]})
    if res.deleted_count == 0:
        raise HTTPException(404, "Sessione non trovata")
    return {"ok": True}


def _day_after_analysis(last: dict, today_room, today_humidity):
    """Analisi deterministica 'Giorno Dopo' (regola pratica dell'acqua d'impasto)."""
    target = last.get("target_temp_c")
    actual = last.get("dough_temp_c")
    y_water = last.get("water_temp_c")
    y_room = last.get("room_temp_c")
    res = {"has_target": target is not None, "delta": None, "verdict": "unknown", "suggested_water_c": None}
    if target is None or actual is None:
        return res
    delta = round(actual - target, 1)   # >0 troppo caldo, <0 troppo freddo
    res["delta"] = delta
    if abs(delta) <= 0.5:
        res["verdict"] = "on_target"
    elif delta > 0:
        res["verdict"] = "too_warm"
    else:
        res["verdict"] = "too_cold"
    if y_water is not None:
        # per ogni grado di scostamento impasto → correggo l'acqua di ~2°C nel verso opposto
        suggested = y_water - delta * 2.0
        # compenso la differenza di temperatura ambiente rispetto a ieri (1:1 sull'acqua)
        if today_room is not None and y_room is not None:
            suggested -= (today_room - y_room)
        res["suggested_water_c"] = round(max(1.0, min(45.0, suggested)), 1)
    return res


class DayAfterReq(BaseModel):
    recipe_id: Optional[str] = ""
    recipe_name: Optional[str] = ""
    today_room_c: Optional[float] = None
    today_humidity: Optional[float] = None
    lang: Optional[str] = "it"


@api_router.post("/dough-sessions/day-after")
async def dough_sessions_day_after(body: DayAfterReq, user: dict = Depends(current_user)):
    q = {"owner_id": user["user_id"]}
    if body.recipe_id:
        q["recipe_id"] = body.recipe_id
    elif body.recipe_name:
        q["recipe_name"] = body.recipe_name
    last = await db.dough_sessions.find(q, {"_id": 0}).sort("created_at", -1).to_list(1)
    if not last:
        return {"has_history": False}
    analysis = _day_after_analysis(last[0], body.today_room_c, body.today_humidity)
    return {"has_history": True, "last": _dough_session_public(last[0]), "analysis": analysis}


async def _claude_text(system: str, prompt: str, session: str = "gen") -> str:
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=session, system_message=system).with_model("anthropic", "claude-sonnet-4-6")
    out = ""
    async for ev in chat.stream_message(UserMessage(text=prompt)):
        if isinstance(ev, TextDelta):
            out += ev.content
        elif isinstance(ev, StreamDone):
            break
    return out.strip()


DAYAFTER_SYSTEM = (
    "Sei un mastro panettiere esperto di reologia degli impasti e del controllo della temperatura. "
    "Analizzi i dati delle sessioni di impasto PRECEDENTI e dai consigli PRATICI e BREVI su come "
    "correggere la temperatura dell'acqua e la gestione della lievitazione OGGI, per centrare la "
    "temperatura impasto desiderata. Rispondi in massimo 5 frasi, concrete e operative, senza premesse."
)


@api_router.post("/dough-sessions/ai-advice")
async def dough_sessions_ai_advice(body: DayAfterReq, user: dict = Depends(current_user)):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(500, "LLM key non configurata")
    q = {"owner_id": user["user_id"]}
    if body.recipe_id:
        q["recipe_id"] = body.recipe_id
    elif body.recipe_name:
        q["recipe_name"] = body.recipe_name
    docs = await db.dough_sessions.find(q, {"_id": 0}).sort("created_at", -1).to_list(5)
    if not docs:
        return {"advice": ""}
    lang = body.lang or "it"
    hist = []
    for d in docs:
        hist.append(
            f"- {d.get('date','')}: impasto {d.get('dough_temp_c')}°C (target {d.get('target_temp_c')}°C), "
            f"ambiente {d.get('room_temp_c')}°C, umidità {d.get('humidity')}%, acqua {d.get('water_temp_c')}°C"
        )
    det = _day_after_analysis(docs[0], body.today_room_c, body.today_humidity)
    lang_line = {"it": "Rispondi in italiano.", "de": "Antworte auf Deutsch.", "en": "Answer in English."}.get(lang, "Rispondi in italiano.")
    prompt = (
        f"Ricetta: {body.recipe_name or docs[0].get('recipe_name')}\n"
        f"Storico ultime sessioni:\n" + "\n".join(hist) + "\n"
        f"Oggi: ambiente {body.today_room_c}°C, umidità {body.today_humidity}%.\n"
        f"Analisi automatica: scostamento {det.get('delta')}°C, acqua consigliata {det.get('suggested_water_c')}°C.\n"
        f"Dai consigli pratici per centrare oggi la temperatura impasto. {lang_line}"
    )
    advice = await _claude_text(DAYAFTER_SYSTEM, prompt, session=f"dayafter-{user['user_id']}")
    return {"advice": advice, "analysis": det}


# ---------------------------------------------------------------------------
# Laboratorio Smart — Registro HACCP materie prime (Fase 3)
# ---------------------------------------------------------------------------
class HaccpLogReq(BaseModel):
    material: str = Field(..., max_length=200)      # nome materia prima
    code: Optional[str] = Field("", max_length=200) # barcode / QR scansionato
    lot: Optional[str] = Field("", max_length=160)  # lotto fornitore
    expiry: Optional[str] = Field("", max_length=40)
    supplier: Optional[str] = Field("", max_length=200)
    temp_c: Optional[float] = None                  # temperatura ricevimento (catena del freddo)
    qty: Optional[str] = Field("", max_length=80)
    note: Optional[str] = Field("", max_length=1000)


def _haccp_public(d: dict) -> dict:
    return {k: d.get(k) for k in ("id", "material", "code", "lot", "expiry", "supplier", "temp_c", "qty", "note", "created_at")}


@api_router.get("/haccp-logs")
async def haccp_list(user: dict = Depends(current_user)):
    docs = await db.haccp_logs.find({"owner_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [_haccp_public(d) for d in docs]


@api_router.post("/haccp-logs")
async def haccp_create(body: HaccpLogReq, user: dict = Depends(current_user)):
    doc = {"id": str(uuid.uuid4()), "owner_id": user["user_id"], "created_at": now_iso(), **body.dict()}
    await db.haccp_logs.insert_one(doc)
    return _haccp_public(doc)


@api_router.delete("/haccp-logs/{log_id}")
async def haccp_delete(log_id: str, user: dict = Depends(current_user)):
    res = await db.haccp_logs.delete_one({"id": log_id, "owner_id": user["user_id"]})
    if res.deleted_count == 0:
        raise HTTPException(404, "Voce non trovata")
    return {"ok": True}


# ---------------------------------------------------------------------------
# MAGAZZINO (giacenze materie prime) + CHIUSURA GIORNATA / Registro HACCP
# ---------------------------------------------------------------------------
class InventoryItem(BaseModel):
    id: Optional[str] = None
    name: str = Field(..., max_length=160)
    category: str = Field("farina", max_length=40)   # farina | lievito | altro
    qty: float = 0                                   # quantità disponibile
    unit: str = Field("kg", max_length=12)           # kg | g | pz | L
    lot: Optional[str] = Field("", max_length=120)
    threshold: Optional[float] = None                # soglia di avviso


class InventorySave(BaseModel):
    items: List[InventoryItem] = []


def _inv_public(d: dict) -> dict:
    return {k: d.get(k) for k in ("id", "name", "category", "qty", "unit", "lot", "threshold")}


@api_router.get("/inventory")
async def inventory_get(user: dict = Depends(current_user)):
    docs = await db.inventory_items.find({"owner_id": user["user_id"]}, {"_id": 0}).sort("name", 1).to_list(500)
    return {"items": [_inv_public(d) for d in docs]}


@api_router.put("/inventory")
async def inventory_save(body: InventorySave, user: dict = Depends(current_user)):
    uid = user["user_id"]
    await db.inventory_items.delete_many({"owner_id": uid})
    docs = []
    for it in body.items:
        docs.append({"id": it.id or str(uuid.uuid4()), "owner_id": uid, "name": it.name.strip(),
                     "category": it.category, "qty": float(it.qty or 0), "unit": it.unit,
                     "lot": (it.lot or "").strip(), "threshold": it.threshold, "updated_at": now_iso()})
    if docs:
        await db.inventory_items.insert_many(docs)
    await _notify_low_stock(uid, user.get("email"))
    return {"items": [_inv_public(d) for d in docs]}


def _low_stock_email_html(items: list, lang: str) -> str:
    rows = "".join(
        f"<li><b>{(i.get('name') or '')}</b>: {i.get('qty')} {i.get('unit', 'kg')}"
        f" (soglia {i.get('threshold')} {i.get('unit', 'kg')})</li>" if lang != "de" else
        f"<li><b>{(i.get('name') or '')}</b>: {i.get('qty')} {i.get('unit', 'kg')}"
        f" (Schwelle {i.get('threshold')} {i.get('unit', 'kg')})</li>"
        for i in items)
    if lang == "de":
        return (f"<div style='font-family:Arial,sans-serif;max-width:520px;margin:auto'>"
                f"<h2 style='color:#C0574D'>⚠️ Rohstoffe fast aufgebraucht</h2>"
                f"<p>Folgende Rohstoffe sind unter die Warnschwelle gefallen. Rechtzeitig nachbestellen:</p>"
                f"<ul>{rows}</ul>"
                f"<p style='color:#888;font-size:12px'>MikiLab · Rohstofflager</p></div>")
    return (f"<div style='font-family:Arial,sans-serif;max-width:520px;margin:auto'>"
            f"<h2 style='color:#C0574D'>⚠️ Materie prime in esaurimento</h2>"
            f"<p>Queste materie prime sono scese sotto la soglia di avviso. Ordina in tempo:</p>"
            f"<ul>{rows}</ul>"
            f"<p style='color:#888;font-size:12px'>MikiLab · Magazzino materie prime</p></div>")


async def _notify_low_stock(uid: str, email: Optional[str], lang: str = "it"):
    """Invia UNA email quando una materia prima scende sotto soglia (finché non viene rifornita)."""
    items = await db.inventory_items.find({"owner_id": uid, "threshold": {"$ne": None}}).to_list(500)
    low = [it for it in items if it.get("threshold") is not None and float(it.get("qty") or 0) <= float(it["threshold"])]
    low_keys = {_norm(it.get("name")) for it in low}
    meta = await db.inventory_meta.find_one({"owner_id": uid}) or {}
    notified = set(meta.get("notified") or [])
    new_low = [it for it in low if _norm(it.get("name")) not in notified]
    if new_low and RESEND_API_KEY and email:
        try:
            params = {"from": f"MikiLab <{SENDER_EMAIL}>", "to": [email],
                      "subject": ("MikiLab · Scorte basse ⚠️" if lang != "de" else "MikiLab · Niedriger Bestand ⚠️"),
                      "html": _low_stock_email_html(new_low, lang)}
            await asyncio.to_thread(_resend.Emails.send, params)
        except Exception as e:
            logging.getLogger(__name__).error(f"low-stock email failed: {e}")
    # Notificati = quelli attualmente sotto soglia (chi risale sopra soglia potrà essere ri-notificato)
    await db.inventory_meta.update_one({"owner_id": uid},
        {"$set": {"owner_id": uid, "notified": list(low_keys), "updated_at": now_iso()}}, upsert=True)


class DayCloseReq(BaseModel):
    produced: List[dict] = []          # [{name, qty, unit, lot}]
    consume: List[dict] = []           # [{name, qty}] scarico materie prime
    temps: List[dict] = []             # [{name, temp_c}]
    cleaning: dict = {}                # {mixers, benches, dividers, floors, ...: bool}
    anomalies: Optional[str] = Field("", max_length=2000)
    operator: Optional[str] = Field("", max_length=160)
    note: Optional[str] = Field("", max_length=2000)
    production_lot: Optional[str] = Field("", max_length=120)
    signature: Optional[str] = Field("", max_length=400000)   # data URL PNG (firma)
    lang: str = "it"


def _norm(s: str) -> str:
    return (s or "").strip().lower()


@api_router.post("/day-close")
async def day_close(body: DayCloseReq, user: dict = Depends(current_user)):
    uid = user["user_id"]
    now = now_iso()
    # 1) Scarico magazzino (match per nome, fuzzy come il freezer)
    deducted = []
    if body.consume:
        inv = await db.inventory_items.find({"owner_id": uid}).to_list(500)
        for c in body.consume:
            cn = _norm(c.get("name"))
            want = float(c.get("qty") or 0)
            if not cn or want <= 0:
                continue
            for it in inv:
                itn = _norm(it.get("name"))
                if itn == cn or (len(itn) >= 4 and len(cn) >= 4 and (itn in cn or cn in itn)):
                    avail = float(it.get("qty") or 0)
                    take = min(avail, want)
                    if take > 0:
                        newq = round(avail - take, 3)
                        await db.inventory_items.update_one({"id": it["id"], "owner_id": uid},
                            {"$set": {"qty": newq, "updated_at": now}})
                        it["qty"] = newq
                        deducted.append({"name": it["name"], "qty": take, "unit": it.get("unit", "kg"), "remaining": newq})
                    break
    # 2) Sync automatico → Registro HACCP: crea voci per ogni temperatura + una per pulizie/anomalie
    haccp_created = 0
    for tp in body.temps:
        nm = (tp.get("name") or "").strip()
        tc = tp.get("temp_c")
        if not nm or tc in (None, ""):
            continue  # salta i punti senza valore di temperatura
        await db.haccp_logs.insert_one({"id": str(uuid.uuid4()), "owner_id": uid, "created_at": now,
            "material": nm, "code": "", "lot": body.production_lot or "", "expiry": "", "supplier": "",
            "temp_c": (float(tc) if tc not in (None, "") else None), "qty": "",
            "note": f"Chiusura giornata {now[:10]}" + (f" · Operatore: {body.operator}" if body.operator else "")})
        haccp_created += 1
    clean_on = [k for k, v in (body.cleaning or {}).items() if v]
    if clean_on or (body.anomalies or "").strip():
        note_parts = []
        if clean_on:
            note_parts.append("Sanificazione: " + ", ".join(clean_on))
        if (body.anomalies or "").strip():
            note_parts.append("Anomalie: " + body.anomalies.strip())
        await db.haccp_logs.insert_one({"id": str(uuid.uuid4()), "owner_id": uid, "created_at": now,
            "material": "Registro sanitario (chiusura)", "code": "", "lot": body.production_lot or "",
            "expiry": "", "supplier": "", "temp_c": None, "qty": "",
            "note": " · ".join(note_parts) + (f" · Operatore: {body.operator}" if body.operator else "")})
        haccp_created += 1
    # 3) Archivia chiusura
    rec = {"id": str(uuid.uuid4()), "owner_id": uid, "date": now[:10], "closed_at": now,
           "produced": body.produced, "consume": body.consume, "deducted": deducted, "temps": body.temps,
           "cleaning": body.cleaning, "anomalies": body.anomalies, "operator": body.operator,
           "note": body.note, "production_lot": body.production_lot, "signature": body.signature or "",
           "haccp_created": haccp_created}
    await db.day_closures.insert_one(rec)
    rec.pop("_id", None)
    # Avviso scorte basse via email (se qualche materia è scesa sotto soglia con lo scarico)
    await _notify_low_stock(uid, user.get("email"), body.lang)
    return {"ok": True, "closure": {k: rec[k] for k in rec if k != "owner_id"}, "deducted": deducted, "haccp_created": haccp_created}


@api_router.get("/day-close/last")
async def day_close_last(user: dict = Depends(current_user)):
    d = await db.day_closures.find_one({"owner_id": user["user_id"]}, {"_id": 0, "owner_id": 0}, sort=[("closed_at", -1)])
    return d or {}


@api_router.get("/day-close/list")
async def day_close_list(user: dict = Depends(current_user)):
    docs = await db.day_closures.find({"owner_id": user["user_id"]}, {"_id": 0, "owner_id": 0}).sort("closed_at", -1).to_list(500)
    return {"closures": docs}


def _build_closure_pdf(c: dict, lang: str = "it") -> bytes:
    from io import BytesIO
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

    de = lang == "de"
    L = {
        "title": "Registro Chiusura Turno · HACCP" if not de else "Schichtabschluss · HACCP",
        "date": "Data" if not de else "Datum", "lot": "Lotto di produzione" if not de else "Produktionscharge",
        "operator": "Operatore" if not de else "Bediener",
        "produced": "Prodotti realizzati" if not de else "Produzierte Produkte",
        "deducted": "Scarico materie prime" if not de else "Rohstoff-Abbuchung",
        "temps": "Controllo temperature" if not de else "Temperaturkontrolle",
        "cleaning": "Pulizie & Sanificazione" if not de else "Reinigung & Sanitisierung",
        "anomalies": "Anomalie" if not de else "Abweichungen", "note": "Note" if not de else "Notizen",
        "sign": "Firma operatore" if not de else "Unterschrift Bediener", "none": "—",
        "qty": "Q.tà" if not de else "Menge", "name": "Nome" if not de else "Name", "temp": "Temp.",
    }
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=16 * mm, bottomMargin=16 * mm, leftMargin=18 * mm, rightMargin=18 * mm)
    ss = getSampleStyleSheet()
    ACC = colors.HexColor("#234b6e")
    h1 = ParagraphStyle("h1", parent=ss["Title"], textColor=ACC, fontSize=20, spaceAfter=2)
    meta = ParagraphStyle("meta", parent=ss["Normal"], fontSize=11, spaceAfter=1)
    lab = ParagraphStyle("lab", parent=ss["Heading2"], textColor=colors.HexColor("#3f7cac"), fontSize=13, spaceBefore=10, spaceAfter=3)
    body = ParagraphStyle("body", parent=ss["Normal"], fontSize=10.5, leading=15)

    def esc(s):
        return (str(s if s is not None else "")).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    story = [Paragraph("MikiLab · " + L["title"], h1),
             Paragraph(f"{L['date']}: <b>{esc(c.get('date'))}</b> · {L['lot']}: <b>{esc(c.get('production_lot')) or L['none']}</b>", meta),
             Paragraph(f"{L['operator']}: <b>{esc(c.get('operator')) or L['none']}</b>", meta), Spacer(1, 3 * mm)]

    def tbl(rows, headers):
        data = [headers] + rows
        t = Table(data, hAlign="LEFT", colWidths=None)
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e4eff8")),
            ("TEXTCOLOR", (0, 0), (-1, 0), ACC),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9.5),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#c7d6e5")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f6fafd")]),
            ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        return t

    prod = [[esc(p.get("name")), f"{esc(p.get('qty'))} {esc(p.get('unit') or 'pz')}"] for p in (c.get("produced") or []) if p.get("name")]
    story.append(Paragraph(L["produced"], lab))
    story.append(tbl(prod, [L["name"], L["qty"]]) if prod else Paragraph(L["none"], body))

    ded = [[esc(d.get("name")), f"-{esc(d.get('qty'))} {esc(d.get('unit') or 'kg')}", f"{esc(d.get('remaining'))} {esc(d.get('unit') or 'kg')}"] for d in (c.get("deducted") or [])]
    story.append(Paragraph(L["deducted"], lab))
    story.append(tbl(ded, [L["name"], L["qty"], "Restante" if not de else "Rest"]) if ded else Paragraph(L["none"], body))

    tmp = [[esc(t.get("name")), f"{esc(t.get('temp_c'))} °C" if t.get("temp_c") not in (None, "") else L["none"]] for t in (c.get("temps") or []) if t.get("name")]
    story.append(Paragraph(L["temps"], lab))
    story.append(tbl(tmp, [L["name"], L["temp"]]) if tmp else Paragraph(L["none"], body))

    clean_on = [k for k, v in (c.get("cleaning") or {}).items() if v]
    story.append(Paragraph(L["cleaning"], lab))
    story.append(Paragraph(("✓ " + " · ".join(esc(x) for x in clean_on)) if clean_on else L["none"], body))

    story.append(Paragraph(L["anomalies"], lab))
    story.append(Paragraph(esc(c.get("anomalies")) or L["none"], body))
    if (c.get("note") or "").strip():
        story.append(Paragraph(L["note"], lab))
        story.append(Paragraph(esc(c.get("note")), body))

    story.append(Spacer(1, 10 * mm))
    story.append(Paragraph(f"{L['sign']}:", body))
    sig = c.get("signature") or ""
    if sig.startswith("data:image"):
        try:
            import base64
            from reportlab.platypus import Image as _Img
            raw = base64.b64decode(sig.split(",", 1)[1])
            story.append(_Img(BytesIO(raw), width=60 * mm, height=18 * mm, kind="proportional", hAlign="LEFT"))
        except Exception:
            story.append(Paragraph(f"{esc(c.get('operator')) or ''} __________________________", body))
    else:
        story.append(Spacer(1, 4 * mm))
        story.append(Paragraph(f"{esc(c.get('operator')) or ''} __________________________", body))
    story.append(Paragraph(f"<font color='#7E8A93' size=8>MikiLab · Il Laboratorio di Michele · {esc(c.get('closed_at'))}</font>", body))
    doc.build(story)
    return buf.getvalue()


@api_router.get("/day-close/{closure_id}/pdf")
async def day_close_pdf(closure_id: str, lang: str = "it", user: dict = Depends(current_user)):
    c = await db.day_closures.find_one({"id": closure_id, "owner_id": user["user_id"]}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Chiusura non trovata")
    pdf = await asyncio.to_thread(_build_closure_pdf, c, lang)
    fname = f"chiusura_{c.get('date','')}_{(c.get('production_lot') or 'lotto')}.pdf".replace(" ", "_")
    return Response(content=pdf, media_type="application/pdf",
                    headers={"Content-Disposition": f'inline; filename="{fname}"'})



app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.get("/api/seed-mikilab")
async def seed_mikilab_endpoint():
    n = await seed_mikilab_if_empty(force=True)
    return {"status": "synced", "count": n}


WELCOME_POST_TEXT = (
    "Benvenuti nella community di MikiLab! \U0001F956\U0001F525\n\n"
    "Ciao a tutti e benvenuti nel nostro nuovo spazio interamente dedicato all'arte della panificazione, pasticceria e pizzeria!\n\n"
    "Ho creato questa community per riunire fornai, pasticceri, pizzaioli, professionisti e appassionati del settore: un luogo dove scambiarsi consigli, condividere ricette, confrontarsi su tecniche di lievitazione, farine e macchinari, ma soprattutto per far crescere insieme le nostre attivit\u00e0.\n\n"
    "Cosa troverete in questa community?\n"
    "\u2022 Confronto diretto: spazio aperto per dubbi, consigli pratici e soluzioni ai problemi quotidiani in laboratorio.\n"
    "\u2022 Aggiornamenti e Risorse: contenuti esclusivi, novit\u00e0 sul mondo della panificazione e strumenti per ottimizzare il lavoro.\n"
    "\u2022 Networking: l'opportunit\u00e0 di entrare in contatto con colleghi di tutta Italia.\n\n"
    "L'arte del pane, dei lievitati e della pizza unisce tradizione e innovazione, e da oggi abbiamo una casa comune per far valere il nostro mestiere.\n\n"
    "Mettetevi comodi, presentatevi nei commenti qui sotto e diteci da dove lavorate e qual \u00e8 la vostra specialit\u00e0!\n\n"
    "E mi raccomando: pubblicate anche le foto dei VOSTRI prodotti \u2014 pane, lievitati, pizze e dolci \u2014 mostrateli con orgoglio! Aggiungete colleghi e amici, seguite chi vi ispira e leggete i post nella vostra lingua: la community \u00e8 in italiano, tedesco e inglese. \U0001F1EE\U0001F1F9\U0001F1E9\U0001F1EA\U0001F1EC\U0001F1E7\n\n"
    "Buon lavoro e buona lievitazione a tutti! \U0001F33E\U0001F4AA"
)

WELCOME_POST_DE = (
    "Willkommen in der MikiLab-Community! \U0001F956\U0001F525\n\n"
    "Hallo zusammen und herzlich willkommen in unserem neuen Raum rund um die Kunst des Backens, der Konditorei und der Pizza!\n\n"
    "Ich habe diese Community geschaffen, um Bäcker, Konditoren, Pizzabäcker, Profis und Enthusiasten zusammenzubringen: ein Ort zum Austauschen von Tipps und Rezepten, für Fragen zu Gare, Mehlen und Maschinen und vor allem, um gemeinsam zu wachsen.\n\n"
    "Was findest du hier?\n"
    "\u2022 Direkter Austausch: offener Raum für Fragen und praktische Lösungen aus dem Laboralltag.\n"
    "\u2022 Updates & Ressourcen: exklusive Inhalte und Werkzeuge zur Optimierung der Arbeit.\n"
    "\u2022 Networking: Kontakt zu Kolleginnen und Kollegen.\n\n"
    "Macht es euch bequem, stellt euch in den Kommentaren vor und sagt uns, wo ihr arbeitet und was eure Spezialität ist!\n\n"
    "Und ganz wichtig: postet auch Fotos EURER Produkte — Brot, Hefegebäck, Pizza und Süßes — zeigt sie mit Stolz! Fügt Kolleginnen und Freunde hinzu, folgt denen, die euch inspirieren, und lest die Beiträge in eurer Sprache: die Community ist auf Italienisch, Deutsch und Englisch. \U0001F1EE\U0001F1F9\U0001F1E9\U0001F1EA\U0001F1EC\U0001F1E7\n\n"
    "Gutes Gelingen und gute Gare! \U0001F33E\U0001F4AA"
)

WELCOME_POST_EN = (
    "Welcome to the MikiLab community! \U0001F956\U0001F525\n\n"
    "Hi everyone and welcome to our new space entirely dedicated to the art of baking, pastry and pizza!\n\n"
    "I created this community to bring together bakers, pastry chefs, pizzaioli, professionals and enthusiasts: a place to share tips and recipes, to discuss proofing, flours and machines, and above all to grow together.\n\n"
    "What will you find here?\n"
    "\u2022 Direct exchange: an open space for questions and practical solutions from daily lab life.\n"
    "\u2022 Updates & resources: exclusive content and tools to optimise your work.\n"
    "\u2022 Networking: the chance to connect with colleagues.\n\n"
    "Make yourself at home, introduce yourself in the comments and tell us where you work and what your specialty is!\n\n"
    "And most importantly: post photos of YOUR products too — bread, leavened cakes, pizza and pastries — show them with pride! Add colleagues and friends, follow those who inspire you, and read posts in your own language: the community is in Italian, German and English. \U0001F1EE\U0001F1F9\U0001F1E9\U0001F1EA\U0001F1EC\U0001F1E7\n\n"
    "Good work and good proofing to all! \U0001F33E\U0001F4AA"
)


WELCOME_VERSION = 3
WELCOME_IMAGE = "/michele-casual.jpg"

WELCOME_POST_ES = (
    "¡Bienvenidos a la comunidad de MikiLab! \U0001F956\U0001F525\n\n"
    "¡Hola a todos y bienvenidos a nuestro nuevo espacio dedicado por completo al arte de la panadería, la pastelería y la pizza!\n\n"
    "He creado esta comunidad para unir a panaderos, pasteleros, pizzeros, profesionales y aficionados: un lugar para compartir consejos y recetas, resolver dudas sobre fermentaciones, harinas y máquinas y, sobre todo, para crecer juntos.\n\n"
    "¿Qué encontrarás aquí?\n"
    "\u2022 Intercambio directo: un espacio abierto para preguntas y soluciones prácticas del día a día del obrador.\n"
    "\u2022 Novedades y recursos: contenidos y herramientas exclusivas para optimizar tu trabajo.\n"
    "\u2022 Networking: la posibilidad de conectar con colegas.\n\n"
    "¡Ponte cómodo, preséntate en los comentarios y cuéntanos dónde trabajas y cuál es tu especialidad!\n\n"
    "Y lo más importante: ¡publica también fotos de TUS productos — pan, bollería, pizza y dulces — muéstralos con orgullo! Añade colegas y amigos, sigue a quien te inspira y lee las publicaciones en tu idioma: la comunidad está en italiano, alemán, inglés y español. \U0001F1EE\U0001F1F9\U0001F1E9\U0001F1EA\U0001F1EC\U0001F1E7\U0001F1EA\U0001F1F8\n\n"
    "¡Buen trabajo y buena fermentación a todos! \U0001F33E\U0001F4AA"
)


async def seed_welcome_post():
    """Crea/aggiorna (versionato) il post di benvenuto ufficiale nella Community."""
    exists = await db.community_posts.find_one({"text": {"$regex": "^Benvenuti nella community di MikiLab"}})
    if exists:
        if exists.get("welcome_version") != WELCOME_VERSION:
            await db.community_posts.update_one({"id": exists["id"]}, {"$set": {
                "text": WELCOME_POST_TEXT, "text_de": WELCOME_POST_DE, "text_en": WELCOME_POST_EN, "text_es": WELCOME_POST_ES,
                "image_url": WELCOME_IMAGE, "author_name": "Michele — MikiLab", "pinned": True,
                "welcome_version": WELCOME_VERSION,
            }})
        return
    admin = await db.users.find_one({"email": "admin@mikilab.de"})
    aid = (admin or {}).get("id") or (admin or {}).get("user_id") or "admin"
    doc = {
        "id": str(uuid.uuid4()), "author_id": aid, "author_name": "Michele — MikiLab",
        "category": "consiglio", "text": WELCOME_POST_TEXT, "text_de": WELCOME_POST_DE, "text_en": WELCOME_POST_EN, "text_es": WELCOME_POST_ES,
        "image_url": WELCOME_IMAGE,
        "created_at": now_iso(), "likes": [], "comments": [], "pinned": True, "welcome_version": WELCOME_VERSION,
    }
    await db.community_posts.insert_one(doc)



# --- Email di follow-up dopo l'acquisto di un pacchetto (dopo N giorni) ------
FOLLOWUP_DAYS = 3
BUNDLE_PRICE_LABEL = {"pane": "€40", "panettoni": "€50", "panini": "€20", "snack": "€10"}


def _followup_email_html(bought_name: str, missing: list, lang: str) -> str:
    def li(b):
        return f"<li><b>{BUNDLE_DEFS[b]['name']}</b> — {BUNDLE_PRICE_LABEL.get(b, '')}</li>"
    items = "".join(li(b) for b in missing)
    if lang == "de":
        return (f"<div style='font-family:Arial,sans-serif;max-width:520px;margin:auto'>"
                f"<h2 style='color:#234b6e'>Wie läuft es mit deinem Paket? 🥖</h2>"
                f"<p>Wir hoffen, das Paket <b>{bought_name}</b> gefällt dir! "
                f"Vielleicht möchtest du auch die anderen Rezept-Pakete von Michele entdecken:</p>"
                f"<ul>{items}</ul>"
                f"<p><a href='https://mikilab.de' style='background:#234b6e;color:#fff;text-decoration:none;"
                f"padding:12px 22px;border-radius:12px;font-weight:bold;display:inline-block'>Weitere Pakete ansehen</a></p>"
                f"<p style='color:#888;font-size:12px'>MikiLab · Das Labor von Michele</p></div>")
    return (f"<div style='font-family:Arial,sans-serif;max-width:520px;margin:auto'>"
            f"<h2 style='color:#234b6e'>Come va con il tuo pacchetto? 🥖</h2>"
            f"<p>Speriamo che il pacchetto <b>{bought_name}</b> ti stia piacendo! "
            f"Forse vuoi scoprire anche gli altri pacchetti di ricette di Michele:</p>"
            f"<ul>{items}</ul>"
            f"<p><a href='https://mikilab.de' style='background:#234b6e;color:#fff;text-decoration:none;"
            f"padding:12px 22px;border-radius:12px;font-weight:bold;display:inline-block'>Scopri gli altri pacchetti</a></p>"
            f"<p style='color:#888;font-size:12px'>MikiLab · Il Laboratorio di Michele</p></div>")


async def _send_bundle_followups():
    """Invia (una sola volta) l'email di follow-up ai clienti che hanno comprato un pacchetto da ≥ N giorni."""
    if not RESEND_API_KEY:
        return
    cutoff = (datetime.now(timezone.utc) - timedelta(days=FOLLOWUP_DAYS)).isoformat()
    q = {"bundle": {"$exists": True}, "payment_status": "paid",
         "followup_sent": {"$ne": True}, "paid_at": {"$lte": cutoff}}
    txs = await db.payment_transactions.find(q).to_list(200)
    for tx in txs:
        email = (tx.get("email") or "").strip().lower()
        bought = tx.get("bundle")
        if not email or bought not in BUNDLE_DEFS:
            await db.payment_transactions.update_one({"_id": tx["_id"]}, {"$set": {"followup_sent": True}})
            continue
        ent = await db.entitlements.find_one({"email": email}) or {}
        owned = set(ent.get("unlocked_bundles") or [])
        if ent.get("unlock_all"):
            owned = set(BUNDLE_DEFS.keys())
        missing = [b for b in BUNDLE_DEFS if b not in owned]
        try:
            if missing:
                params = {"from": f"MikiLab <{SENDER_EMAIL}>", "to": [email],
                          "subject": "MikiLab · Scopri gli altri pacchetti di ricette 🥖",
                          "html": _followup_email_html(BUNDLE_DEFS[bought]["name"], missing, "it")}
                await asyncio.to_thread(_resend.Emails.send, params)
            await db.payment_transactions.update_one({"_id": tx["_id"]}, {"$set": {"followup_sent": True, "followup_at": now_iso()}})
        except Exception as e:
            logging.getLogger(__name__).error(f"bundle follow-up email failed: {e}")


def _stock_summary_email_html(low: list, near: list, lang: str) -> str:
    de = lang == "de"
    def rows(items):
        return "".join(f"<li><b>{(i.get('name') or '')}</b>: {i.get('qty')} {i.get('unit','kg')} "
                       f"({'Schwelle' if de else 'soglia'} {i.get('threshold')} {i.get('unit','kg')})</li>" for i in items)
    parts = []
    if low:
        parts.append(("<h3 style='color:#C0574D'>" + ("Unter Schwelle" if de else "Sotto soglia") + "</h3><ul>" + rows(low) + "</ul>"))
    if near:
        parts.append(("<h3 style='color:#C88A2B'>" + ("Fast am Limit" if de else "Vicino alla soglia") + "</h3><ul>" + rows(near) + "</ul>"))
    head = ("Wochenübersicht Bestand" if de else "Riepilogo scorte della settimana")
    intro = ("Plane deine Bestellungen für die Woche:" if de else "Pianifica gli ordini della settimana:")
    return (f"<div style='font-family:Arial,sans-serif;max-width:520px;margin:auto'>"
            f"<h2 style='color:#234b6e'>📦 {head}</h2><p>{intro}</p>{''.join(parts)}"
            f"<p style='color:#888;font-size:12px'>MikiLab · Magazzino</p></div>")


async def _send_weekly_stock_summaries():
    """Ogni lunedì: email di riepilogo con le materie sotto o vicino (≤ +20%) alla soglia."""
    if not RESEND_API_KEY:
        return
    now = datetime.now(timezone.utc)
    if now.weekday() != 0:  # 0 = lunedì
        return
    week_key = now.strftime("%G-W%V")
    owner_ids = await db.inventory_items.distinct("owner_id", {"threshold": {"$ne": None}})
    for uid in owner_ids:
        sent = await db.weekly_stock_sent.find_one({"owner_id": uid, "week": week_key})
        if sent:
            continue
        u = await db.users.find_one({"user_id": uid})
        email = (u or {}).get("email")
        items = await db.inventory_items.find({"owner_id": uid, "threshold": {"$ne": None}}).to_list(500)
        low, near = [], []
        for it in items:
            thr = float(it["threshold"]); q = float(it.get("qty") or 0)
            if q <= thr:
                low.append(it)
            elif q <= thr * 1.2:
                near.append(it)
        try:
            if email and (low or near):
                params = {"from": f"MikiLab <{SENDER_EMAIL}>", "to": [email],
                          "subject": "MikiLab · Riepilogo scorte settimanale 📦",
                          "html": _stock_summary_email_html(low, near, "it")}
                await asyncio.to_thread(_resend.Emails.send, params)
            await db.weekly_stock_sent.update_one({"owner_id": uid, "week": week_key},
                {"$set": {"owner_id": uid, "week": week_key, "sent_at": now_iso()}}, upsert=True)
        except Exception as e:
            logging.getLogger(__name__).error(f"weekly stock summary failed: {e}")


def _trial_reminder_email_html(hours_left: int, subscribe_url: str) -> str:
    return (
        "<div style='font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#2B303B'>"
        "<h2 style='color:#B34A26'>MikiLab · La tua prova sta per finire ⏳</h2>"
        f"<p>Ciao! La tua <b>prova gratuita di 7 giorni</b> di «Il Tuo Laboratorio» scade tra circa <b>{hours_left} ore</b>.</p>"
        "<p>Ricorda: <b>non abbiamo addebitato nulla</b> e non ci sarà alcun rinnovo automatico. "
        "Se vuoi continuare a usare piano di produzione IA, ricette, costi e tutti gli strumenti, "
        "attiva l'abbonamento quando vuoi.</p>"
        f"<p><a href='{subscribe_url}' style='background:#B34A26;color:#fff;text-decoration:none;"
        "padding:12px 22px;border-radius:12px;font-weight:bold;display:inline-block'>Abbonati e continua →</a></p>"
        "<hr style='border:none;border-top:1px solid #eee;margin:18px 0'>"
        "<h3 style='color:#B34A26;margin:0 0 6px'>🇩🇪 Deine Testphase endet bald</h3>"
        f"<p style='color:#555'>Deine 7-tägige kostenlose Testphase endet in ca. {hours_left} Stunden. "
        "Wir haben nichts belastet, es gibt keine automatische Verlängerung. "
        "Abonniere jederzeit, um weiterzumachen.</p>"
        "<p style='color:#888;font-size:12px'>MikiLab · mikilab.de</p></div>"
    )


async def _send_trial_reminders():
    """Promemoria automatico verso la fine della prova (giorno 6 su 7): invita ad abbonarsi.
    NESSUN addebito automatico: l'utente deve abbonarsi manualmente."""
    if not RESEND_API_KEY:
        return
    now = datetime.now(timezone.utc)
    soon = (now + timedelta(hours=24)).isoformat()
    now_s = now.isoformat()
    subscribe_url = "https://mikilab.de/?sub=open"
    cursor = db.entitlements.find({
        "source": {"$in": ["trial_card", "trial"]},
        "pro": True,
        "trial_reminder_sent": {"$ne": True},
        "expires_at": {"$ne": None, "$lte": soon, "$gt": now_s},
    })
    async for ent in cursor:
        email = ent.get("email")
        if not email:
            continue
        try:
            ms = (datetime.fromisoformat(ent["expires_at"]) - now).total_seconds()
            hours_left = max(1, int(ms // 3600))
        except Exception:
            hours_left = 24
        try:
            params = {"from": f"MikiLab <{SENDER_EMAIL}>", "to": [email],
                      "subject": "MikiLab · La tua prova gratuita sta per finire ⏳",
                      "html": _trial_reminder_email_html(hours_left, subscribe_url)}
            await asyncio.to_thread(_resend.Emails.send, params)
            await db.entitlements.update_one({"email": email},
                {"$set": {"trial_reminder_sent": True, "trial_reminder_at": now_iso()}})
            logging.getLogger(__name__).info(f"trial reminder sent to {email}")
        except Exception as e:
            logging.getLogger(__name__).error(f"trial reminder send failed for {email}: {e}")


async def _followup_loop():
    while True:
        try:
            await _send_bundle_followups()
        except Exception as e:
            logging.getLogger(__name__).error(f"follow-up loop error: {e}")
        try:
            await _send_weekly_stock_summaries()
        except Exception as e:
            logging.getLogger(__name__).error(f"weekly stock loop error: {e}")
        try:
            await _send_trial_reminders()
        except Exception as e:
            logging.getLogger(__name__).error(f"trial reminder loop error: {e}")
        await asyncio.sleep(6 * 3600)  # ogni 6 ore


@app.on_event("startup")
async def on_startup_seed_mikilab():
    """In produzione (DB vuoto) crea automaticamente il ricettario Mikilab, senza cancellare nulla."""
    try:
        n = await seed_mikilab_if_empty()
        if n:
            logging.getLogger(__name__).info(f"Mikilab seed startup: {n} ricette")
    except Exception as e:
        logging.getLogger(__name__).error(f"Seed startup error: {e}")
    try:
        await seed_shop_if_empty()
    except Exception as e:
        logging.getLogger(__name__).error(f"Shop seed error: {e}")
    try:
        await seed_welcome_post()
    except Exception as e:
        logging.getLogger(__name__).error(f"Welcome post seed error: {e}")
    try:
        init_storage()
        logging.getLogger(__name__).info("Archivio immagini inizializzato")
    except Exception as e:
        logging.getLogger(__name__).error(f"Storage init error: {e}")
    try:
        asyncio.create_task(_followup_loop())
        logging.getLogger(__name__).info("Follow-up email loop avviato")
    except Exception as e:
        logging.getLogger(__name__).error(f"Follow-up loop start error: {e}")
    try:
        await db.rate_limits.create_index("ts", expireAfterSeconds=86400)
    except Exception as e:
        logging.getLogger(__name__).error(f"rate_limits index error: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
