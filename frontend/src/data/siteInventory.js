// Inventario completo di MikiLab per il PDF scaricabile (senza monetizzazione).
const IT = `## MikiLab in breve
App per fornai, gratuita al 100%. 6 lingue (IT, DE, EN, ES, FR, FA). Tema scuro nero e arancione.

## 1. Home
- Presentazione di Michele e scelta rapida dello spazio: Panetteria, Pizzeria, Pasticceria, Impara da casa
- Contatore iscritti animato con bandiere dei paesi
- Fornaio della Settimana, news, ricetta e sapore del giorno
- Radio del Fornaio, newsletter, messaggi dagli amici

## 2. Ricette
- Ricettario MikiLab (professionale) e Le mie ricette personali
- Categorie: Basi, Viennoiserie, Pane, Focacce, Snack, Grandi Lievitati e Panettoni
- Scheda ricetta con costi, prezzi B2B, foto, procedimento e timeline
- Scansiona una ricetta da foto, aggiungi ricette a mano
- Ricette Custodite e Sapori di Casa

## 3. Il Tuo Laboratorio
- Piano di Produzione con IA: piano settimanale o giornaliero, ordini extra, moduli (celle e impastatrici, orari, infornate, meteo e clima, lista spesa, costi e margine, turni, forni, pause notturne, anti-spreco), timer di fase, lettura vocale, archivio piani, PDF completo e PDF elegante col logo
- Panificazione: Generatore Ricette, Fermentazione Predittiva, Smart Weather-Baker, Conversione Farine, Scanner Farina, Vapore e Forno, Adatta Forno, Temperatura Acqua, Idratazione, Metodo e Sequenze IA, Digital Twin, Stampi e Pirottini, Bilancia Smart, Pesata Guidata, Esubero Zero-Sprechi, Angolo del Recupero, Costo Energia Forno, Time-Lapse Raddoppio, Termostato e Clima
- Pizzeria e Pasticceria: laboratori dedicati
- Mani in Pasta: comando vocale, Convertitore Lieviti, Timer Multi-Impasto, Registro Lievito Madre, SOS Impasto, Ricetta di Cantiere in PDF, Banca del Lievito
- Gestione: Controllo Celle e Impastatrici, Giacenze Freezer, Punti Vendita, Chiusura Giornata, Costi e Margine, Anti-Spreco, Parco Macchine, Diagnosi Foto, Diagnosi Suono, Diario Impasti, Checklist, Shelf-Life, Registro di Produzione, Magazzino, Tracciabilita lotti

## 4. Impara (Academy)
- Percorso a livelli per principianti e Bake-Along passo passo
- Quiz e Sfida Lampo con classifica e badge Streak (7, 30, 100 giorni)
- Mentori, ricettario base, tabelle farine, corsi e calcolatori
- Glossario, Enciclopedia, Guida ai Metodi e SOS Impasto guidato

## 5. Social
- Profilo pubblico, amici, chat privata
- Mappa dei fornai, Hall of Fame, avatar
- Motore Sfide che sblocca contenuti

## 6. Promuovi MikiLab
- Volantini stampabili in 5 lingue, verticali e orizzontali, con nome del forno e QR tracciati
- Post social pronti da scaricare e condividere
- Condivisione nativa dal telefono

## 7. Admin (solo tu)
- Gestione ricette, utenti e accessi
- Statistiche email iscritti e click social con export CSV
- Impostazioni social: TikTok, Instagram, Facebook

## Note tecniche
- Accesso con email e password oppure Google, reset password via email
- Assistente vocale, timer sempre attivi, notifiche, installabile come app`;

const EN = `## MikiLab at a glance
A 100% free app for bakers. 6 languages (IT, DE, EN, ES, FR, FA). Dark black and orange theme.

## 1. Home
- Michele's intro and quick choice of space: Bakery, Pizzeria, Pastry, Learn from home
- Animated subscriber counter with country flags
- Baker of the Week, news, recipe and flavour of the day
- Baker's Radio, newsletter, messages from friends

## 2. Recipes
- MikiLab recipe book (professional) and My personal recipes
- Categories: Bases, Viennoiserie, Bread, Focaccia, Snacks, Large Leavened and Panettoni
- Recipe card with costs, B2B prices, photos, method and timeline
- Scan a recipe from a photo, add recipes by hand
- Kept Recipes and Home Flavours

## 3. Your Lab
- AI Production Plan: weekly or daily plan, extra orders, modules (cells and mixers, timings, bakes, weather and climate, shopping list, cost and margin, shifts, ovens, overnight pauses, anti-waste), phase timers, voice reading, plan archive, full PDF and elegant PDF with logo
- Baking: Recipe Generator, Predictive Fermentation, Smart Weather-Baker, Flour Conversion, Flour Scanner, Steam and Oven, Adapt Oven, Water Temperature, Hydration, AI Method and Sequences, Digital Twin, Molds and Cases, Smart Scale, Guided Weighing, Zero-Waste, Recovery Corner, Oven Energy Cost, Doubling Time-Lapse, Thermostat and Climate
- Pizzeria and Pastry: dedicated labs
- Hands-on: voice command, Yeast Converter, Multi-Dough Timer, Sourdough Log, Dough SOS, Site Recipe PDF, Yeast Bank
- Management: Cells and Mixers, Freezer Stock, Sales Points, Day Closing, Cost and Margin, Anti-Waste, Machines, Photo Diagnosis, Sound Diagnosis, Dough Log, Checklists, Shelf-Life, production register, Warehouse, Batch traceability

## 4. Learn (Academy)
- Level path for beginners and step-by-step Bake-Along
- Quiz and Flash Challenge with leaderboard and Streak badges (7, 30, 100 days)
- Mentors, base recipe book, flour tables, courses and calculators
- Glossary, Encyclopedia, Methods Guide and guided Dough SOS

## 5. Social
- Public profile, friends, private chat
- Bakers map, Hall of Fame, avatars
- Challenge engine that unlocks content

## 6. Promote MikiLab
- Printable flyers in 5 languages, vertical and horizontal, with bakery name and tracked QR codes
- Ready-to-use social posts to download and share
- Native sharing from the phone

## 7. Admin (only you)
- Manage recipes, users and access
- Subscriber email and social click stats with CSV export
- Social settings: TikTok, Instagram, Facebook

## Technical notes
- Sign in with email and password or Google, password reset via email
- Voice assistant, always-on timers, notifications, installable as an app`;

export function siteInventoryMd(lang = "it") {
  return lang === "en" ? EN : IT;
}
