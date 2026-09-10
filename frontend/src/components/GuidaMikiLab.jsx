import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, BookOpen, ShieldCheck, Users, CalendarDays, Zap, Wrench, Sparkles, Factory, KeyRound } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

const PUB = process.env.PUBLIC_URL;

// GUIDA MIKILAB — spiega in parole semplici tutto ciò che MikiLab e Sitor sanno fare,
// così che chiunque (Capo o operaio) capisca. IT primario + EN; stampa/PDF integrata.
const isIT = (l) => String(l || "it").toLowerCase().startsWith("it");

const GUIDE = [
  {
    id: "intro", Icon: BookOpen, accent: "#EAB308",
    it: { t: "Cos'è MikiLab e chi è Sitor",
      p: "MikiLab Pro è il sistema operativo del tuo laboratorio: panificio, pizzeria o pasticceria. Sitor è l'intelligenza più potente al mondo dell'Arte Bianca (gira su Claude Opus 4.8): è al servizio del Capo e guida ogni operaio. Il Capo comanda, Sitor esegue, pianifica, sorveglia e insegna.",
      b: ["Un'unica app continua, senza burocrazia inutile.",
          "Il Capo governa tutto; gli operai vedono solo la Produzione.",
          "Sitor parla, ascolta, legge foto ed email e genera la produzione."] },
    en: { t: "What MikiLab is and who Sitor is",
      p: "MikiLab Pro is your lab's operating system: bakery, pizzeria or pastry shop. Sitor is the most powerful White-Art intelligence in the world (runs on Claude Opus 4.8): at the Capo's service and guiding every operator. The Capo commands, Sitor executes, plans, supervises and teaches.",
      b: ["One continuous app, no useless bureaucracy.",
          "The Capo runs everything; operators only see Production.",
          "Sitor talks, listens, reads photos and emails, and generates production."] },
  },
  {
    id: "accessi", Icon: KeyRound, accent: "#FF6B00",
    it: { t: "Accessi · Capo e Operai",
      p: "Un unico tastierino d'ingresso decide dove vai, in base al PIN.",
      b: ["PIN Capo (6 cifre) + login: apre l'intera plancia di comando.",
          "PIN Sezione Operai (scelto dal Capo) e PIN personali (4 cifre): aprono SOLO la Produzione, la zona Capo resta invisibile.",
          "PIN personale = timbratura tracciabile e livello (Novizio/Esperto/Maestro) su misura per Sitor.",
          "Volto della squadra: entrata con riconoscimento facciale sui tablet di reparto."] },
    en: { t: "Access · Capo and Operators",
      p: "A single entry keypad decides where you go, based on the PIN.",
      b: ["Capo PIN (6 digits) + login: opens the full command console.",
          "Operator Section PIN (chosen by the Capo) and personal PINs (4 digits): open ONLY Production; the Capo area stays invisible.",
          "Personal PIN = tracked clock-in and skill level (Novice/Expert/Master) tailored for Sitor.",
          "Team faces: face-recognition login on department tablets."] },
  },
  {
    id: "piano", Icon: CalendarDays, accent: "#FF9D42",
    it: { t: "1 · Piano Settimanale & Produzione",
      p: "Dai un punto di partenza e Sitor completa il piano del giorno e della settimana.",
      b: ["Sitor · Piano del Giorno: sequenza di produzione ottimale con più opzioni.",
          "Piano Settimanale: per ogni giorno scegli prodotti, pezzi e grammi; stampa PDF e archivio.",
          "Piano di Produzione AI: detti ordini e vincoli, l'IA costruisce il piano completo.",
          "Piano a Ritroso: parti dall'ora di consegna, MikiLab calcola impasto, lievitazione e cottura.",
          "Smart Planner con validazione vocale e Timeline di Turno (lotti, infornate, SOS)."] },
    en: { t: "1 · Weekly Plan & Production",
      p: "Give a starting point and Sitor completes the day's and week's plan.",
      b: ["Sitor · Day Plan: optimal production sequence with multiple options.",
          "Weekly Plan: per day pick products, pieces and grams; print PDF and archive.",
          "AI Production Plan: dictate orders and constraints, the AI builds the full plan.",
          "Backward Plan: start from delivery time, MikiLab computes dough, proof and bake.",
          "Smart Planner with voice validation and Shift Timeline (batches, bakes, SOS)."] },
  },
  {
    id: "ordini", Icon: Zap, accent: "#FFB800",
    it: { t: "2 · Ordini Extra & B2B",
      p: "Ordini dell'ultimo minuto: Sitor rigenera il piano all'istante.",
      b: ["Ordini Extra: aggiungi richieste e l'IA ricalcola tutto.",
          "Consegne & Eventi (Pasticceria): torte su commessa, matrimoni ed eventi con promemoria.",
          "Ordini B2B & E-commerce: gli ordini digitali diventano kg d'impasto per lo Smart Planner, con previsione meteo/festività."] },
    en: { t: "2 · Extra Orders & B2B",
      p: "Last-minute orders: Sitor regenerates the plan instantly.",
      b: ["Extra Orders: add requests and the AI recomputes everything.",
          "Deliveries & Events (Pastry): made-to-order cakes, weddings and events with reminders.",
          "B2B Orders & E-commerce: digital orders become kg of dough for the Smart Planner, with weather/holiday forecast."] },
  },
  {
    id: "squadra", Icon: Users, accent: "#FF9D42",
    it: { t: "3 · Ruoli & Turni",
      p: "Chi lavora, dove e quando — reparto per reparto.",
      b: ["Assegnazione Reparti: Panificio, Pasticceria, Pizzeria, Laugen, Banco, con più operai e mansioni distinte.",
          "Riepilogo Squadra a voce di Sitor all'apertura del turno.",
          "Turni ricorrenti (squadre-tipo) applicabili con un tocco.",
          "Volti della squadra e Rapporti di fine turno (pezzi, scarti, problemi, pulizia)."] },
    en: { t: "3 · Roles & Shifts",
      p: "Who works, where and when — department by department.",
      b: ["Department Assignment: Bakery, Pastry, Pizza, Laugen, Counter, with multiple operators and distinct tasks.",
          "Team roll-call voiced by Sitor at shift start.",
          "Recurring shifts (team templates) applied with one tap.",
          "Team faces and End-of-Shift reports (pieces, waste, issues, cleaning)."] },
  },
  {
    id: "strumenti", Icon: Wrench, accent: "#64748B",
    it: { t: "4 · Strumenti & Integrazioni",
      p: "Tutto ciò che serve per produrre, controllare e risparmiare.",
      b: ["Ricettario Master protetto, editor termico (RPM, idratazione, rampe) e forgia immagini.",
          "Magazzino, Silos con calo peso e micro-ordini automatici, Food Cost e margini.",
          "Controllo Qualità Ottico (AI Vision) all'uscita del forno; Gemello Digitale 3D.",
          "Carbon Footprint & energia, Celle adattive, Flotta AGV, Packaging sincronizzato.",
          "Sicurezza: PIN Sezione Operai, PIN personali con livello, registro accessi, scadenza cancello."] },
    en: { t: "4 · Tools & Integrations",
      p: "Everything to produce, control and save.",
      b: ["Protected Master recipes, thermal editor (RPM, hydration, ramps) and image forge.",
          "Warehouse, Silos with weight-drop and auto micro-orders, Food Cost and margins.",
          "Optical Quality Control (AI Vision) at oven exit; 3D Digital Twin.",
          "Carbon footprint & energy, adaptive proofing cells, AGV fleet, synced packaging.",
          "Security: Operator Section PIN, personal PINs with level, access log, gate expiry."] },
  },
  {
    id: "sitor", Icon: Sparkles, accent: "#EAB308",
    it: { t: "5 · Sala Sitor — il punto d'incontro",
      p: "L'unico luogo dove il Capo incontra Sitor: scrivi, detta, allega foto o email, dai ordini e ricevi tutto.",
      b: ["Ordine → Produzione: Sitor trasforma le tue parole in compiti pronti.",
          "Domanda → Risposta: chiedi qualsiasi cosa, Sitor risponde a voce.",
          "Report di turno parlato con MikiScore.",
          "Qui arrivano le proposte di modifica degli operai: le grandi le approvi tu, le piccole Sitor le applica e ti avvisa."] },
    en: { t: "5 · Sitor Hall — the meeting point",
      p: "The one place where the Capo meets Sitor: write, dictate, attach photos or emails, give orders and receive everything.",
      b: ["Order → Production: Sitor turns your words into ready tasks.",
          "Question → Answer: ask anything, Sitor answers by voice.",
          "Spoken shift report with MikiScore.",
          "Operators' change proposals land here: you approve the big ones, Sitor applies the small ones and notifies you."] },
  },
  {
    id: "produzione", Icon: Factory, accent: "#FF6B00",
    it: { t: "La Produzione (operai) — guidata da Sitor",
      p: "Ogni operaio vede solo il suo compito del giorno e ha Sitor come maestro personale.",
      b: ["Sitor Maestro: guida passo-passo adattata al livello (Novizio/Esperto/Maestro), con o senza macchinari.",
          "Timbratura personale, SOS impasto, foto-diagnosi e chiusura turno.",
          "L'operaio può proporre una modifica al piano: Sitor decide o la manda al Capo.",
          "Sitor sorveglia ogni fase, dall'inizio alla fine, perché tutto fili liscio."] },
    en: { t: "Production (operators) — guided by Sitor",
      p: "Each operator sees only their task of the day and has Sitor as a personal master.",
      b: ["Sitor Master: step-by-step guidance adapted to level (Novice/Expert/Master), with or without machines.",
          "Personal clock-in, dough SOS, photo diagnosis and shift closing.",
          "Operators can propose a plan change: Sitor decides or sends it to the Capo.",
          "Sitor watches every phase, start to finish, so everything runs smoothly."] },
  },
];

