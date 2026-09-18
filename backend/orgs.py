# ruff: noqa: F821  (i nomi sono iniettati a runtime dal core via lo shim globals().update)
"""MikiLab Pro — Modulo Multi-Azienda + Inviti Operaio via Link.

- Gestione di piu' aziende (organizations) con appartenenza (memberships) e switch
  dell'azienda attiva nella sessione del Capo. L'Owner (OWNER_EMAILS) vede tutte le aziende.
- Inviti operaio via link: il Capo genera un link; l'operaio lo apre, sceglie il nome
  e imposta un PIN personale (4 cifre) ed entra direttamente in Produzione nella sua azienda.
Refactoring puro: nuove rotte registrate sullo stesso api_router del core (server.py).
"""
import server as _core
globals().update({k: v for k, v in vars(_core).items() if not k.startswith("__")})

import uuid as _uuid
import secrets as _secrets
from datetime import datetime, timedelta, timezone


# ===========================================================================
# MULTI-AZIENDA — organizations + memberships + switch azienda attiva
# ===========================================================================
async def _ensure_org_doc(org_id: str, name: str = "") -> dict:
    """Garantisce l'esistenza del documento azienda; lo crea con un nome di default se manca."""
    doc = await db.organizations.find_one({"org_id": org_id}, {"_id": 0})
    if not doc:
        default_name = name or ("Sede principale" if org_id == ORG_DEFAULT else "La mia azienda")
        doc = {"org_id": org_id, "name": default_name, "created_by": None, "created_at": now_iso()}
        await db.organizations.insert_one(dict(doc))
        doc.pop("_id", None)
    return doc


def _is_owner(user: dict) -> bool:
    return (user.get("email") or "").strip().lower() in OWNER_EMAILS


async def _user_memberships(user: dict) -> list:
    """org_id a cui il Capo appartiene. Include sempre l'azienda attiva."""
    mem = list(user.get("memberships") or [])
    active = _org_id(user)
    if active not in mem:
        mem.append(active)
    return mem


@api_router.get("/orgs")
async def orgs_list(admin: dict = Depends(require_admin)):
    """Elenco aziende accessibili dal Capo (o TUTTE se Owner) + azienda attiva."""
    active = _org_id(admin)
    owner = _is_owner(admin)
    if owner:
        docs = await db.organizations.find({}, {"_id": 0}).sort("created_at", 1).to_list(500)
        # Garantisce che l'azienda di default esista sempre nell'elenco.
        if not any(d.get("org_id") == ORG_DEFAULT for d in docs):
            docs.insert(0, await _ensure_org_doc(ORG_DEFAULT))
        # Aziende referenziate dagli utenti ma senza documento (es. registrazioni recenti).
        known = {d["org_id"] for d in docs}
        async for u in db.users.find({}, {"_id": 0, "organization_id": 1, "memberships": 1}):
            for oid in ([u.get("organization_id")] + list(u.get("memberships") or [])):
                if oid and oid not in known:
                    docs.append(await _ensure_org_doc(oid)); known.add(oid)
        org_ids = [d["org_id"] for d in docs]
    else:
        org_ids = await _user_memberships(admin)
        docs = []
        for oid in org_ids:
            docs.append(await _ensure_org_doc(oid))
    out = []
    for d in docs:
        oid = d["org_id"]
        out.append({"org_id": oid, "name": d.get("name") or oid,
                    "is_active": oid == active,
                    "is_owned": bool(d.get("created_by") and d.get("created_by") == admin.get("user_id")) or owner})
    return {"orgs": out, "active_org": active, "is_owner": owner}


class OrgCreateReq(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)


