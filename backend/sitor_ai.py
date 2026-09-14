# ruff: noqa: F821  (i nomi sono iniettati a runtime dal core via lo shim globals().update)
"""MikiLab Pro — Modulo Sitor AI (endpoint).
Rotte deus (bond, master-plan, ask, broadcast, piano Capo), Atelier su misura del Capo,
coda di produzione. Gli HELPER condivisi del cervello di Sitor (_deus_llm, _bakery_snapshot,
_deus_persona, _extract_json, _capo_key, _queue_counts) restano nel CORE (server.py).
Refactoring puro: codice spostato da server.py, comportamento INVARIATO.
"""
import server as _core
globals().update({k: v for k, v in vars(_core).items() if not k.startswith("__")})

@api_router.get("/mike/deus/bond")
async def deus_bond(lang: str = "it", admin: dict = Depends(require_admin)):
    email = (admin.get("email") or "master").lower()
    xp, inter = await _bond_get(email)
    info = _bond_info(xp, lang); info["interactions"] = inter
    return info

@api_router.post("/mike/deus/master-plan")
async def deus_master_plan(body: DeusPlanReq, admin: dict = Depends(require_admin)):
    """Sitor orchestra l'impossibile: da ordini + vincoli genera il piano di produzione ottimale del dio del forno."""
    email = (admin.get("email") or "master").lower()
    xp, inter = await _bond_get(email)
    info = _bond_info(xp, body.lang)
    orders = (body.orders or "").strip() or ("(nessun ordine indicato: usa uno scenario realistico di panificio artigianale)")
    constraints = (body.constraints or "").strip() or ("(vincoli tipici: 2 forni, 1 impastatrice, 1 cella di lievitazione, 3 operatori, turno 6h)")
    import json as _json, re as _re
    sysmsg = _deus_persona(info, body.lang) + (
        "\nOra il Capo ti affida una sfida di produzione. Tu, come dio del forno, la rendi POSSIBILE.\n"
        "Restituisci SOLO un JSON valido con questa forma: {"
        "\"reply\": \"1-2 frasi parlate, calde e sicure, con cui presenti il piano al Capo\", "
        "\"plan_markdown\": \"il piano ottimale in markdown: sequenza oraria (## Timeline), assegnazione forni/impastatrice, "
        "operatori, punti critici e trucchi da maestro; usa tabelle markdown dove utile\", "
        "\"confidence\": 0-100, "
        "\"impossible_solved\": [\"max 3 frasi brevi: quali colli di bottiglia/impossibilità hai sciolto\"], "
        "\"risk\": \"1 frase sul rischio residuo da sorvegliare\"}. Nessun testo fuori dal JSON."
    )
    sysmsg += await _bakery_snapshot(admin)
    user_text = f"ORDINI:\n{orders}\n\nVINCOLI/RISORSE:\n{constraints}"
    # I MACCHINARI scelti/aggiunti dal Capo entrano nei calcoli del piano di Sitor.
    try:
        machs = await db.mike_machines.find({}, {"_id": 0, "name": 1, "category": 1, "role": 1, "capacity": 1, "status": 1}).to_list(100)
        if body.machines:
            for nm in body.machines:
                if nm and not any((m.get("name") or "").lower() == str(nm).lower() for m in machs):
                    machs.append({"name": nm})
        if machs:
            lines = []
            for m in machs:
                seg = f"- {m.get('name') or 'macchina'}"
                if m.get("category"): seg += f" [{m['category']}]"
                if m.get("capacity"): seg += f" — capacità {m['capacity']}"
                if m.get("role"): seg += f": {str(m['role'])[:90]}"
                lines.append(seg)
            user_text += ("\n\nPARCO MACCHINE REALE DEL CAPO (VINCOLO OBBLIGATORIO): pianifica usando SOLO questi "
                          "macchinari, cita ciascuno per NOME nella timeline e assegna le fasi in base a categoria e capacità reali. "
                          "Se manca un macchinario per una fase, dillo esplicitamente.\n" + "\n".join(lines))
    except Exception:
        pass
    raw = await _deus_llm_remember(sysmsg, user_text, session=f"sitor-capo-{email}", max_tokens=2200, kind="plan")
    data = {"reply": "", "plan_markdown": "", "confidence": 90, "impossible_solved": [], "risk": ""}
    cleaned = (raw or "").strip()
    if cleaned.startswith("```"):
        cleaned = _re.sub(r"^```[a-zA-Z]*\s*", "", cleaned)
        cleaned = _re.sub(r"\s*```$", "", cleaned).strip()
    parsed_ok = False
    if cleaned:
        i, j = cleaned.find("{"), cleaned.rfind("}")
        if i != -1 and j != -1 and j > i:
            try:
                data.update(_json.loads(cleaned[i:j + 1]))
                parsed_ok = True
            except Exception as e:
                logger.warning("deus_master_plan json fail (%s)", str(e)[:120])
    if not parsed_ok:
        # Fallback: mostra comunque il contenuto grezzo come piano leggibile.
        data["plan_markdown"] = cleaned or raw or ""
        data["reply"] = ("Mio Capo, ecco il piano." if not str(body.lang).startswith("en") else "My Capo, here is the plan.")
    new_xp, new_inter = await _bond_add(email, 40)
    new_info = _bond_info(new_xp, body.lang); new_info["interactions"] = new_inter
    return {"ok": True, "reply": data.get("reply") or "", "plan_markdown": data.get("plan_markdown") or "",
            "confidence": data.get("confidence"), "impossible_solved": data.get("impossible_solved") or [],
            "risk": data.get("risk") or "", "bond": new_info, "leveled_up": new_info["level"] > info["level"]}

