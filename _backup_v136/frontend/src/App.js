/*
 * ============================================================================
 *  MIKILAB — IL MANUALE DI SITOR
 *  Ricettario pubblico e gratuito, guidato da Sitor, per chi cucina a casa.
 * ============================================================================
 */
import { useState, useEffect, useRef, lazy, Suspense } from "react";
import "@/App.css";
import { Toaster, toast } from "sonner";
import { ProfileProvider } from "@/profile/ProfileContext";
import { useAuth } from "@/auth/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { AmbientProvider } from "@/audio/AmbientContext";
import { TimerProvider } from "@/audio/TimerContext";
import { SoundFXProvider } from "@/audio/SoundFXContext";

import RadioFornaio from "@/components/RadioFornaio";
import ErrorBoundary from "@/components/ErrorBoundary";
import AuthScreen from "@/components/AuthScreen";
import ResetPassword from "@/components/ResetPassword";
import InstallApp from "@/components/InstallApp";
import SplashScreen from "@/components/SplashScreen";
import LangSelector from "@/components/LangSelector";
import Ricette from "@/sections/Ricette";
import HomeManuale from "@/components/HomeManuale";
import LegalPlaceholder from "@/components/LegalPlaceholder";
import SitorChat from "@/components/SitorChat";
import SitorBadge from "@/components/SitorBadge";
import { PolpoFooter } from "@/components/PolpoFooter";
import { consumeBack } from "@/lib/backNav";
import { useFeatures } from "@/lib/features";
import { usePublicContent } from "@/lib/publicContent";
import { mkTri } from "@/i18n/triMaps";
import { ShieldCheck, LogOut, MessageCircle, ChevronLeft } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
// V84 — segreto del 16 ottobre, banco delle prove, il mio forno
import LancioSegreto, { LancioBanner, LAUNCH_KEY } from "@/components/LancioSegreto";
import Mappa from "@/components/Mappa"; // V100
// V85 — primo giro con Sitor + modo grande, lievito madre come un figlio, mappa del forno
import PrimoGiro, { GIRO_KEY, isBigMode, applyBigMode } from "@/components/PrimoGiro";
// V86 — il pane parla, sveglia del panettiere, pane del mio paese, senza bilancia, curare il lievito, modo notte
import { isNightMode, applyNightMode } from "@/lib/notte";
// V87 — festa del 16 ottobre, volantino da frigo, indirizzi veri per le ricette
import FestaLancio, { festaIsToday } from "@/components/FestaLancio";
import { recipeIdFromLocation } from "@/lib/recipeSeo";
import { pathForRoute, applyPageMeta } from "@/lib/pagine"; // V112
// V90 — il gusto di giocare: festa, medaglie, sorprendimi
import Festa from "@/components/Festa";
import Sorprendimi from "@/components/Sorprendimi";
import { award } from "@/lib/medaglie";
// V88 — editor "Dal banco di Michele" (solo admin)

