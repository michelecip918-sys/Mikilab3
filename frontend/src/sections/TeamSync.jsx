import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Headphones, Radio, Mic, CheckCircle2, ThermometerSun, Calculator } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { playTTS } from "@/lib/tts";

// "Team Sync Auricolari" — coordinamento squadra multi-reparto (impasti/banco/forni) a mani libere.
// Voce nativa del telefono (zero crediti). Fedele al mockup dell'utente (dark + arancione + verde).
const D = { bg: "#121212", card: "#1E1E1E", input: "#151515", accent: "#FF6B00", green: "#00FF66", red: "#FF3333", amber: "#FF9900", text: "#FFFFFF", muted: "#A0A0A0", border: "#333333" };

const BASE = { farina: 10, acqua: 6.5, lievito: 0.2, sale: 0.22 };

export default function TeamSync({ open, onClose }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const persona = (() => { try { return localStorage.getItem("mikilab_voice_persona") || "michele"; } catch { return "michele"; } })();
  const speak = (t) => playTTS(t, { lang, voice: persona });

  const REPARTI = [
    { id: "impasti", label: tri("IMPASTI / VASCHE", "TEIGE / BOTTICHE", "MIXING / VATS", "MASAS / CUBAS", "PÉTRINS / CUVES", "خمیر") },
    { id: "banco", label: tri("BANCO / SPEZZATURA", "TISCH / TEILEN", "BENCH / DIVIDING", "BANCO / DIVISIÓN", "BANC / DÉTAILLAGE", "میز") },
    { id: "forni", label: tri("FORNI / INFORNATA", "ÖFEN / BACKEN", "OVENS / BAKING", "HORNOS / HORNEADO", "FOURS / ENFOURNEMENT", "فرها") },
  ];
  const TASKS = [
    { id: 1, tempo: "03:30", azione: tri("Versare acqua e farina per l'autolisi (Pane Matera)", "Wasser und Mehl für die Autolyse einfüllen", "Pour water and flour for autolyse (Matera bread)", "Verter agua y harina para la autólisis", "Verser eau et farine pour l'autolyse", "آب و آرد را برای اتولیز بریز"), vasca: tri("Vasca 1", "Bottich 1", "Vat 1", "Cuba 1", "Cuve 1", "مخزن ۱"), reparto: "impasti" },
    { id: 2, tempo: "03:45", azione: tri("Aggiungere il lievito e avviare la 2ª velocità", "Hefe zugeben und 2. Gang starten", "Add yeast and start 2nd speed", "Añadir levadura y arrancar 2ª velocidad", "Ajouter la levure et lancer la 2e vitesse", "مخمر اضافه کن و سرعت دوم"), vasca: tri("Vasca 1", "Bottich 1", "Vat 1", "Cuba 1", "Cuve 1", "مخزن ۱"), reparto: "impasti" },
    { id: 3, tempo: "04:10", azione: tri("Trasferire l'impasto sul Banco 2 per la spezzatura", "Teig auf Tisch 2 zum Teilen bringen", "Move dough to Bench 2 for dividing", "Pasar la masa al Banco 2 para dividir", "Transférer la pâte au Banc 2", "خمیر را به میز ۲ ببر"), vasca: tri("Banco 2", "Tisch 2", "Bench 2", "Banco 2", "Banc 2", "میز ۲"), reparto: "banco" },
    { id: 4, tempo: "04:40", azione: tri("Accendere il Forno 1 a 240°C con vapore", "Ofen 1 auf 240°C mit Dampf", "Turn on Oven 1 at 240°C with steam", "Encender Horno 1 a 240°C con vapor", "Allumer le Four 1 à 240°C avec vapeur", "فر ۱ را روی ۲۴۰ روشن کن"), vasca: tri("Forno 1", "Ofen 1", "Oven 1", "Horno 1", "Four 1", "فر ۱"), reparto: "forni" },
  ];

  const [operatore, setOperatore] = useState(() => { try { return localStorage.getItem("mikilab_operatore") || "Marco"; } catch { return "Marco"; } });
  const [reparto, setReparto] = useState("impasti");
  const [idx, setIdx] = useState(0);
  const [intercom, setIntercom] = useState(false);
  const [temp, setTemp] = useState(24);
  const [sos, setSos] = useState("");
  const [kg, setKg] = useState(25);
  const [dosi, setDosi] = useState(null);

  useEffect(() => { try { localStorage.setItem("mikilab_operatore", operatore); } catch { /* */ } }, [operatore]);
  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  const task = TASKS[idx];
  const repLabel = (id) => REPARTI.find((r) => r.id === id)?.label || id;

  const askWhatNext = () => {
    if (!task) { speak(tri("Tutti i compiti di squadra sono completati.", "Alle Team-Aufgaben erledigt.", "All team tasks are complete.", "Todas las tareas completadas.", "Toutes les tâches sont terminées.", "همه کارها تمام شد.")); return; }
    if (task.reparto === reparto) speak(tri(`${operatore}, il tuo compito: ${task.azione}, su ${task.vasca}.`, `${operatore}, deine Aufgabe: ${task.azione}, ${task.vasca}.`, `${operatore}, your task: ${task.azione}, at ${task.vasca}.`, `${operatore}, tu tarea: ${task.azione}.`, `${operatore}, ta tâche : ${task.azione}.`, `${operatore}: ${task.azione}.`));
    else speak(tri(`Il tuo reparto è in attesa. Ora il lavoro è al reparto ${task.reparto}.`, `Dein Bereich wartet. Aktuell arbeitet ${task.reparto}.`, `Your department waits. Work is now at ${task.reparto}.`, `Tu área espera. Ahora trabaja ${task.reparto}.`, `Ton secteur attend. Le travail est à ${task.reparto}.`, `بخش تو منتظر است.`));
  };

  const confirmTask = () => {
    if (idx + 1 < TASKS.length) {
      const n = idx + 1; setIdx(n);
      const nt = TASKS[n];
      speak(tri("Compito completato.", "Aufgabe erledigt.", "Task done.", "Tarea hecha.", "Tâche faite.", "کار تمام شد.") + (nt.reparto === reparto ? " " + tri(`Prossimo: ${nt.azione}.`, `Nächste: ${nt.azione}.`, `Next: ${nt.azione}.`, `Siguiente: ${nt.azione}.`, `Suivant : ${nt.azione}.`, `بعدی: ${nt.azione}.`) : ""));
    } else {
      speak(tri("Turno completato con successo da tutta la squadra!", "Schicht vom ganzen Team erfolgreich beendet!", "Shift completed by the whole team!", "¡Turno completado por todo el equipo!", "Poste terminé par toute l'équipe !", "شیفت با موفقیت تمام شد!"));
    }
  };

  const handleSOS = (p) => {
    let s = "";
    if (p === "scalda") s = tri(`Impasto caldo (${temp}°C): ferma la vasca 5 minuti, aggiungi 3% di acqua ghiacciata sul fondo e passa in 1ª velocità.`, `Teig heiß (${temp}°C): Bottich 5 Min stoppen, 3% Eiswasser zugeben, 1. Gang.`, `Dough hot (${temp}°C): stop the vat 5 min, add 3% iced water, go to 1st speed.`, `Masa caliente (${temp}°C): para 5 min, añade 3% de agua helada, 1ª velocidad.`, `Pâte chaude (${temp}°C) : arrête 5 min, ajoute 3% d'eau glacée, 1re vitesse.`, `خمیر داغ: مخزن را ۵ دقیقه متوقف کن.`);
    else if (p === "strappa") s = tri("La maglia glutinica strappa: riduci la velocità, 10 minuti di riposo in vasca e aggiungi acqua a filo.", "Glutennetz reißt: Tempo senken, 10 Min Ruhe, Wasser langsam zugeben.", "Gluten tearing: reduce speed, 10 min rest, add water slowly.", "El gluten se rompe: baja la velocidad, 10 min de reposo, agua a hilo.", "Le gluten déchire : réduis la vitesse, 10 min de repos, eau en filet.", "شبکه گلوتن پاره می‌شود: سرعت را کم کن.");
    else s = tri("L'impasto incolla e non incorda: aumenta la ventilazione sul banco e spolvera con semola rimacinata.", "Teig klebt: mehr Belüftung am Tisch, mit Hartweizengrieß bestäuben.", "Dough sticks: more airflow on the bench, dust with semola.", "La masa pega: más ventilación en el banco, espolvorea sémola.", "La pâte colle : plus d'air au banc, saupoudre de semoule.", "خمیر می‌چسبد: تهویه میز را زیاد کن.");
    setSos(s); speak(s);
  };

  const calcolaDosi = () => {
    const f = kg / BASE.farina;
    const r = { farina: kg, acqua: (BASE.acqua * f).toFixed(1), lievito: (BASE.lievito * f).toFixed(2), sale: (BASE.sale * f).toFixed(2) };
    setDosi(r);
    speak(tri(`Per ${kg} kg farina: acqua ${r.acqua} litri, lievito ${Math.round(r.lievito * 1000)} grammi, sale ${Math.round(r.sale * 1000)} grammi.`, `Für ${kg} kg Mehl: Wasser ${r.acqua} L, Hefe ${Math.round(r.lievito * 1000)} g, Salz ${Math.round(r.sale * 1000)} g.`, `For ${kg} kg flour: water ${r.acqua} L, yeast ${Math.round(r.lievito * 1000)} g, salt ${Math.round(r.sale * 1000)} g.`, `Para ${kg} kg harina: agua ${r.acqua} L, levadura ${Math.round(r.lievito * 1000)} g, sal ${Math.round(r.sale * 1000)} g.`, `Pour ${kg} kg farine : eau ${r.acqua} L, levure ${Math.round(r.lievito * 1000)} g, sel ${Math.round(r.sale * 1000)} g.`, `برای ${kg} کیلو آرد: آب ${r.acqua} لیتر.`));
  };

  const interfono = (msg) => {
    setIntercom(true);
    speak(tri(`Messaggio radio da ${operatore}: ${msg}`, `Funkspruch von ${operatore}: ${msg}`, `Radio message from ${operatore}: ${msg}`, `Mensaje de ${operatore}: ${msg}`, `Message radio de ${operatore} : ${msg}`, `پیام از ${operatore}: ${msg}`));
    setTimeout(() => setIntercom(false), 4000);
  };

  if (!open) return null;
  const inputSty = { background: D.input, border: `1px solid ${D.border}`, color: D.text };

  return createPortal(
    <div data-testid="team-sync" className="fixed inset-0 z-[900] overflow-y-auto" style={{ background: D.bg, color: D.text }}>
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3" style={{ background: D.card, borderBottom: `2px solid ${D.accent}` }}>
        <h1 className="flex items-center gap-2 font-extrabold text-[16px]" style={{ color: D.accent }}>
          <Headphones className="w-5 h-5" /> MikiLab <span className="text-[12px]" style={{ color: D.text }}>| {tri("Team Auricolari", "Team-Headsets", "Team Headsets", "Auriculares Equipo", "Casques Équipe", "هدست تیم")}</span>
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold" style={{ color: intercom ? D.green : D.muted }}>{intercom ? tri("🔴 INTERFONO LIVE", "🔴 GEGENSPRECHEN", "🔴 INTERCOM LIVE", "🔴 INTERCOM", "🔴 INTERPHONE", "🔴 زنده") : tri("● CUFFIA PRONTA", "● HEADSET BEREIT", "● HEADSET READY", "● LISTO", "● PRÊT", "● آماده")}</span>
          <button data-testid="team-close" onClick={onClose} className="w-9 h-9 rounded-lg flex items-center justify-center active:scale-95" style={{ background: D.input, border: `1px solid ${D.border}` }}><X className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-24">
        {/* Operatore & reparto */}
        <div className="rounded-xl p-4 grid grid-cols-2 gap-3" style={{ background: D.card, border: `1px solid ${D.border}` }}>
          <div>
            <label className="text-[11px]" style={{ color: D.muted }}>{tri("Operatore", "Bediener", "Operator", "Operador", "Opérateur", "اپراتور")}</label>
            <input data-testid="team-operatore" value={operatore} onChange={(e) => setOperatore(e.target.value)} className="w-full rounded-md px-3 py-2 mt-1 font-bold outline-none" style={inputSty} />
          </div>
          <div>
            <label className="text-[11px]" style={{ color: D.muted }}>{tri("Reparto cuffia", "Bereich", "Headset dept.", "Departamento", "Secteur", "بخش")}</label>
            <select data-testid="team-reparto" value={reparto} onChange={(e) => setReparto(e.target.value)} className="w-full rounded-md px-3 py-2 mt-1 font-bold outline-none" style={{ background: D.input, border: `1px solid ${D.accent}`, color: D.accent }}>
              {REPARTI.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
        </div>

        {/* Compito attuale */}
        <div className="rounded-xl p-4" style={{ background: D.card, border: `1px solid ${D.accent}` }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] font-bold" style={{ color: D.accent }}>{tri("SEQUENZA · REPARTO", "SEQUENZ · BEREICH", "SEQUENCE · DEPT", "SECUENCIA · ÁREA", "SÉQUENCE · SECTEUR", "توالی · بخش")} {task ? repLabel(task.reparto) : "—"}</span>
            <span className="text-[12px]" style={{ color: D.muted }}>{task ? task.tempo : "—"}</span>
          </div>
          <div className="text-[16px] font-bold mb-3" data-testid="team-task">{task ? task.azione : tri("Turno completato", "Schicht fertig", "Shift complete", "Turno completo", "Poste terminé", "شیفت تمام")} {task && <span style={{ color: D.green }}>({task.vasca})</span>}</div>
          <div className="grid grid-cols-2 gap-2.5">
            <button data-testid="team-ask" onClick={askWhatNext} className="rounded-lg py-3 font-bold text-white flex items-center justify-center gap-1.5 active:scale-97" style={{ background: D.accent }}><Mic className="w-4 h-4" /> {tri("Cosa faccio ora?", "Was mache ich?", "What now?", "¿Qué hago?", "Quoi faire ?", "الان چه کنم؟")}</button>
            <button data-testid="team-confirm" onClick={confirmTask} className="rounded-lg py-3 font-bold flex items-center justify-center gap-1.5 active:scale-97" style={{ background: D.green, color: "#000" }}><CheckCircle2 className="w-4 h-4" /> {tri("TAP CUFFIA ✓", "HEADSET TAP ✓", "HEADSET TAP ✓", "TAP ✓", "TAP ✓", "ضربه ✓")}</button>
          </div>
        </div>

        {/* SOS impasto + temp */}
        <div className="rounded-xl p-4" style={{ background: D.card, border: `1px solid ${D.border}` }}>
          <h3 className="flex items-center gap-2 font-bold text-[15px] mb-2" style={{ color: D.accent }}><ThermometerSun className="w-4 h-4" /> {tri("SOS Impasto & Temp. Vasca", "SOS Teig & Bottich-Temp.", "Dough SOS & Vat Temp.", "SOS Masa y Temp.", "SOS Pâte & Temp.", "SOS خمیر و دما")}</h3>
          <div className="flex items-center gap-2 mb-3">
            <label className="text-[12px]" style={{ color: D.muted }}>{tri("Temp. rilevata °C", "Gemessene Temp. °C", "Measured temp °C", "Temp. medida °C", "Temp. mesurée °C", "دمای اندازه‌گیری")}</label>
            <input data-testid="team-temp" type="number" value={temp} onChange={(e) => setTemp(parseInt(e.target.value) || 0)} className="w-16 text-center rounded-md px-2 py-1.5 font-bold outline-none" style={inputSty} />
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button data-testid="team-sos-scalda" onClick={() => handleSOS("scalda")} className="rounded-md py-2.5 text-[12px] font-bold" style={{ background: D.input, border: `1px solid ${D.red}`, color: D.text }}>🔥 {tri("Scalda", "Heiß", "Hot", "Caliente", "Chaud", "داغ")} ({temp}°)</button>
            <button data-testid="team-sos-strappa" onClick={() => handleSOS("strappa")} className="rounded-md py-2.5 text-[12px] font-bold" style={{ background: D.input, border: `1px solid ${D.amber}`, color: D.text }}>⚡ {tri("Strappa", "Reißt", "Tears", "Rompe", "Déchire", "پاره")}</button>
            <button data-testid="team-sos-incolla" onClick={() => handleSOS("incolla")} className="rounded-md py-2.5 text-[12px] font-bold" style={{ background: D.input, border: "1px solid #FFFF00", color: D.text }}>💧 {tri("Incolla", "Klebt", "Sticky", "Pega", "Colle", "می‌چسبد")}</button>
          </div>
          {sos && <div data-testid="team-sos-result" className="rounded-md p-3 text-[14px]" style={{ background: D.input, borderLeft: `3px solid ${D.green}`, color: "#DDD" }}>{sos}</div>}
        </div>

        {/* Ricalcolo dosi */}
        <div className="rounded-xl p-4" style={{ background: D.card, border: `1px solid ${D.border}` }}>
          <h3 className="flex items-center gap-2 font-bold text-[15px] mb-3" style={{ color: D.accent }}><Calculator className="w-4 h-4" /> {tri("Ricalcolo Dosi al Volo", "Mengen sofort neu", "Instant Dose Recalc", "Recalcular Dosis", "Recalcul des Doses", "بازمحاسبه مقدار")}</h3>
          <div className="flex items-center gap-2 mb-3">
            <input data-testid="team-kg" type="number" value={kg} onChange={(e) => setKg(parseInt(e.target.value) || 0)} className="w-20 text-center rounded-md px-2 py-2 font-bold outline-none" style={{ background: D.input, border: `1px solid ${D.accent}`, color: D.text }} />
            <span className="text-[14px]">{tri("kg Farina", "kg Mehl", "kg Flour", "kg Harina", "kg Farine", "کیلو آرد")}</span>
            <button data-testid="team-calc" onClick={calcolaDosi} className="ml-auto rounded-md px-4 py-2 font-bold active:scale-97" style={{ background: D.input, border: `1px solid ${D.green}`, color: D.green }}>{tri("CALCOLA E DETTA", "BERECHNEN & DIKTIEREN", "CALC & DICTATE", "CALCULAR Y DICTAR", "CALCULER & DICTER", "محاسبه و اعلام")}</button>
          </div>
          {dosi && (
            <div data-testid="team-dosi-result" className="grid grid-cols-3 gap-2 rounded-lg p-3 text-center" style={{ background: D.input }}>
              <div><span className="text-[11px]" style={{ color: D.muted }}>{tri("ACQUA", "WASSER", "WATER", "AGUA", "EAU", "آب")}</span><br /><strong className="text-[15px]">{dosi.acqua} L</strong></div>
              <div><span className="text-[11px]" style={{ color: D.muted }}>{tri("LIEVITO", "HEFE", "YEAST", "LEVADURA", "LEVURE", "مخمر")}</span><br /><strong className="text-[15px]">{Math.round(dosi.lievito * 1000)} g</strong></div>
              <div><span className="text-[11px]" style={{ color: D.muted }}>{tri("SALE", "SALZ", "SALT", "SAL", "SEL", "نمک")}</span><br /><strong className="text-[15px]">{Math.round(dosi.sale * 1000)} g</strong></div>
            </div>
          )}
        </div>

        {/* Interfono */}
        <div className="rounded-xl p-4" style={{ background: D.card, border: `1px solid ${D.border}` }}>
          <h3 className="flex items-center gap-2 font-bold text-[15px] mb-1" style={{ color: D.accent }}><Radio className="w-4 h-4" /> {tri("Interfono Squadra (Push-To-Talk)", "Team-Gegensprechen", "Team Intercom (Push-To-Talk)", "Intercom Equipo", "Interphone Équipe", "اینترکام تیم")}</h3>
          <p className="text-[11px] mb-3" style={{ color: D.muted }}>{tri("Annuncio vocale sul dispositivo. La radio reale tra auricolari richiede l'app installata (Bluetooth).", "Sprachansage am Gerät. Echtes Funk-Intercom braucht die installierte App.", "Voice announcement on device. Real headset radio needs the installed app.", "Aviso de voz en el dispositivo. La radio real necesita la app instalada.", "Annonce vocale sur l'appareil. La radio réelle nécessite l'app installée.", "اعلام صوتی روی دستگاه.")}</p>
          <div className="grid grid-cols-2 gap-2">
            <button data-testid="team-radio-spolvero" onClick={() => interfono(tri("Serve farina di spolvero al Banco 2.", "Streumehl am Tisch 2 nötig.", "Need dusting flour at Bench 2.", "Falta harina en Banco 2.", "Farine au Banc 2.", "آرد پاشیدنی میز ۲."))} className="rounded-md py-2.5 text-[12px] font-bold" style={{ background: D.input, border: `1px solid ${D.border}`, color: D.text }}>📢 {tri("Spolvero al banco", "Streumehl am Tisch", "Dusting at bench", "Harina al banco", "Farine au banc", "آرد به میز")}</button>
            <button data-testid="team-radio-forno" onClick={() => interfono(tri("Forno 1 pronto per infornare.", "Ofen 1 bereit zum Backen.", "Oven 1 ready to bake.", "Horno 1 listo.", "Four 1 prêt.", "فر ۱ آماده."))} className="rounded-md py-2.5 text-[12px] font-bold" style={{ background: D.input, border: `1px solid ${D.border}`, color: D.text }}>🔥 {tri("Forno 1 pronto", "Ofen 1 bereit", "Oven 1 ready", "Horno 1 listo", "Four 1 prêt", "فر ۱ آماده")}</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
