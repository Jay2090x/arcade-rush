class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = new Particles();
    this.time = 0;
    this.crowdDots = [];
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initCrowd();
  }

  initCrowd() {
    this.crowdDots = [];
    for (let i = 0; i < 60; i++) {
      this.crowdDots.push({
        x: Math.random(),
        y: Math.random() * 0.08,
        r: 1.5 + Math.random() * 2,
        c: Math.random() > 0.5 ? '#C8102E' : '#fff',
      });
    }
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = rect.width;
    this.h = rect.height;
    this.groundY = this.h - CONFIG.GROUND_H;
  }

  drawCheckerRect(x, y, width, height, cell) {
    const ctx = this.ctx;
    const cols = Math.ceil(width / cell);
    const rows = Math.ceil(height / cell);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const red = (row + col) % 2 === 0;
        ctx.fillStyle = red ? '#C8102E' : '#FFFFFF';
        const cx = x + col * cell;
        const cy = y + row * cell;
        const cw = Math.min(cell, x + width - cx);
        const ch = Math.min(cell, y + height - cy);
        if (cw > 0 && ch > 0) ctx.fillRect(cx, cy, cw, ch);
      }
    }
  }

  drawBackground() {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0, 0, 0, this.h);
    g.addColorStop(0, '#080f24');
    g.addColorStop(0.35, '#142d5c');
    g.addColorStop(0.7, '#1e4a82');
    g.addColorStop(1, '#2a5f9e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, this.h);

    const spot = ctx.createRadialGradient(this.w * 0.5, this.groundY - 40, 0, this.w * 0.5, this.groundY - 40, this.w * 0.7);
    spot.addColorStop(0, 'rgba(255,255,255,0.08)');
    spot.addColorStop(1, 'transparent');
    ctx.fillStyle = spot;
    ctx.fillRect(0, 0, this.w, this.h);

    this.drawCheckerRect(0, 0, this.w, 56, 20);

    for (const d of this.crowdDots) {
      ctx.globalAlpha = 0.35 + Math.sin(this.time * 2 + d.x * 10) * 0.15;
      ctx.fillStyle = d.c;
      ctx.beginPath();
      ctx.arc(d.x * this.w, 18 + d.y * 40, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, 54, this.w, 4);
  }

  drawPitch() {
    const ctx = this.ctx;
    const gy = this.groundY;
    const stripes = 10;
    const sw = this.w / stripes;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#2e7d32' : '#338a38';
      ctx.fillRect(i * sw, gy - 24, sw + 1, this.h - gy + 24);
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.w * 0.06, gy - 18, this.w * 0.88, this.h - gy + 10);
    ctx.beginPath();
    ctx.arc(this.w * 0.5, gy + 24, 56, Math.PI, 0);
    ctx.stroke();
  }

  drawPlayer(player) {
    const ctx = this.ctx;
    const s = CONFIG.PLAYER_SCALE;
    const x = player.x;
    const y = player.y;
    const nod = player.nod || 0;
    const headLift = nod * 16;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);

    const skin = '#E8B89A';
    const hair = '#5D4037';
    const hairLight = '#795548';

    ctx.fillStyle = '#111';
    ctx.fillRect(-11, 2, 9, 20);
    ctx.fillRect(2, 2, 9, 20);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-11, 14, 9, 6);
    ctx.fillRect(2, 14, 9, 6);

    ctx.fillStyle = '#C8102E';
    ctx.fillRect(-18, -42, 36, 44);
    ctx.save();
    ctx.beginPath();
    ctx.rect(-18, -42, 36, 44);
    ctx.clip();
    this.drawCheckerRect(-18, -42, 36, 44, 9);
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = 'bold 14px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('10', 0, -14);

    const hy = -52 - headLift;
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(0, hy, 15, 17, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(180,120,90,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, hy + 8, 10, 6, 0, 0, Math.PI);
    ctx.fill();

    const curls = [
      [-14, hy - 10, 7], [ -6, hy - 16, 8], [4, hy - 17, 8], [12, hy - 12, 7],
      [-12, hy - 2, 6], [-2, hy - 4, 7], [8, hy - 3, 7], [14, hy - 6, 6],
      [-8, hy + 4, 5], [6, hy + 2, 5],
    ];
    curls.forEach(([cx, cy, rad], i) => {
      ctx.fillStyle = i % 2 === 0 ? hair : hairLight;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-5, hy - 2, 2.2, 0, Math.PI * 2);
    ctx.arc(5, hy - 2, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(-5, hy - 2, 1, 0, Math.PI * 2);
    ctx.arc(5, hy - 2, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawBall(ball) {
    const ctx = this.ctx;
    const r = CONFIG.BALL_R;

    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(ball.x + 3, ball.y + r + 4, r * 0.9, r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.spin || 0);

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();
    this.drawCheckerRect(-r, -r, r * 2, r * 2, CONFIG.CHECKER_CELL);

    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r - 1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawWind(state) {
    if (!state.wind || state.wind < 0.05) return;
    const ctx = this.ctx;
    const dir = state.wind > 0 ? '→' : '←';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '600 12px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Wind ${dir}`, this.w / 2, this.h * 0.14);
  }

  drawPopups(popups) {
    const ctx = this.ctx;
    for (const p of popups) {
      const a = p.life / p.maxLife;
      const scale = 0.85 + (1 - a) * 0.35;
      ctx.save();
      ctx.translate(p.x, p.y - (1 - a) * 32);
      ctx.scale(scale, scale);
      ctx.globalAlpha = a;
      ctx.font = `bold ${18 + p.big * 10}px Outfit, sans-serif`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = 4;
      ctx.strokeText(p.text, 0, 0);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  render(state) {
    this.time += 0.016;
    const ctx = this.ctx;

    let shakeX = 0;
    let shakeY = 0;
    if (state.shake > 0) {
      shakeX = (Math.random() - 0.5) * state.shake;
      shakeY = (Math.random() - 0.5) * state.shake;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    this.drawBackground();
    this.drawPitch();
    this.drawWind(state);
    this.drawPlayer(state.player);
    this.drawBall(state.ball);
    this.drawPopups(state.popups || []);

    ctx.restore();

    this.particles.update(0.016);
    this.particles.draw(ctx);
  }
}