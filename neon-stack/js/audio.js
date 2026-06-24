const Audio = {
  ctx: null,
  enabled: true,

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (_) {}
  },

  resume() {
    this.ctx?.resume();
  },

  tone(freq, dur, type = 'sine', vol = 0.08) {
    if (!this.enabled || !this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start();
    o.stop(this.ctx.currentTime + dur);
  },

  play(name) {
    this.resume();
    switch (name) {
      case 'drop': this.tone(320, 0.08, 'triangle', 0.06); break;
      case 'perfect': this.tone(880, 0.12, 'sine', 0.1); this.tone(1320, 0.1, 'sine', 0.06); break;
      case 'great': this.tone(660, 0.1, 'sine', 0.08); break;
      case 'miss': this.tone(140, 0.25, 'sawtooth', 0.07); break;
      case 'gameover': this.tone(220, 0.3, 'sawtooth', 0.1); this.tone(110, 0.4, 'sawtooth', 0.08); break;
      case 'start': this.tone(440, 0.15, 'sine', 0.07); break;
    }
  },

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  },
};