(function () {
  const canvas = document.getElementById('sand-canvas');
  const engine = new SandEngine();
  const renderer = new SandRenderer(canvas);
  const intro = document.getElementById('intro');
  const btnDismiss = document.getElementById('btn-dismiss');
  const btnSound = document.getElementById('btn-sound');
  const btnPlay = document.getElementById('btn-play');
  const toolBtns = [...document.querySelectorAll('[data-tool]')];

  let tool = 'pile';
  let drawing = false;
  let last = null;
  let dirty = true;
  let animId = 0;
  let autoSpin = false;
  let armAngle = -Math.PI / 2;
  let prevArmAngle = armAngle;
  let lastFrame = 0;
  let spinAccum = 0;
  let dragStick = false;

  ZenAudio.init();
  ZenI18n.apply();
  setTool('pile');

  function dismissIntro() {
    intro.classList.add('hidden');
    try { sessionStorage.setItem('zen_sand_intro', '1'); } catch (_) {}
  }

  function setTool(next) {
    if (autoSpin) return;
    tool = next;
    toolBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tool === tool));
  }

  function render() {
    renderer.setArm(armAngle, true);
    renderer.render(engine);
    if (last && drawing && !autoSpin) renderer.drawCursor(last.sx, last.sy, tool, true);
    dirty = false;
  }

  function requestRender() {
    dirty = true;
  }

  function spinnerStep() {
    const c = engine.center();
    engine.spinnerStep(c.x, c.y, armAngle, prevArmAngle);
    prevArmAngle = armAngle;
    if (Math.random() < 0.14) ZenAudio.brush(0.3);
  }

  function tick(now) {
    animId = requestAnimationFrame(tick);
    const t = now || performance.now();

    if (autoSpin) {
      const dt = lastFrame ? Math.min(48, t - lastFrame) : 16;
      const step = ZenConfig.SPINNER.autoSpeed * (dt / 16);
      prevArmAngle = armAngle;
      armAngle += step;
      spinAccum += Math.abs(step);
      spinnerStep();

      if (spinAccum >= Math.PI * 2) {
        spinAccum = 0;
        const c = engine.center();
        engine.drawConcentricRings(c.x, c.y);
      }
      render();
    } else if (dirty) {
      render();
    }

    lastFrame = t;
  }

  function ensureAnim() {
    if (!animId) animId = requestAnimationFrame(tick);
  }

  function setAutoSpin(on) {
    autoSpin = on;
    btnPlay.classList.toggle('playing', on);
    btnPlay.setAttribute('aria-pressed', on ? 'true' : 'false');
    btnPlay.querySelector('.play-label').textContent = ZenI18n.t(on ? 'play_pause' : 'play_start');
    canvas.classList.toggle('is-playing', on);

    try {
      ZenAudio.ensure();
      if (ZenAudio.ctx?.state === 'suspended') ZenAudio.ctx.resume();
      if (on) ZenAudio.setPlaying(true);
    } catch (_) {}

    if (on) {
      lastFrame = 0;
      spinAccum = 0;
      prevArmAngle = armAngle;
      ensureAnim();
    } else {
      requestRender();
      ensureAnim();
    }
  }

  function togglePlay(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    dismissIntro();
    setAutoSpin(!autoSpin);
    return false;
  }

  window.zenTogglePlay = togglePlay;

  function pointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    return { sx, sy, ...engine.screenToGrid(sx, sy, rect.width, rect.height, renderer.tray) };
  }

  function angleFromPointer(p) {
    const tray = renderer.tray;
    return Math.atan2(p.sy - tray.cy, p.sx - tray.cx);
  }

  function onStickLine(p, threshold = 16) {
    const tray = renderer.tray;
    const rx = p.sx - tray.cx;
    const ry = p.sy - tray.cy;
    const dist = Math.hypot(rx, ry);
    if (dist < 10 || dist > tray.radius * 0.98) return false;
    const ang = Math.atan2(ry, rx);
    let da = ang - armAngle;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    const perp = dist * Math.abs(Math.sin(da));
    return perp < threshold;
  }

  function onDown(e) {
    if (autoSpin) return;
    e.preventDefault();
    ZenAudio.ensure();
    const p = pointerPos(e);

    if (tool === 'spin' || onStickLine(p)) {
      dragStick = true;
      prevArmAngle = armAngle;
      armAngle = angleFromPointer(p);
      spinnerStep();
      requestRender();
      ensureAnim();
      return;
    }

    if (!p.inside) return;
    drawing = true;
    last = p;

    if (tool === 'reset') {
      engine.reset();
      armAngle = -Math.PI / 2;
      prevArmAngle = armAngle;
      requestRender();
      ensureAnim();
      drawing = false;
      return;
    }
    if (tool === 'pile') engine.pileAt(p.x, p.y);
    requestRender();
    ensureAnim();
  }

  function onMove(e) {
    e.preventDefault();
    const p = pointerPos(e);

    if (dragStick) {
      prevArmAngle = armAngle;
      armAngle = angleFromPointer(p);
      spinnerStep();
      requestRender();
      ensureAnim();
      return;
    }

    if (autoSpin || !drawing) return;

    if (!last) {
      last = p;
      return;
    }

    if (tool === 'pile' && p.inside) {
      engine.pileStroke(last.x, last.y, p.x, p.y);
    } else if (tool === 'rake' && p.inside && last.inside) {
      engine.rakeSegment(last.x, last.y, p.x, p.y, ZenConfig.RAKE.strength, ZenConfig.RAKE.tineSpacing, ZenConfig.RAKE.tineCount);
      if (Math.hypot(p.x - last.x, p.y - last.y) > 0.5) ZenAudio.brush(0.2);
    }

    last = p;
    requestRender();
    ensureAnim();
  }

  function onUp() {
    dragStick = false;
    if (autoSpin) return;
    drawing = false;
    last = null;
    requestRender();
  }

  function resize() {
    renderer.resize(window.innerWidth, window.innerHeight);
    requestRender();
    ensureAnim();
  }

  toolBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setTool(btn.dataset.tool);
    });
  });

  btnDismiss.addEventListener('click', dismissIntro);
  if (sessionStorage.getItem('zen_sand_intro') === '1') intro.classList.add('hidden');

  btnSound.addEventListener('click', (e) => {
    e.stopPropagation();
    const on = ZenAudio.toggle();
    btnSound.textContent = on ? '🔊' : '🔇';
  });
  btnSound.textContent = ZenAudio.enabled ? '🔊' : '🔇';

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  window.addEventListener('resize', resize);
  resize();
  ensureAnim();

  if (window.ArcadeAnalytics) {
    ArcadeAnalytics.track('game_start', { game: 'zen-sand' });
  }

  window.__zenState = () => ({
    autoSpin,
    armAngle,
    maxH: Math.max(...engine.heights),
  });
})();