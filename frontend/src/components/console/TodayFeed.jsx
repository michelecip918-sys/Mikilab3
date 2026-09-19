import { useState, useEffect } from "react";
import { Bell, ShieldAlert, FileText, ChevronRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { sitorAlertsApi, operatorPinsApi, floorApi } from "@/lib/api";

// Home "Oggi": un vero feed che raggruppa le notizie e gli aggiornamenti del laboratorio
// (avvisi di Sitor, PIN operatori in scadenza, ultimo report di turno) in un colpo d'occhio.
export default function TodayFeed() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [alerts, setAlerts] = useState({ alerts: [], unread: 0 });
  const [pins, setPins] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    sitorAlertsApi.list().then(setAlerts).catch(() => {});
    operatorPinsApi.list().then((d) => setPins(d.operators || [])).catch(() => {});
    floorApi.shiftReports().then((d) => setReports(d.reports || [])).catch(() => {});
  }, []);

  const latestAlerts = (alerts.alerts || []).filter((a) => !a.read).slice(0, 3);
  const expiringPins = pins.filter((p) => p.expired || (p.expires_at && (new Date(p.expires_at).getTime() - Date.now()) < 24 * 3600 * 1000));
  const lastReport = reports[0] || null;
  const jump = (gid) => { try { window.dispatchEvent(new CustomEvent("mikilab:open-group", { detail: gid })); } catch { /* */ } };

  return (
    <div data-testid="today-feed" className="rounded-2xl border border-border/30 bg-gradient-to-br from-background to-background p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-sm text-foreground flex items-center gap-2"><Bell className="w-4 h-4 text-muted-foreground" /> {tri("Oggi in laboratorio", "Heute in der Backstube", "Today in the lab", "Hoy en el taller", "Aujourd'hui au labo", "امروز در آزمایشگاه")}</h3>
        <span className="text-[10px] text-muted-foreground">{tri("aggiornato ora", "jetzt", "updated now", "actualizado", "à jour", "هم‌اکنون")}</span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {/* Avvisi di Sitor */}
        <div data-testid="today-alerts" className="rounded-xl border p-3" style={{ borderColor: alerts.unread > 0 ? "#b06e7855" : "hsl(var(--card))", background: alerts.unread > 0 ? "#b06e780d" : "hsl(var(--card))" }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] font-black text-foreground flex items-center gap-1.5"><Bell className="w-3.5 h-3.5 text-muted-foreground" /> {tri("Avvisi di Sitor", "Sitor-Alarme", "Sitor alerts", "Avisos de Sitor", "Alertes Sitor", "هشدارهای سیتور")}</span>
            <span data-testid="today-alerts-count" className={`text-[11px] font-black px-2 py-0.5 rounded-full ${alerts.unread > 0 ? "bg-mattone text-white" : "bg-card text-muted-foreground"}`}>{alerts.unread}</span>
          </div>
          {latestAlerts.length > 0 ? latestAlerts.map((a, i) => {
            const txt = [a.recipe_name, a.action && `[${a.action}]`, a.advice].filter(Boolean).join(" · ") || a.message || a.text || "";
            return <p key={i} data-testid={`today-alert-${i}`} className="text-[11.5px] text-foreground truncate">• {txt}</p>;
          }) : <p className="text-[11px] text-muted-foreground">{tri("Tutto in regola, nessun avviso attivo.", "Alles in Ordnung, keine Alarme.", "All good, no active alerts.", "Todo bien, sin avisos.", "Tout va bien, aucune alerte.", "همه‌چیز خوب است.")}</p>}
        </div>

        {/* PIN operatori */}
        <button data-testid="today-pins" onClick={() => jump("sicurezza")} className="text-left rounded-xl border p-3 w-full active:scale-[0.99] transition-all" style={{ borderColor: expiringPins.length > 0 ? "#b0916e55" : "hsl(var(--card))", background: expiringPins.length > 0 ? "#b0916e0d" : "hsl(var(--card))" }}>
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-black text-foreground flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" /> {tri("PIN operatori", "Mitarbeiter-PINs", "Operator PINs", "PIN de operarios", "PIN opérateurs", "پین اپراتورها")}</span>
            <span data-testid="today-pins-count" className={`text-[11px] font-black px-2 py-0.5 rounded-full ${expiringPins.length > 0 ? "bg-muted text-foreground" : "bg-card text-muted-foreground"}`}>{expiringPins.length > 0 ? expiringPins.length : "OK"}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">{expiringPins.length > 0 ? tri(`${expiringPins.length} PIN scaduti o in scadenza — tocca per rinnovare.`, `${expiringPins.length} PINs abgelaufen.`, `${expiringPins.length} PINs expired/expiring — tap to renew.`, `${expiringPins.length} PINs caducados.`, `${expiringPins.length} PINs expirés.`, `${expiringPins.length} پین منقضی.`) : tri(`${pins.length} operatori attivi, nessuna scadenza imminente.`, `${pins.length} aktiv, keine Frist.`, `${pins.length} active operators, no expiry soon.`, `${pins.length} operarios activos.`, `${pins.length} opérateurs actifs.`, `${pins.length} اپراتور فعال.`)}</p>
        </button>

        {/* Ultimo report */}
        <button data-testid="today-report" onClick={() => jump("sicurezza")} className="text-left rounded-xl border border-border bg-background p-3 w-full active:scale-[0.99] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-black text-foreground flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-muted-foreground" /> {tri("Ultimo report di turno", "Letzter Schichtbericht", "Latest shift report", "Último informe", "Dernier rapport", "آخرین گزارش")}</span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <p data-testid="today-report-text" className="text-[11px] text-muted-foreground mt-1">{lastReport ? tri(`${lastReport.by || "Operaio"} · ${lastReport.at ? new Date(lastReport.at).toLocaleString("it-IT") : ""} · ${lastReport.waste != null ? `scarti ${lastReport.waste}` : ""}`, "Bericht gespeichert.", "Report saved.", "Informe guardado.", "Rapport enregistré.", "گزارش ثبت شد.") : tri("Nessun report inviato ancora oggi.", "Noch kein Bericht heute.", "No report sent yet today.", "Sin informes hoy.", "Aucun rapport aujourd'hui.", "هنوز گزارشی نیست.")}</p>
        </button>
      </div>
    </div>
  );
}
