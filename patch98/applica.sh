#!/bin/sh
# MikiLab v98 — I miei appunti, tazze e once, da evitare. Da applicare DOPO la v97. Solo frontend, solo file sostituiti/aggiunti.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ ! -d backend ] || [ ! -d frontend ]; then echo "ERRORE: lancia lo script dalla radice del progetto."; exit 1; fi
test -f frontend/src/components/Valigia.jsx || { echo "ERRORE: manca la v97 (Valigia.jsx). Applica prima la v97."; exit 1; }
cp -R "$HERE/files/." .
if ! grep -q "## 27. V98" LEGAL_DATA_MAP.md; then cat "$HERE/legal_addendum.md" >> LEGAL_DATA_MAP.md; fi
for f in StrumentiRicetta LibroDiPane officina/MieiAppunti officina/TazzeOnce officina/CosaPossoFare; do test -f "frontend/src/components/$f.jsx" || { echo "ATTENZIONE: manca $f.jsx"; exit 1; }; done
grep -q 'k: "appunti"' frontend/src/components/StrumentiRicetta.jsx || { echo "ATTENZIONE: StrumentiRicetta.jsx non aggiornato"; exit 1; }
grep -q 'mikilab-v78' frontend/public/sw.js || { echo "ATTENZIONE: sw.js non aggiornato"; exit 1; }
test -f frontend/public/googlea308a6dc1717156d.html || { echo "ATTENZIONE: manca il file di verifica Google!"; exit 1; }
rm -rf patch97 v97
echo "OK: v98 applicata. Ora: cd frontend && yarn build (deve riuscire), poi un solo commit e un solo deploy."
