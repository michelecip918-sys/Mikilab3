import { useState, useEffect } from "react";
import { Megaphone, Share2, Copy, Download, Instagram, Facebook, Youtube, MessageCircle, Music2, AtSign, Film, ChevronDown, ChevronUp, Check } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { SOCIAL, SITE_URL } from "@/config/social";
import { siteSettingsApi, communityApi } from "@/lib/api";

const CAPTIONS = {
  it: {
    bacheca: "🥖 Ho scoperto MikiLab: il laboratorio del fornaio 100% GRATIS! Ricette col metodo di Michele, piani di produzione con l'IA, food cost e diagnosi dell'impasto. Pane, pizza e pasticceria in un'unica app 👉 " + SITE_URL + "\n#MikiLab #panefattoincasa #lievitomadre #panificazione #homebaking",
    storia: "🥖 Panifica come un pro, GRATIS.\nRicette + piani IA + diagnosi impasto.\n👉 Swipe up / link: " + SITE_URL + "\n#MikiLab #lievitomadre",
    reel: "POV: hai trovato l'app che ti organizza tutto il forno 🥖🔥\nRicette, food cost, piani con l'IA e diagnosi dell'impasto. E costa ZERO.\nProva MikiLab 👉 " + SITE_URL + "\n#MikiLab #panetok #lievitomadre #fyp #homebaking",
  },
  en: {
    bacheca: "🥖 Just found MikiLab — the baker's lab, 100% FREE! Recipes, AI production plans, food cost & dough diagnosis. Bread, pizza & pastry in one app 👉 " + SITE_URL + "\n#MikiLab #homebaking #sourdough #breadmaking",
    storia: "🥖 Bake like a pro, for FREE.\nRecipes + AI plans + dough diagnosis.\n👉 Link: " + SITE_URL + "\n#MikiLab #sourdough",
    reel: "POV: you found the app that runs your whole bakery 🥖🔥\nRecipes, food cost, AI plans & dough diagnosis. And it's FREE.\nTry MikiLab 👉 " + SITE_URL + "\n#MikiLab #breadtok #sourdough #fyp #homebaking",
  },
  de: {
    bacheca: "🥖 MikiLab entdeckt — die Bäcker-Werkstatt, 100% KOSTENLOS! Rezepte, KI-Produktionspläne, Food-Cost & Teig-Diagnose. Brot, Pizza & Gebäck in einer App 👉 " + SITE_URL + "\n#MikiLab #Brotbacken #Sauerteig",
    storia: "🥖 Backe wie ein Profi, GRATIS.\nRezepte + KI-Pläne + Teig-Diagnose.\n👉 Link: " + SITE_URL + "\n#MikiLab #Sauerteig",
    reel: "POV: du hast die App gefunden, die deine ganze Backstube organisiert 🥖🔥\nRezepte, Food-Cost, KI-Pläne & Teig-Diagnose. Und alles GRATIS.\nProbier MikiLab 👉 " + SITE_URL + "\n#MikiLab #Brotbacken #Sauerteig #fyp",
  },
  es: {
    bacheca: "🥖 Descubrí MikiLab — el laboratorio del panadero, ¡100% GRATIS! Recetas, planes con IA, food cost y diagnóstico de la masa. Pan, pizza y pastelería en una app 👉 " + SITE_URL + "\n#MikiLab #pancasero #masamadre",
    storia: "🥖 Hornea como un pro, GRATIS.\nRecetas + planes IA + diagnóstico de masa.\n👉 Link: " + SITE_URL + "\n#MikiLab #masamadre",
    reel: "POV: encontraste la app que organiza todo tu obrador 🥖🔥\nRecetas, food cost, planes con IA y diagnóstico de masa. Y es GRATIS.\nPrueba MikiLab 👉 " + SITE_URL + "\n#MikiLab #pantok #masamadre #fyp",
  },
};

const REEL_SCRIPT = {
  it: `🎬 REEL / TIKTOK — Script 15-17s "MikiLab"

HOOK (0-2s) — Primo piano mani che aprono l'impasto, farina in controluce.
Testo a schermo: "Fai il pane come un professionista 🥖"
Voce: "Ti insegno a panificare come in laboratorio. Gratis."

(2-5s) — Screen recording app, schermata Ricette.
Testo: "Ricette col metodo di Michele"

(5-8s) — App: Piano di produzione con l'IA + Food cost.
Testo: "Piani con l'IA + costo reale"

(8-11s) — App: Diagnosi impasto con foto.
Testo: "Fotografi l'impasto → ti dico cosa manca"

(11-14s) — Pane appena sfornato, taglio della fetta.
Testo: "Pane, pizza e pasticceria"

CTA (14-17s) — Logo MikiLab + schermo arancione.
Testo: "100% GRATIS 👉 mikilab.de — Seguimi @mikilab.de"

🎵 Audio: un trending sound caldo/acustico.
#MikiLab #panetok #lievitomadre #fyp #homebaking #panefattoincasa`,
  en: `🎬 REEL / TIKTOK — 15-17s script "MikiLab"

HOOK (0-2s) — Close-up hands opening the dough, flour backlit.
On-screen: "Bake bread like a pro 🥖"
VO: "I'll teach you to bake like in a real lab. For free."

(2-5s) — App screen recording: Recipes.
Text: "Recipes with Michele's method"

(5-8s) — App: AI production plan + Food cost.
Text: "AI plans + real cost"

(8-11s) — App: Dough photo diagnosis.
Text: "Snap your dough → I tell you what's missing"

(11-14s) — Fresh bread, slice cut.
Text: "Bread, pizza & pastry"

CTA (14-17s) — MikiLab logo + orange screen.
Text: "100% FREE 👉 mikilab.de — Follow @mikilab.de"

🎵 Audio: a warm trending sound.
#MikiLab #breadtok #sourdough #fyp #homebaking`,
  de: `🎬 REEL / TIKTOK — 15-17s Skript "MikiLab"

HOOK (0-2s) — Nahaufnahme: Hände öffnen den Teig, Mehl im Gegenlicht.
Text: "Backe Brot wie ein Profi 🥖"
VO: "Ich zeige dir das Backen wie in der Backstube. Kostenlos."

(2-5s) — App-Screen: Rezepte.
Text: "Rezepte nach Micheles Methode"

(5-8s) — App: KI-Produktionsplan + Food-Cost.
Text: "KI-Pläne + echte Kosten"

(8-11s) — App: Teig-Diagnose per Foto.
Text: "Foto vom Teig → ich sage, was fehlt"

(11-14s) — Frisches Brot, Anschnitt.
Text: "Brot, Pizza & Gebäck"

CTA (14-17s) — MikiLab-Logo + oranger Screen.
Text: "100% GRATIS 👉 mikilab.de — Folge @mikilab.de"

🎵 Audio: ein warmer Trending-Sound.
#MikiLab #Brotbacken #Sauerteig #fyp`,
};

