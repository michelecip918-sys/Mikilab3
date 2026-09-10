import { useEffect, useState } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { NexusAvatar } from "@/components/NexusAvatar";

const PUB = process.env.PUBLIC_URL;
const API = process.env.REACT_APP_BACKEND_URL;

// Identità CORE con avatar reale.
const CORE = [
  { id: "michele", name: "MikiLab", role: "Fondatore · Direttore di Produzione", img: "avatar_miki.jpg", accent: "#64748B" },
  { id: "mikemix", name: "Miki-Nexus", role: "Reparto Produzione · Fornaio", img: "avatar_nexus.jpg", accent: "#FF6B00" },
  { id: "nexus", name: "Miki-Nexus", role: "Coscienza Strategica · Intelligenza Suprema", img: "avatar_nexus.jpg", accent: "#EAB308" },
];

// Postazioni operative BASE (arricchite a runtime dai reparti del Capo).
const BASE_STATIONS = [
  { key: "impastatore", label: "Impastatore", color: "#64748B", ic: "🌀" },
  { key: "fornaio", label: "Fornaio", color: "#f59e0b", ic: "🔥" },
  { key: "laugen", label: "Laugen / Pretzel", color: "#64748B", ic: "🥨" },
  { key: "fermentazione", label: "Fermentazione", color: "#D95200", ic: "🫧" },
  { key: "pizzaiolo", label: "Pizzaiolo", color: "#3E9C93", ic: "🍕" },
  { key: "pasticcere", label: "Pasticcere", color: "#7FB0A6", ic: "🥐" },
  { key: "banconista", label: "Banconista", color: "#f59e0b", ic: "🧺" },
  { key: "apprendista", label: "Apprendista", color: "#94A3B8", ic: "🎓" },
];

function Tile({ ic, label, color, testid, onClick }) {
  return (
    <button data-testid={testid} onClick={onClick} type="button"
      className="group relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl active:scale-95 transition-all"
      style={{ background: "rgba(12,16,25,0.6)", border: `1px solid ${color}33` }}>
      <span className="relative flex items-center justify-center w-12 h-12 rounded-full text-xl"
        style={{ background: `${color}18`, border: `1.5px solid ${color}`, boxShadow: `0 0 12px ${color}44` }}>
        <span aria-hidden className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ boxShadow: `0 0 18px ${color}` }} />
        {ic}
      </span>
      <span className="text-[10px] font-bold text-center leading-tight text-[#cbd5e1] max-w-[72px] truncate">{label}</span>
    </button>
  );
}

// Griglia completa: TUTTE le identità MikiLab e le postazioni operative, con aura reattiva.
export default function OperatorsRoster({ onPick }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [stations, setStations] = useState(BASE_STATIONS);

  useEffect(() => {
    fetch(`${API}/api/lab/departments`).then((r) => (r.ok ? r.json() : {})).then((d) => {
      const extras = [];
      (d.custom || []).forEach((c) => (c.features || []).forEach((f) => { if (f) extras.push({ key: `x-${f}`.toLowerCase().replace(/[^a-z0-9]/g, ""), label: f, color: "#64748B", ic: "🏭" }); }));
      Object.values(d.extras || {}).forEach((arr) => (arr || []).forEach((f) => { if (f) extras.push({ key: `e-${f}`.toLowerCase().replace(/[^a-z0-9]/g, ""), label: f, color: "#64748B", ic: "⚙️" }); }));
      if (extras.length) setStations((prev) => [...prev, ...extras.filter((e) => !prev.some((p) => p.label === e.label))]);
    }).catch(() => { /* offline → resta la lista base */ });
  }, []);

  return (
    <div data-testid="operators-roster" className="holo-panel p-4 mb-4">
      <span className="holo-scan-top" />
      <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-[#FF6B00]/80 mb-3">{tri("Equipaggio MikiLab", "MikiLab-Crew", "MikiLab Crew", "Equipo MikiLab", "Équipe MikiLab", "خدمه میکی‌لب")}</p>
      {/* Identità core con avatar reale */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {CORE.map((o) => (
          <div key={o.id} data-testid={`roster-core-${o.id}`} className="flex flex-col items-center gap-1.5 p-2 rounded-xl" style={{ background: "rgba(12,16,25,0.6)", border: `1px solid ${o.accent}3a` }}>
            <span className="relative">
              <span aria-hidden className="absolute -inset-1 rounded-full" style={{ background: `radial-gradient(circle, ${o.accent}55, transparent 70%)`, animation: "pulse 2.8s ease-in-out infinite" }} />
              {o.id === "nexus" ? (
                <NexusAvatar size={56} className="relative" />
              ) : (
                <img src={`${PUB}/${o.img}`} alt={o.name} className="relative w-14 h-14 rounded-full object-cover object-top" style={{ border: `2px solid ${o.accent}`, boxShadow: `0 0 16px ${o.accent}66` }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
              )}
            </span>
            <span className="text-[11px] font-black text-white text-center leading-tight truncate max-w-[92px]">{o.name}</span>
            <span className="text-[9px] text-center leading-tight" style={{ color: o.accent }}>{o.role}</span>
          </div>
        ))}
      </div>
      {/* Tutte le postazioni operative */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {stations.map((s) => (
          <Tile key={s.key} testid={`roster-station-${s.key}`} ic={s.ic} label={s.label} color={s.color} onClick={() => onPick && onPick(s.label)} />
        ))}
      </div>
    </div>
  );
}
