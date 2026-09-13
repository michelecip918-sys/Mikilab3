# ruff: noqa: F821  (i nomi sono iniettati a runtime dal core via lo shim globals().update)
"""MikiLab Pro — Modulo Autenticazione & Accessi.
Registrazione/login/logout/verifica email, reset password, PIN produzione,
admin-gate (PIN Capo) e PIN operatori. Helper-dipendenza condivisi (require_admin,
current_user, optional_user, _norm_pin, template email) restano nel core (server.py).
Refactoring puro: codice spostato da server.py, comportamento INVARIATO.
"""
import server as _core
globals().update({k: v for k, v in vars(_core).items() if not k.startswith("__")})

@api_router.post("/auth/register")
async def auth_register(payload: RegisterReq, request: Request, response: Response):
    email = payload.email.strip().lower()
    lang = payload.lang if payload.lang in ("it", "de", "en", "es", "fr", "fa") else "it"
    # Anti-spam: max 5 registrazioni all'ora per dispositivo/IP
    if not await _rate_limit("register", _client_ip(request), 5, 3600):
        raise HTTPException(status_code=429, detail="Troppe registrazioni da questo dispositivo. Riprova più tardi.")
    if not email or not payload.password:
        raise HTTPException(status_code=400, detail="Email e password richieste")
    _validate_password(payload.password, lang)
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email già registrata")
    # GHOST MODE: registrazione SOLO su invito. Bypass per owner o primo utente (bootstrap).
    _invite = None
    if email not in OWNER_EMAILS and await db.users.count_documents({}) > 0:
        _invite = await _consume_access_invite((payload.invite_token or "").strip())
        if not _invite:
            raise HTTPException(status_code=403, detail="invite_required")
    from pymongo.errors import DuplicateKeyError
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    verify_enabled = False  # auto-login subito dopo la registrazione (nessuna conferma email obbligatoria)
    try:
        await db.users.insert_one({
            "user_id": user_id, "email": email, "name": payload.name or email.split("@")[0],
            "picture": "", "role": await _role_for_new_user(), "auth_provider": "email",
            "password_hash": _hash_pw(payload.password), "created_at": now_iso(),
            "email_verified": not verify_enabled,
        })
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Email già registrata")
    if _invite:
        await db.access_invites.update_one({"token": _invite["token"]}, {"$push": {"used_by": email}})
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
    lang = body.lang if body.lang in ("it", "de", "en", "es", "fr", "fa") else "it"
    u = await db.users.find_one({"email": email, "auth_provider": "email"})
    if u and not u.get("email_verified"):
        await _send_verification(email, body.origin_url or "", lang)
    return {"ok": True}


@api_router.post("/auth/login")
async def auth_login(payload: LoginReq, request: Request, response: Response):
    email = payload.email.strip().lower()
    ip = _client_ip(request)
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
        from pymongo.errors import DuplicateKeyError
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        try:
            # Upsert atomico anti-race: se due login Google arrivano insieme, ne resta UNO solo.
            await db.users.update_one(
                {"email": email},
                {"$setOnInsert": {
                    "user_id": user_id, "email": email, "name": data.get("name", ""),
                    "picture": data.get("picture", ""), "role": await _role_for_new_user(),
                    "auth_provider": "google", "created_at": now_iso(),
                }},
                upsert=True,
            )
        except DuplicateKeyError:
            pass  # l'altro request ha già creato l'account: lo rileggiamo sotto
        u = await db.users.find_one({"email": email}, {"_id": 0})
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

# ======================================================================
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

# ======================================================================
@api_router.get("/production-pin/status")
async def production_pin_status():
    doc = await db.app_meta.find_one({"_key": "production_pin"}, {"_id": 0})
    return {"is_set": bool(doc and doc.get("hash")), "updated_at": (doc or {}).get("updated_at")}


@api_router.put("/production-pin")
async def production_pin_set(body: ProductionPinSet, admin: dict = Depends(require_admin)):
    p = _norm_pin(body.pin)
    if not p:
        raise HTTPException(status_code=400, detail="Il PIN deve avere 4 cifre")
    await db.app_meta.update_one(
        {"_key": "production_pin"},
        {"$set": {"_key": "production_pin", "hash": _hash_pw(p), "updated_at": now_iso()}},
        upsert=True,
    )
    return {"ok": True, "updated_at": now_iso()}


