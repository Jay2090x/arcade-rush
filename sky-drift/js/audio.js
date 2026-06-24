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
      case 'flap': {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.connect(g); g.connect(this.ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(320, t);
        o.frequency.exponentialRampToValueAtTime(520, t + 0.06);
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        o.start(t); o.stop(t + 0.08);
        break;
      }
      case 'score': {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.connect(g); g.connect(this.ctx.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(660, t);
        o.frequency.setValueAtTime(880, t + 0.06);
        g.gain.setValueAtTime(0.1, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        o.start(t); o.stop(t + 0.12);
        break;
      }
      case 'nearmiss': {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.connect(g); g.connect(this.ctx.destination);
        o.frequency.setValueAtTime(900, t);
        o.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
        g.gain.setValueAtTime(0.08, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        o.start(t); o.stop(t + 0.15);
        break;
      }
      case 'die': {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.connect(g); g.connect(this.ctx.destination);
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(280, t);
        o.frequency.exponentialRampToValueAtTime(80, t + 0.35);
        g.gain.setValueAtTime(0.15, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        o.start(t); o.stop(t + 0.4);
        break;
      }
      case 'start': {
        [440, 554, 659].forEach((f, i) => {
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