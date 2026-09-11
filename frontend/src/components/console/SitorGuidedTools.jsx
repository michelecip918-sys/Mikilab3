import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Sparkles, ChevronDown, PlayCircle } from "lucide-react";
import { playTTS } from "@/lib/tts";
import SmartAttach from "@/components/console/SmartAttach";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const KEY = "mikilab_integrations";
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
const save = (o) => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch { /* */ } };

// Sitor guida il Capo con domande sì/no per attivare strumenti/integrazioni,
// senza obbligarlo a leggere un elenco. Include l'elenco completo (opzionale) e demo guidati.
export default function SitorGuidedTools() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [enabled, setEnabled] = useState(load);
  const [idx, setIdx] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [demo, setDemo] = useState(null);
  const [machineText, setMachineText] = useState("");

  const Q = [
    { id: "silos", q: tri("Vuoi collegare i silos della farina per il controllo scorte automatico?", "Mehl-Silos für automatische Bestandskontrolle verbinden?", "Connect flour silos for automatic stock control?", "¿Conectar silos de harina?", "Connecter les silos de farine ?", "اتصال سیلوهای آرد؟"),
      demo: tri("Sitor legge il peso dei silos e ti avvisa quando la farina scende sotto soglia, ordinando in automatico.", "Sitor liest das Silo-Gewicht und warnt bei niedrigem Bestand.", "Sitor reads silo weight and alerts you when flour runs low, auto-ordering.", "Sitor lee el peso y avisa.", "Sitor lit le poids et alerte.", "سیتور وزن را می‌خواند و هشدار می‌دهد.") },
    { id: "scale", q: tri("Vuoi usare le bilance intelligenti per la pesatura guidata degli impasti?", "Intelligente Waagen für geführtes Wiegen?", "Use smart scales for guided dough weighing?", "¿Usar básculas inteligentes?", "Utiliser des balances connectées ?", "استفاده از ترازوی هوشمند؟"),
      demo: tri("Ogni ingrediente viene pesato con un semaforo verde/rosso: zero errori di dosaggio.", "Jede Zutat mit Ampel gewogen.", "Each ingredient weighed with a green/red light: zero dosing errors.", "Cada ingrediente con semáforo.", "Chaque ingrédient avec feu vert/rouge.", "هر ماده با چراغ سبز/قرمز.") },
    { id: "sensors", q: tri("Vuoi attivare i sensori di temperatura di celle e forni?", "Temperatursensoren für Zellen und Öfen aktivieren?", "Enable temperature sensors for cells and ovens?", "¿Activar sensores de temperatura?", "Activer les capteurs de température ?", "فعال‌سازی سنسور دما؟"),
      demo: tri("Sitor sorveglia le temperature e corregge lievitazione e cottura in tempo reale.", "Sitor überwacht Temperaturen live.", "Sitor watches temperatures and adjusts proofing and baking in real time.", "Sitor vigila temperaturas.", "Sitor surveille les températures.", "سیتور دما را کنترل می‌کند.") },
    { id: "email", q: tri("Vuoi che Sitor gestisca gli ordini in arrivo via email?", "Soll Sitor E-Mail-Bestellungen verwalten?", "Should Sitor handle incoming email orders?", "¿Sitor gestiona pedidos por email?", "Sitor gère les commandes par e-mail ?", "سیتور سفارش‌های ایمیل را مدیریت کند؟"),
      demo: tri("Gli ordini email vengono smistati e trasformati in produzione, senza copiare a mano.", "E-Mail-Bestellungen werden automatisch verarbeitet.", "Email orders are sorted and turned into production, no manual copying.", "Los pedidos se procesan solos.", "Les commandes e-mail sont traitées.", "سفارش‌های ایمیل خودکار پردازش می‌شوند.") },
  ];

  const cur = Q[idx];
  const answer = (yes) => {
    const next = { ...enabled, [cur.id]: yes };
    setEnabled(next); save(next);
    if (yes) { try { playTTS(cur.demo, { lang, voice: "nexus" }); } catch { /* */ } }
    if (idx < Q.length - 1) setIdx(idx + 1);
  };

  return (
    <div data-testid="sitor-guided-tools" className="space-y-3">
      {/* Aggiungi una macchina/strumento: scrivi, allega il PDF del venditore o fotografala */}
      <div data-testid="add-machine" className="rounded-2xl border border-[#9aa6b2]/40 bg-[#0b0f19] p-4">
        <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#9aa6b2] mb-2"><Sparkles className="w-3.5 h-3.5" /> {tri("Aggiungi una macchina o strumento", "Maschine/Werkzeug hinzufügen", "Add a machine or tool", "Añadir máquina o herramienta", "Ajouter une machine/outil", "افزودن دستگاه یا ابزار")}</p>
        <textarea data-testid="add-machine-text" value={machineText} onChange={(e) => setMachineText(e.target.value)} rows={2}
          placeholder={tri("Scrivi la macchina… oppure allega il PDF del venditore o fotografala: Sitor capisce e compila.", "Schreibe die Maschine… oder hänge das PDF an.", "Type the machine… or attach the vendor PDF or photograph it: Sitor understands and fills in.", "Escribe la máquina… o adjunta el PDF.", "Écris la machine… ou joins le PDF.", "دستگاه را بنویس… یا PDF را پیوست کن.")}
          className="w-full bg-[#0C1019] border border-[#9aa6b2]/25 rounded-lg px-3 py-2 text-sm text-white focus:border-[#9aa6b2] outline-none resize-none mb-2" />
        <SmartAttach context={tri("scheda macchina/attrezzatura nuova (nome, marca, specifiche, manutenzione)", "neue Maschine (Name, Marke, Spezifikationen)", "new machine/equipment sheet (name, brand, specs, maintenance)", "ficha de máquina nueva", "fiche machine neuve", "مشخصات دستگاه جدید")}
          onExtract={(t) => setMachineText((m) => (m ? m + "\n" : "") + t)} />
      </div>

      {/* Domanda guidata sì/no corrente */}
      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/8 p-4">
        <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-amber-400 mb-2"><Sparkles className="w-3.5 h-3.5" /> Sitor · {tri("Domanda", "Frage", "Question", "Pregunta", "Question", "پرسش")} {idx + 1}/{Q.length}</p>
        <AnimatePresence mode="wait">
          <motion.p key={cur.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} data-testid="sitor-guided-q" className="text-[14px] text-white font-semibold leading-snug mb-3">{cur.q}</motion.p>
        </AnimatePresence>
        <div className="flex items-center gap-2">
          <button data-testid="sitor-guided-yes" onClick={() => answer(true)} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-500 text-[#04070d] font-black text-sm active:scale-95"><Check className="w-4 h-4" /> {tri("Sì, attiva", "Ja", "Yes, enable", "Sí", "Oui", "بله")}</button>
          <button data-testid="sitor-guided-no" onClick={() => answer(false)} className="flex-1 py-2.5 rounded-xl bg-[#030712] border border-[#1e293b] text-[#94A3B8] font-bold text-sm active:scale-95">{tri("No, salta", "Nein", "No, skip", "No", "Non", "نه")}</button>
        </div>
        <button data-testid="sitor-guided-demo" onClick={() => setDemo(cur)} className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400/80 hover:text-amber-400"><PlayCircle className="w-3.5 h-3.5" /> {tri("Mostrami come funziona", "Zeig mir wie", "Show me how it works", "Muéstrame cómo", "Montre-moi", "نشانم بده")}</button>
      </div>

      {/* Riepilogo attivazioni */}
      <div className="flex flex-wrap gap-1.5">
        {Q.map((x) => enabled[x.id] !== undefined && (
          <span key={x.id} data-testid={`sitor-int-${x.id}`} className={`text-[10px] font-bold px-2 py-1 rounded-full border ${enabled[x.id] ? "bg-[#6e9e85]/12 border-[#6e9e85]/40 text-[#6e9e85]" : "bg-[#030712] border-[#1e293b] text-[#64748B]"}`}>
            {enabled[x.id] ? "✓" : "✕"} {x.id}
          </span>
        ))}
      </div>

      {/* Elenco completo opzionale — cosa sa fare Sitor */}
      <button data-testid="sitor-caps-toggle" onClick={() => setShowAll((v) => !v)} className="w-full flex items-center justify-between rounded-xl bg-[#0C1019] border border-[#1e293b] px-3 py-2.5 text-left active:scale-[0.99]">
        <span className="text-[12px] font-bold text-[#cbd5e1]">{tri("Cosa sa fare Sitor (elenco completo)", "Was Sitor kann (Liste)", "What Sitor can do (full list)", "Qué sabe hacer Sitor", "Ce que Sitor sait faire", "توانایی‌های سیتور")}</span>
        <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform ${showAll ? "rotate-180" : ""}`} />
      </button>
      {showAll && (
        <ul data-testid="sitor-caps-list" className="space-y-1.5 text-[12px] text-[#94A3B8] pl-1">
          {[
            tri("Genera il piano di produzione e più opzioni tra cui scegliere", "Erstellt Produktionsplan", "Generates the production plan and options", "Genera el plan", "Génère le plan", "برنامه تولید می‌سازد"),
            tri("Coordina la squadra e comunica i compiti nei dettagli", "Koordiniert das Team", "Coordinates the team and communicates tasks", "Coordina el equipo", "Coordonne l'équipe", "تیم را هماهنگ می‌کند"),
            tri("Controlla silos, scorte e magazzino, e ordina in automatico", "Überwacht Silos und Lager", "Watches silos, stock and warehouse, auto-orders", "Controla silos y stock", "Surveille silos et stock", "سیلو و انبار را کنترل می‌کند"),
            tri("Sorveglia temperature e corregge lievitazione e cottura", "Überwacht Temperaturen", "Watches temperatures, adjusts proofing/baking", "Vigila temperaturas", "Surveille les températures", "دما را کنترل می‌کند"),
            tri("Smista gli ordini email e li trasforma in produzione", "Verwaltet E-Mail-Bestellungen", "Sorts email orders into production", "Gestiona pedidos email", "Gère les commandes e-mail", "سفارش‌های ایمیل را مدیریت می‌کند"),
            tri("Analizza foto del prodotto e dà consigli in tempo reale", "Analysiert Produktfotos", "Analyzes product photos, gives live advice", "Analiza fotos", "Analyse les photos", "عکس محصول را تحلیل می‌کند"),
          ].map((c, i) => <li key={i} className="flex items-start gap-2"><Sparkles className="w-3 h-3 text-amber-400 mt-1 shrink-0" /> {c}</li>)}
        </ul>
      )}

      {/* Modale demo */}
      {demo && (
        <div data-testid="sitor-demo-modal" className="fixed inset-0 z-[80] bg-[#04070d]/95 backdrop-blur-md flex items-center justify-center p-5" onClick={() => setDemo(null)}>
          <div className="max-w-sm w-full rounded-2xl border border-amber-500/50 bg-[#0b0f19] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-black uppercase tracking-wide text-amber-400">Sitor · Demo</p>
              <button data-testid="sitor-demo-close" onClick={() => setDemo(null)} className="w-8 h-8 rounded-full bg-[#030712] border border-[#1e293b] text-[#94A3B8] flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-white leading-relaxed">{demo.demo}</p>
            <button data-testid="sitor-demo-enable" onClick={() => { answer(true); setDemo(null); }} className="mt-4 w-full py-2.5 rounded-xl bg-amber-500 text-[#04070d] font-black text-sm active:scale-95">{tri("Attivalo per me", "Aktivieren", "Enable it for me", "Actívalo", "Active-le", "فعالش کن")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
