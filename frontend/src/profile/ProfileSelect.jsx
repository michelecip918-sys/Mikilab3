import { Factory, GraduationCap, ChevronRight, X } from "lucide-react";
import { useProfile } from "@/profile/ProfileContext";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Schermata di selezione profilo al primo accesso (Pro vs Passion).
export default function ProfileSelect() {
  const { selecting, profile, chooseProfile } = useProfile();
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  if (!selecting) return null;

  const Card = ({ id, Icon, title, desc, points }) => (
    <button data-testid={`profile-select-${id}`} onClick={() => chooseProfile(id)}
      className="w-full text-left rounded-3xl p-5 bg-[#1e1e1e] border-2 border-[#c94f00]/50 hover:border-[#c94f00] active:scale-98 transition-all">
      <div className="flex items-center gap-3 mb-2">
        <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#c94f00] to-[#c94f00] flex items-center justify-center shrink-0">
          <Icon className="w-8 h-8 text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-extrabold text-white leading-tight">{title}</p>
          <p className="text-[12.5px] text-[#AEB8BF] leading-snug">{desc}</p>
        </div>
        <ChevronRight className="w-6 h-6 text-[#c94f00] shrink-0" />
      </div>
      <ul className="mt-2 space-y-1">
        {points.map((p, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] text-[#e4eff8] leading-snug">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c94f00] mt-1.5 shrink-0" /> {p}
          </li>
        ))}
      </ul>
    </button>
  );

  return (
    <div data-testid="profile-select" className="fixed inset-0 z-[9999] bg-[#121212] overflow-y-auto">
      <div className="max-w-md mx-auto px-5 py-10">
        {profile && (
          <button data-testid="profile-select-close" onClick={() => chooseProfile(profile)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#1e1e1e] border border-[#2e2e2e] flex items-center justify-center text-white active:scale-95">
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="text-center mb-7">
          <img src={`${process.env.PUBLIC_URL}/logo-256.png`} alt="MikiLab" className="w-20 h-20 rounded-2xl mx-auto mb-3" />
          <h1 className="font-display text-3xl font-extrabold text-white">{tri("Benvenuto in MikiLab", "Willkommen bei MikiLab", "Welcome to MikiLab", "Bienvenido a MikiLab", "Bienvenue sur MikiLab", "به MikiLab خوش آمدی")}</h1>
          <p className="text-sm text-[#AEB8BF] mt-1.5">{tri("Come vuoi usare MikiLab? Puoi cambiare quando vuoi.", "Wie möchtest du MikiLab nutzen? Jederzeit änderbar.", "How do you want to use MikiLab? Change anytime.", "¿Cómo quieres usar MikiLab? Cámbialo cuando quieras.")}</p>
        </div>
        <div className="space-y-4">
          <Card id="pro" Icon={Factory}
            title={tri("Sono un Fornaio (Pro)", "Ich bin Bäcker (Pro)", "I'm a Baker (Pro)", "Soy Panadero (Pro)")}
            desc={tri("Laboratorio professionale, veloce ed essenziale", "Profi-Backstube, schnell und essenziell", "Professional lab, fast and essential", "Laboratorio profesional, rápido")}
            points={[
              tri("Modalità Farina: pulsanti giganti e voce", "Mehl-Modus: große Tasten & Stimme", "Flour Mode: giant buttons & voice", "Modo Harina: botones gigantes y voz"),
              tri("Piano IA, fermentazione, forno, farine, timer", "KI-Plan, Gärung, Ofen, Mehle, Timer", "AI plan, fermentation, oven, flours, timers", "Plan IA, fermentación, horno, harinas, timers"),
              tri("Ricette tue con costi e margini B2B", "Deine Rezepte mit B2B-Kosten & Marge", "Your recipes with B2B costs & margins", "Tus recetas con costes y márgenes B2B"),
              tri("Niente quiz, sfide o distrazioni", "Keine Quizze, Challenges oder Ablenkung", "No quizzes, challenges or distractions", "Sin quiz, retos ni distracciones"),
            ]} />
          <Card id="passion" Icon={GraduationCap}
            title={tri("Panifico per Passione", "Ich backe aus Leidenschaft", "I bake for Passion", "Horneo por Pasión")}
            desc={tri("Impara con calma, divertiti e migliora", "Lerne in Ruhe, hab Spaß, werde besser", "Learn calmly, have fun, improve", "Aprende con calma y diviértete")}
            points={[
              tri("Academy a livelli e Bake-Along guidati", "Academy nach Levels & geführtes Bake-Along", "Level Academy & guided Bake-Along", "Academy por niveles y Bake-Along"),
              tri("Quiz, Sfida Lampo e badge", "Quiz, Blitz-Challenge & Abzeichen", "Quiz, Flash Challenge & badges", "Quiz, Reto Relámpago y medallas"),
              tri("Ricettario MikiLab e Sapori di Casa", "MikiLab-Rezepte & Hausaromen", "MikiLab recipes & Home Flavours", "Recetas MikiLab y Sabores de Casa"),
              tri("Radio del Fornaio e community", "Bäcker-Radio & Community", "Baker's Radio & community", "Radio del Panadero y comunidad"),
            ]} />
        </div>
      </div>
    </div>
  );
}
