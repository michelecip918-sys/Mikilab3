import { useState } from "react";
import { Sparkles, Download, Loader2, Image as ImageIcon, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { toast } from "sonner";

const PUB = process.env.PUBLIC_URL;

// FORGIA DI SITOR — il Capo dà solo un'idea; Sitor (dio dell'arte bianca) forgia l'immagine.
export default function ImageForge() {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [prompt, setPrompt] = useState("");
  const [img, setImg] = useState(null);
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    try {
      const r = await api.post("/image/generate", { prompt: prompt.trim(), lang }, { timeout: 90000 });
      const b64 = r.data && r.data.image_base64;
      if (!b64) throw new Error("no-image");
      setImg(`data:image/png;base64,${b64}`);
      toast.success(tri("Immagine generata.", "Bild erzeugt.", "Image generated.", "Imagen generada.", "Image générée.", "تصویر ساخته شد."));
    } catch (e) {
      toast.error(tri("Generazione non riuscita. Riprova con una descrizione più precisa.", "Erzeugung fehlgeschlagen. Versuche eine genauere Beschreibung.", "Generation failed. Try a clearer description.", "Generación fallida. Prueba con una descripción más clara.", "Échec de la génération. Essaie une description plus précise.", "ناموفق. توضیح دقیق‌تری بده."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="image-forge" className="space-y-3">
      <div className="flex items-center gap-2.5">
        <img src={`${PUB}/sitor_official.webp`} alt="Sitor" className="w-10 h-10 rounded-xl object-cover object-top border border-border/50" />
        <div>
          <p className="text-sm font-black text-foreground uppercase tracking-wide flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-muted-foreground" /> {tri("Generatore Immagini · Sitor", "Bildgenerator · Sitor", "Image Generator · Sitor", "Generador de Imágenes · Sitor", "Générateur d'Images · Sitor", "تولید تصویر · سیتور")}</p>
          <p className="text-[11px] text-muted-foreground">{tri("Descrivi l'immagine che ti serve: Sitor la genera per te.", "Beschreibe das gewünschte Bild: Sitor erzeugt es.", "Describe the image you need: Sitor generates it for you.", "Describe la imagen que necesitas: Sitor la genera.", "Décris l'image dont tu as besoin : Sitor la génère.", "تصویر موردنیاز را توصیف کن: سیتور آن را می‌سازد.")}</p>
        </div>
      </div>
      <textarea
        data-testid="image-forge-prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={2}
        placeholder={tri("es. una pagnotta di farro con crosta dorata su tavolo di legno, luce del forno", "z.B. ein Dinkelbrot mit goldener Kruste", "e.g. a spelt loaf with golden crust on wood, oven light", "ej. un pan de espelta con corteza dorada", "ex. un pain d'épeautre à croûte dorée", "مثلاً یک نان جو با پوسته طلایی")}
        className="w-full rounded-xl bg-background border border-border focus:border-border/60 outline-none text-sm text-foreground p-3 resize-none"
      />
      <button
        data-testid="image-forge-generate"
        onClick={generate}
        disabled={busy || !prompt.trim()}
        className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-display font-black text-sm text-foreground active:scale-95 transition-all disabled:opacity-50"
        style={{ background: "linear-gradient(90deg,hsl(var(--muted-foreground)),hsl(var(--muted-foreground)))", boxShadow: "0 0 20px rgba(166,177,188,0.35)" }}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {busy ? tri("Sitor sta forgiando… (fino a 1 min)", "Sitor schmiedet…", "Sitor is forging… (up to 1 min)", "Sitor está forjando…", "Sitor forge…", "سیتور در حال ساخت…") : tri("Forgia immagine", "Bild schmieden", "Forge image", "Forjar imagen", "Forger l'image", "بساز")}
      </button>

      {img && (
        <div data-testid="image-forge-result" className="rounded-2xl overflow-hidden border border-border/40 bg-background">
          <img src={img} alt="Sitor" className="w-full h-auto block" />
          <div className="flex gap-2 p-2.5">
            <a data-testid="image-forge-download" href={img} download="sitor.png" className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-background border border-border text-muted-foreground text-xs font-bold active:scale-95"><Download className="w-4 h-4" /> {tri("Scarica", "Laden", "Download", "Descargar", "Télécharger", "دانلود")}</a>
            <button data-testid="image-forge-again" onClick={() => setImg(null)} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-background border border-border text-muted-foreground text-xs font-bold active:scale-95"><RefreshCw className="w-4 h-4" /> {tri("Nuova", "Neu", "New", "Nueva", "Nouvelle", "جدید")}</button>
          </div>
        </div>
      )}
      {!img && !busy && (
        <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><ImageIcon className="w-3.5 h-3.5" /> {tri("Prodotti, ricette, avatar, marketing: un'idea e Sitor crea.", "Produkte, Rezepte, Avatare, Marketing.", "Products, recipes, avatars, marketing: one idea and Sitor creates.", "Productos, recetas, avatares.", "Produits, recettes, avatars.", "محصول، دستور، آواتار.")}</p>
      )}
    </div>
  );
}
