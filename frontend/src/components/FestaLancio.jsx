import { useState, useMemo, useRef } from "react";
import { X, Scissors, Share2, ChevronRight, Sparkles, Award } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { useBackClose } from "@/lib/backNav";
import { playTTS } from "@/lib/tts";
import { toast } from "sonner";

// V87 — LA FESTA DEL 16 OTTOBRE (Giornata mondiale del pane): la sorpresa per tutti quelli che
// Michele invita quel giorno. Si apre da sola il 16 ottobre 2026 alla prima visita (una volta sola);
// anteprima con mikilab.de/?festa=1. Quattro momenti: il taglio del nastro, Sitor che saluta a voce,
// il certificato del primo giorno con il proprio nome, il gioco del pane con il titolo da condividere.
// Tutto nel telefono: il nome non viene salvato né inviato, il certificato nasce nel browser.

const FESTA = new Date(2026, 9, 16, 0, 0, 0, 0);
export function festaIsToday(now = Date.now()) { return now >= FESTA.getTime() && now < FESTA.getTime() + 86400000; }
const PUB = process.env.PUBLIC_URL;

const QUIZ = [
  { q: { it: "Perché si fanno i tagli sul pane prima di infornare?", de: "Warum schneidet man Brot vor dem Backen ein?", en: "Why do we score bread before baking?" },
    a: [{ it: "Per bellezza", de: "Nur fürs Aussehen", en: "Just for looks" }, { it: "Per far uscire il vapore dove decido io", de: "Damit der Dampf dort austritt, wo ich will", en: "So steam escapes where I decide" }, { it: "Per farlo cuocere prima", de: "Damit es schneller backt", en: "So it bakes faster" }], ok: 1 },
  { q: { it: "Il lievito madre ha fame. Cosa fai?", de: "Der Sauerteig hat Hunger. Was tust du?", en: "The starter is hungry. What do you do?" },
    a: [{ it: "Gli do farina e acqua nuove", de: "Ich gebe ihm neues Mehl und Wasser", en: "I give it fresh flour and water" }, { it: "Lo metto in forno", de: "Ich stelle ihn in den Ofen", en: "I put it in the oven" }, { it: "Aggiungo lievito di birra", de: "Ich gebe Backhefe dazu", en: "I add baker's yeast" }], ok: 0 },
  { q: { it: "Premi l'impasto con un dito: torna su piano e resta una piccola fossetta.", de: "Du drückst den Teig mit dem Finger: er kommt langsam zurück, eine kleine Delle bleibt.", en: "You poke the dough: it springs back slowly, a small dimple remains." },
    a: [{ it: "Aspetta ancora", de: "Noch warten", en: "Wait more" }, { it: "È andato oltre", de: "Er ist übergegangen", en: "It's over-proofed" }, { it: "È pronto: inforna", de: "Fertig: ab in den Ofen", en: "Ready: bake it" }], ok: 2 },
  { q: { it: "Da dove viene il pane di Matera?", de: "Woher kommt das Brot von Matera?", en: "Where does Matera bread come from?" },
    a: [{ it: "Toscana", de: "Toskana", en: "Tuscany" }, { it: "Basilicata", de: "Basilikata", en: "Basilicata" }, { it: "Sicilia", de: "Sizilien", en: "Sicily" }], ok: 1 },
  { q: { it: "Il pane è cotto quando, battendo sul fondo…", de: "Das Brot ist fertig, wenn es beim Klopfen auf den Boden…", en: "Bread is done when, knocking on the base, it…" },
    a: [{ it: "…suona cavo", de: "…hohl klingt", en: "…sounds hollow" }, { it: "…non fa rumore", de: "…keinen Ton macht", en: "…makes no sound" }, { it: "…suona sordo", de: "…dumpf klingt", en: "…sounds dull" }], ok: 0 },
  { q: { it: "La Brezel è bruna e lucida grazie a…", de: "Die Brezel ist braun und glänzend dank…", en: "The pretzel is brown and glossy thanks to…" },
    a: [{ it: "…l'uovo", de: "…Ei", en: "…egg" }, { it: "…lo zucchero", de: "…Zucker", en: "…sugar" }, { it: "…la liscivia", de: "…Lauge", en: "…lye" }], ok: 2 },
];

