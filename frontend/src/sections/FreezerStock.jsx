import { useEffect, useState } from "react";
import { Snowflake, Plus, Trash2, Save, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";

export default function FreezerStock() {
  const { lang } = useLang();
  const de = lang === "de";
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/freezer").then((r) => setItems(r.data.items || [])).catch(() => {});
  }, []);

  const set = (i, patch) => setItems((l) => l.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const add = () => setItems((l) => [...l, { name: "", qty: 0, min_qty: 0 }]);
  const remove = (i) => setItems((l) => l.filter((_, idx) => idx !== i));

  const low = items.filter((x) => Number(x.min_qty) > 0 && Number(x.qty) < Number(x.min_qty));

  const save = async () => {
    setSaving(true);
    try {
      const payload = { items: items.filter((x) => (x.name || "").trim()).map((x) => ({ name: x.name.trim(), qty: Number(x.qty) || 0, min_qty: Number(x.min_qty) || 0 })) };
      const r = await api.put(`/freezer?lang=${lang}`, payload);
      toast.success(de ? "Gespeichert" : lang === "en" ? "Saved" : "Salvato");
      if (r.data.emailed) toast.warning(de ? "Niedriger Bestand: E-Mail gesendet!" : lang === "en" ? "Low stock: email sent!" : "Scorta bassa: email inviata!");
    } catch { toast.error(de ? "Fehler" : lang === "en" ? "Error" : "Errore"); }
    finally { setSaving(false); }
  };

  return (
    <div data-testid="freezer-stock" className="pb-4">
      <div className="rounded-2xl bg-gradient-to-br from-[#3E9C93] to-[#374f31] text-white p-5 mb-4">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2"><Snowflake className="w-6 h-6" /> {de ? "Freezer-Bestand" : lang === "en" ? "Freezer stock" : "Giacenze Freezer"}</h1>
        <p className="text-white/85 text-sm mt-1">
          {de ? "Setze Menge und Mindestmenge. Sinkt etwas darunter, bekommst du eine E-Mail an dein Konto." : lang === "en" ? "Set quantity and minimum. If something drops below, you get an email to your account." : "Imposta quantità e scorta minima. Se qualcosa scende sotto, ricevi una email al tuo account."}
        </p>
      </div>

      {low.length > 0 && (
        <div data-testid="freezer-low-warning" className="mb-3 rounded-2xl shadow-md border border-amber-900/40 bg-[#3E9C93]/10 border border-[#3E9C93]/30 p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-[#3E9C93] shrink-0 mt-0.5" />
          <p className="text-sm text-[#3E9C93] dark:text-[#8FB0C2]">
            {de ? "Unter Mindestmenge: " : lang === "en" ? "Below minimum: " : "Sotto la soglia: "}<b>{low.map((x) => x.name).join(", ")}</b>
          </p>
        </div>
      )}

      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} data-testid={`freezer-row-${i}`} className="flex items-center gap-2 bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-2xl shadow-md border border-amber-900/40 p-2.5">
            <input value={it.name} onChange={(e) => set(i, { name: e.target.value })} placeholder={de ? "Produkt" : lang === "en" ? "Product" : "Prodotto"}
              className="flex-1 min-w-0 bg-transparent outline-none text-sm text-[#2B303B] dark:text-[#e4eff8]" />
            <div className="flex items-center gap-1">
              <input type="number" value={it.qty} onChange={(e) => set(i, { qty: e.target.value })} title={de ? "Bestand" : lang === "en" ? "Stock" : "Scorta"}
                className="w-16 text-center font-mono-data text-sm bg-[#e4eff8] dark:bg-[#1B2A38] rounded-lg py-1.5 outline-none" />
              <span className="text-[10px] text-[#7E8A93]">/</span>
              <input type="number" value={it.min_qty} onChange={(e) => set(i, { min_qty: e.target.value })} title={de ? "Min." : "Min."}
                className="w-16 text-center font-mono-data text-sm bg-[#3E9C93]/15 rounded-lg py-1.5 outline-none" />
            </div>
            <button onClick={() => remove(i)} className="w-8 h-8 rounded-lg bg-[#e4eff8] dark:bg-[#1B2A38] flex items-center justify-center text-[#3E9C93] shrink-0"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>

      <button data-testid="freezer-add" onClick={add} className="mt-3 w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#2A3B49] dark:border-[#2A3B49] text-[#7E8A93] rounded-2xl shadow-md border border-amber-900/40 py-2.5 active:scale-98">
        <Plus className="w-4 h-4" /> {de ? "Produkt hinzufügen" : lang === "en" ? "Add product" : "Aggiungi prodotto"}
      </button>
      <button data-testid="freezer-save" onClick={save} disabled={saving} className="mt-3 w-full flex items-center justify-center gap-2 bg-[#3E9C93] disabled:opacity-50 text-white font-semibold rounded-2xl py-3 active:scale-98">
        <Save className="w-5 h-5" /> {de ? "Speichern" : lang === "en" ? "Save" : "Salva"}
      </button>
    </div>
  );
}
