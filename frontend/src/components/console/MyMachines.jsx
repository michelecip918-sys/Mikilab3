import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, Trash2, Pencil, Check, X, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { api, deptApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Pannello "Le mie macchine": il Capo aggiunge/rinomina/elimina ogni strumento
// (forno, impastatrice, cella, silo, bilancia…) per reparto. Tutto salvato in DB.
export default function MyMachines() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [depts, setDepts] = useState([]);
  const [dept, setDept] = useState("");
  const [machines, setMachines] = useState([]);
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("");
  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [dragIdx, setDragIdx] = useState(null);

  const reorder = async (from, to) => {
    if (from === null || from === to) return;
    const arr = [...machines];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    setMachines(arr);
    try { await deptApi.machineReorder(dept, arr.map((x) => x.id)); } catch { loadMachines(); }
  };

  useEffect(() => {
    const loadDepts = () => api.get(`/depts`).then((r) => {
      const list = r.data.departments || [];
      setDepts(list);
      setDept((cur) => cur || (list[0] ? list[0].key : ""));
    }).catch(() => {});
    loadDepts();
    window.addEventListener("mikilab-depts-updated", loadDepts);
    return () => window.removeEventListener("mikilab-depts-updated", loadDepts);
  }, []); // eslint-disable-line

  const loadMachines = useCallback(() => {
    if (!dept) return;
    deptApi.machinesGet(dept).then((d) => setMachines(d.machines || [])).catch(() => {});
  }, [dept]);
  useEffect(() => { loadMachines(); }, [loadMachines]);

  const add = async () => {
    const nm = newName.trim();
    if (!nm) return;
    setBusy(true);
    try {
      const r = await deptApi.machineAdd(dept, { name: nm, type: newType.trim() || "altro" });
      setMachines(r.machines || []);
      setNewName(""); setNewType("");
      toast.success(tri("Macchina aggiunta ✓", "Maschine hinzugefügt ✓", "Machine added ✓", "Máquina añadida ✓", "Machine ajoutée ✓", "دستگاه اضافه شد ✓"));
    } catch { toast.error("Error"); } finally { setBusy(false); }
  };

  const saveRename = async (mid) => {
    const nm = editName.trim();
    if (!nm) { setEditId(""); return; }
    setBusy(true);
    try {
      const r = await deptApi.machineRename(dept, mid, nm);
      setMachines(r.machines || []);
      setEditId(""); setEditName("");
    } catch { toast.error("Error"); } finally { setBusy(false); }
  };

  const del = async (mid) => {
    setBusy(true);
    try {
      const r = await deptApi.machineDelete(dept, mid);
      setMachines(r.machines || []);
    } catch { toast.error("Error"); } finally { setBusy(false); }
  };

  const loadPreset = async (activity) => {
    try {
      const r = await deptApi.machinePreset(dept, activity);
      setMachines(r.machines || []);
      toast.success(r.added > 0 ? tri(`Aggiunte ${r.added} macchine tipiche`, `${r.added} Maschinen geladen`, `Added ${r.added} typical machines`, `Añadidas ${r.added}`, `${r.added} machines ajoutées`, `${r.added} دستگاه اضافه شد`) : tri("Sono già presenti", "Bereits vorhanden", "Already present", "Ya presentes", "Déjà présents", "قبلاً موجود است"));
    } catch { toast.error("Error"); }
  };

  return (
    <div data-testid="my-machines" className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select data-testid="my-machines-dept" value={dept} onChange={(e) => setDept(e.target.value)}
          className="bg-background border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground focus:border-border outline-none">
          {depts.map((d) => <option key={d.key} value={d.key}>{d.name}</option>)}
        </select>
        <span className="text-[11px] text-muted-foreground">{machines.length} {tri("strumenti", "Geräte", "tools", "herramientas", "outils", "ابزار")}</span>
      </div>

      <div data-testid="machine-presets" className="rounded-lg bg-background/60 border border-primary/25 p-2.5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5">{tri("Precarica macchine tipiche", "Typische Maschinen laden", "Load typical machines", "Cargar máquinas típicas", "Charger machines types", "بارگذاری دستگاه‌های معمول")}</p>
        <div className="flex flex-wrap gap-1.5">
          {[["panificio", tri("Panificio", "Bäckerei", "Bakery", "Panadería", "Boulangerie", "نانوایی")], ["pizzeria", tri("Pizzeria", "Pizzeria", "Pizzeria", "Pizzería", "Pizzeria", "پیتزا")], ["pasticceria", tri("Pasticceria", "Konditorei", "Pastry", "Pastelería", "Pâtisserie", "شیرینی")]].map(([k, label]) => (
            <button key={k} data-testid={`machine-preset-${k}`} onClick={() => loadPreset(k)} disabled={busy} className="px-3 py-1.5 rounded-full text-[12px] font-bold bg-primary/15 border border-primary/40 text-primary-foreground active:scale-95 transition-all disabled:opacity-40">{label}</button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        {machines.length === 0 && <p className="text-xs text-muted-foreground">{tri("Nessuno strumento. Aggiungine uno qui sotto.", "Keine Geräte. Füge unten eines hinzu.", "No tools. Add one below.", "Sin herramientas. Añade una abajo.", "Aucun outil. Ajoutes-en un.", "ابزاری نیست. یکی اضافه کن.")}</p>}
        {machines.map((m, idx) => (
          <div key={m.id} data-testid={`my-machine-${m.id}`}
            draggable={editId !== m.id}
            onDragStart={() => setDragIdx(idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { reorder(dragIdx, idx); setDragIdx(null); }}
            onDragEnd={() => setDragIdx(null)}
            className="flex items-center gap-2 bg-background/60 border border-border rounded-lg px-3 py-2" style={{ opacity: dragIdx === idx ? 0.5 : 1 }}>
            {editId === m.id ? (
              <>
                <input data-testid={`my-machine-edit-input-${m.id}`} value={editName} autoFocus
                  onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveRename(m.id); if (e.key === "Escape") setEditId(""); }}
                  className="flex-1 min-w-0 bg-background border border-border/40 rounded-md px-2 py-1 text-sm text-foreground outline-none" />
                <button data-testid={`my-machine-save-${m.id}`} onClick={() => saveRename(m.id)} className="text-accent active:scale-90"><Check className="w-4 h-4" /></button>
                <button data-testid={`my-machine-cancel-${m.id}`} onClick={() => setEditId("")} className="text-muted-foreground active:scale-90"><X className="w-4 h-4" /></button>
              </>
            ) : (
              <>
                <GripVertical data-testid={`my-machine-drag-${m.id}`} className="w-3.5 h-3.5 shrink-0 text-muted-foreground cursor-grab active:cursor-grabbing" />
                <span className="text-sm text-foreground flex-1 truncate">{m.name}
                  <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">{m.type}</span>
                  {m.custom && <span className="ml-1.5 text-[9px] font-black uppercase text-ambra">·{tri("mia", "eigen", "mine", "mía", "mienne", "من")}</span>}
                </span>
                <button data-testid={`my-machine-rename-${m.id}`} onClick={() => { setEditId(m.id); setEditName(m.name); }} className="text-muted-foreground hover:text-foreground active:scale-90"><Pencil className="w-3.5 h-3.5" /></button>
                <button data-testid={`my-machine-del-${m.id}`} onClick={() => del(m.id)} className="text-mattone/80 hover:text-mattone active:scale-90"><Trash2 className="w-4 h-4" /></button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
        <input data-testid="my-machine-new-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={tri("Nome strumento (es. Forno 2)", "Gerätename", "Tool name", "Nombre", "Nom", "نام ابزار")}
          className="flex-1 min-w-[150px] bg-background border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground focus:border-border outline-none" />
        <input data-testid="my-machine-new-type" value={newType} onChange={(e) => setNewType(e.target.value)} placeholder={tri("Tipo (cella, silo, forno…)", "Typ", "Type", "Tipo", "Type", "نوع")}
          className="w-36 bg-background border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground focus:border-border outline-none" />
        <button data-testid="my-machine-add-btn" onClick={add} disabled={busy || !newName.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent/20 border border-border/50 text-accent-foreground font-bold text-sm disabled:opacity-40 active:scale-95 transition-all">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} {tri("Aggiungi", "Hinzufügen", "Add", "Añadir", "Ajouter", "افزودن")}
        </button>
      </div>
    </div>
  );
}
