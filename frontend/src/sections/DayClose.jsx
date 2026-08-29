import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare, Thermometer, ShieldCheck, Archive, CalendarCheck, LogIn, Package,
  QrCode, Sparkles, ChevronRight, ChevronLeft, Plus, X, Trash2, Boxes, Save, AlertTriangle,
  FileText, History, Send, Search, Download, Pencil, BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { useLang } from "@/i18n/LanguageContext";
import { addXP } from "@/lib/level";
import { useAuth } from "@/auth/AuthContext";
import { capoPlanApi, labConfigApi, recipesApi, inventoryApi, dayCloseApi } from "@/lib/api";
import { computeShopping } from "@/lib/shopping";
import { SUPPLIERS } from "@/data/suppliers";
import { mkTri } from "@/i18n/triMaps";

const CLEAN_ITEMS = [
  ["mixers", "Impastatrici", "Kneter"],
  ["benches", "Banchi da lavoro", "Arbeitsflächen"],
  ["dividers", "Spezzatrici / Formatrici", "Teigteiler / Former"],
  ["floors", "Pavimenti", "Böden"],
  ["cells", "Celle & Frigo", "Kammern & Kühlung"],
  ["ovens", "Forni", "Öfen"],
];

const genLot = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  const rnd = Math.floor(10 + Math.random() * 89);
  return `ML-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${rnd}`;
};

