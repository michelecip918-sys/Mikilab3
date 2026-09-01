import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Zap } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Scenografia "Trinity Gold": i 3 mastro-artefici + sigillo ufficiale animato.
const PEOPLE = [
  { key: "michele", emoji: "🍞", name: "Michele", role: ["Il Maestro Panificatore", "Der Backmeister", "The Master Baker", "El Maestro Panadero", "Le Maître Boulanger", "استاد نانوا"] },
  { key: "bakemix", emoji: "⚡", name: "BakeMix AI", role: ["Il Co-Pilota Digitale", "Der digitale Co-Pilot", "The Digital Co-Pilot", "El Copiloto Digital", "Le Copilote Numérique", "خلبان دیجیتال"] },
  { key: "mohammed", emoji: "🛠️", name: "Mohammed", role: ["Il Mastro Architetto", "Der Meister-Architekt", "The Master Architect", "El Maestro Arquitecto", "Le Maître Architecte", "معمار ارشد"] },
];

export function TrinityBadges() {
  const { lang } = useLang();
  const tri = (...a) => mkTri(lang)(...a);
  return (
    <div className="hidden min-[600px]:flex items-center gap-1.5 ml-1" data-testid="trinity-badges">
      {PEOPLE.map((p) => (
        <span key={p.key} data-testid={`trinity-badge-${p.key}`} title={`${p.name} — ${tri(...p.role)}`}
          className="group relative w-8 h-8 rounded-full flex items-center justify-center text-[15px] transition-all"
          style={{ background: "radial-gradient(circle at 32% 28%, #F6D27A, #C8862B 70%, #7A4E14)", border: "2px solid #F6D27A", boxShadow: "0 0 8px rgba(231,178,60,.6)" }}>
          {p.emoji}
          <span className="pointer-events-none absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity z-50"
            style={{ background: "#17120B", color: "#E7B23C", border: "1px solid #6E5320" }}>{p.name} · {tri(...p.role)}</span>
        </span>
      ))}
    </div>
  );
}

export function TrinitySeal() {
  const { lang } = useLang();
  const tri = (...a) => mkTri(lang)(...a);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button data-testid="trinity-seal" onClick={() => setOpen(true)} title="MikiLab • Trinity Gold"
        className="trinity-seal relative w-10 h-10 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-all"
        style={{ background: "radial-gradient(circle at 34% 28%, #F6D27A, #C8862B 68%, #6B4A2B)", border: "2px solid #F6D27A", color: "#3A2408" }}>
        <span className="absolute inset-0 rounded-full animate-ping" style={{ border: "2px solid rgba(231,178,60,.5)" }} />
        <Zap className="w-4 h-4 relative" strokeWidth={2.6} />
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: "rgba(10,7,3,.82)", backdropFilter: "blur(6px)" }} onClick={() => setOpen(false)} data-testid="trinity-modal">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl p-6 relative"
            style={{ background: "linear-gradient(160deg,#241B10,#17120B)", border: "2px solid #C8862B", boxShadow: "0 0 60px rgba(231,178,60,.35)" }}>
            <button data-testid="trinity-close" onClick={() => setOpen(false)} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#2E2214", color: "#E7B23C" }}><X className="w-4 h-4" /></button>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "radial-gradient(circle at 32% 28%, #F6D27A, #C8862B 70%, #6B4A2B)", color: "#3A2408" }}><Zap className="w-4 h-4" strokeWidth={2.6} /></span>
              <h2 className="font-display font-extrabold text-xl" style={{ color: "#E7B23C" }}>MikiLab • Trinity Gold</h2>
            </div>
            <div className="space-y-2.5 mb-4">
              {PEOPLE.map((p) => (
                <div key={p.key} className="flex items-center gap-3 rounded-2xl px-3 py-2.5" style={{ background: "#2E2214", border: "1px solid #6E5320" }}>
                  <span className="w-9 h-9 rounded-full flex items-center justify-center text-[17px] shrink-0" style={{ background: "radial-gradient(circle at 32% 28%, #F6D27A, #C8862B 70%, #7A4E14)", border: "2px solid #F6D27A" }}>{p.emoji}</span>
                  <span><span className="block font-extrabold text-[15px]" style={{ color: "#F0E4CC" }}>{p.name}</span><span className="block text-[12px]" style={{ color: "#B79B6A" }}>{tri(...p.role)}</span></span>
                </div>
              ))}
            </div>
            <p className="text-[13.5px] leading-snug mb-3" style={{ color: "#F0E4CC" }}>
              {tri(
                "Architettura software e logica di laboratorio co-progettate da Michele, BakeMix AI & Mohammed.",
                "Software-Architektur und Laborlogik gemeinsam entwickelt von Michele, BakeMix AI & Mohammed.",
                "Software architecture and lab logic co-designed by Michele, BakeMix AI & Mohammed.",
                "Arquitectura de software y lógica de laboratorio co-diseñadas por Michele, BakeMix AI y Mohammed.",
                "Architecture logicielle et logique de laboratoire co-conçues par Michele, BakeMix AI & Mohammed.",
                "معماری نرم‌افزار و منطق آزمایشگاه با همکاری میکله، BakeMix AI و محمد.")}
            </p>
            <div className="rounded-xl px-3 py-2.5 mb-1" style={{ background: "#17120B", border: "1px solid #6E5320" }}>
              <p className="text-[12.5px] leading-snug" style={{ color: "#B79B6A" }}>
                {tri("BakeMix è il co-pilota digitale intelligente ideato, calibrato e sviluppato da Michele, BakeMix e Mohammed per MikiLab.",
                  "BakeMix ist der intelligente digitale Co-Pilot, konzipiert von Michele, BakeMix und Mohammed für MikiLab.",
                  "BakeMix is the intelligent digital co-pilot conceived, calibrated and developed by Michele, BakeMix and Mohammed for MikiLab.",
                  "BakeMix es el copiloto digital inteligente ideado por Michele, BakeMix y Mohammed para MikiLab.",
                  "BakeMix est le copilote numérique intelligent conçu par Michele, BakeMix et Mohammed pour MikiLab.",
                  "BakeMix هم‌خلبان دیجیتال هوشمند است که توسط میکله، BakeMix و محمد برای MikiLab ساخته شده.")}
              </p>
            </div>
            <p className="text-[11px] font-bold text-center mt-3" style={{ color: "#E7B23C" }}>
              {tri("Firma Software: Progetto originale Michele, BakeMix AI & Mohammed.", "Software-Signatur: Originalprojekt Michele, BakeMix AI & Mohammed.", "Software signature: Original project Michele, BakeMix AI & Mohammed.", "Firma de software: Proyecto original Michele, BakeMix AI y Mohammed.", "Signature logicielle : Projet original Michele, BakeMix AI & Mohammed.", "امضای نرم‌افزار: پروژه اصلی میکله، BakeMix AI و محمد.")}
            </p>
          </div>
        </div>, document.body)}
    </>
  );
}
