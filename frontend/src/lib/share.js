import { toast } from "sonner";

// Condivisione universale: Web Share API (mobile) con fallback copia negli appunti.
export async function shareContent(title, text, lang = "it") {
  const okCopy = lang === "de" ? "In die Zwischenablage kopiert" : lang === "en" ? "Copied to clipboard" : "Copiato negli appunti";
  const err = lang === "de" ? "Teilen nicht möglich" : lang === "en" ? "Unable to share" : "Impossibile condividere";
  try {
    if (navigator.share) { await navigator.share({ title, text }); return; }
  } catch (e) {
    if (e && e.name === "AbortError") return; // utente ha annullato
  }
  try {
    await navigator.clipboard.writeText(`${title}\n\n${text}`);
    toast.success(okCopy);
  } catch {
    toast.error(err);
  }
}
