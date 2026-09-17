import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { deptApi } from "@/lib/api";
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

  useEffect(() => {
    deptApi.catalog().then((d) => {
      const list = d.departments || [];
      setDepts(list);
      if (list.length && !dept) setDept(list[0].key);
    }).catch(() => {});
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

  return (
    <div data-testid="my-machines" className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select data-testid="my-machines-dept" value={dept} onChange={(e) => setDept(e.target.value)}
          className="bg-[#0C1019] border border-[#64748B]/30 rounded-lg px-3 py-2 text-sm text-white focus:border-[#64748B] outline-none">
          {depts.map((d) => <option key={d.key} value={d.key}>{d.name}</option>)}
        </select>
        <span className="text-[11px] text-[#64748b]">{machines.length} {tri("strumenti", "Geräte", "tools", "herramientas", "outils", "ابزار")}</span>
      </div>

      <div className="space-y-1.5">
        {machines.length === 0 && <p className="text-xs text-[#64748b]">{tri("Nessuno strumento. Aggiungine uno qui sotto.", "Keine Geräte. Füge unten eines hinzu.", "No tools. Add one below.", "Sin herramientas. Añade una abajo.", "Aucun outil. Ajoutes-en un.", "ابزاری نیست. یکی اضافه کن.")}</p>}
        {machines.map((m) => (
          <div key={m.id} data-testid={`my-machine-${m.id}`} className="flex items-center gap-2 bg-[#0C1019]/60 border border-[#1e293b] rounded-lg px-3 py-2">
            {editId === m.id ? (
              <>
                <input data-testid={`my-machine-edit-input-${m.id}`} value={editName} autoFocus
                  onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveRename(m.id); if (e.key === "Escape") setEditId(""); }}
                  className="flex-1 min-w-0 bg-[#060A10] border border-[#64748B]/40 rounded-md px-2 py-1 text-sm text-white outline-none" />
                <button data-testid={`my-machine-save-${m.id}`} onClick={() => saveRename(m.id)} className="text-[#6e9e85] active:scale-90"><Check className="w-4 h-4" /></button>
                <button data-testid={`my-machine-cancel-${m.id}`} onClick={() => setEditId("")} className="text-[#94A3B8] active:scale-90"><X className="w-4 h-4" /></button>
              </>
            ) : (
              <>
                <span className="text-sm text-white flex-1 truncate">{m.name}
                  <span className="ml-2 text-[10px] uppercase tracking-wider text-[#64748b]">{m.type}</span>
                  {m.custom && <span className="ml-1.5 text-[9px] font-black uppercase text-[#c9a24a]">·{tri("mia", "eigen", "mine", "mía", "mienne", "من")}</span>}
                </span>
                <button data-testid={`my-machine-rename-${m.id}`} onClick={() => { setEditId(m.id); setEditName(m.name); }} className="text-[#94A3B8] hover:text-white active:scale-90"><Pencil className="w-3.5 h-3.5" /></button>
                <button data-testid={`my-machine-del-${m.id}`} onClick={() => del(m.id)} className="text-[#bb8489]/80 hover:text-[#bb8489] active:scale-90"><Trash2 className="w-4 h-4" /></button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1e293b]">
        <input data-testid="my-machine-new-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={tri("Nome strumento (es. Forno 2)", "Gerätename", "Tool name", "Nombre", "Nom", "نام ابزار")}
          className="flex-1 min-w-[150px] bg-[#0C1019] border border-[#64748B]/30 rounded-lg px-3 py-2 text-sm text-white focus:border-[#64748B] outline-none" />
        <input data-testid="my-machine-new-type" value={newType} onChange={(e) => setNewType(e.target.value)} placeholder={tri("Tipo (cella, silo, forno…)", "Typ", "Type", "Tipo", "Type", "نوع")}
          className="w-36 bg-[#0C1019] border border-[#64748B]/30 rounded-lg px-3 py-2 text-sm text-white focus:border-[#64748B] outline-none" />
        <button data-testid="my-machine-add-btn" onClick={add} disabled={busy || !newName.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#64748B]/20 border border-[#64748B]/50 text-[#9fc3dc] font-bold text-sm disabled:opacity-40 active:scale-95 transition-all">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} {tri("Aggiungi", "Hinzufügen", "Add", "Añadir", "Ajouter", "افزودن")}
        </button>
      </div>
    </div>
  );
}
