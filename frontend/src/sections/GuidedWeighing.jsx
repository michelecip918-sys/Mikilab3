import { useState, useEffect, useRef, useCallback } from "react";
import { Scale, Bluetooth, Volume2, VolumeX, AlertTriangle, ArrowRight, Plus, Trash2, Layers, Droplet, Wheat, Euro, RotateCcw, Thermometer, Save, CheckCircle2, QrCode } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { doughSessionsApi } from "@/lib/api";
import { speak as speakMale } from "@/lib/voice";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";

// FASE 1 — Pesata Guidata & Bilancia Smart (semaforo, voce, riscalamento, multi-impastata,
//          Web Bluetooth 0x181D con fallback manuale/simulatore).
// FASE 3 — Ruoli ingrediente (Farina/Acqua/Altro) + prezzo €/kg → riepilogo finale con
//          idratazione REALE, food cost reale e rilevamento aggiunte extra sulla bilancia.

const uid = () => Math.random().toString(36).slice(2, 8);
const guessRole = (name = "") => {
  const n = name.toLowerCase();
  if (/farina|flour|mehl|semola|integrale/.test(n)) return "flour";
  if (/acqua|water|wasser|latte|milk|milch/.test(n)) return "water";
  return "other";
};
const DEFAULT = [
  { id: uid(), name: "Farina", base: 1000, role: "flour", price: 0 },
  { id: uid(), name: "Acqua", base: 650, role: "water", price: 0 },
  { id: uid(), name: "Lievito madre", base: 200, role: "other", price: 0 },
  { id: uid(), name: "Sale", base: 20, role: "other", price: 0 },
];

