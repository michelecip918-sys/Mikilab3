import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Camera, Loader2, X, ScanLine, ClipboardCheck, Check, Volume2, ListChecks, GraduationCap, UserRound, BookOpen, Headphones } from "lucide-react";
import { toast } from "sonner";
import { deusApi, floorApi, deptApi, productionApi, coordinationApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import TeamTasks from "@/components/TeamTasks";
import RecipeList from "@/components/RecipeList";
import HeadphonesMode from "@/components/HeadphonesMode";
import DriverRun from "@/components/console/DriverRun";
import SosButton from "@/components/SosButton";
import AskHelpButton from "@/components/AskHelpButton";
import { PrivacyLink, NotForSaleNote } from "@/components/PrivacyNotice";
import SitorMaestro from "@/components/SitorMaestro";
import SitorCard from "@/components/SitorCard";
import LivingAvatar3D from "@/components/LivingAvatar3D";
import SharedWidgets from "@/components/SharedWidgets";
import FaceCheckIn from "@/components/FaceCheckIn";
import OperatorClock from "@/components/OperatorClock";
import FloorOpeningChecklist from "@/components/FloorOpeningChecklist";
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
      <div data-testid="floor-no-task" className="space-y-3">
        <FloorOpeningChecklist lang={lang} role={role} />
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {apprentice && (
        <div data-testid="floor-appr-guide" className="rounded-2xl border border-amber-500/50 bg-amber-500/8 px-4 py-3">
          <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-amber-400 mb-1"><GraduationCap className="w-3.5 h-3.5" /> {tri("Guida apprendista · Sitor", "Lehrlings-Guide · Sitor", "Apprentice guide · Sitor", "Guía aprendiz · Sitor", "Guide apprenti · Sitor", "راهنمای کارآموز · سیتور")}</p>
          <p className="text-[12.5px] text-foreground leading-snug">{tri(
            "Fai un passo alla volta. Premi 🔊 per farti leggere ogni compito. Se qualcosa non è chiaro, chiedimi aiuto qui sotto: ci sono io.",
            "Ein Schritt nach dem anderen. 🔊 zum Vorlesen. Bei Fragen: frag mich unten.",
            "One step at a time. Tap 🔊 to hear each task. If unsure, ask me for help below.",
            "Un paso a la vez. Pulsa 🔊 para escuchar. Si dudas, pídeme ayuda abajo.",
            "Un pas à la fois. Appuie sur 🔊 pour écouter. En cas de doute, demande-moi.",
            "قدم‌به‌قدم. 🔊 برای شنیدن. اگر مطمئن نیستی، پایین از من بپرس.")}</p>
        </div>
      )}
      {mine && (
        <div data-testid="floor-my-assignment" className="rounded-2xl border-2 border-border/60 bg-muted/10 px-4 py-3" style={{ boxShadow: "0 0 22px rgba(138,151,166,0.25)" }}>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">{tri("Sitor · Il tuo compito assegnato", "Sitor · Deine Aufgabe", "Sitor · Your assigned task", "Sitor · Tu tarea", "Sitor · Ta tâche", "سیتور · وظیفه تو")}</p>
          <p className="text-base text-foreground font-black leading-tight">{mine.dept_name || mine.dept}{mine.task ? ` · ${mine.task}` : ""}</p>
          <button data-testid="floor-my-assignment-read" onClick={() => { try { playTTS(`${role}, oggi ${mine.dept_name || mine.dept}. ${mine.task || ""}`, { lang, voice: "nexus" }); } catch { /* */ } }} className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground"><Volume2 className="w-3.5 h-3.5" /> {tri("Ascolta da Sitor", "Von Sitor hören", "Hear from Sitor", "Escuchar", "Écouter", "بشنو")}</button>
        </div>
      )}
      {plan && plan.headline && (
        <div data-testid="floor-plan-headline" className="rounded-2xl border border-border/40 bg-muted/8 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">{tri("Piano della Direzione · Sitor", "Plan des Capo", "Capo's Plan", "Plan del Capo", "Plan du Capo", "برنامه کاپو")}</p>
          <p className="text-sm text-foreground font-semibold leading-snug">{plan.headline}</p>
        </div>
      )}
      {!!shown.length && (
        <div data-testid="floor-day-tasks" className="rounded-2xl border border-border/40 bg-background p-3">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-muted-foreground mb-2"><ListChecks className="w-4 h-4" /> {myBatches.length ? tri("I tuoi lotti di oggi", "Deine Lose heute", "Your batches today", "Tus lotes de hoy", "Tes lots du jour", "دسته‌های امروز تو") : tri("Coda di produzione", "Produktionswarteschlange", "Production queue", "Cola de producción", "File de production", "صف تولید")}</p>
          <div className="space-y-1.5">
            {shown.slice(0, 12).map((t) => (
              <div key={t.id} data-testid={`floor-day-task-${t.id}`} className="flex items-center gap-2 rounded-xl bg-background border border-border px-3 py-2.5">
                {t.dept && <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-muted/10 text-muted-foreground border border-border/20 shrink-0">{t.dept}</span>}
                <div className="min-w-0 flex-1"><p className="text-sm font-bold text-foreground truncate">{t.title}</p>{t.detail && <p className="text-[11px] text-muted-foreground truncate">{t.detail}</p>}</div>
                <button data-testid={`floor-day-read-${t.id}`} onClick={() => read(t)} className="shrink-0 w-8 h-8 rounded-lg bg-muted/10 border border-border/40 text-muted-foreground flex items-center justify-center active:scale-95"><Volume2 className="w-4 h-4" /></button>
                <button data-testid={`floor-day-done-${t.id}`} onClick={() => done(t)} className="shrink-0 w-8 h-8 rounded-lg bg-accent/10 border border-accent/40 text-accent flex items-center justify-center active:scale-95"><Check className="w-4 h-4" /></button>
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
    <div data-testid="floor-analyzer" className="rounded-2xl border border-accent/40 bg-background p-4">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-accent mb-3"><Camera className="w-4 h-4" /> {tri("Sitor, guarda qui", "Sitor, schau her", "Sitor, look here", "Sitor, mira aquí", "Sitor, regarde ici", "سیتور، اینجا را ببین")}</p>
      <input ref={fileRef} data-testid="floor-analyzer-input" type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
      {preview ? (
        <div className="relative w-full rounded-xl overflow-hidden border border-accent/30 bg-background mb-3">
          <img src={preview} alt="anteprima" className="w-full h-auto max-h-64 object-contain" />
          <button data-testid="floor-analyzer-clear" onClick={() => { setPreview(""); setResult(""); }} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 border border-border flex items-center justify-center text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <button data-testid="floor-analyzer-take" onClick={() => fileRef.current && fileRef.current.click()} className="inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-accent/12 border border-accent/40 text-accent font-bold text-sm active:scale-95">
          <Camera className="w-4 h-4" /> {preview ? tri("Cambia foto", "Foto ändern", "Change photo", "Cambiar foto", "Changer", "تغییر عکس") : tri("Scatta foto", "Foto machen", "Take photo", "Tomar foto", "Photo", "عکس بگیر")}
        </button>
        <button data-testid="floor-analyzer-run" onClick={analyze} disabled={!preview || analyzing} className="inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-white font-black text-sm disabled:opacity-40 active:scale-95">
          {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />} {tri("Chiedi a Sitor", "Sitor fragen", "Ask Sitor", "Preguntar a Sitor", "Demander à Sitor", "از سیتور بپرس")}
        </button>
      </div>
      {result && (
        <div data-testid="floor-analyzer-result" className="mt-3 rounded-xl border border-accent/25 bg-background p-3 max-h-64 overflow-y-auto">
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">{result}</p>
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
    <div data-testid="floor-endshift" className="rounded-2xl border border-accent/40 bg-background overflow-hidden">
      <button data-testid="floor-endshift-toggle" onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-2 px-4 py-3 active:scale-[0.99] transition-all">
        <span className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/40 flex items-center justify-center shrink-0"><ClipboardCheck className="w-4 h-4 text-accent" /></span>
        <span className="flex-1 text-left">
          <span className="block text-xs font-black uppercase tracking-wide text-accent">{tri("Fine turno · Compila", "Schichtende · Ausfüllen", "End of shift · Fill in", "Fin de turno · Rellenar", "Fin de service · Remplir", "پایان شیفت · تکمیل")}</span>
          <span className="block text-[11px] text-muted-foreground">{tri("Le cose essenziali per la Direzione.", "Das Wichtigste für den Chef.", "The essentials for the Capo.", "Lo esencial para el Capo.", "L'essentiel pour le Capo.", "موارد مهم برای کاپو.")}</span>
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2.5">
          {sent ? (
            <p data-testid="floor-endshift-sent" className="text-[13px] text-emerald-400 font-bold py-2">✓ {tri("Rapporto inviato alla Direzione. Turno concluso.", "Bericht an die Direktion gesendet. Schicht beendet.", "Report sent to Management. Shift closed.", "Informe enviado a Dirección. Turno finalizado.", "Rapport envoyé à la Direction. Service terminé.", "گزارش به مدیریت ارسال شد. شیفت پایان یافت.")}</p>
          ) : (
            <>
              <label className="block text-[11px] font-bold text-muted-foreground">{tri("Pezzi prodotti", "Produzierte Stück", "Pieces produced", "Piezas producidas", "Pièces produites", "قطعات تولیدشده")}</label>
              <input data-testid="floor-endshift-pieces" value={form.pieces} onChange={set("pieces")} placeholder={tri("es. 120 pani, 80 panini", "z.B. 120 Brote", "e.g. 120 loaves", "ej. 120 panes", "ex. 120 pains", "مثلاً ۱۲۰ نان")} className="w-full rounded-lg bg-background border border-border text-foreground text-sm px-3 py-2 focus:border-accent outline-none" />
              <label className="block text-[11px] font-bold text-muted-foreground">{tri("Scarti / sprechi", "Ausschuss", "Waste", "Desperdicios", "Rebuts", "ضایعات")}</label>
              <input data-testid="floor-endshift-waste" value={form.waste} onChange={set("waste")} placeholder={tri("es. 3 pani bruciati", "z.B. 3 verbrannt", "e.g. 3 burnt loaves", "ej. 3 quemados", "ex. 3 brûlés", "مثلاً ۳ نان سوخته")} className="w-full rounded-lg bg-background border border-border text-foreground text-sm px-3 py-2 focus:border-accent outline-none" />
              <label className="block text-[11px] font-bold text-muted-foreground">{tri("Problemi / macchinari", "Probleme / Maschinen", "Issues / machines", "Problemas / máquinas", "Problèmes / machines", "مشکلات / دستگاه‌ها")}</label>
              <input data-testid="floor-endshift-issues" value={form.issues} onChange={set("issues")} placeholder={tri("es. forno 2 scalda poco", "z.B. Ofen 2", "e.g. oven 2 underheats", "ej. horno 2", "ex. four 2", "مثلاً فر ۲")} className="w-full rounded-lg bg-background border border-border text-foreground text-sm px-3 py-2 focus:border-accent outline-none" />
              <label className="block text-[11px] font-bold text-muted-foreground">{tri("Note per il prossimo turno", "Notiz für nächste Schicht", "Notes for next shift", "Notas próximo turno", "Notes prochaine équipe", "یادداشت شیفت بعد")}</label>
              <textarea data-testid="floor-endshift-notes" value={form.notes} onChange={set("notes")} rows={2} placeholder={tri("Scrivi qui…", "Hier schreiben…", "Write here…", "Escribe aquí…", "Écris ici…", "اینجا بنویس…")} className="w-full rounded-lg bg-background border border-border text-foreground text-sm px-3 py-2 focus:border-accent outline-none resize-none" />
              <label data-testid="floor-endshift-cleaning" className="flex items-center gap-2 py-1 cursor-pointer">
                <input type="checkbox" checked={form.cleaning_done} onChange={(e) => setForm((f) => ({ ...f, cleaning_done: e.target.checked }))} className="w-4 h-4 accent-accent" />
                <span className="text-[13px] text-foreground">{tri("Pulizia postazione completata", "Reinigung erledigt", "Station cleaning done", "Limpieza hecha", "Nettoyage fait", "نظافت انجام شد")}</span>
              </label>
              <button data-testid="floor-endshift-submit" onClick={submit} disabled={busy} className="w-full py-3 rounded-xl font-black text-sm text-foreground bg-gradient-to-r from-muted to-accent active:scale-95 disabled:opacity-50">
                {busy ? tri("Invio…", "Senden…", "Sending…", "Enviando…", "Envoi…", "ارسال…") : tri("Invia alla Direzione", "An Chef senden", "Send to Capo", "Enviar al Capo", "Envoyer au Capo", "ارسال به کاپو")}
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
      <div className="rounded-2xl border border-border/40 bg-background p-4">
        <p className="flex items-center gap-2 text-sm font-black text-foreground mb-1"><UserRound className="w-4 h-4 text-muted-foreground" /> {tri("Oppure dì il tuo nome", "Oder sag deinen Namen", "Or tell your name", "O di tu nombre", "Ou dis ton nom", "یا نامت را بگو")}</p>
      <p className="text-[11px] text-muted-foreground mb-2">{tri("Inserendo il tuo nome ti viene mostrato il compito assegnato per oggi.", "Mit deinem Namen siehst du deine heutige Aufgabe.", "Enter your name to see your assigned task for today.", "Al ingresar tu nombre verás tu tarea asignada de hoy.", "En indiquant ton nom tu verras ta tâche du jour.", "با وارد کردن نامت، وظیفه امروزت نمایش داده می‌شود.")}</p>
      <div className="flex items-center gap-2">
        <input data-testid="floor-name-input" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onSet(name.trim()); }}
          placeholder={tri("Il tuo nome", "Dein Name", "Your name", "Tu nombre", "Ton nom", "نام تو")} className="flex-1 rounded-xl bg-background border border-border text-foreground text-sm px-3 py-2.5 focus:border-border outline-none" />
        <button data-testid="floor-name-go" onClick={() => name.trim() && onSet(name.trim())} disabled={!name.trim()} className="shrink-0 px-4 py-2.5 rounded-xl bg-muted text-foreground font-black text-sm active:scale-95 disabled:opacity-40">{tri("Entra", "Los", "Go", "Entrar", "Entrer", "ورود")}</button>
      </div>
      </div>
    </div>
  );
}

// Vista Produzione a schermo unico: SOLO il compito del giorno + aiuto + foto + fine turno.
// Logger rapido per gli operai: registra prodotto/avanzato → auto-compila la chiusura del Capo.
function FloorProductionLog({ tri }) {
  const [product, setProduct] = useState("");
  const [produced, setProduced] = useState("");
  const [leftover, setLeftover] = useState("");
  const [saved, setSaved] = useState(false);
  const DAYS = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];
  const submit = async () => {
    if (!product.trim()) { toast.error(tri("Scrivi il prodotto", "Produkt eingeben", "Enter the product", "Escribe el producto", "Indique le produit", "محصول را بنویس")); return; }
    try {
      await productionApi.log({ day_key: DAYS[(new Date().getDay() + 6) % 7], recipe_name: product.trim(), produced: parseFloat(produced) || 0, leftover: parseFloat(leftover) || 0 });
      setSaved(true); setProduct(""); setProduced(""); setLeftover("");
      toast.success(tri("Registrato", "Erfasst", "Logged", "Registrado", "Enregistré", "ثبت شد"));
      setTimeout(() => setSaved(false), 1500);
    } catch { toast.error(tri("Non salvato", "Nicht gespeichert", "Not saved", "No guardado", "Non enregistré", "ذخیره نشد")); }
  };
  const fld = "bg-background border border-border/30 rounded-md px-2 py-2 text-[13px] text-white focus:outline-none focus:border-primary";
  return (
    <div data-testid="floor-prod-log" className="rounded-2xl border border-border/25 bg-background/60 p-5 space-y-3">
      <div className="flex items-center gap-2"><ListChecks className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-black text-foreground">{tri("Registra produzione", "Produktion erfassen", "Log production", "Registrar producción", "Enregistrer la production", "ثبت تولید")}</span></div>
      <input data-testid="floor-log-product" value={product} onChange={(e) => setProduct(e.target.value)} placeholder={tri("Prodotto", "Produkt", "Product", "Producto", "Produit", "محصول")} className={`${fld} w-full`} />
      <div className="grid grid-cols-2 gap-2">
        <input data-testid="floor-log-produced" value={produced} onChange={(e) => setProduced(e.target.value)} placeholder={tri("Prodotti", "Produziert", "Produced", "Producidos", "Produits", "تولیدشده")} className={fld} inputMode="numeric" />
        <input data-testid="floor-log-leftover" value={leftover} onChange={(e) => setLeftover(e.target.value)} placeholder={tri("Avanzati", "Reste", "Leftover", "Sobrantes", "Restes", "باقی‌مانده")} className={fld} inputMode="numeric" />
      </div>
      <button data-testid="floor-log-submit" onClick={submit} className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-muted text-white font-bold px-4 py-2.5 rounded-xl active:scale-98 transition-all">
        {saved ? <Check className="w-4 h-4" /> : <ListChecks className="w-4 h-4" />} {tri("Registra", "Erfassen", "Log", "Registrar", "Enregistrer", "ثبت")}
      </button>
    </div>
  );
}


export default function FloorOperatorDay({ superviseDept = "", superviseDeptName = "" }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const supervise = !!superviseDept;
  const [role, setRole] = useState(() => { try { return localStorage.getItem(ROLE_KEY) || ""; } catch { return ""; } });
  const [apprentice, setApprentice] = useState(false);
  const [mine, setMine] = useState(null); // assegnazione di QUESTO operaio (per i widget condivisi del reparto)
  const [showRecipes, setShowRecipes] = useState(false);
  const [showHeadphones, setShowHeadphones] = useState(false);
  const [showSitorCard, setShowSitorCard] = useState(false);
  const [isDriver, setIsDriver] = useState(false); // true solo se il Capo ha abilitato QUESTO operaio come autista
  const greetedRef = useRef(false);
  const machinesAnnouncedRef = useRef("");

  const syncRole = useCallback(() => { try { setRole(localStorage.getItem(ROLE_KEY) || ""); } catch { /* */ } }, []);
  useEffect(() => {
    window.addEventListener("mikilab-role-changed", syncRole);
    return () => window.removeEventListener("mikilab-role-changed", syncRole);
  }, [syncRole]);

  // Abilita la vista "Giro consegne" solo agli operatori con abilita' autista (is_driver).
  useEffect(() => {
    if (!role) { setIsDriver(false); return; }
    let alive = true;
    coordinationApi.skills().then((d) => {
      if (!alive) return;
      const me = (d.operators || []).find((o) => (o.name || "").toLowerCase() === role.toLowerCase());
      setIsDriver(!!(me && me.is_driver));
    }).catch(() => {});
    return () => { alive = false; };
  }, [role]);

  // Rileva se il Capo ha attivato la MODALITÀ APPRENDISTA per questo operaio → Sitor cambia comportamento.
  useEffect(() => {
    if (!role) { setApprentice(false); setMine(null); return; }
    let alive = true;
    const check = () => deptApi.assignment().then((d) => {
      if (!alive) return;
      const mine = (d.assignments || []).find((a) => (a.operator || "").toLowerCase() === role.toLowerCase());
      setApprentice(!!(mine && mine.apprentice));
      setMine(mine || null);
    }).catch(() => {});
    check(); const id = setInterval(check, 30000);
    return () => { alive = false; clearInterval(id); };
  }, [role]);

  // Auto-rilevamento chiamate del coordinamento: quando arriva una chiamata per questo
  // operaio, apre da solo la modalità cuffie così può confermare/rifiutare a voce.
  useEffect(() => {
    if (!role) return;
    let alive = true;
    const poll = () => coordinationApi.pendingCall(role).then((d) => {
      if (!alive) return;
      if (d && d.has_call) setShowHeadphones(true);
    }).catch(() => {});
    poll(); const id = setInterval(poll, 12000);
    return () => { alive = false; clearInterval(id); };
  }, [role]);

  // Sitor annuncia a VOCE (cuffie Bluetooth) — l'operaio non usa le mani, ascolta e basta.
  useEffect(() => {
    if (!role || greetedRef.current || supervise) return;
    greetedRef.current = true;
    const msg = apprentice
      ? tri(
        `Ciao ${role}. Oggi lavori in modalità apprendistato: ti guido a voce un passaggio alla volta. Prima domanda: hai già lavato le mani e indossato il grembiule?`,
        `Hallo ${role}. Heute im Ausbildungsmodus: ich führe dich Schritt für Schritt per Stimme. Hände gewaschen und Schürze angelegt?`,
        `Hello ${role}. Today you work in training mode: I'll guide you by voice one step at a time. First question: have you washed your hands and put on your apron?`,
        `Hola ${role}. Hoy en modo aprendizaje: te guío por voz paso a paso. ¿Manos lavadas y delantal puesto?`,
        `Bonjour ${role}. Aujourd'hui en mode apprentissage : je te guide à la voix étape par étape. Mains lavées et tablier mis ?`,
        `سلام ${role}. امروز در حالت آموزش کار می‌کنی: قدم‌به‌قدم راهنمایی‌ات می‌کنم. دست‌ها را شستی و پیش‌بند پوشیدی؟`)
      : tri(
        `Ciao ${role}. Ti leggo il piano di oggi a voce, così puoi lavorare senza guardare lo schermo.`,
        `Hallo ${role}. Ich lese dir den Tagesplan vor, damit du ohne Blick auf den Bildschirm arbeiten kannst.`,
        `Hello ${role}. I will read you today's plan aloud so you can work without looking at the screen.`,
        `Hola ${role}. Te leo el plan de hoy en voz alta para que trabajes sin mirar la pantalla.`,
        `Bonjour ${role}. Je te lis le plan du jour à voix haute pour travailler sans regarder l'écran.`,
        `سلام ${role}. برنامه امروز را برایت می‌خوانم تا بدون نگاه به صفحه کار کنی.`);
    try { playTTS(msg, { lang, voice: "nexus" }); } catch { /* */ }
  }, [apprentice, role, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  // Punto 4: quando l'operaio entra nel reparto, Sitor annuncia anche lo stato delle macchine collegate.
  useEffect(() => {
    if (supervise || !role || !mine || !mine.dept) return;
    if (machinesAnnouncedRef.current === mine.dept) return;
    machinesAnnouncedRef.current = mine.dept;
    const sw = (st) => (st === "attiva"
      ? tri("attiva", "aktiv", "active", "activa", "active", "فعال")
      : tri("in manutenzione", "in Wartung", "in maintenance", "en mantenimiento", "en maintenance", "در تعمیر"));
    deptApi.machinesGet(mine.dept).then((d) => {
      const on = (d.machines || []).filter((m) => m.status && m.status !== "spenta");
      if (!on.length) return;
      const phrase = on.map((m) => `${m.name} ${sw(m.status)}${m.value ? `, ${m.value}` : ""}`).join("; ");
      const msg = tri(
        `Stato macchine del reparto ${d.dept_name || ""}: ${phrase}.`,
        `Maschinenstatus der Abteilung ${d.dept_name || ""}: ${phrase}.`,
        `Machine status for department ${d.dept_name || ""}: ${phrase}.`,
        `Estado de las máquinas del área ${d.dept_name || ""}: ${phrase}.`,
        `État des machines du rayon ${d.dept_name || ""} : ${phrase}.`,
        `وضعیت ماشین‌های بخش ${d.dept_name || ""}: ${phrase}.`);
      setTimeout(() => { try { playTTS(msg, { lang, voice: "nexus" }); } catch { /* */ } }, 2800);
    }).catch(() => {});
  }, [mine, role, supervise, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div data-testid="floor-operator-day" className="space-y-4">
      {!role && !supervise && (
        <FloorNameEntry tri={tri} onSet={(nm) => { try { localStorage.setItem(ROLE_KEY, nm); } catch { /* */ } try { window.dispatchEvent(new CustomEvent("mikilab-role-changed", { detail: { role: nm } })); } catch { /* */ } setRole(nm); }} />
      )}
      {supervise && (
        <div data-testid="supervise-banner" className="rounded-2xl border-2 border-border/50 bg-muted/10 px-4 py-3">
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">{tri("Supervisione Direzione · sola lettura", "Chef-Aufsicht · nur Lesen", "Capo supervision · read-only", "Supervisión · solo lectura", "Supervision · lecture seule", "نظارت · فقط خواندن")}</p>
          <p className="text-base text-foreground font-black leading-tight">{superviseDeptName || superviseDept}</p>
        </div>
      )}
      {/* Sitor parla direttamente con l'operaio */}
      <div className={`flex items-center gap-3 rounded-2xl border p-4 ${apprentice ? "border-amber-500/60 bg-amber-500/8" : "border-amber-500/40 bg-background"}`}>
        <button type="button" data-testid="sitor-card-open" onClick={() => setShowSitorCard(true)}
          className="w-14 h-14 rounded-xl overflow-hidden border-2 border-amber-500/60 shrink-0 active:scale-95 transition-transform"
          aria-label={tri("Apri la scheda di Sitor", "Sitor-Karte öffnen", "Open Sitor's card", "Abrir ficha de Sitor", "Ouvrir la fiche de Sitor", "کارت سیتور را باز کن")}>
          <LivingAvatar3D src={`${PUB}/sitor_official.jpg`} accent="hsl(var(--muted-foreground))" nexus className="w-full h-full" />
        </button>
        <div className="min-w-0">
          <p className="text-sm font-black text-foreground uppercase tracking-wide flex items-center gap-2">Sitor
            {apprentice && <span data-testid="floor-appr-badge" className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/50"><GraduationCap className="w-3 h-3" /> {tri("Modalità apprendista", "Lehrlingsmodus", "Apprentice mode", "Modo aprendiz", "Mode apprenti", "حالت کارآموز")}</span>}
          </p>
          <p className="text-[12px] text-muted-foreground leading-snug">{!role
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

      {/* Widget condivisi dal Capo + collegamento macchine del reparto */}
      <SharedWidgets
        dept={supervise ? (superviseDeptName || superviseDept) : (mine ? (mine.dept_name || mine.dept || "") : "")}
        deptKey={supervise ? superviseDept : (mine ? (mine.dept || "") : "")}
        readOnly={supervise}
        operator={role}
      />

      {/* Sempre disponibili: chiedi aiuto + analizzatore foto */}
      <SosButton role={role} operator={role} />
      <AskHelpButton operator={role} dept={mine?.dept || ""} />
      <SitorPhotoAnalyzer tri={tri} lang={lang} />

      {/* Cuffie hands-free: ascolto continuo "Sitor…" mentre le mani sono occupate */}
      <button data-testid="floor-headphones-btn" onClick={() => setShowHeadphones(true)}
        className="w-full flex items-center justify-center gap-2.5 bg-primary hover:bg-muted text-white font-black px-4 py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-98 transition-all">
        <Headphones className="w-5 h-5" /> {tri("Cuffie · Mani libere", "Kopfhörer · Freihändig", "Headphones · Hands-free", "Auriculares · Manos libres", "Casque · Mains libres", "هدفون · بدون دست")}
      </button>

      {/* Registra produzione: prodotto/avanzato → compila la chiusura del Capo */}
      <FloorProductionLog tri={tri} />

      {/* Giro consegne di oggi — solo per gli operatori abilitati come autisti */}
      {isDriver && (
        <div className="rounded-2xl border border-primary/30 bg-card px-4 py-3">
          <DriverRun />
        </div>
      )}

      {showHeadphones && <HeadphonesMode lang={lang} tri={tri} operator={role} dept={mine?.dept || ""} onClose={() => setShowHeadphones(false)} />}


      {/* Ricettario & Corsi passo-passo di Sitor — anche per la produzione */}
      <div className="rounded-2xl border border-border/25 bg-background/60 overflow-hidden">
        <button data-testid="floor-recipes-toggle" onClick={() => setShowRecipes((v) => !v)}
          className="w-full flex items-center gap-2.5 px-4 py-3 text-left active:scale-[0.99] transition-transform">
          <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-black text-foreground">{tri("Ricettario & Corsi", "Rezepte & Kurse", "Recipes & Courses", "Recetario & Cursos", "Recettes & Cours", "دستورها و دوره‌ها")}</span>
            <span className="block text-[11px] text-muted-foreground">{tri("Apri una ricetta e leggi il corso passo-passo di Sitor.", "Öffne ein Rezept und lies Sitors Schritt-für-Schritt-Kurs.", "Open a recipe and read Sitor's step-by-step course.", "Abre una receta y lee el curso paso a paso.", "Ouvre une recette et lis le cours pas à pas.", "یک دستور را باز کن و دوره گام‌به‌گام سیتور را بخوان.")}</span>
          </span>
          <GraduationCap className={`w-4 h-4 shrink-0 transition-colors ${showRecipes ? "text-primary" : "text-muted-foreground"}`} />
        </button>
        {showRecipes && (
          <div data-testid="floor-recipes-panel" className="border-t border-border/15">
            <p data-testid="floor-recipes-hint" className="px-4 pt-3 text-[11px] text-muted-foreground leading-snug">
              {tri("Se l'elenco appare vuoto, entra con il PIN del tuo reparto per vedere le ricette e i corsi.",
                   "Wenn die Liste leer ist, melde dich mit deiner Bereichs-PIN an, um Rezepte und Kurse zu sehen.",
                   "If the list looks empty, enter with your department PIN to see recipes and courses.",
                   "Si la lista está vacía, entra con el PIN de tu área para ver recetas y cursos.",
                   "Si la liste est vide, entre avec le PIN de ton rayon pour voir les recettes et cours.",
                   "اگر فهرست خالی است، با پین بخش خود وارد شو تا دستورها و دوره‌ها را ببینی.")}
            </p>
            <RecipeList collectionName="mikilab" readOnly hideHero />
          </div>
        )}
      </div>

      {/* Fine turno */}
      <EndOfShiftForm tri={tri} role={role} />
      <div className="pt-2 text-center space-y-1.5">
        <PrivacyLink />
        <NotForSaleNote />
      </div>
      {showSitorCard && <SitorCard tri={tri} onClose={() => setShowSitorCard(false)} />}
    </div>
  );
}
