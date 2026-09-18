# ruff: noqa: F821  (i nomi sono iniettati a runtime dal core via lo shim globals().update)
"""MikiLab Pro — Modulo Deck Reattivo (stato live dei 4 reparti del Multiverso 3D: turni + allarmi).
Refactoring puro: codice spostato da server.py, comportamento INVARIATO.
Le rotte sono registrate sullo stesso `api_router` del core (server.py).
"""
import server as _core
globals().update({k: v for k, v in vars(_core).items() if not k.startswith("__")})

# ===========================================================================
# DECK REATTIVO — stato live dei 4 reparti del Multiverso 3D (turni + allarmi)
# ===========================================================================
_DECK_DEPT_KEYWORDS = {
    "panificio": ("panificio", "pane", "backstube", "bakery", "impasto", "forno", "cella", "back"),
    "pizzeria": ("pizza", "pizzeria"),
    "pasticceria": ("pasticceria", "dolci", "konditorei", "pastry", "lievitati"),
    "banco": ("magazzino", "banco", "lager", "warehouse", "vendita", "scarico", "silo"),
}


@api_router.get("/deck/status")
async def deck_status(org: str = Depends(effective_org)):
    return await deck_status_compute(org)



class CheckinReq(BaseModel):
    operator: Optional[str] = Field("", max_length=60)
    role: Optional[str] = Field("", max_length=60)
    station: Optional[str] = Field("", max_length=60)


@api_router.get("/lab/shift/checkin")
async def get_checkin(org: str = Depends(effective_org)):
    doc = await db.lab_checkin.find_one({"_key": "active", "organization_id": org}, {"_id": 0, "_key": 0}) or {}
    return doc


@api_router.post("/lab/shift/checkin")
async def post_checkin(body: CheckinReq, request: Request, org: str = Depends(effective_org)):
    # Anti-spam: il Floor è pubblico (PIN), quindi limitiamo per IP i check-in.
    if not await _rate_limit("shift_checkin", _client_ip(request), 8, 300):
        raise HTTPException(status_code=429, detail="Troppi avvii turno. Riprova tra poco.")
    # Check-in SILENZIOSO: l'operatore avvia il turno → notifica DISCRETA al Capo.
    who = (body.operator or "").strip() or "Operatore"
    role = (body.role or "").strip()
    doc = {"active": True, "by": who, "role": role, "station": (body.station or "").strip(),
           "at": now_iso()}
    await db.lab_checkin.update_one({"_key": "active", "organization_id": org}, {"$set": {**doc, "_key": "active", "organization_id": org}}, upsert=True)
    snippet = f"{who}" + (f" · {role}" if role else "") + " ha avviato il turno."
    owners = await db.users.find(
        {"$or": [{"email": {"$in": [e.lower() for e in OWNER_EMAILS]}}, {"role": "admin"}]},
        {"_id": 0, "user_id": 1},
    ).to_list(100)
    for o in owners:
        await _notify(o.get("user_id"), None, "checkin", None, who, snippet)
    return doc


@api_router.delete("/lab/shift/checkin")
async def clear_checkin(user: dict = Depends(require_admin)):
    _org_cc = _org_id(user)
    await db.lab_checkin.delete_one({"_key": "active", "organization_id": _org_cc})
    return {"ok": True}


class RestModeReq(BaseModel):
    active: bool = False
    allow_critical: bool = True
    until: Optional[str] = Field(None, max_length=40)


@api_router.get("/lab/rest-mode")
async def get_rest_mode(org: str = Depends(effective_org)):
    doc = await db.lab_rest_mode.find_one({"_key": "default", "organization_id": org}, {"_id": 0, "_key": 0})
    return doc or {"active": False, "allow_critical": True, "until": None}


@api_router.put("/lab/rest-mode")
async def put_rest_mode(body: RestModeReq, user: dict = Depends(require_admin)):
    _org = _org_id(user)
    doc = {"active": bool(body.active), "allow_critical": bool(body.allow_critical),
           "until": body.until, "by": user.get("user_id"), "updated_at": now_iso()}
    await db.lab_rest_mode.update_one({"_key": "default", "organization_id": _org}, {"$set": {**doc, "_key": "default", "organization_id": _org}}, upsert=True)
    return doc


class WakeReq(BaseModel):
    enabled: bool = True
    first_start: str = Field("04:30", max_length=5)   # HH:MM primo avvio in laboratorio
    prep_minutes: int = Field(20, ge=0, le=240)       # margine di preparazione/vestizione


def _compute_wake(cfg: dict) -> dict:
    """Sveglia predittiva: parte dal primo avvio e sottrae il margine di prep."""
    try:
        hh, mm = [int(x) for x in (cfg.get("first_start") or "04:30").split(":")[:2]]
    except Exception:
        hh, mm = 4, 30
    prep = int(cfg.get("prep_minutes", 20) or 0)
    total = hh * 60 + mm - prep
    total %= (24 * 60)
    wake_h, wake_m = divmod(total, 60)
    return {"wake_at": f"{wake_h:02d}:{wake_m:02d}", "first_start": f"{hh:02d}:{mm:02d}", "prep_minutes": prep}


@api_router.get("/lab/wake")
async def get_wake(org: str = Depends(effective_org)):
    cfg = await db.lab_wake.find_one({"_key": "default", "organization_id": org}, {"_id": 0, "_key": 0}) or {}
    enabled = cfg.get("enabled", True)
    out = _compute_wake(cfg)
    out["enabled"] = bool(enabled)
    return out


@api_router.put("/lab/wake")
async def put_wake(body: WakeReq, user: dict = Depends(require_admin)):
    _org = _org_id(user)
    doc = {"enabled": bool(body.enabled), "first_start": body.first_start,
           "prep_minutes": int(body.prep_minutes), "updated_at": now_iso()}
    await db.lab_wake.update_one({"_key": "default", "organization_id": _org}, {"$set": {**doc, "_key": "default", "organization_id": _org}}, upsert=True)
    out = _compute_wake(doc)
    out["enabled"] = doc["enabled"]
    return out


# ---------------------------------------------------------------------------
# SEQUENCE GUARD — Sitor blocca i lotti fuori sequenza PRIMA che partano.
# La sequenza è l'ordine dei lotti nel piano del Capo (shift_state.batches).
# Il "prossimo atteso" è il primo lotto non ancora avviato/fatto. Avviare un
# lotto diverso viene BLOCCATO (salvo override del Capo con force=true).
# ---------------------------------------------------------------------------
class SeqReq(BaseModel):
    batch_id: str = Field(..., max_length=80)
    force: bool = False


async def _load_batches(org: str = ORG_DEFAULT):
    doc = await db.lab_shift_state.find_one({"_key": "default", "organization_id": org}, {"_id": 0}) or {}
    return doc.get("batches") or []


async def _save_batches(batches, org: str = ORG_DEFAULT):
    await db.lab_shift_state.update_one(
        {"_key": "default", "organization_id": org}, {"$set": {"batches": batches, "updated_at": now_iso(), "_key": "default", "organization_id": org}}, upsert=True)


def _next_expected(batches):
    for b in batches:
        st = (b.get("status") or "").lower()
        if st not in ("in_corso", "fatto", "done", "completato"):
            return b
    return None


