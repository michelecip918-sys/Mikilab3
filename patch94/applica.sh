#!/bin/sh
# MikiLab v94 — Il sommelier del pane + correzioni. Da applicare DOPO la v93b. Uso dalla radice:  sh patch94/applica.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ ! -d backend ] || [ ! -d frontend ]; then echo "ERRORE: lancia lo script dalla radice del progetto."; exit 1; fi
test -f frontend/src/lib/sitorBottega.js || { echo "ERRORE: manca la v93b (sitorBottega.js). Applica prima la v93b."; exit 1; }
node "$HERE/patch_frontend.js"
cp -R "$HERE/files/." .
if ! grep -q "## 23. V94" LEGAL_DATA_MAP.md; then cat "$HERE/legal_addendum.md" >> LEGAL_DATA_MAP.md; fi
test -f frontend/src/components/Sommelier.jsx || { echo "ATTENZIONE: manca Sommelier.jsx"; exit 1; }
grep -q 'route === "sommelier"' frontend/src/App.js || { echo "ATTENZIONE: App.js senza la pagina Sommelier"; exit 1; }
grep -q 'strumento-sommelier' frontend/src/components/StrumentiRicetta.jsx || { echo "ATTENZIONE: StrumentiRicetta.jsx non aggiornato"; exit 1; }
grep -q 'mikilab.de/sommelier' frontend/public/sitemap.xml || { echo "ATTENZIONE: sitemap non aggiornata"; exit 1; }
grep -q 'mikilab-v74' frontend/public/sw.js || { echo "ATTENZIONE: sw.js non aggiornato"; exit 1; }
test -f frontend/public/googlea308a6dc1717156d.html || { echo "ATTENZIONE: manca il file di verifica Google!"; exit 1; }
rm -rf patch93 patch93b v93
echo "OK: v94 applicata. Ora: cd frontend && yarn build (deve riuscire), poi un solo commit e un solo deploy."
