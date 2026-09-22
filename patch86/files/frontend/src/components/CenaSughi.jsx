import { useMemo, useRef, useState, useEffect } from "react";
import { ChevronLeft, Mic, MicOff, Volume2, Clock, Plus, Minus, RefreshCw, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { MicNotice } from "@/components/MicNotice";
import { playTTS, stopTTS } from "@/lib/tts";
import { MEALS, SAUCES, suggest, pickPage, ingredientLine, mealAsSpeech, parsePanicoSpeech, pickLang } from "@/lib/panico";

// V74 — "Panico da cena" (idee veloci, con o senza bambini) e "Sughi nel mondo".
// Tutto locale: nessuna chiamata all'IA, nessun costo. Le idee sono pre-scritte; controlla sempre gli allergeni.
const TIMES = [15, 30, 45];

export default function CenaSughi({ onBack, initialTab = "panico" }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const voiceLang = mkTri(lang)("it-IT", "de-DE", "en-GB");

  const [tab, setTab] = useState(initialTab === "sughi" ? "sughi" : "panico");
  const [people, setPeople] = useState(2);
  const [kids, setKids] = useState(false);
  const [mins, setMins] = useState(30);
  const [offset, setOffset] = useState(0);
  const [openId, setOpenId] = useState(null);
  const [openSauce, setOpenSauce] = useState(null);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const recRef = useRef(null);

  useEffect(() => () => { try { stopTTS(); } catch { /* */ } try { recRef.current && recRef.current.stop(); } catch { /* */ } }, []);

  const list = useMemo(() => suggest({ mins, kids }), [mins, kids]);
  const page = useMemo(() => pickPage(list, offset, 3), [list, offset]);

  const changeFilter = (fn) => { fn(); setOffset(0); setOpenId(null); };

  const listen = () => {
    if (listening) { try { recRef.current && recRef.current.stop(); } catch { /* */ } return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error(tri("Comandi vocali non supportati su questo browser.", "Sprachbefehle werden nicht unterstützt.", "Voice commands not supported on this browser.")); return; }
    try {
      const rec = new SR();
      rec.lang = voiceLang; rec.continuous = false; rec.interimResults = false;
      rec.onresult = (e) => {
        const said = (e.results[0] && e.results[0][0] && e.results[0][0].transcript) || "";
        setHeard(said);
        const p = parsePanicoSpeech(said);
        changeFilter(() => {
          if (p.people) setPeople(p.people);
          if (typeof p.kids === "boolean") setKids(p.kids);
          if (p.mins) setMins(p.mins <= 15 ? 15 : p.mins <= 30 ? 30 : 45);
        });
      };
      rec.onerror = () => { setListening(false); };
      rec.onend = () => { setListening(false); recRef.current = null; };
      recRef.current = rec;
      rec.start();
      setListening(true);
    } catch { toast.error(tri("Microfono non disponibile.", "Mikrofon nicht verfügbar.", "Microphone not available.")); }
  };

  const speak = (text) => { try { stopTTS(); playTTS(text, { lang }); } catch { /* */ } };

  const tabBtn = (key, label, testid) => (
    <button data-testid={testid} onClick={() => { setTab(key); try { stopTTS(); } catch { /* */ } }}
      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${tab === key ? "bg-primary text-primary-foreground" : "bg-background border border-border text-foreground"}`}>
      {label}
    </button>
  );

  const chip = (active, onClick, label, testid) => (
    <button key={testid} data-testid={testid} onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground"}`}>
      {label}
    </button>
  );

  return (
    <div data-testid="cena-sughi-page" className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <button data-testid="cena-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold">
        <ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}
      </button>

      <div className="flex gap-2">
        {tabBtn("panico", tri("Panico da cena", "Abendessen-Panik", "Dinner panic"), "cena-tab-panico")}
        {tabBtn("sughi", tri("Sopra la focaccia", "Auf die Focaccia", "On the focaccia"), "cena-tab-sughi")}
      </div>

      {tab === "panico" && (
        <section data-testid="cena-panico" className="space-y-4">
          <div className="flex items-start gap-3">
            <img src="/sitor_official.webp" alt="" className="w-11 h-11 rounded-full object-cover border-2 border-border shrink-0" />
            <div className="rounded-2xl bg-muted/40 border border-border px-3.5 py-2.5">
              <p className="text-[14px] text-foreground font-semibold">
                {tri("Niente panico. Dimmi tre cose e ti do subito un'idea.", "Keine Panik. Sag mir drei Dinge und ich habe sofort eine Idee.", "Don't panic. Tell me three things and I'll give you an idea right away.")}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{tri("Sitor, l'avatar IA di Michele. Le idee sono già scritte: qui non uso l'IA.", "Sitor, Micheles KI-Avatar. Die Ideen sind vorgeschrieben: hier nutze ich keine KI.", "Sitor, Michele's AI avatar. The ideas are pre-written: I don't use AI here.")}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-foreground">{tri("Quanti siete a tavola?", "Wie viele seid ihr am Tisch?", "How many at the table?")}</span>
              <div className="flex items-center gap-2">
                <button data-testid="cena-people-minus" aria-label="-" onClick={() => changeFilter(() => setPeople((p) => Math.max(1, p - 1)))} className="w-8 h-8 rounded-full border border-border flex items-center justify-center active:scale-90"><Minus className="w-4 h-4" /></button>
                <span data-testid="cena-people" className="w-6 text-center font-black text-foreground">{people}</span>
                <button data-testid="cena-people-plus" aria-label="+" onClick={() => changeFilter(() => setPeople((p) => Math.min(12, p + 1)))} className="w-8 h-8 rounded-full border border-border flex items-center justify-center active:scale-90"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-sm font-bold text-foreground">{tri("Ci sono bambini?", "Sind Kinder dabei?", "Are there kids?")}</span>
              <div className="flex gap-2">
                {chip(kids, () => changeFilter(() => setKids(true)), tri("Sì", "Ja", "Yes"), "cena-kids-yes")}
                {chip(!kids, () => changeFilter(() => setKids(false)), tri("No", "Nein", "No"), "cena-kids-no")}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-sm font-bold text-foreground inline-flex items-center gap-1"><Clock className="w-4 h-4" />{tri("Quanto tempo hai?", "Wie viel Zeit hast du?", "How much time do you have?")}</span>
              <div className="flex gap-2">
                {TIMES.map((m) => chip(mins === m, () => changeFilter(() => setMins(m)), `${m} min`, `cena-time-${m}`))}
              </div>
            </div>
            <div className="pt-1">
              <button data-testid="cena-mic" onClick={listen}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold border active:scale-95 ${listening ? "bg-primary text-primary-foreground border-primary animate-pulse" : "bg-background border-border text-foreground"}`}>
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {listening ? tri("Ti ascolto…", "Ich höre zu…", "Listening…") : tri("Dillo a voce", "Sag es per Sprache", "Say it out loud")}
              </button>
              {heard && <p className="text-[11px] text-muted-foreground italic mt-1 truncate">“{heard}”</p>}
              <MicNotice className="mt-1" />
              <p className="text-[11px] text-muted-foreground mt-1">{tri("Prova: «siamo in 4 con due bambini, 20 minuti»", "Probiere: «wir sind 4 mit zwei Kindern, 20 Minuten»", "Try: “we are 4 with two kids, 20 minutes”")}</p>
            </div>
          </div>

          {page.length === 0 ? (
            <p data-testid="cena-empty" className="text-center text-muted-foreground text-sm py-6">{tri("Nessuna idea con questi filtri: prova ad allungare il tempo.", "Keine Idee mit diesen Filtern: probiere mehr Zeit.", "No idea with these filters: try a bit more time.")}</p>
          ) : (
            <div className="space-y-2.5" data-testid="cena-results">
              {page.map((m) => {
                const open = openId === m.id;
                return (
                  <div key={m.id} data-testid={`cena-meal-${m.id}`} className="rounded-2xl border border-border bg-background overflow-hidden">
                    <button onClick={() => setOpenId(open ? null : m.id)} className="w-full flex items-center gap-3 p-3.5 text-left active:bg-muted/30">
                      <span className="text-2xl">{m.emoji}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-bold text-foreground text-[15px] leading-tight">{pickLang(m.name, lang)}</span>
                        <span className="block text-[11px] text-muted-foreground mt-0.5">{m.mins} min · {people} {people === 1 ? tri("persona", "Person", "person") : tri("persone", "Personen", "people")}</span>
                      </span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
                    </button>
                    {open && (
                      <div className="px-3.5 pb-3.5 space-y-3 border-t border-border/60 pt-3">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">{tri("Ingredienti", "Zutaten", "Ingredients")}</p>
                          <ul className="space-y-0.5">
                            {m.ing.map((i, idx) => <li key={idx} className="text-[14px] text-foreground">• {ingredientLine(i, people, lang)}</li>)}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">{tri("Come si fa", "So geht's", "Method")}</p>
                          <ol className="space-y-1.5">
                            {pickLang(m.steps, lang).map((s, idx) => <li key={idx} className="text-[14px] text-foreground flex gap-2"><span className="font-black text-primary">{idx + 1}.</span><span>{s}</span></li>)}
                          </ol>
                        </div>
                        <button data-testid={`cena-speak-${m.id}`} onClick={() => speak(mealAsSpeech(m, people, lang))}
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold border border-border bg-background text-foreground active:scale-95">
                          <Volume2 className="w-4 h-4" />{tri("Leggimi la ricetta", "Lies mir das Rezept vor", "Read me the recipe")}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {list.length > 3 && (
            <button data-testid="cena-another" onClick={() => { setOffset((o) => o + 3); setOpenId(null); }}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border bg-background text-foreground font-bold text-sm active:scale-95">
              <RefreshCw className="w-4 h-4" />{tri("Un'altra idea", "Noch eine Idee", "Another idea")}
            </button>
          )}
          <p className="text-[11px] text-muted-foreground text-center">
            {tri("Controlla sempre gli allergeni sulle etichette degli ingredienti. Con i bambini evita ciò che è piccante e cuoci bene uova e carne.", "Prüfe immer die Allergene auf den Etiketten. Mit Kindern Scharfes vermeiden und Eier und Fleisch gut durchgaren.", "Always check allergens on ingredient labels. With kids avoid anything spicy and cook eggs and meat well.")}
          </p>
          <p className="text-[10px] text-muted-foreground/70 text-center">{MEALS.length} {tri("idee veloci", "schnelle Ideen", "quick ideas")}</p>
        </section>
      )}

      {tab === "sughi" && (
        <section data-testid="cena-sughi" className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {tri("Condimenti per focacce, pizze e pane appena sfornato, per una teglia o 4 persone. «Prima» va sull'impasto crudo, «Dopo» a cottura finita. Tocca una scheda per aprirla.", "Beläge für Focaccia, Pizza und frisches Brot, für ein Blech oder 4 Personen. «Vor» kommt auf den rohen Teig, «Nach» nach dem Backen. Tippe auf eine Karte, um sie zu öffnen.", "Toppings for focaccia, pizza and fresh bread, for one tray or 4 people. «Before» goes on the raw dough, «After» once baked. Tap a card to open it.")}
          </p>
          {SAUCES.map((s) => {
            const open = openSauce === s.id;
            return (
              <div key={s.id} data-testid={`sauce-${s.id}`} className="rounded-2xl border border-border bg-background overflow-hidden">
                <button onClick={() => setOpenSauce(open ? null : s.id)} className="w-full flex items-center gap-3 p-3.5 text-left active:bg-muted/30">
                  <span className="text-2xl">{s.flag}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-bold text-foreground text-[15px] leading-tight">{pickLang(s.name, lang)}</span>
                    <span className="block text-[11px] text-muted-foreground mt-0.5">{pickLang(s.place, lang)} · {s.mins >= 60 ? `${Math.floor(s.mins / 60)} h ${s.mins % 60 ? `${s.mins % 60} min` : ""}` : `${s.mins} min`}</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {open && (
                  <div className="px-3.5 pb-3.5 space-y-3 border-t border-border/60 pt-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">{tri("Ingredienti", "Zutaten", "Ingredients")}</p>
                      <p className="text-[14px] text-foreground">{pickLang(s.ing, lang)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">{tri("Come si fa", "So geht's", "Method")}</p>
                      <p className="text-[14px] text-foreground whitespace-pre-line">{pickLang(s.steps, lang)}</p>
                    </div>
                    <p className="text-[12px] text-foreground/80"><span className="font-bold">{tri("Allergeni:", "Allergene:", "Allergens:")}</span> {pickLang(s.allergens, lang)}</p>
                    <button onClick={() => speak(`${pickLang(s.name, lang)}. ${pickLang(s.ing, lang)} ${pickLang(s.steps, lang)}`)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold border border-border bg-background text-foreground active:scale-95">
                      <Volume2 className="w-4 h-4" />{tri("Leggimi la ricetta", "Lies mir das Rezept vor", "Read me the recipe")}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <p className="text-[11px] text-muted-foreground text-center">
            {tri("Controlla sempre gli allergeni sulle etichette degli ingredienti.", "Prüfe immer die Allergene auf den Etiketten der Zutaten.", "Always check allergens on ingredient labels.")}
          </p>
        </section>
      )}
    </div>
  );
}
