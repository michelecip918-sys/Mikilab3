#!/bin/sh
# MikiLab v90 — il gusto di giocare. Da applicare dopo la v89. Uso dalla radice:  sh patch90/applica.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ ! -d backend ] || [ ! -d frontend ]; then echo "ERRORE: lancia lo script dalla radice del progetto."; exit 1; fi
test -f frontend/src/components/Dedica.jsx || { echo "ERRORE: manca la v89 (Dedica.jsx). Applica prima la v89."; exit 1; }
cp -R "$HERE/files/." .
rm -rf frontend/src/src frontend/src/components/LaTuaBottega.jsx
if ! grep -q "## 19. V90" LEGAL_DATA_MAP.md; then cat "$HERE/legal_addendum.md" >> LEGAL_DATA_MAP.md; fi
for f in Festa LeMieMedaglie Sorprendimi SitorDice; do test -f "frontend/src/components/$f.jsx" || { echo "ATTENZIONE: manca $f.jsx"; exit 1; }; done
test -f frontend/src/lib/medaglie.js || { echo "ATTENZIONE: manca lib/medaglie.js"; exit 1; }
grep -q 'route === "medaglie"' frontend/src/App.js || { echo "ATTENZIONE: App.js non aggiornato"; exit 1; }
test -f frontend/public/googlea308a6dc1717156d.html || { echo "ATTENZIONE: manca il file di verifica Google!"; exit 1; }
echo "OK: v90 applicata. Ora: cd frontend && yarn build (deve riuscire), poi un solo commit e un solo deploy."
