# ruff: noqa: F821  (i nomi sono iniettati a runtime dal core via lo shim globals().update)
"""MikiLab — Ricette: crea/modifica/elimina (admin), traduzione, foto caricate, preferiti."""
import server as _core
globals().update({k: v for k, v in vars(_core).items() if not k.startswith("__")})

# ==========================================================================
# GENERATORE DI RICETTE CUSTOM (Il Tuo Laboratorio) — metodo Mickey Lab
# Calcolo deterministico con percentuali del panificatore + procedimento AI.
# ==========================================================================


@api_router.post("/recipes", response_model=Recipe)
async def create_recipe(payload: RecipeCreate, user: dict = Depends(current_user)):
    if payload.collection_name == "mikilab" and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Solo l'admin può modificare le ricette Mikilab")
    recipe = Recipe(**payload.model_dump())
    doc = recipe.model_dump()
    # Isolamento per azienda: OGNI ricetta (mikilab o personale) appartiene all'azienda del creatore.
    doc["organization_id"] = _org_id(user)
    if payload.collection_name != "mikilab":
        doc["owner_id"] = user["user_id"]
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
        if (existing.get("organization_id") or ORG_DEFAULT) != _org_id(user):
            raise HTTPException(status_code=404, detail="Ricetta non trovata")
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
    if (existing.get("organization_id") or ORG_DEFAULT) != _org_id(user):
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
    if (existing.get("organization_id") or ORG_DEFAULT) != _org_id(user):
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
        if (existing.get("organization_id") or ORG_DEFAULT) != _org_id(user):
            raise HTTPException(status_code=404, detail="Ricetta non trovata")
    elif existing.get("owner_id") != user["user_id"]:
        raise HTTPException(status_code=403, detail="Non autorizzato")
    await db.recipes.delete_one({"id": recipe_id})
    return {"success": True}


# ---------------------------------------------------------------------------
# Preferiti ricette — per-account + conteggio pubblico ("❤ N")
# ---------------------------------------------------------------------------
class FavToggle(BaseModel):
    recipe_id: str


class FavSync(BaseModel):
    ids: List[str] = []


@api_router.get("/favorites")
async def get_favorites(user: dict = Depends(current_user)):
    docs = await db.favorites.find({"user_id": user["user_id"], "organization_id": _org_id(user)}, {"_id": 0, "recipe_id": 1}).to_list(3000)
    return [d["recipe_id"] for d in docs]


@api_router.post("/favorites/toggle")
async def toggle_favorite(payload: FavToggle, user: dict = Depends(current_user)):
    org = _org_id(user)
    q = {"user_id": user["user_id"], "recipe_id": payload.recipe_id, "organization_id": org}
    existing = await db.favorites.find_one(q)
    if existing:
        await db.favorites.delete_one(q)
        return {"recipe_id": payload.recipe_id, "favorite": False}
    await db.favorites.insert_one({**q, "created_at": now_iso()})
    return {"recipe_id": payload.recipe_id, "favorite": True}


@api_router.post("/favorites/sync")
async def sync_favorites(payload: FavSync, user: dict = Depends(current_user)):
    org = _org_id(user)
    for rid in payload.ids:
        await db.favorites.update_one(
            {"user_id": user["user_id"], "recipe_id": rid, "organization_id": org},
            {"$setOnInsert": {"user_id": user["user_id"], "recipe_id": rid, "organization_id": org, "created_at": now_iso()}},
            upsert=True,
        )
    docs = await db.favorites.find({"user_id": user["user_id"], "organization_id": org}, {"_id": 0, "recipe_id": 1}).to_list(3000)
    return [d["recipe_id"] for d in docs]


@api_router.get("/favorites/counts")
async def favorites_counts(org: str = Depends(effective_org)):
    rows = await db.favorites.aggregate([{"$match": {"organization_id": org}}, {"$group": {"_id": "$recipe_id", "count": {"$sum": 1}}}]).to_list(5000)
    return {r["_id"]: r["count"] for r in rows if r["_id"]}


