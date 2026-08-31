import { useState, useEffect } from "react";
import { Users, Heart, MessageCircle, Trash2, Send, ImagePlus, Lightbulb, Camera, BookOpen, HelpCircle, Loader2, Store, UserPlus, MapPin, Sparkles, CalendarDays, Stethoscope, Trophy, Cake, Wheat, Pizza, Cookie, LifeBuoy } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { communityApi, uploadApi } from "@/lib/api";
import { toast } from "sonner";
import AvatarBubbles from "@/components/AvatarBubbles";
import HallOfFame from "@/components/HallOfFame";
import SectionHero from "@/components/SectionHero";
import SectionJumpBar from "@/components/SectionJumpBar";
import Marketplace from "@/sections/Marketplace";
import { marketNewCount, markMarketSeen } from "@/lib/market";
import FriendsPanel from "@/components/FriendsPanel";
import ProfilePanel from "@/components/ProfilePanel";
import ChatPanel from "@/components/ChatPanel";
import BakersMap from "@/components/BakersMap";
import { friendsApi, dmApi } from "@/lib/api";
import { mkTri } from "@/i18n/triMaps";

const CATS = [
  { id: "consiglio", Icon: Lightbulb, color: "#E0A458" },
  { id: "idea", Icon: Sparkles, color: "#ff6b00" },
  { id: "foto", Icon: Camera, color: "#ff6b00" },
  { id: "ricetta", Icon: BookOpen, color: "#ff6b00" },
  { id: "domanda", Icon: HelpCircle, color: "#ff6b00" },
  { id: "evento", Icon: CalendarDays, color: "#2e8b6f" },
  { id: "pane", Icon: Wheat, color: "#E0A458" },
  { id: "pizza", Icon: Pizza, color: "#ff6b00" },
  { id: "dolci", Icon: Cookie, color: "#ff6b00" },
  { id: "sos", Icon: LifeBuoy, color: "#ff3b5c" },
];
// Categorie mostrate nel feed ma non selezionabili dall'utente (es. traguardi automatici).
const FEED_CATS = [...CATS, { id: "traguardo", Icon: Trophy, color: "#ff6b00" }, { id: "auguri", Icon: Cake, color: "#ff6b00" }];

function timeAgo(iso, lang) {
  try {
    const d = new Date(iso); const diff = (Date.now() - d.getTime()) / 1000;
    const rtf = new Intl.RelativeTimeFormat(lang === "en" ? "en" : lang === "de" ? "de" : "it", { numeric: "auto" });
    if (diff < 60) return rtf.format(-Math.round(diff), "second");
    if (diff < 3600) return rtf.format(-Math.round(diff / 60), "minute");
    if (diff < 86400) return rtf.format(-Math.round(diff / 3600), "hour");
    return rtf.format(-Math.round(diff / 86400), "day");
  } catch { return ""; }
}

