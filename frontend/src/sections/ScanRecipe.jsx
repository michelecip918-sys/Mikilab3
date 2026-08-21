import { useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2, ScanLine } from "lucide-react";
import { API, recipesApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import RecipeDialog from "@/components/RecipeDialog";
import DualPhotoButtons from "@/components/DualPhotoButtons";

export default function ScanRecipe() {
  const { t, lang } = useLang();
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    <div className="pb-24">
      <div className="relative rounded-3xl overflow-hidden mb-5 bg-gradient-to-br from-[#B34A26] to-[#8C3A1D] p-6 text-white">
        <div className="absolute top-0 left-0 right-0 flex h-1.5">
          <div className="flex-1 bg-[#008C45]" /><div className="flex-1 bg-white" /><div className="flex-1 bg-[#CD212A]" />
          <div className="flex-1 bg-black" /><div className="flex-1 bg-[#DD0000]" /><div className="flex-1 bg-[#FFCC00]" />
        </div>
        <ScanLine className="w-7 h-7 mb-2" />
        <h1 className="font-display text-2xl font-bold">{t("scan_title")}</h1>
        <p className="text-white/85 text-sm mt-1">{t("scan_sub")}</p>
      </div>

      <div className="rounded-2xl bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] p-6 text-center">
        <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] mb-4">{t("scan_hint")}</p>
        {loading ? (
          <div data-testid="scan-loading" className="inline-flex items-center gap-2 bg-[#B34A26] text-white font-semibold px-5 py-3.5 rounded-2xl opacity-70">
            <Loader2 className="w-5 h-5 animate-spin" /> {t("scan_reading")}
          </div>
        ) : (
          <DualPhotoButtons onFile={onPhoto} testid="scan" />
        )}
      </div>

      <RecipeDialog open={dialogOpen} onOpenChange={setDialogOpen} initial={scanned} onSave={handleSave} />
    </div>
  );
}
