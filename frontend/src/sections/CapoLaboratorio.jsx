import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { ChefHat, Plus, X, Cog, Snowflake, Wind, Thermometer, Video, Camera, Sparkles } from "lucide-react";
import { API, labConfigApi, recipesApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";

const CELL_TYPES = ["frigo", "freezer", "lievitazione"];

export default function CapoLaboratorio() {
  const { t, lang } = useLang();
  const [mixers, setMixers] = useState([]);
  const [cells, setCells] = useState([]);
  const [staff, setStaff] = useState("");
  const [stdTemp, setStdTemp] = useState(26);
  const [labTemp, setLabTemp] = useState("");
  const [startTime, setStartTime] = useState("05:00");
  const [notes, setNotes] = useState("");
  const [products, setProducts] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [plan, setPlan] = useState("");
  const [generating, setGenerating] = useState(false);

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
      try {
        const [mk, ps] = await Promise.all([recipesApi.list("mikilab"), recipesApi.list("personal")]);
        setRecipes([...(mk || []), ...(ps || [])].sort((a, b) => (a.name || "").localeCompare(b.name || "")));
      } catch { /* */ }
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
    } catch { toast.error(t("toast_save_error")); }
  };

  const tempDelta = labTemp === "" ? null : Number(labTemp) - (Number(stdTemp) || 26);
  const tempMsg = tempDelta == null ? null : Math.abs(tempDelta) < 1 ? t("capo_temp_ok") : tempDelta > 0 ? t("capo_temp_warm") : t("capo_temp_cold");

  const generate = async () => {
    if (products.length === 0) { toast.error(t("capo_no_products")); return; }
    setGenerating(true); setPlan("");
    let sawDone = false;
    try {
      const res = await fetch(`${API}/capo/plan`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: products.map((p) => ({ recipe_id: p.recipe_id || null, name: p.name, quantity: p.qty === "" ? null : Number(p.qty), unit: p.unit })),
          mixers, cells,
          staff: staff === "" ? null : Number(staff),
          start_time: startTime, lab_temp_c: labTemp === "" ? null : Number(labTemp),
          standard_temp_c: Number(stdTemp) || 26, notes, lang,
        }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n"); buffer = parts.pop();
        for (const part of parts) {
          const line = part.replace(/^data: ?/, "").trim();
          if (!line) continue;
          let obj; try { obj = JSON.parse(line); } catch { continue; }
          if (obj.done) { sawDone = true; continue; }
          if (obj.d) setPlan((p) => p + obj.d);
        }
      }
      if (!sawDone) toast.warning(t("capo_plan_incomplete"));
    } catch { toast.error(t("chat_error")); }
    finally { setGenerating(false); }
  };

  return (
    <div className="pb-24">
      <div className="relative rounded-3xl overflow-hidden mb-5 bg-gradient-to-br from-[#B34A26] to-[#8C3A1D] p-6 text-white">
        <div className="absolute top-0 left-0 right-0 flex h-1.5">
          <div className="flex-1 bg-[#009246]" /><div className="flex-1 bg-white" /><div className="flex-1 bg-[#CE2B37]" />
          <div className="flex-1 bg-black" /><div className="flex-1 bg-[#DD0000]" /><div className="flex-1 bg-[#FFCE00]" />
        </div>
        <ChefHat className="w-7 h-7 mb-2" />
        <h1 className="font-display text-2xl font-bold">{t("capo_title")}</h1>
        <p className="text-white/85 text-sm mt-1">{t("capo_sub")}</p>
      </div>

      {/* Attrezzature e celle */}
      <Section icon={<Cog className="w-4 h-4" />} title={t("capo_equip_title")}>
        <p className="text-xs font-bold uppercase tracking-wide text-[#8C7567] mb-1.5">{t("capo_mixers")}</p>
        <div className="space-y-2" data-testid="capo-mixers">
          {mixers.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <input data-testid={`capo-mixer-name-${i}`} value={m.name || ""} placeholder={t("capo_mixer_name")}
                onChange={(e) => setMixers((l) => l.map((x, k) => k === i ? { ...x, name: e.target.value } : x))}
                className="flex-1 min-w-0 bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg p-2 text-sm outline-none focus:border-[#B34A26]" />
              <div className="relative w-24 shrink-0">
                <input data-testid={`capo-mixer-cap-${i}`} type="number" value={m.capacity_kg ?? ""} placeholder={t("capo_mixer_cap")}
                  onChange={(e) => setMixers((l) => l.map((x, k) => k === i ? { ...x, capacity_kg: e.target.value === "" ? "" : Number(e.target.value) } : x))}
                  className="w-full bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg p-2 pr-7 text-sm outline-none focus:border-[#B34A26]" />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#8C7567]">kg</span>
              </div>
              <button onClick={() => setMixers((l) => l.filter((_, k) => k !== i))} className="text-[#B4442A] p-1"><X className="w-4 h-4" /></button>
            </div>
          ))}
          <button data-testid="capo-mixer-add" onClick={() => setMixers((l) => [...l, { name: "", capacity_kg: "" }])} className="text-sm font-medium text-[#B34A26]">+ {t("capo_mixer_add")}</button>
        </div>

        <p className="text-xs font-bold uppercase tracking-wide text-[#8C7567] mb-1.5 mt-4">{t("capo_cells")}</p>
        <div className="space-y-2" data-testid="capo-cells">
          {cells.map((c, i) => (
            <div key={i} className="bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] rounded-xl p-2.5 space-y-2">
              <div className="flex items-center gap-2">
                <CellIcon type={c.type} />
                <input data-testid={`capo-cell-name-${i}`} value={c.name || ""} placeholder={t("capo_cell_name")}
                  onChange={(e) => setCells((l) => l.map((x, k) => k === i ? { ...x, name: e.target.value } : x))}
                  className="flex-1 min-w-0 bg-[#F5EFE6] dark:bg-[#332823] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg p-2 text-sm outline-none focus:border-[#B34A26]" />
                <button onClick={() => setCells((l) => l.filter((_, k) => k !== i))} className="text-[#B4442A] p-1"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex items-center gap-2">
                <select data-testid={`capo-cell-type-${i}`} value={c.type || "lievitazione"}
                  onChange={(e) => setCells((l) => l.map((x, k) => k === i ? { ...x, type: e.target.value } : x))}
                  className="flex-1 bg-[#F5EFE6] dark:bg-[#332823] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg p-2 text-sm outline-none focus:border-[#B34A26]">
                  {CELL_TYPES.map((ct) => <option key={ct} value={ct}>{t(`capo_celltype_${ct}`)}</option>)}
                </select>
                <div className="relative w-20 shrink-0">
                  <input data-testid={`capo-cell-temp-${i}`} type="number" value={c.temp_c ?? ""} placeholder="°C"
                    onChange={(e) => setCells((l) => l.map((x, k) => k === i ? { ...x, temp_c: e.target.value === "" ? "" : Number(e.target.value) } : x))}
                    className="w-full bg-[#F5EFE6] dark:bg-[#332823] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg p-2 pr-6 text-sm outline-none focus:border-[#B34A26]" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#8C7567]">°</span>
                </div>
              </div>
              <input data-testid={`capo-cell-contents-${i}`} value={c.contents || ""} placeholder={t("capo_cell_contents")}
                onChange={(e) => setCells((l) => l.map((x, k) => k === i ? { ...x, contents: e.target.value } : x))}
                className="w-full bg-[#F5EFE6] dark:bg-[#332823] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg p-2 text-sm outline-none focus:border-[#B34A26]" />
            </div>
          ))}
          <button data-testid="capo-cell-add" onClick={() => setCells((l) => [...l, { name: "", type: "lievitazione", temp_c: "", contents: "" }])} className="text-sm font-medium text-[#B34A26]">+ {t("capo_cell_add")}</button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <LabelInput testid="capo-staff" label={t("capo_staff")} type="number" value={staff} onChange={setStaff} />
          <LabelInput testid="capo-std-temp" label={t("capo_std_temp")} type="number" value={stdTemp} onChange={setStdTemp} unit="°C" />
        </div>
        <button data-testid="capo-save-config" onClick={saveConfig} className="mt-3 w-full bg-[#6B8E62] hover:bg-[#5a7a52] text-white font-semibold px-4 py-2.5 rounded-xl active:scale-98 transition-all">
          {t("capo_save_config")}
        </button>
      </Section>

      {/* Prodotti da preparare */}
      <Section icon={<Sparkles className="w-4 h-4" />} title={t("capo_products_title")}>
        <div className="space-y-2" data-testid="capo-products">
          {products.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <select data-testid={`capo-product-recipe-${i}`} value={p.recipe_id || ""}
                onChange={(e) => { const r = recipes.find((x) => x.id === e.target.value); setProducts((l) => l.map((x, k) => k === i ? { ...x, recipe_id: e.target.value, name: r ? r.name : x.name } : x)); }}
                className="flex-1 min-w-0 bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg p-2 text-sm outline-none focus:border-[#B34A26]">
                <option value="">{t("capo_pick_recipe")}</option>
                {recipes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <input data-testid={`capo-product-qty-${i}`} type="number" value={p.qty} placeholder={t("capo_qty")}
                onChange={(e) => setProducts((l) => l.map((x, k) => k === i ? { ...x, qty: e.target.value } : x))}
                className="w-20 shrink-0 bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg p-2 text-sm outline-none focus:border-[#B34A26]" />
              <select data-testid={`capo-product-unit-${i}`} value={p.unit}
                onChange={(e) => setProducts((l) => l.map((x, k) => k === i ? { ...x, unit: e.target.value } : x))}
                className="w-20 shrink-0 bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg p-2 text-sm outline-none focus:border-[#B34A26]">
                <option value="pezzi">{t("capo_unit_pieces")}</option>
                <option value="kg">{t("capo_unit_kg")}</option>
              </select>
              <button onClick={() => setProducts((l) => l.filter((_, k) => k !== i))} className="text-[#B4442A] p-1"><X className="w-4 h-4" /></button>
            </div>
          ))}
          <button data-testid="capo-product-add" onClick={() => setProducts((l) => [...l, { recipe_id: "", name: "", qty: "", unit: "pezzi" }])} className="text-sm font-medium text-[#B34A26] flex items-center gap-1"><Plus className="w-4 h-4" /> {t("capo_add_product")}</button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <LabelInput testid="capo-start-time" label={t("capo_start_time")} type="time" value={startTime} onChange={setStartTime} />
          <LabelInput testid="capo-lab-temp" label={t("capo_lab_temp")} type="number" value={labTemp} onChange={setLabTemp} unit="°C" />
        </div>
        {tempMsg && (
          <div data-testid="capo-temp-msg" className={`mt-2 text-sm rounded-xl px-3 py-2 border ${tempDelta && Math.abs(tempDelta) >= 1 ? "bg-[#D99B26]/15 border-[#D99B26]/40 text-[#8C3A1D] dark:text-[#E5AC3A]" : "bg-[#6B8E62]/12 border-[#6B8E62]/30 text-[#4d6b45] dark:text-[#9ec48f]"}`}>
            <Thermometer className="w-4 h-4 inline mr-1" />{tempMsg}
          </div>
        )}
        <div className="mt-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">{t("capo_notes")}</label>
          <textarea data-testid="capo-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            className="mt-1 w-full bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] rounded-xl p-3 text-sm outline-none focus:border-[#B34A26] resize-none" />
        </div>

        <button data-testid="capo-generate" onClick={generate} disabled={generating}
          className="mt-3 w-full bg-[#B34A26] hover:bg-[#963B1C] disabled:opacity-50 text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2">
          <ChefHat className="w-5 h-5" /> {generating ? t("capo_generating") : t("capo_generate")}
        </button>

        {plan && (
          <div data-testid="capo-plan" className="markdown-body mt-4 bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-5 text-sm leading-relaxed text-[#2C221E] dark:text-[#F5EFE6]">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#B34A26] mb-2">{t("capo_plan_title")}</p>
            <ReactMarkdown>{plan}</ReactMarkdown>
          </div>
        )}
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
    const b64 = c.toDataURL("image/jpeg", 0.8);
    setAnalyzing(true); setResult("");
    try {
      const res = await fetch(`${API}/maestro/vision`, {
        method: "POST", headers: { "Content-Type": "application/json" },
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
    <div className="mt-4 rounded-2xl bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] p-4">
      <div className="flex items-center gap-2 mb-1">
        <Video className="w-4 h-4 text-[#B34A26]" />
        <h2 className="font-display text-base font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{t("capo_film_title")}</h2>
      </div>
      <p className="text-sm text-[#8C7567] mb-3">{t("capo_film_hint")}</p>

      {!open ? (
        <button data-testid="capo-film-start" onClick={start} className="w-full bg-[#F5EFE6] dark:bg-[#332823] border border-[#E8DEC8] dark:border-[#3D302A] rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 text-[#2C221E] dark:text-[#F5EFE6]">
          <Camera className="w-4 h-4 text-[#B34A26]" /> {t("capo_film_start")}
        </button>
      ) : (
        <div>
          <div className="rounded-2xl overflow-hidden border border-[#E8DEC8] dark:border-[#3D302A] bg-black">
            <video ref={videoRef} data-testid="capo-video" playsInline muted className="w-full max-h-72 object-cover" />
          </div>
          <div className="flex gap-2 mt-2">
            <button data-testid="capo-film-snap" onClick={snap} disabled={analyzing} className="flex-1 bg-[#B34A26] hover:bg-[#963B1C] disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2">
              <Camera className="w-4 h-4" /> {analyzing ? t("capo_film_analyzing") : t("capo_film_snap")}
            </button>
            <button data-testid="capo-film-stop" onClick={stop} className="bg-[#F5EFE6] dark:bg-[#332823] border border-[#E8DEC8] dark:border-[#3D302A] px-4 py-2.5 rounded-xl font-medium text-[#2C221E] dark:text-[#F5EFE6]">
              {t("capo_film_stop")}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div data-testid="capo-film-result" className="markdown-body mt-4 bg-[#F5EFE6] dark:bg-[#332823] rounded-2xl p-4 text-sm leading-relaxed text-[#2C221E] dark:text-[#F5EFE6]">
          <ReactMarkdown>{result}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 rounded-2xl bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] p-4">
      <div className="flex items-center gap-2 mb-3 text-[#B34A26]">
        {icon}
        <h2 className="font-display text-base font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

function LabelInput({ testid, label, type, value, onChange, unit }) {
  return (
    <div>
      <label className="text-[10px] font-semibold uppercase tracking-wide text-[#8C7567]">{label}</label>
      <div className="relative mt-1">
        <input data-testid={testid} type={type} value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] rounded-xl p-2.5 text-sm outline-none focus:border-[#B34A26]" />
        {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8C7567] pointer-events-none">{unit}</span>}
      </div>
    </div>
  );
}

function CellIcon({ type }) {
  if (type === "freezer") return <Snowflake className="w-4 h-4 text-[#5b8fb0] shrink-0" />;
  if (type === "frigo") return <Wind className="w-4 h-4 text-[#6B8E62] shrink-0" />;
  return <Thermometer className="w-4 h-4 text-[#B34A26] shrink-0" />;
}
