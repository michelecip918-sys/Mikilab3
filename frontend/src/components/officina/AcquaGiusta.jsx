import { useState } from "react";
import { Thermometer, Snowflake } from "lucide-react";
import { mkTri } from "@/i18n/triMaps";
import { num, clamp, recipeKind, fmt1 } from "@/lib/sitorTools";

// V92 — ACQUA GIUSTA. Formula del panettiere: T acqua = (T impasto voluta × N) − (aria + farina [+ prefermento]) − attrito.
// N = 3 (o 4 se c'è un prefermento). L'attrito dipende da come impasti: a mano ~3 °C, planetaria ~9 °C, spirale ~13 °C.

const FRICTION = { mano: 3, planetaria: 9, spirale: 13 };
const DDT_BY_KIND = { pane: 25, panini: 25, pizza: 24, focaccia: 25, panettone: 26, dolce: 26, laugen: 24 };

function Slider({ label, value, onChange, min, max, testid, hint }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-[12.5px] text-muted-foreground"><span>{label}</span><span className="font-mono-data font-bold text-foreground">{fmt1(value)} °C</span></span>
      <input data-testid={testid} type="range" min={min} max={max} step="1" value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[hsl(var(--primary))]" />
      {hint ? <span className="block text-[11px] text-muted-foreground -mt-0.5">{hint}</span> : null}
    </label>
  );
}

