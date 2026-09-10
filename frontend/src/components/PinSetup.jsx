import { useState, useEffect } from "react";
import { KeyRound, Check, Loader2, Globe } from "lucide-react";
import { toast } from "sonner";
import { setPinRemote } from "@/lib/pinLock";
import { productionPinApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Il CAPO sceglie il PIN UNICO (globale) di accesso alla Produzione (Floor di Sitor).
// È salvato sul server: tutti i dispositivi degli operai usano questo stesso PIN.
export default function PinSetup() {
  const { lang } = useLang();
  const tri = (...a) => mkTri(lang)(...a);
  const [val, setVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [gateVal, setGateVal] = useState("");
  const [gateSaving, setGateSaving] = useState(false);

  const loadStatus = () => { productionPinApi.status().then(setStatus).catch(() => setStatus(null)); };
  useEffect(() => { loadStatus(); }, []);

  const saveGate = async () => {
    if (gateVal.length !== 4) { toast.error(tri("Il PIN deve avere 4 cifre", "Der PIN muss 4 Ziffern haben", "The PIN must have 4 digits", "El PIN debe tener 4 dígitos", "Le PIN doit avoir 4 chiffres", "پین باید ۴ رقم باشد")); return; }
    setGateSaving(true);
    try {
      const { adminGateApi } = await import("@/lib/api");
      await adminGateApi.set(gateVal);
      try { localStorage.setItem("mikilab_admin_gate_ok", gateVal); } catch { /* */ }
      toast.success(tri("PIN d'accesso al sito aggiornato", "Zugangs-PIN aktualisiert", "Site access PIN updated", "PIN de acceso actualizado", "PIN d'accès mis à jour", "پین ورود سایت به‌روزرسانی شد"));
      setGateVal("");
    } catch (e) {
      toast.error(e?.response?.status === 403 ? tri("Solo il Capo può modificarlo", "Nur der Chef", "Only the Capo can change it", "Solo el Capo", "Seul le Capo", "فقط کاپو") : tri("Salvataggio non riuscito", "Fehlgeschlagen", "Save failed", "Error", "Échec", "ناموفق"));
    } finally { setGateSaving(false); }
  };

  const save = async () => {
    if (val.length !== 4) { toast.error(tri("Il PIN deve avere 4 cifre", "Der PIN muss 4 Ziffern haben", "The PIN must have 4 digits", "El PIN debe tener 4 dígitos", "Le PIN doit avoir 4 chiffres", "پین باید ۴ رقم باشد")); return; }
    setSaving(true);
    try {
      await setPinRemote(val);
      toast.success(tri("PIN di produzione aggiornato per tutti i dispositivi", "Produktions-PIN für alle Geräte aktualisiert", "Production PIN updated for all devices", "PIN de producción actualizado en todos los dispositivos", "PIN de production mis à jour sur tous les appareils", "پین تولید برای همه دستگاه‌ها به‌روزرسانی شد"));
      setVal("");
      loadStatus();
    } catch (e) {
      const code = e?.response?.status;
      if (code === 403) toast.error(tri("Solo il Capo può modificare il PIN", "Nur der Chef darf den PIN ändern", "Only the Capo can change the PIN", "Solo el Capo puede cambiar el PIN", "Seul le Capo peut changer le PIN", "فقط کاپو می‌تواند پین را تغییر دهد"));
      else toast.error(tri("Salvataggio non riuscito", "Speichern fehlgeschlagen", "Save failed", "Error al guardar", "Échec de l'enregistrement", "ذخیره ناموفق بود"));
    } finally { setSaving(false); }
  };

  return (
    <div data-testid="pin-setup" className="p-4 rounded-xl bg-[#0f172a]/80 border border-[#334155]">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#D95200] flex items-center gap-2 mb-2">
        <KeyRound className="w-4 h-4" /> {tri("PIN Produzione (unico, scelto dal Capo)", "Produktions-PIN (einer, vom Chef)", "Production PIN (single, set by the Capo)", "PIN de producción (único, del Capo)", "PIN de production (unique, par le Capo)", "پین تولید (یکتا، توسط کاپو)")}
      </h3>
      <p className="text-[11px] text-[#64748B] mb-1 flex items-center gap-1.5">
        <Globe className="w-3.5 h-3.5 text-[#D95200]" />
        {tri("PIN unico per tutti i dispositivi. Con questo gli operai entrano nel Floor Mode a mani libere.",
             "Ein PIN für alle Geräte. Damit betreten die Mitarbeiter den Floor-Modus freihändig.",
             "One PIN for all devices. Workers use it to enter hands-free Floor Mode.",
             "Un PIN para todos los dispositivos. Los operarios entran en modo Floor manos libres.",
             "Un seul PIN pour tous les appareils. Les ouvriers entrent en mode Floor mains libres.",
             "یک پین برای همه دستگاه‌ها. کارگران با آن وارد حالت فلور می‌شوند.")}
      </p>
      <p className="text-[11px] text-[#64748B] mb-3">
        {status?.is_set
          ? tri("Stato: PIN impostato sul server ✓", "Status: PIN am Server gesetzt ✓", "Status: PIN set on the server ✓", "Estado: PIN configurado en el servidor ✓", "État : PIN défini sur le serveur ✓", "وضعیت: پین روی سرور تنظیم شده ✓")
          : tri("Stato: nessun PIN sul server — è attivo il default 1985", "Status: kein Server-PIN — Standard 1985 aktiv", "Status: no server PIN — default 1985 active", "Estado: sin PIN en el servidor — activo 1985", "État : aucun PIN serveur — défaut 1985 actif", "وضعیت: پینی روی سرور نیست — پیش‌فرض ۱۹۸۵")}
      </p>
      <div className="flex gap-2">
        <input
          data-testid="pin-setup-input"
          value={val}
          onChange={(e) => setVal(e.target.value.replace(/\D/g, "").slice(0, 4))}
          inputMode="numeric"
          maxLength={4}
          placeholder={tri("Nuovo PIN (4 cifre)", "Neuer PIN (4 Ziffern)", "New PIN (4 digits)", "Nuevo PIN (4 dígitos)", "Nouveau PIN (4 chiffres)", "پین جدید (۴ رقم)")}
          className="flex-1 bg-[#030712] border border-[#334155] rounded-lg px-3 py-2 text-sm tracking-[0.4em] text-white placeholder:tracking-normal placeholder:text-[#475569] focus:border-[#D95200] outline-none"
        />
        <button data-testid="pin-setup-save" onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D95200] text-[#030712] font-bold text-xs active:scale-95 transition-all disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {tri("Salva", "Speichern", "Save", "Guardar", "Enregistrer", "ذخیره")}
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-[#334155]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#f59e0b] flex items-center gap-2 mb-1">
          <KeyRound className="w-4 h-4" /> {tri("PIN d'accesso al SITO (solo tu)", "Zugangs-PIN zur SEITE (nur du)", "SITE access PIN (only you)", "PIN de acceso al SITIO (solo tú)", "PIN d'accès au SITE (toi seul)", "پین ورود سایت (فقط تو)")}
        </h3>
        <p className="text-[11px] text-[#64748B] mb-2">
          {tri("Il cancello d'ingresso al sito. Cambialo quando vuoi: solo chi conosce questo PIN può entrare, e la verifica avviene sul server.",
               "Das Eingangstor der Seite. Ändere es jederzeit: nur wer diesen PIN kennt, kommt rein; die Prüfung erfolgt am Server.",
               "The site's entry gate. Change it anytime: only who knows this PIN can enter, verified on the server.",
               "La puerta de entrada del sitio. Cámbialo cuando quieras: solo quien conoce este PIN entra, verificado en el servidor.",
               "La porte d'entrée du site. Change-le quand tu veux : seul qui connaît ce PIN entre, vérifié côté serveur.",
               "دروازه ورود سایت. هر وقت خواستی عوضش کن: فقط دارنده این پین وارد می‌شود، بررسی سمت سرور.")}
        </p>
        <div className="flex gap-2">
          <input data-testid="admin-gate-input" value={gateVal} onChange={(e) => setGateVal(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" maxLength={4}
            placeholder={tri("Nuovo PIN sito (4 cifre)", "Neuer Seiten-PIN", "New site PIN (4 digits)", "Nuevo PIN sitio", "Nouveau PIN site", "پین جدید سایت")}
            className="flex-1 bg-[#030712] border border-[#334155] rounded-lg px-3 py-2 text-sm tracking-[0.4em] text-white placeholder:tracking-normal placeholder:text-[#475569] focus:border-[#f59e0b] outline-none" />
          <button data-testid="admin-gate-save" onClick={saveGate} disabled={gateSaving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#f59e0b] text-[#030712] font-bold text-xs active:scale-95 transition-all disabled:opacity-50">
            {gateSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {tri("Salva", "Speichern", "Save", "Guardar", "Enregistrer", "ذخیره")}
          </button>
        </div>
      </div>
    </div>
  );
}
