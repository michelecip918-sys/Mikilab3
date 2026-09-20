#!/bin/sh
# Uso: dalla radice del progetto (dove ci sono backend/ e frontend/):  sh patch75/applica.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ ! -d backend ] || [ ! -d frontend ]; then
  echo "ERRORE: lancia lo script dalla radice del progetto (dove ci sono backend/ e frontend/)."; exit 1
fi
cp -r "$HERE/backend" "$HERE/frontend" ./
rm -rf patch74   # cartella della patch precedente, già applicata
python3 -m py_compile backend/server.py
python3 - <<'PY'
import json
d = json.load(open("backend/mikilab_seed_data.json", encoding="utf-8"))
assert len(d) == 154, len(d)
s = open("backend/server.py", encoding="utf-8").read()
assert "v75-nomi-tradotti" in s and "admin_reset_done" in s
print("Seed ricette:", len(d), "| reset password: una sola volta")
PY
echo "OK: v75 applicata. Ora un solo commit e un solo deploy."
