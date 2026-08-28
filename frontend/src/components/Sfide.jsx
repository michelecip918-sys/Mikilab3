import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Check, Loader2, MessageSquare, UserPlus, Camera, MessageCircle, Send, Facebook, Users, Star, Lock, Sparkles, GraduationCap } from "lucide-react";
import { challengesApi } from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { useBackClose } from "@/lib/backNav";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";

// Metadati locali (icona + testo multilingua). Il tipo (internal/honor) arriva dal catalogo backend.
const META = {
  post_recipe_question: { Icon: MessageSquare,
    it: ["Chiedi pareri su una ricetta", "Crea un post nella Community chiedendo un parere su una tua ricetta."],
    de: ["Frage nach Meinungen zu einem Rezept", "Erstelle einen Beitrag in der Community und frage nach Feedback."],
    en: ["Ask for feedback on a recipe", "Create a Community post asking for opinions on your recipe."],
    es: ["Pide opiniones sobre una receta", "Crea una publicación en la Comunidad pidiendo opiniones."] },
  add_2_colleagues: { Icon: UserPlus,
    it: ["Aggiungi 2 colleghi", "Aggiungi almeno 2 fornai alla tua rete di amici."],
    de: ["Füge 2 Kollegen hinzu", "Füge mindestens 2 Bäcker zu deinem Netzwerk hinzu."],
    en: ["Add 2 colleagues", "Add at least 2 bakers to your friends network."],
    es: ["Añade 2 colegas", "Añade al menos 2 panaderos a tu red de amigos."] },
  upload_dough_photo: { Icon: Camera,
    it: ["Carica una foto dell'impasto", "Pubblica nella Community una foto del tuo impasto o della tua sfornata."],
    de: ["Lade ein Teigfoto hoch", "Poste in der Community ein Foto deines Teigs oder Gebäcks."],
    en: ["Upload a dough photo", "Post a photo of your dough or bake in the Community."],
    es: ["Sube una foto de la masa", "Publica en la Comunidad una foto de tu masa u horneada."] },
  reply_user: { Icon: MessageCircle,
    it: ["Commenta un altro fornaio", "Rispondi o commenta il post di un altro utente."],
    de: ["Kommentiere einen Bäcker", "Antworte oder kommentiere den Beitrag eines anderen Nutzers."],
    en: ["Reply to another baker", "Reply to or comment on another user's post."],
    es: ["Comenta a otro panadero", "Responde o comenta la publicación de otro usuario."] },
  whatsapp_share: { Icon: Send,
    it: ["Condividi su WhatsApp", "Invia una ricetta o MikiLab a un collega su WhatsApp."],
    de: ["Auf WhatsApp teilen", "Sende ein Rezept oder MikiLab an einen Kollegen auf WhatsApp."],
    en: ["Share on WhatsApp", "Send a recipe or MikiLab to a colleague on WhatsApp."],
    es: ["Comparte en WhatsApp", "Envía una receta o MikiLab a un colega por WhatsApp."] },
  fb_comment: { Icon: Facebook,
    it: ["Commenta su Facebook", "Lascia un commento sul profilo Facebook di Michele."],
    de: ["Auf Facebook kommentieren", "Hinterlasse einen Kommentar auf Micheles Facebook-Profil."],
    en: ["Comment on Facebook", "Leave a comment on Michele's Facebook profile."],
    es: ["Comenta en Facebook", "Deja un comentario en el perfil de Facebook de Michele."] },
  share_group: { Icon: Users,
    it: ["Condividi in un gruppo", "Condividi MikiLab in un gruppo di settore (fornai/pasticceri)."],
    de: ["In einer Gruppe teilen", "Teile MikiLab in einer Fachgruppe (Bäcker/Konditoren)."],
    en: ["Share in a group", "Share MikiLab in an industry group (bakers/pastry chefs)."],
    es: ["Comparte en un grupo", "Comparte MikiLab en un grupo del sector."] },
  leave_review: { Icon: Star,
    it: ["Lascia una recensione", "Lascia una recensione o invita un nuovo fornaio a iscriversi."],
    de: ["Bewertung abgeben", "Hinterlasse eine Bewertung oder lade einen neuen Bäcker ein."],
    en: ["Leave a review", "Leave a review or invite a new baker to join."],
    es: ["Deja una reseña", "Deja una reseña o invita a un nuevo panadero."] },
};

