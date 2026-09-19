import { useState, useEffect } from "react";
import { ChevronLeft, Sparkles, FlaskConical, CalendarDays, Wheat, Loader2, Utensils } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { api } from "@/lib/api";
import { toast } from "sonner";

// Pannello admin STADIO 2B: Bozza da Sitor, Test del mese, Farine, Calendario.
export default function Admin2B({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [exps, setExps] = useState([]);
  const [cal, setCal] = useState([]);
  const [flourPub, setFlourPub] = useState(false);
  const [tips, setTips] = useState([]);

  const reload = () => {
    api.get(`/admin/experiments`).then((r) => setExps(r.data.experiments || [])).catch(() => {});
    api.get(`/bread-calendar`).then((r) => setCal(r.data.events || [])).catch(() => {});
    api.get(`/flour-types`).then((r) => setFlourPub(r.data.published)).catch(() => {});
    api.get(`/admin/palato-tips`).then((r) => setTips(r.data.rows || [])).catch(() => {});
  };
  useEffect(() => { reload(); }, []);

  const draftNamed = async (nm, hint) => {
    setBusy(true);
    try { const r = await api.post(`/sitor/draft-recipe`, { name: nm, hint, lang }); toast.success(tri(`Bozza creata: ${r.data.name} (nascosta)`, `Entwurf: ${r.data.name} (versteckt)`, `Draft: ${r.data.name} (hidden)`)); }
    catch { toast.error(tri("Errore", "Fehler", "Error")); }
    finally { setBusy(false); }
  };
  const saveTip = async (key, text) => { await api.put(`/palato-tips/${key}`, { text, draft_note: false }).catch(() => {}); toast.success(tri("Salvato", "Gespeichert", "Saved")); reload(); };
  const setTipText = (key, l, v) => setTips((ts) => ts.map((t) => t.key === key ? { ...t, text: { ...t.text, [l]: v } } : t));

  const draft = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const r = await api.post(`/sitor/draft-recipe`, { name: name.trim(), lang });
      toast.success(tri(`Bozza creata: ${r.data.name} (nascosta)`, `Entwurf erstellt: ${r.data.name} (versteckt)`, `Draft created: ${r.data.name} (hidden)`));
      setName("");
    } catch { toast.error(tri("Errore nella generazione", "Fehler bei der Generierung", "Generation error")); }
    finally { setBusy(false); }
  };
  const setExpStatus = async (slug, status) => { await api.put(`/experiments/${slug}`, { status }).catch(() => {}); reload(); };
  const setCalStatus = async (slug, status) => { await api.put(`/bread-calendar/${slug}`, { status }).catch(() => {}); reload(); };
  const publishFlour = async (v) => { await api.put(`/flour-types/all`, { publish_all: v }).catch(() => {}); setFlourPub(v); toast.success(v ? tri("Farine pubblicate", "Mehle veröffentlicht", "Flours published") : tri("Farine nascoste", "Mehle versteckt", "Flours hidden")); };

  return (
    <div data-testid="admin2b-page" className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <button data-testid="admin2b-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <h1 className="font-display text-2xl font-black text-foreground">{tri("Strumenti di Michele", "Micheles Werkzeuge", "Michele's tools")}</h1>

      <section className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-2">
        <p className="inline-flex items-center gap-1.5 font-bold text-foreground"><Sparkles className="w-4 h-4 text-primary" />{tri("Bozza da Sitor", "Entwurf von Sitor", "Draft from Sitor")}</p>
        <p className="text-[12px] text-muted-foreground">{tri("Genera una ricetta NASCOSTA da rileggere e pubblicare.", "Erzeugt ein VERSTECKTES Rezept zum Prüfen und Veröffentlichen.", "Generates a HIDDEN recipe to review and publish.")}</p>
        <div className="flex gap-2">
          <input data-testid="admin2b-draft-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={tri("Es. Shokupan", "z.B. Shokupan", "e.g. Shokupan")} className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
          <button data-testid="admin2b-draft-btn" onClick={draft} disabled={busy || !name.trim()} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-95 disabled:opacity-50 inline-flex items-center gap-2">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}{tri("Genera", "Erzeugen", "Generate")}</button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-background p-4 space-y-2">
        <p className="inline-flex items-center gap-1.5 font-bold text-foreground"><FlaskConical className="w-4 h-4 text-mattone" />{tri("Test del mese", "Test des Monats", "Test of the month")}</p>
        {exps.map((e) => (
          <div key={e.slug} data-testid={`admin2b-exp-${e.slug}`} className="flex items-center justify-between gap-2 border-b border-border/40 last:border-0 py-2">
            <div className="min-w-0"><p className="text-sm font-bold text-foreground truncate">{e.title?.it}</p><p className="text-[11px] text-muted-foreground">{e.status} · {e.total_votes || 0} {tri("voti", "Stimmen", "votes")}</p></div>
            <div className="flex gap-1.5 shrink-0">
              {e.status !== "open" && <button data-testid={`admin2b-exp-open-${e.slug}`} onClick={() => setExpStatus(e.slug, "open")} className="px-2.5 py-1 rounded-lg bg-salvia/20 text-foreground text-xs font-bold active:scale-95">{tri("Apri", "Öffnen", "Open")}</button>}
              {e.status === "open" && <button onClick={() => setExpStatus(e.slug, "closed")} className="px-2.5 py-1 rounded-lg bg-mattone/15 text-mattone text-xs font-bold active:scale-95">{tri("Chiudi", "Schließen", "Close")}</button>}
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-background p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="inline-flex items-center gap-1.5 font-bold text-foreground"><Wheat className="w-4 h-4 text-ambra" />{tri("Farine", "Mehle", "Flours")}</p>
          <button data-testid="admin2b-flour-toggle" onClick={() => publishFlour(!flourPub)} className={`px-3 py-1 rounded-lg text-xs font-bold active:scale-95 ${flourPub ? "bg-salvia/20 text-foreground" : "bg-foreground/10 text-muted-foreground"}`}>{flourPub ? tri("Pubblicate", "Veröffentlicht", "Published") : tri("Pubblica tutte", "Alle veröffentlichen", "Publish all")}</button>
        </div>
      </section>

      <section className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-2">
        <p className="inline-flex items-center gap-1.5 font-bold text-foreground"><Sparkles className="w-4 h-4 text-primary" />{tri("Ricette dal mondo (bozze)", "Rezepte aus aller Welt (Entwürfe)", "World recipes (drafts)")}</p>
        <p className="text-[12px] text-muted-foreground">{tri("Genera bozze NASCOSTE, poi rileggile e pubblicale.", "Erzeugt VERSTECKTE Entwürfe zum Prüfen und Veröffentlichen.", "Generate HIDDEN drafts to review and publish.")}</p>
        <div className="flex flex-wrap gap-2">
          {[["Shokupan", "pane al latte giapponese in cassetta, con tangzhong"], ["Bao al vapore", "panini al vapore senza forno, cottura al vapore"], ["Melon pan", "pane dolce giapponese con crosta di biscotto"]].map(([nm, hint]) => (
            <button key={nm} data-testid={`admin2b-world-${nm}`} onClick={() => draftNamed(nm, hint)} disabled={busy}
              className="px-3 py-2 rounded-xl bg-background border border-primary/40 text-foreground font-bold text-xs active:scale-95 disabled:opacity-50">{nm}</button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-background p-4 space-y-3">
        <p className="inline-flex items-center gap-1.5 font-bold text-foreground"><Utensils className="w-4 h-4 text-ambra" />{tri("Consigli del palato", "Gaumen-Tipps", "Palate tips")}</p>
        <p className="text-[11px] text-muted-foreground">{tri("Mostrati quando un criterio ha voto sotto 3. Modifica e salva (esce dallo stato bozza).", "Werden bei Bewertung unter 3 gezeigt. Bearbeiten und speichern (verlässt den Entwurf).", "Shown when a criterion scores under 3. Edit and save (leaves draft state).")}</p>
        {tips.map((t) => (
          <div key={t.key} data-testid={`admin2b-tip-${t.key}`} className="border-b border-border/40 last:border-0 pb-3 space-y-1.5">
            <p className="text-xs font-black uppercase tracking-wide text-ambra">{t.key}{t.draft_note ? " · bozza" : ""}</p>
            {["it", "de", "en"].map((l) => (
              <input key={l} data-testid={`admin2b-tip-${t.key}-${l}`} value={(t.text && t.text[l]) || ""} onChange={(e) => setTipText(t.key, l, e.target.value)}
                placeholder={l.toUpperCase()} className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-[12px] text-foreground outline-none focus:border-ambra" />
            ))}
            <button data-testid={`admin2b-tip-save-${t.key}`} onClick={() => saveTip(t.key, t.text)} className="px-3 py-1 rounded-lg bg-ambra/20 text-foreground text-xs font-bold active:scale-95">{tri("Salva", "Speichern", "Save")}</button>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-background p-4 space-y-2">
        <p className="inline-flex items-center gap-1.5 font-bold text-foreground"><CalendarDays className="w-4 h-4 text-primary" />{tri("Calendario del pane", "Brot-Kalender", "Bread calendar")}</p>
        <p className="text-[11px] text-muted-foreground">{tri("Bozze scritte da Sitor: approva o nascondi ogni evento.", "Von Sitor geschriebene Entwürfe: genehmige oder verstecke.", "Sitor drafts: approve or hide each event.")}</p>
        {cal.map((c) => (
          <div key={c.slug} data-testid={`admin2b-cal-${c.slug}`} className="flex items-center justify-between gap-2 border-b border-border/40 last:border-0 py-2">
            <div className="min-w-0"><p className="text-sm font-bold text-foreground truncate">{c.title?.it}</p><p className="text-[11px] text-muted-foreground">{c.country} · {c.status}</p></div>
            <div className="flex gap-1.5 shrink-0">
              <button data-testid={`admin2b-cal-pub-${c.slug}`} onClick={() => setCalStatus(c.slug, "published")} className={`px-2.5 py-1 rounded-lg text-xs font-bold active:scale-95 ${c.status === "published" ? "bg-salvia/30 text-foreground" : "bg-salvia/15 text-foreground"}`}>{tri("Pubblica", "Freigeben", "Publish")}</button>
              <button onClick={() => setCalStatus(c.slug, "hidden")} className="px-2.5 py-1 rounded-lg bg-foreground/10 text-muted-foreground text-xs font-bold active:scale-95">{tri("Nascondi", "Verbergen", "Hide")}</button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
