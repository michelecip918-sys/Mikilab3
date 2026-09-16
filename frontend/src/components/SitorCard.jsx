import { motion } from "framer-motion";
import { X, Mic, Camera, Users, GraduationCap, HelpCircle } from "lucide-react";

const PUB = process.env.PUBLIC_URL || "";

// Scheda Sitor — chi è e cosa fa. Si apre toccando l'avatar di Sitor.
export default function SitorCard({ tri, onClose }) {
  const duties = [
    { icon: Mic, t: tri("Ti assegna il compito del giorno e ti guida a voce, passo dopo passo", "Weist dir die Tagesaufgabe zu und führt dich per Stimme, Schritt für Schritt", "Assigns your daily task and guides you by voice, step by step", "Te asigna la tarea del día y te guía por voz, paso a paso", "Te confie la tâche du jour et te guide à la voix, pas à pas", "وظیفه روز را می‌دهد و با صدا قدم‌به‌قدم راهنمایی می‌کند") },
    { icon: HelpCircle, t: tri("Risponde alle tue domande su impasti, tempi e cotture", "Beantwortet deine Fragen zu Teigen, Zeiten und Backen", "Answers your questions on doughs, timings and baking", "Responde tus preguntas sobre masas, tiempos y horneado", "Répond à tes questions sur pâtes, temps et cuisson", "به سؤالات تو درباره خمیر، زمان و پخت پاسخ می‌دهد") },
    { icon: Camera, t: tri("Analizza le tue foto con «Occhi di Sitor» e ti dice come migliorare", "Analysiert deine Fotos mit „Sitors Augen“ und sagt, wie du besser wirst", "Analyses your photos with \u201cSitor's Eyes\u201d and tells you how to improve", "Analiza tus fotos con «Ojos de Sitor» y te dice cómo mejorar", "Analyse tes photos avec « Yeux de Sitor » et te dit comment progresser", "با «چشمان سیتور» عکس‌ها را تحلیل می‌کند و راه بهتر شدن را می‌گوید") },
    { icon: Users, t: tri("Coordina la squadra e ti avvisa quando serve una mano", "Koordiniert das Team und meldet sich, wenn Hilfe gebraucht wird", "Coordinates the team and alerts you when a hand is needed", "Coordina al equipo y avisa cuando hace falta ayuda", "Coordonne l'équipe et prévient quand un coup de main est nécessaire", "تیم را هماهنگ می‌کند و وقتی کمک لازم است خبر می‌دهد") },
    { icon: GraduationCap, t: tri("Ti insegna le ricette con corsi passo-passo", "Bringt dir Rezepte mit Schritt-für-Schritt-Kursen bei", "Teaches you recipes with step-by-step courses", "Te enseña las recetas con cursos paso a paso", "T'apprend les recettes avec des cours pas à pas", "دستورها را با دوره‌های گام‌به‌گام یاد می‌دهد") },
  ];

  return (
    <div data-testid="sitor-card-modal" className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-3"
      onClick={onClose}>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl overflow-hidden border border-[#D97736]/40 bg-[#1c1c1e] shadow-2xl">
        <div className="relative">
          <img src={`${PUB}/sitor_official.jpg`} alt="Sitor" className="w-full h-56 object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c1e] via-[#1c1c1e]/30 to-transparent" />
          <button data-testid="sitor-card-close" onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 border border-white/20 text-white flex items-center justify-center active:scale-90 transition-transform">
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-4">
            <p className="text-2xl font-black text-white tracking-wide">Sitor</p>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D97736]">
              {tri("Maestro Fornaio · Intelligenza Artificiale", "Backmeister · Künstliche Intelligenz", "Master Baker · Artificial Intelligence", "Maestro Panadero · Inteligencia Artificial", "Maître Boulanger · Intelligence Artificielle", "استاد نانوا · هوش مصنوعی")}
            </p>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-[13px] text-[#cbd2da] leading-relaxed">
            {tri(
              "Sitor è il maestro fornaio con intelligenza artificiale di MikiLab: l'evoluzione del sapere del laboratorio in un'unica guida sempre presente al tuo fianco.",
              "Sitor ist der KI-Backmeister von MikiLab: das gebündelte Wissen der Backstube als stets präsenter Begleiter an deiner Seite.",
              "Sitor is MikiLab's AI master baker: the lab's know-how evolved into a single guide always by your side.",
              "Sitor es el maestro panadero con IA de MikiLab: el saber del obrador convertido en una guía siempre a tu lado.",
              "Sitor est le maître boulanger IA de MikiLab : le savoir du laboratoire en un guide toujours à tes côtés.",
              "سیتور استاد نانوای هوش مصنوعی MikiLab است: دانش کارگاه در یک راهنمای همیشه‌همراه.")}
          </p>
          <div className="space-y-2.5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7E9A82]">
              {tri("Cosa fa per te", "Was er für dich tut", "What it does for you", "Qué hace por ti", "Ce qu'il fait pour toi", "برای تو چه می‌کند")}
            </p>
            {duties.map((d, i) => {
              const Ic = d.icon;
              return (
                <div key={i} data-testid={`sitor-duty-${i}`} className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[#D97736]/15 border border-[#D97736]/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Ic className="w-3.5 h-3.5 text-[#D97736]" />
                  </span>
                  <p className="text-[12.5px] text-[#e4e4e7] leading-snug flex-1">{d.t}</p>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
