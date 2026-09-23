import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, GraduationCap, Printer, Volume2, Square, CalendarPlus, Award, Sparkles, Baby, Palette, BookOpen, Gamepad2, Notebook, Users, ScrollText } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { LS, shareOrDownload } from "@/lib/sitorTools";
import { playTTSLong, stopTTS } from "@/lib/tts";
import { UI, INTRO, COME_SI_USA, CLASSI, GIOCHI, PAROLE, GUIDA, LETTERA, DISEGNI_TITOLI, FILASTROCCA } from "@/lib/scuolaDiPane";

// V111 — MIKILAB A SCUOLA. Il programma del pane dall'asilo alla quinta per educatrici, maestre e maestri: 36 schede
// (IT/DE) scritte da Sitor sul metodo di Michele, giochi, disegni da colorare, la filastrocca, le parole del pane, il
// quaderno della classe (solo soprannome della classe, mai nomi di bambini), la guida per chi insegna, l'attestato di
// fine anno. Tutto nel browser: nessun server, nessun dato inviato. Sitor legge le schede con la voce del telefono.

const KEY = "mikilab_scuola";
const VUOTO = { soprannome: "", bambini: "", anno: "", lievitoNome: "", lievitoData: "", fatte: {}, appunti: "", classeVista: 1, agenda: {} };
const T = (o, l) => (o && (o[l] || o.it)) || "";
const nav = (r) => { try { window.dispatchEvent(new CustomEvent("mikilab-nav", { detail: { route: r } })); } catch { /* */ } };
const routeOf = (path) => String(path || "").replace(/^\//, "").split("/")[0] || "home";
function giorniDa(data) {
  if (!data) return null;
  const d = new Date(data + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}
function oggiTesto(lang) {
  try { return new Date().toLocaleDateString(lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT", { day: "numeric", month: "long", year: "numeric" }); } catch { return new Date().toISOString().slice(0, 10); }
}

/* ---------- Le lezioni in agenda: file .ics creato sul dispositivo ---------- */
const icsTesto = (t) => String(t).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
function scaricaAgenda(c, dataInizio, L, ui) {
  const d0 = new Date(dataInizio + "T09:00:00");
  if (!dataInizio || isNaN(d0.getTime())) return false;
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const adesso = new Date();
  const stamp = `${ymd(adesso)}T${pad(adesso.getHours())}${pad(adesso.getMinutes())}00`;
  const eventi = c.lezioni.map((l, i) => {
    const d = new Date(d0.getTime() + i * 28 * 86400000);
    const d2 = new Date(d.getTime() + 86400000);
    const sommario = `${ui.titolo} · ${T(c.nome, L)} · ${c.n === 0 ? ui.attivita : ui.lezione} ${i + 1}: ${T(l.titolo, L)}`;
    const descr = `${T(l.impara, L)} ${ui.materiali}: ${T(l.materiali, L)} (${l.minuti} ${ui.minuti})`;
    return ["BEGIN:VEVENT", `UID:mikilab-scuola-${c.n}-${i}-${ymd(d)}@mikilab.de`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${ymd(d)}`, `DTEND;VALUE=DATE:${ymd(d2)}`, `SUMMARY:${icsTesto(sommario)}`, `DESCRIPTION:${icsTesto(descr)}`, "URL:https://mikilab.de/scuola", "END:VEVENT"].join("\r\n");
  });
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MikiLab//scuola//IT", "CALSCALE:GREGORIAN", ...eventi, "END:VCALENDAR"].join("\r\n");
  try { shareOrDownload(new Blob([ics], { type: "text/calendar;charset=utf-8" }), `mikilab-scuola-${c.n}.ics`, "MikiLab"); return true; } catch { return false; }
}

/* ---------- I pani che crescono: uno per livello ---------- */
function Pane({ w, attivo }) {
  const c = attivo ? "#8A4F22" : "#B9743A";
  return (
    <svg viewBox="0 0 64 44" width={w} height={Math.round(w * 0.69)} aria-hidden="true" focusable="false">
      <path d="M6 34 C6 16 18 8 32 8 C46 8 58 16 58 34 C58 38 54 40 50 40 H14 C10 40 6 38 6 34 Z" fill={c} />
      <path d="M6 34 C6 16 18 8 32 8 C46 8 58 16 58 34" fill="none" stroke="#E7C79A" strokeWidth="1.6" opacity="0.8" />
      <path d="M22 18 C29 13 39 14 46 21" fill="none" stroke="#F3DDBE" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
function Pani({ classe, onScegli, L }) {
  const larghezze = [26, 34, 41, 48, 55, 62];
  return (
    <div data-testid="scuola-livelli" className="flex items-end justify-between gap-0.5 max-w-xl pt-1" role="tablist">
      {CLASSI.map((c, i) => {
        const on = c.n === classe;
        return (
          <button key={c.n} role="tab" aria-selected={on} data-testid={`scuola-livello-${c.n}`} onClick={() => onScegli(c.n)} title={T(c.tema, L)}
            className={`flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 transition-colors ${on ? "bg-card shadow-[inset_0_-3px_0_#597362]" : ""}`}>
            <Pane w={larghezze[i]} attivo={on} />
            <span className="font-display text-[13px] font-bold text-foreground leading-none">{T(c.breve, L)}</span>
            <span className="text-[10px] text-muted-foreground hidden sm:block">{T(c.eta, L)}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Una lezione ---------- */
function Lezione({ c, i, l, L, ui, aperta, onApri, fatta, onFatta, onStampa }) {
  const [leggo, setLeggo] = useState(false);
  useEffect(() => () => { if (leggo) stopTTS(); }, [leggo]);
  useEffect(() => { if (!aperta && leggo) { stopTTS(); setLeggo(false); } }, [aperta, leggo]);
  const leggi = () => {
    if (leggo) { stopTTS(); setLeggo(false); return; }
    const testo = [T(l.titolo, L), T(l.impara, L), ...(l.passi[L] || l.passi.it), `${ui.domanda}: ${T(l.domanda, L)}`].join(". ");
    setLeggo(true);
    playTTSLong(testo, { lang: L, onEnded: () => setLeggo(false) });
  };
  return (
    <li data-testid={`scuola-lezione-${c.n}-${i}`} className={`rounded-2xl border bg-card overflow-hidden ${fatta ? "border-primary/60" : "border-border"}`}>
      <button onClick={onApri} aria-expanded={aperta} className="w-full flex items-center gap-3 px-3 py-3 text-left">
        <span className="font-mono-data text-primary text-lg font-bold w-6 text-center shrink-0" aria-hidden>{i + 1}</span>
        <span className="flex-1 min-w-0">
          <span className="block font-display text-[15px] font-bold text-foreground leading-tight">{T(l.titolo, L)}</span>
          <span className="block text-[11.5px] text-muted-foreground">{l.minuti} {ui.minuti} · {T(l.materie, L)}</span>
        </span>
        <span className={`shrink-0 w-7 h-7 rounded-full border grid place-items-center text-[13px] ${fatta ? "bg-primary border-primary text-white" : "border-border text-salvia"}`} aria-hidden>{fatta ? "✓" : aperta ? "–" : "+"}</span>
      </button>
      {aperta && (
        <div className="px-3 pb-3 space-y-2 border-t border-border/60 pt-2">
          <p className="text-[14px] text-foreground leading-snug">{T(l.impara, L)}</p>
          <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary">{ui.materiali}</p>
          <p className="text-[13px] text-foreground/90 leading-snug">{T(l.materiali, L)}</p>
          <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary">{ui.passi}</p>
          <ol className="space-y-1">{(l.passi[L] || l.passi.it).map((p, k) => <li key={k} className="flex gap-2 text-[13px] text-foreground/90 leading-snug"><span className="font-mono-data text-primary shrink-0">{k + 1}.</span><span>{p}</span></li>)}</ol>
          <div className="rounded-xl border border-salvia/40 bg-salvia/8 px-3 py-2">
            <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-salvia">{ui.domanda}</p>
            <p className="text-[14px] text-foreground leading-snug">«{T(l.domanda, L)}»</p>
          </div>
          <p className="text-[13px] text-foreground/90 leading-snug"><b className="text-foreground">{ui.casa}.</b> {T(l.casa, L)}</p>
          {l.sicurezza && <p className="text-[12.5px] text-primary leading-snug"><b>{ui.sicurezza}:</b> {T(l.sicurezza, L)}</p>}
          {l.attrezzo && <button data-testid={`scuola-attrezzo-${c.n}-${i}`} onClick={() => nav(routeOf(l.attrezzo.path))} className="text-[12.5px] font-bold text-salvia underline underline-offset-2 text-left">{ui.attrezzo}: {T(l.attrezzo.nome, L)} →</button>}
          <div className="flex flex-wrap gap-2 pt-1">
            <button data-testid={`scuola-stampa-${c.n}-${i}`} onClick={onStampa} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3 py-2 rounded-xl border border-border bg-card text-foreground active:scale-95"><Printer className="w-4 h-4" />{ui.stampa}</button>
            <button data-testid={`scuola-leggi-${c.n}-${i}`} onClick={leggi} aria-pressed={leggo} className={`inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3 py-2 rounded-xl active:scale-95 ${leggo ? "bg-salvia text-white" : "border border-salvia/60 text-salvia bg-card"}`}>{leggo ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}{leggo ? ui.ferma : ui.leggi}</button>
            <button data-testid={`scuola-fatta-${c.n}-${i}`} onClick={onFatta} aria-pressed={fatta} className={`inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3 py-2 rounded-xl active:scale-95 ${fatta ? "bg-primary text-white" : "border border-primary/60 text-primary bg-card"}`}>{fatta ? ui.fatta + " ✓" : ui.daFare}</button>
          </div>
        </div>
      )}
    </li>
  );
}

/* ---------- Giochi ---------- */
function Giochi({ L, ui }) {
  const [gioco, setGioco] = useState("quiz");
  const [i, setI] = useState(0);
  const [punti, setPunti] = useState(0);
  const [scelta, setScelta] = useState(null);
  const domande = useMemo(() => {
    if (gioco === "quiz") return GIOCHI.quiz.map((q) => ({ d: T(q.d, L), o: q.o[L] || q.o.it, r: q.r, s: T(q.s, L) }));
    if (gioco === "vf") return GIOCHI.veroFalso.map((q) => ({ d: T(q.d, L), o: [ui.vero, ui.falso], r: q.r ? 0 : 1, s: T(q.s, L) }));
    return GIOCHI.sensi.domande.map((q) => ({ d: T(q.d, L), o: GIOCHI.sensi.opzioni[L] || GIOCHI.sensi.opzioni.it, r: q.r, s: "" }));
  }, [gioco, L, ui.vero, ui.falso]);
  const cambia = (g) => { setGioco(g); setI(0); setPunti(0); setScelta(null); };
  const fine = i >= domande.length;
  const q = domande[i];
  const pill = (on) => `text-[12.5px] font-bold px-3 py-1.5 rounded-full border transition-colors ${on ? "bg-primary border-primary text-white" : "border-border bg-card text-foreground"}`;
  return (
    <section data-testid="scuola-giochi" className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button className={pill(gioco === "quiz")} onClick={() => cambia("quiz")}>{ui.quizTitolo}</button>
        <button className={pill(gioco === "vf")} onClick={() => cambia("vf")}>{ui.vfTitolo}</button>
        <button className={pill(gioco === "sensi")} onClick={() => cambia("sensi")}>{ui.sensiTitolo}</button>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4" aria-live="polite">
        {fine ? (
          <div className="space-y-2">
            <p className="font-display text-xl font-black text-primary">{ui.punteggio}: {punti} / {domande.length}</p>
            <p className="text-[14px] text-foreground">{ui.risultato(punti, domande.length)}</p>
            <button onClick={() => cambia(gioco)} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3 py-2 rounded-xl bg-primary text-white active:scale-95">{ui.ricomincia}</button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-muted-foreground">{i + 1} / {domande.length}</p>
            <p className="font-display text-lg font-bold text-foreground leading-tight">{q.d}</p>
            <div className="flex flex-col gap-1.5">
              {q.o.map((o, k) => {
                let cls = "border-border bg-background text-foreground";
                if (scelta !== null) { if (k === q.r) cls = "border-salvia bg-salvia/15 text-foreground font-bold"; else if (k === scelta) cls = "border-red-400/70 bg-red-400/10 text-foreground"; }
                return <button key={k} data-testid={`scuola-opz-${k}`} onClick={() => { if (scelta !== null) return; setScelta(k); if (k === q.r) setPunti((p) => p + 1); }} disabled={scelta !== null} className={`text-left text-[14px] rounded-xl border px-3 py-2 ${cls}`}>{o}</button>;
              })}
            </div>
            {scelta !== null && (
              <div className="space-y-2 pt-1">
                {q.s && <p className="text-[13px] text-salvia leading-snug">{q.s}</p>}
                <button data-testid="scuola-avanti" onClick={() => { setI((x) => x + 1); setScelta(null); }} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3 py-2 rounded-xl bg-primary text-white active:scale-95">{ui.avanti}</button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- Da colorare: cinque disegni a linea ---------- */
const PL = { fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" };
function DisPagnotta() { return (<svg viewBox="0 0 400 400" aria-hidden="true"><g {...PL}><ellipse cx="200" cy="325" rx="175" ry="16" /><path d="M50 260 C50 150 140 90 200 90 C260 90 350 150 350 260 C350 290 320 310 290 310 H110 C80 310 50 290 50 260 Z" /><path d="M135 155 C180 125 240 125 285 160" /><path d="M115 205 C170 172 250 172 305 208" /><path d="M120 255 C170 228 250 228 300 258" /></g></svg>); }
function DisSpiga() {
  const chicchi = [70, 95, 120, 145, 170];
  return (<svg viewBox="0 0 400 400" aria-hidden="true"><g {...PL}><path d="M200 385 V195" /><path d="M200 60 L182 18" /><path d="M200 60 L218 18" /><path d="M200 60 V12" />{chicchi.map((y, i) => <ellipse key={"l" + i} cx="181" cy={y} rx="24" ry="13" transform={`rotate(-35 181 ${y})`} />)}{chicchi.map((y, i) => <ellipse key={"r" + i} cx="219" cy={y} rx="24" ry="13" transform={`rotate(35 219 ${y})`} />)}<path d="M200 300 C150 285 125 245 135 205 C170 230 195 265 200 300 Z" /><path d="M200 340 C250 325 275 285 265 245 C230 270 205 305 200 340 Z" /></g></svg>);
}
function DisFornaio() { return (<svg viewBox="0 0 400 400" aria-hidden="true"><g {...PL}><path d="M145 110 C120 45 280 45 255 110 Z" /><rect x="140" y="105" width="120" height="26" rx="8" /><circle cx="200" cy="175" r="46" /><circle cx="184" cy="168" r="4" fill="currentColor" /><circle cx="216" cy="168" r="4" fill="currentColor" /><path d="M180 192 Q200 210 220 192" /><path d="M152 232 C160 222 240 222 248 232 L262 372 H138 Z" /><path d="M172 252 H228" /><path d="M152 240 C112 258 100 300 118 322" /><path d="M248 240 C288 258 300 300 282 322" /><path d="M128 322 C128 296 160 286 200 286 C240 286 272 296 272 322 C272 334 258 342 242 342 H158 C142 342 128 334 128 322 Z" /><path d="M165 305 C185 295 215 295 235 306" /><path d="M150 372 V388 H185 V372" /><path d="M215 372 V388 H250 V372" /></g></svg>); }
function DisLievito() {
  const bolle = [[158, 268, 11], [200, 258, 7], [242, 275, 13], [175, 305, 8], [222, 312, 10], [190, 335, 6], [250, 322, 6]];
  return (<svg viewBox="0 0 400 400" aria-hidden="true"><g {...PL}><rect x="108" y="78" width="184" height="42" rx="12" /><rect x="120" y="120" width="160" height="235" rx="24" /><rect x="150" y="142" width="100" height="56" rx="8" /><path d="M165 178 H235" /><path d="M120 236 C160 222 240 250 280 236" />{bolle.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}</g></svg>);
}
function DisForno() { return (<svg viewBox="0 0 400 400" aria-hidden="true"><g {...PL}><path d="M60 352 V225 C60 118 340 118 340 225 V352 Z" /><rect x="252" y="58" width="42" height="82" rx="4" /><path d="M110 352 V245 C110 178 290 178 290 245 V352" /><rect x="38" y="352" width="324" height="32" rx="6" /><path d="M138 328 C138 300 162 290 184 290 C206 290 230 300 230 328 C230 336 222 340 214 340 H154 C146 340 138 336 138 328 Z" /><path d="M232 334 C232 312 250 304 264 304 C278 304 296 312 296 334 C296 340 290 342 284 342 H244 C238 342 232 340 232 334 Z" /><path d="M160 306 C172 300 196 300 208 306" /><path d="M150 352 C148 340 156 336 156 326 C164 334 168 344 164 352" /><path d="M252 352 C250 340 258 336 258 326 C266 334 270 344 266 352" /></g></svg>); }
const DISEGNI = [{ id: "pagnotta", Svg: DisPagnotta }, { id: "spiga", Svg: DisSpiga }, { id: "fornaio", Svg: DisFornaio }, { id: "lievito", Svg: DisLievito }, { id: "forno", Svg: DisForno }];

function Colora({ L, ui, onStampa, onStampaFilastrocca }) {
  const versi = FILASTROCCA[L] || FILASTROCCA.it;
  return (
    <section data-testid="scuola-colora" className="space-y-3">
      <p className="text-[13px] text-muted-foreground leading-snug">{ui.coloraNota}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {DISEGNI.map((d, i) => (
          <div key={d.id} className="rounded-2xl border border-border bg-card p-2 text-center text-foreground">
            <div className="w-full aspect-square"><d.Svg /></div>
            <p className="font-display text-[14px] font-bold text-foreground leading-tight mt-1">{T(DISEGNI_TITOLI[d.id], L)}</p>
            <button data-testid={`scuola-disegno-${d.id}`} onClick={() => onStampa(i)} className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-bold px-2.5 py-1.5 rounded-xl border border-border bg-background text-foreground active:scale-95"><Printer className="w-3.5 h-3.5" />{ui.stampaDisegno}</button>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary">{ui.filastrocca}</p>
        <p className="text-[12px] text-muted-foreground mt-0.5 mb-2">{ui.filastroccaNota}</p>
        <div className="font-display text-[15px] text-foreground leading-relaxed">{versi.map((v, k) => <p key={k}>{v}</p>)}</div>
        <button data-testid="scuola-filastrocca-stampa" onClick={onStampaFilastrocca} className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3 py-2 rounded-xl border border-border bg-card text-foreground active:scale-95"><Printer className="w-4 h-4" />{ui.stampaFilastrocca}</button>
      </div>
    </section>
  );
}

/* ---------- Le parole del pane ---------- */
function Parole({ L }) {
  return (
    <dl data-testid="scuola-parole" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {PAROLE.map((v, k) => (
        <div key={k} className="rounded-2xl border border-border bg-card px-3 py-2.5">
          <dt className="font-display text-[15px] font-bold text-primary">{T(v.p, L)}</dt>
          <dd className="text-[13px] text-foreground/90 leading-snug mt-0.5">{T(v.s, L)}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------- Quaderno della classe ---------- */
function Quaderno({ q, setQ, L, ui }) {
  const campo = (k) => (e) => setQ({ ...q, [k]: e.target.value });
  const giorni = giorniDa(q.lievitoData);
  const inp = "w-full text-[14px] bg-card text-foreground border border-border rounded-xl px-3 py-2 outline-none focus:border-primary";
  const lab = "block text-[12px] text-muted-foreground mb-0.5";
  return (
    <section data-testid="scuola-quaderno" className="space-y-3">
      <p className="text-[13px] text-salvia leading-snug rounded-xl border border-salvia/40 bg-salvia/8 px-3 py-2">{ui.quadernoIntro}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <label><span className={lab}>{ui.soprannome}</span><input data-testid="scuola-soprannome" className={inp} value={q.soprannome} onChange={campo("soprannome")} placeholder={ui.soprannomeEs} maxLength={60} /></label>
        <label><span className={lab}>{ui.bambini}</span><input className={inp} value={q.bambini} onChange={campo("bambini")} inputMode="numeric" maxLength={3} /></label>
        <label><span className={lab}>{ui.annoScol}</span><input className={inp} value={q.anno} onChange={campo("anno")} placeholder={ui.annoEs} maxLength={12} /></label>
        <label><span className={lab}>{ui.lievitoNome}</span><input className={inp} value={q.lievitoNome} onChange={campo("lievitoNome")} placeholder={ui.lievitoEs} maxLength={40} /></label>
        <label><span className={lab}>{ui.lievitoData}</span><input className={inp} type="date" value={q.lievitoData} onChange={campo("lievitoData")} /></label>
      </div>
      {q.lievitoNome && giorni !== null && <p data-testid="scuola-lievito-vita" className="inline-block text-[14px] text-foreground rounded-xl border border-dashed border-primary/60 bg-card px-3 py-2">🫙 <b>{q.lievitoNome}</b> {ui.giorniVita(giorni)}.</p>}
      <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary pt-1">{ui.timbri}</p>
      <div className="space-y-2">
        {CLASSI.map((c) => {
          const tot = c.lezioni.length;
          const fatte = c.lezioni.filter((_, i) => q.fatte[`${c.n}-${i}`]).length;
          return (
            <div key={c.n} className={`rounded-2xl border bg-card px-3 py-2.5 ${fatte === tot ? "border-primary" : "border-border"}`}>
              <p className="text-[13px] text-foreground"><b>{T(c.nome, L)}</b> <span className="text-muted-foreground">{T(c.tema, L)}</span></p>
              <div className="flex gap-1.5 my-1.5" aria-label={ui.lezioniFatte(fatte, tot)}>
                {c.lezioni.map((l, i) => {
                  const on = !!q.fatte[`${c.n}-${i}`];
                  return <button key={i} data-testid={`scuola-timbro-${c.n}-${i}`} title={T(l.titolo, L)} aria-pressed={on} onClick={() => setQ({ ...q, fatte: { ...q.fatte, [`${c.n}-${i}`]: !on } })} className={`w-8 h-8 rounded-full font-mono-data text-[12px] font-bold ${on ? "bg-primary text-white" : "border border-dashed border-border text-muted-foreground"}`}>{i + 1}</button>;
                })}
              </div>
              <p className="text-[11.5px] text-muted-foreground">{fatte === tot ? ui.completata : ui.lezioniFatte(fatte, tot)}</p>
            </div>
          );
        })}
      </div>
      <label><span className={lab}>{ui.appunti}</span><textarea data-testid="scuola-appunti" className={inp} value={q.appunti} onChange={campo("appunti")} placeholder={ui.appuntiEs} rows={5} maxLength={4000} /></label>
      <p className="text-[12px] text-muted-foreground">{ui.salvato} {ui.scaricaTutto} <button onClick={() => nav("valigia")} className="font-bold text-salvia underline underline-offset-2">La valigia →</button></p>
      <button data-testid="scuola-svuota" onClick={() => { if (window.confirm(ui.svuotaConferma)) setQ({ ...VUOTO }); }} className="text-[12px] font-bold text-muted-foreground border border-border rounded-xl px-3 py-1.5 bg-card">{ui.svuota}</button>
    </section>
  );
}

/* ---------- Per chi insegna ---------- */
function Guida({ L, ui, onStampaLettera }) {
  const g = GUIDA;
  const Le = LETTERA[L] || LETTERA.it;
  const H = ({ t }) => <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary pt-2">{t}</p>;
  const Lista = ({ items, ord }) => { const Tag = ord ? "ol" : "ul"; return <Tag className="space-y-1">{items.map((r, k) => <li key={k} className="flex gap-2 text-[13px] text-foreground/90 leading-snug"><span className="font-mono-data text-primary shrink-0">{ord ? `${k + 1}.` : "·"}</span><span>{r}</span></li>)}</Tag>; };
  return (
    <section data-testid="scuola-guida" className="space-y-2">
      <H t={ui.comeSiUsa} /><Lista items={COME_SI_USA[L] || COME_SI_USA.it} />
      <H t={ui.guidaKit} /><Lista items={g.kit[L] || g.kit.it} />
      <H t={ui.guidaSicurezza} /><Lista ord items={g.sicurezza[L] || g.sicurezza.it} />
      <H t={ui.guidaAllergie} /><Lista items={g.allergie[L] || g.allergie.it} />
      <H t={ui.guidaSenzaForno} /><p className="text-[13px] text-foreground/90 leading-snug">{g.senzaForno[L] || g.senzaForno.it} <button onClick={() => nav("salva")} className="font-bold text-salvia underline underline-offset-2">Il pane che salva →</button></p>
      <H t={ui.guidaMaterie} />
      <dl className="divide-y divide-border/70">{(g.materie[L] || g.materie.it).map(([m, d], k) => <div key={k} className="grid grid-cols-[7.5rem_1fr] gap-2 py-1.5"><dt className="text-[13px] font-bold text-salvia">{m}</dt><dd className="text-[13px] text-foreground/90 leading-snug">{d}</dd></div>)}</dl>
      <H t={ui.guidaLettera} />
      <div className="rounded-2xl border border-border bg-card p-4 space-y-1.5">
        <p className="font-display text-[15px] font-bold text-foreground">{Le.titolo}</p>
        {Le.righe.map((r, k) => <p key={k} className="text-[13px] text-foreground/90 leading-snug">{r}</p>)}
        {Le.campi.map((r, k) => <p key={"c" + k} className="text-[12.5px] text-muted-foreground">{r}</p>)}
      </div>
      <button data-testid="scuola-lettera-stampa" onClick={onStampaLettera} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3 py-2 rounded-xl border border-border bg-card text-foreground active:scale-95"><Printer className="w-4 h-4" />{ui.stampaLettera}</button>
    </section>
  );
}

/* ---------- Attestato di fine anno ---------- */
function AttestatoFoglio({ q, c, L, ui }) {
  return (
    <div className="mks-att rounded-md border-2 border-primary outline outline-1 outline-primary outline-offset-4 bg-[#f6efe4] text-[#2a2320] p-6 text-center my-3 mx-1">
      <div className="flex justify-center items-end gap-1"><Pane w={40} /><Pane w={52} attivo /><Pane w={40} /></div>
      <p className="font-display text-2xl font-black text-[#597362] mt-2">{ui.attTitolo}</p>
      <p className="text-[15px] mt-2 leading-snug">{ui.attTesto(q.soprannome, T(c.nome, L), T(c.tema, L))}</p>
      <p className="italic text-[13px] text-[#6b5f57] mt-1">«{T(c.motto, L)}»</p>
      <div className="flex flex-wrap justify-between gap-2 text-[12.5px] text-[#6b5f57] mt-4"><span>{ui.attAnno}: {q.anno || "________"}</span><span>{ui.attData}: {oggiTesto(L)}</span></div>
      <div className="flex flex-wrap justify-between gap-2 text-[12.5px] text-[#6b5f57] mt-3"><span>{ui.attFirma}: ____________________</span><span>{ui.attFirmaMiki}</span></div>
    </div>
  );
}

/* ---------- Foglio di stampa ---------- */
function Stampa({ cosa, q, L, ui }) {
  if (!cosa) return null;
  const c = CLASSI.find((x) => x.n === cosa.classe) || CLASSI[0];
  if (cosa.tipo === "attestato") return <div className="mks-print"><AttestatoFoglio q={q} c={c} L={L} ui={ui} /><p className="mks-print-pie">mikilab.de/scuola</p></div>;
  if (cosa.tipo === "lettera") {
    const Le = LETTERA[L] || LETTERA.it;
    return <div className="mks-print"><p className="mks-print-testa">MikiLab · {ui.titolo}</p><p><b>{Le.titolo}</b></p>{Le.righe.map((r, k) => <p key={k}>{r}</p>)}{Le.campi.map((r, k) => <p key={"c" + k}>{r}</p>)}<p className="mks-print-pie">mikilab.de/scuola</p></div>;
  }
  if (cosa.tipo === "disegno") {
    const d = DISEGNI[cosa.i] || DISEGNI[0];
    return <div className="mks-print"><p className="mks-print-testa">MikiLab · {ui.titolo}</p><h1>{T(DISEGNI_TITOLI[d.id], L)}</h1><div className="mks-print-svg"><d.Svg /></div><p className="mks-print-iosono">{ui.ioSono}</p><p className="mks-print-pie">mikilab.de/scuola</p></div>;
  }
  if (cosa.tipo === "filastrocca") {
    const versi = FILASTROCCA[L] || FILASTROCCA.it;
    return <div className="mks-print"><p className="mks-print-testa">MikiLab · {ui.titolo}</p><h1>{ui.filastrocca}</h1><div className="mks-print-versi">{versi.map((v, k) => <p key={k}>{v}</p>)}</div><p className="mks-print-iosono">{ui.ioSono}</p><p className="mks-print-pie">{ui.filastroccaNota} — mikilab.de/scuola</p></div>;
  }
  if (cosa.tipo === "poster") {
    return (
      <div className="mks-print">
        <h1 className="mks-poster-t">{ui.posterTitolo}</h1>
        <p className="mks-print-meta">{ui.posterSotto}</p>
        <div className="mks-poster">{CLASSI.map((k) => <div key={k.n} className="mks-poster-b"><p><b>{T(k.nome, L)}</b> · {T(k.eta, L)}</p><p className="mks-poster-tema">{T(k.tema, L)}</p><ol>{k.lezioni.map((l, i) => <li key={i}>{T(l.titolo, L)}</li>)}</ol></div>)}</div>
        <p className="mks-print-pie">{ui.sitor}</p>
      </div>
    );
  }
  const l = c.lezioni[cosa.i];
  return (
    <div className="mks-print">
      <p className="mks-print-testa">MikiLab · {ui.titolo} · {T(c.nome, L)}: {T(c.tema, L)}</p>
      <h1>{c.n === 0 ? ui.attivita : ui.lezione} {cosa.i + 1}: {T(l.titolo, L)}</h1>
      <p className="mks-print-meta">{l.minuti} {ui.minuti} · {ui.materie}: {T(l.materie, L)}</p>
      <p><b>{ui.impara}.</b> {T(l.impara, L)}</p>
      <p><b>{ui.materiali}.</b> {T(l.materiali, L)}</p>
      <p><b>{ui.passi}</b></p>
      <ol>{(l.passi[L] || l.passi.it).map((p, k) => <li key={k}>{p}</li>)}</ol>
      <p><b>{ui.domanda}.</b> «{T(l.domanda, L)}»</p>
      <p><b>{ui.casa}.</b> {T(l.casa, L)}</p>
      {l.sicurezza && <p><b>{ui.sicurezza}.</b> {T(l.sicurezza, L)}</p>}
      {l.attrezzo && <p><b>{ui.attrezzo}.</b> {T(l.attrezzo.nome, L)} — mikilab.de{l.attrezzo.path}</p>}
      {q.soprannome && <p>{ui.soprannome}: {q.soprannome}</p>}
      <p className="mks-print-pie">{ui.sitor}</p>
    </div>
  );
}

const CSS = `
.mks-print{display:none}
@media print{
  body.mks-printing *{visibility:hidden}
  body.mks-printing .mks-print,body.mks-printing .mks-print *{visibility:visible}
  body.mks-printing .mks-print{display:block;position:absolute;left:0;top:0;width:100%;padding:10mm 12mm;background:#fff;color:#000;font-size:12pt;line-height:1.45}
  .mks-print h1{font-size:20pt;margin:2mm 0 1mm;font-weight:700}
  .mks-print p{margin:1.5mm 0}
  .mks-print ol{margin:1mm 0 2mm;padding-left:6mm}
  .mks-print-testa{font-size:9pt;color:#555;border-bottom:1px solid #999;padding-bottom:2mm;margin-bottom:3mm}
  .mks-print-meta{color:#555}
  .mks-print-pie{margin-top:8mm;font-size:9pt;color:#555;border-top:1px solid #999;padding-top:2mm}
  .mks-print .mks-att{border:2px solid #000;outline:1px solid #000;margin:6mm auto;page-break-inside:avoid;background:#fff;color:#000}
  .mks-print-svg svg{width:170mm;height:170mm;display:block;margin:6mm auto;color:#000}
  .mks-print-iosono{font-size:14pt;margin-top:6mm}
  .mks-print-versi p{margin:0;font-size:16pt;line-height:1.7}
  .mks-poster-t{text-align:center}
  .mks-poster{display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin-top:4mm}
  .mks-poster-b{border:1px solid #000;padding:3mm 4mm;page-break-inside:avoid;font-size:10.5pt}
  .mks-poster-b p{margin:0}
  .mks-poster-tema{font-weight:700;font-size:12pt;margin-bottom:1mm}
  .mks-poster-b ol{margin:1mm 0 0;padding-left:5mm}
}`;

/* ---------- La pagina ---------- */
export default function Scuola({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = lang === "de" ? "de" : "it"; // i contenuti sono IT/DE
  const ui = UI[lang] || UI.it; // l'interfaccia segue la lingua del sito
  const [sezione, setSezione] = useState("programma");
  const [q, setQStato] = useState(() => ({ ...VUOTO, ...(LS.get(KEY, {}) || {}) }));
  const [aperta, setAperta] = useState(0);
  const [stampa, setStampa] = useState(null);
  const classe = typeof q.classeVista === "number" ? q.classeVista : 1;
  const c = CLASSI.find((x) => x.n === classe) || CLASSI[0];
  const setQ = (nuovo) => { setQStato(nuovo); LS.set(KEY, nuovo); };
  const back = () => { if (onBack) onBack(); else nav("strumenti"); };

  useEffect(() => {
    if (!stampa) return undefined;
    document.body.classList.add("mks-printing");
    const chiudi = () => { document.body.classList.remove("mks-printing"); setStampa(null); };
    window.addEventListener("afterprint", chiudi);
    const t = setTimeout(() => { try { window.print(); } catch { chiudi(); } }, 120);
    const t2 = setTimeout(chiudi, 60000);
    return () => { clearTimeout(t); clearTimeout(t2); window.removeEventListener("afterprint", chiudi); document.body.classList.remove("mks-printing"); };
  }, [stampa]);

  // Dati per Google (LearningResource), solo finché la pagina è aperta: le maestre cercano «pane scuola primaria».
  useEffect(() => {
    let el = null;
    try {
      el = document.createElement("script"); el.type = "application/ld+json"; el.id = "mikilab-scuola-jsonld";
      el.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "LearningResource", name: ui.titolo, description: ui.sotto, url: "https://mikilab.de/scuola", inLanguage: ["it", "de"], isAccessibleForFree: true, learningResourceType: "lesson plan", educationalLevel: L === "de" ? "Kita, Grundschule, Klasse 5" : "scuola dell'infanzia, scuola primaria", audience: { "@type": "EducationalAudience", educationalRole: "teacher" }, teaches: CLASSI.map((k) => T(k.tema, L)), author: { "@type": "Person", name: "Michele Signorella" }, publisher: { "@type": "Organization", name: "MikiLab", url: "https://mikilab.de" } });
      document.head.appendChild(el);
    } catch { /* */ }
    return () => { try { if (el) el.remove(); } catch { /* */ } };
  }, [L, ui.titolo, ui.sotto]);

  const sezioni = [["programma", GraduationCap], ["giochi", Gamepad2], ["colora", Palette], ["parole", BookOpen], ["quaderno", Notebook], ["guida", Users], ["attestato", Award]];
  const agendaData = (q.agenda && q.agenda[classe]) || "";

  return (
    <div data-testid="scuola-page" className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <style>{CSS}</style>
      <button data-testid="scuola-back" onClick={back} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div className="rounded-3xl border border-border/60 p-4 sm:p-5" style={{ backgroundImage: "linear-gradient(hsl(var(--border) / .45) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / .45) 1px, transparent 1px)", backgroundSize: "24px 24px", backgroundColor: "hsl(var(--card))" }}>
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary flex items-center gap-1.5"><GraduationCap className="w-3 h-3" />MikiLab</p>
        <h1 className="font-display text-2xl font-black text-foreground">{ui.titolo}</h1>
        <div className="mk-oro-line mt-2 mb-1" />
        <p className="text-sm text-muted-foreground mt-1">{ui.sotto}</p>
        {lang === "en" && <p className="mt-2 text-[12px] text-primary">{ui.en}</p>}
        <blockquote className="mt-3 rounded-r-xl border-l-4 border-primary bg-background/70 px-3 py-2">
          <p className="text-[13.5px] text-foreground leading-snug">{T(INTRO.michele, L)}</p>
          <cite className="not-italic text-[12px] text-primary">— {T(INTRO.firma, L)}</cite>
        </blockquote>
        <p data-testid="scuola-disclaimer" className="mt-2 text-[12px] text-salvia leading-snug rounded-xl border border-salvia/40 bg-salvia/8 px-3 py-2 flex items-start gap-1.5"><Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />{ui.sitor}</p>
      </div>

      <nav className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none]" aria-label={ui.titolo}>
        {sezioni.map(([s, Icon]) => (
          <button key={s} data-testid={`scuola-tab-${s}`} onClick={() => setSezione(s)} aria-current={sezione === s ? "page" : undefined} className={`shrink-0 inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3 py-1.5 rounded-full border transition-colors ${sezione === s ? "bg-primary border-primary text-white" : "border-border bg-card text-foreground"}`}><Icon className="w-3.5 h-3.5" />{ui.sezioni[s]}</button>
        ))}
      </nav>

      {sezione === "programma" && (
        <section className="space-y-3">
          <Pani classe={classe} onScegli={(n) => { setQ({ ...q, classeVista: n }); setAperta(0); }} L={L} />
          <div>
            <p className="text-[12px] text-primary">{T(c.nome, L)} · {T(c.eta, L)}</p>
            <h2 className="font-display text-xl font-black text-foreground leading-tight">{T(c.tema, L)}</h2>
            <p className="text-[13px] italic text-muted-foreground">«{T(c.motto, L)}»</p>
          </div>
          <ol className="space-y-2">
            {c.lezioni.map((l, i) => (
              <Lezione key={`${c.n}-${i}`} c={c} i={i} l={l} L={L} ui={ui} aperta={aperta === i} onApri={() => setAperta(aperta === i ? -1 : i)}
                fatta={!!q.fatte[`${c.n}-${i}`]} onFatta={() => setQ({ ...q, fatte: { ...q.fatte, [`${c.n}-${i}`]: !q.fatte[`${c.n}-${i}`] } })} onStampa={() => setStampa({ tipo: "lezione", classe: c.n, i })} />
            ))}
          </ol>
          <div className="rounded-2xl border border-border bg-card p-3 flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-0.5 text-[12px] text-muted-foreground">{ui.primaLezione}<input data-testid="scuola-agenda-data" type="date" value={agendaData} onChange={(e) => setQ({ ...q, agenda: { ...(q.agenda || {}), [classe]: e.target.value } })} className="text-[14px] bg-background text-foreground border border-border rounded-xl px-3 py-2 outline-none focus:border-primary" /></label>
            <button data-testid="scuola-agenda" disabled={!agendaData} onClick={() => scaricaAgenda(c, agendaData, L, ui)} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3 py-2 rounded-xl bg-primary text-white active:scale-95 disabled:opacity-50"><CalendarPlus className="w-4 h-4" />{ui.agenda}</button>
            <button data-testid="scuola-poster" onClick={() => setStampa({ tipo: "poster" })} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3 py-2 rounded-xl border border-border bg-background text-foreground active:scale-95"><Printer className="w-4 h-4" />{ui.poster}</button>
            <p className="basis-full text-[11.5px] text-muted-foreground">{ui.agendaNota}</p>
          </div>
          <p className="text-[13px] text-muted-foreground">{ui.perBambini} <button data-testid="scuola-vai-piccoli" onClick={() => nav("piccoli")} className="font-bold text-salvia underline underline-offset-2 inline-flex items-center gap-1"><Baby className="w-3.5 h-3.5" />{ui.paneDeiPiccoli} →</button></p>
        </section>
      )}
      {sezione === "giochi" && <Giochi L={L} ui={ui} />}
      {sezione === "colora" && <Colora L={L} ui={ui} onStampa={(i) => setStampa({ tipo: "disegno", i })} onStampaFilastrocca={() => setStampa({ tipo: "filastrocca" })} />}
      {sezione === "parole" && <Parole L={L} />}
      {sezione === "quaderno" && <Quaderno q={q} setQ={setQ} L={L} ui={ui} />}
      {sezione === "guida" && <Guida L={L} ui={ui} onStampaLettera={() => setStampa({ tipo: "lettera" })} />}
      {sezione === "attestato" && (
        <section className="space-y-2">
          <p className="text-[13px] text-muted-foreground leading-snug flex items-start gap-1.5"><ScrollText className="w-3.5 h-3.5 shrink-0 mt-0.5" />{ui.attestatoIntro}</p>
          <AttestatoFoglio q={q} c={c} L={L} ui={ui} />
          <button data-testid="scuola-attestato-stampa" onClick={() => setStampa({ tipo: "attestato", classe })} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3 py-2 rounded-xl bg-primary text-white active:scale-95"><Printer className="w-4 h-4" />{ui.stampaAttestato}</button>
        </section>
      )}

      <Stampa cosa={stampa} q={q} L={L} ui={ui} />
    </div>
  );
}
