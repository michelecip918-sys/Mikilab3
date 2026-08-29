import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Home as HomeIcon, BookOpen, Wrench, GraduationCap, Users, Trophy, Menu, Search, Star,
  Rss, UserPlus, MessageCircle, Store, MapPin, User, Clock, Flame, Shield } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { TOOLS, TOOL_CATS } from "@/sections/PianoProduzioneAI";
import { mkTri } from "@/i18n/triMaps";

const FAV_KEY = "mikilab_menu_favs";
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Menù CONTESTUALE: mostra le voci della sezione in cui ti trovi (Laboratorio → strumenti,
// Social → voci social + ordina feed) + una lista compatta per saltare tra le sezioni.
export default function SiteMenu({ onNavigate, onOpenSfide, tab }) {
  const { lang } = useLang();
  const { user } = useAuth();
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [favs, setFavs] = useState(() => { try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch { return []; } });

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
    { id: "home", Icon: HomeIcon, label: tri("Home", "Home", "Home", "Inicio"), color: "#6E371C" },
    { id: "ricette", Icon: BookOpen, label: tri("Le Ricette di MikiLab", "Die MikiLab-Rezepte", "The MikiLab Recipes", "Las Recetas de MikiLab"), color: "#B45309" },
    { id: "maestro", Icon: Wrench, label: tri("Il Tuo Laboratorio", "Dein Labor", "Your Lab", "Tu Laboratorio"), color: "#8C4A27" },
    { id: "impara", Icon: GraduationCap, label: tri("Impara a Livelli", "Lerne in Stufen", "Learn by Levels", "Aprende por Niveles"), color: "#A16207" },
    { id: "community", Icon: Users, label: tri("Community & Mercatino", "Community & Markt", "Community & Market", "Comunidad y Mercado"), color: "#C0574D" },
  ];
  const SOCIAL = [
    { v: "feed", Icon: Rss, label: tri("Bacheca (Feed)", "Pinnwand (Feed)", "Feed", "Muro (Feed)"), color: "#123c4a" },
    { v: "friends", Icon: UserPlus, label: tri("Amici & Colleghi", "Freunde & Kollegen", "Friends & Colleagues", "Amigos y Colegas"), color: "#8C4A27" },
    { v: "messages", Icon: MessageCircle, label: tri("Messaggi", "Nachrichten", "Messages", "Mensajes"), color: "#7a4fbf" },
    { v: "market", Icon: Store, label: tri("Mercatino dell'Usato", "Gebraucht-Markt", "Used Market", "Mercadillo"), color: "#B45309" },
    { v: "map", Icon: MapPin, label: tri("Mappa dei Fornai", "Bäcker-Karte", "Bakers Map", "Mapa de Panaderos"), color: "#2e8b6f" },
    { v: "profile", Icon: User, label: tri("Il mio profilo", "Mein Profil", "My profile", "Mi perfil"), color: "#6E371C" },
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
  const filteredTools = nq ? TOOLS.filter((t) => norm(toolLabel(t)).includes(nq)) : [];
  const favTools = favs.map((id) => byId[id]).filter(Boolean);

  const ctx = tab === "maestro" ? "lab" : tab === "community" ? "social" : tab === "ricette" ? "ricette" : "generic";
  const ctxTitle = ctx === "lab" ? tri("Il Tuo Laboratorio", "Dein Labor", "Your Lab", "Tu Laboratorio")
    : ctx === "social" ? tri("Social", "Social", "Social", "Social")
    : ctx === "ricette" ? tri("Le Ricette", "Rezepte", "Recipes", "Recetas")
    : tri("MikiLab", "MikiLab", "MikiLab", "MikiLab");

  const ToolRow = ({ tl }) => {
    const c = catOf(tl.cat); const isFav = favs.includes(tl.id);
    return (
      <div className="flex items-center gap-1">
        <button data-testid={`site-menu-tool-${tl.id}`} onClick={() => goTool(tl.id)}
          className="flex-1 flex items-center gap-2.5 text-left px-3 py-2.5 rounded-xl bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] active:scale-98 hover:border-[#B45309]/60 transition-all min-w-0">
          <tl.Icon className="w-4 h-4 shrink-0" style={{ color: c.color }} />
          <span className="text-sm font-medium text-[#2B303B] dark:text-[#e4eff8] truncate">{toolLabel(tl)}</span>
        </button>
        <button data-testid={`site-menu-fav-${tl.id}`} onClick={() => toggleFav(tl.id)} aria-label="Preferito"
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 active:scale-90 transition-all border border-[#E6D8C3] dark:border-[#38424B] bg-white dark:bg-[#232A31]">
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
        className="absolute top-0 left-0 h-full w-[88%] max-w-sm bg-[#FAF5EC] dark:bg-[#1A1F24] shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-300">
        <div className="sticky top-0 z-10 bg-[#6E371C] text-white">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-white/70 font-bold">{tri("Menù di questa sezione", "Menü dieses Bereichs", "This section's menu", "Menú de esta sección")}</p>
              <span data-testid="site-menu-title" className="font-display text-lg font-bold flex items-center gap-2 truncate"><Menu className="w-5 h-5 shrink-0" /> {ctxTitle}</span>
            </div>
            <button data-testid="site-menu-close" onClick={() => setOpen(false)} className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center active:scale-95 shrink-0"><X className="w-5 h-5" /></button>
          </div>
          {ctx === "lab" && (
            <div className="px-3 pb-3">
              <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2">
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
                  {TOOL_CATS.map((c) => {
                    const items = TOOLS.filter((tl) => tl.cat === c.key);
                    if (items.length === 0) return null;
                    return (
                      <div key={c.key} data-testid={`site-menu-cat-${c.key}`}>
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
                    className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] active:scale-95 hover:border-[#C0574D]/60 transition-all">
                    <f.Icon className="w-4 h-4 text-[#C0574D]" /><span className="text-[12px] font-semibold text-[#2B303B] dark:text-[#e4eff8]">{f.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#7E8A93] mb-1.5 px-1">{tri("Voci del Social", "Social-Bereiche", "Social sections", "Secciones del Social")}</p>
              <div className="grid grid-cols-1 gap-1.5">
                {SOCIAL.map((s) => (
                  <button key={s.v} data-testid={`site-menu-social-${s.v}`} onClick={() => goSocial(s.v)}
                    className="flex items-center gap-3 text-left px-3 py-3 rounded-xl bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] active:scale-98 hover:border-[#C0574D]/60 transition-all">
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
                className={`flex items-center gap-3 text-left px-3 py-2.5 rounded-xl border active:scale-98 transition-all ${tab === s.id ? "bg-[#8C4A27]/10 border-[#8C4A27]/40" : "bg-white dark:bg-[#232A31] border-[#E6D8C3] dark:border-[#38424B] hover:border-[#B45309]/60"}`}>
                <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${s.color}1a` }}><s.Icon className="w-4 h-4" style={{ color: s.color }} /></span>
                <span className="font-display text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8]">{s.label}</span>
                {tab === s.id && <span className="ml-auto text-[10px] font-bold text-[#8C4A27] bg-[#8C4A27]/15 px-2 py-0.5 rounded-full">{tri("qui", "hier", "here", "aquí")}</span>}
              </button>
            ))}
            <button data-testid="site-menu-section-sfide" onClick={goSfide}
              className="flex items-center gap-3 text-left px-3 py-2.5 rounded-xl bg-gradient-to-br from-[#B45309] to-[#8C4A27] text-white active:scale-98 transition-all">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-white/20"><Trophy className="w-4 h-4" /></span>
              <span className="font-display text-sm font-semibold">{tri("Motore Sfide", "Challenges", "Challenges", "Desafíos")}</span>
            </button>
            {user?.role === "admin" && (
              <button data-testid="site-menu-admin" onClick={() => { setOpen(false); window.dispatchEvent(new Event("mikilab-open-admin")); }}
                className="flex items-center gap-3 text-left px-3 py-2.5 rounded-xl bg-white dark:bg-[#232A31] border border-[#B45309]/40 active:scale-98 hover:border-[#B45309]/70 transition-all">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[#B45309]/15"><Shield className="w-4 h-4 text-[#B45309]" /></span>
                <span className="font-display text-sm font-semibold text-[#B45309]">{tri("Pannello Admin", "Admin-Panel", "Admin Panel", "Panel Admin")}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
