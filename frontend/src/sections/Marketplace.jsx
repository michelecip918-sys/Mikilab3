import { useState, useEffect } from "react";
import { Store, Plus, Trash2, Tag, X, MessageCircle, Mail, MapPin, Navigation } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import DualPhotoButtons from "@/components/DualPhotoButtons";
import { marketApi, uploadApi } from "@/lib/api";
import { mkTri } from "@/i18n/triMaps";

// Marketplace Usato — annunci REALI salvati sul server e condivisi tra tutti i fornai.

const WA_NUMBER = "491601253378";

// Annunci di ESEMPIO multilingua (non salvati; mostrano che il mercatino è aperto a fornai di più Paesi).
const SAMPLES = [
  { id: "s1", sample: true, cat: "impastatrice", condition: "buono", price: "2200", place: "Stuttgart, DE", lat: 48.7758, lng: 9.1829, title: "Spiralkneter 40 kg — gut erhalten", desc: "Zuverlässiger Spiralkneter, ideal für die tägliche Produktion. Abholung in Stuttgart.", contact: "" },
  { id: "s2", sample: true, cat: "forno", condition: "nuovo", price: "5400", place: "Napoli, IT", lat: 40.8518, lng: 14.2681, title: "Forno rotativo a carrello — come nuovo", desc: "Forno professionale a carrello, pochissimo usato. Ottimo per pane e viennoiserie.", contact: "" },
  { id: "s3", sample: true, cat: "sfogliatrice", condition: "buono", price: "1800", place: "Lyon, FR", lat: 45.7640, lng: 4.8357, title: "Laminoir 500mm — bon état", desc: "Laminoir de comptoir, parfait pour croissants et feuilletés. À récupérer à Lyon.", contact: "" },
  { id: "s4", sample: true, cat: "cella", condition: "buono", price: "1300", place: "Madrid, ES", lat: 40.4168, lng: -3.7038, title: "Cámara de fermentación controlada", desc: "Cámara de fermentación con control de temperatura y humedad. Recogida en Madrid.", contact: "" },
  { id: "s5", sample: true, cat: "accessori", condition: "nuovo", price: "260", place: "London, UK", lat: 51.5074, lng: -0.1278, title: "Set of bannetons & couche — new", desc: "Brand new proofing baskets and linen couche, various sizes. Collection in London.", contact: "" },
];

