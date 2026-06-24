class ParticleSystem {
  constructor() {
    this.particles = [];
    this.enabled = true;
  }

  emit(x, y, opts = {}) {
    if (!this.enabled) return;
    const count = opts.count || 8;
    const color = opts.color || '#FFD700';
    const spread = opts.spread || 60;
    const speed = opts.speed || 3;
    const size = opts.size || 4;
    const life = opts.life || 1;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const vel = speed * (0.5 + Math.random() * 0.5);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel - 2,
        size: size * (0.5 + Math.random()),
        color,
        life,
        maxLife: life,
        gravity: 0.15,
        type: opts.type || 'circle',
      });
    }
  }

  emitSparkle(x, y) {
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 1,
        vy: -1 - Math.random() * 2,
        size: 2 + Math.random() * 2,
        color: '#FFE566',
        life: 0.8 + Math.random() * 0.4,
        maxLife: 1.2,
        gravity: 0,
        type: 'star',
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'star') {
        ctx.beginPath();
        const s = p.size;
        ctx.moveTo(p.x, p.y - s);
        ctx.lineTo(p.x + s * 0.3, p.y - s * 0.3);
        ctx.lineTo(p.x + s, p.y);
        ctx.lineTo(p.x + s * 0.3, p.y + s * 0.3);
        ctx.lineTo(p.x, p.y + s);
        ctx.lineTo(p.x - s * 0.3, p.y + s * 0.3);
        ctx.lineTo(p.x - s, p.y);
        ctx.lineTo(p.x - s * 0.3, p.y - s * 0.3);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  setEnabled(val) {
    this.enabled = val;
    if (!val) this.particles = [];
  }
}