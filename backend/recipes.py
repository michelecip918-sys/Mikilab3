# ruff: noqa: F821  (i nomi sono iniettati a runtime dal core via lo shim globals().update)
"""MikiLab Pro — Modulo Generatore Ricette Custom (Il Tuo Laboratorio, metodo Mickey Lab).
Refactoring puro: codice spostato da server.py, comportamento INVARIATO.
Le rotte sono registrate sullo stesso `api_router` del core (server.py).
"""
import server as _core
globals().update({k: v for k, v in vars(_core).items() if not k.startswith("__")})

# ==========================================================================
# GENERATORE DI RICETTE CUSTOM (Il Tuo Laboratorio) — metodo Mickey Lab
# Calcolo deterministico con percentuali del panificatore + procedimento AI.
# ==========================================================================
GEN_EXTRAS = {
    # key: (label_it, percent_su_farina)
    "olio_oliva": ("Olio extravergine d'oliva", 4.0),
    "strutto": ("Strutto", 3.0),
    "burro": ("Burro", 8.0),
    "zucchero": ("Zucchero", 5.0),
    "miele": ("Miele", 3.0),
    "latte": ("Latte (sostituisce parte dell'acqua)", 0.0),
    "uova": ("Uova", 10.0),
    "farina_canapa": ("Farina di canapa", 8.0),
    "semi_misti": ("Semi misti (lino, girasole, sesamo)", 12.0),
    "erbe": ("Erbe aromatiche (rosmarino/origano)", 1.5),
    "olive": ("Olive denocciolate", 15.0),
    "pomodori_secchi": ("Pomodori secchi", 12.0),
    "noci": ("Noci", 15.0),
    "uvetta": ("Uvetta", 20.0),
    "malto": ("Malto diastasico", 0.8),
}

# Prezzi indicativi €/kg per il food cost del generatore
GEN_PRICE_KG = {
    "olio_oliva": 8.0, "strutto": 4.0, "burro": 9.0, "zucchero": 1.2, "miele": 9.0,
    "latte": 1.2, "uova": 4.0, "farina_canapa": 14.0, "semi_misti": 6.0, "erbe": 25.0,
    "olive": 7.0, "pomodori_secchi": 12.0, "noci": 14.0, "uvetta": 4.5, "malto": 6.0,
}
GEN_PRICE_SALT_KG = 0.5
GEN_PRICE_YEAST_KG = 6.0
GEN_PRICE_SOURDOUGH_KG = 1.5

GEN_PREFERMENT = {
    "poolish": {"label": "Poolish", "flour_share": 0.30, "hyd": 1.00, "yeast_pct": 0.3, "method": "indiretto"},
    "biga": {"label": "Biga", "flour_share": 0.40, "hyd": 0.45, "yeast_pct": 1.0, "method": "indiretto"},
    "lm": {"label": "Lievito Madre", "flour_share": 0.0, "lm_pct": 25.0, "yeast_pct": 0.0, "method": "indiretto"},
    "diretto": {"label": "Lievito di Birra (diretto)", "flour_share": 0.0, "yeast_pct": 1.5, "method": "diretto"},
    "misto": {"label": "Poolish + Lievito Madre (misto)", "flour_share": 0.20, "hyd": 1.00, "lm_pct": 10.0, "yeast_pct": 0.4, "method": "indiretto"},
}


class RecipeGenReq(BaseModel):
    product: str
    preferment: str = "diretto"       # poolish | biga | lm | diretto | misto
    hydration: int = 70               # 50..100
    extras: List[str] = []
    total_weight: int = 1000          # grammi impasto finale desiderato
    lang: str = "it"
    # Scalatura per pezzatura
    mode: str = "weight"              # weight | pieces
    pieces: int = 0
    piece_weight: int = 0             # grammi a pezzo
    waste_percent: float = 10.0       # sfrido %
    # Temperatura acqua d'impasto
    target_dough_temp: float = 24.0
    ambient_temp: float = 20.0
    flour_temp: float = 20.0
    friction: float = 3.0
    # Food cost
    flour_price_kg: float = 1.2
    food_cost_ratio: float = 0.30     # incidenza materia prima sul prezzo di vendita


def _round5(x: float) -> float:
    return round(x, 1) if x < 20 else round(x)


