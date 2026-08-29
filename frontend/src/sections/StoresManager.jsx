import { useState, useEffect } from "react";
import { Store, Plus, Trash2, Pencil, MapPin, Phone, Check, X, Loader2 } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { storesApi } from "@/lib/api";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";

export default function StoresManager({ stores, reload, current, setCurrent }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);

  const [editing, setEditing] = useState(null); // id | "new" | null
  const [form, setForm] = useState({ name: "", address: "", phone: "", note: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (editing === "new") setForm({ name: "", address: "", phone: "", note: "" });
    else if (editing) { const s = stores.find((x) => x.id === editing); if (s) setForm({ name: s.name, address: s.address || "", phone: s.phone || "", note: s.note || "" }); }
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    if (!form.name.trim()) { toast.error(tri("Inserisci il nome del negozio", "Gib den Namen ein", "Enter the store name")); return; }
    setBusy(true);
    try {
      if (editing === "new") { const s = await storesApi.create(form); toast.success(tri("Negozio creato", "Filiale erstellt", "Store created")); if (!current) setCurrent(s.id); }
      else { await storesApi.update(editing, form); toast.success(tri("Negozio aggiornato", "Filiale aktualisiert", "Store updated")); }
      setEditing(null); await reload();
    } catch { toast.error(tri("Operazione non riuscita", "Aktion fehlgeschlagen", "Action failed")); }
    finally { setBusy(false); }
  };

  const remove = async (id) => {
    try { await storesApi.remove(id); if (current === id) setCurrent(null); await reload(); toast.success(tri("Negozio eliminato", "Filiale gelöscht", "Store deleted")); }
    catch { toast.error(tri("Eliminazione non riuscita", "Löschen fehlgeschlagen", "Delete failed")); }
  };

  const inp = "w-full bg-[#121212] dark:bg-[#181818] border border-[#2b2b2b] dark:border-[#2e2e2e] rounded-xl px-3 py-2.5 outline-none text-[#2B303B] dark:text-[#e4eff8] focus:border-[#ff6b00]";

  return (
    <div className="pb-40" data-testid="stores-manager">
      <button data-testid="store-add" onClick={() => setEditing(editing === "new" ? null : "new")}
        className="w-full flex items-center justify-center gap-2 bg-[#ff6b00] hover:bg-[#ff8a33] text-white font-semibold py-3 rounded-2xl active:scale-98 transition-all mb-4">
        <Plus className="w-5 h-5" /> {tri("Aggiungi negozio", "Filiale hinzufügen", "Add store")}
      </button>

      {editing === "new" && (
        <StoreForm form={form} setForm={setForm} inp={inp} onSave={save} onCancel={() => setEditing(null)} busy={busy} tri={tri} testidPrefix="store-new" />
      )}

      <div className="space-y-3" data-testid="stores-list">
        {stores.length === 0 && editing !== "new" && (
          <p className="text-center text-sm text-[#7E8A93] py-8">{tri("Nessun negozio. Aggiungi il tuo primo punto vendita.", "Keine Filiale. Füge deinen ersten Standort hinzu.", "No store yet. Add your first location.")}</p>
        )}
        {stores.map((s) => (
          <div key={s.id} data-testid={`store-card-${s.id}`} className={`rounded-2xl p-4 border shadow-sm ${current === s.id ? "bg-[#ff6b00]/10 border-[#ff6b00]" : "bg-white dark:bg-[#1e1e1e] border-[#2b2b2b] dark:border-[#2e2e2e]"}`}>
            {editing === s.id ? (
              <StoreForm form={form} setForm={setForm} inp={inp} onSave={save} onCancel={() => setEditing(null)} busy={busy} tri={tri} testidPrefix={`store-edit-${s.id}`} />
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#ff6b00] flex items-center justify-center shrink-0"><Store className="w-5 h-5 text-white" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8] leading-tight">{s.name}</p>
                    {s.address && <p className="text-xs text-[#7E8A93] flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{s.address}</p>}
                    {s.phone && <p className="text-xs text-[#7E8A93] flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</p>}
                    {s.note && <p className="text-xs text-[#7E8A93] mt-1">{s.note}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {current === s.id ? (
                    <span data-testid={`store-active-${s.id}`} className="flex-1 flex items-center justify-center gap-1 text-sm font-semibold text-[#ff6b00] bg-[#ff6b00]/10 rounded-xl py-2"><Check className="w-4 h-4" /> {tri("Attivo", "Aktiv", "Active")}</span>
                  ) : (
                    <button data-testid={`store-select-${s.id}`} onClick={() => setCurrent(s.id)} className="flex-1 text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8] bg-[#121212] dark:bg-[#181818] border border-[#2b2b2b] dark:border-[#2e2e2e] rounded-xl py-2 active:scale-98">{tri("Rendi attivo", "Aktivieren", "Set active")}</button>
                  )}
                  <button data-testid={`store-edit-${s.id}`} onClick={() => setEditing(s.id)} className="p-2 rounded-xl border border-[#2b2b2b] dark:border-[#2e2e2e] text-[#ff6b00]"><Pencil className="w-4 h-4" /></button>
                  <button data-testid={`store-remove-${s.id}`} onClick={() => remove(s.id)} className="p-2 rounded-xl border border-[#2b2b2b] dark:border-[#2e2e2e] text-[#7E8A93] hover:text-[#E4572E]"><Trash2 className="w-4 h-4" /></button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StoreForm({ form, setForm, inp, onSave, onCancel, busy, tri, testidPrefix }) {
  return (
    <div data-testid={`${testidPrefix}-form`} className="bg-[#ff6b00]/10 border border-[#ff6b00]/30 rounded-2xl p-4 mb-4 space-y-2">
      <input data-testid={`${testidPrefix}-name`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={tri("Nome negozio", "Filialname", "Store name")} className={inp} />
      <input data-testid={`${testidPrefix}-address`} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder={tri("Indirizzo", "Adresse", "Address")} className={inp} />
      <input data-testid={`${testidPrefix}-phone`} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={tri("Telefono", "Telefon", "Phone")} className={inp} />
      <input data-testid={`${testidPrefix}-note`} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder={tri("Note", "Notizen", "Notes")} className={inp} />
      <div className="flex gap-2">
        <button data-testid={`${testidPrefix}-save`} onClick={onSave} disabled={busy} className="flex-1 flex items-center justify-center gap-1 bg-[#ff6b00] text-white font-semibold py-2.5 rounded-xl active:scale-98 disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {tri("Salva", "Speichern", "Save")}
        </button>
        <button data-testid={`${testidPrefix}-cancel`} onClick={onCancel} className="px-4 rounded-xl border border-[#2b2b2b] dark:border-[#2e2e2e] text-[#7E8A93]"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
