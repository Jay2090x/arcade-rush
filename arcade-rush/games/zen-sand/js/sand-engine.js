/** Height-field sand simulation for zen raking */
class SandEngine {
  constructor(size = ZenConfig.GRID) {
    this.size = size;
    this.heights = new Float32Array(size * size);
    this.noise = new Float32Array(size * size);
    this._seedNoise();
    this.reset();
  }

  idx(x, y) {
    const s = this.size;
    x = Math.max(0, Math.min(s - 1, x | 0));
    y = Math.max(0, Math.min(s - 1, y | 0));
    return y * s + x;
  }

  inCircle(nx, ny) {
    const d = nx * nx + ny * ny;
    return d <= 0.96;
  }

  _seedNoise() {
    for (let i = 0; i < this.noise.length; i++) {
      this.noise[i] = (Math.random() - 0.5) * 0.04;
    }
  }

  reset() {
    this.heights.fill(0);
    this.drawConcentricRings(0, 0, ZenConfig.RINGS.spacing, ZenConfig.RINGS.strength, ZenConfig.RINGS.maxRadius);
  }

  drawConcentricRings(cx, cy, spacing, strength, maxR) {
    const s = this.size;
    const mid = (s - 1) * 0.5;
    const maxRadius = maxR * s * 0.5;
    for (let r = spacing; r < maxRadius; r += spacing) {
      const steps = Math.max(48, Math.ceil(r * 0.55));
      let px = null;
      let py = null;
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (px != null) this.rakeSegment(px, py, x, y, strength * 0.85, 0.45, 3);
        px = x;
        py = y;
      }
    }
    this._verticalDivider(mid, strength * 0.7);
  }

  _verticalDivider(x, strength) {
    const s = this.size;
    const y0 = s * 0.08;
    const y1 = s * 0.92;
    this.rakeSegment(x, y0, x, y1, strength, 0.35, 1);
  }

  rakeSegment(x0, y0, x1, y1, strength, tineSpacing, tineCount) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy);
    if (len < 0.2) return;
    const steps = Math.max(2, Math.ceil(len * 1.8));
    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy;
    const ny = ux;

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const cx = x0 + dx * t;
      const cy = y0 + dy * t;
      for (let k = -tineCount; k <= tineCount; k++) {
        this._stampTine(cx + nx * k * tineSpacing, cy + ny * k * tineSpacing, ux, uy, strength);
      }
    }
  }

  _stampTine(cx, cy, gx, gy, strength) {
    const s = this.size;
    const r = ZenConfig.RAKE.width;
    const r2 = r * r;
    const ix = Math.round(cx);
    const iy = Math.round(cy);
    const minX = Math.max(0, ix - Math.ceil(r));
    const maxX = Math.min(s - 1, ix + Math.ceil(r));
    const minY = Math.max(0, iy - Math.ceil(r));
    const maxY = Math.min(s - 1, iy + Math.ceil(r));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const nx = (x - (s - 1) * 0.5) / (s * 0.5);
        const ny = (y - (s - 1) * 0.5) / (s * 0.5);
        if (!this.inCircle(nx, ny)) continue;

        const dx = x - cx;
        const dy = y - cy;
        const d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;

        const along = dx * gx + dy * gy;
        const wave = Math.sin(along * 1.35) * 0.22;
        const falloff = 1 - Math.sqrt(d2) / r;
        const i = this.idx(x, y);
        this.heights[i] -= strength * falloff * (0.75 + wave);
      }
    }
  }

  pileAt(cx, cy, strength = ZenConfig.PILE.strength, radius = ZenConfig.PILE.radius) {
    const s = this.size;
    const r2 = radius * radius;
    const ix = Math.round(cx);
    const iy = Math.round(cy);
    const minX = Math.max(0, ix - Math.ceil(radius));
    const maxX = Math.min(s - 1, ix + Math.ceil(radius));
    const minY = Math.max(0, iy - Math.ceil(radius));
    const maxY = Math.min(s - 1, iy + Math.ceil(radius));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const nx = (x - (s - 1) * 0.5) / (s * 0.5);
        const ny = (y - (s - 1) * 0.5) / (s * 0.5);
        if (!this.inCircle(nx, ny)) continue;
        const dx = x - cx;
        const dy = y - cy;
        const d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;
        const falloff = 1 - Math.sqrt(d2) / radius;
        const i = this.idx(x, y);
        this.heights[i] += strength * falloff * falloff;
      }
    }
  }

  smooth(passes = ZenConfig.SMOOTH.passes, mix = ZenConfig.SMOOTH.mix) {
    const s = this.size;
    const tmp = new Float32Array(this.heights.length);
    for (let p = 0; p < passes; p++) {
      for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
          let sum = 0;
          let n = 0;
          for (let oy = -1; oy <= 1; oy++) {
            for (let ox = -1; ox <= 1; ox++) {
              sum += this.heights[this.idx(x + ox, y + oy)];
              n++;
            }
          }
          const i = this.idx(x, y);
          tmp[i] = this.heights[i] * (1 - mix) + (sum / n) * mix;
        }
      }
      this.heights.set(tmp);
    }
  }

  ringsAt(cx, cy) {
    this.drawConcentricRings(cx, cy, ZenConfig.RINGS.spacing, ZenConfig.RINGS.strength, ZenConfig.RINGS.maxRadius * 0.65);
  }

  screenToGrid(sx, sy, width, height, tray) {
    const s = this.size;
    const x = ((sx - tray.cx) / tray.radius) * (s * 0.5) + (s - 1) * 0.5;
    const y = ((sy - tray.cy) / tray.radius) * (s * 0.5) + (s - 1) * 0.5;
    return { x, y, inside: this.inCircle((x - (s - 1) * 0.5) / (s * 0.5), (y - (s - 1) * 0.5) / (s * 0.5)) };
  }
}

window.SandEngine = SandEngine;