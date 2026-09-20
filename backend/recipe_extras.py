# ruff: noqa: F821  (i nomi sono iniettati a runtime dal core via lo shim globals().update)
"""MikiLab — Il Manuale di Sitor · Extra ricetta (collezione NUOVA `recipe_extras`).
Non tocca mai la collezione `recipes` (riscritta dal seed). Qui vivono: difficoltà,
attrezzi, foto reale, verifica, nascondi-pubblico, "il trucco di Michele".
Include il calcolo automatico di difficoltà, allergeni, avvisi di sicurezza e i
modelli di attrezzatura per categoria.
"""
import server as _core
globals().update({k: v for k, v in vars(_core).items() if not k.startswith("__")})

from pydantic import BaseModel as _BM
from typing import Optional as _Opt, List as _List


def _rblob(r: dict) -> str:
    parts = [r.get("name") or "", r.get("real_name") or "", r.get("preferment_type") or "",
             r.get("method_type") or "", r.get("dough_category") or "", r.get("menu_category") or "",
             r.get("procedure") or "", r.get("notes") or "", r.get("flour_type") or ""]
    return " ".join(str(p) for p in parts).lower()


def calc_hydration(r: dict):
    """Idratazione CALCOLATA (acqua ÷ farina × 100). None se non calcolabile o incoerente."""
    try:
        f = float(r.get("flour_grams") or 0)
        w = float(r.get("water_grams") or 0)
        if f <= 0 or w <= 0:
            return None
        h = w / f * 100.0
        if h < 20 or h > 130:
            return None
        return round(h)
    except Exception:
        return None


def _bake_temp(r: dict):
    for k in ("bake_temp", "bake_temp_c", "oven_temp", "temperatura_cottura"):
        try:
            v = r.get(k)
            if v is not None and float(v) > 0:
                return float(v)
        except Exception:
            continue
    return None


def auto_difficulty(r: dict) -> str:
    blob = _rblob(r)
    hyd = r.get("hydration_percent")
    laminated = any(k in blob for k in ["sfogli", "laminaz", "laminat", "croissant", "cornetto sfogli", "pasta sfoglia", "blätterteig", "plunder"])
    lye = any(k in blob for k in ["liscivia", "lauge", "laugen", "soda caustica", "natronlauge", "brezel", "bretzel", "laugengeb"])
    big_leaven = any(k in blob for k in ["panettone", "veneziana", "pandoro", "colomba", "stollen"])
    has_lm = any(k in blob for k in ["lievito madre", "pasta madre", "licoli", "li.co.li", "lievito naturale", "sauerteig", "sourdough", "levain"])
    poolish_biga = any(k in blob for k in ["poolish", "biga", "vorteig"]) or (r.get("preferment_type") or "").lower() in ("poolish", "biga")
    rich = any(k in blob for k in ["brioche", "burro", "butter", "uova", "tuorl", "zucchero", "panettone", "veneziana"])
    try:
        hyd_high = hyd is not None and float(hyd) >= 85
    except Exception:
        hyd_high = False
    calc_h = calc_hydration(r)
    bt = _bake_temp(r)
    is_focaccia = "focaccia" in blob
    # SFIDA
    if laminated or lye:
        return "sfida"
    if big_leaven and has_lm:
        return "sfida"
    if has_lm and hyd_high:
        return "sfida"
    if bt is not None and bt > 280:
        return "sfida"
    # FOCACCE in teglia: ignora l'idratazione. FACILE se non cita lievito madre, altrimenti MEDIA.
    if is_focaccia:
        return "media" if has_lm else "facile"
    # MEDIA
    if poolish_biga or (big_leaven and not has_lm) or rich or has_lm:
        return "media"
    if calc_h is not None and calc_h >= 80:
        return "media"
    # FACILE
    return "facile"