// V132 — LE PAGINE ARRIVANO QUANDO SERVONO. All'apertura il telefono scarica solo Home, ricettario e poco altro;
// le altre pagine arrivano al primo tocco e, a sito fermo, si scaricano da sole in sottofondo (anche per l'uso senza rete).
// Se dopo un aggiornamento del sito una pagina non si trova, la pagina si ricarica una volta da sola.
const PAGINE_LAZY = {
  TecnichePage: () => import("@/components/TecnichePage"),
  VerdeMikiLab: () => import("@/components/VerdeMikiLab"),
  PercorsoPage: () => import("@/components/PercorsoPage"),
  RegalaPage: () => import("@/components/RegalaPage"),
  PaginaSito: () => import("@/components/PaginaSito"),
  MiglioratorePage: () => import("@/components/MiglioratorePage"),
  AdminCosts: () => import("@/components/AdminCosts"),
  CosaFaccio: () => import("@/components/CosaFaccio"),
  Live: () => import("@/components/Live"),
  Mensola: () => import("@/components/Mensola"),
  Cucina: () => import("@/components/Cucina"),
  Plan: () => import("@/components/Plan"),
  TestMese: () => import("@/components/TestMese"),
  Farine: () => import("@/components/Farine"),
  Calendario: () => import("@/components/Calendario"),
  Admin2B: () => import("@/components/Admin2B"),
  PuliziaDati: () => import("@/components/PuliziaDati"),
  ChangePassword: () => import("@/components/ChangePassword"),
  DalMondo: () => import("@/components/DalMondo"),
  DiarioProve: () => import("@/components/DiarioProve"),
  PaneDiIeri: () => import("@/components/PaneDiIeri"),
  CreaLievito: () => import("@/components/CreaLievito"),
  CenaSughi: () => import("@/components/CenaSughi"),
  PrimaDiIniziare: () => import("@/components/PrimaDiIniziare"),
  ImpressumAdmin: () => import("@/components/ImpressumAdmin"),
  BancoProve: () => import("@/components/BancoProve"),
  Domande: () => import("@/components/Domande"),
  Collezioni: () => import("@/components/Collezioni"),
  Cerca: () => import("@/components/Cerca"),
  PaneCheSalva: () => import("@/components/PaneCheSalva"),
  PaneDeiPiccoli: () => import("@/components/PaneDeiPiccoli"),
  Scuola: () => import("@/components/Scuola"),
  PastaDiCasa: () => import("@/components/PastaDiCasa"),
  Almanacco: () => import("@/components/Almanacco"),
  LibroDiPane: () => import("@/components/LibroDiPane"),
  Valigia: () => import("@/components/Valigia"),
  AnnoDaFornaio: () => import("@/components/AnnoDaFornaio"),
  CartaDeiPani: () => import("@/components/CartaDeiPani"),
  Ospiti: () => import("@/components/Ospiti"),
  Sommelier: () => import("@/components/Sommelier"),
  PrimoPane: () => import("@/components/PrimoPane"),
  Laboratorio: () => import("@/components/Laboratorio"),
  Calcolatrice: () => import("@/components/Calcolatrice"),
  MiglioratorePerTe: () => import("@/components/MiglioratorePerTe"),
  MioForno: () => import("@/components/MioForno"),
  MioLievito: () => import("@/components/MioLievito"),
  MappaForno: () => import("@/components/MappaForno"),
  AscoltaCrosta: () => import("@/components/AscoltaCrosta"),
  SvegliaPanettiere: () => import("@/components/SvegliaPanettiere"),
  PaneDelPaese: () => import("@/components/PaneDelPaese"),
  SenzaBilancia: () => import("@/components/SenzaBilancia"),
  CuraLievito: () => import("@/components/CuraLievito"),
  Volantino: () => import("@/components/Volantino"),
  Dedica: () => import("@/components/Dedica"),
  LeMieMedaglie: () => import("@/components/LeMieMedaglie"),
  Libretto: () => import("@/components/Libretto"),
  BancoEditor: () => import("@/components/BancoMichele"),
  TikTokPagina: () => import("@/components/TikTokPagina"),
};
function pagina(nome) {
  return lazy(() => PAGINE_LAZY[nome]().catch((err) => {
    try { if (!sessionStorage.getItem("mk_pagina_ricarica")) { sessionStorage.setItem("mk_pagina_ricarica", "1"); window.location.reload(); return new Promise(() => { /* */ }); } } catch { /* */ }
    throw err;
  }));
}
const TecnichePage = pagina("TecnichePage");
const VerdeMikiLab = pagina("VerdeMikiLab");
const PercorsoPage = pagina("PercorsoPage");
const RegalaPage = pagina("RegalaPage");
const PaginaSito = pagina("PaginaSito");
const MiglioratorePage = pagina("MiglioratorePage");
const AdminCosts = pagina("AdminCosts");
const CosaFaccio = pagina("CosaFaccio");
const Live = pagina("Live");
const Mensola = pagina("Mensola");
const Cucina = pagina("Cucina");
const Plan = pagina("Plan");
const TestMese = pagina("TestMese");
const Farine = pagina("Farine");
const Calendario = pagina("Calendario");
const Admin2B = pagina("Admin2B");
const PuliziaDati = pagina("PuliziaDati");
const ChangePassword = pagina("ChangePassword");
const DalMondo = pagina("DalMondo");
const DiarioProve = pagina("DiarioProve");
const PaneDiIeri = pagina("PaneDiIeri");
const CreaLievito = pagina("CreaLievito");
const CenaSughi = pagina("CenaSughi");
const PrimaDiIniziare = pagina("PrimaDiIniziare");
const ImpressumAdmin = pagina("ImpressumAdmin");
const BancoProve = pagina("BancoProve");
const Domande = pagina("Domande");
const Collezioni = pagina("Collezioni");
const Cerca = pagina("Cerca");
const PaneCheSalva = pagina("PaneCheSalva");
const PaneDeiPiccoli = pagina("PaneDeiPiccoli");
const Scuola = pagina("Scuola");
const PastaDiCasa = pagina("PastaDiCasa");
const Almanacco = pagina("Almanacco");
const LibroDiPane = pagina("LibroDiPane");
const Valigia = pagina("Valigia");
const AnnoDaFornaio = pagina("AnnoDaFornaio");
const CartaDeiPani = pagina("CartaDeiPani");
const Ospiti = pagina("Ospiti");
const Sommelier = pagina("Sommelier");
const PrimoPane = pagina("PrimoPane");
const Laboratorio = pagina("Laboratorio");
const Calcolatrice = pagina("Calcolatrice");
const MiglioratorePerTe = pagina("MiglioratorePerTe");
const MioForno = pagina("MioForno");
const MioLievito = pagina("MioLievito");
const MappaForno = pagina("MappaForno");
const AscoltaCrosta = pagina("AscoltaCrosta");
const SvegliaPanettiere = pagina("SvegliaPanettiere");
const PaneDelPaese = pagina("PaneDelPaese");
const SenzaBilancia = pagina("SenzaBilancia");
const CuraLievito = pagina("CuraLievito");
const Volantino = pagina("Volantino");
const Dedica = pagina("Dedica");
const LeMieMedaglie = pagina("LeMieMedaglie");
const Libretto = pagina("Libretto");
const BancoEditor = pagina("BancoEditor");
const TikTokPagina = pagina("TikTokPagina");
function PaginaInArrivo() {
  return <div data-testid="pagina-in-arrivo" aria-busy="true" className="py-16 flex justify-center"><span className="w-7 h-7 rounded-full border-2 border-primary/30 border-t-primary animate-spin" /></div>;
}

const PUB = process.env.PUBLIC_URL;

