// MikiLab a scuola — card in Home (v110). Nessun dato, nessuna rete: solo un invito.
import React from "react";
import { Link } from "react-router-dom";
import { guessLang } from "./lib/scuolaDiPane";

const TESTI = {
  it: { e: "Per l'asilo e per la scuola", t: "MikiLab a scuola", s: "Il programma del pane dall'asilo alla quinta: attività e lezioni pronte per educatrici, maestre e maestri, giochi, le parole del pane, il quaderno della classe. Gratis.", b: "Apri il programma", k: "Sei piccolo? Il pane dei piccoli" },
  de: { e: "Für Kita und Schule", t: "MikiLab in der Schule", s: "Das Brotprogramm von der Kita bis zur fünften Klasse: fertige Angebote und Stunden für Erzieherinnen und Lehrkräfte, Spiele, die Wörter des Brotes, das Klassenheft. Kostenlos.", b: "Programm öffnen", k: "Bist du klein? Das Brot der Kleinen" },
  en: { e: "For kindergarten and school", t: "MikiLab at school", s: "A bread programme from kindergarten to fifth grade: ready activities and lessons for teachers, games, the words of bread, the class notebook. Free, in Italian and German.", b: "Open the programme", k: "For the little ones: Il pane dei piccoli" },
};

function Panino({ w, c }) {
  return (
    <svg viewBox="0 0 64 44" width={w} height={w * 0.69} aria-hidden="true" focusable="false">
      <path d="M6 34 C6 16 18 8 32 8 C46 8 58 16 58 34 C58 38 54 40 50 40 H14 C10 40 6 38 6 34 Z" fill={c} />
      <path d="M22 18 C29 13 39 14 46 21" fill="none" stroke="#F3DDBE" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export default function ScuolaInHome() {
  const lang = guessLang();
  const t = TESTI[lang] || TESTI.it;
  return (
    <section className="mks-home" aria-label={t.t}>
      <style>{`
.mks-home{margin:1.2rem auto;max-width:880px;padding:0 1.1rem}
.mks-home-in{display:flex;gap:1.1rem;align-items:center;flex-wrap:wrap;background:#F7F5EC;background-image:linear-gradient(#E1E8EF 1px,transparent 1px),linear-gradient(90deg,#E1E8EF 1px,transparent 1px);background-size:24px 24px;border:1px solid #E6E1D6;border-radius:10px;padding:1rem 1.1rem}
.mks-home-pani{display:flex;align-items:flex-end;gap:.15rem;flex:none}
.mks-home-testo{flex:1;min-width:14rem;color:#2B241E}
.mks-home-e{margin:0;font-size:.85rem;color:#8A4F22}
.mks-home-t{margin:.1rem 0 .3rem;font-size:1.35rem;font-weight:700;color:var(--mk-verde,#2F6B4F);line-height:1.15}
.mks-home-s{margin:0 0 .7rem;font-size:.97rem;line-height:1.45}
.mks-home-b{display:inline-block;background:var(--mk-verde,#2F6B4F);color:#fff;text-decoration:none;border-radius:6px;padding:.5rem .95rem;font-size:.95rem}
.mks-home-k{display:inline-block;margin-left:.9rem;font-size:.9rem;color:var(--mk-verde,#2F6B4F)}
.mks-home-b:focus-visible,.mks-home-k:focus-visible{outline:3px solid var(--mk-oro,#C9A24D);outline-offset:2px}
      `}</style>
      <div className="mks-home-in">
        <div className="mks-home-pani">
          <Panino w={20} c="#B9743A" /><Panino w={26} c="#B9743A" /><Panino w={32} c="#B9743A" /><Panino w={38} c="#8A4F22" /><Panino w={44} c="#B9743A" /><Panino w={50} c="#B9743A" />
        </div>
        <div className="mks-home-testo">
          <p className="mks-home-e">{t.e}</p>
          <p className="mks-home-t">{t.t}</p>
          <p className="mks-home-s">{t.s}</p>
          <Link className="mks-home-b" to="/scuola">{t.b}</Link>
          <Link className="mks-home-k" to="/piccoli">{t.k}</Link>
        </div>
      </div>
    </section>
  );
}
