class Particles {
  constructor() {
    this.list = [];
  }

  burst(x, y, opts = {}) {
    const n = opts.count || 12;
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.5;
      const s = (opts.speed || 3) * (0.5 + Math.random());
      this.list.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: opts.life || 0.6,
        max: opts.life || 0.6,
        size: (opts.size || 4) * (0.5 + Math.random()),
        color: opts.color || '#FFD700',
        type: opts.type || 'circle',
      });
    }
  }

  trail(x, y) {
    this.list.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y + (Math.random() - 0.5) * 6,
      vx: -1 - Math.random(),
      vy: (Math.random() - 0.5) * 0.5,
      life: 0.4,
      max: 0.4,
      size: 2 + Math.random() * 2,
      color: 'rgba(255,255,255,0.6)',
      type: 'circle',
    });
  }

  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
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