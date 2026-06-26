/** Zen Rings — fresh build, video-style spinner */
const SandApp = {
  canvas: null,
  ctx: null,
  sand: null,
  arm: null,
  hub: null,
  frame: null,
  btnPlay: null,
  mode: 'sand',
  running: false,
  angle: -Math.PI / 2,
  prevAngle: -Math.PI / 2,
  spinTotal: 0,
  tray: { cx: 0, cy: 0, r: 0, left: 0, top: 0 },
  drawing: false,
  lastG: null,
  animId: 0,

  init() {
    this.canvas = document.getElementById('sand');
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.arm = document.getElementById('spinner-arm');
    this.hub = document.getElementById('spinner-hub');
    this.frame = document.getElementById('tray-frame');
    this.btnPlay = document.getElementById('btn-play');
    this.sand = new SandTray(200);

    document.querySelectorAll('.tool').forEach(btn => {
      btn.addEventListener('click', () => this.setMode(btn.dataset.mode));
    });
    document.getElementById('btn-sound').addEventListener('click', () => {
      const on = ZenAudio.toggle();
      document.getElementById('btn-sound').textContent = on ? '🔊' : '🔇';
    });

    this.canvas.addEventListener('pointerdown', e => this.onDown(e));
    this.canvas.addEventListener('pointermove', e => this.onMove(e));
    this.canvas.addEventListener('pointerup', () => this.onUp());
    this.canvas.addEventListener('pointercancel', () => this.onUp());
    window.addEventListener('resize', () => this.layout());

    ZenAudio.init();
    this.layout();
    this.draw();
    this.setArm(this.angle);
  },

  layout() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const r = Math.min(w, h) * 0.44;
    this.tray = { cx: w / 2, cy: h / 2, r, left: w / 2 - r, top: h / 2 - r };

    const size = r * 2;
    this.frame.style.width = size + 'px';
    this.frame.style.height = size + 'px';
    this.draw();
    this.setArm(this.angle);
  },

  setMode(m) {
    if (this.running && m !== 'reset') return;
    if (m === 'reset') {
      this.sand.reset();
      this.angle = -Math.PI / 2;
      this.prevAngle = this.angle;
      this.spinTotal = 0;
      this.setArm(this.angle);
      this.draw();
      return;
    }
    this.mode = m;
    document.querySelectorAll('.tool').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === m);
    });
  },

  setArm(a) {
    const deg = (a * 180 / Math.PI) + 90;
    this.arm.style.transform = `rotate(${deg}deg)`;
  },

  draw() {
    const { ctx, tray, sand } = this;
    const { left, top, r } = tray;
    ctx.fillStyle = '#111010';
    ctx.fillRect(0, 0, tray.cx * 2, tray.cy * 2);

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 10;
    ctx.beginPath();
    ctx.arc(tray.cx, tray.cy, r + 6, 0, Math.PI * 2);
    ctx.fillStyle = '#1c1a18';
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(tray.cx, tray.cy, r + 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#2a2622';
    ctx.lineWidth = 8;
    ctx.stroke();

    const off = document.createElement('canvas');
    const oc = off.getContext('2d');
    sand.draw(oc, tray);
    ctx.save();
    ctx.beginPath();
    ctx.arc(tray.cx, tray.cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(off, left, top, r * 2, r * 2);
    ctx.restore();
  },

  pointer(e) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    return { sx, sy, ...this.sand.screenToGrid(sx, sy, this.tray) };
  },

  onDown(e) {
    if (this.running) return;
    e.preventDefault();
    ZenAudio.ensure();
    const p = this.pointer(e);

    if (this.mode === 'stick' || this.hitStick(p)) {
      this.drawing = true;
      this.prevAngle = this.angle;
      this.angle = Math.atan2(p.sy - this.tray.cy, p.sx - this.tray.cx);
      this.sand.spin(this.angle, this.prevAngle);
      this.setArm(this.angle);
      this.draw();
      return;
    }

    if (!p.ok) return;
    this.drawing = true;
    this.lastG = p;
    if (this.mode === 'sand') this.sand.pile(p.x, p.y);
    this.draw();
  },

  onMove(e) {
    if (!this.drawing || this.running) return;
    e.preventDefault();
    const p = this.pointer(e);

    if (this.mode === 'stick' || this.hitStick(p)) {
      this.prevAngle = this.angle;
      this.angle = Math.atan2(p.sy - this.tray.cy, p.sx - this.tray.cx);
      this.sand.spin(this.angle, this.prevAngle);
      this.setArm(this.angle);
      this.draw();
      return;
    }

    if (!this.lastG || !p.ok) return;
    if (this.mode === 'sand') this.sand.pileLine(this.lastG.x, this.lastG.y, p.x, p.y);
    this.lastG = p;
    this.draw();
  },

  onUp() {
    this.drawing = false;
    this.lastG = null;
  },

  hitStick(p) {
    if (this.mode === 'sand') return false;
    const rx = p.sx - this.tray.cx;
    const ry = p.sy - this.tray.cy;
    const dist = Math.hypot(rx, ry);
    if (dist < 12 || dist > this.tray.r * 0.98) return false;
    const ang = Math.atan2(ry, rx);
    let da = ang - this.angle;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    return dist * Math.abs(Math.sin(da)) < 18;
  },

  tick() {
    if (!this.running) return;

    this.prevAngle = this.angle;
    this.angle += 0.04;
    this.spinTotal += 0.04;
    this.sand.spin(this.angle, this.prevAngle);
    this.setArm(this.angle);

    if (this.spinTotal >= Math.PI * 2) {
      this.spinTotal = 0;
      this.sand._rings(this.sand.cx, this.sand.cy);
    }

    if (Math.random() < 0.12) ZenAudio.brush(0.25);
    this.draw();
  },

  startSpin() {
    if (this.running) return;
    this.running = true;
    this.btnPlay.textContent = '⏸ Pause';
    this.btnPlay.classList.add('running');
    document.getElementById('hint').textContent = 'Stab dreht… Hügel werden glatt gestrichen';
    ZenAudio.ensure();
    ZenAudio.startMusic();

    const loop = () => {
      if (!this.running) {
        this.animId = 0;
        return;
      }
      this.tick();
      this.animId = requestAnimationFrame(loop);
    };
    if (!this.animId) this.animId = requestAnimationFrame(loop);
  },

  stopSpin() {
    this.running = false;
    this.btnPlay.textContent = '▶ Play';
    this.btnPlay.classList.remove('running');
    document.getElementById('hint').textContent = 'Sand aufhäufen → Play → Stab dreht Kreise wie im Video';
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = 0;
    }
    this.draw();
  },

  togglePlay(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (this.running) this.stopSpin();
    else this.startSpin();
    return false;
  },
};

window.SandApp = SandApp;
document.addEventListener('DOMContentLoaded', () => {
  SandApp.init();
  if (window.ArcadeAnalytics) {
    ArcadeAnalytics.track('game_start', { game: 'zen-sand' });
  }
});