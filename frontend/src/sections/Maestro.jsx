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
import BluetoothConnect from "@/components/BluetoothConnect";
import TimetableLievitazione from "@/sections/TimetableLievitazione";
import { useProfile } from "@/profile/ProfileContext";
import { isPassion } from "@/lib/labHubs";


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
  const { profile } = useProfile();
  const passion = isPassion(profile);
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
        {tool === "bluetooth" && <BluetoothConnect />}
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

  if (bigMode && !passion) {
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

      {/* Modalità Laboratorio: pulsanti giganti per lavorare con le mani infarinate (solo Pro) */}
      {!passion && (
      <button data-testid="maestro-lab-big-toggle" onClick={() => setBig(true)}
        className="w-full flex items-center gap-3 min-h-[64px] rounded-2xl px-4 mb-3 bg-[#1e1e1e] border-2 border-[#ff6b00]/60 hover:border-[#ff6b00] text-white active:scale-98 transition-all text-left">
        <span className="w-11 h-11 rounded-2xl bg-[#ff6b00]/15 border border-[#ff6b00]/40 flex items-center justify-center shrink-0"><Maximize2 className="w-6 h-6 text-[#ff6b00]" /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[15px] font-extrabold leading-tight">{mkTri(lang)("Modalità Laboratorio", "Labor-Modus", "Bakery Mode", "Modo Laboratorio", "Mode Atelier", "حالت کارگاه")}</span>
          <span className="block text-[11.5px] text-[#7E8A93] leading-snug">{mkTri(lang)("Pulsanti giganti, per mani infarinate e voce", "Große Tasten, für mehlige Hände & Stimme", "Giant buttons, for floury hands & voice", "Botones gigantes, para manos enharinadas y voz")}</span>
        </span>
        <ChevronRight className="w-5 h-5 text-[#ff6b00] shrink-0" />
      </button>
      )}

      {/* Generatore di Piano IA — il flusso unico di produzione (solo Pro) */}
      {!passion && (
      <div data-testid="maestro-plan" className="mb-4">
        <PianoProduzioneAI onOpenTool={openTool} />
      </div>
      )}

      {/* 4 Macro-Hub: tutti gli strumenti in ordine. Ognuno si apre come schermata sovrapposta. */}
      <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#ff6b00] mb-2 flex items-center gap-1.5">
        <Wrench className="w-4 h-4" /> {mkTri(lang)("Strumenti del Laboratorio", "Labor-Werkzeuge", "Lab tools", "Herramientas del Lab", "Outils de l'atelier", "ابزارهای کارگاه")}
      </p>
      <ToolsDirectory onOpenTool={openTool} />

      {/* WhatsApp SOLO qui (Laboratorio) e nei Corsi */}
      <div className="mt-4">
        <WhatsAppHelp context="laboratorio" />
      </div>

      {/* Comandi vocali sempre raggiungibili: apri qualsiasi strumento a mani libere */}
      <VoiceCommand onOpenTool={openTool} />
    </div>
  );
}
