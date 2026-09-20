import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Avviso microfono (T2): sempre visibile accanto ai pulsanti che attivano il riconoscimento vocale.
export const MicNotice = ({ className = "" }) => {
  const { lang } = useLang();
  return (
    <p data-testid="mic-notice" className={`text-[10px] text-muted-foreground leading-snug ${className}`}>
      {mkTri(lang)(
        "Riconoscimento vocale del tuo browser (Google o Apple): l'audio può essere elaborato dai loro server. Parte solo dopo un tocco.",
        "Spracherkennung deines Browsers (Google oder Apple): Das Audio kann auf deren Servern verarbeitet werden. Startet nur nach einem Tippen.",
        "Speech recognition by your browser (Google or Apple): audio may be processed on their servers. Starts only after a tap."
      )}
    </p>
  );
};