_ALLERGEN_KW = {
    "glutine": ["farina", "flour", "mehl", "grano", "weizen", "wheat", "semola", "farro", "spelt", "dinkel", "segale", "roggen", "rye", "malto", "malz", "orzo", "gerste", "barley", "kamut", "manitoba", "00", "tipo 0", "miglioratore", "improver", "verbesserer", "backmittel"],
    "uova": ["uovo", "uova", "egg", " ei", "eier", "tuorl", "albume", "eigelb", "eiweiss"],
    "latte": ["latte", "milch", "milk", "burro", "butter", "panna", "sahne", "cream", "formagg", "käse", "kase", "cheese", "yogurt", "joghurt", "mascarpone", "ricotta", "quark", "siero"],
    "frutta_a_guscio": ["mandorl", "almond", "mandel", "nocciol", "hazelnut", "hasel", "noci", "walnut", "nuss", "pistacch", "pistachio", "anacard", "cashew", "pecan", "pinoli"],
    "sesamo": ["sesamo", "sesam", "sesame"],
    "soia": ["soia", "soja", "soy"],
    "lupino": ["lupino", "lupin", "miglioratore", "improver", "verbesserer", "backmittel"],
    "arachidi": ["arachid", "peanut", "erdnuss"],
}
_ALLERGEN_LABEL = {
    "glutine": {"it": "Glutine", "de": "Gluten", "en": "Gluten"},
    "uova": {"it": "Uova", "de": "Eier", "en": "Eggs"},
    "latte": {"it": "Latte", "de": "Milch", "en": "Milk"},
    "frutta_a_guscio": {"it": "Frutta a guscio", "de": "Schalenfrüchte", "en": "Tree nuts"},
    "sesamo": {"it": "Sesamo", "de": "Sesam", "en": "Sesame"},
    "soia": {"it": "Soia", "de": "Soja", "en": "Soy"},
    "lupino": {"it": "Lupino", "de": "Lupine", "en": "Lupin"},
    "arachidi": {"it": "Arachidi", "de": "Erdnüsse", "en": "Peanuts"},
}


def derive_allergens(r: dict) -> _List[str]:
    ing = " ".join([(i.get("name") or "") for i in (r.get("extra_ingredients") or []) if isinstance(i, dict)]).lower()
    blob = (ing + " " + (r.get("procedure") or "") + " " + (r.get("flour_type") or "") + " " + (r.get("name") or "")).lower()
    found = []
    for key, kws in _ALLERGEN_KW.items():
        if any(k in blob for k in kws):
            found.append(key)
    return found


def derive_safety(r: dict) -> _List[str]:
    blob = _rblob(r)
    out = []
    if any(k in blob for k in ["liscivia", "lauge", "laugen", "soda caustica", "natronlauge", "brezel", "bretzel"]):
        out.append("lye")
    if any(k in blob for k in ["forno", "oven", "backofen", "vapore", "steam", "dampf", "cottura"]):
        out.append("oven")
    bt = _bake_temp(r)
    if bt is not None and bt > 280:
        out.append("hot_high_temp")
    if any(k in blob for k in ["fritt", "friggere", "olio caldo", "panzerotti", "frittelle", "frittieren", "frying", "deep fry"]):
        out.append("frying")
    return out


# Modelli di attrezzatura per categoria (segnati "bozza"). name IT/DE/EN + buy.
_EQ = lambda it, de, en, buy_it, buy_de, buy_en, opt=False: {  # noqa: E731
    "it": it, "de": de, "en": en, "buy": {"it": buy_it, "de": buy_de, "en": buy_en}, "optional": opt}

