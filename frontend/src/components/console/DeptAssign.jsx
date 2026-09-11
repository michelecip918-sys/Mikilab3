import { useState, useEffect, useCallback } from "react";
import { Loader2, Send, Trash2, UserCog, Check, Plus, Users, GraduationCap, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { deptApi, operatorPinsApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

export default function DeptAssign() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [depts, setDepts] = useState([]);
  const [dept, setDept] = useState("");
  const [operators, setOperators] = useState([]);
  const [sel, setSel] = useState({}); // { operatorName: task }
  const [appr, setAppr] = useState({}); // { operatorName: true } → modalità apprendista
  const [manual, setManual] = useState("");
  const [target, setTarget] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [board, setBoard] = useState([]);
  const [apprConfirm, setApprConfirm] = useState(null); // { names:[], payload }

  const load = useCallback(() => {
    deptApi.catalog().then((d) => setDepts(d.departments || [])).catch(() => {});
    deptApi.assignment().then((d) => setAssignments(d.assignments || [])).catch(() => {});
    deptApi.board().then((d) => setBoard(d.objectives || [])).catch(() => {});
    operatorPinsApi.list().then((d) => setOperators((d.operators || []).map((o) => ({ name: o.name })))).catch(() => {});
  }, []);
  useEffect(() => { load(); const id = setInterval(() => deptApi.board().then((d) => setBoard(d.objectives || [])).catch(() => {}), 15000); return () => clearInterval(id); }, [load]);

  const toggle = (name) => setSel((s) => { const n = { ...s }; if (n[name] !== undefined) delete n[name]; else n[name] = ""; return n; });
  const setTask = (name, v) => setSel((s) => ({ ...s, [name]: v }));
  const toggleAppr = (name) => setAppr((a) => { const n = { ...a }; if (n[name]) delete n[name]; else n[name] = true; return n; });
  const addManual = () => {
    const nm = manual.trim();
    if (!nm) return;
    if (!operators.find((o) => o.name.toLowerCase() === nm.toLowerCase())) setOperators((o) => [...o, { name: nm, manual: true }]);
    setSel((s) => ({ ...s, [nm]: "" }));
    setManual("");
  };

  const doAssign = async (items) => {
    setBusy(true);
    try {
      await deptApi.assignMulti({ dept, items, target: Number(target) || 0, label });
      setSel({}); setAppr({}); setTarget(""); setLabel(""); setApprConfirm(null);
      toast.success(tri(`Assegnati ${items.length} operai ✓`, `${items.length} zugewiesen ✓`, `Assigned ${items.length} ✓`, `${items.length} asignados ✓`, `${items.length} assignés ✓`, `${items.length} واگذار شد ✓`));
      load();
    } catch { toast.error("Error"); } finally { setBusy(false); }
  };

  const assign = async () => {
    if (!dept) { toast.error(tri("Scegli un reparto", "Bereich wählen", "Pick a department", "Elige un área", "Choisis un atelier", "بخش را انتخاب کن")); return; }
    const items = Object.entries(sel).map(([operator, task]) => ({ operator, task: (task || "").trim(), apprentice: !!appr[operator] }));
    if (items.length === 0) { toast.error(tri("Seleziona almeno un operaio", "Mind. einen Mitarbeiter wählen", "Select at least one operator", "Selecciona al menos un operario", "Sélectionne au moins un opérateur", "حداقل یک اپراتور انتخاب کن")); return; }
    // Sitor (Dio dell'Arte Bianca) chiede al Capo di confermare la MODALITÀ APPRENDISTA — a voce, senza schermate extra.
    const apprNames = items.filter((it) => it.apprentice).map((it) => it.operator);
    if (apprNames.length > 0) {
      const q = tri(
        `Capo, hai messo ${apprNames.join(", ")} come apprendista. Confermi la modalità apprendista? Se dici sì, li seguo passo passo, con voce guida e domande di sicurezza, e rallento il ritmo per loro.`,
        `Capo, du hast ${apprNames.join(", ")} als Lehrling. Bestätigst du den Lehrlingsmodus? Wenn ja, führe ich sie Schritt für Schritt.`,
        `Capo, you set ${apprNames.join(", ")} as apprentice. Do you confirm apprentice mode? If yes, I guide them step by step with voice and safety checks.`,
        `Capo, pusiste a ${apprNames.join(", ")} como aprendiz. ¿Confirmas el modo aprendiz?`,
        `Capo, tu as mis ${apprNames.join(", ")} en apprenti. Confirmes-tu le mode apprenti ?`,
        `کاپو، ${apprNames.join(", ")} را کارآموز گذاشتی. حالت کارآموز را تأیید می‌کنی؟`);
      try { playTTS(q, { lang, voice: "nexus" }); } catch { /* */ }
      setApprConfirm({ names: apprNames, items });
      return;
    }
    doAssign(items);
  };

  const confirmAppr = () => {
    if (!apprConfirm) return;
    const msg = tri(
      `Confermato. Modalità apprendista attiva per ${apprConfirm.names.join(", ")}. Mi comporterò diversamente con loro: spiegazioni più semplici, un passo alla volta, e controllo che ogni passaggio sia capito.`,
      `Bestätigt. Lehrlingsmodus aktiv. Ich erkläre einfacher, Schritt für Schritt.`,
      `Confirmed. Apprentice mode on for ${apprConfirm.names.join(", ")}. I'll explain simply, one step at a time.`,
      `Confirmado. Modo aprendiz activo.`,
      `Confirmé. Mode apprenti actif.`,
      `تأیید شد. حالت کارآموز فعال است.`);
    try { playTTS(msg, { lang, voice: "nexus" }); } catch { /* */ }
    doAssign(apprConfirm.items);
  };
  const del = (a) => deptApi.unassign(a.id).then(load).catch(() => {});
  const cur = depts.find((x) => x.key === dept);
  const accent = cur?.accent || "#8a97a6";
  const selCount = Object.keys(sel).length;

  return (
    <div data-testid="dept-assign" className="space-y-4">
      <p className="text-[11px] text-[#94A3B8]">{tri("Scegli il reparto, seleziona più operai e dai a ciascuno la sua mansione. In produzione ognuno vedrà solo ciò che gli assegni, tracciato per PIN.", "Bereich wählen, mehrere Mitarbeiter auswählen und jedem seine Aufgabe geben.", "Pick the department, select multiple operators and give each their own task. Tracked by PIN.", "Elige el área, selecciona varios operarios y asigna a cada uno su tarea.", "Choisis l'atelier, sélectionne plusieurs opérateurs et donne à chacun sa tâche.", "بخش را انتخاب کن، چند اپراتور انتخاب کن و به هرکدام وظیفه بده.")}</p>

      {/* Reparti */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {depts.map((d) => (
          <button key={d.key} data-testid={`dept-pick-${d.key}`} onClick={() => { setDept(d.key); setSel({}); }}
            className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-bold transition-all active:scale-95 ${dept === d.key ? "text-white" : "bg-[#0C1019] border-[#1e293b] text-[#94A3B8]"}`}
            style={dept === d.key ? { background: `${d.accent}22`, borderColor: `${d.accent}99`, color: d.accent } : {}}>
            <span className="text-lg">{d.icon}</span> {d.name}
          </button>
        ))}
      </div>
      {cur && (
        <div className="rounded-xl bg-[#0C1019] border border-[#1e293b] p-3 text-[11px] text-[#94A3B8]">
          <span className="text-white font-bold">{cur.name}</span> · {cur.machines.length} {tri("macchine", "Maschinen", "machines", "máquinas", "machines", "دستگاه")} · {cur.silos.length} silos · {cur.cells.length} {tri("celle", "Zellen", "cells", "celdas", "cellules", "سلول")}
        </div>
      )}

      {/* Selezione squadra */}
      {cur && (
        <div className="space-y-2.5" data-testid="dept-team-picker">
          <p className="text-[10px] uppercase tracking-widest text-[#64748B] flex items-center gap-1.5"><Users className="w-3.5 h-3.5" style={{ color: accent }} /> {tri("Squadra del reparto", "Team des Bereichs", "Department team", "Equipo del área", "Équipe de l'atelier", "تیم بخش")} {selCount > 0 && <span className="font-black" style={{ color: accent }}>· {selCount}</span>}</p>

          {operators.length === 0 && (
            <p className="text-[11px] text-[#64748B] rounded-xl bg-[#0C1019] border border-[#1e293b] px-3 py-2">{tri("Nessun operaio con PIN. Aggiungine uno qui sotto o registralo nella gestione PIN.", "Kein Mitarbeiter mit PIN. Unten hinzufügen.", "No operators with PIN. Add one below.", "Ningún operario con PIN. Añade uno abajo.", "Aucun opérateur avec PIN. Ajoute ci-dessous.", "اپراتوری با PIN نیست. زیر اضافه کن.")}</p>
          )}

          <div className="space-y-1.5">
            {operators.map((o) => {
              const on = sel[o.name] !== undefined;
              return (
                <div key={o.name} data-testid={`dept-op-row-${o.name}`} className="rounded-xl bg-[#0C1019] border px-2.5 py-2 transition-all" style={{ borderColor: on ? `${accent}77` : "#1e293b" }}>
                  <div className="flex items-center gap-2">
                    <button data-testid={`dept-op-toggle-${o.name}`} onClick={() => toggle(o.name)}
                      className="shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all"
                      style={{ borderColor: on ? accent : "#334155", background: on ? `${accent}22` : "transparent" }}>
                      {on && <Check className="w-3.5 h-3.5" style={{ color: accent }} />}
                    </button>
                    <span className="text-sm font-bold text-white flex-1 min-w-0 truncate">{o.name}</span>
                    {on && (
                      <>
                        <input data-testid={`dept-op-task-${o.name}`} value={sel[o.name]} onChange={(e) => setTask(o.name, e.target.value)}
                          placeholder={tri("mansione (impasti, forni…)", "Aufgabe…", "task (mixing, ovens…)", "tarea…", "tâche…", "وظیفه…")}
                          className="flex-1 min-w-0 rounded-lg bg-[#030712] border border-[#1e293b] focus:border-[#8a97a6]/60 outline-none text-xs text-white px-2.5 py-1.5" />
                        <button data-testid={`dept-op-appr-${o.name}`} onClick={() => toggleAppr(o.name)} title={tri("Modalità apprendista", "Lehrlingsmodus", "Apprentice mode", "Modo aprendiz", "Mode apprenti", "حالت کارآموز")}
                          className={`shrink-0 inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border text-[10px] font-black transition-all active:scale-95 ${appr[o.name] ? "bg-amber-500/20 border-amber-500/60 text-amber-400" : "bg-[#030712] border-[#1e293b] text-[#64748B]"}`}>
                          <GraduationCap className="w-3.5 h-3.5" /> {tri("Appr.", "Lehrl.", "Appr.", "Aprend.", "Appr.", "کارآموز")}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Aggiungi operaio manuale */}
          <div className="flex items-center gap-2">
            <input data-testid="dept-manual-input" value={manual} onChange={(e) => setManual(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addManual(); }}
              placeholder={tri("Aggiungi operaio (nome)…", "Mitarbeiter hinzufügen…", "Add operator (name)…", "Añadir operario…", "Ajouter opérateur…", "افزودن اپراتور…")}
              className="flex-1 rounded-xl bg-[#030712] border border-[#1e293b] focus:border-[#8a97a6]/60 outline-none text-sm text-white px-3 py-2" />
            <button data-testid="dept-manual-add" onClick={addManual} className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-[#1e293b] text-[#94A3B8] text-sm active:scale-95"><Plus className="w-4 h-4" /></button>
          </div>

          {/* Obiettivo squadra */}
          <div className="flex items-center gap-2">
            <input data-testid="dept-label-input" value={label} onChange={(e) => setLabel(e.target.value)}
              placeholder={tri("Obiettivo del reparto (opz.)", "Ziel des Bereichs (opt.)", "Department goal (opt.)", "Meta del área (opc.)", "Objectif (opt.)", "هدف (اختیاری)")}
              className="flex-1 rounded-xl bg-[#030712] border border-[#1e293b] focus:border-[#8a97a6]/60 outline-none text-sm text-white px-3 py-2.5" />
            <input data-testid="dept-target-input" value={target} onChange={(e) => setTarget(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric"
              placeholder={tri("Pezzi", "Stück", "Pcs", "Piezas", "Pcs", "عدد")}
              className="w-20 rounded-xl bg-[#030712] border border-[#1e293b] focus:border-[#8a97a6]/60 outline-none text-sm text-white px-3 py-2.5" />
          </div>

          {apprConfirm && (
            <div data-testid="dept-appr-confirm" className="rounded-xl border border-amber-500/50 bg-amber-500/8 p-3.5">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-amber-400 mb-1.5"><Volume2 className="w-4 h-4" /> Sitor · {tri("Conferma modalità apprendista", "Lehrlingsmodus bestätigen", "Confirm apprentice mode", "Confirmar modo aprendiz", "Confirmer mode apprenti", "تأیید حالت کارآموز")}</p>
              <p className="text-[12.5px] text-[#e7d9b8] leading-snug mb-3">{tri(
                `Capo, hai messo ${apprConfirm.names.join(", ")} come apprendista. Se confermi, li seguo passo passo, con voce guida e domande di sicurezza, e rallento il ritmo per loro.`,
                `Capo, ${apprConfirm.names.join(", ")} als Lehrling. Bestätige, dann führe ich sie Schritt für Schritt.`,
                `Capo, ${apprConfirm.names.join(", ")} as apprentice. If you confirm, I guide them step by step with voice and safety checks.`,
                `Capo, ${apprConfirm.names.join(", ")} como aprendiz. Si confirmas, los guío paso a paso.`,
                `Capo, ${apprConfirm.names.join(", ")} en apprenti. Si tu confirmes, je les guide pas à pas.`,
                `کاپو، ${apprConfirm.names.join(", ")} کارآموز. اگر تأیید کنی، قدم‌به‌قدم راهنمایی‌شان می‌کنم.`)}</p>
              <div className="flex items-center gap-2">
                <button data-testid="dept-appr-confirm-yes" onClick={confirmAppr} disabled={busy} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-500 text-[#030712] font-black text-sm active:scale-95 disabled:opacity-50">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {tri("Sì, conferma", "Ja, bestätigen", "Yes, confirm", "Sí, confirmar", "Oui, confirmer", "بله، تأیید")}
                </button>
                <button data-testid="dept-appr-confirm-no" onClick={() => doAssign(apprConfirm.items.map((it) => ({ ...it, apprentice: false })))} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-[#030712] border border-[#1e293b] text-[#94A3B8] font-bold text-sm active:scale-95">
                  {tri("No, assegna normale", "Nein, normal", "No, assign normal", "No, normal", "Non, normal", "نه، عادی")}
                </button>
              </div>
            </div>
          )}

          <button data-testid="dept-assign-btn" onClick={assign} disabled={busy || selCount === 0}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#8a97a6]/15 border border-[#8a97a6]/50 text-[#8a97a6] font-bold text-sm active:scale-95 disabled:opacity-40">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {tri("Assegna la squadra", "Team zuweisen", "Assign team", "Asignar equipo", "Assigner l'équipe", "واگذاری تیم")}{selCount > 0 ? ` · ${selCount}` : ""}
          </button>
        </div>
      )}

      {board.length > 0 && (
        <div data-testid="dept-board" className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest text-[#64748B]">{tri("Lavagna di controllo · live", "Kontrolltafel · live", "Control board · live", "Tablero · live", "Tableau · live", "تابلو · زنده")}</p>
          {board.map((o) => { const pct = o.target > 0 ? Math.min(100, Math.round((o.done / o.target) * 100)) : 0; return (
            <div key={o.dept} data-testid={`board-${o.dept}`} className="rounded-xl bg-[#0C1019] border border-[#1e293b] px-3 py-2">
              <div className="flex items-center justify-between text-xs mb-1"><span className="font-bold text-white">{o.dept_name}{o.label ? ` · ${o.label}` : ""}</span><span className="font-black text-[#8a97a6]">{o.done}/{o.target || "∞"} {o.unit}</span></div>
              <div className="h-1.5 rounded-full bg-[#030712] overflow-hidden"><div className="h-full bg-gradient-to-r from-[#8a97a6] to-[#6e9e85]" style={{ width: `${pct}%` }} /></div>
            </div>
          ); })}
        </div>
      )}
      {assignments.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest text-[#64748B]">{tri("Assegnazioni di oggi", "Heutige Zuweisungen", "Today's assignments", "Asignaciones de hoy", "Aujourd'hui", "امروز")}</p>
          {assignments.map((a) => (
            <div key={a.id} data-testid={`dept-assignment-${a.id}`} className="flex items-center gap-2 rounded-xl bg-[#0C1019] border border-[#1e293b] px-3 py-2">
              <UserCog className="w-4 h-4 text-[#8a97a6] shrink-0" />
              <p className="text-xs text-white flex-1 min-w-0 truncate"><b>{a.operator}</b> → {a.dept_name}{a.task ? ` · ${a.task}` : ""}</p>
              {a.apprentice && <span data-testid={`dept-appr-badge-${a.id}`} className="shrink-0 inline-flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/40"><GraduationCap className="w-3 h-3" /> {tri("Appr.", "Lehrl.", "Appr.", "Aprend.", "Appr.", "کارآموز")}</span>}
              <button data-testid={`dept-unassign-${a.id}`} onClick={() => del(a)} className="text-[#64748B] hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