@api_router.post("/recipes/generate")
async def generate_recipe(body: RecipeGenReq, user: dict = Depends(current_user)):
    if not await user_is_pro(user):
        raise HTTPException(status_code=403, detail="Serve l'abbonamento PRO")
    lang = body.lang if body.lang in ("it", "de", "en", "es", "fr", "fa") else "it"
    hyd = max(50, min(100, int(body.hydration)))
    pf = GEN_PREFERMENT.get(body.preferment, GEN_PREFERMENT["diretto"])
    salt_pct = 2.0
    extra_defs = [(k, GEN_EXTRAS[k][0], GEN_EXTRAS[k][1]) for k in body.extras if k in GEN_EXTRAS]
    extras_pct_sum = sum(p for _, _, p in extra_defs)
    lm_pct = pf.get("lm_pct", 0.0)
    yeast_pct = pf.get("yeast_pct", 0.0)

    # Scalatura: da pezzatura o da peso totale
    pieces_n = max(0, int(body.pieces or 0))
    piece_w = max(0, int(body.piece_weight or 0))
    waste = max(0.0, float(body.waste_percent or 0))
    if body.mode == "pieces" and pieces_n > 0 and piece_w > 0:
        total_weight = int(round(pieces_n * piece_w * (1 + waste / 100.0)))
    else:
        total_weight = max(100, int(body.total_weight or 1000))

    # Farina totale: totale = farina * (1 + idr + sale + extra + lm + lievito)/100
    total_pct = 100 + hyd + salt_pct + extras_pct_sum + lm_pct + yeast_pct
    flour_total = total_weight / (total_pct / 100.0)
    water_total = flour_total * hyd / 100.0
    salt_g = flour_total * salt_pct / 100.0
    yeast_g = flour_total * yeast_pct / 100.0
    lm_g = flour_total * lm_pct / 100.0
    extras_g = [{"name": lbl, "grams": _round5(flour_total * p / 100.0), "percent": p} for _, lbl, p in extra_defs]

    # Split pre-fermento
    preferment_block = None
    fshare = pf.get("flour_share", 0.0)
    if fshare > 0:
        pf_flour = flour_total * fshare
        pf_water = pf_flour * pf.get("hyd", 1.0)
        pf_yeast = pf_flour * pf.get("yeast_pct", 0.0) / 100.0
        preferment_block = {
            "type": pf["label"],
            "flour_g": _round5(pf_flour), "water_g": _round5(pf_water), "yeast_g": _round5(pf_yeast),
            "hours": "12-16h a 18°C" if body.preferment == "biga" else "8-12h a 20°C",
        }
        final_flour = flour_total - pf_flour
        final_water = water_total - pf_water
    else:
        final_flour = flour_total
        final_water = water_total

    ingredients = {
        "flour_total_g": _round5(flour_total),
        "water_total_g": _round5(water_total),
        "final_flour_g": _round5(final_flour),
        "final_water_g": _round5(final_water),
        "salt_g": _round5(salt_g),
        "yeast_g": _round5(yeast_g) if yeast_g else 0,
        "sourdough_g": _round5(lm_g) if lm_g else 0,
        "extras": extras_g,
        "hydration_percent": hyd,
        "preferment": preferment_block,
    }

    # --- Temperatura acqua d'impasto (metodo Mickey Lab) ---
    has_pf = bool(preferment_block) or lm_g > 0
    factor = 4 if has_pf else 3
    d, fl, amb, fr = body.target_dough_temp, body.flour_temp, body.ambient_temp, body.friction
    if has_pf:
        water_temp = factor * d - (fl + amb + fr + amb)  # pre-fermento ~ temp. ambiente
    else:
        water_temp = factor * d - (fl + amb + fr)
    water_temp = round(max(1.0, min(60.0, water_temp)), 1)
    water_status = "hot" if amb >= 29 or water_temp < 2 else ("cold" if amb <= 15 or water_temp > 40 else "ok")
    water_temp_block = {
        "water_c": water_temp, "target_dough_c": d, "flour_c": fl, "ambient_c": amb,
        "friction_c": fr, "status": water_status, "factor": factor,
    }

    # --- Food cost ---
    def _cost(grams, price_kg):
        return (grams / 1000.0) * price_kg
    cost_flour = _cost(flour_total, body.flour_price_kg)
    cost_salt = _cost(salt_g, GEN_PRICE_SALT_KG)
    cost_yeast = _cost(yeast_g, GEN_PRICE_YEAST_KG) + (_cost(preferment_block["yeast_g"], GEN_PRICE_YEAST_KG) if preferment_block else 0)
    cost_sour = _cost(lm_g, GEN_PRICE_SOURDOUGH_KG)
    cost_extras = 0.0
    for k, lbl, p in extra_defs:
        cost_extras += _cost(flour_total * p / 100.0, GEN_PRICE_KG.get(k, 3.0))
    material_cost = cost_flour + cost_salt + cost_yeast + cost_sour + cost_extras
    n_pieces = pieces_n if (body.mode == "pieces" and pieces_n > 0) else max(1, int(round(total_weight / 500.0)))
    cost_piece = material_cost / n_pieces if n_pieces else material_cost
    ratio = body.food_cost_ratio if 0.05 <= body.food_cost_ratio <= 0.9 else 0.30
    suggested_price = cost_piece / ratio
    food_cost_block = {
        "material_cost": round(material_cost, 2),
        "pieces": n_pieces,
        "cost_per_piece": round(cost_piece, 2),
        "food_cost_ratio": round(ratio * 100),
        "suggested_price_piece": round(suggested_price, 2),
        "currency": "EUR",
    }

    # --- Pezzatura ---
    portioning = {
        "mode": body.mode,
        "total_dough_g": total_weight,
        "pieces": pieces_n if body.mode == "pieces" else None,
        "piece_weight_g": piece_w if body.mode == "pieces" else None,
        "waste_percent": waste if body.mode == "pieces" else None,
    }

    # --- Alert Ricetta Intelligente (coerenza idratazione/farina/pre-fermento) ---
    W = {
        "it": {
            "hyd_extreme": "Idratazione oltre l'85%: usa una farina MOLTO forte (W320+/Manitoba) e gestisci con pieghe e bassinage, altrimenti l'impasto collassa.",
            "hyd_high": "Idratazione alta (80%+): consigliata farina forte (W300+) e almeno 3 giri di pieghe.",
            "hyd_low_focaccia": "Per focacce/ciabatte questa idratazione è bassa: sali almeno al 70-75% per un'alveolatura aperta.",
            "biga_high": "Biga con idratazione totale molto alta: la biga è un pre-fermento SOLIDO, tienila al 45% e porta l'acqua nell'impasto finale (bassinage).",
            "lm_high": "Lievito Madre con idratazione estrema: parti da rinfreschi in forza e aggiungi l'acqua a filo.",
            "diretto_long": "Metodo diretto con idratazione alta: valuta un pre-fermento (poolish/biga) per più forza e profumo.",
            "piece_small": "Pezzatura molto piccola: verifica lo sfrido e i tempi di cottura ridotti.",
        },
        "en": {
            "hyd_extreme": "Hydration above 85%: use a VERY strong flour (W320+/Manitoba) and manage with folds and bassinage, or the dough will collapse.",
            "hyd_high": "High hydration (80%+): a strong flour (W300+) and at least 3 sets of folds are recommended.",
            "hyd_low_focaccia": "For focaccia/ciabatta this hydration is low: go to at least 70-75% for an open crumb.",
            "biga_high": "Biga with very high total hydration: biga is a STIFF preferment, keep it at 45% and add the water in the final dough (bassinage).",
            "lm_high": "Sourdough with extreme hydration: start from strong refreshments and add water gradually.",
            "diretto_long": "Direct method with high hydration: consider a preferment (poolish/biga) for more strength and aroma.",
            "piece_small": "Very small piece weight: check waste and reduced baking times.",
        },
        "de": {
            "hyd_extreme": "Hydration über 85%: sehr starkes Mehl (W320+/Manitoba) verwenden und mit Falten und Bassinage führen, sonst kollabiert der Teig.",
            "hyd_high": "Hohe Hydration (80%+): starkes Mehl (W300+) und mindestens 3 Faltdurchgänge empfohlen.",
            "hyd_low_focaccia": "Für Focaccia/Ciabatta ist diese Hydration niedrig: mindestens 70-75% für eine offene Krume.",
            "biga_high": "Biga mit sehr hoher Gesamthydration: Biga ist ein FESTER Vorteig, bei 45% halten und Wasser im Hauptteig zugeben (Bassinage).",
            "lm_high": "Sauerteig mit extremer Hydration: mit kräftigen Auffrischungen starten und Wasser nach und nach zugeben.",
            "diretto_long": "Direkte Methode mit hoher Hydration: einen Vorteig (Poolish/Biga) für mehr Kraft und Aroma erwägen.",
            "piece_small": "Sehr kleines Stückgewicht: Verschnitt und kürzere Backzeiten prüfen.",
        },
        "es": {
            "hyd_extreme": "Hidratación por encima del 85%: usa una harina MUY fuerte (W320+/Manitoba) y gestiona con pliegues y bassinage, o la masa colapsará.",
            "hyd_high": "Hidratación alta (80%+): se recomienda harina fuerte (W300+) y al menos 3 tandas de pliegues.",
            "hyd_low_focaccia": "Para focaccia/chapata esta hidratación es baja: sube al menos al 70-75% para una miga abierta.",
            "biga_high": "Biga con hidratación total muy alta: la biga es un prefermento SÓLIDO, mantenla al 45% y añade el agua en la masa final (bassinage).",
            "lm_high": "Masa madre con hidratación extrema: parte de refrescos en fuerza y añade el agua poco a poco.",
            "diretto_long": "Método directo con hidratación alta: valora un prefermento (poolish/biga) para más fuerza y aroma.",
            "piece_small": "Pieza muy pequeña: revisa el desperdicio y los tiempos de cocción reducidos.",
        },
    }
    wl = W.get(lang, W["it"])
    prod_l = body.product.lower()
    warnings = []
    if hyd > 85:
        warnings.append({"level": "danger", "text": wl["hyd_extreme"]})
    elif hyd >= 80:
        warnings.append({"level": "warn", "text": wl["hyd_high"]})
    if hyd < 65 and any(x in prod_l for x in ["focacc", "ciabatt", "cristall"]):
        warnings.append({"level": "warn", "text": wl["hyd_low_focaccia"]})
    if body.preferment == "biga" and hyd > 78:
        warnings.append({"level": "warn", "text": wl["biga_high"]})
    if body.preferment in ("lm", "misto") and hyd > 85:
        warnings.append({"level": "warn", "text": wl["lm_high"]})
    if body.preferment == "diretto" and hyd >= 80:
        warnings.append({"level": "info", "text": wl["diretto_long"]})
    if body.mode == "pieces" and 0 < piece_w < 40:
        warnings.append({"level": "info", "text": wl["piece_small"]})


    # Titolo leggibile
    pf_label = pf["label"]
    title_map = {
        "it": f"{body.product} con {pf_label} al {hyd}% di Idratazione",
        "de": f"{body.product} mit {pf_label}, {hyd}% Hydration",
        "en": f"{body.product} with {pf_label} at {hyd}% Hydration",
        "es": f"{body.product} con {pf_label} al {hyd}% de Hidratación",
    }
    title = title_map.get(lang, title_map["it"])

    # Procedimento AI su misura nella lingua attiva
    procedure = ""
    if EMERGENT_LLM_KEY:
        lang_name = _LANG_NAMES.get(lang, "italiano")
        extras_txt = ", ".join(f"{e['name']} {e['grams']}g" for e in extras_g) or "nessuno"
        pf_txt = (f"{preferment_block['type']}: {preferment_block['flour_g']}g farina + "
                  f"{preferment_block['water_g']}g acqua + {preferment_block['yeast_g']}g lievito ({preferment_block['hours']})"
                  if preferment_block else (f"Lievito Madre {ingredients['sourdough_g']}g" if lm_g else "Lievito di birra diretto"))
        sys = (f"Sei un Maestro Panificatore. Scrivi SOLO in {lang_name}. "
               "Genera un procedimento professionale passo-passo (numerato) per la ricetta indicata, "
               "coerente col pre-fermento, l'idratazione e gli ingredienti dati. "
               "Includi: gestione del pre-fermento, eventuale autolisi, impasto e incordatura, inserimento di olio/aromi "
               "come da regola (grassi e aromi verso fine impasto), puntata, pieghe, formatura, appretto e cottura "
               "con temperatura e tempi realistici per il prodotto. Niente introduzioni, solo i passaggi.")
        prompt = (f"Prodotto: {body.product}\nPre-fermento: {pf_txt}\nIdratazione: {hyd}%\n"
                  f"Farina totale: {ingredients['flour_total_g']}g, Acqua totale: {ingredients['water_total_g']}g, "
                  f"Sale: {ingredients['salt_g']}g. Ingredienti speciali: {extras_txt}.\n"
                  f"Peso impasto finale: {total_weight}g. Temperatura acqua consigliata: {water_temp}°C.")
        try:
            chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"gen-{uuid.uuid4().hex[:8]}",
                           system_message=sys).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=1600)
            full = ""
            async for ev in chat.stream_message(UserMessage(text=prompt)):
                if isinstance(ev, TextDelta):
                    full += ev.content
                elif isinstance(ev, StreamDone):
                    break
            procedure = full.strip()
        except Exception as e:
            logging.warning(f"generate_recipe procedure failed: {e}")

    return {"title": title, "ingredients": ingredients, "procedure": procedure,
            "water_temp": water_temp_block, "food_cost": food_cost_block,
            "portioning": portioning, "warnings": warnings,
            "preferment_key": body.preferment, "product": body.product, "lang": lang}


