import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Volume2, BookOpen, ShieldCheck, Mic, ClipboardList, LifeBuoy } from "lucide-react";
import DocsDownload from "@/components/DocsDownload";
import BakemixHardware from "@/components/BakemixHardware";
import CoreShowcase from "@/components/CoreShowcase";
import { playTTS, stopTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const PUB = process.env.PUBLIC_URL;

// Bakemix: l'AI che "ha in testa" tutto MikiLab e spiega il sito passo-passo.
export default function BakemixGuide() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [i, setI] = useState(0);

  const CH = [
    { icon: BookOpen, t: tri("Cos'è MikiLab", "Was ist MikiLab", "What is MikiLab", "Qué es MikiLab", "Qu'est-ce que MikiLab", "میکی‌لب چیست"),
      b: tri("MikiLab è il laboratorio digitale del panettiere. Io sono Bakemix: ho in testa tutto il sistema e ti guido passo-passo.", "MikiLab ist das digitale Labor des Bäckers. Ich bin Bakemix und führe dich Schritt für Schritt.", "MikiLab is the baker's digital lab. I'm Bakemix and I guide you step by step.", "MikiLab es el laboratorio digital del panadero. Soy Bakemix y te guío paso a paso.", "MikiLab est le laboratoire numérique du boulanger. Je suis Bakemix et je te guide pas à pas.", "میکی‌لب آزمایشگاه دیجیتال نانوا است. من بیک‌میکس هستم و قدم‌به‌قدم راهنمایی‌ات می‌کنم.") },
    { icon: ShieldCheck, t: tri("Il Capo (MikiLab)", "Der Chef (MikiLab)", "The Capo (MikiLab)", "El Capo (MikiLab)", "Le Capo (MikiLab)", "کاپو (میکی‌لب)"),
      b: tri("Il Capo entra con email e gestisce tutto: ricette, piano, magazzino e Ordini Extra. Imposta lui il PIN per la produzione.", "Der Chef meldet sich per E-Mail an und steuert alles: Rezepte, Plan, Lager und Extra-Aufträge. Er setzt den Produktions-PIN.", "The Capo logs in with email and controls everything: recipes, plan, warehouse and Extra Orders. He sets the production PIN.", "El Capo entra con email y controla todo: recetas, plan, almacén y Pedidos Extra. Él fija el PIN de producción.", "Le Capo se connecte par e-mail et gère tout : recettes, plan, stock et Commandes Extra. Il fixe le PIN de production.", "کاپو با ایمیل وارد می‌شود و همه‌چیز را مدیریت می‌کند و PIN تولید را تعیین می‌کند.") },
    { icon: Mic, t: tri("La produzione con Mohamed", "Produktion mit Mohamed", "Production with Mohamed", "Producción con Mohamed", "Production avec Mohamed", "تولید با محمد"),
      b: tri("In produzione tocchi l'avatar di Mohamed: ti legge il piano del Capo a voce, passo dopo passo. Di' «avanti», «indietro», «ripeti».", "In der Produktion tippst du Mohamed an: er liest den Plan vor. Sag «weiter», «zurück», «nochmal».", "In production you tap Mohamed: he reads the Capo's plan aloud. Say «next», «back», «repeat».", "En producción tocas a Mohamed: te lee el plan en voz alta. Di «siguiente», «atrás», «repite».", "En production tu touches Mohamed : il lit le plan à voix haute. Dis «suivant», «précédent», «répète».", "در تولید روی محمد می‌زنی: برنامه را با صدا می‌خواند. بگو «بعدی»، «قبلی»، «تکرار».") },
    { icon: ClipboardList, t: tri("Ricette e piano", "Rezepte und Plan", "Recipes and plan", "Recetas y plan", "Recettes et plan", "دستورها و برنامه"),
      b: tri("Il Capo genera il piano (anche con Ordini Extra dell'ultimo minuto) e lo invia al team con un tocco. Le ricette MikiLab si affiancano alle tue.", "Der Chef erstellt den Plan (auch mit Last-Minute-Aufträgen) und sendet ihn ans Team. Die MikiLab-Rezepte ergänzen deine.", "The Capo generates the plan (even last-minute Extra Orders) and sends it to the team. MikiLab recipes sit alongside yours.", "El Capo genera el plan (incluso Pedidos Extra) y lo envía al equipo. Las recetas MikiLab se suman a las tuyas.", "Le Capo génère le plan (même les Commandes Extra) et l'envoie à l'équipe. Les recettes MikiLab s'ajoutent aux tiennes.", "کاپو برنامه را می‌سازد و به تیم می‌فرستد. دستورهای میکی‌لب کنار دستورهای تو قرار می‌گیرند.") },
    { icon: LifeBuoy, t: tri("Problemi comuni & SOS", "Häufige Probleme & SOS", "Common problems & SOS", "Problemas comunes & SOS", "Problèmes fréquents & SOS", "مشکلات رایج و SOS"),
      b: tri("Se una cella o un'impastatrice va giù, dillo a voce: riorganizzo i lotti. Trovi qui sotto anche il manuale PDF completo del sito.", "Fällt eine Zelle oder Maschine aus, sag es laut: ich verteile die Chargen neu. Unten findest du das komplette PDF-Handbuch.", "If a cell or mixer goes down, say it aloud: I re-balance the batches. Below you also find the full PDF manual.", "Si una cámara o amasadora falla, dilo en voz alta: reorganizo los lotes. Abajo tienes el manual PDF completo.", "Si une chambre ou un pétrin tombe en panne, dis-le : je réorganise les lots. Le manuel PDF complet est ci-dessous.", "اگر سردخانه یا همزن خراب شد، بگو: دسته‌ها را دوباره تنظیم می‌کنم. راهنمای کامل PDF پایین است.") },
  ];

  const cur = CH[i];
  const Icon = cur.icon;
  const listen = () => { try { playTTS(`${cur.t}. ${cur.b}`, { lang, voice: "bakemix" }); } catch { /* */ } };
  const go = (n) => { stopTTS(); setI(n); };

  return (
    <div data-testid="bakemix-guide" className="space-y-4">
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-[#06b6d4]/10 to-transparent border border-[#06b6d4]/30">
        <img src={`${PUB}/avatar_bigmix.jpg`} alt="Bakemix" className="w-12 h-12 rounded-xl object-cover border border-[#06b6d4]/60" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold text-[#06b6d4]">{tri("BakoMix AI ti spiega tutto", "BakoMix AI erklärt alles", "BakoMix AI explains everything", "BakoMix AI te explica todo", "BakoMix AI explique tout", "BakoMix AI همه‌چیز را توضیح می‌دهد")}</h3>
          <p className="text-[11px] text-[#94A3B8]">{tri("Guida passo-passo del sito, con la voce.", "Schritt-für-Schritt-Anleitung, mit Stimme.", "Step-by-step site guide, with voice.", "Guía paso a paso, con voz.", "Guide pas à pas, avec la voix.", "راهنمای گام‌به‌گام با صدا.")}</p>
        </div>
      </div>

      <motion.div key={i} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl bg-[#0b0f19] border border-[#1e293b] p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#06b6d4]"><Icon className="w-4 h-4" /> {tri("Capitolo", "Kapitel", "Chapter", "Capítulo", "Chapitre", "فصل")} {i + 1}/{CH.length}</span>
          <button data-testid="bakemix-listen" onClick={listen} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#06b6d4]"><Volume2 className="w-3.5 h-3.5" /> {tri("Ascolta", "Hören", "Listen", "Escuchar", "Écouter", "بشنو")}</button>
        </div>
        <h4 data-testid="bakemix-chapter-title" className="text-lg font-bold text-white">{cur.t}</h4>
        <p className="mt-2 text-sm text-[#cbd5e1] leading-relaxed">{cur.b}</p>
        <div className="mt-4 flex items-center justify-between">
          <button data-testid="bakemix-prev" onClick={() => go(Math.max(0, i - 1))} disabled={i === 0} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[#030712] border border-[#1e293b] text-[#94A3B8] font-bold text-xs disabled:opacity-40 active:scale-95 transition-all"><ChevronLeft className="w-4 h-4" /> {tri("Indietro", "Zurück", "Back", "Atrás", "Précéd.", "قبلی")}</button>
          <div className="flex gap-1.5">{CH.map((_, k) => <span key={k} className="h-1.5 rounded-full transition-all" style={{ width: k === i ? 20 : 6, background: k === i ? "#06b6d4" : "#334155" }} />)}</div>
          <button data-testid="bakemix-next" onClick={() => go(Math.min(CH.length - 1, i + 1))} disabled={i === CH.length - 1} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[#06b6d4] text-[#030712] font-bold text-xs disabled:opacity-40 active:scale-95 transition-all">{tri("Avanti", "Weiter", "Next", "Siguiente", "Suivant", "بعدی")} <ChevronRight className="w-4 h-4" /></button>
        </div>
      </motion.div>

      <BakemixHardware />
      <CoreShowcase />
      <DocsDownload />
    </div>
  );
}
