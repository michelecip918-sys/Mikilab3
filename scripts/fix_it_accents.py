import os, re, json
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

# Whitelist ESPLICITA: solo accenti italiani chiaramente sbagliati (apostrofo ASCII -> accento).
# NON include "po'" (corretto) né parole dialettali tra virgolette.
MAP = [
    ("perche'", "perché"), ("poiche'", "poiché"), ("affinche'", "affinché"),
    ("finche'", "finché"), ("benche'", "benché"), ("cioe'", "cioè"),
    ("piu'", "più"), ("giu'", "giù"), ("puo'", "può"), ("cosi'", "così"),
    ("gia'", "già"), ("caffe'", "caffè"),
    ("qualita'", "qualità"), ("quantita'", "quantità"), ("umidita'", "umidità"),
    ("acidita'", "acidità"), ("attivita'", "attività"), ("elasticita'", "elasticità"),
    ("digeribilita'", "digeribilità"), ("estensibilita'", "estensibilità"),
    ("validita'", "validità"), ("meta'", "metà"), ("liberta'", "libertà"),
    ("sara'", "sarà"), ("fara'", "farà"), ("dara'", "darà"), ("verra'", "verrà"),
    ("staro'", "starò"), ("faro'", "farò"),
]

def fix_text(t):
    if not t:
        return t, 0
    n = 0
    for asc, acc in MAP:  # tokens lunghi prima (perche' prima di eventuali collisioni)
        pat = re.compile(r'\b' + re.escape(asc) + r'(?![A-Za-zÀ-ÿ])')
        t2, c = pat.subn(acc, t)
        n += c
        t = t2
    # bare "e'" -> "è" (dopo i token *che')
    pat = re.compile(r'\be' + r"'(?![A-Za-zÀ-ÿ])")
    t2, c = pat.subn('è', t); n += c; t = t2
    # gradi -> °C  (es. "a 30 gradi" -> "a 30°C", "26-28 gradi" -> "26-28°C")
    t2, c = re.subn(r'(\d)\s*gradi\b', r'\1°C', t); n += c; t = t2
    return t, n

FIELDS = ['procedure', 'notes', 'procedure_it', 'notes_it']

def process_recipe_dict(r):
    total = 0
    for f in FIELDS:
        if f in r and isinstance(r[f], str):
            nt, c = fix_text(r[f])
            if c:
                r[f] = nt
                total += c
    return total

# --- DB ---
c = MongoClient(os.environ['MONGO_URL']); db = c[os.environ['DB_NAME']]
db_changed = 0; db_recipes = 0
for r in db.recipes.find({}):
    upd = {}
    for f in FIELDS:
        v = r.get(f)
        if isinstance(v, str):
            nt, cc = fix_text(v)
            if cc:
                upd[f] = nt
    if upd:
        db.recipes.update_one({'_id': r['_id']}, {'$set': upd})
        db_changed += sum(1 for _ in upd)
        db_recipes += 1
print(f"DB: {db_recipes} recipes updated, {db_changed} fields changed")

# --- Seed JSON (durabilità su reseed) ---
seed_path = '/app/backend/mikilab_seed_data.json'
try:
    with open(seed_path, encoding='utf-8') as f:
        data = json.load(f)
    recs = data if isinstance(data, list) else data.get('recipes', [])
    seed_recipes = 0; seed_changes = 0
    for r in recs:
        cc = process_recipe_dict(r)
        if cc:
            seed_recipes += 1; seed_changes += cc
    if seed_changes:
        with open(seed_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"SEED: {seed_recipes} recipes updated, {seed_changes} changes")
except Exception as e:
    print("SEED skipped:", e)
