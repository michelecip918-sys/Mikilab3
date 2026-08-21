// Sottofondo d'ambiente sintetizzato (Web Audio API) — nessun file esterno, funziona offline.
// Scoppiettio del forno a legna: rumore filtrato (brace) + crepitii casuali.

class AmbientMusic {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.bed = null;       // rumore di fondo (brace)
    this.bedGain = null;
    this.timer = null;
    this.section = "home";
    this.on = false;
  }

  _noiseBuffer(seconds = 2) {
    const len = Math.floor(this.ctx.sampleRate * seconds);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      // rumore "brown" (più morbido/grave)
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

  _startBed() {
    if (this.bed) return;
    this.bed = this.ctx.createBufferSource();
    this.bed.buffer = this._noiseBuffer(3);
    this.bed.loop = true;
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 420;   // solo il rombo grave della brace
    this.bedGain = this.ctx.createGain();
    this.bedGain.gain.value = 0.5;
    this.bed.connect(lp); lp.connect(this.bedGain); this.bedGain.connect(this.master);
    this.bed.start();
  }

  // Un singolo crepitio: breve raffica di rumore passa-alto con inviluppo rapido.
  _crackle() {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer(0.12);
    const hp = this.ctx.createBiquadFilter();
    hp.type = "bandpass";
    hp.frequency.value = 1200 + Math.random() * 2600;
    hp.Q.value = 0.7;
    const g = this.ctx.createGain();
    const peak = 0.12 + Math.random() * 0.22;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09 + Math.random() * 0.12);
    src.connect(hp); hp.connect(g); g.connect(this.master);
    src.start(t0); src.stop(t0 + 0.3);
  }

  _tick() {
    // Numero variabile di crepitii per ciclo → suono naturale del fuoco.
    const bursts = Math.random() < 0.35 ? 0 : 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < bursts; i++) {
      setTimeout(() => this._crackle(), Math.random() * 380);
    }
  }

  setSection() { /* suono d'ambiente unico: nessun cambio per sezione */ }

  _schedule() {
    this.timer = setInterval(() => this._tick(), 420);
  }

  enable() {
    this._ensure();
    if (!this.ctx) return false;
    if (this.ctx.state === "suspended") this.ctx.resume();
    this.on = true;
    this._startBed();
    this.master.gain.setTargetAtTime(0.16, this.ctx.currentTime, 0.6);
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
