import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles, Volume2, VolumeX } from "lucide-react";
import { playTTS, stopTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const DONE_KEY = "mikilab_sitor_tour_done";
const FLOOR_DONE_KEY = "mikilab_floor_tour_done";

// Tour guidato vocale di Sitor: spiega ogni area.
// variant="capo" → console del Capo (apre i gruppi). variant="floor" → postazione operaio.
export default function SitorTour({ variant = "capo" }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [muted, setMuted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const mutedRef = useRef(false);
  const isFloor = variant === "floor";
  const doneKey = isFloor ? FLOOR_DONE_KEY : DONE_KEY;

  const CAPO_STEPS = [
    { sec: null, title: tri("Ciao, sono Sitor", "Hallo, ich bin Sitor", "Hi, I'm Sitor", "Hola, soy Sitor", "Salut, je suis Sitor", "سلام، من سیتور هستم"),
      body: tri("Ti presento la console in meno di un minuto: sei sezioni, ognuna con le sue schede. In alto trovi le scorciatoie; il pulsante «Chiedi a Sitor» apre la mia chat da qualunque punto.", "Ich stelle dir die Konsole in unter einer Minute vor: sechs Bereiche mit Tabs.", "Let me introduce the console in under a minute: six sections, each with its own tabs. Shortcuts at the top; the «Ask Sitor» button opens my chat from anywhere.", "Te presento la consola en menos de un minuto: seis secciones con pestañas.", "Je te présente la console en moins d'une minute : six sections avec onglets.", "کنسول را در کمتر از یک دقیقه معرفی می‌کنم: شش بخش با زبانه‌ها.") },
    { sec: "ricettario", title: tri("1 · Ricettario", "1 · Rezepte", "1 · Recipes", "1 · Recetas", "1 · Recettes", "۱ · دستورها"),
      body: tri("Le schede qui: Ricette, Thermal Flow, Magazzino e Food Cost. Crea e correggi le ricette, controlla scorte e margini — tutto in un unico posto.", "Tabs: Rezepte, Thermal Flow, Lager und Food Cost.", "The tabs here: Recipes, Thermal Flow, Warehouse and Food Cost. Create and fix recipes, check stock and margins — all in one place.", "Pestañas: Recetas, Thermal Flow, Almacén y Food Cost.", "Onglets : Recettes, Thermal Flow, Entrepôt et Food Cost.", "زبانه‌ها: دستورها، جریان حرارتی، انبار و بها.") },
    { sec: "piano", title: tri("2 · Piano", "2 · Plan", "2 · Plan", "2 · Plan", "2 · Plan", "۲ · برنامه"),
      body: tri("Schede Piano, Chiusura, Consegne e Stato Macchine. I pulsanti rapidi in cima — Genera il piano, Chiudi la giornata, Organizza consegne — ti portano subito al punto giusto.", "Tabs Plan, Abschluss, Lieferungen und Maschinenstatus. Schnellknöpfe oben.", "Plan, Day-close, Deliveries and Machine Status tabs. The quick buttons at the top — Generate plan, Close the day, Organize deliveries — take you straight there.", "Pestañas Plan, Cierre, Entregas y Estado de Máquinas.", "Onglets Plan, Clôture, Livraisons et État Machines.", "زبانه‌های برنامه، بستن روز، تحویل و وضعیت ماشین‌ها.") },
    { sec: "ordini", title: tri("3 · Ordini Extra", "3 · Extra-Aufträge", "3 · Extra Orders", "3 · Pedidos Extra", "3 · Commandes Extra", "۳ · سفارش‌های اضافه"),
      body: tri("Ordini dell'ultimo minuto e ordini B2B: aggiungili qui e ricalcolo il piano all'istante. In pizzeria e pasticceria compare la scheda dedicata.", "Last-Minute- und B2B-Aufträge: hier hinzufügen, Plan wird sofort neu berechnet.", "Last-minute and B2B orders: add them here and I recalculate the plan instantly. In pizzeria and pastry a dedicated tab appears.", "Pedidos de última hora y B2B: se recalcula el plan al instante.", "Commandes de dernière minute et B2B : le plan est recalculé aussitôt.", "سفارش‌های لحظه‌آخری و B2B: برنامه فوراً بازمحاسبه می‌شود.") },
    { sec: "team", title: tri("4 · Team", "4 · Team", "4 · Team", "4 · Equipo", "4 · Équipe", "۴ · تیم"),
      body: tri("Schede Coordinamento, Assegnazione, Riepilogo, Turni-tipo e Volti. Organizzi le persone e, all'apertura del turno, la squadra viene annunciata a voce.", "Tabs Koordination, Zuweisung, Überblick, Vorlagen und Gesichter.", "Coordination, Assignment, Roll-call, Templates and Faces tabs. Organise people; at shift start the team is announced by voice.", "Pestañas Coordinación, Asignación, Resumen, Plantillas y Rostros.", "Onglets Coordination, Affectation, Appel, Modèles et Visages.", "زبانه‌های هماهنگی، تخصیص، فراخوان، الگو و چهره‌ها.") },
    { sec: "strumenti", title: tri("5 · Strumenti", "5 · Geräte", "5 · Tools", "5 · Herramientas", "5 · Outils", "۵ · ابزارها"),
      body: tri("Schede Macchine, Reparti, Silos, Nuovi Macchinari e Celle & Freezer. Da qui aggiungi reparti e macchine, riconosci un macchinario nuovo e chiedi strumenti su misura.", "Tabs Maschinen, Bereiche, Silos, Neue Maschinen und Kühlung.", "Machines, Departments, Silos, New Machines and Cold Chain tabs. Add departments and machines, recognise a new machine and request custom tools.", "Pestañas Máquinas, Áreas, Silos, Nuevas Máquinas y Cadena de Frío.", "Onglets Machines, Rayons, Silos, Nouvelles Machines et Chaîne du Froid.", "زبانه‌های ماشین‌ها، بخش‌ها، سیلوها، ماشین‌های جدید و زنجیره سرد.") },
    { sec: "sicurezza", title: tri("6 · Sicurezza & Report", "6 · Sicherheit & Berichte", "6 · Security & Reports", "6 · Seguridad", "6 · Sécurité", "۶ · امنیت"),
      body: tri("Schede Report, Accessi ed Emergenze: rapporti di fine turno, PIN e registro accessi, centro emergenze. E ricorda: la mia chat è sempre a un tocco con «Chiedi a Sitor».", "Tabs Berichte, Zugriffe und Notfälle. Meine Chat ist immer einen Tipp entfernt.", "Reports, Access and Emergencies tabs: end-of-shift reports, PINs and access log, emergency center. And remember: my chat is always one tap away via «Ask Sitor».", "Pestañas Informes, Accesos y Emergencias.", "Onglets Rapports, Accès et Urgences.", "زبانه‌های گزارش، دسترسی و اضطراری.") },
  ];

  const FLOOR_STEPS = [
    { target: null, title: tri("Ciao, sono Sitor", "Hallo, ich bin Sitor", "Hi, I'm Sitor", "Hola, soy Sitor", "Salut, je suis Sitor", "سلام، من سیتور هستم"),
      body: tri("Ti mostro questa schermata in pochi passaggi: dove trovi il tuo lavoro e come chiudere il turno.", "Ich zeige dir diesen Bildschirm in wenigen Schritten.", "I'll show you this screen in a few steps: where your work is and how to close the shift.", "Te muestro esta pantalla en pocos pasos.", "Je te présente cet écran en quelques étapes.", "این صفحه را در چند قدم نشانت می‌دهم.") },
    { target: "floor-my-assignment", title: tri("1 · Il tuo compito di oggi", "1 · Deine Aufgabe heute", "1 · Your task today", "1 · Tu tarea de hoy", "1 · Ta tâche du jour", "۱ · وظیفه امروز تو"),
      body: tri("In alto trovi il compito assegnato dalla Direzione per oggi. Il tasto altoparlante lo legge a voce, così puoi lavorare senza toccare lo schermo.", "Oben siehst du deine heutige Aufgabe. Der Lautsprecher liest sie vor.", "At the top you find the task assigned by Management today. The speaker button reads it aloud, so you can work hands-free.", "Arriba ves tu tarea del día. El altavoz la lee en voz alta.", "En haut, ta tâche du jour. Le haut-parleur la lit à voix haute.", "بالای صفحه وظیفه امروزت است. بلندگو آن را می‌خواند.") },
    { target: "floor-day-tasks", title: tri("2 · I lavori del turno", "2 · Die Schichtarbeiten", "2 · The shift jobs", "2 · Los trabajos del turno", "2 · Les tâches du service", "۲ · کارهای شیفت"),
      body: tri("Qui sotto trovi la lista dei lavori. Il tasto altoparlante li legge a voce, il segno di spunta verde li segna come completati.", "Unten die Arbeitsliste. Lautsprecher liest vor, grünes Häkchen markiert als erledigt.", "Below is the job list. The speaker button reads them aloud, the green check marks them as completed.", "Abajo la lista de trabajos. El altavoz los lee, el check los marca como hechos.", "En dessous, la liste des tâches. Le haut-parleur les lit, la coche les marque terminées.", "پایین لیست کارهاست. بلندگو می‌خواند و تیک سبز انجام‌شده را علامت می‌زند.") },
    { target: "floor-analyzer", title: tri("3 · Foto & assistenza", "3 · Foto & Hilfe", "3 · Photo & assistance", "3 · Foto y asistencia", "3 · Photo & assistance", "۳ · عکس و کمک"),
      body: tri("Per un dubbio su un prodotto o una macchina, scatta una foto qui: viene analizzata e ricevi indicazioni su come procedere.", "Bei Zweifeln zu Produkt oder Maschine: Foto aufnehmen, du erhältst eine Analyse.", "For any doubt about a product or a machine, take a photo here: it gets analysed and you receive instructions on how to proceed.", "Ante una duda sobre un producto o máquina, haz una foto y recibes indicaciones.", "En cas de doute sur un produit ou une machine, prends une photo : tu reçois une analyse.", "برای محصول یا ماشین عکس بگیر تا تحلیل و راهنمایی دریافت کنی.") },
    { target: "floor-endshift", title: tri("4 · Fine turno", "4 · Schichtende", "4 · End of shift", "4 · Fin de turno", "4 · Fin de service", "۴ · پایان شیفت"),
      body: tri("A fine giornata compila il rapporto di fine turno: pezzi prodotti, scarti ed eventuali problemi. Viene inviato alla Direzione.", "Am Tagesende füllst du den Schichtbericht aus: Stückzahl, Ausschuss und Probleme. Er geht an die Direktion.", "At the end of the day fill in the end-of-shift report: pieces made, waste and any issues. It is sent to Management.", "Al final del día rellena el informe de turno: piezas, desperdicios y problemas. Se envía a Dirección.", "En fin de journée, remplis le rapport de service : pièces produites, rebuts et problèmes. Il est envoyé à la Direction.", "پایان روز گزارش شیفت را پر کن: تعداد، ضایعات و مشکلات. برای مدیریت ارسال می‌شود.") },
  ];

  const STEPS = isFloor ? FLOOR_STEPS : CAPO_STEPS;

  const speak = useCallback((i) => {
    if (mutedRef.current) return;
    const s = STEPS[i]; if (!s) return;
    try { playTTS(`${s.title}. ${s.body}`, { lang, voice: "nexus" }); } catch { /* */ }
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = useCallback((i) => {
    const s = STEPS[i]; if (!s) return;
    if (s.sec) {
      try { window.dispatchEvent(new CustomEvent("mikilab:open-group", { detail: s.sec })); } catch { /* */ }
      setTimeout(() => { try { document.querySelector(`#capo-sec-${s.sec}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); } catch { /* */ } }, 260);
    } else if (s.target) {
      try { document.querySelector(`[data-testid=${s.target}]`)?.scrollIntoView({ behavior: "smooth", block: "center" }); } catch { /* */ }
    }
    setStep(i);
    speak(i);
  }, [speak]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = useCallback(() => { setOpen(true); goTo(0); }, [goTo]);

  const finish = useCallback(() => {
    stopTTS(); setOpen(false);
    try { localStorage.setItem(doneKey, "1"); } catch { /* */ }
  }, [doneKey]);

  // Auto-avvio una sola volta + ascolto evento di riavvio manuale.
  useEffect(() => {
    let seen = true; try { seen = localStorage.getItem(doneKey) === "1"; } catch { /* */ }
    if (!seen) { const t = setTimeout(start, 900); return () => clearTimeout(t); }
  }, [start, doneKey]);
  useEffect(() => {
    const evt = isFloor ? "mikilab:start-floor-tour" : "mikilab:start-tour";
    const h = () => start();
    window.addEventListener(evt, h);
    return () => window.removeEventListener(evt, h);
  }, [start, isFloor]);

  // Non sovrapporsi ai modali aperti (marcati con data-tour-suppress).
  useEffect(() => {
    const check = () => setModalOpen(!!document.querySelector("[data-tour-suppress]"));
    check();
    const mo = new MutationObserver(check);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  if (!open || modalOpen) return null;
  const s = STEPS[step];
  const last = step === STEPS.length - 1;

  const toggleMute = () => { const v = !muted; setMuted(v); mutedRef.current = v; if (v) stopTTS(); else speak(step); };

  return (
    <div data-testid="sitor-tour" className="fixed inset-x-0 bottom-0 z-[65] pointer-events-none">
      <div className="pointer-events-auto max-w-md mx-auto m-3 rounded-2xl border border-accent/45 bg-background/95 backdrop-blur-xl p-4 shadow-[0_0_30px_rgba(166,177,188,0.25)]">
        <div className="flex items-start gap-3">
          <span className="shrink-0 w-9 h-9 rounded-xl inline-flex items-center justify-center bg-accent/15 border border-accent/40"><Sparkles className="w-5 h-5 text-accent" /></span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display font-black text-foreground text-sm uppercase tracking-wide">{s.title}</h3>
              <div className="flex items-center gap-1">
                <button data-testid="sitor-tour-mute" onClick={toggleMute} title={muted ? "Voce off" : "Voce on"} className="text-muted-foreground active:scale-90 p-1">{muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}</button>
                <button data-testid="sitor-tour-close" onClick={finish} className="text-muted-foreground active:scale-90 p-1"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <p className="text-[13px] text-foreground leading-relaxed mt-1">{s.body}</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-3">
          {STEPS.map((_, i) => (
            <span key={i} data-testid={`sitor-tour-dot-${i}`} className="rounded-full transition-all" style={{ width: i === step ? 18 : 6, height: 6, background: i === step ? "hsl(var(--accent))" : "hsl(var(--secondary))" }} />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 mt-3">
          <button data-testid="sitor-tour-skip" onClick={finish} className="text-[11px] font-bold text-muted-foreground hover:text-muted-foreground">{tri("Salta il tour", "Tour überspringen", "Skip tour", "Saltar", "Passer", "رد کردن")}</button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button data-testid="sitor-tour-prev" onClick={() => goTo(step - 1)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-muted-foreground text-xs font-bold active:scale-95"><ChevronLeft className="w-3.5 h-3.5" /> {tri("Indietro", "Zurück", "Back", "Atrás", "Retour", "قبلی")}</button>
            )}
            {last ? (
              <button data-testid="sitor-tour-finish" onClick={finish} className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg font-black text-xs text-foreground active:scale-95" style={{ background: "linear-gradient(90deg,hsl(var(--accent)),hsl(var(--muted-foreground)))" }}>{tri("Ho capito", "Verstanden", "Understood", "Entendido", "Compris", "متوجه شدم")}</button>
            ) : (
              <button data-testid="sitor-tour-next" onClick={() => goTo(step + 1)} className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg font-black text-xs text-foreground active:scale-95" style={{ background: "linear-gradient(90deg,hsl(var(--accent)),hsl(var(--muted-foreground)))" }}>{tri("Avanti", "Weiter", "Next", "Siguiente", "Suivant", "بعدی")} <ChevronRight className="w-3.5 h-3.5" /></button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
