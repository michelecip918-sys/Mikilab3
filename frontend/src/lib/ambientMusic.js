// Sottofondi d'ambiente sintetizzati (Web Audio API) — nessun file esterno, funziona offline.
// Modalità: fire (scoppiettio forno), rain (pioggia), mixer (impastatrice), morning (mattino in laboratorio).

class AmbientMusic {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.bed = null;
    this.bedFilter = null;
    this.bedGain = null;
    this.lfo = null;
    this.timer = null;
    this.on = false;
    this.vol = 0.16;
    this.mode = "fire";
  }

  _noiseBuffer(seconds = 3) {
    const len = Math.floor(this.ctx.sampleRate * seconds);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    return buf;
  }

  _ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);
  }

  _cfg() {
    // Bed: freq passa-basso e guadagno; Pop: presenza, frequenze, tipo, ritmo.
    switch (this.mode) {
      case "rain":   return { lpf: 3200, hpf: 600, bedGain: 0.35, tick: 90,  popMin: 1, popMax: 4, fMin: 2000, fMax: 6000, type: "bandpass", q: 1.2, dur: 0.05, peak: 0.08 };
      case "mixer":  return { lpf: 260,  hpf: 0,   bedGain: 0.7,  tick: 700, popMin: 0, popMax: 0, hum: true };
      case "morning":return { lpf: 900,  hpf: 0,   bedGain: 0.3,  tick: 1600,popMin: 1, popMax: 2, fMin: 1400, fMax: 3200, type: "bandpass", q: 8,  dur: 0.18, peak: 0.06, chirp: true };
      case "fire":
      default:       return { lpf: 420,  hpf: 0,   bedGain: 0.5,  tick: 420, popMin: 0, popMax: 3, fMin: 1200, fMax: 3800, type: "bandpass", q: 0.7, dur: 0.1,  peak: 0.28 };
    }
  }

  _startBed() {
    const c = this._cfg();
    this.bed = this.ctx.createBufferSource();
    this.bed.buffer = this._noiseBuffer(3);
    this.bed.loop = true;
    let node = this.bed;
    if (c.hpf) {
      const hp = this.ctx.createBiquadFilter();
      hp.type = "highpass"; hp.frequency.value = c.hpf;
      node.connect(hp); node = hp;
    }
    this.bedFilter = this.ctx.createBiquadFilter();
    this.bedFilter.type = "lowpass"; this.bedFilter.frequency.value = c.lpf;
    node.connect(this.bedFilter);
    this.bedGain = this.ctx.createGain();
    this.bedGain.gain.value = c.bedGain;
    this.bedFilter.connect(this.bedGain);
    this.bedGain.connect(this.master);
    this.bed.start();

    // Impastatrice: ronzio grave ritmico (LFO sull'ampiezza).
    if (c.hum) {
      this.hum = this.ctx.createOscillator();
      this.hum.type = "sawtooth"; this.hum.frequency.value = 95;
      const hg = this.ctx.createGain(); hg.gain.value = 0.06;
      const lp = this.ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 200;
      this.lfo = this.ctx.createOscillator(); this.lfo.type = "sine"; this.lfo.frequency.value = 6;
      const lfoGain = this.ctx.createGain(); lfoGain.gain.value = 0.04;
      this.lfo.connect(lfoGain); lfoGain.connect(hg.gain);
      this.hum.connect(lp); lp.connect(hg); hg.connect(this.master);
      this.hum.start(); this.lfo.start();
    }
  }

  _pop(c) {
    const t0 = this.ctx.currentTime;
    const g = this.ctx.createGain();
    const peak = c.peak * (0.6 + Math.random() * 0.6);
    let src;
    if (c.chirp && Math.random() < 0.5) {
      src = this.ctx.createOscillator();
      src.type = "sine";
      src.frequency.setValueAtTime(c.fMin + Math.random() * (c.fMax - c.fMin), t0);
      src.frequency.exponentialRampToValueAtTime(c.fMax, t0 + c.dur);
      src.connect(g);
    } else {
      src = this.ctx.createBufferSource();
      src.buffer = this._noiseBuffer(0.15);
      const f = this.ctx.createBiquadFilter();
      f.type = c.type; f.frequency.value = c.fMin + Math.random() * (c.fMax - c.fMin); f.Q.value = c.q;
      src.connect(f); f.connect(g);
    }
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + c.dur + Math.random() * 0.1);
    g.connect(this.master);
    src.start(t0); src.stop(t0 + c.dur + 0.3);
  }

  _tick() {
    const c = this._cfg();
    if (c.popMax <= 0) return;
    const n = c.popMin + Math.floor(Math.random() * (c.popMax - c.popMin + 1));
    for (let i = 0; i < n; i++) setTimeout(() => this.on && this._pop(c), Math.random() * (c.tick * 0.9));
  }

  _schedule() {
    const c = this._cfg();
    this.timer = setInterval(() => this._tick(), c.tick);
  }

  _stopSources() {
    try { this.bed && this.bed.stop(); } catch (e) {}
    try { this.hum && this.hum.stop(); } catch (e) {}
    try { this.lfo && this.lfo.stop(); } catch (e) {}
    this.bed = this.hum = this.lfo = null;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  setSection() { /* suono d'ambiente unico: nessun cambio per sezione */ }

  setVolume(v) {
    this.vol = Math.max(0, Math.min(1, Number(v) || 0)) * 0.32;
    if (this.on && this.master && this.ctx) this.master.gain.setTargetAtTime(this.vol, this.ctx.currentTime, 0.2);
  }

  setMode(mode) {
    this.mode = mode;
    if (this.on) { this._stopSources(); this._startBed(); this._schedule(); }
  }

  enable() {
    this._ensure();
    if (!this.ctx) return false;
    if (this.ctx.state === "suspended") this.ctx.resume();
    this.on = true;
    this._stopSources();
    this._startBed();
    this.master.gain.setTargetAtTime(this.vol, this.ctx.currentTime, 0.6);
    this._schedule();
    return true;
  }

  disable() {
    this.on = false;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4);
    this._stopSources();
  }
}

const ambient = new AmbientMusic();
export default ambient;
