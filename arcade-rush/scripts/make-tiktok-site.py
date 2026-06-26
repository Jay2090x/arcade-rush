#!/usr/bin/env python3
"""Arcade Rush TikTok — 4s Vatreni pur, dann 15s mit Website-Einblendung oben."""
import os
import shutil
import subprocess
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT_DIR = Path("/Users/josip/Downloads")
FRAMES_DIR = OUT_DIR / "tiktok-site-frames"
FINAL_MP4 = OUT_DIR / "tiktok-arcade-rush.mp4"
FFMPEG = os.path.expanduser("~/.local/bin/ffmpeg")
GAME_URL = "https://arcade-rush.netlify.app/games/vatreni-bro/"
FPS = 30
PART1_SEC = 4
PART2_SEC = 15
TOTAL_FRAMES = FPS * (PART1_SEC + PART2_SEC)
PART1_FRAMES = FPS * PART1_SEC

GAME_SETUP_JS = r"""
(() => {
  if (document.getElementById('tt-style')) return;
  const style = document.createElement('style');
  style.id = 'tt-style';
  style.textContent = `
    .overlay, .tutorial-overlay, .btn-lang, .btn-sound { display: none !important; }
    #hud { opacity: 1 !important; }
    .hud-top .best-pill { display: none !important; }
    .score-panel { margin-top: 88px !important; }
    .tt-safe-top {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 32%;
      z-index: 9998;
      pointer-events: none;
      opacity: var(--tt-site-opacity, 0);
      transition: opacity 0.45s ease-out;
      background: linear-gradient(180deg,
        rgba(6,12,28,0.82) 0%,
        rgba(6,12,28,0.42) 58%,
        transparent 100%);
    }
    .tt-brand {
      position: fixed;
      top: 48px; left: 0; right: 0;
      z-index: 9999;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 0 18px;
      opacity: var(--tt-site-opacity, 0);
      transition: opacity 0.45s ease-out;
    }
    .tt-pill {
      font: 900 20px/1.2 Outfit, system-ui, sans-serif;
      color: #fff;
      text-align: center;
      padding: 12px 20px;
      border-radius: 16px;
      background: linear-gradient(135deg, rgba(200,16,46,0.92), rgba(140,8,32,0.78));
      border: 1.5px solid rgba(255,255,255,0.22);
      box-shadow: 0 8px 28px rgba(0,0,0,0.4);
    }
    .tt-sub {
      font: 700 14px/1.3 Outfit, system-ui, sans-serif;
      color: #FFE082;
      text-align: center;
      text-shadow: 0 2px 10px rgba(0,0,0,0.85);
    }
    .tt-url {
      font: 800 15px ui-monospace, SFMono-Regular, Menlo, monospace;
      color: #fff;
      letter-spacing: 0.05em;
      padding: 9px 18px;
      border-radius: 999px;
      background: rgba(0,0,0,0.5);
      border: 1px solid rgba(255,224,130,0.42);
      backdrop-filter: blur(8px);
    }
    .tt-flash {
      position: fixed;
      top: 42%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.75);
      z-index: 9999;
      pointer-events: none;
      font: 900 56px/1 Outfit, system-ui, sans-serif;
      color: #FFD54F;
      opacity: 0;
      text-shadow: 0 0 32px rgba(255,213,79,0.95), 0 4px 20px rgba(0,0,0,0.9);
      transition: opacity 0.1s, transform 0.22s cubic-bezier(0.2,1.2,0.4,1);
    }
    .tt-flash.show {
      opacity: 1;
      transform: translate(-50%, -56%) scale(1.1);
    }
    #score.bump {
      transform: scale(1.3) !important;
      color: #FFE082 !important;
      transition: transform 0.14s ease-out, color 0.14s;
    }
  `;
  document.head.appendChild(style);

  const grad = document.createElement('div');
  grad.className = 'tt-safe-top';
  document.body.appendChild(grad);

  const brand = document.createElement('div');
  brand.className = 'tt-brand';
  brand.innerHTML = `
    <div class="tt-pill">Schaffst du 20? 🔥🇭🇷</div>
    <div class="tt-sub">Kostenlos im Browser — kein Download</div>
    <div class="tt-url">arcade-rush.netlify.app</div>
  `;
  document.body.appendChild(brand);

  const flash = document.createElement('div');
  flash.className = 'tt-flash';
  flash.id = 'tt-flash';
  flash.textContent = 'PERFECT!';
  document.body.appendChild(flash);

  window.__lastScore = 0;
  window.__lastCombo = 0;
})();
"""

