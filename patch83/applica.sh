#!/bin/sh
# MikiLab v83 — pulizia totale della vecchia app aziendale.
# Uso dalla radice del progetto:  sh patch83/applica.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ ! -d backend ] || [ ! -d frontend ]; then
  echo "ERRORE: lancia lo script dalla radice del progetto (dove ci sono backend/ e frontend/)."; exit 1
fi
# 1) file aggiornati (sostituiti interi)
cp -R "$HERE/files/." .
# 2) file e cartelle vecchi da eliminare (il file google...html in frontend/public NON va toccato)
while IFS= read -r p; do
  [ -z "$p" ] && continue
  rm -rf "$p"
done < "$HERE/elimina.txt"
find backend -name "__pycache__" -type d -prune -exec rm -rf {} +
# 3) controllo: il backend deve compilare
for f in backend/*.py; do python3 -m py_compile "$f"; done
test -f frontend/public/googlea308a6dc1717156d.html || { echo "ATTENZIONE: manca il file di verifica Google!"; exit 1; }
echo "OK: v83 applicata. Ora: yarn build di prova, un solo commit e un solo deploy."
