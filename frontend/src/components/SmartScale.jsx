import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, ChevronLeft, Check, RotateCcw, Play, Pause, Droplets, Loader2, Wifi, WifiOff, Bluetooth } from "lucide-react";
import { toast } from "sonner";
import { recipesApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const API = process.env.REACT_APP_BACKEND_URL;
const TOL = 0.02; // ±2% tolleranza di pesata (bilancia reale)

// Costruisce la sequenza di pesata (Letz_Passive: lo schermo guida la mano, zero suoni).
function buildSteps(recipe, factor, tri, ingName) {
  if (!recipe) return [];
  const f = Number(recipe.flour_grams || 0) * factor;
  const w = Number(recipe.water_grams || 0) * factor;
  const s = Number(recipe.sourdough_grams || 0) * factor;
  const salt = Number(recipe.salt_grams || 0) * factor;
  const flourBase = Number(recipe.flour_grams || 0) * factor;
  const steps = [];
  if (f > 0) steps.push({ key: "flour", name: tri("Farina", "Mehl", "Flour", "Harina", "Farine", "آرد"), target: Math.round(f), color: "#e0b877" });
  if (w > 0) steps.push({ key: "water", name: tri("Acqua", "Wasser", "Water", "Agua", "Eau", "آب"), target: Math.round(w), color: "#5E8CA8" });
  if (s > 0) steps.push({ key: "sd", name: tri("Lievito madre", "Sauerteig", "Sourdough", "Masa madre", "Levain", "خمیرمایه"), target: Math.round(s), color: "#3E9C93" });
  if (salt > 0) steps.push({ key: "salt", name: tri("Sale", "Salz", "Salt", "Sal", "Sel", "نمک"), target: Math.round(salt), color: "#94A3B8" });
  (recipe.extra_ingredients || []).forEach((ing, i) => {
    const g = Math.round(flourBase * (Number(ing.percent || 0) / 100));
    if (g > 0) steps.push({ key: `ex${i}`, name: ingName(ing), target: g, color: "#c084fc" });
  });
  return steps;
}

export default function SmartScale({ onExit }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const ingName = useCallback((ing) => ing[`name_${lang}`] || ing.name, [lang]);

  const [recipes, setRecipes] = useState(null);
  const [recipe, setRecipe] = useState(null);
  const [batches, setBatches] = useState(1);
  const [phase, setPhase] = useState("pick"); // pick | weigh | done
  const [stepIdx, setStepIdx] = useState(0);
  const [weight, setWeight] = useState(0);
  const [pouring, setPouring] = useState(false);
  const [reached, setReached] = useState(false);
  const [wsUp, setWsUp] = useState(false);
  const [bleOn, setBleOn] = useState(false);

  const wsRef = useRef(null);
  const pourRef = useRef(false);
  const weightRef = useRef(0);
  const advanceRef = useRef(null);
  const onReachedRef = useRef(() => {});
  const bleRef = useRef(false);
  useEffect(() => { weightRef.current = weight; }, [weight]);
  useEffect(() => { pourRef.current = pouring; }, [pouring]);
  useEffect(() => { bleRef.current = bleOn; }, [bleOn]);

  useEffect(() => {
    recipesApi.list("mikilab").then((r) => setRecipes(Array.isArray(r) ? r : [])).catch(() => setRecipes([]));
  }, []);

  const factor = Math.max(1, Number(batches) || 1);
  const steps = useMemo(() => buildSteps(recipe, factor, tri, ingName), [recipe, factor, lang]); // eslint-disable-line
  const step = steps[stepIdx] || null;
  const target = step ? step.target : 0;
  const pct = target > 0 ? Math.min(100, Math.round((weight / target) * 100)) : 0;
  const over = target > 0 && weight > target * (1 + TOL);

  // --- WebSocket verso il Production OS (letz_passive silenzioso) ---
  const openWs = useCallback(() => {
    try {
      const url = API.replace(/^http/, "ws") + "/api/ws/production-os";
      const ws = new WebSocket(url);
      ws.onopen = () => setWsUp(true);
      ws.onclose = () => setWsUp(false);
      ws.onerror = () => setWsUp(false);
      ws.onmessage = (ev) => {
        try {
          const d = JSON.parse(ev.data);
          if (d.status === "success" && d.next_action_unlocked) onReachedRef.current();
        } catch { /* */ }
      };
      wsRef.current = ws;
    } catch { setWsUp(false); }
  }, []); // eslint-disable-line

  const sendWeight = useCallback((cur, tgt) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === 1) {
      try { ws.send(JSON.stringify({ action: "scale_weight_streaming", weight: cur, target: tgt })); return true; } catch { /* */ }
    }
    return false;
  }, []);

  const onReached = useCallback(() => {
    if (advanceRef.current) return; // già in transizione
    setReached(true);
    setPouring(false); pourRef.current = false;
    // Letz_Passive: nessun beep — conferma SOLO visiva, poi tara e avanza in automatico.
    advanceRef.current = setTimeout(() => {
      advanceRef.current = null;
      setStepIdx((i) => {
        const ni = i + 1;
        if (ni >= steps.length) { setPhase("done"); return i; }
        setWeight(0); weightRef.current = 0; setReached(false);
        setTimeout(() => { setPouring(true); pourRef.current = true; }, 250);
        return ni;
      });
    }, 1100);
  }, [steps.length]);

  useEffect(() => { onReachedRef.current = onReached; }, [onReached]);

  // Bilancia reale via Web Bluetooth (servizio standard Weight Scale 0x181D).
  const connectBle = useCallback(async () => {
    if (!navigator.bluetooth) {
      toast.error(tri("Web Bluetooth non supportato (usa Chrome/Android)", "Web Bluetooth nicht unterstützt", "Web Bluetooth not supported (use Chrome/Android)", "Web Bluetooth no soportado", "Web Bluetooth non supporté", "وب‌بلوتوث پشتیبانی نمی‌شود"));
      return;
    }
    try {
      const dev = await navigator.bluetooth.requestDevice({ filters: [{ services: ["weight_scale"] }], optionalServices: ["weight_scale"] });
      const server = await dev.gatt.connect();
      const svc = await server.getPrimaryService("weight_scale");
      const ch = await svc.getCharacteristic("weight_measurement");
      await ch.startNotifications();
      ch.addEventListener("characteristicvaluechanged", (e) => {
        const dv = e.target.value; const flags = dv.getUint8(0); const raw = dv.getUint16(1, true);
        const grams = (flags & 0x01) ? raw * 453.592 / 200 : raw * 5; // lb vs SI (0.005 kg)
        const g = Math.max(0, Math.round(grams));
        weightRef.current = g; setWeight(g);
        const tgt = weightRef._t || 0;
        sendWeight(g, tgt);
        if (!wsRef.current || wsRef.current.readyState !== 1) { if (tgt && g >= tgt * (1 - TOL)) onReachedRef.current(); }
      });
      dev.addEventListener("gattserverdisconnected", () => { setBleOn(false); });
      setBleOn(true);
      toast.success(tri("Bilancia Bluetooth collegata", "Bluetooth-Waage verbunden", "Bluetooth scale connected", "Báscula Bluetooth conectada", "Balance Bluetooth connectée", "ترازوی بلوتوث وصل شد"));
    } catch {
      toast.error(tri("Connessione annullata o fallita", "Verbindung fehlgeschlagen", "Connection cancelled/failed", "Conexión cancelada/fallida", "Connexion annulée/échouée", "اتصال لغو یا ناموفق شد"));
    }
  }, [tri, sendWeight]);

  // mantiene il target corrente accessibile al listener BLE
  useEffect(() => { weightRef._t = target; }, [target]);

  // Simulatore realistico: il peso "sale" verso il target come una bilancia vera (ease-out + rumore).
  useEffect(() => {
    if (phase !== "weigh") return;
    const iv = setInterval(() => {
      if (bleRef.current) return; // bilancia reale collegata → guida il device
      if (!pourRef.current || !target) return;
      const cur = weightRef.current;
      if (cur >= target * (1 - TOL)) {
        // atterra dolcemente dentro tolleranza
        const landed = Math.min(target, cur + Math.max(0.4, (target - cur) * 0.3));
        weightRef.current = landed; setWeight(Number(landed.toFixed(1)));
        if (!sendWeight(landed, target)) { if (landed >= target * (1 - TOL)) onReached(); }
        else if (landed >= target) { /* attende risposta WS; fallback locale */ if (!wsRef.current || wsRef.current.readyState !== 1) onReached(); }
        return;
      }
      const remaining = target - cur;
      const inc = Math.max(2, remaining * (0.06 + Math.random() * 0.05)); // versamento che rallenta
      const next = Math.min(target, cur + inc);
      weightRef.current = next; setWeight(Number(next.toFixed(1)));
      sendWeight(next, target);
    }, 130);
    return () => clearInterval(iv);
  }, [phase, target, sendWeight, onReached]);

  useEffect(() => () => {
    try { if (wsRef.current) wsRef.current.close(); } catch { /* */ }
    if (advanceRef.current) clearTimeout(advanceRef.current);
  }, []);

  const startWeigh = () => {
    if (!recipe || !steps.length) return;
    openWs();
    setPhase("weigh"); setStepIdx(0); setWeight(0); weightRef.current = 0; setReached(false);
    setTimeout(() => { setPouring(true); pourRef.current = true; }, 400);
  };

  const tare = () => { setWeight(0); weightRef.current = 0; setReached(false); };

  const exitWeigh = () => {
    try { if (wsRef.current) wsRef.current.close(); } catch { /* */ }
    if (advanceRef.current) { clearTimeout(advanceRef.current); advanceRef.current = null; }
    setPhase("pick"); setRecipe(null); setStepIdx(0); setWeight(0); setPouring(false); setReached(false);
  };

  // ====== SCELTA RICETTA ======
  if (phase === "pick") {
    return (
      <div data-testid="smart-scale" className="space-y-4">
        <button data-testid="scale-back" onClick={onExit} className="inline-flex items-center gap-1 text-xs font-bold text-[#94A3B8] hover:text-white">
          <ChevronLeft className="w-4 h-4" /> {tri("Postazione", "Station", "Station", "Puesto", "Poste", "پست")}
        </button>
        <div className="rounded-2xl bg-[#0b0f19] border border-[#2A3B49] p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 rounded-xl bg-[#3E9C93]/15 border border-[#3E9C93]/40 flex items-center justify-center">
              <Scale className="w-6 h-6 text-[#3E9C93]" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">{tri("Bilancia Guidata", "Geführte Waage", "Guided Scale", "Báscula Guiada", "Balance Guidée", "ترازوی راهنما")}</h3>
              <p className="text-[11px] text-[#7E8A93]">{tri("Ti guido nella pesata in silenzio, ingrediente per ingrediente.", "Ich führe dich still durch die Einwaage, Zutat für Zutat.", "I guide you through weighing silently, ingredient by ingredient.", "Te guío en el pesaje en silencio, ingrediente a ingrediente.", "Je te guide pour la pesée en silence, ingrédient par ingrédient.", "بی‌صدا در وزن‌کشی راهنمایی‌ات می‌کنم.")}</p>
            </div>
          </div>

          <label className="mt-4 block text-[11px] font-black uppercase tracking-widest text-[#7E8A93]">{tri("Ricetta", "Rezept", "Recipe", "Receta", "Recette", "دستور")}</label>
          {recipes === null ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-[#7E8A93]"><Loader2 className="w-4 h-4 animate-spin" /> {tri("Carico…", "Lade…", "Loading…", "Cargando…", "Chargement…", "بارگذاری…")}</div>
          ) : (
            <select
              data-testid="scale-recipe-select"
              value={recipe?.id || ""}
              onChange={(e) => setRecipe(recipes.find((r) => r.id === e.target.value) || null)}
              className="mt-1 w-full bg-[#030712] border border-[#2A3B49] rounded-xl p-3 text-sm text-white outline-none focus:border-[#3E9C93]"
            >
              <option value="">{tri("Scegli una ricetta…", "Rezept wählen…", "Choose a recipe…", "Elige una receta…", "Choisis une recette…", "یک دستور انتخاب کن…")}</option>
              {recipes.map((r) => (
                <option key={r.id} value={r.id}>{r[`name_${lang}`] || r.name}</option>
              ))}
            </select>
          )}

          <label className="mt-4 block text-[11px] font-black uppercase tracking-widest text-[#7E8A93]">{tri("Numero di impasti", "Anzahl Teige", "Number of batches", "Número de masas", "Nombre de pâtes", "تعداد خمیر")}</label>
          <div className="mt-1 flex items-center gap-2">
            <button data-testid="scale-batch-minus" onClick={() => setBatches((b) => Math.max(1, b - 1))} className="w-11 h-11 rounded-xl bg-[#030712] border border-[#2A3B49] text-white text-xl font-black active:scale-95">−</button>
            <div data-testid="scale-batch-value" className="flex-1 text-center font-mono-data text-2xl font-black text-white bg-[#030712] border border-[#2A3B49] rounded-xl py-1.5">{factor}×</div>
            <button data-testid="scale-batch-plus" onClick={() => setBatches((b) => b + 1)} className="w-11 h-11 rounded-xl bg-[#030712] border border-[#2A3B49] text-white text-xl font-black active:scale-95">+</button>
          </div>

          {recipe && steps.length > 0 && (
            <div data-testid="scale-preview-list" className="mt-4 space-y-1.5">
              {steps.map((s, i) => (
                <div key={s.key} className="flex items-center justify-between text-sm bg-[#030712] border border-[#1e293b] rounded-xl px-3 py-2">
                  <span className="text-[#AEB8BF] flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: s.color }} />{i + 1}. {s.name}</span>
                  <span className="font-mono-data font-bold text-white">{s.target} g</span>
                </div>
              ))}
            </div>
          )}

          <button
            data-testid="scale-start-btn"
            onClick={startWeigh}
            disabled={!recipe || !steps.length}
            className="mt-5 w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#3E9C93] to-[#2f7d75] text-white font-black text-sm shadow-lg shadow-[#3E9C93]/20 disabled:opacity-40 active:scale-98 transition-all"
          >
            {tri("Avvia pesata guidata", "Einwaage starten", "Start guided weighing", "Iniciar pesaje guiado", "Démarrer la pesée guidée", "شروع وزن‌کشی راهنما")}
          </button>

          <button
            data-testid="scale-ble-btn"
            onClick={connectBle}
            className={`mt-2 w-full py-3 rounded-2xl inline-flex items-center justify-center gap-2 font-bold text-sm border active:scale-98 transition-all ${bleOn ? "bg-[#5E8CA8]/15 border-[#5E8CA8] text-[#8FB0C2]" : "bg-[#030712] border-[#2A3B49] text-[#94A3B8]"}`}
          >
            <Bluetooth className="w-4 h-4" /> {bleOn ? tri("Bilancia reale collegata", "Echte Waage verbunden", "Real scale connected", "Báscula real conectada", "Balance réelle connectée", "ترازوی واقعی وصل شد") : tri("Collega bilancia Bluetooth", "Bluetooth-Waage verbinden", "Connect Bluetooth scale", "Conectar báscula Bluetooth", "Connecter balance Bluetooth", "اتصال ترازوی بلوتوث")}
          </button>
          <p className="mt-1 text-center text-[10px] text-[#64748B]">{bleOn ? tri("Il peso arriva dalla bilancia fisica.", "Gewicht kommt von der echten Waage.", "Weight comes from the physical scale.", "El peso viene de la báscula física.", "Le poids vient de la balance physique.", "وزن از ترازوی فیزیکی می‌آید.") : tri("Senza bilancia: simulatore realistico integrato.", "Ohne Waage: integrierter Simulator.", "No scale: built-in realistic simulator.", "Sin báscula: simulador integrado.", "Sans balance : simulateur intégré.", "بدون ترازو: شبیه‌ساز داخلی.")}</p>
        </div>
      </div>
    );
  }

  // ====== COMPLETATO ======
  if (phase === "done") {
    return (
      <div data-testid="scale-complete" className="flex flex-col items-center justify-center py-10 text-center space-y-5">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-24 h-24 rounded-full bg-emerald-500/15 border-2 border-emerald-500 flex items-center justify-center">
          <Check className="w-12 h-12 text-emerald-400" />
        </motion.div>
        <div>
          <h3 className="text-xl font-black text-emerald-300">{tri("Pesata completata", "Einwaage fertig", "Weighing complete", "Pesaje completado", "Pesée terminée", "وزن‌کشی کامل شد")}</h3>
          <p className="mt-1 text-sm text-[#94A3B8]">{recipe?.[`name_${lang}`] || recipe?.name} · {factor}×</p>
        </div>
        <div className="flex gap-2">
          <button data-testid="scale-restart" onClick={exitWeigh} className="px-5 py-3 rounded-xl bg-[#0b0f19] border border-[#2A3B49] text-white text-sm font-bold active:scale-95">{tri("Nuova pesata", "Neue Einwaage", "New weighing", "Nuevo pesaje", "Nouvelle pesée", "وزن‌کشی جدید")}</button>
          <button data-testid="scale-exit" onClick={onExit} className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#3E9C93] to-[#2f7d75] text-white text-sm font-black active:scale-95">{tri("Torna alla postazione", "Zur Station", "Back to station", "Volver al puesto", "Retour au poste", "بازگشت به پست")}</button>
        </div>
      </div>
    );
  }

  // ====== PESATA (LETZ_PASSIVE) ======
  const ringColor = over ? "#f59e0b" : reached ? "#10b981" : (step?.color || "#3E9C93");
  const R = 92, C = 2 * Math.PI * R;
  return (
    <div data-testid="scale-weigh" className="space-y-4">
      <div className="flex items-center justify-between">
        <button data-testid="scale-exit-weigh" onClick={exitWeigh} className="inline-flex items-center gap-1 text-xs font-bold text-[#94A3B8] hover:text-white">
          <ChevronLeft className="w-4 h-4" /> {tri("Esci", "Verlassen", "Exit", "Salir", "Quitter", "خروج")}
        </button>
        <span data-testid="scale-ws-status" className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${wsUp ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10" : "text-amber-400 border-amber-500/40 bg-amber-500/10"}`}>
          {wsUp ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {wsUp ? tri("Bilancia live", "Waage live", "Scale live", "Báscula en vivo", "Balance live", "ترازو زنده") : tri("Locale", "Lokal", "Local", "Local", "Local", "محلی")}
        </span>
      </div>

      {/* Passo corrente */}
      <div className="text-center">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#7E8A93]">
          {tri(`Ingrediente ${stepIdx + 1} / ${steps.length}`, `Zutat ${stepIdx + 1} / ${steps.length}`, `Ingredient ${stepIdx + 1} / ${steps.length}`, `Ingrediente ${stepIdx + 1} / ${steps.length}`, `Ingrédient ${stepIdx + 1} / ${steps.length}`, `ماده ${stepIdx + 1} / ${steps.length}`)}
        </span>
        <h3 data-testid="scale-step-name" className="mt-1 text-2xl font-black text-white">{step?.name}</h3>
      </div>

      {/* Anello + peso live */}
      <div className="relative flex items-center justify-center py-2" data-testid="scale-ring">
        <svg width="220" height="220" viewBox="0 0 220 220" className="-rotate-90">
          <circle cx="110" cy="110" r={R} fill="none" stroke="#1e293b" strokeWidth="14" />
          <motion.circle
            cx="110" cy="110" r={R} fill="none" stroke={ringColor} strokeWidth="14" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C - (Math.min(100, pct) / 100) * C}
            animate={{ strokeDashoffset: C - (Math.min(100, pct) / 100) * C, stroke: ringColor }}
            transition={{ duration: 0.15 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {reached && !over ? (
              <motion.div key="ok" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}>
                <Check className="w-16 h-16 text-emerald-400" />
              </motion.div>
            ) : (
              <motion.div key="num" className="text-center">
                <div data-testid="scale-weight-display" className="font-mono-data text-5xl font-black tabular-nums" style={{ color: ringColor }}>
                  {Math.round(weight)}
                </div>
                <div className="text-xs font-bold text-[#7E8A93] mt-0.5">/ {target} g</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Istruzione visiva (Letz_Passive: niente suoni) */}
      <div
        data-testid="scale-instruction"
        className={`text-center rounded-2xl border px-4 py-3 text-sm font-bold transition-colors ${
          over ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
          : reached ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
          : "border-[#2A3B49] bg-[#0b0f19] text-white"
        }`}
      >
        {over
          ? tri("Troppo — togli un po'", "Zu viel — nimm etwas weg", "Too much — remove a bit", "Demasiado — quita un poco", "Trop — enlève un peu", "زیاد است — کمی بردار")
          : reached
          ? tri("Perfetto ✓ — passo successivo", "Perfekt ✓ — nächster Schritt", "Perfect ✓ — next step", "Perfecto ✓ — siguiente paso", "Parfait ✓ — étape suivante", "عالی ✓ — گام بعدی")
          : tri(`Versa ${step?.name.toLowerCase()} fino a ${target} g`, `Gib ${step?.name} bis ${target} g dazu`, `Pour ${step?.name.toLowerCase()} up to ${target} g`, `Añade ${step?.name.toLowerCase()} hasta ${target} g`, `Verse ${step?.name.toLowerCase()} jusqu'à ${target} g`, `${step?.name} را تا ${target} گرم بریز`)}
      </div>

      {/* Comandi (facoltativi: la bilancia guida da sola) */}
      <div className="grid grid-cols-2 gap-2">
        {bleOn ? (
          <div data-testid="scale-ble-live" className="inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#5E8CA8]/15 border border-[#5E8CA8]/50 text-[#8FB0C2] font-bold text-sm">
            <Bluetooth className="w-4 h-4" /> {tri("Bilancia reale", "Echte Waage", "Real scale", "Báscula real", "Balance réelle", "ترازوی واقعی")}
          </div>
        ) : (
          <button
            data-testid="scale-pour-toggle"
            onClick={() => setPouring((p) => !p)}
            disabled={reached}
            className="inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#030712] border border-[#2A3B49] text-white font-bold text-sm disabled:opacity-40 active:scale-95 transition-all"
          >
            {pouring ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {pouring ? tri("Pausa", "Pause", "Pause", "Pausa", "Pause", "مکث") : tri("Versa", "Gießen", "Pour", "Verter", "Verser", "بریز")}
          </button>
        )}
        <button
          data-testid="scale-tare"
          onClick={tare}
          className="inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#030712] border border-[#2A3B49] text-white font-bold text-sm active:scale-95 transition-all"
        >
          <RotateCcw className="w-4 h-4" /> {tri("Tara", "Tara", "Tare", "Tara", "Tare", "صفر")}
        </button>
      </div>

      {/* Riepilogo passi */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {steps.map((s, i) => (
          <span key={s.key} className={`h-1.5 rounded-full transition-all ${i < stepIdx ? "w-4 bg-emerald-500" : i === stepIdx ? "w-8 bg-[#3E9C93]" : "w-4 bg-[#1e293b]"}`} />
        ))}
      </div>
      <p className="text-center text-[10px] text-[#64748B] flex items-center justify-center gap-1">
        <Droplets className="w-3 h-3" /> {tri("Modalità silenziosa — nessun suono, solo lo schermo ti guida.", "Stiller Modus — kein Ton, nur der Bildschirm führt dich.", "Silent mode — no sound, only the screen guides you.", "Modo silencioso — sin sonido, solo la pantalla te guía.", "Mode silencieux — aucun son, seul l'écran te guide.", "حالت بی‌صدا — بدون صدا، فقط صفحه راهنمایی‌ات می‌کند.")}
      </p>
    </div>
  );
}
