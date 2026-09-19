import { useState, useEffect, useCallback } from "react";
import { Link2, Copy, Check, Trash2, Plus, Loader2, Clock } from "lucide-react";
import { floorInvitesApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { toast } from "sonner";

// Pannello Capo: genera e gestisce i link d'invito per far entrare gli operai
// in Produzione (ognuno sceglie nome + PIN personale). Legato all'azienda attiva.
export default function FloorInvitePanel() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [invites, setInvites] = useState([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [days, setDays] = useState(30);
  const [copied, setCopied] = useState("");

  const linkFor = (token) => `${window.location.origin}/?floor_invite=${token}`;

  const load = useCallback(() => { floorInvitesApi.list().then((d) => setInvites(Array.isArray(d.invites) ? d.invites : [])).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setBusy(true);
    try {
      const r = await floorInvitesApi.create({ days: Number(days) || 30, note: note.trim() });
      setNote("");
      await load();
      try { await navigator.clipboard.writeText(linkFor(r.token)); setCopied(r.token); setTimeout(() => setCopied(""), 2500); } catch { /* */ }
      toast.success(tri("Link creato e copiato", "Link erstellt und kopiert", "Link created and copied", "Enlace creado y copiado", "Lien créé et copié", "لینک ساخته و کپی شد"));
    } catch (e) {
      toast.error(tri("Creazione non riuscita", "Erstellen fehlgeschlagen", "Create failed", "Creación fallida", "Échec de création", "ایجاد ناموفق"));
    } finally { setBusy(false); }
  };

  const copy = async (token) => {
    try { await navigator.clipboard.writeText(linkFor(token)); setCopied(token); setTimeout(() => setCopied(""), 2500); toast.success(tri("Link copiato", "Link kopiert", "Link copied", "Enlace copiado", "Lien copié", "لینک کپی شد")); } catch { /* */ }
  };

  const revoke = async (token) => {
    try { await floorInvitesApi.revoke(token); load(); } catch { /* */ }
  };

  const active = invites.filter((i) => i.active && (!i.expires_at || i.expires_at > new Date().toISOString()));

  return (
    <div data-testid="floor-invite-panel" className="rounded-2xl border border-accent/25 bg-background/70 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Link2 className="w-4 h-4 text-accent" />
        <h3 className="font-bold text-sm text-foreground">{tri("Inviti Operai (link)", "Bediener-Einladungen (Link)", "Operator invites (link)", "Invitaciones operarios (enlace)", "Invitations opérateurs (lien)", "دعوت اپراتورها (لینک)")}</h3>
      </div>
      <p className="text-[11.5px] text-muted-foreground mb-3 leading-snug">
        {tri("Genera un link: l'operaio lo apre, sceglie il nome e imposta un PIN personale ed entra in Produzione. Nessun PIN condiviso.",
             "Erzeuge einen Link: der Bediener öffnet ihn, wählt Namen und persönliche PIN und betritt die Produktion. Kein geteilter PIN.",
             "Generate a link: the operator opens it, picks a name and a personal PIN and enters Production. No shared PIN.",
             "Genera un enlace: el operario lo abre, elige nombre y un PIN personal y entra en Producción. Sin PIN compartido.",
             "Générez un lien : l'opérateur l'ouvre, choisit un nom et un PIN personnel et entre en Production. Pas de PIN partagé.",
             "یک لینک بساز: اپراتور آن را باز می‌کند، نام و پین شخصی انتخاب می‌کند و وارد تولید می‌شود.")}
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input data-testid="floor-invite-note" value={note} onChange={(e) => setNote(e.target.value)}
          placeholder={tri("Nota (es. Reparto pane)", "Notiz (z.B. Brot)", "Note (e.g. Bread line)", "Nota (p. ej. Panadería)", "Note (ex. Ligne pain)", "یادداشت")}
          className="flex-1 min-w-[140px] rounded-lg bg-background border border-border/30 text-foreground text-[12px] px-3 py-2 outline-none focus:border-accent" />
        <select data-testid="floor-invite-days" value={days} onChange={(e) => setDays(e.target.value)}
          className="rounded-lg bg-background border border-border/30 text-muted-foreground text-[12px] px-2 py-2 outline-none">
          <option value={7}>7 {tri("giorni", "Tage", "days", "días", "jours", "روز")}</option>
          <option value={30}>30 {tri("giorni", "Tage", "days", "días", "jours", "روز")}</option>
          <option value={90}>90 {tri("giorni", "Tage", "days", "días", "jours", "روز")}</option>
        </select>
        <button data-testid="floor-invite-create" onClick={create} disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent/20 border border-accent/50 text-accent font-bold text-[12px] active:scale-95 transition-all">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} {tri("Crea link", "Link erstellen", "Create link", "Crear enlace", "Créer lien", "ساخت لینک")}
        </button>
      </div>

      <div className="space-y-1.5 max-h-64 overflow-auto pr-0.5">
        {active.length === 0 && <p className="text-[11px] text-muted-foreground py-2 text-center">{tri("Nessun link attivo", "Keine aktiven Links", "No active links", "Sin enlaces activos", "Aucun lien actif", "لینکی فعال نیست")}</p>}
        {active.map((iv) => (
          <div key={iv.token} data-testid={`floor-invite-row-${iv.token}`} className="flex items-center gap-2 rounded-lg bg-background border border-border px-2.5 py-2">
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-foreground truncate">{iv.note || tri("Link produzione", "Produktions-Link", "Production link", "Enlace producción", "Lien production", "لینک تولید")}</p>
              <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                <Clock className="w-3 h-3" /> {tri("scade", "läuft ab", "expires", "expira", "expire", "انقضا")} {String(iv.expires_at || "").slice(0, 10)} · {iv.uses || 0} {tri("ingressi", "Zugänge", "entries", "accesos", "entrées", "ورود")}
              </p>
            </div>
            <button data-testid={`floor-invite-copy-${iv.token}`} onClick={() => copy(iv.token)}
              className="shrink-0 inline-flex items-center gap-1 px-2 py-1.5 rounded-md bg-background border border-border/30 text-muted-foreground text-[11px] font-bold">
              {copied === iv.token ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button data-testid={`floor-invite-revoke-${iv.token}`} onClick={() => revoke(iv.token)}
              className="shrink-0 inline-flex items-center px-2 py-1.5 rounded-md bg-background border border-mattone/30 text-mattone text-[11px]">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
