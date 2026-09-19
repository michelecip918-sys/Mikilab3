import { useEffect, useMemo, useState } from "react";
import { Users, Clock3, Lock, CircleDot, Plus, AlertTriangle, CalendarClock, X, ListChecks, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { delegationApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Plancia live: stato libero/occupato, compito + ETA, turno (ora/dopo), avviso ritardo,
// filtro reparto e assegnazione (prossimo compito o compito specifico). Aggiorna ogni 15s.
export default function OperatorStatusBoard() {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [data, setData] = useState(null);
  const [dept, setDept] = useState("all");
  const [assigning, setAssigning] = useState("");
  const [picker, setPicker] = useState(null); // { operator }
  const [pending, setPending] = useState([]);
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [histOpen, setHistOpen] = useState(false);
  const [hist, setHist] = useState(null);

  const load = () => delegationApi.workerBoard().then((d) => setData(d)).catch(() => {});

  useEffect(() => {
    let alive = true;
    const run = () => delegationApi.workerBoard().then((d) => { if (alive) setData(d); }).catch(() => {});
    run();
    const t = setInterval(run, 15000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const board = useMemo(() => (data && data.board) || [], [data]);
  const totals = (data && data.totals) || { total: 0, busy: 0, free: 0, on_shift: 0, later: 0, late: 0 };
  const depts = useMemo(() => {
    const set = new Set();
    board.forEach((o) => { const p = (o.position || o.dept || "").trim(); if (p) set.add(p); });
    return Array.from(set).sort();
  }, [board]);

  const filtered = dept === "all" ? board : board.filter((o) => (o.position || o.dept || "") === dept);

  const assignNext = async (name) => {
    setAssigning(name);
    try {
      const r = await delegationApi.assignNext(name);
      if (r.assigned) toast.success(r.message || tri("Compito assegnato", "Aufgabe zugewiesen", "Task assigned", "Tarea asignada", "Tâche assignée", "وظیفه محول شد"));
      else toast.info(r.message || tri("Nessun compito pendente", "Keine Aufgabe", "No pending task", "Sin tareas", "Aucune tâche", "وظیفه‌ای نیست"));
      await load();
    } catch {
      toast.error(tri("Assegnazione non riuscita", "Zuweisung fehlgeschlagen", "Assignment failed", "Fallo al asignar", "Échec assignation", "خطا در انتساب"));
    }
    setAssigning("");
  };

  const openPicker = async (name) => {
    setPicker({ operator: name });
    setLoadingSteps(true);
    try {
      const r = await delegationApi.pendingSteps();
      setPending((r && r.steps) || []);
    } catch { setPending([]); }
    setLoadingSteps(false);
  };

  const assignSpecific = async (task_id, step_order) => {
    const op = picker.operator;
    try {
      const r = await delegationApi.assignStep(op, task_id, step_order);
      if (r.assigned) toast.success(r.message || tri("Compito assegnato", "Zugewiesen", "Assigned", "Asignado", "Assigné", "محول شد"));
      else toast.info(r.message || tri("Non assegnabile", "Nicht möglich", "Not assignable", "No asignable", "Non assignable", "قابل انتساب نیست"));
    } catch {
      toast.error(tri("Assegnazione non riuscita", "Fehlgeschlagen", "Assignment failed", "Fallo", "Échec", "خطا"));
    }
    setPicker(null);
    await load();
  };

  const reassign = async (name) => {
    setAssigning(name);
    try {
      const r = await delegationApi.reassign(name);
      toast.success(tri(`Compito passato a ${r.to || "prossimo libero"}`, `Aufgabe an ${r.to} übergeben`, `Task handed to ${r.to || "next free"}`, `Tarea pasada a ${r.to}`, `Tâche transmise à ${r.to}`, `وظیفه به ${r.to} داده شد`));
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || tri("Riassegnazione non riuscita", "Fehlgeschlagen", "Reassign failed", "Fallo", "Échec", "خطا"));
    }
    setAssigning("");
  };

  const toggleHist = async () => {
    const nv = !histOpen;
    setHistOpen(nv);
    if (nv && !hist) {
      try { setHist(await delegationApi.delaysHistory(7)); } catch { setHist({ ranking: [], total_events: 0 }); }
    }
  };

  return (
    <div data-testid="operator-status-board" className="rounded-2xl border border-border/25 bg-background/70 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Users className="w-4 h-4 text-muted-foreground" />
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          {tri("Plancia operatori · live", "Bediener-Tafel · live", "Operator board · live", "Panel de operadores · en vivo", "Tableau opérateurs · live", "تابلوی اپراتورها · زنده")}
        </span>
        <span className="ml-auto inline-flex items-center gap-2 text-[11px] flex-wrap justify-end">
          <span className="inline-flex items-center gap-1 text-primary"><CircleDot className="w-3 h-3" />{totals.free} {tri("liberi", "frei", "free", "libres", "libres", "آزاد")}</span>
          <span className="inline-flex items-center gap-1 text-ambra"><CircleDot className="w-3 h-3" />{totals.busy} {tri("occupati", "belegt", "busy", "ocupados", "occupés", "مشغول")}</span>
          {totals.late > 0 && <span data-testid="board-late-count" className="inline-flex items-center gap-1 text-muted-foreground font-bold"><AlertTriangle className="w-3 h-3" />{totals.late} {tri("in ritardo", "verspätet", "late", "con retraso", "en retard", "با تأخیر")}</span>}
        </span>
      </div>

      {depts.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto no-scrollbar">
          <button data-testid="board-filter-all" onClick={() => setDept("all")}
            className={`shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all active:scale-95 ${dept === "all" ? "bg-accent text-white border-border" : "bg-background text-muted-foreground border-border hover:border-border/50"}`}>
            {tri("Tutti", "Alle", "All", "Todos", "Tous", "همه")}
          </button>
          {depts.map((d) => (
            <button key={d} data-testid={`board-filter-${d}`} onClick={() => setDept(d)}
              className={`shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all active:scale-95 ${dept === d ? "bg-accent text-white border-border" : "bg-background text-muted-foreground border-border hover:border-border/50"}`}>
              {d}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p data-testid="board-empty" className="text-[12px] text-muted-foreground text-center py-6">
          {tri("Nessun operatore in questo reparto.", "Keine Bediener.", "No operators here.", "Sin operadores.", "Aucun opérateur.", "اپراتوری نیست.")}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((o, i) => {
            const busy = o.status === "busy";
            const off = !o.on_shift_today;
            return (
              <div key={o.name + i} data-testid={`board-row-${i}`}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${o.late ? "bg-muted/10 border-border/40" : "bg-background/60 border-border"} ${off ? "opacity-60" : ""}`}>
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${o.late ? "bg-muted" : busy ? "bg-ambra" : "bg-primary"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[13px] font-bold text-foreground truncate">{o.name}</span>
                    {o.position && <span className="text-[10px] text-muted-foreground">· {o.position}</span>}
                    {o.locked_by_capo && (
                      <span data-testid={`board-capo-lock-${i}`} className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wide text-primary bg-primary/12 border border-primary/30 rounded px-1.5 py-0.5">
                        <Lock className="w-2.5 h-2.5" /> {tri("Direzione", "Leitung", "Direction", "Dirección", "Direction", "مدیریت")}
                      </span>
                    )}
                    {off && (
                      <span data-testid={`board-shift-later-${i}`} className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wide text-muted-foreground bg-muted/12 border border-border/30 rounded px-1.5 py-0.5">
                        <CalendarClock className="w-2.5 h-2.5" /> {tri("Più tardi", "Später", "Later", "Más tarde", "Plus tard", "بعداً")}{o.days && o.days.length ? ` · ${o.days.join(" ")}` : ""}
                      </span>
                    )}
                    {!off && o.shift_start && (
                      <span data-testid={`board-shift-start-${i}`} className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wide text-primary bg-primary/10 border border-primary/25 rounded px-1.5 py-0.5">
                        <Clock3 className="w-2.5 h-2.5" /> {tri("dalle", "ab", "from", "desde", "dès", "از")} {o.shift_start}
                      </span>
                    )}
                    {o.late && (
                      <span data-testid={`board-late-${i}`} className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wide text-muted-foreground bg-muted/12 border border-border/40 rounded px-1.5 py-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" /> +{o.over_min}′ {tri("oltre stima", "über Plan", "over ETA", "sobre ETA", "hors délai", "فراتر از برآورد")}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {busy
                      ? (o.task || tri("Al lavoro", "In Arbeit", "Working", "Trabajando", "Au travail", "در حال کار"))
                      : off
                        ? tri("Non in turno oggi", "Heute nicht im Dienst", "Not on shift today", "Sin turno hoy", "Pas de service aujourd'hui", "امروز شیفت ندارد")
                        : tri("Libero · in attesa di compito", "Frei · wartet auf Aufgabe", "Free · awaiting task", "Libre · esperando tarea", "Libre · en attente", "آزاد · منتظر وظیفه")}
                  </p>
                </div>
                {busy && o.eta_min ? (
                  <div className="shrink-0 flex items-center gap-1.5">
                    <span data-testid={`board-eta-${i}`} className={`inline-flex items-center gap-1 text-[11px] font-bold rounded-full px-2.5 py-1 ${o.late ? "text-muted-foreground bg-muted/10" : "text-ambra bg-ambra/10"}`}>
                      <Clock3 className="w-3 h-3" /> ~{o.eta_min}′
                    </span>
                    {o.late && !o.locked_by_capo && (
                      <button data-testid={`board-reassign-${i}`} onClick={() => reassign(o.name)} disabled={assigning === o.name}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground bg-muted/10 hover:bg-muted/22 border border-border/40 rounded-full px-2.5 py-1 disabled:opacity-50 active:scale-95 transition-all">
                        <RefreshCw className="w-3 h-3" /> {assigning === o.name ? "…" : tri("Riassegna", "Neu zuweisen", "Reassign", "Reasignar", "Réassigner", "واگذاری مجدد")}
                      </button>
                    )}
                  </div>
                ) : (!busy && !o.locked_by_capo && !off ? (
                  <div className="shrink-0 flex items-center gap-1">
                    <button data-testid={`board-assign-${i}`} onClick={() => assignNext(o.name)} disabled={assigning === o.name}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/22 border border-primary/30 rounded-full px-2.5 py-1 disabled:opacity-50 active:scale-95 transition-all">
                      <Plus className="w-3 h-3" /> {assigning === o.name ? "…" : tri("Prossimo", "Nächste", "Next", "Siguiente", "Suivant", "بعدی")}
                    </button>
                    <button data-testid={`board-assign-pick-${i}`} onClick={() => openPicker(o.name)} title={tri("Scegli compito", "Aufgabe wählen", "Pick task", "Elegir tarea", "Choisir tâche", "انتخاب وظیفه")}
                      className="inline-flex items-center text-[11px] font-bold text-muted-foreground bg-muted/10 hover:bg-muted/22 border border-border/30 rounded-full px-2 py-1 active:scale-95 transition-all">
                      <ListChecks className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : null)}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-border/15">
        <button data-testid="delays-history-toggle" onClick={toggleHist} className="w-full flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground hover:text-muted-foreground">
          <AlertTriangle className="w-3 h-3 text-muted-foreground" />
          {tri("Storico ritardi · 7 giorni", "Verspätungen · 7 Tage", "Delay history · 7 days", "Historial retrasos · 7 días", "Historique retards · 7 jours", "تاریخچه تأخیر · ۷ روز")}
          <span className="ml-auto text-primary">{histOpen ? tri("nascondi", "verbergen", "hide", "ocultar", "cacher", "پنهان") : tri("mostra", "zeigen", "show", "mostrar", "afficher", "نمایش")}</span>
        </button>
        {histOpen && (
          <div data-testid="delays-history" className="mt-2.5">
            {!hist || (hist.ranking || []).length === 0 ? (
              <p className="text-[11px] text-muted-foreground text-center py-3">{tri("Nessun ritardo negli ultimi 7 giorni.", "Keine Verspätungen.", "No delays in the last 7 days.", "Sin retrasos.", "Aucun retard.", "بدون تأخیر.")}</p>
            ) : (
              <div className="space-y-1.5">
                {(hist.ranking || []).slice(0, 6).map((r, k) => (
                  <div key={r.operator + k} data-testid={`delays-row-${k}`} className="flex items-center gap-2 text-[11px] rounded-lg bg-background/60 border border-border px-2.5 py-1.5">
                    <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${k === 0 ? "bg-muted text-foreground" : "bg-muted/20 text-foreground"}`}>{k + 1}</span>
                    <span className="text-foreground font-bold truncate">{r.operator}</span>
                    {r.position && <span className="text-[9px] text-muted-foreground">· {r.position}</span>}
                    <span className="ml-auto text-muted-foreground font-bold">{r.count}× {tri("ritardi", "Versp.", "delays", "retrasos", "retards", "تأخیر")}</span>
                    <span className="text-muted-foreground">+{r.total_over}′</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {picker && (
        <div data-testid="assign-picker" data-tour-suppress="true" className="fixed inset-0 z-[85] bg-background/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPicker(null)}>
          <div className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-2xl bg-background border border-border/30 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <ListChecks className="w-4 h-4 text-primary" />
              <span className="text-sm font-black text-foreground">{tri("Scegli il compito per", "Aufgabe wählen für", "Pick task for", "Elegir tarea para", "Choisir la tâche pour", "انتخاب وظیفه برای")} {picker.operator}</span>
              <button data-testid="assign-picker-close" onClick={() => setPicker(null)} className="ml-auto w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            {loadingSteps ? (
              <p className="text-[12px] text-muted-foreground text-center py-6">…</p>
            ) : pending.length === 0 ? (
              <p data-testid="assign-picker-empty" className="text-[12px] text-muted-foreground text-center py-6">{tri("Nessun compito pendente.", "Keine offene Aufgabe.", "No pending task.", "Sin tareas pendientes.", "Aucune tâche en attente.", "وظیفه‌ای در انتظار نیست.")}</p>
            ) : (
              <div className="space-y-2">
                {pending.map((s, k) => (
                  <button key={s.task_id + s.order} data-testid={`assign-picker-step-${k}`} onClick={() => assignSpecific(s.task_id, s.order)}
                    className="w-full text-left rounded-xl bg-background/70 border border-border hover:border-primary/50 px-3 py-2.5 transition-all active:scale-[0.99]">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-primary uppercase tracking-wide truncate">{s.task_title}</span>
                      {s.sub_role && <span className="text-[9px] text-muted-foreground">· {s.sub_role}</span>}
                      {s.assignee && <span className="ml-auto text-[9px] text-ambra">{tri("ora", "jetzt", "now", "ahora", "actu.", "اکنون")}: {s.assignee}</span>}
                    </div>
                    <p className="text-[12px] text-foreground mt-0.5">{s.instruction}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
