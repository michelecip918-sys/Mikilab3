import { useState } from "react";
import { complianceApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { LogIn, LogOut, Coffee } from "lucide-react";

// Timbratura tracciabile al singolo: l'operatore digita il PROPRIO PIN personale.
// Il backend risolve il nome (ArbZG, catena hash) e registra chi entra/esce.
export default function OperatorClock() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState(null);

  const clock = async (action) => {
    if (pin.length !== 4) return;
    const r = await complianceApi.clock("", action, pin);
    if (r && r.ok) {
      const who = r.worker || tri("operatore", "Bediener", "operator", "operario", "opérateur", "اپراتور");
      const act = { in: tri("Entrata", "Kommt", "Clock-in", "Entrada", "Entrée", "ورود"), out: tri("Uscita", "Geht", "Clock-out", "Salida", "Sortie", "خروج"), break_start: tri("Pausa", "Pause", "Break", "Pausa", "Pause", "استراحت"), break_end: tri("Rientro", "Zurück", "Back", "Vuelta", "Retour", "بازگشت") }[action];
      setMsg({ ok: true, text: `${act} · ${who} ✓` });
      setPin("");
    } else {
      setMsg({ ok: false, text: tri("PIN operatore non valido.", "Ungültiger Bediener-PIN.", "Invalid operator PIN.", "PIN de operario no válido.", "PIN opérateur invalide.", "پین اپراتور نامعتبر.") });
    }
    setTimeout(() => setMsg(null), 3500);
  };

  return (
    <div data-testid="operator-clock" className="w-full holo-panel p-4 mb-4">
      <span className="holo-scan-top" />
      <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-[#00F0FF]/80 mb-2">{tri("Timbratura personale (PIN)", "Persönliche Stempelung (PIN)", "Personal clock-in (PIN)", "Fichaje personal (PIN)", "Pointage personnel (PIN)", "ثبت شخصی (پین)")}</p>
      <div className="flex flex-wrap items-center gap-2">
        <input data-testid="clock-pin-input" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" placeholder="PIN" className="w-24 bg-[#0C1019] border border-[#00F0FF]/30 rounded-lg px-3 py-2 text-sm text-white text-center tracking-[0.3em] focus:border-[#00F0FF] outline-none" />
        <button data-testid="clock-in-btn" onClick={() => clock("in")} disabled={pin.length !== 4} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#7DD3FC]/15 border border-[#7DD3FC]/50 text-[#7DD3FC] font-bold text-sm disabled:opacity-40 active:scale-95 transition-all"><LogIn className="w-4 h-4" /> {tri("Entrata", "Kommt", "In", "Entrada", "Entrée", "ورود")}</button>
        <button data-testid="clock-break-btn" onClick={() => clock("break_start")} disabled={pin.length !== 4} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FFB800]/15 border border-[#FFB800]/50 text-[#FFB800] font-bold text-sm disabled:opacity-40 active:scale-95 transition-all"><Coffee className="w-4 h-4" /> {tri("Pausa", "Pause", "Break", "Pausa", "Pause", "استراحت")}</button>
        <button data-testid="clock-out-btn" onClick={() => clock("out")} disabled={pin.length !== 4} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0C1019] border border-[#1e293b] text-[#94a3b8] font-bold text-sm disabled:opacity-40 active:scale-95 transition-all"><LogOut className="w-4 h-4" /> {tri("Uscita", "Geht", "Out", "Salida", "Sortie", "خروج")}</button>
      </div>
      {msg && <p data-testid="clock-msg" className={`mt-2 text-sm font-bold ${msg.ok ? "text-[#7DD3FC]" : "text-[#f87171]"}`}>{msg.text}</p>}
    </div>
  );
}
