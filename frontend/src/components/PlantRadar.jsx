import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Radar, AlertTriangle, RefreshCw, ShieldCheck, Loader2 } from "lucide-react";
import { plantApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import LineLeaders from "@/components/LineLeaders";
import MikeInfo from "@/components/MikeInfo";

// RADAR SPAZIALE DELL'IMPIANTO (solo Master/Capo): planimetria vettoriale live,
// operatori color-coded con task in tempo reale e geofencing anomalie.
export default function PlantRadar() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(null);

  const load = useCallback(async () => {
    try { const r = await plantApi.radar(); setData(r); } catch { /* */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const iv = setInterval(load, 4000); return () => clearInterval(iv); }, [load]);

  if (loading && !data) return <div className="py-10 text-center text-muted-foreground text-sm flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {tri("Aggancio radar…", "Radar wird verbunden…", "Locking radar…", "Enganchando radar…", "Verrouillage radar…", "اتصال رادار…")}</div>;
  const zones = (data && data.zones) || [];
  const workers = (data && data.workers) || [];
  const anomalies = (data && data.anomalies) || 0;

  return (
    <div data-testid="plant-radar" className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Radar className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-sm font-extrabold text-primary">{tri("Radar Impianto · Live", "Werk-Radar · Live", "Plant Radar · Live", "Radar de planta · En vivo", "Radar usine · Live", "رادار کارخانه · زنده")}</h3>
            <p className="text-[11px] text-muted-foreground">{workers.length} {tri("operatori tracciati", "verfolgte Bediener", "tracked operators", "operarios rastreados", "opérateurs suivis", "اپراتور ردیابی‌شده")} · {tri("solo Master", "nur Master", "Master only", "solo Master", "Master seul", "فقط مستر")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MikeInfo context={tri("Radar", "Radar", "Radar", "Radar", "Radar", "رادار")} />
          <button data-testid="radar-refresh" onClick={load} className="p-1.5 rounded-lg bg-background border border-border text-muted-foreground hover:text-foreground active:scale-95 transition-all"><RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /></button>
        </div>
      </div>

      {anomalies > 0 ? (
        <div data-testid="radar-anomaly-alert" className="flex items-center gap-2 rounded-xl border border-rose-500/50 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300">
          <AlertTriangle className="w-4 h-4" /> {anomalies} {tri("anomalia/e geofencing: personale fuori settore.", "Geofencing-Anomalie(n): Personal außerhalb.", "geofencing anomaly(ies): staff out of sector.", "anomalía(s) de geocerca: personal fuera de sector.", "anomalie(s) de géorepérage : personnel hors secteur.", "ناهنجاری ژئوفنس: خارج از بخش.")}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-bold text-primary">
          <ShieldCheck className="w-4 h-4" /> {tri("Forza lavoro allineata · nessuna anomalia.", "Belegschaft ausgerichtet · keine Anomalie.", "Workforce aligned · no anomaly.", "Personal alineado · sin anomalías.", "Effectif aligné · aucune anomalie.", "نیروی کار همسو · بدون ناهنجاری.")}
        </div>
      )}

      {/* Planimetria vettoriale */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-border bg-background" style={{ aspectRatio: "16 / 11" }} data-testid="radar-map">
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(to right,rgba(94,234,212,0.06) 1px,transparent 1px),linear-gradient(to bottom,rgba(94,234,212,0.06) 1px,transparent 1px)", backgroundSize: "8% 8%" }} />
        {/* Zone */}
        {zones.map((z) => (
          <div key={z.id} data-testid={`radar-zone-${z.id}`} className="absolute rounded-lg flex items-start justify-start p-1.5"
            style={{ left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%`, border: `1px solid ${z.color}66`, background: `${z.color}${z.type === "aux" ? "0d" : "14"}` }}>
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider leading-none" style={{ color: z.color }}>{z.name}</span>
          </div>
        ))}
        {/* Operatori */}
        {workers.map((w) => (
          <motion.button key={w.name} data-testid={`radar-worker-${w.name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`}
            onClick={() => setSel(sel === w.name ? null : w.name)}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ left: `${w.x}%`, top: `${w.y}%` }}
            animate={{ left: `${w.x}%`, top: `${w.y}%` }} transition={{ duration: 3.6, ease: "easeInOut" }}>
            <span aria-hidden className="absolute -inset-2 rounded-full animate-ping" style={{ background: `${w.color}55` }} />
            <span className="relative block w-3.5 h-3.5 rounded-full border-2" style={{ background: w.color, borderColor: "hsl(var(--card))", boxShadow: `0 0 10px ${w.color}` }} />
            {w.is_leader && <span className="absolute -top-1 -right-1 text-[8px]">⭐</span>}
            <span className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded text-[8px] font-bold" style={{ background: "#030712cc", color: w.color, border: `1px solid ${w.color}66` }}>{w.name}</span>
          </motion.button>
        ))}
      </div>

      {/* Task label live dell'operatore selezionato o lista */}
      <div className="space-y-1.5" data-testid="radar-task-list">
        {(sel ? workers.filter((w) => w.name === sel) : workers).map((w) => (
          <div key={w.name} className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${w.anomaly ? "border-rose-500/50 bg-rose-500/5" : "border-border bg-background"}`}>
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: w.color, boxShadow: `0 0 8px ${w.color}` }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{w.name} {w.is_leader && <span className="text-amber-400">⭐ {tri("Caposquadra", "Teamleiter", "Line Leader", "Jefe de línea", "Chef de ligne", "سرتیم")}</span>}</p>
              <p className="text-[11px] truncate" style={{ color: w.color }}>{w.task} · <span className="text-muted-foreground">{w.zone_name}{w.anomaly ? ` · ${w.dwell_min}′` : ""}</span></p>
            </div>
            <span className="text-[10px] font-mono-data text-primary shrink-0">{w.aura_effect}</span>
          </div>
        ))}
      </div>

      <LineLeaders workers={workers} />
    </div>
  );
}
