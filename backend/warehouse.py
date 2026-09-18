# ruff: noqa: F821  (i nomi sono iniettati a runtime dal core via lo shim globals().update)
"""MikiLab Pro — Modulo Magazzino / Silos / Celle di lievitazione / Flotta AGV.
Refactoring puro: codice spostato da server.py, comportamento INVARIATO.
Le rotte sono registrate sullo stesso `api_router` del core (server.py).
"""
import server as _core
# Eredita l'intero namespace del core (db, api_router, helper condivisi, modelli, costanti...).
globals().update({k: v for k, v in vars(_core).items() if not k.startswith("__")})

# --- Silos & Materie Prime: calo peso, micro-ordini auto, compensazione umidità farina ---
_SILO_SEED = [
    {"id": "silo-00", "name": "Farina Tipo 00", "ingredient": "farina", "capacity_kg": 1500, "current_kg": 420, "min_kg": 300, "drain_rate_kg_h": 55, "humidity_pct": 14.5, "is_flour": True},
    {"id": "silo-integrale", "name": "Farina Integrale", "ingredient": "farina", "capacity_kg": 1000, "current_kg": 260, "min_kg": 250, "drain_rate_kg_h": 30, "humidity_pct": 15.2, "is_flour": True},
    {"id": "silo-segale", "name": "Farina di Segale", "ingredient": "farina", "capacity_kg": 800, "current_kg": 610, "min_kg": 200, "drain_rate_kg_h": 18, "humidity_pct": 13.8, "is_flour": True},
    {"id": "silo-zucchero", "name": "Zucchero", "ingredient": "zucchero", "capacity_kg": 500, "current_kg": 140, "min_kg": 120, "drain_rate_kg_h": 8, "humidity_pct": 0.2, "is_flour": False},
]


async def _seed_silos(org: str = ORG_DEFAULT):
    if await db.silos.count_documents({"organization_id": org}) == 0:
        for i, s in enumerate(_SILO_SEED):
            d = dict(s)
            d["organization_id"] = org
            d["order"] = i
            await db.silos.insert_one(d)


_SILO_PRESETS = {
    "panificio": [
        {"name": "Farina Tipo 0", "ingredient": "farina", "capacity_kg": 1500, "current_kg": 1200, "min_kg": 300, "humidity_pct": 14.5, "is_flour": True},
        {"name": "Farina Tipo 00", "ingredient": "farina", "capacity_kg": 1500, "current_kg": 1000, "min_kg": 300, "humidity_pct": 14.2, "is_flour": True},
        {"name": "Farina Integrale", "ingredient": "farina", "capacity_kg": 1000, "current_kg": 700, "min_kg": 250, "humidity_pct": 15.0, "is_flour": True},
        {"name": "Farina di Segale", "ingredient": "farina", "capacity_kg": 800, "current_kg": 500, "min_kg": 200, "humidity_pct": 13.8, "is_flour": True},
        {"name": "Sale", "ingredient": "sale", "capacity_kg": 300, "current_kg": 200, "min_kg": 60, "humidity_pct": 0.1, "is_flour": False},
    ],
    "pizzeria": [
        {"name": "Farina Tipo 00 Pizza", "ingredient": "farina", "capacity_kg": 1500, "current_kg": 1200, "min_kg": 300, "humidity_pct": 14.0, "is_flour": True},
        {"name": "Farina Manitoba", "ingredient": "farina", "capacity_kg": 1000, "current_kg": 800, "min_kg": 250, "humidity_pct": 14.5, "is_flour": True},
        {"name": "Semola Rimacinata", "ingredient": "semola", "capacity_kg": 800, "current_kg": 500, "min_kg": 150, "humidity_pct": 13.5, "is_flour": True},
        {"name": "Sale", "ingredient": "sale", "capacity_kg": 300, "current_kg": 200, "min_kg": 60, "humidity_pct": 0.1, "is_flour": False},
    ],
    "pasticceria": [
        {"name": "Farina Debole (biscotti)", "ingredient": "farina", "capacity_kg": 1000, "current_kg": 700, "min_kg": 200, "humidity_pct": 14.0, "is_flour": True},
        {"name": "Farina Forte (lievitati)", "ingredient": "farina", "capacity_kg": 1000, "current_kg": 700, "min_kg": 200, "humidity_pct": 14.3, "is_flour": True},
        {"name": "Zucchero Semolato", "ingredient": "zucchero", "capacity_kg": 500, "current_kg": 350, "min_kg": 120, "humidity_pct": 0.2, "is_flour": False},
        {"name": "Zucchero a Velo", "ingredient": "zucchero", "capacity_kg": 300, "current_kg": 180, "min_kg": 80, "humidity_pct": 0.2, "is_flour": False},
    ],
}