@api_router.post("/orgs")
async def orgs_create(body: OrgCreateReq, admin: dict = Depends(require_admin)):
    """Crea una nuova azienda — SOLO l'owner (MikiLab è mono-azienda: un Capo non può creare aziende aggiuntive)."""
    if not _is_owner(admin):
        raise HTTPException(status_code=403, detail="Solo il proprietario può creare nuove aziende.")
    name = (body.name or "").strip()[:80]
    if not name:
        raise HTTPException(status_code=400, detail="Nome azienda richiesto")
    org_id = f"org_{_uuid.uuid4().hex[:12]}"
    doc = {"org_id": org_id, "name": name, "created_by": admin.get("user_id"), "created_at": now_iso()}
    await db.organizations.insert_one(dict(doc))
    await db.users.update_one({"user_id": admin["user_id"]}, {"$addToSet": {"memberships": org_id}})
    return {"ok": True, "org": {"org_id": org_id, "name": name, "is_active": False, "is_owned": True}}


class OrgSwitchReq(BaseModel):
    org_id: str = Field(..., max_length=60)


@api_router.post("/orgs/switch")
async def orgs_switch(body: OrgSwitchReq, admin: dict = Depends(require_admin)):
    """Cambia l'azienda attiva della sessione. Consentito solo verso aziende di appartenenza (Owner: qualsiasi)."""
    target = (body.org_id or "").strip()
    if not target:
        raise HTTPException(status_code=400, detail="Azienda mancante")
    allowed = _is_owner(admin) or (target in await _user_memberships(admin))
    if not allowed:
        raise HTTPException(status_code=403, detail="Azienda non consentita")
    await _ensure_org_doc(target)
    await db.users.update_one({"user_id": admin["user_id"]},
                              {"$set": {"organization_id": target}, "$addToSet": {"memberships": target}})
    doc = await db.organizations.find_one({"org_id": target}, {"_id": 0})
    return {"ok": True, "active_org": target, "name": (doc or {}).get("name") or target}


class OrgRenameReq(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)


@api_router.patch("/orgs/{org_id}")
async def orgs_rename(org_id: str, body: OrgRenameReq, admin: dict = Depends(require_admin)):
    allowed = _is_owner(admin) or (org_id in await _user_memberships(admin))
    if not allowed:
        raise HTTPException(status_code=403, detail="Azienda non consentita")
    name = (body.name or "").strip()[:80]
    if not name:
        raise HTTPException(status_code=400, detail="Nome azienda richiesto")
    await _ensure_org_doc(org_id)
    await db.organizations.update_one({"org_id": org_id}, {"$set": {"name": name, "updated_at": now_iso()}})
    return {"ok": True, "org_id": org_id, "name": name}


# ===========================================================================
# INVITI OPERAIO VIA LINK — il Capo genera un link; l'operaio sceglie nome + PIN
# ===========================================================================
class FloorInviteReq(BaseModel):
    days: int = Field(30, ge=1, le=365)
    max_uses: Optional[int] = Field(None, ge=1, le=500)   # None = riutilizzabile senza limite fino a scadenza
    note: Optional[str] = Field("", max_length=80)


@api_router.post("/floor-invites")
async def floor_invite_create(body: FloorInviteReq, admin: dict = Depends(require_admin)):
    """Genera un link d'invito per la Produzione, legato all'azienda attiva del Capo."""
    token = _secrets.token_urlsafe(16)
    org = _org_id(admin)
    doc = {"token": token, "organization_id": org, "created_by": admin.get("user_id"),
           "created_at": now_iso(),
           "expires_at": (datetime.now(timezone.utc) + timedelta(days=int(body.days))).isoformat(),
           "max_uses": (int(body.max_uses) if body.max_uses else None), "uses": 0,
           "note": (body.note or "")[:80], "active": True}
    await db.floor_invites.insert_one(dict(doc))
    return {"ok": True, "token": token, "expires_at": doc["expires_at"], "max_uses": doc["max_uses"]}


@api_router.get("/floor-invites")
async def floor_invite_list(admin: dict = Depends(require_admin)):
    docs = await db.floor_invites.find({"organization_id": _org_id(admin)}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"invites": docs}


