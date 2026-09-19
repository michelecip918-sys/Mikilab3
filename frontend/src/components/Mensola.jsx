import { useState, useEffect, useRef } from "react";
import { ChevronLeft, Award, Download, Share2, ImagePlus } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { api } from "@/lib/api";

const DONE_KEY = "mikilab_done";

// G4: "La mia mensola" — ricette fatte (dispositivo), traguardi locali, card 1080x1350 da canvas.
export default function Mensola({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [recipes, setRecipes] = useState([]);
  const [settings, setSettings] = useState({});
  const [cardFor, setCardFor] = useState(null);
  const [photo, setPhoto] = useState(null);
  const canvasRef = useRef(null);

  let doneIds = [];
  try { doneIds = JSON.parse(localStorage.getItem(DONE_KEY) || "[]"); } catch { doneIds = []; }

  useEffect(() => {
    api.get(`/recipes?collection_name=mikilab`).then((r) => setRecipes(r.data || [])).catch(() => { /* */ });
    api.get(`/site-settings`).then((r) => setSettings(r.data || {})).catch(() => { /* */ });
  }, []);

  const doneRecipes = recipes.filter((r) => doneIds.includes(r.id));
  const has = (fn) => doneRecipes.some(fn);
  const cat = (r) => `${r.menu_category || ""} ${r.dough_category || ""} ${r.name || ""}`.toLowerCase();
  const milestones = [
    { key: "panino", label: tri("Primo panino", "Erstes Brötchen", "First roll"), got: has((r) => /panin|brötchen|roll|bun/.test(cat(r))) },
    { key: "focaccia", label: tri("Prima focaccia", "Erste Focaccia", "First focaccia"), got: has((r) => /focacc/.test(cat(r))) },
    { key: "pizza", label: tri("Prima pizza", "Erste Pizza", "First pizza"), got: has((r) => /pizza/.test(cat(r))) },
    { key: "prefermento", label: tri("Primo prefermento", "Erstes Vorteig", "First preferment"), got: has((r) => r.preferment_type || r.biga || /poolish|biga|prefer/.test(cat(r))) },
    { key: "lm", label: tri("Primo lievito madre o licoli", "Erster Sauerteig/LiCoLi", "First sourdough/licoli"), got: has((r) => r.sourdough_grams || /lievito madre|licoli|sourdough|sauerteig/.test(cat(r))) },
    { key: "lunga", label: tri("Prima lievitazione lunga", "Erste lange Gare", "First long proof"), got: has((r) => ((Number(r.bulk_fermentation_hours) || 0) + (Number(r.proofing_hours) || 0)) >= 12) },
    { key: "dieci", label: tri("10 ricette", "10 Rezepte", "10 recipes"), got: doneRecipes.length >= 10 },
  ];

  const onPhoto = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const img = new Image();
    img.onload = () => setPhoto(img);
    img.src = URL.createObjectURL(f);   // elaborata sul dispositivo, MAI inviata
  };

  const drawCard = () => {
    const cv = canvasRef.current; if (!cv || !cardFor) return;
    const ctx = cv.getContext("2d"); const W = 1080, H = 1350; cv.width = W; cv.height = H;
    const cream = "#F6F1E7", ink = "#2B2E33", rame = "#A85A22";
    ctx.fillStyle = cream; ctx.fillRect(0, 0, W, H);
    if (photo) {
      const r = Math.max(W / photo.width, (H * 0.55) / photo.height);
      const pw = photo.width * r, ph = photo.height * r;
      ctx.drawImage(photo, (W - pw) / 2, 0, pw, ph);
      ctx.fillStyle = "rgba(31,33,36,0.35)"; ctx.fillRect(0, 0, W, H * 0.55);
    }
    ctx.fillStyle = rame; ctx.beginPath(); ctx.arc(W / 2, 170, 70, 0, 7); ctx.fill();
    ctx.fillStyle = cream; ctx.font = "bold 64px Georgia, serif"; ctx.textAlign = "center"; ctx.fillText("ML", W / 2, 192);
    ctx.fillStyle = photo ? "#fff" : ink; ctx.font = "bold 76px Georgia, serif";
    const name = cardFor.name || ""; const words = name.split(" "); let line = "", y = H * 0.62; const lines = [];
    words.forEach((w) => { if ((line + w).length > 18) { lines.push(line); line = w + " "; } else line += w + " "; });
    lines.push(line);
    lines.slice(0, 3).forEach((ln) => { ctx.fillText(ln.trim(), W / 2, y); y += 90; });
    ctx.fillStyle = rame; ctx.font = "bold 40px Georgia, serif"; ctx.fillText(tri("L'ho fatta!", "Geschafft!", "I made it!"), W / 2, y + 30);
    const handle = settings.tiktok_handle ? `@${settings.tiktok_handle}` : "";
    ctx.fillStyle = photo ? "#fff" : ink; ctx.font = "500 34px Arial"; ctx.fillText(`#MikiLab  ${handle}`, W / 2, H - 70);
  };

  useEffect(() => { if (cardFor) setTimeout(drawCard, 50); }, [cardFor, photo]); // eslint-disable-line

  const download = () => {
    const cv = canvasRef.current; if (!cv) return;
    cv.toBlob((b) => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "mikilab-card.png"; a.click(); }, "image/png");
  };
  const share = async () => {
    const cv = canvasRef.current; if (!cv) return;
    cv.toBlob(async (b) => {
      const file = new File([b], "mikilab-card.png", { type: "image/png" });
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: "MikiLab" });
        else download();
      } catch { /* */ }
    }, "image/png");
  };

  return (
    <div data-testid="mensola-page" className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <button data-testid="mensola-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>

      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-black text-foreground">{tri("La mia mensola", "Mein Regal", "My shelf")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{tri("Le ricette che hai fatto e i tuoi traguardi. Tutto resta sul tuo dispositivo.", "Deine gebackenen Rezepte und Erfolge. Alles bleibt auf deinem Gerät.", "The recipes you've made and your milestones. Everything stays on your device.")}</p>
      </div>

      <div>
        <p className="text-[11px] font-black uppercase tracking-wide text-muted-foreground mb-2">{tri("Traguardi", "Erfolge", "Milestones")}</p>
        <div className="flex flex-wrap gap-2">
          {milestones.map((m) => (
            <span key={m.key} data-testid={`milestone-${m.key}`} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${m.got ? "bg-accent/20 border-accent/50 text-accent-foreground" : "bg-foreground/5 border-border text-muted-foreground/60"}`}>
              <Award className="w-3.5 h-3.5" />{m.label}
            </span>
          ))}
        </div>
      </div>

      {doneRecipes.length === 0 ? (
        <p data-testid="mensola-empty" className="text-muted-foreground text-sm">{tri("Non hai ancora segnato ricette come fatte. Tocca «Segna come fatta» in una ricetta.", "Du hast noch keine Rezepte als erledigt markiert.", "You haven't marked any recipes as done yet.")}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {doneRecipes.map((r) => (
            <div key={r.id} data-testid={`shelf-card-${r.id}`} className="rounded-2xl border border-border bg-card overflow-hidden">
              {r.image_url && <img src={r.image_url} alt={r.name} className="w-full h-28 object-cover" onError={(e) => { e.target.style.display = "none"; }} />}
              <div className="p-2.5">
                <p className="font-display text-sm font-bold text-foreground leading-tight line-clamp-2">{r.name}</p>
                <button data-testid={`make-card-${r.id}`} onClick={() => { setPhoto(null); setCardFor(r); }} className="mt-2 text-xs font-bold text-primary inline-flex items-center gap-1">{tri("Crea la mia card", "Karte erstellen", "Create my card")}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {cardFor && (
        <div data-testid="card-modal" className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={() => setCardFor(null)}>
          <div className="bg-card rounded-2xl p-4 max-w-sm w-full space-y-3" onClick={(e) => e.stopPropagation()}>
            <canvas ref={canvasRef} className="w-full rounded-xl border border-border" style={{ aspectRatio: "1080/1350" }} />
            <label className="flex items-center justify-center gap-2 py-2 rounded-xl border border-border text-sm font-bold text-foreground cursor-pointer">
              <ImagePlus className="w-4 h-4" />{tri("Aggiungi una foto (facoltativa)", "Foto hinzufügen (optional)", "Add a photo (optional)")}
              <input type="file" accept="image/*" className="hidden" onChange={onPhoto} data-testid="card-photo-input" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button data-testid="card-share" onClick={share} className="inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-95"><Share2 className="w-4 h-4" />{tri("Condividi", "Teilen", "Share")}</button>
              <button data-testid="card-download" onClick={download} className="inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-foreground/10 text-foreground font-bold text-sm active:scale-95"><Download className="w-4 h-4" />{tri("Scarica", "Herunterladen", "Download")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
