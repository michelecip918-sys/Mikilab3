// MikiLab a scuola — v110
// Pagina /scuola: programma di cinque anni per la scuola primaria, giochi, parole, quaderno della classe,
// guida per chi insegna, attestato. Tutto nel browser: nessun server, nessun dato di bambini.
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { UI, INTRO, COME_SI_USA, CLASSI, GIOCHI, PAROLE, GUIDA, LETTERA, DISEGNI_TITOLI, FILASTROCCA, guessLang } from "./lib/scuolaDiPane";

const KEY = "mikilab_scuola";
const VUOTO = { soprannome: "", bambini: "", anno: "", lievitoNome: "", lievitoData: "", fatte: {}, appunti: "", classeVista: 1 };

function leggi() {
  try { const v = JSON.parse(localStorage.getItem(KEY) || "null"); return v && typeof v === "object" ? { ...VUOTO, ...v } : { ...VUOTO }; }
  catch (e) { return { ...VUOTO }; }
}
function scrivi(q) { try { localStorage.setItem(KEY, JSON.stringify(q)); } catch (e) { /* spazio pieno o storage bloccato: si continua senza salvare */ } }
const T = (o, lang) => (o && (o[lang] || o.it)) || "";

/* ---------- Sitor legge: voce del telefono, maschile se c'è, mai un server ---------- */
const NOMI_MASCHILI = /male|maschile|luca|cosimo|diego|giuseppe|paolo|giorgio|carlo|markus|stefan|conrad|klaus|bernd|christoph|kasper|killian|ralf|daniel|jonas|hans|yannick|reed|rocko|eddy|grandpa/i;
function parla(testo, lang, onFine) {
  try {
    const sp = window.speechSynthesis;
    if (!sp || !window.SpeechSynthesisUtterance) return false;
    sp.cancel();
    const u = new SpeechSynthesisUtterance(testo);
    u.lang = lang === "de" ? "de-DE" : "it-IT";
    u.rate = 1.0;
    const voci = (sp.getVoices() || []).filter((v) => (v.lang || "").toLowerCase().startsWith(lang === "de" ? "de" : "it"));
    const maschile = voci.find((v) => NOMI_MASCHILI.test(v.name) && !/female|femminile|frau/i.test(v.name));
    if (maschile || voci[0]) u.voice = maschile || voci[0];
    u.onend = () => onFine && onFine();
    u.onerror = () => onFine && onFine();
    sp.speak(u);
    return true;
  } catch (e) { return false; }
}
function zitto() { try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) { /* niente */ } }

