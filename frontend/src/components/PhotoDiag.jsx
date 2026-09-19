import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Camera, X, Loader2, Sparkles } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { useFeatures } from "@/lib/features";
import { api } from "@/lib/api";

// STADIO H — "Com'è venuto?": la foto è ridotta a max 1024px e ricodificata in JPEG
// (via canvas → toglie i metadati EXIF). Ogni volta si mostra il consenso. La foto
// non viene salvata da nessuna parte: si invia, si riceve la risposta e si scarta.
async function fileToJpegBase64(file, maxSide = 1024) {
  const dataUrl = await new Promise((res, rej) => {
    const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(file);
  });
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl; });
  let { width: w, height: h } = img;
  if (w > maxSide || h > maxSide) { const r = maxSide / Math.max(w, h); w = Math.round(w * r); h = Math.round(h * r); }
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  c.getContext("2d").drawImage(img, 0, 0, w, h);
  return c.toDataURL("image/jpeg", 0.85);
}

export default function PhotoDiag({ level = "casa", compact = false }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const features = useFeatures();
  const fileRef = useRef(null);
  const [pending, setPending] = useState(null); // dataUrl in attesa di consenso
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  if (!features || features.FEATURE_PHOTO_DIAG !== true) return null;

  const onPick = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    try { const b64 = await fileToJpegBase64(f); setPending(b64); setResult(null); }
    catch { /* immagine non valida */ }
  };

  const send = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      const r = await api.post(`/sitor/photo`, { image_base64: pending, lang, level });
      setResult(r.data || { ok: false });
    } catch {
      setResult({ ok: false, reply: tri("Riprova tra poco.", "Versuch es gleich nochmal.", "Try again shortly.") });
    } finally { setBusy(false); setPending(null); }
  };

  return (
    <>
      <button data-testid="photo-diag-btn" onClick={() => fileRef.current && fileRef.current.click()}
        className={`inline-flex items-center gap-2 rounded-xl font-bold active:scale-95 transition-all border border-primary/40 bg-primary/10 text-foreground ${compact ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm"}`}>
        <Camera className="w-4 h-4 text-primary" /> {tri("Com'è venuto?", "Wie ist es geworden?", "How did it turn out?")}
      </button>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onPick} className="hidden" data-testid="photo-diag-input" />

      {pending && createPortal((
        <div data-testid="photo-diag-consent" className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center bg-background/70 backdrop-blur-sm p-3" onClick={() => setPending(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl overflow-hidden border border-primary/40 bg-background shadow-2xl">
            <img src={pending} alt="" className="w-full h-48 object-cover" />
            <div className="p-4 space-y-3">
              <p className="text-[13px] text-foreground leading-relaxed">{tri(
                "La foto viene inviata a un servizio di IA per l'analisi e non viene salvata. Non inviare foto con persone.",
                "Das Foto wird zur Analyse an einen KI-Dienst gesendet und nicht gespeichert. Schicke keine Fotos mit Personen.",
                "The photo is sent to an AI service for analysis and is not saved. Don't send photos with people.")}</p>
              <div className="flex gap-2">
                <button data-testid="photo-diag-cancel" onClick={() => setPending(null)} className="flex-1 py-2.5 rounded-xl bg-foreground/10 text-foreground font-bold text-sm active:scale-95">{tri("Annulla", "Abbrechen", "Cancel")}</button>
                <button data-testid="photo-diag-send" onClick={send} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-95 disabled:opacity-50 inline-flex items-center justify-center gap-2">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}{tri("Invia a Sitor", "An Sitor senden", "Send to Sitor")}
                </button>
              </div>
            </div>
          </div>
        </div>
      ), document.body)}

      {result && createPortal((
        <div data-testid="photo-diag-result" className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center bg-background/70 backdrop-blur-sm p-3" onClick={() => setResult(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-primary/40 bg-background shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
              <p className="font-display font-black text-foreground">{tri("Com'è venuto?", "Wie ist es geworden?", "How did it turn out?")}</p>
              <button data-testid="photo-diag-close" onClick={() => setResult(null)} className="p-2 rounded-full bg-foreground/10 active:scale-90 text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              {result.is_bread && Array.isArray(result.observations) ? (<>
                <ul className="space-y-2">
                  {result.observations.map((o, i) => (
                    <li key={i} data-testid={`photo-diag-obs-${i}`} className="flex items-start gap-2 text-[14px] text-foreground"><span className="text-primary font-black">•</span>{o}</li>
                  ))}
                </ul>
                {result.correction && (
                  <div data-testid="photo-diag-correction" className="rounded-xl bg-primary/10 border border-primary/30 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-primary mb-1">{tri("Per la prossima volta", "Fürs nächste Mal", "For next time")}</p>
                    <p className="text-[14px] text-foreground">{result.correction}</p>
                  </div>
                )}
              </>) : (
                <p className="text-[14px] text-foreground">{result.reply || tri("Non riesco a leggere la foto.", "Ich kann das Foto nicht lesen.", "I can't read the photo.")}</p>
              )}
            </div>
          </div>
        </div>
      ), document.body)}
    </>
  );
}
