import { useState } from "react";
import { motion } from "framer-motion";
import {
  PlusCircle, CalendarDays, ChefHat, Flame, Wheat, ChevronLeft, ChevronRight,
  ClipboardList, Thermometer, ScanLine, Clock, ShoppingCart, Users, CheckSquare, ListChecks, Snowflake, Droplets, FlaskConical,
  Cog, BookOpen, LayoutDashboard, Scale, Euro, Recycle, Timer as TimerIcon, CloudSun, Store, QrCode, CalendarCheck, Sparkles,
} from "lucide-react";
import RecipeList from "@/components/RecipeList";
import WeeklyPlan from "@/sections/WeeklyPlan";
import StartDoughs from "@/sections/StartDoughs";
import AdattaForno from "@/sections/AdattaForno";
import SvegliaLievito from "@/sections/SvegliaLievito";
import CapoLaboratorio from "@/sections/CapoLaboratorio";
import PianoProduzioneAI from "@/sections/PianoProduzioneAI";
import ClimaTermostato from "@/sections/ClimaTermostato";
import ScanRecipe from "@/sections/ScanRecipe";
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
import { useLang } from "@/i18n/LanguageContext";
import { useBackClose } from "@/lib/backNav";
import MohammedAssistant from "@/sections/MohammedAssistant";
import { toast } from "sonner";