class SiloPresetReq(BaseModel):
    activity: str = "panificio"


@api_router.post("/mike/silos/preset")
async def mike_silos_preset(body: SiloPresetReq, admin: dict = Depends(require_admin)):
    """Precarica i silos tipici dell'attività scelta (salta quelli già presenti per nome)."""
    import uuid as _uuid
    org = _org_id(admin)
    await _seed_silos(org)
    act = (body.activity or "panificio").strip().lower()
    preset = _SILO_PRESETS.get(act, _SILO_PRESETS["panificio"])
    existing = {(s.get("name") or "").strip().lower() for s in await db.silos.find({"organization_id": org}, {"name": 1, "_id": 0}).to_list(200)}
    last = await db.silos.find({"organization_id": org}, {"order": 1, "_id": 0}).sort("order", -1).limit(1).to_list(1)
    nxt = int((last[0].get("order", 0) if last else 0)) + 1
    added = 0
    for i, p in enumerate(preset):
        if p["name"].strip().lower() in existing:
            continue
        d = dict(p)
        d.update({"id": "silo-" + _uuid.uuid4().hex[:8], "drain_rate_kg_h": 0.0,
                  "organization_id": org, "created_at": now_iso(), "order": nxt + i})
        await db.silos.insert_one(d)
        added += 1
    return {"ok": True, "added": added, "activity": act}


class SiloReorderReq(BaseModel):
    order: List[str] = []


@api_router.put("/mike/silos/reorder")
async def mike_silos_reorder(body: SiloReorderReq, admin: dict = Depends(require_admin)):
    """Il Capo trascina i silos nell'ordine in cui li usa: l'ordine viene salvato."""
    org = _org_id(admin)
    for pos, sid in enumerate(body.order or []):
        await db.silos.update_one({"id": sid, "organization_id": org}, {"$set": {"order": pos}})
    return {"ok": True}


@api_router.get("/mike/silos")
async def mike_silos(lang: str = "it", admin: dict = Depends(require_admin)):
    """Monitor silos: autonomia oraria dal calo peso, micro-ordini automatici sotto soglia,
    e compensazione dell'umidità della farina (correzione % acqua in ricetta)."""
    await _seed_silos(_org_id(admin))
    it = (lang or "it").startswith("it")
    docs = await db.silos.find({"organization_id": _org_id(admin)}, {"_id": 0}).to_list(100)
    # Ordine scelto dal Capo (trascinamento); i vecchi documenti senza "order" restano in fondo ma stabili.
    docs.sort(key=lambda s: (s.get("order", 9999), s.get("created_at", ""), s.get("id", "")))
    # Soglia intelligente: se il Capo ha attivato l'auto-soglia, allineo min_kg ai consumi reali.
    _cfg = await _reorder_config(_org_id(admin))
    if _cfg.get("auto_threshold"):
        for s in docs:
            sm = await _smart_threshold(_org_id(admin), s.get("name", ""))
            if sm["smart_min_kg"] > 0 and abs(sm["smart_min_kg"] - float(s.get("min_kg") or 0)) >= 1:
                s["min_kg"] = sm["smart_min_kg"]
                await db.silos.update_one({"id": s["id"], "organization_id": _org_id(admin)}, {"$set": {"min_kg": sm["smart_min_kg"]}})
    out = []
    reorder = 0
    for s in docs:
        cur = float(s.get("current_kg") or 0)
        mn = float(s.get("min_kg") or 0)
        rate = float(s.get("drain_rate_kg_h") or 0)
        autonomy_h = round(cur / rate, 1) if rate > 0 else None
        needs = cur <= mn
        if needs:
            reorder += 1
        # Compensazione umidità: baseline farina 14%; +1% umidità → -0.6% acqua in impasto.
        water_adjust = None
        if s.get("is_flour"):
            water_adjust = round((14.0 - float(s.get("humidity_pct") or 14.0)) * 0.6, 1)
        out.append({**s, "autonomy_h": autonomy_h, "needs_reorder": needs, "water_adjust_pct": water_adjust,
                    "fill_pct": round(cur / float(s.get("capacity_kg") or 1) * 100, 0)})
    spoken = ""
    if reorder:
        spoken = (f"{reorder} silos sotto soglia: genero i micro-ordini di rifornimento." if it else
                  f"{reorder} silos below threshold: generating restock micro-orders.")
        try:
            await _propose_reorder(admin, [{"name": s.get("name"), "current": float(s.get("current_kg") or 0),
                                            "min": float(s.get("min_kg") or 0), "capacity": float(s.get("capacity_kg") or 0)}
                                           for s in docs if float(s.get("current_kg") or 0) <= float(s.get("min_kg") or 0)], "silos")
        except Exception as e:
            logging.warning("silos reorder proposal fail (%s)", str(e)[:120])
    return {"silos": out, "reorder_count": reorder, "spoken": spoken}


