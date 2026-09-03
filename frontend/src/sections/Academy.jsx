import { useEffect, useState, useCallback } from "react";
import { GraduationCap, PlayCircle, Check, CalendarClock, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import WhatsAppHelp from "@/components/WhatsAppHelp";
import { mkTri } from "@/i18n/triMaps";

const euro = (cents) => "€ " + (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);

export default function Academy() {
  const { lang } = useLang();
  const { user, setAuthOpen } = useAuth();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
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

  const title = (c) => (lang === "de" ? c.title_de : (lang === "en" || lang === "es") ? c.title_en : c.title) || c.title;
  const desc = (c) => (lang === "de" ? c.desc_de : (lang === "en" || lang === "es") ? c.desc_en : c.desc) || c.desc;
  const dur = (c) => (lang === "de" ? c.duration_de : (lang === "en" || lang === "es") ? c.duration_en : c.duration) || c.duration;

  return (
    <div data-testid="academy-page" className="pb-4 space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-[#F26419] to-[#F26419] text-white p-7 text-center shadow-xl">
        <GraduationCap className="w-12 h-12 mx-auto mb-2" />
        <h1 className="font-display text-3xl font-bold">{tri("Academy & Servizi", "Academy & Services", "Academy & Services")}</h1>
        <p className="text-white/85 text-sm mt-2">
          {tri("Corsi video del Maestro e consulenze 1-to-1 su misura.", "Video-Kurse vom Meister und maßgeschneiderte 1-zu-1-Beratungen.", "The Master's video courses and tailored 1-to-1 consultations.")}
        </p>
      </div>

      {/* Corsi */}
      <div>
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[#F26419] mb-3 flex items-center gap-2">
          <GraduationCap className="w-4 h-4" /> {tri("Corsi Video", "Video-Kurse", "Video Courses")}
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {cat.courses.map((c) => {
            const isOwned = !!owned[c.id];
            return (
              <div key={c.id} data-testid={`academy-course-${c.id}`} className="rounded-2xl bg-white dark:bg-[#18202E] border border-[#26324A] dark:border-[#26324A] shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8]">{title(c)}</h3>
                    <span className="shrink-0 font-mono-data font-bold text-[#F26419]">{euro(c.price_cents)}</span>
                  </div>
                  <p className="text-sm text-[#7E8A93] mt-1 leading-snug">{desc(c)}</p>
                  <p className="text-[11px] text-[#7E8A93] mt-1.5 flex items-center gap-1"><PlayCircle className="w-3.5 h-3.5" /> {dur(c)}</p>

                  {isOwned ? (
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#F26419] mb-2"><Check className="w-4 h-4" /> {tri("Sbloccato", "Freigeschaltet", "Unlocked")}</span>
                      <video data-testid={`academy-video-${c.id}`} src={owned[c.id]} controls playsInline className="w-full rounded-2xl shadow-md border border-amber-900/40 border border-[#26324A] dark:border-[#26324A] bg-black" />
                    </div>
                  ) : (
                    <div data-testid={`academy-course-soon-${c.id}`} className="mt-3 w-full bg-[#F26419]/12 border border-[#F26419]/30 text-[#F26419] dark:text-[#a9d2ec] font-semibold py-2.5 rounded-2xl shadow-md border border-amber-900/40 text-sm flex items-center justify-center gap-2">
                      <CalendarClock className="w-4 h-4" /> {tri("In arrivo · presto disponibile", "Bald verfügbar", "Coming soon")}
                    </div>
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
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[#F26419] mb-3 flex items-center gap-2">
            <CalendarClock className="w-4 h-4" /> {tri("Consulenza 1-to-1", "1-zu-1-Beratung", "1-to-1 Consultation")}
          </h2>
          <div className="rounded-2xl bg-[#F26419]/10 border border-[#F26419]/30 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] leading-snug flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#F26419]" /> {tri("Videochiamata su misura col Maestro per ricette, forni e produzione.", "Maßgeschneiderter Videocall mit dem Meister zu Rezepten, Öfen und Produktion.", "Tailored video call with the Master on recipes, ovens and production.")}
              </p>
              <span className="shrink-0 font-mono-data font-bold text-[#F26419]">{euro(cat.consult.price_cents)}</span>
            </div>
            <p className="text-[11px] text-[#7E8A93] mt-1">{dur(cat.consult)}</p>
            <div className="grid grid-cols-1 gap-2 mt-3">
              <input data-testid="consult-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={tri("Il tuo nome", "Dein Name", "Your name")}
                className="w-full bg-white dark:bg-[#18202E] border border-[#26324A] dark:border-[#26324A] rounded-2xl shadow-md border border-amber-900/40 px-3 py-2.5 text-sm outline-none text-[#2B303B] dark:text-[#e4eff8]" />
              <div className="grid grid-cols-2 gap-2">
                <input data-testid="consult-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-white dark:bg-[#18202E] border border-[#26324A] dark:border-[#26324A] rounded-2xl shadow-md border border-amber-900/40 px-3 py-2.5 text-sm outline-none text-[#2B303B] dark:text-[#e4eff8]" />
                <input data-testid="consult-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={tri("Telefono", "Telefon", "Phone")}
                  className="w-full bg-white dark:bg-[#18202E] border border-[#26324A] dark:border-[#26324A] rounded-2xl shadow-md border border-amber-900/40 px-3 py-2.5 text-sm outline-none text-[#2B303B] dark:text-[#e4eff8]" />
              </div>
              <input data-testid="consult-topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder={tri("Argomento (es. panettone, forno…)", "Thema (z.B. Panettone, Ofen…)", "Topic (e.g. panettone, oven…)")}
                className="w-full bg-white dark:bg-[#18202E] border border-[#26324A] dark:border-[#26324A] rounded-2xl shadow-md border border-amber-900/40 px-3 py-2.5 text-sm outline-none text-[#2B303B] dark:text-[#e4eff8]" />
              <button data-testid="consult-book-btn" onClick={bookConsult} disabled={busy === "consult"}
                className="w-full bg-[#F26419] hover:bg-[#8C6B4A] text-white font-semibold py-2.5 rounded-2xl shadow-md border border-amber-900/40 active:scale-98 text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {busy === "consult" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />}
                {tri("Prenota e paga", "Buchen & zahlen", "Book & pay")} · {euro(cat.consult.price_cents)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info corsi via WhatsApp (contestuale) */}
      <WhatsAppHelp context="corsi" />
    </div>
  );
}