const SEASONAL = [
  { id: "natale", label: { it: "🎄 Natale", de: "🎄 Weihnachten", en: "🎄 Christmas", es: "🎄 Navidad", fr: "🎄 Noël", fa: "🎄 کریسمس" }, text: { it: "🎄 Quest'anno il panettone lo fai TU! Ricetta passo-passo e lista «cosa e dove comprare». Gratis su MikiLab 👉 " + SITE_URL + "\n#MikiLab #panettone #lievitomadre #Natale", de: "🎄 Dieses Jahr backst DU den Panettone! Schritt-für-Schritt-Rezept, gratis auf MikiLab 👉 " + SITE_URL + "\n#MikiLab #Panettone #Weihnachten", en: "🎄 This year YOU bake the panettone! Step-by-step recipe, free on MikiLab 👉 " + SITE_URL + "\n#MikiLab #panettone #Christmas", es: "🎄 ¡Este año el panettone lo haces TÚ! Receta paso a paso, gratis en MikiLab 👉 " + SITE_URL + "\n#MikiLab #panettone #Navidad" } },
  { id: "pasqua", label: { it: "🕊️ Pasqua", de: "🕊️ Ostern", en: "🕊️ Easter", es: "🕊️ Pascua", fr: "🕊️ Pâques", fa: "🕊️ عید پاک" }, text: { it: "🕊️ Colomba di Pasqua fatta in casa, senza paura! Ti guido su MikiLab, gratis 👉 " + SITE_URL + "\n#MikiLab #colomba #Pasqua", de: "🕊️ Oster-Colomba selbst gebacken! Ich führe dich, gratis auf MikiLab 👉 " + SITE_URL + "\n#MikiLab #Ostern", en: "🕊️ Homemade Easter colomba, no fear! I guide you, free on MikiLab 👉 " + SITE_URL + "\n#MikiLab #Easter", es: "🕊️ ¡Colomba de Pascua casera! Te guío gratis en MikiLab 👉 " + SITE_URL + "\n#MikiLab #Pascua" } },
  { id: "estate", label: { it: "☀️ Estate", de: "☀️ Sommer", en: "☀️ Summer", es: "☀️ Verano", fr: "☀️ Été", fa: "☀️ تابستان" }, text: { it: "☀️ Estate = focaccia! Ricette + lista spesa, gratis su MikiLab 👉 " + SITE_URL + "\n#MikiLab #focaccia #estate", de: "☀️ Sommer = Focaccia! Rezepte gratis auf MikiLab 👉 " + SITE_URL + "\n#MikiLab #Focaccia #Sommer", en: "☀️ Summer = focaccia! Recipes free on MikiLab 👉 " + SITE_URL + "\n#MikiLab #focaccia #summer", es: "☀️ ¡Verano = focaccia! Recetas gratis en MikiLab 👉 " + SITE_URL + "\n#MikiLab #focaccia #verano" } },
  { id: "valentino", label: { it: "❤️ S.Valentino", de: "❤️ Valentinstag", en: "❤️ Valentine's", es: "❤️ San Valentín", fr: "❤️ Saint-Valentin", fa: "❤️ ولنتاین" }, text: { it: "❤️ Conquista chi ami con un dolce fatto a mano. Gratis su MikiLab 👉 " + SITE_URL + "\n#MikiLab #SanValentino", de: "❤️ Verzaubere mit einem selbstgemachten Dessert. Gratis auf MikiLab 👉 " + SITE_URL + "\n#MikiLab #Valentinstag", en: "❤️ Win their heart with a homemade sweet. Free on MikiLab 👉 " + SITE_URL + "\n#MikiLab #ValentinesDay", es: "❤️ Conquista con un dulce casero. Gratis en MikiLab 👉 " + SITE_URL + "\n#MikiLab #SanValentín" } },
  { id: "halloween", label: { it: "🎃 Halloween", de: "🎃 Halloween", en: "🎃 Halloween", es: "🎃 Halloween", fr: "🎃 Halloween", fa: "🎃 هالووین" }, text: { it: "🎃 Pane alla zucca da paura per Halloween! Gratis su MikiLab 👉 " + SITE_URL + "\n#MikiLab #Halloween #autunno", de: "🎃 Gruseliges Kürbisbrot für Halloween! Gratis auf MikiLab 👉 " + SITE_URL + "\n#MikiLab #Halloween", en: "🎃 Spooky pumpkin bread for Halloween! Free on MikiLab 👉 " + SITE_URL + "\n#MikiLab #Halloween", es: "🎃 ¡Pan de calabaza para Halloween! Gratis en MikiLab 👉 " + SITE_URL + "\n#MikiLab #Halloween" } },
];