class SiloUpdateReq(BaseModel):
    name: Optional[str] = None
    current_kg: Optional[float] = None
    humidity_pct: Optional[float] = None
    drain_rate_kg_h: Optional[float] = None
    capacity_kg: Optional[float] = None
    min_kg: Optional[float] = None


class SiloCreateReq(BaseModel):
    name: str = ""
    ingredient: str = "farina"
    capacity_kg: float = 1000
    current_kg: float = 0
    min_kg: float = 200
    humidity_pct: float = 14.0
    is_flour: bool = True


@api_router.post("/mike/silos")
async def mike_silo_create(body: SiloCreateReq, admin: dict = Depends(require_admin)):
    """Il Capo aggiunge un silo reale del proprio laboratorio."""
    import uuid as _uuid
    nm = (body.name or "").strip()
    if not nm:
        raise HTTPException(400, "Nome silo richiesto")
    org = _org_id(admin)
    await _seed_silos(org)
    last = await db.silos.find({"organization_id": org}, {"order": 1, "_id": 0}).sort("order", -1).limit(1).to_list(1)
    nxt = int((last[0].get("order", 0) if last else 0)) + 1
    doc = {"id": "silo-" + _uuid.uuid4().hex[:8], "name": nm[:80], "ingredient": (body.ingredient or "farina").strip()[:40],
           "capacity_kg": float(body.capacity_kg or 0), "current_kg": float(body.current_kg or 0),
           "min_kg": float(body.min_kg or 0), "drain_rate_kg_h": 0.0, "humidity_pct": float(body.humidity_pct or 0),
           "is_flour": bool(body.is_flour), "organization_id": org, "created_at": now_iso(), "order": nxt}
    await db.silos.insert_one({**doc})
    return {"ok": True, "id": doc["id"]}


@api_router.put("/mike/silos/{sid}")
async def mike_silo_update(sid: str, body: SiloUpdateReq, admin: dict = Depends(require_admin)):
    upd = {}
    for k, v in body.model_dump(exclude_none=True).items():
        upd[k] = v.strip()[:80] if k == "name" else float(v)
    if upd:
        await db.silos.update_one({"id": sid, "organization_id": _org_id(admin)}, {"$set": upd})
    return {"ok": True}


@api_router.delete("/mike/silos/{sid}")
async def mike_silo_delete(sid: str, admin: dict = Depends(require_admin)):
    await db.silos.delete_one({"id": sid, "organization_id": _org_id(admin)})
    return {"ok": True}


@api_router.post("/mike/silos/microorder")
async def mike_silo_microorder(admin: dict = Depends(require_admin)):
    """Genera micro-ordini per tutti i silos sotto soglia e li rabbocca (simulazione fornitore)."""
    await _seed_silos(_org_id(admin))
    docs = await db.silos.find({"organization_id": _org_id(admin)}, {"_id": 0}).to_list(100)
    created = []
    for s in docs:
        if float(s.get("current_kg") or 0) <= float(s.get("min_kg") or 0):
            qty = round(float(s.get("capacity_kg") or 0) * 0.8 - float(s.get("current_kg") or 0), 0)
            created.append({"silo": s["name"], "qty_kg": qty})
            await db.silos.update_one({"id": s["id"], "organization_id": _org_id(admin)}, {"$set": {"current_kg": round(float(s.get("capacity_kg") or 0) * 0.8, 0), "last_order_at": now_iso()}})
    # Invio email al fornitore (Resend). Destinatario: SILO_SUPPLIER_EMAIL o l'email del Capo.
    emailed = False
    sup_doc = (await db.app_meta.find_one({"_key": "silo_supplier"}, {"_id": 0})) or {}
    supplier = sup_doc.get("email") or os.environ.get("SILO_SUPPLIER_EMAIL") or admin.get("email")
    if created and RESEND_API_KEY and supplier:
        rows = "".join(f"<tr><td style='padding:6px 12px;border-bottom:1px solid #eee'>{o['silo']}</td><td style='padding:6px 12px;border-bottom:1px solid #eee;text-align:right'><b>{o['qty_kg']:g} kg</b></td></tr>" for o in created)
        html = (f"<div style='font-family:sans-serif;max-width:520px'><h2 style='color:#3f7cac'>MikiLab · Micro-ordine rifornimento silos</h2>"
                f"<p>Rifornimento automatico richiesto per {len(created)} silos sotto soglia:</p>"
                f"<table style='width:100%;border-collapse:collapse'>{rows}</table>"
                f"<p style='color:#888;font-size:12px'>Generato automaticamente da Sitor AI · {now_iso()[:16]}</p></div>")
        try:
            await asyncio.to_thread(_resend.Emails.send, {"from": f"MikiLab <{SENDER_EMAIL}>", "to": [supplier],
                                                          "subject": "MikiLab · Micro-ordine rifornimento silos", "html": html})
            emailed = True
        except Exception as e:
            logging.warning("silo microorder email fail (%s)", str(e)[:120])
    return {"ok": True, "orders": created, "count": len(created), "emailed": emailed, "supplier": supplier if emailed else None}


