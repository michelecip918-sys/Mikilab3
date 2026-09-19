import { useState, useEffect } from "react";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { api } from "@/lib/api";

const COUNTRY_META = {
  de: { flag: "🇩🇪", name: { it: "Germania", de: "Deutschland", en: "Germany" },
        meaning: { it: "Il numero indica la cenere in mg per 100 g di sostanza secca.", de: "Die Zahl gibt die Asche in mg pro 100 g Trockenmasse an.", en: "The number is the ash in mg per 100 g of dry matter." } },
  fr: { flag: "🇫🇷", name: { it: "Francia", de: "Frankreich", en: "France" },
        meaning: { it: "Il numero francese è quello tedesco diviso 10.", de: "Die französische Zahl ist die deutsche geteilt durch 10.", en: "The French number is the German one divided by 10." } },
  it: { flag: "🇮🇹", name: { it: "Italia", de: "Italien", en: "Italy" },
        meaning: { it: "Classificazione per cenere massima (00, 0, 1, 2, integrale).", de: "Einteilung nach maximaler Asche (00, 0, 1, 2, Vollkorn).", en: "Classified by maximum ash (00, 0, 1, 2, wholemeal)." } },
};

// STADIO P2 — Traduttore di farine IT/DE/FR. Resta nascosto finché l'admin non pubblica.
export default function Farine({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [rows, setRows] = useState([]);
  const [published, setPublished] = useState(true);
  const [country, setCountry] = useState("de");

  useEffect(() => { api.get(`/flour-types`).then((r) => { setRows(r.data.rows || []); setPublished(r.data.published || r.data.is_admin); }).catch(() => {}); }, []);
  const shown = rows.filter((r) => r.country === country);

  return (
    <div data-testid="farine-page" className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <button data-testid="farine-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <h1 className="font-display text-2xl font-black text-foreground">{tri("Che farina uso?", "Welches Mehl nehme ich?", "Which flour do I use?")}</h1>
      <p className="text-[13px] text-muted-foreground">{tri("Traduttore delle farine tra Italia, Germania e Francia.", "Mehl-Übersetzer zwischen Italien, Deutschland und Frankreich.", "Flour translator between Italy, Germany and France.")}</p>

      {!published ? (
        <div className="rounded-2xl border border-border bg-background p-6 text-center text-muted-foreground">{tri("In arrivo.", "Kommt bald.", "Coming soon.")}</div>
      ) : (<>
        <div data-testid="farine-country" className="flex gap-2">
          {Object.keys(COUNTRY_META).map((c) => (
            <button key={c} data-testid={`farine-country-${c}`} onClick={() => setCountry(c)}
              className={`flex-1 px-3 py-2 rounded-xl font-bold text-sm border active:scale-95 transition-all ${country === c ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground"}`}>
              {COUNTRY_META[c].flag} {COUNTRY_META[c].name[lang] || COUNTRY_META[c].name.it}
            </button>
          ))}
        </div>

        <div className="rounded-xl bg-ambra/15 border border-ambra/40 p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-ambra shrink-0 mt-0.5" />
          <p className="text-[12px] text-foreground">{tri(
            "Il tipo indica la cenere, NON la forza del glutine (W) né le proteine: controlla anche l'etichetta.",
            "Der Typ gibt die Asche an, NICHT die Klebkraft (W) oder das Eiweiß: prüfe auch das Etikett.",
            "The type indicates ash, NOT gluten strength (W) or protein: check the label too.")}</p>
        </div>

        <p className="text-[13px] text-foreground font-semibold">{COUNTRY_META[country].meaning[lang] || COUNTRY_META[country].meaning.it}</p>

        <div data-testid="farine-rows" className="space-y-2">
          {shown.map((r) => (
            <div key={r.code} data-testid={`farine-row-${r.code}`} className="rounded-xl border border-border bg-background p-3">
              <div className="flex items-center justify-between">
                <p className="font-black text-foreground">{r.code}</p>
                {r.ash && <span className="text-[11px] font-mono-data text-muted-foreground">{tri("cenere", "Asche", "ash")} {r.ash}</span>}
              </div>
              <p className="text-[13px] text-foreground/85">{(r.use && (r.use[lang] || r.use.it)) || ""}</p>
              {r.w && <p className="text-[11px] text-muted-foreground">W: {r.w}</p>}
              {r.draft_note && <p className="text-[10px] text-mattone mt-1">{tri("indicativo, da verificare da Michele", "Richtwert, von Michele zu prüfen", "indicative, to be verified by Michele")}</p>}
            </div>
          ))}
          {shown.length === 0 && <p className="text-sm text-muted-foreground">{tri("Nessun dato.", "Keine Daten.", "No data.")}</p>}
        </div>
      </>)}
    </div>
  );
}
