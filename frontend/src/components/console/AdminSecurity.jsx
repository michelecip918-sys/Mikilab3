import { useEffect, useState } from "react";
import { operatorPinsApi, accessLogApi, gateConfigApi, productionPinApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { Trash2, UserPlus, ShieldCheck, ShieldAlert, Clock, KeyRound, AlarmClock } from "lucide-react";
import FloorInvitePanel from "@/components/console/FloorInvitePanel";

// Zona Capo: gestione PIN personali operatore + Registro Accessi (tentativi PIN).
export default function AdminSecurity() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [ops, setOps] = useState([]);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [opLevel, setOpLevel] = useState("novizio");
  const [opTtl, setOpTtl] = useState(0);
  const [log, setLog] = useState([]);
  const [busy, setBusy] = useState(false);
  const [ttl, setTtl] = useState(30);
  const [ttlSaved, setTtlSaved] = useState(false);
  const [opGatePin, setOpGatePin] = useState("");
  const [opGateSet, setOpGateSet] = useState(false);
  const [opGateSaved, setOpGateSaved] = useState(false);
  const [purgeCode, setPurgeCode] = useState("");
  const [purgeMsg, setPurgeMsg] = useState("");

  const load = () => {
    operatorPinsApi.list().then((d) => setOps(d.operators || [])).catch(() => { /* */ });
    accessLogApi.list(80).then((d) => setLog(d.entries || [])).catch(() => { /* */ });
    gateConfigApi.get().then((d) => setTtl(d.ttl_days || 30)).catch(() => { /* */ });
    productionPinApi.status().then((d) => setOpGateSet(!!(d && d.is_set))).catch(() => { /* */ });
  };
  useEffect(() => { load(); }, []);

  const saveTtl = async () => { try { await gateConfigApi.set(Number(ttl) || 30); setTtlSaved(true); setTimeout(() => setTtlSaved(false), 2000); } catch (e) { /* */ } };
  const saveOpGate = async () => {
    if (opGatePin.length !== 4) return;
    try { await productionPinApi.set(opGatePin); setOpGatePin(""); setOpGateSet(true); setOpGateSaved(true); setTimeout(() => setOpGateSaved(false), 2000); } catch (e) { /* */ }
  };

  const add = async () => {
    if (!name.trim() || pin.length !== 4) return;
    setBusy(true);
    try { await operatorPinsApi.set(name.trim(), pin, opLevel, opTtl); setName(""); setPin(""); setOpLevel("novizio"); setOpTtl(0); load(); } catch (e) { /* */ }
    setBusy(false);
  };
  const del = async (n) => { try { await operatorPinsApi.remove(n); load(); } catch (e) { /* */ } };
  const purge = async () => {
    if (purgeCode.length < 4) return;
    try {
      const r = await operatorPinsApi.purgeByCode(purgeCode);
      setPurgeMsg(r.count > 0
        ? tri(`Chiusi ${r.count} PIN residui`, `${r.count} Rest-PINs entfernt`, `Removed ${r.count} residual PINs`, `Eliminados ${r.count} PIN`, `${r.count} PIN supprimés`, `${r.count} پین حذف شد`)
        : tri("Nessun PIN con questo codice", "Kein PIN mit diesem Code", "No PIN with this code", "Ningún PIN con ese código", "Aucun PIN avec ce code", "پینی با این کد نیست"));
      setPurgeCode(""); load();
      setTimeout(() => setPurgeMsg(""), 4000);
    } catch (e) { /* */ }
  };
  const changeLevel = async (o, lvl) => { try { await operatorPinsApi.setLevel(o.name, lvl); load(); } catch (e) { /* */ } };
  const renew = async (o, ttl) => { try { await operatorPinsApi.renew(o.name, ttl); load(); } catch (e) { /* */ } };
  const isExpiringSoon = (o) => {
    if (!o.expires_at || o.expired || o.active === false) return false;
    const ms = new Date(o.expires_at).getTime() - Date.now();
    return ms > 0 && ms <= 2 * 3600000;
  };
  const LEVELS = [
    { id: "novizio", label: tri("Novizio", "Anfänger", "Novice", "Novato", "Novice", "تازه‌کار"), c: "hsl(var(--accent))" },
    { id: "esperto", label: tri("Esperto", "Erfahren", "Expert", "Experto", "Expert", "ماهر"), c: "hsl(var(--muted-foreground))" },
    { id: "maestro", label: tri("Maestro", "Meister", "Master", "Maestro", "Maître", "استاد"), c: "hsl(var(--muted-foreground))" },
  ];

  const kindLabel = (k) => ({ master: tri("Master", "Master", "Master", "Master", "Master", "مستر"), production: tri("Produzione", "Produktion", "Production", "Producción", "Production", "تولید"), operator: tri("Operatore", "Bediener", "Operator", "Operario", "Opérateur", "اپراتور") }[k] || k);

  const TTLS = [
    { h: 0, label: tri("Permanente", "Dauerhaft", "Permanent", "Permanente", "Permanent", "دائمی") },
    { h: 8, label: tri("8 ore", "8 Std.", "8 hours", "8 horas", "8 heures", "۸ ساعت") },
    { h: 24, label: tri("24 ore", "24 Std.", "24 hours", "24 horas", "24 heures", "۲۴ ساعت") },
  ];
  const remainingLabel = (exp) => {
    if (!exp) return null;
    const ms = new Date(exp).getTime() - Date.now();
    if (ms <= 0) return tri("Scaduto", "Abgelaufen", "Expired", "Caducado", "Expiré", "منقضی");
    const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? tri(`tra ${h}h ${m}m`, `in ${h}Std ${m}m`, `in ${h}h ${m}m`, `en ${h}h ${m}m`, `dans ${h}h ${m}m`, `${h}س ${m}د دیگر`) : tri(`tra ${m}m`, `in ${m}m`, `in ${m}m`, `en ${m}m`, `dans ${m}m`, `${m}د دیگر`);
  };

  return (
    <div className="space-y-6" data-testid="admin-security">
      {/* Inviti operaio via LINK — l'operaio sceglie nome + PIN e entra in Produzione */}
      <FloorInvitePanel />
      {/* PIN Sezione Operai — scelto dal Capo: apre la Produzione (zona Capo invisibile) */}
      <div data-testid="op-gate-pin-config" className="rounded-xl border border-border/30 bg-muted/6 p-3">
        <p className="flex items-center gap-2 font-mono-data text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-1"><KeyRound className="w-3.5 h-3.5" /> {tri("PIN Sezione Operai", "PIN Produktionsbereich", "Operator Section PIN", "PIN Sección Operarios", "PIN Section Opérateurs", "پین بخش اپراتور")}</p>
        <p className="text-[11px] text-muted-foreground mb-2">{tri(
          "Scegli tu il PIN con cui gli operai entrano nella loro sezione. Chi lo usa vede SOLO la Produzione, mai la tua plancia. I PIN personali qui sotto restano validi (e tracciano chi è).",
          "Wähle den PIN, mit dem das Team in seinen Bereich gelangt. Nur Produktion sichtbar.",
          "Choose the PIN operators use to enter their section. It opens ONLY Production, never your console. Personal PINs below still work.",
          "Elige el PIN con el que los operarios entran a su sección. Solo ven Producción.",
          "Choisis le PIN d'accès des opérateurs. Il ouvre seulement la Production.",
          "پینی که اپراتورها با آن وارد بخش خود می‌شوند را انتخاب کن.")}</p>
        <div className="flex flex-wrap items-center gap-2">
          <span data-testid="op-gate-status" className={`text-[11px] font-bold px-2 py-1 rounded-full border ${opGateSet ? "text-accent border-accent/40 bg-accent/10" : "text-muted-foreground border-border/40 bg-muted/10"}`}>
            {opGateSet ? tri("Impostato ✓", "Gesetzt ✓", "Set ✓", "Configurado ✓", "Défini ✓", "تنظیم شد ✓") : tri("Non impostato", "Nicht gesetzt", "Not set", "Sin configurar", "Non défini", "تنظیم نشده")}
          </span>
          <input data-testid="op-gate-pin-input" value={opGatePin} onChange={(e) => setOpGatePin(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric"
            placeholder={opGateSet ? tri("Nuovo PIN (4)", "Neuer PIN (4)", "New PIN (4)", "Nuevo PIN (4)", "Nouveau PIN (4)", "پین جدید (۴)") : "PIN (4)"}
            className="w-28 bg-background border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground text-center tracking-[0.3em] focus:border-border outline-none" />
          <button data-testid="op-gate-save" onClick={saveOpGate} disabled={opGatePin.length !== 4}
            className="px-4 py-2 rounded-lg bg-muted/20 border border-border/50 text-muted-foreground font-bold text-sm disabled:opacity-40 active:scale-95 transition-all">
            {opGateSaved ? tri("Salvato ✓", "Gespeichert ✓", "Saved ✓", "Guardado ✓", "Enregistré ✓", "ذخیره شد ✓") : (opGateSet ? tri("Cambia PIN", "PIN ändern", "Change PIN", "Cambiar PIN", "Changer PIN", "تغییر پین") : tri("Imposta PIN", "PIN setzen", "Set PIN", "Definir PIN", "Définir PIN", "تنظیم پین"))}
          </button>
        </div>
      </div>

      {/* Scadenza cancello Master configurabile */}
      <div data-testid="gate-ttl-config" className="flex flex-wrap items-end gap-2 bg-background/60 border border-border/25 rounded-xl p-3">
        <div className="flex-1 min-w-[180px]">
          <p className="flex items-center gap-2 font-mono-data text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-1"><Clock className="w-3.5 h-3.5" /> {tri("Scadenza cancello Master", "Master-Gate-Ablauf", "Master gate expiry", "Caducidad de la puerta", "Expiration de la porte", "انقضای دروازه")}</p>
          <p className="text-[11px] text-muted-foreground">{tri("Ogni quanti giorni ri-chiedere il PIN Master sui dispositivi.", "Nach wie vielen Tagen der Master-PIN erneut abgefragt wird.", "How many days before re-asking the Master PIN on devices.", "Cada cuántos días volver a pedir el PIN Master.", "Tous les combien de jours redemander le PIN Master.", "هر چند روز پین مستر دوباره پرسیده شود.")}</p>
        </div>
        <input data-testid="gate-ttl-input" type="number" min="1" max="365" value={ttl} onChange={(e) => setTtl(e.target.value)} className="w-24 bg-background border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground text-center focus:border-border outline-none" />
        <span className="text-xs text-muted-foreground pb-2">{tri("giorni", "Tage", "days", "días", "jours", "روز")}</span>
        <button data-testid="gate-ttl-save" onClick={saveTtl} className="px-4 py-2 rounded-lg bg-accent/20 border border-border/50 text-accent-foreground font-bold text-sm active:scale-95 transition-all">{ttlSaved ? tri("Salvato ✓", "Gespeichert ✓", "Saved ✓", "Guardado ✓", "Enregistré ✓", "ذخیره شد ✓") : tri("Salva", "Speichern", "Save", "Guardar", "Enregistrer", "ذخیره")}</button>
      </div>

      {/* PIN personali operatore */}
      <div>
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-2">{tri("PIN personali operatore", "Persönliche Bediener-PINs", "Personal operator PINs", "PIN personales de operario", "PIN personnels opérateur", "پین‌های شخصی اپراتور")}</p>
        <div className="flex flex-wrap gap-2 items-center mb-3">
          <input data-testid="op-name-input" value={name} onChange={(e) => setName(e.target.value)} placeholder={tri("Nome operatore", "Bedienername", "Operator name", "Nombre operario", "Nom opérateur", "نام اپراتور")}
            className="flex-1 min-w-[140px] bg-background border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground focus:border-border outline-none" />
          <input data-testid="op-pin-input" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" placeholder="PIN (4)"
            className="w-24 bg-background border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground text-center tracking-[0.3em] focus:border-border outline-none" />
          <select data-testid="op-level-input" value={opLevel} onChange={(e) => setOpLevel(e.target.value)}
            className="bg-background border border-border/30 rounded-lg px-2.5 py-2 text-sm text-foreground focus:border-border outline-none">
            {LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
          <select data-testid="op-ttl-input" value={opTtl} onChange={(e) => setOpTtl(Number(e.target.value))}
            className="bg-background border border-border/30 rounded-lg px-2.5 py-2 text-sm text-foreground focus:border-border outline-none">
            {TTLS.map((tOpt) => <option key={tOpt.h} value={tOpt.h}>{tOpt.label}</option>)}
          </select>
          <button data-testid="op-add-btn" onClick={add} disabled={busy || !name.trim() || pin.length !== 4}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent/20 border border-border/50 text-accent-foreground font-bold text-sm disabled:opacity-40 active:scale-95 transition-all">
            <UserPlus className="w-4 h-4" /> {tri("Aggiungi", "Hinzufügen", "Add", "Añadir", "Ajouter", "افزودن")}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">{tri(
          "Il livello dice a Sitor come guidare ciascuno: più semplice per i novizi, più tecnico per i maestri. Scegli una durata (8/24 ore) per stagionali ed extra: il PIN si revoca da solo alla scadenza.",
          "Das Level sagt Sitor, wie es jeden führt. Wähle 8/24 Std. für Saison-/Aushilfskräfte: der PIN wird automatisch widerrufen.",
          "The level tells Sitor how to guide each person. Pick a duration (8/24h) for seasonal/extra staff: the PIN auto-revokes when it expires.",
          "El nivel le dice a Sitor cómo guiar a cada uno. Elige 8/24h para temporales: el PIN se revoca solo al caducar.",
          "Le niveau indique à Sitor comment guider chacun. Choisis 8/24h pour les saisonniers : le PIN s'auto-révoque.",
          "سطح به سیتور می‌گوید هرکس را چگونه راهنمایی کند. برای فصلی‌ها ۸/۲۴ ساعت انتخاب کن: پین خودکار باطل می‌شود.")}</p>
        <div className="space-y-1.5">
          {ops.some(isExpiringSoon) && (
            <div data-testid="pin-expiring-banner" className="mb-2 rounded-xl border border-border/50 bg-muted/10 p-2.5">
              <p className="flex items-center gap-1.5 text-[11px] font-black text-muted-foreground uppercase tracking-wider mb-1.5">
                <AlarmClock className="w-3.5 h-3.5" /> {tri("Sitor avvisa: PIN in scadenza", "Sitor warnt: PIN läuft ab", "Sitor alerts: PINs expiring", "Sitor avisa: PIN por caducar", "Sitor alerte : PIN expirant", "هشدار سیتور: انقضای پین")}
              </p>
              {ops.filter(isExpiringSoon).map((o) => (
                <div key={o.name_key} data-testid={`pin-expiring-${o.name_key}`} className="flex items-center gap-2 py-1">
                  <span className="text-[12px] text-foreground flex-1 truncate">{o.name} · <span className="text-muted-foreground">{remainingLabel(o.expires_at)}</span></span>
                  <button data-testid={`renew-8-${o.name_key}`} onClick={() => renew(o, 8)} className="px-2 py-1 rounded-md bg-muted/20 border border-border/50 text-muted-foreground text-[10px] font-black active:scale-95 transition-all">+8h</button>
                  <button data-testid={`renew-24-${o.name_key}`} onClick={() => renew(o, 24)} className="px-2 py-1 rounded-md bg-muted/20 border border-border/50 text-muted-foreground text-[10px] font-black active:scale-95 transition-all">+24h</button>
                </div>
              ))}
            </div>
          )}
          {ops.length === 0 && <p className="text-xs text-muted-foreground">{tri("Nessun PIN operatore. Aggiungine uno per timbrature tracciabili al singolo.", "Noch keine Bediener-PINs.", "No operator PINs yet — add one for per-person clock-ins.", "Aún no hay PIN de operario.", "Aucun PIN opérateur.", "هنوز پینی نیست.")}</p>}
          {ops.map((o) => (
            <div key={o.name_key || o.name} data-testid={`op-row-${o.name_key || o.name}`} className={`flex items-center gap-2 bg-background/60 border rounded-lg px-3 py-2 ${o.expired || o.active === false ? "border-mattone/40 opacity-70" : o.expires_at ? "border-border/40" : "border-border"}`}>
              <span className="text-sm font-semibold text-foreground flex-1 truncate">
                {o.name}
                {o.expires_at && (
                  <span data-testid={`op-ttl-badge-${o.name_key || o.name}`} className={`ml-2 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${o.expired || o.active === false ? "bg-mattone/20 text-mattone" : "bg-muted/20 text-muted-foreground"}`}>
                    <Clock className="w-2.5 h-2.5" /> {o.expired || o.active === false ? tri("Scaduto", "Abgelaufen", "Expired", "Caducado", "Expiré", "منقضی") : remainingLabel(o.expires_at)}
                  </span>
                )}
              </span>
              <select data-testid={`op-level-${o.name_key || o.name}`} value={o.level || "novizio"} onChange={(e) => changeLevel(o, e.target.value)}
                className="bg-background border border-border/30 rounded-lg px-2 py-1 text-[11px] font-bold text-foreground focus:border-border outline-none"
                style={{ color: (LEVELS.find((l) => l.id === (o.level || "novizio")) || LEVELS[0]).c }}>
                {LEVELS.map((l) => <option key={l.id} value={l.id} style={{ color: "#fff" }}>{l.label}</option>)}
              </select>
              <button data-testid={`op-del-${o.name_key || o.name}`} onClick={() => del(o.name)} className="text-mattone/80 hover:text-mattone active:scale-90 transition-all"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Chiudi PIN residuo per codice — utile per PIN vecchi/senza nome o di altre aziende */}
      <div data-testid="op-purge-box" className="rounded-xl border border-mattone/30 bg-mattone/6 p-3">
        <p className="flex items-center gap-2 font-mono-data text-[10px] tracking-[0.25em] uppercase text-mattone mb-1"><Trash2 className="w-3.5 h-3.5" /> {tri("Chiudi PIN residuo", "Rest-PIN schließen", "Close residual PIN", "Cerrar PIN residual", "Fermer PIN résiduel", "بستن پین باقی‌مانده")}</p>
        <p className="text-[11px] text-muted-foreground mb-2">{tri(
          "Elimina definitivamente un vecchio PIN operaio scrivendone il codice — anche se non compare qui sopra (privo di nome o di un'altra azienda).",
          "Löscht einen alten Bediener-PIN per Code — auch wenn er oben nicht erscheint.",
          "Permanently removes an old operator PIN by typing its code — even if it doesn't appear above (no name or another company).",
          "Elimina un PIN antiguo escribiendo su código, aunque no aparezca arriba.",
          "Supprime un ancien PIN opérateur via son code, même s'il n'apparaît pas ci-dessus.",
          "یک پین قدیمی اپراتور را با کدش حذف کن، حتی اگر بالا نباشد.")}</p>
        <div className="flex flex-wrap items-center gap-2">
          <input data-testid="op-purge-input" value={purgeCode} onChange={(e) => setPurgeCode(e.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric"
            placeholder={tri("Codice PIN", "PIN-Code", "PIN code", "Código PIN", "Code PIN", "کد پین")}
            className="w-32 bg-background border border-mattone/30 rounded-lg px-3 py-2 text-sm text-foreground text-center tracking-[0.3em] focus:border-mattone outline-none" />
          <button data-testid="op-purge-btn" onClick={purge} disabled={purgeCode.length < 4}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-mattone/20 border border-mattone/50 text-mattone font-bold text-sm disabled:opacity-40 active:scale-95 transition-all">
            <Trash2 className="w-4 h-4" /> {tri("Elimina", "Löschen", "Remove", "Eliminar", "Supprimer", "حذف")}
          </button>
          {purgeMsg && <span data-testid="op-purge-msg" className="text-[12px] font-bold text-muted-foreground">{purgeMsg}</span>}
        </div>
      </div>

      {/* Registro accessi */}
      <div>
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-2">{tri("Registro accessi (ultimi tentativi PIN)", "Zugriffsprotokoll", "Access log (recent PIN attempts)", "Registro de accesos", "Journal d'accès", "گزارش دسترسی")}</p>
        <div className="max-h-64 overflow-auto rounded-lg border border-border divide-y divide-border">
          {log.length === 0 && <p className="text-xs text-muted-foreground p-3">{tri("Nessun accesso registrato.", "Keine Zugriffe.", "No accesses logged.", "Sin accesos.", "Aucun accès.", "دسترسی ثبت نشده.")}</p>}
          {log.map((e, i) => (
            <div key={i} data-testid={`log-row-${i}`} className="flex items-center gap-2 px-3 py-1.5 text-xs">
              {e.ok ? <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
              <span className="font-bold w-20 shrink-0 text-foreground">{kindLabel(e.kind)}</span>
              <span className="flex-1 truncate text-foreground">{e.name || (e.ok ? tri("OK", "OK", "OK", "OK", "OK", "OK") : tri("PIN errato", "Falscher PIN", "Wrong PIN", "PIN incorrecto", "PIN incorrect", "پین اشتباه"))}</span>
              <span className="text-muted-foreground shrink-0">{(e.at || "").slice(0, 16).replace("T", " ")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
