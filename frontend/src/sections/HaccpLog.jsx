import { useState, useEffect, useRef, useCallback } from "react";
import { ScanLine, Camera, X, Save, Trash2, ShieldCheck, LogIn, Thermometer, AlertTriangle, Clock } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { haccpApi } from "@/lib/api";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";

// FASE 3 — Registro HACCP materie prime con scansione fotocamera (Barcode/QR).
// Usa BarcodeDetector (Chrome) quando disponibile; fallback all'inserimento manuale.

export default function HaccpLog() {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const { user, setAuthOpen } = useAuth();

  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({ material: "", code: "", lot: "", expiry: "", supplier: "", temp_c: "", qty: "", note: "" });
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  const load = useCallback(async () => { if (user) setLogs(await haccpApi.list()); }, [user]);
  useEffect(() => { load(); }, [load]);

  const stopScan = useCallback(() => {
    setScanning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
  }, []);
  useEffect(() => () => stopScan(), [stopScan]);

  const startScan = async () => {
    if (!("BarcodeDetector" in window)) {
      toast.message(tri("Scanner non supportato: inserisci il codice a mano", "Scanner nicht unterstützt: Code manuell eingeben", "Scanner not supported: enter the code manually"));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setScanning(true);
      // wait a tick for the <video> to mount
      setTimeout(async () => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        // eslint-disable-next-line no-undef
        const detector = new BarcodeDetector();
        const tick = async () => {
          if (!videoRef.current || !streamRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes && codes.length) {
              const val = codes[0].rawValue;
              setForm((f) => ({ ...f, code: val }));
              toast.success(tri("Codice acquisito", "Code erfasst", "Code captured") + ": " + val);
              stopScan();
              return;
            }
          } catch { /* frame not ready */ }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      }, 200);
    } catch { toast.error(tri("Fotocamera non disponibile", "Kamera nicht verfügbar", "Camera unavailable")); }
  };

  const save = async () => {
    if (!user) { setAuthOpen(true); return; }
    if (!form.material.trim()) { toast.error(tri("Inserisci la materia prima", "Rohstoff angeben", "Enter the raw material")); return; }
    setSaving(true);
    try {
      const created = await haccpApi.create({
        material: form.material.trim(), code: form.code.trim(), lot: form.lot.trim(),
        expiry: form.expiry.trim(), supplier: form.supplier.trim(),
        temp_c: form.temp_c !== "" ? Number(form.temp_c) : null, qty: form.qty.trim(), note: form.note.trim(),
      });
      setLogs((l) => [created, ...l]);
      setForm({ material: "", code: "", lot: "", expiry: "", supplier: "", temp_c: "", qty: "", note: "" });
      toast.success(tri("Registrato nell'HACCP", "Im HACCP erfasst", "Logged in HACCP"));
    } catch { toast.error(tri("Errore nel salvataggio", "Speichern fehlgeschlagen", "Save failed")); }
    setSaving(false);
  };

  const remove = async (id) => {
    try { await haccpApi.remove(id); setLogs((l) => l.filter((x) => x.id !== id)); }
    catch { toast.error(tri("Errore", "Fehler", "Error")); }
  };

  const inp = "w-full bg-[#0B0E14] dark:bg-[#18202E] border border-[#26324A] dark:border-[#26324A] rounded-2xl shadow-md border border-amber-900/40 px-3 py-2.5 outline-none text-[#2B303B] dark:text-[#e4eff8] focus:border-[#F26419]";

  // parsing scadenza (YYYY-MM-DD, DD/MM/YYYY, DD.MM.YYYY) → giorni residui (null se non parsabile)
  const daysToExpiry = (raw) => {
    if (!raw) return null;
    let d = null;
    let m;
    if ((m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw))) d = new Date(+m[1], +m[2] - 1, +m[3]);
    else if ((m = /^(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})/.exec(raw))) { const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]; d = new Date(y, +m[2] - 1, +m[1]); }
    if (!d || isNaN(d)) return null;
    const t0 = new Date(); t0.setHours(0, 0, 0, 0);
    return Math.round((d - t0) / 86400000);
  };
  const expBadge = (raw) => {
    const dd = daysToExpiry(raw);
    if (dd === null) return null;
    if (dd < 0) return { color: "#F26419", label: tri("Scaduto", "Abgelaufen", "Expired") };
    if (dd <= 7) return { color: "#E0A458", label: tri(`Scade tra ${dd}g`, `Läuft in ${dd}T ab`, `Expires in ${dd}d`) };
    return null;
  };
  const alerts = logs.map((l) => expBadge(l.expiry)).filter(Boolean).length;

  return (
    <div className="pb-40" data-testid="haccp">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#F26419] flex items-center justify-center"><ShieldCheck className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Registro HACCP", "HACCP-Register", "HACCP Log")}</h1>
          <p className="text-sm text-[#7E8A93]">{tri("Scansiona le materie prime prima di pesarle", "Rohstoffe vor dem Wiegen scannen", "Scan raw materials before weighing")}</p>
        </div>
      </div>

      {!user && (
        <button data-testid="haccp-login" onClick={() => setAuthOpen(true)} className="w-full flex items-center justify-center gap-2 bg-[#F26419] text-white font-semibold py-3 rounded-2xl mb-4">
          <LogIn className="w-5 h-5" /> {tri("Accedi per registrare l'HACCP", "Anmelden für HACCP", "Sign in to log HACCP")}
        </button>
      )}

      {scanning && (
        <div className="relative rounded-2xl overflow-hidden mb-4 border border-[#F26419]" data-testid="haccp-scanner">
          <video ref={videoRef} className="w-full h-56 object-cover bg-black" muted playsInline />
          <div className="absolute inset-0 border-[3px] border-white/60 m-10 rounded-2xl shadow-md border border-amber-900/40 pointer-events-none" />
          <button data-testid="haccp-scan-close" onClick={stopScan} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-2"><X className="w-4 h-4" /></button>
          <p className="absolute bottom-2 left-0 right-0 text-center text-white text-xs font-semibold">{tri("Inquadra il codice a barre / QR", "Barcode / QR anvisieren", "Aim at the barcode / QR")}</p>
        </div>
      )}

      <div className="bg-white dark:bg-[#18202E] border border-[#26324A] dark:border-[#26324A] rounded-2xl p-4 mb-4 space-y-3">
        <button data-testid="haccp-scan-btn" onClick={scanning ? stopScan : startScan} className="w-full flex items-center justify-center gap-2 bg-[#F26419] hover:bg-[#E8A838] text-white font-semibold py-3 rounded-2xl active:scale-98">
          {scanning ? <><X className="w-5 h-5" /> {tri("Chiudi scanner", "Scanner schließen", "Close scanner")}</> : <><Camera className="w-5 h-5" /> {tri("Scansiona codice", "Code scannen", "Scan code")}</>}
        </button>
        <input data-testid="haccp-material" value={form.material} onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))} placeholder={tri("Materia prima (es. Farina Tipo 0)", "Rohstoff (z. B. Mehl Type 550)", "Raw material (e.g. Flour T0)")} className={inp} />
        <div className="relative">
          <ScanLine className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7E8A93]" />
          <input data-testid="haccp-code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder={tri("Codice a barre / lotto scansionato", "Barcode / gescannter Code", "Barcode / scanned code")} className={inp + " pl-9 font-mono-data"} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input data-testid="haccp-lot" value={form.lot} onChange={(e) => setForm((f) => ({ ...f, lot: e.target.value }))} placeholder={tri("Lotto fornitore", "Lieferanten-Charge", "Supplier lot")} className={inp} />
          <input data-testid="haccp-expiry" type="date" value={form.expiry} onChange={(e) => setForm((f) => ({ ...f, expiry: e.target.value }))} title={tri("Scadenza", "Ablauf", "Expiry")} className={inp} />
          <input data-testid="haccp-supplier" value={form.supplier} onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))} placeholder={tri("Fornitore", "Lieferant", "Supplier")} className={inp} />
          <label className="flex items-center gap-1 bg-[#0B0E14] dark:bg-[#18202E] border border-[#26324A] dark:border-[#26324A] rounded-2xl shadow-md border border-amber-900/40 px-3">
            <Thermometer className="w-4 h-4 text-[#7E8A93]" />
            <input data-testid="haccp-temp" type="number" step="0.1" value={form.temp_c} onChange={(e) => setForm((f) => ({ ...f, temp_c: e.target.value }))} placeholder={tri("Temp. °C", "Temp. °C", "Temp °C")} className="w-full bg-transparent outline-none font-mono-data text-[#2B303B] dark:text-[#e4eff8]" />
          </label>
        </div>
        <button data-testid="haccp-save" onClick={save} disabled={saving} className="w-full flex items-center justify-center gap-2 bg-[#F26419] hover:bg-[#E8A838] disabled:opacity-50 text-white font-bold py-3 rounded-2xl active:scale-98"><Save className="w-5 h-5" /> {saving ? tri("Salvataggio…", "Speichern…", "Saving…") : tri("Registra nel log HACCP", "Im HACCP-Log erfassen", "Add to HACCP log")}</button>
      </div>

      {logs.length > 0 && (
        <div data-testid="haccp-list">
          {alerts > 0 && (
            <div data-testid="haccp-alert-banner" className="flex items-center gap-2 bg-[#F26419]/10 border border-[#F26419]/30 rounded-2xl shadow-md border border-amber-900/40 px-3 py-2 mb-2 text-[#F26419] text-sm font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {tri(`${alerts} materia/e in scadenza o scaduta/e`, `${alerts} Rohstoff(e) bald ablaufend/abgelaufen`, `${alerts} material(s) expiring or expired`)}
            </div>
          )}
          <p className="text-xs font-bold uppercase text-[#7E8A93] mb-2">{tri("Voci registrate", "Erfasste Einträge", "Logged entries")}</p>
          <div className="space-y-2">
            {logs.map((l) => {
              const eb = expBadge(l.expiry);
              return (
              <div key={l.id} data-testid={`haccp-item-${l.id}`} className="flex items-center justify-between bg-white dark:bg-[#18202E] border rounded-2xl shadow-md border border-amber-900/40 px-3 py-2" style={eb ? { borderColor: eb.color + "66" } : {}}>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8] truncate flex items-center gap-1.5">
                    {l.material}
                    {eb && <span data-testid={`haccp-expbadge-${l.id}`} className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: eb.color + "22", color: eb.color }}><Clock className="w-2.5 h-2.5" /> {eb.label}</span>}
                  </p>
                  <p className="text-[11px] text-[#7E8A93] font-mono-data truncate">{[l.code, l.lot ? `${tri("lotto", "Charge", "lot")} ${l.lot}` : "", l.expiry ? `${tri("scad.", "MHD", "exp.")} ${l.expiry}` : "", l.temp_c != null ? `${l.temp_c}°C` : ""].filter(Boolean).join(" · ")}</p>
                </div>
                <button data-testid={`haccp-remove-${l.id}`} onClick={() => remove(l.id)} className="text-[#7E8A93] hover:text-[#F26419] shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
