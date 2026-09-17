import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, Trash2, Pencil, Check, X, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { api, deptApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const ICONS = ["🏭", "🥖", "🧁", "🍕", "🥨", "🏷️", "🍨", "☕", "🧊", "🥗", "🍫", "🧂"];
const COLORS = ["#E0A106", "#EC4899", "#EF4444", "#8B5A2B", "#22C55E", "#7DA3C0", "#3E9C93", "#D97736", "#8f6fb0"];

export default function DeptManager() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editKey, setEditKey] = useState("");
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("🏭");
  const [newColor, setNewColor] = useState("#64748B");

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/depts`).then((r) => setDepts(r.data.departments || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const refreshOthers = () => { try { window.dispatchEvent(new Event("mikilab-depts-updated")); } catch { /* */ } };

  const create = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    try {
      const r = await deptApi.deptCreate({ name: newName.trim(), icon: newIcon, accent: newColor });
      setDepts(r.departments || []); setNewName(""); refreshOthers();
      toast.success(tri("Reparto creato", "Bereich erstellt", "Department created", "Departamento creado", "Rayon créé", "بخش ایجاد شد"));
    } catch { toast.error("Error"); } finally { setBusy(false); }
  };
  const saveRename = async (key) => {
    if (!editName.trim()) { setEditKey(""); return; }
    try { const r = await deptApi.deptEdit(key, { name: editName.trim() }); setDepts(r.departments || []); refreshOthers(); } catch { /* */ }
    setEditKey("");
  };
  const setColor = async (key, accent) => { try { const r = await deptApi.deptEdit(key, { accent }); setDepts(r.departments || []); refreshOthers(); } catch { /* */ } };
  const setIcon = async (key, icon) => { try { const r = await deptApi.deptEdit(key, { icon }); setDepts(r.departments || []); refreshOthers(); } catch { /* */ } };
  const del = async (key) => { try { const r = await deptApi.deptDelete(key); setDepts(r.departments || []); refreshOthers(); } catch { /* */ } };
  const restore = async (key) => { try { const r = await deptApi.deptRestore(key); setDepts(r.departments || []); refreshOthers(); } catch { /* */ } };
  const [hidden, setHidden] = useState([]);
  const loadHidden = useCallback(() => { api.get(`/depts/hidden`).then((r) => setHidden(r.data.hidden || [])).catch(() => {}); }, []);
  useEffect(() => { loadHidden(); }, [loadHidden, depts]);

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-[#64748B]" /></div>;

  return (
    <div data-testid="dept-manager" className="space-y-3">
      <div className="space-y-1.5">
        {depts.map((d) => (
          <div key={d.key} data-testid={`dept-${d.key}`} className="rounded-lg border p-2.5" style={{ borderColor: `${d.accent}44`, background: `${d.accent}0a` }}>
            <div className="flex items-center gap-2">
              <button data-testid={`dept-icon-${d.key}`} onClick={() => setIcon(d.key, ICONS[(ICONS.indexOf(d.icon) + 1) % ICONS.length])} className="text-lg leading-none active:scale-90" title={tri("Cambia icona", "Icon", "Change icon", "Icono", "Icône", "آیکون")}>{d.icon}</button>
              {editKey === d.key ? (
                <>
                  <input data-testid={`dept-edit-input-${d.key}`} value={editName} autoFocus onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveRename(d.key); if (e.key === "Escape") setEditKey(""); }}
                    className="flex-1 min-w-0 bg-[#060A10] border border-[#64748B]/40 rounded-md px-2 py-1 text-sm text-white outline-none" />
                  <button data-testid={`dept-save-${d.key}`} onClick={() => saveRename(d.key)} className="text-[#6e9e85]"><Check className="w-4 h-4" /></button>
                  <button data-testid={`dept-cancel-${d.key}`} onClick={() => setEditKey("")} className="text-[#94A3B8]"><X className="w-4 h-4" /></button>
                </>
              ) : (
                <>
                  <span className="text-sm font-bold text-white flex-1 truncate">{d.name}{d.custom ? <span className="ml-1.5 text-[9px] text-[#7fd4c9] uppercase">· {tri("mio", "mein", "mine", "mío", "mien", "من")}</span> : null}</span>
                  <button data-testid={`dept-rename-${d.key}`} onClick={() => { setEditKey(d.key); setEditName(d.name); }} className="text-[#94A3B8] hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                  <button data-testid={`dept-del-${d.key}`} onClick={() => del(d.key)} className="text-[#b06e78] hover:text-[#e08a95]" title={d.custom ? tri("Elimina", "Löschen", "Delete", "Eliminar", "Supprimer", "حذف") : tri("Nascondi", "Ausblenden", "Hide", "Ocultar", "Masquer", "پنهان")}>
                    {d.custom ? <Trash2 className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-1 mt-2 pl-7">
              {COLORS.map((c) => (
                <button key={c} data-testid={`dept-color-${d.key}-${c.replace('#', '')}`} onClick={() => setColor(d.key, c)}
                  className={`w-4 h-4 rounded-full border ${d.accent === c ? "ring-2 ring-white" : "border-white/20"}`} style={{ background: c }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {hidden.length > 0 && (
        <div data-testid="dept-hidden" className="rounded-lg bg-[#0C1019]/60 border border-[#334155]/40 p-2.5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#64748b] mb-1.5">{tri("Reparti nascosti", "Ausgeblendet", "Hidden departments", "Ocultos", "Masqués", "پنهان‌ها")}</p>
          <div className="flex flex-wrap gap-1.5">
            {hidden.map((h) => (
              <button key={h.key} data-testid={`dept-restore-${h.key}`} onClick={() => restore(h.key)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-[#334155]/40 text-[#cbd5e1] active:scale-95"><Eye className="w-3 h-3" /> {h.name}</button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg bg-[#0C1019] border border-[#64748B]/30 p-2.5 space-y-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#64748b]">{tri("Nuovo reparto", "Neuer Bereich", "New department", "Nuevo departamento", "Nouveau rayon", "بخش جدید")}</p>
        <div className="flex items-center gap-1.5">
          <button data-testid="dept-new-icon" onClick={() => setNewIcon(ICONS[(ICONS.indexOf(newIcon) + 1) % ICONS.length])} className="text-lg leading-none w-8 h-8 rounded-md bg-[#060A10] border border-[#64748B]/30">{newIcon}</button>
          <input data-testid="dept-new-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={tri("Nome (es. Gelateria)", "Name", "Name (e.g. Gelato)", "Nombre", "Nom", "نام")}
            onKeyDown={(e) => { if (e.key === "Enter") create(); }}
            className="flex-1 min-w-0 bg-[#060A10] border border-[#64748B]/30 rounded-md px-2.5 py-1.5 text-sm text-white outline-none" />
        </div>
        <div className="flex flex-wrap gap-1">
          {COLORS.map((c) => (
            <button key={c} data-testid={`dept-new-color-${c.replace('#', '')}`} onClick={() => setNewColor(c)} className={`w-5 h-5 rounded-full border ${newColor === c ? "ring-2 ring-white" : "border-white/20"}`} style={{ background: c }} />
          ))}
        </div>
        <button data-testid="dept-add-btn" onClick={create} disabled={busy || !newName.trim()}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#3E9C93]/20 border border-[#3E9C93]/50 text-[#7fd4c9] font-bold text-sm disabled:opacity-40 active:scale-95">
          <Plus className="w-4 h-4" /> {tri("Aggiungi reparto", "Bereich hinzufügen", "Add department", "Añadir", "Ajouter", "افزودن")}
        </button>
      </div>
    </div>
  );
}
