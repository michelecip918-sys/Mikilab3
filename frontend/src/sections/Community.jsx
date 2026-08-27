import { useState, useEffect } from "react";
import { Users, Heart, MessageCircle, Trash2, Send, ImagePlus, Lightbulb, Camera, BookOpen, HelpCircle, Loader2, Store, UserPlus, MapPin, Sparkles, CalendarDays, Stethoscope } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { communityApi, uploadApi } from "@/lib/api";
import { toast } from "sonner";
import AvatarBubbles from "@/components/AvatarBubbles";
import Marketplace from "@/sections/Marketplace";
import { marketNewCount, markMarketSeen } from "@/lib/market";
import FriendsPanel from "@/components/FriendsPanel";
import ProfilePanel from "@/components/ProfilePanel";
import ChatPanel from "@/components/ChatPanel";
import SosImpasto from "@/components/SosImpasto";
import BakersMap from "@/components/BakersMap";
import { friendsApi, dmApi } from "@/lib/api";

const CATS = [
  { id: "consiglio", Icon: Lightbulb, color: "#E0A458" },
  { id: "idea", Icon: Sparkles, color: "#8a5a2b" },
  { id: "foto", Icon: Camera, color: "#6E8CA0" },
  { id: "ricetta", Icon: BookOpen, color: "#5aa0cf" },
  { id: "domanda", Icon: HelpCircle, color: "#3F7CAC" },
  { id: "evento", Icon: CalendarDays, color: "#2e8b6f" },
];

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
  const tri = (i, d, e, s) => (lang === "de" ? d : lang === "es" ? (s ?? e ?? i) : lang === "en" ? (e ?? i) : i);
  const { user, setAuthOpen } = useAuth();

  const catLabel = (id) => ({
    consiglio: tri("Consiglio", "Tipp", "Tip", "Consejo"),
    idea: tri("Idea", "Idee", "Idea", "Idea"),
    foto: tri("Foto", "Foto", "Photo", "Foto"),
    ricetta: tri("Ricetta", "Rezept", "Recipe", "Receta"),
    domanda: tri("Domanda", "Frage", "Question", "Pregunta"),
    evento: tri("Evento", "Event", "Event", "Evento"),
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
  const [sosOpen, setSosOpen] = useState(false);
  const [feed, setFeed] = useState("all");
  useEffect(() => { setMarketNew(marketNewCount()); }, []);
  useEffect(() => { friendsApi.list().then((r) => setFriendReqCount((r?.incoming || []).length)).catch(() => {}); }, []);
  const loadMsgUnread = () => { if (user) dmApi.conversations().then((c) => setMsgUnread((c || []).reduce((a, x) => a + (x.unread || 0), 0))).catch(() => {}); };
  useEffect(() => { loadMsgUnread(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = async (f = feed) => { setLoading(true); setPosts(await communityApi.list(f)); setLoading(false); };
  useEffect(() => { load(feed); }, [feed]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const inp = "w-full bg-[#f0f6fb] dark:bg-[#1F252B] border border-[#d5e4f0] dark:border-[#38424B] rounded-xl px-3 py-2.5 outline-none text-[#2B303B] dark:text-[#e4eff8] focus:border-[#3f7cac]";

  return (
    <div className="pb-40" data-testid="community">
      {/* Header social brandizzato — SOLO nella Community: si capisce che è un nuovo social nel sito */}
      <div data-testid="community-social-header" className="relative overflow-hidden rounded-3xl p-5 mb-5 text-white shadow-lg"
        style={{ background: "linear-gradient(135deg,#0f2231 0%,#123c4a 40%,#1f5a68 70%,#a9772f 100%)" }}>
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-white/25 border-2 border-white/70 overflow-hidden shadow-md">
              <img src={`${process.env.PUBLIC_URL}/michele-avatar.jpg`} alt="MikiLab" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-white shadow flex items-center justify-center overflow-hidden border border-white">
              <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="ML" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-2xl font-extrabold leading-none drop-shadow-sm">MikiLab Social</h1>
              <span className="text-[10px] font-extrabold uppercase tracking-wide bg-white text-[#123c4a] px-2 py-0.5 rounded-full shadow">{tri("Nuovo", "Neu", "New", "Nuevo")}</span>
            </div>
            <p className="text-sm text-white/95 mt-1 leading-snug font-semibold">
              {tri("Il nuovo social dei fornai, dentro il mio sito", "Das neue Bäcker-Social, direkt auf meiner Seite", "The new bakers' social, right inside my site", "La nueva red de panaderos, dentro de mi sitio")}
            </p>
            <p className="text-[11px] text-white/85 mt-0.5">{tri("Consigli, foto, ricette, amici e mercatino tra colleghi", "Tipps, Fotos, Rezepte, Freunde und Markt", "Tips, photos, recipes, friends and marketplace", "Consejos, fotos, recetas, amigos y mercadillo")}</p>
            {user && (
              <button data-testid="open-my-profile" onClick={() => setProfileUser(user.user_id)}
                className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-bold bg-white/20 hover:bg-white/30 border border-white/40 px-3 py-1.5 rounded-full active:scale-95 transition-all">
                <UserPlus className="w-3.5 h-3.5" /> {tri("Il mio profilo", "Mein Profil", "My profile", "Mi perfil")}
              </button>
            )}
          </div>
        </div>
      </div>

      <button data-testid="community-marketplace-top-btn"
        onClick={() => { markMarketSeen(); setMarketNew(0); const el = document.querySelector("[data-testid='community-marketplace']"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }}
        className="w-full flex items-center gap-3 mb-4 rounded-2xl p-4 bg-gradient-to-br from-[#C88A2B] to-[#A66A15] text-white shadow-md active:scale-98 transition-all">
        <div className="relative w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
          <Store className="w-6 h-6" />
          {marketNew > 0 && <span data-testid="market-new-badge" className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-[#C0574D] text-white text-[11px] font-extrabold flex items-center justify-center ring-2 ring-white">{marketNew}</span>}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="font-display text-base font-bold leading-tight">{tri("Mercatino dell'Usato", "Gebraucht-Markt", "Used Marketplace", "Mercadillo de Segunda Mano")}</p>
          <p className="text-[11px] text-white/85 leading-snug">{marketNew > 0 ? tri(`${marketNew} nuovi annunci da vedere!`, `${marketNew} neue Anzeigen!`, `${marketNew} new listings to see!`) : tri("Compra e vendi macchinari e attrezzature tra artigiani", "Kaufe & verkaufe Maschinen und Ausrüstung unter Handwerkern", "Buy & sell machinery and equipment among artisans", "Compra y vende maquinaria y equipos entre artesanos")}</p>
        </div>
        <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full shrink-0">{tri("Vai", "Los", "Go", "Ir")}</span>
      </button>

      <button data-testid="community-friends-btn" onClick={() => setFriendsOpen(true)}
        className="w-full flex items-center gap-3 mb-4 rounded-2xl p-4 bg-gradient-to-br from-[#3f7cac] to-[#234b6e] text-white shadow-md active:scale-98 transition-all">
        <div className="relative w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
          <UserPlus className="w-6 h-6" />
          {friendReqCount > 0 && <span data-testid="friends-req-badge" className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-[#C0574D] text-white text-[11px] font-extrabold flex items-center justify-center ring-2 ring-white">{friendReqCount}</span>}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="font-display text-base font-bold leading-tight">{tri("Amici & Colleghi", "Freunde & Kollegen", "Friends & Colleagues", "Amigos y Colegas")}</p>
          <p className="text-[11px] text-white/85 leading-snug">{friendReqCount > 0 ? tri(`${friendReqCount} richieste di amicizia in attesa`, `${friendReqCount} Freundschaftsanfragen`, `${friendReqCount} friend requests pending`) : tri("Aggiungi colleghi e segui chi ti ispira", "Kollegen hinzufügen und folgen", "Add colleagues and follow who inspires you", "Añade colegas y sigue a quien te inspira")}</p>
        </div>
        <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full shrink-0">{tri("Apri", "Öffnen", "Open", "Abrir")}</span>
      </button>

      <button data-testid="community-messages-btn" onClick={() => { if (needLogin()) return; setChatUser(null); setChatOpen(true); }}
        className="w-full flex items-center gap-3 mb-4 rounded-2xl p-4 bg-gradient-to-br from-[#7a4fbf] to-[#4a2e78] text-white shadow-md active:scale-98 transition-all">
        <div className="relative w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
          <MessageCircle className="w-6 h-6" />
          {msgUnread > 0 && <span data-testid="messages-unread-badge" className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-[#C0574D] text-white text-[11px] font-extrabold flex items-center justify-center ring-2 ring-white">{msgUnread > 9 ? "9+" : msgUnread}</span>}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="font-display text-base font-bold leading-tight">{tri("Messaggi", "Nachrichten", "Messages", "Mensajes")}</p>
          <p className="text-[11px] text-white/85 leading-snug">{tri("Scrivi in privato ai tuoi amici fornai", "Schreibe deinen Bäcker-Freunden privat", "Message your baker friends privately", "Escribe en privado a tus amigos panaderos")}</p>
        </div>
        <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full shrink-0">{tri("Apri", "Öffnen", "Open", "Abrir")}</span>
      </button>

      <button data-testid="community-sos-btn" onClick={() => { if (needLogin()) return; setSosOpen(true); }}
        className="w-full flex items-center gap-3 mb-4 rounded-2xl p-4 bg-gradient-to-br from-[#b23a2f] to-[#7a1f1f] text-white shadow-md active:scale-98 transition-all">
        <div className="relative w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
          <Stethoscope className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="font-display text-base font-bold leading-tight">{tri("SOS Impasto", "SOS Teig", "Dough SOS", "SOS Masa")}</p>
          <p className="text-[11px] text-white/85 leading-snug">{tri("Manda la foto del tuo pane a Mohammadreza per una diagnosi immediata", "Sende Mohammadreza ein Foto deines Brotes für eine Sofortdiagnose", "Send Mohammadreza a photo of your bread for an instant diagnosis", "Envía a Mohammadreza una foto de tu pan para un diagnóstico inmediato")}</p>
        </div>
        <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full shrink-0">{tri("Apri", "Öffnen", "Open", "Abrir")}</span>
      </button>

      <button data-testid="community-map-btn" onClick={() => setMapOpen(true)}
        className="w-full flex items-center gap-3 mb-4 rounded-2xl p-4 bg-gradient-to-br from-[#2e8b6f] to-[#1c5c49] text-white shadow-md active:scale-98 transition-all">
        <div className="relative w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
          <MapPin className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="font-display text-base font-bold leading-tight">{tri("Mappa dei Fornai", "Bäcker-Karte", "Bakers Map", "Mapa de Panaderos")}</p>
          <p className="text-[11px] text-white/85 leading-snug">{tri("Scopri i fornai MikiLab nel mondo e fatti conoscere", "Entdecke MikiLab-Bäcker weltweit und zeige dich", "Discover MikiLab bakers worldwide and get known", "Descubre panaderos MikiLab en el mundo y date a conocer")}</p>
        </div>
        <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full shrink-0">{tri("Apri", "Öffnen", "Open", "Abrir")}</span>
      </button>

      <FriendsPanel open={friendsOpen} onClose={() => setFriendsOpen(false)} onCount={setFriendReqCount}
        onMessage={(u) => { setFriendsOpen(false); setChatUser(u); setChatOpen(true); }} />
      {profileUser && <ProfilePanel userId={profileUser} onClose={() => setProfileUser(null)} onMessage={(u) => { setProfileUser(null); setChatUser(u); setChatOpen(true); }} />}
      <ChatPanel open={chatOpen} onClose={() => { setChatOpen(false); setChatUser(null); loadMsgUnread(); window.dispatchEvent(new Event("mikilab-notif-refresh")); }} initialUser={chatUser} />
      <SosImpasto open={sosOpen} onClose={() => setSosOpen(false)} onNavigate={onNavigate} />
      <BakersMap open={mapOpen} onClose={() => setMapOpen(false)} />

      <AvatarBubbles variant="community" />

      {/* Composer */}
      {(() => {
        let done = false;
        try { const p = JSON.parse(localStorage.getItem("mikilab_impara_path") || "[]"); done = ["ricettario", "farine", "corsi"].every((x) => p.includes(x)); } catch { /* */ }
        if (!done) return null;
        return (
          <div data-testid="community-badge" className="flex items-center gap-2 mb-4 rounded-2xl bg-gradient-to-r from-[#5aa0cf] to-[#2e6690] text-white px-4 py-2.5 shadow">
            <span className="text-lg">🏅</span>
            <p className="text-sm font-semibold">{tri("Hai il badge «Fornaio Diplomato» — condividilo con i colleghi!", "Du hast das Abzeichen «Diplom-Bäcker» — teile es mit Kollegen!", "You have the «Certified Baker» badge — share it with peers!", "Tienes la insignia «Panadero Diplomado» — ¡compártela con tus colegas!")}</p>
          </div>
        );
      })()}

      {/* Intro viva e giovanile del Social */}
      <div data-testid="social-intro" className="rounded-2xl p-4 mb-4 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(120deg,#0f2231,#123c4a 40%,#1f5a68 72%,#a9772f)" }}>
        <p className="font-display text-lg font-extrabold leading-tight">{tri("Benvenuto nel Social dei Panettieri! 🥐🔥", "Willkommen im Bäcker-Social! 🥐🔥", "Welcome to the Bakers' Social! 🥐🔥", "¡Bienvenido al Social de Panaderos! 🥐🔥")}</p>
        <p className="text-[12.5px] text-white/90 mt-1 leading-snug">{tri("Mostra le tue sfornate, lancia idee, chiedi aiuto e trova colleghi vicino a te. Qui si cresce insieme.", "Zeig deine Backwerke, teile Ideen, frag um Rat und finde Kollegen in der Nähe.", "Show your bakes, drop ideas, ask for help and find fellow bakers near you.", "Muestra tus horneadas, lanza ideas, pide ayuda y encuentra colegas cerca.")}</p>
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {[["foto", tri("📸 Mostra la sfornata", "📸 Backwerk zeigen", "📸 Show your bake", "📸 Muestra tu horneada")],
            ["idea", tri("✨ Lancia un'idea", "✨ Idee teilen", "✨ Drop an idea", "✨ Lanza una idea")],
            ["domanda", tri("🙋 Chiedi aiuto", "🙋 Um Rat fragen", "🙋 Ask for help", "🙋 Pide ayuda")]].map(([id, lbl]) => (
            <button key={id} data-testid={`social-quick-${id}`}
              onClick={() => { if (!user) { setAuthOpen(true); return; } setCat(id); document.querySelector('[data-testid="community-text"]')?.focus(); document.querySelector('[data-testid="community-text"]')?.scrollIntoView({ behavior: "smooth", block: "center" }); }}
              className="shrink-0 text-[12px] font-bold bg-white/20 hover:bg-white/30 border border-white/40 px-3 py-1.5 rounded-full active:scale-95 transition-all whitespace-nowrap">{lbl}</button>
          ))}
        </div>
      </div>

      <div className="bg-[#6E8CA0]/10 border border-[#6E8CA0]/30 rounded-2xl p-4 mb-5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#7E8A93] mb-2">{tri("Cosa vuoi condividere?", "Was möchtest du teilen?", "What do you want to share?", "¿Qué quieres compartir?")}</p>
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {CATS.map(({ id, Icon, color }) => (
            <button key={id} data-testid={`community-cat-${id}`} onClick={() => setCat(id)}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-[11px] font-semibold transition-all ${cat === id ? "text-white border-transparent" : "bg-white dark:bg-[#232A31] text-[#3F4A54] dark:text-[#AEB8BF] border-[#d5e4f0] dark:border-[#38424B]"}`}
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
          <label data-testid="community-photo-btn" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] text-sm font-semibold text-[#3F4A54] dark:text-[#AEB8BF] cursor-pointer">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4 text-[#5aa0cf]" />} {tri("Foto", "Foto", "Photo", "Foto")}
            <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
          </label>
          <button data-testid="community-submit" data-sfx="save" onClick={submit} disabled={posting}
            className="ml-auto flex items-center gap-1.5 bg-[#3f7cac] hover:bg-[#336a94] disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl active:scale-98 transition-all">
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {tri("Pubblica", "Posten", "Post", "Publicar")}
          </button>
        </div>
      </div>

      {/* Filtri */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-1 px-1" data-testid="community-filters">
        <button data-testid="community-filter-all" onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap border ${filter === "all" ? "bg-[#3f7cac] text-white border-[#3f7cac]" : "bg-white dark:bg-[#232A31] text-[#3F4A54] dark:text-[#AEB8BF] border-[#d5e4f0] dark:border-[#38424B]"}`}>{tri("Tutti", "Alle", "All", "Todos")}</button>
        {CATS.map((c) => (
          <button key={c.id} data-testid={`community-filter-${c.id}`} onClick={() => setFilter(c.id)} className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap border ${filter === c.id ? "bg-[#3f7cac] text-white border-[#3f7cac]" : "bg-white dark:bg-[#232A31] text-[#3F4A54] dark:text-[#AEB8BF] border-[#d5e4f0] dark:border-[#38424B]"}`}>{catLabel(c.id)}</button>
        ))}
      </div>

      {/* Feed */}
      <div data-testid="feed-toggle" className="flex gap-2 mb-3">
        {[["all", tri("Tutti", "Alle", "All", "Todos")], ["friends", tri("Dai tuoi contatti", "Von Kontakten", "From your contacts", "De tus contactos")]].map(([id, lbl]) => (
          <button key={id} data-testid={`feed-tab-${id}`} onClick={() => { if (id === "friends" && needLogin()) return; setFeed(id); }}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${feed === id ? "bg-[#123c4a] text-white shadow-sm" : "bg-[#e4eff8] dark:bg-[#2A323A] text-[#7E8A93]"}`}>{lbl}</button>
        ))}
      </div>
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#3f7cac]" /></div>
      ) : (
        <div className="space-y-3" data-testid="community-feed">
          {visible.length === 0 && <p className="text-center text-sm text-[#7E8A93] py-8">{tri("Ancora nessun post. Inizia tu la conversazione!", "Noch keine Beiträge. Starte du das Gespräch!", "No posts yet. Start the conversation!", "Aún no hay publicaciones. ¡Empieza tú la conversación!")}</p>}
          {visible.map((p) => {
            const C = CATS.find((c) => c.id === p.category) || CATS[0];
            return (
              <div key={p.id} data-testid={`community-post-${p.id}`} className="bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] rounded-2xl p-4 shadow-sm">
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

                <div className="flex items-center gap-4 mt-3 pt-2 border-t border-[#d5e4f0] dark:border-[#38424B]">
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
                        <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-[#3f7cac] flex items-center justify-center text-white text-[10px] font-bold">{c.author_avatar ? <img src={c.author_avatar} alt="" className="w-full h-full object-cover" /> : (c.author_name || "F")[0].toUpperCase()}</div>
                        <div className="min-w-0"><span className="font-semibold text-[#3f7cac]">{c.author_name}:</span> <span className="text-[#3F4A54] dark:text-[#AEB8BF]">{lang === "de" ? (c.text_de || c.text) : lang === "es" ? (c.text_es || c.text_en || c.text) : lang === "en" ? (c.text_en || c.text) : c.text}</span></div>
                      </div>
                    ))}
                    {commentFor === p.id && (
                      <div className="flex gap-2 mt-1">
                        <input data-testid={`community-comment-input-${p.id}`} value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendComment(p.id)}
                          placeholder={tri("Scrivi un commento…", "Kommentar schreiben…", "Write a comment…", "Escribe un comentario…")} className={inp + " py-2"} />
                        <button data-testid={`community-comment-send-${p.id}`} onClick={() => sendComment(p.id)} className="px-3 rounded-xl bg-[#3f7cac] text-white"><Send className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Marketplace Usato — compravendita macchinari/attrezzature tra artigiani */}
      <div data-testid="community-marketplace" className="mt-8 pt-6 border-t border-[#d5e4f0] dark:border-[#38424B]">
        <Marketplace />
      </div>
    </div>
  );
}
