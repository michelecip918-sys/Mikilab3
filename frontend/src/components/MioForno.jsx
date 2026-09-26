import { useState, useEffect, useRef } from "react";
import { ChevronLeft, Camera, Star, Trash2, Download, Lock, MessageCircle, Plus } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { recipesApi } from "@/lib/api";
import { rLoc } from "@/lib/loc";
import { idbGet, idbSet } from "@/lib/idbCache";
import { toast } from "sonner";
import { award } from "@/lib/medaglie"; // V90

// V84 — "Il mio forno": il quaderno dei TUOI pani, con foto, voto e nota.
// Vive SOLO nel browser (IndexedDB "mikilab-offline", chiave "mioforno"): niente account,
// nessuna foto inviata al server, nessun contatore. "Esporta" crea un file .json in locale.
// Le foto vengono rimpicciolite nel browser (max 900 px) per non riempire la memoria.

const KEY = "mioforno";
const MAX_ENTRIES = 200;

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const max = 900;
          const s = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          URL.revokeObjectURL(url);
          resolve(c.toDataURL("image/jpeg", 0.82));
        } catch (e) { reject(e); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("img")); };
      img.src = url;
    } catch (e) { reject(e); }
  });
}

function fmtDate(iso, lang) {
  try { return new Date(iso).toLocaleDateString(lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT", { day: "2-digit", month: "short", year: "numeric" }); } catch { return iso; }
}

export default function MioForno({ onBack, onOpenRecipe }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [items, setItems] = useState(null); // null = caricamento
  const [recipes, setRecipes] = useState([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [stars, setStars] = useState(0);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  // V127: dalla calcolatrice del fornaio («Segna nel mio forno») arrivano nome e riassunto della formula.
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("mikilab_mioforno_prefill") || "null");
      localStorage.removeItem("mikilab_mioforno_prefill");
      if (p && (p.name || p.note)) { setName(String(p.name || "").slice(0, 80)); setNote(String(p.note || "").slice(0, 400)); setOpen(true); }
    } catch { /* niente da precompilare */ }
  }, []);

  useEffect(() => {
    let stop = false;
    idbGet(KEY).then((d) => { if (!stop) setItems(Array.isArray(d) ? d : []); });
    recipesApi.list("mikilab").then((recs) => { if (!stop && Array.isArray(recs)) setRecipes(recs); }).catch(() => { /* */ });
    return () => { stop = true; };
  }, []);

  const persist = async (next) => {
    const ok = await idbSet(KEY, next);
    if (!ok) toast.error(tri("Non riesco a salvare nel tuo dispositivo (memoria piena o modalità privata).", "Kann nicht auf deinem Gerät speichern (Speicher voll oder privater Modus).", "Can't save on your device (storage full or private mode)."));
    setItems(next);
  };

  const onFile = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setBusy(true);
    try { setPhoto(await resizeImage(f)); }
    catch { toast.error(tri("Foto non leggibile.", "Foto nicht lesbar.", "Photo not readable.")); }
    setBusy(false);
  };

  const save = async () => {
    const n = name.trim();
    if (!n && !photo) { toast.info(tri("Metti almeno il nome della ricetta o una foto.", "Gib mindestens den Rezeptnamen oder ein Foto an.", "Add at least the recipe name or a photo.")); return; }
    const rec = recipes.find((r) => [r.name, r.name_de, r.name_en].filter(Boolean).some((x) => String(x).toLowerCase() === n.toLowerCase()));
    const entry = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, at: new Date().toISOString(), name: n || tri("Senza nome", "Ohne Namen", "Untitled"), recipeId: rec ? rec.id : null, stars, note: note.trim(), photo };
    const next = [entry, ...(items || [])].slice(0, MAX_ENTRIES);
    await persist(next);
    award("quaderno"); if (next.filter((x) => x.photo).length >= 5) award("fotografo");
    setName(""); setStars(0); setNote(""); setPhoto(null); setOpen(false);
    if (fileRef.current) fileRef.current.value = "";
    toast.success(tri("Segnato nel tuo forno.", "In deinem Ofen notiert.", "Noted in your oven."));
  };

  const remove = async (id) => {
    if (!window.confirm(tri("Cancellare questa prova?", "Diesen Versuch löschen?", "Delete this bake?"))) return;
    await persist((items || []).filter((x) => x.id !== id));
  };
  const removeAll = async () => {
    if (!window.confirm(tri("Cancellare tutto il quaderno? Non si può annullare.", "Das ganze Heft löschen? Das lässt sich nicht rückgängig machen.", "Delete the whole notebook? This cannot be undone."))) return;
    await persist([]);
  };
  const exportAll = () => {
    try {
      const blob = new Blob([JSON.stringify({ mikilab: "il-mio-forno", exported: new Date().toISOString(), items: items || [] }, null, 1)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "mikilab-il-mio-forno.json"; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch { toast.error(tri("Esportazione non riuscita.", "Export fehlgeschlagen.", "Export failed.")); }
  };
  const askSitor = (it) => {
    const text = tri(`Ho fatto "${it.name}" e gli ho dato ${it.stars || "?"} stelle su 5. ${it.note ? `Nota: ${it.note}. ` : ""}Cosa posso migliorare la prossima volta?`,
      `Ich habe "${it.name}" gebacken und ${it.stars || "?"} von 5 Sternen gegeben. ${it.note ? `Notiz: ${it.note}. ` : ""}Was kann ich beim nächsten Mal besser machen?`,
      `I made "${it.name}" and gave it ${it.stars || "?"} stars out of 5. ${it.note ? `Note: ${it.note}. ` : ""}What can I improve next time?`);
    try { window.dispatchEvent(new CustomEvent("mikilab-open-chat")); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-chat-prefill", { detail: { text } })), 250); } catch { /* */ }
  };

  const Stars = ({ v, onPick }) => (
    <span className="inline-flex gap-0.5" role={onPick ? "radiogroup" : undefined}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" disabled={!onPick} onClick={() => onPick && onPick(i)} aria-label={`${i}/5`} className={onPick ? "active:scale-90" : "cursor-default"}>
          <Star className={`w-5 h-5 ${i <= v ? "text-ambra fill-ambra" : "text-border"}`} />
        </button>
      ))}
    </span>
  );

  return (
    <div data-testid="mioforno-page" className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <button data-testid="mioforno-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div className="flex items-center gap-2">
        <Camera className="w-6 h-6 text-primary" />
        <h1 className="font-display text-2xl font-black text-foreground">{tri("Il mio forno", "Mein Ofen", "My oven")}</h1>
      </div>
      <p className="text-sm text-muted-foreground">{tri("Il quaderno dei tuoi pani: una foto, un voto, due righe. Così la prossima volta sai cosa hai fatto e cosa cambiare.", "Das Heft deiner Brote: ein Foto, eine Note, zwei Zeilen. So weißt du beim nächsten Mal, was du gemacht hast und was du änderst.", "The notebook of your bakes: a photo, a rating, two lines. So next time you know what you did and what to change.")}</p>
      <p className="text-[12px] text-foreground/80 inline-flex items-start gap-1.5 rounded-xl border border-salvia/40 bg-salvia/10 px-3 py-2"><Lock className="w-3.5 h-3.5 mt-0.5 text-salvia shrink-0" />{tri("Resta tutto nel tuo dispositivo: le foto non vengono inviate a nessuno e Michele non le vede. Se cancelli i dati del browser, sparisce anche il quaderno: usa Esporta per tenerne una copia.", "Alles bleibt auf deinem Gerät: die Fotos werden an niemanden gesendet, Michele sieht sie nicht. Löschst du die Browserdaten, ist auch das Heft weg: mit Exportieren behältst du eine Kopie.", "Everything stays on your device: photos are sent to no one and Michele doesn't see them. If you clear browser data the notebook goes too: use Export to keep a copy.")}</p>

      {!open ? (
        <button data-testid="mioforno-add" onClick={() => setOpen(true)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm active:scale-95 transition-all">
          <Plus className="w-4 h-4" />{tri("Segna un pane fatto oggi", "Ein heute gebackenes Brot notieren", "Note a bake from today")}
        </button>
      ) : (
        <section data-testid="mioforno-form" className="rounded-2xl border border-primary/40 bg-background p-4 space-y-3">
          <label className="block text-sm font-bold text-foreground">{tri("Cosa hai fatto?", "Was hast du gebacken?", "What did you make?")}
            <input data-testid="mioforno-name" list="mioforno-recipes" value={name} onChange={(e) => setName(e.target.value)} placeholder={tri("es. Focaccia con patate", "z. B. Kartoffel-Focaccia", "e.g. Potato focaccia")}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" />
            <datalist id="mioforno-recipes">{recipes.map((r) => <option key={r.id} value={rLoc(r, "name", lang)} />)}</datalist>
          </label>
          <div className="flex items-center gap-3"><span className="text-sm font-bold text-foreground">{tri("Com'è venuto?", "Wie ist es geworden?", "How did it turn out?")}</span><Stars v={stars} onPick={setStars} /></div>
          <label className="block text-sm font-bold text-foreground">{tri("Due righe per la prossima volta", "Zwei Zeilen fürs nächste Mal", "Two lines for next time")}
            <textarea data-testid="mioforno-note" value={note} onChange={(e) => setNote(e.target.value.slice(0, 400))} rows={3} placeholder={tri("es. crosta ottima, mollica un po' fitta: la prossima volta aspetto 20 minuti in più", "z. B. Kruste top, Krume etwas dicht: nächstes Mal 20 Minuten länger warten", "e.g. great crust, crumb a bit tight: next time wait 20 minutes more")}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" />
          </label>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background text-sm font-bold text-foreground cursor-pointer active:scale-95">
              <Camera className="w-4 h-4 text-primary" />{busy ? tri("Preparo la foto…", "Foto wird vorbereitet…", "Preparing photo…") : tri("Aggiungi una foto", "Foto hinzufügen", "Add a photo")}
              <input ref={fileRef} data-testid="mioforno-photo" type="file" accept="image/*" onChange={onFile} className="hidden" />
            </label>
            {photo && <img src={photo} alt="" className="w-16 h-16 rounded-xl object-cover border border-border" />}
          </div>
          <div className="flex gap-2">
            <button data-testid="mioforno-save" onClick={save} disabled={busy} className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-95 disabled:opacity-50">{tri("Salva nel quaderno", "Ins Heft speichern", "Save to notebook")}</button>
            <button onClick={() => { setOpen(false); setPhoto(null); }} className="px-4 py-2.5 rounded-xl border border-border bg-background font-bold text-sm text-foreground active:scale-95">{tri("Annulla", "Abbrechen", "Cancel")}</button>
          </div>
        </section>
      )}

      {items === null && <p className="text-sm text-muted-foreground">{tri("Apro il quaderno…", "Heft wird geöffnet…", "Opening the notebook…")}</p>}
      {items && items.length === 0 && <p data-testid="mioforno-empty" className="text-sm text-muted-foreground text-center py-6">{tri("Il quaderno è ancora bianco. Il primo pane è il più bello da segnare.", "Das Heft ist noch leer. Das erste Brot ist am schönsten zu notieren.", "The notebook is still blank. The first bake is the nicest to write down.")}</p>}

      {items && items.length > 0 && (
        <div className="space-y-3" data-testid="mioforno-list">
          {items.map((it) => (
            <article key={it.id} className="rounded-2xl border border-border bg-background overflow-hidden">
              {it.photo && <img src={it.photo} alt="" className="w-full max-h-72 object-cover" loading="lazy" />}
              <div className="p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-foreground leading-tight">{it.name}</p>
                    <p className="text-[11px] text-muted-foreground">{fmtDate(it.at, lang)}</p>
                  </div>
                  <Stars v={it.stars || 0} />
                </div>
                {it.note && <p className="text-[13px] text-foreground/85 mt-2 whitespace-pre-wrap">{it.note}</p>}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {it.recipeId && onOpenRecipe && <button onClick={() => onOpenRecipe(it.recipeId)} className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-bold text-foreground active:scale-95">{tri("Apri la ricetta", "Rezept öffnen", "Open recipe")}</button>}
                  <button onClick={() => askSitor(it)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 border border-primary/40 text-xs font-bold text-foreground active:scale-95"><MessageCircle className="w-3.5 h-3.5 text-primary" />{tri("Chiedi a Sitor come migliorare", "Frag Sitor, wie es besser wird", "Ask Sitor how to improve")}</button>
                  <button onClick={() => remove(it.id)} aria-label={tri("Cancella", "Löschen", "Delete")} className="ml-auto p-1.5 rounded-lg text-mattone hover:bg-mattone/10 active:scale-95"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </article>
          ))}
          <div className="flex gap-2 justify-end pt-1">
            <button data-testid="mioforno-export" onClick={exportAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-bold text-foreground active:scale-95"><Download className="w-3.5 h-3.5" />{tri("Esporta", "Exportieren", "Export")}</button>
            <button data-testid="mioforno-clear" onClick={removeAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-mattone/40 text-xs font-bold text-mattone active:scale-95"><Trash2 className="w-3.5 h-3.5" />{tri("Cancella tutto", "Alles löschen", "Delete all")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
