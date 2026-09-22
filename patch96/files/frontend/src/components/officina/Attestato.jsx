import { useEffect, useRef, useState } from "react";
import { Award, Share2 } from "lucide-react";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";
import { LS, shareOrDownload, siteFont, fmtDateLong } from "@/lib/sitorTools";

// V95 — L'ATTESTATO DEL FORNAIO DI CASA. Alla fine del percorso "Il tuo primo pane" (o quando vuoi): un attestato
// elegante disegnato nel browser, con il tuo nome, la data e la firma di MikiLab. Da condividere o stampare.

export default function Attestato({ lang, title }) {
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [name, setName] = useState(() => LS.get("mikilab_cartolina_nome", "") || "");
  const [url, setUrl] = useState(null);
  const ref = useRef(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      const c = document.createElement("canvas"); c.width = 1400; c.height = 990; const ctx = c.getContext("2d");
      const display = siteFont("font-display", "Georgia, serif"), body = siteFont("font-tech", "sans-serif");
      ctx.fillStyle = "#f6efe4"; ctx.fillRect(0, 0, 1400, 990);
      ctx.strokeStyle = "#8a5a2b"; ctx.lineWidth = 6; ctx.strokeRect(40, 40, 1320, 910); ctx.lineWidth = 1.5; ctx.strokeRect(58, 58, 1284, 874);
      try { const img = new Image(); img.src = "/logo.webp"; await img.decode(); ctx.save(); ctx.beginPath(); ctx.arc(700, 170, 60, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(img, 640, 110, 120, 120); ctx.restore(); } catch { /* senza logo */ }
      ctx.textAlign = "center"; ctx.fillStyle = "#6b5f57"; ctx.font = `600 22px ${body}`;
      ctx.fillText((tri("MikiLab · Il Manuale di Sitor", "MikiLab · Sitors Handbuch", "MikiLab · Sitor's Manual")).toUpperCase(), 700, 275);
      ctx.fillStyle = "#2a2320"; ctx.font = `bold 74px ${display}`; ctx.fillText(tri("Attestato del fornaio di casa", "Urkunde des Hausbäckers", "Home baker's certificate"), 700, 370);
      ctx.fillStyle = "#6b5f57"; ctx.font = `italic 30px ${display}`; ctx.fillText(tri("si attesta che", "hiermit wird bestätigt, dass", "this certifies that"), 700, 440);
      ctx.fillStyle = "#b8641f"; ctx.font = `bold 66px ${display}`; ctx.fillText(name.trim() || tri("un fornaio di casa", "ein Hausbäcker", "a home baker"), 700, 530);
      ctx.fillStyle = "#2a2320"; ctx.font = `30px ${body}`;
      const line = title || tri("ha fatto il suo primo pane con le sue mani, con la biga e con pazienza", "sein erstes Brot mit eigenen Händen gebacken hat, mit Biga und Geduld", "baked their first bread with their own hands, with a biga and with patience");
      ctx.fillText(line, 700, 600);
      ctx.fillStyle = "#6b5f57"; ctx.font = `24px ${body}`; ctx.fillText(fmtDateLong(new Date(), lang), 700, 660);
      ctx.strokeStyle = "#8a5a2b"; ctx.beginPath(); ctx.moveTo(560, 720); ctx.lineTo(840, 720); ctx.stroke();
      ctx.fillStyle = "#2a2320"; ctx.font = `italic 30px ${display}`; ctx.fillText(tri("Ricette di Michele Signorella · guida IA Sitor", "Rezepte von Michele Signorella · KI-Guide Sitor", "Recipes by Michele Signorella · AI guide Sitor"), 700, 790);
      ctx.fillStyle = "#6b5f57"; ctx.font = `22px ${body}`; ctx.fillText("mikilab.de", 700, 840);
      ctx.fillText(tri("Il pane buono è quello che esce dal forno.", "Gutes Brot ist das, das aus dem Ofen kommt.", "Good bread is the one that comes out of the oven."), 700, 890);
      if (alive) setUrl(c.toDataURL("image/png"));
    })();
    return () => { alive = false; };
  }, [name, lang, title]); // eslint-disable-line react-hooks/exhaustive-deps
  const share = async () => { if (!url) return; const blob = await (await fetch(url)).blob(); const res = await shareOrDownload(blob, "mikilab-attestato.png", "MikiLab"); if (res === "failed") toast.error(tri("Non riesco a condividere.", "Teilen nicht möglich.", "Can't share.")); };
  return (
    <div data-testid="attestato" className="space-y-2.5">
      <input data-testid="att-name" value={name} onChange={(e) => { setName(e.target.value.slice(0, 40)); LS.set("mikilab_cartolina_nome", e.target.value.slice(0, 40)); }} placeholder={tri("Il tuo soprannome (facoltativo)", "Dein Spitzname (optional)", "Your nickname (optional)")} className="w-full text-[13px] bg-card text-foreground border border-border rounded-xl px-3 py-2 outline-none focus:border-primary" />
      {url ? <img ref={ref} data-testid="att-img" src={url} alt="" className="w-full rounded-xl border border-border shadow-md" /> : <p className="text-[12px] text-muted-foreground">{tri("Sto scrivendo…", "Ich schreibe…", "Writing…")}</p>}
      <button data-testid="att-share" onClick={share} className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-2 rounded-xl bg-primary text-white active:scale-95"><Share2 className="w-4 h-4" />{tri("Condividi o salva", "Teilen oder speichern", "Share or save")}</button>
      <p className="text-[10.5px] text-muted-foreground flex items-center gap-1"><Award className="w-3 h-3" />{tri("Disegnato nel tuo telefono. Meglio un soprannome che il nome vero: resta solo qui, e nessuno deve sapere chi sei per dirti bravo.", "Auf deinem Handy gezeichnet. Lieber ein Spitzname als der echte Name: bleibt nur hier, und niemand muss wissen, wer du bist, um dich zu loben.", "Drawn on your phone. A nickname is better than your real name: it stays only here, and nobody needs to know who you are to say well done.")}</p>
    </div>
  );
}
