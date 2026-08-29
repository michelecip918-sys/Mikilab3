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
      const d = await api.post("/recipes/bundle-checkout", { bundle, origin_url: window.location.origin, lang }).then((r) => r.data);
      if (d.url) window.location.href = d.url;
    } catch { toast.error(tri("Errore, riprova", "Fehler, versuche erneut", "Error, try again", "Error, inténtalo de nuevo")); }
  };

  const buyRecipes = async (kind) => {
    if (!user) { setAuthOpen(true); return; }
    try {
      const d = await recipePurchaseApi.checkout(kind, null);
      if (d.url) window.location.href = d.url;
    } catch { toast.error(tri("Errore, riprova", "Fehler, versuche erneut", "Error, try again", "Error, inténtalo de nuevo")); }
  };
  const subscribePro = async () => {
    try {
      const d = await subscriptionApi.checkout("monthly", "lab");
      if (d.url) window.location.href = d.url;
    } catch { toast.error(tri("Errore, riprova", "Fehler, versuche erneut", "Error, try again", "Error, inténtalo de nuevo")); }
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

  const pick = (p, base) => lang === "de" ? (p[`${base}_de`] || p[base]) : lang === "es" ? (p[`${base}_es`] || p[`${base}_en`] || p[base]) : (lang === "en" || lang === "fr" || lang === "fa") ? (p[`${base}_en`] || p[base]) : p[base];

  const Card = ({ p }) => (
    <div data-testid={`shop-product-${p.id}`} className="rounded-2xl overflow-hidden bg-white dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] shadow-sm">
      {p.image_url && <img src={p.image_url.startsWith("http") ? p.image_url : `${process.env.PUBLIC_URL}${p.image_url}`} alt={pick(p, "name")} loading="lazy" className="w-full h-40 object-cover"
        onError={(e) => { e.currentTarget.style.display = "none"; }} />}
      <div className="p-4">
        <h3 className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8]">{pick(p, "name")}</h3>
        <p className="text-sm text-[#7E8A93] mt-1 leading-snug">{pick(p, "desc")}</p>
        {p.sizes?.length ? (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {p.sizes.map((s) => <span key={s} className="text-xs font-mono-data bg-[#ff6b00]/15 text-[#ff6b00] dark:text-[#8FB0C2] px-2 py-0.5 rounded-full border border-[#ff6b00]/30">{s}</span>)}
          </div>
        ) : null}
        {p.allergens ? <p className="text-[11px] text-[#7E8A93] mt-2"><b>{tri("Allergeni","Allergene","Allergens","Alérgenos")}:</b> {pick(p, "allergens")}</p> : null}
        {data.enabled ? (
          <button data-testid={`shop-buy-${p.id}`} onClick={() => join(p.id)}
            className="mt-3 w-full bg-[#ff6b00] text-white font-semibold py-2 rounded-xl active:scale-98 text-sm">
            {p.kind === "corso" ? tri("Iscriviti","Anmelden","Enrol","Inscríbete") : tri("Prenota","Vorbestellen","Pre-order","Reservar")}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-[#ff6b00]">
            <Clock className="w-3.5 h-3.5" /> {tri("In arrivo","Bald verfügbar","Coming soon","Próximamente")}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div data-testid="shop-page" className="pb-4 space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-[#ff6b00] to-[#ff6b00] text-white p-7 text-center shadow-xl">
        <ShoppingBag className="w-12 h-12 mx-auto mb-2" />
        <h1 className="font-display text-3xl font-bold">{de ? "Shop & Academy" : "Shop & Academy"}</h1>
        <p className="text-white/85 text-sm mt-2">
          {data.enabled
            ? tri("Panettoni artigianali e corsi online. Scegli il tuo prodotto!","Handwerkliche Panettoni und Online-Kurse. Wähle dein Produkt!","Artisan panettoni and online courses. Pick your product!","¡Panettones artesanales y cursos online. Elige tu producto!")
            : tri("In arrivo: panettoni artigianali e corsi online. Iscriviti alla lista d'attesa!","Bald: handwerkliche Panettoni und Online-Kurse. Trag dich in die Warteliste ein!","Coming soon: artisan panettoni and online courses. Join the waitlist!","Próximamente: panettones artesanales y cursos online. ¡Únete a la lista de espera!")}
        </p>
      </div>

      <AvatarBubbles variant="shop" />

      {/* Tutto gratuito: nessun acquisto, nessun abbonamento */}
      <div data-testid="shop-free-block" className="rounded-3xl bg-gradient-to-br from-[#ff6b00] to-[#ff6b00] text-white shadow-sm overflow-hidden p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-3">
          <BookOpen className="w-7 h-7 text-white" />
        </div>
        <h2 className="font-display text-2xl font-bold">{tri("È tutto gratis 🎉", "Alles gratis 🎉", "It's all free 🎉", "¡Todo gratis! 🎉", "Tout est gratuit 🎉", "همه چیز رایگان است 🎉")}</h2>
        <p className="text-white/90 text-sm mt-2 leading-relaxed max-w-md mx-auto">
          {tri("Ogni ricetta, scheda tecnica e strumento del laboratorio è sbloccato per tutti. Nessun pagamento, nessun abbonamento: buona panificazione!",
            "Jedes Rezept, jede Karte und jedes Werkzeug ist für alle freigeschaltet. Keine Zahlung, kein Abo — frohes Backen!",
            "Every recipe, tech sheet and lab tool is unlocked for everyone. No payment, no subscription — happy baking!",
            "Cada receta, ficha y herramienta está desbloqueada para todos. Sin pagos, sin suscripción: ¡feliz panificación!",
            "Chaque recette, fiche technique et outil du labo est débloqué pour tous. Aucun paiement, aucun abonnement — bonne panification !",
            "هر دستور، برگهٔ فنی و ابزار کارگاه برای همه باز است. بدون پرداخت، بدون اشتراک — نان‌پزی خوش!")}
        </p>
      </div>
    </div>
  );
}
