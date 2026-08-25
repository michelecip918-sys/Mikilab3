import { motion } from "framer-motion";
import { useLang } from "@/i18n/LanguageContext";

const base = process.env.PUBLIC_URL || "";
const AV = {
  michele: `${base}/michele-avatar.jpg`,
  momy: `${base}/mohammed-avatar.jpg`,
};

// Testi "fumetto" (SOLO scritti, nessuna voce) per sezione.
const SCRIPTS = {
  impara: [
    { who: "michele", it: "Impara con calma: qui trovi la ricetta del giorno, i video e il tuo percorso passo-passo.", de: "Lerne in Ruhe: hier findest du das Rezept des Tages, Videos und deinen Schritt-für-Schritt-Weg.", en: "Learn calmly: here you'll find the recipe of the day, videos and your step-by-step path." },
    { who: "momy", it: "Fai il Quiz del Fornaio e segna i progressi: ti accompagno io, senza fretta.", de: "Mach das Bäcker-Quiz und verfolge deine Fortschritte: ich begleite dich, ganz entspannt.", en: "Take the Baker's Quiz and track your progress: I'll guide you, no rush." },
  ],
  community: [
    { who: "michele", it: "Cerchiamo colleghi appassionati! Condividi le tue foto e ricette con gli altri fornai.", de: "Wir suchen begeisterte Kollegen! Teile deine Fotos und Rezepte mit anderen Bäckern.", en: "We're looking for passionate peers! Share your photos and recipes with other bakers." },
    { who: "momy", it: "Segui gli altri, metti un like e commenta: sui social cresciamo insieme.", de: "Folge anderen, like und kommentiere: in den sozialen Netzwerken wachsen wir zusammen.", en: "Follow others, like and comment: on socials we grow together." },
  ],
  shop: [
    { who: "michele", it: "Qui puoi avere le MIE ricette complete: dosi, procedimento e fasi.", de: "Hier bekommst du MEINE vollständigen Rezepte: Mengen, Ablauf und Phasen.", en: "Here you can get MY complete recipes: quantities, procedure and phases." },
    { who: "momy", it: "Acquista il ricettario o abbonati PRO: le ricette compaiono subito nel Piano IA!", de: "Kaufe das Rezeptbuch oder abonniere PRO: die Rezepte erscheinen sofort im KI-Plan!", en: "Buy the recipe book or subscribe PRO: recipes appear right away in the AI Plan!" },
  ],
};

const NAME = { michele: "Michele", momy: "Momy" };

export default function AvatarBubbles({ variant = "impara" }) {
  const { lang } = useLang();
  const msgs = SCRIPTS[variant] || SCRIPTS.impara;
  const pick = (m) => (lang === "de" ? m.de : lang === "en" ? m.en : m.it);

  return (
    <div data-testid="avatar-bubbles" className="mb-5 space-y-3">
      {msgs.map((m, idx) => {
        const isMichele = m.who === "michele";
        return (
          <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.12 }}
            className={`flex items-end gap-2.5 ${isMichele ? "" : "flex-row-reverse"}`}>
            <img src={AV[m.who]} alt={NAME[m.who]}
              className={`w-11 h-11 rounded-full object-cover shadow-sm shrink-0 ring-2 ${isMichele ? "ring-[#6B8E62]/60" : "ring-[#6E8CA0]/60"}`}
              onError={(e) => { e.currentTarget.style.display = "none"; }} />
            <div data-testid={`bubble-${m.who}`}
              className={`relative max-w-[80%] rounded-2xl px-3.5 py-2.5 shadow-sm border ${
                isMichele
                  ? "bg-[#6B8E62]/12 border-[#6B8E62]/30 rounded-bl-sm"
                  : "bg-[#6E8CA0]/12 border-[#6E8CA0]/30 rounded-br-sm"}`}>
              <p className={`text-[10px] font-bold uppercase tracking-wide mb-0.5 ${isMichele ? "text-[#4d6b45]" : "text-[#33564E]"}`}>{NAME[m.who]}</p>
              <p className="text-sm text-[#2B303B] dark:text-[#EAF0EC] leading-snug">{pick(m)}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
