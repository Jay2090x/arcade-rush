/** Soft procedural sand ambience */
const ZenAudio = {
  ctx: null,
  enabled: true,
  noise: null,
  gain: null,

  init() {
    try {
      const saved = localStorage.getItem('zen_sand_sound');
      if (saved === '0') this.enabled = false;
    } catch (_) {}
  },

  ensure() {
    if (!this.enabled || this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this._startAmbience();
  },

  _startAmbience() {
    const ctx = this.ctx;
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    this.noise = ctx.createBufferSource();
    this.noise.buffer = buffer;
    this.noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;

    this.gain = ctx.createGain();
    this.gain.gain.value = 0.018;

    this.noise.connect(filter);
    filter.connect(this.gain);
    this.gain.connect(ctx.destination);
    this.noise.start();
  },

  brush(intensity = 0.5) {
    if (!this.enabled) return;
    this.ensure();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 180 + Math.random() * 120;
    f.Q.value = 0.6;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90 + Math.random() * 40, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.04 * intensity, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.connect(f);
    f.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.14);
  },

  toggle() {
    this.enabled = !this.enabled;
    try { localStorage.setItem('zen_sand_sound', this.enabled ? '1' : '0'); } catch (_) {}
    if (!this.enabled && this.gain) {
      this.gain.gain.value = 0;
    } else if (this.enabled && this.gain) {
      this.gain.gain.value = 0.018;
      this.ensure();
    }
    return this.enabled;
  },
};

window.ZenAudio = ZenAudio;