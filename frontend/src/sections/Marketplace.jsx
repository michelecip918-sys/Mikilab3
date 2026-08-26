import { useState, useEffect } from "react";
import { Store, Plus, Trash2, Tag, X, MessageCircle, Mail } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import DualPhotoButtons from "@/components/DualPhotoButtons";
import { loadMarket, MARKET_KEY, markMarketSeen } from "@/lib/market";

// Punto 17 — Marketplace Usato (bacheca LOCALE sul dispositivo).
// Attrezzatura di laboratorio usata: pubblica, filtra e contatta via WhatsApp/email.

const WA_NUMBER = "491601253378";
const uid = () => Math.random().toString(36).slice(2, 9);

// riduce l'immagine per stare nel localStorage
function compress(file, cb) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const max = 900;
      let { width, height } = img;
      if (width > max) { height = Math.round((height * max) / width); width = max; }
      const c = document.createElement("canvas");
      c.width = width; c.height = height;
      c.getContext("2d").drawImage(img, 0, 0, width, height);
      cb(c.toDataURL("image/jpeg", 0.7));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

export default function Marketplace() {
  const { lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);

  const CATS = [
    { id: "impastatrice", label: tri("Impastatrici", "Kneter", "Mixers") },
    { id: "forno", label: tri("Forni", "Öfen", "Ovens") },
    { id: "cella", label: tri("Celle & Frigo", "Gärzellen & Kühl", "Cells & Fridge") },
    { id: "sfogliatrice", label: tri("Sfogliatrici", "Ausrollmasch.", "Sheeters") },
    { id: "accessori", label: tri("Accessori", "Zubehör", "Accessories") },
    { id: "altro", label: tri("Altro", "Sonstiges", "Other") },
  ];
  const catLabel = (id) => (CATS.find((c) => c.id === id) || {}).label || id;

  const [items, setItems] = useState(() => loadMarket());
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ title: "", cat: "impastatrice", price: "", condition: "buono", place: "", desc: "", photo: "", contact: "" });

  useEffect(() => { try { localStorage.setItem(MARKET_KEY, JSON.stringify(items)); markMarketSeen(); } catch { /* quota */ } }, [items]);

  const CONDS = [
    { id: "nuovo", label: tri("Come nuovo", "Wie neu", "Like new") },
    { id: "buono", label: tri("Buono", "Gut", "Good") },
    { id: "usurato", label: tri("Segni d'uso", "Gebrauchsspuren", "Worn") },
  ];
  const condLabel = (id) => (CONDS.find((c) => c.id === id) || {}).label || id;

  const publish = () => {
    if (!form.title.trim()) return;
    const item = { id: uid(), ...form, title: form.title.trim(), createdAt: Date.now() };
    const next = [item, ...items];
    try {
      localStorage.setItem("mikilab_market", JSON.stringify(next));
      setItems(next);
      setForm({ title: "", cat: "impastatrice", price: "", condition: "buono", place: "", desc: "", photo: "", contact: "" });
      setShowForm(false);
    } catch {
      setErr(tri("Memoria piena: rimuovi qualche annuncio o usa una foto più piccola.", "Speicher voll: Anzeigen entfernen oder kleineres Foto nutzen.", "Storage full: remove listings or use a smaller photo."));
    }
  };
  const remove = (id) => setItems((p) => p.filter((x) => x.id !== id));

  const contactHref = (it) => {
    const raw = (it.contact || "").trim();
    const msg = tri(`Ciao, sono interessato a "${it.title}" su MikiLab.`, `Hallo, ich interessiere mich für "${it.title}" auf MikiLab.`, `Hi, I'm interested in "${it.title}" on MikiLab.`);
    if (raw.includes("@")) return `mailto:${raw}?subject=${encodeURIComponent(it.title)}&body=${encodeURIComponent(msg)}`;
    const num = raw ? raw.replace(/[^0-9]/g, "") : WA_NUMBER;
    return `https://wa.me/${num || WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  const visible = filter === "all" ? items : items.filter((x) => x.cat === filter);
  const priceFmt = (v) => { try { return new Intl.NumberFormat(lang === "en" ? "en-GB" : lang === "de" ? "de-DE" : "it-IT").format(Number(v)); } catch { return String(v); } };
  const inp = "w-full bg-[#f0f6fb] dark:bg-[#1F252B] border border-[#d5e4f0] dark:border-[#38424B] rounded-xl px-3 py-2.5 outline-none text-[#2B303B] dark:text-[#e4eff8] focus:border-[#3f7cac]";

  return (
    <div className="pb-40">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#3f7cac] flex items-center justify-center"><Store className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Marketplace Usato", "Gebraucht-Markt", "Used Marketplace")}</h1>
          <p className="text-sm text-[#7E8A93]">{tri("Compra e vendi attrezzatura da laboratorio", "Backstuben-Ausrüstung kaufen & verkaufen", "Buy & sell bakery equipment")}</p>
        </div>
      </div>

      <button data-testid="market-add" onClick={() => setShowForm((s) => !s)}
        className="w-full flex items-center justify-center gap-2 bg-[#3f7cac] hover:bg-[#336a94] text-white font-semibold py-3 rounded-2xl active:scale-98 transition-all mb-4">
        <Plus className="w-5 h-5" /> {tri("Pubblica un annuncio", "Anzeige aufgeben", "Post a listing")}
      </button>

      {/* Form nuovo annuncio */}
      {showForm && (
        <div data-testid="market-form" className="bg-[#6E8CA0]/10 border border-[#6E8CA0]/30 rounded-2xl p-4 mb-5 space-y-3">
          <input data-testid="market-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={tri("Titolo (es. Impastatrice a spirale 40kg)", "Titel (z.B. Spiralkneter 40kg)", "Title (e.g. 40kg spiral mixer)")} className={inp} />
          <div className="grid grid-cols-2 gap-2">
            <select data-testid="market-cat" value={form.cat} onChange={(e) => setForm({ ...form, cat: e.target.value })} className={inp}>
              {CATS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <select data-testid="market-cond" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className={inp}>
              {CONDS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input data-testid="market-price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder={tri("Prezzo €", "Preis €", "Price €")} className={inp + " font-mono-data"} />
            <input data-testid="market-place" value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} placeholder={tri("Zona / Città", "Ort / Stadt", "Area / City")} className={inp} />
          </div>
          <textarea data-testid="market-desc" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} rows={2} placeholder={tri("Descrizione…", "Beschreibung…", "Description…")} className={inp} />
          <input data-testid="market-contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder={tri("Contatto (WhatsApp o email — vuoto = Michele)", "Kontakt (WhatsApp/E-Mail — leer = Michele)", "Contact (WhatsApp/email — empty = Michele)")} className={inp} />
          {form.photo
            ? <div className="relative"><img src={form.photo} alt="" className="w-full h-40 object-cover rounded-xl" /><button data-testid="market-photo-clear" onClick={() => setForm({ ...form, photo: "" })} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1"><X className="w-4 h-4" /></button></div>
            : <DualPhotoButtons testid="market-photo" onFile={(f) => compress(f, (d) => setForm((s) => ({ ...s, photo: d })))} />}
          <button data-testid="market-publish" onClick={publish} className="w-full bg-[#5aa0cf] hover:bg-[#336a94] text-white font-semibold py-3 rounded-xl active:scale-98 transition-all">{tri("Pubblica", "Veröffentlichen", "Publish")}</button>
          {err && <p data-testid="market-error" className="text-sm text-[#E4572E]">{err}</p>}
        </div>
      )}

      {/* Filtri categoria */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-1 px-1" data-testid="market-filters">
        <button data-testid="market-filter-all" onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap border ${filter === "all" ? "bg-[#3f7cac] text-white border-[#3f7cac]" : "bg-white dark:bg-[#232A31] text-[#3F4A54] dark:text-[#AEB8BF] border-[#d5e4f0] dark:border-[#38424B]"}`}>{tri("Tutti", "Alle", "All")}</button>
        {CATS.map((c) => (
          <button key={c.id} data-testid={`market-filter-${c.id}`} onClick={() => setFilter(c.id)} className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap border ${filter === c.id ? "bg-[#3f7cac] text-white border-[#3f7cac]" : "bg-white dark:bg-[#232A31] text-[#3F4A54] dark:text-[#AEB8BF] border-[#d5e4f0] dark:border-[#38424B]"}`}>{c.label}</button>
        ))}
      </div>

      {/* Griglia annunci */}
      <div className="grid grid-cols-2 gap-3" data-testid="market-list">
        {visible.length === 0 && <p className="col-span-2 text-center text-sm text-[#7E8A93] py-8">{tri("Nessun annuncio. Pubblica il primo!", "Keine Anzeigen. Gib die erste auf!", "No listings yet. Post the first!")}</p>}
        {visible.map((it) => (
          <div key={it.id} data-testid={`market-card-${it.id}`} className="bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] rounded-2xl overflow-hidden shadow-sm flex flex-col">
            {it.photo
              ? <img src={it.photo} alt={it.title} className="w-full h-28 object-cover" />
              : <div className="w-full h-28 bg-[#6E8CA0]/15 flex items-center justify-center"><Store className="w-8 h-8 text-[#6E8CA0]" /></div>}
            <div className="p-3 flex flex-col flex-1">
              <p className="font-display text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8] leading-tight line-clamp-2">{it.title}</p>
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#6E8CA0]/15 text-[#3f7cac] font-semibold flex items-center gap-0.5"><Tag className="w-2.5 h-2.5" />{catLabel(it.cat)}</span>
                <span className="text-[10px] text-[#7E8A93]">{condLabel(it.condition)}</span>
              </div>
              {it.place && <p className="text-[11px] text-[#7E8A93] mt-0.5">{it.place}</p>}
              {it.desc && <p className="text-[11px] text-[#7E8A93] mt-1 line-clamp-2">{it.desc}</p>}
              <div className="mt-auto pt-2">
                {it.price && <p className="font-mono-data text-lg font-bold text-[#5aa0cf]">€ {priceFmt(it.price)}</p>}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <a data-testid={`market-contact-${it.id}`} href={contactHref(it)} target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 bg-[#25D366] text-white text-xs font-semibold py-2 rounded-lg active:scale-95 transition-transform">
                    {(it.contact || "").includes("@") ? <Mail className="w-3.5 h-3.5" /> : <MessageCircle className="w-3.5 h-3.5" />} {tri("Contatta", "Kontakt", "Contact")}
                  </a>
                  <button data-testid={`market-remove-${it.id}`} onClick={() => remove(it.id)} className="p-2 rounded-lg border border-[#d5e4f0] dark:border-[#38424B] text-[#7E8A93] hover:text-[#E4572E]"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
