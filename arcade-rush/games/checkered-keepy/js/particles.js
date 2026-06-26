class Particles {
  constructor() {
    this.list = [];
  }

  burst(x, y, opts = {}) {
    const n = opts.count || 14;
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
      const s = (opts.speed || 4) * (0.5 + Math.random());
      this.list.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: opts.life || 0.65,
        max: opts.life || 0.65,
        size: (opts.size || 5) * (0.5 + Math.random()),
        color: opts.color || '#C8102E',
      });
    }
  }

  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06;
      p.life -= dt;
      if (p.life <= 0) this.list.splice(i, 1);
    }
  }

  draw(ctx) {
    for (const p of this.list) {
      const a = p.life / p.max;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}