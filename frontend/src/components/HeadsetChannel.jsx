import { useState, useRef, useEffect } from "react";
import { Headphones, Mic, Volume2, Loader2, ArrowRight } from "lucide-react";
import { voiceApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const LANGS = [
  { code: "it", flag: "🇮🇹", label: "Italiano" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "es", flag: "🇪🇸", label: "Español" },
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "fa", flag: "🇮🇷", label: "فارسی" },
];
const HK = "mikilab_headset_lang";
const SR_LOCALE = { it: "it-IT", de: "de-DE", en: "en-US", es: "es-ES", fr: "fr-FR", fa: "fa-IR" };

// Canale Headset Bluetooth · traduzione vocale in tempo reale per squadra multilingua.
// L'operatore parla nella propria lingua → BakoMix traduce e legge nella lingua del compagno.
export default function HeadsetChannel() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [target, setTarget] = useState(() => { try { return localStorage.getItem(HK) || "en"; } catch { return "en"; } });
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [src, setSrc] = useState("");
  const [out, setOut] = useState("");
  const recRef = useRef(null);
  const supported = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => { try { localStorage.setItem(HK, target); } catch { /* */ } }, [target]);

  const speak = (text, l) => { try { playTTS(text, { lang: l, voice: "bakemix" }); } catch { /* */ } };

  const testChannel = () => {
    const greet = tri("Canale headset attivo. Buon lavoro.", "Headset-Kanal aktiv. Gute Arbeit.", "Headset channel active. Have a good shift.", "Canal de auriculares activo. Buen trabajo.", "Canal casque actif. Bon travail.", "کانال هدست فعال است. کارت خوب باشد.");
    speak(greet, target);
  };

  const translateAndSpeak = async (text) => {
    if (!text) return;
    setBusy(true); setSrc(text); setOut("");
    try {
      const r = await voiceApi.translate(text, target);
      setOut(r.text || "");
      speak(r.text || text, target);
    } catch {
      setOut(text); speak(text, target);
    } finally { setBusy(false); }
  };

  const listen = () => {
    if (!supported) return;
    if (listening && recRef.current) { try { recRef.current.stop(); } catch { /* */ } return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = SR_LOCALE[lang] || "it-IT";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.onresult = (ev) => {
      const t = ev.results && ev.results[0] && ev.results[0][0] ? ev.results[0][0].transcript : "";
      if (t) translateAndSpeak(t);
    };
    recRef.current = rec;
    try { rec.start(); } catch { setListening(false); }
  };

  const curTarget = LANGS.find((l) => l.code === target) || LANGS[2];

  return (
    <div data-testid="headset-channel" className="w-full rounded-2xl bg-[#0b0f19] border border-[#3E9C93]/40 p-4 space-y-3 text-left">
      <div className="flex items-center gap-2">
        <Headphones className="w-5 h-5 text-[#3E9C93]" />
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold text-[#3E9C93]">{tri("Canale Headset · Traduzione vocale", "Headset-Kanal · Sprachübersetzung", "Headset Channel · Voice translation", "Canal auriculares · Traducción de voz", "Canal casque · Traduction vocale", "کانال هدست · ترجمه صوتی")}</h3>
          <p className="text-[11px] text-[#94A3B8]">{tri("Parla nella tua lingua: il compagno la sente nella sua.", "Sprich in deiner Sprache: der Kollege hört sie in seiner.", "Speak your language: your teammate hears it in theirs.", "Habla tu idioma: tu compañero lo escucha en el suyo.", "Parle ta langue : ton coéquipier l'entend dans la sienne.", "به زبان خودت صحبت کن: همکارت به زبان خودش می‌شنود.")}</p>
        </div>
      </div>

      {/* Lingua del compagno / headset di destinazione */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] mb-1.5">{tri("Lingua headset (destinazione)", "Headset-Sprache (Ziel)", "Headset language (target)", "Idioma auriculares (destino)", "Langue casque (cible)", "زبان هدست (مقصد)")}</p>
        <div className="flex flex-wrap gap-1.5">
          {LANGS.map((l) => (
            <button key={l.code} data-testid={`headset-lang-${l.code}`} onClick={() => setTarget(l.code)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${target === l.code ? "bg-[#3E9C93] text-[#030712] border-[#3E9C93]" : "bg-[#030712] text-[#94A3B8] border-[#1e293b] hover:border-[#3E9C93]/50"}`}>
              <span>{l.flag}</span> {l.code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button data-testid="headset-listen-btn" onClick={listen} disabled={!supported || busy}
          className={`flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm active:scale-95 transition-all border ${listening ? "bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse" : "bg-[#3E9C93]/15 border-[#3E9C93]/50 text-[#3E9C93]"} disabled:opacity-40`}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
          {listening ? tri("Ascolto… tocca per fermare", "Höre zu… zum Stoppen tippen", "Listening… tap to stop", "Escuchando… toca para parar", "Écoute… touche pour arrêter", "در حال شنیدن… برای توقف بزن") : tri("Parla", "Sprechen", "Speak", "Hablar", "Parler", "صحبت کن")}
        </button>
        <button data-testid="headset-test-btn" onClick={testChannel} title={tri("Prova canale", "Kanal testen", "Test channel", "Probar canal", "Tester le canal", "تست کانال")}
          className="shrink-0 w-12 h-12 rounded-2xl bg-[#0f172a] border border-[#1e293b] text-[#3E9C93] flex items-center justify-center active:scale-95 transition-all">
          <Volume2 className="w-5 h-5" />
        </button>
      </div>

      {!supported && (
        <p data-testid="headset-unsupported" className="text-[11px] text-amber-400">{tri("Il riconoscimento vocale non è disponibile su questo browser: usa 'Prova canale' per verificare l'audio.", "Spracherkennung in diesem Browser nicht verfügbar: nutze 'Kanal testen'.", "Speech recognition not available on this browser: use 'Test channel'.", "Reconocimiento de voz no disponible: usa 'Probar canal'.", "Reconnaissance vocale indisponible : utilise 'Tester le canal'.", "تشخیص گفتار در این مرورگر نیست: از 'تست کانال' استفاده کن.")}</p>
      )}

      {(src || out) && (
        <div data-testid="headset-transcript" className="rounded-xl bg-[#030712] border border-[#1e293b] p-3 text-sm">
          <p className="text-[#94A3B8]">{src}</p>
          {out && <p className="flex items-start gap-1.5 mt-1.5 text-white font-semibold"><ArrowRight className="w-4 h-4 text-[#3E9C93] mt-0.5 shrink-0" /> <span>{curTarget.flag} {out}</span></p>}
        </div>
      )}
    </div>
  );
}
