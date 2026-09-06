// UI Sound FX tematizzati (Web Audio API, nessun file esterno).
// crunch = crosta di pane · puff = spolverata di farina · ding = timer da forno
// cut = taglio con lametta · door = sportello del forno che si chiude.

let ctx = null;
let master = null;
let volume = 0.5;

function ensure() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

export function setSfxVolume(v) {
  volume = Math.max(0, Math.min(1, v));
  if (master) master.gain.value = volume;
}

function noiseBuffer(dur) {
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function playNoise(dur, type, freq, q, gain, decay) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(dur);
  const filt = ctx.createBiquadFilter();
  filt.type = type; filt.frequency.value = freq; if (q) filt.Q.value = q;
  const g = ctx.createGain();
  const t = ctx.currentTime;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + (decay || dur));
  src.connect(filt); filt.connect(g); g.connect(master);
  src.start(t); src.stop(t + dur);
}

function playTone(freq, dur, gain, type = "sine", glideTo) {
  const osc = ctx.createOscillator();
  osc.type = type; osc.frequency.value = freq;
  const g = ctx.createGain();
  const t = ctx.currentTime;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
  osc.connect(g); g.connect(master);
  osc.start(t); osc.stop(t + dur);
}

const SOUNDS = {
  // click generico: crosta che scrocchia
  crunch: () => { playNoise(0.12, "bandpass", 1800, 1.2, 0.5, 0.1); playNoise(0.06, "highpass", 3000, 0, 0.25, 0.05); },
  // hover: soffio di farina
  puff: () => { playNoise(0.18, "lowpass", 900, 0, 0.12, 0.16); },
  // conferma/invio: ding metallico da forno
  ding: () => { playTone(1320, 0.5, 0.22, "sine"); playTone(1980, 0.45, 0.09, "sine"); },
  // cancella/annulla: taglio con lametta
  cut: () => { playNoise(0.14, "bandpass", 2600, 3, 0.35, 0.12); playTone(1600, 0.1, 0.06, "sawtooth", 400); },
  // salva/infornata: sportello del forno che si chiude
  door: () => { playTone(120, 0.28, 0.35, "sine", 60); playNoise(0.16, "lowpass", 400, 0, 0.3, 0.15); },
};

export function playSfx(name) {
  // SILENZIO ASSOLUTO: effetti sonori/notifiche acustiche disattivati (resta solo la voce TTS di BakoMix).
  return;
  // eslint-disable-next-line no-unreachable
  try {
    if (!ensure()) return;
    (SOUNDS[name] || SOUNDS.crunch)();
  } catch { /* no-op */ }
}