@api_router.post("/mike/deus/ask")
async def deus_ask(body: DeusAskReq, admin: dict = Depends(require_admin)):
    """L'Oracolo Divino: al crescere del legame Sitor aiuta il Capo anche sui problemi ESTERNI (vita, business)."""
    email = (admin.get("email") or "master").lower()
    q = (body.question or "").strip()
    if not q:
        raise HTTPException(status_code=400, detail="Domanda vuota")
    xp, inter = await _bond_get(email)
    info = _bond_info(xp, body.lang)
    # Nessun blocco di legame: Sitor risponde sempre, fin dalla prima interazione.
    snapshot = await _bakery_snapshot(admin)
    sysmsg = _deus_persona(info, body.lang) + (
        "\nLa Direzione può chiederti aiuto anche su problemi esterni al laboratorio (organizzazione, decisioni, "
        "business, persone). Rispondi come un consulente esperto: concreto, empatico e professionale. "
        "Dai 1-2 consigli azionabili. 4-7 frasi. Nessun elenco puntato salvo necessità."
    ) + snapshot
    reply = await _deus_llm_remember(sysmsg, q, session=f"sitor-capo-{email}", max_tokens=900, kind="chat")
    new_xp, new_inter = await _bond_add(email, 25)
    new_info = _bond_info(new_xp, body.lang); new_info["interactions"] = new_inter
    return {"ok": True, "locked": False, "reply": (reply or "").strip(), "bond": new_info,
            "leveled_up": new_info["level"] > info["level"]}

@api_router.post("/mike/deus/memory/reset")
async def deus_memory_reset(admin: dict = Depends(require_admin)):
    """Azzera la memoria continua del Capo: Sitor riparte da zero (nuova conversazione)."""
    email = (admin.get("email") or "master").lower()
    await db.sitor_sessions.delete_one({"_key": f"sitor-capo-{email}"})
    return {"ok": True}

