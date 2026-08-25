import { useRef, useState, useEffect } from "react";
import { Radio, X, Play, Square, Loader2, Volume2, Flame, Mic } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useAmbient } from "@/audio/AmbientContext";

const STATIONS = {
  it: [
    { id: "rai1", name: "RAI Radio 1", url: "https://icestreaming.rai.it/1.mp3" },
    { id: "rai2", name: "RAI Radio 2", url: "https://icestreaming.rai.it/2.mp3" },
    { id: "rai3", name: "RAI Radio 3", url: "https://icestreaming.rai.it/3.mp3" },
    { id: "rtl", name: "RTL 102.5", url: "https://streamingv2.shoutcast.com/rtl-1025" },
    { id: "r105", name: "Radio 105", url: "https://icy.unitedradio.it/Radio105.mp3" },
    { id: "virgin", name: "Virgin Radio", url: "https://icy.unitedradio.it/Virgin.mp3" },
    { id: "deejay", name: "Radio Deejay", url: "https://radiodeejay-lh.akamaihd.net/i/RadioDeejay_Live_1@189857/master.m3u8" },
    { id: "kisskiss", name: "Radio Kiss Kiss", url: "https://ice07.fluidstream.net/KissKiss.mp3" },
  ],
  de: [
    { id: "swr3", name: "SWR3", url: "https://liveradio.swr.de/sw282p3/swr3/play.mp3" },
    { id: "antenne1", name: "Antenne 1", url: "https://stream.antenne1.de/a1stg/mp3-128/" },
    { id: "antenne", name: "Antenne Bayern", url: "https://stream.antenne.de/antenne/stream/mp3" },
    { id: "bigfm", name: "bigFM", url: "https://stream.bigfm.de/berlin/aac-128" },
    { id: "swr1bw", name: "SWR1 BW", url: "https://liveradio.swr.de/sw282p3/swr1bw/play.mp3" },
  ],
};

