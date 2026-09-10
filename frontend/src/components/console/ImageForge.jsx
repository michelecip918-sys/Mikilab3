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
      toast.success(tri("Sitor ha forgiato l'immagine.", "Sitor hat das Bild geschmiedet.", "Sitor forged the image.", "Sitor forjó la imagen.", "Sitor a forgé l'image.", "سیتور تصویر را ساخت."));
    } catch (e) {
      toast.error(tri("Forgia fallita. Riprova con un'idea più chiara.", "Schmieden fehlgeschlagen.", "Forge failed. Try a clearer idea.", "Falló. Reintenta.", "Échec. Réessaie.", "ناموفق. دوباره تلاش کن."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="image-forge" className="space-y-3">
      <div className="flex items-center gap-2.5">
        <img src={`${PUB}/avatar_sitor.jpg`} alt="Sitor" className="w-10 h-10 rounded-xl object-cover object-top border border-[#EAB308]/50" />
        <div>
          <p className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-[#EAB308]" /> {tri("Forgia di Sitor", "Sitors Schmiede", "Sitor's Forge", "Forja de Sitor", "Forge de Sitor", "کارگاه سیتور")}</p>
          <p className="text-[11px] text-[#94A3B8]">{tri("Dai solo un'idea: Sitor forgia l'immagine perfetta.", "Gib nur eine Idee: Sitor schmiedet das perfekte Bild.", "Give just an idea: Sitor forges the perfect image.", "Da solo una idea: Sitor forja la imagen.", "Donne juste une idée : Sitor forge l'image.", "فقط یک ایده بده: سیتور تصویر را می‌سازد.")}</p>
        </div>
      </div>
      <textarea
        data-testid="image-forge-prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={2}
        placeholder={tri("es. una pagnotta di farro con crosta dorata su tavolo di legno, luce del forno", "z.B. ein Dinkelbrot mit goldener Kruste", "e.g. a spelt loaf with golden crust on wood, oven light", "ej. un pan de espelta con corteza dorada", "ex. un pain d'épeautre à croûte dorée", "مثلاً یک نان جو با پوسته طلایی")}
        className="w-full rounded-xl bg-[#030712] border border-[#1e293b] focus:border-[#EAB308]/60 outline-none text-sm text-white p-3 resize-none"
      />
      <button
        data-testid="image-forge-generate"
        onClick={generate}
        disabled={busy || !prompt.trim()}
        className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-cyber font-black text-sm text-[#060A10] active:scale-95 transition-all disabled:opacity-50"
        style={{ background: "linear-gradient(90deg,#EAB308,#FF6B00)", boxShadow: "0 0 20px rgba(234,179,8,0.35)" }}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {busy ? tri("Sitor sta forgiando… (fino a 1 min)", "Sitor schmiedet…", "Sitor is forging… (up to 1 min)", "Sitor está forjando…", "Sitor forge…", "سیتور در حال ساخت…") : tri("Forgia immagine", "Bild schmieden", "Forge image", "Forjar imagen", "Forger l'image", "بساز")}
      </button>

      {img && (
        <div data-testid="image-forge-result" className="rounded-2xl overflow-hidden border border-[#EAB308]/40 bg-[#030712]">
          <img src={img} alt="Sitor" className="w-full h-auto block" />
          <div className="flex gap-2 p-2.5">
            <a data-testid="image-forge-download" href={img} download="sitor.png" className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#0C1019] border border-[#1e293b] text-[#EAB308] text-xs font-bold active:scale-95"><Download className="w-4 h-4" /> {tri("Scarica", "Laden", "Download", "Descargar", "Télécharger", "دانلود")}</a>
            <button data-testid="image-forge-again" onClick={() => setImg(null)} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#0C1019] border border-[#1e293b] text-[#94A3B8] text-xs font-bold active:scale-95"><RefreshCw className="w-4 h-4" /> {tri("Nuova", "Neu", "New", "Nueva", "Nouvelle", "جدید")}</button>
          </div>
        </div>
      )}
      {!img && !busy && (
        <p className="flex items-center gap-1.5 text-[10px] text-[#64748B]"><ImageIcon className="w-3.5 h-3.5" /> {tri("Prodotti, ricette, avatar, marketing: un'idea e Sitor crea.", "Produkte, Rezepte, Avatare, Marketing.", "Products, recipes, avatars, marketing: one idea and Sitor creates.", "Productos, recetas, avatares.", "Produits, recettes, avatars.", "محصول، دستور، آواتار.")}</p>
      )}
    </div>
  );
}
