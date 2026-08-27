import { useState } from "react";
import { Search, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { pantryApi } from "@/lib/api";

// "Cosa posso fare con…?" — scrivi gli ingredienti che hai, l'IA trova le ricette fattibili.
export default function CosaPosso() {
  const { lang } = useLang();
  const tri = (i, d, e, s) => (lang === "de" ? d : lang === "es" ? (s ?? e ?? i) : (lang === "en" ? e : i));
  const [ing, setIng] = useState("");
  const [scope, setScope] = useState("mikilab");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState("");

  const search = async () => {
    if (!ing.trim()) return;
    setLoading(true); setErr(""); setRes(null);
    try {
      const r = await pantryApi.whatCanIMake({ ingredients: ing, collection_name: scope, lang });
      setRes(r);
      if ((!r.makable || !r.makable.length) && (!r.almost || !r.almost.length)) {
        setErr(tri("Nessuna ricetta trovata con questi ingredienti. Prova ad aggiungerne altri.", "Keine Rezepte mit diesen Zutaten gefunden. Füge weitere hinzu.", "No recipes found with these ingredients. Try adding more.", "No se encontraron recetas con estos ingredientes. Añade más."));
      }
    } catch {
      setErr(tri("Ricerca non riuscita, riprova.", "Suche fehlgeschlagen, versuche es erneut.", "Search failed, try again.", "Búsqueda fallida, inténtalo de nuevo."));
    } finally { setLoading(false); }
  };

  const inp = "w-full bg-[#f0f6fb] dark:bg-[#1F252B] border border-[#d5e4f0] dark:border-[#38424B] rounded-xl px-3 py-2.5 outline-none text-[#2B303B] dark:text-[#e4eff8] focus:border-[#3f7cac]";
  const Card = ({ item, kind }) => (
    <div data-testid={`cosa-${kind}-${item.id}`} className="flex items-center gap-3 rounded-2xl bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] p-3">
      {item.image_url ? <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-xl object-cover shrink-0" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        : <div className="w-14 h-14 rounded-xl bg-[#e4eff8] dark:bg-[#2A323A] shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[15px] text-[#2B303B] dark:text-[#e4eff8] leading-tight">{item.name}</p>
        <p className={`text-[12px] leading-snug mt-0.5 ${kind === "makable" ? "text-[#2e8b6f]" : "text-[#C88A2B]"}`}>
          {kind === "makable" ? item.note : `${tri("Manca", "Fehlt", "Missing", "Falta")}: ${item.missing}`}
        </p>
      </div>
    </div>
  );

  return (
    <div className="pb-40" data-testid="cosaposso-tool">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#2e8b6f] flex items-center justify-center"><Search className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Cosa posso fare?", "Was kann ich machen?", "What can I make?", "¿Qué puedo hacer?")}</h1>
          <p className="text-sm text-[#7E8A93]">{tri("Dimmi cosa hai, ti dico cosa impastare", "Sag mir, was du hast, ich sage dir, was du backen kannst", "Tell me what you have, I'll tell you what to bake", "Dime qué tienes y te digo qué amasar")}</p>
        </div>
      </div>

      <label className="text-[11px] font-semibold uppercase text-[#7E8A93] mb-1 block">{tri("I miei ingredienti", "Meine Zutaten", "My ingredients", "Mis ingredientes")}</label>
      <textarea data-testid="cosa-ingredients" value={ing} onChange={(e) => setIng(e.target.value)} rows={3}
        placeholder={tri("Es. farina 0, farina integrale, lievito madre, olive, noci, semi di sesamo…", "z. B. Mehl 0, Vollkornmehl, Sauerteig, Oliven, Walnüsse, Sesam…", "e.g. flour, wholemeal flour, sourdough, olives, walnuts, sesame…", "Ej. harina, harina integral, masa madre, aceitunas, nueces, sésamo…")}
        className={inp + " resize-y mb-2"} />

      <div className="flex gap-2 mb-3">
        {[["mikilab", tri("Ricette di Michele", "Micheles Rezepte", "Michele's recipes", "Recetas de Michele")], ["personal", tri("Le mie ricette", "Meine Rezepte", "My recipes", "Mis recetas")]].map(([id, lbl]) => (
          <button key={id} data-testid={`cosa-scope-${id}`} onClick={() => setScope(id)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all active:scale-98 ${scope === id ? "bg-[#3f7cac] text-white border-[#3f7cac]" : "bg-white dark:bg-[#232A31] text-[#7E8A93] border-[#d5e4f0] dark:border-[#38424B]"}`}>{lbl}</button>
        ))}
      </div>

      <button data-testid="cosa-search" onClick={search} disabled={loading || !ing.trim()}
        className="w-full flex items-center justify-center gap-2 bg-[#2e8b6f] hover:bg-[#256f59] disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl active:scale-98 transition-all mb-4">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
        {loading ? tri("Cerco…", "Suche…", "Searching…", "Buscando…") : tri("Trova le ricette", "Rezepte finden", "Find recipes", "Buscar recetas")}
      </button>

      {err && <p data-testid="cosa-empty" className="text-sm text-[#7E8A93] text-center py-4">{err}</p>}

      {res && res.makable && res.makable.length > 0 && (
        <div data-testid="cosa-makable" className="mb-5">
          <p className="text-[13px] font-bold text-[#2e8b6f] flex items-center gap-1.5 mb-2"><CheckCircle2 className="w-4 h-4" /> {tri("Puoi farle ora", "Kannst du jetzt machen", "You can make now", "Puedes hacerlas ahora")} ({res.makable.length})</p>
          <div className="space-y-2">{res.makable.map((it) => <Card key={it.id} item={it} kind="makable" />)}</div>
        </div>
      )}
      {res && res.almost && res.almost.length > 0 && (
        <div data-testid="cosa-almost">
          <p className="text-[13px] font-bold text-[#C88A2B] flex items-center gap-1.5 mb-2"><AlertCircle className="w-4 h-4" /> {tri("Ti manca poco", "Fast fertig", "Almost there", "Casi listas")} ({res.almost.length})</p>
          <div className="space-y-2">{res.almost.map((it) => <Card key={it.id} item={it} kind="almost" />)}</div>
        </div>
      )}
    </div>
  );
}