@api_router.post("/floor-invites/{token}/revoke")
async def floor_invite_revoke(token: str, admin: dict = Depends(require_admin)):
    await db.floor_invites.update_one({"token": token, "organization_id": _org_id(admin)}, {"$set": {"active": False, "revoked_at": now_iso()}})
    return {"ok": True}


async def _valid_floor_invite(token: str):
    if not token:
        return None
    inv = await db.floor_invites.find_one({"token": token, "active": True}, {"_id": 0})
    if not inv:
        return None
    if inv.get("expires_at") and now_iso() > inv["expires_at"]:
        return None
    mx = inv.get("max_uses")
    if mx is not None and int(inv.get("uses", 0)) >= int(mx):
        return None
    return inv


@api_router.get("/public/floor-invite/{token}")
async def floor_invite_info(token: str):
    """Pagina d'atterraggio dell'invito (pubblica): nome azienda + validita'."""
    inv = await _valid_floor_invite(token)
    if not inv:
        return {"ok": False, "valid": False}
    org_doc = await db.organizations.find_one({"org_id": inv["organization_id"]}, {"_id": 0}) or {}
    return {"ok": True, "valid": True, "org_name": org_doc.get("name") or "MikiLab",
            "note": inv.get("note") or ""}


class FloorRedeemReq(BaseModel):
    name: str = Field(..., min_length=1, max_length=40)
    pin: str = Field(..., min_length=4, max_length=6)


@api_router.post("/public/floor-invite/{token}/redeem")
async def floor_invite_redeem(token: str, body: FloorRedeemReq, request: Request, response: Response):
    """L'operaio riscatta l'invito: crea il PIN personale nella sua azienda ed entra in Produzione."""
    if not await _rate_limit("floor_invite_redeem", _client_ip(request), 12, 300):
        raise HTTPException(status_code=429, detail="Troppi tentativi. Riprova tra qualche minuto.")
    inv = await _valid_floor_invite(token)
    if not inv:
        raise HTTPException(status_code=410, detail="Invito non valido o scaduto")
    org = inv["organization_id"]
    nm = (body.name or "").strip()[:40]
    pin = _norm_pin(body.pin)
    if not nm or not pin:
        raise HTTPException(status_code=400, detail="Nome e PIN (4 cifre) richiesti")
    # PIN gia' in uso nell'azienda? (evita collisioni tra operai della stessa azienda)
    async for d in db.operator_pins.find({"active": True, "organization_id": org}, {"_id": 0, "hash": 1}):
        if _check_pw(pin, d.get("hash", "")):
            raise HTTPException(status_code=409, detail="PIN gia' in uso in questa azienda. Scegline un altro.")
    key = {"name_key": nm.lower(), "organization_id": org}
    doc = {"name_key": nm.lower(), "name": nm, "hash": _hash_pw(pin), "level": "novizio",
           "active": True, "updated_at": now_iso(), "organization_id": org, "via_invite": token}
    await db.operator_pins.update_one(key, {"$set": doc, "$unset": {"expires_at": "", "ttl_hours": "", "revoked_at": ""}}, upsert=True)
    await db.floor_invites.update_one({"token": token}, {"$inc": {"uses": 1}, "$set": {"last_used_at": now_iso()}})
    # Rilascia subito il cookie del cancello a livello OPERAIO per l'azienda giusta.
    cfg = await db.app_meta.find_one({"_key": "gate_config"}, {"_id": 0})
    ttl_days = int((cfg or {}).get("ttl_days") or (GATE_TTL // 86400))
    ttl_days = max(1, min(ttl_days, 365))
    ttl = ttl_days * 86400
    response.set_cookie(GATE_COOKIE, issue_gate_token(ttl, org), httponly=True, secure=True, samesite="lax", path="/", max_age=ttl)
    await _log_access("operator", _client_ip(request), True, nm)
    return {"ok": True, "level": "operator", "name": nm, "operator_level": "novizio"}
