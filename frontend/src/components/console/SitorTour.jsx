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
    { group: null, title: tri("Ciao, sono Sitor", "Hallo, ich bin Sitor", "Hi, I'm Sitor", "Hola, soy Sitor", "Salut, je suis Sitor", "سلام، من سیتور هستم"),
      body: tri("Ti presento la console in meno di un minuto: dove si trova ogni funzione del laboratorio.", "Ich stelle dir die Konsole in unter einer Minute vor.", "Let me introduce the console in under a minute: where each function of the lab lives.", "Te presento la consola en menos de un minuto.", "Je te présente la console en moins d'une minute.", "کنسول را در کمتر از یک دقیقه معرفی می‌کنم.") },
    { group: "produzione", title: tri("1 · Produzione", "1 · Produktion", "1 · Production", "1 · Producción", "1 · Production", "۱ · تولید"),
      body: tri("Qui decidi cosa e quanto produrre. Inserisci gli ordini e ottieni il piano del giorno e della settimana.", "Hier legst du fest, was und wie viel produziert wird.", "Here you decide what and how much to produce. Enter the orders and get the day and week plan.", "Aquí decides qué y cuánto producir y obtienes el plan.", "Ici tu décides quoi et combien produire et tu obtiens le plan.", "اینجا تصمیم می‌گیری چه و چقدر تولید شود.") },
    { group: "ricette", title: tri("2 · Ricette & Magazzino", "2 · Rezepte & Lager", "2 · Recipes & Warehouse", "2 · Recetas", "2 · Recettes", "۲ · دستورها"),
      body: tri("Per un ordine non previsto: aggiungilo qui e il piano viene ricalcolato automaticamente.", "Ungeplanter Auftrag? Der Plan wird automatisch neu berechnet.", "For an unexpected order: add it here and the plan is recalculated automatically.", "¿Pedido imprevisto? El plan se recalcula solo.", "Commande imprévue ? Le plan est recalculé automatiquement.", "سفارش پیش‌بینی‌نشده؟ برنامه خودکار بازمحاسبه می‌شود.") },
    { group: "squadra", title: tri("3 · Ruoli & Turni", "3 · Rollen & Schichten", "3 · Roles & Shifts", "3 · Roles & Turnos", "3 · Rôles & Services", "۳ · نقش‌ها و شیفت‌ها"),
      body: tri("Qui organizzi le persone: assegni ogni operaio a un reparto con il suo compito. All'apertura del turno la squadra viene annunciata a voce.", "Hier organisierst du die Mitarbeiter und Bereiche.", "Here you organise people: assign each operator to a department with a task. At shift start the team is announced by voice.", "Aquí organizas a las personas y los turnos.", "Ici tu organises les personnes et les services.", "اینجا افراد و شیفت‌ها را سازمان می‌دهی.") },
    { group: "celle", title: tri("4 · Celle & Forni", "4 · Kammern & Öfen", "4 · Cells & Ovens", "4 · Cámaras & Hornos", "4 · Cellules & Fours", "۴ · سلول‌ها و فرها"),
      body: tri("La cassetta degli attrezzi: ricette, magazzino, celle e freezer, qualità, report e sicurezza.", "Der Werkzeugkasten: Rezepte, Lager, Kammern, Qualität, Berichte.", "The toolbox: recipes, warehouse, cells and freezer, quality, reports and security.", "La caja de herramientas: recetas, almacén, cámaras, calidad, informes.", "La boîte à outils : recettes, entrepôt, cellules, qualité, rapports.", "جعبه‌ابزار: دستورها، انبار، سلول‌ها، کیفیت و گزارش.") },
    { group: "sicurezza", title: tri("5 · Sicurezza & Report", "5 · Sicherheit & Berichte", "5 · Security & Reports", "5 · Seguridad", "5 · Sécurité", "۵ · امنیت"),
      body: tri("È il canale per comunicare con me: scrivi o detta, allega una foto o un ordine, e ricevi risposta, pianificazione e avvisi.", "Der Kanal für die Kommunikation mit mir: schreiben, diktieren, Foto anhängen.", "The channel to communicate with me: write or dictate, attach a photo or an order, and get answers, planning and alerts.", "El canal para comunicarte conmigo: escribe o dicta y recibe respuesta.", "Le canal pour communiquer avec moi : écris ou dicte et reçois une réponse.", "کانال ارتباط با من: بنویس یا بگو و پاسخ بگیر.") },
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
              <button data-testid="sitor-tour-finish" onClick={finish} className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg font-black text-xs text-[#060A10] active:scale-95" style={{ background: "linear-gradient(90deg,#a6b1bc,#8a97a6)" }}>{tri("Ho capito", "Verstanden", "Understood", "Entendido", "Compris", "متوجه شدم")}</button>
            ) : (
              <button data-testid="sitor-tour-next" onClick={() => goTo(step + 1)} className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg font-black text-xs text-[#060A10] active:scale-95" style={{ background: "linear-gradient(90deg,#a6b1bc,#8a97a6)" }}>{tri("Avanti", "Weiter", "Next", "Siguiente", "Suivant", "بعدی")} <ChevronRight className="w-3.5 h-3.5" /></button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
