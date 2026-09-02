import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Camera, Loader2, ScanLine, PenLine, Upload, FileText, CheckCircle2, ChevronRight, Mail, Copy } from "lucide-react";
import { API, recipesApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import RecipeDialog from "@/components/RecipeDialog";
import DualPhotoButtons from "@/components/DualPhotoButtons";
import { mkTri } from "@/i18n/triMaps";

export default function ScanRecipe({ embedded = false }) {
  const { t, lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pdfRecipes, setPdfRecipes] = useState([]); // ricette multiple trovate nel PDF
  const [pageThumbs, setPageThumbs] = useState({}); // miniature pagina per numero pagina
  const [savedIdx, setSavedIdx] = useState([]); // indici già salvati
  const [activeIdx, setActiveIdx] = useState(null); // indice della ricetta aperta nel dialog
  const fileRef = useRef(null);
  const [inbound, setInbound] = useState(null);

  useEffect(() => {
    fetch(`${API}/inbound/status`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null)).then(setInbound).catch(() => {});
  }, []);

  const onPhoto = (file) => {
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        const max = 1400; let w = img.width, h = img.height;
        if (w > h && w > max) { h = Math.round(h * max / w); w = max; }
        else if (h > max) { w = Math.round(w * max / h); h = max; }
        const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
        cv.getContext("2d").drawImage(img, 0, 0, w, h);
        const b64 = cv.toDataURL("image/jpeg", 0.85);
        try {
          const res = await fetch(`${API}/maestro/scan-recipe`, {
            method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
            body: JSON.stringify({ image_base64: b64, lang }),
          });
          if (!res.ok) throw new Error();
          const data = await res.json();
          setScanned(data);
          setDialogOpen(true);
          toast.success(t("scan_done"));
        } catch {
          toast.error(t("scan_error"));
        } finally {
          setLoading(false);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const onFile = (file) => {
    if (!file) return;
    if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
      setLoading(true);
      const r = new FileReader();
      r.onload = async () => {
        try {
          const res = await fetch(`${API}/maestro/scan-recipe-pdf`, {
            method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
            body: JSON.stringify({ pdf_base64: r.result, lang }),
          });
          if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || ""); }
          const data = await res.json();
          const recipes = Array.isArray(data?.recipes) ? data.recipes : (data ? [data] : []);
          if (recipes.length === 0) { toast.error(t("scan_error")); return; }
          if (recipes.length === 1) {
            setPdfRecipes([]); setPageThumbs({}); setScanned(recipes[0]); setActiveIdx(null); setDialogOpen(true);
          } else {
            // Più ricette: mostra l'elenco da rivedere/salvare una per una.
            setPdfRecipes(recipes); setPageThumbs(data.page_thumbs || {}); setSavedIdx([]); setScanned(null); setActiveIdx(null);
          }
          toast.success(recipes.length > 1
            ? tri(`Trovate ${recipes.length} ricette nel PDF`, `${recipes.length} Rezepte im PDF gefunden`, `Found ${recipes.length} recipes in the PDF`)
            : t("scan_done"));
        } catch (err) {
          toast.error(err?.message || t("scan_error"));
        } finally { setLoading(false); }
      };
      r.readAsDataURL(file);
      return;
    }
    onPhoto(file);
  };

  const openPdfRecipe = (idx) => {
    setScanned(pdfRecipes[idx]); setActiveIdx(idx); setDialogOpen(true);
  };

  const [savingAll, setSavingAll] = useState(false);
  const saveAll = async () => {
    if (savingAll) return;
    setSavingAll(true);
    const done = [...savedIdx];
    let ok = 0, fail = 0;
    for (let i = 0; i < pdfRecipes.length; i++) {
      if (done.includes(i)) continue;
      try {
        await recipesApi.create({ ...pdfRecipes[i], collection_name: "personal" });
        done.push(i); ok++;
        setSavedIdx([...done]);
      } catch { fail++; }
    }
    setSavingAll(false);
    if (ok) toast.success(tri(`${ok} ricette salvate nel tuo ricettario`, `${ok} Rezepte gespeichert`, `${ok} recipes saved to your book`, `${ok} recetas guardadas`));
    if (fail) toast.error(tri(`${fail} non salvate, riprova`, `${fail} nicht gespeichert`, `${fail} not saved, try again`, `${fail} no guardadas`));
  };

  const handleSave = async (payload) => {
    try {
      await recipesApi.create({ ...payload, collection_name: "personal" });
      toast.success(t("toast_saved"));
      setDialogOpen(false);
      if (activeIdx != null) {
        setSavedIdx((s) => (s.includes(activeIdx) ? s : [...s, activeIdx]));
      } else {
        setScanned(null);
      }
      setActiveIdx(null);
    } catch {
      toast.error(t("toast_save_error"));
    }
  };

  return (
    <div className={embedded ? "" : "pb-24"}>
      {embedded ? (
        <div className="flex items-center gap-2 mb-2 text-[#ff6b00]">
          <ScanLine className="w-4 h-4" />
          <h2 className="font-display text-base font-semibold text-[#2B303B] dark:text-[#e4eff8]">{t("scan_title")}</h2>
        </div>
      ) : (
        <div className="relative rounded-3xl overflow-hidden mb-5 bg-gradient-to-br from-[#ff6b00] to-[#ff6b00] p-6 text-white">
          <div className="absolute top-0 left-0 right-0 flex h-1.5">
            <div className="flex-1 bg-[#ff6b00]" /><div className="flex-1 bg-white" /><div className="flex-1 bg-[#ff6b00]" />
            <div className="flex-1 bg-black" /><div className="flex-1 bg-[#ff6b00]" /><div className="flex-1 bg-[#ff6b00]" />
          </div>
          <ScanLine className="w-7 h-7 mb-2" />
          <h1 className="font-display text-2xl font-bold">{t("scan_title")}</h1>
          <p className="text-white/85 text-sm mt-1">{t("scan_sub")}</p>
        </div>
      )}

      <div className="rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] p-6 text-center">
        <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] mb-4">{t("scan_hint")}</p>
        {loading ? (
          <div data-testid="scan-loading" className="inline-flex items-center gap-2 bg-[#ff6b00] text-white font-semibold px-5 py-3.5 rounded-2xl opacity-70">
            <Loader2 className="w-5 h-5 animate-spin" /> {t("scan_reading")}
          </div>
        ) : (
          <DualPhotoButtons onFile={onPhoto} testid="scan" />
        )}
        {!loading && (
          <div className="mt-4 pt-4 border-t border-[#2e2e2e] dark:border-[#2e2e2e]">
            {/* Carica da file dal PC (o dall'allegato ricevuto via email): immagini/scansioni delle ricette */}
            <input ref={fileRef} type="file" accept="image/*,application/pdf,.pdf" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
            <button data-testid="scan-upload-file-btn" onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 bg-[#2e8b6f] text-white font-semibold px-5 py-3 rounded-2xl active:scale-97 transition-all mb-3">
              <Upload className="w-5 h-5" /> {tri("Carica dal PC / da email (immagine o PDF)", "Vom PC / aus E-Mail laden (Bild oder PDF)", "Upload from PC / email (image or PDF)")}
            </button>
            <p className="text-[11px] text-[#7E8A93] mb-3">{tri("Hai già le ricette in una cartella del computer o ricevute via email? Caricale qui: le leggo io e le trasformo in scheda.", "Hast du Rezepte in einem PC-Ordner oder per E-Mail erhalten? Lade sie hier hoch: ich lese sie und erstelle die Karte.", "Got recipes in a folder on your PC or received by email? Upload them here: I'll read them and turn them into a recipe card.")}</p>
            <p className="text-xs text-[#7E8A93] mb-2">{tri("Oppure scrivi la ricetta a mano da zero:", "Oder schreibe das Rezept von Hand:", "Or write the recipe by hand from scratch:")}</p>
            <button data-testid="scan-manual-btn" onClick={() => { setScanned(null); setDialogOpen(true); }}
              className="inline-flex items-center gap-2 bg-white dark:bg-[#1e1e1e] text-[#ff6b00] dark:text-[#e4eff8] font-semibold px-5 py-3 rounded-2xl border-2 border-[#ff6b00]/40 active:scale-97 transition-all">
              <PenLine className="w-5 h-5 text-[#ff6b00]" /> {tri("Scrivi a mano", "Von Hand schreiben", "Write by hand")}
            </button>
          </div>
        )}
      </div>

      {pdfRecipes.length > 1 && (
        <div data-testid="pdf-recipes-list" className="mt-4 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] p-4">
          <div className="flex items-center gap-2 mb-3 text-[#2e8b6f]">
            <FileText className="w-5 h-5" />
            <h3 className="font-display text-base font-semibold text-[#2B303B] dark:text-[#e4eff8]">
              {tri(`${pdfRecipes.length} ricette trovate nel PDF`, `${pdfRecipes.length} Rezepte im PDF`, `${pdfRecipes.length} recipes found in the PDF`)}
            </h3>
          </div>
          <p className="text-[12px] text-[#7E8A93] mb-3">{tri("Tocca una ricetta per rivederla e salvarla nel tuo ricettario.", "Tippe auf ein Rezept, um es zu prüfen und zu speichern.", "Tap a recipe to review and save it to your book.")}</p>
          {pdfRecipes.some((_, i) => !savedIdx.includes(i)) && (
            <button data-testid="pdf-save-all" onClick={saveAll} disabled={savingAll}
              className="w-full mb-3 inline-flex items-center justify-center gap-2 bg-[#2e8b6f] text-white font-semibold px-5 py-3 rounded-2xl active:scale-98 transition-all disabled:opacity-60">
              {savingAll ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {tri("Salva tutte", "Alle speichern", "Save all", "Guardar todas")} ({pdfRecipes.filter((_, i) => !savedIdx.includes(i)).length})
            </button>
          )}
          <ul className="space-y-2">
            {pdfRecipes.map((r, i) => {
              const done = savedIdx.includes(i);
              return (
                <li key={i}>
                  <button data-testid={`pdf-recipe-${i}`} onClick={() => openPdfRecipe(i)}
                    className={`w-full flex items-center gap-3 text-left px-3.5 py-3 rounded-2xl shadow-md border border-amber-900/40 border transition-all active:scale-98 ${done ? "bg-[#2e8b6f]/10 border-[#2e8b6f]/40" : "bg-[#121212] dark:bg-[#181818] border-[#2e2e2e] dark:border-[#2e2e2e] hover:border-[#ff6b00]"}`}>
                    {pageThumbs[String(r.page)] ? (
                      <img data-testid={`pdf-recipe-thumb-${i}`} src={pageThumbs[String(r.page)]} alt=""
                        className="w-12 h-16 object-cover rounded-md border border-[#2e2e2e] dark:border-[#2e2e2e] shrink-0 bg-white" />
                    ) : (
                      done ? <CheckCircle2 className="w-5 h-5 text-[#2e8b6f] shrink-0" /> : <ScanLine className="w-5 h-5 text-[#ff6b00] shrink-0" />
                    )}
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold text-sm text-[#2B303B] dark:text-[#e4eff8] truncate">{r.name || tri("Ricetta senza nome", "Rezept ohne Namen", "Untitled recipe")}</span>
                      {r.flour_type && <span className="block text-[11px] text-[#7E8A93] truncate">{r.flour_type}</span>}
                      {r.page && <span className="block text-[10px] text-[#ff6b00] font-semibold">{tri(`Pag. ${r.page}`, `S. ${r.page}`, `Page ${r.page}`, `Pág. ${r.page}`)}</span>}
                    </span>
                    {done ? <span className="text-[11px] font-bold text-[#2e8b6f] shrink-0">{tri("Salvata", "Gespeichert", "Saved")}</span> : <ChevronRight className="w-4 h-4 text-[#7E8A93] shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
          <button data-testid="pdf-recipes-done" onClick={() => { setPdfRecipes([]); setSavedIdx([]); }}
            className="mt-3 text-[12px] font-bold text-[#ff6b00] underline">
            {tri("Chiudi elenco", "Liste schließen", "Close list")}
          </button>
        </div>
      )}

      {inbound && inbound.your_email && (
        <div data-testid="inbound-email-panel" className="mt-4 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] p-5">
          <div className="flex items-center gap-2 mb-2 text-[#ff6b00]">
            <Mail className="w-5 h-5" />
            <h3 className="font-display text-base font-semibold text-[#2B303B] dark:text-[#e4eff8]">{tri("Import via Email", "Import per E-Mail", "Email import", "Importar por email")}</h3>
            {inbound.enabled
              ? <span className="ml-auto text-[10px] font-bold text-[#2e8b6f] bg-[#2e8b6f]/10 px-2 py-0.5 rounded-full">{tri("Attivo", "Aktiv", "Active", "Activo")}</span>
              : <span className="ml-auto text-[10px] font-bold text-[#ff6b00] bg-[#ff6b00]/10 px-2 py-0.5 rounded-full">{tri("In arrivo", "Bald", "Coming soon", "Próximamente")}</span>}
          </div>
          <p className="text-[12px] text-[#7E8A93] mb-3">
            {inbound.enabled
              ? tri(`Inoltra le ricette (PDF, foto o testo) dalla tua email registrata a questo indirizzo: le trasformo in schede automaticamente.`,
                    `Leite Rezepte (PDF, Foto oder Text) von deiner registrierten E-Mail an diese Adresse: ich erstelle die Karten automatisch.`,
                    `Forward recipes (PDF, photo or text) from your registered email to this address: I turn them into cards automatically.`,
                    `Reenvía recetas (PDF, foto o texto) desde tu email registrado a esta dirección: las convierto en fichas.`)
              : tri("Presto potrai inoltrare le ricette via email e trovarle già pronte qui.", "Bald kannst du Rezepte per E-Mail weiterleiten und sie hier fertig finden.", "Soon you'll be able to forward recipes by email and find them ready here.", "Pronto podrás reenviar recetas por email y encontrarlas aquí listas.")}
          </p>
          {inbound.enabled && inbound.inbound_address && (
            <button data-testid="inbound-copy-address" onClick={() => { navigator.clipboard?.writeText(inbound.inbound_address); toast.success(tri("Indirizzo copiato", "Adresse kopiert", "Address copied", "Dirección copiada")); }}
              className="w-full inline-flex items-center gap-2 bg-[#121212] dark:bg-[#181818] border border-[#ff6b00]/40 text-[#ff6b00] dark:text-[#a9d2ec] font-semibold px-4 py-2.5 rounded-2xl shadow-md border border-amber-900/40 active:scale-98">
              <span className="flex-1 text-left truncate text-sm">{inbound.inbound_address}</span>
              <Copy className="w-4 h-4 shrink-0" />
            </button>
          )}
          {inbound.webhook_url && (
            <div data-testid="inbound-webhook-admin" className="mt-3 rounded-2xl shadow-md border border-amber-900/40 bg-[#ff6b00]/10 border border-[#ff6b00]/30 p-3">
              <p className="text-[11px] font-bold text-[#ff6b00] mb-1">{tri("Admin · URL webhook per la Route Mailgun", "Admin · Webhook-URL für Mailgun-Route", "Admin · Webhook URL for Mailgun Route", "Admin · URL webhook Mailgun")}</p>
              <button data-testid="inbound-copy-webhook" onClick={() => { navigator.clipboard?.writeText(inbound.webhook_url); toast.success(tri("URL webhook copiato", "Webhook-URL kopiert", "Webhook URL copied", "URL copiada")); }}
                className="w-full inline-flex items-center gap-2 bg-white dark:bg-[#181818] border border-[#ff6b00]/40 text-[#ff6b00] dark:text-[#a9d2ec] font-mono-data text-[11px] px-3 py-2 rounded-lg active:scale-98">
                <span className="flex-1 text-left truncate">{inbound.webhook_url}</span>
                <Copy className="w-4 h-4 shrink-0" />
              </button>
              <p className="text-[10px] text-[#7E8A93] mt-1">{tri('Incollalo nell\'azione "Forward" della Route con match_recipient("recipes@mikilab.de").', 'In die „Forward"-Aktion der Route einfügen.', 'Paste it into the route\'s "Forward" action.', 'Pégalo en la acción "Forward" de la ruta.')}</p>
            </div>
          )}
          {inbound.your_email && (
            <p className="text-[11px] text-[#7E8A93] mt-2">
              {tri("Inoltra dalla tua email:", "Weiterleiten von deiner E-Mail:", "Forward from your email:", "Reenvía desde tu email:")} <b>{inbound.your_email}</b>
            </p>
          )}
          {Array.isArray(inbound.history) && inbound.history.length > 0 && (
            <ul className="mt-3 space-y-1">
              {inbound.history.slice(0, 5).map((h, i) => (
                <li key={i} className="flex items-center gap-2 text-[12px] text-[#3F4A54] dark:text-[#AEB8BF]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2e8b6f] shrink-0" />
                  <span className="truncate flex-1">{h.subject || tri("Email", "E-Mail", "Email", "Email")}</span>
                  <span className="text-[#7E8A93] shrink-0">{h.recipes_created} {tri("ricette", "Rezepte", "recipes", "recetas")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <RecipeDialog open={dialogOpen} onOpenChange={setDialogOpen} initial={scanned} onSave={handleSave} />
    </div>
  );
}
