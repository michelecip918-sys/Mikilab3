import { useEffect, useRef, useState } from "react";
import { Camera, Download, Share2, Printer, Gift } from "lucide-react";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";
import { rLoc } from "@/lib/loc";
import { ingredientFamily, LS, shareOrDownload, downloadBlob, fmtDateLong, siteFont } from "@/lib/sitorTools";

// V92 — LA CARTOLINA DEL PANE. Una foto del tuo pane (o i colori del sito), il nome della ricetta, il tuo nome e la data:
// un'immagine pronta per WhatsApp, TikTok o per la famiglia. E il BIGLIETTINO DA REGALO, con "contiene…" letto dagli
// ingredienti, per quando il pane lo regali. Tutto disegnato sul telefono: la foto non lascia mai il tuo dispositivo.

function cssHsl(varName, fallback) {
  try { const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim(); return v ? `hsl(${v})` : fallback; } catch { return fallback; }
}
function wrap(ctx, text, maxW) {
  const words = String(text || "").split(/\s+/), lines = []; let line = "";
  words.forEach((w) => { const t = line ? `${line} ${w}` : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
  if (line) lines.push(line);
  return lines;
}
function loadImg(src) { return new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }); }

export function allergens(r, dough, lang) {
  const tri = mkTri(lang);
  const names = [String(r.flour_type || ""), ...dough.items.map((i) => (i.key === "extra" ? i.name : ""))].join(" ").toLowerCase();
  const fams = new Set(dough.items.filter((i) => i.key === "extra").map((i) => ingredientFamily(i.name)));
  const out = [];
  const grains = [];
  if (/farro|dinkel|spelt/.test(names)) grains.push(tri("farro", "Dinkel", "spelt"));
  if (/segale|roggen|rye/.test(names)) grains.push(tri("segale", "Roggen", "rye"));
  if (/orzo|gerste|barley|malto|malz/.test(names)) grains.push(tri("orzo", "Gerste", "barley"));
  if (/avena|hafer|oat/.test(names)) grains.push(tri("avena", "Hafer", "oats"));
  grains.unshift(tri("grano", "Weizen", "wheat"));
  out.push(`${tri("cereali con glutine", "glutenhaltiges Getreide", "cereals containing gluten")} (${[...new Set(grains)].join(", ")})`);
  if (fams.has("eggs")) out.push(tri("uova", "Eier", "eggs"));
  if (fams.has("dairy") || fams.has("butter")) out.push(tri("latte", "Milch", "milk"));
  if (/arachid|erdnuss|peanut/.test(names)) out.push(tri("arachidi", "Erdnüsse", "peanuts"));
  if (fams.has("nuts") && !/^(arachid|erdnuss|peanut)/.test(names)) out.push(tri("frutta a guscio", "Schalenfrüchte", "nuts"));
  if (/sesam/.test(names)) out.push(tri("sesamo", "Sesam", "sesame"));
  if (/soia|soja|soy/.test(names)) out.push(tri("soia", "Soja", "soya"));
  if (/senape|senf|mustard/.test(names)) out.push(tri("senape", "Senf", "mustard"));
  if (/sedano|sellerie|celery/.test(names)) out.push(tri("sedano", "Sellerie", "celery"));
  if (/lupin/.test(names)) out.push(tri("lupini", "Lupinen", "lupin"));
  return out;
}

