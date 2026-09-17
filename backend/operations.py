# ruff: noqa: F821  (i nomi sono iniettati a runtime dal core via lo shim globals().update)
"""MikiLab Pro — Modulo Operazioni & Logistica.
Reparti dinamici, consegne (Lieferung), negozi, ordini, turni, magazzino,
sessioni impasto / day-after, chiusura giornata + PDF, sensori IoT / allarmi termici.
Refactoring puro: codice spostato da server.py, comportamento INVARIATO.
Le rotte sono registrate sullo stesso `api_router` del core (server.py).
"""
import server as _core
globals().update({k: v for k, v in vars(_core).items() if not k.startswith("__")})

# ---- Reparti Dinamici (custom) + funzioni extra ----
BASE_DEPT_IDS = {"panetteria", "pizzeria", "pasticceria"}


# ---- Logistica Consegne (Lieferung) ----
# Le rotte /deliveries sono definite nel core (server.py): nessuna versione duplicata qui.




# ---- Ceste Smart (smistamento rapido per negozio) ----


class CrateReq(BaseModel):
    store_name: str = Field(..., max_length=120)
    driver: Optional[str] = Field("", max_length=80)




class CrateItemReq(BaseModel):
    item: str = Field(..., max_length=80)




class CrateDriverReq(BaseModel):
    driver: str = Field(..., max_length=80)








@api_router.post("/operator/delegation")
async def create_delegation(user: dict = Depends(require_admin)):
    code = uuid.uuid4().hex[:8].upper()
    exp = (datetime.now(timezone.utc) + timedelta(hours=8)).isoformat()
    doc = {"code": code, "created_by": user.get("user_id"), "created_at": now_iso(), "used_by": None, "used_by_name": None, "used_at": None, "role": "sostituto", "kind": "delega", "expires_at": exp}
    await db.operator_invites.insert_one(doc)
    return {"code": code, "expires_at": exp}


class OpProfileReq(BaseModel):
    display_name: Optional[str] = Field("", max_length=80)
    department: Optional[str] = Field("", max_length=40)


@api_router.get("/operator/profile")
async def get_operator_profile(user: dict = Depends(current_user)):
    u = await db.users.find_one({"user_id": user.get("user_id")}, {"_id": 0, "operator_name": 1, "department": 1, "role": 1})
    return u or {}


@api_router.post("/operator/profile")
async def set_operator_profile(body: OpProfileReq, user: dict = Depends(current_user)):
    await db.users.update_one({"user_id": user.get("user_id")}, {"$set": {"operator_name": (body.display_name or "").strip(), "department": (body.department or "").strip()}})
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
    doc["organization_id"] = _org_id(user)
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
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=session, system_message=system).with_model("anthropic", SITOR_BRAIN)
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
# ---------------------------------------------------------------------------
# MAGAZZINO (giacenze materie prime) + CHIUSURA GIORNATA
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
    org = _org_id(user)
    docs = await db.inventory_items.find({"owner_id": user["user_id"], "organization_id": org}, {"_id": 0}).sort("name", 1).to_list(500)
    return {"items": [_inv_public(d) for d in docs]}


@api_router.put("/inventory")
async def inventory_save(body: InventorySave, user: dict = Depends(current_user)):
    uid = user["user_id"]
    org = _org_id(user)
    await db.inventory_items.delete_many({"owner_id": uid, "organization_id": org})
    docs = []
    for it in body.items:
        docs.append({"id": it.id or str(uuid.uuid4()), "owner_id": uid, "organization_id": org, "name": it.name.strip(),
                     "category": it.category, "qty": float(it.qty or 0), "unit": it.unit,
                     "lot": (it.lot or "").strip(), "threshold": it.threshold, "updated_at": now_iso()})
    if docs:
        await db.inventory_items.insert_many(docs)
    await _notify_low_stock(uid, user.get("email"), org=org)
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


async def _notify_low_stock(uid: str, email: Optional[str], lang: str = "it", org: str = None):
    """Invia UNA email quando una materia prima scende sotto soglia (finché non viene rifornita)."""
    q = {"owner_id": uid, "threshold": {"$ne": None}}
    if org:
        q["organization_id"] = org
    items = await db.inventory_items.find(q).to_list(500)
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
    org = _org_id(user)
    now = now_iso()
    # 1) Scarico magazzino (match per nome, fuzzy come il freezer)
    deducted = []
    if body.consume:
        inv = await db.inventory_items.find({"owner_id": uid, "organization_id": org}).to_list(500)
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
                        await db.inventory_items.update_one({"id": it["id"], "owner_id": uid, "organization_id": org},
                            {"$set": {"qty": newq, "updated_at": now}})
                        it["qty"] = newq
                        deducted.append({"name": it["name"], "qty": take, "unit": it.get("unit", "kg"), "remaining": newq})
                    break
    # 2) Archivia chiusura
    rec = {"id": str(uuid.uuid4()), "owner_id": uid, "organization_id": org, "date": now[:10], "closed_at": now,
           "produced": body.produced, "consume": body.consume, "deducted": deducted, "temps": body.temps,
           "cleaning": body.cleaning, "anomalies": body.anomalies, "operator": body.operator,
           "note": body.note, "production_lot": body.production_lot, "signature": body.signature or ""}
    await db.day_closures.insert_one(rec)
    rec.pop("_id", None)
    # Avviso scorte basse via email (se qualche materia è scesa sotto soglia con lo scarico)
    await _notify_low_stock(uid, user.get("email"), body.lang, org=org)
    return {"ok": True, "closure": {k: rec[k] for k in rec if k != "owner_id"}, "deducted": deducted}


