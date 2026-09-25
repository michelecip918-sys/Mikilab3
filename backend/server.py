# MikiLab — Il Manuale di Sitor (backend). (c) 2026 Michele Signorella.
# Ricettario pubblico e gratuito. Accesso anonimo solo tramite allowlist (GateMiddleware, DEFAULT DENY).
from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Depends, Request
from fastapi.responses import Response, JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import jwt as _jwt
from motor.motor_asyncio import AsyncIOMotorClient
import os
import time
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
# Il cervello di Sitor — il Dio dell'Arte Bianca — gira sul modello più potente disponibile.
# Riservato ai compiti ad alto valore: consigli dalla memoria personale, generazione corsi
# ricetta, decisioni di coordinamento complesse.
SITOR_BRAIN = "claude-opus-4-8"
# Modello ECONOMICO per estrazioni/classificazioni semplici e dialogo vocale ultra-breve
# (leggere una comanda, interpretare un comando vocale corto, estrarre righe da un'etichetta).
# Stesso identità e lingua di Sitor, costo molto inferiore.
SITOR_FAST = "claude-haiku-4-5-20251001"


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


# M5 — intestazioni di sicurezza su ogni risposta API. Nessuna CSP restrittiva.
@app.middleware("http")
async def security_headers(request: Request, call_next):
    resp = await call_next(request)
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["Permissions-Policy"] = "microphone=(self), camera=(self)"
    return resp


# ---------------------------------------------------------------------------
# CANCELLO SERVER "HARD": token firmato (JWT HS256) rilasciato SOLO dopo il PIN
# Master corretto. Senza questo cookie firmato ogni /api (tranne whitelist) è 401,
# anche da browser modificato: MikiLab resta invisibile a chi non ha il PIN iniziale.
# Il Production PIN (operatori) NON è in whitelist → passa comunque dal cancello Master.
# ---------------------------------------------------------------------------
GATE_SECRET = os.environ.get("GATE_JWT_SECRET") or os.environ.get("INBOUND_SHARED_SECRET")
if not GATE_SECRET:
    raise RuntimeError("GATE_JWT_SECRET (o INBOUND_SHARED_SECRET) non impostato: imposta il segreto del gate nelle variabili d'ambiente.")
GATE_COOKIE = "mikilab_gate"


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


_PUBLIC_GET_ALLOW = (
    "/api/recipes", "/api/recipe-extras", "/api/techniques", "/api/equipment-guide",
    "/api/site-settings", "/api/auth/me", "/api/health", "/api/sitemap",
    "/api/learning-path", "/api/site-pages",
    "/api/time", "/api/live", "/api/features",
    "/api/experiments", "/api/flour-types", "/api/bread-calendar", "/api/palato-tips",
)


async def _session_is_admin(request) -> bool:
    """True solo se la richiesta ha una sessione valida di un utente con role == 'admin'.
    Gli account legacy (operai/utenti del periodo aziendale) NON sono admin: negati."""
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        return False
    try:
        sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0, "user_id": 1, "expires_at": 1})
        if not sess:
            return False
        exp = sess["expires_at"]
        if isinstance(exp, str):
            exp = datetime.fromisoformat(exp)
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < datetime.now(timezone.utc):
            return False
        u = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0, "role": 1, "email": 1})
        if not u:
            return False
        if u.get("role") == "admin":
            return True
        return (u.get("email") or "").strip().lower() in OWNER_EMAILS
    except Exception:
        return False


# Scritture consentite agli ANONIMI (tutto il resto: solo admin, altrimenti 404).
_PUBLIC_WRITE_ALLOW = (
    "/api/sitor/chat", "/api/sitor/plan", "/api/sitor/photo",
    "/api/live/ping", "/api/done-ping",
    "/api/experiments/vote",
    "/api/auth/login", "/api/auth/logout",
    "/api/auth/forgot-password", "/api/auth/reset-password",
)


class GateMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Manuale pubblico di Sitor — DEFAULT DENY totale (letture E scritture):
        # un anonimo può leggere SOLO l'allowlist pubblica (_PUBLIC_GET_ALLOW) e
        # scrivere SOLO l'allowlist pubblica (_PUBLIC_WRITE_ALLOW, es. /sitor/chat, login).
        # Ogni altra rotta (dati aziendali, IA/voce, scritture legacy...) richiede una
        # sessione con role == 'admin'; senza, rispondiamo 404 PRIMA di validare il corpo.
        path = request.url.path
        method = request.method
        if method == "OPTIONS" or not path.startswith("/api"):
            return await call_next(request)

        def _match(allow):
            return any(path == p or path.startswith(p + "/") or path.startswith(p + "?") for p in allow)

        if method in ("POST", "PUT", "PATCH", "DELETE"):
            if _match(_PUBLIC_WRITE_ALLOW):
                return await call_next(request)
        else:  # GET / HEAD
            if _match(_PUBLIC_GET_ALLOW):
                return await call_next(request)
        if await _session_is_admin(request):
            return await call_next(request)
        return JSONResponse({"detail": "not_found"}, status_code=404)


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


