/** Realistic kinetic-sand tray renderer */
class SandRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.sandCanvas = document.createElement('canvas');
    this.sandCtx = this.sandCanvas.getContext('2d', { alpha: false });
    this.imageData = null;
    this.tray = { cx: 0, cy: 0, radius: 0 };
    this.armAngle = -Math.PI / 2;
    this.armVisible = true;
    this.dpr = 1;
  }

  resize(width, height) {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const r = Math.min(width, height) * 0.44;
    this.tray = { cx: width * 0.5, cy: height * 0.5, radius: r, width, height };
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
          data[i] = 22;
          data[i + 1] = 20;
          data[i + 2] = 18;
          data[i + 3] = 255;
          continue;
        }

        const idx = engine.idx(x, y);
        const hC = engine.heights[idx];
        const hR = engine.heights[engine.idx(x + 1, y)] - hC;
        const hD = engine.heights[engine.idx(x, y + 1)] - hC;
        let nx3 = -hR * 7.5;
        let ny3 = -hD * 7.5;
        let nz3 = 1;
        const inv = 1 / Math.hypot(nx3, ny3, nz3);
        nx3 *= inv;
        ny3 *= inv;
        nz3 *= inv;

        const diffuse = Math.max(0, nx3 * lx + ny3 * ly + nz3 * lz);
        const spec = Math.pow(Math.max(0, nx3 * 0.15 + ny3 * 0.1 + nz3 * 0.98), 18) * 0.55;
        const grain = engine.noise[idx];
        const edge = dist > 0.94 ? (dist - 0.94) / 0.06 : 0;
        const mound = Math.max(0, hC) * 0.09;
        const shade = 0.48 + diffuse * 0.5 + spec - edge * 0.2 + grain + mound;

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
    const { ctx, tray, armAngle, armVisible } = this;
    const { cx, cy, radius, width, height } = tray;

    ctx.fillStyle = '#141210';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.shadowColor = ZenConfig.TRAY.shadow;
    ctx.shadowBlur = 32;
    ctx.shadowOffsetY = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1816';
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, radius + 5, 0, Math.PI * 2);
    ctx.strokeStyle = ZenConfig.TRAY.rim;
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(this.sandCanvas, cx - radius, cy - radius, radius * 2, radius * 2);

    const gloss = ctx.createRadialGradient(cx - radius * 0.35, cy - radius * 0.3, 0, cx - radius * 0.2, cy - radius * 0.15, radius * 0.7);
    gloss.addColorStop(0, 'rgba(255,255,255,0.22)');
    gloss.addColorStop(0.45, 'rgba(255,255,255,0.04)');
    gloss.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gloss;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.restore();

    if (armVisible) this._drawStick(cx, cy, radius, armAngle);
  }

  _drawStick(cx, cy, trayRadius, angle) {
    const { ctx } = this;
    const len = trayRadius * 0.96;
    const ex = cx + Math.cos(angle) * len;
    const ey = cy + Math.sin(angle) * len;

    ctx.save();
    const stickGrad = ctx.createLinearGradient(cx, cy, ex, ey);
    stickGrad.addColorStop(0, '#8a8078');
    stickGrad.addColorStop(0.35, '#e8e4dc');
    stickGrad.addColorStop(0.55, '#ffffff');
    stickGrad.addColorStop(0.75, '#d8d4cc');
    stickGrad.addColorStop(1, '#9a9288');

    ctx.shadowColor = 'rgba(255,255,255,0.35)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = stickGrad;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#b0a89c';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  setArm(angle, visible = true) {
    this.armAngle = angle;
    this.armVisible = visible;
  }

  drawCursor(x, y, tool) {
    const { ctx } = this;
    ctx.save();
    if (tool === 'pile') {
      ctx.fillStyle = 'rgba(80, 70, 60, 0.2)';
      ctx.beginPath();
      ctx.arc(x, y, 28, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

window.SandRenderer = SandRenderer;