import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Flame, Camera, Upload, RefreshCw, ArrowRight } from "lucide-react";
import { API, recipesApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";

const OVENS = ["statico", "ventilato", "rotor"];

// Aggiustamenti pratici tra tipi di forno (temp in °C, tempo in fattore).
const ADJ = {
  "statico>ventilato": { dt: -15, ft: 0.9 },
  "statico>rotor": { dt: -20, ft: 0.85 },
  "ventilato>statico": { dt: 15, ft: 1.1 },
  "ventilato>rotor": { dt: -5, ft: 0.95 },
  "rotor>statico": { dt: 20, ft: 1.15 },
  "rotor>ventilato": { dt: 5, ft: 1.05 },
};

function fileToCompressedBase64(file, maxDim = 1024, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) { height = Math.round(height * maxDim / width); width = maxDim; }
        else if (height > maxDim) { width = Math.round(width * maxDim / height); height = maxDim; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject; img.src = e.target.result;
    };
    reader.onerror = reject; reader.readAsDataURL(file);
  });
}

export default function AdattaForno() {
  const { t, lang } = useLang();
  const [mode, setMode] = useState("calc");

  return (
    <div className="pb-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#B34A26] flex items-center justify-center">
          <Flame className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2C221E] dark:text-[#F5EFE6]">{t("adatta_title")}</h1>
          <p className="text-sm text-[#8C7567]">{t("adatta_subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-5">
        {[["calc", "adatta_mode_calc"], ["foto", "adatta_mode_foto"]].map(([m, lk]) => (
          <button
            key={m}
            data-testid={`adatta-mode-${m}`}
            onClick={() => setMode(m)}
            className={`px-4 py-2.5 rounded-2xl text-sm font-semibold border transition-all ${
              mode === m ? "bg-[#B34A26] text-white border-[#B34A26]" : "bg-white dark:bg-[#2A211D] text-[#8C7567] border-[#E8DEC8] dark:border-[#3D302A]"
            }`}
          >
            {t(lk)}
          </button>
        ))}
      </div>

      {mode === "calc" ? <CalcMode /> : <PhotoMode />}
    </div>
  );

  function CalcMode() {
    const [recipes, setRecipes] = useState([]);
    const [fromOven, setFromOven] = useState("statico");
    const [toOven, setToOven] = useState("ventilato");
    const [temp, setTemp] = useState("235");
    const [min, setMin] = useState("40");

    useEffect(() => {
      (async () => {
        try {
          const [a, b] = await Promise.all([recipesApi.list("mikilab"), recipesApi.list("personal")]);
          setRecipes([...a, ...b]);
        } catch { /* ignore */ }
      })();
    }, []);

    const loadRecipe = (id) => {
      const r = recipes.find((x) => x.id === id);
      if (!r) return;
      if (r.bake_temp != null) setTemp(String(r.bake_temp));
      if (r.bake_minutes != null) setMin(String(r.bake_minutes));
      if (r.oven_type) setFromOven(r.oven_type);
    };

    const ovenLabel = (o) => o === "ventilato" ? t("oven_type_fan") : o === "rotor" ? t("oven_type_rotor") : t("oven_type_static");
    const same = fromOven === toOven;
    const adj = ADJ[`${fromOven}>${toOven}`];
    const nTemp = Number(temp) || 0;
    const nMin = Number(min) || 0;
    const outTemp = same ? nTemp : Math.round((nTemp + (adj?.dt || 0)) / 5) * 5;
    const outMin = same ? nMin : Math.max(1, Math.round(nMin * (adj?.ft || 1)));

    return (
      <div className="space-y-3">
        {recipes.length > 0 && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">{t("adatta_from_recipe")}</label>
            <select
              data-testid="adatta-recipe" defaultValue="" onChange={(e) => loadRecipe(e.target.value)}
              className="mt-1 w-full bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#B34A26]"
            >
              <option value="">{t("adatta_choose")}</option>
              {recipes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">{t("adatta_temp")}</label>
            <input data-testid="adatta-temp" type="number" value={temp} onChange={(e) => setTemp(e.target.value)}
              className="mt-1 w-full font-mono-data bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-xl p-3 outline-none focus:border-[#B34A26]" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">{t("adatta_min")}</label>
            <input data-testid="adatta-min" type="number" value={min} onChange={(e) => setMin(e.target.value)}
              className="mt-1 w-full font-mono-data bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-xl p-3 outline-none focus:border-[#B34A26]" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">{t("adatta_from_oven")}</label>
            <select data-testid="adatta-from-oven" value={fromOven} onChange={(e) => setFromOven(e.target.value)}
              className="mt-1 w-full bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#B34A26]">
              {OVENS.map((o) => <option key={o} value={o}>{ovenLabel(o)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">{t("adatta_to_oven")}</label>
            <select data-testid="adatta-to-oven" value={toOven} onChange={(e) => setToOven(e.target.value)}
              className="mt-1 w-full bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#B34A26]">
              {OVENS.map((o) => <option key={o} value={o}>{ovenLabel(o)}</option>)}
            </select>
          </div>
        </div>

        <div data-testid="adatta-result" className="mt-2 bg-gradient-to-br from-[#B34A26] to-[#8C3A1D] rounded-3xl p-6 text-white shadow-lg">
          <p className="text-white/80 text-sm uppercase tracking-wider font-semibold">{t("adatta_result")} {ovenLabel(toOven)}</p>
          <p className="font-mono-data text-4xl font-bold mt-1">{outTemp}°C · {outMin}′</p>
          <p className="text-white/85 text-sm mt-3 leading-relaxed">
            {same ? t("adatta_same") : t("adatta_tip")}
          </p>
        </div>
      </div>
    );
  }

  function PhotoMode() {
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const fileRef = useRef(null);

    const onPick = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try { setPreview(await fileToCompressedBase64(file)); setResult(""); }
      catch { toast.error(t("toast_img_error")); }
    };

    const analyze = async () => {
      if (!preview || analyzing) return;
      setAnalyzing(true); setResult("");
      try {
        const res = await fetch(`${API}/maestro/vision`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "forni", image_base64: preview, lang }),
        });
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop();
          for (const part of parts) {
            const line = part.replace(/^data: ?/, "").trim();
            if (!line) continue;
            let obj; try { obj = JSON.parse(line); } catch { continue; }
            if (obj.d) setResult((r) => r + obj.d);
          }
        }
      } catch { toast.error(t("toast_analyze_error")); }
      finally { setAnalyzing(false); }
    };

    return (
      <div>
        <p className="text-sm text-[#8C7567] mb-3 leading-relaxed">{t("adatta_photo_hint")}</p>
        <input ref={fileRef} data-testid="adatta-file-input" type="file" accept="image/*" capture="environment" onChange={onPick} className="hidden" />
        {preview ? (
          <div className="rounded-3xl overflow-hidden border border-[#E8DEC8] dark:border-[#3D302A] mb-4 relative">
            <img src={preview} alt="forno" className="w-full max-h-80 object-cover" />
            <button data-testid="adatta-change-photo" onClick={() => fileRef.current?.click()}
              className="absolute top-3 right-3 bg-black/50 text-white text-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> {t("adatta_change_photo")}
            </button>
          </div>
        ) : (
          <button data-testid="adatta-upload-btn" onClick={() => fileRef.current?.click()}
            className="w-full mb-4 border-2 border-dashed border-[#E8DEC8] dark:border-[#3D302A] rounded-3xl py-12 flex flex-col items-center gap-2 text-[#8C7567]">
            <Camera className="w-8 h-8 text-[#D99B26]" />
            <span className="font-medium">{t("adatta_take_photo")}</span>
          </button>
        )}
        <button data-testid="adatta-analyze-btn" onClick={analyze} disabled={!preview || analyzing}
          className="w-full bg-[#B34A26] hover:bg-[#963B1C] disabled:opacity-50 text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2">
          {analyzing ? t("adatta_analyzing") : t("adatta_analyze")} {!analyzing && <ArrowRight className="w-4 h-4" />}
        </button>
        {result && (
          <div data-testid="adatta-result-photo" className="markdown-body mt-5 bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-5 text-sm leading-relaxed text-[#2C221E] dark:text-[#F5EFE6]">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        )}
      </div>
    );
  }
}
