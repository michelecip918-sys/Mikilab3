import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Loader2, Send, Trash2, Plus, Minus, Check, Volume2,
  Star, StickyNote, ListChecks, Hash, Gauge, Bell, Clock, Flame, Wheat,
  Euro, Thermometer, Package, Truck, Calendar, Target, Trophy, Leaf, BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { atelierApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const ICONS = {
  sparkles: Sparkles, star: Star, note: StickyNote, list: ListChecks, hash: Hash, gauge: Gauge,
  bell: Bell, clock: Clock, flame: Flame, wheat: Wheat, euro: Euro, thermometer: Thermometer,
  package: Package, truck: Truck, calendar: Calendar, target: Target, trophy: Trophy, leaf: Leaf, hash2: BarChart3,
};

// SITOR SU MISURA — il Capo chiede a parole, Sitor progetta lo strumento e lo appunta
// alla sua schermata. Le preferenze sono ricordate (persistite per-Capo lato server).
export default function SitorAtelier() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [widgets, setWidgets] = useState([]);
  const [req, setReq] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => { atelierApi.list().then((d) => setWidgets(d.widgets || [])).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);

  const speak = (t) => { try { if (t) playTTS(t, { lang, voice: "nexus" }); } catch { /* */ } };

  const create = async (preset) => {
    const text = (preset ?? req).trim();
    if (!text || busy) return;
    setBusy(true);
    try {
      const r = await atelierApi.create(text, lang);
      setWidgets((w) => [...w, r.widget]);
      if (!preset) setReq("");
      speak(r.spoken);
      toast.success(tri("Sitor ha aggiunto lo strumento.", "Sitor hat das Werkzeug hinzugefügt.", "Sitor added the tool.", "Sitor añadió la herramienta.", "Sitor a ajouté l'outil.", "سیتور ابزار را اضافه کرد."), { icon: "✨" });
    } catch {
      toast.error(tri("Sitor non è riuscito, riprova.", "Sitor konnte nicht.", "Sitor couldn't, try again.", "Sitor no pudo.", "Sitor n'a pas pu.", "سیتور نتوانست."));
    } finally { setBusy(false); }
  };

  const patch = async (wid, config) => {
    setWidgets((ws) => ws.map((w) => (w.id === wid ? { ...w, config } : w)));
    try { await atelierApi.update(wid, config); } catch { /* */ }
  };
  const remove = async (wid) => {
    setWidgets((ws) => ws.filter((w) => w.id !== wid));
    try { await atelierApi.remove(wid); } catch { /* */ }
  };
  const share = async (wid, dept) => {
    setWidgets((ws) => ws.map((w) => (w.id === wid ? { ...w, share_dept: dept } : w)));
    try { await atelierApi.share(wid, dept); } catch { /* */ }
  };
  const DEPTS = ["", "tutti", "panificio", "pasticceria", "pizzeria", "banco", "laugen"];

  const SUGGEST = [
    tri("Un contatore degli sfridi di oggi", "Ein Ausschuss-Zähler für heute", "A counter for today's waste", "Un contador de mermas de hoy", "Un compteur de pertes du jour", "شمارنده ضایعات امروز"),
    tri("Una checklist di apertura del laboratorio", "Eine Öffnungs-Checkliste", "An opening checklist for the lab", "Una checklist de apertura", "Une checklist d'ouverture", "چک‌لیست بازگشایی"),
    tri("Un promemoria per ordinare la farina venerdì", "Erinnerung: Freitag Mehl bestellen", "A reminder to order flour on Friday", "Recordatorio para pedir harina el viernes", "Un rappel pour commander la farine vendredi", "یادآوری سفارش آرد جمعه"),
    tri("Un grafico degli sfridi della settimana", "Ein Wochendiagramm des Ausschusses", "A chart of this week's waste", "Un gráfico de las mermas de la semana", "Un graphique des pertes de la semaine", "نمودار ضایعات این هفته"),
  ];

  return (
    <div data-testid="sitor-atelier" className="space-y-3">
      <p className="text-[12px] text-[#94A3B8] leading-snug">{tri(
        "Chiedi a Sitor lo strumento che ti serve: lo crea, lo appunta qui e lo ricorda per te ogni volta che entri.",
        "Bitte Sitor um das Werkzeug, das du brauchst: er erstellt es, heftet es hier an und merkt es sich für dich.",
        "Ask Sitor for the tool you need: he builds it, pins it here and remembers it for you every time you sign in.",
        "Pide a Sitor la herramienta que necesitas: la crea, la fija aquí y la recuerda para ti.",
        "Demande à Sitor l'outil dont tu as besoin : il le crée, l'épingle ici et s'en souvient pour toi.",
        "از سیتور ابزاری که می‌خواهی بخواه: می‌سازد، اینجا سنجاق می‌کند و برایت به خاطر می‌سپارد.")}</p>

      <div className="relative">
        <textarea data-testid="atelier-input" value={req} onChange={(e) => setReq(e.target.value)} rows={2}
          placeholder={tri("Es. «aggiungi un contatore delle baguette invendute»…", "z.B. «füge einen Zähler hinzu»…", "e.g. \"add a counter for unsold baguettes\"…", "p.ej. «añade un contador»…", "ex. « ajoute un compteur »…", "مثلاً «یک شمارنده اضافه کن»…")}
          className="w-full rounded-xl bg-[#030712] border border-[#EAB308]/30 focus:border-[#EAB308]/70 outline-none text-sm text-white p-3 resize-none" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SUGGEST.map((sug, i) => (
          <button key={i} data-testid={`atelier-suggest-${i}`} onClick={() => create(sug)} disabled={busy}
            className="text-[11px] font-bold px-2.5 py-1.5 rounded-full bg-[#EAB308]/10 border border-[#EAB308]/30 text-[#EAB308] active:scale-95 disabled:opacity-50">
            + {sug}
          </button>
        ))}
      </div>
      <button data-testid="atelier-create-btn" onClick={() => create()} disabled={busy || !req.trim()}
        className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-cyber font-black text-sm text-[#060A10] active:scale-95 transition-all disabled:opacity-50"
        style={{ background: "linear-gradient(90deg,#EAB308,#FF6B00)", boxShadow: "0 0 18px rgba(234,179,8,0.3)" }}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {busy ? tri("Sitor progetta…", "Sitor entwirft…", "Sitor is designing…", "Sitor diseña…", "Sitor conçoit…", "سیتور طراحی می‌کند…") : tri("Chiedi a Sitor", "Sitor fragen", "Ask Sitor", "Pedir a Sitor", "Demander à Sitor", "از سیتور بخواه")}
      </button>

      <div data-testid="atelier-widgets" className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        <AnimatePresence>
          {widgets.map((w) => {
            const I = ICONS[w.icon] || Sparkles;
            return (
              <motion.div key={w.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                data-testid={`atelier-widget-${w.id}`} className="rounded-2xl border border-[#EAB308]/25 bg-[#0C1019]/70 p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#EAB308]/12 border border-[#EAB308]/35"><I className="w-4 h-4 text-[#EAB308]" /></span>
                  <p className="text-sm font-bold text-white flex-1 truncate">{w.title}</p>
                  <button data-testid={`atelier-del-${w.id}`} onClick={() => remove(w.id)} className="text-[#64748B] hover:text-[#f87171] active:scale-90"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>

                {w.type === "note" && (
                  <textarea data-testid={`atelier-note-${w.id}`} value={w.config.text || ""} rows={3}
                    onChange={(e) => patch(w.id, { ...w.config, text: e.target.value })}
                    className="w-full rounded-lg bg-[#030712] border border-[#1e293b] focus:border-[#EAB308]/50 outline-none text-[13px] text-[#CBD5E1] p-2 resize-none" />
                )}

                {w.type === "counter" && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] text-[#94A3B8]">{w.config.label}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => patch(w.id, { ...w.config, value: Math.max(0, (w.config.value || 0) - (w.config.step || 1)) })} className="w-8 h-8 rounded-lg bg-[#0C1019] border border-[#1e293b] text-white flex items-center justify-center active:scale-90"><Minus className="w-4 h-4" /></button>
                      <span data-testid={`atelier-counter-val-${w.id}`} className="min-w-[2.5rem] text-center text-xl font-black text-[#EAB308]">{w.config.value || 0}</span>
                      <button data-testid={`atelier-counter-plus-${w.id}`} onClick={() => patch(w.id, { ...w.config, value: (w.config.value || 0) + (w.config.step || 1) })} className="w-8 h-8 rounded-lg bg-[#EAB308]/15 border border-[#EAB308]/40 text-[#EAB308] flex items-center justify-center active:scale-90"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}

                {w.type === "checklist" && (
                  <ul className="space-y-1">
                    {(w.config.items || []).map((it, k) => (
                      <li key={k}>
                        <button onClick={() => { const items = w.config.items.map((x, j) => (j === k ? { ...x, done: !x.done } : x)); patch(w.id, { ...w.config, items }); }}
                          className="w-full flex items-center gap-2 text-left text-[13px] active:scale-[0.99]">
                          <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${it.done ? "bg-[#22c55e]/20 border-[#22c55e]/60 text-[#22c55e]" : "border-[#64748B]/50 text-transparent"}`}><Check className="w-3 h-3" /></span>
                          <span className={it.done ? "line-through text-[#64748B]" : "text-[#CBD5E1]"}>{it.t}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {w.type === "metric" && (
                  <div className="text-center py-1">
                    <p className="text-2xl font-black text-[#EAB308]">{w.config.value || "—"} <span className="text-sm text-[#94A3B8]">{w.config.unit}</span></p>
                    <p className="text-[11px] text-[#94A3B8]">{w.config.label}</p>
                  </div>
                )}

                {w.type === "reminder" && (
                  <div className="flex items-start gap-2">
                    <Bell className="w-4 h-4 text-[#FF9D42] mt-0.5 shrink-0" />
                    <div><p className="text-[13px] text-[#CBD5E1] leading-snug">{w.config.text}</p>{w.config.date && <p className="text-[11px] text-[#FF9D42] font-bold mt-0.5">{w.config.date}</p>}</div>
                  </div>
                )}

                {w.type === "chart" && (() => {
                  const series = w.config.series || [];
                  const max = Math.max(1, ...series.map((p) => Number(p.v) || 0));
                  return (
                    <div data-testid={`atelier-chart-${w.id}`}>
                      <div className="flex items-end gap-1.5 h-24 mb-1.5">
                        {series.map((p, k) => (
                          <div key={k} className="flex-1 flex flex-col items-center justify-end h-full">
                            <span className="text-[9px] text-[#EAB308] font-bold mb-0.5">{Number(p.v) || 0}</span>
                            <div className="w-full rounded-t transition-all" style={{ height: `${Math.max(4, ((Number(p.v) || 0) / max) * 100)}%`, background: "linear-gradient(180deg,#EAB308,#FF6B00)" }} />
                            <span className="text-[9px] text-[#64748B] mt-1">{p.d}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-[#94A3B8] mb-1.5">{w.config.label}{w.config.unit ? ` · ${w.config.unit}` : ""}{w.config.auto ? " · " : ""}{w.config.auto && <span data-testid={`atelier-chart-auto-${w.id}`} className="text-[#22c55e] font-bold">{tri("dati reali", "Echtdaten", "real data", "datos reales", "données réelles", "داده واقعی")}</span>}</p>
                      {!w.config.auto && (
                      <div className="flex gap-1 overflow-x-auto pb-1">
                        {series.map((p, k) => (
                          <input key={k} data-testid={`atelier-chart-input-${w.id}-${k}`} inputMode="decimal" value={p.v}
                            onChange={(e) => { const v = e.target.value.replace(/[^\d.]/g, ""); const s = series.map((x, j) => (j === k ? { ...x, v: v === "" ? 0 : Number(v) } : x)); patch(w.id, { ...w.config, series: s }); }}
                            className="w-10 shrink-0 bg-[#030712] border border-[#1e293b] focus:border-[#EAB308]/50 outline-none text-[11px] text-white text-center rounded px-1 py-1" />
                        ))}
                      </div>
                      )}
                    </div>
                  );
                })()}

                <div className="mt-2 pt-2 border-t border-[#1e293b] flex items-center gap-1.5">
                  <span className="text-[10px] text-[#64748B]">{tri("Condividi in reparto:", "In Bereich teilen:", "Share to dept:", "Compartir en área:", "Partager à l'atelier :", "اشتراک با بخش:")}</span>
                  <select data-testid={`atelier-share-${w.id}`} value={w.share_dept || ""} onChange={(e) => share(w.id, e.target.value)}
                    className="bg-[#030712] border border-[#1e293b] focus:border-[#EAB308]/50 outline-none text-[11px] text-white rounded px-1.5 py-1">
                    {DEPTS.map((d) => <option key={d} value={d}>{d === "" ? tri("no", "nein", "no", "no", "non", "خیر") : d}</option>)}
                  </select>
                  {w.share_dept && <span className="text-[9px] text-[#22c55e] font-bold">✓</span>}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {widgets.length === 0 && (
          <p data-testid="atelier-empty" className="text-[12px] text-[#64748B] col-span-full text-center py-4">{tri(
            "Nessuno strumento su misura. Chiedi a Sitor qui sopra: lo crea per te.",
            "Noch keine Werkzeuge. Frag Sitor oben.",
            "No custom tools yet. Ask Sitor above and he'll build one.",
            "Aún no hay herramientas. Pide a Sitor arriba.",
            "Aucun outil encore. Demande à Sitor ci-dessus.",
            "هنوز ابزاری نیست. از سیتور بالا بخواه.")}</p>
        )}
      </div>
    </div>
  );
}
