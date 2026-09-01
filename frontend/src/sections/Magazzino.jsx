import { useEffect, useState } from "react";
import { Warehouse, Plus, Trash2, Wheat, Package, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// MAGAZZINO materie prime — carico rapido (3 campi) + scalatura automatica dalle impastate.
// Tema Grain Gold (scuro, alto contrasto da laboratorio).
const D = { bg: "#17120B", surf: "#241B10", surf2: "#2E2214", border: "#6E5320", gold: "#E7B23C", text: "#F0E4CC", muted: "#B79B6A", danger: "#E0722E" };

export const warehouseApi = {
  list: () => api.get("/lab/warehouse").then((r) => r.data),
  add: (item) => api.post("/lab/warehouse", item).then((r) => r.data),
  remove: (id) => api.delete(`/lab/warehouse/${id}`).then((r) => r.data),
  consume: (items) => api.post("/lab/warehouse/consume", { items }).then((r) => r.data),
};

export default function Magazzino() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [kind, setKind] = useState("farina");
  const [w, setW] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("kg");
  const [lot, setLot] = useState("");
  const [expiry, setExpiry] = useState("");
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () => warehouseApi.list().then(setItems).catch(() => {});
  useEffect(() => { load(); const on = () => load(); window.addEventListener("mikilab-warehouse-updated", on); return () => window.removeEventListener("mikilab-warehouse-updated", on); }, []);

  const submit = async () => {
    if (!name.trim() || !qty) return;
    setBusy(true);
    try {
      await warehouseApi.add({ name: name.trim(), kind, force_w: w.trim(), quantity_kg: parseFloat(String(qty).replace(",", ".")) || 0, unit, lot: lot.trim(), expiry });
      setName(""); setW(""); setQty(""); setLot(""); setExpiry(""); setMore(false);
      load();
    } finally { setBusy(false); }
  };
  const del = async (id) => { await warehouseApi.remove(id); load(); };

  const inStyle = { background: D.surf2, border: `2px solid ${D.border}`, color: D.text };
  const isExpiring = (e) => { if (!e) return false; try { return (new Date(e).getTime() - Date.now()) / 86400000 <= 7; } catch { return false; } };

  return (
    <div data-testid="magazzino" className="min-h-[70vh] rounded-3xl p-5 pb-28" style={{ background: D.bg, color: D.text, border: `1px solid ${D.border}` }}>
      <div className="flex items-center gap-2 mb-1">
        <Warehouse className="w-6 h-6" style={{ color: D.gold }} />
        <h1 className="font-display font-extrabold leading-tight" style={{ fontSize: "clamp(24px,6vw,34px)", color: D.text }}>{tri("Magazzino Materie Prime", "Rohstofflager", "Raw Materials Stock", "Almacén de Materias", "Stock Matières", "انبار مواد اولیه")}</h1>
      </div>
      <p className="text-[13px] mb-4" style={{ color: D.muted }}>{tri("Carico rapido: nome, forza e quantità. Le impastate confermate scalano da sole le giacenze.", "Schnell erfassen; bestätigte Teige ziehen automatisch ab.", "Quick load; confirmed doughs auto-deduct stock.", "Carga rápida; las masas confirmadas descuentan solo.", "Saisie rapide; les pâtes confirmées déduisent.", "بارگذاری سریع.")}</p>

      {/* Carico rapido — 3 campi principali */}
      <div className="rounded-2xl p-4 mb-5" style={{ background: D.surf, border: `2px solid ${D.border}` }} data-testid="magazzino-form">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button data-testid="mag-kind-farina" onClick={() => setKind("farina")} className="flex items-center justify-center gap-1.5 rounded-xl py-2 font-extrabold text-[13px]" style={{ background: kind === "farina" ? D.gold : D.surf2, border: `2px solid ${kind === "farina" ? D.gold : D.border}`, color: kind === "farina" ? D.bg : D.text }}><Wheat className="w-4 h-4" /> {tri("Farina", "Mehl", "Flour", "Harina", "Farine", "آرد")}</button>
          <button data-testid="mag-kind-ingrediente" onClick={() => setKind("ingrediente")} className="flex items-center justify-center gap-1.5 rounded-xl py-2 font-extrabold text-[13px]" style={{ background: kind === "ingrediente" ? D.gold : D.surf2, border: `2px solid ${kind === "ingrediente" ? D.gold : D.border}`, color: kind === "ingrediente" ? D.bg : D.text }}><Package className="w-4 h-4" /> {tri("Ingrediente", "Zutat", "Ingredient", "Ingrediente", "Ingrédient", "ماده")}</button>
        </div>
        <input data-testid="mag-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={tri("Nome / Tipo (es. Tipo 0)", "Name / Typ", "Name / Type", "Nombre / Tipo", "Nom / Type", "نام / نوع")} className="w-full rounded-xl px-3 py-2.5 mb-2 text-[15px] font-semibold outline-none" style={inStyle} />
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input data-testid="mag-w" value={w} onChange={(e) => setW(e.target.value)} placeholder={kind === "farina" ? tri("Forza W (es. W300)", "Stärke W", "Strength W", "Fuerza W", "Force W", "قدرت W") : tri("Caratteristica", "Merkmal", "Characteristic", "Característica", "Caractéristique", "ویژگی")} className="rounded-xl px-3 py-2.5 text-[15px] font-semibold outline-none" style={inStyle} />
          <div className="flex gap-1.5">
            <input data-testid="mag-qty" value={qty} onChange={(e) => setQty(e.target.value)} inputMode="decimal" placeholder={tri("Quantità", "Menge", "Quantity", "Cantidad", "Quantité", "مقدار")} className="flex-1 min-w-0 rounded-xl px-3 py-2.5 text-[15px] font-extrabold outline-none" style={inStyle} />
            <select data-testid="mag-unit" value={unit} onChange={(e) => setUnit(e.target.value)} className="rounded-xl px-2 py-2.5 text-[14px] font-bold outline-none" style={inStyle}><option value="kg">kg</option><option value="pz">pz</option><option value="L">L</option></select>
          </div>
        </div>
        <button data-testid="mag-more" onClick={() => setMore((m) => !m)} className="flex items-center gap-1 text-[12px] font-bold mb-2" style={{ color: D.gold }}>{more ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />} {tri("Lotto e scadenza (opzionali)", "Charge & MHD (optional)", "Lot & expiry (optional)", "Lote y caducidad", "Lot & péremption", "بچ و انقضا")}</button>
        {more && (
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input data-testid="mag-lot" value={lot} onChange={(e) => setLot(e.target.value)} placeholder={tri("Lotto", "Charge", "Lot", "Lote", "Lot", "بچ")} className="rounded-xl px-3 py-2.5 text-[14px] outline-none" style={inStyle} />
            <input data-testid="mag-expiry" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="rounded-xl px-3 py-2.5 text-[14px] outline-none" style={inStyle} />
          </div>
        )}
        <button data-testid="mag-add" onClick={submit} disabled={busy || !name.trim() || !qty} className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-extrabold active:scale-98 transition-all disabled:opacity-50" style={{ background: D.gold, color: D.bg }}>
          <Plus className="w-5 h-5" /> {tri("Carica in magazzino", "Einlagern", "Add to stock", "Añadir al stock", "Ajouter", "افزودن")}
        </button>
      </div>

      {/* Giacenze */}
      <p className="text-xs font-extrabold uppercase tracking-widest mb-2" style={{ color: D.gold }}>{tri("Giacenze", "Bestand", "Stock", "Existencias", "Stock", "موجودی")}</p>
      <div className="space-y-2" data-testid="magazzino-list">
        {items.length === 0 ? (
          <p className="text-[13px]" style={{ color: D.muted }}>{tri("Magazzino vuoto. Carica la prima farina o ingrediente qui sopra.", "Lager leer.", "Stock empty.", "Almacén vacío.", "Stock vide.", "انبار خالی.")}</p>
        ) : (
          items.map((it) => {
            const low = it.kind === "farina" ? it.quantity_kg <= 5 : it.quantity_kg <= 1;
            const exp = isExpiring(it.expiry);
            return (
              <div key={it.id} data-testid={`mag-item-${it.id}`} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: D.surf, border: `2px solid ${low || exp ? D.danger : D.border}` }}>
                {it.kind === "farina" ? <Wheat className="w-5 h-5 shrink-0" style={{ color: D.gold }} /> : <Package className="w-5 h-5 shrink-0" style={{ color: D.gold }} />}
                <span className="flex-1 min-w-0">
                  <span className="block font-extrabold truncate" style={{ fontSize: "16px", color: D.text }}>{it.name}{it.force_w ? <span className="ml-1.5 text-[12px] font-bold" style={{ color: D.gold }}>{it.force_w}</span> : null}</span>
                  <span className="block text-[11px]" style={{ color: exp ? D.danger : D.muted }}>{it.lot ? `${tri("Lotto", "Charge", "Lot", "Lote", "Lot", "بچ")} ${it.lot} · ` : ""}{it.expiry ? `${tri("scad.", "MHD", "exp.", "cad.", "pér.", "انقضا")} ${it.expiry}${exp ? " ⚠️" : ""}` : ""}</span>
                </span>
                <span className="font-mono-data font-extrabold shrink-0" style={{ fontSize: "20px", color: low ? D.danger : D.gold }}>{Math.round(it.quantity_kg * 100) / 100}<span className="text-[12px] ml-0.5">{it.unit}</span></span>
                <button data-testid={`mag-del-${it.id}`} onClick={() => del(it.id)} className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center active:scale-90" style={{ background: D.surf2, border: `1px solid ${D.border}` }}><Trash2 className="w-4 h-4" style={{ color: D.danger }} /></button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