function initialRoute() {
  const p = (window.location.pathname || "").toLowerCase().replace(/^\/(it|de|en)(?=\/|$)/, "") || "/"; // V117: /de/… e /en/… come le pagine normali
  if (p.startsWith("/ricetta/") || recipeIdFromLocation()) return "recipes"; // V132: anche i link «?ricetta=» e i numeri delle ricette (mikilab.de/42)
  if (p === "/tiktok" || p.startsWith("/tiktok/") || /^\/\d{1,4}\/?$/.test(p)) return "tiktok"; // V132: la pagina TikTok (anche un numero che non esiste)
  if (p.startsWith("/volantino")) return "volantino";
  if (p === "/calcolatrice" || p.startsWith("/calcolatrice/")) return "calcolatrice"; // V127
  if (p.startsWith("/miglioratore-per-te")) return "miglioratoreperte"; // V131
  if (p === "/pizza" || p.startsWith("/pizza/")) return "pizza"; // V127
  if (p === "/rinfresco" || p.startsWith("/rinfresco/")) return "rinfresco"; // V127
  if (p === "/formule" || p.startsWith("/formule/")) return "formule"; // V127
  if (p.startsWith("/domande")) return "domande"; // V108
  if (p.startsWith("/collezioni")) return "collezioni"; // V108
  if (p.startsWith("/cerca")) return "cerca"; // V108
  if (p.startsWith("/salva")) return "salva"; // V107
  if (p.startsWith("/piccoli")) return "piccoli"; // V103
  if (p.startsWith("/scuola")) return "scuola"; // V110
  if (p.startsWith("/pasta")) return "pasta"; // V102
  if (p.startsWith("/oggi")) return "oggi"; // V101
  if (p.startsWith("/mappa")) return "mappa"; // V100
  if (p.startsWith("/libro")) return "libro"; // V97
  if (p.startsWith("/valigia")) return "valigia"; // V97
  if (p.startsWith("/anno")) return "anno"; // V96
  if (p.startsWith("/carta")) return "carta"; // V95
  if (p.startsWith("/ospiti")) return "ospiti"; // V95
  if (p.startsWith("/sommelier")) return "sommelier"; // V94
  if (p.startsWith("/primopane")) return "primopane"; // V93
  if (p.startsWith("/laboratorio")) return "laboratorio"; // V93
  if (p.startsWith("/miglionico")) return "dedica";
  if (p.startsWith("/libretto")) return "libretto";
  if (p.startsWith("/impressum")) return "impressum";
  if (p.startsWith("/datenschutz")) return "datenschutz";
  return "home";
}

