class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = new Particles();
    this.time = 0;
    this.crowdDots = [];
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initCrowd();
  }

  initCrowd() {
    this.crowdDots = [];
    for (let i = 0; i < 80; i++) {
      this.crowdDots.push({
        x: Math.random(), y: Math.random(),
        r: 1.2 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
        c: Math.random() > 0.55 ? '#C8102E' : '#e8e8e8',
      });
    }
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
    this.groundY = this.h - CONFIG.GROUND_H;
  }

  drawCheckerRect(x, y, width, height, cell, c1, c2) {
    const ctx = this.ctx;
    const cols = Math.ceil(width / cell);
    const rows = Math.ceil(height / cell);
    const red = c1 || '#C8102E';
    const white = c2 || '#FFFFFF';
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? red : white;
        const cx = x + col * cell;
        const cy = y + row * cell;
        ctx.fillRect(cx, cy, Math.min(cell, x + width - cx), Math.min(cell, y + height - cy));
      }
    }
  }

  drawBackground(combo) {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0, 0, 0, this.h);
    g.addColorStop(0, '#0a1628');
    g.addColorStop(0.4, '#163a6b');
    g.addColorStop(0.75, '#1e5a8a');
    g.addColorStop(1, '#2870a8');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, this.h);

    const lights = ctx.createRadialGradient(this.w * 0.5, 0, 0, this.w * 0.5, 0, this.w * 0.9);
    lights.addColorStop(0, 'rgba(255,255,255,0.12)');
    lights.addColorStop(1, 'transparent');
    ctx.fillStyle = lights;
    ctx.fillRect(0, 0, this.w, this.h * 0.55);

    const standH = this.groundY - 40;
    ctx.fillStyle = '#0d1f3c';
    ctx.fillRect(0, 36, this.w, standH);

    const crowdAmp = 0.12 + Math.min(combo || 0, 10) * 0.02;
    for (const d of this.crowdDots) {
      const py = 44 + d.y * (standH - 20);
      ctx.globalAlpha = 0.3 + Math.sin(this.time * (1.5 + crowdAmp) + d.phase) * crowdAmp;
      ctx.fillStyle = d.c;
      ctx.beginPath();
      ctx.arc(d.x * this.w, py, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(200,16,46,0.15)';
    ctx.fillRect(0, 36, 28, standH);
    ctx.fillRect(this.w - 28, 36, 28, standH);
  }

  drawPitch(scroll) {
    const ctx = this.ctx;
    const gy = this.groundY;
    const stripes = 12;
    const sw = this.w / stripes;
    const off = (scroll || 0) % (sw * 2);
    for (let i = -2; i < stripes + 2; i++) {
      const sx = i * sw - off;
      ctx.fillStyle = i % 2 === 0 ? '#2d8a3e' : '#329446';
      ctx.fillRect(sx, gy - 28, sw + 1, this.h - gy + 28);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.w * 0.05, gy - 20, this.w * 0.9, this.h - gy + 8);
    ctx.beginPath();
    ctx.arc(this.w * 0.5, gy + 20, 48, Math.PI, 0);
    ctx.stroke();
  }

  drawPlayer(player, kitId, facing) {
    const ctx = this.ctx;
    const s = CONFIG.PLAYER_SCALE;
    const nod = player.nod || 0;
    const flip = facing || player.facing || 1;
    const kit = Meta.KITS[kitId] || Meta.KITS.kit_default;
    const skin = '#EBC49A';
    const skinSh = '#D4A574';
    const hair = '#3E2723';

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.scale(s * flip, s);

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 7, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#121212';
    ctx.beginPath();
    ctx.roundRect(-11, 13, 9, 5, 2);
    ctx.roundRect(2, 13, 9, 5, 2);
    ctx.fill();

    ctx.fillStyle = kit.socks;
    ctx.fillRect(-10, 6, 8, 8);
    ctx.fillRect(2, 6, 8, 8);

    ctx.fillStyle = kit.shorts;
    ctx.beginPath();
    ctx.roundRect(-12, -2, 24, 10, 3);
    ctx.fill();

    const jy = -44;
    const jh = 40;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(-14, jy, 28, jh, 4);
    ctx.clip();
    this.drawCheckerRect(-14, jy, 28, jh, 7, kit.primary, kit.secondary);
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-14, jy, 28, jh, 4);
    ctx.stroke();

    ctx.fillStyle = kit.secondary;
    ctx.fillRect(-9, jy, 18, 3);

    ctx.save();
    ctx.scale(flip < 0 ? -1 : 1, 1);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('10', 0, jy + 24);
    ctx.restore();

    const headY = jy - 8 - nod * 12;

    ctx.fillStyle = skin;
    ctx.fillRect(-3, jy - 1, 6, 7);

    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.arc(0, headY - 1, 11.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, headY + 2, 10.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.moveTo(-11, headY - 1);
    ctx.quadraticCurveTo(-5, headY - 11, 0, headY - 7);
    ctx.quadraticCurveTo(5, headY - 11, 11, headY - 1);
    ctx.lineTo(9, headY - 3);
    ctx.quadraticCurveTo(0, headY - 5, -9, headY - 3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = skinSh;
    ctx.beginPath();
    ctx.ellipse(-10, headY + 2, 2.5, 3.5, 0, 0, Math.PI * 2);
    ctx.ellipse(10, headY + 2, 2.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(-3.5, headY + 2, 3, 3.2, 0, 0, Math.PI * 2);
    ctx.ellipse(3.5, headY + 2, 3, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2C1810';
    ctx.beginPath();
    ctx.arc(-3.5, headY + 2.5, 1.6, 0, Math.PI * 2);
    ctx.arc(3.5, headY + 2.5, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-2.8, headY + 1.5, 0.6, 0, Math.PI * 2);
    ctx.arc(4.2, headY + 1.5, 0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#B07850';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(0, headY + 7, 3, 0.25, Math.PI - 0.25);
    ctx.stroke();

    if (nod > 0.75) {
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, headY - 12, 12, -0.65, -0.2);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawBallTelegraph(ball, ballType) {
    const ctx = this.ctx;
    const labels = { fast: GameI18n.t('fast'), curve: GameI18n.t('curve') };
    const colors = { fast: '#FF6B35', curve: '#42A5F5' };
    const label = labels[ballType];
    if (!label) return;
    const pulse = 0.9 + Math.sin(this.time * 9) * 0.1;
    const by = ball.y - CONFIG.BALL_R - 24;
    ctx.save();
    ctx.font = `bold ${13 * pulse}px Outfit, sans-serif`;
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 3;
    ctx.strokeText(label, ball.x, by);
    ctx.fillStyle = colors[ballType];
    ctx.fillText(label, ball.x, by);
    ctx.restore();
  }

  drawBall(ball, ballType, fever, ballId) {
    const ctx = this.ctx;
    const r = CONFIG.BALL_R;
    const skin = Meta.BALLS[ballId] || Meta.BALLS.ball_default;

    if (ballType === 'fast') {
      ctx.strokeStyle = 'rgba(255,61,0,0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ball.x, ball.y);
      ctx.lineTo(ball.x - ball.vx * 5, ball.y - ball.vy * 5);
      ctx.stroke();
    }

    if (fever) {
      ctx.fillStyle = 'rgba(255,100,50,0.15)';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, r + 10, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(ball.x + 2, ball.y + r + 6, r * 0.9, r * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate((ball.rot || 0) + (ball.spin || 0));
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();
    this.drawCheckerRect(-r, -r, r * 2, r * 2, CONFIG.CHECKER_CELL, skin.c1, skin.c2);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r - 0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawHeaderCue(head, ready, perfect, aligned) {
    if (!ready && !aligned) return;
    const ctx = this.ctx;
    const pulse = 0.88 + Math.sin(this.time * 12) * 0.12;
    ctx.save();
    if (!aligned) {
      ctx.globalAlpha = 0.5;
      ctx.font = 'bold 13px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#90CAF9';
      ctx.fillText(GameI18n.t('run'), head.x, head.y - 42);
      ctx.restore();
      return;
    }
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = '#FFE082';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(head.x, head.y - 6, 42 * pulse, 22 * pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
    if (perfect) {
      ctx.globalAlpha = 0.65 + Math.sin(this.time * 14) * 0.2;
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(head.x, head.y - 6, 20 * pulse, 11 * pulse, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.font = 'bold 17px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = 3;
      ctx.strokeText(GameI18n.t('perfect'), head.x, head.y - 46);
      ctx.fillStyle = '#FFD54F';
      ctx.fillText(GameI18n.t('perfect'), head.x, head.y - 46);
    } else {
      ctx.globalAlpha = 0.85;
      ctx.font = 'bold 15px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFE082';
      ctx.fillText(GameI18n.t('tap'), head.x, head.y - 42);
    }
    ctx.restore();
  }

  drawFeverOverlay(fever, combo) {
    if (!fever) return;
    const ctx = this.ctx;
    const a = 0.06 + Math.sin(this.time * 6) * 0.03;
    const g = ctx.createRadialGradient(this.w * 0.5, this.h * 0.5, 0, this.w * 0.5, this.h * 0.5, this.w * 0.7);
    g.addColorStop(0, `rgba(255,80,30,${a + 0.08})`);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, this.h);
  }

  drawSlowMoOverlay(active) {
    if (!active) return;
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(0, 0, this.w, this.h);
  }

  drawPopups(popups) {
    const ctx = this.ctx;
    for (const p of popups) {
      const a = p.life / p.maxLife;
      const scale = 0.9 + (1 - a) * 0.3;
      ctx.save();
      ctx.translate(p.x, p.y - (1 - a) * 30);
      ctx.scale(scale, scale);
      ctx.globalAlpha = a;
      ctx.font = `bold ${18 + p.big * 10}px Outfit, sans-serif`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = 4;
      ctx.strokeText(p.text, 0, 0);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  render(state) {
    this.time += 0.016;
    let shakeX = 0;
    let shakeY = 0;
    if (state.shake > 0) {
      shakeX = (Math.random() - 0.5) * state.shake;
      shakeY = (Math.random() - 0.5) * state.shake;
    }
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(shakeX, shakeY);

    this.drawBackground(state.combo);
    this.drawPitch(state.scroll);
    this.drawFeverOverlay(state.fever, state.combo);
    this.drawPlayer(state.player, state.cosmetics?.kit);
    if (state.head) {
      this.drawHeaderCue(state.head, state.headerReady, state.perfectReady, state.aligned);
    }
    if (state.showTelegraph) this.drawBallTelegraph(state.ball, state.ballType);
    this.drawBall(state.ball, state.ballType, state.fever, state.cosmetics?.ball);
    this.drawPopups(state.popups || []);
    this.drawSlowMoOverlay(state.slowMo);

    ctx.restore();
    this.particles.update(0.016);
    this.particles.draw(ctx);
  }
}