export default function Community({ onNavigate }) {
  const { lang } = useLang();
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const { user, setAuthOpen } = useAuth();

  const catLabel = (id) => ({
    consiglio: tri("Consiglio", "Tipp", "Tip", "Consejo"),
    idea: tri("Idea", "Idee", "Idea", "Idea"),
    foto: tri("Foto", "Foto", "Photo", "Foto"),
    ricetta: tri("Ricetta", "Rezept", "Recipe", "Receta"),
    domanda: tri("Domanda", "Frage", "Question", "Pregunta"),
    evento: tri("Evento", "Event", "Event", "Evento"),
    traguardo: tri("Traguardo", "Erfolg", "Achievement", "Logro"),
    auguri: tri("Auguri", "Glückwunsch", "Greetings", "Felicidades"),
    pane: tri("Pane", "Brot", "Bread", "Pan"),
    pizza: tri("Pizza", "Pizza", "Pizza", "Pizza"),
    dolci: tri("Dolci", "Süßes", "Sweets", "Dulces"),
    sos: tri("SOS / Aiuto", "SOS / Hilfe", "SOS / Help", "SOS / Ayuda"),
  }[id] || id);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [text, setText] = useState("");
  const [cat, setCat] = useState("consiglio");
  const [photo, setPhoto] = useState("");
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [commentFor, setCommentFor] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [marketNew, setMarketNew] = useState(0);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [friendReqCount, setFriendReqCount] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUser, setChatUser] = useState(null);
  const [msgUnread, setMsgUnread] = useState(0);
  const [feed, setFeed] = useState("all");
  const [chSeen, setChSeen] = useState(() => { try { return JSON.parse(localStorage.getItem("mikilab_channel_seen") || "{}"); } catch { return {}; } });
  useEffect(() => { setMarketNew(marketNewCount()); }, []);
  useEffect(() => {
    const loadReq = () => { friendsApi.list().then((r) => setFriendReqCount((r?.incoming || []).length)).catch(() => {}); };
    loadReq();
    if (!user) return undefined;
    const id = setInterval(loadReq, 15000);
    return () => clearInterval(id);
  }, [user]);
  const loadMsgUnread = () => { if (user) dmApi.conversations().then((c) => setMsgUnread((c || []).reduce((a, x) => a + (x.unread || 0), 0))).catch(() => {}); };
  useEffect(() => { loadMsgUnread(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = async (f = feed) => { setLoading(true); setPosts(await communityApi.list(f)); setLoading(false); };
  useEffect(() => { load(feed); }, [feed]); // eslint-disable-line react-hooks/exhaustive-deps

  // Menù contestuale del Social: apre le viste e imposta l'ordinamento del feed via eventi.
  useEffect(() => {
    const onView = (e) => {
      const v = e?.detail?.view;
      if (v === "friends") setFriendsOpen(true);
      else if (v === "map") setMapOpen(true);
      else if (v === "messages") { if (user) { setChatUser(null); setChatOpen(true); } else setAuthOpen(true); }
      else if (v === "profile") { if (user) setProfileUser(user.user_id); else setAuthOpen(true); }
      else if (v === "market") { markMarketSeen(); setMarketNew(0); document.querySelector('[data-testid="community-marketplace"]')?.scrollIntoView({ behavior: "smooth", block: "start" }); }
      else if (v === "feed") document.querySelector('[data-testid="feed-toggle"]')?.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    const onFeed = (e) => { const o = e?.detail?.order; if (o) { if (o === "friends" && !user) { setAuthOpen(true); return; } setFeed(o); document.querySelector('[data-testid="feed-toggle"]')?.scrollIntoView({ behavior: "smooth", block: "center" }); } };
    window.addEventListener("mikilab-social-view", onView);
    window.addEventListener("mikilab-social-feed", onFeed);
    return () => { window.removeEventListener("mikilab-social-view", onView); window.removeEventListener("mikilab-social-feed", onFeed); };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const SOCIAL_SLOGANS = [
    { it: "È ora di rilassarti, Chef 🥐", de: "Zeit zum Entspannen, Chef 🥐", en: "Time to relax, Chef 🥐", es: "Hora de relajarte, Chef 🥐" },
    { it: "Pausa caffè tra fornai ☕", de: "Kaffeepause unter Bäckern ☕", en: "Coffee break among bakers ☕", es: "Pausa café entre panaderos ☕" },
    { it: "Due chiacchiere con i colleghi 💬", de: "Ein Schwatz mit Kollegen 💬", en: "A chat with fellow bakers 💬", es: "Charla con colegas 💬" },
    { it: "Mostra la tua sfornata! 📸", de: "Zeig dein Backwerk! 📸", en: "Show your bake! 📸", es: "¡Muestra tu horneada! 📸" },
  ];
  const [socialSlogan] = useState(() => SOCIAL_SLOGANS[Math.floor(Math.random() * SOCIAL_SLOGANS.length)]);

  const needLogin = () => { if (!user) { setAuthOpen(true); return true; } return false; };

  const onPhoto = async (e) => {
    const f = e.target.files && e.target.files[0]; e.target.value = "";
    if (!f) return;
    if (needLogin()) return;
    setUploading(true);
    try { const url = await uploadApi.image(f, f.name || "foto.jpg"); setPhoto(url); }
    catch { toast.error(tri("Caricamento foto non riuscito", "Foto-Upload fehlgeschlagen", "Photo upload failed", "Error al subir la foto")); }
    finally { setUploading(false); }
  };

  const submit = async () => {
    if (needLogin()) return;
    if (!text.trim() && !photo) { toast.error(tri("Scrivi qualcosa o allega una foto", "Schreibe etwas oder füge ein Foto hinzu", "Write something or attach a photo", "Escribe algo o adjunta una foto")); return; }
    setPosting(true);
    try {
      const p = await communityApi.create({ category: cat, text: text.trim(), image_url: photo || null });
      setPosts((prev) => [p, ...prev]); setText(""); setPhoto(""); setCat("consiglio");
      toast.success(tri("Pubblicato!", "Veröffentlicht!", "Posted!", "¡Publicado!"));
    } catch { toast.error(tri("Pubblicazione non riuscita", "Veröffentlichung fehlgeschlagen", "Post failed", "Error al publicar")); }
    finally { setPosting(false); }
  };

  const like = async (id) => { if (needLogin()) return; try { const p = await communityApi.like(id); setPosts((prev) => prev.map((x) => (x.id === id ? p : x))); } catch { toast.error(tri("Azione non riuscita", "Aktion fehlgeschlagen", "Action failed", "Acción fallida")); } };
  const remove = async (id) => { try { await communityApi.remove(id); setPosts((prev) => prev.filter((x) => x.id !== id)); } catch { toast.error(tri("Eliminazione non riuscita", "Löschen fehlgeschlagen", "Delete failed", "Error al eliminar")); } };
  const sendComment = async (id) => {
    if (needLogin()) return;
    if (!commentText.trim()) return;
    try { const p = await communityApi.comment(id, commentText.trim()); setPosts((prev) => prev.map((x) => (x.id === id ? p : x))); setCommentText(""); }
    catch { toast.error(tri("Commento non inviato", "Kommentar nicht gesendet", "Comment not sent", "Comentario no enviado")); }
  };

  const visible = filter === "all" ? posts : posts.filter((p) => p.category === filter);
  const latestByCat = {};
  for (const p of posts) { const c = p.category; if (c && (!latestByCat[c] || p.created_at > latestByCat[c])) latestByCat[c] = p.created_at; }
  const hasNew = (id) => !!latestByCat[id] && (!chSeen[id] || latestByCat[id] > chSeen[id]);
  const selectFilter = (id) => {
    setFilter(id);
    if (id !== "all") setChSeen((s) => { const n = { ...s, [id]: new Date().toISOString() }; try { localStorage.setItem("mikilab_channel_seen", JSON.stringify(n)); } catch { /* */ } return n; });
  };
  const inp = "w-full bg-[#121212] dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-xl px-3 py-2.5 outline-none text-[#2B303B] dark:text-[#e4eff8] focus:border-[#ff6b00]";

  // Registrazione OBBLIGATORIA per accedere al Social
  if (!user) {
    return (
      <div className="pb-40" data-testid="community-auth-gate">
        <div className="relative overflow-hidden rounded-3xl p-7 text-white shadow-xl text-center border border-[#ff6b00]/40"
          style={{ background: "linear-gradient(135deg,#c94f00 0%,#1e1e1e 85%)" }}>
          <div className="w-16 h-16 rounded-2xl bg-[#ff6b00]/20 border border-[#ff6b00]/40 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-[#ff6b00]" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">{tri("🌐 Community & Feed Social", "🌐 Community & Social-Feed", "🌐 Community & Social Feed", "🌐 Comunidad y Feed Social")}</h1>
          <p className="text-white/90 text-sm mt-2 leading-snug">
            {tri("Registrati gratis per vedere la bacheca, i colleghi, il mercatino e partecipare alle sfide.",
                 "Registriere dich, um Pinnwand, Kollegen, Markt und Challenges zu sehen.",
                 "Register to see the feed, colleagues, marketplace and join the challenges.",
                 "Regístrate para ver el muro, colegas, mercadillo y participar en los retos.")}
          </p>
          <button data-testid="community-register-btn" onClick={() => setAuthOpen(true)}
            className="mt-5 w-full bg-[#ff6b00] text-white font-bold px-5 py-3.5 rounded-2xl shadow-[0_4px_14px_rgba(255,107,0,0.4)] active:scale-98 hover:bg-[#ff8226] transition-all">
            {tri("Registrati per entrare", "Registrieren und eintreten", "Register to enter", "Regístrate para entrar")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-40" data-testid="community">
      <SectionHero testid="community-title" image="hero-social.jpg" position="50% 30%"
        title={tri("Social", "Social", "Social", "Social")}
        subtitle={mkTri(lang)("Confronto, consigli e ricette tra fornai veri", "Austausch, Tipps und Rezepte unter echten Bäckern", "Sharing, tips and recipes among real bakers", "Intercambio, consejos y recetas entre panaderos de verdad", "Échanges, conseils et recettes entre vrais boulangers", "گفت‌وگو، نکته‌ها و دستورها میان نانوایان واقعی")} />
      {/* Header social — compatto (navigazione via menù globale) */}
      <div data-testid="community-social-header" className="relative overflow-hidden rounded-2xl p-4 mb-4 text-white shadow-md"
        style={{ background: "linear-gradient(135deg,#1e1e1e 0%,#1f5a68 60%,#ff6b00 100%)" }}>
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-xl bg-white/25 border-2 border-white/70 overflow-hidden shadow">
              <img src={`${process.env.PUBLIC_URL}/michele-avatar.jpg`} alt="MikiLab" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-extrabold leading-none drop-shadow-sm">{lang === "de" ? socialSlogan.de : lang === "en" ? socialSlogan.en : lang === "es" ? socialSlogan.es : socialSlogan.it}</h1>
            <p className="text-[12px] text-white/90 mt-1 leading-snug">{tri("Stacca dal forno: idee, foto, amici e mercatino tra colleghi", "Pause vom Ofen: Ideen, Fotos, Freunde & Markt", "Off the oven: ideas, photos, friends & market", "Fuera del horno: ideas, fotos, amigos y mercadillo")}</p>
          </div>
          {user && (
            <button data-testid="open-my-profile" onClick={() => setProfileUser(user.user_id)}
              className="shrink-0 inline-flex items-center gap-1.5 text-[12px] font-bold bg-white/20 hover:bg-white/30 border border-white/40 px-3 py-1.5 rounded-full active:scale-95 transition-all">
              <UserPlus className="w-3.5 h-3.5" /> {tri("Profilo", "Profil", "Profile", "Perfil")}
            </button>
          )}
        </div>
      </div>

      {/* Azioni Social compatte (le stesse sono anche nel menu ☰) */}
      <div className="grid grid-cols-3 gap-2 mb-4" data-testid="community-quick-actions">
        <button data-testid="community-friends-btn" onClick={() => setFriendsOpen(true)}
          className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] shadow-sm active:scale-95 hover:border-[#ff6b00]/60 transition-all">
          <div className="relative w-9 h-9 rounded-xl bg-[#ff6b00]/15 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-[#ff6b00]" />
            {friendReqCount > 0 && <span data-testid="friends-req-badge" className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#ff6b00] text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white">{friendReqCount}</span>}
          </div>
          <span className="text-[10.5px] font-semibold text-[#2B303B] dark:text-[#e4eff8] text-center leading-tight">{tri("Amici", "Freunde", "Friends", "Amigos")}</span>
        </button>

        <button data-testid="community-messages-btn" onClick={() => { if (needLogin()) return; setChatUser(null); setChatOpen(true); }}
          className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] shadow-sm active:scale-95 hover:border-[#ff6b00]/60 transition-all">
          <div className="relative w-9 h-9 rounded-xl bg-[#ff6b00]/15 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-[#ff6b00]" />
            {msgUnread > 0 && <span data-testid="messages-unread-badge" className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#ff6b00] text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white">{msgUnread > 9 ? "9+" : msgUnread}</span>}
          </div>
          <span className="text-[10.5px] font-semibold text-[#2B303B] dark:text-[#e4eff8] text-center leading-tight">{tri("Messaggi", "Nachrichten", "Messages", "Mensajes")}</span>
        </button>

        <button data-testid="community-map-btn" onClick={() => setMapOpen(true)}
          className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] shadow-sm active:scale-95 hover:border-[#ff6b00]/60 transition-all">
          <div className="relative w-9 h-9 rounded-xl bg-[#2e8b6f]/15 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-[#2e8b6f]" />
          </div>
          <span className="text-[10.5px] font-semibold text-[#2B303B] dark:text-[#e4eff8] text-center leading-tight">{tri("Mappa", "Karte", "Map", "Mapa")}</span>
        </button>
      </div>

      <FriendsPanel open={friendsOpen} onClose={() => setFriendsOpen(false)} onCount={setFriendReqCount}
        onMessage={(u) => { setFriendsOpen(false); setChatUser(u); setChatOpen(true); }} />
      {profileUser && <ProfilePanel userId={profileUser} onClose={() => setProfileUser(null)} onMessage={(u) => { setProfileUser(null); setChatUser(u); setChatOpen(true); }} />}
      <ChatPanel open={chatOpen} onClose={() => { setChatOpen(false); setChatUser(null); loadMsgUnread(); window.dispatchEvent(new Event("mikilab-notif-refresh")); }} initialUser={chatUser} />
      <BakersMap open={mapOpen} onClose={() => setMapOpen(false)} />

      <AvatarBubbles variant="community" />

      <SectionJumpBar testid="community-jump" sections={[
        { target: "community-composer", label: tri("Scrivi", "Schreiben", "Post", "Escribe", "Écrire"), Icon: Send },
        { target: "community-filters", label: tri("Canali", "Kanäle", "Channels", "Canales", "Canaux"), Icon: Wheat },
        { target: "community-feed", label: tri("Bacheca", "Pinnwand", "Board", "Tablón", "Tableau"), Icon: Users },
        { target: "community-marketplace", label: tri("Mercatino", "Markt", "Market", "Mercadillo", "Marché"), Icon: Trophy },
      ]} />

      {/* Composer */}
      {(() => {
        let done = false;
        try { const p = JSON.parse(localStorage.getItem("mikilab_impara_path") || "[]"); done = ["ricettario", "farine", "corsi"].every((x) => p.includes(x)); } catch { /* */ }
        if (!done) return null;
        return (
          <div data-testid="community-badge" className="flex items-center gap-2 mb-4 rounded-2xl bg-gradient-to-r from-[#ff6b00] to-[#ff6b00] text-white px-4 py-2.5 shadow">
            <span className="text-lg">🏅</span>
            <p className="text-sm font-semibold">{tri("Hai il badge «Fornaio Diplomato» — condividilo con i colleghi!", "Du hast das Abzeichen «Diplom-Bäcker» — teile es mit Kollegen!", "You have the «Certified Baker» badge — share it with peers!", "Tienes la insignia «Panadero Diplomado» — ¡compártela con tus colegas!")}</p>
          </div>
        );
      })()}

      <div data-testid="community-composer" className="bg-[#ff6b00]/10 border border-[#ff6b00]/30 rounded-2xl p-4 mb-5">
        <p className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8] mb-2">{tri("Cosa vuoi condividere?", "Was möchtest du teilen?", "What do you want to share?", "¿Qué quieres compartir?")}</p>
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {CATS.map(({ id, Icon, color }) => (
            <button key={id} data-testid={`community-cat-${id}`} onClick={() => setCat(id)}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-[11px] font-semibold transition-all ${cat === id ? "text-white border-transparent" : "bg-white dark:bg-[#1e1e1e] text-[#3F4A54] dark:text-[#AEB8BF] border-[#2e2e2e] dark:border-[#2e2e2e]"}`}
              style={cat === id ? { background: color } : {}}>
              <Icon className="w-4 h-4" /> {catLabel(id)}
            </button>
          ))}
        </div>
        <textarea data-testid="community-text" value={text} onChange={(e) => setText(e.target.value)} rows={3}
          placeholder={user ? tri("Condividi un consiglio, una foto o una ricetta…", "Teile einen Tipp, ein Foto oder ein Rezept…", "Share a tip, a photo or a recipe…", "Comparte un consejo, una foto o una receta…") : tri("Accedi per pubblicare…", "Zum Posten anmelden…", "Log in to post…", "Inicia sesión para publicar…")}
          className={inp} />
        {photo && <div className="relative mt-2"><img src={photo} alt="" className="w-full h-40 object-cover rounded-xl" /><button data-testid="community-photo-clear" onClick={() => setPhoto("")} className="absolute top-2 right-2 bg-black/60 text-white rounded-full px-2 py-0.5 text-xs">✕</button></div>}
        <div className="flex items-center gap-2 mt-2">
          <label data-testid="community-photo-btn" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] text-sm font-semibold text-[#3F4A54] dark:text-[#AEB8BF] cursor-pointer">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4 text-[#ff6b00]" />} {tri("Foto", "Foto", "Photo", "Foto")}
            <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
          </label>
          <button data-testid="community-submit" data-sfx="save" onClick={submit} disabled={posting}
            className="ml-auto flex items-center gap-1.5 bg-[#ff6b00] hover:bg-[#ff8a33] disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl active:scale-98 transition-all">
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {tri("Pubblica", "Posten", "Post", "Publicar")}
          </button>
        </div>
      </div>

      <HallOfFame />

      {/* Filtri */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-1 px-1" data-testid="community-filters">
        <button data-testid="community-filter-all" onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap border ${filter === "all" ? "bg-[#ff6b00] text-white border-[#ff6b00]" : "bg-white dark:bg-[#1e1e1e] text-[#3F4A54] dark:text-[#AEB8BF] border-[#2e2e2e] dark:border-[#2e2e2e]"}`}>{tri("Tutti", "Alle", "All", "Todos")}</button>
        {CATS.map((c) => (
          <button key={c.id} data-testid={`community-filter-${c.id}`} onClick={() => selectFilter(c.id)} className={`relative px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap border ${filter === c.id ? "bg-[#ff6b00] text-white border-[#ff6b00]" : "bg-white dark:bg-[#1e1e1e] text-[#3F4A54] dark:text-[#AEB8BF] border-[#2e2e2e] dark:border-[#2e2e2e]"}`}>
            {catLabel(c.id)}
            {hasNew(c.id) && <span data-testid={`community-new-dot-${c.id}`} className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#ff3b5c] border border-[#121212] shadow" />}
          </button>
        ))}
      </div>

      {/* Intestazione tematica bacheca */}
      <div className="flex items-center gap-2 mb-2 mt-1" data-testid="community-board-heading">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#ff6b00]/15" style={{ boxShadow: "inset 0 0 0 1px #ff6b00" }}><Users className="w-4 h-4 text-[#ff6b00]" /></span>
        <h2 className="font-display text-base font-bold text-white">{tri("Bacheca della community", "Community-Pinnwand", "Community board", "Tablón de la comunidad")}</h2>
      </div>

      {/* Feed — ordinamento */}
      <div data-testid="feed-toggle" className="flex gap-2 mb-3">
        {[["all", tri("Recenti", "Neueste", "Recent", "Recientes")], ["popular", tri("Popolari", "Beliebt", "Popular", "Populares")], ["friends", tri("Amici", "Freunde", "Friends", "Amigos")]].map(([id, lbl]) => (
          <button key={id} data-testid={`feed-tab-${id}`} onClick={() => { if (id === "friends" && needLogin()) return; setFeed(id); }}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${feed === id ? "bg-[#1e1e1e] text-white shadow-sm" : "bg-[#e4eff8] dark:bg-[#1e1e1e] text-[#7E8A93]"}`}>{lbl}</button>
        ))}
      </div>
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#ff6b00]" /></div>
      ) : (
        <div className="space-y-3" data-testid="community-feed">
          {(() => {
            const W = {
              pane: { Icon: Wheat, title: tri("Benvenuto nel canale Pane 🍞", "Willkommen im Brot-Kanal 🍞", "Welcome to the Bread channel 🍞", "Bienvenido al canal Pan 🍞"),
                body: tri("Qui si parla di pane: lievito madre, idratazione, crosta e mollica. Mostra le tue pagnotte, chiedi consigli e sii gentile con chi inizia. Foto e ricette benvenute!", "Hier dreht sich alles ums Brot: Sauerteig, Hydratation, Kruste und Krume. Zeig deine Laibe, frag nach Tipps und sei nett zu Anfängern. Fotos und Rezepte willkommen!", "This channel is all about bread: sourdough, hydration, crust and crumb. Show your loaves, ask for tips and be kind to beginners. Photos and recipes welcome!", "Aquí se habla de pan: masa madre, hidratación, corteza y miga. Muestra tus panes, pide consejos y sé amable con quien empieza. ¡Fotos y recetas bienvenidas!") },
              pizza: { Icon: Pizza, title: tri("Benvenuto nel canale Pizza 🍕", "Willkommen im Pizza-Kanal 🍕", "Welcome to the Pizza channel 🍕", "Bienvenido al canal Pizza 🍕"),
                body: tri("Napoletana, in teglia, alla pala: parliamo di impasti, maturazioni e cotture. Condividi la tua pizza e i tuoi trucchi. Niente spam, solo passione per il forno caldo!", "Neapolitanisch, im Blech, alla pala: Teige, Reifung und Backen. Teile deine Pizza und deine Tricks. Kein Spam, nur Leidenschaft für den heißen Ofen!", "Neapolitan, pan, pala: let's talk doughs, maturation and baking. Share your pizza and your tricks. No spam, just passion for the hot oven!", "Napolitana, en molde, a la pala: hablamos de masas, maduraciones y cocciones. Comparte tu pizza y tus trucos. ¡Sin spam, solo pasión por el horno!") },
              dolci: { Icon: Cookie, title: tri("Benvenuto nel canale Dolci 🧁", "Willkommen im Süßes-Kanal 🧁", "Welcome to the Sweets channel 🧁", "Bienvenido al canal Dulces 🧁"),
                body: tri("Panettoni, croissant, creme e grandi lievitati dolci. Mostra le tue farciture, chiedi sul bilanciamento di zuccheri e grassi. Qui si celebra la golosità con misura!", "Panettone, Croissants, Cremes und große süße Hefeteige. Zeig deine Füllungen, frag zum Zucker-Fett-Ausgleich. Hier feiern wir das Naschen mit Maß!", "Panettone, croissants, creams and big sweet leavened cakes. Show your fillings, ask about balancing sugars and fats. We celebrate sweetness with measure!", "Panettones, croissants, cremas y grandes levados dulces. Muestra tus rellenos, pregunta sobre el equilibrio de azúcares y grasas. ¡Aquí celebramos lo goloso con medida!") },
              sos: { Icon: LifeBuoy, title: tri("Benvenuto nel canale SOS / Aiuto 🆘", "Willkommen im SOS/Hilfe-Kanal 🆘", "Welcome to the SOS / Help channel 🆘", "Bienvenido al canal SOS / Ayuda 🆘"),
                body: tri("Impasto che non lievita? Crosta pallida? Chiedi qui: descrivi il problema, allega una foto e i tempi/temperature. La community e MikiLab ti aiutano a risolvere.", "Teig geht nicht auf? Blasse Kruste? Frag hier: beschreibe das Problem, füge ein Foto und Zeiten/Temperaturen hinzu. Die Community und MikiLab helfen dir.", "Dough not rising? Pale crust? Ask here: describe the problem, add a photo and your times/temperatures. The community and MikiLab will help you fix it.", "¿La masa no sube? ¿Corteza pálida? Pregunta aquí: describe el problema, adjunta una foto y los tiempos/temperaturas. La comunidad y MikiLab te ayudan.") },
            }[filter];
            if (!W) return null;
            const WI = W.Icon;
            return (
              <div data-testid={`forum-welcome-${filter}`} className="rounded-2xl border border-[#ff6b00]/50 bg-gradient-to-br from-[#2a1a0d] to-[#1a1a1a] p-4 shadow-md">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#ff6b00]/20" style={{ boxShadow: "inset 0 0 0 1px #ff6b00" }}><WI className="w-4.5 h-4.5 text-[#ff6b00]" /></span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#ff6b00]">📌 {tri("Fissato · MikiLab", "Angepinnt · MikiLab", "Pinned · MikiLab", "Fijado · MikiLab")}</p>
                    <h3 className="font-display text-[15px] font-bold text-white leading-tight truncate">{W.title}</h3>
                  </div>
                </div>
                <p className="text-[12.5px] text-[#E0D5CF] leading-snug">{W.body}</p>
              </div>
            );
          })()}
          {visible.length === 0 && <p className="text-center text-sm text-[#7E8A93] py-8">{tri("Ancora nessun post. Inizia tu la conversazione!", "Noch keine Beiträge. Starte du das Gespräch!", "No posts yet. Start the conversation!", "Aún no hay publicaciones. ¡Empieza tú la conversación!")}</p>}
          {visible.map((p) => {
            const C = FEED_CATS.find((c) => c.id === p.category) || FEED_CATS[0];
            return (
              <div key={p.id} data-testid={`community-post-${p.id}`} className="bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-2xl p-4 shadow-md hover:border-[#ff6b00]/40 transition-colors" style={{ borderLeft: `3px solid ${C.color}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <button data-testid={`post-author-${p.id}`} onClick={() => p.author_id && setProfileUser(p.author_id)} className="flex items-center gap-2 min-w-0 active:scale-98 transition-transform">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-display font-bold overflow-hidden" style={{ background: C.color }}>{p.author_avatar ? <img src={p.author_avatar} alt="" className="w-full h-full object-cover" /> : (p.author_name || "F")[0].toUpperCase()}</div>
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8] truncate hover:underline">{p.author_name}</p>
                      <p className="text-[11px] text-[#7E8A93]">{timeAgo(p.created_at, lang)}</p>
                    </div>
                  </button>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1" style={{ background: C.color + "22", color: C.color }}><C.Icon className="w-3 h-3" />{catLabel(p.category)}</span>
                  {p.can_delete && <button data-testid={`community-delete-${p.id}`} data-sfx="delete" onClick={() => remove(p.id)} className="text-[#7E8A93] hover:text-[#E4572E] p-1"><Trash2 className="w-4 h-4" /></button>}
                </div>
                {p.text && <p className="text-sm text-[#2B303B] dark:text-[#e4eff8] whitespace-pre-line leading-relaxed">{lang === "de" ? (p.text_de || p.text) : lang === "es" ? (p.text_es || p.text_en || p.text) : lang === "en" ? (p.text_en || p.text) : p.text}</p>}
                {p.image_url && <img src={p.image_url} alt="" className="w-full rounded-xl mt-2 max-h-80 object-cover" />}

                <div className="flex items-center gap-4 mt-3 pt-2 border-t border-[#2e2e2e] dark:border-[#2e2e2e]">
                  <button data-testid={`community-like-${p.id}`} onClick={() => like(p.id)} className={`flex items-center gap-1.5 text-sm font-semibold ${p.liked_by_me ? "text-[#E4572E]" : "text-[#7E8A93]"}`}>
                    <Heart className={`w-4 h-4 ${p.liked_by_me ? "fill-[#E4572E]" : ""}`} /> {p.like_count || 0}
                  </button>
                  <button data-testid={`community-comment-toggle-${p.id}`} onClick={() => setCommentFor(commentFor === p.id ? null : p.id)} className="flex items-center gap-1.5 text-sm font-semibold text-[#7E8A93]">
                    <MessageCircle className="w-4 h-4" /> {(p.comments || []).length}
                  </button>
                </div>

                {/* Commenti */}
                {(commentFor === p.id || (p.comments || []).length > 0) && (
                  <div className="mt-3 space-y-2">
                    {(p.comments || []).map((c) => (
                      <div key={c.id} className="flex gap-2 text-sm items-start">
                        <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-[#ff6b00] flex items-center justify-center text-white text-[10px] font-bold">{c.author_avatar ? <img src={c.author_avatar} alt="" className="w-full h-full object-cover" /> : (c.author_name || "F")[0].toUpperCase()}</div>
                        <div className="min-w-0"><span className="font-semibold text-[#ff6b00]">{c.author_name}:</span> <span className="text-[#3F4A54] dark:text-[#AEB8BF]">{lang === "de" ? (c.text_de || c.text) : lang === "es" ? (c.text_es || c.text_en || c.text) : lang === "en" ? (c.text_en || c.text) : c.text}</span></div>
                      </div>
                    ))}
                    {commentFor === p.id && (
                      <div className="flex gap-2 mt-1">
                        <input data-testid={`community-comment-input-${p.id}`} value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendComment(p.id)}
                          placeholder={tri("Scrivi un commento…", "Kommentar schreiben…", "Write a comment…", "Escribe un comentario…")} className={inp + " py-2"} />
                        <button data-testid={`community-comment-send-${p.id}`} onClick={() => sendComment(p.id)} className="px-3 rounded-xl bg-[#ff6b00] text-white"><Send className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
