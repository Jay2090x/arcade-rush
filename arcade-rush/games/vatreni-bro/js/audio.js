const Audio = {
  ctx: null,
  enabled: true,

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (_) {
      this.enabled = false;
    }
  },

  resume() {
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  },

  tone(freq, type, gain, dur, startAt) {
    const t = startAt ?? this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.connect(g);
    g.connect(this.ctx.destination);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.start(t);
    o.stop(t + dur);
  },

  play(type, level) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const combo = level || 0;

    switch (type) {
      case 'head':
        this.tone(260, 'sine', 0.12, 0.09, t);
        this.tone(390, 'sine', 0.08, 0.07, t + 0.04);
        break;
      case 'perfect': {
        const base = 520 + Math.min(combo, 12) * 28;
        this.tone(base, 'triangle', 0.15, 0.1, t);
        this.tone(base * 1.25, 'triangle', 0.1, 0.08, t + 0.05);
        this.tone(base * 1.5, 'sine', 0.06, 0.12, t + 0.08);
        break;
      }
      case 'combo': {
        const root = 440 + Math.min(combo, 15) * 35;
        [0, 1.25, 1.5].forEach((m, i) => {
          this.tone(root * m, 'triangle', 0.09 - i * 0.02, 0.14, t + i * 0.04);
        });
        break;
      }
      case 'fever':
        [523, 659, 784, 1047].forEach((f, i) => {
          this.tone(f, 'square', 0.08, 0.14, t + i * 0.05);
        });
        break;
      case 'miss':
        this.tone(160, 'square', 0.05, 0.07, t);
        break;
      case 'score': {
        const f = 620 + Math.min(combo, 10) * 20;
        this.tone(f, 'sine', 0.09, 0.08, t);
        this.tone(f * 1.2, 'sine', 0.06, 0.1, t + 0.05);
        break;
      }
      case 'die':
        this.tone(200, 'sawtooth', 0.1, 0.35, t);
        this.tone(90, 'sawtooth', 0.06, 0.3, t + 0.1);
        break;
      case 'start':
        [392, 494, 587].forEach((f, i) => {
          this.tone(f, 'sine', 0.07, 0.18, t + i * 0.08);
        });
        break;
      case 'tutorial':
        this.tone(660, 'sine', 0.08, 0.12, t);
        break;
      case 'crowd': {
        const n = Math.min(level || 3, 12);
        for (let i = 0; i < 4; i++) {
          this.tone(180 + n * 12 + i * 30 + Math.random() * 20, 'sawtooth', 0.025, 0.1, t + i * 0.02);
        }
        break;
      }
      case 'celebrate':
        [523, 659, 784, 988, 1175].forEach((f, i) => {
          this.tone(f, 'triangle', 0.09, 0.2, t + i * 0.06);
        });
        break;
      case 'unlock':
        this.tone(880, 'sine', 0.1, 0.15, t);
        this.tone(1108, 'triangle', 0.08, 0.2, t + 0.1);
        break;
    }
  },

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  },
};