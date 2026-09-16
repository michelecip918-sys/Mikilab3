# ruff: noqa: F821  (i nomi sono iniettati a runtime dal core via lo shim globals().update)
"""MikiLab Pro — Coordinamento Automatico del Team.

Copertura reparti in tempo reale SENZA bisogno del comando vocale del Capo:
- abilitazioni MULTI-REPARTO per operatore (operator_skills)
- stato libero/occupato persistente (riusa worker_states del core)
- trigger automatico che sceglie un operatore libero e abilitato per il reparto
- chiamata via cuffie con conferma/diniego a voce e passaggio automatico al prossimo
- decisione macchina vs operatore su soglia quantità configurabile
- doppia modalità Capo presente (proposta) / Capo assente (decisione autonoma + registro)
- avviso al Capo se un task resta scoperto troppo a lungo
- misurazione oggettiva dei tempi per task nel report di fine turno (organizzazione, non sorveglianza)

Tutto isolato per organization_id. Le rotte sono registrate sullo stesso `api_router` del core.
"""
import server as _core
globals().update({k: v for k, v in vars(_core).items() if not k.startswith("__")})

DEFAULT_TIMEOUT_SEC = 30
DEFAULT_MACHINE_KG = 25.0
DEFAULT_MACHINE_PIECES = 30
DEFAULT_UNCOVERED_SEC = 120
CAPO_AUTO_ABSENT_MIN = 5  # se il Capo non dà segni di vita da 5 min → considerato assente (fallback)


# ============================ IMPOSTAZIONI COORDINAMENTO ============================

def _parse_iso(s):
    try:
        return datetime.fromisoformat(str(s).replace("Z", "+00:00"))
    except Exception:
        return None


async def _coord_settings(org: str) -> dict:
    doc = await db.coordination_settings.find_one({"organization_id": org}, {"_id": 0})
    if not doc:
        doc = {}
    return {
        "organization_id": org,
        "capo_present_manual": doc.get("capo_present_manual", None),  # None = automatico
        "machine_threshold_kg": float(doc.get("machine_threshold_kg", DEFAULT_MACHINE_KG)),
        "machine_threshold_pieces": int(doc.get("machine_threshold_pieces", DEFAULT_MACHINE_PIECES)),
        "response_timeout_sec": int(doc.get("response_timeout_sec", DEFAULT_TIMEOUT_SEC)),
        "uncovered_alert_sec": int(doc.get("uncovered_alert_sec", DEFAULT_UNCOVERED_SEC)),
        "voice_daily_limit": int(doc.get("voice_daily_limit", 0)),  # 0 = illimitato
        "capo_last_seen": doc.get("capo_last_seen"),
    }


def _capo_present(settings: dict) -> bool:
    """Presenza EFFETTIVA del Capo: interruttore manuale se impostato, altrimenti automatico
    in base all'ultima attività del Capo (fallback)."""
    manual = settings.get("capo_present_manual")
    if manual is not None:
        return bool(manual)
    seen = _parse_iso(settings.get("capo_last_seen"))
    if not seen:
        return False
    return (datetime.now(timezone.utc) - seen).total_seconds() <= CAPO_AUTO_ABSENT_MIN * 60


@api_router.get("/coordination/settings")
async def get_coord_settings(org: str = Depends(effective_org)):
    s = await _coord_settings(org)
    s["capo_present_effective"] = _capo_present(s)
    return s


class CoordSettingsReq(BaseModel):
    capo_present_manual: Optional[bool] = None  # None = torna in automatico
    auto_mode: Optional[bool] = None            # se True → azzera l'interruttore manuale
    machine_threshold_kg: Optional[float] = Field(None, ge=0, le=100000)
    machine_threshold_pieces: Optional[int] = Field(None, ge=0, le=1000000)
    response_timeout_sec: Optional[int] = Field(None, ge=5, le=300)
    uncovered_alert_sec: Optional[int] = Field(None, ge=15, le=3600)
    voice_daily_limit: Optional[int] = Field(None, ge=0, le=1000)


