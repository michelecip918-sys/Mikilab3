import { useState, useEffect } from "react";
import { Newspaper, Plus, Trash2, Pencil, X, Save, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { newsItemsApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";

const EMPTY = { title: "", title_de: "", title_en: "", body: "", body_de: "", body_en: "", tag: "", link: "" };

export default function HomeNews() {
  const { lang } = useLang();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const tri = (i, d, e) => (lang === "de" ? d : lang === "it" ? i : (e ?? i));
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null); // id | "new" | null
  const [form, setForm] = useState(EMPTY);

  const load = () => newsItemsApi.list().then((d) => setItems(Array.isArray(d) ? d : [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const locTitle = (n) => (lang === "de" ? n.title_de : lang === "en" ? n.title_en : n.title) || n.title;
  const locBody = (n) => (lang === "de" ? n.body_de : lang === "en" ? n.body_en : n.body) || n.body;

  const openNew = () => { setForm(EMPTY); setEditing("new"); };
  const openEdit = (n) => { setForm({ ...EMPTY, ...n }); setEditing(n.id); };
  const save = async () => {
    if (!(form.title || "").trim()) { toast.error(tri("Titolo richiesto", "Titel erforderlich", "Title required")); return; }
    try {
      if (editing === "new") await newsItemsApi.create(form);
      else await newsItemsApi.update(editing, form);
      toast.success(tri("News salvata ✓", "News gespeichert ✓", "News saved ✓"));
      setEditing(null); await load();
    } catch { toast.error(tri("Salvataggio non riuscito", "Speichern fehlgeschlagen", "Save failed")); }
  };
  const remove = async (id) => {
    try { await newsItemsApi.remove(id); setItems((x) => x.filter((n) => n.id !== id)); }
    catch { toast.error(tri("Eliminazione non riuscita", "Löschen fehlgeschlagen", "Delete failed")); }
  };

  if (!isAdmin && items.length === 0) return null;

  const F = (k, ph) => (
    <input value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} placeholder={ph}
      className="w-full bg-white dark:bg-[#1F252B] border border-[#d5e4f0] dark:border-[#38424B] rounded-lg px-2.5 py-2 text-sm outline-none focus:border-[#3f7cac] mb-1.5" />
  );

  return (
    <div data-testid="home-news" className="rounded-2xl bg-white/70 dark:bg-[#232A31]/70 border border-[#d5e4f0] dark:border-[#38424B] p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8]">
          <Newspaper className="w-5 h-5 text-[#C85A32]" /> {tri("News · Arte Bianca", "News · Backhandwerk", "News · Artisan Baking")}
        </h2>
        {isAdmin && editing === null && (
          <button data-testid="news-add-btn" onClick={openNew} className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-[#3f7cac] px-2.5 py-1.5 rounded-lg active:scale-95">
            <Plus className="w-3.5 h-3.5" /> {tri("Aggiungi", "Hinzufügen", "Add")}
          </button>
        )}
      </div>
      <p className="text-xs text-[#7E8A93] mb-3">{tri("Forni, farine, mulini, tendenze ed eventi — Italia, Germania e nel mondo.", "Öfen, Mehle, Mühlen, Trends und Events — Italien, Deutschland und weltweit.", "Ovens, flours, mills, trends and events — Italy, Germany and worldwide.")}</p>

      {isAdmin && editing !== null && (
        <div data-testid="news-editor" className="rounded-xl bg-[#e4eff8] dark:bg-[#2A323A] p-3 mb-3">
          {F("title", tri("Titolo (IT)", "Titel (IT)", "Title (IT)"))}
          {F("title_de", "Titel (DE)")}
          {F("title_en", "Title (EN)")}
          <textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} placeholder={tri("Testo (IT)", "Text (IT)", "Body (IT)")} rows={2}
            className="w-full bg-white dark:bg-[#1F252B] border border-[#d5e4f0] dark:border-[#38424B] rounded-lg px-2.5 py-2 text-sm outline-none focus:border-[#3f7cac] mb-1.5 resize-none" />
          <textarea value={form.body_de} onChange={(e) => setForm((f) => ({ ...f, body_de: e.target.value }))} placeholder="Text (DE)" rows={2}
            className="w-full bg-white dark:bg-[#1F252B] border border-[#d5e4f0] dark:border-[#38424B] rounded-lg px-2.5 py-2 text-sm outline-none focus:border-[#3f7cac] mb-1.5 resize-none" />
          <textarea value={form.body_en} onChange={(e) => setForm((f) => ({ ...f, body_en: e.target.value }))} placeholder="Body (EN)" rows={2}
            className="w-full bg-white dark:bg-[#1F252B] border border-[#d5e4f0] dark:border-[#38424B] rounded-lg px-2.5 py-2 text-sm outline-none focus:border-[#3f7cac] mb-1.5 resize-none" />
          <div className="grid grid-cols-2 gap-1.5">{F("tag", tri("Etichetta (es. Mulini)", "Label (z. B. Mühlen)", "Tag (e.g. Mills)"))}{F("link", tri("Link (opzionale)", "Link (optional)", "Link (optional)"))}</div>
          <div className="flex gap-2 mt-1">
            <button data-testid="news-save-btn" onClick={save} className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#3f7cac] text-white text-sm font-semibold py-2 rounded-lg active:scale-98"><Save className="w-4 h-4" /> {tri("Salva", "Speichern", "Save")}</button>
            <button onClick={() => setEditing(null)} className="w-10 rounded-lg bg-white dark:bg-[#1F252B] border border-[#d5e4f0] dark:border-[#38424B] flex items-center justify-center text-[#7E8A93]"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        {items.map((n) => (
          <div key={n.id} data-testid={`news-item-${n.id}`} className="rounded-xl bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                {n.tag && <span className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-1 text-[#C85A32] bg-[#C85A32]/12">{n.tag}</span>}
                <h3 className="font-display text-base font-semibold text-[#2B303B] dark:text-[#e4eff8] leading-tight">{locTitle(n)}</h3>
                {locBody(n) && <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] mt-1 leading-snug">{locBody(n)}</p>}
                {n.link && <a href={n.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#3f7cac] mt-1.5">{tri("Leggi", "Lesen", "Read")} <ExternalLink className="w-3 h-3" /></a>}
              </div>
              {isAdmin && (
                <div className="flex flex-col gap-1 shrink-0">
                  <button data-testid={`news-edit-${n.id}`} onClick={() => openEdit(n)} className="w-8 h-8 rounded-lg bg-[#e4eff8] dark:bg-[#2A323A] flex items-center justify-center text-[#7E8A93]"><Pencil className="w-3.5 h-3.5" /></button>
                  <button data-testid={`news-delete-${n.id}`} onClick={() => remove(n.id)} className="w-8 h-8 rounded-lg bg-[#C0574D]/10 flex items-center justify-center text-[#C0574D]"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
