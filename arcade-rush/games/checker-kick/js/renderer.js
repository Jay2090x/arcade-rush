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
    this.layout();
  }

  layout() {
    const w = this.w;
    const h = this.h;
    this.pitchTop = h * 0.24;
    this.pitchBottom = h * 0.92;
    this.goal = {
      x: w * 0.5,
      y: this.pitchTop + 10,
      w: w * 0.62,
      h: h * 0.2,
    };
    this.spot = { x: w * 0.5, y: h * 0.78 };
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

  drawCheckerBand(y, height) {
    this.drawCheckerRect(0, y, this.w, height, CONFIG.CHECKER_CELL);
  }

  drawCrowdBanners() {
    const ctx = this.ctx;
    const bandH = 18;
    const y = this.pitchTop - bandH;
    this.drawCheckerRect(0, y, this.w, bandH, 14);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, y + bandH - 2, this.w, 2);
  }

  drawPitch() {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0, this.pitchTop, 0, this.pitchBottom);
    g.addColorStop(0, '#2e7d32');
    g.addColorStop(1, '#1b5e20');
    ctx.fillStyle = g;
    ctx.fillRect(0, this.pitchTop, this.w, this.pitchBottom - this.pitchTop);

    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.w * 0.08, this.pitchTop + 4, this.w * 0.84, this.pitchBottom - this.pitchTop - 8);

    ctx.beginPath();
    ctx.arc(this.w * 0.5, this.pitchBottom - (this.pitchBottom - this.pitchTop) * 0.35, 40, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(this.spot.x, this.spot.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fill();
  }

  drawGoal(goal) {
    const ctx = this.ctx;
    const gx = goal.x - goal.w / 2;
    const gy = goal.y;

    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(gx + 6, gy + 6, goal.w, goal.h);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 5;
    ctx.strokeRect(gx, gy, goal.w, goal.h);

    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    const cols = 6;
    const rows = 3;
    for (let i = 1; i < cols; i++) {
      const x = gx + (goal.w / cols) * i;
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x, gy + goal.h);
      ctx.stroke();
    }
    for (let i = 1; i < rows; i++) {
      const y = gy + (goal.h / rows) * i;
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx + goal.w, y);
      ctx.stroke();
    }
  }

  drawKeeper(keeper) {
    const ctx = this.ctx;
    const x = keeper.x;
    const y = keeper.y;
    const dive = keeper.dive || 0;
    const tilt = keeper.tilt || 0;
    const w = CONFIG.KEEPER_W;
    const h = CONFIG.KEEPER_H;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt * 0.85);

    const armSpan = w * (0.55 + dive * 0.55);
    const glove = 11 + dive * 4;

    ctx.fillStyle = '#0D47A1';
    ctx.fillRect(-armSpan, -h * 0.42, armSpan * 2, h * 0.55);

    ctx.fillStyle = '#1565C0';
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.05, w * 0.22, h * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFCC80';
    ctx.beginPath();
    ctx.arc(0, -h * 0.38, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#5D4037';
    ctx.fillRect(-10, -h * 0.5, 20, 8);

    ctx.fillStyle = '#FFE082';
    ctx.beginPath();
    ctx.arc(-armSpan + 4, -h * 0.18, glove, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(armSpan - 4, -h * 0.18, glove, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#0D47A1';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-w * 0.12, -h * 0.1);
    ctx.lineTo(-armSpan + 2, -h * 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.12, -h * 0.1);
    ctx.lineTo(armSpan - 2, -h * 0.2);
    ctx.stroke();

    ctx.fillStyle = '#1A237E';
    ctx.fillRect(-w * 0.16, h * 0.08, w * 0.14, h * 0.22);
    ctx.fillRect(w * 0.02, h * 0.08, w * 0.14, h * 0.22);

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 9px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TW', 0, -h * 0.02);

    ctx.restore();
  }

  drawKicker(spot, phase) {
    if (phase !== 'aim' && phase !== 'ready') return;
    const ctx = this.ctx;
    const x = spot.x;
    const y = spot.y + 28;

    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = '#1B5E20';
    ctx.fillRect(-9, 8, 7, 16);
    ctx.fillRect(2, 8, 7, 16);

    ctx.fillStyle = '#C8102E';
    ctx.fillRect(-14, -10, 28, 20);
    ctx.save();
    ctx.beginPath();
    ctx.rect(-14, -10, 28, 20);
    ctx.clip();
    this.drawCheckerRect(-14, -10, 28, 20, 7);
    ctx.restore();

    ctx.fillStyle = '#FFCC80';
    ctx.beginPath();
    ctx.arc(0, -18, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4E342E';
    ctx.fillRect(-8, -26, 16, 7);

    ctx.restore();
  }

  drawBall(ball) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.spin || 0);

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, CONFIG.BALL_R, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, CONFIG.BALL_R * 0.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-CONFIG.BALL_R, 0);
    ctx.lineTo(CONFIG.BALL_R, 0);
    ctx.stroke();

    ctx.restore();
  }

  drawChallenge(state) {
    if (state.phase !== 'aim' && state.phase !== 'shoot') return;
    const ctx = this.ctx;
    const left = CONFIG.CHALLENGE_GOALS - (state.score || 0);
    const text = left > 0
      ? `Schaffst du ${CONFIG.CHALLENGE_GOALS}? 🇭🇷`
      : `Weiter! Rekord jagen!`;

    const boxW = Math.min(this.w * 0.72, 260);
    const boxX = (this.w - boxW) / 2;
    const boxY = this.pitchTop + this.goal.h + 14;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(boxX, boxY, boxW, 28);

    ctx.fillStyle = '#fff';
    ctx.font = '700 13px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, this.w / 2, boxY + 18);
  }

  drawAimUI(state) {
    if (state.phase !== 'aim') return;
    const ctx = this.ctx;
    const goal = this.goal;
    const tx = goal.x + state.aimH * goal.w * 0.38;
    const ty = goal.y + goal.h * (0.18 + state.aimV * 0.62);

    ctx.strokeStyle = 'rgba(255, 235, 59, 0.9)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(this.spot.x, this.spot.y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(255, 235, 59, 0.85)';
    ctx.beginPath();
    ctx.arc(tx, ty, 8, 0, Math.PI * 2);
    ctx.fill();

    const barW = this.w * 0.55;
    const barX = (this.w - barW) / 2;
    const barY = this.h * 0.9;

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(barX, barY, barW, 10);

    const px = barX + ((state.aimH + 1) / 2) * barW;
    ctx.fillStyle = '#C8102E';
    ctx.beginPath();
    ctx.arc(px, barY + 5, 7, 0, Math.PI * 2);
    ctx.fill();

    const pBarX = this.w - 28;
    const pBarY = this.h * 0.55;
    const pBarH = this.h * 0.28;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(pBarX, pBarY, 12, pBarH);

    const fillH = state.power * pBarH;
    const grad = ctx.createLinearGradient(0, pBarY + pBarH, 0, pBarY);
    grad.addColorStop(0, '#4CAF50');
    grad.addColorStop(0.6, '#FFEB3B');
    grad.addColorStop(1, '#C8102E');
    ctx.fillStyle = grad;
    ctx.fillRect(pBarX + 2, pBarY + pBarH - fillH + 2, 8, Math.max(0, fillH - 4));

    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '600 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Richtung', this.w / 2, barY - 8);
    ctx.save();
    ctx.translate(pBarX - 10, pBarY + pBarH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Kraft', 0, 0);
    ctx.restore();
  }

  drawPopups(popups) {
    const ctx = this.ctx;
    for (const p of popups) {
      const a = p.life / p.maxLife;
      ctx.globalAlpha = a;
      ctx.font = `bold ${16 + p.big * 8}px Outfit, sans-serif`;
      ctx.fillStyle = p.color;
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 3;
      ctx.strokeText(p.text, p.x, p.y - (1 - a) * 28);
      ctx.fillText(p.text, p.x, p.y - (1 - a) * 28);
      ctx.globalAlpha = 1;
    }
  }

  drawResultFlash(state) {
    if (!state.flash) return;
    const ctx = this.ctx;
    const a = state.flash * 0.35;
    ctx.fillStyle = state.flashColor || `rgba(255,255,255,${a})`;
    ctx.fillRect(0, 0, this.w, this.h);
  }

  render(state) {
    this.time += 0.016;
    const ctx = this.ctx;

    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, this.w, this.h);

    this.drawCheckerBand(0, this.pitchTop);
    this.drawCrowdBanners();
    this.drawPitch();
    this.drawGoal(this.goal);
    this.drawKeeper(state.keeper);
    this.drawKicker(this.spot, state.phase);
    this.drawBall(state.ball);
    this.drawChallenge(state);
    this.drawAimUI(state);
    this.drawPopups(state.popups || []);
    this.drawResultFlash(state);

    this.particles.update(0.016);
    this.particles.draw(ctx);
  }
}