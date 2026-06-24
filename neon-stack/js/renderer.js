class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.time = 0;
    this.shake = 0;
    this.flash = 0;
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
    this.cx = this.w / 2;
  }

  draw(state) {
    this.time += 0.016;
    const ctx = this.ctx;
    const shakeX = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    const shakeY = this.shake ? (Math.random() - 0.5) * this.shake * 0.5 : 0;
    if (this.shake > 0) this.shake *= 0.85;
    if (this.flash > 0) this.flash *= 0.9;

    const bg = ctx.createLinearGradient(0, 0, 0, this.h);
    bg.addColorStop(0, '#0a0e27');
    bg.addColorStop(0.5, '#141b3d');
    bg.addColorStop(1, '#1a1040');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.w, this.h);

    ctx.save();
    ctx.translate(shakeX, shakeY);

    this.drawGrid(state.cameraY);

    const baseY = this.h - 80;
    ctx.fillStyle = 'rgba(108, 92, 231, 0.15)';
    ctx.fillRect(0, baseY, this.w, 80);

    for (const block of state.blocks) {
      this.drawBlock(block, state.cameraY, baseY);
    }

    if (state.moving) {
      this.drawBlock(state.moving, state.cameraY, baseY, true);
    }

    for (const p of state.particles) {
      const py = baseY - (p.y - state.cameraY) - CONFIG.BLOCK_HEIGHT / 2;
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, py, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (state.popups) {
      for (const pop of state.popups) {
        const py = baseY - (pop.y - state.cameraY);
        ctx.globalAlpha = pop.life;
        ctx.font = `bold ${pop.big ? 22 : 16}px Outfit, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = pop.color;
        ctx.fillText(pop.text, pop.x, py);
        ctx.globalAlpha = 1;
      }
    }

    ctx.restore();

    if (this.flash > 0.05) {
      ctx.fillStyle = `rgba(255,255,255,${this.flash * 0.35})`;
      ctx.fillRect(0, 0, this.w, this.h);
    }
  }

  drawGrid(cameraY) {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(108, 92, 231, 0.08)';
    ctx.lineWidth = 1;
    const offset = (cameraY * 0.3) % 40;
    for (let y = -offset; y < this.h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.w, y);
      ctx.stroke();
    }
  }

  drawBlock(block, cameraY, baseY, glow = false) {
    const ctx = this.ctx;
    const y = baseY - (block.y - cameraY) - CONFIG.BLOCK_HEIGHT;
    const x = block.x - block.w / 2;
    const h = CONFIG.BLOCK_HEIGHT;

    if (glow) {
      ctx.shadowColor = block.color;
      ctx.shadowBlur = 20;
    }

    const grad = ctx.createLinearGradient(x, y, x + block.w, y + h);
    grad.addColorStop(0, this.lighten(block.color, 30));
    grad.addColorStop(0.5, block.color);
    grad.addColorStop(1, this.darken(block.color, 20));
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, block.w, h);

    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, block.w - 2, h - 2);

    if (block.perfect) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PERFECT', block.x, y - 6);
    }

    ctx.shadowBlur = 0;
  }

  lighten(hex, pct) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, (n >> 16) + pct);
    const g = Math.min(255, ((n >> 8) & 0xff) + pct);
    const b = Math.min(255, (n & 0xff) + pct);
    return `rgb(${r},${g},${b})`;
  }

  darken(hex, pct) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, (n >> 16) - pct);
    const g = Math.max(0, ((n >> 8) & 0xff) - pct);
    const b = Math.max(0, (n & 0xff) - pct);
    return `rgb(${r},${g},${b})`;
  }

  burst(x, y, color, count = 12) {
    return Array.from({ length: count }, () => ({
      x: x + (Math.random() - 0.5) * 40,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 1,
      size: 2 + Math.random() * 4,
      color,
      life: 1,
    }));
  }
}