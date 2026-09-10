import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Camera, Loader2, X, ScanLine, ClipboardCheck, Check, Volume2, ListChecks, GraduationCap, UserRound } from "lucide-react";
import { toast } from "sonner";
import { deusApi, floorApi, deptApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import TeamTasks from "@/components/TeamTasks";
import SosButton from "@/components/SosButton";
import SitorMaestro from "@/components/SitorMaestro";
import LivingAvatar3D from "@/components/LivingAvatar3D";
import SharedWidgets from "@/components/SharedWidgets";
import FaceCheckIn from "@/components/FaceCheckIn";
import OperatorClock from "@/components/OperatorClock";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const PUB = process.env.PUBLIC_URL;
const API = process.env.REACT_APP_BACKEND_URL;
const ROLE_KEY = "mikilab_role";

// Coda di produzione del giorno (dal Capo), compatta e con lettura vocale.
function DayTasks({ tri, lang, role, apprentice }) {
  const [tasks, setTasks] = useState([]);
  const [plan, setPlan] = useState(null);
  const [mine, setMine] = useState(null); // il compito assegnato a QUESTO operaio (dept assignment)
  const sigRef = useRef(null); // firma dell'assegnazione, per rilevare i cambi del Capo
  useEffect(() => {
    let alive = true;
    sigRef.current = null; // reset quando cambia operaio
    const load = () => {
      deusApi.productionQueue().then((d) => { if (alive) setTasks((d.tasks || []).filter((t) => t.status !== "done")); }).catch(() => {});
      deusApi.capoPlan().then((d) => { if (alive && d && d.plan_markdown) setPlan(d); }).catch(() => {});
      if (role) deptApi.assignment && deptApi.assignment().then((d) => {
        if (!alive) return;
        const m = (d.assignments || []).find((a) => (a.operator || "").toLowerCase() === role.toLowerCase());
        setMine(m || null);
        // Avviso vocale di Sitor se il Capo CAMBIA il compito mentre l'operaio è già al lavoro.
        const sig = m ? `${m.dept_name || m.dept}|${m.task || ""}` : "";
        if (sigRef.current !== null && sig && sig !== sigRef.current) {
          try { playTTS(tri(
            `${role}, attenzione: il Capo ha cambiato il tuo compito. Ora: ${m.dept_name || m.dept}${m.task ? ", " + m.task : ""}.`,
            `${role}, Achtung: der Chef hat deine Aufgabe geändert. Jetzt: ${m.dept_name || m.dept}${m.task ? ", " + m.task : ""}.`,
            `${role}, heads up: the boss changed your task. Now: ${m.dept_name || m.dept}${m.task ? ", " + m.task : ""}.`,
            `${role}, atención: el jefe cambió tu tarea. Ahora: ${m.dept_name || m.dept}${m.task ? ", " + m.task : ""}.`,
            `${role}, attention : le chef a changé ta tâche. Maintenant : ${m.dept_name || m.dept}${m.task ? ", " + m.task : ""}.`,
            `${role}، توجه: رئیس وظیفه‌ات را عوض کرد. حالا: ${m.dept_name || m.dept}${m.task ? "، " + m.task : ""}.`), { lang, voice: "nexus" }); } catch { /* */ }
          try { window.dispatchEvent(new Event("mikilab-tts-start")); setTimeout(() => window.dispatchEvent(new Event("mikilab-tts-end")), 3000); } catch { /* */ }
        }
        sigRef.current = sig;
      }).catch(() => {});
    };
    load(); const id = setInterval(load, 20000);
    return () => { alive = false; clearInterval(id); };
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps
  const done = (t) => deusApi.queueDone(t.id).then(() => setTasks((q) => q.filter((x) => x.id !== t.id))).catch(() => {});
  const read = (t) => { try { playTTS(`${t.title}. ${t.detail || ""}`, { lang, voice: "mikemix" }); } catch { /* */ } };
  // Lotti assegnati proprio a me (per nome) → in cima; se nessuno, mostro tutta la coda.
  const rl = (role || "").toLowerCase();
  const myBatches = rl ? tasks.filter((t) => (t.assignee || "").toLowerCase().includes(rl)) : [];
  const shown = myBatches.length ? myBatches : tasks;

  if (!tasks.length && !plan && !mine) {
    return (
      <div data-testid="floor-no-task" className="rounded-2xl border border-[#1e293b] bg-[#0b0f19] p-5 text-center">
        <p className="text-sm text-[#94A3B8]">{tri(
          "Nessun compito assegnato ancora. Sitor ti guiderà appena il Capo invia il piano del giorno.",
          "Noch keine Aufgabe. Sitor führt dich, sobald der Chef den Tagesplan sendet.",
          "No task assigned yet. Sitor will guide you as soon as the Capo sends the day plan.",
          "Aún sin tarea. Sitor te guiará cuando el Capo envíe el plan.",
          "Aucune tâche. Sitor te guidera dès que le Capo envoie le plan.",
          "هنوز وظیفه‌ای نیست. سیتور راهنمایی‌ات می‌کند.")}</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {apprentice && (
        <div data-testid="floor-appr-guide" className="rounded-2xl border border-amber-500/50 bg-amber-500/8 px-4 py-3">
          <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-amber-400 mb-1"><GraduationCap className="w-3.5 h-3.5" /> {tri("Guida apprendista · Sitor", "Lehrlings-Guide · Sitor", "Apprentice guide · Sitor", "Guía aprendiz · Sitor", "Guide apprenti · Sitor", "راهنمای کارآموز · سیتور")}</p>
          <p className="text-[12.5px] text-[#e7d9b8] leading-snug">{tri(
            "Fai un passo alla volta. Premi 🔊 per farti leggere ogni compito. Se qualcosa non è chiaro, chiedimi aiuto qui sotto: ci sono io.",
            "Ein Schritt nach dem anderen. 🔊 zum Vorlesen. Bei Fragen: frag mich unten.",
            "One step at a time. Tap 🔊 to hear each task. If unsure, ask me for help below.",
            "Un paso a la vez. Pulsa 🔊 para escuchar. Si dudas, pídeme ayuda abajo.",
            "Un pas à la fois. Appuie sur 🔊 pour écouter. En cas de doute, demande-moi.",
            "قدم‌به‌قدم. 🔊 برای شنیدن. اگر مطمئن نیستی، پایین از من بپرس.")}</p>
        </div>
      )}
      {mine && (
        <div data-testid="floor-my-assignment" className="rounded-2xl border-2 border-[#FF6B00]/60 bg-[#FF6B00]/10 px-4 py-3" style={{ boxShadow: "0 0 22px rgba(255,107,0,0.25)" }}>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#FF9D42] mb-0.5">{tri("Sitor · Il tuo compito assegnato", "Sitor · Deine Aufgabe", "Sitor · Your assigned task", "Sitor · Tu tarea", "Sitor · Ta tâche", "سیتور · وظیفه تو")}</p>
          <p className="text-base text-white font-black leading-tight">{mine.dept_name || mine.dept}{mine.task ? ` · ${mine.task}` : ""}</p>
          <button data-testid="floor-my-assignment-read" onClick={() => { try { playTTS(`${role}, oggi ${mine.dept_name || mine.dept}. ${mine.task || ""}`, { lang, voice: "nexus" }); } catch { /* */ } }} className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#FF9D42]"><Volume2 className="w-3.5 h-3.5" /> {tri("Ascolta da Sitor", "Von Sitor hören", "Hear from Sitor", "Escuchar", "Écouter", "بشنو")}</button>
        </div>
      )}
      {plan && plan.headline && (
        <div data-testid="floor-plan-headline" className="rounded-2xl border border-[#FF6B00]/40 bg-[#FF6B00]/8 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#FF6B00] mb-0.5">{tri("Piano del Capo · Sitor", "Plan des Capo", "Capo's Plan", "Plan del Capo", "Plan du Capo", "برنامه کاپو")}</p>
          <p className="text-sm text-white font-semibold leading-snug">{plan.headline}</p>
        </div>
      )}
      {!!shown.length && (
        <div data-testid="floor-day-tasks" className="rounded-2xl border border-[#FFB800]/40 bg-[#0b0f19] p-3">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#FFB800] mb-2"><ListChecks className="w-4 h-4" /> {myBatches.length ? tri("I tuoi lotti di oggi", "Deine Lose heute", "Your batches today", "Tus lotes de hoy", "Tes lots du jour", "دسته‌های امروز تو") : tri("Coda di produzione", "Produktionswarteschlange", "Production queue", "Cola de producción", "File de production", "صف تولید")}</p>
          <div className="space-y-1.5">
            {shown.slice(0, 12).map((t) => (
              <div key={t.id} data-testid={`floor-day-task-${t.id}`} className="flex items-center gap-2 rounded-xl bg-[#0C1019] border border-[#1e293b] px-3 py-2.5">
                {t.dept && <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#FF6B00]/10 text-[#FF9D42] border border-[#FF6B00]/20 shrink-0">{t.dept}</span>}
                <div className="min-w-0 flex-1"><p className="text-sm font-bold text-white truncate">{t.title}</p>{t.detail && <p className="text-[11px] text-[#64748B] truncate">{t.detail}</p>}</div>
                <button data-testid={`floor-day-read-${t.id}`} onClick={() => read(t)} className="shrink-0 w-8 h-8 rounded-lg bg-[#FF6B00]/10 border border-[#FF6B00]/40 text-[#FF6B00] flex items-center justify-center active:scale-95"><Volume2 className="w-4 h-4" /></button>
                <button data-testid={`floor-day-done-${t.id}`} onClick={() => done(t)} className="shrink-0 w-8 h-8 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/40 text-[#22c55e] flex items-center justify-center active:scale-95"><Check className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Passi dettagliati assegnati al ruolo */}
      <TeamTasks operatorName={role} />
    </div>
  );
}

// Analizzatore foto di Sitor: l'operaio scatta e Sitor risponde in tempo reale.
function SitorPhotoAnalyzer({ tri, lang }) {
  const [preview, setPreview] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState("");
  const fileRef = useRef(null);

  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => { setPreview(reader.result); setResult(""); };
    reader.readAsDataURL(f);
  };

  const analyze = async () => {
    if (!preview || analyzing) return;
    setAnalyzing(true); setResult("");
    let full = "";
    try {
      const res = await fetch(`${API}/api/floor/analyze-photo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: preview, lang }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop();
        for (const part of parts) {
          const line = part.replace(/^data: ?/, "").trim();
          if (!line) continue;
          let obj; try { obj = JSON.parse(line); } catch { continue; }
          if (obj.done) continue;
          if (obj.d) { full += obj.d; setResult((r) => r + obj.d); }
        }
      }
      const clean = full.replace(/\[OK\]|\[FIX\]/g, "").trim();
      setResult(clean);
      try { playTTS(clean.slice(0, 400), { lang, voice: "mikemix" }); } catch { /* */ }
    } catch {
      toast.error(tri("Analisi non riuscita. Riprova.", "Analyse fehlgeschlagen.", "Analysis failed. Retry.", "Análisis fallido.", "Échec de l'analyse.", "تحلیل ناموفق."));
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div data-testid="floor-analyzer" className="rounded-2xl border border-[#22d3ee]/40 bg-[#0b0f19] p-4">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#22d3ee] mb-3"><ScanLine className="w-4 h-4" /> {tri("Scatta foto · Sitor analizza", "Foto · Sitor prüft", "Take a photo · Sitor analyzes", "Foto · Sitor analiza", "Photo · Sitor analyse", "عکس · سیتور تحلیل می‌کند")}</p>
      <input ref={fileRef} data-testid="floor-analyzer-input" type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
      {preview ? (
        <div className="relative w-full rounded-xl overflow-hidden border border-[#22d3ee]/30 bg-black mb-3">
          <img src={preview} alt="anteprima" className="w-full h-auto max-h-64 object-contain" />
          <button data-testid="floor-analyzer-clear" onClick={() => { setPreview(""); setResult(""); }} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[#030712]/80 border border-[#1e293b] flex items-center justify-center text-[#94A3B8]"><X className="w-4 h-4" /></button>
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <button data-testid="floor-analyzer-take" onClick={() => fileRef.current && fileRef.current.click()} className="inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#22d3ee]/10 border border-[#22d3ee]/40 text-[#22d3ee] font-bold text-sm active:scale-95">
          <Camera className="w-4 h-4" /> {preview ? tri("Cambia foto", "Foto ändern", "Change photo", "Cambiar foto", "Changer", "تغییر عکس") : tri("Scatta foto", "Foto machen", "Take photo", "Tomar foto", "Photo", "عکس بگیر")}
        </button>
        <button data-testid="floor-analyzer-run" onClick={analyze} disabled={!preview || analyzing} className="inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#0891b2] to-[#22d3ee] text-[#030712] font-black text-sm disabled:opacity-40 active:scale-95">
          {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />} {tri("Analizza", "Analysieren", "Analyze", "Analizar", "Analyser", "تحلیل")}
        </button>
      </div>
      {result && (
        <div data-testid="floor-analyzer-result" className="mt-3 rounded-xl border border-[#22d3ee]/25 bg-[#030712] p-3 max-h-64 overflow-y-auto">
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[#cbd5e1]">{result}</p>
        </div>
      )}
    </div>
  );
}

// Rapporto di fine turno: l'operaio compila l'essenziale per il Capo.
function EndOfShiftForm({ tri, role }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ pieces: "", waste: "", issues: "", notes: "", cleaning_done: false });
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await floorApi.submitShiftReport({ operator: role || "Operatore", role, ...form });
      setSent(true);
    } catch {
      setSent(true); // offline-tolerant
    }
    setBusy(false);
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div data-testid="floor-endshift" className="rounded-2xl border border-[#22c55e]/40 bg-[#0b0f19] overflow-hidden">
      <button data-testid="floor-endshift-toggle" onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-2 px-4 py-3 active:scale-[0.99] transition-all">
        <span className="w-8 h-8 rounded-lg bg-[#22c55e]/15 border border-[#22c55e]/40 flex items-center justify-center shrink-0"><ClipboardCheck className="w-4 h-4 text-[#22c55e]" /></span>
        <span className="flex-1 text-left">
          <span className="block text-xs font-black uppercase tracking-wide text-[#22c55e]">{tri("Fine turno · Compila", "Schichtende · Ausfüllen", "End of shift · Fill in", "Fin de turno · Rellenar", "Fin de service · Remplir", "پایان شیفت · تکمیل")}</span>
          <span className="block text-[11px] text-[#94A3B8]">{tri("Le cose essenziali per il Capo.", "Das Wichtigste für den Chef.", "The essentials for the Capo.", "Lo esencial para el Capo.", "L'essentiel pour le Capo.", "موارد مهم برای کاپو.")}</span>
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2.5">
          {sent ? (
            <p data-testid="floor-endshift-sent" className="text-[13px] text-emerald-400 font-bold py-2">✓ {tri("Rapporto inviato al Capo. Buon riposo!", "Bericht an den Chef gesendet. Gute Erholung!", "Report sent to the Capo. Rest well!", "Informe enviado al Capo. ¡Descansa!", "Rapport envoyé au Capo. Bon repos !", "گزارش ارسال شد. خسته نباشی!")}</p>
          ) : (
            <>
              <label className="block text-[11px] font-bold text-[#94A3B8]">{tri("Pezzi prodotti", "Produzierte Stück", "Pieces produced", "Piezas producidas", "Pièces produites", "قطعات تولیدشده")}</label>
              <input data-testid="floor-endshift-pieces" value={form.pieces} onChange={set("pieces")} placeholder={tri("es. 120 pani, 80 panini", "z.B. 120 Brote", "e.g. 120 loaves", "ej. 120 panes", "ex. 120 pains", "مثلاً ۱۲۰ نان")} className="w-full rounded-lg bg-[#030712] border border-[#1e293b] text-white text-sm px-3 py-2 focus:border-[#22c55e] outline-none" />
              <label className="block text-[11px] font-bold text-[#94A3B8]">{tri("Scarti / sprechi", "Ausschuss", "Waste", "Desperdicios", "Rebuts", "ضایعات")}</label>
              <input data-testid="floor-endshift-waste" value={form.waste} onChange={set("waste")} placeholder={tri("es. 3 pani bruciati", "z.B. 3 verbrannt", "e.g. 3 burnt loaves", "ej. 3 quemados", "ex. 3 brûlés", "مثلاً ۳ نان سوخته")} className="w-full rounded-lg bg-[#030712] border border-[#1e293b] text-white text-sm px-3 py-2 focus:border-[#22c55e] outline-none" />
              <label className="block text-[11px] font-bold text-[#94A3B8]">{tri("Problemi / macchinari", "Probleme / Maschinen", "Issues / machines", "Problemas / máquinas", "Problèmes / machines", "مشکلات / دستگاه‌ها")}</label>
              <input data-testid="floor-endshift-issues" value={form.issues} onChange={set("issues")} placeholder={tri("es. forno 2 scalda poco", "z.B. Ofen 2", "e.g. oven 2 underheats", "ej. horno 2", "ex. four 2", "مثلاً فر ۲")} className="w-full rounded-lg bg-[#030712] border border-[#1e293b] text-white text-sm px-3 py-2 focus:border-[#22c55e] outline-none" />
              <label className="block text-[11px] font-bold text-[#94A3B8]">{tri("Note per il prossimo turno", "Notiz für nächste Schicht", "Notes for next shift", "Notas próximo turno", "Notes prochaine équipe", "یادداشت شیفت بعد")}</label>
              <textarea data-testid="floor-endshift-notes" value={form.notes} onChange={set("notes")} rows={2} placeholder={tri("Scrivi qui…", "Hier schreiben…", "Write here…", "Escribe aquí…", "Écris ici…", "اینجا بنویس…")} className="w-full rounded-lg bg-[#030712] border border-[#1e293b] text-white text-sm px-3 py-2 focus:border-[#22c55e] outline-none resize-none" />
              <label data-testid="floor-endshift-cleaning" className="flex items-center gap-2 py-1 cursor-pointer">
                <input type="checkbox" checked={form.cleaning_done} onChange={(e) => setForm((f) => ({ ...f, cleaning_done: e.target.checked }))} className="w-4 h-4 accent-[#22c55e]" />
                <span className="text-[13px] text-[#cbd5e1]">{tri("Pulizia postazione completata", "Reinigung erledigt", "Station cleaning done", "Limpieza hecha", "Nettoyage fait", "نظافت انجام شد")}</span>
              </label>
              <button data-testid="floor-endshift-submit" onClick={submit} disabled={busy} className="w-full py-3 rounded-xl font-black text-sm text-[#030712] bg-gradient-to-r from-[#16a34a] to-[#22c55e] active:scale-95 disabled:opacity-50">
                {busy ? tri("Invio…", "Senden…", "Sending…", "Enviando…", "Envoi…", "ارسال…") : tri("Invia al Capo", "An Chef senden", "Send to Capo", "Enviar al Capo", "Envoyer au Capo", "ارسال به کاپو")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Accesso minimale: VOLTO (riconoscimento su questa postazione) oppure NOME → Sitor riconosce il compito.
function FloorNameEntry({ tri, onSet }) {
  const [name, setName] = useState("");
  return (
    <div data-testid="floor-name-entry" className="space-y-3">
      <FaceCheckIn tri={tri} onRecognized={onSet} />
      <div className="rounded-2xl border border-[#FF6B00]/40 bg-[#0b0f19] p-4">
        <p className="flex items-center gap-2 text-sm font-black text-white mb-1"><UserRound className="w-4 h-4 text-[#FF6B00]" /> {tri("Oppure dì il tuo nome", "Oder sag deinen Namen", "Or tell your name", "O di tu nombre", "Ou dis ton nom", "یا نامت را بگو")}</p>
      <p className="text-[11px] text-[#94A3B8] mb-2">{tri("Sitor sa già cosa devi fare oggi.", "Sitor kennt deine Aufgabe.", "Sitor already knows your task today.", "Sitor ya sabe tu tarea.", "Sitor connaît ta tâche.", "سیتور وظیفه‌ات را می‌داند.")}</p>
      <div className="flex items-center gap-2">
        <input data-testid="floor-name-input" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onSet(name.trim()); }}
          placeholder={tri("Il tuo nome", "Dein Name", "Your name", "Tu nombre", "Ton nom", "نام تو")} className="flex-1 rounded-xl bg-[#030712] border border-[#1e293b] text-white text-sm px-3 py-2.5 focus:border-[#FF6B00] outline-none" />
        <button data-testid="floor-name-go" onClick={() => name.trim() && onSet(name.trim())} disabled={!name.trim()} className="shrink-0 px-4 py-2.5 rounded-xl bg-[#FF6B00] text-[#04070d] font-black text-sm active:scale-95 disabled:opacity-40">{tri("Entra", "Los", "Go", "Entrar", "Entrer", "ورود")}</button>
      </div>
      </div>
    </div>
  );
}

// Vista Produzione a schermo unico: SOLO il compito del giorno + aiuto + foto + fine turno.
export default function FloorOperatorDay() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [role, setRole] = useState(() => { try { return localStorage.getItem(ROLE_KEY) || ""; } catch { return ""; } });
  const [apprentice, setApprentice] = useState(false);
  const greetedRef = useRef(false);

  const syncRole = useCallback(() => { try { setRole(localStorage.getItem(ROLE_KEY) || ""); } catch { /* */ } }, []);
  useEffect(() => {
    window.addEventListener("mikilab-role-changed", syncRole);
    return () => window.removeEventListener("mikilab-role-changed", syncRole);
  }, [syncRole]);

  // Rileva se il Capo ha attivato la MODALITÀ APPRENDISTA per questo operaio → Sitor cambia comportamento.
  useEffect(() => {
    if (!role) { setApprentice(false); return; }
    let alive = true;
    const check = () => deptApi.assignment().then((d) => {
      if (!alive) return;
      const mine = (d.assignments || []).find((a) => (a.operator || "").toLowerCase() === role.toLowerCase());
      setApprentice(!!(mine && mine.apprentice));
    }).catch(() => {});
    check(); const id = setInterval(check, 30000);
    return () => { alive = false; clearInterval(id); };
  }, [role]);

  // In modalità apprendista, Sitor accoglie a voce con guida più semplice e una domanda di sicurezza.
  useEffect(() => {
    if (apprentice && role && !greetedRef.current) {
      greetedRef.current = true;
      const msg = tri(
        `Ciao ${role}. Oggi sei in apprendistato: andiamo con calma, un passo alla volta. Ti spiego tutto e controllo con te ogni passaggio. Prima domanda: hai già lavato le mani e indossato il grembiule?`,
        `Hallo ${role}. Heute als Lehrling: ruhig, Schritt für Schritt. Erste Frage: Hände gewaschen und Schürze an?`,
        `Hi ${role}. Today as an apprentice: calmly, one step at a time. First question: have you washed your hands and put on your apron?`,
        `Hola ${role}. Hoy como aprendiz: con calma, paso a paso. ¿Te lavaste las manos y te pusiste el delantal?`,
        `Salut ${role}. Aujourd'hui apprenti : doucement, pas à pas. As-tu lavé tes mains et mis ton tablier ?`,
        `سلام ${role}. امروز کارآموز هستی: آرام، قدم‌به‌قدم. دست‌ها را شستی و پیش‌بند پوشیدی؟`);
      try { playTTS(msg, { lang, voice: "nexus" }); } catch { /* */ }
    }
    if (!apprentice) greetedRef.current = false;
  }, [apprentice, role, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div data-testid="floor-operator-day" className="space-y-4">
      {!role && (
        <FloorNameEntry tri={tri} onSet={(nm) => { try { localStorage.setItem(ROLE_KEY, nm); } catch { /* */ } try { window.dispatchEvent(new CustomEvent("mikilab-role-changed", { detail: { role: nm } })); } catch { /* */ } setRole(nm); }} />
      )}
      {/* Sitor parla direttamente con l'operaio */}
      <div className={`flex items-center gap-3 rounded-2xl border p-4 ${apprentice ? "border-amber-500/60 bg-amber-500/8" : "border-amber-500/40 bg-[#0b0f19]"}`}>
        <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-amber-500/60 shrink-0"><LivingAvatar3D src={`${PUB}/avatar_nexus.jpg`} accent="#EAB308" nexus className="w-full h-full" /></div>
        <div className="min-w-0">
          <p className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">Sitor
            {apprentice && <span data-testid="floor-appr-badge" className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/50"><GraduationCap className="w-3 h-3" /> {tri("Modalità apprendista", "Lehrlingsmodus", "Apprentice mode", "Modo aprendiz", "Mode apprenti", "حالت کارآموز")}</span>}
          </p>
          <p className="text-[12px] text-[#94A3B8] leading-snug">{!role
            ? tri("Seleziona la tua postazione qui sopra per ricevere il compito del giorno.", "Wähle oben deine Station für die Tagesaufgabe.", "Select your station above to receive today's task.", "Selecciona tu puesto arriba.", "Choisis ton poste ci-dessus.", "پست کاری‌ات را بالا انتخاب کن.")
            : apprentice
              ? tri(`Ciao ${role}, oggi sei in apprendistato. Andiamo con calma, un passo alla volta: ti spiego tutto e ti guido a voce.`, `Hallo ${role}, heute als Lehrling. Ruhig, Schritt für Schritt.`, `Hi ${role}, today as an apprentice. Calmly, step by step — I'll guide you by voice.`, `Hola ${role}, hoy como aprendiz. Con calma, paso a paso.`, `Salut ${role}, apprenti aujourd'hui. Doucement, pas à pas.`, `سلام ${role}، امروز کارآموز. آرام، قدم‌به‌قدم.`)
              : tri(`Ciao ${role}, ecco il tuo compito di oggi. Sono qui: chiedimi aiuto o mostrami una foto.`, `Hallo ${role}, hier deine Aufgabe. Ich bin da: frag mich oder zeig mir ein Foto.`, `Hi ${role}, here's your task today. I'm here: ask for help or show me a photo.`, `Hola ${role}, esta es tu tarea. Pídeme ayuda o muéstrame una foto.`, `Salut ${role}, voici ta tâche. Demande de l'aide ou montre une photo.`, `سلام ${role}، وظیفه امروزت. کمک بخواه یا عکس نشان بده.`)}</p>
        </div>
      </div>

      <OperatorClock />

      {/* Il compito del giorno */}
      <DayTasks tri={tri} lang={lang} role={role} apprentice={apprentice} />

      {/* Sitor Maestro: guida passo-passo adattata al livello + proposta di modifica al piano */}
      {role && <SitorMaestro role={role} />}

      {/* Widget condivisi dal Capo per il reparto */}
      <SharedWidgets dept={mine ? (mine.dept_name || mine.dept || "") : ""} />

      {/* Sempre disponibili: chiedi aiuto + analizzatore foto */}
      <SosButton role={role} operator={role} />
      <SitorPhotoAnalyzer tri={tri} lang={lang} />

      {/* Fine turno */}
      <EndOfShiftForm tri={tri} role={role} />
    </div>
  );
}
