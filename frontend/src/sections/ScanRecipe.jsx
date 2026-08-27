import { useState, useRef } from "react";
import { toast } from "sonner";
import { Camera, Loader2, ScanLine, PenLine, Upload } from "lucide-react";
import { API, recipesApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import RecipeDialog from "@/components/RecipeDialog";
import DualPhotoButtons from "@/components/DualPhotoButtons";

export default function ScanRecipe({ embedded = false }) {
  const { t, lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : (lang === "en" || lang === "es") ? e : i);
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileRef = useRef(null);

  const onPhoto = (file) => {
    if (!file) return;
    setLoading(true);
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
          const res = await fetch(`${API}/maestro/scan-recipe`, {
            method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
            body: JSON.stringify({ image_base64: b64, lang }),
          });
          if (!res.ok) throw new Error();
          const data = await res.json();
          setScanned(data);
          setDialogOpen(true);
          toast.success(t("scan_done"));
        } catch {
          toast.error(t("scan_error"));
        } finally {
          setLoading(false);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (payload) => {
    try {
      await recipesApi.create({ ...payload, collection_name: "personal" });
      toast.success(t("toast_saved"));
      setDialogOpen(false);
      setScanned(null);
    } catch {
      toast.error(t("toast_save_error"));
    }
  };

  return (
    <div className={embedded ? "" : "pb-24"}>
      {embedded ? (
        <div className="flex items-center gap-2 mb-2 text-[#3f7cac]">
          <ScanLine className="w-4 h-4" />
          <h2 className="font-display text-base font-semibold text-[#2B303B] dark:text-[#e4eff8]">{t("scan_title")}</h2>
        </div>
      ) : (
        <div className="relative rounded-3xl overflow-hidden mb-5 bg-gradient-to-br from-[#3f7cac] to-[#234b6e] p-6 text-white">
          <div className="absolute top-0 left-0 right-0 flex h-1.5">
            <div className="flex-1 bg-[#5aa0cf]" /><div className="flex-1 bg-white" /><div className="flex-1 bg-[#6E8CA0]" />
            <div className="flex-1 bg-black" /><div className="flex-1 bg-[#6E8CA0]" /><div className="flex-1 bg-[#A9C5D4]" />
          </div>
          <ScanLine className="w-7 h-7 mb-2" />
          <h1 className="font-display text-2xl font-bold">{t("scan_title")}</h1>
          <p className="text-white/85 text-sm mt-1">{t("scan_sub")}</p>
        </div>
      )}

      <div className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] p-6 text-center">
        <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] mb-4">{t("scan_hint")}</p>
        {loading ? (
          <div data-testid="scan-loading" className="inline-flex items-center gap-2 bg-[#3f7cac] text-white font-semibold px-5 py-3.5 rounded-2xl opacity-70">
            <Loader2 className="w-5 h-5 animate-spin" /> {t("scan_reading")}
          </div>
        ) : (
          <DualPhotoButtons onFile={onPhoto} testid="scan" />
        )}
        {!loading && (
          <div className="mt-4 pt-4 border-t border-[#d5e4f0] dark:border-[#38424B]">
            {/* Carica da file dal PC (o dall'allegato ricevuto via email): immagini/scansioni delle ricette */}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onPhoto(f); e.target.value = ""; }} />
            <button data-testid="scan-upload-file-btn" onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 bg-[#2e8b6f] text-white font-semibold px-5 py-3 rounded-2xl active:scale-97 transition-all mb-3">
              <Upload className="w-5 h-5" /> {tri("Carica dal PC / da email", "Vom PC / aus E-Mail laden", "Upload from PC / email")}
            </button>
            <p className="text-[11px] text-[#7E8A93] mb-3">{tri("Hai già le ricette in una cartella del computer o ricevute via email? Caricale qui: le leggo io e le trasformo in scheda.", "Hast du Rezepte in einem PC-Ordner oder per E-Mail erhalten? Lade sie hier hoch: ich lese sie und erstelle die Karte.", "Got recipes in a folder on your PC or received by email? Upload them here: I'll read them and turn them into a recipe card.")}</p>
            <p className="text-xs text-[#7E8A93] mb-2">{tri("Oppure scrivi la ricetta a mano da zero:", "Oder schreibe das Rezept von Hand:", "Or write the recipe by hand from scratch:")}</p>
            <button data-testid="scan-manual-btn" onClick={() => { setScanned(null); setDialogOpen(true); }}
              className="inline-flex items-center gap-2 bg-white dark:bg-[#232A31] text-[#234b6e] dark:text-[#e4eff8] font-semibold px-5 py-3 rounded-2xl border-2 border-[#3f7cac]/40 active:scale-97 transition-all">
              <PenLine className="w-5 h-5 text-[#3f7cac]" /> {tri("Scrivi a mano", "Von Hand schreiben", "Write by hand")}
            </button>
          </div>
        )}
      </div>

      <RecipeDialog open={dialogOpen} onOpenChange={setDialogOpen} initial={scanned} onSave={handleSave} />
    </div>
  );
}
