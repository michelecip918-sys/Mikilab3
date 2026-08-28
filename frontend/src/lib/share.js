import { mkTri } from "@/i18n/triMaps";
import { toast } from "sonner";

// Condivisione universale: Web Share API (mobile) con fallback copia negli appunti.
export async function shareContent(title, text, lang = "it") {
  const okCopy = mkTri(lang)("Copiato negli appunti", "In die Zwischenablage kopiert", "Copied to clipboard");
  const err = mkTri(lang)("Impossibile condividere", "Teilen nicht möglich", "Unable to share");
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
