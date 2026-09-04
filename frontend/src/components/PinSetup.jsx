import { useState, useEffect } from "react";
import { KeyRound, Check, Loader2, Globe } from "lucide-react";
import { toast } from "sonner";
import { setPinRemote } from "@/lib/pinLock";
import { productionPinApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Il CAPO sceglie il PIN UNICO (globale) di accesso alla Produzione (Floor di Mohamed).
// È salvato sul server: tutti i dispositivi degli operai usano questo stesso PIN.
export default function PinSetup() {
  const { lang } = useLang();
  const tri = (...a) => mkTri(lang)(...a);
  const [val, setVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const loadStatus = () => { productionPinApi.status().then(setStatus).catch(() => setStatus(null)); };
  useEffect(() => { loadStatus(); }, []);

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
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#14b8a6] flex items-center gap-2 mb-2">
        <KeyRound className="w-4 h-4" /> {tri("PIN Produzione (unico, scelto dal Capo)", "Produktions-PIN (einer, vom Chef)", "Production PIN (single, set by the Capo)", "PIN de producción (único, del Capo)", "PIN de production (unique, par le Capo)", "پین تولید (یکتا، توسط کاپو)")}
      </h3>
      <p className="text-[11px] text-[#64748B] mb-1 flex items-center gap-1.5">
        <Globe className="w-3.5 h-3.5 text-[#14b8a6]" />
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
          className="flex-1 bg-[#030712] border border-[#334155] rounded-lg px-3 py-2 text-sm tracking-[0.4em] text-white placeholder:tracking-normal placeholder:text-[#475569] focus:border-[#14b8a6] outline-none"
        />
        <button data-testid="pin-setup-save" onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#14b8a6] text-[#030712] font-bold text-xs active:scale-95 transition-all disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {tri("Salva", "Speichern", "Save", "Guardar", "Enregistrer", "ذخیره")}
        </button>
      </div>
    </div>
  );
}