export default function Maestro() {
  const [tool, setTool] = useState(null);
  const [step, setStep] = useState(0);
  const { t, lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);
  useBackClose(!!tool, () => setTool(null));

  const TOOLS = [
    { id: "lavoro", title: t("tool_lavoro"), desc: t("tool_lavoro_desc"), Icon: ChefHat },
    { id: "inversa", title: t("tool_inversa"), desc: t("tool_inversa_desc"), Icon: Clock },
    { id: "adatta", title: t("tool_adatta"), desc: t("tool_adatta_desc"), Icon: Flame },
    { id: "settimana", title: t("tool_settimana"), desc: t("tool_settimana_desc"), Icon: CalendarDays },
    { id: "check", title: t("tool_check"), desc: t("tool_check_desc"), Icon: ListChecks },
    { id: "spesa", title: t("tool_spesa"), desc: t("tool_spesa_desc"), Icon: ShoppingCart },
    { id: "turni", title: t("tool_turni"), desc: t("tool_turni_desc"), Icon: Users },
    { id: "freezer", title: lang === "de" ? "Freezer-Bestand" : lang === "en" ? "Freezer stock" : "Giacenze Freezer", desc: "", Icon: Snowflake },
    { id: "aggiungi", title: lang === "de" ? "Meine Rezepte (hinzufügen/scannen)" : lang === "en" ? "My Recipes (add/scan)" : "Le Mie Ricette (aggiungi/scansiona)", desc: t("tool_aggiungi_desc"), Icon: PlusCircle },
    { id: "termo", title: lang === "de" ? "Thermostat & Klima" : lang === "en" ? "Thermostat & Climate" : "Termostato & Clima", desc: "", Icon: Thermometer },
    { id: "acqua", title: lang === "de" ? "Wasser-Temperatur" : lang === "en" ? "Water temperature" : "Temperatura Acqua", desc: "", Icon: Droplets },
    { id: "ph", title: lang === "de" ? "pH-Tracker" : lang === "en" ? "pH Tracker" : "Tracker pH Lievito", desc: "", Icon: FlaskConical },
    { id: "capo", title: t("tool_capo"), desc: t("tool_capo_desc"), Icon: ClipboardList },
    { id: "bilancia", title: lang === "de" ? "Smarte Waage" : lang === "en" ? "Smart scale" : "Bilancia Smart", desc: "", Icon: Scale },
    { id: "pesata", title: lang === "de" ? "Geführtes Wiegen" : lang === "en" ? "Guided weighing" : "Pesata Guidata", desc: "", Icon: Scale },
    { id: "sessioni", title: lang === "de" ? "Teig-Tagebuch" : lang === "en" ? "Dough log" : "Diario Impasti", desc: "", Icon: Thermometer },
    { id: "haccp", title: lang === "de" ? "HACCP-Register" : lang === "en" ? "HACCP log" : "Registro HACCP", desc: "", Icon: ScanLine },
    { id: "foodcost", title: lang === "de" ? "Food Cost & Energie" : lang === "en" ? "Food cost & energy" : "Food Cost & Energia", desc: "", Icon: Euro },
    { id: "shelf", title: lang === "de" ? "Shelf-Life & Verdaulichkeit" : lang === "en" ? "Shelf-life & digestibility" : "Shelf-Life & Digeribilità", desc: "", Icon: CalendarDays },
    { id: "spreco", title: lang === "de" ? "Anti-Verschwendung" : lang === "en" ? "Anti-waste" : "Anti-Spreco", desc: "", Icon: Recycle },
    { id: "timer", title: lang === "de" ? "Backstuben-Timer" : lang === "en" ? "Lab timer" : "Timer da Laboratorio", desc: "", Icon: TimerIcon },
    { id: "meteo", title: lang === "de" ? "Wetter & Backstube" : lang === "en" ? "Weather & bakery" : "Meteo & Laboratorio", desc: "", Icon: CloudSun },
    { id: "twin", title: lang === "de" ? "Teig-Zwilling" : lang === "en" ? "Dough twin" : "Digital Twin Impasto", desc: "", Icon: FlaskConical },
    { id: "market", title: lang === "de" ? "Gebraucht-Markt" : lang === "en" ? "Used market" : "Marketplace Usato", desc: "", Icon: Store },
    { id: "lotti", title: lang === "de" ? "Chargen-Rückverfolgung" : lang === "en" ? "Batch traceability" : "Tracciabilità Lotti", desc: "", Icon: QrCode },
    { id: "salespoints", title: lang === "de" ? "Verkaufspunkte" : lang === "en" ? "Sales points" : "Punti Vendita", desc: "", Icon: Store },
    { id: "pianoai", title: lang === "de" ? "Produktionsplan (KI)" : lang === "en" ? "Production plan (AI)" : "Piano di Produzione (IA)", desc: "", Icon: Sparkles },
  ];
  const toolById = Object.fromEntries(TOOLS.map((x) => [x.id, x]));

  const STEPS = [
    { icon: Cog, title: tri("Prima Configurazione Hardware", "Hardware-Einrichtung", "Hardware Setup"), sub: tri("Macchine, impastatrici, celle, frigo, giacenze e connessione dispositivi (bilancia, termostati)", "Maschinen, Kneter, Gärzellen, Kühlschrank, Bestände und Geräte (Waage, Thermostate)", "Machines, mixers, cells, fridge, stock and device connection (scale, thermostats)"), tools: ["capo", "freezer", "bilancia", "termo", "market"] },
    { icon: BookOpen, title: tri("Le Mie Ricette & Parametri", "Meine Rezepte & Parameter", "My Recipes & Parameters"), sub: tri("Inserisci o scansiona le tue ricette e imposta i parametri del forno", "Rezepte erfassen/scannen und Ofenparameter einstellen", "Add or scan recipes and set oven parameters"), tools: ["aggiungi", "adatta"] },
    { icon: Store, title: tri("Logistica & Punti Vendita", "Logistik & Verkaufspunkte", "Logistics & Sales Points"), sub: tri("Configura i punti vendita e gestisci personale e turni", "Verkaufspunkte einrichten und Personal & Schichten verwalten", "Set up sales points and manage staff & shifts"), tools: ["salespoints", "turni"] },
    { icon: CalendarDays, title: tri("Pianificazione Produzione", "Produktionsplanung", "Production Planning"), sub: tri("Piano settimanale e piano di lavoro di oggi, piano IA, tempi a ritroso, spesa e food cost", "Wochenplan und heutiger Arbeitsplan, KI-Plan, Rückwärtszeiten, Einkauf und Food Cost", "Weekly plan and today's work plan, AI plan, backward timing, shopping and food cost"), tools: ["pianoai", "settimana", "lavoro", "inversa", "spesa", "foodcost"] },
    { icon: Thermometer, title: tri("Operatività In Corso", "Laufender Betrieb", "Live Operations"), sub: tri("Calcolo temperatura acqua, pesata guidata, timer e sensori (meteo, pH, twin)", "Wassertemperatur, geführtes Wiegen, Timer und Sensoren (Wetter, pH, Twin)", "Water temperature, guided weighing, timers and sensors (weather, pH, twin)"), tools: ["acqua", "pesata", "timer", "meteo", "ph", "twin"] },
    { icon: CheckSquare, title: tri("Chiusura & Tracciabilità", "Abschluss & Rückverfolgung", "Closing & Traceability"), sub: tri("Chiudi la giornata: Diario Impasti, Tracciabilità Lotti, Registro HACCP e controlli finali", "Tag abschließen: Teig-Tagebuch, Chargen-Rückverfolgung, HACCP und Endkontrollen", "Close the day: Dough Log, Batch Traceability, HACCP and final checks"), tools: ["sessioni", "lotti", "haccp", "check", "shelf", "spreco"], conclusione: true },
  ];
  const current = STEPS[step];

  if (tool) {
    return (
      <div>
        <button data-testid="maestro-back-btn" onClick={() => setTool(null)} className="flex items-center gap-1 text-[#5E8B7E] font-medium mb-4">
          <ChevronLeft className="w-5 h-5" /> {t("tools_back")}
        </button>
        {tool === "aggiungi" && (
          <RecipeList collectionName="personal"
            heroImage="https://images.unsplash.com/photo-1732565649629-eb4932a1ec09?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"
            heroTitle={t("personal_hero_title")} heroSubtitle={t("personal_hero_sub")} emptyText={t("personal_empty")}
            extraHeader={<ScanRecipe embedded />} />
        )}
        {tool === "capo" && <CapoLaboratorio />}
        {tool === "pianoai" && <PianoProduzioneAI />}
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
      </div>
    );
  }

  return (
    <div className="pb-28">
      <div data-testid="maestro-hero-tattoo" className="relative rounded-3xl overflow-hidden mb-4 h-40 shadow-md">
        <img src={`${process.env.PUBLIC_URL || ""}/bio-dough.jpg`} alt="Michele" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1412]/85 via-[#1A1412]/25 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-white/80">{tri("Il Tuo Laboratorio", "Deine Backstube", "Your Lab")}</p>
          <h2 className="font-display text-lg font-bold text-white leading-tight">{tri("Le mani nell'impasto, la testa organizzata", "Hände im Teig, Kopf organisiert", "Hands in the dough, head organized")}</h2>
        </div>
      </div>
      <h1 className="font-display text-3xl font-bold text-[#2B303B] dark:text-[#EAF0EC] mb-1">{t("maestro_title")}</h1>
      <p className="text-sm text-[#7E8A93] mb-4">{tri("Configura il tuo laboratorio passo dopo passo", "Richte deine Backstube Schritt für Schritt ein", "Set up your bakery step by step")}</p>

      {/* Stepper 5 passi */}
      <div className="flex items-center mb-5" data-testid="maestro-stepper">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <button data-testid={`maestro-step-${i + 1}`} onClick={() => setStep(i)}
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-display font-bold text-sm transition-all border-2 ${
                i === step ? "bg-[#5E8B7E] text-white border-[#5E8B7E] scale-110"
                : i < step ? "bg-[#6B8E62] text-white border-[#6B8E62]"
                : "bg-white dark:bg-[#232A31] text-[#7E8A93] border-[#D7E1DB] dark:border-[#38424B]"}`}>
              {i + 1}
            </button>
            {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 mx-1 ${i < step ? "bg-[#6B8E62]" : "bg-[#D7E1DB] dark:bg-[#38424B]"}`} />}
          </div>
        ))}
      </div>

      {/* Passo corrente */}
      <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}
        data-testid={`maestro-panel-${step + 1}`} className="rounded-3xl bg-[#6E8CA0]/10 border border-[#6E8CA0]/30 p-5 mb-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-[#5E8B7E] flex items-center justify-center shrink-0">
            <current.icon className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#5E8B7E]">{tri("Passo", "Schritt", "Step")} {step + 1}/{STEPS.length}</p>
            <h2 className="font-display text-xl font-bold text-[#2B303B] dark:text-[#EAF0EC] leading-tight">{current.title}</h2>
            <p className="text-xs text-[#7E8A93] leading-snug mt-0.5">{current.sub}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {current.conclusione && (
            <div data-testid="maestro-conclusione" className="col-span-2 rounded-2xl bg-[#6B8E62]/12 border border-[#6B8E62]/30 p-3.5 mb-1">
              <div className="flex items-center gap-2 text-[#4d6b45] dark:text-[#9ec48f] font-bold text-sm"><CheckSquare className="w-4 h-4" /> {tri("Hai finito? Chiudi la giornata", "Fertig? Tag abschließen", "Done? Close the day")}</div>
              <p className="text-xs text-[#3F4A54] dark:text-[#AEB8BF] mt-1.5 leading-snug">{tri("Concludi la giornata: vedi il riepilogo e archivia le sessioni del Diario Impasti e le voci HACCP.", "Schließe den Tag ab: Übersicht ansehen und Teig-Tagebuch-Sitzungen sowie HACCP-Einträge archivieren.", "Close the day: see the summary and archive Dough Log sessions and HACCP entries.")}</p>
              <button data-testid="maestro-concludi-giornata" onClick={() => setTool("dayclose")}
                className="mt-2.5 w-full flex items-center justify-center gap-2 bg-[#6B8E62] hover:bg-[#5a7a53] text-white font-bold py-2.5 rounded-xl active:scale-98 transition-all">
                <CalendarCheck className="w-5 h-5" /> {tri("Concludi Giornata", "Tag abschließen", "Close the Day")}
              </button>
            </div>
          )}
          {current.tools.map((id, i) => {
            const tItem = toolById[id];
            if (!tItem) return null;
            const { title, Icon } = tItem;
            return (
              <motion.button key={id} data-testid={`maestro-tool-${id}`} onClick={() => setTool(id)}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="flex flex-col items-start gap-2 bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] rounded-2xl p-3.5 shadow-sm active:scale-97 hover:border-[#6E8CA0]/60 transition-all text-left min-h-[104px]">
                <div className="w-10 h-10 rounded-xl bg-[#6E8CA0]/15 border border-[#6E8CA0]/30 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#5E8B7E]" />
                </div>
                <h3 className="font-display text-base font-semibold text-[#2B303B] dark:text-[#EAF0EC] leading-tight">{title}</h3>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Navigazione passi */}
      <div className="flex items-center justify-between gap-3">
        <button data-testid="maestro-prev" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
          className="flex items-center gap-1 px-4 py-2.5 rounded-2xl border border-[#D7E1DB] dark:border-[#38424B] text-[#2B303B] dark:text-[#EAF0EC] font-medium disabled:opacity-40">
          <ChevronLeft className="w-5 h-5" /> {tri("Indietro", "Zurück", "Back")}
        </button>
        {step < STEPS.length - 1 ? (
          <button data-testid="maestro-next" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            className="flex items-center gap-1 px-5 py-2.5 rounded-2xl bg-[#5E8B7E] hover:bg-[#4C7368] text-white font-semibold active:scale-97 transition-all">
            {tri("Avanti", "Weiter", "Next")} <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button data-testid="maestro-done" onClick={() => { toast.success(tri("Programmazione completata! 🎉 Buon lavoro", "Planung abgeschlossen! 🎉 Gute Arbeit", "Planning completed! 🎉 Enjoy your work")); setTool(null); setStep(0); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="flex items-center gap-1 px-5 py-2.5 rounded-2xl bg-[#6B8E62] hover:bg-[#5a7a53] text-white font-semibold active:scale-97 transition-all">
            <CheckSquare className="w-5 h-5" /> {tri("Completa", "Abschließen", "Complete")}
          </button>
        )}
      </div>

      {/* Assistente Mohammadreza + guida passo-passo (in fondo alla pagina) */}
      <div className="mt-6">
        <MohammedAssistant />
      </div>
    </div>
  );
}
