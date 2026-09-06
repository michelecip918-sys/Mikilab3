import { useEffect, useState } from "react";
import { operatorPinsApi, accessLogApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { Trash2, UserPlus, ShieldCheck, ShieldAlert } from "lucide-react";

// Zona Capo: gestione PIN personali operatore + Registro Accessi (tentativi PIN).
export default function AdminSecurity() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [ops, setOps] = useState([]);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [log, setLog] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = () => {
    operatorPinsApi.list().then((d) => setOps(d.operators || [])).catch(() => { /* */ });
    accessLogApi.list(80).then((d) => setLog(d.entries || [])).catch(() => { /* */ });
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim() || pin.length !== 4) return;
    setBusy(true);
    try { await operatorPinsApi.set(name.trim(), pin); setName(""); setPin(""); load(); } catch (e) { /* */ }
    setBusy(false);
  };
  const del = async (n) => { try { await operatorPinsApi.remove(n); load(); } catch (e) { /* */ } };

  const kindLabel = (k) => ({ master: tri("Master", "Master", "Master", "Master", "Master", "مستر"), production: tri("Produzione", "Produktion", "Production", "Producción", "Production", "تولید"), operator: tri("Operatore", "Bediener", "Operator", "Operario", "Opérateur", "اپراتور") }[k] || k);

  return (
    <div className="space-y-6" data-testid="admin-security">
      {/* PIN personali operatore */}
      <div>
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-[#5E8CA8] mb-2">{tri("PIN personali operatore", "Persönliche Bediener-PINs", "Personal operator PINs", "PIN personales de operario", "PIN personnels opérateur", "پین‌های شخصی اپراتور")}</p>
        <div className="flex flex-wrap gap-2 items-center mb-3">
          <input data-testid="op-name-input" value={name} onChange={(e) => setName(e.target.value)} placeholder={tri("Nome operatore", "Bedienername", "Operator name", "Nombre operario", "Nom opérateur", "نام اپراتور")}
            className="flex-1 min-w-[140px] bg-[#0C1019] border border-[#5E8CA8]/30 rounded-lg px-3 py-2 text-sm text-white focus:border-[#5E8CA8] outline-none" />
          <input data-testid="op-pin-input" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" placeholder="PIN (4)"
            className="w-24 bg-[#0C1019] border border-[#5E8CA8]/30 rounded-lg px-3 py-2 text-sm text-white text-center tracking-[0.3em] focus:border-[#5E8CA8] outline-none" />
          <button data-testid="op-add-btn" onClick={add} disabled={busy || !name.trim() || pin.length !== 4}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#5E8CA8]/20 border border-[#5E8CA8]/50 text-[#9fc3dc] font-bold text-sm disabled:opacity-40 active:scale-95 transition-all">
            <UserPlus className="w-4 h-4" /> {tri("Aggiungi", "Hinzufügen", "Add", "Añadir", "Ajouter", "افزودن")}
          </button>
        </div>
        <div className="space-y-1.5">
          {ops.length === 0 && <p className="text-xs text-[#64748b]">{tri("Nessun PIN operatore. Aggiungine uno per timbrature tracciabili al singolo.", "Noch keine Bediener-PINs.", "No operator PINs yet — add one for per-person clock-ins.", "Aún no hay PIN de operario.", "Aucun PIN opérateur.", "هنوز پینی نیست.")}</p>}
          {ops.map((o) => (
            <div key={o.name_key || o.name} data-testid={`op-row-${o.name_key || o.name}`} className="flex items-center justify-between bg-[#0C1019]/60 border border-[#1e293b] rounded-lg px-3 py-2">
              <span className="text-sm font-semibold text-white">{o.name}</span>
              <button data-testid={`op-del-${o.name_key || o.name}`} onClick={() => del(o.name)} className="text-[#f87171]/80 hover:text-[#f87171] active:scale-90 transition-all"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Registro accessi */}
      <div>
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-[#5E8CA8] mb-2">{tri("Registro accessi (ultimi tentativi PIN)", "Zugriffsprotokoll", "Access log (recent PIN attempts)", "Registro de accesos", "Journal d'accès", "گزارش دسترسی")}</p>
        <div className="max-h-64 overflow-auto rounded-lg border border-[#1e293b] divide-y divide-[#1e293b]">
          {log.length === 0 && <p className="text-xs text-[#64748b] p-3">{tri("Nessun accesso registrato.", "Keine Zugriffe.", "No accesses logged.", "Sin accesos.", "Aucun accès.", "دسترسی ثبت نشده.")}</p>}
          {log.map((e, i) => (
            <div key={i} data-testid={`log-row-${i}`} className="flex items-center gap-2 px-3 py-1.5 text-xs">
              {e.ok ? <ShieldCheck className="w-3.5 h-3.5 text-[#7DD3FC] shrink-0" /> : <ShieldAlert className="w-3.5 h-3.5 text-[#FFB800] shrink-0" />}
              <span className="font-bold w-20 shrink-0 text-[#9fb3c4]">{kindLabel(e.kind)}</span>
              <span className="flex-1 truncate text-white">{e.name || (e.ok ? tri("OK", "OK", "OK", "OK", "OK", "OK") : tri("PIN errato", "Falscher PIN", "Wrong PIN", "PIN incorrecto", "PIN incorrect", "پین اشتباه"))}</span>
              <span className="text-[#64748b] shrink-0">{(e.at || "").slice(0, 16).replace("T", " ")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
