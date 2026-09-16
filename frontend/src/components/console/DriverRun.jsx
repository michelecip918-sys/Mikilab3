import { useEffect, useState, useCallback } from "react";
import { Truck, MapPin, Package, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { coordinationApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const COPPER = "#D97736";

// Vista autista: SOLO le tappe di oggi con orario, indirizzo e cosa consegnare. Niente burocrazia.
export default function DriverRun() {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [data, setData] = useState(null);

  const load = useCallback(() => coordinationApi.deliveryRun().then(setData).catch(() => {}), []);
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);

  const mark = (id, delivered) => coordinationApi.deliveryStop(id, delivered).then(load).catch(() => {});

  const stops = (data && data.stops) || [];
  const notReady = (data && data.not_ready_count) || 0;

  return (
    <div data-testid="driver-run" className="space-y-3">
      <div className="flex items-center gap-2">
        <Truck className="w-5 h-5" style={{ color: COPPER }} />
        <h3 className="text-sm font-black text-white uppercase tracking-wide flex-1">{tri("Giro di oggi", "Heutige Tour", "Today's run", "Ruta de hoy", "Tournée du jour", "مسیر امروز")}</h3>
        <button data-testid="driver-refresh" onClick={load} className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {notReady > 0 && (
        <div data-testid="driver-not-ready" className="rounded-lg bg-[#3a2a1a] border border-[#D97736]/50 p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#e0a878] shrink-0" />
          <span className="text-[13px] text-[#f0d3b0]">{tri(`${notReady} ordini potrebbero non essere pronti in tempo — verifica prima di partire.`, `${notReady} Bestellungen evtl. nicht rechtzeitig fertig.`, `${notReady} orders may not be ready in time — check before leaving.`, `${notReady} pedidos podrían no estar listos.`, `${notReady} commandes peut-être pas prêtes.`, `${notReady} سفارش شاید آماده نباشد.`)}</span>
        </div>
      )}

      {stops.length === 0 ? (
        <p className="text-[13px] text-[#64748B]">{tri("Nessuna consegna per oggi.", "Keine Lieferungen heute.", "No deliveries today.", "Sin entregas hoy.", "Aucune livraison aujourd'hui.", "امروز تحویلی نیست.")}</p>
      ) : (
        <div className="space-y-2">
          {stops.map((s) => (
            <div key={s.id} data-testid={`driver-stop-${s.id}`} className={`rounded-xl border p-3 ${s.delivered ? "bg-[#1c2a1c] border-[#7E9A82]/40 opacity-70" : "bg-[#242427] border-[#3A3A3E]"}`}>
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center shrink-0">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white" style={{ background: COPPER }}>{s.seq}</span>
                  {s.time && <span className="text-[11px] font-mono text-[#94A3B8] mt-1">{s.time}</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-black text-white">{s.client}</p>
                  {s.address && <p className="text-[12px] text-[#CBD5E1] flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3 shrink-0" style={{ color: COPPER }} /> {s.address}</p>}
                  {(s.items || []).length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {s.items.map((it, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#18181A] border border-[#3A3A3E] text-[11px] text-[#e7e2d8]">
                          <Package className="w-3 h-3" style={{ color: COPPER }} /> {it.product} {it.qty ? `×${it.qty}` : ""}
                        </span>
                      ))}
                    </div>
                  )}
                  {s.not_ready && !s.delivered && (
                    <p className="text-[11px] text-[#e0a878] mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {tri("potrebbe non essere pronto", "evtl. nicht fertig", "may not be ready", "quizá no listo", "peut-être pas prêt", "شاید آماده نباشد")}</p>
                  )}
                </div>
                <button data-testid={`driver-deliver-${s.id}`} onClick={() => mark(s.id, !s.delivered)}
                  className={`shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold ${s.delivered ? "bg-[#7E9A82] text-white" : "bg-[#18181A] border border-[#7E9A82]/40 text-[#7E9A82]"}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> {s.delivered ? tri("Consegnato", "Geliefert", "Delivered", "Entregado", "Livré", "تحویل شد") : tri("Segna", "Markieren", "Mark", "Marcar", "Marquer", "علامت")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
