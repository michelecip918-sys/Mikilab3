import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Cpu, Languages, Layers, ScanLine, Snowflake, Radio, ShieldCheck, Gauge, WifiOff } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Vetrina autonoma delle capacità chiave di MikiLab (direttiva v12 · punto 10).
// Le voci si generano da una tabella di capacità e vengono mostrate con animazione a cascata.
const CAPS = [
  { icon: Layers, tag: "modules", color: "#5E8CA8",
    t: (l) => mkTri(l)("3 Reparti Disaccoppiati", "3 entkoppelte Bereiche", "3 Decoupled Departments", "3 departamentos separados", "3 rayons découplés", "۳ بخش مجزا"),
    b: (l) => mkTri(l)("Panificazione, Pizzeria e Pasticceria con ricette, ingredienti e magazzino dedicati.", "Bäckerei, Pizzeria und Konditorei mit eigenen Rezepten, Zutaten und Lager.", "Bakery, Pizzeria and Pastry with dedicated recipes, ingredients and warehouse.", "Panadería, pizzería y pastelería con recetas, ingredientes y almacén propios.", "Boulangerie, pizzeria et pâtisserie avec recettes, ingrédients et stock dédiés.", "نانوایی، پیتزا و قنادی با دستور، مواد و انبار اختصاصی.") },
  { icon: Languages, tag: "i18n", color: "#3E9C93",
    t: (l) => mkTri(l)("Traduzione Globale", "Globale Übersetzung", "Global Translation", "Traducción global", "Traduction globale", "ترجمه جهانی"),
    b: (l) => mkTri(l)("UI, ricette e audio BakoMix in 6 lingue, per una squadra internazionale.", "UI, Rezepte und BakoMix-Audio in 6 Sprachen für ein internationales Team.", "UI, recipes and BakoMix audio in 6 languages for an international team.", "UI, recetas y audio BakoMix en 6 idiomas para un equipo internacional.", "UI, recettes et audio BakoMix en 6 langues pour une équipe internationale.", "رابط، دستورها و صدای باکومیکس در ۶ زبان.") },
  { icon: Cpu, tag: "ai", color: "#5E8CA8",
    t: (l) => mkTri(l)("Core BakoMix AI", "BakoMix-KI-Kern", "BakoMix AI Core", "Núcleo BakoMix IA", "Cœur BakoMix IA", "هسته هوش باکومیکس"),
    b: (l) => mkTri(l)("Regista proattivo: rigenera piani, ribilancia lotti e detta la produzione a voce.", "Proaktiver Regisseur: erstellt Pläne neu, verteilt Chargen und diktiert die Produktion.", "Proactive director: regenerates plans, rebalances batches and dictates production by voice.", "Director proactivo: regenera planes, reequilibra lotes y dicta la producción.", "Réalisateur proactif : régénère les plans, rééquilibre les lots et dicte la production.", "کارگردان فعال: بازسازی برنامه، توازن دسته‌ها و دیکته تولید.") },
  { icon: ScanLine, tag: "vision", color: "#06b6d4",
    t: (l) => mkTri(l)("Vision AR Checkpoint", "Vision-AR-Checkpoint", "Vision AR Checkpoint", "Punto AR de visión", "Checkpoint Vision AR", "بازرسی بینایی AR"),
    b: (l) => mkTri(l)("La fotocamera legge attrezzature, scorte e pulizia e valida sul posto.", "Die Kamera liest Geräte, Bestand und Reinigung und validiert vor Ort.", "The camera reads equipment, stock and cleaning and validates on the spot.", "La cámara lee equipos, stock y limpieza y valida en el sitio.", "La caméra lit l'équipement, le stock et le nettoyage et valide sur place.", "دوربین تجهیزات، موجودی و نظافت را می‌خواند و تأیید می‌کند.") },
  { icon: Gauge, tag: "scale", color: "#f59e0b",
    t: (l) => mkTri(l)("SmartScale Letz_Passive", "SmartScale Letz_Passive", "SmartScale Letz_Passive", "SmartScale Letz_Passive", "SmartScale Letz_Passive", "SmartScale Letz_Passive"),
    b: (l) => mkTri(l)("Bilancia guidata via Bluetooth/WebSocket, senza interruzioni sul floor.", "Geführte Waage über Bluetooth/WebSocket, ohne Unterbrechungen im Floor.", "Guided scale over Bluetooth/WebSocket, zero interruptions on the floor.", "Báscula guiada por Bluetooth/WebSocket, sin interrupciones.", "Balance guidée en Bluetooth/WebSocket, sans interruption.", "ترازوی راهنما با بلوتوث/وب‌سوکت، بدون وقفه.") },
  { icon: Snowflake, tag: "cold", color: "#38bdf8",
    t: (l) => mkTri(l)("Catena del Freddo", "Kühlkette", "Cold Chain", "Cadena de frío", "Chaîne du froid", "زنجیره سرد"),
    b: (l) => mkTri(l)("Celle, abbattitori e soglie freezer con avviso automatico via email.", "Zellen, Schockfroster und Gefrierschwellen mit automatischer E-Mail-Warnung.", "Cells, blast chillers and freezer thresholds with automatic email alerts.", "Cámaras, abatidores y umbrales de congelador con aviso por email.", "Chambres, cellules de refroidissement et seuils congélateur avec alerte e-mail.", "سردخانه، شوک سرد و آستانه فریزر با هشدار ایمیلی.") },
  { icon: Radio, tag: "voice", color: "#00F0FF",
    t: (l) => mkTri(l)("Delega Vocale Eclipse", "Sprachdelegation Eclipse", "Eclipse Voice Delegation", "Delegación por voz Eclipse", "Délégation vocale Eclipse", "واگذاری صوتی اکلیپس"),
    b: (l) => mkTri(l)("Il Capo detta gli ordini; il floor resta silenzioso (Letz_Passive) e guidato dai task.", "Der Chef diktiert Aufträge; der Floor bleibt still (Letz_Passive) und aufgabengeführt.", "The Capo dictates orders; the floor stays silent (Letz_Passive), task-driven.", "El Capo dicta pedidos; el floor queda en silencio (Letz_Passive).", "Le Capo dicte les ordres ; le floor reste silencieux (Letz_Passive).", "کاپو سفارش می‌دهد؛ فلور ساکت (Letz_Passive) و وظیفه‌محور می‌ماند.") },
  { icon: WifiOff, tag: "pwa", color: "#22c55e",
    t: (l) => mkTri(l)("PWA Bunker Offline", "PWA-Bunker offline", "Offline Bunker PWA", "PWA búnker sin conexión", "PWA bunker hors ligne", "PWA بانکر آفلاین"),
    b: (l) => mkTri(l)("Service Worker + IndexedDB: il laboratorio funziona anche senza internet, sull'intranet.", "Service Worker + IndexedDB: das Labor läuft auch ohne Internet im Intranet.", "Service Worker + IndexedDB: the lab runs even without internet, on the intranet.", "Service Worker + IndexedDB: el laboratorio funciona sin internet, en la intranet.", "Service Worker + IndexedDB : le labo fonctionne sans internet, sur l'intranet.", "سرویس‌ورکر + IndexedDB: آزمایشگاه بدون اینترنت هم کار می‌کند.") },
  { icon: ShieldCheck, tag: "pin", color: "#14b8a6",
    t: (l) => mkTri(l)("Zero-State Sovrano", "Souveräner Zero-State", "Sovereign Zero-State", "Zero-State soberano", "Zero-State souverain", "زیرو-استیت حاکم"),
    b: (l) => mkTri(l)("Ogni login PIN apre una postazione pulita; gli schemi master nel DB restano intatti.", "Jeder PIN-Login öffnet eine saubere Station; die Master-Schemata im DB bleiben erhalten.", "Every PIN login opens a clean station; master schemas in the DB stay intact.", "Cada login PIN abre un puesto limpio; los esquemas maestros permanecen.", "Chaque login PIN ouvre un poste propre ; les schémas maîtres restent intacts.", "هر ورود با PIN یک ایستگاه تمیز باز می‌کند؛ طرح‌های اصلی حفظ می‌شوند.") },
];

