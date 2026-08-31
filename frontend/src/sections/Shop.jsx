import { ShoppingBag, BookOpen, GraduationCap, Sparkles } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import AvatarBubbles from "@/components/AvatarBubbles";

// MikiLab è 100% gratuito: nessun acquisto, nessun abbonamento, nessuna lista d'attesa a pagamento.
export default function Shop({ onNavigate }) {
  const { lang, tri } = useLang();

  return (
    <div data-testid="shop-page" className="pb-4 space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-[#ff6b00] to-[#c94f00] text-white p-7 text-center shadow-xl">
        <ShoppingBag className="w-12 h-12 mx-auto mb-2" />
        <h1 className="font-display text-3xl font-bold">{tri("Academy & Ricette", "Academy & Rezepte", "Academy & Recipes", "Academy y Recetas", "Academy & Recettes", "آکادمی و دستورها")}</h1>
        <p className="text-white/85 text-sm mt-2 max-w-md mx-auto">
          {tri("Tutto quello che serve per panificare, sempre gratis.",
            "Alles fürs Backen, immer kostenlos.",
            "Everything you need to bake, always free.",
            "Todo lo que necesitas para panificar, siempre gratis.",
            "Tout pour la panification, toujours gratuit.",
            "هرچه برای نان‌پزی لازم داری، همیشه رایگان.")}
        </p>
      </div>

      <AvatarBubbles variant="shop" />

      {/* Tutto gratuito: nessun acquisto, nessun abbonamento */}
      <div data-testid="shop-free-block" className="rounded-3xl bg-gradient-to-br from-[#ff6b00] to-[#c94f00] text-white shadow-sm overflow-hidden p-6 text-center">
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

      {/* Scorciatoie gratuite */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button data-testid="shop-go-recipes" onClick={() => onNavigate && onNavigate("ricette")}
          className="text-left rounded-2xl p-5 bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] shadow-sm active:scale-98 transition-all flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#ff6b00]/15 flex items-center justify-center shrink-0"><BookOpen className="w-6 h-6 text-[#ff6b00]" /></div>
          <div className="min-w-0">
            <p className="font-display text-base font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Le Mie Ricette", "Meine Rezepte", "My Recipes", "Mis Recetas", "Mes Recettes", "دستورهای من")}</p>
            <p className="text-[12px] text-[#7E8A93] leading-snug">{tri("Ricettario completo, sbloccato", "Komplettes Rezeptbuch, freigeschaltet", "Full recipe book, unlocked", "Recetario completo, desbloqueado", "Livre de recettes complet", "کتاب کامل دستورها، باز")}</p>
          </div>
        </button>
        <button data-testid="shop-go-academy" onClick={() => onNavigate && onNavigate("impara")}
          className="text-left rounded-2xl p-5 bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] shadow-sm active:scale-98 transition-all flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#ff6b00]/15 flex items-center justify-center shrink-0"><GraduationCap className="w-6 h-6 text-[#ff6b00]" /></div>
          <div className="min-w-0">
            <p className="font-display text-base font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Impara da Casa", "Von zu Hause lernen", "Learn from Home", "Aprende en Casa", "Apprends à la maison", "از خانه یاد بگیر")}</p>
            <p className="text-[12px] text-[#7E8A93] leading-snug">{tri("Lezioni, quiz e diagnosi — gratis", "Lektionen, Quiz & Diagnose — gratis", "Lessons, quiz & diagnosis — free", "Lecciones, quiz y diagnóstico — gratis", "Leçons, quiz & diagnostic — gratuit", "درس‌ها، آزمون و تشخیص — رایگان")}</p>
          </div>
        </button>
      </div>
    </div>
  );
}
