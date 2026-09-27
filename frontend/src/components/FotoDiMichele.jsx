import { useEffect, useRef, useState } from "react";
import { Camera, Check, Loader2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { api, uploadApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// V129 — «METTI LA TUA FOTO». Solo per l'admin, dentro la scheda ricetta: dal telefono si scatta o si sceglie la foto,
// il browser la rimpicciolisce (lato lungo 1600 px) e, ridisegnandola, toglie i dati nascosti del file (posizione GPS,
// modello del telefono, data) prima di caricarla. La foto va in recipe_extras.photo_url, non nella ricetta: così il seed
// delle ricette non la cancella mai e la ricetta non viene «bloccata» per gli aggiornamenti futuri.
// Con la spunta «L'ho fatta con questa ricetta» la ricetta diventa anche «Provata da Michele».

const MAX = 1600;

async function riduci(file) {
  let src;
  try { src = await createImageBitmap(file, { imageOrientation: "from-image" }); }
  catch {
    src = await new Promise((res, rej) => { const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = URL.createObjectURL(file); });
  }
  const w0 = src.width; const h0 = src.height;
  const k = Math.min(1, MAX / Math.max(w0, h0));
  const w = Math.round(w0 * k); const h = Math.round(h0 * k);
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  cv.getContext("2d").drawImage(src, 0, 0, w, h);
  const blob = await new Promise((res) => cv.toBlob(res, "image/jpeg", 0.85));
  if (!blob) throw new Error("foto non leggibile");
  return { blob, url: URL.createObjectURL(blob), w, h };
}

export default function FotoDiMichele({ recipe, vera }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const input = useRef(null);
  const [prev, setPrev] = useState(null);
  const [busy, setBusy] = useState(false);
  const [provata, setProvata] = useState(true);
  useEffect(() => () => { if (prev && prev.url) URL.revokeObjectURL(prev.url); }, [prev]);
  useEffect(() => { setPrev(null); setProvata(true); }, [recipe.id]);

  const avvisa = () => window.dispatchEvent(new CustomEvent("mikilab-foto-cambiata", { detail: { id: recipe.id } }));
  const scegli = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true);
    riduci(f).then(setPrev).catch(() => toast.error(tri("Questa foto non si riesce a leggere. Prova con un'altra.", "Dieses Foto lässt sich nicht lesen. Versuch ein anderes.", "This photo can't be read. Try another one.")))
      .finally(() => setBusy(false));
  };
  const pubblica = async () => {
    if (!prev) return;
    setBusy(true);
    try {
      const url = await uploadApi.image(prev.blob, `michele-${recipe.id}-${Date.now()}.jpg`);
      const body = { real_photo: true, photo_url: url };
      if (provata) body.status = "tested";
      await api.put(`/recipe-extras/${recipe.id}`, body);
      setPrev(null);
      avvisa();
      toast.success(provata ? tri("Foto pubblicata. Ora la ricetta dice «Foto di Michele» e «Provata».", "Foto veröffentlicht. Jetzt steht beim Rezept «Foto von Michele» und «Erprobt».", "Photo published. The recipe now says «Photo by Michele» and «Tested».") : tri("Foto pubblicata: ora la ricetta dice «Foto di Michele».", "Foto veröffentlicht: jetzt steht beim Rezept «Foto von Michele».", "Photo published: the recipe now says «Photo by Michele»."));
    } catch {
      toast.error(tri("Non riesco a caricare la foto. Controlla la rete e riprova.", "Das Foto lässt sich nicht hochladen. Prüf die Verbindung und versuch es nochmal.", "Couldn't upload the photo. Check your connection and try again."));
    } finally { setBusy(false); }
  };
  const togli = async () => {
    if (!window.confirm(tri("Tolgo la tua foto e torna l'immagine illustrativa?", "Dein Foto entfernen und wieder das Symbolbild zeigen?", "Remove your photo and go back to the illustrative image?"))) return;
    setBusy(true);
    try { await api.put(`/recipe-extras/${recipe.id}`, { real_photo: false, photo_url: "" }); avvisa(); toast.success(tri("Fatto: torna l'immagine illustrativa.", "Erledigt: wieder das Symbolbild.", "Done: back to the illustrative image.")); }
    catch { toast.error(tri("Non ci riesco adesso. Riprova.", "Geht gerade nicht. Versuch es nochmal.", "Can't do it right now. Try again.")); }
    finally { setBusy(false); }
  };

  return (
    <div data-testid="foto-michele-admin" className="no-print rounded-2xl border border-primary/40 bg-primary/5 p-3.5">
      <p className="text-[13.5px] font-bold text-foreground flex items-center gap-1.5"><Camera className="w-4 h-4 text-primary" />{tri("La tua foto", "Dein Foto", "Your photo")}</p>
      <p className="text-[12.5px] text-muted-foreground leading-snug mt-0.5">{vera
        ? tri("Qui c'è la tua foto: tutti vedono «Foto di Michele».", "Hier ist dein Foto: alle sehen «Foto von Michele».", "Your photo is here: everyone sees «Photo by Michele».")
        : tri("Qui c'è ancora l'immagine creata con l'IA. Fotografa il tuo pane: in trenta secondi è online.", "Hier ist noch das KI-Bild. Fotografier dein Brot: in dreißig Sekunden ist es online.", "This still has the AI-made image. Photograph your bread: it's online in thirty seconds.")}</p>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={scegli} data-testid="foto-michele-file" />
      {!prev && (
        <div className="flex flex-wrap items-center gap-2 mt-2.5">
          <button data-testid="foto-michele-scegli" disabled={busy} onClick={() => input.current && input.current.click()} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95 disabled:opacity-60">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}{vera ? tri("Cambia la foto", "Foto ändern", "Change the photo") : tri("Metti la tua foto", "Dein Foto hinzufügen", "Add your photo")}
          </button>
          {vera && <button data-testid="foto-michele-togli" disabled={busy} onClick={togli} className="inline-flex items-center gap-1 text-[12.5px] text-muted-foreground underline decoration-dotted disabled:opacity-60"><Undo2 className="w-3.5 h-3.5" />{tri("Torna all'immagine illustrativa", "Zurück zum Symbolbild", "Back to the illustrative image")}</button>}
        </div>
      )}
      {prev && (
        <div className="mt-2.5 space-y-2.5">
          <img data-testid="foto-michele-anteprima" src={prev.url} alt="" className="w-full max-h-64 object-cover rounded-xl border border-border" />
          <label className="flex items-start gap-2 text-[13px] text-foreground leading-snug">
            <input type="checkbox" data-testid="foto-michele-provata" checked={provata} onChange={(e) => setProvata(e.target.checked)} className="mt-0.5 w-4 h-4" />
            <span>{tri("L'ho fatta con questa ricetta: segnala anche «Provata da Michele»", "Ich habe es mit diesem Rezept gebacken: auch als «Von Michele erprobt» markieren", "I made it with this recipe: also mark it «Tested by Michele»")}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button data-testid="foto-michele-pubblica" disabled={busy} onClick={pubblica} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95 disabled:opacity-60">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}{tri("Pubblica la foto", "Foto veröffentlichen", "Publish the photo")}
            </button>
            <button disabled={busy} onClick={() => setPrev(null)} className="px-4 py-2.5 rounded-xl border border-border text-sm font-bold text-foreground active:scale-95">{tri("Annulla", "Abbrechen", "Cancel")}</button>
          </div>
        </div>
      )}
      <p className="text-[11px] text-muted-foreground mt-2">{tri("Prima di caricarla il telefono la rimpicciolisce e toglie i dati nascosti della foto, anche la posizione.", "Vor dem Hochladen verkleinert das Handy das Foto und entfernt versteckte Daten, auch den Standort.", "Before uploading, your phone shrinks the photo and removes hidden data, including the location.")}</p>
    </div>
  );
}
