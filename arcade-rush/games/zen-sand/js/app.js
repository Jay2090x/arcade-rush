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
  let loopId = 0;
  let playing = false;
  let armAngle = -Math.PI / 2;
  let lastFrame = 0;

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

  function startLoop() {
    if (loopId) return;
    loopId = requestAnimationFrame(loop);
  }

  function stopLoop() {
    if (!playing && !dirty) {
      cancelAnimationFrame(loopId);
      loopId = 0;
    }
  }

  function markDirty() {
    dirty = true;
    startLoop();
  }

  function updatePlay(now) {
    const t = now || performance.now();
    const dt = lastFrame ? Math.min(40, t - lastFrame) : 16;
    lastFrame = t;
    armAngle += ZenConfig.PLAY.speed * (dt / 16);
    const c = engine.center();
    engine.sweepArm(c.x, c.y, armAngle);
    if (Math.random() < 0.15) ZenAudio.brush(0.3);
    renderer.setArm(armAngle, true);
  }

  function loop(now) {
    loopId = requestAnimationFrame(loop);

    if (playing) updatePlay(now);
    if (playing || dirty) {
      renderer.render(engine);
      if (last && drawing && !playing) {
        renderer.drawCursor(last.sx, last.sy, tool, true);
      }
      dirty = false;
    }

    if (!playing && !dirty) {
      cancelAnimationFrame(loopId);
      loopId = 0;
    }
  }

  function setPlaying(on) {
    playing = on;
    btnPlay.classList.toggle('playing', on);
    btnPlay.setAttribute('aria-pressed', on ? 'true' : 'false');
    btnPlay.querySelector('.play-label').textContent = ZenI18n.t(on ? 'play_pause' : 'play_start');
    renderer.setArm(armAngle, on);
    canvas.classList.toggle('is-playing', on);

    ZenAudio.ensure();
    if (ZenAudio.ctx?.state === 'suspended') ZenAudio.ctx.resume();
    if (on) {
      ZenAudio.setPlaying(true);
      lastFrame = 0;
      startLoop();
    } else {
      markDirty();
    }
  }

  function onPlayTap(e) {
    e.preventDefault();
    e.stopPropagation();
    dismissIntro();
    ZenAudio.ensure();
    if (ZenAudio.ctx?.state === 'suspended') ZenAudio.ctx.resume();
    setPlaying(!playing);
  }

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
    if (tool === 'pile' && p.inside) {
      engine.pileAt(p.x, p.y);
    }
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

  btnPlay.addEventListener('click', onPlayTap);

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
  startLoop();

  if (window.ArcadeAnalytics) {
    ArcadeAnalytics.track('game_start', { game: 'zen-sand' });
  }
})();