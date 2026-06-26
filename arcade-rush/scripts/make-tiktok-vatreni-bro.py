#!/usr/bin/env python3
"""Render Vatreni Bro TikTok promo — gameplay bot + upper-third text overlays."""
import os
import shutil
import subprocess
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT_DIR = Path("/Users/josip/Downloads")
FRAMES_DIR = OUT_DIR / "tiktok-vatreni-bro-frames"
FINAL_MP4 = OUT_DIR / "tiktok-vatreni-bro.mp4"
FFMPEG = os.path.expanduser("~/.local/bin/ffmpeg")
URL = os.environ.get("VATRENI_URL", "http://127.0.0.1:8765/")
FPS = 30
DURATION_SEC = 18
TOTAL_FRAMES = FPS * DURATION_SEC

SETUP_JS = r"""
(() => {
  if (document.getElementById('tt-style')) return;
  const style = document.createElement('style');
  style.id = 'tt-style';
  style.textContent = `
    .overlay, .tutorial-overlay, .btn-lang, .btn-sound { display: none !important; }
    #hud { opacity: 1 !important; }
    .hud-top .best-pill { display: none !important; }
    .score-panel { margin-top: 118px !important; }
    .combo-panel { margin-top: 4px !important; }

    .tt-safe-top {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 32%;
      z-index: 9998;
      pointer-events: none;
      background: linear-gradient(180deg,
        rgba(6,12,28,0.72) 0%,
        rgba(6,12,28,0.38) 55%,
        transparent 100%);
    }
    .tt-brand {
      position: fixed;
      top: 52px; left: 0; right: 0;
      z-index: 9999;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 0 20px;
    }
    .tt-pill {
      font: 900 22px/1.2 Outfit, system-ui, sans-serif;
      color: #fff;
      text-align: center;
      padding: 14px 22px;
      border-radius: 18px;
      background: linear-gradient(135deg, rgba(200,16,46,0.92), rgba(140,8,32,0.78));
      border: 1.5px solid rgba(255,255,255,0.22);
      box-shadow: 0 10px 36px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.15);
      letter-spacing: -0.02em;
    }
    .tt-sub {
      font: 700 15px/1.3 Outfit, system-ui, sans-serif;
      color: #FFE082;
      text-align: center;
      text-shadow: 0 2px 12px rgba(0,0,0,0.85);
    }
    .tt-url {
      font: 800 12px ui-monospace, SFMono-Regular, Menlo, monospace;
      color: #fff;
      letter-spacing: 0.04em;
      padding: 9px 18px;
      border-radius: 999px;
      background: rgba(0,0,0,0.42);
      border: 1px solid rgba(255,224,130,0.38);
      backdrop-filter: blur(8px);
    }
    .tt-flash {
      position: fixed;
      top: 38%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.7);
      z-index: 9999;
      pointer-events: none;
      font: 900 52px/1 Outfit, system-ui, sans-serif;
      color: #FFD54F;
      opacity: 0;
      text-shadow:
        0 0 28px rgba(255,213,79,0.95),
        0 4px 18px rgba(0,0,0,0.9);
      transition: opacity 0.1s, transform 0.22s cubic-bezier(0.2,1.2,0.4,1);
    }
    .tt-flash.show {
      opacity: 1;
      transform: translate(-50%, -58%) scale(1.08);
    }
    .tt-combo {
      position: fixed;
      top: 30%;
      right: 18px;
      z-index: 9999;
      pointer-events: none;
      font: 900 20px Outfit, system-ui, sans-serif;
      color: #FF6B35;
      opacity: 0;
      text-shadow: 0 2px 10px rgba(0,0,0,0.8);
      transition: opacity 0.15s;
    }
    .tt-combo.show { opacity: 1; }
    #score.bump {
      transform: scale(1.28) !important;
      color: #FFE082 !important;
      transition: transform 0.14s ease-out, color 0.14s;
    }
    #combo-panel.active { transform: scale(1.05); transition: transform 0.2s; }
  `;
  document.head.appendChild(style);

  const grad = document.createElement('div');
  grad.className = 'tt-safe-top';
  document.body.appendChild(grad);

  const brand = document.createElement('div');
  brand.className = 'tt-brand';
  brand.innerHTML = `
    <div class="tt-pill">Schaffst du 20? 🔥🇭🇷</div>
    <div class="tt-sub">Warte auf PERFECT! · Dann tippen</div>
    <div class="tt-url">arcade-rush.netlify.app</div>
  `;
  document.body.appendChild(brand);

  const flash = document.createElement('div');
  flash.className = 'tt-flash';
  flash.id = 'tt-flash';
  flash.textContent = 'PERFECT!';
  document.body.appendChild(flash);

  const combo = document.createElement('div');
  combo.className = 'tt-combo';
  combo.id = 'tt-combo';
  document.body.appendChild(combo);

  window.__lastScore = 0;
  window.__lastCombo = 0;
})();
"""