@api_router.put("/coordination/settings")
async def set_coord_settings(body: CoordSettingsReq, user: dict = Depends(require_admin)):
    org = _org_id(user)
    upd = {"organization_id": org, "updated_at": now_iso()}
    if body.auto_mode is True:
        upd["capo_present_manual"] = None
    elif body.capo_present_manual is not None:
        upd["capo_present_manual"] = bool(body.capo_present_manual)
    if body.machine_threshold_kg is not None:
        upd["machine_threshold_kg"] = float(body.machine_threshold_kg)
    if body.machine_threshold_pieces is not None:
        upd["machine_threshold_pieces"] = int(body.machine_threshold_pieces)
    if body.response_timeout_sec is not None:
        upd["response_timeout_sec"] = int(body.response_timeout_sec)
    if body.uncovered_alert_sec is not None:
        upd["uncovered_alert_sec"] = int(body.uncovered_alert_sec)
    if body.voice_daily_limit is not None:
        upd["voice_daily_limit"] = int(body.voice_daily_limit)
    await db.coordination_settings.update_one({"organization_id": org}, {"$set": upd}, upsert=True)
    s = await _coord_settings(org)
    s["capo_present_effective"] = _capo_present(s)
    return s


@api_router.post("/coordination/capo/heartbeat")
async def capo_heartbeat(user: dict = Depends(require_admin)):
    """Segnale di presenza del Capo (chiamato dalla console mentre è attivo)."""
    org = _org_id(user)
    await db.coordination_settings.update_one(
        {"organization_id": org}, {"$set": {"organization_id": org, "capo_last_seen": now_iso()}}, upsert=True)
    s = await _coord_settings(org)
    return {"ok": True, "capo_present_effective": _capo_present(s)}


# --- Limite giornaliero di richieste vocali per operatore (configurabile dal Capo) ---
@api_router.post("/coordination/voice-quota")
async def voice_quota(body: dict, org: str = Depends(effective_org)):
    """Conteggia UNA richiesta vocale dell'operatore e dice se è ancora entro il limite.
    Superato il limite giornaliero, Sitor risponde solo a eventi critici (allowed=False)."""
    operator = (body.get("operator") or "").strip()
    critical = bool(body.get("critical"))
    s = await _coord_settings(org)
    limit = int(s.get("voice_daily_limit") or 0)
    day = now_iso()[:10]
    key = {"organization_id": org, "operator": operator.lower(), "day": day}
    doc = await db.voice_usage.find_one(key) or {"count": 0}
    used = int(doc.get("count") or 0)
    if critical or limit <= 0:  # eventi critici o nessun limite → sempre concesso
        await db.voice_usage.update_one(key, {"$set": {**key, "updated_at": now_iso()}, "$inc": {"count": 1}}, upsert=True)
        return {"allowed": True, "used": used + 1, "limit": limit, "reason": "critical" if critical else "unlimited"}
    if used >= limit:
        return {"allowed": False, "used": used, "limit": limit, "reason": "limit_reached"}
    await db.voice_usage.update_one(key, {"$set": {**key, "updated_at": now_iso()}, "$inc": {"count": 1}}, upsert=True)
    return {"allowed": True, "used": used + 1, "limit": limit, "reason": "ok"}


# ============================ ABILITAZIONI MULTI-REPARTO ============================

async def _skills_map(org: str) -> dict:
    docs = await db.operator_skills.find({"organization_id": org}, {"_id": 0}).to_list(500)
    return {(d.get("name") or "").lower(): d for d in docs}


@api_router.get("/operators/skills")
async def list_operator_skills(org: str = Depends(effective_org)):
    """Elenco operatori (dal piano turni) con i reparti su cui sono abilitati e il flag autista."""
    pool = await _worker_pool(org)
    skills = await _skills_map(org)
    depts = [{"key": k, "name": v["name"]} for k, v in DEPARTMENTS.items()]
    rows = []
    seen = set()
    for w in pool:
        sk = skills.get(w["name"].lower(), {})
        rows.append({
            "name": w["name"], "position": w.get("position") or "",
            "departments": sk.get("departments") or [],
            "is_driver": bool(sk.get("is_driver")),
            "status": w.get("status", "free"),
        })
        seen.add(w["name"].lower())
    # operatori con abilitazioni ma non nel pool corrente
    for k, sk in skills.items():
        if k in seen:
            continue
        rows.append({"name": sk.get("name"), "position": "", "departments": sk.get("departments") or [],
                     "is_driver": bool(sk.get("is_driver")), "status": "free"})
    return {"operators": rows, "departments": depts}


class OperatorSkillsReq(BaseModel):
    name: str = Field(..., max_length=60)
    departments: List[str] = []
    is_driver: bool = False


