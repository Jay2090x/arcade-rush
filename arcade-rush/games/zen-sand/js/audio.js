/** Ambient sand sounds + relaxing background music */
const ZenAudio = {
  ctx: null,
  enabled: true,
  noise: null,
  ambGain: null,
  musicGain: null,
  musicNodes: [],
  musicStarted: false,

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
    filter.frequency.value = 380;

    this.ambGain = ctx.createGain();
    this.ambGain.gain.value = 0.012;

    this.noise.connect(filter);
    filter.connect(this.ambGain);
    this.ambGain.connect(ctx.destination);
    this.noise.start();
  },

  startMusic() {
    if (!this.enabled) return;
    this.ensure();
    if (!this.ctx || this.musicStarted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const ctx = this.ctx;
    const t = ctx.currentTime;
    this.musicGain = ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.0001, t);
    this.musicGain.gain.linearRampToValueAtTime(0.14, t + 2.5);

    const masterFilter = ctx.createBiquadFilter();
    masterFilter.type = 'lowpass';
    masterFilter.frequency.value = 900;
    masterFilter.Q.value = 0.4;
    this.musicGain.connect(masterFilter);
    masterFilter.connect(ctx.destination);

    const chord = [146.83, 185.0, 220.0, 277.18, 329.63];
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = (i - 2) * 4;

      const g = ctx.createGain();
      g.gain.value = 0.045 / chord.length;

      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.03 + i * 0.008;
      const lfoG = ctx.createGain();
      lfoG.gain.value = 0.012;
      lfo.connect(lfoG);
      lfoG.connect(g.gain);

      osc.connect(g);
      g.connect(this.musicGain);
      osc.start(t);
      lfo.start(t);
      this.musicNodes.push(osc, lfo);
    });

    const pad = ctx.createOscillator();
    pad.type = 'triangle';
    pad.frequency.value = 73.42;
    const padG = ctx.createGain();
    padG.gain.value = 0.025;
    pad.connect(padG);
    padG.connect(this.musicGain);
    pad.start(t);
    this.musicNodes.push(pad);

    this.musicStarted = true;
  },

  stopMusic(fadeSec = 1.2) {
    if (!this.ctx || !this.musicGain) return;
    const t = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(t);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, t);
    this.musicGain.gain.linearRampToValueAtTime(0.0001, t + fadeSec);
    setTimeout(() => {
      this.musicNodes.forEach(n => { try { n.stop(); } catch (_) {} });
      this.musicNodes = [];
      this.musicStarted = false;
      if (this.musicGain) {
        this.musicGain.disconnect();
        this.musicGain = null;
      }
    }, fadeSec * 1000 + 80);
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
    f.frequency.value = 160 + Math.random() * 100;
    f.Q.value = 0.5;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80 + Math.random() * 35, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.035 * intensity, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    osc.connect(f);
    f.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  },

  setPlaying(active) {
    if (active) this.startMusic();
  },

  toggle() {
    this.enabled = !this.enabled;
    try { localStorage.setItem('zen_sand_sound', this.enabled ? '1' : '0'); } catch (_) {}
    if (!this.enabled) {
      if (this.ambGain) this.ambGain.gain.value = 0;
      if (this.musicGain) this.musicGain.gain.value = 0;
    } else {
      if (this.ambGain) this.ambGain.gain.value = 0.012;
      this.ensure();
      if (this.musicStarted && this.musicGain) {
        this.musicGain.gain.value = 0.14;
      }
    }
    return this.enabled;
  },
};

window.ZenAudio = ZenAudio;