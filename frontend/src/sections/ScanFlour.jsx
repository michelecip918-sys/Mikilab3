import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Wheat, Gauge, Beaker, Sparkles } from "lucide-react";
import { API } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import DualPhotoButtons from "@/components/DualPhotoButtons";

export default function ScanFlour() {
  const { lang } = useLang();
  const tri = (i, d, e, s) => (lang === "de" ? d : lang === "es" ? (s ?? e ?? i) : lang === "en" ? (e ?? i) : i);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const onPhoto = (file) => {
    if (!file) return;
    setLoading(true);
    setResult(null);
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
          if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || ""); }
          setResult(await res.json());
          toast.success(tri("Farina analizzata!", "Mehl analysiert!", "Flour analyzed!", "¡Harina analizada!"));
        } catch (err) {
          toast.error(err?.message || tri("Non sono riuscito a leggere l'etichetta.", "Etikett konnte nicht gelesen werden.", "Couldn't read the label.", "No pude leer la etiqueta."));
        } finally { setLoading(false); }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const Field = ({ label, value, Icon }) => (
    <div className="flex items-start gap-2.5 py-2 border-b border-[#eef4f9] dark:border-[#38424B] last:border-0">
      {Icon && <Icon className="w-4 h-4 text-[#a9772f] mt-0.5 shrink-0" />}
      <span className="text-[13px] text-[#7E8A93] w-32 shrink-0">{label}</span>
      <span className="text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8] flex-1">{value || "—"}</span>
    </div>
  );

  return (
    <div className="pb-24" data-testid="scan-flour">
      <div className="relative rounded-3xl overflow-hidden mb-5 bg-gradient-to-br from-[#a9772f] to-[#6b4a1c] p-6 text-white">
        <Wheat className="w-7 h-7 mb-2" />
        <h1 className="font-display text-2xl font-bold">{tri("Scanner Farina", "Mehl-Scanner", "Flour Scanner", "Escáner de Harina")}</h1>
        <p className="text-white/85 text-sm mt-1">{tri("Fotografa il sacco: leggo forza W, proteine e tipo.", "Fotografiere den Sack: ich lese W-Kraft, Protein und Typ.", "Photograph the bag: I read W strength, protein and type.", "Fotografía el saco: leo fuerza W, proteína y tipo.")}</p>
      </div>

      <div className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] p-6 text-center">
        <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] mb-4">{tri("Inquadra l'etichetta o la scheda tecnica della farina.", "Richte die Kamera auf das Etikett oder das Datenblatt.", "Frame the label or the flour's technical sheet.", "Enfoca la etiqueta o la ficha técnica.")}</p>
        {loading ? (
          <div data-testid="flour-loading" className="inline-flex items-center gap-2 bg-[#a9772f] text-white font-semibold px-5 py-3.5 rounded-2xl opacity-70">
            <Loader2 className="w-5 h-5 animate-spin" /> {tri("Sto leggendo…", "Ich lese…", "Reading…", "Leyendo…")}
          </div>
        ) : (
          <DualPhotoButtons onFile={onPhoto} testid="flour" />
        )}
      </div>

      {result && (
        <div data-testid="flour-result" className="mt-4 rounded-2xl bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] p-5">
          <div className="flex items-center gap-2 mb-3 text-[#a9772f]">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-display text-base font-bold text-[#2B303B] dark:text-[#e4eff8]">
              {result.product_name || result.brand || tri("Dati farina", "Mehl-Daten", "Flour data", "Datos de harina")}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <Field label={tri("Marca", "Marke", "Brand", "Marca")} value={result.brand} />
            <Field label={tri("Tipo", "Typ", "Type", "Tipo")} value={result.flour_type} Icon={Wheat} />
            <Field label={tri("Forza W", "W-Kraft", "W strength", "Fuerza W")} value={result.w_index != null ? `W ${result.w_index}` : null} Icon={Gauge} />
            <Field label={tri("Proteine", "Protein", "Protein", "Proteína")} value={result.protein_percent != null ? `${result.protein_percent} g/100g` : null} Icon={Beaker} />
            <Field label={tri("Cereale", "Getreide", "Grain", "Cereal")} value={result.grain} />
            <Field label={tri("Assorbimento", "Wasseraufnahme", "Absorption", "Absorción")} value={result.absorption_percent != null ? `${result.absorption_percent}%` : null} />
          </div>
          {result.ideal_use && (
            <div className="mt-3 rounded-xl bg-[#a9772f]/10 border border-[#a9772f]/25 p-3">
              <p className="text-[12px] font-bold text-[#8a5a2b] uppercase tracking-wide mb-0.5">{tri("Uso ideale", "Ideale Verwendung", "Ideal use", "Uso ideal")}</p>
              <p className="text-sm text-[#2B303B] dark:text-[#e4eff8]">{result.ideal_use}</p>
            </div>
          )}
          {result.notes && (
            <p className="mt-3 text-[13px] text-[#7E8A93] leading-relaxed whitespace-pre-line">{result.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}
