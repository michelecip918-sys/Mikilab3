# ruff: noqa: F821  (i nomi del core sono iniettati via globals().update)
"""MikiLab — Il Manuale di Sitor · STADIO 2B.
Collezioni NUOVE (non toccano le ricette):
  - experiments      → "Il Test del Mese" (J2), voti anonimi aggregati.
  - flour_types      → traduttore farine IT/DE/FR (P2), righe BOZZA da pubblicare.
  - bread_calendar   → calendario del pane (P3), eventi BOZZA da approvare.
Nessun testo utente né identificativo salvato: i voti contengono solo scelte e giorno.
"""
import server as _core
globals().update({k: v for k, v in vars(_core).items() if not k.startswith("__")})

from datetime import date as _date
from pydantic import BaseModel as _BM
from typing import Optional as _Opt, List as _List, Dict as _Dict


def _l2(lang: str) -> str:
    x = (lang or "it").split("-")[0][:2].lower()
    return x if x in ("it", "de", "en") else "it"


# ===========================================================================
# J2 — IL TEST DEL MESE (experiments)
# ===========================================================================
_EXP_SEED = [
    {"slug": "patata-focaccia", "status": "draft", "country": "it",
     "title": {"it": "La patata lessa schiacciata rende la focaccia più morbida?",
               "de": "Macht zerdrückte Salzkartoffel die Focaccia weicher?",
               "en": "Does mashed boiled potato make focaccia softer?"},
     "question": {"it": "Aggiungere patata lessa schiacciata all'impasto della focaccia la rende più morbida il giorno dopo?",
                  "de": "Macht zugegebene zerdrückte Salzkartoffel die Focaccia am nächsten Tag weicher?",
                  "en": "Does adding mashed boiled potato make focaccia softer the next day?"},
     "recipe_name": "", "single_dough": True,
     "variant_a": {"it": "Senza patata", "de": "Ohne Kartoffel", "en": "Without potato"},
     "variant_b": {"it": "Con patata (quantità decisa da Michele)", "de": "Mit Kartoffel (Menge von Michele)", "en": "With potato (amount set by Michele)"},
     "evaluates": ["morbidezza", "sapore", "mollica", "rifaresti"]},
    {"slug": "olio-focaccia", "status": "draft", "country": "it",
     "title": {"it": "Il filo d'olio: a chiudere l'impasto o all'inizio?",
               "de": "Der Schuss Öl: am Ende des Knetens oder am Anfang?",
               "en": "The drizzle of oil: at the end of kneading or at the start?"},
     "question": {"it": "Aggiungere l'olio a fine impasto cambia mollica e morbidezza rispetto all'inizio?",
                  "de": "Ändert Öl am Ende des Knetens Krume und Weichheit gegenüber dem Anfang?",
                  "en": "Does adding oil at the end change crumb and softness versus at the start?"},
     "recipe_name": "", "single_dough": True,
     "variant_a": {"it": "Olio all'inizio", "de": "Öl am Anfang", "en": "Oil at the start"},
     "variant_b": {"it": "Olio a chiudere", "de": "Öl zum Schluss", "en": "Oil at the end"},
     "evaluates": ["mollica", "morbidezza", "sapore", "rifaresti"]},
    {"slug": "due-orologi", "status": "draft", "country": "it",
     "title": {"it": "Due orologi: 4-6 ore con lievito di birra o 12+ ore con biga?",
               "de": "Zwei Uhren: 4-6 Std. mit Hefe oder 12+ Std. mit Biga?",
               "en": "Two clocks: 4-6 h with yeast or 12+ h with biga?"},
     "question": {"it": "Quale focaccia preferisci: fermentazione breve con lievito di birra o lunga con biga?",
                  "de": "Welche Focaccia bevorzugst du: kurze Gärung mit Hefe oder lange mit Biga?",
                  "en": "Which focaccia do you prefer: short ferment with yeast or long with biga?"},
     "recipe_name": "", "single_dough": False,
     "variant_a": {"it": "4-6 ore, lievito di birra", "de": "4-6 Std., Hefe", "en": "4-6 h, yeast"},
     "variant_b": {"it": "12+ ore, biga", "de": "12+ Std., Biga", "en": "12+ h, biga"},
     "evaluates": ["sapore", "mollica", "profumo", "rifaresti"]},
]
_EVAL_LABELS = {
    "morbidezza": {"it": "Morbidezza", "de": "Weichheit", "en": "Softness"},
    "sapore": {"it": "Sapore", "de": "Geschmack", "en": "Flavour"},
    "mollica": {"it": "Mollica", "de": "Krume", "en": "Crumb"},
    "profumo": {"it": "Profumo", "de": "Aroma", "en": "Aroma"},
    "rifaresti": {"it": "Lo rifaresti", "de": "Wieder machen", "en": "Would remake"},
}
_MIN_VOTES = 30


