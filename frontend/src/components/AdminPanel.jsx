import { useEffect, useState, useCallback } from "react";
import { Crown, Gift, Trash2, RefreshCw, MessageCircle, Image as ImageIcon, MessageSquareText, Save } from "lucide-react";
import { toast } from "sonner";
import { adminApi, siteSettingsApi, recipesApi } from "@/lib/api";
import { CATS, recipeCategory } from "@/lib/recipeCats";
import { useLang } from "@/i18n/LanguageContext";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const BUBBLE_SECTIONS = [
  { variant: "lab", it: "Laboratorio", de: "Backstube" },
  { variant: "impara", it: "Impara", de: "Lernen" },
  { variant: "community", it: "Community", de: "Community" },
  { variant: "shop", it: "Shop", de: "Shop" },
];

export default function AdminPanel({ open, onOpenChange }) {
  const { lang, t } = useLang();
  const de = lang === "de";
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [days, setDays] = useState("0"); // "0" = illimitato
  const [busy, setBusy] = useState(false);
  const [shop, setShop] = useState({ enabled: false, waitlist_count: 0 });
  const [settings, setSettings] = useState({ whatsapp_number: "", avatar_bubbles: {}, folder_covers: {} });
  const [mkRecipes, setMkRecipes] = useState([]);
  const [savingSet, setSavingSet] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setList(await adminApi.entitlements());
      try { setShop(await adminApi.shopSettings()); } catch { /* */ }
      try {
        const s = await siteSettingsApi.get();
        setSettings({ whatsapp_number: s.whatsapp_number || "", avatar_bubbles: s.avatar_bubbles || {}, folder_covers: s.folder_covers || {} });
      } catch { /* */ }
      try { setMkRecipes(await recipesApi.list("mikilab")); } catch { /* */ }
    }
    catch { toast.error(de ? "Fehler beim Laden" : "Errore nel caricamento"); }
    setLoading(false);
  }, [de]);

  const setBubble = (variant, who, field, value) => {
    setSettings((s) => {
      const key = `${variant}.${who}`;
      const ab = { ...(s.avatar_bubbles || {}) };
      ab[key] = { ...(ab[key] || {}), [field]: value };
      return { ...s, avatar_bubbles: ab };
    });
  };
  const setCover = (catKey, url) => setSettings((s) => ({ ...s, folder_covers: { ...(s.folder_covers || {}), [catKey]: url } }));

  const saveSettings = async () => {
    setSavingSet(true);
    try {
      const clean = { ...settings, whatsapp_number: (settings.whatsapp_number || "").replace(/\D/g, "") };
      const r = await adminApi.setSiteSettings(clean);
      setSettings({ whatsapp_number: r.whatsapp_number || "", avatar_bubbles: r.avatar_bubbles || {}, folder_covers: r.folder_covers || {} });
      toast.success(de ? "Einstellungen gespeichert" : "Impostazioni salvate");
    } catch { toast.error(de ? "Fehler" : "Errore"); }
    finally { setSavingSet(false); }
  };

  const toggleShop = async () => {
    try {
      const r = await adminApi.setShop(!shop.enabled);
      setShop((s) => ({ ...s, enabled: r.enabled }));
      toast.success(r.enabled ? (de ? "Shop aktiv" : "Shop attivo") : (de ? "Shop: Bald verfügbar" : "Shop: In arrivo"));
    } catch { toast.error(de ? "Fehler" : "Errore"); }
  };

  useEffect(() => { if (open) load(); }, [open, load]);

  const grant = async () => {
    const e = email.trim().toLowerCase();
    if (!e || !e.includes("@")) { toast.error(de ? "Ungültige E-Mail" : "Email non valida"); return; }
    setBusy(true);
    try {
      const d = Number(days) > 0 ? Number(days) : null;
      await adminApi.grant(e, d);
      toast.success(de ? "PRO geschenkt!" : "PRO regalato!");
      setEmail("");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || (de ? "Fehler" : "Errore"));
    } finally { setBusy(false); }
  };

  const revoke = async (e) => {
    try { await adminApi.revoke(e); toast.success(de ? "Entzogen" : "Revocato"); load(); }
    catch { toast.error(de ? "Fehler" : "Errore"); }
  };

  const fmt = (iso) => {
    if (!iso) return de ? "unbegrenzt" : "illimitato";
    try { return new Date(iso).toLocaleDateString(de ? "de-DE" : "it-IT"); } catch { return iso; }
  };

  const dayOpts = [
    { v: "0", it: "Illimitato", de: "Unbegrenzt" },
    { v: "7", it: "7 giorni", de: "7 Tage" },
    { v: "30", it: "30 giorni", de: "30 Tage" },
    { v: "90", it: "90 giorni", de: "90 Tage" },
    { v: "365", it: "1 anno", de: "1 Jahr" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="admin-panel" className="max-w-md max-h-[88vh] overflow-y-auto bg-[#F6F8F5] dark:bg-[#1B2127] border-[#D7E1DB] dark:border-[#38424B]">
        <DialogTitle className="font-display text-xl font-bold text-[#2B303B] dark:text-[#EAF0EC] flex items-center gap-2">
          <Crown className="w-5 h-5 text-[#6E8CA0]" /> {de ? "Admin · VIP-Zugänge" : "Admin · Accessi VIP"}
        </DialogTitle>
        <DialogDescription className="text-sm text-[#7E8A93]">
          {de ? "Verschenke kostenlosen PRO-Zugang (unbegrenzt oder befristet)." : "Regala accesso PRO gratuito (illimitato o a tempo)."}
        </DialogDescription>

        <div className="rounded-2xl bg-[#6B8E62]/10 border border-[#6B8E62]/30 p-4 space-y-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#4d6b45] dark:text-[#9ec48f]">
            <Gift className="w-4 h-4" /> {de ? "PRO verschenken" : "Regala PRO"}
          </p>
          <input
            data-testid="admin-grant-email" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="email@esempio.it"
            className="w-full bg-white dark:bg-[#1F252B] border border-[#D7E1DB] dark:border-[#38424B] rounded-xl px-3 py-2.5 text-sm outline-none text-[#2B303B] dark:text-[#EAF0EC]"
          />
          <select
            data-testid="admin-grant-days" value={days} onChange={(e) => setDays(e.target.value)}
            className="w-full bg-white dark:bg-[#1F252B] border border-[#D7E1DB] dark:border-[#38424B] rounded-xl px-3 py-2.5 text-sm outline-none text-[#2B303B] dark:text-[#EAF0EC]"
          >
            {dayOpts.map((o) => <option key={o.v} value={o.v}>{de ? o.de : o.it}</option>)}
          </select>
          <button
            data-testid="admin-grant-btn" onClick={grant} disabled={busy}
            className="w-full bg-[#6B8E62] disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl active:scale-98 transition-all"
          >
            {de ? "PRO schenken" : "Regala PRO"}
          </button>
        </div>

        <div data-testid="admin-shop" className="rounded-2xl bg-[#33564E]/10 border border-[#33564E]/30 p-4 mt-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#33564E] dark:text-[#8FB0C2]">{de ? "Shop & Academy" : "Shop & Academy"}</p>
              <p className="text-[11px] text-[#7E8A93]">{de ? "Warteliste" : "Lista d'attesa"}: <b>{shop.waitlist_count}</b> · {shop.enabled ? (de ? "Aktiv" : "Attivo") : (de ? "In Arrivo" : "In arrivo")}</p>
            </div>
            <button data-testid="admin-shop-toggle" onClick={toggleShop}
              className={`px-3 py-2 rounded-xl text-sm font-semibold active:scale-97 ${shop.enabled ? "bg-[#6B8E62] text-white" : "bg-[#EAF0EC] dark:bg-[#2A323A] text-[#33564E] dark:text-[#8FB0C2] border border-[#33564E]/30"}`}>
              {shop.enabled ? (de ? "Aktiv" : "Attivo") : (de ? "In Arrivo" : "In arrivo")}
            </button>
          </div>
        </div>

        {/* Impostazioni sito editabili — WhatsApp, Fumetti, Copertine */}
        <div data-testid="admin-site-settings" className="rounded-2xl bg-[#6E8CA0]/10 border border-[#6E8CA0]/30 p-4 mt-2 space-y-4">
          <p className="text-sm font-bold text-[#33564E] dark:text-[#8FB0C2]">{de ? "Website-Einstellungen" : "Impostazioni del sito"}</p>

          {/* WhatsApp */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#4d6b45] dark:text-[#9ec48f] mb-1.5">
              <MessageCircle className="w-4 h-4 text-[#25D366]" /> {de ? "WhatsApp-Nummer (nur Ziffern, mit Ländervorwahl)" : "Numero WhatsApp (solo cifre, con prefisso)"}
            </label>
            <input data-testid="admin-wa-number" value={settings.whatsapp_number}
              onChange={(e) => setSettings((s) => ({ ...s, whatsapp_number: e.target.value }))}
              placeholder="491601253378"
              className="w-full bg-white dark:bg-[#1F252B] border border-[#D7E1DB] dark:border-[#38424B] rounded-xl px-3 py-2.5 text-sm outline-none text-[#2B303B] dark:text-[#EAF0EC]" />
          </div>

          {/* Fumetti avatar */}
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-[#4d6b45] dark:text-[#9ec48f] mb-1.5">
              <MessageSquareText className="w-4 h-4" /> {de ? "Avatar-Sprechblasen (leer = Standardtext)" : "Fumetti avatar (vuoto = testo predefinito)"}
            </p>
            <div className="space-y-3">
              {BUBBLE_SECTIONS.map((sec) => (
                <div key={sec.variant} className="rounded-xl bg-white dark:bg-[#1F252B] border border-[#D7E1DB] dark:border-[#38424B] p-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#5E8B7E] mb-1.5">{de ? sec.de : sec.it}</p>
                  {["michele", "momy"].map((who) => (
                    <div key={who} className="mb-1.5">
                      <p className="text-[10px] font-semibold text-[#7E8A93] uppercase">{who}</p>
                      <input data-testid={`admin-bubble-${sec.variant}-${who}-it`}
                        value={(settings.avatar_bubbles?.[`${sec.variant}.${who}`]?.it) || ""}
                        onChange={(e) => setBubble(sec.variant, who, "it", e.target.value)}
                        placeholder={de ? "Text IT" : "Testo IT"}
                        className="w-full bg-[#F6F8F5] dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] rounded-lg px-2 py-1.5 text-xs outline-none text-[#2B303B] dark:text-[#EAF0EC] mb-1" />
                      <input data-testid={`admin-bubble-${sec.variant}-${who}-de`}
                        value={(settings.avatar_bubbles?.[`${sec.variant}.${who}`]?.de) || ""}
                        onChange={(e) => setBubble(sec.variant, who, "de", e.target.value)}
                        placeholder="Text DE"
                        className="w-full bg-[#F6F8F5] dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] rounded-lg px-2 py-1.5 text-xs outline-none text-[#2B303B] dark:text-[#EAF0EC]" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Copertine cartelle */}
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-[#4d6b45] dark:text-[#9ec48f] mb-1.5">
              <ImageIcon className="w-4 h-4" /> {de ? "Ordner-Titelbilder (Bild antippen)" : "Copertine cartelle (tocca una foto)"}
            </p>
            <div className="space-y-2.5">
              {CATS.map((cat) => {
                const imgs = mkRecipes.filter((r) => recipeCategory(r).key === cat.key && r.image_url);
                if (imgs.length === 0) return null;
                const sel = settings.folder_covers?.[cat.key];
                return (
                  <div key={cat.key} data-testid={`admin-cover-${cat.key}`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] font-semibold text-[#2B303B] dark:text-[#EAF0EC]">{cat.icon} {t(cat.label)}</p>
                      {sel && <button data-testid={`admin-cover-clear-${cat.key}`} onClick={() => setCover(cat.key, "")} className="text-[10px] text-[#C0574D] font-semibold">{de ? "Zurücksetzen" : "Ripristina"}</button>}
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {imgs.map((r) => {
                        const active = sel === r.image_url;
                        return (
                          <button key={r.id} data-testid={`admin-cover-pick-${cat.key}-${r.id}`} onClick={() => setCover(cat.key, r.image_url)}
                            className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${active ? "border-[#6B8E62] ring-2 ring-[#6B8E62]/40" : "border-transparent opacity-80"}`}>
                            <img src={r.image_url.startsWith("http") ? r.image_url : `${process.env.PUBLIC_URL}${r.image_url}`} alt={r.name} className="w-full h-full object-cover" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button data-testid="admin-save-settings" onClick={saveSettings} disabled={savingSet}
            className="w-full flex items-center justify-center gap-2 bg-[#33564E] disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl active:scale-98 transition-all">
            <Save className="w-4 h-4" /> {de ? "Einstellungen speichern" : "Salva impostazioni sito"}
          </button>
        </div>

        <div className="flex items-center justify-between mt-2 mb-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#5E8B7E]">{de ? "Zugänge" : "Accessi"}</p>
          <button data-testid="admin-refresh" onClick={load} className="text-[#7E8A93] active:scale-90">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="space-y-2">
          {list.length === 0 ? (
            <p className="text-sm text-[#7E8A93] text-center py-4">{de ? "Noch keine Zugänge." : "Nessun accesso ancora."}</p>
          ) : list.map((e) => (
            <div key={e.email} data-testid={`ent-row-${e.email}`}
              className="flex items-center justify-between gap-2 bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] rounded-xl px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#2B303B] dark:text-[#EAF0EC] truncate">{e.email}</p>
                <p className="text-[11px] text-[#7E8A93]">
                  <span className={`font-bold ${e.active ? "text-[#6B8E62]" : "text-[#C0574D]"}`}>
                    {e.active ? "PRO" : (de ? "inaktiv" : "inattivo")}
                  </span>
                  {" · "}{e.source || "—"}{" · "}{fmt(e.expires_at)}
                </p>
              </div>
              {e.active && (
                <button data-testid={`ent-revoke-${e.email}`} onClick={() => revoke(e.email)}
                  className="w-8 h-8 rounded-lg bg-[#EAF0EC] dark:bg-[#2A323A] flex items-center justify-center text-[#C0574D] shrink-0 active:scale-95">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
