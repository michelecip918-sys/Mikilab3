import { mkTri } from "@/i18n/triMaps";
import { useRef, useState, useEffect } from "react";
import { Radio, X, Play, Square, Loader2, Volume2, Flame, Mic, Star, RotateCcw, Search, Plus, Trash2 } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useAmbient } from "@/audio/AmbientContext";
import { useSoundFX } from "@/audio/SoundFXContext";
import { useBackClose } from "@/lib/backNav";

const STATIONS = {
  it: [
    { id: "rai1", name: "RAI Radio 1", url: "https://icestreaming.rai.it/1.mp3" },
    { id: "rai2", name: "RAI Radio 2", url: "https://icestreaming.rai.it/2.mp3" },
    { id: "rai3", name: "RAI Radio 3", url: "https://icestreaming.rai.it/3.mp3" },
    { id: "raigr", name: "RAI GR Parlamento", url: "https://icestreaming.rai.it/5.mp3" },
    { id: "isoradio", name: "RAI Isoradio", url: "https://icestreaming.rai.it/6.mp3" },
    { id: "rtl", name: "RTL 102.5", url: "https://streamingv2.shoutcast.com/rtl-1025" },
    { id: "r105", name: "Radio 105", url: "https://icy.unitedradio.it/Radio105.mp3" },
    { id: "virgin", name: "Virgin Radio", url: "https://icy.unitedradio.it/Virgin.mp3" },
    { id: "r101", name: "R101", url: "https://icy.unitedradio.it/R101.mp3" },
    { id: "rmc", name: "Radio Monte Carlo", url: "https://icy.unitedradio.it/RMC.mp3" },
    { id: "subasio", name: "Radio Subasio", url: "https://icy.unitedradio.it/Subasio.mp3" },
    { id: "deejay", name: "Radio Deejay", url: "https://radiodeejay-lh.akamaihd.net/i/RadioDeejay_Live_1@189857/master.m3u8" },
    { id: "capital", name: "Radio Capital", url: "https://radiocapital-lh.akamaihd.net/i/RadioCapital_Live_1@196312/master.m3u8" },
    { id: "kisskiss", name: "Radio Kiss Kiss", url: "https://ice07.fluidstream.net/KissKiss.mp3" },
    { id: "freccia", name: "Radiofreccia", url: "https://streamingv2.shoutcast.com/radiofreccia" },
    { id: "radioitalia", name: "Radio Italia", url: "https://radioitaliasmi.akamaized.net/hls/live/2093120/RISMI/master.m3u8" },
  ],
  de: [
    { id: "swr3", name: "SWR3", url: "https://liveradio.swr.de/sw282p3/swr3/play.mp3" },
    { id: "swr1bw", name: "SWR1 BW", url: "https://liveradio.swr.de/sw282p3/swr1bw/play.mp3" },
    { id: "1live", name: "1LIVE", url: "https://wdr-1live-live.icecastssl.wdr.de/wdr/1live/live/mp3/128/stream.mp3" },
    { id: "wdr2", name: "WDR 2", url: "https://wdr-wdr2-rheinland.icecastssl.wdr.de/wdr/wdr2/rheinland/mp3/128/stream.mp3" },
    { id: "ndr2", name: "NDR 2", url: "https://icecast.ndr.de/ndr/ndr2/niedersachsen/mp3/128/stream.mp3" },
    { id: "antenne1", name: "Antenne 1", url: "https://stream.antenne1.de/a1stg/mp3-128/" },
    { id: "antenne", name: "Antenne Bayern", url: "https://stream.antenne.de/antenne/stream/mp3" },
    { id: "bayern3", name: "Bayern 3", url: "https://dispatcher.rndfnk.com/br/br3/live/mp3/mid" },
    { id: "bigfm", name: "bigFM", url: "https://stream.bigfm.de/berlin/aac-128" },
    { id: "rockantenne", name: "Rock Antenne", url: "https://stream.rockantenne.de/rockantenne/stream/mp3" },
    { id: "sunshine", name: "sunshine live", url: "https://stream.sunshine-live.de/live/mp3-192/" },
    { id: "klassik", name: "Klassik Radio", url: "https://stream.klassikradio.de/live/mp3-192/" },
    { id: "ffh", name: "HIT RADIO FFH", url: "https://mp3.ffh.de/radioffh/hqlivestream.mp3" },
    { id: "planet", name: "planet radio", url: "https://streams.planetradio.de/planetradio/mp3/hqlivestream" },
    { id: "dlf", name: "Deutschlandfunk", url: "https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3" },
  ],
  intl: [
    { id: "fip", name: "FIP (FR)", url: "https://icecast.radiofrance.fr/fip-midfi.mp3" },
    { id: "fipjazz", name: "FIP Jazz", url: "https://icecast.radiofrance.fr/fipjazz-midfi.mp3" },
    { id: "fiprock", name: "FIP Rock", url: "https://icecast.radiofrance.fr/fiprock-midfi.mp3" },
    { id: "jazzradio", name: "Jazz Radio", url: "https://jazzradio.ice.infomaniak.ch/jazzradio-high.mp3" },
    { id: "nova", name: "Radio Nova", url: "https://novazz.ice.infomaniak.ch/novazz-128.mp3" },
    { id: "rsjazz", name: "Radio Swiss Jazz", url: "https://stream.srg-ssr.ch/m/rsj/mp3_128" },
    { id: "rsclassic", name: "Radio Swiss Classic", url: "https://stream.srg-ssr.ch/m/rsc_de/mp3_128" },
    { id: "rspop", name: "Radio Swiss Pop", url: "https://stream.srg-ssr.ch/m/rsp/mp3_128" },
  ],
  uk: [
    { id: "capitaluk", name: "Capital FM", url: "https://media-ssl.musicradio.com/CapitalMP3" },
    { id: "heartuk", name: "Heart", url: "https://media-ssl.musicradio.com/HeartLondonMP3" },
    { id: "smoothuk", name: "Smooth", url: "https://media-ssl.musicradio.com/SmoothLondonMP3" },
    { id: "classicfm", name: "Classic FM", url: "https://media-ssl.musicradio.com/ClassicFMMP3" },
    { id: "lbc", name: "LBC", url: "https://media-ssl.musicradio.com/LBCUK" },
    { id: "jazzfmuk", name: "Jazz FM", url: "https://edge-bauerall-01-gos2.sharp-stream.com/jazz.mp3" },
    { id: "planetrock", name: "Planet Rock", url: "https://edge-bauerall-01-gos2.sharp-stream.com/planetrock.mp3" },
  ],
  es: [
    { id: "los40", name: "LOS40", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40.mp3" },
    { id: "cadenaser", name: "Cadena SER", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/CADENASER.mp3" },
    { id: "cadenadial", name: "Cadena Dial", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/CADENADIAL.mp3" },
    { id: "europafm", name: "Europa FM", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/EUROPA_FM.mp3" },
    { id: "los40classic", name: "LOS40 Classic", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40_CLASSIC.mp3" },
    { id: "kissfmes", name: "Kiss FM", url: "https://kissfm.kissfmradio.cires21.com/kissfm.mp3" },
    { id: "cope", name: "COPE", url: "https://flucast-b04-06.flumotion.com/cope/net1.mp3" },
  ],
};

export default function RadioFornaio() {
  const { t, lang, tri } = useLang();
  const { on: ambientOn, toggle: toggleAmbient, volume: ambientVol, setVolume: setAmbientVol, mode: ambientMode, setMode: setAmbientMode } = useAmbient();
  const { sfxEnabled, toggleSfx, sfxVolume, setSfxVol } = useSoundFX();
  const AMB = [
    { id: "fire", label: mkTri(lang)("Forno", "Ofen", "Oven"), emoji: "🔥" },
    { id: "rain", label: mkTri(lang)("Pioggia", "Regen", "Rain"), emoji: "🌧️" },
    { id: "mixer", label: mkTri(lang)("Impastatrice", "Kneter", "Mixer"), emoji: "🌀" },
    { id: "morning", label: mkTri(lang)("Mattino", "Morgen", "Morning"), emoji: "🌅" },
  ];
  const [open, setOpen] = useState(false);
  // Tasto Indietro: chiude SOLO il pannello (la radio continua a suonare), non naviga via.
  useBackClose(open, () => setOpen(false));
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
  const [favs, setFavs] = useState(() => { try { return JSON.parse(localStorage.getItem("mikilab_radio_favs") || "[]"); } catch { return []; } });
  const [custom, setCustom] = useState(() => { try { return JSON.parse(localStorage.getItem("mikilab_radio_custom") || "[]"); } catch { return []; } });
  const [showAdd, setShowAdd] = useState(false);
  const [cName, setCName] = useState("");
  const [cUrl, setCUrl] = useState("");
  const [lastId, setLastId] = useState(() => localStorage.getItem("mikilab_radio_last") || null);
  const [q, setQ] = useState("");
  const toggleFav = (id) => setFavs((f) => { const n = f.includes(id) ? f.filter((x) => x !== id) : [...f, id]; try { localStorage.setItem("mikilab_radio_favs", JSON.stringify(n)); } catch { /* */ } return n; });
  const saveCustom = (list) => { setCustom(list); try { localStorage.setItem("mikilab_radio_custom", JSON.stringify(list)); } catch { /* */ } };
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
    setLastId(st.id);
    try { localStorage.setItem("mikilab_radio_last", st.id); } catch { /* */ }
    setStatus("loading");
    a.src = st.url;
    const p = a.play();
    if (p && p.catch) p.catch(() => setStatus("error"));
  };

  const allStations = [...custom, ...STATIONS.it, ...STATIONS.de, ...STATIONS.intl, ...STATIONS.uk, ...STATIONS.es];

  const addCustom = () => {
    const url = cUrl.trim();
    if (!/^https?:\/\//i.test(url)) { alert(tri("Inserisci un URL valido che inizia con http:// o https://", "Gib eine gültige URL ein (http:// oder https://)", "Enter a valid URL starting with http:// or https://", "Introduce una URL válida (http:// o https://)")); return; }
    const name = cName.trim() || url.replace(/^https?:\/\//i, "").split("/")[0];
    const st = { id: `custom_${Date.now()}`, name, url, custom: true };
    saveCustom([...custom, st]);
    setCName(""); setCUrl(""); setShowAdd(false);
    playStation(st);
  };
  const removeCustom = (id) => {
    saveCustom(custom.filter((s) => s.id !== id));
    setFavs((f) => { const n = f.filter((x) => x !== id); try { localStorage.setItem("mikilab_radio_favs", JSON.stringify(n)); } catch { /* */ } return n; });
    if (current === id) stop();
  };

  const [listening, setListening] = useState(false);
  const listenStation = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setListening(false); alert(t("voice_unsupported")); return; }
    const rec = new SR();
    rec.lang = mkTri(lang)("it-IT", "de-DE", "en-GB");
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
          const isFav = favs.includes(st.id);
          return (
            <div
              key={st.id}
              data-testid={`radio-station-${st.id}`}
              onClick={() => playStation(st)}
              className={`relative flex items-center gap-2 pl-3 pr-8 py-2.5 rounded-2xl shadow-md border border-amber-900/40 text-sm font-medium text-left transition-all active:scale-98 border cursor-pointer ${
                active
                  ? "bg-[#ff6b00] text-white border-[#ff6b00] shadow-sm"
                  : "bg-white dark:bg-[#181818] text-[#2B303B] dark:text-[#e4eff8] border-[#2e2e2e] dark:border-[#2e2e2e]"
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
              <button
                type="button"
                data-testid={`radio-fav-${st.id}`}
                aria-label="favorite"
                onClick={(e) => { e.stopPropagation(); toggleFav(st.id); }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 active:scale-90"
              >
                <Star className={`w-4 h-4 ${isFav ? "fill-[#ff6b00] text-[#ff6b00]" : active ? "text-white/70" : "text-[#c9b17e]"}`} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  const favStations = allStations.filter((s) => favs.includes(s.id));
  const lastStation = allStations.find((s) => s.id === lastId);

  return (
    <>
      {open && (
        <div className="fixed inset-x-0 bottom-40 z-40 px-4 flex justify-center pointer-events-none">
          <div data-testid="radio-panel" className="pointer-events-auto w-full max-w-xl max-h-[70vh] overflow-y-auto bg-[#121212] dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-2xl shadow-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Radio className="w-5 h-5 text-[#ff6b00]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#2B303B] dark:text-[#e4eff8] leading-none">{t("radio_title")}</p>
                <p className="text-[11px] text-[#7E8A93] mt-0.5">{t("radio_sub")}</p>
              </div>
              <button data-testid="radio-voice" onClick={listenStation}
                className={`p-1.5 rounded-lg mr-1 ${listening ? "bg-[#ff6b00] text-white animate-pulse" : "text-[#ff6b00]"}`}
                aria-label="voice" title={tri("Cambia stazione a voce", "Sender per Stimme wechseln", "Change station by voice")}>
                <Mic className="w-4 h-4" />
              </button>
              <button data-testid="radio-close" onClick={() => setOpen(false)} className="text-[#7E8A93] p-1"><X className="w-4 h-4" /></button>
            </div>

            {/* Sottofondo d'ambiente: scoppiettio del forno */}
            <button
              data-testid="ambient-toggle"
              onClick={toggleAmbient}
              className={`w-full mb-3 flex items-center gap-2.5 px-3 py-2.5 rounded-2xl shadow-md border border-amber-900/40 border text-left transition-all active:scale-98 ${
                ambientOn ? "bg-[#ff6b00] text-white border-[#ff6b00]" : "bg-[#ff6b00]/10 text-[#ff6b00] dark:text-[#8FB0C2] border-[#ff6b00]/40"
              }`}
            >
              <Flame className={`w-5 h-5 shrink-0 ${ambientOn ? "text-white" : "text-[#ff6b00]"}`} />
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
                      className={`flex flex-col items-center gap-0.5 py-1.5 rounded-2xl shadow-md border border-amber-900/40 border text-[10px] font-semibold transition-all active:scale-95 ${
                        ambientMode === a.id ? "bg-[#ff6b00] text-white border-[#ff6b00]" : "bg-white dark:bg-[#181818] text-[#7E8A93] border-[#2e2e2e] dark:border-[#2e2e2e]"
                      }`}>
                      <span className="text-base leading-none">{a.emoji}</span>{a.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 px-1">
                  <Flame className="w-4 h-4 text-[#ff6b00] shrink-0" />
                  <input
                    data-testid="ambient-volume"
                    type="range" min="0" max="1" step="0.05" value={ambientVol}
                    onChange={(e) => setAmbientVol(Number(e.target.value))}
                    className="flex-1 accent-[#ff6b00]"
                  />
                </div>
              </div>
            )}

            {/* Suoni dell'interfaccia (UI Sound FX) */}
            <button
              data-testid="sfx-toggle"
              onClick={toggleSfx}
              className={`w-full mb-3 flex items-center gap-2.5 px-3 py-2.5 rounded-2xl shadow-md border border-amber-900/40 border text-left transition-all active:scale-98 ${
                sfxEnabled ? "bg-[#ff6b00] text-white border-[#ff6b00]" : "bg-[#ff6b00]/10 text-[#ff6b00] dark:text-[#d3ab6b] border-[#ff6b00]/40"
              }`}
            >
              <Volume2 className={`w-5 h-5 shrink-0 ${sfxEnabled ? "text-white" : "text-[#ff6b00]"}`} />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold">{tri("Suoni dell'app (click)", "App-Klänge (Klick)", "App sounds (click)", "Sonidos de la app (clic)")}</span>
                <span className={`block text-[11px] ${sfxEnabled ? "text-white/80" : "text-[#7E8A93]"}`}>{sfxEnabled ? tri("Attivi · crosta, forno, farina", "Aktiv · Kruste, Ofen, Mehl", "On · crust, oven, flour", "Activos · corteza, horno, harina") : tri("Disattivati", "Aus", "Off", "Desactivados")}</span>
              </span>
            </button>
            {sfxEnabled && (
              <div className="-mt-1 mb-3 flex items-center gap-2 px-1">
                <Volume2 className="w-4 h-4 text-[#ff6b00] shrink-0" />
                <input data-testid="sfx-volume" type="range" min="0" max="1" step="0.05" value={sfxVolume}
                  onChange={(e) => setSfxVol(Number(e.target.value))} className="flex-1 accent-[#ff6b00]" />
              </div>
            )}

            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7E8A93]" />
              <input data-testid="radio-search" value={q} onChange={(e) => setQ(e.target.value)}
                placeholder={tri("Cerca una stazione…", "Sender suchen…", "Search a station…", "Buscar una emisora…")}
                className="w-full bg-white dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-2xl shadow-md border border-amber-900/40 pl-9 pr-9 py-2.5 outline-none text-sm text-[#2B303B] dark:text-[#e4eff8] focus:border-[#ff6b00]" />
              {q && <button data-testid="radio-search-clear" onClick={() => setQ("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7E8A93] p-1"><X className="w-4 h-4" /></button>}
            </div>

            <button data-testid="radio-add-toggle" onClick={() => setShowAdd((v) => !v)}
              className={`w-full mb-3 flex items-center gap-2 px-3 py-2.5 rounded-2xl shadow-md border border-amber-900/40 border text-sm font-semibold text-left transition-all active:scale-98 ${showAdd ? "bg-[#ff6b00] text-white border-[#ff6b00]" : "bg-white dark:bg-[#181818] text-[#ff6b00] border-[#2e2e2e] dark:border-[#2e2e2e]"}`}>
              <Plus className="w-4 h-4 shrink-0" />
              {tri("Aggiungi la tua radio (URL)", "Eigenen Sender hinzufügen (URL)", "Add your radio (URL)", "Añade tu radio (URL)")}
            </button>
            {showAdd && (
              <div data-testid="radio-add-form" className="mb-3 rounded-2xl shadow-md border border-amber-900/40 border border-[#ff6b00]/40 bg-[#ff6b00]/8 p-3 space-y-2">
                <input data-testid="radio-add-name" value={cName} onChange={(e) => setCName(e.target.value)}
                  placeholder={tri("Nome (facoltativo)", "Name (optional)", "Name (optional)", "Nombre (opcional)")}
                  className="w-full bg-white dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-lg px-3 py-2 outline-none text-sm text-[#2B303B] dark:text-[#e4eff8] focus:border-[#ff6b00]" />
                <input data-testid="radio-add-url" value={cUrl} onChange={(e) => setCUrl(e.target.value)}
                  placeholder="https://…/stream.mp3"
                  className="w-full bg-white dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-lg px-3 py-2 outline-none text-sm text-[#2B303B] dark:text-[#e4eff8] focus:border-[#ff6b00]" />
                <p className="text-[10.5px] text-[#7E8A93] leading-snug">{tri("Incolla il link diretto dello stream (.mp3, .aac o .m3u8).", "Füge den direkten Stream-Link ein (.mp3, .aac oder .m3u8).", "Paste the direct stream link (.mp3, .aac or .m3u8).", "Pega el enlace directo del stream (.mp3, .aac o .m3u8).")}</p>
                <button data-testid="radio-add-save" onClick={addCustom}
                  className="w-full bg-[#ff6b00] text-white font-semibold px-3 py-2 rounded-lg active:scale-98 text-sm">
                  {tri("Salva e ascolta", "Speichern & hören", "Save & listen", "Guardar y escuchar")}
                </button>
              </div>
            )}

            {q.trim() ? (() => {
              const res = allStations.filter((s) => s.name.toLowerCase().includes(q.trim().toLowerCase()));
              return res.length
                ? renderGroup(`🔎 ${tri("Risultati", "Ergebnisse", "Results", "Resultados")} (${res.length})`, res)
                : <p data-testid="radio-search-empty" className="text-sm text-[#7E8A93] text-center py-6">{tri("Nessuna stazione trovata", "Kein Sender gefunden", "No station found", "Ninguna emisora encontrada")}</p>;
            })() : (
            <>
            {lastStation && current !== lastStation.id && (
              <button data-testid="radio-resume" onClick={() => playStation(lastStation)}
                className="w-full flex items-center gap-2 mb-3 px-3 py-2.5 rounded-2xl shadow-md border border-amber-900/40 bg-[#ff6b00]/12 border border-[#ff6b00]/40 text-[#8a5e17] dark:text-[#e0b566] text-sm font-semibold active:scale-98">
                <RotateCcw className="w-4 h-4 shrink-0" />
                <span className="truncate">{tri("Riprendi", "Weiter", "Resume", "Reanudar")}: {lastStation.name}</span>
              </button>
            )}
            {custom.length > 0 && (
              <div className="mb-3" data-testid="radio-custom-group">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#7E8A93] mb-1.5">📻 {tri("Le mie radio", "Meine Sender", "My radios", "Mis radios")}</p>
                <div className="grid grid-cols-2 gap-2">
                  {custom.map((st) => {
                    const active = current === st.id;
                    const isFav = favs.includes(st.id);
                    return (
                      <div key={st.id} data-testid={`radio-station-${st.id}`} onClick={() => playStation(st)}
                        className={`relative flex items-center gap-2 pl-3 pr-12 py-2.5 rounded-2xl shadow-md border border-amber-900/40 text-sm font-medium text-left transition-all active:scale-98 border cursor-pointer ${active ? "bg-[#ff6b00] text-white border-[#ff6b00] shadow-sm" : "bg-white dark:bg-[#181818] text-[#2B303B] dark:text-[#e4eff8] border-[#2e2e2e] dark:border-[#2e2e2e]"}`}>
                        {active && status === "loading" ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : active && status === "playing" ? <Square className="w-4 h-4 shrink-0 fill-current" /> : <Play className="w-4 h-4 shrink-0" />}
                        <span className="truncate">{st.name}</span>
                        <button type="button" data-testid={`radio-fav-${st.id}`} aria-label="favorite" onClick={(e) => { e.stopPropagation(); toggleFav(st.id); }}
                          className="absolute right-7 top-1/2 -translate-y-1/2 p-1 active:scale-90">
                          <Star className={`w-4 h-4 ${isFav ? "fill-[#ff6b00] text-[#ff6b00]" : active ? "text-white/70" : "text-[#c9b17e]"}`} />
                        </button>
                        <button type="button" data-testid={`radio-custom-remove-${st.id}`} aria-label="remove" onClick={(e) => { e.stopPropagation(); removeCustom(st.id); }}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 active:scale-90">
                          <Trash2 className={`w-4 h-4 ${active ? "text-white/70" : "text-[#ff6b00]"}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {favStations.length > 0 && renderGroup(`⭐ ${tri("Preferite", "Favoriten", "Favorites", "Favoritas")}`, favStations)}
            {renderGroup(`🇮🇹 ${t("radio_it")}`, STATIONS.it)}
            {renderGroup(`🇬🇧 ${tri("Inglesi (UK)", "Englisch (UK)", "English (UK)", "Inglesas (UK)")}`, STATIONS.uk)}
            {renderGroup(`🇪🇸 ${tri("Spagnole", "Spanisch", "Spanish", "Españolas")}`, STATIONS.es)}
            {renderGroup(`🇩🇪 ${t("radio_de")}`, STATIONS.de)}
            {renderGroup(`🌍 ${tri("Internazionali", "International", "International", "Internacionales")}`, STATIONS.intl)}
            </>
            )}

            {nowPlaying && (
              <div data-testid="radio-now-playing" className="mt-1 flex items-center gap-2 bg-[#ff6b00]/12 border border-[#ff6b00]/30 rounded-2xl shadow-md border border-amber-900/40 px-3 py-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${status === "playing" ? "bg-[#ff6b00] animate-pulse" : status === "error" ? "bg-[#ff6b00]" : "bg-[#ff6b00]"}`} />
                <p className="text-xs text-[#3F4A54] dark:text-[#AEB8BF] flex-1 truncate">
                  {status === "error" ? t("radio_error") : status === "loading" ? t("radio_loading") : `${t("radio_now_playing")}: ${nowPlaying.name}`}
                </p>
                <button data-testid="radio-stop-btn" onClick={stop} className="text-[#ff6b00] p-1"><Square className="w-4 h-4 fill-current" /></button>
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#7E8A93] shrink-0" />
              <input
                data-testid="radio-volume"
                type="range" min="0" max="1" step="0.05" value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="flex-1 accent-[#ff6b00]"
              />
            </div>
          </div>
        </div>
      )}

      <div className={`fixed z-40 left-3 bottom-24 flex flex-col items-center gap-1 transition-all duration-300 ${scrolling && !open ? "translate-y-24 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`} style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
        <button
          data-testid="radio-fornaio-btn"
          onClick={() => setOpen((o) => !o)}
          aria-label={t("radio_title")}
          className={`relative w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 ${
            status === "playing" ? "bg-[#ff6b00]" : "bg-[#ff6b00] hover:bg-[#ff6b00]"
          }`}
        >
          {status !== "playing" && !open && <span aria-hidden className="absolute inset-0 rounded-full bg-[#ff6b00] opacity-50 animate-ping" />}
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
        <span className="text-[9px] font-bold text-[#ff6b00] bg-[#121212]/90 dark:bg-[#121212]/90 px-1.5 py-0.5 rounded-full shadow-sm">{t("radio_label")}</span>
      </div>
    </>
  );
}
