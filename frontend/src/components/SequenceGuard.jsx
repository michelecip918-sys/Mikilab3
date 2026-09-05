import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Play, Check, Lock, ListOrdered, X } from "lucide-react";
import { shiftStateApi, sequenceApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const PUB = process.env.PUBLIC_URL;

// BakoMix Sequence Guard: mostra la coda dei lotti in ordine e BLOCCA l'avvio
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
      const name = r.expected?.name || "";
      const msg = tri(
        `Fermo! Questo lotto è fuori sequenza. Prima deve partire ${name}.`,
        `Halt! Diese Charge ist außer der Reihe. Zuerst muss ${name} starten.`,
        `Stop! This batch is out of sequence. ${name} must start first.`,
        `¡Alto! Este lote está fuera de secuencia. Primero debe ir ${name}.`,
        `Stop ! Ce lot est hors séquence. ${name} doit démarrer d'abord.`,
        `ایست! این دسته خارج از ترتیب است. اول باید ${name} شروع شود.`);
      try { playTTS(msg, { lang, voice: "bakemix" }); } catch { /* */ }
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
        <ListOrdered className="w-4 h-4" /> {tri("Sequenza lotti · BakoMix", "Chargen-Reihenfolge · BakoMix", "Batch sequence · BakoMix", "Secuencia de lotes · BakoMix", "Séquence des lots · BakoMix", "ترتیب دسته‌ها · BakoMix")}
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
        <div data-testid="sequence-block-modal" className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setBlock(null)}>
          <div className="max-w-sm w-full rounded-3xl bg-[#0b0f19] border-2 border-[#ef4444] shadow-2xl p-6 text-center animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center mb-3">
              <div className="relative">
                <span className="absolute inset-0 rounded-full bg-[#ef4444]/40 blur-xl" />
                <img src={`${PUB}/avatar_bigmix.jpg`} alt="BakoMix" className="relative w-16 h-16 rounded-full object-cover border-2 border-[#ef4444]" />
                <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#ef4444] border-2 border-[#0b0f19] flex items-center justify-center"><Lock className="w-3.5 h-3.5 text-white" /></span>
              </div>
            </div>
            <h3 className="text-lg font-black text-[#ef4444]">{tri("Lotto fuori sequenza", "Charge außer Reihe", "Batch out of sequence", "Lote fuera de secuencia", "Lot hors séquence", "دسته خارج از ترتیب")}</h3>
            <p className="text-sm text-white mt-2">
              {tri("Prima deve partire", "Zuerst muss starten", "This must start first", "Primero debe ir", "Doit démarrer d'abord", "اول باید شروع شود")}: <b className="text-amber-400">{block.expected?.name}</b>
            </p>
            <div className="mt-5 flex flex-col gap-2">
              {block.expected && (
                <button data-testid="sequence-start-expected" onClick={() => { const b = batches.find((x) => String(x.id) === String(block.expected.id)); setBlock(null); if (b) start(b); }} className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 text-[#030712] font-black text-sm active:scale-95 transition-transform">
                  <Play className="w-4 h-4" /> {tri("Avvia il lotto giusto", "Richtige Charge starten", "Start the right batch", "Iniciar el lote correcto", "Démarrer le bon lot", "دستهٔ درست را شروع کن")}
                </button>
              )}
              <button data-testid="sequence-block-close" onClick={() => setBlock(null)} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#030712] border border-[#1e293b] text-[#94A3B8] font-bold text-sm">
                <X className="w-4 h-4" /> {tri("Chiudi", "Schließen", "Close", "Cerrar", "Fermer", "بستن")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