# --- Celle di lievitazione: curve multi-stadio adattive alla disponibilità forni ---
@api_router.get("/mike/proofing")
async def mike_proofing(free_ovens: int = -1, lang: str = "it", admin: dict = Depends(require_admin)):
    """Curva di lievitazione MULTI-STADIO che ACCELERA o FRENA in base ai forni liberi:
    pochi forni → frena (temp più bassa, tempi lunghi); molti forni → accelera."""
    it = (lang or "it").startswith("it")
    R = lambda i, e: (i if it else e)  # noqa: E731
    # Se free_ovens non passato, deriva dalla telemetria (forni non in stress alto = liberi).
    if free_ovens < 0:
        tele = await mike_telemetry(lang, admin)
        free_ovens = sum(1 for k, v in tele["machines"].items() if k.startswith("forno") and v["level"] != "alto")
    if free_ovens <= 0:
        mode, tfac, dfac = "frena", 0.92, 1.5
    elif free_ovens == 1:
        mode, tfac, dfac = "neutro", 1.0, 1.0
    else:
        mode, tfac, dfac = "accelera", 1.08, 0.7
    base = [
        {"stage": R("Pre-lievitazione", "Pre-proof"), "temp": 24, "humidity": 70, "minutes": 40},
        {"stage": R("Lievitazione", "Bulk proof"), "temp": 27, "humidity": 75, "minutes": 60},
        {"stage": R("Appretto finale", "Final proof"), "temp": 30, "humidity": 80, "minutes": 45},
    ]
    stages = [{"stage": s["stage"], "temp_c": round(s["temp"] * tfac, 1), "humidity_pct": s["humidity"],
               "minutes": round(s["minutes"] * dfac)} for s in base]
    total = sum(s["minutes"] for s in stages)
    label = {"frena": R("FRENA (forni occupati)", "BRAKE (ovens busy)"), "neutro": R("NEUTRO", "NEUTRAL"),
             "accelera": R("ACCELERA (forni liberi)", "ACCELERATE (ovens free)")}[mode]
    spoken = R(f"Forni liberi: {free_ovens}. Curva in modalità {label}, totale {total} minuti.",
               f"Free ovens: {free_ovens}. Curve in {label} mode, total {total} minutes.")
    oven_ready_at = (datetime.now(timezone.utc) + timedelta(minutes=total)).strftime("%H:%M")
    return {"mode": mode, "mode_label": label, "free_ovens": free_ovens, "stages": stages, "total_minutes": total, "oven_ready_at": oven_ready_at, "spoken": spoken}


@api_router.post("/mike/proofing/sync-plan")
async def mike_proofing_sync(free_ovens: int = -1, lang: str = "it", admin: dict = Depends(require_admin)):
    """Sync Celle→Piano: dalla curva delle celle ricalcola gli orari di INFORNATA dei lotti
    di produzione attivi (scaglionati di 15') e aggiorna il piano del giorno."""
    curve = await mike_proofing(free_ovens, lang, admin)
    base = datetime.now(timezone.utc) + timedelta(minutes=curve["total_minutes"])
    tasks = await db.team_tasks.find({"status": "active", "kind": "produzione", "organization_id": _org_id(admin)}, {"_id": 0}).sort("start", 1).to_list(200)
    updated = 0
    for i, tk in enumerate(tasks):
        new_start = (base + timedelta(minutes=15 * i)).strftime("%H:%M")
        await db.team_tasks.update_one({"id": tk["id"], "organization_id": _org_id(admin)}, {"$set": {"start": new_start}})
        updated += 1
    it = (lang or "it").startswith("it")
    return {"ok": True, "updated": updated, "oven_ready_at": curve["oven_ready_at"], "total_minutes": curve["total_minutes"],
            "message": (f"{updated} lotti riprogrammati: prima infornata alle {curve['oven_ready_at']}." if it else
                        f"{updated} batches rescheduled: first bake at {curve['oven_ready_at']}.")}


