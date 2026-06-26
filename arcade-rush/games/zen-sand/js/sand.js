/** Sand simulation — concentric rings + spinning flatten */
class SandTray {
  constructor(size = 160) {
    this.N = size;
    this.h = new Float32Array(size * size);
    this.noise = new Float32Array(size * size);
    for (let i = 0; i < this.noise.length; i++) {
      this.noise[i] = (Math.random() - 0.5) * 0.03;
    }
    this.cx = (size - 1) / 2;
    this.cy = (size - 1) / 2;
    this.reset();
  }

  i(x, y) {
    const n = this.N;
    x = x < 0 ? 0 : x >= n ? n - 1 : x | 0;
    y = y < 0 ? 0 : y >= n ? n - 1 : y | 0;
    return y * n + x;
  }

  inside(nx, ny) { return nx * nx + ny * ny <= 0.96; }

  reset() {
    this.h.fill(0);
    this.rings(this.cx, this.cy);
  }

  rings(ox, oy) {
    const n = this.N;
    const maxR = n * 0.47;
    for (let r = 1.1; r < maxR; r += 1.1) {
      const steps = Math.max(48, (r * 0.6) | 0);
      let px, py;
      for (let s = 0; s <= steps; s++) {
        const a = (s / steps) * Math.PI * 2;
        const x = ox + Math.cos(a) * r;
        const y = oy + Math.sin(a) * r;
        if (px !== undefined) this.rake(px, py, x, y, 0.28, 0.36, 3);
        px = x; py = y;
      }
    }
    this.rake(ox, n * 0.05, ox, n * 0.95, 0.24, 0.28, 1);
  }

