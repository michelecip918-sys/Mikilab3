#!/bin/sh
# MikiLab v92 — L'Officina di Sitor (13 attrezzi) + Etichetta MikiLab (v91). Da applicare dopo la v90.
# Uso dalla radice del progetto:  sh patch92/applica.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ ! -d backend ] || [ ! -d frontend ]; then echo "ERRORE: lancia lo script dalla radice del progetto."; exit 1; fi
test -f frontend/src/components/Festa.jsx || { echo "ERRORE: manca la v90 (Festa.jsx). Applica prima la v90."; exit 1; }
test -f frontend/src/components/RecipeList.jsx || { echo "ERRORE: manca RecipeList.jsx"; exit 1; }
cp -R "$HERE/files/." .
node "$HERE/patch_recipelist.js"
if ! grep -q "## 20. V91" LEGAL_DATA_MAP.md; then sed -n '/^## 20\. V91/,/^## 21\. V92/p' "$HERE/legal_addendum.md" | sed '$d' >> LEGAL_DATA_MAP.md; fi
if ! grep -q "## 21. V92" LEGAL_DATA_MAP.md; then sed -n '/^## 21\. V92/,$p' "$HERE/legal_addendum.md" >> LEGAL_DATA_MAP.md; fi
for f in EtichettaMikiLab OfficinaSitor StrumentiRicetta officina/AcquaGiusta officina/LievitazioneACasa officina/StampoGiusto officina/RighelloCiotola officina/PesaInUnaCiotola officina/QuantoTiCosta officina/PaneInAgenda officina/CartolinaDelPane officina/CosaPossoFare officina/MettiAConfronto officina/OcchioDiSitor officina/ProntoSoccorso officina/DisegnaIlTaglio; do
  test -f "frontend/src/components/$f.jsx" || { echo "ATTENZIONE: manca $f.jsx"; exit 1; }
done
test -f frontend/src/lib/sitorTools.js || { echo "ATTENZIONE: manca lib/sitorTools.js"; exit 1; }
for k in EtichettaMikiLab OfficinaSitor StrumentiRicetta; do
  grep -q "$k" frontend/src/components/RecipeList.jsx || { echo "ATTENZIONE: RecipeList.jsx non contiene $k"; exit 1; }
done
grep -q 'mikilab-v72' frontend/public/sw.js || { echo "ATTENZIONE: sw.js non aggiornato"; exit 1; }
test -f frontend/public/googlea308a6dc1717156d.html || { echo "ATTENZIONE: manca il file di verifica Google!"; exit 1; }
echo "OK: v92 applicata. Ora: cd frontend && yarn build (deve riuscire), poi un solo commit e un solo deploy."
