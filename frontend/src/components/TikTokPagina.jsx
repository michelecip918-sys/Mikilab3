import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Music2, Search, Camera, ExternalLink, Star, Play } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { recipesApi, api } from "@/lib/api";
import { rLoc } from "@/lib/loc";
import { useAuth } from "@/auth/AuthContext";
import { idDaCodice, codiceDi } from "@/lib/codici";
import { TIKTOK_PROFILO } from "@/lib/tiktok";

// V132 — MIKILAB SU TIKTOK (mikilab.de/tiktok, da mettere nel profilo TikTok). Chi arriva da un video scrive il numero
// della ricetta e la apre; qui ci sono i video di Michele e come fare il proprio. Per Michele (admin): le prossime da filmare.

function numeroDallIndirizzo() {
  try { const m = (window.location.pathname || "").match(/^\/(?:(?:it|de|en)\/)?(\d{1,4})\/?$/); return m ? m[1] : ""; } catch { return ""; }
}

export default function TikTokPagina({ onBack, onNav }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const { user } = useAuth();
  const isAdmin = !!(user && user.role === "admin");
  const [num, setNum] = useState(numeroDallIndirizzo);
  const [errore, setErrore] = useState(() => !!numeroDallIndirizzo()); // arrivato qui con un numero: quel numero non esiste
  const [ricette, setRicette] = useState(null);
  const [extra, setExtra] = useState({});
  useEffect(() => {
    let ok = true;
    recipesApi.list("mikilab").then((r) => { if (ok) setRicette(r || []); }).catch(() => { if (ok) setRicette([]); });
    api.get("/recipe-extras").then((r) => { if (ok) setExtra(r.data || {}); }).catch(() => { /* */ });
    return () => { ok = false; };
  }, []);

  const apri = (id) => {
    window.__mikilabPendingRecipe = id;
    if (onNav) onNav("recipes");
    setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 150);
  };
  const vai = () => { const id = idDaCodice(String(num).trim()); if (!id) { setErrore(true); return; } setErrore(false); apri(id); };
  const conVideo = useMemo(() => (ricette || []).filter((r) => extra[r.id] && extra[r.id].video)
    .sort((a, b) => String((extra[b.id] || {}).video_at || "").localeCompare(String((extra[a.id] || {}).video_at || ""))), [ricette, extra]);
  const daFilmare = useMemo(() => (!isAdmin ? [] : (ricette || []).filter((r) => { const x = extra[r.id]; return x && !x.video && (x.status === "tested" || x.real_photo); }).slice(0, 12)), [ricette, extra, isAdmin]);

  const card = (r) => (
    <button key={r.id} data-testid={`tiktok-card-${r.id}`} onClick={() => apri(r.id)} className="text-left rounded-2xl border border-border bg-background overflow-hidden hover:border-primary active:scale-[0.98] transition-all">
      <div className="aspect-[4/3] bg-muted relative">
        {r.image_url && <img src={r.image_url} alt="" loading="lazy" className="w-full h-full object-cover" />}
        {extra[r.id] && extra[r.id].video && <span className="absolute bottom-1.5 left-1.5 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow"><Play className="w-3.5 h-3.5" /></span>}
      </div>
      {codiceDi(r.id) ? <p className="px-2.5 pt-2 text-[11.5px] font-bold text-primary">{tri("N.", "Nr.", "No.")} {codiceDi(r.id)}</p> : null}
      <p className="px-2.5 pb-2.5 pt-0.5 font-bold text-foreground text-sm leading-snug">{rLoc(r, "name", lang)}</p>
    </button>
  );

  return (
    <div data-testid="tiktok-pagina" className="max-w-2xl mx-auto px-1 sm:px-4 py-4 space-y-5">
      <button onClick={onBack} className="no-print inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div>
        <h1 className="font-display text-2xl font-black text-foreground flex items-center gap-2"><Music2 className="w-6 h-6 text-primary" />{tri("MikiLab su TikTok", "MikiLab auf TikTok", "MikiLab on TikTok")}</h1>
        <div className="mk-oro-line mt-2 mb-1" />
        <p className="text-[14px] text-foreground/85 leading-relaxed">{tri(
          "Ogni ricetta di MikiLab ha un numero. Nei video Michele lo dice e lo scrive: mettilo qui e la ricetta si apre, intera e gratis.",
          "Jedes MikiLab-Rezept hat eine Nummer. In den Videos sagt und schreibt Michele sie: gib sie hier ein und das Rezept öffnet sich, ganz und kostenlos.",
          "Every MikiLab recipe has a number. In the videos Michele says it and writes it: type it here and the recipe opens, complete and free.")}</p>
      </div>

      <section className="rounded-2xl border-2 border-primary/50 bg-card p-4 space-y-2">
        <label htmlFor="tiktok-numero" className="block text-[13.5px] font-bold text-foreground">{tri("Il numero della ricetta", "Die Rezeptnummer", "The recipe number")}</label>
        <div className="flex gap-2">
          <input id="tiktok-numero" data-testid="tiktok-numero" inputMode="numeric" pattern="[0-9]*" value={num}
            onChange={(e) => { setNum(e.target.value.replace(/\D/g, "").slice(0, 4)); setErrore(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") vai(); }} placeholder="42"
            className="w-28 rounded-xl border border-border bg-background px-3 py-2.5 text-lg font-bold text-foreground text-center outline-none focus:border-primary" />
          <button data-testid="tiktok-apri" onClick={vai} disabled={!num} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95 disabled:opacity-50">
            <Search className="w-4 h-4" />{tri("Apri la ricetta", "Rezept öffnen", "Open the recipe")}
          </button>
        </div>
        {errore && num && (
          <p data-testid="tiktok-numero-errore" className="text-[12.5px] text-mattone">{tri(`Il numero ${num} non c'è. Controlla il video, oppure cerca la ricetta per nome.`, `Die Nummer ${num} gibt es nicht. Schau noch einmal ins Video oder such das Rezept nach Namen.`, `Number ${num} doesn't exist. Check the video, or search for the recipe by name.`)}{" "}
            <button onClick={() => onNav && onNav("cerca")} className="font-bold text-primary underline">{tri("Cerca", "Suchen", "Search")}</button></p>
        )}
        <p className="text-[12px] text-muted-foreground">{tri("Puoi anche scrivere l'indirizzo col numero: mikilab.de/42.", "Du kannst auch die Adresse mit der Nummer eingeben: mikilab.de/42.", "You can also type the address with the number: mikilab.de/42.")}</p>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold text-foreground">{tri("I video di Michele", "Micheles Videos", "Michele's videos")}</h2>
        <p className="text-[12.5px] text-muted-foreground mb-2.5">{tri("Tocca una ricetta: il video è dentro, con tutte le dosi sotto.", "Tippe auf ein Rezept: das Video ist drin, mit allen Mengen darunter.", "Tap a recipe: the video is inside, with every amount below it.")}</p>
        {ricette === null ? <p className="text-muted-foreground text-sm">{tri("Caricamento…", "Wird geladen…", "Loading…")}</p>
          : conVideo.length ? <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{conVideo.map(card)}</div>
          : <p className="text-[13px] text-foreground/85">{tri("I primi video arrivano presto. Intanto segui MikiLab su TikTok.", "Die ersten Videos kommen bald. Folge MikiLab bis dahin auf TikTok.", "The first videos are coming soon. Meanwhile, follow MikiLab on TikTok.")}</p>}
        <a data-testid="tiktok-segui" href={TIKTOK_PROFILO} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-background text-sm font-bold text-foreground active:scale-95">
          <ExternalLink className="w-4 h-4" />{tri("Segui @mikilab.de su TikTok", "Folge @mikilab.de auf TikTok", "Follow @mikilab.de on TikTok")}
        </a>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2"><Camera className="w-5 h-5 text-primary" />{tri("Fai anche tu il video", "Mach auch du ein Video", "Make your own video")}</h2>
        <ol className="mt-2 space-y-1.5 list-decimal pl-5 text-[13.5px] text-foreground/90 leading-relaxed">
          <li>{tri("Apri una ricetta: sotto trovi «Fai il video di questa ricetta».", "Öffne ein Rezept: darunter findest du «Mach ein Video von diesem Rezept».", "Open a recipe: below it you'll find «Make a video of this recipe».")}</li>
          <li>{tri("Segui il copione: poche scene da pochi secondi, con le scritte già pronte.", "Folge dem Drehbuch: ein paar Szenen von wenigen Sekunden, die Texte sind schon fertig.", "Follow the script: a few scenes of a few seconds, with the captions ready.")}</li>
          <li>{tri("Pubblica con #MikiLab, tagga @mikilab.de e scrivi il numero della ricetta. Michele guarda i vostri video: i più belli finiscono sotto la ricetta, in «I vostri video».", "Veröffentliche mit #MikiLab, markiere @mikilab.de und schreib die Rezeptnummer dazu. Michele schaut eure Videos an: die schönsten kommen unter das Rezept, in «Eure Videos».", "Post with #MikiLab, tag @mikilab.de and write the recipe number. Michele watches your videos: the best ones end up under the recipe, in «Your videos».")}</li>
        </ol>
      </section>

      {isAdmin && (
        <section data-testid="tiktok-admin" className="rounded-2xl border border-primary/40 bg-primary/5 p-4">
          <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2"><Star className="w-5 h-5 text-primary" />{tri("Per te, Michele: le prossime da filmare", "Für dich, Michele: die nächsten zum Filmen", "For you, Michele: the next ones to film")}</h2>
          <p className="text-[12.5px] text-muted-foreground mt-1 mb-2.5">{tri("Ricette provate o con la tua foto, ancora senza video. Nel profilo TikTok metti mikilab.de/tiktok: chi arriva da un video trova subito questa pagina. Nella ricetta, «Il copione del tuo video» ti prepara scene e didascalia.", "Erprobte Rezepte oder mit deinem Foto, noch ohne Video. Im TikTok-Profil mikilab.de/tiktok eintragen: wer von einem Video kommt, landet direkt hier. Im Rezept bereitet «Das Drehbuch für dein Video» Szenen und Beschreibung vor.", "Tested recipes or with your photo, still without a video. Put mikilab.de/tiktok in your TikTok profile: people coming from a video land here. In the recipe, «The script for your video» prepares scenes and caption.")}</p>
          {daFilmare.length ? <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{daFilmare.map(card)}</div>
            : <p className="text-[13px] text-foreground/85">{tri("Nessuna per ora.", "Im Moment keine.", "None for now.")}</p>}
        </section>
      )}
    </div>
  );
}