# --- Flotta AGV: routing autonomo + rilevamento acustico preventivo guasti ---
_AGV_ROUTES = [("impasto", "cella"), ("cella", "forno1"), ("forno1", "banco1"), ("banco2", "cella"), ("forno2", "banco2")]
_AGV_SEED = [
    {"id": "agv-1", "name": "AGV-1", "battery_pct": 82},
    {"id": "agv-2", "name": "AGV-2", "battery_pct": 64},
    {"id": "agv-3", "name": "AGV-3", "battery_pct": 91},
]


@api_router.get("/mike/agv")
async def mike_agv(lang: str = "it", admin: dict = Depends(require_admin)):
    """Flotta AGV: routing autonomo tra le postazioni + rilevamento ACUSTICO preventivo
    (dB anomali → manutenzione predittiva prima del guasto)."""
    it = (lang or "it").startswith("it")
    R = lambda i, e: (i if it else e)  # noqa: E731
    t = time.time()
    carts = []
    alerts = []
    for i, c in enumerate(_AGV_SEED):
        frm, to = _AGV_ROUTES[int(t / 12 + i) % len(_AGV_ROUTES)]
        osc = (math.sin(t / 5.0 + i * 2.1) + 1) / 2
        acoustic_db = round(58 + osc * 22, 1)  # 58..80 dB
        anomaly = acoustic_db >= 76
        health = "manutenzione" if anomaly else ("attenzione" if acoustic_db >= 70 else "ok")
        if anomaly:
            alerts.append({"cart": c["name"], "db": acoustic_db,
                           "text": R(f"{c['name']}: rumore cuscinetti {acoustic_db} dB, manutenzione preventiva consigliata.",
                                     f"{c['name']}: bearing noise {acoustic_db} dB, preventive maintenance advised.")})
        carts.append({**c, "from": frm, "to": to, "acoustic_db": acoustic_db, "health": health,
                      "route_label": f"{frm} → {to}"})
    spoken = alerts[0]["text"] if alerts else R("Flotta AGV regolare: nessun collo di bottiglia, acustica nei limiti.",
                                                "AGV fleet nominal: no bottlenecks, acoustics within limits.")
    return {"carts": carts, "alerts": alerts, "alert_count": len(alerts), "spoken": spoken}


# --- Email fornitore silos (configurabile) ---
@api_router.get("/mike/silo-supplier")
async def mike_silo_supplier_get(admin: dict = Depends(require_admin)):
    doc = (await db.app_meta.find_one({"_key": "silo_supplier"}, {"_id": 0})) or {}
    return {"email": doc.get("email") or os.environ.get("SILO_SUPPLIER_EMAIL") or ""}


class SupplierReq(BaseModel):
    email: str = Field("", max_length=160)


@api_router.put("/mike/silo-supplier")
async def mike_silo_supplier_set(body: SupplierReq, admin: dict = Depends(require_admin)):
    await db.app_meta.update_one({"_key": "silo_supplier"}, {"$set": {"email": (body.email or "").strip()}}, upsert=True)
    return {"ok": True, "email": (body.email or "").strip()}


# ===========================================================================
# RIORDINO AUTOMATICO — Sitor PROPONE un micro-ordine al fornitore quando una
# materia prima resta sotto soglia (silos + magazzino di produzione).
# Bozza che il Capo conferma con un tocco; opzione invio automatico attivabile.
# Alla creazione di una nuova proposta il Capo riceve NOTIFICA push + email.
# ===========================================================================
async def _reorder_config(org: str) -> dict:
    doc = (await db.app_meta.find_one({"_key": f"reorder_config:{org}"}, {"_id": 0})) or {}
    return {"auto_send": bool(doc.get("auto_send")), "auto_threshold": bool(doc.get("auto_threshold"))}


