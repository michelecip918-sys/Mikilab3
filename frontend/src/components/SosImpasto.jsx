import { useState, useRef, useEffect } from "react";
import { X, Loader2, Stethoscope, RotateCcw, BookOpen, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import DualPhotoButtons from "@/components/DualPhotoButtons";
import { API, uploadApi, academyApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { mkTri } from "@/i18n/triMaps";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = (e) => resolve(e.target.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// SOS Impasto: manda la foto del pane a Mohammadreza per una diagnosi immediata (login richiesto).
export default function SosImpasto({ open, onClose, onNavigate }) {
  const { lang } = useLang();
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const { user, setAuthOpen } = useAuth();
  const [photo, setPhoto] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [rec, setRec] = useState(null); // ricetta consigliata
  const [recLoading, setRecLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [result, rec]);

  if (!open) return null;

  const analyze = async (dataUrl, thumbUrl) => {
    setBusy(true); setResult(""); setRec(null);
    let full = "";
    try {
      const res = await fetch(`${API}/academy/sos`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ mode: "sos", image_base64: dataUrl, thumb: thumbUrl || "", lang }),
      });
      if (res.status === 401) { onClose(); setAuthOpen && setAuthOpen(true); return; }
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n"); buffer = parts.pop();
        for (const part of parts) {
          const line = part.replace(/^data: ?/, "").trim(); if (!line) continue;
          let obj; try { obj = JSON.parse(line); } catch { continue; }
          if (obj.done) continue;
          if (obj.d) { full += obj.d; setResult((p) => p + obj.d); }
        }
      }
    } catch {
      setResult(tri("Ops, riprova tra poco.", "Ups, versuch es gleich nochmal.", "Oops, try again shortly.", "Ups, inténtalo de nuevo."));
    } finally { setBusy(false); }
    // consiglio ricetta MikiLab in base alla diagnosi
    if (full.trim() && !full.startsWith("[")) {
      setRecLoading(true);
      try { const r = await academyApi.sosRecipe(full, lang); if (r && r.recipe_id) setRec(r); } catch { /* */ }
      finally { setRecLoading(false); }
    }
  };

  const openRecipe = () => {
    if (!rec) return;
    window.__mikilabPendingRecipe = rec.recipe_id; // risolto da RecipeList al caricamento
    onClose();
    if (onNavigate) onNavigate("ricette");
    setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id: rec.recipe_id } })), 300);
  };

  const onFile = async (f) => {
    if (!user) { onClose(); setAuthOpen && setAuthOpen(true); return; }
    const dataUrl = await fileToDataUrl(f);
    setPhoto(dataUrl);
    let thumbUrl = "";
    try { thumbUrl = await uploadApi.image(f, `sos-${Date.now()}.jpg`); } catch { /* */ }
    analyze(dataUrl, thumbUrl);
  };

  const reset = () => { setPhoto(""); setResult(""); setRec(null); };

  return (
    <div className="fixed inset-0 z-[75] flex items-end sm:items-center justify-center" data-testid="sos-panel">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white dark:bg-[#121212] rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[88vh] flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 p-4 text-white shrink-0" style={{ background: "linear-gradient(135deg,#7a1f1f,#ff6b00 55%,#ff6b00)" }}>
          <Stethoscope className="w-6 h-6 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold leading-none">{tri("SOS Impasto", "SOS Teig", "Dough SOS", "SOS Masa")}</p>
            <p className="text-[12px] text-white/90 mt-0.5">{tri("Diagnosi immediata da Mohammadreza", "Sofortdiagnose von Mohammadreza", "Instant diagnosis from Mohammadreza", "Diagnóstico inmediato de Mohammadreza")}</p>
          </div>
          <button data-testid="sos-close" onClick={onClose} className="p-1 active:scale-90"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 overflow-y-auto space-y-3">
          {!photo && (
            <>
              <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] leading-relaxed">
                {tri("Scatta o carica una foto del tuo pane o impasto: analizzo crosta, mollica, forma e cottura e ti dico causa e rimedio.",
                  "Mach oder lade ein Foto deines Brotes/Teigs hoch: Ich analysiere Kruste, Krume, Form und Backen und nenne Ursache und Lösung.",
                  "Take or upload a photo of your bread or dough: I analyse crust, crumb, shape and bake and give you cause and fix.",
                  "Haz o sube una foto de tu pan o masa: analizo corteza, miga, forma y cocción y te digo causa y solución.")}
              </p>
              <DualPhotoButtons testid="sos-photo" onFile={onFile} />
            </>
          )}

          {photo && (
            <div className="relative">
              <img src={photo} alt="" className="w-full h-48 object-cover rounded-2xl" />
              <button data-testid="sos-reset" onClick={reset} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 flex items-center gap-1 text-xs"><RotateCcw className="w-4 h-4" /></button>
            </div>
          )}

          {(busy || result) && (
            <div data-testid="sos-result" className="rounded-2xl bg-[#121212] dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] p-4">
              {busy && !result ? (
                <div className="flex items-center gap-2 text-[#ff6b00]"><Loader2 className="w-5 h-5 animate-spin" /> {tri("Analisi in corso…", "Analyse läuft…", "Analysing…", "Analizando…")}</div>
              ) : (
                <div className="markdown-body text-sm leading-relaxed text-[#2B303B] dark:text-[#e4eff8]"><ReactMarkdown>{result}</ReactMarkdown></div>
              )}
              <div ref={endRef} />
            </div>
          )}

          {rec && (
            <button data-testid="sos-recipe-suggestion" onClick={openRecipe}
              className="w-full flex items-center gap-3 rounded-2xl p-3.5 text-left bg-gradient-to-br from-[#ff6b00] to-[#7a531d] text-white shadow-md active:scale-98 transition-all">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><BookOpen className="w-5 h-5" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-white/80">{tri("Ricetta consigliata da Mohammadreza", "Von Mohammadreza empfohlenes Rezept", "Recipe recommended by Mohammadreza", "Receta recomendada por Mohammadreza")}</p>
                <p className="font-display text-base font-bold leading-tight truncate">{rec.name}</p>
                {rec.reason && <p className="text-[12px] text-white/90 leading-snug line-clamp-2">{rec.reason}</p>}
              </div>
              <ChevronRight className="w-5 h-5 shrink-0" />
            </button>
          )}
          {busy && result && (
            <p className="text-[11px] text-[#7E8A93] text-center">{tri("Cerco la ricetta più adatta…", "Suche das passende Rezept…", "Finding the best recipe…", "Buscando la mejor receta…")}</p>
          )}
          {recLoading && !rec && (
            <p className="text-[11px] text-[#ff6b00] text-center flex items-center justify-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> {tri("Cerco la ricetta più adatta…", "Suche das passende Rezept…", "Finding the best recipe…", "Buscando la mejor receta…")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
