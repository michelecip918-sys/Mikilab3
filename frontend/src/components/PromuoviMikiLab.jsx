import { useState } from "react";
import { Megaphone, Share2, Copy, Download, Instagram, Facebook, Youtube, MessageCircle, Music2, Check } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { SOCIAL, SITE_URL } from "@/config/social";

const CAPTIONS = {
  it: "🥖 Ho scoperto MikiLab: il laboratorio del fornaio 100% GRATIS! Ricette col metodo di Michele, piani di produzione con l'IA, food cost e diagnosi dell'impasto. Pane, pizza e pasticceria in un'unica app 👉 " + SITE_URL + " #MikiLab #panefattoincasa #lievitomadre #panificazione #homebaking",
  en: "🥖 Just found MikiLab — the baker's lab, 100% FREE! Recipes, AI production plans, food cost & dough diagnosis. Bread, pizza & pastry in one app 👉 " + SITE_URL + " #MikiLab #homebaking #sourdough #breadmaking",
  de: "🥖 MikiLab entdeckt — die Bäcker-Werkstatt, 100% KOSTENLOS! Rezepte, KI-Produktionspläne, Food-Cost & Teig-Diagnose. Brot, Pizza & Gebäck in einer App 👉 " + SITE_URL + " #MikiLab #Brotbacken #Sauerteig",
  es: "🥖 Descubrí MikiLab — el laboratorio del panadero, ¡100% GRATIS! Recetas, planes de producción con IA, food cost y diagnóstico de la masa. Pan, pizza y pastelería en una app 👉 " + SITE_URL + " #MikiLab #pancasero #masamadre",
  fr: "🥖 J'ai découvert MikiLab — l'atelier du boulanger, 100% GRATUIT ! Recettes, plans de production IA, food cost et diagnostic de la pâte 👉 " + SITE_URL + " #MikiLab #painmaison #levain",
  fa: "🥖 میکی‌لب را کشف کردم — کارگاه نانوا، ۱۰۰٪ رایگان! دستورها، برنامهٔ تولید با هوش مصنوعی و تشخیص خمیر 👉 " + SITE_URL + " #MikiLab",
};

const SOCIALS = [
  { key: "instagram", Icon: Instagram, label: "Instagram", color: "#E1306C" },
  { key: "facebook", Icon: Facebook, label: "Facebook", color: "#1877F2" },
  { key: "tiktok", Icon: Music2, label: "TikTok", color: "#ffffff" },
  { key: "youtube", Icon: Youtube, label: "YouTube", color: "#FF0000" },
  { key: "whatsapp", Icon: MessageCircle, label: "WhatsApp", color: "#25D366" },
];

export default function PromuoviMikiLab() {
  const { lang } = useLang();
  const L = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [copied, setCopied] = useState(false);
  const caption = CAPTIONS[lang] || CAPTIONS.it;
  const activeSocials = SOCIALS.filter((s) => SOCIAL[s.key]);

  const invite = async () => {
    const data = { title: "MikiLab", text: L("Prova MikiLab, il laboratorio del fornaio 100% gratis!", "Probier MikiLab, die kostenlose Bäcker-Werkstatt!", "Try MikiLab, the free baker's lab!", "¡Prueba MikiLab, el laboratorio del panadero gratis!", "Essaie MikiLab, l'atelier du boulanger gratuit !", "میکی‌لب رایگان را امتحان کن!"), url: SITE_URL };
    try { if (navigator.share) { await navigator.share(data); return; } } catch { return; }
    try { await navigator.clipboard.writeText(SITE_URL); toast.success(L("Link copiato!", "Link kopiert!", "Link copied!", "¡Enlace copiado!", "Lien copié !", "لینک کپی شد!")); } catch { /* */ }
  };
  const copyCaption = async () => {
    try { await navigator.clipboard.writeText(caption); setCopied(true); setTimeout(() => setCopied(false), 2000); toast.success(L("Post copiato! Incollalo su Instagram/Facebook", "Beitrag kopiert!", "Post copied! Paste it on Instagram/Facebook", "¡Publicación copiada!", "Post copié !", "پست کپی شد!")); }
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
          <p data-testid="promuovi-caption" className="text-[12.5px] text-[#E0D5CF] leading-snug whitespace-pre-line mb-2.5">{caption}</p>
          <button data-testid="promuovi-copy-caption" onClick={copyCaption}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#ff6b00]/40 text-white font-semibold py-2.5 text-sm active:scale-95">
            {copied ? <Check className="w-4 h-4 text-[#2e8b6f]" /> : <Copy className="w-4 h-4 text-[#ff6b00]" />} {L("Copia il post", "Beitrag kopieren", "Copy caption", "Copiar", "Copier", "کپی کپشن")}
          </button>
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
