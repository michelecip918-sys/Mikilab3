import { useEffect, useState } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { leggiDiario } from "@/lib/dilloASitor";
import { S as SINTOMI } from "@/components/officina/ProntoSoccorso";

// V136 — «L'ultima volta»: se hai fatto questa ricetta con «Dillo a Sitor» e hai detto com'è venuta, qui Sitor te lo ricorda,
// con quello che conviene cambiare. Dal quaderno nel telefono (mikilab_diario_sitor).
export default function UltimaVolta({ recipe }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const Lo = (o) => (o ? (lang === "de" ? o.de : lang === "en" ? o.en : o.it) : "");
  const [diario, setDiario] = useState(() => leggiDiario());
  useEffect(() => { const h = () => setDiario(leggiDiario()); window.addEventListener("mikilab-piano-sitor", h); return () => window.removeEventListener("mikilab-piano-sitor", h); }, []);
  const l = recipe && Array.isArray(diario[recipe.id]) ? diario[recipe.id] : [];
  if (!l.length) return null;
  const u = l[l.length - 1];
  const data = new Date(u.at).toLocaleDateString(lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT", { day: "numeric", month: "long" });
  const voto = u.voto === 3 ? tri("perfetto", "perfekt", "perfect") : u.voto === 2 ? tri("buono, ma…", "gut, aber…", "good, but…") : tri("non come volevi", "nicht wie gewollt", "not as you wanted");
  const consigli = (u.sintomi || []).map((k) => SINTOMI.find((x) => x.k === k)).filter(Boolean);
  return (
    <div data-testid={`ultima-volta-${recipe.id}`} className="no-print rounded-2xl border border-primary/30 bg-primary/5 p-3 flex gap-2.5">
      <img src="/sitor_official.webp" alt="" className="w-9 h-9 rounded-full object-cover border border-border shrink-0" />
      <div className="text-[13px] text-foreground leading-snug space-y-1">
        <p className="font-bold">{tri(`L'ultima volta (${data}): ${voto}`, `Letztes Mal (${data}): ${voto}`, `Last time (${data}): ${voto}`)}{l.length > 1 ? tri(` · fatta ${l.length} volte con Sitor`, ` · ${l.length} Mal mit Sitor`, ` · made ${l.length} times with Sitor`) : ""}</p>
        {consigli.length ? consigli.map((x) => <p key={x.k}><b>{Lo(x.t)}:</b> {Lo(x.next)}</p>) : <p>{tri("Rifalla così.", "Genauso wieder machen.", "Make it just the same way.")}</p>}
      </div>
    </div>
  );
}
