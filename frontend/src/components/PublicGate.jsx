import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, GraduationCap, ShieldAlert, LogOut, LogIn, BookOpen } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import LangSelector from "@/components/LangSelector";
import AvatarWorld3D from "@/components/AvatarWorld3D";
import AdminGate from "@/components/AdminGate";
import FaceCheckIn from "@/components/FaceCheckIn";
import DowntimeTraining from "@/components/DowntimeTraining";
import LivingAvatar3D from "@/components/LivingAvatar3D";
import GuidaMikiLab from "@/components/GuidaMikiLab";
import AuthScreen from "@/components/AuthScreen";
import LegalPlaceholder from "@/components/LegalPlaceholder";
import { PrivacyNotice, NotForSaleNote } from "@/components/PrivacyNotice";
import { api, facesApi } from "@/lib/api";
import { activityProfile as gateActivityProfile } from "@/lib/activityProfile";
import { playTTS, isTTSMuted } from "@/lib/tts";
import { toast } from "sonner";

const PUB = process.env.PUBLIC_URL;

// Multiverso pubblico read-only: chi non ha il PIN puo GUARDARE i 4 mondi e gli avatar,
// ma OGNI interazione porta al Muro del PIN (richiesta accesso: michelecip918@gmail.com).
export default function PublicGate({ onUnlock }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [showPin, setShowPin] = useState(false);
  const [gateRole, setGateRole] = useState(null);
  const [guest, setGuest] = useState(false);
  // Rientro rapido operaio: col volto o col nome, senza PIN (dalla 2a volta in poi).
  const [opFlow, setOpFlow] = useState(null); // null | "pick" | "fast"
  const [opName, setOpName] = useState("");
  const [faces, setFaces] = useState([]);
  useEffect(() => { facesApi.publicList().then((d) => setFaces(Array.isArray(d.faces) ? d.faces : [])).catch(() => {}); }, []);
  const [world, setWorld] = useState("panificio");
  const [reqEmail, setReqEmail] = useState("");
  const [reqNote, setReqNote] = useState("");
  const [reqSent, setReqSent] = useState(false);
  const [reqBusy, setReqBusy] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
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

  const enterAs = (role) => {
    setGateRole(role);
    if (role === "operator") {
      setOpFlow("pick");
      if (!isTTSMuted()) {
        const m = tri(
          "Perfetto, ti porto in produzione. Sei già stato qui? Tocca il tuo volto o scrivi il tuo nome. Altrimenti entra con il PIN.",
          "Perfekt, ab in die Produktion. Warst du schon hier? Tippe dein Gesicht oder deinen Namen. Sonst mit PIN.",
          "Great, taking you to production. Been here before? Tap your face or type your name. Otherwise enter your PIN.",
          "Perfecto, te llevo a producción. ¿Ya estuviste aquí? Toca tu rostro o escribe tu nombre. Si no, usa el PIN.",
          "Parfait, direction la production. Déjà venu ? Touche ton visage ou écris ton nom. Sinon, entre le PIN.",
          "عالی، تو را به تولید می‌برم. قبلاً اینجا بوده‌ای؟ چهره یا نامت را بزن. وگرنه با پین وارد شو.");
        try { playTTS(m, { lang, voice: "mikemix" }); } catch { /* */ }
      }
    } else {
      setShowPin(true);
    }
  };

  // Entrata rapida in produzione senza PIN: per operai già registrati (volto o nome).
  const fastEnter = (name) => {
    const nm = String(name || "").trim(); if (!nm) return;
    let lvl = "novizio";
    try { lvl = localStorage.getItem("mikilab_op_level") || "novizio"; } catch { /* */ }
    try {
      localStorage.setItem("mikilab_role", nm);
      localStorage.setItem("mikilab_mode", "floor");
      localStorage.setItem("mikilab_pin_enabled", "1");
      localStorage.setItem("mikilab_pin_unlocked", "1");
      localStorage.setItem("mikilab_op_level", lvl);
    } catch { /* */ }
    if (!isTTSMuted()) {
      const m = tri(`Bentornato, ${nm}! Ecco il tuo lavoro di oggi.`, `Willkommen zurück, ${nm}!`, `Welcome back, ${nm}!`, `¡Bienvenido de nuevo, ${nm}!`, `Rebonjour, ${nm} !`, `${nm}! خوش برگشتی`);
      try { playTTS(m, { lang, voice: "mikemix" }); } catch { /* */ }
    }
    onUnlock({ mode: "floor", name: nm, level: lvl });
  };

  const sendRequest = async () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(reqEmail) || reqBusy) return;
    setReqBusy(true);
    try { await api.post("/public/access-request", { email: reqEmail, note: reqNote, lang }); setReqSent(true); }
    catch { setReqSent(true); }
    setReqBusy(false);
  };

  const handleUnlock = (level, res) => {
    if (level === "guest") { setGuest(true); setShowPin(false); }
    else if (level === "operator") { onUnlock({ mode: "floor", name: (res && res.name) || "", level: (res && res.operator_level) || "novizio" }); }
    else { onUnlock({ mode: "capo" }); }
  };

  const WORLDS = [
    { id: "panificio", label: tri("Panificio", "Backstube", "Bakery", "Panadería", "Boulangerie", "نانوایی"), accent: "hsl(var(--muted-foreground))" },
    { id: "pizzeria", label: tri("Pizzeria", "Pizzeria", "Pizzeria", "Pizzería", "Pizzeria", "پیتزا"), accent: "hsl(var(--muted-foreground))" },
    { id: "pasticceria", label: tri("Pasticceria", "Konditorei", "Pastry", "Pastelería", "Pâtisserie", "شیرینی"), accent: "hsl(var(--muted-foreground))" },
    { id: "banco", label: tri("Magazzino", "Lager", "Warehouse", "Almacén", "Entrepôt", "انبار"), accent: "hsl(var(--muted-foreground))" },
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
    { img: "avatar_miki.jpg", c: "hsl(var(--primary))", n: "MikiLab" },
    { img: "sitor_official.jpg", c: "hsl(var(--muted-foreground))", n: "Sitor", r: tri("Dio dell'Arte Bianca", "Gott der Backkunst", "God of the White Art", "Dios del Arte Blanco", "Dieu de l'Art Blanc", "خدای هنر نان"), nexus: true },
  ];

  if (showPin) return <AdminGate onUnlock={handleUnlock} role={gateRole} onBack={() => { setShowPin(false); setGateRole(null); }} />;

  if (guest) {
    return (
      <div data-testid="guest-view" className="relative min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-border/15 bg-background/85 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl overflow-hidden border border-border/40 bg-background"><img src={`${PUB}/logo-emblem.png`} alt="MikiLab" className="w-full h-full object-cover" /></span>
            <span className="leading-tight"><span className="block font-black tracking-[0.16em] text-base uppercase">MikiLab<span className="text-muted-foreground"> · Ospite</span></span><span className="block font-mono text-[8px] tracking-[0.28em] text-muted-foreground/70 uppercase">Guest Access · Training</span></span>
          </div>
          <div className="flex items-center gap-2">
            <LangSelector testid="guest-lang" />
            <button data-testid="guest-exit" onClick={() => { setGuest(false); }} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-background border border-border text-mattone text-xs font-bold active:scale-95"><LogOut className="w-3.5 h-3.5" /> {tri("Esci", "Abmelden", "Exit", "Salir", "Quitter", "خروج")}</button>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-muted/10 border border-border/40 flex items-center justify-center"><GraduationCap className="w-6 h-6 text-muted-foreground" /></div>
            <div><h1 className="font-display text-lg font-black uppercase tracking-wide">{tri("Formazione autorizzata", "Autorisierte Schulung", "Authorized Training", "Formación autorizada", "Formation autorisée", "آموزش مجاز")}</h1><p className="text-[11px] text-muted-foreground">{tri("Accesso ospite abilitato dalla Direzione per la formazione.", "Gastzugang von der Direktion für die Schulung freigegeben.", "Guest access enabled by Management for training.", "Acceso de invitado habilitado por Dirección para la formación.", "Accès invité activé par la Direction pour la formation.", "دسترسی مهمان توسط مدیریت فعال شد.")}</p></div>
          </div>
          <div className="holo-panel p-5">
            <DowntimeTraining />
          </div>
          <div data-testid="guest-barrier" className="rounded-xl border border-border/30 bg-muted/8 p-4 flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[12px] text-foreground leading-relaxed">{tri(
              "Le funzioni complete (produzione, ricettario e console di gestione) sono riservate alla Direzione: è richiesto l'accesso con profilo MikiLab.",
              "Die vollständigen Funktionen (Produktion, Rezeptbuch und Managementkonsole) sind der Direktion vorbehalten: ein MikiLab-Profil ist erforderlich.",
              "Full functions (production, recipe book and management console) are reserved for Management: a MikiLab profile is required.",
              "Las funciones completas (producción, recetario y consola de gestión) están reservadas a Dirección: se requiere el perfil MikiLab.",
              "Les fonctions complètes (production, recettes et console de gestion) sont réservées à la Direction : le profil MikiLab est requis.",
              "توابع کامل (تولید، کتاب دستور و کنسول مدیریت) برای مدیریت محفوظ است: پروفایل MikiLab لازم است.")}</p>
          </div>
        </main>
      </div>
    );
  }

  const cur = WORLDS.find((w) => w.id === world) || WORLDS[0];

  return (
    <div data-testid="public-gate" className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* MULTIVERSO 3D di sfondo */}
      <div className="absolute inset-0 z-0 opacity-90">
        <AvatarWorld3D theme={world} accent={cur.accent} />
      </div>
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-background/70 via-background/35 to-background/95 pointer-events-none" />

      {/* HEADER */}
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-y-2 px-4 py-3">
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="w-10 h-10 rounded-xl overflow-hidden border border-border/40 shadow-[0_0_16px_rgba(138,151,166,0.25)] bg-background">
            <img src={`${PUB}/logo-emblem.png`} alt="MikiLab Pro" className="w-full h-full object-cover" />
          </span>
          <span className="leading-tight">
            <span className="block font-black tracking-[0.1em] sm:tracking-[0.18em] text-lg sm:text-xl uppercase whitespace-nowrap">MikiLab<span className="text-muted-foreground"> Pro</span></span>
            <span className="block font-mono text-[8.5px] tracking-[0.22em] sm:tracking-[0.3em] text-muted-foreground/70 uppercase whitespace-nowrap">Holographic Command OS</span>
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button data-testid="public-guide-btn" onClick={() => setShowGuide(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-background/80 border border-border/40 text-muted-foreground text-xs font-bold hover:border-border active:scale-95 transition-all backdrop-blur-md whitespace-nowrap shrink-0">
            <BookOpen className="w-3.5 h-3.5" /> {tri("Guida", "Anleitung", "Guide", "Guía", "Guide", "راهنما")}
          </button>
          <button data-testid="public-login-btn" onClick={() => setShowAuth(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-background/80 border border-primary/40 text-primary text-xs font-bold hover:border-primary active:scale-95 transition-all backdrop-blur-md whitespace-nowrap shrink-0">
            <LogIn className="w-3.5 h-3.5" /> {tri("Accedi", "Anmelden", "Sign in", "Entrar", "Connexion", "ورود")}
          </button>
          <LangSelector testid="public-lang" />
        </div>
      </header>
      {showAuth && <AuthScreen onClose={() => setShowAuth(false)} initialMode="login" />}
      <GuidaMikiLab open={showGuide} onClose={() => setShowGuide(false)} />

      <div className="relative z-10 flex flex-col items-center justify-center px-5 pt-2 pb-28 text-center min-h-[calc(100vh-72px)]">
        {/* Selettore mondi (viewing passivo) */}
        <div data-testid="public-world-tabs" className="flex flex-wrap items-center justify-center gap-2 mb-6">
          {WORLDS.map((w) => (
            <button key={`world-${w.id}`} data-testid={`public-world-${w.id}`} onClick={() => setWorld(w.id)}
              className="px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-all active:scale-95"
              style={world === w.id
                ? { background: w.accent, color: "hsl(var(--card))", borderColor: w.accent, boxShadow: `0 0 18px ${w.accent}66` }
                : { background: "rgba(11,15,25,0.6)", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--card))" }}>
              {w.label}
            </button>
          ))}
        </div>

        {/* Contenuto reale del mondo selezionato: cambia per panificio/pizzeria/pasticceria */}
        {["panificio", "pizzeria", "pasticceria"].includes(world) && (() => { const ap = gateActivityProfile(world); return (
          <div data-testid="public-world-content" className="max-w-md mx-auto mb-6 rounded-2xl border p-4 text-center" style={{ borderColor: `${ap.accent}44`, background: `${ap.accent}10` }}>
            <p data-testid="public-world-blurb" className="text-[12.5px] text-foreground leading-snug">{ap.publicBlurb(lang)}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {ap.publicFeatures(lang).map((f, i) => (
                <span key={i} data-testid={`public-world-feature-${i}`} className="px-2.5 py-1 rounded-full text-[10.5px] font-semibold border" style={{ borderColor: `${ap.accent}55`, color: ap.accent, background: "rgba(3,7,18,0.5)" }}>{f}</span>
              ))}
            </div>
          </div>
        ); })()}

        <div data-testid="public-avatars" className="flex items-end justify-center gap-4 sm:gap-8 mb-7">
          {AVATARS.map((a, i) => (
            <motion.button key={`av-${a.n}`} data-testid={`public-avatar-${a.n.toLowerCase().replace(/[^a-z]/g, "")}`}
              onClick={() => setShowPin(true)}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i, duration: 0.55 }}
              className="group flex flex-col items-center gap-2 active:scale-95 transition-transform">
              <div className="relative">
                {a.nexus && (
                  <>
                    <span className="nexus-ring nexus-ring-1" style={{ borderColor: "hsl(var(--muted-foreground))" }} />
                    <span className="nexus-ring nexus-ring-2" style={{ borderColor: "hsl(var(--muted-foreground))" }} />
                    <span className="absolute -inset-4 rounded-full blur-2xl" style={{ background: "radial-gradient(circle, rgba(246,210,122,0.55), rgba(138,151,166,0.25) 55%, transparent 72%)" }} />
                  </>
                )}
                <div className="relative rounded-full overflow-hidden bg-background"
                  style={{
                    width: a.nexus ? 132 : 84, height: a.nexus ? 132 : 84,
                    border: `3px solid ${a.c}`,
                    boxShadow: a.nexus ? `0 0 46px ${a.c}, 0 0 90px rgba(138,151,166,0.35)` : `0 0 22px ${a.c}66`,
                  }}>
                  <LivingAvatar3D src={`${PUB}/${a.img}`} accent={a.c} nexus={!!a.nexus} className="w-full h-full" />
                  {a.nexus && plantAlert && (
                    <>
                      <span data-testid="gate-nexus-red-eye" className="absolute rounded-full animate-ping" style={{ left: "63%", top: "33%", width: 18, height: 18, background: "rgba(176,110,120,0.85)", boxShadow: "0 0 14px 5px rgba(176,110,120,0.85)", transform: "translate(-50%,-50%)" }} />
                      <span className="absolute rounded-full animate-pulse" style={{ left: "63%", top: "33%", width: 12, height: 12, background: "hsl(var(--muted-foreground))", boxShadow: "0 0 12px 4px rgba(255,31,61,0.9)", transform: "translate(-50%,-50%)" }} />
                    </>
                  )}
                </div>
              </div>
              <span className="font-black text-xs sm:text-sm" style={{ color: a.c }}>{a.n}</span>
              {a.r && <span className="text-[9.5px] uppercase tracking-wider text-muted-foreground max-w-[92px] leading-tight">{a.r}</span>}
            </motion.button>
          ))}
        </div>

        {/* Gerarchia */}
        <p data-testid="public-hierarchy" className="font-mono text-[10px] sm:text-[11px] tracking-[0.25em] text-muted-foreground uppercase mb-5">
          MikiLab <span className="text-muted-foreground">→</span> Sitor
        </p>

        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="font-black tracking-[0.14em] text-2xl sm:text-4xl uppercase max-w-2xl">
          {tri("Il Multiverso della Panificazione", "Das Multiversum des Backens", "The Baking Multiverse", "El Multiverso de la Panificación", "Le Multivers de la Boulangerie", "چندجهانی نان‌پزی")}
        </motion.h1>
        <p className="mt-3 max-w-md text-sm text-foreground leading-relaxed">
          {tri(
            "Sei un ospite. Esplora liberamente i reparti e gli avatar. Ogni interazione richiede un PIN.",
            "Du bist Gast. Erkunde frei die Bereiche und Avatare. Jede Interaktion erfordert einen PIN.",
            "You are a guest. Explore the departments and avatars freely. Any interaction requires a PIN.",
            "Eres un invitado. Explora libremente las áreas y avatares. Toda interacción requiere un PIN.",
            "Tu es invité. Explore librement les ateliers et les avatars. Toute interaction requiert un PIN.",
            "تو مهمان هستی. بخش‌ها و آواتارها را آزادانه ببین. هر تعامل به پین نیاز دارد.")}
        </p>

        {opFlow === null && (
        <div data-testid="public-role-choice" className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
          <button data-testid="public-enter-capo" onClick={() => enterAs("capo")}
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-base text-foreground active:scale-95 transition-all"
            style={{ background: "linear-gradient(90deg,hsl(var(--muted-foreground)),hsl(var(--muted-foreground)))", boxShadow: "0 0 26px rgba(138,151,166,0.45)" }}>
            <ShieldAlert className="w-5 h-5" /> {tri("Direzione", "Direktion", "Direction", "Dirección", "Direction", "مدیریت")}
          </button>
          <button data-testid="public-enter-operaio" onClick={() => enterAs("operator")}
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-base active:scale-95 transition-all border-2"
            style={{ background: "rgba(217,82,0,0.12)", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--primary))" }}>
            <GraduationCap className="w-5 h-5" /> {tri("Produzione", "Produktion", "Production", "Producción", "Production", "تولید")}
          </button>
        </div>
        )}

        {opFlow === "pick" && (
          <div data-testid="public-op-pick" className="mt-7 w-full max-w-md rounded-2xl bg-background/85 border border-primary/40 p-4 backdrop-blur-md text-left">
            <p className="text-sm font-black text-foreground mb-3 text-center">{tri("Operaio · come entri?", "Mitarbeiter · wie rein?", "Operator · how do you enter?", "Operario · ¿cómo entras?", "Opérateur · comment entres-tu ?", "اپراتور · چطور وارد می‌شوی؟")}</p>
            {faces.length > 0 ? (
              <button data-testid="public-op-fast-btn" onClick={() => setOpFlow("fast")}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-black text-sm text-foreground active:scale-95 transition-all mb-2"
                style={{ background: "linear-gradient(90deg,hsl(var(--primary)),hsl(var(--muted-foreground)))" }}>
                <GraduationCap className="w-5 h-5" /> {tri("Ho già lavorato qui · Volto o Nome", "War schon hier · Gesicht/Name", "I've worked here · Face or Name", "Ya estuve aquí · Rostro o Nombre", "Déjà venu · Visage ou Nom", "قبلاً اینجا بودم · چهره یا نام")}
              </button>
            ) : null}
            <button data-testid="public-op-pin-btn" onClick={() => { setShowPin(true); setOpFlow(null); }}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-black text-sm border-2 active:scale-95 transition-all"
              style={{ background: "rgba(217,82,0,0.10)", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--primary))" }}>
              <ShieldAlert className="w-5 h-5" /> {faces.length > 0 ? tri("Prima volta · entro col PIN", "Erstes Mal · mit PIN rein", "First time · enter with PIN", "Primera vez · entro con PIN", "Première fois · j'entre avec le PIN", "اولین بار · با پین") : tri("Entro col PIN", "Mit PIN rein", "Enter with PIN", "Entro con PIN", "J'entre avec le PIN", "با پین وارد می‌شوم")}
            </button>
            <button data-testid="public-op-back" onClick={() => setOpFlow(null)} className="mt-2 w-full text-[11px] text-muted-foreground font-bold py-1">
              {tri("‹ Indietro", "‹ Zurück", "‹ Back", "‹ Atrás", "‹ Retour", "‹ برگشت")}
            </button>
          </div>
        )}

        {opFlow === "fast" && (
          <div data-testid="public-op-fast" className="mt-7 w-full max-w-md text-left">
            <FaceCheckIn tri={tri} onRecognized={fastEnter} />
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-[12px] font-black text-foreground mb-2">{tri("Oppure scrivi il tuo nome", "Oder schreib deinen Namen", "Or type your name", "O escribe tu nombre", "Ou écris ton nom", "یا نامت را بنویس")}</p>
              <div className="flex gap-2">
                <input data-testid="public-op-name" value={opName} onChange={(e) => setOpName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && opName.trim()) fastEnter(opName); }}
                  placeholder={tri("Il tuo nome", "Dein Name", "Your name", "Tu nombre", "Ton nom", "نام تو")}
                  className="flex-1 rounded-xl bg-background border border-border text-foreground text-sm px-3 py-2.5 focus:border-primary outline-none" />
                <button data-testid="public-op-name-go" onClick={() => opName.trim() && fastEnter(opName)} disabled={!opName.trim()}
                  className="shrink-0 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-black text-sm active:scale-95 disabled:opacity-40">{tri("Entra", "Los", "Go", "Entrar", "Entrer", "ورود")}</button>
              </div>
            </div>
            <button data-testid="public-op-fast-back" onClick={() => setOpFlow("pick")} className="mt-2 w-full text-[11px] text-muted-foreground font-bold py-1">{tri("‹ Indietro", "‹ Zurück", "‹ Back", "‹ Atrás", "‹ Retour", "‹ برگشت")}</button>
          </div>
        )}

        {opFlow === null && (
        <p data-testid="public-role-hint" className="mt-3 text-[11px] text-muted-foreground max-w-md">
          {tri("La Direzione entra con il PIN a 6 cifre. L'operaio rientra col volto o il nome; la prima volta con il PIN.", "Chef: 6-stelliger PIN. Mitarbeiter: Gesicht/Name; beim ersten Mal mit PIN.", "The Capo enters with the 6-digit PIN. The operator re-enters with face or name; the first time with the PIN.", "El Capo entra con PIN de 6 dígitos. El operario reingresa con rostro o nombre; la primera vez con PIN.", "Le Capo entre avec le PIN à 6 chiffres. L'opérateur rentre par visage ou nom ; la première fois avec le PIN.", "کاپو با پین ۶ رقمی، اپراتور با چهره/نام؛ اولین بار با پین.")}
        </p>
        )}

        <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
          {tri("Serve un accesso? Scrivi a", "Zugang nötig? Schreib an", "Need access? Write to", "¿Necesitas acceso? Escribe a", "Besoin d'accès ? Écris à", "دسترسی می‌خواهی؟ بنویس به")}
          <a href="mailto:michelecip918@gmail.com?subject=Richiesta%20accesso%20MikiLab" data-testid="public-email" className="font-bold text-primary hover:text-muted-foreground">michelecip918@gmail.com</a>
        </div>

        {/* Fase 2 · Richiesta accesso — smistata da Sitor */}
        <div data-testid="access-request" className="mt-5 w-full max-w-sm rounded-2xl bg-background/80 border border-border p-4 backdrop-blur-md">
          {reqSent ? (
            <p data-testid="access-sent" className="text-[12.5px] text-accent leading-snug">✓ {tri(
              "Richiesta inviata. Sitor la smisterà e il Capo deciderà l'accesso.",
              "Anfrage gesendet. Sitor sortiert sie, der Chef entscheidet.",
              "Request sent. Sitor will route it and the Capo will decide.",
              "Solicitud enviada. Sitor la clasificará.",
              "Demande envoyée. Sitor la triera.",
              "درخواست ارسال شد. محمد آن را بررسی می‌کند.")}</p>
          ) : (
            <>
              <p className="text-[11px] font-bold text-muted-foreground mb-2 text-left">{tri("Richiedi l'accesso dal portale", "Zugang anfragen", "Request access from the portal", "Solicitar acceso", "Demander l'accès", "درخواست دسترسی")}</p>
              <input data-testid="access-email" type="email" value={reqEmail} onChange={(e) => setReqEmail(e.target.value)} placeholder={tri("La tua email", "Deine E-Mail", "Your email", "Tu email", "Ton email", "ایمیل شما")}
                className="w-full rounded-lg bg-background border border-border text-foreground text-sm px-3 py-2 mb-2 focus:border-primary outline-none" />
              <input data-testid="access-note" value={reqNote} onChange={(e) => setReqNote(e.target.value)} placeholder={tri("Motivo (opzionale)", "Grund (optional)", "Reason (optional)", "Motivo (opcional)", "Motif (option)", "دلیل")}
                className="w-full rounded-lg bg-background border border-border text-foreground text-sm px-3 py-2 mb-2 focus:border-primary outline-none" />
              <button data-testid="access-send" onClick={sendRequest} disabled={reqBusy}
                className="w-full py-2 rounded-lg font-bold text-sm text-foreground active:scale-95 transition-all disabled:opacity-50" style={{ background: "linear-gradient(90deg,hsl(var(--primary)),hsl(var(--muted-foreground)))" }}>
                {reqBusy ? tri("Invio…", "Senden…", "Sending…", "Enviando…", "Envoi…", "ارسال…") : tri("Invia richiesta", "Anfrage senden", "Send request", "Enviar", "Envoyer", "ارسال")}
              </button>
            </>
          )}
        </div>

        {/* Vetrina pubblica — concisa: dettaglio dietro "Scopri di più" (niente muri di testo) */}
        <div className="mt-8">
          <button data-testid="public-more-toggle" onClick={() => setShowMore((v) => !v)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider border border-border/40 text-muted-foreground bg-background/70 backdrop-blur-md hover:border-border active:scale-95 transition-all">
            {showMore
              ? tri("Mostra meno", "Weniger anzeigen", "Show less", "Mostrar menos", "Voir moins", "کمتر")
              : tri("Scopri di più su MikiLab Pro", "Mehr über MikiLab Pro", "Discover more about MikiLab Pro", "Descubre más", "En savoir plus", "بیشتر بدانید")}
          </button>
        </div>

        {showMore && (
        <section data-testid="public-vetrina" className="mt-6 w-full max-w-3xl text-left">
          <div className="rounded-2xl overflow-hidden border border-border/25 shadow-[0_0_40px_rgba(138,151,166,0.15)] mb-6">
            <img src={`${PUB}/multiverse-banner.jpg`} alt={tri("MikiLab Pro — il multiverso olografico dei reparti di panificazione", "MikiLab Pro — das holografische Multiversum", "MikiLab Pro — the holographic bakery multiverse", "MikiLab Pro — el multiverso holográfico", "MikiLab Pro — le multivers holographique", "چندجهانی هولوگرافیک MikiLab Pro")} className="w-full h-auto block" loading="lazy" data-testid="vetrina-banner" />
          </div>
          <h2 className="text-base md:text-lg font-black text-foreground uppercase tracking-wide text-center">{tri(
            "Cos'è MikiLab Pro", "Was ist MikiLab Pro", "What is MikiLab Pro", "Qué es MikiLab Pro", "Qu'est-ce que MikiLab Pro", "MikiLab Pro چیست")}</h2>
          <p className="mt-2 text-sm text-foreground leading-relaxed text-center max-w-2xl mx-auto">{tri(
            "MikiLab Pro è il sistema operativo olografico per panificio, pizzeria e pasticceria. Unisce un multiverso 3D dei reparti, l'IA operativa Sitor e la coscienza strategica Sitor per gestire ricette, produzione, formazione e food cost — in un'unica interfaccia ad alta tecnologia.",
            "MikiLab Pro ist das holografische Betriebssystem für Backstube, Pizzeria und Konditorei: 3D-Multiversum, operative KI Sitor und strategische Instanz Sitor für Rezepte, Produktion, Schulung und Food Cost.",
            "MikiLab Pro is the holographic operating system for bakery, pizzeria and pastry: a 3D multiverse of departments, the Sitor operational AI and the Sitor strategic consciousness for recipes, production, training and food cost.",
            "MikiLab Pro es el sistema operativo holográfico para panadería, pizzería y pastelería: multiverso 3D, IA Sitor y Sitor para recetas, producción, formación y food cost.",
            "MikiLab Pro est le système d'exploitation holographique pour boulangerie, pizzeria et pâtisserie : multivers 3D, IA Sitor et Sitor pour recettes, production, formation et food cost.",
            "MikiLab Pro سیستم‌عامل هولوگرافیک برای نانوایی، پیتزا و شیرینی است.")}</p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { t: tri("Ricettario Vivente", "Lebendes Rezeptbuch", "Living Recipe Book", "Recetario Vivo", "Livre Vivant", "دستورنامه زنده"), d: tri("Detta un obiettivo, Sitor calcola matrice e curva di maturazione.", "Ziel nennen, Sitor rechnet.", "Set a goal, Sitor computes the matrix and maturation curve.", "Fija un objetivo y Sitor calcula.", "Fixe un objectif, Sitor calcule.", "هدف بده تا محاسبه شود."), c: "hsl(var(--muted-foreground))" },
              { t: tri("Produzione con l'IA", "KI-Produktion", "AI Production", "Producción con IA", "Production IA", "تولید با هوش"), d: tri("Piani, turni e food cost gestiti da Sitor in tempo reale.", "Pläne, Schichten, Food Cost von Sitor.", "Plans, shifts and food cost run by Sitor in real time.", "Planes, turnos y food cost por Sitor.", "Plans, équipes et food cost par Sitor.", "برنامه و شیفت با Sitor."), c: "hsl(var(--muted-foreground))" },
              { t: tri("Formazione & Multiverso 3D", "Schulung & 3D", "Training & 3D Multiverse", "Formación & 3D", "Formation & 3D", "آموزش و ۳بعدی"), d: tri("Corsi interattivi per ricetta e un multiverso 3D immersivo dei reparti.", "Interaktive Kurse und 3D-Multiversum.", "Interactive per-recipe courses and an immersive 3D multiverse.", "Cursos interactivos y multiverso 3D.", "Cours interactifs et multivers 3D.", "دوره‌های تعاملی و چندجهانی."), c: "hsl(var(--muted-foreground))" },
            ].map((f) => (
              <div key={f.t} className="rounded-xl bg-background/70 border border-border p-4 backdrop-blur-md">
                <p className="text-sm font-black" style={{ color: f.c }}>{f.t}</p>
                <p className="mt-1 text-[12px] text-foreground leading-snug">{f.d}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-[11px] text-muted-foreground">{tri(
            "Panificio · Pizzeria · Pasticceria · Magazzino — in italiano, tedesco, inglese, spagnolo e francese.",
            "Backstube · Pizzeria · Konditorei · Lager — in fünf Sprachen.",
            "Bakery · Pizzeria · Pastry · Warehouse — in five languages.",
            "Panadería · Pizzería · Pastelería · Almacén — en cinco idiomas.",
            "Boulangerie · Pizzeria · Pâtisserie · Entrepôt — en cinq langues.",
            "نانوایی · پیتزا · شیرینی · انبار")}</p>
        </section>
        )}

        {/* Footer legale (GDPR / Impressum) */}
        <footer data-testid="public-legal-footer" className="mt-10 mb-4 w-full max-w-3xl flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono-data text-[10px] tracking-widest uppercase text-muted-foreground">
          <button data-testid="public-impressum-btn" onClick={() => setLegalOpen(true)} className="hover:text-muted-foreground transition-colors">Impressum</button>
          <button data-testid="public-privacy-btn" onClick={() => setPrivacyOpen(true)} className="hover:text-muted-foreground transition-colors">{tri("Privacy (GDPR)", "Datenschutz (DSGVO)", "Privacy (GDPR)", "Privacidad (RGPD)", "Confidentialité (RGPD)", "حریم خصوصی")}</button>
          <button data-testid="public-cookies-btn" onClick={() => setLegalOpen(true)} className="hover:text-muted-foreground transition-colors">Cookies</button>
          <span className="text-muted-foreground">© 2026 {tri("Michele Signorella · mikilab.de", "Michele Signorella · mikilab.de", "Michele Signorella · mikilab.de", "Michele Signorella · mikilab.de", "Michele Signorella · mikilab.de", "mikilab.de")}</span>
          <span className="w-full flex justify-center mt-1"><NotForSaleNote /></span>
        </footer>

      </div>

      {/* Banner cookie informativo (solo cookie tecnici) */}
      {!cookieOk && (
        <div data-testid="cookie-notice" className="fixed bottom-4 left-4 right-4 sm:left-auto sm:max-w-sm z-50 rounded-xl border border-border/30 bg-background/95 backdrop-blur px-4 py-3 shadow-2xl">
          <p className="text-xs text-foreground leading-snug">{tri(
            "Questo sito usa solo cookie tecnici necessari al funzionamento. Nessun tracciamento.",
            "Diese Seite verwendet nur technisch notwendige Cookies. Kein Tracking.",
            "This site uses only technical cookies required for operation. No tracking.",
            "Este sitio usa solo cookies técnicas necesarias. Sin rastreo.",
            "Ce site utilise uniquement des cookies techniques nécessaires. Aucun suivi.",
            "این سایت فقط کوکی‌های فنی لازم را استفاده می‌کند. بدون ردیابی.")}</p>
          <div className="mt-2.5 flex items-center gap-2">
            <button data-testid="cookie-accept-btn" onClick={acceptCookies} className="px-4 py-1.5 rounded-full text-[11px] font-bold text-foreground active:scale-95" style={{ background: "linear-gradient(90deg,hsl(var(--muted-foreground)),hsl(var(--muted-foreground)))" }}>OK</button>
            <button data-testid="cookie-info-btn" onClick={() => setLegalOpen(true)} className="px-4 py-1.5 rounded-full text-[11px] font-bold border border-border/40 text-foreground hover:border-border hover:text-muted-foreground transition-colors">{tri("Info", "Info", "Info", "Info", "Info", "اطلاعات")}</button>
          </div>
        </div>
      )}

      {/* Pagina legale (modale) */}
      {legalOpen && (
        <div data-testid="public-legal-modal" className="fixed inset-0 z-[60] bg-background overflow-auto p-4">
          <div className="max-w-xl mx-auto py-5">
            <button data-testid="public-legal-close" onClick={() => setLegalOpen(false)} className="mb-4 text-sm font-semibold text-muted-foreground">← {tri("Chiudi", "Schließen", "Close", "Cerrar", "Fermer", "بستن")}</button>
            <LegalPlaceholder kind="impressum" onBack={() => setLegalOpen(false)} />
          </div>
        </div>
      )}
      {privacyOpen && <PrivacyNotice onClose={() => setPrivacyOpen(false)} />}
    </div>
  );
}
