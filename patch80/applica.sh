#!/bin/sh
# MikiLab v80 — la firma di Michele (il polpo). Uso dalla radice del progetto:  sh patch80/applica.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ ! -d backend ] || [ ! -d frontend ]; then
  echo "ERRORE: lancia lo script dalla radice del progetto (dove ci sono backend/ e frontend/)."; exit 1
fi
cp -r "$HERE/frontend" ./
rm -rf patch79   # patch precedente, già applicata
python3 - <<'PY'
import os
assert os.path.getsize("frontend/public/polpo-firma.svg") > 5000
for f in ("RecipeScheme.jsx", "PrintHeader.jsx", "TattooSignature.jsx"):
    assert "polpo-firma.svg" in open("frontend/src/components/" + f, encoding="utf-8").read(), f
h = open("frontend/public/index.html", encoding="utf-8").read()
for bad in ("posthog", "emergent", "notranslate"):
    assert bad not in h, "index.html contiene ancora: " + bad
print("Controlli v80: OK (firma del polpo in schema, stampa e firma ricetta; nessun tracciamento).")
PY
echo "OK: v80 applicata. Le foto in patch80/riferimento_tatuaggio servono SOLO come modello per i disegni: non copiarle in frontend/public."