async def _translate_text_multi(text: str) -> dict:
    """Traduce un breve testo (post/commento community) in DE/EN/ES con una sola chiamata.
    Ritorna {text_de, text_en, text_es}. Best-effort: in caso di errore ritorna {}."""
    text = (text or "").strip()
    if not text or not EMERGENT_LLM_KEY:
        return {}
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY, session_id=f"ctr-{uuid.uuid4().hex[:8]}",
            system_message=("Sei un traduttore per una community di panificatori. Traduci il messaggio in "
                            "tedesco, inglese e spagnolo mantenendo tono naturale e termini tecnici (Lievito Madre, "
                            "Poolish, Biga, Sauerteig, Panettone). Se il testo è già in una di quelle lingue, "
                            "fornisci comunque la traduzione corretta. Rispondi SOLO con JSON valido "
                            '{"de": "...", "en": "...", "es": "..."} senza altro testo.'),
        ).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=1200)
        full = ""
        async for ev in chat.stream_message(UserMessage(text=text)):
            if isinstance(ev, TextDelta):
                full += ev.content
            elif isinstance(ev, StreamDone):
                break
        m = re.search(r"\{.*\}", full, re.S)
        if not m:
            return {}
        data = json.loads(m.group(0))
        out = {}
        if data.get("de"):
            out["text_de"] = data["de"]
        if data.get("en"):
            out["text_en"] = data["en"]
        if data.get("es"):
            out["text_es"] = data["es"]
        return out
    except Exception as e:
        logging.warning(f"translate_text_multi failed: {e}")
        return {}




