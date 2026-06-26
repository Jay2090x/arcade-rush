const Game = {
  state: 'menu',
  renderer: null,
  ball: null,
  player: null,
  score: 0,
  combo: 0,
  bestCombo: 0,
  runPerfects: 0,
  hadFever: false,
  multiplier: 1,
  gravity: CONFIG.GRAVITY,
  perfectHalf: CONFIG.PERFECT_HALF,
  frame: 0,
  popups: [],
  shake: 0,
  fever: false,
  slowMoTicks: 0,
  awaitingHeader: false,
  headerDone: false,
  headerReady: false,
  perfectReady: false,
  aligned: false,
  wasRising: false,
  ballType: 'normal',
  tutorialMode: false,
  _tutFlags: {},
  stats: null,
  sound: true,
  loopId: null,
  onStateChange: null,
  onScore: null,
  onCombo: null,
  onTutorialEvent: null,
  onUnlock: null,
  onDailyComplete: null,

  init(renderer) {
    this.renderer = renderer;
    this.load();
    this.resetEntities();
  },

  load() {
    this.stats = Meta.defaultStats();
    try {
      const s = localStorage.getItem(CONFIG.SAVE_KEY);
      if (s) this.stats = { ...this.stats, ...JSON.parse(s) };
    } catch (_) {}
    Meta.ensureDaily(this.stats);
  },

  save() {
    localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(this.stats));
  },

  cosmetics() {
    const eq = this.stats.equipped || { kit: 'kit_default', ball: 'ball_default' };
    return { kit: eq.kit || 'kit_default', ball: eq.ball || 'ball_default' };
  },

  resetEntities() {
    const r = this.renderer;
    this.player = { x: r.w * 0.5, y: r.groundY - 4, nod: 0 };
    this.ball = {
      x: r.w * 0.5,
      y: r.h * 0.26,
      vx: 0,
      vy: 2,
      spin: 0,
      rot: 0,
    };
    this.gravity = CONFIG.GRAVITY;
    this.perfectHalf = CONFIG.PERFECT_HALF;
    this.awaitingHeader = true;
    this.headerDone = false;
    this.headerReady = false;
    this.perfectReady = false;
    this.aligned = false;
    this.wasRising = false;
    this.ballType = 'normal';
    this.fever = false;
    this.slowMoTicks = 0;
    this.runPerfects = 0;
    this.hadFever = false;
  },

  headPoint() {
    const p = this.player;
    const s = CONFIG.PLAYER_SCALE;
    const nod = p.nod || 0;
    return { x: p.x, y: p.y - s * CONFIG.HEAD_OFFSET_Y - nod * s * 14 };
  },

  chaseTargetX() {
    const r = this.renderer;
    const pad = CONFIG.PLAYER_W;
    const head = this.headPoint();
    let tx = this.ball.x;
    if (this.ball.vy > 0.4) {
      const frames = Math.max(1, (this.ball.y - head.y) / this.ball.vy);
      tx = this.ball.x + this.ball.vx * Math.min(frames, 50);
    }
    return Math.max(pad, Math.min(r.w - pad, tx));
  },

  runSpeed(dist) {
    const base = Math.min(CONFIG.RUN_SPEED_CAP, CONFIG.RUN_SPEED_BASE + this.score * 0.05 + this.combo * 0.08);
    const boost = 1 + Math.min(dist / 70, 1) * CONFIG.CHASE_BOOST;
    return base * boost;
  },

  timeScale() {
    return this.slowMoTicks > 0 ? CONFIG.SLOWMO_SCALE : 1;
  },

  updateMultiplier() {
    let m = 1 + Math.floor(this.combo / 2);
    if (this.fever) m *= 2;
    this.multiplier = Math.min(CONFIG.MULT_CAP, m);
    if (this.onCombo) this.onCombo(this.combo, this.multiplier, this.fever);
  },

  pickBallType() {
    if (this.tutorialMode || this.score < 3) return 'normal';
    const r = Math.random();
    if (r < 0.14) return 'fast';
    if (r < 0.26) return 'curve';
    return 'normal';
  },

  start() {
    this.state = 'ready';
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.frame = 0;
    this.popups = [];
    this.shake = 0;
    this.resetEntities();
    this.renderer.particles.list = [];
    this.updateMultiplier();
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
      this._tutFlags = {};
      if (this.tutorialMode) this.perfectHalf += 8;
      this.ball.vy = this.tutorialMode ? 2.2 : 2.8;
      if (this.sound) Audio.play('start');
      this.beginLoop();
      this.notify();
      return;
    }
    if (this.state === 'playing') {
      this.tryHeader();
      return;
    }
    if (this.state === 'dead') {
      this.start();
    }
  },

  timingTier(head) {
    const dy = this.ball.y - (head.y - 5);
    if (dy < -CONFIG.GOOD_HALF) return 'early';
    if (Math.abs(dy) <= this.perfectHalf) return 'perfect';
    if (Math.abs(dy) <= CONFIG.GOOD_HALF) return 'good';
    return 'late';
  },

  tryHeader() {
    if (!this.awaitingHeader || this.headerDone) {
      if (this.awaitingHeader && !this.headerDone && this.ball.vy > 0) {
        this.addPopup(this.ball.x, this.ball.y - 44, GameI18n.t('wait'), '#90CAF9', false);
      }
      return;
    }

    const head = this.headPoint();
    if (!this.aligned) {
      this.addPopup(head.x, head.y - 48, GameI18n.t('too_far'), '#90CAF9', false);
      if (this.sound) Audio.play('miss');
      return;
    }
    const tier = this.timingTier(head);

    if (tier === 'early') {
      this.combo = 0;
      this.fever = false;
      this.updateMultiplier();
      this.ball.vx = (Math.random() - 0.5) * 9;
      this.ball.vy = -4;
      this.player.nod = 0.4;
      this.addPopup(head.x, head.y - 50, GameI18n.t('too_early'), '#EF5350', true);
      this.shake = 6;
      if (this.sound) Audio.play('miss');
      return;
    }

    if (tier === 'late') {
      this.combo = 0;
      this.fever = false;
      this.updateMultiplier();
    }

    this.doHeader(tier, head);
  },

  doHeader(tier, head) {
    const r = this.renderer;
    const ball = this.ball;
    const player = this.player;

    const forces = { perfect: CONFIG.BOUNCE_PERFECT, good: CONFIG.BOUNCE_GOOD, late: CONFIG.BOUNCE_LATE };
    const pts = { perfect: 2, good: 1, late: 1 };
    const colors = { perfect: '#FFD54F', good: '#FFE082', late: '#FFAB91' };
    const labels = { perfect: GameI18n.t('perfect'), good: GameI18n.t('good'), late: GameI18n.t('late') };

    ball.vy = Math.max(forces[tier], forces[tier] - ball.vy * 0.1);
    const drift = CONFIG.DRIFT_BASE + this.score * 0.09 + (tier === 'late' ? 1.8 : 0);
    ball.vx = (Math.random() - 0.5) * drift * 1.6;
    if (this.ballType === 'curve') ball.vx += (Math.random() > 0.5 ? 1 : -1) * (2 + this.score * 0.05);
    ball.x += (head.x - ball.x) * 0.35;
    ball.y = head.y - CONFIG.BALL_R - 4;
    player.nod = tier === 'perfect' ? 1.2 : 0.85;

    this.headerDone = true;
    this.awaitingHeader = false;
    this.headerReady = false;
    this.perfectReady = false;
    this.wasRising = false;
    this.ballType = 'normal';

    if (tier === 'perfect') {
      this.combo++;
      this.runPerfects++;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      this.slowMoTicks = CONFIG.SLOWMO_TICKS;
    }

    if (this.combo >= CONFIG.FEVER_COMBO) {
      this.fever = true;
      this.hadFever = true;
    }
    this.updateMultiplier();

    const gained = pts[tier] * this.multiplier;
    this.score += gained;
    this.gravity = Math.min(0.72, this.gravity + CONFIG.GRAVITY_INC);
    this.perfectHalf = Math.max(CONFIG.PERFECT_MIN, this.perfectHalf - CONFIG.PERFECT_SHRINK);

    const label = tier === 'perfect' && this.multiplier > 1 ? `${labels[tier]} x${this.multiplier}` : labels[tier];
    this.addPopup(ball.x, ball.y - 30, label, colors[tier], tier === 'perfect');
    if (gained > 1) this.addPopup(ball.x + 24, ball.y - 8, `+${gained}`, '#fff', false);

    if (this.combo > 0 && this.combo % 3 === 0) {
      this.addPopup(head.x, head.y - 58, `🔥${this.combo}`, '#FF6B35', true);
      if (this.sound) Audio.play('crowd', Math.min(this.combo, 12));
    }
    if (this.fever && this.combo === CONFIG.FEVER_COMBO) {
      this.addPopup(r.w * 0.5, r.h * 0.22, GameI18n.t('fever'), '#FF3D00', true);
      this.shake = 14;
      if (this.sound) { Audio.play('fever'); Audio.play('celebrate'); }
    } else {
      this.shake = tier === 'perfect' ? 8 : 5;
    }

    const burst = tier === 'perfect' ? 20 : 10;
    r.particles.burst(ball.x, head.y, { count: burst, color: '#C8102E', speed: 5 });
    r.particles.burst(ball.x, head.y, { count: 6, color: '#fff', speed: 3 });
    if (this.sound) {
      Audio.play(tier === 'perfect' ? 'perfect' : 'head', this.combo);
      if (tier === 'perfect' && this.combo > 1) Audio.play('combo', this.combo);
      if (gained > 0) Audio.play('score', this.combo);
      if (tier === 'perfect' && this.combo >= 3) Audio.play('crowd', this.combo);
    }
    if (this.onScore) this.onScore(this.score);
    if (this.tutorialMode && this.onTutorialEvent) this.onTutorialEvent('header', { tier, score: this.score });
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
    const ts = this.timeScale();
    if (this.slowMoTicks > 0) this.slowMoTicks--;

    this.frame++;
    const r = this.renderer;
    const ball = this.ball;
    const player = this.player;

    const targetX = this.chaseTargetX();
    const dx = targetX - player.x;
    const step = this.runSpeed(Math.abs(dx)) * ts;
    if (Math.abs(dx) <= step) player.x = targetX;
    else player.x += Math.sign(dx) * step;
    if (player.nod > 0) player.nod -= 0.12 * ts;

    const gravMult = (this.ballType === 'fast' ? 1.38 : 1) * (this.tutorialMode ? 0.72 : 1);
    ball.vy = Math.min(ball.vy + this.gravity * gravMult * ts, CONFIG.MAX_VY);
    ball.vx *= Math.pow(0.994, ts);
    ball.x += ball.vx * ts;
    ball.y += ball.vy * ts;

    const edge = 10;
    if (ball.x - CONFIG.BALL_R < edge) {
      ball.x = edge + CONFIG.BALL_R;
      ball.vx = Math.abs(ball.vx) * 0.5;
    } else if (ball.x + CONFIG.BALL_R > r.w - edge) {
      ball.x = r.w - edge - CONFIG.BALL_R;
      ball.vx = -Math.abs(ball.vx) * 0.5;
    }
    ball.rot = Math.max(-0.7, Math.min(1, ball.vy * 0.08));
    ball.spin += ball.vx * 0.06 * ts;

    const head = this.headPoint();
    this.aligned = Math.abs(ball.x - head.x) < CONFIG.HEADER_REACH;

    if (ball.vy <= 0) this.wasRising = true;
    if (this.wasRising && ball.vy > 0.6) {
      this.awaitingHeader = true;
      this.headerDone = false;
      this.ballType = this.pickBallType();
    }

    this.headerReady = false;
    this.perfectReady = false;
    if (this.awaitingHeader && !this.headerDone && ball.vy > 0) {
      const idealY = head.y - 5;
      const inWindow = ball.y > idealY - CONFIG.GOOD_HALF - 20 && ball.y < idealY + CONFIG.GOOD_HALF + 8;
      this.headerReady = this.aligned && inWindow;
      this.perfectReady = this.headerReady && Math.abs(ball.y - idealY) <= this.perfectHalf;

      if (this.tutorialMode && this.onTutorialEvent) {
        if (this.aligned && !this._tutFlags.aligned) { this._tutFlags.aligned = true; this.onTutorialEvent('aligned'); }
        if (this.perfectReady && !this._tutFlags.perfect) { this._tutFlags.perfect = true; this.onTutorialEvent('perfect_window'); }
      }

      if (ball.y > idealY + CONFIG.GOOD_HALF + 14) {
        this.die('miss');
        return;
      }
    }

    const decay = 0.016 * ts;
    for (let i = this.popups.length - 1; i >= 0; i--) {
      this.popups[i].life -= decay;
      if (this.popups[i].life <= 0) this.popups.splice(i, 1);
    }

    if (this.shake > 0) this.shake *= Math.pow(0.84, ts);

    if (ball.y - CONFIG.BALL_R > r.groundY) {
      this.die('ground');
      return;
    }
    if (ball.y + CONFIG.BALL_R < -40) this.die('out');
  },

  die(reason) {
    this.state = 'dead';
    this.shake = 14;
    this.fever = false;
    this.renderer.particles.burst(this.ball.x, this.ball.y, { count: 22, color: '#C8102E', speed: 6 });
    if (this.sound) Audio.play('die');

    const run = {
      score: this.score, bestCombo: this.bestCombo, perfects: this.runPerfects,
      hadFever: this.hadFever,
    };

    this.stats.games++;
    this.stats.totalScore += this.score;
    this.stats.perfects = (this.stats.perfects || 0) + this.runPerfects;
    if (this.hadFever) this.stats.feverCount = (this.stats.feverCount || 0) + 1;
    this.stats.maxCombo = Math.max(this.stats.maxCombo || 0, this.bestCombo);

    const prevBest = this.stats.best;
    const newRecord = this.score > prevBest;
    if (newRecord) this.stats.best = this.score;

    const dailyDone = Meta.updateDaily(this.stats, run);
    const unlocked = Meta.checkUnlocks(this.stats, run);
    this.save();

    if (unlocked.length && this.onUnlock) this.onUnlock(unlocked);
    if (dailyDone && this.onDailyComplete) this.onDailyComplete();

    Meta.submitLeaderboard({
      score: this.score, combo: this.bestCombo,
      name: 'Bro', ts: Date.now(),
    });

    const toGoal = Math.max(0, CONFIG.CHALLENGE_SCORE - this.score);
    const toBest = newRecord ? 0 : Math.max(0, prevBest - this.score);

    if (window.ArcadeAnalytics) {
      ArcadeAnalytics.track('game_over', { game: 'vatreni-bro', score: this.score, combo: this.bestCombo, reason });
    }
    setTimeout(() => this.notify({
      newRecord, reason, toGoal, toBest, prevBest,
      unlocked, dailyDone,
    }), 350);
  },

  addPopup(x, y, text, color, big) {
    this.popups.push({ x, y, text, color, big: big ? 1 : 0, life: 1, maxLife: 1 });
  },

  getRenderState() {
    const cos = this.cosmetics();
    return {
      ball: this.ball,
      player: this.player,
      head: this.headPoint(),
      headerReady: this.headerReady,
      perfectReady: this.perfectReady,
      aligned: this.aligned,
      combo: this.combo,
      fever: this.fever,
      ballType: this.ballType,
      showTelegraph: this.awaitingHeader && !this.headerDone && this.ballType !== 'normal' && this.ball.vy > 0,
      popups: this.popups,
      shake: this.shake,
      score: this.score,
      scroll: this.frame * (0.8 + this.combo * 0.05),
      cosmetics: cos,
      slowMo: this.slowMoTicks > 0,
    };
  },

  getMedal(score) {
    if (score >= 50) return { icon: '🥇', name: 'Vatreni Legend' };
    if (score >= 30) return { icon: '🥈', name: 'Fire Starter' };
    if (score >= CONFIG.CHALLENGE_SCORE) return { icon: '🥉', name: 'Bro Pro' };
    return null;
  },

  notify(extra = {}) {
    if (this.onStateChange) this.onStateChange(this.state, extra);
  },

  idleRender() {
    if (this.state === 'menu' || this.state === 'ready') {
      this.frame++;
      this.ball.y = this.renderer.h * 0.26 + Math.sin(this.frame * 0.05) * 10;
      this.ball.x = this.renderer.w * 0.5 + Math.sin(this.frame * 0.04) * 28;
      const dx = this.ball.x - this.player.x;
      const step = CONFIG.RUN_SPEED_BASE;
      if (Math.abs(dx) <= step) this.player.x = this.ball.x;
      else this.player.x += Math.sign(dx) * step;
      this.player.nod = Math.max(0, Math.sin(this.frame * 0.1) * 0.25);
      this.aligned = Math.abs(this.ball.x - this.headPoint().x) < CONFIG.HEADER_REACH;
      if (this.state === 'ready') {
        this.headerReady = this.aligned && Math.sin(this.frame * 0.1) > 0.45;
        this.perfectReady = this.headerReady && Math.sin(this.frame * 0.1) > 0.82;
      } else {
        this.headerReady = false;
        this.perfectReady = false;
      }
    }
    this.renderer.render(this.getRenderState());
  },
};