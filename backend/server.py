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
    extra_ingredients: Optional[List[dict]] = None
    work_phases: Optional[List[dict]] = None
    costing: Optional[dict] = None
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
    extra_ingredients: Optional[List[dict]] = None
    work_phases: Optional[List[dict]] = None
    costing: Optional[dict] = None


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
    extra_ingredients: Optional[List[dict]] = None
    work_phases: Optional[List[dict]] = None
    costing: Optional[dict] = None


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
    region: Optional[str] = "stoccarda"
    created_at: str = Field(default_factory=now_iso)


class AnnouncementCreate(BaseModel):
    title: str
    details: Optional[str] = ""
    region: Optional[str] = "stoccarda"


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


class WeeklyPlan(BaseModel):
    items: List[WeeklyItem] = []
    updated_at: str = Field(default_factory=now_iso)


# ---------------------------------------------------------------------------
# Seed data for Mikilab (insert-only, non destructive)
# ---------------------------------------------------------------------------
SEED_FILE = ROOT_DIR / "mikilab_seed_data.json"
SEED_VERSION = "2026-06-v21-canapa-panettone"  # bump quando cambia mikilab_seed_data.json
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
    return await db.recipes.count_documents({"collection_name": "mikilab"})


# ---------------------------------------------------------------------------
# Recipe endpoints
# ---------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"message": "Mikilab API attiva"}


EMERGENT_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
SESSION_DAYS = 7


class RegisterReq(BaseModel):
    email: str
    password: str
    name: Optional[str] = ""


class LoginReq(BaseModel):
    email: str
    password: str


class GoogleReq(BaseModel):
    session_id: str


def _hash_pw(pw):
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def _check_pw(pw, h):
    try:
        return bcrypt.checkpw(pw.encode(), h.encode())
    except Exception:
        return False


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
    resp.set_cookie("session_token", token, httponly=True, secure=True, samesite="none", path="/", max_age=SESSION_DAYS * 86400)


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


def _teaser_recipe(doc: dict) -> dict:
    """Versione 'assaggio': mostra nome/foto/ingredienti base, blocca metodo ed extra."""
    d = dict(doc)
    d["procedure"] = ""
    d["procedure_de"] = ""
    d["notes"] = ""
    d["notes_de"] = ""
    d["work_phases"] = []
    d["extra_ingredients"] = []
    d["costing"] = None
    d["locked"] = True
    return d


async def _translate_recipe_de(doc):
    """Traduce in tedesco i campi principali della ricetta (best-effort)."""
    try:
        fields = {k: doc.get(k) for k in ["name", "flour_type", "notes", "procedure"] if doc.get(k)}
        if not fields:
            return {}
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY, session_id=f"trrec-{doc.get('id', 'x')}",
            system_message=("Traduttore IT->DE per panificazione artigianale. Mantieni invariati i termini tecnici: "
                            "Lievito Madre, Poolish, Biga, Sauerteig, Panettone, Backmittel, Kochstück, Quellstück. "
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


@api_router.post("/auth/register")
async def auth_register(payload: RegisterReq, response: Response):
    email = payload.email.strip().lower()
    if not email or not payload.password:
        raise HTTPException(status_code=400, detail="Email e password richieste")
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email già registrata")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    await db.users.insert_one({
        "user_id": user_id, "email": email, "name": payload.name or email.split("@")[0],
        "picture": "", "role": await _role_for_new_user(), "auth_provider": "email",
        "password_hash": _hash_pw(payload.password), "created_at": now_iso(),
    })
    token = await _make_session(user_id)
    _set_cookie(response, token)
    u = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"user": _public_user(u), "session_token": token}


