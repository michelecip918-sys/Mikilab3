#!/bin/sh
# Uso: dalla radice del progetto (la cartella che contiene backend/ e frontend/):  sh patch/applica.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
cp -r "$HERE/backend" "$HERE/frontend" ./
while read -r f; do [ -n "$f" ] && rm -f "$f"; done < "$HERE/DA_CANCELLARE.txt"
python3 -m py_compile backend/server.py backend/sitor_public.py backend/course_builder.py backend/recipe_extras.py backend/data_cleanup.py
echo "OK: file applicati. Ora un solo commit e un solo deploy."
