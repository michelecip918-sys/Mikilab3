#!/bin/sh
# MikiLab v99 — Comodità d'uso. Da applicare DOPO la v98. Solo frontend.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ ! -d backend ] || [ ! -d frontend ]; then echo "ERRORE: lancia lo script dalla radice del progetto."; exit 1; fi
test -f frontend/src/components/officina/MieiAppunti.jsx || { echo "ERRORE: manca la v98 (MieiAppunti.jsx). Applica prima la v98."; exit 1; }
node "$HERE/patch_frontend.js"
cp -R "$HERE/files/." .
if ! grep -q "## 28. V99" LEGAL_DATA_MAP.md; then cat "$HERE/legal_addendum.md" >> LEGAL_DATA_MAP.md; fi
grep -q 'strumenti-cerca' frontend/src/components/Strumenti.jsx || { echo "ATTENZIONE: Strumenti.jsx non aggiornato"; exit 1; }
grep -q 'mikilab-v79' frontend/public/sw.js || { echo "ATTENZIONE: sw.js non aggiornato"; exit 1; }
test -f frontend/public/googlea308a6dc1717156d.html || { echo "ATTENZIONE: manca il file di verifica Google!"; exit 1; }
rm -rf patch98 v98
echo "OK: v99 applicata. Ora: cd frontend && yarn build (deve riuscire), poi un solo commit e un solo deploy."