function distanceKm(a, b) {
  const R = 6371, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)));
}

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
  const tri = (i, d, e) => mkTri(lang)(i, d, e);

  const CATS = [
    { id: "impastatrice", label: tri("Impastatrici", "Kneter", "Mixers") },
    { id: "forno", label: tri("Forni", "Öfen", "Ovens") },
    { id: "cella", label: tri("Celle & Frigo", "Gärzellen & Kühl", "Cells & Fridge") },
    { id: "sfogliatrice", label: tri("Sfogliatrici", "Ausrollmasch.", "Sheeters") },
    { id: "accessori", label: tri("Accessori", "Zubehör", "Accessories") },
    { id: "altro", label: tri("Altro", "Sonstiges", "Other") },
  ];
  const catLabel = (id) => (CATS.find((c) => c.id === id) || {}).label || id;

  const { user } = useAuth();
  const [items, setItems] = useState([]);
  useEffect(() => { marketApi.list().then(setItems); }, []);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ title: "", cat: "impastatrice", price: "", condition: "buono", place: "", desc: "", photo: "", contact: "" });
  const [geo, setGeo] = useState(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const requestGeo = () => {
    if (geo) { setGeo(null); return; }
    if (!navigator.geolocation) return;
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoBusy(false); },
      () => { setGeoBusy(false); },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const CONDS = [
    { id: "nuovo", label: tri("Come nuovo", "Wie neu", "Like new") },
    { id: "buono", label: tri("Buono", "Gut", "Good") },
    { id: "usurato", label: tri("Segni d'uso", "Gebrauchsspuren", "Worn") },
  ];
  const condLabel = (id) => (CONDS.find((c) => c.id === id) || {}).label || id;

  const publish = async () => {
    if (!user) { toast.error(tri("Accedi per pubblicare un annuncio", "Zum Veröffentlichen anmelden", "Log in to post a listing")); return; }
    if (!form.title.trim()) return;
    if (!form.contact.trim()) { setErr(tri("Inserisci un contatto (email, telefono/WhatsApp o link): serve a chi è interessato per scriverti.", "Gib einen Kontakt an (E-Mail, Telefon/WhatsApp oder Link).", "Add a contact (email, phone/WhatsApp or link) so buyers can reach you.")); return; }
    setErr(""); setPublishing(true);
    try {
      let photoUrl = "";
      if (form.photo) {
        const blob = await (await fetch(form.photo)).blob();
        photoUrl = await uploadApi.image(blob, "annuncio.jpg");
      }
      const created = await marketApi.create({ ...form, title: form.title.trim(), photo: photoUrl, price: String(form.price || ""), lat: geo ? geo.lat : null, lng: geo ? geo.lng : null });
      setItems((p) => [created, ...p]);
      setForm({ title: "", cat: "impastatrice", price: "", condition: "buono", place: "", desc: "", photo: "", contact: "" });
      setShowForm(false);
      toast.success(tri("Annuncio pubblicato! Ora è visibile a tutti i fornai.", "Anzeige veröffentlicht! Für alle sichtbar.", "Listing published! Visible to all bakers."));
    } catch {
      setErr(tri("Errore durante la pubblicazione. Riprova.", "Fehler beim Veröffentlichen.", "Error publishing. Try again."));
    } finally { setPublishing(false); }
  };
  const remove = async (id) => {
    try { await marketApi.remove(id); setItems((p) => p.filter((x) => x.id !== id)); }
    catch { toast.error(tri("Non puoi rimuovere questo annuncio", "Du kannst diese Anzeige nicht entfernen", "You can't remove this listing")); }
  };

  const contactHref = (it) => {
    const raw = (it.contact || "").trim();
    if (!raw) return null; // nessun contatto sull'annuncio → nessun link (niente fallback su WhatsApp del sito)
    const msg = tri(`Ciao, sono interessato a "${it.title}" su MikiLab.`, `Hallo, ich interessiere mich für "${it.title}" auf MikiLab.`, `Hi, I'm interested in "${it.title}" on MikiLab.`);
    if (raw.includes("@")) return `mailto:${raw}?subject=${encodeURIComponent(it.title)}&body=${encodeURIComponent(msg)}`;
    if (/^https?:\/\//i.test(raw)) return raw; // link diretto dell'annuncio
    const num = raw.replace(/[^0-9]/g, "");
    return num ? `https://wa.me/${num}?text=${encodeURIComponent(msg)}` : null;
  };

  const allItems = items;
  let visible = filter === "all" ? allItems : allItems.filter((x) => x.cat === filter);
  if (geo) {
    visible = visible
      .map((x) => (x.lat != null && x.lng != null ? { ...x, _km: distanceKm(geo, x) } : x))
      .sort((a, b) => (a._km ?? 1e9) - (b._km ?? 1e9));
  }
  const priceFmt = (v) => { try { return new Intl.NumberFormat(lang === "en" ? "en-GB" : lang === "de" ? "de-DE" : "it-IT").format(Number(v)); } catch { return String(v); } };
  const inp = "w-full bg-[#121212] dark:bg-[#181818] border border-[#2b2b2b] dark:border-[#2e2e2e] rounded-xl px-3 py-2.5 outline-none text-[#2B303B] dark:text-[#e4eff8] focus:border-[#ff6b00]";

  return (
    <div className="pb-40">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#ff6b00] flex items-center justify-center"><Store className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Marketplace Usato", "Gebraucht-Markt", "Used Marketplace")}</h1>
          <p className="text-sm text-[#7E8A93]">{tri("Compra e vendi attrezzatura da laboratorio", "Backstuben-Ausrüstung kaufen & verkaufen", "Buy & sell bakery equipment")}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button data-testid="market-add" onClick={() => setShowForm((s) => !s)}
          className="flex-1 flex items-center justify-center gap-2 bg-[#ff6b00] hover:bg-[#ff8a33] text-white font-semibold py-3 rounded-2xl active:scale-98 transition-all">
          <Plus className="w-5 h-5" /> {tri("Pubblica un annuncio", "Anzeige aufgeben", "Post a listing")}
        </button>
        <button data-testid="market-geo" onClick={requestGeo}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold active:scale-98 transition-all border ${geo ? "bg-[#2e8b6f] text-white border-[#2e8b6f]" : "bg-white dark:bg-[#1e1e1e] text-[#2e8b6f] border-[#2e8b6f]/40"}`}>
          <Navigation className={`w-5 h-5 ${geoBusy ? "animate-pulse" : ""}`} /> {geo ? tri("Vicini a me", "In der Nähe", "Near me") : tri("Vicino a me", "In der Nähe", "Near me")}
        </button>
      </div>
      {geo && <p data-testid="market-geo-active" className="text-xs text-[#2e8b6f] font-semibold -mt-2 mb-3 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {tri("Ordinati per distanza dalla tua posizione", "Nach Entfernung sortiert", "Sorted by distance from you")}</p>}

      {/* Form nuovo annuncio */}
      {showForm && (
        <div data-testid="market-form" className="bg-[#ff6b00]/10 border border-[#ff6b00]/30 rounded-2xl p-4 mb-5 space-y-3">
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
          <input data-testid="market-contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder={tri("Contatto obbligatorio: email, WhatsApp o link dell'annuncio *", "Kontakt (Pflicht): E-Mail, WhatsApp oder Link *", "Contact (required): email, WhatsApp or listing link *")} className={inp} />
          {form.photo
            ? <div className="relative"><img src={form.photo} alt="" className="w-full h-40 object-cover rounded-xl" /><button data-testid="market-photo-clear" onClick={() => setForm({ ...form, photo: "" })} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1"><X className="w-4 h-4" /></button></div>
            : <DualPhotoButtons testid="market-photo" onFile={(f) => compress(f, (d) => setForm((s) => ({ ...s, photo: d })))} />}
          <button data-testid="market-publish" onClick={publish} disabled={publishing} className="w-full bg-[#ff6b00] hover:bg-[#ff8a33] disabled:opacity-60 text-white font-semibold py-3 rounded-xl active:scale-98 transition-all">{publishing ? tri("Pubblico…", "Wird veröffentlicht…", "Publishing…") : tri("Pubblica", "Veröffentlichen", "Publish")}</button>
          {err && <p data-testid="market-error" className="text-sm text-[#E4572E]">{err}</p>}
        </div>
      )}

      {/* Filtri categoria */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-1 px-1" data-testid="market-filters">
        <button data-testid="market-filter-all" onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap border ${filter === "all" ? "bg-[#ff6b00] text-white border-[#ff6b00]" : "bg-white dark:bg-[#1e1e1e] text-[#3F4A54] dark:text-[#AEB8BF] border-[#2b2b2b] dark:border-[#2e2e2e]"}`}>{tri("Tutti", "Alle", "All")}</button>
        {CATS.map((c) => (
          <button key={c.id} data-testid={`market-filter-${c.id}`} onClick={() => setFilter(c.id)} className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap border ${filter === c.id ? "bg-[#ff6b00] text-white border-[#ff6b00]" : "bg-white dark:bg-[#1e1e1e] text-[#3F4A54] dark:text-[#AEB8BF] border-[#2b2b2b] dark:border-[#2e2e2e]"}`}>{c.label}</button>
        ))}
      </div>

      {/* Griglia annunci */}
      <div className="grid grid-cols-2 gap-3" data-testid="market-list">
        {visible.length === 0 && <p className="col-span-2 text-center text-sm text-[#7E8A93] py-8">{tri("Nessun annuncio. Pubblica il primo!", "Keine Anzeigen. Gib die erste auf!", "No listings yet. Post the first!")}</p>}
        {visible.map((it) => (
          <div key={it.id} data-testid={`market-card-${it.id}`} className="bg-white dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] rounded-2xl overflow-hidden shadow-sm flex flex-col">
            {it.photo
              ? <img src={it.photo} alt={it.title} className="w-full h-28 object-cover" />
              : <div className="w-full h-28 bg-[#ff6b00]/15 flex items-center justify-center"><Store className="w-8 h-8 text-[#ff6b00]" /></div>}
            <div className="p-3 flex flex-col flex-1">
              <p className="font-display text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8] leading-tight line-clamp-2">{it.title}</p>
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#ff6b00]/15 text-[#ff6b00] font-semibold flex items-center gap-0.5"><Tag className="w-2.5 h-2.5" />{catLabel(it.cat)}</span>
                <span className="text-[10px] text-[#7E8A93]">{condLabel(it.condition)}</span>
              </div>
              {it.place && <p className="text-[11px] text-[#7E8A93] mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{it.place}{it._km != null ? ` · ${it._km} km` : ""}</p>}
              {it.desc && <p className="text-[11px] text-[#7E8A93] mt-1 line-clamp-2">{it.desc}</p>}
              <div className="mt-auto pt-2">
                {it.price && <p className="font-mono-data text-lg font-bold text-[#ff6b00]">€ {priceFmt(it.price)}</p>}
                <div className="flex items-center gap-1.5 mt-1.5">
                  {contactHref(it) ? (
                    <a data-testid={`market-contact-${it.id}`} href={contactHref(it)} target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1 bg-[#25D366] text-white text-xs font-semibold py-2 rounded-lg active:scale-95 transition-transform">
                      {(it.contact || "").includes("@") ? <Mail className="w-3.5 h-3.5" /> : <MessageCircle className="w-3.5 h-3.5" />} {tri("Contatta", "Kontakt", "Contact")}
                    </a>
                  ) : (
                    <span data-testid={`market-nocontact-${it.id}`} className="flex-1 text-center text-[11px] text-[#7E8A93] py-2 border border-dashed border-[#2b2b2b] dark:border-[#2e2e2e] rounded-lg">{tri("Nessun contatto indicato", "Kein Kontakt angegeben", "No contact provided")}</span>
                  )}
                  {!it.sample && user && (it.owner_id === user.user_id || user.role === "admin") && <button data-testid={`market-remove-${it.id}`} onClick={() => remove(it.id)} className="p-2 rounded-lg border border-[#2b2b2b] dark:border-[#2e2e2e] text-[#7E8A93] hover:text-[#E4572E]"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