async def _seed_experiments():
    if await db.experiments.count_documents({}) == 0:
        for e in _EXP_SEED:
            await db.experiments.insert_one({**e, "verdict": "", "michele_comment": {},
                                             "created_at": now_iso()})


async def _exp_results(slug: str) -> dict:
    counts, total = {}, 0
    async for v in db.experiment_votes.find({"slug": slug}, {"_id": 0, "choices": 1}):
        total += 1
        for crit, ch in (v.get("choices") or {}).items():
            counts.setdefault(crit, {"A": 0, "B": 0, "same": 0, "nocompare": 0})
            if ch in counts[crit]:
                counts[crit][ch] += 1
    return {"total": total, "counts": counts}


def _exp_public(e: dict, evals=True) -> dict:
    out = {"slug": e["slug"], "status": e.get("status"), "country": e.get("country"),
           "title": e.get("title", {}), "question": e.get("question", {}),
           "recipe_name": e.get("recipe_name") or "", "single_dough": bool(e.get("single_dough")),
           "variant_a": e.get("variant_a", {}), "variant_b": e.get("variant_b", {}),
           "evaluates": e.get("evaluates", []),
           "eval_labels": {k: _EVAL_LABELS.get(k, {"it": k, "de": k, "en": k}) for k in e.get("evaluates", [])},
           "verdict": e.get("verdict") or "", "michele_comment": e.get("michele_comment", {})}
    return out


@api_router.get("/experiments")
async def experiments_get(reveal: int = 0):
    await _seed_experiments()
    op = await db.experiments.find_one({"status": "open"}, {"_id": 0})
    open_out = None
    if op:
        open_out = _exp_public(op)
        res = await _exp_results(op["slug"])
        open_out["total_votes"] = res["total"]
        open_out["enough"] = res["total"] >= _MIN_VOTES
        if (reveal and res["total"] >= _MIN_VOTES):
            open_out["results"] = res["counts"]
    archive = []
    for e in await db.experiments.find({"status": "closed"}, {"_id": 0}).sort("created_at", -1).to_list(30):
        a = _exp_public(e)
        res = await _exp_results(e["slug"])
        a["total_votes"] = res["total"]
        a["results"] = res["counts"] if res["total"] >= _MIN_VOTES else {}
        a["enough"] = res["total"] >= _MIN_VOTES
        archive.append(a)
    return {"open": open_out, "archive": archive, "min_votes": _MIN_VOTES}


class ExpVote(_BM):
    choices: _Dict[str, str] = {}
    token: str = ""


@api_router.post("/experiments/vote/{slug}")
async def experiments_vote(slug: str, body: ExpVote, request: Request):
    e = await db.experiments.find_one({"slug": slug, "status": "open"}, {"_id": 0, "slug": 1, "evaluates": 1})
    if not e:
        raise HTTPException(status_code=404, detail="no_open_test")
    dev = _device_id(request)
    # l'hash serve SOLO al limite (un voto per dispositivo) e non viene salvato col voto
    if not await _rate_limit(f"exp_vote_{slug}", dev, 1, 400 * 86400):
        return {"ok": False, "already": True}
    valid = {"A", "B", "same", "nocompare"}
    choices = {k: v for k, v in (body.choices or {}).items() if k in e.get("evaluates", []) and v in valid}
    if not choices:
        raise HTTPException(status_code=400, detail="no_choices")
    day = datetime.now(timezone.utc).date().isoformat()
    await db.experiment_votes.insert_one({"slug": slug, "choices": choices, "day": day})
    await _bump_usage("experiment_votes")
    res = await _exp_results(slug)
    return {"ok": True, "total_votes": res["total"], "enough": res["total"] >= _MIN_VOTES,
            "results": res["counts"] if res["total"] >= _MIN_VOTES else {}}