export default function DayClose() {
  const { lang } = useLang();
  const tri = (i, d) => mkTri(lang)(i, d);
  const { user, setAuthOpen } = useAuth();

  const [step, setStep] = useState(1);
  const [produced, setProduced] = useState([]);
  const [lot, setLot] = useState(genLot());
  const [inventory, setInventory] = useState([]);
  const [consume, setConsume] = useState([]);
  const [temps, setTemps] = useState([]);
  const [cleaning, setCleaning] = useState({});
  const [anomalies, setAnomalies] = useState("");
  const [operator, setOperator] = useState("");
  const [note, setNote] = useState("");
  const [signature, setSignature] = useState("");
  const [saving, setSaving] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [recipeById, setRecipeById] = useState({});
  const [mode, setMode] = useState("wizard"); // wizard | storico
  const [closures, setClosures] = useState([]);
  const [search, setSearch] = useState("");
  const [lastId, setLastId] = useState(null);
  const [supplierEmail, setSupplierEmail] = useState(() => { try { return localStorage.getItem("mikilab_supplier_email") || ""; } catch { return ""; } });

  const load = useCallback(async () => {
    if (!user) return;
    setOperator(user.name || user.email || "");
    // Prodotti dal piano di produzione salvato
    try {
      const plan = await capoPlanApi.get();
      const prods = ((plan && plan.state && plan.state.products) || []).filter((p) => p.recipe_id || p.name);
      setProduced(prods.length ? prods.map((p) => ({ recipe_id: p.recipe_id || "", name: p.name || "", qty: p.qty || "", unit: p.unit || "pz", gpp: p.gpp || "" })) : [{ recipe_id: "", name: "", qty: "", unit: "pz", gpp: "" }]);
    } catch { setProduced([{ recipe_id: "", name: "", qty: "", unit: "pz", gpp: "" }]); }
    // Ricette per calcolo scarico
    try {
      const [mk, ps] = await Promise.all([recipesApi.list("mikilab"), recipesApi.list("personal")]);
      const map = {}; [...(mk || []), ...(ps || [])].forEach((r) => { map[r.id] = r; }); setRecipeById(map);
    } catch { /* */ }
    // Magazzino
    try { const inv = await inventoryApi.get(); setInventory(inv.items || []); } catch { /* */ }
    // Celle per le temperature
    try {
      const cfg = await labConfigApi.get();
      const cells = (cfg && cfg.cells) || [];
      setTemps(cells.length ? cells.map((c) => ({ name: c.name || c.type || tri("Cella", "Kammer"), temp_c: "" })) : [
        { name: tri("Frigo", "Kühlschrank"), temp_c: "" },
        { name: tri("Cella di lievitazione", "Gärkammer"), temp_c: "" },
        { name: "Freezer", temp_c: "" },
      ]);
    } catch { setTemps([{ name: tri("Frigo", "Kühlschrank"), temp_c: "" }, { name: "Freezer", temp_c: "" }]); }
  }, [user]); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  // Suggerimento scarico materie prime dal piano (in kg)
  const suggestConsume = () => {
    const items = produced.filter((p) => p.recipe_id && Number(p.qty) > 0).map((p) => ({
      recipe_id: p.recipe_id,
      grams: p.unit === "kg" ? Number(p.qty) * 1000 : Number(p.qty) * Number(p.gpp || 500),
    }));
    const totals = computeShopping(items, recipeById, lang);
    const rows = [];
    Object.entries(totals.flourByType).forEach(([k, g]) => rows.push({ name: k, qty: +(g / 1000).toFixed(2) }));
    if (totals.others.sourdough_grams) rows.push({ name: tri("Lievito madre", "Sauerteig"), qty: +(totals.others.sourdough_grams / 1000).toFixed(2) });
    Object.entries(totals.extras).forEach(([k, g]) => rows.push({ name: k, qty: +(g / 1000).toFixed(2) }));
    if (!rows.length) { toast.message(tri("Aggiungi prodotti con ricetta e quantità per calcolare lo scarico.", "Füge Produkte mit Rezept und Menge hinzu.")); return; }
    setConsume(rows);
    toast.success(tri("Scarico calcolato dal piano ✓", "Abbuchung aus dem Plan berechnet ✓"));
  };

  const saveInventory = async () => {
    try { const r = await inventoryApi.save(inventory); setInventory(r.items || inventory); toast.success(tri("Magazzino salvato", "Lager gespeichert")); }
    catch { toast.error(tri("Errore salvataggio magazzino", "Fehler beim Speichern")); }
  };

  const loadClosures = async () => {
    try { const r = await dayCloseApi.list(); setClosures(r.closures || []); } catch { /* */ }
  };

  const downloadPdf = async (id, lotName) => {
    try {
      const blob = await dayCloseApi.pdf(id, lang);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chiusura-${(lotName || id)}.pdf`.replace(/\s+/g, "_");
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      toast.success(tri("Report PDF scaricato", "PDF-Bericht geladen"));
    } catch { toast.error(tri("Errore nel generare il PDF", "Fehler beim PDF")); }
  };

  const lowStockItems = inventory.filter((it) => it.threshold != null && Number(it.qty) <= Number(it.threshold));
  const supplierOrder = () => {
    const src = lowStockItems.length ? lowStockItems : inventory;
    if (!src.length) { toast.message(tri("Nessuna materia da ordinare", "Keine Rohstoffe zu bestellen")); return; }
    const withEmail = SUPPLIERS.find((s) => s.country === (lang === "de" ? "de" : "it") && s.email) || SUPPLIERS.find((s) => s.email);
    const to = (supplierEmail || "").trim() || (withEmail ? withEmail.email : "");
    const subject = tri("Ordine materie prime · MikiLab", "Rohstoffbestellung · MikiLab");
    const lines = src.map((it) => `- ${it.name}: ${it.qty} ${it.unit || "kg"}${it.threshold != null ? ` (${tri("soglia", "Schwelle")} ${it.threshold})` : ""}`).join("\n");
    const body = `${tri("Buongiorno,", "Guten Tag,")}\n${tri("vorrei ordinare:", "ich möchte bestellen:")}\n\n${lines}\n\n${tri("Grazie!", "Danke!")}`;
    window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const doClose = async () => {
    if (!user) { setAuthOpen(true); return; }
    setSaving(true);
    try {
      await saveInventory().catch(() => {});
      const res = await dayCloseApi.close({
        produced: produced.filter((p) => p.name || p.recipe_id),
        consume: consume.filter((c) => c.name && Number(c.qty) > 0),
        temps: temps.filter((t) => t.name).map((t) => ({ name: t.name, temp_c: t.temp_c === "" ? null : Number(t.temp_c) })),
        cleaning, anomalies: anomalies.trim(), operator: operator.trim(), note: note.trim(),
        production_lot: lot.trim(), signature, lang,
      });
      setCelebrate(true);
      setLastId((res.closure && res.closure.id) || null);
      addXP(3);
      toast.success(tri(`Giornata chiusa · ${res.haccp_created} voci nel Registro HACCP ✅`, `Tag abgeschlossen · ${res.haccp_created} HACCP-Einträge ✅`));
    } catch { toast.error(tri("Errore durante la chiusura", "Fehler beim Abschluss")); }
    setSaving(false);
  };

  const inp = "w-full bg-[#121212] dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-xl px-3 py-2.5 outline-none text-[#2B303B] dark:text-[#e4eff8] focus:border-[#ff6b00]";

  // Consumi settimanali (farina vs lievito) dagli scarichi delle chiusure archiviate
  const consumption = useMemo(() => {
    const isFlour = (n) => /farin|mehl|semola|integral|vollkorn|hartweizen|dinkel|roggen|weizen|manitob|grano|type ?\d/i.test(n || "");
    const isYeast = (n) => /lievit|madre|sauerteig|hefe|licoli|poolish|biga|starter/i.test(n || "");
    const toKg = (q, u) => { const v = Number(q) || 0; if (u === "g") return v / 1000; if (u === "pz" || u === "L") return 0; return v; };
    const byWeek = {};
    closures.forEach((c) => {
      const d = new Date(c.closed_at || c.date);
      if (isNaN(d.getTime())) return;
      const off = (d.getDay() + 6) % 7;
      const monday = new Date(d); monday.setDate(d.getDate() - off);
      const key = monday.toISOString().slice(0, 10);
      const label = `${String(monday.getDate()).padStart(2, "0")}/${String(monday.getMonth() + 1).padStart(2, "0")}`;
      const rows = (c.consume && c.consume.length) ? c.consume.map((x) => ({ name: x.name, qty: x.qty, unit: x.unit || "kg" })) : (c.deducted || []);
      rows.forEach((r) => {
        const kg = toKg(r.qty, r.unit || "kg");
        if (!kg) return;
        if (!byWeek[key]) byWeek[key] = { key, label, flour: 0, yeast: 0 };
        if (isFlour(r.name)) byWeek[key].flour += kg;
        else if (isYeast(r.name)) byWeek[key].yeast += kg;
      });
    });
    return Object.values(byWeek).sort((a, b) => a.key.localeCompare(b.key)).slice(-8)
      .map((w) => ({ ...w, flour: +w.flour.toFixed(1), yeast: +w.yeast.toFixed(1) }));
  }, [closures]);
  const hasConsumption = consumption.some((w) => w.flour > 0 || w.yeast > 0);
  const lowStock = lowStockItems;

  if (!user) {
    return (
      <div className="pb-40" data-testid="dayclose">
        <Header tri={tri} />
        <button data-testid="dayclose-login" onClick={() => setAuthOpen(true)} className="w-full flex items-center justify-center gap-2 bg-[#ff6b00] text-white font-semibold py-3 rounded-2xl">
          <LogIn className="w-5 h-5" /> {tri("Accedi per la chiusura turno", "Zum Abschließen anmelden")}
        </button>
      </div>
    );
  }

  return (
    <div className="pb-40" data-testid="dayclose">
      <Header tri={tri} />

      {/* Toggle Nuova chiusura / Storico */}
      <div data-testid="dayclose-modeswitch" className="grid grid-cols-2 gap-2 mb-4 bg-[#e4eff8] dark:bg-[#1e1e1e] rounded-2xl p-1">
        <button data-testid="dayclose-mode-wizard" onClick={() => setMode("wizard")}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${mode === "wizard" ? "bg-white dark:bg-[#1e1e1e] text-[#ff6b00] dark:text-[#8FB0C2] shadow-sm" : "text-[#7E8A93]"}`}>
          <CheckSquare className="w-4 h-4" /> {tri("Nuova chiusura", "Neuer Abschluss")}
        </button>
        <button data-testid="dayclose-mode-storico" onClick={() => { setMode("storico"); loadClosures(); }}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${mode === "storico" ? "bg-white dark:bg-[#1e1e1e] text-[#ff6b00] dark:text-[#8FB0C2] shadow-sm" : "text-[#7E8A93]"}`}>
          <History className="w-4 h-4" /> {tri("Storico chiusure", "Archiv")}
        </button>
      </div>

      {mode === "storico" ? (
        <div data-testid="dayclose-storico" className="space-y-3">
          <div data-testid="consumption-chart" className="bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-2xl p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase text-[#ff6b00] mb-3"><BarChart3 className="w-4 h-4" /> {tri("Consumi settimanali (farina e lieviti)", "Wochenverbrauch (Mehl & Hefen)")}</p>
            {hasConsumption ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={consumption} margin={{ top: 6, right: 10, left: 2, bottom: 0 }} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4eff8" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#7E8A93" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#7E8A93" }} axisLine={false} tickLine={false} width={52} unit="kg" />
                  <Tooltip cursor={{ fill: "rgba(63,124,172,0.08)" }} formatter={(v, n) => [`${v} kg`, n]} labelFormatter={(l) => tri("Settimana del ", "Woche vom ") + l} />
                  <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                  <Bar dataKey="flour" name={tri("Farina", "Mehl")} fill="#ff6b00" radius={[4, 4, 0, 0]} maxBarSize={26} />
                  <Bar dataKey="yeast" name={tri("Lievito", "Hefe")} fill="#ff6b00" radius={[4, 4, 0, 0]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p data-testid="consumption-empty" className="text-sm text-[#7E8A93] text-center py-6">{tri("Ancora nessun consumo registrato. Chiudi qualche giornata con lo scarico materie prime per vedere il grafico.", "Noch kein Verbrauch erfasst. Schließe einige Tage mit Rohstoff-Abbuchung ab.")}</p>
            )}
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7E8A93]" />
            <input data-testid="storico-search" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={tri("Cerca per data o lotto…", "Nach Datum oder Charge suchen…")} className={inp + " pl-9"} />
          </div>
          {(() => {
            const q = search.trim().toLowerCase();
            const list = closures.filter((c) => !q || (c.date || "").toLowerCase().includes(q) || (c.production_lot || "").toLowerCase().includes(q));
            if (!list.length) return <p data-testid="storico-empty" className="text-sm text-[#7E8A93] text-center py-8">{tri("Nessuna chiusura archiviata.", "Keine archivierten Abschlüsse.")}</p>;
            return list.map((c) => (
              <div key={c.id} data-testid={`storico-item-${c.id}`} className="bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#2B303B] dark:text-[#e4eff8]">{c.date} · <span className="font-mono-data text-[#ff6b00] dark:text-[#8FB0C2]">{c.production_lot || tri("senza lotto", "ohne Charge")}</span></p>
                  <p className="text-[11px] text-[#7E8A93] mt-0.5">{tri("Operatore", "Bediener")}: {c.operator || "—"} · {(c.produced || []).length} {tri("prodotti", "Produkte")} · {(c.temps || []).filter((t) => t.temp_c != null && t.temp_c !== "").length} {tri("temp.", "Temp.")} · {Object.values(c.cleaning || {}).filter(Boolean).length} {tri("pulizie", "Reinigungen")}</p>
                </div>
                <button data-testid={`storico-pdf-${c.id}`} onClick={() => downloadPdf(c.id, c.production_lot)}
                  className="shrink-0 inline-flex items-center gap-1.5 bg-[#ff6b00] text-white text-xs font-semibold px-3 py-2 rounded-xl active:scale-95">
                  <FileText className="w-3.5 h-3.5" /> PDF
                </button>
              </div>
            ));
          })()}
        </div>
      ) : (
      <>
      {/* Stepper */}
      <div data-testid="dayclose-stepper" className="flex items-center gap-1 mb-5">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${step >= n ? "bg-[#ff6b00] text-white" : "bg-[#e4eff8] dark:bg-[#1e1e1e] text-[#7E8A93]"}`}>{n}</div>
            {n < 3 && <div className={`h-1 flex-1 rounded ${step > n ? "bg-[#ff6b00]" : "bg-[#e4eff8] dark:bg-[#1e1e1e]"}`} />}
          </div>
        ))}
      </div>
      <p className="text-xs font-bold uppercase tracking-wide text-[#ff6b00] mb-3">
        {step === 1 ? tri("1 · Tracciabilità & Lotti", "1 · Rückverfolgbarkeit & Chargen")
          : step === 2 ? tri("2 · Registro Sanitario & HACCP", "2 · Hygiene- & HACCP-Register")
          : tri("3 · Chiusura & Archiviazione", "3 · Abschluss & Archivierung")}
      </p>

      {/* STEP 1 */}
      {step === 1 && (
        <div data-testid="dayclose-step-1" className="space-y-4">
          <Card icon={<QrCode className="w-4 h-4" />} title={tri("Lotto di produzione", "Produktionscharge")}>
            <div className="flex gap-2">
              <input data-testid="dayclose-lot" value={lot} onChange={(e) => setLot(e.target.value)} className={inp + " font-mono-data"} />
              <button data-testid="dayclose-lot-regen" onClick={() => setLot(genLot())} className="shrink-0 px-3 rounded-xl bg-[#e4eff8] dark:bg-[#1e1e1e] text-[#ff6b00] text-xs font-semibold">{tri("Nuovo", "Neu")}</button>
            </div>
            <p className="text-[11px] text-[#7E8A93] mt-1.5">{tri("Assegnato ai prodotti pronti alla vendita.", "Wird den verkaufsfertigen Produkten zugewiesen.")}</p>
          </Card>

          <Card icon={<CheckSquare className="w-4 h-4" />} title={tri("Quantità prodotte oggi", "Heute produzierte Mengen")}>
            <div className="space-y-2">
              {produced.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input data-testid={`dayclose-prod-name-${i}`} value={p.name} placeholder={tri("Prodotto", "Produkt")}
                    onChange={(e) => setProduced((l) => l.map((x, k) => k === i ? { ...x, name: e.target.value } : x))} className={inp} />
                  <input data-testid={`dayclose-prod-qty-${i}`} type="number" value={p.qty} placeholder={tri("Qtà", "Menge")}
                    onChange={(e) => setProduced((l) => l.map((x, k) => k === i ? { ...x, qty: e.target.value } : x))} className={inp + " w-24"} />
                  <button onClick={() => setProduced((l) => l.filter((_, k) => k !== i))} className="text-[#ff6b00] p-1 shrink-0"><X className="w-4 h-4" /></button>
                </div>
              ))}
              <button data-testid="dayclose-prod-add" onClick={() => setProduced((l) => [...l, { recipe_id: "", name: "", qty: "", unit: "pz", gpp: "" }])} className="text-sm font-medium text-[#ff6b00] flex items-center gap-1"><Plus className="w-4 h-4" /> {tri("Aggiungi prodotto", "Produkt hinzufügen")}</button>
            </div>
          </Card>

          <Card icon={<Boxes className="w-4 h-4" />} title={tri("Magazzino materie prime", "Rohstofflager")}>
            {lowStock.length > 0 && (
              <div data-testid="dayclose-lowstock" className="flex flex-wrap items-center gap-2 bg-[#ff6b00]/10 border border-[#ff6b00]/30 rounded-xl px-3 py-2 mb-2 text-[#ff6b00] text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {tri(`${lowStock.length} materie sotto soglia`, `${lowStock.length} Rohstoffe unter Schwelle`)}
                <button data-testid="dayclose-order-supplier" onClick={supplierOrder}
                  className="ml-auto inline-flex items-center gap-1.5 bg-[#ff6b00] text-white px-2.5 py-1 rounded-full active:scale-95">
                  <Send className="w-3 h-3" /> {tri("Ordina al fornitore", "Beim Lieferanten bestellen")}
                </button>
              </div>
            )}
            <div className="space-y-2">
              {inventory.map((it, i) => (
                <div key={it.id || i} className="rounded-xl border border-[#2e2e2e] dark:border-[#2e2e2e] p-2 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <input data-testid={`inv-name-${i}`} value={it.name} placeholder={tri("Materia prima", "Rohstoff")}
                      onChange={(e) => setInventory((l) => l.map((x, k) => k === i ? { ...x, name: e.target.value } : x))} className={inp} />
                    <button onClick={() => setInventory((l) => l.filter((_, k) => k !== i))} className="text-[#ff6b00] p-1 shrink-0"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input data-testid={`inv-qty-${i}`} type="number" value={it.qty} placeholder={tri("Qtà", "Menge")}
                      onChange={(e) => setInventory((l) => l.map((x, k) => k === i ? { ...x, qty: e.target.value } : x))} className={inp + " flex-1 min-w-0"} />
                    <select data-testid={`inv-unit-${i}`} value={it.unit} onChange={(e) => setInventory((l) => l.map((x, k) => k === i ? { ...x, unit: e.target.value } : x))} className={inp + " w-16 px-1 shrink-0"}>
                      <option>kg</option><option>g</option><option>pz</option><option>L</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-[#ff6b00] shrink-0"><AlertTriangle className="w-3.5 h-3.5" /> {tri("Soglia avviso", "Warnschwelle")}</span>
                    <input data-testid={`inv-threshold-${i}`} type="number" value={it.threshold ?? ""} placeholder={tri("es. 10", "z. B. 10")}
                      onChange={(e) => setInventory((l) => l.map((x, k) => k === i ? { ...x, threshold: e.target.value === "" ? null : Number(e.target.value) } : x))} className={inp + " flex-1 min-w-0"} />
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-2">
                <button data-testid="inv-add" onClick={() => setInventory((l) => [...l, { name: "", category: "farina", qty: 0, unit: "kg", threshold: null }])} className="text-sm font-medium text-[#ff6b00] flex items-center gap-1"><Plus className="w-4 h-4" /> {tri("Aggiungi materia", "Rohstoff")}</button>
                <button data-testid="inv-save" onClick={saveInventory} className="text-sm font-semibold text-white bg-[#ff6b00] px-3 py-1.5 rounded-full flex items-center gap-1"><Save className="w-3.5 h-3.5" /> {tri("Salva magazzino", "Lager speichern")}</button>
              </div>
              <p className="text-[11px] text-[#7E8A93] flex items-start gap-1"><AlertTriangle className="w-3.5 h-3.5 text-[#ff6b00] shrink-0 mt-0.5" /> {tri("Imposta una soglia: ricevi un'email quando la materia scende sotto quel livello.", "Lege eine Schwelle fest: du erhältst eine E-Mail, wenn der Rohstoff darunter fällt.")}</p>
              <div className="pt-2 border-t border-[#2e2e2e] dark:border-[#2e2e2e]">
                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-[#ff6b00] mb-1"><Send className="w-3.5 h-3.5" /> {tri("Email fornitore (per ordine rapido)", "Lieferanten-E-Mail (Schnellbestellung)")}</label>
                <input data-testid="supplier-email" type="email" value={supplierEmail}
                  onChange={(e) => { setSupplierEmail(e.target.value); try { localStorage.setItem("mikilab_supplier_email", e.target.value); } catch { /* */ } }}
                  placeholder="ordini@fornitore.it" className={inp} />
                <p className="text-[11px] text-[#7E8A93] mt-1">{tri("Salvata sul dispositivo: l'ordine rapido partirà già col destinatario giusto.", "Auf dem Gerät gespeichert: die Schnellbestellung geht an den richtigen Empfänger.")}</p>
              </div>
            </div>
          </Card>

          <Card icon={<Package className="w-4 h-4" />} title={tri("Scarico materie prime (dal piano)", "Rohstoff-Abbuchung (aus Plan)")}>
            <button data-testid="dayclose-suggest" onClick={suggestConsume} className="w-full mb-2 text-sm font-semibold text-white bg-[#ff6b00] py-2 rounded-xl active:scale-98 flex items-center justify-center gap-1.5"><Sparkles className="w-4 h-4" /> {tri("Calcola scarico dal piano", "Abbuchung aus Plan berechnen")}</button>
            <div className="space-y-2">
              {consume.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input data-testid={`consume-name-${i}`} value={c.name} onChange={(e) => setConsume((l) => l.map((x, k) => k === i ? { ...x, name: e.target.value } : x))} className={inp} />
                  <input data-testid={`consume-qty-${i}`} type="number" value={c.qty} onChange={(e) => setConsume((l) => l.map((x, k) => k === i ? { ...x, qty: e.target.value } : x))} className={inp + " w-20"} />
                  <span className="text-xs text-[#7E8A93] shrink-0">kg</span>
                  <button onClick={() => setConsume((l) => l.filter((_, k) => k !== i))} className="text-[#ff6b00] p-1 shrink-0"><X className="w-4 h-4" /></button>
                </div>
              ))}
              <button data-testid="consume-add" onClick={() => setConsume((l) => [...l, { name: "", qty: "" }])} className="text-sm font-medium text-[#ff6b00] flex items-center gap-1"><Plus className="w-4 h-4" /> {tri("Aggiungi voce", "Eintrag")}</button>
              <p className="text-[11px] text-[#7E8A93]">{tri("Alla chiusura queste quantità vengono scalate dal magazzino.", "Beim Abschluss werden diese Mengen vom Lager abgezogen.")}</p>
            </div>
          </Card>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div data-testid="dayclose-step-2" className="space-y-4">
          <Card icon={<Thermometer className="w-4 h-4" />} title={tri("Controllo temperature", "Temperaturkontrolle")}>
            <div className="space-y-2">
              {temps.map((tp, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input data-testid={`temp-name-${i}`} value={tp.name} onChange={(e) => setTemps((l) => l.map((x, k) => k === i ? { ...x, name: e.target.value } : x))} className={inp} />
                  <div className="relative w-24 shrink-0">
                    <input data-testid={`temp-val-${i}`} type="number" step="0.1" value={tp.temp_c} placeholder="°C"
                      onChange={(e) => setTemps((l) => l.map((x, k) => k === i ? { ...x, temp_c: e.target.value } : x))} className={inp + " pr-7"} />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#7E8A93]">°C</span>
                  </div>
                  <button onClick={() => setTemps((l) => l.filter((_, k) => k !== i))} className="text-[#ff6b00] p-1 shrink-0"><X className="w-4 h-4" /></button>
                </div>
              ))}
              <button data-testid="temp-add" onClick={() => setTemps((l) => [...l, { name: "", temp_c: "" }])} className="text-sm font-medium text-[#ff6b00] flex items-center gap-1"><Plus className="w-4 h-4" /> {tri("Aggiungi punto", "Punkt hinzufügen")}</button>
            </div>
          </Card>

          <Card icon={<ShieldCheck className="w-4 h-4" />} title={tri("Pulizie & Sanificazione", "Reinigung & Sanitisierung")}>
            <div className="grid grid-cols-2 gap-2">
              {CLEAN_ITEMS.map(([key, it, de]) => {
                const on = !!cleaning[tri(it, de)] || !!cleaning[it];
                return (
                  <button key={key} data-testid={`clean-${key}`} onClick={() => setCleaning((c) => ({ ...c, [tri(it, de)]: !on }))}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left border transition-all active:scale-97 ${on ? "bg-[#ff6b00] text-white border-[#ff6b00]" : "bg-white dark:bg-[#1e1e1e] text-[#2B303B] dark:text-[#e4eff8] border-[#2e2e2e] dark:border-[#2e2e2e]"}`}>
                    <CheckSquare className={`w-4 h-4 shrink-0 ${on ? "text-white" : "text-[#7E8A93]"}`} />
                    <span className="text-xs font-semibold leading-tight">{tri(it, de)}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card icon={<AlertTriangle className="w-4 h-4" />} title={tri("Registro anomalie", "Abweichungen")}>
            <textarea data-testid="dayclose-anomalies" rows={3} value={anomalies} onChange={(e) => setAnomalies(e.target.value)}
              placeholder={tri("Es. scarti, fermo impastatrice, cella fuori temperatura…", "z. B. Ausschuss, Kneter-Stillstand, Kammer außer Temperatur…")}
              className={inp + " resize-none"} />
          </Card>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div data-testid="dayclose-step-3" className="space-y-4">
          <Card icon={<CalendarCheck className="w-4 h-4" />} title={tri("Chiusura del registro", "Registerabschluss")}>
            <label className="text-[11px] font-bold uppercase text-[#7E8A93]">{tri("Operatore", "Bediener")}</label>
            <input data-testid="dayclose-operator" value={operator} onChange={(e) => setOperator(e.target.value)} className={inp + " mt-1 mb-3"} />
            <label className="text-[11px] font-bold uppercase text-[#7E8A93]">{tri("Nota di chiusura (facoltativa)", "Abschlussnotiz (optional)")}</label>
            <textarea data-testid="dayclose-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={inp + " mt-1 resize-none"} />
            <p className="text-[11px] text-[#7E8A93] mt-2">{tri("Data", "Datum")}: {new Date().toLocaleDateString(lang === "de" ? "de-DE" : "it-IT")} · {tri("Lotto", "Charge")}: <span className="font-mono-data">{lot}</span></p>
          </Card>

          <Card icon={<Pencil className="w-4 h-4" />} title={tri("Firma operatore", "Unterschrift Bediener")}>
            <SignaturePad value={signature} onChange={setSignature} tri={tri} />
            <p className="text-[11px] text-[#7E8A93] mt-1.5">{tri("Firma col dito o col mouse: comparirà sul report PDF per gli ispettori.", "Mit Finger oder Maus unterschreiben: erscheint im PDF-Bericht für Inspektoren.")}</p>
          </Card>

          <Card icon={<Archive className="w-4 h-4" />} title={tri("Riepilogo", "Zusammenfassung")}>
            <ul className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] space-y-1">
              <li>• {tri("Prodotti", "Produkte")}: {produced.filter((p) => p.name).length}</li>
              <li>• {tri("Scarico materie prime", "Abbuchungen")}: {consume.filter((c) => c.name && Number(c.qty) > 0).length}</li>
              <li>• {tri("Temperature registrate", "Temperaturen")}: {temps.filter((t) => t.name && t.temp_c !== "").length}</li>
              <li>• {tri("Sanificazioni", "Reinigungen")}: {Object.values(cleaning).filter(Boolean).length}</li>
            </ul>
            <div className="mt-3 flex items-start gap-2 bg-[#ff6b00]/12 border border-[#ff6b00]/30 rounded-xl p-2.5">
              <ShieldCheck className="w-4 h-4 text-[#ff6b00] dark:text-[#a9d2ec] shrink-0 mt-0.5" />
              <p className="text-[12px] text-[#ff6b00] dark:text-[#8FB0C2]">{tri("Alla conferma i dati vengono archiviati e sincronizzati automaticamente nel Registro HACCP.", "Bei Bestätigung werden die Daten archiviert und automatisch ins HACCP-Register übernommen.")}</p>
            </div>
          </Card>

          <button data-testid="dayclose-confirm" onClick={doClose} disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-[#ff6b00] hover:bg-[#ff8a33] disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl active:scale-98 shadow-md">
            <CheckSquare className="w-5 h-5" /> {saving ? tri("Chiusura…", "Abschluss…") : tri("Concludi turno & archivia", "Schicht abschließen & archivieren")}
          </button>
        </div>
      )}

      {/* Nav */}
      <div className="flex items-center justify-between mt-5">
        <button data-testid="dayclose-prev" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] text-[#ff6b00] dark:text-[#a9d2ec] font-semibold text-sm disabled:opacity-40 active:scale-95">
          <ChevronLeft className="w-4 h-4" /> {tri("Indietro", "Zurück")}
        </button>
        {step < 3 && (
          <button data-testid="dayclose-next" onClick={() => setStep((s) => Math.min(3, s + 1))}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#ff6b00] text-white font-semibold text-sm active:scale-95">
            {tri("Avanti", "Weiter")} <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
      </>
      )}

      <AnimatePresence>
        {celebrate && (
          <motion.div data-testid="dayclose-celebrate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setCelebrate(false)}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#1A1412]/85 backdrop-blur-sm px-6 cursor-pointer">
            <div className="relative flex items-center justify-center">
              <motion.img src={`${process.env.PUBLIC_URL || ""}/michele-avatar-full.jpg`} alt="Michele"
                initial={{ x: -140, rotate: -10, opacity: 0 }} animate={{ x: -4, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 130, damping: 12, delay: 0.1 }}
                className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-2xl" />
              <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.5, 1], opacity: 1 }}
                transition={{ delay: 0.55, duration: 0.5 }} className="mx-1 text-5xl drop-shadow-lg">🙌</motion.div>
              <motion.img src={`${process.env.PUBLIC_URL || ""}/mohammed-avatar.jpg`} alt="Mohammed"
                initial={{ x: 140, rotate: 10, opacity: 0 }} animate={{ x: 4, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 130, damping: 12, delay: 0.1 }}
                className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-2xl" />
            </div>
            <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.65 }}
              className="mt-6 font-display text-2xl font-bold text-white text-center">
              {tri("Turno chiuso, Maestro! 👏", "Schicht abgeschlossen, Meister! 👏")}
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              className="mt-1 text-white/85 text-sm text-center max-w-xs">
              {tri("Registro HACCP aggiornato e magazzino scalato. Buon riposo!", "HACCP-Register aktualisiert und Lager gebucht. Gute Erholung!")}
            </motion.p>
            <div className="mt-6 flex flex-col items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
              {lastId && (
                <button data-testid="dayclose-download-pdf" onClick={() => downloadPdf(lastId, lot)}
                  className="inline-flex items-center gap-2 bg-[#ff6b00] text-white font-bold px-6 py-2.5 rounded-full active:scale-95">
                  <Download className="w-4 h-4" /> {tri("Scarica report PDF", "PDF-Bericht laden")}
                </button>
              )}
              <button data-testid="dayclose-celebrate-close" onClick={() => setCelebrate(false)} className="bg-white text-[#2B303B] font-bold px-7 py-2.5 rounded-full active:scale-95">
                {tri("Grazie!", "Danke!")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Header({ tri }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-11 h-11 rounded-2xl bg-[#ff6b00] flex items-center justify-center"><CalendarCheck className="w-6 h-6 text-white" /></div>
      <div>
        <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Chiusura Turno & Registro HACCP", "Schichtabschluss & HACCP-Register")}</h1>
        <p className="text-sm text-[#7E8A93]">{tri("Tracciabilità, registro sanitario e archiviazione in 3 passi", "Rückverfolgbarkeit, Hygiene und Archivierung in 3 Schritten")}</p>
      </div>
    </div>
  );
}

function Card({ icon, title, children }) {
  return (
    <div className="bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-2xl p-4">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase text-[#ff6b00] mb-2.5">{icon} {title}</p>
      {children}
    </div>
  );
}

function SignaturePad({ value, onChange, tri }) {
  const ref = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);

  const point = (e) => {
    const c = ref.current;
    const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  };
  const start = (e) => { e.preventDefault(); drawing.current = true; last.current = point(e); try { e.target.setPointerCapture(e.pointerId); } catch { /* */ } };
  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = ref.current.getContext("2d");
    const p = point(e);
    ctx.strokeStyle = "#1a2b3a"; ctx.lineWidth = 2.6; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last.current = p;
  };
  const end = () => { if (!drawing.current) return; drawing.current = false; onChange(ref.current.toDataURL("image/png")); };
  const clear = () => { const c = ref.current; c.getContext("2d").clearRect(0, 0, c.width, c.height); onChange(""); };

  return (
    <div>
      <div className="relative rounded-xl border-2 border-dashed border-[#c7d6e5] dark:border-[#2e2e2e] bg-[#f8fbfe] dark:bg-[#181818] overflow-hidden">
        <canvas ref={ref} width={600} height={180} data-testid="signature-pad"
          onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerLeave={end}
          className="w-full touch-none" style={{ height: "150px", cursor: "crosshair" }} />
        {!value && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-[#9fb2c2]">
            {tri("Firma qui ✍️", "Hier unterschreiben ✍️")}
          </span>
        )}
      </div>
      <button type="button" data-testid="signature-clear" onClick={clear}
        className="mt-2 text-xs font-semibold text-[#ff6b00] active:scale-95">
        {tri("Cancella firma", "Unterschrift löschen")}
      </button>
    </div>
  );
}
