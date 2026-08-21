import { useRef, useState, useEffect } from "react";
import { Radio, X, Play, Square, Loader2, Volume2, Flame } from "lucide-react";
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
  ],
  de: [
    { id: "swr3", name: "SWR3", url: "https://liveradio.swr.de/sw282p3/swr3/play.mp3" },
    { id: "antenne", name: "Antenne Bayern", url: "https://stream.antenne.de/antenne/stream/mp3" },
    { id: "bigfm", name: "bigFM", url: "https://stream.bigfm.de/berlin/aac-128" },
  ],
};

export default function RadioFornaio() {
  const { t } = useLang();
  const { on: ambientOn, toggle: toggleAmbient, volume: ambientVol, setVolume: setAmbientVol } = useAmbient();
  const [open, setOpen] = useState(false);
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
  const nowPlaying = allStations.find((s) => s.id === current);

  const renderGroup = (label, list) => (
    <div className="mb-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C7567] mb-1.5">{label}</p>
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
                  ? "bg-[#B34A26] text-white border-[#B34A26] shadow-sm"
                  : "bg-white dark:bg-[#241D19] text-[#2C221E] dark:text-[#F5EFE6] border-[#E8DEC8] dark:border-[#3D302A]"
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
          <div data-testid="radio-panel" className="pointer-events-auto w-full max-w-xl bg-[#FDFBF7] dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl shadow-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Radio className="w-5 h-5 text-[#B34A26]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#2C221E] dark:text-[#F5EFE6] leading-none">{t("radio_title")}</p>
                <p className="text-[11px] text-[#8C7567] mt-0.5">{t("radio_sub")}</p>
              </div>
              <button data-testid="radio-close" onClick={() => setOpen(false)} className="text-[#8C7567] p-1"><X className="w-4 h-4" /></button>
            </div>

            {/* Sottofondo d'ambiente: scoppiettio del forno */}
            <button
              data-testid="ambient-toggle"
              onClick={toggleAmbient}
              className={`w-full mb-3 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all active:scale-98 ${
                ambientOn ? "bg-[#B34A26] text-white border-[#B34A26]" : "bg-[#D99B26]/10 text-[#8C3A1D] dark:text-[#E5AC3A] border-[#D99B26]/40"
              }`}
            >
              <Flame className={`w-5 h-5 shrink-0 ${ambientOn ? "text-white" : "text-[#B34A26]"}`} />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold">{t("ambient_fire_title")}</span>
                <span className={`block text-[11px] ${ambientOn ? "text-white/80" : "text-[#8C7567]"}`}>{ambientOn ? t("ambient_on") : t("ambient_off")}</span>
              </span>
            </button>
            {ambientOn && (
              <div className="flex items-center gap-2 -mt-1 mb-3 px-1">
                <Flame className="w-4 h-4 text-[#B34A26] shrink-0" />
                <input
                  data-testid="ambient-volume"
                  type="range" min="0" max="1" step="0.05" value={ambientVol}
                  onChange={(e) => setAmbientVol(Number(e.target.value))}
                  className="flex-1 accent-[#B34A26]"
                />
              </div>
            )}

            {renderGroup(`🇮🇹 ${t("radio_it")}`, STATIONS.it)}
            {renderGroup(`🇩🇪 ${t("radio_de")}`, STATIONS.de)}

            {nowPlaying && (
              <div data-testid="radio-now-playing" className="mt-1 flex items-center gap-2 bg-[#D99B26]/12 border border-[#D99B26]/30 rounded-xl px-3 py-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${status === "playing" ? "bg-[#6B8E62] animate-pulse" : status === "error" ? "bg-[#B4442A]" : "bg-[#D99B26]"}`} />
                <p className="text-xs text-[#4A3B34] dark:text-[#C9BBB0] flex-1 truncate">
                  {status === "error" ? t("radio_error") : status === "loading" ? t("radio_loading") : `${t("radio_now_playing")}: ${nowPlaying.name}`}
                </p>
                <button data-testid="radio-stop-btn" onClick={stop} className="text-[#B4442A] p-1"><Square className="w-4 h-4 fill-current" /></button>
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#8C7567] shrink-0" />
              <input
                data-testid="radio-volume"
                type="range" min="0" max="1" step="0.05" value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="flex-1 accent-[#B34A26]"
              />
            </div>
          </div>
        </div>
      )}

      <div className="fixed z-50 left-4 bottom-24 flex flex-col items-center gap-1">
        <button
          data-testid="radio-fornaio-btn"
          onClick={() => setOpen((o) => !o)}
          aria-label={t("radio_title")}
          className={`relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 ${
            status === "playing" ? "bg-[#6B8E62]" : "bg-[#8C3A1D] hover:bg-[#732f18]"
          }`}
        >
          {status !== "playing" && !open && <span aria-hidden className="absolute inset-0 rounded-full bg-[#8C3A1D] opacity-50 animate-ping" />}
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
        <span className="text-[9px] font-bold text-[#8C3A1D] bg-[#FDFBF7]/90 dark:bg-[#1A1412]/90 px-1.5 py-0.5 rounded-full shadow-sm">{t("radio_label")}</span>
      </div>
    </>
  );
}
