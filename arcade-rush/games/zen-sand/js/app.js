(function () {
  const canvas = document.getElementById('sand-canvas');
  const engine = new SandEngine();
  const renderer = new SandRenderer(canvas);
  const intro = document.getElementById('intro');
  const btnDismiss = document.getElementById('btn-dismiss');
  const btnSound = document.getElementById('btn-sound');
  const btnPlay = document.getElementById('btn-play');
  const toolBtns = [...document.querySelectorAll('[data-tool]')];

  let tool = 'rake';
  let drawing = false;
  let last = null;
  let dirty = true;
  let idleLoop = 0;
  let playLoop = 0;
  let playing = false;
  let armAngle = -Math.PI / 2;
  let prevArmAngle = -Math.PI / 2;
  let lastPlayFrame = 0;
  let playTapLock = 0;

  ZenAudio.init();
  ZenI18n.apply();

  function dismissIntro() {
    intro.classList.add('hidden');
    try { sessionStorage.setItem('zen_sand_intro', '1'); } catch (_) {}
  }

  function setTool(next) {
    if (playing) return;
    tool = next;
    toolBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tool === tool));
  }

  function renderFrame() {
    renderer.render(engine);
    if (last && drawing && !playing) {
      renderer.drawCursor(last.sx, last.sy, tool, true);
    }
  }

  function idleTick() {
    idleLoop = 0;
    if (playing) return;
    if (!dirty) return;
    dirty = false;
    renderFrame();
  }

  function markDirty() {
    if (playing) return;
    dirty = true;
    if (!idleLoop) idleLoop = requestAnimationFrame(idleTick);
  }

  function playTick(now) {
    if (!playing) {
      playLoop = 0;
      return;
    }
    playLoop = requestAnimationFrame(playTick);

    const t = now || performance.now();
    const dt = lastPlayFrame ? Math.min(50, t - lastPlayFrame) : 16;
    lastPlayFrame = t;

    prevArmAngle = armAngle;
    armAngle += ZenConfig.PLAY.speed * (dt / 16);

    const c = engine.center();
    engine.sweepArm(c.x, c.y, armAngle, prevArmAngle);
    if (Math.random() < 0.18) ZenAudio.brush(0.35);

    renderer.setArm(armAngle, true);
    renderFrame();
  }

  function startPlayLoop() {
    if (playLoop) return;
    lastPlayFrame = 0;
    prevArmAngle = armAngle;
    playLoop = requestAnimationFrame(playTick);
  }

  function stopPlayLoop() {
    if (playLoop) cancelAnimationFrame(playLoop);
    playLoop = 0;
  }

  function setPlaying(on) {
    playing = on;
    btnPlay.classList.toggle('playing', on);
    btnPlay.setAttribute('aria-pressed', on ? 'true' : 'false');
    btnPlay.querySelector('.play-label').textContent = ZenI18n.t(on ? 'play_pause' : 'play_start');
    renderer.setArm(armAngle, on);
    canvas.classList.toggle('is-playing', on);

    try {
      ZenAudio.ensure();
      if (ZenAudio.ctx?.state === 'suspended') ZenAudio.ctx.resume();
      if (on) ZenAudio.setPlaying(true);
    } catch (_) {}

    if (on) {
      startPlayLoop();
    } else {
      stopPlayLoop();
      markDirty();
    }
  }

  function togglePlay() {
    const now = Date.now();
    if (now - playTapLock < 350) return;
    playTapLock = now;
    dismissIntro();
    setPlaying(!playing);
  }

  window.zenTogglePlay = togglePlay;

  function pointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = (e.clientX ?? e.pageX) - rect.left;
    const sy = (e.clientY ?? e.pageY) - rect.top;
    const g = engine.screenToGrid(sx, sy, rect.width, rect.height, renderer.tray);
    return { sx, sy, ...g };
  }

  function onDown(e) {
    if (playing) return;
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
    if (tool === 'pile' && p.inside) engine.pileAt(p.x, p.y);
    markDirty();
  }

  function onMove(e) {
    if (playing || !drawing || tool === 'rings' || tool === 'reset') return;
    e.preventDefault();
    const p = pointerPos(e);
    if (!last) {
      last = p;
      return;
    }

    if (tool === 'rake' && p.inside && last.inside) {
      engine.rakeSegment(last.x, last.y, p.x, p.y, ZenConfig.RAKE.strength, ZenConfig.RAKE.tineSpacing, ZenConfig.RAKE.tineCount);
      const speed = Math.hypot(p.x - last.x, p.y - last.y);
      if (speed > 0.4) ZenAudio.brush(Math.min(1, speed * 0.08));
    } else if (tool === 'pile' && p.inside) {
      engine.pileStroke(last.x, last.y, p.x, p.y);
    } else if (tool === 'smooth' && p.inside) {
      engine.smooth(1, 0.22);
    }

    last = p;
    markDirty();
  }

  function onUp() {
    if (playing) return;
    if (tool === 'smooth' && drawing) engine.smooth(2, ZenConfig.SMOOTH.mix);
    drawing = false;
    last = null;
    markDirty();
  }

  function resize() {
    renderer.resize(window.innerWidth, window.innerHeight);
    markDirty();
  }

  toolBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setTool(btn.dataset.tool);
    });
  });

  btnDismiss.addEventListener('click', dismissIntro);
  if (sessionStorage.getItem('zen_sand_intro') === '1') intro.classList.add('hidden');

  btnPlay.addEventListener('pointerup', (e) => {
    e.preventDefault();
    e.stopPropagation();
    togglePlay();
  }, { passive: false });

  btnSound.addEventListener('click', (e) => {
    e.stopPropagation();
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