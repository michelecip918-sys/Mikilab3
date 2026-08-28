import { useState, useEffect, useRef } from "react";
import { Trophy, Camera, Loader2, Flame, Crown, Heart, Users, Lightbulb, CheckCircle2 } from "lucide-react";
import { bakeAlongApi, uploadApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";

const RANK_COLORS = ["#d4af37", "#9aa7b0", "#b07a44"];

export default function BakeAlong() {
  const { lang } = useLang();
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const { user, setAuthOpen } = useAuth();
  const [data, setData] = useState(null);
  const [entries, setEntries] = useState([]);
  const [champion, setChampion] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const fileRef = useRef(null);

  const load = async () => {
    const [c, e, w] = await Promise.all([bakeAlongApi.current(lang), bakeAlongApi.entries(), bakeAlongApi.winners()]);
    setData(c); setEntries(e.entries || []);
    setChampion((w && w.length) ? w[0] : null);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [lang]);

  const onFile = async (file) => {
    if (!file) return;
    if (!user) { setAuthOpen && setAuthOpen(true); return; }
    setBusy(true);
    try {
      const url = await uploadApi.image(file, file.name || "bakealong.jpg");
      await bakeAlongApi.submit(url, note.trim());
      toast.success(tri("La tua sfida è stata pubblicata!", "Deine Challenge wurde veröffentlicht!", "Your challenge entry is live!", "¡Tu reto se ha publicado!"));
      setNote(""); setShowForm(false);
      await load();
    } catch {
      toast.error(tri("Errore nel caricamento, riprova.", "Fehler beim Hochladen, versuch es erneut.", "Upload error, try again.", "Error al subir, inténtalo de nuevo."));
    } finally { setBusy(false); }
  };

  const vote = async (id) => {
    if (!user) { setAuthOpen && setAuthOpen(true); return; }
    // ottimistico
    setEntries((es) => es.map((e) => e.id === id ? { ...e, liked_by_me: !e.liked_by_me, like_count: e.like_count + (e.liked_by_me ? -1 : 1) } : e)
      .sort((a, b) => b.like_count - a.like_count).map((e, i) => ({ ...e, rank: i + 1 })));
    try { await bakeAlongApi.like(id); } catch { load(); }
  };

  if (!data) return null;
  const th = data.theme || {};

  return (
    <div data-testid="bake-along" className="rounded-2xl overflow-hidden bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B]">
      {/* Header sfida */}
      <div className="p-5 text-white" style={{ background: "linear-gradient(135deg,#7a1f1f,#a9772f 90%)" }}>
        <div className="flex items-center gap-2 mb-1">
          <Flame className="w-5 h-5" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/85">
            {tri("Sfida della settimana", "Wochen-Challenge", "Weekly challenge", "Reto de la semana")} · {data.week}
          </span>
        </div>
        <h3 className="font-display text-2xl font-bold leading-tight" data-testid="bake-along-title">{th.title}</h3>
        <p className="text-white/90 text-sm mt-1">{th.description}</p>
        {th.tip && (
          <div className="mt-3 flex items-start gap-2 bg-white/15 rounded-xl px-3 py-2">
            <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="text-[13px] leading-snug">{th.tip}</p>
          </div>
        )}
        <div className="flex items-center gap-1.5 mt-3 text-[12px] text-white/85">
          <Users className="w-4 h-4" /> {data.participants} {tri("partecipanti", "Teilnehmer", "participants", "participantes")}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Partecipa */}
        {data.already_submitted ? (
          <div data-testid="bake-along-submitted" className="flex items-center gap-2 text-[#2e8b6f] text-sm font-semibold bg-[#2e8b6f]/10 border border-[#2e8b6f]/30 rounded-xl px-3.5 py-2.5">
            <CheckCircle2 className="w-4.5 h-4.5" /> {tri("Hai già partecipato! Vota gli altri qui sotto.", "Du hast schon teilgenommen! Stimme unten ab.", "You've entered! Vote for others below.", "¡Ya participaste! Vota a los demás abajo.")}
          </div>
        ) : (
          <div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
            {showForm && (
              <textarea data-testid="bake-along-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                placeholder={tri("Racconta com'è andata (facoltativo)…", "Erzähl, wie es lief (optional)…", "Tell us how it went (optional)…", "Cuenta cómo fue (opcional)…")}
                className="w-full mb-2 bg-[#FAF5EC] dark:bg-[#1F252B] border border-[#E6D8C3] dark:border-[#38424B] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#a9772f] text-[#2B303B] dark:text-[#e4eff8]" />
            )}
            <button data-testid="bake-along-participate" disabled={busy}
              onClick={() => { if (!user) { setAuthOpen && setAuthOpen(true); return; } if (!showForm) { setShowForm(true); } else { fileRef.current?.click(); } }}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#a9772f] hover:bg-[#8a5a2b] text-white font-semibold px-5 py-3 rounded-2xl active:scale-98 transition-all disabled:opacity-60">
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              {showForm ? tri("Carica la foto del tuo pane", "Foto deines Brotes hochladen", "Upload your bread photo", "Sube la foto de tu pan")
                        : tri("Partecipa alla sfida", "An der Challenge teilnehmen", "Join the challenge", "Únete al reto")}
            </button>
          </div>
        )}

        {/* Classifica */}
        <div>
          <div className="flex items-center gap-2 mb-2 text-[#a9772f]">
            <Trophy className="w-5 h-5" />
            <h4 className="font-display text-base font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Classifica", "Rangliste", "Leaderboard", "Clasificación")}</h4>
          </div>
          {entries.length === 0 ? (
            <p data-testid="bake-along-empty" className="text-[13px] text-[#7E8A93] py-3 text-center">
              {tri("Nessuna partecipazione ancora. Sii il primo!", "Noch keine Teilnahme. Sei der Erste!", "No entries yet. Be the first!", "Aún sin participaciones. ¡Sé el primero!")}
            </p>
          ) : (
            <ul className="space-y-2.5" data-testid="bake-along-leaderboard">
              {entries.map((e) => (
                <li key={e.id} data-testid={`bake-along-entry-${e.id}`}
                  className="flex items-center gap-3 rounded-xl bg-[#FAF5EC] dark:bg-[#1F252B] border border-[#E6D8C3] dark:border-[#38424B] p-2.5">
                  <div className="relative shrink-0">
                    <img src={e.image_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    {e.rank <= 3 && (
                      <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow" style={{ background: RANK_COLORS[e.rank - 1] }}>
                        {e.rank === 1 ? <Crown className="w-3.5 h-3.5" /> : e.rank}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#2B303B] dark:text-[#e4eff8] truncate">{e.author_name}</p>
                    {(e.text || e.text_de || e.text_en || e.text_es) && (
                      <p className="text-[12px] text-[#7E8A93] truncate">{lang === "de" ? (e.text_de || e.text) : lang === "en" ? (e.text_en || e.text) : lang === "es" ? (e.text_es || e.text) : e.text}</p>
                    )}
                  </div>
                  <button data-testid={`bake-along-vote-${e.id}`} onClick={() => vote(e.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold shrink-0 active:scale-90 transition-all ${e.liked_by_me ? "bg-[#C0574D] text-white" : "bg-white dark:bg-[#232A31] text-[#C0574D] border border-[#C0574D]/40"}`}>
                    <Heart className={`w-4 h-4 ${e.liked_by_me ? "fill-current" : ""}`} /> {e.like_count}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {data.last_week_theme && (
          <p className="text-[12px] text-[#7E8A93] text-center pt-1">
            {tri("Settimana scorsa:", "Letzte Woche:", "Last week:", "Semana pasada:")} <b>{data.last_week_theme.title}</b>
          </p>
        )}
        {champion && (
          <div data-testid="bake-along-champion" className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#C0574D]/12 to-[#a9772f]/12 border border-[#a9772f]/30 px-3 py-2">
            {champion.avatar ? <img src={champion.avatar} alt="" className="w-8 h-8 rounded-full object-cover" /> : <span className="text-xl">🥇</span>}
            <p className="text-[13px] text-[#2B303B] dark:text-[#e4eff8]">
              {tri("Campione:", "Champion:", "Champion:", "Campeón:")} <b>{champion.name}</b> <span className="text-[#7E8A93]">· {champion.likes} {tri("voti", "Stimmen", "votes", "votos")}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
