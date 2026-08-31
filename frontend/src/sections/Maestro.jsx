import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  PlusCircle, CalendarDays, ChefHat, Flame, Wheat, ChevronLeft, ChevronRight,
  ClipboardList, Thermometer, ScanLine, Clock, ShoppingCart, Users, CheckSquare, ListChecks, Snowflake, Droplets, FlaskConical,
  Cog, BookOpen, LayoutDashboard, Scale, Euro, Recycle, Timer as TimerIcon, CloudSun, Store, QrCode, CalendarCheck, Sparkles, Camera, Building2, Wrench, ChevronDown, ChevronUp, Maximize2, Mic,
} from "lucide-react";
import RecipeList from "@/components/RecipeList";
import WhatsAppHelp from "@/components/WhatsAppHelp";
import MyData from "@/sections/MyData";
import MachinePark from "@/components/MachinePark";
import WeeklyPlan from "@/sections/WeeklyPlan";
import StartDoughs from "@/sections/StartDoughs";
import AdattaForno from "@/sections/AdattaForno";
import SvegliaLievito from "@/sections/SvegliaLievito";
import CapoLaboratorio from "@/sections/CapoLaboratorio";
import PianoProduzioneAI from "@/sections/PianoProduzioneAI";
import ClimaTermostato from "@/sections/ClimaTermostato";
import ScanRecipe from "@/sections/ScanRecipe";
import WebRecipe from "@/sections/WebRecipe";
import ScanFlour from "@/sections/ScanFlour";
import BackwardScheduler from "@/sections/BackwardScheduler";
import ShoppingList from "@/sections/ShoppingList";
import ShiftRoles from "@/sections/ShiftRoles";
import Checklists from "@/sections/Checklists";
import FreezerStock from "@/sections/FreezerStock";
import WaterTempCalc from "@/sections/WaterTempCalc";
import SourdoughTracker from "@/sections/SourdoughTracker";
import SmartScale from "@/sections/SmartScale";
import FoodCost from "@/sections/FoodCost";
import ShelfLife from "@/sections/ShelfLife";
import AntiWaste from "@/sections/AntiWaste";
import Timer from "@/sections/Timer";
import Meteo from "@/sections/Meteo";
import BatchTraceability from "@/sections/BatchTraceability";
import DoughTwin from "@/sections/DoughTwin";
import GuidedWeighing from "@/sections/GuidedWeighing";
import DoughLog from "@/sections/DoughLog";
import SalesPoints from "@/sections/SalesPoints";
import HighFive from "@/components/HighFive";
import LabWizard from "@/components/LabWizard";
import FlourTable from "@/components/FlourTable";
import PhotoDiagnosi from "@/sections/PhotoDiagnosi";
import SoundDiagnosi from "@/sections/SoundDiagnosi";
import EnterpriseHub from "@/sections/EnterpriseHub";
import { useLang } from "@/i18n/LanguageContext";
import { useBackClose } from "@/lib/backNav";
import RecipeGenerator from "@/components/RecipeGenerator";
import FermentazionePredittiva from "@/sections/FermentazionePredittiva";
import CosaPosso from "@/components/CosaPosso";
import CostoEnergia from "@/components/CostoEnergia";
import CalcolatoreMetodo from "@/sections/CalcolatoreMetodo";
import CalcolatoreSequenze from "@/sections/CalcolatoreSequenze";
import ConvertitoreLieviti from "@/sections/ConvertitoreLieviti";
import CalcolatoreStampi from "@/sections/CalcolatoreStampi";
import SosImpastoGuida from "@/sections/SosImpastoGuida";
import AngoloRecupero from "@/sections/AngoloRecupero";
import SaporiCasa from "@/sections/SaporiCasa";
import TrovaFarina from "@/sections/TrovaFarina";
import EsuberoZero from "@/sections/EsuberoZero";
import SmartWeatherBaker from "@/sections/SmartWeatherBaker";
import SimulatoreForno from "@/sections/SimulatoreForno";
import TimeLapseTracker from "@/sections/TimeLapseTracker";
import BancaLievito from "@/sections/BancaLievito";
import CantiereRicetta from "@/sections/CantiereRicetta";
import LabPizzeria from "@/sections/LabPizzeria";
import LabPasticceria from "@/sections/LabPasticceria";
import RicetteCustodite from "@/sections/RicetteCustodite";
import ManiSporche from "@/sections/ManiSporche";
import ToolsDirectory from "@/components/ToolsDirectory";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";
import LabModeBig from "@/components/LabModeBig";
import VoiceCommand from "@/components/VoiceCommand";
import TimetableLievitazione from "@/sections/TimetableLievitazione";