export default function CartolinaDelPane({ r, dough, lang }) {
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [name, setName] = useState(() => LS.get("mikilab_cartolina_nome", ""));
  const [photo, setPhoto] = useState(null);
  const [mode, setMode] = useState("cartolina");
  const [url, setUrl] = useState("");
  const canvasRef = useRef(null);
  useEffect(() => { LS.set("mikilab_cartolina_nome", name); }, [name]);
  const title = rLoc(r, "name", lang);
  const date = fmtDateLong(new Date(), lang);
  const contains = allergens(r, dough, lang);

  useEffect(() => {
    let alive = true;
    (async () => {
      const c = canvasRef.current; if (!c) return;
      try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch { /* */ }
      const display = siteFont("font-display", "Georgia, serif");
      const body = siteFont("font-sans", "system-ui, sans-serif");
      const primary = cssHsl("--primary", "#c4652a"), bg = cssHsl("--background", "#2a2320"), fg = cssHsl("--foreground", "#f5efe6"), salvia = cssHsl("--salvia", "#7d9a7b");
      const logo = await loadImg("/logo.webp");
      const ctx = c.getContext("2d");
      if (mode === "cartolina") {
        c.width = 1080; c.height = 1350;
        ctx.fillStyle = bg; ctx.fillRect(0, 0, 1080, 1350);
        if (photo) {
          const im = await loadImg(photo);
          if (im) { const s = Math.max(1080 / im.width, 1350 / im.height); const w = im.width * s, h = im.height * s; ctx.drawImage(im, (1080 - w) / 2, (1350 - h) / 2, w, h); }
        } else {
          const g = ctx.createLinearGradient(0, 0, 1080, 1350); g.addColorStop(0, primary); g.addColorStop(1, bg); ctx.fillStyle = g; ctx.fillRect(0, 0, 1080, 1350);
          ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 3;
          for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(540, 620, 90 + i * 70, 0, Math.PI * 2); ctx.stroke(); }
        }
        const g2 = ctx.createLinearGradient(0, 700, 0, 1350); g2.addColorStop(0, "rgba(0,0,0,0)"); g2.addColorStop(1, "rgba(0,0,0,0.82)"); ctx.fillStyle = g2; ctx.fillRect(0, 700, 1080, 650);
        const g3 = ctx.createLinearGradient(0, 0, 0, 260); g3.addColorStop(0, "rgba(0,0,0,0.55)"); g3.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g3; ctx.fillRect(0, 0, 1080, 260);
        if (logo) { ctx.save(); ctx.beginPath(); ctx.arc(110, 110, 52, 0, Math.PI * 2); ctx.closePath(); ctx.clip(); ctx.drawImage(logo, 58, 58, 104, 104); ctx.restore(); }
        ctx.fillStyle = "#fff"; ctx.font = `bold 44px ${display}`; ctx.fillText("MikiLab", 185, 100); ctx.font = `28px ${body}`; ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.fillText(tri("Il Manuale di Sitor", "Das Handbuch von Sitor", "Sitor's Manual"), 185, 140);
        ctx.fillStyle = "#fff"; ctx.font = `bold 84px ${display}`;
        const lines = wrap(ctx, title, 960); let y = 1060 - (lines.length - 1) * 92;
        lines.slice(0, 3).forEach((l) => { ctx.fillText(l, 60, y); y += 92; });
        ctx.font = `36px ${body}`; ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.fillText(name ? tri(`fatto in casa da ${name}`, `zu Hause gebacken von ${name}`, `baked at home by ${name}`) : tri("fatto in casa", "zu Hause gebacken", "baked at home"), 60, y + 10);
        ctx.fillText(date, 60, y + 60);
        ctx.font = `30px ${body}`; ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.fillText(tri("Ricetta di Michele Signorella · mikilab.de", "Rezept von Michele Signorella · mikilab.de", "Recipe by Michele Signorella · mikilab.de"), 60, 1280);
        ctx.fillStyle = salvia; ctx.fillRect(60, 1235, 120, 6);
      } else {
        c.width = 1200; c.height = 700;
        ctx.fillStyle = "#faf6ee"; ctx.fillRect(0, 0, 1200, 700);
        ctx.strokeStyle = primary; ctx.lineWidth = 6; ctx.strokeRect(24, 24, 1152, 652);
        ctx.strokeStyle = "rgba(0,0,0,0.15)"; ctx.lineWidth = 2; ctx.strokeRect(40, 40, 1120, 620);
        if (logo) { ctx.save(); ctx.beginPath(); ctx.arc(120, 120, 56, 0, Math.PI * 2); ctx.closePath(); ctx.clip(); ctx.drawImage(logo, 64, 64, 112, 112); ctx.restore(); }
        ctx.fillStyle = "#2a2320"; ctx.font = `bold 40px ${display}`; ctx.fillText(tri("Fatto in casa con MikiLab", "Selbstgebacken mit MikiLab", "Homemade with MikiLab"), 200, 112);
        ctx.font = `26px ${body}`; ctx.fillStyle = "#6b5f57"; ctx.fillText(name ? tri(`da ${name} · ${date}`, `von ${name} · ${date}`, `by ${name} · ${date}`) : date, 200, 152);
        ctx.fillStyle = primary; ctx.font = `bold 64px ${display}`;
        const tl = wrap(ctx, title, 1050); let y = 260; tl.slice(0, 2).forEach((l) => { ctx.fillText(l, 70, y); y += 72; });
        ctx.fillStyle = "#2a2320"; ctx.font = `bold 28px ${body}`; ctx.fillText(tri("Contiene", "Enthält", "Contains"), 70, y + 30);
        ctx.font = `28px ${body}`; ctx.fillStyle = "#3d342f";
        const cl = wrap(ctx, contains.join(" · "), 1050); let y2 = y + 70; cl.slice(0, 3).forEach((l) => { ctx.fillText(l, 70, y2); y2 += 38; });
        ctx.font = `22px ${body}`; ctx.fillStyle = "#8a7d74";
        ctx.fillText(tri("Letto dagli ingredienti della ricetta: controlla anche le etichette di quello che hai usato.", "Aus den Rezeptzutaten gelesen: prüfe auch die Etiketten deiner Zutaten.", "Read from the recipe ingredients: check the labels of what you used too."), 70, 600);
        ctx.fillText(tri("Ricetta di Michele Signorella · mikilab.de", "Rezept von Michele Signorella · mikilab.de", "Recipe by Michele Signorella · mikilab.de"), 70, 636);
        ctx.fillStyle = salvia; ctx.fillRect(70, 560, 90, 5);
      }
      if (alive) setUrl(c.toDataURL("image/png"));
    })();
    return () => { alive = false; };
  }, [mode, photo, name, title, date, lang, contains.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  const toBlob = () => new Promise((res) => { const c = canvasRef.current; if (!c) return res(null); c.toBlob((b) => res(b), "image/png"); });
  const fileName = () => `mikilab-${mode}-${String(title).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}.png`;
  const share = async () => { const b = await toBlob(); if (!b) return; const res = await shareOrDownload(b, fileName(), `MikiLab · ${title}`); if (res === "failed") toast.error(tri("Non riesco a condividere", "Teilen nicht möglich", "Can't share")); };
  const download = async () => { const b = await toBlob(); if (b && downloadBlob(b, fileName())) toast.success(tri("Immagine salvata", "Bild gespeichert", "Image saved")); };
  const print = () => {
    try { const w = window.open("", "_blank"); if (!w) return; w.document.write(`<html><head><title>MikiLab</title></head><body style="margin:0;display:flex;align-items:center;justify-content:center"><img src="${url}" style="max-width:100%;width:18cm" onload="setTimeout(function(){window.print()},300)"></body></html>`); w.document.close(); } catch { /* */ }
  };
  const onFile = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => setPhoto(String(rd.result)); rd.readAsDataURL(f); };

  return (
    <div data-testid="cartolina-pane" className="space-y-3">
      <p className="text-[12.5px] text-foreground/85 leading-snug">
        {tri("Il pane è uscito bene? Fagli la foto e fatti la cartolina: pronta da mandare. Se lo regali, stampa il bigliettino con scritto cosa c'è dentro.",
          "Das Brot ist gelungen? Fotografiere es und mach dir die Postkarte: fertig zum Verschicken. Verschenkst du es, drucke die Karte mit dem, was drin ist.",
          "Did the bread come out well? Take its photo and make the postcard: ready to send. If you give it away, print the tag saying what's inside.")}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {[["cartolina", tri("Cartolina", "Postkarte", "Postcard"), Share2], ["bigliettino", tri("Bigliettino da regalo", "Geschenkkarte", "Gift tag"), Gift]].map(([k, l, Icon]) => (
          <button key={k} data-testid={`cp-mode-${k}`} onClick={() => setMode(k)} className={`inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full border active:scale-95 ${mode === k ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border"}`}><Icon className="w-3.5 h-3.5" /> {l}</button>
        ))}
        <input data-testid="cp-name" value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} placeholder={tri("Il tuo soprannome (facoltativo)", "Dein Spitzname (optional)", "Your nickname (optional)")} className="flex-1 min-w-[10rem] text-sm text-foreground bg-card border border-border rounded-xl px-3 py-1.5 outline-none focus:border-primary" />
      </div>
      {mode === "cartolina" && (
        <label className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-foreground bg-card border border-border rounded-xl px-3 py-2 cursor-pointer active:scale-95">
          <Camera className="w-4 h-4 text-primary" /> {photo ? tri("Cambia foto", "Foto ändern", "Change photo") : tri("Metti la foto del tuo pane", "Foto deines Brots einfügen", "Add a photo of your bread")}
          <input data-testid="cp-photo" type="file" accept="image/*" onChange={onFile} className="hidden" />
        </label>
      )}
      <canvas ref={canvasRef} className="hidden" aria-hidden />
      {url ? <img data-testid="cp-preview" src={url} alt="" className="w-full rounded-xl border border-border shadow-md" /> : <p className="text-[12px] text-muted-foreground">{tri("Sto disegnando…", "Ich zeichne…", "Drawing…")}</p>}
      <div className="flex flex-wrap gap-2">
        <button data-testid="cp-share" onClick={share} className="inline-flex items-center gap-1.5 bg-primary text-white font-semibold text-[12.5px] px-3.5 py-2 rounded-xl active:scale-95"><Share2 className="w-4 h-4" /> {tri("Condividi", "Teilen", "Share")}</button>
        <button data-testid="cp-download" onClick={download} className="inline-flex items-center gap-1.5 bg-card border border-border text-foreground font-semibold text-[12.5px] px-3.5 py-2 rounded-xl active:scale-95"><Download className="w-4 h-4" /> {tri("Salva immagine", "Bild speichern", "Save image")}</button>
        {mode === "bigliettino" && <button data-testid="cp-print" onClick={print} className="inline-flex items-center gap-1.5 bg-card border border-border text-foreground font-semibold text-[12.5px] px-3.5 py-2 rounded-xl active:scale-95"><Printer className="w-4 h-4" /> {tri("Stampa", "Drucken", "Print")}</button>}
      </div>
      <p className="text-[11px] text-muted-foreground">{tri("La foto resta sul tuo telefono: l'immagine viene disegnata qui, senza inviare nulla.", "Das Foto bleibt auf deinem Handy: das Bild wird hier gezeichnet, ohne etwas zu senden.", "The photo stays on your phone: the image is drawn here, nothing is sent.")}</p>
      <p className="text-[12px] text-salvia leading-snug">
        {tri("Sitor: la foto migliore si fa con la luce della finestra, pane tagliato a metà, senza flash. E la cartolina mandala a chi ti ha insegnato a impastare.",
          "Sitor: Das beste Foto gelingt im Fensterlicht, Brot halbiert, ohne Blitz. Und die Postkarte schickst du dem, der dir das Kneten beigebracht hat.",
          "Sitor: the best photo is by window light, bread cut in half, no flash. And send the postcard to whoever taught you to knead.")}
      </p>
    </div>
  );
}
