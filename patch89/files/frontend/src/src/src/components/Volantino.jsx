import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { ChevronLeft, Printer, Share2 } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { toast } from "sonner";

// V87 — "Il volantino da frigo": una pagina A5 da stampare con il QR di mikilab.de, da attaccare al
// frigo, dare al vicino, lasciare al bar o dal fornaio. È il modo più semplice per portare MikiLab
// nelle cucine: chi cucina inquadra, apre, cucina. Nessun dato: il QR punta solo a mikilab.de.
// Stampa: window.print con CSS dedicato (solo il volantino sulla pagina). Raggiungibile da
// Strumenti o da mikilab.de/volantino.

const PUB = process.env.PUBLIC_URL;

export default function Volantino({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [variant, setVariant] = useState(lang === "de" ? "de" : "it"); // it | de | itde
  const qr = useRef(null);
  const url = "https://mikilab.de/";
  useEffect(() => { if (qr.current) QRCode.toCanvas(qr.current, url, { width: 260, margin: 1, color: { dark: "#2B2E33", light: "#FFFFFF" } }).catch(() => { /* */ }); }, [variant]);

  const print = () => {
    try { document.body.classList.add("ml-vol"); window.print(); } finally { setTimeout(() => document.body.classList.remove("ml-vol"), 500); }
  };
  const share = async () => {
    const text = tri("Ricette di pane, pizza e focacce gratis, spiegate da un panettiere: mikilab.de", "Rezepte für Brot, Pizza und Focaccia, kostenlos, erklärt von einem Bäcker: mikilab.de", "Free bread, pizza and focaccia recipes, explained by a baker: mikilab.de");
    try { if (navigator.share) await navigator.share({ text, url }); else { await navigator.clipboard.writeText(`${text}`); toast.success(tri("Copiato.", "Kopiert.", "Copied.")); } } catch { /* */ }
  };

  const T = variant === "de"
    ? { h: "Brot, Pizza, Focaccia.", s: "Zu Hause, Schritt für Schritt, erklärt von einem Bäcker.", l: ["150+ Rezepte, kostenlos, ohne Anmeldung", "Sitor liest dir die Schritte vor, während du knetest", "Panettone, Sauerteig, Focaccia aus Bari, Brezel"], f: "Handy-Kamera auf den Code richten →", p: "Michele, Bäcker in Stuttgart" }
    : variant === "it"
      ? { h: "Pane, pizza, focaccia.", s: "A casa tua, passo per passo, spiegati da un panettiere.", l: ["150+ ricette, gratis, senza registrazione", "Sitor ti legge i passi mentre hai le mani in pasta", "Panettone, lievito madre, focaccia barese, Brezel"], f: "Inquadra il codice con la fotocamera →", p: "Michele, panettiere a Stoccarda" }
      : { h: "Pane, pizza, focaccia. · Brot, Pizza, Focaccia.", s: "Passo per passo, da un panettiere. · Schritt für Schritt, von einem Bäcker.", l: ["150+ ricette gratis · 150+ Rezepte kostenlos", "Sitor legge i passi a voce · Sitor liest die Schritte vor", "Panettone, lievito madre, focaccia, Brezel"], f: "Inquadra il codice · Code scannen →", p: "Michele · Stuttgart" };

  return (
    <div data-testid="volantino-page" className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <style>{`
        @media print {
          body.ml-vol * { visibility: hidden !important; }
          body.ml-vol #ml-volantino, body.ml-vol #ml-volantino * { visibility: visible !important; }
          body.ml-vol #ml-volantino { position: fixed; inset: 0; margin: 0; width: 100%; height: 100%; border: none; border-radius: 0; box-shadow: none; page-break-after: avoid; }
          @page { size: A5 portrait; margin: 8mm; }
        }
      `}</style>
      <button data-testid="volantino-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold print:hidden"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div className="print:hidden">
        <h1 className="font-display text-2xl font-black text-foreground">{tri("Il volantino da frigo", "Der Kühlschrank-Flyer", "The fridge flyer")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{tri("Stampalo, attaccalo al frigo, dallo al vicino, lascialo dal fornaio o al bar. Chi inquadra il codice entra in MikiLab.", "Drucken, an den Kühlschrank, dem Nachbarn geben, beim Bäcker oder im Café lassen. Wer den Code scannt, ist bei MikiLab.", "Print it, stick it on the fridge, give it to a neighbour, leave it at the bakery or café. Whoever scans the code lands in MikiLab.")}</p>
        <div className="flex gap-2 mt-3 flex-wrap">
          {[["it", "Italiano"], ["de", "Deutsch"], ["itde", "IT + DE"]].map(([k, l]) => <button key={k} onClick={() => setVariant(k)} className={`px-3 py-1.5 rounded-full text-sm font-bold border ${variant === k ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground"}`}>{l}</button>)}
        </div>
      </div>

      <div id="ml-volantino" data-testid="volantino-sheet" className="bg-white text-[#2B2E33] rounded-2xl border border-border shadow-md p-6 sm:p-8 aspect-[148/210] flex flex-col" style={{ fontFamily: "Manrope, Arial, sans-serif" }}>
        <div className="flex items-center gap-3">
          <img src={`${PUB}/logo-emblem.webp`} alt="MikiLab" className="w-12 h-12 rounded-lg object-contain" />
          <div>
            <p className="text-2xl font-black tracking-[0.14em] uppercase" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>MikiLab</p>
            <p className="text-[10px] tracking-[0.28em] uppercase text-[#5B5F66]">{variant === "de" ? "Sitors Handbuch" : "Il Manuale di Sitor"}</p>
          </div>
        </div>
        <p className="mt-6 text-[26px] leading-tight font-black" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>{T.h}</p>
        <p className="text-[14px] text-[#5B5F66] mt-1">{T.s}</p>
        <ul className="mt-4 space-y-1.5 text-[13px]">{T.l.map((x, i) => <li key={i} className="flex gap-2"><span className="text-[#A15621] font-black">•</span>{x}</li>)}</ul>
        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <p className="text-[12px] text-[#5B5F66]">{T.f}</p>
            <p className="text-[20px] font-black text-[#A15621] mt-1">mikilab.de</p>
            <p className="text-[11px] text-[#5B5F66] mt-2">{T.p}</p>
            <p className="text-[10px] text-[#5B5F66]">{variant === "de" ? "Kostenlos · Keine Werbung · Kein Konto" : "Gratis · Senza pubblicità · Senza account"}</p>
          </div>
          <canvas ref={qr} className="w-32 h-32 sm:w-36 sm:h-36 shrink-0" aria-label="QR mikilab.de" />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap print:hidden">
        <button data-testid="volantino-print" onClick={print} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-95"><Printer className="w-4 h-4" />{tri("Stampa (A5)", "Drucken (A5)", "Print (A5)")}</button>
        <button onClick={share} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background font-bold text-sm text-foreground active:scale-95"><Share2 className="w-4 h-4" />{tri("Condividi il link", "Link teilen", "Share the link")}</button>
      </div>
      <p className="text-[11px] text-muted-foreground print:hidden">{tri("Consiglio: stampane quattro su un foglio A4 e ritaglia. Il codice porta solo a mikilab.de: nessun dato, nessun tracciamento.", "Tipp: vier auf ein A4-Blatt drucken und ausschneiden. Der Code führt nur zu mikilab.de: keine Daten, kein Tracking.", "Tip: print four on an A4 sheet and cut. The code only leads to mikilab.de: no data, no tracking.")}</p>
    </div>
  );
}