class ExpEdit(_BM):
    title: _Opt[dict] = None
    question: _Opt[dict] = None
    hypothesis: _Opt[dict] = None
    protocol: _Opt[list] = None
    recipe_name: _Opt[str] = None
    single_dough: _Opt[bool] = None
    variant_a: _Opt[dict] = None
    variant_b: _Opt[dict] = None
    evaluates: _Opt[list] = None
    status: _Opt[str] = None
    verdict: _Opt[str] = None
    michele_comment: _Opt[dict] = None


@api_router.get("/admin/experiments")
async def admin_experiments(admin: dict = Depends(require_admin)):
    await _seed_experiments()
    docs = await db.experiments.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for d in docs:
        d["total_votes"] = (await _exp_results(d["slug"]))["total"]
    return {"experiments": docs}


@api_router.put("/experiments/{slug}")
async def experiments_edit(slug: str, body: ExpEdit, admin: dict = Depends(require_admin)):
    upd = {k: v for k, v in body.dict().items() if v is not None}
    if "status" in upd and upd["status"] not in ("draft", "open", "closed"):
        raise HTTPException(status_code=400, detail="status_invalid")
    if "status" in upd and upd["status"] == "open":
        await db.experiments.update_many({"status": "open"}, {"$set": {"status": "closed"}})
    upd["updated_at"] = now_iso()
    await db.experiments.update_one({"slug": slug}, {"$set": {"slug": slug, **upd}}, upsert=True)
    # verdetto "confermato" → "Il trucco di Michele" sulla ricetta collegata
    if upd.get("verdict") == "confirmed":
        e = await db.experiments.find_one({"slug": slug}, {"_id": 0})
        rn = (e or {}).get("recipe_name")
        if rn:
            r = await db.recipes.find_one({"collection_name": "mikilab", "name": rn}, {"_id": 0, "id": 1})
            if r and (e.get("michele_comment")):
                await db.recipe_extras.update_one({"recipe_id": r["id"]},
                    {"$set": {"recipe_id": r["id"], "michele_tip": e["michele_comment"]}}, upsert=True)
    return {"ok": True}


# ===========================================================================
# P2 — TRADUTTORE DI FARINE (flour_types), righe BOZZA, pubblicate dall'admin
# ===========================================================================
_FLOUR_SEED = [
    {"country": "de", "code": "405", "use": {"it": "farina da casa e dolci", "de": "Haushalts- und Kuchenmehl", "en": "home baking and cakes"}, "ash": "≤ 0,50%", "w": None},
    {"country": "de", "code": "550", "use": {"it": "forte, per impasti a pori fini e tuttofare", "de": "kräftig, feinporig und universell", "en": "strong, fine crumb and all-purpose"}, "ash": "0,51-0,63%", "w": None},
    {"country": "de", "code": "630 (Dinkel)", "use": {"it": "farro/spelta chiara", "de": "helles Dinkelmehl", "en": "light spelt flour"}, "ash": "≤ 0,63%", "w": None},
    {"country": "de", "code": "812", "use": {"it": "pani misti chiari", "de": "helle Mischbrote", "en": "light mixed breads"}, "ash": "0,64-0,90%", "w": None},
    {"country": "de", "code": "1050", "use": {"it": "pani misti", "de": "Mischbrote", "en": "mixed breads"}, "ash": "0,91-1,20%", "w": None},
    {"country": "de", "code": "1600", "use": {"it": "pani scuri", "de": "dunkle Brote", "en": "dark breads"}, "ash": "1,21-1,80%", "w": None},
    {"country": "de", "code": "1700 (Schrot)", "use": {"it": "Schrot senza germe", "de": "Schrot ohne Keim", "en": "wholemeal meal without germ"}, "ash": "≥ 1,80%", "w": None},
    {"country": "fr", "code": "T45", "use": {"it": "da pasticceria", "de": "für Feingebäck", "en": "pastry"}, "ash": "< 0,50%", "w": None},
    {"country": "fr", "code": "T55", "use": {"it": "standard da panificazione", "de": "Standard-Backmehl", "en": "standard bread flour"}, "ash": "0,50-0,60%", "w": None},
    {"country": "fr", "code": "T65", "use": {"it": "da pane", "de": "Brotmehl", "en": "bread flour"}, "ash": "0,62-0,75%", "w": None},
    {"country": "fr", "code": "T80", "use": {"it": "da pane (semi-integrale)", "de": "Brotmehl (halbvoll)", "en": "bread (semi-wholemeal)"}, "ash": "0,75-0,90%", "w": None},
    {"country": "fr", "code": "T110", "use": {"it": "da pane (semi-integrale scuro)", "de": "Brotmehl (dunkler)", "en": "bread (darker)"}, "ash": "1,00-1,20%", "w": None},
    {"country": "fr", "code": "T150", "use": {"it": "integrale", "de": "Vollkorn", "en": "wholemeal"}, "ash": "> 1,40%", "w": None},
    {"country": "it", "code": "00", "use": {"it": "raffinata", "de": "sehr fein (raffiniert)", "en": "very refined"}, "ash": None, "w": None},
    {"country": "it", "code": "0", "use": {"it": "raffinata", "de": "fein", "en": "refined"}, "ash": None, "w": None},
    {"country": "it", "code": "1", "use": {"it": "semi-integrale chiara", "de": "halbvoll hell", "en": "light semi-wholemeal"}, "ash": None, "w": None},
    {"country": "it", "code": "2", "use": {"it": "semi-integrale", "de": "halbvoll", "en": "semi-wholemeal"}, "ash": None, "w": None},
    {"country": "it", "code": "integrale", "use": {"it": "integrale", "de": "Vollkorn", "en": "wholemeal"}, "ash": None, "w": None},
]


