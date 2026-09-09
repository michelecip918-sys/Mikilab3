import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { pick, mkTri } from "@/i18n/triMaps";
import { siteSettingsApi, weeklyApi } from "@/lib/api";

const base = process.env.PUBLIC_URL || "";
const AV = {
  michele: `${base}/michele-real-lab.jpg`,
  momy: `${base}/logo.png`,
};

// Testi "fumetto" (SOLO scritti, nessuna voce) per sezione.
const SCRIPTS = {
  home: [
    { who: "michele", it: "Ciao, sono Michele! Questo è il mio MikiLab: pane vero, il mio metodo, zero fretta. Parti dalle Ricette e seguimi.", de: "Hallo, ich bin Michele! Das ist mein MikiLab: echtes Brot, meine Methode. Starte bei den Rezepten und folge mir.", en: "Hi, I'm Michele! This is my MikiLab: real bread, my method, no rush. Start from the Recipes and follow me.", es: "¡Hola, soy Michele! Este es mi MikiLab: pan de verdad, mi método. Empieza por las Recetas y sígueme." },
    { who: "momy", it: "E io sono MikiLab, il tuo aiuto: dimmi cosa ti serve e ti porto subito nella sezione giusta.", de: "Und ich bin MikiLab, deine Hilfe: sag mir, was du brauchst, und ich bringe dich zum richtigen Bereich.", en: "And I'm MikiLab, your helper: tell me what you need and I'll take you to the right section.", es: "Y yo soy MikiLab, tu ayuda: dime qué necesitas y te llevo a la sección correcta." },
  ],
  ricette: [
    { who: "michele", it: "Queste sono le MIE ricette, spiegate passo dopo passo col mio metodo. Aprine una e adattala alle tue dosi.", de: "Das sind MEINE Rezepte, Schritt für Schritt nach meiner Methode. Öffne eins und passe es an deine Mengen an.", en: "These are MY recipes, explained step by step with my method. Open one and adapt it to your amounts.", es: "Estas son MIS recetas, explicadas paso a paso con mi método. Abre una y adáptala a tus dosis." },
    { who: "momy", it: "Cerchi qualcosa di preciso? Usa i filtri colorati per categoria: ti trovo la ricetta in un attimo.", de: "Suchst du etwas Bestimmtes? Nutze die farbigen Kategorie-Filter: ich finde das Rezept im Nu.", en: "Looking for something specific? Use the coloured category filters: I'll find the recipe in a second.", es: "¿Buscas algo concreto? Usa los filtros de color por categoría: te encuentro la receta al instante." },
  ],
  lab: [
    { who: "michele", it: "Questo è il TUO laboratorio. Partiamo dalle tue ricette e organizziamo la produzione: ti mostro io il flusso, passo dopo passo.", de: "Das ist DEINE Backstube. Wir starten mit deinen Rezepten und organisieren die Produktion: ich zeige dir den Ablauf, Schritt für Schritt.", en: "This is YOUR lab. Let's start from your recipes and organize production: I'll show you the flow, step by step.", es: "Este es TU laboratorio. Empezamos por tus recetas y organizamos la producción: te muestro el flujo, paso a paso." },
    { who: "momy", it: "Se ti blocchi ci sono io: seguiamo il Percorso Guidato, scegli le ricette e genero il piano al posto tuo.", de: "Wenn du nicht weiterkommst, bin ich da: wir folgen dem geführten Ablauf, du wählst die Rezepte und ich erstelle den Plan.", en: "If you get stuck I'm here: let's follow the Guided Path, pick your recipes and I'll generate the plan for you.", es: "Si te atascas, aquí estoy: seguimos la Ruta Guiada, eliges las recetas y yo genero el plan por ti." },
  ],
  impara: [
    { who: "michele", it: "Impara con calma: qui trovi la ricetta del giorno, i video e il tuo percorso passo-passo. Ci sono io a guidarti.", de: "Lerne in Ruhe: hier findest du das Rezept des Tages, Videos und deinen Schritt-für-Schritt-Weg. Ich führe dich.", en: "Learn calmly: here you'll find the recipe of the day, videos and your step-by-step path. I'm here to guide you.", es: "Aprende con calma: aquí encuentras la receta del día, los vídeos y tu recorrido paso a paso. Yo te guío." },
    { who: "momy", it: "Fai il Quiz del Fornaio e segna i progressi: ti accompagno io, senza fretta e senza voti brutti.", de: "Mach das Bäcker-Quiz und verfolge deine Fortschritte: ich begleite dich, ganz entspannt.", en: "Take the Baker's Quiz and track your progress: I'll walk you through it, no rush.", es: "Haz el Quiz del Panadero y anota tus progresos: te acompaño, sin prisa." },
  ],
  community: [
    { who: "michele", it: "Fatti conoscere: pubblica il tuo pane e racconta come l'hai fatto. Io passo a commentare i vostri lavori.", de: "Zeig dich: poste dein Brot und erzähl, wie du es gemacht hast. Ich schaue vorbei und kommentiere.", en: "Get known: post your bread and tell how you made it. I drop by to comment on your work.", es: "Date a conocer: publica tu pan y cuenta cómo lo hiciste. Yo paso a comentar vuestros trabajos." },
    { who: "momy", it: "Ti aiuto a muovere i primi passi: segui i colleghi, metti un like, commenta. Insieme cresciamo prima.", de: "Ich helfe dir bei den ersten Schritten: folge Kollegen, like, kommentiere. Zusammen wachsen wir schneller.", en: "I'll help you get started: follow colleagues, like, comment. Together we grow faster.", es: "Te ayudo con los primeros pasos: sigue a colegas, da like, comenta. Juntos crecemos antes." },
  ],
  shop: [
    { who: "michele", it: "Qui puoi avere le MIE ricette complete: dosi, procedimento e fasi, col mio metodo.", de: "Hier bekommst du MEINE vollständigen Rezepte: Mengen, Ablauf und Phasen, nach meiner Methode.", en: "Here you can get MY complete recipes: quantities, procedure and phases, with my method.", es: "Aquí puedes tener MIS recetas completas: cantidades, procedimiento y fases, con mi método." },
    { who: "momy", it: "Tutto è gratis: le ricette compaiono subito nel Piano IA. Ti configuro tutto io.", de: "Alles ist gratis: die Rezepte erscheinen sofort im KI-Plan. Ich richte alles ein.", en: "Everything is free: recipes appear right away in the AI Plan. I'll set it all up.", es: "Todo es gratis: las recetas aparecen enseguida en el Plan IA. Yo te lo configuro." },
  ],
};