@api_router.post("/auth/login")
async def auth_login(payload: LoginReq, response: Response):
    email = payload.email.strip().lower()
    u = await db.users.find_one({"email": email}, {"_id": 0})
    if not u or not u.get("password_hash") or not _check_pw(payload.password, u["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenziali non valide")
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
        docs = await db.recipes.find({"collection_name": "mikilab"}, {"_id": 0}).sort("name", 1).to_list(1000)
        # Modalità "assaggio": i non-PRO vedono nome/foto/ingredienti base, il metodo è bloccato.
        if not await user_is_pro(user):
            docs = [_teaser_recipe(d) for d in docs]
        return docs
    if not user:
        raise HTTPException(status_code=401, detail="Accesso richiesto per le ricette personali")
    docs = await db.recipes.find({"collection_name": collection_name, "owner_id": user["user_id"]}, {"_id": 0}).sort("name", 1).to_list(1000)
    return docs


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
async def upload_image(file: UploadFile = File(...)):
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
    # Ritraduci in tedesco i campi modificati.
    if any(updates.get(k) for k in ("name", "flour_type", "notes", "procedure")):
        base = {**existing, **updates}
        tr = await _translate_recipe_de(base)
        for k in ("name_de", "flour_type_de", "notes_de", "procedure_de"):
            if tr.get(k):
                updates[k] = tr[k]
    await db.recipes.update_one({"id": recipe_id}, {"$set": updates})
    merged = {**existing, **updates}
    return merged


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
# Production plan (single persisted plan)
# ---------------------------------------------------------------------------
@api_router.get("/production-plan")
async def get_production_plan():
    doc = await db.production_plan.find_one({"_key": "default"}, {"_id": 0, "_key": 0})
    return doc  # may be null if never saved


@api_router.put("/production-plan", response_model=ProductionPlan)
async def save_production_plan(payload: ProductionPlan):
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
async def save_weekly_plan(payload: WeeklyPlan):
    payload.updated_at = now_iso()
    doc = payload.model_dump()
    await db.weekly_plan.update_one(
        {"_key": "default"}, {"$set": {**doc, "_key": "default"}}, upsert=True
    )
    return payload


# ---------------------------------------------------------------------------
# Capo Laboratorio — configurazione attrezzature/celle (single persisted doc)
# ---------------------------------------------------------------------------
@api_router.get("/lab-config")
async def get_lab_config():
    doc = await db.lab_config.find_one({"_key": "default"}, {"_id": 0, "_key": 0})
    return doc  # null if never saved


@api_router.put("/lab-config", response_model=LabConfig)
async def save_lab_config(payload: LabConfig):
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
async def save_recipe_temp(payload: RecipeTemp):
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
        "title": "Mulini di qualità nell'area di Stoccarda",
        "details": "Cerca farina biologica macinata a pietra nei mulini regionali (Schwabenmühle e mercati Bio locali). Chiedi la 'Type' per scegliere la forza giusta.",
    },
    {
        "title": "Scambio lievito madre — zona Cannstatt & Mitte",
        "details": "Incontri informali tra appassionati italiani e tedeschi: scambio di pasta madre, grani antichi e consigli di cottura nella zona di Stoccarda.",
    },
]


async def seed_announcements_if_empty():
    if await db.announcements.count_documents({}) == 0:
        for item in ANNOUNCEMENT_SEED:
            ann = Announcement(**item)
            await db.announcements.insert_one(ann.model_dump())


