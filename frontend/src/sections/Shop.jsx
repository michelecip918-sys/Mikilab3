import { useState, useEffect } from "react";
import { FlaskConical, Microscope, Wheat, Droplets, Gauge, Layers, TestTube2, Plus, Trash2, ClipboardList, BookOpen, GraduationCap, Camera, Loader2, Sparkles } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { API } from "@/lib/api";
import DualPhotoButtons from "@/components/DualPhotoButtons";
import { toast } from "sonner";
import AvatarBubbles from "@/components/AvatarBubbles";

const PUB = process.env.PUBLIC_URL || "";
const LAB_PHOTO = `${PUB}/michele-lab-pro.jpg`;

// Parametri tecnici di analisi farina, orientati agli impasti.
function useFlourParams(tri) {
  return [
    { id: "forza", Icon: Gauge, label: tri("Forza (W)", "Stärke (W)", "Strength (W)", "Fuerza (W)"),
      body: tri("Misura la forza della farina. W180–260 per pane comune; W280–350 per grandi lievitati e panettone.",
        "Misst die Mehlstärke. W180–260 für normales Brot; W280–350 für große Hefeteige und Panettone.",
        "Measures flour strength. W180–260 for common bread; W280–350 for large leavened cakes and panettone.",
        "Mide la fuerza de la harina. W180–260 para pan común; W280–350 para grandes fermentados y panettone.") },
    { id: "proteine", Icon: Layers, label: tri("Proteine / Glutine", "Protein / Gluten", "Protein / Gluten", "Proteína / Gluten"),
      body: tri("Più proteine = maglia glutinica più tenace. 11–13% per il pane, 13–15% per il panettone.",
        "Mehr Protein = zäheres Glutennetz. 11–13% für Brot, 13–15% für Panettone.",
        "More protein = stronger gluten network. 11–13% for bread, 13–15% for panettone.",
        "Más proteína = red de gluten más tenaz. 11–13% para pan, 13–15% para panettone.") },
    { id: "assorbimento", Icon: Droplets, label: tri("Assorbimento (Idratazione)", "Wasseraufnahme (Hydratation)", "Absorption (Hydration)", "Absorción (Hidratación)"),
      body: tri("Quanta acqua regge l'impasto. Le farine forti assorbono di più: 65–85% secondo forza e tipo.",
        "Wie viel Wasser der Teig aufnimmt. Starke Mehle mehr: 65–85% je nach Stärke und Typ.",
        "How much water the dough holds. Strong flours absorb more: 65–85% by strength and type.",
        "Cuánta agua retiene la masa. Las harinas fuertes absorben más: 65–85% según fuerza y tipo.") },
    { id: "pl", Icon: Wheat, label: tri("Rapporto P/L", "Verhältnis P/L", "P/L Ratio", "Relación P/L"),
      body: tri("Equilibrio tra tenacità ed estensibilità. ~0,5–0,6 ideale per il pane; più basso = più estensibile.",
        "Balance zwischen Zähigkeit und Dehnbarkeit. ~0,5–0,6 ideal für Brot; niedriger = dehnbarer.",
        "Balance between tenacity and extensibility. ~0.5–0.6 ideal for bread; lower = more extensible.",
        "Equilibrio entre tenacidad y extensibilidad. ~0,5–0,6 ideal para pan; más bajo = más extensible.") },
    { id: "ceneri", Icon: TestTube2, label: tri("Ceneri / Tipo", "Asche / Typ", "Ash / Type", "Cenizas / Tipo"),
      body: tri("Tipo 00 · 0 · 1 · 2 · integrale (DE: 405/550/1050). Più ceneri = più crusca, minerali e sapore.",
        "Typ 00 · 0 · 1 · 2 · Vollkorn (DE: 405/550/1050). Mehr Asche = mehr Kleie, Mineralien und Geschmack.",
        "Type 00 · 0 · 1 · 2 · wholemeal (DE: 405/550/1050). More ash = more bran, minerals and flavour.",
        "Tipo 00 · 0 · 1 · 2 · integral (DE: 405/550/1050). Más cenizas = más salvado, minerales y sabor.") },
    { id: "falling", Icon: FlaskConical, label: tri("Falling Number", "Fallzahl", "Falling Number", "Falling Number"),
      body: tri("Attività enzimatica (amilasi). 250–300 s è ottimale; valori bassi = impasto colloso e mollica umida.",
        "Enzymaktivität (Amylase). 250–300 s ist optimal; niedrige Werte = klebriger Teig, feuchte Krume.",
        "Enzyme activity (amylase). 250–300 s is optimal; low values = sticky dough, gummy crumb.",
        "Actividad enzimática (amilasa). 250–300 s es óptimo; valores bajos = masa pegajosa, miga húmeda.") },
  ];
}

