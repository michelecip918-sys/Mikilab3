import { useState, useEffect, useCallback } from "react";
import { Pizza, Plus, Trash2, Check, Clock3, Snowflake, Loader2 } from "lucide-react";
import { pizzeriaApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Sezione dedicata Pizzeria: sessioni di servizio a flusso con panetti porzionati e maturazione.
export default function PizzeriaServizio() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [list, setList] = useState([]);
  const [busy, setBusy] = useState(false);
  const empty = { label: "", date: "", service_start: "", service_end: "", dough_balls: "", ball_weight_g: "260", method: "diretto", maturation_h: "24", fridge: "", notes: "" };
  const [form, setForm] = useState(empty);

  const load = useCallback(() => { pizzeriaApi.list().then((d) => setList(d.sessions || [])).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);

  const METHODS = [
    { id: "diretto", label: tri("Diretto", "Direkt", "Direct", "Directo", "Direct", "مستقیم") },
    { id: "biga", label: "Biga" },
    { id: "poolish", label: "Poolish" },
    { id: "misto", label: tri("Misto", "Gemischt", "Mixed", "Mixto", "Mixte", "ترکیبی") },
  ];

  const submit = async () => {
    if (!form.label.trim() || !form.date) return;
    setBusy(true);
    try { await pizzeriaApi.create(form); setForm(empty); load(); }
    catch { /* */ } finally { setBusy(false); }
  };
  const toggle = (id) => pizzeriaApi.toggle(id).then(load).catch(() => {});
  const remove = (id) => pizzeriaApi.remove(id).then(load).catch(() => {});

  const daysTo = (dISO) => { try { return Math.ceil((new Date(dISO) - new Date()) / 86400000); } catch { return null; } };
  // Orario consigliato di inizio impasto = apertura servizio - maturazione.
  const doughStart = (s) => {
    try {
      if (!s.service_start || !s.maturation_h) return null;
      const [h, m] = s.service_start.split(":").map((x) => parseInt(x, 10));
      const total = h * 60 + m - Math.round(parseFloat(s.maturation_h) * 60);
      const norm = ((total % 1440) + 1440) % 1440;
      const day = total < 0 ? tri(" (giorno prima)", " (Vortag)", " (day before)", " (día antes)", " (veille)", " (روز قبل)") : "";
      return `${String(Math.floor(norm / 60)).padStart(2, "0")}:${String(norm % 60).padStart(2, "0")}${day}`;
    } catch { return null; }
  };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div data-testid="pizzeria-service" className="space-y-3">
      <p className="text-[11px] text-muted-foreground">{tri(
        "Servizio a flusso: panetti porzionati con maturazione in frigo. Sitor calcola quando iniziare l'impasto per essere pronti all'apertura della sala.",
        "Service im Fluss: portionierte Teiglinge mit Kühlreifung.", "Continuous service: portioned dough balls with cold maturation. Sitor computes when to start so you're ready at opening.",
        "Servicio en flujo: bollos porcionados con maduración.", "Service en flux : pâtons portionnés avec maturation.", "سرویس پیوسته: چانه‌های تقسیم‌شده با تخمیر سرد.")}</p>

      {/* Nuova sessione di servizio */}
      <div className="rounded-xl bg-background border border-primary/30 p-3 space-y-2">
        <input data-testid="pizzeria-label" value={form.label} onChange={set("label")} placeholder={tri("Servizio (es. Cena venerdì)", "Service (z.B. Freitagabend)", "Service (e.g. Friday dinner)", "Servicio (ej. cena viernes)", "Service (ex. dîner vendredi)", "سرویس")} className="w-full rounded-lg bg-background border border-border text-foreground text-sm px-3 py-2 focus:border-primary outline-none" />
        <div className="grid grid-cols-3 gap-2">
          <input data-testid="pizzeria-date" type="date" value={form.date} onChange={set("date")} className="rounded-lg bg-background border border-border text-foreground text-sm px-2 py-2 focus:border-primary outline-none" />
          <input data-testid="pizzeria-start" type="time" value={form.service_start} onChange={set("service_start")} title={tri("Apertura sala", "Öffnung", "Opening", "Apertura", "Ouverture", "افتتاح")} className="rounded-lg bg-background border border-border text-foreground text-sm px-2 py-2 focus:border-primary outline-none" />
          <input data-testid="pizzeria-end" type="time" value={form.service_end} onChange={set("service_end")} title={tri("Chiusura", "Schluss", "Close", "Cierre", "Fermeture", "بسته")} className="rounded-lg bg-background border border-border text-foreground text-sm px-2 py-2 focus:border-primary outline-none" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input data-testid="pizzeria-balls" value={form.dough_balls} onChange={set("dough_balls")} inputMode="numeric" placeholder={tri("Panetti", "Teiglinge", "Balls", "Bollos", "Pâtons", "چانه")} className="rounded-lg bg-background border border-border text-foreground text-sm px-3 py-2 focus:border-primary outline-none" />
          <input data-testid="pizzeria-weight" value={form.ball_weight_g} onChange={set("ball_weight_g")} inputMode="numeric" placeholder={tri("Grammi", "Gramm", "Grams", "Gramos", "Grammes", "گرم")} className="rounded-lg bg-background border border-border text-foreground text-sm px-3 py-2 focus:border-primary outline-none" />
          <input data-testid="pizzeria-maturation" value={form.maturation_h} onChange={set("maturation_h")} inputMode="numeric" placeholder={tri("Ore matur.", "Reifung h", "Matur. h", "Horas", "Heures", "ساعت")} className="rounded-lg bg-background border border-border text-foreground text-sm px-3 py-2 focus:border-primary outline-none" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {METHODS.map((t) => (
            <button key={t.id} data-testid={`pizzeria-method-${t.id}`} onClick={() => setForm((f) => ({ ...f, method: t.id }))}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full border active:scale-95 ${form.method === t.id ? "bg-primary/20 border-primary/60 text-primary" : "bg-background border-border text-muted-foreground"}`}>{t.label}</button>
          ))}
        </div>
        <input data-testid="pizzeria-fridge" value={form.fridge} onChange={set("fridge")} placeholder={tri("Frigo/cella (es. Frigo 1)", "Kühlschrank", "Fridge/cell (e.g. Fridge 1)", "Frigo/cámara", "Frigo/chambre", "یخچال")} className="w-full rounded-lg bg-background border border-border text-foreground text-sm px-3 py-2 focus:border-primary outline-none" />
        <input data-testid="pizzeria-notes" value={form.notes} onChange={set("notes")} placeholder={tri("Note (idratazione, farina, topping…)", "Notiz", "Notes (hydration, flour, topping…)", "Notas", "Notes", "یادداشت")} className="w-full rounded-lg bg-background border border-border text-foreground text-sm px-3 py-2 focus:border-primary outline-none" />
        <button data-testid="pizzeria-add" onClick={submit} disabled={busy || !form.label.trim() || !form.date} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/15 border border-primary/50 text-primary font-bold text-sm active:scale-95 disabled:opacity-40">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} {tri("Aggiungi servizio", "Service hinzufügen", "Add service", "Añadir servicio", "Ajouter service", "افزودن سرویس")}
        </button>
      </div>

      {/* Lista sessioni */}
      <div className="space-y-2">
        {list.length === 0 ? (
          <p className="text-[12px] text-muted-foreground text-center py-3">{tri("Nessun servizio programmato.", "Kein Service geplant.", "No service scheduled.", "Sin servicios.", "Aucun service.", "سرویسی نیست.")}</p>
        ) : list.map((s) => {
          const dt = daysTo(s.date);
          const soon = dt !== null && dt >= 0 && dt <= 1;
          const start = doughStart(s);
          return (
            <div key={s.id} data-testid={`pizzeria-row-${s.id}`} className="rounded-xl bg-background border p-3" style={{ borderColor: s.done ? "#22c55e55" : soon ? "#3E9C9366" : "hsl(var(--card))" }}>
              <div className="flex items-center gap-2">
                <Pizza className="w-4 h-4 shrink-0" style={{ color: s.done ? "hsl(var(--accent))" : "hsl(var(--primary))" }} />
                <span className={`text-sm font-black flex-1 min-w-0 truncate ${s.done ? "text-emerald-300 line-through" : "text-foreground"}`}>{s.label}</span>
                <button data-testid={`pizzeria-toggle-${s.id}`} onClick={() => toggle(s.id)} className="shrink-0 w-7 h-7 rounded-lg bg-accent/10 border border-accent/40 text-accent flex items-center justify-center active:scale-95"><Check className="w-4 h-4" /></button>
                <button data-testid={`pizzeria-del-${s.id}`} onClick={() => remove(s.id)} className="shrink-0 w-7 h-7 rounded-lg bg-background border border-border text-muted-foreground hover:text-rose-400 flex items-center justify-center active:scale-95"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11px] flex-wrap">
                <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock3 className="w-3 h-3" /> {s.date}{s.service_start ? ` · ${s.service_start}${s.service_end ? `–${s.service_end}` : ""}` : ""}</span>
                {s.dough_balls && <span className="text-muted-foreground">· {s.dough_balls}×{s.ball_weight_g || "?"}g</span>}
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/25">{s.method}</span>
                {s.fridge && <span className="inline-flex items-center gap-1 text-muted-foreground"><Snowflake className="w-3 h-3" /> {s.fridge}</span>}
                {soon && !s.done && <span data-testid={`pizzeria-soon-${s.id}`} className="text-[10px] font-black text-primary">⏰ {dt === 0 ? tri("OGGI", "HEUTE", "TODAY", "HOY", "AUJOURD'HUI", "امروز") : tri("DOMANI", "MORGEN", "TOMORROW", "MAÑANA", "DEMAIN", "فردا")}</span>}
              </div>
              {start && (
                <div data-testid={`pizzeria-doughstart-${s.id}`} className="mt-1.5 rounded-lg border border-primary/25 bg-primary/8 px-2.5 py-1.5 text-[11px] text-primary-foreground">
                  {tri("Inizia l'impasto:", "Teig starten:", "Start dough:", "Empieza masa:", "Commence la pâte :", "شروع خمیر:")} <b className="font-display tabular-nums">{start}</b> {s.maturation_h ? tri(`· ${s.maturation_h}h di maturazione in frigo`, `· ${s.maturation_h}h Reifung`, `· ${s.maturation_h}h cold maturation`, `· ${s.maturation_h}h maduración`, `· ${s.maturation_h}h maturation`, `· ${s.maturation_h} ساعت تخمیر`) : ""}
                </div>
              )}
              {s.notes && <p className="mt-1 text-[11px] text-muted-foreground">{s.notes}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