async def _smart_threshold(org: str, name: str, lead_days: int = 4, weeks: int = 3) -> dict:
    """Soglia di riordino calcolata sui consumi reali delle ultime settimane invece di un valore fisso.
    Media giornaliera dei consumi × giorni di copertura (lead time) = soglia consigliata."""
    from datetime import datetime, timedelta
    since = (datetime.utcnow() - timedelta(days=weeks * 7)).isoformat()
    logs = await db.lab_consumption_log.find(
        {"organization_id": org, "name": {"$regex": f"^{re.escape(name)}$", "$options": "i"}, "at": {"$gte": since}},
        {"_id": 0, "kg": 1}).to_list(5000)
    total = round(sum(float(l.get("kg") or 0) for l in logs), 2)
    days = max(1, weeks * 7)
    daily = total / days
    weekly = round(daily * 7, 1)
    smart = round(daily * lead_days, 1)
    return {"smart_min_kg": smart, "weekly_avg_kg": weekly, "daily_avg_kg": round(daily, 2),
            "samples": len(logs), "total_kg": total, "lead_days": lead_days, "weeks": weeks}


async def _supplier_email(admin: dict) -> str:
    sup = (await db.app_meta.find_one({"_key": "silo_supplier"}, {"_id": 0})) or {}
    return sup.get("email") or os.environ.get("SILO_SUPPLIER_EMAIL") or admin.get("email") or ""


async def _notify_capo(admin: dict, title: str, body_text: str):
    """Avvisa il Capo su push (browser) + email (Resend). Best-effort, non blocca."""
    uid = admin.get("user_id")
    # PUSH
    try:
        if uid:
            _, priv = await _get_vapid()
            subs = await db.push_subs.find({"user_id": uid}, {"_id": 0}).to_list(50)
            payload = {"title": title, "body": body_text, "tag": "mikilab-reorder"}
            for s in subs:
                try:
                    await asyncio.to_thread(_send_push, s["subscription"], payload, priv)
                except Exception:
                    pass
    except Exception as e:
        logging.warning("reorder push fail (%s)", str(e)[:120])
    # EMAIL
    try:
        to = admin.get("email")
        if RESEND_API_KEY and to:
            html = (f"<div style='font-family:sans-serif;max-width:520px'>"
                    f"<h2 style='color:#b06e78'>{title}</h2><p>{body_text}</p>"
                    f"<p style='color:#888;font-size:12px'>MikiLab · Sitor · {now_iso()[:16]}</p></div>")
            await asyncio.to_thread(_resend.Emails.send, {"from": f"MikiLab <{SENDER_EMAIL}>",
                                                          "to": [to], "subject": title, "html": html})
    except Exception as e:
        logging.warning("reorder email fail (%s)", str(e)[:120])


async def _propose_reorder(admin: dict, items: list, source: str):
    """items: [{name, current, min, capacity?}]. Crea UNA proposta per materia prima sotto
    soglia (dedup finché resta aperta), notifica il Capo e — se auto_send è ON — invia al fornitore."""
    org = _org_id(admin)
    if not items:
        return {"created": 0, "auto_sent": 0}
    cfg = await _reorder_config(org)
    supplier = await _supplier_email(admin)
    created, auto_sent, created_names = 0, 0, []
    for it in items:
        name = (it.get("name") or "").strip()
        if not name:
            continue
        key = f"{source}:{name.lower()}"
        # dedup: salta se esiste già una proposta aperta (proposed) per questa materia prima
        if await db.reorder_proposals.count_documents({"organization_id": org, "key": key, "status": "proposed"}):
            continue
        cur = float(it.get("current") or 0)
        mn = float(it.get("min") or 0)
        cap = float(it.get("capacity") or 0)
        smart = await _smart_threshold(org, name)
        # quantità suggerita: rabbocco all'80% capacità (silos) o al doppio della soglia (magazzino)
        target = cap * 0.8 if cap > 0 else mn * 2
        suggested = round(max(mn, target - cur), 1)
        doc = {"id": str(uuid.uuid4()), "organization_id": org, "key": key, "source": source,
               "name": name, "current_kg": cur, "min_kg": mn, "suggested_qty_kg": suggested,
               "smart_min_kg": smart["smart_min_kg"], "weekly_avg_kg": smart["weekly_avg_kg"],
               "status": "proposed", "auto": False, "supplier": supplier, "created_at": now_iso(),
               "sent_at": None, "received_at": None}
        # invio automatico se attivo e c'è un fornitore
        if cfg["auto_send"] and supplier and RESEND_API_KEY:
            try:
                html = (f"<div style='font-family:sans-serif;max-width:520px'>"
                        f"<h2 style='color:#3f7cac'>MikiLab · Micro-ordine rifornimento</h2>"
                        f"<p>Rifornimento richiesto: <b>{name}</b> — {suggested:g} kg "
                        f"(scorta {cur:g} kg sotto soglia {mn:g} kg).</p>"
                        f"<p style='color:#888;font-size:12px'>Inviato automaticamente da Sitor AI · {now_iso()[:16]}</p></div>")
                await asyncio.to_thread(_resend.Emails.send, {"from": f"MikiLab <{SENDER_EMAIL}>", "to": [supplier],
                                                              "subject": f"MikiLab · Micro-ordine {name}", "html": html})
                doc["status"] = "sent"; doc["auto"] = True; doc["sent_at"] = now_iso()
                auto_sent += 1
            except Exception as e:
                logging.warning("reorder auto-send fail (%s)", str(e)[:120])
        await db.reorder_proposals.insert_one(dict(doc))
        created += 1
        created_names.append(f"{name} ({suggested:g} kg)")
    if created_names:
        verb = "inviato automaticamente al fornitore" if (cfg["auto_send"] and supplier) else "proposto"
        await _notify_capo(admin, "MikiLab · Scorte sotto soglia",
                           f"Sitor ha {verb} il rifornimento per: {', '.join(created_names)}.")
    return {"created": created, "auto_sent": auto_sent}


