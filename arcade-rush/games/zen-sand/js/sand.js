/** Kinetic sand tray — concentric rings + spinner flatten (video mechanic) */
class SandTray {
  constructor(size = 200) {
    this.N = size;
    this.h = new Float32Array(size * size);
    this.noise = new Float32Array(size * size);
    for (let i = 0; i < this.noise.length; i++) {
      this.noise[i] = (Math.random() - 0.5) * 0.025;
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

  inside(nx, ny) {
    return nx * nx + ny * ny <= 0.96;
  }

  reset() {
    this.h.fill(0);
    this._rings(this.cx, this.cy);
  }

  _rings(ox, oy) {
    const n = this.N;
    const maxR = n * 0.47;
    for (let r = 1.2; r < maxR; r += 1.15) {
      const steps = Math.max(56, (r * 0.65) | 0);
      let px, py;
      for (let s = 0; s <= steps; s++) {
        const a = (s / steps) * Math.PI * 2;
        const x = ox + Math.cos(a) * r;
        const y = oy + Math.sin(a) * r;
        if (px !== undefined) this._rake(px, py, x, y, 0.26, 0.38, 3);
        px = x; py = y;
      }
    }
    this._rake(ox, n * 0.05, ox, n * 0.95, 0.22, 0.28, 1);
  }

  _rake(x0, y0, x1, y1, str, spacing, tines) {
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
        this._tine(cx + px * k * spacing, cy + py * k * spacing, ux, uy, str);
      }
    }
  }

  _tine(cx, cy, gx, gy, str) {
    const n = this.N;
    const r = 1.8;
    const ix = cx | 0, iy = cy | 0;
    for (let y = iy - 2; y <= iy + 2; y++) {
      for (let x = ix - 2; x <= ix + 2; x++) {
        const nx = (x - this.cx) / (n * 0.5);
        const ny = (y - this.cy) / (n * 0.5);
        if (!this.inside(nx, ny)) continue;
        const dx = x - cx, dy = y - cy;
        if (dx * dx + dy * dy > r * r) continue;
        const along = dx * gx + dy * gy;
        const wave = Math.sin(along * 1.6) * 0.18;
        const fall = 1 - Math.sqrt(dx * dx + dy * dy) / r;
        this.h[this.i(x, y)] -= str * fall * (0.75 + wave);
      }
    }
  }

  pile(gx, gy) {
    const n = this.N;
    const R = 20, S = 5;
    const ix = gx | 0, iy = gy | 0;
    for (let y = iy - R; y <= iy + R; y++) {
      for (let x = ix - R; x <= ix + R; x++) {
        const nx = (x - this.cx) / (n * 0.5);
        const ny = (y - this.cy) / (n * 0.5);
        if (!this.inside(nx, ny)) continue;
        const dx = x - gx, dy = y - gy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > R) continue;
        const f = 1 - d / R;
        const idx = this.i(x, y);
        this.h[idx] += S * f * f;
        if (this.h[idx] > 20) this.h[idx] = 20;
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

  /** Spinner: tangent rakes = concentric circles + flatten mounds in swept wedge */
  spin(angle, prev) {
    const n = this.N;
    const ox = this.cx, oy = this.cy;
    const outer = n * 0.47;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const tx = -sin, ty = cos;

    if (prev != null) this._wedgeFlatten(prev, angle, outer, 0.9);

    for (let s = 0; s <= 28; s++) {
      const r = 3 + (outer - 3) * (s / 28);
      const px = ox + cos * r, py = oy + sin * r;
      const L = 2.8;
      this._rake(px - tx * L, py - ty * L, px + tx * L, py + ty * L, 0.3, 0.35, 4);
    }

    this._blade(angle, outer, 3.2, 0.85);
  }

  _norm(a) {
    while (a <= -Math.PI) a += Math.PI * 2;
    while (a > Math.PI) a -= Math.PI * 2;
    return a;
  }

  _wedgeFlatten(a0, a1, outer, mix) {
    const n = this.N;
    const half = Math.max(Math.abs(this._norm(a1 - a0)) * 1.4, 0.14);
    const mid = a1;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const nx = (x - this.cx) / (n * 0.5);
        const ny = (y - this.cy) / (n * 0.5);
        if (!this.inside(nx, ny)) continue;
        const rx = x - this.cx, ry = y - this.cy;
        const dist = Math.hypot(rx, ry);
        if (dist < 2 || dist > outer) continue;
        const cellA = Math.atan2(ry, rx);
        if (Math.abs(this._norm(cellA - mid)) > half) continue;
        const f = 1 - dist / outer * 0.1;
        const idx = this.i(x, y);
        if (this.h[idx] > 0) this.h[idx] *= 1 - mix * f;
      }
    }
  }

  _blade(angle, outer, halfW, mix) {
    const n = this.N;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const nx = (x - this.cx) / (n * 0.5);
        const ny = (y - this.cy) / (n * 0.5);
        if (!this.inside(nx, ny)) continue;
        const rx = x - this.cx, ry = y - this.cy;
        const along = rx * cos + ry * sin;
        if (along < 2 || along > outer) continue;
        const perp = Math.abs(-rx * sin + ry * cos);
        if (perp > halfW) continue;
        const f = 1 - perp / halfW;
        const idx = this.i(x, y);
        if (this.h[idx] > 0) this.h[idx] *= 1 - mix * f;
      }
    }
  }

  screenToGrid(sx, sy, tray) {
    const n = this.N;
    const x = ((sx - tray.cx) / tray.r) * (n * 0.5) + this.cx;
    const y = ((sy - tray.cy) / tray.r) * (n * 0.5) + this.cy;
    const nx = (x - this.cx) / (n * 0.5);
    const ny = (y - this.cy) / (n * 0.5);
    return { x, y, ok: this.inside(nx, ny) };
  }

  draw(ctx, tray) {
    const n = this.N;
    const w = (tray.r * 2) | 0;
    const h = w;
    if (ctx.canvas.width !== w) {
      ctx.canvas.width = w;
      ctx.canvas.height = h;
    }
    const img = ctx.createImageData(w, h);
    const d = img.data;
    const scale = w / n;
    const br = 248, bg = 244, bb = 238;

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const gx = px / scale;
        const gy = py / scale;
        const ix = gx | 0, iy = gy | 0;
        const p = (py * w + px) * 4;
        const nx = (gx - this.cx) / (n * 0.5);
        const ny = (gy - this.cy) / (n * 0.5);
        const dist = Math.hypot(nx, ny);

        if (dist > 1) {
          d[p] = 18; d[p + 1] = 16; d[p + 2] = 14; d[p + 3] = 255;
          continue;
        }

        const idx = this.i(ix, iy);
        const hc = this.h[idx];
        const hr = this.h[this.i(ix + 1, iy)] - hc;
        const hd = this.h[this.i(ix, iy + 1)] - hc;
        let nx3 = -hr * 8, ny3 = -hd * 8, nz3 = 1;
        const inv = 1 / Math.hypot(nx3, ny3, nz3);
        nx3 *= inv; ny3 *= inv; nz3 *= inv;
        const diff = Math.max(0, nx3 * -0.5 + ny3 * -0.35 + nz3 * 0.8);
        const spec = Math.pow(Math.max(0, nz3), 20) * 0.5;
        const mound = Math.max(0, hc) * 0.1;
        const shade = 0.46 + diff * 0.52 + spec + this.noise[idx] + mound;

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