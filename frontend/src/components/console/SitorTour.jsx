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
  const mutedRef = useRef(false);
  const isFloor = variant === "floor";
  const doneKey = isFloor ? FLOOR_DONE_KEY : DONE_KEY;

  const CAPO_STEPS = [
    { group: null, title: tri("Ciao, sono Sitor", "Hallo, ich bin Sitor", "Hi, I'm Sitor", "Hola, soy Sitor", "Salut, je suis Sitor", "سلام، من سیتور هستم"),
      body: tri("Ti accompagno in un giro veloce del tuo laboratorio. In meno di un minuto capisci dove si fa ogni cosa.", "Ich zeige dir in einer schnellen Runde deine Backstube.", "Let me give you a quick tour of your lab. In under a minute you'll know where everything lives.", "Te doy un recorrido rápido por tu laboratorio.", "Je te fais un tour rapide de ton labo.", "یک گشت سریع در آزمایشگاهت می‌زنیم.") },
    { group: "piano", title: tri("1 · Piano Settimanale", "1 · Wochenplan", "1 · Weekly Plan", "1 · Plan Semanal", "1 · Plan Hebdo", "۱ · برنامه هفتگی"),
      body: tri("Qui decidi cosa e quanto produrre. Scrivi due righe di ordini e io costruisco il piano del giorno e della settimana. È il tuo punto di partenza ogni mattina.", "Hier legst du fest, was und wie viel produziert wird. Ich baue den Plan.", "Here you decide what and how much to produce. Write a couple of order lines and I build the day and week plan. Your morning starting point.", "Aquí decides qué y cuánto producir. Yo creo el plan.", "Ici tu décides quoi et combien produire. Je construis le plan.", "اینجا تصمیم می‌گیری چه و چقدر تولید شود.") },
    { group: "ordini", title: tri("2 · Ordini Extra", "2 · Extra-Aufträge", "2 · Extra Orders", "2 · Pedidos Extra", "2 · Commandes Extra", "۲ · سفارش اضافه"),
      body: tri("Arriva un ordine non previsto? Aggiungilo qui e io rifaccio il piano all'istante, senza che tu debba ricalcolare nulla.", "Ungeplanter Auftrag? Ich plane sofort neu.", "An unexpected order? Add it here and I re-plan instantly, no recalculation needed.", "¿Pedido imprevisto? Replanifico al instante.", "Commande imprévue ? Je replanifie aussitôt.", "سفارش پیش‌بینی‌نشده؟ فوراً برنامه را بازسازی می‌کنم.") },
    { group: "squadra", title: tri("3 · Ruoli & Turni", "3 · Rollen & Schichten", "3 · Roles & Shifts", "3 · Roles & Turnos", "3 · Rôles & Services", "۳ · نقش‌ها و شیفت‌ها"),
      body: tri("Qui organizzi le persone: assegni ogni operaio a un reparto con il suo compito. All'apertura del turno annuncio io a voce chi fa cosa.", "Hier organisierst du die Leute. Ich sage das Team an.", "Here you organise people: assign each operator to a department with a task. I voice who does what at shift start.", "Aquí organizas a las personas y yo anuncio el equipo.", "Ici tu organises les personnes et j'annonce l'équipe.", "اینجا افراد را سازمان می‌دهی و من تیم را اعلام می‌کنم.") },
    { group: "strumenti", title: tri("4 · Strumenti & Celle", "4 · Werkzeuge & Kammern", "4 · Tools & Cells", "4 · Herramientas & Cámaras", "4 · Outils & Cellules", "۴ · ابزارها و سلول‌ها"),
      body: tri("La cassetta degli attrezzi: ricette, magazzino, celle e freezer, qualità, report e sicurezza. Apri lo strumento che ti serve quando ti serve.", "Der Werkzeugkasten: Rezepte, Lager, Kammern, Qualität, Berichte.", "The toolbox: recipes, warehouse, cells and freezer, quality, reports and security. Open the tool you need when you need it.", "La caja de herramientas: recetas, almacén, cámaras, calidad, informes.", "La boîte à outils : recettes, entrepôt, cellules, qualité, rapports.", "جعبه‌ابزار: دستورها، انبار، سلول‌ها، کیفیت و گزارش.") },
    { group: "sitor", title: tri("5 · Sala Sitor", "5 · Sitor-Saal", "5 · Sitor Hall", "5 · Sala Sitor", "5 · Salle Sitor", "۵ · تالار سیتور"),
      body: tri("È il posto dove parli con me: scrivi o detta, allega una foto o un ordine, e io rispondo, pianifico e ti avviso. Se non sai da dove partire, parti da qui.", "Der Ort, um mit mir zu sprechen. Fang hier an.", "The place to talk to me: write or dictate, attach a photo or order, and I answer, plan and alert you. Not sure where to start? Start here.", "El lugar para hablar conmigo. Empieza aquí.", "L'endroit pour me parler. Commence ici.", "جایی که با من صحبت می‌کنی. از اینجا شروع کن.") },
  ];

  const FLOOR_STEPS = [
    { target: null, title: tri("Ciao, sono Sitor", "Hallo, ich bin Sitor", "Hi, I'm Sitor", "Hola, soy Sitor", "Salut, je suis Sitor", "سلام، من سیتور هستم"),
      body: tri("Benvenuto in postazione. Questa schermata è tutta per te: ti mostro in pochi secondi dove trovi il tuo lavoro e come chiudere il turno.", "Willkommen an der Station. Ich zeige dir alles in Sekunden.", "Welcome to your station. This screen is all yours — let me show you where your work is and how to close the shift.", "Bienvenido a tu puesto. Te muestro todo en segundos.", "Bienvenue à ton poste. Je te montre tout en quelques secondes.", "به ایستگاهت خوش آمدی. همه‌چیز را سریع نشانت می‌دهم.") },
    { target: "floor-my-assignment", title: tri("1 · Il tuo compito di oggi", "1 · Deine Aufgabe heute", "1 · Your task today", "1 · Tu tarea de hoy", "1 · Ta tâche du jour", "۱ · وظیفه امروز تو"),
      body: tri("In alto vedi il compito che il Capo ha assegnato a te per oggi. Tocca l'altoparlante e te lo leggo io a voce: puoi lavorare senza toccare lo schermo.", "Oben siehst du deine Aufgabe vom Chef. Tippe auf den Lautsprecher, ich lese sie vor.", "At the top you see the task the Capo assigned to you today. Tap the speaker and I read it aloud — you can work hands-free.", "Arriba ves tu tarea del día. Toca el altavoz y te la leo.", "En haut, ta tâche du jour. Touche le haut-parleur, je te la lis.", "بالای صفحه وظیفه امروزت را می‌بینی. روی بلندگو بزن تا برایت بخوانم.") },
    { target: "floor-day-tasks", title: tri("2 · I lavori del turno", "2 · Die Schichtarbeiten", "2 · The shift jobs", "2 · Los trabajos del turno", "2 · Les tâches du service", "۲ · کارهای شیفت"),
      body: tri("Qui sotto trovi la lista dei lavori. Il tasto altoparlante te li legge, il segno di spunta verde li segna come fatti. Uno alla volta, con calma.", "Unten die Arbeitsliste. Lautsprecher liest vor, grünes Häkchen erledigt.", "Below is the job list. The speaker button reads them out, the green check marks them done. One at a time, calmly.", "Abajo la lista de trabajos. El altavoz los lee, el check los marca.", "En dessous, la liste des tâches. Le haut-parleur les lit, la coche les valide.", "پایین لیست کارهاست. بلندگو می‌خواند، تیک سبز انجام‌شده را علامت می‌زند.") },
    { target: "floor-analyzer", title: tri("3 · Foto & aiuto", "3 · Foto & Hilfe", "3 · Photo & help", "3 · Foto y ayuda", "3 · Photo & aide", "۳ · عکس و کمک"),
      body: tri("Hai un dubbio su un prodotto o una macchina? Scatta una foto qui e te la analizzo subito, spiegandoti cosa fare.", "Zweifel? Mach ein Foto, ich analysiere es sofort.", "Not sure about a product or a machine? Take a photo here and I analyse it right away and tell you what to do.", "¿Dudas? Haz una foto y la analizo.", "Un doute ? Prends une photo, je l'analyse.", "شک داری؟ عکس بگیر تا تحلیل کنم.") },
    { target: "floor-endshift", title: tri("4 · Fine turno", "4 · Schichtende", "4 · End of shift", "4 · Fin de turno", "4 · Fin de service", "۴ · پایان شیفت"),
      body: tri("A fine giornata compila il rapporto di fine turno: pezzi prodotti, sprechi ed eventuali problemi. Lo mando io direttamente al Capo. Buon lavoro!", "Am Ende füllst du den Schichtbericht aus. Ich schicke ihn an den Chef.", "At the end of the day fill in the end-of-shift report: pieces made, waste and any issues. I send it straight to the Capo. Have a great shift!", "Al final rellena el informe de turno. Yo lo envío al Capo.", "En fin de journée, remplis le rapport. Je l'envoie au Capo.", "پایان روز گزارش شیفت را پر کن. من برای کاپو می‌فرستم.") },
  ];

  const STEPS = isFloor ? FLOOR_STEPS : CAPO_STEPS;

  const speak = useCallback((i) => {
    if (mutedRef.current) return;
    const s = STEPS[i]; if (!s) return;
    try { playTTS(`${s.title}. ${s.body}`, { lang, voice: "nexus" }); } catch { /* */ }
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = useCallback((i) => {
    const s = STEPS[i]; if (!s) return;
    if (s.group) {
      try { window.dispatchEvent(new CustomEvent("mikilab:open-group", { detail: s.group })); } catch { /* */ }
      setTimeout(() => { try { document.querySelector(`[data-testid=capo-group-${s.group}]`)?.scrollIntoView({ behavior: "smooth", block: "center" }); } catch { /* */ } }, 260);
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

  if (!open) return null;
  const s = STEPS[step];
  const last = step === STEPS.length - 1;

  const toggleMute = () => { const v = !muted; setMuted(v); mutedRef.current = v; if (v) stopTTS(); else speak(step); };

  return (
    <div data-testid="sitor-tour" className="fixed inset-x-0 bottom-0 z-[65] pointer-events-none">
      <div className="pointer-events-auto max-w-md mx-auto m-3 rounded-2xl border border-[#a6b1bc]/45 bg-[#0b0f19]/95 backdrop-blur-xl p-4 shadow-[0_0_30px_rgba(166,177,188,0.25)]">
        <div className="flex items-start gap-3">
          <span className="shrink-0 w-9 h-9 rounded-xl inline-flex items-center justify-center bg-[#a6b1bc]/15 border border-[#a6b1bc]/40"><Sparkles className="w-5 h-5 text-[#a6b1bc]" /></span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-cyber font-black text-white text-sm uppercase tracking-wide">{s.title}</h3>
              <div className="flex items-center gap-1">
                <button data-testid="sitor-tour-mute" onClick={toggleMute} title={muted ? "Voce off" : "Voce on"} className="text-[#8a97a6] active:scale-90 p-1">{muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}</button>
                <button data-testid="sitor-tour-close" onClick={finish} className="text-[#8a97a6] active:scale-90 p-1"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <p className="text-[13px] text-[#c7d2dc] leading-relaxed mt-1">{s.body}</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-3">
          {STEPS.map((_, i) => (
            <span key={i} data-testid={`sitor-tour-dot-${i}`} className="rounded-full transition-all" style={{ width: i === step ? 18 : 6, height: 6, background: i === step ? "#a6b1bc" : "#334155" }} />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 mt-3">
          <button data-testid="sitor-tour-skip" onClick={finish} className="text-[11px] font-bold text-[#64748b] hover:text-[#8a97a6]">{tri("Salta il tour", "Tour überspringen", "Skip tour", "Saltar", "Passer", "رد کردن")}</button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button data-testid="sitor-tour-prev" onClick={() => goTo(step - 1)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#334155] text-[#9aa6b2] text-xs font-bold active:scale-95"><ChevronLeft className="w-3.5 h-3.5" /> {tri("Indietro", "Zurück", "Back", "Atrás", "Retour", "قبلی")}</button>
            )}
            {last ? (
              <button data-testid="sitor-tour-finish" onClick={finish} className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg font-black text-xs text-[#060A10] active:scale-95" style={{ background: "linear-gradient(90deg,#a6b1bc,#8a97a6)" }}>{tri("Ho capito!", "Verstanden!", "Got it!", "¡Entendido!", "Compris !", "متوجه شدم!")}</button>
            ) : (
              <button data-testid="sitor-tour-next" onClick={() => goTo(step + 1)} className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg font-black text-xs text-[#060A10] active:scale-95" style={{ background: "linear-gradient(90deg,#a6b1bc,#8a97a6)" }}>{tri("Avanti", "Weiter", "Next", "Siguiente", "Suivant", "بعدی")} <ChevronRight className="w-3.5 h-3.5" /></button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