EQUIPMENT_TEMPLATES = {
    "panettone": [
        _EQ("Stampi di carta (500 g o 1 kg)", "Papierformen (500 g oder 1 kg)", "Paper moulds (500 g or 1 kg)",
            "articoli per pasticceria / online", "Backbedarf / online", "baking supplies / online"),
        _EQ("Ferri/spiedi lunghi per capovolgere", "Lange Spieße zum Umdrehen", "Long skewers to flip",
            "casalinghi", "Haushaltswaren", "houseware store"),
        _EQ("Due supporti alti per appendere a testa in giù", "Zwei hohe Halter zum Kopfüber-Aufhängen", "Two tall supports to hang upside down",
            "es. due sedie con un bastone", "z. B. zwei Stühle mit einer Stange", "e.g. two chairs with a bar"),
        _EQ("Termometro a sonda (cuore)", "Kernthermometer (Sonde)", "Probe thermometer (core)",
            "casalinghi / online", "Haushalt / online", "houseware / online"),
        _EQ("Termometro da forno", "Ofenthermometer", "Oven thermometer",
            "casalinghi / online", "Haushalt / online", "houseware / online"),
        _EQ("Bilancia (1 g)", "Waage (1 g)", "Scale (1 g)", "casalinghi", "Haushalt", "houseware"),
        _EQ("Planetaria robusta", "Robuste Küchenmaschine", "Sturdy stand mixer",
            "elettrodomestici", "Elektrofachhandel", "appliance store"),
    ],
    "lievito_madre": [
        _EQ("Barattolo di vetro trasparente con elastico", "Durchsichtiges Glas mit Gummiband", "Clear glass jar with rubber band",
            "casalinghi", "Haushaltswaren", "houseware store"),
        _EQ("Termometro ambiente", "Raumthermometer", "Room thermometer",
            "casalinghi / online", "Haushalt / online", "houseware / online"),
    ],
    "generico": [
        _EQ("Bilancia (1 g)", "Waage (1 g)", "Scale (1 g)", "casalinghi", "Haushalt", "houseware"),
        _EQ("Ciotola capiente", "Große Schüssel", "Large bowl", "casalinghi", "Haushalt", "houseware"),
        _EQ("Termometro da forno", "Ofenthermometer", "Oven thermometer",
            "casalinghi / online", "Haushalt / online", "houseware / online", True),
    ],
}


def equipment_template(r: dict) -> _List[dict]:
    blob = _rblob(r)
    items = list(EQUIPMENT_TEMPLATES["generico"])
    if any(k in blob for k in ["panettone", "veneziana", "colomba", "pandoro", "stollen"]):
        items = list(EQUIPMENT_TEMPLATES["panettone"])
    if any(k in blob for k in ["lievito madre", "pasta madre", "licoli", "li.co.li", "sauerteig", "sourdough"]):
        items = items + list(EQUIPMENT_TEMPLATES["lievito_madre"])
    return items


def _leaven_kind(r: dict) -> str:
    blob = _rblob(r)
    if any(k in blob for k in ["licoli", "li.co.li"]) or (r.get("preferment_type") or "").lower() == "licoli":
        return "licoli"
    if any(k in blob for k in ["lievito madre", "pasta madre", "sauerteig", "sourdough", "lievito naturale"]):
        return "lm"
    return ""


class ExtrasUpdate(_BM):
    difficulty: _Opt[str] = None            # facile | media | sfida
    equipment: _Opt[_List[dict]] = None
    real_photo: _Opt[bool] = None
    verified: _Opt[bool] = None
    hidden_public: _Opt[bool] = None
    michele_tip: _Opt[dict] = None          # {it, de, en}
    status: _Opt[str] = None                # sitor_draft | reviewed | tested
    test_date: _Opt[str] = None             # Diario prove: data ISO della prova
    test_outcome: _Opt[str] = None          # Diario prove: "" | ok | da_rifare
    test_notes: _Opt[str] = None            # Diario prove: note private di Michele


def _recipe_status(stored: dict) -> str:
    """J1: stato ricetta. 'tested' (provata da Michele) > 'reviewed' (verified) > 'sitor_draft'."""
    st = (stored or {}).get("status")
    if st == "tested":
        return "tested"
    if (stored or {}).get("verified"):
        return "reviewed"
    return "sitor_draft"


