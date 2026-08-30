import { useState } from "react";
import { Megaphone, Share2, Copy, Download, Instagram, Facebook, Youtube, MessageCircle, Music2, AtSign, Film, ChevronDown, ChevronUp, Check } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { SOCIAL, SITE_URL } from "@/config/social";

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
Testo: "100% GRATIS 👉 mikilab.de — Seguimi @michelucano"

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
Text: "100% FREE 👉 mikilab.de — Follow @michelucano"

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
Text: "100% GRATIS 👉 mikilab.de — Folge @michelucano"

🎵 Audio: ein warmer Trending-Sound.
#MikiLab #Brotbacken #Sauerteig #fyp`,
};

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
  const [variant, setVariant] = useState("bacheca");
  const caps = CAPTIONS[lang] || CAPTIONS.en;
  const caption = caps[variant];
  const activeSocials = SOCIALS.filter((s) => SOCIAL[s.key]);
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
            <a data-testid="promuovi-flyer-download" href={`${process.env.PUBLIC_URL}/locandina-mikilab.png`} download="locandina-mikilab.png"
              className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#121212] bg-[#ff6b00] rounded-full px-3 py-1.5 active:scale-95 ml-2">
              <Download className="w-3.5 h-3.5" /> {L("Locandina A5", "A5-Flyer", "A5 flyer", "Folleto A5", "Flyer A5", "پوستر A5")}
            </a>
          </div>
        </div>

        {/* Seguici */}
        {activeSocials.length > 0 && (
          <div data-testid="promuovi-follow">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#ff6b00] mb-2">{L("Seguici", "Folge uns", "Follow us", "Síguenos", "Suis-nous", "ما را دنبال کن")}</p>
            <div className="flex flex-wrap gap-2">
              {activeSocials.map(({ key, Icon, label, color }) => (
                <a key={key} data-testid={`promuovi-social-${key}`} href={SOCIAL[key]} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#121212] border border-[#2e2e2e] px-3.5 py-2 text-sm font-semibold text-white active:scale-95 hover:border-[#ff6b00]/60 transition-all">
                  <Icon className="w-4 h-4" style={{ color }} /> {label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
