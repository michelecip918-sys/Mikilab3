import { useEffect, useState } from "react";
import { QrCode, Wheat, Calendar, ShieldCheck, Store, Package, Loader2, AlertCircle } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { batchesApi } from "@/lib/api";
import { mkTri } from "@/i18n/triMaps";

// Pagina PUBBLICA di tracciabilità (nessun login). Aperta scansionando il QR
// del lotto: ?lotto=<id>. Mostra farina, date e provenienza al cliente finale.
export default function PublicBatch({ id }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try { const b = await batchesApi.publicGet(id); if (alive) setBatch(b); }
      catch { if (alive) setError(true); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [id]);

  const Row = ({ Icon, label, value }) => value ? (
    <div className="flex items-start gap-3 py-3 border-b border-[#e4eff8] dark:border-[#26324A] last:border-0">
      <Icon className="w-5 h-5 text-[#F26419] shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#7E8A93]">{label}</p>
        <p className="text-[15px] font-semibold text-[#2B303B] dark:text-[#e4eff8] break-words">{value}</p>
      </div>
    </div>
  ) : null;

  return (
    <div data-testid="public-batch" className="fixed inset-0 z-[75] bg-[#0B0E14] dark:bg-[#0B0E14] overflow-auto">
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="MikiLab" className="w-12 h-12 rounded-2xl shadow-md border border-amber-900/40 object-cover ring-2 ring-[#F26419]/60" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <div>
            <p className="font-display text-xl font-bold text-[#2B303B] dark:text-[#e4eff8]">MikiLab</p>
            <p className="text-xs text-[#7E8A93]">{tri("Tracciabilità del lotto", "Chargen-Rückverfolgung", "Batch traceability")}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-[#F26419]" /></div>
        ) : error || !batch ? (
          <div data-testid="public-batch-error" className="text-center py-16">
            <AlertCircle className="w-12 h-12 text-[#E4572E] mx-auto mb-3" />
            <p className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Lotto non trovato", "Charge nicht gefunden", "Batch not found")}</p>
            <p className="text-sm text-[#7E8A93] mt-1">{tri("Questo QR non è più valido o è stato rimosso.", "Dieser QR ist ungültig oder wurde entfernt.", "This QR is invalid or was removed.")}</p>
          </div>
        ) : (
          <>
            <div className="rounded-3xl bg-gradient-to-br from-[#F26419] to-[#F26419] text-white p-6 shadow-xl mb-5">
              <div className="flex items-center gap-2 text-white/85 text-sm font-semibold"><ShieldCheck className="w-5 h-5" /> {tri("Prodotto tracciato", "Rückverfolgtes Produkt", "Traced product")}</div>
              <h1 data-testid="public-batch-product" className="font-display text-3xl font-bold mt-2 leading-tight">{batch.product}</h1>
              <p data-testid="public-batch-code" className="font-mono-data text-sm text-white/80 mt-1">{batch.code}</p>
            </div>

            <div className="rounded-2xl bg-white dark:bg-[#18202E] border border-[#26324A] dark:border-[#26324A] p-4 shadow-sm">
              <Row Icon={Calendar} label={tri("Data di produzione", "Produktionsdatum", "Production date")} value={batch.prod_date} />
              <Row Icon={Calendar} label={tri("Da consumarsi entro", "Mindestens haltbar bis", "Best before")} value={batch.expiry} />
              <Row Icon={Wheat} label={tri("Farina", "Mehl", "Flour")} value={batch.flour} />
              <Row Icon={QrCode} label={tri("Lotto farina (fornitore)", "Mehl-Charge (Lieferant)", "Flour lot (supplier)")} value={batch.flour_lot} />
              <Row Icon={Package} label={tri("Quantità", "Menge", "Quantity")} value={batch.qty} />
              <Row Icon={ShieldCheck} label={tri("Operatore", "Bediener", "Operator")} value={batch.operator} />
              <Row Icon={Store} label={tri("Punto vendita", "Verkaufsstelle", "Store")} value={batch.store_name} />
            </div>

            {batch.note && (
              <div className="rounded-2xl bg-[#F26419]/10 border border-[#F26419]/30 p-4 mt-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#F26419] mb-1">{tri("Note", "Notizen", "Notes")}</p>
                <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] whitespace-pre-line">{batch.note}</p>
              </div>
            )}

            <p className="text-center text-xs text-[#7E8A93] mt-6">{tri("Tracciabilità garantita da MikiLab", "Rückverfolgbarkeit garantiert von MikiLab", "Traceability powered by MikiLab")} 🍞</p>
            <a href="/" className="block text-center text-sm font-semibold text-[#F26419] underline underline-offset-2 mt-3">mikilab.de</a>
          </>
        )}
      </div>
    </div>
  );
}
