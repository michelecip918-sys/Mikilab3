import { useState, useEffect } from "react";
import { Trash2, Plus, Recycle, Droplets, Mic, Check, BarChart3, Download, ChevronDown, ChevronUp } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { toast } from "sonner";

const SCARTI_KEY = "mikilab_scarti";
const SANIF_KEY = "mikilab_sanific";
const VASCHE = ["1", "2", "3"];

export default function RegistroScarti() {
  const { lang } = useLang();
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const [scarti, setScarti] = useState(() => { try { return JSON.parse(localStorage.getItem(SCARTI_KEY) || "[]"); } catch { return []; } });
  const [sanif, setSanif] = useState(() => { try { return JSON.parse(localStorage.getItem(SANIF_KEY) || "{}"); } catch { return {}; } });
  const [qty, setQty] = useState("");
  const [product, setProduct] = useState("");
  const [reason, setReason] = useState("");
  const [cost, setCost] = useState("");
  const [showReport, setShowReport] = useState(false);

  useEffect(() => { try { localStorage.setItem(SCARTI_KEY, JSON.stringify(scarti)); } catch { /* */ } }, [scarti]);
  useEffect(() => { try { localStorage.setItem(SANIF_KEY, JSON.stringify(sanif)); } catch { /* */ } }, [sanif]);

  const addScarto = (q, p, r = "", c = 0) => {
    const n = parseFloat(String(q).replace(",", ".")) || 0;
    const cst = parseFloat(String(c).replace(",", ".")) || 0;
    if (!n && !p) return;
    setScarti((s) => [{ id: `${Date.now()}`, ts: new Date().toISOString(), qty: n, product: p || tri("Prodotto", "Produkt", "Product", "Producto"), reason: r, cost: cst }, ...s]);
  };
  const submit = () => { addScarto(qty, product, reason, cost); setQty(""); setProduct(""); setReason(""); setCost(""); };
  const del = (id) => setScarti((s) => s.filter((x) => x.id !== id));
  const sanifica = (n) => { setSanif((m) => ({ ...m, [n]: new Date().toISOString() })); toast.success(tri(`Vasca ${n} sanificata ✓`, `Kessel ${n} gereinigt ✓`, `Bowl ${n} sanitised ✓`, `Cuba ${n} higienizada ✓`)); };

  // Aggiornamenti da comandi vocali (scrivono su localStorage): ricarico lo stato.
  useEffect(() => {
    const reloadScarti = () => { try { setScarti(JSON.parse(localStorage.getItem(SCARTI_KEY) || "[]")); } catch { /* */ } };
    const reloadSanif = () => { try { setSanif(JSON.parse(localStorage.getItem(SANIF_KEY) || "{}")); } catch { /* */ } };
    window.addEventListener("mikilab-scarti-updated", reloadScarti);
    window.addEventListener("mikilab-sanific-updated", reloadSanif);
    return () => { window.removeEventListener("mikilab-scarti-updated", reloadScarti); window.removeEventListener("mikilab-sanific-updated", reloadSanif); };
  }, []);

  const total = scarti.reduce((a, x) => a + (x.qty || 0), 0);
  const fmtTime = (iso) => { try { const d = new Date(iso); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; } catch { return ""; } };
  const eur = (v) => `€${(v || 0).toFixed(2)}`;

  // Riepilogo ultimi 7 giorni: per giorno e per prodotto + totali.
  const weekAgo = Date.now() - 7 * 864e5;
  const weekly = scarti.filter((x) => new Date(x.ts).getTime() >= weekAgo);
  const byDay = {}; const byProduct = {};
  weekly.forEach((x) => {
    const dk = new Date(x.ts).toLocaleDateString();
    const kg = x.qty || 0; const e = kg * (x.cost || 0);
    (byDay[dk] = byDay[dk] || { kg: 0, e: 0 }); byDay[dk].kg += kg; byDay[dk].e += e;
    const pk = x.product || "—"; (byProduct[pk] = byProduct[pk] || { kg: 0, e: 0 }); byProduct[pk].kg += kg; byProduct[pk].e += e;
  });
  const weekKg = weekly.reduce((a, x) => a + (x.qty || 0), 0);
  const weekEur = weekly.reduce((a, x) => a + (x.qty || 0) * (x.cost || 0), 0);

  const exportCSV = () => {
    const head = ["Data", "Ora", "Prodotto", "Kg", "Motivo", "EUR/kg", "EUR tot"];
    const rows = [head];
    scarti.forEach((x) => { const d = new Date(x.ts); rows.push([d.toLocaleDateString(), fmtTime(x.ts), x.product || "", (x.qty || 0), x.reason || "", (x.cost || 0), ((x.qty || 0) * (x.cost || 0)).toFixed(2)]); });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `scarti-mikilab-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    toast.success(tri("CSV esportato", "CSV exportiert", "CSV exported", "CSV exportado"));
  };

  return (
    <div className="pb-24" data-testid="registro-scarti">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#ff6b00] flex items-center justify-center"><Recycle className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#e4eff8]">{tri("Registro Scarti", "Ausschuss-Register", "Waste Log", "Registro de Mermas")}</h1>
          <p className="text-sm text-[#7E8A93]">{tri("Traccia gli sprechi e l'igiene vasche", "Verschwendung & Hygiene erfassen", "Track waste & bowl hygiene", "Registra mermas e higiene")}</p>
        </div>
      </div>

      {/* Hint vocale */}
      <div className="rounded-2xl shadow-md border border-amber-900/40 bg-[#3B82F6]/10 border border-[#3B82F6]/30 p-2.5 mb-4 flex items-center gap-2">
        <Mic className="w-4 h-4 text-[#3B82F6] shrink-0" />
        <p className="text-[12px] text-[#C9D4DC]">{tri("A voce: «Ehi Lab, registra scarto due chili pane» · «vasca uno sanificata».", "Sprich: «Ehi Lab, Ausschuss zwei Kilo Brot».", "Say: «Ehi Lab, log waste two kilos bread».", "Di: «Ehi Lab, registra merma dos kilos pan».")}</p>
      </div>

      {/* Form scarto */}
      <div className="rounded-2xl bg-[#1e1e1e] border border-[#2e2e2e] p-3 mb-4 space-y-2">
        <div className="flex gap-2">
          <input data-testid="scarto-qty" value={qty} onChange={(e) => setQty(e.target.value)} inputMode="decimal" placeholder={tri("Kg", "Kg", "Kg", "Kg")}
            className="w-20 bg-[#151515] border border-[#2e2e2e] rounded-lg p-2 text-sm text-[#e4eff8] outline-none focus:border-[#ff6b00]" />
          <input data-testid="scarto-product" value={product} onChange={(e) => setProduct(e.target.value)} placeholder={tri("Prodotto (es. pane)", "Produkt", "Product", "Producto")}
            className="flex-1 min-w-0 bg-[#151515] border border-[#2e2e2e] rounded-lg p-2 text-sm text-[#e4eff8] outline-none focus:border-[#ff6b00]" />
        </div>
        <div className="flex gap-2">
          <input data-testid="scarto-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={tri("Motivo (opzionale)", "Grund (optional)", "Reason (optional)", "Motivo (opcional)")}
            className="flex-1 min-w-0 bg-[#151515] border border-[#2e2e2e] rounded-lg p-2 text-sm text-[#e4eff8] outline-none focus:border-[#ff6b00]" />
          <div className="flex items-center gap-1 bg-[#151515] border border-[#2e2e2e] rounded-lg px-2 w-24 shrink-0">
            <span className="text-[#7E8A93] text-sm">€/kg</span>
            <input data-testid="scarto-cost" value={cost} onChange={(e) => setCost(e.target.value)} inputMode="decimal" placeholder="0"
              className="w-full bg-transparent text-sm text-[#e4eff8] outline-none" />
          </div>
        </div>
        <button data-testid="scarto-add" onClick={submit} className="w-full bg-[#ff6b00] hover:bg-[#ff8a33] text-white font-semibold px-4 py-2.5 rounded-2xl shadow-md border border-amber-900/40 active:scale-98 transition-all flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> {tri("Registra scarto", "Ausschuss erfassen", "Log waste", "Registrar merma")}
        </button>
      </div>

      {/* Totale + lista */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-[#e4eff8]">{tri("Scarti di oggi", "Ausschuss heute", "Today's waste", "Mermas de hoy")}</span>
        <span data-testid="scarto-total" className="text-sm font-bold text-[#ff6b00]">{total.toFixed(1)} kg</span>
      </div>
      <div className="space-y-2 mb-6" data-testid="scarto-list">
        {scarti.length === 0 && <p className="text-sm text-[#7E8A93] text-center py-4">{tri("Nessuno scarto registrato.", "Kein Ausschuss.", "No waste logged.", "Sin mermas.")}</p>}
        {scarti.map((x) => (
          <div key={x.id} data-testid={`scarto-${x.id}`} className="flex items-center gap-3 rounded-2xl shadow-md border border-amber-900/40 bg-[#161616] border border-[#2e2e2e] px-3 py-2.5">
            <span className="font-mono-data text-[#ff6b00] font-bold w-16 shrink-0">{(x.qty || 0).toFixed(1)}kg</span>
            <span className="flex-1 min-w-0"><span className="block text-sm text-[#e4eff8] truncate">{x.product}</span>{x.reason ? <span className="block text-[11px] text-[#7E8A93] truncate">{x.reason}</span> : null}</span>
            {x.cost ? <span className="text-[11px] font-bold text-[#22c55e] shrink-0">{eur((x.qty || 0) * (x.cost || 0))}</span> : null}
            <span className="text-[11px] text-[#7E8A93] shrink-0">{fmtTime(x.ts)}</span>
            <button onClick={() => del(x.id)} className="text-[#ff6b00] p-1 shrink-0"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>

      {/* Riepilogo settimanale */}
      <div className="rounded-2xl bg-[#1e1e1e] border border-[#2e2e2e] overflow-hidden mb-6" data-testid="scarto-report">
        <button data-testid="scarto-report-toggle" onClick={() => setShowReport((v) => !v)} className="w-full flex items-center justify-between gap-2 px-3.5 py-3">
          <span className="flex items-center gap-2 text-sm font-bold text-[#e4eff8]"><BarChart3 className="w-4 h-4 text-[#ff6b00]" /> {tri("Riepilogo settimanale", "Wochenübersicht", "Weekly summary", "Resumen semanal")}</span>
          <span className="flex items-center gap-2 text-[12px]"><span className="font-bold text-[#ff6b00]">{weekKg.toFixed(1)} kg</span><span className="font-bold text-[#22c55e]">{eur(weekEur)}</span>{showReport ? <ChevronUp className="w-4 h-4 text-[#7E8A93]" /> : <ChevronDown className="w-4 h-4 text-[#7E8A93]" />}</span>
        </button>
        {showReport && (
          <div className="px-3.5 pb-3.5 border-t border-[#2e2e2e] space-y-3">
            <div className="flex justify-end pt-2">
              <button data-testid="scarto-export" onClick={exportCSV} className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#22c55e] hover:bg-[#1fb457] px-3 py-1.5 rounded-lg active:scale-95">
                <Download className="w-3.5 h-3.5" /> {tri("Esporta CSV", "CSV exportieren", "Export CSV", "Exportar CSV")}
              </button>
            </div>
            {weekly.length === 0 ? (
              <p className="text-sm text-[#7E8A93] text-center py-3">{tri("Nessuno scarto negli ultimi 7 giorni.", "Kein Ausschuss in 7 Tagen.", "No waste in the last 7 days.", "Sin mermas en 7 días.")}</p>
            ) : (
              <>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#7E8A93] mb-1">{tri("Per giorno", "Pro Tag", "By day", "Por día")}</p>
                  {Object.entries(byDay).map(([d, v]) => (
                    <div key={d} className="flex items-center justify-between text-[13px] py-0.5"><span className="text-[#C9D4DC]">{d}</span><span className="flex gap-3"><span className="text-[#ff6b00] font-semibold">{v.kg.toFixed(1)} kg</span><span className="text-[#22c55e] font-semibold w-16 text-right">{eur(v.e)}</span></span></div>
                  ))}
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#7E8A93] mb-1">{tri("Per prodotto", "Pro Produkt", "By product", "Por producto")}</p>
                  {Object.entries(byProduct).sort((a, b) => b[1].kg - a[1].kg).map(([p, v]) => (
                    <div key={p} className="flex items-center justify-between text-[13px] py-0.5"><span className="text-[#C9D4DC] truncate">{p}</span><span className="flex gap-3"><span className="text-[#ff6b00] font-semibold">{v.kg.toFixed(1)} kg</span><span className="text-[#22c55e] font-semibold w-16 text-right">{eur(v.e)}</span></span></div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Sanificazione vasche */}
      <div className="flex items-center gap-2 mb-2">
        <Droplets className="w-5 h-5 text-[#3B82F6]" />
        <span className="text-sm font-bold text-[#e4eff8]">{tri("Sanificazione Vasche", "Kessel-Reinigung", "Bowl Sanitisation", "Higiene de Cubas")}</span>
      </div>
      <div className="grid grid-cols-1 gap-2" data-testid="sanif-list">
        {VASCHE.map((n) => (
          <div key={n} data-testid={`sanif-${n}`} className="flex items-center gap-3 rounded-2xl shadow-md border border-amber-900/40 bg-[#161616] border border-[#2e2e2e] px-3 py-2.5">
            <span className="font-display font-bold text-[#e4eff8] w-20 shrink-0">{tri("Vasca", "Kessel", "Bowl", "Cuba")} {n}</span>
            <span className="flex-1 text-[12px] text-[#7E8A93]">{sanif[n] ? `${tri("Ultima", "Zuletzt", "Last", "Última")}: ${fmtTime(sanif[n])}` : tri("Mai sanificata", "Nie gereinigt", "Never sanitised", "Nunca")}</span>
            <button data-testid={`sanif-btn-${n}`} onClick={() => sanifica(n)} className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#3B82F6] hover:bg-[#2f6fd6] px-3 py-2 rounded-lg active:scale-95">
              <Check className="w-3.5 h-3.5" /> {tri("Sanifica", "Reinigen", "Sanitise", "Higienizar")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
