import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, BookOpenCheck, WifiOff, Hand, ShieldCheck, Users, Headphones, Volume2, BookOpen, GraduationCap, ClipboardList, Mic, Droplets, Clock, Repeat } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { getOperators, currentOperatorId, setCurrentOperator, zoneLabel } from "@/lib/brigata";

// Guida MikiLab: didascalie chiare per la squadra + selezione rapida operatore.
// Si apre con evento window "mikilab-open-guida" (menu, Home o voce "Mickey, guida").
export default function GuidaMikiLab() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [open, setOpen] = useState(false);
  const [ops, setOps] = useState([]);
  const [opId, setOpId] = useState(currentOperatorId());

  useEffect(() => {
    const h = () => { setOps(getOperators()); setOpId(currentOperatorId()); setOpen(true); };
    window.addEventListener("mikilab-open-guida", h);
    return () => window.removeEventListener("mikilab-open-guida", h);
  }, []);

  const pick = (id) => { setOpId(id); setCurrentOperator(id); };

  const CARDS = [
    { Icon: ShieldCheck, color: "#c94f00", t: tri("Gestione Account", "Konto", "Account", "Cuenta"),
      d: tri("L'azienda fornisce l'accesso sicuro. Tu selezioni solo il tuo nome per vedere il tuo piano settimanale e le tue mansioni.",
             "Das Unternehmen stellt den sicheren Zugang. Du wählst nur deinen Namen, um Wochenplan und Aufgaben zu sehen.",
             "The company provides secure access. You just pick your name to see your weekly plan and tasks.",
             "La empresa da el acceso seguro. Tú solo eliges tu nombre para ver tu plan y tareas.") },
    { Icon: WifiOff, color: "#3B82F6", t: tri("Connessione Wi-Fi", "WLAN", "Wi-Fi", "Wi-Fi"),
      d: tri("La generazione del piano usa il Wi-Fi solo un minuto all'inizio; poi il piano è salvato sul dispositivo e in laboratorio funziona al 100% offline.",
             "Die Planerstellung nutzt WLAN nur eine Minute; danach ist der Plan gespeichert und läuft im Labor 100% offline.",
             "Plan generation uses Wi-Fi only for a minute at the start; then the plan is saved on device and works 100% offline in the lab.",
             "La generación del plan usa Wi-Fi solo un minuto; luego se guarda y funciona 100% offline.") },
    { Icon: Hand, color: "#22c55e", t: tri("Mani Libere & Farina", "Freihändig & Mehl", "Hands-Free & Flour", "Manos Libres y Harina"),
      d: tri("Lavori senza toccare lo schermo: usa l'auricolare Bluetooth con microfono per timer e cambi mansione (Lau, Rayon, Forno, Guida).",
             "Arbeite ohne den Bildschirm: Bluetooth-Headset mit Mikrofon für Timer und Aufgabenwechsel (Lau, Rayon, Ofen, Fahren).",
             "Work without touching the screen: use the Bluetooth earphone with mic for timers and role changes (Lau, Rayon, Oven, Driving).",
             "Trabaja sin tocar la pantalla: usa el auricular Bluetooth con micrófono para temporizadores y cambios de tarea.") },
  ];

  if (!open) return null;

  return createPortal(
    <div data-testid="guida-overlay" className="fixed inset-0 z-[320]" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />
      <div onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-0 bottom-0 top-10 max-w-lg mx-auto bg-[#121212] rounded-t-3xl border-t border-x border-[#2C2C2C] shadow-2xl overflow-y-auto animate-in slide-in-from-bottom duration-300">
        <div className="sticky top-0 z-10 bg-[#c94f00] text-white flex items-center justify-between px-4 py-3">
          <span className="font-display text-lg font-bold flex items-center gap-2"><BookOpenCheck className="w-5 h-5" /> {tri("Guida MikiLab", "MikiLab-Anleitung", "MikiLab Guide", "Guía MikiLab")}</span>
          <button data-testid="guida-close" onClick={() => setOpen(false)} className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center active:scale-95"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 space-y-4">
          {/* Come Funziona — istruzioni semplici d'uso */}
          <div className="rounded-2xl bg-[#161616] border border-[#c94f00]/40 p-3.5" data-testid="guida-comefunziona">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#c94f00] mb-2"><BookOpenCheck className="w-4 h-4" /> {tri("Come Funziona", "So funktioniert's", "How It Works", "Cómo Funciona", "Comment ça marche", "چطور کار می‌کند")}</p>
            <ol className="space-y-2">
              {[
                tri("Apri il menu ☰ in alto a sinistra o la barra in basso per raggiungere ogni sezione.", "Öffne das Menü ☰ oben links oder die untere Leiste, um jeden Bereich zu erreichen.", "Open the ☰ menu top-left or the bottom bar to reach any section.", "Abre el menú ☰ arriba a la izquierda o la barra inferior para ir a cualquier sección.", "Ouvre le menu ☰ en haut à gauche ou la barre du bas pour accéder à chaque section.", "منوی ☰ بالا-چپ یا نوار پایین را باز کن."),
                tri("In «Ricette» trovi tutte le schede; in «Schede di Produzione» pianifichi il lavoro del giorno.", "Unter «Rezepte» findest du alle Karten; unter «Produktionsblätter» planst du den Tag.", "In «Master Recipes» you find all cards; in «Production Sheets» you plan the day's work.", "En «Recetas» tienes todas las fichas; en «Fichas de Producción» planificas el día.", "Dans «Recettes» toutes les fiches ; dans «Fiches de Production» tu planifies la journée.", "در «دستورها» همه کارت‌ها؛ در «برگه‌های تولید» کار روز را برنامه‌ریزی کن."),
                tri("Nel Laboratorio lavori a mani libere: di' «Ehi Lab» e poi il comando (timer, dosi, guasti).", "Im Labor arbeitest du freihändig: sag «Ehi Lab» und dann den Befehl (Timer, Mengen, Störung).", "In the Lab you work hands-free: say «Ehi Lab» then the command (timer, doses, faults).", "En el Laboratorio trabajas manos libres: di «Ehi Lab» y luego el comando (timer, dosis, averías).", "Au Labo tu travailles mains libres : dis «Ehi Lab» puis la commande (minuteur, doses, pannes).", "در آزمایشگاه بدون دست کار کن: بگو «لب» و سپس فرمان."),
                tri("Dopo il primo caricamento MikiLab funziona anche senza internet, in tutto il laboratorio.", "Nach dem ersten Laden funktioniert MikiLab auch offline im ganzen Labor.", "After the first load MikiLab also works offline, throughout the lab.", "Tras la primera carga MikiLab funciona también sin internet, en todo el laboratorio.", "Après le premier chargement, MikiLab fonctionne aussi hors ligne dans tout le labo.", "پس از بارگذاری اول، میکی‌لب آفلاین هم کار می‌کند."),
              ].map((step, i) => (
                <li key={i} data-testid={`guida-step-${i}`} className="flex items-start gap-2.5">
                  <span className="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-[#c94f00] text-white text-[12px] font-extrabold">{i + 1}</span>
                  <span className="text-[13px] leading-snug text-[#C9D4DC]">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Le 4 sezioni principali */}
          <div className="rounded-2xl bg-[#161616] border border-[#c94f00]/40 p-3.5" data-testid="guida-sezioni">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#c94f00] mb-2"><BookOpen className="w-4 h-4" /> {tri("Le sezioni", "Die Bereiche", "The sections", "Las secciones", "Les sections", "بخش‌ها")}</p>
            <div className="space-y-2">
              {[
                { Icon: BookOpen, c: "#c94f00", t: tri("Ricette del Maestro", "Meister-Rezepte", "Master Recipes", "Recetas del Maestro", "Recettes du Maître", "دستورهای استاد"), d: tri("Tutte le schede con dosi, procedimento e note, pronte da seguire.", "Alle Karten mit Mengen, Ablauf und Notizen.", "All cards with doses, steps and notes, ready to follow.", "Todas las fichas con dosis, procedimiento y notas.", "Toutes les fiches avec doses, étapes et notes.", "همه کارت‌ها با مقدار و مراحل.") },
                { Icon: GraduationCap, c: "#A16207", t: tri("Scienza & Guide", "Wissen & Guides", "Science & Guides", "Ciencia y Guías", "Science & Guides", "علم و راهنما"), d: tri("Lezioni, quiz e guide per imparare i metodi passo passo.", "Lektionen, Quiz und Guides Schritt für Schritt.", "Lessons, quizzes and guides to learn the methods step by step.", "Lecciones, cuestionarios y guías paso a paso.", "Leçons, quiz et guides pas à pas.", "درس، آزمون و راهنما گام‌به‌گام.") },
                { Icon: ClipboardList, c: "#E7B23C", t: tri("Schede di Produzione", "Produktionsblätter", "Production Sheets", "Fichas de Producción", "Fiches de Production", "برگه‌های تولید"), d: tri("Il Laboratorio operativo: produzione del giorno, celle, guasti, magazzino e assistente vocale mani libere.", "Der Betriebsmodus: Tagesproduktion, Zellen, Störungen, Lager und Freihand-Assistent.", "The operative Lab: today's production, cells, faults, warehouse and hands-free voice assistant.", "El Laboratorio operativo: producción del día, cámaras, averías, almacén y asistente por voz.", "Le Labo opérationnel : production du jour, chambres, pannes, stock et assistant vocal.", "آزمایشگاه عملیاتی: تولید روز، سردخانه، خرابی، انبار و دستیار صوتی.") },
                { Icon: Users, c: "#22c55e", t: "Community", d: tri("Confrontati con altri fornai: bacheca, amici, messaggi e mappa.", "Tausch dich mit anderen Bäckern aus: Feed, Freunde, Nachrichten, Karte.", "Connect with other bakers: feed, friends, messages and map.", "Conecta con otros panaderos: muro, amigos, mensajes y mapa.", "Échange avec d'autres boulangers : fil, amis, messages, carte.", "با نانواهای دیگر در ارتباط باش.") },
              ].map((s, i) => (
                <div key={i} data-testid={`guida-sezione-${i}`} className="flex items-start gap-2.5">
                  <span className="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${s.c}22` }}><s.Icon className="w-4 h-4" style={{ color: s.c }} /></span>
                  <span className="min-w-0"><span className="block text-[13.5px] font-bold text-white leading-tight">{s.t}</span><span className="block text-[12px] leading-snug text-[#C9D4DC]">{s.d}</span></span>
                </div>
              ))}
            </div>
          </div>

          {/* Cosa sa fare l'assistente vocale nel Laboratorio */}
          <div className="rounded-2xl bg-[#161616] border border-[#c94f00]/40 p-3.5" data-testid="guida-assistente">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#c94f00] mb-2"><Mic className="w-4 h-4" /> {tri("L'assistente vocale sa fare", "Der Sprachassistent kann", "The voice assistant can", "El asistente de voz puede", "L'assistant vocal peut", "دستیار صوتی می‌تواند")}</p>
            <p className="text-[12px] text-[#9AA6AE] mb-2">{tri("Nel Laboratorio parla a mani libere: di' «Ehi Lab» e poi:", "Im Labor freihändig: sag «Ehi Lab» und dann:", "In the Lab hands-free: say «Ehi Lab» then:", "En el Laboratorio manos libres: di «Ehi Lab» y luego:", "Au Labo mains libres : dis «Ehi Lab» puis :", "در آزمایشگاه بدون دست: بگو «لب» سپس:")}</p>
            <div className="space-y-2">
              {[
                { Icon: Droplets, t: tri("Idratazione & dosi", "Hydratation & Mengen", "Hydration & doses", "Hidratación y dosis", "Hydratation & doses", "هیدراتاسیون و مقدار"), ex: tri("«2 kg di farina al 70%»", "«2 kg Mehl 70%»", "«2 kg flour at 70%»", "«2 kg de harina al 70%»", "«2 kg de farine à 70%»", "«۲ کیلو آرد ۷۰٪»") },
                { Icon: ClipboardList, t: tri("Bilanciamento ricetta", "Rezept-Balance", "Recipe balancing", "Balance de receta", "Équilibrage recette", "تعادل دستور"), ex: tri("«apri calcolo dosi / idratazione»", "«Dosisrechner öffnen»", "«open dose calc»", "«abre cálculo de dosis»", "«ouvre calcul des doses»", "«محاسبه دوز را باز کن»") },
                { Icon: Clock, t: tri("Orari lievitazione", "Gärzeiten", "Proofing schedule", "Horarios de fermentación", "Horaires de pousse", "زمان‌بندی ور آمدن"), ex: tri("«produzione di oggi / di domani»", "«Produktion heute/morgen»", "«today's / tomorrow's production»", "«producción de hoy/mañana»", "«production d'aujourd'hui/demain»", "«تولید امروز/فردا»") },
                { Icon: BookOpenCheck, t: tri("Consegne del turno", "Schichtübergabe", "Shift handover", "Relevo de turno", "Passation de poste", "تحویل شیفت"), ex: tri("«consegne del turno»", "«Schichtübergabe»", "«shift handover»", "«relevo de turno»", "«passation»", "«تحویل شیفت»") },
                { Icon: Repeat, t: tri("Ripeti l'ultima risposta", "Letzte Antwort wiederholen", "Repeat last answer", "Repetir última respuesta", "Répéter la réponse", "تکرار پاسخ"), ex: "«Ehi Lab, ripeti»" },
              ].map((s, i) => (
                <div key={i} data-testid={`guida-assist-${i}`} className="flex items-start gap-2.5">
                  <span className="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#c94f00]/15"><s.Icon className="w-4 h-4 text-[#c94f00]" /></span>
                  <span className="min-w-0"><span className="block text-[13px] font-bold text-white leading-tight">{s.t}</span><span className="block text-[12px] leading-snug text-[#8FE3B6]">{s.ex}</span></span>
                </div>
              ))}
            </div>
          </div>

          {/* Selezione rapida operatore */}
          <div className="rounded-2xl bg-[#161616] border border-[#c94f00]/40 p-3.5" data-testid="guida-operator">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#c94f00] mb-2"><Users className="w-4 h-4" /> {tri("Chi sei? Seleziona il tuo profilo", "Wer bist du?", "Who are you?", "¿Quién eres?")}</p>
            {ops.length === 0 ? (
              <p className="text-[13px] text-[#9AA6AE]">{tri("Nessun operatore configurato. Chiedi al capo di aggiungere la squadra in «Turni di Lavoro».", "Keine Bediener. Team unter «Arbeitsschichten» hinzufügen.", "No operators yet. Ask the boss to add the team in «Work shifts».", "Sin operarios. Pide al jefe añadir el equipo en «Turnos».")}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {ops.map((o) => {
                  const on = opId === o.id;
                  return (
                    <button key={o.id} data-testid={`guida-op-${o.id}`} onClick={() => pick(o.id)}
                      className={`px-3 py-2 rounded-2xl shadow-md border border-amber-900/40 text-sm font-semibold border transition-all active:scale-95 ${on ? "bg-[#c94f00] text-white border-[#c94f00]" : "bg-white/5 text-[#e4eff8] border-[#c94f00]/30 hover:border-[#c94f00]"}`}>
                      {o.name}{o.zone ? <span className="opacity-70"> · {zoneLabel(o.zone, lang)}</span> : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Didascalie squadra */}
          {CARDS.map((c, i) => (
            <div key={i} data-testid={`guida-card-${i}`} className="rounded-2xl bg-[#161616] border border-[#2C2C2C] p-3.5">
              <p className="flex items-center gap-2 font-display text-base font-bold text-white mb-1"><c.Icon className="w-5 h-5" style={{ color: c.color }} /> {c.t}</p>
              <p className="text-[13px] leading-snug text-[#C9D4DC]">{c.d}</p>
            </div>
          ))}

          {/* Voce in ambiente rumoroso */}
          <div className="rounded-2xl bg-[#161616] border border-[#2C2C2C] p-3.5" data-testid="guida-voice">
            <p className="flex items-center gap-2 font-display text-base font-bold text-white mb-1"><Volume2 className="w-5 h-5 text-[#c94f00]" /> {tri("Voce chiara nel rumore", "Klare Stimme im Lärm", "Clear voice in noise", "Voz clara en ruido")}</p>
            <p className="text-[13px] leading-snug text-[#C9D4DC]">{tri("Mickey Lab e Momi parlano con frasi brevi (max 8-10 parole) per farsi capire sopra le impastatrici. Di' «Mickey, chiama Marco» per parlare con un collega in cuffia.",
              "Mickey Lab und Momi sprechen in kurzen Sätzen (max. 8-10 Wörter). Sag «Mickey, ruf Marco».",
              "Mickey Lab and Momi speak in short phrases (max 8-10 words). Say «Mickey, call Marco».",
              "Mickey Lab y Momi hablan con frases cortas (máx. 8-10 palabras). Di «Mickey, llama a Marco».")}</p>
            <p className="text-[11px] text-[#7E8A93] mt-1">{tri("Nota: chiamata tra cuffie e cancellazione rumore avanzata sono in DEMO in questa versione web.", "Hinweis: Anruf zwischen Headsets ist DEMO.", "Note: headset-to-headset call is DEMO in this web version.", "Nota: la llamada entre auriculares es DEMO.")}</p>
          </div>

          {/* Auricolare */}
          <div className="rounded-2xl bg-[#161616] border border-[#2C2C2C] p-3.5" data-testid="guida-earphone">
            <p className="flex items-center gap-2 font-display text-base font-bold text-white mb-1"><Headphones className="w-5 h-5 text-[#3B82F6]" /> {tri("Il tuo auricolare", "Dein Headset", "Your earphone", "Tu auricular")}</p>
            <p className="text-[13px] leading-snug text-[#C9D4DC]">{tri("Il capo associa il tuo auricolare Bluetooth in «Turni di Lavoro». Al cambio mansione (es. Guida alle 05:00) ricevi solo le notifiche del tuo reparto.",
              "Der Chef verbindet dein Headset in «Arbeitsschichten».",
              "The boss pairs your Bluetooth earphone in «Work shifts».",
              "El jefe asocia tu auricular en «Turnos».")}</p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
