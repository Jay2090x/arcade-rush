const ADMIN_KEY = 'arcade_admin_unlock';
const ADMIN_TAPS = 5;
const ADMIN_WINDOW_MS = 2500;
const SHARE_URL = 'https://arcade-rush.netlify.app/';

document.addEventListener('DOMContentLoaded', () => {
  HubI18n.init();
  ArcadeAnalytics.init();
  initShare();

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

  const shareBtn = document.getElementById('btn-share');
  if (shareBtn) {
    shareBtn.addEventListener('click', (e) => {
      e.preventDefault();
      shareSite();
    });
  }

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

function initShare() {
  const modal = document.getElementById('share-modal');
  const input = document.getElementById('share-url-input');
  const wa = document.getElementById('share-whatsapp');
  if (!modal || !input) return;

  input.value = SHARE_URL;
  updateWhatsAppLink();

  document.getElementById('share-modal-backdrop')?.addEventListener('click', closeShareModal);
  document.getElementById('share-close')?.addEventListener('click', closeShareModal);
  document.getElementById('share-copy')?.addEventListener('click', () => {
    input.focus();
    input.select();
    input.setSelectionRange(0, SHARE_URL.length);
    const ok = copySync(SHARE_URL);
    showShareToast(ok ? HubI18n.t('share_copied') : HubI18n.t('share_failed'));
  });
}

function updateWhatsAppLink() {
  const wa = document.getElementById('share-whatsapp');
  if (!wa) return;
  const msg = `${HubI18n.t('share_text')} ${SHARE_URL}`;
  wa.href = `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

function shareSite() {
  const url = SHARE_URL;
  const data = { url };

  if (navigator.share) {
    const payload = navigator.canShare?.(data) ? data : { title: 'Arcade Rush', url };
    navigator.share(payload).catch((err) => {
      if (err?.name !== 'AbortError') openShareModal();
    });
    return;
  }

  openShareModal();
}

function openShareModal() {
  updateWhatsAppLink();
  const modal = document.getElementById('share-modal');
  const input = document.getElementById('share-url-input');
  if (!modal) return;
  modal.hidden = false;
  requestAnimationFrame(() => {
    modal.classList.add('visible');
    input?.focus();
    input?.select();
  });
}

function closeShareModal() {
  const modal = document.getElementById('share-modal');
  if (!modal) return;
  modal.classList.remove('visible');
  setTimeout(() => { modal.hidden = true; }, 250);
}

function copySync(text) {
  const input = document.getElementById('share-url-input');
  if (input) {
    input.value = text;
    input.focus();
    input.select();
    input.setSelectionRange(0, text.length);
    try {
      if (document.execCommand('copy')) return true;
    } catch (_) {}
  }

  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:50%;left:50%;width:1px;height:1px;opacity:0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (_) {}
  document.body.removeChild(ta);
  return ok;
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