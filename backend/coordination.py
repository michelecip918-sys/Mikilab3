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
        "enabled": bool(doc.get("enabled", True)),  # interruttore generale del coordinamento
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
    enabled: Optional[bool] = None              # interruttore generale coordinamento automatico
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
    if body.enabled is not None:
        upd["enabled"] = bool(body.enabled)
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
    depts = [{"key": d["key"], "name": d["name"]} for d in await _depts_merged(org)]
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
    valid = {d["key"] for d in await _depts_merged(org)}
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
    if dept not in DEPARTMENTS and not dept.startswith("dept-"):
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
    _to = call.get("help_timeout_sec") or settings["response_timeout_sec"]
    call["expires_at"] = (datetime.now(timezone.utc) + timedelta(seconds=_to)).isoformat()
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
    await _log_decision(org, kind="accepted", dept=call["dept"], task_desc=call["task_desc"],
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
    settings = await _coord_settings(org)
    if not settings.get("enabled", True):
        return {"ok": True, "disabled": True, "calls": []}
    return await _do_coordination_trigger(body, org)


@api_router.get("/coordination/roster")
async def coordination_roster(org: str = Depends(effective_org)):
    """Roster live: stato libero/occupato di ogni operatore (per la console del Capo)."""
    pool = await _worker_pool(org)
    free = sum(1 for w in pool if w.get("status") != "busy")
    return {"operators": pool, "free": free, "busy": len(pool) - free, "total": len(pool)}


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
        await _log_decision(org, kind="declined", dept=call["dept"], task_desc=call["task_desc"],
                            operator=op, call_id=call["id"])
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



# ============================ "CHIEDI AIUTO" A VOCE (OPERATORE) ============================
# Aggiunta parallela al coordinamento esistente: l'operatore, a mani libere, descrive con
# parole sue cosa gli serve. Sitor capisce tipo/urgenza, conferma a voce (tranne emergenze),
# poi usa la coda dei liberi del reparto per chiamare un collega. Emergenze → Capo subito.

HELP_URGENT_TIMEOUT_SEC = 15  # attesa più breve per "mi serve una mano ORA" (urgenza fisica)


def _tri6(lang, it, de, en, es, fr, fa):
    return {"it": it, "de": de, "en": en, "es": es, "fr": fr, "fa": fa}.get((lang or "it")[:2], it)


async def _capo_ids_emails(org: str):
    admins = await db.users.find(
        {"organization_id": org, "$or": [{"role": "admin"}, {"email": {"$in": [e.lower() for e in OWNER_EMAILS]}}]},
        {"_id": 0, "user_id": 1, "email": 1}).to_list(50)
    return [a.get("user_id") for a in admins if a.get("user_id")], [a.get("email") for a in admins if a.get("email")]


async def _notify_capo_help(org: str, title: str, text: str, kind: str, call_id: str = None, priority: str = "alta"):
    """Avvisa il Capo di una richiesta d'aiuto: banner in console + push + email. Best-effort."""
    try:
        await db.team_notifications.insert_one({
            "id": str(uuid.uuid4()), "organization_id": org, "kind": kind,
            "title": title, "text": text, "call_id": call_id, "priority": priority,
            "read": False, "at": now_iso(),
        })
    except Exception:
        pass
    try:
        ids, emails = await _capo_ids_emails(org)
        if ids:
            _, priv = await _get_vapid()
            subs = await db.push_subs.find({"user_id": {"$in": ids}}, {"_id": 0}).to_list(100)
            payload = {"title": title, "body": text, "tag": f"help-{kind}"}
            for s in subs:
                try:
                    await asyncio.to_thread(_send_push, s["subscription"], payload, priv)
                except Exception:
                    pass
        if RESEND_API_KEY and emails:
            color = "#c0392b" if kind == "help_emergency" else "#D97736"
            html = (f"<div style='font-family:sans-serif;max-width:520px'>"
                    f"<h2 style='color:{color}'>{title}</h2><p>{text}</p>"
                    f"<p style='color:#888;font-size:12px'>MikiLab · Coordinamento · {now_iso()[:16]}</p></div>")
            await asyncio.to_thread(_resend.Emails.send, {"from": f"MikiLab <{SENDER_EMAIL}>",
                                                          "to": [e for e in emails if e], "subject": title, "html": html})
    except Exception as e:
        logging.warning("notify_capo_help fail (%s)", str(e)[:120])


async def _help_classify(transcript: str, lang: str) -> dict:
    """Sitor capisce dalla frase libera dell'operatore: se è una richiesta d'aiuto, l'urgenza e il tipo.
    urgency: 'emergency' (pericolo fisico serio) | 'urgent' (mi serve una mano ORA) | 'normal'."""
    sys = (
        "Sei Sitor, coordinatore di un laboratorio (panificio/pizzeria/pasticceria). Un OPERATORE parla a voce "
        "e descrive con parole sue un problema o una richiesta. Classifica la frase. "
        "urgency = 'emergency' SOLO per pericolo fisico serio o infortunio: scottatura, ustione, taglio, sangue, "
        "caduta, infortunio, svenimento, fuga di gas, principio d'incendio, fumo, fiamme, qualcuno sta male. "
        "urgency = 'urgent' se serve una mano SUBITO per non rovinare un lavoro o per sforzo fisico immediato "
        "(es. impasto pesante che sta franando, teglia che sta cadendo, qualcosa che brucia in forno adesso). "
        "urgency = 'normal' per aiuti ordinari (teglie da lavare, manca materiale, dare una mano tra poco). "
        "is_help=false solo se NON è una richiesta d'aiuto (domanda generica, chiacchiera). "
        f"'summary' e 'confirm_question' devono essere nella lingua con codice '{lang}'. "
        "'confirm_question' è una domanda SÌ/NO breve che riformula la richiesta per conferma "
        "(es. «Ho capito: ti serve una mano a lavare le teglie, giusto?»). "
        "Rispondi SOLO con JSON valido: "
        '{"is_help":true,"urgency":"emergency|urgent|normal","category":"pulizia|materiale|sforzo|macchina|sicurezza|altro",'
        '"summary":"riformulazione breve","confirm_question":"domanda sì/no"}'
    )
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"help-{uuid.uuid4().hex[:8]}",
                   system_message=sys).with_model("anthropic", SITOR_FAST).with_params(max_tokens=500)
    full = ""
    async for ev in chat.stream_message(UserMessage(text=f"Frase dell'operatore: «{transcript}»")):
        if isinstance(ev, TextDelta):
            full += ev.content
        elif isinstance(ev, StreamDone):
            break
    m = re.search(r"\{.*\}", full, re.S)
    parsed = json.loads(m.group(0)) if m else None
    if not parsed:
        raise ValueError("no-json")
    parsed["urgency"] = parsed.get("urgency") if parsed.get("urgency") in ("emergency", "urgent", "normal") else "normal"
    parsed["is_help"] = bool(parsed.get("is_help", True))
    return parsed


