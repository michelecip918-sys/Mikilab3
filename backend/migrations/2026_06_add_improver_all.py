import os, re, json, asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

SYN = ["Miglioratore", "Improver", "Verbesserer", "Backmittel", "Mejorador", "Améliorant", "بهبوددهنده"]
IMPROVER_RE = re.compile("|".join(re.escape(s) for s in SYN), re.IGNORECASE)

NOTE = {
 "procedure": "\n\nMIGLIORATORE NATURALE (facoltativo): aggiungo sempre il mio Miglioratore Naturale (2-4% sulla farina) per dare più forza, profumo e morbidezza che dura; puoi sostituirlo con un semplice malto o ometterlo.",
 "procedure_de": "\n\nNATÜRLICHER VERBESSERER (optional): Ich gebe stets meinen Natürlichen Verbesserer dazu (2-4% aufs Mehl) für mehr Kraft, Aroma und lang anhaltende Weichheit; ersetzbar durch ein einfaches Malz oder weglassbar.",
 "procedure_en": "\n\nNATURAL IMPROVER (optional): I always add my Natural Improver (2-4% of the flour) for more strength, aroma and lasting softness; you can replace it with a simple malt or omit it.",
 "procedure_es": "\n\nMEJORADOR NATURAL (opcional): siempre añado mi Mejorador Natural (2-4% sobre la harina) para más fuerza, aroma y una ternura duradera; puedes sustituirlo por una malta simple u omitirlo.",
 "procedure_fr": "\n\nAMÉLIORANT NATUREL (facultatif) : j'ajoute toujours mon Améliorant Naturel (2-4% sur la farine) pour plus de force, d'arôme et un moelleux durable ; remplaçable par un simple malt ou à omettre.",
 "procedure_fa": "\n\nبهبوددهندهٔ طبیعی (اختیاری): همیشه بهبوددهندهٔ طبیعی خودم را (۲ تا ۴٪ آرد) اضافه می‌کنم برای قدرت، عطر و نرمی ماندگار؛ می‌توانی با یک مالت ساده جایگزین کنی یا حذفش کنی.",
}
IMPROVER_ING = {"name": "Miglioratore Naturale", "percent": 3, "name_de": "Natürlicher Verbesserer", "name_en": "Natural Improver", "name_es": "Mejorador Natural", "name_fr": "Améliorant Naturel", "name_fa": "بهبوددهندهٔ طبیعی"}


def is_panettone(r):
    return "panetton" in (str(r.get("name", "")) + str(r.get("real_name", ""))).lower()


def has_flour(r):
    try:
        return float(r.get("flour_grams") or 0) > 0
    except Exception:
        return False


def already_has_improver(r):
    if IMPROVER_RE.search(str(r.get("procedure") or "")):
        return True
    for ing in (r.get("extra_ingredients") or []):
        if IMPROVER_RE.search(str(ing.get("name") or "")):
            return True
    return False


def patch(r):
    if is_panettone(r) or not has_flour(r) or already_has_improver(r):
        return False
    # 1) extra ingredient
    exi = r.get("extra_ingredients")
    if not isinstance(exi, list):
        exi = []
    exi = exi + [dict(IMPROVER_ING)]
    r["extra_ingredients"] = exi
    # 2) procedure note (only where a non-empty procedure exists)
    for field, note in NOTE.items():
        val = r.get(field)
        if isinstance(val, str) and val.strip() and not IMPROVER_RE.search(val):
            r[field] = val + note
    return True


async def main():
    c = AsyncIOMotorClient(os.environ["MONGO_URL"]); db = c[os.environ["DB_NAME"]]
    n = 0
    async for doc in db.recipes.find({}):
        if patch(doc):
            upd = {"extra_ingredients": doc["extra_ingredients"]}
            for f in NOTE:
                if f in doc:
                    upd[f] = doc[f]
            await db.recipes.update_one({"_id": doc["_id"]}, {"$set": upd})
            n += 1
    print("DB ricette aggiornate col Miglioratore:", n)
    c.close()
    d = json.load(open("/app/backend/mikilab_seed_data.json"))
    m = sum(1 for r in d if patch(r))
    json.dump(d, open("/app/backend/mikilab_seed_data.json", "w"), ensure_ascii=False, indent=2)
    print("Seed ricette aggiornate:", m)


asyncio.run(main())