@api_router.get("/day-close/last")
async def day_close_last(user: dict = Depends(current_user)):
    d = await db.day_closures.find_one({"owner_id": user["user_id"], "organization_id": _org_id(user)}, {"_id": 0, "owner_id": 0}, sort=[("closed_at", -1)])
    return d or {}


@api_router.get("/day-close/list")
async def day_close_list(user: dict = Depends(current_user)):
    docs = await db.day_closures.find({"owner_id": user["user_id"], "organization_id": _org_id(user)}, {"_id": 0, "owner_id": 0}).sort("closed_at", -1).to_list(500)
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
        "title": "Registro Chiusura Turno" if not de else "Schichtabschluss",
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
    c = await db.day_closures.find_one({"id": closure_id, "owner_id": user["user_id"], "organization_id": _org_id(user)}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Chiusura non trovata")
    pdf = await asyncio.to_thread(_build_closure_pdf, c, lang)
    fname = f"chiusura_{c.get('date','')}_{(c.get('production_lot') or 'lotto')}.pdf".replace(" ", "_")
    return Response(content=pdf, media_type="application/pdf",
                    headers={"Content-Disposition": f'inline; filename="{fname}"'})

# ---- IoT Thermal Guard: sensori reali + storico allarmi (globale, device-friendly) ----
class SensorReading(BaseModel):
    id: str
    temp: float
    unit: Optional[str] = "°C"

SENSOR_MAX = {"forno": 230, "cella": 6, "freezer": -15, "frigo": 6}
SENSOR_NAME = {"forno": "Forno Rotativo", "cella": "Armadio Fermo-Lievitazione", "freezer": "Freezer", "frigo": "Frigorifero"}

@api_router.post("/sensors/reading")
async def push_sensor_reading(body: SensorReading):
    """Endpoint per sonde IoT reali (Milesight/Efento/PT100...): spinge una lettura."""
    await db.sensor_state.update_one(
        {"_key": "mikilab_sensors"},
        {"$set": {f"readings.{body.id}": {"temp": body.temp, "unit": body.unit or "°C", "at": datetime.now(timezone.utc).isoformat()}}},
        upsert=True,
    )
    # Allarme termico -> notifica push a tutti (anche ad app chiusa)
    mx = SENSOR_MAX.get(body.id)
    alarm = mx is not None and body.temp > mx
    if alarm:
        last = await db.sensor_state.find_one({"_key": "mikilab_sensors"}, {"_id": 0, f"alarmed.{body.id}": 1})
        already = (last or {}).get("alarmed", {}).get(body.id)
        if not already:
            await db.sensor_state.update_one({"_key": "mikilab_sensors"}, {"$set": {f"alarmed.{body.id}": True}}, upsert=True)
            try:
                _, priv = await _get_vapid()
                subs = await db.push_subs.find({}, {"_id": 0}).to_list(500)
                payload = {"title": "⚠️ Allarme termico MikiLab", "body": f"{SENSOR_NAME.get(body.id, body.id)}: {body.temp}°C (max {mx}°C)"}
                for s in subs:
                    await asyncio.to_thread(_send_push, s, payload, priv)
            except Exception:
                pass
    elif mx is not None:
        await db.sensor_state.update_one({"_key": "mikilab_sensors"}, {"$set": {f"alarmed.{body.id}": False}}, upsert=True)
    return {"ok": True, "alarm": bool(alarm)}

@api_router.get("/sensors/latest")
async def get_sensors_latest():
    doc = await db.sensor_state.find_one({"_key": "mikilab_sensors"}, {"_id": 0})
    return {"readings": (doc or {}).get("readings", {})}

@api_router.get("/alarms")
async def get_alarms():
    doc = await db.alarm_log.find_one({"_key": "mikilab_alarms"}, {"_id": 0})
    return {"items": (doc or {}).get("items", [])}

@api_router.put("/alarms")
async def put_alarms(body: dict):
    items = body.get("items", [])
    if not isinstance(items, list):
        items = []
    await db.alarm_log.update_one(
        {"_key": "mikilab_alarms"},
        {"$set": {"items": items[:100], "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"ok": True, "count": len(items[:100])}


# ---------------------------------------------------------------------------
# SITOR · FORGIA IMMAGINI — generazione AI (gpt-image-1) con chiave universale.
# Il Capo dà solo un'idea (punto di riferimento); Sitor la forgia in un'immagine
# perfetta e on-brand (panificio industriale dark, blu petrolio + arancio).
# ---------------------------------------------------------------------------
class ImageGenReq(BaseModel):
    prompt: str
    kind: str = "prodotto"  # prodotto | ricetta | avatar | marketing
    lang: str = "it"


_SITOR_STYLE = (
    "Stile: panificio industriale dark-mode, palette blu petrolio e arancione energetico, "
    "luce calda del forno a legna, fotorealistico, cinematografico, altissimo dettaglio, "
    "polvere di farina sospesa, atmosfera sacra dell'arte bianca."
)


@api_router.post("/image/generate")
async def image_generate(body: ImageGenReq, admin: dict = Depends(require_admin)):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=503, detail="Generazione immagini non configurata")
    prompt = (body.prompt or "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Descrivi l'immagine da creare")
    import base64 as _b64
    from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
    gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
    full = f"{prompt}. {_SITOR_STYLE}"
    try:
        images = await gen.generate_images(prompt=full, model="gpt-image-1", number_of_images=1)
    except Exception as e:
        logger.warning("Image generate fallita (%s)", str(e)[:150])
        raise HTTPException(status_code=424, detail="Sitor non è riuscito a forgiare l'immagine. Riprova.")
    if not images:
        raise HTTPException(status_code=500, detail="Nessuna immagine generata")
    return {"image_base64": _b64.b64encode(images[0]).decode(), "kind": body.kind, "prompt": prompt}





# ---- Web Push allarmi termici: riusa il sistema VAPID esistente ----
