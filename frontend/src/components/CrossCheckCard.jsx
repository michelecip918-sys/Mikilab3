import { useState } from "react";
import { ScanEye, Loader2, CheckCircle2, Snowflake } from "lucide-react";
import { antifoolApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Cross-check ottico-telemetrico (anti-fooling avanzato): confronta la conferma
// dichiarata con il calo REALE del silo/bilancia. Mismatch → congela (fake).
export default function CrossCheckCard() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [declared, setDeclared] = useState("");
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);
  const [photo, setPhoto] = useState("");

  const onPhoto = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setPhoto(String(r.result || ""));
    r.readAsDataURL(f);
  };

  const run = async () => {
    setBusy(true); setRes(null);
    try {
      const r = await antifoolApi.crossCheck({
        task: "Produzione",
        declared_deduction_g: Number(declared) || 0,
        silo_before_g: Number(before) || 0,
        silo_after_g: Number(after) || 0,
        photo_base64: photo || "",
      });
      setRes(r);
    } catch { setRes({ ok: false, message: "Errore" }); }
    finally { setBusy(false); }
  };

  const inp = "w-full bg-[#030712] border border-[#1e293b] rounded-lg px-2.5 py-2 text-sm text-white outline-none focus:border-[#06b6d4]";
  return (
    <div data-testid="crosscheck-card" className="rounded-2xl border border-[#06b6d4]/40 bg-[#06b6d40d] p-4 space-y-3">
      <p className="text-xs font-black text-[#06b6d4] flex items-center gap-1.5"><ScanEye className="w-4 h-4" /> {tri("Cross-check ottico-telemetrico", "Optisch-telemetrischer Abgleich", "Optical-telemetric cross-check", "Cotejo óptico-telemétrico", "Recoupement optique-télémétrique", "بررسی متقاطع نوری-تله‌متری")}</p>
      <div className="grid grid-cols-3 gap-2">
        <div><label className="text-[10px] text-[#64748B]">{tri("Dichiarato g", "Deklariert g", "Declared g", "Declarado g", "Déclaré g", "اعلام‌شده g")}</label><input data-testid="cc-declared" className={inp} value={declared} onChange={(e) => setDeclared(e.target.value)} inputMode="numeric" /></div>
        <div><label className="text-[10px] text-[#64748B]">{tri("Silo prima g", "Silo vorher g", "Silo before g", "Silo antes g", "Silo avant g", "سیلو قبل g")}</label><input data-testid="cc-before" className={inp} value={before} onChange={(e) => setBefore(e.target.value)} inputMode="numeric" /></div>
        <div><label className="text-[10px] text-[#64748B]">{tri("Silo dopo g", "Silo nachher g", "Silo after g", "Silo después g", "Silo après g", "سیلو بعد g")}</label><input data-testid="cc-after" className={inp} value={after} onChange={(e) => setAfter(e.target.value)} inputMode="numeric" /></div>
      </div>
      <label data-testid="cc-photo-label" className="flex items-center gap-2 text-[11px] text-[#64748B] cursor-pointer">
        <input data-testid="cc-photo" type="file" accept="image/*" capture="environment" onChange={onPhoto} className="hidden" />
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0f172a] border border-[#1e293b] text-[#06b6d4] font-semibold">📷 {tri("Foto verifica (opzionale)", "Prüffoto (optional)", "Verification photo (optional)", "Foto (opcional)", "Photo (option)", "عکس (اختیاری)")}</span>
        {photo && <span className="text-[#D95200]">✓</span>}
      </label>
      <button data-testid="cc-run" onClick={run} disabled={busy} className="w-full py-2.5 rounded-xl bg-[#06b6d4] text-[#030712] font-black text-sm active:scale-95 transition-all disabled:opacity-40 inline-flex items-center justify-center gap-2">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanEye className="w-4 h-4" />} {tri("Verifica conferma", "Bestätigung prüfen", "Verify completion", "Verificar", "Vérifier", "بررسی")}
      </button>
      {res && (
        <div data-testid="cc-result" className={`rounded-xl p-3 text-sm font-semibold flex items-start gap-2 ${res.ok ? "bg-[#D95200]/10 border border-[#D95200]/40 text-[#D95200]" : "bg-rose-500/10 border border-rose-500/50 text-rose-300"}`}>
          {res.ok ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <Snowflake className="w-4 h-4 mt-0.5 shrink-0" />}
          <span>{res.message}</span>
        </div>
      )}
    </div>
  );
}
