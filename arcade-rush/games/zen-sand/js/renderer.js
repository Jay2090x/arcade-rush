/** Lit sand-tray renderer — sim at grid res, upscale to screen */
class SandRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.sandCanvas = document.createElement('canvas');
    this.sandCtx = this.sandCanvas.getContext('2d', { alpha: false });
    this.imageData = null;
    this.tray = { cx: 0, cy: 0, radius: 0 };
    this.dpr = 1;
  }

  resize(width, height) {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const r = Math.min(width, height) * 0.42;
    this.tray = { cx: width * 0.5, cy: height * 0.48, radius: r, width, height };
  }

  render(engine) {
    const s = engine.size;
    if (this.sandCanvas.width !== s) {
      this.sandCanvas.width = s;
      this.sandCanvas.height = s;
      this.imageData = this.sandCtx.createImageData(s, s);
    }

    const data = this.imageData.data;
    const [br, bg, bb] = ZenConfig.BASE_SAND;
    const lx = ZenConfig.LIGHT.x;
    const ly = ZenConfig.LIGHT.y;
    const lz = ZenConfig.LIGHT.z;
    const mid = (s - 1) * 0.5;
    const half = s * 0.5;

    for (let y = 0; y < s; y++) {
      const ny = (y - mid) / half;
      for (let x = 0; x < s; x++) {
        const i = (y * s + x) * 4;
        const nx = (x - mid) / half;
        const dist = Math.hypot(nx, ny);

        if (dist > 1.0) {
          data[i] = 28;
          data[i + 1] = 26;
          data[i + 2] = 24;
          data[i + 3] = 255;
          continue;
        }

        const idx = engine.idx(x, y);
        const hC = engine.heights[idx];
        const hR = engine.heights[engine.idx(x + 1, y)] - hC;
        const hD = engine.heights[engine.idx(x, y + 1)] - hC;
        let nx3 = -hR * 2.2;
        let ny3 = -hD * 2.2;
        let nz3 = 1;
        const invLen = 1 / Math.hypot(nx3, ny3, nz3);
        nx3 *= invLen;
        ny3 *= invLen;
        nz3 *= invLen;

        const diffuse = Math.max(0, nx3 * lx + ny3 * ly + nz3 * lz);
        const spec = Math.pow(Math.max(0, nx3 * 0.2 + ny3 * 0.15 + nz3 * 0.95), 28) * 0.35;
        const grain = engine.noise[idx];
        const edge = dist > 0.92 ? (dist - 0.92) / 0.08 : 0;
        const shade = 0.52 + diffuse * 0.42 + spec - edge * 0.25 + grain;

        data[i] = Math.min(255, br * shade);
        data[i + 1] = Math.min(255, bg * shade);
        data[i + 2] = Math.min(255, bb * shade);
        data[i + 3] = 255;
      }
    }

    this.sandCtx.putImageData(this.imageData, 0, 0);
    this._drawScene();
  }

  _drawScene() {
    const { ctx, tray } = this;
    const { cx, cy, radius, width, height } = tray;
    ctx.fillStyle = '#1c1a18';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.shadowColor = ZenConfig.TRAY.shadow;
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.04)';
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    const d = radius * 2;
    ctx.drawImage(this.sandCanvas, cx - radius, cy - radius, d, d);
    ctx.restore();

    const grad = ctx.createRadialGradient(cx - radius * 0.2, cy - radius * 0.25, radius * 0.15, cx, cy, radius);
    grad.addColorStop(0, 'rgba(255,255,255,0.16)');
    grad.addColorStop(0.6, 'rgba(255,255,255,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.07)');
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
    ctx.strokeStyle = ZenConfig.TRAY.rim;
    ctx.lineWidth = 5;
    ctx.stroke();
  }

  drawCursor(x, y, tool, active) {
    if (!active || tool === 'rings' || tool === 'reset') return;
    const { ctx } = this;
    ctx.save();
    if (tool === 'rake') {
      ctx.strokeStyle = 'rgba(90, 80, 70, 0.55)';
      ctx.lineWidth = 2;
      const w = 22;
      for (let k = -2; k <= 2; k++) {
        ctx.beginPath();
        ctx.moveTo(x - w, y + k * 5);
        ctx.lineTo(x + w, y + k * 5);
        ctx.stroke();
      }
    } else if (tool === 'pile') {
      ctx.fillStyle = 'rgba(60, 55, 50, 0.25)';
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.fill();
    } else if (tool === 'smooth') {
      ctx.strokeStyle = 'rgba(120, 110, 100, 0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

window.SandRenderer = SandRenderer;