#!/bin/sh
# MikiLab v93b — correzione: la v93 aveva sovrascritto per errore src/lib/bottega.js (v88, "La tua bottega").
# Questo script rimette il file originale e sposta la "bottega che risponde" in src/lib/sitorBottega.js.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ ! -d backend ] || [ ! -d frontend ]; then echo "ERRORE: lancia lo script dalla radice del progetto."; exit 1; fi
test -f frontend/src/components/Laboratorio.jsx || { echo "ERRORE: manca la v93. Applica prima la v93."; exit 1; }
cp -R "$HERE/files/." .
grep -q 'setLastRecipe' frontend/src/lib/bottega.js || { echo "ATTENZIONE: bottega.js non ripristinato"; exit 1; }
sed -i 's#import { bottegaAnswer } from "@/lib/bottega"; // V93#import { bottegaAnswer } from "@/lib/sitorBottega"; // V93b#' frontend/src/components/SitorChat.jsx
grep -q '@/lib/sitorBottega' frontend/src/components/SitorChat.jsx || { echo "ATTENZIONE: SitorChat.jsx non aggiornato"; exit 1; }
grep -q 'bottegaAnswer' frontend/src/lib/sitorBottega.js || { echo "ATTENZIONE: manca sitorBottega.js"; exit 1; }
echo "OK: v93b applicata. Ora: cd frontend && yarn build (deve riuscire), poi un solo commit e un solo deploy."
