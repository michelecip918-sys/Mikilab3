#!/bin/sh
# Uso: dalla radice del progetto (dove ci sono backend/ e frontend/):  sh patch78/applica.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ ! -d backend ] || [ ! -d frontend ]; then
  echo "ERRORE: lancia lo script dalla radice del progetto (dove ci sono backend/ e frontend/)."; exit 1
fi
cp -r "$HERE/backend" "$HERE/frontend" ./
rm -rf patch77   # cartella della patch precedente, già applicata
python3 -m py_compile backend/server.py
python3 - <<'PY'
import json, os
d = json.load(open("backend/mikilab_seed_data.json", encoding="utf-8"))
assert len(d) == 167, len(d)
assert len({r["name"] for r in d}) == len(d), "nomi ricette doppi"
s = open("backend/server.py", encoding="utf-8").read()
assert "v78-riordino" in s and "V78_DRAFT_NAMES" in s
for f in ("frontend/src/components/VetrineReparti.jsx", "frontend/src/sections/SaporiCasa.jsx",
          "frontend/src/sections/RicetteCustodite.jsx", "frontend/src/sections/Ricette.jsx"):
    assert os.path.getsize(f) > 0, f
miss = [r["image_url"] for r in d if r.get("image_url") and not os.path.exists("frontend/public" + r["image_url"])]
if miss:
    print("ATTENZIONE: foto non trovate su disco:", miss[:5])
print("Seed ricette:", len(d), "| senza foto (da generare):", sum(1 for r in d if not r.get("image_url")))
PY
echo "OK: v78 applicata. Ora un solo commit e un solo deploy."