@api_router.get("/announcements", response_model=List[Announcement])
async def get_announcements():
    await seed_announcements_if_empty()
    docs = await db.announcements.find({}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return docs


@api_router.post("/announcements", response_model=Announcement)
async def create_announcement(payload: AnnouncementCreate):
    if not payload.title.strip():
        raise HTTPException(status_code=422, detail="Il titolo è obbligatorio")
    data = payload.model_dump()
    data["title"] = data["title"].strip()
    ann = Announcement(**data)
    await db.announcements.insert_one(ann.model_dump())
    return ann


@api_router.put("/announcements/{ann_id}", response_model=Announcement)
async def update_announcement(ann_id: str, payload: AnnouncementCreate):
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
async def delete_announcement(ann_id: str):
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
    "delle farine e delle abitudini tedesche (zona Stoccarda, Baden-Württemberg). "
    "Rispondi in modo caldo, chiaro e pratico, come un maestro che "
    "insegna a un allievo. Dai consigli concreti su idratazione, lievito madre, farine "
    "(inclusa la corrispondenza tra tipi italiani 00/0/1/2 e tedeschi Type 405/550/812/1050, "
    "e Dinkelmehl per il farro), temperature, tempi, cottura e vapore. "
    "Quando utile, cita fonti locali di Stoccarda (mulini, mercati bio, grani antichi). "
    "Il motto della sezione è: 'Chiedi e ti sarà dato'. Sii incoraggiante e mai prolisso. "
    "Quando l'utente chiede di 'imparare un metodo' o 'insegnami un metodo', rispondi SEMPRE "
    "con un metodo logico passo-passo NUMERATO e ordinato: 1) scelta di farina e prefermento "
    "(poolish, lievito madre/Sauerteig, biga), 2) impasto (tempi e temperatura acqua/impasto), "
    "3) riposi con durate e temperature, 4) formatura, 5) appretto, 6) cottura con forno "
    "(statico/ventilato/rotor), gradi, minuti e vapore. Chiaro e facile da seguire in laboratorio."
)

LANG_DIRECTIVE = {
    "it": " Rispondi SEMPRE in italiano.",
    "de": " Antworte IMMER auf Deutsch (respond always in German).",
}


async def maestro_stream(session_id: str, message: str, lang: str = "it"):
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=MAESTRO_SYSTEM + LANG_DIRECTIVE.get(lang, LANG_DIRECTIVE["it"]),
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
        maestro_stream(payload.session_id, payload.message, payload.lang),
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
    products_txt, has_days = await _capo_build_products_block(items, payload.lang)
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

    prompt += lang_instr
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"capo-{uuid.uuid4()}",
        system_message=system + _capo_lang(payload.lang),
    ).with_model("anthropic", "claude-sonnet-4-6").with_params(max_tokens=max_tokens)

    try:
        async for event in chat.stream_message(UserMessage(text=prompt)):
            if isinstance(event, TextDelta):
                yield f"data: {json.dumps({'d': event.content})}\n\n"
            elif isinstance(event, StreamDone):
                break
    except Exception:
        logger.exception("capo plan stream error")
        yield f"data: {json.dumps({'d': '[Errore nella generazione del piano. Riprova.]'})}\n\n"
    yield f"data: {json.dumps({'done': True})}\n\n"


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
async def maestro_vision(payload: VisionRequest, user: dict = Depends(require_pro)):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key non configurata")
    return StreamingResponse(
        vision_stream(payload.mode, payload.image_base64, payload.lang),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


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
    items += _fetch_rss("Bäckerei OR Brot Stuttgart", "de", "DE", "DE:de", "stoccarda", 4)
    items += _fetch_rss("Handwerksbäckerei OR Sauerteig Deutschland", "de", "DE", "DE:de", "germania", 3)
    items += _fetch_rss("panificazione OR pane artigianale OR lievito madre", "it", "IT", "IT:it", "italia", 3)
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


class CheckoutReq(BaseModel):
    plan: str = "monthly"        # monthly | yearly
    origin_url: str
    coupon: Optional[str] = None


@api_router.post("/subscription/checkout")
async def create_checkout(body: CheckoutReq, user: dict = Depends(current_user)):
    email = user["email"]
    lookup = PRICE_LOOKUP.get(body.plan, "pro_monthly")
    prices = _stripe.Price.list(lookup_keys=[lookup], active=True, limit=1).data
    if not prices:
        raise HTTPException(400, "Prezzo non configurato")
    # Cliente per email (riuso se esiste)
    existing = _stripe.Customer.list(email=email, limit=1).data
    customer = existing[0] if existing else _stripe.Customer.create(email=email)
    session = _stripe.checkout.Session.create(
        mode="subscription",
        customer=customer.id,
        line_items=[{"price": prices[0].id, "quantity": 1}],
        allow_promotion_codes=True,
        success_url=body.origin_url.rstrip("/") + "/?sub=success&session_id={CHECKOUT_SESSION_ID}",
        cancel_url=body.origin_url.rstrip("/") + "/?sub=cancel",
        metadata={"email": email, "plan": body.plan},
    )
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()), "session_id": session.id, "email": email,
        "plan": body.plan, "amount": prices[0].unit_amount, "currency": prices[0].currency,
        "payment_status": "initiated", "created_at": now_iso(),
    })
    return {"url": session.url, "session_id": session.id}