TICK_JS = r"""
(() => {
  if (!window.__ttFrames) window.__ttFrames = { flash: 0, bump: 0, combo: 0 };
  const tt = window.__ttFrames;
  if (tt.flash > 0) tt.flash--;
  if (tt.bump > 0) tt.bump--;
  if (tt.combo > 0) tt.combo--;

  const sync = () => {
    const f = document.getElementById('tt-flash');
    const c = document.getElementById('tt-combo');
    const s = document.getElementById('score');
    const cp = document.getElementById('combo-panel');
    if (f) f.classList.toggle('show', tt.flash > 0);
    if (c) {
      c.classList.toggle('show', tt.combo > 0);
      if (tt.combo > 0 && typeof Game !== 'undefined') c.textContent = `🔥 ${Game.combo}x`;
    }
    if (s) s.classList.toggle('bump', tt.bump > 0);
    if (cp) cp.classList.toggle('active', typeof Game !== 'undefined' && Game.combo > 0);
  };

  if (typeof Game === 'undefined' || Game.state !== 'playing') {
    sync();
    return { score: 0, combo: 0, state: typeof Game !== 'undefined' ? Game.state : null };
  }

  const ball = Game.ball;
  const head = Game.headPoint();

  if (Game.awaitingHeader && !Game.headerDone && ball.vy > 0) {
    if (Game.perfectReady) {
      Game.tryHeader();
    } else if (Game.headerReady && ball.y > head.y - 8) {
      Game.tryHeader();
    }
  }

  Game.update();
  Game.renderer.render(Game.getRenderState());

  const score = Game.score;
  const combo = Game.combo;
  const el = document.getElementById('score');
  const cel = document.getElementById('combo');
  const mel = document.getElementById('mult-pill');
  if (el) el.textContent = String(score);
  if (cel) cel.textContent = String(combo);
  if (mel) mel.textContent = `x${Game.multiplier}`;

  if (score > window.__lastScore) {
    window.__lastScore = score;
    tt.flash = 14;
    tt.bump = 8;
  }
  if (combo > window.__lastCombo && combo >= 2) {
    window.__lastCombo = combo;
    tt.combo = 20;
  }
  sync();
  return { score, combo, state: Game.state };
})();
"""

START_JS = r"""
(() => {
  Game.start();
  Game.state = 'playing';
  Game.resetEntities();
  Game.ball.vy = 2.6;
  window.__lastScore = 0;
  window.__lastCombo = 0;
  window.__ttFrames = { flash: 0, bump: 0, combo: 0 };
  document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
  document.getElementById('hud').classList.add('visible');
  document.getElementById('score').textContent = '0';
  document.getElementById('combo').textContent = '0';
  if (document.getElementById('mult-pill')) document.getElementById('mult-pill').textContent = 'x1';
  Game.beginLoop();
})();
"""


def render_frames():
    if FRAMES_DIR.exists():
        shutil.rmtree(FRAMES_DIR)
    FRAMES_DIR.mkdir(parents=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
        )
        page.goto(URL, wait_until="networkidle", timeout=45000)
        time.sleep(1.0)

        page.evaluate(SETUP_JS)
        page.evaluate(START_JS)
        time.sleep(0.3)

        max_score = 0
        max_combo = 0
        for i in range(TOTAL_FRAMES):
            result = page.evaluate(TICK_JS)
            if result.get("state") == "dead" and i > FPS * 3:
                page.evaluate(START_JS)
                result = page.evaluate(TICK_JS)
            max_score = max(max_score, result.get("score", 0))
            max_combo = max(max_combo, result.get("combo", 0))
            page.screenshot(path=str(FRAMES_DIR / f"frame_{i:04d}.png"))

        print(f"  Max score: {max_score}  |  Max combo: {max_combo}")
        browser.close()

    return max_score, max_combo


def export_mp4():
    cmd = [
        FFMPEG, "-y",
        "-framerate", str(FPS),
        "-i", str(FRAMES_DIR / "frame_%04d.png"),
        "-vf",
        "scale=1080:1920:force_original_aspect_ratio=decrease,"
        "pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0x060c1c,"
        "eq=brightness=0.03:saturation=1.08,"
        "format=yuv420p",
        "-c:v", "libx264",
        "-preset", "slow",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        str(FINAL_MP4),
    ]
    subprocess.run(cmd, check=True)


def main():
    print(f"▶ Vatreni Bro TikTok — {TOTAL_FRAMES} frames @ {FPS}fps ({DURATION_SEC}s)")
    print(f"  Source: {URL}")
    max_score, max_combo = render_frames()
    print("▶ Export MP4 …")
    export_mp4()
    shutil.rmtree(FRAMES_DIR, ignore_errors=True)
    size_mb = FINAL_MP4.stat().st_size / (1024 * 1024)
    print(f"✓ Fertig: {FINAL_MP4} ({size_mb:.1f} MB)")
    print(f"  Peak: {max_score} pts · combo {max_combo}")


if __name__ == "__main__":
    main()