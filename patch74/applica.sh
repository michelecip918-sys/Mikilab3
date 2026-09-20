#!/bin/sh
# Uso: dalla radice del progetto (la cartella che contiene backend/ e frontend/):  sh patch74/applica.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ ! -d backend ] || [ ! -d frontend ]; then
  echo "ERRORE: lancia lo script dalla radice del progetto (dove ci sono backend/ e frontend/)."; exit 1
fi
cp -r "$HERE/backend" "$HERE/frontend" "$HERE/memory" "$HERE/test_reports" ./
cp "$HERE/CHECK_TESTI_SICUREZZA.md" ./
while read -r f; do [ -n "$f" ] && rm -f "$f"; done < "$HERE/DA_CANCELLARE.txt"
rm -rf patch   # vecchia cartella della v73, già applicata
python3 -m py_compile backend/server.py backend/course_builder.py
python3 - <<'PY'
import json
d = json.load(open("backend/mikilab_seed_data.json", encoding="utf-8"))
assert len(d) == 154, len(d)
print("Seed ricette:", len(d))
PY
echo "OK: v74 applicata. Ora un solo commit e un solo deploy."
