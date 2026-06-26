class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = new Particles();
    this.time = 0;
    this.resize();
    window.addEventListener('resize', () => this.resize());
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
    g.addColorStop(0, '#0d1b3d');
    g.addColorStop(0.45, '#1a3a6e');
    g.addColorStop(1, '#2e5c9a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, this.h);

    this.drawCheckerRect(0, 0, this.w, 52, 20);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, 50, this.w, 4);
  }

  drawPitch() {
    const ctx = this.ctx;
    const gy = this.groundY;
    const g = ctx.createLinearGradient(0, gy - 40, 0, this.h);
    g.addColorStop(0, '#388e3c');
    g.addColorStop(1, '#1b5e20');
    ctx.fillStyle = g;
    ctx.fillRect(0, gy - 20, this.w, this.h - gy + 20);

    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.w * 0.5, gy + 30, 50, Math.PI, 0);
    ctx.stroke();
  }

  drawChallenge(state) {
    const ctx = this.ctx;
    const left = CONFIG.CHALLENGE_SCORE - (state.score || 0);
    const text = left > 0
      ? `Schaffst du ${CONFIG.CHALLENGE_SCORE}? 🇭🇷`
      : 'Weiter — Rekord jagen!';

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(this.w * 0.14, 58, this.w * 0.72, 26);
    ctx.fillStyle = '#fff';
    ctx.font = '700 13px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, this.w / 2, 76);
  }

  drawPlayer(player) {
    const ctx = this.ctx;
    const x = player.x;
    const y = player.y;
    const nod = player.nod || 0;
    const headY = y - 28 - nod * 12;

    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = '#1B5E20';
    ctx.fillRect(-10, -4, 8, 18);
    ctx.fillRect(2, -4, 8, 18);

    ctx.fillStyle = '#C8102E';
    ctx.fillRect(-16, -38, 32, 34);
    ctx.save();
    ctx.beginPath();
    ctx.rect(-16, -38, 32, 34);
    ctx.clip();
    this.drawCheckerRect(-16, -38, 32, 34, 8);
    ctx.restore();

    ctx.fillStyle = '#FFCC80';
    ctx.beginPath();
    ctx.arc(0, headY - y, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4E342E';
    ctx.fillRect(-11, headY - y - 22, 22, 9);

    ctx.restore();
  }

  drawBall(ball) {
    const ctx = this.ctx;
    const r = CONFIG.BALL_R;
    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.spin || 0);

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();
    this.drawCheckerRect(-r, -r, r * 2, r * 2, CONFIG.CHECKER_CELL);

    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
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
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '600 11px Outfit, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Wind ${dir}`, this.w - 16, 100);
  }

  drawPopups(popups) {
    const ctx = this.ctx;
    for (const p of popups) {
      const a = p.life / p.maxLife;
      ctx.globalAlpha = a;
      ctx.font = `bold ${14 + p.big * 8}px Outfit, sans-serif`;
      ctx.fillStyle = p.color;
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 3;
      ctx.strokeText(p.text, p.x, p.y - (1 - a) * 26);
      ctx.fillText(p.text, p.x, p.y - (1 - a) * 26);
      ctx.globalAlpha = 1;
    }
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
    this.drawChallenge(state);
    this.drawWind(state);
    this.drawPlayer(state.player);
    this.drawBall(state.ball);
    this.drawPopups(state.popups || []);

    ctx.restore();

    this.particles.update(0.016);
    this.particles.draw(ctx);
  }
}