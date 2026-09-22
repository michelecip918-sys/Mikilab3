#!/bin/sh
# MikiLab v95 — Stasera ho ospiti, la carta dei pani, i cartellini del banco, l'attestato. Da applicare DOPO la v94. Solo frontend.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ ! -d backend ] || [ ! -d frontend ]; then echo "ERRORE: lancia lo script dalla radice del progetto."; exit 1; fi
test -f frontend/src/components/Sommelier.jsx || { echo "ERRORE: manca la v94 (Sommelier.jsx). Applica prima la v94."; exit 1; }
node "$HERE/patch_frontend.js"
cp -R "$HERE/files/." .
if ! grep -q "## 24. V95" LEGAL_DATA_MAP.md; then cat "$HERE/legal_addendum.md" >> LEGAL_DATA_MAP.md; fi
for f in Ospiti CartaDeiPani Laboratorio PrimoPane OfficinaSitor laboratorio/Cartellini officina/Attestato; do test -f "frontend/src/components/$f.jsx" || { echo "ATTENZIONE: manca $f.jsx"; exit 1; }; done
grep -q 'route === "ospiti"' frontend/src/App.js || { echo "ATTENZIONE: App.js senza le pagine nuove"; exit 1; }
grep -q 'mikilab.de/carta' frontend/public/sitemap.xml || { echo "ATTENZIONE: sitemap non aggiornata"; exit 1; }
grep -q 'mikilab-v75' frontend/public/sw.js || { echo "ATTENZIONE: sw.js non aggiornato"; exit 1; }
test -f frontend/public/googlea308a6dc1717156d.html || { echo "ATTENZIONE: manca il file di verifica Google!"; exit 1; }
rm -rf patch94 v94
echo "OK: v95 applicata. Ora: cd frontend && yarn build (deve riuscire), poi un solo commit e un solo deploy."