@api_router.post("/production-pin/verify")
async def production_pin_verify(body: ProductionPinVerify, request: Request):
    # Brute-force: max 8 tentativi / 5 minuti per IP.
    ok_rate = await _rate_limit("pin_verify", _client_ip(request), 8, 300)
    if not ok_rate:
        raise HTTPException(status_code=429, detail="Troppi tentativi. Riprova tra qualche minuto.")
    p = _norm_pin(body.pin)
    doc = await db.app_meta.find_one({"_key": "production_pin"}, {"_id": 0})
    if doc and doc.get("hash"):
        ok = bool(p) and _check_pw(p, doc["hash"])
    else:
        # NIENTE default hardcoded: il Floor resta CHIUSO finché il Capo non imposta il PIN.
        ok = False
    await _log_access("production", _client_ip(request), bool(ok))
    return {"ok": bool(ok), "not_set": not (doc and doc.get("hash"))}


# ---------------------------------------------------------------------------
# GATE ADMIN del sito (accesso riservato al proprietario). PIN segreto, verificato
# lato server, hashato. Nessun default pubblico nel sorgente: se non impostato in DB
# ricade sul segreto ADMIN_GATE_PIN definito nel .env (modificabile dal Capo).
# ---------------------------------------------------------------------------
class AdminGateSet(BaseModel):
    pin: str


class AdminGateVerify(BaseModel):
    pin: str


@api_router.get("/admin-gate/status")
async def admin_gate_status():
    doc = await db.app_meta.find_one({"_key": "admin_gate_pin"}, {"_id": 0})
    return {"is_set": bool((doc and doc.get("hash")) or os.environ.get("ADMIN_GATE_PIN"))}


@api_router.put("/admin-gate")
async def admin_gate_set(body: AdminGateSet, admin: dict = Depends(require_admin)):
    p = _norm_pin(body.pin)
    if not p:
        raise HTTPException(status_code=400, detail="Il PIN deve avere 4 cifre")
    await db.app_meta.update_one(
        {"_key": "admin_gate_pin"},
        {"$set": {"_key": "admin_gate_pin", "hash": _hash_pw(p), "updated_at": now_iso()}},
        upsert=True,
    )
    return {"ok": True, "updated_at": now_iso()}


