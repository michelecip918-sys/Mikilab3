import { useState, useEffect } from "react";
import { Store, Plus, Trash2, MapPin, Clock, Save } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";
import { getSalesPoints, saveSalesPoints } from "@/lib/salesPoints";
import { mkTri } from "@/i18n/triMaps";

// Passo 3 · Logistica & Punti Vendita — CRUD punti vendita (localStorage).
export default function SalesPoints() {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [points, setPoints] = useState([]);
  const [form, setForm] = useState({ name: "", address: "", hours: "" });

  useEffect(() => { setPoints(getSalesPoints()); }, []);

  const persist = (next) => { setPoints(next); saveSalesPoints(next); };

  const add = () => {
    if (!form.name.trim()) { toast.error(tri("Inserisci il nome del punto vendita", "Namen des Verkaufspunkts angeben", "Enter the sales point name")); return; }
    const next = [...points, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: form.name.trim(), address: form.address.trim(), hours: form.hours.trim() }];
    persist(next);
    setForm({ name: "", address: "", hours: "" });
    toast.success(tri("Punto vendita aggiunto", "Verkaufspunkt hinzugefügt", "Sales point added"));
  };

  const remove = (id) => persist(points.filter((p) => p.id !== id));

  const inp = "w-full bg-[#121212] dark:bg-[#181818] border border-[#2b2b2b] dark:border-[#2e2e2e] rounded-xl px-3 py-2.5 outline-none text-[#2B303B] dark:text-[#e4eff8] focus:border-[#ff6b00]";

  return (
    <div className="pb-40" data-testid="salespoints">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#ff6b00] flex items-center justify-center"><Store className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Punti Vendita", "Verkaufspunkte", "Sales Points")}</h1>
          <p className="text-sm text-[#7E8A93]">{tri("Nome, indirizzo e orari — usati nel Piano Settimanale", "Name, Adresse und Zeiten — im Wochenplan verwendet", "Name, address and hours — used in the Weekly Plan")}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] rounded-2xl p-4 mb-4 space-y-3">
        <p className="text-xs font-bold uppercase text-[#ff6b00]">{tri("Nuovo punto vendita", "Neuer Verkaufspunkt", "New sales point")}</p>
        <input data-testid="salespoint-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={tri("Nome (es. Forno Centro)", "Name (z. B. Bäckerei Zentrum)", "Name (e.g. Downtown Bakery)")} className={inp} />
        <div className="relative">
          <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7E8A93]" />
          <input data-testid="salespoint-address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder={tri("Indirizzo", "Adresse", "Address")} className={inp + " pl-9"} />
        </div>
        <div className="relative">
          <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7E8A93]" />
          <input data-testid="salespoint-hours" value={form.hours} onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))} placeholder={tri("Orari (es. 7:00–13:00 / 16:00–19:30)", "Zeiten (z. B. 7:00–13:00)", "Hours (e.g. 7:00–13:00)")} className={inp + " pl-9"} />
        </div>
        <button data-testid="salespoint-add" onClick={add} className="w-full flex items-center justify-center gap-2 bg-[#ff6b00] hover:bg-[#336a94] text-white font-bold py-3 rounded-2xl active:scale-98"><Plus className="w-5 h-5" /> {tri("Aggiungi punto vendita", "Verkaufspunkt hinzufügen", "Add sales point")}</button>
      </div>

      {points.length === 0 ? (
        <p className="text-sm text-[#9AA6AE] text-center py-4">{tri("Nessun punto vendita ancora. Aggiungine uno qui sopra.", "Noch keine Verkaufspunkte. Füge oben einen hinzu.", "No sales points yet. Add one above.")}</p>
      ) : (
        <div className="space-y-2" data-testid="salespoint-list">
          {points.map((p) => (
            <div key={p.id} data-testid={`salespoint-item-${p.id}`} className="flex items-start justify-between bg-white dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] rounded-xl px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8] flex items-center gap-1.5"><Store className="w-3.5 h-3.5 text-[#ff6b00]" /> {p.name}</p>
                {p.address && <p className="text-[11px] text-[#7E8A93] flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {p.address}</p>}
                {p.hours && <p className="text-[11px] text-[#7E8A93] flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> {p.hours}</p>}
              </div>
              <button data-testid={`salespoint-remove-${p.id}`} onClick={() => remove(p.id)} className="text-[#7E8A93] hover:text-[#ff6b00] shrink-0 ml-2"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
