import { useEffect, useMemo, useRef, useState } from "react";
import { Flame, Trophy, Camera, Loader2, CheckCircle2, Clock, Users, Heart } from "lucide-react";
import { bakeAlongApi, uploadApi, communityApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { mkTri } from "@/i18n/triMaps";
import { toast } from "sonner";

function timeLeft() {
  const now = new Date();
  const isoWd = ((now.getDay() + 6) % 7) + 1; // Mon=1..Sun=7
  const daysLeft = 7 - isoWd;
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysLeft, 23, 59, 59);
  const ms = Math.max(0, end - now);
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  return { d, h };
}

const medal = (rank) => (rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`);

export default function SfidaLampo() {
  const { lang } = useLang();
  const { user, setAuthOpen } = useAuth();
  const L = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const fileRef = useRef(null);
  const [data, setData] = useState(null);
  const [entries, setEntries] = useState([]);
  const [busy, setBusy] = useState(false);
  const [tl, setTl] = useState(timeLeft());

  const load = () => {
    bakeAlongApi.current(lang).then(setData).catch(() => {});
    bakeAlongApi.entries().then((r) => setEntries((r?.entries || []).slice(0, 5))).catch(() => {});
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [lang]);
  useEffect(() => { const t = setInterval(() => setTl(timeLeft()), 60000); return () => clearInterval(t); }, []);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user) { setAuthOpen && setAuthOpen(true); return; }
    setBusy(true);
    try {
      const url = await uploadApi.image(file, file.name || "sfida.jpg");
      await bakeAlongApi.submit(url, "");
      toast.success(L("Partecipazione inviata! 🔥", "Teilnahme gesendet! 🔥", "Entry submitted! 🔥", "¡Participación enviada! 🔥", "Participation envoyée ! 🔥", "شرکت ثبت شد! 🔥"));
      load();
    } catch { toast.error(L("Caricamento non riuscito, riprova", "Upload fehlgeschlagen", "Upload failed, try again", "Error al subir, reintenta", "Échec de l'envoi", "بارگذاری ناموفق")); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const theme = data?.theme;

  const vote = async (id) => {
    if (!user) { setAuthOpen && setAuthOpen(true); return; }
    setEntries((es) => es.map((e) => e.id === id ? { ...e, liked_by_me: !e.liked_by_me, like_count: e.like_count + (e.liked_by_me ? -1 : 1) } : e));
    try { await communityApi.like(id); bakeAlongApi.entries().then((r) => setEntries((r?.entries || []).slice(0, 5))).catch(() => {}); }
    catch { load(); }
  };

  return (
    <div data-testid="sfida-lampo" className="mb-5 rounded-3xl overflow-hidden border border-[#c94f00]/40 bg-[#181818] shadow-lg">
      <div className="p-5 text-[#121212]" style={{ background: "linear-gradient(135deg,#d4a373,#c94f00 75%)" }}>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-extrabold uppercase tracking-widest flex items-center gap-1.5"><Flame className="w-4 h-4" /> {L("Sfida Lampo della settimana", "Blitz-Challenge der Woche", "Weekly Flash Challenge", "Reto Relámpago semanal", "Défi Éclair de la semaine", "چالش برق‌آسای هفته")}</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#121212]/15 px-2.5 py-1 text-[11px] font-bold"><Clock className="w-3 h-3" /> {tl.d}g {tl.h}h</span>
        </div>
        <h2 data-testid="sfida-lampo-theme" className="font-display text-2xl font-extrabold mt-2 leading-tight">{theme?.title || "…"}</h2>
        {theme?.description && <p className="text-[#121212]/85 text-sm mt-1 leading-snug">{theme.description}</p>}
        {theme?.tip && (
          <p className="mt-2 inline-flex items-start gap-1.5 rounded-2xl shadow-md border border-amber-900/40 bg-[#121212]/12 px-3 py-2 text-[12px] font-medium">💡 {theme.tip}</p>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-[12px] text-[#AEB8BF]">
          <span className="inline-flex items-center gap-1.5"><Users className="w-4 h-4 text-[#c94f00]" /> {data?.participants || 0} {L("fornai in gara", "Bäcker dabei", "bakers competing", "panaderos compitiendo", "boulangers en lice", "نانوا در رقابت")}</span>
        </div>

        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" data-testid="sfida-lampo-file" onChange={onFile} />
        {data?.already_submitted ? (
          <div data-testid="sfida-lampo-submitted" className="flex items-center gap-2 text-[#2e8b6f] text-sm font-semibold bg-[#2e8b6f]/10 border border-[#2e8b6f]/30 rounded-2xl shadow-md border border-amber-900/40 px-3.5 py-2.5">
            <CheckCircle2 className="w-5 h-5" /> {L("Sei in gara! Puoi aggiornare la foto quando vuoi.", "Du bist dabei! Foto jederzeit aktualisierbar.", "You're in! Update your photo anytime.", "¡Estás dentro! Actualiza la foto cuando quieras.", "Tu es inscrit ! Mets à jour ta photo quand tu veux.", "شرکت کردی! هر وقت خواستی عکس را عوض کن.")}
          </div>
        ) : (
          <button data-testid="sfida-lampo-join" disabled={busy} onClick={() => (user ? fileRef.current?.click() : (setAuthOpen && setAuthOpen(true)))}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#c94f00] text-[#121212] font-bold py-3.5 active:scale-98 transition-all disabled:opacity-60">
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />} {L("Partecipa con una foto", "Mit Foto teilnehmen", "Join with a photo", "Participa con una foto", "Participe avec une photo", "با یک عکس شرکت کن")}
          </button>
        )}

        {/* Classifica dei fornai */}
        <div data-testid="sfida-lampo-leaderboard">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#c94f00] flex items-center gap-1.5 mb-2 mt-1"><Trophy className="w-4 h-4" /> {L("Classifica dei fornai", "Bäcker-Rangliste", "Bakers leaderboard", "Clasificación de panaderos", "Classement des boulangers", "جدول نانواها")}</p>
          {entries.length === 0 ? (
            <p className="text-[13px] text-[#AEB8BF] py-2">{L("Ancora nessuno in gara: sii il primo! 🔥", "Noch niemand dabei: sei der Erste! 🔥", "No one competing yet: be the first! 🔥", "Nadie compite aún: ¡sé el primero! 🔥", "Personne encore : sois le premier ! 🔥", "هنوز کسی نیست: اولین باش! 🔥")}</p>
          ) : (
            <div className="space-y-2">
              {entries.map((e) => (
                <div key={e.id} data-testid={`sfida-lampo-entry-${e.id}`} className="flex items-center gap-3 rounded-2xl shadow-md border border-amber-900/40 bg-[#121212] border border-[#2e2e2e] p-2">
                  <span className="w-7 text-center text-lg font-extrabold text-[#c94f00] shrink-0">{medal(e.rank)}</span>
                  {e.image_url ? <img src={e.image_url} alt="" loading="lazy" className="w-12 h-12 rounded-lg object-cover shrink-0" /> : <div className="w-12 h-12 rounded-lg bg-[#c94f00]/15 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{e.author_name}</p>
                    <p className="text-[11px] text-[#AEB8BF] inline-flex items-center gap-1"><Heart className="w-3 h-3 text-[#ff3b5c]" /> {e.like_count} {e.like_count === 1 ? L("voto", "Stimme", "vote", "voto", "vote", "رأی") : L("voti", "Stimmen", "votes", "votos", "votes", "رأی")}</p>
                  </div>
                  <button data-testid={`sfida-lampo-vote-${e.id}`} onClick={() => vote(e.id)} aria-label="vote"
                    className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] font-bold border transition-all active:scale-90 ${e.liked_by_me ? "bg-[#ff3b5c] text-white border-[#ff3b5c]" : "text-[#ff3b5c] border-[#ff3b5c]/40"}`}>
                    <Heart className={`w-3.5 h-3.5 ${e.liked_by_me ? "fill-current" : ""}`} /> {L("Vota", "Voten", "Vote", "Votar", "Voter", "رأی")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