@api_router.put("/operators/skills")
async def set_operator_skills(body: OperatorSkillsReq, user: dict = Depends(require_admin)):
    org = _org_id(user)
    name = (body.name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Operatore mancante")
    valid = set(DEPARTMENTS.keys())
    depts = [d for d in (body.departments or []) if d in valid]
    await db.operator_skills.update_one(
        {"organization_id": org, "name": name},
        {"$set": {"organization_id": org, "name": name, "departments": depts,
                  "is_driver": bool(body.is_driver), "updated_at": now_iso()}},
        upsert=True,
    )
    return {"ok": True, "name": name, "departments": depts, "is_driver": bool(body.is_driver)}


# ============================ MOTORE DI COORDINAMENTO ============================

async def _eligible_queue(org: str, dept: str) -> list:
    """Coda di operatori LIBERI e ABILITATI per il reparto, ordinati per efficienza.
    Fallback: se nessuno ha abilitazioni impostate, usa gli operatori la cui posizione
    combacia con il reparto."""
    pool = await _worker_pool(org)
    skills = await _skills_map(org)
    dept_name = (DEPARTMENTS.get(dept, {}) or {}).get("name", dept).lower()
    q = []
    for w in pool:
        if w.get("status", "free") == "busy" or w.get("locked_by_capo"):
            continue
        sk = skills.get(w["name"].lower())
        ok = False
        if sk and (sk.get("departments") or []):
            ok = dept in (sk.get("departments") or [])
        else:
            pos = (w.get("position") or "").lower()
            ok = bool(pos) and (dept in pos or dept_name in pos)
        if ok:
            q.append(w["name"])
    return q


async def _available_machine(org: str, dept: str) -> Optional[dict]:
    """Prima macchina 'libera' (spenta e non in manutenzione) del reparto."""
    if dept not in DEPARTMENTS:
        return None
    doc = await db.dept_machines.find_one({"dept": dept, "organization_id": org}, {"_id": 0})
    for m in _dept_machines_merged(dept, doc):
        if m.get("status") == "spenta":
            return m
    return None


def _machine_preferred(settings: dict, qty, qty_unit) -> bool:
    if qty is None:
        return False
    try:
        q = float(qty)
    except Exception:
        return False
    unit = (qty_unit or "").lower()
    if unit in ("pz", "pezzi", "pieces", "pc"):
        return q > settings["machine_threshold_pieces"]
    # default: chilogrammi
    return q > settings["machine_threshold_kg"]


async def _log_decision(org: str, **fields):
    doc = {"id": str(uuid.uuid4()), "organization_id": org, "at": now_iso(), **fields}
    await db.coordination_log.insert_one(dict(doc))
    doc.pop("_id", None)
    return doc


async def _start_pending(call: dict, settings: dict):
    """Imposta la chiamata sul candidato corrente e la finestra di risposta."""
    idx = call["idx"]
    op = call["queue"][idx]
    call["current_operator"] = op
    call["status"] = "pending"
    call["expires_at"] = (datetime.now(timezone.utc) + timedelta(seconds=settings["response_timeout_sec"])).isoformat()
    call.setdefault("decisions", []).append({"operator": op, "action": "offered", "at": now_iso()})
    return call


async def _advance_or_close(call: dict, settings: dict, org: str):
    """Passa al prossimo candidato; se esauriti → task SCOPERTO (avvisa il Capo)."""
    call["idx"] += 1
    if call["idx"] < len(call["queue"]):
        await _start_pending(call, settings)
    else:
        call["status"] = "uncovered"
        call["current_operator"] = None
        call["uncovered_at"] = now_iso()
        await _log_decision(org, kind="uncovered", dept=call["dept"], task_desc=call["task_desc"],
                            call_id=call["id"], detail="Nessun operatore disponibile o tutti hanno rifiutato")
        await _notify_capo_uncovered(org, call)
    return call


async def _notify_capo_uncovered(org: str, call: dict):
    """Avviso chiaro al Capo che un task è rimasto scoperto (riusa il sistema notifiche team)."""
    try:
        await db.team_notifications.insert_one({
            "id": str(uuid.uuid4()), "organization_id": org, "kind": "uncovered",
            "title": "Task scoperto", "dept": call["dept"],
            "text": f"Nessun operatore per «{call['task_desc']}» ({DEPARTMENTS.get(call['dept'],{}).get('name', call['dept'])}). Serve il tuo intervento.",
            "call_id": call["id"], "read": False, "at": now_iso(),
        })
    except Exception:
        pass


async def _persist_call(call: dict):
    await db.coordination_calls.update_one({"id": call["id"]}, {"$set": {k: v for k, v in call.items() if k != "_id"}}, upsert=True)


async def _accept_call(call: dict, org: str):
    """L'operatore accetta: diventa OCCUPATO sul task e la chiamata si chiude."""
    op = call["current_operator"]
    call["status"] = "accepted"
    call["resolved"] = {"type": "operator", "ref": op}
    call.setdefault("decisions", []).append({"operator": op, "action": "accepted", "at": now_iso()})
    await _set_worker_state(org, op, status="busy", dept=call["dept"], task=call["task_desc"],
                            task_id=call.get("task_id"), step_order=call.get("step_order"),
                            eta_min=call.get("eta_min"))
    await _log_decision(org, kind="assigned_operator", dept=call["dept"], task_desc=call["task_desc"],
                        operator=op, call_id=call["id"],
                        capo_present=call.get("capo_present_at_trigger"), auto=not call.get("capo_present_at_trigger"))
    return call


class TriggerReq(BaseModel):
    dept: str = Field(..., max_length=40)
    task_desc: str = Field(..., max_length=200)
    qty: Optional[float] = None
    qty_unit: Optional[str] = "kg"
    task_id: Optional[str] = None
    step_order: Optional[int] = None
    eta_min: Optional[int] = None
    source: Optional[str] = "evento"  # es. piano/silos/macchina


async def _do_coordination_trigger(body: TriggerReq, org: str):
    """Logica CORE del coordinamento: evento di produzione che richiede personale.
    Sceglie da solo macchina o operatore e registra la chiamata. Condivisa tra
    l'endpoint /coordination/trigger e il dispatch del piano (autoplan_dispatch).
    Capo PRESENTE → proposta da confermare. Capo ASSENTE → chiama subito il primo libero."""
    settings = await _coord_settings(org)
    dept = body.dept
    now = now_iso()
    # 1) Macchina vs operatore
    if _machine_preferred(settings, body.qty, body.qty_unit):
        machine = await _available_machine(org, dept)
        if machine:
            call = {
                "id": str(uuid.uuid4()), "organization_id": org, "dept": dept,
                "task_desc": body.task_desc, "task_id": body.task_id, "step_order": body.step_order,
                "qty": body.qty, "qty_unit": body.qty_unit, "eta_min": body.eta_min,
                "queue": [], "idx": 0, "current_operator": None,
                "status": "machine", "created_at": now, "source": body.source,
                "capo_present_at_trigger": _capo_present(settings),
                "resolved": {"type": "machine", "ref": machine["id"], "name": machine["name"]},
                "decisions": [],
            }
            await _persist_call(call)
            await _log_decision(org, kind="assigned_machine", dept=dept, task_desc=body.task_desc,
                                machine=machine["name"], call_id=call["id"], qty=body.qty, qty_unit=body.qty_unit)
            return {"resolved": "machine", "machine": machine, "call": _public_call(call)}
    # 2) Operatore: costruisci la coda dei liberi + abilitati
    queue = await _eligible_queue(org, dept)
    capo_present = _capo_present(settings)
    call = {
        "id": str(uuid.uuid4()), "organization_id": org, "dept": dept,
        "task_desc": body.task_desc, "task_id": body.task_id, "step_order": body.step_order,
        "qty": body.qty, "qty_unit": body.qty_unit, "eta_min": body.eta_min,
        "queue": queue, "idx": 0, "current_operator": None,
        "created_at": now, "source": body.source, "capo_present_at_trigger": capo_present,
        "decisions": [],
    }
    if not queue:
        call["status"] = "uncovered"
        call["uncovered_at"] = now
        await _persist_call(call)
        await _log_decision(org, kind="uncovered", dept=dept, task_desc=body.task_desc, call_id=call["id"],
                            detail="Nessun operatore libero e abilitato per il reparto")
        await _notify_capo_uncovered(org, call)
        return {"resolved": "uncovered", "call": _public_call(call)}
    if capo_present:
        # PROPOSTA: il Capo conferma o cambia prima che parta.
        call["status"] = "proposed"
        call["proposed_operator"] = queue[0]
        await _persist_call(call)
        return {"resolved": "proposed", "call": _public_call(call)}
    # Capo ASSENTE → chiama subito il primo libero (decisione autonoma).
    await _start_pending(call, settings)
    await _persist_call(call)
    return {"resolved": "pending", "call": _public_call(call)}


@api_router.post("/coordination/trigger")
async def coordination_trigger(body: TriggerReq, org: str = Depends(effective_org)):
    """Endpoint HTTP: evento di produzione che richiede personale. Delega alla logica core."""
    return await _do_coordination_trigger(body, org)


def _public_call(call: dict) -> dict:
    return {k: v for k, v in call.items() if k != "_id"}


async def _refresh_timeouts(org: str):
    """Fa scadere le chiamate pendenti oltre la finestra e passa al prossimo candidato."""
    settings = await _coord_settings(org)
    now = datetime.now(timezone.utc)
    pend = await db.coordination_calls.find({"organization_id": org, "status": "pending"}, {"_id": 0}).to_list(200)
    for call in pend:
        exp = _parse_iso(call.get("expires_at"))
        if exp and now > exp:
            op = call.get("current_operator")
            call.setdefault("decisions", []).append({"operator": op, "action": "timeout", "at": now_iso()})
            await _advance_or_close(call, settings, org)
            await _persist_call(call)


@api_router.get("/coordination/calls/pending")
async def pending_call_for_operator(operator: str, org: str = Depends(effective_org)):
    """Polling dalle cuffie: la chiamata attualmente indirizzata a QUESTO operatore (se c'è)."""
    await _refresh_timeouts(org)
    op = (operator or "").strip().lower()
    call = await db.coordination_calls.find_one(
        {"organization_id": org, "status": "pending"}, {"_id": 0}, sort=[("created_at", 1)])
    if call and (call.get("current_operator") or "").lower() == op:
        dept_name = DEPARTMENTS.get(call["dept"], {}).get("name", call["dept"])
        spoken = f"{call['current_operator']}, puoi occuparti di {call['task_desc']} in {dept_name}?"
        return {"has_call": True, "call": _public_call(call), "spoken": spoken}
    return {"has_call": False}


class RespondReq(BaseModel):
    answer: str = Field(..., max_length=10)  # "yes"/"si"/"no"
    operator: Optional[str] = None


@api_router.post("/coordination/calls/{call_id}/respond")
async def respond_call(call_id: str, body: RespondReq, org: str = Depends(effective_org)):
    """Risposta a voce dell'operatore: sì → occupato sul task; no/timeout → prossimo libero."""
    settings = await _coord_settings(org)
    call = await db.coordination_calls.find_one({"id": call_id, "organization_id": org}, {"_id": 0})
    if not call:
        raise HTTPException(status_code=404, detail="Chiamata non trovata")
    if call.get("status") != "pending":
        return {"ok": True, "status": call.get("status"), "call": _public_call(call)}
    # verifica che risponda l'operatore chiamato (se indicato)
    if body.operator and (body.operator.strip().lower() != (call.get("current_operator") or "").lower()):
        raise HTTPException(status_code=409, detail="Non è il tuo turno di risposta")
    ans = (body.answer or "").strip().lower()
    yes = ans in ("yes", "si", "sì", "y", "ok", "accetto", "va bene", "certo")
    if yes:
        await _accept_call(call, org)
    else:
        op = call.get("current_operator")
        call.setdefault("decisions", []).append({"operator": op, "action": "declined", "at": now_iso()})
        await _advance_or_close(call, settings, org)
    await _persist_call(call)
    return {"ok": True, "status": call["status"], "call": _public_call(call)}


# ============================ VISTA CAPO: PROPOSTE / ATTIVE / REGISTRO ============================

@api_router.post("/coordination/proposals/{call_id}/confirm")
async def confirm_proposal(call_id: str, user: dict = Depends(require_admin)):
    """Il Capo conferma la proposta con un tocco → parte la chiamata all'operatore proposto."""
    org = _org_id(user)
    settings = await _coord_settings(org)
    call = await db.coordination_calls.find_one({"id": call_id, "organization_id": org}, {"_id": 0})
    if not call or call.get("status") != "proposed":
        raise HTTPException(status_code=404, detail="Proposta non disponibile")
    # metti il proposto in cima alla coda
    prop = call.get("proposed_operator")
    if prop and prop in call["queue"]:
        call["queue"].remove(prop)
    call["queue"].insert(0, prop)
    call["idx"] = 0
    await _start_pending(call, settings)
    await _persist_call(call)
    return {"ok": True, "call": _public_call(call)}


class ChangeReq(BaseModel):
    operator: str = Field(..., max_length=60)


@api_router.post("/coordination/proposals/{call_id}/change")
async def change_proposal(call_id: str, body: ChangeReq, user: dict = Depends(require_admin)):
    """Il Capo cambia manualmente l'operatore prima che parta la chiamata."""
    org = _org_id(user)
    settings = await _coord_settings(org)
    call = await db.coordination_calls.find_one({"id": call_id, "organization_id": org}, {"_id": 0})
    if not call or call.get("status") != "proposed":
        raise HTTPException(status_code=404, detail="Proposta non disponibile")
    op = (body.operator or "").strip()
    if not op:
        raise HTTPException(status_code=400, detail="Operatore mancante")
    q = [op] + [x for x in call["queue"] if x.lower() != op.lower()]
    call["queue"] = q
    call["idx"] = 0
    call["proposed_operator"] = op
    await _start_pending(call, settings)
    await _persist_call(call)
    return {"ok": True, "call": _public_call(call)}


@api_router.get("/coordination/active")
async def coordination_active(org: str = Depends(effective_org)):
    """Cruscotto Capo: proposte in attesa, chiamate pendenti e task scoperti."""
    await _refresh_timeouts(org)
    docs = await db.coordination_calls.find(
        {"organization_id": org, "status": {"$in": ["proposed", "pending", "uncovered"]}},
        {"_id": 0}).sort("created_at", -1).to_list(200)
    settings = await _coord_settings(org)
    return {"calls": docs, "capo_present_effective": _capo_present(settings)}


@api_router.get("/coordination/log")
async def coordination_log(org: str = Depends(effective_org)):
    """Registro chiaro di tutte le decisioni prese (utile al Capo quando torna)."""
    docs = await db.coordination_log.find({"organization_id": org}, {"_id": 0}).sort("at", -1).to_list(300)
    return {"decisions": docs}


@api_router.get("/coordination/task-times")
async def coordination_task_times(org: str = Depends(effective_org)):
    """Misurazione OGGETTIVA dei tempi per task (organizzazione, non sorveglianza individuale).
    Ricava la durata dai task del team con inizio/fine registrati."""
    tasks = await db.team_tasks.find({"organization_id": org}, {"_id": 0}).sort("created_at", -1).to_list(300)
    rows = []
    for t in tasks:
        started = _parse_iso(t.get("started_at") or t.get("created_at"))
        ended = _parse_iso(t.get("closed_at"))
        dur = None
        if started and ended:
            dur = int(round((ended - started).total_seconds() / 60.0))
        rows.append({"title": t.get("title"), "dept": t.get("dept"),
                     "started_at": t.get("started_at") or t.get("created_at"),
                     "closed_at": t.get("closed_at"), "duration_min": dur,
                     "status": t.get("status")})
    done = [r for r in rows if r["duration_min"] is not None]
    avg = int(round(sum(r["duration_min"] for r in done) / len(done))) if done else None
    return {"tasks": rows, "avg_min": avg, "measured": len(done)}


# ============================ VISTA AUTISTA (Punto 3) ============================
# Sfrutta lo schema consegne del core (deliveries: date, organization_id, client, address,
# deadline HH:MM, van, items[{product,qty}]) e l'organizzatore giro esistente (/deliveries/organize).
# Qui aggiungiamo una vista SEMPLICE per l'autista: solo le tappe di oggi, ordinate per orario,
# con indirizzo e cosa consegnare, più lo stato consegnato. Nessuna burocrazia.

def _time_key(t):
    v = _hhmm_to_min(t)
    return v if v is not None else 9999


async def _plan_ready_map(org: str):
    """Orari di 'pronto' dei prodotti dal piano di oggi (start + durata)."""
    day_key = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"][datetime.now(timezone.utc).weekday()]
    ready = {}
    wp = await db.weekly_plan.find_one({"organization_id": org}, {"_id": 0}) or {}
    for b in (((wp.get("days") or {}).get(day_key) or {}).get("batches") or []):
        nm = (b.get("product") or "").strip().lower()
        st = _hhmm_to_min(b.get("start"))
        if nm and st is not None:
            ready[nm] = max(ready.get(nm, 0), st + int(b.get("duration_min") or 60))
    return ready


def _stop_not_ready(stop, ready_map):
    dl = _hhmm_to_min(stop.get("deadline"))
    for it in (stop.get("items") or []):
        nm = (it.get("product") or "").strip().lower()
        r = ready_map.get(nm)
        if r is None:
            return True  # non pianificato → verifica
        if dl is not None and r > dl:
            return True  # pronto dopo la consegna
    return False


@api_router.get("/delivery/run")
async def delivery_run(org: str = Depends(effective_org)):
    """Vista autista: SOLO le tappe di oggi con orario, indirizzo, cliente e cosa consegnare.
    Ordine per orario di consegna. Avvisa se un ordine non sarà pronto in tempo."""
    today = now_iso()[:10]
    stops = await db.deliveries.find({"organization_id": org, "date": today}, {"_id": 0}).to_list(300)
    stops.sort(key=lambda d: _time_key(d.get("deadline")))
    ready_map = await _plan_ready_map(org)
    out = []
    not_ready = 0
    for i, s in enumerate(stops):
        nr = _stop_not_ready(s, ready_map)
        if nr and not s.get("delivered"):
            not_ready += 1
        out.append({
            "id": s["id"], "seq": i + 1, "time": s.get("deadline") or "", "client": s.get("client"),
            "address": s.get("address") or "", "van": s.get("van") or "",
            "items": s.get("items") or [], "note": s.get("note") or "",
            "delivered": bool(s.get("delivered")), "not_ready": nr,
        })
    return {"date": today, "stops": out, "not_ready_count": not_ready, "total": len(out)}


@api_router.patch("/delivery/stop/{stop_id}/status")
async def delivery_stop_status(stop_id: str, body: dict, org: str = Depends(effective_org)):
    """L'autista segna una tappa come consegnata (o annulla). Interfaccia semplice."""
    delivered = bool(body.get("delivered", True))
    await db.deliveries.update_one({"id": stop_id, "organization_id": org},
                                   {"$set": {"delivered": delivered, "delivered_at": now_iso() if delivered else None}})
    return {"ok": True, "delivered": delivered}


# ============================ SITOR APPRENDISTA (Punto 4) ============================
# Solo due informazioni PRATICHE per ricetta, scritte UNA VOLTA dal Capo (Sitor non le inventa):
#   1) quanti pezzi entrano in una teglia/formato
#   2) come formare/piegare i pezzi
# Niente tempi di cottura/lievitazione qui. Isolato per organization_id.

class ApprenticeReq(BaseModel):
    pieces_per_tray: Optional[str] = Field("", max_length=40)
    tray_format: Optional[str] = Field("", max_length=80)
    shaping_note: Optional[str] = Field("", max_length=600)


@api_router.get("/apprentice/recipe/{recipe_id}")
async def apprentice_get(recipe_id: str, org: str = Depends(effective_org)):
    """Le due info pratiche per l'apprendista. Non tocca MAI ingredienti/dosi della ricetta."""
    doc = await db.recipe_apprentice.find_one({"recipe_id": recipe_id, "organization_id": org}, {"_id": 0}) or {}
    has = bool(doc.get("pieces_per_tray") or doc.get("shaping_note"))
    spoken = ""
    if has:
        parts = []
        if doc.get("pieces_per_tray"):
            parts.append(f"In una {doc.get('tray_format') or 'teglia'} entrano {doc['pieces_per_tray']} pezzi.")
        if doc.get("shaping_note"):
            parts.append(f"Per formare: {doc['shaping_note']}")
        spoken = " ".join(parts)
    return {"recipe_id": recipe_id, "has_info": has,
            "pieces_per_tray": doc.get("pieces_per_tray", ""), "tray_format": doc.get("tray_format", ""),
            "shaping_note": doc.get("shaping_note", ""), "spoken": spoken}


@api_router.put("/apprentice/recipe/{recipe_id}")
async def apprentice_set(recipe_id: str, body: ApprenticeReq, user: dict = Depends(require_admin)):
    """Il Capo scrive le info una volta per ricetta."""
    org = _org_id(user)
    upd = {"organization_id": org, "recipe_id": recipe_id,
           "pieces_per_tray": (body.pieces_per_tray or "").strip(),
           "tray_format": (body.tray_format or "").strip(),
           "shaping_note": (body.shaping_note or "").strip(), "updated_at": now_iso()}
    await db.recipe_apprentice.update_one({"recipe_id": recipe_id, "organization_id": org}, {"$set": upd}, upsert=True)
    return {"ok": True}
