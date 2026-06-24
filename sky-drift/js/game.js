const Game = {
  state: 'menu',
  renderer: null,
  bird: null,
  pipes: [],
  score: 0,
  streak: 0,
  scroll: 0,
  speed: CONFIG.PIPE_SPEED_BASE,
  gap: CONFIG.PIPE_GAP,
  frame: 0,
  spawnTimer: 0,
  popups: [],
  shake: 0,
  stats: { best: 0, games: 0, totalScore: 0 },
  sound: true,
  loopId: null,
  onStateChange: null,
  onScore: null,

  init(renderer) {
    this.renderer = renderer;
    this.load();
    this.resetBird();
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

  resetBird() {
    this.bird = {
      x: this.renderer.w * CONFIG.BIRD_X_RATIO,
      y: this.renderer.h * 0.42,
      vy: 0,
      rotation: 0,
      wingPhase: 0,
      alive: true,
      radius: CONFIG.BIRD_SIZE * (CONFIG.HITBOX_SCALE || 0.72),
    };
  },

  start() {
    this.state = 'ready';
    this.score = 0;
    this.streak = 0;
    this.pipes = [];
    this.scroll = 0;
    this.speed = CONFIG.PIPE_SPEED_BASE;
    this.gap = CONFIG.PIPE_GAP;
    this.frame = 0;
    this.spawnTimer = 0;
    this.popups = [];
    this.shake = 0;
    this.resetBird();
    this.renderer.particles.list = [];
    this.notify();
  },

  play() {
    if (this.state === 'menu') {
      this.start();
      return;
    }
    if (this.state === 'ready') {
      this.state = 'playing';
      this.flap();
      Audio.play('start');
      this.beginLoop();
      this.notify();
      return;
    }
    if (this.state === 'playing') {
      this.flap();
    }
    if (this.state === 'dead') {
      this.start();
      return;
    }
  },

  flap() {
    if (!this.bird?.alive) return;
    this.bird.vy = CONFIG.FLAP_FORCE;
    this.bird.wingPhase = Math.PI;
    if (this.sound) Audio.play('flap');
  },

  beginLoop() {
    if (this.loopId) cancelAnimationFrame(this.loopId);
    const loop = () => {
      if (this.state === 'playing') {
        this.update();
        this.renderer.render(this.getRenderState());
      }
      this.loopId = requestAnimationFrame(loop);
    };
    this.loopId = requestAnimationFrame(loop);
  },

  spawnPipe() {
    const gy = this.renderer.groundY;
    const maxTop = gy - this.gap - CONFIG.PIPE_MIN_Y;
    const topH = CONFIG.PIPE_MIN_Y + Math.random() * maxTop;
    this.pipes.push({
      x: this.renderer.w + 20,
      topH,
      bottomY: topH + this.gap,
      scored: false,
      nearMissed: false,
    });
  },

  update() {
    this.frame++;
    this.scroll += this.speed;
    const bird = this.bird;

    bird.vy = Math.min(bird.vy + CONFIG.GRAVITY, CONFIG.MAX_VELOCITY);
    bird.y += bird.vy;
    bird.rotation = Math.max(-0.5, Math.min(Math.PI / 2, bird.vy * 0.06));
    bird.wingPhase += 0.35;

    this.spawnTimer++;
    if (this.spawnTimer >= CONFIG.PIPE_SPAWN_INTERVAL) {
      this.spawnPipe();
      this.spawnTimer = 0;
    }

    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const p = this.pipes[i];
      p.x -= this.speed;

      if (!p.scored && p.x + CONFIG.PIPE_WIDTH < bird.x) {
        p.scored = true;
        this.score++;
        this.streak++;
        let bonus = 0;
        if (this.streak % 5 === 0) bonus = CONFIG.STREAK_BONUS;
        if (bonus) this.addPopup(bird.x, bird.y - 40, `+${bonus} Serie!`, '#FF6B35', true);
        this.score += bonus;
        this.addPopup(p.x + CONFIG.PIPE_WIDTH / 2, (p.topH + p.bottomY) / 2, '+1', '#FFD700', false);
        if (this.sound) Audio.play('score');
        if (this.score % CONFIG.DIFFICULTY_EVERY === 0) {
          this.speed = Math.min(this.speed + CONFIG.SPEED_INCREMENT, 5.5);
          this.gap = Math.max(CONFIG.MIN_GAP, this.gap - CONFIG.GAP_SHRINK);
        }
        if (this.onScore) this.onScore(this.score);
      }

      if (!p.nearMissed && p.scored === false) {
        const cx = bird.x;
        const inX = cx > p.x - 10 && cx < p.x + CONFIG.PIPE_WIDTH + 10;
        const distTop = Math.abs(bird.y - p.topH);
        const distBot = Math.abs(bird.y - p.bottomY);
        const near = inX && (distTop < CONFIG.NEAR_MISS_DIST || distBot < CONFIG.NEAR_MISS_DIST);
        if (near) {
          p.nearMissed = true;
          this.score += CONFIG.NEAR_MISS_BONUS;
          this.addPopup(bird.x, bird.y - 20, `+${CONFIG.NEAR_MISS_BONUS} Knapp!`, '#7CFC00', true);
          if (this.sound) Audio.play('nearmiss');
          if (this.onScore) this.onScore(this.score);
        }
      }

      if (p.x < -CONFIG.PIPE_WIDTH - 20) this.pipes.splice(i, 1);
    }

    for (let i = this.popups.length - 1; i >= 0; i--) {
      this.popups[i].life -= 0.016;
      if (this.popups[i].life <= 0) this.popups.splice(i, 1);
    }

    if (bird.y - bird.radius < 0 || bird.y + bird.radius > this.renderer.groundY) {
      this.die('ground');
      return;
    }

    for (const p of this.pipes) {
      const bx = bird.x;
      const by = bird.y;
      const r = bird.radius * 0.82;
      const inX = bx + r > p.x && bx - r < p.x + CONFIG.PIPE_WIDTH;
      if (inX && (by - r < p.topH || by + r > p.bottomY)) {
        this.die('pipe');
        return;
      }
    }
  },

  die(reason) {
    this.state = 'dead';
    this.bird.alive = false;
    this.bird.vy = reason === 'pipe' ? 2 : 4;
    this.shake = 12;
    this.renderer.particles.burst(this.bird.x, this.bird.y, { count: 20, color: '#FFC107', speed: 5 });
    if (this.sound) Audio.play('die');

    this.stats.games++;
    this.stats.totalScore += this.score;
    const newRecord = this.score > this.stats.best;
    if (newRecord) this.stats.best = this.score;
    this.save();

    if (window.ArcadeAnalytics) {
      ArcadeAnalytics.track('game_over', { game: 'sky-drift', score: this.score });
    }
    setTimeout(() => this.notify({ newRecord, reason }), 400);
  },

  addPopup(x, y, text, color, big) {
    this.popups.push({ x, y, text, color, big: big ? 1 : 0, life: 1, maxLife: 1 });
  },

  getRenderState() {
    return {
      bird: this.bird,
      pipes: this.pipes,
      scroll: this.scroll,
      speed: this.speed,
      popups: this.popups,
      shake: this.shake,
    };
  },

  getMedal(score) {
    if (score >= 50) return { icon: '🥇', name: 'Gold' };
    if (score >= 30) return { icon: '🥈', name: 'Silber' };
    if (score >= 15) return { icon: '🥉', name: 'Bronze' };
    return null;
  },

  notify(extra = {}) {
    if (this.onStateChange) this.onStateChange(this.state, extra);
  },

  idleRender() {
    if (this.state === 'dead' && this.bird) {
      this.bird.vy = Math.min(this.bird.vy + CONFIG.GRAVITY, CONFIG.MAX_VELOCITY);
      this.bird.y += this.bird.vy;
      this.bird.rotation = Math.min(Math.PI / 2, this.bird.rotation + 0.08);
      this.scroll += 0.3;
    } else if (this.state === 'menu' || this.state === 'ready') {
      this.scroll += 0.5;
      this.bird.y = this.renderer.h * 0.42 + Math.sin(this.frame * 0.04) * 12;
      this.bird.rotation = Math.sin(this.frame * 0.04) * 0.08;
      this.bird.wingPhase += 0.08;
    }
    this.frame++;
    this.renderer.render(this.getRenderState());
  },
};