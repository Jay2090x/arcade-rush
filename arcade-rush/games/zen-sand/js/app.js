(function () {
  const canvas = document.getElementById('sand-canvas');
  const engine = new SandEngine();
  const renderer = new SandRenderer(canvas);
  const intro = document.getElementById('intro');
  const btnDismiss = document.getElementById('btn-dismiss');
  const btnSound = document.getElementById('btn-sound');
  const toolBtns = [...document.querySelectorAll('[data-tool]')];

  let tool = 'rake';
  let drawing = false;
  let last = null;
  let dirty = true;
  let raf = 0;
  let moveSpeed = 0;

  ZenAudio.init();
  ZenI18n.apply();

  function setTool(next) {
    tool = next;
    toolBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tool === tool));
  }

  function markDirty() {
    dirty = true;
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function tick() {
    raf = 0;
    if (!dirty) return;
    dirty = false;
    renderer.render(engine);
    if (last && drawing) renderer.drawCursor(last.sx, last.sy, tool, true);
  }

  function pointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = (e.clientX ?? e.pageX) - rect.left;
    const sy = (e.clientY ?? e.pageY) - rect.top;
    const g = engine.screenToGrid(sx, sy, rect.width, rect.height, renderer.tray);
    return { sx, sy, ...g };
  }

  function onDown(e) {
    if (e.target.closest('.ui-panel, .intro-card, a')) return;
    e.preventDefault();
    ZenAudio.ensure();
    const p = pointerPos(e);
    if (!p.inside && tool !== 'rings') return;
    drawing = true;
    last = p;

    if (tool === 'rings' && p.inside) {
      engine.ringsAt(p.x, p.y);
      ZenAudio.brush(0.7);
      markDirty();
      drawing = false;
      return;
    }
    if (tool === 'reset') {
      engine.reset();
      ZenAudio.brush(0.5);
      markDirty();
      drawing = false;
      return;
    }
    if (tool === 'pile') engine.pileAt(p.x, p.y);
    markDirty();
  }

  function onMove(e) {
    if (!drawing || tool === 'rings' || tool === 'reset') return;
    e.preventDefault();
    const p = pointerPos(e);
    if (!last) {
      last = p;
      return;
    }

    if (tool === 'rake' && p.inside && last.inside) {
      engine.rakeSegment(last.x, last.y, p.x, p.y, ZenConfig.RAKE.strength, ZenConfig.RAKE.tineSpacing, ZenConfig.RAKE.tineCount);
      const speed = Math.hypot(p.x - last.x, p.y - last.y);
      moveSpeed = speed;
      if (speed > 0.4) ZenAudio.brush(Math.min(1, speed * 0.08));
    } else if (tool === 'pile' && p.inside) {
      engine.pileAt(p.x, p.y, ZenConfig.PILE.strength * 0.35, ZenConfig.PILE.radius * 0.7);
    } else if (tool === 'smooth' && p.inside) {
      engine.smooth(1, 0.22);
    }

    last = p;
    markDirty();
  }

  function onUp() {
    if (tool === 'smooth' && drawing) engine.smooth(2, ZenConfig.SMOOTH.mix);
    drawing = false;
    last = null;
    markDirty();
  }

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.resize(w, h);
    markDirty();
  }

  toolBtns.forEach(btn => {
    btn.addEventListener('click', () => setTool(btn.dataset.tool));
  });

  btnDismiss.addEventListener('click', () => {
    intro.classList.add('hidden');
    try { sessionStorage.setItem('zen_sand_intro', '1'); } catch (_) {}
  });

  if (sessionStorage.getItem('zen_sand_intro') === '1') intro.classList.add('hidden');

  btnSound.addEventListener('click', () => {
    const on = ZenAudio.toggle();
    btnSound.textContent = on ? '🔊' : '🔇';
    btnSound.setAttribute('aria-label', ZenI18n.t(on ? 'sound_on' : 'sound_off'));
  });
  btnSound.textContent = ZenAudio.enabled ? '🔊' : '🔇';

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', onUp);

  window.addEventListener('resize', resize);
  resize();
  markDirty();

  if (window.ArcadeAnalytics) {
    ArcadeAnalytics.track('game_start', { game: 'zen-sand' });
  }
})();