export default function AcquaGiusta({ r, dough, lang }) {
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const kind = recipeKind(r);
  const hasPre = !!(dough.biga || dough.items.some((i) => i.key === "pre"));
  const [ddt, setDdt] = useState(DDT_BY_KIND[kind] || 25);
  const [room, setRoom] = useState(22);
  const [flourT, setFlourT] = useState(null);   // null = come l'aria
  const [preT, setPreT] = useState(null);       // null = come l'aria
  const [method, setMethod] = useState("mano");
  const [tap, setTap] = useState(15);
  const fT = flourT == null ? room : flourT;
  const pT = preT == null ? room : preT;
  const N = hasPre ? 4 : 3;
  const friction = FRICTION[method];
  const waterT = ddt * N - (room + fT + (hasPre ? pT : 0)) - friction;
  const waterG = (dough.items.find((i) => i.key === "water") || {}).grams || dough.totalWater || 0;
  const noAdjust = (room + fT + (hasPre ? pT : 0) + tap + friction) / N;
  const needIce = waterT < 4 && tap > Math.max(waterT, 1);
  const tw = Math.max(waterT, 1);
  const ice = needIce && waterG > 0 ? Math.round((waterG * (tap - tw)) / (80 + tw)) : 0;
  const tooHot = waterT > 45;

  return (
    <div data-testid="acqua-giusta" className="space-y-3">
      <p className="text-[12.5px] text-foreground/85 leading-snug">
        {tri("Con l'acqua alla temperatura giusta l'impasto finisce sempre alla stessa temperatura, d'estate come d'inverno: è il segreto per avere tempi di lievitazione uguali a quelli scritti nella ricetta.",
          "Mit Wasser in der richtigen Temperatur endet der Teig immer bei derselben Temperatur, im Sommer wie im Winter: so stimmen die Garzeiten aus dem Rezept.",
          "With the water at the right temperature the dough always ends at the same temperature, summer or winter: that is the secret to getting the proofing times written in the recipe.")}
      </p>
      <div className="rounded-xl border border-border bg-card p-3 space-y-2.5">
        <Slider testid="ag-ddt" label={tri("Temperatura dell'impasto che voglio", "Gewünschte Teigtemperatur", "Dough temperature I want")} value={ddt} onChange={setDdt} min={20} max={29}
          hint={kind === "panettone" || kind === "dolce" ? tri("Impasti ricchi di burro: 26-27 °C", "Butterreiche Teige: 26-27 °C", "Butter-rich doughs: 26-27 °C") : kind === "pizza" ? tri("Pizza: 23-24 °C", "Pizza: 23-24 °C", "Pizza: 23-24 °C") : tri("Pane e focacce: 24-26 °C", "Brot und Focaccia: 24-26 °C", "Bread and focaccia: 24-26 °C")} />
        <Slider testid="ag-room" label={tri("Aria della cucina", "Raumluft in der Küche", "Kitchen air")} value={room} onChange={(v) => { setRoom(v); }} min={10} max={36} />
        <Slider testid="ag-flour" label={tri("Farina", "Mehl", "Flour")} value={fT} onChange={setFlourT} min={2} max={36}
          hint={flourT == null ? tri("Di solito è come l'aria. Farina dal frigo: 4-6 °C.", "Meist wie die Luft. Mehl aus dem Kühlschrank: 4-6 °C.", "Usually same as the air. Flour from the fridge: 4-6 °C.") : null} />
        {hasPre && <Slider testid="ag-pre" label={dough.biga ? (dough.biga.kind === "poolish" ? "Poolish" : "Biga") : tri("Lievito madre", "Sauerteig", "Sourdough")} value={pT} onChange={setPreT} min={2} max={36}
          hint={tri("Biga dal frigo o dalla cantina: 16-18 °C.", "Biga aus Kühlschrank oder Keller: 16-18 °C.", "Biga from fridge or cellar: 16-18 °C.")} />}
        <div>
          <span className="block text-[12.5px] text-muted-foreground mb-1">{tri("Come impasti", "Wie du knetest", "How you knead")}</span>
          <div className="flex flex-wrap gap-1.5">
            {[["mano", tri("A mano", "Von Hand", "By hand")], ["planetaria", tri("Planetaria", "Küchenmaschine", "Stand mixer")], ["spirale", tri("Spirale", "Spiralkneter", "Spiral mixer")]].map(([k, l]) => (
              <button key={k} data-testid={`ag-method-${k}`} onClick={() => setMethod(k)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all active:scale-95 ${method === k ? "bg-primary text-white border-primary" : "bg-background text-muted-foreground border-border"}`}>
                {l} <span className="opacity-70">+{FRICTION[k]} °C</span>
              </button>
            ))}
          </div>
          <span className="block text-[11px] text-muted-foreground mt-1">{tri("Impastare scalda: la macchina di più, le mani di meno.", "Kneten erwärmt: die Maschine mehr, die Hände weniger.", "Kneading warms the dough: machines more, hands less.")}</span>
        </div>
      </div>

      <div data-testid="ag-result" className={`rounded-xl border p-3.5 ${tooHot ? "" : "border-salvia/50 bg-salvia/10"}`} style={tooHot ? { borderColor: "hsl(var(--mattone) / 0.5)", background: "hsl(var(--mattone) / 0.1)" } : undefined}>
        <div className="flex items-center gap-3">
          <Thermometer className="w-6 h-6 text-salvia shrink-0" />
          <div>
            <p className="text-[12px] text-muted-foreground">{tri("Usa l'acqua a", "Nimm Wasser mit", "Use water at")}</p>
            <p className="font-display text-3xl font-bold text-foreground leading-none">{Math.round(clamp(waterT, 0, 60))} °C</p>
          </div>
          {waterG > 0 && <p className="ml-auto text-right text-[12px] text-muted-foreground">{tri("per i", "für die", "for the")} <span className="font-mono-data font-bold text-foreground">{waterG} g</span> {tri("d'acqua della ricetta", "Wasser des Rezepts", "of water in the recipe")}</p>}
        </div>
        {tooHot && <p className="text-[12px] text-foreground mt-2">{tri("Sopra i 45 °C l'acqua rovina il lievito. Scalda piuttosto la cucina o la farina (vicino al termosifone) e impasta un po' più a lungo.", "Über 45 °C schadet das Wasser der Hefe. Wärme lieber Küche oder Mehl (nahe der Heizung) und knete etwas länger.", "Above 45 °C water harms the yeast. Warm the kitchen or the flour (near a radiator) instead and knead a little longer.")}</p>}
        {needIce && (
          <div data-testid="ag-ice" className="mt-2.5 rounded-lg bg-background border border-border p-2.5 text-[12.5px] text-foreground/90">
            <p className="flex items-center gap-1.5 font-semibold"><Snowflake className="w-3.5 h-3.5 text-salvia" /> {tri("Acqua troppo fredda per il rubinetto: fai così", "Zu kalt für den Wasserhahn: so geht's", "Too cold for the tap: do this")}</p>
            <label className="flex items-center justify-between gap-2 mt-1.5">
              <span className="text-muted-foreground">{tri("Acqua del rubinetto a", "Leitungswasser mit", "Tap water at")}</span>
              <span className="flex items-center gap-1"><input data-testid="ag-tap" type="number" min="1" max="40" value={tap} onChange={(e) => setTap(clamp(num(e.target.value), 1, 40))} className="w-14 text-right font-mono-data text-sm font-bold text-primary bg-card border border-border rounded-lg px-2 py-1 outline-none" /> °C</span>
            </label>
            {waterG > 0 ? (
              <p className="mt-1.5">{tri("Pesa", "Wiege", "Weigh")} <b className="font-mono-data">{waterG - ice} g</b> {tri("di acqua del rubinetto e", "Leitungswasser und", "of tap water and")} <b className="font-mono-data">{ice} g</b> {tri("di ghiaccio: il ghiaccio conta come acqua, sciogliendosi porta il tutto a", "Eis: das Eis zählt als Wasser und bringt alles beim Schmelzen auf", "of ice: ice counts as water and, melting, brings the mix to")} ≈ {Math.round(tw)} °C.</p>
            ) : (
              <p className="mt-1.5">{tri("Usa acqua con ghiaccio e farina messa in frigo la sera prima.", "Nimm Eiswasser und Mehl, das über Nacht im Kühlschrank lag.", "Use iced water and flour left in the fridge overnight.")}</p>
            )}
          </div>
        )}
        <p className="text-[11.5px] text-muted-foreground mt-2.5">
          {tri("Se invece usi l'acqua così com'è", "Nimmst du das Wasser einfach so", "If you use the water as it comes")} ({tap} °C), {tri("l'impasto finirà a circa", "endet der Teig bei etwa", "the dough will end at about")} <b className="font-mono-data text-foreground">{Math.round(noAdjust)} °C</b>{noAdjust - ddt > 2 ? ` — ${tri("lieviterà più in fretta di quanto dice la ricetta", "er geht schneller als im Rezept", "it will rise faster than the recipe says")}.` : noAdjust - ddt < -2 ? ` — ${tri("lieviterà più lentamente di quanto dice la ricetta", "er geht langsamer als im Rezept", "it will rise slower than the recipe says")}.` : ` — ${tri("va bene così", "das passt", "that's fine")}.`}
        </p>
      </div>
      <p className="text-[12px] text-salvia leading-snug">
        {tri("Sitor: d'estate il trucco più semplice è la farina in frigo la sera prima e l'acqua con qualche cubetto di ghiaccio pesato. D'inverno, acqua tiepida e ciotola lontana dalla finestra.",
          "Sitor: Im Sommer ist der einfachste Trick Mehl über Nacht im Kühlschrank und Wasser mit ein paar abgewogenen Eiswürfeln. Im Winter lauwarmes Wasser und die Schüssel weg vom Fenster.",
          "Sitor: in summer the easiest trick is flour in the fridge overnight and water with a few weighed ice cubes. In winter, lukewarm water and the bowl away from the window.")}
      </p>
    </div>
  );
}
