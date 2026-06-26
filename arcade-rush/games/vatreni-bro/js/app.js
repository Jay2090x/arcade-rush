const Tutorial = {
  steps: [],
  step: 0,
  active: false,
  els: {},

  init() {
    this.els.overlay = document.getElementById('tutorial-overlay');
    this.els.text = document.getElementById('tutorial-text');
    this.els.step = document.getElementById('tutorial-step');
    document.getElementById('tutorial-skip')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.finish();
    });
    this.refreshSteps();
  },

  refreshSteps() {
    const de = GameI18n.lang === 'de';
    this.steps = de ? [
      'Bro läuft selbst — warte bis er unter dem Ball ist.',
      'Achte auf den goldenen PERFECT!-Ring.',
      'Jetzt tippen! Triff PERFECT! für Bonuspunkte.',
      'Perfects bauen Combos → FEVER ab 6! Ziel: 20 Punkte.',
    ] : [
      'Bro runs on his own — wait until he\'s under the ball.',
      'Watch for the golden PERFECT! ring.',
      'Tap now! Hit PERFECT! for bonus points.',
      'Perfects build combos → FEVER at 6! Goal: 20 points.',
    ];
  },

  isDone() {
    try { return localStorage.getItem(CONFIG.TUTORIAL_KEY) === '1'; } catch (_) { return false; }
  },

  shouldRun() { return !this.isDone(); },

  start() {
    this.refreshSteps();
    this.step = 0;
    this.active = true;
    Game.tutorialMode = true;
    this.showStep();
    this.els.overlay?.classList.add('active');
    if (Game.sound) Audio.play('tutorial');
  },

  showStep() {
    if (this.els.text) this.els.text.textContent = this.steps[this.step];
    if (this.els.step) this.els.step.textContent = `${this.step + 1} / ${this.steps.length}`;
  },

  advance() {
    if (!this.active) return;
    this.step++;
    if (Game.sound) Audio.play('tutorial');
    if (this.step >= this.steps.length) { this.finish(); return; }
    this.showStep();
  },

  onEvent(event) {
    if (!this.active) return;
    if (event === 'aligned' && this.step === 0) this.advance();
    if (event === 'perfect_window' && this.step === 1) this.advance();
    if (event === 'header' && this.step === 2) {
      this.advance();
      setTimeout(() => { if (this.active && this.step === 3) this.finish(); }, 2800);
    }
  },

  finish() {
    this.active = false;
    Game.tutorialMode = false;
    this.els.overlay?.classList.remove('active');
    try { localStorage.setItem(CONFIG.TUTORIAL_KEY, '1'); } catch (_) {}
  },
};

const Share = {
  buildText() {
    const url = window.location.href.split('?')[0];
    return [
      `Vatreni Bro 🔥🇭🇷 — ${Game.score} pts`,
      Game.bestCombo > 0 ? `Combo: ${Game.bestCombo}` : null,
      GameI18n.lang === 'de' ? 'Schaffst du mehr?' : 'Can you beat me?',
      url,
    ].filter(Boolean).join('\n');
  },

  async send(btn) {
    const text = this.buildText();
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Vatreni Bro', text, url: window.location.href });
        return;
      }
      await navigator.clipboard.writeText(text);
      if (btn) {
        btn.textContent = GameI18n.t('copied');
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = GameI18n.t('share');
          btn.classList.remove('copied');
        }, 2000);
      }
    } catch (_) {}
  },
};

