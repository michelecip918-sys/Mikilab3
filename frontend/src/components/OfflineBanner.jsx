import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Banner discreto quando manca la rete: rassicura che ricette e piano restano consultabili offline.
export default function OfflineBanner() {
  const { lang } = useLang();
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const [offline, setOffline] = useState(() => typeof navigator !== "undefined" && navigator.onLine === false);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  if (!offline) return null;
  return (
    <div data-testid="offline-banner" className="fixed top-0 left-0 right-0 z-[60] bg-[#F26419] text-white text-[13px] font-semibold px-4 py-2 flex items-center justify-center gap-2 shadow-md">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>{tri(
        "Offline — ricette e piano di produzione salvati sono comunque consultabili.",
        "Offline — gespeicherte Rezepte und Produktionsplan bleiben verfügbar.",
        "Offline — your saved recipes and production plan are still available.",
        "Sin conexión — tus recetas y plan de producción guardados siguen disponibles."
      )}</span>
    </div>
  );
}
