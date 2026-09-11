import { useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const PUB = process.env.PUBLIC_URL;
const KEY = "mikilab_onboarded";

// Onboarding iniziale: Sitor chiede che tipo di attività è (panificio/pizzeria/pasticceria)
// e adatta tutta l'esperienza. Mostrato una sola volta (localStorage), riapribile dal Capo.
export default function OnboardingActivity({ onChoose, onClose }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [sel, setSel] = useState("");

  const OPTS = [
    { id: "panificio", ic: "🥖", accent: "#E0A106",
      label: tri("Panificio", "Backstube", "Bakery", "Panadería", "Boulangerie", "نانوایی"),
      desc: tri("Produzione a catena, celle e forni, sequenze d'impasto.", "Fließproduktion, Zellen und Öfen.", "Chain production, cells and ovens.", "Producción en cadena.", "Production en chaîne.", "تولید زنجیره‌ای.") },
    { id: "pizzeria", ic: "🍕", accent: "#a4afbb",
      label: tri("Pizzeria", "Pizzeria", "Pizzeria", "Pizzería", "Pizzeria", "پیتزا"),
      desc: tri("Più macchine, banchi e forni; ritmi serrati di servizio.", "Mehr Maschinen und Öfen.", "More machines and ovens; fast service.", "Más máquinas y hornos.", "Plus de machines et fours.", "ماشین و فر بیشتر.") },
    { id: "pasticceria", ic: "🧁", accent: "#93a2ae",
      label: tri("Pasticceria", "Konditorei", "Pastry", "Pastelería", "Pâtisserie", "شیرینی"),
      desc: tri("Produzione su commessa: consegne torte, matrimoni ed eventi.", "Auftragsproduktion: Torten, Hochzeiten.", "Made-to-order: cake deliveries, weddings.", "Por encargo: entregas, bodas.", "Sur commande: livraisons, mariages.", "سفارشی: تحویل کیک، عروسی.") },
  ];

  const confirm = () => {
    if (!sel) return;
    try { localStorage.setItem("mikilab_activity", sel); localStorage.setItem(KEY, "1"); } catch { /* */ }
    if (onChoose) onChoose(sel);
    if (onClose) onClose();
  };

  return (
    <div data-testid="onboarding-activity" className="fixed inset-0 z-[900] bg-[#04070d]/96 backdrop-blur-md flex flex-col items-center justify-center px-5 py-8 overflow-auto">
      <img src={`${PUB}/avatar_nexus.jpg`} alt="Sitor" className="w-16 h-16 rounded-2xl object-cover object-top border-2 border-amber-500/60 mb-3" onError={(e) => { e.currentTarget.style.display = "none"; }} />
      <p className="font-mono-data text-[10px] tracking-[0.28em] uppercase text-amber-400 mb-1">Sitor</p>
      <h2 className="font-cyber text-xl sm:text-2xl font-black text-white uppercase tracking-wide text-center max-w-md">{tri(
        "Che tipo di attività gestisci?", "Welche Art von Betrieb?", "What kind of business do you run?", "¿Qué tipo de actividad?", "Quel type d'activité ?", "چه نوع کسب‌وکاری؟")}</h2>
      <p className="mt-2 text-[12.5px] text-[#94A3B8] text-center max-w-sm">{tri(
        "Adatto tutto il laboratorio alla tua scelta: sezioni, contenuti e produzione.", "Ich passe alles an deine Wahl an.", "I'll adapt the whole lab to your choice.", "Adapto todo a tu elección.", "J'adapte tout à ton choix.", "همه‌چیز را با انتخابت تنظیم می‌کنم.")}</p>
      <div className="mt-6 grid grid-cols-1 gap-3 w-full max-w-md">
        {OPTS.map((o) => (
          <button key={o.id} data-testid={`onboarding-opt-${o.id}`} onClick={() => setSel(o.id)}
            className="flex items-center gap-3 rounded-2xl p-4 text-left active:scale-[0.98] transition-all border"
            style={sel === o.id ? { borderColor: o.accent, background: `${o.accent}18`, boxShadow: `0 0 22px ${o.accent}44` } : { borderColor: "#1e293b", background: "#0b0f19" }}>
            <span className="text-3xl shrink-0">{o.ic}</span>
            <span className="min-w-0">
              <span className="block font-black text-white text-base" style={{ color: sel === o.id ? o.accent : "#fff" }}>{o.label}</span>
              <span className="block text-[11.5px] text-[#94A3B8] leading-snug">{o.desc}</span>
            </span>
          </button>
        ))}
      </div>
      <motion.button data-testid="onboarding-confirm" onClick={confirm} disabled={!sel}
        whileTap={{ scale: 0.96 }}
        className="mt-6 w-full max-w-md py-3.5 rounded-full font-black text-base text-[#04070d] disabled:opacity-40"
        style={{ background: "linear-gradient(90deg,#8a97a6,#9aa6b2)", boxShadow: "0 0 26px rgba(138,151,166,0.45)" }}>
        {tri("Conferma e inizia", "Bestätigen & starten", "Confirm and start", "Confirmar y empezar", "Confirmer et commencer", "تأیید و شروع")}
      </motion.button>
    </div>
  );
}
