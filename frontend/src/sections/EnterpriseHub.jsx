import { useState, useEffect, useCallback } from "react";
import { Building2, Store, Truck, ChevronDown, CalendarClock } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { storesApi } from "@/lib/api";
import StoresManager from "@/sections/StoresManager";
import OrdersManager from "@/sections/OrdersManager";
import ShiftsManager from "@/sections/ShiftsManager";
import { mkTri } from "@/i18n/triMaps";

const STORE_KEY = "mikilab_current_store";

export default function EnterpriseHub() {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);

  const [sub, setSub] = useState("negozi");
  const [stores, setStores] = useState([]);
  const [current, setCurrentState] = useState(() => localStorage.getItem(STORE_KEY) || null);

  const setCurrent = (id) => { setCurrentState(id); if (id) localStorage.setItem(STORE_KEY, id); else localStorage.removeItem(STORE_KEY); };

  const reload = useCallback(async () => {
    const list = await storesApi.list();
    setStores(list);
    setCurrentState((prev) => {
      if (prev && list.find((s) => s.id === prev)) return prev;
      const next = list[0]?.id || null;
      if (next) localStorage.setItem(STORE_KEY, next); else localStorage.removeItem(STORE_KEY);
      return next;
    });
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const TABS = [
    { id: "negozi", label: tri("Negozi", "Filialen", "Stores"), Icon: Store },
    { id: "ordini", label: tri("Ordini", "Bestellungen", "Orders"), Icon: Truck },
    { id: "turni", label: tri("Turni", "Schichten", "Shifts"), Icon: CalendarClock },
  ];
  const currentStore = stores.find((s) => s.id === current) || null;

  return (
    <div data-testid="enterprise-hub">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#3E9C93] to-[#0D1520] flex items-center justify-center"><Building2 className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Enterprise", "Enterprise", "Enterprise")}</h1>
          <p className="text-sm text-[#7E8A93]">{tri("Gestione multi-negozio, ordini e turni", "Multi-Filiale, Bestellungen & Schichten", "Multi-store, orders & shifts")}</p>
        </div>
      </div>

      {/* Selettore negozio attivo */}
      {stores.length > 0 && (
        <div className="relative mb-4" data-testid="enterprise-store-picker">
          <Store className="w-4 h-4 text-[#3E9C93] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select value={current || ""} onChange={(e) => setCurrent(e.target.value)}
            className="w-full appearance-none bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-2xl pl-9 pr-9 py-3 font-semibold text-[#2B303B] dark:text-[#e4eff8] outline-none focus:border-[#3E9C93]">
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <ChevronDown className="w-4 h-4 text-[#7E8A93] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      )}

      {/* Sotto-schede */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 bg-[#e4eff8] dark:bg-[#1B2A38] p-1.5 rounded-2xl mb-5 border border-[#2A3B49] dark:border-[#2A3B49]">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} data-testid={`enterprise-tab-${id}`} onClick={() => setSub(id)}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-2xl shadow-md border border-amber-900/40 text-sm font-semibold transition-all ${sub === id ? "bg-[#3E9C93] text-white shadow" : "text-[#3F4A54] dark:text-[#AEB8BF]"}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {sub === "negozi" && <StoresManager stores={stores} reload={reload} current={current} setCurrent={setCurrent} />}
      {sub === "ordini" && (
        stores.length === 0
          ? <p data-testid="orders-need-store" className="text-center text-sm text-[#7E8A93] py-10">{tri("Crea prima un negozio nella scheda «Negozi».", "Erstelle zuerst eine Filiale im Tab „Filialen“.", "Create a store first in the “Stores” tab.")}</p>
          : <OrdersManager store={current} stores={stores} />
      )}
      {sub === "turni" && (
        stores.length === 0
          ? <p data-testid="shifts-need-store" className="text-center text-sm text-[#7E8A93] py-10">{tri("Crea prima un negozio nella scheda «Negozi».", "Erstelle zuerst eine Filiale im Tab „Filialen“.", "Create a store first in the “Stores” tab.")}</p>
          : <ShiftsManager store={current} storeName={(currentStore || {}).name || tri("Negozio", "Filiale", "Store")} />
      )}
    </div>
  );
}
