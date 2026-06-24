document.addEventListener('DOMContentLoaded', () => {
  if (window.ArcadeAnalytics) {
    sessionStorage.setItem('arcade_play_start', Date.now().toString());
    ArcadeAnalytics.track('game_start', { game: 'goldgraeber' });
  }
  AudioManager.init();
  UI.init();

  const canvas = document.getElementById('mine-canvas');
  const renderer = new MineRenderer(canvas);
  Game.renderer = renderer;

  Game.onUpdate = (state, extra) => {
    UI.updateHUD(state, extra);
  };

  UI.showSplash(() => {
    renderer.resize();
    Game.init(renderer);

    const settings = Game.state.settings;
    document.getElementById('toggle-sound').checked = settings.sound;
    document.getElementById('toggle-particles').checked = settings.particles;
    document.getElementById('toggle-vibration').checked = settings.vibration;
    AudioManager.setEnabled(settings.sound);
    renderer.particles.setEnabled(settings.particles);

    UI.updateHUD(Game.state);
    UI.updateQuickBuy(Game.state);
    UI.updateMission(Game.state);
    UI.updateWorkers(Game.state);
    UI.closePanels();

    const offline = Game.checkOfflineEarnings();
    if (offline) {
      setTimeout(() => UI.showOfflineModal(offline.earnings), 500);
    }

    UI.logActivity('👆 Schlage auf die Goldkristalle!', true);
    setTimeout(() => UI.logActivity('🎯 Mission: 80× schlagen → Belohnung', true), 2500);
    setTimeout(() => UI.logActivity('👷 Lehrling kostet 200 G — lohnt sich langfristig', true), 6000);
  });

  window.addEventListener('beforeunload', () => {
    Game.state.lastOnline = Date.now();
    Game.save();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      Game.state.lastOnline = Date.now();
      Game.save();
    } else {
      const offline = Game.checkOfflineEarnings();
      if (offline) UI.showOfflineModal(offline.earnings);
    }
  });
});