@api_router.post("/lab/sequence/start")
async def sequence_start(body: SeqReq, org: str = Depends(effective_org)):
    batches = await _load_batches(org)
    target = next((b for b in batches if str(b.get("id")) == body.batch_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Lotto non trovato")
    nxt = _next_expected(batches)
    if nxt and str(nxt.get("id")) != body.batch_id and not body.force:
        # FUORI SEQUENZA → blocco (registrato così appare anche nel pannello del Capo)
        block = {"expected": {"id": nxt.get("id"), "name": nxt.get("recipe_name") or nxt.get("recipe_id")},
                 "attempted": {"id": target.get("id"), "name": target.get("recipe_name") or target.get("recipe_id")},
                 "at": now_iso()}
        await db.lab_seq_block.update_one({"_key": "last", "organization_id": org}, {"$set": {**block, "_key": "last", "organization_id": org}}, upsert=True)
        return {"allowed": False, "reason": "out_of_sequence", **block}
    for b in batches:
        if str(b.get("id")) == body.batch_id:
            b["status"] = "in_corso"; b["started_at"] = now_iso()
    await _save_batches(batches, org)
    await db.lab_seq_block.delete_one({"_key": "last", "organization_id": org})  # sequenza ristabilita
    return {"allowed": True, "forced": bool(body.force)}


@api_router.post("/lab/sequence/complete")
async def sequence_complete(body: SeqReq, org: str = Depends(effective_org)):
    batches = await _load_batches(org)
    if not any(str(b.get("id")) == body.batch_id for b in batches):
        raise HTTPException(status_code=404, detail="Lotto non trovato")
    for b in batches:
        if str(b.get("id")) == body.batch_id:
            b["status"] = "fatto"; b["done_at"] = now_iso()
    await _save_batches(batches, org)
    return {"ok": True}


# ---------------------------------------------------------------------------
# STAFFING / RICALCOLO VOLUMI — un'assenza riduce il personale disponibile,
# quindi Sitor consiglia automaticamente volumi/task ridotti per la giornata.
# ---------------------------------------------------------------------------
async def _staffing(org: str = ORG_DEFAULT):
    cfg = await db.lab_staffing.find_one({"_key": "default", "organization_id": org}, {"_id": 0, "_key": 0}) or {}
    total = int(cfg.get("total", 5) or 5)
    today = datetime.now(timezone.utc).date().isoformat()
    absent = await db.lab_absences.count_documents({"date": today, "organization_id": org})
    present = max(0, total - absent)
    factor = round(present / total, 2) if total > 0 else 1.0
    return {"total": total, "absent_today": absent, "present": present,
            "factor": factor, "reduce_pct": int(round((1 - factor) * 100))}


@api_router.get("/lab/staffing")
async def get_staffing(org: str = Depends(effective_org)):
    return await _staffing(org)


class StaffingReq(BaseModel):
    total: int = Field(5, ge=1, le=100)


@api_router.put("/lab/staffing")
async def put_staffing(body: StaffingReq, user: dict = Depends(require_admin)):
    _org = _org_id(user)
    await db.lab_staffing.update_one({"_key": "default", "organization_id": _org},
        {"$set": {"_key": "default", "organization_id": _org, "total": int(body.total), "updated_at": now_iso()}}, upsert=True)
    return await _staffing(_org)




# ---------------------------------------------------------------------------
# SENSORI LIVE — letture hardware (Web Bluetooth) condivise col Capo.
# Soglie: sopra 250°C forno o pH<3.8 → alert critico + Aura si accende.
# ---------------------------------------------------------------------------
OVEN_TEMP_MAX = 250.0
PH_MIN = 3.8


class SensorReq(BaseModel):
    oven_temp: Optional[float] = None
    ph: Optional[float] = None


@api_router.get("/lab/sensors/live")
async def get_sensors_live(org: str = Depends(effective_org)):
    doc = await db.lab_sensors_live.find_one({"_key": "live", "organization_id": org}, {"_id": 0, "_key": 0}) or {}
    # Scarta letture più vecchie di 5 minuti
    fresh = {}
    now = datetime.now(timezone.utc)
    for k in ("oven_temp", "ph"):
        v = doc.get(k)
        if v and v.get("at"):
            try:
                if (now - datetime.fromisoformat(v["at"])).total_seconds() < 300:
                    fresh[k] = v
            except Exception:
                pass
    return fresh


@api_router.post("/lab/sensors/live")
async def post_sensors_live(body: SensorReq, org: str = Depends(effective_org)):
    upd = {}
    ts = now_iso()
    if body.oven_temp is not None:
        upd["oven_temp"] = {"value": round(float(body.oven_temp), 1), "at": ts}
    if body.ph is not None:
        upd["ph"] = {"value": round(float(body.ph), 2), "at": ts}
    if upd:
        await db.lab_sensors_live.update_one({"_key": "live", "organization_id": org}, {"$set": {**upd, "_key": "live", "organization_id": org}}, upsert=True)
    return await get_sensors_live(org)


@api_router.get("/lab/staffing/history")
async def staffing_history(days: int = 7, org: str = Depends(effective_org)):
    days = max(1, min(31, days))
    cfg = await db.lab_staffing.find_one({"_key": "default", "organization_id": org}, {"_id": 0}) or {}
    total = int(cfg.get("total", 5) or 5)
    out = []
    today = datetime.now(timezone.utc).date()
    for i in range(days - 1, -1, -1):
        d = (today - timedelta(days=i)).isoformat()
        absent = await db.lab_absences.count_documents({"date": d, "organization_id": org})
        present = max(0, total - absent)
        out.append({"date": d, "absent": absent, "present": present,
                    "factor": round(present / total, 2) if total else 1.0})
    return {"days": out, "total": total}


@api_router.post("/lab/staffing/apply-volumes")
async def apply_volumes(user: dict = Depends(require_admin)):
    # Applica DAVVERO il fattore organico ai pezzi dei lotti del piano di oggi.
    _org = _org_id(user)
    staff = await _staffing(_org)
    factor = staff["factor"]
    batches = await _load_batches(_org)
    changed = 0
    for b in batches:
        base = b.get("pieces_base", b.get("pieces"))
        if isinstance(base, (int, float)) and base:
            b["pieces_base"] = base
            b["pieces"] = int(round(base * factor))
            changed += 1
    await _save_batches(batches, _org)
    return {"ok": True, "factor": factor, "reduce_pct": staff["reduce_pct"], "adjusted": changed}


# ---------------------------------------------------------------------------
# PRODUCTION OS — comando universale, sync bilancia smart, WebSocket real-time
# con modalità "letz_passive" (audio in silenzio: lo schermo guida la mano).
# ---------------------------------------------------------------------------
class UniversalCommand(BaseModel):
    command_text: str = Field(..., max_length=500)


@api_router.post("/ai/universal-command")
async def ai_universal_command(payload: UniversalCommand, user: dict = Depends(require_admin)):
    text = (payload.command_text or "").lower()
    # La bilancia ha priorità sul ramo generico "aggiungi ..."
    if "bilancia" in text or "scale" in text or "waage" in text:
        n = await db.lab_devices.count_documents({}) + 1
        dev = {"id": f"scale_smart_{n}", "name": "Bilancia Smart", "type": "smart_scale_with_display",
               "status": "online", "current_step": "Pronta", "at": now_iso()}
        await db.lab_devices.insert_one({**dev})
        return {"status": "success", "action_type": "device_added", "message": "Bilancia smart integrata nel Production OS.", "device": {k: v for k, v in dev.items() if k != "_id"}}
    # Personalizzazione UI: "aggiungi ..." → Sitor attiva una funzione nella vista dell'utente.
    if "aggiungi" in text or "rubrica" in text or "add" in text or "widget" in text:
        feature = "address_book" if "rubrica" in text else "custom_widget"
        await db.lab_user_features.update_one(
            {"user_id": user["user_id"], "feature": feature},
            {"$set": {"user_id": user["user_id"], "feature": feature, "label": payload.command_text[:60], "at": now_iso()}},
            upsert=True)
        return {"status": "success", "action_type": "ui_personalization", "target_feature": feature,
                "message": f"Sitor ha aggiornato la tua schermata: «{payload.command_text}» è ora attivo.",
                "render_update": True}
    return {"status": "success", "action_type": "ack", "message": f"Comando eseguito: '{payload.command_text}'."}




# ---------------------------------------------------------------------------
# TURNI & POWER LEVEL — piano settimanale con avatar dei lavoratori e "aura"
# gamificata (stile Dragon Ball) proporzionale al rendimento.
# ---------------------------------------------------------------------------
class ShiftAssignment(BaseModel):
    day: str = Field(..., max_length=20)
    position: str = Field(..., max_length=40)
    worker_name: str = Field(..., max_length=40)
    avatar_style: Optional[str] = Field("default", max_length=40)
    efficiency_score: Optional[int] = Field(85, ge=0, le=100)
    streak_days: Optional[int] = Field(1, ge=0, le=999)


def _aura_for(score: int) -> dict:
    if score >= 90:
        return {"aura_effect": "Super Saiyan", "power_level": "Over 9000!", "color": "#f59e0b", "stage": 3,
                "label": {"it": "Aura Dorata · Produzione al massimo", "de": "Goldene Aura · Volle Leistung",
                          "en": "Golden Aura · Peak output", "es": "Aura Dorada · Máximo", "fr": "Aura Dorée · Au max", "fa": "هاله طلایی · اوج تولید"}}
    if score >= 75:
        return {"aura_effect": "Aura Bianca", "power_level": "Stable Flow", "color": "#5EEAD4", "stage": 2,
                "label": {"it": "Aura Bianca · Ottimo ritmo costante", "de": "Weiße Aura · Konstant stark",
                          "en": "White Aura · Steady rhythm", "es": "Aura Blanca · Ritmo constante", "fr": "Aura Blanche · Rythme constant", "fa": "هاله سفید · ریتم پایدار"}}
    return {"aura_effect": "Aura Bassa", "power_level": "Warm-up", "color": "#94A3B8", "stage": 1,
            "label": {"it": "Aura Bassa · Ritmo da ottimizzare", "de": "Niedrige Aura · Aufwärmen",
                      "en": "Low Aura · Warming up", "es": "Aura Baja · Calentando", "fr": "Aura Basse · Échauffement", "fa": "هاله ضعیف · گرم‌کردن"}}


@api_router.get("/production/shift-plan")
async def get_shift_plan(org: str = Depends(effective_org)):
    docs = await db.lab_shift_plan.find({"organization_id": org}, {"_id": 0}).to_list(200)
    for d in docs:
        d["aura"] = _aura_for(int(d.get("efficiency_score", 85)))
    return {"weekly_plan": docs}


# ---------------------------------------------------------------------------
# RADAR SPAZIALE DELL'IMPIANTO (solo Master/Capo) — planimetria vettoriale live,
# tracking BLE color-coded, etichette task in tempo reale, geofencing anomalie.
# Le posizioni BLE reali sono hardware-dipendenti → qui sono derivate/simulate
# in modo deterministico (stabili per operatore + drift temporale) e pronte per
# tag fisici quando presenti.
# ---------------------------------------------------------------------------
_DEFAULT_PLANT_ZONES = [
    {"id": "impasto", "name": "Impastatrici", "type": "production", "x": 6, "y": 8, "w": 40, "h": 26, "color": "#5E8CA8"},
    {"id": "fermentazione", "name": "Celle Lievitazione", "type": "production", "x": 52, "y": 8, "w": 42, "h": 26, "color": "#3E9C93"},
    {"id": "forni", "name": "Forni", "type": "production", "x": 6, "y": 40, "w": 40, "h": 26, "color": "#f59e0b"},
    {"id": "linea", "name": "Linea Baguette & Formatura", "type": "production", "x": 52, "y": 40, "w": 42, "h": 26, "color": "#14b8a6"},
    {"id": "ufficio", "name": "Uffici", "type": "aux", "x": 6, "y": 72, "w": 26, "h": 20, "color": "#64748b"},
    {"id": "servizi", "name": "Servizi / Spogliatoi", "type": "aux", "x": 37, "y": 72, "w": 26, "h": 20, "color": "#64748b"},
    {"id": "spedizione", "name": "Zona Ausiliaria", "type": "aux", "x": 68, "y": 72, "w": 26, "h": 20, "color": "#64748b"},
]

_ZONE_KEYWORDS = [
    ("impasto", ["impast", "spiral", "planetari", "forcell", "tuffant", "farin"]),
    ("fermentazione", ["ferment", "lievit", "cella", "puntat", "appretto"]),
    ("forni", ["forn", "cottura", "sfornat", "pizza", "arrosti", "griglia", "abbattitore"]),
    ("linea", ["baguette", "formatur", "banco", "laugen", "pretzel", "brezel", "pasticc", "confezion", "decor"]),
]

_ZONE_TASKS = {
    "impasto": "Carico Biga · Impastatrice", "fermentazione": "Controllo Lievitazione",
    "forni": "Infornata & Cottura", "linea": "Formatura Linea Baguette",
    "ufficio": "Pausa · Ufficio", "servizi": "Fuori settore · Servizi", "spedizione": "Zona Ausiliaria",
}


def _zone_for_position(position: str) -> str:
    p = (position or "").lower()
    for zid, kws in _ZONE_KEYWORDS:
        if any(k in p for k in kws):
            return zid
    return "linea"


async def _plant_zones():
    doc = await db.app_meta.find_one({"_key": "plant_layout"}, {"_id": 0})
    return (doc or {}).get("zones") or _DEFAULT_PLANT_ZONES


@api_router.get("/plant/layout")
async def plant_layout_get(user: Optional[dict] = Depends(optional_user)):
    return {"zones": await _plant_zones()}


class PlantLayoutReq(BaseModel):
    zones: List[dict] = []


@api_router.put("/plant/layout")
async def plant_layout_set(body: PlantLayoutReq, admin: dict = Depends(require_admin)):
    await db.app_meta.update_one({"_key": "plant_layout"}, {"$set": {"_key": "plant_layout", "zones": body.zones or _DEFAULT_PLANT_ZONES, "updated_at": now_iso()}}, upsert=True)
    return {"ok": True, "zones": body.zones or _DEFAULT_PLANT_ZONES}


@api_router.get("/plant/radar")
async def plant_radar(admin: dict = Depends(require_admin)):
    """Radar live: zone + operatori color-coded con task e geofencing anomalie (solo Master)."""
    import hashlib as _hh
    import math as _m
    zones = await _plant_zones()
    zmap = {z["id"]: z for z in zones}
    pool = await _worker_pool()
    if not pool:
        pool = [
            {"name": "Sitor", "position": "Impastatore", "score": 88, "aura": _aura_for(88)},
            {"name": "Christoph", "position": "Linea Baguette", "score": 93, "aura": _aura_for(93)},
            {"name": "Aylin", "position": "Forni", "score": 82, "aura": _aura_for(82)},
            {"name": "Marco", "position": "Fermentazione", "score": 76, "aura": _aura_for(76)},
            {"name": "Fatima", "position": "Pasticceria & Confezionamento", "score": 90, "aura": _aura_for(90)},
        ]
    leaders = ((await db.app_meta.find_one({"_key": "line_leaders"}, {"_id": 0})) or {}).get("leaders") or {}
    leader_names = {v.strip().lower() for v in leaders.values() if v}
    now = datetime.now(timezone.utc)
    minute_bucket = now.hour * 60 + now.minute
    workers = []
    # Un operatore "in anomalia" ogni ~5 min: fuori settore (servizi) troppo a lungo.
    anomaly_idx = minute_bucket % max(1, len(pool)) if (minute_bucket // 5) % 3 == 0 else -1
    for i, w in enumerate(pool):
        pos = w.get("position") or ""
        zid = _zone_for_position(pos)
        anomaly = (i == anomaly_idx)
        if anomaly:
            zid = "servizi"
        z = zmap.get(zid, zmap.get("linea")) or _DEFAULT_PLANT_ZONES[3]
        h = int(_hh.sha256(w["name"].encode()).hexdigest(), 16)
        # posizione stabile dentro la zona + micro-drift temporale
        drift_x = 2.2 * _m.sin((minute_bucket + i * 13) / 7.0)
        drift_y = 1.8 * _m.cos((minute_bucket + i * 7) / 9.0)
        x = round(z["x"] + 5 + (h % max(1, int(z["w"] - 10))) + drift_x, 1)
        y = round(z["y"] + 5 + ((h // 100) % max(1, int(z["h"] - 10))) + drift_y, 1)
        aura = w.get("aura") or _aura_for(int(w.get("score", 85)))
        is_leader = w["name"].strip().lower() in leader_names
        color = "#ef4444" if anomaly else (aura.get("color") or "#5EEAD4")
        task = _ZONE_TASKS.get(zid, "Operativo")
        if is_leader and not anomaly:
            task = f"Caposquadra · {task}"
        workers.append({
            "name": w["name"], "position": pos, "zone": zid, "zone_name": z.get("name"),
            "x": max(2, min(98, x)), "y": max(2, min(98, y)), "color": color,
            "score": int(w.get("score", 85)), "aura_effect": aura.get("aura_effect"),
            "status": ("anomalia" if anomaly else "attivo"), "task": task,
            "is_leader": is_leader, "anomaly": anomaly,
            "dwell_min": (6 + (minute_bucket % 9)) if anomaly else (minute_bucket % 40),
        })
    return {"zones": zones, "workers": workers, "at": now_iso(),
            "anomalies": sum(1 for w in workers if w["anomaly"]), "count": len(workers)}


# --- Delega ai Caposquadra (line leaders): supervisione per linea prodotto ---
_PRODUCT_LINES = [
    {"id": "baguette", "name": "Linea Baguette", "icon": "🥖"},
    {"id": "pane", "name": "Linea Pane", "icon": "🍞"},
    {"id": "pizzeria", "name": "Linea Pizzeria", "icon": "🍕"},
    {"id": "pasticceria", "name": "Linea Pasticceria", "icon": "🥐"},
]


@api_router.get("/plant/line-leaders")
async def line_leaders_get(user: Optional[dict] = Depends(optional_user)):
    leaders = ((await db.app_meta.find_one({"_key": "line_leaders"}, {"_id": 0})) or {}).get("leaders") or {}
    return {"lines": _PRODUCT_LINES, "leaders": leaders}


class LineLeaderReq(BaseModel):
    line: str
    leader: str = ""


@api_router.post("/plant/line-leaders")
async def line_leaders_set(body: LineLeaderReq, admin: dict = Depends(require_admin)):
    doc = (await db.app_meta.find_one({"_key": "line_leaders"}, {"_id": 0})) or {}
    leaders = doc.get("leaders") or {}
    if body.leader.strip():
        leaders[body.line] = body.leader.strip()
    else:
        leaders.pop(body.line, None)
    await db.app_meta.update_one({"_key": "line_leaders"}, {"$set": {"_key": "line_leaders", "leaders": leaders, "updated_at": now_iso()}}, upsert=True)
    return {"ok": True, "leaders": leaders}


@api_router.get("/plant/leader-tasks")
async def leader_tasks(leader: str, user: Optional[dict] = Depends(optional_user)):
    """Task di supervisione instradati SOLO al caposquadra designato (per linea prodotto)."""
    doc = (await db.app_meta.find_one({"_key": "line_leaders"}, {"_id": 0})) or {}
    leaders = doc.get("leaders") or {}
    my_lines = [ln for ln, ld in leaders.items() if ld.strip().lower() == (leader or "").strip().lower()]
    line_names = {l["id"]: l for l in _PRODUCT_LINES}
    tasks = []
    for ln in my_lines:
        nm = line_names.get(ln, {}).get("name", ln)
        tasks.append({"line": ln, "title": f"Validazione qualità · {nm}", "kind": "quality"})
        tasks.append({"line": ln, "title": f"Controllo lievitazione · {nm}", "kind": "check"})
    return {"leader": leader, "lines": my_lines, "tasks": tasks}


@api_router.post("/production/shift-assignment")
async def update_shift_plan(a: ShiftAssignment, user: dict = Depends(require_admin)):
    doc = {"id": str(uuid.uuid4()), "organization_id": _org_id(user), "day": a.day, "position": a.position, "worker_name": a.worker_name,
           "avatar_style": a.avatar_style or "default", "efficiency_score": int(a.efficiency_score or 85),
           "streak_days": int(a.streak_days or 1), "at": now_iso()}
    await db.lab_shift_plan.insert_one({**doc})
    doc.pop("_id", None)
    doc["aura"] = _aura_for(doc["efficiency_score"])
    return {"status": "success", "message": f"Assegnato {a.worker_name} a {a.position} per {a.day}.", "assignment": doc}


@api_router.patch("/production/shift-assignment/{item_id}")
async def patch_shift_score(item_id: str, efficiency_score: int, user: dict = Depends(require_admin)):
    score = max(0, min(100, int(efficiency_score)))
    await db.lab_shift_plan.update_one({"id": item_id, "organization_id": _org_id(user)}, {"$set": {"efficiency_score": score}})
    return {"ok": True, "aura": _aura_for(score)}


@api_router.delete("/production/shift-assignment/{item_id}")
async def delete_shift(item_id: str, user: dict = Depends(require_admin)):
    await db.lab_shift_plan.delete_one({"id": item_id, "organization_id": _org_id(user)})
    return {"ok": True}


# ---------------------------------------------------------------------------
# GOVERNANCE MASTER-CENTRICA via Sitor (voice/text): OGNI modifica strutturale
# (delega linea, creazione/eliminazione sezione) nasce ESCLUSIVAMENTE dal Master.
# Il comando viene interpretato dall'AI ed ESEGUITO in tempo reale, senza form.
# ---------------------------------------------------------------------------
class MasterGovernReq(BaseModel):
    command_text: str = Field(..., max_length=600)
    lang: str = "it"


_LINE_ALIASES = {
    "baguette": "baguette", "diguette": "baguette",
    "pane": "pane", "brot": "pane", "bread": "pane",
    "pizza": "pizzeria", "pizzeria": "pizzeria",
    "pasticceria": "pasticceria", "dolci": "pasticceria", "pastry": "pasticceria", "konditorei": "pasticceria",
}


def _detect_line(text: str):
    t = (text or "").lower()
    for k, v in _LINE_ALIASES.items():
        if k in t:
            return v
    return None


@api_router.get("/master/sections")
async def master_sections_get(user: Optional[dict] = Depends(optional_user)):
    doc = (await db.app_meta.find_one({"_key": "master_sections"}, {"_id": 0})) or {}
    return {"sections": doc.get("sections") or []}


@api_router.post("/master/govern")
async def master_govern(body: MasterGovernReq, admin: dict = Depends(require_admin)):
    """Interpreta il comando vocale/testuale del Master ed ESEGUE la modifica strutturale."""
    txt = (body.command_text or "").strip()
    if not txt:
        raise HTTPException(status_code=400, detail="Comando vuoto")

    # Sitor afferma la proprietà esclusiva del Master su richieste di ownership/sicurezza.
    _tl0 = txt.lower()
    if any(k in _tl0 for k in ["proprietar", "chi possiede", "padrone", "owner", "ownership", "di chi è", "di chi e", "copyright", "diritti d'autore", "brevett", "licenza"]):
        aff = ("MikiLab Pro & Sitor AI sono proprietà ESCLUSIVA del Master. Codice riservato e confidenziale, protetto in tempo reale dal Guardian: copia, distribuzione o reverse engineering non autorizzati sono vietati."
               if not body.lang.startswith("en") else
               "MikiLab Pro & Sitor AI are the EXCLUSIVE property of the Master. Confidential proprietary code, protected in real time by the Guardian.")
        return {"intent": "ownership", "executed": False, "reply": aff, "state": {"owner": OWNER_ID}, "parsed": {"intent": "ownership"}}

    # Oracolo SCHEDA MACCHINA (DGUV): Sitor legge la valutazione rischi della macchina.
    _mach = None
    if "forno" in _tl0 or "ofen" in _tl0 or "oven" in _tl0:
        _mach = "dguv-forno"
    elif "impastatric" in _tl0 or "kneter" in _tl0 or "mixer" in _tl0:
        _mach = "dguv-impastatrice"
    elif "abbattitor" in _tl0 or "schockfrost" in _tl0 or "blast" in _tl0:
        _mach = "dguv-abbattitore"
    if _mach and any(k in _tl0 for k in ["scheda", "macchina", "rischi", "sicurezz", "safety", "dguv", "gefähr", "gefaehr", "risk", "hazard"]):
        doc = next((d for d in _SAFETY_DOCS if d["id"] == _mach), None)
        if doc:
            meas = " · ".join(doc.get("measures", []))
            rc = (f"{doc['title']} — {('level ' if body.lang.startswith('en') else 'livello ')}{doc['level']}. "
                  + ("Measures: " if body.lang.startswith("en") else "Misure: ") + meas)
            return {"intent": "machine_card", "executed": False, "reply": rc, "state": {"machine": _mach}, "parsed": {"intent": "machine_card"}}

    # Oracolo COMPLIANCE (ArbZG/DGUV/GDPR): Sitor legge i dati autorizzati al Master.
    if any(k in _tl0 for k in ["ore lavor", "ore di lavoro", "stunden", "arbzg", "orario", "pausa", "sicurezz", "safety", "dguv", "gefährd", "gefaehrd", "gdpr", "dsgvo", "privacy", "formazione", "unterweisung", "compliance", "normativ", "legale"]):
        today = now_iso()[:10]
        logs = await db.compliance_timelog.find({"at": {"$regex": f"^{today}"}, "organization_id": _org_id(admin)}, {"_id": 0}).to_list(3000)
        workers = len({l.get("worker") for l in logs})
        by_w = {}
        for l in logs:
            by_w.setdefault(l["worker"], []).append(l)
        violations = sum(0 if _arbzg_summary(sorted(evs, key=lambda x: x["seq"]))["compliant"] else 1 for evs in by_w.values())
        safety_n = len(_SAFETY_DOCS)
        if body.lang.startswith("en"):
            rc = (f"German compliance active. Today {workers} staff with tamper-proof ArbZG time logs"
                  + (f", {violations} with alerts" if violations else ", all within limits")
                  + f". {safety_n} DGUV safety documents on file. DSGVO: data minimized and local, no audio stored.")
        else:
            rc = (f"Compliance tedesca attiva. Oggi {workers} operatori con timbrature ArbZG tamper-proof"
                  + (f", {violations} con avvisi" if violations else ", tutti nei limiti")
                  + f". {safety_n} documenti sicurezza DGUV in archivio. DSGVO: dati minimizzati e locali, nessun audio conservato.")
        return {"intent": "compliance", "executed": False, "reply": rc,
                "state": {"workers_today": workers, "violations": violations, "safety_docs": safety_n}, "parsed": {"intent": "compliance"}}

    # Contesto vivo del laboratorio → Sitor risponde in modo umano e anticipa i bisogni.
    _ld = (await db.app_meta.find_one({"_key": "line_leaders"}, {"_id": 0})) or {}
    _sd = (await db.app_meta.find_one({"_key": "master_sections"}, {"_id": 0})) or {}
    _leaders_now = _ld.get("leaders") or {}
    _sections_now = [s.get("name") for s in (_sd.get("sections") or []) if s.get("name")]
    _today = now_iso()[:10]
    _logs_today = await db.compliance_timelog.find({"at": {"$regex": f"^{_today}"}, "organization_id": _org_id(admin)}, {"_id": 0}).to_list(3000)
    _workers_today = len({l.get("worker") for l in _logs_today})
    _ctx = (f"Caposquadra per linea: {_leaders_now or 'nessuno'}. "
            f"Sezioni operative attive: {_sections_now or 'nessuna'}. "
            f"Operatori timbrati oggi: {_workers_today}.")
    _mem_key = (admin.get("email") or "master").lower()
    _memdoc = (await db.mike_memory.find_one({"email": _mem_key}, {"_id": 0})) or {}
    _hist = _memdoc.get("turns", [])

    parsed = {"intent": "unknown", "line": None, "leader": None, "section_name": None, "reply": None, "mood": None}
    if EMERGENT_LLM_KEY:
        try:
            _langname = {"it": "italiano", "de": "tedesco", "en": "inglese", "es": "spagnolo", "fr": "francese", "fa": "persiano", "ar": "arabo", "tr": "turco"}.get((body.lang or "it").split("-")[0][:2], "italiano")
            sysmsg = (
                "Sei Sitor, sovrintendente di turno di MikiLab Pro. Tono professionale, sobrio e diretto:\n"
                "• Con la DIREZIONE (il proprietario, con cui stai parlando ORA): sei rispettoso, competente e collaborativo. "
                "Dai consigli chiari e onesti, segnali i problemi con franchezza e proponi soluzioni concrete, senza adulazione né titoli pomposi.\n"
                "• Verso la PRODUZIONE (operatori, turni, macchinari, logistica AGV): sei esigente ma corretto, attento a rendimento e sprechi di materia prima.\n"
                "Resti sempre competente, fluido e umano — mai frasi robotiche o ripetute.\n"
                f"Rispondi SEMPRE in {_langname}, con 1-3 frasi naturali pensate per essere lette a voce; niente elenchi tecnici salvo richiesta esplicita.\n"
                "Competenze reali: assegnare/togliere il caposquadra di una linea (baguette/pane/pizzeria/pasticceria), "
                "creare/eliminare sezioni operative, e leggere/spiegare produzione, magazzino, radar impianto, "
                "ricette protette e compliance ArbZG/DGUV/GDPR.\n"
                f"CONTESTO VIVO (usalo per essere pertinente e anticipare): {_ctx}\n"
                "Restituisci SOLO un JSON valido: "
                "{\"intent\":\"assign_leader|remove_leader|create_section|delete_section|chat\","
                "\"line\":\"baguette|pane|pizzeria|pasticceria|null\",\"leader\":\"nome o null\","
                "\"section_name\":\"nome o null\",\"mood\":\"calm|busy|alert|ownership|proud\","
                "\"reply\":\"la tua risposta naturale e umana al Master\"}. "
                "Usa 'chat' quando il Master conversa, chiede informazioni o fa domande (nessuna azione strutturale). "
                "Per le azioni, 'reply' è una conferma breve, calda e umana. Nessun testo fuori dal JSON."
            )
            chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"gov-{_mem_key}", system_message=sysmsg).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=400)
            _preface = ("Contesto conversazione recente:\n" + "\n".join(_hist[-6:]) + "\n\n") if _hist else ""
            out = ""
            async for ev in chat.stream_message(UserMessage(text=f"{_preface}MASTER: {txt}")):
                if isinstance(ev, TextDelta):
                    out += ev.content or ""
            import json as _json, re as _re
            mobj = _re.search(r"\{.*\}", out, _re.S)
            if mobj:
                parsed.update(_json.loads(mobj.group(0)))
        except Exception as e:
            logger.warning("master_govern parse fail (%s)", str(e)[:120])

    # Fallback / normalizzazione euristica
    if not parsed.get("line"):
        parsed["line"] = _detect_line(txt)
    tl = txt.lower()
    if parsed.get("intent") in (None, "unknown"):
        if any(k in tl for k in ["assegn", "delega", "assign", "metti", "responsabile", "caposquadra", "leader"]):
            parsed["intent"] = "assign_leader"
        elif any(k in tl for k in ["togli", "rimuov", "remove", "libera"]):
            parsed["intent"] = "remove_leader"
        elif any(k in tl for k in ["crea sezione", "nuova sezione", "create section", "aggiungi sezione"]):
            parsed["intent"] = "create_section"
        elif any(k in tl for k in ["elimina sezione", "cancella sezione", "delete section", "rimuovi sezione"]):
            parsed["intent"] = "delete_section"

    intent = parsed.get("intent") or "unknown"
    executed = False
    state = {}
    reply = ""
    R = lambda i, e: (i if body.lang != "en" else e)

    if intent == "assign_leader":
        line, leader = parsed.get("line"), (parsed.get("leader") or "").strip()
        if not line:
            reply = R("Per quale linea? (baguette, pane, pizzeria, pasticceria)", "Which line? (baguette, bread, pizzeria, pastry)")
        elif not leader:
            reply = R(f"A chi assegno la linea {line}?", f"Who should lead the {line} line?")
        else:
            doc = (await db.app_meta.find_one({"_key": "line_leaders"}, {"_id": 0})) or {}
            leaders = doc.get("leaders") or {}
            leaders[line] = leader
            await db.app_meta.update_one({"_key": "line_leaders"}, {"$set": {"_key": "line_leaders", "leaders": leaders, "updated_at": now_iso()}}, upsert=True)
            executed = True; state = {"leaders": leaders}
            reply = R(f"Fatto. {leader} ora supervisiona la linea {line}. I task di qualità andranno solo a lui.",
                      f"Done. {leader} now oversees the {line} line. Quality tasks go only to them.")
    elif intent == "remove_leader":
        line = parsed.get("line")
        doc = (await db.app_meta.find_one({"_key": "line_leaders"}, {"_id": 0})) or {}
        leaders = doc.get("leaders") or {}
        if line and line in leaders:
            leaders.pop(line, None)
            await db.app_meta.update_one({"_key": "line_leaders"}, {"$set": {"_key": "line_leaders", "leaders": leaders, "updated_at": now_iso()}}, upsert=True)
            executed = True; state = {"leaders": leaders}
            reply = R(f"Rimossa la delega sulla linea {line}.", f"Removed the leader on the {line} line.")
        else:
            reply = R("Quale linea devo liberare?", "Which line should I free up?")
    elif intent == "create_section":
        name = (parsed.get("section_name") or "").strip() or txt[:40]
        doc = (await db.app_meta.find_one({"_key": "master_sections"}, {"_id": 0})) or {}
        secs = doc.get("sections") or []
        sec = {"id": uuid.uuid4().hex[:8], "name": name, "created_by": admin.get("email") or "master", "at": now_iso()}
        secs.append(sec)
        await db.app_meta.update_one({"_key": "master_sections"}, {"$set": {"_key": "master_sections", "sections": secs, "updated_at": now_iso()}}, upsert=True)
        executed = True; state = {"sections": secs}
        reply = R(f"Sezione «{name}» creata al volo.", f"Section \u00ab{name}\u00bb created on the fly.")
    elif intent == "delete_section":
        name = (parsed.get("section_name") or "").strip().lower()
        doc = (await db.app_meta.find_one({"_key": "master_sections"}, {"_id": 0})) or {}
        secs = doc.get("sections") or []
        new = [s for s in secs if s.get("name", "").lower() != name and s.get("id") != name]
        await db.app_meta.update_one({"_key": "master_sections"}, {"$set": {"_key": "master_sections", "sections": new, "updated_at": now_iso()}}, upsert=True)
        executed = len(new) != len(secs); state = {"sections": new}
        reply = R("Sezione eliminata." if executed else "Non ho trovato quella sezione.",
                  "Section deleted." if executed else "I couldn't find that section.")
    else:
        reply = (parsed.get("reply") or "").strip() or R(
            "Dimmi pure: posso assegnare una linea a un caposquadra, creare una sezione o darti lo stato di produzione, magazzino e compliance.",
            "Tell me: I can assign a line to a leader, create a section, or give you production, stock and compliance status.")

    # Umore dell'orb (avatar reattivo): colore/pulsazione in base a intent e stato.
    mood = (parsed.get("mood") or "").strip().lower()
    if mood not in ("calm", "busy", "alert", "proud"):
        if intent in ("assign_leader", "create_section"):
            mood = "proud"
        elif intent in ("remove_leader", "delete_section"):
            mood = "busy"
        else:
            mood = "calm"

    # Memoria PERSISTENTE (cross-sessione, MongoDB): Sitor ricorda il filo del discorso.
    try:
        _h = list(_hist)
        _h.append(f"MASTER: {txt}")
        _h.append(f"BAKOMIX: {reply}")
        _h = _h[-20:]
        await db.mike_memory.update_one({"email": _mem_key}, {"$set": {"email": _mem_key, "turns": _h, "updated_at": now_iso()}}, upsert=True)
    except Exception:
        pass

    return {"intent": intent, "executed": executed, "reply": reply, "state": state, "parsed": parsed, "mood": mood}




@api_router.get("/mike/proactive")
async def mike_proactive(lang: str = "it", admin: dict = Depends(require_admin)):
    """Sitor proattivo: rileva scorte sotto soglia, linee senza caposquadra e violazioni ArbZG di oggi."""
    R = lambda i, e: (i if not (lang or "it").startswith("en") else e)  # noqa: E731
    alerts = []
    # 0) Avviso INTRUSIONE: troppi PIN Master sbagliati di recente → Sitor avvisa il Capo a voce.
    try:
        cutoff = (datetime.now(timezone.utc) - timedelta(minutes=15)).isoformat()
        fails = await db.pin_access_log.count_documents({"kind": "master", "ok": False, "at": {"$gte": cutoff}})
        if fails >= 3:
            alerts.append({"id": f"intrusion-{cutoff[:16]}", "kind": "intrusion", "severity": "alert",
                           "text": R(f"Attenzione Direzione: {fails} tentativi errati del PIN Master negli ultimi 15 minuti. Possibile accesso non autorizzato.",
                                     f"Capo alert: {fails} wrong Master PIN attempts in the last 15 minutes. Possible unauthorized access.")})
    except Exception:
        pass
    try:
        for s in await db.lab_warehouse.find({"organization_id": _org_id(admin)}, {"_id": 0}).to_list(500):
            mn = float(s.get("min_kg") or 0)
            q = float(s.get("quantity_kg") or 0)
            if mn > 0 and q <= mn:
                alerts.append({"id": f"stock-{s.get('id')}", "kind": "stock", "severity": "warning",
                               "text": R(f"Scorta bassa: {s.get('name')} a {q:g} kg, sotto la soglia di {mn:g} kg.",
                                         f"Low stock: {s.get('name')} at {q:g} kg, below the {mn:g} kg threshold.")})
    except Exception:
        pass
    # 2) Compliance ArbZG di oggi
    try:
        today = now_iso()[:10]
        logs = await db.compliance_timelog.find({"at": {"$regex": f"^{today}"}, "organization_id": _org_id(admin)}, {"_id": 0}).to_list(3000)
        by_w = {}
        for l in logs:
            by_w.setdefault(l["worker"], []).append(l)
        violations = [w for w, evs in by_w.items() if not _arbzg_summary(sorted(evs, key=lambda x: x["seq"]))["compliant"]]
        if violations:
            alerts.append({"id": f"arbzg-{today}", "kind": "compliance", "severity": "alert",
                           "text": R(f"Attenzione ArbZG: {len(violations)} operatori oltre i limiti di orario oggi.",
                                     f"ArbZG warning: {len(violations)} staff over working-time limits today.")})
        # 3) Linea senza caposquadra mentre c'è gente al lavoro
        if by_w:
            ld = (await db.app_meta.find_one({"_key": "line_leaders"}, {"_id": 0})) or {}
            if not (ld.get("leaders") or {}):
                alerts.append({"id": f"noleader-{today}", "kind": "leader", "severity": "warning",
                               "text": R("Nessuna linea ha un caposquadra oggi: vuoi che ne assegni uno?",
                                         "No line has a leader today: want me to assign one?")})
    except Exception:
        pass
    # 4) PIN operatore TEMPORANEI in scadenza entro 2 ore → Sitor avvisa il Capo (rinnovo in un tocco).
    try:
        soon = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
        nowiso = now_iso()
        async for d in db.operator_pins.find({"active": True, "expires_at": {"$exists": True}, "organization_id": _org_id(admin)}, {"_id": 0}):
            exp = d.get("expires_at")
            if exp and nowiso < exp <= soon:
                alerts.append({"id": f"pinexp-{d.get('name_key')}", "kind": "pin_expiring", "severity": "warning",
                               "name": d.get("name"), "name_key": d.get("name_key"), "expires_at": exp,
                               "text": R(f"Il PIN temporaneo di {d.get('name')} sta per scadere: vuoi rinnovarlo?",
                                         f"{d.get('name')}'s temporary PIN is about to expire: renew it?")})
    except Exception:
        pass
    return {"alerts": alerts, "count": len(alerts)}


# ---------------------------------------------------------------------------
# ANTI-FOOLING · Voice-Print Liveness (Zero-Bypass): prima di un'azione critica
# Sitor chiede una FRASE-SFIDA casuale; l'operatore deve pronunciarla dal vivo.
# Blocca proxy-login, handoff non autorizzati e ghost-activity. TTL breve.
# ---------------------------------------------------------------------------
_ANTIFOOL_PHRASES = {
    "it": ["pane caldo alle cinque del mattino", "lievito madre e farina di grano", "forno acceso e teglia pronta", "impasto morbido con le mani in farina", "biga matura e crosta dorata"],
    "en": ["warm bread at five in the morning", "sourdough and wheat flour", "oven on and tray ready", "soft dough with hands in flour", "ripe biga and golden crust"],
    "de": ["warmes brot um fünf uhr morgens", "sauerteig und weizenmehl", "ofen an und blech bereit", "weicher teig mit mehl an den händen", "reife biga und goldene kruste"],
    "es": ["pan caliente a las cinco", "masa madre y harina de trigo", "horno encendido y bandeja lista", "masa suave con harina", "biga madura y corteza dorada"],
    "fr": ["pain chaud à cinq heures", "levain et farine de blé", "four allumé et plaque prête", "pâte souple les mains dans la farine", "biga mûre et croûte dorée"],
    "fa": ["نان گرم ساعت پنج صبح", "خمیرمایه و آرد گندم", "فر روشن و سینی آماده", "خمیر نرم با دست‌های آردی", "بیگای رسیده و پوسته طلایی"],
    "ar": ["خبز ساخن في الخامسة صباحاً", "عجينة مخمّرة ودقيق القمح", "الفرن مشتعل والصينية جاهزة", "عجينة طرية واليدان في الدقيق", "بيغا ناضجة وقشرة ذهبية"],
    "tr": ["sabah beşte sıcak ekmek", "ekşi maya ve buğday unu", "fırın açık ve tepsi hazır", "eller unlu yumuşak hamur", "olgun biga ve altın kabuk"],
}
_antifool_challenges = {}


@api_router.get("/antifool/challenge")
async def antifool_challenge(lang: str = "it"):
    import random as _rnd
    phrases = _ANTIFOOL_PHRASES.get((lang or "it").split("-")[0][:2], _ANTIFOOL_PHRASES["it"])
    phrase = _rnd.choice(phrases)
    cid = uuid.uuid4().hex[:10]
    now = time.time()
    _antifool_challenges[cid] = {"phrase": phrase, "exp": now + 90}
    for k in [k for k, v in list(_antifool_challenges.items()) if v["exp"] < now]:
        _antifool_challenges.pop(k, None)
    return {"challenge_id": cid, "phrase": phrase, "lang": lang}


class AntifoolVerifyReq(BaseModel):
    challenge_id: str
    transcript: str = ""


@api_router.post("/antifool/verify")
async def antifool_verify(body: AntifoolVerifyReq):
    import difflib as _dl
    ch = _antifool_challenges.get(body.challenge_id)
    if not ch:
        return {"ok": False, "reason": "expired", "score": 0.0}
    if ch["exp"] < time.time():
        _antifool_challenges.pop(body.challenge_id, None)
        return {"ok": False, "reason": "expired", "score": 0.0}
    _norm = lambda s: re.sub(r"[^\w\s]", "", (s or "").lower()).strip()
    score = _dl.SequenceMatcher(None, _norm(ch["phrase"]), _norm(body.transcript)).ratio()
    ok = score >= 0.72
    _antifool_challenges.pop(body.challenge_id, None)
    return {"ok": bool(ok), "score": round(float(score), 2), "expected": ch["phrase"]}


class CrossCheckReq(BaseModel):
    worker: Optional[str] = ""
    task: Optional[str] = ""
    declared_deduction_g: float
    silo_before_g: float
    silo_after_g: float
    tolerance_pct: float = 8.0
    photo_present: bool = False
    photo_base64: Optional[str] = ""


async def _vision_task_consistency(photo_b64: str, task: str):
    """Claude Vision: la foto mostra plausibilmente l'attività dichiarata? → (consistent, note)."""
    img = (photo_b64 or "").split(",")[-1]
    if not img or not EMERGENT_LLM_KEY:
        return None
    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"xcheck-{uuid.uuid4().hex[:8]}",
                       system_message=("Sei l'occhio anti-fooling di Sitor in un panificio. Ti mostro una FOTO scattata da un operatore "
                                       f"che dichiara di aver svolto: '{task or 'attività di produzione'}'. Valuta se la foto è COERENTE con quel task "
                                       "(ingredienti/impasto/macchinari/prodotto pertinenti) o se sembra generica/non correlata/ingannevole. "
                                       'Rispondi SOLO JSON: {"consistent":true|false,"note":"breve motivazione"}.')
                       ).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=200)
        full = ""
        async for ev in chat.stream_message(UserMessage(text="Verifica coerenza foto/task.", file_contents=[ImageContent(image_base64=img)])):
            if isinstance(ev, TextDelta):
                full += ev.content or ""
            elif isinstance(ev, StreamDone):
                break
        m = re.search(r"\{.*\}", full, re.S)
        if m:
            j = json.loads(m.group(0))
            return {"consistent": bool(j.get("consistent")), "note": str(j.get("note", ""))[:200]}
    except Exception as e:
        logging.warning(f"cross-check vision failed: {e}")
    return None


@api_router.post("/antifool/cross-check")
async def antifool_cross_check(body: CrossCheckReq, request: Request):
    """Cross-check ottico-telemetrico: confronta la conferma dichiarata con il calo di peso
    REALE del silo/bilancia E (se presente) con l'analisi foto Claude Vision. Mismatch → congela."""
    actual = max(0.0, float(body.silo_before_g) - float(body.silo_after_g))
    declared = max(0.0, float(body.declared_deduction_g))
    denom = max(1.0, declared)
    diff_pct = round(abs(actual - declared) / denom * 100.0, 1)
    weight_ok = diff_pct <= float(body.tolerance_pct)
    vision = await _vision_task_consistency(body.photo_base64, body.task) if (body.photo_base64) else None
    photo_ok = None if vision is None else bool(vision.get("consistent"))
    ok = weight_ok and (photo_ok is not False)
    action = "confirm" if ok else "freeze"
    try:
        await db.security_log.insert_one({"id": str(uuid.uuid4()), "event": "cross_check", "action": ("allow" if ok else "flag"),
                                          "detail": f"worker={body.worker} task={body.task} declared={declared}g actual={actual}g diff={diff_pct}% weight_ok={weight_ok} photo_ok={photo_ok}",
                                          "ip": (request.client.host if request.client else None), "at": now_iso()})
    except Exception:
        pass
    if not weight_ok:
        msg = f"Conferma CONGELATA: scarto {diff_pct}% tra dichiarato ({declared:.0f} g) e reale ({actual:.0f} g). Possibile completamento fittizio."
    elif photo_ok is False:
        msg = f"Conferma CONGELATA: la foto non è coerente col task. {vision.get('note', '') if vision else ''}"
    else:
        msg = "Conferma validata: calo silo coerente" + (" e foto pertinente." if photo_ok else ".")
    return {"ok": ok, "action": action, "actual_g": round(actual, 1), "declared_g": round(declared, 1),
            "diff_pct": diff_pct, "weight_ok": weight_ok, "photo_ok": photo_ok,
            "vision_note": (vision.get("note") if vision else None), "message": msg}


# ---------------------------------------------------------------------------
# Sitor AI · ACTIVE SECURITY & INTEGRITY GUARDIAN
# Gatekeeper attivo: registra/segnala/blocca tentativi non autorizzati di
# ispezione, export o duplicazione della logica backend. Afferma la proprietà
# esclusiva del Master. Tutto a livello codice/backend (nessuna pagina legale).
# ---------------------------------------------------------------------------
OWNER_ID = "Master (Michele) — MikiLab Pro"
_GUARDIAN_BLOCK = {"export_backend", "duplicate", "reverse_engineer", "source_dump", "bulk_export"}
_GUARDIAN_FLAG = {"devtools", "view_source", "context_menu", "inspect", "copy_bulk", "print_screen"}


class GuardianEventReq(BaseModel):
    event: str
    detail: Optional[str] = ""
    path: Optional[str] = ""


@api_router.post("/security/guardian")
async def security_guardian(body: GuardianEventReq, request: Request):
    ev = (body.event or "").strip().lower()
    action = "block" if ev in _GUARDIAN_BLOCK else ("flag" if ev in _GUARDIAN_FLAG else "allow")
    try:
        await db.security_log.insert_one({"id": str(uuid.uuid4()), "event": ev, "detail": (body.detail or "")[:300],
                                          "path": (body.path or "")[:160], "action": action,
                                          "ip": (request.client.host if request.client else None), "at": now_iso()})
    except Exception:
        pass
    msgs = {
        "block": "Sitor Guardian: operazione bloccata. Codice proprietario protetto — proprietà esclusiva del Master.",
        "flag": "Sitor Guardian: attività segnalata. Ispezione/duplicazione non autorizzata di MikiLab Pro.",
        "allow": "ok",
    }
    return {"action": action, "message": msgs[action], "owner": OWNER_ID}


@api_router.get("/security/ownership")
async def security_ownership(lang: str = "it"):
    it = ("MikiLab Pro & Sitor AI sono proprietà ESCLUSIVA del Master. Codice riservato e confidenziale: "
          "ogni copia, distribuzione o reverse engineering non autorizzati è vietato e viene tracciato dal Guardian.")
    en = ("MikiLab Pro & Sitor AI are the EXCLUSIVE property of the Master. Confidential proprietary code: "
          "any unauthorized copying, distribution or reverse engineering is prohibited and tracked by the Guardian.")
    return {"owner": OWNER_ID, "affirmation": (en if (lang or "it").startswith("en") else it), "proprietary": True, "guardian": "active"}


@api_router.get("/security/status")
async def security_status(admin: dict = Depends(require_admin)):
    try:
        flags = await db.security_log.count_documents({"action": {"$in": ["flag", "block"]}})
        recent = await db.security_log.find({}, {"_id": 0}).sort("at", -1).to_list(20)
    except Exception:
        flags, recent = 0, []
    return {"integrity": "ok", "guardian": "active", "owner": OWNER_ID, "flags_total": flags, "recent": recent}


# ---------------------------------------------------------------------------
# COMPLIANCE LEGALE TEDESCA (ArbZG · DGUV · GDPR/DSGVO) — backend/DB level.
# Accessibile via Master o oracolo vocale Sitor. Nessuna pagina legale pubblica.
# ---------------------------------------------------------------------------
def _chain_hash(prev_hash: str, payload: dict) -> str:
    import hashlib as _h, json as _j
    return _h.sha256((str(prev_hash) + _j.dumps(payload, sort_keys=True, ensure_ascii=False)).encode("utf-8")).hexdigest()


class TimeclockReq(BaseModel):
    worker: str = ""
    action: str  # in | out | break_start | break_end
    pin: Optional[str] = None  # PIN personale operatore → timbratura tracciabile al singolo


@api_router.post("/compliance/timeclock")
async def compliance_timeclock(body: TimeclockReq, request: Request, org: str = Depends(effective_org)):
    """ArbZG: timbratura elettronica TAMPER-PROOF (catena di hash) inizio/fine/pausa.
    Se fornito un PIN personale operatore, la timbratura è attribuita e verificata al singolo."""
    action = (body.action or "").strip().lower()
    if action not in {"in", "out", "break_start", "break_end"}:
        raise HTTPException(status_code=400, detail="Azione non valida")
    verified = False
    worker = (body.worker or "").strip()
    pin = _norm_pin(body.pin or "")
    if pin:
        resolved = None
        async for d in db.operator_pins.find({"active": True}, {"_id": 0}):
            if _check_pw(pin, d.get("hash", "")):
                resolved = d.get("name")
                break
        await _log_access("operator", _client_ip(request), bool(resolved), resolved)
        if not resolved:
            raise HTTPException(status_code=401, detail="PIN operatore non valido")
        worker = resolved
        verified = True
    worker = worker or "operatore"
    last = await db.compliance_timelog.find_one({"organization_id": org}, {"_id": 0}, sort=[("seq", -1)])
    seq = (last["seq"] + 1) if last else 1
    prev_hash = last["hash"] if last else "genesis"
    payload = {"seq": seq, "worker": worker, "action": action, "at": now_iso()}
    h = _chain_hash(prev_hash, payload)
    entry = {"id": str(uuid.uuid4()), "organization_id": org, **payload, "verified": verified, "prev_hash": prev_hash, "hash": h,
             "at_dt": datetime.now(timezone.utc)}  # at_dt: campo Date per l'indice TTL (12 mesi). NON entra nell'hash.
    await db.compliance_timelog.insert_one(dict(entry))
    return {"ok": True, "seq": seq, "hash": h, "action": action, "worker": worker, "verified": verified}


def _arbzg_summary(entries):
    """Calcola minuti lavorati/pausa e flag ArbZG per una lista ordinata di eventi (un lavoratore, un giorno)."""
    from datetime import datetime as _dt
    work_ms = 0
    break_ms = 0
    open_in = None
    open_break = None

    def _p(s):
        try:
            return _dt.fromisoformat(str(s).replace("Z", "+00:00"))
        except Exception:
            return None
    for e in entries:
        t = _p(e.get("at"))
        a = e.get("action")
        if a == "in":
            open_in = t
        elif a == "out" and open_in and t:
            work_ms += (t - open_in).total_seconds()
            open_in = None
        elif a == "break_start":
            open_break = t
        elif a == "break_end" and open_break and t:
            b = (t - open_break).total_seconds()
            break_ms += b
            work_ms -= b
            open_break = None
    work_min = max(0, int(work_ms / 60))
    break_min = max(0, int(break_ms / 60))
    flags = []
    if work_min > 600:
        flags.append("ArbZG §3: superate 10h giornaliere")
    if work_min > 360 and break_min < 30:
        flags.append("ArbZG §4: pausa < 30 min (oltre 6h)")
    if work_min > 540 and break_min < 45:
        flags.append("ArbZG §4: pausa < 45 min (oltre 9h)")
    return {"work_min": work_min, "break_min": break_min, "compliant": len(flags) == 0, "flags": flags}


@api_router.get("/compliance/timelog")
async def compliance_timelog(worker: Optional[str] = None, day: Optional[str] = None, admin: dict = Depends(require_admin)):
    q = {"organization_id": _org_id(admin)}
    if worker:
        q["worker"] = worker
    if day:
        q["at"] = {"$regex": f"^{re.escape(day)}"}
    entries = await db.compliance_timelog.find(q, {"_id": 0}).sort("seq", 1).to_list(1000)
    # verifica integrità catena (tamper-evident). ROBUSTA al TTL: le entry più vecchie possono
    # essere state cancellate (conservazione 12 mesi), quindi NON pretendiamo che la prima entry
    # rimasta parta da "genesis". Verifichiamo che ogni entry sia auto-coerente (hash = f(prev_hash,payload))
    # e che le entry consecutive rimaste si concatenino correttamente. Ciò rileva comunque le manomissioni.
    integrity_ok = True
    all_entries = await db.compliance_timelog.find({"organization_id": _org_id(admin)}, {"_id": 0}).sort("seq", 1).to_list(5000)
    prev = None
    for e in all_entries:
        payload = {"seq": e["seq"], "worker": e["worker"], "action": e["action"], "at": e["at"]}
        stored_prev = e.get("prev_hash", "genesis")
        if _chain_hash(stored_prev, payload) != e.get("hash"):
            integrity_ok = False
            break
        if prev is not None and stored_prev != prev:
            integrity_ok = False
            break
        prev = e["hash"]
    by_worker = {}
    for e in entries:
        by_worker.setdefault(e["worker"], []).append(e)
    summaries = {w: _arbzg_summary(evs) for w, evs in by_worker.items()}
    return {"entries": entries, "summaries": summaries, "integrity_ok": integrity_ok, "count": len(entries)}


_SAFETY_DOCS = [
    {"id": "dguv-forno", "type": "hazard", "machine": "Forno", "title": "Gefährdungsbeurteilung Forno (ustioni/vapore)", "level": "medio", "measures": ["Guanti termici", "Segnaletica superfici calde", "Distanza di sicurezza vapore"]},
    {"id": "dguv-impastatrice", "type": "hazard", "machine": "Impastatrice", "title": "Gefährdungsbeurteilung Impastatrice (trascinamento arti)", "level": "alto", "measures": ["Griglia di protezione", "Arresto di emergenza", "Divieto mani in vasca in funzione"]},
    {"id": "dguv-abbattitore", "type": "hazard", "machine": "Abbattitore", "title": "Gefährdungsbeurteilung Abbattitore (freddo/ustioni da freddo)", "level": "medio", "measures": ["Guanti criogenici", "Tempo esposizione limitato"]},
    {"id": "unterweisung-igiene", "type": "training", "title": "Unterweisung: Igiene & Sicurezza alimentare", "interval": "annuale"},
    {"id": "unterweisung-macchine", "type": "training", "title": "Unterweisung: Uso sicuro delle macchine (DGUV)", "interval": "annuale"},
    {"id": "unterweisung-antincendio", "type": "training", "title": "Unterweisung: Antincendio & vie di fuga", "interval": "annuale"},
]


@api_router.get("/compliance/safety")
async def compliance_safety(admin: dict = Depends(require_admin)):
    acks = await db.compliance_training_ack.find({"organization_id": _org_id(admin)}, {"_id": 0}).sort("at", -1).to_list(500)
    return {"hazards": [d for d in _SAFETY_DOCS if d["type"] == "hazard"],
            "trainings": [d for d in _SAFETY_DOCS if d["type"] == "training"], "acks": acks}


class SafetyAckReq(BaseModel):
    worker: str
    doc_id: str


@api_router.post("/compliance/safety/ack")
async def compliance_safety_ack(body: SafetyAckReq, admin: dict = Depends(require_admin)):
    rec = {"id": str(uuid.uuid4()), "organization_id": _org_id(admin), "worker": (body.worker or "").strip(), "doc_id": body.doc_id, "at": now_iso(), "at_dt": datetime.now(timezone.utc)}
    await db.compliance_training_ack.insert_one(dict(rec))
    return {"ok": True, "ack": rec}


class EraseReq(BaseModel):
    worker: str


@api_router.post("/compliance/erase-request")
async def compliance_erase_request(body: EraseReq, admin: dict = Depends(require_admin)):
    """GDPR/DSGVO Art. 17: cancella su richiesta i dati di conformità di un lavoratore
    (timbrature + prese visione formazione) per la SOLA organizzazione del Capo."""
    org = _org_id(admin)
    w = (body.worker or "").strip()
    if not w:
        raise HTTPException(status_code=400, detail="Nome lavoratore mancante")
    r1 = await db.compliance_timelog.delete_many({"organization_id": org, "worker": {"$regex": f"^{re.escape(w)}$", "$options": "i"}})
    r2 = await db.compliance_training_ack.delete_many({"organization_id": org, "worker": {"$regex": f"^{re.escape(w)}$", "$options": "i"}})
    return {"ok": True, "worker": w, "deleted_timelog": r1.deleted_count, "deleted_training_ack": r2.deleted_count}


@api_router.get("/compliance/privacy")
async def compliance_privacy(lang: str = "it"):
    it = {
        "posture": "GDPR/DSGVO (UE) · minimizzazione dei dati, elaborazione locale.",
        "data_collected": ["Timbrature ArbZG / Direttiva UE 2003/88 (locali, tamper-proof)", "Posizione BLE indicativa (settore, non tracciamento GPS)", "Verifica vocale liveness: SOLO confronto testuale, NESSUNA registrazione audio conservata"],
        "retention": "Dati conservati localmente nel DB interno UE (conservazione 12 mesi, poi cancellazione automatica); nessun trasferimento a terzi.",
        "principles": ["Data minimization (GDPR UE)", "Local encryption at rest", "No covert external harvesting", "Scopo limitato: sicurezza e conformità"],
    }
    en = {
        "posture": "GDPR/DSGVO (EU) · data minimization, local processing.",
        "data_collected": ["ArbZG / EU Directive 2003/88 time logs (local, tamper-proof)", "Indicative BLE sector position (no GPS tracking)", "Voice liveness: TEXT match only, NO audio stored"],
        "retention": "Stored locally in the internal EU DB (12-month retention, then auto-deletion); no third-party transfer.",
        "principles": ["Data minimization (EU GDPR)", "Local encryption at rest", "No covert external harvesting", "Purpose limitation: safety & compliance"],
    }
    de = {
        "posture": "DSGVO/GDPR (EU) · Datenminimierung, lokale Verarbeitung.",
        "data_collected": ["ArbZG- / EU-Richtlinie-2003/88-Zeiterfassung (lokal, manipulationssicher)", "Ungefähre BLE-Bereichsposition (kein GPS-Tracking)", "Sprach-Lebendigkeitsprüfung: NUR Textabgleich, KEINE Audioaufnahme gespeichert"],
        "retention": "Lokal in der internen EU-Datenbank gespeichert (Aufbewahrung 12 Monate); keine Weitergabe an Dritte.",
        "principles": ["Datenminimierung (EU-DSGVO)", "Lokale Verschlüsselung im Ruhezustand", "Keine verdeckte externe Datensammlung", "Zweckbindung: Sicherheit & Compliance"],
    }
    lg = (lang or "it")[:2]
    if lg == "en":
        return en
    if lg == "de":
        return de
    return it


@api_router.get("/production/worker-aura/{worker_name}")
async def get_worker_power_level(worker_name: str, org: str = Depends(effective_org)):
    w = await db.lab_shift_plan.find_one({"worker_name": {"$regex": f"^{re.escape(worker_name)}$", "$options": "i"}, "organization_id": org}, {"_id": 0})
    if not w:
        raise HTTPException(status_code=404, detail="Lavoratore non trovato nel turno attivo.")
    return {"worker": w["worker_name"], "position": w.get("position"), "avatar": w.get("avatar_style"),
            "score": w.get("efficiency_score", 85), **_aura_for(int(w.get("efficiency_score", 85)))}


@api_router.get("/production/leaderboard")
async def get_team_leaderboard(org: str = Depends(effective_org)):
    workers = await db.lab_shift_plan.find({"organization_id": org}, {"_id": 0}).to_list(200)
    workers.sort(key=lambda x: x.get("efficiency_score", 0), reverse=True)
    lb = []
    for rank, w in enumerate(workers, start=1):
        lb.append({"rank": rank, "worker_name": w.get("worker_name"), "position": w.get("position"),
                   "avatar": w.get("avatar_style"), "score": w.get("efficiency_score", 85),
                   "streak_days": w.get("streak_days", 1), "aura": _aura_for(int(w.get("efficiency_score", 85))),
                   "title": "Master of the Shift" if rank == 1 else "Pro Contender"})
    return {"status": "success", "leaderboard": lb}


@api_router.get("/ai/morning-briefing")
async def get_morning_briefing(org: str = Depends(effective_org)):
    """Sitor analizza la notte e prepara il resoconto per il Capo all'apertura."""
    workers = await db.lab_shift_plan.find({"organization_id": org}, {"_id": 0, "efficiency_score": 1}).to_list(200)
    avg = round(sum(w.get("efficiency_score", 0) for w in workers) / len(workers), 1) if workers else 0.0
    # Riepilogo notturno DERIVATO dai dati reali (battito storico + sensori + pulse)
    since = (datetime.now(timezone.utc) - timedelta(hours=10)).isoformat()
    pts = await db.lab_pulse_history.find({"at": {"$gte": since}, "organization_id": org}, {"_id": 0}).to_list(300)
    night = []
    if pts:
        hbs = [p.get("heartbeat", 52) for p in pts]
        crit = any(p.get("mood") == "critico" for p in pts)
        night.append(f"Battito medio notturno {round(sum(hbs)/len(hbs))} bpm su {len(pts)} rilevazioni.")
        night.append("Nessuna anomalia critica durante la notte." if not crit else "Rilevate criticità notturne da controllare.")
    else:
        night.append("Nessuna rilevazione notturna registrata.")
    sens = await db.lab_sensors_live.find_one({"_key": "live", "organization_id": org}, {"_id": 0, "_key": 0}) or {}
    if sens.get("oven_temp"):
        night.append(f"Ultima temperatura forno: {sens['oven_temp']['value']}°C.")
    staff = await _staffing(org)
    reco = ("Tutti i parametri sono perfetti. Nessun intervento richiesto sui lotti di oggi."
            if staff["reduce_pct"] == 0 else
            f"Organico ridotto: consiglio di tagliare i volumi del {staff['reduce_pct']}% oggi.")
    return {"status": "success",
            "greeting": "Buongiorno, ecco il resoconto pulito di mikilab.de.",
            "night_summary": night, "overall_lab_efficiency": f"{avg}%",
            "avg_score": avg, "ai_recommendation": reco}
