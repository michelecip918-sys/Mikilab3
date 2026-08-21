import { useEffect, useState, useCallback } from "react";
import { GraduationCap, Lock, PlayCircle, Check, CalendarClock, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";

const euro = (cents) => "€ " + (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);

export default function Academy() {
  const { lang } = useLang();
  const { user, setAuthOpen } = useAuth();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);
  const [cat, setCat] = useState({ courses: [], consult: null });
  const [owned, setOwned] = useState({}); // id -> video_url
  const [busy, setBusy] = useState(null);
  const [form, setForm] = useState({ name: "", date: "", topic: "", phone: "" });

  const loadMy = useCallback(async () => {
    if (!user) { setOwned({}); return; }
    try {
      const r = await api.get("/academy/my");
      const map = {};
      (r.data.courses || []).forEach((c) => { map[c.id] = c.video_url; });
      setOwned(map);
    } catch { /* not logged / error */ }
  }, [user]);

  useEffect(() => { api.get("/academy/catalog").then((r) => setCat(r.data)).catch(() => {}); }, []);
  useEffect(() => { loadMy(); }, [loadMy]);

  // Ritorno da Stripe: ?academy=success&session_id=...
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("academy") === "success" && p.get("session_id")) {
      const sid = p.get("session_id");
      window.history.replaceState({}, "", window.location.pathname);
      api.get(`/academy/checkout/status/${sid}`).then((r) => {
        if (r.data.paid) {
          toast.success(r.data.kind === "consult"
            ? tri("Consulenza prenotata e pagata! Ti contatto io.", "Beratung gebucht und bezahlt! Ich melde mich.", "Consultation booked and paid! I'll contact you.")
            : tri("Corso sbloccato! Buona visione.", "Kurs freigeschaltet! Viel Spaß.", "Course unlocked! Enjoy."));
          loadMy();
        } else {
          toast.info(tri("Pagamento non completato.", "Zahlung nicht abgeschlossen.", "Payment not completed."));
        }
      }).catch(() => {});
    } else if (p.get("academy") === "cancel") {
      window.history.replaceState({}, "", window.location.pathname);
      toast.info(tri("Pagamento annullato.", "Zahlung abgebrochen.", "Payment cancelled."));
    }
  }, []); // eslint-disable-line

  const requireLogin = () => {
    toast.error(tri("Accedi per acquistare.", "Zum Kaufen anmelden.", "Sign in to purchase."));
    setAuthOpen(true);
  };

  const buy = async (kind, course_id, booking) => {
    if (!user) return requireLogin();
    setBusy(course_id || "consult");
    try {
      const r = await api.post("/academy/checkout", { kind, course_id, booking, origin_url: window.location.origin });
      window.location.href = r.data.url;
    } catch (e) {
      if (e?.response?.status === 401) requireLogin();
      else toast.error(tri("Errore nel pagamento.", "Zahlungsfehler.", "Payment error."));
      setBusy(null);
    }
  };

  const bookConsult = () => {
    if (!user) return requireLogin();
    if (!form.name.trim() || !form.date) {
      toast.error(tri("Inserisci nome e data preferita.", "Name und Wunschtermin eingeben.", "Enter name and preferred date."));
      return;
    }
    buy("consult", null, form);
  };

  const title = (c) => (lang === "de" ? c.title_de : lang === "en" ? c.title_en : c.title) || c.title;
  const desc = (c) => (lang === "de" ? c.desc_de : lang === "en" ? c.desc_en : c.desc) || c.desc;

  return (
    <div data-testid="academy-page" className="pb-4 space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-[#5E8B7E] to-[#33564E] text-white p-7 text-center shadow-xl">
        <GraduationCap className="w-12 h-12 mx-auto mb-2" />
        <h1 className="font-display text-3xl font-bold">Academy &amp; Servizi</h1>
        <p className="text-white/85 text-sm mt-2">
          {tri("Corsi video del Maestro e consulenze 1-to-1 su misura.", "Video-Kurse vom Meister und maßgeschneiderte 1-zu-1-Beratungen.", "The Master's video courses and tailored 1-to-1 consultations.")}
        </p>
      </div>

      {/* Corsi */}
      <div>
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[#6B8E62] mb-3 flex items-center gap-2">
          <GraduationCap className="w-4 h-4" /> {tri("Corsi Video", "Video-Kurse", "Video Courses")}
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {cat.courses.map((c) => {
            const isOwned = !!owned[c.id];
            return (
              <div key={c.id} data-testid={`academy-course-${c.id}`} className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-lg font-bold text-[#2B303B] dark:text-[#EAF0EC]">{title(c)}</h3>
                    <span className="shrink-0 font-mono-data font-bold text-[#5E8B7E]">{euro(c.price_cents)}</span>
                  </div>
                  <p className="text-sm text-[#7E8A93] mt-1 leading-snug">{desc(c)}</p>
                  <p className="text-[11px] text-[#7E8A93] mt-1.5 flex items-center gap-1"><PlayCircle className="w-3.5 h-3.5" /> {c.duration}</p>

                  {isOwned ? (
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#6B8E62] mb-2"><Check className="w-4 h-4" /> {tri("Sbloccato", "Freigeschaltet", "Unlocked")}</span>
                      <video data-testid={`academy-video-${c.id}`} src={owned[c.id]} controls playsInline className="w-full rounded-xl border border-[#D7E1DB] dark:border-[#38424B] bg-black" />
                    </div>
                  ) : (
                    <button data-testid={`academy-buy-${c.id}`} onClick={() => buy("course", c.id)} disabled={busy === c.id}
                      className="mt-3 w-full bg-[#5E8B7E] hover:bg-[#4C7368] text-white font-semibold py-2.5 rounded-xl active:scale-98 text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                      {busy === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                      {tri("Acquista e sblocca", "Kaufen & freischalten", "Buy & unlock")} · {euro(c.price_cents)}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Consulenza 1-to-1 */}
      {cat.consult && (
        <div data-testid="academy-consult">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[#6E8CA0] mb-3 flex items-center gap-2">
            <CalendarClock className="w-4 h-4" /> {tri("Consulenza 1-to-1", "1-zu-1-Beratung", "1-to-1 Consultation")}
          </h2>
          <div className="rounded-2xl bg-[#6E8CA0]/10 border border-[#6E8CA0]/30 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] leading-snug flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#5E8B7E]" /> {tri("Videochiamata su misura col Maestro per ricette, forni e produzione.", "Maßgeschneiderter Videocall mit dem Meister zu Rezepten, Öfen und Produktion.", "Tailored video call with the Master on recipes, ovens and production.")}
              </p>
              <span className="shrink-0 font-mono-data font-bold text-[#5E8B7E]">{euro(cat.consult.price_cents)}</span>
            </div>
            <p className="text-[11px] text-[#7E8A93] mt-1">{cat.consult.duration}</p>
            <div className="grid grid-cols-1 gap-2 mt-3">
              <input data-testid="consult-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={tri("Il tuo nome", "Dein Name", "Your name")}
                className="w-full bg-white dark:bg-[#1F252B] border border-[#D7E1DB] dark:border-[#38424B] rounded-xl px-3 py-2.5 text-sm outline-none text-[#2B303B] dark:text-[#EAF0EC]" />
              <div className="grid grid-cols-2 gap-2">
                <input data-testid="consult-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-white dark:bg-[#1F252B] border border-[#D7E1DB] dark:border-[#38424B] rounded-xl px-3 py-2.5 text-sm outline-none text-[#2B303B] dark:text-[#EAF0EC]" />
                <input data-testid="consult-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={tri("Telefono", "Telefon", "Phone")}
                  className="w-full bg-white dark:bg-[#1F252B] border border-[#D7E1DB] dark:border-[#38424B] rounded-xl px-3 py-2.5 text-sm outline-none text-[#2B303B] dark:text-[#EAF0EC]" />
              </div>
              <input data-testid="consult-topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder={tri("Argomento (es. panettone, forno…)", "Thema (z.B. Panettone, Ofen…)", "Topic (e.g. panettone, oven…)")}
                className="w-full bg-white dark:bg-[#1F252B] border border-[#D7E1DB] dark:border-[#38424B] rounded-xl px-3 py-2.5 text-sm outline-none text-[#2B303B] dark:text-[#EAF0EC]" />
              <button data-testid="consult-book-btn" onClick={bookConsult} disabled={busy === "consult"}
                className="w-full bg-[#6E8CA0] hover:bg-[#5E7E90] text-white font-semibold py-2.5 rounded-xl active:scale-98 text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {busy === "consult" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />}
                {tri("Prenota e paga", "Buchen & zahlen", "Book & pay")} · {euro(cat.consult.price_cents)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
