/** Height-field sand — concentric circle spinner like kinetic sand tray */
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
    return nx * nx + ny * ny <= 0.97;
  }

  _seedNoise() {
    for (let i = 0; i < this.noise.length; i++) {
      this.noise[i] = (Math.random() - 0.5) * 0.03;
    }
  }

  center() {
    const m = (this.size - 1) * 0.5;
    return { x: m, y: m };
  }

  reset() {
    this.heights.fill(0);
    const c = this.center();
    this.drawConcentricRings(c.x, c.y);
  }

  drawConcentricRings(cx, cy) {
    const cfg = ZenConfig.RINGS;
    const s = this.size;
    const mid = (s - 1) * 0.5;
    const maxRadius = cfg.maxRadius * s * 0.5;
    for (let r = cfg.spacing; r < maxRadius; r += cfg.spacing) {
      const steps = Math.max(64, Math.ceil(r * 0.7));
      let px = null;
      let py = null;
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (px != null) {
          this.rakeSegment(px, py, x, y, cfg.strength, 0.4, 3);
        }
        px = x;
        py = y;
      }
    }
    this._verticalDivider(mid, cfg.strength * 0.65);
  }

  _verticalDivider(x, strength) {
    const s = this.size;
    this.rakeSegment(x, s * 0.06, x, s * 0.94, strength, 0.3, 1);
  }

  rakeSegment(x0, y0, x1, y1, strength, tineSpacing, tineCount) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy);
    if (len < 0.15) return;
    const steps = Math.max(2, Math.ceil(len * 2));
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
        const wave = Math.sin(along * 1.5) * 0.2;
        const falloff = 1 - Math.sqrt(d2) / r;
        this.heights[this.idx(x, y)] -= strength * falloff * (0.8 + wave);
      }
    }
  }

  pileStroke(x0, y0, x1, y1) {
    const cfg = ZenConfig.PILE;
    const len = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.ceil(len / 2.5));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      this.pileAt(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, cfg.dragStrength, cfg.dragRadius);
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
        const peak = Math.pow(Math.max(0, falloff), 1.2);
        const i = this.idx(x, y);
        this.heights[i] += strength * peak;
        this.heights[i] = Math.min(this.heights[i], 18);
      }
    }
  }

  smooth(passes = 1, mix = 0.38) {
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
    this.drawConcentricRings(cx, cy);
  }

  _normAngle(a) {
    let x = a;
    while (x <= -Math.PI) x += Math.PI * 2;
    while (x > Math.PI) x -= Math.PI * 2;
    return x;
  }

  _angleDiff(a1, a0) {
    return this._normAngle(a1 - a0);
  }

  /**
   * Video mechanic: radial stick rotates, rake teeth cut TANGENT grooves
   * (concentric circles) and flatten piled sand in the swept wedge.
   */
  spinnerStep(cx, cy, angle, prevAngle) {
    const cfg = ZenConfig.SPINNER;
    const outerR = this.size * cfg.outerFrac;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const tx = -sin;
    const ty = cos;

    if (prevAngle != null) {
      this._flattenWedge(cx, cy, prevAngle, angle, outerR, cfg.flattenMix);
    }

    const samples = cfg.samples;
    for (let i = 0; i <= samples; i++) {
      const r = cfg.innerR + (outerR - cfg.innerR) * (i / samples);
      const px = cx + cos * r;
      const py = cy + sin * r;
      const len = cfg.tangentLen * (0.7 + 0.3 * (r / outerR));
      this.rakeSegment(
        px - tx * len, py - ty * len,
        px + tx * len, py + ty * len,
        cfg.tangentStrength, cfg.tineSpacing, cfg.tineCount
      );
    }

    this._bladeAlongArm(cx, cy, angle, cfg.innerR, outerR, cfg.bladeWidth, cfg.flattenMix);
  }

  _flattenWedge(cx, cy, a0, a1, outerR, mix) {
    const s = this.size;
    const da = this._angleDiff(a1, a0);
    const half = Math.max(Math.abs(da) * 1.35, 0.12);
    const mid = a1;

    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const nx = (x - (s - 1) * 0.5) / (s * 0.5);
        const ny = (y - (s - 1) * 0.5) / (s * 0.5);
        if (!this.inCircle(nx, ny)) continue;

        const rx = x - cx;
        const ry = y - cy;
        const dist = Math.hypot(rx, ry);
        if (dist < 2 || dist > outerR) continue;

        const cellA = Math.atan2(ry, rx);
        const diff = Math.abs(this._angleDiff(cellA, mid));
        if (diff > half) continue;

        const falloff = (1 - diff / half) * (1 - dist / outerR * 0.15);
        const i = this.idx(x, y);
        const h = this.heights[i];
        if (h > 0) {
          this.heights[i] = h * (1 - mix * falloff);
        } else if (h < -0.05) {
          this.heights[i] = h * (1 - mix * 0.15 * falloff);
        }
      }
    }
  }

  _bladeAlongArm(cx, cy, angle, innerR, outerR, width, mix) {
    const s = this.size;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const nx = (x - (s - 1) * 0.5) / (s * 0.5);
        const ny = (y - (s - 1) * 0.5) / (s * 0.5);
        if (!this.inCircle(nx, ny)) continue;

        const rx = x - cx;
        const ry = y - cy;
        const along = rx * cos + ry * sin;
        if (along < innerR || along > outerR) continue;
        const perp = Math.abs(-rx * sin + ry * cos);
        if (perp > width) continue;

        const falloff = 1 - perp / width;
        const i = this.idx(x, y);
        const h = this.heights[i];
        if (h > 0) this.heights[i] = h * (1 - mix * falloff);
      }
    }
  }

  screenToGrid(sx, sy, width, height, tray) {
    const s = this.size;
    const x = ((sx - tray.cx) / tray.radius) * (s * 0.5) + (s - 1) * 0.5;
    const y = ((sy - tray.cy) / tray.radius) * (s * 0.5) + (s - 1) * 0.5;
    const nx = (x - (s - 1) * 0.5) / (s * 0.5);
    const ny = (y - (s - 1) * 0.5) / (s * 0.5);
    return { x, y, inside: this.inCircle(nx, ny), nx, ny };
  }
}

window.SandEngine = SandEngine;