const TESTS_KEY = "mikilab_flour_tests";

function TestRegistry() {
  const { lang, tri } = useLang();
  const { user, setAuthOpen } = useAuth();
  const [tests, setTests] = useState([]);
  const [form, setForm] = useState({ name: "", w: "", protein: "", hydration: "", note: "" });
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    try { setTests(JSON.parse(localStorage.getItem(TESTS_KEY) || "[]")); } catch { /* */ }
  }, []);

  const persist = (list) => {
    setTests(list);
    try { localStorage.setItem(TESTS_KEY, JSON.stringify(list)); } catch { /* */ }
  };

  const add = () => {
    if (!form.name.trim()) return;
    const entry = { id: Date.now(), ...form, date: new Date().toISOString() };
    persist([entry, ...tests]);
    setForm({ name: "", w: "", protein: "", hydration: "", note: "" });
  };

  const remove = (id) => persist(tests.filter((t) => t.id !== id));

  // Fotografa il sacco: l'IA legge W/proteine/tipo/assorbimento e compila il form.
  const onScanPhoto = (file) => {
    if (!file) return;
    setScanning(true);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        const max = 1400; let w = img.width, h = img.height;
        if (w > h && w > max) { h = Math.round(h * max / w); w = max; }
        else if (h > max) { w = Math.round(w * max / h); h = max; }
        const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
        cv.getContext("2d").drawImage(img, 0, 0, w, h);
        const b64 = cv.toDataURL("image/jpeg", 0.85);
        try {
          const res = await fetch(`${API}/maestro/scan-flour`, {
            method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
            body: JSON.stringify({ image_base64: b64, lang }),
          });
          if (res.status === 401 || res.status === 403) {
            setAuthOpen && setAuthOpen(true);
            toast.info(tri("Accedi per usare l'analisi IA della farina.", "Melde dich an, um die KI-Mehlanalyse zu nutzen.", "Sign in to use AI flour analysis.", "Inicia sesión para usar el análisis IA de harina."));
            return;
          }
          if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || ""); }
          const r = await res.json();
          setForm({
            name: r.product_name || r.brand || r.flour_type || "",
            w: r.w_index != null ? String(r.w_index) : "",
            protein: r.protein_percent != null ? String(r.protein_percent) : "",
            hydration: r.absorption_percent != null ? String(r.absorption_percent) : "",
            note: [r.flour_type, r.grain, r.ideal_use].filter(Boolean).join(" · "),
          });
          toast.success(tri("Etichetta letta! Controlla e registra il test.", "Etikett gelesen! Prüfen und speichern.", "Label read! Review and save the test.", "¡Etiqueta leída! Revisa y guarda."));
        } catch (err) {
          toast.error(err?.message || tri("Non sono riuscito a leggere l'etichetta.", "Etikett konnte nicht gelesen werden.", "Couldn't read the label.", "No pude leer la etiqueta."));
        } finally { setScanning(false); }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const field = (key, ph, type = "text") => (
    <input
      data-testid={`flour-test-${key}`}
      type={type}
      value={form[key]}
      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      placeholder={ph}
      className="w-full rounded-xl bg-[#14212C] border border-[#2A3B49]/40 px-3 py-2 text-sm text-[#F7F9FC] placeholder-[#64748B] focus:border-[#5E8CA8] focus:outline-none"
    />
  );

  return (
    <div data-testid="flour-test-registry" className="lab-3d-card rounded-3xl p-6 bg-[#14212C]/85 border border-[#2A3B49]/60 backdrop-blur-md shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-11 h-11 rounded-2xl bg-[#5E8CA8]/15 border border-[#5E8CA8]/40 flex items-center justify-center shrink-0">
          <ClipboardList className="w-6 h-6 text-[#5E8CA8]" />
        </span>
        <div>
          <h3 className="font-display text-xl font-bold text-[#F7F9FC]">{tri("Registro Test Farine", "Mehl-Testregister", "Flour Test Log", "Registro de Pruebas de Harina")}</h3>
          <p className="text-[12px] text-[#94A3B8]">{tri("Fotografa il sacco o annota a mano", "Fotografiere den Sack oder notiere", "Photograph the bag or note by hand", "Fotografía el saco o anota a mano")}</p>
        </div>
      </div>

      {/* Analisi IA della foto del sacco */}
      <div data-testid="flour-scan-block" className="mb-4 rounded-2xl bg-[#14212C] border border-[#5E8CA8]/30 p-4">
        <div className="flex items-center gap-2 mb-2 text-[#5E8CA8]">
          <Sparkles className="w-4 h-4" />
          <p className="text-[12px] font-bold uppercase tracking-wide">{tri("Analisi IA della farina", "KI-Mehlanalyse", "AI flour analysis", "Análisis IA de harina")}</p>
        </div>
        <p className="text-[12px] text-[#94A3B8] leading-snug mb-3">{tri("Fotografa l'etichetta o la scheda tecnica: leggo forza W, proteine, tipo e assorbimento e compilo il test.", "Fotografiere Etikett/Datenblatt: ich lese W, Protein, Typ und Wasseraufnahme und fülle den Test aus.", "Photograph the label or tech sheet: I read W, protein, type and absorption and fill in the test.", "Fotografía la etiqueta o ficha: leo W, proteína, tipo y absorción y relleno la prueba.")}</p>
        {scanning ? (
          <div data-testid="flour-scan-loading" className="inline-flex items-center gap-2 rounded-2xl bg-[#5E8CA8] text-[#14212C] font-semibold px-5 py-3 opacity-80">
            <Loader2 className="w-5 h-5 animate-spin" /> {tri("Sto leggendo l'etichetta…", "Ich lese das Etikett…", "Reading the label…", "Leyendo la etiqueta…")}
          </div>
        ) : (
          <DualPhotoButtons onFile={onScanPhoto} testid="flour-scan" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div className="col-span-2">{field("name", tri("Nome farina / mulino", "Mehl / Mühle", "Flour / mill", "Harina / molino"))}</div>
        {field("w", "W (es. 300)", "number")}
        {field("protein", tri("Proteine %", "Protein %", "Protein %", "Proteína %"), "number")}
        {field("hydration", tri("Idratazione %", "Hydratation %", "Hydration %", "Hidratación %"), "number")}
        <div className="col-span-2 sm:col-span-1">{field("note", tri("Nota impasto", "Teignotiz", "Dough note", "Nota de masa"))}</div>
      </div>

      <button
        data-testid="flour-test-add"
        onClick={add}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#5E8CA8] to-[#3E9C93] text-white font-semibold py-2.5 shadow-lg active:scale-98 transition-all"
      >
        <Plus className="w-5 h-5" /> {tri("Registra test", "Test speichern", "Save test", "Guardar prueba")}
      </button>

      <div className="mt-4 space-y-2.5" data-testid="flour-test-list">
        {tests.length === 0 && (
          <p className="text-center text-[13px] text-[#64748B] py-4">{tri("Nessun test registrato. Inizia la tua ricerca!", "Noch kein Test. Starte deine Forschung!", "No tests yet. Start your research!", "Sin pruebas aún. ¡Empieza tu investigación!")}</p>
        )}
        {tests.map((tst) => (
          <div key={tst.id} data-testid={`flour-test-row-${tst.id}`} className="flex items-start gap-3 rounded-2xl bg-[#14212C] border border-[#2A3B49]/40 p-3.5">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[#F7F9FC] text-sm truncate">{tst.name}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-[#5E8CA8] font-medium mt-0.5">
                {tst.w && <span>W {tst.w}</span>}
                {tst.protein && <span>{tst.protein}% prot.</span>}
                {tst.hydration && <span>{tst.hydration}% H₂O</span>}
              </div>
              {tst.note && <p className="text-[12px] text-[#94A3B8] mt-1 leading-snug">{tst.note}</p>}
            </div>
            <button data-testid={`flour-test-del-${tst.id}`} onClick={() => remove(tst.id)} className="shrink-0 text-[#64748B] hover:text-[#3E9C93] transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Centro Formule e Reparto Analisi Farine — sezione a tema laboratorio, orientata agli impasti.
export default function Shop({ onNavigate }) {
  const { tri } = useLang();
  const params = useFlourParams(tri);

  return (
    <div data-testid="shop-page" className="pb-4 space-y-6">
      {/* Hero */}
      <div className="rounded-3xl bg-gradient-to-br from-[#3a2410] to-[#14212C] text-white p-7 text-center shadow-xl border border-[#2A3B49]/50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, #5E8CA8 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
        <Microscope className="w-12 h-12 mx-auto mb-2 text-[#5E8CA8]" />
        <h1 className="font-display text-3xl font-bold">{tri("Centro Formule e Analisi Farine", "Formel- und Mehlanalysezentrum", "Formula & Flour Analysis Center", "Centro de Fórmulas y Análisis de Harinas")}</h1>
        <p className="text-white/80 text-sm mt-2 max-w-md mx-auto">
          {tri("Ricerca tecnologica per impasti ad alta precisione: forza, assorbimento e parametri chimici reali della farina.",
            "Technologische Forschung für Präzisionsteige: Stärke, Wasseraufnahme und echte chemische Mehlparameter.",
            "Technological research for high-precision doughs: strength, absorption and real chemical flour parameters.",
            "Investigación tecnológica para masas de alta precisión: fuerza, absorción y parámetros químicos reales de la harina.")}
        </p>
      </div>

      <AvatarBubbles variant="shop" />

      {/* Manifesto del Laboratorio */}
      <div data-testid="lab-manifesto" className="p-6 rounded-3xl border border-[#2A3B49]/60 bg-[#14212C]/85 backdrop-blur-md shadow-xl text-[#F7F9FC]">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <img
            src={LAB_PHOTO}
            onError={(e) => { e.currentTarget.src = `${PUB}/michele-real-lab.jpg`; }}
            className="w-32 h-32 md:w-44 md:h-44 object-cover rounded-2xl shadow-lg border border-[#5E8CA8]/40 flex-shrink-0"
            alt={tri("Reparto Analisi Impasti", "Teiganalyse-Abteilung", "Dough Analysis Department", "Departamento de Análisis de Masas")}
          />
          <div>
            <h2 className="text-2xl font-bold mb-3 text-[#5E8CA8] flex items-center gap-3">
              <FlaskConical className="w-6 h-6" /> {tri("Reparto Analisi e Controllo Farine", "Abteilung für Mehlanalyse und -kontrolle", "Flour Analysis & Control Department", "Departamento de Análisis y Control de Harinas")}
            </h2>
            <p className="text-[#E2E8F0] mb-3 leading-relaxed text-sm">
              {tri("Uniamo l'arte della panificazione al rigore dei test di laboratorio per analizzare forza, assorbimento e comportamento reale di ogni farina prima di portarla nell'impasto.",
                "Wir verbinden die Kunst des Backens mit der Strenge von Labortests, um Stärke, Wasseraufnahme und echtes Verhalten jedes Mehls vor dem Teig zu analysieren.",
                "We blend the art of baking with the rigour of lab testing to analyse strength, absorption and the real behaviour of every flour before it reaches the dough.",
                "Unimos el arte de la panificación con el rigor de las pruebas de laboratorio para analizar fuerza, absorción y el comportamiento real de cada harina antes de llevarla a la masa.")}
            </p>
            <div className="text-xs text-[#5E8CA8] font-semibold tracking-wide uppercase">
              {tri("Diretto da Michele • Ricerca sul campo, senza filtri commerciali", "Geleitet von Michele • Feldforschung, ohne kommerzielle Filter", "Directed by Michele • Field research, no commercial filters", "Dirigido por Michele • Investigación de campo, sin filtros comerciales")}
            </div>
          </div>
        </div>
      </div>

      {/* Parametri di analisi farina */}
      <div>
        <h2 className="font-display text-xl font-bold text-[#F7F9FC] mb-3 px-1">{tri("Parametri di analisi", "Analyseparameter", "Analysis parameters", "Parámetros de análisis")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {params.map((p) => (
            <div key={p.id} data-testid={`flour-param-${p.id}`} className="lab-3d-card rounded-2xl p-5 bg-[#14212C] border border-[#2A3B49]/50 shadow-sm flex gap-3">
              <span className="w-11 h-11 rounded-2xl bg-[#5E8CA8]/15 border border-[#5E8CA8]/40 flex items-center justify-center shrink-0">
                <p.Icon className="w-6 h-6 text-[#5E8CA8]" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-base font-bold text-[#F7F9FC]">{p.label}</p>
                <p className="text-[12.5px] text-[#94A3B8] leading-snug mt-0.5">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Registro Test */}
      <TestRegistry />

      {/* Scorciatoie alle formule */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button data-testid="shop-go-recipes" onClick={() => onNavigate && onNavigate("ricette")}
          className="lab-3d-card text-left rounded-2xl p-5 bg-[#14212C] border border-[#2A3B49]/50 shadow-sm active:scale-98 transition-all flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#5E8CA8]/15 border border-[#5E8CA8]/40 flex items-center justify-center shrink-0"><BookOpen className="w-6 h-6 text-[#5E8CA8]" /></div>
          <div className="min-w-0">
            <p className="font-display text-base font-bold text-[#F7F9FC]">{tri("Le Formule (Ricette)", "Die Formeln (Rezepte)", "The Formulas (Recipes)", "Las Fórmulas (Recetas)")}</p>
            <p className="text-[12px] text-[#94A3B8] leading-snug">{tri("Ricettario completo con percentuali sul peso farina", "Komplettes Rezeptbuch mit Bäckerprozenten", "Full recipe book with baker's percentages", "Recetario completo con porcentajes de panadero")}</p>
          </div>
        </button>
        <button data-testid="shop-go-academy" onClick={() => onNavigate && onNavigate("impara")}
          className="lab-3d-card text-left rounded-2xl p-5 bg-[#14212C] border border-[#2A3B49]/50 shadow-sm active:scale-98 transition-all flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#5E8CA8]/15 border border-[#5E8CA8]/40 flex items-center justify-center shrink-0"><GraduationCap className="w-6 h-6 text-[#5E8CA8]" /></div>
          <div className="min-w-0">
            <p className="font-display text-base font-bold text-[#F7F9FC]">{tri("Accademia & Metodi", "Akademie & Methoden", "Academy & Methods", "Academia y Métodos")}</p>
            <p className="text-[12px] text-[#94A3B8] leading-snug">{tri("Lezioni e guide per interpretare le analisi", "Lektionen und Guides zur Analyse-Interpretation", "Lessons and guides to interpret the analyses", "Lecciones y guías para interpretar los análisis")}</p>
          </div>
        </button>
      </div>
    </div>
  );
}
