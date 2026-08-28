import { useState } from "react";
import { ChefHat, Sparkles, Trophy, Users, BookOpen, MessageCircle } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

// Sezione "Guida al Sito": gli avatar di Michele & Mohamed spiegano MikiLab passo-passo.
export default function GuidaAvatar() {
  const { lang } = useLang();
  const L = (i, d, e, s) => (lang === "de" ? d : lang === "es" ? (s ?? e ?? i) : lang === "it" ? i : (e ?? i));
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
    name: "Mohammadreza",
    role: L("Amico, socio & Coach di Laboratorio", "Freund, Partner & Labor-Coach", "Friend, partner & Lab Coach", "Amigo, socio y Coach de Laboratorio"),
    intro: L(
      "Sono Mohammadreza. Con Michele ci siamo conosciuti da emigrati e abbiamo lavorato spalla a spalla: oggi sono la guida che ti accompagna passo-passo su ricette, tempi e organizzazione.",
      "Ich bin Mohammadreza. Michele und ich haben uns als Emigranten kennengelernt und Schulter an Schulter gearbeitet: heute bin ich der Guide für Rezepte, Zeiten und Organisation.",
      "I'm Mohammadreza. Michele and I met as emigrants and worked side by side: today I'm the guide who walks you through recipes, timing and organisation.",
      "Soy Mohammadreza. Michele y yo nos conocimos como emigrantes y trabajamos codo con codo: hoy soy la guía de recetas, tiempos y organización."),
    story: L(
      "La nostra è una storia di amicizia e riscatto. Arrivati in Germania da emigrati, lontani da casa, ci siamo trovati fianco a fianco davanti al forno: notti di lavoro, tanta fatica e la voglia di ricominciare. Michele mi ha insegnato l'arte bianca, io gli ho dato una mano a non mollare mai. MikiLab nasce anche da qui — dall'idea che il pane unisce le persone e che nessuno debba sentirsi solo in un paese nuovo.",
      "Unsere ist eine Geschichte von Freundschaft und Neuanfang. Als Emigranten nach Deutschland gekommen, fern der Heimat, standen wir Seite an Seite am Ofen: Nachtschichten, harte Arbeit und der Wille, neu anzufangen. Michele brachte mir die Backkunst bei, ich half ihm, nie aufzugeben. MikiLab entstand auch daraus — aus der Idee, dass Brot Menschen verbindet.",
      "Ours is a story of friendship and redemption. Arriving in Germany as emigrants, far from home, we found ourselves side by side at the oven: night shifts, hard work and the will to start over. Michele taught me the baking craft, I helped him never give up. MikiLab was born from this too — the idea that bread brings people together.",
      "La nuestra es una historia de amistad y superación. Llegados a Alemania como emigrantes, lejos de casa, nos encontramos codo con codo ante el horno: noches de trabajo, esfuerzo y ganas de empezar de nuevo. Michele me enseñó el arte blanco, yo le ayudé a no rendirse. MikiLab también nace de aquí."),
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
              <ChefHat className="w-4 h-4" /> {k === "michele" ? "Michele" : "Mohammadreza"}
            </button>
          ))}
        </div>

        <div data-testid="guida-avatar-intro" className="flex items-start gap-3 rounded-2xl bg-white p-3.5 border border-[#E6D8C3]">
          <div className="w-20 h-20 rounded-full shrink-0 overflow-hidden border-4 shadow-md" style={{ borderColor: who === "michele" ? "#8C4A27" : "#D97706" }}>
            <img src={who === "michele" ? "https://static.prod-images.emergentagent.com/jobs/a3a8adf3-0daf-4c97-b252-e649a2b2f60f/images/c99aac6a20fcfdfa27f74c3f3eeb65336c18f8eb8e0e888a4f8f79fd3254d134.jpeg" : "https://static.prod-images.emergentagent.com/jobs/a3a8adf3-0daf-4c97-b252-e649a2b2f60f/images/045758ee362c4a5e183bda0811b41950c1ed65e7bd1ea7b210377bf9a403c65a.jpeg"} alt={active.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-bold text-[#2C1E16]">{active.name} <span className="text-[11px] font-semibold text-[#8C7362]">· {active.role}</span></p>
            <p className="text-sm text-[#6B5546] mt-0.5 leading-relaxed">{active.intro}</p>
          </div>
        </div>

        {who === "mohamed" && active.story && (
          <div data-testid="guida-mohamed-story" className="mt-3 rounded-2xl bg-[#FEF3C7] border border-[#E6D8C3] p-4">
            <p className="font-display text-base font-bold text-[#8C4A27] mb-1">{L("La nostra storia", "Unsere Geschichte", "Our story", "Nuestra historia")}</p>
            <p className="text-[13.5px] text-[#6B5546] leading-relaxed">{active.story}</p>
          </div>
        )}

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
