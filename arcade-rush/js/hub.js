const ADMIN_KEY = 'arcade_admin_unlock';
const ADMIN_TAPS = 5;
const ADMIN_WINDOW_MS = 2500;

document.addEventListener('DOMContentLoaded', () => {
  HubI18n.init();
  ArcadeAnalytics.init();

  setTimeout(() => {
    const s = ArcadeAnalytics.getSummary();
    if (s.globalVisits != null) document.getElementById('stat-visits').textContent = s.globalVisits;
    if (s.globalStarts != null) document.getElementById('stat-plays').textContent = s.globalStarts;
  }, 800);

  document.querySelectorAll('.game-card[data-game]').forEach(card => {
    card.addEventListener('click', () => {
      const game = card.dataset.game;
      sessionStorage.setItem('arcade_play_start', Date.now().toString());
      ArcadeAnalytics.track('game_start', { game });
    });
  });

  document.getElementById('btn-share')?.addEventListener('click', shareSite);

  let adminTaps = 0;
  let adminTimer = null;
  const badge = document.getElementById('hero-badge');
  badge?.addEventListener('click', (e) => {
    e.preventDefault();
    adminTaps++;
    clearTimeout(adminTimer);
    adminTimer = setTimeout(() => { adminTaps = 0; }, ADMIN_WINDOW_MS);
    if (adminTaps >= ADMIN_TAPS) {
      adminTaps = 0;
      sessionStorage.setItem(ADMIN_KEY, 'rush-at');
      location.href = 'dashboard.html';
    }
  });
});

async function shareSite() {
  const url = location.href.replace(/\/$/, '') + '/';
  const payload = {
    title: 'Arcade Rush',
    text: HubI18n.t('share_text'),
    url,
  };

  try {
    if (navigator.share) {
      await navigator.share(payload);
      return;
    }
    await navigator.clipboard.writeText(url);
    showShareToast(HubI18n.t('share_copied'));
  } catch (err) {
    if (err?.name === 'AbortError') return;
    try {
      await navigator.clipboard.writeText(url);
      showShareToast(HubI18n.t('share_copied'));
    } catch {
      showShareToast(HubI18n.t('share_failed'));
    }
  }
}

function showShareToast(msg) {
  const toast = document.getElementById('share-toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.hidden = false;
  toast.classList.add('visible');
  clearTimeout(showShareToast._t);
  showShareToast._t = setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => { toast.hidden = true; }, 300);
  }, 2200);
}