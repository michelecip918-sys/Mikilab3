import { mkTri } from "@/i18n/triMaps";
import { Sparkles, Trophy, Users, BookOpen, MessageCircle } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

// Sezione "Guida al Sito": Michele, fondatore di MikiLab, spiega la piattaforma passo-passo.
export default function GuidaAvatar() {
  const { lang } = useLang();
  const L = (i, d, e, s) => mkTri(lang)(i, d, e, s);

  const michele = {
    name: "Michele",
    role: L("Fondatore & Panificatore", "Gründer & Bäcker", "Founder & Baker", "Fundador & Panadero"),
    intro: L(
      "Ciao! Sono Michele. Ho creato MikiLab per condividere ricette testate e l'esperienza di anni in laboratorio, senza barriere di prezzo.",
      "Hallo! Ich bin Michele. Ich habe MikiLab gegründet, um erprobte Rezepte und jahrelange Laborerfahrung ohne Preisbarrieren zu teilen.",
      "Hi! I'm Michele. I created MikiLab to share tested recipes and years of lab experience, with no price barriers.",
      "¡Hola! Soy Michele. Creé MikiLab para compartir recetas probadas y años de experiencia, sin barreras de precio."),
  };
  const active = michele;

  const steps = [
    { Icon: Users, t: L("1. Registrati", "1. Registrieren", "1. Register", "1. Regístrate"), d: L("Crea il tuo profilo con l'email per entrare nella community.", "Erstelle dein Profil mit E-Mail, um der Community beizutreten.", "Create your profile with email to join the community.", "Crea tu perfil con email para unirte.") },
    { Icon: Trophy, t: L("2. Completa le Sfide", "2. Challenges lösen", "2. Complete challenges", "2. Completa retos"), d: L("Crea post, invita colleghi, condividi: ogni azione ti fa guadagnare l'accesso.", "Beiträge erstellen, Kollegen einladen, teilen: jede Aktion schaltet frei.", "Create posts, invite colleagues, share: each action earns access.", "Crea posts, invita colegas, comparte: cada acción da acceso.") },
    { Icon: BookOpen, t: L("3. Sblocca i Contenuti", "3. Inhalte freischalten", "3. Unlock content", "3. Desbloquea contenido"), d: L("Ricette esclusive e schede tecniche (incluso il Panettone!) si aprono con le sfide.", "Exklusive Rezepte und Datenblätter (auch Panettone!) öffnen sich durch Challenges.", "Exclusive recipes and tech sheets (Panettone too!) open with challenges.", "Recetas exclusivas y fichas (¡Panettone!) se abren con retos.") },
  ];

  return (
    <div data-testid="guida-avatar" className="rounded-3xl border border-[#2A3B49] overflow-hidden" style={{ background: "#0D1520" }}>
      <div className="p-5" style={{ background: "linear-gradient(135deg,#3E9C93,#3E9C93)" }}>
        <div className="flex items-center gap-2 text-[#0D1520]">
          <Sparkles className="w-5 h-5" />
          <h2 className="font-display text-xl font-bold">{L("Guida al Sito", "Website-Guide", "Site Guide", "Guía del Sitio")}</h2>
        </div>
        <p className="text-[#0D1520]/85 text-sm mt-1">{L("Michele ti spiega come funziona MikiLab.", "Michele erklärt dir, wie MikiLab funktioniert.", "Michele explains how MikiLab works.", "Michele te explica cómo funciona MikiLab.")}</p>
      </div>

      <div className="p-4">
        <div data-testid="guida-avatar-intro" className="flex items-start gap-3 rounded-2xl bg-white p-3.5 border border-[#2A3B49]">
          <div className="w-20 h-20 rounded-full shrink-0 overflow-hidden border-4 shadow-md" style={{ borderColor: "#3E9C93" }}>
            <img src={`${process.env.PUBLIC_URL}/michele-avatar-real.jpg`} alt={active.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-bold text-[#3E9C93]">{active.name} <span className="text-[11px] font-semibold text-[#64748B]">· {active.role}</span></p>
            <p className="text-sm text-[#3E9C93] mt-0.5 leading-relaxed">{active.intro}</p>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-start gap-3 rounded-2xl shadow-md border border-amber-900/40 bg-[#1B2A38]/60 p-3">
              <s.Icon className="w-5 h-5 text-[#3E9C93] mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-sm text-[#3E9C93]">{s.t}</p>
                <p className="text-[13px] text-[#3E9C93] leading-snug">{s.d}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 text-[12px] text-[#64748B] justify-center">
          <MessageCircle className="w-3.5 h-3.5" /> {L("Nessun pagamento: guadagni tutto con le sfide.", "Keine Zahlung: alles über Challenges.", "No payment: earn everything through challenges.", "Sin pago: todo con retos.")}
        </div>
      </div>
    </div>
  );
}
