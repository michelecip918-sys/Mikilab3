# -*- coding: utf-8 -*-
"""MikiLab V140 — lancia dalla cartella principale del progetto: python patch140/applica_v140.py
Controlla prima che il progetto sia quello con la v139; se qualcosa non torna si ferma senza toccare niente."""
import json, shutil, sys
from pathlib import Path

ROOT = Path.cwd()
P = Path(__file__).resolve().parent
B = ROOT / "backend"
SERVER = B / "server.py"
SEED = B / "mikilab_seed_data.json"
SW = ROOT / "frontend" / "public" / "sw.js"
STORIA = ROOT / "MIKILAB_STORIA.md"
ANCORA = '        logging.getLogger(__name__).error(f"V139 ricette error: {e}")\n'
HOOK = '''    try:
        # V140 — corregge la v139: nomi delle farine giusti e procedimenti originali di tre pani con biga e della Pinsa. Una volta sola.
        _m140 = await db.app_meta.find_one({"_key": "v140_farine"}, {"_id": 0})
        if not _m140:
            import v140_farine as _v140
            _camb140, _manca140 = await _v140.applica_db(db, now_iso())
            await db.app_meta.update_one({"_key": "v140_farine"}, {"$set": {"_key": "v140_farine", "done_at": now_iso(), "cambiate": _camb140, "non_trovate": _manca140}}, upsert=True)
            logging.getLogger(__name__).info(f"V140 farine: {len(_camb140)} cambiate, non trovate per nome: {_manca140}")
    except Exception as e:
        logging.getLogger(__name__).error(f"V140 farine error: {e}")
'''
CACHE_OLD, CACHE_NEW = 'const CACHE_NAME = "mikilab-v117"; // V139', 'const CACHE_NAME = "mikilab-v118"; // V140'
API_OLD, API_NEW = 'const API_CACHE = "mikilab-api-v64"; // V139', 'const API_CACHE = "mikilab-api-v65"; // V140'
RIGA = ("- **v140** Correzione della v139: le farine hanno di nuovo nomi giusti (niente zucchero, glassa o semola di "
        "finitura contati come farina, niente 50/50 inventati: Pinsa 80/20 con il riso, focacce «semola + tipo 0», "
        "Carezza Dolce, Treccia del Sole e Cornetto Sfogliato con il farro 630); Pane all'Nduja, alla Curcuma e "
        "Zenzero, allo Zafferano e Pinsa tornano ai loro tempi (hanno biga o lievito di birra), senza malto. "
        "Foto, id, numeri e mappa per Google invariati.\n")


def stop(msg):
    print("V140 FERMO: " + msg + " — non ho toccato niente.")
    sys.exit(1)


s = SERVER.read_text(encoding="utf-8")
if ANCORA not in s: stop("non trovo il blocco V139 in backend/server.py")
if "v140_farine" in s: stop("la v140 è già applicata")
if not (B / "v139_ricette.py").exists(): stop("manca backend/v139_ricette.py")
sw = SW.read_text(encoding="utf-8")
if CACHE_OLD not in sw or API_OLD not in sw: stop("frontend/public/sw.js non è quello della v139")

bk = ROOT / "_backup_v140"
for f in (SERVER, SEED, SW, STORIA):
    d = bk / f.relative_to(ROOT); d.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(f, d)
for f in ("v140_farine.py", "v140_correzioni.json"):
    shutil.copy2(P / "file" / "backend" / f, B / f)
SERVER.write_text(s.replace(ANCORA, ANCORA + HOOK, 1), encoding="utf-8")
SW.write_text(sw.replace(CACHE_OLD, CACHE_NEW).replace(API_OLD, API_NEW), encoding="utf-8")
sys.path.insert(0, str(B))
import v140_farine as v140
items = json.loads(SEED.read_text(encoding="utf-8"))
n = v140.applica_seed(items)
SEED.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
STORIA.write_text(STORIA.read_text(encoding="utf-8").rstrip("\n") + "\n" + RIGA, encoding="utf-8")
for old in ("_backup_v138",):
    if (ROOT / old).exists(): shutil.rmtree(ROOT / old)
import py_compile
py_compile.compile(str(SERVER), doraise=True); py_compile.compile(str(B / "v140_farine.py"), doraise=True)
print(f"V140 OK: seed {n} ricette corrette, server.py con il blocco V140, cache v118/api v65, storia aggiornata, backup in _backup_v140")
