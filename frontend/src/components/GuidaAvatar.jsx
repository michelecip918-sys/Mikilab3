import { useState } from "react";
import { ChefHat, Sparkles, Trophy, Users, BookOpen, MessageCircle } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

// Sezione "Guida al Sito": gli avatar di Michele & Mohamed spiegano MikiLab passo-passo.
export default function GuidaAvatar() {
  const { lang } = useLang();
  const L = (i, d, e, s) => (lang === "de" ? d : lang === "es" ? (s ?? e ?? i) : lang === "en" ? (e ?? i) : i);
  const [who, setWho] = useState("michele");

  const michele = {
    name: "Michele",
    role: L("Fondatore & Panificatore", "Gründer & Bäcker", "Founder & Baker", "Fundador & Panadero"),
    intro: L(
      "Ciao! Sono Michele. Ho creato MikiLab per condividere ricette testate e l'esperienza di anni in laboratorio, senza barriere di prezzo.",
      "Hallo! Ich bin Michele. Ich habe MikiLab gegründet, um erprobte Rezepte und jahrelange Laborerfahrung ohne Preisbarrieren zu teilen.",
      "Hi! I'm Michele. I created MikiLab to share tested recipes and years of lab experience, with no price barriers.",
      "¡Hola! Soy Michele. Creé MikiLab para compartir recetas probadas y años de experiencia, sin barreras de precio."),
  };
  const mohamed = {
    name: "Mohamed",
    role: L("Il tuo Coach di Laboratorio", "Dein Labor-Coach", "Your Lab Coach", "Tu Coach de Laboratorio"),
    intro: L(
      "Sono Mohamed, la guida IA. Ti accompagno passo-passo su ricette, tempi e organizzazione del laboratorio.",
      "Ich bin Mohamed, dein KI-Guide. Ich begleite dich Schritt für Schritt bei Rezepten, Timing und Labororganisation.",
      "I'm Mohamed, your AI guide. I walk you step-by-step through recipes, timing and lab organisation.",
      "Soy Mohamed, tu guía IA. Te acompaño paso a paso en recetas, tiempos y organización."),
  };
  const active = who === "michele" ? michele : mohamed;

  const steps = [
    { Icon: Users, t: L("1. Registrati", "1. Registrieren", "1. Register", "1. Regístrate"), d: L("Crea il tuo profilo con l'email per entrare nella community.", "Erstelle dein Profil mit E-Mail, um der Community beizutreten.", "Create your profile with email to join the community.", "Crea tu perfil con email para unirte.") },
    { Icon: Trophy, t: L("2. Completa le Sfide", "2. Challenges lösen", "2. Complete challenges", "2. Completa retos"), d: L("Crea post, invita colleghi, condividi: ogni azione ti fa guadagnare l'accesso.", "Beiträge erstellen, Kollegen einladen, teilen: jede Aktion schaltet frei.", "Create posts, invite colleagues, share: each action earns access.", "Crea posts, invita colegas, comparte: cada acción da acceso.") },
    { Icon: BookOpen, t: L("3. Sblocca i Contenuti", "3. Inhalte freischalten", "3. Unlock content", "3. Desbloquea contenido"), d: L("Ricette esclusive e schede tecniche (incluso il Panettone!) si aprono con le sfide.", "Exklusive Rezepte und Datenblätter (auch Panettone!) öffnen sich durch Challenges.", "Exclusive recipes and tech sheets (Panettone too!) open with challenges.", "Recetas exclusivas y fichas (¡Panettone!) se abren con retos.") },
  ];

  return (
    <div data-testid="guida-avatar" className="rounded-3xl border border-[#E6D8C3] overflow-hidden" style={{ background: "#FAF5EC" }}>
      <div className="p-5" style={{ background: "linear-gradient(135deg,#8C4A27,#6E371C)" }}>
        <div className="flex items-center gap-2 text-[#FFFDF9]">
          <Sparkles className="w-5 h-5" />
          <h2 className="font-display text-xl font-bold">{L("Guida al Sito", "Website-Guide", "Site Guide", "Guía del Sitio")}</h2>
        </div>
        <p className="text-[#FFFDF9]/85 text-sm mt-1">{L("Michele & Mohamed ti spiegano come funziona MikiLab.", "Michele & Mohamed erklären dir MikiLab.", "Michele & Mohamed explain how MikiLab works.", "Michele & Mohamed te explican MikiLab.")}</p>
      </div>

      <div className="p-4">
        <div className="flex gap-2 mb-3">
          {["michele", "mohamed"].map((k) => (
            <button key={k} data-testid={`guida-tab-${k}`} onClick={() => setWho(k)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${who === k ? "bg-[#8C4A27] text-[#FFFDF9]" : "bg-[#F2E8D5] text-[#6B5546]"}`}>
              <ChefHat className="w-4 h-4" /> {k === "michele" ? "Michele" : "Mohamed"}
            </button>
          ))}
        </div>

        <div data-testid="guida-avatar-intro" className="flex items-start gap-3 rounded-2xl bg-white p-3.5 border border-[#E6D8C3]">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white" style={{ background: who === "michele" ? "#8C4A27" : "#D97706" }}>
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-[#2C1E16]">{active.name} <span className="text-[11px] font-semibold text-[#8C7362]">· {active.role}</span></p>
            <p className="text-sm text-[#6B5546] mt-0.5 leading-relaxed">{active.intro}</p>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl bg-[#F2E8D5]/60 p-3">
              <s.Icon className="w-5 h-5 text-[#8C4A27] mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-sm text-[#2C1E16]">{s.t}</p>
                <p className="text-[13px] text-[#6B5546] leading-snug">{s.d}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 text-[12px] text-[#8C7362] justify-center">
          <MessageCircle className="w-3.5 h-3.5" /> {L("Nessun pagamento: guadagni tutto con le sfide.", "Keine Zahlung: alles über Challenges.", "No payment: earn everything through challenges.", "Sin pago: todo con retos.")}
        </div>
      </div>
    </div>
  );
}
