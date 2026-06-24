const UI = {
  els: {},

  init() {
    ['menu-screen', 'gameover-screen', 'hud', 'score', 'combo', 'menu-best', 'menu-games',
      'go-score', 'go-best', 'go-combo', 'go-new-record', 'btn-play', 'btn-retry', 'btn-sound'
    ].forEach(id => { this.els[id] = document.getElementById(id); });

    this.updateStats();

    Game.onStateChange = (state, extra) => this.onStateChange(state, extra);
    Game.onScore = (score) => {
      this.els.score.textContent = score;
      this.els.combo.textContent = Game.combo > 1 ? `×${Game.combo}` : '';
    };

    document.getElementById('btn-play').addEventListener('click', (e) => { e.stopPropagation(); Game.play(); });
    document.getElementById('btn-retry').addEventListener('click', (e) => { e.stopPropagation(); this.hideAll(); Game.start(); });
    document.getElementById('btn-sound').addEventListener('click', (e) => {
      e.stopPropagation();
      const on = Audio.toggle();
      e.currentTarget.textContent = on ? '🔊' : '🔇';
      Game.sound = on;
    });

    const action = () => Game.play();
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') { e.preventDefault(); action(); }
    });
    const app = document.getElementById('app');
    app.addEventListener('click', (e) => {
      if (e.target.closest('.btn-sound, .btn-play, .btn-retry, .back-arcade')) return;
      action();
    });
    app.addEventListener('touchstart', (e) => {
      if (e.target.closest('.btn-sound, .btn-play, .btn-retry, .back-arcade')) return;
      e.preventDefault();
      action();
    }, { passive: false });
  },

  updateStats() {
    const { best, games } = Game.stats;
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
      case 'playing':
        this.hideAll();
        this.els.hud.classList.add('visible');
        this.els.score.textContent = '0';
        this.els.combo.textContent = '';
        break;
      case 'dead':
        this.show('gameover-screen');
        this.els['go-score'].textContent = Game.score;
        this.els['go-best'].textContent = Game.stats.best;
        this.els['go-combo'].textContent = Game.bestCombo;
        this.els['go-new-record'].style.display = extra.newRecord ? 'block' : 'none';
        this.updateStats();
        break;
    }
  },
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.ArcadeAnalytics) {
    sessionStorage.setItem('arcade_play_start', Date.now().toString());
    ArcadeAnalytics.track('game_start', { game: 'neon-stack' });
  }
  Audio.init();
  const canvas = document.getElementById('game-canvas');
  const renderer = new Renderer(canvas);
  Game.init(renderer);
  UI.init();

  const idle = () => {
    if (Game.state === 'menu' || Game.state === 'dead') Game.idleRender();
    requestAnimationFrame(idle);
  };
  requestAnimationFrame(idle);
});