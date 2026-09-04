import { useState } from "react";
import { KeyRound, Check } from "lucide-react";
import { toast } from "sonner";
import { setPin, getPin } from "@/lib/pinLock";

// Il CAPO sceglie il PIN a 4 cifre per l'accesso rapido alla Produzione (Floor).
export default function PinSetup() {
  const [val, setVal] = useState("");
  const current = getPin();

  const save = () => {
    if (setPin(val)) {
      toast.success("PIN di produzione aggiornato");
      setVal("");
    } else {
      toast.error("Il PIN deve avere 4 cifre");
    }
  };

  return (
    <div data-testid="pin-setup" className="p-4 rounded-xl bg-[#0f172a]/80 border border-[#334155]">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#14b8a6] flex items-center gap-2 mb-2">
        <KeyRound className="w-4 h-4" /> PIN Produzione (scelto dal Capo)
      </h3>
      <p className="text-[11px] text-[#64748B] mb-3">Con questo PIN gli operai accedono al Floor Mode a mani libere. Attuale: <strong className="text-[#94A3B8]">{current.replace(/./g, "•")}</strong></p>
      <div className="flex gap-2">
        <input
          data-testid="pin-setup-input"
          value={val}
          onChange={(e) => setVal(e.target.value.replace(/\D/g, "").slice(0, 4))}
          inputMode="numeric"
          maxLength={4}
          placeholder="Nuovo PIN (4 cifre)"
          className="flex-1 bg-[#030712] border border-[#334155] rounded-lg px-3 py-2 text-sm tracking-[0.4em] text-white placeholder:tracking-normal placeholder:text-[#475569] focus:border-[#14b8a6] outline-none"
        />
        <button data-testid="pin-setup-save" onClick={save} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#14b8a6] text-[#030712] font-bold text-xs active:scale-95 transition-all">
          <Check className="w-4 h-4" /> Salva
        </button>
      </div>
    </div>
  );
}