# ---------------------------------------------------------------------------
# Seed data for Mikilab (insert-only, non destructive)
# ---------------------------------------------------------------------------
SEED_FILE = ROOT_DIR / "mikilab_seed_data.json"
SEED_VERSION = "2026-09-v81-canapa-6040"  # bump quando cambia mikilab_seed_data.json
# Ricette riscritte/completate da Sitor (IA): restano "bozza" finché Michele non le prova.
V73_DRAFT_NAMES = ["Brioche Francese (col burro)", "Pain au Chocolat (Saccottino al Cioccolato)", "Saccottino alla Crema", "Danese alla Crema (Plunder)", "Girella all'Uvetta (Pain aux Raisins)", "Pan di Kristall (alta idratazione 95%)", "Pane da Hamburger (bun soffice)", "Veneziana (grande lievitato dolce)", "Pizza Napoletana (tonda)", "Pizza in Teglia alla Romana", "Pizza alla Pala", "Pizza al Taglio Contemporanea", "Pan di Spagna", "Crostata di Frutta (Pasta Frolla)", "Bignè (Pasta Choux)", "Crema Pasticcera", "Panzerotti Fritti Pugliesi", "Focaccia Barese", "Focaccia Dolce all'Uva (Schiacciata)", "Focaccia Genovese", "Focaccia Integrale ai Semi", "Focaccia ai Cereali e Miele", "Focaccia alla Cipolla di Tropea", "Focaccia alle Olive e Rosmarino", "Focaccia con Patate e Rosmarino", "Focaccia con Pomodorini Secchi e Origano", "Focaccia di Altamura", "Focaccia di Matera", "Focaccia Zucca e Rosmarino", "Focaccia Patate e Rosmarino", "Focaccia Cipolla di Tropea", "Focaccia Zucchine e Stracchino", "Focaccia Melanzane e Pomodorini", "Focaccia Peperoni Arrostiti", "Focaccia Pesto e Pomodorini", "Focaccia Gorgonzola e Noci", "Focaccia Mortadella e Pistacchio", "Focaccia Prosciutto Crudo e Stracchino", "Focaccia Friarielli", "Focaccia Funghi Porcini", "Focaccia Acciughe e Capperi", "Focaccia Fichi e Miele", "Focaccia Uvetta e Noci", "Focaccia Multi-Semi", "Focaccia alla Curcuma", "Focaccia Olive Verdi e Origano", "Focaccia Pere e Gorgonzola", "Focaccia Cipollotto e Speck", "Focaccia a Lievito Madre", "Pane agli Spinaci", "Pane alla Spirulina", "Panini Basilico e Pomodoro", "Pane Nero al Carbone Vegetale", "Pane alla Barbabietola", "Pane all'Nduja", "Pane alla Curcuma e Zenzero", "Pane allo Zafferano", "Cornetto Bicolore Cacao e Vaniglia", "Cornetto Bicolore Carbone e Vaniglia", "Cornetto Bicolore Rosa (Rapa Rossa) e Vaniglia", "Cornetto Doppio Gusto Pistacchio e Cioccolato"]
# Panettoni: cambia solo il procedimento (dosi e stato invariati); si azzerano solo i vecchi corsi in cache.
V73_PROC_NAMES = ["Panettone Artigianale MikiLab — Albicocca e Cioccolato", "Panettone Artigianale MikiLab — Amarena e Cioccolato", "Panettone Artigianale MikiLab — Arancia e Cioccolato Fondente", "Panettone Artigianale MikiLab — Caffè e Nocciola", "Panettone Artigianale MikiLab — Cioccolato e Noci", "Panettone Artigianale MikiLab — Cocco e Cioccolato", "Panettone Artigianale MikiLab — Fichi e Mandorle", "Panettone Artigianale MikiLab — Frutti di Bosco", "Panettone Artigianale MikiLab — Limoncello", "Panettone Artigianale MikiLab — Marron Glacé (Castagne)", "Panettone Artigianale MikiLab — Mela e Cannella", "Panettone Artigianale MikiLab — Pere e Cioccolato", "Panettone Artigianale MikiLab — Pistacchio e Cioccolato Bianco", "Panettone Artigianale MikiLab — Tiramisù", "Panettone Artigianale MikiLab — Uvetta e Canditi (Classico)", "Panettone Artigianale MikiLab — Zafferano"]

# V78 — ricette delle "Ricette Custodite" portate nel ricettario: restano "Bozza" finché Michele non le prova.
V78_DRAFT_NAMES = ["Pane Lucano di Grano Duro", "Pane di Patate Lucano", "Pane Cafone Lucano", "Focaccia Lucana ai Peperoni Cruschi", "Pane Arcobaleno Naturale", "Baguette Colorata (Innovazione)", "Pane alla Zucca", "Roggenbrot (Pane di Segale)", "Vollkornbrot (Pane Integrale ai Semi)", "Laugenbrötchen (Panini di Laugen)", "Kaisersemmel (Panino Kaiser)", "Panettone al Cioccolato", "Panettone Colorato (Innovazione)"]

