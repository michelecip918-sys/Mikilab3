import { useState, useEffect } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { api } from "@/lib/api";
import { Wrench, Settings } from "lucide-react";

const MYTOOLS_KEY = "mikilab_my_tools";

const DEVICES = [
  { id: "planetaria", it: "Planetaria", de: "Küchenmaschine", en: "Stand mixer", cap: true },
  { id: "bimby", it: "Bimby / Thermomix", de: "Thermomix", en: "Thermomix" },
  { id: "macchina_pane", it: "Macchina del pane", de: "Brotbackautomat", en: "Bread machine" },
  { id: "mani", it: "Solo mani", de: "Nur Hände", en: "Hands only" },
  { id: "forno_statico", it: "Forno statico", de: "Ober-/Unterhitze", en: "Static oven" },
  { id: "forno_ventilato", it: "Forno ventilato", de: "Umluftofen", en: "Fan oven" },
  { id: "ghisa", it: "Pentola in ghisa", de: "Gusseisentopf", en: "Cast iron pot" },
  { id: "bilancia_1g", it: "Bilancia 1 g", de: "Waage 1 g", en: "Scale 1 g" },
  { id: "bilancia_01g", it: "Bilancia 0,1 g", de: "Waage 0,1 g", en: "Scale 0.1 g" },
  { id: "termometro", it: "Termometro", de: "Thermometer", en: "Thermometer" },
];

export default function AttrezziGuide() {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const li = (o) => (lang === "de" ? o.de : lang === "en" ? o.en : o.it);
  const [items, setItems] = useState([]);
  const [mine, setMine] = useState(() => { try { return JSON.parse(localStorage.getItem(MYTOOLS_KEY) || "{}"); } catch { return {}; } });

  useEffect(() => { api.get(`/equipment-guide`).then((r) => setItems(r.data?.items || [])).catch(() => { /* */ }); }, []);
  const save = (m) => { setMine(m); try { localStorage.setItem(MYTOOLS_KEY, JSON.stringify(m)); } catch { /* */ } };
  const toggle = (id) => save({ ...mine, [id]: mine[id] ? undefined : (id === "planetaria" ? { cap: mine.planetaria?.cap || "" } : true) });
  const setCap = (v) => save({ ...mine, planetaria: { cap: v } });

  return (
    <div data-testid="attrezzi-guide" className="space-y-6">
      {/* I MIEI ATTREZZI */}
      <section className="rounded-2xl border border-primary/30 bg-background p-4">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-primary mb-3"><Settings className="w-3.5 h-3.5" /> {tri("I miei attrezzi", "Meine Geräte", "My tools")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DEVICES.map((d) => (
            <button key={d.id} data-testid={`mytool-${d.id}`} onClick={() => toggle(d.id)}
              className={`text-left px-3 py-2 rounded-xl border text-xs font-bold transition-all ${mine[d.id] ? "bg-primary text-white border-primary" : "bg-background text-foreground border-border hover:border-primary/60"}`}>
              {li(d)}
            </button>
          ))}
        </div>
        {mine.planetaria && (
          <div className="mt-3">
            <label className="text-xs text-muted-foreground">{tri("Capienza planetaria (L o kg farina)", "Kapazität Küchenmaschine (L oder kg Mehl)", "Mixer capacity (L or kg flour)")}</label>
            <input data-testid="mytool-planetaria-cap" value={mine.planetaria?.cap || ""} onChange={(e) => setCap(e.target.value)}
              placeholder={tri("es. 5 L", "z. B. 5 L", "e.g. 5 L")}
              className="mt-1 w-full sm:w-56 bg-background border border-border rounded-lg text-xs text-foreground px-2.5 py-1.5 outline-none focus:border-primary" />
            <p className="text-[11px] text-muted-foreground mt-1">{tri("Con impastatrici piccole rispetta la capienza indicata dal produttore.", "Bei kleinen Maschinen die Herstellerangabe zur Kapazität beachten.", "With small mixers respect the manufacturer's capacity.")}</p>
          </div>
        )}
        <p className="text-[11px] text-muted-foreground mt-3">{tri("Salvato nel tuo dispositivo. Sitor li userà nei consigli.", "Auf deinem Gerät gespeichert. Sitor nutzt sie in den Tipps.", "Saved on your device. Sitor will use them in tips.")}</p>
      </section>

      {/* GUIDA ATTREZZI */}
      <section>
        <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-muted-foreground mb-3"><Wrench className="w-3.5 h-3.5" /> {tri("Attrezzi: a cosa servono", "Geräte: wofür sie sind", "Tools: what they're for")}</p>
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} data-testid={`equip-guide-${i}`} className="rounded-xl border border-border bg-background p-3">
              <p className="font-bold text-foreground text-sm">{li(it)}</p>
              {it.buy && <p className="text-[11px] text-muted-foreground mt-0.5">{tri("Dove cercarlo:", "Wo suchen:", "Where to look:")} {li(it.buy)}</p>}
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-muted-foreground">{tri("Caricamento…", "Wird geladen…", "Loading…")}</p>}
        </div>
      </section>
    </div>
  );
}
