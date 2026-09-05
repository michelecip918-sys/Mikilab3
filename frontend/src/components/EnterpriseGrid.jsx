import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { X, Globe, Trophy, Move, Crown, Flame, Sparkles, MapPin } from "lucide-react";
import { enterpriseApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const STATUS_COLOR = { normal: "#22c55e", warning_slow_oven: "#f59e0b" };
const EQ_COLOR = { optimal: "#22c55e", active: "#5EEAD4", warning: "#f59e0b" };

export default function EnterpriseGrid({ onClose }) {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [ov, setOv] = useState(null);
  const [sites, setSites] = useState([]);
  const [lb, setLb] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [sel, setSel] = useState(null);
  const [layout, setLayout] = useState(null);
  const [drag, setDrag] = useState(null);
  const mapRef = useRef(null);

  const load = useCallback(async () => {
    const [o, s, l, f] = await Promise.all([
      enterpriseApi.overview(), enterpriseApi.sites(), enterpriseApi.leaderboard(), enterpriseApi.fleetAdvice(),
    ]);
    setOv(o); setSites(s.sites || []); setLb(l.global_leaderboard || []); setFleet(f.fleet_recommendations || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const openSite = async (site) => {
    setSel(site);
    const lay = await enterpriseApi.getLayout(site.site_id).catch(() => null);
    setLayout(lay);
  };

  const dims = layout?.spatial_layout?.room_dimensions_m || { width: 12, length: 18 };

  const onPointerMove = (e) => {
    if (!drag || !mapRef.current) return;
    const r = mapRef.current.getBoundingClientRect();
    const px = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    const py = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
    setLayout((prev) => {
      const c = structuredClone(prev);
      const eq = c.spatial_layout.equipment.find((x) => x.id === drag);
      if (eq) { eq.x = +(px * dims.width).toFixed(1); eq.y = +(py * dims.length).toFixed(1); }
      return c;
    });
  };
  const onPointerUp = async () => {
    if (!drag) return;
    const eq = layout.spatial_layout.equipment.find((x) => x.id === drag);
    setDrag(null);
    if (eq) {
      const r = await enterpriseApi.optimizeLayout(sel.site_id, { equipment_id: eq.id, target_x: eq.x, target_y: eq.y }).catch(() => null);
      if (r) toast.success(r.bakomix_simulation || tri("Layout aggiornato", "Layout aktualisiert", "Layout updated", "Layout actualizado", "Agencement mis à jour", "چیدمان به‌روزشد"), { duration: 1400, position: "bottom-center" });
    }
  };

  return (
    <div data-testid="enterprise-grid" className="fixed inset-0 z-[80] bg-[#030712]/97 backdrop-blur-xl overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 pb-16">
        <div className="flex items-center justify-between sticky top-0 bg-[#030712]/95 py-2 z-10">
          <h2 className="text-lg font-black text-white flex items-center gap-2"><Globe className="w-5 h-5 text-[#5EEAD4]" /> {tri("Rete Enterprise", "Enterprise-Netz", "Enterprise Grid", "Red Enterprise", "Réseau Enterprise", "شبکه سازمانی")}</h2>
          <button data-testid="enterprise-close" onClick={onClose} className="w-9 h-9 rounded-full bg-[#0b0f19] border border-[#1e293b] flex items-center justify-center text-[#94A3B8] hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Overview badge */}
        {ov && (
          <div data-testid="enterprise-overview" className="grid grid-cols-3 gap-2 mb-4">
            <div className="rounded-2xl bg-gradient-to-br from-[#5EEAD422] to-transparent border border-[#5EEAD4]/30 p-3 text-center">
              <p className="text-2xl font-black text-[#5EEAD4]">{ov.total_active_sites}</p>
              <p className="text-[10px] text-[#94A3B8] uppercase font-bold">{tri("Sedi", "Standorte", "Sites", "Sedes", "Sites", "شعبه")}</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-[#f59e0b22] to-transparent border border-[#f59e0b]/30 p-3 text-center">
              <p className="text-2xl font-black text-[#f59e0b]">{ov.global_efficiency_avg}%</p>
              <p className="text-[10px] text-[#94A3B8] uppercase font-bold">{tri("Efficienza", "Effizienz", "Efficiency", "Eficiencia", "Efficacité", "کارایی")}</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-[#ef444422] to-transparent border border-[#ef4444]/30 p-3 text-center">
              <p className="text-2xl font-black" style={{ color: ov.critical_alerts_count ? "#ef4444" : "#22c55e" }}>{ov.critical_alerts_count}</p>
              <p className="text-[10px] text-[#94A3B8] uppercase font-bold">{tri("Anomalie", "Anomalien", "Alerts", "Alertas", "Alertes", "هشدار")}</p>
            </div>
          </div>
        )}

        {/* Sites */}
        <p className="text-[11px] font-black uppercase tracking-widest text-[#94A3B8] mb-2 flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {tri("Sedi della rete", "Netz-Standorte", "Network sites", "Sedes", "Sites du réseau", "شعبه‌های شبکه")}</p>
        <div className="grid sm:grid-cols-2 gap-2 mb-5">
          {sites.map((s) => (
            <button key={s.site_id} data-testid={`enterprise-site-${s.site_id}`} onClick={() => openSite(s)} className="text-left rounded-2xl bg-[#0b0f19] border p-3 active:scale-[0.99] transition-transform" style={{ borderColor: `${s.aura.color}55` }}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-black text-white">{s.name}</p>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLOR[s.status] || "#94A3B8" }} />
              </div>
              <p className="text-[11px] font-bold mt-1" style={{ color: s.aura.color }}>{s.aura.aura_effect} · {s.avg_score}%</p>
              <p className="text-[10px] text-[#64748B] mt-0.5">{(s.workers || []).length} {tri("operatori", "Mitarbeiter", "workers", "operarios", "opérateurs", "اپراتور")} · {tri("tocca per la mappa", "für Karte tippen", "tap for map", "toca para el mapa", "toucher pour la carte", "برای نقشه بزن")}</p>
            </button>
          ))}
        </div>

        {/* Spatial 2D map */}
        {sel && layout && (
          <div data-testid="enterprise-map" className="mb-5">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#5EEAD4] mb-2 flex items-center gap-1.5"><Move className="w-4 h-4" /> {tri("Mappa spaziale", "Raumkarte", "Spatial map", "Mapa espacial", "Carte spatiale", "نقشه فضایی")} · {sel.name}</p>
            <div
              ref={mapRef}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              className="relative w-full rounded-2xl border border-[#1e293b] bg-[#0b0f19] overflow-hidden touch-none"
              style={{ aspectRatio: `${dims.width} / ${dims.length}`, backgroundImage: "linear-gradient(#1e293b55 1px, transparent 1px), linear-gradient(90deg, #1e293b55 1px, transparent 1px)", backgroundSize: "10% 10%" }}
            >
              {(layout.spatial_layout.equipment || []).map((eq) => (
                <div
                  key={eq.id}
                  data-testid={`enterprise-eq-${eq.id}`}
                  onPointerDown={(e) => { e.preventDefault(); setDrag(eq.id); }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing select-none"
                  style={{ left: `${Math.min(80, Math.max(20, (eq.x / dims.width) * 100))}%`, top: `${Math.min(92, Math.max(8, (eq.y / dims.length) * 100))}%` }}
                >
                  <div className="px-2 py-1.5 rounded-xl border-2 text-[10px] font-black text-white max-w-[38vw] truncate shadow-lg" style={{ borderColor: EQ_COLOR[eq.status] || "#5EEAD4", background: "#030712" }}>
                    {eq.name}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[#64748B] mt-1">{tri("Trascina i macchinari: BakoMix ricalcola il risparmio.", "Geräte ziehen: BakoMix rechnet die Ersparnis.", "Drag equipment: BakoMix recomputes savings.", "Arrastra máquinas: BakoMix recalcula.", "Glisse les machines : BakoMix recalcule.", "دستگاه‌ها را بکش: BakoMix صرفه‌جویی را حساب می‌کند.")}</p>
          </div>
        )}

        {/* Global leaderboard */}
        <p className="text-[11px] font-black uppercase tracking-widest text-[#f59e0b] mb-2 flex items-center gap-1.5"><Trophy className="w-4 h-4" /> {tri("Leaderboard globale", "Globale Rangliste", "Global leaderboard", "Clasificación global", "Classement global", "جدول جهانی")}</p>
        <div className="space-y-1.5 mb-5">
          {lb.map((w) => (
            <div key={`${w.worker_name}-${w.global_rank}`} data-testid={`enterprise-lb-${w.global_rank}`} className="flex items-center gap-2 rounded-xl bg-[#0b0f19] border border-[#1e293b] p-2.5">
              <span className="w-6 text-center font-black" style={{ color: w.global_rank === 1 ? "#f59e0b" : "#94A3B8" }}>{w.global_rank === 1 ? <Crown className="w-4 h-4 inline" /> : w.global_rank}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white truncate">{w.worker_name} <span className="text-[10px] font-medium text-[#64748B]">· {w.site_name}</span></p>
                <p className="text-[10px] font-bold" style={{ color: w.aura.color }}>{w.title}{w.streak > 1 && <span className="text-[#f59e0b] ml-1">🔥{w.streak}</span>}</p>
              </div>
              <span className="text-lg font-black" style={{ color: w.aura.color }}>{w.score}</span>
            </div>
          ))}
        </div>

        {/* Fleet advice */}
        <p className="text-[11px] font-black uppercase tracking-widest text-[#94A3B8] mb-2 flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> {tri("Consiglio strategico BakoMix", "BakoMix Strategie", "BakoMix strategy", "Estrategia BakoMix", "Stratégie BakoMix", "استراتژی BakoMix")}</p>
        <div className="space-y-1.5">
          {fleet.map((f, i) => (
            <div key={i} data-testid={`enterprise-advice-${i}`} className="rounded-xl border p-2.5 text-[12px] text-white" style={{ borderColor: f.urgency === "medium" ? "#f59e0b55" : "#22c55e55", background: f.urgency === "medium" ? "#f59e0b12" : "#22c55e10" }}>
              {f.worker ? <b className="text-[#f59e0b]">{f.worker} · {f.site_name}: </b> : null}{f.suggestion}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