const UI = {
  els: {},

  init() {
    GameI18n.init();
    ['menu-screen', 'ready-screen', 'gameover-screen', 'hud',
      'score', 'best', 'menu-best', 'menu-games', 'go-score', 'go-final',
      'go-best', 'go-streak', 'go-medal', 'go-new-record', 'go-context', 'go-unlock',
      'btn-play', 'btn-retry', 'btn-share', 'btn-sound', 'btn-lang',
      'progress-fill', 'goal-hint', 'combo', 'mult-pill', 'combo-panel',
      'daily-text', 'daily-fill', 'daily-card'
    ].forEach(id => { this.els[id] = document.getElementById(id); });

    Tutorial.init();
    this.updateStats();
    this.updateDaily();
    this.updateProgress(0);

    Game.onStateChange = (state, extra) => this.onStateChange(state, extra);
    Game.onTutorialEvent = (event, data) => Tutorial.onEvent(event, data);
    Game.onUnlock = (ids) => this.onUnlock(ids);
    Game.onDailyComplete = () => this.onDailyComplete();
    Game.onScore = (score) => {
      this.els.score.textContent = score;
      this.els.score.classList.remove('bump');
      void this.els.score.offsetWidth;
      this.els.score.classList.add('bump');
      this.updateProgress(score);
    };
    Game.onCombo = (combo, mult, fever) => {
      if (this.els.combo) this.els.combo.textContent = combo;
      if (this.els['mult-pill']) {
        this.els['mult-pill'].textContent = `x${mult}`;
        this.els['mult-pill'].classList.toggle('hot', mult >= 3);
        this.els['mult-pill'].classList.toggle('fever', fever);
      }
      if (this.els['combo-panel']) {
        this.els['combo-panel'].classList.toggle('active', combo > 0);
        this.els['combo-panel'].classList.toggle('fever', fever);
      }
    };

    document.getElementById('btn-play').addEventListener('click', (e) => {
      e.stopPropagation();
      if (Game.state === 'menu' && Tutorial.shouldRun()) {
        Game.start();
        Tutorial.start();
        Game.state = 'playing';
        Game.resetEntities();
        Game._tutFlags = {};
        Game.perfectHalf += 8;
        Game.ball.vy = 2.2;
        if (Game.sound) Audio.play('start');
        Game.beginLoop();
        this.onStateChange('playing');
        return;
      }
      Game.play();
    });

    document.getElementById('btn-retry').addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideAll();
      Game.start();
      Game.state = 'ready';
      this.show('ready-screen');
    });

    document.getElementById('btn-share')?.addEventListener('click', (e) => {
      e.stopPropagation();
      Share.send(e.currentTarget);
    });

    document.getElementById('btn-sound').addEventListener('click', (e) => {
      e.stopPropagation();
      const on = Audio.toggle();
      e.currentTarget.textContent = on ? '🔊' : '🔇';
      Game.sound = on;
    });

    document.getElementById('btn-lang')?.addEventListener('click', (e) => {
      e.stopPropagation();
      GameI18n.toggle();
      Tutorial.refreshSteps();
      this.updateDaily();
    });

    const action = (e) => {
      if (e.target.closest('.btn-sound, .btn-play, .btn-retry, .btn-share, .btn-lang, .back-arcade, .tutorial-skip, .tutorial-overlay')) return;
      Game.play();
    };

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); Game.play(); }
    });

    const app = document.getElementById('app');
    app.addEventListener('click', action);
    app.addEventListener('touchstart', (e) => {
      if (e.target.closest('.btn-sound, .btn-play, .btn-retry, .btn-share, .btn-lang, .back-arcade, .tutorial-skip, .tutorial-overlay')) return;
      e.preventDefault();
      action(e);
    }, { passive: false });
  },

  updateDaily() {
    const ch = Meta.ensureDaily(Game.stats);
    const d = Game.stats.daily;
    if (this.els['daily-text']) {
      this.els['daily-text'].textContent = d.done
        ? GameI18n.t('daily_done')
        : Meta.dailyLabel(ch, GameI18n.lang);
    }
    if (this.els['daily-fill']) {
      const pct = d.done ? 100 : Math.min(100, (d.progress / ch.target) * 100);
      this.els['daily-fill'].style.width = `${pct}%`;
    }
    if (this.els['daily-card']) this.els['daily-card'].classList.toggle('done', d.done);
  },

  onUnlock(ids) {
    if (Game.sound) Audio.play('unlock');
    const names = ids.map(id => Meta.KITS[id]?.name || Meta.BALLS[id]?.name || id).join(', ');
    if (this.els['go-unlock']) this.els['go-unlock'].textContent = `🔓 ${names}`;
  },

  onDailyComplete() {
    this.updateDaily();
    if (Game.sound) Audio.play('celebrate');
  },

  buildGameOverContext(extra) {
    const lines = [];
    if (extra.reason) lines.push(GameI18n.tr(extra.reason));
    if (extra.newRecord) lines.push(GameI18n.t('context_record'));
    else if (extra.toBest === 1) lines.push(GameI18n.t('context_one'));
    else if (extra.toBest > 0 && extra.toBest <= 5) lines.push(`${extra.toBest} ${GameI18n.t('context_best')} (${extra.prevBest})`);
    else if (extra.toGoal > 0 && extra.toGoal <= 5) lines.push(`${extra.toGoal} ${GameI18n.t('context_goal')}`);
    return lines.join(' ');
  },

  updateProgress(score) {
    const pct = Math.min(100, (score / CONFIG.CHALLENGE_SCORE) * 100);
    if (this.els['progress-fill']) this.els['progress-fill'].style.width = `${pct}%`;
    if (this.els['goal-hint']) {
      const left = CONFIG.CHALLENGE_SCORE - score;
      this.els['goal-hint'].textContent = left > 0 ? `${left} ${GameI18n.t('goal_left')}` : GameI18n.t('chase');
    }
  },

  updateStats() {
    const { best, games } = Game.stats;
    this.els.best.textContent = best;
    this.els['menu-best'].textContent = best;
    this.els['menu-games'].textContent = games;
  },

  hideAll() {
    document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
    this.els.hud.classList.remove('visible');
  },

  show(id) { this.els[id]?.classList.add('active'); },

  onStateChange(state, extra = {}) {
    switch (state) {
      case 'ready':
        this.hideAll();
        this.show('ready-screen');
        this.els.hud.classList.add('visible');
        this.els.score.textContent = '0';
        if (this.els.combo) this.els.combo.textContent = '0';
        if (this.els['mult-pill']) this.els['mult-pill'].textContent = 'x1';
        this.updateProgress(0);
        break;
      case 'playing':
        this.hideAll();
        this.els.hud.classList.add('visible');
        break;
      case 'dead':
        Tutorial.finish();
        this.show('gameover-screen');
        this.els['go-score'].textContent = Game.score;
        this.els['go-final'].textContent = Game.score;
        this.els['go-best'].textContent = Game.stats.best;
        this.els['go-streak'].textContent = Game.bestCombo;
        if (this.els['go-context']) this.els['go-context'].textContent = this.buildGameOverContext(extra);
        if (this.els['go-unlock']) this.els['go-unlock'].textContent = extra.unlocked?.length
          ? `🔓 ${extra.unlocked.map(id => Meta.KITS[id]?.name || Meta.BALLS[id]?.name).join(', ')}`
          : '';
        const medal = Game.getMedal(Game.score);
        this.els['go-medal'].textContent = medal ? medal.icon + ' ' + medal.name : '';
        this.els['go-new-record'].style.display = extra.newRecord ? 'block' : 'none';
        if (this.els['btn-share']) {
          this.els['btn-share'].textContent = GameI18n.t('share');
          this.els['btn-share'].classList.remove('copied');
        }
        this.updateStats();
        this.updateDaily();
        break;
      case 'menu':
        this.updateDaily();
        break;
    }
  },
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.ArcadeAnalytics) {
    sessionStorage.setItem('arcade_play_start', Date.now().toString());
    ArcadeAnalytics.track('game_start', { game: 'vatreni-bro' });
  }
  Audio.init();
  const canvas = document.getElementById('game-canvas');
  const renderer = new Renderer(canvas);
  Game.init(renderer);
  UI.init();

  const idle = () => {
    if (Game.state === 'menu' || Game.state === 'ready' || Game.state === 'dead') {
      Game.idleRender();
    }
    requestAnimationFrame(idle);
  };
  requestAnimationFrame(idle);
});