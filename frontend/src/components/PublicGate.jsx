import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ArrowRight, Sparkles, GraduationCap, ShieldAlert, LogOut } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import LangSelector from "@/components/LangSelector";
import AvatarWorld3D from "@/components/AvatarWorld3D";
import AdminGate from "@/components/AdminGate";
import DowntimeTraining from "@/components/DowntimeTraining";
import { api } from "@/lib/api";

const PUB = process.env.PUBLIC_URL;

// Multiverso pubblico read-only: chi non ha il PIN puo GUARDARE i 4 mondi e gli avatar,
// ma OGNI interazione porta al Muro del PIN (198505 · richiesta accessi@mikilab.de).
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
    { id: "panificio", label: tri("Panificio", "Backstube", "Bakery", "Panadería", "Boulangerie", "نانوایی"), accent: "#00F0FF" },
    { id: "pizzeria", label: tri("Pizzeria", "Pizzeria", "Pizzeria", "Pizzería", "Pizzeria", "پیتزا"), accent: "#FFB800" },
    { id: "pasticceria", label: tri("Pasticceria", "Konditorei", "Pastry", "Pastelería", "Pâtisserie", "شیرینی"), accent: "#7FD8C0" },
    { id: "banco", label: tri("Magazzino", "Lager", "Warehouse", "Almacén", "Entrepôt", "انبار"), accent: "#5E8CA8" },
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
    { img: "avatar_miki.jpg", c: "#5E8CA8", n: "MikiLab", r: tri("Capo Supremo", "Oberster Chef", "Supreme Capo", "Capo Supremo", "Capo Suprême", "کاپوی برتر") },
    { img: "avatar_nexus.jpg", c: "#F6D27A", n: "Miki-Nexus", r: tri("Coscienza Strategica", "Strategisches Bewusstsein", "Strategic Consciousness", "Conciencia Estratégica", "Conscience Stratégique", "آگاهی راهبردی"), nexus: true },
    { img: "avatar_mikemix.jpg", c: "#00F0FF", n: "Mike Mix", r: tri("IA Operativa", "Operative KI", "Operational AI", "IA Operativa", "IA Opérationnelle", "هوش عملیاتی") },
  ];

  if (showPin) return <AdminGate onUnlock={handleUnlock} onBack={() => setShowPin(false)} />;

  if (guest) {
    return (
      <div data-testid="guest-view" className="relative min-h-screen bg-[#030712] text-white">
        <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-[#7DD3FC]/15 bg-[#070A10]/85 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl overflow-hidden border border-[#7DD3FC]/40 bg-[#070A10]"><img src={`${PUB}/logo-emblem.png`} alt="MikiLab" className="w-full h-full object-contain" /></span>
            <span className="leading-tight"><span className="block font-black tracking-[0.16em] text-base uppercase">MikiLab<span className="text-[#7DD3FC]"> · Ospite</span></span><span className="block font-mono text-[8px] tracking-[0.28em] text-[#7DD3FC]/70 uppercase">Guest Access · Training</span></span>
          </div>
          <div className="flex items-center gap-2">
            <LangSelector testid="guest-lang" />
            <button data-testid="guest-exit" onClick={() => { setGuest(false); }} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0C1019] border border-[#1e293b] text-[#f87171] text-xs font-bold active:scale-95"><LogOut className="w-3.5 h-3.5" /> {tri("Esci", "Abmelden", "Exit", "Salir", "Quitter", "خروج")}</button>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#7DD3FC]/10 border border-[#7DD3FC]/40 flex items-center justify-center"><GraduationCap className="w-6 h-6 text-[#7DD3FC]" /></div>
            <div><h1 className="font-cyber text-lg font-black uppercase tracking-wide">{tri("Formazione autorizzata", "Autorisierte Schulung", "Authorized Training", "Formación autorizada", "Formation autorisée", "آموزش مجاز")}</h1><p className="text-[11px] text-[#8aa0b4]">{tri("Accesso ospite abilitato dal Capo Supremo per la formazione.", "Gastzugang vom Obersten Chef für die Schulung freigegeben.", "Guest access enabled by the Supreme Capo for training.", "Acceso invitado habilitado por el Capo Supremo.", "Accès invité activé par le Capo Suprême.", "دسترسی مهمان توسط کاپو فعال شد.")}</p></div>
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
          <span className="w-10 h-10 rounded-xl overflow-hidden border border-[#00F0FF]/40 shadow-[0_0_16px_rgba(0,240,255,0.25)] bg-[#070A10]">
            <img src={`${PUB}/logo-emblem.png`} alt="MikiLab Pro" className="w-full h-full object-contain" />
          </span>
          <span className="leading-tight">
            <span className="block font-black tracking-[0.18em] text-lg sm:text-xl uppercase">MikiLab<span className="text-[#00F0FF]"> Pro</span></span>
            <span className="block font-mono text-[8.5px] tracking-[0.3em] text-[#00F0FF]/70 uppercase">Holographic Command OS</span>
          </span>
        </div>
        <LangSelector testid="public-lang" />
      </header>

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

        {/* TRIO avatar — Miki-Nexus centrale e speciale */}
        <div data-testid="public-avatars" className="flex items-end justify-center gap-4 sm:gap-8 mb-7">
          {AVATARS.map((a, i) => (
            <motion.button key={`av-${a.n}`} data-testid={`public-avatar-${a.n.toLowerCase().replace(/[^a-z]/g, "")}`}
              onClick={() => setShowPin(true)}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i, duration: 0.55 }}
              className="group flex flex-col items-center gap-2 active:scale-95 transition-transform">
              <div className="relative">
                {a.nexus && (
                  <>
                    <span className="nexus-ring nexus-ring-1" style={{ borderColor: "#F6D27A" }} />
                    <span className="nexus-ring nexus-ring-2" style={{ borderColor: "#00F0FF" }} />
                    <span className="absolute -inset-4 rounded-full blur-2xl" style={{ background: "radial-gradient(circle, rgba(246,210,122,0.55), rgba(0,240,255,0.25) 55%, transparent 72%)" }} />
                  </>
                )}
                <div className="relative rounded-full overflow-hidden bg-[#030712]"
                  style={{
                    width: a.nexus ? 132 : 84, height: a.nexus ? 132 : 84,
                    border: `3px solid ${a.c}`,
                    boxShadow: a.nexus ? `0 0 46px ${a.c}, 0 0 90px rgba(0,240,255,0.35)` : `0 0 22px ${a.c}66`,
                  }}>
                  <img src={`${PUB}/${a.img}`} alt={a.n} className="w-full h-full object-cover object-top" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                </div>
              </div>
              <span className="font-black text-xs sm:text-sm" style={{ color: a.c }}>{a.n}</span>
              <span className="text-[9.5px] uppercase tracking-wider text-[#8aa0b4] max-w-[92px] leading-tight">{a.r}</span>
            </motion.button>
          ))}
        </div>

        {/* Gerarchia */}
        <p data-testid="public-hierarchy" className="font-mono text-[10px] sm:text-[11px] tracking-[0.25em] text-[#64748B] uppercase mb-5">
          MikiLab <span className="text-[#F6D27A]">→</span> Miki-Nexus <span className="text-[#00F0FF]">→</span> Mike Mix
        </p>

        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="font-black tracking-[0.14em] text-2xl sm:text-4xl uppercase max-w-2xl">
          {tri("Il Multiverso della Panificazione", "Das Multiversum des Backens", "The Baking Multiverse", "El Multiverso de la Panificación", "Le Multivers de la Boulangerie", "چندجهانی نان‌پزی")}
        </motion.h1>
        <p className="mt-3 max-w-md text-sm text-[#9fb3c4] leading-relaxed">
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
          style={{ background: "linear-gradient(90deg,#00F0FF,#7DD3FC)", boxShadow: "0 0 26px rgba(0,240,255,0.45)" }}>
          <Lock className="w-4 h-4" /> {tri("Entra con il PIN", "Mit PIN eintreten", "Enter with PIN", "Entrar con PIN", "Entrer avec le PIN", "ورود با پین")} <ArrowRight className="w-4 h-4" />
        </button>

        <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-[#64748B]">
          <Sparkles className="w-3.5 h-3.5 text-[#F6D27A]" />
          {tri("Serve un accesso? Scrivi a", "Zugang nötig? Schreib an", "Need access? Write to", "¿Necesitas acceso? Escribe a", "Besoin d'accès ? Écris à", "دسترسی می‌خواهی؟ بنویس به")}
          <a href="mailto:accessi@mikilab.de?subject=Richiesta%20accesso%20MikiLab" data-testid="public-email" className="font-bold text-[#14b8a6] hover:text-[#2dd4bf]">accessi@mikilab.de</a>
        </div>

        {/* Fase 2 · Richiesta accesso — smistata da Mohamed */}
        <div data-testid="access-request" className="mt-5 w-full max-w-sm rounded-2xl bg-[#0b0f19]/80 border border-[#1e293b] p-4 backdrop-blur-md">
          {reqSent ? (
            <p data-testid="access-sent" className="text-[12.5px] text-[#7FD8C0] leading-snug">✓ {tri(
              "Richiesta inviata. Mohamed la smisterà e il Capo deciderà l'accesso.",
              "Anfrage gesendet. Mohamed sortiert sie, der Chef entscheidet.",
              "Request sent. Mohamed will route it and the Capo will decide.",
              "Solicitud enviada. Mohamed la clasificará.",
              "Demande envoyée. Mohamed la triera.",
              "درخواست ارسال شد. محمد آن را بررسی می‌کند.")}</p>
          ) : (
            <>
              <p className="text-[11px] font-bold text-[#94A3B8] mb-2 text-left">{tri("Richiedi l'accesso dal portale", "Zugang anfragen", "Request access from the portal", "Solicitar acceso", "Demander l'accès", "درخواست دسترسی")}</p>
              <input data-testid="access-email" type="email" value={reqEmail} onChange={(e) => setReqEmail(e.target.value)} placeholder={tri("La tua email", "Deine E-Mail", "Your email", "Tu email", "Ton email", "ایمیل شما")}
                className="w-full rounded-lg bg-[#070A10] border border-[#1e293b] text-white text-sm px-3 py-2 mb-2 focus:border-[#14b8a6] outline-none" />
              <input data-testid="access-note" value={reqNote} onChange={(e) => setReqNote(e.target.value)} placeholder={tri("Motivo (opzionale)", "Grund (optional)", "Reason (optional)", "Motivo (opcional)", "Motif (option)", "دلیل")}
                className="w-full rounded-lg bg-[#070A10] border border-[#1e293b] text-white text-sm px-3 py-2 mb-2 focus:border-[#14b8a6] outline-none" />
              <button data-testid="access-send" onClick={sendRequest} disabled={reqBusy}
                className="w-full py-2 rounded-lg font-bold text-sm text-[#070A10] active:scale-95 transition-all disabled:opacity-50" style={{ background: "linear-gradient(90deg,#14b8a6,#7FD8C0)" }}>
                {reqBusy ? tri("Invio…", "Senden…", "Sending…", "Enviando…", "Envoi…", "ارسال…") : tri("Invia richiesta", "Anfrage senden", "Send request", "Enviar", "Envoyer", "ارسال")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
