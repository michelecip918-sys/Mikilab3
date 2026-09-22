import { ChevronLeft, Heart, MapPin } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { TattooSignature } from "@/components/TattooSignature";

// V89 — "Da Miglionico a Stoccarda": la dedica di Michele al suo paese (Miglionico, provincia di Matera,
// Basilicata), alla sua famiglia e ai maestri che gli hanno insegnato l'arte bianca. Pagina statica,
// raggiungibile dal footer ("Da Miglionico"), da mikilab.de/miglionico e da "Il pane del mio paese".
// I NOMI: Michele li aggiunge qui sotto (nome + una parola su chi è). Finché la lista è vuota, la
// sezione dei nomi non compare. Testo scritto con Claude su indicazione di Michele: parole sue, non di Sitor.

const NOMI = [
  // { n: "Nome", r: { it: "chi è", de: "wer", en: "who" } },
];

const P = (it, de, en) => ({ it, de, en });
const TESTO = [
  P("Sono nato a Matera e vengo da Miglionico, un paese sulle sue colline, in Basilicata. Da lì sono partito, come tanti prima di me, con le mani e un mestiere. Oggi faccio il pane a Stoccarda, ma il forno che ho dentro è quello di casa.",
    "Ich bin in Matera geboren und komme aus Miglionico, einem Dorf auf seinen Hügeln, in der Basilikata. Von dort bin ich aufgebrochen, wie viele vor mir, mit meinen Händen und einem Handwerk. Heute backe ich Brot in Stuttgart, aber der Ofen in mir ist der von zu Hause.",
    "I was born in Matera and I come from Miglionico, a village on its hills, in Basilicata. From there I left, like many before me, with my hands and a trade. Today I bake bread in Stuttgart, but the oven inside me is the one from home."),
  P("MikiLab è nato per non dimenticare niente di quello che ho imparato, e per regalarlo. Ogni ricetta che c'è qui dentro passa da quel paese: dal grano duro delle nostre colline, dal pane grande che dura una settimana, dalla pazienza di chi aspetta che la pasta cresca senza guardare l'orologio.",
    "MikiLab ist entstanden, um nichts von dem zu vergessen, was ich gelernt habe, und um es zu verschenken. Jedes Rezept hier drin geht durch dieses Dorf: durch den Hartweizen unserer Hügel, das große Brot, das eine Woche hält, die Geduld derer, die den Teig gehen lassen, ohne auf die Uhr zu schauen.",
    "MikiLab was born so I would forget nothing of what I learned, and to give it away. Every recipe in here passes through that village: through the durum wheat of our hills, the big bread that lasts a week, the patience of those who let the dough rise without watching the clock."),
  P("Questa pagina è per Miglionico: per chi c'è rimasto e tiene accese le case, per chi è partito e se lo porta dietro come me, per chi ci tornerà.",
    "Diese Seite ist für Miglionico: für die, die geblieben sind und die Häuser am Leben halten, für die, die gegangen sind und es wie ich mit sich tragen, für die, die zurückkehren werden.",
    "This page is for Miglionico: for those who stayed and keep the houses alive, for those who left and carry it with them like me, for those who will come back."),
  P("È per la mia famiglia, che mi ha lasciato partire e non mi ha mai lasciato andare. Tutto quello che so fare con le mani comincia da loro.",
    "Sie ist für meine Familie, die mich hat gehen lassen und mich nie losgelassen hat. Alles, was ich mit den Händen kann, beginnt bei ihnen.",
    "It is for my family, who let me leave and never let me go. Everything I know how to do with my hands begins with them."),
  P("Ed è per i miei maestri, i panettieri di Miglionico: quelli che mi hanno messo le mani nella farina la prima volta, che mi hanno corretto senza tante parole, che mi hanno fatto rifare le cose finché non venivano. Se qui dentro c'è qualcosa di buono, è la loro voce che passa attraverso la mia.",
    "Und sie ist für meine Meister, die Bäcker von Miglionico: die, die mir zum ersten Mal die Hände ins Mehl gesteckt haben, die mich ohne viele Worte korrigiert haben, die mich alles so lange wiederholen ließen, bis es gelang. Wenn hier drin etwas Gutes ist, dann ist es ihre Stimme, die durch meine hindurchgeht.",
    "And it is for my masters, the bakers of Miglionico: those who put my hands in the flour for the first time, who corrected me without many words, who made me redo things until they came out right. If there is anything good in here, it is their voice passing through mine."),
  P("Il pane si fa così anche a mille chilometri da casa: con quello che ti hanno insegnato e con quello che devi ancora capire. Grazie, Miglionico. Questo forno è acceso anche per te.",
    "So backt man Brot auch tausend Kilometer von zu Hause: mit dem, was man dir beigebracht hat, und mit dem, was du noch verstehen musst. Danke, Miglionico. Dieser Ofen brennt auch für dich.",
    "That's how bread is made even a thousand kilometres from home: with what you were taught and with what you still have to understand. Thank you, Miglionico. This oven is on for you too."),
];

