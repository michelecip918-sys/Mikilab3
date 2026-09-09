import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Headphones, Clock } from "lucide-react";
import { mikeApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// BRIEFING PER RUOLO (Cyber-Trio, voce breve in cuffia): quando l'operatore sceglie o
// cambia postazione, riceve SOLO i lotti e gli allarmi della SUA linea. Voce breve
// (comando/conferma), niente conversazione: la regola voce del reparto.
export default function FloorRoleBriefing({ role = "" }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [data, setData] = useState(null);
  const spokenFor = useRef("");

  useEffect(() => {
    if (!role) { setData(null); return; }
    let stop = false;
    mikeApi.floorBriefing(role, lang).then((d) => {
      if (stop) return;
      setData(d);
      // Parla UNA VOLTA per ruolo (voce breve dell'operatore = Mike Mix).
      const key = `${role}|${lang}`;
      if (d.spoken && spokenFor.current !== key) { spokenFor.current = key; try { playTTS(d.spoken, { lang, voice: "mikemix" }); } catch { /* */ } }
    }).catch(() => { /* */ });
    return () => { stop = true; };
  }, [role, lang]);

  if (!data) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} data-testid="floor-briefing" className="w-full rounded-2xl border border-[#00F0FF]/40 bg-[#00F0FF]/5 p-3 mb-2">
      <p className="text-[11px] font-black uppercase tracking-widest text-[#00F0FF] flex items-center gap-1.5"><Headphones className="w-3.5 h-3.5" /> {tri("Briefing di linea", "Linien-Briefing", "Line briefing", "Briefing de línea", "Briefing de ligne", "بریفینگ خط")} · {data.line_label}</p>
      <p className="mt-1 text-[13px] text-[#e6f6fa] leading-snug">{data.spoken}</p>
      {(data.tasks || []).length > 0 && (
        <div className="mt-2 space-y-1">
          {data.tasks.slice(0, 4).map((t, i) => (
            <div key={i} data-testid={`floor-briefing-task-${i}`} className="flex items-center gap-2 text-[12px] text-white">
              {t.start && <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#00F0FF] shrink-0"><Clock className="w-3 h-3" /> {t.start}</span>}
              <span className="truncate">{t.title}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
