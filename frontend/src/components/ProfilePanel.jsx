import { useEffect, useState } from "react";
import { X, Loader2, ImagePlus, Pencil, Store, MessageSquare, UserPlus, Send, Stethoscope, Trash2 } from "lucide-react";
import { profileApi, uploadApi, friendsApi, academyApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";

const PRESET_AVATARS = [
  { id: "baker", url: "https://static.prod-images.emergentagent.com/jobs/a3a8adf3-0daf-4c97-b252-e649a2b2f60f/images/f4f92c7fc737861a39742c7684cca7caf5b4ed4335220b146233944408fd3db3.jpeg", it: "Panettiere", de: "Bäcker", en: "Baker", es: "Panadero" },
  { id: "chef", url: "https://static.prod-images.emergentagent.com/jobs/a3a8adf3-0daf-4c97-b252-e649a2b2f60f/images/6af4112c72273e180c5b227f6c47a3e3eb47b476d80f334d607006927cb63d41.jpeg", it: "Cuoco", de: "Koch", en: "Chef", es: "Cocinero" },
  { id: "pizzaiolo", url: "https://static.prod-images.emergentagent.com/jobs/a3a8adf3-0daf-4c97-b252-e649a2b2f60f/images/2db58948b5e00cae83b4d6351be55ca3401fa2f526fbaef2e3cb9e533287e85c.jpeg", it: "Pizzaiolo", de: "Pizzabäcker", en: "Pizzaiolo", es: "Pizzero" },
  { id: "pastry", url: "https://static.prod-images.emergentagent.com/jobs/a3a8adf3-0daf-4c97-b252-e649a2b2f60f/images/e2904c622aeec71d0f42fed9cf97a5c6132c95686e825615581baf064e63217e.jpeg", it: "Pasticciere", de: "Konditor", en: "Pastry chef", es: "Pastelero" },
  { id: "baker_f", url: "https://static.prod-images.emergentagent.com/jobs/a3a8adf3-0daf-4c97-b252-e649a2b2f60f/images/f101801e5dc13986a0d27fe13abea1076fb6c012170cf53fb97dd2bbb574d3ec.jpeg", it: "Panettiera", de: "Bäckerin", en: "Baker (woman)", es: "Panadera" },
  { id: "barista", url: "https://static.prod-images.emergentagent.com/jobs/a3a8adf3-0daf-4c97-b252-e649a2b2f60f/images/c02f0851287203b0df733386e12c2e65b7a1eccbdf30fb0d68b02d888e2b0f9b.jpeg", it: "Barista", de: "Barista", en: "Barista", es: "Barista" },
  { id: "gelatiere", url: "https://static.prod-images.emergentagent.com/jobs/a3a8adf3-0daf-4c97-b252-e649a2b2f60f/images/4f3cbf12ce4d394db90c2def13473e910b95ee01d3377e70bffff3e8330fdbea.jpeg", it: "Gelatiere", de: "Eismacher", en: "Gelato maker", es: "Heladero" },
  { id: "chef_f", url: "https://static.prod-images.emergentagent.com/jobs/a3a8adf3-0daf-4c97-b252-e649a2b2f60f/images/c355cb59cb389bba6c0814430a7d97321b2ab10b987c8d30da776bd9f10168e8.jpeg", it: "Cuoca", de: "Köchin", en: "Chef (woman)", es: "Cocinera" },
  { id: "pizza_f", url: "https://static.prod-images.emergentagent.com/jobs/a3a8adf3-0daf-4c97-b252-e649a2b2f60f/images/4bbc8f970433025fc59a2e8ade75fee5c66c95cc41344edcefab0cf2137052ad.jpeg", it: "Pizzaiola", de: "Pizzabäckerin", en: "Pizzaiola", es: "Pizzera" },
  { id: "baker_bronze", url: "https://static.prod-images.emergentagent.com/jobs/a3a8adf3-0daf-4c97-b252-e649a2b2f60f/images/696e76c2abc03369b75c8d8b28e9a7fad53fc802726f45bb0c2ef49c8c37bc63.jpeg", it: "Panettiere (bronzo)", de: "Bäcker (bronze)", en: "Baker (bronze)", es: "Panadero (bronce)" },
];

// Pagina profilo social: avatar, bio e ricette/post pubblicati dal fornaio.
export default function ProfilePanel({ userId, onClose, onMessage }) {
  const { lang } = useLang();
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [name, setName] = useState("");
  const [pic, setPic] = useState("");
  const [saving, setSaving] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [viewId, setViewId] = useState(userId);
  const isMe = user && user.user_id === viewId;
  const [sosItems, setSosItems] = useState([]);

  useEffect(() => {
    if (isMe) academyApi.sosHistory().then(setSosItems).catch(() => setSosItems([]));
    else setSosItems([]);
  }, [isMe, viewId]);

  const deleteSos = async (id) => {
    setSosItems((p) => p.filter((x) => x.id !== id));
    try { await academyApi.sosDelete(id); } catch { /* */ }
  };

  const follow = async () => {
    try { await friendsApi.request(viewId); setFollowed(true); toast.success(tri("Richiesta inviata!", "Anfrage gesendet!", "Request sent!", "¡Solicitud enviada!")); }
    catch { toast.error(tri("Già inviata o errore", "Bereits gesendet oder Fehler", "Already sent or error", "Ya enviada o error")); }
  };

  useEffect(() => {
    profileApi.get(viewId).then((d) => { setData(d); setBio(d.bio || ""); setName(d.name || ""); setPic(d.picture || ""); setFollowed(false); }).catch(() => setData(false));
  }, [viewId]);

  const onPhoto = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    try { const url = await uploadApi.image(f, "avatar.jpg"); setPic(url); } catch { toast.error("Upload error"); }
  };
  const save = async () => {
    setSaving(true);
    try {
      const r = await profileApi.update({ name, bio, picture: pic });
      setData((p) => ({ ...p, ...r }));
      setEditing(false);
      window.dispatchEvent(new CustomEvent("mikilab-profile-updated"));
      toast.success(tri("Profilo aggiornato", "Profil aktualisiert", "Profile updated", "Perfil actualizado"));
    } catch { toast.error(tri("Errore", "Fehler", "Error", "Error")); } finally { setSaving(false); }
  };

  return (
    <div data-testid="profile-panel" className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-[#121212] w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="relative p-6 text-white" style={{ background: "linear-gradient(135deg,#0f2231,#123c4a 45%,#1f5a68 72%,#ffc700)" }}>
          <button data-testid="profile-close" onClick={onClose} className="absolute top-3 right-3 bg-white/20 rounded-full p-1.5"><X className="w-5 h-5" /></button>
          {!data ? (
            <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-white/20 border-2 border-white/60 overflow-hidden flex items-center justify-center">
                  {(editing ? pic : data.picture) ? <img src={editing ? pic : data.picture} alt={data.name} className="w-full h-full object-cover" /> : <span className="font-display text-3xl font-bold">{(data.name || "F")[0].toUpperCase()}</span>}
                </div>
                {editing && <label className="absolute -bottom-1 -right-1 bg-white text-[#123c4a] rounded-full p-1.5 cursor-pointer shadow"><ImagePlus className="w-4 h-4" /><input type="file" accept="image/*" className="hidden" onChange={onPhoto} /></label>}
              </div>
              <div className="min-w-0 flex-1">
                {editing ? (
                  <input data-testid="profile-name-input" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/20 rounded-lg px-2 py-1 text-lg font-bold outline-none" />
                ) : (
                  <h2 className="font-display text-2xl font-bold truncate">{data.name}</h2>
                )}
                <div className="flex gap-3 mt-1 text-[12px] text-white/90">
                  <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {data.posts_count} {tri("post", "Beiträge", "posts", "posts")}</span>
                  <span className="flex items-center gap-1"><Store className="w-3.5 h-3.5" /> {data.listings_count} {tri("annunci", "Anzeigen", "listings", "anuncios")}</span>
                  <span className="flex items-center gap-1"><UserPlus className="w-3.5 h-3.5" /> {tri("seguito da", "Follower:", "followed by", "seguido por")} {data.followers_count ?? 0}</span>
                </div>
                {(data.badges || []).includes("diplomato") && (
                  <span data-testid="profile-badge-diplomato" className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold bg-[#ffc700] text-white px-2.5 py-1 rounded-full">
                    🎓 {tri("Fornaio Diplomato", "Diplom-Bäcker", "Certified Baker", "Panadero Diplomado")}
                  </span>
                )}
                {(data.badges || []).includes("fornaio_settimana") && (
                  <span data-testid="profile-badge-champion" className="mt-1.5 ml-1.5 inline-flex items-center gap-1 text-[11px] font-bold bg-gradient-to-r from-[#ffc700] to-[#7a531d] text-white px-2.5 py-1 rounded-full">
                    🏆 {tri("Fornaio della Settimana", "Bäcker der Woche", "Baker of the Week", "Panadero de la Semana")}
                  </span>
                )}
                {((data.badges || []).includes("bakealong_champion") || (data.bakealong_wins || 0) > 0) && (
                  <span data-testid="profile-badge-bakealong" className="mt-1.5 ml-1.5 inline-flex items-center gap-1 text-[11px] font-bold bg-gradient-to-r from-[#ff6b00] to-[#ffc700] text-white px-2.5 py-1 rounded-full">
                    🥇 {tri("Campione Bake-Along", "Bake-Along-Champion", "Bake-Along Champion", "Campeón Bake-Along")}{(data.bakealong_wins || 0) > 1 ? ` ×${data.bakealong_wins}` : ""}
                  </span>
                )}
                {user && !isMe && (
                  <div className="flex items-center gap-2 mt-2">
                    <button data-testid="profile-follow" onClick={follow} disabled={followed}
                      className="inline-flex items-center gap-1.5 text-[12px] font-bold bg-white text-[#123c4a] px-3 py-1.5 rounded-full active:scale-95 disabled:opacity-70">
                      <UserPlus className="w-3.5 h-3.5" /> {followed ? tri("Richiesta inviata", "Gesendet", "Requested", "Enviada") : tri("Segui", "Folgen", "Follow", "Seguir")}
                    </button>
                    {onMessage && (
                      <button data-testid="profile-message" onClick={() => onMessage({ user_id: viewId, name: data.name, picture: data.picture })}
                        className="inline-flex items-center gap-1.5 text-[12px] font-bold bg-white/20 border border-white/50 text-white px-3 py-1.5 rounded-full active:scale-95">
                        <Send className="w-3.5 h-3.5" /> {tri("Messaggio", "Nachricht", "Message", "Mensaje")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {data && (
          <div className="p-5 space-y-4">
            {editing ? (
              <>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#7E8A93] mb-2">{tri("Scegli il tuo avatar", "Wähle deinen Avatar", "Choose your avatar", "Elige tu avatar")}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_AVATARS.map((a) => (
                      <button key={a.id} data-testid={`avatar-preset-${a.id}`} onClick={() => setPic(a.url)}
                        className={`rounded-xl overflow-hidden border-2 transition-all active:scale-95 ${pic === a.url ? "border-[#ffc700] ring-2 ring-[#ffc700]/40" : "border-[#2b2b2b] dark:border-[#2e2e2e]"}`}>
                        <img src={a.url} alt={a[lang] || a.it} className="w-full aspect-square object-cover" />
                        <span className="block text-[9px] font-semibold text-[#3F4A54] dark:text-[#AEB8BF] py-0.5">{a[lang] || a.it}</span>
                      </button>
                    ))}
                  </div>
                  <label data-testid="avatar-upload" className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-[#123c4a] dark:text-[#8FB0C2] cursor-pointer"><ImagePlus className="w-4 h-4" /> {tri("oppure carica una foto", "oder Foto hochladen", "or upload a photo", "o sube una foto")}<input type="file" accept="image/*" className="hidden" onChange={onPhoto} /></label>
                </div>
                <textarea data-testid="profile-bio-input" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={300}
                  placeholder={tri("Scrivi una breve bio: chi sei, il tuo forno, la tua specialità…", "Kurze Bio: wer du bist, deine Bäckerei, deine Spezialität…", "Short bio: who you are, your bakery, your specialty…", "Bio breve: quién eres, tu horno, tu especialidad…")}
                  className="w-full bg-[#121212] dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] rounded-xl p-3 text-sm outline-none" />
                <div className="flex gap-2">
                  <button data-testid="profile-save" onClick={save} disabled={saving} className="flex-1 bg-[#123c4a] text-white font-semibold py-2.5 rounded-xl active:scale-98 disabled:opacity-60">{saving ? "…" : tri("Salva", "Speichern", "Save", "Guardar")}</button>
                  <button onClick={() => setEditing(false)} className="px-4 py-2.5 rounded-xl border border-[#2b2b2b] dark:border-[#2e2e2e] text-[#7E8A93]">{tri("Annulla", "Abbrechen", "Cancel", "Cancelar")}</button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] leading-relaxed">{data.bio || tri("Nessuna bio ancora.", "Noch keine Bio.", "No bio yet.", "Sin bio todavía.")}</p>
                {isMe && <button data-testid="profile-edit" onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-sm font-semibold text-[#123c4a] dark:text-[#8FB0C2]"><Pencil className="w-4 h-4" /> {tri("Modifica profilo", "Profil bearbeiten", "Edit profile", "Editar perfil")}</button>}
              </>
            )}

            {data.contacts && data.contacts.length > 0 && (
              <div data-testid="profile-contacts">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#7E8A93] mb-2">{tri("I tuoi contatti", "Deine Kontakte", "Your contacts", "Tus contactos")} ({data.contacts.length})</p>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {data.contacts.map((c) => (
                    <button key={c.user_id} data-testid={`contact-${c.user_id}`} onClick={() => setViewId(c.user_id)} className="shrink-0 flex flex-col items-center gap-1 w-14 active:scale-95">
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-[#123c4a] flex items-center justify-center text-white font-bold">{c.picture ? <img src={c.picture} alt={c.name} className="w-full h-full object-cover" /> : (c.name || "F")[0].toUpperCase()}</div>
                      <span className="text-[10px] text-[#3F4A54] dark:text-[#AEB8BF] truncate w-full text-center">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isMe && sosItems.length > 0 && (
              <div data-testid="profile-sos-history">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#7E8A93] mb-2 flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5 text-[#ff6b00]" /> {tri("Diagnosi SOS salvate", "Gespeicherte SOS-Diagnosen", "Saved SOS diagnoses", "Diagnósticos SOS guardados")} ({sosItems.length})</p>
                <div className="space-y-2">
                  {sosItems.map((s) => (
                    <div key={s.id} data-testid={`sos-history-${s.id}`} className="rounded-xl bg-[#fbeeec] dark:bg-[#2a1f1e] border border-[#e6cfc9] dark:border-[#4a2e2b] p-3 flex gap-3">
                      <div className="relative w-14 h-14 rounded-lg bg-[#ff6b00]/15 flex items-center justify-center shrink-0 overflow-hidden">
                        <Stethoscope className="w-6 h-6 text-[#ff6b00]" />
                        {s.thumb && <img src={s.thumb} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-[#2B303B] dark:text-[#e4eff8] line-clamp-3 leading-snug">{s.result.replace(/[#*⚡🥖🔧]/g, "").trim()}</p>
                        <p className="text-[10px] text-[#7E8A93] mt-1">{new Date(s.created_at).toLocaleDateString()}</p>
                      </div>
                      <button data-testid={`sos-history-delete-${s.id}`} onClick={() => deleteSos(s.id)} className="text-[#7E8A93] hover:text-[#ff6b00] p-1 self-start"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#7E8A93] mb-2">{tri("Pubblicazioni", "Beiträge", "Published", "Publicaciones")}</p>
              {data.posts.length === 0 ? (
                <p className="text-sm text-[#7E8A93]">{tri("Ancora nessuna pubblicazione.", "Noch keine Beiträge.", "Nothing published yet.", "Nada publicado aún.")}</p>
              ) : (
                <div className="space-y-2">
                  {data.posts.map((p) => (
                    <div key={p.id} data-testid={`profile-post-${p.id}`} className="rounded-xl bg-[#121212] dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] p-3">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-[#123c4a] dark:text-[#8FB0C2]">{p.category}</span>
                      <p className="text-sm text-[#2B303B] dark:text-[#e4eff8] mt-0.5 line-clamp-3">{p.text}</p>
                      {p.photo && <img src={p.photo} alt="" className="w-full h-32 object-cover rounded-lg mt-2" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