async def _seed_flour():
    if await db.flour_types.count_documents({}) == 0:
        for i, f in enumerate(_FLOUR_SEED):
            await db.flour_types.insert_one({**f, "order": i, "draft_note": True, "published": False, "created_at": now_iso()})


@api_router.get("/flour-types")
async def flour_types_get(user: _Opt[dict] = Depends(optional_user)):
    await _seed_flour()
    is_admin = bool(user and user.get("role") == "admin")
    q = {} if is_admin else {"published": True}
    rows = await db.flour_types.find(q, {"_id": 0}).sort("order", 1).to_list(200)
    published_any = await db.flour_types.count_documents({"published": True}) > 0
    return {"rows": rows, "published": published_any, "is_admin": is_admin}


class FlourEdit(_BM):
    code: _Opt[str] = None
    country: _Opt[str] = None
    use: _Opt[dict] = None
    ash: _Opt[str] = None
    w: _Opt[str] = None
    published: _Opt[bool] = None
    publish_all: _Opt[bool] = None


@api_router.put("/flour-types/{code}")
async def flour_types_edit(code: str, body: FlourEdit, admin: dict = Depends(require_admin)):
    if body.publish_all is not None:
        await db.flour_types.update_many({}, {"$set": {"published": bool(body.publish_all)}})
        return {"ok": True, "published_all": bool(body.publish_all)}
    upd = {k: v for k, v in body.dict().items() if v is not None and k != "publish_all"}
    upd["updated_at"] = now_iso()
    await db.flour_types.update_one({"code": code, "country": (body.country or {})}, {"$set": upd}) if False else \
        await db.flour_types.update_one({"code": code}, {"$set": upd})
    return {"ok": True}


# ===========================================================================
# P3 — CALENDARIO DEL PANE (bread_calendar), eventi BOZZA da approvare
# ===========================================================================
def _easter(year: int) -> _date:
    a = year % 19; b = year // 100; c = year % 100; d = b // 4; e = b % 4
    f = (b + 8) // 25; g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30; i = c // 4; k = c % 4
    ll = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * ll) // 451
    month = (h + ll - 7 * m + 114) // 31
    day = ((h + ll - 7 * m + 114) % 31) + 1
    return _date(year, month, day)


def _nth_weekday(year: int, month: int, weekday: int, n: int) -> _date:
    import calendar as _cal
    days = [d for d in range(1, _cal.monthrange(year, month)[1] + 1) if _date(year, month, d).weekday() == weekday]
    return _date(year, month, days[n - 1] if n > 0 else days[n])


