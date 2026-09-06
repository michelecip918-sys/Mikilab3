import { useState, useRef } from "react";
import { Camera, Loader2, CheckCircle2, Snowflake } from "lucide-react";
import { antifoolApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Cross-check con FOTO sul Floor (Letz_Passive · solo visivo): l'operatore scatta la
// foto del task completato → Claude Vision valida la coerenza → conferma o congela.
export default function FloorCrossCheck({ task = "Produzione" }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);
  const inputRef = useRef(null);

  const onPhoto = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = async () => {
      setBusy(true); setRes(null);
      try {
        const out = await antifoolApi.crossCheck({ task, declared_deduction_g: 0, silo_before_g: 0, silo_after_g: 0, photo_base64: String(r.result || "") });
        setRes(out);
      } catch { setRes({ ok: false, message: tri("Errore verifica", "Prüffehler", "Check error", "Error", "Erreur", "خطا") }); }
      finally { setBusy(false); }
    };
    r.readAsDataURL(file);
  };

  return (
    <div data-testid="floor-crosscheck" className="w-full rounded-2xl bg-[#0b0f19] border border-[#06b6d4]/40 p-4 space-y-3 text-left">
      <div className="flex items-center gap-2">
        <Camera className="w-5 h-5 text-[#06b6d4]" />
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold text-[#06b6d4]">{tri("Verifica task con foto", "Aufgabe per Foto prüfen", "Verify task with photo", "Verifica con foto", "Vérifier par photo", "بررسی با عکس")}</h3>
          <p className="text-[11px] text-[#94A3B8]">{tri("Scatta la foto del lavoro finito: BakoMix la valida.", "Foto der fertigen Arbeit: BakoMix prüft.", "Snap the finished work: BakoMix validates.", "Foto del trabajo terminado: BakoMix valida.", "Photo du travail fini : BakoMix valide.", "عکس کار تمام‌شده: باکومیکس تأیید می‌کند.")}</p>
        </div>
      </div>
      <input ref={inputRef} data-testid="floor-cc-input" type="file" accept="image/*" capture="environment" onChange={onPhoto} className="hidden" />
      <button data-testid="floor-cc-btn" onClick={() => inputRef.current && inputRef.current.click()} disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#06b6d4]/15 border border-[#06b6d4]/50 text-[#06b6d4] font-black text-sm active:scale-95 transition-all disabled:opacity-40">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
        {busy ? tri("Analisi in corso…", "Analyse läuft…", "Analyzing…", "Analizando…", "Analyse…", "در حال تحلیل…") : tri("Scatta e verifica", "Foto & prüfen", "Snap & verify", "Foto y verificar", "Photo & vérifier", "عکس و بررسی")}
      </button>
      {res && (
        <div data-testid="floor-cc-result" className={`rounded-xl p-3 text-sm font-semibold flex items-start gap-2 ${res.ok ? "bg-[#14b8a6]/10 border border-[#14b8a6]/40 text-[#14b8a6]" : "bg-rose-500/10 border border-rose-500/50 text-rose-300"}`}>
          {res.ok ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <Snowflake className="w-4 h-4 mt-0.5 shrink-0" />}
          <span>{res.message}</span>
        </div>
      )}
    </div>
  );
}