/* ---------- Le lezioni in agenda: file .ics creato sul dispositivo ---------- */
const icsTesto = (t) => String(t).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
function scaricaAgenda(c, dataInizio, lang, ui) {
  const d0 = new Date(dataInizio + "T09:00:00");
  if (!dataInizio || isNaN(d0.getTime())) return false;
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const adesso = new Date();
  const stamp = `${ymd(adesso)}T${pad(adesso.getHours())}${pad(adesso.getMinutes())}00`;
  const eventi = c.lezioni.map((l, i) => {
    const d = new Date(d0.getTime() + i * 28 * 86400000);
    const d2 = new Date(d.getTime() + 86400000);
    const sommario = `${ui.titolo} · ${T(c.nome, lang)} · ${c.n === 0 ? ui.attivita : ui.lezione} ${i + 1}: ${T(l.titolo, lang)}`;
    const descr = `${T(l.impara, lang)} ${ui.materiali}: ${T(l.materiali, lang)} (${l.minuti} ${ui.minuti})`;
    return ["BEGIN:VEVENT", `UID:mikilab-scuola-${c.n}-${i}-${ymd(d)}@mikilab.de`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${ymd(d)}`, `DTEND;VALUE=DATE:${ymd(d2)}`, `SUMMARY:${icsTesto(sommario)}`, `DESCRIPTION:${icsTesto(descr)}`, "URL:https://mikilab.de/scuola", "END:VEVENT"].join("\r\n");
  });
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MikiLab//scuola//IT", "CALSCALE:GREGORIAN", ...eventi, "END:VCALENDAR"].join("\r\n");
  try {
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `mikilab-scuola-${c.n}.ics`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    return true;
  } catch (e) { return false; }
}
function giorniDa(data) {
  if (!data) return null;
  const d = new Date(data + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}
function oggiTesto(lang) {
  try { return new Date().toLocaleDateString(lang === "de" ? "de-DE" : "it-IT", { day: "numeric", month: "long", year: "numeric" }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

/* ---------- Il pane che cresce: cinque pani, uno per classe ---------- */
function Pane({ w, attivo, scuro }) {
  const c = attivo ? "#8A4F22" : "#B9743A";
  return (
    <svg viewBox="0 0 64 44" width={w} height={w * 0.69} aria-hidden="true" focusable="false">
      <path d="M6 34 C6 16 18 8 32 8 C46 8 58 16 58 34 C58 38 54 40 50 40 H14 C10 40 6 38 6 34 Z" fill={c} />
      <path d="M6 34 C6 16 18 8 32 8 C46 8 58 16 58 34" fill="none" stroke="#E7C79A" strokeWidth="1.6" opacity="0.8" />
      <path d="M22 18 C29 13 39 14 46 21" fill="none" stroke={scuro ? "#F6E6CF" : "#F3DDBE"} strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

function Pani({ classe, onScegli, lang }) {
  const larghezze = [26, 34, 41, 48, 55, 62];
  return (
    <div className="mks-pani" role="tablist" aria-label={UI[lang].classe}>
      {CLASSI.map((c, i) => {
        const attivo = c.n === classe;
        return (
          <button key={c.n} role="tab" aria-selected={attivo} className={"mks-pane" + (attivo ? " on" : "")} onClick={() => onScegli(c.n)} title={T(c.tema, lang)}>
            <Pane w={larghezze[i]} attivo={attivo} />
            <span className="mks-pane-n">{T(c.breve, lang)}</span>
            <span className="mks-pane-eta">{T(c.eta, lang)}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Una lezione (voce del programma) ---------- */
function Lezione({ classe, i, l, lang, aperta, onApri, fatta, onFatta, onStampa }) {
  const ui = UI[lang];
  const id = `mks-lez-${classe}-${i}`;
  const [leggo, setLeggo] = useState(false);
  useEffect(() => () => { if (leggo) zitto(); }, [leggo]);
  useEffect(() => { if (!aperta && leggo) { zitto(); setLeggo(false); } }, [aperta, leggo]);
  const leggi = () => {
    if (leggo) { zitto(); setLeggo(false); return; }
    const testo = [T(l.titolo, lang), T(l.impara, lang), ...(l.passi[lang] || l.passi.it), ui.domanda + ": " + T(l.domanda, lang)].join(". ");
    if (parla(testo, lang, () => setLeggo(false))) setLeggo(true);
  };
  return (
    <li className={"mks-lez" + (aperta ? " open" : "") + (fatta ? " done" : "")}>
      <button className="mks-lez-testa" aria-expanded={aperta} aria-controls={id} onClick={onApri}>
        <span className="mks-lez-num" aria-hidden="true">{i + 1}</span>
        <span className="mks-lez-titolo">
          <b>{T(l.titolo, lang)}</b>
          <small>{l.minuti} {ui.minuti} · {T(l.materie, lang)}</small>
        </span>
        <span className="mks-lez-stato" aria-hidden="true">{fatta ? "✓" : (aperta ? "–" : "+")}</span>
      </button>
      {aperta && (
        <div className="mks-lez-corpo" id={id}>
          <p className="mks-impara">{T(l.impara, lang)}</p>
          <h4>{ui.materiali}</h4>
          <p>{T(l.materiali, lang)}</p>
          <h4>{ui.passi}</h4>
          <ol>{(l.passi[lang] || l.passi.it).map((p, k) => <li key={k}>{p}</li>)}</ol>
          <div className="mks-sitor">
            <span className="mks-sitor-e">{ui.domanda}</span>
            <p>«{T(l.domanda, lang)}»</p>
          </div>
          <h4>{ui.casa}</h4>
          <p>{T(l.casa, lang)}</p>
          {l.sicurezza && <p className="mks-avviso"><b>{ui.sicurezza}:</b> {T(l.sicurezza, lang)}</p>}
          {l.attrezzo && <p className="mks-attrezzo">{ui.attrezzo}: <Link to={l.attrezzo.path}>{T(l.attrezzo.nome, lang)}</Link></p>}
          <div className="mks-azioni">
            <button className="mks-btn" onClick={onStampa}>{ui.stampa}</button>
            <button className={"mks-btn" + (leggo ? " pieno" : "")} onClick={leggi} aria-pressed={leggo}>{leggo ? "■ " + ui.ferma : "▶ " + ui.leggi}</button>
            <button className={"mks-btn" + (fatta ? " pieno" : "")} onClick={onFatta} aria-pressed={fatta}>{fatta ? ui.fatta + " ✓" : ui.daFare}</button>
          </div>
        </div>
      )}
    </li>
  );
}

/* ---------- Giochi ---------- */
function Giochi({ lang }) {
  const ui = UI[lang];
  const [gioco, setGioco] = useState("quiz");
  const [i, setI] = useState(0);
  const [punti, setPunti] = useState(0);
  const [scelta, setScelta] = useState(null);
  const domande = useMemo(() => {
    if (gioco === "quiz") return GIOCHI.quiz.map((q) => ({ d: T(q.d, lang), o: q.o[lang] || q.o.it, r: q.r, s: T(q.s, lang) }));
    if (gioco === "vf") return GIOCHI.veroFalso.map((q) => ({ d: T(q.d, lang), o: [ui.vero, ui.falso], r: q.r ? 0 : 1, s: T(q.s, lang) }));
    return GIOCHI.sensi.domande.map((q) => ({ d: T(q.d, lang), o: GIOCHI.sensi.opzioni[lang] || GIOCHI.sensi.opzioni.it, r: q.r, s: "" }));
  }, [gioco, lang, ui.vero, ui.falso]);
  const cambia = (g) => { setGioco(g); setI(0); setPunti(0); setScelta(null); };
  const fine = i >= domande.length;
  const q = domande[i];
  const rispondi = (k) => { if (scelta !== null) return; setScelta(k); if (k === q.r) setPunti((p) => p + 1); };
  const avanti = () => { setI((x) => x + 1); setScelta(null); };
  return (
    <section className="mks-sez" aria-labelledby="mks-giochi-h">
      <h2 id="mks-giochi-h">{ui.sezioni.giochi}</h2>
      <div className="mks-pill-riga">
        <button className={"mks-pill" + (gioco === "quiz" ? " on" : "")} onClick={() => cambia("quiz")}>{ui.quizTitolo}</button>
        <button className={"mks-pill" + (gioco === "vf" ? " on" : "")} onClick={() => cambia("vf")}>{ui.vfTitolo}</button>
        <button className={"mks-pill" + (gioco === "sensi" ? " on" : "")} onClick={() => cambia("sensi")}>{ui.sensiTitolo}</button>
      </div>
      <div className="mks-gioco" aria-live="polite">
        {fine ? (
          <div className="mks-fine">
            <p className="mks-grande">{ui.punteggio}: {punti} / {domande.length}</p>
            <p>{ui.risultato(punti, domande.length)}</p>
            <button className="mks-btn pieno" onClick={() => cambia(gioco)}>{ui.ricomincia}</button>
          </div>
        ) : (
          <div>
            <p className="mks-conta">{i + 1} / {domande.length}</p>
            <p className="mks-domanda">{q.d}</p>
            <div className="mks-opzioni">
              {q.o.map((o, k) => {
                let cls = "mks-opz";
                if (scelta !== null) { if (k === q.r) cls += " giusta"; else if (k === scelta) cls += " sbagliata"; }
                return <button key={k} className={cls} onClick={() => rispondi(k)} disabled={scelta !== null}>{o}</button>;
              })}
            </div>
            {scelta !== null && (
              <div className="mks-spiega">
                {q.s && <p>{q.s}</p>}
                <button className="mks-btn pieno" onClick={avanti}>{ui.avanti}</button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- Da colorare: cinque disegni a linea, stampabili ---------- */
const P = { fill: "none", stroke: "#000", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" };
function DisPagnotta() {
  return (
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g {...P}>
        <ellipse cx="200" cy="325" rx="175" ry="16" />
        <path d="M50 260 C50 150 140 90 200 90 C260 90 350 150 350 260 C350 290 320 310 290 310 H110 C80 310 50 290 50 260 Z" />
        <path d="M135 155 C180 125 240 125 285 160" />
        <path d="M115 205 C170 172 250 172 305 208" />
        <path d="M120 255 C170 228 250 228 300 258" />
      </g>
    </svg>
  );
}
function DisSpiga() {
  const chicchi = [70, 95, 120, 145, 170];
  return (
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g {...P}>
        <path d="M200 385 V195" />
        <path d="M200 60 L182 18" /><path d="M200 60 L218 18" /><path d="M200 60 V12" />
        {chicchi.map((y, i) => <ellipse key={"l" + i} cx="181" cy={y} rx="24" ry="13" transform={`rotate(-35 181 ${y})`} />)}
        {chicchi.map((y, i) => <ellipse key={"r" + i} cx="219" cy={y} rx="24" ry="13" transform={`rotate(35 219 ${y})`} />)}
        <path d="M200 300 C150 285 125 245 135 205 C170 230 195 265 200 300 Z" />
        <path d="M200 340 C250 325 275 285 265 245 C230 270 205 305 200 340 Z" />
      </g>
    </svg>
  );
}
function DisFornaio() {
  return (
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g {...P}>
        <path d="M145 110 C120 45 280 45 255 110 Z" />
        <rect x="140" y="105" width="120" height="26" rx="8" />
        <circle cx="200" cy="175" r="46" />
        <circle cx="184" cy="168" r="4" fill="#000" /><circle cx="216" cy="168" r="4" fill="#000" />
        <path d="M180 192 Q200 210 220 192" />
        <path d="M152 232 C160 222 240 222 248 232 L262 372 H138 Z" />
        <path d="M172 252 H228" />
        <path d="M152 240 C112 258 100 300 118 322" /><path d="M248 240 C288 258 300 300 282 322" />
        <path d="M128 322 C128 296 160 286 200 286 C240 286 272 296 272 322 C272 334 258 342 242 342 H158 C142 342 128 334 128 322 Z" />
        <path d="M165 305 C185 295 215 295 235 306" />
        <path d="M150 372 V388 H185 V372" /><path d="M215 372 V388 H250 V372" />
      </g>
    </svg>
  );
}
function DisLievito() {
  const bolle = [[158, 268, 11], [200, 258, 7], [242, 275, 13], [175, 305, 8], [222, 312, 10], [190, 335, 6], [250, 322, 6]];
  return (
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g {...P}>
        <rect x="108" y="78" width="184" height="42" rx="12" />
        <rect x="120" y="120" width="160" height="235" rx="24" />
        <rect x="150" y="142" width="100" height="56" rx="8" />
        <path d="M165 178 H235" />
        <path d="M120 236 C160 222 240 250 280 236" />
        {bolle.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}
      </g>
    </svg>
  );
}
function DisForno() {
  return (
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g {...P}>
        <path d="M60 352 V225 C60 118 340 118 340 225 V352 Z" />
        <rect x="252" y="58" width="42" height="82" rx="4" />
        <path d="M110 352 V245 C110 178 290 178 290 245 V352" />
        <rect x="38" y="352" width="324" height="32" rx="6" />
        <path d="M138 328 C138 300 162 290 184 290 C206 290 230 300 230 328 C230 336 222 340 214 340 H154 C146 340 138 336 138 328 Z" />
        <path d="M232 334 C232 312 250 304 264 304 C278 304 296 312 296 334 C296 340 290 342 284 342 H244 C238 342 232 340 232 334 Z" />
        <path d="M160 306 C172 300 196 300 208 306" />
        <path d="M150 352 C148 340 156 336 156 326 C164 334 168 344 164 352" /><path d="M252 352 C250 340 258 336 258 326 C266 334 270 344 266 352" />
      </g>
    </svg>
  );
}
const DISEGNI = [
  { id: "pagnotta", Svg: DisPagnotta },
  { id: "spiga", Svg: DisSpiga },
  { id: "fornaio", Svg: DisFornaio },
  { id: "lievito", Svg: DisLievito },
  { id: "forno", Svg: DisForno },
];

function Colora({ lang, onStampa, onStampaFilastrocca }) {
  const ui = UI[lang];
  const versi = FILASTROCCA[lang] || FILASTROCCA.it;
  return (
    <section className="mks-sez" aria-labelledby="mks-colora-h">
      <h2 id="mks-colora-h">{ui.sezioni.colora}</h2>
      <p className="mks-nota">{ui.coloraNota}</p>
      <div className="mks-disegni">
        {DISEGNI.map((d, i) => (
          <div key={d.id} className="mks-disegno">
            <div className="mks-disegno-img"><d.Svg /></div>
            <p><b>{T(DISEGNI_TITOLI[d.id], lang)}</b></p>
            <button className="mks-btn" onClick={() => onStampa(i)}>{ui.stampaDisegno}</button>
          </div>
        ))}
      </div>
      <h3>{ui.filastrocca}</h3>
      <p className="mks-nota">{ui.filastroccaNota}</p>
      <div className="mks-versi">{versi.map((v, k) => <p key={k}>{v}</p>)}</div>
      <button className="mks-btn" onClick={onStampaFilastrocca}>{ui.stampaFilastrocca}</button>
    </section>
  );
}

/* ---------- Le parole del pane ---------- */
function Parole({ lang }) {
  const ui = UI[lang];
  return (
    <section className="mks-sez" aria-labelledby="mks-parole-h">
      <h2 id="mks-parole-h">{ui.sezioni.parole}</h2>
      <dl className="mks-parole">
        {PAROLE.map((v, k) => (
          <div key={k} className="mks-parola">
            <dt>{T(v.p, lang)}</dt>
            <dd>{T(v.s, lang)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ---------- Quaderno della classe ---------- */
function Quaderno({ q, setQ, lang }) {
  const ui = UI[lang];
  const campo = (k) => (e) => setQ({ ...q, [k]: e.target.value });
  const giorni = giorniDa(q.lievitoData);
  const svuota = () => { if (window.confirm(ui.svuotaConferma)) setQ({ ...VUOTO }); };
  return (
    <section className="mks-sez" aria-labelledby="mks-quad-h">
      <h2 id="mks-quad-h">{ui.sezioni.quaderno}</h2>
      <p className="mks-nota">{ui.quadernoIntro}</p>
      <div className="mks-form">
        <label>{ui.soprannome}<input value={q.soprannome} onChange={campo("soprannome")} placeholder={ui.soprannomeEs} maxLength={60} /></label>
        <label>{ui.bambini}<input value={q.bambini} onChange={campo("bambini")} inputMode="numeric" maxLength={3} /></label>
        <label>{ui.annoScol}<input value={q.anno} onChange={campo("anno")} placeholder={ui.annoEs} maxLength={12} /></label>
        <label>{ui.lievitoNome}<input value={q.lievitoNome} onChange={campo("lievitoNome")} placeholder={ui.lievitoEs} maxLength={40} /></label>
        <label>{ui.lievitoData}<input type="date" value={q.lievitoData} onChange={campo("lievitoData")} /></label>
      </div>
      {q.lievitoNome && giorni !== null && (
        <p className="mks-lievito">🫙 <b>{q.lievitoNome}</b> {ui.giorniVita(giorni)}.</p>
      )}
      <h3>{ui.timbri}</h3>
      <div className="mks-timbri">
        {CLASSI.map((c) => {
          const tot = c.lezioni.length;
          const fatte = c.lezioni.filter((_, i) => q.fatte[`${c.n}-${i}`]).length;
          return (
            <div key={c.n} className={"mks-timbro-riga" + (fatte === tot ? " oro" : "")}>
              <div className="mks-timbro-testa"><b>{T(c.nome, lang)}</b> <span>{T(c.tema, lang)}</span></div>
              <div className="mks-timbro-cerchi" aria-label={ui.lezioniFatte(fatte, tot)}>
                {c.lezioni.map((l, i) => {
                  const on = !!q.fatte[`${c.n}-${i}`];
                  return (
                    <button key={i} className={"mks-timbro" + (on ? " on" : "")} title={T(l.titolo, lang)} aria-pressed={on}
                      onClick={() => setQ({ ...q, fatte: { ...q.fatte, [`${c.n}-${i}`]: !on } })}>{i + 1}</button>
                  );
                })}
              </div>
              <small>{fatte === tot ? ui.completata : ui.lezioniFatte(fatte, tot)}</small>
            </div>
          );
        })}
      </div>
      <label className="mks-appunti">{ui.appunti}
        <textarea value={q.appunti} onChange={campo("appunti")} placeholder={ui.appuntiEs} rows={6} maxLength={4000} />
      </label>
      <p className="mks-nota">{ui.salvato} {ui.scaricaTutto} <Link to="/valigia">La valigia</Link></p>
      <button className="mks-btn leggero" onClick={svuota}>{ui.svuota}</button>
    </section>
  );
}

/* ---------- Per chi insegna ---------- */
function Guida({ lang, onStampaLettera }) {
  const ui = UI[lang];
  const g = GUIDA;
  const L = LETTERA[lang] || LETTERA.it;
  return (
    <section className="mks-sez" aria-labelledby="mks-guida-h">
      <h2 id="mks-guida-h">{ui.sezioni.guida}</h2>
      <h3>{ui.comeSiUsa}</h3>
      <ul className="mks-lista">{(COME_SI_USA[lang] || COME_SI_USA.it).map((r, k) => <li key={k}>{r}</li>)}</ul>
      <h3>{ui.guidaKit}</h3>
      <ul className="mks-lista">{(g.kit[lang] || g.kit.it).map((r, k) => <li key={k}>{r}</li>)}</ul>
      <h3>{ui.guidaSicurezza}</h3>
      <ol className="mks-lista">{(g.sicurezza[lang] || g.sicurezza.it).map((r, k) => <li key={k}>{r}</li>)}</ol>
      <h3>{ui.guidaAllergie}</h3>
      <ul className="mks-lista">{(g.allergie[lang] || g.allergie.it).map((r, k) => <li key={k}>{r}</li>)}</ul>
      <h3>{ui.guidaSenzaForno}</h3>
      <p>{g.senzaForno[lang] || g.senzaForno.it} <Link to="/salva">Il pane che salva</Link></p>
      <h3>{ui.guidaMaterie}</h3>
      <dl className="mks-materie">
        {(g.materie[lang] || g.materie.it).map(([m, d], k) => <div key={k}><dt>{m}</dt><dd>{d}</dd></div>)}
      </dl>
      <h3>{ui.guidaLettera}</h3>
      <div className="mks-lettera">
        <p><b>{L.titolo}</b></p>
        {L.righe.map((r, k) => <p key={k}>{r}</p>)}
        {L.campi.map((r, k) => <p key={"c" + k} className="mks-campo">{r}</p>)}
      </div>
      <button className="mks-btn" onClick={onStampaLettera}>{ui.stampaLettera}</button>
    </section>
  );
}

/* ---------- Attestato della classe ---------- */
function Attestato({ q, classe, lang, onStampa }) {
  const ui = UI[lang];
  const c = CLASSI.find((x) => x.n === classe) || CLASSI[0];
  return (
    <section className="mks-sez" aria-labelledby="mks-att-h">
      <h2 id="mks-att-h">{ui.sezioni.attestato}</h2>
      <p className="mks-nota">{ui.attestatoIntro}</p>
      <AttestatoFoglio q={q} c={c} lang={lang} />
      <button className="mks-btn pieno" onClick={onStampa}>{ui.stampaAttestato}</button>
    </section>
  );
}
function AttestatoFoglio({ q, c, lang }) {
  const ui = UI[lang];
  return (
    <div className="mks-att">
      <div className="mks-att-pani"><Pane w={40} /><Pane w={52} attivo /><Pane w={40} /></div>
      <p className="mks-att-t">{ui.attTitolo}</p>
      <p className="mks-att-testo">{ui.attTesto(q.soprannome, T(c.nome, lang), T(c.tema, lang))}</p>
      <p className="mks-att-motto">«{T(c.motto, lang)}»</p>
      <div className="mks-att-righe">
        <span>{ui.attAnno}: {q.anno || "________"}</span>
        <span>{ui.attData}: {oggiTesto(lang)}</span>
      </div>
      <div className="mks-att-firme">
        <span>{ui.attFirma}: ____________________</span>
        <span>{ui.attFirmaMiki}</span>
      </div>
    </div>
  );
}

/* ---------- Foglio di stampa ---------- */
function Stampa({ cosa, q, lang }) {
  const ui = UI[lang];
  if (!cosa) return null;
  if (cosa.tipo === "attestato") {
    const c = CLASSI.find((x) => x.n === cosa.classe) || CLASSI[0];
    return <div className="mks-print"><AttestatoFoglio q={q} c={c} lang={lang} /><p className="mks-print-pie">mikilab.de/scuola</p></div>;
  }
  if (cosa.tipo === "lettera") {
    const L = LETTERA[lang] || LETTERA.it;
    return (
      <div className="mks-print">
        <p className="mks-print-testa">MikiLab · {ui.titolo}</p>
        <p><b>{L.titolo}</b></p>
        {L.righe.map((r, k) => <p key={k}>{r}</p>)}
        {L.campi.map((r, k) => <p key={"c" + k} className="mks-campo">{r}</p>)}
        <p className="mks-print-pie">mikilab.de/scuola</p>
      </div>
    );
  }
  if (cosa.tipo === "disegno") {
    const d = DISEGNI[cosa.i] || DISEGNI[0];
    return (
      <div className="mks-print mks-print-disegno">
        <p className="mks-print-testa">MikiLab · {ui.titolo}</p>
        <h1>{T(DISEGNI_TITOLI[d.id], lang)}</h1>
        <div className="mks-print-svg"><d.Svg /></div>
        <p className="mks-print-iosono">{ui.ioSono}</p>
        <p className="mks-print-pie">mikilab.de/scuola</p>
      </div>
    );
  }
  if (cosa.tipo === "filastrocca") {
    const versi = FILASTROCCA[lang] || FILASTROCCA.it;
    return (
      <div className="mks-print">
        <p className="mks-print-testa">MikiLab · {ui.titolo}</p>
        <h1>{ui.filastrocca}</h1>
        <div className="mks-print-versi">{versi.map((v, k) => <p key={k}>{v}</p>)}</div>
        <p className="mks-print-iosono">{ui.ioSono}</p>
        <p className="mks-print-pie">{ui.filastroccaNota} — mikilab.de/scuola</p>
      </div>
    );
  }
  if (cosa.tipo === "poster") {
    return (
      <div className="mks-print">
        <h1 className="mks-poster-t">{ui.posterTitolo}</h1>
        <p className="mks-print-meta">{ui.posterSotto}</p>
        <div className="mks-poster">
          {CLASSI.map((c) => (
            <div key={c.n} className="mks-poster-b">
              <p className="mks-poster-n"><b>{T(c.nome, lang)}</b> · {T(c.eta, lang)}</p>
              <p className="mks-poster-tema">{T(c.tema, lang)}</p>
              <ol>{c.lezioni.map((l, i) => <li key={i}>{T(l.titolo, lang)}</li>)}</ol>
            </div>
          ))}
        </div>
        <p className="mks-print-pie">{ui.sitor}</p>
      </div>
    );
  }
  const c = CLASSI.find((x) => x.n === cosa.classe) || CLASSI[0];
  const l = c.lezioni[cosa.i];
  return (
    <div className="mks-print">
      <p className="mks-print-testa">MikiLab · {ui.titolo} · {T(c.nome, lang)}: {T(c.tema, lang)}</p>
      <h1>{c.n === 0 ? ui.attivita : ui.lezione} {cosa.i + 1}: {T(l.titolo, lang)}</h1>
      <p className="mks-print-meta">{l.minuti} {ui.minuti} · {ui.materie}: {T(l.materie, lang)}</p>
      <p><b>{ui.impara}.</b> {T(l.impara, lang)}</p>
      <p><b>{ui.materiali}.</b> {T(l.materiali, lang)}</p>
      <p><b>{ui.passi}</b></p>
      <ol>{(l.passi[lang] || l.passi.it).map((p, k) => <li key={k}>{p}</li>)}</ol>
      <p><b>{ui.domanda}.</b> «{T(l.domanda, lang)}»</p>
      <p><b>{ui.casa}.</b> {T(l.casa, lang)}</p>
      {l.sicurezza && <p><b>{ui.sicurezza}.</b> {T(l.sicurezza, lang)}</p>}
      {l.attrezzo && <p><b>{ui.attrezzo}.</b> {T(l.attrezzo.nome, lang)} — mikilab.de{l.attrezzo.path}</p>}
      <p className="mks-print-note">{q.soprannome ? `${ui.soprannome}: ${q.soprannome}` : ""}</p>
      <p className="mks-print-pie">{ui.sitor}</p>
    </div>
  );
}

/* ---------- La pagina ---------- */
export default function Scuola() {
  const [lang, setLang] = useState(() => guessLang());
  const [sezione, setSezione] = useState("programma");
  const [q, setQStato] = useState(() => leggi());
  const [aperta, setAperta] = useState(0);
  const [stampa, setStampa] = useState(null);
  const classe = typeof q.classeVista === "number" ? q.classeVista : 1;
  const L = lang === "en" ? "it" : lang;
  const ui = UI[L];
  const c = CLASSI.find((x) => x.n === classe) || CLASSI[0];

  const setQ = useCallback((nuovo) => { setQStato(nuovo); scrivi(nuovo); }, []);
  const scegliClasse = (n) => { setQ({ ...q, classeVista: n }); setAperta(0); };
  const cambiaLingua = () => {
    const n = L === "de" ? "it" : "de";
    try { localStorage.setItem("mikilab_scuola_lang", n); } catch (e) { /* va bene lo stesso */ }
    setLang(n);
  };

  useEffect(() => {
    if (!stampa) return undefined;
    document.body.classList.add("mks-printing");
    const chiudi = () => { document.body.classList.remove("mks-printing"); setStampa(null); };
    window.addEventListener("afterprint", chiudi);
    const t = setTimeout(() => { try { window.print(); } catch (e) { chiudi(); } }, 120);
    const t2 = setTimeout(chiudi, 60000);
    return () => { clearTimeout(t); clearTimeout(t2); window.removeEventListener("afterprint", chiudi); document.body.classList.remove("mks-printing"); };
  }, [stampa]);

  useEffect(() => { try { document.title = `${ui.titolo} · MikiLab`; } catch (e) { /* niente */ } }, [ui.titolo]);

  // Dati per Google (LearningResource) e descrizione della pagina: solo finché la pagina è aperta
  useEffect(() => {
    let el = null; let meta = null; let creata = false; let prima = null;
    try {
      el = document.createElement("script");
      el.type = "application/ld+json"; el.id = "mks-jsonld";
      el.textContent = JSON.stringify({
        "@context": "https://schema.org", "@type": "LearningResource",
        name: ui.titolo, description: ui.sotto, url: "https://mikilab.de/scuola",
        inLanguage: ["it", "de"], isAccessibleForFree: true, learningResourceType: "lesson plan",
        educationalLevel: L === "de" ? "Kita, Grundschule, Klasse 5" : "scuola dell'infanzia, scuola primaria",
        audience: { "@type": "EducationalAudience", educationalRole: "teacher" },
        teaches: CLASSI.map((c) => T(c.tema, L)),
        author: { "@type": "Person", name: "Michele Signorella" },
        publisher: { "@type": "Organization", name: "MikiLab", url: "https://mikilab.de" },
      });
      document.head.appendChild(el);
      meta = document.querySelector('meta[name="description"]');
      if (meta) prima = meta.getAttribute("content");
      else { meta = document.createElement("meta"); meta.setAttribute("name", "description"); document.head.appendChild(meta); creata = true; }
      meta.setAttribute("content", ui.sotto);
    } catch (e) { /* niente */ }
    return () => {
      try { if (el) el.remove(); if (meta) { if (creata) meta.remove(); else if (prima !== null) meta.setAttribute("content", prima); } } catch (e) { /* niente */ }
    };
  }, [L, ui.titolo, ui.sotto]);

  const agendaData = (q.agenda && q.agenda[classe]) || "";
  const mettiInAgenda = () => scaricaAgenda(c, agendaData, L, ui);

  const sezioni = ["programma", "giochi", "colora", "parole", "quaderno", "guida", "attestato"];

  return (
    <div className="mks">
      <style>{CSS}</style>
      <header className="mks-hero">
        <div className="mks-hero-in">
          <div className="mks-hero-riga">
            <h1>{ui.titolo}</h1>
            <button className="mks-lingua" onClick={cambiaLingua} aria-label={ui.lingua}>{ui.lingua}</button>
          </div>
          <div className="mk-oro-line" aria-hidden="true" />
          <p className="mks-sotto">{ui.sotto}</p>
          {lang === "en" && <p className="mks-nota">{ui.en}</p>}
          <blockquote className="mks-michele">
            <p>{T(INTRO.michele, L)}</p>
            <cite>— {T(INTRO.firma, L)}</cite>
          </blockquote>
          <p className="mks-nota mks-sitor-nota">{ui.sitor}</p>
        </div>
      </header>

      <nav className="mks-nav" aria-label="MikiLab a scuola">
        {sezioni.map((s) => (
          <button key={s} className={"mks-pill" + (sezione === s ? " on" : "")} aria-current={sezione === s ? "page" : undefined} onClick={() => setSezione(s)}>{ui.sezioni[s]}</button>
        ))}
      </nav>

      <main className="mks-main">
        {sezione === "programma" && (
          <section className="mks-sez" aria-labelledby="mks-prog-h">
            <h2 id="mks-prog-h" className="mks-sr">{ui.sezioni.programma}</h2>
            <Pani classe={classe} onScegli={scegliClasse} lang={L} />
            <div className="mks-classe">
              <p className="mks-classe-n">{T(c.nome, L)} · {T(c.eta, L)}</p>
              <h3 className="mks-classe-tema">{T(c.tema, L)}</h3>
              <p className="mks-classe-motto">«{T(c.motto, L)}»</p>
            </div>
            <ol className="mks-lezioni">
              {c.lezioni.map((l, i) => (
                <Lezione key={`${c.n}-${i}`} classe={c.n} i={i} l={l} lang={L}
                  aperta={aperta === i} onApri={() => setAperta(aperta === i ? -1 : i)}
                  fatta={!!q.fatte[`${c.n}-${i}`]}
                  onFatta={() => setQ({ ...q, fatte: { ...q.fatte, [`${c.n}-${i}`]: !q.fatte[`${c.n}-${i}`] } })}
                  onStampa={() => setStampa({ tipo: "lezione", classe: c.n, i })} />
              ))}
            </ol>
            <div className="mks-agenda">
              <label>{ui.primaLezione}
                <input type="date" value={agendaData} onChange={(e) => setQ({ ...q, agenda: { ...(q.agenda || {}), [classe]: e.target.value } })} />
              </label>
              <button className="mks-btn" onClick={mettiInAgenda} disabled={!agendaData}>{ui.agenda}</button>
              <button className="mks-btn" onClick={() => setStampa({ tipo: "poster" })}>{ui.poster}</button>
              <p className="mks-nota">{ui.agendaNota}</p>
            </div>
            <p className="mks-nota">{ui.perBambini} <Link to="/piccoli">{ui.paneDeiPiccoli}</Link>.</p>
          </section>
        )}
        {sezione === "giochi" && <Giochi lang={L} />}
        {sezione === "colora" && <Colora lang={L} onStampa={(i) => setStampa({ tipo: "disegno", i })} onStampaFilastrocca={() => setStampa({ tipo: "filastrocca" })} />}
        {sezione === "parole" && <Parole lang={L} />}
        {sezione === "quaderno" && <Quaderno q={q} setQ={setQ} lang={L} />}
        {sezione === "guida" && <Guida lang={L} onStampaLettera={() => setStampa({ tipo: "lettera" })} />}
        {sezione === "attestato" && <Attestato q={q} classe={classe} lang={L} onStampa={() => setStampa({ tipo: "attestato", classe })} />}
      </main>

      <Stampa cosa={stampa} q={q} lang={L} />
    </div>
  );
}

const CSS = `
.mks{--mks-carta:#FBFAF5;--mks-inchiostro:#2B241E;--mks-verde:var(--mk-verde,#2F6B4F);--mks-oro:var(--mk-oro,#C9A24D);--mks-crosta:#B9743A;--mks-crosta2:#8A4F22;--mks-margine:#D9534F;--mks-quadretti:#E1E8EF;--mks-linea:#E6E1D6;
  color:var(--mks-inchiostro);background:var(--mks-carta);line-height:1.5;-webkit-font-smoothing:antialiased}
.mks *{box-sizing:border-box}
.mks-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.mks a{color:var(--mks-verde);text-decoration:underline;text-underline-offset:2px}
.mks button{font:inherit;cursor:pointer}
.mks button:focus-visible,.mks input:focus-visible,.mks textarea:focus-visible{outline:3px solid var(--mks-oro);outline-offset:2px}
.mks h1,.mks h2,.mks h3,.mks h4{margin:0;line-height:1.15;font-weight:700}
.mks-hero{background-color:#F7F5EC;background-image:linear-gradient(var(--mks-quadretti) 1px,transparent 1px),linear-gradient(90deg,var(--mks-quadretti) 1px,transparent 1px);background-size:24px 24px;border-bottom:1px solid var(--mks-linea)}
.mks-hero-in{max-width:880px;margin:0 auto;padding:1.75rem 1.1rem 1.5rem}
.mks-hero-riga{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}
.mks-hero h1{font-size:clamp(1.9rem,4.5vw,2.8rem);letter-spacing:-.01em;color:var(--mks-verde)}
.mks-lingua{border:1px solid var(--mks-verde);color:var(--mks-verde);background:#fff;border-radius:999px;padding:.3rem .8rem;font-size:.85rem;white-space:nowrap}
.mks-hero .mk-oro-line{height:2px;background:var(--mks-oro);width:5.5rem;margin:.6rem 0 .8rem}
.mks-sotto{font-size:1.1rem;max-width:40rem;margin:0}
.mks-michele{margin:1.2rem 0 0;padding:.9rem 1rem .9rem 1.1rem;background:#fff;border-left:4px solid var(--mks-crosta);max-width:44rem;border-radius:0 6px 6px 0}
.mks-michele p{margin:0 0 .4rem;font-size:1rem}
.mks-michele cite{font-style:normal;color:var(--mks-crosta2)}
.mks-nota{font-size:.9rem;color:#5B5248;margin:.6rem 0 0;max-width:44rem}
.mks-sitor-nota{margin-top:.8rem}
.mks-nav{position:sticky;top:0;z-index:5;display:flex;gap:.45rem;overflow-x:auto;padding:.6rem 1.1rem;background:var(--mks-carta);border-bottom:1px solid var(--mks-linea);scrollbar-width:none}
.mks-nav::-webkit-scrollbar{display:none}
.mks-pill{border:1px solid #C9C2B4;background:#fff;color:var(--mks-inchiostro);border-radius:999px;padding:.45rem .95rem;white-space:nowrap;font-size:.95rem}
.mks-pill.on{background:var(--mks-verde);border-color:var(--mks-verde);color:#fff}
.mks-pill-riga{display:flex;flex-wrap:wrap;gap:.45rem;margin:.6rem 0 1rem}
.mks-main{max-width:880px;margin:0 auto;padding:1.2rem 1.1rem 3rem}
.mks-sez h2{font-size:1.5rem;color:var(--mks-verde);margin-bottom:.4rem}
.mks-sez h3{font-size:1.15rem;margin:1.4rem 0 .5rem;color:var(--mks-crosta2)}
.mks-sez h4{font-size:.95rem;margin:1rem 0 .25rem;color:var(--mks-verde)}
.mks-sez p{margin:.25rem 0}
.mks-pani{display:flex;align-items:flex-end;justify-content:space-between;gap:.3rem;padding:.6rem .2rem 0;max-width:34rem}
.mks-pane{display:flex;flex-direction:column;align-items:center;gap:.15rem;background:none;border:0;padding:.4rem .3rem .3rem;border-radius:10px;color:var(--mks-inchiostro)}
.mks-pane.on{background:#fff;box-shadow:inset 0 -3px 0 var(--mks-verde)}
.mks-pane-n{font-weight:700;font-size:1.05rem}
.mks-pane-eta{font-size:.72rem;color:#5B5248}
.mks-classe{margin:1.2rem 0 .8rem}
.mks-classe-n{color:var(--mks-crosta2);font-size:.9rem}
.mks-classe-tema{font-size:1.6rem;color:var(--mks-verde)}
.mks-classe-motto{color:#5B5248;font-style:italic}
.mks-lezioni{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.6rem}
.mks-lez{background:#fff;border:1px solid var(--mks-linea);border-radius:8px;position:relative;overflow:hidden}
.mks-lez::before{content:"";position:absolute;left:3.1rem;top:0;bottom:0;width:1px;background:var(--mks-margine);opacity:.55}
.mks-lez.done{border-color:var(--mks-oro)}
.mks-lez-testa{display:flex;align-items:center;gap:.9rem;width:100%;text-align:left;background:none;border:0;padding:.85rem 1rem .85rem .9rem;color:inherit}
.mks-lez-num{width:1.6rem;flex:none;font-weight:700;font-size:1.25rem;color:var(--mks-crosta2);text-align:center}
.mks-lez-titolo{display:flex;flex-direction:column;flex:1;min-width:0}
.mks-lez-titolo b{font-size:1.08rem}
.mks-lez-titolo small{color:#5B5248;font-size:.85rem}
.mks-lez-stato{flex:none;width:1.6rem;height:1.6rem;border-radius:50%;border:1px solid #C9C2B4;display:grid;place-items:center;font-size:1rem;color:var(--mks-verde)}
.mks-lez.done .mks-lez-stato{background:var(--mks-oro);border-color:var(--mks-oro);color:#fff}
.mks-lez-corpo{padding:0 1rem 1rem 3.9rem}
.mks-lez-corpo ol{margin:.2rem 0 0;padding-left:1.2rem}
.mks-lez-corpo li{margin:.25rem 0}
.mks-impara{font-size:1.02rem}
.mks-sitor{margin:1rem 0 .2rem;padding:.7rem .9rem;background:#EEF4F0;border-left:3px solid var(--mks-verde);border-radius:0 6px 6px 0}
.mks-sitor-e{font-size:.8rem;color:var(--mks-verde);font-weight:700}
.mks-sitor p{margin:.15rem 0 0;font-size:1.05rem}
.mks-avviso{color:#8A3B1F;margin-top:.6rem}
.mks-attrezzo{margin-top:.6rem}
.mks-azioni{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:1rem}
.mks-btn{border:1px solid var(--mks-verde);background:#fff;color:var(--mks-verde);border-radius:6px;padding:.5rem .9rem;font-size:.95rem}
.mks-btn.pieno{background:var(--mks-verde);color:#fff}
.mks-btn.leggero{border-color:#C9C2B4;color:#5B5248;margin-top:1rem}
.mks-gioco{background:#fff;border:1px solid var(--mks-linea);border-radius:8px;padding:1rem 1rem 1.1rem;max-width:40rem}
.mks-conta{font-size:.85rem;color:#5B5248}
.mks-domanda{font-size:1.2rem;font-weight:700;margin:.2rem 0 .8rem}
.mks-opzioni{display:flex;flex-direction:column;gap:.45rem}
.mks-opz{text-align:left;background:#FBFAF5;border:1px solid #C9C2B4;border-radius:6px;padding:.6rem .8rem;color:inherit;font-size:1rem}
.mks-opz.giusta{background:#E4F1E8;border-color:var(--mks-verde);font-weight:700}
.mks-opz.sbagliata{background:#F8E4E2;border-color:var(--mks-margine)}
.mks-spiega{margin-top:.8rem;display:flex;flex-direction:column;gap:.5rem;align-items:flex-start}
.mks-fine .mks-grande{font-size:1.4rem;font-weight:700;color:var(--mks-verde)}
.mks-disegni{display:grid;grid-template-columns:repeat(auto-fill,minmax(11rem,1fr));gap:.7rem;margin:.9rem 0 .5rem}
.mks-disegno{background:#fff;border:1px solid var(--mks-linea);border-radius:8px;padding:.6rem;text-align:center}
.mks-disegno-img svg{width:100%;height:auto;display:block}
.mks-disegno p{margin:.3rem 0 .5rem}
.mks-versi{background:#fff;border:1px solid var(--mks-linea);border-left:4px solid var(--mks-crosta);border-radius:0 8px 8px 0;padding:.8rem 1rem;max-width:30rem;margin:.6rem 0 .8rem;font-size:1.08rem;line-height:1.6}
.mks-versi p{margin:0}
.mks-parole{display:grid;grid-template-columns:repeat(auto-fill,minmax(15rem,1fr));gap:.6rem;margin:.8rem 0 0}
.mks-parola{background:#fff;border:1px solid var(--mks-linea);border-radius:8px;padding:.7rem .85rem}
.mks-parola dt{font-weight:700;color:var(--mks-crosta2)}
.mks-parola dd{margin:.15rem 0 0;font-size:.95rem}
.mks-form{display:grid;grid-template-columns:repeat(auto-fill,minmax(15rem,1fr));gap:.7rem;margin:.9rem 0}
.mks-form label,.mks-appunti{display:flex;flex-direction:column;gap:.25rem;font-size:.9rem;color:#5B5248}
.mks-form input,.mks-appunti textarea{font:inherit;color:var(--mks-inchiostro);padding:.55rem .65rem;border:1px solid #C9C2B4;border-radius:6px;background:#fff;font-size:1rem}
.mks-appunti{margin-top:1.2rem}
.mks-lievito{font-size:1.05rem;background:#fff;border:1px dashed var(--mks-oro);border-radius:8px;padding:.6rem .8rem;display:inline-block}
.mks-timbri{display:flex;flex-direction:column;gap:.6rem}
.mks-timbro-riga{background:#fff;border:1px solid var(--mks-linea);border-radius:8px;padding:.7rem .85rem}
.mks-timbro-riga.oro{border-color:var(--mks-oro);box-shadow:inset 0 0 0 1px var(--mks-oro)}
.mks-timbro-testa{display:flex;flex-wrap:wrap;gap:.4rem .7rem;align-items:baseline}
.mks-timbro-testa span{color:#5B5248;font-size:.9rem}
.mks-timbro-cerchi{display:flex;gap:.4rem;margin:.5rem 0 .3rem}
.mks-timbro{width:2.1rem;height:2.1rem;border-radius:50%;border:1.5px dashed #C9C2B4;background:#fff;color:#8C8378;font-weight:700}
.mks-timbro.on{border:1.5px solid var(--mks-crosta2);background:var(--mks-crosta);color:#fff}
.mks-timbro-riga small{color:#5B5248}
.mks-lista{margin:.3rem 0 0;padding-left:1.2rem}
.mks-lista li{margin:.3rem 0}
.mks-materie{margin:.3rem 0 0}
.mks-materie div{display:grid;grid-template-columns:9rem 1fr;gap:.6rem;padding:.35rem 0;border-bottom:1px solid var(--mks-linea)}
.mks-materie dt{font-weight:700;color:var(--mks-verde)}
.mks-materie dd{margin:0}
.mks-lettera{background:#fff;border:1px solid var(--mks-linea);border-radius:8px;padding:1rem 1.1rem;max-width:44rem;margin-bottom:.7rem}
.mks-lettera p{margin:.45rem 0}
.mks-campo{color:#5B5248}
.mks-att{background:#fff;border:2px solid var(--mks-oro);outline:1px solid var(--mks-oro);outline-offset:4px;border-radius:4px;padding:1.5rem 1.2rem;max-width:44rem;text-align:center;margin:1rem .3rem 1.2rem}
.mks-att-pani{display:flex;justify-content:center;align-items:flex-end;gap:.4rem}
.mks-att-t{font-size:1.5rem;font-weight:700;color:var(--mks-verde);margin:.6rem 0 .4rem}
.mks-att-testo{font-size:1.1rem}
.mks-att-motto{color:#5B5248;font-style:italic}
.mks-att-righe,.mks-att-firme{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.4rem 1rem;margin-top:1.1rem;font-size:.92rem;color:#5B5248}
.mks-agenda{margin-top:1.2rem;background:#fff;border:1px solid var(--mks-linea);border-radius:8px;padding:.8rem .9rem;display:flex;flex-wrap:wrap;gap:.6rem;align-items:flex-end}
.mks-agenda label{display:flex;flex-direction:column;gap:.25rem;font-size:.9rem;color:#5B5248}
.mks-agenda input{font:inherit;color:var(--mks-inchiostro);padding:.5rem .6rem;border:1px solid #C9C2B4;border-radius:6px;background:#fff;font-size:1rem}
.mks-agenda .mks-btn:disabled{opacity:.5;cursor:not-allowed}
.mks-agenda .mks-nota{flex-basis:100%;margin:0}
.mks-print{display:none}
@media (max-width:560px){
  .mks-lez::before{left:2.6rem}
  .mks-lez-corpo{padding-left:1rem}
  .mks-materie div{grid-template-columns:1fr}
  .mks-pane-eta{display:none}
  .mks-pani{gap:.1rem}
  .mks-pane{padding:.3rem .15rem .25rem}
}
@media print{
  body.mks-printing *{visibility:hidden}
  body.mks-printing .mks-print,body.mks-printing .mks-print *{visibility:visible}
  body.mks-printing .mks-print{display:block;position:absolute;left:0;top:0;width:100%;padding:10mm 12mm;background:#fff;color:#000;font-size:12pt;line-height:1.45}
  .mks-print h1{font-size:20pt;margin:2mm 0 1mm}
  .mks-print-testa{font-size:9pt;color:#555;border-bottom:1px solid #999;padding-bottom:2mm;margin-bottom:3mm}
  .mks-print-meta{color:#555}
  .mks-print-pie{margin-top:8mm;font-size:9pt;color:#555;border-top:1px solid #999;padding-top:2mm}
  .mks-print .mks-att{border:2px solid #000;outline:1px solid #000;margin:6mm auto;page-break-inside:avoid}
  .mks-print-svg svg{width:170mm;height:170mm;display:block;margin:6mm auto}
  .mks-print-iosono{font-size:14pt;margin-top:6mm}
  .mks-print-versi p{margin:0;font-size:16pt;line-height:1.7}
  .mks-poster-t{text-align:center}
  .mks-poster{display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin-top:4mm}
  .mks-poster-b{border:1px solid #000;padding:3mm 4mm;page-break-inside:avoid;font-size:10.5pt}
  .mks-poster-b p{margin:0}
  .mks-poster-tema{font-weight:700;font-size:12pt;margin-bottom:1mm}
  .mks-poster-b ol{margin:1mm 0 0;padding-left:5mm}
}
`;
