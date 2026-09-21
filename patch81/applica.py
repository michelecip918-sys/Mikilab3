# -*- coding: utf-8 -*-
# MikiLab v81 — Panettone Verde Canapa al metodo 60/40 (dosi INVARIATE, cambia solo il testo).
import json, re, sys
NAME = "Panettone Artigianale MikiLab — Verde Canapa"
SEED = "backend/mikilab_seed_data.json"
SRV = "backend/server.py"

PROC_IT = """METODO 60/40 (due impasti): 60% della farina nel 1° impasto, 40% nel 2°.
1) LIEVITO MADRE: rinfrescalo 3 volte, a circa 4 ore di distanza e a 28 °C, finché raddoppia in 3-4 ore. Usalo al picco, il giorno stesso del 1° impasto. Te ne servono 250 g.
2) 1° IMPASTO (60% della farina, sera): in planetaria metti 250 g di acqua, 100 g di zucchero e 250 g di lievito madre a pezzetti; poi 600 g di farina (300 g di Manitoba W380 + 300 g di farina forte W330). Quando è legato, aggiungi 100 g di tuorli in due volte e 120 g di burro a pomata a pezzetti. Impasto liscio e incordato, temperatura finale 25-26 °C.
3) LIEVITAZIONE: 18 ore a circa 24 °C. Deve triplicare e arrivare al pH giusto (circa 4,7-5,0): segna il livello sul contenitore.
4) 2° IMPASTO (40% della farina, mattino): al 1° impasto aggiungi 400 g di farina (200 g + 200 g) e 80 g di farina di canapa, e fai incordare bene. Poi 120 g di zucchero e 200 g di tuorli a più riprese (qui le uova aumentano), 8 g di sale, e 180 g di burro a pomata in tre volte, facendo incordare ogni volta. Nel 2° impasto non va acqua.
5) MIELE: aggiungi i 50 g di miele UNA SOLA VOLTA, solo alla fine, a impasto già incordato.
6) SEMI DI CANAPA: per ultimi, a bassa velocità e per meno di un minuto, 120 g di semi di canapa decorticati. Tieni l'impasto sempre sotto i 26 °C.
7) PUNTATA E FORMATURA: 30 minuti coperto, poi 30 scoperto sul piano. Dividi in tre pezzi da circa 860 g, pirla con mani imburrate e metti nei pirottini da 750 g.
8) APPRETTO: a 24-28 °C, fino a circa 2 cm dal bordo del pirottino.
9) SCARPATURA E COTTURA: incidi a croce, solleva le punte e metti un fiocco di burro. Cuoci a 160 °C statico per circa 50 minuti, fino a 94 °C al cuore (termometro a sonda).
10) CAPOVOLGI: infila due spiedi alla base e capovolgi subito. Lascia a testa in giù almeno 8 ore, meglio 12."""

PROC_DE = """METHODE 60/40 (zwei Teige): 60 % des Mehls in den 1. Teig, 40 % in den 2. Teig.
1) SAUERTEIG (Lievito Madre): 3 Mal im Abstand von etwa 4 Stunden bei 28 °C auffrischen, bis er sich in 3-4 Stunden verdoppelt. Auf dem Höhepunkt verwenden, am selben Tag wie den 1. Teig. Du brauchst 250 g.
2) 1. TEIG (60 % des Mehls, abends): in der Küchenmaschine 250 g Wasser, 100 g Zucker und 250 g Sauerteig in Stückchen mischen; dann 600 g Mehl (300 g Manitoba W380 + 300 g starkes Mehl W330). Sobald der Teig bindet, 100 g Eigelb in zwei Portionen und 120 g weiche Butter in Stückchen zugeben. Glatt und gut ausgeknetet, Endtemperatur 25-26 °C.
3) GARE: 18 Stunden bei etwa 24 °C. Der Teig muss sich verdreifachen und den passenden pH-Wert erreichen (etwa 4,7-5,0): den Stand am Behälter markieren.
4) 2. TEIG (40 % des Mehls, morgens): zum 1. Teig 400 g Mehl (200 g + 200 g) und 80 g Hanfmehl geben und gut auskneten. Dann 120 g Zucker und 200 g Eigelb nach und nach (hier kommen mehr Eier dazu), 8 g Salz und 180 g weiche Butter in drei Portionen, jedes Mal wieder auskneten. In den 2. Teig kommt kein Wasser.
5) HONIG: die 50 g Honig NUR EINMAL zugeben, ganz am Ende, wenn der Teig schon ausgeknetet ist.
6) HANFSAMEN: zuletzt, langsam und weniger als eine Minute, 120 g geschälte Hanfsamen unterheben. Den Teig immer unter 26 °C halten.
7) TEIGRUHE UND FORMEN: 30 Minuten abgedeckt, dann 30 Minuten offen auf der Arbeitsfläche. In drei Stücke zu etwa 860 g teilen, mit gebutterten Händen rundwirken und in 750-g-Papierformen setzen.
8) STÜCKGARE: bei 24-28 °C, bis etwa 2 cm unter den Formrand.
9) EINSCHNEIDEN UND BACKEN: kreuzweise einschneiden, die Spitzen anheben und eine Butterflocke daraufsetzen. Bei 160 °C Ober-/Unterhitze etwa 50 Minuten backen, bis 94 °C Kerntemperatur (Einstichthermometer).
10) STÜRZEN: zwei Spieße unten durchstechen und sofort kopfüber aufhängen. Mindestens 8 Stunden, besser 12, so auskühlen lassen."""

