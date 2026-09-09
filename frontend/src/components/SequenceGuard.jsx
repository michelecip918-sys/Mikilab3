import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Play, Check, ListOrdered, X } from "lucide-react";
import { shiftStateApi, sequenceApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const PUB = process.env.PUBLIC_URL;

// Mike Mix Sequence Guard: mostra la coda dei lotti in ordine e BLOCCA l'avvio
// di un lotto fuori sequenza, indicando quale deve partire prima.
export default function SequenceGuard() {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [batches, setBatches] = useState([]);
  const [block, setBlock] = useState(null);

  const load = useCallback(async () => {
    const s = await shiftStateApi.get();
    setBatches(s.batches || []);
  }, []);

  useEffect(() => { load(); const id = setInterval(load, 25000); return () => clearInterval(id); }, [load]);

  const start = async (b) => {
    const r = await sequenceApi.start(String(b.id)).catch(() => null);
    if (!r) return;
    if (r.allowed === false) {
      setBlock(r);
      // DUAL-MODE FLOOR: shadow passivo. Nessuna voce, nessun pop-up bloccante:
      // il pulsante semplicemente non avvia; un cenno visivo indica il lotto giusto.
      return;
    }
    load();
  };

  const complete = async (b) => { await sequenceApi.complete(String(b.id)).catch(() => {}); load(); };

  if (!batches.length) return null;

  const chip = (st) => {
    const s = (st || "").toLowerCase();
    if (s === "in_corso") return { t: tri("in corso", "läuft", "in progress", "en curso", "en cours", "در حال انجام"), c: "#f59e0b" };
    if (["fatto", "done", "completato"].includes(s)) return { t: tri("fatto", "fertig", "done", "hecho", "fait", "انجام شد"), c: "#22c55e" };
    return { t: tri("in attesa", "wartet", "waiting", "en espera", "en attente", "در انتظار"), c: "#64748B" };
  };

  return (
    <div data-testid="sequence-guard" className="rounded-2xl bg-[#0b0f19] border border-[#1e293b] p-4">
      <p className="text-[11px] font-black uppercase tracking-widest text-[#14b8a6] flex items-center gap-1.5 mb-3">
        <ListOrdered className="w-4 h-4" /> {tri("Sequenza lotti · Mike Mix", "Chargen-Reihenfolge · Mike Mix", "Batch sequence · Mike Mix", "Secuencia de lotes · Mike Mix", "Séquence des lots · Mike Mix", "ترتیب دسته‌ها · Mike Mix")}
      </p>
      <div className="space-y-2">
        {batches.map((b, i) => {
          const c = chip(b.status);
          const done = ["fatto", "done", "completato"].includes((b.status || "").toLowerCase());
          const running = (b.status || "").toLowerCase() === "in_corso";
          return (
            <div key={b.id || i} data-testid={`sequence-batch-${b.id}`} className="flex items-center gap-2 rounded-xl bg-[#030712] border border-[#1e293b] p-2.5">
              <span className="w-6 h-6 rounded-full bg-[#0f172a] text-[#94A3B8] text-[11px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{b.recipe_name || b.recipe_id || "Lotto"}</p>
                <span className="text-[10px] font-bold" style={{ color: c.c }}>● {c.t}</span>
              </div>
              {done ? (
                <Check className="w-5 h-5 text-[#22c55e] shrink-0" />
              ) : running ? (
                <button data-testid={`sequence-complete-${b.id}`} onClick={() => complete(b)} className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#22c55e] text-[#030712] text-xs font-black active:scale-95 transition-transform">
                  <Check className="w-3.5 h-3.5" /> {tri("Fatto", "Fertig", "Done", "Hecho", "Fait", "انجام شد")}
                </button>
              ) : (
                <button data-testid={`sequence-start-${b.id}`} onClick={() => start(b)} className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 text-[#030712] text-xs font-black active:scale-95 transition-transform">
                  <Play className="w-3.5 h-3.5" /> {tri("Avvia", "Start", "Start", "Iniciar", "Démarrer", "شروع")}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {block && (
        <div data-testid="sequence-block-banner" className="mt-3 rounded-xl border border-[#f59e0b]/50 bg-[#f59e0b12] p-2.5 flex items-center gap-2 animate-fadeIn">
          <img src={`${PUB}/avatar_bigmix.jpg`} alt="Mike Mix" className="w-8 h-8 rounded-full object-cover border border-[#f59e0b]" />
          <p className="text-[12px] text-white flex-1">
            {tri("Prima tocca", "Zuerst", "Start first", "Primero", "D'abord", "اول")}: <b className="text-amber-400">{block.expected?.name}</b>
          </p>
          <button data-testid="sequence-block-close" onClick={() => setBlock(null)} className="text-[#64748B] hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}