export default function App() {
  const { lang } = useLang();
  const features = useFeatures();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const { user, logout } = useAuth();

  const [resetToken, setResetToken] = useState(() => new URLSearchParams(window.location.search).get("reset"));
  // Accesso admin riservato (nessun link pubblico): solo con ?admin=1 nell'URL.
  const [adminMode] = useState(() => new URLSearchParams(window.location.search).get("admin") === "1");
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  // V87 — link diretto a una ricetta: RecipeList legge window.__mikilabPendingRecipe appena carica
  useState(() => { try { const id = recipeIdFromLocation(); if (id) window.__mikilabPendingRecipe = id; } catch { /* */ } return null; });
  const [festaOpen, setFestaOpen] = useState(() => { try { const u = new URLSearchParams(window.location.search); if (u.get("festa") === "1") return true; if (!festaIsToday()) return false; return localStorage.getItem("mikilab_festa_vista") !== "1"; } catch { return false; } });
  // V90 — medaglie automatiche: pani fatti (1/5/10) e "fornaio di notte" (4-6 del mattino)
  const [sorprendimiOpen, setSorprendimiOpen] = useState(false);
  useEffect(() => {
    const onDone = () => { try { const n = (JSON.parse(localStorage.getItem("mikilab_done") || "[]") || []).length; if (n >= 1) award("primo_pane"); if (n >= 5) award("cinque_pani"); if (n >= 10) award("dieci_pani"); } catch { /* */ } };
    window.addEventListener("mikilab-done-changed", onDone);
    try { const h = new Date().getHours(); if (h >= 4 && h < 6) award("fornaio_notte"); } catch { /* */ }
    return () => window.removeEventListener("mikilab-done-changed", onDone);
  }, []);
  const [route, setRoute] = useState(() => { try { if (new URLSearchParams(window.location.search).get("lievito")) return "miolievito"; } catch { /* */ } return initialRoute(); });
  const [chatOpen, setChatOpen] = useState(false);
  const navRef = useRef(null); // V113
  useEffect(() => { try { window.dispatchEvent(new CustomEvent("mikilab-chat-state", { detail: { open: chatOpen } })); } catch { /* */ } }, [chatOpen]); // V113
  const [techSlug, setTechSlug] = useState(null);
  const pubContent = usePublicContent(); // null finché non caricato
  const isAdmin = !!(user && user.role === "admin");
  // V84 — "Il forno si accende": conto alla rovescia segreto. Si apre con ?forno=1 oppure
  // toccando 8 volte il polpo nel footer. Nessun link visibile.
  const [fornoOpen, setFornoOpen] = useState(() => { try { return new URLSearchParams(window.location.search).get("forno") === "1"; } catch { return false; } });
  const [fornoFound, setFornoFound] = useState(() => { try { return localStorage.getItem(LAUNCH_KEY) === "1"; } catch { return false; } });
  const polpoTaps = useRef({ n: 0, t: 0 });
  const onPolpoTap = () => {
    const now = Date.now();
    if (now - polpoTaps.current.t > 1500) polpoTaps.current.n = 0;
    polpoTaps.current = { n: polpoTaps.current.n + 1, t: now };
    if (fornoFound || polpoTaps.current.n >= 8) { polpoTaps.current.n = 0; setFornoFound(true); setFornoOpen(true); }
  };
  // V85 — il primo giro parte da solo alla prima visita (non in modalità admin, non se si è aperto il segreto).
  const [giroOpen, setGiroOpen] = useState(false);
  useEffect(() => {
    try {
      if (adminMode || fornoOpen || localStorage.getItem(GIRO_KEY) === "1" || initialRoute() !== "home") return undefined;
      const t = setTimeout(() => setGiroOpen(true), 2600);
      return () => clearTimeout(t);
    } catch { return undefined; }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { applyBigMode(isBigMode()); applyNightMode(isNightMode()); }, []);
  useEffect(() => { // V132: a sito fermo scarica in sottofondo le altre pagine, così restano disponibili anche senza rete
    let stop = false;
    const t = setTimeout(() => {
      try { sessionStorage.removeItem("mk_pagina_ricarica"); } catch { /* */ }
      try { if (navigator.onLine === false || (navigator.connection && navigator.connection.saveData)) return; } catch { /* */ }
      Object.values(PAGINE_LAZY).forEach((f, i) => setTimeout(() => { if (!stop) f().catch(() => { /* */ }); }, i * 120));
    }, 8000);
    return () => { stop = true; clearTimeout(t); };
  }, []);
  const openRecipeFromTool = (id) => { setRoute("recipes"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 150); };
  useEffect(() => {
    const h = (e) => { setTechSlug(e?.detail?.slug || null); setRoute("tecniche"); window.scrollTo({ top: 0, behavior: "smooth" }); };
    window.addEventListener("mikilab-open-technique", h);
    const hc = () => setChatOpen(true);
    window.addEventListener("mikilab-open-chat", hc);
    const hp = () => { setRoute("perche"); window.scrollTo({ top: 0, behavior: "smooth" }); };
    window.addEventListener("mikilab-open-perche", hp);
    const hn = (e) => { const r = e?.detail?.route; if (r) { if (navRef.current) navRef.current(r); else { setRoute(r); window.scrollTo({ top: 0, behavior: "smooth" }); } } }; // V113
    window.addEventListener("mikilab-nav", hn);
    return () => { window.removeEventListener("mikilab-open-technique", h); window.removeEventListener("mikilab-open-chat", hc); window.removeEventListener("mikilab-open-perche", hp); window.removeEventListener("mikilab-nav", hn); };
  }, []);

  // V75 — tasto "indietro" del telefono/browser: torna alla pagina precedente del sito invece di uscire.
  const histFirst = useRef(true);
  const histSkip = useRef(false);
  useEffect(() => {
    try {
      if (histFirst.current) { histFirst.current = false; window.history.replaceState({ mlRoute: route }, ""); return; }
      if (histSkip.current) { histSkip.current = false; return; }
      if (!(window.history.state && window.history.state.mlRoute === route)) { const u = pathForRoute(route) || "/"; if (u && u !== window.location.pathname) window.history.pushState({ mlRoute: route }, "", u + (adminMode ? "?admin=1" : "")); else window.history.pushState({ mlRoute: route }, ""); } // V112: la barra degli indirizzi segue la pagina (mikilab.de/scuola, /piccoli…)
    } catch { /* */ }
  }, [route]);
  useEffect(() => { applyPageMeta(route, lang); }, [route, lang]); // V112: titolo, descrizione e canonical della pagina
  useEffect(() => {
    const onPop = (e) => {
      // 1) se c'è una finestra o una vista aperta (scheda ricetta, strumento, radio…), il tasto indietro chiude quella
      if (consumeBack()) { histSkip.current = false; return; }
      // V132: voce di una finestra già chiusa (es. la ricetta da cui sei passato a un'altra pagina): torna ancora indietro,
      // così arrivi alla pagina di prima invece che alla Home.
      if (e && e.state && e.state._bk && !e.state.mlRoute) { try { window.history.back(); } catch { /* */ } return; }
      // 2) altrimenti torna alla pagina precedente del sito
      const next = (e && e.state && e.state.mlRoute) || "home";
      // se la pagina non cambia, l'effetto sopra non parte: non lasciare il "salta" attivo
      setRoute((cur) => { histSkip.current = cur !== next; return next; });
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Navigazione dai pulsanti di Home / Prima di iniziare / Strumenti.
  // "ricette-view:X" apre una vista delle Ricette (farine, guida…), "ricette-cat:X" filtra il ricettario per categoria.
  const navFromHome = (r) => {
    if (r === "chat") { setChatOpen(true); return; }
    if (r === "giro") { setGiroOpen(true); return; }
    if (r === "sorprendimi") { setSorprendimiOpen(true); return; }
    if (r === "notte") { const v = !isNightMode(); applyNightMode(v); toast.success(v ? tri("Modo notte acceso: Sitor parla piano.", "Nachtmodus an: Sitor spricht leise.", "Night mode on: Sitor speaks softly.") : tri("Modo notte spento.", "Nachtmodus aus.", "Night mode off.")); return; }
    if (r === "grande") { const v = !isBigMode(); applyBigMode(v); toast.success(v ? tri("Modo grande acceso.", "Großmodus an.", "Big mode on.") : tri("Modo grande spento.", "Großmodus aus.", "Big mode off.")); return; }
    if (r === "attrezzi") { setRoute("recipes"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-ricette-view", { detail: { view: "guida" } })), 150); return; }
    if (typeof r === "string" && r.startsWith("ricette-view:")) { const v = r.split(":")[1]; setRoute("recipes"); window.scrollTo({ top: 0 }); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-ricette-view", { detail: { view: v } })), 150); return; }
    if (typeof r === "string" && r.startsWith("ricette-cat:")) { const c = r.split(":")[1]; setRoute("recipes"); window.scrollTo({ top: 0 }); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-recipes-cat", { detail: { cat: c } })), 250); return; }
    if (typeof r === "string" && r.startsWith("officina:")) { const k = r.split(":")[1]; window.__mkOfficina = k; setRoute("recipes"); window.scrollTo({ top: 0 }); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-officina-open", { detail: { k } })), 250); return; } // V126
    if (typeof r === "string" && r.startsWith("mappa:")) { const k = r.split(":")[1]; window.__mkStanza = k; setRoute("mappa"); window.scrollTo({ top: 0 }); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-stanza", { detail: { k } })), 60); return; } // V128: apre una stanza di «Tutto MikiLab»
    if (r === "strumenti") r = "mappa"; // V128
    if (r === "tecniche") { setTechSlug(null); }
    setRoute(r); window.scrollTo({ top: 0, behavior: "smooth" });
  };

  navRef.current = navFromHome; // V113
  // <html lang> segue la lingua corrente (non blocca la traduzione automatica del browser).
  useEffect(() => {
    try { document.documentElement.lang = lang || "it"; } catch { /* */ }
  }, [lang]);

  if (resetToken) return <ResetPassword token={resetToken} onDone={() => { setResetToken(null); try { const u = new URL(window.location.href); u.searchParams.delete("reset"); window.history.replaceState({}, "", u.toString()); } catch { /* */ } }} />;

  // Schermata di accesso admin: visibile SOLO via ?admin=1 e solo se non autenticato.
  if (adminMode && !user) {
    return <div className="fixed inset-0 z-[70] bg-background overflow-auto"><AuthScreen onClose={() => { try { const u = new URL(window.location.href); u.searchParams.delete("admin"); window.location.href = u.toString(); } catch { window.location.href = "/"; } }} initialMode="login" /><Toaster position="top-center" richColors /></div>;
  }

  return (
    <ProfileProvider><AmbientProvider><TimerProvider><SoundFXProvider>
      <SplashScreen />
      <div className="holo-root min-h-screen font-sans selection:bg-muted selection:text-foreground">
        <div className="holo-canvas" aria-hidden />
        <div className="relative z-10 flex flex-col min-h-screen">
          <header data-testid="app-header" className="sticky top-0 z-50 border-b border-border/15 bg-background/85 backdrop-blur-xl px-3 sm:px-4 py-2.5">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
              {route !== "home" && (
                <button data-testid="header-back" aria-label={tri("Torna alla Home", "Zur Startseite", "Back to Home")} onClick={() => { setRoute("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="inline-flex items-center gap-0.5 pl-1.5 pr-2.5 py-1.5 rounded-lg border border-border/50 bg-muted/15 text-foreground font-bold text-xs active:scale-95 transition-all shrink-0">
                  <ChevronLeft className="w-4 h-4" /><span className="hidden sm:inline">{tri("Home", "Start", "Home")}</span>
                </button>
              )}
              <button data-testid="brand-home" onClick={() => { setRoute("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex items-center gap-2.5 min-w-0 shrink-0 active:scale-95 transition-transform">
                <img src={`${PUB}/logo-emblem.webp?v=116`} alt="MikiLab" data-keepcolor className="w-9 h-9 rounded-lg object-contain shrink-0" />
                <span className="text-left whitespace-nowrap">
                  <span className="block font-display text-lg sm:text-2xl font-black tracking-[0.14em] text-foreground uppercase">MikiLab</span>
                  <span className="hidden sm:block font-mono-data text-[9px] tracking-[0.28em] text-muted-foreground/70 uppercase">Il Manuale di Sitor</span>
                </span>
              </button>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 relative">
                <LangSelector testid="header-lang" />
                <ThemeToggle />
                <InstallApp variant="chip" />
                {isAdmin && (
                  <div className="relative">
                    <button data-testid="account-btn" onClick={() => setShowAccountMenu((v) => !v)}
                      className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-bold text-xs active:scale-95 transition-all border bg-muted/15 border-border/50 text-muted-foreground">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{user.name || "Admin"}</span>
                    </button>
                    {showAccountMenu && (
                      <div data-testid="account-menu" className="absolute right-0 top-11 w-64 holo-panel p-3 z-[80]">
                        <p className="text-[11px] text-foreground font-semibold truncate">{user.name || "Admin"}</p>
                        {user.email && <p className="text-[10px] text-muted-foreground truncate mb-2">{user.email}</p>}
                        <button data-testid="costs-link" onClick={() => { setRoute("admin-costs"); setShowAccountMenu(false); window.scrollTo(0, 0); }}
                          className="w-full inline-flex items-center justify-center gap-2 py-2 mb-2 rounded-lg bg-background border border-border text-foreground font-bold text-xs hover:border-accent/50 active:scale-95 transition-all">
                          {tri("Costi & Risparmio", "Kosten & Sparen", "Costs & Savings")}
                        </button>
                        <button data-testid="banco-link" onClick={() => { setRoute("admin-banco"); setShowAccountMenu(false); window.scrollTo(0, 0); }}
                          className="w-full inline-flex items-center justify-center gap-2 py-2 mb-2 rounded-lg bg-primary/15 border border-primary/40 text-foreground font-bold text-xs hover:border-primary active:scale-95 transition-all">
                          {tri("Dal banco di Michele", "Von Micheles Backtisch", "From Michele's bench")}
                        </button>
                        <button data-testid="admin2b-link" onClick={() => { setRoute("admin-2b"); setShowAccountMenu(false); window.scrollTo(0, 0); }}
                          className="w-full inline-flex items-center justify-center gap-2 py-2 mb-2 rounded-lg bg-background border border-border text-foreground font-bold text-xs hover:border-primary/50 active:scale-95 transition-all">
                          {tri("Strumenti di Michele", "Micheles Werkzeuge", "Michele's tools")}
                        </button>
                        <button data-testid="diario-link" onClick={() => { setRoute("admin-diario"); setShowAccountMenu(false); window.scrollTo(0, 0); }}
                          className="w-full inline-flex items-center justify-center gap-2 py-2 mb-2 rounded-lg bg-background border border-border text-foreground font-bold text-xs hover:border-primary/50 active:scale-95 transition-all">
                          {tri("Diario prove", "Test-Tagebuch", "Test log")}
                        </button>
                        <button data-testid="cleanup-link" onClick={() => { setRoute("admin-cleanup"); setShowAccountMenu(false); window.scrollTo(0, 0); }}
                          className="w-full inline-flex items-center justify-center gap-2 py-2 mb-2 rounded-lg bg-background border border-border text-foreground font-bold text-xs hover:border-mattone/50 active:scale-95 transition-all">
                          {tri("Pulizia dati vecchi", "Alte Daten bereinigen", "Clean old data")}
                        </button>
                        <button data-testid="impressum-admin-link" onClick={() => { setRoute("admin-impressum"); setShowAccountMenu(false); window.scrollTo(0, 0); }}
                          className="w-full inline-flex items-center justify-center gap-2 py-2 mb-2 rounded-lg bg-background border border-border text-foreground font-bold text-xs hover:border-primary/50 active:scale-95 transition-all">
                          {tri("Indirizzo Impressum", "Impressum-Adresse", "Impressum address")}
                        </button>
                        <button data-testid="change-pw-link" onClick={() => { setRoute("change-password"); setShowAccountMenu(false); window.scrollTo(0, 0); }}
                          className="w-full inline-flex items-center justify-center gap-2 py-2 mb-2 rounded-lg bg-background border border-border text-foreground font-bold text-xs hover:border-accent/50 active:scale-95 transition-all">
                          {tri("Cambia password", "Passwort ändern", "Change password")}
                        </button>
                        <button data-testid="logout-btn" onClick={async () => { await logout(); setShowAccountMenu(false); toast.success(tri("Sei uscito.", "Abgemeldet.", "Signed out.", "Has salido.", "Déconnecté.", "خارج شدی.")); }}
                          className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-background border border-border text-mattone font-bold text-xs hover:border-mattone/50 active:scale-95 transition-all">
                          <LogOut className="w-3.5 h-3.5" /> {tri("Esci", "Abmelden", "Sign out", "Salir", "Quitter", "خروج")}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-40 pt-6">
            <ErrorBoundary resetKey={`${lang}-${route}-${isAdmin ? "a" : "p"}`}>
              <Suspense fallback={<PaginaInArrivo />}>
              {route === "home" && <LancioBanner onOpen={() => { setFornoFound(true); setFornoOpen(true); }} />}
              {route === "home" && <HomeManuale features={features} onNav={navFromHome} />}
              {route === "recipes" && <Ricette isMasterView={isAdmin} />}
              {route === "tecniche" && <TecnichePage initialSlug={techSlug} onBack={() => setRoute("home")} />}
              {route === "verde" && <VerdeMikiLab onBack={() => setRoute("home")} onOpenRecipe={(id) => { setRoute("recipes"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 150); }} />}
              {route === "tiktok" && <TikTokPagina onBack={() => setRoute("home")} onNav={navFromHome} />} {/* V132 */}
              {route === "miglioratore" && <MiglioratorePage onBack={() => setRoute("home")} onOpenRecipe={(id) => { setRoute("recipes"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 150); }} />}
              {route === "admin-costs" && isAdmin && <AdminCosts onBack={() => setRoute("home")} />}
              {route === "admin-2b" && isAdmin && <Admin2B onBack={() => setRoute("home")} />}
              {route === "admin-diario" && isAdmin && <DiarioProve onBack={() => setRoute("home")} onOpenRecipe={(id) => { setRoute("recipes"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 150); }} />}
              {route === "admin-cleanup" && isAdmin && <PuliziaDati onBack={() => setRoute("home")} />}
              {route === "change-password" && isAdmin && <ChangePassword onBack={() => setRoute("home")} />}
              {route === "admin-impressum" && isAdmin && <ImpressumAdmin onBack={() => setRoute("home")} />}
              {route === "admin-banco" && isAdmin && <BancoEditor onBack={() => setRoute("home")} />}
              {route === "cosa-faccio" && <CosaFaccio onBack={() => setRoute("home")} onOpenRecipe={(id) => { setRoute("recipes"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 150); }} />}
              {route === "live" && (!features || features.FEATURE_LIVE !== false) && <Live onBack={() => setRoute("home")} />}
              {route === "mensola" && <Mensola onBack={() => setRoute("home")} />}
              {route === "cucina" && <Cucina onBack={() => setRoute("home")} />}
              {route === "plan" && <Plan onBack={() => setRoute("home")} />}
              {route === "testmese" && <TestMese onBack={() => setRoute("home")} />}
              {route === "farine" && <Farine onBack={() => setRoute("home")} />}
              {route === "calendario" && <Calendario onBack={() => setRoute("home")} onOpenRecipe={(id) => { setRoute("recipes"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 150); }} />}
              {route === "dalmondo" && <DalMondo onBack={() => setRoute("home")} onOpenRecipe={(id) => { setRoute("recipes"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 150); }} />}
              {route === "paneieri" && <PaneDiIeri onBack={() => setRoute("home")} />}
              {route === "crealievito" && <CreaLievito onBack={() => setRoute("home")} />}
              {route === "inizia" && <PrimaDiIniziare onBack={() => setRoute("home")} onNav={navFromHome} />}
              {route === "strumenti" && <Mappa onBack={() => setRoute("home")} onNav={navFromHome} />} {/* V128: Strumenti e Mappa sono una pagina sola, «Tutto MikiLab» */}
              {route === "banco" && <BancoProve onBack={() => setRoute("mappa")} />}
              {route === "domande" && <Domande onBack={() => setRoute("mappa")} onNav={navFromHome} />} {/* V108 */}
              {route === "collezioni" && <Collezioni onBack={() => setRoute("recipes")} onNav={navFromHome} />} {/* V108 */}
              {route === "cerca" && <Cerca onBack={() => setRoute("home")} onNav={navFromHome} />} {/* V108 */}
              {route === "salva" && <PaneCheSalva onBack={() => setRoute("home")} />} {/* V107 */}
              {route === "piccoli" && <PaneDeiPiccoli onBack={() => setRoute("mappa")} />} {/* V103 */}
              {route === "scuola" && <Scuola onBack={() => setRoute("mappa")} />} {/* V111 */}
              {route === "pasta" && <PastaDiCasa onBack={() => setRoute("recipes")} />} {/* V102 */}
              {route === "oggi" && <Almanacco onBack={() => setRoute("home")} onNav={navFromHome} />} {/* V101 */}
              {route === "mappa" && <Mappa onBack={() => setRoute("home")} onNav={navFromHome} />} {/* V100 */}
              {route === "libro" && <LibroDiPane onBack={() => setRoute("mappa")} />} {/* V97 */}
              {route === "valigia" && <Valigia onBack={() => setRoute("mappa")} />} {/* V97 */}
              {route === "anno" && <AnnoDaFornaio onBack={() => setRoute("mappa")} />} {/* V96 */}
              {route === "carta" && <CartaDeiPani onBack={() => setRoute("mappa")} />} {/* V95 */}
              {route === "ospiti" && <Ospiti onBack={() => setRoute("mappa")} />} {/* V95 */}
              {route === "sommelier" && <Sommelier onBack={() => setRoute("mappa")} />} {/* V94 */}
              {route === "primopane" && <PrimoPane onBack={() => setRoute("mappa")} />} {/* V93 */}
              {route === "laboratorio" && <Laboratorio onBack={() => setRoute("mappa")} />} {/* V93 */}
              {route === "calcolatrice" && <Calcolatrice initialTab="impasto" onBack={() => setRoute("home")} onNav={navFromHome} />} {/* V127 */}
              {route === "miglioratoreperte" && <MiglioratorePerTe onBack={() => setRoute("mappa")} onNav={navFromHome} />} {/* V131 */}
              {route === "pizza" && <Calcolatrice initialTab="pizza" onBack={() => setRoute("home")} onNav={navFromHome} />} {/* V127 */}
              {route === "rinfresco" && <Calcolatrice initialTab="lievito" onBack={() => setRoute("home")} onNav={navFromHome} />} {/* V127 */}
              {route === "formule" && <Calcolatrice initialTab="formule" onBack={() => setRoute("home")} onNav={navFromHome} />} {/* V127 */}
              {route === "mioforno" && <MioForno onBack={() => setRoute("mappa")} onOpenRecipe={openRecipeFromTool} />}
              {route === "miolievito" && <MioLievito onBack={() => setRoute("mappa")} onNav={navFromHome} />}
              {route === "mappaforno" && <MappaForno onBack={() => setRoute("mappa")} />}
              {route === "crosta" && <AscoltaCrosta onBack={() => setRoute("mappa")} />}
              {route === "sveglia" && <SvegliaPanettiere onBack={() => setRoute("mappa")} onOpenRecipe={openRecipeFromTool} />}
              {route === "paese" && <PaneDelPaese onBack={() => setRoute("mappa")} onOpenRecipe={openRecipeFromTool} />}
              {route === "bilancia" && <SenzaBilancia onBack={() => setRoute("mappa")} />}
              {route === "curalievito" && <CuraLievito onBack={() => setRoute("mappa")} onNav={navFromHome} />}
              {route === "volantino" && <Volantino onBack={() => setRoute("home")} />}
              {route === "dedica" && <Dedica onBack={() => setRoute("home")} onNav={navFromHome} />}
              {route === "medaglie" && <LeMieMedaglie onBack={() => setRoute("mappa")} />}
              {route === "libretto" && <Libretto onBack={() => setRoute("mappa")} />}
              {route === "panico" && <CenaSughi initialTab="panico" onBack={() => setRoute("home")} />}
              {route === "sughi" && <CenaSughi initialTab="sughi" onBack={() => setRoute("home")} />}
              {route === "percorso" && <PercorsoPage onBack={() => setRoute("home")} onNav={(r) => { setRoute(r); window.scrollTo(0, 0); }} onOpenRecipe={(id) => { setRoute("recipes"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 150); }} />}
              {route === "regala" && <RegalaPage onBack={() => setRoute("home")} />}
              {route === "perche" && <PaginaSito slug="perche" onBack={() => setRoute("home")} />}
              {route === "impressum" && <LegalPlaceholder kind="impressum" onBack={() => setRoute("home")} />}
              {route === "datenschutz" && <LegalPlaceholder kind="datenschutz" onBack={() => setRoute("home")} />}
              </Suspense>
            </ErrorBoundary>
          </main>

          <footer data-testid="app-footer" className="border-t border-border/12 bg-background/70 px-4 py-6 mt-auto">
            {/* V128: piè di pagina più corto — una frase sulle ricette e Sitor, una sull'uso, i collegamenti, la firma */}
            <div className="max-w-3xl mx-auto flex flex-col items-center gap-3 text-[11.5px] text-muted-foreground text-center">
              <SitorBadge size={26} onOpenPerche={() => { setRoute("perche"); window.scrollTo(0, 0); }} />
              <p data-testid="footer-two-types" className="max-w-2xl">{tri(
                "Le ricette sono di due tipi: quelle controllate o provate da Michele e le bozze scritte da Sitor, l'avatar IA di Michele: un'intelligenza artificiale basata sui modelli di Anthropic. Ogni ricetta dice chiaramente di quale tipo è.",
                "Die Rezepte sind von zwei Arten: die von Michele geprüften oder erprobten und die Entwürfe von Sitor, Micheles KI-Avatar: eine künstliche Intelligenz auf Basis der Anthropic-Modelle. Jedes Rezept sagt klar, welcher Art es ist.",
                "Recipes are of two kinds: those checked or tested by Michele and the drafts written by Sitor, Michele's AI avatar: an artificial intelligence based on Anthropic models. Each recipe clearly states which kind it is.")}</p>
              <p data-testid="footer-copyright-usage" className="max-w-2xl text-foreground">{tri(
                "Gratis per uso personale. Ricette e testi © MikiLab: vietato riprodurli o venderli, i link sono benvenuti. Le stampe e le condivisioni ufficiali portano il logo MikiLab.",
                "Kostenlos für den privaten Gebrauch. Rezepte und Texte © MikiLab: Vervielfältigung und Verkauf verboten, Links sind willkommen. Offizielle Ausdrucke und geteilte Inhalte tragen das MikiLab-Logo.",
                "Free for personal use. Recipes and texts © MikiLab: reproducing or selling them is forbidden, links are welcome. Official prints and shares carry the MikiLab logo.")}</p>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-bold">
                <button data-testid="footer-tutto" onClick={() => { setRoute("mappa"); window.scrollTo(0, 0); }} className="hover:text-foreground">{tri("Tutto MikiLab", "Ganz MikiLab", "All of MikiLab")}</button>
                <button data-testid="footer-regala" onClick={() => { setRoute("regala"); window.scrollTo(0, 0); }} className="hover:text-foreground">{tri("Regala MikiLab", "MikiLab verschenken", "Gift MikiLab")}</button>
                <button data-testid="footer-tiktok" onClick={() => { setRoute("tiktok"); window.scrollTo(0, 0); }} className="hover:text-foreground">TikTok</button>
                {pubContent?.hasPerche && (
                  <button data-testid="footer-perche" onClick={() => { setRoute("perche"); window.scrollTo(0, 0); }} className="hover:text-foreground">{tri("Perché MikiLab", "Warum MikiLab", "Why MikiLab")}</button>
                )}
                <button data-testid="footer-dedica" onClick={() => { setRoute("dedica"); window.scrollTo(0, 0); }} className="hover:text-foreground">{tri("Da Miglionico", "Aus Miglionico", "From Miglionico")}</button>
                <button data-testid="footer-impressum" onClick={() => { setRoute("impressum"); window.scrollTo(0, 0); }} className="hover:text-foreground">Impressum</button>
                <button data-testid="footer-datenschutz" onClick={() => { setRoute("datenschutz"); window.scrollTo(0, 0); }} className="hover:text-foreground">{tri("Privacy", "Datenschutz", "Privacy")}</button>
              </div>
              <p className="flex items-center justify-center gap-2 pt-2 border-t border-border/10 w-full">
                <PolpoFooter onTap={onPolpoTap} found={fornoFound} />
                © MikiLab — {tri("Il Manuale di Sitor", "Sitors Handbuch", "Sitor's Manual")} · {tri("Fatto con le mani di Michele", "Mit Micheles Händen gemacht", "Made with Michele's hands")}
              </p>
              <p data-testid="footer-langs">{tri("Altre lingue: usa il traduttore del tuo browser.", "Weitere Sprachen: nutze den Übersetzer deines Browsers.", "Other languages: use your browser's translator.")}</p>
            </div>
          </footer>
        </div>

        <RadioFornaio />
        {fornoOpen && <LancioSegreto onClose={() => { setFornoOpen(false); try { const u = new URL(window.location.href); if (u.searchParams.has("forno")) { u.searchParams.delete("forno"); window.history.replaceState(window.history.state, "", u.toString()); } } catch { /* */ } }} />}
        <Festa />
        {sorprendimiOpen && <Sorprendimi onClose={() => setSorprendimiOpen(false)} onOpenRecipe={openRecipeFromTool} />}
        {festaOpen && <FestaLancio onClose={() => { setFestaOpen(false); award("primo_giorno"); try { localStorage.setItem("mikilab_festa_vista", "1"); const u = new URL(window.location.href); if (u.searchParams.has("festa")) { u.searchParams.delete("festa"); window.history.replaceState(window.history.state, "", u.toString()); } } catch { /* */ } }} onNav={navFromHome} />}
        {giroOpen && !fornoOpen && !festaOpen && <PrimoGiro onClose={() => setGiroOpen(false)} onNav={navFromHome} />}
        {chatOpen && <SitorChat onClose={() => setChatOpen(false)} />}
        {route !== "home" && <button data-testid="sitor-chat-fab" onClick={() => setChatOpen(true)} aria-label="Chat Sitor"
          className="fixed z-[60] bottom-5 right-5 flex items-center gap-2 pl-2 pr-4 py-2 rounded-full bg-muted hover:bg-muted text-foreground shadow-xl active:scale-95 transition-all">
          <img src="/sitor_official.webp" alt="" className="w-9 h-9 rounded-full object-cover border-2 border-border" />
          <span className="font-bold text-sm hidden sm:inline">{tri("Chiedi a Sitor", "Frag Sitor", "Ask Sitor")}</span>
          <MessageCircle className="w-4 h-4 sm:hidden" />
        </button>} {/* V126: in Home c'è già il riquadro «Chiedi a Sitor» */}
        <Toaster position="top-center" richColors />
      </div>
    </SoundFXProvider></TimerProvider></AmbientProvider></ProfileProvider>
  );
}