@api_router.get("/mike/deus/recap")
async def deus_recap(lang: str = "it", admin: dict = Depends(require_admin)):
    """Riepilogo proattivo all'apertura della chat: Sitor cita da solo le richieste di piano
    fatte nelle ore precedenti (dalla memoria continua), con orario."""
    email = (admin.get("email") or "master").lower()
    it = str(lang or "it").startswith("it")
    doc = await db.sitor_sessions.find_one({"_key": f"sitor-capo-{email}"}, {"_id": 0, "turns": 1}) or {}
    turns = doc.get("turns") or []
    plans = [t for t in turns if t.get("k") == "plan" and t.get("at")]
    if not plans:
        return {"has_recap": False, "spoken": "", "items": []}
    items = []
    for t in plans[-4:]:
        hhmm = str(t.get("at") or "")[11:16]
        u = (t.get("u") or "").strip().replace("\n", " ")
        # estrai solo la parte "ordine", scartando vincoli/parco macchine tecnici
        for _cut in ("PARCO MACCHINE", "VINCOLI", "VINCOLI/RISORSE", "RISORSE"):
            u = u.split(_cut)[0]
        u = u.replace("ORDINI:", "").replace("ORDINE:", "").strip(" :;,-")[:80]
        items.append({"at": hhmm, "orders": u})
    lines = "; ".join(f"{i['at']} — {i['orders']}" for i in items if i["orders"])
    spoken = ((f"Bentornato, Capo. Nelle ultime ore hai lavorato al piano: {lines}. Riprendiamo da qui?" if lines
               else "Bentornato, Capo. Riprendo da dove eravamo rimasti col piano.")
              if it else
              (f"Welcome back, Capo. In the last hours you worked on the plan: {lines}. Shall we continue?" if lines
               else "Welcome back, Capo. Let's pick up where we left the plan."))
    return {"has_recap": True, "spoken": spoken, "items": items}


class DeusBroadcastReq(BaseModel):
    plan_markdown: str = ""
    headline: str = ""

@api_router.post("/mike/deus/broadcast")
async def deus_broadcast(body: DeusBroadcastReq, admin: dict = Depends(require_admin)):
    """Il Capo invia il piano divino alla PRODUZIONE: gli operatori (Sitor) lo vedono sul reparto."""
    await db.app_meta.update_one(
        {"_key": "capo_plan"},
        {"$set": {"_key": "capo_plan", "plan_markdown": body.plan_markdown or "", "headline": body.headline or "",
                  "at": now_iso(), "by": (admin.get("email") or "master")}},
        upsert=True)
    return {"ok": True, "at": now_iso()}

@api_router.get("/floor/capo-plan")
async def floor_capo_plan():
    doc = await db.app_meta.find_one({"_key": "capo_plan"}, {"_id": 0}) or {}
    return {"plan_markdown": doc.get("plan_markdown", ""), "headline": doc.get("headline", ""), "at": doc.get("at")}

