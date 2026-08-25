import { useState, useEffect } from "react";
import { Users, Heart, MessageCircle, Trash2, Send, ImagePlus, Lightbulb, Camera, BookOpen, HelpCircle, Loader2 } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { communityApi, uploadApi } from "@/lib/api";
import { toast } from "sonner";
import AvatarBubbles from "@/components/AvatarBubbles";
import Marketplace from "@/sections/Marketplace";

const CATS = [
  { id: "consiglio", Icon: Lightbulb, color: "#E0A458" },
  { id: "foto", Icon: Camera, color: "#6E8CA0" },
  { id: "ricetta", Icon: BookOpen, color: "#6B8E62" },
  { id: "domanda", Icon: HelpCircle, color: "#3F7CAC" },
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

export default function Community() {
  const { lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);
  const { user, setAuthOpen } = useAuth();

  const catLabel = (id) => ({
    consiglio: tri("Consiglio", "Tipp", "Tip"),
    foto: tri("Foto", "Foto", "Photo"),
    ricetta: tri("Ricetta", "Rezept", "Recipe"),
    domanda: tri("Domanda", "Frage", "Question"),
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

  const load = async () => { setLoading(true); setPosts(await communityApi.list()); setLoading(false); };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const needLogin = () => { if (!user) { setAuthOpen(true); return true; } return false; };

  const onPhoto = async (e) => {
    const f = e.target.files && e.target.files[0]; e.target.value = "";
    if (!f) return;
    if (needLogin()) return;
    setUploading(true);
    try { const url = await uploadApi.image(f, f.name || "foto.jpg"); setPhoto(url); }
    catch { toast.error(tri("Caricamento foto non riuscito", "Foto-Upload fehlgeschlagen", "Photo upload failed")); }
    finally { setUploading(false); }
  };

  const submit = async () => {
    if (needLogin()) return;
    if (!text.trim() && !photo) { toast.error(tri("Scrivi qualcosa o allega una foto", "Schreibe etwas oder füge ein Foto hinzu", "Write something or attach a photo")); return; }
    setPosting(true);
    try {
      const p = await communityApi.create({ category: cat, text: text.trim(), image_url: photo || null });
      setPosts((prev) => [p, ...prev]); setText(""); setPhoto(""); setCat("consiglio");
      toast.success(tri("Pubblicato!", "Veröffentlicht!", "Posted!"));
    } catch { toast.error(tri("Pubblicazione non riuscita", "Veröffentlichung fehlgeschlagen", "Post failed")); }
    finally { setPosting(false); }
  };

  const like = async (id) => { if (needLogin()) return; try { const p = await communityApi.like(id); setPosts((prev) => prev.map((x) => (x.id === id ? p : x))); } catch { toast.error(tri("Azione non riuscita", "Aktion fehlgeschlagen", "Action failed")); } };
  const remove = async (id) => { try { await communityApi.remove(id); setPosts((prev) => prev.filter((x) => x.id !== id)); } catch { toast.error(tri("Eliminazione non riuscita", "Löschen fehlgeschlagen", "Delete failed")); } };
  const sendComment = async (id) => {
    if (needLogin()) return;
    if (!commentText.trim()) return;
    try { const p = await communityApi.comment(id, commentText.trim()); setPosts((prev) => prev.map((x) => (x.id === id ? p : x))); setCommentText(""); }
    catch { toast.error(tri("Commento non inviato", "Kommentar nicht gesendet", "Comment not sent")); }
  };

  const visible = filter === "all" ? posts : posts.filter((p) => p.category === filter);
  const inp = "w-full bg-[#F6F8F5] dark:bg-[#1F252B] border border-[#D7E1DB] dark:border-[#38424B] rounded-xl px-3 py-2.5 outline-none text-[#2B303B] dark:text-[#EAF0EC] focus:border-[#5E8B7E]";

  return (
    <div className="pb-40" data-testid="community">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#4A7265] flex items-center justify-center"><Users className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#EAF0EC]">{tri("Community dei Panettieri", "Bäcker-Community", "Bakers Community")}</h1>
          <div className="h-1 w-10 rounded-full bg-[#C88A2B] my-1" />
          <p className="text-sm text-[#7E8A93]">{tri("Consigli, foto e ricette tra colleghi", "Tipps, Fotos und Rezepte unter Kollegen", "Tips, photos and recipes among peers")}</p>
        </div>
      </div>

      <AvatarBubbles variant="community" />

      {/* Composer */}
      {(() => {
        let done = false;
        try { const p = JSON.parse(localStorage.getItem("mikilab_impara_path") || "[]"); done = ["ricettario", "farine", "corsi"].every((x) => p.includes(x)); } catch { /* */ }
        if (!done) return null;
        return (
          <div data-testid="community-badge" className="flex items-center gap-2 mb-4 rounded-2xl bg-gradient-to-r from-[#6B8E62] to-[#4d6b45] text-white px-4 py-2.5 shadow">
            <span className="text-lg">🏅</span>
            <p className="text-sm font-semibold">{tri("Hai il badge «Fornaio Diplomato» — condividilo con i colleghi!", "Du hast das Abzeichen «Diplom-Bäcker» — teile es mit Kollegen!", "You have the «Certified Baker» badge — share it with peers!")}</p>
          </div>
        );
      })()}

      <div className="bg-[#6E8CA0]/10 border border-[#6E8CA0]/30 rounded-2xl p-4 mb-5">
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          {CATS.map(({ id, Icon, color }) => (
            <button key={id} data-testid={`community-cat-${id}`} onClick={() => setCat(id)}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-[11px] font-semibold transition-all ${cat === id ? "text-white border-transparent" : "bg-white dark:bg-[#232A31] text-[#3F4A54] dark:text-[#AEB8BF] border-[#D7E1DB] dark:border-[#38424B]"}`}
              style={cat === id ? { background: color } : {}}>
              <Icon className="w-4 h-4" /> {catLabel(id)}
            </button>
          ))}
        </div>
        <textarea data-testid="community-text" value={text} onChange={(e) => setText(e.target.value)} rows={3}
          placeholder={user ? tri("Condividi un consiglio, una foto o una ricetta…", "Teile einen Tipp, ein Foto oder ein Rezept…", "Share a tip, a photo or a recipe…") : tri("Accedi per pubblicare…", "Zum Posten anmelden…", "Log in to post…")}
          className={inp} />
        {photo && <div className="relative mt-2"><img src={photo} alt="" className="w-full h-40 object-cover rounded-xl" /><button data-testid="community-photo-clear" onClick={() => setPhoto("")} className="absolute top-2 right-2 bg-black/60 text-white rounded-full px-2 py-0.5 text-xs">✕</button></div>}
        <div className="flex items-center gap-2 mt-2">
          <label data-testid="community-photo-btn" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] text-sm font-semibold text-[#3F4A54] dark:text-[#AEB8BF] cursor-pointer">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4 text-[#6B8E62]" />} {tri("Foto", "Foto", "Photo")}
            <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
          </label>
          <button data-testid="community-submit" onClick={submit} disabled={posting}
            className="ml-auto flex items-center gap-1.5 bg-[#5E8B7E] hover:bg-[#4C7368] disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl active:scale-98 transition-all">
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {tri("Pubblica", "Posten", "Post")}
          </button>
        </div>
      </div>

      {/* Filtri */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-1 px-1" data-testid="community-filters">
        <button data-testid="community-filter-all" onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap border ${filter === "all" ? "bg-[#5E8B7E] text-white border-[#5E8B7E]" : "bg-white dark:bg-[#232A31] text-[#3F4A54] dark:text-[#AEB8BF] border-[#D7E1DB] dark:border-[#38424B]"}`}>{tri("Tutti", "Alle", "All")}</button>
        {CATS.map((c) => (
          <button key={c.id} data-testid={`community-filter-${c.id}`} onClick={() => setFilter(c.id)} className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap border ${filter === c.id ? "bg-[#5E8B7E] text-white border-[#5E8B7E]" : "bg-white dark:bg-[#232A31] text-[#3F4A54] dark:text-[#AEB8BF] border-[#D7E1DB] dark:border-[#38424B]"}`}>{catLabel(c.id)}</button>
        ))}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#5E8B7E]" /></div>
      ) : (
        <div className="space-y-3" data-testid="community-feed">
          {visible.length === 0 && <p className="text-center text-sm text-[#7E8A93] py-8">{tri("Ancora nessun post. Inizia tu la conversazione!", "Noch keine Beiträge. Starte du das Gespräch!", "No posts yet. Start the conversation!")}</p>}
          {visible.map((p) => {
            const C = CATS.find((c) => c.id === p.category) || CATS[0];
            return (
              <div key={p.id} data-testid={`community-post-${p.id}`} className="bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-display font-bold" style={{ background: C.color }}>{(p.author_name || "F")[0].toUpperCase()}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#2B303B] dark:text-[#EAF0EC] truncate">{p.author_name}</p>
                    <p className="text-[11px] text-[#7E8A93]">{timeAgo(p.created_at, lang)}</p>
                  </div>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1" style={{ background: C.color + "22", color: C.color }}><C.Icon className="w-3 h-3" />{catLabel(p.category)}</span>
                  {p.can_delete && <button data-testid={`community-delete-${p.id}`} onClick={() => remove(p.id)} className="text-[#7E8A93] hover:text-[#E4572E] p-1"><Trash2 className="w-4 h-4" /></button>}
                </div>
                {p.text && <p className="text-sm text-[#2B303B] dark:text-[#EAF0EC] whitespace-pre-line leading-relaxed">{(lang === "de" && p.text_de) ? p.text_de : (lang === "en" && p.text_en) ? p.text_en : p.text}</p>}
                {p.image_url && <img src={p.image_url} alt="" className="w-full rounded-xl mt-2 max-h-80 object-cover" />}

                <div className="flex items-center gap-4 mt-3 pt-2 border-t border-[#D7E1DB] dark:border-[#38424B]">
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
                      <div key={c.id} className="flex gap-2 text-sm">
                        <span className="font-semibold text-[#5E8B7E] shrink-0">{c.author_name}:</span>
                        <span className="text-[#3F4A54] dark:text-[#AEB8BF]">{c.text}</span>
                      </div>
                    ))}
                    {commentFor === p.id && (
                      <div className="flex gap-2 mt-1">
                        <input data-testid={`community-comment-input-${p.id}`} value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendComment(p.id)}
                          placeholder={tri("Scrivi un commento…", "Kommentar schreiben…", "Write a comment…")} className={inp + " py-2"} />
                        <button data-testid={`community-comment-send-${p.id}`} onClick={() => sendComment(p.id)} className="px-3 rounded-xl bg-[#5E8B7E] text-white"><Send className="w-4 h-4" /></button>
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
      <div data-testid="community-marketplace" className="mt-8 pt-6 border-t border-[#D7E1DB] dark:border-[#38424B]">
        <Marketplace />
      </div>
    </div>
  );
}
