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
            logger.warning("silo microorder email fail (%s)", str(e)[:120])
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
