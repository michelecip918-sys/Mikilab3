import { useEffect, useState, useCallback, useRef } from "react";
import { Power, Cpu, UserCheck, Radio, ScrollText, CheckCircle2, XCircle, Clock3, AlertTriangle, Truck } from "lucide-react";
import { toast } from "sonner";
import { coordinationApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const COPPER = "hsl(var(--primary))";
const SAGE = "hsl(var(--accent))";

// Coordinamento automatico del team: presenza Capo, soglia macchina, abilitazioni multi-reparto,
// chiamate/proposte in tempo reale e registro decisioni.
export default function TeamCoordination() {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [settings, setSettings] = useState(null);
  const [skills, setSkills] = useState(null);
  const [depts, setDepts] = useState([]);
  const [active, setActive] = useState([]);
  const [log, setLog] = useState([]);
  const [capoPresent, setCapoPresent] = useState(false);
  const [savingName, setSavingName] = useState("");
  const [roster, setRoster] = useState({ operators: [], free: 0, busy: 0, total: 0 });
  const [logFilter, setLogFilter] = useState("all"); // all | accepted | declined
  const seenUncovered = useRef(null);

  const loadActive = useCallback(() => {
    coordinationApi.active().then((d) => {
      const calls = d.calls || [];
      setActive(calls); setCapoPresent(!!d.capo_present_effective);
      // Notifica al Capo: chiamata rimasta SCOPERTA (tutti hanno rifiutato)
      const unc = calls.filter((c) => c.status === "uncovered").map((c) => c.id);
      if (seenUncovered.current === null) { seenUncovered.current = new Set(unc); }
      else {
        for (const c of calls.filter((c) => c.status === "uncovered")) {
          if (!seenUncovered.current.has(c.id)) {
            seenUncovered.current.add(c.id);
            toast.error(tri(`Scoperto: "${c.task_desc}" — tutti hanno rifiutato`, `Unbesetzt: "${c.task_desc}"`, `Uncovered: "${c.task_desc}" — all declined`, `Sin cubrir: "${c.task_desc}"`, `Non couvert : "${c.task_desc}"`, `بدون پوشش: "${c.task_desc}"`), { duration: 8000 });
          }
        }
      }
    }).catch(() => {});
    coordinationApi.roster().then((d) => setRoster(d)).catch(() => {});
  }, []); // eslint-disable-line

  useEffect(() => {
    coordinationApi.settings().then((s) => { setSettings(s); setCapoPresent(!!s.capo_present_effective); }).catch(() => {});
    coordinationApi.skills().then((d) => { setSkills(d.operators || []); setDepts(d.departments || []); }).catch(() => {});
    coordinationApi.log().then((d) => setLog(d.decisions || [])).catch(() => {});
    loadActive();
    const t = setInterval(loadActive, 8000);
    // heartbeat presenza Capo (fallback automatico)
    const hb = setInterval(() => coordinationApi.heartbeat(), 60000);
    coordinationApi.heartbeat();
    return () => { clearInterval(t); clearInterval(hb); };
  }, [loadActive]);

  const patchSettings = (payload) => {
    coordinationApi.saveSettings(payload).then((s) => { setSettings(s); setCapoPresent(!!s.capo_present_effective);
      toast.success(tri("Impostazioni aggiornate", "Aktualisiert", "Settings updated", "Actualizado", "Mis à jour", "به‌روزرسانی شد")); }).catch(() => toast.error("Errore"));
  };

  const toggleDept = (op, key) => {
    const cur = op.departments || [];
    const next = cur.includes(key) ? cur.filter((d) => d !== key) : [...cur, key];
    setSavingName(op.name);
    coordinationApi.saveSkills(op.name, next, op.is_driver).then(() => {
      setSkills((prev) => prev.map((o) => o.name === op.name ? { ...o, departments: next } : o));
    }).catch(() => toast.error("Errore")).finally(() => setSavingName(""));
  };

  const toggleDriver = (op) => {
    coordinationApi.saveSkills(op.name, op.departments || [], !op.is_driver).then(() => {
      setSkills((prev) => prev.map((o) => o.name === op.name ? { ...o, is_driver: !op.is_driver } : o));
    }).catch(() => toast.error("Errore"));
  };

  const confirmProp = (id) => coordinationApi.confirmProposal(id).then(() => { toast.success(tri("Chiamata avviata", "Ruf gestartet", "Call started", "Llamada iniciada", "Appel lancé", "تماس آغاز شد")); loadActive(); }).catch(() => toast.error("Errore"));
  const changeProp = (id, operator) => coordinationApi.changeProposal(id, operator).then(() => { loadActive(); }).catch(() => toast.error("Errore"));

  if (!settings) return <div className="text-sm text-muted-foreground p-2">…</div>;

  const s = settings;
  const proposals = active.filter((c) => c.status === "proposed");
  const pending = active.filter((c) => c.status === "pending");
  const uncovered = active.filter((c) => c.status === "uncovered");

  return (
    <div data-testid="team-coordination" className="space-y-5">

      {/* Interruttore generale + roster live libero/occupato */}
      <div className="rounded-xl bg-card border border-border p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Power className="w-4 h-4" style={{ color: s.enabled ? SAGE : "hsl(var(--muted-foreground))" }} />
            <h4 className="text-sm font-black text-foreground uppercase tracking-wide">{tri("Coordinamento automatico", "Automatische Koordination", "Automatic coordination", "Coordinación automática", "Coordination automatique", "هماهنگی خودکار")}</h4>
          </div>
          <button type="button" role="switch" aria-checked={!!s.enabled} data-testid="coord-enabled-toggle"
            onClick={() => patchSettings({ enabled: !s.enabled })}
            className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${s.enabled ? "bg-accent" : "bg-secondary"}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-card transition-transform ${s.enabled ? "translate-x-5" : ""}`} />
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">{tri("Quando è acceso, all'avvio di un evento di produzione Sitor chiama da solo un operatore libero (via cuffie) e passa al prossimo se rifiuta.", "Wenn an, ruft Sitor bei einem Produktionsereignis selbst einen freien Mitarbeiter.", "When on, on a production event Sitor calls a free operator by itself (headset) and moves on if declined.", "Cuando está activo, Sitor llama solo a un operario libre.", "Quand activé, Sitor appelle seul un opérateur libre.", "وقتی روشن است، سیتور خودش یک اپراتور آزاد را صدا می‌زند.")}</p>
        <div className="flex items-center gap-3 mb-2 text-[11px]">
          <span className="inline-flex items-center gap-1.5 text-accent font-bold"><span className="w-2 h-2 rounded-full bg-accent" /> {tri("Liberi", "Frei", "Free", "Libres", "Libres", "آزاد")}: {roster.free}</span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground font-bold"><span className="w-2 h-2 rounded-full bg-muted" /> {tri("Occupati", "Beschäftigt", "Busy", "Ocupados", "Occupés", "مشغول")}: {roster.busy}</span>
          <span className="text-muted-foreground">· {roster.total} {tri("in turno", "im Dienst", "on shift", "en turno", "en service", "در شیفت")}</span>
        </div>
        <div data-testid="coord-roster" className="flex flex-wrap gap-1.5">
          {roster.operators.length === 0 && <span className="text-[11px] text-muted-foreground">{tri("Nessun operatore nel turno di oggi.", "Keine Mitarbeiter heute.", "No operators on today's shift.", "Sin operarios hoy.", "Aucun opérateur aujourd'hui.", "امروز اپراتوری نیست.")}</span>}
          {roster.operators.map((o) => {
            const busy = o.status === "busy";
            return (
              <span key={o.name} data-testid={`roster-${o.name}`} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${busy ? "bg-background text-muted-foreground border-primary/40" : "bg-background text-muted-foreground border-accent/40"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${busy ? "bg-muted" : "bg-accent animate-pulse"}`} />{o.name}
              </span>
            );
          })}
        </div>
      </div>

      {/* Presenza Capo + soglia macchina */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Power className="w-4 h-4" style={{ color: COPPER }} />
            <h4 className="text-sm font-black text-foreground uppercase tracking-wide">{tri("Presenza Direzione", "Anwesenheit Leitung", "Direction presence", "Presencia Dirección", "Présence Direction", "حضور مدیریت")}</h4>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">{tri("Se sei presente il sistema propone; se sei assente decide da solo e tiene il registro.", "Anwesend: Vorschlag. Abwesend: autonome Entscheidung + Protokoll.", "Present: proposes. Absent: decides on its own and keeps the log.", "Presente: propone. Ausente: decide solo y registra.", "Présent : propose. Absent : décide seul et journalise.", "حاضر: پیشنهاد. غایب: خودکار تصمیم و ثبت.")}</p>
          <div className="flex flex-wrap gap-2">
            <button data-testid="capo-present-btn" onClick={() => patchSettings({ capo_present_manual: true })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${capoPresent ? "text-foreground" : "text-muted-foreground border-border"}`}
              style={capoPresent ? { background: COPPER, borderColor: COPPER } : {}}>
              {tri("Sono in laboratorio", "Im Labor", "In the lab", "En el laboratorio", "Au labo", "در آزمایشگاه")}
            </button>
            <button data-testid="capo-absent-btn" onClick={() => patchSettings({ capo_present_manual: false })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${!capoPresent ? "bg-background text-muted-foreground border-primary/50" : "text-muted-foreground border-border"}`}>
              {tri("Sono assente", "Abwesend", "Away", "Ausente", "Absent", "غایب")}
            </button>
            <button data-testid="capo-auto-btn" onClick={() => patchSettings({ auto_mode: true })}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border text-muted-foreground border-border hover:text-foreground">
              {tri("Automatico", "Automatisch", "Automatic", "Automático", "Automatique", "خودکار")}
            </button>
          </div>
          <p className="mt-2 text-[11px]" style={{ color: capoPresent ? COPPER : "hsl(var(--muted-foreground))" }}>
            {tri("Stato attuale", "Aktuell", "Current", "Actual", "Actuel", "وضعیت")}: <b>{capoPresent ? tri("Presente", "Anwesend", "Present", "Presente", "Présent", "حاضر") : tri("Assente", "Abwesend", "Away", "Ausente", "Absent", "غایب")}</b>
          </p>
        </div>

        <div className="rounded-xl bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-4 h-4" style={{ color: SAGE }} />
            <h4 className="text-sm font-black text-foreground uppercase tracking-wide">{tri("Soglia macchina", "Maschinen-Schwelle", "Machine threshold", "Umbral máquina", "Seuil machine", "آستانه ماشین")}</h4>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">{tri("Sopra queste quantità, se c'è una macchina libera, il sistema preferisce la macchina.", "Über diesen Mengen bevorzugt das System die Maschine.", "Above these quantities, if a machine is free, the system prefers it.", "Por encima de estas cantidades prefiere la máquina.", "Au-delà de ces quantités, il préfère la machine.", "بالای این مقادیر ماشین را ترجیح می‌دهد.")}</p>
          <div className="flex items-center gap-3">
            <label className="text-[11px] text-foreground flex items-center gap-1.5">kg
              <input data-testid="threshold-kg" type="number" min="0" defaultValue={s.machine_threshold_kg}
                onBlur={(e) => patchSettings({ machine_threshold_kg: parseFloat(e.target.value) || 0 })}
                className="w-20 rounded-md bg-background border border-border px-2 py-1 text-foreground text-sm" />
            </label>
            <label className="text-[11px] text-foreground flex items-center gap-1.5">{tri("pezzi", "Stück", "pieces", "piezas", "pièces", "عدد")}
              <input data-testid="threshold-pieces" type="number" min="0" defaultValue={s.machine_threshold_pieces}
                onBlur={(e) => patchSettings({ machine_threshold_pieces: parseInt(e.target.value) || 0 })}
                className="w-20 rounded-md bg-background border border-border px-2 py-1 text-foreground text-sm" />
            </label>
          </div>
        </div>
      </div>

      {/* Limite giornaliero richieste vocali per operatore */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center gap-2 mb-1">
          <Radio className="w-4 h-4 text-accent" />
          <h4 className="text-sm font-black text-foreground uppercase tracking-wide">{tri("Limite richieste vocali", "Sprach-Limit", "Voice request limit", "Límite de voz", "Limite vocale", "سقف درخواست صوتی")}</h4>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">{tri("Massimo richieste vocali a Sitor per operatore al giorno. Superato il limite, Sitor risponde solo agli allarmi importanti. 0 = illimitato.", "Max. Sprachanfragen pro Mitarbeiter/Tag. 0 = unbegrenzt.", "Max voice requests per operator per day. Over the limit Sitor only answers critical alerts. 0 = unlimited.", "Máximo de peticiones por operario/día. 0 = ilimitado.", "Nombre max de requêtes par opérateur/jour. 0 = illimité.", "حداکثر درخواست روزانه هر اپراتور. ۰ = نامحدود.")}</p>
        <label className="text-[11px] text-foreground flex items-center gap-1.5">{tri("richieste/giorno", "Anfragen/Tag", "requests/day", "peticiones/día", "requêtes/jour", "درخواست/روز")}
          <input data-testid="voice-daily-limit" type="number" min="0" defaultValue={s.voice_daily_limit || 0}
            onBlur={(e) => patchSettings({ voice_daily_limit: parseInt(e.target.value) || 0 })}
            className="w-20 rounded-md bg-background border border-border px-2 py-1 text-foreground text-sm" />
        </label>
      </div>
      {(proposals.length > 0 || pending.length > 0 || uncovered.length > 0) && (
        <div className="rounded-xl bg-card border border-border p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1"><Radio className="w-4 h-4" style={{ color: COPPER }} /><h4 className="text-sm font-black text-foreground uppercase tracking-wide">{tri("In corso", "Laufend", "In progress", "En curso", "En cours", "در جریان")}</h4></div>
          {proposals.map((c) => (
            <div key={c.id} data-testid={`coord-proposal-${c.id}`} className="rounded-lg bg-background border border-primary/30 p-3 flex flex-wrap items-center gap-2">
              <span className="text-[13px] text-foreground font-bold flex-1 min-w-0">{c.task_desc} · <span style={{ color: COPPER }}>{c.proposed_operator}</span></span>
              <button data-testid={`coord-confirm-${c.id}`} onClick={() => confirmProp(c.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-foreground" style={{ background: COPPER }}>{tri("Conferma", "Bestätigen", "Confirm", "Confirmar", "Confirmer", "تأیید")}</button>
              <select data-testid={`coord-change-${c.id}`} onChange={(e) => e.target.value && changeProp(c.id, e.target.value)} defaultValue="" className="rounded-lg bg-card border border-border text-xs text-foreground px-2 py-1.5">
                <option value="" disabled>{tri("Cambia", "Ändern", "Change", "Cambiar", "Changer", "تغییر")}</option>
                {(c.queue || []).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          ))}
          {pending.map((c) => (
            <div key={c.id} data-testid={`coord-pending-${c.id}`} className="rounded-lg bg-background border border-accent/30 p-3 flex items-center gap-2">
              <Clock3 className="w-4 h-4 animate-pulse" style={{ color: SAGE }} />
              <span className="text-[13px] text-foreground flex-1 min-w-0">{c.task_desc} → <b style={{ color: SAGE }}>{c.current_operator}</b> <span className="text-[11px] text-muted-foreground">({tri("in attesa di risposta", "wartet", "awaiting reply", "esperando", "en attente", "منتظر پاسخ")})</span></span>
            </div>
          ))}
          {uncovered.map((c) => (
            <div key={c.id} data-testid={`coord-uncovered-${c.id}`} className="rounded-lg bg-background border border-mattone/50 p-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              <span className="text-[13px] text-foreground flex-1">{tri("Task scoperto", "Unbesetzt", "Uncovered task", "Sin cubrir", "Non couvert", "بدون پوشش")}: <b>{c.task_desc}</b> — {tri("serve il tuo intervento", "Eingreifen nötig", "you need to step in", "necesita intervención", "intervention requise", "نیاز به دخالت")}</span>
            </div>
          ))}
        </div>
      )}

      {/* Abilitazioni multi-reparto */}
      <div className="rounded-xl bg-card border border-border p-4">
        <div className="flex items-center gap-2 mb-3"><UserCheck className="w-4 h-4" style={{ color: SAGE }} /><h4 className="text-sm font-black text-foreground uppercase tracking-wide">{tri("Abilitazioni operatori", "Freigaben", "Operator skills", "Habilitaciones", "Habilitations", "مهارت‌ها")}</h4></div>
        <div className="space-y-2">
          {(skills || []).map((op) => (
            <div key={op.name} data-testid={`skill-row-${op.name}`} className="rounded-lg bg-background border border-border p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[13px] font-bold text-foreground">{op.name}</span>
                <span className="text-[11px] text-muted-foreground">{op.position}</span>
                <button data-testid={`driver-toggle-${op.name}`} onClick={() => toggleDriver(op)} title={tri("Abilita come autista", "Als Fahrer", "Enable as driver", "Habilitar como chofer", "Activer chauffeur", "راننده")}
                  className={`ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border ${op.is_driver ? "text-foreground border-transparent" : "text-muted-foreground border-border"}`}
                  style={op.is_driver ? { background: SAGE } : {}}>
                  <Truck className="w-3 h-3" /> {tri("Autista", "Fahrer", "Driver", "Chofer", "Chauffeur", "راننده")}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {depts.map((d) => {
                  const on = (op.departments || []).includes(d.key);
                  return (
                    <button key={d.key} data-testid={`skill-${op.name}-${d.key}`} onClick={() => toggleDept(op, d.key)} disabled={savingName === op.name}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${on ? "text-foreground border-transparent" : "text-muted-foreground border-border"}`}
                      style={on ? { background: SAGE } : {}}>
                      {d.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Registro decisioni */}
      <div className="rounded-xl bg-card border border-border p-4">
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2"><ScrollText className="w-4 h-4" style={{ color: COPPER }} /><h4 className="text-sm font-black text-foreground uppercase tracking-wide">{tri("Registro decisioni", "Entscheidungsprotokoll", "Decisions log", "Registro de decisiones", "Journal des décisions", "ثبت تصمیم‌ها")}</h4></div>
          <div className="flex gap-1">
            {[["all", tri("Tutti", "Alle", "All", "Todos", "Tous", "همه")], ["accepted", tri("Accettati", "Angenommen", "Accepted", "Aceptados", "Acceptés", "پذیرفته")], ["declined", tri("Rifiutati", "Abgelehnt", "Declined", "Rechazados", "Refusés", "ردشده")]].map(([k, label]) => (
              <button key={k} data-testid={`log-filter-${k}`} onClick={() => setLogFilter(k)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${logFilter === k ? "bg-primary/20 border-primary/50 text-muted-foreground" : "border-border text-muted-foreground"}`}>{label}</button>
            ))}
          </div>
        </div>
        {(() => {
          const filtered = (log || []).filter((d) => logFilter === "all" ? true : logFilter === "accepted" ? (d.kind === "accepted" || d.kind === "assigned_operator") : (d.kind === "declined" || d.kind === "uncovered"));
          return filtered.length === 0 ? (
            <p data-testid="log-empty" className="text-[12px] text-muted-foreground">{tri("Nessuna decisione.", "Keine.", "No decisions.", "Sin decisiones.", "Aucune.", "چیزی نیست.")}</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {filtered.slice(0, 40).map((d) => (
                <div key={d.id} data-testid={`coord-log-${d.id}`} className="flex items-center gap-2 text-[12px]">
                  {(d.kind === "assigned_operator" || d.kind === "accepted") && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: SAGE }} />}
                  {d.kind === "assigned_machine" && <Cpu className="w-3.5 h-3.5 shrink-0" style={{ color: COPPER }} />}
                  {(d.kind === "uncovered" || d.kind === "declined") && <XCircle className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />}
                  <span className="text-foreground flex-1 min-w-0 truncate">
                    <b className="text-foreground">{d.operator || d.machine || ""}</b>
                    {d.kind === "accepted" && <span className="text-accent"> {tri("ha accettato", "hat angenommen", "accepted", "aceptó", "a accepté", "پذیرفت")}</span>}
                    {d.kind === "declined" && <span className="text-muted-foreground"> {tri("ha rifiutato", "hat abgelehnt", "declined", "rechazó", "a refusé", "رد کرد")}</span>}
                    {d.kind === "uncovered" && <span className="text-muted-foreground"> {tri("scoperto", "unbesetzt", "uncovered", "sin cubrir", "non couvert", "بدون پوشش")}</span>}
                    {" · "}<span className="text-muted-foreground">{d.task_desc}</span> {d.auto ? <span className="text-[10px] text-ambra">· AUTO</span> : null}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{(d.at || "").slice(11, 16)}</span>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
