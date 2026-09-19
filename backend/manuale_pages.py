# ruff: noqa: F821  (i nomi del core sono iniettati via globals().update)
"""MikiLab — Il Manuale di Sitor · Percorso a livelli (learning_path) + Pagine sito (site_pages).
Collezioni NUOVE. Non toccano le ricette.
"""
import server as _core
globals().update({k: v for k, v in vars(_core).items() if not k.startswith("__")})

from pydantic import BaseModel as _BM
from typing import Optional as _Opt, List as _List

_LEVELS_SEED = [
    {"n": 1, "title": {"it": "Panini semplici", "de": "Einfache Brötchen", "en": "Simple rolls"}, "active": True,
     "recipes": ["Panino al Latte per Hamburger", "Panino alle Patate", "Panino al Sesamo", "Panino ai Semi di Papavero", "Panino al Farro"]},
    {"n": 2, "title": {"it": "Panini che crescono", "de": "Brötchen, die wachsen", "en": "Rolls that grow"}, "active": True,
     "recipes": ["Panino alle Olive", "Panino al Mais", "Panino alla Zucca", "Panino Integrale", "Panino Multicereali ai 5 Cereali"]},
    {"n": 3, "title": {"it": "Focacce in teglia", "de": "Focaccia im Blech", "en": "Pan focaccia"}, "active": False, "recipes": []},
    {"n": 4, "title": {"it": "Pane con poolish o biga", "de": "Brot mit Poolish oder Biga", "en": "Bread with poolish or biga"}, "active": False,
     "recipes": ["Baguette con Poolish", "Quotidiano del Fornaio", "Treccia del Sole", "Carezza Dolce", "Pane agli Spinaci"]},
    {"n": 5, "title": {"it": "Lievito madre", "de": "Sauerteig", "en": "Sourdough"}, "active": False,
     "recipes": ["Pane Casereccio a Lievito Madre", "Baguette a Lievito Madre", "Focaccia a Lievito Madre", "Pane Integrale a Lievito Madre", "Filo di Francia"]},
    {"n": 6, "title": {"it": "Pizze e sfide", "de": "Pizzen und Herausforderungen", "en": "Pizzas and challenges"}, "active": False,
     "recipes": ["Pizza in Teglia alla Romana", "Pizza alla Pala", "Cornetto Bicolore Cacao e Vaniglia", "Croissant Sfogliati Classici Senza Zucchero nell'Impasto"]},
]


async def _seed_learning_path():
    if await db.learning_path.count_documents({}) == 0:
        for lv in _LEVELS_SEED:
            await db.learning_path.insert_one({**lv, "created_at": now_iso()})


async def _resolve_recipe_ids(names):
    """Mappa i nomi ricetta ai loro id (per il frontend), saltando quelli non trovati."""
    out = []
    for nm in names:
        r = await db.recipes.find_one({"collection_name": "mikilab", "name": nm}, {"_id": 0, "id": 1, "name": 1, "image_url": 1})
        if r:
            out.append({"id": r["id"], "name": r["name"], "image_url": r.get("image_url", "")})
    return out


@api_router.get("/learning-path")
async def learning_path_get(user: _Opt[dict] = Depends(optional_user)):
    await _seed_learning_path()
    is_admin = bool(user and user.get("role") == "admin")
    levels = []
    async for lv in db.learning_path.find({}, {"_id": 0}).sort("n", 1):
        if not lv.get("active") and not is_admin:
            # non attivo: mostra solo intestazione "In arrivo", senza ricette
            levels.append({"n": lv["n"], "title": lv.get("title", {}), "active": False, "coming_soon": True, "recipes": []})
            continue
        levels.append({"n": lv["n"], "title": lv.get("title", {}), "active": bool(lv.get("active")),
                       "recipes": await _resolve_recipe_ids(lv.get("recipes", []))})
    return {"levels": levels}


class LevelEdit(_BM):
    title: _Opt[dict] = None
    recipes: _Opt[_List[str]] = None
    active: _Opt[bool] = None


@api_router.put("/learning-path/{n}")
async def learning_path_put(n: int, body: LevelEdit, admin: dict = Depends(require_admin)):
    upd = {k: v for k, v in body.dict().items() if v is not None}
    upd["updated_at"] = now_iso()
    await db.learning_path.update_one({"n": n}, {"$set": upd}, upsert=True)
    return {"ok": True}


