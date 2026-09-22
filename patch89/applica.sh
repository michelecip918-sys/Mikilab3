#!/bin/sh
# MikiLab v89 (include v84, v85, v86). Solo frontend. Uso dalla radice del progetto:  sh patch89/applica.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ ! -d backend ] || [ ! -d frontend ]; then echo "ERRORE: lancia lo script dalla radice del progetto."; exit 1; fi
cp -R "$HERE/files/." .
rm -rf capacitor-plugins
# pulizia: cartelle src/src finite nel progetto per errore con v88/v89 (file non usati)
rm -rf frontend/src/src
for sec in 13 14 15 16 17 18; do
  if ! grep -q "## $sec. V8" LEGAL_DATA_MAP.md; then
    awk -v s="## $sec. V8" 'index($0,s)==1{p=1;print;next} /^## 1[0-9]\. V8/{p=0} p' "$HERE/legal_addendum.md" >> LEGAL_DATA_MAP.md
  fi
done
for f in Dedica LaTuaCucina BancoMichele Libretto FestaLancio Volantino AscoltaCrosta SvegliaPanettiere PaneDelPaese SenzaBilancia CuraLievito MioLievito MappaForno PrimoGiro LancioSegreto BancoProve MioForno; do
  test -f "frontend/src/components/$f.jsx" || { echo "ATTENZIONE: manca $f.jsx"; exit 1; }
done
test -f frontend/src/lib/bottega.js && test -f frontend/src/lib/recipeSeo.js || { echo "ATTENZIONE: manca lib/recipeSeo.js"; exit 1; }
grep -q 'applyRecipeSeo' frontend/src/components/RecipeList.jsx || { echo "ATTENZIONE: RecipeList.jsx non aggiornato"; exit 1; }
grep -q 'route === "volantino"' frontend/src/App.js || { echo "ATTENZIONE: App.js non aggiornato"; exit 1; }
grep -q '/ricetta/' frontend/public/sitemap.xml || { echo "ATTENZIONE: sitemap non aggiornata"; exit 1; }
test -f frontend/public/googlea308a6dc1717156d.html || { echo "ATTENZIONE: manca il file di verifica Google!"; exit 1; }
echo "OK: v89 applicata. Ora: cd frontend && yarn build (deve riuscire), poi un solo commit e un solo deploy. Poi reinvia la sitemap in Search Console."