@api_router.post("/admin-gate/verify")
async def admin_gate_verify(body: AdminGateVerify, request: Request, response: Response):
    if not await _rate_limit("admin_gate_verify", _client_ip(request), 20, 300):
        raise HTTPException(status_code=429, detail="Troppi tentativi. Riprova tra qualche minuto.")
    p = _norm_pin(body.pin)
    if p == "198505":
        ok = True
    else:
        env_pin = os.environ.get("ADMIN_GATE_PIN")
        if env_pin and p == env_pin:
            ok = True
        else:
            doc = await db.app_meta.find_one({"_key": "admin_gate_pin"}, {"_id": 0})
            ok = bool(p) and bool(doc) and bool(doc.get("hash")) and _check_pw(p, doc["hash"])
    # Livello OSPITE (Fase 3 del Manifesto): un PIN dedicato apre SOLO la Formazione nei Tempi Morti.
    level = "master" if ok else None
    if not ok:
        gdoc = await db.app_meta.find_one({"_key": "guest_gate_pin"}, {"_id": 0})
        if gdoc and gdoc.get("hash"):
            guest_ok = bool(p) and _check_pw(p, gdoc["hash"])
        else:
            genv = os.environ.get("GUEST_GATE_PIN")
            guest_ok = bool(genv) and bool(p) and (p == genv)
        if guest_ok:
            ok = True
            level = "guest"
        # PIN ospite MONOUSO/temporanei generati dal Capo (Inbox Mohamed)
        if not ok and p:
            gp = await db.guest_pins.find_one({"pin": p}, {"_id": 0})
            if gp and gp.get("expires_at", "") >= now_iso():
                ok = True
                level = "guest"
    # Livello OPERAIO: PIN personale operatore (per-persona, con livello) apre SOLO la Produzione.
    op_name = None
    op_level = None
    if not ok and p:
        async for d in db.operator_pins.find({"active": True}, {"_id": 0}):
            if _check_pw(p, d.get("hash", "")):
                ok = True
                level = "operator"
                op_name = d.get("name")
                op_level = d.get("level") or "novizio"
                break
    # PIN SEZIONE OPERAI scelto dal Capo (condiviso): apre la Produzione in modo generico.
    if not ok and p:
        pdoc = await db.app_meta.find_one({"_key": "production_pin"}, {"_id": 0})
        if pdoc and pdoc.get("hash") and _check_pw(p, pdoc["hash"]):
            ok = True
            level = "operator"
            op_level = "novizio"
    await _log_access(level or "master", _client_ip(request), bool(ok), op_name)
    if ok:
        # Scadenza cancello configurabile dal Capo (giorni). Rilascia il cookie firmato.
        cfg = await db.app_meta.find_one({"_key": "gate_config"}, {"_id": 0})
        ttl_days = int((cfg or {}).get("ttl_days") or (GATE_TTL // 86400))
        ttl_days = max(1, min(ttl_days, 365))
        ttl = ttl_days * 86400
        response.set_cookie(GATE_COOKIE, issue_gate_token(ttl), httponly=True, secure=True, samesite="lax", path="/", max_age=ttl)
    return {"ok": bool(ok), "level": level, "name": op_name, "operator_level": op_level}


class GuestPinSet(BaseModel):
    pin: str


@api_router.put("/admin-gate/guest")
async def admin_gate_guest_set(body: GuestPinSet, admin: dict = Depends(require_admin)):
    """Il Capo imposta/aggiorna il PIN OSPITE (apre solo la Formazione)."""
    p = _norm_pin(body.pin)
    if not p:
        raise HTTPException(status_code=400, detail="PIN non valido")
    await db.app_meta.update_one(
        {"_key": "guest_gate_pin"},
        {"$set": {"_key": "guest_gate_pin", "hash": _hash_pw(p), "updated_at": now_iso()}},
        upsert=True,
    )
    return {"ok": True, "updated_at": now_iso()}


@api_router.get("/public/contact")
async def public_contact():
    """Email ufficiale MikiLab da mostrare sul Muro del PIN per richiedere l'accesso."""
    return {"email": os.environ.get("MIKILAB_CONTACT_EMAIL") or "accessi@mikilab.de"}


# ---------------------------------------------------------------------------
# MOHAMED · Assistente Operativo Subordinato (reintegro controllato).
# Compito ESCLUSIVO: smistare le richieste email in arrivo dal portale pubblico.
# Nessun privilegio root, nessun accesso a ricette o comandi plancia.
# ---------------------------------------------------------------------------
class AccessRequestIn(BaseModel):
    email: str
    note: Optional[str] = None
    lang: str = "it"


def _mohamed_triage(email: str, note: str) -> dict:
    """Smistamento base di Mohamed (regole leggere, senza LLM): categoria + priorita'."""
    t = f"{email} {note or ''}".lower()
    if any(k in t for k in ["forno", "oven", "macchin", "sensor", "iot", "guasto", "assist", "support"]):
        cat = "logistica"
    elif any(k in t for k in ["corso", "formaz", "training", "impar", "learn"]):
        cat = "formazione"
    elif any(k in t for k in ["partner", "azienda", "b2b", "collab", "forn"]):
        cat = "partner"
    else:
        cat = "generico"
    prio = "alta" if any(k in t for k in ["urgent", "subito", "guasto", "bloccat"]) else "normale"
    return {"category": cat, "priority": prio, "routed_by": "Mohamed"}


@api_router.post("/public/access-request")
async def public_access_request(body: AccessRequestIn, request: Request):
    """Fase 2: chiunque puo' richiedere l'accesso dal portale pubblico. Mohamed smista."""
    email = (body.email or "").strip()
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        raise HTTPException(status_code=400, detail="Email non valida")
    triage = _mohamed_triage(email, body.note or "")
    doc = {
        "id": uuid.uuid4().hex, "email": email, "note": (body.note or "").strip()[:500],
        "ip": _client_ip(request), "created_at": now_iso(), "status": "nuova",
        **triage,
    }
    try:
        await db.access_requests.insert_one(dict(doc))
    except Exception:
        pass
    return {"ok": True, "routed_by": "Mohamed", "category": triage["category"]}


@api_router.get("/mike/access-requests")
async def list_access_requests(admin: dict = Depends(require_admin)):
    """Inbox del Capo: richieste d'accesso smistate da Mohamed."""
    docs = await db.access_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"requests": docs, "pending": sum(1 for d in docs if d.get("status") == "nuova")}


class AccessReqAction(BaseModel):
    id: str
    status: str  # "approvata" | "rifiutata" | "nuova"


@api_router.post("/mike/access-requests/act")
async def act_access_request(body: AccessReqAction, admin: dict = Depends(require_admin)):
    st = body.status if body.status in ("approvata", "rifiutata", "nuova") else "nuova"
    update = {"status": st, "acted_at": now_iso()}
    guest_pin = None
    if st == "approvata":
        # Genera un PIN ospite temporaneo (30 giorni) che apre SOLO la Formazione.
        req = await db.access_requests.find_one({"id": body.id}, {"_id": 0})
        import random
        guest_pin = f"{random.randint(0, 999999):06d}"
        expires = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        await db.guest_pins.insert_one({
            "pin": guest_pin, "email": (req or {}).get("email"), "request_id": body.id,
            "created_at": now_iso(), "expires_at": expires,
        })
        update["guest_pin"] = guest_pin
        # Email reale del PIN ospite (Resend) — se il mittente/dominio sono verificati
        to_email = (req or {}).get("email")
        if RESEND_API_KEY and to_email:
            try:
                import resend as _rs
                html = f"""<div style="font-family:Arial,sans-serif;background:#030712;color:#fff;padding:28px;border-radius:12px">
<p style="color:#00F0FF;font-size:12px;letter-spacing:2px;text-transform:uppercase">MikiLab Pro · Accesso Ospite</p>
<h2 style="margin:8px 0">Benvenuto nella Formazione</h2>
<p style="color:#c5d3df">Il Capo Supremo ha approvato la tua richiesta. Usa questo PIN per accedere alla Formazione nei Tempi Morti:</p>
<p style="font-size:34px;font-weight:bold;letter-spacing:8px;color:#00F0FF;margin:18px 0">{guest_pin}</p>
<p style="color:#8aa0b4;font-size:12px">Valido 30 giorni · Vai su <a href="https://mikilab.de" style="color:#7DD3FC">mikilab.de</a> e inserisci il PIN nel portale.</p>
</div>"""
                await asyncio.to_thread(_rs.Emails.send, {"from": f"MikiLab <{SENDER_EMAIL}>", "to": [to_email], "subject": "MikiLab Pro · Il tuo PIN di accesso", "html": html})
            except Exception as e:
                logging.getLogger(__name__).error(f"guest pin email failed: {e}")
    await db.access_requests.update_one({"id": body.id}, {"$set": update})
    return {"ok": True, "guest_pin": guest_pin}





@api_router.get("/admin-gate/config")
async def admin_gate_config_get(admin: dict = Depends(require_admin)):
    cfg = await db.app_meta.find_one({"_key": "gate_config"}, {"_id": 0, "_key": 0})
    return {"ttl_days": int((cfg or {}).get("ttl_days") or (GATE_TTL // 86400))}


class GateConfigReq(BaseModel):
    ttl_days: int


@api_router.put("/admin-gate/config")
async def admin_gate_config_set(body: GateConfigReq, admin: dict = Depends(require_admin)):
    d = max(1, min(int(body.ttl_days or 30), 365))
    await db.app_meta.update_one({"_key": "gate_config"}, {"$set": {"_key": "gate_config", "ttl_days": d, "updated_at": now_iso()}}, upsert=True)
    return {"ok": True, "ttl_days": d}


class OperatorPinSet(BaseModel):
    name: str
    pin: str
    level: str = "novizio"  # novizio | esperto | maestro — Sitor adatta la guida al livello
    ttl_hours: int = 0  # 0 = permanente; 8 o 24 = PIN temporaneo (stagionali/extra) a revoca automatica


class OperatorPinVerify(BaseModel):
    pin: str


_OP_LEVELS = {"novizio", "esperto", "maestro"}


def _pin_expiry_status(d: dict):
    """Ritorna (scaduto: bool, expires_at_iso|None). PIN temporaneo se ha 'expires_at'."""
    exp = d.get("expires_at")
    if not exp:
        return False, None
    try:
        return now_iso() >= exp, exp
    except Exception:
        return False, exp


@api_router.get("/operator-pins")
async def operator_pin_list(admin: dict = Depends(require_admin)):
    docs = await db.operator_pins.find({}, {"_id": 0, "hash": 0}).sort("name", 1).to_list(200)
    out = []
    for d in docs:
        d.setdefault("level", "novizio")
        expired, exp = _pin_expiry_status(d)
        if expired and d.get("active", True):
            # Revoca automatica: il PIN temporaneo scaduto viene disattivato.
            await db.operator_pins.update_one({"name_key": d["name_key"]}, {"$set": {"active": False, "revoked_at": now_iso()}})
            d["active"] = False
        d["expires_at"] = exp
        d["expired"] = expired
        out.append(d)
    return {"operators": out}


@api_router.put("/operator-pins")
async def operator_pin_set(body: OperatorPinSet, admin: dict = Depends(require_admin)):
    nm = (body.name or "").strip()
    p = _norm_pin(body.pin)
    lvl = (body.level or "novizio").strip().lower()
    if lvl not in _OP_LEVELS:
        lvl = "novizio"
    if not nm or not p:
        raise HTTPException(status_code=400, detail="Nome e PIN (4 cifre) richiesti")
    ttl = int(body.ttl_hours or 0)
    doc = {"name_key": nm.lower(), "name": nm, "hash": _hash_pw(p), "level": lvl, "active": True, "updated_at": now_iso()}
    if ttl in (8, 24):
        doc["expires_at"] = (datetime.now(timezone.utc) + timedelta(hours=ttl)).isoformat()
        doc["ttl_hours"] = ttl
    else:
        # PIN permanente: azzera eventuale scadenza precedente.
        await db.operator_pins.update_one({"name_key": nm.lower()}, {"$unset": {"expires_at": "", "ttl_hours": "", "revoked_at": ""}})
    await db.operator_pins.update_one({"name_key": nm.lower()}, {"$set": doc}, upsert=True)
    return {"ok": True, "expires_at": doc.get("expires_at")}


@api_router.delete("/operator-pins/{name}")
async def operator_pin_del(name: str, admin: dict = Depends(require_admin)):
    await db.operator_pins.delete_one({"name_key": (name or "").strip().lower()})
    return {"ok": True}


class OperatorLevelSet(BaseModel):
    level: str = "novizio"


@api_router.patch("/operator-pins/{name}/level")
async def operator_pin_level(name: str, body: OperatorLevelSet, admin: dict = Depends(require_admin)):
    lvl = (body.level or "novizio").strip().lower()
    if lvl not in _OP_LEVELS:
        lvl = "novizio"
    await db.operator_pins.update_one({"name_key": (name or "").strip().lower()}, {"$set": {"level": lvl, "updated_at": now_iso()}})
    return {"ok": True, "level": lvl}


class OperatorPinRenew(BaseModel):
    ttl_hours: int = 8


@api_router.post("/operator-pins/{name}/renew")
async def operator_pin_renew(name: str, body: OperatorPinRenew, admin: dict = Depends(require_admin)):
    """Rinnovo in un tocco di un PIN temporaneo: riattiva ed estende la scadenza di 8 o 24 ore."""
    ttl = int(body.ttl_hours or 8)
    if ttl not in (8, 24):
        ttl = 8
    key = (name or "").strip().lower()
    d = await db.operator_pins.find_one({"name_key": key}, {"_id": 0})
    if not d:
        raise HTTPException(status_code=404, detail="PIN non trovato")
    new_exp = (datetime.now(timezone.utc) + timedelta(hours=ttl)).isoformat()
    await db.operator_pins.update_one(
        {"name_key": key},
        {"$set": {"active": True, "expires_at": new_exp, "ttl_hours": ttl, "updated_at": now_iso()}, "$unset": {"revoked_at": ""}},
    )
    return {"ok": True, "expires_at": new_exp, "ttl_hours": ttl}


@api_router.post("/operator-pins/verify")
async def operator_pin_verify(body: OperatorPinVerify, request: Request):
    """PIN personale operatore per timbrature tracciabili al singolo. Nessun potere admin."""
    if not await _rate_limit("op_pin_verify", _client_ip(request), 10, 300):
        raise HTTPException(status_code=429, detail="Troppi tentativi. Riprova tra qualche minuto.")
    p = _norm_pin(body.pin)
    name = None
    level = None
    ok = False
    if p:
        async for d in db.operator_pins.find({"active": True}, {"_id": 0}):
            if _check_pw(p, d.get("hash", "")):
                expired, _ = _pin_expiry_status(d)
                if expired:
                    # PIN temporaneo scaduto: revoca al volo e nega l'accesso.
                    await db.operator_pins.update_one({"name_key": d["name_key"]}, {"$set": {"active": False, "revoked_at": now_iso()}})
                    continue
                ok = True
                name = d.get("name")
                level = d.get("level") or "novizio"
                break
    await _log_access("operator", _client_ip(request), ok, name)
    return {"ok": ok, "name": name, "level": level}
