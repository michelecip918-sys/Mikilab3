import { useState } from "react";
import { Sun, Stamp, ChevronRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { LS, fmtDateLong } from "@/lib/sitorTools";
import { award } from "@/lib/medaglie";
import { TRADIZIONI, GIORNI_KEY, stampsInfo } from "@/components/Almanacco";

// V101 — OGGI IN BOTTEGA. La card in Home che cambia ogni giorno e porta all'almanacco. Il timbro si mette anche da qui.

export default function OggiInBottega({ onNav }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => (lang === "de" ? o.de : lang === "en" ? o.en : o.it);
  const [info, setInfo] = useState(stampsInfo);
  const now = new Date();
  const trad = TRADIZIONI.find((t) => t.m === now.getMonth() + 1 && t.d === now.getDate());
  const stamp = (e) => {
    e.stopPropagation(); if (info.today) return;
    const k = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    LS.set(GIORNI_KEY, [...new Set([...(info.days || []), k])].sort().slice(-400)); const n = stampsInfo(); setInfo(n);
    if (n.total >= 7) award("sette_giorni");
  };
  return (
    <div data-testid="oggi-in-bottega" className="mb-4 rounded-3xl border border-primary/30 bg-primary/8 p-4 flex items-center gap-3 cursor-pointer active:scale-[0.99]" onClick={() => onNav("oggi")}>
      <div className="flex-1 min-w-0">
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary flex items-center gap-1.5"><Sun className="w-3 h-3" />{tri("Oggi in bottega", "Heute in der Backstube", "Today in the workshop")} · {fmtDateLong(now, lang)}</p>
        <p className="text-[13.5px] text-foreground leading-snug mt-1">{trad ? L(trad) : tri("Un proverbio, un gesto da due minuti e il pane di oggi ti aspettano nell'almanacco.", "Ein Sprichwort, ein Handgriff für zwei Minuten und das Brot des Tages warten im Almanach.", "A proverb, a two-minute gesture and today's bread await you in the almanac.")}</p>
        <p className="text-[11px] text-muted-foreground mt-1">{info.streak > 0 ? tri(`${info.streak} ${info.streak === 1 ? "giorno" : "giorni"} di fila in bottega`, `${info.streak} Tag${info.streak === 1 ? "" : "e"} in Folge in der Backstube`, `${info.streak} day${info.streak === 1 ? "" : "s"} in a row in the workshop`) : tri("Apri l'almanacco →", "Almanach öffnen →", "Open the almanac →")}</p>
      </div>
      <button data-testid="oggi-stamp" onClick={stamp} disabled={info.today} className={`shrink-0 inline-flex flex-col items-center justify-center w-16 h-16 rounded-2xl text-[10px] font-bold ${info.today ? "bg-salvia/15 text-salvia" : "bg-salvia text-white active:scale-95"}`}><Stamp className="w-5 h-5 mb-0.5" />{info.today ? tri("fatto", "erledigt", "done") : tri("timbro", "Stempel", "stamp")}</button>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </div>
  );
}
