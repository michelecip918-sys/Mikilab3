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
  const [weekly, setWeekly] = useState(null);
  const [addForm, setAddForm] = useState(null); // {name,width,length} | null
  const [line, setLine] = useState(null);
  const [omni, setOmni] = useState(null);
  const mapRef = useRef(null);

  const load = useCallback(async () => {
    const [o, s, l, f, w, ln, om] = await Promise.all([
      enterpriseApi.overview(), enterpriseApi.sites(), enterpriseApi.leaderboard(), enterpriseApi.fleetAdvice(), enterpriseApi.weeklyChallenge(), enterpriseApi.lineStatus(24, 70), enterpriseApi.omni(),
    ]);
    setOv(o); setSites(s.sites || []); setLb(l.global_leaderboard || []); setFleet(f.fleet_recommendations || []); setWeekly(w); setLine(ln); setOmni(om);
  }, []);
  useEffect(() => { load(); }, [load]);

  const createSite = async () => {
    if (!addForm?.name?.trim()) return;
    await enterpriseApi.addSite(addForm.name).catch(() => {});
    setAddForm(null);
    toast.success(tri("Sede creata", "Standort erstellt", "Site created", "Sede creada", "Site créé", "شعبه ایجاد شد"));
    load();
  };

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
      if (r) toast.success(r.mikemix_simulation || tri("Layout aggiornato", "Layout aktualisiert", "Layout updated", "Layout actualizado", "Agencement mis à jour", "چیدمان به‌روزشد"), { duration: 1400, position: "bottom-center" });
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

        {/* Omni-Intelligence: benchmarking cross-sede + strategie */}
        {omni && (
          <div data-testid="enterprise-omni" className="rounded-2xl border border-[#64748B]/40 p-3 mb-4" style={{ background: "linear-gradient(135deg,#64748B18,transparent)" }}>
            <p className="text-[11px] font-black uppercase tracking-widest text-[#7DA3C0] flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> {tri("Mike Mix Omni-Intelligence", "Omni-Intelligenz", "Omni-Intelligence", "Omni-Inteligencia", "Omni-Intelligence", "هوش کل‌نگر")}</p>
            <div className="flex items-center justify-between mt-1.5 text-[12px]">
              <span className="text-[#22c55e]">▲ {omni.top_site?.name} {omni.top_site?.avg_score}%</span>
              <span className="text-[#f59e0b]">▼ {omni.struggling_site?.name} {omni.struggling_site?.avg_score}%</span>
            </div>
            {(omni.cross_site_strategies || []).map((s, i) => (
              <p key={i} data-testid={`enterprise-omni-strat-${i}`} className="text-[11px] text-[#cfe0ec] mt-1.5">💡 {s.strategy}</p>
            ))}
          </div>
        )}

        {/* Sfida Aura settimanale tra le sedi */}
        {weekly && weekly.ranking && (
          <div data-testid="enterprise-weekly" className="rounded-2xl border border-[#f59e0b]/40 p-3 mb-4" style={{ background: "linear-gradient(135deg,#f59e0b18,transparent)" }}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#f59e0b] flex items-center gap-1.5"><Trophy className="w-4 h-4" /> {tri("Sfida Aura · Settimana", "Aura-Challenge · Woche", "Aura Challenge · Week", "Reto Aura · Semana", "Défi Aura · Semaine", "چالش هاله · هفته")} {weekly.week}</p>
              <span className="text-[10px] text-[#94A3B8]">{weekly.days_remaining}g</span>
            </div>
            {weekly.leader && <p className="text-[12px] text-white mt-1">👑 <b className="text-[#f59e0b]">{weekly.leader.name}</b> — {weekly.leader.avg_score}%</p>}
            <p className="text-[10px] text-[#94A3B8] mt-1">{weekly.prize}</p>
          </div>
        )}

        {/* Sites */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#94A3B8] flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {tri("Sedi della rete", "Netz-Standorte", "Network sites", "Sedes", "Sites du réseau", "شعبه‌های شبکه")}</p>
          <button data-testid="enterprise-add-site" onClick={() => setAddForm({ name: "", width: 10, length: 12 })} className="text-[11px] font-bold text-[#5EEAD4]">+ {tri("Aggiungi sede", "Standort", "Add site", "Añadir", "Ajouter", "افزودن")}</button>
        </div>
        {addForm && (
          <div data-testid="enterprise-add-form" className="rounded-2xl bg-[#0b0f19] border border-[#5EEAD4]/40 p-3 mb-3 space-y-2">
            <input data-testid="enterprise-site-name" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} placeholder={tri("Nome filiale", "Filialname", "Branch name", "Nombre", "Nom", "نام شعبه")} className="w-full bg-[#030712] border border-[#1e293b] rounded-lg px-2 py-2 text-sm text-white outline-none focus:border-[#5EEAD4]" />
            <div className="flex gap-2">
              <button data-testid="enterprise-site-create" onClick={createSite} className="flex-1 py-2 rounded-lg bg-[#5EEAD4] text-[#030712] font-black text-xs">{tri("Crea", "Erstellen", "Create", "Crear", "Créer", "ایجاد")}</button>
              <button onClick={() => setAddForm(null)} className="px-3 py-2 rounded-lg bg-[#030712] border border-[#1e293b] text-[#94A3B8] text-xs">{tri("Annulla", "Abbr.", "Cancel", "Cancelar", "Annuler", "لغو")}</button>
            </div>
          </div>
        )}
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
            <p className="text-[10px] text-[#64748B] mt-1">{tri("Trascina i macchinari: Mike Mix ricalcola il risparmio.", "Geräte ziehen: Mike Mix rechnet die Ersparnis.", "Drag equipment: Mike Mix recomputes savings.", "Arrastra máquinas: Mike Mix recalcula.", "Glisse les machines : Mike Mix recalcule.", "دستگاه‌ها را بکش: Mike Mix صرفه‌جویی را حساب می‌کند.")}</p>
          </div>
        )}

        {/* Linea di produzione a 6 settori con handoff */}
        {line && line.sectors && line.sectors.length > 0 && (
          <div data-testid="enterprise-line" className="rounded-2xl border border-[#1e293b] bg-[#0b0f19] p-3 mb-5">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#5EEAD4] mb-2">{tri("Linea di produzione", "Produktionslinie", "Production line", "Línea de producción", "Ligne de production", "خط تولید")} · {line.gluten}</p>
            <div className="space-y-1.5">
              {line.sectors.map((s, i) => (
                <div key={s.id} data-testid={`enterprise-sector-${s.id}`} className="flex items-center gap-2 rounded-xl bg-[#030712] border border-[#1e293b] p-2">
                  <span className="w-5 h-5 rounded-full bg-[#0f172a] text-[#5EEAD4] text-[10px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-black text-white truncate">{s.name}</p>
                    <p className="text-[10px] text-[#5EEAD4]">{s.param}</p>
                    <p className="text-[10px] text-[#64748B]">→ {s.handoff}</p>
                  </div>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.status === "optimal" ? "#22c55e" : "#5EEAD4" }} />
                </div>
              ))}
            </div>
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
        <p className="text-[11px] font-black uppercase tracking-widest text-[#94A3B8] mb-2 flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> {tri("Consiglio strategico Mike Mix", "Mike Mix Strategie", "Mike Mix strategy", "Estrategia Mike Mix", "Stratégie Mike Mix", "استراتژی Mike Mix")}</p>
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
