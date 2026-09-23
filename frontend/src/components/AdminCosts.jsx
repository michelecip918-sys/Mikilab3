import { useState, useEffect } from "react";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { api } from "@/lib/api";
import { toast } from "sonner";

const FEATS = ["FEATURE_PHOTO_DIAG", "FEATURE_PLAN", "FEATURE_LIVE", "FEATURE_VOICE_CHAT", "FEATURE_VOICE_SERVER", "FEATURE_SITOR_MAESTRO"]; // V93 V105: SITOR_MAESTRO = modello grande per la chat (più caro; spento: modello normale): VOICE_SERVER = voce a pagamento (spenta: parla il telefono, gratis)
const COLS = ["chat_calls", "course_gens", "technique_gens", "plan_calls", "vision_calls", "live_pings", "done_pings"];

// U1b: pagina admin "Costi" (nessun link pubblico). Legge/scrive GET/PUT /api/admin/costs.
export default function AdminCosts({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");

  const load = () => api.get("/admin/costs").then((r) => setD(r.data)).catch(() => setErr("err"));
  useEffect(() => { load(); }, []);

  const setLevel = async (lv) => { try { const r = await api.put("/admin/costs", { savings_level: lv }); setD((x) => ({ ...x, savings_level: r.data.savings_level })); toast.success(`Livello risparmio: ${lv}`); } catch { toast.error("Errore"); } };
  const toggle = async (f) => { try { const r = await api.put("/admin/costs", { [f]: !d.features[f] }); setD((x) => ({ ...x, features: { ...x.features, [f]: r.data[f] } })); } catch { toast.error("Errore"); } };

  if (err) return <div className="p-6 text-muted-foreground">{tri("Accesso negato.", "Zugriff verweigert.", "Access denied.")}</div>;
  if (!d) return <div className="p-6 text-muted-foreground">{tri("Carico…", "Lade…", "Loading…")}</div>;

  const alerts = Object.entries(d.alerts_over_80pct || {});

  return (
    <div data-testid="admin-costs" className="max-w-3xl mx-auto space-y-5">
      <button data-testid="costs-back" onClick={onBack} className="inline-flex items-center gap-1 text-sm text-muted-foreground font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <h1 className="font-display text-3xl font-black">{tri("Costi & Risparmio", "Kosten & Sparen", "Costs & Savings")}</h1>

      {alerts.length > 0 && (
        <div className="rounded-xl bg-mattone/15 border border-mattone/40 p-3 flex items-start gap-2 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 text-mattone shrink-0" />
          <div>{alerts.map(([k, v]) => <p key={k}><b>{k}</b>: {v.used}/{v.limit} ({tri("oltre l'80%", "über 80%", "over 80%")})</p>)}</div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-background p-4">
        <p className="text-[11px] font-black uppercase tracking-wide text-muted-foreground mb-2">{tri("Modalità risparmio", "Sparmodus", "Savings mode")}</p>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((lv) => (
            <button key={lv} data-testid={`savings-${lv}`} onClick={() => setLevel(lv)}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm active:scale-95 ${d.savings_level === lv ? "bg-primary text-primary-foreground" : "bg-foreground/10 text-foreground"}`}>{lv}</button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">{tri("0 normale · 1 leggero · 2 solo salvati · 3 niente IA pubblica", "0 normal · 1 leicht · 2 nur gespeicherte · 3 keine öffentliche KI", "0 normal · 1 light · 2 saved only · 3 no public AI")}</p>
      </div>

      <div className="rounded-2xl border border-border bg-background p-4">
        <p className="text-[11px] font-black uppercase tracking-wide text-muted-foreground mb-2">{tri("Funzioni", "Funktionen", "Features")}</p>
        <div className="grid grid-cols-2 gap-2">
          {FEATS.map((f) => (
            <button key={f} data-testid={`feat-${f}`} onClick={() => toggle(f)}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs text-left active:scale-95 ${d.features[f] ? "bg-accent/20 text-accent-foreground border border-accent/40" : "bg-foreground/10 text-muted-foreground border border-transparent"}`}>
              {d.features[f] ? "● " : "○ "}{f.replace("FEATURE_", "")}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background p-4 overflow-x-auto">
        <p className="text-[11px] font-black uppercase tracking-wide text-muted-foreground mb-2">{tri("Ultimi 30 giorni", "Letzte 30 Tage", "Last 30 days")} · {tri("limiti", "Limits", "limits")}: chat {d.limits.SITOR_GLOBAL_DAILY} · corsi {d.limits.COURSE_GEN_DAILY_CAP}</p>
        <table className="w-full text-xs">
          <thead><tr className="text-muted-foreground text-left"><th className="py-1 pr-2">{tri("Giorno", "Tag", "Day")}</th>{COLS.map((c) => <th key={c} className="py-1 px-1 text-right">{c.replace("_calls", "").replace("_gens", "").replace("_pings", "")}</th>)}</tr></thead>
          <tbody>
            {d.table.filter((row) => COLS.some((c) => row[c] > 0)).map((row) => (
              <tr key={row.day} className="border-t border-border/50"><td className="py-1 pr-2 font-semibold">{row.day.slice(5)}</td>{COLS.map((c) => <td key={c} className="py-1 px-1 text-right tabular-nums">{row[c] || ""}</td>)}</tr>
            ))}
          </tbody>
        </table>
        {d.table.every((row) => COLS.every((c) => !row[c])) && <p className="text-muted-foreground text-sm mt-2">{tri("Ancora nessun consumo registrato.", "Noch kein Verbrauch erfasst.", "No usage recorded yet.")}</p>}
      </div>
    </div>
  );
}
