import { useEffect, useState, useCallback } from "react";
import { Container, Droplets, PackagePlus, Mail, Check, Plus, Pencil, Trash2, X, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { mikeApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Silos & Materie Prime — completamente gestibili dal Capo: aggiungi/rinomina/elimina
// e correggi a mano livello (kg) e umidità dei silos reali del laboratorio.
export default function SiloManager() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [data, setData] = useState({ silos: [], reorder_count: 0 });
  const [supplier, setSupplier] = useState("");
  const [savedSup, setSavedSup] = useState("");
  const [newName, setNewName] = useState("");
  const [newKg, setNewKg] = useState("");
  const [edit, setEdit] = useState(null); // { id, name, current_kg, humidity_pct }
  const [dragIdx, setDragIdx] = useState(null);

  const reorder = async (from, to) => {
    if (from === null || from === to) return;
    const arr = [...data.silos];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    setData((d) => ({ ...d, silos: arr })); // feedback immediato
    try { await mikeApi.siloReorder(arr.map((x) => x.id)); } catch { load(); }
  };

  const load = useCallback(async () => { try { setData(await mikeApi.silos()); } catch { /* */ } }, []);
  useEffect(() => { load(); const iv = setInterval(load, 12000); return () => clearInterval(iv); }, [load]);
  useEffect(() => { mikeApi.siloSupplierGet().then((r) => { setSupplier(r.email || ""); setSavedSup(r.email || ""); }).catch(() => { /* */ }); }, []);

  const saveSupplier = async () => {
    try { await mikeApi.siloSupplierSet(supplier.trim()); setSavedSup(supplier.trim()); toast.success(tri("Email fornitore salvata.", "Gespeichert.", "Supplier email saved.", "Guardado.", "Enregistré.", "ذخیره شد.")); }
    catch { toast.error("Error"); }
  };
  const microorder = async () => {
    try { const r = await mikeApi.siloMicroorder(); toast.success(r.emailed ? tri(`Micro-ordini inviati a ${r.supplier}`, `An ${r.supplier}`, `Emailed to ${r.supplier}`, `A ${r.supplier}`, `À ${r.supplier}`, `به ${r.supplier}`) : tri(`Micro-ordini: ${r.count}`, `Micro: ${r.count}`, `Micro-orders: ${r.count}`, `Micro: ${r.count}`, `Micro: ${r.count}`, `میکرو: ${r.count}`)); load(); } catch { /* */ }
  };
  const addSilo = async () => {
    const nm = newName.trim();
    if (!nm) return;
    try { await mikeApi.siloCreate({ name: nm, current_kg: Number(newKg) || 0, capacity_kg: Math.max(Number(newKg) || 0, 1000) }); setNewName(""); setNewKg(""); toast.success(tri("Silo aggiunto ✓", "Silo hinzugefügt ✓", "Silo added ✓", "Silo añadido ✓", "Silo ajouté ✓", "سیلو اضافه شد ✓")); load(); } catch { toast.error("Error"); }
  };
  const saveEdit = async () => {
    if (!edit) return;
    try { await mikeApi.siloUpdate(edit.id, { name: edit.name.trim(), current_kg: Number(edit.current_kg) || 0, humidity_pct: Number(edit.humidity_pct) || 0 }); setEdit(null); toast.success(tri("Aggiornato ✓", "Aktualisiert ✓", "Updated ✓", "Actualizado ✓", "Mis à jour ✓", "به‌روزرسانی ✓")); load(); } catch { toast.error("Error"); }
  };
  const delSilo = async (sid) => { try { await mikeApi.siloDelete(sid); load(); } catch { /* */ } };
  const loadPreset = async (activity) => {
    try { const r = await mikeApi.siloPreset(activity); toast.success(r.added > 0 ? tri(`Aggiunti ${r.added} silos tipici`, `${r.added} Silos geladen`, `Added ${r.added} typical silos`, `Añadidos ${r.added}`, `${r.added} silos ajoutés`, `${r.added} سیلو اضافه شد`) : tri("Sono già presenti", "Bereits vorhanden", "Already present", "Ya presentes", "Déjà présents", "قبلاً موجود است")); load(); } catch { toast.error("Error"); }
  };

  return (
    <div data-testid="silo-manager" className="space-y-2">
      <div data-testid="silo-presets" className="rounded-lg bg-background/60 border border-primary/25 p-2.5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5">{tri("Precarica silos tipici", "Typische Silos laden", "Load typical silos", "Cargar silos típicos", "Charger silos types", "بارگذاری سیلوهای معمول")}</p>
        <div className="flex flex-wrap gap-1.5">
          {[["panificio", tri("Panificio", "Bäckerei", "Bakery", "Panadería", "Boulangerie", "نانوایی")], ["pizzeria", tri("Pizzeria", "Pizzeria", "Pizzeria", "Pizzería", "Pizzeria", "پیتزا")], ["pasticceria", tri("Pasticceria", "Konditorei", "Pastry", "Pastelería", "Pâtisserie", "شیرینی")]].map(([k, label]) => (
            <button key={k} data-testid={`silo-preset-${k}`} onClick={() => loadPreset(k)} className="px-3 py-1.5 rounded-full text-[12px] font-bold bg-primary/15 border border-primary/40 text-primary-foreground active:scale-95 transition-all">{label}</button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5 rounded-lg bg-background border border-border/30 px-2.5 py-1.5">
        <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
        <input data-testid="silo-supplier-input" type="email" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder={tri("Email fornitore (per micro-ordini)", "Lieferanten-E-Mail", "Supplier email", "Email proveedor", "Email fournisseur", "ایمیل تأمین‌کننده")} className="flex-1 min-w-0 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground" />
        {supplier.trim() !== savedSup && <button data-testid="silo-supplier-save" onClick={saveSupplier} className="shrink-0 text-muted-foreground"><Check className="w-4 h-4" /></button>}
      </div>

      {data.silos.map((s, idx) => {
        const col = s.needs_reorder ? "hsl(var(--mattone))" : s.fill_pct < 40 ? "hsl(var(--muted-foreground))" : "hsl(var(--accent))";
        const isEdit = edit && edit.id === s.id;
        return (
          <div key={s.id} data-testid={`silo-${s.id}`}
            draggable={!isEdit}
            onDragStart={() => setDragIdx(idx)}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={() => { reorder(dragIdx, idx); setDragIdx(null); }}
            onDragEnd={() => setDragIdx(null)}
            className="rounded-xl border p-2.5" style={{ borderColor: `${col}44`, background: `${col}0a`, opacity: dragIdx === idx ? 0.5 : 1 }}>
            {isEdit ? (
              <div className="space-y-2">
                <input data-testid={`silo-edit-name-${s.id}`} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className="w-full bg-background border border-border/40 rounded-md px-2 py-1.5 text-sm text-foreground outline-none" />
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-muted-foreground w-20">{tri("Livello kg", "Menge kg", "Level kg", "Nivel kg", "Niveau kg", "کیلو")}</label>
                  <input data-testid={`silo-edit-kg-${s.id}`} type="number" value={edit.current_kg} onChange={(e) => setEdit({ ...edit, current_kg: e.target.value })} className="flex-1 bg-background border border-border/40 rounded-md px-2 py-1.5 text-sm text-foreground outline-none" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-muted-foreground w-20">{tri("Umidità %", "Feuchte %", "Humidity %", "Humedad %", "Humidité %", "رطوبت %")}</label>
                  <input data-testid={`silo-edit-hum-${s.id}`} type="number" step="0.1" value={edit.humidity_pct} onChange={(e) => setEdit({ ...edit, humidity_pct: e.target.value })} className="flex-1 bg-background border border-border/40 rounded-md px-2 py-1.5 text-sm text-foreground outline-none" />
                </div>
                <div className="flex gap-2 justify-end">
                  <button data-testid={`silo-save-${s.id}`} onClick={saveEdit} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-accent/20 border border-accent/50 text-accent text-xs font-bold"><Check className="w-3.5 h-3.5" /> {tri("Salva", "Speichern", "Save", "Guardar", "Enregistrer", "ذخیره")}</button>
                  <button data-testid={`silo-cancel-${s.id}`} onClick={() => setEdit(null)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-muted-foreground text-xs"><X className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <GripVertical data-testid={`silo-drag-${s.id}`} className="w-3.5 h-3.5 shrink-0 text-muted-foreground cursor-grab active:cursor-grabbing" />
                  <Container className="w-4 h-4 shrink-0" style={{ color: col }} />
                  <span className="text-sm font-black text-foreground flex-1 min-w-0 truncate">{s.name}</span>
                  <span className="text-[11px] font-bold" style={{ color: col }}>{s.current_kg} / {s.capacity_kg} kg</span>
                  <button data-testid={`silo-rename-${s.id}`} onClick={() => setEdit({ id: s.id, name: s.name, current_kg: s.current_kg, humidity_pct: s.humidity_pct ?? 0 })} className="text-muted-foreground hover:text-foreground active:scale-90"><Pencil className="w-3.5 h-3.5" /></button>
                  <button data-testid={`silo-del-${s.id}`} onClick={() => delSilo(s.id)} className="text-mattone/80 hover:text-mattone active:scale-90"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-background overflow-hidden"><div className="h-full rounded-full" style={{ width: `${s.fill_pct}%`, background: col }} /></div>
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                  {s.is_flour && <span className="inline-flex items-center gap-1"><Droplets className="w-3 h-3 text-muted-foreground" /> {tri("umidità", "Feuchte", "humidity", "humedad", "humidité", "رطوبت")} {s.humidity_pct}%</span>}
                  {s.needs_reorder && <span className="text-mattone font-bold">⚠ {tri("sotto soglia", "unter Schwelle", "below threshold", "bajo umbral", "sous seuil", "زیر آستانه")}</span>}
                </div>
              </>
            )}
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <input data-testid="silo-new-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={tri("Nuovo silo (es. Farina Manitoba)", "Neuer Silo", "New silo", "Nuevo silo", "Nouveau silo", "سیلوی جدید")} className="flex-1 min-w-[150px] bg-background border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-border" />
        <input data-testid="silo-new-kg" type="number" value={newKg} onChange={(e) => setNewKg(e.target.value)} placeholder="kg" className="w-24 bg-background border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground text-center outline-none focus:border-border" />
        <button data-testid="silo-add-btn" onClick={addSilo} disabled={!newName.trim()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent/20 border border-border/50 text-accent-foreground font-bold text-sm disabled:opacity-40 active:scale-95 transition-all"><Plus className="w-4 h-4" /> {tri("Aggiungi silo", "Silo hinzufügen", "Add silo", "Añadir silo", "Ajouter silo", "افزودن سیلو")}</button>
      </div>

      {data.reorder_count > 0 && (
        <button data-testid="silo-microorder" onClick={microorder} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-mattone/15 border border-mattone/50 text-mattone font-black text-sm active:scale-95">
          <PackagePlus className="w-4 h-4" /> {tri(`Genera micro-ordini (${data.reorder_count})`, `Micro-Aufträge (${data.reorder_count})`, `Generate micro-orders (${data.reorder_count})`, `Micro-pedidos (${data.reorder_count})`, `Micro-commandes (${data.reorder_count})`, `میکرو سفارش (${data.reorder_count})`)}
        </button>
      )}
    </div>
  );
}