@api_router.get("/mike/reorder/config")
async def reorder_config_get(admin: dict = Depends(require_admin)):
    return await _reorder_config(_org_id(admin))


class ReorderConfigReq(BaseModel):
    auto_send: bool = False
    auto_threshold: bool = False


@api_router.put("/mike/reorder/config")
async def reorder_config_set(body: ReorderConfigReq, admin: dict = Depends(require_admin)):
    org = _org_id(admin)
    await db.app_meta.update_one({"_key": f"reorder_config:{org}"},
                                 {"$set": {"auto_send": bool(body.auto_send), "auto_threshold": bool(body.auto_threshold)}}, upsert=True)
    return {"ok": True, "auto_send": bool(body.auto_send), "auto_threshold": bool(body.auto_threshold)}


@api_router.get("/mike/reorder/proposals")
async def reorder_proposals_list(admin: dict = Depends(require_admin)):
    org = _org_id(admin)
    docs = await db.reorder_proposals.find({"organization_id": org, "status": {"$ne": "dismissed"}},
                                           {"_id": 0}).sort("created_at", -1).to_list(100)
    pending = sum(1 for d in docs if d.get("status") == "proposed")
    return {"proposals": docs, "pending": pending, "config": await _reorder_config(org)}


@api_router.post("/mike/reorder/proposals/{pid}/send")
async def reorder_proposal_send(pid: str, admin: dict = Depends(require_admin)):
    """Il Capo conferma la bozza: invia il micro-ordine al fornitore via email."""
    org = _org_id(admin)
    p = await db.reorder_proposals.find_one({"id": pid, "organization_id": org}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Proposta non trovata")
    supplier = p.get("supplier") or await _supplier_email(admin)
    emailed = False
    if RESEND_API_KEY and supplier:
        try:
            html = (f"<div style='font-family:sans-serif;max-width:520px'>"
                    f"<h2 style='color:#3f7cac'>MikiLab · Micro-ordine rifornimento</h2>"
                    f"<p>Rifornimento richiesto: <b>{p['name']}</b> — {p['suggested_qty_kg']:g} kg.</p>"
                    f"<p style='color:#888;font-size:12px'>Confermato dalla Direzione · {now_iso()[:16]}</p></div>")
            await asyncio.to_thread(_resend.Emails.send, {"from": f"MikiLab <{SENDER_EMAIL}>", "to": [supplier],
                                                          "subject": f"MikiLab · Micro-ordine {p['name']}", "html": html})
            emailed = True
        except Exception as e:
            logging.warning("reorder send fail (%s)", str(e)[:120])
    await db.reorder_proposals.update_one({"id": pid, "organization_id": org},
                                          {"$set": {"status": "sent", "sent_at": now_iso(), "supplier": supplier}})
    return {"ok": True, "emailed": emailed, "supplier": supplier if emailed else None}


@api_router.post("/mike/reorder/proposals/{pid}/dismiss")
async def reorder_proposal_dismiss(pid: str, admin: dict = Depends(require_admin)):
    await db.reorder_proposals.update_one({"id": pid, "organization_id": _org_id(admin)},
                                          {"$set": {"status": "dismissed"}})
    return {"ok": True}


@api_router.post("/mike/reorder/proposals/{pid}/receive")
async def reorder_proposal_receive(pid: str, admin: dict = Depends(require_admin)):
    """Merce arrivata: aggiorna la scorta col quantitativo ordinato e chiude la proposta come 'ricevuta'."""
    org = _org_id(admin)
    p = await db.reorder_proposals.find_one({"id": pid, "organization_id": org}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Proposta non trovata")
    qty = float(p.get("suggested_qty_kg") or 0)
    new_qty = None
    if p.get("source") == "silos":
        s = await db.silos.find_one({"name": {"$regex": f"^{re.escape(p['name'])}$", "$options": "i"}, "organization_id": org})
        if s:
            cap = float(s.get("capacity_kg") or 0)
            nq = round(float(s.get("current_kg") or 0) + qty, 1)
            if cap > 0:
                nq = min(nq, cap)
            await db.silos.update_one({"id": s["id"], "organization_id": org}, {"$set": {"current_kg": nq}})
            new_qty = nq
    else:  # warehouse
        w = await db.lab_warehouse.find_one({"name": {"$regex": f"^{re.escape(p['name'])}$", "$options": "i"}, "organization_id": org})
        if w:
            nq = round(float(w.get("quantity_kg") or 0) + qty, 1)
            await db.lab_warehouse.update_one({"id": w["id"], "organization_id": org}, {"$set": {"quantity_kg": nq, "updated_at": now_iso()}})
            new_qty = nq
    await db.reorder_proposals.update_one({"id": pid, "organization_id": org},
                                          {"$set": {"status": "received", "received_at": now_iso(), "received_qty_kg": qty}})
    return {"ok": True, "name": p["name"], "added_kg": qty, "new_quantity_kg": new_qty}


@api_router.get("/mike/reorder/history")
async def reorder_history(admin: dict = Depends(require_admin)):
    """Storico dei micro-ordini inviati/ricevuti/scartati, per tenere traccia dei rifornimenti nel tempo."""
    org = _org_id(admin)
    docs = await db.reorder_proposals.find(
        {"organization_id": org, "status": {"$in": ["sent", "received", "dismissed"]}},
        {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"history": docs, "count": len(docs)}


@api_router.get("/mike/reorder/smart-thresholds")
async def reorder_smart_thresholds(admin: dict = Depends(require_admin)):
    """Sitor calcola la soglia di riordino consigliata dai consumi reali (ultime 3 settimane)."""
    org = _org_id(admin)
    out = []
    silos = await db.silos.find({"organization_id": org}, {"_id": 0}).to_list(200)
    for s in silos:
        smart = await _smart_threshold(org, s.get("name", ""))
        out.append({"name": s.get("name"), "source": "silos", "current_kg": float(s.get("current_kg") or 0),
                    "fixed_min_kg": float(s.get("min_kg") or 0), **smart})
    wh = await db.lab_warehouse.find({"organization_id": org}, {"_id": 0}).to_list(500)
    for w in wh:
        smart = await _smart_threshold(org, w.get("name", ""))
        out.append({"name": w.get("name"), "source": "warehouse", "current_kg": float(w.get("quantity_kg") or 0),
                    "fixed_min_kg": float(w.get("min_kg") or 0), **smart})
    return {"thresholds": out, "config": await _reorder_config(org)}


class ApplyThresholdReq(BaseModel):
    name: str
    source: str  # 'silos' | 'warehouse'


@api_router.post("/mike/reorder/apply-threshold")
async def reorder_apply_threshold(body: ApplyThresholdReq, admin: dict = Depends(require_admin)):
    """Applica la soglia consigliata da Sitor come nuova soglia minima (min_kg)."""
    org = _org_id(admin)
    smart = await _smart_threshold(org, body.name)
    val = smart["smart_min_kg"]
    if val <= 0:
        raise HTTPException(400, "Consumi insufficienti per calcolare una soglia affidabile.")
    if body.source == "silos":
        r = await db.silos.update_one({"name": {"$regex": f"^{re.escape(body.name)}$", "$options": "i"}, "organization_id": org}, {"$set": {"min_kg": val}})
    else:
        r = await db.lab_warehouse.update_one({"name": {"$regex": f"^{re.escape(body.name)}$", "$options": "i"}, "organization_id": org}, {"$set": {"min_kg": val}})
    return {"ok": True, "name": body.name, "source": body.source, "new_min_kg": val, "updated": r.modified_count}
