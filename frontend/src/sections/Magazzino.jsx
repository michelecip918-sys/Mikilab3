import { useEffect, useRef, useState } from "react";
import { Warehouse, Plus, Trash2, Wheat, Package, ChevronDown, ChevronUp, Camera, ClipboardList, History, Copy } from "lucide-react";
import { toast } from "sonner";
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
  consumption: () => api.get("/lab/warehouse/consumption").then((r) => r.data),
  scanLabel: (image_base64) => api.post("/lab/warehouse/scan-label", { image_base64 }).then((r) => r.data),
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
  const [scanning, setScanning] = useState(false);
  const [consumption, setConsumption] = useState([]);
  const fileRef = useRef(null);

  const load = () => warehouseApi.list().then(setItems).catch(() => {});
  useEffect(() => {
    load();
    warehouseApi.consumption().then(setConsumption).catch(() => {});
    const on = () => { load(); warehouseApi.consumption().then(setConsumption).catch(() => {}); };
    window.addEventListener("mikilab-warehouse-updated", on);
    return () => window.removeEventListener("mikilab-warehouse-updated", on);
  }, []);

  const onScan = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setScanning(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await warehouseApi.scanLabel(String(reader.result));
        const d = res && res.data;
        if (res && res.ok && d && (d.name || d.force_w || d.quantity_kg)) {
          if (d.name) setName(d.name);
          if (d.force_w) setW(d.force_w);
          if (d.quantity_kg) setQty(String(d.quantity_kg));
          if (d.kind === "ingrediente" || d.kind === "farina") setKind(d.kind);
          toast.success(tri("Etichetta letta: controlla e conferma.", "Etikett gelesen.", "Label read: check & confirm.", "Etiqueta leída.", "Étiquette lue.", "برچسب خوانده شد."));
        } else {
          toast.error(tri("Non sono riuscito a leggere l'etichetta. Inserisci a mano.", "Etikett nicht lesbar.", "Couldn't read the label.", "No se pudo leer.", "Étiquette illisible.", "خوانده نشد."));
        }
      } catch { toast.error(tri("Scansione non riuscita.", "Scan fehlgeschlagen.", "Scan failed.", "Escaneo fallido.", "Échec du scan.", "اسکن ناموفق.")); }
      finally { setScanning(false); if (fileRef.current) fileRef.current.value = ""; }
    };
    reader.readAsDataURL(file);
  };

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
          <button data-testid="mag-kind-farina" onClick={() => setKind("farina")} className="flex items-center justify-center gap-1.5 rounded-2xl shadow-md border border-amber-900/40 py-2 font-extrabold text-[13px]" style={{ background: kind === "farina" ? D.gold : D.surf2, border: `2px solid ${kind === "farina" ? D.gold : D.border}`, color: kind === "farina" ? D.bg : D.text }}><Wheat className="w-4 h-4" /> {tri("Farina", "Mehl", "Flour", "Harina", "Farine", "آرد")}</button>
          <button data-testid="mag-kind-ingrediente" onClick={() => setKind("ingrediente")} className="flex items-center justify-center gap-1.5 rounded-2xl shadow-md border border-amber-900/40 py-2 font-extrabold text-[13px]" style={{ background: kind === "ingrediente" ? D.gold : D.surf2, border: `2px solid ${kind === "ingrediente" ? D.gold : D.border}`, color: kind === "ingrediente" ? D.bg : D.text }}><Package className="w-4 h-4" /> {tri("Ingrediente", "Zutat", "Ingredient", "Ingrediente", "Ingrédient", "ماده")}</button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onScan} className="hidden" data-testid="mag-scan-input" />
        <button data-testid="mag-scan" onClick={() => fileRef.current && fileRef.current.click()} disabled={scanning}
          className="w-full flex items-center justify-center gap-2 rounded-2xl shadow-md border border-amber-900/40 py-2.5 mb-2 font-extrabold active:scale-98 transition-all disabled:opacity-60" style={{ background: D.surf2, border: `2px dashed ${D.gold}`, color: D.gold }}>
          <Camera className="w-5 h-5" /> {scanning ? tri("Leggo l'etichetta…", "Lese Etikett…", "Reading label…", "Leyendo…", "Lecture…", "خواندن…") : tri("Scansiona etichetta (foto)", "Etikett scannen", "Scan label (photo)", "Escanear etiqueta", "Scanner l'étiquette", "اسکن برچسب")}
        </button>
        <input data-testid="mag-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={tri("Nome / Tipo (es. Tipo 0)", "Name / Typ", "Name / Type", "Nombre / Tipo", "Nom / Type", "نام / نوع")} className="w-full rounded-2xl shadow-md border border-amber-900/40 px-3 py-2.5 mb-2 text-[15px] font-semibold outline-none" style={inStyle} />
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input data-testid="mag-w" value={w} onChange={(e) => setW(e.target.value)} placeholder={kind === "farina" ? tri("Forza W (es. W300)", "Stärke W", "Strength W", "Fuerza W", "Force W", "قدرت W") : tri("Caratteristica", "Merkmal", "Characteristic", "Característica", "Caractéristique", "ویژگی")} className="rounded-2xl shadow-md border border-amber-900/40 px-3 py-2.5 text-[15px] font-semibold outline-none" style={inStyle} />
          <div className="flex gap-1.5">
            <input data-testid="mag-qty" value={qty} onChange={(e) => setQty(e.target.value)} inputMode="decimal" placeholder={tri("Quantità", "Menge", "Quantity", "Cantidad", "Quantité", "مقدار")} className="flex-1 min-w-0 rounded-2xl shadow-md border border-amber-900/40 px-3 py-2.5 text-[15px] font-extrabold outline-none" style={inStyle} />
            <select data-testid="mag-unit" value={unit} onChange={(e) => setUnit(e.target.value)} className="rounded-2xl shadow-md border border-amber-900/40 px-2 py-2.5 text-[14px] font-bold outline-none" style={inStyle}><option value="kg">kg</option><option value="pz">pz</option><option value="L">L</option></select>
          </div>
        </div>
        <button data-testid="mag-more" onClick={() => setMore((m) => !m)} className="flex items-center gap-1 text-[12px] font-bold mb-2" style={{ color: D.gold }}>{more ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />} {tri("Lotto e scadenza (opzionali)", "Charge & MHD (optional)", "Lot & expiry (optional)", "Lote y caducidad", "Lot & péremption", "بچ و انقضا")}</button>
        {more && (
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input data-testid="mag-lot" value={lot} onChange={(e) => setLot(e.target.value)} placeholder={tri("Lotto", "Charge", "Lot", "Lote", "Lot", "بچ")} className="rounded-2xl shadow-md border border-amber-900/40 px-3 py-2.5 text-[14px] outline-none" style={inStyle} />
            <input data-testid="mag-expiry" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="rounded-2xl shadow-md border border-amber-900/40 px-3 py-2.5 text-[14px] outline-none" style={inStyle} />
          </div>
        )}
        <button data-testid="mag-add" onClick={submit} disabled={busy || !name.trim() || !qty} className="w-full flex items-center justify-center gap-2 rounded-2xl shadow-md border border-amber-900/40 py-3 font-extrabold active:scale-98 transition-all disabled:opacity-50" style={{ background: D.gold, color: D.bg }}>
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

      {/* Lista riordino fornitori (sotto scorta) */}
      {(() => {
        const reorder = items.filter((it) => (it.kind === "farina" ? it.quantity_kg <= 5 : it.quantity_kg <= 1));
        if (reorder.length === 0) return null;
        const text = reorder.map((it) => `${it.name}${it.force_w ? " " + it.force_w : ""} — ${Math.round(it.quantity_kg * 100) / 100}${it.unit}`).join("\n");
        return (
          <div className="mt-5" data-testid="mag-reorder">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-1.5" style={{ color: D.danger }}><ClipboardList className="w-4 h-4" /> {tri("Lista riordino fornitori", "Nachbestell-Liste", "Supplier reorder list", "Lista de reposición", "Liste de réappro", "لیست سفارش")}</p>
              <button data-testid="mag-reorder-copy" onClick={() => { try { navigator.clipboard.writeText(text); toast.success(tri("Lista copiata.", "Kopiert.", "Copied.", "Copiado.", "Copié.", "کپی شد.")); } catch { /* */ } }}
                className="flex items-center gap-1 text-[12px] font-bold" style={{ color: D.gold }}><Copy className="w-3.5 h-3.5" /> {tri("Copia", "Kopieren", "Copy", "Copiar", "Copier", "کپی")}</button>
            </div>
            <div className="space-y-1.5">
              {reorder.map((it) => (
                <div key={it.id} className="flex items-center justify-between rounded-2xl shadow-md border border-amber-900/40 px-3 py-2" style={{ background: "#2E2214", border: `2px solid ${D.danger}` }}>
                  <span className="text-[13px] font-bold" style={{ color: D.text }}>{it.name}{it.force_w ? ` · ${it.force_w}` : ""}</span>
                  <span className="font-mono-data font-extrabold text-[14px]" style={{ color: D.danger }}>{Math.round(it.quantity_kg * 100) / 100}{it.unit}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Storico consumi */}
      <div className="mt-5" data-testid="mag-consumption">
        <p className="text-xs font-extrabold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: D.gold }}><History className="w-4 h-4" /> {tri("Storico consumi", "Verbrauchsverlauf", "Consumption history", "Historial de consumo", "Historique conso", "تاریخچه مصرف")}</p>
        {consumption.length === 0 ? (
          <p className="text-[13px]" style={{ color: D.muted }}>{tri("Nessun consumo registrato. Si aggiorna a ogni impastata confermata.", "Noch kein Verbrauch.", "No consumption yet.", "Sin consumo aún.", "Aucune conso.", "مصرفی ثبت نشده.")}</p>
        ) : (
          <div className="space-y-1.5">
            {consumption.slice(0, 20).map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-2xl shadow-md border border-amber-900/40 px-3 py-2" style={{ background: D.surf, border: `1px solid ${D.border}` }}>
                <span className="text-[12.5px] font-bold truncate" style={{ color: D.text }}>{c.name}</span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="font-mono-data font-extrabold text-[13px]" style={{ color: D.gold }}>-{Math.round(c.kg * 1000) / 1000} kg</span>
                  <span className="text-[10px]" style={{ color: D.muted }}>{(() => { try { return new Date(c.at).toLocaleString(lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch { return ""; } })()}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