GAME_TICK_JS = r"""
(frame) => {
  if (!window.__ttFrames) window.__ttFrames = { flash: 0, bump: 0, combo: 0 };
  const tt = window.__ttFrames;
  if (tt.flash > 0) tt.flash--;
  if (tt.bump > 0) tt.bump--;
  if (tt.combo > 0) tt.combo--;

  const part1End = 4 * 30;
  let siteOpacity = 0;
  if (frame >= part1End) {
    const fade = Math.min((frame - part1End) / 18, 1);
    siteOpacity = fade;
  }
  document.documentElement.style.setProperty('--tt-site-opacity', String(siteOpacity));

  const sync = () => {
    const f = document.getElementById('tt-flash');
    const s = document.getElementById('score');
    if (f) f.classList.toggle('show', tt.flash > 0);
    if (s) s.classList.toggle('bump', tt.bump > 0);
  };

  if (typeof Game === 'undefined' || Game.state !== 'playing') {
    sync();
    return { score: 0, combo: 0, state: typeof Game !== 'undefined' ? Game.state : null };
  }

  const ball = Game.ball;
  const head = Game.headPoint();
  if (Game.awaitingHeader && !Game.headerDone && ball.vy > 0) {
    if (Game.perfectReady || (Game.headerReady && ball.y > head.y - 8)) {
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
    tt.combo = 18;
  }
  sync();
  return { score, combo, state: Game.state };
}
"""

GAME_START_JS = r"""
(() => {
  Game.start();
  Game.state = 'playing';
  Game.resetEntities();
  Game.ball.vy = 2.6;
  window.__lastScore = 0;
  window.__lastCombo = 0;
  window.__ttFrames = { flash: 0, bump: 0, combo: 0 };
  document.documentElement.style.setProperty('--tt-site-opacity', '0');
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

        page.goto(GAME_URL, wait_until="networkidle", timeout=45000)
        time.sleep(0.8)
        page.evaluate(GAME_SETUP_JS)
        page.evaluate(GAME_START_JS)
        time.sleep(0.3)

        max_score = 0
        max_combo = 0
        for i in range(TOTAL_FRAMES):
            result = page.evaluate(GAME_TICK_JS, i)
            if result.get("state") == "dead" and i > FPS * 2:
                page.evaluate(GAME_START_JS)
                result = page.evaluate(GAME_TICK_JS, i)
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
        "scale=1080:-2:force_original_aspect_ratio=increase,"
        "crop=1080:1920,"
        "eq=brightness=0.04:contrast=1.06:saturation=1.12,"
        "unsharp=3:3:0.6:3:3:0.0,"
        "format=yuv420p",
        "-c:v", "libx264",
        "-preset", "slow",
        "-crf", "17",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        str(FINAL_MP4),
    ]
    subprocess.run(cmd, check=True)


def main():
    total = PART1_SEC + PART2_SEC
    print(f"▶ Arcade Rush TikTok — {TOTAL_FRAMES} frames ({total}s)")
    print(f"  Teil 1: {PART1_SEC}s Vatreni (ohne Website)")
    print(f"  Teil 2: {PART2_SEC}s Vatreni + Website-Einblendung oben")
    max_score, max_combo = render_frames()
    print("▶ Export MP4 …")
    export_mp4()
    shutil.rmtree(FRAMES_DIR, ignore_errors=True)
    size_mb = FINAL_MP4.stat().st_size / (1024 * 1024)
    print(f"✓ Fertig: {FINAL_MP4} ({size_mb:.1f} MB)")
    print(f"  Peak: {max_score} pts · combo {max_combo}")


if __name__ == "__main__":
    main()