def _event_date(rule: dict, year: int) -> _Opt[_date]:
    try:
        t = rule.get("t")
        if t == "fixed":
            return _date(year, int(rule["m"]), int(rule["d"]))
        if t == "easter":
            from datetime import timedelta as _td
            return _easter(year) + _td(days=int(rule.get("off", 0)))
        if t == "nth":
            return _nth_weekday(year, int(rule["m"]), int(rule["wd"]), int(rule["n"]))
    except Exception:
        return None
    return None


def _T(it, de, en):
    return {"it": it, "de": de, "en": en}


_CAL_SEED = [
    {"slug": "world-bread-day", "country": "world", "rule": {"t": "fixed", "m": 10, "d": 16},
     "title": _T("Giornata mondiale del pane", "Welttag des Brotes", "World Bread Day"),
     "text": _T("Coincide con la Giornata mondiale dell'alimentazione.", "Fällt mit dem Welternährungstag zusammen.", "It coincides with World Food Day."), "recipes": []},
    {"slug": "tag-deutschen-brotes", "country": "de", "rule": {"t": "fixed", "m": 5, "d": 5},
     "title": _T("Tag des Deutschen Brotes", "Tag des Deutschen Brotes", "Day of German Bread"),
     "text": _T("Festa del pane tedesco.", "Feiertag des deutschen Brotes.", "Celebration of German bread."), "recipes": []},
    {"slug": "erntedank", "country": "de", "rule": {"t": "nth", "m": 10, "wd": 6, "n": 1},
     "title": _T("Erntedank (pane del raccolto)", "Erntedank (Erntebrot)", "Harvest Thanksgiving (harvest bread)"),
     "text": _T("Pane del raccolto, prima domenica di ottobre.", "Erntebrot, erster Sonntag im Oktober.", "Harvest bread, first Sunday of October."), "recipes": []},
    {"slug": "sankt-martin", "country": "de", "rule": {"t": "fixed", "m": 11, "d": 11},
     "title": _T("San Martino (Weckmann/Stutenkerl)", "St. Martin (Weckmann/Stutenkerl)", "St. Martin (Weckmann)"),
     "text": _T("Weckmann o Stutenkerl e Martinsbrezel.", "Weckmann oder Stutenkerl und Martinsbrezel.", "Weckmann and Martinsbrezel."), "recipes": []},
    {"slug": "nikolaus", "country": "de", "rule": {"t": "fixed", "m": 12, "d": 6},
     "title": _T("San Nicola (Stutenkerl)", "Nikolaus (Stutenkerl)", "St. Nicholas (Stutenkerl)"),
     "text": _T("Stutenkerl o Weckmann.", "Stutenkerl oder Weckmann.", "Stutenkerl or Weckmann."), "recipes": []},
    {"slug": "christstollen", "country": "de", "rule": {"t": "fixed", "m": 12, "d": 25},
     "title": _T("Natale (Christstollen)", "Weihnachten (Christstollen)", "Christmas (Christstollen)"),
     "text": _T("Lo Stollen si prepara settimane prima.", "Der Stollen wird Wochen vorher gebacken.", "Stollen is prepared weeks ahead."), "recipes": []},
    {"slug": "neujahrsbrezel", "country": "de", "rule": {"t": "fixed", "m": 1, "d": 1},
     "title": _T("Capodanno (Neujahrsbrezel)", "Neujahr (Neujahrsbrezel)", "New Year (Neujahrsbrezel)"),
     "text": _T("Bretzel di Capodanno.", "Neujahrsbrezel.", "New Year pretzel."), "recipes": []},
    {"slug": "dreikoenig", "country": "de", "rule": {"t": "fixed", "m": 1, "d": 6},
     "title": _T("Epifania (Dreikönigskuchen)", "Epiphanie (Dreikönigskuchen)", "Epiphany (Dreikönigskuchen)"),
     "text": _T("Dreikönigskuchen o Dreikönigsbrot.", "Dreikönigskuchen oder -brot.", "Three Kings' cake or bread."), "recipes": []},
    {"slug": "fastnacht", "country": "de", "rule": {"t": "easter", "off": -47},
     "title": _T("Carnevale/Fasnacht (Krapfen)", "Fasnacht (Krapfen)", "Carnival/Fasnacht (Krapfen)"),
     "text": _T("Krapfen, Berliner e Fastnachtsküchle. Avviso frittura.", "Krapfen, Berliner und Fastnachtsküchle. Frittier-Hinweis.", "Krapfen and Berliner. Frying warning."), "recipes": []},
    {"slug": "fastenbrezel", "country": "de", "rule": {"t": "easter", "off": -40},
     "title": _T("Quaresima (Fastenbrezel)", "Fastenzeit (Fastenbrezel)", "Lent (Fastenbrezel)"),
     "text": _T("La Fastenbrezel accompagna la Quaresima.", "Die Fastenbrezel begleitet die Fastenzeit.", "Fastenbrezel during Lent."), "recipes": []},
    {"slug": "osterzopf", "country": "de", "rule": {"t": "easter", "off": 0},
     "title": _T("Pasqua (Osterzopf/Osterbrot)", "Ostern (Osterzopf/Osterbrot)", "Easter (Osterzopf/Osterbrot)"),
     "text": _T("Osterzopf, Hefezopf e Osterbrot.", "Osterzopf, Hefezopf und Osterbrot.", "Osterzopf, Hefezopf and Osterbrot."), "recipes": []},
    {"slug": "santantonio-abate", "country": "it", "rule": {"t": "fixed", "m": 1, "d": 17},
     "title": _T("Sant'Antonio Abate (pane benedetto)", "Hl. Antonius Abt (gesegnetes Brot)", "St. Anthony Abbot (blessed bread)"),
     "text": _T("Pane benedetto in molte zone (tradizione regionale).", "Gesegnetes Brot in vielen Gegenden (regionale Tradition).", "Blessed bread in many areas (regional tradition)."), "recipes": []},
    {"slug": "martedi-grasso", "country": "it", "rule": {"t": "easter", "off": -47},
     "title": _T("Carnevale (chiacchiere e frittelle)", "Karneval (Chiacchiere)", "Carnival (chiacchiere)"),
     "text": _T("Frittelle, chiacchiere e castagnole. Avviso frittura.", "Chiacchiere und Castagnole. Frittier-Hinweis.", "Chiacchiere and castagnole. Frying warning."), "recipes": []},
    {"slug": "san-giuseppe", "country": "it", "rule": {"t": "fixed", "m": 3, "d": 19},
     "title": _T("San Giuseppe (zeppole)", "St. Josef (Zeppole)", "St. Joseph (zeppole)"),
     "text": _T("Le zeppole di San Giuseppe (tradizione regionale).", "Zeppole zum Josefstag (regional).", "St. Joseph's zeppole (regional)."), "recipes": []},
    {"slug": "pasqua-it", "country": "it", "rule": {"t": "easter", "off": 0},
     "title": _T("Pasqua (colomba, casatiello…)", "Ostern (Colomba, Casatiello…)", "Easter (colomba, casatiello…)"),
     "text": _T("Colomba, pizza di Pasqua, casatiello, cuzzupa e scarcelle secondo le regioni.", "Colomba, Ostergebäck, Casatiello je nach Region.", "Colomba, casatiello and more by region."), "recipes": []},
    {"slug": "pasquetta", "country": "it", "rule": {"t": "easter", "off": 1},
     "title": _T("Pasquetta (focacce da picnic)", "Ostermontag (Picknick-Focaccia)", "Easter Monday (picnic focaccia)"),
     "text": _T("Focacce e panini da picnic.", "Focaccia und Brötchen fürs Picknick.", "Focaccia and rolls for a picnic."), "recipes": []},
    {"slug": "santantonio-padova", "country": "it", "rule": {"t": "fixed", "m": 6, "d": 13},
     "title": _T("Sant'Antonio da Padova (pane)", "Hl. Antonius v. Padua (Brot)", "St. Anthony of Padua (bread)"),
     "text": _T("Il pane di Sant'Antonio (tradizione regionale).", "Antoniusbrot (regionale Tradition).", "St. Anthony's bread (regional)."), "recipes": []},
    {"slug": "ferragosto", "country": "it", "rule": {"t": "fixed", "m": 8, "d": 15},
     "title": _T("Ferragosto (focacce da picnic)", "Ferragosto (Picknick-Focaccia)", "Ferragosto (picnic focaccia)"),
     "text": _T("Focacce e panini da picnic.", "Focaccia und Brötchen fürs Picknick.", "Focaccia and rolls for a picnic."), "recipes": []},
    {"slug": "defunti", "country": "it", "rule": {"t": "fixed", "m": 11, "d": 2},
     "title": _T("Ognissanti e Defunti (pane dei morti)", "Allerheiligen/-seelen (Totenbrot)", "All Saints/Souls (pane dei morti)"),
     "text": _T("Il pane dei morti secondo le regioni.", "Totenbrot je nach Region.", "Pane dei morti by region."), "recipes": []},
    {"slug": "immacolata", "country": "it", "rule": {"t": "fixed", "m": 12, "d": 8},
     "title": _T("Immacolata (pettole)", "Mariä Empfängnis (Pettole)", "Immaculate Conception (pettole)"),
     "text": _T("Le pettole in Puglia (tradizione regionale). Avviso frittura.", "Pettole in Apulien (regional). Frittier-Hinweis.", "Pettole in Puglia (regional). Frying warning."), "recipes": []},
    {"slug": "vigilia", "country": "it", "rule": {"t": "fixed", "m": 12, "d": 24},
     "title": _T("Vigilia (pettole e cartellate)", "Heiligabend (Pettole/Cartellate)", "Christmas Eve (pettole/cartellate)"),
     "text": _T("Pettole e cartellate (tradizione regionale). Avviso frittura.", "Pettole und Cartellate (regional). Frittier-Hinweis.", "Pettole and cartellate (regional). Frying warning."), "recipes": []},
    {"slug": "natale-it", "country": "it", "rule": {"t": "fixed", "m": 12, "d": 25},
     "title": _T("Natale (panettone, pandoro)", "Weihnachten (Panettone, Pandoro)", "Christmas (panettone, pandoro)"),
     "text": _T("Panettone, pandoro e panforte.", "Panettone, Pandoro und Panforte.", "Panettone, pandoro and panforte."), "recipes": []},
]