export default function RadioFornaio() {
  const { t, lang, tri } = useLang();
  const { on: ambientOn, toggle: toggleAmbient, volume: ambientVol, setVolume: setAmbientVol, mode: ambientMode, setMode: setAmbientMode } = useAmbient();
  const AMB = [
    { id: "fire", label: lang === "de" ? "Ofen" : lang === "en" ? "Oven" : "Forno", emoji: "🔥" },
    { id: "rain", label: lang === "de" ? "Regen" : lang === "en" ? "Rain" : "Pioggia", emoji: "🌧️" },
    { id: "mixer", label: lang === "de" ? "Kneter" : lang === "en" ? "Mixer" : "Impastatrice", emoji: "🌀" },
    { id: "morning", label: lang === "de" ? "Morgen" : lang === "en" ? "Morning" : "Mattino", emoji: "🌅" },
  ];
  const [open, setOpen] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  useEffect(() => {
    let tId;
    const onScroll = () => { setScrolling(true); clearTimeout(tId); tId = setTimeout(() => setScrolling(false), 650); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); clearTimeout(tId); };
  }, []);
  const [current, setCurrent] = useState(null); // station id
  const [status, setStatus] = useState("idle"); // idle | loading | playing | error
  const [volume, setVolume] = useState(0.9);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!audioRef.current) audioRef.current = new Audio();
    const a = audioRef.current;
    a.volume = volume;
    const onPlaying = () => setStatus("playing");
    const onWaiting = () => setStatus("loading");
    const onError = () => setStatus("error");
    a.addEventListener("playing", onPlaying);
    a.addEventListener("waiting", onWaiting);
    a.addEventListener("error", onError);
    return () => {
      a.removeEventListener("playing", onPlaying);
      a.removeEventListener("waiting", onWaiting);
      a.removeEventListener("error", onError);
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const stop = () => {
    const a = audioRef.current;
    if (a) { a.pause(); a.removeAttribute("src"); a.load(); }
    setCurrent(null);
    setStatus("idle");
  };

  const playStation = (st) => {
    const a = audioRef.current;
    if (current === st.id && status === "playing") { stop(); return; }
    setCurrent(st.id);
    setStatus("loading");
    a.src = st.url;
    const p = a.play();
    if (p && p.catch) p.catch(() => setStatus("error"));
  };

  const allStations = [...STATIONS.it, ...STATIONS.de];

  const [listening, setListening] = useState(false);
  const listenStation = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setListening(false); alert(t("voice_unsupported")); return; }
    const rec = new SR();
    rec.lang = lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT";
    rec.onresult = (e) => {
      const said = (e.results[0][0].transcript || "").toLowerCase();
      setListening(false);
      if (/\b(stop|spegni|ferma|aus|halt)\b/.test(said)) { stop(); return; }
      const match = allStations.find((s) => {
        const n = s.name.toLowerCase();
        return said.includes(n) || n.split(/\s+/).some((w) => w.length > 2 && said.includes(w));
      });
      if (match) { setOpen(true); playStation(match); }
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    setListening(true);
    try { rec.start(); } catch (err) { setListening(false); }
  };
  const nowPlaying = allStations.find((s) => s.id === current);

  const renderGroup = (label, list) => (
    <div className="mb-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#7E8A93] mb-1.5">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {list.map((st) => {
          const active = current === st.id;
          return (
            <button
              key={st.id}
              data-testid={`radio-station-${st.id}`}
              onClick={() => playStation(st)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all active:scale-98 border ${
                active
                  ? "bg-[#5E8B7E] text-white border-[#5E8B7E] shadow-sm"
                  : "bg-white dark:bg-[#1F252B] text-[#2B303B] dark:text-[#EAF0EC] border-[#D7E1DB] dark:border-[#38424B]"
              }`}
            >
              {active && status === "loading" ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : active && status === "playing" ? (
                <Square className="w-4 h-4 shrink-0 fill-current" />
              ) : (
                <Play className="w-4 h-4 shrink-0" />
              )}
              <span className="truncate">{st.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {open && (
        <div className="fixed inset-x-0 bottom-40 z-40 px-4 flex justify-center pointer-events-none">
          <div data-testid="radio-panel" className="pointer-events-auto w-full max-w-xl bg-[#F6F8F5] dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] rounded-2xl shadow-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Radio className="w-5 h-5 text-[#5E8B7E]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#2B303B] dark:text-[#EAF0EC] leading-none">{t("radio_title")}</p>
                <p className="text-[11px] text-[#7E8A93] mt-0.5">{t("radio_sub")}</p>
              </div>
              <button data-testid="radio-voice" onClick={listenStation}
                className={`p-1.5 rounded-lg mr-1 ${listening ? "bg-[#5E8B7E] text-white animate-pulse" : "text-[#5E8B7E]"}`}
                aria-label="voice" title={tri("Cambia stazione a voce", "Sender per Stimme wechseln", "Change station by voice")}>
                <Mic className="w-4 h-4" />
              </button>
              <button data-testid="radio-close" onClick={() => setOpen(false)} className="text-[#7E8A93] p-1"><X className="w-4 h-4" /></button>
            </div>

            {/* Sottofondo d'ambiente: scoppiettio del forno */}
            <button
              data-testid="ambient-toggle"
              onClick={toggleAmbient}
              className={`w-full mb-3 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all active:scale-98 ${
                ambientOn ? "bg-[#5E8B7E] text-white border-[#5E8B7E]" : "bg-[#6E8CA0]/10 text-[#33564E] dark:text-[#8FB0C2] border-[#6E8CA0]/40"
              }`}
            >
              <Flame className={`w-5 h-5 shrink-0 ${ambientOn ? "text-white" : "text-[#5E8B7E]"}`} />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold">{t("ambient_fire_title")}</span>
                <span className={`block text-[11px] ${ambientOn ? "text-white/80" : "text-[#7E8A93]"}`}>{ambientOn ? t("ambient_on") : t("ambient_off")}</span>
              </span>
            </button>
            {ambientOn && (
              <div className="-mt-1 mb-3">
                <div data-testid="ambient-modes" className="grid grid-cols-4 gap-1.5 mb-2">
                  {AMB.map((a) => (
                    <button key={a.id} data-testid={`ambient-mode-${a.id}`} onClick={() => setAmbientMode(a.id)}
                      className={`flex flex-col items-center gap-0.5 py-1.5 rounded-xl border text-[10px] font-semibold transition-all active:scale-95 ${
                        ambientMode === a.id ? "bg-[#5E8B7E] text-white border-[#5E8B7E]" : "bg-white dark:bg-[#1F252B] text-[#7E8A93] border-[#D7E1DB] dark:border-[#38424B]"
                      }`}>
                      <span className="text-base leading-none">{a.emoji}</span>{a.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 px-1">
                  <Flame className="w-4 h-4 text-[#5E8B7E] shrink-0" />
                  <input
                    data-testid="ambient-volume"
                    type="range" min="0" max="1" step="0.05" value={ambientVol}
                    onChange={(e) => setAmbientVol(Number(e.target.value))}
                    className="flex-1 accent-[#5E8B7E]"
                  />
                </div>
              </div>
            )}

            {renderGroup(`🇮🇹 ${t("radio_it")}`, STATIONS.it)}
            {renderGroup(`🇩🇪 ${t("radio_de")}`, STATIONS.de)}

            {nowPlaying && (
              <div data-testid="radio-now-playing" className="mt-1 flex items-center gap-2 bg-[#6E8CA0]/12 border border-[#6E8CA0]/30 rounded-xl px-3 py-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${status === "playing" ? "bg-[#6B8E62] animate-pulse" : status === "error" ? "bg-[#C0574D]" : "bg-[#6E8CA0]"}`} />
                <p className="text-xs text-[#3F4A54] dark:text-[#AEB8BF] flex-1 truncate">
                  {status === "error" ? t("radio_error") : status === "loading" ? t("radio_loading") : `${t("radio_now_playing")}: ${nowPlaying.name}`}
                </p>
                <button data-testid="radio-stop-btn" onClick={stop} className="text-[#C0574D] p-1"><Square className="w-4 h-4 fill-current" /></button>
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#7E8A93] shrink-0" />
              <input
                data-testid="radio-volume"
                type="range" min="0" max="1" step="0.05" value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="flex-1 accent-[#5E8B7E]"
              />
            </div>
          </div>
        </div>
      )}

      <div className={`fixed z-40 left-4 bottom-20 flex flex-col items-center gap-1 transition-all duration-300 ${scrolling && !open ? "translate-y-24 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`} style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
        <button
          data-testid="radio-fornaio-btn"
          onClick={() => setOpen((o) => !o)}
          aria-label={t("radio_title")}
          className={`relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 ${
            status === "playing" ? "bg-[#6B8E62]" : "bg-[#33564E] hover:bg-[#33564E]"
          }`}
        >
          {status !== "playing" && !open && <span aria-hidden className="absolute inset-0 rounded-full bg-[#33564E] opacity-50 animate-ping" />}
          {status === "playing" ? (
            <span className="flex items-end gap-0.5 h-5 relative" aria-hidden>
              <span className="w-1 bg-white rounded-full animate-[eq_0.8s_ease-in-out_infinite]" style={{ height: "60%" }} />
              <span className="w-1 bg-white rounded-full animate-[eq_0.8s_ease-in-out_infinite]" style={{ height: "100%", animationDelay: "0.15s" }} />
              <span className="w-1 bg-white rounded-full animate-[eq_0.8s_ease-in-out_infinite]" style={{ height: "40%", animationDelay: "0.3s" }} />
            </span>
          ) : (
            <Radio className="w-6 h-6 text-white relative" />
          )}
        </button>
        <span className="text-[9px] font-bold text-[#33564E] bg-[#F6F8F5]/90 dark:bg-[#1B2127]/90 px-1.5 py-0.5 rounded-full shadow-sm">{t("radio_label")}</span>
      </div>
    </>
  );
}
