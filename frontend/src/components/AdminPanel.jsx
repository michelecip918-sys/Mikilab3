import { useEffect, useState, useCallback, useMemo } from "react";
import { Crown, Gift, Trash2, RefreshCw, MessageCircle, Image as ImageIcon, MessageSquareText, Save, Languages, CheckCircle2, AlertTriangle, Mail, Send, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { adminApi, siteSettingsApi, recipesApi } from "@/lib/api";
import { CATS, recipeCategory } from "@/lib/recipeCats";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Markdown-lite → HTML per l'anteprima (rispecchia il template inviato via Resend).
const escapeHtml = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const mdLiteHtml = (s) => escapeHtml(s)
  .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  .replace(/\*(.+?)\*/g, "<em>$1</em>")
  .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" style="color:#ff6b00">$1</a>')
  .replace(/\n/g, "<br/>");

const BUBBLE_SECTIONS = [
  { variant: "lab", it: "Laboratorio", de: "Backstube" },
  { variant: "impara", it: "Impara", de: "Lernen" },
  { variant: "community", it: "Community", de: "Community" },
  { variant: "shop", it: "Shop", de: "Shop" },
];

export default function AdminPanel({ open, onOpenChange }) {
  const { lang, t } = useLang();
  const { user } = useAuth();
  const de = lang === "de";
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [days, setDays] = useState("0"); // "0" = illimitato
  const [busy, setBusy] = useState(false);
  const [shop, setShop] = useState({ enabled: false, waitlist_count: 0 });
  const [baBusy, setBaBusy] = useState(false);
  const notifyBakeAlong = async () => {
    setBaBusy(true);
    try {
      const r = await adminApi.bakeAlongNotify();
      toast.success((de ? "Inviato a " : "Inviato a ") + (r.notified_subscribers ?? 0) + (de ? " Abonnenten" : " iscritti"));
    } catch { toast.error(de ? "Fehler" : "Errore"); }
    finally { setBaBusy(false); }
  };
  const awardBakeAlong = async () => {
    setBaBusy(true);
    try {
      const r = await adminApi.bakeAlongAward();
      toast.success(r.winner ? (de ? "Sieger: " : "Vincitore: ") + (r.winner.name || "?") : (de ? "Keine Teilnahme" : "Nessuna partecipazione"));
    } catch { toast.error(de ? "Fehler" : "Errore"); }
    finally { setBaBusy(false); }
  };
  const sendDigest = async () => {
    setBaBusy(true);
    try {
      const r = await adminApi.sendDailyDigest();
      toast.success((de ? "Zusammenfassungen gesendet: " : "Riepiloghi inviati: ") + (r.users_notified ?? 0) + ` (${r.queued_items ?? 0})`);
      try { setEmailRep(await adminApi.emailReport()); } catch { /* */ }
    } catch { toast.error(de ? "Fehler" : "Errore"); }
    finally { setBaBusy(false); }
  };
  const [settings, setSettings] = useState({ whatsapp_number: "", avatar_bubbles: {}, folder_covers: {} });
  const [mkRecipes, setMkRecipes] = useState([]);
  const [savingSet, setSavingSet] = useState(false);
  const [subs, setSubs] = useState([]);
  const [nl, setNl] = useState({ subject: "", title: "", body: "", lang: "", image_url: "" });
  const [nlSending, setNlSending] = useState(false);
  const [nlTesting, setNlTesting] = useState(false);
  const [nlHistory, setNlHistory] = useState([]);
  const [emailRep, setEmailRep] = useState(null);

  const downloadCsv = () => {
    const rows = [["email", "lang", "source", "created_at"], ...subs.map((s) => [s.email, s.lang || "", s.source || "", s.created_at || ""])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = `mikilab-newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const nlPayload = (extra = {}) => ({ subject: nl.subject, title: nl.title, body: nl.body, lang: nl.lang || null, image_url: nl.image_url || null, ...extra });

  const validNl = () => {
    if (!nl.subject.trim() || !nl.title.trim() || !nl.body.trim()) { toast.error(de ? "Betreff, Titel und Text ausfüllen" : "Compila oggetto, titolo e testo"); return false; }
    return true;
  };

  const sendTest = async () => {
    if (!validNl()) return;
    if (!user?.email) { toast.error(de ? "Keine Admin-E-Mail" : "Nessuna email admin"); return; }
    setNlTesting(true);
    try {
      await adminApi.newsletterSend(nlPayload({ test_email: user.email }));
      toast.success((de ? "Testmail an " : "Prova inviata a ") + user.email);
    } catch (err) {
      toast.error(err?.response?.data?.detail || (de ? "Fehler" : "Errore"));
    } finally { setNlTesting(false); }
  };

  const sendNewsletter = async () => {
    if (!validNl()) return;
    if (!window.confirm(de ? "An alle Abonnenten senden?" : "Inviare a tutti gli iscritti?")) return;
    setNlSending(true);
    try {
      const r = await adminApi.newsletterSend(nlPayload());
      toast.success((de ? "Gesendet an " : "Inviata a ") + (r.sent ?? 0) + (de ? " Abonnenten" : " iscritti") + (r.failed ? ` (${r.failed} ${de ? "Fehler" : "errori"})` : ""));
      setNl({ subject: "", title: "", body: "", lang: "", image_url: "" });
      try { const h = await adminApi.newsletterHistory(); setNlHistory(h.campaigns || []); } catch { /* */ }
    } catch (err) {
      toast.error(err?.response?.data?.detail || (de ? "Fehler" : "Errore"));
    } finally { setNlSending(false); }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setList(await adminApi.entitlements());
      try { setShop(await adminApi.shopSettings()); } catch { /* */ }
      try { const n = await adminApi.newsletter(); setSubs(n.subscribers || []); } catch { /* */ }
      try { const h = await adminApi.newsletterHistory(); setNlHistory(h.campaigns || []); } catch { /* */ }
      try { setEmailRep(await adminApi.emailReport()); } catch { /* */ }
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

  // Copertura traduzioni ricette MikiLab (IT/DE/EN): rileva quelle senza nome o
  // procedimento tradotti, così Michele sa quali completare.
  const trCoverage = useMemo(() => {
    const has = (v) => !!(v && String(v).trim());
    const rows = (mkRecipes || []).map((r) => {
      const miss = [];
      if (!has(r.name_de) || !has(r.procedure_de)) miss.push("DE");
      if (!has(r.name_en) || !has(r.procedure_en)) miss.push("EN");
      return { id: r.id, name: r.name, miss };
    });
    return { total: rows.length, incomplete: rows.filter((x) => x.miss.length) };
  }, [mkRecipes]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="admin-panel" className="max-w-md max-h-[88vh] overflow-y-auto overflow-x-hidden bg-[#121212] dark:bg-[#121212] border-[#2e2e2e] dark:border-[#2e2e2e]">
        <DialogTitle className="font-display text-xl font-bold text-[#2B303B] dark:text-[#e4eff8] flex items-center gap-2">
          <Crown className="w-5 h-5 text-[#ff6b00]" /> {de ? "Admin-Panel" : "Pannello Admin"}
        </DialogTitle>
        <DialogDescription className="text-sm text-[#7E8A93]">
          {de ? "Verwalte Inhalte, Abonnenten und spezielle Zugänge." : "Gestisci contenuti, iscritti e accessi speciali."}
        </DialogDescription>

        <div className="rounded-2xl bg-[#ff6b00]/10 border border-[#ff6b00]/30 p-4 space-y-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#ff6b00] dark:text-[#a9d2ec]">
            <Gift className="w-4 h-4" /> {de ? "PRO verschenken" : "Regala PRO"}
          </p>
          <input
            data-testid="admin-grant-email" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="email@esempio.it"
            className="w-full bg-white dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-xl px-3 py-2.5 text-sm outline-none text-[#2B303B] dark:text-[#e4eff8]"
          />
          <select
            data-testid="admin-grant-days" value={days} onChange={(e) => setDays(e.target.value)}
            className="w-full bg-white dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-xl px-3 py-2.5 text-sm outline-none text-[#2B303B] dark:text-[#e4eff8]"
          >
            {dayOpts.map((o) => <option key={o.v} value={o.v}>{de ? o.de : o.it}</option>)}
          </select>
          <button
            data-testid="admin-grant-btn" onClick={grant} disabled={busy}
            className="w-full bg-[#ff6b00] disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl active:scale-98 transition-all"
          >
            {de ? "PRO schenken" : "Regala PRO"}
          </button>
        </div>

        <div data-testid="admin-shop" className="rounded-2xl bg-[#ff6b00]/10 border border-[#ff6b00]/30 p-4 mt-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#ff6b00] dark:text-[#8FB0C2]">{de ? "Shop & Academy" : "Shop & Academy"}</p>
              <p className="text-[11px] text-[#7E8A93]">{de ? "Warteliste" : "Lista d'attesa"}: <b>{shop.waitlist_count}</b> · {shop.enabled ? (de ? "Aktiv" : "Attivo") : (de ? "In Arrivo" : "In arrivo")}</p>
            </div>
            <button data-testid="admin-shop-toggle" onClick={toggleShop}
              className={`px-3 py-2 rounded-xl text-sm font-semibold active:scale-97 ${shop.enabled ? "bg-[#ff6b00] text-white" : "bg-[#e4eff8] dark:bg-[#1e1e1e] text-[#ff6b00] dark:text-[#8FB0C2] border border-[#ff6b00]/30"}`}>
              {shop.enabled ? (de ? "Aktiv" : "Attivo") : (de ? "In Arrivo" : "In arrivo")}
            </button>
          </div>
        </div>

        <div data-testid="admin-bakealong" className="rounded-2xl bg-[#ff6b00]/10 border border-[#ff6b00]/30 p-4 mt-2">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#ff6b00] dark:text-[#e0b877]">Bake-Along</p>
              <p className="text-[11px] text-[#7E8A93]">{de ? "Alle Abonnenten über die Wochen-Challenge benachrichtigen" : "Avvisa tutti gli iscritti della sfida della settimana"}</p>
            </div>
            <button data-testid="admin-bakealong-notify" onClick={notifyBakeAlong} disabled={baBusy}
              className="px-3 py-2 rounded-xl text-sm font-semibold bg-[#ff6b00] text-white active:scale-97 disabled:opacity-60 shrink-0">
              {baBusy ? (de ? "Sende…" : "Invio…") : (de ? "Senden" : "Invia ora")}
            </button>
          </div>
          <button data-testid="admin-bakealong-award" onClick={awardBakeAlong} disabled={baBusy}
            className="mt-2 w-full px-3 py-2 rounded-xl text-sm font-semibold bg-[#ff6b00] text-white active:scale-97 disabled:opacity-60">
            🥇 {de ? "Wochensieger krönen" : "Proclama il vincitore della settimana"}
          </button>
          <button data-testid="admin-send-digest" onClick={sendDigest} disabled={baBusy}
            className="mt-2 w-full px-3 py-2 rounded-xl text-sm font-semibold bg-[#8C6B4A] text-white active:scale-97 disabled:opacity-60">
            📧 {de ? "Kanal-Zusammenfassungen jetzt senden" : "Invia i riepiloghi dei canali ora"}
          </button>
        </div>

        {/* Report invii email (digest + istantanei) ultimi 7 giorni */}
        <div data-testid="admin-email-report" className="rounded-2xl bg-[#8C6B4A]/12 border border-[#8C6B4A]/35 p-4 mt-2">
          <p className="flex items-center gap-1.5 text-sm font-bold text-[#a37b52] dark:text-[#d8b48a] mb-2">
            <BarChart3 className="w-4 h-4" /> {de ? "E-Mail-Bericht (7 Tage)" : "Report invii email (7 giorni)"}
          </p>
          {!emailRep ? (
            <p className="text-[12px] text-[#7E8A93]">{de ? "Wird geladen…" : "Caricamento…"}</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="rounded-xl bg-white dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] p-2.5 text-center">
                  <p data-testid="email-report-total" className="font-display text-xl font-extrabold text-[#ff6b00]">{emailRep.total}</p>
                  <p className="text-[10px] text-[#7E8A93] leading-tight">{de ? "Gesendet" : "Inviate"}</p>
                </div>
                <div className="rounded-xl bg-white dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] p-2.5 text-center">
                  <p data-testid="email-report-users" className="font-display text-xl font-extrabold text-[#ff6b00]">{emailRep.users}</p>
                  <p className="text-[10px] text-[#7E8A93] leading-tight">{de ? "Nutzer" : "Utenti"}</p>
                </div>
                <div className="rounded-xl bg-white dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] p-2.5 text-center">
                  <p data-testid="email-report-queue" className="font-display text-xl font-extrabold text-[#8C6B4A]">{emailRep.queue_items}</p>
                  <p className="text-[10px] text-[#7E8A93] leading-tight">{de ? "In Warteschlange" : "In coda"}</p>
                </div>
              </div>
              <div className="flex items-end justify-between gap-1.5 h-20 mb-1">
                {emailRep.daily.map((d) => {
                  const max = Math.max(1, ...emailRep.daily.map((x) => x.count));
                  const h = Math.round((d.count / max) * 100);
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                      <span className="text-[9px] font-bold text-[#a37b52] dark:text-[#d8b48a]">{d.count || ""}</span>
                      <div className="w-full rounded-t bg-[#8C6B4A]" style={{ height: `${Math.max(4, h)}%` }} />
                      <span className="text-[8px] text-[#7E8A93]">{d.date.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
              {Object.keys(emailRep.by_type || {}).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {Object.entries(emailRep.by_type).map(([k, v]) => (
                    <span key={k} className="text-[10px] font-bold text-[#a37b52] dark:text-[#d8b48a] bg-[#8C6B4A]/15 border border-[#8C6B4A]/30 rounded-full px-2 py-0.5">
                      {k === "digest" ? (de ? "Zusammenfassung" : "Riepilogo") : k === "instant" ? (de ? "Sofort" : "Istantaneo") : k}: {v}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <div data-testid="admin-newsletter" className="rounded-2xl bg-[#3a6b3a]/10 border border-[#3a6b3a]/30 p-4 mt-2">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-[#2f5a2f] dark:text-[#9cd6a0]">
              <Mail className="w-4 h-4" /> {de ? "Newsletter-Abonnenten" : "Iscritti Newsletter"}
              <span className="text-[11px] font-bold bg-[#3a6b3a]/20 text-[#2f5a2f] dark:text-[#9cd6a0] rounded-full px-2 py-0.5">{subs.length}</span>
            </p>
            {subs.length > 0 && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button data-testid="admin-newsletter-csv" onClick={downloadCsv}
                  className="text-[11px] font-semibold text-[#2f5a2f] dark:text-[#9cd6a0] bg-white dark:bg-[#1e1e1e] border border-[#3a6b3a]/40 rounded-lg px-2 py-1 active:scale-95">
                  CSV
                </button>
                <button data-testid="admin-newsletter-copy" onClick={() => { navigator.clipboard.writeText(subs.map((s) => s.email).join(", ")); toast.success(de ? "E-Mails kopiert" : "Email copiate"); }}
                  className="text-[11px] font-semibold text-[#2f5a2f] dark:text-[#9cd6a0] bg-white dark:bg-[#1e1e1e] border border-[#3a6b3a]/40 rounded-lg px-2 py-1 active:scale-95">
                  {de ? "Alle kopieren" : "Copia tutte"}
                </button>
              </div>
            )}
          </div>
          {subs.length === 0 ? (
            <p className="text-[12px] text-[#7E8A93]">{de ? "Noch keine Abonnenten." : "Nessun iscritto ancora."}</p>
          ) : (
            <div className="space-y-1.5 max-h-44 overflow-y-auto">
              {subs.map((s) => (
                <div key={s.email} data-testid={`nl-row-${s.email}`} className="flex items-center justify-between gap-2 bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-lg px-2.5 py-2">
                  <span className="text-xs text-[#2B303B] dark:text-[#e4eff8] truncate">{s.email}</span>
                  <span className="shrink-0 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase text-[#ff6b00] bg-[#ff6b00]/10 rounded px-1.5 py-0.5">{s.lang || "it"}</span>
                    <span className="text-[10px] text-[#7E8A93]">{s.source || "home"}</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Invia la ricetta della settimana a tutti gli iscritti (Resend) */}
          <div data-testid="admin-newsletter-send" className="mt-3 pt-3 border-t border-[#3a6b3a]/25">
            <p className="flex items-center gap-1.5 text-xs font-bold text-[#2f5a2f] dark:text-[#9cd6a0] mb-2">
              <Send className="w-4 h-4" /> {de ? "Newsletter senden" : "Invia newsletter"}
            </p>
            <input data-testid="nl-send-subject" value={nl.subject} onChange={(e) => setNl((n) => ({ ...n, subject: e.target.value }))}
              placeholder={de ? "Betreff der E-Mail" : "Oggetto dell'email"}
              className="w-full bg-white dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-xl px-3 py-2 text-sm outline-none text-[#2B303B] dark:text-[#e4eff8] mb-1.5" />
            <input data-testid="nl-send-title" value={nl.title} onChange={(e) => setNl((n) => ({ ...n, title: e.target.value }))}
              placeholder={de ? "Titel (im Inhalt)" : "Titolo (nel contenuto)"}
              className="w-full bg-white dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-xl px-3 py-2 text-sm outline-none text-[#2B303B] dark:text-[#e4eff8] mb-1.5" />
            <textarea data-testid="nl-send-body" value={nl.body} onChange={(e) => setNl((n) => ({ ...n, body: e.target.value }))} rows={4}
              placeholder={de ? "Text… **fett**, *kursiv*, [Link](https://…)" : "Testo… **grassetto**, *corsivo*, [link](https://…)"}
              className="w-full bg-white dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-xl px-3 py-2 text-sm outline-none text-[#2B303B] dark:text-[#e4eff8] mb-1.5" />
            <input data-testid="nl-send-image" value={nl.image_url} onChange={(e) => setNl((n) => ({ ...n, image_url: e.target.value }))}
              placeholder={de ? "Bild-URL (optional)" : "URL immagine (opzionale)"}
              className="w-full bg-white dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-xl px-3 py-2 text-sm outline-none text-[#2B303B] dark:text-[#e4eff8] mb-1.5" />
            <p className="text-[10px] text-[#7E8A93] mb-2">{de ? "Formatierung: **fett**, *kursiv*, [Text](URL)" : "Formattazione: **grassetto**, *corsivo*, [testo](URL)"}</p>

            {/* Anteprima live: come apparirà l'email agli iscritti */}
            {(nl.title.trim() || nl.body.trim() || nl.image_url.trim()) && (
              <div className="mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#2f5a2f] dark:text-[#9cd6a0] mb-1">{de ? "Vorschau" : "Anteprima"}</p>
                <div data-testid="nl-preview" className="rounded-xl border border-[#2e2e2e] dark:border-[#2e2e2e] overflow-hidden bg-white">
                  <div className="bg-[#ff6b00] px-4 py-3 flex items-center gap-2">
                    <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="MikiLab" className="w-8 h-8 rounded-lg object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    <span className="font-display text-white font-bold text-base">MikiLab</span>
                  </div>
                  <div className="p-4">
                    {nl.image_url.trim() && (
                      <img data-testid="nl-preview-image" src={nl.image_url} alt="" className="w-full rounded-lg mb-3 max-h-40 object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    )}
                    {nl.title.trim() && <h3 data-testid="nl-preview-title" className="font-display text-lg font-bold text-[#2B303B] mb-2">{nl.title}</h3>}
                    <div data-testid="nl-preview-body" className="text-sm text-[#3F4A54] leading-relaxed" dangerouslySetInnerHTML={{ __html: mdLiteHtml(nl.body) }} />
                    <p className="text-[10px] text-[#9aa4ac] mt-4 pt-3 border-t border-[#eee]">MikiLab · 100% {de ? "kostenlos" : "gratis"} · noreply@mikilab.de</p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <select data-testid="nl-send-lang" value={nl.lang} onChange={(e) => setNl((n) => ({ ...n, lang: e.target.value }))}
                className="bg-white dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-xl px-2 py-2 text-sm outline-none text-[#2B303B] dark:text-[#e4eff8]">
                <option value="">{de ? "Alle Sprachen" : "Tutte le lingue"}</option>
                <option value="it">IT</option><option value="de">DE</option><option value="en">EN</option>
                <option value="es">ES</option><option value="fr">FR</option><option value="fa">FA</option>
              </select>
              <button data-testid="nl-test-btn" onClick={sendTest} disabled={nlTesting}
                className="flex items-center justify-center gap-1.5 bg-white dark:bg-[#181818] border border-[#3a6b3a]/50 text-[#2f5a2f] dark:text-[#9cd6a0] disabled:opacity-50 font-semibold px-3 py-2 rounded-xl active:scale-98 transition-all text-sm">
                {nlTesting ? "…" : (de ? "An mich" : "A me")}
              </button>
              <button data-testid="nl-send-btn" onClick={sendNewsletter} disabled={nlSending}
                className="flex-1 flex items-center justify-center gap-2 bg-[#3a6b3a] disabled:opacity-50 text-white font-semibold py-2 rounded-xl active:scale-98 transition-all">
                <Send className="w-4 h-4" /> {nlSending ? (de ? "Sende…" : "Invio…") : (de ? "An alle" : "A tutti")}
              </button>
            </div>

            {nlHistory.length > 0 && (
              <div data-testid="nl-history" className="mt-3">
                <p className="text-[11px] font-bold text-[#2f5a2f] dark:text-[#9cd6a0] mb-1.5">{de ? "Verlauf" : "Storico invii"}</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {nlHistory.map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-2 text-[11px] bg-white dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-lg px-2 py-1.5">
                      <span className="truncate text-[#2B303B] dark:text-[#e4eff8]">{c.subject}</span>
                      <span className="shrink-0 text-[#7E8A93]">{(c.created_at || "").slice(0, 10)} · {c.sent}/{c.total} · {(c.lang || "all").toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div data-testid="admin-site-settings" className="rounded-2xl bg-[#ff6b00]/10 border border-[#ff6b00]/30 p-4 mt-2 space-y-4 min-w-0 max-w-full overflow-hidden">
          <p className="text-sm font-bold text-[#ff6b00] dark:text-[#8FB0C2]">{de ? "Website-Einstellungen" : "Impostazioni del sito"}</p>

          {/* WhatsApp */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#ff6b00] dark:text-[#a9d2ec] mb-1.5">
              <MessageCircle className="w-4 h-4 text-[#25D366]" /> {de ? "WhatsApp-Nummer (nur Ziffern, mit Ländervorwahl)" : "Numero WhatsApp (solo cifre, con prefisso)"}
            </label>
            <input data-testid="admin-wa-number" value={settings.whatsapp_number}
              onChange={(e) => setSettings((s) => ({ ...s, whatsapp_number: e.target.value }))}
              placeholder="491601253378"
              className="w-full bg-white dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-xl px-3 py-2.5 text-sm outline-none text-[#2B303B] dark:text-[#e4eff8]" />
          </div>

          {/* Fumetti avatar */}
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-[#ff6b00] dark:text-[#a9d2ec] mb-1.5">
              <MessageSquareText className="w-4 h-4" /> {de ? "Avatar-Sprechblasen (leer = Standardtext)" : "Fumetti avatar (vuoto = testo predefinito)"}
            </p>
            <div className="space-y-3">
              {BUBBLE_SECTIONS.map((sec) => (
                <div key={sec.variant} className="rounded-xl bg-white dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] p-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#ff6b00] mb-1.5">{de ? sec.de : sec.it}</p>
                  {["michele", "momy"].map((who) => (
                    <div key={who} className="mb-1.5">
                      <p className="text-[10px] font-semibold text-[#7E8A93] uppercase">{who}</p>
                      <input data-testid={`admin-bubble-${sec.variant}-${who}-it`}
                        value={(settings.avatar_bubbles?.[`${sec.variant}.${who}`]?.it) || ""}
                        onChange={(e) => setBubble(sec.variant, who, "it", e.target.value)}
                        placeholder={de ? "Text IT" : "Testo IT"}
                        className="w-full bg-[#121212] dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-lg px-2 py-1.5 text-xs outline-none text-[#2B303B] dark:text-[#e4eff8] mb-1" />
                      <input data-testid={`admin-bubble-${sec.variant}-${who}-de`}
                        value={(settings.avatar_bubbles?.[`${sec.variant}.${who}`]?.de) || ""}
                        onChange={(e) => setBubble(sec.variant, who, "de", e.target.value)}
                        placeholder="Text DE"
                        className="w-full bg-[#121212] dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-lg px-2 py-1.5 text-xs outline-none text-[#2B303B] dark:text-[#e4eff8]" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Copertine cartelle */}
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-[#ff6b00] dark:text-[#a9d2ec] mb-1.5">
              <ImageIcon className="w-4 h-4" /> {de ? "Ordner-Titelbilder (Bild antippen)" : "Copertine cartelle (tocca una foto)"}
            </p>
            <div className="space-y-2.5">
              {CATS.map((cat) => {
                const imgs = mkRecipes.filter((r) => recipeCategory(r).key === cat.key && r.image_url);
                if (imgs.length === 0) return null;
                const sel = settings.folder_covers?.[cat.key];
                return (
                  <div key={cat.key} data-testid={`admin-cover-${cat.key}`} className="min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] font-semibold text-[#2B303B] dark:text-[#e4eff8]">{cat.icon} {t(cat.label)}</p>
                      {sel && <button data-testid={`admin-cover-clear-${cat.key}`} onClick={() => setCover(cat.key, "")} className="text-[10px] text-[#ff6b00] font-semibold">{de ? "Zurücksetzen" : "Ripristina"}</button>}
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 min-w-0 max-w-full">
                      {imgs.map((r) => {
                        const active = sel === r.image_url;
                        return (
                          <button key={r.id} data-testid={`admin-cover-pick-${cat.key}-${r.id}`} onClick={() => setCover(cat.key, r.image_url)}
                            className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${active ? "border-[#ff6b00] ring-2 ring-[#ff6b00]/40" : "border-transparent opacity-80"}`}>
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
            className="w-full flex items-center justify-center gap-2 bg-[#ff6b00] disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl active:scale-98 transition-all">
            <Save className="w-4 h-4" /> {de ? "Einstellungen speichern" : "Salva impostazioni sito"}
          </button>
        </div>

        {/* Copertura traduzioni ricette IT/DE/EN */}
        <div data-testid="admin-translation-coverage" className="rounded-2xl bg-[#C9A24B]/10 border border-[#C9A24B]/35 p-4 mt-2">
          <p className="flex items-center gap-1.5 text-sm font-bold text-[#8a6f2c] dark:text-[#d8bd76] mb-2">
            <Languages className="w-4 h-4" /> {de ? "Rezept-Übersetzungen IT/DE/EN" : "Traduzioni ricette IT/DE/EN"}
          </p>
          {trCoverage.incomplete.length === 0 ? (
            <div data-testid="admin-translation-ok" className="flex items-center gap-2 rounded-xl bg-[#ff6b00]/12 border border-[#ff6b00]/35 px-3 py-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#ff8a33] shrink-0" />
              <p className="text-sm font-semibold text-[#ff6b00] dark:text-[#a9d2ec]">
                {de ? `Alle ${trCoverage.total} Rezepte verifiziert ✓ (IT/DE/EN)` : `Tutte le ${trCoverage.total} ricette verificate ✓ (IT/DE/EN)`}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 rounded-xl bg-[#ff6b00]/12 border border-[#ff6b00]/40 px-3 py-2.5 mb-2">
                <AlertTriangle className="w-5 h-5 text-[#ff6b00] shrink-0" />
                <p data-testid="admin-translation-count" className="text-sm font-semibold text-[#8a5a1a] dark:text-[#e0b877]">
                  {de ? `${trCoverage.incomplete.length} von ${trCoverage.total} Rezepten unvollständig` : `${trCoverage.incomplete.length} ricette su ${trCoverage.total} da completare`}
                </p>
              </div>
              <p className="text-[11px] text-[#7E8A93] mb-2 leading-snug">
                {de ? "Öffne das Rezept und tippe auf «übersetzen», um DE/EN zu ergänzen."
                    : "Apri la ricetta e tocca «traduci» per completare DE/EN."}
              </p>
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {trCoverage.incomplete.map((r) => (
                  <div key={r.id} data-testid={`admin-translation-missing-${r.id}`}
                    className="flex items-center justify-between gap-2 bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-lg px-2.5 py-2">
                    <span className="text-xs text-[#2B303B] dark:text-[#e4eff8] truncate">{r.name}</span>
                    <span className="shrink-0 flex gap-1">
                      {r.miss.map((l) => (
                        <span key={l} className="text-[10px] font-bold text-[#ff6b00] bg-[#ff6b00]/12 border border-[#ff6b00]/30 rounded px-1.5 py-0.5">{l}</span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between mt-2 mb-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#ff6b00]">{de ? "Zugänge" : "Accessi"}</p>
          <button data-testid="admin-refresh" onClick={load} className="text-[#7E8A93] active:scale-90">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="space-y-2">
          {list.length === 0 ? (
            <p className="text-sm text-[#7E8A93] text-center py-4">{de ? "Noch keine Zugänge." : "Nessun accesso ancora."}</p>
          ) : list.map((e) => (
            <div key={e.email} data-testid={`ent-row-${e.email}`}
              className="flex items-center justify-between gap-2 bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-xl px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8] truncate">{e.email}</p>
                <p className="text-[11px] text-[#7E8A93]">
                  <span className={`font-bold ${e.active ? "text-[#ff6b00]" : "text-[#ff6b00]"}`}>
                    {e.active ? "PRO" : (de ? "inaktiv" : "inattivo")}
                  </span>
                  {" · "}{e.source || "—"}{" · "}{fmt(e.expires_at)}
                </p>
              </div>
              {e.active && (
                <button data-testid={`ent-revoke-${e.email}`} onClick={() => revoke(e.email)}
                  className="w-8 h-8 rounded-lg bg-[#e4eff8] dark:bg-[#1e1e1e] flex items-center justify-center text-[#ff6b00] shrink-0 active:scale-95">
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
