class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = new Particles();
    this.time = 0;
    this.clouds = [];
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initClouds();
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
    this.groundY = this.h - CONFIG.GROUND_HEIGHT;
  }

  initClouds() {
    this.clouds = [];
    for (let i = 0; i < 8; i++) {
      this.clouds.push({
        x: Math.random() * this.w,
        y: 40 + Math.random() * (this.h * 0.45),
        scale: 0.5 + Math.random() * 0.8,
        speed: 0.2 + Math.random() * 0.4,
        layer: Math.floor(Math.random() * 3),
      });
    }
  }

  drawSky() {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0, 0, 0, this.h);
    g.addColorStop(0, '#1a237e');
    g.addColorStop(0.35, '#3949ab');
    g.addColorStop(0.7, '#64b5f6');
    g.addColorStop(1, '#bbdefb');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, this.h);

    const sunG = ctx.createRadialGradient(this.w * 0.82, this.h * 0.15, 0, this.w * 0.82, this.h * 0.15, 60);
    sunG.addColorStop(0, 'rgba(255, 245, 200, 0.9)');
    sunG.addColorStop(0.5, 'rgba(255, 220, 100, 0.3)');
    sunG.addColorStop(1, 'transparent');
    ctx.fillStyle = sunG;
    ctx.fillRect(0, 0, this.w, this.h);
  }

  drawClouds(speed) {
    const ctx = this.ctx;
    for (const c of this.clouds) {
      c.x -= c.speed * speed * (0.3 + c.layer * 0.2);
      if (c.x < -120) c.x = this.w + 60;

      ctx.save();
      ctx.globalAlpha = 0.35 + c.layer * 0.15;
      ctx.translate(c.x, c.y);
      ctx.scale(c.scale, c.scale * 0.6);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.arc(25, -5, 25, 0, Math.PI * 2);
      ctx.arc(50, 0, 28, 0, Math.PI * 2);
      ctx.arc(25, 8, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawGround(scroll) {
    const ctx = this.ctx;
    const gy = this.groundY;

    const g = ctx.createLinearGradient(0, gy, 0, this.h);
    g.addColorStop(0, '#66bb6a');
    g.addColorStop(0.3, '#43a047');
    g.addColorStop(1, '#2e7d32');
    ctx.fillStyle = g;
    ctx.fillRect(0, gy, this.w, CONFIG.GROUND_HEIGHT);

    ctx.fillStyle = '#388e3c';
    const offset = scroll % 40;
    for (let x = -offset; x < this.w + 40; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + 20, gy - 12);
      ctx.lineTo(x + 40, gy);
      ctx.fill();
    }

    ctx.strokeStyle = '#1b5e20';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(this.w, gy);
    ctx.stroke();
  }

  drawPipe(pipe, scroll) {
    const ctx = this.ctx;
    const x = pipe.x;
    const w = CONFIG.PIPE_WIDTH;
    const capH = 28;
    const gy = this.groundY;

    const bodyG = ctx.createLinearGradient(x, 0, x + w, 0);
    bodyG.addColorStop(0, '#2e7d32');
    bodyG.addColorStop(0.3, '#43a047');
    bodyG.addColorStop(0.7, '#66bb6a');
    bodyG.addColorStop(1, '#2e7d32');

    const capG = ctx.createLinearGradient(x - 4, 0, x + w + 4, 0);
    capG.addColorStop(0, '#1b5e20');
    capG.addColorStop(0.5, '#388e3c');
    capG.addColorStop(1, '#1b5e20');

    const drawSection = (top, height, capAtTop) => {
      if (height <= 0) return;
      ctx.fillStyle = bodyG;
      ctx.fillRect(x, top, w, height);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(x + 8, top, 6, height);

      const capY = capAtTop ? top - capH + 8 : top + height - 8;
      ctx.fillStyle = capG;
      ctx.fillRect(x - 4, capY, w + 8, capH);
      ctx.strokeStyle = '#1b5e20';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 4, capY, w + 8, capH);
    };

    drawSection(0, pipe.topH, false);
    drawSection(pipe.bottomY, gy - pipe.bottomY, true);
  }

  drawBird(bird) {
    const ctx = this.ctx;
    const { x, y, rotation, wingPhase, alive } = bird;
    const s = CONFIG.BIRD_SIZE;

    if (alive) this.particles.trail(x - s * 0.5, y);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    const bodyG = ctx.createRadialGradient(-4, -4, 0, 0, 0, s);
    bodyG.addColorStop(0, '#FFEB3B');
    bodyG.addColorStop(0.6, '#FFC107');
    bodyG.addColorStop(1, '#FF8F00');
    ctx.fillStyle = bodyG;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.85, s * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(s * 0.35, -s * 0.15, s * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(s * 0.42, -s * 0.12, s * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(s * 0.45, -s * 0.18, s * 0.04, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FF6F00';
    ctx.beginPath();
    ctx.moveTo(s * 0.7, s * 0.05);
    ctx.lineTo(s * 1.1, s * 0.15);
    ctx.lineTo(s * 0.7, s * 0.25);
    ctx.closePath();
    ctx.fill();

    const wingAngle = Math.sin(wingPhase) * 0.6 - 0.3;
    ctx.save();
    ctx.translate(-s * 0.1, s * 0.05);
    ctx.rotate(wingAngle);
    ctx.fillStyle = 'rgba(255, 193, 7, 0.9)';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.55, s * 0.3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  drawScorePopup(popups) {
    const ctx = this.ctx;
    for (const p of popups) {
      const a = p.life / p.maxLife;
      ctx.globalAlpha = a;
      ctx.font = `bold ${14 + p.big * 6}px Outfit, sans-serif`;
      ctx.fillStyle = p.color;
      ctx.textAlign = 'center';
      ctx.fillText(p.text, p.x, p.y - (1 - a) * 30);
      ctx.globalAlpha = 1;
    }
  }

  render(state) {
    this.time += 0.016;
    const ctx = this.ctx;

    let shakeX = 0, shakeY = 0;
    if (state.shake > 0) {
      shakeX = (Math.random() - 0.5) * state.shake;
      shakeY = (Math.random() - 0.5) * state.shake;
      state.shake *= 0.88;
      if (state.shake < 0.3) state.shake = 0;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    this.drawSky();
    this.drawClouds(state.speed);
    for (const pipe of state.pipes) this.drawPipe(pipe, state.scroll);
    this.drawGround(state.scroll);

    if (state.bird) this.drawBird(state.bird);

    this.particles.update(0.016);
    this.particles.draw(ctx);
    this.drawScorePopup(state.popups || []);

    ctx.restore();
  }
}