export default function FestaLancio({ onClose, onNav }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => o[lang] || o.it;
  useBackClose(true, onClose);
  const [step, setStep] = useState(0); // 0 nastro, 1 benvenuto, 2 certificato, 3 gioco, 4 fine
  const [cut, setCut] = useState(false);
  const [name, setName] = useState("");
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const certRef = useRef(null);
  const flakes = useMemo(() => Array.from({ length: 40 }, (_, i) => ({ l: (i * 29) % 100, d: (i % 9) * 0.35, s: 5 + (i % 6) * 2, t: 5 + (i % 5) })), []);

  const cutRibbon = () => {
    setCut(true);
    const msg = tri("Benvenuto nella cucina di MikiLab. Oggi è la Giornata mondiale del pane, e il forno è acceso per te.", "Willkommen in der Küche von MikiLab. Heute ist Welttag des Brotes, und der Ofen ist für dich an.", "Welcome to MikiLab's kitchen. Today is World Bread Day, and the oven is on for you.");
    try { playTTS(msg, { lang }); } catch { /* */ }
    setTimeout(() => setStep(1), 1400);
  };

  const shareCert = async () => {
    try {
      const svg = certRef.current; if (!svg) return;
      const xml = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      const u = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = u; });
      const c = document.createElement("canvas"); c.width = 1080; c.height = 1080; c.getContext("2d").drawImage(img, 0, 0, 1080, 1080);
      URL.revokeObjectURL(u);
      const blob = await new Promise((res) => c.toBlob(res, "image/png"));
      const file = new File([blob], "mikilab-primo-giorno.png", { type: "image/png" });
      const text = tri("Ero nella cucina di MikiLab il primo giorno. mikilab.de", "Ich war am ersten Tag in der Küche von MikiLab. mikilab.de", "I was in MikiLab's kitchen on day one. mikilab.de");
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text, title: "MikiLab" }); return; }
      const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch { toast.error(tri("Non sono riuscito a creare il certificato.", "Zertifikat konnte nicht erstellt werden.", "Couldn't create the certificate.")); }
  };

  const answer = (i) => {
    if (picked != null) return;
    setPicked(i);
    if (i === QUIZ[qi].ok) setScore((s) => s + 1);
    setTimeout(() => { setPicked(null); if (qi + 1 < QUIZ.length) setQi(qi + 1); else setStep(4); }, 900);
  };
  const title = score >= 6 ? tri("Maestro fornaio", "Bäckermeister", "Master baker") : score >= 4 ? tri("Fornaio", "Bäcker", "Baker") : score >= 2 ? tri("Apprendista", "Lehrling", "Apprentice") : tri("Cliente affezionato", "Stammkunde", "Loyal customer");
  const shareScore = async () => {
    const text = tri(`Il gioco del pane di MikiLab: ${score}/${QUIZ.length}, sono ${title}. Prova tu: mikilab.de/?festa=1`, `Das Brotspiel von MikiLab: ${score}/${QUIZ.length}, ich bin ${title}. Probier du: mikilab.de/?festa=1`, `MikiLab's bread game: ${score}/${QUIZ.length}, I'm a ${title}. Your turn: mikilab.de/?festa=1`);
    try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); toast.success(tri("Copiato.", "Kopiert.", "Copied.")); } } catch { /* */ }
  };
  const dateTxt = tri("16 ottobre 2026", "16. Oktober 2026", "16 October 2026");

  return (
    <div data-testid="festa" role="dialog" aria-modal="true" className="fixed inset-0 z-[95] flex items-center justify-center p-3 sm:p-4 bg-[#1F2124]/92 backdrop-blur-sm overflow-hidden">
      <style>{`
        @keyframes fe-flake{0%{transform:translateY(-20px) rotate(0)}100%{transform:translateY(105vh) rotate(360deg)}}
        .fe-flake{position:absolute;top:-20px;border-radius:50%;background:#F6F1E7;opacity:.85;animation:fe-flake linear infinite}
        .fe-ribbon{transition:transform .9s cubic-bezier(.2,.8,.2,1)}
        .fe-cut .fe-l{transform:translateX(-70%) rotate(-25deg)}.fe-cut .fe-r{transform:translateX(70%) rotate(25deg)}
        @media (prefers-reduced-motion:reduce){.fe-flake{animation:none}.fe-ribbon{transition:none}}
      `}</style>
      {cut && <div className="pointer-events-none absolute inset-0" aria-hidden>{flakes.map((f, i) => <span key={i} className="fe-flake" style={{ left: `${f.l}%`, width: f.s, height: f.s, animationDelay: `${f.d}s`, animationDuration: `${f.t}s` }} />)}</div>}
      <div className="relative w-full max-w-md rounded-3xl border border-[#E9A23B]/50 bg-[#2A2D31] text-[#F6F1E7] shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <button data-testid="festa-close" onClick={onClose} aria-label={tri("Chiudi", "Schließen", "Close")} className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 active:scale-95"><X className="w-5 h-5" /></button>
        <p className="font-mono-data text-[10px] tracking-[0.3em] uppercase text-[#E9A23B]">{tri("Giornata mondiale del pane", "Welttag des Brotes", "World Bread Day")} · {dateTxt}</p>

        {step === 0 && (
          <div data-testid="festa-nastro">
            <h2 className="font-display text-2xl sm:text-3xl font-black leading-tight mt-1">{tri("Oggi MikiLab si accende.", "Heute geht MikiLab an.", "Today MikiLab lights up.")}</h2>
            <p className="text-sm text-[#F6F1E7]/80 mt-2">{tri("Il ricettario gratuito di Michele apre le porte a tutti. Il primo taglio lo fai tu.", "Micheles kostenloses Rezeptbuch öffnet allen die Türen. Den ersten Schnitt machst du.", "Michele's free recipe book opens its doors to everyone. You make the first cut.")}</p>
            <div className={`relative h-28 my-5 overflow-hidden ${cut ? "fe-cut" : ""}`} aria-hidden>
              <div className="fe-ribbon fe-l absolute left-0 top-1/2 -translate-y-1/2 w-1/2 h-10 bg-[#A4472D] shadow-lg" />
              <div className="fe-ribbon fe-r absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-10 bg-[#A4472D] shadow-lg" />
              {!cut && <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-[#E9A23B] flex items-center justify-center"><Scissors className="w-7 h-7 text-[#1F2124]" /></div>}
            </div>
            <button data-testid="festa-cut" onClick={cutRibbon} disabled={cut} className="w-full px-4 py-3 rounded-xl bg-[#E9A23B] text-[#1F2124] font-black text-base active:scale-95 disabled:opacity-60">{cut ? tri("Tagliato!", "Geschnitten!", "Cut!") : tri("Taglia il nastro", "Band durchschneiden", "Cut the ribbon")}</button>
          </div>
        )}

        {step === 1 && (
          <div data-testid="festa-benvenuto">
            <div className="flex items-center gap-3 mt-2">
              <img src={`${PUB}/sitor_official.webp`} alt={tri("Avatar IA di Michele (Sitor)", "KI-Avatar von Michele (Sitor)", "AI avatar of Michele (Sitor)")} className="w-16 h-16 rounded-2xl object-cover object-top border-2 border-[#E9A23B]/60" />
              <h2 className="font-display text-2xl font-black leading-tight">{tri("Benvenuto nella cucina di MikiLab.", "Willkommen in der Küche von MikiLab.", "Welcome to MikiLab's kitchen.")}</h2>
            </div>
            <p className="text-sm text-[#F6F1E7]/85 mt-3">{tri("Sono Sitor, l'avatar IA di Michele, panettiere a Stoccarda. Da oggi le sue ricette di pane, pizza, focacce e panettoni sono di tutti, gratis, spiegate passo per passo. Ti ho preparato due regali.", "Ich bin Sitor, Micheles KI-Avatar, Bäcker in Stuttgart. Ab heute gehören seine Rezepte für Brot, Pizza, Focaccia und Panettone allen, kostenlos, Schritt für Schritt erklärt. Ich habe zwei Geschenke für dich.", "I'm Sitor, the AI avatar of Michele, a baker in Stuttgart. From today his recipes for bread, pizza, focaccia and panettone belong to everyone, free, explained step by step. I have two gifts for you.")}</p>
            <button onClick={() => setStep(2)} className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#E9A23B] text-[#1F2124] font-black active:scale-95">{tri("Il primo regalo", "Das erste Geschenk", "The first gift")}<ChevronRight className="w-4 h-4" /></button>
          </div>
        )}

        {step === 2 && (
          <div data-testid="festa-cert">
            <h2 className="font-display text-xl font-black leading-tight mt-1 flex items-center gap-2"><Award className="w-5 h-5 text-[#E9A23B]" />{tri("Il certificato del primo giorno", "Die Urkunde des ersten Tages", "The first-day certificate")}</h2>
            <p className="text-[13px] text-[#F6F1E7]/80 mt-1">{tri("Chi c'era il primo giorno, c'era. Scrivi il tuo soprannome (resta nel tuo telefono) e portati via il ricordo.", "Wer am ersten Tag da war, war da. Schreib deinen Spitznamen (bleibt auf deinem Handy) und nimm die Erinnerung mit.", "Those who were there on day one, were there. Write your nickname (it stays on your phone) and take the memory with you.")}</p>
            <input data-testid="festa-name" value={name} onChange={(e) => setName(e.target.value.slice(0, 28))} placeholder={tri("Il tuo soprannome", "Dein Spitzname", "Your nickname")} className="mt-3 w-full rounded-xl border border-white/20 bg-[#1F2124] px-3 py-2 text-sm text-[#F6F1E7]" />
            <svg ref={certRef} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" className="w-full rounded-xl mt-3 border border-white/10" role="img" aria-label="certificato">
              <rect width="1080" height="1080" fill="#F6F1E7" />
              <rect x="40" y="40" width="1000" height="1000" rx="30" fill="none" stroke="#A15621" strokeWidth="8" />
              <rect x="62" y="62" width="956" height="956" rx="20" fill="none" stroke="#E9A23B" strokeWidth="2" strokeDasharray="8 10" />
              <text x="540" y="170" textAnchor="middle" fontFamily="Playfair Display, Georgia, serif" fontSize="30" fill="#597362" letterSpacing="8">{tri("GIORNATA MONDIALE DEL PANE", "WELTTAG DES BROTES", "WORLD BREAD DAY")}</text>
              <text x="540" y="215" textAnchor="middle" fontFamily="Manrope, Arial, sans-serif" fontSize="24" fill="#5B5F66">{dateTxt}</text>
              <text x="540" y="440" textAnchor="middle" fontFamily="Playfair Display, Georgia, serif" fontSize={name.length > 16 ? "72" : "100"} fontWeight="900" fill="#2B2E33">{name || tri("Il tuo nome", "Dein Name", "Your name")}</text>
              <text x="540" y="530" textAnchor="middle" fontFamily="Manrope, Arial, sans-serif" fontSize="30" fill="#2B2E33">{tri("era nella cucina di MikiLab", "war in der Küche von MikiLab", "was in MikiLab's kitchen")}</text>
              <text x="540" y="575" textAnchor="middle" fontFamily="Manrope, Arial, sans-serif" fontSize="30" fill="#2B2E33">{tri("il primo giorno.", "am ersten Tag.", "on day one.")}</text>
              <text x="540" y="720" textAnchor="middle" fontFamily="Manrope, Arial, sans-serif" fontSize="24" fontStyle="italic" fill="#5B5F66">{tri("«Non solo fare il pane: capirlo.»", "«Nicht nur Brot backen: es verstehen.»", "«Not just making bread: understanding it.»")}</text>
              <text x="540" y="900" textAnchor="middle" fontFamily="Playfair Display, Georgia, serif" fontSize="40" fontWeight="900" fill="#A15621" letterSpacing="8">MIKILAB</text>
              <text x="540" y="940" textAnchor="middle" fontFamily="Manrope, Arial, sans-serif" fontSize="20" fill="#5B5F66">{tri("Il Manuale di Sitor · mikilab.de", "Sitors Handbuch · mikilab.de", "Sitor's Manual · mikilab.de")}</text>
            </svg>
            <div className="flex gap-2 mt-3">
              <button data-testid="festa-share" onClick={shareCert} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E9A23B]/60 font-bold text-sm active:scale-95"><Share2 className="w-4 h-4" />{tri("Condividi", "Teilen", "Share")}</button>
              <button onClick={() => setStep(3)} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#E9A23B] text-[#1F2124] font-black text-sm active:scale-95">{tri("Il secondo regalo", "Das zweite Geschenk", "The second gift")}<ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div data-testid="festa-gioco">
            <p className="font-mono-data text-[10px] tracking-[0.28em] uppercase text-[#F6F1E7]/60 mt-1">{tri("Il gioco del pane", "Das Brotspiel", "The bread game")} · {qi + 1}/{QUIZ.length}</p>
            <h2 className="font-display text-xl font-black leading-tight mt-1">{L(QUIZ[qi].q)}</h2>
            <div className="grid gap-2 mt-3">
              {QUIZ[qi].a.map((a, i) => (
                <button key={i} data-testid={`festa-q-${i}`} onClick={() => answer(i)} className={`text-left px-3.5 py-2.5 rounded-xl border text-sm font-bold active:scale-[0.98] ${picked == null ? "border-white/20 bg-[#1F2124]" : i === QUIZ[qi].ok ? "border-[#597362] bg-[#597362]/40" : i === picked ? "border-[#A4472D] bg-[#A4472D]/40" : "border-white/10 opacity-60"}`}>{L(a)}</button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div data-testid="festa-fine">
            <h2 className="font-display text-2xl font-black leading-tight mt-1">{score}/{QUIZ.length} — {title}</h2>
            <p className="text-sm text-[#F6F1E7]/85 mt-2">{tri("Qualunque sia il punteggio, da oggi hai un panettiere in tasca. Comincia da cinque panini facili, e chiedimi tutto quello che vuoi.", "Egal wie viele Punkte, ab heute hast du einen Bäcker in der Tasche. Fang mit fünf einfachen Brötchen an, und frag mich, was du willst.", "Whatever the score, from today you have a baker in your pocket. Start with five easy rolls, and ask me anything.")}</p>
            <div className="grid gap-2 mt-4">
              <button onClick={shareScore} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E9A23B]/60 font-bold text-sm active:scale-95"><Share2 className="w-4 h-4" />{tri("Sfida un amico", "Fordere einen Freund heraus", "Challenge a friend")}</button>
              <button onClick={() => { onClose(); onNav && onNav("percorso"); }} className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#E9A23B] text-[#1F2124] font-black active:scale-95"><Sparkles className="w-4 h-4" />{tri("Comincia da qui: 5 panini facili", "Fang hier an: 5 einfache Brötchen", "Start here: 5 easy rolls")}</button>
            </div>
          </div>
        )}
        <p className="text-[10px] text-[#F6F1E7]/50 mt-4 text-center">{tri("Sitor è un'intelligenza artificiale, non una persona. Niente di questa festa viene salvato o inviato.", "Sitor ist eine künstliche Intelligenz, keine Person. Nichts von dieser Feier wird gespeichert oder gesendet.", "Sitor is an artificial intelligence, not a person. Nothing from this party is saved or sent.")}</p>
      </div>
    </div>
  );
}
