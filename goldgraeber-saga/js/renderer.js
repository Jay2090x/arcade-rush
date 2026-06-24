class MineRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = new ParticleSystem();
    this.time = 0;
    this.veinPulse = 0;
    this.shakeAmount = 0;
    this.miners = [];
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = rect.width;
    this.h = rect.height;
    this.cx = this.w / 2;
    this.cy = this.h / 2;
  }

  setMiners(count, depthColor) {
    this.miners = [];
    const maxVisible = Math.min(count, 12);
    for (let i = 0; i < maxVisible; i++) {
      this.miners.push({
        x: 40 + (i % 4) * ((this.w - 80) / 3),
        y: this.h * 0.15 + Math.floor(i / 4) * 30,
        phase: Math.random() * Math.PI * 2,
        speed: 2 + Math.random(),
        color: depthColor,
      });
    }
  }

  shake(intensity = 4) {
    this.shakeAmount = intensity;
  }

  pulseVein() {
    this.veinPulse = 1;
  }

  emitGold(x, y, crit = false) {
    this.particles.emit(x, y, {
      count: crit ? 28 : 14,
      color: crit ? '#FFE566' : '#FFD700',
      spread: crit ? 120 : 80,
      speed: crit ? 7 : 4,
      size: crit ? 8 : 5,
      life: crit ? 1.2 : 0.8,
    });
    if (crit) {
      this.particles.emitSparkle(x, y);
      this.particles.emitSparkle(x, y);
    }
  }

  drawBackground(depth) {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, this.h);
    grad.addColorStop(0, '#1a1008');
    grad.addColorStop(0.5, '#0f0a06');
    grad.addColorStop(1, '#080504');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.w, this.h);

    ctx.fillStyle = 'rgba(255, 215, 0, 0.03)';
    for (let i = 0; i < 20; i++) {
      const sx = (Math.sin(this.time * 0.3 + i * 1.7) * 0.5 + 0.5) * this.w;
      const sy = (Math.cos(this.time * 0.2 + i * 2.3) * 0.5 + 0.5) * this.h;
      ctx.beginPath();
      ctx.arc(sx, sy, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    this.drawCaveWalls(depth);
    this.drawSupportBeams();
  }

  drawCaveWalls(depth) {
    const ctx = this.ctx;
    const color = depth?.color || '#6B5B4E';

    ctx.fillStyle = color + '40';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let y = 0; y <= this.h; y += 20) {
      const offset = Math.sin(y * 0.02 + this.time * 0.5) * 15 + Math.sin(y * 0.05) * 8;
      ctx.lineTo(offset, y);
    }
    ctx.lineTo(0, this.h);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(this.w, 0);
    for (let y = 0; y <= this.h; y += 20) {
      const offset = this.w - Math.sin(y * 0.025 + this.time * 0.4) * 15 - Math.sin(y * 0.06) * 8;
      ctx.lineTo(offset, y);
    }
    ctx.lineTo(this.w, this.h);
    ctx.closePath();
    ctx.fill();
  }

  drawSupportBeams() {
    const ctx = this.ctx;
    ctx.strokeStyle = '#4A3728';
    ctx.lineWidth = 6;
    const beamY = this.h * 0.12;
    ctx.beginPath();
    ctx.moveTo(20, beamY);
    ctx.lineTo(this.w - 20, beamY);
    ctx.stroke();

    [30, this.w - 30].forEach(x => {
      ctx.beginPath();
      ctx.moveTo(x, beamY);
      ctx.lineTo(x, beamY + 40);
      ctx.stroke();
    });
  }

  drawCrystal(ctx, x, y, w, h, angle, colors) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const g = ctx.createLinearGradient(-w / 2, -h, w / 2, h);
    g.addColorStop(0, colors[0]);
    g.addColorStop(0.5, colors[1]);
    g.addColorStop(1, colors[2]);
    ctx.beginPath();
    ctx.moveTo(0, -h);
    ctx.lineTo(w / 2, h * 0.3);
    ctx.lineTo(0, h);
    ctx.lineTo(-w / 2, h * 0.3);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = colors[3] || '#8B6914';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  drawGoldVein(hp, depth) {
    const ctx = this.ctx;
    const pulse = 1 + Math.sin(this.time * 3) * 0.04 + this.veinPulse * 0.12;
    this.veinPulse = Math.max(0, this.veinPulse - 0.05);

    const baseR = Math.min(this.w, this.h) * 0.28;
    const r = baseR * pulse;
    const depthTint = depth?.color || '#FFD700';

    const glow = ctx.createRadialGradient(this.cx, this.cy - 10, r * 0.1, this.cx, this.cy, r * 1.8);
    glow.addColorStop(0, 'rgba(255, 215, 0, 0.18)');
    glow.addColorStop(0.4, 'rgba(255, 150, 0, 0.06)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, this.w, this.h);

    ctx.save();
    ctx.translate(this.cx, this.cy + r * 0.15);

    ctx.fillStyle = '#3d2e1e';
    ctx.beginPath();
    ctx.moveTo(-r * 0.9, r * 0.5);
    ctx.quadraticCurveTo(-r * 0.5, r * 0.9, 0, r * 0.85);
    ctx.quadraticCurveTo(r * 0.5, r * 0.9, r * 0.9, r * 0.5);
    ctx.lineTo(r * 0.7, r * 0.2);
    ctx.lineTo(-r * 0.7, r * 0.2);
    ctx.closePath();
    ctx.fill();

    const gold = ['#FFF3A0', '#FFD700', '#B8860B', '#8B6914'];
    const tint = [depthTint + 'CC', '#FFD700', '#8B6914', '#5a4a20'];
    const cols = hp > 30 ? gold : tint;

    this.drawCrystal(ctx, -r * 0.35, -r * 0.1, r * 0.35, r * 0.55, -0.25 + Math.sin(this.time) * 0.03, cols);
    this.drawCrystal(ctx, r * 0.32, -r * 0.05, r * 0.32, r * 0.5, 0.2 + Math.sin(this.time * 1.2) * 0.03, cols);
    this.drawCrystal(ctx, 0, -r * 0.25, r * 0.42, r * 0.7, Math.sin(this.time * 0.5) * 0.02, cols);

    for (let i = 0; i < 5; i++) {
      const a = this.time * 2 + i * 1.4;
      const dist = r * (0.6 + Math.sin(a) * 0.15);
      const sx = Math.cos(a) * dist;
      const sy = Math.sin(a) * dist * 0.5 - r * 0.2;
      ctx.globalAlpha = 0.4 + Math.sin(a * 2) * 0.3;
      ctx.fillStyle = '#FFE566';
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5 + Math.sin(a) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  drawMiners() {
    const ctx = this.ctx;
    for (const m of this.miners) {
      const bob = Math.sin(this.time * m.speed + m.phase) * 3;
      const swing = Math.sin(this.time * m.speed * 2 + m.phase) * 0.3;

      ctx.save();
      ctx.translate(m.x, m.y + bob);

      ctx.fillStyle = '#F4A460';
      ctx.beginPath();
      ctx.arc(0, -8, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(-8, -2);
      ctx.lineTo(8, -2);
      ctx.lineTo(0, -10);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#4169E1';
      ctx.fillRect(-5, -2, 10, 12);

      ctx.save();
      ctx.translate(6, 4);
      ctx.rotate(swing);
      ctx.strokeStyle = '#8B7355';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(10, -8);
      ctx.stroke();
      ctx.fillStyle = '#C0C0C0';
      ctx.beginPath();
      ctx.moveTo(8, -10);
      ctx.lineTo(14, -6);
      ctx.lineTo(10, -4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.restore();
    }
  }

  drawCart(gold, miners) {
    if ((miners || 0) < 1 && gold < 50) return;
    const ctx = this.ctx;
    const x = this.w * 0.75;
    const y = this.h * 0.82;
    const fillLevel = Math.min(1, Math.log10(gold) / 8);

    ctx.fillStyle = '#5C4033';
    ctx.fillRect(x - 20, y, 40, 15);
    ctx.fillRect(x - 25, y + 15, 50, 8);

    ctx.fillStyle = '#FFD700';
    ctx.globalAlpha = 0.3 + fillLevel * 0.7;
    ctx.beginPath();
    ctx.arc(x, y - 2, 8 + fillLevel * 6, Math.PI, 0);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(x - 15, y + 23, 4, 0, Math.PI * 2);
    ctx.arc(x + 15, y + 23, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  render(state) {
    const ctx = this.ctx;
    this.time += 0.016;

    let shakeX = 0, shakeY = 0;
    if (this.shakeAmount > 0) {
      shakeX = (Math.random() - 0.5) * this.shakeAmount;
      shakeY = (Math.random() - 0.5) * this.shakeAmount;
      this.shakeAmount *= 0.85;
      if (this.shakeAmount < 0.1) this.shakeAmount = 0;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    const depth = CONFIG.DEPTHS[state.depth];
    this.drawBackground(depth);
    this.drawGoldVein(state.veinHp, depth);
    this.drawMiners();
    const totalMiners = Object.values(state.miners || {}).reduce((a, b) => a + b, 0);
    this.drawCart(state.gold, totalMiners);
    this.particles.update(0.016);
    this.particles.draw(ctx);

    ctx.restore();
  }
}