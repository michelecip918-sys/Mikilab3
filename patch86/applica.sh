#!/bin/sh
# MikiLab v86 (include v84 e v85). Solo frontend. Uso dalla radice del progetto:  sh patch86/applica.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ ! -d backend ] || [ ! -d frontend ]; then echo "ERRORE: lancia lo script dalla radice del progetto."; exit 1; fi
cp -R "$HERE/files/." .
rm -rf capacitor-plugins
for sec in 13 14 15; do
  if ! grep -q "## $sec. V8" LEGAL_DATA_MAP.md; then
    awk -v s="## $sec. V8" 'index($0,s)==1{p=1;print;next} /^## 1[0-9]\. V8/{p=0} p' "$HERE/legal_addendum.md" >> LEGAL_DATA_MAP.md
  fi
done
for f in AscoltaCrosta SvegliaPanettiere PaneDelPaese SenzaBilancia CuraLievito MioLievito MappaForno PrimoGiro LancioSegreto BancoProve MioForno; do
  test -f "frontend/src/components/$f.jsx" || { echo "ATTENZIONE: manca $f.jsx"; exit 1; }
done
test -f frontend/src/lib/notte.js || { echo "ATTENZIONE: manca lib/notte.js"; exit 1; }
grep -q 'route === "crosta"' frontend/src/App.js || { echo "ATTENZIONE: App.js non aggiornato"; exit 1; }
grep -q 'html.ml-notte' frontend/src/index.css || { echo "ATTENZIONE: index.css non aggiornato"; exit 1; }
grep -q 'mikilab_modo_notte' frontend/src/lib/tts.js || { echo "ATTENZIONE: tts.js non aggiornato"; exit 1; }
test -f frontend/public/googlea308a6dc1717156d.html || { echo "ATTENZIONE: manca il file di verifica Google!"; exit 1; }
echo "OK: v86 applicata. Ora: cd frontend && yarn build (deve riuscire), poi un solo commit e un solo deploy."
