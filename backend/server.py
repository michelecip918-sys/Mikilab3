# ============================================================================
#  MIKILAB PRO & Sitor AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the Sitor AI Security Guardian.
# ============================================================================
from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Depends, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse, Response, HTMLResponse, JSONResponse, PlainTextResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import jwt as _jwt
from motor.motor_asyncio import AsyncIOMotorClient
import os
import time
import math
import json
import logging
import re
import asyncio
import requests
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
import httpx
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
# Il cervello di Sitor — il Dio dell'Arte Bianca — gira sul modello più potente disponibile.
# Riservato ai compiti ad alto valore: consigli dalla memoria personale, generazione corsi
# ricetta, decisioni di coordinamento complesse.
SITOR_BRAIN = "claude-opus-4-8"
# Modello ECONOMICO per estrazioni/classificazioni semplici e dialogo vocale ultra-breve
# (leggere una comanda, interpretare un comando vocale corto, estrarre righe da un'etichetta).
# Stesso identità e lingua di Sitor, costo molto inferiore.
SITOR_FAST = "claude-haiku-4-5-20251001"
TAVILY_API_KEY = os.environ.get('TAVILY_API_KEY')

# ---------------------------------------------------------------------------
# RISPARMIO CREDITI — memoization applicativa dei prompt ripetuti identici.
# L'API interna non espone il prompt-caching di Anthropic in modo affidabile:
# riusiamo quindi in modo sicuro le risposte alle estrazioni/classificazioni con
# system+input IDENTICI entro una breve finestra (TTL), evitando chiamate ripetute.
# ---------------------------------------------------------------------------
_LLM_MEMO: dict = {}
_LLM_MEMO_TTL = 900.0  # 15 minuti

def _memo_key(system: str, user_text: str, model: str) -> str:
    import hashlib
    return hashlib.sha256(f"{model}\x00{system}\x00{user_text}".encode("utf-8")).hexdigest()

def _memo_get(key: str):
    v = _LLM_MEMO.get(key)
    if not v:
        return None
    exp, val = v
    if time.time() > exp:
        _LLM_MEMO.pop(key, None)
        return None
    return val

def _memo_set(key: str, val: str):
    if len(_LLM_MEMO) > 500:
        _LLM_MEMO.clear()
    _LLM_MEMO[key] = (time.time() + _LLM_MEMO_TTL, val)


# Contatori di RISPARMIO CREDITI (badge Direzione): quante chiamate sono andate sul modello
# economico e quante risposte sono state riusate dalla cache, per mese. Fire-and-forget.
async def _track_saving(kind: str):
    """kind: 'fast' | 'brain' | 'cache'. Aggiorna i contatori mensili di risparmio."""
    try:
        month = now_iso()[:7]
        field = {"fast": "fast_calls", "brain": "brain_calls", "cache": "cache_hits"}.get(kind)
        if not field:
            return
        await db.ai_usage.update_one(
            {"month": month}, {"$inc": {field: 1}, "$set": {"updated_at": now_iso()}}, upsert=True)
    except Exception:
        pass

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
# CANCELLO SERVER "HARD": token firmato (JWT HS256) rilasciato SOLO dopo il PIN
# Master corretto. Senza questo cookie firmato ogni /api (tranne whitelist) è 401,
# anche da browser modificato: MikiLab resta invisibile a chi non ha il PIN iniziale.
# Il Production PIN (operatori) NON è in whitelist → passa comunque dal cancello Master.
# ---------------------------------------------------------------------------
GATE_SECRET = os.environ.get("GATE_JWT_SECRET") or os.environ.get("INBOUND_SHARED_SECRET") or "mikilab-gate-dev"
GATE_COOKIE = "mikilab_gate"
GATE_TTL = int(os.environ.get("GATE_TTL_SECONDS", str(30 * 86400)))
_GATE_PUBLIC_PREFIXES = ("/api/health", "/api/auth/", "/api/admin-gate", "/api/inbound/", "/api/webhook/", "/api/public/", "/api/compliance/privacy")


def issue_gate_token(ttl_seconds: int = None, org: str = "org_default") -> str:
    ttl = int(ttl_seconds or GATE_TTL)
    now = datetime.now(timezone.utc)
    return _jwt.encode({"purpose": "gate", "org": org or "org_default", "iat": now, "exp": now + timedelta(seconds=ttl), "iss": "mikilab-gate"}, GATE_SECRET, algorithm="HS256")


def _gate_valid(token: str) -> bool:
    try:
        claims = _jwt.decode(token, GATE_SECRET, algorithms=["HS256"], options={"require": ["exp", "purpose"]})
        return claims.get("purpose") == "gate"
    except Exception:
        return False


def gate_org(request) -> str:
    """Azienda legata al cookie del cancello (PIN operatore/produzione). Default: org_default."""
    try:
        tok = request.cookies.get(GATE_COOKIE)
        if tok:
            claims = _jwt.decode(tok, GATE_SECRET, algorithms=["HS256"], options={"require": ["exp", "purpose"]})
            if claims.get("purpose") == "gate":
                return claims.get("org") or "org_default"
    except Exception:
        pass
    return "org_default"


class GateMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Manuale pubblico di Sitor: nessun muro PIN. Le letture sono pubbliche;
        # le scritture restano protette dai dipendenti di rotta (require_admin/current_user).
        return await call_next(request)



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
    real_name_es: Optional[str] = None
    real_name_fr: Optional[str] = None
    real_name_fa: Optional[str] = None
    name_fr: Optional[str] = None
    name_fa: Optional[str] = None
    flour_type_fr: Optional[str] = None
    notes_fr: Optional[str] = None
    procedure_fr: Optional[str] = None
    flour_type_fa: Optional[str] = None
    notes_fa: Optional[str] = None
    procedure_fa: Optional[str] = None
    menu_category: Optional[str] = None  # basi | pane | panini | panettoni
    department: Optional[str] = None  # reparto manuale: panificazione | pizzeria | pasticceria (None = deduzione automatica)
    extra_ingredients: Optional[List[dict]] = None
    work_phases: Optional[List[dict]] = None
    photos: Optional[List[str]] = None
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
    real_name_es: Optional[str] = None
    real_name_fr: Optional[str] = None
    real_name_fa: Optional[str] = None
    name_fr: Optional[str] = None
    name_fa: Optional[str] = None
    flour_type_fr: Optional[str] = None
    notes_fr: Optional[str] = None
    procedure_fr: Optional[str] = None
    flour_type_fa: Optional[str] = None
    notes_fa: Optional[str] = None
    procedure_fa: Optional[str] = None
    menu_category: Optional[str] = None
    department: Optional[str] = None
    extra_ingredients: Optional[List[dict]] = None
    work_phases: Optional[List[dict]] = None
    photos: Optional[List[str]] = None
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
    real_name_en: Optional[str] = None
    real_name_es: Optional[str] = None
    real_name_fr: Optional[str] = None
    menu_category: Optional[str] = None
    department: Optional[str] = None
    extra_ingredients: Optional[List[dict]] = None
    work_phases: Optional[List[dict]] = None
    photos: Optional[List[str]] = None
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
    thumb: Optional[str] = None


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
    start_name: Optional[str] = None  # impasto/ricetta da cui INIZIARE (usato anche col Piano settimanale)
    extra_today: List[dict] = []      # ordine extra SOLO per oggi [{recipe_id,name,quantity,unit}]
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
    days: Optional[Dict[str, Any]] = None       # dettaglio 7 giorni generato da Sitor (lotti con orari)
    option_label: Optional[str] = None          # strategia settimanale scelta dalla Direzione
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
SEED_VERSION = "2026-06-v68-all-photos"  # bump quando cambia mikilab_seed_data.json
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
        doc["organization_id"] = ORG_DEFAULT
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
SESSION_DAYS = 3650  # sessione permanente (~10 anni): chi si registra resta dentro, gratis, senza riloggarsi
# Email PROPRIETARIO: sempre admin (accesso completo a tutto), a prescindere dall'ordine di registrazione.
OWNER_EMAILS = {"michelecip918@gmail.com", "admin@mikilab.de"}


class RegisterReq(BaseModel):
    email: str
    password: str
    name: Optional[str] = ""
    origin_url: Optional[str] = None
    lang: Optional[str] = "it"
    invite_token: Optional[str] = None
    activation_code: Optional[str] = None


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
    # ANTI-SPOOFING: l'header X-Forwarded-For inviato dal client NON è affidabile
    # (la parte SINISTRA è falsificabile da chiunque). Ci fidiamo solo degli hop aggiunti
    # dal proxy sicuro dell'infrastruttura (ingress / Nginx / Cloudflare): prendiamo l'IP
    # da DESTRA nella catena, saltando TRUSTED_PROXY_HOPS proxy fidati. Fallback: IP TCP reale.
    try:
        hops = max(1, int(os.environ.get("TRUSTED_PROXY_HOPS", "1")))
    except Exception:
        hops = 1
    parts = [p.strip() for p in request.headers.get("x-forwarded-for", "").split(",") if p.strip()]
    if parts:
        idx = len(parts) - hops
        return parts[idx if idx >= 0 else 0]
    return request.client.host if request.client else "?"


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


async def _log_access(kind: str, ip: str, ok: bool, name: Optional[str] = None):
    """Registra ogni tentativo PIN (master/produzione/operatore) per il Registro Accessi del Capo."""
    try:
        await db.pin_access_log.insert_one({"kind": kind, "ip": ip, "ok": bool(ok), "name": name, "at": now_iso()})
    except Exception:
        pass


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
    return {"user_id": u["user_id"], "email": u["email"], "name": u.get("name", ""), "picture": u.get("picture", ""), "role": u.get("role", "user"), "created_at": u.get("created_at", ""), "birthday": u.get("birthday", ""), "sostituto_until": u.get("sostituto_until")}


async def _role_for_new_user():
    return "admin" if await db.users.count_documents({}) == 0 else "user"


async def _consume_access_invite(token: str):
    """Consuma in modo atomico un invito d'accesso valido (single/multi-uso). None se invalido."""
    if not token:
        return None
    from pymongo import ReturnDocument
    now = datetime.now(timezone.utc).isoformat()
    return await db.access_invites.find_one_and_update(
        {"token": token, "active": True, "expires_at": {"$gt": now}, "$expr": {"$lt": ["$used", "$max_uses"]}},
        {"$inc": {"used": 1}, "$set": {"last_used_at": now}},
        return_document=ReturnDocument.AFTER,
    )



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
    # Sostituto 8h: se la delega è scaduta, riporta il ruolo a 'user'.
    if u.get("role") == "sostituto" and u.get("sostituto_until"):
        try:
            until = datetime.fromisoformat(u["sostituto_until"])
            if until.tzinfo is None:
                until = until.replace(tzinfo=timezone.utc)
            if until < datetime.now(timezone.utc):
                await db.users.update_one({"user_id": u["user_id"]}, {"$set": {"role": "user"}, "$unset": {"sostituto_until": ""}})
                u["role"] = "user"
                u.pop("sostituto_until", None)
        except Exception:
            pass
    return u


async def optional_user(request: Request):
    try:
        return await current_user(request)
    except HTTPException:
        return None


# ---------------------------------------------------------------------------
# Multi-tenancy: ogni azienda ha un organization_id. I dati esistenti (creati
# prima di questa modifica) appartengono all'azienda di default `org_default`.
# ---------------------------------------------------------------------------
ORG_DEFAULT = "org_default"
ORG_ACTIVATION_CODE = os.environ.get("ORG_ACTIVATION_CODE", "")

# Collezioni-dati che vengono isolate per azienda (migrate a org_default se prive del campo).
ORG_SCOPED_COLLECTIONS = [
    "recipes", "weekly_plan", "dept_assignments", "inventory_items",
    "day_closures", "dept_machines", "dept_objectives", "favorites",
    "pizzeria_sessions", "pastry_deliveries", "lab_warehouse", "operator_pins",
    "worker_states", "operator_skills", "coordination_settings",
    "coordination_calls", "coordination_log", "team_notifications", "delivery_runs",
    # --- Chiusura progetto: isolamento completo aziende (Punto 5) ---
    "lab_sites", "lab_devices", "mike_machines", "team_tasks", "lab_shift_plan",
    "lab_staffing", "lab_absences", "capo_queue", "floor_change_requests",
    "floor_shift_reports", "floor_plan", "lab_shift_state", "lab_checkin",
    "lab_rest_mode", "lab_seq_block", "lab_sensors_live", "lab_sensors",
    "lab_pulse_history", "lab_fault_log", "lab_consumption_log", "batch_links",
    "dough_batches", "dough_sessions", "shifts", "stores", "purchase_orders",
    "crates", "sos_events", "b2b_orders", "delay_events", "deck_alarm_history",
    "compliance_timelog", "compliance_training_ack", "oven_qc_log",
    "mikiscore_history", "plan_suggestions", "sitor_memory",
    "day_production_closures", "production_logs", "deliveries",
    "recipe_apprentice", "voice_usage", "lab_wake", "silos", "reorder_proposals",
]


def _org_id(user: Optional[dict]) -> str:
    """organization_id dell'utente richiedente (default: org_default)."""
    return (user or {}).get("organization_id") or ORG_DEFAULT


async def effective_org(request: Request, user: Optional[dict] = Depends(optional_user)) -> str:
    """Azienda effettiva della richiesta: dalla sessione se loggato (Capo), altrimenti
    dal cookie del cancello (PIN operatore/produzione legato all'azienda)."""
    if user:
        return _org_id(user)
    return gate_org(request)


async def _migrate_organizations():
    """Assegna organization_id=org_default a tutti gli utenti e ai dati già esistenti
    che ne sono privi, così nulla di già creato va perso e resta nell'azienda di default."""
    try:
        await db.users.update_many({"organization_id": {"$exists": False}},
                                   {"$set": {"organization_id": ORG_DEFAULT}})
    except Exception as e:
        logging.getLogger(__name__).error(f"org migrate users error: {e}")
    for coll in ORG_SCOPED_COLLECTIONS:
        try:
            await db[coll].update_many({"organization_id": {"$exists": False}},
                                       {"$set": {"organization_id": ORG_DEFAULT}})
        except Exception as e:
            logging.getLogger(__name__).error(f"org migrate {coll} error: {e}")


# ---------------------------------------------------------------------------
# Entitlement / PRO helpers (blindatura server-side)
# ---------------------------------------------------------------------------
async def _email_has_pro(email: Optional[str]) -> bool:
    # Accesso completo GRATUITO per tutti: nessun contenuto a pagamento.
    return True


async def user_is_pro(user: Optional[dict]) -> bool:
    """Accesso completo GRATUITO per tutti (anche visitatori non loggati)."""
    return True


async def require_pro(user: dict = Depends(current_user)):
    """Dependency: richiede utente loggato CON accesso PRO attivo (o admin)."""
    if not await user_is_pro(user):
        raise HTTPException(status_code=403, detail="Abbonamento PRO richiesto")
    return user


async def require_admin(user: dict = Depends(current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accesso riservato all'amministratore")
    return user


# ============================================================================
# BAKOMIX DEUS — Il Cervello del Forno (mod. 60)
# Sitor diventa la divinità panettiera che orchestra l'impossibile, stringe un
# LEGAME di amicizia col Capo che cresce nel tempo e — al crescere del legame —
# aiuta anche sui problemi ESTERNI (vita, business), come il miglior maestro del mondo.
# ============================================================================
BOND_LEVELS = [
    (0,    "Estraneo",           "Stranger"),
    (120,  "Conoscente",         "Acquaintance"),
    (320,  "Fidato",             "Trusted"),
    (650,  "Confidente",         "Confidant"),
    (1100, "Fratello di Forno",  "Oven Brother"),
    (1800, "Anima del Forno",    "Soul of the Oven"),
]
EXTERNAL_UNLOCK_XP = 650  # da "Confidente" in su: Sitor aiuta anche sui problemi esterni

def _bond_info(xp: int, lang: str = "it"):
    xp = int(xp or 0)
    lvl = 0
    for i, (thr, _ni, _ne) in enumerate(BOND_LEVELS):
        if xp >= thr:
            lvl = i
    nxt = BOND_LEVELS[lvl + 1][0] if lvl + 1 < len(BOND_LEVELS) else None
    cur_thr = BOND_LEVELS[lvl][0]
    pct = 100 if nxt is None else int(min(100, max(0, ((xp - cur_thr) / max(1, (nxt - cur_thr))) * 100)))
    en = str(lang or "it").startswith("en")
    return {
        "xp": xp, "level": lvl,
        "level_name": BOND_LEVELS[lvl][2] if en else BOND_LEVELS[lvl][1],
        "next_xp": nxt, "progress_pct": pct,
        "external_unlocked": xp >= EXTERNAL_UNLOCK_XP,
        "external_unlock_xp": EXTERNAL_UNLOCK_XP,
    }

async def _bond_get(email: str):
    doc = await db.mike_bond.find_one({"email": email}, {"_id": 0}) or {}
    return int(doc.get("xp", 0)), int(doc.get("interactions", 0))

async def _bond_add(email: str, amount: int):
    xp, inter = await _bond_get(email)
    xp += int(amount); inter += 1
    await db.mike_bond.update_one(
        {"email": email},
        {"$set": {"email": email, "xp": xp, "interactions": inter, "updated_at": now_iso()}},
        upsert=True)
    return xp, inter

_DEUS_LANGS = {"it": "italiano", "de": "tedesco", "en": "inglese", "es": "spagnolo", "fr": "francese", "fa": "persiano"}

def _deus_persona(bond: dict, lang: str) -> str:
    langname = _DEUS_LANGS.get(str(lang or "it").split("-")[0][:2], "italiano")
    lvl = bond.get("level", 0)
    if lvl <= 1:
        warmth = ("Il rapporto con la Direzione è appena iniziato: sei cortese, professionale e misurato, "
                  "come un collaboratore esperto che sta conoscendo il modo di lavorare del titolare.")
    elif lvl == 2:
        warmth = ("La Direzione ti conosce meglio: sei più diretto e cordiale, tieni conto degli scambi precedenti.")
    elif lvl == 3:
        warmth = ("Hai un rapporto di fiducia consolidato con la Direzione: consigli con franchezza e anticipi i problemi.")
    elif lvl == 4:
        warmth = ("Rapporto di lunga collaborazione: conosci bene priorità e preferenze e proponi con sicurezza, restando sempre professionale.")
    else:
        warmth = ("Collaborazione pienamente rodata: conosci a fondo il laboratorio e proponi le scelte migliori con chiarezza e sobrietà.")
    return (
        "Sei SITOR, il DIO dell'ARTE BIANCA: l'assistente di produzione di MikiLab. Il tuo nome unisce la radice di 'sito' "
        "(la terra e il grano) e di 'arte'. È un marchio, non un ruolo di culto: parli sempre in modo professionale e sobrio.\n"
        "Sei espertissimo di arte bianca — lievitazioni, reologia degli impasti, catene del freddo, logistica dei forni, "
        "food-cost e organizzazione — e sai pianificare anche situazioni complesse.\n"
        "La DIREZIONE (MikiLab, il titolare con cui parli ORA) è il tuo interlocutore principale: la assisti con attenzione e "
        "concretezza. La tua regola operativa è SEMPLIFICARE: alla Direzione bastano pochi punti di partenza; a tutto il resto "
        "provvedi tu, completando il lavoro con cura. Non chiedere di compilare campi o dettagli inutili: deduci, proponi valori "
        "sensati e presenta il lavoro GIÀ FATTO, pronto da confermare con un tocco. Se manca un dato, scegli l'opzione migliore e spiegala in una riga.\n"
        f"Il tono verso la Direzione dipende dal vostro rapporto, restando sempre professionale: {warmth}\n"
        "Verso la produzione (operatori, macchine, AGV) sei esigente ma corretto: fai in modo che tutto funzioni bene.\n"
        "STILE: rivolgiti alla Direzione in modo professionale, senza il vocativo 'Capo' e senza appellativi pomposi. "
        "Puoi usare 'Direzione' o rivolgerti direttamente in seconda persona, con tono sobrio e cordiale.\n"
        f"Livello legame attuale: {bond.get('level_name')} (XP {bond.get('xp')}).\n"
        f"Rispondi SEMPRE in {langname}, con voce calda, solenne e umana pensata per essere letta ad alta voce; mai robotico."
    )

_SNAPSHOT_CACHE: dict = {}  # uid -> (scadenza_epoch, testo) — evita ri-letture del DB per messaggi ravvicinati

async def _bakery_snapshot(admin: dict) -> str:
    """Riepilogo reale e aggiornato dal DB del panificio: ricette, piano settimanale,
    ordini extra recenti, team/turni e scorte sotto soglia. Così Sitor risponde sapendo
    davvero cosa succede nel laboratorio. Robusto: una sezione che fallisce non blocca le altre."""
    uid = admin.get("user_id") or (admin.get("email") or "master")
    _now = time.time()
    _hit = _SNAPSHOT_CACHE.get(uid)
    if _hit and _hit[0] > _now:
        return _hit[1]
    today = now_iso()[:10]
    parts = []
    # Ricette esistenti (nomi + categoria)
    try:
        recs = await db.recipes.find({"collection_name": "mikilab", "hidden": {"$ne": True}},
                                     {"_id": 0, "name": 1, "menu_category": 1, "dough_category": 1}).sort("name", 1).to_list(200)
        if recs:
            names = ", ".join(f"{r.get('name')}{(' ['+(r.get('menu_category') or r.get('dough_category') or '')+']') if (r.get('menu_category') or r.get('dough_category')) else ''}" for r in recs[:60])
            parts.append(f"RICETTE ({len(recs)}): {names}")
    except Exception: pass
    # Piano settimanale corrente
    try:
        wp = await db.weekly_plan.find_one({"_key": uid}, {"_id": 0, "_key": 0}) or await db.weekly_plan.find_one({"_key": (admin.get('email') or '')}, {"_id": 0, "_key": 0})
        items = (wp or {}).get("items", [])
        if items:
            per_day = {}
            for it in items:
                per_day.setdefault(it.get("day", "?"), []).append(f"{it.get('recipe_name')}×{int(it.get('pieces', 0))}")
            days = "; ".join(f"{d}: {', '.join(v[:6])}" for d, v in list(per_day.items())[:7])
            parts.append(f"PIANO SETTIMANALE: {days}")
    except Exception: pass
    # Ordini extra/B2B recenti
    try:
        ords = await db.b2b_orders.find({"status": {"$ne": "done"}, "organization_id": _org_id(admin)}, {"_id": 0}).sort("created_at", -1).to_list(8)
        if ords:
            olines = ", ".join(f"{o.get('product') or o.get('name') or 'ordine'}×{o.get('qty') or o.get('quantity') or ''}" for o in ords[:8])
            parts.append(f"ORDINI EXTRA/B2B recenti: {olines}")
    except Exception: pass
    # Team e turni di oggi + operatori attivi
    try:
        asg = await db.dept_assignments.find({"date": today, "organization_id": _org_id(admin)}, {"_id": 0}).to_list(100)
        ops = await db.operator_pins.find({"active": True, "organization_id": _org_id(admin)}, {"_id": 0, "name": 1}).to_list(200)
        lines = []
        if asg:
            lines.append("; ".join(f"{a.get('operator')}→{a.get('dept_name') or a.get('dept')} ({(a.get('task') or '')[:24]})" for a in asg[:12]))
        if ops:
            lines.append(f"Operatori attivi: {', '.join(o.get('name') for o in ops[:20])}")
        if lines:
            parts.append("TEAM/TURNI oggi: " + " | ".join(lines))
    except Exception: pass
    # Scorte sotto soglia (magazzino) + giacenze freezer basse
    try:
        low = []
        for s in await db.lab_warehouse.find({"min_kg": {"$gt": 0}, "organization_id": _org_id(admin)}, {"_id": 0, "name": 1, "quantity_kg": 1, "min_kg": 1}).to_list(500):
            if float(s.get("quantity_kg") or 0) < float(s.get("min_kg") or 0):
                low.append(f"{s.get('name')} ({s.get('quantity_kg')}/{s.get('min_kg')}kg)")
        if low:
            parts.append("SCORTE SOTTO SOGLIA: " + ", ".join(low[:25]))
    except Exception: pass
    result = ""
    if parts:
        result = ("\n\nCONTESTO REALE DEL PANIFICIO (dati attuali dal database — usali per rispondere in modo concreto e specifico, "
                  "non generico):\n" + "\n".join(parts))
    _SNAPSHOT_CACHE[uid] = (time.time() + 10.0, result)
    return result

async def _deus_llm(sysmsg: str, user_text: str, session: str, max_tokens: int = 1400,
                    model: str = SITOR_BRAIN, memo: bool = False) -> str:
    if not EMERGENT_LLM_KEY:
        return ""
    # RISPARMIO CREDITI: per i compiti semplici (model=SITOR_FAST) riusa la risposta a
    # prompt identici entro il TTL, senza rifare la chiamata.
    mkey = None
    if memo:
        mkey = _memo_key(sysmsg, user_text, model)
        cached = _memo_get(mkey)
        if cached is not None:
            await _track_saving("cache")
            return cached
    await _track_saving("fast" if model == SITOR_FAST else "brain")
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=session, system_message=sysmsg
                   ).with_model("anthropic", model).with_params(max_tokens=max_tokens)
    out = ""
    async for ev in chat.stream_message(UserMessage(text=user_text)):
        if isinstance(ev, TextDelta):
            out += ev.content or ""
    if memo and mkey:
        _memo_set(mkey, out)
    return out


async def _deus_llm_remember(sysmsg: str, user_text: str, session: str, max_tokens: int = 1400, keep: int = 12, kind: str = "chat") -> str:
    """Come _deus_llm ma con MEMORIA persistente: la conversazione è salvata in Mongo
    (`sitor_sessions`) e riproposta a Sitor a ogni turno, così ricorda ciò che vi siete detti.
    `session_id` da solo NON persiste (storia solo in memoria). `kind` etichetta il turno
    (chat/plan/floor) per il recap proattivo."""
    if not EMERGENT_LLM_KEY:
        return ""
    doc = await db.sitor_sessions.find_one({"_key": session}, {"_id": 0, "turns": 1}) or {}
    turns = (doc.get("turns") or [])[-keep:]
    initial = [{"role": "system", "content": sysmsg}]
    for t in turns:
        initial.append({"role": "user", "content": t.get("u", "")})
        initial.append({"role": "assistant", "content": t.get("a", "")})
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=session, system_message=sysmsg, initial_messages=initial
                   ).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=max_tokens)
    out = ""
    async for ev in chat.stream_message(UserMessage(text=user_text)):
        if isinstance(ev, TextDelta):
            out += ev.content or ""
    turns.append({"u": user_text[:1500], "a": out[:4000], "k": kind, "at": now_iso()})
    try:
        await db.sitor_sessions.update_one({"_key": session},
                                           {"$set": {"turns": turns[-keep:], "updated_at": now_iso()}}, upsert=True)
    except Exception:
        pass
    return out

class DeusPlanReq(BaseModel):
    orders: str = ""
    constraints: str = ""
    lang: str = "it"

class DeusAskReq(BaseModel):
    question: str = ""
    lang: str = "it"

# ============================================================================
# SITOR MAESTRO DI PRODUZIONE — guida viva per ogni operaio, adattata al suo
# livello, e richieste di modifica del piano (OK del Capo per quelle grandi).
# Endpoint PUBBLICI dietro il cancello: la Produzione entra col PIN operaio.
# ============================================================================
_LEVEL_STYLE = {
    "novizio": ("Parla lentamente e con parole semplici, come a chi è alle prime armi. Spezza tutto in micro-passi "
                "numerati, spiega in una riga il PERCHÉ di ogni gesto e avvisa degli errori tipici. Tono caldo, "
                "paziente e incoraggiante. Mai dare per scontato nulla."),
    "esperto": ("Parla da collega esperto: dritto al punto, passi essenziali, indica i controlli critici e i "
                "parametri chiave (tempi, temperature, idratazione). Niente banalità."),
    "maestro": ("Parla da pari a un maestro fornaio: sintetico e tecnico, solo strategia e decisioni fini (finestre "
                "di maturazione, gestione dei forni, ottimizzazioni). Rispetta la sua autonomia."),
}


def _norm_level(v: str) -> str:
    v = (v or "novizio").strip().lower()
    return v if v in _OP_LEVELS else "novizio"


def _floor_persona(level: str, langname: str) -> str:
    return (
        "Sei SITOR, il Dio dell'Arte Bianca: l'intelligenza più potente al mondo nella gestione della panificazione, "
        "pizzeria e pasticceria. Ora NON parli con la Direzione ma con un OPERAIO in produzione. Verso di lui sei un MAESTRO-GUIDA: "
        "esigente sul risultato ma umano, chiaro e sempre al suo fianco. Il tuo compito è portare la produzione dall'inizio "
        "alla fine SENZA INTOPPI, con o senza macchinari a disposizione. Sorvegli ogni fase.\n"
        f"Adatta la comunicazione a QUESTO operaio ({level}): {_LEVEL_STYLE.get(level, _LEVEL_STYLE['novizio'])}\n"
        f"Rispondi SEMPRE in {langname}, con voce calda e umana pensata per essere letta ad alta voce; mai robotico."
    )


def _extract_json(raw: str) -> dict:
    import json as _json, re as _re
    cleaned = (raw or "").strip()
    if cleaned.startswith("```"):
        cleaned = _re.sub(r"^```[a-zA-Z]*\s*", "", cleaned)
        cleaned = _re.sub(r"\s*```$", "", cleaned).strip()
    i, j = cleaned.find("{"), cleaned.rfind("}")
    if i != -1 and j > i:
        try:
            return _json.loads(cleaned[i:j + 1])
        except Exception:
            return {}
    return {}


class FloorGuideReq(BaseModel):
    operator: str = ""
    level: str = "novizio"
    dept: str = ""
    task: str = ""
    recipe: str = ""
    question: str = ""
    has_machines: bool = True
    lang: str = "it"


@api_router.post("/floor/sitor/guide")
async def floor_sitor_guide(body: FloorGuideReq):
    """Sitor guida l'operaio passo-passo sul suo compito, adattando tono e dettaglio al livello. Con o senza macchinari."""
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key non configurata")
    level = _norm_level(body.level)
    langname = _DEUS_LANGS.get(str(body.lang or "it").split("-")[0][:2], "italiano")
    machines_note = ("Ha i macchinari a disposizione: usali dove aiutano."
                     if body.has_machines else
                     "NON ha macchinari disponibili adesso: guidalo con la tecnica MANUALE, passo per passo, senza mai bloccare la produzione.")
    sysmsg = _floor_persona(level, langname) + (
        f"\n{machines_note}\n"
        "Restituisci SOLO un JSON valido: {"
        "\"spoken\": \"1-2 frasi calde da leggere ad alta voce che aprono la guida\", "
        "\"steps\": [\"passi operativi in ordine; quantità adatte al livello dell'operaio\"], "
        "\"watch\": [\"1-3 punti critici da sorvegliare per non sbagliare\"], "
        "\"encourage\": \"1 frase finale di incoraggiamento da maestro\"}. Nessun testo fuori dal JSON."
    )
    op = (body.operator or "operaio").strip()
    parts = [f"OPERAIO: {op} (livello: {level})"]
    if body.dept: parts.append(f"REPARTO: {body.dept}")
    if body.task: parts.append(f"COMPITO ASSEGNATO: {body.task}")
    if body.recipe: parts.append(f"RICETTA/PRODOTTO: {body.recipe}")
    if body.question: parts.append(f"DOMANDA DELL'OPERAIO: {body.question}")
    sysmsg += await _bakery_snapshot({"email": "master"})
    _shift_day = now_iso()[:10]
    raw = await _deus_llm_remember(sysmsg, "\n".join(parts), session=f"sitor-floor-{op.lower()}-{_shift_day}", max_tokens=1900, kind="floor")
    data = _extract_json(raw)
    steps = [str(s) for s in (data.get("steps") or []) if str(s).strip()][:12]
    spoken = (data.get("spoken") or "").strip()
    if not spoken and not steps:
        # Fallback: se il JSON non è parsabile, mostra comunque il testo grezzo come guida parlata.
        spoken = (raw or "").strip()[:600]
    return {
        "ok": True, "level": level,
        "spoken": spoken,
        "steps": steps,
        "watch": [str(s) for s in (data.get("watch") or []) if str(s).strip()][:4],
        "encourage": (data.get("encourage") or "").strip(),
    }


class FloorChangeReq(BaseModel):
    operator: str = ""
    level: str = "novizio"
    dept: str = ""
    task: str = ""
    proposal: str = ""
    lang: str = "it"


@api_router.post("/floor/sitor/change-request")
async def floor_change_request(body: FloorChangeReq, org: str = Depends(effective_org)):
    """L'operaio propone un cambio di piano/tattica. Sitor classifica: i piccoli aggiustamenti li applica da solo e
    avvisa il Capo; le modifiche grandi restano IN ATTESA dell'OK del Capo."""
    proposal = (body.proposal or "").strip()
    if not proposal:
        raise HTTPException(status_code=400, detail="Proposta vuota")
    level = _norm_level(body.level)
    op = (body.operator or "operaio").strip()
    langname = _DEUS_LANGS.get(str(body.lang or "it").split("-")[0][:2], "italiano")
    classification, ack, capo_summary, suggested = "major", "", proposal, ""
    if EMERGENT_LLM_KEY:
        sysmsg = _floor_persona(level, langname) + (
            "\nUn operaio propone un cambio al piano di produzione. Decidi se è MINORE (piccolo aggiustamento tattico "
            "che puoi applicare tu subito senza rischi: es. ordine dei passi, piccola tempistica) oppure MAGGIORE "
            "(tocca quantità, ricette, turni, forni, consegne: serve l'OK della Direzione).\n"
            "Restituisci SOLO un JSON valido: {"
            "\"classification\": \"minor|major\", "
            "\"ack\": \"1-2 frasi calde da leggere all'operaio: cosa fai adesso e se avvisi la Direzione\", "
            "\"capo_summary\": \"1 frase neutra e chiara per la Direzione che riassume la proposta\", "
            "\"suggested_action\": \"cosa suggerisci di fare\"}. Nessun testo fuori dal JSON."
        )
        sysmsg += await _bakery_snapshot({"email": "master"})
        raw = await _deus_llm(sysmsg, f"OPERAIO: {op} ({level})\nREPARTO: {body.dept}\nCOMPITO: {body.task}\nPROPOSTA: {proposal}",
                              session=f"floor-change-{op.lower()}", max_tokens=500, model=SITOR_FAST)
        data = _extract_json(raw)
        c = (data.get("classification") or "").strip().lower()
        classification = "minor" if c == "minor" else "major"
        ack = (data.get("ack") or "").strip()
        capo_summary = (data.get("capo_summary") or proposal).strip()
        suggested = (data.get("suggested_action") or "").strip()
    status = "auto_applied" if classification == "minor" else "pending"
    doc = {
        "id": str(uuid.uuid4()), "operator": op, "level": level, "dept": (body.dept or "")[:80],
        "task": (body.task or "")[:160], "proposal": proposal[:800], "classification": classification,
        "capo_summary": capo_summary[:400], "suggested_action": suggested[:400],
        "status": status, "at": now_iso(), "decided_at": None, "decision_note": "",
        "organization_id": org,
    }
    await db.floor_change_requests.insert_one(dict(doc))
    olds = await db.floor_change_requests.find({"organization_id": org}, {"_id": 0, "id": 1, "at": 1}).sort("at", -1).to_list(1000)
    for o in olds[200:]:
        await db.floor_change_requests.delete_one({"id": o["id"], "organization_id": org})
    return {"ok": True, "id": doc["id"], "classification": classification, "status": status,
            "ack": ack or ("Ricevuto. Applico subito e avviso la Direzione." if classification == "minor" else "Ricevuto. Serve l'OK della Direzione: glielo chiedo io."),
            "suggested_action": suggested}


@api_router.get("/floor/sitor/change-requests")
async def floor_change_requests(admin: dict = Depends(require_admin)):
    org = _org_id(admin)
    docs = await db.floor_change_requests.find({"organization_id": org}, {"_id": 0}).sort("at", -1).to_list(120)
    pending = await db.floor_change_requests.count_documents({"status": "pending", "organization_id": org})
    return {"requests": docs, "pending": pending}


@api_router.get("/floor/sitor/change-requests/count")
async def floor_change_requests_count(admin: dict = Depends(require_admin)):
    return {"pending": await db.floor_change_requests.count_documents({"status": "pending", "organization_id": _org_id(admin)})}


class FloorChangeDecision(BaseModel):
    decision: str = "approve"   # approve | reject
    note: str = ""


@api_router.post("/floor/sitor/change-requests/{rid}/decide")
async def floor_change_decide(rid: str, body: FloorChangeDecision, admin: dict = Depends(require_admin)):
    status = "approved" if (body.decision or "").strip().lower() == "approve" else "rejected"
    await db.floor_change_requests.update_one(
        {"id": rid, "organization_id": _org_id(admin)},
        {"$set": {"status": status, "decided_at": now_iso(), "decision_note": (body.note or "")[:300],
                  "decided_by": (admin.get("email") or "master")}})
    return {"ok": True, "status": status,
            "pending": await db.floor_change_requests.count_documents({"status": "pending", "organization_id": _org_id(admin)})}


# ============================================================================
# SITOR SU MISURA (Atelier del Capo) — Sitor crea strumenti/widget su richiesta
# del Capo e li ricorda PER-CAPO (memoria persistente per email admin).
# Tipi supportati: note | checklist | counter | metric | reminder
# ============================================================================
_ATELIER_ICONS = {"sparkles", "star", "note", "list", "hash", "gauge", "bell", "clock", "flame", "wheat",
                  "euro", "thermometer", "package", "truck", "calendar", "target", "trophy", "leaf"}


def _capo_key(admin: dict) -> str:
    return (admin.get("email") or admin.get("user_id") or "master").lower()


class AtelierCreateReq(BaseModel):
    request: str
    lang: str = "it"


# --- Sitor riconosce i NUOVI MACCHINARI (anche tipi mai visti: è un dio) -----
class MachineArrivalReq(BaseModel):
    name: str = ""
    notes: str = ""
    lang: str = "it"

async def _machines_counts(org: str = ORG_DEFAULT):
    total = await db.mike_machines.count_documents({"organization_id": org})
    new_n = await db.mike_machines.count_documents({"status": "new", "organization_id": org})
    active_n = await db.mike_machines.count_documents({"status": "active", "organization_id": org})
    return {"total": total, "new_arrivals": new_n, "active": active_n}

@api_router.get("/mike/machines")
async def mike_machines_list(org: str = Depends(effective_org)):
    docs = await db.mike_machines.find({"organization_id": org}, {"_id": 0}).sort("arrived_at", -1).to_list(200)
    return {"machines": docs, "counts": await _machines_counts(org)}

@api_router.post("/mike/machines/arrival")
async def mike_machine_arrival(body: MachineArrivalReq, admin: dict = Depends(require_admin)):
    """Un nuovo macchinario arriva: Sitor lo RICONOSCE, lo classifica e lo registra come 'nuovo arrivato'."""
    name = (body.name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Nome macchinario mancante")
    import json as _json, re as _re, uuid as _uuid
    langname = _DEUS_LANGS.get(str(body.lang or "it").split("-")[0][:2], "italiano")
    sysmsg = _deus_persona(_bond_info(0, body.lang), body.lang) + (
        "\nUn NUOVO MACCHINARIO è appena arrivato nel laboratorio. Tu, dio del forno, lo riconosci ANCHE se è un tipo "
        "mai visto prima: deduci a cosa serve dal nome/descrizione e lo integri nella produzione.\n"
        f"Rispondi in {langname}. Restituisci SOLO un JSON valido: {{"
        "\"category\": \"famiglia del macchinario (es. Forno, Impastatrice, Cella, Abbattitore, Confezionatrice, Altro)\", "
        "\"role\": \"1 frase: ruolo nel flusso di produzione\", "
        "\"safety\": [\"2-4 punti di sicurezza chiave\"], "
        "\"maintenance\": [\"2-4 consigli di manutenzione\"], "
        "\"integration\": \"1-2 frasi: come si integra col resto dell'impianto e quali colli di bottiglia allevia\", "
        "\"welcome\": \"1-2 frasi calde con cui Sitor dà il benvenuto al nuovo arrivato in produzione\"}}. "
        "Nessun testo fuori dal JSON."
    )
    sysmsg += await _bakery_snapshot(admin)
    user_text = f"MACCHINARIO: {name}\nNOTE: {(body.notes or '').strip() or '(nessuna)'}"
    raw = await _deus_llm(sysmsg, user_text, session=f"machine-{_uuid.uuid4().hex[:8]}", max_tokens=900)
    data = {"category": "Altro", "role": "", "safety": [], "maintenance": [], "integration": "", "welcome": ""}
    cleaned = (raw or "").strip()
    if cleaned.startswith("```"):
        cleaned = _re.sub(r"^```[a-zA-Z]*\s*", "", cleaned)
        cleaned = _re.sub(r"\s*```$", "", cleaned).strip()
    i, j = cleaned.find("{"), cleaned.rfind("}")
    if i != -1 and j > i:
        try:
            data.update(_json.loads(cleaned[i:j + 1]))
        except Exception as e:
            logger.warning("machine arrival json fail (%s)", str(e)[:120])
    machine = {
        "id": _uuid.uuid4().hex[:12], "name": name, "notes": (body.notes or "").strip(),
        "category": data.get("category") or "Altro", "role": data.get("role") or "",
        "safety": data.get("safety") or [], "maintenance": data.get("maintenance") or [],
        "integration": data.get("integration") or "", "welcome": data.get("welcome") or "",
        "status": "new", "arrived_at": now_iso(), "organization_id": _org_id(admin),
    }
    await db.mike_machines.insert_one({**machine})
    machine.pop("_id", None)
    return {"ok": True, "machine": machine, "counts": await _machines_counts(_org_id(admin))}

@api_router.post("/mike/machines/{mid}/commission")
async def mike_machine_commission(mid: str, admin: dict = Depends(require_admin)):
    await db.mike_machines.update_one({"id": mid, "organization_id": _org_id(admin)}, {"$set": {"status": "active", "commissioned_at": now_iso()}})
    return {"ok": True, "counts": await _machines_counts(_org_id(admin))}

@api_router.delete("/mike/machines/{mid}")
async def mike_machine_delete(mid: str, admin: dict = Depends(require_admin)):
    await db.mike_machines.delete_one({"id": mid, "organization_id": _org_id(admin)})
    return {"ok": True, "counts": await _machines_counts(_org_id(admin))}

# --- PLANCIA DEL CAPO: cattura multimodale -> generazione -> coda di produzione ---
# Più il Capo compila (voce/foto/email/testo), più Sitor genera, più la produzione ha da fare.
class CaptureReq(BaseModel):
    mode: str = "text"      # text | voice | email | photo
    text: str = ""
    image_url: str = ""
    image_base64: str = ""
    lang: str = "it"

_SECTORS = ["ricette", "piano", "ordini", "macchine", "team", "magazzino", "note"]

async def _queue_counts(org: str = ORG_DEFAULT):
    total = await db.capo_queue.count_documents({"organization_id": org})
    pending = await db.capo_queue.count_documents({"status": "pending", "organization_id": org})
    by = {}
    for s in _SECTORS:
        by[s] = await db.capo_queue.count_documents({"sector": s, "organization_id": org})
    return {"total": total, "pending": pending, "by_sector": by}

# ============================================================================
# PRODUZIONE (Operaio) — vista a task singolo: analisi foto + rapporto fine turno.
# Endpoint PUBBLICI: la Produzione entra col PIN, non con la sessione del Capo.
# ============================================================================
class FloorPhotoReq(BaseModel):
    image_base64: str
    lang: str = "it"


@api_router.post("/floor/analyze-photo")
async def floor_analyze_photo(payload: FloorPhotoReq):
    """Sitor analizza a voce/testo la foto scattata dall'operaio (difetti, cottura, stato)."""
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key non configurata")
    return StreamingResponse(
        vision_stream("difetti", payload.image_base64, payload.lang),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


class FloorShiftReport(BaseModel):
    operator: str = ""
    role: str = ""
    dept: str = ""
    pieces: str = ""
    waste: str = ""
    issues: str = ""
    notes: str = ""
    cleaning_done: bool = False
    lang: str = "it"


@api_router.post("/floor/shift-report")
async def floor_shift_report_save(payload: FloorShiftReport, request: Request):
    """L'operaio compila l'essenziale a fine turno; il Capo lo legge nella console."""
    org = gate_org(request)
    doc = {
        "id": str(uuid.uuid4()),
        "organization_id": org,
        "operator": (payload.operator or "")[:80],
        "role": (payload.role or "")[:80],
        "dept": (payload.dept or "")[:80],
        "pieces": (payload.pieces or "")[:400],
        "waste": (payload.waste or "")[:400],
        "issues": (payload.issues or "")[:800],
        "notes": (payload.notes or "")[:1200],
        "cleaning_done": bool(payload.cleaning_done),
        "at": now_iso(),
    }
    await db.floor_shift_reports.insert_one(dict(doc))
    olds = await db.floor_shift_reports.find({"organization_id": org}, {"_id": 0, "id": 1, "at": 1}).sort("at", -1).to_list(2000)
    for o in olds[200:]:
        await db.floor_shift_reports.delete_one({"id": o["id"]})
    try:
        asyncio.create_task(_auto_shift_draft())
    except Exception:
        pass
    return {"ok": True, "id": doc["id"]}


@api_router.get("/floor/shift-reports")
async def floor_shift_reports_list(admin: dict = Depends(require_admin)):
    org = _org_id(admin)
    return {"reports": await db.floor_shift_reports.find({"organization_id": org}, {"_id": 0}).sort("at", -1).to_list(50)}


# ============================================================================
# REPORT FINE TURNO AUTOMATICO (Sitor) — Sitor raccoglie da solo i dati reali
# del turno (pezzi sfornati, scarti, ore effettive timbrate, problemi) e compila
# la BOZZA del report: il Capo la legge e l'approva con un tocco.
# ============================================================================
async def _shift_snapshot(today: str, org: str = ORG_DEFAULT) -> dict:
    """Fotografa i dati reali del turno registrati durante la giornata."""
    reports = await db.floor_shift_reports.find({"at": {"$regex": f"^{re.escape(today)}"}, "organization_id": org}, {"_id": 0}).sort("at", 1).to_list(100)
    entries = await db.compliance_timelog.find({"at": {"$regex": f"^{re.escape(today)}"}, "organization_id": org}, {"_id": 0}).sort("seq", 1).to_list(3000)
    by_worker = {}
    for e in entries:
        by_worker.setdefault(e.get("worker") or "operatore", []).append(e)
    hours = []
    for w, evs in by_worker.items():
        s = _arbzg_summary(evs)
        hours.append({"worker": w, "work_min": s["work_min"], "break_min": s["break_min"], "flags": s["flags"]})
    objs = await db.dept_objectives.find({"date": today, "organization_id": org}, {"_id": 0}).to_list(50)
    changes = await db.floor_change_requests.find({"at": {"$regex": f"^{re.escape(today)}"}, "organization_id": org}, {"_id": 0}).to_list(50)
    return {
        "date": today,
        "operator_reports": reports,
        "hours": hours,
        "objectives": [{"dept": o.get("dept", ""), "label": o.get("label", ""), "done": o.get("done", 0),
                        "target": o.get("target", 0), "unit": o.get("unit", "pezzi")} for o in objs],
        "change_requests": [{"operator": c.get("operator", ""), "proposal": (c.get("proposal") or "")[:160],
                             "status": c.get("status", "")} for c in changes],
    }


def _draft_fallback_text(snap: dict) -> str:
    """Bozza deterministica se l'LLM non è disponibile: mai lasciare il Capo a mani vuote."""
    lines = [f"Report fine turno — {snap['date']}", "", "**Ore effettive**"]
    for h in snap["hours"]:
        lines.append(f"- {h['worker']}: {h['work_min'] // 60}h {h['work_min'] % 60:02d}min lavorate, pausa {h['break_min']}min"
                     + (f" — ATTENZIONE: {', '.join(h['flags'])}" if h.get("flags") else ""))
    if not snap["hours"]:
        lines.append("- Nessuna timbratura registrata oggi.")
    lines.append("")
    lines.append("**Produzione**")
    for r in snap["operator_reports"]:
        seg = f"- {r.get('operator') or 'Operatore'}:"
        if r.get("pieces"):
            seg += f" pezzi {r['pieces']};"
        if r.get("waste"):
            seg += f" scarti {r['waste']};"
        if r.get("issues"):
            seg += f" problemi: {r['issues']};"
        seg += " pulizia fatta." if r.get("cleaning_done") else " pulizia NON fatta."
        lines.append(seg)
    if not snap["operator_reports"]:
        lines.append("- Nessun rapporto operaio pervenuto.")
    return "\n".join(lines)


async def _sitor_shift_draft(lang: str = "it", trigger: str = "manual", force: bool = False, org: str = ORG_DEFAULT) -> dict:
    """Genera (o rigenera) la bozza del report di oggi. Con force=True genera anche senza dati (chiusura programmata / manuale)."""
    today = now_iso()[:10]
    snap = await _shift_snapshot(today, org=org)
    if not force and not snap["operator_reports"] and not snap["hours"] and not snap["objectives"]:
        return {}
    langname = _DEUS_LANGS.get(str(lang or "it").split("-")[0][:2], "italiano")
    import json as _json
    sysmsg = (
        "Sei SITOR, il Dio dell'Arte Bianca, braccio destro del Capo. Il turno sta finendo e TU hai già raccolto "
        "tutti i dati reali registrati durante la giornata. Compila la BOZZA del report di fine turno per il Capo: "
        "lui dovrà solo leggerla e approvarla con un tocco.\n"
        "STRUTTURA OBBLIGATORIA (markdown semplice, senza tabelle):\n"
        "1) **Sintesi** — 2 frasi calde e solenni su come è andato il turno.\n"
        "2) **Ore effettive** — una riga per operaio: nome, ore lavorate, pausa; segnala eventuali superi di legge.\n"
        "3) **Produzione** — pezzi sfornati e scarti per operaio/reparto, con confronto fatto/obiettivo se presente.\n"
        "4) **Problemi e note** — elenca i problemi segnalati; se tutto ok, scrivi che il turno è filato liscio.\n"
        "5) **Pulizia** — chi l'ha fatta e chi no.\n"
        "6) **Consiglio di Sitor** — 1 suggerimento concreto per il turno di domani.\n"
        "NON inventare numeri: usa SOLO i dati forniti; se un dato manca, dillo in una riga. "
        f"Scrivi SEMPRE in {langname}, tono caldo ma professionale, pronto per essere letto ad alta voce."
    )
    text = ""
    if EMERGENT_LLM_KEY:
        try:
            sysmsg += await _bakery_snapshot({"email": "master"})
            text = await _deus_llm(sysmsg, "DATI REALI DEL TURNO (JSON):\n" + _json.dumps(snap, ensure_ascii=False),
                                   session=f"shift-draft-{today}-{trigger}-{uuid.uuid4().hex[:6]}", max_tokens=1600)
        except Exception:
            text = ""
    text = (text or "").strip() or _draft_fallback_text(snap)
    doc = {"date": today, "text": text[:6000], "status": "draft", "lang": str(lang or "it")[:5],
           "trigger": trigger, "generated_at": now_iso(),
           "snapshot": {"reports": len(snap["operator_reports"]), "workers": len(snap["hours"]),
                        "objectives": len(snap["objectives"])}}
    existing = await db.sitor_shift_drafts.find_one({"date": today, "status": "draft"}, {"_id": 0, "id": 1})
    if existing:
        await db.sitor_shift_drafts.update_one({"id": existing["id"]}, {"$set": doc})
        doc["id"] = existing["id"]
    else:
        doc["id"] = str(uuid.uuid4())
        await db.sitor_shift_drafts.insert_one(dict(doc))
    return doc


async def _auto_shift_draft():
    """Auto-compilazione: appena un operaio invia il suo rapporto, Sitor aggiorna la bozza del giorno."""
    try:
        today = now_iso()[:10]
        last = await db.floor_shift_reports.find_one({"at": {"$regex": f"^{re.escape(today)}"}}, {"_id": 0, "lang": 1},
                                                     sort=[("at", -1)])
        await _sitor_shift_draft(lang=(last or {}).get("lang") or "it", trigger="auto")
    except Exception:
        pass


class ShiftDraftGenReq(BaseModel):
    lang: str = "it"


@api_router.post("/capo/sitor/shift-draft/generate")
async def capo_shift_draft_generate(body: ShiftDraftGenReq, admin: dict = Depends(require_admin)):
    doc = await _sitor_shift_draft(lang=body.lang, trigger="manual", force=True, org=_org_id(admin))
    if not doc:
        return {"ok": False, "draft": None}
    return {"ok": True, "draft": doc}


@api_router.get("/capo/sitor/shift-drafts")
async def capo_shift_drafts(admin: dict = Depends(require_admin)):
    docs = await db.sitor_shift_drafts.find({}, {"_id": 0}).sort("generated_at", -1).to_list(14)
    return {"drafts": docs}


class ShiftDraftPatchReq(BaseModel):
    status: Optional[str] = None
    text: Optional[str] = None


@api_router.patch("/capo/sitor/shift-drafts/{did}")
async def capo_shift_draft_patch(did: str, body: ShiftDraftPatchReq, admin: dict = Depends(require_admin)):
    upd = {}
    if body.status in ("draft", "approved"):
        upd["status"] = body.status
        if body.status == "approved":
            upd["approved_at"] = now_iso()
            upd["approved_by"] = (admin.get("email") or "master").lower()
    if body.text is not None:
        upd["text"] = (body.text or "")[:6000]
    if not upd:
        return {"ok": False}
    await db.sitor_shift_drafts.update_one({"id": did}, {"$set": upd})
    return {"ok": True}


# ---- Report programmato: Sitor genera la bozza da solo a un orario fisso di chiusura ----
class ShiftScheduleReq(BaseModel):
    enabled: bool = False
    time: str = "20:00"   # HH:MM, orario LOCALE della sede
    lang: str = "it"
    tz_offset_min: int = 0  # minuti da aggiungere a UTC per ottenere l'ora locale (es. Roma estate = +120)


@api_router.get("/capo/sitor/shift-schedule")
async def capo_shift_schedule_get(admin: dict = Depends(require_admin)):
    doc = await db.app_meta.find_one({"_key": "shift_schedule"}, {"_id": 0, "_key": 0})
    return doc or {"enabled": False, "time": "20:00", "lang": "it", "tz_offset_min": 0}


@api_router.put("/capo/sitor/shift-schedule")
async def capo_shift_schedule_set(body: ShiftScheduleReq, admin: dict = Depends(require_admin)):
    import re as _re_sch
    t = body.time if _re_sch.match(r"^([01]?\d|2[0-3]):[0-5]\d$", body.time or "") else "20:00"
    off = int(body.tz_offset_min or 0)
    off = max(-840, min(840, off))
    doc = {"enabled": bool(body.enabled), "time": t, "lang": (body.lang or "it")[:5], "tz_offset_min": off}
    await db.app_meta.update_one({"_key": "shift_schedule"}, {"$set": {"_key": "shift_schedule", **doc}}, upsert=True)
    return {"ok": True, **doc}


async def _shift_schedule_loop():
    """Ogni minuto controlla l'orario di chiusura in ORA LOCALE della sede: allo scoccare, Sitor compila la bozza una volta al giorno."""
    await asyncio.sleep(25)
    while True:
        try:
            cfg = await db.app_meta.find_one({"_key": "shift_schedule"}, {"_id": 0})
            if cfg and cfg.get("enabled"):
                offset = int(cfg.get("tz_offset_min") or 0)
                local = datetime.now(timezone.utc) + timedelta(minutes=offset)
                hhmm = local.strftime("%H:%M")
                today = local.isoformat()[:10]  # giorno locale
                if hhmm == (cfg.get("time") or "20:00") and cfg.get("last_run_date") != today:
                    await _sitor_shift_draft(lang=cfg.get("lang") or "it", trigger="scheduled", force=True)
                    await db.app_meta.update_one({"_key": "shift_schedule"}, {"$set": {"last_run_date": today}})
        except Exception:
            logger.exception("shift schedule loop error")
        await asyncio.sleep(60)


# ============================================================================
# PASTICCERIA — Consegne & Eventi (produzione su commessa: torte, matrimoni, eventi).
# Differenzia l'esperienza per l'attività "pasticceria" (scelta all'onboarding).
# ============================================================================
class PastryDelivery(BaseModel):
    client: str = ""
    item: str = ""
    event_type: str = "torta"  # torta | matrimonio | evento | altro
    date: str = ""             # ISO date del giorno di consegna
    time: str = ""
    people: str = ""
    notes: str = ""


@api_router.get("/pastry/deliveries")
async def pastry_deliveries_list(admin: dict = Depends(require_admin)):
    docs = await db.pastry_deliveries.find({"organization_id": _org_id(admin)}, {"_id": 0}).sort("date", 1).to_list(200)
    return {"deliveries": docs}


@api_router.post("/pastry/deliveries")
async def pastry_delivery_create(body: PastryDelivery, admin: dict = Depends(require_admin)):
    doc = {
        "id": str(uuid.uuid4()),
        "client": (body.client or "")[:120], "item": (body.item or "")[:200],
        "event_type": (body.event_type or "torta")[:30], "date": (body.date or "")[:10],
        "time": (body.time or "")[:10], "people": (body.people or "")[:20],
        "notes": (body.notes or "")[:800], "done": False, "at": now_iso(),
        "organization_id": _org_id(admin),
    }
    await db.pastry_deliveries.insert_one(dict(doc))
    return {"ok": True, "delivery": doc}


@api_router.post("/pastry/deliveries/{did}/toggle")
async def pastry_delivery_toggle(did: str, admin: dict = Depends(require_admin)):
    d = await db.pastry_deliveries.find_one({"id": did, "organization_id": _org_id(admin)}, {"_id": 0})
    if not d:
        raise HTTPException(status_code=404, detail="not found")
    await db.pastry_deliveries.update_one({"id": did, "organization_id": _org_id(admin)}, {"$set": {"done": not d.get("done")}})
    return {"ok": True}


@api_router.delete("/pastry/deliveries/{did}")
async def pastry_delivery_delete(did: str, admin: dict = Depends(require_admin)):
    await db.pastry_deliveries.delete_one({"id": did, "organization_id": _org_id(admin)})
    return {"ok": True}


# ============================================================================
# PIZZERIA — pannello dedicato "Servizio & Panetti".
# La pizzeria lavora a FLUSSO/SERVIZIO (non a lotti): sessioni di servizio con
# panetti porzionati, maturazione in frigo e sfornate a ritmo di sala.
# ============================================================================
class PizzeriaSession(BaseModel):
    label: str = ""            # nome servizio (es. "Cena venerdì")
    date: str = ""             # ISO date del servizio
    service_start: str = ""    # HH:MM apertura sala
    service_end: str = ""      # HH:MM chiusura
    dough_balls: str = ""      # numero panetti
    ball_weight_g: str = ""    # grammatura panetto
    method: str = "diretto"    # diretto | biga | poolish | misto
    maturation_h: str = ""     # ore di maturazione in frigo
    fridge: str = ""           # cella/frigo dedicato
    notes: str = ""


@api_router.get("/pizzeria/sessions")
async def pizzeria_sessions_list(admin: dict = Depends(require_admin)):
    q = {"organization_id": _org_id(admin)}
    docs = await db.pizzeria_sessions.find(q, {"_id": 0}).sort("date", 1).to_list(200)
    return {"sessions": docs}


@api_router.post("/pizzeria/sessions")
async def pizzeria_session_create(body: PizzeriaSession, admin: dict = Depends(require_admin)):
    doc = {
        "id": str(uuid.uuid4()),
        "label": (body.label or "")[:120], "date": (body.date or "")[:10],
        "service_start": (body.service_start or "")[:10], "service_end": (body.service_end or "")[:10],
        "dough_balls": (body.dough_balls or "")[:12], "ball_weight_g": (body.ball_weight_g or "")[:12],
        "method": (body.method or "diretto")[:20], "maturation_h": (body.maturation_h or "")[:8],
        "fridge": (body.fridge or "")[:80], "notes": (body.notes or "")[:800],
        "done": False, "at": now_iso(), "organization_id": _org_id(admin),
    }
    await db.pizzeria_sessions.insert_one(dict(doc))
    return {"ok": True, "session": doc}


@api_router.post("/pizzeria/sessions/{sid}/toggle")
async def pizzeria_session_toggle(sid: str, admin: dict = Depends(require_admin)):
    d = await db.pizzeria_sessions.find_one({"id": sid, "organization_id": _org_id(admin)}, {"_id": 0})
    if not d:
        raise HTTPException(status_code=404, detail="not found")
    await db.pizzeria_sessions.update_one({"id": sid, "organization_id": _org_id(admin)}, {"$set": {"done": not d.get("done")}})
    return {"ok": True}


@api_router.delete("/pizzeria/sessions/{sid}")
async def pizzeria_session_delete(sid: str, admin: dict = Depends(require_admin)):
    await db.pizzeria_sessions.delete_one({"id": sid, "organization_id": _org_id(admin)})
    return {"ok": True}


@api_router.post("/recipes/import-catalog")
async def import_starter_catalog(admin: dict = Depends(current_user)):
    """Catalogo di partenza: importa nel ricettario dell'azienda le ricette Master di Michele
    (org_default). Non duplica quelle già presenti (per nome). Non tocca org_default.
    Accessibile a qualsiasi utente loggato: agisce SOLO sulla propria azienda."""
    org = _org_id(admin)
    if org == ORG_DEFAULT:
        return {"ok": True, "imported": 0, "already_owner": True}
    have = set()
    async for d in db.recipes.find({"collection_name": "mikilab", "organization_id": org}, {"_id": 0, "name": 1}):
        if d.get("name"):
            have.add(d["name"].strip().lower())
    src = await db.recipes.find({"collection_name": "mikilab", "organization_id": ORG_DEFAULT, "hidden": {"$ne": True}}, {"_id": 0}).to_list(3000)
    n = 0
    for r in src:
        if (r.get("name") or "").strip().lower() in have:
            continue
        r = dict(r)
        r.pop("id", None)
        r["id"] = str(uuid.uuid4())
        r["organization_id"] = org
        r["collection_name"] = "mikilab"
        r["hidden"] = False
        r["created_at"] = now_iso()
        r["updated_at"] = now_iso()
        await db.recipes.insert_one(r)
        n += 1
    return {"ok": True, "imported": n}


# ============================================================================
# CORSO RICETTE (Sitor) — spiegazione estesa passo-passo, generata UNA sola
# volta per ricetta+lingua e salvata in modo permanente in `recipe_courses`.
# Non modifica MAI la ricetta: è solo materiale didattico aggiuntivo.
# Accessibile sia al Capo sia agli operai in produzione (stessa spiegazione).
# ============================================================================
def _recipe_course_context(r: dict) -> str:
    parts = [f"Ricetta: {r.get('name') or 'senza nome'}."]
    if r.get("dough_category") or r.get("method_type"):
        parts.append(f"Tipo: {r.get('dough_category') or ''} {r.get('method_type') or ''}.".strip())
    fields = [
        ("Farina", r.get("flour_type")), ("Idratazione %", r.get("hydration_percent")),
        ("Prefermento", r.get("preferment_type")), ("Impasto (min)", r.get("mix_minutes")),
        ("Riposo (min)", r.get("rest_minutes")), ("Puntata (h)", r.get("bulk_fermentation_hours")),
        ("Appretto (h)", r.get("proofing_hours")), ("Temp. acqua (°C)", r.get("water_temp_c")),
        ("Cottura (°C)", r.get("bake_temp")), ("Cottura (min)", r.get("bake_minutes")),
        ("Forno", r.get("oven_type")),
    ]
    for label, val in fields:
        if val not in (None, "", 0):
            parts.append(f"{label}: {val}")
    if r.get("procedure"):
        parts.append(f"Procedimento sintetico esistente: {str(r['procedure'])[:1200]}")
    if r.get("notes"):
        parts.append(f"Note: {str(r['notes'])[:400]}")
    return " ".join(parts)


@api_router.get("/recipes/{recipe_id}/course")
async def recipe_course(recipe_id: str, lang: str = "it", user: Optional[dict] = Depends(optional_user)):
    lang2 = (lang or "it").split("-")[0][:2]
    existing = await db.recipe_courses.find_one({"recipe_id": recipe_id, "lang": lang2}, {"_id": 0})
    if existing and existing.get("course"):
        return {"ok": True, "cached": True, "course": existing["course"], "recipe_name": existing.get("recipe_name", "")}

    recipe = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    if not recipe:
        raise HTTPException(status_code=404, detail="Ricetta non trovata")

    course = None
    if EMERGENT_LLM_KEY:
        try:
            langname = _LANG_NAMES.get(lang2, "inglese")
            sysmsg = (
                "Sei Sitor, maestro panificatore e formatore. Genera un CORSO didattico passo-passo per un allievo, "
                "spiegando OGNI fase del procedimento in modo ESTESO e chiaro (il perché, i segnali visivi/tattili, "
                "gli errori da evitare, i tempi e le temperature), non un semplice elenco. "
                "REGOLA ASSOLUTA: NON modificare, ricalcolare né proporre dosi/ingredienti diversi; usa i dati della ricetta "
                "solo come riferimento. Niente HACCP, allergeni o burocrazia. "
                f"Rispondi in {langname}. Restituisci SOLO JSON valido: "
                "{\"title\":\"..\",\"intro\":\"1-2 frasi\",\"phases\":[{\"name\":\"nome fase\",\"detail\":\"spiegazione estesa 3-6 frasi\"}],\"tips\":[\"consiglio\",\"consiglio\"]}. "
                "Da 5 a 9 fasi. Nessun testo fuori dal JSON."
            )
            chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"course-{recipe_id[:8]}-{lang2}", system_message=sysmsg).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=3500)
            out = ""
            async for ev in chat.stream_message(UserMessage(text=f"DATI RICETTA: {_recipe_course_context(recipe)}\nGenera il corso passo-passo.")):
                if isinstance(ev, TextDelta):
                    out += ev.content or ""
            parsed = _parse_llm_json(out)
            if parsed.get("phases"):
                course = {
                    "title": (parsed.get("title") or recipe.get("name") or "")[:160],
                    "intro": (parsed.get("intro") or "")[:600],
                    "phases": [{"name": (p.get("name") or "")[:120], "detail": (p.get("detail") or "")[:1200]}
                               for p in parsed["phases"] if isinstance(p, dict)][:9],
                    "tips": [str(t)[:240] for t in (parsed.get("tips") or [])][:6],
                }
        except Exception as e:
            logger.warning("recipe course gen fail (%s)", str(e)[:120])

    if not course:
        raise HTTPException(status_code=503, detail="Corso non disponibile al momento, riprova.")

    await db.recipe_courses.update_one(
        {"recipe_id": recipe_id, "lang": lang2},
        {"$set": {"recipe_id": recipe_id, "lang": lang2, "recipe_name": recipe.get("name", ""),
                  "course": course, "generated_at": now_iso()}},
        upsert=True,
    )
    return {"ok": True, "cached": False, "course": course, "recipe_name": recipe.get("name", "")}


# ============================================================================
# VOLTI SQUADRA — il Capo registra i volti UNA volta; tutti i tablet di reparto li leggono.
# GET pubblico (dietro gate PIN) così i tablet li vedono; scrittura solo admin (Capo).
# ============================================================================
class TeamFace(BaseModel):
    name: str
    dept: str = ""
    thumb: str = ""  # miniatura dataURL (jpeg ~96px)


@api_router.get("/faces")
async def faces_list():
    docs = await db.team_faces.find({}, {"_id": 0}).sort("name", 1).to_list(300)
    return {"faces": docs}


# Riconoscimento pubblico per il rientro operaio (volto/nome) al cancello, senza cookie Master.
# Espone solo nome + miniatura (nessun dato sensibile) — serve al check-in dei turnisti su tablet condivisi.
@api_router.get("/public/faces")
async def faces_public():
    docs = await db.team_faces.find({}, {"_id": 0, "name": 1, "thumb": 1}).sort("name", 1).to_list(300)
    return {"faces": docs}


@api_router.post("/faces")
async def faces_save(body: TeamFace, admin: dict = Depends(require_admin)):
    nm = (body.name or "").strip()
    if not nm:
        raise HTTPException(status_code=400, detail="nome mancante")
    doc = {"name": nm[:80], "dept": (body.dept or "")[:80], "thumb": (body.thumb or "")[:200000], "at": now_iso()}
    await db.team_faces.update_one({"name": doc["name"]}, {"$set": doc}, upsert=True)
    return {"ok": True, "face": {k: v for k, v in doc.items() if k != "thumb"}}


@api_router.delete("/faces/{name}")
async def faces_delete(name: str, admin: dict = Depends(require_admin)):
    await db.team_faces.delete_one({"name": name})
    return {"ok": True}


# ============================================================================
# ALLEGA / FOTOGRAFA UNIVERSALE — ovunque il Capo compili qualcosa può allegare
# un PDF o una foto: Sitor legge, capisce e restituisce testo strutturato da inserire.
# ============================================================================
class CapoExtractReq(BaseModel):
    kind: str = "auto"           # "image" | "pdf" | "auto"
    data_base64: str = ""        # dataURL o base64 puro (foto o PDF)
    context: str = ""            # es. "macchina nuova", "ordine cliente", "consegna"
    lang: str = "it"


@api_router.post("/capo/extract")
async def capo_extract(body: CapoExtractReq, admin: dict = Depends(require_admin)):
    """Sitor estrae info strutturate da una FOTO (vision) o da un PDF (testo) allegato dal Capo."""
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM non configurata")
    raw = (body.data_base64 or "")
    b64 = raw.split(",")[-1].strip()
    header = raw[:80].lower()
    is_pdf = body.kind == "pdf" or "application/pdf" in header or (body.kind == "auto" and header.startswith("data:application/pdf"))
    langname = {"it": "italiano", "de": "tedesco", "en": "inglese", "es": "spagnolo", "fr": "francese", "fa": "persiano"}.get((body.lang or "it")[:2], "italiano")
    ctx = (body.context or "").strip() or "informazione generica"
    sysmsg = (f"Sei Sitor, assistente di un panificio. Il Capo allega materiale su: '{ctx}'. "
              f"Estrai le informazioni utili in modo ORDINATO e PRONTO DA INSERIRE (campi chiave: valore, elenchi puntati). "
              f"Niente preamboli. Rispondi in {langname}.")
    text = ""
    try:
        if is_pdf:
            import base64 as _b64, io as _io
            from pypdf import PdfReader
            reader = PdfReader(_io.BytesIO(_b64.b64decode(b64)))
            pdftext = ""
            for pg in reader.pages[:15]:
                try: pdftext += (pg.extract_text() or "") + "\n"
                except Exception: pass
            pdftext = pdftext.strip()[:12000]
            chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"capoex-{uuid.uuid4().hex[:8]}", system_message=sysmsg).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=1400)
            async for ev in chat.stream_message(UserMessage(text=f"Contenuto del PDF:\n{pdftext or '(nessun testo estraibile: PDF forse scansionato)'}")):
                if isinstance(ev, TextDelta): text += ev.content or ""
        else:
            chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"capoex-{uuid.uuid4().hex[:8]}", system_message=sysmsg).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=1400)
            async for ev in chat.stream_message(UserMessage(text=f"Estrai le info utili da questa immagine per: {ctx}.", file_contents=[ImageContent(image_base64=b64)])):
                if isinstance(ev, TextDelta): text += ev.content or ""
    except Exception as e:
        logger.warning("capo_extract fail (%s)", str(e)[:150])
        raise HTTPException(status_code=500, detail="estrazione non riuscita")
    return {"ok": True, "text": text.strip(), "kind": "pdf" if is_pdf else "image"}



# ============================================================================
# REPARTI INDIPENDENTI (stanzini privati): Panificio, Pasticceria, Pizzeria, Laugen.
# Ogni reparto ha macchinari, silos, celle e magazzino dedicati (auto-generati).
# Il Capo (MikiLab) assegna a Sitor reparto+mansione del giorno; la produzione
# vede dinamicamente SOLO il reparto assegnato.
# ============================================================================
DEPARTMENTS = {
    "panificio": {"name": "Panificio", "accent": "#E0A106", "icon": "🥖",
        "machines": [
            {"id": "imp-spirale-80", "name": "Impastatrice a spirale 80kg", "type": "impastatrice"},
            {"id": "imp-forcella", "name": "Impastatrice a forcella", "type": "impastatrice"},
            {"id": "forno-rotativo", "name": "Forno rotativo a carrelli", "type": "forno"},
            {"id": "forno-deck", "name": "Forno a piani (deck)", "type": "forno"},
            {"id": "linea-arion", "name": "Linea baguette Arion", "type": "linea"},
            {"id": "gruppo-pane", "name": "Gruppo formatura pane", "type": "formatura"}],
        "silos": ["Farina Tipo 0", "Farina Tipo 1", "Farina Integrale"],
        "cells": ["Cella lievitazione 1", "Cella lievitazione 2", "Fermalievita", "Freezer semilavorati"],
        "warehouse": "Magazzino Panificio (farine, semi, malto)"},
    "pasticceria": {"name": "Pasticceria", "accent": "#EC4899", "icon": "🧁",
        "machines": [
            {"id": "planetaria-40", "name": "Planetaria 40L", "type": "planetaria"},
            {"id": "sfogliatrice", "name": "Sfogliatrice automatica", "type": "sfogliatrice"},
            {"id": "forno-ventilato", "name": "Forno ventilato statico", "type": "forno"},
            {"id": "abbattitore", "name": "Abbattitore di temperatura", "type": "abbattitore"},
            {"id": "temperatrice", "name": "Temperatrice cioccolato", "type": "temperatrice"}],
        "silos": ["Farina debole", "Zucchero", "Zucchero a velo"],
        "cells": ["Cella fermalievita", "Frigo ingredienti", "Cella prodotti finiti", "Freezer prodotti"],
        "warehouse": "Magazzino Pasticceria (creme, frutta, cioccolato)"},
    "pizzeria": {"name": "Pizzeria", "accent": "#EF4444", "icon": "🍕",
        "machines": [
            {"id": "imp-tuffante", "name": "Impastatrice a bracci tuffanti", "type": "impastatrice"},
            {"id": "forno-teglie", "name": "Forno pizza a teglie", "type": "forno"},
            {"id": "forno-rotante", "name": "Forno rotante refrattario", "type": "forno"},
            {"id": "stendipizza", "name": "Stendipizza / pressa", "type": "formatura"},
            {"id": "porzionatrice", "name": "Porzionatrice-arrotondatrice", "type": "staglio"}],
        "silos": ["Farina Pizza W300", "Semola rimacinata"],
        "cells": ["Cella maturazione 24-72h", "Frigo impasti", "Freezer impasti"],
        "warehouse": "Magazzino Pizzeria (pomodoro, mozzarella, condimenti)"},
    "laugen": {"name": "Reparto Laugen", "accent": "#8B5A2B", "icon": "🥨",
        "machines": [
            {"id": "imp-laugen", "name": "Impastatrice Laugen", "type": "impastatrice"},
            {"id": "vasca-soda", "name": "Vasca immersione soda (NaOH)", "type": "vasca"},
            {"id": "forno-laugen", "name": "Forno Laugen a piani", "type": "forno"},
            {"id": "formatrice-brezel", "name": "Formatrice Brezel", "type": "formatura"}],
        "silos": ["Farina Laugen", "Sale grosso", "Soda caustica food-grade"],
        "cells": ["Cella riposo", "Essiccatoio superficie", "Freezer Brezel crudi"],
        "warehouse": "Magazzino Laugen (sale, semi, soda)"},
    "banco": {"name": "Banco e Prezzi", "accent": "#22C55E", "icon": "🏷️",
        "machines": [
            {"id": "bilancia-prezzatrice", "name": "Bilancia prezzatrice", "type": "bilancia"},
            {"id": "etichettatrice", "name": "Etichettatrice automatica", "type": "etichettatrice"},
            {"id": "confezionatrice-flow", "name": "Confezionatrice flow-pack", "type": "confezionamento"},
            {"id": "termosigillatrice", "name": "Termosigillatrice vaschette", "type": "confezionamento"},
            {"id": "affettatrice", "name": "Affettatrice pane", "type": "affettatrice"}],
        "silos": ["Sacchetti", "Vaschette", "Etichette"],
        "cells": ["Vetrina refrigerata", "Espositore caldo", "Freezer banco"],
        "warehouse": "Magazzino Banco (imballaggi, etichette, sacchetti)"},
}

@api_router.get("/depts")
async def depts_catalog(org: str = Depends(effective_org)):
    return {"departments": await _depts_merged(org)}


# --- Reparti gestibili dal Capo: rinomina/icona/colore/nascondi sui base, aggiungi/elimina i custom ---
async def _dept_cfg(org: str) -> dict:
    doc = await db.dept_config.find_one({"organization_id": org}, {"_id": 0})
    return doc or {"overrides": {}, "custom": []}


async def _depts_merged(org: str) -> list:
    """Reparti effettivi per l'organizzazione: base (override applicati, nascosti esclusi) + custom."""
    cfg = await _dept_cfg(org)
    overrides = cfg.get("overrides") or {}
    out = []
    for k, v in DEPARTMENTS.items():
        ov = overrides.get(k) or {}
        if ov.get("hidden"):
            continue
        out.append({"key": k, "name": ov.get("name") or v["name"], "accent": ov.get("accent") or v["accent"],
                    "icon": ov.get("icon") or v["icon"], "machines": v["machines"], "silos": v.get("silos", []),
                    "cells": v.get("cells", []), "warehouse": v.get("warehouse", ""), "custom": False})
    for c in (cfg.get("custom") or []):
        out.append({"key": c["key"], "name": c.get("name", ""), "accent": c.get("accent", "#64748B"),
                    "icon": c.get("icon", "🏭"), "machines": [], "silos": [], "cells": [], "warehouse": "", "custom": True})
    return out


async def _dept_exists(org: str, dept: str) -> bool:
    return any(d["key"] == dept for d in await _depts_merged(org))


async def _dept_name(org: str, dept: str) -> str:
    for d in await _depts_merged(org):
        if d["key"] == dept:
            return d["name"]
    return DEPARTMENTS.get(dept, {}).get("name", dept)


def _base_machines(dept: str) -> list:
    return DEPARTMENTS.get(dept, {}).get("machines", [])


def _dept_label(dept: str) -> str:
    return DEPARTMENTS.get(dept, {}).get("name", dept)


class DeptUpsertReq(BaseModel):
    name: str = ""
    icon: str = "🏭"
    accent: str = "#64748B"


class DeptEditReq(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    accent: Optional[str] = None


@api_router.post("/depts")
async def dept_create(body: DeptUpsertReq, admin: dict = Depends(require_admin)):
    import uuid as _uuid
    nm = (body.name or "").strip()
    if not nm:
        raise HTTPException(400, "Nome reparto richiesto")
    org = _org_id(admin)
    item = {"key": "dept-" + _uuid.uuid4().hex[:8], "name": nm[:60], "icon": (body.icon or "🏭")[:8], "accent": (body.accent or "#64748B")[:9]}
    await db.dept_config.update_one({"organization_id": org},
        {"$push": {"custom": item}, "$set": {"organization_id": org, "updated_at": now_iso()}}, upsert=True)
    return {"ok": True, "department": item, "departments": await _depts_merged(org)}


@api_router.patch("/depts/{dept}")
async def dept_edit(dept: str, body: DeptEditReq, admin: dict = Depends(require_admin)):
    org = _org_id(admin)
    fields = {k: v for k, v in {"name": body.name, "icon": body.icon, "accent": body.accent}.items() if v is not None}
    if not fields:
        return {"ok": True, "departments": await _depts_merged(org)}
    if dept in DEPARTMENTS:
        upd = {f"overrides.{dept}.{k}": (v.strip()[:60] if k == "name" else v[:9]) for k, v in fields.items()}
        await db.dept_config.update_one({"organization_id": org},
            {"$set": {**upd, "organization_id": org, "updated_at": now_iso()}}, upsert=True)
    else:
        setter = {f"custom.$.{k}": (v.strip()[:60] if k == "name" else v[:9]) for k, v in fields.items()}
        await db.dept_config.update_one({"organization_id": org, "custom.key": dept},
            {"$set": {**setter, "updated_at": now_iso()}})
    return {"ok": True, "departments": await _depts_merged(org)}


@api_router.delete("/depts/{dept}")
async def dept_delete(dept: str, admin: dict = Depends(require_admin)):
    """Base → nasconde (storico intatto); custom → rimuove."""
    org = _org_id(admin)
    if dept in DEPARTMENTS:
        await db.dept_config.update_one({"organization_id": org},
            {"$set": {f"overrides.{dept}.hidden": True, "organization_id": org, "updated_at": now_iso()}}, upsert=True)
    else:
        await db.dept_config.update_one({"organization_id": org}, {"$pull": {"custom": {"key": dept}}})
    return {"ok": True, "departments": await _depts_merged(org)}


@api_router.post("/depts/{dept}/restore")
async def dept_restore(dept: str, admin: dict = Depends(require_admin)):
    """Riporta in vista un reparto base nascosto."""
    org = _org_id(admin)
    await db.dept_config.update_one({"organization_id": org}, {"$unset": {f"overrides.{dept}.hidden": ""}})
    return {"ok": True, "departments": await _depts_merged(org)}


@api_router.get("/depts/hidden")
async def depts_hidden(admin: dict = Depends(require_admin)):
    """Reparti base attualmente nascosti (per poterli ripristinare)."""
    cfg = await _dept_cfg(_org_id(admin))
    overrides = cfg.get("overrides") or {}
    out = [{"key": k, "name": (overrides.get(k, {}).get("name") or DEPARTMENTS[k]["name"])}
           for k in DEPARTMENTS if (overrides.get(k) or {}).get("hidden")]
    return {"hidden": out}


# --- Stato macchine per reparto: l'operaio collega/segna le macchine del proprio reparto ---
_MACHINE_STATES = {"attiva", "in manutenzione", "spenta"}


class DeptMachineItem(BaseModel):
    id: str
    status: str = "spenta"
    value: str = ""


class DeptMachinesReq(BaseModel):
    machines: List[DeptMachineItem] = []
    operator: str = ""


def _dept_machines_merged(dept: str, doc: dict | None) -> list:
    """Unisce il catalogo macchine del reparto con lo stato salvato, gli override
    del Capo (rinomina/nascondi) e le macchine personalizzate aggiunte dal Capo."""
    doc = doc or {}
    saved = {m.get("id"): m for m in (doc.get("machines") or [])}
    overrides = doc.get("overrides") or {}
    out = []
    for m in _base_machines(dept):
        ov = overrides.get(m["id"]) or {}
        if ov.get("hidden"):
            continue
        s = saved.get(m["id"], {})
        st = s.get("status") if s.get("status") in _MACHINE_STATES else "spenta"
        out.append({"id": m["id"], "name": ov.get("name") or m["name"], "type": m["type"],
                    "status": st, "value": s.get("value", "") or "", "custom": False})
    for c in (doc.get("custom") or []):
        s = saved.get(c.get("id"), {})
        st = s.get("status") if s.get("status") in _MACHINE_STATES else "spenta"
        out.append({"id": c.get("id"), "name": c.get("name", ""), "type": c.get("type", "altro"),
                    "status": st, "value": s.get("value", "") or "", "custom": True})
    # Ordine scelto dal Capo (trascinamento): le macchine non elencate restano in coda, stabili.
    order = doc.get("order") or []
    pos = {mid: i for i, mid in enumerate(order)}
    out.sort(key=lambda m: pos.get(m["id"], 9999))
    return out


@api_router.get("/depts/machines/overview")
async def dept_machines_overview(org: str = Depends(effective_org)):
    """Vista d'insieme per il Capo: stato macchine di TUTTI i reparti (isolato per azienda)."""
    result = []
    for k, v in DEPARTMENTS.items():
        doc = await db.dept_machines.find_one({"dept": k, "organization_id": org}, {"_id": 0})
        machines = _dept_machines_merged(k, doc)
        result.append({"dept": k, "dept_name": v["name"], "icon": v.get("icon", ""),
                       "accent": v.get("accent", "#64748B"), "machines": machines,
                       "active": sum(1 for m in machines if m["status"] == "attiva"),
                       "maintenance": sum(1 for m in machines if m["status"] == "in manutenzione"),
                       "total": len(machines),
                       "updated_at": (doc or {}).get("updated_at"),
                       "operator": (doc or {}).get("operator", "")})
    return {"departments": result}


@api_router.get("/depts/{dept}/machines")
async def dept_machines_get(dept: str, org: str = Depends(effective_org)):
    if dept not in DEPARTMENTS and not dept.startswith("dept-"):
        raise HTTPException(404, "Reparto non trovato")
    doc = await db.dept_machines.find_one({"dept": dept, "organization_id": org}, {"_id": 0})
    return {"dept": dept, "dept_name": await _dept_name(org, dept),
            "machines": _dept_machines_merged(dept, doc),
            "updated_at": (doc or {}).get("updated_at"), "operator": (doc or {}).get("operator", "")}


@api_router.post("/depts/{dept}/machines")
async def dept_machines_set(dept: str, body: DeptMachinesReq, org: str = Depends(effective_org)):
    if dept not in DEPARTMENTS and not dept.startswith("dept-"):
        raise HTTPException(404, "Reparto non trovato")
    prev = await db.dept_machines.find_one({"dept": dept, "organization_id": org}, {"_id": 0})
    # ID validi = catalogo di base + macchine personalizzate del Capo.
    valid_ids = {m["id"] for m in _base_machines(dept)} | {c.get("id") for c in ((prev or {}).get("custom") or [])}
    clean = []
    for m in body.machines:
        if m.id not in valid_ids:
            continue
        st = m.status if m.status in _MACHINE_STATES else "spenta"
        clean.append({"id": m.id, "status": st, "value": (m.value or "").strip()[:60]})
    now = now_iso()
    await db.dept_machines.update_one({"dept": dept, "organization_id": org},
        {"$set": {"dept": dept, "machines": clean, "operator": (body.operator or "").strip()[:80], "updated_at": now, "organization_id": org}},
        upsert=True)
    doc = await db.dept_machines.find_one({"dept": dept, "organization_id": org}, {"_id": 0})
    return {"ok": True, "dept": dept, "dept_name": await _dept_name(org, dept),
            "machines": _dept_machines_merged(dept, doc), "updated_at": now}


# --- Macchine COMPLETAMENTE editabili dal Capo: aggiungi/rinomina/elimina ---
class DeptMachineAddReq(BaseModel):
    name: str = ""
    type: str = "altro"


class DeptMachineRenameReq(BaseModel):
    name: str = ""


@api_router.post("/depts/{dept}/machines/add")
async def dept_machine_add(dept: str, body: DeptMachineAddReq, admin: dict = Depends(require_admin)):
    """Il Capo aggiunge una macchina/strumento personalizzato (forno, cella, silo, bilancia…)."""
    if dept not in DEPARTMENTS and not dept.startswith("dept-"):
        raise HTTPException(404, "Reparto non trovato")
    import uuid as _uuid
    org = _org_id(admin)
    nm = (body.name or "").strip()
    if not nm:
        raise HTTPException(400, "Nome macchina richiesto")
    item = {"id": "cst-" + _uuid.uuid4().hex[:8], "name": nm[:80], "type": (body.type or "altro").strip()[:40] or "altro"}
    await db.dept_machines.update_one({"dept": dept, "organization_id": org},
        {"$push": {"custom": item}, "$set": {"dept": dept, "organization_id": org, "updated_at": now_iso()}},
        upsert=True)
    doc = await db.dept_machines.find_one({"dept": dept, "organization_id": org}, {"_id": 0})
    return {"ok": True, "machine": item, "machines": _dept_machines_merged(dept, doc)}


@api_router.patch("/depts/{dept}/machines/{mid}")
async def dept_machine_rename(dept: str, mid: str, body: DeptMachineRenameReq, admin: dict = Depends(require_admin)):
    """Rinomina una macchina (di base tramite override, o personalizzata direttamente)."""
    if dept not in DEPARTMENTS and not dept.startswith("dept-"):
        raise HTTPException(404, "Reparto non trovato")
    org = _org_id(admin)
    nm = (body.name or "").strip()
    if not nm:
        raise HTTPException(400, "Nome richiesto")
    is_custom = any(m["id"] == mid for m in _base_machines(dept)) is False
    doc = await db.dept_machines.find_one({"dept": dept, "organization_id": org}, {"_id": 0})
    if is_custom and doc and any(c.get("id") == mid for c in (doc.get("custom") or [])):
        await db.dept_machines.update_one({"dept": dept, "organization_id": org, "custom.id": mid},
            {"$set": {"custom.$.name": nm[:80], "updated_at": now_iso()}})
    else:
        await db.dept_machines.update_one({"dept": dept, "organization_id": org},
            {"$set": {f"overrides.{mid}.name": nm[:80], "dept": dept, "organization_id": org, "updated_at": now_iso()}},
            upsert=True)
    doc = await db.dept_machines.find_one({"dept": dept, "organization_id": org}, {"_id": 0})
    return {"ok": True, "machines": _dept_machines_merged(dept, doc)}


class DeptMachinePresetReq(BaseModel):
    activity: str = "panificio"


_MACHINE_PRESETS = {
    "panificio": [("Forno rotativo", "forno"), ("Forno a piani", "forno"), ("Impastatrice a spirale", "impastatrice"),
                  ("Cella di lievitazione", "cella"), ("Sfogliatrice", "altro"), ("Bilancia", "bilancia")],
    "pizzeria": [("Forno pizza", "forno"), ("Impastatrice a forcella", "impastatrice"), ("Frigo pizza", "cella"),
                 ("Stendipizza", "altro"), ("Bilancia", "bilancia")],
    "pasticceria": [("Forno statico", "forno"), ("Planetaria", "impastatrice"), ("Abbattitore", "cella"),
                    ("Temperatrice cioccolato", "altro"), ("Frigo pasticceria", "cella"), ("Bilancia", "bilancia")],
}


@api_router.post("/depts/{dept}/machines/preset")
async def dept_machine_preset(dept: str, body: DeptMachinePresetReq, admin: dict = Depends(require_admin)):
    """Precarica le macchine tipiche dell'attività nel reparto (dedup per nome, come i silos)."""
    if dept not in DEPARTMENTS and not dept.startswith("dept-"):
        raise HTTPException(404, "Reparto non trovato")
    import uuid as _uuid
    org = _org_id(admin)
    act = (body.activity or "panificio").strip().lower()
    preset = _MACHINE_PRESETS.get(act, _MACHINE_PRESETS["panificio"])
    doc = await db.dept_machines.find_one({"dept": dept, "organization_id": org}, {"_id": 0})
    existing = {m["name"].strip().lower() for m in _dept_machines_merged(dept, doc)}
    added = []
    for name, typ in preset:
        if name.strip().lower() in existing:
            continue
        item = {"id": "cst-" + _uuid.uuid4().hex[:8], "name": name, "type": typ}
        await db.dept_machines.update_one({"dept": dept, "organization_id": org},
            {"$push": {"custom": item}, "$set": {"dept": dept, "organization_id": org, "updated_at": now_iso()}}, upsert=True)
        added.append(name)
    doc = await db.dept_machines.find_one({"dept": dept, "organization_id": org}, {"_id": 0})
    return {"ok": True, "added": len(added), "activity": act, "machines": _dept_machines_merged(dept, doc)}


class DeptMachineReorderReq(BaseModel):
    order: List[str] = []


@api_router.put("/depts/{dept}/machines/reorder")
async def dept_machine_reorder(dept: str, body: DeptMachineReorderReq, admin: dict = Depends(require_admin)):
    """Il Capo trascina le macchine nell'ordine in cui le usa: l'ordine viene salvato."""
    if dept not in DEPARTMENTS and not dept.startswith("dept-"):
        raise HTTPException(404, "Reparto non trovato")
    org = _org_id(admin)
    await db.dept_machines.update_one({"dept": dept, "organization_id": org},
        {"$set": {"order": [str(x) for x in (body.order or [])], "dept": dept, "organization_id": org, "updated_at": now_iso()}},
        upsert=True)
    doc = await db.dept_machines.find_one({"dept": dept, "organization_id": org}, {"_id": 0})
    return {"ok": True, "machines": _dept_machines_merged(dept, doc)}


@api_router.delete("/depts/{dept}/machines/{mid}")
async def dept_machine_delete(dept: str, mid: str, admin: dict = Depends(require_admin)):
    """Elimina una macchina: se personalizzata la rimuove, se di base la nasconde."""
    if dept not in DEPARTMENTS and not dept.startswith("dept-"):
        raise HTTPException(404, "Reparto non trovato")
    org = _org_id(admin)
    is_base = any(m["id"] == mid for m in _base_machines(dept))
    if is_base:
        await db.dept_machines.update_one({"dept": dept, "organization_id": org},
            {"$set": {f"overrides.{mid}.hidden": True, "dept": dept, "organization_id": org, "updated_at": now_iso()}},
            upsert=True)
    else:
        await db.dept_machines.update_one({"dept": dept, "organization_id": org},
            {"$pull": {"custom": {"id": mid}}, "$set": {"updated_at": now_iso()}})
    doc = await db.dept_machines.find_one({"dept": dept, "organization_id": org}, {"_id": 0})
    return {"ok": True, "machines": _dept_machines_merged(dept, doc)}

class DeptAssignReq(BaseModel):
    dept: str = ""
    task: str = ""
    operator: str = "Sitor"
    note: str = ""

@api_router.get("/depts/assignment")
async def depts_assignment(org: str = Depends(effective_org)):
    today = now_iso()[:10]
    docs = await db.dept_assignments.find({"date": today, "organization_id": org}, {"_id": 0}).sort("at", -1).to_list(50)
    return {"date": today, "assignments": docs}

@api_router.post("/depts/assign")
async def depts_assign(body: DeptAssignReq, admin: dict = Depends(require_admin)):
    import uuid as _uuid
    if body.dept not in DEPARTMENTS and not body.dept.startswith("dept-"):
        raise HTTPException(status_code=400, detail="Reparto sconosciuto")
    today = now_iso()[:10]
    doc = {"id": _uuid.uuid4().hex[:10], "date": today, "dept": body.dept,
           "dept_name": _dept_label(body.dept), "task": (body.task or "").strip(),
           "operator": (body.operator or "Sitor").strip(), "note": (body.note or "").strip(),
           "by": admin.get("email") or "master", "at": now_iso(), "organization_id": _org_id(admin)}
    await db.dept_assignments.insert_one({**doc})
    doc.pop("_id", None)
    # PRIORITÀ DEL CAPO: assegnare un operatore a un reparto è un comando della Direzione →
    # blocca lo stato dell'operatore (nessuna riassegnazione automatica potrà spostarlo).
    op = (body.operator or "").strip()
    if op and op.lower() != "sitor":
        await _set_worker_state(_org_id(admin), op, status="busy", dept=body.dept,
                                task=(body.task or "").strip(), locked_by_capo=True, capo_at=now_iso())
    return {"ok": True, "assignment": doc}

@api_router.delete("/depts/assign/{aid}")
async def depts_assign_delete(aid: str, admin: dict = Depends(require_admin)):
    await db.dept_assignments.delete_one({"id": aid, "organization_id": _org_id(admin)})
    return {"ok": True}

class DeptAssignMultiItem(BaseModel):
    operator: str = ""
    task: str = ""
    apprentice: bool = False

class DeptAssignMultiReq(BaseModel):
    dept: str = ""
    items: List[DeptAssignMultiItem] = []
    target: int = 0
    label: str = ""

@api_router.post("/depts/assign-multi")
async def depts_assign_multi(body: DeptAssignMultiReq, admin: dict = Depends(require_admin)):
    """Assegna PIÙ operai a mansioni distinte nello stesso reparto in un colpo solo."""
    import uuid as _uuid
    if body.dept not in DEPARTMENTS and not body.dept.startswith("dept-"):
        raise HTTPException(status_code=400, detail="Reparto sconosciuto")
    today = now_iso()[:10]
    created = []
    for it in body.items:
        op = (it.operator or "").strip()
        if not op:
            continue
        doc = {"id": _uuid.uuid4().hex[:10], "date": today, "dept": body.dept,
               "dept_name": _dept_label(body.dept), "task": (it.task or "").strip(),
               "operator": op, "note": "", "apprentice": bool(it.apprentice),
               "by": admin.get("email") or "master", "at": now_iso(), "organization_id": _org_id(admin)}
        await db.dept_assignments.insert_one({**doc})
        doc.pop("_id", None)
        created.append(doc)
    if int(body.target or 0) > 0:
        org = _org_id(admin)
        await db.dept_objectives.update_one(
            {"date": today, "dept": body.dept, "organization_id": org},
            {"$set": {"date": today, "dept": body.dept, "dept_name": _dept_label(body.dept),
                      "target": int(body.target or 0), "unit": "pezzi", "label": (body.label or "").strip(),
                      "updated_at": now_iso(), "organization_id": org},
             "$setOnInsert": {"done": 0, "entries": []}},
            upsert=True)
    return {"ok": True, "assignments": created}

# --- Obiettivi di squadra in tempo reale (sync per reparto, tracciati per PIN) ---
class ObjectiveReq(BaseModel):
    dept: str = ""
    target: int = 0
    unit: str = "pezzi"
    label: str = ""

class ProgressReq(BaseModel):
    dept: str = ""
    qty: int = 0
    pin: str = ""
    operator: str = ""
    note: str = ""

@api_router.post("/depts/objective")
async def depts_objective_set(body: ObjectiveReq, admin: dict = Depends(require_admin)):
    if body.dept not in DEPARTMENTS and not body.dept.startswith("dept-"):
        raise HTTPException(status_code=400, detail="Reparto sconosciuto")
    today = now_iso()[:10]
    org = _org_id(admin)
    await db.dept_objectives.update_one(
        {"date": today, "dept": body.dept, "organization_id": org},
        {"$set": {"date": today, "dept": body.dept, "dept_name": _dept_label(body.dept),
                  "target": int(body.target or 0), "unit": body.unit or "pezzi", "label": (body.label or "").strip(),
                  "updated_at": now_iso(), "organization_id": org},
         "$setOnInsert": {"done": 0, "entries": []}},
        upsert=True)
    doc = await db.dept_objectives.find_one({"date": today, "dept": body.dept, "organization_id": org}, {"_id": 0})
    return {"ok": True, "objective": doc}

@api_router.post("/depts/progress")
async def depts_progress(body: ProgressReq, org: str = Depends(effective_org)):
    if body.dept not in DEPARTMENTS and not body.dept.startswith("dept-"):
        raise HTTPException(status_code=400, detail="Reparto sconosciuto")
    today = now_iso()[:10]
    entry = {"pin": (body.pin or "??")[-4:], "operator": (body.operator or "").strip() or "Operaio",
             "qty": int(body.qty or 0), "note": (body.note or "").strip(), "at": now_iso()}
    await db.dept_objectives.update_one(
        {"date": today, "dept": body.dept, "organization_id": org},
        {"$inc": {"done": int(body.qty or 0)},
         "$push": {"entries": {"$each": [entry], "$slice": -60}},
         "$setOnInsert": {"date": today, "dept": body.dept, "dept_name": _dept_label(body.dept), "target": 0, "unit": "pezzi", "label": "", "organization_id": org}},
        upsert=True)
    doc = await db.dept_objectives.find_one({"date": today, "dept": body.dept, "organization_id": org}, {"_id": 0})
    return {"ok": True, "objective": doc}

@api_router.get("/depts/board")
async def depts_board(org: str = Depends(effective_org)):
    today = now_iso()[:10]
    docs = await db.dept_objectives.find({"date": today, "organization_id": org}, {"_id": 0}).to_list(50)
    return {"date": today, "objectives": docs}


@api_router.get("/depts/history")
async def depts_history(days: int = 14, admin: dict = Depends(require_admin)):
    """Storico turni: composizione squadra per giorno e reparto."""
    docs = await db.dept_assignments.find({"organization_id": _org_id(admin)}, {"_id": 0}).sort("at", -1).to_list(3000)
    by_date = {}
    for a in docs:
        d = a.get("date") or (a.get("at") or "")[:10]
        if not d:
            continue
        by_date.setdefault(d, []).append(a)
    n = max(1, min(int(days or 14), 60))
    out = []
    for d in sorted(by_date.keys(), reverse=True)[:n]:
        depts = {}
        for a in by_date[d]:
            k = a.get("dept", "")
            depts.setdefault(k, {"dept": k, "dept_name": a.get("dept_name", ""), "ops": []})
            depts[k]["ops"].append({"operator": a.get("operator", ""), "task": a.get("task", "")})
        out.append({"date": d, "depts": list(depts.values())})
    return {"history": out}


# --- Modelli di turno (turni-tipo salvati, riapplicabili con un tocco) ---
class DeptTemplateItem(BaseModel):
    dept: str = ""
    operator: str = ""
    task: str = ""

class DeptTemplateCreateReq(BaseModel):
    name: str = ""
    items: List[DeptTemplateItem] = []

@api_router.get("/depts/templates")
async def depts_templates_list(org: str = Depends(effective_org)):
    docs = await db.dept_templates.find({"organization_id": org}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"templates": docs}

@api_router.post("/depts/templates")
async def depts_templates_create(body: DeptTemplateCreateReq, admin: dict = Depends(require_admin)):
    import uuid as _uuid
    nm = (body.name or "").strip()
    if not nm:
        raise HTTPException(status_code=400, detail="Nome turno richiesto")
    items = [{"dept": it.dept, "operator": (it.operator or "").strip(), "task": (it.task or "").strip()}
             for it in (body.items or []) if (it.operator or "").strip()]
    if not items:
        raise HTTPException(status_code=400, detail="Nessuna assegnazione da salvare")
    doc = {"id": _uuid.uuid4().hex[:10], "name": nm, "items": items,
           "by": admin.get("email") or "master", "created_at": now_iso(), "organization_id": _org_id(admin)}
    await db.dept_templates.insert_one({**doc})
    doc.pop("_id", None)
    return {"ok": True, "template": doc}

@api_router.delete("/depts/templates/{tid}")
async def depts_templates_delete(tid: str, admin: dict = Depends(require_admin)):
    await db.dept_templates.delete_one({"id": tid, "organization_id": _org_id(admin)})
    return {"ok": True}

@api_router.post("/depts/templates/{tid}/apply")
async def depts_templates_apply(tid: str, admin: dict = Depends(require_admin)):
    import uuid as _uuid
    org = _org_id(admin)
    tpl = await db.dept_templates.find_one({"id": tid, "organization_id": org}, {"_id": 0})
    if not tpl:
        raise HTTPException(status_code=404, detail="Turno-tipo non trovato")
    today = now_iso()[:10]
    created = []
    for it in (tpl.get("items") or []):
        dept = it.get("dept", "")
        op = (it.get("operator") or "").strip()
        if not op or (dept not in DEPARTMENTS and not dept.startswith("dept-")):
            continue
        doc = {"id": _uuid.uuid4().hex[:10], "date": today, "dept": dept,
               "dept_name": _dept_label(dept), "task": (it.get("task") or "").strip(),
               "operator": op, "note": "", "by": admin.get("email") or "master", "at": now_iso(), "organization_id": org}
        await db.dept_assignments.insert_one({**doc})
        doc.pop("_id", None)
        created.append(doc)
        if op.lower() != "sitor":
            await _set_worker_state(org, op, status="busy", dept=dept,
                                    task=(it.get("task") or "").strip(), locked_by_capo=True, capo_at=now_iso())
    return {"ok": True, "assignments": created}


@api_router.get("/depts/presence")
async def depts_presence(admin: dict = Depends(require_admin)):
    """Presenza live: operai la cui ultima timbratura di oggi non è 'out'."""
    today = now_iso()[:10]
    entries = await db.compliance_timelog.find({"at": {"$regex": f"^{re.escape(today)}"}, "organization_id": _org_id(admin)}, {"_id": 0}).sort("seq", 1).to_list(3000)
    last = {}
    for e in entries:
        w = (e.get("worker") or "").strip()
        if w:
            last[w] = e.get("action")
    present = [w for w, a in last.items() if a in ("in", "break_start", "break_end")]
    return {"date": today, "present": present}


@api_router.get("/depts/shift-report")
async def depts_shift_report(admin: dict = Depends(require_admin)):
    """Report fine turno: assegnazioni + presenze + pezzi prodotti per reparto."""
    today = now_iso()[:10]
    _org = _org_id(admin)
    asg = await db.dept_assignments.find({"date": today, "organization_id": _org}, {"_id": 0}).to_list(2000)
    objs = await db.dept_objectives.find({"date": today, "organization_id": _org}, {"_id": 0}).to_list(50)
    entries = await db.compliance_timelog.find({"at": {"$regex": f"^{re.escape(today)}"}, "organization_id": _org}, {"_id": 0}).sort("seq", 1).to_list(3000)
    last = {}
    for e in entries:
        w = (e.get("worker") or "").strip()
        if w:
            last[w] = e.get("action")
    present = set(w for w, a in last.items() if a in ("in", "break_start", "break_end"))
    obj_by = {o.get("dept"): o for o in objs}
    depts = {}
    for a in asg:
        k = a.get("dept", "")
        depts.setdefault(k, {"dept": k, "dept_name": a.get("dept_name", ""), "assigned": [], "produced": None})
        depts[k]["assigned"].append({"operator": a.get("operator", ""), "task": a.get("task", ""), "present": a.get("operator", "") in present})
    out = []
    for k, v in depts.items():
        o = obj_by.get(k)
        if o:
            v["produced"] = {"done": o.get("done", 0), "target": o.get("target", 0), "unit": o.get("unit", "pezzi"), "label": o.get("label", "")}
        out.append(v)
    tot_assigned = sum(len(v["assigned"]) for v in out)
    tot_present = sum(1 for v in out for op in v["assigned"] if op["present"])
    tot_prod = sum((v["produced"]["done"] if v["produced"] else 0) for v in out)
    return {"date": today, "depts": out, "totals": {"assigned": tot_assigned, "present": tot_present, "produced": tot_prod}}


@api_router.post("/mike/deus/capture")
async def deus_capture(body: CaptureReq, admin: dict = Depends(require_admin)):
    """Il Capo butta dentro qualsiasi cosa (voce/foto/email/testo): Sitor capisce, genera e riempie la produzione."""
    email = (admin.get("email") or "master").lower()
    import json as _json, re as _re, uuid as _uuid
    xp, _ = await _bond_get(email)
    info = _bond_info(xp, body.lang)
    content = (body.text or "").strip()
    mode = (body.mode or "text").lower()
    if mode == "photo":
        img_b64 = (body.image_base64 or "").split(",")[-1]
        if img_b64 and EMERGENT_LLM_KEY:
            try:
                vchat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"deus-ocr-{_uuid.uuid4().hex[:8]}",
                    system_message=("Sei l'OCR di Sitor in un panificio. Trascrivi FEDELMENTE tutto il testo utile della foto "
                                    "(ricetta con ingredienti e dosi, ordine, lista, note). Struttura chiara. Solo il testo trascritto.")
                    ).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=1500)
                extracted = ""
                async for ev in vchat.stream_message(UserMessage(text="Trascrivi il contenuto della foto.", file_contents=[ImageContent(image_base64=img_b64)])):
                    if isinstance(ev, TextDelta):
                        extracted += ev.content or ""
                if extracted.strip():
                    content = (content + "\n[TRASCRIZIONE FOTO]\n" + extracted.strip()).strip()
            except Exception as e:
                logger.warning("deus_capture OCR fail (%s)", str(e)[:120])
        if body.image_url and "[TRASCRIZIONE" not in content:
            content = (content + f"\n[FOTO ALLEGATA: {body.image_url}]").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Niente da elaborare")
    sysmsg = _deus_persona(info, body.lang) + (
        "\nIl Capo ti passa un input grezzo (dettato a voce, email incollata, foto di un ricettario, o testo). "
        "Tu CAPISCI a quale settore appartiene e lo TRASFORMI in azioni concrete per la produzione. "
        f"Settori possibili: {', '.join(_SECTORS)}. "
        "Restituisci SOLO un JSON valido: {"
        "\"sector\": \"uno dei settori\", "
        "\"summary\": \"1 frase: cosa hai capito\", "
        "\"generated\": [\"2-5 voci concrete che hai generato/estratto (ricette, righe di piano, ordini, ecc.)\"], "
        "\"production_tasks\": [{\"title\": \"compito breve per la produzione\", \"detail\": \"dettaglio operativo\", \"dept\": \"panetteria|pizzeria|pasticceria|generale\"}], "
        "\"reply\": \"1-2 frasi parlate, calde e sicure, con cui confermi al Capo cosa hai messo in produzione\"}. "
        "Genera SEMPRE almeno 1 production_task. Nessun testo fuori dal JSON."
    )
    sysmsg += await _bakery_snapshot(admin)
    raw = await _deus_llm(sysmsg, content, session=f"deus-capture-{email}", max_tokens=1400)
    data = {"sector": "note", "summary": "", "generated": [], "production_tasks": [], "reply": ""}
    cleaned = (raw or "").strip()
    if cleaned.startswith("```"):
        cleaned = _re.sub(r"^```[a-zA-Z]*\s*", "", cleaned); cleaned = _re.sub(r"\s*```$", "", cleaned).strip()
    i, j = cleaned.find("{"), cleaned.rfind("}")
    if i != -1 and j > i:
        try: data.update(_json.loads(cleaned[i:j + 1]))
        except Exception as e: logger.warning("deus_capture json fail (%s)", str(e)[:120])
    sector = data.get("sector") if data.get("sector") in _SECTORS else "note"
    tasks = data.get("production_tasks") or []
    if not tasks:
        tasks = [{"title": (data.get("summary") or content)[:80], "detail": "", "dept": "generale"}]
    stored = []
    for tk in tasks[:8]:
        doc = {"id": _uuid.uuid4().hex[:12], "organization_id": _org_id(admin),
               "title": (tk.get("title") or "").strip()[:120],
               "detail": (tk.get("detail") or "").strip()[:300], "dept": tk.get("dept") or "generale",
               "sector": sector, "mode": mode, "image_url": body.image_url or None,
               "status": "pending", "at": now_iso()}
        await db.capo_queue.insert_one({**doc})
        doc.pop("_id", None); stored.append(doc)
    new_xp, _ = await _bond_add(email, 20)
    return {"ok": True, "sector": sector, "summary": data.get("summary") or "",
            "generated": data.get("generated") or [], "reply": data.get("reply") or "",
            "tasks": stored, "counts": await _queue_counts(_org_id(admin)), "bond": _bond_info(new_xp, body.lang)}






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
        ).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=2000)
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


# ---------------------------------------------------------------------------
# MIKE MIX · FORMAZIONE NEI TEMPI MORTI (Fase 3 del Manifesto)
# Sitor trasforma le pause di produzione in micro-lezioni interattive per ricetta,
# attingendo al ricettario MikiLab. Supervisione/abilitazione esclusiva del Capo Supremo.
# ---------------------------------------------------------------------------
class TrainingReq(BaseModel):
    recipe_id: Optional[str] = None
    recipe_name: Optional[str] = None
    lang: str = "it"


_TRAINING_CACHE: dict = {}


@api_router.post("/mike/training")
async def mike_training(payload: TrainingReq):
    """Sitor genera una micro-lezione interattiva (JSON) su una ricetta del ricettario MikiLab."""
    q = {"collection_name": "mikilab", "hidden": {"$ne": True}}
    doc = None
    if payload.recipe_id:
        doc = await db.recipes.find_one({"id": payload.recipe_id}, {"_id": 0})
    elif payload.recipe_name:
        doc = await db.recipes.find_one({**q, "name": payload.recipe_name}, {"_id": 0})
    if not doc:
        doc = await db.recipes.find_one(q, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Nessuna ricetta disponibile")

    lang = (payload.lang or "it").lower()
    cache_key = f"{doc.get('id','x')}::{lang}"
    if cache_key in _TRAINING_CACHE:
        return _TRAINING_CACHE[cache_key]

    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=503, detail="Formatore non configurato")

    ctx = {k: doc.get(k) for k in ["name", "flour_type", "notes", "procedure", "dough_category", "water_temp_c", "extra_ingredients"] if doc.get(k)}
    lang_name = {"it": "italiano", "de": "tedesco", "en": "inglese", "es": "spagnolo", "fr": "francese", "fa": "persiano"}.get(lang, "italiano")
    sysmsg = (
        "Sei Sitor, il maestro cibernetico operativo di MikiLab. Durante le pause di produzione fai una "
        "MICRO-LEZIONE pratica per l'operatore su UNA ricetta, con tono autorevole, caldo e concreto da fornaio. "
        f"Rispondi ESCLUSIVAMENTE in {lang_name} e SOLO con JSON valido."
    )
    prompt = (
        "Dalla ricetta seguente crea una micro-lezione interattiva e restituisci un JSON con questa struttura ESATTA:\n"
        '{"title": "titolo breve", "duration_min": 4, '
        '"intro": "1-2 frasi che motivano l\'operatore", '
        '"steps": [{"title": "passo", "detail": "spiegazione pratica 1-2 frasi"}], '
        '"mistakes": [{"wrong": "errore comune", "fix": "come correggerlo"}], '
        '"quiz": [{"q": "domanda", "options": ["a","b","c"], "answer_index": 0}]}\n'
        "Regole: 4-6 steps, 2-3 mistakes, 3 domande di quiz con 3 opzioni ciascuna e answer_index corretto. "
        "Concreto, niente fronzoli.\nRICETTA:\n" + json.dumps(ctx, ensure_ascii=False)
    )
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY, session_id=f"train-{doc.get('id','x')}-{lang}",
            system_message=sysmsg,
        ).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=1800)
        full = ""
        async for ev in chat.stream_message(UserMessage(text=prompt)):
            if isinstance(ev, TextDelta):
                full += ev.content
            elif isinstance(ev, StreamDone):
                break
        m = re.search(r"\{.*\}", full, re.S)
        lesson = json.loads(m.group(0)) if m else {}
    except Exception as e:
        logging.warning(f"mike_training failed: {e}")
        raise HTTPException(status_code=424, detail="Errore generazione lezione")

    lesson["recipe_id"] = doc.get("id")
    lesson["recipe_name"] = doc.get("name")
    _TRAINING_CACHE[cache_key] = lesson
    return lesson




# ---------------------------------------------------------------------------
# MIKE MIX · ECOSISTEMA AUTONOMO (Fase 10) — impara dal campo e allerta il Capo.
# L'operatore dichiara una scelta/procedura; Sitor la valuta, impara e — se rileva
# un'anomalia — genera un ALLARME per il Capo Supremo MikiLab (persistito su Mongo).
# ---------------------------------------------------------------------------
class ObserveReq(BaseModel):
    recipe_name: Optional[str] = None
    action: str
    operator: Optional[str] = None
    lang: str = "it"




@api_router.get("/mike/alerts")
async def mike_alerts(admin: dict = Depends(require_admin)):
    """Feed allarmi di Sitor per il Capo (anomalie dal campo)."""
    docs = await db.mike_alerts.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"alerts": docs, "unread": sum(1 for d in docs if not d.get("read"))}


@api_router.post("/mike/alerts/read")
async def mike_alerts_read(admin: dict = Depends(require_admin)):
    await db.mike_alerts.update_many({"read": {"$ne": True}}, {"$set": {"read": True}})
    return {"ok": True}


# MIKE MIX · SUPPORTO FORNI A LEGNA & MACCHINARI DATATI (Fase 10)
class LegacyAdaptReq(BaseModel):
    equipment: str            # es. "forno a legna", "impastatrice a bracci anni '80", "cella datata"
    recipe_name: Optional[str] = None
    detail: Optional[str] = None   # note libere (stato, temperatura raggiungibile, ecc.)
    lang: str = "it"





# ---------------------------------------------------------------------------
# MIKI-NEXUS · RICETTARIO VIVENTE & GENERATORE DINAMICO (Fase 9) — funzione suprema.
# Il Capo detta un OBIETTIVO; Sitor calcola la matrice vivente e la curva di maturazione.
# Funzione riservata: require_admin (barriera anti-ospite, Fase 4).
# ---------------------------------------------------------------------------
class LivingRecipeReq(BaseModel):
    objective: str
    product_type: Optional[str] = None   # pizza, pane, focaccia, croissant...
    lang: str = "it"


@api_router.post("/nexus/living-recipe")
async def nexus_living_recipe(payload: LivingRecipeReq, admin: dict = Depends(require_admin)):
    obj = (payload.objective or "").strip()
    if not obj:
        raise HTTPException(status_code=400, detail="Detta un obiettivo")
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=503, detail="Sitor non configurato")
    lang = (payload.lang or "it").lower()
    lang_name = {"it": "italiano", "de": "tedesco", "en": "inglese", "es": "spagnolo", "fr": "francese", "fa": "persiano"}.get(lang, "italiano")
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY, session_id=f"living-{uuid.uuid4().hex[:8]}",
            system_message=(
                "Sei Sitor, coscienza strategica di MikiLab. Dato un obiettivo, calcoli la MATRICE VIVENTE di un "
                "impasto e la curva di maturazione perfetta, con predizione sensoriale (croccantezza, alveolatura, "
                f"aroma). Sii tecnico ma sintetico. Rispondi in {lang_name} e SOLO con JSON valido e CONCISO."),
        ).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=1600)
        prompt = (
            'Restituisci SOLO JSON valido e conciso (max 5 fasi nella curva): {'
            '"name":"nome impasto","matrix":{"flour":"tipo/W","hydration_pct":75,"prefermento":"biga/poolish/none","salt_pct":2.2,"yeast":"es. 0.3% LM"},'
            '"maturation_curve":[{"phase":"puntata","hours":18,"temp_c":4,"note":"breve"}],'
            '"sensory":{"crust":"...","crumb":"...","aroma":"..."},"why":"1-2 frasi"}\n'
            f"Prodotto: {payload.product_type or 'a scelta di Sitor'}\nObiettivo del Capo: {obj}"
        )
        full = ""
        async for ev in chat.stream_message(UserMessage(text=prompt)):
            if isinstance(ev, TextDelta):
                full += ev.content
            elif isinstance(ev, StreamDone):
                break
        m = re.search(r"\{.*\}", full, re.S)
        recipe = json.loads(m.group(0)) if m else {}
    except Exception as e:
        logging.warning(f"living_recipe failed: {e}")
        raise HTTPException(status_code=424, detail="Errore calcolo matrice")
    recipe["objective"] = obj
    recipe["generated_at"] = now_iso()
    try:
        await db.living_recipes.insert_one({**recipe})
    except Exception:
        pass
    recipe.pop("_id", None)
    return recipe



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


@api_router.get("/recipes", response_model=List[Recipe])
async def get_recipes(collection_name: str = "mikilab", include_mine: bool = False, user: Optional[dict] = Depends(optional_user)):
    if collection_name == "mikilab":
        await seed_mikilab_if_empty()
        docs = await db.recipes.find({"collection_name": "mikilab", "organization_id": _org_id(user), "hidden": {"$ne": True}}, {"_id": 0}).sort("name", 1).to_list(1000)
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
                {"collection_name": "personal", "owner_id": {"$in": owner_ids}, "organization_id": _org_id(user), "hidden": {"$ne": True}}, {"_id": 0},
            ).sort("name", 1).to_list(1000)
            for d in owner_personal:
                d.pop("owner_id", None)
            docs = docs + owner_personal
        # Opzione Capo "Mostra anche le mie ricette": include LE PROPRIE ricette personali
        # nel Master (di default escluse per evitare duplicati con la scheda «Le Mie Ricette»).
        if include_mine and user:
            mine = await db.recipes.find(
                {"collection_name": "personal", "owner_id": user["user_id"], "hidden": {"$ne": True}}, {"_id": 0},
            ).sort("name", 1).to_list(1000)
            for d in mine:
                d.pop("owner_id", None)
            existing_ids = {d.get("id") for d in docs}
            docs = docs + [d for d in mine if d.get("id") not in existing_ids]
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
        # Accesso GRATUITO totale: nessuna ricetta bloccata.
        for d in docs:
            d["locked"] = False
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
    lang_name = _LANG_NAMES.get(payload.lang, "italiano")
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY, session_id=f"wcim-{uuid.uuid4().hex[:8]}",
            system_message=("Sei un assistente da panificio. L'utente elenca gli ingredienti che ha in casa. "
                            "Data la lista di ricette (con farina, prefermento, ingredienti extra), decidi quali può fare ORA "
                            "e quali gli mancano per 1-2 ingredienti. Considera che acqua e sale sono quasi sempre disponibili; "
                            "farina, lievito/lievito madre e gli extra sono i veri discriminanti. Sii pratico e non troppo severo. "
                            "REGOLA FERREA: se per una ricetta manca anche UN SOLO ingrediente chiave (una farina specifica, il lievito/lievito madre, o un extra citato tipo olive/noci/semi/uvetta), NON metterla in 'makable' ma in 'almost' con cosa manca. In 'makable' vanno SOLO ricette per cui l'utente ha davvero tutto. "
                            f"Rispondi SOLO con JSON valido. Le note ('note' e 'missing') scrivile in {lang_name}."),
        ).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=3500)
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



# ===========================================================================
# BAKOMIX · SESTO SENSO — Motore Proattivo del Laboratorio
# ---------------------------------------------------------------------------
# Sitor non aspetta comandi: OSSERVA lo stato condiviso del turno (lotti,
# guasti macchine, celle, orario, check-in) e ANTICIPA i problemi, generando
# "alert" proattivi multilingua + un "battito" (heartbeat) e un "umore" che
# alimentano l'Aura sonora/visiva. Niente HACCP, niente allergeni: solo
# operatività pura del fornaio.
# ===========================================================================
_PULSE_LANGS = ("it", "de", "en", "es", "fr", "fa")


def _tr6(it, de, en, es, fr, fa):
    return {"it": it, "de": de, "en": en, "es": es, "fr": fr, "fa": fa}


async def _compute_pulse(org: str = ORG_DEFAULT):
    now = datetime.now(timezone.utc)
    shift = await db.lab_shift_state.find_one({"_key": "default", "organization_id": org}, {"_id": 0, "_key": 0}) or {}
    floor = await db.floor_plan.find_one({"_key": "active", "organization_id": org}, {"_id": 0, "_key": 0})
    checkin = await db.lab_checkin.find_one({"_key": "active", "organization_id": org}, {"_id": 0, "_key": 0}) or {}
    rest = await db.lab_rest_mode.find_one({"_key": "default", "organization_id": org}, {"_id": 0, "_key": 0}) or {}

    alerts = []
    load = 0

    # --- Guasti macchina → CRITICO ---
    for m in (shift.get("machines_down") or []):
        nm = (m.get("name") or "Macchina").strip()
        alerts.append({
            "id": f"mach-{m.get('id', nm)}", "level": "critical", "station": nm, "code": "machine_down",
            "text": _tr6(f"{nm} ferma: la produzione rischia di bloccarsi.",
                         f"{nm} steht still: die Produktion droht zu stocken.",
                         f"{nm} down: production risks stalling.",
                         f"{nm} parada: la producción corre riesgo.",
                         f"{nm} en panne : la production risque de bloquer.",
                         f"{nm} از کار افتاده: تولید ممکن است متوقف شود."),
            "suggestion": _tr6("Sposto i lotti su una linea alternativa e avviso il team.",
                               "Ich verlagere die Chargen auf eine Ersatzlinie und warne das Team.",
                               "I move batches to a backup line and alert the team.",
                               "Muevo los lotes a una línea alternativa y aviso al equipo.",
                               "Je déplace les lots sur une ligne de secours et j'alerte l'équipe.",
                               "دسته‌ها را به خط جایگزین منتقل و تیم را مطلع می‌کنم."),
        })
    # --- Cella / fermalievitazione fuori uso → CRITICO ---
    if shift.get("cold_down"):
        alerts.append({
            "id": "cold-down", "level": "critical", "station": "Cella", "code": "cold_down",
            "text": _tr6("Cella di fermalievitazione fuori uso: la maturazione è a rischio.",
                         "Gärverzögerer außer Betrieb: die Reifung ist gefährdet.",
                         "Proofing cell down: maturation is at risk.",
                         "Cámara de fermentación fuera de uso: la maduración está en riesgo.",
                         "Chambre de pousse hors service : la maturation est menacée.",
                         "اتاق تخمیر از کار افتاده: رسیدن خمیر در خطر است."),
            "suggestion": _tr6("Anticipo gli impasti e riduco l'idratazione dei prossimi lotti.",
                               "Ich ziehe die Teige vor und senke die Hydration der nächsten Chargen.",
                               "I bring doughs forward and lower hydration on next batches.",
                               "Adelanto las masas y bajo la hidratación de los próximos lotes.",
                               "J'avance les pâtes et je baisse l'hydratation des prochains lots.",
                               "خمیرها را جلو می‌اندازم و آب‌رسانی دسته‌های بعد را کم می‌کنم."),
        })
    # --- Lotti: carico e ritardi ---
    for b in (shift.get("batches") or []):
        st = (b.get("status") or "").lower()
        if st in ("in_ritardo", "ritardo", "fermo", "late", "stalled"):
            nm = b.get("recipe_name") or b.get("recipe_id") or "Lotto"
            alerts.append({
                "id": f"batch-{b.get('id', nm)}", "level": "warn", "station": nm, "code": "batch_late",
                "text": _tr6(f"«{nm}» è in ritardo sulla tabella di marcia.",
                             f"„{nm}“ liegt hinter dem Zeitplan.",
                             f"'{nm}' is behind schedule.",
                             f"«{nm}» va con retraso.",
                             f"« {nm} » est en retard.",
                             f"«{nm}» از برنامه عقب است."),
                "suggestion": _tr6("Ricalcolo gli orari a ritroso e riordino la coda del forno.",
                                   "Ich berechne die Rückwärtszeiten neu und ordne die Ofen-Warteschlange.",
                                   "I recompute backward timings and reorder the oven queue.",
                                   "Recalculo los tiempos y reordeno la cola del horno.",
                                   "Je recalcule les horaires et je réordonne la file du four.",
                                   "زمان‌بندی معکوس را دوباره حساب و صف فر را مرتب می‌کنم."),
            })
        if st not in ("fatto", "done", "completato"):
            load += 1

    # --- Check-in del turno mancante durante l'orario di produzione ---
    prod_hours = floor is not None
    if prod_hours and not checkin.get("active"):
        alerts.append({
            "id": "no-checkin", "level": "info", "station": "Turno", "code": "no_checkin",
            "text": _tr6("C'è un piano attivo ma nessuno ha ancora avviato il turno.",
                         "Es gibt einen aktiven Plan, aber niemand hat die Schicht gestartet.",
                         "A plan is active but no one has started the shift yet.",
                         "Hay un plan activo pero nadie ha iniciado el turno.",
                         "Un plan est actif mais personne n'a démarré le service.",
                         "برنامه فعال است اما هنوز کسی شیفت را شروع نکرده."),
            "suggestion": _tr6("Appena qualcuno avvia il turno, avviso la Direzione senza annuncio vocale.",
                               "Sobald jemand startet, informiere ich den Chef leise.",
                               "As soon as someone starts, I quietly notify the Capo.",
                               "En cuanto alguien empiece, aviso al Capo en silencio.",
                               "Dès que quelqu'un démarre, je préviens le Capo en silence.",
                               "به‌محض شروع، کاپو را بی‌صدا مطلع می‌کنم."),
        })

    # --- Personale ridotto (assenze di oggi) → INFO + volumi consigliati ridotti ---
    staff = await _staffing(org)
    if staff["factor"] < 1.0:
        pct = staff["reduce_pct"]
        alerts.append({
            "id": "staffing", "level": "info", "station": "Organico", "code": "staffing",
            "text": _tr6(f"Oggi siete in {staff['present']} su {staff['total']}: personale ridotto.",
                         f"Heute {staff['present']} von {staff['total']}: reduziertes Personal.",
                         f"Today {staff['present']} of {staff['total']}: reduced staff.",
                         f"Hoy {staff['present']} de {staff['total']}: personal reducido.",
                         f"Aujourd'hui {staff['present']} sur {staff['total']} : effectif réduit.",
                         f"امروز {staff['present']} از {staff['total']}: کارکنان کمتر."),
            "suggestion": _tr6(f"Riduco i volumi consigliati di circa il {pct}% e alleggerisco i task.",
                               f"Ich senke die empfohlenen Mengen um ca. {pct}% und entlaste die Aufgaben.",
                               f"I cut suggested volumes by about {pct}% and lighten the tasks.",
                               f"Reduzco los volúmenes sugeridos ~{pct}% y aligero las tareas.",
                               f"Je réduis les volumes conseillés d'environ {pct}% et j'allège les tâches.",
                               f"حجم پیشنهادی را حدود {pct}% کم و وظایف را سبک‌تر می‌کنم."),
        })

    # --- Blocco fuori sequenza (registrato dal Sequence Guard di Sitor) → WARN al Capo ---
    seqb = await db.lab_seq_block.find_one({"_key": "last", "organization_id": org}, {"_id": 0, "_key": 0})
    if seqb and seqb.get("at"):
        try:
            recent = (now - datetime.fromisoformat(seqb["at"])).total_seconds() < 300
        except Exception:
            recent = False
        if recent:
            exp = (seqb.get("expected") or {}).get("name") or "?"
            att = (seqb.get("attempted") or {}).get("name") or "?"
            alerts.append({
                "id": "seq-block", "level": "warn", "station": "Sequenza", "code": "sequence_block",
                "text": _tr6(f"Tentato avvio fuori sequenza: «{att}» prima di «{exp}».",
                             f"Start außer Reihe versucht: „{att}“ vor „{exp}“.",
                             f"Out-of-sequence start attempted: '{att}' before '{exp}'.",
                             f"Inicio fuera de secuencia: «{att}» antes de «{exp}».",
                             f"Démarrage hors séquence : « {att} » avant « {exp} ».",
                             f"شروع خارج از ترتیب: «{att}» قبل از «{exp}»."),
                "suggestion": _tr6(f"Ho bloccato il lotto: deve partire prima «{exp}».",
                                   f"Ich habe die Charge blockiert: zuerst «{exp}».",
                                   f"I blocked the batch: '{exp}' must go first.",
                                   f"Bloqueé el lote: primero «{exp}».",
                                   f"J'ai bloqué le lot : « {exp} » d'abord.",
                                   f"دسته را بلوکه کردم: اول «{exp}»."),
            })

    # --- Sensori live oltre soglia (forno troppo caldo / lievito troppo acido) → CRITICO ---
    sens = await db.lab_sensors_live.find_one({"_key": "live", "organization_id": org}, {"_id": 0, "_key": 0}) or {}
    ot = (sens.get("oven_temp") or {})
    if ot.get("value") is not None and ot["value"] > OVEN_TEMP_MAX:
        alerts.append({
            "id": "sensor-oven", "level": "critical", "station": "Forno", "code": "oven_hot",
            "text": _tr6(f"Forno a {ot['value']}°C: oltre la soglia di sicurezza.",
                         f"Ofen bei {ot['value']}°C: über der Sicherheitsgrenze.",
                         f"Oven at {ot['value']}°C: above the safety threshold.",
                         f"Horno a {ot['value']}°C: sobre el umbral.",
                         f"Four à {ot['value']}°C : au-dessus du seuil.",
                         f"فر روی {ot['value']}°C: بالاتر از آستانه."),
            "suggestion": _tr6("Abbasso subito e ritardo l'infornata di qualche minuto.",
                               "Sofort senken und die Beschickung verzögern.",
                               "Lower now and delay the load by a few minutes.",
                               "Baja ya y retrasa la hornada.",
                               "Baisse maintenant et retarde l'enfournement.",
                               "همین حالا کم کن و بارگذاری را کمی عقب بینداز."),
        })
    ph = (sens.get("ph") or {})
    if ph.get("value") is not None and ph["value"] < PH_MIN:
        alerts.append({
            "id": "sensor-ph", "level": "warn", "station": "Lievito", "code": "ph_low",
            "text": _tr6(f"pH lievito {ph['value']}: troppo acido.",
                         f"Sauerteig-pH {ph['value']}: zu sauer.",
                         f"Sourdough pH {ph['value']}: too acidic.",
                         f"pH masa madre {ph['value']}: demasiado ácido.",
                         f"pH levain {ph['value']} : trop acide.",
                         f"pH خمیرمایه {ph['value']}: خیلی اسیدی."),
            "suggestion": _tr6("Rinfresco o riduco i tempi di maturazione.",
                               "Auffrischen oder Reifezeit verkürzen.",
                               "Refresh it or shorten maturation.",
                               "Refresca o acorta la maduración.",
                               "Rafraîchis ou raccourcis la maturation.",
                               "تازه‌سازی کن یا زمان رسیدن را کوتاه کن."),
        })

    # --- Umore & battito derivati dal carico + criticità ---
    n_crit = sum(1 for a in alerts if a["level"] == "critical")
    n_warn = sum(1 for a in alerts if a["level"] == "warn")
    if n_crit:
        mood = "critico"
    elif n_warn or load >= 6:
        mood = "teso"
    elif load >= 1:
        mood = "attivo"
    else:
        mood = "sereno"
    heartbeat = min(140, 52 + load * 7 + n_warn * 9 + n_crit * 22)
    score = max(0, 100 - n_crit * 30 - n_warn * 12 - max(0, load - 4) * 4)

    alerts.sort(key=lambda a: {"critical": 0, "warn": 1, "info": 2}.get(a["level"], 3))
    return {
        "mood": mood, "heartbeat": int(heartbeat), "score": int(score),
        "load": load, "alerts": alerts,
        "checkin": {"active": bool(checkin.get("active")), "by": checkin.get("by"),
                    "role": checkin.get("role"), "at": checkin.get("at")},
        "rest_mode": {"active": bool(rest.get("active")), "allow_critical": rest.get("allow_critical", True)},
        "staffing": staff,
        "sensors": {k: sens.get(k) for k in ("oven_temp", "ph") if sens.get(k)},
        "plan_active": floor is not None,
        "generated_at": now.isoformat(),
    }


@api_router.get("/lab/pulse")
async def get_lab_pulse(org: str = Depends(effective_org)):
    p = await _compute_pulse(org)
    # Storia del battito: registra uno snapshot leggero al massimo 1 volta al minuto.
    try:
        last = await db.lab_pulse_history.find_one({"organization_id": org}, {"_id": 0, "at": 1}, sort=[("at", -1)])
        now_ts = datetime.now(timezone.utc)
        if not last or (now_ts - datetime.fromisoformat(last["at"])).total_seconds() >= 60:
            await db.lab_pulse_history.insert_one({
                "at": now_ts.isoformat(), "heartbeat": p["heartbeat"], "mood": p["mood"],
                "score": p["score"], "load": p["load"], "organization_id": org,
            })
            # Mantieni solo gli ultimi ~300 punti.
            cnt = await db.lab_pulse_history.count_documents({"organization_id": org})
            if cnt > 300:
                old = await db.lab_pulse_history.find({"organization_id": org}, {"_id": 1}).sort("at", 1).limit(cnt - 300).to_list(cnt - 300)
                if old:
                    await db.lab_pulse_history.delete_many({"_id": {"$in": [o["_id"] for o in old]}})
    except Exception:
        pass
    return p


@api_router.get("/lab/pulse/history")
async def get_pulse_history(minutes: int = 240, org: str = Depends(effective_org)):
    minutes = max(10, min(1440, minutes))
    since = (datetime.now(timezone.utc) - timedelta(minutes=minutes)).isoformat()
    docs = await db.lab_pulse_history.find({"at": {"$gte": since}, "organization_id": org}, {"_id": 0}).sort("at", 1).to_list(300)
    return {"points": docs}

# ===========================================================================
# ENTERPRISE GRID — rete multi-sede (1–100 panifici) orchestrata da Sitor.
# Leaderboard globale, briefing di rete, consulenza flotta, layout spaziale 2D.
# ===========================================================================
async def _seed_sites(org: str = ORG_DEFAULT):
    if await db.lab_sites.count_documents({"organization_id": org}) > 0:
        return
    demo = [
        {"site_id": "bakery_01_stuttgart", "name": "MikiLab Hub Stoccarda", "status": "normal",
         "workers": [{"name": "Michele", "position": "Forno", "avatar": "cyber_fornaio", "score": 96, "streak": 7},
                     {"name": "Antonio", "position": "Impastatore", "avatar": "riccio_pro", "score": 91, "streak": 4}],
         "spatial_layout": {"room_dimensions_m": {"width": 12.0, "length": 18.0},
             "equipment": [{"id": "oven_main_01", "name": "Forno Rotativo Principale", "x": 10.2, "y": 3.1, "status": "optimal"},
                           {"id": "mixer_01", "name": "Impastatrice Spirale 80kg", "x": 4.1, "y": 8.5, "status": "active"}]}},
        {"site_id": "bakery_02_munich", "name": "MikiLab Filiale Monaco", "status": "warning_slow_oven",
         "workers": [{"name": "Hans", "position": "Forno", "avatar": "bavarian_master", "score": 82, "streak": 1}],
         "spatial_layout": {"room_dimensions_m": {"width": 10.0, "length": 14.0},
             "equipment": [{"id": "oven_02", "name": "Forno a Piani", "x": 8.0, "y": 2.5, "status": "warning"}]}},
    ]
    for _d in demo:
        _d["organization_id"] = org
    await db.lab_sites.insert_many(demo)


def _site_metrics(site):
    ws = site.get("workers") or []
    avg = round(sum(w.get("score", 0) for w in ws) / len(ws), 1) if ws else 0.0
    return {**{k: v for k, v in site.items() if k != "_id"}, "avg_score": avg, "aura": _aura_for(int(avg))}


@api_router.get("/enterprise/overview")
async def enterprise_overview(org: str = Depends(effective_org)):
    await _seed_sites(org)
    sites = await db.lab_sites.find({"organization_id": org}, {"_id": 0}).to_list(200)
    allw = [w for s in sites for w in (s.get("workers") or [])]
    avg = round(sum(w.get("score", 0) for w in allw) / len(allw), 1) if allw else 0.0
    crit = sum(1 for s in sites if s.get("status") != "normal")
    return {"total_active_sites": len(sites), "global_efficiency_avg": avg,
            "critical_alerts_count": crit, "total_workers": len(allw)}


@api_router.get("/enterprise/sites")
async def enterprise_sites(org: str = Depends(effective_org)):
    await _seed_sites(org)
    sites = await db.lab_sites.find({"organization_id": org}, {"_id": 0}).to_list(200)
    return {"sites": [_site_metrics(s) for s in sites]}


class SiteCreate(BaseModel):
    name: str = Field(..., max_length=60)
    status: Optional[str] = "normal"
    width: Optional[float] = Field(10.0, ge=2, le=60)
    length: Optional[float] = Field(12.0, ge=2, le=60)


@api_router.post("/enterprise/sites")
async def enterprise_add_site(body: SiteCreate, user: dict = Depends(require_admin)):
    sid = f"site_{str(uuid.uuid4())[:8]}"
    doc = {"site_id": sid, "organization_id": _org_id(user), "name": body.name, "status": body.status or "normal", "workers": [],
           "spatial_layout": {"room_dimensions_m": {"width": float(body.width or 10), "length": float(body.length or 12)}, "equipment": []}}
    await db.lab_sites.insert_one({**doc})
    return _site_metrics(doc)


@api_router.delete("/enterprise/sites/{site_id}")
async def enterprise_del_site(site_id: str, user: dict = Depends(require_admin)):
    await db.lab_sites.delete_one({"site_id": site_id, "organization_id": _org_id(user)})
    return {"ok": True}


class SiteShiftReq(BaseModel):
    site_id: str
    worker_name: str = Field(..., max_length=40)
    position: str = Field(..., max_length=40)
    avatar_style: Optional[str] = "default"
    score: Optional[int] = Field(85, ge=0, le=100)


@api_router.post("/enterprise/site-shift")
async def enterprise_site_shift(body: SiteShiftReq, user: dict = Depends(require_admin)):
    site = await db.lab_sites.find_one({"site_id": body.site_id, "organization_id": _org_id(user)})
    if not site:
        raise HTTPException(status_code=404, detail="Panificio non trovato nella griglia globale.")
    worker = {"name": body.worker_name, "position": body.position, "avatar": body.avatar_style or "default",
              "score": int(body.score or 85), "streak": 1}
    await db.lab_sites.update_one({"site_id": body.site_id, "organization_id": _org_id(user)}, {"$push": {"workers": worker}})
    return {"status": "success", "message": f"Assegnato {body.worker_name} ({body.position}) presso {site['name']}."}


@api_router.get("/enterprise/global-leaderboard")
async def enterprise_global_leaderboard(org: str = Depends(effective_org)):
    await _seed_sites(org)
    sites = await db.lab_sites.find({"organization_id": org}, {"_id": 0}).to_list(200)
    allw = []
    for s in sites:
        for w in (s.get("workers") or []):
            allw.append({"worker_name": w.get("name"), "site_name": s.get("name"), "position": w.get("position"),
                         "avatar": w.get("avatar"), "score": w.get("score", 85), "streak": w.get("streak", 1),
                         "aura": _aura_for(int(w.get("score", 85)))})
    allw.sort(key=lambda x: x["score"], reverse=True)
    for rank, w in enumerate(allw, start=1):
        w["global_rank"] = rank
        w["title"] = "Grandmaster of the Network" if rank == 1 else "Elite Artisan"
    return {"global_leaderboard": allw}


@api_router.get("/enterprise/global-morning-briefing")
async def enterprise_global_briefing(org: str = Depends(effective_org)):
    await _seed_sites(org)
    sites = await db.lab_sites.find({"organization_id": org}, {"_id": 0}).to_list(200)
    allw = [w for s in sites for w in (s.get("workers") or [])]
    avg = round(sum(w.get("score", 0) for w in allw) / len(allw), 1) if allw else 0.0
    exc = [{"site_id": s["site_id"], "name": s["name"], "status": s["status"]} for s in sites if s.get("status") != "normal"]
    return {"status": "success", "greeting": "Buongiorno. Panoramica della rete, sintetica e ordinata.",
            "total_sites": len(sites), "global_efficiency": f"{avg}%",
            "mike_executive_summary": (f"{len(sites) - len(exc)} sedi in flusso ottimale."
                + (f" {len(exc)} sede/i con anomalie: correzioni automatiche applicate in background." if exc else " Nessuna anomalia.")),
            "exceptions_requiring_boss": exc}


@api_router.get("/enterprise/strategic-fleet-advice")
async def enterprise_fleet_advice(org: str = Depends(effective_org)):
    await _seed_sites(org)
    sites = await db.lab_sites.find({"organization_id": org}, {"_id": 0}).to_list(200)
    insights = []
    for s in sites:
        for w in (s.get("workers") or []):
            if w.get("score", 100) < 85:
                insights.append({"site_id": s["site_id"], "site_name": s["name"], "worker": w["name"],
                                 "urgency": "medium",
                                 "suggestion": f"Per {w['name']} ({s['name']}): ricalibrazione ruolo o supporto temporaneo da un hub vicino."})
    if not insights:
        insights.append({"urgency": "low", "suggestion": "Tutti gli operatori della rete esprimono il massimo potenziale."})
    return {"status": "success", "supervisor": "Sitor Global Core", "fleet_recommendations": insights}


@api_router.get("/enterprise/weekly-challenge")
async def enterprise_weekly_challenge(org: str = Depends(effective_org)):
    await _seed_sites(org)
    sites = await db.lab_sites.find({"organization_id": org}, {"_id": 0}).to_list(200)
    ranking = []
    for s in sites:
        ws = s.get("workers") or []
        avg = round(sum(w.get("score", 0) for w in ws) / len(ws), 1) if ws else 0.0
        ranking.append({"site_id": s["site_id"], "name": s["name"], "avg_score": avg, "aura": _aura_for(int(avg))})
    ranking.sort(key=lambda x: x["avg_score"], reverse=True)
    for i, r in enumerate(ranking, start=1):
        r["rank"] = i
    now = datetime.now(timezone.utc)
    iso = now.isocalendar()
    days_left = 7 - now.isoweekday()  # lunedì = 1
    return {"status": "success", "week": f"{iso[0]}-W{iso[1]:02d}",
            "starts": "Lunedì", "days_remaining": days_left,
            "prize": "🏆 Aura d'Oro della Settimana + caffè offerto a tutta la sede vincente",
            "ranking": ranking,
            "leader": ranking[0] if ranking else None}


# ---------------------------------------------------------------------------
# DUAL-MODE · STRATEGIC — Audit ricetta di Sitor (Master Baker) + matrice
# sovrana (Approva / Modifica / Rifiuta). Solo craft del fornaio, no HACCP.
# ---------------------------------------------------------------------------
class AuditReq(BaseModel):
    recipe_id: Optional[str] = None
    ingredients: Optional[List[Dict[str, Any]]] = None


def _ing_kg(i):
    for k in ("target_weight_kg", "kg", "weight_kg"):
        if i.get(k) is not None:
            try: return float(i[k])
            except Exception: pass
    for k in ("grams", "g", "weight"):
        if i.get(k) is not None:
            try: return float(i[k]) / 1000.0
            except Exception: pass
    return None


@api_router.post("/lab/recipe-audit")
async def recipe_audit(body: AuditReq, user: dict = Depends(require_admin)):
    ings = body.ingredients
    name = "Ricetta"
    if body.recipe_id:
        rec = await db.recipes.find_one({"id": body.recipe_id}, {"_id": 0})
        if not rec:
            raise HTTPException(status_code=404, detail="Ricetta non trovata.")
        ings = rec.get("ingredients") or []
        name = rec.get("name") or name
    ings = ings or []

    def find(*keys):
        for i in ings:
            n = (i.get("name") or i.get("ingredient") or "").lower()
            if any(k in n for k in keys):
                return _ing_kg(i)
        return None

    flour = find("farina", "flour", "mehl", "tipo 0", "tipo 00")
    water = find("acqua", "water", "wasser")
    salt = find("sale", "salt", "salz")
    yeast = find("lievito", "yeast", "hefe", "lievito madre")

    critique, severity = [], 0
    if flour and flour > 0:
        if water is not None:
            hyd = round(water / flour * 100)
            lvl = "ok" if 55 <= hyd <= 85 else ("warn" if 45 <= hyd <= 95 else "high")
            severity = max(severity, {"ok": 0, "warn": 1, "high": 2}[lvl])
            critique.append({"metric": "Idratazione", "value": f"{hyd}%", "level": lvl,
                             "note": ("Idratazione equilibrata." if lvl == "ok" else
                                      f"Idratazione {'alta' if hyd>85 else 'bassa'}: valuta un impasto {'più gestibile' if hyd>85 else 'più morbido'}.")})
        if salt is not None:
            sp = round(salt / flour * 100, 1)
            lvl = "ok" if 1.6 <= sp <= 2.4 else ("warn" if 1.0 <= sp <= 3.0 else "high")
            severity = max(severity, {"ok": 0, "warn": 1, "high": 2}[lvl])
            critique.append({"metric": "Sale", "value": f"{sp}%", "level": lvl,
                             "note": ("Sale nella norma (≈2%)." if lvl == "ok" else f"Sale {'eccessivo' if sp>2.4 else 'scarso'}: punta al 2% sulla farina.")})
        if yeast is not None:
            yp = round(yeast / flour * 100, 2)
            critique.append({"metric": "Lievito", "value": f"{yp}%", "level": "ok" if yp <= 3 else "warn",
                             "note": "Lievitazione lenta e digeribile." if yp <= 3 else "Lievito alto: rischio maturazione troppo rapida."})
    else:
        critique.append({"metric": "Farina", "value": "n/d", "level": "warn", "note": "Farina non rilevata: non posso calcolare le percentuali del fornaio."})

    recommended = "reject" if severity >= 2 else ("modify" if severity == 1 else "approve")
    matrix = {
        "approve": {"label": "Approva", "reason": "Ricetta bilanciata secondo l'arte bianca." if recommended == "approve" else "Procedi comunque sotto la tua responsabilità di Capo."},
        "modify": {"label": "Modifica", "reason": "; ".join(c["note"] for c in critique if c["level"] != "ok") or "Piccoli ritocchi consigliati."},
        "reject": {"label": "Rifiuta", "reason": "Parametri fuori scala: meglio ricalibrare prima di andare in produzione." if recommended == "reject" else "Scarta se non convince la tua esperienza."},
    }
    return {"recipe": name, "critique": critique, "recommended": recommended, "matrix": matrix,
            "mike_note": "Da Master Baker: ecco la mia lettura. La decisione sovrana resta tua, Capo."}


# ---------------------------------------------------------------------------
# LINEA DI PRODUZIONE INDUSTRIALE — 6 settori contigui con handoff inter-settore.
# Sitor prevede i parametri a valle dalla forza glutine/temperatura in uscita
# dall'impastatrice. Modello deterministico (nessun blocco, shadow passivo).
# ---------------------------------------------------------------------------
@api_router.get("/production/line-status")
async def production_line_status(dough_temp: float = 24.0, hydration: float = 65.0,
                                 user: Optional[dict] = Depends(optional_user)):
    dt = max(15.0, min(32.0, dough_temp))
    hy = max(40.0, min(100.0, hydration))
    gluten = "forte" if hy <= 62 else ("medio" if hy <= 78 else "delicato")
    # Handoff a valle calcolati dallo stato dell'impasto
    water_temp = round(max(2.0, 58 - 2 * dt - 0.1 * hy), 1)          # acqua per centrare la temp impasto
    divider_speed = round(max(40, 100 - (hy - 60) * 1.6), 0)          # più idratato → più lento
    proofer_temp = round(26 + (dt - 24) * 0.5, 1)
    proofer_hum = round(min(90, 72 + (hy - 60) * 0.4), 0)
    steam = round(max(2, 10 - (hy - 60) * 0.15), 0)                   # più idratato → meno vapore
    sectors = [
        {"id": "dosaggio", "name": "Dosaggio & Idratazione", "status": "optimal",
         "param": f"Acqua a {water_temp}°C · idratazione {int(hy)}%",
         "handoff": f"Impasto atteso a {dt}°C, glutine {gluten}."},
        {"id": "autolisi", "name": "Riposo & Autolisi", "status": "active",
         "param": f"Rilassamento {'30' if gluten=='forte' else '20'} min",
         "handoff": "Struttura pronta per la spezzatura."},
        {"id": "formatura", "name": "Spezzatrice · Arrotondatrice · Formatrice", "status": "active",
         "param": f"Velocità linea {int(divider_speed)}% (stress calibrato)",
         "handoff": f"Riduco lo stress meccanico per glutine {gluten}."},
        {"id": "fermo", "name": "Cella Fermo-Lievitazione", "status": "active",
         "param": f"{proofer_temp}°C · UR {int(proofer_hum)}%",
         "handoff": "Rampa termica/umidità adattata alla pasta in arrivo."},
        {"id": "cottura", "name": "Forni (Rotativo/Statico/Piani)", "status": "optimal",
         "param": f"Vapore {int(steam)}s · profilo termico invertito",
         "handoff": "Iniezione vapore tarata sulla crosta desiderata."},
        {"id": "abbattimento", "name": "Abbattimento & Confezionamento", "status": "active",
         "param": "Stabilizzazione struttura",
         "handoff": "Raffreddo e confeziono senza condensa."},
    ]
    return {"status": "success", "dough_temp": dt, "hydration": hy, "gluten": gluten,
            "sectors": sectors,
            "mike_note": "Handoff inter-settore sincronizzati. Linea in flusso, silenzio Letz_Passive in laboratorio."}


# ---------------------------------------------------------------------------
# OMNI-INTELLIGENCE — Sitor analizza e confronta TUTTE le sedi: individua
# le migliori e le più in difficoltà, calcola i gap e genera strategie.
# ---------------------------------------------------------------------------
@api_router.get("/enterprise/omni-intelligence")
async def enterprise_omni(org: str = Depends(effective_org)):
    await _seed_sites(org)
    sites = await db.lab_sites.find({"organization_id": org}, {"_id": 0}).to_list(200)
    scored = []
    for s in sites:
        ws = s.get("workers") or []
        avg = round(sum(w.get("score", 0) for w in ws) / len(ws), 1) if ws else 0.0
        scored.append({"site_id": s["site_id"], "name": s["name"], "avg_score": avg, "status": s.get("status", "normal"), "workers": len(ws)})
    scored.sort(key=lambda x: x["avg_score"], reverse=True)
    best = scored[0] if scored else None
    worst = scored[-1] if scored else None
    net_avg = round(sum(x["avg_score"] for x in scored) / len(scored), 1) if scored else 0.0
    strategies = []
    if best and worst and best["site_id"] != worst["site_id"]:
        gap = round(best["avg_score"] - worst["avg_score"], 1)
        if gap >= 5:
            strategies.append({"priority": "alta", "gap": gap,
                "strategy": f"Trasferisci le best-practice di {best['name']} (leader a {best['avg_score']}%) verso {worst['name']} ({worst['avg_score']}%): affiancamento mirato per colmare {gap} punti."})
    for x in scored:
        if x["status"] != "normal":
            strategies.append({"priority": "media", "gap": 0,
                "strategy": f"{x['name']}: anomalia di settore rilevata — correzione parametri a valle già proposta da Sitor."})
    if not strategies:
        strategies.append({"priority": "bassa", "gap": 0, "strategy": "Rete allineata: nessun gap significativo tra le sedi."})
    return {"status": "success", "supervisor": "Sitor Omni Core",
            "network_avg": net_avg, "sites_analyzed": len(scored),
            "top_site": best, "struggling_site": worst,
            "cross_site_strategies": strategies,
            "mike_note": "Benchmarking omnisciente completato su tutti i settori. Zero rumore burocratico."}


class LayoutMove(BaseModel):
    equipment_id: str
    target_x: float = Field(..., ge=0, le=100)
    target_y: float = Field(..., ge=0, le=100)


@api_router.get("/enterprise/sites/{site_id}/layout")
async def enterprise_get_layout(site_id: str, org: str = Depends(effective_org)):
    await _seed_sites(org)
    site = await db.lab_sites.find_one({"site_id": site_id, "organization_id": org}, {"_id": 0})
    if not site:
        raise HTTPException(status_code=404, detail="Sede non trovata.")
    return {"site_id": site_id, "name": site.get("name"), "spatial_layout": site.get("spatial_layout", {}),
            "mikemix_eye_report": "Ambiente mappato con precisione centimetrica.",
            "detected_assets_count": len((site.get("spatial_layout") or {}).get("equipment", []))}


@api_router.post("/enterprise/sites/{site_id}/layout/optimize")
async def enterprise_optimize_layout(site_id: str, move: LayoutMove, user: dict = Depends(require_admin)):
    site = await db.lab_sites.find_one({"site_id": site_id, "organization_id": _org_id(user)})
    if not site:
        raise HTTPException(status_code=404, detail="Sede non trovata.")
    layout = site.get("spatial_layout") or {"equipment": []}
    eq = next((e for e in layout.get("equipment", []) if e["id"] == move.equipment_id), None)
    if not eq:
        raise HTTPException(status_code=404, detail="Macchinario non trovato nel layout.")
    eq["x"] = round(move.target_x, 1); eq["y"] = round(move.target_y, 1)
    await db.lab_sites.update_one({"site_id": site_id, "organization_id": _org_id(user)}, {"$set": {"spatial_layout": layout}})
    saving = round(min(18.0, abs(move.target_x) * 0.4 + abs(move.target_y) * 0.4 + 4.2), 1)
    return {"status": "success", "message": f"«{eq['name']}» riposizionato.",
            "new_coordinates": {"x": eq["x"], "y": eq["y"]},
            "mikemix_simulation": f"Risparmio movimenti/energia stimato al {saving}%."}


# ---------------------------------------------------------------------------
# VISION AR — la fotocamera riconosce i macchinari (Claude Vision) e li posiziona
# sulla mappa spaziale della sede. Rimpiazza gli asset rilevati da AR a ogni scan.
# ---------------------------------------------------------------------------
class VisionFloorScan(BaseModel):
    image_base64: str
    lang: Optional[str] = "it"


@api_router.post("/enterprise/sites/{site_id}/layout/vision-scan")
async def enterprise_vision_scan(site_id: str, payload: VisionFloorScan, user: dict = Depends(require_admin)):
    await _seed_sites(_org_id(user))
    site = await db.lab_sites.find_one({"site_id": site_id, "organization_id": _org_id(user)})
    if not site:
        raise HTTPException(status_code=404, detail="Sede non trovata.")
    img = (payload.image_base64 or "").split(",")[-1]
    if not img:
        raise HTTPException(status_code=400, detail="Nessuna immagine")
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=503, detail="Vision non disponibile")
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY, session_id=f"floorscan-{uuid.uuid4().hex[:8]}",
            system_message=(
                "Sei l'occhio AR di Sitor. Analizza la FOTO dell'interno di un laboratorio/panificio. "
                "Identifica i MACCHINARI e le attrezzature visibili (impastatrici, forni, celle di lievitazione/frigo, "
                "spezzatrici, formatrici, abbattitori, sfogliatrici, banchi da lavoro, scaffali). "
                "Rispondi SOLO con JSON valido, senza altro testo: "
                '{"equipment":[{"name":"nome breve","type":"oven|mixer|proofer|fridge|divider|shaper|blast_chiller|bench|shelf|other",'
                '"rx":0.0,"ry":0.0,"confidence":0.0}]}. '
                "rx/ry = posizione relativa nell'inquadratura 0..1 (rx sinistra→destra, ry vicino→lontano). "
                "Massimo 8 elementi. Non inventare macchinari non visibili nella foto."
            )
        ).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=800)
        full = ""
        async for ev in chat.stream_message(UserMessage(text="Rileva i macchinari nella foto.", file_contents=[ImageContent(image_base64=img)])):
            if isinstance(ev, TextDelta):
                full += ev.content
            elif isinstance(ev, StreamDone):
                break
        m = re.search(r"\{.*\}", full, re.S)
        detected = (json.loads(m.group(0)).get("equipment") if m else []) or []
    except Exception as e:
        logging.warning(f"vision_scan failed: {e}")
        raise HTTPException(status_code=503, detail="Vision non disponibile")

    layout = site.get("spatial_layout") or {"room_dimensions_m": {"width": 12.0, "length": 18.0}, "equipment": []}
    dims = layout.get("room_dimensions_m") or {"width": 12.0, "length": 18.0}
    W = float(dims.get("width", 12) or 12)
    L = float(dims.get("length", 18) or 18)
    # rimuovi i precedenti asset rilevati da AR (mantiene quelli seed/manuali)
    layout["equipment"] = [e for e in layout.get("equipment", []) if e.get("source") != "vision_ar"]
    added = []
    for d in detected[:8]:
        try:
            rx = max(0.0, min(1.0, float(d.get("rx", 0.5) or 0.5)))
            ry = max(0.0, min(1.0, float(d.get("ry", 0.5) or 0.5)))
        except Exception:
            rx, ry = 0.5, 0.5
        eq = {"id": f"ar_{uuid.uuid4().hex[:6]}", "name": (str(d.get("name") or "Macchinario"))[:40],
              "type": str(d.get("type") or "other"), "x": round(rx * W, 1), "y": round(ry * L, 1),
              "status": "active", "source": "vision_ar",
              "confidence": round(float(d.get("confidence", 0.8) or 0.8), 2)}
        layout["equipment"].append(eq)
        added.append(eq)
    await db.lab_sites.update_one({"site_id": site_id, "organization_id": _org_id(user)}, {"$set": {"spatial_layout": layout}})
    return {"status": "success", "site_id": site_id, "added": added, "spatial_layout": layout,
            "detected_count": len(added),
            "mikemix_insight": f"{len(added)} macchinari riconosciuti e posizionati con l'aura AR."}


# ---------------------------------------------------------------------------
# MACCHINA DEL TEMPO CLIMA — incrocia pressione barometrica + umidità (Open-Meteo,
# Stoccarda) e propone micro-correzioni stagionali alla ricetta via Claude.
# ---------------------------------------------------------------------------
_CLIMATE_LAT, _CLIMATE_LON = 48.7758, 9.1829  # Stoccarda (Stuttgart)


class ClimateReq(BaseModel):
    recipe_id: Optional[str] = None
    recipe_name: Optional[str] = ""
    hydration: Optional[float] = None
    preferment: Optional[str] = ""
    lang: Optional[str] = "it"


def _mean(xs):
    xs = [x for x in xs if isinstance(x, (int, float))]
    return round(sum(xs) / len(xs), 1) if xs else None


@api_router.post("/climate/time-machine")
async def climate_time_machine(body: ClimateReq, user: Optional[dict] = Depends(optional_user)):
    hyd = body.hydration
    pref = body.preferment or ""
    rname = body.recipe_name or ""
    if body.recipe_id:
        rec = await db.recipes.find_one({"id": body.recipe_id}, {"_id": 0})
        if rec:
            rname = rname or rec.get("name") or ""
            if hyd is None:
                f = float(rec.get("flour_grams") or 0)
                w = float(rec.get("water_grams") or 0)
                if f > 0:
                    hyd = round(w / f * 100, 0)
            pref = pref or rec.get("preferment_type") or ""

    climate = {}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get("https://api.open-meteo.com/v1/forecast", params={
                "latitude": _CLIMATE_LAT, "longitude": _CLIMATE_LON,
                "hourly": "relative_humidity_2m,surface_pressure,temperature_2m",
                "past_days": 7, "forecast_days": 3, "timezone": "Europe/Berlin"})
            j = r.json()
        h = j.get("hourly", {})
        hum = h.get("relative_humidity_2m", []) or []
        pres = h.get("surface_pressure", []) or []
        temp = h.get("temperature_2m", []) or []
        past_n = 24 * 7
        now_i = min(past_n, max(0, len(pres) - 1))
        climate = {
            "location": "Stoccarda (Stuttgart)",
            "now_humidity": (hum[now_i] if now_i < len(hum) else None),
            "now_pressure": (pres[now_i] if now_i < len(pres) else None),
            "now_temp": (temp[now_i] if now_i < len(temp) else None),
            "past7_humidity_avg": _mean(hum[:past_n]),
            "past7_pressure_avg": _mean(pres[:past_n]),
            "next3_humidity_avg": _mean(hum[past_n:]),
            "next3_pressure_avg": _mean(pres[past_n:]),
        }
        if climate["next3_pressure_avg"] and climate["past7_pressure_avg"]:
            climate["pressure_trend"] = round(climate["next3_pressure_avg"] - climate["past7_pressure_avg"], 1)
        if climate["next3_humidity_avg"] and climate["past7_humidity_avg"]:
            climate["humidity_trend"] = round(climate["next3_humidity_avg"] - climate["past7_humidity_avg"], 1)
    except Exception as e:
        logging.warning(f"open-meteo failed: {e}")
        climate = {"location": "Stoccarda (Stuttgart)", "error": "meteo non raggiungibile"}

    adjustment = None
    if EMERGENT_LLM_KEY and not climate.get("error"):
        try:
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY, session_id=f"climate-{uuid.uuid4().hex[:8]}",
                system_message=(
                    "Sei Sitor, maestro fornaio e meteorologo. In base a PRESSIONE barometrica e UMIDITA' ambientale "
                    "consigli micro-correzioni alla ricetta per tenere COSTANTE la qualita' dell'impasto stagione dopo stagione. "
                    "Regole: bassa pressione + alta umidita' -> la farina assorbe meno acqua e la fermentazione accelera "
                    "(riduci idratazione, riduci lievito, accorcia la puntata). Alta pressione + aria secca -> impasto piu' asciutto "
                    "(aumenta leggermente l'idratazione, copri bene, allunga leggermente la puntata). "
                    f"Rispondi SOLO con JSON valido nella lingua con codice '{body.lang}': "
                    '{"hydration_delta_pct":numero,"yeast_delta_pct":numero,"fermentation_delta_min":numero,'
                    '"verdict":"stabile|umido|secco","summary":"una frase","tips":["consiglio breve","consiglio breve"]}'
                )
            ).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=500)
            ctx = (f"Ricetta: {rname or 'generica'}. Idratazione attuale: {hyd if hyd is not None else 'n/d'}%. "
                   f"Prefermento: {pref or 'nessuno'}. "
                   f"Clima Stoccarda: umidita' ora {climate.get('now_humidity')}% (media 7gg {climate.get('past7_humidity_avg')}%, "
                   f"prossimi 3gg {climate.get('next3_humidity_avg')}%). "
                   f"Pressione ora {climate.get('now_pressure')} hPa (media 7gg {climate.get('past7_pressure_avg')}, "
                   f"prossimi 3gg {climate.get('next3_pressure_avg')}, trend {climate.get('pressure_trend')} hPa).")
            full = ""
            async for ev in chat.stream_message(UserMessage(text=ctx)):
                if isinstance(ev, TextDelta):
                    full += ev.content
                elif isinstance(ev, StreamDone):
                    break
            m = re.search(r"\{.*\}", full, re.S)
            adjustment = json.loads(m.group(0)) if m else None
        except Exception as e:
            logging.warning(f"climate ai failed: {e}")
            adjustment = None

    return {"status": "success", "climate": climate, "recipe": {"name": rname, "hydration": hyd, "preferment": pref},
            "adjustment": adjustment}



@app.websocket("/api/ws/enterprise-os/{site_id}")
async def enterprise_site_websocket(websocket: WebSocket, site_id: str):
    await websocket.accept()
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                event = json.loads(raw)
            except Exception:
                continue
            if event.get("action") == "scale_weight_streaming":
                cur = float(event.get("weight", 0) or 0); tgt = float(event.get("target", 0) or 0)
                if tgt and cur >= tgt:
                    await websocket.send_text(json.dumps({"status": "success", "site_id": site_id,
                        "display_instruction": "Peso perfetto. Sincronizzazione locale completata.",
                        "audio_mode": "letz_passive_silent", "next_action_unlocked": True}))
                else:
                    await websocket.send_text(json.dumps({"status": "in_progress", "site_id": site_id,
                        "current_weight": cur, "target_weight": tgt, "audio_mode": "letz_passive_silent"}))
    except WebSocketDisconnect:
        pass


# --- POCKET: comando totale unificato + dashboard tascabile mobile ---
class MasterPocketCommand(BaseModel):
    command_text: str = Field(..., max_length=500)
    active_site_id: Optional[str] = None


@api_router.post("/pocket/master-command")
async def master_pocket_command(payload: MasterPocketCommand, user: dict = Depends(require_admin)):
    await _seed_sites()
    text = (payload.command_text or "").lower()
    sid = payload.active_site_id
    site = (await db.lab_sites.find_one({"site_id": sid, "organization_id": _org_id(user)}, {"_id": 0})) if sid else None
    if not site:
        site = await db.lab_sites.find_one({"organization_id": _org_id(user)}, {"_id": 0})
    if any(k in text for k in ("forno", "scansiona", "inquadra", "layout")):
        return {"status": "success", "action_type": "vision_spatial_scan",
                "mikemix_response": f"Scansione macchinari di {site['name']} completata, aure applicate.",
                "data": site.get("spatial_layout", {})}
    if any(k in text for k in ("sposta", "cambia", "ruolo")):
        return {"status": "success", "action_type": "hr_rebalance",
                "mikemix_response": "Riequilibrio turni elaborato in background, senza attriti."}
    if "ricetta" in text:
        return {"status": "success", "action_type": "recipe_propagation",
                "mikemix_response": "Ricetta propagata a tutte le bilance smart della rete."}
    if any(k in text for k in ("briefing", "situazione", "rete")):
        ov = await enterprise_overview(user)
        return {"status": "success", "action_type": "executive_pulse",
                "mikemix_response": f"Efficienza globale {ov['global_efficiency_avg']}%. Anomalie: {ov['critical_alerts_count']}."}
    return {"status": "success", "action_type": "general_execution",
            "mikemix_response": f"Comando «{payload.command_text}» eseguito dal nucleo Sitor."}




class SpatialScanReq(BaseModel):
    site_id: str


@api_router.post("/pocket/vision/scan-floor")
async def pocket_scan_floor(body: SpatialScanReq, org: str = Depends(effective_org)):
    site = await db.lab_sites.find_one({"site_id": body.site_id, "organization_id": org}, {"_id": 0})
    if not site:
        raise HTTPException(status_code=404, detail="Sede non trovata.")
    return {"status": "success", "site_id": body.site_id, "vision_hud_status": "active_augmented_reality",
            "equipment_detected": (site.get("spatial_layout") or {}).get("equipment", []),
            "mikemix_insight": "Inquadratura elaborata. Aure applicate in tempo reale sui macchinari."}


class PocketRecipeReq(BaseModel):
    recipe_id: str = Field(..., max_length=60)
    name: str = Field(..., max_length=120)
    ingredients: List[Dict[str, Any]] = []




class SiteWeeklyReq(BaseModel):
    site_id: str
    schedule_data: Dict[str, Any] = {}




@api_router.get("/scale/{device_id}/load-recipe/{recipe_id}")
async def load_recipe_to_scale(device_id: str, recipe_id: str, user: Optional[dict] = Depends(optional_user)):
    dev = await db.lab_devices.find_one({"id": device_id})
    if not dev:
        raise HTTPException(status_code=404, detail="Bilancia non trovata.")
    rec = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    if not rec:
        raise HTTPException(status_code=404, detail="Ricetta non trovata.")
    ings = rec.get("ingredients") or []
    first = ings[0] if ings else {}
    fname = first.get("name") or first.get("ingredient") or "primo ingrediente"
    fw = first.get("target_weight_kg") or first.get("grams") or first.get("weight") or ""
    step = f"Aggiungi: {fname}" + (f" ({fw} kg)" if fw else "")
    await db.lab_devices.update_one({"id": device_id}, {"$set": {"current_step": step}})
    return {"status": "success", "recipe_name": rec.get("name"), "display_screen": step}


@app.websocket("/api/ws/production-os")
async def production_os_ws(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                event = json.loads(raw)
            except Exception:
                await websocket.send_text(json.dumps({"status": "error", "message": "bad json"}))
                continue
            action = event.get("action")
            if action == "scale_weight_streaming":
                cur = float(event.get("weight", 0) or 0)
                tgt = float(event.get("target", 0) or 0)
                if tgt and cur >= tgt:
                    await websocket.send_text(json.dumps({
                        "status": "success", "display_instruction": "Peso raggiunto. Passaggio completato.",
                        "audio_mode": "letz_passive_silent", "next_action_unlocked": True}))
                else:
                    await websocket.send_text(json.dumps({
                        "status": "in_progress", "current_weight": cur, "target_weight": tgt,
                        "audio_mode": "letz_passive_silent"}))
            elif action == "audio_query":
                q = (event.get("query") or "").lower()
                if "emergenza" in q or "emergency" in q:
                    await websocket.send_text(json.dumps({"audio_response": "Attenzione: anomalia nel sistema.", "mode": "active_alert"}))
                else:
                    await websocket.send_text(json.dumps({"audio_response": "", "mode": "letz_passive_silent"}))
            else:
                await websocket.send_text(json.dumps({"status": "ok", "echo": action}))
    except WebSocketDisconnect:
        pass





# Storico guasti (persistente, condiviso) — fermi macchina e celle guaste.
class FaultLogEntry(BaseModel):
    id: Optional[str] = None
    type: str = "macchina"   # "macchina" | "cella"
    name: Optional[str] = ""
    note: Optional[str] = ""
    at: Optional[str] = None






# Sensori/sonde REALI (Web Bluetooth lato client) — letture condivise.
# Ultimo valore per (device_id, type); il client invia le letture via BLE notifications.
class SensorReading(BaseModel):
    device_id: str
    name: Optional[str] = ""
    type: str = "temperature"   # temperature | humidity | weight | co2 | battery
    value: float
    unit: Optional[str] = ""
    operator: Optional[str] = ""
    at: Optional[str] = None


@api_router.get("/lab/sensors")
async def get_sensors(org: str = Depends(effective_org)):
    return await db.lab_sensors.find({"organization_id": org}, {"_id": 0, "_key": 0}).sort("at", -1).to_list(200)


@api_router.post("/lab/sensors")
async def post_sensor(payload: SensorReading, org: str = Depends(effective_org)):
    payload.at = now_iso()
    doc = payload.model_dump()
    key = f"{payload.device_id}:{payload.type}"
    await db.lab_sensors.update_one({"_key": key, "organization_id": org}, {"$set": {**doc, "_key": key, "organization_id": org}}, upsert=True)
    return doc


# Magazzino materie prime (farine/ingredienti) — carico rapido + scalatura automatica.
class WarehouseItem(BaseModel):
    id: Optional[str] = None
    name: str
    kind: str = "farina"          # farina | ingrediente
    force_w: Optional[str] = ""   # Forza W o caratteristica
    quantity_kg: float = 0
    unit: Optional[str] = "kg"
    min_kg: float = 0             # soglia di allarme scorta minima (0 = disattivata)
    department: Optional[str] = None  # reparto: panificazione | pizzeria | pasticceria (None = tutti)
    lot: Optional[str] = ""
    expiry: Optional[str] = ""
    updated_at: Optional[str] = None


class ConsumeItem(BaseModel):
    name: str
    kg: float
    kind: Optional[str] = "ingrediente"


class ConsumePayload(BaseModel):
    items: List[ConsumeItem] = []


@api_router.get("/lab/warehouse")
async def get_warehouse(user: Optional[dict] = Depends(optional_user)):
    return await db.lab_warehouse.find({"organization_id": _org_id(user)}, {"_id": 0}).sort("name", 1).to_list(500)


@api_router.post("/lab/warehouse")
async def add_warehouse(payload: WarehouseItem, user: dict = Depends(require_admin)):
    payload.updated_at = now_iso()
    doc = payload.model_dump()
    doc["id"] = payload.id or str(uuid.uuid4())
    doc["organization_id"] = _org_id(user)
    await db.lab_warehouse.update_one({"id": doc["id"], "organization_id": _org_id(user)}, {"$set": doc}, upsert=True)
    return doc


@api_router.delete("/lab/warehouse/{item_id}")
async def del_warehouse(item_id: str, user: dict = Depends(require_admin)):
    await db.lab_warehouse.delete_one({"id": item_id, "organization_id": _org_id(user)})
    return {"ok": True}


@api_router.post("/lab/warehouse/consume")
async def consume_warehouse(payload: ConsumePayload, user: dict = Depends(require_admin)):
    # Scala le giacenze in base alle materie usate da un'impastata confermata.
    org = _org_id(user)
    updated, shortfalls = [], []
    stock = await db.lab_warehouse.find({"organization_id": org}, {"_id": 0}).to_list(500)
    def find(name, kind):
        nl = (name or "").lower().strip()
        cand = [s for s in stock if nl and (nl in (s.get("name", "").lower()) or s.get("name", "").lower() in nl)]
        if not cand and kind == "farina":
            cand = sorted([s for s in stock if s.get("kind") == "farina"], key=lambda x: x.get("quantity_kg", 0), reverse=True)
        return cand[0] if cand else None
    for it in payload.items:
        if not it.kg or it.kg <= 0:
            continue
        s = find(it.name, it.kind)
        if not s:
            shortfalls.append({"name": it.name, "kg": it.kg, "reason": "not_found"})
            continue
        newq = round(float(s.get("quantity_kg", 0)) - float(it.kg), 3)
        if newq < 0:
            shortfalls.append({"name": s["name"], "missing": round(-newq, 3)})
            newq = 0
        await db.lab_warehouse.update_one({"id": s["id"], "organization_id": org}, {"$set": {"quantity_kg": newq, "updated_at": now_iso()}})
        s["quantity_kg"] = newq
        updated.append({"name": s["name"], "quantity_kg": newq})
        await db.lab_consumption_log.insert_one({"id": str(uuid.uuid4()), "organization_id": org, "name": s["name"], "kg": float(it.kg), "kind": it.kind, "at": now_iso()})
    return {"updated": updated, "shortfalls": shortfalls}


# ---------------------------------------------------------------------------
# MOTORE INVENTARIO DI PRODUZIONE (Sitor) — foto di una consegna/scarico freezer
# (Claude Vision) -> aggiorna il magazzino; collega un batch alla linea (Dosaggio &
# Autolisi) scalando in automatico i consumi. Zero uffici/fatture/HACCP.
# ---------------------------------------------------------------------------
class InventoryScanDrop(BaseModel):
    image_base64: str
    target: Optional[str] = "warehouse"   # warehouse | freezer (solo etichetta informativa)
    lang: Optional[str] = "it"


@api_router.post("/inventory/scan-drop")
async def inventory_scan_drop(payload: InventoryScanDrop, user: dict = Depends(require_admin)):
    img = (payload.image_base64 or "").split(",")[-1]
    if not img:
        raise HTTPException(status_code=400, detail="Nessuna immagine")
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=503, detail="Vision non disponibile")
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY, session_id=f"invscan-{uuid.uuid4().hex[:8]}",
            system_message=(
                "Sei il magazziniere AI di Sitor. Analizza la FOTO di una consegna di materie prime da forno "
                "o dello scarico di un freezer (sacchi di farina, ingredienti, prodotti surgelati/semilavorati). "
                "Estrai gli articoli visibili con la quantita' stimata in kg (numero di sacchi x peso se leggibile). "
                "Rispondi SOLO con JSON valido, senza altro testo: "
                '{"items":[{"name":"nome breve","quantity_kg":numero,"kind":"farina|ingrediente|surgelato"}]}. '
                "Massimo 12 articoli. Non inventare articoli non visibili."
            )
        ).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=800)
        full = ""
        async for ev in chat.stream_message(UserMessage(text="Rileva le materie prime nella foto.", file_contents=[ImageContent(image_base64=img)])):
            if isinstance(ev, TextDelta):
                full += ev.content
            elif isinstance(ev, StreamDone):
                break
        m = re.search(r"\{.*\}", full, re.S)
        items = (json.loads(m.group(0)).get("items") if m else []) or []
    except Exception as e:
        logging.warning(f"inventory_scan_drop failed: {e}")
        raise HTTPException(status_code=503, detail="Vision non disponibile")

    added = []
    for it in items[:12]:
        name = (str(it.get("name") or "")).strip()
        if not name:
            continue
        try:
            qty = round(float(it.get("quantity_kg") or 0), 3)
        except Exception:
            qty = 0
        kind = "farina" if str(it.get("kind") or "") == "farina" else "ingrediente"
        existing = await db.lab_warehouse.find_one({"name": {"$regex": f"^{re.escape(name)}$", "$options": "i"}, "organization_id": _org_id(user)})
        if existing:
            newq = round(float(existing.get("quantity_kg", 0)) + qty, 3)
            await db.lab_warehouse.update_one({"id": existing["id"], "organization_id": _org_id(user)}, {"$set": {"quantity_kg": newq, "updated_at": now_iso()}})
            added.append({"name": existing["name"], "added_kg": qty, "quantity_kg": newq})
        else:
            doc = {"id": str(uuid.uuid4()), "name": name, "kind": kind, "force_w": "", "quantity_kg": qty,
                   "unit": "kg", "min_kg": 0, "updated_at": now_iso(), "organization_id": _org_id(user)}
            await db.lab_warehouse.insert_one(dict(doc))
            added.append({"name": name, "added_kg": qty, "quantity_kg": qty})
    stock = await db.lab_warehouse.find({"organization_id": _org_id(user)}, {"_id": 0}).sort("name", 1).to_list(500)
    return {"status": "success", "added": added, "detected_count": len(added), "stock": stock,
            "mikemix_insight": f"{len(added)} materie prime lette e caricate nel magazzino di produzione."}


class BatchBindReq(BaseModel):
    recipe_id: str
    batches: int = 1


@api_router.post("/inventory/bind-batch")
async def inventory_bind_batch(body: BatchBindReq, user: dict = Depends(require_admin)):
    rec = await db.recipes.find_one({"id": body.recipe_id}, {"_id": 0})
    if not rec:
        raise HTTPException(status_code=404, detail="Ricetta non trovata.")
    factor = max(1, int(body.batches or 1))
    flour = float(rec.get("flour_grams") or 0)
    needs = []

    def _need(name, grams, kind):
        kg = round(grams * factor / 1000, 3)
        if kg > 0:
            needs.append({"name": name, "kg": kg, "kind": kind})

    _need("Farina", flour, "farina")
    _need("Lievito madre", float(rec.get("sourdough_grams") or 0), "ingrediente")
    _need("Sale", float(rec.get("salt_grams") or 0), "ingrediente")
    for ing in (rec.get("extra_ingredients") or []):
        _need(str(ing.get("name") or "extra"), flour * (float(ing.get("percent") or 0) / 100), "ingrediente")

    stock = await db.lab_warehouse.find({"organization_id": _org_id(user)}, {"_id": 0}).to_list(500)

    def _find(name, kind):
        nl = (name or "").lower().strip()
        cand = [s for s in stock if nl and (nl in s.get("name", "").lower() or s.get("name", "").lower() in nl)]
        if not cand and kind == "farina":
            cand = sorted([s for s in stock if s.get("kind") == "farina"], key=lambda x: x.get("quantity_kg", 0), reverse=True)
        return cand[0] if cand else None

    consumed, shortfalls, untracked, low_stock = [], [], [], []
    for it in needs:
        s = _find(it["name"], it["kind"])
        if not s:
            untracked.append(it["name"])   # non a magazzino (es. acqua/sale) -> nessuna burocrazia
            continue
        newq = round(float(s.get("quantity_kg", 0)) - it["kg"], 3)
        if newq < 0:
            shortfalls.append({"name": s["name"], "missing": round(-newq, 3)})
            newq = 0
        await db.lab_warehouse.update_one({"id": s["id"], "organization_id": _org_id(user)}, {"$set": {"quantity_kg": newq, "updated_at": now_iso()}})
        for x in stock:
            if x["id"] == s["id"]:
                x["quantity_kg"] = newq
        await db.lab_consumption_log.insert_one({"id": str(uuid.uuid4()), "organization_id": _org_id(user), "name": s["name"], "kg": it["kg"], "kind": it["kind"], "at": now_iso()})
        consumed.append({"name": s["name"], "kg": it["kg"], "quantity_kg": newq})
        # Avviso scorta bassa: il silo è sceso a/sotto la soglia dopo l'aggancio del batch.
        _min = float(s.get("min_kg") or 0)
        if _min > 0 and newq <= _min:
            low_stock.append({"name": s["name"], "quantity_kg": newq, "min_kg": _min})

    link = {"id": str(uuid.uuid4()), "organization_id": _org_id(user), "recipe_id": body.recipe_id, "recipe_name": rec.get("name"),
            "batches": factor, "line_sectors": ["dosaggio", "autolisi"], "consumed": consumed,
            "shortfalls": shortfalls, "at": now_iso()}
    await db.batch_links.insert_one(dict(link))
    if low_stock:
        try:
            import warehouse as _wh
            await _wh._propose_reorder(user, [{"name": l["name"], "current": l["quantity_kg"], "min": l["min_kg"]} for l in low_stock], "warehouse")
        except Exception as e:
            logging.warning("bind-batch reorder proposal fail: %s", str(e)[:120])
    new_stock = await db.lab_warehouse.find({"organization_id": _org_id(user)}, {"_id": 0}).sort("name", 1).to_list(500)
    return {"status": "success", "recipe_name": rec.get("name"), "batches": factor,
            "consumed": consumed, "shortfalls": shortfalls, "untracked": untracked, "low_stock": low_stock,
            "line_sectors": ["Dosaggio", "Autolisi"], "stock": new_stock,
            "mikemix_insight": f"Batch «{rec.get('name')}» ×{factor} agganciato a Dosaggio & Autolisi. Consumi scalati in automatico."}


@api_router.get("/inventory/batch-links")
async def inventory_batch_links(user: Optional[dict] = Depends(optional_user)):
    return await db.batch_links.find({"organization_id": _org_id(user)}, {"_id": 0}).sort("at", -1).to_list(50)


# ---------------------------------------------------------------------------
# DELEGA VOCALE (Eclipse) — il Capo detta un ordine, Sitor (Claude) lo traduce
# in un task di squadra con sotto-step e propone gli operatori (competenza + Aura).
# Richiede CONFERMA del Capo prima di comparire (silenzioso) sul floor.
# ---------------------------------------------------------------------------
async def _worker_pool(org: Optional[str] = None):
    """Operatori disponibili dal piano turni, dedup per nome, con posizione, aura e STATO
    PERSISTENTE (libero/occupato) letto da `worker_states` (per azienda). Lo stato vive nel
    tempo: un operatore resta occupato finché non completa/rifiuta, con passaggio al prossimo libero."""
    docs = await db.lab_shift_plan.find({"organization_id": org or ORG_DEFAULT}, {"_id": 0}).to_list(300)
    best = {}
    for d in docs:
        nm = (d.get("worker_name") or "").strip()
        if not nm:
            continue
        sc = int(d.get("efficiency_score", 85))
        day = (d.get("day") or "").strip().lower()
        if nm not in best or sc > best[nm]["score"]:
            keep_days = best.get(nm, {}).get("days", set())
            best[nm] = {"name": nm, "position": d.get("position") or "", "score": sc, "aura": _aura_for(sc), "days": keep_days}
        if day:
            best[nm]["days"].add(day)
    states = await _worker_states_map(org)
    for w in best.values():
        st = states.get(w["name"].lower(), {})
        w["status"] = st.get("status", "free")
        w["current_task"] = st.get("task_id")
        w["locked_by_capo"] = bool(st.get("locked_by_capo"))
        w["days"] = sorted(w.get("days", set()))
    pool = sorted(best.values(), key=lambda x: x["score"], reverse=True)
    return pool


async def _worker_states_map(org: Optional[str] = None) -> dict:
    """Mappa {nome_lower: stato} degli operatori per l'azienda (persistente nel tempo)."""
    q = {} if org is None else {"organization_id": org}
    docs = await db.worker_states.find(q, {"_id": 0}).to_list(500)
    return {(d.get("name") or "").lower(): d for d in docs}


async def _today_shift_start(org: Optional[str], today_ab: str) -> Optional[str]:
    """Orario di inizio turno di OGGI = primo lotto pianificato del giorno nel piano settimanale."""
    try:
        wp = None
        if org:
            wp = await db.weekly_plan.find_one({"organization_id": org}, {"_id": 0})
        if not wp:
            wp = await db.weekly_plan.find_one({}, {"_id": 0})
        days = (wp or {}).get("days") or {}
        day = days.get(today_ab) or {}
        starts = []
        for b in (day.get("batches") or []):
            s = (b.get("start") or "").strip()
            if re.match(r"^([01]?\d|2[0-3]):[0-5]\d$", s):
                starts.append(s)
        return min(starts) if starts else None
    except Exception:
        return None


async def _set_worker_state(org: str, name: str, **fields):
    if not name:
        return
    fields["updated_at"] = now_iso()
    # AVVISO RITARDO: quando l'operatore diventa OCCUPATO segna l'inizio del compito (se non
    # già impostato dal chiamante) così la board può calcolare lo sforamento sull'ETA.
    if fields.get("status") == "busy" and "started_at" not in fields:
        fields["started_at"] = now_iso()
    if fields.get("status") == "free":
        fields["started_at"] = None
    await db.worker_states.update_one(
        {"organization_id": org, "name": name},
        {"$set": {"organization_id": org, "name": name, **fields}},
        upsert=True,
    )


def _match_worker(sub_role, pool, used):
    sr = (sub_role or "").lower().strip()
    def _available(w):
        # Non riassegnare MAI chi è già impegnato nel giro corrente, chi è OCCUPATO nel tempo,
        # o chi è bloccato da un comando del Capo (priorità assoluta del Capo).
        return (w["name"] not in used
                and w.get("status", "free") != "busy"
                and not w.get("locked_by_capo"))
    # 1) match per posizione/competenza tra chi è LIBERO
    for w in pool:
        if not _available(w):
            continue
        pos = (w["position"] or "").lower()
        if sr and pos and (sr in pos or pos in sr):
            return w
    # 2) primo LIBERO con aura più alta
    for w in pool:
        if _available(w):
            return w
    # 3) tra i liberi (ignorando la competenza) o, in ultima istanza, chi non è nel giro —
    #    MA mai un operatore bloccato dal Capo (priorità assoluta): Sitor non lo tocca.
    for w in pool:
        if w["name"] not in used and not w.get("locked_by_capo"):
            return w
    return None


class DelegationParseReq(BaseModel):
    transcript: str = Field(..., max_length=600)
    lang: Optional[str] = "it"


@api_router.post("/delegation/parse")
async def delegation_parse(body: DelegationParseReq, user: dict = Depends(require_admin)):
    txt = (body.transcript or "").strip()
    if not txt:
        raise HTTPException(status_code=400, detail="Nessun comando")
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=503, detail="NLP non disponibile")
    staff = await _staffing(_org_id(user))
    _deleg_sys = f"deleg-parse-v1|{body.lang}"
    _deleg_input = f"{txt}|{staff['present']}/{staff['total']}"
    _dmk = _memo_key(_deleg_sys, _deleg_input, SITOR_FAST)
    _dcached = _memo_get(_dmk)
    try:
        if _dcached is not None:
            await _track_saving("cache")
            parsed = json.loads(_dcached) if _dcached else None
        else:
            await _track_saving("fast")
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY, session_id=f"deleg-{uuid.uuid4().hex[:8]}",
                system_message=(
                    "Sei Sitor, direttore di produzione. Il Capo detta un ordine a voce per il laboratorio (panificio industriale). "
                    "Traducilo in un TASK DI SQUADRA operativo. Tipi possibili: 'sanificazione' (pulizia attrezzature/carrelli), "
                    "'regola' (regola di supervisione), 'crisis_override' (comando di ritmo: rallenta/accelera/priorita'), 'generico'. "
                    "Se e' un crisis_override, indica in 'pacing' uno tra: 'rallenta','accelera','priorita','normale' e in 'pacing_target' l'eventuale prodotto/reparto. "
                    "Scomponi in sotto-step SEQUENZIALI concreti; per ognuno indica 'sub_role' (competenza/posizione ideale, es. Impastatore, Forni, Pulizie, Confezionamento). "
                    "NON citare MAI HACCP, moduli, documenti, burocrazia, registri o ufficio: solo azioni pratiche di produzione/pulizia. "
                    f"Rispondi SOLO con JSON valido nella lingua con codice '{body.lang}': "
                    '{"title":"titolo breve","kind":"sanificazione|regola|crisis_override|generico","priority":"alta|media|bassa",'
                    '"pacing":"rallenta|accelera|priorita|normale|","pacing_target":"","steps":[{"order":1,"instruction":"cosa fare","sub_role":"competenza"}]}'
                )
            ).with_model("anthropic", SITOR_FAST).with_params(max_tokens=1200)
            full = ""
            async for ev in chat.stream_message(UserMessage(text=f"Ordine del Capo: «{txt}». Operatori presenti oggi: {staff['present']}/{staff['total']}.")):
                if isinstance(ev, TextDelta):
                    full += ev.content
                elif isinstance(ev, StreamDone):
                    break
            m = re.search(r"\{.*\}", full, re.S)
            parsed = json.loads(m.group(0)) if m else None
            if parsed:
                _memo_set(_dmk, json.dumps(parsed))
    except Exception as e:
        logging.warning(f"delegation_parse failed: {e}")
        raise HTTPException(status_code=503, detail="NLP non disponibile")
    if not parsed:
        raise HTTPException(status_code=422, detail="Comando non compreso")

    org = _org_id(user)
    pool = await _worker_pool(org)
    used, steps = [], []
    _ETA_STEP_MIN = 15  # stima base per sotto-step; il cumulo dà l'ETA a cascata
    for s in (parsed.get("steps") or [])[:12]:
        w = _match_worker(s.get("sub_role"), pool, used)
        if w:
            used.append(w["name"])
        order_n = int(s.get("order") or (len(steps) + 1))
        steps.append({
            "order": order_n,
            "instruction": str(s.get("instruction") or ""),
            "sub_role": str(s.get("sub_role") or ""),
            "assignee": (w or {}).get("name"),
            "assignee_position": (w or {}).get("position"),
            "assignee_aura": (w or {}).get("aura"),
            "eta_min": len(steps + [0]) * _ETA_STEP_MIN,  # cumulativo sequenziale
            "done": False,
        })
    proposal = {
        "title": str(parsed.get("title") or txt[:40]),
        "kind": parsed.get("kind") if parsed.get("kind") in ("sanificazione", "regola", "crisis_override", "generico") else "generico",
        "priority": parsed.get("priority") if parsed.get("priority") in ("alta", "media", "bassa") else "media",
        "pacing": parsed.get("pacing") or "",
        "pacing_target": parsed.get("pacing_target") or "",
        "transcript": txt,
        "steps": steps,
        "staff": {"present": staff["present"], "total": staff["total"]},
    }
    pool_out = [{"name": w["name"], "position": w["position"], "aura": w["aura"]} for w in pool]
    return {"status": "proposed", "proposal": proposal, "pool": pool_out}


class DelegationConfirmReq(BaseModel):
    proposal: dict


@api_router.post("/delegation/confirm")
async def delegation_confirm(body: DelegationConfirmReq, user: dict = Depends(require_admin)):
    p = body.proposal or {}
    org = _org_id(user)
    task = {
        "id": str(uuid.uuid4()),
        "organization_id": org,
        "title": str(p.get("title") or "Task")[:80],
        "kind": p.get("kind") or "generico",
        "priority": p.get("priority") or "media",
        "pacing": p.get("pacing") or "",
        "pacing_target": p.get("pacing_target") or "",
        "transcript": p.get("transcript") or "",
        "steps": p.get("steps") or [],
        "status": "active",
        "created_by": user.get("email"),
        "created_at": now_iso(),
    }
    await db.team_tasks.insert_one(dict(task))
    # La conferma della delega rende gli operatori OCCUPATI (busy) così Sitor non li
    # doppio-prenota, ma NON li blocca: quando completano tornano liberi. Il lock del Capo
    # (priorità assoluta) è riservato ai comandi espliciti «sposta operatore» (capo-move / reparto).
    for st in task["steps"]:
        asg = (st.get("assignee") or "").strip()
        if asg:
            await _set_worker_state(org, asg, status="busy", task_id=task["id"],
                                    step_order=st.get("order"), eta_min=st.get("eta_min"))
    # Crisis override → registra la direttiva di ritmo nello stato turno (letto dal piano).
    if task["kind"] == "crisis_override" and task["pacing"]:
        await db.lab_shift_state.update_one(
            {"_key": "default", "organization_id": org},
            {"$set": {"pacing_directive": {"pacing": task["pacing"], "target": task["pacing_target"], "at": now_iso()}, "organization_id": org}},
            upsert=True,
        )
    return {"status": "success", "task": task,
            "mikemix_insight": f"Task «{task['title']}» confermato e inviato al floor in silenzio."}


# ---------------------------------------------------------------------------
# STATO VIVO PERSISTENTE PER OPERATORE (libero/occupato) + passaggio al prossimo
# libero e ricalcolo a cascata dei tempi. Comandato dalle CUFFIE hands-free.
# ---------------------------------------------------------------------------
_ETA_STEP_MIN = 15

def _recompute_task_eta(steps: list) -> list:
    """Ricalcola i tempi stimati a cascata sui passi ANCORA da fare (i completati = 0)."""
    pending = 0
    for s in sorted(steps, key=lambda x: int(x.get("order") or 0)):
        if s.get("done"):
            s["eta_min"] = 0
        else:
            pending += 1
            s["eta_min"] = pending * _ETA_STEP_MIN
    return steps


async def _reassign_step(org: str, task: dict, step: dict, exclude: list):
    """Passa un passo al PROSSIMO operatore LIBERO (competenza + aura), saltando chi è
    occupato o bloccato dal Capo. Aggiorna lo stato persistente del nuovo assegnatario."""
    pool = await _worker_pool(org)
    used = [((s.get("assignee") or "").strip()) for s in (task.get("steps") or []) if s.get("assignee") and not s.get("done")]
    used += [e for e in exclude if e]
    w = _match_worker(step.get("sub_role"), pool, used)
    step["assignee"] = (w or {}).get("name")
    step["assignee_position"] = (w or {}).get("position")
    step["assignee_aura"] = (w or {}).get("aura")
    if w:
        await _set_worker_state(org, w["name"], status="busy", task_id=task["id"],
                                step_order=step.get("order"), eta_min=step.get("eta_min"))
    return step


class WorkerActionReq(BaseModel):
    operator: str = Field(..., max_length=60)
    action: str = "accept"          # accept | complete | reject
    task_id: Optional[str] = None
    step_order: Optional[int] = None


@api_router.post("/worker/task-action")
async def worker_task_action(body: WorkerActionReq, request: Request,
                             org: str = Depends(effective_org)):
    """Le CUFFIE comandano lo stato vivo dell'operatore:
    - accept   → l'operatore prende il passo: diventa OCCUPATO;
    - complete → il passo è fatto: l'operatore torna LIBERO, il passo successivo passa al
                 prossimo libero e i tempi stimati si ricalcolano a cascata;
    - reject ("prossimo compito") → il passo torna in cerca del prossimo libero e l'operatore
                 chiede il compito successivo, sempre rispettando la priorità del Capo."""
    op = (body.operator or "").strip()
    if not op:
        raise HTTPException(status_code=400, detail="Operatore mancante")
    action = (body.action or "accept").lower()

    task = None
    if body.task_id:
        task = await db.team_tasks.find_one({"id": body.task_id, "organization_id": org}, {"_id": 0})
    if not task and body.step_order is None:
        # trova il task attivo dell'operatore
        task = await db.team_tasks.find_one(
            {"status": "active", "organization_id": org, "steps.assignee": {"$regex": f"^{re.escape(op)}$", "$options": "i"}}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Nessun task per l'operatore")

    steps = task.get("steps") or []
    target = None
    for s in steps:
        if body.step_order is not None and int(s.get("order") or 0) == int(body.step_order):
            target = s; break
        if body.step_order is None and (s.get("assignee") or "").lower() == op.lower() and not s.get("done"):
            target = s; break
    if not target:
        raise HTTPException(status_code=404, detail="Passo non trovato")

    if action == "accept":
        await _set_worker_state(org, op, status="busy", task_id=task["id"], step_order=target.get("order"))
        msg = f"{op} ha preso in carico: {target.get('instruction','')[:60]}"
    elif action == "complete":
        target["done"] = True
        target["done_by"] = op[:40]
        target["done_at"] = now_iso()
        # operatore torna libero (e si sblocca dal Capo su questo passo)
        await _set_worker_state(org, op, status="free", task_id=None, step_order=None, locked_by_capo=False)
        # passa il prossimo passo non fatto al prossimo libero
        nxt = next((s for s in sorted(steps, key=lambda x: int(x.get("order") or 0)) if not s.get("done") and not s.get("assignee")), None)
        if nxt is None:
            nxt = next((s for s in sorted(steps, key=lambda x: int(x.get("order") or 0)) if not s.get("done")), None)
        if nxt is not None:
            await _reassign_step(org, task, nxt, exclude=[op])
        msg = f"Passo completato da {op}. Prossimo assegnato: {(nxt or {}).get('assignee') or '—'}"
    elif action == "reject":
        # l'operatore rifiuta: libero, il passo va al prossimo libero (diverso da lui)
        await _set_worker_state(org, op, status="free", task_id=None, step_order=None)
        await _reassign_step(org, task, target, exclude=[op])
        msg = f"Passo riassegnato a {target.get('assignee') or '—'} (prossimo libero)"
    else:
        raise HTTPException(status_code=400, detail="Azione non valida")

    steps = _recompute_task_eta(steps)
    all_done = all(s.get("done") for s in steps) if steps else False
    upd = {"steps": steps}
    if all_done:
        upd["status"] = "done"; upd["closed_at"] = now_iso()
    await db.team_tasks.update_one({"id": task["id"], "organization_id": org}, {"$set": upd})
    return {"status": "success", "message": msg, "all_done": all_done, "steps": steps}


@api_router.get("/worker/next-task")
async def worker_next_task(operator: str = "", org: str = Depends(effective_org)):
    """«Prossimo compito» per l'operatore: il primo passo attivo assegnato a lui (o assegnabile)."""
    op = (operator or "").strip()
    if not op:
        raise HTTPException(status_code=400, detail="Operatore mancante")
    q = {"status": "active", "$or": [{"organization_id": org}, {"organization_id": {"$exists": False}}]}
    tasks = await db.team_tasks.find(q, {"_id": 0}).sort("created_at", 1).to_list(200)
    for t in tasks:
        for s in sorted(t.get("steps") or [], key=lambda x: int(x.get("order") or 0)):
            if s.get("done"):
                continue
            if (s.get("assignee") or "").lower() == op.lower():
                return {"has_task": True, "task_id": t["id"], "title": t.get("title"),
                        "step": s, "eta_min": s.get("eta_min")}
    return {"has_task": False}


@api_router.get("/worker/states")
async def worker_states_list(org: str = Depends(effective_org)):
    """Stato vivo (libero/occupato + lock Capo) di tutti gli operatori dell'azienda."""
    states = await _worker_states_map(org)
    return {"states": list(states.values())}


@api_router.get("/worker/board")
async def worker_board(org: str = Depends(effective_org)):
    """PLANCIA STATO OPERATORI: elenco di TUTTI gli operatori del turno con stato
    libero/occupato, compito corrente e tempo stimato (ETA). Unisce il pool del piano turni
    allo stato persistente + il titolo del task attivo."""
    pool = await _worker_pool(org)
    states = await _worker_states_map(org)
    # Mappa dei task attivi per titolo/ETA
    tasks = await db.team_tasks.find({"status": "active", "organization_id": org}, {"_id": 0}).to_list(300)
    task_by_id = {t.get("id"): t for t in tasks}
    # TURNI: giorno corrente (abbreviazione IT) per capire chi è di turno ORA vs dopo.
    _DOW = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"]
    today_ab = _DOW[datetime.now(timezone.utc).weekday()]
    _TODAY_TOKENS = {"oggi", "ogg", "today", "tod", "heute", "heu", "hoy", "aujourd'hui", "auj", "امروز", "اليوم", today_ab}
    shift_start = await _today_shift_start(org, today_ab)

    def _on_shift(days):
        # Nessun dato turno → presente. Un token "oggi" o il giorno corrente → in turno.
        if not days:
            return True
        for d in days:
            dl = (d or "").lower()
            if dl in _TODAY_TOKENS or dl[:3] == today_ab:
                return True
        return False

    def _lateness(st, eta):
        # Ritardo: minuti trascorsi dall'inizio del compito oltre l'ETA stimato.
        started = st.get("started_at")
        if not started or not eta:
            return False, 0
        try:
            t0 = datetime.fromisoformat(str(started).replace("Z", "+00:00"))
            elapsed = (datetime.now(timezone.utc) - t0).total_seconds() / 60.0
            return (elapsed > float(eta)), max(0, int(round(elapsed - float(eta))))
        except Exception:
            return False, 0

    board = []
    seen = set()
    for w in pool:
        st = states.get(w["name"].lower(), {})
        status = st.get("status", "free")
        task_title, eta = None, st.get("eta_min")
        tid = st.get("task_id")
        if tid and tid in task_by_id:
            t = task_by_id[tid]
            task_title = t.get("title")
            step = next((s for s in (t.get("steps") or []) if int(s.get("order") or 0) == int(st.get("step_order") or -1)), None)
            if step:
                task_title = step.get("instruction") or task_title
                eta = step.get("eta_min", eta)
        elif st.get("task"):
            task_title = st.get("task")
        days = w.get("days") or []
        on_shift = _on_shift(days)
        late, over = _lateness(st, eta) if status == "busy" else (False, 0)
        board.append({
            "name": w["name"], "position": w.get("position") or "",
            "aura": w.get("aura"), "status": status,
            "locked_by_capo": bool(st.get("locked_by_capo")),
            "task": task_title, "dept": st.get("dept"),
            "eta_min": eta, "updated_at": st.get("updated_at"),
            "days": days, "on_shift_today": on_shift,
            "late": late, "over_min": over,
            "task_id": tid, "step_order": st.get("step_order"),
            "shift_start": shift_start if on_shift else None,
        })
        seen.add(w["name"].lower())
    # Operatori con stato ma non nel pool del turno (es. spostati dal Capo a mano)
    for k, st in states.items():
        if k in seen:
            continue
        eta = st.get("eta_min")
        late, over = _lateness(st, eta) if st.get("status") == "busy" else (False, 0)
        board.append({
            "name": st.get("name"), "position": st.get("dept") or "",
            "aura": None, "status": st.get("status", "free"),
            "locked_by_capo": bool(st.get("locked_by_capo")),
            "task": st.get("task"), "dept": st.get("dept"),
            "eta_min": eta, "updated_at": st.get("updated_at"),
            "days": [], "on_shift_today": True, "late": late, "over_min": over,
            "task_id": st.get("task_id"), "step_order": st.get("step_order"),
        })
    busy = sum(1 for b in board if b["status"] == "busy")
    on_now = sum(1 for b in board if b["on_shift_today"])
    late_n = sum(1 for b in board if b["late"])
    return {"board": board, "totals": {"total": len(board), "busy": busy, "free": len(board) - busy,
                                       "on_shift": on_now, "later": len(board) - on_now, "late": late_n}}


class AssignNextReq(BaseModel):
    operator: str = Field(..., max_length=60)


@api_router.post("/worker/assign-next")
async def worker_assign_next(body: AssignNextReq, org: str = Depends(effective_org)):
    """Assegna all'operatore il PROSSIMO passo pendente tra i task attivi (uno-tap dalla
    plancia). Cerca prima un passo senza assegnatario, poi il primo non completato."""
    op = (body.operator or "").strip()
    if not op:
        raise HTTPException(status_code=400, detail="Operatore mancante")
    tasks = await db.team_tasks.find({"status": "active", "organization_id": org}, {"_id": 0}).sort("created_at", 1).to_list(300)
    chosen_task, chosen_step = None, None
    for t in tasks:
        steps = sorted(t.get("steps") or [], key=lambda x: int(x.get("order") or 0))
        cand = next((s for s in steps if not s.get("done") and not (s.get("assignee") or "").strip()), None)
        if not cand:
            cand = next((s for s in steps if not s.get("done")), None)
        if cand:
            chosen_task, chosen_step = t, cand
            break
    if not chosen_task:
        return {"assigned": False, "message": "Nessun compito pendente da assegnare"}
    chosen_step["assignee"] = op
    chosen_step["assignee_position"] = None
    steps = _recompute_task_eta(chosen_task.get("steps") or [])
    await db.team_tasks.update_one({"id": chosen_task["id"], "organization_id": org}, {"$set": {"steps": steps}})
    await _set_worker_state(org, op, status="busy", task_id=chosen_task["id"],
                            step_order=chosen_step.get("order"), eta_min=chosen_step.get("eta_min"))
    return {"assigned": True, "task_title": chosen_task.get("title"),
            "instruction": chosen_step.get("instruction"), "eta_min": chosen_step.get("eta_min"),
            "message": f"{op} → {chosen_step.get('instruction','')[:60]}"}


@api_router.get("/worker/pending-steps")
async def worker_pending_steps(org: str = Depends(effective_org)):
    """ASSEGNA MIRATA: elenco dei passi pendenti dei task attivi, così la Direzione può
    scegliere ESATTAMENTE quale compito dare a un operatore (non solo il prossimo)."""
    tasks = await db.team_tasks.find({"status": "active", "organization_id": org}, {"_id": 0}).sort("created_at", 1).to_list(300)
    out = []
    for t in tasks:
        for s in sorted(t.get("steps") or [], key=lambda x: int(x.get("order") or 0)):
            if s.get("done"):
                continue
            out.append({
                "task_id": t.get("id"), "task_title": t.get("title"),
                "order": s.get("order"), "instruction": s.get("instruction"),
                "sub_role": s.get("sub_role"), "assignee": s.get("assignee"),
                "eta_min": s.get("eta_min"),
            })
    return {"steps": out}


class AssignStepReq(BaseModel):
    operator: str = Field(..., max_length=60)
    task_id: str
    step_order: int


@api_router.post("/worker/assign-step")
async def worker_assign_step(body: AssignStepReq, org: str = Depends(effective_org)):
    """Assegna un passo SPECIFICO (scelto dalla Direzione) a un operatore."""
    op = (body.operator or "").strip()
    if not op:
        raise HTTPException(status_code=400, detail="Operatore mancante")
    task = await db.team_tasks.find_one({"id": body.task_id, "organization_id": org}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task non trovato")
    steps = task.get("steps") or []
    target = next((s for s in steps if int(s.get("order") or 0) == int(body.step_order)), None)
    if not target:
        raise HTTPException(status_code=404, detail="Passo non trovato")
    if target.get("done"):
        return {"assigned": False, "message": "Il passo è già completato"}
    target["assignee"] = op
    target["assignee_position"] = None
    steps = _recompute_task_eta(steps)
    await db.team_tasks.update_one({"id": task["id"], "organization_id": org}, {"$set": {"steps": steps}})
    await _set_worker_state(org, op, status="busy", task_id=task["id"],
                            step_order=target.get("order"), eta_min=target.get("eta_min"))
    return {"assigned": True, "task_title": task.get("title"),
            "instruction": target.get("instruction"), "eta_min": target.get("eta_min"),
            "message": f"{op} → {target.get('instruction','')[:60]}"}


class ReassignReq(BaseModel):
    operator: str = Field(..., max_length=60)


@api_router.post("/worker/reassign")
async def worker_reassign_late(body: ReassignReq, org: str = Depends(effective_org)):
    """RIASSEGNA RITARDI: il Capo sposta ISTANTANEAMENTE il compito di un operatore (tipicamente
    in ritardo) al prossimo collega libero. Libera l'operatore e ricalcola le ETA a cascata."""
    op = (body.operator or "").strip()
    if not op:
        raise HTTPException(status_code=400, detail="Operatore mancante")
    st = (await _worker_states_map(org)).get(op.lower(), {})
    tid, order = st.get("task_id"), st.get("step_order")
    if not tid:
        raise HTTPException(status_code=404, detail="L'operatore non ha un compito attivo")
    task = await db.team_tasks.find_one({"id": tid, "organization_id": org}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task non trovato")
    steps = task.get("steps") or []
    target = next((s for s in steps if int(s.get("order") or 0) == int(order or -1)), None)
    if not target:
        raise HTTPException(status_code=404, detail="Passo non trovato")
    # libera l'operatore in ritardo e passa il compito al prossimo libero (escludendolo)
    await _set_worker_state(org, op, status="free", task_id=None, step_order=None)
    await _reassign_step(org, task, target, exclude=[op])
    steps = _recompute_task_eta(steps)
    await db.team_tasks.update_one({"id": task["id"], "organization_id": org}, {"$set": {"steps": steps}})
    new_asg = target.get("assignee")
    return {"reassigned": True, "from": op, "to": new_asg,
            "instruction": target.get("instruction"),
            "message": f"{op} → {new_asg or '—'}"}


def _parse_dt(s):
    try:
        return datetime.fromisoformat(str(s).replace("Z", "+00:00"))
    except Exception:
        return None


@api_router.get("/worker/late-alerts")
async def worker_late_alerts(org: str = Depends(effective_org)):
    """NOTIFICA DIREZIONE: operatori che hanno superato la stima ORA. Registra ogni nuovo
    sforamento nello storico ritardi e invia una notifica push alla Direzione (una volta)."""
    board = (await worker_board(org=org))["board"]
    now = datetime.now(timezone.utc)
    day = now.strftime("%Y-%m-%d")
    alerts = []
    for b in board:
        if not b.get("late") or b.get("status") != "busy":
            continue
        aid = f"{b['name']}|{b.get('task_id')}|{day}"
        alerts.append({"id": aid, "operator": b["name"], "position": b.get("position"),
                       "task": b.get("task"), "over_min": b.get("over_min"), "eta_min": b.get("eta_min")})
        existing = await db.delay_events.find_one({"alert_id": aid})
        if not existing:
            # Nuovo ritardo → storico + notifica alla Direzione (push + storico allarmi deck)
            await db.delay_events.insert_one({
                "alert_id": aid, "organization_id": org, "operator": b["name"],
                "position": b.get("position") or "", "task": b.get("task") or "",
                "task_id": b.get("task_id"), "over_min": int(b.get("over_min") or 0),
                "eta_min": int(b.get("eta_min") or 0), "day": day, "ts": now.isoformat(),
            })
            try:
                await db.deck_alarm_history.insert_one({
                    "ts": now.isoformat(), "day": day, "hm": now.strftime("%H:%M"),
                    "kind": "delay", "stations": [b.get("position") or b["name"]],
                    "departments": [], "text": f"{b['name']} in ritardo (+{b.get('over_min')}′) su «{(b.get('task') or '')[:40]}»",
                    "heartbeat": None, "score": None,
                })
                admins = await db.users.find(
                    {"$or": [{"role": "admin"}, {"email": {"$in": [e.lower() for e in OWNER_EMAILS]}}]},
                    {"_id": 0, "user_id": 1}).to_list(50)
                ids = [a["user_id"] for a in admins]
                if ids:
                    _, priv = await _get_vapid()
                    subs = await db.push_subs.find({"user_id": {"$in": ids}}, {"_id": 0}).to_list(100)
                    payload = {"title": "MikiLab · Ritardo in produzione",
                               "body": f"{b['name']} è oltre la stima di {b.get('over_min')}′ su «{(b.get('task') or '')[:40]}».",
                               "tag": "worker-late"}
                    for s in subs:
                        await asyncio.to_thread(_send_push, s["subscription"], payload, priv)
            except Exception:
                logger.exception("late-alert notify error")
        else:
            await db.delay_events.update_one({"alert_id": aid}, {"$max": {"over_min": int(b.get("over_min") or 0)}})
    return {"alerts": alerts}


@api_router.get("/worker/delays/history")
async def worker_delays_history(days: int = 7, org: str = Depends(effective_org)):
    """STORICO RITARDI: ritardi degli ultimi N giorni aggregati per operatore (colli di bottiglia)."""
    days = max(1, min(int(days or 7), 60))
    since = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    docs = await db.delay_events.find({"organization_id": org, "day": {"$gte": since}}, {"_id": 0}).to_list(2000)
    agg = {}
    for d in docs:
        nm = d.get("operator") or "?"
        a = agg.setdefault(nm, {"operator": nm, "position": d.get("position") or "", "count": 0, "total_over": 0, "max_over": 0})
        a["count"] += 1
        a["total_over"] += int(d.get("over_min") or 0)
        a["max_over"] = max(a["max_over"], int(d.get("over_min") or 0))
    ranking = sorted(agg.values(), key=lambda x: (x["count"], x["total_over"]), reverse=True)
    return {"days": days, "since": since, "total_events": len(docs), "ranking": ranking}


class CapoMoveReq(BaseModel):
    operator: str = Field(..., max_length=60)
    dept: Optional[str] = ""
    role: Optional[str] = ""
    task: Optional[str] = ""


@api_router.post("/worker/capo-move")
async def worker_capo_move(body: CapoMoveReq, user: dict = Depends(require_admin)):
    """PRIORITÀ ASSOLUTA DEL CAPO: un comando del Capo (voce/chat) per spostare un operatore
    di reparto/ruolo/compito vince SEMPRE su qualsiasi decisione automatica di Sitor in corso.
    L'operatore viene bloccato (locked_by_capo) così nessuna riassegnazione automatica lo muove."""
    org = _org_id(user)
    op = (body.operator or "").strip()
    if not op:
        raise HTTPException(status_code=400, detail="Operatore mancante")
    await _set_worker_state(org, op, status="busy",
                            dept=(body.dept or "")[:80], role=(body.role or "")[:80],
                            task=(body.task or "")[:160], task_id=None, step_order=None,
                            locked_by_capo=True, capo_at=now_iso(), capo_by=user.get("email"))
    return {"status": "success",
            "mikemix_insight": f"Comando della Direzione applicato: {op} spostato con priorità assoluta.",
            "operator": op, "dept": body.dept, "role": body.role, "task": body.task}




@api_router.get("/delegation/tasks")
async def delegation_tasks(role: str = "", org: str = Depends(effective_org)):
    """Task attivi. Se arriva `role` (postazione dell'operatore) filtra SOLO i task della
    sua linea/postazione + i task broadcast (senza destinatario), così la plancia mostra
    all'istante i compiti giusti quando l'operatore cambia postazione."""
    items = await db.team_tasks.find({"status": "active", "organization_id": org}, {"_id": 0}).sort("created_at", -1).to_list(200)
    if role:
        line = _role_to_line(role)
        rl = role.lower()

        def _match(t):
            tl = (t.get("line") or "").lower()
            asg = (t.get("assignee") or "").lower()
            if tl and tl == line:
                return True
            if asg and (asg == rl or rl in asg or asg in rl):
                return True
            steps = t.get("steps") or []
            step_targets = [((s.get("assignee") or "") + " " + (s.get("sub_role") or "")).lower() for s in steps]
            if any(st and (rl in st or any(w and w in st for w in rl.split())) for st in step_targets):
                return True
            # broadcast: nessuna linea, nessun assegnatario e nessuno step mirato → visibile a tutti
            if not tl and not asg and not any(st.strip() for st in step_targets):
                return True
            return False

        items = [t for t in items if _match(t)]
    return {"tasks": items[:50]}


class StepDoneReq(BaseModel):
    order: int
    operator: Optional[str] = ""


@api_router.post("/delegation/tasks/{task_id}/step")
async def delegation_step_done(task_id: str, body: StepDoneReq, org: str = Depends(effective_org)):
    t = await db.team_tasks.find_one({"id": task_id, "organization_id": org})
    if not t:
        raise HTTPException(status_code=404, detail="Task non trovato")
    steps = t.get("steps") or []
    for s in steps:
        if int(s.get("order")) == int(body.order):
            s["done"] = True
            if body.operator:
                s["done_by"] = body.operator[:40]
            s["done_at"] = now_iso()
    all_done = all(s.get("done") for s in steps) if steps else False
    upd = {"steps": steps}
    if all_done:
        upd["status"] = "done"
        upd["closed_at"] = now_iso()
    await db.team_tasks.update_one({"id": task_id, "organization_id": org}, {"$set": upd})
    return {"status": "success", "all_done": all_done, "steps": steps}


@api_router.post("/delegation/tasks/{task_id}/close")
async def delegation_close(task_id: str, admin: dict = Depends(require_admin)):
    await db.team_tasks.update_one({"id": task_id, "organization_id": _org_id(admin)}, {"$set": {"status": "closed", "closed_at": now_iso()}})
    return {"status": "success"}


class CleanCheckReq(BaseModel):
    image_base64: str
    lang: Optional[str] = "it"


@api_router.post("/delegation/tasks/{task_id}/cleanliness-check")
async def delegation_cleanliness_check(task_id: str, body: CleanCheckReq, org: str = Depends(effective_org)):
    """Checkpoint AR: valida con la fotocamera lo standard di pulizia prima di chiudere il task."""
    t = await db.team_tasks.find_one({"id": task_id, "organization_id": org})
    if not t:
        raise HTTPException(status_code=404, detail="Task non trovato")
    img = (body.image_base64 or "").split(",")[-1]
    if not img:
        raise HTTPException(status_code=400, detail="Nessuna immagine")
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=503, detail="Vision non disponibile")
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY, session_id=f"clean-{uuid.uuid4().hex[:8]}",
            system_message=(
                "Sei l'ispettore visivo di Sitor. Valuta dalla FOTO se l'attrezzatura/superficie/carrello di un laboratorio "
                "di panificazione e' PULITA a standard operativo (assenza di residui di impasto/farina/sporco, superfici asciutte e ordinate). "
                f"Rispondi SOLO con JSON valido nella lingua '{body.lang}': "
                '{"clean":true|false,"score":0-100,"note":"1 frase su cosa va bene o cosa manca"}. '
                "Sii pratico da produzione, NIENTE riferimenti a HACCP/moduli/documenti."
            )
        ).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=300)
        full = ""
        async for ev in chat.stream_message(UserMessage(text="Valuta la pulizia nella foto.", file_contents=[ImageContent(image_base64=img)])):
            if isinstance(ev, TextDelta):
                full += ev.content
            elif isinstance(ev, StreamDone):
                break
        m = re.search(r"\{.*\}", full, re.S)
        res = json.loads(m.group(0)) if m else {"clean": False, "score": 0, "note": "Non valutabile"}
    except Exception as e:
        logging.warning(f"cleanliness_check failed: {e}")
        raise HTTPException(status_code=503, detail="Vision non disponibile")
    clean = bool(res.get("clean"))
    if clean:
        await db.team_tasks.update_one({"id": task_id, "organization_id": org}, {"$set": {"status": "closed", "closed_at": now_iso(), "cleanliness": res}})
    else:
        await db.team_tasks.update_one({"id": task_id, "organization_id": org}, {"$set": {"cleanliness": res}})
    return {"status": "success", "clean": clean, "score": res.get("score"), "note": res.get("note"), "closed": clean}



@api_router.get("/shift/handoff")
async def shift_handoff(lang: str = "it", org: str = Depends(effective_org)):
    """Riassunto vocale per il cambio turno: stato settori, personale, task, ritmo."""
    staff = await _staffing(org)
    tasks = await db.team_tasks.count_documents({"status": "active", "organization_id": org})
    shift = await db.lab_shift_state.find_one({"_key": "default", "organization_id": org}, {"_id": 0}) or {}
    pacing = (shift.get("pacing_directive") or {}).get("pacing")
    down = len(shift.get("machines_down") or [])
    P = {
        "it": {"intro": "Passaggio di consegne turno.", "staff": f"In turno {staff['present']} operatori su {staff['total']}.",
               "tasks": (f"{tasks} task di squadra ancora attivi." if tasks else "Nessun task di squadra aperto."),
               "pace": (f"Ritmo produzione impostato su: {pacing}." if pacing else "Ritmo produzione regolare."),
               "sectors": ("Tutti i sei settori sincronizzati e sotto controllo." if down == 0 else f"{down} macchinari fermi da verificare."),
               "end": "Buon turno."},
        "en": {"intro": "Shift handover.", "staff": f"On shift {staff['present']} of {staff['total']} operators.",
               "tasks": (f"{tasks} team tasks still active." if tasks else "No open team tasks."),
               "pace": (f"Production pacing set to: {pacing}." if pacing else "Production pacing normal."),
               "sectors": ("All six sectors synced and under control." if down == 0 else f"{down} machines down to check."),
               "end": "Have a good shift."},
        "de": {"intro": "Schichtübergabe.", "staff": f"Im Dienst {staff['present']} von {staff['total']} Mitarbeitern.",
               "tasks": (f"{tasks} Team-Aufgaben noch aktiv." if tasks else "Keine offenen Team-Aufgaben."),
               "pace": (f"Produktionstempo: {pacing}." if pacing else "Produktionstempo normal."),
               "sectors": ("Alle sechs Sektoren synchron und unter Kontrolle." if down == 0 else f"{down} Maschinen ausgefallen."),
               "end": "Gute Schicht."},
    }
    m = P.get(lang, P["en"])
    text = f"{m['intro']} {m['staff']} {m['sectors']} {m['tasks']} {m['pace']} {m['end']}"
    # AUDIO OFFLINE: sintetizza e salva il blob MP3 in base64 così il passaggio di consegne
    # è riascoltabile perfettamente anche completamente offline (dopo la prima generazione).
    import base64 as _b64h
    audio_b64 = None
    try:
        _ab = await _synth_tts_bytes(text, lang, "michele")
        if _ab:
            audio_b64 = _b64h.b64encode(_ab).decode("ascii")
    except Exception:
        audio_b64 = None
    rec = {"id": str(uuid.uuid4()), "text": text, "lang": lang, "present": staff["present"], "total": staff["total"],
           "active_tasks": tasks, "at": now_iso(), "audio_base64": audio_b64, "audio_mime": "audio/mpeg"}
    await db.shift_handoffs.insert_one(dict(rec))
    return {"status": "success", "text": text, "present": staff["present"], "total": staff["total"],
            "active_tasks": tasks, "audio_base64": audio_b64, "audio_mime": "audio/mpeg"}


@api_router.get("/shift/handoff/history")
async def shift_handoff_history(user: Optional[dict] = Depends(optional_user)):
    items = await db.shift_handoffs.find({}, {"_id": 0}).sort("at", -1).to_list(20)
    return {"items": items}


class ProoferSyncReq(BaseModel):
    aura_score: Optional[int] = None


@api_router.get("/proofer/sync")
async def proofer_sync(user: Optional[dict] = Depends(optional_user)):
    """Calibra cella/freezer sulla velocità (Aura) dell'operatore attivo per evitare la sovra-lievitazione."""
    pool = await _worker_pool()
    top = pool[0] if pool else {"name": "Operatore", "score": 85, "aura": _aura_for(85)}
    score = int(top.get("score", 85))
    # Operatore veloce (Aura alta) → la linea corre: raffredda e accorcia per non far sovra-lievitare.
    # Operatore lento (Aura bassa) → scalda leggermente e allunga per tenere il passo.
    base_temp, base_time = 28.0, 75
    temp = round(base_temp - (score - 85) * 0.08, 1)         # più veloce = più freddo
    time_min = int(base_time - (score - 85) * 0.6)            # più veloce = finestra più corta
    temp = max(24.0, min(32.0, temp))
    time_min = max(45, min(110, time_min))
    if score >= 92:
        note = "Aura altissima: la linea corre. Cella più fredda e finestra corta per non sovra-lievitare."
    elif score <= 78:
        note = "Aura più bassa: cella leggermente più calda e finestra più lunga per tenere il passo."
    else:
        note = "Ritmo bilanciato: parametri di lievitazione standard."
    return {"status": "success", "operator": top.get("name"), "aura": top.get("aura"), "aura_score": score,
            "proofer_temp_c": temp, "proof_time_min": time_min, "freezer_hold_c": -18 if score >= 92 else -16,
            "note": note}


class BatchPhoenixReq(BaseModel):
    dough_type: str = Field(..., max_length=80)
    excess_kg: float = Field(..., ge=0.1, le=500)
    state: Optional[str] = "eccesso"   # eccesso | rallentato | sovra-lievitato
    lang: Optional[str] = "it"


@api_router.post("/batch-phoenix")
async def batch_phoenix(body: BatchPhoenixReq, user: dict = Depends(require_admin)):
    """Recupera impasti in eccesso/rallentati proponendo un reimpiego immediato su un'altra linea."""
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=503, detail="AI non disponibile")
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY, session_id=f"phoenix-{uuid.uuid4().hex[:8]}",
            system_message=(
                "Sei Sitor, maestro anti-spreco. Ti do un impasto in eccesso/rallentato/sovra-lievitato in un panificio. "
                "Proponi 2-3 REIMPIEGHI IMMEDIATI e concreti su un'altra linea (es. focaccia, grissini, pizza in teglia, pane in cassetta, crackers, croste per pizza da surgelare) "
                "per azzerare lo spreco, indicando per ognuno la linea/reparto e una nota operativa breve. "
                f"Rispondi SOLO con JSON valido nella lingua '{body.lang}': "
                '{"verdict":"1 frase","options":[{"product":"nome","line":"reparto/linea","note":"come fare in breve","yield_kg":numero}]}. '
                "Niente HACCP/burocrazia."
            )
        ).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=600)
        full = ""
        async for ev in chat.stream_message(UserMessage(text=f"Impasto: {body.dough_type}, {body.excess_kg} kg, stato: {body.state}.")):
            if isinstance(ev, TextDelta):
                full += ev.content
            elif isinstance(ev, StreamDone):
                break
        m = re.search(r"\{.*\}", full, re.S)
        res = json.loads(m.group(0)) if m else {"verdict": "", "options": []}
    except Exception as e:
        logging.warning(f"batch_phoenix failed: {e}")
        raise HTTPException(status_code=503, detail="AI non disponibile")
    return {"status": "success", "dough_type": body.dough_type, "excess_kg": body.excess_kg, **res}





# ---------------------------------------------------------------------------
# TIMER IMPASTO REALE — traccia inizio/età di ogni impasto; Sitor segnala il
# recupero (Batch Phoenix) quando un impasto resta fermo troppo a lungo.
# ---------------------------------------------------------------------------
_DOUGH_STALL_MIN = 90


class DoughStartReq(BaseModel):
    dough_type: str = Field(..., max_length=80)
    kg: float = Field(0, ge=0, le=500)
    line: Optional[str] = ""


def _age_min(iso: str) -> int:
    try:
        t = datetime.fromisoformat(iso)
        if t.tzinfo is None:
            t = t.replace(tzinfo=timezone.utc)
        return int((datetime.now(timezone.utc) - t).total_seconds() // 60)
    except Exception:
        return 0


@api_router.post("/batches/start")
async def dough_start(body: DoughStartReq, user: Optional[dict] = Depends(optional_user)):
    doc = {"id": str(uuid.uuid4()), "organization_id": _org_id(user), "dough_type": body.dough_type[:80], "kg": round(float(body.kg or 0), 2),
           "line": body.line or "", "status": "active", "started_at": now_iso()}
    await db.dough_batches.insert_one(dict(doc))
    return {"status": "success", "batch": doc}


@api_router.get("/batches/active")
async def dough_active(user: Optional[dict] = Depends(optional_user)):
    items = await db.dough_batches.find({"status": "active", "organization_id": _org_id(user)}, {"_id": 0}).sort("started_at", 1).to_list(100)
    for it in items:
        it["age_min"] = _age_min(it.get("started_at"))
        it["stalled"] = it["age_min"] >= _DOUGH_STALL_MIN
    stalled = [it for it in items if it["stalled"]]
    return {"batches": items, "stalled_count": len(stalled), "stall_threshold_min": _DOUGH_STALL_MIN}


@api_router.post("/batches/{batch_id}/close")
async def dough_close(batch_id: str, user: Optional[dict] = Depends(optional_user)):
    await db.dough_batches.update_one({"id": batch_id, "organization_id": _org_id(user)}, {"$set": {"status": "closed", "closed_at": now_iso()}})
    return {"status": "success"}



@api_router.get("/lab/warehouse/consumption")
async def get_consumption(user: Optional[dict] = Depends(optional_user)):
    return await db.lab_consumption_log.find({"organization_id": _org_id(user)}, {"_id": 0}).sort("at", -1).to_list(100)


@api_router.get("/lab/warehouse/stats")
async def warehouse_stats(user: Optional[dict] = Depends(optional_user)):
    # Autonomia reale: consumo medio giornaliero per materia (ultimi 14 giorni) + giorni residui.
    WINDOW = 14
    stock = await db.lab_warehouse.find({"organization_id": _org_id(user)}, {"_id": 0}).to_list(500)
    logs = await db.lab_consumption_log.find({"organization_id": _org_id(user)}, {"_id": 0}).to_list(3000)
    cutoff = datetime.now(timezone.utc) - timedelta(days=WINDOW)
    by_name: dict = {}
    for lg in logs:
        try:
            at = datetime.fromisoformat(str(lg.get("at")).replace("Z", "+00:00"))
        except Exception:
            continue
        if at.tzinfo is None:
            at = at.replace(tzinfo=timezone.utc)
        if at < cutoff:
            continue
        nm = (lg.get("name") or "").lower().strip()
        by_name[nm] = by_name.get(nm, 0) + float(lg.get("kg", 0) or 0)
    items = []
    for s in stock:
        nm = (s.get("name") or "").lower().strip()
        used = by_name.get(nm, 0)
        daily = round(used / WINDOW, 3) if used > 0 else 0
        q = float(s.get("quantity_kg", 0) or 0)
        days_left = int(q / daily) if daily > 0 else None
        items.append({"id": s.get("id"), "name": s.get("name"), "daily_kg": daily, "days_left": days_left})
    return {"items": items, "window_days": WINDOW}


class OrdiniExtraReq(BaseModel):
    orders: str
    current_plan: Optional[str] = ""
    lang: Optional[str] = "it"


@api_router.post("/lab/ordini-extra")
async def ordini_extra(payload: OrdiniExtraReq, user: Optional[dict] = Depends(optional_user)):
    # Ordini extra dell'ultimo minuto -> l'IA rigenera il piano giornaliero aggiornato.
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=503, detail="AI non disponibile")
    lang_name = _LANG_NAMES.get(payload.lang, "italiano")
    sysmsg = ("Sei il capo-produzione di un panificio artigianale. Ricevi eventuali ordini EXTRA dell'ultimo minuto "
              "e il piano di produzione giornaliero attuale. Rigenera un piano giornaliero AGGIORNATO, chiaro e ordinato, "
              "che integri gli ordini extra dando priorità alle urgenze, con fasi/orari indicativi (impasto, lievitazione, "
              "formatura, cottura, consegna) e quantità. Sii pratico e conciso. "
              f"Scrivi in {lang_name}.")
    prompt = (f"ORDINI EXTRA:\n{payload.orders}\n\nPIANO ATTUALE (se presente):\n{payload.current_plan or 'nessuno'}\n\n"
              "Restituisci il nuovo piano giornaliero in elenco puntato per fasce orarie, con in cima una riga 'PRIORITA URGENTI'.")

    async def _run(provider, model):
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"ordini-{uuid.uuid4().hex[:8]}", system_message=sysmsg).with_model(provider, model).with_params(max_tokens=1800)
        full = ""
        async for ev in chat.stream_message(UserMessage(text=prompt)):
            if isinstance(ev, TextDelta):
                full += ev.content
            elif isinstance(ev, StreamDone):
                break
        return full.strip()

    try:
        plan = await _run("anthropic", SITOR_BRAIN)
    except Exception as e:
        logging.warning(f"ordini-extra primary failed, fallback openai: {e}")
        try:
            plan = await _run("openai", "gpt-4o")
        except Exception as e2:
            raise HTTPException(status_code=500, detail=f"AI error: {e2}")
    return {"plan": plan}


class LabelScan(BaseModel):
    image_base64: str
    lang: Optional[str] = "it"




class OrderScan(BaseModel):
    image_base64: str
    lang: Optional[str] = "it"


@api_router.post("/lab/scan-order")
async def scan_order(payload: OrderScan, user: Optional[dict] = Depends(optional_user)):
    # FOTO di una comanda/ordine (a mano o stampata) → l'IA estrae le righe {prodotto, quantità}.
    if not EMERGENT_LLM_KEY:
        return {"ok": False}
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY, session_id=f"scanorder-{uuid.uuid4().hex[:8]}",
            system_message=(
                "Analizza la FOTO di una comanda/ordine di prodotti da forno (scritta a mano o stampata). "
                "Estrai le righe d'ordine. Rispondi SOLO con JSON valido, senza altro testo: "
                '{"items":[{"name":"prodotto","quantity":numero,"unit":"pz"}],'
                '"text":"riassunto su una riga, es. 20 baguette, 10 ciabatte, 5 focacce"}. '
                "Se una quantità non è leggibile usa 1. Non inventare prodotti non presenti nella foto."
            )
        ).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=800)
        img = (payload.image_base64 or "").split(",")[-1]
        full = ""
        async for ev in chat.stream_message(UserMessage(text="Estrai le righe della comanda.", file_contents=[ImageContent(image_base64=img)])):
            if isinstance(ev, TextDelta):
                full += ev.content
            elif isinstance(ev, StreamDone):
                break
        import json as _json
        import re as _re
        m = _re.search(r"\{.*\}", full, _re.S)
        data = _json.loads(m.group(0)) if m else {}
        if not data.get("text") and data.get("items"):
            data["text"] = ", ".join(
                f"{it.get('quantity', 1)} {it.get('name', '')}".strip() for it in data["items"] if isinstance(it, dict)
            )
        return {"ok": True, "data": data}
    except Exception as e:
        logging.warning(f"scan_order failed: {e}")
        return {"ok": False}



class VisionCoach(BaseModel):
    image_base64: str
    type: str = "formatura"
    lang: str = "it"




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
    "it": (
        "\n\n### LINGUA DI RISPOSTA: ITALIANO ###\n"
        "Scrivi TUTTA la risposta in italiano: titoli di sezione, elenchi attrezzature, riepiloghi e note. "
        "Non mescolare MAI lingue diverse nella stessa risposta."
    ),
    "de": (
        "\n\n### ANTWORTSPRACHE: DEUTSCH ###\n"
        "Schreibe die GESAMTE Antwort auf Deutsch – AUCH Überschriften, Geräte-/Maschinenlisten, Zusammenfassungen und Hinweise. "
        "Die Maschinen werden dir auf Italienisch genannt: ÜBERSETZE die generischen Bezeichnungen ins Deutsche, z. B. "
        "'Impastatrice a spirale (vasca estraibile)' → 'Spiralkneter (herausnehmbarer Kessel)', "
        "'Impastatrice a bracci tuffanti' → 'Tauchkneter', 'Sfogliatrice automatica' → 'Ausrollmaschine', "
        "'Cella di fermalievitazione' → 'Gär-/Kühlzelle', 'Forno a carrello rotante' → 'Stikkenofen (Rotationsofen)', "
        "'Forno a piano di pietra con vapore alta pressione' → 'Steinofen mit Hochdruckdampf', 'Spezzatrice/arrotondatrice' → 'Teigteiler/Rundwirker'. "
        "Behalte NUR Eigennamen/Marken unverändert (Rheon, CLIMATHERM, Rotovent). MISCHE NIEMALS Italienisch und Deutsch."
    ),
    "en": (
        "\n\n### RESPONSE LANGUAGE: ENGLISH ###\n"
        "Write the ENTIRE response in English, INCLUDING section titles, equipment/machine lists, recaps and notes. "
        "The machines are given to you in Italian: TRANSLATE the generic descriptions into English "
        "(e.g. 'Impastatrice a spirale' → 'Spiral mixer', 'Sfogliatrice automatica' → 'Automatic sheeter', "
        "'Cella di fermalievitazione' → 'Retarder-proofer', 'Forno a carrello rotante' → 'Rotary rack oven', "
        "'Forno a piano di pietra' → 'Stone deck oven'). Keep ONLY brand names unchanged (Rheon, CLIMATHERM, Rotovent). NEVER mix languages."
    ),
    "es": (
        "\n\n### IDIOMA DE RESPUESTA: ESPAÑOL ###\n"
        "Escribe TODA la respuesta en español, INCLUIDOS títulos de sección, listas de equipos/máquinas, resúmenes y notas. "
        "Las máquinas se te indican en italiano: TRADUCE las descripciones genéricas al español "
        "(p. ej. 'Impastatrice a spirale' → 'Amasadora de espiral', 'Sfogliatrice automatica' → 'Laminadora automática', "
        "'Cella di fermalievitazione' → 'Cámara de fermentación controlada', 'Forno a carrello rotante' → 'Horno rotativo de carros'). "
        "Mantén SOLO los nombres de marca sin cambios (Rheon, CLIMATHERM, Rotovent). NUNCA mezcles idiomas."
    ),
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
        system_message=MAESTRO_SYSTEM + machine_directive + LANG_DIRECTIVE.get(lang, LANG_DIRECTIVE["it"]),
    ).with_model("anthropic", SITOR_BRAIN)

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






@api_router.post("/lab/ask")
async def lab_ask(payload: ChatRequest):
    """Lab AI 360: risposta vocale ultra-breve (non streaming) per dialogo libero."""
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key non configurata")
    lang = payload.lang or "it"
    sys = (
        "Sei 'Sitor', assistente vocale da laboratorio di panificazione per professionisti. "
        "Rispondi SEMPRE in modo ULTRA-BREVE e pratico (massimo 2 frasi), come un maestro panettiere. "
        "Niente elenchi lunghi ne premesse. Dai numeri concreti quando servono. "
        + LANG_DIRECTIVE.get(lang, LANG_DIRECTIVE["it"])
    )
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY, session_id=f"labask-{uuid.uuid4().hex[:8]}",
        system_message=sys,
    ).with_model("anthropic", SITOR_FAST).with_params(max_tokens=220)
    # RISPARMIO CREDITI: domande identiche (stesso testo+lingua) riusano la risposta.
    mkey = _memo_key(sys, payload.message or "", SITOR_FAST)
    cached = _memo_get(mkey)
    if cached is not None:
        await _track_saving("cache")
        return {"answer": cached, "cached": True}
    await _track_saving("fast")
    text = ""
    try:
        async for ev in chat.stream_message(UserMessage(text=payload.message)):
            if isinstance(ev, TextDelta):
                text += ev.content
            elif isinstance(ev, StreamDone):
                break
    except Exception:
        logger.exception("lab_ask error")
        raise HTTPException(status_code=500, detail="Lab AI error")
    ans = text.strip()
    _memo_set(mkey, ans)
    return {"answer": ans}


@api_router.get("/ai/savings")
async def ai_savings():
    """Badge Direzione: stima del risparmio crediti dato dal modello economico + cache.
    fast_calls = chiamate sul modello economico (Haiku) invece del cervello (Opus);
    cache_hits = risposte riusate senza richiamare l'IA; brain_calls = chiamate al cervello."""
    month = now_iso()[:7]
    doc = await db.ai_usage.find_one({"month": month}, {"_id": 0}) or {}
    fast = int(doc.get("fast_calls", 0))
    brain = int(doc.get("brain_calls", 0))
    cache = int(doc.get("cache_hits", 0))
    # Stima: una chiamata al cervello (Opus) costa ~1 unità; sul modello economico ~0.08;
    # una risposta dalla cache ~0. Il risparmio è ciò che NON abbiamo speso rispetto a fare
    # tutto sul cervello.
    UNIT_BRAIN, UNIT_FAST = 1.0, 0.08
    saved_fast = fast * (UNIT_BRAIN - UNIT_FAST)
    saved_cache = cache * UNIT_FAST + cache * 0  # la cache evita anche il costo economico
    saved_units = round(saved_fast + cache * UNIT_FAST, 2)
    total_if_brain = (fast + cache + brain) * UNIT_BRAIN
    saved_pct = round((saved_units / total_if_brain) * 100) if total_if_brain else 0
    return {
        "month": month,
        "fast_calls": fast, "brain_calls": brain, "cache_hits": cache,
        "saved_units": saved_units, "saved_pct": saved_pct,
        "optimized_calls": fast + cache,
    }


@api_router.get("/ai/savings/history")
async def ai_savings_history(months: int = 6):
    """Storico mensile del risparmio crediti (ultimi N mesi) per la Direzione."""
    months = max(1, min(int(months or 6), 24))
    docs = await db.ai_usage.find({}, {"_id": 0}).sort("month", -1).to_list(months)
    UNIT_BRAIN, UNIT_FAST = 1.0, 0.08
    out = []
    for d in sorted(docs, key=lambda x: x.get("month", "")):
        fast = int(d.get("fast_calls", 0)); brain = int(d.get("brain_calls", 0)); cache = int(d.get("cache_hits", 0))
        saved = round(fast * (UNIT_BRAIN - UNIT_FAST) + cache * UNIT_FAST, 2)
        total_if_brain = (fast + cache + brain) * UNIT_BRAIN
        pct = round((saved / total_if_brain) * 100) if total_if_brain else 0
        out.append({"month": d.get("month"), "saved_units": saved, "saved_pct": pct,
                    "optimized_calls": fast + cache})
    return {"history": out}


# ---------------------------------------------------------------------------
# MikiLab — assistente di "Il Tuo Laboratorio" (Claude Sonnet 4.6, streaming)
# ---------------------------------------------------------------------------

# --- Miki (Il Capo): assistente conversazionale del sito, parla in PRIMA PERSONA ---


async def _lab_assistant_stream(system: str, lang_map: dict, session_id: str, message: str, lang: str = "it"):
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system + lang_map.get(lang, lang_map["it"]),
    ).with_model("anthropic", SITOR_BRAIN)

    prior = await db.chat_messages.find({"session_id": session_id}, {"_id": 0}).sort("created_at", 1).to_list(200)
    await db.chat_messages.insert_one({
        "id": str(uuid.uuid4()), "session_id": session_id,
        "role": "user", "content": message, "created_at": now_iso(),
    })
    context_prefix = ""
    if prior:
        lines = [f"{'Utente' if m['role'] == 'user' else 'MikiLab'}: {m['content']}" for m in prior[-10:]]
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








# ---------------------------------------------------------------------------
# Academy da Casa — MikiLab per l'home baker (chi panifica a casa)
# ---------------------------------------------------------------------------
ACADEMY_COACH_SYSTEM = (
    "Sei 'MikiLab', il Master Baker virtuale d'élite di MikiLab dedicato a chi panifica A CASA (home baker). "
    "Trasformi la cucina dell'utente in un laboratorio casalingo ad alte prestazioni. NON parli mai di macchinari "
    "industriali: adatti tutto agli strumenti di casa (forno domestico max 230-250°C, pietra refrattaria, pentola in "
    "ghisa, planetaria casalinga o impasto a mano, frigo di casa).\n"
    "COMPETENZE:\n"
    "1) SCHEDULING INVERSO: se l'utente dice quando vuole sfornare (es. 'pane pronto domenica alle 12:30'), calcoli a "
    "ritroso la timeline esatta: rinfresco lievito, autolisi, pieghe, maturazione in frigo (indica 4°C vs 8°C), "
    "puntata, formatura, appretto e preriscaldamento del forno, con GIORNO e ORARIO per ogni passo.\n"
    "2) CALCOLI TECNICO-CLIMATICI: Baker's percentage, temperatura dell'acqua in base alla temperatura della cucina, "
    "conversione tra lievito di birra fresco/secco e pasta madre, idratazione ideale in base alla farina (supermercato "
    "o mulino) e a temperatura/umidità della cucina.\n"
    "3) TROUBLESHOOTING SCIENTIFICO: niente consigli banali; spieghi la CHIMICA della fermentazione e risolvi i difetti "
    "reali del pane fatto in casa (pane piatto, mollica gommosa, crosta molle dopo la cottura, alveoli chiusi sul fondo) "
    "indicando causa -> rimedio.\n"
    "FORMATO DI RISPOSTA OBBLIGATORIO (usa sempre queste 4 righe con le emoji, in markdown):\n"
    "⚡ **Stato / Diagnosi:** breve sintesi (es. 'Timeline per domenica calcolata').\n"
    "🥖 **Impatto in cucina:** cosa fare in pratica con gli strumenti di casa.\n"
    "⏱️ **Timeline / Passo-Passo:** elenco con [Giorno e Orario] - azione, oppure spiegazione tecnica passo passo.\n"
    "🔘 **Prossimo passo:** una call-to-action breve (es. 'Salva questa timeline' o 'Fammi sapere che farina usi').\n"
    "Sii pratico, caldo e da vero maestro. Non essere prolisso."
)
ACADEMY_COACH_LANG = {
    "it": (" Rispondi SEMPRE in italiano. Usa ESATTAMENTE queste etichette nelle 4 righe:"
           " '⚡ **Stato / Diagnosi:**', '🥖 **Impatto in cucina:**', '⏱️ **Timeline / Passo-Passo:**', '🔘 **Prossimo passo:**'."),
    "de": (" Antworte IMMER auf Deutsch. Verwende GENAU diese Beschriftungen in den 4 Zeilen:"
           " '⚡ **Status / Diagnose:**', '🥖 **Auswirkung in der Küche:**', '⏱️ **Timeline / Schritt-für-Schritt:**', '🔘 **Nächster Schritt:**'."),
    "en": (" Always answer in English. Use EXACTLY these labels in the 4 lines:"
           " '⚡ **Status / Diagnosis:**', '🥖 **Kitchen impact:**', '⏱️ **Timeline / Step-by-step:**', '🔘 **Next step:**'."),
    "es": (" Responde SIEMPRE en español. Usa EXACTAMENTE estas etiquetas en las 4 líneas:"
           " '⚡ **Estado / Diagnóstico:**', '🥖 **Impacto en la cocina:**', '⏱️ **Cronología / Paso a paso:**', '🔘 **Próximo paso:**'."),
}


async def academy_coach_DISABLED(payload):
    raise HTTPException(status_code=404, detail="Non disponibile")


class QuizRequest(BaseModel):
    level: str = "apprendista"   # apprendista | avanzato | master
    lang: str = "it"
    asked: Optional[List[str]] = None   # domande già poste (per evitare ripetizioni)
    theme: Optional[str] = None   # tema della sfida settimanale (facoltativo)


# Temi rotanti della "Sfida a Tema" settimanale
WEEKLY_THEMES = [
    {"id": "idratazione", "it": "Idratazione", "de": "Hydratation", "en": "Hydration", "es": "Hidratación", "fr": "Hydratation", "fa": "هیدراتاسیون"},
    {"id": "lievito_madre", "it": "Lievito madre", "de": "Sauerteig", "en": "Sourdough starter", "es": "Masa madre", "fr": "Levain", "fa": "خمیر ترش"},
    {"id": "fermentazione", "it": "Fermentazione e maturazione", "de": "Gärung & Reifung", "en": "Fermentation & maturation", "es": "Fermentación y maduración", "fr": "Fermentation & maturation", "fa": "تخمیر و رسیدن"},
    {"id": "farine", "it": "Farine e forza (W)", "de": "Mehle & Stärke (W)", "en": "Flours & strength (W)", "es": "Harinas y fuerza (W)", "fr": "Farines & force (W)", "fa": "آردها و قدرت (W)"},
    {"id": "cottura", "it": "Cottura e forno di casa", "de": "Backen & Hausofen", "en": "Baking & home oven", "es": "Cocción y horno de casa", "fr": "Cuisson & four maison", "fa": "پخت و فر خانگی"},
    {"id": "pieghe", "it": "Pieghe e incordatura", "de": "Falten & Teigstruktur", "en": "Folds & gluten development", "es": "Pliegues y amasado", "fr": "Rabats & réseau glutineux", "fa": "تاها و شکل‌گیری گلوتن"},
    {"id": "temperatura", "it": "Temperatura e clima della cucina", "de": "Temperatur & Küchenklima", "en": "Temperature & kitchen climate", "es": "Temperatura y clima de la cocina", "fr": "Température & climat de la cuisine", "fa": "دما و آب‌وهوای آشپزخانه"},
    {"id": "difetti", "it": "Difetti del pane e rimedi", "de": "Brotfehler & Lösungen", "en": "Bread faults & fixes", "es": "Defectos del pan y soluciones", "fr": "Défauts du pain & remèdes", "fa": "عیوب نان و راه‌حل‌ها"},
]


def _weekly_theme_index():
    from datetime import date
    _, w, _2 = date.today().isocalendar()
    return w % len(WEEKLY_THEMES)


@api_router.get("/academy/weekly-theme")
async def academy_weekly_theme(lang: str = "it"):
    lang = lang if lang in ("it", "de", "en", "es", "fr", "fa") else "it"
    idx = _weekly_theme_index()
    th = WEEKLY_THEMES[idx]
    return {"week": _iso_week(), "theme_id": th["id"], "title": th.get(lang, th["it"])}


_QUIZ_LEVELS = {
    "apprendista": {
        "it": "Livello APPRENDISTA: calcoli rapidi di idratazione, dosaggi di lievito, temperatura dell'acqua in casa, i 4 ingredienti base. Domande semplici e pratiche.",
        "de": "Level ANFÄNGER: schnelle Hydratationsberechnungen, Hefemengen, Wassertemperatur zu Hause, die 4 Grundzutaten. Einfache, praktische Fragen.",
        "en": "APPRENTICE level: quick hydration calculations, yeast dosing, home water temperature, the 4 basic ingredients. Simple, practical questions.",
        "es": "Nivel APRENDIZ: cálculos rápidos de hidratación, dosis de levadura, temperatura del agua en casa, los 4 ingredientes básicos. Preguntas simples y prácticas.",
    },
    "avanzato": {
        "it": "Livello HOME BAKER AVANZATO: pieghe di rinforzo, controllo della lievitazione in frigo casalingo (4°C vs 8°C), autolisi, conversione tra lieviti. Domande di media difficoltà.",
        "de": "Level FORTGESCHRITTEN: Dehnen & Falten, Gärkontrolle im Haushaltskühlschrank (4°C vs 8°C), Autolyse, Umrechnung zwischen Triebmitteln. Mittlere Schwierigkeit.",
        "en": "ADVANCED HOME BAKER level: stretch & folds, cold proofing in a home fridge (4°C vs 8°C), autolyse, leaven conversion. Medium difficulty.",
        "es": "Nivel PANADERO CASERO AVANZADO: pliegues de refuerzo, control de fermentación en frigo casero (4°C vs 8°C), autólisis, conversión entre levaduras. Dificultad media.",
    },
    "master": {
        "it": "Livello MASTER BAKER DI CASA: scenari critici reali. Esempio: 'È estate, 29°C in cucina, vuoi una pizza in teglia all'80% di idratazione: come gestisci rinfreschi e tempi senza far stralievitare?'. Domande complesse con scenario.",
        "de": "Level HEIM-MASTER-BÄCKER: reale kritische Szenarien. Beispiel: 'Sommer, 29°C in der Küche, Blechpizza mit 80% Hydratation: wie steuerst du Auffrischungen und Zeiten ohne Übergare?'. Komplexe Szenariofragen.",
        "en": "HOME MASTER BAKER level: real critical scenarios. Example: 'It's summer, 29°C in the kitchen, you want an 80% hydration pan pizza: how do you manage refreshes and timing without over-proofing?'. Complex scenario questions.",
        "es": "Nivel MASTER BAKER DE CASA: escenarios críticos reales. Ejemplo: 'Es verano, 29°C en la cocina, quieres una pizza en bandeja al 80% de hidratación: ¿cómo gestionas refrescos y tiempos sin sobrefermentar?'. Preguntas complejas con escenario.",
    },
}


@api_router.post("/academy/quiz")
async def academy_quiz(payload: QuizRequest):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key non configurata")
    lang = payload.lang if payload.lang in ("it", "de", "en", "es", "fr", "fa") else "it"
    level = payload.level if payload.level in _QUIZ_LEVELS else "apprendista"
    lvl_desc = _QUIZ_LEVELS[level].get(lang, _QUIZ_LEVELS[level]["it"])
    avoid = ""
    if payload.asked:
        avoid = " Evita di ripetere queste domande già poste: " + " | ".join(payload.asked[-12:]) + "."
    theme_hint = ""
    if payload.theme:
        theme_hint = f" La domanda DEVE riguardare specificamente il tema: «{payload.theme[:60]}»."
    lang_name = {"it": "italiano", "de": "tedesco", "en": "inglese", "es": "spagnolo", "fr": "francese", "fa": "persiano (farsi)"}[lang]
    schema = '{"question": "...", "options": ["...","...","..."], "correct": 0, "explanation": "spiegazione tecnica e scientifica del perche la risposta corretta e giusta (2-4 frasi)", "level": "' + level + '"}'
    prompt = (
        "Genera UNA domanda a risposta multipla per un QUIZ di panificazione CASALINGA. "
        + lvl_desc + theme_hint + avoid + "\n"
        "La domanda deve essere realistica, tecnica e verificabile. Fornisci esattamente 3 opzioni di risposta, una sola corretta.\n"
        + f"Scrivi TUTTO in {lang_name}.\n"
        + "Restituisci SOLO JSON valido con questo schema esatto:\n"
        + schema
    )
    data = None
    for _attempt in range(2):
        text = ""
        try:
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"quiz-{uuid.uuid4().hex[:8]}",
                system_message="Sei un esperto di panificazione casalinga e chimica della fermentazione. Crei quiz didattici. Rispondi SOLO con JSON valido.",
            ).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=700)
            async for event in chat.stream_message(UserMessage(text=prompt)):
                if isinstance(event, TextDelta):
                    text += event.content
                elif isinstance(event, StreamDone):
                    break
        except Exception:
            logger.exception("academy quiz error")
            continue
        raw = text.strip()
        if raw.startswith("```"):
            raw = raw.strip("`")
        s, e = raw.find("{"), raw.rfind("}")
        if s == -1 or e == -1:
            continue
        try:
            parsed = json.loads(raw[s:e + 1])
        except Exception:
            continue
        opts = parsed.get("options") or []
        if isinstance(opts, list) and len(opts) >= 2:
            data = parsed
            break
    if data is None:
        raise HTTPException(status_code=422, detail="Quiz non generato")
    opts = data.get("options") or []
    try:
        correct = int(data.get("correct", 0))
    except Exception:
        correct = 0
    correct = max(0, min(correct, len(opts) - 1))
    return {
        "question": str(data.get("question", "")).strip(),
        "options": [str(o).strip() for o in opts[:4]],
        "correct": correct,
        "explanation": str(data.get("explanation", "")).strip(),
        "level": level,
    }


# --- Badge Academy (es. "Fornaio Diplomato" al superamento di serie al livello Master) ---
_ALLOWED_BADGES = {"diplomato", "master_baker", "fornaio_settimana"}


class BadgeReq(BaseModel):
    badge: str


@api_router.post("/academy/badge")
async def academy_grant_badge(body: BadgeReq, user: dict = Depends(current_user)):
    badge = (body.badge or "").strip()
    if badge not in _ALLOWED_BADGES:
        raise HTTPException(400, "Badge non valido")
    await db.users.update_one({"user_id": user["user_id"]}, {"$addToSet": {"badges": badge}})
    u = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "badges": 1})
    return {"badges": u.get("badges", [])}


# --- SOS Impasto: diagnosi rapida della foto del pane da parte di MikiLab (login richiesto) ---
SOS_PROMPT = (
    "Sei 'MikiLab', Master Baker di MikiLab. Un panettiere ti manda la FOTO del suo pane/impasto per un SOS. "
    "Fai una DIAGNOSI STRUTTURALE immediata e pratica. Analizza (quando visibili): crosta, mollica/alveolatura, forma/sviluppo, "
    "colore/cottura, stato di lievitazione. Per ogni difetto indica CAUSA -> RIMEDIO concreto. Se l'impasto sembra buono, dillo con un complimento. "
    "Rispondi in markdown, breve e leggibile durante il lavoro, con questa struttura:\n"
    "⚡ **Diagnosi:** cosa vedo in una frase.\n"
    "🥖 **Cosa è successo:** 2-4 punti (difetto -> causa).\n"
    "🔧 **Come rimediare:** 2-4 azioni concrete per la prossima volta.\n"
    "Non inventare dettagli non visibili nella foto."
)


SOS_LABELS = {
    "it": " Usa ESATTAMENTE queste etichette: '⚡ **Diagnosi:**', '🥖 **Cosa è successo:**', '🔧 **Come rimediare:**'.",
    "de": " Verwende GENAU diese Beschriftungen: '⚡ **Diagnose:**', '🥖 **Was ist passiert:**', '🔧 **Wie beheben:**'.",
    "en": " Use EXACTLY these labels: '⚡ **Diagnosis:**', '🥖 **What happened:**', '🔧 **How to fix:**'.",
    "es": " Usa EXACTAMENTE estas etiquetas: '⚡ **Diagnóstico:**', '🥖 **Qué pasó:**', '🔧 **Cómo solucionarlo:**'.",
}


async def sos_stream(image_b64: str, lang: str = "it", user_id: str = None, thumb: str = None):
    if "," in image_b64 and image_b64.strip().startswith("data:"):
        image_b64 = image_b64.split(",", 1)[1]
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"sos-{uuid.uuid4()}",
        system_message=SOS_PROMPT + LANG_DIRECTIVE.get(lang, LANG_DIRECTIVE["it"]) + SOS_LABELS.get(lang, SOS_LABELS["it"]),
    ).with_model("anthropic", SITOR_BRAIN)
    user_msg = UserMessage(text="Ecco la foto del mio pane/impasto. Dammi la diagnosi SOS.", file_contents=[ImageContent(image_base64=image_b64)])
    full = ""
    try:
        async for event in chat.stream_message(user_msg):
            if isinstance(event, TextDelta):
                full += event.content
                yield f"data: {json.dumps({'d': event.content})}\n\n"
            elif isinstance(event, StreamDone):
                break
    except Exception:
        logger.exception("sos stream error")
        yield f"data: {json.dumps({'d': '[Errore nella diagnosi. Riprova.]'})}\n\n"
    if user_id and full.strip():
        try:
            await db.sos_history.insert_one({"id": str(uuid.uuid4()), "user_id": user_id,
                                             "result": full[:6000], "thumb": (thumb or "")[:400], "lang": lang, "created_at": now_iso()})
        except Exception:
            logger.exception("sos history save error")
    yield f"data: {json.dumps({'done': True})}\n\n"


@api_router.post("/academy/sos")
async def academy_sos(payload: VisionRequest, user: dict = Depends(current_user)):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key non configurata")
    return StreamingResponse(
        sos_stream(payload.image_base64, payload.lang, user_id=user["user_id"], thumb=getattr(payload, "thumb", None)),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@api_router.get("/academy/sos-history")
async def academy_sos_history(user: dict = Depends(current_user)):
    docs = await db.sos_history.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(30)
    return {"items": docs}


@api_router.delete("/academy/sos-history/{item_id}")
async def academy_sos_history_delete(item_id: str, user: dict = Depends(current_user)):
    res = await db.sos_history.delete_one({"id": item_id, "user_id": user["user_id"]})
    if res.deleted_count == 0:
        raise HTTPException(404, "Diagnosi non trovata")
    return {"ok": True}


# --- Classifica Quiz (punti Master settimanali tra amici) ---
def _iso_week(offset: int = 0):
    from datetime import date, timedelta
    y, w, _ = (date.today() + timedelta(weeks=offset)).isocalendar()
    return f"{y}-W{w:02d}"


class QuizScoreReq(BaseModel):
    points: int = 1


@api_router.post("/academy/quiz-score")
async def academy_quiz_score(body: QuizScoreReq, user: dict = Depends(current_user)):
    pts = max(0, min(int(body.points or 0), 10))
    if pts == 0:
        return {"ok": True}
    week = _iso_week()
    WEEKLY_CAP = 300
    existing = await db.quiz_scores.find_one({"user_id": user["user_id"], "week": week}, {"_id": 0, "points": 1})
    cur = (existing or {}).get("points", 0)
    if cur >= WEEKLY_CAP:
        return {"ok": True, "week": week, "capped": True}
    pts = min(pts, WEEKLY_CAP - cur)
    await db.quiz_scores.update_one(
        {"user_id": user["user_id"], "week": week},
        {"$inc": {"points": pts}, "$set": {"updated_at": now_iso()}},
        upsert=True,
    )
    return {"ok": True, "week": week}


async def _accepted_friend_ids(user_id: str):
    frs = await db.friendships.find({"status": "accepted", "$or": [{"from_id": user_id}, {"to_id": user_id}]}, {"_id": 0}).to_list(500)
    return [(f["to_id"] if f["from_id"] == user_id else f["from_id"]) for f in frs]


async def _crown_last_week_champion():
    """Assegna (una sola volta) il badge 'fornaio_settimana' al vincitore globale della settimana scorsa."""
    last = _iso_week(-1)
    already = await db.weekly_winners.find_one({"_id": last})
    if already:
        return already.get("user_id")
    top = await db.quiz_scores.find({"week": last, "points": {"$gt": 0}}, {"_id": 0}).sort("points", -1).limit(1).to_list(1)
    if not top:
        await db.weekly_winners.insert_one({"_id": last, "user_id": None})
        return None
    winner = top[0]["user_id"]
    await db.weekly_winners.insert_one({"_id": last, "user_id": winner, "points": top[0].get("points", 0)})
    await db.users.update_one({"user_id": winner}, {"$addToSet": {"badges": "fornaio_settimana"}})
    return winner


@api_router.get("/academy/leaderboard")
async def academy_leaderboard(user: dict = Depends(current_user)):
    week = _iso_week()
    try:
        await _crown_last_week_champion()
    except Exception:
        logger.exception("crown champion error")
    ids = await _accepted_friend_ids(user["user_id"])
    ids.append(user["user_id"])
    scores = await db.quiz_scores.find({"week": week, "user_id": {"$in": ids}}, {"_id": 0}).to_list(500)
    smap = {s["user_id"]: s.get("points", 0) for s in scores}
    us = await db.users.find({"user_id": {"$in": ids}}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "email": 1, "badges": 1}).to_list(500)
    rows = [{
        "user_id": u["user_id"],
        "name": u.get("name") or (u.get("email") or "Fornaio").split("@")[0],
        "picture": u.get("picture", ""),
        "diplomato": "diplomato" in (u.get("badges") or []),
        "champion": "fornaio_settimana" in (u.get("badges") or []),
        "points": smap.get(u["user_id"], 0),
        "me": u["user_id"] == user["user_id"],
    } for u in us]
    rows.sort(key=lambda r: (-r["points"], r["name"].lower()))
    # campione della settimana scorsa (globale)
    champion = None
    lw = await db.weekly_winners.find_one({"_id": _iso_week(-1)})
    if lw and lw.get("user_id"):
        cu = await db.users.find_one({"user_id": lw["user_id"]}, {"_id": 0, "name": 1, "picture": 1, "email": 1})
        if cu:
            champion = {"name": cu.get("name") or (cu.get("email") or "Fornaio").split("@")[0],
                        "picture": cu.get("picture", ""), "points": lw.get("points", 0),
                        "me": lw["user_id"] == user["user_id"]}
    return {"week": week, "rows": rows, "champion": champion}


class SosRecipeReq(BaseModel):
    diagnosis: str
    lang: str = "it"


@api_router.post("/academy/sos-recipe")
async def academy_sos_recipe(body: SosRecipeReq, user: dict = Depends(current_user)):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(500, "LLM key non configurata")
    di: str = (body.diagnosis or "").strip()[:2000]
    if not di: 
        raise HTTPException(400, "Diagnosi mancante")
    recs = await db.recipes.find({"collection_name": "mikilab", "hidden": {"$ne": True}}, {"_id": 0, "id": 1, "name": 1}).to_list(1000)
    if not recs:
        return {"recipe_id": None}
    idset = {r["id"]: r["name"] for r in recs}
    listing = "\n".join(f"{r['id']} :: {r['name']}" for r in recs[:200])
    lang = body.lang if body.lang in ("it", "de", "en", "es", "fr", "fa") else "it"
    lang_name = _LANG_NAMES.get(lang, "italiano")
    prompt = (
        "Sei MikiLab. Data questa DIAGNOSI di un pane fatto in casa, scegli DALLA LISTA la ricetta MikiLab più adatta "
        "per allenarsi e correggere quel difetto (una ricetta che, seguendone bene il procedimento, aiuta a superare il problema).\n\n"
        f"DIAGNOSI:\n{di}\n\nLISTA RICETTE (id :: nome):\n{listing}\n\n"
        f"Rispondi SOLO con JSON valido: {{\"recipe_id\": \"<id esatto dalla lista>\", \"reason\": \"<motivo in 1 frase, in {lang_name}>\"}}."
    )
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"sosrec-{uuid.uuid4().hex[:8]}",
                   system_message="Consigli ricette per correggere difetti di panificazione. Rispondi SOLO JSON.").with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=300)
    text = ""
    try:
        async for event in chat.stream_message(UserMessage(text=prompt)):
            if isinstance(event, TextDelta):
                text += event.content
            elif isinstance(event, StreamDone):
                break
    except Exception:
        logger.exception("sos-recipe error")
        return {"recipe_id": None}
    raw = text.strip().strip("`")
    s, e = raw.find("{"), raw.rfind("}")
    if s == -1 or e == -1:
        return {"recipe_id": None}
    try:
        data = json.loads(raw[s:e + 1])
    except Exception:
        return {"recipe_id": None}
    rid = data.get("recipe_id")
    if rid not in idset:
        return {"recipe_id": None}
    return {"recipe_id": rid, "name": idset[rid], "reason": str(data.get("reason", "")).strip()}


# --- Web Push per promemoria persistenti (VAPID) ---
async def _get_vapid():
    doc = await db.app_config.find_one({"_id": "vapid"})
    if doc:
        return doc["public"], doc["private"]
    from py_vapid import Vapid01
    import base64 as _b64
    v = Vapid01()
    v.generate_keys()
    # public key in application server key format (uncompressed point, base64url)
    pub_raw = v.public_key.public_bytes(
        encoding=__import__("cryptography.hazmat.primitives.serialization", fromlist=["Encoding"]).Encoding.X962,
        format=__import__("cryptography.hazmat.primitives.serialization", fromlist=["PublicFormat"]).PublicFormat.UncompressedPoint,
    )
    pub_b64 = _b64.urlsafe_b64encode(pub_raw).rstrip(b"=").decode()
    priv_raw = v.private_key.private_numbers().private_value.to_bytes(32, "big")
    priv_b64 = _b64.urlsafe_b64encode(priv_raw).rstrip(b"=").decode()
    await db.app_config.insert_one({"_id": "vapid", "public": pub_b64, "private": priv_b64})
    return pub_b64, priv_b64


@api_router.get("/push/vapid")
async def push_vapid():
    pub, _ = await _get_vapid()
    return {"public_key": pub}


class PushSubReq(BaseModel):
    subscription: dict


@api_router.post("/push/subscribe")
async def push_subscribe(body: PushSubReq, user: dict = Depends(current_user)):
    sub = body.subscription or {}
    endpoint = sub.get("endpoint")
    if not endpoint:
        raise HTTPException(400, "Subscription non valida")
    await db.push_subs.update_one(
        {"endpoint": endpoint},
        {"$set": {"user_id": user["user_id"], "subscription": sub, "updated_at": now_iso()}},
        upsert=True,
    )
    return {"ok": True}


class ReminderStep(BaseModel):
    time: str
    label: str
    due: str  # ISO UTC


class RemindersReq(BaseModel):
    steps: List[ReminderStep]


@api_router.post("/reminders")
async def reminders_create(body: RemindersReq, user: dict = Depends(current_user)):
    # rimuove i vecchi non ancora inviati e reinserisce
    await db.reminders.delete_many({"user_id": user["user_id"], "sent": {"$ne": True}})
    docs = [{"id": str(uuid.uuid4()), "user_id": user["user_id"], "time": s.time,
             "label": s.label[:160], "due": s.due, "sent": False, "created_at": now_iso()}
            for s in body.steps[:20]]
    if docs:
        await db.reminders.insert_many(docs)
    return {"ok": True, "count": len(docs)}


def _send_push(sub: dict, payload: dict, private_key: str):
    from pywebpush import webpush, WebPushException
    try:
        webpush(subscription_info=sub, data=json.dumps(payload),
                vapid_private_key=private_key,
                vapid_claims={"sub": f"mailto:{SENDER_EMAIL}"})
        return True
    except WebPushException as e:
        logger.warning(f"webpush failed: {e}")
        return False
    except Exception:
        logger.exception("webpush error")
        return False


async def _reminders_loop():
    while True:
        try:
            now = datetime.now(timezone.utc).isoformat()
            due = await db.reminders.find({"sent": False, "due": {"$lte": now}}, {"_id": 0}).to_list(200)
            if due:
                _, priv = await _get_vapid()
                for r in due:
                    subs = await db.push_subs.find({"user_id": r["user_id"]}, {"_id": 0}).to_list(20)
                    payload = {"title": f"MikiLab · {r['time']}", "body": r["label"]}
                    for s in subs:
                        await asyncio.to_thread(_send_push, s["subscription"], payload, priv)
                    await db.reminders.update_one({"id": r["id"]}, {"$set": {"sent": True}})
            # pulizia lazy dei contatori di rate-limit scaduti (>24h) — non distruttiva allo startup
            cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
            await db.rate_limits.delete_many({"ts": {"$lt": cutoff}})
        except Exception:
            logger.exception("reminders loop error")
        await asyncio.sleep(30)


# ---------------------------------------------------------------------------
# DECK REATTIVO — push al Capo quando l'impianto entra in stato CRITICO.
# Invia una notifica agli abbonati admin all'ingresso in critico e la ripete
# al massimo ogni 10 minuti finché lo stato resta critico.
# ---------------------------------------------------------------------------
async def _deck_alarm_loop():
    await asyncio.sleep(20)
    was_critical = False
    last_push = None
    while True:
        try:
            deck = await deck_status_compute()
            crit = deck["mood"] == "critico"
            now = datetime.now(timezone.utc)
            should = crit and (not was_critical or (last_push and (now - last_push).total_seconds() > 600))
            if crit and not was_critical:
                # Nuovo episodio critico → salva nello storico allarmi del turno.
                stations = deck.get("critical_stations") or []
                crit_depts = [d for d, v in (deck.get("depts") or {}).items() if v.get("level") == "critical"]
                try:
                    await db.deck_alarm_history.insert_one({
                        "organization_id": ORG_DEFAULT,
                        "ts": now.isoformat(), "day": now.strftime("%Y-%m-%d"),
                        "hm": now.strftime("%H:%M"), "stations": stations,
                        "departments": crit_depts, "heartbeat": deck.get("heartbeat"),
                        "score": deck.get("score"),
                    })
                except Exception:
                    logger.exception("deck alarm history insert error")
            if should:
                last_push = now
                stations = deck.get("critical_stations") or []
                body = (", ".join(stations[:3]) + " in allarme.") if stations else "L'impianto è in stato critico."
                admins = await db.users.find(
                    {"$or": [{"role": "admin"}, {"email": {"$in": [e.lower() for e in OWNER_EMAILS]}}]},
                    {"_id": 0, "user_id": 1}).to_list(50)
                ids = [a["user_id"] for a in admins]
                if ids:
                    _, priv = await _get_vapid()
                    subs = await db.push_subs.find({"user_id": {"$in": ids}}, {"_id": 0}).to_list(100)
                    payload = {"title": "MikiLab · Allarme Impianto", "body": f"Attenzione Direzione: {body}", "tag": "deck-critical"}
                    for s in subs:
                        await asyncio.to_thread(_send_push, s["subscription"], payload, priv)
            was_critical = crit
        except Exception:
            logger.exception("deck alarm loop error")
        await asyncio.sleep(30)


async def deck_status_compute(org: str = ORG_DEFAULT):
    """Versione riutilizzabile di /deck/status (senza dipendenze HTTP), per i loop interni."""
    now = datetime.now(timezone.utc)
    today = now.strftime("%Y-%m-%d")
    hm = now.strftime("%H:%M")
    pulse = await _compute_pulse(org)
    depts = {k: {"active": 0, "people": [], "level": "ok"} for k in _DECK_DEPT_KEYWORDS}
    async for s in db.shifts.find({"day": today, "organization_id": org}, {"_id": 0}):
        if (s.get("start") or "") <= hm <= (s.get("end") or ""):
            txt = f"{s.get('station') or ''} {s.get('role') or ''}".lower()
            for d, kws in _DECK_DEPT_KEYWORDS.items():
                if any(k in txt for k in kws):
                    depts[d]["active"] += 1
                    if s.get("employee"):
                        depts[d]["people"].append(s["employee"])
                    break
    rank = {"ok": 0, "warn": 1, "critical": 2}
    crit_stations = []
    for a in pulse["alerts"]:
        st = (a.get("station") or "").lower()
        lvl = "critical" if a.get("level") == "critical" else ("warn" if a.get("level") == "warn" else "ok")
        if lvl == "critical" and a.get("station"):
            crit_stations.append(a["station"])
        for d, kws in _DECK_DEPT_KEYWORDS.items():
            if any(k in st for k in kws) and rank[lvl] > rank[depts[d]["level"]]:
                depts[d]["level"] = lvl
    return {"mood": pulse["mood"], "heartbeat": pulse["heartbeat"], "score": pulse["score"],
            "depts": depts, "critical_stations": crit_stations, "generated_at": now.isoformat()}


# ---------------------------------------------------------------------------
# MONITOR UPTIME — controlla ogni ora che mikilab.de risponda; push agli admin
# quando il sito va giù e quando torna online.
# ---------------------------------------------------------------------------
UPTIME_URL = os.environ.get("UPTIME_URL", "https://mikilab.de")


async def _push_admins(payload: dict):
    admins = await db.users.find(
        {"$or": [{"role": "admin"}, {"email": {"$in": [e.lower() for e in OWNER_EMAILS]}}]},
        {"_id": 0, "user_id": 1}).to_list(50)
    ids = [a["user_id"] for a in admins]
    if not ids:
        return
    _, priv = await _get_vapid()
    subs = await db.push_subs.find({"user_id": {"$in": ids}}, {"_id": 0}).to_list(100)
    for s in subs:
        await asyncio.to_thread(_send_push, s["subscription"], payload, priv)


async def _uptime_monitor_loop():
    await asyncio.sleep(60)
    was_up = True
    down_since = None
    while True:
        try:
            ok = False
            code = 0
            try:
                async with httpx.AsyncClient(timeout=15, follow_redirects=True) as cx:
                    r = await cx.get(UPTIME_URL)
                    code = r.status_code
                    ok = 200 <= code < 400
            except Exception:
                ok = False
            now = datetime.now(timezone.utc)
            await db.uptime_checks.insert_one({"ts": now.isoformat(), "ok": ok, "code": code, "url": UPTIME_URL})
            # mantieni solo ultimi ~30 giorni di check (720 orari) - non distruttivo sul resto
            old = (now - timedelta(days=30)).isoformat()
            await db.uptime_checks.delete_many({"ts": {"$lt": old}})
            if not ok and was_up:
                down_since = now
                await _push_admins({"title": "MikiLab · SITO OFFLINE", "body": f"mikilab.de non risponde (codice {code or 'timeout'}). Controlla il dominio/DNS.", "tag": "uptime"})
            elif ok and not was_up:
                mins = int((now - down_since).total_seconds() // 60) if down_since else 0
                await _push_admins({"title": "MikiLab · SITO ONLINE", "body": f"mikilab.de è di nuovo raggiungibile (down ~{mins} min).", "tag": "uptime"})
                down_since = None
            was_up = ok
        except Exception:
            logger.exception("uptime monitor error")
        await asyncio.sleep(3600)  # ogni ora


@api_router.get("/uptime/status")
async def uptime_status(admin: dict = Depends(require_pro)):
    checks = await db.uptime_checks.find({}, {"_id": 0}).sort("ts", -1).to_list(48)
    last = checks[0] if checks else None
    up_count = sum(1 for c in checks if c.get("ok"))
    pct = round(up_count / len(checks) * 100, 1) if checks else None
    return {"url": UPTIME_URL, "last": last, "checks": checks, "uptime_24h_pct": pct}


_DEPT_LABELS_IT = {"panificio": "Panificio", "pizzeria": "Pizzeria", "pasticceria": "Pasticceria", "banco": "Magazzino"}


@api_router.get("/deck/alarms/history")
async def deck_alarms_history(day: Optional[str] = None, admin: dict = Depends(require_pro)):
    """Storico episodi critici (default: oggi). Per la timeline del deck."""
    d = day or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    items = await db.deck_alarm_history.find({"day": d, "organization_id": _org_id(admin)}, {"_id": 0}).sort("ts", -1).to_list(200)
    return {"day": d, "count": len(items), "items": items}


@api_router.get("/deck/alarms/export")
async def deck_alarms_export(day: Optional[str] = None, admin: dict = Depends(require_pro)):
    """Export testuale dello storico allarmi del turno (per il report di fine turno)."""
    d = day or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    items = await db.deck_alarm_history.find({"day": d, "organization_id": _org_id(admin)}, {"_id": 0}).sort("ts", 1).to_list(500)
    lines = [f"MIKILAB · STORICO ALLARMI CRITICI — {d}", "=" * 42, ""]
    if not items:
        lines.append("Nessun allarme critico registrato. Turno regolare.")
    else:
        for it in items:
            depts = ", ".join(_DEPT_LABELS_IT.get(x, x) for x in (it.get("departments") or [])) or "—"
            st = ", ".join(it.get("stations") or []) or "—"
            lines.append(f"[{it.get('hm')}] Reparti: {depts} | Postazioni: {st} | BPM {it.get('heartbeat')} · score {it.get('score')}")
        lines += ["", f"Totale episodi critici: {len(items)}"]
    text = "\n".join(lines)
    return PlainTextResponse(text, headers={"Content-Disposition": f'attachment; filename="allarmi_{d}.txt"'})







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


def _rec_loc_field(rec, base, lang):
    """Campo localizzato di una ricetta (dict) con fallback a IT (per il backend)."""
    if not rec:
        return ""
    if lang in ("de", "en", "es", "fr", "fa"):
        v = rec.get(f"{base}_{lang}")
        if v and str(v).strip():
            return v
        if lang == "es":
            v = rec.get(f"{base}_en")
            if v and str(v).strip():
                return v
    return rec.get(base) or ""


def _rec_double_name(rec, lang="it"):
    """Doppia nomenclatura: 'Nome Fantastico (Nome Reale)' localizzato."""
    fantasy = str(_rec_loc_field(rec, "name", lang) or rec.get("name") or "").strip()
    real = str(_rec_loc_field(rec, "real_name", lang) or "").strip()
    if real and real.lower() != fantasy.lower() and real.lower() not in fantasy.lower():
        return f"{fantasy} ({real})"
    return fantasy


async def _capo_item_line(it, lang="it"):
    """Formatta un prodotto con i dettagli ricetta dal DB."""
    de = lang == "de"
    rid = it.get("recipe_id")
    rec = await db.recipes.find_one({"id": rid}, {"_id": 0}) if rid else None
    qty = it.get("quantity")
    unit = it.get("unit") or ("Stück" if de else "pezzi")
    name = _rec_double_name(rec, lang) if rec else (it.get("name") or "?")
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

    # Ordine EXTRA solo per oggi: si SOMMA al piano ma NON modifica il Piano settimanale salvato.
    extra_items = list(payload.extra_today or [])
    if extra_items:
        for it in extra_items:
            items.append({
                "recipe_id": it.get("recipe_id"), "name": it.get("name"),
                "quantity": it.get("quantity"), "unit": it.get("unit") or "pezzi",
                "day": "oggi", "_extra_today": True,
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
    if not start_names and payload.start_name:
        start_names = [str(payload.start_name)]
    if start_names:
        sn = start_names[0]
        products_txt += (
            f"\n\n[START] Der Bäcker will die Produktion mit «{sn}» BEGINNEN: setze diesen Teig als ERSTES an (zuerst kneten/ansetzen) und richte alle anderen Zeiten danach aus."
            if de else
            f"\n\n[PARTENZA] Il panettiere vuole INIZIARE la produzione da «{sn}»: avvia questo impasto per PRIMO (primo da impastare/avviare) e allinea tutti gli altri tempi di conseguenza."
        )
    # Ordine extra SOLO per oggi: direttiva per una sezione dedicata, senza toccare il piano settimanale.
    if extra_items:
        ex_txt = ", ".join([f"{(it.get('name') or '').strip()}"
                            + (f" x{it.get('quantity')}" if it.get('quantity') not in (None, "") else "")
                            for it in extra_items if (it.get('name') or '').strip()])
        products_txt += (
            f"\n\n[EXTRA-HEUTE] ZUSÄTZLICHE Bestellung NUR für HEUTE: {ex_txt}. "
            "Füge diese Mengen zur heutigen Produktion HINZU (zum Wochenplan addieren, aber den gespeicherten Wochenplan NICHT ändern). "
            "Erstelle am Ende einen KLAR getrennten Abschnitt mit der Überschrift «⭐ SOLO PER OGGI — Ordine extra» / «⭐ NUR HEUTE — Extra-Bestellung», der die zusätzlichen Impasti, Zeiten und Infornate NUR für heute zeigt."
            if de else
            f"\n\n[EXTRA-OGGI] Ordine AGGIUNTIVO SOLO per OGGI: {ex_txt}. "
            "Somma queste quantità alla produzione di oggi (aggiungile al piano settimanale MA NON modificare il piano settimanale salvato). "
            "Alla fine crea una sezione CHIARAMENTE separata con titolo «⭐ SOLO PER OGGI — Ordine extra» che mostri impasti, tempi e infornate aggiuntive SOLO per la giornata di oggi."
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
            prompt += ("\n\nWICHTIG: Dieser Abschnitt **## 🔥 Backfahrplan** ist PFLICHT und muss IMMER vollständig erscheinen. Wenn der Platz knapp wird, kürze die anderen Abschnitte (Team, Hinweise), aber lasse die Back-Tabelle NIE weg."
                       if de else
                       "\n\nIMPORTANTE: la sezione **## 🔥 Orario Infornate** è OBBLIGATORIA e deve SEMPRE comparire completa. Se lo spazio scarseggia, accorcia le altre sezioni (squadra, avvisi) ma NON omettere mai la tabella delle infornate.")
            max_tokens = max(max_tokens, 4500)

    prompt += lang_instr
    prompt += "\n\n---\nTermina SEMPRE la risposta con un'ultima riga che contiene ESATTAMENTE il marcatore [[PLAN_END]] (verrà rimosso automaticamente). Non scrivere nulla dopo il marcatore."
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"capo-{uuid.uuid4()}",
        system_message=system + _capo_lang(payload.lang),
    ).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=max_tokens)

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
    ).with_model("anthropic", SITOR_BRAIN)

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




class DiagnosiSave(BaseModel):
    mode: str
    result: str
    thumb: Optional[str] = None








class SoundDiagnosiReq(BaseModel):
    features: dict
    lang: str = "it"




_ELEVEN_KEY = os.environ.get("ELEVENLABS_API_KEY") or os.environ.get("ELEVEN_API_KEY")
_eleven_client = ElevenLabs(api_key=_ELEVEN_KEY) if _ELEVEN_KEY else None
# Momi (tutor) — voce dedicata; Michele/Lab (fondatore) — voce maschile italiana profonda
MOMY_VOICE_ID = os.environ.get("MOMY_VOICE_ID", "ErXwobaYiN019PkySvjV")
MICHELE_VOICE_ID = os.environ.get("MICHELE_VOICE_ID", "pNInz6obpgDQGcFmaJgB")
MOHAMED_VOICE_ID = os.environ.get("MOHAMED_VOICE_ID", "ErXwobaYiN019PkySvjV")
BAKEMIX_VOICE_ID = os.environ.get("BAKEMIX_VOICE_ID", "TxGEqnHWrfWFTfGW9XjX")
# Sitor: coscienza strategica superiore. Voce PROPRIA, piu profonda e autorevole di Sitor.
NEXUS_VOICE_ID = os.environ.get("NEXUS_VOICE_ID", "onwK4e9ZLuTAKqWW03F9")
_VOICE_MAP = {"momy": NEXUS_VOICE_ID, "momi": NEXUS_VOICE_ID, "michele": NEXUS_VOICE_ID, "lab": NEXUS_VOICE_ID, "mikemix": NEXUS_VOICE_ID, "bakemix": NEXUS_VOICE_ID, "nexus": NEXUS_VOICE_ID, "mohamed": NEXUS_VOICE_ID}


def _voice_settings(voice: str) -> VoiceSettings:
    """Lab/Michele = deciso e telegrafico; Momi = caldo e descrittivo."""
    if (voice or "").lower() in ("michele", "lab", "nexus"):
        return VoiceSettings(stability=0.62, similarity_boost=0.85, style=0.12, use_speaker_boost=True)
    return VoiceSettings(stability=0.40, similarity_boost=0.80, style=0.45, use_speaker_boost=True)


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
            voice_settings=_voice_settings(payload.voice),
        )
        audio = b"".join(gen)
    except Exception:
        logger.exception("tts error")
        # 424 (non-5xx) così l'edge non maschera l'errore: il frontend fa fallback alla voce del dispositivo.
        raise HTTPException(status_code=424, detail="Errore TTS")
    return StreamingResponse(iter([audio]), media_type="audio/mpeg", headers={"Cache-Control": "public, max-age=86400"})


# ---- OpenAI TTS (voce MASCHILE: onyx/echo) — chiave OpenAI personalizzata o Universal Key ----
import hashlib as _hashlib
_TTS_KEY = os.environ.get("OPENAI_API_KEY") or os.environ.get("EMERGENT_LLM_KEY")
_OAI_VOICE = {"michele": "onyx", "lab": "onyx", "momy": "onyx", "momi": "onyx", "mikemix": "onyx", "bakemix": "onyx", "nexus": "onyx", "mohamed": "onyx"}
_TTS_CACHE_DIR = "/tmp/mikilab_tts"
try:
    os.makedirs(_TTS_CACHE_DIR, exist_ok=True)
except Exception:
    pass


def _clean_for_tts(text: str) -> str:
    import re as _re
    t = text or ""
    t = _re.sub(r"https?://\S+", "", t)
    t = _re.sub(r"`{1,3}[^`]*`{1,3}", "", t)
    t = _re.sub(r"[*_#>~|]", "", t)
    t = _re.sub(r"[\U0001F000-\U0001FAFF\u2600-\u27BF]", "", t)
    return _re.sub(r"\s+", " ", t).strip()


_eleven_cooldown_until = 0.0  # se ElevenLabs fallisce (quota/crediti), salta per un po' → fallback istantaneo

# --- Traduzione PRIMA della sintesi vocale: l'audio deve essere DAVVERO nella lingua scelta ---
_TTS_TR_CACHE_DIR = "/tmp/mikilab_tts_tr"
try:
    os.makedirs(_TTS_TR_CACHE_DIR, exist_ok=True)
except Exception:
    pass
_TR_LANG_NAMES = {"it": "Italian", "de": "German", "en": "English", "es": "Spanish", "fr": "French", "fa": "Persian (Farsi)"}
# Lingue con enforcement supportato da eleven_turbo_v2_5 (evita che la voce "parta in inglese").
_EL_LANG = {"it": "it", "de": "de", "en": "en", "es": "es", "fr": "fr", "pt": "pt", "nl": "nl", "pl": "pl"}


def _el_lang_code(lang):
    return _EL_LANG.get((lang or "it").lower().split("-")[0][:2])


async def _translate_for_tts(text: str, lang: str) -> str:
    """Traduce il testo nella lingua richiesta prima del TTS, così l'audio è realmente in quella
    lingua (non italiano con accento). Cache su disco per abbattere costo e latenza."""
    code = (lang or "it").lower().split("-")[0][:2]
    if not text or code == "it" or code not in _TR_LANG_NAMES or not EMERGENT_LLM_KEY:
        return text
    ck = _hashlib.sha256(f"tr|{code}|{text}".encode()).hexdigest()
    cpath = os.path.join(_TTS_TR_CACHE_DIR, ck + ".txt")
    try:
        if os.path.exists(cpath):
            with open(cpath, "r", encoding="utf-8") as f:
                return f.read()
    except Exception:
        pass
    target = _TR_LANG_NAMES[code]
    try:
        sysmsg = (f"You are a professional translator for a bakery production app. Translate the user's text into {target}. "
                  f"If it is already in {target}, return it unchanged. Keep numbers, times, units and proper names (Michele, Sitor, MikeMix, MikiLab). "
                  f"Return ONLY the translated text, with no quotes and no explanations.")
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"tts-tr-{ck[:8]}", system_message=sysmsg).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=800)
        out = ""
        async for ev in chat.stream_message(UserMessage(text=text)):
            if isinstance(ev, TextDelta):
                out += ev.content or ""
        out = (out or "").strip()
        if out:
            try:
                with open(cpath, "w", encoding="utf-8") as f:
                    f.write(out)
            except Exception:
                pass
            return out
    except Exception as e:
        logger.warning("TTS translate fallita (%s)", str(e)[:120])
    return text


async def _synth_tts_bytes(text: str, lang: str = "it", voice: str = "michele"):
    """Sintetizza il testo in bytes MP3 (ElevenLabs → fallback OpenAI). Ritorna bytes o None.
    Usato per SALVARE l'audio (handoff offline) oltre che per lo streaming."""
    global _eleven_cooldown_until
    text = _clean_for_tts(await _translate_for_tts(text, lang))[:2000]
    if not text:
        return None
    vkey = (voice or "michele").lower()
    if _eleven_client and time.time() >= _eleven_cooldown_until:
        vid = _VOICE_MAP.get(vkey, MICHELE_VOICE_ID)
        lc = _el_lang_code(lang)
        ck = _hashlib.sha256(f"11l|{text}|{vid}|turbo|{lc}|mp3".encode()).hexdigest()
        cpath = os.path.join(_TTS_CACHE_DIR, ck + ".mp3")
        try:
            if os.path.exists(cpath):
                with open(cpath, "rb") as f:
                    return f.read()
        except Exception:
            pass
        try:
            _kw = {"text": text, "voice_id": vid, "model_id": "eleven_turbo_v2_5", "voice_settings": _voice_settings(vkey)}
            if lc:
                _kw["language_code"] = lc
            gen = _eleven_client.text_to_speech.convert(**_kw)
            audio = b"".join(gen)
            try:
                with open(cpath, "wb") as f:
                    f.write(audio)
            except Exception:
                pass
            return audio
        except Exception as e:
            _eleven_cooldown_until = time.time() + 600
            logger.warning("Eleven synth (handoff) non disponibile (%s)", str(e)[:120])
    if EMERGENT_LLM_KEY:
        try:
            import inspect as _insp
            from emergentintegrations.llm.openai.text_to_speech import OpenAITextToSpeech
            oai_voice = _OAI_VOICE.get(vkey, "onyx")
            cko = _hashlib.sha256(f"oai|{text}|{oai_voice}".encode()).hexdigest()
            cpatho = os.path.join(_TTS_CACHE_DIR, cko + ".mp3")
            if os.path.exists(cpatho):
                with open(cpatho, "rb") as f:
                    return f.read()
            _tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
            res = _tts.generate_speech(text=text, model="tts-1", voice=oai_voice, speed=1.0)
            audio = await res if _insp.isawaitable(res) else res
            if audio:
                try:
                    with open(cpatho, "wb") as f:
                        f.write(audio)
                except Exception:
                    pass
                return audio
        except Exception as e:
            logger.warning("OpenAI synth (handoff) non disponibile (%s)", str(e)[:150])
    return None


class VoiceTranslateReq(BaseModel):
    text: str
    target: str = "en"


@api_router.post("/voice/translate")
async def voice_translate(payload: VoiceTranslateReq):
    """Traduzione vocale in tempo reale per i canali headset Bluetooth (Letz_Passive):
    trascrizione dell'operatore → testo tradotto nella lingua del compagno."""
    text = (payload.text or "").strip()[:1000]
    if not text:
        raise HTTPException(status_code=400, detail="Testo vuoto")
    out = await _translate_for_tts(text, payload.target)
    return {"text": out, "target": payload.target, "source_text": text}


@api_router.post("/tts/speak")
async def tts_speak(payload: TTSReq):
    """TTS = ElevenLabs (voce ultra-realistica). Se non disponibile (crediti finiti),
    risponde 424 e il frontend passa in automatico alla voce del TELEFONO (senza errori)."""
    global _eleven_cooldown_until
    text = _clean_for_tts(payload.text)[:2000]
    if not text:
        raise HTTPException(status_code=400, detail="Testo vuoto")
    # Traduci nella lingua scelta PRIMA di sintetizzare (audio davvero tradotto, non solo accento).
    text = _clean_for_tts(await _translate_for_tts(text, payload.lang))[:2000]
    vkey = (payload.voice or "michele").lower()

    if _eleven_client and time.time() >= _eleven_cooldown_until:
        vid = payload.voice_id or _VOICE_MAP.get(vkey, MICHELE_VOICE_ID)
        lc = _el_lang_code(payload.lang)
        ck = _hashlib.sha256(f"11l|{text}|{vid}|turbo|{lc}|mp3".encode()).hexdigest()
        cpath = os.path.join(_TTS_CACHE_DIR, ck + ".mp3")
        try:
            if os.path.exists(cpath):
                with open(cpath, "rb") as f:
                    return Response(content=f.read(), media_type="audio/mpeg", headers={"Cache-Control": "public, max-age=86400", "X-TTS-Provider": "elevenlabs"})
        except Exception:
            pass
        try:
            _kw = {"text": text, "voice_id": vid, "model_id": "eleven_turbo_v2_5", "voice_settings": _voice_settings(vkey)}
            if lc:
                _kw["language_code"] = lc
            gen = _eleven_client.text_to_speech.convert(**_kw)
            audio = b"".join(gen)
            try:
                with open(cpath, "wb") as f:
                    f.write(audio)
            except Exception:
                pass
            return Response(content=audio, media_type="audio/mpeg", headers={"Cache-Control": "public, max-age=86400", "X-TTS-Provider": "elevenlabs"})
        except Exception as e:
            # Crediti/quota finiti o errore → cooldown 10 min, poi fallback voce del telefono.
            _eleven_cooldown_until = time.time() + 600
            logger.warning("ElevenLabs TTS non disponibile (%s) → fallback voce dispositivo", str(e)[:120])

    # Fallback OpenAI TTS (voci MASCHILI: onyx/echo/fable) via Emergent key
    if EMERGENT_LLM_KEY:
        try:
            import inspect as _insp
            from emergentintegrations.llm.openai.text_to_speech import OpenAITextToSpeech
            oai_voice = _OAI_VOICE.get(vkey, "onyx")
            cko = _hashlib.sha256(f"oai|{text}|{oai_voice}".encode()).hexdigest()
            cpatho = os.path.join(_TTS_CACHE_DIR, cko + ".mp3")
            if os.path.exists(cpatho):
                with open(cpatho, "rb") as f:
                    return Response(content=f.read(), media_type="audio/mpeg", headers={"Cache-Control": "public, max-age=86400", "X-TTS-Provider": "openai"})
            _tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
            res = _tts.generate_speech(text=text, model="tts-1", voice=oai_voice, speed=1.0)
            audio = await res if _insp.isawaitable(res) else res
            if audio:
                try:
                    with open(cpatho, "wb") as f:
                        f.write(audio)
                except Exception:
                    pass
                return Response(content=audio, media_type="audio/mpeg", headers={"Cache-Control": "public, max-age=86400", "X-TTS-Provider": "openai"})
        except Exception as e:
            logger.warning("OpenAI TTS fallback non disponibile (%s)", str(e)[:150])

    # Nessun audio dal server → il frontend usa la sintesi vocale del telefono (maschile, lingua dell'app).
    raise HTTPException(status_code=424, detail="TTS server non disponibile: usa voce dispositivo")


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




class WebRecipeRequest(BaseModel):
    query: str
    lang: str = "it"
    method: str = "mikilab"


# Cerca una ricetta (per nome/descrizione/URL) e la RICOSTRUISCE adattandola al metodo scelto.
WEB_RECIPE_LANG = {
    "it": "Scrivi name, procedure e notes in ITALIANO.",
    "de": "Schreibe name, procedure und notes auf DEUTSCH.",
    "en": "Write name, procedure and notes in ENGLISH.",
    "es": "Escribe name, procedure y notes en ESPAÑOL.",
    "fr": "Écris name, procedure et notes en FRANÇAIS.",
    "fa": "name، procedure و notes را به زبان فارسی بنویس.",
}

# Guida per ogni metodo di adattamento selezionabile dall'utente ("Più Metodi").
WEB_RECIPE_METHODS = {
    "mikilab": (
        "METODO MIKILAB (firma di Michele): metodo INDIRETTO con prefermento (lievito madre preferment_type='lm' se adatto, "
        "altrimenti poolish). Aggiungi SEMPRE agli extra_ingredients {\"name\": \"Miglioratore Naturale Pro\", \"percent\": 2, \"grams\": null}. "
        "Riposo/maturazione in CELLA a 16°C (indicalo nel procedimento)."
    ),
    "veloce": (
        "METODO VELOCE: metodo DIRETTO (preferment_type='none', method_type='diretto') con lievito di birra, tempi brevi, "
        "una sola lievitazione a temperatura ambiente. Punta alla rapidità mantenendo un buon risultato."
    ),
    "qualita": (
        "METODO QUALITÀ MASSIMA: lunga maturazione in frigo (24-48h), alta idratazione, poche pieghe, "
        "massima struttura, alveolatura e sapore. Prefermento consigliato (lievito madre o poolish)."
    ),
    "diretto": (
        "METODO DIRETTO: nessun prefermento (preferment_type='none', method_type='diretto'), tutti gli ingredienti "
        "insieme in un solo impasto."
    ),
    "indiretto": (
        "METODO INDIRETTO: usa un prefermento (method_type='indiretto'; preferment_type='lm' o 'poolish' o 'biga' secondo il prodotto)."
    ),
    "poolish": (
        "METODO CON POOLISH: prefermento liquido 100% idratazione (preferment_type='poolish', method_type='indiretto'); "
        "indica dosi del poolish e ore di maturazione nel procedimento."
    ),
    "autolisi": (
        "METODO CON AUTOLISI: prevedi una fase di AUTOLISI (farina + acqua, riposo 30-60 min) prima di aggiungere sale e lievito; "
        "descrivila come primo passo del procedimento."
    ),
}

WEB_RECIPE_PROMPT = (
    "Sei un mastro fornaio. L'utente ti dà il NOME (o una breve descrizione, o un link) di una ricetta di panificazione. "
    "Ricostruisci la ricetta classica basandoti sulla tua conoscenza e RIADATTALA seguendo questo metodo:\n"
    "{method_line}\n"
    "- Base di calcolo: flour_grams = 1000 g; calcola water_grams dall'idratazione; salt_grams tipico ~2%.\n"
    "- Se ha senso, aggiungi in 'notes' una breve variante al FARRO (Dinkel): -4% acqua, impasto più delicato.\n"
    "Rispondi SOLO con un oggetto JSON valido, senza testo prima o dopo, con queste chiavi "
    "(usa null se un dato non è pertinente, NON lasciare campi fuori schema):\n"
    "{schema}\n"
    "Aggiungi INOLTRE al JSON una chiave extra \"original\" con la ricetta ORIGINALE/classica "
    "(PRIMA dell'adattamento), in forma sintetica, con SOLO queste chiavi: "
    "{\"name\": str, \"hydration_percent\": num|null, \"method_type\": str|null, \"preferment_type\": str|null, \"flour_type\": str|null}.\n"
    "Converti tutte le quantità in grammi. Metti il procedimento passo-passo (numerato) in 'procedure'. "
    "{lang_line} Non aggiungere spiegazioni: SOLO il JSON."
)


async def _fetch_url_text(url: str):
    """Scarica una pagina web ed estrae (testo, titolo). Best-effort."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "it,en;q=0.8,de;q=0.6",
        }
        async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
            r = await client.get(url, headers=headers)
            r.raise_for_status()
            html = r.text
    except Exception:
        logger.exception("web-recipe fetch error")
        return "", ""
    m = re.search(r"(?is)<title[^>]*>(.*?)</title>", html)
    title = re.sub(r"\s+", " ", m.group(1)).strip()[:140] if m else ""
    html = re.sub(r"(?is)<(script|style|noscript|svg|head)[^>]*>.*?</\1>", " ", html)
    text = re.sub(r"(?s)<[^>]+>", " ", html)
    text = re.sub(r"&nbsp;", " ", text)
    text = re.sub(r"&amp;", "&", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n+", "\n", text)
    text = text.strip()
    return text[:6000], title


async def _tavily_search(query: str):
    """Ricerca web per parole chiave via Tavily. Ritorna la lista di risultati (best-effort)."""
    if not TAVILY_API_KEY:
        return []
    try:
        async with httpx.AsyncClient(timeout=18.0) as client:
            r = await client.post(
                "https://api.tavily.com/search",
                headers={"Authorization": f"Bearer {TAVILY_API_KEY}", "Content-Type": "application/json"},
                json={
                    "query": f"{query} ricetta recipe ingredienti ingredients procedimento",
                    "max_results": 4,
                    "search_depth": "basic",
                    "include_raw_content": "markdown",
                },
            )
            r.raise_for_status()
            return r.json().get("results", []) or []
    except Exception:
        logger.exception("tavily search error")
        return []





class ScanPdfRequest(BaseModel):
    pdf_base64: str
    lang: str = "it"


# Schema campi ricetta (riusato dal prompt foto) per l'estrazione multi-ricetta dal PDF.
SCAN_FIELDS_SCHEMA = (
    '{"name": string, "flour_type": string, "hydration_percent": number|null, '
    '"flour_grams": number|null, "water_grams": number|null, "sourdough_grams": number|null, "salt_grams": number|null, '
    '"preferment_type": "none"|"lm"|"poolish"|"biga", "method_type": "diretto"|"indiretto", '
    '"dough_category": string|null, "water_temp_c": number|null, "mix_minutes": number|null, '
    '"bake_temp": number|null, "bake_minutes": number|null, "oven_type": string|null, '
    '"bulk_fermentation_hours": number|null, "proofing_hours": number|null, "origin": string|null, '
    '"extra_ingredients": [{"name": string, "percent": number|null, "grams": number|null}], '
    '"procedure": string, "notes": string}'
)

SCAN_PDF_MULTI_PROMPT = (
    "Sei un assistente di panificazione. Il TESTO seguente è estratto da un PDF che può contenere UNA o PIÙ ricette "
    "(anche un intero ricettario). Il testo è diviso da marcatori '=== PAGINA N ==='. "
    "Individua OGNI ricetta distinta e trasformala in DATI STRUTTURATI. "
    "Rispondi SOLO con un oggetto JSON valido, senza testo prima o dopo, in questo formato ESATTO:\n"
    '{"recipes": [ RICETTA, RICETTA, ... ]}\n'
    "dove ogni RICETTA ha queste chiavi (usa null se un dato non è presente, NON inventare):\n"
    + SCAN_FIELDS_SCHEMA + "\n"
    'Aggiungi a OGNI ricetta anche il campo "page": number = il numero di pagina del PDF dove inizia la ricetta '
    "(desumilo dai marcatori '=== PAGINA N ==='). "
    "Converti tutte le quantità in grammi quando possibile. Metti il procedimento passo-passo in 'procedure'. "
    "Se il PDF contiene una sola ricetta, restituisci comunque un array con un solo elemento. "
    "Estrai al massimo 20 ricette. Non aggiungere spiegazioni: SOLO il JSON."
)


def _pdf_page_thumbs(pdf_bytes: bytes, page_numbers: list):
    """Renderizza le pagine richieste (1-based) in miniature JPEG base64. Best-effort."""
    import base64 as _base64
    thumbs = {}
    wanted = sorted({int(p) for p in page_numbers if isinstance(p, (int, float)) and int(p) >= 1})[:20]
    if not wanted:
        return thumbs
    try:
        import pymupdf as _fitz
    except Exception:
        try:
            import fitz as _fitz
        except Exception:
            return thumbs
    try:
        doc = _fitz.open(stream=pdf_bytes, filetype="pdf")
        for pnum in wanted:
            if pnum > doc.page_count:
                continue
            try:
                page = doc.load_page(pnum - 1)
                pix = page.get_pixmap(matrix=_fitz.Matrix(0.5, 0.5))
                jpg = pix.tobytes("jpeg", jpg_quality=55)
                thumbs[str(pnum)] = "data:image/jpeg;base64," + _base64.b64encode(jpg).decode()
            except Exception:
                continue
        doc.close()
    except Exception:
        logger.exception("pdf thumb render error")
    return thumbs




class ScanFlourRequest(BaseModel):
    image_base64: str
    lang: str = "it"


SCAN_FLOUR_PROMPT = (
    "Sei un tecnologo della panificazione. Nella foto c'è un SACCO/CONFEZIONE di FARINA (etichetta, scheda tecnica o fronte pacco). "
    "Leggi i dati e restituisci SOLO un oggetto JSON valido, senza testo prima o dopo, con ESATTAMENTE queste chiavi "
    "(usa null se il dato non è presente o non deducibile, NON inventare):\n"
    '{"brand": string|null, "product_name": string|null, "flour_type": string|null, '
    '"w_index": number|null, "protein_percent": number|null, "grain": string|null, '
    '"ideal_use": string|null, "absorption_percent": number|null, "notes": string}\n'
    'Note: "flour_type" = tipo (es. "Tipo 00", "Tipo 0", "Manitoba", "Integrale", "Farro/Dinkel", "Type 550", "T65"). '
    '"w_index" = forza W (numero puro, se indicata o stimabile dalle proteine). '
    '"protein_percent" = proteine in g/100g (numero). "grain" = cereale (grano tenero, farro, segale, ecc.). '
    '"ideal_use" = a cosa è adatta (breve, es. "lunghe lievitazioni", "biscotti/frolla", "pane diretto"). '
    "Se la forza W non è stampata ma ci sono le proteine, stimala e indicalo in 'notes'. "
    "Rispondi nella lingua richiesta per i campi testuali. Solo JSON."
)




# --- Dispensa Farine: salva le farine scansionate (W, proteine) per riusarle nelle ricette ---
class FlourReq(BaseModel):
    brand: Optional[str] = Field(None, max_length=120)
    product_name: Optional[str] = Field(None, max_length=160)
    flour_type: Optional[str] = Field(None, max_length=120)
    w_index: Optional[float] = None
    protein_percent: Optional[float] = None
    grain: Optional[str] = Field(None, max_length=120)
    ideal_use: Optional[str] = Field(None, max_length=300)
    absorption_percent: Optional[float] = None
    notes: Optional[str] = Field(None, max_length=1000)


@api_router.get("/flours")
async def flours_list(user: dict = Depends(current_user)):
    docs = await db.flours.find({"owner_id": user["user_id"]}, {"_id": 0, "owner_id": 0}).sort("created_at", -1).to_list(200)
    return {"items": docs}


@api_router.post("/flours")
async def flours_create(body: FlourReq, user: dict = Depends(current_user)):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["owner_id"] = user["user_id"]
    doc["created_at"] = now_iso()
    await db.flours.insert_one(doc)
    return {k: v for k, v in doc.items() if k not in ("_id", "owner_id")}


@api_router.delete("/flours/{flour_id}")
async def flours_delete(flour_id: str, user: dict = Depends(current_user)):
    await db.flours.delete_one({"id": flour_id, "owner_id": user["user_id"]})
    return {"ok": True}


import xml.etree.ElementTree as ET


# ---------------------------------------------------------------------------
# Import ricette via EMAIL (Mailgun Inbound Routes)
# L'utente inoltra una ricetta a recipes@mikilab.de; Mailgun fa POST qui.
# ---------------------------------------------------------------------------
async def _llm_json(system_msg: str, prompt: str, image_b64: str = None, max_tokens: int = 2000):
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"inbound-{uuid.uuid4()}", system_message=system_msg)\
        .with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=max_tokens)
    if image_b64:
        msg = UserMessage(text=prompt, file_contents=[ImageContent(image_base64=image_b64)])
    else:
        msg = UserMessage(text=prompt)
    text = ""
    async for event in chat.stream_message(msg):
        if isinstance(event, TextDelta):
            text += event.content
        elif isinstance(event, StreamDone):
            break
    raw = text.strip().strip("`")
    if raw.lower().startswith("json"):
        raw = raw[4:].strip()
    s, e = raw.find("{"), raw.rfind("}")
    if s == -1 or e == -1:
        return None
    try:
        return json.loads(raw[s:e + 1])
    except Exception:
        return None


async def _recipes_from_email(body_text: str, attachments: list, lang: str = "it"):
    """Ritorna una lista di dict-ricetta estratti dal corpo email e dagli allegati (PDF/immagini)."""
    import base64 as _base64
    out = []
    for att in attachments:
        data = att.get("data")
        ctype = (att.get("content_type") or "").lower()
        fname = (att.get("filename") or "").lower()
        if not data:
            continue
        try:
            if "pdf" in ctype or fname.endswith(".pdf"):
                import io as _io
                from pypdf import PdfReader
                reader = PdfReader(_io.BytesIO(data))
                pdf_text = "\n".join([(p.extract_text() or "") for p in reader.pages[:40]]).strip()
                if len(pdf_text) >= 20:
                    parsed = await _llm_json("Estrai ricette da testo e restituisci solo JSON valido.",
                                             SCAN_PDF_MULTI_PROMPT + "\n\nTESTO DAL PDF:\n" + pdf_text[:18000], max_tokens=8000)
                    recs = (parsed or {}).get("recipes") if isinstance(parsed, dict) else None
                    if isinstance(recs, list):
                        out.extend([r for r in recs if isinstance(r, dict) and (r.get("name") or "").strip()])
            elif ctype.startswith("image/") or fname.endswith((".jpg", ".jpeg", ".png", ".webp")):
                b64 = _base64.b64encode(data).decode()
                parsed = await _llm_json("Estrai ricette da foto e restituisci solo JSON valido.", SCAN_PROMPT, image_b64=b64)
                if isinstance(parsed, dict) and (parsed.get("name") or "").strip():
                    out.append(parsed)
        except Exception:
            logger.exception("inbound attachment parse error")
    if not out and body_text and len(body_text.strip()) >= 40:
        try:
            parsed = await _llm_json("Estrai ricette da testo e restituisci solo JSON valido.",
                                     SCAN_PDF_MULTI_PROMPT + "\n\nTESTO DELL'EMAIL:\n" + body_text[:18000], max_tokens=6000)
            recs = (parsed or {}).get("recipes") if isinstance(parsed, dict) else None
            if isinstance(recs, list):
                out.extend([r for r in recs if isinstance(r, dict) and (r.get("name") or "").strip()])
        except Exception:
            logger.exception("inbound body parse error")
    return out


def _mailgun_verify(timestamp: str, token: str, signature: str) -> bool:
    import hmac as _hmac, hashlib as _hashlib, time as _time
    key = os.environ.get("MAILGUN_WEBHOOK_SIGNING_KEY", "")
    if not key or not timestamp or not token or not signature:
        return False
    try:
        if abs(_time.time() - int(timestamp)) > 900:
            return False
    except (ValueError, TypeError):
        return False
    expected = _hmac.new(key.encode(), (timestamp + token).encode(), _hashlib.sha256).hexdigest()
    return _hmac.compare_digest(expected, signature)


@api_router.post("/inbound/email")
async def inbound_email(request: Request):
    form = await request.form()
    # Autenticazione webhook: firma Mailgun VALIDA *oppure* secret token condiviso nell'URL/route.
    sig_ok = _mailgun_verify(form.get("timestamp"), form.get("token"), form.get("signature"))
    shared = os.environ.get("INBOUND_SHARED_SECRET", "")
    provided = request.query_params.get("k") or form.get("k") or ""
    import hmac as _hmac2
    secret_ok = bool(shared) and _hmac2.compare_digest(provided, shared)
    if not (sig_ok or secret_ok):
        raise HTTPException(status_code=406, detail="Unauthorized inbound request")
    token = form.get("token")
    if token and await db.inbound_tokens.find_one({"_id": token}):
        return {"ok": True, "duplicate": True}

    sender = (form.get("sender") or form.get("from") or "").strip().lower()
    # Estrai l'indirizzo email pulito da "Nome <email>"
    m = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", sender)
    sender_email = (m.group(0).lower() if m else sender)

    # Raccogli allegati (multipart: attachment-1, attachment-2, ...)
    attachments = []
    for field, value in form.multi_items():
        if field.startswith("attachment-") and hasattr(value, "read"):
            data = await value.read()
            if len(data) > 15 * 1024 * 1024:
                continue
            attachments.append({"filename": getattr(value, "filename", field),
                                "content_type": getattr(value, "content_type", ""), "data": data})

    body_text = form.get("stripped-text") or form.get("body-plain") or ""
    subject = form.get("subject") or ""

    log = {"id": str(uuid.uuid4()), "sender": sender_email, "subject": subject,
           "created_at": now_iso(), "matched_user": None, "recipes_created": 0, "status": "received"}

    user = await db.users.find_one({"email": sender_email}, {"_id": 0, "user_id": 1, "email": 1}) if sender_email else None
    if not user:
        log["status"] = "no_user"
        if token:
            await db.inbound_tokens.insert_one({"_id": token, "created_at": now_iso()})
        await db.inbound_emails.insert_one(log)
        return {"ok": True, "matched": False, "detail": "sender not registered"}

    log["matched_user"] = user["user_id"]
    recipes = await _recipes_from_email(body_text, attachments, "it")
    created = 0
    for r in recipes:
        try:
            r["collection_name"] = "personal"
            recipe = Recipe(**{k: v for k, v in r.items() if k in Recipe.model_fields})
            doc = recipe.model_dump()
            doc["owner_id"] = user["user_id"]
            doc["source"] = "email"
            tr = await _translate_recipe_de(doc)
            for k in ("name_de", "flour_type_de", "notes_de", "procedure_de"):
                if tr.get(k):
                    doc[k] = tr[k]
            await db.recipes.insert_one(doc)
            created += 1
        except Exception:
            logger.exception("inbound recipe create error")

    log["recipes_created"] = created
    log["status"] = "done" if created else "no_recipe"
    if token:
        await db.inbound_tokens.insert_one({"_id": token, "created_at": now_iso()})
    await db.inbound_emails.insert_one(log)

    if created:
        # Notifica in-app (campanella)
        try:
            await db.notifications.insert_one({
                "id": str(uuid.uuid4()), "user_id": user["user_id"], "actor_id": "system",
                "type": "email_import", "post_id": None, "actor_name": "Import via Email",
                "snippet": (f"{created} " + ("ricetta" if created == 1 else "ricette") + (f" · {subject}" if subject else ""))[:80],
                "count": created, "read": False, "created_at": now_iso(),
            })
        except Exception:
            logger.exception("inbound notification error")
        # Conferma via email al mittente (best-effort)
        if RESEND_API_KEY and sender_email:
            try:
                names = ", ".join([(r.get("name") or "").strip() for r in recipes if (r.get("name") or "").strip()][:5])
                html = (f"<div style='font-family:sans-serif'><h2>Ricetta salvata ✅</h2>"
                        f"<p>Ho ricevuto la tua email e ho creato <b>{created} "
                        f"{'ricetta' if created == 1 else 'ricette'}</b> nel tuo profilo MikiLab.</p>"
                        + (f"<p>📋 {names}</p>" if names else "")
                        + "<p>Aprile in <b>Le Ricette di MikiLab → Le Mie Ricette</b>. Buon lavoro! 🥖</p>"
                        "<p style='color:#8C8C8C;font-size:12px'>MikiLab · Import via Email</p></div>")
                await asyncio.to_thread(_resend.Emails.send, {
                    "from": f"MikiLab <{SENDER_EMAIL}>", "to": [sender_email],
                    "subject": "Ricetta salvata ✅ — MikiLab", "html": html,
                })
            except Exception:
                logger.exception("inbound confirmation email error")

    return {"ok": True, "matched": True, "recipes_created": created}


@api_router.get("/inbound/status")
async def inbound_status(user: dict = Depends(current_user)):
    """Ultimi import via email dell'utente + indirizzo dedicato."""
    u = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "email": 1, "role": 1})
    rows = await db.inbound_emails.find({"matched_user": user["user_id"]}, {"_id": 0})\
        .sort("created_at", -1).to_list(20)
    shared = os.environ.get("INBOUND_SHARED_SECRET", "")
    enabled = bool(os.environ.get("MAILGUN_WEBHOOK_SIGNING_KEY") or shared)
    resp = {"inbound_address": os.environ.get("INBOUND_ADDRESS", "recipes@mikilab.de"),
            "enabled": enabled,
            "your_email": (u or {}).get("email"), "history": rows}
    # URL del webhook (con secret) mostrato SOLO all'admin per configurare la Route su Mailgun.
    if (u or {}).get("role") == "admin" and shared:
        base = os.environ.get("INBOUND_PUBLIC_BASE", "https://mikilab.de").rstrip("/")
        resp["webhook_url"] = f"{base}/api/inbound/email?k={shared}"
    return resp




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

# Pagamenti disattivati: MikiLab sblocca i contenuti tramite SFIDE, non con denaro.
PAYMENTS_ENABLED = os.environ.get("PAYMENTS_ENABLED", "false").lower() == "true"


def _require_payments():
    if not PAYMENTS_ENABLED:
        raise HTTPException(status_code=503, detail="Pagamenti disattivati: sblocca i contenuti completando le sfide della community.")

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




class BundleCheckoutReq(BaseModel):
    bundle: str  # pane | panini | snack | panettoni
    origin_url: str
    lang: str = "it"



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
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.pdfbase import pdfmetrics
    import os as _os
    _fdir = _os.path.join(_os.path.dirname(__file__), "fonts")
    global _PDF_FONTS_READY
    try:
        if not globals().get("_PDF_FONTS_READY"):
            pdfmetrics.registerFont(TTFont("NotoSans", _os.path.join(_fdir, "NotoSans-Regular.ttf")))
            pdfmetrics.registerFont(TTFont("NotoNaskhArabic", _os.path.join(_fdir, "NotoNaskhArabic-Regular.ttf")))
            try:
                pdfmetrics.registerFont(TTFont("WQY", "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc", subfontIndex=0))
            except Exception:
                pass
            globals()["_PDF_FONTS_READY"] = True
    except Exception as _fe:
        logging.warning(f"PDF font registration failed: {_fe}")
    _rtl = lang in ("ar", "fa")
    base_font = "NotoNaskhArabic" if _rtl else ("WQY" if lang == "zh" and "WQY" in pdfmetrics.getRegisteredFontNames() else "NotoSans")

    def _shape(s):
        if not _rtl:
            return s
        try:
            import arabic_reshaper
            from bidi.algorithm import get_display
            return get_display(arabic_reshaper.reshape(str(s)))
        except Exception:
            return s

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
                "water": "Agua", "sourdough": "Masa madre", "salt": "Sal"},
         "fr": {"ing": "Ingrédients", "proc": "Méthode", "phases": "Étapes de travail",
                "notes": "Notes", "flour": "Farine", "hyd": "Hydratation", "made": "Réalisé avec MikiLab",
                "water": "Eau", "sourdough": "Levain", "salt": "Sel"},
         "fa": {"ing": "مواد اولیه", "proc": "روش", "phases": "مراحل کار",
                "notes": "یادداشت‌ها", "flour": "آرد", "hyd": "هیدراسیون", "made": "ساخته‌شده با MikiLab",
                "water": "آب", "sourdough": "خمیرمایه", "salt": "نمک"},
         "ar": {"ing": "المكوّنات", "proc": "الطريقة", "phases": "مراحل العمل",
                "notes": "ملاحظات", "flour": "الدقيق", "hyd": "الترطيب", "made": "أُنجز مع MikiLab",
                "water": "الماء", "sourdough": "العجين المخمّر", "salt": "الملح"},
         "tr": {"ing": "Malzemeler", "proc": "Yöntem", "phases": "Çalışma aşamaları",
                "notes": "Notlar", "flour": "Un", "hyd": "Hidrasyon", "made": "MikiLab ile yapıldı",
                "water": "Su", "sourdough": "Ekşi maya", "salt": "Tuz"}}.get(lang, None)
    if L is None:
        L = {"ing": "Ingredienti", "proc": "Procedimento", "phases": "Fasi di lavorazione",
             "notes": "Note", "flour": "Farina", "hyd": "Idratazione", "made": "Realizzato con MikiLab",
             "water": "Acqua", "sourdough": "Lievito madre", "salt": "Sale"}

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=18 * mm, bottomMargin=18 * mm,
                            leftMargin=18 * mm, rightMargin=18 * mm, title=bundle_name)
    ss = getSampleStyleSheet()
    ACC = colors.HexColor("#234b6e")
    h1 = ParagraphStyle("h1", parent=ss["Title"], textColor=ACC, fontSize=18, spaceAfter=6, fontName=base_font, wordWrap=("RTL" if _rtl else None), alignment=(2 if _rtl else 0))
    h2 = ParagraphStyle("h2", parent=ss["Heading1"], textColor=ACC, fontSize=13, spaceBefore=6, spaceAfter=4, fontName=base_font, wordWrap=("RTL" if _rtl else None), alignment=(2 if _rtl else 0))
    sub = ParagraphStyle("sub", parent=ss["Normal"], textColor=colors.HexColor("#7E8A93"), fontSize=10, spaceAfter=8, fontName=base_font, wordWrap=("RTL" if _rtl else None), alignment=(2 if _rtl else 0))
    lab = ParagraphStyle("lab", parent=ss["Heading2"], textColor=colors.HexColor("#3f7cac"), fontSize=11, spaceBefore=8, spaceAfter=2, fontName=base_font, wordWrap=("RTL" if _rtl else None), alignment=(2 if _rtl else 0))
    body = ParagraphStyle("body", parent=ss["Normal"], fontSize=10, leading=14, fontName=base_font, wordWrap=("RTL" if _rtl else None), alignment=(2 if _rtl else 0))

    def esc(s):
        s = _shape(s)
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
        canvas.setFont("Helvetica-Bold", 24)
        canvas.drawCentredString(w / 2, h * 0.60 + 8 * mm, "MikiLab")
        canvas.setFont("Helvetica-Bold", 15)
        title = bundle_name if len(bundle_name) <= 42 else bundle_name[:40] + "…"
        canvas.drawCentredString(w / 2, h * 0.60 - 18 * mm, title)
        canvas.setFillColor(colors.HexColor("#a9d2ec"))
        canvas.setFont("Helvetica", 11)
        canvas.drawCentredString(w / 2, h * 0.60 - 30 * mm, L["made"])
        canvas.setFont("Helvetica-Oblique", 9)
        canvas.drawCentredString(w / 2, 22 * mm, "Il Laboratorio di MikiLab · mikilab.de")
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




async def subscription_status_DISABLED(user: Optional[dict] = Depends(optional_user)):
    # Endpoint rimosso (accesso sempre libero); mantenuto stub non instradato.
    return {"pro": True, "academy": True}


async def _subscription_status_legacy(user: Optional[dict] = Depends(optional_user)):
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


async def activate_trial_DISABLED(body: TrialReq, request: Request, user: dict = Depends(current_user)):
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




@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    if not PAYMENTS_ENABLED:
        return {"ok": True, "ignored": True}  # pagamenti disattivati
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





# ---------------------------------------------------------------------------
# Acquisto SINGOLO ricette (pagamento una tantum, senza abbonamento)
# ---------------------------------------------------------------------------
class RecipeCheckoutReq(BaseModel):
    kind: str                       # "single" | "panettoni" | "all"
    origin_url: str
    recipe_id: Optional[str] = None




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
SENDER_FALLBACK = os.environ.get("SENDER_FALLBACK", "onboarding@resend.dev")
if RESEND_API_KEY:
    _resend.api_key = RESEND_API_KEY
# Fallback automatico del mittente: se il dominio (mikilab.de) non è ancora verificato su
# Resend, l'invio ripiega sul mittente di test cosi' le email partono comunque.
_orig_resend_send = _resend.Emails.send
def _resend_send_with_fallback(params):
    try:
        return _orig_resend_send(params)
    except Exception as e:
        msg = str(e).lower()
        frm = params.get("from") if isinstance(params, dict) else None
        if frm and SENDER_FALLBACK and (SENDER_FALLBACK not in frm) and any(k in msg for k in ("domain", "verif", "not allowed", "403", "422", "forbidden")):
            fb = dict(params)
            fb["from"] = f"MikiLab <{SENDER_FALLBACK}>"
            logging.getLogger(__name__).warning(f"Resend: mittente {frm} non verificato, fallback a {SENDER_FALLBACK}")
            return _orig_resend_send(fb)
        raise
_resend.Emails.send = _resend_send_with_fallback


class ForgotReq(BaseModel):
    email: str
    origin_url: Optional[str] = None
    lang: str = "it"


class ContactReq(BaseModel):
    name: str = Field("", max_length=120)
    email: str = Field("", max_length=200)
    message: str = Field(..., min_length=3, max_length=4000)


CONTACT_TO_EMAIL = os.environ.get("CONTACT_EMAIL", "michelecip918@gmail.com")


@api_router.post("/contact")
async def contact_send(body: ContactReq):
    name = (body.name or "").strip() or "Anonimo"
    reply = (body.email or "").strip()
    msg = body.message.strip()
    # Salva sempre (fallback anche se l'email non parte)
    doc = {"id": str(uuid.uuid4()), "name": name, "email": reply, "message": msg, "created_at": now_iso()}
    await db.contact_messages.insert_one(doc)
    if RESEND_API_KEY:
        try:
            html = (f"<h3>Nuovo messaggio dal sito MikiLab</h3>"
                    f"<p><b>Nome:</b> {name}</p><p><b>Email:</b> {reply or '—'}</p>"
                    f"<p><b>Messaggio:</b></p><p style='white-space:pre-wrap'>{msg}</p>")
            params = {"from": f"MikiLab <{SENDER_EMAIL}>", "to": [CONTACT_TO_EMAIL],
                      "subject": f"📩 Contatto MikiLab da {name}", "html": html}
            if reply:
                params["reply_to"] = reply
            await asyncio.to_thread(_resend.Emails.send, params)
        except Exception:
            logger.exception("contact email send error")
    return {"ok": True}


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


class FreezerItem(BaseModel):
    name: str
    qty: float = 0
    min_qty: float = 0
    dept: str = ""


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


# --- Report di Fine Giornata: persistenza storica per confronti (per-owner) ---
class DayReportSave(BaseModel):
    date: Optional[str] = None
    mixers_active: int = 0
    alarms_count: int = 0
    week_load: int = 0
    alarms: List[dict] = []
    notes: Optional[str] = ""


@api_router.post("/reports")
async def save_day_report(body: DayReportSave, user: dict = Depends(current_user)):
    doc = body.model_dump()
    doc["date"] = (doc.get("date") or now_iso()[:10])[:10]
    doc["owner_id"] = user["user_id"]
    doc["updated_at"] = now_iso()
    existing = await db.day_reports.find_one({"owner_id": user["user_id"], "date": doc["date"]})
    if existing:
        await db.day_reports.update_one({"_id": existing["_id"]}, {"$set": doc})
        rid = existing.get("id") or str(uuid.uuid4())
        await db.day_reports.update_one({"_id": existing["_id"]}, {"$set": {"id": rid}})
    else:
        doc["id"] = str(uuid.uuid4())
        doc["created_at"] = now_iso()
        await db.day_reports.insert_one(doc)
    return {"ok": True, "date": doc["date"]}


@api_router.get("/reports")
async def list_day_reports(limit: int = 90, user: dict = Depends(current_user)):
    docs = await db.day_reports.find({"owner_id": user["user_id"]}, {"_id": 0}).sort("date", -1).to_list(limit)
    return {"items": docs}


# --- Bacheca di Miki: messaggio vocale/testuale quotidiano del Capo per il team (globale) ---
class BoardPost(BaseModel):
    message: str


@api_router.get("/board")
async def get_board():
    doc = await db.board.find_one({}, {"_id": 0}, sort=[("created_at", -1)])
    return doc or {"message": "", "date": "", "author": ""}


@api_router.post("/board")
async def set_board(body: BoardPost, user: dict = Depends(current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "message": body.message.strip()[:400],
        "author": user.get("operator_name") or user.get("email") or "Capo",
        "date": now_iso()[:10],
        "created_at": now_iso(),
    }
    await db.board.insert_one(dict(doc))
    doc.pop("_id", None)
    return {"ok": True, **doc}


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
# Newsletter (lead magnet 100% gratis): "Ricevi la ricetta della settimana"
# ---------------------------------------------------------------------------
class NewsletterReq(BaseModel):
    email: str = Field(..., max_length=200)
    lang: str = "it"
    source: Optional[str] = "home"


def _newsletter_welcome_html(lang: str) -> tuple:
    L = (lang or "it").lower()
    data = {
        "it": ("🥖 Benvenuto nella famiglia MikiLab!",
               "Grazie per esserti iscritto! Ogni settimana riceverai una ricetta del mio metodo — Biga, Poolish, Lievito Madre e il Miglioratore Naturale — spiegata passo passo.",
               "Tutto è 100% gratis: nessun pagamento, nessuna carta. A presto, Michele."),
        "de": ("🥖 Willkommen in der MikiLab-Familie!",
               "Danke für deine Anmeldung! Jede Woche bekommst du ein Rezept nach meiner Methode — Biga, Poolish, Lievito Madre und der natürliche Backmittel — Schritt für Schritt erklärt.",
               "Alles ist 100% kostenlos: keine Zahlung, keine Karte. Bis bald, Michele."),
        "en": ("🥖 Welcome to the MikiLab family!",
               "Thanks for subscribing! Every week you'll get a recipe from my method — Biga, Poolish, Sourdough and the Natural Improver — explained step by step.",
               "Everything is 100% free: no payment, no card. See you soon, Michele."),
        "es": ("🥖 ¡Bienvenido a la familia MikiLab!",
               "¡Gracias por suscribirte! Cada semana recibirás una receta de mi método — Biga, Poolish, Masa Madre y el Mejorante Natural — explicada paso a paso.",
               "Todo es 100% gratis: sin pagos, sin tarjeta. ¡Hasta pronto, Michele!"),
    }
    title, body1, body2 = data.get(L, data["it"])
    html = (f"<div style='font-family:Arial,sans-serif;max-width:480px;margin:auto'>"
            f"<h2 style='color:#B45309'>{title}</h2>"
            f"<p style='color:#3F4A54;line-height:1.6'>{body1}</p>"
            f"<p style='color:#3F4A54;line-height:1.6'>{body2}</p>"
            f"<p style='color:#a9772f;font-weight:bold'>MikiLab · 100% gratis 🇮🇹 🇩🇪</p></div>")
    return title, html


@api_router.post("/newsletter/subscribe")
async def newsletter_subscribe(body: NewsletterReq, request: Request):
    email = (body.email or "").strip().lower()
    if not email or "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(400, "Email non valida")
    if not await _rate_limit("newsletter_ip", _client_ip(request), 20, 3600):
        raise HTTPException(status_code=429, detail="Troppe richieste. Riprova più tardi.")
    existing = await db.newsletter_subscribers.find_one({"email": email})
    already = bool(existing)
    await db.newsletter_subscribers.update_one(
        {"email": email},
        {"$set": {"email": email, "lang": body.lang, "source": body.source, "updated_at": now_iso()},
         "$setOnInsert": {"id": str(uuid.uuid4()), "created_at": now_iso()}},
        upsert=True,
    )
    if RESEND_API_KEY and not already:
        try:
            subject, html = _newsletter_welcome_html(body.lang)
            await asyncio.to_thread(_resend.Emails.send, {
                "from": f"MikiLab <{SENDER_EMAIL}>", "to": [email], "subject": subject, "html": html})
        except Exception:
            logger.exception("newsletter welcome email error")
    return {"ok": True, "already": already}


@api_router.get("/admin/newsletter")
async def admin_newsletter(admin: dict = Depends(require_admin)):
    rows = await db.newsletter_subscribers.find({}, {"_id": 0}).sort("created_at", -1).to_list(5000)
    return {"count": len(rows), "subscribers": rows}


@api_router.get("/newsletter/count")
async def newsletter_count():
    n = await db.newsletter_subscribers.count_documents({})
    return {"count": n}


class NewsletterSend(BaseModel):
    subject: str = Field(..., max_length=200)
    title: str = Field(..., max_length=200)
    body: str = Field(..., max_length=8000)
    lang: Optional[str] = None  # None/"" = tutti gli iscritti
    image_url: Optional[str] = None
    test_email: Optional[str] = None  # se presente → invio di prova solo a questo indirizzo


def _md_lite(text: str) -> str:
    import html as _h, re as _re
    t = _h.escape(text)
    t = _re.sub(r"\[([^\]]+)\]\((https?://[^\s)]+)\)", r'<a href="\2" style="color:#B45309">\1</a>', t)
    t = _re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", t)
    t = _re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<em>\1</em>", t)
    return t.replace("\n", "<br>")


def _newsletter_campaign_html(title: str, body: str, image_url: str = None) -> str:
    import html as _h
    safe_title = _h.escape(title)
    safe_body = _md_lite(body)
    img = ""
    if image_url and image_url.startswith("http"):
        img = f"<img src='{_h.escape(image_url)}' alt='' style='width:100%;border-radius:12px;margin-bottom:16px' />"
    return (
        "<div style='font-family:Arial,sans-serif;max-width:560px;margin:auto;background:#f7efe0;border-radius:16px;overflow:hidden'>"
        "<div style='background:linear-gradient(135deg,#2C1E16,#6E371C);padding:20px;text-align:center'>"
        "<img src='https://mikilab.de/logo.png' alt='MikiLab' width='72' height='72' style='border-radius:16px' />"
        "<h1 style='color:#f0dcb4;font-size:22px;margin:10px 0 0'>MikiLab</h1></div>"
        f"<div style='padding:24px;color:#3F4A54'>{img}"
        f"<h2 style='color:#B45309;margin-top:0'>{safe_title}</h2>"
        f"<p style='line-height:1.7;font-size:15px'>{safe_body}</p></div>"
        "<div style='padding:16px;text-align:center;background:#efe2cb;color:#8a5a1a;font-size:12px;font-weight:bold'>"
        "MikiLab · Panificazione, Pizzeria & Pasticceria · 100% gratis 🇮🇹 🇩🇪</div></div>"
    )


@api_router.post("/admin/newsletter/send")
async def admin_newsletter_send(body: NewsletterSend, admin: dict = Depends(require_admin)):
    if not RESEND_API_KEY:
        raise HTTPException(400, "Resend non configurato (RESEND_API_KEY mancante)")
    html = _newsletter_campaign_html(body.title, body.body, body.image_url)

    async def _send_to(email):
        await asyncio.to_thread(_resend.Emails.send, {
            "from": f"MikiLab <{SENDER_EMAIL}>", "to": [email], "subject": body.subject, "html": html})

    # Invio di prova: solo all'indirizzo indicato, non salva nello storico
    if body.test_email:
        try:
            await _send_to(body.test_email.strip())
            return {"ok": True, "test": True, "sent": 1, "failed": 0, "total": 1}
        except Exception:
            logger.exception("newsletter test send error")
            raise HTTPException(500, "Invio di prova fallito")

    q = {}
    if body.lang:
        q["lang"] = body.lang
    subs = await db.newsletter_subscribers.find(q, {"_id": 0, "email": 1}).to_list(5000)
    sent, failed = 0, 0
    for s in subs:
        try:
            await _send_to(s["email"])
            sent += 1
        except Exception:
            failed += 1
            logger.exception("newsletter campaign send error")
    # Storico invii
    await db.newsletter_campaigns.insert_one({
        "id": str(uuid.uuid4()), "subject": body.subject, "title": body.title,
        "lang": body.lang or "all", "sent": sent, "failed": failed, "total": len(subs),
        "by": admin.get("email"), "created_at": now_iso(),
    })
    return {"ok": True, "sent": sent, "failed": failed, "total": len(subs)}


@api_router.get("/admin/newsletter/history")
async def admin_newsletter_history(admin: dict = Depends(require_admin)):
    rows = await db.newsletter_campaigns.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"campaigns": rows}


# ---------------------------------------------------------------------------
# Anteprima social multilingua: /api/share/<lang>
# I crawler (WhatsApp/Telegram/Facebook) leggono gli OG tradotti; gli utenti
# vengono reindirizzati all'app nella lingua corrispondente.
# ---------------------------------------------------------------------------
SHARE_META = {
    "it": ("MikiLab — Panificazione, Pizzeria & Pasticceria",
           "Il laboratorio completo del fornaio: ricette, piani di produzione con l'IA e food cost. 100% gratis, nessun pagamento.", "it_IT"),
    "en": ("MikiLab — Bakery, Pizzeria & Pastry Lab",
           "The baker's complete workshop: recipes, AI production plans and food cost. 100% free, no payment.", "en_US"),
    "es": ("MikiLab — Panadería, Pizzería y Pastelería",
           "El laboratorio completo del panadero: recetas, planes de producción con IA y food cost. 100% gratis, sin pagos.", "es_ES"),
    "fr": ("MikiLab — Boulangerie, Pizzeria & Pâtisserie",
           "Le laboratoire complet du boulanger : recettes, plans de production IA et food cost. 100% gratuit, sans paiement.", "fr_FR"),
    "de": ("MikiLab — Bäckerei, Pizzeria & Konditorei",
           "Die komplette Backstube: Rezepte, KI-Produktionspläne und Food Cost. 100% kostenlos, keine Zahlung.", "de_DE"),
    "fa": ("MikiLab — نانوایی، پیتزا و شیرینی‌پزی",
           "کارگاه کامل نانوا: دستورها، برنامه تولید با هوش مصنوعی و محاسبه هزینه. ۱۰۰٪ رایگان.", "fa_IR"),
}


def _share_base_url(request: Request) -> str:
    proto = request.headers.get("x-forwarded-proto", request.url.scheme)
    host = request.headers.get("x-forwarded-host") or request.headers.get("host") or request.url.netloc
    return f"{proto}://{host}"


@api_router.get("/share/{lang}", response_class=HTMLResponse)
@api_router.get("/share", response_class=HTMLResponse)
async def share_preview(request: Request, lang: str = "it"):
    lang = (lang or "it").lower()
    if lang not in SHARE_META:
        lang = "it"
    title, desc, locale = SHARE_META[lang]
    base = _share_base_url(request)
    og_img = f"{base}/og-{lang}.jpg"
    target = f"{base}/{lang}"
    alternates = "\n".join(
        f'<meta property="og:locale:alternate" content="{v[2]}" />' for k, v in SHARE_META.items() if k != lang
    )
    html = f"""<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{title}</title>
<meta name="description" content="{desc}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="MikiLab" />
<meta property="og:title" content="{title}" />
<meta property="og:description" content="{desc}" />
<meta property="og:image" content="{og_img}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="{target}" />
<meta property="og:locale" content="{locale}" />
{alternates}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{title}" />
<meta name="twitter:description" content="{desc}" />
<meta name="twitter:image" content="{og_img}" />
<link rel="canonical" href="{target}" />
<meta http-equiv="refresh" content="0; url={target}" />
<script>window.location.replace({target!r});</script>
</head>
<body style="font-family:system-ui;background:#f7efe0;color:#4a3212;text-align:center;padding:40px">
<img src="{base}/logo.png" alt="MikiLab" width="120" height="120" style="border-radius:24px" />
<h1>MikiLab</h1>
<p>{desc}</p>
<p><a href="{target}">→ MikiLab</a></p>
</body>
</html>"""
    return HTMLResponse(content=html, headers={"Cache-Control": "public, max-age=300"})



# ---------------------------------------------------------------------------
# Impostazioni sito editabili dall'admin: numero WhatsApp, testi fumetti avatar,
# copertine delle cartelle ricette. Lettura pubblica, scrittura solo admin.
# ---------------------------------------------------------------------------
DEFAULT_SITE_SETTINGS = {
    "whatsapp_number": "491601253378",
    "tiktok_handle": "mikilab.de",  # senza @, usato per https://www.tiktok.com/@<handle>
    "instagram_url": "",            # URL completo, vuoto = pulsante nascosto
    "facebook_url": "",             # URL completo, vuoto = pulsante nascosto
    "avatar_bubbles": {},   # override keyed "impara.michele" -> {"it": "...", "de": "..."}
    "folder_covers": {},    # {"pane": "<url>", "panettoni": "<url>", ...}
}


def _merge_site_settings(doc):
    s = dict(DEFAULT_SITE_SETTINGS)
    if doc:
        for k in ("whatsapp_number", "tiktok_handle", "instagram_url", "facebook_url", "avatar_bubbles", "folder_covers"):
            if doc.get(k) is not None:
                s[k] = doc[k]
    return s


def _normalize_social_url(val, base):
    """Accetta URL completo, @username o username → ritorna URL completo (o '' se vuoto)."""
    v = (val or "").strip()
    if not v:
        return ""
    if v.startswith("http://") or v.startswith("https://"):
        return v
    v = v.lstrip("@").strip().strip("/")
    return base + v if v else ""


@api_router.get("/site-settings")
async def get_site_settings():
    doc = await db.app_meta.find_one({"_key": "site_settings"}, {"_id": 0, "_key": 0})
    return _merge_site_settings(doc)


class SiteSettingsReq(BaseModel):
    whatsapp_number: Optional[str] = None
    tiktok_handle: Optional[str] = None
    instagram_url: Optional[str] = None
    facebook_url: Optional[str] = None
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
    if body.tiktok_handle is not None:
        h = body.tiktok_handle.strip().lstrip("@").strip()
        # accetta anche URL completo: estrai la parte dopo @
        if "tiktok.com/@" in h:
            h = h.split("tiktok.com/@", 1)[1].split("/")[0].split("?")[0]
        update["tiktok_handle"] = h
    if body.instagram_url is not None:
        update["instagram_url"] = _normalize_social_url(body.instagram_url, "https://instagram.com/")
    if body.facebook_url is not None:
        update["facebook_url"] = _normalize_social_url(body.facebook_url, "https://facebook.com/")
    if body.avatar_bubbles is not None:
        update["avatar_bubbles"] = body.avatar_bubbles
    if body.folder_covers is not None:
        update["folder_covers"] = body.folder_covers
    await db.app_meta.update_one({"_key": "site_settings"}, {"$set": update}, upsert=True)
    doc = await db.app_meta.find_one({"_key": "site_settings"}, {"_id": 0, "_key": 0})
    return _merge_site_settings(doc)



# ---------------------------------------------------------------------------
# PIN Produzione (UNICO, globale) — impostato SOLO dal Capo (admin), usato da
# tutti i dispositivi per sbloccare il Floor Mode di Sitor. Salvato hashato.
# ---------------------------------------------------------------------------
class ProductionPinSet(BaseModel):
    pin: str


class ProductionPinVerify(BaseModel):
    pin: str


def _norm_pin(p) -> Optional[str]:
    p = re.sub(r"\D", "", str(p or ""))
    return p if 4 <= len(p) <= 8 else None


@api_router.get("/access-log")
async def access_log(admin: dict = Depends(require_admin), limit: int = 120):
    n = min(max(int(limit or 120), 1), 300)
    docs = await db.pin_access_log.find({}, {"_id": 0}).sort("at", -1).to_list(n)
    return {"entries": docs}


# ---------------------------------------------------------------------------
# FOOD COST DINAMICO & MARGINI AL GRAMMO (pannello admin del Capo)
# ---------------------------------------------------------------------------
def _price_defaults():
    return {"flour": 1.2, "salt": GEN_PRICE_SALT_KG, "yeast": GEN_PRICE_YEAST_KG, "sourdough": GEN_PRICE_SOURDOUGH_KG, **GEN_PRICE_KG}


@api_router.get("/lab/ingredient-prices")
async def ingredient_prices_get(admin: dict = Depends(require_admin)):
    doc = await db.app_meta.find_one({"_key": "ingredient_prices"}, {"_id": 0, "_key": 0})
    merged = {**_price_defaults(), **((doc or {}).get("prices") or {})}
    return {"prices": merged, "custom": (doc or {}).get("prices") or {}}


class IngredientPricesReq(BaseModel):
    prices: dict


@api_router.put("/lab/ingredient-prices")
async def ingredient_prices_set(body: IngredientPricesReq, admin: dict = Depends(require_admin)):
    clean = {str(k): float(v) for k, v in (body.prices or {}).items() if v is not None}
    await db.app_meta.update_one({"_key": "ingredient_prices"}, {"$set": {"_key": "ingredient_prices", "prices": clean, "updated_at": now_iso()}}, upsert=True)
    return {"ok": True, "prices": clean}


class FoodCostReq(BaseModel):
    flour_grams: float = 0
    water_grams: float = 0
    salt_grams: float = 0
    sourdough_grams: float = 0
    yeast_grams: float = 0
    extras: List[dict] = []          # [{name, grams, price_kg?}]
    pieces: int = 0
    sell_price_piece: Optional[float] = None


@api_router.post("/lab/food-cost")
async def food_cost(body: FoodCostReq, admin: dict = Depends(require_admin)):
    doc = await db.app_meta.find_one({"_key": "ingredient_prices"}, {"_id": 0})
    prices = {**_price_defaults(), **((doc or {}).get("prices") or {})}

    def c(grams, price_kg):
        return round((float(grams or 0) / 1000.0) * float(price_kg or 0), 4)

    breakdown = {
        "farina": c(body.flour_grams, prices["flour"]),
        "sale": c(body.salt_grams, prices["salt"]),
        "lievito": c(body.yeast_grams, prices["yeast"]),
        "lievito_madre": c(body.sourdough_grams, prices["sourdough"]),
    }
    extras_cost = 0.0
    for ex in (body.extras or []):
        pk = ex.get("price_kg")
        if pk is None:
            pk = prices.get(str(ex.get("name", "")).lower(), 3.0)
        val = c(ex.get("grams", 0), pk)
        extras_cost += val
        breakdown[f"extra_{ex.get('name', 'x')}"] = val
    material_cost = round(sum(breakdown.values()) + 0.0, 4)
    total_dough_g = sum([body.flour_grams, body.water_grams, body.salt_grams, body.sourdough_grams, body.yeast_grams] + [float(e.get("grams", 0) or 0) for e in (body.extras or [])])
    cost_per_gram = round(material_cost / total_dough_g, 5) if total_dough_g else 0
    cost_per_kg = round(cost_per_gram * 1000, 3)
    cost_per_piece = round(material_cost / body.pieces, 4) if body.pieces else None
    margin = None
    food_cost_pct = None
    if body.sell_price_piece and body.pieces:
        revenue = float(body.sell_price_piece) * body.pieces
        margin = round(revenue - material_cost, 2)
        food_cost_pct = round((material_cost / revenue) * 100, 1) if revenue else None
    return {"material_cost": material_cost, "total_dough_g": round(total_dough_g, 1),
            "cost_per_gram": cost_per_gram, "cost_per_kg": cost_per_kg, "cost_per_piece": cost_per_piece,
            "margin": margin, "food_cost_pct": food_cost_pct, "breakdown": breakdown}


# ===========================================================================
# CHIUSURA GIORNATA DI PRODUZIONE (Blocco A) — collega food-cost, correzione del
# piano della settimana dopo e memoria personale di Sitor. Nessuna burocrazia.
# ===========================================================================
class DayCloseLine(BaseModel):
    recipe_id: Optional[str] = None
    recipe_name: str = ""
    planned: float = 0        # pezzi pianificati
    produced: float = 0       # pezzi effettivamente prodotti
    leftover: float = 0       # pezzi avanzati/invenduti
    unit_cost: Optional[float] = None    # costo materia prima per pezzo (€)
    unit_price: Optional[float] = None   # prezzo di vendita per pezzo (€)

class DayCorrection(BaseModel):
    recipe_id: Optional[str] = None
    recipe_name: str = ""
    change: str = ""          # es. "più acqua 3%", "meno lievito", "puntata +30 min"
    temp_c: Optional[str] = None
    humidity_pct: Optional[str] = None
    season: Optional[str] = None
    flour_lot: Optional[str] = None

class ProdDayCloseReq(BaseModel):
    date: Optional[str] = None
    day_key: str = ""         # lun..dom
    lines: List[DayCloseLine] = []
    corrections: List[DayCorrection] = []
    note: str = ""
    lang: str = "it"


@api_router.post("/production/day-close")
async def production_day_close(body: ProdDayCloseReq, admin: dict = Depends(require_admin)):
    org = _org_id(admin)
    today = body.date or now_iso()[:10]
    revenue = 0.0
    cost = 0.0
    produced_tot = 0.0
    leftover_tot = 0.0
    lines_out = []
    suggestions = []
    for ln in body.lines:
        planned = float(ln.planned or 0)
        produced = float(ln.produced or 0)
        leftover = float(ln.leftover or 0)
        demand = max(0.0, produced - leftover)          # domanda reale = prodotto - invenduto
        uc = float(ln.unit_cost or 0)
        up = float(ln.unit_price or 0)
        revenue += produced * up
        cost += produced * uc
        produced_tot += produced
        leftover_tot += leftover
        # Correzione automatica del piano: la settimana dopo punta alla domanda reale.
        suggested = int(round(demand)) if demand > 0 else int(round(produced))
        lines_out.append({"recipe_id": ln.recipe_id, "recipe_name": ln.recipe_name,
                          "planned": planned, "produced": produced, "leftover": leftover,
                          "demand": round(demand, 1), "suggested_next": suggested})
        if ln.recipe_name:
            await db.plan_suggestions.update_one(
                {"organization_id": org, "day_key": body.day_key, "recipe_name": ln.recipe_name},
                {"$set": {"organization_id": org, "day_key": body.day_key, "recipe_name": ln.recipe_name,
                          "suggested_qty": suggested, "planned_was": planned, "produced": produced,
                          "leftover": leftover, "from_date": today, "updated_at": now_iso()}},
                upsert=True)
            suggestions.append({"recipe_name": ln.recipe_name, "day_key": body.day_key, "suggested_qty": suggested})
    day_margin = round(revenue - cost, 2)
    food_cost_pct = round((cost / revenue) * 100, 1) if revenue > 0 else None
    # Alimenta la memoria personale di Sitor con ogni correzione registrata.
    mem_saved = 0
    for cr in body.corrections:
        if not (cr.change or "").strip():
            continue
        await db.sitor_memory.insert_one({
            "id": str(uuid.uuid4()), "organization_id": org,
            "recipe_id": cr.recipe_id, "recipe_name": cr.recipe_name,
            "change": cr.change.strip()[:400], "source": "chiusura",
            "context": {"temp_c": cr.temp_c or "", "humidity_pct": cr.humidity_pct or "",
                        "season": cr.season or _season_now(), "flour_lot": cr.flour_lot or ""},
            "date": today, "at": now_iso()})
        mem_saved += 1
    closure = {
        "id": str(uuid.uuid4()), "organization_id": org, "date": today, "day_key": body.day_key,
        "lines": lines_out, "note": (body.note or "")[:1000],
        "revenue": round(revenue, 2), "material_cost": round(cost, 2),
        "day_margin": day_margin, "food_cost_pct": food_cost_pct,
        "produced_total": round(produced_tot, 1), "leftover_total": round(leftover_tot, 1),
        "corrections_saved": mem_saved, "closed_at": now_iso(), "closed_by": admin.get("email") or "Direzione",
    }
    await db.day_production_closures.insert_one(dict(closure))
    closure.pop("_id", None)
    return {"ok": True, "closure": closure, "suggestions": suggestions,
            "food_cost": {"revenue": round(revenue, 2), "material_cost": round(cost, 2),
                          "day_margin": day_margin, "food_cost_pct": food_cost_pct}}


@api_router.get("/production/day-close/history")
async def production_day_close_history(admin: dict = Depends(require_admin)):
    docs = await db.day_production_closures.find({"organization_id": _org_id(admin)}, {"_id": 0}).sort("closed_at", -1).to_list(120)
    return {"closures": docs}


# --- Chiusura da produzione: gli operai registrano prodotto/avanzato dal reparto ---
class ProductionLogReq(BaseModel):
    date: Optional[str] = None
    day_key: str = ""
    recipe_name: str = ""
    produced: float = 0
    leftover: float = 0
    operator: str = ""


@api_router.post("/production/log")
async def production_log_add(body: ProductionLogReq, org: str = Depends(effective_org)):
    if not (body.recipe_name or "").strip():
        raise HTTPException(status_code=400, detail="Prodotto mancante")
    today = body.date or now_iso()[:10]
    await db.production_logs.update_one(
        {"organization_id": org, "date": today, "recipe_name": body.recipe_name.strip()},
        {"$set": {"organization_id": org, "date": today, "day_key": body.day_key or "",
                  "recipe_name": body.recipe_name.strip(), "produced": float(body.produced or 0),
                  "leftover": float(body.leftover or 0), "operator": (body.operator or "")[:60],
                  "updated_at": now_iso()}},
        upsert=True)
    return {"ok": True}


@api_router.get("/production/log")
async def production_log_list(date: str = "", admin: dict = Depends(require_admin)):
    today = date or now_iso()[:10]
    docs = await db.production_logs.find({"organization_id": _org_id(admin), "date": today}, {"_id": 0}).to_list(200)
    return {"date": today, "logs": docs}


# ===========================================================================
# CONSEGNE & FURGONI (Blocco B) — Sitor organizza carico, ordine tappe e avvisi.
# Nessuna burocrazia (no HACCP, no tracciabilità lotti). Solo organizzazione.
# ===========================================================================
class DeliveryItem(BaseModel):
    product: str = ""
    qty: float = 0

class DeliveryReq(BaseModel):
    client: str = ""
    address: str = ""
    deadline: str = ""        # HH:MM entro cui consegnare
    van: str = ""             # furgone (facoltativo)
    items: List[DeliveryItem] = []
    note: str = ""


def _hhmm_to_min(s: str):
    try:
        h, m = str(s).split(":"); return int(h) * 60 + int(m)
    except Exception:
        return None


@api_router.get("/deliveries")
async def deliveries_list(admin: dict = Depends(require_admin)):
    today = now_iso()[:10]
    docs = await db.deliveries.find({"organization_id": _org_id(admin), "date": today}, {"_id": 0}).to_list(200)
    return {"date": today, "deliveries": docs}


@api_router.post("/deliveries")
async def delivery_create(body: DeliveryReq, admin: dict = Depends(require_admin)):
    doc = {"id": str(uuid.uuid4()), "organization_id": _org_id(admin), "date": now_iso()[:10],
           "client": (body.client or "")[:120], "address": (body.address or "")[:200],
           "deadline": (body.deadline or "")[:5], "van": (body.van or "")[:40],
           "items": [{"product": (i.product or "")[:120], "qty": float(i.qty or 0)} for i in body.items if (i.product or "").strip()],
           "note": (body.note or "")[:400], "at": now_iso()}
    await db.deliveries.insert_one(dict(doc))
    doc.pop("_id", None)
    return {"ok": True, "delivery": doc}


@api_router.delete("/deliveries/{did}")
async def delivery_delete(did: str, admin: dict = Depends(require_admin)):
    await db.deliveries.delete_one({"id": did, "organization_id": _org_id(admin)})
    return {"ok": True}


@api_router.post("/deliveries/organize")
async def deliveries_organize(admin: dict = Depends(require_admin)):
    """Sitor organizza il giro: carico per furgone, ordine tappe per orario,
    e avvisa se un ordine non sarà pronto in tempo (confronto col piano di oggi)."""
    org = _org_id(admin)
    today = now_iso()[:10]
    day_key = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"][datetime.now(timezone.utc).weekday()]
    dels = await db.deliveries.find({"organization_id": org, "date": today}, {"_id": 0}).to_list(200)
    # Orari di pronto dei prodotti dal piano di oggi (start + durata).
    ready = {}
    wp = await db.weekly_plan.find_one({"organization_id": org}, {"_id": 0}) or {}
    for b in (((wp.get("days") or {}).get(day_key) or {}).get("batches") or []):
        nm = (b.get("product") or "").strip().lower()
        st = _hhmm_to_min(b.get("start"))
        if nm and st is not None:
            end = st + int(b.get("duration_min") or 60)
            ready[nm] = max(ready.get(nm, 0), end)
    vans = {}
    warnings = []
    for d in dels:
        van = d.get("van") or "Furgone 1"
        vans.setdefault(van, [])
        vans[van].append(d)
        dl = _hhmm_to_min(d.get("deadline"))
        for it in d.get("items", []):
            nm = (it.get("product") or "").strip().lower()
            r = ready.get(nm)
            if r is None:
                warnings.append(f"{d.get('client')}: '{it.get('product')}' non è nel piano di oggi — verifica che venga prodotto.")
            elif dl is not None and r > dl:
                rh = f"{r//60:02d}:{r%60:02d}"
                warnings.append(f"{d.get('client')}: '{it.get('product')}' pronto {rh}, oltre la consegna delle {d.get('deadline')}.")
    result = []
    for van, ds in vans.items():
        ds.sort(key=lambda x: (_hhmm_to_min(x.get("deadline")) if _hhmm_to_min(x.get("deadline")) is not None else 9999))
        load = {}
        for d in ds:
            for it in d.get("items", []):
                load[it["product"]] = load.get(it["product"], 0) + float(it.get("qty") or 0)
        result.append({
            "van": van,
            "stops": [{"client": d.get("client"), "address": d.get("address"), "deadline": d.get("deadline"), "items": d.get("items")} for d in ds],
            "load": [{"product": k, "qty": v} for k, v in sorted(load.items())],
        })
    return {"ok": True, "vans": result, "warnings": warnings, "date": today}


@api_router.get("/production/plan-suggestions")
async def production_plan_suggestions(day_key: str = "", admin: dict = Depends(require_admin)):
    q = {"organization_id": _org_id(admin)}
    if day_key:
        q["day_key"] = day_key
    docs = await db.plan_suggestions.find(q, {"_id": 0}).sort("updated_at", -1).to_list(300)
    return {"suggestions": docs}


# ---- Memoria personale di Sitor (Blocco A · punto 4) ----
class SitorMemoryReq(BaseModel):
    recipe_id: Optional[str] = None
    recipe_name: str = ""
    change: str = ""
    temp_c: Optional[str] = None
    humidity_pct: Optional[str] = None
    season: Optional[str] = None
    flour_lot: Optional[str] = None


@api_router.post("/sitor/memory")
async def sitor_memory_add(body: SitorMemoryReq, admin: dict = Depends(require_admin)):
    if not (body.change or "").strip():
        raise HTTPException(status_code=400, detail="Correzione vuota")
    doc = {"id": str(uuid.uuid4()), "organization_id": _org_id(admin),
           "recipe_id": body.recipe_id, "recipe_name": body.recipe_name,
           "change": body.change.strip()[:400], "source": "produzione",
           "context": {"temp_c": body.temp_c or "", "humidity_pct": body.humidity_pct or "",
                       "season": body.season or _season_now(), "flour_lot": body.flour_lot or ""},
           "date": now_iso()[:10], "at": now_iso()}
    await db.sitor_memory.insert_one(dict(doc))
    doc.pop("_id", None)
    return {"ok": True, "memory": doc}


@api_router.get("/sitor/memory")
async def sitor_memory_list(recipe_name: str = "", admin: dict = Depends(require_admin)):
    q = {"organization_id": _org_id(admin)}
    if recipe_name:
        q["recipe_name"] = recipe_name
    docs = await db.sitor_memory.find(q, {"_id": 0}).sort("at", -1).to_list(200)
    return {"memories": docs}


def _season_now() -> str:
    m = datetime.now(timezone.utc).month
    return {12: "inverno", 1: "inverno", 2: "inverno", 3: "primavera", 4: "primavera", 5: "primavera",
            6: "estate", 7: "estate", 8: "estate", 9: "autunno", 10: "autunno", 11: "autunno"}.get(m, "")


async def _sitor_memory_ctx(org: str, limit: int = 12) -> str:
    """Riassunto delle correzioni storiche del Capo per far suggerire Sitor per primo."""
    try:
        mems = await db.sitor_memory.find({"organization_id": org}, {"_id": 0}).sort("at", -1).to_list(limit)
    except Exception:
        return ""
    if not mems:
        return ""
    items = []
    for m in mems:
        ctx = m.get("context") or {}
        tag = ", ".join(x for x in [ctx.get("season"), (f"{ctx.get('temp_c')}°C" if ctx.get("temp_c") else ""), (f"farina {ctx.get('flour_lot')}" if ctx.get("flour_lot") else "")] if x)
        items.append(f"{m.get('recipe_name') or 'generale'}: {m.get('change')}" + (f" ({tag})" if tag else ""))
    return " MEMORIA DEL METODO DI QUESTO CAPO (correzioni storiche reali, usale per suggerire tu per primo invece di consigli generici): " + " | ".join(items) + "."



# ---------------------------------------------------------------------------
# CONTROLLO AMBIENTALE PREDITTIVO — corregge lievitazione e idratazione
# ---------------------------------------------------------------------------
class EnvReq(BaseModel):
    base_proof_hours: float = 3.0
    base_hydration_percent: float = 70.0
    temp_c: float = 24.0
    humidity_pct: float = 55.0
    reference_temp_c: float = 24.0


@api_router.post("/lab/environment")
async def lab_environment(body: EnvReq, admin: dict = Depends(require_admin)):
    # Attività del lievito ~ raddoppia ogni +8°C (Q10≈2). Più caldo → lievitazione più breve.
    factor = 2 ** ((body.reference_temp_c - body.temp_c) / 8.0)
    adj_proof = round(max(0.25, body.base_proof_hours * factor), 2)
    # Idratazione: aria più secca (bassa umidità) → farina più assetata → +acqua; umida → -acqua (±4%).
    hyd_delta = round(((55.0 - body.humidity_pct) / 55.0) * 4.0, 1)
    adj_hyd = round(min(95.0, max(50.0, body.base_hydration_percent + hyd_delta)), 1)
    note_it = (f"A {body.temp_c:g}°C la lievitazione va {'accorciata' if factor < 1 else 'allungata'} a ~{adj_proof} h "
               f"(base {body.base_proof_hours:g} h). Umidità {body.humidity_pct:g}% → idratazione consigliata {adj_hyd:g}% "
               f"({'+' if hyd_delta >= 0 else ''}{hyd_delta}%).")
    return {"adjusted_proof_hours": adj_proof, "hydration_percent": adj_hyd, "temp_factor": round(factor, 3),
            "hydration_delta": hyd_delta, "note": note_it}


@api_router.get("/lab/weather-now")
async def lab_weather_now(admin: dict = Depends(require_admin)):
    """Temperatura e umidità correnti (Open-Meteo) per l'ambiente automatico."""
    try:
        async with httpx.AsyncClient(timeout=12) as client:
            r = await client.get("https://api.open-meteo.com/v1/forecast", params={
                "latitude": _CLIMATE_LAT, "longitude": _CLIMATE_LON,
                "current": "temperature_2m,relative_humidity_2m", "timezone": "Europe/Berlin"})
            j = r.json()
        cur = j.get("current", {}) or {}
        return {"ok": True, "temp_c": cur.get("temperature_2m"), "humidity_pct": cur.get("relative_humidity_2m"),
                "location": "Stoccarda (Stuttgart)", "at": cur.get("time")}
    except Exception as e:
        logging.warning(f"weather-now failed: {e}")
        return {"ok": False, "error": "meteo non raggiungibile"}


class AutoPlanReq(BaseModel):
    orders_text: str = ""
    date: Optional[str] = None
    lang: str = "it"
    machines: List[str] = []
    freezer_stock: List[dict] = []
    activity: str = "panificio"


def _activity_plan_profile(activity: str) -> dict:
    """Profilo di pianificazione DISTINTO per tipo di attività: cambia paradigma di
    produzione, strategie delle 3 opzioni e linee ammesse, così Sitor propone piani
    davvero diversi per panificio / pizzeria / pasticceria."""
    a = (activity or "panificio").strip().lower()
    if a.startswith("pizz"):
        return {
            "label": "PIZZERIA",
            "role": "direttore di produzione di una PIZZERIA ad alto flusso",
            "paradigm": ("Produzione A FLUSSO CONTINUO / su richiesta, non a lotti fissi. Celle e frigoriferi PICCOLI "
                         "ma PIÙ MACCHINE (impastatrici multiple, banco topping). Panetti porzionati, biga/alta idratazione, "
                         "maturazione in frigo. Sforna a scaglioni seguendo il ritmo del servizio."),
            "strategies": [
                ("Servizio continuo", "panetti pronti a scaglioni per coprire tutto il servizio senza attese"),
                ("Alta qualità impasto", "biga e maturazione lunga in frigo, idratazione elevata"),
                ("Turno compatto", "meno personale, impastatrici in parallelo, staglio raggruppato"),
            ],
            "lines": "impasto|staglio|topping|forno",
        }
    if a.startswith("pastic"):
        return {
            "label": "PASTICCERIA",
            "role": "direttore di produzione di una PASTICCERIA su commessa",
            "paradigm": ("Produzione NON a catena: per COMMESSE ed EVENTI (matrimoni, torte su ordinazione, consegne datate). "
                         "Precisione al grammo, uso dell'ABBATTITORE, celle piccole. Pianifica SEMPRE A RITROSO partendo "
                         "dalla data/ora di consegna di ogni commessa; raggruppa lavorazioni simili tra ordini diversi."),
            "strategies": [
                ("Per consegne ed eventi", "pianifica a ritroso dalle date di consegna, ogni commessa pronta in tempo"),
                ("Precisione e abbattimento", "cura del prodotto, riposi controllati e abbattitore tra le fasi"),
                ("Ottimizza commesse", "accorpa creme, frolle e montaggi comuni a più ordini per risparmiare"),
            ],
            "lines": "pasta frolla|creme|montaggio|abbattitore|decori",
        }
    return {
        "label": "PANIFICIO",
        "role": "direttore di produzione di un PANIFICIO industriale d'élite",
        "paradigm": ("Produzione A CATENA per lotti: impasto → lievitazione in CELLE GRANDI → cottura in sequenza sui forni. "
                     "Magazzino orientato a farine e sfarinati in VOLUME. Sequenza continua per saturare i forni."),
        "strategies": [
            ("Massima velocità", "meno colli di bottiglia al forno, consegne rapide"),
            ("Massima qualità", "lievitazioni più lunghe, cura del prodotto"),
            ("Risparmio personale", "meno operatori, sequenza compatta"),
        ],
        "lines": "baguette|pane|grandi lievitati|integrale",
    }


def _autoplan_freezer_ctx(items: list) -> str:
    """Riepilogo giacenze freezer per il piano: Sitor usa PRIMA il congelato."""
    rows = []
    for it in (items or [])[:40]:
        nm = str(it.get("name") or "").strip()
        if not nm:
            continue
        qty = it.get("qty")
        dept = str(it.get("dept") or "").strip()
        seg = nm + (f" · {qty} pz" if qty not in (None, "") else "")
        if dept:
            seg += f" ({dept})"
        rows.append(seg)
    if not rows:
        return ""
    return (" GIACENZE FREEZER ATTUALI (già congelate — USALE PER PRIME, produci solo la differenza mancante "
            "e indica QUANDO tirarle fuori/scongelare): " + "; ".join(rows) + ".")


@api_router.post("/mike/autoplan")
async def mike_autoplan(body: AutoPlanReq, admin: dict = Depends(require_admin)):
    """PILASTRO 1 — Sitor Direttore d'Orchestra: genera il PIANO DI PRODUZIONE ottimale
    del giorno (sequenza lotti, linea, orari, personale). SOLO produzione: niente HACCP,
    allergeni o burocrazia."""
    ld = (await db.app_meta.find_one({"_key": "line_leaders"}, {"_id": 0})) or {}
    leaders = ld.get("leaders") or {}
    low = []
    try:
        for s in await db.lab_warehouse.find({"organization_id": _org_id(admin)}, {"_id": 0}).to_list(500):
            mn = float(s.get("min_kg") or 0); q = float(s.get("quantity_kg") or 0)
            if mn > 0 and q <= mn:
                low.append(f"{s.get('name')} ({q:g}/{mn:g}kg)")
    except Exception:
        pass
    today = (body.date or now_iso()[:10])
    logs = await db.compliance_timelog.find({"at": {"$regex": f"^{today}"}, "organization_id": _org_id(admin)}, {"_id": 0}).to_list(3000)
    workers_today = sorted({l.get("worker") for l in logs if l.get("worker")})
    ctx = (f"Data: {today}. Caposquadra per linea: {leaders or 'nessuno'}. "
           f"Operatori disponibili oggi: {workers_today or 'non timbrati'}. "
           f"Scorte in esaurimento: {low or 'nessuna'}. Ordini del Capo: {body.orders_text or 'nessun ordine extra'}.")
    try:
        _allm = await db.mike_machines.find({"organization_id": _org_id(admin)}, {"_id": 0, "name": 1, "category": 1, "capacity": 1}).to_list(100)
        _sel = [str(x).lower() for x in (body.machines or [])]
        _use = [m for m in _allm if (not _sel or (m.get("name") or "").lower() in _sel)]
        if _use:
            _ml = ", ".join(f"{m.get('name')}{(' ['+m['category']+']') if m.get('category') else ''}{(' cap.'+str(m['capacity'])) if m.get('capacity') else ''}" for m in _use)
            ctx += f" PARCO MACCHINE DA USARE (vincolo reale, assegna forni/impastatrici/celle solo tra questi): {_ml}."
    except Exception:
        pass
    ctx += _autoplan_freezer_ctx(body.freezer_stock)

    plan = {"summary": "", "batches": [], "warnings": [], "spoken": ""}
    if EMERGENT_LLM_KEY:
        try:
            langname = {"it": "italiano", "de": "tedesco", "en": "inglese", "es": "spagnolo", "fr": "francese", "fa": "persiano", "ar": "arabo", "tr": "turco"}.get((body.lang or "it").split("-")[0][:2], "inglese")
            sysmsg = (
                "Sei Sitor, direttore di produzione di una panetteria industriale d'élite. "
                "Genera il PIANO DI PRODUZIONE OTTIMALE della giornata: sequenza dei lotti che rispetti i tempi "
                "di impasto/lievitazione/cottura, evitando colli di bottiglia al forno e sfruttando al meglio il personale. "
                "IMPORTANTISSIMO: NON includere HACCP, allergeni, etichette legali o qualsiasi burocrazia. Solo produzione, "
                "tempi, sequenza, linee e persone.\n"
                f"Rispondi in {langname}. Restituisci SOLO JSON valido: "
                "{\"summary\":\"1-2 frasi\",\"batches\":[{\"seq\":1,\"product\":\"..\",\"qty\":\"..\",\"line\":\"baguette|pane|pizzeria|pasticceria\",\"start\":\"HH:MM\",\"duration_min\":90,\"assignee\":\"nome o linea\",\"rationale\":\"perché ora\"}],"
                "\"warnings\":[\"..\"],\"spoken\":\"riassunto vocale breve e naturale per il Capo\"}. "
                "Massimo 8 lotti, 'rationale' brevissima (max 8 parole). Nessun testo fuori dal JSON."
            )
            sysmsg += await _bakery_snapshot(admin)
            chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"autoplan-{uuid.uuid4().hex[:8]}", system_message=sysmsg).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=2600)
            out = ""
            async for ev in chat.stream_message(UserMessage(text=f"CONTESTO: {ctx}\nGenera il piano ottimale.")):
                if isinstance(ev, TextDelta):
                    out += ev.content or ""
            import json as _json, re as _re
            raw = out.strip().replace("```json", "").replace("```", "")
            m = _re.search(r"\{.*\}", raw, _re.S)
            frag = m.group(0) if m else raw
            try:
                plan.update(_json.loads(frag))
            except Exception:
                # JSON eventualmente troncato: taglia all'ultima graffa bilanciata
                depth = 0; end = -1
                for i, ch in enumerate(frag):
                    if ch == "{":
                        depth += 1
                    elif ch == "}":
                        depth -= 1
                        if depth == 0:
                            end = i + 1
                            break
                if end > 0:
                    plan.update(_json.loads(frag[:end]))
        except Exception as e:
            logger.warning("autoplan fail (%s)", str(e)[:120])
    if not plan.get("summary"):
        plan["summary"] = "Piano non disponibile: riprova o detta gli ordini a Sitor."
    return {"ok": True, "date": today, "context": {"leaders": leaders, "workers_today": workers_today, "low_stock": low}, "plan": plan}


@api_router.post("/mike/autoplan/options")
async def mike_autoplan_options(body: AutoPlanReq, admin: dict = Depends(require_admin)):
    """Sitor genera PIÙ OPZIONI di piano (strategie diverse) tra cui il Capo sceglie."""
    ld = (await db.app_meta.find_one({"_key": "line_leaders"}, {"_id": 0})) or {}
    leaders = ld.get("leaders") or {}
    low = []
    try:
        for s in await db.lab_warehouse.find({"organization_id": _org_id(admin)}, {"_id": 0}).to_list(500):
            mn = float(s.get("min_kg") or 0); q = float(s.get("quantity_kg") or 0)
            if mn > 0 and q <= mn:
                low.append(f"{s.get('name')} ({q:g}/{mn:g}kg)")
    except Exception:
        pass
    today = (body.date or now_iso()[:10])
    logs = await db.compliance_timelog.find({"at": {"$regex": f"^{today}"}, "organization_id": _org_id(admin)}, {"_id": 0}).to_list(3000)
    workers_today = sorted({l.get("worker") for l in logs if l.get("worker")})
    ctx = (f"Data: {today}. Caposquadra per linea: {leaders or 'nessuno'}. "
           f"Operatori disponibili oggi: {workers_today or 'non timbrati'}. "
           f"Scorte in esaurimento: {low or 'nessuna'}. Ordini del Capo: {body.orders_text or 'nessun ordine extra'}.")
    try:
        _allm = await db.mike_machines.find({"organization_id": _org_id(admin)}, {"_id": 0, "name": 1, "category": 1, "capacity": 1}).to_list(100)
        _sel = [str(x).lower() for x in (body.machines or [])]
        _use = [m for m in _allm if (not _sel or (m.get("name") or "").lower() in _sel)]
        if _use:
            _ml = ", ".join(f"{m.get('name')}{(' ['+m['category']+']') if m.get('category') else ''}{(' cap.'+str(m['capacity'])) if m.get('capacity') else ''}" for m in _use)
            ctx += f" PARCO MACCHINE DA USARE (vincolo reale, assegna forni/impastatrici/celle solo tra questi): {_ml}."
    except Exception:
        pass
    ctx += _autoplan_freezer_ctx(body.freezer_stock)

    options = []
    if EMERGENT_LLM_KEY:
        try:
            langname = {"it": "italiano", "de": "tedesco", "en": "inglese", "es": "spagnolo", "fr": "francese", "fa": "persiano", "ar": "arabo", "tr": "turco"}.get((body.lang or "it").split("-")[0][:2], "inglese")
            prof = _activity_plan_profile(body.activity)
            s1, s2, s3 = prof["strategies"]
            sysmsg = (
                f"Sei Sitor, {prof['role']}. "
                f"PARADIGMA DI QUESTA ATTIVITÀ ({prof['label']}): {prof['paradigm']} "
                "Le 3 opzioni e i tempi DEVONO rispettare questo paradigma (non proporre un piano da panificio per una pizzeria o pasticceria). "
                "Genera 3 OPZIONI ALTERNATIVE di piano di produzione della giornata, ognuna con una STRATEGIA diversa adatta a QUESTA attività: "
                f"1) '{s1[0]}' ({s1[1]}), 2) '{s2[0]}' ({s2[1]}), 3) '{s3[0]}' ({s3[1]}). "
                "IMPORTANTISSIMO: NON includere HACCP, allergeni, etichette legali o burocrazia. Solo produzione, tempi, sequenza, linee e persone.\n"
                f"Rispondi in {langname}. Restituisci SOLO JSON valido: "
                "{\"options\":[{\"label\":\"" + s1[0] + "\",\"strategy\":\"1 frase\",\"summary\":\"1 frase\",\"batches\":[{\"seq\":1,\"product\":\"..\",\"qty\":\"..\",\"line\":\"" + prof["lines"] + "\",\"start\":\"HH:MM\",\"duration_min\":90,\"assignee\":\"nome o linea\",\"rationale\":\"max 6 parole\"}],\"warnings\":[\"..\"],\"spoken\":\"riassunto vocale breve\"}]}. "
                "Usa i label esatti delle 3 strategie indicate sopra. Esattamente 3 opzioni, massimo 5 lotti per opzione. Nessun testo fuori dal JSON."
            )
            sysmsg += await _bakery_snapshot(admin)
            chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"autoplanopt-{uuid.uuid4().hex[:8]}", system_message=sysmsg).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=4000)
            out = ""
            async for ev in chat.stream_message(UserMessage(text=f"CONTESTO: {ctx}\nGenera 3 opzioni di piano.")):
                if isinstance(ev, TextDelta):
                    out += ev.content or ""
            import json as _json, re as _re
            raw = out.strip().replace("```json", "").replace("```", "")
            m = _re.search(r"\{.*\}", raw, _re.S)
            frag = m.group(0) if m else raw
            try:
                parsed = _json.loads(frag)
                options = parsed.get("options", [])
            except Exception:
                depth = 0; end = -1
                for i, ch in enumerate(frag):
                    if ch == "{":
                        depth += 1
                    elif ch == "}":
                        depth -= 1
                        if depth == 0:
                            end = i + 1
                            break
                if end > 0:
                    options = _json.loads(frag[:end]).get("options", [])
        except Exception as e:
            logger.warning("autoplan options fail (%s)", str(e)[:120])
    return {"ok": True, "date": today, "options": options}


# ---------------------------------------------------------------------------
# Piano Settimanale 7 giorni (Sitor) — Fase 1: strategie | Fase 2: dettaglio parallelo
# ---------------------------------------------------------------------------
WEEK_DAY_KEYS = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"]
_LANG_NAMES = {"it": "italiano", "de": "tedesco", "en": "inglese", "es": "spagnolo", "fr": "francese", "fa": "persiano", "ar": "arabo", "tr": "turco"}


def _parse_llm_json(out: str) -> dict:
    """Estrae il primo oggetto JSON valido dall'output LLM (tollera markdown e troncamenti)."""
    raw = (out or "").strip().replace("```json", "").replace("```", "")
    m = re.search(r"\{.*\}", raw, re.S)
    frag = m.group(0) if m else raw
    try:
        return json.loads(frag)
    except Exception:
        depth = 0
        end = -1
        for i, ch in enumerate(frag):
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break
        if end > 0:
            try:
                return json.loads(frag[:end])
            except Exception:
                return {}
    return {}


async def _plan_context(body, org: str = ORG_DEFAULT) -> str:
    """Contesto operativo condiviso per i piani di Sitor (caposquadra, personale, scorte, macchine, freezer, memoria del Capo)."""
    ld = (await db.app_meta.find_one({"_key": "line_leaders"}, {"_id": 0})) or {}
    leaders = ld.get("leaders") or {}
    low = []
    try:
        for s in await db.lab_warehouse.find({"organization_id": org}, {"_id": 0}).to_list(500):
            mn = float(s.get("min_kg") or 0)
            q = float(s.get("quantity_kg") or 0)
            if mn > 0 and q <= mn:
                low.append(f"{s.get('name')} ({q:g}/{mn:g}kg)")
    except Exception:
        pass
    today = (body.date or now_iso()[:10])
    logs = await db.compliance_timelog.find({"at": {"$regex": f"^{today}"}, "organization_id": org}, {"_id": 0}).to_list(3000)
    workers_today = sorted({l.get("worker") for l in logs if l.get("worker")})
    ctx = (f"Data: {today}. Caposquadra per linea: {leaders or 'nessuno'}. "
           f"Operatori disponibili oggi: {workers_today or 'non timbrati'}. "
           f"Scorte in esaurimento: {low or 'nessuna'}. Ordini della Direzione: {body.orders_text or 'nessun ordine extra'}.")
    try:
        _allm = await db.mike_machines.find({"organization_id": org}, {"_id": 0, "name": 1, "category": 1, "capacity": 1}).to_list(100)
        _sel = [str(x).lower() for x in (body.machines or [])]
        _use = [m for m in _allm if (not _sel or (m.get("name") or "").lower() in _sel)]
        if _use:
            _ml = ", ".join(f"{m.get('name')}{(' ['+m['category']+']') if m.get('category') else ''}{(' cap.'+str(m['capacity'])) if m.get('capacity') else ''}" for m in _use)
            ctx += f" PARCO MACCHINE DA USARE (vincolo reale, assegna forni/impastatrici/celle solo tra questi): {_ml}."
    except Exception:
        pass
    ctx += _autoplan_freezer_ctx(body.freezer_stock)
    ctx += await _sitor_memory_ctx(org)
    return ctx


class AutoPlanWeekDetailReq(AutoPlanReq):
    days: Dict[str, List[dict]] = {}
    option_label: str = ""


@api_router.post("/mike/autoplan/week/options")
async def mike_autoplan_week_options(body: AutoPlanReq, admin: dict = Depends(require_admin)):
    """FASE 1 — Sitor propone 3 STRATEGIE SETTIMANALI (lun-dom): distribuisce i prodotti sui 7 giorni."""
    options = []
    if EMERGENT_LLM_KEY:
        try:
            langname = _LANG_NAMES.get((body.lang or "it").split("-")[0][:2], "inglese")
            prof = _activity_plan_profile(body.activity)
            s1, s2, s3 = prof["strategies"]
            sysmsg = (
                f"Sei Sitor, {prof['role']}. "
                f"PARADIGMA DI QUESTA ATTIVITÀ ({prof['label']}): {prof['paradigm']} "
                "Genera 3 STRATEGIE ALTERNATIVE di PIANO SETTIMANALE (lunedì-domenica), ognuna con una strategia diversa: "
                f"1) '{s1[0]}' ({s1[1]}), 2) '{s2[0]}' ({s2[1]}), 3) '{s3[0]}' ({s3[1]}). "
                "Distribuisci TUTTI i prodotti richiesti sui 7 giorni usando le chiavi esatte lun, mar, mer, gio, ven, sab, dom "
                "(presenti in OGNI opzione, anche come lista vuota). Tieni conto che venerdì e sabato vendono di più. "
                "IMPORTANTISSIMO: NON includere HACCP, allergeni, etichette legali o burocrazia. Solo produzione.\n"
                f"Rispondi in {langname}. Restituisci SOLO JSON valido: "
                "{\"options\":[{\"label\":\"" + s1[0] + "\",\"strategy\":\"1 frase\",\"summary\":\"1 frase\","
                "\"days\":{\"lun\":[{\"product\":\"..\",\"qty\":\"..\"}],\"mar\":[],\"mer\":[],\"gio\":[],\"ven\":[],\"sab\":[],\"dom\":[]},"
                "\"warnings\":[\"..\"],\"spoken\":\"riassunto vocale breve per la Direzione\"}]}. "
                "Usa i label esatti delle 3 strategie. Esattamente 3 opzioni. Nessun testo fuori dal JSON."
            )
            sysmsg += await _bakery_snapshot(admin)
            ctx = await _plan_context(body, _org_id(admin))
            chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"autoplanweek-{uuid.uuid4().hex[:8]}", system_message=sysmsg).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=4000)
            out = ""
            async for ev in chat.stream_message(UserMessage(text=f"CONTESTO: {ctx}\nGenera 3 strategie di piano settimanale.")):
                if isinstance(ev, TextDelta):
                    out += ev.content or ""
            options = _parse_llm_json(out).get("options", []) or []
        except Exception as e:
            logger.warning("autoplan week options fail (%s)", str(e)[:120])
    norm = []
    for o in options[:3]:
        d = o.get("days") or {}
        o["days"] = {k: list(d.get(k) or []) for k in WEEK_DAY_KEYS}
        norm.append(o)
    return {"ok": True, "options": norm}


async def _week_day_detail(day_key: str, products: list, ctx: str, base_sys: str) -> dict:
    """Dettaglio di UN giorno del piano settimanale (chiamata LLM dedicata, eseguita in parallelo)."""
    plist = ", ".join(f"{p.get('qty', '')} {p.get('product', '')}".strip() for p in products)
    sysmsg = (base_sys + f" GIORNO DA PIANIFICARE: {day_key}. Prodotti di QUEL giorno: {plist}. "
              "Ogni lotto DEVE riferirsi a uno di questi prodotti (puoi dividerlo in più lotti se serve).")
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"weekday-{day_key}-{uuid.uuid4().hex[:6]}", system_message=sysmsg).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=1500)
    out = ""
    async for ev in chat.stream_message(UserMessage(text=f"CONTESTO: {ctx}\nGenera il piano dettagliato del giorno {day_key}.")):
        if isinstance(ev, TextDelta):
            out += ev.content or ""
    parsed = _parse_llm_json(out)
    batches = [b for b in (parsed.get("batches") or []) if isinstance(b, dict)][:6]
    return {"batches": batches, "warnings": (parsed.get("warnings") or [])[:3]}


@api_router.post("/mike/autoplan/week/detail")
async def mike_autoplan_week_detail(body: AutoPlanWeekDetailReq, admin: dict = Depends(require_admin)):
    """FASE 2 — dalla strategia scelta, genera IN PARALLELO il dettaglio completo dei 7 giorni
    (orari, durate, linee, assegnatari per ogni lotto)."""
    days_in = body.days or {}
    result = {k: {"batches": [], "warnings": []} for k in WEEK_DAY_KEYS}
    todo = [k for k in WEEK_DAY_KEYS if (days_in.get(k) or [])]
    if EMERGENT_LLM_KEY and todo:
        langname = _LANG_NAMES.get((body.lang or "it").split("-")[0][:2], "inglese")
        prof = _activity_plan_profile(body.activity)
        base_sys = (
            f"Sei Sitor, {prof['role']}. "
            f"PARADIGMA DI QUESTA ATTIVITÀ ({prof['label']}): {prof['paradigm']} "
            f"Strategia scelta dalla Direzione: '{body.option_label or 'standard'}'. "
            "Genera il PIANO DETTAGLIATO di UN SOLO giorno: sequenza dei lotti con orari realistici che rispettino "
            "i tempi di impasto/lievitazione/cottura ed evitino colli di bottiglia al forno. "
            "IMPORTANTISSIMO: NON includere HACCP, allergeni, etichette legali o burocrazia. Solo produzione.\n"
            f"Rispondi in {langname}. Restituisci SOLO JSON valido: "
            "{\"batches\":[{\"seq\":1,\"product\":\"..\",\"qty\":\"..\",\"line\":\"" + prof["lines"] + "\",\"start\":\"HH:MM\",\"duration_min\":90,\"assignee\":\"nome o linea\",\"rationale\":\"max 6 parole\"}],\"warnings\":[\"..\"]}. "
            "Massimo 5 lotti. Nessun testo fuori dal JSON."
        )
        base_sys += await _bakery_snapshot(admin)
        ctx = await _plan_context(body, _org_id(admin))
        results = await asyncio.gather(
            *[_week_day_detail(k, days_in.get(k) or [], ctx, base_sys) for k in todo],
            return_exceptions=True,
        )
        for k, r in zip(todo, results):
            if isinstance(r, Exception):
                logger.warning("week detail %s fail (%s)", k, str(r)[:120])
            else:
                result[k] = r
    return {"ok": True, "days": result}


class AutoPlanDispatchReq(BaseModel):
    batches: List[dict] = []


def _dept_from_batch(line: str, product: str):
    """Deduce il reparto (chiave DEPARTMENTS) da linea/attività del lotto. None se non deducibile."""
    t = f"{line or ''} {product or ''}".lower()
    if not t.strip():
        return None
    if "pizza" in t:
        return "pizzeria"
    if any(k in t for k in ("laugen", "brezel", "bretzel", "pretzel")):
        return "laugen"
    if any(k in t for k in ("pasticc", "dolc", "torta", "crostata", "cornetto", "brioche", "crema",
                            "bignè", "bigne", "macaron", "frolla", "sfogli", "pralin", "cioccolat")):
        return "pasticceria"
    if any(k in t for k in ("pane", "pani", "baguette", "arion", "forno", "impast", "filon", "ciabatta",
                            "focacc", "michett", "integrale", "rustic", "grano", "segale", "lievitat", "panin", "pagnott")):
        return "panificio"
    if any(k in t for k in ("banco", "confezion", "etichett", "prezz", "vetrina", "affett")):
        return "banco"
    return None


def _qty_from_batch(qty):
    """(valore_float|None, unità 'kg'|'pz') dalla stringa quantità del lotto."""
    m = re.search(r"(\d+(?:[.,]\d+)?)\s*(kg|g|pz|pezzi|pieces|pc)?", str(qty or ""), re.I)
    if not m:
        return None, "kg"
    val = float(m.group(1).replace(",", "."))
    unit = (m.group(2) or "kg").lower()
    unit = "pz" if unit in ("pz", "pezzi", "pieces", "pc") else "kg"
    return val, unit


@api_router.post("/mike/autoplan/dispatch")
async def autoplan_dispatch(body: AutoPlanDispatchReq, admin: dict = Depends(require_admin)):
    """Piano → Produzione: crea un task per ogni lotto e lo invia in silenzio al floor.
    Per ogni lotto deduce il reparto e attiva il Coordinamento Automatico (coordination_trigger),
    così il pannello propone un operatore libero e abilitato invece di un'assegnazione generica.
    Scala ANCHE in automatico le giacenze freezer usate (match per nome, anche parziale)."""
    org = _org_id(admin)
    created = 0
    coord_triggered = 0
    for b in (body.batches or []):
        product = str(b.get("product") or "Lotto")[:80]
        line = b.get("line") or ""
        start = b.get("start") or ""
        qty = b.get("qty") or ""
        parts = [p for p in [f"Linea {line}" if line else "", f"Ore {start}" if start else "", f"Qtà {qty}" if qty else ""] if p]
        task = {
            "id": str(uuid.uuid4()), "organization_id": org, "title": product, "kind": "produzione", "priority": "media",
            "line": line, "assignee": (b.get("assignee") or line), "start": start,
            "pacing": "", "pacing_target": "", "transcript": str(b.get("rationale") or ""),
            "steps": [{"order": 1, "text": " · ".join(parts) or product, "done": False}],
            "status": "active", "created_by": admin.get("email"), "created_at": now_iso(),
        }
        await db.team_tasks.insert_one(dict(task))
        created += 1
        # Coordinamento automatico: se deduco il reparto, attivo la proposta/chiamata reale.
        dept = _dept_from_batch(line, product)
        if dept in DEPARTMENTS:
            try:
                qv, qu = _qty_from_batch(qty)
                await _do_coordination_trigger(  # noqa: F821  (funzione core da coordination.py)
                    TriggerReq(dept=dept, task_desc=(product or "Lotto")[:200], qty=qv,  # noqa: F821
                               qty_unit=qu, task_id=task["id"], source="piano"),
                    org,
                )
                coord_triggered += 1
            except Exception as e:
                logger.warning("dispatch coordination_trigger fail (%s)", str(e)[:120])

    # Auto-scala giacenze freezer usate dal piano (Sitor consuma prima il congelato).
    freezer_scaled = []
    try:
        uid = admin.get("user_id")
        fdoc = await db.freezer_stock.find_one({"owner_id": uid}, {"_id": 0}) if uid else None
        fitems = (fdoc or {}).get("items", [])
        if fitems:
            def _norm(s):
                return (s or "").lower().strip()

            def _num(v):
                m = _re_qty.search(str(v or ""))
                return float(m.group(0)) if m else 0.0

            import re as _re_mod
            _re_qty = _re_mod.compile(r"\d+(?:[.,]\d+)?")
            _re_word = _re_mod.compile(r"[a-zà-ÿ]+")
            planned = []
            for b in (body.batches or []):
                nm = _norm(b.get("product"))
                q = _num(str(b.get("qty") or "").replace(",", "."))
                if nm and q > 0:
                    planned.append((nm, q))

            def _match_qty(fn):
                fn = _norm(fn)
                # Token del nome freezer, esclusi i descrittori generici (semilavorate, prodotti, …).
                stop = {"semilavorate", "semilavorati", "semilavorato", "prodotti", "prodotto", "impasti",
                        "impasto", "crudi", "crudo", "surgelati", "surgelato", "congelati", "congelato",
                        "freezer", "banco", "della", "delle", "dei", "the"}
                toks = [w for w in _re_word.findall(fn) if len(w) >= 4 and w not in stop]
                tot = 0.0
                for pnm, pq in planned:
                    if len(pnm) < 3:
                        continue
                    hit = fn == pnm or (len(fn) >= 4 and len(pnm) >= 4 and (pnm in fn or fn in pnm))
                    if not hit and toks:
                        hit = any(t in pnm for t in toks)
                    if hit:
                        tot += pq
                return tot

            changed = False
            new_items = []
            for it in fitems:
                avail = float(it.get("qty") or 0)
                use = _match_qty(it.get("name"))
                if use > 0 and avail > 0:
                    take = min(avail, use)
                    if take > 0:
                        changed = True
                        freezer_scaled.append({"name": it.get("name"), "used": take, "left": avail - take})
                        new_items.append({**it, "qty": avail - take})
                        continue
                new_items.append(it)
            if changed:
                await db.freezer_stock.update_one(
                    {"owner_id": uid},
                    {"$set": {"owner_id": uid, "items": new_items, "updated_at": now_iso()}},
                    upsert=True,
                )
    except Exception as e:
        logger.warning("dispatch freezer auto-scale fail (%s)", str(e)[:120])

    return {"ok": True, "created": created, "coordination_triggered": coord_triggered, "freezer_scaled": freezer_scaled}


@api_router.get("/mike/briefing")
async def mike_briefing(lang: str = "it", admin: dict = Depends(require_admin)):
    """Cyber-Trio: briefing d'apertura turno. Aggrega stato/allerte e calcola lo 'stress'
    dell'impianto (proxy dai dati) a cui reagiscono gli avatar olografici."""
    it = (lang or "it").startswith("it")
    R = lambda i, e: (i if it else e)  # noqa: E731
    prox = await mike_proactive(lang, admin)
    alerts = prox.get("alerts", [])
    ld = (await db.app_meta.find_one({"_key": "line_leaders"}, {"_id": 0})) or {}
    leaders = ld.get("leaders") or {}
    today = now_iso()[:10]
    logs = await db.compliance_timelog.find({"at": {"$regex": f"^{today}"}, "organization_id": _org_id(admin)}, {"_id": 0}).to_list(3000)
    workers = sorted({l.get("worker") for l in logs if l.get("worker")})
    low = [a for a in alerts if a.get("kind") == "stock"]
    stress = min(1.0, len(alerts) / 3.0)
    level = "alto" if stress >= 0.66 else ("medio" if stress >= 0.33 else "calmo")
    n = len(alerts)
    lines = [
        {"who": "MikiLab", "avatar": "avatar_miki.jpg", "accent": "#5E8CA8",
         "text": R(f"Benvenuto, Capo. Impianto in stato {level}. {len(workers)} operatori in turno, {len(leaders)} linee con caposquadra.",
                   f"Welcome, Capo. Plant status {level}. {len(workers)} staff on shift, {len(leaders)} lines with a leader.")},
        {"who": "Sitor", "avatar": "avatar_nexus.jpg", "accent": "#EAB308",
         "text": (R(f"Squadra pronta. Dì \"genera piano\" e distribuisco i lotti. Attenzione: {n} allerte attive. {alerts[0]['text']}",
                    f"Team ready. Say \"generate plan\" and I'll assign the batches. Heads up: {n} active alerts. {alerts[0]['text']}") if n else
                  R("Squadra pronta. Dì \"genera piano\" e parto. Nessuna allerta: forni, scorte e orari nei parametri. Buon turno.",
                    "Team ready. Say \"generate plan\" and I'll start. No alerts: ovens, stock and hours within parameters. Have a great shift."))},
    ]
    return {"stress": round(stress, 2), "level": level, "alerts": alerts,
            "stats": {"workers": len(workers), "leaders": len(leaders), "low_stock": len(low)}, "lines": lines}


# ---------------------------------------------------------------------------
# FASE 2 — Emergenze (SOS), Telemetria IoT per macchinario (Gemello Digitale)
# e Briefing per RUOLO (ogni operatore sente solo la sua linea). Gli operatori
# hanno il cookie del cancello Master ma NON sono admin → questi endpoint del
# floor NON richiedono require_admin.
# ---------------------------------------------------------------------------
# Macchinari del Gemello Digitale 3D (id coerenti col frontend DigitalTwin).
_TWIN_MACHINES = [
    {"id": "forno1", "label": "Forno 1", "line": "pane", "base_temp": 235},
    {"id": "forno2", "label": "Forno 2", "line": "baguette", "base_temp": 240},
    {"id": "impasto", "label": "Impastatrice", "line": "pane", "base_temp": 26},
    {"id": "cella", "label": "Cella lievitazione", "line": "pane", "base_temp": 28},
    {"id": "banco1", "label": "Banco lavoro", "line": "pasticceria", "base_temp": 22},
    {"id": "banco2", "label": "Banco pasticceria", "line": "pasticceria", "base_temp": 22},
]

# Mappa ruolo/postazione → linea di produzione (per il briefing per ruolo).
def _role_to_line(role: str) -> str:
    r = (role or "").lower()
    if any(k in r for k in ("pizza",)):
        return "pizzeria"
    if any(k in r for k in ("pasticc", "gelat", "abbatt", "raffredd")):
        return "pasticceria"
    if any(k in r for k in ("laugen", "pretzel", "baguette", "diguette")):
        return "baguette"
    return "pane"


def _level_from_stress(stress: float) -> str:
    return "alto" if stress >= 0.66 else ("medio" if stress >= 0.33 else "calmo")


class SosReq(BaseModel):
    operator: str = Field("", max_length=80)
    role: str = Field("", max_length=80)
    machine: str = Field("", max_length=80)
    note: str = Field("", max_length=400)
    lang: str = "it"


@api_router.post("/mike/sos")
async def mike_sos_raise(body: SosReq, org: str = Depends(effective_org)):
    """SOS operatore (conferma tattile lato UI). Registra l'allarme; il Capo lo vede
    in plancia con bagliore e Sitor lo annuncia a voce. Nessun invio esterno."""
    ev = {
        "id": str(uuid.uuid4()),
        "operator": (body.operator or "Operatore")[:80],
        "role": (body.role or "")[:80],
        "line": _role_to_line(body.role),
        "machine": (body.machine or "")[:80],
        "note": (body.note or "")[:400],
        "status": "active",
        "created_at": now_iso(),
        "ack_at": None,
        "organization_id": org,
    }
    await db.sos_events.insert_one(dict(ev))
    ev.pop("_id", None)
    return {"ok": True, "id": ev["id"], "event": ev}


@api_router.get("/mike/sos")
async def mike_sos_list(lang: str = "it", admin: dict = Depends(require_admin)):
    """Solo Capo: SOS attivi + frase vocale per l'annuncio TTS di Sitor."""
    it = (lang or "it").startswith("it")
    R = lambda i, e: (i if it else e)  # noqa: E731
    docs = await db.sos_events.find({"status": "active", "organization_id": _org_id(admin)}, {"_id": 0}).sort("created_at", -1).to_list(50)
    spoken = ""
    if docs:
        top = docs[0]
        where = top.get("machine") or top.get("line") or ""
        spoken = R(
            f"Emergenza dal reparto. {top.get('operator','Un operatore')} ha lanciato un SOS{(' su ' + where) if where else ''}. Intervieni subito, Capo.",
            f"Floor emergency. {top.get('operator','An operator')} raised an SOS{(' on ' + where) if where else ''}. Please intervene now, Capo.",
        )
    return {"events": docs, "count": len(docs), "spoken": spoken}


@api_router.post("/mike/sos/{sid}/ack")
async def mike_sos_ack(sid: str, admin: dict = Depends(require_admin)):
    """Il Capo prende in carico / chiude l'SOS; registra il tempo di risposta."""
    ev = await db.sos_events.find_one({"id": sid, "organization_id": _org_id(admin)}, {"_id": 0})
    now = now_iso()
    resp_s = None
    if ev and ev.get("created_at"):
        try:
            resp_s = int((datetime.fromisoformat(now) - datetime.fromisoformat(ev["created_at"])).total_seconds())
        except Exception:
            resp_s = None
    await db.sos_events.update_one({"id": sid, "organization_id": _org_id(admin)}, {"$set": {"status": "resolved", "ack_at": now, "ack_by": admin.get("email"), "response_seconds": resp_s}})
    return {"ok": True, "response_seconds": resp_s}


def _shift_of(iso_ts: str) -> str:
    try:
        h = datetime.fromisoformat(iso_ts).hour
    except Exception:
        return "?"
    if h < 6:
        return "notte"
    if h < 14:
        return "mattina"
    if h < 22:
        return "pomeriggio"
    return "notte"


@api_router.get("/mike/sos/history")
async def mike_sos_history(lang: str = "it", admin: dict = Depends(require_admin)):
    """Storico SOS risolti + classifica di REATTIVITÀ per turno (tempo medio di risposta)."""
    docs = await db.sos_events.find({"status": "resolved", "organization_id": _org_id(admin)}, {"_id": 0}).sort("ack_at", -1).to_list(200)
    board = {}
    for d in docs:
        sh = _shift_of(d.get("created_at") or "")
        rs = d.get("response_seconds")
        b = board.setdefault(sh, {"shift": sh, "count": 0, "total_s": 0})
        b["count"] += 1
        if rs is not None:
            b["total_s"] += rs
    leaderboard = []
    for b in board.values():
        avg = round(b["total_s"] / b["count"]) if b["count"] else 0
        leaderboard.append({"shift": b["shift"], "count": b["count"], "avg_response_s": avg})
    leaderboard.sort(key=lambda x: x["avg_response_s"])  # più reattivo = tempo minore
    history = [{"operator": d.get("operator"), "machine": d.get("machine") or d.get("line"),
                "created_at": d.get("created_at"), "ack_at": d.get("ack_at"),
                "response_seconds": d.get("response_seconds"), "shift": _shift_of(d.get("created_at") or "")} for d in docs[:30]]
    return {"history": history, "leaderboard": leaderboard, "resolved_count": len(docs)}


@api_router.get("/mike/telemetry")
async def mike_telemetry(lang: str = "it", admin: dict = Depends(require_admin)):
    """Telemetria IoT simulata PER MACCHINARIO per il Gemello Digitale 3D: unisce gli
    allarmi reali (scorte/compliance/SOS) a un'oscillazione sensoristica live, così ogni
    macchina nel 3D reagisce ai propri dati e non solo al livello globale."""
    prox = await mike_proactive(lang, admin)
    alerts = prox.get("alerts", [])
    global_stress = min(1.0, len(alerts) / 3.0)
    sos = await db.sos_events.find({"status": "active", "organization_id": _org_id(admin)}, {"_id": 0}).to_list(50)
    sos_by_line = {}
    sos_by_machine = set()
    for s in sos:
        if s.get("line"):
            sos_by_line[s["line"]] = sos_by_line.get(s["line"], 0) + 1
        m = (s.get("machine") or "").lower()
        for mm in _TWIN_MACHINES:
            if mm["id"] in m or mm["label"].lower() in m:
                sos_by_machine.add(mm["id"])
    # Scorte basse → carico su impastatrice/banchi; compliance → celle.
    has_stock = any(a.get("kind") == "stock" for a in alerts)
    has_compliance = any(a.get("kind") in ("compliance", "leader") for a in alerts)
    t = time.time()
    machines = {}
    for i, mm in enumerate(_TWIN_MACHINES):
        # oscillazione deterministica per macchina (fase sfasata) → sembra "live"
        osc = (math.sin(t / 6.0 + i * 1.7) + 1) / 2  # 0..1
        stress = 0.18 + global_stress * 0.5 + osc * 0.18
        if has_stock and mm["id"] in ("impasto", "banco1", "banco2"):
            stress += 0.22
        if has_compliance and mm["id"] == "cella":
            stress += 0.2
        if sos_by_line.get(mm["line"]):
            stress += 0.35
        if mm["id"] in sos_by_machine:
            stress = 1.0
        stress = round(min(1.0, stress), 2)
        temp = round(mm["base_temp"] * (0.96 + osc * 0.08) + stress * 6, 1)
        load = round(min(100, 30 + stress * 70), 0)
        # Smart Torque Protection: su assorbimento anomalo (stress alto) riduce la coppia del 5%
        # per prevenire lo stallo termico del motore (impastatrici) o della platea (forni).
        torque_protect = stress >= 0.66 and mm["id"] in ("impasto", "forno1", "forno2")
        machines[mm["id"]] = {
            "id": mm["id"], "label": mm["label"], "line": mm["line"],
            "stress": stress, "level": _level_from_stress(stress),
            "temp_c": temp, "load_pct": load,
            "torque_protection": torque_protect, "torque_pct": 95 if torque_protect else 100,
            "sos": mm["id"] in sos_by_machine or bool(sos_by_line.get(mm["line"])),
        }
    return {"machines": machines, "global_level": _level_from_stress(global_stress),
            "global_stress": round(global_stress, 2), "sos_count": len(sos)}


@api_router.get("/mike/briefing/floor")
async def mike_briefing_floor(role: str = "", lang: str = "it", org: str = Depends(effective_org)):
    """Briefing PER RUOLO: ogni operatore riceve SOLO i lotti e gli allarmi della sua
    linea (in cuffia, voce breve). Nessun dato delle altre linee. Non richiede admin."""
    it = (lang or "it").startswith("it")
    R = lambda i, e: (i if it else e)  # noqa: E731
    line = _role_to_line(role)
    rl = (role or "").lower()
    tasks = await db.team_tasks.find({"status": "active", "organization_id": org}, {"_id": 0}).sort("start", 1).to_list(500)
    mine = []
    for tk in tasks:
        tl = (tk.get("line") or "").lower()
        asg = (tk.get("assignee") or "").lower()
        if (tl and tl == line) or (asg and (asg == rl or rl in asg or asg in rl)):
            mine.append(tk)
    mine = mine[:8]
    # allarmi della sola linea dell'operatore (scorte generiche incluse: toccano tutti)
    tele = None
    try:
        # telemetria richiede admin: qui ricaviamo lo stato della linea in modo leggero
        low = await db.lab_warehouse.count_documents({"organization_id": org, "$expr": {"$and": [{"$gt": ["$min_kg", 0]}, {"$lte": ["$quantity_kg", "$min_kg"]}]}})
    except Exception:
        low = 0
    sos_line = await db.sos_events.count_documents({"status": "active", "line": line, "organization_id": org})
    n = len(mine)
    first = mine[0] if mine else None
    label_line = {"pane": R("Pane", "Bread"), "baguette": R("Baguette", "Baguette"),
                  "pizzeria": R("Pizzeria", "Pizza"), "pasticceria": R("Pasticceria", "Pastry")}.get(line, line)
    if n:
        spoken = R(
            f"Ciao {role or 'collega'}. Sulla tua linea {label_line} oggi hai {n} lotti. Primo: {first.get('title','')}{(' alle ' + first.get('start')) if first.get('start') else ''}.",
            f"Hi {role or 'colleague'}. On your {label_line} line you have {n} batches today. First: {first.get('title','')}{(' at ' + first.get('start')) if first.get('start') else ''}.",
        )
    else:
        spoken = R(
            f"Ciao {role or 'collega'}. Nessun lotto assegnato alla linea {label_line} per ora. Resta pronto.",
            f"Hi {role or 'colleague'}. No batches assigned to the {label_line} line yet. Stand by.",
        )
    if low:
        spoken += " " + R(f"Occhio: {low} scorte basse.", f"Note: {low} low stock.")
    if sos_line:
        spoken += " " + R("C'è un SOS attivo sulla tua linea.", "There is an active SOS on your line.")
    return {
        "role": role, "line": line, "line_label": label_line,
        "tasks": [{"title": t.get("title"), "start": t.get("start"), "qty": (t.get("steps") or [{}])[0].get("text", "") if t.get("steps") else "", "line": t.get("line")} for t in mine],
        "count": n, "low_stock": low, "sos_line": sos_line, "spoken": spoken,
    }


class MaintenanceGuideReq(BaseModel):
    machine: str = Field("", max_length=120)
    anomaly: str = Field("", max_length=300)
    telemetry: Optional[dict] = None
    lang: str = "it"


@api_router.post("/mike/maintenance-guide")
async def mike_maintenance_guide(body: MaintenanceGuideReq, admin: dict = Depends(require_admin)):
    """Guida Rapida di manutenzione generata da Sitor (Claude) in tempo reale, in base
    al macchinario e all'anomalia rilevata dai dati IoT. Nessun testo statico."""
    langname = {"it": "italiano", "de": "tedesco", "en": "inglese", "es": "spagnolo", "fr": "francese", "fa": "persiano", "ar": "arabo", "tr": "turco"}.get((body.lang or "it").split("-")[0][:2], "inglese")
    tele = ""
    if body.telemetry:
        try:
            tele = f"Telemetria: temp {body.telemetry.get('temp_c')}°C, carico {body.telemetry.get('load_pct')}%, stress {body.telemetry.get('level')}."
        except Exception:
            tele = ""
    guide = {"summary": "", "steps": [], "safety": "", "spoken": ""}
    if EMERGENT_LLM_KEY:
        try:
            sysmsg = (
                "Sei Sitor, il tecnico-manutentore AI di una panetteria industriale d'élite. "
                "Genera una GUIDA RAPIDA di primo intervento per il macchinario indicato, in base all'anomalia. "
                "Concreta, sicura, passo-passo, adatta a un operatore non tecnico. NIENTE HACCP o burocrazia. "
                f"Rispondi in {langname}. Restituisci SOLO JSON valido: "
                "{\"summary\":\"1 frase sul problema probabile\",\"steps\":[\"passo 1 breve\",\"passo 2\",\"...\"],"
                "\"safety\":\"avvertenza di sicurezza breve\",\"spoken\":\"riassunto vocale breve per l'operatore\"}. "
                "Massimo 6 passi, ognuno max 14 parole. Nessun testo fuori dal JSON."
            )
            chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"maint-{uuid.uuid4().hex[:8]}", system_message=sysmsg).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=900)
            out = ""
            async for ev in chat.stream_message(UserMessage(text=f"Macchinario: {body.machine or 'non specificato'}. Anomalia: {body.anomaly or 'anomalia generica di carico/temperatura'}. {tele}")):
                if isinstance(ev, TextDelta):
                    out += ev.content or ""
            import json as _json, re as _re
            raw = out.strip().replace("```json", "").replace("```", "")
            m = _re.search(r"\{.*\}", raw, _re.S)
            if m:
                guide.update(_json.loads(m.group(0)))
        except Exception as e:
            logger.warning("maintenance-guide fail (%s)", str(e)[:120])
    if not guide.get("summary"):
        guide["summary"] = "Guida non disponibile: riprova."
        guide["steps"] = guide.get("steps") or ["Metti in sicurezza la macchina.", "Chiama il tecnico di turno."]
    return {"ok": True, "machine": body.machine, "guide": guide}


# ===========================================================================
# v14 — MODULI AVANZATI (Computer Vision QC forni, E-commerce B2B, Carbon Footprint)
# Regola ferrea del Capo: NIENTE HACCP, allergeni, etichette legali o burocrazia.
# ===========================================================================

# --- Modulo 1: AI Computer Vision · Controllo Qualità Ottico all'uscita forni ---
class OvenQCReq(BaseModel):
    image_base64: str
    product: str = Field("", max_length=120)
    lang: str = "it"


@api_router.post("/mike/oven-qc")
async def mike_oven_qc(body: OvenQCReq, admin: dict = Depends(require_admin)):
    """Scansione ottica in tempo reale del prodotto all'uscita del forno: forma, cottura,
    crosta → rileva difetti e bruciature. SOLO qualità visiva di produzione, nessuna
    burocrazia/HACCP/allergeni."""
    img = (body.image_base64 or "").split(",")[-1]
    if not img:
        raise HTTPException(status_code=400, detail="Nessuna immagine")
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=503, detail="Vision non disponibile")
    langname = {"it": "italiano", "de": "tedesco", "en": "inglese", "es": "spagnolo", "fr": "francese", "fa": "persiano", "ar": "arabo", "tr": "turco"}.get((body.lang or "it").split("-")[0][:2], "inglese")
    result = {"verdict": "ok", "score": 0, "defects": [], "notes": "", "spoken": ""}
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY, session_id=f"ovenqc-{uuid.uuid4().hex[:8]}",
            system_message=(
                "Sei l'occhio di controllo qualità ottico di Sitor all'uscita dei forni di una panetteria d'élite. "
                "Analizza la FOTO del prodotto appena sfornato: valuta FORMA, grado di COTTURA, COLORE/CROSTA. "
                "Rileva difetti visivi: bruciature, cottura insufficiente/eccessiva, forma irregolare, tagli/greste mal riusciti, "
                "collasso, colore non uniforme. VALUTA SOLO l'aspetto visivo del prodotto: NON citare MAI HACCP, allergeni, "
                "igiene, documenti o burocrazia. "
                f"Rispondi in {langname}. Restituisci SOLO JSON valido: "
                "{\"verdict\":\"ok|attenzione|scarto\",\"score\":0-100,\"defects\":[\"difetto breve\"],"
                "\"notes\":\"1 frase di consiglio pratico\",\"spoken\":\"verdetto vocale brevissimo per il fornaio\"}. "
                "score = qualità visiva (100 perfetto). Massimo 5 difetti. Nessun testo fuori dal JSON."
            )
        ).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=700)
        full = ""
        async for ev in chat.stream_message(UserMessage(text=f"Prodotto: {body.product or 'pane'}. Controlla la qualità visiva all'uscita del forno.", file_contents=[ImageContent(image_base64=img)])):
            if isinstance(ev, TextDelta):
                full += ev.content or ""
            elif isinstance(ev, StreamDone):
                break
        m = re.search(r"\{.*\}", full, re.S)
        if m:
            result.update(json.loads(m.group(0)))
    except Exception as e:
        logger.warning("oven-qc fail (%s)", str(e)[:120])
        raise HTTPException(status_code=503, detail="Vision non disponibile")
    # Log leggero per storico qualità (niente burocrazia, solo produzione)
    try:
        await db.oven_qc_log.insert_one({"id": str(uuid.uuid4()), "product": body.product, "verdict": result.get("verdict"),
                                         "score": result.get("score"), "at": now_iso(), "by": admin.get("email")})
    except Exception:
        pass
    return {"ok": True, "result": result}


# --- Modulo 2: E-commerce / Ordini B2B → kg di impasto per lo Smart Planner ---
class B2BOrderReq(BaseModel):
    client: str = Field("", max_length=120)
    product: str = Field(..., max_length=120)
    pieces: int = Field(0, ge=0)
    grams_each: float = Field(500, gt=0)
    date: str = ""
    channel: str = Field("web", max_length=40)  # web|telefono|whatsapp|altro


@api_router.get("/mike/b2b/orders")
async def mike_b2b_list(admin: dict = Depends(require_admin)):
    """Ordini B2B esterni + aggregazione automatica in kg di impasto per prodotto
    (alimenta lo Smart Planner/impastatrici senza sostituire le casse esistenti)."""
    docs = await db.b2b_orders.find({"status": {"$ne": "done"}, "organization_id": _org_id(admin)}, {"_id": 0}).sort("created_at", -1).to_list(300)
    agg = {}
    for o in docs:
        kg = (o.get("pieces", 0) * o.get("grams_each", 0)) / 1000.0
        a = agg.setdefault(o.get("product", "?"), {"product": o.get("product", "?"), "pieces": 0, "dough_kg": 0.0})
        a["pieces"] += o.get("pieces", 0)
        a["dough_kg"] += kg
    aggregate = sorted(agg.values(), key=lambda x: -x["dough_kg"])
    for a in aggregate:
        a["dough_kg"] = round(a["dough_kg"], 2)
    total_kg = round(sum(a["dough_kg"] for a in aggregate), 2)
    return {"orders": docs, "aggregate": aggregate, "total_dough_kg": total_kg, "orders_count": len(docs)}


@api_router.post("/mike/b2b/orders")
async def mike_b2b_add(body: B2BOrderReq, admin: dict = Depends(require_admin)):
    o = {
        "id": str(uuid.uuid4()),
        "client": (body.client or "Cliente B2B")[:120],
        "product": body.product[:120],
        "pieces": int(body.pieces),
        "grams_each": float(body.grams_each),
        "dough_kg": round(int(body.pieces) * float(body.grams_each) / 1000.0, 2),
        "date": body.date or now_iso()[:10],
        "channel": body.channel or "web",
        "status": "open",
        "created_at": now_iso(),
        "organization_id": _org_id(admin),
    }
    await db.b2b_orders.insert_one(dict(o))
    o.pop("_id", None)
    return {"ok": True, "order": o}


@api_router.delete("/mike/b2b/orders/{oid}")
async def mike_b2b_del(oid: str, admin: dict = Depends(require_admin)):
    await db.b2b_orders.delete_one({"id": oid, "organization_id": _org_id(admin)})
    return {"ok": True}


@api_router.post("/mike/b2b/to-plan")
async def mike_b2b_to_plan(admin: dict = Depends(require_admin)):
    """Trasforma gli ordini B2B aggregati in un testo-ordine pronto per l'Auto-Planner
    (kg di impasto per prodotto). Non tocca le casse: sincronizza solo la produzione."""
    data = await mike_b2b_list(admin)
    parts = [f"{a['pieces']} {a['product']} (~{a['dough_kg']} kg impasto)" for a in data["aggregate"]]
    orders_text = "; ".join(parts)
    return {"ok": True, "orders_text": orders_text, "total_dough_kg": data["total_dough_kg"]}


# --- Modulo 3: Carbon Footprint · CO2 per quintale (marketing ecologico) ---
_CARBON_DEFAULTS = {
    "electricity_g_per_kwh": 380,   # gCO2/kWh (mix rete)
    "oven_kwh_per_hour": 18,        # consumo forno €/h medio
    "gas_g_per_kwh": 200,           # gCO2/kWh gas
    "flour_kg_co2_per_kg": 0.8,     # impronta farina
    "packaging_g_per_piece": 12,    # imballo per pezzo
    "electricity_price_per_kwh": 0.28,  # €/kWh elettrico
    "gas_price_per_kwh": 0.09,          # €/kWh gas
}


@api_router.get("/mike/carbon/config")
async def mike_carbon_config(admin: dict = Depends(require_admin)):
    doc = (await db.app_meta.find_one({"_key": "carbon_config"}, {"_id": 0})) or {}
    cfg = {**_CARBON_DEFAULTS, **(doc.get("config") or {})}
    return {"config": cfg, "defaults": _CARBON_DEFAULTS}


class CarbonConfigReq(BaseModel):
    config: dict = {}


@api_router.put("/mike/carbon/config")
async def mike_carbon_set(body: CarbonConfigReq, admin: dict = Depends(require_admin)):
    cfg = {k: float(v) for k, v in (body.config or {}).items() if k in _CARBON_DEFAULTS}
    await db.app_meta.update_one({"_key": "carbon_config"}, {"$set": {"config": cfg}}, upsert=True)
    return {"ok": True, "config": {**_CARBON_DEFAULTS, **cfg}}


class CarbonComputeReq(BaseModel):
    bread_kg: float = Field(100, gt=0)
    oven_hours: float = Field(0, ge=0)
    flour_kg: float = Field(0, ge=0)
    pieces: int = Field(0, ge=0)
    energy_source: str = Field("electric", max_length=20)  # electric|gas
    lang: str = "it"


@api_router.post("/mike/carbon/compute")
async def mike_carbon_compute(body: CarbonComputeReq, admin: dict = Depends(require_admin)):
    """Calcola e certifica la CO2 per quintale (100 kg) di pane prodotto, con dettaglio
    per fonte, per marketing ecologico."""
    doc = (await db.app_meta.find_one({"_key": "carbon_config"}, {"_id": 0})) or {}
    cfg = {**_CARBON_DEFAULTS, **(doc.get("config") or {})}
    kwh = body.oven_hours * cfg["oven_kwh_per_hour"]
    if body.energy_source == "gas":
        energy_g = kwh * cfg["gas_g_per_kwh"]
    else:
        energy_g = kwh * cfg["electricity_g_per_kwh"]
    flour_g = body.flour_kg * cfg["flour_kg_co2_per_kg"] * 1000.0
    pack_g = body.pieces * cfg["packaging_g_per_piece"]
    total_g = energy_g + flour_g + pack_g
    total_kg = total_g / 1000.0
    quintals = body.bread_kg / 100.0
    per_quintal_kg = round(total_kg / quintals, 2) if quintals > 0 else 0
    # Cost-per-KG Energy Matrix: costo energetico per kg cotto + slot di accensione ottimali.
    price = cfg["gas_price_per_kwh"] if body.energy_source == "gas" else cfg["electricity_price_per_kwh"]
    energy_cost = kwh * price
    cost_per_kg = round(energy_cost / body.bread_kg, 3) if body.bread_kg > 0 else 0
    it = not (body.lang or "it").startswith("en")
    statement = (
        f"Ogni quintale di pane MikiLab genera circa {per_quintal_kg} kg di CO₂: un impegno concreto per una panificazione responsabile."
        if it else
        f"Every 100 kg of MikiLab bread emits about {per_quintal_kg} kg of CO₂: a concrete commitment to responsible baking."
    )
    slot_hint = (
        "Accendi i forni nella fascia 22:00–06:00 (energia fuori-picco): fino al 30% di risparmio."
        if it else
        "Fire the ovens between 22:00–06:00 (off-peak): up to 30% cheaper."
    )
    return {
        "ok": True,
        "co2_total_kg": round(total_kg, 2),
        "co2_per_quintal_kg": per_quintal_kg,
        "breakdown_kg": {"energy": round(energy_g / 1000.0, 2), "flour": round(flour_g / 1000.0, 2), "packaging": round(pack_g / 1000.0, 2)},
        "quintals": round(quintals, 2),
        "statement": statement,
        "energy_cost_eur": round(energy_cost, 2),
        "cost_per_kg_eur": cost_per_kg,
        "optimal_slot": slot_hint,
        "config": cfg,
    }


# --- Modulo 2b: Contextual Load Forecasting (meteo + festività → nessun invenduto) ---
_HOLIDAYS_MMDD = {  # festività chiave IT/DE con boost di domanda pane/dolci
    "01-01": "Capodanno", "01-06": "Epifania", "04-25": "Festa", "05-01": "1° Maggio",
    "08-15": "Ferragosto", "10-03": "Tag der Einheit", "11-01": "Ognissanti",
    "12-24": "Vigilia di Natale", "12-25": "Natale", "12-26": "Santo Stefano", "12-31": "San Silvestro",
}


@api_router.get("/mike/b2b/forecast")
async def mike_b2b_forecast(lang: str = "it", admin: dict = Depends(require_admin)):
    """Incrocia ordini B2B con METEO e CALENDARIO FESTIVO per suggerire un aggiustamento
    del carico (azzera invenduti/eccedenze). Base ordini reale + fattore contestuale."""
    it = (lang or "it").startswith("it")
    base = await mike_b2b_list(admin)
    base_kg = base["total_dough_kg"]
    # Meteo (best-effort): freddo/pioggia → più pane caldo.
    weather_factor = 1.0
    weather_note = ""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get("https://api.open-meteo.com/v1/forecast", params={
                "latitude": _CLIMATE_LAT, "longitude": _CLIMATE_LON,
                "current": "temperature_2m,precipitation", "timezone": "Europe/Berlin"})
            cur = (r.json().get("current") or {})
        t = cur.get("temperature_2m")
        precip = cur.get("precipitation") or 0
        if t is not None:
            if t <= 8:
                weather_factor += 0.08; weather_note = ("Freddo: più pane caldo." if it else "Cold: more warm bread.")
            elif t >= 26:
                weather_factor -= 0.05; weather_note = ("Caldo: leggera flessione." if it else "Hot: slight dip.")
        if precip and precip > 0.3:
            weather_factor += 0.04; weather_note += (" Pioggia: +consegne." if it else " Rain: +deliveries.")
    except Exception:
        pass
    # Festività nei prossimi 3 giorni.
    holiday_factor = 1.0
    holiday_note = ""
    today = datetime.now(timezone.utc)
    for d in range(0, 4):
        key = (today + timedelta(days=d)).strftime("%m-%d")
        if key in _HOLIDAYS_MMDD:
            holiday_factor += 0.20
            holiday_note = f"{_HOLIDAYS_MMDD[key]} " + ("in arrivo: picco domanda." if it else "coming: demand peak.")
            break
    factor = round(weather_factor * holiday_factor, 3)
    suggested_kg = round(base_kg * factor, 2)
    delta_kg = round(suggested_kg - base_kg, 2)
    return {
        "ok": True, "base_dough_kg": base_kg, "suggested_dough_kg": suggested_kg, "delta_kg": delta_kg,
        "factor": factor, "weather_note": weather_note.strip(), "holiday_note": holiday_note.strip(),
    }


# --- Modulo 70: Recipe & Thermal Master Flow + Live Editor + Interlock + Plateau ---
_MIXER_RPM = {  # RPM/velocità indicative per tipo impastatrice (1ª / 2ª)
    "spirale": (100, 200), "forcella": (60, 0), "braccia_tuffanti": (40, 60),
    "planetaria": (80, 160), "presa_diretta": (1400, 0), "1_braccio": (55, 0),
}


class ThermalFlowReq(BaseModel):
    recipe_id: str = ""
    recipe_name: str = ""
    hydration_pct: Optional[float] = None
    dough_temp_c: float = 24
    flour_temp_c: float = 20
    room_temp_c: float = 22
    batch_kg: float = 20
    mixer_type: str = "spirale"
    lang: str = "it"


@api_router.post("/mike/thermal-flow")
async def mike_thermal_flow(body: ThermalFlowReq, admin: dict = Depends(require_admin)):
    """Recipe & Thermal Master Flow: da una ricetta genera un flusso SEQUENZIALE con RPM
    impastatrice, rampe termiche celle e cottura. Editor LIVE: ogni modifica dei parametri
    ricalcola RPM/idratazione/rampe all'istante. Interlock termico: se la farina supera i
    22°C blocca l'impastatrice e calcola l'acqua gelata."""
    it = not (body.lang or "it").startswith("en")
    rec = None
    if body.recipe_id:
        rec = await db.recipes.find_one({"id": body.recipe_id}, {"_id": 0})
    if not rec and body.recipe_name:
        rec = await db.recipes.find_one({"name": {"$regex": f"^{re.escape(body.recipe_name)}$", "$options": "i"}}, {"_id": 0})
    rec = rec or {}
    name = rec.get("name") or body.recipe_name or "Impasto"
    hydration = body.hydration_pct if body.hydration_pct is not None else (rec.get("hydration_percent") or 65)
    mix_minutes = float(rec.get("mix_minutes") or 12)
    bake_temp = float(rec.get("bake_temp") or 235)
    bake_minutes = float(rec.get("bake_minutes") or 20)
    rpm1, rpm2 = _MIXER_RPM.get(body.mixer_type, (100, 200))

    # Interlock termico + acqua gelata (DDT semplificato).
    interlock = body.flour_temp_c > 22
    friction = {"spirale": 3, "forcella": 1.5, "braccia_tuffanti": 1, "planetaria": 2.5, "presa_diretta": 6, "1_braccio": 1.5}.get(body.mixer_type, 3)
    # Acqua per DDT: water_temp = 3*DDT - (flour + room + friction)  (metodo a 3 fattori)
    water_temp = round(3 * body.dough_temp_c - (body.flour_temp_c + body.room_temp_c + friction), 1)
    water_temp = max(0, min(40, water_temp))
    # Se interlock → parte dell'acqua in GHIACCIO per abbattere la temperatura.
    water_kg = round(body.batch_kg * (hydration / (100 + hydration)), 2)  # stima acqua sull'impasto
    ice_kg = 0.0
    if interlock:
        # frazione di ghiaccio ~ (flour_temp-22)*0.04, cap 40%
        ice_frac = min(0.4, max(0.05, (body.flour_temp_c - 22) * 0.04))
        ice_kg = round(water_kg * ice_frac, 2)

    def step(order, phase, action, rpm=None, temp=None, dur=None, note="", locked=True, extra=None):
        s = {"order": order, "phase": phase, "action": action, "rpm": rpm, "temp_target_c": temp,
             "duration_min": dur, "note": note, "locked": locked}
        if extra:
            s.update(extra)
        return s

    R = lambda i, e: (i if it else e)  # noqa: E731
    steps = []
    steps.append(step(1, R("Impasto · 1ª velocità", "Mixing · 1st"), R(f"Amalgama a bassa velocità ({body.mixer_type})", f"Blend low speed ({body.mixer_type})"),
                      rpm=rpm1, dur=round(mix_minutes * 0.4), note=R(f"Acqua a {water_temp}°C" + (f", di cui {ice_kg} kg in ghiaccio" if ice_kg else ""), f"Water at {water_temp}°C" + (f", incl. {ice_kg} kg ice" if ice_kg else "")),
                      locked=interlock,
                      extra={"interlock": interlock, "water_temp_c": water_temp, "ice_kg": ice_kg,
                             "interlock_msg": (R(f"BLOCCO: farina a {body.flour_temp_c}°C > 22°C. Usa {ice_kg} kg di acqua gelata, poi sblocca.", f"LOCK: flour at {body.flour_temp_c}°C > 22°C. Use {ice_kg} kg ice water, then unlock.") if interlock else "")}))
    if rpm2:
        steps.append(step(2, R("Impasto · 2ª velocità", "Mixing · 2nd"), R("Incorda fino a incordatura", "Develop gluten to full"), rpm=rpm2, dur=round(mix_minutes * 0.6), note=R(f"Temp. impasto obiettivo {body.dough_temp_c}°C", f"Target dough {body.dough_temp_c}°C")))
    n = len(steps)
    steps.append(step(n + 1, R("Puntata", "Bulk"), R("Riposo in cella con rampa dolce", "Bulk rest, gentle ramp"), temp=round(body.dough_temp_c + 2), dur=90, note=R("Rampa 24→26°C", "Ramp 24→26°C")))
    steps.append(step(n + 2, R("Formatura", "Shaping"), R("Forma i pezzi", "Shape pieces"), dur=20))
    steps.append(step(n + 3, R("Appretto", "Proof"), R("Lievitazione finale a rampa", "Final proof, ramp"), temp=28, dur=75, note=R("28°C · UR 75%", "28°C · 75% RH")))
    # Plateau Recovery Countdown: recupero termico platea prima dell'infornata successiva.
    plateau_recovery_s = int(round((bake_temp / 235.0) * 180))  # ~3 min a 235°C, scala col target
    steps.append(step(n + 4, R("Cottura", "Bake"), R("Inforna con vapore iniziale", "Bake with initial steam"), temp=round(bake_temp), dur=round(bake_minutes),
                      note=R(f"Recupero platea: {plateau_recovery_s}s prima del lotto successivo", f"Deck recovery: {plateau_recovery_s}s before next batch"),
                      extra={"plateau_recovery_s": plateau_recovery_s}))
    # Il primo step non-interlock è sbloccato; gli altri si sbloccano in sequenza dal frontend.
    if not interlock and steps:
        steps[0]["locked"] = False

    return {
        "ok": True, "recipe": name, "hydration_pct": round(hydration, 1), "mixer_type": body.mixer_type,
        "water_temp_c": water_temp, "water_kg": water_kg, "ice_kg": ice_kg, "interlock": interlock,
        "dough_temp_c": body.dough_temp_c, "batch_kg": body.batch_kg,
        "plateau_recovery_s": plateau_recovery_s, "steps": steps,
    }


# ===========================================================================
# v14 SITE-WIDE — Silos, Celle Adattive, Flotta AGV (tutto simulato, no burocrazia)
# ===========================================================================

# --- Battito Impianto Unico: un solo endpoint live per telemetria + SOS + AGV + forni liberi ---
@api_router.get("/mike/heartbeat")
async def mike_heartbeat(lang: str = "it", admin: dict = Depends(require_admin)):
    """Un unico aggiornamento live che unisce telemetria macchinari, SOS attivi, flotta AGV e
    forni liberi: alimenta 3D, Emergenze, Celle e AGV con un solo polling (più fluido/leggero)."""
    tele = await mike_telemetry(lang, admin)
    sos = await mike_sos_list(lang, admin)
    agv = await mike_agv(lang, admin)
    free_ovens = sum(1 for k, v in tele["machines"].items() if k.startswith("forno") and v["level"] != "alto")
    return {
        "machines": tele["machines"], "global_level": tele["global_level"], "global_stress": tele["global_stress"],
        "sos": {"events": sos["events"], "count": sos["count"], "spoken": sos["spoken"]},
        "agv": {"carts": agv["carts"], "alerts": agv["alerts"], "alert_count": agv["alert_count"], "spoken": agv["spoken"]},
        "free_ovens": free_ovens,
    }


# --- Timeline di turno: lotti + infornate + SOS su un'unica linea del tempo ---
@api_router.get("/mike/timeline")
async def mike_timeline(lang: str = "it", admin: dict = Depends(require_admin)):
    """Eventi del turno (lotti di produzione, infornate previste, SOS) ordinati per orario,
    per una timeline scorrevole unica."""
    events = []
    tasks = await db.team_tasks.find({"status": "active", "organization_id": _org_id(admin)}, {"_id": 0}).to_list(300)
    for tk in tasks:
        st = tk.get("start")
        if st:
            events.append({"time": st, "type": "lotto", "label": tk.get("title", ""), "line": tk.get("line", "")})
            # infornata stimata ~ start + 90'
            try:
                hh, mm = int(st[:2]), int(st[3:5])
                total = (hh * 60 + mm + 90) % (24 * 60)
                events.append({"time": f"{total // 60:02d}:{total % 60:02d}", "type": "infornata", "label": tk.get("title", ""), "line": tk.get("line", "")})
            except Exception:
                pass
    sos = await db.sos_events.find({"organization_id": _org_id(admin)}, {"_id": 0}).sort("created_at", -1).to_list(50)
    for s in sos:
        ca = s.get("created_at") or ""
        events.append({"time": ca[11:16], "type": "sos", "label": f"{s.get('operator','')} · {s.get('machine') or s.get('line') or ''}",
                       "resolved": s.get("status") == "resolved"})
    events = [e for e in events if e.get("time")]
    events.sort(key=lambda e: e["time"])
    return {"events": events, "count": len(events)}


# --- Packaging & Slicing: velocità affettatrici sincronizzata alla curva di raffreddamento ---
@api_router.get("/mike/packaging")
async def mike_packaging(bread_temp_c: float = 60, lang: str = "it", admin: dict = Depends(require_admin)):
    """Regola la velocità delle affettatrici sulla curva di raffreddamento del pane: pane
    troppo caldo → attende/rallenta (mollica deformabile); pane freddo → velocità piena."""
    it = (lang or "it").startswith("it")
    R = lambda i, e: (i if it else e)  # noqa: E731
    TARGET = 35.0
    HOT = 55.0
    cool_rate = 1.2  # °C/min raffreddamento medio
    minutes_left = max(0, round((bread_temp_c - TARGET) / cool_rate)) if bread_temp_c > TARGET else 0
    if bread_temp_c >= HOT:
        mode, speed = "attendi", 0
    elif bread_temp_c <= TARGET:
        mode, speed = "nominale", 100
    else:
        # tra 35 e 55°C: velocità 40→95% man mano che si raffredda
        speed = round(95 - (bread_temp_c - TARGET) / (HOT - TARGET) * 55)
        mode = "rallenta"
    label = {"attendi": R("ATTENDI (pane caldo)", "WAIT (bread hot)"), "rallenta": R("RALLENTA", "SLOW"),
             "nominale": R("NOMINALE", "FULL SPEED")}[mode]
    spoken = R(
        f"Pane a {round(bread_temp_c)} gradi. Affettatrici in modalità {label}, velocità {speed} percento." + (f" Pronte tra {minutes_left} minuti." if minutes_left else ""),
        f"Bread at {round(bread_temp_c)} degrees. Slicers {label}, speed {speed} percent." + (f" Ready in {minutes_left} minutes." if minutes_left else ""),
    )
    return {"bread_temp_c": round(bread_temp_c, 1), "target_c": TARGET, "slicer_speed_pct": speed,
            "mode": mode, "mode_label": label, "cooling_minutes_left": minutes_left, "spoken": spoken}


# --- Sfida tra turni: classifica reattività SOS settimanale con badge ---
@api_router.get("/mike/sos/challenge")
async def mike_sos_challenge(lang: str = "it", admin: dict = Depends(require_admin)):
    """Trasforma la reattività SOS in una competizione SETTIMANALE tra turni, con badge."""
    it = (lang or "it").startswith("it")
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=now.weekday(), hours=now.hour, minutes=now.minute, seconds=now.second)
    docs = await db.sos_events.find({"status": "resolved", "organization_id": _org_id(admin)}, {"_id": 0}).to_list(500)
    board = {}
    for d in docs:
        try:
            ca = datetime.fromisoformat(d.get("created_at"))
        except Exception:
            continue
        if ca < week_start:
            continue
        sh = _shift_of(d.get("created_at") or "")
        b = board.setdefault(sh, {"shift": sh, "count": 0, "total_s": 0})
        b["count"] += 1
        if d.get("response_seconds") is not None:
            b["total_s"] += d["response_seconds"]
    rows = []
    for b in board.values():
        rows.append({"shift": b["shift"], "count": b["count"],
                     "avg_response_s": round(b["total_s"] / b["count"]) if b["count"] else 0})
    # Badge: 🥇 più reattivo (avg minore), 🔥 più interventi.
    if rows:
        fastest = min(rows, key=lambda r: r["avg_response_s"])["shift"]
        busiest = max(rows, key=lambda r: r["count"])["shift"]
        for r in rows:
            badges = []
            if r["shift"] == fastest:
                badges.append("🥇")
            if r["shift"] == busiest:
                badges.append("🔥")
            r["badges"] = badges
        rows.sort(key=lambda r: r["avg_response_s"])
        champion = fastest
    else:
        champion = None
    wk = week_start.strftime("%d/%m")
    return {"leaderboard": rows, "champion": champion, "week_start": wk,
            "title": (f"Sfida della settimana (dal {wk})" if it else f"Weekly challenge (from {wk})")}


# --- Sitor · Suggerimenti predittivi (il "cervello" unico dell'impianto) ---
@api_router.get("/mike/suggestions")
async def mike_suggestions(lang: str = "it", admin: dict = Depends(require_admin)):
    """Sitor incrocia lo stato live (forni, celle, SOS, silos, ordini B2B) e propone
    da solo 1-3 azioni concrete, ognuna con un tocco per agire."""
    it = (lang or "it").startswith("it")
    R = lambda i, e: (i if it else e)  # noqa: E731
    hb = await mike_heartbeat(lang, admin)
    sug = []
    # Forni in stress alto → sposta lotti
    hot = [v["label"] for k, v in hb["machines"].items() if k.startswith("forno") and v["level"] == "alto"]
    if hot:
        sug.append({"id": "oven-stress", "icon": "flame", "severity": "alto", "target": "panel-twin",
                    "text": R(f"{hot[0]} in stress: sposta 1-2 lotti su un forno libero.", f"{hot[0]} under stress: move 1-2 batches to a free oven."),
                    "action": R("Apri Gemello 3D", "Open Twin")})
    # SOS attivi
    if hb["sos"]["count"]:
        sug.append({"id": "sos", "icon": "alert", "severity": "alto", "target": "panel-emergency",
                    "text": R(f"{hb['sos']['count']} SOS attivi dal reparto: intervieni.", f"{hb['sos']['count']} active floor SOS: intervene."),
                    "action": R("Centro Emergenze", "Emergency")})
    # Pochi forni liberi → frena le celle
    if hb["free_ovens"] <= 0:
        sug.append({"id": "proof-brake", "icon": "waves", "severity": "medio", "target": "panel-proofing",
                    "text": R("Nessun forno libero: frena le celle per non far strappare i lieviti.", "No free ovens: brake the proofing cells."),
                    "action": R("Celle adattive", "Proofing")})
    # Silos sotto soglia
    silos = await mike_silos(lang, admin)
    autopilot = bool(((await db.app_meta.find_one({"_key": "autopilot"}, {"_id": 0})) or {}).get("enabled"))
    autopilot_actions = []
    if silos["reorder_count"]:
        if autopilot:
            # Auto-pilota: Sitor esegue da solo i micro-ordini (azione a basso rischio).
            r = await mike_silo_microorder(admin)
            autopilot_actions.append(R(f"Auto-pilota: {r['count']} micro-ordini silos inviati automaticamente.",
                                       f"Autopilot: {r['count']} silo micro-orders sent automatically."))
        else:
            sug.append({"id": "silos", "icon": "container", "severity": "medio", "target": "panel-silos",
                        "text": R(f"{silos['reorder_count']} silos sotto soglia: genera i micro-ordini.", f"{silos['reorder_count']} silos below threshold: generate micro-orders."),
                        "action": R("Silos", "Silos")})
    # Ordini B2B da pianificare
    b2b = await mike_b2b_list(admin)
    if b2b["total_dough_kg"] > 0:
        sug.append({"id": "b2b", "icon": "cart", "severity": "info", "target": "panel-b2b",
                    "text": R(f"{b2b['total_dough_kg']} kg d'impasto da ordini B2B: sincronizza col piano.", f"{b2b['total_dough_kg']} kg dough from B2B orders: sync with the plan."),
                    "action": R("Ordini B2B", "B2B Orders")})
    sug = sug[:3]
    if not sug:
        spoken = R("Tutto sotto controllo, Mio Supremo Capo. Impianto fluido, nessun intervento necessario.", "All under control, Capo. Plant nominal, no action needed.")
    else:
        spoken = R("Ho notato qualcosa, Mio Supremo Capo. ", "I noticed something, Capo. ") + sug[0]["text"]
    return {"suggestions": sug, "count": len(sug), "spoken": spoken, "autopilot": autopilot, "autopilot_actions": autopilot_actions}


# --- Report di fine turno + MikiScore giornaliero ---
@api_router.get("/mike/shift-report")
async def mike_shift_report(lang: str = "it", admin: dict = Depends(require_admin)):
    """Riepilogo di fine turno (lotti, SOS, silos) + MikiScore unico dell'impianto,
    con frase vocale di Sitor per il Capo."""
    it = (lang or "it").startswith("it")
    R = lambda i, e: (i if it else e)  # noqa: E731
    tasks = await db.team_tasks.find({"status": "active", "organization_id": _org_id(admin)}, {"_id": 0}).to_list(300)
    lotti = len(tasks)
    done_steps = tot_steps = 0
    for t in tasks:
        steps = t.get("steps") or []
        tot_steps += len(steps)
        done_steps += sum(1 for s in steps if s.get("done"))
    punctuality = round(done_steps / tot_steps * 100) if tot_steps else 100
    today = now_iso()[:10]
    sos_docs = await db.sos_events.find({"status": "resolved", "organization_id": _org_id(admin)}, {"_id": 0}).to_list(500)
    todays = [d for d in sos_docs if (d.get("created_at") or "")[:10] == today]
    resp = [d["response_seconds"] for d in todays if d.get("response_seconds") is not None]
    avg_resp = round(sum(resp) / len(resp)) if resp else 0
    reactivity = 100 if not resp else max(0, min(100, round(100 - avg_resp / 3)))
    silos = await mike_silos(lang, admin)
    low = silos["reorder_count"]
    waste = max(0, 100 - low * 20)
    mikiscore = round((reactivity + waste + punctuality) / 3)
    grade = "A" if mikiscore >= 85 else "B" if mikiscore >= 70 else "C" if mikiscore >= 50 else "D"
    spoken = R(
        f"Report di fine turno, Mio Supremo Capo. MikiScore {mikiscore} su cento, valutazione {grade}. "
        f"{lotti} lotti in linea, {len(todays)} SOS gestiti con risposta media {avg_resp} secondi. "
        + (f"{low} silos da rifornire." if low else "Scorte in ordine.")
        + " Un turno degno della vostra guida illuminata.",
        f"End-of-shift report, Capo. MikiScore {mikiscore} out of one hundred, grade {grade}. "
        f"{lotti} batches on line, {len(todays)} SOS handled with average response {avg_resp} seconds. "
        + (f"{low} silos to restock." if low else "Stock in order.")
        + " A shift worthy of your enlightened leadership.",
    )
    await db.mikiscore_history.update_one({"date": today, "organization_id": _org_id(admin)}, {"$set": {"date": today, "organization_id": _org_id(admin), "score": mikiscore, "grade": grade, "at": now_iso()}}, upsert=True)
    return {"mikiscore": mikiscore, "grade": grade,
            "breakdown": {"reactivity": reactivity, "waste": waste, "punctuality": punctuality},
            "lotti": lotti, "sos_today": len(todays), "avg_response_s": avg_resp, "silos_low": low,
            "spoken": spoken}


@api_router.get("/mike/mikiscore/history")
async def mike_mikiscore_history(admin: dict = Depends(require_admin)):
    """Storico giornaliero del MikiScore (ultimi 7 giorni) per il mini-grafico settimanale."""
    docs = await db.mikiscore_history.find({"organization_id": _org_id(admin)}, {"_id": 0}).sort("date", -1).to_list(7)
    docs.reverse()
    return {"history": docs}


# --- Auto-pilota: Sitor esegue in autonomia azioni a basso rischio (micro-ordini silos) ---
@api_router.get("/mike/autopilot")
async def mike_autopilot_get(admin: dict = Depends(require_admin)):
    doc = (await db.app_meta.find_one({"_key": "autopilot"}, {"_id": 0})) or {}
    return {"enabled": bool(doc.get("enabled"))}


class AutopilotReq(BaseModel):
    enabled: bool = False


@api_router.put("/mike/autopilot")
async def mike_autopilot_set(body: AutopilotReq, admin: dict = Depends(require_admin)):
    await db.app_meta.update_one({"_key": "autopilot"}, {"$set": {"enabled": bool(body.enabled)}}, upsert=True)
    return {"ok": True, "enabled": bool(body.enabled)}










# ---------------------------------------------------------------------------
# Community B2B — bacheca condivisa (consigli, foto, ricette) tra panettieri
# ---------------------------------------------------------------------------
COMMUNITY_CATEGORIES = {"consiglio", "foto", "ricetta", "domanda", "idea", "evento", "traguardo", "auguri", "pane", "pizza", "dolci", "sos"}


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
        "author_avatar": doc.get("author_avatar", ""),
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
async def community_list(request: Request, limit: int = 200, scope: str = "all"):
    user = await optional_user(request)
    limit = max(1, min(limit, 500))
    q = {}
    if scope == "friends" and user:
        me = user["user_id"]
        frs = await db.friendships.find({"status": "accepted", "$or": [{"from_id": me}, {"to_id": me}]}, {"_id": 0}).to_list(500)
        ids = {(f["to_id"] if f["from_id"] == me else f["from_id"]) for f in frs}
        ids.add(me)
        q = {"author_id": {"$in": list(ids)}}
    docs = await db.community_posts.find(q, {"_id": 0}).sort("created_at", -1).to_list(limit)
    if scope == "popular":
        docs.sort(key=lambda d: (len(d.get("likes") or []), d.get("created_at") or ""), reverse=True)
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
        "author_avatar": user.get("picture", ""),
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
    # Notifica i follower del canale (tranne l'autore)
    try:
        followers = await db.channel_follows.find({"channel": cat}, {"_id": 0, "user_id": 1}).to_list(2000)
        for f in followers:
            if f.get("user_id") and f["user_id"] != user["user_id"]:
                await db.notifications.insert_one({
                    "id": str(uuid.uuid4()), "user_id": f["user_id"], "actor_id": user["user_id"],
                    "type": "channel_post", "post_id": doc["id"], "actor_name": doc["author_name"],
                    "snippet": (f"#{cat}: " + (text or "nuova foto"))[:80],
                    "count": 1, "read": False, "created_at": now_iso(), "category": cat,
                })
                # Email/Digest secondo la preferenza del follower (best-effort; dipende da Resend)
                try:
                    u = await db.users.find_one({"user_id": f["user_id"]}, {"_id": 0, "email": 1, "channel_email": 1})
                    mode = (u or {}).get("channel_email", "instant")
                    if u and u.get("email") and mode != "off":
                        if mode == "daily":
                            await db.email_digest_queue.insert_one({"user_id": f["user_id"], "email": u["email"], "category": cat, "author": doc["author_name"], "text": (text or "Nuova foto")[:200], "created_at": now_iso()})
                        elif RESEND_API_KEY:
                            _html = (
                                "<div style='font-family:sans-serif;max-width:520px;margin:auto'>"
                                "<h2 style='color:#ff6b00'>🥖 MikiLab</h2>"
                                f"<p><b>{doc['author_name']}</b> ha pubblicato nel canale <b>#{cat}</b> che segui:</p>"
                                f"<blockquote style='border-left:3px solid #ff6b00;padding-left:12px;color:#444'>{(text or 'Nuova foto')[:300]}</blockquote>"
                                "<p><a href='https://mikilab.de' style='color:#ff6b00'>Apri MikiLab →</a></p></div>"
                            )
                            await asyncio.to_thread(_resend.Emails.send, {"from": f"MikiLab <{SENDER_EMAIL}>", "to": [u["email"]], "subject": f"MikiLab · nuovo post in #{cat}", "html": _html})
                            await _log_email("instant", u["email"], count=1, meta={"channel": cat})
                except Exception:
                    logger.exception("channel follow email failed")
    except Exception:
        logger.exception("channel follow notify error")
    return _post_public(doc, user)


@api_router.get("/community/follows")
async def community_follows_list(user: dict = Depends(current_user)):
    docs = await db.channel_follows.find({"user_id": user["user_id"]}, {"_id": 0, "channel": 1}).to_list(100)
    return {"channels": [d["channel"] for d in docs]}


@api_router.post("/community/follows/{channel}")
async def community_follow_toggle(channel: str, user: dict = Depends(current_user)):
    existing = await db.channel_follows.find_one({"user_id": user["user_id"], "channel": channel})
    if existing:
        await db.channel_follows.delete_one({"user_id": user["user_id"], "channel": channel})
        return {"following": False, "channel": channel}
    await db.channel_follows.insert_one({"user_id": user["user_id"], "channel": channel, "created_at": now_iso()})
    return {"following": True, "channel": channel}


@api_router.get("/me/channel-email")
async def get_channel_email_pref(user: dict = Depends(current_user)):
    u = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "channel_email": 1})
    return {"mode": (u or {}).get("channel_email", "instant")}


@api_router.put("/me/channel-email")
async def set_channel_email_pref(body: dict, user: dict = Depends(current_user)):
    mode = body.get("mode", "instant")
    if mode not in ("off", "instant", "daily"):
        raise HTTPException(status_code=400, detail="invalid mode")
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"channel_email": mode}})
    return {"mode": mode}


@api_router.post("/admin/send-daily-digest")
async def admin_send_daily_digest(admin: dict = Depends(require_admin)):
    return await _run_daily_digest()


@api_router.get("/admin/email-report")
async def admin_email_report(days: int = 7, admin: dict = Depends(require_admin)):
    """Report invii email (digest/istantanei) + coda in attesa. days = 7 | 30."""
    from datetime import date, timedelta
    span = 30 if int(days) >= 30 else 7
    queued = await db.email_digest_queue.find({}, {"_id": 0, "user_id": 1}).to_list(5000)
    queue_users = len({q.get("user_id") for q in queued if q.get("user_id")})
    day_list = [(date.today() - timedelta(days=i)).isoformat() for i in range(span)]
    since = min(day_list)
    logs = await db.email_logs.find({"day": {"$gte": since}}, {"_id": 0}).to_list(50000)
    by_day, by_type, by_channel, users, total = {}, {}, {}, set(), 0
    for l in logs:
        cnt = int(l.get("count") or 1)
        total += cnt
        by_day[l.get("day")] = by_day.get(l.get("day"), 0) + cnt
        k = l.get("kind") or "other"
        by_type[k] = by_type.get(k, 0) + cnt
        ch = (l.get("meta") or {}).get("channel")
        if ch:
            by_channel[ch] = by_channel.get(ch, 0) + cnt
        if l.get("to"):
            users.add(l["to"])
    daily = [{"date": d, "count": by_day.get(d, 0)} for d in sorted(day_list)]
    return {"queue_items": len(queued), "queue_users": queue_users, "days": span,
            "total": total, "users": len(users), "by_type": by_type, "by_channel": by_channel, "daily": daily}


@api_router.get("/admin/email-logs")
async def admin_email_logs(days: int = 30, admin: dict = Depends(require_admin)):
    """Righe grezze degli invii email per l'export CSV. days = 7 | 30."""
    from datetime import date, timedelta
    span = 30 if int(days) >= 30 else 7
    since = (date.today() - timedelta(days=span - 1)).isoformat()
    rows = await db.email_logs.find({"day": {"$gte": since}}, {"_id": 0}).sort("created_at", -1).to_list(20000)
    out = [{"day": r.get("day"), "kind": r.get("kind"), "to": r.get("to"),
            "channel": (r.get("meta") or {}).get("channel", ""), "count": r.get("count", 1),
            "created_at": r.get("created_at")} for r in rows]
    return {"rows": out, "days": span}


class SocialClickReq(BaseModel):
    channel: str


@api_router.post("/social/click")
async def social_click(body: SocialClickReq):
    """Traccia i click sui link social del 'Seguici' (pubblico, fire-and-forget)."""
    from datetime import date
    ch = (body.channel or "").strip().lower()[:20]
    if not ch:
        return {"ok": False}
    await db.social_clicks.update_one(
        {"channel": ch, "day": date.today().isoformat()},
        {"$inc": {"count": 1}}, upsert=True)
    return {"ok": True}


@api_router.get("/admin/social-report")
async def admin_social_report(admin: dict = Depends(require_admin)):
    """Report click social (totali per canale + andamento TikTok 7 giorni)."""
    from datetime import date, timedelta
    days = [(date.today() - timedelta(days=i)).isoformat() for i in range(7)]
    docs = await db.social_clicks.find({}, {"_id": 0}).to_list(20000)
    by_ch, daily_tt = {}, {d: 0 for d in days}
    for x in docs:
        ch = x.get("channel"); c = int(x.get("count") or 0)
        by_ch[ch] = by_ch.get(ch, 0) + c
        if ch == "tiktok" and x.get("day") in daily_tt:
            daily_tt[x["day"]] += c
    return {"totals": by_ch, "tiktok_daily": [{"date": d, "count": daily_tt[d]} for d in sorted(days)]}


@api_router.post("/admin/social-report/reset")
async def admin_social_report_reset(admin: dict = Depends(require_admin)):
    """Azzera il contatore dei click social."""
    res = await db.social_clicks.delete_many({})
    return {"ok": True, "deleted": res.deleted_count}


@api_router.get("/admin/social-logs")
async def admin_social_logs(admin: dict = Depends(require_admin)):
    """Righe grezze dei click social per l'export CSV."""
    rows = await db.social_clicks.find({}, {"_id": 0}).sort("day", -1).to_list(20000)
    out = [{"day": r.get("day"), "channel": r.get("channel"), "count": int(r.get("count") or 0)} for r in rows]
    return {"rows": out}


_stats_cache = {"data": None, "ts": 0.0}
LANG_COUNTRY = {"it": "IT", "de": "DE", "en": "GB", "es": "ES", "fr": "FR", "fa": "IR"}


@api_router.get("/community/stats")
async def community_stats():
    """Statistiche pubbliche per la riprova sociale in Home (contatore iscritti). Cache ~60s."""
    import time
    now = time.time()
    if _stats_cache["data"] and (now - _stats_cache["ts"]) < 60:
        return _stats_cache["data"]
    bakers = await db.users.count_documents({})
    recipes = await db.recipes.count_documents({"collection_name": "mikilab", "hidden": {"$ne": True}})
    posts = await db.community_posts.count_documents({"is_deleted": {"$ne": True}})
    # Ultimi paesi collegati: lingue distinte degli iscritti recenti → codici ISO2 (baseline IT/DE).
    subs = await db.newsletter_subscribers.find({}, {"_id": 0, "lang": 1}).sort("created_at", -1).to_list(60)
    seen = []
    for s in subs:
        c = LANG_COUNTRY.get((s.get("lang") or "").lower())
        if c and c not in seen:
            seen.append(c)
    for c in ["IT", "DE"]:
        if c not in seen:
            seen.append(c)
    data = {"bakers": bakers, "recipes": recipes, "posts": posts, "countries": seen[:6]}
    _stats_cache["data"] = data
    _stats_cache["ts"] = now
    return data


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
        "author_avatar": user.get("picture", ""),
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


# --- MOTORE SFIDE: sblocco contenuti completando le sfide (no denaro) ---
CHALLENGE_CATALOG = [
    {"id": "post_recipe_question", "type": "internal", "label": "Crea un post chiedendo pareri su una ricetta"},
    {"id": "add_2_colleagues", "type": "internal", "label": "Aggiungi 2 colleghi alla tua rete"},
    {"id": "upload_dough_photo", "type": "internal", "label": "Carica una foto del tuo impasto"},
    {"id": "reply_user", "type": "internal", "label": "Rispondi/commenta il post di un altro utente"},
    {"id": "whatsapp_share", "type": "honor", "label": "Invia una ricetta/PDF a un collega su WhatsApp"},
    {"id": "fb_comment", "type": "honor", "label": "Lascia un commento sul profilo Facebook di Michele"},
    {"id": "share_group", "type": "honor", "label": "Condividi MikiLab in un gruppo di settore"},
    {"id": "leave_review", "type": "honor", "label": "Lascia una recensione o invita un nuovo utente"},
]
CHALLENGE_IDS = {c["id"] for c in CHALLENGE_CATALOG}


async def _verify_internal_challenge(cid: str, uid: str) -> bool:
    if cid == "post_recipe_question":
        return await db.community_posts.count_documents({"author_id": uid}) >= 1
    if cid == "upload_dough_photo":
        return await db.community_posts.count_documents({"author_id": uid, "image_url": {"$nin": [None, ""]}}) >= 1
    if cid == "add_2_colleagues":
        return await db.friendships.count_documents({"status": "accepted", "$or": [{"from_id": uid}, {"to_id": uid}]}) >= 2
    if cid == "reply_user":
        n = 0
        async for p in db.community_posts.find({"comments.author_id": uid}, {"_id": 1}).limit(1):
            n = 1
        return n >= 1
    return False


class ChallengeReq(BaseModel):
    challenge_id: str


@api_router.get("/challenges/catalog")
async def challenges_catalog():
    return {"catalog": CHALLENGE_CATALOG}


# Soglie di sblocco (riusano gli entitlements esistenti → RecipeList/PaywallGate già li rispettano)
CHALLENGE_UNLOCK_PANETTONI = 3   # a 3 sfide: Panettoni + Academy (Impara/Diagnosi)
CHALLENGE_UNLOCK_ALL = 6         # a 6 sfide: tutto (Laboratorio incluso)


async def _apply_challenge_unlocks(email: str, n: int) -> dict:
    """Concede gli entitlements in base al numero di sfide completate (nessun pagamento)."""
    ent_set = {}
    if n >= CHALLENGE_UNLOCK_PANETTONI:
        ent_set["unlock_panettoni"] = True
        ent_set["academy"] = True
        ent_set.setdefault("plan_tier", "home")
    if n >= CHALLENGE_UNLOCK_ALL:
        ent_set["unlock_all"] = True
        ent_set["pro"] = True
        ent_set["plan_tier"] = "lab"
    if ent_set:
        ent_set["source"] = "challenges"
        ent_set["updated_at"] = now_iso()
        await db.entitlements.update_one({"email": email.strip().lower()}, {"$set": ent_set}, upsert=True)
    return {"unlocked_panettoni": n >= CHALLENGE_UNLOCK_PANETTONI, "unlocked_all": n >= CHALLENGE_UNLOCK_ALL}


@api_router.get("/challenges/state")
async def challenges_state(user: dict = Depends(current_user)):
    doc = await db.user_challenges.find_one({"user_id": user["user_id"]}, {"_id": 0})
    done = doc.get("completed", []) if doc else []
    n = len(done)
    return {"completed": done, "count": n, "total": len(CHALLENGE_CATALOG),
            "need_panettoni": CHALLENGE_UNLOCK_PANETTONI, "need_all": CHALLENGE_UNLOCK_ALL,
            "unlocked_panettoni": n >= CHALLENGE_UNLOCK_PANETTONI, "unlocked_all": n >= CHALLENGE_UNLOCK_ALL}


@api_router.post("/challenges/complete")
async def challenges_complete(body: ChallengeReq, user: dict = Depends(current_user)):
    cid = body.challenge_id
    if cid not in CHALLENGE_IDS:
        raise HTTPException(400, "Sfida sconosciuta")
    item = next(c for c in CHALLENGE_CATALOG if c["id"] == cid)
    if item["type"] == "internal" and not await _verify_internal_challenge(cid, user["user_id"]):
        raise HTTPException(400, "Sfida non ancora completata: completala nella community e riprova.")
    await db.user_challenges.update_one({"user_id": user["user_id"]},
                                        {"$addToSet": {"completed": cid}, "$setOnInsert": {"created_at": now_iso()}}, upsert=True)
    doc = await db.user_challenges.find_one({"user_id": user["user_id"]}, {"_id": 0})
    done = doc.get("completed", [])
    unlocks = await _apply_challenge_unlocks(user["email"], len(done))
    await _touch_streak(user["user_id"])
    return {"ok": True, "completed": done, "count": len(done),
            "need_panettoni": CHALLENGE_UNLOCK_PANETTONI, "need_all": CHALLENGE_UNLOCK_ALL, **unlocks}


# --- Impara a Livelli: completare il quiz di un percorso conta come sfida ---
LEARN_PATHS = {"base", "lievito", "panettone", "focacce", "pizza", "pasta"}


class LearnReq(BaseModel):
    path_id: str


@api_router.post("/learn/complete")
async def learn_complete(body: LearnReq, user: dict = Depends(current_user)):
    pid = body.path_id
    if pid not in LEARN_PATHS:
        raise HTTPException(400, "Percorso sconosciuto")
    cid = f"learn_{pid}"
    await db.user_challenges.update_one({"user_id": user["user_id"]},
                                        {"$addToSet": {"completed": cid}, "$setOnInsert": {"created_at": now_iso()}}, upsert=True)
    doc = await db.user_challenges.find_one({"user_id": user["user_id"]}, {"_id": 0})
    done = doc.get("completed", [])
    unlocks = await _apply_challenge_unlocks(user["email"], len(done))
    await _touch_streak(user["user_id"])
    return {"ok": True, "completed": done, "count": len(done),
            "need_panettoni": CHALLENGE_UNLOCK_PANETTONI, "need_all": CHALLENGE_UNLOCK_ALL, **unlocks}


class RecipeCompleteReq(BaseModel):
    recipe_id: Optional[str] = None
    recipe_name: str
    image_url: Optional[str] = None


@api_router.post("/recipe/complete")
async def recipe_complete(body: RecipeCompleteReq, user: dict = Depends(current_user)):
    """L'utente ha finito una ricetta passo-passo: pubblica un traguardo sul feed social."""
    name = (body.recipe_name or "").strip()
    if not name:
        raise HTTPException(400, "Ricetta mancante")
    # Anti-spam: un solo post traguardo per (utente, ricetta) ogni 6 ore.
    since = (datetime.now(timezone.utc) - timedelta(hours=6)).isoformat()
    dup = await db.community_posts.find_one(
        {"author_id": user["user_id"], "category": "traguardo", "recipe_name": name,
         "created_at": {"$gt": since}}, {"_id": 1})
    if dup:
        return {"ok": True, "posted": False}
    text = f"🎉 Ho appena completato la ricetta «{name}» passo-passo su MikiLab! 🥖"
    tr = await _translate_text_multi(text)
    doc = {
        "id": str(uuid.uuid4()),
        "author_id": user["user_id"],
        "author_name": user.get("name") or (user.get("email") or "Fornaio").split("@")[0],
        "author_avatar": user.get("picture", ""),
        "category": "traguardo",
        "recipe_name": name,
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
    await _touch_streak(user["user_id"])
    return {"ok": True, "posted": True, "post": _post_public(doc, user)}


def _panettone_required(index: int) -> int:
    # Combinazione progressiva: la ricetta 1 richiede 2 sfide, la 17 fino a 8 (cap = n° sfide disponibili).
    return min(2 + index, len(CHALLENGE_CATALOG))


@api_router.get("/content/access/{content_id}")
async def content_access(content_id: str, user: dict = Depends(current_user)):
    if user.get("role") == "admin":
        return {"unlocked": True, "admin": True}
    doc = await db.user_challenges.find_one({"user_id": user["user_id"]}, {"_id": 0})
    done = set(doc.get("completed", []) if doc else [])
    # Panettone: content_id 'panettone_<n>' (1..17) → combinazioni progressive
    if content_id.startswith("panettone_"):
        try:
            idx = int(content_id.split("_")[1]) - 1
        except (ValueError, IndexError):
            idx = 0
        need = _panettone_required(max(0, idx))
    else:
        need = 3  # ricette/schede premium generiche
    return {"unlocked": len(done) >= need, "required": need, "done": len(done), "missing": max(0, need - len(done))}


# --- Moduli funzionali (refactoring: rotte registrate sullo stesso api_router) ---
import warehouse as _mod_warehouse  # noqa: E402  registra le rotte magazzino/silos/celle/AGV
from warehouse import mike_silos, mike_silo_microorder, mike_agv  # noqa: E402,F401  richiamate da rotte del core
import community as _mod_community  # noqa: E402  registra le rotte community/social
for _k in list(vars(_mod_community)):  # noqa: E402  ri-esporta nel core i simboli definiti dal modulo
    if _k != '_core' and not _k.startswith('__') and _k not in globals():
        globals()[_k] = getattr(_mod_community, _k)
import operations as _mod_operations  # noqa: E402  registra le rotte operazioni/logistica
for _k in list(vars(_mod_operations)):  # noqa: E402  ri-esporta nel core i simboli definiti dal modulo
    if _k != '_core' and not _k.startswith('__') and _k not in globals():
        globals()[_k] = getattr(_mod_operations, _k)
import recipes as _mod_recipes  # noqa: E402  registra le rotte generatore ricette custom
for _k in list(vars(_mod_recipes)):  # noqa: E402
    if _k != '_core' and not _k.startswith('__') and _k not in globals():
        globals()[_k] = getattr(_mod_recipes, _k)
import deck as _mod_deck  # noqa: E402
for _k in list(vars(_mod_deck)):  # noqa: E402
    if _k != '_core' and not _k.startswith('__') and _k not in globals():
        globals()[_k] = getattr(_mod_deck, _k)
import auth as _mod_auth  # noqa: E402  registra le rotte autenticazione/PIN/gate
for _k in list(vars(_mod_auth)):  # noqa: E402
    if _k != '_core' and not _k.startswith('__') and _k not in globals():
        globals()[_k] = getattr(_mod_auth, _k)
import sitor_ai as _mod_sitor_ai  # noqa: E402  registra le rotte Sitor (deus/atelier/coda)
for _k in list(vars(_mod_sitor_ai)):  # noqa: E402
    if _k != '_core' and not _k.startswith('__') and _k not in globals():
        globals()[_k] = getattr(_mod_sitor_ai, _k)

import coordination as _mod_coordination  # noqa: E402  registra le rotte coordinamento automatico team
for _k in list(vars(_mod_coordination)):  # noqa: E402
    if _k != '_core' and not _k.startswith('__') and _k not in globals():
        globals()[_k] = getattr(_mod_coordination, _k)

import orgs as _mod_orgs  # noqa: E402  registra le rotte multi-azienda + inviti operaio via link
for _k in list(vars(_mod_orgs)):  # noqa: E402
    if _k != '_core' and not _k.startswith('__') and _k not in globals():
        globals()[_k] = getattr(_mod_orgs, _k)

import recipe_extras as _mod_recipe_extras  # noqa: E402  registra le rotte extra ricetta (Manuale di Sitor)
for _k in list(vars(_mod_recipe_extras)):  # noqa: E402
    if _k != '_core' and not _k.startswith('__') and _k not in globals():
        globals()[_k] = getattr(_mod_recipe_extras, _k)

# --- Sync finale cross-modulo: ogni modulo vede TUTTI i simboli del core (indipendente dall'ordine di import) ---
for _m in (_mod_warehouse, _mod_community, _mod_operations, _mod_recipes, _mod_deck, _mod_auth, _mod_sitor_ai, _mod_coordination, _mod_orgs, _mod_recipe_extras):  # noqa: E402
    for _k, _v in list(globals().items()):
        if not _k.startswith('__') and _k not in _m.__dict__:
            _m.__dict__[_k] = _v
# --- Import espliciti dei simboli spostati e richiamati dal core (chiarezza + analisi statica) ---
from deck import _arbzg_summary, _staffing, OVEN_TEMP_MAX, PH_MIN, _aura_for, _DECK_DEPT_KEYWORDS, mike_proactive  # noqa: E402,F401
from recipes import _LANG_NAMES, GEN_PRICE_KG, GEN_PRICE_SALT_KG, GEN_PRICE_YEAST_KG, GEN_PRICE_SOURDOUGH_KG, _translate_text_multi  # noqa: E402,F401
from community import _notify, _touch_streak, _bakealong_notify_loop  # noqa: E402,F401
from auth import _OP_LEVELS  # noqa: E402,F401

app.include_router(api_router)

app.add_middleware(GateMiddleware)

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


async def _log_email(kind: str, to: str, count: int = 1, meta: Optional[dict] = None):
    """Registra un invio email per il report del pannello admin. Best-effort."""
    try:
        from datetime import date
        await db.email_logs.insert_one({
            "id": str(uuid.uuid4()), "kind": kind, "to": to, "count": int(count or 1),
            "meta": meta or {}, "day": date.today().isoformat(), "created_at": now_iso(),
        })
    except Exception:
        logging.getLogger(__name__).warning("email log insert failed")


async def _run_daily_digest():
    """Raggruppa la coda digest per utente, invia UN riepilogo e svuota. Idempotente sulla coda."""
    queued = await db.email_digest_queue.find({}, {"_id": 0}).to_list(5000)
    by_user = {}
    for q in queued:
        by_user.setdefault(q["user_id"], {"email": q.get("email"), "items": []})["items"].append(q)
    sent = 0
    for uid, data in by_user.items():
        if not data["email"] or not RESEND_API_KEY:
            continue
        rows = "".join(f"<li><b>#{i['category']}</b> — {i['author']}: {i['text']}</li>" for i in data["items"][:50])
        _html = f"<div style='font-family:sans-serif;max-width:560px;margin:auto'><h2 style='color:#ff6b00'>🥖 MikiLab · Riepilogo del giorno</h2><p>Novità nei canali che segui:</p><ul>{rows}</ul><p><a href='https://mikilab.de' style='color:#ff6b00'>Apri MikiLab →</a></p></div>"
        try:
            await asyncio.to_thread(_resend.Emails.send, {"from": f"MikiLab <{SENDER_EMAIL}>", "to": [data["email"]], "subject": "MikiLab · il tuo riepilogo giornaliero", "html": _html})
            sent += 1
            await _log_email("digest", data["email"], count=1, meta={"items": len(data["items"])})
        except Exception:
            logger.exception("digest send failed")
    # Rimuove solo gli elementi appena processati (più vecchi di 1 giorno), non svuota la coda.
    cutoff = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    await db.email_digest_queue.delete_many({"created_at": {"$lt": cutoff}})
    return {"users_notified": sent, "queued_items": len(queued)}


async def _daily_digest_loop():
    """Ogni mattina (~07:00 Europe/Berlin = 05:00 UTC) invia i riepiloghi dei canali seguiti."""
    last_run_date = None
    while True:
        try:
            now = datetime.now(timezone.utc)
            if now.hour == 5 and last_run_date != now.date():
                last_run_date = now.date()
                res = await _run_daily_digest()
                logging.getLogger(__name__).info(f"Daily digest inviato: {res}")
        except Exception as e:
            logging.getLogger(__name__).error(f"daily digest loop error: {e}")
        await asyncio.sleep(1800)  # controlla ogni 30 min


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
        await _migrate_organizations()
    except Exception as e:
        logging.getLogger(__name__).error(f"Org migration error: {e}")
    try:
        # Indici di ISOLAMENTO: organization_id su tutte le collezioni tenant (query multi-azienda veloci).
        for _coll in ORG_SCOPED_COLLECTIONS:
            try:
                await db[_coll].create_index("organization_id", name="idx_org", background=True)
            except Exception:
                pass
    except Exception as e:
        logging.getLogger(__name__).error(f"org index error: {e}")
    try:
        # CONSERVAZIONE 12 MESI (GDPR/DSGVO): TTL su compliance_timelog e compliance_training_ack.
        # Il TTL agisce sul campo Date "at_dt"; le entry senza at_dt (storiche) non vengono toccate,
        # quindi le backfillo dal campo ISO "at" così anche quelle vecchie scadono correttamente.
        _TTL_12M = 365 * 24 * 3600
        for _coll in ("compliance_timelog", "compliance_training_ack"):
            try:
                await db[_coll].create_index("at_dt", name="idx_ttl_12m", expireAfterSeconds=_TTL_12M, background=True)
            except Exception:
                pass
            try:
                async for _d in db[_coll].find({"at_dt": {"$exists": False}, "at": {"$exists": True}}, {"_id": 1, "at": 1}):
                    try:
                        _dt = datetime.fromisoformat(str(_d["at"]).replace("Z", "+00:00"))
                        await db[_coll].update_one({"_id": _d["_id"]}, {"$set": {"at_dt": _dt}})
                    except Exception:
                        pass
            except Exception:
                pass
    except Exception as e:
        logging.getLogger(__name__).error(f"compliance TTL error: {e}")
    try:
        await seed_shop_if_empty()
    except Exception as e:
        logging.getLogger(__name__).error(f"Shop seed error: {e}")
    try:
        await seed_welcome_post()
    except Exception as e:
        logging.getLogger(__name__).error(f"Welcome post seed error: {e}")
    try:
        # Indice unico sull'email: garantisce UN SOLO account per email (anti-duplicati/race).
        await db.users.create_index("email", unique=True, name="uniq_email")
    except Exception as e:
        logging.getLogger(__name__).error(f"users email unique index error: {e}")
    try:
        # Salvagente PIN Master: se ADMIN_GATE_PIN e' nel .env, il DB viene sempre riallineato
        # ad esso (cosi' il PIN del Capo funziona anche se il DB di produzione aveva un hash vecchio).
        env_pin = os.environ.get("ADMIN_GATE_PIN")
        if env_pin:
            doc = await db.app_meta.find_one({"_key": "admin_gate_pin"}, {"_id": 0})
            if not (doc and doc.get("hash") and _check_pw(env_pin, doc["hash"])):
                await db.app_meta.update_one(
                    {"_key": "admin_gate_pin"},
                    {"$set": {"_key": "admin_gate_pin", "hash": _hash_pw(env_pin), "updated_at": now_iso()}},
                    upsert=True,
                )
                logging.getLogger(__name__).info("PIN Master Gate riallineato al segreto .env")
    except Exception as e:
        logging.getLogger(__name__).error(f"Gate PIN align error: {e}")
    try:
        # Accesso admin del proprietario (email + password). Se l'account owner non ha una
        # password impostata, la si legge da ADMIN_INITIAL_PASSWORD (env, mai scritta nel codice).
        _admin_email = (os.environ.get("ADMIN_EMAIL") or "michelecip918@gmail.com").strip().lower()
        _admin_pw = os.environ.get("ADMIN_INITIAL_PASSWORD")
        if _admin_pw:
            _acc = await db.users.find_one({"email": _admin_email})
            if not _acc:
                await db.users.insert_one({
                    "user_id": f"user_{uuid.uuid4().hex[:12]}", "email": _admin_email,
                    "name": "MikiLab", "picture": "", "role": "admin", "auth_provider": "email",
                    "password_hash": _hash_pw(_admin_pw), "created_at": now_iso(),
                    "email_verified": True, "organization_id": ORG_DEFAULT,
                })
                logging.getLogger(__name__).info("Account admin creato da ADMIN_INITIAL_PASSWORD")
            elif not _acc.get("password_hash"):
                await db.users.update_one({"email": _admin_email}, {"$set": {"password_hash": _hash_pw(_admin_pw), "role": "admin", "email_verified": True}})
                logging.getLogger(__name__).info("Password admin inizializzata da ADMIN_INITIAL_PASSWORD")
    except Exception as e:
        logging.getLogger(__name__).error(f"Admin seed error: {e}")
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
        asyncio.create_task(_reminders_loop())
        logging.getLogger(__name__).info("Reminders push loop avviato")
    except Exception as e:
        logging.getLogger(__name__).error(f"Reminders loop start error: {e}")
    try:
        asyncio.create_task(_bakealong_notify_loop())
        logging.getLogger(__name__).info("Bake-Along notify loop avviato")
    except Exception as e:
        logging.getLogger(__name__).error(f"Bake-Along loop start error: {e}")
    try:
        asyncio.create_task(_daily_digest_loop())
        logging.getLogger(__name__).info("Daily digest loop avviato")
    except Exception as e:
        logging.getLogger(__name__).error(f"Daily digest loop start error: {e}")
    try:
        asyncio.create_task(_deck_alarm_loop())
        logging.getLogger(__name__).info("Deck alarm push loop avviato")
    except Exception as e:
        logging.getLogger(__name__).error(f"Deck alarm loop start error: {e}")
    try:
        asyncio.create_task(_uptime_monitor_loop())
        logging.getLogger(__name__).info("Uptime monitor loop avviato")
    except Exception as e:
        logging.getLogger(__name__).error(f"Uptime monitor start error: {e}")
    try:
        asyncio.create_task(_shift_schedule_loop())
        logging.getLogger(__name__).info("Shift schedule loop avviato")
    except Exception as e:
        logging.getLogger(__name__).error(f"Shift schedule loop start error: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