class HelpParseReq(BaseModel):
    transcript: str = Field(..., max_length=400)
    lang: str = "it"


@api_router.post("/coordination/help/parse")
async def help_parse(body: HelpParseReq, org: str = Depends(effective_org)):
    """Capisce la richiesta d'aiuto dell'operatore. Emergenza → nessuna conferma (needs_confirm=false)."""
    txt = (body.transcript or "").strip()
    if not txt:
        raise HTTPException(status_code=400, detail="Nessuna frase")
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=503, detail="NLP non disponibile")
    try:
        parsed = await _help_classify(txt, body.lang or "it")
    except Exception as e:
        logging.warning("help_parse failed: %s", str(e)[:120])
        raise HTTPException(status_code=503, detail="NLP non disponibile")
    emergency = parsed["urgency"] == "emergency"
    return {"ok": True, "is_help": parsed["is_help"], "urgency": parsed["urgency"],
            "category": parsed.get("category", "altro"), "summary": parsed.get("summary", txt),
            "confirm_question": parsed.get("confirm_question", ""),
            "needs_confirm": (parsed["is_help"] and not emergency), "emergency": emergency,
            "transcript": txt}


class HelpTriggerReq(BaseModel):
    transcript: str = Field(..., max_length=400)
    lang: str = "it"
    operator: str = Field("", max_length=60)
    dept: str = Field("", max_length=40)
    urgency: str = "normal"
    category: str = "altro"


async def _dept_label(dept: str) -> str:
    d = DEPARTMENTS.get(dept)
    if d:
        return d.get("name", dept)
    doc = await db.dept_templates.find_one({"id": dept}, {"_id": 0, "name": 1})
    return (doc or {}).get("name", dept)


