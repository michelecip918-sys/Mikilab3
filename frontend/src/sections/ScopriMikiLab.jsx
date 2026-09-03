import { mkTri } from "@/i18n/triMaps";
import GuidaAvatar from "@/components/GuidaAvatar";
import { Info, Sparkles } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

// "Scopri MikiLab" — spostato dalla Home dentro Le Ricette di MikiLab per liberare spazio.
export default function ScopriMikiLab() {
  const { lang } = useLang();
  const L = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  return (
    <div className="space-y-5" data-testid="scopri-mikilab">
      <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-[#3E9C93] to-[#3E9C93] text-white shadow-xl">
        <img src={`${process.env.PUBLIC_URL}/michele-real-lab.jpg`} alt="Michele" className="w-full h-52 object-cover" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="MikiLab" className="w-12 h-12 rounded-2xl shadow-md border border-amber-900/40 object-cover ring-2 ring-white/40" />
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

      {/* Come nasce MikiLab — timeline */}
      <div data-testid="scopri-timeline" className="rounded-2xl border border-[#2A3B49] dark:border-[#2A3B49] bg-white dark:bg-[#1B2A38] p-4">
        <p className="font-display text-lg font-bold text-[#3E9C93] dark:text-[#e4eff8] mb-3">{L("Come nasce MikiLab", "Wie MikiLab entstand", "How MikiLab was born", "Cómo nace MikiLab")}</p>
        <div className="relative pl-6">
          <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-[#3E9C93]/30" />
          {[
            { t: L("Anni in laboratorio", "Jahre im Labor", "Years in the lab", "Años en el obrador"), d: L("Michele affina ricette e metodo, notte dopo notte, davanti al forno.", "Michele verfeinert Rezepte und Methode, Nacht für Nacht am Ofen.", "Michele refines recipes and method, night after night at the oven.", "Michele perfecciona recetas y método, noche tras noche ante el horno.") },
            { t: L("L'idea di condividere", "Die Idee zu teilen", "The idea to share", "La idea de compartir"), d: L("Trasformare l'esperienza in strumenti semplici per ogni fornaio.", "Erfahrung in einfache Werkzeuge für jeden Bäcker verwandeln.", "Turning experience into simple tools for every baker.", "Convertir la experiencia en herramientas simples para cada panadero.") },
            { t: L("Nasce MikiLab", "MikiLab entsteht", "MikiLab is born", "Nace MikiLab"), d: L("Ricette, pianificazione e un assistente IA, tutto in un unico laboratorio digitale.", "Rezepte, Planung und ein KI-Assistent in einem digitalen Labor.", "Recipes, planning and an AI assistant, all in one digital lab.", "Recetas, planificación y un asistente de IA, todo en un laboratorio digital.") },
          ].map((s, i) => (
            <div key={i} className="relative mb-4 last:mb-0">
              <span className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-[#3E9C93] border-2 border-white dark:border-[#1B2A38]" />
              <p className="font-display text-sm font-bold text-[#2B303B] dark:text-[#e4eff8]">{s.t}</p>
              <p className="text-[12.5px] text-[#3F4A54] dark:text-[#AEB8BF] leading-snug">{s.d}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-[#7E8A93] px-1">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>{L("Michele ti guida in MikiLab, sezione per sezione.", "Michele führt dich durch MikiLab, Bereich für Bereich.", "Michele guides you through MikiLab, section by section.", "Michele te guía por MikiLab, sección por sección.")}</span>
      </div>
    </div>
  );
}
