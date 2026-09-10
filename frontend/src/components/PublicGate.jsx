import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ArrowRight, Sparkles, GraduationCap, ShieldAlert, LogOut, LogIn, Share2 } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import LangSelector from "@/components/LangSelector";
import AvatarWorld3D from "@/components/AvatarWorld3D";
import AdminGate from "@/components/AdminGate";
import DowntimeTraining from "@/components/DowntimeTraining";
import AuthScreen from "@/components/AuthScreen";
import LegalPage from "@/sections/LegalPage";
import { api } from "@/lib/api";
import { toast } from "sonner";

const PUB = process.env.PUBLIC_URL;

// Multiverso pubblico read-only: chi non ha il PIN puo GUARDARE i 4 mondi e gli avatar,
// ma OGNI interazione porta al Muro del PIN (198505 · richiesta michelecip918@gmail.com).
export default function PublicGate({ onUnlock }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [showPin, setShowPin] = useState(false);
  const [guest, setGuest] = useState(false);
  const [world, setWorld] = useState("panificio");
  const [reqEmail, setReqEmail] = useState("");
  const [reqNote, setReqNote] = useState("");
  const [reqSent, setReqSent] = useState(false);
  const [reqBusy, setReqBusy] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [cookieOk, setCookieOk] = useState(() => { try { return !!localStorage.getItem("mikilab_cookie_ok"); } catch { return true; } });
  const acceptCookies = () => { try { localStorage.setItem("mikilab_cookie_ok", "1"); } catch { /* */ } setCookieOk(true); };

  // Allerta impianto: mostra l'occhio rosso del Nexus ai visitatori quando il laboratorio e' in stato critico.
  const [plantAlert, setPlantAlert] = useState(false);
  useEffect(() => {
    let stop = false;
    const check = () => api.get("/deck/status").then((r) => { if (!stop) setPlantAlert(r.data && r.data.mood === "critico"); }).catch(() => { /* */ });
    check();
    const t = setInterval(check, 20000);
    return () => { stop = true; clearInterval(t); };
  }, []);

  const shareUrl = "https://mikilab.de/";
  const doShare = async () => {
    const data = {
      title: "MikiLab Pro",
      text: tri("Scopri MikiLab Pro — il sistema operativo olografico per panificio, pizzeria e pasticceria.", "Entdecke MikiLab Pro.", "Discover MikiLab Pro — the holographic OS for bakery, pizzeria and pastry.", "Descubre MikiLab Pro.", "Découvre MikiLab Pro.", "MikiLab Pro را کشف کن."),
      url: shareUrl,
    };
    try { if (navigator.share) { await navigator.share(data); return; } } catch { return; }
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(tri("Link copiato! Condividilo dove vuoi.", "Link kopiert!", "Link copied! Share it anywhere.", "¡Enlace copiado!", "Lien copié !", "لینک کپی شد!"));
    } catch {
      toast.info(shareUrl);
    }
  };

  const sendRequest = async () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(reqEmail) || reqBusy) return;
    setReqBusy(true);
    try { await api.post("/public/access-request", { email: reqEmail, note: reqNote, lang }); setReqSent(true); }
    catch { setReqSent(true); }
    setReqBusy(false);
  };

  const handleUnlock = (level) => {
    if (level === "guest") { setGuest(true); setShowPin(false); }
    else { onUnlock(level); }
  };

  const WORLDS = [
    { id: "panificio", label: tri("Panificio", "Backstube", "Bakery", "Panadería", "Boulangerie", "نانوایی"), accent: "#FF6B00" },
    { id: "pizzeria", label: tri("Pizzeria", "Pizzeria", "Pizzeria", "Pizzería", "Pizzeria", "پیتزا"), accent: "#FFB800" },
    { id: "pasticceria", label: tri("Pasticceria", "Konditorei", "Pastry", "Pastelería", "Pâtisserie", "شیرینی"), accent: "#7FD8C0" },
    { id: "banco", label: tri("Magazzino", "Lager", "Warehouse", "Almacén", "Entrepôt", "انبار"), accent: "#64748B" },
  ];

  // Auto-tour dei mondi (viewing passivo, consentito)
  useEffect(() => {
    if (showPin) return;
    const t = setInterval(() => {
      setWorld((w) => { const idx = WORLDS.findIndex((x) => x.id === w); return WORLDS[(idx + 1) % WORLDS.length].id; });
    }, 8000);
    return () => clearInterval(t);
  }, [showPin]); // eslint-disable-line react-hooks/exhaustive-deps

  const AVATARS = [
    { img: "avatar_miki.jpg", c: "#64748B", n: "MikiLab", r: tri("Capo Supremo", "Oberster Chef", "Supreme Capo", "Capo Supremo", "Capo Suprême", "کاپوی برتر") },
    { img: "avatar_nexus.jpg", c: "#EAB308", n: "Sitor", r: tri("Dio dell'Arte Bianca", "Gott der Backkunst", "God of the White Art", "Dios del Arte Blanco", "Dieu de l'Art Blanc", "خدای هنر نان"), nexus: true },
  ];

  if (showPin) return <AdminGate onUnlock={handleUnlock} onBack={() => setShowPin(false)} />;

  if (guest) {
    return (
      <div data-testid="guest-view" className="relative min-h-screen bg-[#030712] text-white">
        <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-[#FF9D42]/15 bg-[#060A10]/85 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl overflow-hidden border border-[#FF9D42]/40 bg-[#060A10]"><img src={`${PUB}/logo-emblem.png`} alt="MikiLab" className="w-full h-full object-contain" /></span>
            <span className="leading-tight"><span className="block font-black tracking-[0.16em] text-base uppercase">MikiLab<span className="text-[#FF9D42]"> · Ospite</span></span><span className="block font-mono text-[8px] tracking-[0.28em] text-[#FF9D42]/70 uppercase">Guest Access · Training</span></span>
          </div>
          <div className="flex items-center gap-2">
            <LangSelector testid="guest-lang" />
            <button data-testid="guest-exit" onClick={() => { setGuest(false); }} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0C1019] border border-[#1e293b] text-[#f87171] text-xs font-bold active:scale-95"><LogOut className="w-3.5 h-3.5" /> {tri("Esci", "Abmelden", "Exit", "Salir", "Quitter", "خروج")}</button>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#FF9D42]/10 border border-[#FF9D42]/40 flex items-center justify-center"><GraduationCap className="w-6 h-6 text-[#FF9D42]" /></div>
            <div><h1 className="font-cyber text-lg font-black uppercase tracking-wide">{tri("Formazione autorizzata", "Autorisierte Schulung", "Authorized Training", "Formación autorizada", "Formation autorisée", "آموزش مجاز")}</h1><p className="text-[11px] text-[#94A3B8]">{tri("Accesso ospite abilitato dal Capo Supremo per la formazione.", "Gastzugang vom Obersten Chef für die Schulung freigegeben.", "Guest access enabled by the Supreme Capo for training.", "Acceso invitado habilitado por el Capo Supremo.", "Accès invité activé par le Capo Suprême.", "دسترسی مهمان توسط کاپو فعال شد.")}</p></div>
          </div>
          <div className="holo-panel p-5">
            <DowntimeTraining />
          </div>
          <div data-testid="guest-barrier" className="rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/8 p-4 flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-[#f59e0b] shrink-0 mt-0.5" />
            <p className="text-[12px] text-[#d7c9a8] leading-relaxed">{tri(
              "Le funzioni supreme (produzione, ricettario completo, sintesi sub-molecolare, plancia) sono riservate: è richiesto il profilo di MikiLab.",
              "Die höchsten Funktionen sind reserviert: das MikiLab-Profil ist erforderlich.",
              "Supreme functions (production, full recipe book, sub-molecular synthesis, console) are reserved: the MikiLab profile is required.",
              "Las funciones supremas están reservadas: se requiere el perfil de MikiLab.",
              "Les fonctions suprêmes sont réservées : le profil MikiLab est requis.",
              "توابع برتر محفوظ‌اند: پروفایل MikiLab لازم است.")}</p>
          </div>
        </main>
      </div>
    );
  }

  const cur = WORLDS.find((w) => w.id === world) || WORLDS[0];

  return (
    <div data-testid="public-gate" className="relative min-h-screen overflow-hidden bg-[#030712] text-white">
      {/* MULTIVERSO 3D di sfondo */}
      <div className="absolute inset-0 z-0 opacity-90">
        <AvatarWorld3D theme={world} accent={cur.accent} />
      </div>
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[#030712]/70 via-[#030712]/35 to-[#030712]/95 pointer-events-none" />

      {/* HEADER */}
      <header className="relative z-20 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-xl overflow-hidden border border-[#FF6B00]/40 shadow-[0_0_16px_rgba(255,107,0,0.25)] bg-[#060A10]">
            <img src={`${PUB}/logo-emblem.png`} alt="MikiLab Pro" className="w-full h-full object-contain" />
          </span>
          <span className="leading-tight">
            <span className="block font-black tracking-[0.18em] text-lg sm:text-xl uppercase">MikiLab<span className="text-[#FF6B00]"> Pro</span></span>
            <span className="block font-mono text-[8.5px] tracking-[0.3em] text-[#FF6B00]/70 uppercase">Holographic Command OS</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button data-testid="public-share-btn" onClick={doShare} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0b0f19]/80 border border-[#FF6B00]/40 text-[#FF6B00] text-xs font-bold hover:border-[#FF6B00] active:scale-95 transition-all backdrop-blur-md">
            <Share2 className="w-3.5 h-3.5" /> {tri("Condividi", "Teilen", "Share", "Compartir", "Partager", "اشتراک")}
          </button>
          <button data-testid="public-login-btn" onClick={() => setShowAuth(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0b0f19]/80 border border-[#D95200]/40 text-[#D95200] text-xs font-bold hover:border-[#D95200] active:scale-95 transition-all backdrop-blur-md">
            <LogIn className="w-3.5 h-3.5" /> {tri("Accedi", "Anmelden", "Sign in", "Entrar", "Connexion", "ورود")}
          </button>
          <LangSelector testid="public-lang" />
        </div>
      </header>
      {showAuth && <AuthScreen onClose={() => setShowAuth(false)} initialMode="login" />}

      <div className="relative z-10 flex flex-col items-center justify-center px-5 pt-2 pb-28 text-center min-h-[calc(100vh-72px)]">
        {/* Selettore mondi (viewing passivo) */}
        <div data-testid="public-world-tabs" className="flex flex-wrap items-center justify-center gap-2 mb-6">
          {WORLDS.map((w) => (
            <button key={`world-${w.id}`} data-testid={`public-world-${w.id}`} onClick={() => setWorld(w.id)}
              className="px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-all active:scale-95"
              style={world === w.id
                ? { background: w.accent, color: "#030712", borderColor: w.accent, boxShadow: `0 0 18px ${w.accent}66` }
                : { background: "rgba(11,15,25,0.6)", color: "#94A3B8", borderColor: "#1e293b" }}>
              {w.label}
            </button>
          ))}
        </div>

        {/* TRIO avatar — Sitor centrale e speciale */}
        <div data-testid="public-avatars" className="flex items-end justify-center gap-4 sm:gap-8 mb-7">
          {AVATARS.map((a, i) => (
            <motion.button key={`av-${a.n}`} data-testid={`public-avatar-${a.n.toLowerCase().replace(/[^a-z]/g, "")}`}
              onClick={() => setShowPin(true)}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i, duration: 0.55 }}
              className="group flex flex-col items-center gap-2 active:scale-95 transition-transform">
              <div className="relative">
                {a.nexus && (
                  <>
                    <span className="nexus-ring nexus-ring-1" style={{ borderColor: "#EAB308" }} />
                    <span className="nexus-ring nexus-ring-2" style={{ borderColor: "#FF6B00" }} />
                    <span className="absolute -inset-4 rounded-full blur-2xl" style={{ background: "radial-gradient(circle, rgba(246,210,122,0.55), rgba(255,107,0,0.25) 55%, transparent 72%)" }} />
                  </>
                )}
                <div className="relative rounded-full overflow-hidden bg-[#030712]"
                  style={{
                    width: a.nexus ? 132 : 84, height: a.nexus ? 132 : 84,
                    border: `3px solid ${a.c}`,
                    boxShadow: a.nexus ? `0 0 46px ${a.c}, 0 0 90px rgba(255,107,0,0.35)` : `0 0 22px ${a.c}66`,
                  }}>
                  <img src={`${PUB}/${a.img}`} alt={a.n} className="w-full h-full object-cover object-top" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  {a.nexus && plantAlert && (
                    <>
                      <span data-testid="gate-nexus-red-eye" className="absolute rounded-full animate-ping" style={{ left: "63%", top: "33%", width: 18, height: 18, background: "rgba(244,63,94,0.85)", boxShadow: "0 0 14px 5px rgba(244,63,94,0.85)", transform: "translate(-50%,-50%)" }} />
                      <span className="absolute rounded-full animate-pulse" style={{ left: "63%", top: "33%", width: 12, height: 12, background: "#ff1f3d", boxShadow: "0 0 12px 4px rgba(255,31,61,0.9)", transform: "translate(-50%,-50%)" }} />
                    </>
                  )}
                </div>
              </div>
              <span className="font-black text-xs sm:text-sm" style={{ color: a.c }}>{a.n}</span>
              <span className="text-[9.5px] uppercase tracking-wider text-[#94A3B8] max-w-[92px] leading-tight">{a.r}</span>
            </motion.button>
          ))}
        </div>

        {/* Gerarchia */}
        <p data-testid="public-hierarchy" className="font-mono text-[10px] sm:text-[11px] tracking-[0.25em] text-[#64748B] uppercase mb-5">
          MikiLab <span className="text-[#EAB308]">→</span> Sitor
        </p>

        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="font-black tracking-[0.14em] text-2xl sm:text-4xl uppercase max-w-2xl">
          {tri("Il Multiverso della Panificazione", "Das Multiversum des Backens", "The Baking Multiverse", "El Multiverso de la Panificación", "Le Multivers de la Boulangerie", "چندجهانی نان‌پزی")}
        </motion.h1>
        <p className="mt-3 max-w-md text-sm text-[#CBD5E1] leading-relaxed">
          {tri(
            "Sei un ospite. Esplora liberamente i reparti e gli avatar. Ogni interazione richiede un PIN.",
            "Du bist Gast. Erkunde frei die Bereiche und Avatare. Jede Interaktion erfordert einen PIN.",
            "You are a guest. Explore the departments and avatars freely. Any interaction requires a PIN.",
            "Eres un invitado. Explora libremente las áreas y avatares. Toda interacción requiere un PIN.",
            "Tu es invité. Explore librement les ateliers et les avatars. Toute interaction requiert un PIN.",
            "تو مهمان هستی. بخش‌ها و آواتارها را آزادانه ببین. هر تعامل به پین نیاز دارد.")}
        </p>

        <button data-testid="public-enter-btn" onClick={() => setShowPin(true)}
          className="mt-7 inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-black text-base text-[#030712] active:scale-95 transition-all"
          style={{ background: "linear-gradient(90deg,#FF6B00,#FF9D42)", boxShadow: "0 0 26px rgba(255,107,0,0.45)" }}>
          <Lock className="w-4 h-4" /> {tri("Entra con il PIN", "Mit PIN eintreten", "Enter with PIN", "Entrar con PIN", "Entrer avec le PIN", "ورود با پین")} <ArrowRight className="w-4 h-4" />
        </button>

        <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-[#64748B]">
          <Sparkles className="w-3.5 h-3.5 text-[#EAB308]" />
          {tri("Serve un accesso? Scrivi a", "Zugang nötig? Schreib an", "Need access? Write to", "¿Necesitas acceso? Escribe a", "Besoin d'accès ? Écris à", "دسترسی می‌خواهی؟ بنویس به")}
          <a href="mailto:michelecip918@gmail.com?subject=Richiesta%20accesso%20MikiLab" data-testid="public-email" className="font-bold text-[#D95200] hover:text-[#FF8533]">michelecip918@gmail.com</a>
        </div>

        {/* Fase 2 · Richiesta accesso — smistata da Sitor */}
        <div data-testid="access-request" className="mt-5 w-full max-w-sm rounded-2xl bg-[#0b0f19]/80 border border-[#1e293b] p-4 backdrop-blur-md">
          {reqSent ? (
            <p data-testid="access-sent" className="text-[12.5px] text-[#22c55e] leading-snug">✓ {tri(
              "Richiesta inviata. Sitor la smisterà e il Capo deciderà l'accesso.",
              "Anfrage gesendet. Sitor sortiert sie, der Chef entscheidet.",
              "Request sent. Sitor will route it and the Capo will decide.",
              "Solicitud enviada. Sitor la clasificará.",
              "Demande envoyée. Sitor la triera.",
              "درخواست ارسال شد. محمد آن را بررسی می‌کند.")}</p>
          ) : (
            <>
              <p className="text-[11px] font-bold text-[#94A3B8] mb-2 text-left">{tri("Richiedi l'accesso dal portale", "Zugang anfragen", "Request access from the portal", "Solicitar acceso", "Demander l'accès", "درخواست دسترسی")}</p>
              <input data-testid="access-email" type="email" value={reqEmail} onChange={(e) => setReqEmail(e.target.value)} placeholder={tri("La tua email", "Deine E-Mail", "Your email", "Tu email", "Ton email", "ایمیل شما")}
                className="w-full rounded-lg bg-[#060A10] border border-[#1e293b] text-white text-sm px-3 py-2 mb-2 focus:border-[#D95200] outline-none" />
              <input data-testid="access-note" value={reqNote} onChange={(e) => setReqNote(e.target.value)} placeholder={tri("Motivo (opzionale)", "Grund (optional)", "Reason (optional)", "Motivo (opcional)", "Motif (option)", "دلیل")}
                className="w-full rounded-lg bg-[#060A10] border border-[#1e293b] text-white text-sm px-3 py-2 mb-2 focus:border-[#D95200] outline-none" />
              <button data-testid="access-send" onClick={sendRequest} disabled={reqBusy}
                className="w-full py-2 rounded-lg font-bold text-sm text-[#060A10] active:scale-95 transition-all disabled:opacity-50" style={{ background: "linear-gradient(90deg,#D95200,#FF9D42)" }}>
                {reqBusy ? tri("Invio…", "Senden…", "Sending…", "Enviando…", "Envoi…", "ارسال…") : tri("Invia richiesta", "Anfrage senden", "Send request", "Enviar", "Envoyer", "ارسال")}
              </button>
            </>
          )}
        </div>

        {/* Vetrina pubblica — concisa: dettaglio dietro "Scopri di più" (niente muri di testo) */}
        <div className="mt-8">
          <button data-testid="public-more-toggle" onClick={() => setShowMore((v) => !v)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider border border-[#FF6B00]/40 text-[#FF9D42] bg-[#0b0f19]/70 backdrop-blur-md hover:border-[#FF6B00] active:scale-95 transition-all">
            {showMore
              ? tri("Mostra meno", "Weniger anzeigen", "Show less", "Mostrar menos", "Voir moins", "کمتر")
              : tri("Scopri di più su MikiLab Pro", "Mehr über MikiLab Pro", "Discover more about MikiLab Pro", "Descubre más", "En savoir plus", "بیشتر بدانید")}
          </button>
        </div>

        {showMore && (
        <section data-testid="public-vetrina" className="mt-6 w-full max-w-3xl text-left">
          <div className="rounded-2xl overflow-hidden border border-[#FF6B00]/25 shadow-[0_0_40px_rgba(255,107,0,0.15)] mb-6">
            <img src={`${PUB}/multiverse-banner.jpg`} alt={tri("MikiLab Pro — il multiverso olografico dei reparti di panificazione", "MikiLab Pro — das holografische Multiversum", "MikiLab Pro — the holographic bakery multiverse", "MikiLab Pro — el multiverso holográfico", "MikiLab Pro — le multivers holographique", "چندجهانی هولوگرافیک MikiLab Pro")} className="w-full h-auto block" loading="lazy" data-testid="vetrina-banner" />
          </div>
          <h2 className="text-base md:text-lg font-black text-white uppercase tracking-wide text-center">{tri(
            "Cos'è MikiLab Pro", "Was ist MikiLab Pro", "What is MikiLab Pro", "Qué es MikiLab Pro", "Qu'est-ce que MikiLab Pro", "MikiLab Pro چیست")}</h2>
          <p className="mt-2 text-sm text-[#CBD5E1] leading-relaxed text-center max-w-2xl mx-auto">{tri(
            "MikiLab Pro è il sistema operativo olografico per panificio, pizzeria e pasticceria. Unisce un multiverso 3D dei reparti, l'IA operativa Sitor e la coscienza strategica Sitor per gestire ricette, produzione, formazione e food cost — in un'unica interfaccia ad alta tecnologia.",
            "MikiLab Pro ist das holografische Betriebssystem für Backstube, Pizzeria und Konditorei: 3D-Multiversum, operative KI Sitor und strategische Instanz Sitor für Rezepte, Produktion, Schulung und Food Cost.",
            "MikiLab Pro is the holographic operating system for bakery, pizzeria and pastry: a 3D multiverse of departments, the Sitor operational AI and the Sitor strategic consciousness for recipes, production, training and food cost.",
            "MikiLab Pro es el sistema operativo holográfico para panadería, pizzería y pastelería: multiverso 3D, IA Sitor y Sitor para recetas, producción, formación y food cost.",
            "MikiLab Pro est le système d'exploitation holographique pour boulangerie, pizzeria et pâtisserie : multivers 3D, IA Sitor et Sitor pour recettes, production, formation et food cost.",
            "MikiLab Pro سیستم‌عامل هولوگرافیک برای نانوایی، پیتزا و شیرینی است.")}</p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { t: tri("Ricettario Vivente", "Lebendes Rezeptbuch", "Living Recipe Book", "Recetario Vivo", "Livre Vivant", "دستورنامه زنده"), d: tri("Detta un obiettivo, Sitor calcola matrice e curva di maturazione.", "Ziel nennen, Sitor rechnet.", "Set a goal, Sitor computes the matrix and maturation curve.", "Fija un objetivo y Sitor calcula.", "Fixe un objectif, Sitor calcule.", "هدف بده تا محاسبه شود."), c: "#EAB308" },
              { t: tri("Produzione con l'IA", "KI-Produktion", "AI Production", "Producción con IA", "Production IA", "تولید با هوش"), d: tri("Piani, turni e food cost gestiti da Sitor in tempo reale.", "Pläne, Schichten, Food Cost von Sitor.", "Plans, shifts and food cost run by Sitor in real time.", "Planes, turnos y food cost por Sitor.", "Plans, équipes et food cost par Sitor.", "برنامه و شیفت با Sitor."), c: "#FF6B00" },
              { t: tri("Formazione & Multiverso 3D", "Schulung & 3D", "Training & 3D Multiverse", "Formación & 3D", "Formation & 3D", "آموزش و ۳بعدی"), d: tri("Corsi interattivi per ricetta e un multiverso 3D immersivo dei reparti.", "Interaktive Kurse und 3D-Multiversum.", "Interactive per-recipe courses and an immersive 3D multiverse.", "Cursos interactivos y multiverso 3D.", "Cours interactifs et multivers 3D.", "دوره‌های تعاملی و چندجهانی."), c: "#FF9D42" },
            ].map((f) => (
              <div key={f.t} className="rounded-xl bg-[#0b0f19]/70 border border-[#1e293b] p-4 backdrop-blur-md">
                <p className="text-sm font-black" style={{ color: f.c }}>{f.t}</p>
                <p className="mt-1 text-[12px] text-[#CBD5E1] leading-snug">{f.d}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-[11px] text-[#64748B]">{tri(
            "Panificio · Pizzeria · Pasticceria · Magazzino — in italiano, tedesco, inglese, spagnolo e francese.",
            "Backstube · Pizzeria · Konditorei · Lager — in fünf Sprachen.",
            "Bakery · Pizzeria · Pastry · Warehouse — in five languages.",
            "Panadería · Pizzería · Pastelería · Almacén — en cinco idiomas.",
            "Boulangerie · Pizzeria · Pâtisserie · Entrepôt — en cinq langues.",
            "نانوایی · پیتزا · شیرینی · انبار")}</p>

          <div className="mt-7 flex flex-col items-center gap-2">
            <button data-testid="vetrina-share-btn" onClick={doShare}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-black text-sm text-[#030712] active:scale-95 transition-all"
              style={{ background: "linear-gradient(90deg,#FF6B00,#FF9D42)", boxShadow: "0 0 22px rgba(255,107,0,0.4)" }}>
              <Share2 className="w-4 h-4" /> {tri("Condividi MikiLab", "MikiLab teilen", "Share MikiLab", "Compartir MikiLab", "Partager MikiLab", "اشتراک MikiLab")}
            </button>
            <p className="text-[11px] text-[#64748B]">{tri(
              "Fai conoscere il laboratorio: condividi mikilab.de",
              "Teile mikilab.de",
              "Spread the word: share mikilab.de",
              "Comparte mikilab.de",
              "Partage mikilab.de",
              "mikilab.de را به اشتراک بگذار")}</p>
          </div>
        </section>
        )}

        {/* Footer legale (GDPR / Impressum) */}
        <footer data-testid="public-legal-footer" className="mt-10 mb-4 w-full max-w-3xl flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono-data text-[10px] tracking-widest uppercase text-[#64748B]">
          <button data-testid="public-impressum-btn" onClick={() => setLegalOpen(true)} className="hover:text-[#FF6B00] transition-colors">Impressum</button>
          <button data-testid="public-privacy-btn" onClick={() => setLegalOpen(true)} className="hover:text-[#FF6B00] transition-colors">{tri("Privacy (GDPR)", "Datenschutz (DSGVO)", "Privacy (GDPR)", "Privacidad (RGPD)", "Confidentialité (RGPD)", "حریم خصوصی")}</button>
          <button data-testid="public-cookies-btn" onClick={() => setLegalOpen(true)} className="hover:text-[#FF6B00] transition-colors">Cookies</button>
          <span className="text-[#334155]">© 2026 {tri("Michele Signorella · mikilab.de", "Michele Signorella · mikilab.de", "Michele Signorella · mikilab.de", "Michele Signorella · mikilab.de", "Michele Signorella · mikilab.de", "mikilab.de")}</span>
        </footer>

      </div>

      {/* Banner cookie informativo (solo cookie tecnici) */}
      {!cookieOk && (
        <div data-testid="cookie-notice" className="fixed bottom-4 left-4 right-4 sm:left-auto sm:max-w-sm z-50 rounded-xl border border-[#FF6B00]/30 bg-[#0D1520]/95 backdrop-blur px-4 py-3 shadow-2xl">
          <p className="text-xs text-[#CBD5E1] leading-snug">{tri(
            "Questo sito usa solo cookie tecnici necessari al funzionamento. Nessun tracciamento.",
            "Diese Seite verwendet nur technisch notwendige Cookies. Kein Tracking.",
            "This site uses only technical cookies required for operation. No tracking.",
            "Este sitio usa solo cookies técnicas necesarias. Sin rastreo.",
            "Ce site utilise uniquement des cookies techniques nécessaires. Aucun suivi.",
            "این سایت فقط کوکی‌های فنی لازم را استفاده می‌کند. بدون ردیابی.")}</p>
          <div className="mt-2.5 flex items-center gap-2">
            <button data-testid="cookie-accept-btn" onClick={acceptCookies} className="px-4 py-1.5 rounded-full text-[11px] font-bold text-[#060A10] active:scale-95" style={{ background: "linear-gradient(90deg,#FF6B00,#FF9D42)" }}>OK</button>
            <button data-testid="cookie-info-btn" onClick={() => setLegalOpen(true)} className="px-4 py-1.5 rounded-full text-[11px] font-bold border border-[#64748B]/40 text-[#CBD5E1] hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors">{tri("Info", "Info", "Info", "Info", "Info", "اطلاعات")}</button>
          </div>
        </div>
      )}

      {/* Pagina legale (modale) */}
      {legalOpen && (
        <div data-testid="public-legal-modal" className="fixed inset-0 z-[60] bg-[#060A10] overflow-auto p-4">
          <div className="max-w-xl mx-auto py-5">
            <button data-testid="public-legal-close" onClick={() => setLegalOpen(false)} className="mb-4 text-sm font-semibold text-[#FF6B00]">← {tri("Chiudi", "Schließen", "Close", "Cerrar", "Fermer", "بستن")}</button>
            <LegalPage />
          </div>
        </div>
      )}
    </div>
  );
}
