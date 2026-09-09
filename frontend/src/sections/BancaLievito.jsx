import { mkTri } from "@/i18n/triMaps";
import { useState, useEffect } from "react";
import { ChevronRight, MapPin, Loader2, Sprout, ExternalLink } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { bakersApi } from "@/lib/api";
import BakersMap from "@/components/BakersMap";

export default function BancaLievito({ onBack }) {
  const { lang } = useLang();
  const L = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const [list, setList] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => { bakersApi.map().then((r) => setList(Array.isArray(r) ? r : [])).catch(() => setList([])); }, []);

  return (
    <div className="pb-8" data-testid="banca-lievito">
      {onBack && <button data-testid="banca-back" onClick={onBack} className="flex items-center gap-1 text-[#3E9C93] font-medium mb-4"><ChevronRight className="w-5 h-5 rotate-180" /> {L("Indietro", "Zurück", "Back")}</button>}
      <div className="relative overflow-hidden rounded-3xl p-6 text-[#0D1520] shadow-xl mb-5" style={{ background: "linear-gradient(135deg,#2e8b6f,#1c5c49 70%,#3E9C93)" }}>
        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center mb-3"><Sprout className="w-7 h-7" /></div>
        <h1 className="font-display text-2xl font-bold">{L("Banca del Lievito & Sauerteig", "Sauerteig-Bank", "Sourdough & Starter Bank", "Banco de Masa Madre")}</h1>
        <p className="text-[#0D1520]/85 text-sm mt-2 leading-snug">{L("La mappa della community per scambiare starter (lievito madre / Sauerteig) e consigli con i fornai vicino a te.", "Community-Karte zum Tauschen von Sauerteig-Starter.", "Community map to exchange sourdough starter and tips nearby.", "Mapa de la comunidad para intercambiar masa madre.")}</p>
      </div>

      <button data-testid="banca-open-map" onClick={() => setMapOpen(true)}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#2e8b6f] hover:bg-[#1c5c49] text-[#0D1520] font-semibold px-5 py-3.5 mb-4 active:scale-98 transition-all">
        <MapPin className="w-5 h-5" /> {L("Apri la mappa & mettiti sulla mappa", "Karte öffnen & eintragen", "Open the map & put yourself on it", "Abre el mapa y aparece en él")}
      </button>

      <p className="font-display text-lg font-bold text-[#3E9C93] dark:text-[#e4eff8] mb-2">{L("Fornai nella community", "Bäcker in der Community", "Bakers in the community", "Panaderos en la comunidad")}</p>
      {list === null ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#2e8b6f]" /></div>
      ) : list.length === 0 ? (
        <p className="text-center text-sm text-[#64748B] py-8">{L("Ancora nessuno sulla mappa. Sii il primo a offrire il tuo starter!", "Noch niemand. Sei der Erste!", "Nobody yet. Be the first to offer your starter!", "Nadie aún. ¡Sé el primero!")}</p>
      ) : (
        <div className="space-y-2.5" data-testid="banca-list">
          {list.slice(0, 30).map((b, i) => (
            <div key={i} data-testid={`banca-baker-${i}`} className="flex items-start gap-3 rounded-2xl bg-[#0D1520] dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] p-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-[#2e8b6f] text-white flex items-center justify-center font-bold shrink-0">{(b.name || "F")[0].toUpperCase()}</div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] font-bold text-[#3E9C93] dark:text-[#e4eff8] leading-tight">{b.name}</p>
                {b.city && <p className="text-[12px] text-[#3E9C93] flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {b.city}</p>}
                {b.bio && <p className="text-[12.5px] text-[#3E9C93] dark:text-[#AEB8BF] leading-snug mt-0.5">{b.bio}</p>}
                {b.link && <a href={b.link} target="_blank" rel="noreferrer" className="text-[12px] font-bold text-[#2e8b6f] inline-flex items-center gap-1 mt-1">{L("Contatta", "Kontakt", "Contact", "Contactar")} <ExternalLink className="w-3 h-3" /></a>}
              </div>
            </div>
          ))}
        </div>
      )}

      <BakersMap open={mapOpen} onClose={() => { setMapOpen(false); bakersApi.map().then((r) => setList(Array.isArray(r) ? r : [])).catch(() => {}); }} />
    </div>
  );
}