  rake(x0, y0, x1, y1, str, spacing, tines) {
    const dx = x1 - x0, dy = y1 - y0;
    const len = Math.hypot(dx, dy);
    if (len < 0.1) return;
    const ux = dx / len, uy = dy / len;
    const px = -uy, py = ux;
    const steps = Math.max(2, (len * 2) | 0);
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const cx = x0 + dx * t, cy = y0 + dy * t;
      for (let k = -tines; k <= tines; k++) {
        this.tine(cx + px * k * spacing, cy + py * k * spacing, ux, uy, str);
      }
    }
  }

  tine(cx, cy, gx, gy, str) {
    const n = this.N, r = 1.6;
    const ix = cx | 0, iy = cy | 0;
    for (let y = iy - 2; y <= iy + 2; y++) {
      for (let x = ix - 2; x <= ix + 2; x++) {
        const nx = (x - this.cx) / (n * 0.5);
        const ny = (y - this.cy) / (n * 0.5);
        if (!this.inside(nx, ny)) continue;
        const dx = x - cx, dy = y - cy;
        if (dx * dx + dy * dy > r * r) continue;
        const along = dx * gx + dy * gy;
        const wave = Math.sin(along * 1.5) * 0.2;
        const fall = 1 - Math.sqrt(dx * dx + dy * dy) / r;
        this.h[this.i(x, y)] -= str * fall * (0.78 + wave);
      }
    }
  }

  pile(gx, gy) {
    const n = this.N, R = 18, S = 6;
    for (let y = (gy - R) | 0; y <= (gy + R) | 0; y++) {
      for (let x = (gx - R) | 0; x <= (gx + R) | 0; x++) {
        const nx = (x - this.cx) / (n * 0.5);
        const ny = (y - this.cy) / (n * 0.5);
        if (!this.inside(nx, ny)) continue;
        const dx = x - gx, dy = y - gy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > R) continue;
        const f = 1 - d / R;
        const idx = this.i(x, y);
        this.h[idx] += S * f * f;
        if (this.h[idx] > 18) this.h[idx] = 18;
      }
    }
  }

  pileLine(x0, y0, x1, y1) {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, (len / 2) | 0);
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      this.pile(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
    }
  }

  norm(a) {
    while (a <= -Math.PI) a += Math.PI * 2;
    while (a > Math.PI) a -= Math.PI * 2;
    return a;
  }

  spin(angle, prev) {
    const n = this.N, ox = this.cx, oy = this.cy, outer = n * 0.47;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const tx = -sin, ty = cos;
    if (prev != null) this.flattenWedge(prev, angle, outer);
    for (let s = 0; s <= 20; s++) {
      const r = 3 + (outer - 3) * (s / 20);
      const px = ox + cos * r, py = oy + sin * r;
      const L = 2.5;
      this.rake(px - tx * L, py - ty * L, px + tx * L, py + ty * L, 0.32, 0.34, 4);
    }
    this.blade(angle, outer);
  }

  flattenWedge(a0, a1, outer) {
    const n = this.N;
    const half = Math.max(Math.abs(this.norm(a1 - a0)) * 1.5, 0.15);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const nx = (x - this.cx) / (n * 0.5);
        const ny = (y - this.cy) / (n * 0.5);
        if (!this.inside(nx, ny)) continue;
        const rx = x - this.cx, ry = y - this.cy;
        const dist = Math.hypot(rx, ry);
        if (dist < 2 || dist > outer) continue;
        if (Math.abs(this.norm(Math.atan2(ry, rx) - a1)) > half) continue;
        const idx = this.i(x, y);
        if (this.h[idx] > 0) this.h[idx] *= 0.15;
      }
    }
  }

  blade(angle, outer) {
    const n = this.N;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const halfW = 3.5;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const nx = (x - this.cx) / (n * 0.5);
        const ny = (y - this.cy) / (n * 0.5);
        if (!this.inside(nx, ny)) continue;
        const rx = x - this.cx, ry = y - this.cy;
        const along = rx * cos + ry * sin;
        if (along < 2 || along > outer) continue;
        if (Math.abs(-rx * sin + ry * cos) > halfW) continue;
        const idx = this.i(x, y);
        if (this.h[idx] > 0) this.h[idx] *= 0.2;
      }
    }
  }

  toGrid(sx, sy, tray) {
    const n = this.N;
    const x = ((sx - tray.cx) / tray.r) * (n * 0.5) + this.cx;
    const y = ((sy - tray.cy) / tray.r) * (n * 0.5) + this.cy;
    return { x, y, ok: this.inside((x - this.cx) / (n * 0.5), (y - this.cy) / (n * 0.5)) };
  }

  paint(ctx) {
    const n = this.N;
    const w = n, h = n;
    if (ctx.canvas.width !== w) { ctx.canvas.width = w; ctx.canvas.height = h; }
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    const br = 248, bg = 244, bb = 236;

    for (let y = 0; y < h; y++) {
      const ny = (y - this.cy) / (n * 0.5);
      for (let x = 0; x < w; x++) {
        const p = (y * w + x) * 4;
        const nx = (x - this.cx) / (n * 0.5);
        if (!this.inside(nx, ny)) {
          d[p] = 20; d[p + 1] = 18; d[p + 2] = 16; d[p + 3] = 255;
          continue;
        }
        const idx = this.i(x, y);
        const hc = this.h[idx];
        const hr = this.h[this.i(x + 1, y)] - hc;
        const hd = this.h[this.i(x, y + 1)] - hc;
        let nx3 = -hr * 9, ny3 = -hd * 9, nz3 = 1;
        const inv = 1 / Math.hypot(nx3, ny3, nz3);
        const diff = Math.max(0, (nx3 * inv) * -0.5 + (ny3 * inv) * -0.35 + (nz3 * inv) * 0.8);
        const spec = Math.pow(Math.max(0, nz3 * inv), 16) * 0.55;
        const shade = 0.45 + diff * 0.55 + spec + this.noise[idx] + Math.max(0, hc) * 0.12;
        d[p] = Math.min(255, br * shade);
        d[p + 1] = Math.min(255, bg * shade);
        d[p + 2] = Math.min(255, bb * shade);
        d[p + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
}

window.SandTray = SandTray;