import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, Radio, Users, ExternalLink } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { api } from "@/lib/api";

// G5: "Impastiamo insieme" — countdown sincronizzato sull'ora del server + conteggio partecipanti.
export default function Live({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [data, setData] = useState(null);
  const [tiktokHandle, setTiktokHandle] = useState("");
  const [offset, setOffset] = useState(0);        // scarto tra orologio locale e server (ms)
  const [nowMs, setNowMs] = useState(Date.now());
  const [participants, setParticipants] = useState(0);
  const tokenRef = useRef(Math.random().toString(36).slice(2) + Date.now());

  const load = useCallback(async () => {
    try {
      const t0 = Date.now();
      const tr = await api.get(`/time`);
      const t1 = Date.now();
      const serverMs = tr.data.epoch_ms + (t1 - t0) / 2;
      setOffset(serverMs - t1);
      const lr = await api.get(`/live`);
      setData(lr.data);
      setParticipants(lr.data.participants || 0);
    } catch (e) { setData({ error: true }); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get(`/site-settings`).then((r) => setTiktokHandle(r.data.tiktok_handle || "")).catch(() => { /* */ }); }, []);
  useEffect(() => { const id = setInterval(() => setNowMs(Date.now()), 1000); return () => clearInterval(id); }, []);

  // ping partecipanti ogni 30s solo se c'è una sessione in corso
  const current = data && data.current;
  useEffect(() => {
    if (!current) return;
    let alive = true;
    const ping = async () => {
      try { const r = await api.post(`/live/ping`, { token: tokenRef.current }); if (alive) setParticipants(r.data.participants || 0); } catch (e) { /* */ }
    };
    ping();
    const id = setInterval(ping, 30000);
    return () => { alive = false; clearInterval(id); };
  }, [current]);

  const serverNow = nowMs + offset;
  const fmtCountdown = (target) => {
    const s = Math.max(0, Math.round((target - serverNow) / 1000));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
    return `${h > 0 ? h + "h " : ""}${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  };
  const startMs = (sess) => { try { return new Date(sess.start_utc).getTime(); } catch { return 0; } };
  const openTikTok = () => { if (tiktokHandle) window.open(`https://www.tiktok.com/@${tiktokHandle}`, "_blank", "noopener"); };

  return (
    <div data-testid="live-page" className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <button data-testid="live-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>

      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-black text-foreground flex items-center gap-2"><Radio className="w-7 h-7 text-mattone" />{tri("Impastiamo insieme", "Backen wir zusammen", "Let's bake together")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{tri("Sessioni dal vivo con Michele, sincronizzate sull'ora del server.", "Live-Sessions mit Michele, auf die Serverzeit synchronisiert.", "Live sessions with Michele, synced to server time.")}</p>
      </div>

      {data && data.error && <p className="text-muted-foreground text-sm">{tri("Al momento non ci sono sessioni.", "Zurzeit keine Sessions.", "No sessions right now.")}</p>}

      {current && (
        <div data-testid="live-current" className="rounded-2xl border border-mattone/50 bg-mattone/10 p-5 space-y-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-mattone"><span className="w-2 h-2 rounded-full bg-mattone animate-pulse" />{tri("In diretta ora", "Jetzt live", "Live now")}</span>
          <h2 className="font-display text-2xl font-bold text-foreground">{current.title}</h2>
          <p data-testid="live-participants" className="inline-flex items-center gap-2 text-foreground font-bold"><Users className="w-5 h-5 text-mattone" />{tri(`Ora ${participants} persone stanno impastando con Michele`, `Gerade kneten ${participants} Personen mit Michele`, `${participants} people are baking with Michele now`)}</p>
          {current.notes && <p className="text-foreground/75 text-sm">{current.notes}</p>}
          <button data-testid="live-tiktok" onClick={openTikTok} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground text-background font-bold text-sm active:scale-95"><ExternalLink className="w-4 h-4" />{tri("Apri la diretta su TikTok", "Live auf TikTok öffnen", "Open the live on TikTok")}</button>
        </div>
      )}

      {!current && data && data.next && (
        <div data-testid="live-next" className="rounded-2xl border border-border bg-card p-5 space-y-2 text-center">
          <p className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">{tri("Prossima sessione", "Nächste Session", "Next session")}</p>
          <h2 className="font-display text-2xl font-bold text-foreground">{data.next.title}</h2>
          <p data-testid="live-countdown" className="font-display text-4xl font-black text-primary tabular-nums">{fmtCountdown(startMs(data.next))}</p>
          <p className="text-muted-foreground text-xs">{new Date(data.next.start_utc).toLocaleString(lang === "it" ? "it-IT" : lang === "de" ? "de-DE" : "en-GB")}</p>
          <button data-testid="live-tiktok" onClick={openTikTok} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground text-background font-bold text-sm active:scale-95 mt-2"><ExternalLink className="w-4 h-4" />{tri("Apri il profilo TikTok", "TikTok-Profil öffnen", "Open TikTok profile")}</button>
        </div>
      )}

      {!current && data && !data.next && !data.error && (
        <p className="text-muted-foreground text-sm">{tri("Nessuna sessione in programma. Torna presto!", "Keine Session geplant. Schau bald wieder vorbei!", "No session scheduled. Check back soon!")}</p>
      )}
    </div>
  );
}