# ---------------------------------------------------------------------------
# PAGINE SITO — site_pages (slug, lang, title, body, published). Nascono NON pubblicate.
# ---------------------------------------------------------------------------
_PAGES_SEED = {
    "perche": {
        "it": {"title": "Perché ho creato MikiLab", "body": (
            "Faccio pane da tanto tempo e ho imparato una cosa: dietro ogni gesto c'è un perché. Ma non sempre chi lavora "
            "in panificio ha il tempo, il forno o l'occasione per capirlo e sperimentare: spesso si esegue e basta.\n\n"
            "Ho creato MikiLab per chi vuole conoscere la parte più bella della panificazione: capire perché un impasto si "
            "comporta in un modo, provare, sbagliare e migliorare, anche da casa, anche con un forno normale.\n\n"
            "Sitor, la guida del sito, è un'intelligenza artificiale che ho creato per accompagnarti mentre impasti. Non ti "
            "dice solo cosa fare, ma perché. Anche il sito l'ho costruito con l'aiuto di strumenti di IA: non sostituiscono "
            "le mani e l'esperienza, ma fanno compagnia.\n\n"
            "È gratis, per chi ama il pane. Se fai una mia ricetta, mostrami com'è venuta.")},
        "de": {"title": "Warum ich MikiLab geschaffen habe", "body": (
            "Ich backe seit langer Zeit Brot und habe eines gelernt: Hinter jedem Handgriff steckt ein Warum. Doch wer in "
            "der Backstube arbeitet, hat nicht immer die Zeit, den Ofen oder die Gelegenheit, es zu verstehen und zu "
            "experimentieren: oft führt man nur aus.\n\n"
            "Ich habe MikiLab für alle geschaffen, die den schönsten Teil des Backens kennenlernen wollen: verstehen, warum "
            "sich ein Teig so verhält, ausprobieren, Fehler machen und besser werden — auch zu Hause, auch mit einem "
            "normalen Ofen.\n\n"
            "Sitor, der Guide der Seite, ist eine künstliche Intelligenz, die ich geschaffen habe, um dich beim Kneten zu "
            "begleiten. Sie sagt dir nicht nur, was du tun sollst, sondern warum. Auch die Seite habe ich mit Hilfe von "
            "KI-Werkzeugen gebaut: Sie ersetzen nicht Hände und Erfahrung, aber sie leisten Gesellschaft.\n\n"
            "Es ist kostenlos, für alle, die Brot lieben. Wenn du eines meiner Rezepte machst, zeig mir, wie es geworden ist.")},
        "en": {"title": "Why I created MikiLab", "body": (
            "I've been making bread for a long time and I've learned one thing: behind every gesture there's a reason. But "
            "those who work in a bakery don't always have the time, the oven or the chance to understand it and experiment: "
            "often you just execute.\n\n"
            "I created MikiLab for those who want to know the most beautiful part of baking: understanding why a dough behaves "
            "a certain way, trying, failing and improving — even from home, even with a normal oven.\n\n"
            "Sitor, the site's guide, is an artificial intelligence I created to keep you company while you knead. It doesn't "
            "just tell you what to do, but why. I built the site too with the help of AI tools: they don't replace hands and "
            "experience, but they keep you company.\n\n"
            "It's free, for those who love bread. If you make one of my recipes, show me how it turned out.")},
    },
}


async def _seed_site_pages():
    for slug, langs in _PAGES_SEED.items():
        for lang2, content in langs.items():
            exists = await db.site_pages.find_one({"slug": slug, "lang": lang2}, {"_id": 0, "slug": 1})
            if not exists:
                await db.site_pages.insert_one({"slug": slug, "lang": lang2, "title": content["title"],
                                                "body": content["body"], "published": False, "created_at": now_iso()})


@api_router.get("/site-pages/{slug}")
async def site_page_get(slug: str, lang: str = "it", user: _Opt[dict] = Depends(optional_user)):
    await _seed_site_pages()
    lang2 = (lang or "it").split("-")[0][:2].lower()
    if lang2 not in ("it", "de", "en"):
        lang2 = "it"
    doc = await db.site_pages.find_one({"slug": slug, "lang": lang2}, {"_id": 0})
    if not doc:
        doc = await db.site_pages.find_one({"slug": slug, "lang": "it"}, {"_id": 0})
    is_admin = bool(user and user.get("role") == "admin")
    if not doc or (not doc.get("published") and not is_admin):
        raise HTTPException(status_code=404, detail="page_not_found")
    return {"slug": slug, "lang": doc.get("lang"), "title": doc.get("title", ""),
            "body": doc.get("body", ""), "published": bool(doc.get("published"))}


@api_router.get("/site-pages")
async def site_pages_list(admin: dict = Depends(require_admin)):
    await _seed_site_pages()
    docs = [d async for d in db.site_pages.find({}, {"_id": 0}).sort("slug", 1)]
    return {"pages": docs}


class PageEdit(_BM):
    title: _Opt[str] = None
    body: _Opt[str] = None
    published: _Opt[bool] = None
    lang: str = "it"


@api_router.put("/site-pages/{slug}")
async def site_page_put(slug: str, body: PageEdit, admin: dict = Depends(require_admin)):
    lang2 = (body.lang or "it").split("-")[0][:2].lower()
    upd = {"slug": slug, "lang": lang2, "updated_at": now_iso()}
    for k in ("title", "body", "published"):
        v = getattr(body, k)
        if v is not None:
            upd[k] = v
    await db.site_pages.update_one({"slug": slug, "lang": lang2}, {"$set": upd}, upsert=True)
    return {"ok": True}
