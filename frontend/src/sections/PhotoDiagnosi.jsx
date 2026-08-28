import { useState, useEffect } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Camera, Bug, Sparkles, Upload, RefreshCw, Wheat, Lightbulb, PartyPopper, Cog, History, Trash2, ChevronDown, Share2, Printer } from "lucide-react";
import { API } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { speak, primeVoice } from "@/lib/voice";
import { shareContent } from "@/lib/share";
import ListenButton from "@/components/ListenButton";
import PrintHeader from "@/components/PrintHeader";
import { addXP } from "@/lib/level";
import { HeroAvatar } from "@/components/MikiAvatar";
import DualPhotoButtons from "@/components/DualPhotoButtons";
import LabTour from "@/components/LabTour";

// Downscale + compress an image file to a base64 JPEG (keeps payload small)
function fileToCompressedBase64(file, maxDim = 1024, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) { height = Math.round(height * maxDim / width); width = maxDim; }
        else if (height > maxDim) { width = Math.round(width * maxDim / height); height = maxDim; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Grab a representative frame from a video file as base64 JPEG.
function videoToFrameBase64(file, maxDim = 1024, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata"; video.muted = true; video.playsInline = true; video.src = url;
    video.onloadeddata = () => { try { video.currentTime = Math.min(1, (video.duration || 2) / 2); } catch { /* */ } };
    video.onseeked = () => {
      let w = video.videoWidth, h = video.videoHeight;
      if (w > h && w > maxDim) { h = Math.round(h * maxDim / w); w = maxDim; }
      else if (h > maxDim) { w = Math.round(w * maxDim / h); h = maxDim; }
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      c.getContext("2d").drawImage(video, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error("video")); };
  });
}

// Crea una miniatura leggera (base64 jpeg) da un data URL immagine.
function makeThumb(dataUrl, maxDim = 220, quality = 0.55) {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) { height = Math.round(height * maxDim / width); width = maxDim; }
        else if (height > maxDim) { width = Math.round(width * maxDim / height); height = maxDim; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    } catch { resolve(null); }
  });
}

