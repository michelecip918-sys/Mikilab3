#!/bin/sh
# MikiLab v96 — Il tuo anno da fornaio, soprannome, privacy aggiornata. Da applicare DOPO la v95. Solo frontend.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ ! -d backend ] || [ ! -d frontend ]; then echo "ERRORE: lancia lo script dalla radice del progetto."; exit 1; fi
test -f frontend/src/components/Ospiti.jsx || { echo "ERRORE: manca la v95 (Ospiti.jsx). Applica prima la v95."; exit 1; }
node "$HERE/patch_frontend.js"
cp -R "$HERE/files/." .
if ! grep -q "## 25. V96" LEGAL_DATA_MAP.md; then cat "$HERE/legal_addendum.md" >> LEGAL_DATA_MAP.md; fi
test -f frontend/src/components/AnnoDaFornaio.jsx || { echo "ATTENZIONE: manca AnnoDaFornaio.jsx"; exit 1; }
grep -q 'route === "anno"' frontend/src/App.js || { echo "ATTENZIONE: App.js senza la pagina Anno"; exit 1; }
grep -q '10. Attrezzi nel browser' frontend/src/components/LegalPlaceholder.jsx || { echo "ATTENZIONE: privacy non aggiornata"; exit 1; }
grep -q 'soprannome' frontend/src/components/LaTuaCucina.jsx || { echo "ATTENZIONE: soprannome non applicato"; exit 1; }
grep -q 'mikilab-v76' frontend/public/sw.js || { echo "ATTENZIONE: sw.js non aggiornato"; exit 1; }
test -f frontend/public/googlea308a6dc1717156d.html || { echo "ATTENZIONE: manca il file di verifica Google!"; exit 1; }
rm -rf patch95 v95
echo "OK: v96 applicata. Ora: cd frontend && yarn build (deve riuscire), poi un solo commit e un solo deploy."
