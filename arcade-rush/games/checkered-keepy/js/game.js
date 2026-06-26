const Game = {
  state: 'menu',
  renderer: null,
  ball: null,
  player: null,
  score: 0,
  streak: 0,
  gravity: CONFIG.GRAVITY,
  wind: 0,
  frame: 0,
  popups: [],
  shake: 0,
  targetX: null,
  stats: { best: 0, games: 0, totalScore: 0 },
  sound: true,
  loopId: null,
  onStateChange: null,
  onScore: null,

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
    this.player = {
      x: r.w * 0.5,
      y: r.groundY - 4,
      nod: 0,
    };
    this.targetX = this.player.x;
    this.ball = {
      x: r.w * 0.5,
      y: r.h * 0.35,
      vx: 0,
      vy: 2,
      spin: 0,
    };
    this.gravity = CONFIG.GRAVITY;
    this.wind = CONFIG.WIND_BASE;
  },

  start() {
    this.state = 'ready';
    this.score = 0;
    this.streak = 0;
    this.frame = 0;
    this.popups = [];
    this.shake = 0;
    this.resetEntities();
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
      this.resetEntities();
      this.ball.vy = 2.5;
      if (this.sound) Audio.play('start');
      this.beginLoop();
      this.notify();
      return;
    }
    if (this.state === 'dead') {
      this.start();
    }
  },

  setTargetX(x) {
    if (this.state !== 'playing' && this.state !== 'ready') return;
    const pad = CONFIG.PLAYER_W;
    this.targetX = Math.max(pad, Math.min(this.renderer.w - pad, x));
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

  update() {
    this.frame++;
    const r = this.renderer;
    const ball = this.ball;
    const player = this.player;

    player.x += (this.targetX - player.x) * 0.22;
    if (player.nod > 0) player.nod -= 0.12;

    ball.vy = Math.min(ball.vy + this.gravity, CONFIG.MAX_VY);
    ball.vx += this.wind * 0.02;
    ball.vx *= 0.998;
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.spin += ball.vx * 0.04;

    const headY = player.y - 52 * CONFIG.PLAYER_SCALE * 0.55 - player.nod * 14;
    const dx = ball.x - player.x;
    const dy = ball.y - headY;
    const dist = Math.hypot(dx, dy);
    const hitR = CONFIG.BALL_R + CONFIG.HEAD_R * 0.85;

    if (ball.vy > 0 && dist < hitR) {
      const power = Math.max(CONFIG.BOUNCE_FORCE, CONFIG.BOUNCE_FORCE - ball.vy * 0.15);
      ball.vy = power;
      ball.vx = dx * 0.14 + this.wind;
      ball.y = headY - CONFIG.BALL_R - CONFIG.HEAD_R * 0.5;
      player.nod = 1;
      this.score++;
      this.streak++;
      this.addPopup(ball.x, ball.y - 30, '+1', '#FFE082', true);
      if (this.streak % 5 === 0) {
        this.addPopup(player.x, headY - 50, `STREAK ${this.streak}!`, '#FF6B35', true);
      }
      this.shake = 4;
      r.particles.burst(ball.x, headY, { count: 12, color: '#C8102E', speed: 4 });
      r.particles.burst(ball.x, headY, { count: 8, color: '#fff', speed: 3 });
      if (this.sound) {
        Audio.play('head');
        Audio.play('score');
      }
      if (this.onScore) this.onScore(this.score);

      this.wind = CONFIG.WIND_BASE + this.score * CONFIG.WIND_PER_SCORE;
      if (this.score % CONFIG.GRAVITY_BUMP_EVERY === 0) {
        this.gravity = Math.min(0.62, this.gravity + CONFIG.GRAVITY_BUMP);
      }
    }

    for (let i = this.popups.length - 1; i >= 0; i--) {
      this.popups[i].life -= 0.016;
      if (this.popups[i].life <= 0) this.popups.splice(i, 1);
    }

    if (this.shake > 0) this.shake *= 0.85;

    if (ball.y - CONFIG.BALL_R > r.groundY) {
      this.die('ground');
      return;
    }
    if (ball.y + CONFIG.BALL_R < -20 || ball.x < -30 || ball.x > r.w + 30) {
      this.die('out');
    }
  },

  die(reason) {
    this.state = 'dead';
    this.shake = 10;
    this.renderer.particles.burst(this.ball.x, this.ball.y, { count: 18, color: '#888', speed: 5 });
    if (this.sound) Audio.play('die');

    this.stats.games++;
    this.stats.totalScore += this.score;
    const newRecord = this.score > this.stats.best;
    if (newRecord) this.stats.best = this.score;
    this.save();

    if (window.ArcadeAnalytics) {
      ArcadeAnalytics.track('game_over', { game: 'checkered-keepy', score: this.score, reason });
    }
    setTimeout(() => this.notify({ newRecord, reason }), 400);
  },

  addPopup(x, y, text, color, big) {
    this.popups.push({ x, y, text, color, big: big ? 1 : 0, life: 1, maxLife: 1 });
  },

  getRenderState() {
    return {
      ball: this.ball,
      player: this.player,
      popups: this.popups,
      shake: this.shake,
      score: this.score,
      wind: this.wind,
    };
  },

  getMedal(score) {
    if (score >= 50) return { icon: '🥇', name: 'Legend' };
    if (score >= 30) return { icon: '🥈', name: 'Star' };
    if (score >= CONFIG.CHALLENGE_SCORE) return { icon: '🥉', name: 'Pro' };
    return null;
  },

  notify(extra = {}) {
    if (this.onStateChange) this.onStateChange(this.state, extra);
  },

  idleRender() {
    if (this.state === 'menu' || this.state === 'ready') {
      this.frame++;
      this.ball.y = this.renderer.h * 0.35 + Math.sin(this.frame * 0.05) * 10;
      this.ball.x = this.renderer.w * 0.5 + Math.sin(this.frame * 0.03) * 20;
    }
    this.renderer.render(this.getRenderState());
  },
};