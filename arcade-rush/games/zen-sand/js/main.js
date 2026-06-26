const SandApp = {
  canvas: null,
  ctx: null,
  sand: null,
  arm: null,
  btnPlay: null,
  mode: 'sand',
  running: false,
  angle: -Math.PI / 2,
  prev: -Math.PI / 2,
  spinAcc: 0,
  tray: { cx: 0, cy: 0, r: 0 },
  drawing: false,
  last: null,
  timer: null,
  sandBuf: null,
  sandCtx: null,
  playLock: 0,

  boot() {
    this.canvas = document.getElementById('sand');
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.arm = document.getElementById('spinner-arm');
    this.btnPlay = document.getElementById('btn-play');
    this.sand = new SandTray(160);

    this.sandBuf = document.createElement('canvas');
    this.sandBuf.width = this.sand.N;
    this.sandBuf.height = this.sand.N;
    this.sandCtx = this.sandBuf.getContext('2d', { alpha: false });

    document.querySelectorAll('.tool').forEach(b => {
      b.addEventListener('click', () => this.setMode(b.dataset.mode));
    });
    document.getElementById('btn-sound').onclick = () => {
      const on = ZenAudio.toggle();
      document.getElementById('btn-sound').textContent = on ? '🔊' : '🔇';
    };

    const play = (e) => { if (e) { e.preventDefault(); e.stopPropagation(); } this.togglePlay(); };
    this.btnPlay.addEventListener('click', play);
    this.btnPlay.addEventListener('touchend', play, { passive: false });

    this.canvas.onpointerdown = (e) => this.down(e);
    this.canvas.onpointermove = (e) => this.move(e);
    this.canvas.onpointerup = () => this.up();
    this.canvas.onpointercancel = () => this.up();
    window.onresize = () => this.layout();

    ZenAudio.init();
    this.layout();
    this.paint();
    this.syncArm();
  },

  layout() {
    const w = innerWidth, h = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.tray = { cx: w / 2, cy: h / 2, r: Math.min(w, h) * 0.44 };
    const frame = document.getElementById('tray-frame');
    const sz = this.tray.r * 2;
    frame.style.width = sz + 'px';
    frame.style.height = sz + 'px';
    this.paint();
    this.syncArm();
  },

  setMode(m) {
    if (m === 'reset') {
      this.stop();
      this.sand.reset();
      this.angle = this.prev = -Math.PI / 2;
      this.spinAcc = 0;
      this.syncArm();
      this.paint();
      return;
    }
    if (this.running) return;
    this.mode = m;
    document.querySelectorAll('.tool').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
  },

  syncArm() {
    const deg = this.angle * 180 / Math.PI + 90;
    this.arm.style.transform = `rotate(${deg}deg)`;
  },

  paint() {
    const { ctx, tray, sand, sandBuf, sandCtx } = this;
    const { cx, cy, r } = tray;

    ctx.fillStyle = '#111010';
    ctx.fillRect(0, 0, cx * 2, cy * 2);

    ctx.beginPath();
    ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
    ctx.strokeStyle = '#2e2a26';
    ctx.lineWidth = 10;
    ctx.stroke();

    sand.paint(sandCtx);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(sandBuf, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();

    this.drawStick(ctx, cx, cy, r, this.angle);
  },

  drawStick(ctx, cx, cy, r, a) {
    const ex = cx + Math.cos(a) * r * 0.95;
    const ey = cy + Math.sin(a) * r * 0.95;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#5a5048';
    ctx.fill();
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 2;
    ctx.stroke();

    const g = ctx.createLinearGradient(cx, cy, ex, ey);
    g.addColorStop(0, '#6a6058');
    g.addColorStop(0.4, '#c8c0b4');
    g.addColorStop(0.55, '#fff');
    g.addColorStop(1, '#7a7068');

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = g;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.restore();
  },

  pt(e) {
    const b = this.canvas.getBoundingClientRect();
    const sx = e.clientX - b.left, sy = e.clientY - b.top;
    return { sx, sy, ...this.sand.toGrid(sx, sy, this.tray) };
  },

  down(e) {
    if (this.running) return;
    e.preventDefault();
    ZenAudio.ensure();
    const p = this.pt(e);
    if (this.mode === 'stick') {
      this.drawing = true;
      this.prev = this.angle;
      this.angle = Math.atan2(p.sy - this.tray.cy, p.sx - this.tray.cx);
      this.sand.spin(this.angle, this.prev);
      this.syncArm();
      this.paint();
      return;
    }
    if (!p.ok) return;
    this.drawing = true;
    this.last = p;
    this.sand.pile(p.x, p.y);
    this.paint();
  },

  move(e) {
    if (!this.drawing || this.running) return;
    e.preventDefault();
    const p = this.pt(e);
    if (this.mode === 'stick') {
      this.prev = this.angle;
      this.angle = Math.atan2(p.sy - this.tray.cy, p.sx - this.tray.cx);
      this.sand.spin(this.angle, this.prev);
      this.syncArm();
      this.paint();
      return;
    }
    if (!this.last || !p.ok) return;
    this.sand.pileLine(this.last.x, this.last.y, p.x, p.y);
    this.last = p;
    this.paint();
  },

  up() { this.drawing = false; this.last = null; },

  step() {
    this.prev = this.angle;
    this.angle += 0.045;
    this.spinAcc += 0.045;
    this.sand.spin(this.angle, this.prev);
    this.syncArm();
    if (this.spinAcc >= Math.PI * 2) {
      this.spinAcc = 0;
      this.sand.rings(this.sand.cx, this.sand.cy);
    }
    if (Math.random() < 0.1) ZenAudio.brush(0.3);
    this.paint();
  },

  start() {
    if (this.running) return;
    this.running = true;
    this.btnPlay.textContent = '⏸ Pause';
    this.btnPlay.classList.add('running');
    document.getElementById('hint').textContent = 'Stab dreht sich…';
    ZenAudio.ensure();
    ZenAudio.startMusic();
    this.step();
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.step(), 40);
  },

  stop() {
    this.running = false;
    this.btnPlay.textContent = '▶ Play';
    this.btnPlay.classList.remove('running');
    document.getElementById('hint').textContent = 'Sand aufhäufen → Play drücken';
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.paint();
  },

  togglePlay() {
    const now = Date.now();
    if (now - this.playLock < 400) return;
    this.playLock = now;
    if (this.running) this.stop();
    else this.start();
  },
};

window.SandApp = SandApp;
window.zenTogglePlay = (e) => { SandApp.togglePlay(); return false; };

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => SandApp.boot());
} else {
  SandApp.boot();
}

if (window.ArcadeAnalytics) {
  document.addEventListener('DOMContentLoaded', () => {
    ArcadeAnalytics.track('game_start', { game: 'zen-sand' });
  });
}