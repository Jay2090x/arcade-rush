const Game = {
  state: 'menu',
  phase: 'aim',
  renderer: null,
  ball: null,
  keeper: null,
  score: 0,
  streak: 0,
  frame: 0,
  aimH: 0,
  aimV: 0,
  power: 0.5,
  aimDir: 1,
  powerDir: 1,
  shotTx: 0,
  shotTy: 0,
  popups: [],
  flash: 0,
  flashColor: null,
  stats: { best: 0, games: 0, totalScore: 0 },
  sound: true,
  loopId: null,
  onStateChange: null,
  onScore: null,
  onStreak: null,

  init(renderer) {
    this.renderer = renderer;
    this.load();
    this.resetEntities();
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

  resetEntities() {
    const r = this.renderer;
    const goal = r.goal;
    this.ball = { x: r.spot.x, y: r.spot.y, vx: 0, vy: 0, spin: 0 };
    this.keeper = {
      x: goal.x,
      y: goal.y + goal.h * 0.58,
      targetX: goal.x,
      targetY: goal.y + goal.h * 0.58,
      tilt: 0,
      dive: 0,
    };
    this.aimH = 0;
    this.aimV = 0.5;
    this.power = 0.5;
    this.phase = 'aim';
    this.popups = [];
    this.flash = 0;
  },

  start() {
    this.state = 'ready';
    this.score = 0;
    this.streak = 0;
    this.frame = 0;
    this.resetEntities();
    this.renderer.particles.list = [];
    this.notify();
    if (this.onStreak) this.onStreak(0);
  },

  play() {
    if (this.state === 'menu') {
      this.start();
      return;
    }
    if (this.state === 'ready') {
      this.state = 'playing';
      this.phase = 'aim';
      if (this.sound) Audio.play('start');
      this.beginLoop();
      this.notify();
      return;
    }
    if (this.state === 'playing' && this.phase === 'aim') {
      this.shoot();
    }
    if (this.state === 'dead') {
      this.start();
    }
  },

  shoot() {
    const r = this.renderer;
    const goal = r.goal;
    this.shotTx = goal.x + this.aimH * goal.w * 0.38;
    this.shotTy = goal.y + goal.h * (0.18 + this.aimV * 0.62);
    const dx = this.shotTx - this.ball.x;
    const dy = this.shotTy - this.ball.y;
    const dist = Math.hypot(dx, dy) || 1;
    const speed = CONFIG.BALL_SPEED * (0.55 + this.power * 0.55);
    this.ball.vx = (dx / dist) * speed;
    this.ball.vy = (dy / dist) * speed;
    this.ball.spin = Math.atan2(this.ball.vy, this.ball.vx);
    this.phase = 'shoot';
    this.pickKeeperDive(this.shotTx, this.shotTy);
    if (this.sound) Audio.play('kick');
  },

  pickKeeperDive(tx, ty) {
    const smart = Math.min(
      CONFIG.KEEPER_SMART_MAX,
      CONFIG.KEEPER_SMART_BASE + this.score * CONFIG.KEEPER_SMART_PER_GOAL
    );
    const goal = this.renderer.goal;
    if (Math.random() < smart) {
      this.keeper.targetX = tx;
      this.keeper.targetY = ty;
    } else {
      this.keeper.targetX = goal.x + (Math.random() - 0.5) * goal.w * 0.75;
      this.keeper.targetY = goal.y + goal.h * (0.2 + Math.random() * 0.55);
    }
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

  updateKeeper() {
    const k = this.keeper;
    const prevX = k.x;
    const prevY = k.y;
    k.x += (k.targetX - k.x) * CONFIG.KEEPER_SPEED;
    k.y += (k.targetY - k.y) * CONFIG.KEEPER_SPEED;
    const moved = Math.hypot(k.x - prevX, k.y - prevY);
    k.dive = Math.min(1, k.dive + moved * 0.08);
    k.tilt = Math.max(-0.7, Math.min(0.7, (k.targetX - k.x) * 0.012));
  },

  keeperBlocksBall() {
    const k = this.keeper;
    const bx = this.ball.x;
    const by = this.ball.y;
    const reach = CONFIG.KEEPER_W * (0.42 + k.dive * 0.38);
    const height = CONFIG.KEEPER_H * (0.38 + k.dive * 0.28);
    const gloveY = k.y - CONFIG.KEEPER_H * 0.08;
    return (
      Math.abs(bx - k.x) < reach + CONFIG.BALL_R * 0.85 &&
      Math.abs(by - gloveY) < height + CONFIG.BALL_R * 0.85
    );
  },

  update() {
    this.frame++;
    if (this.flash > 0) this.flash -= 0.08;

    for (let i = this.popups.length - 1; i >= 0; i--) {
      this.popups[i].life -= 0.016;
      if (this.popups[i].life <= 0) this.popups.splice(i, 1);
    }

    if (this.phase === 'aim') {
      this.aimH += CONFIG.AIM_SPEED * 0.016 * this.aimDir;
      if (this.aimH > 1) { this.aimH = 1; this.aimDir = -1; }
      if (this.aimH < -1) { this.aimH = -1; this.aimDir = 1; }

      this.power += CONFIG.POWER_SPEED * 0.016 * this.powerDir;
      if (this.power > 1) { this.power = 1; this.powerDir = -1; }
      if (this.power < 0.2) { this.power = 0.2; this.powerDir = 1; }

      this.aimV = 0.5 + Math.sin(this.frame * 0.04) * 0.35;
      return;
    }

    if (this.phase === 'shoot') {
      this.ball.x += this.ball.vx;
      this.ball.y += this.ball.vy;
      this.ball.spin += 0.2;
      this.updateKeeper();

      if (this.keeperBlocksBall()) {
        this.phase = 'resolving';
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.addPopup(this.ball.x, this.ball.y - 20, 'GEHALTEN!', '#64B5F6', true);
        this.endRun('save');
        return;
      }

      const goal = this.renderer.goal;
      const gx = goal.x - goal.w / 2;
      const gy = goal.y;
      const bx = this.ball.x;
      const by = this.ball.y;
      const pastLine = by <= gy + goal.h * 0.25 && this.ball.vy < 0;
      const inPosts = bx > gx + 10 && bx < gx + goal.w - 10;
      const inHeight = by > gy + 6 && by < gy + goal.h - 6;

      if (pastLine) {
        this.phase = 'resolving';
        this.ball.vx = 0;
        this.ball.vy = 0;
        if (!inPosts || !inHeight) {
          this.endRun('miss');
        } else {
          this.scoreGoal(bx, by);
        }
        return;
      }

      if (by < -30 || bx < -40 || bx > this.renderer.w + 40) {
        this.phase = 'resolving';
        this.endRun('miss');
      }
    }
  },

  scoreGoal(x, y) {
    this.phase = 'celebrate';
    this.score++;
    this.streak++;
    const label = this.streak >= 3 ? `TOR! +1 🔥${this.streak}` : 'TOR! +1';
    this.addPopup(x, y, label, '#FFD700', true);
    this.flash = 1;
    this.flashColor = 'rgba(200, 16, 46, 0.28)';
    this.renderer.particles.burst(x, y, { count: 26, color: '#C8102E', speed: 6 });
    this.renderer.particles.burst(x, y, { count: 14, color: '#FFFFFF', speed: 4 });
    if (this.sound) Audio.play('goal');
    if (this.onScore) this.onScore(this.score);
    if (this.onStreak) this.onStreak(this.streak);
    setTimeout(() => {
      if (this.state === 'playing') this.resetForNextKick();
    }, 480);
  },

  resetForNextKick() {
    this.resetEntities();
    this.phase = 'aim';
  },

  endRun(reason) {
    if (this.phase === 'done') return;
    this.phase = 'done';
    this.state = 'dead';
    this.flash = 1;
    this.flashColor = reason === 'save'
      ? 'rgba(33, 150, 243, 0.35)'
      : 'rgba(244, 67, 54, 0.3)';
    if (this.sound) Audio.play(reason === 'save' ? 'save' : 'miss');

    this.stats.games++;
    this.stats.totalScore += this.score;
    const newRecord = this.score > this.stats.best;
    if (newRecord) this.stats.best = this.score;
    this.save();

    if (window.ArcadeAnalytics) {
      ArcadeAnalytics.track('game_over', { game: 'checker-kick', score: this.score, reason });
    }
    setTimeout(() => this.notify({ newRecord, reason }), 350);
  },

  addPopup(x, y, text, color, big) {
    this.popups.push({ x, y, text, color, big: big ? 1 : 0, life: 1, maxLife: 1 });
  },

  getRenderState() {
    return {
      ball: this.ball,
      keeper: this.keeper,
      phase: this.phase,
      aimH: this.aimH,
      aimV: this.aimV,
      power: this.power,
      score: this.score,
      streak: this.streak,
      popups: this.popups,
      flash: this.flash,
      flashColor: this.flashColor,
    };
  },

  getMedal(score) {
    if (score >= 15) return { icon: '🥇', name: 'Kroatien-Legende' };
    if (score >= 10) return { icon: '🥈', name: 'Stadion-Held' };
    if (score >= CONFIG.CHALLENGE_GOALS) return { icon: '🥉', name: 'Karo-Meister' };
    return null;
  },

  notify(extra = {}) {
    if (this.onStateChange) this.onStateChange(this.state, extra);
  },

  idleRender() {
    if (this.state === 'menu' || this.state === 'ready') {
      this.frame++;
      this.ball.y = this.renderer.spot.y + Math.sin(this.frame * 0.05) * 4;
    }
    this.renderer.render(this.getRenderState());
  },
};