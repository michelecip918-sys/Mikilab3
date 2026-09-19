import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cog, Sparkles, Loader2, Volume2, ShieldAlert, Wrench, Plug, CheckCircle2, Trash2, PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { deusApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

export default function MachineArrival() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [machines, setMachines] = useState([]);
  const [counts, setCounts] = useState({ total: 0, new_arrivals: 0, active: 0 });
  const [justArrived, setJustArrived] = useState(null);

  const speak = (t) => { try { if (t) playTTS(t, { lang, voice: "bakemix" }); } catch { /* */ } };

  const load = useCallback(() => {
    deusApi.machines().then((d) => { setMachines(d.machines || []); setCounts(d.counts || { total: 0, new_arrivals: 0, active: 0 }); }).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const recognize = async () => {
    if (!name.trim()) return;
    setBusy(true); setJustArrived(null);
    try {
      const r = await deusApi.machineArrival({ name, notes, lang });
      setJustArrived(r.machine);
      setCounts(r.counts);
      setName(""); setNotes("");
      speak(r.machine.welcome);
      toast.success(tri(`Nuovo arrivato: ${r.machine.name}`, `Neuzugang: ${r.machine.name}`, `New arrival: ${r.machine.name}`, `Nuevo: ${r.machine.name}`, `Nouveau: ${r.machine.name}`, `تازه‌وارد: ${r.machine.name}`), { icon: "⚙️" });
      load();
    } catch {
      toast.error(tri("Sitor non risponde.", "Sitor antwortet nicht.", "Sitor not responding.", "Sitor no responde.", "Sitor ne répond pas.", "Sitor پاسخ نمی‌دهد."));
    } finally { setBusy(false); }
  };

  const commission = async (m) => { await deusApi.machineCommission(m.id).then((d) => setCounts(d.counts)).catch(() => {}); load(); };
  const remove = async (m) => { await deusApi.machineDelete(m.id).then((d) => setCounts(d.counts)).catch(() => {}); if (justArrived && justArrived.id === m.id) setJustArrived(null); load(); };

  const Card = ({ m }) => (
    <div data-testid={`machine-card-${m.id}`} className={`rounded-2xl border p-4 ${m.status === "new" ? "border-border/50 bg-muted/5" : "border-border bg-background"}`}>
      <div className="flex items-start gap-2.5">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${m.status === "new" ? "bg-muted/15 border border-border/40 text-muted-foreground" : "bg-muted/10 border border-border/30 text-muted-foreground"}`}><Cog className="w-4.5 h-4.5" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-foreground text-sm truncate">{m.name}</p>
            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted/10 text-muted-foreground border border-border/20">{m.category}</span>
            {m.status === "new"
              ? <span data-testid={`machine-badge-new-${m.id}`} className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted/20 text-muted-foreground border border-border/40 animate-pulse">{tri("Nuovo arrivo", "Neuzugang", "New arrival", "Nuevo", "Nouveau", "تازه‌وارد")}</span>
              : <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/40">{tri("In linea", "In Betrieb", "In line", "En línea", "En ligne", "در خط")}</span>}
          </div>
          {m.role && <p className="text-[11px] text-muted-foreground mt-0.5">{m.role}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {m.status === "new" && (
            <button data-testid={`machine-commission-${m.id}`} onClick={() => commission(m)} title={tri("Metti in linea", "In Betrieb nehmen", "Put in line", "Poner en línea", "Mettre en ligne", "به خط ببر")}
              className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/40 text-accent flex items-center justify-center active:scale-95"><CheckCircle2 className="w-4 h-4" /></button>
          )}
          <button data-testid={`machine-delete-${m.id}`} onClick={() => remove(m)} className="w-8 h-8 rounded-lg bg-background border border-border text-muted-foreground hover:text-rose-400 flex items-center justify-center active:scale-95"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
      {m.welcome && (
        <div className="flex items-start gap-2 mt-2.5 pt-2.5 border-t border-border">
          <button onClick={() => speak(m.welcome)} className="shrink-0 w-7 h-7 rounded-lg bg-muted/10 border border-border/40 text-muted-foreground flex items-center justify-center active:scale-95"><Volume2 className="w-3.5 h-3.5" /></button>
          <p className="text-xs text-foreground italic leading-relaxed">“{m.welcome}”</p>
        </div>
      )}
      {(m.safety?.length || m.maintenance?.length || m.integration) && (
        <div className="grid sm:grid-cols-2 gap-2 mt-2.5 text-[11px]">
          {m.safety?.length > 0 && (
            <div><p className="flex items-center gap-1 font-bold text-rose-300 mb-1"><ShieldAlert className="w-3.5 h-3.5" /> {tri("Sicurezza", "Sicherheit", "Safety", "Seguridad", "Sécurité", "ایمنی")}</p>{m.safety.map((s, k) => <p key={k} className="text-foreground flex gap-1"><span className="text-rose-400">•</span>{s}</p>)}</div>
          )}
          {m.maintenance?.length > 0 && (
            <div><p className="flex items-center gap-1 font-bold text-muted-foreground mb-1"><Wrench className="w-3.5 h-3.5" /> {tri("Manutenzione", "Wartung", "Maintenance", "Mantenimiento", "Entretien", "نگهداری")}</p>{m.maintenance.map((s, k) => <p key={k} className="text-foreground flex gap-1"><span className="text-muted-foreground">•</span>{s}</p>)}</div>
          )}
          {m.integration && (
            <div className="sm:col-span-2"><p className="flex items-center gap-1 font-bold text-accent mb-1"><Plug className="w-3.5 h-3.5" /> {tri("Integrazione", "Integration", "Integration", "Integración", "Intégration", "یکپارچگی")}</p><p className="text-foreground">{m.integration}</p></div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div data-testid="machine-arrival" className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/10 border border-border/30 text-muted-foreground text-xs font-black" data-testid="machine-count-total"><Cog className="w-3.5 h-3.5" /> {counts.total} {tri("in impianto", "im Werk", "in plant", "en planta", "en usine", "در کارخانه")}</span>
        {counts.new_arrivals > 0 && <span data-testid="machine-count-new" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/15 border border-border/40 text-muted-foreground text-xs font-black animate-pulse"><Sparkles className="w-3.5 h-3.5" /> {counts.new_arrivals} {tri("nuovi arrivi", "Neuzugänge", "new arrivals", "nuevos", "nouveaux", "تازه‌وارد")}</span>}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/30 text-accent text-xs font-black">{counts.active} {tri("in linea", "in Betrieb", "in line", "en línea", "en ligne", "در خط")}</span>
      </div>

      <div className="rounded-2xl bg-background border border-border p-4 space-y-2">
        <p className="text-[11px] text-muted-foreground">{tri("È arrivato un macchinario nuovo? Sitor lo riconosce — anche se è un tipo mai visto — e lo integra in produzione.", "Neue Maschine eingetroffen? Sitor erkennt sie — auch unbekannte Typen — und integriert sie.", "A new machine arrived? Sitor recognizes it — even an unseen type — and integrates it into production.", "¿Llegó una máquina nueva? Sitor la reconoce e integra.", "Une nouvelle machine ? Sitor la reconnaît et l'intègre.", "دستگاه جدید آمد؟ Sitor آن را می‌شناسد و ادغام می‌کند.")}</p>
        <input data-testid="machine-name-input" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") recognize(); }}
          placeholder={tri("Nome/tipo macchinario (es. Forno rotativo, Sfogliatrice…)", "Name/Typ (z.B. Stikkenofen, Ausrollmaschine…)", "Machine name/type (e.g. Rotary oven, Sheeter…)", "Nombre/tipo (ej. Horno rotativo…)", "Nom/type (ex. Four rotatif…)", "نام/نوع دستگاه")}
          className="w-full rounded-xl bg-background border border-border focus:border-border/60 outline-none text-sm text-foreground px-3 py-2.5" />
        <input data-testid="machine-notes-input" value={notes} onChange={(e) => setNotes(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") recognize(); }}
          placeholder={tri("Note (marca, potenza, capacità… opzionale)", "Notizen (Marke, Leistung… optional)", "Notes (brand, power, capacity… optional)", "Notas (opcional)", "Notes (optionnel)", "یادداشت (اختیاری)")}
          className="w-full rounded-xl bg-background border border-border focus:border-border/60 outline-none text-sm text-foreground px-3 py-2.5" />
        <button data-testid="machine-recognize-btn" onClick={recognize} disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-display font-black text-sm text-foreground active:scale-95 transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(90deg,hsl(var(--muted-foreground)),hsl(var(--muted-foreground)))", boxShadow: "0 0 20px rgba(138,151,166,0.35)" }}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackagePlus className="w-4 h-4" />}
          {busy ? tri("Sitor riconosce…", "Sitor erkennt…", "Sitor recognizing…", "Sitor reconoce…", "Sitor reconnaît…", "Sitor تشخیص می‌دهد…") : tri("Riconosci con Sitor", "Mit Sitor erkennen", "Recognize with Sitor", "Reconocer con Sitor", "Reconnaître avec Sitor", "با Sitor بشناس")}
        </button>
      </div>

      <AnimatePresence>
        {justArrived && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} data-testid="machine-just-arrived">
            <Card m={justArrived} />
          </motion.div>
        )}
      </AnimatePresence>

      {machines.length > 0 && (
        <div className="space-y-2">
          {machines.map((m) => <Card key={m.id} m={m} />)}
        </div>
      )}
    </div>
  );
}
