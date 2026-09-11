import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles, Volume2, VolumeX } from "lucide-react";
import { playTTS, stopTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const DONE_KEY = "mikilab_sitor_tour_done";

// Tour guidato vocale di Sitor: al primo accesso del Capo spiega ogni area della console.
export default function SitorTour() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);

  const STEPS = [
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
    }
    setStep(i);
    speak(i);
  }, [speak]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = useCallback(() => { setOpen(true); goTo(0); }, [goTo]);

  const finish = useCallback(() => {
    stopTTS(); setOpen(false);
    try { localStorage.setItem(DONE_KEY, "1"); } catch { /* */ }
  }, []);

  // Auto-avvio una sola volta + ascolto evento di riavvio manuale.
  useEffect(() => {
    let seen = true; try { seen = localStorage.getItem(DONE_KEY) === "1"; } catch { /* */ }
    if (!seen) { const t = setTimeout(start, 900); return () => clearTimeout(t); }
  }, [start]);
  useEffect(() => {
    const h = () => start();
    window.addEventListener("mikilab:start-tour", h);
    return () => window.removeEventListener("mikilab:start-tour", h);
  }, [start]);

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