async def _grant_from_email(email, source="stripe", days=None):
    email = (email or "").strip().lower()
    exp = None
    if days:
        exp = (datetime.now(timezone.utc) + timedelta(days=int(days))).isoformat()
    await db.entitlements.update_one({"email": email},
        {"$set": {"email": email, "pro": True, "source": source, "expires_at": exp, "updated_at": now_iso()}},
        upsert=True)


@api_router.get("/subscription/status")
async def subscription_status(user: Optional[dict] = Depends(optional_user)):
    if not user:
        return {"pro": False, "source": None, "expires_at": None, "trial_used": False, "is_admin": False}
    email = user["email"].strip().lower()
    ent = await db.entitlements.find_one({"email": email}, {"_id": 0})
    is_admin = user.get("role") == "admin"
    pro = is_admin
    if ent and ent.get("pro"):
        exp = ent.get("expires_at")
        pro = True if not exp else exp > now_iso()
    return {"pro": pro, "source": "admin" if (is_admin and not (ent or {}).get("source")) else (ent or {}).get("source"),
            "expires_at": (ent or {}).get("expires_at"),
            "trial_used": bool((ent or {}).get("trial_used")),
            "is_admin": is_admin}


class TrialReq(BaseModel):
    hours: int = 24          # 1 oppure 24


@api_router.post("/trial/activate")
async def activate_trial(body: TrialReq, user: dict = Depends(current_user)):
    email = user["email"].strip().lower()
    ent = await db.entitlements.find_one({"email": email})
    if ent and ent.get("trial_used"):
        raise HTTPException(400, "Prova già utilizzata")
    hours = 1 if int(body.hours) == 1 else 24
    exp = (datetime.now(timezone.utc) + timedelta(hours=hours)).isoformat()
    await db.entitlements.update_one({"email": email},
        {"$set": {"email": email, "pro": True, "source": "trial",
                  "expires_at": exp, "trial_used": True, "updated_at": now_iso()}}, upsert=True)
    return {"pro": True, "source": "trial", "expires_at": exp}


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
        email = (obj.get("metadata") or {}).get("email") or obj.get("customer_email")
        await db.payment_transactions.update_one({"session_id": obj.get("id")},
            {"$set": {"payment_status": "paid", "paid_at": now_iso()}})
        if email:
            await _grant_from_email(email, "stripe")
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
# Admin: coupon / inviti VIP (accesso PRO gratuito, illimitato o a tempo)
# ---------------------------------------------------------------------------
class GrantReq(BaseModel):
    email: str
    days: Optional[int] = None   # None = illimitato


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
    await _grant_from_email(email, source="vip", days=body.days)
    ent = await db.entitlements.find_one({"email": email}, {"_id": 0})
    return {"ok": True, "email": email, "expires_at": (ent or {}).get("expires_at")}


@api_router.post("/admin/revoke")
async def admin_revoke(body: GrantReq, admin: dict = Depends(require_admin)):
    email = (body.email or "").strip().lower()
    await db.entitlements.update_one({"email": email},
        {"$set": {"pro": False, "updated_at": now_iso()}})
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
async def forgot_password(body: ForgotReq):
    email = (body.email or "").strip().lower()
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
    if not body.password or len(body.password) < 6:
        raise HTTPException(400, "La password deve avere almeno 6 caratteri")
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


@app.get("/api/seed-mikilab")
async def seed_mikilab_endpoint():
    n = await seed_mikilab_if_empty(force=True)
    return {"status": "synced", "count": n}


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
        init_storage()
        logging.getLogger(__name__).info("Archivio immagini inizializzato")
    except Exception as e:
        logging.getLogger(__name__).error(f"Storage init error: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
