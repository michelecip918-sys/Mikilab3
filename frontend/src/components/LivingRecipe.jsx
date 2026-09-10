import { useState } from "react";
import { Dna, Loader2, Sparkles, Thermometer, Clock, FlaskConical } from "lucide-react";
import { api } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// FASE 9 · Ricettario Vivente & Generatore Dinamico — funzione suprema di Sitor (solo Capo).
const PRESETS = ["pizza altamente digeribile e croccante", "pane a lunga conservazione", "croissant sfoglia estrema", "focaccia soffice e alveolata"];

export default function LivingRecipe() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [obj, setObj] = useState("");
  const [busy, setBusy] = useState(false);
  const [r, setR] = useState(null);

  const gen = async () => {
    if (!obj.trim() || busy) return;
    setBusy(true); setR(null);
    try {
      const { data } = await api.post("/nexus/living-recipe", { objective: obj, lang }, { timeout: 70000 });
      setR(data);
      try { if (data.why) playTTS(`${data.name}. ${data.why}`, { lang, voice: "nexus" }); } catch { /* */ }
    } catch { setR({ name: tri("Riprova", "Nochmal", "Retry", "Reintenta", "Réessaie", "دوباره"), maturation_curve: [] }); }
    setBusy(false);
  };

  const M = r?.matrix || {};
  return (
    <div data-testid="living-recipe" className="space-y-3">
      <div className="flex items-center gap-2">
        <Dna className="w-5 h-5 text-[#EAB308]" />
        <div><h4 className="font-cyber text-sm font-black text-white uppercase tracking-wide">{tri("Ricettario Vivente · Sitor", "Lebendes Rezeptbuch · Sitor", "Living Recipe Book · Sitor", "Recetario Vivo · Sitor", "Livre Vivant · Sitor", "دستورنامه زنده")}</h4>
        <p className="text-[10.5px] text-[#94A3B8]">{tri("Detta un obiettivo: Sitor calcola la matrice vivente e la curva di maturazione.", "Nenne ein Ziel: Sitor berechnet die lebende Matrix.", "Dictate an objective: Sitor computes the living matrix and maturation curve.", "Dicta un objetivo: Sitor calcula la matriz viva.", "Dicte un objectif : Sitor calcule la matrice vivante.", "هدفی بگو: میکی‌نکسوس ماتریس زنده را می‌سازد.")}</p></div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (<button key={p} data-testid={`living-preset-${p.slice(0,5)}`} onClick={() => setObj(p)} className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold border active:scale-95 transition-all ${obj === p ? "bg-[#EAB308] text-[#060A10] border-[#EAB308]" : "bg-[#060A10] text-[#94A3B8] border-[#1e293b]"}`}>{p}</button>))}
      </div>
      <textarea data-testid="living-objective" value={obj} onChange={(e) => setObj(e.target.value)} rows={2} placeholder={tri("Es. pizza altamente digeribile e croccante…", "Z. B. hoch verdauliche knusprige Pizza…", "E.g. highly digestible crispy pizza…", "Ej. pizza muy digerible y crujiente…", "Ex. pizza très digeste et croustillante…", "مثلاً پیتزای ترد و گوارا…")}
        className="w-full rounded-lg bg-[#060A10] border border-[#1e293b] text-white text-sm px-3 py-2 focus:border-[#EAB308] outline-none resize-none" />
      <button data-testid="living-generate" onClick={gen} disabled={busy || !obj.trim()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm text-[#060A10] active:scale-95 transition-all disabled:opacity-50" style={{ background: "linear-gradient(90deg,#EAB308,#FF6B00)" }}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />} {busy ? tri("Sitor calcola…", "Sitor rechnet…", "Sitor computing…", "Sitor calcula…", "Sitor calcule…", "در حال محاسبه…") : tri("Genera matrice vivente", "Matrix erzeugen", "Generate living matrix", "Generar matriz", "Générer la matrice", "ساخت ماتریس")}
      </button>
      {r && r.maturation_curve && (
        <div data-testid="living-result" className="rounded-xl border border-[#EAB308]/30 bg-gradient-to-b from-[#0b0f19] to-[#060A10] p-4 space-y-3">
          <h5 className="font-cyber text-base font-black text-white">{r.name}</h5>
          {r.why && <p className="flex items-start gap-1.5 text-[12px] text-[#f3e6c4] leading-snug"><Sparkles className="w-3.5 h-3.5 text-[#EAB308] shrink-0 mt-0.5" />{r.why}</p>}
          {Object.keys(M).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(M).map(([k, v]) => (
                <div key={k} className="rounded-lg bg-[#060A10] border border-[#1e293b] p-2"><p className="text-[9px] font-mono uppercase tracking-widest text-[#FF9D42]">{k.replace(/_/g, " ")}</p><p className="text-[12.5px] font-bold text-white">{String(v)}</p></div>
              ))}
            </div>
          )}
          {r.maturation_curve.length > 0 && (
            <div data-testid="living-curve">
              <p className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[#FF6B00] mb-1.5"><Clock className="w-3.5 h-3.5" /> {tri("Curva di maturazione", "Reifekurve", "Maturation curve", "Curva de maduración", "Courbe de maturation", "منحنی رسیدن")}</p>
              <div className="space-y-1.5">
                {r.maturation_curve.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-[#060A10] border border-[#1e293b] p-2">
                    <span className="w-6 h-6 shrink-0 rounded-full bg-[#FF6B00]/15 border border-[#FF6B00]/40 text-[#FF6B00] text-[10px] font-black flex items-center justify-center">{i + 1}</span>
                    <div className="min-w-0 flex-1"><p className="text-[12px] font-bold text-white truncate">{p.phase} <span className="text-[#94A3B8] font-normal">· {p.hours}h</span></p>{p.note && <p className="text-[10.5px] text-[#CBD5E1] truncate">{p.note}</p>}</div>
                    <span className="shrink-0 inline-flex items-center gap-0.5 text-[11px] font-bold text-[#FFB800]"><Thermometer className="w-3 h-3" />{p.temp_c}°</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {r.sensory && (
            <div data-testid="living-sensory" className="rounded-lg bg-[#FF9D42]/8 border border-[#FF9D42]/25 p-3 space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF9D42]">{tri("Predizione sensoriale", "Sensorik-Vorhersage", "Sensory prediction", "Predicción sensorial", "Prédiction sensorielle", "پیش‌بینی حسی")}</p>
              {r.sensory.crust && <p className="text-[11.5px] text-[#c5d3df]"><b className="text-white">{tri("Crosta", "Kruste", "Crust", "Corteza", "Croûte", "پوسته")}:</b> {r.sensory.crust}</p>}
              {r.sensory.crumb && <p className="text-[11.5px] text-[#c5d3df]"><b className="text-white">{tri("Alveolatura", "Krume", "Crumb", "Miga", "Mie", "بافت")}:</b> {r.sensory.crumb}</p>}
              {r.sensory.aroma && <p className="text-[11.5px] text-[#c5d3df]"><b className="text-white">{tri("Aroma", "Aroma", "Aroma", "Aroma", "Arôme", "عطر")}:</b> {r.sensory.aroma}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