# V79 — procedimenti riscritti per esteso: i vecchi corsi salvati di queste ricette si rigenerano (una volta sola).
V79_PROC_NAMES = ["Pane Lucano di Grano Duro", "Pane di Patate Lucano", "Pane Cafone Lucano", "Focaccia Lucana ai Peperoni Cruschi", "Pane Arcobaleno Naturale", "Baguette Colorata (Innovazione)", "Pane alla Zucca", "Roggenbrot (Pane di Segale)", "Vollkornbrot (Pane Integrale ai Semi)", "Laugenbrötchen (Panini di Laugen)", "Kaisersemmel (Panino Kaiser)", "Panettone al Cioccolato", "Panettone Colorato (Innovazione)"]

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
    "Focaccia Patate e Rosmarino", "Focaccia Cipolla di Tropea",  # V125 doppioni
]


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


SESSION_DAYS = 3650  # sessione permanente (~10 anni): chi si registra resta dentro, gratis, senza riloggarsi
# Email PROPRIETARIO: sempre admin (accesso completo a tutto), a prescindere dall'ordine di registrazione.
OWNER_EMAILS = {"michelecip918@gmail.com"}
LEGACY_ADMIN_EMAIL = "admin@mikilab.de"


class LoginReq(BaseModel):
    email: str
    password: str


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


def _org_id(user: Optional[dict]) -> str:
    """organization_id dell'utente richiedente (default: org_default)."""
    return (user or {}).get("organization_id") or ORG_DEFAULT


async def effective_org(request: Request, user: Optional[dict] = Depends(optional_user)) -> str:
    """Azienda effettiva della richiesta: dalla sessione se loggato (Capo), altrimenti
    dal cookie del cancello (PIN operatore/produzione legato all'azienda)."""
    if user:
        return _org_id(user)
    return gate_org(request)


# ---------------------------------------------------------------------------
# Entitlement / PRO helpers (blindatura server-side)
# ---------------------------------------------------------------------------


