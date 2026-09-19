import { useState, useEffect, useRef } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { siteSettingsApi } from "@/lib/api";
import QRCode from "qrcode";
import { toast } from "sonner";
import { ChevronLeft, Download, Share2, Copy, Music2 } from "lucide-react";

export default function RegalaPage({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [settings, setSettings] = useState({});
  const canvasRef = useRef(null);

  useEffect(() => { siteSettingsApi.get().then(setSettings).catch(() => {}); }, []);
  const siteUrl = settings.site_url || "https://mikilab.de";
  const handle = (settings.tiktok_handle || "").trim();

  const shareText = tri(
    `Ho scoperto MikiLab: ricette di pane passo dopo passo con una guida IA, gratis: ${siteUrl}`,
    `Ich habe MikiLab entdeckt: Brotrezepte Schritt für Schritt mit einem KI-Guide, kostenlos: ${siteUrl}`,
    `I discovered MikiLab: bread recipes step by step with an AI guide, free: ${siteUrl}`);

  useEffect(() => {
    if (canvasRef.current) QRCode.toCanvas(canvasRef.current, siteUrl, { width: 220, margin: 2, color: { dark: "hsl(var(--secondary))", light: "hsl(var(--foreground))" } }).catch(() => {});
  }, [siteUrl]);

  const downloadQr = () => {
    try { const url = canvasRef.current.toDataURL("image/png"); const a = document.createElement("a"); a.href = url; a.download = "mikilab-qr.png"; a.click(); }
    catch { toast.error(tri("Errore", "Fehler", "Error")); }
  };
  const copyText = async () => { try { await navigator.clipboard.writeText(shareText); toast.success(tri("Testo copiato", "Text kopiert", "Text copied")); } catch { /* */ } };
  const doShare = async () => {
    if (navigator.share) { try { await navigator.share({ title: "MikiLab", text: shareText, url: siteUrl }); } catch { /* */ } }
    else { try { await navigator.clipboard.writeText(siteUrl); toast.success(tri("Link copiato", "Link kopiert", "Link copied")); } catch { /* */ } }
  };

  return (
    <div data-testid="regala-page" className="space-y-6 max-w-md mx-auto">
      {onBack && <button onClick={onBack} className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground"><ChevronLeft className="w-4 h-4" />{tri("Home", "Start", "Home")}</button>}
      <div className="text-center">
        <h1 className="font-display text-3xl font-black text-foreground">{tri("Regala MikiLab", "MikiLab verschenken", "Gift MikiLab")}</h1>
        <p className="text-muted-foreground mt-1">{tri("Condividi il pane buono con chi vuoi.", "Teile gutes Brot mit wem du willst.", "Share good bread with whoever you like.")}</p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 flex flex-col items-center gap-3">
        <canvas ref={canvasRef} data-testid="regala-qr" />
        <p className="text-foreground font-mono text-sm break-all text-center">{siteUrl}</p>
        <button data-testid="regala-download-qr" onClick={downloadQr} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-bold active:scale-95"><Download className="w-4 h-4" />{tri("Scarica il QR da stampare", "QR zum Drucken laden", "Download QR to print")}</button>
      </div>
      <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
        <p className="text-sm text-foreground">{shareText}</p>
        <div className="flex flex-wrap gap-2">
          <button data-testid="regala-copy" onClick={copyText} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-foreground/10 text-foreground text-sm font-bold active:scale-95"><Copy className="w-4 h-4" />{tri("Copia testo", "Text kopieren", "Copy text")}</button>
          <button data-testid="regala-share" onClick={doShare} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-bold active:scale-95"><Share2 className="w-4 h-4" />{tri("Condividi", "Teilen", "Share")}</button>
          {handle && <a data-testid="regala-tiktok" href={`https://www.tiktok.com/@${handle}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-background text-foreground text-sm font-bold active:scale-95"><Music2 className="w-4 h-4" />TikTok</a>}
        </div>
      </div>
    </div>
  );
}