async def _seed_calendar():
    if await db.bread_calendar.count_documents({}) == 0:
        for c in _CAL_SEED:
            await db.bread_calendar.insert_one({**c, "status": "draft", "created_at": now_iso()})


@api_router.get("/bread-calendar")
async def bread_calendar_get(year: _Opt[int] = None, user: _Opt[dict] = Depends(optional_user)):
    await _seed_calendar()
    is_admin = bool(user and user.get("role") == "admin")
    today = datetime.now(timezone.utc).date()
    y = year or today.year
    q = {} if is_admin else {"status": "published"}
    events = []
    async for c in db.bread_calendar.find(q, {"_id": 0}):
        best = None
        for yy in (y, y + 1):
            d = _event_date(c.get("rule", {}), yy)
            if d and d >= today:
                best = d
                break
        if not best:
            best = _event_date(c.get("rule", {}), y)
        events.append({"slug": c["slug"], "country": c.get("country"), "title": c.get("title", {}),
                       "text": c.get("text", {}), "recipes": c.get("recipes", []),
                       "status": c.get("status"), "date": best.isoformat() if best else None,
                       "days_until": (best - today).days if best else None})
    events.sort(key=lambda e: (e["days_until"] is None, e["days_until"] if e["days_until"] is not None else 9999))
    return {"events": events, "year": y, "easter": _easter(y).isoformat()}


class CalEdit(_BM):
    title: _Opt[dict] = None
    text: _Opt[dict] = None
    country: _Opt[str] = None
    rule: _Opt[dict] = None
    recipes: _Opt[list] = None
    status: _Opt[str] = None


@api_router.put("/bread-calendar/{slug}")
async def bread_calendar_edit(slug: str, body: CalEdit, admin: dict = Depends(require_admin)):
    upd = {k: v for k, v in body.dict().items() if v is not None}
    if "status" in upd and upd["status"] not in ("draft", "published", "hidden"):
        raise HTTPException(status_code=400, detail="status_invalid")
    upd["updated_at"] = now_iso()
    await db.bread_calendar.update_one({"slug": slug}, {"$set": {"slug": slug, **upd}}, upsert=True)
    return {"ok": True}
