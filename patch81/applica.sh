#!/bin/sh
# MikiLab v81 — Uso dalla radice del progetto:  sh patch81/applica.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ ! -d backend ] || [ ! -d frontend ]; then
  echo "ERRORE: lancia lo script dalla radice del progetto (dove ci sono backend/ e frontend/)."; exit 1
fi
python3 "$HERE/applica.py"
python3 -m py_compile backend/server.py
rm -rf patch80   # patch precedente, già applicata (il file google...html in frontend/public NON va toccato)
echo "OK: v81 applicata. Ora un solo commit e un solo deploy."
