import { useEffect, useState } from "react";
import { ShoppingBag, GraduationCap, Mail, Clock, Check, BookOpen, Crown } from "lucide-react";
import { toast } from "sonner";
import { api, recipePurchaseApi, subscriptionApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import AvatarBubbles from "@/components/AvatarBubbles";

export default function Shop({ hideCourses = false }) {
  const { lang, tri } = useLang();
  const { user, setAuthOpen } = useAuth();
  const de = lang === "de";
  const [data, setData] = useState({ enabled: false, products: [] });
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [ent, setEnt] = useState(null);

  useEffect(() => {
    api.get("/shop/products").then((r) => setData(r.data)).catch(() => {});
    if (user) api.get("/subscription/status").then((r) => setEnt(r.data)).catch(() => {});
  }, [user]);

  const buyBundle = async (bundle) => {
    if (!user) { setAuthOpen(true); return; }
    try {
      const d = await api.post("/recipes/bundle-checkout", { bundle, origin_url: window.location.origin }).then((r) => r.data);
      if (d.url) window.location.href = d.url;
    } catch { toast.error(tri("Errore, riprova", "Fehler, versuche erneut", "Error, try again")); }
  };

  const buyRecipes = async (kind) => {
    if (!user) { setAuthOpen(true); return; }
    try {
      const d = await recipePurchaseApi.checkout(kind, null);
      if (d.url) window.location.href = d.url;
    } catch { toast.error(tri("Errore, riprova", "Fehler, versuche erneut", "Error, try again")); }
  };
  const subscribePro = async () => {
    try {
      const d = await subscriptionApi.checkout("monthly", "lab");
      if (d.url) window.location.href = d.url;
    } catch { toast.error(tri("Errore, riprova", "Fehler, versuche erneut", "Error, try again")); }
  };

  const join = async (product_id = null) => {
    const e = email.trim().toLowerCase();
    if (!e || !e.includes("@")) { toast.error(tri("Email non valida","Ungültige E-Mail","Invalid email")); return; }
    try {
      await api.post("/shop/waitlist", { email: e, product_id, lang });
      setSent(true);
      toast.success(tri("Sei nella lista d'attesa!","Du bist auf der Warteliste!","You are on the waitlist!"));
    } catch { toast.error(tri("Errore","Fehler","Error")); }
  };

  const panettoni = data.products.filter((p) => p.kind === "panettone");
  const corsi = data.products.filter((p) => p.kind === "corso");

  const pick = (p, base) => lang === "de" ? (p[`${base}_de`] || p[base]) : (lang === "en" || lang === "es") ? (p[`${base}_en`] || p[base]) : p[base];

  const Card = ({ p }) => (
    <div data-testid={`shop-product-${p.id}`} className="rounded-2xl overflow-hidden bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] shadow-sm">
      {p.image_url && <img src={p.image_url.startsWith("http") ? p.image_url : `${process.env.PUBLIC_URL}${p.image_url}`} alt={pick(p, "name")} loading="lazy" className="w-full h-40 object-cover"
        onError={(e) => { e.currentTarget.style.display = "none"; }} />}
      <div className="p-4">
        <h3 className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8]">{pick(p, "name")}</h3>
        <p className="text-sm text-[#7E8A93] mt-1 leading-snug">{pick(p, "desc")}</p>
        {p.sizes?.length ? (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {p.sizes.map((s) => <span key={s} className="text-xs font-mono-data bg-[#6E8CA0]/15 text-[#234b6e] dark:text-[#8FB0C2] px-2 py-0.5 rounded-full border border-[#6E8CA0]/30">{s}</span>)}
          </div>
        ) : null}
        {p.allergens ? <p className="text-[11px] text-[#7E8A93] mt-2"><b>{tri("Allergeni","Allergene","Allergens")}:</b> {pick(p, "allergens")}</p> : null}
        {data.enabled ? (
          <button data-testid={`shop-buy-${p.id}`} onClick={() => join(p.id)}
            className="mt-3 w-full bg-[#3f7cac] text-white font-semibold py-2 rounded-xl active:scale-98 text-sm">
            {p.kind === "corso" ? tri("Iscriviti","Anmelden","Enrol") : tri("Prenota","Vorbestellen","Pre-order")}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-[#3f7cac]">
            <Clock className="w-3.5 h-3.5" /> {tri("In arrivo","Bald verfügbar","Coming soon")}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div data-testid="shop-page" className="pb-4 space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-[#3f7cac] to-[#234b6e] text-white p-7 text-center shadow-xl">
        <ShoppingBag className="w-12 h-12 mx-auto mb-2" />
        <h1 className="font-display text-3xl font-bold">{de ? "Shop & Academy" : "Shop & Academy"}</h1>
        <p className="text-white/85 text-sm mt-2">
          {data.enabled
            ? tri("Panettoni artigianali e corsi online. Scegli il tuo prodotto!","Handwerkliche Panettoni und Online-Kurse. Wähle dein Produkt!","Artisan panettoni and online courses. Pick your product!")
            : tri("In arrivo: panettoni artigianali e corsi online. Iscriviti alla lista d'attesa!","Bald: handwerkliche Panettoni und Online-Kurse. Trag dich in die Warteliste ein!","Coming soon: artisan panettoni and online courses. Join the waitlist!")}
        </p>
      </div>

      <AvatarBubbles variant="shop" />

      {/* Ricettario MikiLab — ACQUISTABILE ora (revenue) */}
      <div data-testid="shop-recipes-block" className="rounded-3xl bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] shadow-sm overflow-hidden">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-1.5">
            <BookOpen className="w-5 h-5 text-[#3f7cac]" />
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#3f7cac]">{tri("Disponibile ora", "Jetzt verfügbar", "Available now")}</span>
          </div>
          <h2 className="font-display text-xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Pacchetti Ricette di Michele", "Micheles Rezept-Pakete", "Michele's Recipe Packs")}</h2>
          <p className="text-sm text-[#7E8A93] mt-1 leading-snug">
            {tri("Acquista un pacchetto e sblocca SUBITO tutte le ricette della categoria (dosi, procedimento, fasi) nel tuo laboratorio.",
              "Kaufe ein Paket und schalte SOFORT alle Rezepte der Kategorie frei.",
              "Buy a pack and INSTANTLY unlock all recipes in that category.")}
          </p>
          <div className="grid grid-cols-1 gap-2.5 mt-4">
            {[
              { b: "pane", it: "Pacchetto Pane", de: "Paket Brot", en: "Bread Pack", price: "€40", grad: true },
              { b: "panettoni", it: "Grandi Lievitati (Panettoni & Colombe)", de: "Große Hefegebäcke", en: "Large Leavened (Panettoni & Colombe)", price: "€50", grad: true },
              { b: "panini", it: "Pacchetto Panini", de: "Paket Brötchen", en: "Buns Pack", price: "€20" },
              { b: "snack", it: "Pacchetto Snack", de: "Paket Snacks", en: "Snacks Pack", price: "€10" },
            ].map((x) => {
              const owned = (ent?.unlocked_bundles || []).includes(x.b) || ent?.unlock_all;
              return (
                <button key={x.b} data-testid={`shop-bundle-${x.b}`} disabled={owned} onClick={() => buyBundle(x.b)}
                  className={`w-full flex items-center justify-between rounded-2xl px-4 py-3 active:scale-98 transition-all ${owned ? "bg-[#5aa0cf]/15 border border-[#5aa0cf]/40" : x.grad ? "bg-gradient-to-br from-[#3f7cac] to-[#234b6e] text-white" : "bg-[#6E8CA0]/10 border-2 border-[#6E8CA0]"}`}>
                  <span className="text-left min-w-0">
                    <span className={`block font-semibold truncate ${x.grad && !owned ? "text-white" : "text-[#2B303B] dark:text-[#e4eff8]"}`}>{tri(x.it, x.de, x.en)}</span>
                    <span className={`block text-xs ${x.grad && !owned ? "text-white/80" : "text-[#7E8A93]"}`}>{owned ? tri("Acquistato ✓ — ricette sbloccate", "Gekauft ✓", "Purchased ✓") : tri("Tutte le ricette della categoria, per sempre", "Alle Rezepte der Kategorie, für immer", "All category recipes, forever")}</span>
                  </span>
                  <span className={`font-display text-lg font-bold shrink-0 ml-2 ${x.grad && !owned ? "text-white" : "text-[#234b6e] dark:text-[#8FB0C2]"}`}>{owned ? "✓" : x.price}</span>
                </button>
              );
            })}
            <div className="text-center pt-0.5">
              <button data-testid="shop-subscribe-pro" onClick={subscribePro}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#3f7cac] hover:underline">
                <Crown className="w-4 h-4" /> {tri("oppure abbonati PRO (tutto incluso) · €29,99/mese", "oder PRO abonnieren · €29,99/Monat", "or subscribe PRO · €29.99/month")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {!data.enabled && (sent ? (
        <div data-testid="shop-waitlist-done" className="rounded-2xl bg-[#5aa0cf]/10 border border-[#5aa0cf]/30 p-5 text-center">
          <Check className="w-8 h-8 text-[#5aa0cf] mx-auto mb-2" />
          <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF]">{tri("Grazie! Ti avviseremo al lancio.","Danke! Wir benachrichtigen dich zum Start.","Thanks! We'll notify you at launch.")}</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#6E8CA0]/10 border border-[#6E8CA0]/30 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#234b6e] dark:text-[#8FB0C2] mb-2">
            <Mail className="w-4 h-4" /> {tri("Lista d'attesa per il lancio","Warteliste für den Start","Launch waitlist")}
          </p>
          <div className="flex gap-2">
            <input data-testid="shop-waitlist-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="email@esempio.it"
              className="flex-1 bg-white dark:bg-[#1F252B] border border-[#d5e4f0] dark:border-[#38424B] rounded-xl px-3 py-2.5 text-sm outline-none text-[#2B303B] dark:text-[#e4eff8]" />
            <button data-testid="shop-waitlist-btn" onClick={() => join(null)}
              className="bg-[#3f7cac] text-white font-semibold px-4 rounded-xl active:scale-97">{tri("Iscrivimi","Eintragen","Join")}</button>
          </div>
        </div>
      ))}

      {panettoni.length > 0 && (
        <div>
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[#3f7cac] mb-3 flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> {de ? "Panettoni" : "Panettoni"}</h2>
          <div className="grid grid-cols-1 gap-3">{panettoni.map((p) => <Card key={p.id} p={p} />)}</div>
        </div>
      )}
      {corsi.length > 0 && (
        <div>
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[#5aa0cf] mb-3 flex items-center gap-2"><GraduationCap className="w-4 h-4" /> {tri("Academy · Corsi","Academy · Kurse","Academy · Courses")}</h2>
          <div className="grid grid-cols-1 gap-3">{corsi.map((p) => <Card key={p.id} p={p} />)}</div>
        </div>
      )}
    </div>
  );
}
