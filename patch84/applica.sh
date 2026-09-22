#!/bin/sh
# MikiLab v84 — segreto del 16 ottobre + banco delle prove + il mio forno. Solo frontend.
# Uso dalla radice del progetto:  sh patch84/applica.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ ! -d backend ] || [ ! -d frontend ]; then
  echo "ERRORE: lancia lo script dalla radice del progetto (dove ci sono backend/ e frontend/)."; exit 1
fi
# 1) file nuovi e aggiornati (sostituiti interi)
cp -R "$HERE/files/." .
# 2) residuo della v83
rm -rf capacitor-plugins
# 3) mappa dati legale: aggiunge la sezione 13 una sola volta
if ! grep -q "## 13. V84" LEGAL_DATA_MAP.md; then cat "$HERE/legal_addendum.md" >> LEGAL_DATA_MAP.md; fi
# 4) controlli: i file devono esserci e il file di verifica Google NON va toccato
for f in frontend/src/components/LancioSegreto.jsx frontend/src/components/BancoProve.jsx frontend/src/components/MioForno.jsx; do
  test -f "$f" || { echo "ATTENZIONE: manca $f"; exit 1; }
done
grep -q 'route === "banco"' frontend/src/App.js || { echo "ATTENZIONE: App.js non aggiornato"; exit 1; }
test -f frontend/public/googlea308a6dc1717156d.html || { echo "ATTENZIONE: manca il file di verifica Google!"; exit 1; }
echo "OK: v84 applicata. Ora: cd frontend && yarn build (deve riuscire), poi un solo commit e un solo deploy."
