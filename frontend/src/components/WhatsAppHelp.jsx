import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { siteSettingsApi } from "@/lib/api";

const WA_DEFAULT = "491601253378"; // +49 160 1253378

// Pulsante WhatsApp CONTESTUALE (solo Corsi / Assistenza / Ordini).
// context: "corsi" | "assistenza" | "ordini"
export default function WhatsAppHelp({ context = "assistenza", className = "" }) {
  const { lang } = useLang();
  const [WA_NUMBER, setWaNumber] = useState(WA_DEFAULT);
  useEffect(() => { siteSettingsApi.get().then((s) => { if (s && s.whatsapp_number) setWaNumber(s.whatsapp_number); }).catch(() => {}); }, []);
  const tri = (i, d, e) => (lang === "de" ? d : lang === "it" ? i : (e ?? i));

  const COPY = {
    corsi: {
      title: tri("Info sui corsi", "Info zu den Kursen", "Course info"),
      note: tri("Scrivimi su WhatsApp SOLO per informazioni sui corsi.", "Schreib mir auf WhatsApp NUR für Infos zu den Kursen.", "Message me on WhatsApp ONLY for course information."),
      msg: tri("Ciao Michele! Vorrei informazioni sui corsi MikiLab.", "Hallo Michele! Ich hätte gerne Infos zu den MikiLab-Kursen.", "Hi Michele! I'd like information about the MikiLab courses."),
    },
    ordini: {
      title: tri("Gestione ordini", "Bestellverwaltung", "Order management"),
      note: tri("Scrivimi su WhatsApp SOLO per la gestione degli ordini.", "Schreib mir auf WhatsApp NUR zur Bestellverwaltung.", "Message me on WhatsApp ONLY for order management."),
      msg: tri("Ciao Michele! Ho bisogno di aiuto con un ordine.", "Hallo Michele! Ich brauche Hilfe bei einer Bestellung.", "Hi Michele! I need help with an order."),
    },
    laboratorio: {
      title: tri("Domande sul laboratorio", "Fragen zum Labor", "Lab questions"),
      note: tri("Scrivimi su WhatsApp per domande tecniche sul laboratorio e sul metodo.", "Schreib mir auf WhatsApp für technische Fragen zum Labor und zur Methode.", "Message me on WhatsApp for technical questions about the lab and the method."),
      msg: tri("Ciao Michele! Ho una domanda tecnica sul laboratorio.", "Hallo Michele! Ich habe eine technische Frage zum Labor.", "Hi Michele! I have a technical question about the lab."),
    },
    assistenza: {
      title: tri("Assistenza tecnica", "Technischer Support", "Technical support"),
      note: tri("Scrivimi su WhatsApp SOLO per problemi tecnici con l'app.", "Schreib mir auf WhatsApp NUR bei technischen Problemen mit der App.", "Message me on WhatsApp ONLY for technical issues with the app."),
      msg: tri("Ciao Michele! Ho un problema tecnico con l'app MikiLab.", "Hallo Michele! Ich habe ein technisches Problem mit der MikiLab-App.", "Hi Michele! I have a technical issue with the MikiLab app."),
    },
  };
  const c = COPY[context] || COPY.assistenza;
  const href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(c.msg)}`;

  return (
    <div data-testid={`wa-help-${context}`} className={`rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 p-4 ${className}`}>
      <p className="text-sm font-bold text-[#2B303B] dark:text-[#e4eff8]">{c.title}</p>
      <p className="text-xs text-[#7E8A93] mt-0.5 mb-3">{c.note}</p>
      <a data-testid={`wa-help-btn-${context}`} href={href} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1eb356] text-white text-sm font-semibold px-4 py-2.5 rounded-xl active:scale-97 transition-all">
        <MessageCircle className="w-4 h-4" /> WhatsApp
      </a>
    </div>
  );
}
