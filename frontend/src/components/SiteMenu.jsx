import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Home as HomeIcon, BookOpen, Wrench, GraduationCap, Users, Trophy, Menu, Search, Star,
  Rss, UserPlus, MessageCircle, Store, MapPin, User, Clock, Flame, Shield, BookOpenCheck, Mic, Lock } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { TOOLS, TOOL_KINDS, TOOL_CATS } from "@/sections/PianoProduzioneAI";
import { mkTri } from "@/i18n/triMaps";
import { useProfile } from "@/profile/ProfileContext";
import { PRO_ONLY_TOOLS, isPassion } from "@/lib/labHubs";

const FAV_KEY = "mikilab_menu_favs";
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Menù CONTESTUALE: mostra le voci della sezione in cui ti trovi (Laboratorio → strumenti,
// Social → voci social + ordina feed) + una lista compatta per saltare tra le sezioni.
import { isPinEnabled, setPin as pinSet, setPinEnabled as pinSetEnabled } from "@/lib/pinLock";

export default function SiteMenu({ onNavigate, onOpenSfide, tab }) {
  const { lang } = useLang();
  const { user } = useAuth();
  const { profile, chooseProfile } = useProfile();
  const passion = isPassion(profile);
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [favs, setFavs] = useState(() => { try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch { return []; } });
  const [persona, setPersona] = useState(() => { try { return localStorage.getItem("mikilab_voice_persona") || "michele"; } catch { return "michele"; } });
  const choosePersona = (p) => { setPersona(p); try { localStorage.setItem("mikilab_voice_persona", p); } catch { /* */ } window.dispatchEvent(new CustomEvent("mikilab-voice-persona", { detail: { persona: p } })); };
  const [pinOn, setPinOn] = useState(() => isPinEnabled());
  const [pinEditing, setPinEditing] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [pinMsg, setPinMsg] = useState("");
  const togglePin = () => { const v = !pinOn; setPinOn(v); pinSetEnabled(v); setPinEditing(false); setNewPin(""); setPinMsg(v ? tri("Blocco PIN attivo.", "PIN-Sperre aktiv.", "PIN lock on.", "Bloqueo PIN activo.") : tri("Blocco PIN disattivato.", "PIN-Sperre aus.", "PIN lock off.", "Bloqueo PIN desactivado.")); };
  const savePin = () => { if (pinSet(newPin)) { setPinOn(true); setPinEditing(false); setNewPin(""); setPinMsg(tri("PIN aggiornato.", "PIN aktualisiert.", "PIN updated.", "PIN actualizado.")); } else { setPinMsg(tri("Servono 4 cifre.", "4 Ziffern nötig.", "Need 4 digits.", "Faltan 4 dígitos.")); } };
  const lockNowBtn = () => { setOpen(false); window.dispatchEvent(new Event("mikilab-lock")); };

  useEffect(() => {
    const h = () => { setQ(""); setOpen(true); };
    window.addEventListener("mikilab-open-menu", h);
    return () => window.removeEventListener("mikilab-open-menu", h);
  }, []);

  const saveFavs = (arr) => { setFavs(arr); try { localStorage.setItem(FAV_KEY, JSON.stringify(arr)); } catch { /* */ } };
  const toggleFav = (id) => saveFavs(favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id]);

  const goTab = (t) => { setOpen(false); onNavigate && onNavigate(t); window.scrollTo(0, 0); };
  const goTool = (id) => {
    try { localStorage.setItem("mikilab_pending_tool", id); } catch { /* */ }
    setOpen(false); onNavigate && onNavigate("maestro"); window.scrollTo(0, 0);
    setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-lab-tool", { detail: { id } })), 120);
  };
  const goSfide = () => { setOpen(false); onOpenSfide ? onOpenSfide() : window.dispatchEvent(new Event("mikilab-go-challenges")); };
  const goSocial = (view) => {
    setOpen(false);
    if (tab !== "community") { onNavigate && onNavigate("community"); window.scrollTo(0, 0); }
    setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-social-view", { detail: { view } })), tab !== "community" ? 180 : 30);
  };
  const goFeed = (order) => {
    setOpen(false);
    if (tab !== "community") { onNavigate && onNavigate("community"); window.scrollTo(0, 0); }
    setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-social-feed", { detail: { order } })), tab !== "community" ? 180 : 30);
  };

  const SECTIONS = [
    { id: "home", Icon: HomeIcon, label: tri("Home", "Home", "Home", "Inicio"), color: "#ff6b00" },
    { id: "ricette", Icon: BookOpen, label: tri("Le Ricette di MikiLab", "Die MikiLab-Rezepte", "The MikiLab Recipes", "Las Recetas de MikiLab"), color: "#ff6b00" },
    { id: "maestro", Icon: Wrench, label: tri("Il Tuo Laboratorio", "Dein Labor", "Your Lab", "Tu Laboratorio"), color: "#ff6b00" },
    { id: "imparacon", Icon: GraduationCap, label: tri("Scienza & Guide", "Wissen & Guides", "Science & Guides", "Ciencia y Guías"), color: "#A16207" },
    { id: "community", Icon: Users, label: tri("Community", "Community", "Community", "Comunidad"), color: "#ff6b00" },
  ];
  const SOCIAL = [
    { v: "feed", Icon: Rss, label: tri("Bacheca (Feed)", "Pinnwand (Feed)", "Feed", "Muro (Feed)"), color: "#1e1e1e" },
    { v: "friends", Icon: UserPlus, label: tri("Amici & Colleghi", "Freunde & Kollegen", "Friends & Colleagues", "Amigos y Colegas"), color: "#ff6b00" },
    { v: "messages", Icon: MessageCircle, label: tri("Messaggi", "Nachrichten", "Messages", "Mensajes"), color: "#ff6b00" },
    { v: "map", Icon: MapPin, label: tri("Mappa dei Fornai", "Bäcker-Karte", "Bakers Map", "Mapa de Panaderos"), color: "#2e8b6f" },
    { v: "profile", Icon: User, label: tri("Il mio profilo", "Mein Profil", "My profile", "Mi perfil"), color: "#ff6b00" },
  ];
  const FEED_ORDER = [
    { o: "all", Icon: Clock, label: tri("Recenti", "Neueste", "Recent", "Recientes") },
    { o: "popular", Icon: Flame, label: tri("Popolari", "Beliebt", "Popular", "Populares") },
    { o: "friends", Icon: UserPlus, label: tri("Amici", "Freunde", "Friends", "Amigos") },
  ];

  const catOf = (key) => TOOL_CATS.find((c) => c.key === key) || {};
  const toolLabel = (tl) => tri(tl.it, tl.de, tl.en, tl.es);
  const byId = Object.fromEntries(TOOLS.map((t) => [t.id, t]));
  const nq = norm(q);
  const allowed = (t) => (passion ? !PRO_ONLY_TOOLS.has(t.id) : true);
  const filteredTools = nq ? TOOLS.filter((t) => allowed(t) && norm(toolLabel(t)).includes(nq)) : [];
  const favTools = favs.map((id) => byId[id]).filter((t) => t && allowed(t));

  const ctx = tab === "maestro" ? "lab" : tab === "community" ? "social" : tab === "ricette" ? "ricette" : "generic";
  const ctxTitle = ctx === "lab" ? tri("Il Tuo Laboratorio", "Dein Labor", "Your Lab", "Tu Laboratorio")
    : ctx === "social" ? tri("Social", "Social", "Social", "Social")
    : ctx === "ricette" ? tri("Le Ricette", "Rezepte", "Recipes", "Recetas")
    : tri("MikiLab", "MikiLab", "MikiLab", "MikiLab");

  const ToolRow = ({ tl, testid }) => {
    const c = catOf(tl.cat); const isFav = favs.includes(tl.id);
    return (
      <div className="flex items-center gap-1">
        <button data-testid={testid || `site-menu-tool-${tl.id}`} onClick={() => goTool(tl.id)}
          className="flex-1 flex items-center gap-2.5 text-left px-3 py-2.5 rounded-2xl shadow-md border border-amber-900/40 bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] active:scale-98 hover:border-[#ff6b00]/60 transition-all min-w-0">
          <tl.Icon className="w-4 h-4 shrink-0" style={{ color: c.color }} />
          <span className="text-sm font-medium text-[#2B303B] dark:text-[#e4eff8] truncate">{toolLabel(tl)}</span>
        </button>
        <button data-testid={`site-menu-fav-${tl.id}`} onClick={() => toggleFav(tl.id)} aria-label="Preferito"
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 active:scale-90 transition-all border border-[#2e2e2e] dark:border-[#2e2e2e] bg-white dark:bg-[#1e1e1e]">
          <Star className={`w-4 h-4 ${isFav ? "fill-[#E0A106] text-[#E0A106]" : "text-[#9AA6AE]"}`} />
        </button>
      </div>
    );
  };

  if (!open) return null;

  return createPortal(
    <div data-testid="site-menu" className="fixed inset-0 z-[300]" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" />
      <div onClick={(e) => e.stopPropagation()}
        className="absolute top-0 left-0 h-full w-[88%] max-w-sm bg-[#121212] dark:bg-[#1A1F24] shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-300">
        <div className="sticky top-0 z-10 bg-[#ff6b00] text-white">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-white/70 font-bold">{tri("Menù di questa sezione", "Menü dieses Bereichs", "This section's menu", "Menú de esta sección")}</p>
              <span data-testid="site-menu-title" className="font-display text-lg font-bold flex items-center gap-2 truncate"><Menu className="w-5 h-5 shrink-0" /> {ctxTitle}</span>
            </div>
            <button data-testid="site-menu-close" onClick={() => setOpen(false)} className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center active:scale-95 shrink-0"><X className="w-5 h-5" /></button>
          </div>
          {ctx === "lab" && (
            <div className="px-3 pb-3">
              <div className="flex items-center gap-2 bg-white/15 rounded-2xl shadow-md border border-amber-900/40 px-3 py-2">
                <Search className="w-4 h-4 text-white/80 shrink-0" />
                <input data-testid="site-menu-search" value={q} onChange={(e) => setQ(e.target.value)}
                  placeholder={tri("Cerca strumento…", "Werkzeug suchen…", "Search a tool…", "Buscar herramienta…")}
                  className="bg-transparent outline-none text-sm text-white placeholder-white/60 w-full" />
                {q && <button data-testid="site-menu-search-clear" onClick={() => setQ("")} className="text-white/70"><X className="w-4 h-4" /></button>}
              </div>
            </div>
          )}
        </div>

        <div className="p-3">
          {/* ===== CONTENUTO CONTESTUALE ===== */}
          {ctx === "lab" ? (
            nq ? (
              <div data-testid="site-menu-search-results" className="grid grid-cols-1 gap-1.5">
                {filteredTools.length === 0 && <p className="text-center text-sm text-[#7E8A93] py-6">{tri("Nessun risultato.", "Kein Ergebnis.", "No results.", "Sin resultados.")}</p>}
                {filteredTools.map((tl) => <ToolRow key={tl.id} tl={tl} />)}
              </div>
            ) : (
              <>
                {favTools.length > 0 && (
                  <div data-testid="site-menu-cat-preferiti" className="mb-4">
                    <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-[#E0A106]/40">
                      <span className="w-6 h-6 rounded-md flex items-center justify-center bg-[#E0A106]/15"><Star className="w-3.5 h-3.5 fill-[#E0A106] text-[#E0A106]" /></span>
                      <span className="font-display text-sm font-bold text-[#B4790a]">{tri("Preferiti", "Favoriten", "Favourites", "Favoritos")}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">{favTools.map((tl) => <ToolRow key={tl.id} tl={tl} />)}</div>
                  </div>
                )}
                <div className="space-y-3">
                  {TOOL_KINDS.map((c) => {
                    const items = TOOLS.filter((tl) => tl.kind === c.key && allowed(tl));
                    if (items.length === 0) return null;
                    return (
                      <div key={c.key} data-testid={`site-menu-kind-${c.key}`}>
                        <div className="flex items-center gap-2 mb-1 pb-1 border-b" style={{ borderColor: `${c.color}40` }}>
                          <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: `${c.color}1a` }}><c.Icon className="w-3.5 h-3.5" style={{ color: c.color }} /></span>
                          <span className="font-display text-sm font-bold" style={{ color: c.color }}>{tri(c.it, c.de, c.en, c.es)}</span>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">{items.map((tl) => <ToolRow key={tl.id} tl={tl} />)}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )
          ) : ctx === "social" ? (
            <div data-testid="site-menu-social">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#7E8A93] mb-1.5 px-1">{tri("Ordina la bacheca", "Feed sortieren", "Sort the feed", "Ordenar el muro")}</p>
              <div className="grid grid-cols-3 gap-1.5 mb-4">
                {FEED_ORDER.map((f) => (
                  <button key={f.o} data-testid={`site-menu-feed-${f.o}`} onClick={() => goFeed(f.o)}
                    className="flex flex-col items-center gap-1 py-2.5 rounded-2xl shadow-md border border-amber-900/40 bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] active:scale-95 hover:border-[#ff6b00]/60 transition-all">
                    <f.Icon className="w-4 h-4 text-[#ff6b00]" /><span className="text-[12px] font-semibold text-[#2B303B] dark:text-[#e4eff8]">{f.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#7E8A93] mb-1.5 px-1">{tri("Voci del Social", "Social-Bereiche", "Social sections", "Secciones del Social")}</p>
              <div className="grid grid-cols-1 gap-1.5">
                {SOCIAL.map((s) => (
                  <button key={s.v} data-testid={`site-menu-social-${s.v}`} onClick={() => goSocial(s.v)}
                    className="flex items-center gap-3 text-left px-3 py-3 rounded-2xl shadow-md border border-amber-900/40 bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] active:scale-98 hover:border-[#ff6b00]/60 transition-all">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${s.color}1a` }}><s.Icon className="w-4.5 h-4.5" style={{ color: s.color }} /></span>
                    <span className="font-display text-sm font-bold text-[#2B303B] dark:text-[#e4eff8]">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* generic (home/impara) → giusto una guida rapida */
            <p className="text-sm text-[#7E8A93] px-1 mb-2">{tri("Scegli dove andare 👇", "Wähle dein Ziel 👇", "Choose where to go 👇", "Elige a dónde ir 👇")}</p>
          )}

          {/* ===== SALTA A UN'ALTRA SEZIONE (sempre disponibile) ===== */}
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#7E8A93] mt-5 mb-1.5 px-1">{tri("Vai a un'altra sezione", "Zu einem anderen Bereich", "Go to another section", "Ir a otra sección")}</p>
          <div className="grid grid-cols-1 gap-1.5">
            {SECTIONS.map((s) => (
              <button key={s.id} data-testid={`site-menu-section-${s.id}`} onClick={() => goTab(s.id)}
                className={`flex items-center gap-3 text-left px-3 py-2.5 rounded-2xl shadow-md border border-amber-900/40 border active:scale-98 transition-all ${tab === s.id ? "bg-[#ff6b00]/10 border-[#ff6b00]/40" : "bg-white dark:bg-[#1e1e1e] border-[#2e2e2e] dark:border-[#2e2e2e] hover:border-[#ff6b00]/60"}`}>
                <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${s.color}1a` }}><s.Icon className="w-4 h-4" style={{ color: s.color }} /></span>
                <span className="font-display text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8]">{s.label}</span>
                {tab === s.id && <span className="ml-auto text-[10px] font-bold text-[#ff6b00] bg-[#ff6b00]/15 px-2 py-0.5 rounded-full">{tri("qui", "hier", "here", "aquí")}</span>}
              </button>
            ))}
            <button data-testid="site-menu-section-sfide" onClick={goSfide}
              className="flex items-center gap-3 text-left px-3 py-2.5 rounded-2xl shadow-md border border-amber-900/40 bg-gradient-to-br from-[#ff6b00] to-[#ff6b00] text-white active:scale-98 transition-all">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-white/20"><Trophy className="w-4 h-4" /></span>
              <span className="font-display text-sm font-semibold">{tri("Motore Sfide", "Challenges", "Challenges", "Desafíos")}</span>
            </button>
            <button data-testid="site-menu-guida" onClick={() => { setOpen(false); window.dispatchEvent(new Event("mikilab-open-guida")); }}
              className="flex items-center gap-3 text-left px-3 py-2.5 rounded-2xl shadow-md border border-amber-900/40 bg-white dark:bg-[#1e1e1e] border border-[#ff6b00]/40 active:scale-98 hover:border-[#ff6b00]/70 transition-all">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[#ff6b00]/15"><BookOpenCheck className="w-4 h-4 text-[#ff6b00]" /></span>
              <span className="font-display text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8]">{tri("Guida MikiLab", "MikiLab-Anleitung", "MikiLab Guide", "Guía MikiLab")}</span>
            </button>
            {/* Voce assistente: selettore Operatore (Michele / Momi), voci ElevenLabs */}
            <div data-testid="site-menu-voice" className="mt-1 rounded-2xl shadow-md border border-amber-900/40 bg-white dark:bg-[#1e1e1e] border border-[#ff6b00]/40 p-2.5">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#7E8A93] mb-1.5 px-0.5"><Mic className="w-3.5 h-3.5 text-[#ff6b00]" /> {tri("Voce assistente", "Assistenten-Stimme", "Assistant voice", "Voz del asistente")}</p>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-[#e4eff8] dark:bg-[#121212]">
                {[
                  { id: "michele", label: tri("Michele", "Michele", "Michele", "Michele"), sub: tri("Maschile profonda", "Tief männlich", "Deep male", "Grave masculina") },
                  { id: "momy", label: "Momi", sub: tri("Voce dedicata", "Eigene Stimme", "Dedicated voice", "Voz dedicada") },
                ].map((v) => (
                  <button key={v.id} data-testid={`site-menu-voice-${v.id}`} onClick={() => choosePersona(v.id)}
                    className={`py-2 px-1 rounded-md text-[13px] font-bold leading-tight transition-all ${persona === v.id ? "bg-[#ff6b00] text-white shadow" : "text-[#7E8A93] hover:text-[#ff6b00]"}`}>
                    {v.label}<span className={`block text-[9.5px] font-semibold ${persona === v.id ? "text-white/80" : "text-[#9AA6AE]"}`}>{v.sub}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#7E8A93] leading-snug mt-1.5 px-0.5">{tri("Voci ultra-realistiche ElevenLabs. Di' «Ehi Lab» per parlare a mani libere.", "Ultra-realistische ElevenLabs-Stimmen. Sag «Ehi Lab».", "Ultra-realistic ElevenLabs voices. Say «Ehi Lab» to talk hands-free.", "Voces ultrarrealistas ElevenLabs. Di «Ehi Lab».")}</p>
            </div>
            {/* Sicurezza: blocco con PIN a 4 cifre */}
            <div data-testid="site-menu-security" className="mt-1 rounded-2xl shadow-md border border-amber-900/40 bg-white dark:bg-[#1e1e1e] border border-[#ff6b00]/40 p-2.5">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#7E8A93] mb-1.5 px-0.5"><Lock className="w-3.5 h-3.5 text-[#ff6b00]" /> {tri("Sicurezza · PIN", "Sicherheit · PIN", "Security · PIN", "Seguridad · PIN")}</p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-[#2b3640] dark:text-[#E6EEF3]">{tri("Blocco all'avvio", "Sperre beim Start", "Lock on start", "Bloqueo al inicio")}</span>
                <button data-testid="site-menu-pin-toggle" onClick={togglePin} role="switch" aria-checked={pinOn}
                  className={`w-11 h-6 rounded-full transition-all relative ${pinOn ? "bg-[#ff6b00]" : "bg-[#c7d2da] dark:bg-[#333]"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${pinOn ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
              {pinOn && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {!pinEditing ? (
                    <>
                      <button data-testid="site-menu-pin-change" onClick={() => { setPinEditing(true); setPinMsg(""); }} className="text-[12px] font-bold px-2.5 py-1.5 rounded-lg bg-[#ff6b00]/12 text-[#ff6b00]">{tri("Cambia PIN", "PIN ändern", "Change PIN", "Cambiar PIN")}</button>
                      <button data-testid="site-menu-lock-now" onClick={lockNowBtn} className="text-[12px] font-bold px-2.5 py-1.5 rounded-lg bg-[#241B10] text-[#E7B23C] border border-[#6E5320]">{tri("Blocca ora", "Jetzt sperren", "Lock now", "Bloquear ahora")}</button>
                    </>
                  ) : (
                    <>
                      <input data-testid="site-menu-pin-input" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        inputMode="numeric" maxLength={4} placeholder="1985" autoFocus
                        className="w-20 text-center tracking-[6px] font-extrabold text-[16px] py-1.5 rounded-lg bg-[#f0f4f8] dark:bg-[#121212] border border-[#ff6b00]/40 text-[#2b3640] dark:text-white" />
                      <button data-testid="site-menu-pin-save" onClick={savePin} className="text-[12px] font-bold px-2.5 py-1.5 rounded-lg bg-[#ff6b00] text-white">{tri("Salva", "Speichern", "Save", "Guardar")}</button>
                      <button onClick={() => { setPinEditing(false); setNewPin(""); }} className="text-[12px] font-semibold px-2 py-1.5 rounded-lg text-[#7E8A93]">{tri("Annulla", "Abbrechen", "Cancel", "Cancelar")}</button>
                    </>
                  )}
                </div>
              )}
              {pinMsg && <p data-testid="site-menu-pin-msg" className="text-[11px] text-[#22a06b] font-semibold mt-1.5 px-0.5">{pinMsg}</p>}
            </div>
            {/* Interruttore modalità: Pro (tutto) / Passione (senza HACCP e B2B) */}
            <div data-testid="site-menu-mode" className="mt-1 rounded-2xl shadow-md border border-amber-900/40 bg-white dark:bg-[#1e1e1e] border border-[#ff6b00]/40 p-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#7E8A93] mb-1.5 px-0.5">{tri("Modalità", "Modus", "Mode", "Modo")}</p>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-[#e4eff8] dark:bg-[#121212]">
                {[
                  { id: "pro", label: tri("Fornaio Pro", "Bäcker Pro", "Baker Pro", "Panadero Pro") },
                  { id: "passion", label: tri("Per Passione", "Aus Leidenschaft", "For Passion", "Por Pasión") },
                ].map((m) => (
                  <button key={m.id} data-testid={`site-menu-mode-${m.id}`} onClick={() => chooseProfile(m.id)}
                    className={`py-2 rounded-md text-[13px] font-bold transition-all ${profile === m.id ? "bg-[#ff6b00] text-white shadow" : "text-[#7E8A93] hover:text-[#ff6b00]"}`}>
                    {m.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#7E8A93] leading-snug mt-1.5 px-0.5">
                {passion
                  ? tri("Vedi solo Ricette, calcolatori base e Academy.", "Nur Rezepte, Basisrechner und Academy.", "Only recipes, basic calculators and Academy.", "Solo recetas, calculadoras básicas y Academy.")
                  : tri("Vedi tutto: HACCP, business e strumenti avanzati.", "Alles sichtbar: HACCP, Business und Profi-Tools.", "Everything visible: HACCP, business and advanced tools.", "Todo visible: HACCP, negocio y herramientas avanzadas.")}
              </p>
            </div>
            {user?.role === "admin" && (
              <button data-testid="site-menu-admin" onClick={() => { setOpen(false); window.dispatchEvent(new Event("mikilab-open-admin")); }}
                className="flex items-center gap-3 text-left px-3 py-2.5 rounded-2xl shadow-md border border-amber-900/40 bg-white dark:bg-[#1e1e1e] border border-[#ff6b00]/40 active:scale-98 hover:border-[#ff6b00]/70 transition-all">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[#ff6b00]/15"><Shield className="w-4 h-4 text-[#ff6b00]" /></span>
                <span className="font-display text-sm font-semibold text-[#ff6b00]">{tri("Pannello Admin", "Admin-Panel", "Admin Panel", "Panel Admin")}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
