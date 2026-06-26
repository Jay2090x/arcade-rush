const UI = {
  els: {},

  init() {
    ['menu-screen', 'ready-screen', 'gameover-screen', 'hud',
      'score', 'best', 'menu-best', 'menu-games', 'go-score', 'go-final',
      'go-best', 'go-streak', 'go-medal', 'go-new-record', 'btn-play', 'btn-retry', 'btn-sound',
      'progress-fill', 'goal-hint'
    ].forEach(id => { this.els[id] = document.getElementById(id); });

    this.updateStats();
    this.updateProgress(0);

    Game.onStateChange = (state, extra) => this.onStateChange(state, extra);
    Game.onScore = (score) => {
      this.els.score.textContent = score;
      this.els.score.classList.remove('bump');
      void this.els.score.offsetWidth;
      this.els.score.classList.add('bump');
      this.updateProgress(score);
    };

    document.getElementById('btn-play').addEventListener('click', (e) => { e.stopPropagation(); Game.play(); });
    document.getElementById('btn-retry').addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideAll();
      Game.start();
      Game.state = 'ready';
      this.show('ready-screen');
    });
    document.getElementById('btn-sound').addEventListener('click', (e) => {
      e.stopPropagation();
      const on = Audio.toggle();
      e.currentTarget.textContent = on ? '🔊' : '🔇';
      Game.sound = on;
    });

    const pointer = (e) => {
      const rect = document.getElementById('app').getBoundingClientRect();
      const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
      if (x != null) Game.setTargetX(x);
    };

    const action = (e) => {
      if (e.target.closest('.btn-sound, .btn-play, .btn-retry, .back-arcade')) return;
      pointer(e);
      Game.play();
    };

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        Game.play();
      }
      if (e.code === 'ArrowLeft') Game.setTargetX(Game.player.x - 40);
      if (e.code === 'ArrowRight') Game.setTargetX(Game.player.x + 40);
    });

    const app = document.getElementById('app');
    app.addEventListener('click', action);
    app.addEventListener('touchstart', (e) => {
      if (e.target.closest('.btn-sound, .btn-play, .btn-retry, .back-arcade')) return;
      e.preventDefault();
      action(e);
    }, { passive: false });
    app.addEventListener('touchmove', (e) => {
      if (e.target.closest('.btn-sound, .btn-play, .btn-retry')) return;
      e.preventDefault();
      pointer(e);
    }, { passive: false });
  },

  updateProgress(score) {
    const pct = Math.min(100, (score / CONFIG.CHALLENGE_SCORE) * 100);
    if (this.els['progress-fill']) {
      this.els['progress-fill'].style.width = `${pct}%`;
    }
    if (this.els['goal-hint']) {
      const left = CONFIG.CHALLENGE_SCORE - score;
      this.els['goal-hint'].textContent = left > 0 ? `${left} to goal` : 'Chase the record!';
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

  show(id) {
    this.els[id]?.classList.add('active');
  },

  onStateChange(state, extra = {}) {
    switch (state) {
      case 'ready':
        this.hideAll();
        this.show('ready-screen');
        this.els.hud.classList.add('visible');
        this.els.score.textContent = '0';
        this.updateProgress(0);
        break;
      case 'playing':
        this.hideAll();
        this.els.hud.classList.add('visible');
        break;
      case 'dead':
        this.show('gameover-screen');
        this.els['go-score'].textContent = Game.score;
        this.els['go-final'].textContent = Game.score;
        this.els['go-best'].textContent = Game.stats.best;
        this.els['go-streak'].textContent = Game.streak;
        const medal = Game.getMedal(Game.score);
        this.els['go-medal'].textContent = medal ? medal.icon + ' ' + medal.name : '';
        this.els['go-new-record'].style.display = extra.newRecord ? 'block' : 'none';
        this.updateStats();
        break;
    }
  },
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.ArcadeAnalytics) {
    sessionStorage.setItem('arcade_play_start', Date.now().toString());
    ArcadeAnalytics.track('game_start', { game: 'checkered-keepy' });
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