@api_router.post("/recipes", response_model=Recipe)
async def create_recipe(payload: RecipeCreate, user: dict = Depends(current_user)):
    if payload.collection_name == "mikilab" and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Solo l'admin può modificare le ricette Mikilab")
    recipe = Recipe(**payload.model_dump())
    doc = recipe.model_dump()
    if payload.collection_name != "mikilab":
        doc["owner_id"] = user["user_id"]
        doc["organization_id"] = _org_id(user)
    _targets = ["de", "en", "es", "fr", "fa"]
    _results = await asyncio.gather(*[_translate_recipe_lang(doc, _t) for _t in _targets], return_exceptions=True)
    for _res in _results:
        if isinstance(_res, dict):
            for _k, _v in _res.items():
                if _v:
                    doc[_k] = _v
    await db.recipes.insert_one(doc)
    return Recipe(**{k: v for k, v in doc.items() if k != "owner_id"})


@api_router.post("/upload")
async def upload_image(file: UploadFile = File(...), user: dict = Depends(current_user)):
    """Carica una foto nell'archivio immagini dedicato e restituisce l'URL servito dal backend."""
    ext = (file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg").lower()
    if ext not in MIME_TYPES:
        ext = "jpg"
    content_type = MIME_TYPES.get(ext, file.content_type or "image/jpeg")
    file_id = str(uuid.uuid4())
    path = f"{APP_NAME}/uploads/{file_id}.{ext}"
    data = await file.read()
    result = put_object(path, data, content_type)
    storage_path = result["path"]
    await db.files.insert_one({
        "id": file_id,
        "storage_path": storage_path,
        "original_filename": file.filename or f"{file_id}.{ext}",
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "is_deleted": False,
        "created_at": now_iso(),
    })
    return {"url": f"/api/files/{storage_path}", "path": storage_path, "id": file_id}


@api_router.get("/files/{path:path}")
async def download_image(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="File non trovato")
    data, content_type = get_object(path)
    return Response(content=data, media_type=record.get("content_type", content_type))


@api_router.put("/recipes/{recipe_id}", response_model=Recipe)
async def update_recipe(recipe_id: str, payload: RecipeUpdate, user: dict = Depends(current_user)):
    existing = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Ricetta non trovata")
    if existing.get("collection_name") == "mikilab":
        if user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Solo l'admin può modificare le ricette Mikilab")
    elif existing.get("owner_id") != user["user_id"]:
        raise HTTPException(status_code=403, detail="Non autorizzato")
    # Full-state save from the recipe dialog: apply all provided fields,
    # including explicit nulls (so a cleared field is actually cleared).
    updates = payload.model_dump(exclude_unset=True)
    # Never null out the required 'name': keep existing if not provided.
    if updates.get("name") is None:
        updates.pop("name", None)
    updates["updated_at"] = now_iso()
    # Segna la ricetta come modificata a mano: il seed non la sovrascriverà più.
    updates["user_edited"] = True
    # Ritraduci in tedesco SOLO se i campi tradotti sono davvero cambiati
    # (così modificare solo 'real_name'/costi non fa partire la traduzione lenta).
    translatable = ("name", "flour_type", "notes", "procedure")
    changed = [k for k in translatable if k in updates and (updates.get(k) or "") != (existing.get(k) or "")]
    if changed:
        base = {**existing, **updates}
        _targets = ["de", "en", "es", "fr", "fa"]
        _results = await asyncio.gather(*[_translate_recipe_lang(base, _t) for _t in _targets], return_exceptions=True)
        for _res in _results:
            if isinstance(_res, dict):
                for _k, _v in _res.items():
                    if _v:
                        updates[_k] = _v
    await db.recipes.update_one({"id": recipe_id}, {"$set": updates})
    merged = {**existing, **updates}
    return merged


_LANG_NAMES = {"it": "italiano", "de": "tedesco", "en": "inglese", "es": "spagnolo", "fr": "francese", "fa": "persiano (farsi)"}


async def _translate_recipe_lang(doc, target):
    """Traduce nome + campi ricetta nella lingua target (it/de/en/es/fr/fa). Ritorna dict {campo_<lang>: valore}."""
    if target not in ("it", "de", "en", "es", "fr", "fa"):
        return {}
    try:
        fields = {k: doc.get(k) for k in ["name", "flour_type", "notes", "procedure"] if doc.get(k)}
        if not fields:
            return {}
        lang_name = _LANG_NAMES[target]
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY, session_id=f"trrec-{target}-{doc.get('id', 'x')}",
            system_message=(f"Traduttore per panificazione artigianale professionale verso il {lang_name}. Mantieni invariati i termini tecnici "
                            "(Lievito Madre, Poolish, Biga, Sauerteig, Panettone, Backmittel, Kochstück, Quellstück) e i nomi propri "
                            "(Mikilab, Michele). Preserva FEDELMENTE il processo tecnico: metodo (diretto/indiretto), idratazione %, "
                            "temperature (acqua e impasto), l'ordine dei passaggi, l'acqua a filo, i pre-fermenti a inizio impasto e le "
                            "sospensioni (uvetta/noci/canditi) come ultimo ingrediente. Non riordinare né semplificare i passaggi. "
                            "Rispondi SOLO con JSON valido."),
        ).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=2000)
        prompt = (f"Traduci in {lang_name} e restituisci un JSON con SOLO le chiavi name_{target}, flour_type_{target}, "
                  f"notes_{target}, procedure_{target} corrispondenti ai campi forniti:\n" + json.dumps(fields, ensure_ascii=False))
        full = ""
        async for ev in chat.stream_message(UserMessage(text=prompt)):
            if isinstance(ev, TextDelta):
                full += ev.content
            elif isinstance(ev, StreamDone):
                break
        m = re.search(r"\{.*\}", full, re.S)
        return json.loads(m.group(0)) if m else {}
    except Exception as e:
        logging.warning(f"translate {target} failed: {e}")
        return {}