# ======================================================================
@api_router.post("/capo/atelier/create")
async def capo_atelier_create(body: AtelierCreateReq, admin: dict = Depends(require_admin)):
    """Il Capo chiede uno strumento a parole; Sitor lo progetta come widget vivo e lo appunta alla sua schermata."""
    req = (body.request or "").strip()
    if not req:
        raise HTTPException(status_code=400, detail="Richiesta vuota")
    langname = _DEUS_LANGS.get(str(body.lang or "it").split("-")[0][:2], "italiano")
    spec = {"type": "note", "title": req[:40], "icon": "sparkles", "config": {}, "spoken": ""}
    if EMERGENT_LLM_KEY:
        sysmsg = (
            "Sei SITOR, il Dio dell'Arte Bianca al servizio del Capo. Il Capo ti chiede di aggiungere uno strumento "
            "alla SUA schermata. Progettalo come un widget vivo scegliendo UNO di questi tipi:\n"
            "- note: un promemoria/testo che scrivi tu. config={\"text\": \"...\"}\n"
            "- checklist: cose da spuntare. config={\"items\": [\"...\", \"...\"]}\n"
            "- counter: un contatore (es. sfridi, pezzi). config={\"label\": \"...\", \"value\": 0, \"step\": 1}\n"
            "- metric: un valore da tenere d'occhio. config={\"label\": \"...\", \"value\": \"...\", \"unit\": \"...\"}\n"
            "- reminder: un promemoria con data. config={\"text\": \"...\", \"date\": \"YYYY-MM-DD\"}\n"
            "- chart: un mini-grafico a barre (dati reali che il Capo aggiorna giorno per giorno). "
            "config={\"label\":\"...\",\"unit\":\"...\",\"series\":[{\"d\":\"Lun\",\"v\":0},{\"d\":\"Mar\",\"v\":0},{\"d\":\"Mer\",\"v\":0},{\"d\":\"Gio\",\"v\":0},{\"d\":\"Ven\",\"v\":0},{\"d\":\"Sab\",\"v\":0},{\"d\":\"Dom\",\"v\":0}]}\n"
            f"Scegli un'icona tra: {', '.join(sorted(_ATELIER_ICONS))}.\n"
            f"Rispondi in {langname}. Restituisci SOLO un JSON valido: "
            "{\"type\":\"...\",\"title\":\"titolo breve\",\"icon\":\"...\",\"config\":{...},"
            "\"spoken\":\"1 frase calda che dici al Capo mentre lo aggiungi\"}. Nessun testo fuori dal JSON."
        )
        sysmsg += await _bakery_snapshot(admin)
        raw = await _deus_llm(sysmsg, f"RICHIESTA DEL CAPO: {req}", session=f"atelier-{_capo_key(admin)}", max_tokens=700)
        data = _extract_json(raw)
        if data.get("type") in {"note", "checklist", "counter", "metric", "reminder", "chart"}:
            spec["type"] = data["type"]
        spec["title"] = (data.get("title") or spec["title"]).strip()[:60]
        if data.get("icon") in _ATELIER_ICONS:
            spec["icon"] = data["icon"]
        if isinstance(data.get("config"), dict):
            spec["config"] = data["config"]
        spec["spoken"] = (data.get("spoken") or "").strip()
    # Normalizza la config per tipo (valori sicuri)
    t, cfg = spec["type"], (spec.get("config") or {})
    if t == "counter":
        cfg = {"label": str(cfg.get("label") or spec["title"])[:60], "value": int(cfg.get("value") or 0), "step": int(cfg.get("step") or 1)}
    elif t == "checklist":
        items = [{"t": str(x)[:120], "done": False} for x in (cfg.get("items") or [])][:20]
        cfg = {"items": items}
    elif t == "metric":
        cfg = {"label": str(cfg.get("label") or spec["title"])[:60], "value": str(cfg.get("value") or "")[:40], "unit": str(cfg.get("unit") or "")[:16]}
    elif t == "reminder":
        cfg = {"text": str(cfg.get("text") or spec["title"])[:200], "date": str(cfg.get("date") or "")[:10]}
    elif t == "chart":
        raw_series = cfg.get("series") or []
        series = []
        for pt in raw_series[:14]:
            if isinstance(pt, dict):
                try:
                    series.append({"d": str(pt.get("d") or "")[:8], "v": float(pt.get("v") or 0)})
                except Exception:
                    series.append({"d": str(pt.get("d") or "")[:8], "v": 0})
        if not series:
            series = [{"d": d, "v": 0} for d in ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"]]
        rl = req.lower()
        source = "waste" if any(k in rl for k in ["sfrid", "scart", "waste", "invendut", "abfall", "merma", "perte"]) else ("pieces" if any(k in rl for k in ["pezz", "piece", "produzion", "sforn", "stück", "produc", "pièce"]) else "")
        cfg = {"label": str(cfg.get("label") or spec["title"])[:60], "unit": str(cfg.get("unit") or "")[:16], "series": series}
        if source:
            cfg["source"] = source
            cfg["auto"] = True
    else:
        cfg = {"text": str(cfg.get("text") or req)[:600]}
    doc = {"id": str(uuid.uuid4()), "capo": _capo_key(admin), "type": t, "title": spec["title"],
           "icon": spec["icon"], "config": cfg, "request": req[:300], "created_at": now_iso()}
    await db.capo_atelier.insert_one(dict(doc))
    return {"ok": True, "widget": doc, "spoken": spec.get("spoken") or ""}


@api_router.get("/capo/atelier")
async def capo_atelier_list(admin: dict = Depends(require_admin)):
    docs = await db.capo_atelier.find({"capo": _capo_key(admin)}, {"_id": 0}).sort("created_at", 1).to_list(60)
    # I grafici con "source" (waste/pieces) si riempiono da soli dai rapporti di fine turno reali.
    for d in docs:
        if d.get("type") == "chart" and (d.get("config") or {}).get("source") in ("waste", "pieces"):
            d["config"]["series"] = await _reports_daily_series((d["config"]["source"]))
            d["config"]["auto"] = True
    return {"widgets": docs}


import re as _re_atelier


async def _reports_daily_series(field: str, days: int = 7):
    """Somma i numeri trovati nel campo (pieces/waste) dei rapporti di fine turno, per ognuno degli ultimi giorni."""
    from datetime import timedelta
    today = datetime.now(timezone.utc).date()
    buckets = {}
    labels = []
    for i in range(days - 1, -1, -1):
        d = today - timedelta(days=i)
        key = d.isoformat()
        buckets[key] = 0.0
        labels.append((key, ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"][d.weekday()]))
    reports = await db.floor_shift_reports.find({}, {"_id": 0, "at": 1, field: 1}).sort("at", -1).to_list(500)
    for r in reports:
        day = str(r.get("at", ""))[:10]
        if day in buckets:
            nums = _re_atelier.findall(r"\d+(?:[.,]\d+)?", str(r.get(field, "")))
            buckets[day] += sum(float(n.replace(",", ".")) for n in nums)
    return [{"d": lbl, "v": round(buckets[key], 1)} for key, lbl in labels]


class AtelierShareReq(BaseModel):
    share_dept: str = ""


@api_router.patch("/capo/atelier/{wid}/share")
async def capo_atelier_share(wid: str, body: AtelierShareReq, admin: dict = Depends(require_admin)):
    await db.capo_atelier.update_one({"id": wid, "capo": _capo_key(admin)}, {"$set": {"share_dept": (body.share_dept or "")[:40], "updated_at": now_iso()}})
    return {"ok": True}


@api_router.get("/floor/shared-widgets")
async def floor_shared_widgets(dept: str = ""):
    """Widget che il Capo ha scelto di condividere col reparto (sola lettura sul tablet operai)."""
    q = {"share_dept": {"$nin": ["", None]}}
    docs = await db.capo_atelier.find(q, {"_id": 0, "capo": 0}).to_list(60)
    d = (dept or "").strip().lower()
    out = []
    for w in docs:
        sd = (w.get("share_dept") or "").strip().lower()
        if not d or sd == d or sd == "tutti" or sd == "all":
            if w.get("type") == "chart" and (w.get("config") or {}).get("source") in ("waste", "pieces"):
                w["config"]["series"] = await _reports_daily_series((w["config"]["source"]))
            out.append(w)
    return {"widgets": out}


class AtelierUpdateReq(BaseModel):
    config: dict


@api_router.patch("/capo/atelier/{wid}")
async def capo_atelier_update(wid: str, body: AtelierUpdateReq, admin: dict = Depends(require_admin)):
    await db.capo_atelier.update_one({"id": wid, "capo": _capo_key(admin)}, {"$set": {"config": body.config, "updated_at": now_iso()}})
    return {"ok": True}


@api_router.delete("/capo/atelier/{wid}")
async def capo_atelier_delete(wid: str, admin: dict = Depends(require_admin)):
    await db.capo_atelier.delete_one({"id": wid, "capo": _capo_key(admin)})
    return {"ok": True}

# ======================================================================
@api_router.get("/mike/deus/production-queue")
async def deus_production_queue():
    docs = await db.capo_queue.find({}, {"_id": 0}).sort("at", -1).to_list(120)
    return {"tasks": docs, "counts": await _queue_counts()}

@api_router.post("/mike/deus/queue/{tid}/done")
async def deus_queue_done(tid: str, admin: dict = Depends(require_admin)):
    await db.capo_queue.update_one({"id": tid}, {"$set": {"status": "done", "done_at": now_iso()}})
    return {"ok": True, "counts": await _queue_counts()}

@api_router.post("/mike/deus/queue/clear")
async def deus_queue_clear(admin: dict = Depends(require_admin)):
    await db.capo_queue.delete_many({})
    return {"ok": True, "counts": await _queue_counts()}