def _extras_public(r: dict, stored: dict) -> dict:
    stored = stored or {}
    diff = stored.get("difficulty") or auto_difficulty(r)
    equip = stored.get("equipment") or equipment_template(r)
    return {
        "recipe_id": r.get("id"),
        "difficulty": diff,
        "difficulty_auto": auto_difficulty(r),
        "difficulty_overridden": bool(stored.get("difficulty")),
        "equipment": equip,
        "equipment_draft": not bool(stored.get("equipment")),
        "allergens": derive_allergens(r),
        "safety": derive_safety(r),
        "leaven_kind": _leaven_kind(r),
        "calc_hydration": calc_hydration(r),
        "bake_temp": _bake_temp(r),
        "real_photo": bool(stored.get("real_photo")),
        "verified": bool(stored.get("verified")),
        "status": _recipe_status(stored),
        "hidden_public": bool(stored.get("hidden_public")),
        "michele_tip": stored.get("michele_tip") or {},
        "kind": stored.get("kind") or "recipe",
        "mix_unit_g": stored.get("mix_unit_g") or 100,
        "mix_composition": stored.get("mix_composition") or [],
    }


def _diario_private(stored: dict) -> dict:
    """Diario prove: campi PRIVATI (solo admin) da unire alla risposta pubblica."""
    stored = stored or {}
    return {
        "test_date": stored.get("test_date") or "",
        "test_outcome": stored.get("test_outcome") or "",
        "test_notes": stored.get("test_notes") or "",
    }


@api_router.get("/recipe-extras/{recipe_id}")
async def recipe_extras_get(recipe_id: str, user: _Opt[dict] = Depends(optional_user)):
    r = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    if not r:
        raise HTTPException(status_code=404, detail="recipe_not_found")
    stored = await db.recipe_extras.find_one({"recipe_id": recipe_id}, {"_id": 0})
    data = _extras_public(r, stored)
    if user and user.get("role") == "admin":
        data.update(_diario_private(stored))
    return data


@api_router.get("/recipe-extras")
async def recipe_extras_list(user: _Opt[dict] = Depends(optional_user)):
    """Mappa leggera per la galleria: difficoltà + hidden_public per ogni ricetta."""
    stored = {d["recipe_id"]: d async for d in db.recipe_extras.find({}, {"_id": 0})}
    out = {}
    async for r in db.recipes.find({"collection_name": "mikilab", "hidden": {"$ne": True}}, {"_id": 0, "id": 1, "name": 1, "preferment_type": 1, "method_type": 1, "dough_category": 1, "menu_category": 1, "procedure": 1, "notes": 1, "flour_type": 1, "hydration_percent": 1}):
        rid = r.get("id")
        s = stored.get(rid) or {}
        out[rid] = {
            "difficulty": s.get("difficulty") or auto_difficulty(r),
            "hidden_public": bool(s.get("hidden_public")),
            "real_photo": bool(s.get("real_photo")),
            "status": _recipe_status(s),
            "verified": bool(s.get("verified")),
        }
    return out


@api_router.put("/recipe-extras/{recipe_id}")
async def recipe_extras_put(recipe_id: str, body: ExtrasUpdate, admin: dict = Depends(require_admin)):
    r = await db.recipes.find_one({"id": recipe_id}, {"_id": 0, "id": 1})
    if not r:
        raise HTTPException(status_code=404, detail="recipe_not_found")
    upd = {k: v for k, v in body.dict().items() if v is not None}
    if body.difficulty is not None and body.difficulty not in ("facile", "media", "sfida"):
        raise HTTPException(status_code=400, detail="difficulty_invalid")
    if body.status is not None and body.status not in ("sitor_draft", "reviewed", "tested"):
        raise HTTPException(status_code=400, detail="status_invalid")
    if body.test_outcome is not None and body.test_outcome not in ("", "ok", "da_rifare"):
        raise HTTPException(status_code=400, detail="test_outcome_invalid")
    upd["recipe_id"] = recipe_id
    upd["updated_at"] = now_iso()
    await db.recipe_extras.update_one({"recipe_id": recipe_id}, {"$set": upd}, upsert=True)
    stored = await db.recipe_extras.find_one({"recipe_id": recipe_id}, {"_id": 0})
    full = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    data = _extras_public(full, stored)
    data.update(_diario_private(stored))
    return data


# Pagina guida "Attrezzi": elenco unico di tutti gli attrezzi dei modelli.
@api_router.get("/equipment-guide")
async def equipment_guide():
    seen = {}
    for cat in EQUIPMENT_TEMPLATES.values():
        for it in cat:
            seen[it["it"]] = it
    return {"items": list(seen.values())}