export default function GuidaMikiLab({ open, onClose }) {
  const { lang } = useLang();
  const it = isIT(lang);
  const T = (o) => (it ? o.it : o.en);

  const downloadPdf = () => {
    const rows = GUIDE.map((s) => {
      const c = T(s);
      const lis = c.b.map((x) => `<li>${x}</li>`).join("");
      return `<section><h2 style="color:${s.accent}">${c.t}</h2><p>${c.p}</p><ul>${lis}</ul></section>`;
    }).join("");
    const html = `<!doctype html><html lang="${it ? "it" : "en"}"><head><meta charset="utf-8"><title>Guida MikiLab Pro</title>
      <style>
        *{box-sizing:border-box} body{font-family:Georgia,'Times New Roman',serif;color:#111;max-width:820px;margin:0 auto;padding:36px 30px;line-height:1.5}
        .head{display:flex;align-items:center;gap:14px;border-bottom:3px solid #FF6B00;padding-bottom:14px;margin-bottom:22px}
        .head img{width:56px;height:56px;border-radius:12px;object-fit:cover}
        h1{font-size:26px;margin:0;letter-spacing:.5px} .sub{color:#777;font-size:13px;margin-top:2px}
        section{margin:0 0 20px;page-break-inside:avoid} h2{font-size:17px;margin:0 0 6px} p{margin:0 0 8px;color:#333}
        ul{margin:0;padding-left:20px} li{margin:3px 0;color:#222}
        .foot{margin-top:26px;border-top:1px solid #ddd;padding-top:10px;color:#999;font-size:11px;text-align:center}
      </style></head><body>
      <div class="head"><img src="${window.location.origin}${PUB}/logo-emblem.png"/><div><h1>MIKILAB PRO</h1><div class="sub">${it ? "Guida completa · Cosa puoi fare con MikiLab e Sitor" : "Complete guide · What you can do with MikiLab and Sitor"}</div></div></div>
      ${rows}
      <div class="foot">MikiLab Pro & Sitor — ${new Date().toLocaleDateString(it ? "it-IT" : "en-GB")}</div>
      </body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html); w.document.close(); w.focus();
    setTimeout(() => w.print(), 400);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          data-testid="guida-mikilab" className="fixed inset-0 z-[200] bg-[#030712]/95 backdrop-blur-md overflow-y-auto">
          <div className="min-h-screen px-4 py-6 sm:px-6 sm:py-10 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6 sticky top-0 z-10 bg-[#030712]/90 backdrop-blur py-2 -mx-2 px-2">
              <img src={`${PUB}/logo-emblem.png`} alt="MikiLab" className="w-11 h-11 rounded-xl object-cover border border-[#FF6B00]/50" />
              <div className="flex-1 min-w-0">
                <h1 className="font-cyber text-lg sm:text-xl font-black text-white uppercase tracking-wider">{it ? "Guida MikiLab" : "MikiLab Guide"}</h1>
                <p className="text-[11px] text-[#94A3B8]">{it ? "Tutto ciò che puoi fare con MikiLab e Sitor" : "Everything you can do with MikiLab and Sitor"}</p>
              </div>
              <button data-testid="guida-pdf-btn" onClick={downloadPdf} title="PDF"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FF6B00]/15 border border-[#FF6B00]/45 text-[#FF9D42] font-bold text-xs active:scale-95 transition-all">
                <Download className="w-4 h-4" /> <span className="hidden sm:inline">{it ? "Scarica PDF" : "Download PDF"}</span>
              </button>
              <button data-testid="guida-close-btn" onClick={onClose}
                className="w-9 h-9 rounded-lg bg-[#0C1019] border border-[#1e293b] text-white flex items-center justify-center active:scale-95"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3.5">
              {GUIDE.map((s, i) => {
                const c = T(s); const I = s.Icon;
                return (
                  <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    data-testid={`guida-section-${s.id}`} className="rounded-2xl border border-[#1e293b] bg-[#0C1019]/60 p-4 sm:p-5">
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.accent}18`, border: `1px solid ${s.accent}55` }}>
                        <I className="w-4.5 h-4.5" style={{ color: s.accent }} />
                      </span>
                      <h2 className="font-cyber text-sm sm:text-base font-black text-white uppercase tracking-wide">{c.t}</h2>
                    </div>
                    <p className="text-[13px] text-[#CBD5E1] leading-snug mb-2.5">{c.p}</p>
                    <ul className="space-y-1.5">
                      {c.b.map((x, k) => (
                        <li key={k} className="flex gap-2 text-[13px] text-[#94A3B8] leading-snug">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.accent }} />
                          <span>{x}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
            </div>
            <button data-testid="guida-bottom-close" onClick={onClose}
              className="mt-6 w-full py-3 rounded-xl bg-[#0C1019] border border-[#1e293b] text-[#94A3B8] font-bold text-sm active:scale-95">
              {it ? "Chiudi la guida" : "Close the guide"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
