import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Avatar ufficiale BakeMix AI (robottino artigianale-tech fornito dal proprietario).
const BAKEMIX_AVATAR = "https://customer-assets-agu9un31.emergentagent.net/job_edit-33/artifacts/l48fcgwh_1788279587520.png";
const MICHELE_AVATAR = "https://static.prod-images.emergentagent.com/jobs/a3a8adf3-0daf-4c97-b252-e649a2b2f60f/images/875e1a47a1103e910802a3d09b9986310f1e29949a19141808d18c72aab7caf1.jpeg";

// Core team esposto nell'header: Michele (Founder) + BakeMix AI (Co-Pilot proprietario).
export function TrinityBadges() {
  const { lang } = useLang();
  const tri = (...a) => mkTri(lang)(...a);
  const micheleRole = tri("Founder & System Architect", "Gründer & Systemarchitekt", "Founder & System Architect", "Fundador y Arquitecto", "Fondateur & Architecte", "بنیان‌گذار و معمار سیستم");
  const bakeRole = tri("Proprietary AI Co-Pilot", "Proprietärer KI-Co-Pilot", "Proprietary AI Co-Pilot", "Copiloto IA propietario", "Copilote IA propriétaire", "هم‌خلبان هوش مصنوعی اختصاصی");
  return (
    <div className="hidden min-[560px]:flex items-center gap-2 ml-1" data-testid="trinity-badges">
      <span data-testid="trinity-badge-michele" title={`Michele — ${micheleRole}`} className="group relative w-9 h-9 rounded-full overflow-hidden transition-all"
        style={{ border: "2px solid #F6D27A", boxShadow: "0 0 9px rgba(231,178,60,.6)" }}>
        <img src={MICHELE_AVATAR} alt="Michele" className="w-full h-full object-cover" style={{ objectPosition: "50% 22%" }} />
        <span className="pointer-events-none absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity z-50" style={{ background: "#12100C", color: "#5E8CA8", border: "1px solid #2A3B49" }}>Michele · {micheleRole}</span>
      </span>
      <span data-testid="trinity-badge-bakemix" title={`BakeMix AI — ${bakeRole}`} className="group relative w-9 h-9 rounded-full overflow-hidden transition-all"
        style={{ border: "2px solid #F6D27A", boxShadow: "0 0 9px rgba(231,178,60,.6)" }}>
        <img src={BAKEMIX_AVATAR} alt="BakeMix AI" className="w-full h-full object-cover" style={{ objectPosition: "50% 32%" }} />
        <span className="pointer-events-none absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity z-50" style={{ background: "#12100C", color: "#5E8CA8", border: "1px solid #2A3B49" }}>BakeMix AI · {bakeRole}</span>
      </span>
    </div>
  );
}