export default function Maestro() {
  const [tool, setTool] = useState(null);
  const [showTools, setShowTools] = useState(() => { try { return localStorage.getItem("mikilab_lab_show_tools") === "1"; } catch { return false; } });
  useEffect(() => { try { localStorage.setItem("mikilab_lab_show_tools", showTools ? "1" : "0"); } catch { /* */ } }, [showTools]);
  const [bigMode, setBigMode] = useState(() => { try { return localStorage.getItem("mikilab_lab_big") === "1"; } catch { return false; } });
  const setBig = (v) => { setBigMode(v); try { localStorage.setItem("mikilab_lab_big", v ? "1" : "0"); } catch { /* */ } window.scrollTo(0, 0); };
  const scrollRef = useRef(0);
  const openTool = (id) => { scrollRef.current = window.scrollY; setTool(id); window.scrollTo(0, 0); };
  const back = () => setTool(null);
  useEffect(() => {
    const readPending = () => {
      try {
        const pending = localStorage.getItem("mikilab_pending_tool");
        if (pending) { localStorage.removeItem("mikilab_pending_tool"); setTool(pending); window.scrollTo(0, 0); }
      } catch { /* */ }
    };
    readPending();
    const openTool = (e) => {
      const id = e?.detail?.id;
      if (id) { try { localStorage.removeItem("mikilab_pending_tool"); } catch { /* */ } setTool(id); window.scrollTo(0, 0); }
    };
    window.addEventListener("mikilab-open-lab-tool", openTool);
    return () => window.removeEventListener("mikilab-open-lab-tool", openTool);
  }, []);
  useEffect(() => {
    if (!tool) requestAnimationFrame(() => window.scrollTo(0, scrollRef.current || 0));
    else window.scrollTo(0, 0);
  }, [tool]);
  // All'ingresso nel Laboratorio: sempre in cima, così si vede subito "Inserisci Ricetta" e il Percorso.
  useEffect(() => {
    window.scrollTo(0, 0);
    const r = requestAnimationFrame(() => window.scrollTo(0, 0));
    const t = setTimeout(() => window.scrollTo(0, 0), 80);
    return () => { cancelAnimationFrame(r); clearTimeout(t); };
  }, []);
  const { t, lang } = useLang();
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  useBackClose(!!tool, back);

  if (tool) {
    return (
      <div>
        <HighFive />
        <button data-testid="maestro-back-btn" onClick={back}
          className="inline-flex items-center gap-1.5 mb-4 px-4 py-2 rounded-full bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] text-[#ff6b00] dark:text-[#a9d2ec] font-semibold text-sm shadow-sm active:scale-95 transition-all">
          <ChevronLeft className="w-4.5 h-4.5" /> {tri("Torna agli strumenti", "Zurück zu den Werkzeugen", "Back to tools", "Volver a las herramientas")}
        </button>
        {tool === "aggiungi" && (
          <RecipeList collectionName="personal"
            heroImage="https://images.unsplash.com/photo-1732565649629-eb4932a1ec09?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"
            heroTitle={t("personal_hero_title")} heroSubtitle={t("personal_hero_sub")} emptyText={t("personal_empty")}
            extraHeader={<ScanRecipe embedded />} />
        )}
        {tool === "capo" && <CapoLaboratorio />}
        {tool === "generatore" && <RecipeGenerator />}
        {tool === "fermentazione" && <FermentazionePredittiva />}
        {tool === "cosafare" && <CosaPosso />}
        {tool === "energia" && <CostoEnergia />}
        {tool === "pianoai" && <PianoProduzioneAI onOpenTool={openTool} />}
        {tool === "mydata" && <MyData onOpenTool={openTool} />}
        {tool === "macchine" && <MachinePark />}
        {tool === "bilancia" && <SmartScale />}
        {tool === "pesata" && <GuidedWeighing />}
        {tool === "sessioni" && <DoughLog />}
        {tool === "foodcost" && <FoodCost />}
        {tool === "shelf" && <ShelfLife />}
        {tool === "spreco" && <AntiWaste />}
        {tool === "timer" && <Timer />}
        {tool === "meteo" && <Meteo />}
        {tool === "twin" && <DoughTwin />}
        {tool === "lotti" && <BatchTraceability />}
        {tool === "settimana" && <WeeklyPlan />}
        {tool === "inversa" && <BackwardScheduler />}
        {tool === "lavoro" && <StartDoughs />}
        {tool === "adatta" && <AdattaForno />}
        {tool === "termo" && <ClimaTermostato />}
        {tool === "acqua" && <WaterTempCalc />}
        {tool === "ph" && <SourdoughTracker />}
        {tool === "freezer" && <FreezerStock />}
        {tool === "spesa" && <ShoppingList />}
        {tool === "turni" && <ShiftRoles />}
        {tool === "check" && <Checklists />}
        {tool === "sveglia" && <SvegliaLievito />}
        {tool === "salespoints" && <SalesPoints />}
        {tool === "timetable" && <TimetableLievitazione />}
        {tool === "diagnosi" && <PhotoDiagnosi />}
        {tool === "scanflour" && <ScanFlour />}
        {tool === "webrecipe" && <WebRecipe />}
        {tool === "metodo" && <CalcolatoreMetodo />}
        {tool === "sequenze" && <CalcolatoreSequenze />}
        {tool === "convlievito" && <ConvertitoreLieviti />}
        {tool === "stampi" && <CalcolatoreStampi />}
        {tool === "sosimpasto" && <SosImpastoGuida onOpenTool={openTool} />}
        {tool === "recupero" && <AngoloRecupero />}
        {tool === "saporicasa" && <SaporiCasa />}
        {tool === "trovafarina" && <TrovaFarina />}
        {tool === "esuberozero" && <EsuberoZero />}
        {tool === "weatherbaker" && <SmartWeatherBaker />}
        {tool === "simforno" && <SimulatoreForno />}
        {tool === "timelapse" && <TimeLapseTracker />}
        {tool === "bancalievito" && <BancaLievito />}
        {tool === "cantiere" && <CantiereRicetta />}
        {tool === "labpizzeria" && <LabPizzeria onOpenTool={openTool} />}
        {tool === "labpasticceria" && <LabPasticceria onOpenTool={openTool} />}
        {tool === "custodite" && <RicetteCustodite />}
        {tool === "manisporche" && <ManiSporche />}
        {tool === "suono" && <SoundDiagnosi />}
        {tool === "enterprise" && <EnterpriseHub />}
      </div>
    );
  }

  if (bigMode) {
    return <LabModeBig onExit={() => setBig(false)} onOpenTool={openTool} onOpenPlan={() => setBig(false)} />;
  }

  return (
    <div className="pb-28">
      <HighFive />

      {/* Header pulito e professionale: solo titolo, nessuna immagine decorativa (lab = lavoro veloce). */}
      <div data-testid="maestro-title" className="mb-4">
        <h1 className="font-display text-2xl font-extrabold text-white leading-tight">{mkTri(lang)("Il Tuo Laboratorio", "Dein Labor", "Your Lab", "Tu Laboratorio", "Ton Atelier", "کارگاه تو")}</h1>
        <p className="text-[13px] text-[#AEB8BF] leading-snug mt-0.5">{mkTri(lang)("Tutti i tuoi strumenti in ordine, divisi per sezione. Bottoni grandi e comandi vocali: lavori anche a mani infarinate.", "Alle Werkzeuge geordnet, nach Bereichen. Große Tasten & Sprachbefehle: auch mit mehligen Händen.", "All your tools in order, split by section. Big buttons and voice commands: work even with floury hands.", "Todas tus herramientas en orden, por secciones. Botones grandes y comandos de voz: trabaja incluso con las manos enharinadas.", "Tous tes outils en ordre, par sections. Gros boutons et commandes vocales.", "همهٔ ابزارها مرتب، بخش‌بندی‌شده. دکمه‌های بزرگ و فرمان صوتی.")}</p>
      </div>

      {/* Modalità Laboratorio: pulsanti giganti per lavorare con le mani infarinate */}
      <button data-testid="maestro-lab-big-toggle" onClick={() => setBig(true)}
        className="w-full flex items-center gap-3 min-h-[64px] rounded-2xl px-4 mb-3 bg-[#1e1e1e] border-2 border-[#ff6b00]/60 hover:border-[#ff6b00] text-white active:scale-98 transition-all text-left">
        <span className="w-11 h-11 rounded-2xl bg-[#ff6b00]/15 border border-[#ff6b00]/40 flex items-center justify-center shrink-0"><Maximize2 className="w-6 h-6 text-[#ff6b00]" /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[15px] font-extrabold leading-tight">{mkTri(lang)("Modalità Laboratorio", "Labor-Modus", "Bakery Mode", "Modo Laboratorio", "Mode Atelier", "حالت کارگاه")}</span>
          <span className="block text-[11.5px] text-[#7E8A93] leading-snug">{mkTri(lang)("Pulsanti giganti, per mani infarinate e voce", "Große Tasten, für mehlige Hände & Stimme", "Giant buttons, for floury hands & voice", "Botones gigantes, para manos enharinadas y voz")}</span>
        </span>
        <ChevronRight className="w-5 h-5 text-[#ff6b00] shrink-0" />
      </button>

      {/* IN CIMA: il generatore del Piano IA + CTA diretta al calcolo generato */}
      <div data-testid="maestro-generate-cta" className="mb-3 rounded-2xl border border-[#ff6b00]/45 bg-gradient-to-br from-[#2a1a0d] to-[#161616] p-4">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#ff6b00] mb-1 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" /> {mkTri(lang)("Il tuo piano, in un tocco", "Dein Plan, ein Tipp", "Your plan, one tap", "Tu plan, un toque", "Ton plan, un geste", "برنامه‌ات، با یک لمس")}
        </p>
        <p className="text-[12.5px] text-[#AEB8BF] leading-snug mb-2.5">{mkTri(lang)("Scegli le ricette qui sotto e genera il piano di produzione. Oppure salta subito al pulsante Genera.", "Wähle unten die Rezepte und erzeuge den Produktionsplan. Oder springe direkt zum Generieren.", "Pick the recipes below and generate the production plan. Or jump straight to Generate.", "Elige las recetas abajo y genera el plan de producción. O salta directo a Generar.", "Choisis les recettes ci-dessous et génère le plan. Ou saute directement à Générer.", "دستورها را انتخاب کن و برنامه را بساز.")}</p>
        <button data-testid="maestro-jump-generate" onClick={() => { const el = document.querySelector('[data-testid="capo-generate"]'); if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); }}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b00] to-[#c94f00] text-white font-bold py-3 text-sm active:scale-95 transition-all shadow-[0_4px_0_rgba(0,0,0,.3)]">
          <Sparkles className="w-4.5 h-4.5" /> {mkTri(lang)("Vai a Genera il Piano", "Zum Plan generieren", "Go to Generate Plan", "Ir a Generar Plan", "Aller à Générer", "برو به ساخت برنامه")}
        </button>
      </div>
      <PianoProduzioneAI onOpenTool={openTool} />

      {/* PERCORSO GUIDATO: la sequenza logica passo-passo (Settimana → Ricetta → Extra) */}
      <LabWizard onOpenTool={openTool} />

      {/* Tutto il resto (Sfida Lampo + calcolatori + direttorio strumenti) dietro un toggle, per tenere pulito il Lab */}
      <button data-testid="maestro-toggle-tools" onClick={() => setShowTools((v) => !v)}
        className="w-full flex items-center justify-between gap-2 rounded-2xl px-4 py-3.5 mb-3 bg-[#1e1e1e] border border-[#2e2e2e] hover:border-[#ff6b00]/50 text-white active:scale-98 transition-all text-left">
        <span className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-[#ff6b00]/15 border border-[#ff6b00]/30 flex items-center justify-center shrink-0"><Wrench className="w-5 h-5 text-[#ff6b00]" /></span>
          <span className="min-w-0">
            <span className="block font-display text-sm font-bold leading-tight">{mkTri(lang)("Tutti gli strumenti", "Alle Werkzeuge", "All tools", "Todas las herramientas", "Tous les outils", "همهٔ ابزارها")}</span>
            <span className="block text-[11.5px] text-[#7E8A93] leading-snug">{mkTri(lang)("Calcolatori, registri e diagnosi", "Rechner, Register & Diagnose", "Calculators, logs & diagnosis", "Calculadoras, registros y diagnóstico", "Calculateurs, registres & diagnostic", "ماشین‌حساب‌ها، ثبت‌ها و تشخیص")}</span>
          </span>
        </span>
        {showTools ? <ChevronUp className="w-5 h-5 text-[#ff6b00] shrink-0" /> : <ChevronDown className="w-5 h-5 text-[#ff6b00] shrink-0" />}
      </button>

      {showTools && (
      <div data-testid="maestro-tools-collapsible">
      {/* DA DOVE INIZIARE: inserisci ricetta + calcolatori, poi il percorso guidato */}
      <div data-testid="maestro-top-tools" className="mb-4">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#ff6b00] mb-2 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" /> {mkTri(lang)("Da dove iniziare", "Wo anfangen", "Where to start", "Por dónde empezar", "Par où commencer", "از کجا شروع کنی")}
        </p>
        {/* Azione principale ben visibile: inserire una ricetta */}
        <button data-testid="maestro-top-aggiungi" onClick={() => openTool("aggiungi")}
          className="w-full flex items-center gap-3.5 min-h-[68px] rounded-2xl px-4 mb-2.5 bg-gradient-to-r from-[#ff6b00] to-[#c94f00] text-white shadow-[0_5px_0_rgba(0,0,0,.35),0_8px_16px_rgba(255,107,0,.32)] active:translate-y-0.5 active:shadow-[0_2px_0_rgba(0,0,0,.35)] transition-all text-left">
          <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-extrabold leading-tight">{mkTri(lang)("Inserisci una Ricetta", "Rezept einfügen", "Add a Recipe", "Añadir una Receta", "Ajouter une Recette", "افزودن دستور")}</p>
            <p className="text-[12px] text-white/85 leading-snug">{mkTri(lang)("Aggiungi o scansiona le tue ricette", "Füge deine Rezepte hinzu oder scanne sie", "Add or scan your recipes", "Añade o escanea tus recetas", "Ajoute ou scanne tes recettes", "دستورهایت را اضافه یا اسکن کن")}</p>
          </div>
          <ChevronRight className="w-5 h-5 shrink-0" />
        </button>
        <p className="text-[10.5px] font-bold uppercase tracking-wide text-[#7E8A93] mb-1.5 mt-1">{mkTri(lang)("Calcolatori rapidi", "Schnellrechner", "Quick calculators", "Calculadoras rápidas", "Calculateurs rapides", "ماشین‌حساب‌های سریع")}</p>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { id: "settimana", Icon: CalendarDays, label: mkTri(lang)("Piano Settimanale", "Wochenplan", "Weekly Plan", "Plan Semanal", "Plan Hebdo", "برنامهٔ هفتگی") },
            { id: "metodo", Icon: Droplets, label: mkTri(lang)("Calcolatore Idratazione", "Hydratations-Rechner", "Hydration Calculator", "Calc. Hidratación", "Calc. Hydratation", "ماشین‌حساب آب") },
            { id: "sequenze", Icon: ListChecks, label: mkTri(lang)("Sequenze & Orari", "Reihenfolge & Zeiten", "Sequences & Timing", "Secuencias y Horarios", "Séquences & Horaires", "توالی و زمان‌ها") },
            { id: "convlievito", Icon: FlaskConical, label: mkTri(lang)("Convertitore Lieviti", "Hefe-Umrechner", "Yeast Converter", "Convertidor Levaduras", "Convertisseur Levures", "مبدل خمیرمایه") },
          ].map(({ id, Icon, label }) => (
            <button key={id} data-testid={`maestro-top-${id}`} onClick={() => openTool(id)}
              className="flex items-center gap-3 min-h-[60px] rounded-2xl px-4 bg-[#1e1e1e] border border-[#ff6b00]/40 text-white shadow-sm active:scale-97 hover:border-[#ff6b00] transition-all text-left">
              <span className="w-9 h-9 rounded-xl bg-[#ff6b00]/15 border border-[#ff6b00]/30 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-[#ff6b00]" /></span>
              <span className="font-display text-sm font-bold leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Direttorio strumenti diviso per funzione: CREA / CALCOLA / GESTISCI / CONTROLLA */}
      <ToolsDirectory onOpenTool={openTool} />
      </div>
      )}

      {/* Avatar del Laboratorio: Michele operativo + Mohammadreza pronto ad aiutare */}
      {/* Firma personale: Michele al lavoro (identità del laboratorio) */}
      {/* Assistente e aiuto: sotto il piano, per chi vuole approfondire */}

      {/* WhatsApp SOLO qui (Laboratorio) e nei Corsi */}
      <div className="mt-4">
        <WhatsAppHelp context="laboratorio" />
      </div>

      {/* Comandi vocali sempre raggiungibili: apri qualsiasi strumento a mani libere */}
      <VoiceCommand onOpenTool={openTool} />
    </div>
  );
}
