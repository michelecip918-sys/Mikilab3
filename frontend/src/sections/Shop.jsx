import { useEffect, useState } from "react";
import { ShoppingBag, GraduationCap, Mail, Clock, Check } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";

export default function Shop() {
  const { lang } = useLang();
  const de = lang === "de";
  const [data, setData] = useState({ enabled: false, products: [] });
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    api.get("/shop/products").then((r) => setData(r.data)).catch(() => {});
  }, []);

  const join = async (product_id = null) => {
    const e = email.trim().toLowerCase();
    if (!e || !e.includes("@")) { toast.error(de ? "Ungültige E-Mail" : "Email non valida"); return; }
    try {
      await api.post("/shop/waitlist", { email: e, product_id, lang });
      setSent(true);
      toast.success(de ? "Du bist auf der Warteliste!" : "Sei nella lista d'attesa!");
    } catch { toast.error(de ? "Fehler" : "Errore"); }
  };

  const panettoni = data.products.filter((p) => p.kind === "panettone");
  const corsi = data.products.filter((p) => p.kind === "corso");

  const Card = ({ p }) => (
    <div data-testid={`shop-product-${p.id}`} className="rounded-2xl overflow-hidden bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] shadow-sm">
      {p.image_url && <img src={p.image_url.startsWith("http") ? p.image_url : `${process.env.PUBLIC_URL}${p.image_url}`} alt={p.name} loading="lazy" className="w-full h-40 object-cover"
        onError={(e) => { e.currentTarget.style.display = "none"; }} />}
      <div className="p-4">
        <h3 className="font-display text-lg font-bold text-[#2C221E] dark:text-[#F5EFE6]">{de ? (p.name_de || p.name) : p.name}</h3>
        <p className="text-sm text-[#8C7567] mt-1 leading-snug">{de ? (p.desc_de || p.desc) : p.desc}</p>
        {p.sizes?.length ? (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {p.sizes.map((s) => <span key={s} className="text-xs font-mono-data bg-[#D99B26]/15 text-[#8C3A1D] dark:text-[#E5AC3A] px-2 py-0.5 rounded-full border border-[#D99B26]/30">{s}</span>)}
          </div>
        ) : null}
        {p.allergens ? <p className="text-[11px] text-[#8C7567] mt-2"><b>{de ? "Allergene" : "Allergeni"}:</b> {p.allergens}</p> : null}
        {data.enabled ? (
          <button data-testid={`shop-buy-${p.id}`} onClick={() => join(p.id)}
            className="mt-3 w-full bg-[#B34A26] text-white font-semibold py-2 rounded-xl active:scale-98 text-sm">
            {p.kind === "corso" ? (de ? "Anmelden" : "Iscriviti") : (de ? "Vorbestellen" : "Prenota")}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-[#B34A26]">
            <Clock className="w-3.5 h-3.5" /> {de ? "Bald verfügbar" : "In arrivo"}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div data-testid="shop-page" className="pb-4 space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-[#B34A26] to-[#8C3A1D] text-white p-7 text-center shadow-xl">
        <ShoppingBag className="w-12 h-12 mx-auto mb-2" />
        <h1 className="font-display text-3xl font-bold">{de ? "Shop & Academy" : "Shop & Academy"}</h1>
        <p className="text-white/85 text-sm mt-2">
          {data.enabled
            ? (de ? "Handwerkliche Panettoni und Online-Kurse. Wähle dein Produkt!" : "Panettoni artigianali e corsi online. Scegli il tuo prodotto!")
            : (de ? "Bald: handwerkliche Panettoni und Online-Kurse. Trag dich in die Warteliste ein!" : "In arrivo: panettoni artigianali e corsi online. Iscriviti alla lista d'attesa!")}
        </p>
      </div>

      {/* Lista d'attesa — solo quando lo shop è ancora "In arrivo" */}
      {!data.enabled && (sent ? (
        <div data-testid="shop-waitlist-done" className="rounded-2xl bg-[#6B8E62]/10 border border-[#6B8E62]/30 p-5 text-center">
          <Check className="w-8 h-8 text-[#6B8E62] mx-auto mb-2" />
          <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0]">{de ? "Danke! Wir benachrichtigen dich zum Start." : "Grazie! Ti avviseremo al lancio."}</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#D99B26]/10 border border-[#D99B26]/30 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#8C3A1D] dark:text-[#E5AC3A] mb-2">
            <Mail className="w-4 h-4" /> {de ? "Warteliste für den Start" : "Lista d'attesa per il lancio"}
          </p>
          <div className="flex gap-2">
            <input data-testid="shop-waitlist-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="email@esempio.it"
              className="flex-1 bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] rounded-xl px-3 py-2.5 text-sm outline-none text-[#2C221E] dark:text-[#F5EFE6]" />
            <button data-testid="shop-waitlist-btn" onClick={() => join(null)}
              className="bg-[#B34A26] text-white font-semibold px-4 rounded-xl active:scale-97">{de ? "Eintragen" : "Iscrivimi"}</button>
          </div>
        </div>
      ))}

      {panettoni.length > 0 && (
        <div>
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[#B34A26] mb-3 flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> {de ? "Panettoni" : "Panettoni"}</h2>
          <div className="grid grid-cols-1 gap-3">{panettoni.map((p) => <Card key={p.id} p={p} />)}</div>
        </div>
      )}
      {corsi.length > 0 && (
        <div>
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[#6B8E62] mb-3 flex items-center gap-2"><GraduationCap className="w-4 h-4" /> {de ? "Academy · Kurse" : "Academy · Corsi"}</h2>
          <div className="grid grid-cols-1 gap-3">{corsi.map((p) => <Card key={p.id} p={p} />)}</div>
        </div>
      )}
    </div>
  );
}
