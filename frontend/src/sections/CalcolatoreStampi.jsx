import { mkTri } from "@/i18n/triMaps";
import { useState, useMemo } from "react";
import { ChevronRight, Cookie, Square, Circle } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

// Pezzatura pirottino panettone -> impasto consigliato (g) con testa che sfora
const PIROTTINI = { 100: 110, 500: 550, 750: 825, 1000: 1100 };
// Densità impasto (g per cm2) per tipo prodotto in teglia
const DENS = { focaccia: 0.65, pizza: 0.5, pane: 0.75 };

export default function CalcolatoreStampi({ onBack }) {
  const { lang } = useLang();
  const L = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const num = (v) => Math.round(v).toLocaleString(lang === "en" ? "en" : "it");
  const inp = "w-full bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] rounded-xl px-3 py-2.5 outline-none text-[#2C1E16] dark:text-[#e4eff8] focus:border-[#D97706] font-mono-data";
  const lbl = "text-[12px] font-semibold text-[#6B5546] dark:text-[#AEB8BF] mb-1";
  const card = "rounded-2xl bg-[#FAF5EC] dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] p-4 shadow-sm";

  const [mode, setMode] = useState("pirottini");
  // Pirottini
  const [size, setSize] = useState(500);
  const [pezzi, setPezzi] = useState(6);
  const totImpasto = useMemo(() => (PIROTTINI[size] || 0) * (Number(pezzi) || 0), [size, pezzi]);
  // Teglia
  const [shape, setShape] = useState("rect");
  const [a, setA] = useState(40);
  const [b, setB] = useState(30);
  const [prod, setProd] = useState("focaccia");
  const teglia = useMemo(() => {
    const area = shape === "round" ? Math.PI * Math.pow((Number(a) || 0) / 2, 2) : (Number(a) || 0) * (Number(b) || 0);
    return { area, dough: area * (DENS[prod] || 0.6) };
  }, [shape, a, b, prod]);

  return (
    <div className="pb-8" data-testid="calc-stampi">
      {onBack && <button data-testid="stampi-back" onClick={onBack} className="flex items-center gap-1 text-[#8C4A27] font-medium mb-4"><ChevronRight className="w-5 h-5 rotate-180" /> {L("Indietro", "Zurück", "Back", "Atrás")}</button>}
      <div className="relative overflow-hidden rounded-3xl p-6 text-[#FFFDF9] shadow-xl mb-5" style={{ background: "linear-gradient(135deg,#B45309,#8C4A27 60%,#4A3222)" }}>
        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center mb-3"><Cookie className="w-7 h-7" /></div>
        <h1 className="font-display text-2xl font-bold">{L("Calcolatore Stampi & Pirottini", "Formen-Rechner", "Pan & Mould Calculator", "Calculadora de Moldes")}</h1>
        <p className="text-[#FFFDF9]/85 text-sm mt-2 leading-snug">{L("Quanto impasto serve per i pirottini del panettone o per la tua teglia.", "Wie viel Teig für Panettone-Formen oder dein Blech.", "How much dough for panettone moulds or your pan.", "Cuánta masa para moldes de panettone o tu bandeja.")}</p>
      </div>

      <div className="flex gap-1.5 bg-[#F2E8D5] p-1.5 rounded-2xl mb-5 border border-[#E6D8C3]">
        {[["pirottini", L("Pirottini", "Formen", "Moulds", "Moldes"), Cookie], ["teglia", L("Teglia / Tortiera", "Blech / Form", "Pan / Tin", "Bandeja")], ].map(([id, label]) => (
          <button key={id} data-testid={`stampi-tab-${id}`} onClick={() => setMode(id)} className={`flex-1 py-2 rounded-xl text-[13px] font-bold transition-all ${mode === id ? "bg-[#8C4A27] text-[#FFFDF9] shadow" : "text-[#6B5546]"}`}>{label}</button>
        ))}
      </div>

      {mode === "pirottini" ? (
        <div className={card}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><p className={lbl}>{L("Pezzatura pirottino", "Formengröße", "Mould size", "Tamaño molde")}</p>
              <select data-testid="stampi-size" value={size} onChange={(e) => setSize(Number(e.target.value))} className={inp}>
                {Object.keys(PIROTTINI).map((k) => <option key={k} value={k}>{k} g</option>)}
              </select></div>
            <div><p className={lbl}>{L("Numero di pezzi", "Stückzahl", "Number of pieces", "Nº de piezas")}</p><input data-testid="stampi-pezzi" type="number" value={pezzi} onChange={(e) => setPezzi(e.target.value)} className={inp} /></div>
          </div>
          <div data-testid="stampi-pirottini-out" className="rounded-xl bg-[#FEF3C7] p-4 text-center">
            <p className="text-[11px] font-semibold text-[#92400E]">{L("Impasto totale necessario", "Benötigter Teig gesamt", "Total dough needed", "Masa total necesaria")}</p>
            <p className="font-display text-3xl font-bold text-[#8C4A27] mt-1">{num(totImpasto)} g</p>
            <p className="text-[12px] text-[#6B5546] mt-1">{num(PIROTTINI[size])} g {L("per pirottino", "pro Form", "per mould", "por molde")} ({L("include la testa che lievita oltre il bordo", "inkl. Überstand", "includes rise over the rim", "incluye la cúpula")})</p>
          </div>
        </div>
      ) : (
        <div className={card}>
          <div className="flex gap-1.5 mb-3">
            {[["rect", L("Rettangolare", "Rechteckig", "Rectangular", "Rectangular"), Square], ["round", L("Tonda", "Rund", "Round", "Redonda"), Circle]].map(([id, label, Icon]) => (
              <button key={id} data-testid={`stampi-shape-${id}`} onClick={() => setShape(id)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[13px] font-bold border transition-all ${shape === id ? "bg-[#8C4A27] text-[#FFFDF9] border-transparent" : "bg-white dark:bg-[#232A31] text-[#6B5546] border-[#E6D8C3]"}`}><Icon className="w-4 h-4" /> {label}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {shape === "round" ? (
              <div className="col-span-2"><p className={lbl}>{L("Diametro (cm)", "Durchmesser (cm)", "Diameter (cm)", "Diámetro (cm)")}</p><input data-testid="stampi-a" type="number" value={a} onChange={(e) => setA(e.target.value)} className={inp} /></div>
            ) : (<>
              <div><p className={lbl}>{L("Lunghezza (cm)", "Länge (cm)", "Length (cm)", "Largo (cm)")}</p><input data-testid="stampi-a" type="number" value={a} onChange={(e) => setA(e.target.value)} className={inp} /></div>
              <div><p className={lbl}>{L("Larghezza (cm)", "Breite (cm)", "Width (cm)", "Ancho (cm)")}</p><input data-testid="stampi-b" type="number" value={b} onChange={(e) => setB(e.target.value)} className={inp} /></div>
            </>)}
          </div>
          <div className="mb-3"><p className={lbl}>{L("Prodotto", "Produkt", "Product", "Producto")}</p>
            <select data-testid="stampi-prod" value={prod} onChange={(e) => setProd(e.target.value)} className={inp}>
              <option value="focaccia">{L("Focaccia (soffice)", "Focaccia (weich)", "Focaccia (soft)", "Focaccia")}</option>
              <option value="pizza">{L("Pizza in teglia", "Blechpizza", "Pan pizza", "Pizza en bandeja")}</option>
              <option value="pane">{L("Pane / pagnotta", "Brot", "Bread / loaf", "Pan")}</option>
            </select></div>
          <div data-testid="stampi-teglia-out" className="rounded-xl bg-[#FEF3C7] p-4 text-center">
            <p className="text-[11px] font-semibold text-[#92400E]">{L("Impasto consigliato", "Empfohlener Teig", "Recommended dough", "Masa recomendada")}</p>
            <p className="font-display text-3xl font-bold text-[#8C4A27] mt-1">{num(teglia.dough)} g</p>
            <p className="text-[12px] text-[#6B5546] mt-1">{L("Superficie", "Fläche", "Area", "Superficie")}: {num(teglia.area)} cm²</p>
          </div>
        </div>
      )}
    </div>
  );
}
