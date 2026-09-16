import { useState, useEffect, useCallback } from "react";
import { Building2, Check, Plus, Pencil, Loader2 } from "lucide-react";
import { orgsApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { toast } from "sonner";

// Selettore multi-azienda del Capo: elenca le aziende, cambia quella attiva,
// crea una nuova azienda e rinomina. L'Owner vede tutte le aziende.
export const OrgSwitcher = ({ onSwitched }) => {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  const load = useCallback(() => { orgsApi.list().then(setData).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);

  const doSwitch = async (org_id) => {
    if (busy || (data && data.active_org === org_id)) return;
    setBusy(true);
    try {
      const r = await orgsApi.switch(org_id);
      toast.success(tri(`Azienda attiva: ${r.name}`, `Aktive Firma: ${r.name}`, `Active company: ${r.name}`, `Empresa activa: ${r.name}`, `Entreprise active : ${r.name}`, `شرکت فعال: ${r.name}`));
      if (onSwitched) onSwitched(r.active_org);
      setTimeout(() => window.location.reload(), 400);
    } catch (e) {
      toast.error(tri("Cambio azienda non riuscito", "Wechsel fehlgeschlagen", "Switch failed", "Cambio fallido", "Échec du changement", "تغییر ناموفق"));
    } finally { setBusy(false); }
  };

  const doCreate = async () => {
    const nm = newName.trim();
    if (!nm) return;
    setBusy(true);
    try {
      await orgsApi.create(nm);
      setNewName(""); setCreating(false);
      toast.success(tri("Azienda creata", "Firma erstellt", "Company created", "Empresa creada", "Entreprise créée", "شرکت ایجاد شد"));
      try { window.dispatchEvent(new CustomEvent("mikilab-org-changed")); } catch { /* */ }
      load();
    } catch (e) {
      toast.error(tri("Creazione non riuscita", "Erstellen fehlgeschlagen", "Create failed", "Creación fallida", "Échec de création", "ایجاد ناموفق"));
    } finally { setBusy(false); }
  };

  const doRename = async (org_id) => {
    const nm = editName.trim();
    if (!nm) { setEditId(null); return; }
    setBusy(true);
    try {
      await orgsApi.rename(org_id, nm);
      setEditId(null);
      try { window.dispatchEvent(new CustomEvent("mikilab-org-changed")); } catch { /* */ }
      load();
    } catch (e) {
      toast.error(tri("Rinomina non riuscita", "Umbenennen fehlgeschlagen", "Rename failed", "Renombrar fallido", "Échec du renommage", "تغییر نام ناموفق"));
    } finally { setBusy(false); }
  };

  if (!data) return null;

  return (
    <div data-testid="org-switcher" className="mt-2 pt-2 border-t border-[#1e293b]">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#8a97a6] mb-1.5">
        <Building2 className="w-3.5 h-3.5" /> {tri("LE TUE AZIENDE", "DEINE FIRMEN", "YOUR COMPANIES", "TUS EMPRESAS", "VOS ENTREPRISES", "شرکت‌های شما")}
      </div>
      <div className="space-y-1 max-h-52 overflow-auto pr-0.5">
        {data.orgs.map((o) => (
          <div key={o.org_id} className="flex items-center gap-1">
            {editId === o.org_id ? (
              <div className="flex items-center gap-1 w-full">
                <input data-testid={`org-edit-input-${o.org_id}`} value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") doRename(o.org_id); if (e.key === "Escape") setEditId(null); }}
                  className="flex-1 min-w-0 rounded-md bg-[#060A10] border border-[#8a97a6]/40 text-white text-[11px] px-2 py-1.5 outline-none" />
                <button data-testid={`org-edit-save-${o.org_id}`} onClick={() => doRename(o.org_id)} className="shrink-0 px-2 py-1.5 rounded-md bg-[#7E9A82]/20 border border-[#7E9A82]/50 text-[#7E9A82] text-[11px] font-bold"><Check className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <>
                <button data-testid={`org-switch-${o.org_id}`} onClick={() => doSwitch(o.org_id)} disabled={busy}
                  className={`flex-1 min-w-0 flex items-center gap-1.5 px-2 py-1.5 rounded-md text-left text-[11px] font-bold border transition-all active:scale-[0.98] ${o.is_active ? "bg-[#D97736]/18 border-[#D97736]/55 text-[#D97736]" : "bg-[#0C1019] border-[#1e293b] text-white hover:border-[#8a97a6]/50"}`}>
                  {o.is_active ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Building2 className="w-3.5 h-3.5 shrink-0 opacity-60" />}
                  <span className="truncate">{o.name}</span>
                </button>
                <button data-testid={`org-rename-open-${o.org_id}`} onClick={() => { setEditId(o.org_id); setEditName(o.name); }}
                  className="shrink-0 px-1.5 py-1.5 rounded-md bg-[#0C1019] border border-[#1e293b] text-[#8a97a6] hover:border-[#8a97a6]/50"><Pencil className="w-3 h-3" /></button>
              </>
            )}
          </div>
        ))}
      </div>

      {creating ? (
        <div className="flex items-center gap-1 mt-1.5">
          <input data-testid="org-new-input" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus
            placeholder={tri("Nome nuova azienda", "Name neue Firma", "New company name", "Nombre nueva empresa", "Nom nouvelle entreprise", "نام شرکت جدید")}
            onKeyDown={(e) => { if (e.key === "Enter") doCreate(); if (e.key === "Escape") setCreating(false); }}
            className="flex-1 min-w-0 rounded-md bg-[#060A10] border border-[#8a97a6]/40 text-white text-[11px] px-2 py-1.5 outline-none placeholder:text-[#8a97a6]/50" />
          <button data-testid="org-new-save" onClick={doCreate} disabled={busy} className="shrink-0 px-2 py-1.5 rounded-md bg-[#7E9A82]/20 border border-[#7E9A82]/50 text-[#7E9A82] text-[11px] font-bold">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          </button>
        </div>
      ) : (
        <button data-testid="org-new-open" onClick={() => setCreating(true)}
          className="w-full mt-1.5 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-[#0C1019] border border-dashed border-[#8a97a6]/40 text-[#8a97a6] text-[11px] font-bold hover:border-[#8a97a6]/70 active:scale-[0.98] transition-all">
          <Plus className="w-3.5 h-3.5" /> {tri("Nuova azienda", "Neue Firma", "New company", "Nueva empresa", "Nouvelle entreprise", "شرکت جدید")}
        </button>
      )}
    </div>
  );
};

export default OrgSwitcher;
