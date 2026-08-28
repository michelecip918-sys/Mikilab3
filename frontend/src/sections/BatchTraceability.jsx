import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { QrCode, Plus, Trash2, Printer, Wheat, Globe, Copy, Loader2 } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { batchesApi } from "@/lib/api";
import { getProfile } from "@/components/Onboarding";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";

// Punto 19 — Tracciabilità Lotti: schede lotto con QR stampabile per tracciare
// ogni infornata dalla farina al prodotto finito. Bacheca LOCALE (localStorage).

const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().slice(0, 10);
const genCode = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `LOT-${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
};

export default function BatchTraceability() {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);

  const [batches, setBatches] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mikilab_batches") || "[]"); } catch { return []; }
  });
  const [qr, setQr] = useState({}); // id -> dataURL
  const [showForm, setShowForm] = useState(false);
  const [publishing, setPublishing] = useState(null); // local id in corso di pubblicazione
  const [form, setForm] = useState({ code: genCode(), product: "", prodDate: today(), flour: "", flourLot: "", qty: "", expiry: "", operator: "", note: "" });

  const pubUrl = (pid) => `${window.location.origin}/?lotto=${pid}`;

  useEffect(() => { try { localStorage.setItem("mikilab_batches", JSON.stringify(batches)); } catch { /* quota */ } }, [batches]);

  // genera i QR per ogni lotto (pubblico → URL della pagina; altrimenti testo)
  useEffect(() => {
    let alive = true;
    (async () => {
      const map = {};
      for (const b of batches) {
        let payload;
        if (b.publicId) {
          payload = pubUrl(b.publicId);
        } else {
          payload = [
            `LOTTO: ${b.code}`,
            `${tri("Prodotto", "Produkt", "Product")}: ${b.product}`,
            `${tri("Produzione", "Produktion", "Produced")}: ${b.prodDate}`,
            b.flour ? `${tri("Farina", "Mehl", "Flour")}: ${b.flour}${b.flourLot ? " / " + b.flourLot : ""}` : "",
            b.expiry ? `${tri("Scadenza", "MHD", "Expiry")}: ${b.expiry}` : "",
            b.qty ? `${tri("Quantità", "Menge", "Qty")}: ${b.qty}` : "",
            b.operator ? `${tri("Operatore", "Bediener", "Operator")}: ${b.operator}` : "",
          ].filter(Boolean).join("\n");
        }
        try { map[b.id] = await QRCode.toDataURL(payload, { margin: 1, width: 240 }); } catch { /* */ }
      }
      if (alive) setQr(map);
    })();
    return () => { alive = false; };
  }, [batches]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = () => {
    if (!form.product.trim()) return;
    setBatches((p) => [{ id: uid(), ...form, product: form.product.trim() }, ...p]);
    setForm({ code: genCode(), product: "", prodDate: today(), flour: "", flourLot: "", qty: "", expiry: "", operator: "", note: "" });
    setShowForm(false);
  };
  const remove = async (id) => {
    const b = batches.find((x) => x.id === id);
    if (b?.publicId) { try { await batchesApi.remove(b.publicId); } catch { toast.error(tri("Pagina pubblica non rimossa, riprova", "Öffentliche Seite nicht entfernt", "Public page not removed, retry")); return; } }
    setBatches((p) => p.filter((x) => x.id !== id));
  };

  const publish = async (b) => {
    setPublishing(b.id);
    try {
      const storeName = (getProfile() || {}).labName || "";
      const r = await batchesApi.create({ code: b.code, product: b.product, prod_date: b.prodDate || "", expiry: b.expiry || "", flour: b.flour || "", flour_lot: b.flourLot || "", qty: b.qty || "", operator: b.operator || "", note: b.note || "", store_name: storeName });
      setBatches((p) => p.map((x) => (x.id === b.id ? { ...x, publicId: r.id } : x)));
      toast.success(tri("QR pubblico generato!", "Öffentlicher QR erstellt!", "Public QR generated!"));
    } catch (e) {
      toast.error(e?.response?.status === 403 ? tri("Funzione riservata ai PRO", "Nur für PRO", "PRO only") : tri("Pubblicazione non riuscita", "Veröffentlichung fehlgeschlagen", "Publish failed"));
    } finally { setPublishing(null); }
  };
  const copyLink = (pid) => { try { navigator.clipboard.writeText(pubUrl(pid)); toast.success(tri("Link copiato", "Link kopiert", "Link copied")); } catch { /* */ } };

  const inp = "w-full bg-[#FAF5EC] dark:bg-[#1F252B] border border-[#E6D8C3] dark:border-[#38424B] rounded-xl px-3 py-2.5 outline-none text-[#2B303B] dark:text-[#e4eff8] focus:border-[#8C4A27]";
  const lbl = "text-[11px] font-semibold uppercase text-[#7E8A93]";

  return (
    <div className="pb-40">
      <div className="no-print flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#B45309] flex items-center justify-center"><QrCode className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Tracciabilità Lotti", "Chargen-Rückverfolgung", "Batch Traceability")}</h1>
          <p className="text-sm text-[#7E8A93]">{tri("Dalla farina al prodotto finito, con QR stampabile", "Vom Mehl zum Endprodukt, mit druckbarem QR", "From flour to finished product, with printable QR")}</p>
        </div>
      </div>

      <button data-testid="batch-add" onClick={() => setShowForm((s) => !s)}
        className="no-print w-full flex items-center justify-center gap-2 bg-[#B45309] hover:bg-[#336a94] text-white font-semibold py-3 rounded-2xl active:scale-98 transition-all mb-3">
        <Plus className="w-5 h-5" /> {tri("Nuovo lotto", "Neue Charge", "New batch")}
      </button>

      {showForm && (
        <div data-testid="batch-form" className="no-print bg-[#B45309]/10 border border-[#B45309]/30 rounded-2xl p-4 mb-5 space-y-3">
          <div>
            <label className={lbl}>{tri("Codice lotto", "Chargencode", "Batch code")}</label>
            <input data-testid="batch-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inp + " font-mono-data mt-1"} />
          </div>
          <div>
            <label className={lbl}>{tri("Prodotto / Ricetta", "Produkt / Rezept", "Product / Recipe")}</label>
            <input data-testid="batch-product" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} placeholder={tri("es. Pane di Matera", "z.B. Materabrot", "e.g. Matera Bread")} className={inp + " mt-1"} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={lbl}>{tri("Data produzione", "Produktionsdatum", "Production date")}</label>
              <input data-testid="batch-proddate" type="date" value={form.prodDate} onChange={(e) => setForm({ ...form, prodDate: e.target.value })} className={inp + " mt-1"} /></div>
            <div><label className={lbl}>{tri("Scadenza", "MHD", "Expiry")}</label>
              <input data-testid="batch-expiry" type="date" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} className={inp + " mt-1"} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={lbl}>{tri("Farina (tipo)", "Mehl (Typ)", "Flour (type)")}</label>
              <input data-testid="batch-flour" value={form.flour} onChange={(e) => setForm({ ...form, flour: e.target.value })} placeholder={tri("es. Semola rimacinata", "z.B. Hartweizen", "e.g. Durum semolina")} className={inp + " mt-1"} /></div>
            <div><label className={lbl}>{tri("Lotto farina (fornitore)", "Mehl-Charge (Lieferant)", "Flour lot (supplier)")}</label>
              <input data-testid="batch-flourlot" value={form.flourLot} onChange={(e) => setForm({ ...form, flourLot: e.target.value })} className={inp + " mt-1 font-mono-data"} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={lbl}>{tri("Quantità", "Menge", "Quantity")}</label>
              <input data-testid="batch-qty" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} placeholder={tri("es. 40 pezzi", "z.B. 40 Stück", "e.g. 40 pcs")} className={inp + " mt-1"} /></div>
            <div><label className={lbl}>{tri("Operatore", "Bediener", "Operator")}</label>
              <input data-testid="batch-operator" value={form.operator} onChange={(e) => setForm({ ...form, operator: e.target.value })} className={inp + " mt-1"} /></div>
          </div>
          <div><label className={lbl}>{tri("Note (HACCP, temperature…)", "Notizen (HACCP, Temperaturen…)", "Notes (HACCP, temps…)")}</label>
            <textarea data-testid="batch-note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={2} className={inp + " mt-1"} /></div>
          <button data-testid="batch-save" onClick={add} className="w-full bg-[#8C4A27] hover:bg-[#336a94] text-white font-semibold py-3 rounded-xl active:scale-98 transition-all">{tri("Crea lotto", "Charge erstellen", "Create batch")}</button>
        </div>
      )}

      {batches.length > 0 && (
        <button data-testid="batch-print" onClick={() => window.print()}
          className="no-print w-full mb-4 flex items-center justify-center gap-2 bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] text-[#2B303B] dark:text-[#e4eff8] font-semibold py-3 rounded-2xl active:scale-98 transition-all">
          <Printer className="w-5 h-5 text-[#B45309]" /> {tri("Stampa etichette lotto", "Chargen-Etiketten drucken", "Print batch labels")}
        </button>
      )}

      {/* Area stampabile: una scheda-etichetta per lotto */}
      <div className="print-area grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="batch-list">
        {batches.length === 0 && <p className="no-print col-span-2 text-center text-sm text-[#7E8A93] py-8">{tri("Nessun lotto registrato.", "Keine Charge erfasst.", "No batch recorded.")}</p>}
        {batches.map((b) => (
          <div key={b.id} data-testid={`batch-card-${b.id}`} className="bg-white border border-[#E6D8C3] rounded-2xl p-4 break-inside-avoid">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono-data text-xs font-bold text-[#B45309]">{b.code}</p>
                <p className="font-display text-lg font-bold text-[#2B303B] leading-tight break-words">{b.product}</p>
              </div>
              {qr[b.id] && <img data-testid={`batch-qr-${b.id}`} src={qr[b.id]} alt="QR" className="w-20 h-20 shrink-0" />}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[12px] text-[#3F4A54]">
              <span className="text-[#7E8A93]">{tri("Prodotto il", "Produziert am", "Produced")}</span><span className="text-right font-mono-data">{b.prodDate}</span>
              {b.expiry && <><span className="text-[#7E8A93]">{tri("Scadenza", "MHD", "Expiry")}</span><span className="text-right font-mono-data">{b.expiry}</span></>}
              {b.flour && <><span className="text-[#7E8A93] flex items-center gap-1"><Wheat className="w-3 h-3" />{tri("Farina", "Mehl", "Flour")}</span><span className="text-right break-words">{b.flour}</span></>}
              {b.flourLot && <><span className="text-[#7E8A93]">{tri("Lotto farina", "Mehl-Charge", "Flour lot")}</span><span className="text-right font-mono-data break-words">{b.flourLot}</span></>}
              {b.qty && <><span className="text-[#7E8A93]">{tri("Quantità", "Menge", "Qty")}</span><span className="text-right">{b.qty}</span></>}
              {b.operator && <><span className="text-[#7E8A93]">{tri("Operatore", "Bediener", "Operator")}</span><span className="text-right break-words">{b.operator}</span></>}
            </div>
            {b.note && <p className="text-[11px] text-[#7E8A93] mt-2 whitespace-pre-line border-t border-[#e4eff8] pt-1">{b.note}</p>}

            {/* QR pubblico */}
            <div className="no-print mt-3 pt-2 border-t border-[#e4eff8] dark:border-[#38424B]">
              {b.publicId ? (
                <div data-testid={`batch-public-${b.id}`}>
                  <p className="text-[11px] font-semibold text-[#B45309] flex items-center gap-1 mb-1.5"><Globe className="w-3.5 h-3.5" /> {tri("QR pubblico attivo", "Öffentlicher QR aktiv", "Public QR active")}</p>
                  <div className="flex gap-1.5">
                    <button data-testid={`batch-copy-${b.id}`} onClick={() => copyLink(b.publicId)} className="flex-1 flex items-center justify-center gap-1 bg-[#FAF5EC] dark:bg-[#1F252B] border border-[#E6D8C3] dark:border-[#38424B] text-[#2B303B] dark:text-[#e4eff8] text-xs font-semibold py-2 rounded-lg active:scale-95"><Copy className="w-3.5 h-3.5" /> {tri("Copia link", "Link kopieren", "Copy link")}</button>
                    <a data-testid={`batch-open-${b.id}`} href={pubUrl(b.publicId)} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1 bg-[#8C4A27] text-white text-xs font-semibold py-2 rounded-lg active:scale-95"><Globe className="w-3.5 h-3.5" /> {tri("Apri pagina", "Seite öffnen", "Open page")}</a>
                  </div>
                </div>
              ) : (
                <button data-testid={`batch-publish-${b.id}`} onClick={() => publish(b)} disabled={publishing === b.id}
                  className="w-full flex items-center justify-center gap-1.5 bg-[#B45309] hover:bg-[#336a94] text-white text-xs font-semibold py-2.5 rounded-lg active:scale-98 disabled:opacity-50">
                  {publishing === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />} {tri("Genera QR pubblico", "Öffentlichen QR erstellen", "Generate public QR")}
                </button>
              )}
            </div>

            <button data-testid={`batch-remove-${b.id}`} onClick={() => remove(b.id)} className="no-print mt-2 text-xs text-[#7E8A93] hover:text-[#E4572E] flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> {tri("Elimina", "Löschen", "Delete")}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