PROC_EN = """60/40 METHOD (two doughs): 60% of the flour in the 1st dough, 40% in the 2nd.
1) SOURDOUGH (lievito madre): refresh it 3 times, about 4 hours apart at 28 °C, until it doubles in 3-4 hours. Use it at its peak, on the same day as the 1st dough. You need 250 g.
2) 1st DOUGH (60% of the flour, evening): in the mixer put 250 g water, 100 g sugar and 250 g sourdough in small pieces; then 600 g flour (300 g Manitoba W380 + 300 g strong flour W330). Once it comes together, add 100 g egg yolks in two goes and 120 g softened butter in small pieces. Smooth and well developed, final temperature 25-26 °C.
3) RISE: 18 hours at about 24 °C. It must triple and reach the right pH (about 4.7-5.0): mark the level on the container.
4) 2nd DOUGH (40% of the flour, morning): add 400 g flour (200 g + 200 g) and 80 g hemp flour to the 1st dough and develop the gluten well. Then 120 g sugar and 200 g egg yolks a little at a time (this is where the eggs increase), 8 g salt, and 180 g softened butter in three additions, developing the dough again each time. No water goes into the 2nd dough.
5) HONEY: add the 50 g honey ONLY ONCE, at the very end, when the dough is already developed.
6) HEMP SEEDS: last, on low speed and for less than a minute, 120 g hulled hemp seeds. Keep the dough below 26 °C at all times.
7) REST AND SHAPING: 30 minutes covered, then 30 minutes uncovered on the bench. Divide into three pieces of about 860 g, round them with buttered hands and place in 750 g paper moulds.
8) FINAL PROOF: at 24-28 °C, until about 2 cm below the rim of the mould.
9) SCORING AND BAKING: cut a cross, lift the points and add a knob of butter. Bake at 160 °C static for about 50 minutes, to 94 °C at the core (probe thermometer).
10) FLIP: push two skewers through the base and turn upside down at once. Leave hanging for at least 8 hours, better 12."""

def tail(old):
    # conserva l'eventuale "nota del panettiere" già presente in coda al vecchio testo
    i = (old or "").find("\n\n— ")
    return (old or "")[i:] if i >= 0 else ""

d = json.load(open(SEED, encoding="utf-8"))
r = next((x for x in d if x.get("name") == NAME), None)
assert r, "ricetta Verde Canapa non trovata nel seed"
doses_before = (r["flour_grams"], r["water_grams"], r["salt_grams"], r["sourdough_grams"], json.dumps(r["extra_ingredients"], sort_keys=True))
r["procedure_de"] = PROC_DE + tail(r.get("procedure_de"))
r["procedure_en"] = PROC_EN + tail(r.get("procedure_en"))
r["procedure"] = PROC_IT + tail(r.get("procedure"))
for k in ("procedure_es", "procedure_fr", "procedure_fa"):
    if k in r: r[k] = ""
