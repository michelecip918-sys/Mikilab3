import GuidaAvatar from "@/components/GuidaAvatar";
import { Info, Sparkles } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

// "Scopri MikiLab" — spostato dalla Home dentro Le Ricette di MikiLab per liberare spazio.
export default function ScopriMikiLab() {
  const { lang } = useLang();
  const L = (i, d, e, s) => (lang === "de" ? d : lang === "es" ? (s ?? e ?? i) : ((lang === "en" || lang === "fr" || lang === "fa") ? (e ?? i) : i));
  return (
    <div className="space-y-5" data-testid="scopri-mikilab">
      <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-[#8C4A27] to-[#6E371C] text-white shadow-xl">
        <img src={`${process.env.PUBLIC_URL}/michele-real-lab.jpg`} alt="Michele" className="w-full h-52 object-cover" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="MikiLab" className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/40" />
            <div>
              <h1 className="font-display text-2xl font-bold leading-none">Scopri MikiLab</h1>
              <p className="text-white/80 text-xs mt-1">{L("Chi è Michele, il metodo e la filosofia", "Wer Michele ist, Methode & Philosophie", "Who Michele is, the method & philosophy", "Quién es Michele, método y filosofía")}</p>
            </div>
          </div>
          <p className="text-[15px] leading-relaxed text-white/95">{L(
            "Ciao, sono Michele: fornaio e appassionato di arte bianca. MikiLab è il sito che ho creato per aiutare i panettieri a organizzare il lavoro come lo farei io: ricette dettagliate, liste della spesa, pianificazione della produzione e un assistente AI che calcola e adatta ogni fase senza errori. C'è anche il Social dei Panettieri per condividere idee, foto e ricette. Tu pensi al laboratorio, al resto pensiamo noi.",
            "Hallo, ich bin Michele: Bäcker mit Leidenschaft für die Backkunst. MikiLab hilft Bäckern, ihre Arbeit so zu organisieren, wie ich es tun würde: detaillierte Rezepte, Einkaufslisten, Produktionsplanung und ein KI-Assistent, der jede Phase fehlerfrei berechnet. Es gibt auch das Bäcker-Social. Du kümmerst dich um die Backstube, um den Rest kümmern wir uns.",
            "Hi, I'm Michele: a baker in love with the craft. MikiLab helps bakers organise their work exactly as I would: detailed recipes, shopping lists, production planning and an AI assistant that calculates and adapts every stage with no errors. There's also the Bakers' Social. You focus on the bakery, we take care of the rest.",
            "Hola, soy Michele: panadero apasionado del arte blanco. MikiLab ayuda a organizar el trabajo como lo haría yo: recetas detalladas, listas de la compra, planificación y un asistente de IA. También está el Social de Panaderos. Tú piensa en el obrador, del resto nos encargamos nosotros."
          )}</p>
          <div className="mt-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide bg-white/15 border border-white/30 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" /> IT · DE · EN · ES · FR · FA
          </div>
        </div>
      </div>

      <GuidaAvatar />

      <div className="flex items-start gap-2 text-xs text-[#7E8A93] px-1">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>{L("Michele e Mohammadreza ti guidano nel sito, sezione per sezione.", "Michele und Mohammadreza führen dich durch die Seite.", "Michele and Mohammadreza guide you through the site.", "Michele y Mohammadreza te guían por el sitio.")}</span>
      </div>
    </div>
  );
}