const SOCIALS = [
  { key: "instagram", Icon: Instagram, label: "Instagram", color: "#E1306C" },
  { key: "facebook", Icon: Facebook, label: "Facebook", color: "#1877F2" },
  { key: "tiktok", Icon: Music2, label: "TikTok", color: "#ffffff" },
  { key: "threads", Icon: AtSign, label: "Threads", color: "#ffffff" },
  { key: "youtube", Icon: Youtube, label: "YouTube", color: "#FF0000" },
  { key: "whatsapp", Icon: MessageCircle, label: "WhatsApp", color: "#25D366" },
];

export default function PromuoviMikiLab() {
  const { lang } = useLang();
  const L = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [copied, setCopied] = useState(false);
  const [reelOpen, setReelOpen] = useState(false);
  const [reelCopied, setReelCopied] = useState(false);
  const [season, setSeason] = useState(SEASONAL[0].id);
  const [seasonCopied, setSeasonCopied] = useState(false);
  const [variant, setVariant] = useState("bacheca");
  const [settings, setSettings] = useState(null);
  const [flyerLang, setFlyerLang] = useState(lang);
  const [flyerBig, setFlyerBig] = useState(false);
  const [postBig, setPostBig] = useState(null);
  const [flyerOrient, setFlyerOrient] = useState("v");
  useEffect(() => { siteSettingsApi.get().then(setSettings).catch(() => {}); }, []);
  useEffect(() => { setFlyerLang(lang); }, [lang]);
  const ttHandle = (settings && settings.tiktok_handle) || "mikilab.de";
  const tiktokUrl = `https://www.tiktok.com/@${ttHandle}`;
  const socialUrls = {
    instagram: (settings && settings.instagram_url) || SOCIAL.instagram,
    facebook: (settings && settings.facebook_url) || SOCIAL.facebook,
    whatsapp: SOCIAL.whatsapp, youtube: SOCIAL.youtube, threads: SOCIAL.threads,
  };
  const FLYER_BASE = { it: "locandina-mikilab", de: "locandina-mikilab-de", en: "locandina-mikilab-en", es: "locandina-mikilab-es", fr: "locandina-mikilab-fr" };
  const flyerBase = FLYER_BASE[flyerLang] || "locandina-mikilab-en";
  const flyerFile = `${flyerBase}${flyerOrient === "h" ? "-h" : ""}.png`;
  const FLYER_LANGS = [{ k: "it", f: "🇮🇹" }, { k: "de", f: "🇩🇪" }, { k: "en", f: "🇬🇧" }, { k: "es", f: "🇪🇸" }, { k: "fr", f: "🇫🇷" }];
  const caps = CAPTIONS[lang] || CAPTIONS.en;
  const caption = caps[variant];
  const activeSocials = SOCIALS.filter((s) => s.key !== "tiktok" && socialUrls[s.key]);
  const [bakeryName, setBakeryName] = useState("");
  const [personalUrl, setPersonalUrl] = useState(null);
  useEffect(() => {
    const name = bakeryName.trim();
    if (!name) { setPersonalUrl(null); return; }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      const c = document.createElement("canvas");
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const W = c.width, H = c.height;
      const txt = (name.length > 26 ? name.slice(0, 26) : name);
      if (W > H) {
        // Orizzontale: nome in basso a sinistra (zona libera)
        const fs = Math.round(H * 0.05);
        ctx.font = `800 ${fs}px Manrope, Arial, sans-serif`;
        ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
        const x = Math.round(W * 0.06), y = Math.round(H * 0.93);
        ctx.lineWidth = Math.max(4, fs * 0.18); ctx.strokeStyle = "#121212"; ctx.strokeText(txt, x, y);
        ctx.fillStyle = "#ff6b00"; ctx.fillText(txt, x, y);
      } else {
        // Verticale: nome centrato sopra il QR
        const fs = Math.round(H * 0.034);
        ctx.font = `800 ${fs}px Manrope, Arial, sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        const y = Math.round(H * 0.463);
        ctx.lineWidth = Math.max(4, fs * 0.18); ctx.strokeStyle = "#121212"; ctx.strokeText(txt, W / 2, y);
        ctx.fillStyle = "#ff6b00"; ctx.fillText(txt, W / 2, y);
      }
      try { setPersonalUrl(c.toDataURL("image/png")); } catch { setPersonalUrl(null); }
    };
    img.onerror = () => setPersonalUrl(null);
    img.src = `${process.env.PUBLIC_URL || ""}/${flyerFile}`;
    return () => { cancelled = true; };
  }, [bakeryName, flyerFile]);
  const displayFlyer = personalUrl || `${process.env.PUBLIC_URL}/${flyerFile}`;
  const shareFlyer = async () => {
    try {
      const res = await fetch(displayFlyer);
      const blob = await res.blob();
      const file = new File([blob], flyerFile, { type: blob.type || "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "MikiLab", text: `MikiLab — ${SITE_URL}` });
        return;
      }
    } catch { /* fallthrough */ }
    if (navigator.share) {
      try { await navigator.share({ title: "MikiLab", text: L("La locandina di MikiLab", "Der MikiLab-Flyer", "The MikiLab flyer", "El folleto de MikiLab", "Le flyer MikiLab", "پوستر MikiLab"), url: SITE_URL }); return; } catch { /* */ }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`MikiLab — ${SITE_URL}`)}`, "_blank");
  };
  const publishTikTok = () => {
    const a = document.createElement("a"); a.href = displayFlyer; a.download = flyerFile; a.click();
    communityApi.socialClick("tiktok");
    window.open("https://www.tiktok.com/upload", "_blank");
    toast.success(L("Locandina scaricata: ora caricala su TikTok!", "Flyer geladen: jetzt auf TikTok hochladen!", "Flyer downloaded: now upload it on TikTok!", "Folleto descargado: ¡súbelo ahora a TikTok!", "Flyer téléchargé : télécharge-le sur TikTok !", "پوستر دانلود شد: حالا در تیک‌تاک بارگذاری کن!"));
  };
  const POSTS = [
    { file: "welcome-tiktok.png", label: L("Benvenuto", "Willkommen", "Welcome", "Bienvenida", "Bienvenue", "خوش‌آمد") },
    { file: "launch-1-presentazione.png", label: L("Presentazione", "Vorstellung", "Intro", "Presentación", "Présentation", "معرفی") },
    { file: "launch-2-ricetta.png", label: L("Ricetta gratis", "Gratis-Rezept", "Free recipe", "Receta gratis", "Recette gratuite", "دستور رایگان") },
    { file: "launch-3-community.png", label: L("Community", "Community", "Community", "Comunidad", "Communauté", "انجمن") },
    { file: "w2-dietro.png", label: L("Dietro le quinte", "Hinter den Kulissen", "Behind the scenes", "Detrás de escena", "Coulisses", "پشت صحنه") },
    { file: "w2-primadopo.png", label: L("Prima & Dopo", "Vorher & Nachher", "Before & After", "Antes y después", "Avant/Après", "قبل و بعد") },
    { file: "w2-sondaggio.png", label: L("Sondaggio", "Umfrage", "Poll", "Encuesta", "Sondage", "نظرسنجی") },
  ];
  const sharePoster = async (file) => {
    const url = `${window.location.origin}${process.env.PUBLIC_URL || ""}/${file}`;
    try {
      const r = await fetch(url); const b = await r.blob();
      const f = new File([b], file, { type: b.type || "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: "MikiLab", text: `MikiLab — ${SITE_URL}` }); return; }
    } catch { /* */ }
    window.open(`https://wa.me/?text=${encodeURIComponent(`MikiLab — ${SITE_URL}`)}`, "_blank");
  };
  const VARIANTS = [
    { id: "bacheca", label: L("Post", "Beitrag", "Post", "Post", "Post", "پست") },
    { id: "storia", label: L("Storia", "Story", "Story", "Historia", "Story", "استوری") },
    { id: "reel", label: "Reel / TikTok" },
  ];

  const invite = async () => {
    const data = { title: "MikiLab", text: L("Prova MikiLab, il laboratorio del fornaio 100% gratis!", "Probier MikiLab, die kostenlose Bäcker-Werkstatt!", "Try MikiLab, the free baker's lab!", "¡Prueba MikiLab, el laboratorio del panadero gratis!", "Essaie MikiLab, l'atelier du boulanger gratuit !", "میکی‌لب رایگان را امتحان کن!"), url: SITE_URL };
    try { if (navigator.share) { await navigator.share(data); return; } } catch { return; }
    try { await navigator.clipboard.writeText(SITE_URL); toast.success(L("Link copiato!", "Link kopiert!", "Link copied!", "¡Enlace copiado!", "Lien copié !", "لینک کپی شد!")); } catch { /* */ }
  };
  const copyCaption = async () => {
    try { await navigator.clipboard.writeText(caption); setCopied(true); setTimeout(() => setCopied(false), 2000); toast.success(L("Post copiato! Incollalo su Instagram/Facebook", "Beitrag kopiert!", "Post copied! Paste it on Instagram/Facebook", "¡Publicación copiada!", "Post copié !", "پست کپی شد!")); }
    catch { toast.error("Copy failed"); }
  };
  const seasonRaw = (SEASONAL.find((s) => s.id === season) || SEASONAL[0]).text;
  const seasonText = typeof seasonRaw === "string" ? seasonRaw : (seasonRaw[lang] || seasonRaw.it);
  const copySeason = async () => {
    try { await navigator.clipboard.writeText(seasonText); setSeasonCopied(true); setTimeout(() => setSeasonCopied(false), 2000); toast.success(L("Post stagionale copiato!", "Saisonaler Beitrag kopiert!", "Seasonal post copied!", "¡Copiado!", "Copié !", "کپی شد!")); }
    catch { toast.error("Copy failed"); }
  };
  const reelScript = REEL_SCRIPT[lang] || REEL_SCRIPT.en;
  const copyReel = async () => {
    try { await navigator.clipboard.writeText(reelScript); setReelCopied(true); setTimeout(() => setReelCopied(false), 2000); toast.success(L("Script del Reel copiato!", "Reel-Skript kopiert!", "Reel script copied!", "¡Guion del Reel copiado!", "Script du Reel copié !", "اسکریپت ریل کپی شد!")); }
    catch { toast.error("Copy failed"); }
  };

  return (
    <div data-testid="promuovi-mikilab" className="rounded-3xl overflow-hidden border border-[#ff6b00]/40 bg-[#181818]">
      <div className="p-4 text-[#121212] flex items-center gap-3" style={{ background: "linear-gradient(135deg,#ff8a33,#ff6b00 75%)" }}>
        <div className="w-11 h-11 rounded-2xl bg-[#121212]/15 border border-[#121212]/20 flex items-center justify-center shrink-0"><Megaphone className="w-6 h-6" /></div>
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-widest">{L("Fai crescere MikiLab", "Lass MikiLab wachsen", "Grow MikiLab", "Haz crecer MikiLab", "Fais grandir MikiLab", "میکی‌لب را بزرگ کن")}</p>
          <h3 className="font-display text-lg font-extrabold leading-tight">{L("Condividi & Promuovi", "Teilen & bewerben", "Share & Promote", "Comparte y promociona", "Partage & promeus", "اشتراک و تبلیغ")}</h3>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Invita */}
        <button data-testid="promuovi-invite" onClick={invite}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#ff6b00] text-[#121212] font-bold py-3.5 active:scale-98 transition-all">
          <Share2 className="w-5 h-5" /> {L("Invita un amico", "Freund einladen", "Invite a friend", "Invita a un amigo", "Inviter un ami", "دعوت از دوست")}
        </button>

        {/* Post pronto */}
        <div className="rounded-2xl bg-[#121212] border border-[#2e2e2e] p-3.5">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#ff6b00] mb-1.5">{L("Post pronto da copiare", "Fertiger Beitrag zum Kopieren", "Ready-to-post caption", "Publicación lista", "Légende prête", "کپشن آماده")}</p>
          <div className="flex gap-1.5 mb-2" data-testid="promuovi-variants">
            {VARIANTS.map((v) => (
              <button key={v.id} data-testid={`promuovi-variant-${v.id}`} onClick={() => setVariant(v.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${variant === v.id ? "bg-[#ff6b00] text-[#121212]" : "bg-[#1e1e1e] text-[#AEB8BF] border border-[#2e2e2e]"}`}>
                {v.label}
              </button>
            ))}
          </div>
          <p data-testid="promuovi-caption" className="text-[12.5px] text-[#E0D5CF] leading-snug whitespace-pre-line mb-2.5">{caption}</p>
          <button data-testid="promuovi-copy-caption" onClick={copyCaption}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#ff6b00]/40 text-white font-semibold py-2.5 text-sm active:scale-95">
            {copied ? <Check className="w-4 h-4 text-[#2e8b6f]" /> : <Copy className="w-4 h-4 text-[#ff6b00]" />} {L("Copia il post", "Beitrag kopieren", "Copy caption", "Copiar", "Copier", "کپی کپشن")}
          </button>
        </div>

        {/* Post stagionali */}
        <div className="rounded-2xl bg-[#121212] border border-[#2e2e2e] p-3.5">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#ff6b00] mb-2">{L("Post stagionali pronti", "Saisonale Beiträge", "Seasonal posts", "Publicaciones de temporada", "Posts saisonniers", "پست‌های فصلی")}</p>
          <div className="flex flex-wrap gap-1.5 mb-2" data-testid="promuovi-seasons">
            {SEASONAL.map((s) => (
              <button key={s.id} data-testid={`promuovi-season-${s.id}`} onClick={() => setSeason(s.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${season === s.id ? "bg-[#ff6b00] text-[#121212]" : "bg-[#1e1e1e] text-[#AEB8BF] border border-[#2e2e2e]"}`}>
                {s.label[lang] || s.label.it}
              </button>
            ))}
          </div>
          <p data-testid="promuovi-season-text" className="text-[12.5px] text-[#E0D5CF] leading-snug whitespace-pre-line mb-2.5">{seasonText}</p>
          <button data-testid="promuovi-season-copy" onClick={copySeason} className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#ff6b00]/40 text-white font-semibold py-2.5 text-sm active:scale-95">
            {seasonCopied ? <Check className="w-4 h-4 text-[#2e8b6f]" /> : <Copy className="w-4 h-4 text-[#ff6b00]" />} {L("Copia il post", "Kopieren", "Copy", "Copiar", "Copier", "کپی")}
          </button>
        </div>

        {/* Kit Reel di lancio */}
        <div className="rounded-2xl bg-[#121212] border border-[#2e2e2e] overflow-hidden">
          <button data-testid="promuovi-reel-toggle" onClick={() => setReelOpen((v) => !v)} className="w-full flex items-center gap-2 p-3.5 text-left">
            <Film className="w-5 h-5 text-[#ff6b00] shrink-0" />
            <span className="flex-1 font-display text-sm font-bold text-white">{L("Kit Reel di lancio (script 15s)", "Reel-Kit (15s-Skript)", "Launch Reel kit (15s script)", "Kit Reel de lanzamiento (guion 15s)", "Kit Reel de lancement (script 15s)", "کیت ریل (اسکریپت ۱۵ ثانیه)")}</span>
            {reelOpen ? <ChevronUp className="w-4 h-4 text-[#AEB8BF]" /> : <ChevronDown className="w-4 h-4 text-[#AEB8BF]" />}
          </button>
          {reelOpen && (
            <div className="px-3.5 pb-3.5">
              <img src={`${process.env.PUBLIC_URL}/reel-cover.png`} alt="Reel cover" className="w-28 h-auto rounded-lg border border-[#2e2e2e] float-right ml-3 mb-2" />
              <pre data-testid="promuovi-reel-script" className="text-[11.5px] text-[#E0D5CF] leading-snug whitespace-pre-wrap font-sans">{reelScript}</pre>
              <div className="grid grid-cols-2 gap-2 mt-3 clear-both">
                <button data-testid="promuovi-reel-copy" onClick={copyReel} className="flex items-center justify-center gap-2 rounded-xl border border-[#ff6b00]/40 text-white font-semibold py-2.5 text-sm active:scale-95">
                  {reelCopied ? <Check className="w-4 h-4 text-[#2e8b6f]" /> : <Copy className="w-4 h-4 text-[#ff6b00]" />} {L("Copia script", "Skript kopieren", "Copy script", "Copiar guion", "Copier script", "کپی اسکریپت")}
                </button>
                <a data-testid="promuovi-reel-cover" href={`${process.env.PUBLIC_URL}/reel-cover.png`} download="mikilab-reel-cover.png" className="flex items-center justify-center gap-2 rounded-xl bg-[#ff6b00] text-[#121212] font-bold py-2.5 text-sm active:scale-95">
                  <Download className="w-4 h-4" /> {L("Cover 9:16", "Cover 9:16", "9:16 cover", "Portada 9:16", "Cover 9:16", "کاور ۹:۱۶")}
                </a>
              </div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#ff6b00] mt-3 mb-1.5">{L("Cover stagionali", "Saisonale Cover", "Seasonal covers", "Portadas de temporada", "Covers saisonnières", "کاورهای فصلی")}</p>
              <div className="grid grid-cols-2 gap-2">
                <a data-testid="promuovi-cover-panettone" href={`${process.env.PUBLIC_URL}/reel-cover-panettone.png`} download="mikilab-panettone.png" className="flex items-center justify-center gap-2 rounded-xl border border-[#ff6b00]/40 text-white font-semibold py-2.5 text-sm active:scale-95">
                  <Download className="w-4 h-4 text-[#ff6b00]" /> {L("Natale · Panettone", "Weihnachten", "Christmas", "Navidad", "Noël", "کریسمس")}
                </a>
                <a data-testid="promuovi-cover-colomba" href={`${process.env.PUBLIC_URL}/reel-cover-colomba.png`} download="mikilab-colomba.png" className="flex items-center justify-center gap-2 rounded-xl border border-[#ff6b00]/40 text-white font-semibold py-2.5 text-sm active:scale-95">
                  <Download className="w-4 h-4 text-[#ff6b00]" /> {L("Pasqua · Colomba", "Ostern", "Easter", "Pascua", "Pâques", "عید پاک")}
                </a>
                <a data-testid="promuovi-cover-estate" href={`${process.env.PUBLIC_URL}/reel-cover-estate.png`} download="mikilab-estate.png" className="flex items-center justify-center gap-2 rounded-xl border border-[#ff6b00]/40 text-white font-semibold py-2.5 text-sm active:scale-95">
                  <Download className="w-4 h-4 text-[#ff6b00]" /> {L("Estate · Focacce", "Sommer", "Summer", "Verano", "Été", "تابستان")}
                </a>
                <a data-testid="promuovi-cover-valentino" href={`${process.env.PUBLIC_URL}/reel-cover-valentino.png`} download="mikilab-valentino.png" className="flex items-center justify-center gap-2 rounded-xl border border-[#ff6b00]/40 text-white font-semibold py-2.5 text-sm active:scale-95">
                  <Download className="w-4 h-4 text-[#ff6b00]" /> {L("San Valentino", "Valentinstag", "Valentine's", "San Valentín", "Saint-Valentin", "ولنتاین")}
                </a>
                <a data-testid="promuovi-cover-halloween" href={`${process.env.PUBLIC_URL}/reel-cover-halloween.png`} download="mikilab-halloween.png" className="flex items-center justify-center gap-2 rounded-xl border border-[#ff6b00]/40 text-white font-semibold py-2.5 text-sm active:scale-95">
                  <Download className="w-4 h-4 text-[#ff6b00]" /> Halloween
                </a>
                <a data-testid="promuovi-cover-ferragosto" href={`${process.env.PUBLIC_URL}/reel-cover-ferragosto.png`} download="mikilab-ferragosto.png" className="flex items-center justify-center gap-2 rounded-xl border border-[#ff6b00]/40 text-white font-semibold py-2.5 text-sm active:scale-95">
                  <Download className="w-4 h-4 text-[#ff6b00]" /> {L("Ferragosto", "Mariä Himmelfahrt", "Ferragosto (Aug 15)", "Ferragosto (15 ago)", "Ferragosto (15 août)", "فراگوستو")}
                </a>
                <a data-testid="promuovi-cover-carnevale" href={`${process.env.PUBLIC_URL}/reel-cover-carnevale.png`} download="mikilab-carnevale.png" className="flex items-center justify-center gap-2 rounded-xl border border-[#ff6b00]/40 text-white font-semibold py-2.5 text-sm active:scale-95">
                  <Download className="w-4 h-4 text-[#ff6b00]" /> {L("Carnevale", "Karneval", "Carnival", "Carnaval", "Carnaval", "کارناوال")}
                </a>
                <a data-testid="promuovi-cover-mamma" href={`${process.env.PUBLIC_URL}/reel-cover-mamma.png`} download="mikilab-festa-mamma.png" className="flex items-center justify-center gap-2 rounded-xl border border-[#ff6b00]/40 text-white font-semibold py-2.5 text-sm active:scale-95">
                  <Download className="w-4 h-4 text-[#ff6b00]" /> {L("Festa Mamma", "Muttertag", "Mother's Day", "Día de la Madre", "Fête des Mères", "روز مادر")}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* QR */}
        <div className="rounded-2xl bg-[#121212] border border-[#2e2e2e] p-3.5 flex items-center gap-3">
          <img src={`${process.env.PUBLIC_URL}/qr-mikilab.png`} alt="QR MikiLab" className="w-20 h-20 rounded-lg bg-white p-1 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white leading-tight">{L("QR del sito", "Website-QR", "Website QR", "QR del sitio", "QR du site", "کد QR سایت")}</p>
            <p className="text-[12px] text-[#AEB8BF] leading-snug mb-2">{L("Stampalo per il forno, i volantini e la vetrina.", "Für Backstube, Flyer und Schaufenster.", "Print it for the bakery, flyers and window.", "Imprímelo para el horno y los folletos.", "Imprime-le pour la boulangerie et les flyers.", "برای نانوایی و بروشور چاپش کن.")}</p>
            <a data-testid="promuovi-qr-download" href={`${process.env.PUBLIC_URL}/qr-mikilab.png`} download="qr-mikilab.png"
              className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#ff6b00] border border-[#ff6b00]/40 rounded-full px-3 py-1.5 active:scale-95">
              <Download className="w-3.5 h-3.5" /> {L("Scarica QR", "QR laden", "Download QR", "Descargar QR", "Télécharger QR", "دانلود QR")}
            </a>
          </div>
        </div>

        {/* Locandina A5 stampabile: anteprima + scelta lingua */}
        <div data-testid="promuovi-flyer" className="rounded-2xl bg-[#121212] border border-[#2e2e2e] p-3.5">
          <p className="text-sm font-bold text-white leading-tight mb-0.5">{L("Locandina A5 stampabile", "A5-Flyer zum Drucken", "Printable A5 flyer", "Folleto A5 imprimible", "Flyer A5 imprimable", "پوستر A5 قابل چاپ")}</p>
          <p className="text-[12px] text-[#AEB8BF] leading-snug mb-2.5">{L("Scegli la lingua, tocca per ingrandire e scarica.", "Sprache wählen, antippen zum Vergrößern und laden.", "Pick a language, tap to enlarge and download.", "Elige el idioma, toca para ampliar y descarga.", "Choisis la langue, touche pour agrandir et télécharge.", "زبان را انتخاب کن، برای بزرگ‌نمایی بزن و دانلود کن.")}</p>
          <div className="flex items-center gap-1.5 mb-2">
            {FLYER_LANGS.map(({ k, f }) => (
              <button key={k} data-testid={`flyer-lang-${k}`} onClick={() => setFlyerLang(k)}
                className={`text-[13px] rounded-lg px-2 py-1 border transition-all active:scale-95 ${flyerLang === k ? "bg-[#ff6b00] border-[#ff6b00]" : "bg-[#181818] border-[#2e2e2e] opacity-70 hover:opacity-100"}`}>
                {f} <span className="uppercase text-[10px] font-bold text-white/90">{k}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <button data-testid="flyer-orient-v" onClick={() => setFlyerOrient("v")}
              className={`text-[12px] font-bold rounded-lg px-2.5 py-1 border transition-all active:scale-95 ${flyerOrient === "v" ? "bg-[#ff6b00] text-[#121212] border-[#ff6b00]" : "bg-[#181818] text-white/80 border-[#2e2e2e]"}`}>
              {L("Verticale", "Hochformat", "Vertical", "Vertical", "Vertical", "عمودی")}
            </button>
            <button data-testid="flyer-orient-h" onClick={() => setFlyerOrient("h")}
              className={`text-[12px] font-bold rounded-lg px-2.5 py-1 border transition-all active:scale-95 ${flyerOrient === "h" ? "bg-[#ff6b00] text-[#121212] border-[#ff6b00]" : "bg-[#181818] text-white/80 border-[#2e2e2e]"}`}>
              {L("Orizzontale", "Querformat", "Horizontal", "Horizontal", "Horizontal", "افقی")}
            </button>
          </div>
          {/* Personalizza con il nome del forno (sopra il QR) */}
          <input data-testid="flyer-bakery-name" value={bakeryName} onChange={(e) => setBakeryName(e.target.value)}
            maxLength={26} placeholder={L("Il tuo nome (forno, pizzeria, pasticceria, privato…)", "Dein Name (Bäckerei, Pizzeria, Konditorei, privat…)", "Your name (bakery, pizzeria, pastry, private…)", "Tu nombre (horno, pizzería, pastelería, privado…)", "Ton nom (boulangerie, pizzeria, pâtisserie, privé…)", "نام تو (نانوایی، پیتزریا، قنادی، شخصی…)")}
            className="w-full bg-[#181818] border border-[#2e2e2e] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#ff6b00] mb-2.5" />
          <div className="flex items-center gap-3">
            <button data-testid="promuovi-flyer-preview" onClick={() => setFlyerBig(true)}
              className="shrink-0 rounded-xl overflow-hidden border border-[#2e2e2e] hover:border-[#ff6b00] transition-all active:scale-95">
              <img src={displayFlyer} alt="Locandina MikiLab" className={`${flyerOrient === "h" ? "w-[130px] h-[86px]" : "w-[72px] h-[102px]"} object-cover`} loading="lazy"
                onError={(e) => { const fb = `${process.env.PUBLIC_URL}/locandina-mikilab.png`; if (e.currentTarget.src !== fb) e.currentTarget.src = fb; }} />
            </button>
            <div className="flex-1 min-w-0 flex flex-wrap gap-2">
              <a data-testid="promuovi-flyer-download" href={displayFlyer} download={flyerFile}
                className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#121212] bg-[#ff6b00] rounded-full px-3 py-1.5 active:scale-95">
                <Download className="w-3.5 h-3.5" /> {L("Scarica", "Laden", "Download", "Descargar", "Télécharger", "دانلود")}
              </a>
              <button data-testid="promuovi-flyer-share" onClick={shareFlyer}
                className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#ff6b00] border border-[#ff6b00]/40 rounded-full px-3 py-1.5 active:scale-95">
                <Share2 className="w-3.5 h-3.5" /> {L("Condividi", "Teilen", "Share", "Compartir", "Partager", "اشتراک")}
              </button>
              <button data-testid="promuovi-flyer-tiktok" onClick={publishTikTok}
                className="inline-flex items-center gap-1.5 text-[12px] font-bold text-white bg-[#010101] border border-[#2e2e2e] rounded-full px-3 py-1.5 active:scale-95">
                <Music2 className="w-3.5 h-3.5 text-[#ff6b00]" /> {L("Pubblica su TikTok", "Auf TikTok posten", "Post on TikTok", "Publicar en TikTok", "Publier sur TikTok", "انتشار در تیک‌تاک")}
              </button>
              <p className="w-full text-[11px] text-[#7E8A93]">{L("Formato A5 · pronta da stampare", "Format A5 · druckfertig", "A5 format · ready to print", "Formato A5 · lista para imprimir", "Format A5 · prête à imprimer", "قطع A5 · آمادهٔ چاپ")}</p>
            </div>
          </div>
        </div>

        {/* Post social pronti: benvenuto + serie di lancio (scaricabili con un tap) */}
        <div data-testid="promuovi-posts" className="rounded-2xl bg-[#121212] border border-[#2e2e2e] p-3.5">
          <p className="text-sm font-bold text-white leading-tight mb-0.5">{L("Post social pronti", "Fertige Social-Posts", "Ready social posts", "Posts sociales listos", "Posts sociaux prêts", "پست‌های آمادهٔ شبکه‌ها")}</p>
          <p className="text-[12px] text-[#AEB8BF] leading-snug mb-2.5">{L("Scarica e pubblica su TikTok: benvenuto + serie di lancio.", "Laden & auf TikTok posten: Willkommen + Launch-Serie.", "Download & post on TikTok: welcome + launch series.", "Descarga y publica en TikTok: bienvenida + serie de lanzamiento.", "Télécharge et publie sur TikTok : bienvenue + série de lancement.", "دانلود و انتشار در تیک‌تاک: خوش‌آمد + سری راه‌اندازی.")}</p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {POSTS.map((p, i) => (
              <div key={p.file} data-testid={`promuovi-post-${i}`} className="shrink-0 w-[112px]">
                <button onClick={() => setPostBig(`${process.env.PUBLIC_URL}/${p.file}`)}
                  className="block rounded-xl overflow-hidden border border-[#2e2e2e] hover:border-[#ff6b00] transition-all active:scale-95">
                  <img src={`${process.env.PUBLIC_URL}/${p.file}`} alt={p.label} className="w-[112px] h-[160px] object-cover" loading="lazy" />
                </button>
                <p className="text-[11px] text-white/90 font-semibold text-center mt-1 truncate">{p.label}</p>
                <div className="flex gap-1 mt-1">
                  <a data-testid={`post-download-${i}`} href={`${process.env.PUBLIC_URL}/${p.file}`} download={p.file}
                    className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-bold text-[#121212] bg-[#ff6b00] rounded-full py-1 active:scale-95">
                    <Download className="w-3 h-3" />
                  </a>
                  <button data-testid={`post-share-${i}`} onClick={() => sharePoster(p.file)}
                    className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-bold text-[#ff6b00] border border-[#ff6b00]/40 rounded-full py-1 active:scale-95">
                    <Share2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {postBig && (
          <div data-testid="post-lightbox" onClick={() => setPostBig(null)}
            className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <button data-testid="post-lightbox-close" onClick={() => setPostBig(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#1c1c1c] border border-[#2e2e2e] flex items-center justify-center text-white active:scale-90">✕</button>
            <img src={postBig} alt="Post MikiLab" onClick={(e) => e.stopPropagation()}
              className="max-h-[86vh] max-w-full rounded-xl shadow-2xl object-contain" />
          </div>
        )}

        {flyerBig && (
          <div data-testid="flyer-lightbox" onClick={() => setFlyerBig(false)}
            className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <button data-testid="flyer-lightbox-close" onClick={() => setFlyerBig(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#1c1c1c] border border-[#2e2e2e] flex items-center justify-center text-white active:scale-90">✕</button>
            <img src={displayFlyer} alt="Locandina MikiLab" onClick={(e) => e.stopPropagation()}
              className="max-h-[86vh] max-w-full rounded-xl shadow-2xl object-contain" />
          </div>
        )}

        {/* Seguici — TikTok è il canale ufficiale principale (grande e centrale) */}
        <div data-testid="promuovi-follow">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#ff6b00] mb-2 text-center">{L("Seguici", "Folge uns", "Follow us", "Síguenos", "Suis-nous", "ما را دنبال کن")}</p>
          <a data-testid="promuovi-social-tiktok" href={tiktokUrl} target="_blank" rel="noreferrer"
            onClick={() => communityApi.socialClick("tiktok")}
            className="group flex flex-col items-center gap-1.5 rounded-2xl bg-gradient-to-b from-[#1c1c1c] to-[#121212] border border-[#2e2e2e] hover:border-[#ff6b00] px-5 py-5 active:scale-[0.98] transition-all">
            <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#ff6b00] group-hover:scale-105 transition-transform">
              <Music2 className="w-7 h-7 text-[#121212]" />
            </span>
            <span className="text-lg font-extrabold text-white leading-tight">TikTok</span>
            <span className="text-[13px] font-semibold text-[#ff6b00]">@{ttHandle}</span>
            <span className="text-[11px] text-[#AEB8BF]">{L("Il canale ufficiale di MikiLab", "Der offizielle MikiLab-Kanal", "The official MikiLab channel", "El canal oficial de MikiLab", "La chaîne officielle de MikiLab", "کانال رسمی MikiLab")}</span>
          </a>
          {activeSocials.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {activeSocials.map(({ key, Icon, label, color }) => (
                <a key={key} data-testid={`promuovi-social-${key}`} href={socialUrls[key]} target="_blank" rel="noreferrer"
                  onClick={() => communityApi.socialClick(key)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#121212] border border-[#2e2e2e] px-3.5 py-2 text-sm font-semibold text-white active:scale-95 hover:border-[#ff6b00]/60 transition-all">
                  <Icon className="w-4 h-4" style={{ color }} /> {label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