r["flour_type"] = "Metodo 60/40 (60% della farina nel 1° impasto, 40% nel 2°). Miscela: 50% Manitoba W380 + 50% farina forte W330, con 8% farina di canapa"
r["flour_type_de"] = "Methode 60/40 (60 % des Mehls im 1. Teig, 40 % im 2.). Mischung: 50 % Manitoba W380 + 50 % starkes Mehl W330, mit 8 % Hanfmehl"
r["flour_type_en"] = "60/40 method (60% of the flour in the 1st dough, 40% in the 2nd). Blend: 50% Manitoba W380 + 50% strong flour W330, with 8% hemp flour"
for k in ("flour_type_es", "flour_type_fr", "flour_type_fa"):
    if k in r: r[k] = ""
for k, a, b in (("notes", "Metodo 50/50 su due impasti", "Metodo 60/40 su due impasti"),
                ("notes_de", "Methode 50/50 in zwei Teigen", "Methode 60/40 in zwei Teigen"),
                ("notes_en", "50/50 method over two doughs", "60/40 method over two doughs")):
    if r.get(k): r[k] = r[k].replace(a, b)
for k in ("notes_es", "notes_fr", "notes_fa"):
    if r.get(k) and "50/50" in r[k]: r[k] = ""
assert doses_before == (r["flour_grams"], r["water_grams"], r["salt_grams"], r["sourdough_grams"], json.dumps(r["extra_ingredients"], sort_keys=True))
json.dump(d, open(SEED, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

s = open(SRV, encoding="utf-8").read()
if "v81_canapa" not in s:
    s, n = re.subn(r'SEED_VERSION = "[^"]+"', 'SEED_VERSION = "2026-09-v81-canapa-6040"', s, count=1)
    assert n == 1, "SEED_VERSION non trovata"
    block = '''    try:
        # V81 — Panettone Verde Canapa al metodo 60/40: aggiorna SOLO i testi (dosi invariate), una volta sola.
        # La scheda è "modificata a mano" e il seed non la tocca: per questo serve questo passaggio dedicato.
        # Se Michele ha già riscritto il procedimento (non contiene più "50/50"), non si tocca nulla.
        _m81 = await db.app_meta.find_one({"_key": "v81_canapa"}, {"_id": 0})
        if not _m81:
            _nm81 = "Panettone Artigianale MikiLab — Verde Canapa"
            _src = next((x for x in _load_mikilab_seed() if x.get("name") == _nm81), None)
            _r = await db.recipes.find_one({"collection_name": "mikilab", "name": _nm81}, {"_id": 0, "id": 1, "procedure": 1})
            if _src and _r and "50/50" in (_r.get("procedure") or ""):
                _keys = [k for k in _src.keys() if k.startswith(("procedure", "flour_type", "notes"))]
                _upd = {k: _src.get(k) for k in _keys}
                _upd["updated_at"] = now_iso()
                await db.recipes.update_one({"collection_name": "mikilab", "name": _nm81}, {"$set": _upd})
                await db.recipe_courses_v2.delete_many({"recipe_id": _r["id"]})
            await db.app_meta.update_one({"_key": "v81_canapa"}, {"$set": {"_key": "v81_canapa", "done_at": now_iso()}}, upsert=True)
    except Exception as e:
        logging.getLogger(__name__).error(f"V81 canapa error: {e}")
'''
    anchor = "    try:\n        # STADIO 3a — stati ricetta idempotenti"
    assert s.count(anchor) == 1, "punto di inserimento non trovato in server.py"
    s = s.replace(anchor, block + anchor, 1)
    open(SRV, "w", encoding="utf-8").write(s)

# controlli finali
d = json.load(open(SEED, encoding="utf-8"))
assert len(d) == 167
pan = [x for x in d if x.get("menu_category") == "panettoni"]
no = [x["name"] for x in pan if not (("60%" in x["procedure"] or "60 %" in x["procedure"]) and ("40%" in x["procedure"] or "40 %" in x["procedure"]))]
assert not no, ("panettoni senza 60/40", no)
assert not any("50/50" in (x.get("procedure") or "") for x in pan)
h = open("frontend/public/index.html", encoding="utf-8").read()
for bad in ("posthog", "emergent", "notranslate"):
    assert bad not in h, "index.html contiene ancora: " + bad
print("Controlli v81: OK (tutti i %d panettoni sono a 60/40, dosi invariate)." % len(pan))
