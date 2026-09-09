import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Headphones, Radio, Mic, CheckCircle2, ThermometerSun, Calculator, Eye, Camera } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { playTTS } from "@/lib/tts";

// "Team Sync Auricolari" — coordinamento squadra multi-reparto (impasti/banco/forni) a mani libere.
// Voce nativa del telefono (zero crediti). Fedele al mockup dell'utente (dark + arancione + verde).
const D = { bg: "#0A0B0E", card: "#12141D", input: "#161922", accent: "#D4AF37", green: "#FF9D42", red: "#FF3333", amber: "#FF9900", text: "#F0F0F0", muted: "#8A9BA8", border: "#2A2E3D" };

// Database ricette locale (offline) per il ricalcolo dosi dinamico.
const RECIPES = [
  { id: "pane_matera", nome: "Pane di Matera IGP", farina: 10, acqua: 6.8, lievito: 0.15, sale: 0.2, guida: "Doppiatura pasta, forma a cornetto alto e 3 tagli laterali a 45°." },
  { id: "brezel", nome: "Laugengebäck / Brezel", farina: 10, acqua: 5.0, lievito: 0.3, sale: 0.22, burro: 0.5, guida: "Nodo centrale a 2 incroci, braccia sottili e pancia spessa." },
  { id: "ciabatta", nome: "Ciabatta Alta Idratazione", farina: 10, acqua: 8.0, lievito: 0.2, sale: 0.22, guida: "Taglio netto senza schiacciare le bolle d'aria." },
];

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
  const [recipes, setRecipes] = useState(() => { try { const s = localStorage.getItem("mikilab_recipes_db"); return s ? JSON.parse(s) : RECIPES; } catch { return RECIPES; } });
  const [selRec, setSelRec] = useState(() => { try { return localStorage.getItem("mikilab_team_recipe") || "pane_matera"; } catch { return "pane_matera"; } });
  const [mode, setMode] = useState("solo");
  const [dosi, setDosi] = useState(null);
  const [roomT, setRoomT] = useState(24);
  const [flourT, setFlourT] = useState(20);
  const [coachType, setCoachType] = useState("formatura");
  const [coachMsg, setCoachMsg] = useState("");
  const [coachBusy, setCoachBusy] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [nr, setNr] = useState({ nome: "", farina: 10, acqua: 6.5, lievito: 0.2, sale: 0.22 });
  const [planEdits, setPlanEdits] = useState(() => { try { return JSON.parse(localStorage.getItem("mikilab_plan_edits") || "{}"); } catch { return {}; } });
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  useEffect(() => { try { localStorage.setItem("mikilab_team_recipe", selRec); } catch { /* */ } }, [selRec]);
  useEffect(() => { try { localStorage.setItem("mikilab_recipes_db", JSON.stringify(recipes)); } catch { /* */ } }, [recipes]);
  useEffect(() => { try { localStorage.setItem("mikilab_plan_edits", JSON.stringify(planEdits)); } catch { /* */ } }, [planEdits]);

  const addRecipe = () => {
    if (!nr.nome.trim()) return;
    const entry = { id: `rec_${Date.now()}`, nome: nr.nome.trim(), farina: Number(nr.farina) || 10, acqua: Number(nr.acqua) || 0, lievito: Number(nr.lievito) || 0, sale: Number(nr.sale) || 0 };
    setRecipes((p) => [...p, entry]); setSelRec(entry.id); setShowAdd(false);
    speak(tri(`Ricetta ${entry.nome} salvata nel database locale.`, `Rezept ${entry.nome} lokal gespeichert.`, `Recipe ${entry.nome} saved locally.`, `Receta ${entry.nome} guardada.`, `Recette ${entry.nome} enregistrée.`, `دستور ${entry.nome} ذخیره شد.`));
    setNr({ nome: "", farina: 10, acqua: 6.5, lievito: 0.2, sale: 0.22 });
  };
  const actionOf = (t) => (t ? (planEdits[t.id] || t.azione) : "");
  const saveEdit = () => { if (task) { setPlanEdits((p) => ({ ...p, [task.id]: editText })); setEditing(false); speak(tri("Piano aggiornato.", "Plan aktualisiert.", "Plan updated.", "Plan actualizado.", "Plan mis à jour.", "برنامه به‌روزرسانی شد.")); } };

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
    if (task.reparto === reparto) speak(tri(`${operatore}, il tuo compito: ${actionOf(task)}, su ${task.vasca}.`, `${operatore}, deine Aufgabe: ${actionOf(task)}, ${task.vasca}.`, `${operatore}, your task: ${actionOf(task)}, at ${task.vasca}.`, `${operatore}, tu tarea: ${actionOf(task)}.`, `${operatore}, ta tâche : ${actionOf(task)}.`, `${operatore}: ${actionOf(task)}.`));
    else speak(tri(`Il tuo reparto è in attesa. Ora il lavoro è al reparto ${task.reparto}.`, `Dein Bereich wartet. Aktuell arbeitet ${task.reparto}.`, `Your department waits. Work is now at ${task.reparto}.`, `Tu área espera. Ahora trabaja ${task.reparto}.`, `Ton secteur attend. Le travail est à ${task.reparto}.`, `بخش تو منتظر است.`));
  };

  const confirmTask = () => {
    if (idx + 1 < TASKS.length) {
      const n = idx + 1; setIdx(n);
      const nt = TASKS[n];
      speak(tri("Compito completato.", "Aufgabe erledigt.", "Task done.", "Tarea hecha.", "Tâche faite.", "کار تمام شد.") + (nt.reparto === reparto ? " " + tri(`Prossimo: ${actionOf(nt)}.`, `Nächste: ${actionOf(nt)}.`, `Next: ${actionOf(nt)}.`, `Siguiente: ${actionOf(nt)}.`, `Suivant : ${actionOf(nt)}.`, `بعدی: ${actionOf(nt)}.`) : ""));
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
    const rec = recipes.find((r) => r.id === selRec) || recipes[0];
    const f = kg / rec.farina;
    const wt = Math.max(2, (24 * 3) - (Number(roomT) + Number(flourT) + 9)).toFixed(1); // Formula 3T
    const r = { nome: rec.nome, acqua: (rec.acqua * f).toFixed(1), lievito: Math.round(rec.lievito * f * 1000), sale: Math.round(rec.sale * f * 1000), burro: rec.burro ? Math.round(rec.burro * f * 1000) : null, waterT: wt, guida: rec.guida || "" };
    setDosi(r);
    let msg = tri(`${rec.nome}, ${kg} kg farina: acqua ${r.acqua} litri, lievito ${r.lievito} grammi, sale ${r.sale} grammi.`, `${rec.nome}, ${kg} kg Mehl: Wasser ${r.acqua} L, Hefe ${r.lievito} g, Salz ${r.sale} g.`, `${rec.nome}, ${kg} kg flour: water ${r.acqua} L, yeast ${r.lievito} g, salt ${r.sale} g.`, `${rec.nome}, ${kg} kg harina: agua ${r.acqua} L, levadura ${r.lievito} g, sal ${r.sale} g.`, `${rec.nome}, ${kg} kg farine : eau ${r.acqua} L, levure ${r.lievito} g, sel ${r.sale} g.`, `${rec.nome}: آب ${r.acqua} لیتر.`);
    if (r.burro) msg += " " + tri(`Burro ${r.burro} grammi.`, `Butter ${r.burro} g.`, `Butter ${r.burro} g.`, `Mantequilla ${r.burro} g.`, `Beurre ${r.burro} g.`, `کره ${r.burro} گرم.`);
    msg += " " + tri(`Acqua a ${wt} gradi.`, `Wasser bei ${wt} Grad.`, `Water at ${wt} degrees.`, `Agua a ${wt} grados.`, `Eau à ${wt} degrés.`, `آب در ${wt} درجه.`);
    if (r.guida) msg += " " + r.guida;
    speak(msg);
  };

  const runCoach = async () => {
    const inp = document.getElementById("team-coach-file");
    if (inp) inp.click();
  };
  const onCoachFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setCoachBusy(true); setCoachMsg("");
    try {
      const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
      const resp = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/lab/vision-coach`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image_base64: b64, type: coachType, lang }) });
      if (!resp.ok) throw new Error("coach");
      const data = await resp.json();
      setCoachMsg(data.feedback || ""); if (data.feedback) speak(data.feedback);
    } catch {
      setCoachMsg(tri("Tutor AI non disponibile ora. Riprova.", "KI-Tutor nicht verfügbar.", "AI tutor unavailable now.", "Tutor AI no disponible.", "Tuteur IA indisponible.", "مربی هوش مصنوعی در دسترس نیست."));
    } finally { setCoachBusy(false); }
  };
  const coachChecklist = (t) => {
    const tips = t === "formatura"
      ? tri("Formatura: pirlatura con tensione uniforme, chiusura ben sigillata sotto, testa alta e simmetrica.", "Formen: gleichmäßige Spannung, Naht unten gut verschlossen, symmetrisch.", "Shaping: even tension, seam sealed underneath, symmetric high top.", "Formado: tensión uniforme, cierre sellado abajo, simétrico.", "Façonnage : tension uniforme, soudure dessous, symétrique.", "فرم‌دهی: کشش یکنواخت.")
      : tri("Incisione: lama a 45°, taglio deciso e superficiale (3-4 mm), un solo gesto continuo.", "Schnitt: Klinge 45°, entschlossen und flach (3-4 mm), eine Bewegung.", "Scoring: blade at 45°, decisive shallow cut (3-4 mm), one continuous move.", "Corte: cuchilla a 45°, decidido y superficial (3-4 mm), un gesto.", "Lame à 45°, coupe nette et peu profonde (3-4 mm), un geste.", "برش: تیغه ۴۵ درجه.");
    setCoachMsg(tips); speak(tips);
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
        {/* Modalità + operatore & reparto */}
        <div className="rounded-2xl shadow-md border border-amber-900/40 p-4 space-y-3" style={{ background: D.card, border: `1px solid ${D.border}` }}>
          <div className="grid grid-cols-2 gap-2">
            <button data-testid="team-mode-solo" onClick={() => setMode("solo")} className="rounded-md py-2 font-bold text-[13px]" style={{ background: mode === "solo" ? D.accent : "#222", color: "#fff" }}>👤 {tri("SOLO (Tuttofare)", "SOLO", "SOLO (All-round)", "SOLO", "SOLO", "تنها")}</button>
            <button data-testid="team-mode-team" onClick={() => setMode("team")} className="rounded-md py-2 font-bold text-[13px]" style={{ background: mode === "team" ? D.green : "#222", color: mode === "team" ? "#000" : "#fff" }}>👥 {tri("SQUADRA", "TEAM", "TEAM", "EQUIPO", "ÉQUIPE", "تیم")}</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px]" style={{ color: D.muted }}>{tri("Operatore", "Bediener", "Operator", "Operador", "Opérateur", "اپراتور")}</label>
              <input data-testid="team-operatore" value={operatore} onChange={(e) => setOperatore(e.target.value)} className="w-full rounded-md px-3 py-2 mt-1 font-bold outline-none" style={inputSty} />
            </div>
            {mode === "team" && (
              <div>
                <label className="text-[11px]" style={{ color: D.muted }}>{tri("Reparto cuffia", "Bereich", "Headset dept.", "Departamento", "Secteur", "بخش")}</label>
                <select data-testid="team-reparto" value={reparto} onChange={(e) => setReparto(e.target.value)} className="w-full rounded-md px-3 py-2 mt-1 font-bold outline-none" style={{ background: D.input, border: `1px solid ${D.accent}`, color: D.accent }}>
                  {REPARTI.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Compito attuale */}
        <div className="rounded-2xl shadow-md border border-amber-900/40 p-4" style={{ background: D.card, border: `1px solid ${D.accent}` }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] font-bold" style={{ color: D.accent }}>{tri("SEQUENZA · REPARTO", "SEQUENZ · BEREICH", "SEQUENCE · DEPT", "SECUENCIA · ÁREA", "SÉQUENCE · SECTEUR", "توالی · بخش")} {task ? repLabel(task.reparto) : "—"}</span>
            <span className="text-[12px]" style={{ color: D.muted }}>{task ? task.tempo : "—"}</span>
          </div>
          <div className="text-[16px] font-bold mb-3 flex items-start justify-between gap-2" data-testid="team-task">
            {editing ? (
              <div className="flex-1 flex gap-2">
                <input data-testid="team-task-edit" value={editText} onChange={(e) => setEditText(e.target.value)} className="flex-1 rounded-md px-2 py-1.5 text-[14px] outline-none" style={{ background: D.input, border: `1px solid ${D.green}`, color: D.text }} />
                <button data-testid="team-task-save" onClick={saveEdit} className="rounded-md px-3 font-bold text-[12px]" style={{ background: D.green, color: "#000" }}>{tri("SALVA", "SPEICH.", "SAVE", "GUARDAR", "OK", "ذخیره")}</button>
              </div>
            ) : (
              <>
                <span>{task ? actionOf(task) : tri("Turno completato", "Schicht fertig", "Shift complete", "Turno completo", "Poste terminé", "شیفت تمام")} {task && <span style={{ color: D.green }}>({task.vasca})</span>}</span>
                {task && <button data-testid="team-task-editbtn" onClick={() => { setEditText(actionOf(task)); setEditing(true); }} className="text-[11px] px-2 py-1 rounded-md shrink-0" style={{ background: "#333", color: D.muted }}>✏️</button>}
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button data-testid="team-ask" onClick={askWhatNext} className="rounded-lg py-3 font-bold text-white flex items-center justify-center gap-1.5 active:scale-97" style={{ background: D.accent }}><Mic className="w-4 h-4" /> {tri("Cosa faccio ora?", "Was mache ich?", "What now?", "¿Qué hago?", "Quoi faire ?", "الان چه کنم؟")}</button>
            <button data-testid="team-confirm" onClick={confirmTask} className="rounded-lg py-3 font-bold flex items-center justify-center gap-1.5 active:scale-97" style={{ background: D.green, color: "#000" }}><CheckCircle2 className="w-4 h-4" /> {tri("TAP CUFFIA ✓", "HEADSET TAP ✓", "HEADSET TAP ✓", "TAP ✓", "TAP ✓", "ضربه ✓")}</button>
          </div>
        </div>

        {/* SOS impasto + temp */}
        <div className="rounded-2xl shadow-md border border-amber-900/40 p-4" style={{ background: D.card, border: `1px solid ${D.border}` }}>
          <h3 className="flex items-center gap-2 font-bold text-[15px] mb-2" style={{ color: D.accent }}><ThermometerSun className="w-4 h-4" /> {tri("SOS Impasto & Temp. Vasca", "SOS Teig & Bottich-Temp.", "Dough SOS & Vat Temp.", "SOS Masa y Temp.", "SOS Pâte & Temp.", "SOS خمیر و دما")}</h3>
          <div className="flex items-center gap-2 mb-3">
            <label className="text-[12px]" style={{ color: D.muted }}>{tri("Temp. rilevata °C", "Gemessene Temp. °C", "Measured temp °C", "Temp. medida °C", "Temp. mesurée °C", "دمای اندازه‌گیری")}</label>
            <input data-testid="team-temp" type="number" value={temp} onChange={(e) => setTemp(parseInt(e.target.value) || 0)} className="w-16 text-center rounded-md px-2 py-1.5 font-bold outline-none" style={inputSty} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
            <button data-testid="team-sos-scalda" onClick={() => handleSOS("scalda")} className="rounded-md py-2.5 text-[12px] font-bold" style={{ background: D.input, border: `1px solid ${D.red}`, color: D.text }}>🔥 {tri("Scalda", "Heiß", "Hot", "Caliente", "Chaud", "داغ")} ({temp}°)</button>
            <button data-testid="team-sos-strappa" onClick={() => handleSOS("strappa")} className="rounded-md py-2.5 text-[12px] font-bold" style={{ background: D.input, border: `1px solid ${D.amber}`, color: D.text }}>⚡ {tri("Strappa", "Reißt", "Tears", "Rompe", "Déchire", "پاره")}</button>
            <button data-testid="team-sos-incolla" onClick={() => handleSOS("incolla")} className="rounded-md py-2.5 text-[12px] font-bold" style={{ background: D.input, border: "1px solid #FFFF00", color: D.text }}>💧 {tri("Incolla", "Klebt", "Sticky", "Pega", "Colle", "می‌چسبد")}</button>
          </div>
          {sos && <div data-testid="team-sos-result" className="rounded-md p-3 text-[14px]" style={{ background: D.input, borderLeft: `3px solid ${D.green}`, color: "#DDD" }}>{sos}</div>}
        </div>

        {/* Ricalcolo dosi */}
        <div className="rounded-2xl shadow-md border border-amber-900/40 p-4" style={{ background: D.card, border: `1px solid ${D.border}` }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="flex items-center gap-2 font-bold text-[15px]" style={{ color: D.accent }}><Calculator className="w-4 h-4" /> {tri("Database Ricette (illimitate)", "Rezept-DB (unbegrenzt)", "Recipe DB (unlimited)", "BD Recetas (ilimitadas)", "BD Recettes", "پایگاه دستورها")}</h3>
            <button data-testid="team-recipe-add-toggle" onClick={() => setShowAdd((v) => !v)} className="text-[11px] px-2 py-1 rounded-md font-bold" style={{ background: "#222", color: D.green, border: `1px solid ${D.green}` }}>{showAdd ? tri("❌ Chiudi", "❌ Zu", "❌ Close", "❌ Cerrar", "❌ Fermer", "❌ بستن") : tri("➕ Nuova", "➕ Neu", "➕ New", "➕ Nueva", "➕ Nouv.", "➕ جدید")}</button>
          </div>
          {showAdd && (
            <div data-testid="team-recipe-form" className="rounded-md p-2.5 mb-2 space-y-2" style={{ background: D.input, border: `1px solid ${D.green}` }}>
              <input data-testid="team-nr-nome" value={nr.nome} onChange={(e) => setNr({ ...nr, nome: e.target.value })} placeholder={tri("Nome impasto", "Teigname", "Dough name", "Nombre masa", "Nom pâte", "نام خمیر")} className="w-full rounded px-2 py-1.5 text-[13px] outline-none" style={{ background: D.card, border: `1px solid ${D.border}`, color: D.text }} />
              <div className="grid grid-cols-4 gap-1.5 text-[11px]" style={{ color: D.muted }}>
                {[["farina", tri("Farina", "Mehl", "Flour", "Harina", "Farine", "آرد")], ["acqua", tri("Acqua", "Wasser", "Water", "Agua", "Eau", "آب")], ["lievito", tri("Lievito", "Hefe", "Yeast", "Levad.", "Levure", "مخمر")], ["sale", tri("Sale", "Salz", "Salt", "Sal", "Sel", "نمک")]].map(([k, lab]) => (
                  <div key={k}>{lab}<input data-testid={`team-nr-${k}`} type="number" step="0.01" value={nr[k]} onChange={(e) => setNr({ ...nr, [k]: e.target.value })} className="w-full rounded px-1 py-1 mt-0.5 outline-none" style={{ background: D.card, border: `1px solid ${D.border}`, color: D.text }} /></div>
                ))}
              </div>
              <button data-testid="team-nr-save" onClick={addRecipe} className="w-full rounded py-2 font-bold text-[13px]" style={{ background: D.green, color: "#000" }}>{tri("SALVA IN DATABASE", "IN DB SPEICHERN", "SAVE TO DATABASE", "GUARDAR EN BD", "ENREGISTRER", "ذخیره در پایگاه")}</button>
            </div>
          )}
          <select data-testid="team-recipe" value={selRec} onChange={(e) => setSelRec(e.target.value)} className="w-full rounded-md px-3 py-2 mb-2 font-bold outline-none" style={{ background: D.input, border: `1px solid ${D.border}`, color: D.text }}>
            {recipes.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-[11px]" style={{ color: D.muted }}>{tri("Temp. Ambiente °C", "Raumtemp. °C", "Room temp °C", "Temp. ambiente °C", "Temp. ambiante °C", "دمای محیط")}</label>
              <input data-testid="team-roomt" type="number" value={roomT} onChange={(e) => setRoomT(Number(e.target.value))} className="w-full rounded-md px-3 py-2 mt-1 outline-none" style={{ background: D.input, border: `1px solid ${D.border}`, color: D.text }} />
            </div>
            <div>
              <label className="text-[11px]" style={{ color: D.muted }}>{tri("Temp. Farina °C", "Mehltemp. °C", "Flour temp °C", "Temp. harina °C", "Temp. farine °C", "دمای آرد")}</label>
              <input data-testid="team-flourt" type="number" value={flourT} onChange={(e) => setFlourT(Number(e.target.value))} className="w-full rounded-md px-3 py-2 mt-1 outline-none" style={{ background: D.input, border: `1px solid ${D.border}`, color: D.text }} />
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <input data-testid="team-kg" type="number" value={kg} onChange={(e) => setKg(parseInt(e.target.value) || 0)} className="w-20 text-center rounded-md px-2 py-2 font-bold outline-none" style={{ background: D.input, border: `1px solid ${D.accent}`, color: D.text }} />
            <span className="text-[14px]">{tri("kg Farina", "kg Mehl", "kg Flour", "kg Harina", "kg Farine", "کیلو آرد")}</span>
            <button data-testid="team-calc" onClick={calcolaDosi} className="ml-auto rounded-md px-4 py-2 font-bold active:scale-97" style={{ background: D.accent, color: "#0A0B0E" }}>{tri("RICALCOLA DOSI & ACQUA", "MENGEN & WASSER", "DOSES & WATER", "DOSIS Y AGUA", "DOSES & EAU", "مقدار و آب")}</button>
          </div>
          {dosi && (<>
            <div data-testid="team-dosi-result" className={`grid gap-2 rounded-lg p-3 text-center ${dosi.burro ? "grid-cols-5" : "grid-cols-4"}`} style={{ background: D.bg, border: `1px solid ${D.border}` }}>
              <div><span className="text-[11px]" style={{ color: D.muted }}>{tri("ACQUA", "WASSER", "WATER", "AGUA", "EAU", "آب")}</span><br /><strong className="text-[15px]" style={{ color: D.accent }}>{dosi.acqua} L</strong></div>
              <div><span className="text-[11px]" style={{ color: D.muted }}>{tri("LIEVITO", "HEFE", "YEAST", "LEVADURA", "LEVURE", "مخمر")}</span><br /><strong className="text-[15px]" style={{ color: D.accent }}>{dosi.lievito} g</strong></div>
              <div><span className="text-[11px]" style={{ color: D.muted }}>{tri("SALE", "SALZ", "SALT", "SAL", "SEL", "نمک")}</span><br /><strong className="text-[15px]" style={{ color: D.accent }}>{dosi.sale} g</strong></div>
              {dosi.burro && <div><span className="text-[11px]" style={{ color: D.muted }}>{tri("BURRO", "BUTTER", "BUTTER", "MANTEQ.", "BEURRE", "کره")}</span><br /><strong className="text-[15px]" style={{ color: D.accent }}>{dosi.burro} g</strong></div>}
              <div><span className="text-[11px]" style={{ color: D.muted }}>{tri("TEMP. H₂O", "WASSER T.", "WATER T.", "TEMP. H₂O", "TEMP. H₂O", "دمای آب")}</span><br /><strong className="text-[15px]" style={{ color: D.green }}>{dosi.waterT} °C</strong></div>
            </div>
            {dosi.guida && <p data-testid="team-dosi-guida" className="mt-2 text-[13px] italic rounded-md p-2.5" style={{ background: D.bg, borderLeft: `3px solid ${D.accent}`, color: D.muted }}>📌 {dosi.guida}</p>}
          </>)}
        </div>

        {/* Tutor AI Visivo (ibrido: checklist gratis + analisi AI reale) */}
        <div className="rounded-2xl shadow-md border border-amber-900/40 p-4" style={{ background: D.card, border: `1px solid ${D.border}` }}>
          <h3 className="flex items-center gap-2 font-bold text-[15px] mb-2" style={{ color: D.accent }}><Eye className="w-4 h-4" /> {tri("Tutor AI Visivo", "Visueller KI-Tutor", "Visual AI Tutor", "Tutor AI Visual", "Tuteur IA Visuel", "مربی هوش مصنوعی")}</h3>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button data-testid="team-coach-formatura" onClick={() => setCoachType("formatura")} className="rounded-md py-2 text-[12px] font-bold" style={{ background: coachType === "formatura" ? D.accent : D.input, color: coachType === "formatura" ? "#0A0B0E" : D.text, border: `1px solid ${D.border}` }}>🥖 {tri("Formatura", "Formen", "Shaping", "Formado", "Façonnage", "فرم‌دهی")}</button>
            <button data-testid="team-coach-taglio" onClick={() => setCoachType("taglio")} className="rounded-md py-2 text-[12px] font-bold" style={{ background: coachType === "taglio" ? D.accent : D.input, color: coachType === "taglio" ? "#0A0B0E" : D.text, border: `1px solid ${D.border}` }}>🔪 {tri("Incisione lama", "Schnitt", "Scoring", "Corte", "Lame", "برش")}</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button data-testid="team-coach-checklist" onClick={() => coachChecklist(coachType)} className="rounded-md py-2.5 text-[12px] font-bold flex items-center justify-center gap-1.5" style={{ background: D.input, border: `1px solid ${D.border}`, color: D.text }}><CheckCircle2 className="w-4 h-4" /> {tri("Guida gratis", "Gratis-Guide", "Free guide", "Guía gratis", "Guide gratuit", "راهنمای رایگان")}</button>
            <button data-testid="team-coach-ai" onClick={runCoach} disabled={coachBusy} className="rounded-md py-2.5 text-[12px] font-bold flex items-center justify-center gap-1.5" style={{ background: D.green, color: "#000", opacity: coachBusy ? 0.6 : 1 }}><Camera className="w-4 h-4" /> {coachBusy ? tri("Analisi…", "Analyse…", "Analyzing…", "Analizando…", "Analyse…", "در حال تحلیل…") : tri("Foto + AI reale", "Foto + KI", "Photo + real AI", "Foto + IA", "Photo + IA", "عکس + هوش مصنوعی")}</button>
          </div>
          <input id="team-coach-file" data-testid="team-coach-file" type="file" accept="image/*" capture="environment" onChange={onCoachFile} style={{ display: "none" }} />
          <p className="text-[11px] mt-2" style={{ color: D.muted }}>{tri("La guida è gratuita. «Foto + AI reale» analizza uno scatto con l'AI (consuma crediti).", "Guide gratis. «Foto + KI» analysiert ein Foto (Guthaben).", "Guide is free. «Photo + real AI» analyzes a shot with AI (uses credits).", "La guía es gratis. «Foto + IA» analiza con IA (gasta créditos).", "Guide gratuit. «Photo + IA» consomme des crédits.", "راهنما رایگان است.")}</p>
          {coachMsg && <div data-testid="team-coach-result" className="mt-2 rounded-md p-3 text-[14px]" style={{ background: D.bg, borderLeft: `3px solid ${D.green}`, color: "#DDD" }}>{coachMsg}</div>}
        </div>

        {/* Interfono */}
        <div className="rounded-2xl shadow-md border border-amber-900/40 p-4" style={{ background: D.card, border: `1px solid ${D.border}` }}>
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
