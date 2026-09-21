#!/bin/sh
# MikiLab v79 — Uso: dalla radice del progetto (dove ci sono backend/ e frontend/):  sh patch79/applica.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ ! -d backend ] || [ ! -d frontend ]; then
  echo "ERRORE: lancia lo script dalla radice del progetto (dove ci sono backend/ e frontend/)."; exit 1
fi
cp -r "$HERE/backend" "$HERE/frontend" ./
rm -rf patch78                       # cartella della patch precedente, già applicata
rm -f frontend/src/lib/planPdf.js    # file non usato da nessuno
python3 -m py_compile backend/server.py
python3 - <<'PY'
import json, os
d = json.load(open("backend/mikilab_seed_data.json", encoding="utf-8"))
assert len(d) == 167, len(d)
assert len({r["name"] for r in d}) == len(d), "nomi ricette doppi"
short = [r["name"] for r in d if r.get("menu_category") != "basi" and len(r.get("procedure") or "") < 440]
assert not short, ("procedimenti ancora corti", short)
miss = [r["image_url"] for r in d if r.get("image_url") and not os.path.exists("frontend/public" + r["image_url"])]
assert not miss, ("foto mancanti", miss[:5])
s = open("backend/server.py", encoding="utf-8").read()
assert "v79-procedimenti" in s and "V79_PROC_NAMES" in s
h = open("frontend/public/index.html", encoding="utf-8").read()
for bad in ("posthog", "emergent", "notranslate"):
    assert bad not in h, "index.html contiene ancora: " + bad
c = open("frontend/src/sections/RicetteCustodite.jsx", encoding="utf-8").read()
assert "unsplash" not in c, "RicetteCustodite contiene ancora Unsplash"
l = open("frontend/src/components/LegalPlaceholder.jsx", encoding="utf-8").read()
assert "United Radio" not in l
print("Controlli v79: tutto OK (167 ricette, nessun tracciamento, nessuna immagine esterna).")
PY
echo "OK: v79 applicata. Ora un solo commit e un solo deploy."
