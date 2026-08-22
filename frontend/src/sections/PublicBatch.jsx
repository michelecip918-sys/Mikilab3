import { useEffect, useState } from "react";
import { QrCode, Wheat, Calendar, ShieldCheck, Store, Package, Loader2, AlertCircle } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { batchesApi } from "@/lib/api";

// Pagina PUBBLICA di tracciabilità (nessun login). Aperta scansionando il QR
// del lotto: ?lotto=<id>. Mostra farina, date e provenienza al cliente finale.
export default function PublicBatch({ id }) {
  const { lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);
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
    <div className="flex items-start gap-3 py-3 border-b border-[#EAF0EC] dark:border-[#38424B] last:border-0">
      <Icon className="w-5 h-5 text-[#5E8B7E] shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#7E8A93]">{label}</p>
        <p className="text-[15px] font-semibold text-[#2B303B] dark:text-[#EAF0EC] break-words">{value}</p>
      </div>
    </div>
  ) : null;

  return (
    <div data-testid="public-batch" className="fixed inset-0 z-[75] bg-[#F6F8F5] dark:bg-[#1B2127] overflow-auto">
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="MikiLab" className="w-12 h-12 rounded-xl object-cover ring-2 ring-[#A9C5D4]/60" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <div>
            <p className="font-display text-xl font-bold text-[#2B303B] dark:text-[#EAF0EC]">MikiLab</p>
            <p className="text-xs text-[#7E8A93]">{tri("Tracciabilità del lotto", "Chargen-Rückverfolgung", "Batch traceability")}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-[#5E8B7E]" /></div>
        ) : error || !batch ? (
          <div data-testid="public-batch-error" className="text-center py-16">
            <AlertCircle className="w-12 h-12 text-[#E4572E] mx-auto mb-3" />
            <p className="font-display text-lg font-bold text-[#2B303B] dark:text-[#EAF0EC]">{tri("Lotto non trovato", "Charge nicht gefunden", "Batch not found")}</p>
            <p className="text-sm text-[#7E8A93] mt-1">{tri("Questo QR non è più valido o è stato rimosso.", "Dieser QR ist ungültig oder wurde entfernt.", "This QR is invalid or was removed.")}</p>
          </div>
        ) : (
          <>
            <div className="rounded-3xl bg-gradient-to-br from-[#5E8B7E] to-[#33564E] text-white p-6 shadow-xl mb-5">
              <div className="flex items-center gap-2 text-white/85 text-sm font-semibold"><ShieldCheck className="w-5 h-5" /> {tri("Prodotto tracciato", "Rückverfolgtes Produkt", "Traced product")}</div>
              <h1 data-testid="public-batch-product" className="font-display text-3xl font-bold mt-2 leading-tight">{batch.product}</h1>
              <p data-testid="public-batch-code" className="font-mono-data text-sm text-white/80 mt-1">{batch.code}</p>
            </div>

            <div className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] p-4 shadow-sm">
              <Row Icon={Calendar} label={tri("Data di produzione", "Produktionsdatum", "Production date")} value={batch.prod_date} />
              <Row Icon={Calendar} label={tri("Da consumarsi entro", "Mindestens haltbar bis", "Best before")} value={batch.expiry} />
              <Row Icon={Wheat} label={tri("Farina", "Mehl", "Flour")} value={batch.flour} />
              <Row Icon={QrCode} label={tri("Lotto farina (fornitore)", "Mehl-Charge (Lieferant)", "Flour lot (supplier)")} value={batch.flour_lot} />
              <Row Icon={Package} label={tri("Quantità", "Menge", "Quantity")} value={batch.qty} />
              <Row Icon={ShieldCheck} label={tri("Operatore", "Bediener", "Operator")} value={batch.operator} />
              <Row Icon={Store} label={tri("Punto vendita", "Verkaufsstelle", "Store")} value={batch.store_name} />
            </div>

            {batch.note && (
              <div className="rounded-2xl bg-[#6E8CA0]/10 border border-[#6E8CA0]/30 p-4 mt-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#5E8B7E] mb-1">{tri("Note", "Notizen", "Notes")}</p>
                <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] whitespace-pre-line">{batch.note}</p>
              </div>
            )}

            <p className="text-center text-xs text-[#7E8A93] mt-6">{tri("Tracciabilità garantita da MikiLab", "Rückverfolgbarkeit garantiert von MikiLab", "Traceability powered by MikiLab")} 🍞</p>
            <a href="/" className="block text-center text-sm font-semibold text-[#5E8B7E] underline underline-offset-2 mt-3">mikilab.de</a>
          </>
        )}
      </div>
    </div>
  );
}
