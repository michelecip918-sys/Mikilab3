import { useState } from "react";
import { ChevronLeft, LifeBuoy, Sparkles, Package, ChevronDown, ChevronRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { PRINCIPIO, SEZIONI } from "@/lib/paneCheSalva";
import { LS } from "@/lib/sitorTools";

// V107 — IL PANE CHE SALVA. Saper fare il pane quando manca qualcosa: il lievito, il forno, la bilancia, la corrente.
// E la dispensa di scorta: quanta farina, sale e lievito servono per N persone per N giorni. Scritto da Sitor (IA),
// dichiarato come tale. Rimanda agli attrezzi del sito. Tutto nel telefono.

const KEY = "mikilab_scorta";
const nav = (route) => window.dispatchEvent(new CustomEvent("mikilab-nav", { detail: { route } }));

export default function PaneCheSalva({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => (lang === "de" ? o.de : lang === "en" ? o.en : o.it);
  const [open, setOpen] = useState("senza-lievito");
  const [st, setSt] = useState(() => LS.get(KEY, { people: 4, days: 14 }));
  const set = (p) => { const n = { ...st, ...p }; setSt(n); LS.set(KEY, n); };
  const pd = Math.max(1, Math.min(30, Number(st.people) || 1)) * Math.max(1, Math.min(365, Number(st.days) || 1));
  // 250 g di pane a persona al giorno ≈ 170 g di farina
  const flourKg = Math.ceil(pd * 0.17 * 10) / 10;
  const saltG = Math.round(flourKg * 1000 * 0.02);
  const yeastBags = Math.ceil((flourKg * 1000) / 500);
  const sodaG = Math.round(flourKg * 1000 * 0.016);
  const fmt = (n) => String(n).replace(".", ",");

  return (
    <div data-testid="salva-page" className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <button data-testid="salva-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div>
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary flex items-center gap-1.5"><LifeBuoy className="w-3 h-3" />MikiLab</p>
        <h1 className="font-display text-2xl font-black text-foreground">{tri("Il pane che salva", "Das Brot, das rettet", "The bread that saves")}</h1>
        <div className="mk-oro-line mt-2 mb-1" />
        <p className="text-sm text-muted-foreground mt-1">{tri("Quando manca il lievito, il forno, la bilancia o la corrente, il pane si fa lo stesso. È il sapere più vecchio della cucina, e il più utile: chi sa fare il pane non resta senza da mangiare.", "Wenn Hefe, Ofen, Waage oder Strom fehlen, backt man trotzdem Brot. Es ist das älteste Wissen der Küche, und das nützlichste: wer Brot backen kann, bleibt nicht ohne Essen.", "When yeast, oven, scale or power are missing, you still make bread. It's the oldest knowledge in the kitchen, and the most useful: whoever can make bread doesn't go without food.")}</p>
        <p data-testid="salva-disclaimer" className="mt-2 text-[12px] text-salvia leading-snug rounded-xl border border-salvia/40 bg-salvia/8 px-3 py-2 flex items-start gap-1.5"><Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />{tri("Pagina scritta da Sitor, la guida IA di MikiLab: non sono ricette di Michele, per questo stanno qui, a parte, con il suo nome.", "Seite von Sitor, dem KI-Guide von MikiLab: keine Rezepte von Michele, deshalb stehen sie hier, getrennt, unter seinem Namen.", "Page written by Sitor, MikiLab's AI guide: not Michele's recipes, which is why they sit here, apart, under his name.")}</p>
      </div>
      <div data-testid="salva-principio" className="rounded-2xl border border-primary/40 bg-primary/8 p-4">
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary mb-1">{tri("La regola da ricordare", "Die Regel zum Merken", "The rule to remember")}</p>
        <p className="font-display text-[17px] text-foreground leading-snug">{L(PRINCIPIO)}</p>
      </div>
      {SEZIONI.map((s) => {
        const isOpen = open === s.k;
        return (
          <section key={s.k} data-testid={`salva-${s.k}`} className="rounded-2xl border border-border bg-card">
            <button onClick={() => setOpen(isOpen ? null : s.k)} className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left"><span className="font-display text-[17px] font-bold text-foreground">{L(s.t)}</span><ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} /></button>
            {isOpen && (
              <div className="px-4 pb-4 space-y-3">
                {s.items.map((it, i) => (
                  <div key={i} className="rounded-xl border border-border bg-background p-3 space-y-1.5">
                    <p className="text-[14px] font-bold text-foreground">{L(it.t)}</p>
                    <p className="text-[12.5px] font-mono-data text-primary leading-snug">{L(it.dose)}</p>
                    <p className="text-[13px] text-foreground/90 leading-snug">{L(it.how)}</p>
                    <p className="text-[12.5px] text-salvia leading-snug">{tri("Il segnale", "Das Zeichen", "The sign")}: {L(it.sign)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
      <div data-testid="salva-scorta" className="rounded-2xl border border-border bg-card p-4 space-y-2">
        <p className="font-display text-[17px] font-bold text-foreground flex items-center gap-1.5"><Package className="w-4 h-4 text-primary" />{tri("La dispensa di scorta", "Der Notvorrat", "The emergency pantry")}</p>
        <p className="text-[12.5px] text-muted-foreground leading-snug">{tri("Quanto serve per fare il pane in casa per tutti, per quanti giorni. Calcolato su 250 g di pane a persona al giorno.", "Was man braucht, um für alle zu Hause Brot zu backen, für wie viele Tage. Gerechnet mit 250 g Brot pro Person und Tag.", "What you need to bake bread at home for everyone, for how many days. Based on 250 g of bread per person per day.")}</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-[12px] text-muted-foreground">{tri("Persone", "Personen", "People")}<input data-testid="scorta-people" type="number" min="1" max="30" value={st.people} onChange={(e) => set({ people: e.target.value })} className="mt-0.5 w-full font-mono-data font-bold text-foreground bg-background border border-border rounded-md px-2 py-1.5 outline-none" /></label>
          <label className="block text-[12px] text-muted-foreground">{tri("Giorni", "Tage", "Days")}<input data-testid="scorta-days" type="number" min="1" max="365" value={st.days} onChange={(e) => set({ days: e.target.value })} className="mt-0.5 w-full font-mono-data font-bold text-foreground bg-background border border-border rounded-md px-2 py-1.5 outline-none" /></label>
        </div>
        <div data-testid="scorta-risultato" className="grid grid-cols-2 gap-x-4 gap-y-1 text-[13px] pt-1">
          <p className="flex justify-between"><span className="text-foreground/85">{tri("farina", "Mehl", "flour")}</span><b className="font-mono-data text-foreground">{fmt(flourKg)} kg</b></p>
          <p className="flex justify-between"><span className="text-foreground/85">{tri("sale", "Salz", "salt")}</span><b className="font-mono-data text-foreground">{saltG} g</b></p>
          <p className="flex justify-between"><span className="text-foreground/85">{tri("lievito secco (bustine da 7 g)", "Trockenhefe (Päckchen à 7 g)", "dry yeast (7 g sachets)")}</span><b className="font-mono-data text-foreground">{yeastBags}</b></p>
          <p className="flex justify-between"><span className="text-foreground/85">{tri("oppure bicarbonato", "oder Natron", "or bicarbonate")}</span><b className="font-mono-data text-foreground">{sodaG} g</b></p>
        </div>
        <p className="text-[12px] text-muted-foreground leading-snug">{tri("Meglio ancora: un lievito madre vivo in frigo non finisce mai. E la farina integrale dura meno: tienine poca e usala per prima.", "Noch besser: ein lebender Sauerteig im Kühlschrank geht nie aus. Und Vollkornmehl hält kürzer: wenig davon und zuerst verbrauchen.", "Even better: a living starter in the fridge never runs out. And wholemeal keeps less: hold little and use it first.")}</p>
      </div>
      <div className="rounded-2xl border border-border bg-card divide-y divide-border">
        {[{ r: "crealievito", t: tri("Crea il tuo lievito madre", "Sauerteig erschaffen", "Create your starter") }, { r: "bilancia", t: tri("Pane senza bilancia", "Brot ohne Waage", "Bread without a scale") }, { r: "paneieri", t: tri("Pane di ieri: niente si butta", "Brot von gestern: nichts wird weggeworfen", "Yesterday's bread: nothing wasted") }, { r: "pasta", t: tri("Le mani in pasta: acqua e semola, senza forno", "Die Hände im Teig: Wasser und Grieß, ohne Ofen", "Hands in the dough: water and semolina, no oven") }, { r: "recipes", t: tri("Cosa posso fare con quello che ho", "Was kann ich mit dem machen, was ich habe", "What can I make with what I have") }].map((x) => (
          <button key={x.r} data-testid={`salva-link-${x.r}`} onClick={() => nav(x.r)} className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left text-[13.5px] text-foreground">{x.t}<ChevronRight className="w-4 h-4 text-muted-foreground" /></button>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">{tri("Con il fuoco: sempre un adulto, sempre lontano da cose che bruciano, sempre acqua a portata di mano. Il bicarbonato va dosato (non più del 2 % sulla farina): troppo sa di sapone.", "Mit Feuer: immer ein Erwachsener, immer weit weg von Brennbarem, immer Wasser griffbereit. Natron dosieren (nicht mehr als 2 % auf das Mehl): zu viel schmeckt nach Seife.", "With fire: always an adult, always away from anything that burns, always water at hand. Measure the bicarbonate (no more than 2 % of the flour): too much tastes of soap.")}</p>
      <p className="text-[13px] text-salvia leading-snug">{tri("Sitor: il pane è la prima cosa che l'uomo ha imparato a fare per non dipendere dalla fortuna. Impararlo oggi è un regalo a chi sarai domani.", "Sitor: Brot ist das Erste, was der Mensch zu machen lernte, um nicht vom Glück abzuhängen. Es heute zu lernen, ist ein Geschenk an den, der du morgen bist.", "Sitor: bread is the first thing humans learned to make so as not to depend on luck. Learning it today is a gift to who you'll be tomorrow.")}</p>
    </div>
  );
}
