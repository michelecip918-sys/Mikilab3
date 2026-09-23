import { useRef, useState } from "react";
import { ChevronLeft, Briefcase, Download, Upload, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { shareOrDownload, fmtDateLong } from "@/lib/sitorTools";

// V97 — LA VALIGIA DELLA BOTTEGA. Tutto quello che MikiLab sa di te vive nel tuo telefono. Se cambi telefono, lo perdi.
// Qui lo metti in valigia (un file) e lo riapri sull'altro telefono: preferiti, lievito, medaglie, forno, note, attrezzi.
// Nessun server in mezzo: il file lo tieni tu.

const SKIP = ["mikilab_admin_unlocked", "mikilab_cache", "mikilab_nome_skip"];
const ok = (k) => (k.startsWith("mikilab_") || k === "mioforno") && !SKIP.some((s) => k.startsWith(s));

function collect() {
  const out = {};
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (ok(k)) out[k] = localStorage.getItem(k); }
  return out;
}

export default function Valigia({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [count, setCount] = useState(() => { try { return Object.keys(collect()).length; } catch { return 0; } });
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const exportAll = async () => {
    try {
      const data = collect();
      const doc = { app: "mikilab", version: 1, exported: new Date().toISOString(), keys: Object.keys(data).length, data };
      const blob = new Blob([JSON.stringify(doc, null, 1)], { type: "application/json" });
      const d = new Date(); const name = `mikilab-valigia-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}.json`;
      const r = await shareOrDownload(blob, name, "MikiLab");
      if (r === "failed") toast.error(tri("Non riesco a creare il file.", "Datei kann nicht erstellt werden.", "Can't create the file."));
      else toast.success(tri("Valigia pronta.", "Koffer fertig.", "Suitcase ready."));
    } catch { toast.error(tri("Qualcosa è andato storto.", "Etwas ist schiefgegangen.", "Something went wrong.")); }
  };
  const onFile = async (file) => {
    if (!file) return;
    try {
      const doc = JSON.parse(await file.text());
      if (!doc || doc.app !== "mikilab" || !doc.data || typeof doc.data !== "object") throw new Error("bad");
      const keys = Object.keys(doc.data).filter(ok);
      if (!keys.length) throw new Error("empty");
      setPreview({ keys, exported: doc.exported, data: doc.data });
    } catch { toast.error(tri("Questo file non è una valigia di MikiLab.", "Diese Datei ist kein MikiLab-Koffer.", "This file is not a MikiLab suitcase.")); }
  };
  const importAll = () => {
    if (!preview) return;
    let n = 0;
    for (const k of preview.keys) { try { localStorage.setItem(k, String(preview.data[k])); n++; } catch { /* pieno */ } }
    setPreview(null); setCount(Object.keys(collect()).length);
    toast.success(tri(`Riaperta la valigia: ${n} cose al loro posto. Ricarico la pagina.`, `Koffer ausgepackt: ${n} Dinge an ihrem Platz. Seite wird neu geladen.`, `Suitcase unpacked: ${n} things back in place. Reloading.`));
    setTimeout(() => window.location.reload(), 1200);
  };

  return (
    <div data-testid="valigia-page" className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <button data-testid="valigia-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div>
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary flex items-center gap-1.5"><Briefcase className="w-3 h-3" />MikiLab</p>
        <h1 className="font-display text-2xl font-black text-foreground">{tri("La valigia della bottega", "Der Koffer der Bottega", "The bottega suitcase")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{tri("Tutto quello che MikiLab sa di te (preferiti, lievito, medaglie, forno, note, attrezzi) vive nel tuo telefono. Se cambi telefono, lo perdi. Qui lo metti in valigia e lo riapri dall'altra parte. Nessun server in mezzo: il file lo tieni tu.", "Alles, was MikiLab über dich weiß (Favoriten, Sauerteig, Medaillen, Ofen, Notizen, Werkzeuge), lebt auf deinem Handy. Mit neuem Handy ist es weg. Hier packst du es in den Koffer und packst es drüben wieder aus. Kein Server dazwischen: die Datei behältst du.", "Everything MikiLab knows about you (favourites, starter, medals, oven, notes, tools) lives on your phone. Change phone and you lose it. Here you pack it in a suitcase and unpack it on the other side. No server in between: you keep the file.")}</p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
        <p className="text-[13px] font-bold text-foreground">{tri("Metti in valigia", "Einpacken", "Pack")}</p>
        <p className="text-[12.5px] text-muted-foreground">{tri(`In questo telefono ci sono ${count} cose da salvare. Il file si chiama mikilab-valigia-<data>.json: mandalo a te stesso (email, Drive, WhatsApp) o salvalo.`, `Auf diesem Handy gibt es ${count} Dinge zum Sichern. Die Datei heißt mikilab-valigia-<Datum>.json: schick sie dir selbst (E-Mail, Drive, WhatsApp) oder speichere sie.`, `There are ${count} things to save on this phone. The file is called mikilab-valigia-<date>.json: send it to yourself (email, Drive, WhatsApp) or save it.`)}</p>
        <button data-testid="valigia-export" onClick={exportAll} disabled={count === 0} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3 py-2 rounded-xl bg-primary text-white disabled:opacity-40 active:scale-95"><Download className="w-4 h-4" />{tri("Crea la valigia", "Koffer erstellen", "Create the suitcase")}</button>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
        <p className="text-[13px] font-bold text-foreground">{tri("Riapri la valigia", "Auspacken", "Unpack")}</p>
        <p className="text-[12.5px] text-muted-foreground">{tri("Sul telefono nuovo: apri mikilab.de, vieni qui, scegli il file. Le cose della valigia prendono il posto di quelle uguali; il resto resta.", "Auf dem neuen Handy: mikilab.de öffnen, hierher kommen, Datei wählen. Die Dinge aus dem Koffer ersetzen gleiche Dinge; der Rest bleibt.", "On the new phone: open mikilab.de, come here, choose the file. Suitcase items replace matching ones; the rest stays.")}</p>
        <input ref={fileRef} data-testid="valigia-file" type="file" accept="application/json,.json" className="hidden" onChange={(e) => { onFile(e.target.files && e.target.files[0]); e.target.value = ""; }} />
        <button data-testid="valigia-pick" onClick={() => fileRef.current && fileRef.current.click()} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3 py-2 rounded-xl border border-border bg-background text-foreground active:scale-95"><Upload className="w-4 h-4" />{tri("Scegli il file", "Datei wählen", "Choose the file")}</button>
        {preview && (
          <div data-testid="valigia-preview" className="rounded-xl border border-salvia/40 bg-salvia/8 p-3 space-y-1.5">
            <p className="text-[13px] text-foreground">{tri(`Valigia del ${preview.exported ? fmtDateLong(new Date(preview.exported), lang) : "?"}: ${preview.keys.length} cose.`, `Koffer vom ${preview.exported ? fmtDateLong(new Date(preview.exported), lang) : "?"}: ${preview.keys.length} Dinge.`, `Suitcase from ${preview.exported ? fmtDateLong(new Date(preview.exported), lang) : "?"}: ${preview.keys.length} things.`)}</p>
            <div className="flex gap-1.5">
              <button data-testid="valigia-import" onClick={importAll} className="text-[12.5px] font-bold px-3 py-2 rounded-xl bg-salvia text-white active:scale-95">{tri("Riapri qui", "Hier auspacken", "Unpack here")}</button>
              <button data-testid="valigia-cancel" onClick={() => setPreview(null)} className="text-[12.5px] font-semibold px-3 py-2 rounded-xl text-muted-foreground">{tri("Annulla", "Abbrechen", "Cancel")}</button>
            </div>
          </div>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground flex items-start gap-1.5"><ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />{tri("Il file contiene solo le tue impostazioni e i tuoi appunti, con il soprannome se l'hai messo. Niente password, niente dati del server. Tienilo dove tieni le cose tue.", "Die Datei enthält nur deine Einstellungen und Notizen, mit Spitzname, falls gesetzt. Keine Passwörter, keine Serverdaten. Bewahre sie dort auf, wo du deine Sachen aufbewahrst.", "The file holds only your settings and notes, with the nickname if you set one. No passwords, no server data. Keep it where you keep your things.")}</p>
    </div>
  );
}
