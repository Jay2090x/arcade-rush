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

  play(type) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    switch (type) {
      case 'kick': {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.connect(g); g.connect(this.ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(180, t);
        o.frequency.exponentialRampToValueAtTime(90, t + 0.08);
        g.gain.setValueAtTime(0.18, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        o.start(t); o.stop(t + 0.1);
        break;
      }
      case 'goal': {
        [523, 659, 784].forEach((f, i) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.connect(g); g.connect(this.ctx.destination);
          o.frequency.value = f;
          g.gain.setValueAtTime(0.1, t + i * 0.07);
          g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.18);
          o.start(t + i * 0.07);
          o.stop(t + i * 0.07 + 0.18);
        });
        break;
      }
      case 'save': {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.connect(g); g.connect(this.ctx.destination);
        o.type = 'square';
        o.frequency.setValueAtTime(220, t);
        o.frequency.exponentialRampToValueAtTime(140, t + 0.2);
        g.gain.setValueAtTime(0.08, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        o.start(t); o.stop(t + 0.22);
        break;
      }
      case 'miss': {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.connect(g); g.connect(this.ctx.destination);
        o.frequency.setValueAtTime(160, t);
        o.frequency.exponentialRampToValueAtTime(90, t + 0.25);
        g.gain.setValueAtTime(0.07, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        o.start(t); o.stop(t + 0.28);
        break;
      }
      case 'start': {
        [392, 494, 587].forEach((f, i) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.connect(g); g.connect(this.ctx.destination);
          o.frequency.value = f;
          g.gain.setValueAtTime(0.08, t + i * 0.08);
          g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.2);
          o.start(t + i * 0.08);
          o.stop(t + i * 0.08 + 0.2);
        });
        break;
      }
    }
  },

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  },
};