export default function Dedica({ onBack, onNav }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => o[lang] || o.it;
  return (
    <div data-testid="dedica-page" className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <button data-testid="dedica-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>

      <div className="rounded-3xl border border-primary/30 bg-background/70 overflow-hidden">
        <svg viewBox="0 0 600 140" className="w-full block" aria-hidden>
          <rect width="600" height="140" fill="hsl(var(--muted))" />
          <path d="M0 105 C 80 70, 140 95, 200 78 C 250 64, 290 92, 340 82 C 400 70, 450 100, 520 76 C 560 64, 585 70, 600 66 L600 140 L0 140 Z" fill="#D9A566" opacity="0.7" />
          <path d="M0 120 C 90 100, 160 118, 240 104 C 320 90, 380 118, 470 102 C 530 92, 570 104, 600 98 L600 140 L0 140 Z" fill="#A15621" opacity="0.55" />
          <circle cx="90" cy="74" r="4" fill="#2B2E33" /><text x="90" y="60" textAnchor="middle" fontSize="12" fontWeight="700" fill="hsl(var(--foreground))">Miglionico</text>
          <circle cx="510" cy="70" r="4" fill="#2B2E33" /><text x="510" y="56" textAnchor="middle" fontSize="12" fontWeight="700" fill="hsl(var(--foreground))">Stuttgart</text>
          <path d="M90 74 C 200 20, 400 20, 510 70" fill="none" stroke="#597362" strokeWidth="2" strokeDasharray="4 5" />
          <text x="300" y="28" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">{tri("~1500 km, un forno solo", "~1500 km, ein einziger Ofen", "~1500 km, one oven")}</text>
        </svg>
        <div className="p-5 sm:p-7">
          <p className="font-mono-data text-[10px] tracking-[0.28em] uppercase text-primary flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{tri("Miglionico (Matera), Basilicata", "Miglionico (Matera), Basilikata", "Miglionico (Matera), Basilicata")}</p>
          <h1 className="font-display text-3xl font-black text-foreground leading-tight mt-1">{tri("Da Miglionico a Stoccarda", "Von Miglionico nach Stuttgart", "From Miglionico to Stuttgart")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{tri("Una dedica di Michele al suo paese, alla sua famiglia e ai suoi maestri.", "Eine Widmung von Michele an sein Dorf, seine Familie und seine Meister.", "A dedication from Michele to his village, his family and his masters.")}</p>
          <div className="mt-5 space-y-4">
            {TESTO.map((p, i) => <p key={i} className={`text-[15px] leading-relaxed text-foreground/90 ${i === TESTO.length - 1 ? "font-bold text-foreground" : ""}`}>{L(p)}</p>)}
          </div>
          {NOMI.length > 0 && (
            <div data-testid="dedica-nomi" className="mt-6 rounded-2xl border border-border bg-background p-4">
              <p className="font-bold text-foreground mb-2 flex items-center gap-2"><Heart className="w-4 h-4 text-mattone" />{tri("Grazie a", "Danke an", "Thanks to")}</p>
              <ul className="grid sm:grid-cols-2 gap-1.5">{NOMI.map((x, i) => <li key={i} className="text-[14px] text-foreground"><span className="font-bold">{x.n}</span>{x.r ? <span className="text-muted-foreground"> · {L(x.r)}</span> : null}</li>)}</ul>
            </div>
          )}
          <div className="mt-6"><TattooSignature testid="dedica-firma" /></div>
          <div className="mt-4 flex gap-2 flex-wrap">
            <button onClick={() => onNav && onNav("paese")} className="px-3 py-1.5 rounded-full text-xs font-bold border border-border bg-background text-foreground active:scale-95">{tri("I pani della Basilicata", "Die Brote der Basilikata", "The breads of Basilicata")}</button>
            <button onClick={() => onNav && onNav("recipes")} className="px-3 py-1.5 rounded-full text-xs font-bold border border-primary/40 bg-primary/10 text-foreground active:scale-95">{tri("Tutte le ricette", "Alle Rezepte", "All recipes")}</button>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">{tri("Se sei di Miglionico e vuoi dire qualcosa a Michele: lo trovi su TikTok, @mikilab.de.", "Wenn du aus Miglionico bist und Michele etwas sagen willst: du findest ihn auf TikTok, @mikilab.de.", "If you're from Miglionico and want to say something to Michele: he's on TikTok, @mikilab.de.")}</p>
    </div>
  );
}
