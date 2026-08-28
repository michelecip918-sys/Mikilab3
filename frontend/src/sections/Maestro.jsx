import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  PlusCircle, CalendarDays, ChefHat, Flame, Wheat, ChevronLeft, ChevronRight,
  ClipboardList, Thermometer, ScanLine, Clock, ShoppingCart, Users, CheckSquare, ListChecks, Snowflake, Droplets, FlaskConical,
  Cog, BookOpen, LayoutDashboard, Scale, Euro, Recycle, Timer as TimerIcon, CloudSun, Store, QrCode, CalendarCheck, Sparkles, Camera, Building2,
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
import Marketplace from "@/sections/Marketplace";
import BatchTraceability from "@/sections/BatchTraceability";
import DoughTwin from "@/sections/DoughTwin";
import GuidedWeighing from "@/sections/GuidedWeighing";
import DoughLog from "@/sections/DoughLog";
import HaccpLog from "@/sections/HaccpLog";
import SalesPoints from "@/sections/SalesPoints";
import DayClose from "@/sections/DayClose";
import HighFive from "@/components/HighFive";
import FlourTable from "@/components/FlourTable";
import PhotoDiagnosi from "@/sections/PhotoDiagnosi";
import SoundDiagnosi from "@/sections/SoundDiagnosi";
import EnterpriseHub from "@/sections/EnterpriseHub";
import { useLang } from "@/i18n/LanguageContext";
import { useBackClose } from "@/lib/backNav";
import MohammedAssistant from "@/sections/MohammedAssistant";
import AvatarBubbles from "@/components/AvatarBubbles";
import RecipeGenerator from "@/components/RecipeGenerator";
import FermentazionePredittiva from "@/sections/FermentazionePredittiva";
import CosaPosso from "@/components/CosaPosso";
import CostoEnergia from "@/components/CostoEnergia";
import CalcolatoreMetodo from "@/sections/CalcolatoreMetodo";
import ConvertitoreLieviti from "@/sections/ConvertitoreLieviti";
import CalcolatoreStampi from "@/sections/CalcolatoreStampi";
import SosImpastoGuida from "@/sections/SosImpastoGuida";
import AngoloRecupero from "@/sections/AngoloRecupero";
import SaporiCasa from "@/sections/SaporiCasa";
import TrovaFarina from "@/sections/TrovaFarina";
import EsuberoZero from "@/sections/EsuberoZero";
import SmartWeatherBaker from "@/sections/SmartWeatherBaker";
import { toast } from "sonner";

export default function Maestro() {
  const [tool, setTool] = useState(null);
  const scrollRef = useRef(0);
  const openTool = (id) => { scrollRef.current = window.scrollY; setTool(id); window.scrollTo(0, 0); };
  const back = () => setTool(null);
  useEffect(() => {
    if (!tool) requestAnimationFrame(() => window.scrollTo(0, scrollRef.current || 0));
    else window.scrollTo(0, 0);
  }, [tool]);
  const { t, lang } = useLang();
  const tri = (i, d, e, s) => (lang === "de" ? d : lang === "es" ? (s ?? e ?? i) : lang === "en" ? (e ?? i) : i);
  useBackClose(!!tool, back);

  if (tool) {
    return (
      <div>
        <HighFive />
        <button data-testid="maestro-back-btn" onClick={back}
          className="inline-flex items-center gap-1.5 mb-4 px-4 py-2 rounded-full bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] text-[#234b6e] dark:text-[#a9d2ec] font-semibold text-sm shadow-sm active:scale-95 transition-all">
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
        {tool === "haccp" && <HaccpLog />}
        {tool === "foodcost" && <FoodCost />}
        {tool === "shelf" && <ShelfLife />}
        {tool === "spreco" && <AntiWaste />}
        {tool === "timer" && <Timer />}
        {tool === "meteo" && <Meteo />}
        {tool === "twin" && <DoughTwin />}
        {tool === "market" && <Marketplace />}
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
        {tool === "dayclose" && <DayClose />}
        {tool === "diagnosi" && <PhotoDiagnosi />}
        {tool === "scanflour" && <ScanFlour />}
        {tool === "metodo" && <CalcolatoreMetodo />}
        {tool === "convlievito" && <ConvertitoreLieviti />}
        {tool === "stampi" && <CalcolatoreStampi />}
        {tool === "sosimpasto" && <SosImpastoGuida onOpenTool={openTool} />}
        {tool === "recupero" && <AngoloRecupero />}
        {tool === "saporicasa" && <SaporiCasa />}
        {tool === "trovafarina" && <TrovaFarina />}
        {tool === "esuberozero" && <EsuberoZero />}
        {tool === "weatherbaker" && <SmartWeatherBaker />}
        {tool === "suono" && <SoundDiagnosi />}
        {tool === "enterprise" && <EnterpriseHub />}
      </div>
    );
  }

  return (
    <div className="pb-28">
      <HighFive />

      {/* Snellito: si arriva SUBITO al Piano di Produzione IA (hero + scegli ricette + genera) */}
      <PianoProduzioneAI onOpenTool={openTool} />

      {/* Assistente e aiuto: sotto il piano, per chi vuole approfondire */}
      <div className="mt-5">
        <MohammedAssistant />
      </div>

      {/* WhatsApp SOLO qui (Laboratorio) e nei Corsi */}
      <div className="mt-4">
        <WhatsAppHelp context="laboratorio" />
      </div>
    </div>
  );
}