@api_router.post("/recipes/{recipe_id}/promote")
async def promote_recipe(recipe_id: str, user: dict = Depends(current_user)):
    """Promuove una ricetta personale del Capo a ricetta MikiLab condivisa con un tocco."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Solo l'admin può promuovere ricette a MikiLab")
    existing = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Ricetta non trovata")
    if existing.get("collection_name") == "mikilab":
        return {"ok": True, "already": True}
    await db.recipes.update_one(
        {"id": recipe_id},
        {"$set": {"collection_name": "mikilab", "user_edited": True, "updated_at": now_iso()}, "$unset": {"owner_id": ""}},
    )
    return {"ok": True}


@api_router.post("/recipes/{recipe_id}/translate")
async def translate_recipe(recipe_id: str, lang: str = "en", user: dict = Depends(current_user)):
    existing = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Ricetta non trovata")
    if existing.get("collection_name") == "mikilab":
        # Le ricette MikiLab restano modificabili/traducibili solo dall'admin (Michele).
        if user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Non autorizzato")
    else:
        # Ricette personali: ogni utente può tradurre le PROPRIE (nessun PRO richiesto).
        if existing.get("owner_id") != user["user_id"]:
            raise HTTPException(status_code=403, detail="Non autorizzato")
    tr = await _translate_recipe_lang(existing, lang)
    if not tr:
        raise HTTPException(status_code=502, detail="Traduzione non riuscita, riprova")
    await db.recipes.update_one({"id": recipe_id}, {"$set": {**tr, "updated_at": now_iso()}})
    return {**existing, **tr}



@api_router.delete("/recipes/{recipe_id}")
async def delete_recipe(recipe_id: str, user: dict = Depends(current_user)):
    existing = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Ricetta non trovata")
    if existing.get("collection_name") == "mikilab":
        if user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Solo l'admin può modificare le ricette Mikilab")
    elif existing.get("owner_id") != user["user_id"]:
        raise HTTPException(status_code=403, detail="Non autorizzato")
    await db.recipes.delete_one({"id": recipe_id})
    return {"success": True}


# ---------------------------------------------------------------------------
# Oven profile endpoints
# ---------------------------------------------------------------------------
@api_router.get("/oven-profiles", response_model=List[OvenProfile])
async def get_oven_profiles():
    docs = await db.oven_profiles.find({}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    return docs


@api_router.post("/oven-profiles", response_model=OvenProfile)
async def create_oven_profile(payload: OvenProfileCreate, user: dict = Depends(current_user)):
    profile = OvenProfile(**payload.model_dump())
    await db.oven_profiles.insert_one(profile.model_dump())
    return profile


@api_router.put("/oven-profiles/{profile_id}", response_model=OvenProfile)
async def update_oven_profile(profile_id: str, payload: OvenProfileCreate, user: dict = Depends(current_user)):
    existing = await db.oven_profiles.find_one({"id": profile_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Profilo non trovato")
    updates = payload.model_dump()
    await db.oven_profiles.update_one({"id": profile_id}, {"$set": updates})
    return {**existing, **updates}


@api_router.delete("/oven-profiles/{profile_id}")
async def delete_oven_profile(profile_id: str, user: dict = Depends(current_user)):
    res = await db.oven_profiles.delete_one({"id": profile_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Profilo non trovato")
    return {"success": True}


# ---------------------------------------------------------------------------
# Production plan (single persisted plan)
# ---------------------------------------------------------------------------
@api_router.get("/production-plan")
async def get_production_plan():
    doc = await db.production_plan.find_one({"_key": "default"}, {"_id": 0, "_key": 0})
    return doc  # may be null if never saved


@api_router.put("/production-plan", response_model=ProductionPlan)
async def save_production_plan(payload: ProductionPlan, user: dict = Depends(require_admin)):
    payload.updated_at = now_iso()
    doc = payload.model_dump()
    await db.production_plan.update_one(
        {"_key": "default"}, {"$set": {**doc, "_key": "default"}}, upsert=True
    )
    return payload


# ---------------------------------------------------------------------------
# Weekly plan (single persisted plan)
# ---------------------------------------------------------------------------
@api_router.get("/weekly-plan")
async def get_weekly_plan(user: dict = Depends(current_user)):
    doc = await db.weekly_plan.find_one({"_key": user["user_id"]}, {"_id": 0, "_key": 0})
    return doc  # may be null if never saved


@api_router.put("/weekly-plan", response_model=WeeklyPlan)
async def save_weekly_plan(payload: WeeklyPlan, user: dict = Depends(current_user)):
    payload.updated_at = now_iso()
    doc = payload.model_dump()
    await db.weekly_plan.update_one(
        {"_key": user["user_id"]}, {"$set": {**doc, "_key": user["user_id"], "organization_id": _org_id(user)}}, upsert=True
    )
    return payload


# ---------------------------------------------------------------------------
# Preferiti ricette — per-account + conteggio pubblico ("❤ N")
# ---------------------------------------------------------------------------
class FavToggle(BaseModel):
    recipe_id: str


class FavSync(BaseModel):
    ids: List[str] = []


@api_router.get("/favorites")
async def get_favorites(user: dict = Depends(current_user)):
    docs = await db.favorites.find({"user_id": user["user_id"]}, {"_id": 0, "recipe_id": 1}).to_list(3000)
    return [d["recipe_id"] for d in docs]


@api_router.post("/favorites/toggle")
async def toggle_favorite(payload: FavToggle, user: dict = Depends(current_user)):
    q = {"user_id": user["user_id"], "recipe_id": payload.recipe_id}
    existing = await db.favorites.find_one(q)
    if existing:
        await db.favorites.delete_one(q)
        return {"recipe_id": payload.recipe_id, "favorite": False}
    await db.favorites.insert_one({**q, "created_at": now_iso()})
    return {"recipe_id": payload.recipe_id, "favorite": True}


@api_router.post("/favorites/sync")
async def sync_favorites(payload: FavSync, user: dict = Depends(current_user)):
    for rid in payload.ids:
        await db.favorites.update_one(
            {"user_id": user["user_id"], "recipe_id": rid},
            {"$setOnInsert": {"user_id": user["user_id"], "recipe_id": rid, "created_at": now_iso()}},
            upsert=True,
        )
    docs = await db.favorites.find({"user_id": user["user_id"]}, {"_id": 0, "recipe_id": 1}).to_list(3000)
    return [d["recipe_id"] for d in docs]


@api_router.get("/favorites/counts")
async def favorites_counts():
    rows = await db.favorites.aggregate([{"$group": {"_id": "$recipe_id", "count": {"$sum": 1}}}]).to_list(5000)
    return {r["_id"]: r["count"] for r in rows if r["_id"]}


# ---------------------------------------------------------------------------
# Combinazioni salvate del Laboratorio — set di ricette+quantità per-account
# ---------------------------------------------------------------------------
class Combo(BaseModel):
    id: str
    name: str
    items: List[Dict[str, Any]] = []


class ComboSync(BaseModel):
    combos: List[Combo] = []


@api_router.get("/combos")
async def get_combos(user: dict = Depends(current_user)):
    docs = await db.capo_combos.find(
        {"user_id": user["user_id"]}, {"_id": 0, "id": 1, "name": 1, "items": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(200)
    return [{"id": d["id"], "name": d.get("name", ""), "items": d.get("items", [])} for d in docs]


@api_router.post("/combos/sync")
async def sync_combos(payload: ComboSync, user: dict = Depends(current_user)):
    for c in payload.combos[:50]:
        await db.capo_combos.update_one(
            {"user_id": user["user_id"], "id": c.id},
            {
                "$set": {"name": c.name, "items": c.items},
                "$setOnInsert": {"user_id": user["user_id"], "id": c.id, "created_at": now_iso()},
            },
            upsert=True,
        )
    docs = await db.capo_combos.find(
        {"user_id": user["user_id"]}, {"_id": 0, "id": 1, "name": 1, "items": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(200)
    return [{"id": d["id"], "name": d.get("name", ""), "items": d.get("items", [])} for d in docs]


@api_router.delete("/combos/{combo_id}")
async def delete_combo(combo_id: str, user: dict = Depends(current_user)):
    await db.capo_combos.delete_one({"user_id": user["user_id"], "id": combo_id})
    return {"success": True}



# ---------------------------------------------------------------------------
# Piano di Produzione IA — ultimo piano generato (per utente)
# ---------------------------------------------------------------------------
@api_router.get("/capo/last-plan")
async def get_capo_last_plan(user: dict = Depends(current_user)):
    doc = await db.capo_last_plan.find_one({"_key": user["user_id"]}, {"_id": 0, "_key": 0})
    return doc  # null se mai salvato


@api_router.put("/capo/last-plan", response_model=CapoLastPlan)
async def save_capo_last_plan(payload: CapoLastPlan, user: dict = Depends(current_user)):
    payload.saved_at = now_iso()
    doc = payload.model_dump()
    await db.capo_last_plan.update_one(
        {"_key": user["user_id"]}, {"$set": {**doc, "_key": user["user_id"]}}, upsert=True
    )
    return payload


@api_router.delete("/capo/last-plan")
async def delete_capo_last_plan(user: dict = Depends(current_user)):
    await db.capo_last_plan.delete_one({"_key": user["user_id"]})
    return {"success": True}


# ---------------------------------------------------------------------------
# Piano del Team (Assistente Mamo) — il Capo INVIA il piano al team di produzione.
# Documento singolo condiviso ("active"): il Floor lo legge SENZA login (gli operatori
# usano il PIN), il Capo lo scrive/aggiorna da autenticato.
# ---------------------------------------------------------------------------
class FloorPlanPush(BaseModel):
    plan: str
    title: Optional[str] = None
    lang: Optional[str] = "it"


@api_router.get("/lab/floor-plan")
async def get_floor_plan():
    doc = await db.floor_plan.find_one({"_key": "active"}, {"_id": 0, "_key": 0})
    return doc  # null se il Capo non ha ancora inviato nulla


@api_router.put("/lab/floor-plan")
async def put_floor_plan(payload: FloorPlanPush, user: dict = Depends(require_admin)):
    doc = {
        "plan": payload.plan,
        "title": (payload.title or "").strip(),
        "lang": payload.lang if payload.lang in ("it", "de", "en", "es", "fr", "fa") else "it",
        "pushed_by": user.get("name") or (user.get("email") or "Capo").split("@")[0],
        "pushed_at": now_iso(),
    }
    await db.floor_plan.update_one({"_key": "active"}, {"$set": {**doc, "_key": "active"}}, upsert=True)
    return doc


@api_router.delete("/lab/floor-plan")
async def delete_floor_plan(user: dict = Depends(require_admin)):
    await db.floor_plan.delete_one({"_key": "active"})
    return {"success": True}


# ---------------------------------------------------------------------------
# MOTORE MIKILAB — Ordine del Capo → pianificazione A RITROSO (da maestro panettiere)
# Il Capo detta prodotto/quantità/ora consegna; calcoliamo a ritroso le fasi tecniche
# (impasto → puntatura → formatura → lievitazione → cottura) con tempi standard,
# poi la scaletta oraria va a Sitor (floor-plan) che la coordina a voce.
# NB: NON tocca il gestionale B2B esistente; lo affianca/riorganizza.
# ---------------------------------------------------------------------------
from datetime import datetime as _dt, timedelta as _td

# Tempi tecnici standard (minuti) per tipo di prodotto — editabili in futuro dal Capo.
_PROCESS_TIMES = {
    "baguette":  [("impasto", 15), ("puntatura", 45), ("formatura", 15), ("lievitazione", 75), ("cottura", 25)],
    "pane":      [("impasto", 20), ("puntatura", 90), ("formatura", 15), ("lievitazione", 120), ("cottura", 45)],
    "focaccia":  [("impasto", 15), ("puntatura", 60), ("formatura", 15), ("lievitazione", 45), ("cottura", 20)],
    "pizza":     [("impasto", 15), ("puntatura", 120), ("formatura", 10), ("lievitazione", 240), ("cottura", 8)],
    "croissant": [("impasto", 20), ("riposo", 30), ("sfogliatura", 45), ("formatura", 20), ("lievitazione", 120), ("cottura", 20)],
    "brioche":   [("impasto", 20), ("puntatura", 60), ("formatura", 20), ("lievitazione", 120), ("cottura", 22)],
    "panettone": [("impasto", 40), ("lievitazione", 720), ("formatura", 20), ("lievitazione", 300), ("cottura", 50)],
    "default":   [("impasto", 20), ("puntatura", 60), ("formatura", 15), ("lievitazione", 90), ("cottura", 30)],
}
_PHASE_LABELS = {
    "it": {"impasto": "Impasto", "puntatura": "Puntatura", "formatura": "Formatura", "lievitazione": "Lievitazione", "cottura": "Cottura", "riposo": "Riposo", "sfogliatura": "Sfogliatura", "consegna": "Pronto / Consegna", "ordine": "Ordine"},
    "de": {"impasto": "Kneten", "puntatura": "Stockgare", "formatura": "Formen", "lievitazione": "Stückgare", "cottura": "Backen", "riposo": "Ruhe", "sfogliatura": "Tourieren", "consegna": "Fertig / Lieferung", "ordine": "Auftrag"},
    "en": {"impasto": "Mixing", "puntatura": "Bulk proof", "formatura": "Shaping", "lievitazione": "Final proof", "cottura": "Baking", "riposo": "Rest", "sfogliatura": "Lamination", "consegna": "Ready / Delivery", "ordine": "Order"},
    "es": {"impasto": "Amasado", "puntatura": "Reposo en bloque", "formatura": "Formado", "lievitazione": "Fermentación", "cottura": "Cocción", "riposo": "Reposo", "sfogliatura": "Laminado", "consegna": "Listo / Entrega", "ordine": "Pedido"},
    "fr": {"impasto": "Pétrissage", "puntatura": "Pointage", "formatura": "Façonnage", "lievitazione": "Apprêt", "cottura": "Cuisson", "riposo": "Repos", "sfogliatura": "Tourage", "consegna": "Prêt / Livraison", "ordine": "Commande"},
    "fa": {"impasto": "خمیرگیری", "puntatura": "تخمیر اولیه", "formatura": "شکل‌دهی", "lievitazione": "تخمیر نهایی", "cottura": "پخت", "riposo": "استراحت", "sfogliatura": "ورقه‌کردن", "consegna": "آماده / تحویل", "ordine": "سفارش"},
}


def _match_product(name: str):
    n = (name or "").lower()
    for key in _PROCESS_TIMES:
        if key != "default" and key in n:
            return key
    if "baguette" in n or "filon" in n:
        return "baguette"
    return "default"


class PlanOrderReq(BaseModel):
    product: Optional[str] = None
    quantity: Optional[int] = None
    deadline: Optional[str] = None   # "HH:MM"
    day_offset: int = 0              # 0 = oggi, 1 = domani
    command: Optional[str] = None    # testo libero: "300 baguette per domani alle 6"
    lang: str = "it"


async def _extract_order(command: str, lang: str) -> dict:
    """Estrae {product, quantity, deadline HH:MM, day_offset} dal comando libero del Capo (NLP)."""
    if not command or not EMERGENT_LLM_KEY:
        return {}
    try:
        sysmsg = ("Extract a bakery production order from the user's message. Respond ONLY with compact JSON: "
                  '{"product": string, "quantity": integer, "deadline": "HH:MM" (24h), "day_offset": 0 for today or 1 for tomorrow}. '
                  "If a field is missing use null. No text, only JSON.")
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"order-{uuid.uuid4().hex[:8]}", system_message=sysmsg).with_model("anthropic", SITOR_BRAIN).with_params(max_tokens=200)
        out = ""
        async for ev in chat.stream_message(UserMessage(text=command)):
            if isinstance(ev, TextDelta):
                out += ev.content or ""
        import re as _re, json as _json
        m = _re.search(r"\{.*\}", out, _re.S)
        return _json.loads(m.group(0)) if m else {}
    except Exception as e:
        logger.warning("extract_order fallita (%s)", str(e)[:120])
        return {}


@api_router.post("/lab/plan-order")
async def plan_order(payload: PlanOrderReq, user: dict = Depends(current_user)):
    product = payload.product
    quantity = payload.quantity
    deadline = payload.deadline
    day_offset = payload.day_offset or 0
    # NLP dal comando libero, se i campi non sono già strutturati
    if payload.command and not (product and quantity and deadline):
        ex = await _extract_order(payload.command, payload.lang)
        product = product or ex.get("product")
        quantity = quantity or ex.get("quantity")
        deadline = deadline or ex.get("deadline")
        if ex.get("day_offset") in (0, 1):
            day_offset = ex.get("day_offset")
    if not product or not deadline:
        raise HTTPException(status_code=400, detail="Servono almeno prodotto e ora di consegna.")
    try:
        hh, mm = [int(x) for x in str(deadline).replace(".", ":").split(":")[:2]]
    except Exception:
        raise HTTPException(status_code=400, detail="Ora di consegna non valida (usa HH:MM).")

    key = _match_product(product)
    phases = _PROCESS_TIMES[key]
    lang = payload.lang if payload.lang in _PHASE_LABELS else "it"
    labels = _PHASE_LABELS[lang]
    qty = quantity or 0

    # deadline = fine cottura. Calcolo a ritroso.
    base = _dt(2000, 1, 1) + _td(days=day_offset, hours=hh, minutes=mm)
    total = sum(p[1] for p in phases)
    start = base - _td(minutes=total)

    steps = []
    t = start
    for (pkey, mins) in phases:
        steps.append({
            "phase": pkey,
            "label": labels.get(pkey, pkey),
            "minutes": mins,
            "clock": t.strftime("%H:%M"),
            "day": (t - _dt(2000, 1, 1)).days,
        })
        t = t + _td(minutes=mins)
    # riga finale consegna
    steps.append({"phase": "consegna", "label": labels["consegna"], "minutes": 0, "clock": base.strftime("%H:%M"), "day": (base - _dt(2000, 1, 1)).days})

    prod_label = product.strip().capitalize()
    qty_str = f"{qty} " if qty else ""
    title = f"{labels['ordine']}: {qty_str}{prod_label}"
    lines = [f"⏱️ {title}"]
    for s in steps:
        pref = ("(-1g) " if s["day"] < day_offset else "")
        dur = f" ({s['minutes']} min)" if s["minutes"] else ""
        lines.append(f"{pref}{s['clock']} — {s['label']}{dur} — {qty_str}{prod_label}")
    plan_text = "\n".join(lines)

    return {
        "product": prod_label, "product_key": key, "quantity": qty,
        "deadline": base.strftime("%H:%M"), "day_offset": day_offset,
        "total_minutes": total, "start": start.strftime("%H:%M"),
        "steps": steps, "plan": plan_text, "title": title, "lang": lang,
    }



# ---------------------------------------------------------------------------
# Mappa dei Fornai — pin opt-in (nome + città + bio + posizione approssimata)
# ---------------------------------------------------------------------------
def _norm_link(v: str) -> str:
    if not v:
        return ""
    return v if (v.startswith("http://") or v.startswith("https://")) else ("https://" + v)


class BakerPin(BaseModel):
    name: str = ""
    city: str = ""
    country: Optional[str] = ""
    bio: Optional[str] = ""
    link: Optional[str] = ""
    lat: float
    lng: float


@api_router.get("/bakers/map")
async def get_bakers_map(user: dict = Depends(current_user)):
    docs = await db.baker_pins.find({}, {"_id": 0, "user_id": 0}).to_list(2000)
    return docs


@api_router.get("/bakers/me")
async def get_baker_me(user: dict = Depends(current_user)):
    doc = await db.baker_pins.find_one({"user_id": user["user_id"]}, {"_id": 0, "user_id": 0})
    return doc  # null se non presente


@api_router.put("/bakers/me")
async def save_baker_me(payload: BakerPin, user: dict = Depends(current_user)):
    # Privacy: posizione approssimata (~1km) arrotondando le coordinate.
    doc = {
        "name": (payload.name or user.get("name") or "Fornaio").strip()[:60],
        "city": (payload.city or "").strip()[:80],
        "country": (payload.country or "").strip()[:60],
        "bio": (payload.bio or "").strip()[:200],
        "link": _norm_link((payload.link or "").strip()[:200]),
        "lat": round(float(payload.lat), 2),
        "lng": round(float(payload.lng), 2),
        "updated_at": now_iso(),
    }
    await db.baker_pins.update_one({"user_id": user["user_id"]}, {"$set": {**doc, "user_id": user["user_id"]}}, upsert=True)
    return doc


@api_router.delete("/bakers/me")
async def delete_baker_me(user: dict = Depends(current_user)):
    await db.baker_pins.delete_one({"user_id": user["user_id"]})
    return {"success": True}



# ---------------------------------------------------------------------------
# Archivio Piani di Lavoro salvati (per utente): più piani con nome + data.
# kind: "weekly" (Piano settimanale) | "capo" (Piano IA). Payload libero.
# ---------------------------------------------------------------------------
class SavedPlanCreate(BaseModel):
    name: str
    kind: str  # "weekly" | "capo"
    payload: dict = {}


@api_router.get("/plans/archive")
async def list_saved_plans(kind: Optional[str] = None, user: dict = Depends(current_user)):
    q = {"user_id": user["user_id"]}
    if kind in ("weekly", "capo"):
        q["kind"] = kind
    docs = await db.saved_plans.find(q, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs


@api_router.post("/plans/archive")
async def create_saved_plan(payload: SavedPlanCreate, user: dict = Depends(current_user)):
    if payload.kind not in ("weekly", "capo"):
        raise HTTPException(status_code=400, detail="kind non valido")
    name = (payload.name or "").strip()[:80]
    if not name:
        raise HTTPException(status_code=400, detail="Nome richiesto")
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "name": name,
        "kind": payload.kind,
        "payload": payload.payload or {},
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.saved_plans.insert_one(dict(doc))
    return doc


@api_router.delete("/plans/archive/{plan_id}")
async def delete_saved_plan(plan_id: str, user: dict = Depends(current_user)):
    res = await db.saved_plans.delete_one({"id": plan_id, "user_id": user["user_id"]})
    return {"success": res.deleted_count > 0}


class SavedPlanRename(BaseModel):
    name: str


@api_router.patch("/plans/archive/{plan_id}")
async def rename_saved_plan(plan_id: str, payload: SavedPlanRename, user: dict = Depends(current_user)):
    name = (payload.name or "").strip()[:80]
    if not name:
        raise HTTPException(status_code=400, detail="Nome richiesto")
    res = await db.saved_plans.update_one(
        {"id": plan_id, "user_id": user["user_id"]},
        {"$set": {"name": name, "updated_at": now_iso()}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Piano non trovato")
    return {"success": True, "name": name}


# ---------------------------------------------------------------------------
# News curate dall'admin (feed "arte bianca" mostrato in Home). Trilingue.
# ---------------------------------------------------------------------------
class NewsItemIn(BaseModel):
    title: str = ""
    title_de: str = ""
    title_en: str = ""
    body: str = ""
    body_de: str = ""
    body_en: str = ""
    tag: str = ""
    link: str = ""


@api_router.get("/news-items")
async def list_news_items():
    return await db.news_items.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)


@api_router.post("/news-items")
async def create_news_item(payload: NewsItemIn, user: dict = Depends(current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Non autorizzato")
    doc = {"id": str(uuid.uuid4()), **payload.model_dump(), "created_at": now_iso(), "updated_at": now_iso()}
    await db.news_items.insert_one(dict(doc))
    return doc


@api_router.put("/news-items/{nid}")
async def update_news_item(nid: str, payload: NewsItemIn, user: dict = Depends(current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Non autorizzato")
    res = await db.news_items.update_one({"id": nid}, {"$set": {**payload.model_dump(), "updated_at": now_iso()}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="News non trovata")
    return {"success": True}


@api_router.delete("/news-items/{nid}")
async def delete_news_item(nid: str, user: dict = Depends(current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Non autorizzato")
    await db.news_items.delete_one({"id": nid})
    return {"success": True}


# ---------------------------------------------------------------------------
# Capo Laboratorio — configurazione attrezzature/celle (single persisted doc)
# ---------------------------------------------------------------------------
@api_router.get("/lab-config")
async def get_lab_config():
    doc = await db.lab_config.find_one({"_key": "default"}, {"_id": 0, "_key": 0})
    return doc  # null if never saved


@api_router.put("/lab-config", response_model=LabConfig)
async def save_lab_config(payload: LabConfig, admin: dict = Depends(require_admin)):
    payload.updated_at = now_iso()
    doc = payload.model_dump()
    await db.lab_config.update_one(
        {"_key": "default"}, {"$set": {**doc, "_key": "default"}}, upsert=True
    )
    return payload


# ---------------------------------------------------------------------------
# Lab Shift State — stato operativo CONDIVISO del turno (lotti, guasti, celle, note)
# Documento singolo (_key="default"): tutti i dispositivi del laboratorio vedono lo
# stesso stato, così il "passaggio di consegne" tra chi lavora funziona in tempo reale.
# ---------------------------------------------------------------------------
class LabShiftState(BaseModel):
    work_mode: str = "continuo"        # "continuo" (flusso) | "autonomia" (prep. anticipata)
    batches: List[dict] = []           # {id, recipe_id, recipe_name, pieces, status, note, updated_at}
    bases: List[dict] = []             # basi/pre-cotti manuali {id, product, qty, unit, kind, updated_at}
    machines_down: List[dict] = []     # {id, name, at}
    cold_down: bool = False            # cella/fermalievitazione fuori uso stanotte
    cold_note: Optional[str] = ""
    shift_notes: List[dict] = []       # note per il turno successivo {id, text, kind, at}
    updated_at: Optional[str] = None


@api_router.get("/lab/shift-state")
async def get_lab_shift_state(user: Optional[dict] = Depends(optional_user)):
    doc = await db.lab_shift_state.find_one({"_key": "default"}, {"_id": 0, "_key": 0})
    return doc or LabShiftState().model_dump()


@api_router.put("/lab/shift-state", response_model=LabShiftState)
async def save_lab_shift_state(payload: LabShiftState, user: Optional[dict] = Depends(optional_user)):
    payload.updated_at = now_iso()
    doc = payload.model_dump()
    await db.lab_shift_state.update_one(
        {"_key": "default"}, {"$set": {**doc, "_key": "default"}}, upsert=True
    )
    return payload
