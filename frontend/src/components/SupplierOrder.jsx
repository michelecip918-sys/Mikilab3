import { useState } from "react";
import { toast } from "sonner";
import { Wheat, Droplets, ShoppingCart, Share2, Mail, Store, ExternalLink, ChevronDown } from "lucide-react";
import { fmtQty, otherLabel, buildShoppingText, hasShoppingData } from "@/lib/shopping";
import { SUPPLIERS, SUPPLIER_CATEGORIES } from "@/data/suppliers";
import { useLang } from "@/i18n/LanguageContext";

const EMAIL_KEY = "mikilab_supplier_email";

// Ordine via email (mailto): apre l'app di posta con oggetto e lista già pronti.
export default function SupplierOrder({ totals }) {
  const { t, lang } = useLang();
  // Fornitore predefinito in base alla lingua: DE → BÄKO, IT → primo mulino italiano.
  const defaultSupplier = SUPPLIERS.find((s) => (lang === "de" ? s.id === "bako" : s.id === "dallagiovanna")) || SUPPLIERS[0];
  const [supplierId, setSupplierId] = useState(defaultSupplier.id);
  const [email, setEmail] = useState(() => localStorage.getItem(EMAIL_KEY) || "");
  const [showDir, setShowDir] = useState(false);

  const supplier = SUPPLIERS.find((s) => s.id === supplierId) || defaultSupplier;
  const data = hasShoppingData(totals);
  const cats = SUPPLIER_CATEGORIES[lang] || SUPPLIER_CATEGORIES.it;

  const pickSupplier = (id) => {
    setSupplierId(id);
    const s = SUPPLIERS.find((x) => x.id === id);
    if (s && s.email) setEmail(s.email);
  };

  const orderText = () => buildShoppingText(totals, lang);

  const sendEmail = () => {
    const to = (email || supplier.email || "").trim();
    const subject = lang === "de" ? "Bestellung Mikilab" : lang === "en" ? "Mikilab order" : "Ordine Mikilab";
    const body = orderText() + (lang === "de" ? "\n\nDanke!" : lang === "en" ? "\n\nThanks!" : "\n\nGrazie!");
    if (to) localStorage.setItem(EMAIL_KEY, to);
    window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const share = async () => {
    const text = orderText();
    try {
      if (navigator.share) await navigator.share({ title: "Mikilab", text });
      else { await navigator.clipboard.writeText(text); toast.success(t("toast_copied")); }
    } catch { /* annullato */ }
  };

  return (
    <div data-testid="supplier-order" className="space-y-3">
      {/* Lista spesa */}
      <div className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] p-4">
        <div className="flex items-center gap-2 mb-2 text-[#8C4A27]">
          <ShoppingCart className="w-4 h-4" />
          <h2 className="font-display text-base font-semibold text-[#2B303B] dark:text-[#e4eff8]">{t("shop_list_title")}</h2>
        </div>
        {!data ? (
          <p className="text-sm text-[#7E8A93]">{t("shop_list_empty")}</p>
        ) : (
          <div className="space-y-1.5" data-testid="supplier-shopping">
            {Object.entries(totals.flourByType).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <Row key={k} icon={<Wheat className="w-3.5 h-3.5 text-[#8C4A27]" />} label={k} value={fmtQty(v)} />
            ))}
            {Object.entries(totals.others).map(([f, v]) => (
              <Row key={f} icon={<Droplets className="w-3.5 h-3.5 text-[#B45309]" />} label={otherLabel(f, lang)} value={fmtQty(v)} />
            ))}
            {Object.entries(totals.extras).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <Row key={k} icon={<ShoppingCart className="w-3.5 h-3.5 text-[#7E8A93]" />} label={k} value={fmtQty(v)} />
            ))}
          </div>
        )}
      </div>

      {/* Ordine al fornitore */}
      <div className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] p-4 no-print">
        <div className="flex items-center gap-2 mb-2 text-[#8C4A27]">
          <Store className="w-4 h-4" />
          <h2 className="font-display text-base font-semibold text-[#2B303B] dark:text-[#e4eff8]">{t("shop_order_title")}</h2>
        </div>
        <p className="text-sm text-[#7E8A93] mb-3">{t("shop_order_hint")}</p>
        <label className="text-[10px] font-semibold uppercase tracking-wide text-[#7E8A93]">{t("shop_supplier")}</label>
        <select data-testid="supplier-select" value={supplierId} onChange={(e) => pickSupplier(e.target.value)}
          className="mt-1 w-full bg-[#e4eff8] dark:bg-[#2A323A] border border-[#E6D8C3] dark:border-[#38424B] rounded-xl p-2.5 text-sm outline-none focus:border-[#8C4A27]">
          {SUPPLIERS.map((s) => <option key={s.id} value={s.id}>{s.flag} {s.name}</option>)}
        </select>
        <label className="text-[10px] font-semibold uppercase tracking-wide text-[#7E8A93] mt-3 block">{t("shop_email")}</label>
        <input data-testid="supplier-email" type="email" value={email} placeholder={supplier.email || t("shop_email_ph")}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full bg-[#e4eff8] dark:bg-[#2A323A] border border-[#E6D8C3] dark:border-[#38424B] rounded-xl p-2.5 text-sm outline-none focus:border-[#8C4A27]" />
        <a href={supplier.web} target="_blank" rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#8C4A27]">
          <ExternalLink className="w-3 h-3" /> {supplier.web.replace(/^https?:\/\//, "")}
        </a>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button data-testid="supplier-mail-btn" onClick={sendEmail} disabled={!data}
            className="bg-[#8C4A27] hover:bg-[#336a94] disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl active:scale-98 transition-all flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" /> {t("shop_send_email")}
          </button>
          <button data-testid="supplier-share-btn" onClick={share} disabled={!data}
            className="bg-[#B45309] hover:bg-[#336a94] disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl active:scale-98 transition-all flex items-center justify-center gap-2">
            <Share2 className="w-4 h-4" /> {t("shop_share")}
          </button>
        </div>
      </div>

      {/* Directory fornitori */}
      <div className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] overflow-hidden no-print">
        <button data-testid="supplier-dir-toggle" onClick={() => setShowDir((v) => !v)}
          className="w-full flex items-center justify-between p-4 text-left">
          <div className="flex items-center gap-2 text-[#8C4A27]">
            <Store className="w-4 h-4" />
            <span className="font-display text-base font-semibold text-[#2B303B] dark:text-[#e4eff8]">{t("shop_dir_title")}</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-[#7E8A93] transition-transform ${showDir ? "rotate-180" : ""}`} />
        </button>
        {showDir && (
          <div className="px-4 pb-4 space-y-2" data-testid="supplier-directory">
            <p className="text-sm text-[#7E8A93]">{t("shop_dir_hint")}</p>
            {SUPPLIERS.map((s) => (
              <div key={s.id} className="rounded-xl bg-[#e4eff8] dark:bg-[#2A323A] border border-[#E6D8C3] dark:border-[#38424B] p-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{s.flag}</span>
                  <span className="font-display text-base font-semibold text-[#2B303B] dark:text-[#e4eff8] flex-1 min-w-0 truncate">{s.name}</span>
                  <span className="text-[9px] font-bold uppercase text-[#6E371C] dark:text-[#8FB0C2] bg-[#B45309]/15 px-1.5 py-0.5 rounded-full shrink-0">{cats[s.category] || s.category}</span>
                </div>
                <p className="text-xs text-[#3F4A54] dark:text-[#AEB8BF] mt-1.5 leading-relaxed">{lang === "de" ? s.de : lang === "en" ? s.en : s.it}</p>
                <div className="flex items-center gap-3 mt-2">
                  <a href={s.web} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-[#8C4A27]">
                    <ExternalLink className="w-3 h-3" /> {t("shop_visit_site")}
                  </a>
                  <button onClick={() => pickSupplier(s.id)} className="inline-flex items-center gap-1 text-xs font-medium text-[#B45309]">
                    <ShoppingCart className="w-3 h-3" /> {t("shop_use_supplier")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between text-sm gap-2">
      <span className="flex items-center gap-1.5 text-[#3F4A54] dark:text-[#AEB8BF] min-w-0"><span className="shrink-0">{icon}</span><span className="truncate">{label}</span></span>
      <span className="font-mono-data font-bold text-[#6E371C] dark:text-[#8FB0C2] shrink-0">{value}</span>
    </div>
  );
}
