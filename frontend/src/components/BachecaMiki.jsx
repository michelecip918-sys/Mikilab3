import { useEffect, useState } from "react";
import { Megaphone, Volume2, Square, Pencil, Send, X } from "lucide-react";
import { boardApi } from "@/lib/api";
import { playTTS, stopTTS } from "@/lib/tts";
import { playSuccessChime } from "@/lib/successSound";
import { useAuth } from "@/auth/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { toast } from "sonner";

// La Bacheca di Miki (modulo 52): messaggio vocale/testuale quotidiano del Capo per il team.
export default function BachecaMiki() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [board, setBoard] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => setBoard(await boardApi.get());
  useEffect(() => { load(); }, []);

  const msg = board?.message?.trim();
  const speak = () => {
    if (!msg) return;
    if (speaking) { stopTTS(); setSpeaking(false); return; }
    playTTS(msg, { lang, onStart: () => setSpeaking(true), onEnded: () => setSpeaking(false) });
  };
  const publish = async () => {
    if (!draft.trim()) return;
    setSending(true);
    try {
      await boardApi.set(draft.trim());
      setEditing(false); setDraft("");
      await load();
      playSuccessChime();
      toast.success("Messaggio pubblicato sulla Bacheca del team.");
    } catch (e) {
      toast.error(e?.response?.status === 401 ? "Accedi come Capo per pubblicare." : "Pubblicazione non riuscita.");
    } finally { setSending(false); }
  };

  return (
    <div data-testid="bacheca-miki" className="rounded-3xl border border-[#E0A106]/30 bg-gradient-to-br from-slate-900 to-slate-950 p-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-[#E0A106]/60 shrink-0">
          <img src={`${process.env.PUBLIC_URL}/avatar_miki.jpg`} alt="Miki" className="w-full h-full object-cover object-top" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-bold text-[#E0A106] flex items-center gap-1.5"><Megaphone className="w-4 h-4" /> La Bacheca di Miki</p>
          <p className="text-[11px] text-slate-500">{board?.date ? `Messaggio del ${board.date} · ${board.author || "Capo"}` : "Messaggio quotidiano del Capo per il team"}</p>
        </div>
        {user && !editing && (
          <button data-testid="bacheca-edit" onClick={() => { setDraft(msg || ""); setEditing(true); }} className="w-9 h-9 rounded-full bg-slate-800 text-[#E0A106] flex items-center justify-center shrink-0"><Pencil className="w-4 h-4" /></button>
        )}
      </div>

      {editing ? (
        <div className="mt-3 space-y-2">
          <textarea data-testid="bacheca-input" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={400} rows={3}
            placeholder="Scrivi il messaggio di oggi per la squadra…"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:border-[#E0A106] outline-none" />
          <div className="flex items-center gap-2">
            <button data-testid="bacheca-publish" onClick={publish} disabled={sending || !draft.trim()} className="inline-flex items-center gap-1.5 bg-[#E0A106] disabled:opacity-50 text-slate-900 font-bold text-xs px-3 py-2 rounded-lg"><Send className="w-4 h-4" /> Pubblica</button>
            <button data-testid="bacheca-cancel" onClick={() => setEditing(false)} className="inline-flex items-center gap-1.5 bg-slate-800 text-slate-300 text-xs px-3 py-2 rounded-lg"><X className="w-4 h-4" /> Annulla</button>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          {msg ? (
            <>
              <p className="text-[14px] text-slate-200 leading-relaxed italic">“{msg}”</p>
              <button data-testid="bacheca-listen" onClick={speak} className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#E0A106]/15 border border-[#E0A106]/40 text-[#E0A106] px-3 py-1.5 text-xs font-bold">
                {speaking ? <><Square className="w-3.5 h-3.5" /> Ferma</> : <><Volume2 className="w-3.5 h-3.5" /> Ascolta il Capo</>}
              </button>
            </>
          ) : (
            <p className="text-[13px] text-slate-500">Nessun messaggio per oggi.{user ? " Tocca la matita per lasciarne uno." : ""}</p>
          )}
        </div>
      )}
    </div>
  );
}
