import { useEffect, useState } from "react";
import { ChevronLeft, MapPin, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { api, siteSettingsApi } from "@/lib/api";

// V74 — Indirizzo dell'Impressum e della privacy, modificabile dall'admin (senza nuovo deploy).
// Il testo va nell'Impressum (§ 5 DDG) e nell'informativa privacy, in italiano, tedesco e inglese.
export default function ImpressumAdmin({ onBack }) {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    siteSettingsApi.get()
      .then((s) => { if (alive && s && typeof s.impressum_address === "string") setText(s.impressum_address); })
      .catch(() => { /* */ })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const save = async (value) => {
    setBusy(true);
    try {
      const r = await api.put(`/admin/site-settings`, { impressum_address: value });
      const saved = (r && r.data && r.data.impressum_address) || "";
      setText(saved);
      toast.success(saved
        ? tri("Indirizzo salvato: è già online in Impressum e Privacy.", "Adresse gespeichert: bereits online in Impressum und Datenschutz.", "Address saved: already live in Impressum and Privacy.")
        : tri("Indirizzo predefinito ripristinato.", "Standardadresse wiederhergestellt.", "Default address restored."));
    } catch {
      toast.error(tri("Non sono riuscito a salvare.", "Speichern nicht möglich.", "Could not save."));
    } finally {
      setBusy(false);
    }
  };

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  return (
    <div className="max-w-md mx-auto" data-testid="impressum-admin-page">
      <button data-testid="impadmin-back" onClick={onBack} className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground mb-4 active:scale-95 transition-transform">
        <ChevronLeft className="w-4 h-4" /> {tri("Indietro", "Zurück", "Back")}
      </button>
      <div className="flex items-center gap-2 mb-1">
        <MapPin className="w-5 h-5 text-primary" />
        <h1 className="font-display text-2xl font-black text-foreground">{tri("Indirizzo Impressum", "Impressum-Adresse", "Impressum address")}</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {tri(
          "Scrivi una riga per ogni riga dell'indirizzo (max 6). Cambia subito l'Impressum e l'informativa privacy, in tutte le lingue.",
          "Schreibe jede Adresszeile in eine eigene Zeile (max. 6). Ändert sofort Impressum und Datenschutzerklärung in allen Sprachen.",
          "Write each address line on its own line (max 6). It changes the Impressum and the privacy policy straight away, in all languages.")}
      </p>
      <div className="rounded-xl bg-ambra/12 border border-ambra/40 p-3 mb-4">
        <p className="text-[12px] text-foreground">
          {tri(
            "Ci vuole un indirizzo a cui puoi essere raggiunto davvero (per esempio quello professionale o di un servizio di domiciliazione). Una casella postale di solito non basta in Germania. Se lasci vuoto, resta il testo predefinito.",
            "Es braucht eine Adresse, unter der du wirklich erreichbar bist (zum Beispiel die Geschäftsadresse oder ein Impressum-Service). Ein Postfach reicht in Deutschland in der Regel nicht. Bleibt das Feld leer, gilt der Standardtext.",
            "You need an address where you can really be reached (for example a business address or an Impressum service). A P.O. box is usually not enough in Germany. If you leave it empty, the default text stays.")}
        </p>
      </div>
      <textarea
        data-testid="impressum-address-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={loading || busy}
        rows={6}
        maxLength={720}
        placeholder={"Via / Straße 1\n70000 Stuttgart\nDeutschland"}
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary outline-none font-mono"
      />
      {lines.length > 0 && (
        <div className="mt-3 rounded-xl border border-border bg-background/70 p-3" data-testid="impressum-preview">
          <p className="text-[11px] font-bold text-muted-foreground mb-1">{tri("Anteprima", "Vorschau", "Preview")}</p>
          <p className="text-sm text-foreground whitespace-pre-line">{`Michele Signorella\n${lines.join("\n")}`}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <button data-testid="impressum-save" onClick={() => save(text)} disabled={busy || loading}
          className="inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50 active:scale-95 transition-all">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {tri("Salva", "Speichern", "Save")}
        </button>
        <button data-testid="impressum-reset" onClick={() => save("")} disabled={busy || loading}
          className="inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-background border border-border text-foreground font-bold text-sm disabled:opacity-50 active:scale-95 transition-all">
          {tri("Ripristina predefinito", "Standard", "Restore default")}
        </button>
      </div>
    </div>
  );
}