export default function PhotoDiagnosi() {
  const [mode, setMode] = useState("difetti");
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [praised, setPraised] = useState(false);
  const [recent, setRecent] = useState([]);
  const [openRec, setOpenRec] = useState(null);
  const { t, lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "it" ? i : (e ?? i));
  const [tourForce, setTourForce] = useState(0);

  const MODES = [
    { id: "difetti", label: t("photo_mode_defects"), desc: t("photo_mode_defects_desc"), Icon: Bug },
    { id: "impasto", label: t("photo_mode_dough"), desc: t("photo_mode_dough_desc"), Icon: Wheat },
    { id: "ingredienti", label: t("photo_mode_ing"), desc: t("photo_mode_ing_desc"), Icon: Sparkles },
    { id: "scopri", label: t("photo_mode_discover"), desc: t("photo_mode_discover_desc"), Icon: Lightbulb },
    { id: "macchine", label: t("photo_mode_machines"), desc: t("photo_mode_machines_desc"), Icon: Cog },
  ];
  const modeLabel = (id) => (id === "suono" ? (lang === "de" ? "Klang-Diagnose" : lang === "en" ? "Sound diagnosis" : "Diagnosi Sonora") : (MODES.find((m) => m.id === id) || {}).label || id);

  const loadRecent = async () => {
    try {
      const res = await fetch(`${API}/diagnosi/recent`, { credentials: "include" });
      if (res.ok) setRecent(await res.json());
    } catch { /* ignore */ }
  };
  useEffect(() => { loadRecent(); /* eslint-disable-next-line */ }, []);

  const deleteRecent = async (id) => {
    setRecent((r) => r.filter((x) => x.id !== id));
    try { await fetch(`${API}/diagnosi/${id}`, { method: "DELETE", credentials: "include" }); } catch { /* */ }
  };

  const onPick = async (file) => {
    if (!file) return;
    try {
      const b64 = file.type.startsWith("video") ? await videoToFrameBase64(file) : await fileToCompressedBase64(file);
      setPreview(b64);
      setResult(""); setPraised(false);
    } catch {
      toast.error(t("toast_img_error"));
    }
  };

  const analyze = async () => {
    if (!preview || analyzing) return;
    primeVoice();
    setAnalyzing(true);
    setResult(""); setPraised(false);
    let full = "";
    try {
      const res = await fetch(`${API}/maestro/vision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mode, image_base64: preview, lang }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop();
        for (const part of parts) {
          const line = part.replace(/^data: ?/, "").trim();
          if (!line) continue;
          let obj;
          try { obj = JSON.parse(line); } catch { continue; }
          if (obj.done) continue;
          if (obj.d) { full += obj.d; setResult((r) => (r + obj.d)); }
        }
      }
      // Complimento vocale se il pane/impasto è fatto bene ([OK] in coda).
      if (/\[OK\]/.test(full) && (mode === "difetti" || mode === "impasto")) {
        setPraised(true);
        speak(t("photo_compliment"), lang);
      }
    } catch {
      toast.error(t("toast_analyze_error"));
    } finally {
      const clean = full.replace(/\[OK\]|\[FIX\]/g, "").trim();
      setResult(clean);
      setAnalyzing(false);
      // Salva la diagnosi tra le "recenti" (senza rifare la foto).
      if (clean) {
        try {
          const thumb = await makeThumb(preview);
          const res = await fetch(`${API}/diagnosi/save`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ mode, result: clean, thumb }),
          });
          if (res.ok) loadRecent();
          addXP(1);
        } catch { /* salvataggio best-effort */ }
      }
    }
  };

  return (
    <div className="pb-24">
      <LabTour force={tourForce} onClose={() => setTourForce(0)} storageKey="mikilab_diag_tour_v1"
        labels={{ skip: tri("Salta", "Überspringen", "Skip"), next: tri("Avanti", "Weiter", "Next"), done: tri("Ho capito!", "Verstanden!", "Got it!") }}
        steps={[
          { target: null, title: tri("Come funziona la Diagnosi 👋", "So funktioniert die Diagnose 👋", "How Diagnosis works 👋"),
            body: tri("In 3 passi analizzo il tuo pane da una foto. Ti dico cosa non va e come rimediare.", "In 3 Schritten analysiere ich dein Brot per Foto. Ich sage dir, was nicht stimmt und wie du es behebst.", "In 3 steps I analyse your bread from a photo. I tell you what's wrong and how to fix it.") },
          { target: "photo-modes", title: tri("1 · Scegli cosa analizzare", "1 · Wähle die Analyse", "1 · Choose what to analyse"),
            body: tri("Difetti e rimedi, stato dell'impasto, ingredienti, idee o macchine: scegli la modalità giusta.", "Fehler & Lösungen, Teigzustand, Zutaten, Ideen oder Maschinen: wähle den passenden Modus.", "Defects & fixes, dough state, ingredients, ideas or machines: pick the right mode.") },
          { target: "photo-dual", title: tri("2 · Scatta o carica la foto", "2 · Foto machen oder hochladen", "2 · Take or upload the photo"),
            body: tri("Fotografa il pane (o carica un video): più è nitida la foto, più precisa è l'analisi.", "Fotografiere das Brot (oder lade ein Video hoch): je schärfer, desto genauer die Analyse.", "Photograph the bread (or upload a video): the sharper the photo, the more precise the analysis.") },
          { target: "photo-analyze-btn", title: tri("3 · Analizza", "3 · Analysieren", "3 · Analyse"),
            body: tri("Premi «Analizza»: ti do il risultato con cause e rimedi. È un'analisi al volo — resta salvata tra le Diagnosi recenti.", "Drücke „Analysieren“: du bekommst Ursachen und Lösungen. Es wird bei den letzten Diagnosen gespeichert.", "Press 'Analyse': I give causes and fixes. It's saved under recent Diagnoses.") },
        ]} />
      <div className="relative rounded-3xl overflow-hidden mb-5 bg-gradient-to-br from-[#2f6a97] to-[#325046] p-6 text-white">
        <div className="it-de-ribbon absolute top-0 left-0 right-0" />
        <HeroAvatar />
        <Camera className="w-7 h-7 mb-2" />
        <h1 className="font-display text-2xl font-bold">{t("photo_title")}</h1>
        <div className="h-1 w-12 rounded-full bg-[#C88A2B] mt-1.5" />
        <p className="text-white/85 text-sm mt-1">{t("photo_subtitle")}</p>
        <button data-testid="diag-tour-replay" onClick={() => setTourForce((n) => n + 1)}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold bg-white/15 hover:bg-white/25 backdrop-blur px-3 py-1.5 rounded-lg active:scale-95 transition-all">
          {tri("Come si fa?", "Wie geht's?", "How to?")}
        </button>
      </div>

      <div data-testid="photo-modes" className="grid grid-cols-2 gap-2 mb-3">
        {MODES.map(({ id, label, desc, Icon }) => (
          <button
            key={id}
            data-testid={`photo-mode-${id}`}
            onClick={() => { setMode(id); setResult(""); setPraised(false); }}
            className={`flex flex-col items-start gap-1 p-3.5 rounded-2xl border text-left transition-all ${
              mode === id
                ? "bg-[#3f7cac] text-white border-[#3f7cac]"
                : "bg-white dark:bg-[#232A31] text-[#2B303B] dark:text-[#e4eff8] border-[#d5e4f0] dark:border-[#38424B]"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-semibold text-sm">{label}</span>
            <span className={`text-xs ${mode === id ? "text-white/80" : "text-[#7E8A93]"}`}>{desc}</span>
          </button>
        ))}
      </div>

      <p className="text-xs text-[#7E8A93] mb-4">{t("photo_video_hint")}</p>

      <div className="mb-4">
        <DualPhotoButtons onFile={onPick} allowVideo testid="photo" />
      </div>

      {preview && (
        <div className="rounded-3xl overflow-hidden border border-[#d5e4f0] dark:border-[#38424B] mb-4">
          <img src={preview} alt="anteprima" className="w-full max-h-80 object-cover" />
        </div>
      )}

      <button
        data-testid="photo-analyze-btn"
        onClick={analyze}
        disabled={!preview || analyzing}
        className="w-full bg-[#3f7cac] hover:bg-[#336a94] disabled:opacity-50 text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
      >
        {analyzing ? t("photo_analyzing") : t("photo_analyze")}
      </button>

      {praised && (
        <div data-testid="photo-compliment" className="mt-4 flex items-center gap-3 bg-[#5aa0cf]/15 border border-[#5aa0cf]/40 rounded-2xl p-4">
          <PartyPopper className="w-6 h-6 text-[#2e6690] dark:text-[#a9d2ec] shrink-0" />
          <p className="text-sm font-bold text-[#2e6690] dark:text-[#a9d2ec]">{t("photo_compliment")}</p>
        </div>
      )}

      {result && (
        <div className="print-area">
          <PrintHeader title={modeLabel(mode)} lang={lang} />
          <div data-testid="photo-result" className="markdown-body mt-5 bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] rounded-2xl p-5 text-sm leading-relaxed text-[#2B303B] dark:text-[#e4eff8]">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      )}
      {result && (
        <ListenButton text={result} who="momy" testid="photo-listen-btn"
          className="no-print mt-2 w-full bg-[#3f7cac] hover:bg-[#336a94] text-white font-medium px-4 py-3 rounded-2xl flex items-center justify-center gap-2 active:scale-98 transition-all" />
      )}
      {result && (
        <button data-testid="photo-share-btn" onClick={() => shareContent(`${modeLabel(mode)} — MikiLab`, result, lang)}
          className="mt-2 w-full bg-[#e4eff8] dark:bg-[#2A323A] text-[#2B303B] dark:text-[#e4eff8] font-medium px-4 py-3 rounded-2xl border border-[#d5e4f0] dark:border-[#38424B] flex items-center justify-center gap-2 active:scale-98 transition-all">
          <Share2 className="w-5 h-5" /> {lang === "de" ? "Teilen" : lang === "en" ? "Share" : "Condividi"}
        </button>
      )}
      {result && (
        <button data-testid="photo-pdf-btn" onClick={() => window.print()}
          className="no-print mt-2 w-full bg-[#5aa0cf] hover:bg-[#336a94] text-white font-medium px-4 py-3 rounded-2xl flex items-center justify-center gap-2 active:scale-98 transition-all">
          <Printer className="w-5 h-5" /> {lang === "de" ? "Als PDF / Drucken" : lang === "en" ? "PDF / Print" : "PDF / Stampa"}
        </button>
      )}

      {recent.length > 0 && (
        <div data-testid="diagnosi-recenti" className="mt-8">
          <div className="flex items-center gap-2 mb-3 text-[#3f7cac]">
            <History className="w-5 h-5" />
            <h2 className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8]">
              {lang === "de" ? "Letzte Diagnosen" : lang === "en" ? "Recent diagnoses" : "Diagnosi Recenti"}
            </h2>
          </div>
          <p className="text-xs text-[#7E8A93] mb-3">
            {lang === "de" ? "Sieh dir Ursache & Lösung erneut an, ohne ein neues Foto zu machen." : lang === "en" ? "Review cause & fix again, without taking a new photo." : "Rivedi causa e soluzione senza rifare la foto."}
          </p>
          <div className="space-y-2.5">
            {recent.map((d) => {
              const isOpen = openRec === d.id;
              return (
                <div key={d.id} data-testid={`diagnosi-item-${d.id}`} className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] overflow-hidden">
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-12 h-12 rounded-xl bg-[#e4eff8] dark:bg-[#1F252B] flex items-center justify-center shrink-0 overflow-hidden relative">
                      <Camera className="w-5 h-5 text-[#7E8A93]" />
                      {d.thumb && <img src={d.thumb} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} className="absolute inset-0 w-full h-full object-cover" />}
                    </div>
                    <button data-testid={`diagnosi-open-${d.id}`} onClick={() => setOpenRec(isOpen ? null : d.id)} className="flex-1 min-w-0 text-left">
                      <p className="font-semibold text-sm text-[#2B303B] dark:text-[#e4eff8] truncate">{modeLabel(d.mode)}</p>
                      <p className="text-[11px] text-[#7E8A93]">{new Date(d.created_at).toLocaleString(lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </button>
                    <button data-testid={`diagnosi-share-${d.id}`} onClick={() => shareContent(`${modeLabel(d.mode)} — MikiLab`, d.result, lang)} className="p-2 text-[#3f7cac] active:scale-90 shrink-0" aria-label="share"><Share2 className="w-4 h-4" /></button>
                    <button data-testid={`diagnosi-delete-${d.id}`} onClick={() => deleteRecent(d.id)} className="p-2 text-[#C0574D] active:scale-90 shrink-0" aria-label="delete"><Trash2 className="w-4 h-4" /></button>
                    <button onClick={() => setOpenRec(isOpen ? null : d.id)} className="p-1 text-[#7E8A93] shrink-0" aria-label="toggle"><ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} /></button>
                  </div>
                  {isOpen && (
                    <div className="markdown-body px-4 pb-4 text-sm leading-relaxed text-[#2B303B] dark:text-[#e4eff8] border-t border-[#e4eff8] dark:border-[#38424B] pt-3">
                      <ReactMarkdown>{d.result}</ReactMarkdown>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