export default function CoreShowcase() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const caps = useMemo(() => CAPS, []);

  return (
    <div data-testid="core-showcase" className="space-y-3">
      <div className="flex items-center gap-2 p-4 rounded-2xl bg-gradient-to-r from-[#14b8a6]/10 to-transparent border border-[#14b8a6]/30">
        <Sparkles className="w-5 h-5 text-[#14b8a6]" />
        <div>
          <h3 className="text-sm font-extrabold text-[#14b8a6]">{tri("Cosa fa MikiLab · Capacità chiave", "Was MikiLab kann · Kernfunktionen", "What MikiLab does · Core capabilities", "Qué hace MikiLab · Capacidades clave", "Ce que fait MikiLab · Capacités clés", "توانمندی‌های کلیدی میکی‌لب")}</h3>
          <p className="text-[11px] text-[#94A3B8]">{tri("Vetrina autonoma generata dal sistema.", "Automatisch vom System erzeugte Vitrine.", "Autonomous showcase generated by the system.", "Vitrina autónoma generada por el sistema.", "Vitrine autonome générée par le système.", "ویترین خودکار ساخته‌شده توسط سیستم.")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {caps.map((c, k) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.tag}
              data-testid={`showcase-${c.tag}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: k * 0.06, duration: 0.35 }}
              className="rounded-2xl bg-[#0b0f19] border border-[#1e293b] p-4 hover:border-[#14b8a6]/50 transition-all group"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${c.color}22`, border: `1px solid ${c.color}55` }}>
                  <Icon className="w-4.5 h-4.5" style={{ color: c.color }} />
                </span>
                <h4 className="text-sm font-bold text-white group-hover:text-[#14b8a6] transition-colors">{c.t(lang)}</h4>
              </div>
              <p className="text-[12px] text-[#94A3B8] leading-relaxed">{c.b(lang)}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