export default function GuidedWeighing() {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const { user, setAuthOpen } = useAuth();

  const [ingredients, setIngredients] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("mikilab_gw_ing"));
      if (Array.isArray(saved) && saved.length) return saved.map((x) => ({ role: guessRole(x.name), price: 0, ...x }));
    } catch { /* */ }
    return DEFAULT;
  });
  const [factor, setFactor] = useState(1);
  const [capacity, setCapacity] = useState(() => Number(localStorage.getItem("mikilab_gw_cap")) || 0);
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [batch, setBatch] = useState(0);
  const [weight, setWeight] = useState(0);
  const [voiceOn, setVoiceOn] = useState(true);
  const [bleOn, setBleOn] = useState(false);
  const [summary, setSummary] = useState(null);
  const [sessOpen, setSessOpen] = useState(false);
  const [sess, setSess] = useState({ recipe_name: "", target_temp_c: "", dough_temp_c: "", room_temp_c: "", water_temp_c: "" });
  const [sessSaved, setSessSaved] = useState(false);
  const [sessSaving, setSessSaving] = useState(false);
  const stableRef = useRef(null);
  const logRef = useRef([]);

  useEffect(() => { localStorage.setItem("mikilab_gw_ing", JSON.stringify(ingredients)); }, [ingredients]);
  useEffect(() => { localStorage.setItem("mikilab_gw_cap", String(capacity)); }, [capacity]);

  // --- riscalamento + multi-impastata ---
  const totalG = ingredients.reduce((a, x) => a + x.base * factor, 0);
  const batches = capacity > 0 && totalG / 1000 > capacity ? Math.ceil((totalG / 1000) / capacity) : 1;
  const batchFactor = factor / batches;
  const target = (ing) => Math.round(ing.base * batchFactor);

  const setTotalKg = (kg) => { const base = ingredients.reduce((a, x) => a + x.base, 0); if (base > 0 && kg > 0) setFactor((kg * 1000) / base); };

  // --- feedback cromatico ---
  const cur = ingredients[idx];
  const tgt = cur ? target(cur) : 0;
  const pct = tgt > 0 ? (weight / tgt) * 100 : 0;
  const state = !cur ? "done" : pct > 101 ? "over" : pct >= 99 ? "ok" : pct >= 95 ? "near" : "under";
  const COLORS = { under: "#E0A458", near: "#E0A458", ok: "#ff6b00", over: "#ff6b00", done: "#ff6b00" };

  // --- audio bip ---
  const beep = useCallback(() => {
    try {
      const C = window.AudioContext || window.webkitAudioContext; const ctx = new C();
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = 1200; o.connect(g).connect(ctx.destination); g.gain.setValueAtTime(0.4, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25); o.start(); o.stop(ctx.currentTime + 0.25);
    } catch { /* */ }
  }, []);
  const speak = useCallback((txt) => {
    if (!voiceOn) return;
    speakMale(txt, lang);  // voce maschile gratuita + pulizia simboli
  }, [voiceOn, lang]);

  useEffect(() => {
    if (started && cur) speak(tri(`Versa ${tgt} grammi di ${cur.name}`, `Gib ${tgt} Gramm ${cur.name} dazu`, `Pour ${tgt} grams of ${cur.name}`));
  }, [idx, batch, started]); // eslint-disable-line react-hooks/exhaustive-deps

  const finishWeighing = useCallback(() => {
    const rows = logRef.current;
    const byRole = { flour: 0, water: 0, other: 0 };
    let cost = 0;
    rows.forEach((r) => {
      byRole[r.role] = (byRole[r.role] || 0) + r.grams;
      const ing = ingredients.find((i) => i.id === r.id);
      if (ing && ing.price) cost += (r.grams / 1000) * ing.price;
    });
    const realHyd = byRole.flour > 0 ? (byRole.water / byRole.flour) * 100 : 0;
    const totalReal = rows.reduce((a, r) => a + r.grams, 0);
    const plannedFlour = ingredients.filter((i) => i.role === "flour").reduce((a, i) => a + i.base * factor, 0);
    const plannedWater = ingredients.filter((i) => i.role === "water").reduce((a, i) => a + i.base * factor, 0);
    const plannedHyd = plannedFlour > 0 ? (plannedWater / plannedFlour) * 100 : 0;
    const extras = rows.map((r) => {
      const ing = ingredients.find((i) => i.id === r.id);
      const planned = ing ? Math.round(ing.base * batchFactor) * batches : 0;
      return { ...r, planned, diff: r.grams - planned };
    }).filter((r) => Math.abs(r.diff) >= Math.max(3, r.planned * 0.03));
    setSummary({ rows, byRole, realHyd, plannedHyd, totalReal, cost, extras });
    setStarted(false);
    // Feature: voce riepilogo — legge idratazione reale e costo a fine pesata
    const hydTxt = realHyd > 0 ? tri(`Idratazione reale ${realHyd.toFixed(0)} percento`, `Reale Hydration ${realHyd.toFixed(0)} Prozent`, `Real hydration ${realHyd.toFixed(0)} percent`) : "";
    const costTxt = cost > 0 ? tri(`, costo ${cost.toFixed(2)} euro`, `, Kosten ${cost.toFixed(2)} Euro`, `, cost ${cost.toFixed(2)} euro`) : "";
    speak(tri("Pesata completata. ", "Wiegen abgeschlossen. ", "Weighing complete. ") + hydTxt + costTxt);
    toast.success(tri("Pesata completata! 🎉", "Fertig! 🎉", "Done! 🎉"));
  }, [ingredients, factor, batchFactor, batches]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = useCallback(() => {
    if (cur) logRef.current = [...logRef.current, { id: cur.id, name: cur.name, role: cur.role || guessRole(cur.name), grams: weight }];
    if (idx < ingredients.length - 1) { setIdx((i) => i + 1); setWeight(0); }
    else if (batch < batches - 1) { setBatch((b) => b + 1); setIdx(0); setWeight(0); toast.success(tri(`Impastata ${batch + 2}/${batches}`, `Teig ${batch + 2}/${batches}`, `Batch ${batch + 2}/${batches}`)); }
    else { finishWeighing(); }
  }, [cur, weight, idx, batch, batches, ingredients.length, finishWeighing]); // eslint-disable-line react-hooks/exhaustive-deps

  // auto-avanza dopo 2s di verde stabile
  useEffect(() => {
    if (!started) return;
    if (state === "ok") {
      if (!stableRef.current) { beep(); speak(tri("Perfetto", "Perfekt", "Perfect")); stableRef.current = setTimeout(() => { next(); }, 2000); }
    } else { if (stableRef.current) { clearTimeout(stableRef.current); stableRef.current = null; } }
    return () => { if (stableRef.current && state !== "ok") { clearTimeout(stableRef.current); stableRef.current = null; } };
  }, [state, started, next, beep]);

  // --- Web Bluetooth (Weight Scale 0x181D / char 0x2A9D) ---
  const connectBle = async () => {
    if (!navigator.bluetooth) { toast.error(tri("Web Bluetooth non supportato (usa Chrome/Android)", "Web Bluetooth nicht unterstützt", "Web Bluetooth not supported (use Chrome/Android)")); return; }
    try {
      const dev = await navigator.bluetooth.requestDevice({ filters: [{ services: ["weight_scale"] }], optionalServices: ["weight_scale"] });
      const server = await dev.gatt.connect();
      const svc = await server.getPrimaryService("weight_scale");
      const ch = await svc.getCharacteristic("weight_measurement");
      await ch.startNotifications();
      ch.addEventListener("characteristicvaluechanged", (e) => {
        const dv = e.target.value; const flags = dv.getUint8(0); const raw = dv.getUint16(1, true);
        const grams = (flags & 0x01) ? raw * 453.592 / 200 : raw * 5;
        setWeight(Math.round(grams));
      });
      setBleOn(true); toast.success(tri("Bilancia connessa", "Waage verbunden", "Scale connected"));
      // Guida a mani libere: annuncia che leggerà i pesi in sequenza ad alta voce
      speak(tri(
        "Bilancia connessa. Ti guiderò a voce: leggerò i pesi uno alla volta, tu versa senza toccare lo schermo.",
        "Waage verbunden. Ich leite dich per Stimme: Ich lese die Gewichte nacheinander vor, gib ein, ohne den Bildschirm zu berühren.",
        "Scale connected. I will guide you by voice: I read the weights one at a time, pour without touching the screen."));
    } catch { toast.error(tri("Connessione annullata o fallita", "Verbindung fehlgeschlagen", "Connection cancelled/failed")); }
  };

  const startVoiceCmd = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error(tri("Riconoscimento vocale non supportato", "Spracherkennung nicht unterstützt", "Speech recognition not supported")); return; }
    const r = new SR(); r.lang = mkTri(lang)("it-IT", "de-DE", "en-GB"); r.continuous = false;
    r.onresult = (e) => { const t = e.results[0][0].transcript.toLowerCase(); if (/avanti|prossimo|next|weiter/.test(t) && state !== "over") next(); };
    r.start(); toast.message(tri("Di' 'Avanti'…", "Sag 'Weiter'…", "Say 'Next'…"));
  };

  const reset = () => { setSummary(null); setIdx(0); setBatch(0); setWeight(0); logRef.current = []; setSessOpen(false); setSessSaved(false); setBatchSaved(false); setSess({ recipe_name: "", target_temp_c: "", dough_temp_c: "", room_temp_c: "", water_temp_c: "" }); };
  const startRun = () => { logRef.current = []; setSummary(null); setSessOpen(false); setSessSaved(false); setBatchSaved(false); setStarted(true); setIdx(0); setBatch(0); setWeight(0); };

  const saveAsSession = async () => {
    if (!user) { setAuthOpen(true); return; }
    if (!sess.recipe_name.trim() || sess.dough_temp_c === "") { toast.error(tri("Inserisci nome e temperatura finale impasto", "Name und End-Teigtemperatur angeben", "Enter name and final dough temperature")); return; }
    setSessSaving(true);
    try {
      await doughSessionsApi.create({
        recipe_name: sess.recipe_name.trim(),
        target_temp_c: sess.target_temp_c !== "" ? Number(sess.target_temp_c) : null,
        dough_temp_c: Number(sess.dough_temp_c),
        room_temp_c: sess.room_temp_c !== "" ? Number(sess.room_temp_c) : null,
        water_temp_c: sess.water_temp_c !== "" ? Number(sess.water_temp_c) : null,
        source: "pesata",
        note: summary ? tri(`Idratazione reale ${summary.realHyd.toFixed(1)}%, food cost € ${summary.cost.toFixed(2)}`, `Reale Hydration ${summary.realHyd.toFixed(1)}%, Kosten € ${summary.cost.toFixed(2)}`, `Real hydration ${summary.realHyd.toFixed(1)}%, food cost € ${summary.cost.toFixed(2)}`) : "",
      });
      setSessSaved(true);
      toast.success(tri("Sessione salvata nel Diario Impasti", "Im Teig-Tagebuch gespeichert", "Saved to the Dough Log"));
    } catch { toast.error(tri("Errore nel salvataggio", "Speichern fehlgeschlagen", "Save failed")); }
    setSessSaving(false);
  };

  const [batchSaved, setBatchSaved] = useState(false);
  const createBatch = () => {
    if (!summary) return;
    const d = new Date(); const p = (n) => String(n).padStart(2, "0");
    const code = `LOT-${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    const flourIng = ingredients.find((i) => i.role === "flour");
    const entry = {
      id: Math.random().toString(36).slice(2, 9),
      code,
      product: (sess.recipe_name || tri("Pesata", "Wiegen", "Weighing")).trim(),
      prodDate: new Date().toISOString().slice(0, 10),
      flour: flourIng ? flourIng.name : "",
      flourLot: "",
      qty: `${(summary.totalReal / 1000).toFixed(2)} kg`,
      expiry: "",
      operator: user?.name || "",
      note: tri(`Idratazione reale ${summary.realHyd.toFixed(1)}% · food cost € ${summary.cost.toFixed(2)} · da Pesata Guidata`, `Reale Hydration ${summary.realHyd.toFixed(1)}% · Kosten € ${summary.cost.toFixed(2)} · aus geführtem Wiegen`, `Real hydration ${summary.realHyd.toFixed(1)}% · food cost € ${summary.cost.toFixed(2)} · from Guided Weighing`),
    };
    try {
      const list = JSON.parse(localStorage.getItem("mikilab_batches") || "[]");
      localStorage.setItem("mikilab_batches", JSON.stringify([entry, ...list]));
      setBatchSaved(true);
      toast.success(tri("Lotto creato in Tracciabilità Lotti", "Charge in Rückverfolgung erstellt", "Batch created in Batch Traceability"));
    } catch { toast.error(tri("Errore", "Fehler", "Error")); }
  };

  const inp = "w-full bg-[#121212] dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-2xl shadow-md border border-amber-900/40 px-3 py-2.5 outline-none text-[#2B303B] dark:text-[#e4eff8] focus:border-[#ff6b00]";

  // ---- RUN VIEW ----
  if (started && cur) {
    return (
      <div className="pb-40" data-testid="gw-run">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase text-[#7E8A93]">{tri("Ingrediente", "Zutat", "Ingredient")} {idx + 1}/{ingredients.length}{batches > 1 ? ` · ${tri("Impastata", "Teig", "Batch")} ${batch + 1}/${batches}` : ""}</p>
          <button data-testid="gw-voice-toggle" onClick={() => setVoiceOn((v) => !v)} className="p-2 rounded-lg border border-[#2e2e2e] dark:border-[#2e2e2e] text-[#ff6b00]">{voiceOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}</button>
        </div>
        <div data-testid="gw-panel" className="rounded-3xl p-6 text-center text-white shadow-xl transition-colors" style={{ background: COLORS[state] }}>
          <p className="font-display text-2xl font-bold">{cur.name}</p>
          <p className="text-sm opacity-90 mt-1">{tri("Target", "Ziel", "Target")}: <b>{tgt} g</b></p>
          <p data-testid="gw-weight" className="font-mono-data text-6xl font-extrabold my-3">{weight}<span className="text-2xl"> g</span></p>
          <p data-testid="gw-msg" className="text-sm font-semibold min-h-[20px]">
            {state === "under" && tri("Continua a versare…", "Weiter einfüllen…", "Keep pouring…")}
            {state === "near" && tri("Ci sei quasi…", "Fast geschafft…", "Almost there…")}
            {state === "ok" && tri("Perfetto! Avanzo in 2s…", "Perfekt! Weiter in 2s…", "Perfect! Next in 2s…")}
            {state === "over" && tri(`Hai inserito ${weight - tgt} g in più! Rimuovi l'eccesso per proseguire`, `${weight - tgt} g zu viel! Entferne den Überschuss`, `${weight - tgt} g too much! Remove the excess to continue`)}
          </p>
        </div>

        {!bleOn && (
          <div className="mt-4 space-y-2">
            <input data-testid="gw-manual" type="number" value={weight || ""} onChange={(e) => setWeight(Number(e.target.value) || 0)} placeholder={tri("Peso manuale (g)", "Gewicht manuell (g)", "Manual weight (g)")} className={inp + " font-mono-data text-center"} />
            <input data-testid="gw-sim" type="range" min={0} max={Math.round(tgt * 1.3) || 100} value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="w-full accent-[#ff6b00]" />
            <p className="text-[11px] text-center text-[#7E8A93]">{tri("Simulatore (finché non colleghi la bilancia)", "Simulator (bis die Waage verbunden ist)", "Simulator (until the scale is connected)")}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-4">
          <button data-testid="gw-next" onClick={next} disabled={state === "over" || state === "under"} className="flex items-center justify-center gap-2 bg-[#ff6b00] hover:bg-[#ff8a33] disabled:opacity-40 text-white font-bold py-4 rounded-2xl active:scale-97">{tri("Avanti", "Weiter", "Next")} <ArrowRight className="w-5 h-5" /></button>
          <button data-testid="gw-voicecmd" onClick={startVoiceCmd} className="flex items-center justify-center gap-2 bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] text-[#2B303B] dark:text-[#e4eff8] font-bold py-4 rounded-2xl active:scale-97"><Volume2 className="w-5 h-5 text-[#ff6b00]" /> {tri("Voce", "Sprache", "Voice")}</button>
        </div>
        <button data-testid="gw-stop" onClick={() => { setStarted(false); logRef.current = []; window.speechSynthesis?.cancel(); }} className="w-full mt-2 text-sm text-[#7E8A93]">{tri("Interrompi", "Abbrechen", "Stop")}</button>
      </div>
    );
  }

  // ---- SUMMARY VIEW (Fase 3) ----
  if (summary) {
    return (
      <div className="pb-40" data-testid="gw-summary">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-[#ff6b00] flex items-center justify-center"><Scale className="w-6 h-6 text-white" /></div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Riepilogo Pesata", "Wiege-Zusammenfassung", "Weighing summary")}</h1>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-2xl bg-[#ff6b00]/10 border border-[#ff6b00]/30 p-4">
            <div className="flex items-center gap-2 text-[#ff6b00] text-xs font-bold uppercase"><Droplet className="w-4 h-4" /> {tri("Idratazione reale", "Reale Hydration", "Real hydration")}</div>
            <p data-testid="gw-real-hyd" className="font-mono-data text-3xl font-extrabold text-[#2B303B] dark:text-[#e4eff8] mt-1">{summary.realHyd.toFixed(1)}%</p>
            <p className="text-[11px] text-[#7E8A93]">{tri("Prevista", "Geplant", "Planned")}: {summary.plannedHyd.toFixed(1)}%</p>
          </div>
          <div className="rounded-2xl bg-[#E0A458]/10 border border-[#E0A458]/30 p-4">
            <div className="flex items-center gap-2 text-[#B07A28] text-xs font-bold uppercase"><Euro className="w-4 h-4" /> {tri("Food Cost reale", "Reale Kosten", "Real food cost")}</div>
            <p data-testid="gw-real-cost" className="font-mono-data text-3xl font-extrabold text-[#2B303B] dark:text-[#e4eff8] mt-1">€ {summary.cost.toFixed(2)}</p>
            <p className="text-[11px] text-[#7E8A93]">{(summary.totalReal / 1000).toFixed(2)} kg · € {summary.totalReal > 0 ? (summary.cost / (summary.totalReal / 1000)).toFixed(2) : "0.00"}/kg</p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#ff6b00]/10 border border-[#ff6b00]/30 p-4 mb-4" data-testid="gw-weighed-list">
          <p className="text-xs font-bold uppercase text-[#ff6b00] mb-2">{tri("Pesato realmente", "Tatsächlich gewogen", "Actually weighed")}</p>
          {summary.rows.map((r, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-[#2e2e2e]/50 dark:border-[#2e2e2e]/50 last:border-0">
              <span className="flex items-center gap-1.5 text-[#2B303B] dark:text-[#e4eff8]">
                {r.role === "flour" ? <Wheat className="w-3.5 h-3.5 text-[#B07A28]" /> : r.role === "water" ? <Droplet className="w-3.5 h-3.5 text-[#ff6b00]" /> : <span className="w-3.5" />}
                {r.name}
              </span>
              <span className="font-mono-data font-semibold">{r.grams} g</span>
            </div>
          ))}
        </div>

        {summary.extras.length > 0 && (
          <div className="rounded-2xl bg-[#ff6b00]/10 border border-[#ff6b00]/30 p-4 mb-4" data-testid="gw-extras">
            <div className="flex items-center gap-2 text-[#ff6b00] text-xs font-bold uppercase"><AlertTriangle className="w-4 h-4" /> {tri("Aggiunte extra rilevate", "Extra-Zugaben erkannt", "Extra additions detected")}</div>
            {summary.extras.map((e, i) => (
              <p key={i} className="text-sm text-[#2B303B] dark:text-[#e4eff8] mt-1">
                {e.name}: <b className={e.diff > 0 ? "text-[#ff6b00]" : "text-[#ff6b00]"}>{e.diff > 0 ? "+" : ""}{e.diff} g</b> {tri("rispetto al target", "vs. Ziel", "vs target")} ({e.planned} g)
              </p>
            ))}
            <p className="text-[11px] text-[#7E8A93] mt-2">{tri("Idratazione e food cost sono ricalcolati sui pesi reali.", "Hydration und Kosten wurden auf die realen Gewichte neu berechnet.", "Hydration and food cost are recomputed on the real weights.")}</p>
          </div>
        )}

        {/* Salva come sessione impasto (collegamento Diario Impasti) */}
        <div className="rounded-2xl bg-[#ff6b00]/10 border border-[#ff6b00]/30 p-4 mb-4" data-testid="gw-savesession">
          {sessSaved ? (
            <div className="flex items-center gap-2 text-[#ff6b00] font-semibold text-sm" data-testid="gw-savesession-ok"><CheckCircle2 className="w-5 h-5" /> {tri("Salvata nel Diario Impasti", "Im Teig-Tagebuch gespeichert", "Saved to the Dough Log")}</div>
          ) : !sessOpen ? (
            <button data-testid="gw-savesession-open" onClick={() => { setSessOpen(true); setSess((s) => ({ ...s, recipe_name: s.recipe_name || tri("Pesata del ", "Wiegen vom ", "Weighing of ") + new Date().toLocaleDateString(mkTri(lang)("it-IT", "de-DE", "en-GB")) })); }} className="w-full flex items-center justify-center gap-2 text-[#ff6b00] font-semibold py-1">
              <Thermometer className="w-4 h-4" /> {tri("Salva come sessione impasto (Giorno Dopo)", "Als Teig-Sitzung speichern (Tag danach)", "Save as dough session (Day After)")}
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-[#ff6b00]">{tri("Aggiungi le temperature", "Temperaturen ergänzen", "Add the temperatures")}</p>
              <input data-testid="gw-sess-name" value={sess.recipe_name} onChange={(e) => setSess((s) => ({ ...s, recipe_name: e.target.value }))} placeholder={tri("Nome impasto", "Teig-Name", "Dough name")} className={inp} />
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] text-[#7E8A93]">{tri("Target °C", "Ziel °C", "Target °C")}<input data-testid="gw-sess-target" type="number" step="0.1" value={sess.target_temp_c} onChange={(e) => setSess((s) => ({ ...s, target_temp_c: e.target.value }))} className={inp + " mt-1 font-mono-data"} /></label>
                <label className="text-[11px] text-[#7E8A93]">{tri("Finale impasto °C", "End-Teig °C", "Final dough °C")}<input data-testid="gw-sess-dough" type="number" step="0.1" value={sess.dough_temp_c} onChange={(e) => setSess((s) => ({ ...s, dough_temp_c: e.target.value }))} className={inp + " mt-1 font-mono-data"} /></label>
                <label className="text-[11px] text-[#7E8A93]">{tri("Ambiente °C", "Raum °C", "Room °C")}<input data-testid="gw-sess-room" type="number" step="0.1" value={sess.room_temp_c} onChange={(e) => setSess((s) => ({ ...s, room_temp_c: e.target.value }))} className={inp + " mt-1 font-mono-data"} /></label>
                <label className="text-[11px] text-[#7E8A93]">{tri("Acqua °C", "Wasser °C", "Water °C")}<input data-testid="gw-sess-water" type="number" step="0.1" value={sess.water_temp_c} onChange={(e) => setSess((s) => ({ ...s, water_temp_c: e.target.value }))} className={inp + " mt-1 font-mono-data"} /></label>
              </div>
              <button data-testid="gw-sess-save" onClick={saveAsSession} disabled={sessSaving} className="w-full flex items-center justify-center gap-2 bg-[#ff6b00] hover:bg-[#ff8a33] disabled:opacity-50 text-white font-bold py-3 rounded-2xl active:scale-98"><Save className="w-5 h-5" /> {sessSaving ? tri("Salvataggio…", "Speichern…", "Saving…") : tri("Salva nel Diario", "Ins Tagebuch", "Save to log")}</button>
            </div>
          )}
        </div>

        {/* Crea lotto tracciabilità dai pesi reali */}
        <button data-testid="gw-create-batch" onClick={createBatch} disabled={batchSaved} className="w-full flex items-center justify-center gap-2 bg-[#ff6b00] hover:bg-[#ff8a33] disabled:opacity-60 text-white font-semibold py-3 rounded-2xl mb-4 active:scale-98">
          {batchSaved ? <><CheckCircle2 className="w-5 h-5" /> {tri("Lotto creato ✓", "Charge erstellt ✓", "Batch created ✓")}</> : <><QrCode className="w-5 h-5" /> {tri("Crea lotto in Tracciabilità", "Charge in Rückverfolgung", "Create batch in Traceability")}</>}
        </button>

        <button data-testid="gw-summary-reset" onClick={reset} className="w-full flex items-center justify-center gap-2 bg-[#ff6b00] hover:bg-[#ff8a33] text-white font-bold py-4 rounded-2xl active:scale-98"><RotateCcw className="w-5 h-5" /> {tri("Nuova pesata", "Neu wiegen", "New weighing")}</button>
      </div>
    );
  }

  // ---- SETUP VIEW ----
  const roleBtn = (ing, role, Icon, label) => (
    <button onClick={() => setIngredients((l) => l.map((x) => x.id === ing.id ? { ...x, role } : x))}
      className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold ${ing.role === role ? "bg-[#ff6b00] text-white" : "bg-[#121212] dark:bg-[#181818] text-[#7E8A93] border border-[#2e2e2e] dark:border-[#2e2e2e]"}`}>
      <Icon className="w-3 h-3" /> {label}
    </button>
  );

  return (
    <div className="pb-40">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#ff6b00] flex items-center justify-center"><Scale className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Pesata Guidata", "Geführtes Wiegen", "Guided Weighing")}</h1>
          <p className="text-sm text-[#7E8A93]">{tri("Un ingrediente alla volta, con semaforo e voce", "Zutat für Zutat, mit Ampel & Sprache", "One ingredient at a time, with traffic-light & voice")}</p>
        </div>
      </div>

      <button data-testid="gw-ble" onClick={connectBle} className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-2xl mb-4 active:scale-98 ${bleOn ? "bg-[#ff6b00] text-white" : "bg-[#ff6b00] text-white hover:bg-[#ff8a33]"}`}>
        <Bluetooth className="w-5 h-5" /> {bleOn ? tri("Bilancia connessa", "Waage verbunden", "Scale connected") : tri("Connetti Bluetooth", "Bluetooth verbinden", "Connect Bluetooth")}
      </button>

      {/* Riscalamento */}
      <div className="bg-[#ff6b00]/10 border border-[#ff6b00]/30 rounded-2xl p-4 mb-4 space-y-2">
        <p className="text-xs font-bold uppercase text-[#ff6b00]">{tri("Riscalamento", "Skalierung", "Rescaling")}</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[11px] text-[#7E8A93]">{tri("Kg totali impasto", "Kg Teig gesamt", "Total dough kg")}<input data-testid="gw-kg" type="number" step="0.1" onChange={(e) => setTotalKg(Number(e.target.value))} className={inp + " mt-1 font-mono-data"} /></label>
          <label className="text-[11px] text-[#7E8A93]">{tri("Capienza impastatrice (kg)", "Kneter-Kapazität (kg)", "Mixer capacity (kg)")}<input data-testid="gw-cap" type="number" step="0.1" value={capacity || ""} onChange={(e) => setCapacity(Number(e.target.value) || 0)} className={inp + " mt-1 font-mono-data"} /></label>
        </div>
        <p className="text-[11px] text-[#7E8A93]">{tri("Totale", "Gesamt", "Total")}: <b className="font-mono-data">{(totalG / 1000).toFixed(2)} kg</b>{batches > 1 && <span className="text-[#ff6b00] font-semibold"> · <Layers className="w-3 h-3 inline" /> {tri(`divisa in ${batches} impastate`, `in ${batches} Teige geteilt`, `split into ${batches} batches`)}</span>}</p>
      </div>

      {/* Ingredienti con ruolo + prezzo */}
      <div className="space-y-3 mb-4" data-testid="gw-ingredients">
        {ingredients.map((ing) => (
          <div key={ing.id} className="rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] p-3 space-y-2">
            <div className="grid grid-cols-[1fr_84px_34px] gap-2 items-center">
              <input value={ing.name} onChange={(e) => setIngredients((l) => l.map((x) => x.id === ing.id ? { ...x, name: e.target.value } : x))} className={inp + " py-2"} placeholder={tri("Nome", "Name", "Name")} />
              <input type="number" value={ing.base} onChange={(e) => setIngredients((l) => l.map((x) => x.id === ing.id ? { ...x, base: Number(e.target.value) || 0 } : x))} className={inp + " py-2 text-center font-mono-data"} placeholder="g" />
              <button onClick={() => setIngredients((l) => l.filter((x) => x.id !== ing.id))} className="text-[#7E8A93] hover:text-[#ff6b00] flex justify-center"><Trash2 className="w-4 h-4" /></button>
            </div>
            <div className="flex gap-1.5">
              {roleBtn(ing, "flour", Wheat, tri("Farina", "Mehl", "Flour"))}
              {roleBtn(ing, "water", Droplet, tri("Acqua", "Wasser", "Water"))}
              {roleBtn(ing, "other", Plus, tri("Altro", "Andere", "Other"))}
              <label className="flex items-center gap-1 bg-[#121212] dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-lg px-2 text-[11px] text-[#7E8A93]">
                <Euro className="w-3 h-3" />
                <input type="number" step="0.1" value={ing.price || ""} onChange={(e) => setIngredients((l) => l.map((x) => x.id === ing.id ? { ...x, price: Number(e.target.value) || 0 } : x))} className="w-14 bg-transparent outline-none font-mono-data text-[#2B303B] dark:text-[#e4eff8]" placeholder="€/kg" data-testid={`gw-price-${ing.id}`} />
              </label>
            </div>
          </div>
        ))}
        <button data-testid="gw-add" onClick={() => setIngredients((l) => [...l, { id: uid(), name: "", base: 0, role: "other", price: 0 }])} className="text-sm font-semibold text-[#ff6b00] flex items-center gap-1"><Plus className="w-4 h-4" /> {tri("Aggiungi ingrediente", "Zutat hinzufügen", "Add ingredient")}</button>
      </div>

      <button data-testid="gw-start" onClick={startRun} disabled={ingredients.filter((i) => i.name && i.base > 0).length === 0}
        className="w-full flex items-center justify-center gap-2 bg-[#ff6b00] hover:bg-[#ff8a33] disabled:opacity-40 text-white font-bold py-4 rounded-2xl active:scale-98"><Scale className="w-5 h-5" /> {tri("Inizia pesata guidata", "Wiegen starten", "Start guided weighing")}</button>
    </div>
  );
}
