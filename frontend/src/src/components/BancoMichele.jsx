import { useState, useEffect } from "react";
import { ChevronLeft, PenLine, Save } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { api } from "@/lib/api";
import { toast } from "sonner";

// V88 — "DAL BANCO DI MICHELE": due righe scritte da Michele, con la sua voce, in cima alla Home.
// Non Sitor: Michele. «Questa settimana ho provato la focaccia con le patate viola…». È il legame
// umano che un'IA non può dare. Usa la pagina del sito già esistente (slug "banco", GET pubblico,
// PUT solo admin): nessuna modifica al backend. Se non è pubblicata, in Home non compare nulla.

const SLUG = "banco";
const LANGS = ["it", "de", "en"];

// Pubblico: la nota in Home.
export function BancoNota() {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [page, setPage] = useState(null);
  useEffect(() => {
    let stop = false;
    api.get(`/site-pages/${SLUG}?lang=${lang}`).then((r) => { if (!stop && r.data && r.data.published && (r.data.body || "").trim()) setPage(r.data); else if (!stop) setPage(null); }).catch(() => { if (!stop) setPage(null); });
    return () => { stop = true; };
  }, [lang]);
  if (!page) return null;
  return (
    <section data-testid="banco-nota" className="rounded-3xl border border-border/40 bg-background/70 p-5 mb-4">
      <p className="font-mono-data text-[10px] tracking-[0.28em] uppercase text-primary mb-1 flex items-center gap-1.5"><PenLine className="w-3.5 h-3.5" />{tri("Dal banco di Michele", "Von Micheles Backtisch", "From Michele's bench")}</p>
      {page.title && <h3 className="font-display text-lg font-black text-foreground">{page.title}</h3>}
      <p className="text-[14px] text-foreground/90 leading-relaxed whitespace-pre-wrap mt-1">{page.body}</p>
      <p className="text-[11px] text-muted-foreground mt-2">{tri("Scritto da Michele, non da Sitor.", "Von Michele geschrieben, nicht von Sitor.", "Written by Michele, not by Sitor.")}</p>
    </section>
  );
}

// Admin: l'editor (menu account → «Dal banco»).
export default function BancoEditor({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [data, setData] = useState({ it: { title: "", body: "" }, de: { title: "", body: "" }, en: { title: "", body: "" } });
  const [published, setPublished] = useState(false);
  const [tab, setTab] = useState("it");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let stop = false;
    Promise.all(LANGS.map((l) => api.get(`/site-pages/${SLUG}?lang=${l}`).then((r) => [l, r.data]).catch(() => [l, null]))).then((rows) => {
      if (stop) return;
      const next = { it: { title: "", body: "" }, de: { title: "", body: "" }, en: { title: "", body: "" } };
      let pub = false;
      rows.forEach(([l, d]) => { if (d && d.lang === l) { next[l] = { title: d.title || "", body: d.body || "" }; pub = pub || !!d.published; } });
      setData(next); setPublished(pub);
    });
    return () => { stop = true; };
  }, []);

  const save = async (pub) => {
    setBusy(true);
    try {
      for (const l of LANGS) {
        const d = data[l];
        const body = (d.body || "").trim() || (data.it.body || "").trim(); // se una lingua è vuota, usa l'italiano
        await api.put(`/site-pages/${SLUG}`, { lang: l, title: (d.title || data.it.title || "").trim(), body, published: !!pub });
      }
      setPublished(!!pub);
      toast.success(pub ? tri("Pubblicato in Home.", "Auf der Startseite veröffentlicht.", "Published on the Home page.") : tri("Salvato, non visibile.", "Gespeichert, nicht sichtbar.", "Saved, not visible."));
    } catch { toast.error(tri("Non riesco a salvare.", "Speichern nicht möglich.", "Couldn't save.")); }
    setBusy(false);
  };

  return (
    <div data-testid="banco-editor" className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div className="flex items-center gap-2"><PenLine className="w-6 h-6 text-primary" /><h1 className="font-display text-2xl font-black text-foreground">{tri("Dal banco di Michele", "Von Micheles Backtisch", "From Michele's bench")}</h1></div>
      <p className="text-sm text-muted-foreground">{tri("Due righe tue, in cima alla Home, per tutti. Cosa hai infornato questa settimana, cosa hai imparato, cosa consigli. Cambiale quando vuoi. Se una lingua resta vuota, mostro l'italiano.", "Zwei Zeilen von dir, ganz oben auf der Startseite, für alle. Was du diese Woche gebacken hast, was du gelernt hast, was du empfiehlst. Ändere sie, wann du willst. Bleibt eine Sprache leer, zeige ich Italienisch.", "Two lines of yours, at the top of the Home page, for everyone. What you baked this week, what you learned, what you recommend. Change them whenever you like. If a language is empty, I show Italian.")}</p>
      <div className="flex gap-2">{LANGS.map((l) => <button key={l} onClick={() => setTab(l)} className={`px-3 py-1.5 rounded-full text-sm font-bold border uppercase ${tab === l ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground"}`}>{l}</button>)}</div>
      <input value={data[tab].title} onChange={(e) => setData((d) => ({ ...d, [tab]: { ...d[tab], title: e.target.value.slice(0, 80) } }))} placeholder={tri("Titolo (facoltativo), es. «Settimana del pane di Matera»", "Titel (optional), z. B. «Woche des Matera-Brots»", "Title (optional), e.g. «Matera bread week»")} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" />
      <textarea value={data[tab].body} onChange={(e) => setData((d) => ({ ...d, [tab]: { ...d[tab], body: e.target.value.slice(0, 900) } }))} rows={6} placeholder={tri("Le tue due righe…", "Deine zwei Zeilen…", "Your two lines…")} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" />
      <div className="flex gap-2 flex-wrap">
        <button data-testid="banco-publish" disabled={busy} onClick={() => save(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-95 disabled:opacity-50"><Save className="w-4 h-4" />{tri("Pubblica in Home", "Auf der Startseite veröffentlichen", "Publish on Home")}</button>
        <button disabled={busy} onClick={() => save(false)} className="px-4 py-2.5 rounded-xl border border-border bg-background font-bold text-sm text-foreground active:scale-95 disabled:opacity-50">{published ? tri("Togli dalla Home", "Von der Startseite nehmen", "Remove from Home") : tri("Salva senza pubblicare", "Speichern ohne Veröffentlichen", "Save without publishing")}</button>
      </div>
      <p className="text-[11px] text-muted-foreground">{published ? tri("Stato: visibile in Home.", "Status: auf der Startseite sichtbar.", "Status: visible on Home.") : tri("Stato: non visibile.", "Status: nicht sichtbar.", "Status: not visible.")}</p>
    </div>
  );
}
