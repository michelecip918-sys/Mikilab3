// Sottofondo musicale sintetizzato (Web Audio API) — nessun file esterno, funziona offline.
// Una melodia gentile e diversa per ogni sezione dell'app.

const NOTE = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0,
  A3: 220.0, C3: 130.81, G3: 196.0, E3: 164.81, F3: 174.61, D3: 146.83,
};

// Configurazione per sezione: scala (frequenze), tempo, timbro, tono.
const SECTIONS = {
  home:     { scale: [NOTE.C4, NOTE.D4, NOTE.E4, NOTE.G4, NOTE.A4, NOTE.C5], bass: NOTE.C3, beat: 560, wave: "triangle", cutoff: 2200 },
  ricette:  { scale: [NOTE.C4, NOTE.E4, NOTE.F4, NOTE.G4, NOTE.B4, NOTE.C5], bass: NOTE.F3, beat: 640, wave: "sine",     cutoff: 1800 },
  maestro:  { scale: [NOTE.A3, NOTE.C4, NOTE.D4, NOTE.E4, NOTE.G4, NOTE.A4], bass: NOTE.A3, beat: 500, wave: "triangle", cutoff: 2000 },
  impara:   { scale: [NOTE.D4, NOTE.E4, NOTE.G4, NOTE.A4, NOTE.B4, NOTE.D5], bass: NOTE.D3, beat: 460, wave: "square",   cutoff: 1400 },
  diagnosi: { scale: [NOTE.E4, NOTE.G4, NOTE.A4, NOTE.B4, NOTE.D5, NOTE.E5], bass: NOTE.E3, beat: 720, wave: "sine",     cutoff: 1500 },
  news:     { scale: [NOTE.G4, NOTE.A4, NOTE.B4, NOTE.D5, NOTE.E5, NOTE.G5], bass: NOTE.G3, beat: 440, wave: "triangle", cutoff: 2400 },
};

class AmbientMusic {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.filter = null;
    this.timer = null;
    this.section = "home";
    this.step = 0;
    this.idx = 2;
    this.on = false;
  }

  _cfg() { return SECTIONS[this.section] || SECTIONS.home; }

  _ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 2000;
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.filter.connect(this.master);
    this.master.connect(this.ctx.destination);
  }

  _voice(freq, dur, peak, wave) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = wave;
    osc.frequency.value = freq;
    // secondo oscillatore leggermente stonato per calore
    const osc2 = this.ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = freq * 1.005;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); osc2.connect(g); g.connect(this.filter);
    osc.start(t0); osc2.start(t0);
    osc.stop(t0 + dur + 0.05); osc2.stop(t0 + dur + 0.05);
  }

  _tick() {
    const c = this._cfg();
    this.filter.frequency.setTargetAtTime(c.cutoff, this.ctx.currentTime, 0.3);
    // melodia: passeggiata casuale nella scala, con qualche pausa
    if (Math.random() > 0.22) {
      const move = [-1, 0, 1, 1, 2][Math.floor(Math.random() * 5)];
      this.idx = Math.max(0, Math.min(c.scale.length - 1, this.idx + move));
      this._voice(c.scale[this.idx], 1.1, 0.16, c.wave);
    }
    // basso morbido ogni 4 battute
    if (this.step % 4 === 0) this._voice(c.bass, 1.8, 0.12, "sine");
    this.step++;
  }

  setSection(name) {
    if (SECTIONS[name]) this.section = name;
    if (this.timer) { clearInterval(this.timer); this._schedule(); }
  }

  _schedule() {
    const c = this._cfg();
    this.timer = setInterval(() => this._tick(), c.beat);
  }

  enable() {
    this._ensure();
    if (!this.ctx) return false;
    if (this.ctx.state === "suspended") this.ctx.resume();
    this.on = true;
    this.master.gain.setTargetAtTime(0.09, this.ctx.currentTime, 0.6);
    if (!this.timer) this._schedule();
    return true;
  }

  disable() {
    this.on = false;
    if (this.master) this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4);
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }
}

const ambient = new AmbientMusic();
export default ambient;
