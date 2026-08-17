import { useRef, useState } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Camera, Bug, Sparkles, Upload, RefreshCw } from "lucide-react";
import { API } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";

// Downscale + compress an image file to a base64 JPEG (keeps payload small)
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
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PhotoDiagnosi() {
  const [mode, setMode] = useState("difetti");
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const fileRef = useRef(null);
  const { t, lang } = useLang();

  const MODES = [
    { id: "difetti", label: t("photo_mode_defects"), desc: t("photo_mode_defects_desc"), Icon: Bug },
    { id: "ingredienti", label: t("photo_mode_ing"), desc: t("photo_mode_ing_desc"), Icon: Sparkles },
  ];

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await fileToCompressedBase64(file);
      setPreview(b64);
      setResult("");
    } catch {
      toast.error(t("toast_img_error"));
    }
  };

  const analyze = async () => {
    if (!preview || analyzing) return;
    setAnalyzing(true);
    setResult("");
    try {
      const res = await fetch(`${API}/maestro/vision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, image_base64: preview, lang }),
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
          let obj;
          try { obj = JSON.parse(line); } catch { continue; }
          if (obj.done) continue;
          if (obj.d) setResult((r) => r + obj.d);
        }
      }
    } catch {
      toast.error(t("toast_analyze_error"));
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="pb-4">
      <div className="relative rounded-3xl overflow-hidden mb-5 bg-gradient-to-br from-[#B34A26] to-[#8C3A1D] p-6 text-white">
        <Camera className="w-7 h-7 mb-2" />
        <h1 className="font-display text-2xl font-bold">{t("photo_title")}</h1>
        <p className="text-white/85 text-sm mt-1">{t("photo_subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-5">
        {MODES.map(({ id, label, desc, Icon }) => (
          <button
            key={id}
            data-testid={`photo-mode-${id}`}
            onClick={() => { setMode(id); setResult(""); }}
            className={`flex flex-col items-start gap-1 p-3.5 rounded-2xl border text-left transition-all ${
              mode === id
                ? "bg-[#B34A26] text-white border-[#B34A26]"
                : "bg-white dark:bg-[#2A211D] text-[#2C221E] dark:text-[#F5EFE6] border-[#E8DEC8] dark:border-[#3D302A]"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-semibold text-sm">{label}</span>
            <span className={`text-xs ${mode === id ? "text-white/80" : "text-[#8C7567]"}`}>{desc}</span>
          </button>
        ))}
      </div>

      <input ref={fileRef} data-testid="photo-file-input" type="file" accept="image/*" capture="environment" onChange={onPick} className="hidden" />

      {preview ? (
        <div className="rounded-3xl overflow-hidden border border-[#E8DEC8] dark:border-[#3D302A] mb-4 relative">
          <img src={preview} alt="anteprima" className="w-full max-h-80 object-cover" />
          <button
            data-testid="photo-change-btn"
            onClick={() => fileRef.current?.click()}
            className="absolute top-3 right-3 bg-black/50 text-white text-sm px-3 py-1.5 rounded-full flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> {t("photo_change")}
          </button>
        </div>
      ) : (
        <button
          data-testid="photo-upload-btn"
          onClick={() => fileRef.current?.click()}
          className="w-full mb-4 border-2 border-dashed border-[#E8DEC8] dark:border-[#3D302A] rounded-3xl py-12 flex flex-col items-center gap-2 text-[#8C7567]"
        >
          <Upload className="w-8 h-8 text-[#D99B26]" />
          <span className="font-medium">{t("photo_upload")}</span>
        </button>
      )}

      <button
        data-testid="photo-analyze-btn"
        onClick={analyze}
        disabled={!preview || analyzing}
        className="w-full bg-[#B34A26] hover:bg-[#963B1C] disabled:opacity-50 text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
      >
        {analyzing ? t("photo_analyzing") : t("photo_analyze")}
      </button>

      {result && (
        <div data-testid="photo-result" className="markdown-body mt-5 bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-5 text-sm leading-relaxed text-[#2C221E] dark:text-[#F5EFE6]">
          <ReactMarkdown>{result}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