@api_router.post("/coordination/help/trigger")
async def help_trigger(body: HelpTriggerReq, org: str = Depends(effective_org)):
    """Attiva la richiesta d'aiuto confermata. Emergenza → Capo subito (salta coda e conferma).
    Normale/urgente → chiama il primo collega libero del reparto con la frase ORIGINALE."""
    txt = (body.transcript or "").strip()
    op = (body.operator or "").strip()
    dept = (body.dept or "").strip()
    urgency = body.urgency if body.urgency in ("emergency", "urgent", "normal") else "normal"
    dept_name = await _dept_label(dept) if dept else ""

    # 7) EMERGENZA: salta tutto, avvisa il Capo IMMEDIATAMENTE con priorità assoluta.
    if urgency == "emergency":
        await _log_decision(org, kind="help_emergency", dept=dept, task_desc=txt, operator=op,
                            urgency="emergency", detail="Emergenza segnalata a voce: Capo avvisato subito")
        await _notify_capo_help(org, "🚨 EMERGENZA in laboratorio",
                                f"{op or 'Un operatore'}{(' · ' + dept_name) if dept_name else ''}: «{txt}». Intervieni SUBITO.",
                                kind="help_emergency", priority="critica")
        spoken = _tri6(body.lang, "Emergenza registrata. Ho avvisato subito il Capo. Metti in sicurezza te stesso e chi ti sta vicino.",
                       "Notfall erfasst. Ich habe sofort den Chef alarmiert. Bring dich und andere in Sicherheit.",
                       "Emergency logged. I alerted the boss immediately. Get yourself and others to safety.",
                       "Emergencia registrada. Avisé al jefe de inmediato. Ponte a salvo tú y los demás.",
                       "Urgence enregistrée. J'ai prévenu le chef immédiatement. Mets-toi en sécurité.",
                       "اضطراری ثبت شد. فوراً به رئیس اطلاع دادم. خودت و بقیه را ایمن کن.")
        return {"mode": "emergency", "spoken": spoken}

    # 2) Coda dei liberi/abilitati del reparto (riusa la logica esistente).
    queue = await _eligible_queue(org, dept) if dept else []
    settings = await _coord_settings(org)
    call = {
        "id": str(uuid.uuid4()), "organization_id": org, "dept": dept,
        "task_desc": txt,  # 4) la frase ORIGINALE dell'operatore, non un'etichetta generica
        "help_requester": op, "urgency": urgency, "source": "help", "category": body.category,
        "queue": queue, "idx": 0, "current_operator": None,
        "created_at": now_iso(), "capo_present_at_trigger": _capo_present(settings), "decisions": [],
    }
    # 9) urgenza fisica immediata → finestra di risposta più breve prima di escalare al Capo
    if urgency == "urgent":
        call["help_timeout_sec"] = HELP_URGENT_TIMEOUT_SEC

    # 8) NESSUNO LIBERO → avvisa il Capo che serve aiuto e nessuno è disponibile.
    if not queue:
        call["status"] = "uncovered"
        call["uncovered_at"] = now_iso()
        await _persist_call(call)
        await _log_decision(org, kind="help_uncovered", dept=dept, task_desc=txt, operator=op,
                            urgency=urgency, call_id=call["id"], detail="Richiesta d'aiuto senza colleghi liberi")
        await _notify_capo_help(org, "Aiuto richiesto · nessuno libero",
                                f"{op or 'Un operatore'}{(' · ' + dept_name) if dept_name else ''} chiede aiuto: «{txt}». Nessun collega disponibile.",
                                kind="help_uncovered", priority="alta")
        spoken = _tri6(body.lang, "Al momento non c'è nessun collega libero. Ho avvisato il Capo perché ti aiuti.",
                       "Gerade ist kein Kollege frei. Ich habe den Chef informiert.",
                       "No colleague is free right now. I alerted the boss to help you.",
                       "Ahora no hay ningún compañero libre. Avisé al jefe.",
                       "Aucun collègue libre pour l'instant. J'ai prévenu le chef.",
                       "الان همکاری آزاد نیست. به رئیس اطلاع دادم.")
        return {"mode": "uncovered", "spoken": spoken, "call": _public_call(call)}

    # Chiama SUBITO il primo collega libero (l'operatore ha bisogno ora, non serve proposta al Capo).
    await _start_pending(call, settings)
    await _persist_call(call)
    await _log_decision(org, kind="help_requested", dept=dept, task_desc=txt, operator=op,
                        urgency=urgency, call_id=call["id"], detail=f"Chiamato {call['current_operator']}")
    spoken = _tri6(body.lang, f"Sto chiamando {call['current_operator']} per aiutarti. Ti avviso appena risponde.",
                   f"Ich rufe {call['current_operator']} zur Hilfe. Ich sage Bescheid, sobald er antwortet.",
                   f"I'm calling {call['current_operator']} to help you. I'll tell you when they answer.",
                   f"Estoy llamando a {call['current_operator']} para ayudarte.",
                   f"J'appelle {call['current_operator']} pour t'aider.",
                   f"دارم {call['current_operator']} را برای کمک صدا می‌کنم.")
    return {"mode": "calling", "spoken": spoken, "call": _public_call(call)}