async def require_admin(user: dict = Depends(current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accesso riservato all'amministratore")
    return user


# ============================================================================
# PIZZERIA — pannello dedicato "Servizio & Panetti".
# La pizzeria lavora a FLUSSO/SERVIZIO (non a lotti): sessioni di servizio con
# panetti porzionati, maturazione in frigo e sfornate a ritmo di sala.
# ============================================================================


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


# --- Accesso Academy ("Impara da Casa") + acquisto singolo ricette -----------


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


def _is_panettone_recipe(doc: dict) -> bool:
    if (doc.get("menu_category") or "") == "panettoni":
        return True
    return bool(re.search(r"panettone", (doc.get("name") or ""), re.I))


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


# ---------------------------------------------------------------------------
# MIKI-NEXUS · RICETTARIO VIVENTE & GENERATORE DINAMICO (Fase 9) — funzione suprema.
# Il Capo detta un OBIETTIVO; Sitor calcola la matrice vivente e la curva di maturazione.
# Funzione riservata: require_admin (barriera anti-ospite, Fase 4).
# ---------------------------------------------------------------------------


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
        # Manuale pubblico e GRATUITO: nessun blocco "assaggio"/PRO, ogni ricetta è completa.
        if False:  # (teaser/paywall disattivato)
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
        # Nascondi al pubblico solo le ricette con recipe_extras.hidden_public=true (l'admin le vede).
        if not (user and user.get("role") == "admin"):
            hidden = {x["recipe_id"] async for x in db.recipe_extras.find({"hidden_public": True}, {"_id": 0, "recipe_id": 1})}
            if hidden:
                docs = [d for d in docs if d.get("id") not in hidden]
        return docs
    if not user:
        raise HTTPException(status_code=401, detail="Accesso richiesto per le ricette personali")
    docs = await db.recipes.find({"collection_name": collection_name, "owner_id": user["user_id"]}, {"_id": 0}).sort("name", 1).to_list(1000)
    return docs


# ---------------------------------------------------------------------------
# MACCHINA DEL TEMPO CLIMA — incrocia pressione barometrica + umidità (Open-Meteo,
# Stoccarda) e propone micro-correzioni stagionali alla ricetta via Claude.
# ---------------------------------------------------------------------------
_CLIMATE_LAT, _CLIMATE_LON = 48.7758, 9.1829  # Stoccarda (Stuttgart)


# ---------------------------------------------------------------------------
# Vision: trova difetti / trova ingredienti (photo analysis, streaming)
# ---------------------------------------------------------------------------


_ELEVEN_KEY = os.environ.get("ELEVENLABS_API_KEY") or os.environ.get("ELEVEN_API_KEY")
_eleven_client = ElevenLabs(api_key=_ELEVEN_KEY) if _ELEVEN_KEY else None
# Momi (tutor) — voce dedicata; Michele/Lab (fondatore) — voce maschile italiana profonda
MICHELE_VOICE_ID = os.environ.get("MICHELE_VOICE_ID", "pNInz6obpgDQGcFmaJgB")
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
    translate: bool = False  # V93: traduzione prima della voce solo su richiesta


# ---- OpenAI TTS (voce MASCHILE: onyx/echo) — chiave OpenAI personalizzata o Universal Key ----
import hashlib as _hashlib
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
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"tts-tr-{ck[:8]}", system_message=sysmsg).with_model("anthropic", SITOR_FAST).with_params(max_tokens=800)
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


@api_router.post("/tts/speak")
async def tts_speak(payload: TTSReq):
    """TTS = ElevenLabs (voce ultra-realistica). Se non disponibile (crediti finiti),
    risponde 424 e il frontend passa in automatico alla voce del TELEFONO (senza errori)."""
    global _eleven_cooldown_until
    text = _clean_for_tts(payload.text)[:2000]
    if not text:
        raise HTTPException(status_code=400, detail="Testo vuoto")
    # Traduci nella lingua scelta PRIMA di sintetizzare (audio davvero tradotto, non solo accento).
    # V93: la voce del server costa crediti: si usa solo se accesa dall'admin (pagina Costi). Altrimenti parla il telefono.
    try:
        _vs = await db.site_settings.find_one({}, {"_id": 0, "FEATURE_VOICE_SERVER": 1}) or {}
        _voice_on = bool(_vs.get("FEATURE_VOICE_SERVER", False))
    except Exception:
        _voice_on = False
    if not _voice_on:
        raise HTTPException(status_code=424, detail="Voce server spenta: usa voce dispositivo")
    if payload.translate:  # V93: i testi arrivano gia' nella lingua giusta; traduzione solo se richiesta
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
            cko = _hashlib.sha256(f"oai|{text}|{oai_voice}|s110".encode()).hexdigest()
            cpatho = os.path.join(_TTS_CACHE_DIR, cko + ".mp3")
            if os.path.exists(cpatho):
                with open(cpatho, "rb") as f:
                    return Response(content=f.read(), media_type="audio/mpeg", headers={"Cache-Control": "public, max-age=86400", "X-TTS-Provider": "openai"})
            _tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
            res = _tts.generate_speech(text=text, model="tts-1", voice=oai_voice, speed=1.1)
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


# ---------------------------------------------------------------------------
# Impostazioni sito editabili dall'admin: numero WhatsApp, testi fumetti avatar,
# copertine delle cartelle ricette. Lettura pubblica, scrittura solo admin.
# ---------------------------------------------------------------------------
DEFAULT_SITE_SETTINGS = {
    "tiktok_handle": "mikilab.de",  # senza @, usato per https://www.tiktok.com/@<handle>
    "hashtag": "#MikiLab",
    "site_url": "https://mikilab.de",
    "avatar_bubbles": {},   # override keyed "impara.michele" -> {"it": "...", "de": "..."}
    "folder_covers": {},    # {"pane": "<url>", "panettoni": "<url>", ...}
    "impressum_address": "",  # V74: indirizzo mostrato in Impressum/Datenschutz (vuoto = testo predefinito nel frontend)
}

# Q1: SOLO questi campi sono restituiti dalla GET pubblica. MAI numeri di telefono,
# social vecchi (WhatsApp/Facebook/Instagram) o altri dati personali.
PUBLIC_SITE_KEYS = ("tiktok_handle", "hashtag", "site_url", "folder_covers", "impressum_address")


def _merge_site_settings(doc):
    s = dict(DEFAULT_SITE_SETTINGS)
    if doc:
        for k in ("tiktok_handle", "hashtag", "site_url", "avatar_bubbles", "folder_covers", "impressum_address"):
            if doc.get(k) is not None:
                s[k] = doc[k]
    return s


def _public_site_settings(doc):
    """Lista bianca pubblica: solo i campi sicuri per l'interfaccia."""
    merged = _merge_site_settings(doc)
    return {k: merged.get(k) for k in PUBLIC_SITE_KEYS}


@api_router.get("/site-settings")
async def get_site_settings():
    doc = await db.app_meta.find_one({"_key": "site_settings"}, {"_id": 0, "_key": 0})
    return _public_site_settings(doc)


class SiteSettingsReq(BaseModel):
    tiktok_handle: Optional[str] = None
    hashtag: Optional[str] = None
    site_url: Optional[str] = None
    avatar_bubbles: Optional[dict] = None
    folder_covers: Optional[dict] = None
    impressum_address: Optional[str] = None


@api_router.put("/admin/site-settings")
async def admin_site_settings_set(body: SiteSettingsReq, admin: dict = Depends(require_admin)):
    update = {"_key": "site_settings"}
    if body.tiktok_handle is not None:
        h = body.tiktok_handle.strip().lstrip("@").strip()
        # accetta anche URL completo: estrai la parte dopo @
        if "tiktok.com/@" in h:
            h = h.split("tiktok.com/@", 1)[1].split("/")[0].split("?")[0]
        update["tiktok_handle"] = h
    if body.hashtag is not None:
        hh = body.hashtag.strip()
        if hh and not hh.startswith("#"):
            hh = "#" + hh
        update["hashtag"] = hh
    if body.site_url is not None:
        update["site_url"] = body.site_url.strip()
    if body.avatar_bubbles is not None:
        update["avatar_bubbles"] = body.avatar_bubbles
    if body.folder_covers is not None:
        update["folder_covers"] = body.folder_covers
    if body.impressum_address is not None:
        # max 6 righe, 120 caratteri per riga: niente HTML, solo testo semplice.
        _lines = [re.sub(r"[<>]", "", ln).strip()[:120] for ln in body.impressum_address.replace("\r", "").split("\n")]
        update["impressum_address"] = "\n".join([ln for ln in _lines if ln][:6])
    await db.app_meta.update_one({"_key": "site_settings"}, {"$set": update}, upsert=True)
    doc = await db.app_meta.find_one({"_key": "site_settings"}, {"_id": 0, "_key": 0})
    return _public_site_settings(doc)


# ---------------------------------------------------------------------------
# Piano Settimanale 7 giorni (Sitor) — Fase 1: strategie | Fase 2: dettaglio parallelo
# ---------------------------------------------------------------------------
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


# --- Moduli del Manuale di Sitor (le rotte si registrano sullo stesso api_router) ---
import recipes as _mod_recipes  # noqa: E402  ricette: crea/modifica/traduci, foto, preferiti
for _k in list(vars(_mod_recipes)):  # noqa: E402  ri-esporta nel core i simboli definiti dal modulo
    if _k != '_core' and not _k.startswith('__') and _k not in globals():
        globals()[_k] = getattr(_mod_recipes, _k)

import auth as _mod_auth  # noqa: E402  accesso admin (email + password)
for _k in list(vars(_mod_auth)):  # noqa: E402  ri-esporta nel core i simboli definiti dal modulo
    if _k != '_core' and not _k.startswith('__') and _k not in globals():
        globals()[_k] = getattr(_mod_auth, _k)

import recipe_extras as _mod_recipe_extras  # noqa: E402  extra ricetta (Manuale di Sitor)
for _k in list(vars(_mod_recipe_extras)):  # noqa: E402  ri-esporta nel core i simboli definiti dal modulo
    if _k != '_core' and not _k.startswith('__') and _k not in globals():
        globals()[_k] = getattr(_mod_recipe_extras, _k)

import sitor_public as _mod_sitor_public  # noqa: E402  corso v2 + chat pubblica di Sitor
for _k in list(vars(_mod_sitor_public)):  # noqa: E402  ri-esporta nel core i simboli definiti dal modulo
    if _k != '_core' and not _k.startswith('__') and _k not in globals():
        globals()[_k] = getattr(_mod_sitor_public, _k)

import manuale_pages as _mod_manuale_pages  # noqa: E402  percorso a livelli + pagine sito
for _k in list(vars(_mod_manuale_pages)):  # noqa: E402  ri-esporta nel core i simboli definiti dal modulo
    if _k != '_core' and not _k.startswith('__') and _k not in globals():
        globals()[_k] = getattr(_mod_manuale_pages, _k)

import stadio_2b as _mod_stadio_2b  # noqa: E402  Test del Mese + traduttore farine + calendario del pane
for _k in list(vars(_mod_stadio_2b)):  # noqa: E402  ri-esporta nel core i simboli definiti dal modulo
    if _k != '_core' and not _k.startswith('__') and _k not in globals():
        globals()[_k] = getattr(_mod_stadio_2b, _k)

import data_cleanup as _mod_data_cleanup  # noqa: E402  pulizia dati vecchi (solo admin)
for _k in list(vars(_mod_data_cleanup)):  # noqa: E402  ri-esporta nel core i simboli definiti dal modulo
    if _k != '_core' and not _k.startswith('__') and _k not in globals():
        globals()[_k] = getattr(_mod_data_cleanup, _k)

# --- Sync finale cross-modulo: ogni modulo vede TUTTI i simboli del core (indipendente dall'ordine di import) ---
for _m in (_mod_recipes, _mod_auth, _mod_recipe_extras, _mod_sitor_public, _mod_manuale_pages, _mod_stadio_2b, _mod_data_cleanup):  # noqa: E402
    for _k, _v in list(globals().items()):
        if not _k.startswith('__') and _k not in _m.__dict__:
            _m.__dict__[_k] = _v
from recipes import _LANG_NAMES  # noqa: E402,F401

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


# --- Email di follow-up dopo l'acquisto di un pacchetto (dopo N giorni) ------


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
        # Indice unico sull'email: garantisce UN SOLO account per email (anti-duplicati/race).
        await db.users.create_index("email", unique=True, name="uniq_email")
    except Exception as e:
        logging.getLogger(__name__).error(f"users email unique index error: {e}")
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
        # RESET admin del proprietario: se ADMIN_RESET_PASSWORD e' impostata (env, mai nel codice),
        # forza email+password dell'owner, sblocca i tentativi e disattiva l'admin legacy.
        # Idempotente: si puo' lasciare la variabile e poi rimuoverla dopo l'accesso.
        _owner_email = (os.environ.get("ADMIN_EMAIL") or "michelecip918@gmail.com").strip().lower()
        _reset_pw = os.environ.get("ADMIN_RESET_PASSWORD")
        if _reset_pw:
            # V75: la password si reimposta UNA SOLA VOLTA per ogni valore del segreto (impronta salvata nel DB).
            # Così, se poi la cambi da admin, il cambio resta anche se il segreto è ancora impostato.
            _fp = _hashlib.sha256(_reset_pw.encode("utf-8")).hexdigest()
            _done = await db.app_meta.find_one({"_key": "admin_reset_done"}, {"_id": 0, "fp": 1})
            _first = not (_done and _done.get("fp") == _fp)
            _acc = await db.users.find_one({"email": _owner_email})
            if not _acc:
                await db.users.insert_one({
                    "user_id": f"user_{uuid.uuid4().hex[:12]}", "email": _owner_email,
                    "name": "MikiLab", "picture": "", "role": "admin", "auth_provider": "email",
                    "password_hash": _hash_pw(_reset_pw), "created_at": now_iso(),
                    "email_verified": True, "organization_id": ORG_DEFAULT,
                })
                logging.getLogger(__name__).info("Owner admin creato da ADMIN_RESET_PASSWORD")
            elif _first:
                await db.users.update_one({"email": _owner_email}, {"$set": {
                    "password_hash": _hash_pw(_reset_pw), "role": "admin", "email_verified": True}})
                logging.getLogger(__name__).info("Password owner reimpostata da ADMIN_RESET_PASSWORD (una sola volta)")
            else:
                # già reimpostata in passato: NON toccare la password, solo garantire ruolo admin
                await db.users.update_one({"email": _owner_email}, {"$set": {"role": "admin", "email_verified": True}})
            if _first:
                await db.app_meta.update_one({"_key": "admin_reset_done"},
                    {"$set": {"_key": "admin_reset_done", "fp": _fp, "at": now_iso()}}, upsert=True)
            # sblocca i tentativi di accesso per questa email (qualsiasi IP)
            await db.login_attempts.delete_many({"identifier": {"$regex": f":{re.escape(_owner_email)}$"}})
            # disattiva l'account admin legacy: role user, nessuna password valida (NON cancellato)
            await db.users.update_one(
                {"email": LEGACY_ADMIN_EMAIL},
                {"$set": {"role": "user"}, "$unset": {"password_hash": ""}},
            )
            await db.user_sessions.delete_many({"user_id": {"$in": [
                u["user_id"] async for u in db.users.find({"email": LEGACY_ADMIN_EMAIL}, {"user_id": 1})
            ]}})
            await db.login_attempts.delete_many({"identifier": {"$regex": f":{re.escape(LEGACY_ADMIN_EMAIL)}$"}})
    except Exception as e:
        logging.getLogger(__name__).error(f"Admin reset error: {e}")
    try:
        # V73 — ricette riscritte da Sitor: restano "bozza" (mai "Provata") e i loro vecchi corsi si rigenerano.
        # Si esegue UNA SOLA volta (poi Michele può cambiare lo stato quando le prova).
        _m73 = await db.app_meta.find_one({"_key": "v73_drafts"}, {"_id": 0})
        if not _m73:
            for _nm in V73_DRAFT_NAMES:
                _r = await db.recipes.find_one({"collection_name": "mikilab", "name": _nm}, {"_id": 0, "id": 1})
                if _r:
                    await db.recipe_extras.update_one(
                        {"recipe_id": _r["id"]},
                        {"$set": {"recipe_id": _r["id"], "status": "sitor_draft", "verified": False, "updated_at": now_iso()}},
                        upsert=True)
                    await db.recipe_courses_v2.delete_many({"recipe_id": _r["id"]})
            for _nm in V73_PROC_NAMES:
                _r = await db.recipes.find_one({"collection_name": "mikilab", "name": _nm}, {"_id": 0, "id": 1})
                if _r:
                    await db.recipe_courses_v2.delete_many({"recipe_id": _r["id"]})
            await db.app_meta.update_one({"_key": "v73_drafts"}, {"$set": {"_key": "v73_drafts", "done_at": now_iso()}}, upsert=True)
    except Exception as e:
        logging.getLogger(__name__).error(f"V73 drafts error: {e}")
    try:
        # V78 — le ricette custodite entrate nel ricettario partono come "Bozza" (mai "Provata" in automatico).
        # Idempotente: imposta lo stato SOLO dove manca, quindi non tocca mai una scelta fatta da Michele.
        for _nm in V78_DRAFT_NAMES:
            _r = await db.recipes.find_one({"collection_name": "mikilab", "name": _nm}, {"_id": 0, "id": 1})
            if not _r:
                continue
            _ex = await db.recipe_extras.find_one({"recipe_id": _r["id"]}, {"_id": 0, "status": 1})
            if _ex and _ex.get("status"):
                continue
            await db.recipe_extras.update_one(
                {"recipe_id": _r["id"]},
                {"$set": {"recipe_id": _r["id"], "status": "sitor_draft", "verified": False, "updated_at": now_iso()}},
                upsert=True)
    except Exception as e:
        logging.getLogger(__name__).error(f"V78 drafts error: {e}")
    try:
        # V79 — procedimenti riscritti: azzera UNA SOLA VOLTA i corsi salvati di queste ricette (lo stato non si tocca).
        _m79 = await db.app_meta.find_one({"_key": "v79_procs"}, {"_id": 0})
        if not _m79:
            for _nm in V79_PROC_NAMES:
                _r = await db.recipes.find_one({"collection_name": "mikilab", "name": _nm}, {"_id": 0, "id": 1})
                if _r:
                    await db.recipe_courses_v2.delete_many({"recipe_id": _r["id"]})
            await db.app_meta.update_one({"_key": "v79_procs"}, {"$set": {"_key": "v79_procs", "done_at": now_iso()}}, upsert=True)
    except Exception as e:
        logging.getLogger(__name__).error(f"V79 procs error: {e}")
    try:
        # V81 — Panettone Verde Canapa al metodo 60/40: aggiorna SOLO i testi (dosi invariate), una volta sola.
        # La scheda è "modificata a mano" e il seed non la tocca: per questo serve questo passaggio dedicato.
        # Se Michele ha già riscritto il procedimento (non contiene più "50/50"), non si tocca nulla.
        _m81 = await db.app_meta.find_one({"_key": "v81_canapa"}, {"_id": 0})
        if not _m81:
            _nm81 = "Panettone Artigianale MikiLab — Verde Canapa"
            _src = next((x for x in _load_mikilab_seed() if x.get("name") == _nm81), None)
            _r = await db.recipes.find_one({"collection_name": "mikilab", "name": _nm81}, {"_id": 0, "id": 1, "procedure": 1})
            if _src and _r and "50/50" in (_r.get("procedure") or ""):
                _keys = [k for k in _src.keys() if k.startswith(("procedure", "flour_type", "notes"))]
                _upd = {k: _src.get(k) for k in _keys}
                _upd["updated_at"] = now_iso()
                await db.recipes.update_one({"collection_name": "mikilab", "name": _nm81}, {"$set": _upd})
                await db.recipe_courses_v2.delete_many({"recipe_id": _r["id"]})
            await db.app_meta.update_one({"_key": "v81_canapa"}, {"$set": {"_key": "v81_canapa", "done_at": now_iso()}}, upsert=True)
    except Exception as e:
        logging.getLogger(__name__).error(f"V81 canapa error: {e}")
    try:
        # V122 — Miglioratore naturale a 8 ingredienti (malto 15 su 100): aggiorna una volta la scheda dal seed.
        _m122 = await db.app_meta.find_one({"_key": "v122_miglioratore"}, {"_id": 0})
        if not _m122:
            _nm = "Miglioratore Naturale Pro"
            _src = next((x for x in _load_mikilab_seed() if x.get("name") == _nm), None)
            _r = await db.recipes.find_one({"collection_name": "mikilab", "name": _nm}, {"_id": 0, "id": 1})
            if _src and _r:
                _keys = [k for k in _src.keys() if k.startswith(("procedure", "notes", "real_name", "extra_ingredients"))]
                _upd = {k: _src.get(k) for k in _keys}
                _upd["updated_at"] = now_iso()
                await db.recipes.update_one({"collection_name": "mikilab", "name": _nm}, {"$set": _upd})
                await db.recipe_courses_v2.delete_many({"recipe_id": _r["id"]})
                _ex = await db.recipe_extras.find_one({"recipe_id": _r["id"]}, {"_id": 0, "mix_composition": 1})
                if _ex and _ex.get("mix_composition"):
                    _comp = [{"it": i["name"], "de": i.get("name_de") or i["name"], "en": i.get("name_en") or i["name"], "pct": i["percent"]} for i in (_src.get("extra_ingredients") or [])]
                    await db.recipe_extras.update_one({"recipe_id": _r["id"]}, {"$set": {"mix_composition": _comp, "mix_unit_g": 100, "updated_at": now_iso()}})
            await db.app_meta.update_one({"_key": "v122_miglioratore"}, {"$set": {"_key": "v122_miglioratore", "done_at": now_iso()}}, upsert=True)
    except Exception as e:
        logging.getLogger(__name__).error(f"V122 miglioratore error: {e}")
    try:
        # V125 — (1) metodo di Michele in pane, panini e baguette (non col burro): olio d'oliva 1%, aceto di mele 1%,
        # Kokosfett 1%; (2) ordine: categorie giuste, doppioni nascosti, «Mickey Lab» → «MikiLab».
        # Una volta sola, sul database: aggiunge/sposta soltanto, non cancella nulla (vale anche per le schede modificate a mano).
        _m125 = await db.app_meta.find_one({"_key": "v125_grassi"}, {"_id": 0})
        if not _m125:
            import grassi_michele as _gm
            _q = {"collection_name": "mikilab", "$or": [{"menu_category": {"$in": list(_gm.CATS)}}, {"name": {"$in": list(_gm.ANCHE) + list(_gm.SPOSTA.keys()) + [_gm.VECCHIO_NOME]}}]}
            async for _r in db.recipes.find(_q, {"_id": 0}):
                _upd = _gm.applica(_r)
                _upd.update(_gm.ordina(_r))
                if _upd:
                    _upd["updated_at"] = now_iso()
                    await db.recipes.update_one({"collection_name": "mikilab", "id": _r["id"]}, {"$set": _upd})
                    await db.recipe_courses_v2.delete_many({"recipe_id": _r["id"]})
            for _nm in _gm.DOPPIONI:
                await db.recipes.update_many({"collection_name": "mikilab", "name": _nm}, {"$set": {"hidden": True, "updated_at": now_iso()}})
            await db.app_meta.update_one({"_key": "v125_grassi"}, {"$set": {"_key": "v125_grassi", "done_at": now_iso()}}, upsert=True)
    except Exception as e:
        logging.getLogger(__name__).error(f"V125 grassi error: {e}")
    try:
        # STADIO 3a — stati ricetta idempotenti: imposta lo status SOLO dove manca
        # (così la produzione, priva dei flag, lo riceve; l'anteprima e le scelte admin restano intatte).
        # pane/panini/focacce → "Provata da Michele" (tested)
        async for _r in db.recipes.find(
            {"collection_name": "mikilab", "menu_category": {"$in": ["pane", "panini", "focacce"]}},
            {"_id": 0, "id": 1, "name": 1},
        ):
            _ex = await db.recipe_extras.find_one({"recipe_id": _r["id"]}, {"_id": 0, "status": 1})
            if _ex and _ex.get("status"):
                continue
            await db.recipe_extras.update_one(
                {"recipe_id": _r["id"]},
                {"$set": {"recipe_id": _r["id"], "status": "tested", "verified": True, "updated_at": now_iso()}},
                upsert=True,
            )
        # Le 3 ricette con poolish sono state provate da Michele: forza "Provata" (idempotente,
        # corregge anche la produzione se ha ancora "Controllata").
        for _name in ("Carezza Dolce", "Treccia del Sole", "Panino alle Carote"):
            _r = await db.recipes.find_one({"collection_name": "mikilab", "name": _name}, {"_id": 0, "id": 1})
            if _r:
                await db.recipe_extras.update_one(
                    {"recipe_id": _r["id"]},
                    {"$set": {"recipe_id": _r["id"], "status": "tested", "verified": True, "updated_at": now_iso()}},
                    upsert=True,
                )
        # 16 panettoni (tranne Verde Canapa) → "Controllata da Michele" (reviewed) + verified.
        # Inoltre TUTTI i panettoni tornano visibili: azzera hidden_public (idempotente).
        async for _r in db.recipes.find(
            {"collection_name": "mikilab", "menu_category": "panettoni"},
            {"_id": 0, "id": 1, "name": 1},
        ):
            await db.recipe_extras.update_one(
                {"recipe_id": _r["id"]},
                {"$set": {"recipe_id": _r["id"], "hidden_public": False, "updated_at": now_iso()}},
                upsert=True,
            )
            if "Verde Canapa" in (_r.get("name") or ""):
                continue
            _ex = await db.recipe_extras.find_one({"recipe_id": _r["id"]}, {"_id": 0, "status": 1})
            if _ex and _ex.get("status"):
                continue
            await db.recipe_extras.update_one(
                {"recipe_id": _r["id"]},
                {"$set": {"recipe_id": _r["id"], "status": "reviewed", "verified": True, "updated_at": now_iso()}},
                upsert=True,
            )
    except Exception as e:
        logging.getLogger(__name__).error(f"Recipe status seed error: {e}")

    try:
        init_storage()
        logging.getLogger(__name__).info("Archivio immagini inizializzato")
    except Exception as e:
        logging.getLogger(__name__).error(f"Storage init error: {e}")
    # V82: nessun processo in background (email, turni, allarmi, community): la vecchia app aziendale è stata tolta.


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
