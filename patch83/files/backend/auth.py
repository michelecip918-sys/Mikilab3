# ruff: noqa: F821  (i nomi sono iniettati a runtime dal core via lo shim globals().update)
"""MikiLab — Accesso admin di Michele (email + password): login, logout, password dimenticata, cambio password.
Nessuna registrazione pubblica. Helper condivisi (require_admin, current_user, optional_user) nel core (server.py).
"""
import server as _core
globals().update({k: v for k, v in vars(_core).items() if not k.startswith("__")})


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
    # Manuale pubblico: SOLO gli account admin (o l'owner) possono autenticarsi.
    # Il controllo avviene DOPO la verifica password, quindi non rivela l'esistenza
    # dell'email a chi non conosce la password (niente enumeration).
    is_admin = u.get("role") == "admin" or (u.get("email") or "").strip().lower() in OWNER_EMAILS
    if not is_admin:
        raise HTTPException(status_code=403, detail="not_authorized")
    await db.login_attempts.delete_one({"identifier": ident})
    token = await _make_session(u["user_id"])
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


class ChangePwReq(BaseModel):
    current_password: str
    new_password: str
    lang: Optional[str] = "it"


@api_router.post("/auth/change-password")
async def change_password(body: ChangePwReq, request: Request, admin: dict = Depends(require_admin)):
    """Cambio password dall'interno dell'admin (reset email non configurato).
    Solo admin (require_admin + non in allowlist pubblica → 404 per gli anonimi).
    Verifica la password attuale, richiede min 14 caratteri, rifiuta nuova==attuale,
    stesso hash bcrypt, limite ai tentativi. Le password NON vengono mai loggate."""
    lang = body.lang if body.lang in ("it", "de", "en") else "it"
    # limite tentativi: max 5 in 15 minuti per admin, per non abusare della verifica
    if not await _rate_limit("change_pw", admin["user_id"], 5, 900):
        raise HTTPException(status_code=429, detail="Troppi tentativi. Riprova tra qualche minuto.")
    u = await db.users.find_one({"user_id": admin["user_id"]}, {"_id": 0})
    if not u or not u.get("password_hash") or not _check_pw(body.current_password or "", u["password_hash"]):
        msgs = {"it": "Password attuale errata.", "de": "Aktuelles Passwort falsch.", "en": "Current password is wrong."}
        raise HTTPException(status_code=400, detail=msgs[lang])
    new_pw = body.new_password or ""
    if len(new_pw) < 14:
        msgs = {"it": "La nuova password deve avere almeno 14 caratteri.",
                "de": "Das neue Passwort muss mindestens 14 Zeichen haben.",
                "en": "The new password must be at least 14 characters."}
        raise HTTPException(status_code=400, detail=msgs[lang])
    if _check_pw(new_pw, u["password_hash"]):
        msgs = {"it": "La nuova password deve essere diversa da quella attuale.",
                "de": "Das neue Passwort muss sich vom aktuellen unterscheiden.",
                "en": "The new password must be different from the current one."}
        raise HTTPException(status_code=400, detail=msgs[lang])
    await db.users.update_one({"user_id": admin["user_id"]}, {"$set": {"password_hash": _hash_pw(new_pw)}})
    # invalida le altre sessioni, mantieni quella corrente
    keep = request.cookies.get("session_token")
    await db.user_sessions.delete_many({"user_id": admin["user_id"], "session_token": {"$ne": keep}})
    return {"ok": True}
