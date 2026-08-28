import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const DONE_KEY = "mikilab_lab_tour_done";
const base = process.env.PUBLIC_URL || "";
const MICHELE = `${base}/michele-avatar-full.jpg`;
const MOHAMMED = `${base}/mohammed-avatar.jpg`;

// Apri il tour a richiesta (dal riquadro di Mohammed o altrove).
export function openLabTour() {
  window.dispatchEvent(new CustomEvent("mikilab-lab-tour"));
}

function buildSlides(lang) {
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  return [
    {
      who: "michele", avatar: MICHELE,
      title: tri("Ciao, sono Michele! 👋", "Hallo, ich bin Michele! 👋", "Hi, I'm Michele! 👋"),
      body: tri(
        "Benvenuto ne «Il Tuo Laboratorio», il cuore di MikiLab. Ora Momy ti spiega in pochi minuti come muoverti qui: poi ti lascio libero di lavorare, in modo produttivo e senza stress.",
        "Willkommen in «Deiner Backstube», dem Herzen von MikiLab. Momy erklärt dir gleich in wenigen Minuten, wie du dich hier bewegst – danach lasse ich dich in Ruhe und stressfrei arbeiten.",
        "Welcome to «Your Lab», the heart of MikiLab. Momy will now explain in a few minutes how to move around here – then I'll leave you free to work, productively and stress-free."),
    },
    {
      who: "mohammed", avatar: MOHAMMED, step: 1,
      title: tri("Passo 1 · Configurazione Hardware", "Schritt 1 · Hardware-Einrichtung", "Step 1 · Hardware Setup"),
      body: tri(
        "Qui imposti UNA volta le tue macchine: impastatrici, forni, celle di lievitazione, frigo e giacenze del freezer. Colleghi anche i dispositivi (bilancia smart, termostati) e trovi il Marketplace dell'usato. Tutto configurato una volta = zero stress dopo.",
        "Hier richtest du EINMAL deine Maschinen ein: Kneter, Öfen, Gärzellen, Kühlschrank und Freezer-Bestände. Du verbindest auch Geräte (smarte Waage, Thermostate) und findest den Gebraucht-Markt. Einmal eingerichtet = danach stressfrei.",
        "Here you set up your machines ONCE: mixers, ovens, proofing cells, fridge and freezer stock. You also connect devices (smart scale, thermostats) and find the used marketplace. Set up once = stress-free afterwards."),
    },
    {
      who: "mohammed", avatar: MOHAMMED, step: 2,
      title: tri("Passo 2 · Ricette & Forno", "Schritt 2 · Rezepte & Ofen", "Step 2 · Recipes & Oven"),
      body: tri(
        "Inserisci o scansiona le tue ricette e consulta la Tabella Farine (630, 550, farro…). Con «Adatta il Forno» converto ogni ricetta AL TUO forno: temperatura, vapore e tempi giusti. Vantaggio: cottura sempre perfetta, senza tentativi.",
        "Erfasse oder scanne deine Rezepte und nutze die Mehl-Tabelle (630, 550, Dinkel…). Mit «Ofen anpassen» passe ich jedes Rezept an DEINEN Ofen an: Temperatur, Dampf und Zeiten. Vorteil: immer perfektes Backen, ohne Probieren.",
        "Add or scan your recipes and use the Flour Table (630, 550, spelt…). With «Adapt the Oven» I convert every recipe to YOUR oven: temperature, steam and timing. Benefit: always perfect bakes, no trial and error."),
    },
    {
      who: "mohammed", avatar: MOHAMMED,
      title: tri("Trova le ricette per Base 🔎", "Rezepte nach Basis finden 🔎", "Find recipes by Base 🔎"),
      body: tri(
        "Nelle tue ricette, in alto, trovi i filtri «per Base»: tocca Poolish, Lievito Madre, LM di Segale, Biga, LiCoLi, Farina Cotta o Diretto e vedi SUBITO solo le ricette che usano quella base. Così scegli in un attimo il metodo giusto per la giornata, senza scorrere tutto.",
        "In deinen Rezepten findest du oben die «Basis»-Filter: tippe auf Poolish, Sauerteig, Roggen-Sauerteig, Biga, LiCoLi, Kochstück oder Direkt und siehst SOFORT nur die Rezepte mit dieser Basis. So wählst du im Nu die richtige Methode für den Tag.",
        "In your recipes, at the top, you'll find the «by Base» filters: tap Poolish, Sourdough, Rye sourdough, Biga, LiCoLi, Cooked flour or Direct and INSTANTLY see only the recipes using that base. Pick the right method for the day in a second."),
    },
    {
      who: "mohammed", avatar: MOHAMMED, step: 3,
      title: tri("Passo 3 · Logistica & Punti Vendita", "Schritt 3 · Logistik & Verkaufspunkte", "Step 3 · Logistics & Sales Points"),
      body: tri(
        "Configuri i tuoi punti vendita e gestisci personale e turni. Così sai chi fa cosa e quanto produrre per ogni negozio: la squadra lavora serena e organizzata.",
        "Richte deine Verkaufspunkte ein und verwalte Personal & Schichten. So weißt du, wer was macht und wie viel du pro Laden produzierst: das Team arbeitet ruhig und organisiert.",
        "Set up your sales points and manage staff & shifts. You'll know who does what and how much to produce per shop: the team works calm and organised."),
    },
    {
      who: "mohammed", avatar: MOHAMMED, step: 4,
      title: tri("Passo 4 · Pianificazione Produzione", "Schritt 4 · Produktionsplanung", "Step 4 · Production Planning"),
      body: tri(
        "Il cuore organizzativo: piano settimanale, piano di lavoro di oggi e Piano IA. Con i «tempi a ritroso» sai a che ora iniziare per sfornare in orario. Aggiungi lista della spesa e Food Cost & Energia per tenere i costi sotto controllo.",
        "Das organisatorische Herz: Wochenplan, heutiger Arbeitsplan und KI-Plan. Mit der «Rückwärtsplanung» weißt du, wann du starten musst, um pünktlich zu backen. Dazu Einkaufsliste und Food Cost & Energie für die Kostenkontrolle.",
        "The organisational heart: weekly plan, today's work plan and AI plan. With «backward timing» you know when to start to bake on time. Add the shopping list and Food Cost & Energy to keep costs under control."),
    },
    {
      who: "mohammed", avatar: MOHAMMED, step: 5,
      title: tri("Passo 5 · Operatività In Corso", "Schritt 5 · Laufender Betrieb", "Step 5 · Live Operations"),
      body: tri(
        "Mentre lavori: calcolo la temperatura dell'acqua per centrare la temperatura impasto, ti guido nella Pesata Guidata (anche a voce!), gestisci timer e i sensori (meteo, pH del lievito, digital twin dell'impasto).",
        "Während der Arbeit: ich berechne die Wassertemperatur für die richtige Teigtemperatur, führe dich beim geführten Wiegen (auch per Stimme!), du nutzt Timer und Sensoren (Wetter, pH des Sauerteigs, Digital Twin).",
        "While you work: I calculate the water temperature to hit the right dough temperature, guide you through Guided Weighing (by voice too!), you use timers and sensors (weather, starter pH, dough digital twin)."),
    },
    {
      who: "mohammed", avatar: MOHAMMED, step: 6,
      title: tri("Passo 6 · Chiusura & Tracciabilità", "Schritt 6 · Abschluss & Rückverfolgung", "Step 6 · Closing & Traceability"),
      body: tri(
        "A fine giornata: Diario Impasti, Tracciabilità Lotti (QR), Registro HACCP e controlli finali. Con «Concludi Giornata» archivio tutto in automatico: sei sempre in regola, senza scartoffie.",
        "Am Tagesende: Teig-Tagebuch, Chargen-Rückverfolgung (QR), HACCP-Register und Endkontrollen. Mit «Tag abschließen» archiviere ich alles automatisch: immer regelkonform, ohne Papierkram.",
        "At the end of the day: Dough Log, Batch Traceability (QR), HACCP register and final checks. With «Close the Day» I archive everything automatically: always compliant, no paperwork."),
    },
    {
      who: "mohammed", avatar: MOHAMMED,
      title: tri("Tutti i miei strumenti 🧰", "Alle meine Werkzeuge 🧰", "All my tools 🧰"),
      body: tri(
        "Ecco tutto quello che trovi qui: Capo Laboratorio (macchine), Giacenze Freezer, Bilancia Smart, Termostato & Clima, Marketplace usato · Le Mie Ricette (aggiungi/scansiona), Tabella Farine, Adatta il Forno · Punti Vendita, Turni & Ruoli · Piano IA, Piano Settimanale, Piano di Lavoro, Tempi a Ritroso, Lista Spesa, Food Cost & Energia · Temperatura Acqua, Pesata Guidata a voce, Timer, Meteo, Tracker pH, Digital Twin dell'impasto · Diario Impasti, Tracciabilità Lotti (QR), Registro HACCP, Checklist, Shelf-Life, Anti-Spreco. Un unico posto per tutto il tuo laboratorio.",
        "Das findest du hier alles: Werkstattleiter (Maschinen), Freezer-Bestand, Smarte Waage, Thermostat & Klima, Gebraucht-Markt · Meine Rezepte (hinzufügen/scannen), Mehl-Tabelle, Ofen anpassen · Verkaufspunkte, Schichten & Rollen · KI-Plan, Wochenplan, Arbeitsplan, Rückwärtsplanung, Einkaufsliste, Food Cost & Energie · Wassertemperatur, geführtes Wiegen per Stimme, Timer, Wetter, pH-Tracker, Digital Twin des Teigs · Teig-Tagebuch, Chargen-Rückverfolgung (QR), HACCP-Register, Checklisten, Shelf-Life, Anti-Verschwendung. Alles an einem Ort.",
        "Here's everything you'll find: Lab Manager (machines), Freezer Stock, Smart Scale, Thermostat & Climate, Used Marketplace · My Recipes (add/scan), Flour Table, Adapt the Oven · Sales Points, Shifts & Roles · AI Plan, Weekly Plan, Work Plan, Backward Timing, Shopping List, Food Cost & Energy · Water Temperature, voice Guided Weighing, Timers, Weather, pH Tracker, dough Digital Twin · Dough Log, Batch Traceability (QR), HACCP register, Checklists, Shelf-Life, Anti-Waste. One place for your whole lab."),
    },
    {
      who: "mohammed", avatar: MOHAMMED,
      title: tri("E i miei comandi 🎧", "Und meine Befehle 🎧", "And my commands 🎧"),
      body: tri(
        "Sono sempre con te. Hai le mani nell'impasto? Usa l'assistente VOCALE: parla e io navigo ed eseguo per te. Accendi la Radio Fornaio per lavorare in musica. Con la Diagnosi Foto (qui nel Laboratorio o dal menu) leggo difetti del pane, stato dell'impasto, ingredienti e persino macchine rotte — da foto o video — e ti dico causa e soluzione. Trovi anche le «Diagnosi Recenti» per rivedere tutto senza rifare la foto. Oppure scrivimi in chat per ogni dubbio. Rivedi questa guida quando vuoi dal mio riquadro.",
        "Ich bin immer dabei. Hände im Teig? Nutze den SPRACH-Assistenten: sprich und ich navigiere und erledige für dich. Schalte das Bäcker-Radio ein. Mit der Foto-Diagnose (hier oder im Menü) erkenne ich Brotfehler, Teigzustand, Zutaten und sogar kaputte Maschinen — per Foto oder Video — und nenne Ursache und Lösung. Es gibt auch «Letzte Diagnosen» zum erneuten Ansehen ohne neues Foto. Oder schreib mir im Chat. Diese Anleitung kannst du jederzeit aus meinem Feld erneut ansehen.",
        "I'm always with you. Hands in the dough? Use the VOICE assistant: talk and I navigate and act for you. Turn on the Baker Radio. With Photo Diagnosis (here or from the menu) I read bread defects, dough state, ingredients and even broken machines — from a photo or video — and tell you the cause and fix. There's also «Recent diagnoses» to review everything without re-taking the photo. Or message me in chat. Replay this guide anytime from my panel."),
    },
  ];
}