export function TrinitySeal() {
  const { lang } = useLang();
  const tri = (...a) => mkTri(lang)(...a);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button data-testid="trinity-seal" onClick={() => setOpen(true)} title="MikiLab • Proprietary & Confidential"
        className="trinity-seal relative w-10 h-10 rounded-full overflow-hidden shrink-0 active:scale-95 transition-all" style={{ border: "2px solid #F6D27A" }}>
        <span className="absolute inset-0 rounded-full animate-ping z-10" style={{ border: "2px solid rgba(231,178,60,.5)" }} />
        <img src={BAKEMIX_AVATAR} alt="MikiLab Seal" className="w-full h-full object-cover" style={{ objectPosition: "50% 30%" }} />
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: "rgba(8,6,3,.85)", backdropFilter: "blur(6px)" }} onClick={() => setOpen(false)} data-testid="trinity-modal">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl p-6 relative max-h-[88vh] overflow-y-auto"
            style={{ background: "linear-gradient(160deg,#20242B,#101318)", border: "2px solid #5E8CA8", boxShadow: "0 0 60px rgba(231,178,60,.35)" }}>
            <button data-testid="trinity-close" onClick={() => setOpen(false)} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#1B2A38", color: "#5E8CA8" }}><X className="w-4 h-4" /></button>
            <div className="flex items-center gap-3 mb-4">
              <img src={BAKEMIX_AVATAR} alt="BakeMix AI" className="w-14 h-14 rounded-full object-cover" style={{ border: "2px solid #F6D27A", objectPosition: "50% 30%" }} />
              <div><h2 className="font-display font-extrabold text-xl leading-tight" style={{ color: "#5E8CA8" }}>MikiLab</h2><p className="text-[11px] font-bold tracking-widest" style={{ color: "#94A3B8" }}>PROPRIETARY & CONFIDENTIAL</p></div>
            </div>
            <p className="text-[13.5px] leading-snug mb-3" style={{ color: "#EDE3CE" }}>
              {tri("MikiLab è una piattaforma proprietaria avanzata per la gestione della panificazione professionale, ideata, sviluppata e diretta esclusivamente da Michele (Il Comandante) con BakeMix AI, co-pilota operativo di laboratorio.",
                "MikiLab ist eine proprietäre Plattform für professionelles Backmanagement, ausschließlich konzipiert, entwickelt und geleitet von Michele (Der Kommandant) mit BakeMix AI als operativem Co-Piloten.",
                "MikiLab is an advanced proprietary platform for professional bakery management, conceived, developed and directed exclusively by Michele (The Commander) with BakeMix AI as the operational lab co-pilot.",
                "MikiLab es una plataforma propietaria avanzada para la gestión de panadería profesional, ideada, desarrollada y dirigida exclusivamente por Michele (El Comandante) con BakeMix AI como copiloto operativo.",
                "MikiLab est une plateforme propriétaire avancée de gestion de boulangerie professionnelle, conçue, développée et dirigée exclusivement par Michele (Le Commandant) avec BakeMix AI comme copilote.",
                "MikiLab یک پلتفرم اختصاصی پیشرفته برای مدیریت نانوایی حرفه‌ای است که توسط میکله طراحی و هدایت شده است.")}
            </p>
            <div className="rounded-2xl shadow-md border border-amber-900/40 px-3 py-2.5 mb-3" style={{ background: "#12100C", border: "1px solid #2A3B49" }}>
              <p className="text-[11.5px] leading-snug" style={{ color: "#94A3B8" }}>
                {tri("Credits di background — Technical Advisor: Mohammed (Silent Contributor).", "Hintergrund-Credits — Technical Advisor: Mohammed (Silent Contributor).", "Background credits — Technical Advisor: Mohammed (Silent Contributor).", "Créditos — Asesor técnico: Mohammed (Silent Contributor).", "Crédits — Conseiller technique : Mohammed (Silent Contributor).", "تقدیر — مشاور فنی: محمد.")}
              </p>
            </div>
            <p className="text-[11px] leading-snug text-center" style={{ color: "#8f7a52" }}>
              {tri("© MikiLab — Proprietà Intellettuale Riservata. Software ideato, sviluppato e diretto da Michele. Tutti i diritti relativi all'architettura di sistema e al modello personalizzato BakeMix AI sono riservati. È severamente vietata qualsiasi riproduzione, modifica o distribuzione non autorizzata.",
                "© MikiLab — Alle Rechte vorbehalten. Von Michele konzipiert und geleitet. Reproduktion/Änderung/Verbreitung untersagt.",
                "© MikiLab — Intellectual Property Reserved. Conceived, developed and directed by Michele. All rights to the system architecture and the custom BakeMix AI model are reserved. Any unauthorized reproduction, modification or distribution is strictly prohibited.",
                "© MikiLab — Propiedad intelectual reservada. Ideado y dirigido por Michele. Prohibida la reproducción no autorizada.",
                "© MikiLab — Propriété intellectuelle réservée. Conçu et dirigé par Michele. Toute reproduction non autorisée est interdite.",
                "© MikiLab — کلیه حقوق محفوظ است. طراحی و هدایت توسط میکله.")}
            </p>
          </div>
        </div>, document.body)}
    </>
  );
}
