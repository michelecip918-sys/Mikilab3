import { useState } from "react";
import { Play, ExternalLink, Copy, Share2, Users, Plus, Trash2, ChevronDown, Music2, Camera } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { rLoc } from "@/lib/loc";
import { codiceDi } from "@/lib/codici";
import { videoIdTikTok, playerTikTok, didascaliaTikTok, copioneTikTok, autoreTikTok, TIKTOK_LINK_RE } from "@/lib/tiktok";

// V132 — TIKTOK DENTRO LA RICETTA.
// 1) Il video di Michele si guarda qui, senza uscire da MikiLab. Si carica solo quando la persona tocca «Carica il video»
//    (prima di quel tocco il browser non si collega a TikTok: vedi Privacy, punto 11).
// 2) «I vostri video»: i video di chi ha rifatto la ricetta, scelti da Michele da admin (link pubblici di TikTok, max 6).
// 3) «Fai il video di questa ricetta»: il copione a scene, i consigli, la didascalia pronta col numero della ricetta,
//    e il video del telefono passato a TikTok con la condivisione del telefono. Niente viene caricato su MikiLab.

export function VideoTikTok({ url, titolo, testid = "video-tiktok" }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [on, setOn] = useState(false);
  const id = videoIdTikTok(url);
  const fuori = (
    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-background text-sm font-bold text-foreground active:scale-95">
      <ExternalLink className="w-4 h-4" />{tri("Apri su TikTok", "Auf TikTok öffnen", "Open on TikTok")}
    </a>
  );
  if (!id) return <div data-testid={`${testid}-link`}>{fuori}</div>;
  if (!on) {
    return (
      <div data-testid={`${testid}-consenso`} className="rounded-xl border border-border bg-muted/40 p-3">
        <p className="text-[12px] text-muted-foreground leading-snug">{tri(
          "Il video è su TikTok. Se lo carichi qui, TikTok riceve il tuo indirizzo IP e i dati del browser (vedi Privacy).",
          "Das Video liegt bei TikTok. Wenn du es hier lädst, erhält TikTok deine IP-Adresse und Browserdaten (siehe Datenschutz).",
          "The video is on TikTok. If you load it here, TikTok receives your IP address and browser data (see Privacy).")}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <button data-testid={`${testid}-carica`} onClick={() => setOn(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95">
            <Play className="w-4 h-4" />{tri("Carica il video", "Video laden", "Load the video")}
          </button>
          {fuori}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="mx-auto w-full max-w-[340px] rounded-xl overflow-hidden border border-border bg-black" style={{ aspectRatio: "9 / 16" }}>
        <iframe data-testid={`${testid}-player`} src={playerTikTok(id)} title={titolo || "TikTok"} className="w-full h-full"
          allow="encrypted-media; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
      </div>
      <div className="flex justify-center">{fuori}</div>
    </div>
  );
}

export default function TikTokRicetta({ recipe, ex, isAdmin = false, onSave, saving = false, handle = "", hashtag = "#MikiLab" }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [apri, setApri] = useState(false);
  const [file, setFile] = useState(null);
  const [nuovo, setNuovo] = useState("");
  const codice = codiceDi(recipe.id);
  const nome = rLoc(recipe, "name", lang);
  const video = (ex && ex.video_url) || "";
  const vostri = ex && Array.isArray(ex.community_videos) ? ex.community_videos : [];
  const didascalia = didascaliaTikTok({ recipe, lang, codice, mia: isAdmin, handle: handle || undefined, hashtag });
  const cop = apri ? copioneTikTok(recipe, lang, codice) : null;

  const copia = async (zitto = false) => {
    try { await navigator.clipboard.writeText(didascalia); if (!zitto) toast.success(tri("Didascalia copiata: incollala su TikTok.", "Beschreibung kopiert: füge sie bei TikTok ein.", "Caption copied: paste it on TikTok.")); return true; }
    catch { if (!zitto) toast.error(tri("Non riesco a copiare: tieni premuto sul testo e copialo a mano.", "Kopieren geht nicht: halte den Text gedrückt und kopiere ihn von Hand.", "Can't copy: long-press the text and copy it by hand.")); return false; }
  };
  const scegli = (e) => { const f = e.target.files && e.target.files[0]; e.target.value = ""; if (f) setFile(f); };
  const manda = async () => {
    if (!file) return;
    await copia(true);
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: didascalia });
        toast.success(tri("Fatto. Su TikTok incolla la didascalia: è già copiata.", "Erledigt. Füge bei TikTok die Beschreibung ein: sie ist schon kopiert.", "Done. On TikTok paste the caption: it's already copied."));
        setFile(null);
        return;
      }
    } catch (err) { if (err && err.name === "AbortError") return; }
    toast(tri("Da qui il telefono non passa il video: apri TikTok, tocca + e scegli il video dalla galleria. La didascalia è già copiata.", "Von hier gibt das Handy das Video nicht weiter: öffne TikTok, tippe auf + und wähle das Video aus der Galerie. Die Beschreibung ist schon kopiert.", "Your phone can't pass the video from here: open TikTok, tap + and pick the video from your gallery. The caption is already copied."));
  };
  const aggiungi = () => {
    const u = nuovo.trim();
    if (!TIKTOK_LINK_RE.test(u)) { toast.error(tri("Serve un link di TikTok (https://www.tiktok.com/… o https://vm.tiktok.com/…).", "Nötig ist ein TikTok-Link (https://www.tiktok.com/… oder https://vm.tiktok.com/…).", "It needs a TikTok link (https://www.tiktok.com/… or https://vm.tiktok.com/…).")); return; }
    if (vostri.some((v) => v.url === u)) { setNuovo(""); return; }
    if (vostri.length >= 6) { toast.error(tri("Al massimo 6 video per ricetta: togline uno prima.", "Höchstens 6 Videos pro Rezept: entferne erst eins.", "At most 6 videos per recipe: remove one first.")); return; }
    if (onSave) onSave({ community_videos: [...vostri, { url: u, handle: autoreTikTok(u), added_at: new Date().toISOString() }] });
    setNuovo("");
  };
  const togli = (u) => { if (onSave) onSave({ community_videos: vostri.filter((v) => v.url !== u) }); };

  return (
    <section data-testid="tiktok-ricetta" className="no-print rounded-2xl border border-border bg-background p-3.5 space-y-3">
      <p className="text-[13.5px] font-bold text-foreground flex items-center gap-1.5">
        <Music2 className="w-4 h-4 text-primary" />{tri("Su TikTok", "Auf TikTok", "On TikTok")}
        {codice ? <span data-testid="tiktok-codice" className="ml-auto text-[11.5px] font-semibold text-muted-foreground">{tri("Ricetta n.", "Rezept Nr.", "Recipe no.")} {codice}</span> : null}
      </p>

      {video && (
        <div>
          <p className="text-[13px] font-semibold text-foreground mb-1.5">{tri("Guarda Michele che la fa", "Schau Michele beim Backen zu", "Watch Michele make it")}</p>
          <VideoTikTok url={video} titolo={`${nome} · TikTok`} testid="recipe-video-michele" />
        </div>
      )}

      {vostri.length > 0 && (
        <div data-testid="tiktok-vostri">
          <p className="text-[13px] font-semibold text-foreground flex items-center gap-1.5"><Users className="w-4 h-4 text-primary" />{tri("I vostri video", "Eure Videos", "Your videos")}</p>
          <p className="text-[11.5px] text-muted-foreground mb-2">{tri("Chi ha rifatto questa ricetta e l'ha messa su TikTok. Li sceglie Michele.", "Leute, die dieses Rezept nachgebacken und auf TikTok gezeigt haben. Michele wählt sie aus.", "People who made this recipe and posted it on TikTok. Michele picks them.")}</p>
          <div className="space-y-3">
            {vostri.map((v) => (
              <div key={v.url}>
                <p className="text-[12.5px] font-bold text-foreground mb-1">{v.handle ? `@${v.handle}` : "TikTok"}</p>
                <VideoTikTok url={v.url} titolo={`${nome} · @${v.handle || "TikTok"}`} testid="recipe-video-vostro" />
                {isAdmin && <button data-testid="tiktok-vostro-togli" disabled={saving} onClick={() => togli(v.url)} className="mt-1 inline-flex items-center gap-1 text-[12px] text-muted-foreground underline decoration-dotted"><Trash2 className="w-3.5 h-3.5" />{tri("Togli questo video", "Dieses Video entfernen", "Remove this video")}</button>}
              </div>
            ))}
          </div>
        </div>
      )}

      <button data-testid="tiktok-fai-video" onClick={() => setApri((x) => !x)} aria-expanded={apri} className="w-full flex items-center justify-between gap-2 rounded-xl bg-primary/10 border border-primary/30 px-3 py-2.5 text-left">
        <span className="text-[13.5px] font-bold text-foreground flex items-center gap-1.5"><Camera className="w-4 h-4 text-primary" />{isAdmin ? tri("Il copione del tuo video", "Das Drehbuch für dein Video", "The script for your video") : tri("Fai il video di questa ricetta", "Mach ein Video von diesem Rezept", "Make a video of this recipe")}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${apri ? "rotate-180" : ""}`} />
      </button>

      {apri && cop && (
        <div data-testid="tiktok-copione" className="space-y-3">
          <ol className="space-y-2">
            {cop.scene.map((s, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="shrink-0 w-12 text-[11.5px] font-mono-data text-primary pt-0.5">{s.sec} s</span>
                <span className="text-[13px] text-foreground leading-snug">{s.cosa}<span className="block text-[12px] text-muted-foreground mt-0.5">{tri("Scritta sullo schermo:", "Text im Bild:", "On-screen text:")} «{s.scritta}»</span></span>
              </li>
            ))}
          </ol>
          <div className="rounded-xl bg-muted/50 p-2.5">
            <p className="text-[12px] font-bold text-foreground mb-1">{tri("Consigli", "Tipps", "Tips")}</p>
            <ul className="list-disc pl-4 space-y-1 text-[12.5px] text-foreground/90 leading-snug">{cop.consigli.map((c, i) => <li key={i}>{c}</li>)}</ul>
          </div>
          <div>
            <p className="text-[12.5px] font-bold text-foreground mb-1">{tri("La didascalia pronta", "Die fertige Beschreibung", "The ready caption")}</p>
            <textarea data-testid="tiktok-didascalia" readOnly value={didascalia} rows={5} onFocus={(e) => e.target.select()} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-[13px] text-foreground" />
            <div className="flex flex-wrap gap-2 mt-2">
              <button data-testid="tiktok-copia" onClick={() => copia(false)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-background text-sm font-bold text-foreground active:scale-95"><Copy className="w-4 h-4" />{tri("Copia la didascalia", "Beschreibung kopieren", "Copy the caption")}</button>
              <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-background text-sm font-bold text-foreground active:scale-95 cursor-pointer">
                <Camera className="w-4 h-4" />{file ? tri("Cambia video", "Anderes Video", "Change video") : tri("Scegli il tuo video", "Dein Video wählen", "Choose your video")}
                <input data-testid="tiktok-file" type="file" accept="video/*" className="hidden" onChange={scegli} />
              </label>
              {file && <button data-testid="tiktok-manda" onClick={manda} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95"><Share2 className="w-4 h-4" />{tri("Manda a TikTok", "An TikTok senden", "Send to TikTok")}</button>}
            </div>
            {file && <p className="text-[11.5px] text-muted-foreground mt-1">{file.name}</p>}
          </div>
          {!isAdmin && video && (
            <p className="text-[12.5px] text-foreground/90 leading-snug">{tri("Rispondi al video di Michele: aprilo su TikTok, tocca «Condividi» e scegli «Duetto» o «Stitch». Così il tuo video compare accanto al suo.", "Antworte auf Micheles Video: öffne es auf TikTok, tippe auf «Teilen» und wähle «Duett» oder «Stitch». So erscheint dein Video neben seinem.", "Reply to Michele's video: open it on TikTok, tap «Share» and choose «Duet» or «Stitch». Your video then appears next to his.")} <a href={video} target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">{tri("Il video di Michele", "Micheles Video", "Michele's video")}</a></p>
          )}
          {!isAdmin && <p className="text-[12.5px] text-muted-foreground leading-snug">{tri("Metti #MikiLab e tagga @mikilab.de: Michele guarda i vostri video e i più belli finiscono qui, sotto la ricetta.", "Nutze #MikiLab und markiere @mikilab.de: Michele schaut eure Videos an, die schönsten kommen hierher, unter das Rezept.", "Use #MikiLab and tag @mikilab.de: Michele watches your videos and the best ones end up here, under the recipe.")}</p>}
          <p className="text-[11px] text-muted-foreground">{tri("Il video resta nel tuo telefono finché non lo mandi tu a TikTok: MikiLab non lo riceve.", "Das Video bleibt auf deinem Handy, bis du es selbst an TikTok schickst: MikiLab erhält es nicht.", "The video stays on your phone until you send it to TikTok yourself: MikiLab never receives it.")}</p>
        </div>
      )}

      {isAdmin && (
        <div data-testid="tiktok-admin-vostri" className="border-t border-border/60 pt-2.5">
          <p className="text-[12px] text-muted-foreground mb-1">{tri("Admin · aggiungi il video di qualcuno che ha rifatto questa ricetta (link di TikTok, massimo 6)", "Admin · Video von jemandem hinzufügen, der das Rezept nachgebacken hat (TikTok-Link, höchstens 6)", "Admin · add a video by someone who made this recipe (TikTok link, max 6)")}</p>
          <div className="flex gap-2">
            <input data-testid="tiktok-vostro-link" value={nuovo} onChange={(e) => setNuovo(e.target.value)} placeholder="https://www.tiktok.com/@…/video/…" className="flex-1 min-w-0 bg-background border border-border rounded-lg text-xs text-foreground px-2.5 py-2 outline-none focus:border-primary" />
            <button data-testid="tiktok-vostro-aggiungi" onClick={aggiungi} disabled={saving || !nuovo.trim()} aria-label={tri("Aggiungi", "Hinzufügen", "Add")} className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"><Plus className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </section>
  );
}
