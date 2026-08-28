import { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from "react";
import { toast } from "sonner";
import { Archive, RotateCcw, Trash2, Save, X, Loader2, Pencil, Check } from "lucide-react";
import { plansArchiveApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Archivio riutilizzabile dei Piani di Lavoro salvati (kind: "weekly" | "capo").
// - getPayload(): ritorna l'oggetto da salvare (o null se non c'è nulla)
// - canSave: abilita il pulsante "Salva nell'archivio"
// - onRepeat(payload): richiamato quando l'utente clicca "Ripeti questo piano"
// - describe(payload): stringa breve di riepilogo per ogni piano (opzionale)
// Espone via ref: openSave() → apre l'input nome e scorre in vista (salvataggio con un tocco).
const PlanArchive = forwardRef(function PlanArchive({ kind, getPayload, canSave, onRepeat, repeatLabel, describe }, ref) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const rootRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await plansArchiveApi.list(kind);
      setPlans(Array.isArray(data) ? data : []);
    } catch {
      /* non loggato o nessun piano */
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => { load(); }, [load]);

  const defaultName = () => {
    const d = new Date().toLocaleDateString(mkTri(lang)("it-IT", "de-DE", "en-GB"));
    return tri(`Piano del ${d}`, `Plan vom ${d}`, `Plan of ${d}`);
  };

  const openNaming = () => {
    const payload = getPayload();
    if (!payload) {
      toast.error(tri("Non c'è ancora un piano da salvare.", "Es gibt noch keinen Plan zum Speichern.", "There's no plan to save yet."));
      return;
    }
    setName(defaultName());
    setNaming(true);
  };

  // Salvataggio con un tocco dall'esterno (es. banner "Piano generato").
  useImperativeHandle(ref, () => ({
    openSave: () => {
      openNaming();
      setTimeout(() => rootRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
    },
  }));

  const doSave = async () => {
    const payload = getPayload();
    if (!payload) { setNaming(false); return; }
    const nm = (name || "").trim() || defaultName();
    setSaving(true);
    try {
      await plansArchiveApi.save({ name: nm, kind, payload });
      toast.success(tri("Piano salvato nell'archivio ✓", "Plan im Archiv gespeichert ✓", "Plan saved to the archive ✓"));
      setNaming(false);
      setName("");
      await load();
    } catch {
      toast.error(tri("Salvataggio non riuscito.", "Speichern fehlgeschlagen.", "Save failed."));
    } finally {
      setSaving(false);
    }
  };

  const startRename = (p) => { setEditingId(p.id); setEditName(p.name); };
  const doRename = async (id) => {
    const nm = (editName || "").trim();
    if (!nm) { setEditingId(null); return; }
    try {
      await plansArchiveApi.rename(id, nm);
      setPlans((ps) => ps.map((p) => (p.id === id ? { ...p, name: nm } : p)));
      toast.success(tri("Nome aggiornato ✓", "Name aktualisiert ✓", "Name updated ✓"));
    } catch {
      toast.error(tri("Rinomina non riuscita.", "Umbenennen fehlgeschlagen.", "Rename failed."));
    } finally {
      setEditingId(null);
    }
  };

  const doRepeat = (p) => {
    onRepeat(p.payload || {});
    toast.success(tri("Piano caricato — modificalo e salvalo.", "Plan geladen — bearbeiten und speichern.", "Plan loaded — edit and save it."));
  };

  const doRemove = async (id) => {
    try {
      await plansArchiveApi.remove(id);
      setPlans((ps) => ps.filter((p) => p.id !== id));
      toast.success(tri("Piano eliminato.", "Plan gelöscht.", "Plan deleted."));
    } catch {
      toast.error(tri("Eliminazione non riuscita.", "Löschen fehlgeschlagen.", "Delete failed."));
    }
  };

  const fmtDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString(mkTri(lang)("it-IT", "de-DE", "en-GB"),
        { day: "2-digit", month: "short", year: "numeric" });
    } catch { return ""; }
  };

  return (
    <div ref={rootRef} data-testid={`plan-archive-${kind}`} className="mt-4 rounded-2xl bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] p-4">
      <div className="flex items-center gap-2 mb-1">
        <Archive className="w-5 h-5 text-[#8C4A27]" />
        <h3 className="font-display text-base font-semibold text-[#2B303B] dark:text-[#e4eff8]">
          {tri("I Miei Piani Salvati", "Meine gespeicherten Pläne", "My Saved Plans")}
        </h3>
      </div>
      <p className="text-xs text-[#7E8A93] mb-3 leading-snug">
        {tri("Salva questo piano con un nome e riusalo la settimana prossima con un tocco.",
             "Speichere diesen Plan mit einem Namen und nutze ihn nächste Woche mit einem Tipp erneut.",
             "Save this plan with a name and reuse it next week with one tap.")}
      </p>

      {!naming ? (
        <button
          data-testid={`plan-archive-save-btn-${kind}`}
          onClick={openNaming}
          disabled={!canSave}
          className="w-full flex items-center justify-center gap-2 bg-[#e4eff8] dark:bg-[#2A323A] text-[#6E371C] dark:text-[#8FB0C2] font-semibold px-4 py-2.5 rounded-xl border border-[#E6D8C3] dark:border-[#38424B] disabled:opacity-40 active:scale-98 transition-all"
        >
          <Save className="w-4 h-4" /> {tri("Salva questo piano nell'archivio", "Diesen Plan im Archiv speichern", "Save this plan to the archive")}
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <input
            data-testid={`plan-archive-name-input-${kind}`}
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") doSave(); if (e.key === "Escape") setNaming(false); }}
            placeholder={tri("Nome piano (es. Settimana Natale)", "Planname (z. B. Weihnachtswoche)", "Plan name (e.g. Christmas week)")}
            className="flex-1 min-w-0 bg-white dark:bg-[#1F252B] border border-[#E6D8C3] dark:border-[#38424B] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#8C4A27] text-[#2B303B] dark:text-[#e4eff8]"
          />
          <button
            data-testid={`plan-archive-confirm-btn-${kind}`}
            onClick={doSave}
            disabled={saving}
            className="shrink-0 flex items-center gap-1.5 bg-[#8C4A27] hover:bg-[#336a94] text-white font-semibold px-4 py-2.5 rounded-xl active:scale-98 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {tri("Salva", "Speichern", "Save")}
          </button>
          <button
            data-testid={`plan-archive-cancel-btn-${kind}`}
            onClick={() => setNaming(false)}
            className="shrink-0 w-10 h-10 rounded-xl bg-white dark:bg-[#1F252B] border border-[#E6D8C3] dark:border-[#38424B] flex items-center justify-center text-[#7E8A93]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? null : plans.length === 0 ? (
        <p data-testid={`plan-archive-empty-${kind}`} className="text-xs text-[#9AA6AE] mt-3">
          {tri("Nessun piano salvato ancora.", "Noch keine gespeicherten Pläne.", "No saved plans yet.")}
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {plans.map((p) => (
            <div
              key={p.id}
              data-testid={`plan-archive-item-${p.id}`}
              className="flex items-center gap-2 rounded-xl bg-[#e4eff8] dark:bg-[#2A323A] border border-[#E6D8C3] dark:border-[#38424B] p-2.5"
            >
              <div className="flex-1 min-w-0">
                {editingId === p.id ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      data-testid={`plan-archive-rename-input-${p.id}`}
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") doRename(p.id); if (e.key === "Escape") setEditingId(null); }}
                      className="flex-1 min-w-0 bg-white dark:bg-[#1F252B] border border-[#8C4A27] rounded-lg px-2 py-1.5 text-sm outline-none text-[#2B303B] dark:text-[#e4eff8]"
                    />
                    <button
                      data-testid={`plan-archive-rename-confirm-${p.id}`}
                      onClick={() => doRename(p.id)}
                      className="shrink-0 w-8 h-8 rounded-lg bg-[#8C4A27] text-white flex items-center justify-center"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8] truncate">{p.name}</p>
                    <p className="text-[11px] text-[#7E8A93] truncate">
                      {fmtDate(p.created_at)}{describe ? ` · ${describe(p.payload || {})}` : ""}
                    </p>
                  </>
                )}
              </div>
              {editingId !== p.id && (
                <>
                  <button
                    data-testid={`plan-archive-rename-btn-${p.id}`}
                    onClick={() => startRename(p)}
                    className="shrink-0 w-9 h-9 rounded-lg bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] flex items-center justify-center text-[#7E8A93]"
                    aria-label="rename"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    data-testid={`plan-archive-repeat-btn-${p.id}`}
                    onClick={() => doRepeat(p)}
                    className="shrink-0 flex items-center gap-1.5 bg-[#B45309] hover:bg-[#336a94] text-white text-xs font-semibold px-3 py-2 rounded-lg active:scale-98 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> {repeatLabel || tri("Ripeti", "Wiederholen", "Repeat")}
                  </button>
                  <button
                    data-testid={`plan-archive-delete-btn-${p.id}`}
                    onClick={() => doRemove(p.id)}
                    className="shrink-0 w-9 h-9 rounded-lg bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] flex items-center justify-center text-[#C0574D]"
                    aria-label="delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default PlanArchive;