const LEARN_LABELS = {
  base: { it: "Le Basi", en: "The Basics", de: "Die Grundlagen", es: "Lo básico", icon: "🌾" },
  lievito: { it: "Il Lievito Madre", en: "Sourdough", de: "Sauerteig", es: "Masa madre", icon: "🫧" },
  panettone: { it: "Il Panettone", en: "Panettone", de: "Panettone", es: "Panettone", icon: "🎄" },
  focacce: { it: "Focacce", en: "Focaccia", de: "Focaccia", es: "Focaccia", icon: "🫓" },
  pizza: { it: "Pizza", en: "Pizza", de: "Pizza", es: "Pizza", icon: "🍕" },
  pasta: { it: "Pasta Fresca", en: "Fresh Pasta", de: "Frische Pasta", es: "Pasta fresca", icon: "🍝" },
};

const WA_TEXT = "MikiLab — Ricette esclusive e strumenti per l'Arte Bianca 🥖 https://mikilab.de";

export default function Sfide({ open, onClose }) {
  const { user, setAuthOpen } = useAuth();
  const { lang } = useLang();
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const flang = ["it", "de", "en", "es"].includes(lang) ? lang : "it";

  const [catalog, setCatalog] = useState([]);
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [cat, st] = await Promise.all([challengesApi.catalog(), user ? challengesApi.state() : Promise.resolve(null)]);
    setCatalog(cat); setState(st); setLoading(false);
  }, [user]);

  useEffect(() => { if (open) load(); }, [open, load]);

  useBackClose(open, onClose);

  const doComplete = async (cid, isHonor) => {
    if (!user) { setAuthOpen(true); return; }
    setBusy(cid);
    try {
      const r = await challengesApi.complete(cid);
      setState((s) => ({ ...(s || {}), ...r }));
      window.dispatchEvent(new CustomEvent("mikilab-entitlements-updated"));
      toast.success(tri("Sfida completata! 🎉", "Challenge abgeschlossen! 🎉", "Challenge completed! 🎉", "¡Reto completado! 🎉"));
      if (r.unlocked_all) toast.success(tri("Hai sbloccato TUTTO! 🔓", "Alles freigeschaltet! 🔓", "You unlocked EVERYTHING! 🔓", "¡Has desbloqueado TODO! 🔓"), { duration: 6000 });
      else if (r.unlocked_panettoni) toast.success(tri("Panettoni & Academy sbloccati! 🥖", "Panettoni & Academy freigeschaltet! 🥖", "Panettoni & Academy unlocked! 🥖", "¡Panettones y Academy desbloqueados! 🥖"), { duration: 6000 });
    } catch (e) {
      toast.error(tri("Sfida non ancora completata: completala nella community e riprova.", "Challenge noch nicht erledigt: erledige sie in der Community und versuche erneut.", "Challenge not completed yet: complete it in the Community and try again.", "Reto aún no completado: complétalo en la Comunidad e inténtalo de nuevo."));
    } finally { setBusy(""); }
  };

  if (!open) return null;

  const downloadCertificate = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const W = 297, H = 210;
    doc.setFillColor(253, 251, 247); doc.rect(0, 0, W, H, "F");
    doc.setDrawColor(140, 74, 39); doc.setLineWidth(3); doc.rect(10, 10, W - 20, H - 20);
    doc.setDrawColor(217, 119, 6); doc.setLineWidth(0.8); doc.rect(14, 14, W - 28, H - 28);
    doc.setTextColor(140, 74, 39); doc.setFont("times", "bold"); doc.setFontSize(40);
    doc.text("MikiLab", W / 2, 45, { align: "center" });
    doc.setFontSize(20); doc.setTextColor(107, 85, 70);
    doc.text(tri("Certificato di Panificazione", "Back-Zertifikat", "Baking Certificate", "Certificado de Panificación"), W / 2, 62, { align: "center" });
    doc.setFont("times", "italic"); doc.setFontSize(14); doc.setTextColor(60, 40, 30);
    doc.text(tri("Si attesta che", "Hiermit wird bestätigt, dass", "This certifies that", "Se certifica que"), W / 2, 88, { align: "center" });
    doc.setFont("times", "bold"); doc.setFontSize(28); doc.setTextColor(140, 74, 39);
    doc.text(user?.name || user?.email || "Baker", W / 2, 104, { align: "center" });
    doc.setFont("times", "normal"); doc.setFontSize(14); doc.setTextColor(60, 40, 30);
    const done = state?.count || 0; const all = state?.unlocked_all;
    const line = all
      ? tri(`ha completato TUTTE le ${done} sfide e sbloccato i 17 Panettoni MikiLab`, `hat ALLE ${done} Challenges abgeschlossen`, `has completed ALL ${done} challenges and unlocked the 17 MikiLab Panettoni`, `ha completado TODOS los ${done} retos`)
      : tri(`ha completato ${done} sfide della community MikiLab`, `hat ${done} Community-Challenges abgeschlossen`, `has completed ${done} MikiLab community challenges`, `ha completado ${done} retos`);
    doc.text(line, W / 2, 120, { align: "center", maxWidth: W - 60 });
    doc.text("🥖 " + tri("Panificatore MikiLab", "MikiLab-Bäcker", "MikiLab Baker", "Panadero MikiLab"), W / 2, 140, { align: "center" });
    doc.setFontSize(11); doc.setTextColor(140, 115, 98);
    doc.text(new Date().toLocaleDateString(lang === "en" ? "en-GB" : lang), W / 2, 165, { align: "center" });
    doc.text("mikilab.de", W / 2, 172, { align: "center" });
    doc.save("MikiLab-Certificato.pdf");
    toast.success(tri("Certificato scaricato! 📜", "Zertifikat heruntergeladen! 📜", "Certificate downloaded! 📜", "¡Certificado descargado! 📜"));
  };

  const completed = new Set(state?.completed || []);
  const count = state?.count || 0;
  const total = state?.total || catalog.length || 8;
  const needPan = state?.need_panettoni || 3;
  const needAll = state?.need_all || 6;
  const pct = total ? Math.round((count / total) * 100) : 0;

  return (
    <AnimatePresence>
      <motion.div data-testid="sfide-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[75] bg-[#FDFBF7] dark:bg-[#1B2127] overflow-auto">
        <div className="max-w-xl mx-auto px-4 py-5 pb-24">
          <button data-testid="sfide-close" onClick={onClose}
            className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-[#8C4A27]">
            <X className="w-4 h-4" /> {tri("Chiudi", "Schließen", "Close", "Cerrar")}
          </button>

          {/* Hero */}
          <div className="relative overflow-hidden rounded-3xl p-6 text-[#FFFDF9] shadow-xl"
            style={{ background: "linear-gradient(135deg,#8C4A27 0%,#6E371C 60%,#4A3222 100%)" }}>
            <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center mb-3">
              <Trophy className="w-7 h-7" />
            </div>
            <h1 data-testid="sfide-title" className="font-display text-2xl sm:text-3xl font-bold leading-tight">{tri("Motore Sfide MikiLab", "MikiLab Challenges", "MikiLab Challenge Engine", "Motor de Retos MikiLab")}</h1>
            <p className="text-[#FFFDF9]/85 text-sm mt-2 leading-snug">
              {tri("Nessun pagamento: sblocca ricette esclusive e schede tecniche completando le sfide della community.",
                   "Keine Zahlung: Schalte exklusive Rezepte und Datenblätter durch Community-Challenges frei.",
                   "No payment: unlock exclusive recipes and tech sheets by completing community challenges.",
                   "Sin pago: desbloquea recetas exclusivas y fichas completando los retos de la comunidad.")}
            </p>
          </div>

          {/* Progresso */}
          <div data-testid="sfide-progress" className="mt-5 rounded-2xl bg-[#FAF5EC] dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-display text-lg font-bold text-[#2C1E16] dark:text-[#e4eff8]">{tri("I tuoi progressi", "Dein Fortschritt", "Your progress", "Tu progreso")}</p>
              <span className="text-sm font-bold text-[#8C4A27]">{count}/{total}</span>
            </div>
            <div className="h-3 rounded-full bg-[#E6D8C3] dark:bg-[#38424B] overflow-hidden">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-[#D97706] to-[#8C4A27]"
                initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div data-testid="sfide-milestone-panettoni" className={`rounded-xl p-2.5 border text-center ${count >= needPan ? "bg-[#FEF3C7] border-[#D97706]" : "bg-white/60 dark:bg-[#1F252B] border-[#E6D8C3] dark:border-[#38424B]"}`}>
                <p className="text-[11px] font-semibold text-[#6B5546] dark:text-[#AEB8BF]">{count >= needPan ? "✅ " : `🔒 ${needPan} `}{tri("sfide", "Challenges", "challenges", "retos")}</p>
                <p className="text-[13px] font-bold text-[#2C1E16] dark:text-[#e4eff8] leading-tight">{tri("Panettoni + Academy", "Panettoni + Academy", "Panettoni + Academy", "Panettones + Academy")}</p>
              </div>
              <div data-testid="sfide-milestone-all" className={`rounded-xl p-2.5 border text-center ${count >= needAll ? "bg-[#FEF3C7] border-[#D97706]" : "bg-white/60 dark:bg-[#1F252B] border-[#E6D8C3] dark:border-[#38424B]"}`}>
                <p className="text-[11px] font-semibold text-[#6B5546] dark:text-[#AEB8BF]">{count >= needAll ? "✅ " : `🔒 ${needAll} `}{tri("sfide", "Challenges", "challenges", "retos")}</p>
                <p className="text-[13px] font-bold text-[#2C1E16] dark:text-[#e4eff8] leading-tight">{tri("Sblocca tutto", "Alles freischalten", "Unlock everything", "Desbloquea todo")}</p>
              </div>
            </div>
            {user && count >= (state?.need_panettoni || 3) && (
              <button data-testid="sfide-certificate" onClick={downloadCertificate}
                className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-[#FFFDF9] font-semibold px-4 py-2.5 active:scale-98 transition-all">
                <Trophy className="w-4.5 h-4.5" /> {tri("Scarica il Certificato PDF", "PDF-Zertifikat herunterladen", "Download PDF Certificate", "Descargar Certificado PDF")}
              </button>
            )}
          </div>

          {/* Percorsi Impara completati (mostrati insieme alle sfide) */}
          {user && [...completed].some((c) => c.startsWith("learn_")) && (
            <div data-testid="sfide-learn" className="mt-4 rounded-2xl bg-[#FAF5EC] dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] p-4">
              <p className="font-display text-base font-bold text-[#2C1E16] dark:text-[#e4eff8] flex items-center gap-2 mb-2.5">
                <GraduationCap className="w-5 h-5 text-[#8C4A27]" /> {tri("Percorsi Impara completati", "Abgeschlossene Lernpfade", "Completed Learn paths", "Rutas de aprendizaje completadas")}
              </p>
              <div className="flex flex-wrap gap-2" data-testid="sfide-learn-list">
                {[...completed].filter((c) => c.startsWith("learn_")).map((c) => {
                  const k = c.replace("learn_", ""); const m = LEARN_LABELS[k]; if (!m) return null;
                  return (
                    <span key={c} data-testid={`sfide-learn-${k}`} className="inline-flex items-center gap-1.5 bg-[#FEF3C7] border border-[#D97706] text-[#8C4A27] text-[12.5px] font-bold px-3 py-1.5 rounded-full">
                      <span>{m.icon}</span>{m[lang] || m.en || m.it}<Check className="w-3.5 h-3.5" />
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {!user && (
            <div className="mt-4 rounded-2xl bg-[#F2E8D5] border border-[#E6D8C3] p-4 text-center">
              <Lock className="w-6 h-6 text-[#8C4A27] mx-auto mb-2" />
              <p className="text-sm text-[#6B5546] mb-3">{tri("Registrati gratis per partecipare alle sfide e sbloccare i contenuti.", "Registriere dich, um an Challenges teilzunehmen.", "Register to join challenges and unlock content.", "Regístrate para participar en los retos.")}</p>
              <button data-testid="sfide-register" onClick={() => setAuthOpen(true)}
                className="w-full bg-[#8C4A27] hover:bg-[#6E371C] text-[#FFFDF9] font-semibold px-5 py-3 rounded-2xl active:scale-98 transition-all">
                {tri("Registrati per iniziare", "Registrieren und loslegen", "Register to start", "Regístrate para empezar")}
              </button>
            </div>
          )}

          {/* Lista sfide */}
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#8C4A27]" /></div>
          ) : (
            <div className="mt-5 space-y-2.5" data-testid="sfide-list">
              {catalog.map((c) => {
                const meta = META[c.id] || {};
                const Icon = meta.Icon || Sparkles;
                const txt = meta[flang] || meta.it || [c.label, ""];
                const done = completed.has(c.id);
                const isHonor = c.type === "honor";
                return (
                  <div key={c.id} data-testid={`sfide-item-${c.id}`}
                    className={`flex items-start gap-3 rounded-2xl p-4 border shadow-sm transition-all ${done ? "bg-[#FEF3C7] border-[#D97706]" : "bg-[#FAF5EC] dark:bg-[#232A31] border-[#E6D8C3] dark:border-[#38424B]"}`}>
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${done ? "bg-[#D97706] text-white" : "bg-[#8C4A27]/12 text-[#8C4A27]"}`}>
                      {done ? <Check className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-display text-[15px] font-bold text-[#2C1E16] dark:text-[#e4eff8] leading-tight">{txt[0]}</p>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${isHonor ? "bg-[#8C7362]/20 text-[#6B5546]" : "bg-[#2e8b6f]/15 text-[#2e8b6f]"}`}>
                          {isHonor ? tri("Onore", "Ehre", "Honor", "Honor") : tri("Verificata", "Geprüft", "Verified", "Verificada")}
                        </span>
                      </div>
                      <p className="text-[12.5px] text-[#6B5546] dark:text-[#AEB8BF] leading-snug mt-0.5">{txt[1]}</p>
                      {!done && (
                        <div className="flex items-center gap-2 mt-2">
                          {c.id === "whatsapp_share" && (
                            <a data-testid="sfide-wa-link" href={`https://wa.me/?text=${encodeURIComponent(WA_TEXT)}`} target="_blank" rel="noreferrer"
                              className="text-[12px] font-bold text-[#2e8b6f] underline">WhatsApp ↗</a>
                          )}
                          <button data-testid={`sfide-complete-${c.id}`} disabled={busy === c.id}
                            onClick={() => doComplete(c.id, isHonor)}
                            className="ml-auto flex items-center gap-1.5 bg-[#8C4A27] hover:bg-[#6E371C] disabled:opacity-50 text-[#FFFDF9] text-[13px] font-semibold px-4 py-2 rounded-xl active:scale-95 transition-all">
                            {busy === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (isHonor ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />)}
                            {isHonor ? tri("Ho fatto", "Erledigt", "I did it", "Hecho") : tri("Verifica ora", "Jetzt prüfen", "Verify now", "Verificar")}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
