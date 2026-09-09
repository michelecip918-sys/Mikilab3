import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Cpu, Globe2, ShieldHalf, Power, Volume2, Waves, Zap } from "lucide-react";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const PUB = process.env.PUBLIC_URL;

// Plancia Olografica di MIKI-NEXUS (Fase 5/8) — coscienza strategica: dashboard vive e credibili.
// Dati simulati in tempo reale (nessun dato reale esposto). isCapo => kill-switch armabile.
export default function NexusConsole({ isCapo = false }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [m, setM] = useState({ enz: 96.4, nodes: 42, plants: 7, integrity: 100, threats: 0, temp: 27.0 });
  const [armed, setArmed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const barsRef = useRef(null);

  // Kill-Switch: doppia conferma con countdown olografico.
  useEffect(() => {
    if (!confirming) return;
    setCountdown(5);
    const t = setInterval(() => setCountdown((c) => {
      if (c <= 1) { clearInterval(t); setConfirming(false); return 0; }
      return c - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [confirming]);

  useEffect(() => {
    const t = setInterval(() => {
      setM((p) => ({
        enz: Math.min(99.9, Math.max(92, p.enz + (Math.random() - 0.45) * 0.6)),
        nodes: Math.max(38, Math.min(64, p.nodes + (Math.random() < 0.5 ? -1 : 1))),
        plants: p.plants,
        integrity: Math.min(100, Math.max(97.5, p.integrity + (Math.random() - 0.5) * 0.4)),
        threats: Math.random() < 0.08 ? 1 : 0,
        temp: Math.min(29, Math.max(25, p.temp + (Math.random() - 0.5) * 0.3)),
      }));
    }, 1600);
    return () => clearInterval(t);
  }, []);

  // Onda enzimatica su canvas
  useEffect(() => {
    const cv = barsRef.current; if (!cv) return;
    const ctx = cv.getContext("2d"); let raf = 0; let t = 0;
    const draw = () => {
      const w = cv.width, h = cv.height; ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 2;
      for (let layer = 0; layer < 2; layer++) {
        ctx.beginPath();
        ctx.strokeStyle = layer === 0 ? "rgba(0,240,255,0.85)" : "rgba(246,210,122,0.5)";
        for (let x = 0; x <= w; x += 4) {
          const y = h / 2 + Math.sin((x * 0.03) + t + layer * 1.4) * (h / 4) * Math.sin(t * 0.3 + layer);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      t += 0.05; raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  const speak = () => {
    const txt = tri(
      `Sintesi enzimatica al ${m.enz.toFixed(1)} percento. ${m.nodes} nodi edge attivi, ${m.plants} impianti coordinati. Integrità del codice ${m.integrity.toFixed(1)} percento. Sono Miki-Nexus, al servizio del Capo Supremo.`,
      `Enzymsynthese bei ${m.enz.toFixed(1)} Prozent. ${m.nodes} aktive Edge-Knoten, ${m.plants} Anlagen koordiniert. Code-Integrität ${m.integrity.toFixed(1)} Prozent. Ich bin Miki-Nexus.`,
      `Enzymatic synthesis at ${m.enz.toFixed(1)} percent. ${m.nodes} edge nodes active, ${m.plants} plants coordinated. Code integrity ${m.integrity.toFixed(1)} percent. I am Miki-Nexus, at the service of the Supreme Capo.`,
      `Síntesis enzimática al ${m.enz.toFixed(1)} por ciento. ${m.nodes} nodos edge activos. Soy Miki-Nexus.`,
      `Synthèse enzymatique à ${m.enz.toFixed(1)} pour cent. ${m.nodes} nœuds edge actifs. Je suis Miki-Nexus.`,
      `سنتز آنزیمی ${m.enz.toFixed(1)} درصد. من میکی‌نکسوس هستم.`
    );
    try { playTTS(txt, { lang, voice: "nexus" }); } catch { /* */ }
  };

  const Metric = ({ icon: Ic, label, value, accent, testid, glow }) => (
    <div data-testid={testid} className="relative rounded-xl bg-[#070A10]/80 border p-3 overflow-hidden" style={{ borderColor: `${accent}44` }}>
      <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full blur-2xl" style={{ background: glow ? `${accent}55` : "transparent" }} />
      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest" style={{ color: accent }}><Ic className="w-3.5 h-3.5" /> {label}</div>
      <div className="mt-1 font-cyber text-xl font-black text-white tabular-nums">{value}</div>
    </div>
  );

  return (
    <div data-testid="nexus-console" className="relative rounded-2xl overflow-hidden border border-[#F6D27A]/25 bg-gradient-to-b from-[#0B0F19] to-[#070A10] p-5 sm:p-6">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 30% 0%, rgba(246,210,122,0.10), transparent 55%), radial-gradient(circle at 80% 20%, rgba(0,240,255,0.10), transparent 55%)" }} />
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute -inset-1.5 rounded-full blur-md" style={{ background: "radial-gradient(circle, rgba(246,210,122,0.6), rgba(0,240,255,0.3) 60%, transparent 72%)" }} />
            <img src={`${PUB}/avatar_nexus.jpg`} alt="Miki-Nexus" className="relative w-14 h-14 rounded-full object-cover object-top border-2 border-[#F6D27A]/70" style={{ boxShadow: "0 0 26px rgba(246,210,122,0.5)" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
          </div>
          <div className="min-w-0">
            <h3 className="font-cyber text-lg font-black uppercase tracking-[0.14em] text-white">Miki-Nexus</h3>
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#F6D27A]">{tri("Coscienza Strategica · Plancia Olografica", "Strategisches Bewusstsein · Holo-Konsole", "Strategic Consciousness · Holo Console", "Conciencia Estratégica", "Conscience Stratégique", "آگاهی راهبردی")}</p>
          </div>
          <button data-testid="nexus-speak" onClick={speak} className="ml-auto shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-[#F6D27A] active:scale-90 transition-all"><Volume2 className="w-4 h-4" /> {tri("Parla", "Sprich", "Speak", "Habla", "Parle", "بگو")}</button>
        </div>

        {/* Onda sintesi enzimatica */}
        <div className="mt-4 rounded-xl border border-[#00F0FF]/25 bg-[#070A10]/70 p-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[#00F0FF]"><Waves className="w-3.5 h-3.5" /> {tri("Nucleo Sintesi Enzimatica", "Enzymsynthese-Kern", "Enzymatic Synthesis Core", "Núcleo Enzimático", "Noyau Enzymatique", "هسته سنتز آنزیمی")}</span>
            <span className="font-cyber text-sm font-black text-[#00F0FF] tabular-nums">{m.enz.toFixed(1)}%</span>
          </div>
          <canvas ref={barsRef} width={520} height={70} className="mt-2 w-full h-[70px]" />
        </div>

        {/* Metriche live */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Metric testid="nexus-nodes" icon={Cpu} label={tri("Nodi Edge", "Edge-Knoten", "Edge Nodes", "Nodos Edge", "Nœuds Edge", "نودها")} value={m.nodes} accent="#00F0FF" glow />
          <Metric testid="nexus-plants" icon={Globe2} label={tri("Impianti", "Anlagen", "Plants", "Plantas", "Sites", "کارخانه‌ها")} value={m.plants} accent="#7DD3FC" />
          <Metric testid="nexus-integrity" icon={ShieldHalf} label={tri("Integrità", "Integrität", "Integrity", "Integridad", "Intégrité", "یکپارچگی")} value={`${m.integrity.toFixed(1)}%`} accent="#22c55e" />
          <Metric testid="nexus-fermtemp" icon={Activity} label={tri("Fermentazione", "Gärung", "Fermentation", "Fermentación", "Fermentation", "تخمیر")} value={`${m.temp.toFixed(1)}°`} accent="#F6D27A" />
        </div>

        {/* Polimorfismo difensivo + minacce */}
        <div className="mt-3 flex items-center justify-between rounded-xl border p-3" style={{ borderColor: m.threats ? "#f43f5e55" : "#22c55e33", background: m.threats ? "rgba(244,63,94,0.08)" : "rgba(34,197,94,0.06)" }}>
          <span className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: m.threats ? "#fda4af" : "#86efac" }}>
            <Zap className="w-3.5 h-3.5" />
            {m.threats
              ? tri("Polimorfismo difensivo: minaccia neutralizzata", "Polymorphe Abwehr: Bedrohung neutralisiert", "Defensive polymorphism: threat neutralized", "Polimorfismo: amenaza neutralizada", "Polymorphisme: menace neutralisée", "چندریختی دفاعی: تهدید خنثی شد")
              : tri("Polimorfismo difensivo attivo · nessuna minaccia", "Polymorphe Abwehr aktiv · keine Bedrohung", "Defensive polymorphism active · no threats", "Polimorfismo activo · sin amenazas", "Polymorphisme actif · aucune menace", "چندریختی دفاعی فعال · بدون تهدید")}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: m.threats ? "#f43f5e" : "#22c55e" }}>{m.threats ? "ALERT" : "SECURE"}</span>
        </div>

        {/* Kill-Switch — solo Capo */}
        <div className="mt-3 rounded-xl border border-[#f43f5e]/30 bg-[#f43f5e]/5 p-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-[#f43f5e]"><Power className="w-3.5 h-3.5" /> Kill-Switch</span>
            {isCapo ? (
              armed ? (
                <button data-testid="nexus-killswitch" onClick={() => { setArmed(false); setConfirming(false); }}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider bg-[#f43f5e] text-[#070A10] border border-[#f43f5e] active:scale-95 transition-all">
                  {tri("ARMATO · disarma", "SCHARF · entschärfen", "ARMED · disarm", "ARMADO · desarmar", "ARMÉ · désarmer", "مسلح · خلع")}
                </button>
              ) : confirming ? (
                <button data-testid="nexus-killswitch-confirm" onClick={() => { setArmed(true); setConfirming(false); }}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider bg-[#0b0f19] text-[#f43f5e] border border-[#f43f5e] animate-pulse active:scale-95 transition-all">
                  {tri(`Conferma (${countdown})`, `Bestätigen (${countdown})`, `Confirm (${countdown})`, `Confirmar (${countdown})`, `Confirmer (${countdown})`, `تأیید (${countdown})`)}
                </button>
              ) : (
                <button data-testid="nexus-killswitch" onClick={() => setConfirming(true)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider bg-[#0b0f19] text-[#f43f5e] border border-[#f43f5e]/40 active:scale-95 transition-all">
                  {tri("Arma protocollo", "Aktivieren", "Arm protocol", "Armar", "Armer", "مسلح‌سازی")}
                </button>
              )
            ) : (
              <span data-testid="nexus-killswitch-locked" className="text-[10px] font-bold text-[#8aa0b4]">{tri("Riservato al Capo Supremo", "Nur Oberster Chef", "Supreme Capo only", "Solo Capo Supremo", "Capo Suprême seulement", "فقط کاپوی برتر")}</span>
            )}
          </div>
          <p className="mt-1.5 text-[10.5px] text-[#8aa0b4] leading-snug">{tri(
            "In caso di violazione, Miki-Nexus sovrascrive e cancella dati, ricette e configurazioni da ogni nodo, garantendo la sovranità di MikiLab.",
            "Bei Verletzung überschreibt und löscht Miki-Nexus Daten von jedem Knoten und sichert die Souveränität von MikiLab.",
            "On breach, Miki-Nexus overwrites and wipes data, recipes and configs from every node, guaranteeing MikiLab's sovereignty.",
            "Ante una violación, Miki-Nexus borra los datos de cada nodo.",
            "En cas de violation, Miki-Nexus efface les données de chaque nœud.",
            "در صورت نفوذ، میکی‌نکسوس داده‌ها را از هر نود پاک می‌کند.")}</p>
          {armed && <motion.p data-testid="nexus-armed-note" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-[11px] font-bold text-[#f43f5e]">⚠ {tri("Protocollo armato — pronto all'annullamento istantaneo su ordine del Capo.", "Protokoll scharf — bereit zur sofortigen Löschung auf Befehl des Chefs.", "Protocol armed — ready for instant wipe on the Capo's order.", "Protocolo armado.", "Protocole armé.", "پروتکل مسلح شد.")}</motion.p>}
        </div>
      </div>
    </div>
  );
}
