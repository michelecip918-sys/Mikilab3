import { useState } from "react";
import { motion } from "framer-motion";
import {
  PlusCircle, CalendarDays, ChefHat, Flame, Wheat, ChevronLeft, ChevronRight,
  ClipboardList, Thermometer, ScanLine, Clock, ShoppingCart, Users, CheckSquare, ListChecks, Snowflake, Droplets, FlaskConical,
  Cog, BookOpen, LayoutDashboard,
} from "lucide-react";
import RecipeList from "@/components/RecipeList";
import WeeklyPlan from "@/sections/WeeklyPlan";
import StartDoughs from "@/sections/StartDoughs";
import AdattaForno from "@/sections/AdattaForno";
import SvegliaLievito from "@/sections/SvegliaLievito";
import CapoLaboratorio from "@/sections/CapoLaboratorio";
import ClimaTermostato from "@/sections/ClimaTermostato";
import ScanRecipe from "@/sections/ScanRecipe";
import BackwardScheduler from "@/sections/BackwardScheduler";
import ShoppingList from "@/sections/ShoppingList";
import ShiftRoles from "@/sections/ShiftRoles";
import Checklists from "@/sections/Checklists";
import FreezerStock from "@/sections/FreezerStock";
import WaterTempCalc from "@/sections/WaterTempCalc";
import SourdoughTracker from "@/sections/SourdoughTracker";
import { useLang } from "@/i18n/LanguageContext";
import { MikiAvatar } from "@/components/MikiAvatar";

export default function Maestro() {
  const [tool, setTool] = useState(null);
  const [step, setStep] = useState(0);
  const { t, lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);

  const TOOLS = [
    { id: "lavoro", title: t("tool_lavoro"), desc: t("tool_lavoro_desc"), Icon: ChefHat },
    { id: "inversa", title: t("tool_inversa"), desc: t("tool_inversa_desc"), Icon: Clock },
    { id: "adatta", title: t("tool_adatta"), desc: t("tool_adatta_desc"), Icon: Flame },
    { id: "settimana", title: t("tool_settimana"), desc: t("tool_settimana_desc"), Icon: CalendarDays },
    { id: "check", title: t("tool_check"), desc: t("tool_check_desc"), Icon: ListChecks },
    { id: "spesa", title: t("tool_spesa"), desc: t("tool_spesa_desc"), Icon: ShoppingCart },
    { id: "turni", title: t("tool_turni"), desc: t("tool_turni_desc"), Icon: Users },
    { id: "freezer", title: lang === "de" ? "Freezer-Bestand" : lang === "en" ? "Freezer stock" : "Giacenze Freezer", desc: "", Icon: Snowflake },
    { id: "aggiungi", title: t("tool_aggiungi"), desc: t("tool_aggiungi_desc"), Icon: PlusCircle },
    { id: "scan", title: t("tool_scan"), desc: t("tool_scan_desc"), Icon: ScanLine },
    { id: "termo", title: t("tool_termo"), desc: t("tool_termo_desc"), Icon: Thermometer },
    { id: "acqua", title: lang === "de" ? "Wasser-Temperatur" : lang === "en" ? "Water temperature" : "Temperatura Acqua", desc: "", Icon: Droplets },
    { id: "ph", title: lang === "de" ? "pH-Tracker" : lang === "en" ? "pH Tracker" : "Tracker pH Lievito", desc: "", Icon: FlaskConical },
    { id: "capo", title: t("tool_capo"), desc: t("tool_capo_desc"), Icon: ClipboardList },
  ];
  const toolById = Object.fromEntries(TOOLS.map((x) => [x.id, x]));

  const STEPS = [
    { icon: Cog, title: tri("Parco Macchine", "Maschinenpark", "Machines"), sub: tri("Impastatrici, forni, celle e giacenze", "Kneter, Öfen, Gärzellen und Bestände", "Mixers, ovens, cells & stock"), tools: ["capo", "freezer"] },
    { icon: BookOpen, title: tri("Ricette Personali", "Eigene Rezepte", "Your Recipes"), sub: tri("Inserisci o scansiona le tue ricette e adatta il forno con l'IA", "Rezepte erfassen/scannen und Ofen mit KI anpassen", "Add or scan recipes and adapt the oven with AI"), tools: ["aggiungi", "scan", "adatta"] },
    { icon: CalendarDays, title: tri("Pianificazione", "Planung", "Planning"), sub: tri("Produzione giornaliera e settimanale, tempi a ritroso", "Tages- und Wochenproduktion, Rückwärtsplanung", "Daily & weekly production, backward timing"), tools: ["lavoro", "settimana", "inversa"] },
    { icon: Thermometer, title: tri("Termostato & Sensori", "Thermostat & Sensoren", "Thermostat & Sensors"), sub: tri("Temperatura/umidità Bluetooth, pH e acqua d'impasto", "Temperatur/Feuchte via Bluetooth, pH und Teigwasser", "Bluetooth temp/humidity, pH and dough water"), tools: ["termo", "acqua", "ph"] },
    { icon: LayoutDashboard, title: tri("Dashboard IA & HACCP", "KI-Dashboard & HACCP", "AI Dashboard & HACCP"), sub: tri("Fabbisogno e lista spesa, piano pulizia HACCP e turni", "Bedarf & Einkaufsliste, HACCP-Reinigungsplan und Schichten", "Needs & shopping list, HACCP cleaning plan and shifts"), tools: ["spesa", "check", "turni"] },
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
            heroTitle={t("personal_hero_title")} heroSubtitle={t("personal_hero_sub")} emptyText={t("personal_empty")} />
        )}
        {tool === "scan" && <ScanRecipe />}
        {tool === "capo" && <CapoLaboratorio />}
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
      </div>
    );
  }

  return (
    <div className="pb-4">
      <MikiAvatar label="Michele" subtitle={t("maestro_title")} className="mb-4" />
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
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#5E8B7E]">{tri("Passo", "Schritt", "Step")} {step + 1}/5</p>
            <h2 className="font-display text-xl font-bold text-[#2B303B] dark:text-[#EAF0EC] leading-tight">{current.title}</h2>
            <p className="text-xs text-[#7E8A93] leading-snug mt-0.5">{current.sub}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
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
          <span data-testid="maestro-done" className="flex items-center gap-1 px-5 py-2.5 rounded-2xl bg-[#6B8E62] text-white font-semibold">
            <CheckSquare className="w-5 h-5" /> {tri("Completo", "Fertig", "Done")}
          </span>
        )}
      </div>
    </div>
  );
}
