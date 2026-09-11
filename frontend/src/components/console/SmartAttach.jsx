import { useRef, useState } from "react";
import { Paperclip, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { capoApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Allega/Fotografa universale: il Capo allega un PDF/immagine o scatta una foto,
// Sitor la legge e restituisce testo strutturato che viene inserito nel campo (onExtract).
// context = di cosa si tratta (es. "macchina nuova", "ordine cliente").
export default function SmartAttach({ onExtract, context = "", compact = false }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const fileRef = useRef(null);
  const camRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const handle = async (file) => {
    if (!file) return;
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");
    setBusy(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const r = await capoApi.extract({ kind: isPdf ? "pdf" : "image", data_base64: reader.result, context, lang });
        if (r && r.text) { onExtract(r.text, { kind: r.kind }); toast.success(tri("Sitor ha letto e compilato ✓", "Sitor hat gelesen ✓", "Sitor read and filled it in ✓", "Sitor lo leyó ✓", "Sitor a lu ✓", "سیتور خواند ✓")); }
        else toast.error(tri("Non sono riuscito a estrarre nulla.", "Nichts extrahiert.", "Couldn't extract anything.", "No se extrajo nada.", "Rien extrait.", "چیزی استخراج نشد."));
      } catch { toast.error(tri("Lettura non riuscita. Riprova.", "Fehlgeschlagen.", "Reading failed. Retry.", "Fallo.", "Échec.", "خطا.")); }
      setBusy(false);
    };
    reader.onerror = () => { setBusy(false); toast.error(tri("File non leggibile.", "Datei unlesbar.", "Unreadable file.", "Archivo ilegible.", "Fichier illisible.", "فایل ناخوانا.")); };
    reader.readAsDataURL(file);
  };

  return (
    <div data-testid="smart-attach" className="flex items-center gap-2">
      <input ref={fileRef} data-testid="smart-attach-file" type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; handle(f); }} />
      <input ref={camRef} data-testid="smart-attach-cam" type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; handle(f); }} />
      <button type="button" data-testid="smart-attach-file-btn" disabled={busy} onClick={() => fileRef.current?.click()}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0C1019] border border-[#9aa6b2]/40 text-[#9aa6b2] font-bold text-xs active:scale-95 disabled:opacity-50">
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />} {compact ? tri("Allega", "Anhängen", "Attach", "Adjuntar", "Joindre", "پیوست") : tri("Allega PDF/immagine", "PDF/Bild anhängen", "Attach PDF/image", "Adjuntar PDF/imagen", "Joindre PDF/image", "پیوست PDF/عکس")}
      </button>
      <button type="button" data-testid="smart-attach-cam-btn" disabled={busy} onClick={() => camRef.current?.click()}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0C1019] border border-[#9aabb8]/40 text-[#9aabb8] font-bold text-xs active:scale-95 disabled:opacity-50">
        <Camera className="w-3.5 h-3.5" /> {tri("Fotografa", "Foto", "Photo", "Foto", "Photo", "عکس")}
      </button>
    </div>
  );
}
