import { useState, useEffect } from "react";
import { Star, Plus, X, Cloud } from "lucide-react";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";
import { getCombos, saveCombo, deleteCombo, COMBOS_EVENT } from "@/lib/combos";

// Pannello "Le mie combinazioni": salva un set di ricette+quantità e lo riaggiunge con un tap.
export default function CapoCombos({ products, setProducts, lang, getSaveItems, onApply }) {
  const tri3 = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const [combos, setCombos] = useState(() => getCombos());
  const [name, setName] = useState("");
  const [saveOpen, setSaveOpen] = useState(false);

  useEffect(() => {
    const on = () => setCombos(getCombos());
    window.addEventListener(COMBOS_EVENT, on);
    return () => window.removeEventListener(COMBOS_EVENT, on);
  }, []);

  const saveSource = getSaveItems ? getSaveItems() : (products || []);
  const hasRecipes = saveSource.some((p) => p.recipe_id);
  if (combos.length === 0 && !hasRecipes) return null;

  const doSave = () => {
    if (!name.trim()) return;
    setCombos(saveCombo(name, saveSource));
    setName(""); setSaveOpen(false);
    toast.success(tri3("Combinazione salvata.", "Kombination gespeichert.", "Combo saved.", "Combinación guardada."));
  };
  const apply = (combo) => {
    if (onApply) { onApply(combo.items); }
    else setProducts((l) => {
      const base = l.filter((p) => p.recipe_id);
      const existing = new Set(base.map((p) => p.recipe_id));
      const toAdd = combo.items.filter((it) => !existing.has(it.recipe_id)).map((it) => ({ ...it, _opts: false }));
      const next = [...base, ...toAdd];
      return next.length ? next : l;
    });
    toast.success(tri3(`Aggiunta: ${combo.name}`, `Hinzugefügt: ${combo.name}`, `Added: ${combo.name}`, `Añadido: ${combo.name}`));
  };
  const remove = (id) => setCombos(deleteCombo(id));

  return (
    <div className="mt-2.5 rounded-2xl shadow-md border border-amber-900/40 border border-[#26324A] dark:border-[#26324A] bg-[#18202E] p-2.5" data-testid="capo-combos">
      <p className="text-[11px] font-bold uppercase tracking-wide text-[#7E8A93] mb-1.5 flex items-center gap-1"><Star className="w-3.5 h-3.5" /> {tri3("Le mie combinazioni", "Meine Kombinationen", "My combos", "Mis combinaciones")}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {combos.map((c) => (
          <span key={c.id} className="inline-flex items-center rounded-full bg-[#F26419]/12 border border-[#F26419]/30 overflow-hidden">
            <button type="button" data-testid={`capo-combo-apply-${c.id}`} onClick={() => apply(c)}
              className="text-xs font-semibold text-[#F26419] dark:text-[#ffd9b8] pl-3 pr-2 py-1.5 active:scale-95 transition-all max-w-[220px] truncate flex items-center gap-1">
              {c.synced && <Cloud data-testid={`capo-combo-synced-${c.id}`} className="w-3.5 h-3.5 text-[#AEB8BF] shrink-0" aria-label={tri3("Sincronizzata sull'account", "Mit Konto synchronisiert", "Synced to account", "Sincronizada en la cuenta")} />}
              <span className="truncate">{c.name}</span> <span className="opacity-70 shrink-0">· {c.items.length}</span>
            </button>
            <button type="button" data-testid={`capo-combo-del-${c.id}`} onClick={() => remove(c.id)}
              className="text-[#F26419]/70 hover:text-[#F26419] pr-2 pl-0.5 py-1.5"><X className="w-3 h-3" /></button>
          </span>
        ))}
        {hasRecipes && !saveOpen && (
          <button type="button" data-testid="capo-combo-save-open" onClick={() => setSaveOpen(true)}
            className="text-xs font-semibold text-white bg-[#F26419] px-3 py-1.5 rounded-full flex items-center gap-1 active:scale-95">
            <Plus className="w-3.5 h-3.5" /> {tri3("Salva combinazione", "Kombination speichern", "Save combo", "Guardar combinación")}
          </button>
        )}
      </div>
      {saveOpen && (
        <div className="flex items-center gap-2 mt-2">
          <input data-testid="capo-combo-name" value={name} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") doSave(); }} autoFocus
            placeholder={tri3("es. Produzione del lunedì", "z.B. Montagsproduktion", "e.g. Monday production", "ej. Producción del lunes")}
            className="flex-1 min-w-0 bg-[#18202E] border border-[#26324A] rounded-lg py-1.5 px-2.5 text-sm text-white outline-none focus:border-[#F26419]" />
          <button type="button" data-testid="capo-combo-save" onClick={doSave} disabled={!name.trim()}
            className="text-xs font-semibold text-white bg-[#F26419] disabled:opacity-40 px-3 py-1.5 rounded-lg active:scale-95 shrink-0">{tri3("Salva", "Speichern", "Save", "Guardar")}</button>
          <button type="button" onClick={() => { setSaveOpen(false); setName(""); }} className="text-[#7E8A93] p-1 shrink-0"><X className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}
