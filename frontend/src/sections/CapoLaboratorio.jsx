import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { X, Cog, Snowflake, Wind, Thermometer, Video, Camera, ImagePlus } from "lucide-react";
import { API, labConfigApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { fireHighFive } from "@/components/HighFive";
import ModuleParams from "@/components/ModuleParams";
import MultiChief from "@/components/MultiChief";

const CELL_TYPES = ["frigo", "freezer", "lievitazione", "lievitazione_frigo"];

// Impostazione Macchine (Passo 1) — SOLO attrezzature/celle + riconoscimento macchine.
// La parte "cosa preparare" + piano IA è stata spostata in "Piano di Produzione con IA" (Passo 4).
export default function CapoLaboratorio() {
  const { t, lang } = useLang();
  const [mixers, setMixers] = useState([]);
  const [cells, setCells] = useState([]);
  const [staff, setStaff] = useState("");
  const [stdTemp, setStdTemp] = useState(26);

  useEffect(() => {
    (async () => {
      try {
        const cfg = await labConfigApi.get();
        if (cfg) {
          setMixers(cfg.mixers || []);
          setCells(cfg.cells || []);
          setStaff(cfg.staff ?? "");
          setStdTemp(cfg.standard_temp_c ?? 26);
        }
      } catch { /* first run */ }
    })();
  }, []);

  const saveConfig = async () => {
    const numOrNull = (v) => (v === "" || v == null ? null : Number(v));
    try {
      await labConfigApi.save({
        mixers: mixers.map((m) => ({ ...m, capacity_kg: numOrNull(m.capacity_kg) })),
        cells: cells.map((c) => ({ ...c, temp_c: numOrNull(c.temp_c) })),
        staff: staff === "" ? null : Number(staff),
        standard_temp_c: Number(stdTemp) || 26,
      });
      toast.success(t("capo_config_saved"));
      fireHighFive(t("capo_config_saved"));
    } catch { toast.error(t("toast_save_error")); }
  };

  return (
    <div className="pb-24">
      <div className="relative rounded-3xl overflow-hidden mb-5 bg-gradient-to-br from-[#3E9C93] to-[#3E9C93] p-6 text-white">
        <div className="absolute top-0 left-0 right-0 flex h-1.5">
          <div className="flex-1 bg-[#3E9C93]" /><div className="flex-1 bg-white" /><div className="flex-1 bg-[#3E9C93]" />
          <div className="flex-1 bg-black" /><div className="flex-1 bg-[#3E9C93]" /><div className="flex-1 bg-[#3E9C93]" />
        </div>
        <Cog className="w-7 h-7 mb-2" />
        <h1 className="font-display text-2xl font-bold">{mkTri(lang)("Impostazione Macchine", "Maschinen einrichten", "Machine Setup")}</h1>
        <p className="text-white/85 text-sm mt-1">{mkTri(lang)("Impastatrici, celle e squadra — usati dalla pianificazione IA", "Kneter, Gärzellen und Team — für die KI-Planung", "Mixers, cells and team — used by AI planning")}</p>
      </div>

      <ModuleParams screen="capo" />
      <MultiChief />

      {/* Attrezzature e celle */}
      <Section icon={<Cog className="w-4 h-4" />} title={t("capo_equip_title")}>
        <p className="text-xs font-bold uppercase tracking-wide text-[#7E8A93] mb-1.5">{t("capo_mixers")}</p>
        <div className="space-y-2" data-testid="capo-mixers">
          {mixers.map((m, i) => (
            <div key={i} className="bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-lg p-2 space-y-2">
              <div className="flex items-center gap-2">
                <input data-testid={`capo-mixer-name-${i}`} value={m.name || ""} placeholder={t("capo_mixer_name")}
                  onChange={(e) => setMixers((l) => l.map((x, k) => k === i ? { ...x, name: e.target.value } : x))}
                  className="flex-1 min-w-0 bg-[#e4eff8] dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-lg p-2 text-sm outline-none focus:border-[#3E9C93]" />
                <div className="relative w-24 shrink-0">
                  <input data-testid={`capo-mixer-cap-${i}`} type="number" value={m.capacity_kg ?? ""} placeholder={t("capo_mixer_cap")}
                    onChange={(e) => setMixers((l) => l.map((x, k) => k === i ? { ...x, capacity_kg: e.target.value === "" ? "" : Number(e.target.value) } : x))}
                    className="w-full bg-[#e4eff8] dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-lg p-2 pr-7 text-sm outline-none focus:border-[#3E9C93]" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#7E8A93]">kg</span>
                </div>
                <button onClick={() => setMixers((l) => l.filter((_, k) => k !== i))} className="text-[#3E9C93] p-1 shrink-0"><X className="w-4 h-4" /></button>
              </div>
              <select data-testid={`capo-mixer-type-${i}`} value={m.type || "spirale"}
                onChange={(e) => setMixers((l) => l.map((x, k) => k === i ? { ...x, type: e.target.value } : x))}
                className="w-full bg-[#e4eff8] dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-lg p-2 text-sm outline-none focus:border-[#3E9C93]">
                {["spirale", "braccio", "forcella", "planetaria", "tuffante", "diretta"].map((mt) => (
                  <option key={mt} value={mt}>{t(`mixer_${mt}`)}</option>
                ))}
              </select>
            </div>
          ))}
          <button data-testid="capo-mixer-add" onClick={() => setMixers((l) => [...l, { name: "", capacity_kg: "", type: "spirale" }])} className="text-sm font-medium text-[#3E9C93]">+ {t("capo_mixer_add")}</button>
        </div>

        <p className="text-xs font-bold uppercase tracking-wide text-[#7E8A93] mb-1.5 mt-4">{t("capo_cells")}</p>
        <div className="space-y-2" data-testid="capo-cells">
          {cells.map((c, i) => (
            <div key={i} className="bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-2xl shadow-md border border-amber-900/40 p-2.5 space-y-2">
              <div className="flex items-center gap-2">
                <CellIcon type={c.type} />
                <input data-testid={`capo-cell-name-${i}`} value={c.name || ""} placeholder={t("capo_cell_name")}
                  onChange={(e) => setCells((l) => l.map((x, k) => k === i ? { ...x, name: e.target.value } : x))}
                  className="flex-1 min-w-0 bg-[#e4eff8] dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-lg p-2 text-sm outline-none focus:border-[#3E9C93]" />
                <button onClick={() => setCells((l) => l.filter((_, k) => k !== i))} className="text-[#3E9C93] p-1"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex items-center gap-2">
                <select data-testid={`capo-cell-type-${i}`} value={c.type || "lievitazione"}
                  onChange={(e) => setCells((l) => l.map((x, k) => k === i ? { ...x, type: e.target.value } : x))}
                  className="flex-1 bg-[#e4eff8] dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-lg p-2 text-sm outline-none focus:border-[#3E9C93]">
                  {CELL_TYPES.map((ct) => <option key={ct} value={ct}>{t(`capo_celltype_${ct}`)}</option>)}
                </select>
                <div className="relative w-20 shrink-0">
                  <input data-testid={`capo-cell-temp-${i}`} type="number" value={c.temp_c ?? ""} placeholder="°C"
                    onChange={(e) => setCells((l) => l.map((x, k) => k === i ? { ...x, temp_c: e.target.value === "" ? "" : Number(e.target.value) } : x))}
                    className="w-full bg-[#e4eff8] dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-lg p-2 pr-6 text-sm outline-none focus:border-[#3E9C93]" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#7E8A93]">°</span>
                </div>
              </div>
              <input data-testid={`capo-cell-contents-${i}`} value={c.contents || ""} placeholder={t("capo_cell_contents")}
                onChange={(e) => setCells((l) => l.map((x, k) => k === i ? { ...x, contents: e.target.value } : x))}
                className="w-full bg-[#e4eff8] dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-lg p-2 text-sm outline-none focus:border-[#3E9C93]" />
            </div>
          ))}
          <button data-testid="capo-cell-add" onClick={() => setCells((l) => [...l, { name: "", type: "lievitazione", temp_c: "", contents: "" }])} className="text-sm font-medium text-[#3E9C93]">+ {t("capo_cell_add")}</button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <LabelInput testid="capo-staff" label={t("capo_staff")} type="number" value={staff} onChange={setStaff} />
          <LabelInput testid="capo-std-temp" label={t("capo_std_temp")} type="number" value={stdTemp} onChange={setStdTemp} unit="°C" />
        </div>
        <button data-testid="capo-save-config" onClick={saveConfig} className="mt-3 w-full bg-[#3E9C93] hover:bg-[#5E8CA8] text-white font-semibold px-4 py-2.5 rounded-2xl shadow-md border border-amber-900/40 active:scale-98 transition-all">
          {t("capo_save_config")}
        </button>
      </Section>

      {/* Filma il laboratorio */}
      <LabCamera />
    </div>
  );
}

function LabCamera() {
  const { t, lang } = useLang();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState("");

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      setOpen(true); setResult("");
      setTimeout(() => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); } }, 100);
    } catch { toast.error(t("capo_camera_error")); }
  };

  const stop = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach((tk) => tk.stop());
    streamRef.current = null; setOpen(false);
  };

  useEffect(() => () => { if (streamRef.current) streamRef.current.getTracks().forEach((tk) => tk.stop()); }, []);

  const snap = async () => {
    const v = videoRef.current; if (!v) return;
    const max = 1024; let w = v.videoWidth || 640, h = v.videoHeight || 480;
    if (w > h && w > max) { h = Math.round(h * max / w); w = max; } else if (h > max) { w = Math.round(w * max / h); h = max; }
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    c.getContext("2d").drawImage(v, 0, 0, w, h);
    analyzeB64(c.toDataURL("image/jpeg", 0.8));
  };

  const onAttach = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const max = 1024; let w = img.width, h = img.height;
        if (w > h && w > max) { h = Math.round(h * max / w); w = max; } else if (h > max) { w = Math.round(w * max / h); h = max; }
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        stop();
        analyzeB64(c.toDataURL("image/jpeg", 0.8));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const analyzeB64 = async (b64) => {
    setAnalyzing(true); setResult("");
    try {
      const res = await fetch(`${API}/maestro/vision`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ mode: "laboratorio", image_base64: b64, lang }),
      });
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n"); buffer = parts.pop();
        for (const part of parts) {
          const line = part.replace(/^data: ?/, "").trim(); if (!line) continue;
          let obj; try { obj = JSON.parse(line); } catch { continue; }
          if (obj.done) continue;
          if (obj.d) setResult((r) => r + obj.d);
        }
      }
    } catch { toast.error(t("toast_analyze_error")); }
    finally { setAnalyzing(false); }
  };

  return (
    <div className="mt-4 rounded-2xl bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] p-4">
      <div className="flex items-center gap-2 mb-1">
        <Video className="w-4 h-4 text-[#3E9C93]" />
        <h2 className="font-display text-base font-semibold text-[#2B303B] dark:text-[#e4eff8]">{t("capo_film_title")}</h2>
      </div>
      <p className="text-sm text-[#7E8A93] mb-3">{t("capo_film_hint")}</p>

      {!open ? (
        <div className="grid grid-cols-2 gap-2">
          <button data-testid="capo-film-start" onClick={start} className="bg-[#3E9C93] hover:bg-[#5E8CA8] text-white rounded-2xl shadow-md border border-amber-900/40 px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2">
            <Camera className="w-4 h-4" /> {mkTri(lang)("Filma ora", "Jetzt filmen", "Film now")}
          </button>
          <label data-testid="capo-film-attach" className="cursor-pointer bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-2xl shadow-md border border-amber-900/40 px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 text-[#2B303B] dark:text-[#e4eff8]">
            <ImagePlus className="w-4 h-4 text-[#3E9C93]" /> {mkTri(lang)("Allega", "Anhängen", "Attach")}
            <input type="file" accept="image/*" className="hidden" onChange={onAttach} />
          </label>
        </div>
      ) : (
        <div>
          <div className="rounded-2xl overflow-hidden border border-[#2A3B49] dark:border-[#2A3B49] bg-black">
            <video ref={videoRef} data-testid="capo-video" playsInline muted className="w-full max-h-72 object-cover" />
          </div>
          <div className="flex gap-2 mt-2">
            <button data-testid="capo-film-snap" onClick={snap} disabled={analyzing} className="flex-1 bg-[#3E9C93] hover:bg-[#5E8CA8] disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-2xl shadow-md border border-amber-900/40 flex items-center justify-center gap-2">
              <Camera className="w-4 h-4" /> {analyzing ? t("capo_film_analyzing") : t("capo_film_snap")}
            </button>
            <button data-testid="capo-film-stop" onClick={stop} className="bg-[#e4eff8] dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] px-4 py-2.5 rounded-2xl shadow-md border border-amber-900/40 font-medium text-[#2B303B] dark:text-[#e4eff8]">
              {t("capo_film_stop")}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div data-testid="capo-film-result" className="markdown-body mt-4 bg-[#e4eff8] dark:bg-[#1B2A38] rounded-2xl p-4 text-sm leading-relaxed text-[#2B303B] dark:text-[#e4eff8]">
          <ReactMarkdown>{result}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 rounded-2xl bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] p-4">
      <div className="flex items-center gap-2 mb-3 text-[#3E9C93]">
        {icon}
        <h2 className="font-display text-base font-semibold text-[#2B303B] dark:text-[#e4eff8]">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

function LabelInput({ testid, label, type, value, onChange, unit }) {
  return (
    <div>
      <label className="text-[10px] font-semibold uppercase tracking-wide text-[#7E8A93]">{label}</label>
      <div className="relative mt-1">
        <input data-testid={testid} type={type} value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-2xl shadow-md border border-amber-900/40 p-2.5 text-sm outline-none focus:border-[#3E9C93]" />
        {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7E8A93] pointer-events-none">{unit}</span>}
      </div>
    </div>
  );
}

function CellIcon({ type }) {
  if (type === "freezer") return <Snowflake className="w-4 h-4 text-[#5b8fb0] shrink-0" />;
  if (type === "frigo") return <Wind className="w-4 h-4 text-[#3E9C93] shrink-0" />;
  return <Thermometer className="w-4 h-4 text-[#3E9C93] shrink-0" />;
}
