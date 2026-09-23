#!/bin/sh
# MikiLab v97 — La valigia della bottega, il libro di pane, pulizia. Da applicare DOPO la v96. Solo frontend.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ ! -d backend ] || [ ! -d frontend ]; then echo "ERRORE: lancia lo script dalla radice del progetto."; exit 1; fi
test -f frontend/src/components/AnnoDaFornaio.jsx || { echo "ERRORE: manca la v96 (AnnoDaFornaio.jsx). Applica prima la v96."; exit 1; }
node "$HERE/patch_frontend.js"
cp -R "$HERE/files/." .
if ! grep -q "## 26. V97" LEGAL_DATA_MAP.md; then cat "$HERE/legal_addendum.md" >> LEGAL_DATA_MAP.md; fi
for f in Valigia LibroDiPane OfficinaSitor; do test -f "frontend/src/components/$f.jsx" || { echo "ATTENZIONE: manca $f.jsx"; exit 1; }; done
grep -q 'route === "valigia"' frontend/src/App.js || { echo "ATTENZIONE: App.js senza le pagine nuove"; exit 1; }
grep -q 'mikilab.de/libro' frontend/public/sitemap.xml || { echo "ATTENZIONE: sitemap non aggiornata"; exit 1; }
grep -q 'mikilab-v77' frontend/public/sw.js || { echo "ATTENZIONE: sw.js non aggiornato"; exit 1; }
test -f frontend/public/googlea308a6dc1717156d.html || { echo "ATTENZIONE: manca il file di verifica Google!"; exit 1; }
rm -rf patch96 v96 capacitor-plugins
echo "OK: v97 applicata. Ora: cd frontend && yarn build (deve riuscire), poi un solo commit e un solo deploy."
