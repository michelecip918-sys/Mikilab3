#!/bin/sh
# MikiLab v93 — Il laboratorio, il primo pane, la bottega risponde, voce gratis. Da applicare DOPO la v92.
# Uso dalla radice del progetto:  sh patch93/applica.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ ! -d backend ] || [ ! -d frontend ]; then echo "ERRORE: lancia lo script dalla radice del progetto."; exit 1; fi
test -f frontend/src/components/OfficinaSitor.jsx || { echo "ERRORE: manca la v92 (OfficinaSitor.jsx). Applica prima la v92."; exit 1; }
node "$HERE/patch_frontend.js"
python3 "$HERE/patch_backend.py"
cp -R "$HERE/files/." .
if ! grep -q "## 22. V93" LEGAL_DATA_MAP.md; then cat "$HERE/legal_addendum.md" >> LEGAL_DATA_MAP.md; fi
for f in Laboratorio PrimoPane OfficinaSitor StrumentiRicetta laboratorio/FoglioProduzione laboratorio/Freddo laboratorio/Conversioni laboratorio/CaricoForno officina/ParoleRicetta officina/PrimaCheSucceda officina/ProntoSoccorso; do
  test -f "frontend/src/components/$f.jsx" || { echo "ATTENZIONE: manca $f.jsx"; exit 1; }
done
for f in bottega glossario; do test -f "frontend/src/lib/$f.js" || { echo "ATTENZIONE: manca lib/$f.js"; exit 1; }; done
grep -q 'route === "laboratorio"' frontend/src/App.js || { echo "ATTENZIONE: App.js senza la pagina Laboratorio"; exit 1; }
grep -q 'bottegaAnswer' frontend/src/components/SitorChat.jsx || { echo "ATTENZIONE: SitorChat.jsx senza la bottega"; exit 1; }
grep -q 'FEATURE_VOICE_SERVER' backend/sitor_public.py backend/server.py frontend/src/lib/tts.js || { echo "ATTENZIONE: interruttore voce mancante"; exit 1; }
grep -q 'mikilab-v73' frontend/public/sw.js || { echo "ATTENZIONE: sw.js non aggiornato"; exit 1; }
test -f frontend/public/googlea308a6dc1717156d.html || { echo "ATTENZIONE: manca il file di verifica Google!"; exit 1; }
python3 -m py_compile backend/server.py backend/sitor_public.py || { echo "ATTENZIONE: errore di sintassi nel backend"; exit 1; }
# pulizia: le cartelle delle patch già applicate non fanno parte del sito
rm -rf patch83 patch84 patch86 patch87 patch88 patch89 patch90 patch91 patch92 v92
echo "OK: v93 applicata. Ora: cd frontend && yarn build (deve riuscire), poi un solo commit e un solo deploy. Poi riavvia il backend."