const NAME = { michele: "Michele", momy: "MikiLab" };

export default function AvatarBubbles({ variant = "impara" }) {
  const { lang } = useLang();
  const [overrides, setOverrides] = useState({});
  useEffect(() => { siteSettingsApi.get().then((s) => setOverrides((s && s.avatar_bubbles) || {})).catch(() => {}); }, []);
  const msgs = SCRIPTS[variant] || SCRIPTS.impara;
  const bubbleText = (m) => {
    const ov = overrides[`${variant}.${m.who}`];
    if (ov) {
      const txt = pick(ov, lang);
      if (txt) return txt;
    }
    return pick(m, lang);
  };

  // Aiuto dinamico: cosa manca / cosa fare adesso
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [hint, setHint] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      if (variant === "lab") {
        const w = await weeklyApi.get().catch(() => null);
        const empty = !(w && Array.isArray(w.items) && w.items.length);
        if (alive) setHint(empty
          ? tri("Non hai ancora salvato il piano settimanale: iniziamo dal Passo 1.", "Du hast den Wochenplan noch nicht gespeichert: starten wir mit Schritt 1.", "You haven't saved the weekly plan yet: let's start with Step 1.", "Aún no has guardado el plan semanal: empecemos por el Paso 1.", "Tu n'as pas encore enregistré le plan hebdomadaire : commençons par l'étape 1.", "هنوز برنامهٔ هفتگی را ذخیره نکرده‌ای: از مرحلهٔ ۱ شروع کنیم.")
          : tri("Piano settimanale pronto: genera il piano di oggi!", "Wochenplan bereit: erstelle den heutigen Plan!", "Weekly plan ready: generate today's plan!", "Plan semanal listo: ¡genera el plan de hoy!", "Plan hebdomadaire prêt : génère le plan du jour !", "برنامهٔ هفتگی آماده است: برنامهٔ امروز را بساز!"));
      } else if (variant === "impara" || variant === "home") {
        let done = false;
        try { const c = JSON.parse(localStorage.getItem("mikilab_wizard_challenge") || "{}"); done = !!c.done; } catch { /* */ }
        if (alive && !done) setHint(tri("👉 Prova la sfida della settimana!", "👉 Probier die Challenge der Woche!", "👉 Try this week's challenge!", "👉 ¡Prueba el reto de la semana!", "👉 Tente le défi de la semaine !", "👉 چالش این هفته را امتحان کن!"));
      }
    })();
    return () => { alive = false; };
  }, [variant, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  // Assistente cliccabile: porta nella sezione/strumento di cui PARLA l'avatar (non più tutti nel Laboratorio).
  const goto = (tab) => window.dispatchEvent(new CustomEvent("mikilab-goto", { detail: { tab } }));
  const openLabTool = (id) => window.dispatchEvent(new CustomEvent("mikilab-open-lab-tool", { detail: { id } }));
  const openChallenges = () => window.dispatchEvent(new CustomEvent("mikilab-go-challenges"));
  // Scorri all'elemento se presente nella pagina corrente, altrimenti naviga al tab indicato.
  const scrollOrGoto = (selector, fallbackTab) => {
    const el = document.querySelector(selector);
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); }
    else if (fallbackTab) { goto(fallbackTab); }
  };
  const ACTIONS = {
    michele: {
      home: () => goto("ricette"),                                                   // parla delle Ricette → Ricette
      ricette: () => scrollOrGoto('[data-testid="recipe-search"]', "ricette"),        // "apri una ricetta" → lista ricette
      impara: () => scrollOrGoto('[data-testid="impara-livelli-btn"]', "impara"),     // video/percorso → Impara
      community: () => scrollOrGoto('[data-testid="community-submit"]', "community"),  // "pubblica il tuo pane" → compositore
      lab: () => openLabTool("aggiungi"),                                             // le tue ricette → Aggiungi
    },
    momy: {
      home: () => goto("maestro"),                                                    // helper → Il Tuo Laboratorio
      ricette: () => scrollOrGoto('[data-testid="recipe-cat-filters"]', "ricette"),   // filtri categoria
      impara: () => scrollOrGoto('[data-testid="evolving-quiz"]', "impara"), // Quiz
      community: () => scrollOrGoto('[data-testid="community-feed"],[data-testid="feed-toggle"]', "community"), // feed
      lab: () => scrollOrGoto('[data-testid="lab-wizard"]', "maestro"),               // Percorso Guidato
    },
  };
  const actFor = (who) => (ACTIONS[who] && ACTIONS[who][variant]) || null;
  const hintClickable = variant === "home" || variant === "impara";

  return (
    <div data-testid="avatar-bubbles" className="mb-5 space-y-3">
      {msgs.map((m, idx) => {
        const isMichele = m.who === "michele";
        const act = actFor(m.who);
        return (
          <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.12 }}
            className={`flex items-end gap-2.5 ${isMichele ? "" : "flex-row-reverse"}`}>
            <div className="relative shrink-0">
              <img src={AV[m.who]} alt={NAME[m.who]}
                className="w-11 h-11 rounded-full object-cover shadow-sm ring-2 ring-[#3E9C93]/60"
                onError={(e) => { e.currentTarget.style.display = "none"; }} />
              {!isMichele && hint && (
                <span data-testid="assistant-dot" className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#3E9C93] ring-2 ring-[#f7efe6] dark:ring-[#0D1520] animate-pulse" />
              )}
            </div>
            <div data-testid={`bubble-${m.who}`}
              onClick={act || undefined}
              role={act ? "button" : undefined}
              className={`relative max-w-[80%] rounded-2xl px-3.5 py-2.5 border transition-all bg-[#3E9C93]/5 border-[#3E9C93]/20 ${isMichele ? "rounded-bl-sm" : "rounded-br-sm"} ${act ? "cursor-pointer hover:border-[#3E9C93]/60 hover:bg-[#3E9C93]/10 active:scale-98" : ""}`}>
              <p className={`text-[10px] font-extrabold uppercase tracking-wide mb-0.5 ${isMichele ? "text-[#9cd6a0]" : "text-[#f0b76b]"}`}>{NAME[m.who]}</p>
              <p className="text-sm font-semibold text-[#141210] dark:text-white leading-snug">{bubbleText(m)}</p>
              {!isMichele && hint && (
                hintClickable ? (
                  <button data-testid={`bubble-hint-${variant}`} onClick={(e) => { e.stopPropagation(); openChallenges(); }}
                    className="text-[12px] font-bold text-[#3E9C93] leading-snug mt-1 underline decoration-[#3E9C93]/40 underline-offset-2 active:scale-98">{hint}</button>
                ) : (
                  <p data-testid={`bubble-hint-${variant}`} className="text-[12px] font-semibold text-[#3E9C93] leading-snug mt-1">{hint}</p>
                )
              )}
              {act && (
                <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-[#3E9C93]">
                  {tri("Portami lì", "Bring mich hin", "Take me there", "Llévame allí", "Emmène-moi", "من را ببر")} <ArrowRight className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
