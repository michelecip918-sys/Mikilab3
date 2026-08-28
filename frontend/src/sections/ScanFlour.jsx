import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Wheat, Gauge, Beaker, Sparkles, Save, Trash2, Archive } from "lucide-react";
import { API, floursApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import DualPhotoButtons from "@/components/DualPhotoButtons";

export default function ScanFlour() {
  const { lang } = useLang();
  const tri = (i, d, e, s) => (lang === "de" ? d : lang === "es" ? (s ?? e ?? i) : lang === "it" ? i : (e ?? i));
  const { user, setAuthOpen } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pantry, setPantry] = useState([]);

  const loadPantry = () => { if (user) floursApi.list().then(setPantry).catch(() => {}); };
  useEffect(() => { loadPantry(); /* eslint-disable-next-line */ }, [user]);

  const saveToPantry = async () => {
    if (!user) { setAuthOpen && setAuthOpen(true); return; }
    if (!result) return;
    setSaving(true);
    try {
      await floursApi.create({
        brand: result.brand || null, product_name: result.product_name || null,
        flour_type: result.flour_type || null, w_index: result.w_index ?? null,
        protein_percent: result.protein_percent ?? null, grain: result.grain || null,
        ideal_use: result.ideal_use || null, absorption_percent: result.absorption_percent ?? null,
        notes: result.notes || null,
      });
      toast.success(tri("Farina salvata in dispensa!", "Mehl im Vorrat gespeichert!", "Flour saved to your pantry!", "¡Harina guardada en la despensa!"));
      loadPantry();
    } catch {
      toast.error(tri("Errore nel salvataggio.", "Fehler beim Speichern.", "Save error.", "Error al guardar."));
    } finally { setSaving(false); }
  };

  const removeFlour = async (id) => {
    try { await floursApi.remove(id); setPantry((p) => p.filter((f) => f.id !== id)); } catch { /* */ }
  };

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

      <div className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] p-6 text-center">
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
        <div data-testid="flour-result" className="mt-4 rounded-2xl bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] p-5">
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
          <button data-testid="flour-save-pantry" onClick={saveToPantry} disabled={saving}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-[#2e8b6f] text-white font-semibold px-5 py-3 rounded-2xl active:scale-98 transition-all disabled:opacity-60">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {tri("Salva in dispensa", "Im Vorrat speichern", "Save to pantry", "Guardar en despensa")}
          </button>
        </div>
      )}

      {pantry.length > 0 && (
        <div data-testid="flour-pantry" className="mt-4 rounded-2xl bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] p-5">
          <div className="flex items-center gap-2 mb-3 text-[#a9772f]">
            <Archive className="w-5 h-5" />
            <h3 className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("La mia dispensa farine", "Mein Mehlvorrat", "My flour pantry", "Mi despensa de harinas")}</h3>
          </div>
          <p className="text-[12px] text-[#7E8A93] mb-3">{tri("Le tue farine salvate: usale come riferimento (forza W e proteine) quando crei una ricetta.", "Deine gespeicherten Mehle: nutze sie als Referenz (W-Kraft und Protein) beim Erstellen eines Rezepts.", "Your saved flours: use them as reference (W strength and protein) when creating a recipe.", "Tus harinas guardadas: úsalas como referencia (fuerza W y proteína) al crear una receta.")}</p>
          <ul className="space-y-2">
            {pantry.map((f) => (
              <li key={f.id} data-testid={`flour-pantry-${f.id}`} className="flex items-center gap-3 rounded-xl bg-[#FAF5EC] dark:bg-[#1F252B] border border-[#E6D8C3] dark:border-[#38424B] px-3.5 py-2.5">
                <Wheat className="w-5 h-5 text-[#a9772f] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#2B303B] dark:text-[#e4eff8] truncate">{f.product_name || f.brand || f.flour_type || tri("Farina", "Mehl", "Flour", "Harina")}</p>
                  <p className="text-[11px] text-[#7E8A93] truncate">
                    {[f.flour_type, f.w_index != null ? `W ${f.w_index}` : null, f.protein_percent != null ? `${f.protein_percent}g prot.` : null].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <button data-testid={`flour-pantry-del-${f.id}`} onClick={() => removeFlour(f.id)} className="text-[#C0574D] p-1.5 shrink-0 active:scale-90"><Trash2 className="w-4 h-4" /></button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