class HelpRepingReq(BaseModel):
    operator: str = Field("", max_length=60)
    dept: str = Field("", max_length=40)
    lang: str = "it"


@api_router.post("/coordination/help/reping")
async def help_reping(body: HelpRepingReq, org: str = Depends(effective_org)):
    """6) «Non è ancora arrivato nessuno»: rilancia la ricerca per l'ultima richiesta d'aiuto dell'operatore."""
    op = (body.operator or "").strip()
    last = await db.coordination_calls.find_one(
        {"organization_id": org, "source": "help", "help_requester": op},
        {"_id": 0}, sort=[("created_at", -1)])
    if not last:
        raise HTTPException(status_code=404, detail="Nessuna richiesta d'aiuto recente")
    dept = last.get("dept") or body.dept
    txt = last.get("task_desc") or ""
    urgency = last.get("urgency") or "normal"
    # Ricostruisci la coda dei liberi ORA, escludendo chi ha già rifiutato/non risposto.
    already = {d.get("operator", "").lower() for d in (last.get("decisions") or []) if d.get("action") in ("declined", "timeout")}
    queue = [w for w in await _eligible_queue(org, dept) if w.lower() not in already]
    settings = await _coord_settings(org)
    # Chiudi la vecchia chiamata come superata.
    await db.coordination_calls.update_one({"id": last["id"], "organization_id": org}, {"$set": {"status": "superseded"}})
    call = {
        "id": str(uuid.uuid4()), "organization_id": org, "dept": dept, "task_desc": txt,
        "help_requester": op, "urgency": urgency, "source": "help", "category": last.get("category", "altro"),
        "queue": queue, "idx": 0, "current_operator": None,
        "created_at": now_iso(), "capo_present_at_trigger": _capo_present(settings), "decisions": [],
    }
    if urgency == "urgent":
        call["help_timeout_sec"] = HELP_URGENT_TIMEOUT_SEC
    dept_name = await _dept_label(dept) if dept else ""
    if not queue:
        call["status"] = "uncovered"; call["uncovered_at"] = now_iso()
        await _persist_call(call)
        await _log_decision(org, kind="help_uncovered", dept=dept, task_desc=txt, operator=op,
                            urgency=urgency, call_id=call["id"], detail="Reping: nessun altro collega libero")
        await _notify_capo_help(org, "Aiuto ancora scoperto",
                                f"{op or 'Un operatore'}{(' · ' + dept_name) if dept_name else ''} chiede di nuovo aiuto: «{txt}». Nessun altro collega libero.",
                                kind="help_uncovered", priority="alta")
        spoken = _tri6(body.lang, "Non è rimasto nessun altro collega libero. Ho di nuovo avvisato il Capo.",
                       "Kein weiterer Kollege frei. Ich habe erneut den Chef informiert.",
                       "No other colleague is free. I alerted the boss again.",
                       "No queda ningún otro compañero libre. Avisé de nuevo al jefe.",
                       "Aucun autre collègue libre. J'ai de nouveau prévenu le chef.",
                       "همکار دیگری آزاد نیست. دوباره به رئیس اطلاع دادم.")
        return {"mode": "uncovered", "spoken": spoken, "call": _public_call(call)}
    await _start_pending(call, settings)
    await _persist_call(call)
    await _log_decision(org, kind="help_requested", dept=dept, task_desc=txt, operator=op,
                        urgency=urgency, call_id=call["id"], detail=f"Reping: chiamato {call['current_operator']}")
    spoken = _tri6(body.lang, f"Riprovo: sto chiamando {call['current_operator']}.",
                   f"Neuer Versuch: ich rufe {call['current_operator']}.",
                   f"Trying again: I'm calling {call['current_operator']}.",
                   f"Reintento: llamando a {call['current_operator']}.",
                   f"Nouvel essai : j'appelle {call['current_operator']}.",
                   f"دوباره تلاش می‌کنم: {call['current_operator']} را صدا می‌زنم.")
    return {"mode": "calling", "spoken": spoken, "call": _public_call(call)}
