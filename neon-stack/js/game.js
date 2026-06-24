const Game = {
  state: 'menu',
  blocks: [],
  moving: null,
  score: 0,
  combo: 0,
  bestCombo: 0,
  speed: CONFIG.SPEED_BASE,
  direction: 1,
  cameraY: 0,
  targetCameraY: 0,
  particles: [],
  popups: [],
  stats: { best: 0, games: 0, totalScore: 0 },
  sound: true,
  loopId: null,
  onStateChange: null,
  onScore: null,
  renderer: null,

  init(renderer) {
    this.renderer = renderer;
    this.load();
  },

  load() {
    try {
      const s = localStorage.getItem(CONFIG.SAVE_KEY);
      if (s) this.stats = { ...this.stats, ...JSON.parse(s) };
    } catch (_) {}
  },

  save() {
    localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(this.stats));
  },

  start() {
    this.state = 'playing';
    this.blocks = [];
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.speed = CONFIG.SPEED_BASE;
    this.direction = 1;
    this.cameraY = 0;
    this.targetCameraY = 0;
    this.particles = [];
    this.popups = [];

    const baseW = this.renderer.w * CONFIG.BASE_WIDTH_RATIO;
    this.blocks.push({
      x: this.renderer.cx,
      y: 0,
      w: baseW,
      color: CONFIG.COLORS[0],
      perfect: false,
    });

    this.spawnMoving();
    if (this.sound) Audio.play('start');
    this.beginLoop();
    this.notify();
  },

  spawnMoving() {
    const prev = this.blocks[this.blocks.length - 1];
    const color = CONFIG.COLORS[this.blocks.length % CONFIG.COLORS.length];
    this.moving = {
      x: 40,
      y: prev.y + CONFIG.BLOCK_HEIGHT,
      w: prev.w,
      color,
      perfect: false,
    };
    this.direction = Math.random() > 0.5 ? 1 : -1;
  },

  drop() {
    if (this.state !== 'playing' || !this.moving) return;

    const prev = this.blocks[this.blocks.length - 1];
    const cur = this.moving;
    const left = Math.max(cur.x - cur.w / 2, prev.x - prev.w / 2);
    const right = Math.min(cur.x + cur.w / 2, prev.x + prev.w / 2);
    const overlap = right - left;

    if (overlap <= 0) {
      this.gameOver();
      return;
    }

    const center = (left + right) / 2;
    const offset = Math.abs(cur.x - prev.x);

    let quality = 'ok';
    if (offset <= CONFIG.PERFECT_THRESHOLD) {
      quality = 'perfect';
      this.combo++;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      if (this.sound) Audio.play('perfect');
      this.renderer.flash = 1;
      this.addPopup(center, cur.y, `PERFECT ×${this.combo}`, '#FFD54F', true);
    } else if (offset <= CONFIG.GREAT_THRESHOLD) {
      quality = 'great';
      this.combo = 0;
      if (this.sound) Audio.play('great');
      this.addPopup(center, cur.y, 'GREAT!', '#00E676', false);
    } else {
      this.combo = 0;
      if (this.sound) Audio.play('drop');
    }

    const placed = {
      x: center,
      y: cur.y,
      w: overlap,
      color: cur.color,
      perfect: quality === 'perfect',
    };

    this.blocks.push(placed);
    this.score++;
    if (this.onScore) this.onScore(this.score);

    this.particles.push(...this.renderer.burst(center, cur.y, placed.color, quality === 'perfect' ? 24 : 10));

    if (overlap < CONFIG.MIN_WIDTH) {
      this.gameOver();
      return;
    }

    this.speed = Math.min(CONFIG.SPEED_MAX, CONFIG.SPEED_BASE + this.score * CONFIG.SPEED_INCREMENT);
    this.targetCameraY = Math.max(0, placed.y - this.renderer.h * 0.35);
    this.moving = null;
    this.spawnMoving();
  },

  play() {
    if (this.state === 'menu' || this.state === 'dead') {
      this.start();
      return;
    }
    if (this.state === 'playing') {
      this.drop();
    }
  },

  gameOver() {
    this.state = 'dead';
    this.moving = null;
    this.renderer.shake = 14;
    if (this.sound) Audio.play('gameover');

    this.stats.games++;
    this.stats.totalScore += this.score;
    const newRecord = this.score > this.stats.best;
    if (newRecord) this.stats.best = this.score;
    this.save();

    if (window.ArcadeAnalytics) {
      ArcadeAnalytics.track('game_over', { game: 'neon-stack', score: this.score });
    }

    setTimeout(() => this.notify({ newRecord }), 350);
  },

  addPopup(x, y, text, color, big) {
    this.popups.push({ x, y, text, color, big, life: 1 });
  },

  update() {
    if (this.state !== 'playing') return;

    if (this.moving) {
      this.moving.x += this.speed * this.direction;
      const margin = this.moving.w / 2 + 10;
      if (this.moving.x > this.renderer.w - margin) this.direction = -1;
      if (this.moving.x < margin) this.direction = 1;
    }

    this.cameraY += (this.targetCameraY - this.cameraY) * CONFIG.CAMERA_LERP;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life -= 0.03;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.popups.length - 1; i >= 0; i--) {
      this.popups[i].life -= 0.025;
      this.popups[i].y += 0.5;
      if (this.popups[i].life <= 0) this.popups.splice(i, 1);
    }
  },

  beginLoop() {
    if (this.loopId) cancelAnimationFrame(this.loopId);
    const loop = () => {
      this.update();
      this.renderer.draw(this.getRenderState());
      this.loopId = requestAnimationFrame(loop);
    };
    this.loopId = requestAnimationFrame(loop);
  },

  getRenderState() {
    return {
      blocks: this.blocks,
      moving: this.moving,
      cameraY: this.cameraY,
      particles: this.particles,
      popups: this.popups,
    };
  },

  notify(extra = {}) {
    if (this.onStateChange) this.onStateChange(this.state, extra);
  },

  idleRender() {
    if (this.state === 'menu' || this.state === 'dead') {
      const demo = {
        blocks: [
          { x: this.renderer.cx, y: 0, w: this.renderer.w * 0.5, color: '#6C5CE7', perfect: false },
          { x: this.renderer.cx, y: CONFIG.BLOCK_HEIGHT, w: this.renderer.w * 0.42, color: '#FF6B9D', perfect: true },
          { x: this.renderer.cx, y: CONFIG.BLOCK_HEIGHT * 2, w: this.renderer.w * 0.35, color: '#00D2FF', perfect: false },
        ],
        moving: {
          x: this.renderer.cx + Math.sin(Date.now() * 0.003) * 80,
          y: CONFIG.BLOCK_HEIGHT * 3,
          w: this.renderer.w * 0.28,
          color: '#FFD54F',
          perfect: false,
        },
        cameraY: 0,
        particles: [],
        popups: [],
      };
      this.renderer.draw(demo);
    }
  },
};