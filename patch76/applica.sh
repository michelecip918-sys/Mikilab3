#!/bin/sh
# Uso: dalla radice del progetto (dove ci sono backend/ e frontend/):  sh patch76/applica.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ ! -d backend ] || [ ! -d frontend ]; then
  echo "ERRORE: lancia lo script dalla radice del progetto (dove ci sono backend/ e frontend/)."; exit 1
fi
cp -r "$HERE/frontend" ./
rm -rf patch75   # cartella della patch precedente, già applicata
for f in frontend/src/components/PrimaDiIniziare.jsx frontend/src/components/Strumenti.jsx frontend/src/App.js; do
  [ -f "$f" ] || { echo "ERRORE: manca $f"; exit 1; }
done
grep -q "consumeBack" frontend/src/App.js || { echo "ERRORE: App.js non aggiornato"; exit 1; }
echo "OK: v76 applicata (solo frontend). Ora un solo commit e un solo deploy."