export default function LabOnboarding() {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [show, setShow] = useState(false);
  const [i, setI] = useState(0);
  const slides = buildSlides(lang);
  const cur = slides[i];

  const stopAudio = () => {
    try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch { /* */ }
  };

  // Apri automaticamente al primo ingresso, o su richiesta via evento.
  useEffect(() => {
    if (!localStorage.getItem(DONE_KEY)) { setShow(true); setI(0); }
    const onOpen = () => { setShow(true); setI(0); };
    window.addEventListener("mikilab-lab-tour", onOpen);
    return () => window.removeEventListener("mikilab-lab-tour", onOpen);
  }, []);

  // Avatar "che scrivono": nessuna voce/TTS — la guida comunica solo per iscritto (fumetto).
  useEffect(() => {
    if (!show) { stopAudio(); return; }
    // eslint-disable-next-line
  }, [show, i]);

  const close = () => {
    localStorage.setItem(DONE_KEY, "1");
    stopAudio();
    setShow(false);
  };
  const next = () => { if (i < slides.length - 1) setI(i + 1); else close(); };
  const prev = () => setI(Math.max(0, i - 1));

  return (
    <AnimatePresence>
      {show && (
        <motion.div data-testid="lab-onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center bg-[#1A1412]/85 backdrop-blur-sm p-3">
          <motion.div key={i} initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.28 }}
            className="w-full max-w-md rounded-3xl bg-[#FAF5EC] dark:bg-[#1B2127] border border-[#E6D8C3] dark:border-[#38424B] shadow-2xl overflow-hidden">
            {/* header */}
            <div className={`p-5 ${cur.who === "michele" ? "bg-gradient-to-br from-[#3F4A54] to-[#5E6B62]" : "bg-gradient-to-br from-[#6E371C] to-[#8C4A27]"} text-white`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wide text-white/70">
                  {cur.who === "michele" ? tri("Michele · MikiLab", "Michele · MikiLab", "Michele · MikiLab") : tri("Momy · il tuo assistente", "Momy · dein Assistent", "Momy · your assistant")}
                </span>
                <div className="flex items-center gap-1.5">
                  <button data-testid="lab-onboarding-close" onClick={close} title="close"
                    className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center active:scale-95 transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <img src={cur.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/70 shadow-md shrink-0" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                <h2 className="font-display text-xl font-bold leading-tight">{cur.title}</h2>
              </div>
            </div>
            {/* body */}
            <div className="p-5">
              <p data-testid="lab-onboarding-body" className="text-[15px] text-[#2B303B] dark:text-[#e4eff8] leading-relaxed max-h-[40vh] overflow-y-auto">{cur.body}</p>
              {/* dots */}
              <div className="flex items-center justify-center gap-1.5 mt-5">
                {slides.map((_, k) => (
                  <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-[#8C4A27]" : "w-1.5 bg-[#E6D8C3] dark:bg-[#38424B]"}`} />
                ))}
              </div>
              {/* nav */}
              <div className="flex items-center justify-between gap-3 mt-4">
                <button data-testid="lab-onboarding-prev" onClick={prev} disabled={i === 0}
                  className="flex items-center gap-1 px-4 py-2.5 rounded-2xl border border-[#E6D8C3] dark:border-[#38424B] text-[#2B303B] dark:text-[#e4eff8] font-medium disabled:opacity-40">
                  <ChevronLeft className="w-5 h-5" /> {tri("Indietro", "Zurück", "Back")}
                </button>
                {i < slides.length - 1 ? (
                  <button data-testid="lab-onboarding-next" onClick={next}
                    className="flex items-center gap-1 px-5 py-2.5 rounded-2xl bg-[#8C4A27] hover:bg-[#336a94] text-white font-semibold active:scale-97 transition-all">
                    {tri("Avanti", "Weiter", "Next")} <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button data-testid="lab-onboarding-done" onClick={close}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#B45309] hover:bg-[#336a94] text-white font-semibold active:scale-97 transition-all">
                    <Check className="w-5 h-5" /> {tri("Ho capito, iniziamo!", "Verstanden, los geht's!", "Got it, let's start!")}
                  </button>
                )}
              </div>
              {i === 0 && (
                <button data-testid="lab-onboarding-skip" onClick={close} className="w-full text-center text-xs text-[#7E8A93] mt-3 py-1">
                  {tri("Salta la guida", "Anleitung überspringen", "Skip the guide")}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
