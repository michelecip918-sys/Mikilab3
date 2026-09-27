import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { api } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// V129 — LA FOTO DI MICHELE. Finché una ricetta ha l'immagine creata con l'IA, sopra c'è «Immagine illustrativa».
// Quando Michele mette la foto vera del suo pane, la scritta diventa «Foto di Michele».
// Una sola fonte per tutto il sito: /api/recipe-extras (real_photo), letta una volta e riletta quando cambia una foto.

let cache = null;
let inflight = null;
export function loadFotoVere(force = false) {
  if (cache && !force) return Promise.resolve(cache);
  if (!inflight || force) {
    inflight = api.get("/recipe-extras")
      .then((r) => { const m = {}; Object.entries(r.data || {}).forEach(([id, x]) => { if (x && x.real_photo) m[id] = true; }); cache = m; return m; })
      .catch(() => cache || {})
      .finally(() => { inflight = null; });
  }
  return inflight;
}

export function useFotoVere() {
  const [m, setM] = useState(cache || {});
  useEffect(() => {
    let ok = true;
    loadFotoVere().then((x) => { if (ok) setM(x); });
    const h = () => loadFotoVere(true).then((x) => { if (ok) setM(x); });
    window.addEventListener("mikilab-foto-cambiata", h);
    return () => { ok = false; window.removeEventListener("mikilab-foto-cambiata", h); };
  }, []);
  return m;
}

export default function FotoBadge({ vera, testid = "card-illustrative", big = false }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  if (vera) {
    return (
      <span data-testid="foto-di-michele" className={`absolute bottom-1.5 right-1.5 z-[3] inline-flex items-center gap-1 font-bold rounded-full bg-primary text-primary-foreground shadow ${big ? "text-[11px] px-2.5 py-1" : "text-[9.5px] px-2 py-0.5"}`}>
        <Camera className={big ? "w-3.5 h-3.5" : "w-3 h-3"} />{tri("Foto di Michele", "Foto von Michele", "Photo by Michele")}
      </span>
    );
  }
  return (
    <span data-testid={testid} className={`absolute bottom-1 right-1 z-[3] font-bold uppercase tracking-wide bg-background/55 text-foreground/90 px-1.5 py-0.5 rounded ${big ? "text-[9px]" : "text-[8px]"}`}>
      {tri("Immagine illustrativa", "Symbolbild", "Illustrative image")}
    </span>
  );
}
