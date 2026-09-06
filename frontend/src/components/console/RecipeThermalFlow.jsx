import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Thermometer, Lock, Check, Snowflake, Gauge, Flame, Timer } from "lucide-react";
import { recipesApi, bakoApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const MIXERS = ["spirale", "forcella", "braccia_tuffanti", "planetaria", "presa_diretta", "1_braccio"];

function PlateauCountdown({ seconds, label }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => { setLeft(seconds); const iv = setInterval(() => setLeft((v) => (v > 0 ? v - 1 : 0)), 1000); return () => clearInterval(iv); }, [seconds]);
  return (
    <div data-testid="plateau-countdown" className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#FFB800] bg-[#FFB800]/10 border border-[#FFB800]/30 rounded-lg px-2 py-1">
      <Timer className="w-3.5 h-3.5" /> {label}: {left}s
    </div>
  );
}

// Modulo 70 · Recipe & Thermal Master Flow + Live Editor + Thermal-Ingredient Interlock.
export default function RecipeThermalFlow() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [recipes, setRecipes] = useState([]);
  const [recipeId, setRecipeId] = useState("");
  const [p, setP] = useState({ hydration_pct: 65, dough_temp_c: 24, flour_temp_c: 20, room_temp_c: 22, batch_kg: 20, mixer_type: "spirale" });
  const [flow, setFlow] = useState(null);
  const [unlocked, setUnlocked] = useState(0);
  const [interlockOk, setInterlockOk] = useState(true);
  const deb = useRef(null);

  useEffect(() => { recipesApi.list("mikilab").then((r) => setRecipes(Array.isArray(r) ? r : (r?.recipes || []))).catch(() => setRecipes([])); }, []);

  const recompute = useCallback(() => {
    bakoApi.thermalFlow({ recipe_id: recipeId, ...p, lang }).then((d) => {
      setFlow(d);
      setInterlockOk(!d.interlock);
      setUnlocked(d.interlock ? 0 : 1);
    }).catch(() => { /* */ });
  }, [recipeId, p, lang]);

  // Editor LIVE: ogni modifica ricalcola (debounce 350ms).
  useEffect(() => { if (deb.current) clearTimeout(deb.current); deb.current = setTimeout(recompute, 350); return () => clearTimeout(deb.current); }, [recompute]);

  const setNum = (k, v) => setP((s) => ({ ...s, [k]: v }));
  const rng = "w-full accent-[#00F0FF]";

  return (
    <div data-testid="thermal-flow" className="space-y-3">
      <select data-testid="tf-recipe" value={recipeId} onChange={(e) => setRecipeId(e.target.value)} className="w-full bg-[#0C1019] border border-[#5E8CA8]/30 rounded-lg px-2.5 py-2 text-sm text-white outline-none">
        <option value="">{tri("Scegli una ricetta…", "Rezept wählen…", "Choose a recipe…", "Elige receta…", "Choisir recette…", "دستور را انتخاب کن…")}</option>
        {recipes.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
      </select>

      {/* Editor LIVE dei parametri */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {[["hydration_pct", tri("Idratazione", "Hydratation", "Hydration", "Hidratación", "Hydratation", "هیدراتاسیون"), 50, 90, "%"],
          ["dough_temp_c", tri("Temp. impasto", "Teigtemp.", "Dough temp", "Temp. masa", "Temp. pâte", "دمای خمیر"), 18, 30, "°C"],
          ["flour_temp_c", tri("Temp. farina", "Mehltemp.", "Flour temp", "Temp. harina", "Temp. farine", "دمای آرد"), 10, 32, "°C"],
          ["batch_kg", tri("Impasto", "Charge", "Batch", "Lote", "Lot", "دسته"), 5, 120, "kg"]].map(([k, lbl, mn, mx, suf]) => (
          <label key={k} className="flex flex-col gap-0.5">
            <span className="flex justify-between text-[11px] text-[#8aa0b4]"><span>{lbl}</span><b className="text-white">{p[k]}{suf}</b></span>
            <input data-testid={`tf-${k}`} type="range" min={mn} max={mx} value={p[k]} onChange={(e) => setNum(k, Number(e.target.value))} className={rng} />
          </label>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {MIXERS.map((m) => (
          <button key={m} data-testid={`tf-mixer-${m}`} onClick={() => setNum("mixer_type", m)}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border active:scale-95 ${p.mixer_type === m ? "bg-[#00F0FF]/15 border-[#00F0FF]/50 text-[#00F0FF]" : "bg-[#030712] border-[#1e293b] text-[#94A3B8]"}`}>
            {m.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {flow && (
        <>
          <div className="flex items-center gap-2 text-[12px] text-[#8aa0b4]">
            <Snowflake className="w-3.5 h-3.5 text-[#7DD3FC]" /> {tri("Acqua", "Wasser", "Water", "Agua", "Eau", "آب")}: <b className="text-white">{flow.water_temp_c}°C</b>
            {flow.ice_kg > 0 && <span className="text-[#7DD3FC]">· {tri("ghiaccio", "Eis", "ice", "hielo", "glace", "یخ")} {flow.ice_kg} kg</span>}
          </div>

          {/* Thermal-Ingredient Interlock */}
          {flow.interlock && !interlockOk && (
            <div data-testid="tf-interlock" className="rounded-xl border border-[#f43f5e]/60 bg-[#f43f5e]/8 p-3">
              <p className="text-[12px] font-bold text-[#f43f5e] flex items-center gap-1.5"><Lock className="w-4 h-4" /> {flow.steps[0]?.interlock_msg || tri("Impastatrice bloccata: farina troppo calda.", "Mixer gesperrt: Mehl zu warm.", "Mixer locked: flour too hot.", "Amasadora bloqueada.", "Pétrin verrouillé.", "میکسر قفل شد.")}</p>
              <button data-testid="tf-interlock-unlock" onClick={() => { setInterlockOk(true); setUnlocked(1); }} className="mt-2 w-full py-2 rounded-lg bg-[#f43f5e]/15 border border-[#f43f5e]/50 text-[#f43f5e] font-bold text-xs active:scale-95">
                {tri(`Acqua gelata pronta (${flow.ice_kg} kg) · Sblocca`, `Eiswasser bereit (${flow.ice_kg} kg) · Entsperren`, `Ice water ready (${flow.ice_kg} kg) · Unlock`, `Agua helada lista · Desbloquear`, `Eau glacée prête · Déverrouiller`, `آب یخ آماده · باز کن`)}
              </button>
            </div>
          )}

          {/* Flusso sequenziale */}
          <div className="space-y-1.5">
            {flow.steps.map((st, i) => {
              const isUnlocked = i < unlocked;
              const isActive = i === unlocked - 1;
              return (
                <div key={i} data-testid={`tf-step-${i}`} className={`rounded-xl border p-2.5 transition-all ${isUnlocked ? "border-[#00F0FF]/40 bg-[#00F0FF]/5" : "border-[#1e293b] bg-[#030712] opacity-55"}`}>
                  <div className="flex items-center gap-2">
                    <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${isUnlocked ? "bg-[#00F0FF] text-[#070A10]" : "bg-[#1e293b] text-[#64748b]"}`}>{isUnlocked ? st.order : <Lock className="w-3 h-3" />}</span>
                    <span className="text-[13px] font-black text-white flex-1 min-w-0">{st.phase}</span>
                    {st.rpm ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#7DD3FC]"><Gauge className="w-3 h-3" /> {st.rpm} rpm</span> : null}
                    {st.temp_target_c ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#FFB800]"><Thermometer className="w-3 h-3" /> {st.temp_target_c}°C</span> : null}
                  </div>
                  {isUnlocked && (
                    <>
                      <p className="mt-1 text-[12px] text-[#c9dbe8]">{st.action}{st.duration_min ? ` · ${st.duration_min} min` : ""}</p>
                      {st.note && <p className="text-[11px] text-[#8aa0b4]">{st.note}</p>}
                      {isActive && st.plateau_recovery_s && <PlateauCountdown seconds={st.plateau_recovery_s} label={tri("Recupero platea", "Deck-Erholung", "Deck recovery", "Recuperación", "Récup. sole", "بازیابی کف")} />}
                      {isActive && i < flow.steps.length - 1 && (
                        <button data-testid={`tf-next-${i}`} onClick={() => setUnlocked((u) => u + 1)} className="mt-2 w-full py-1.5 rounded-lg bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] font-bold text-[11px] active:scale-95 inline-flex items-center justify-center gap-1.5">
                          <Check className="w-3.5 h-3.5" /> {tri("Fatto · passo successivo", "Fertig · nächster", "Done · next", "Hecho · siguiente", "Fait · suivant", "انجام شد · بعدی")}
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
