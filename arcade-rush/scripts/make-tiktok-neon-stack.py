#!/usr/bin/env python3
"""Arcade Rush TikTok — Neon Stack (Bricks): 4s pur, dann 15s mit Website oben."""
import os
import shutil
import subprocess
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT_DIR = Path("/Users/josip/Downloads")
FRAMES_DIR = OUT_DIR / "tiktok-neon-stack-frames"
FINAL_MP4 = OUT_DIR / "tiktok-neon-stack.mp4"
FFMPEG = os.path.expanduser("~/.local/bin/ffmpeg")
GAME_URL = os.environ.get(
    "GAME_URL",
    "http://127.0.0.1:8891/games/neon-stack/",
)
FPS = 30
PART1_SEC = 4
PART2_SEC = 15
TOTAL_FRAMES = FPS * (PART1_SEC + PART2_SEC)

GAME_SETUP_JS = r"""
(() => {
  if (document.getElementById('tt-style')) return;
  const style = document.createElement('style');
  style.id = 'tt-style';
  style.textContent = `
    .overlay, .btn-sound { display: none !important; }
    #hud { opacity: 1 !important; }
    .best-hud { display: none !important; }
    .score-wrap { margin-top: 72px !important; }
    .tt-safe-top {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 34%;
      z-index: 9998;
      pointer-events: none;
      opacity: var(--tt-site-opacity, 0);
      transition: opacity 0.45s ease-out;
      background: linear-gradient(180deg,
        rgba(8,10,30,0.88) 0%,
        rgba(8,10,30,0.45) 58%,
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
      background: linear-gradient(135deg, rgba(108,92,231,0.95), rgba(34,211,238,0.55));
      border: 1.5px solid rgba(255,255,255,0.22);
      box-shadow: 0 8px 28px rgba(0,0,0,0.45);
    }
    .tt-sub {
      font: 700 14px/1.3 Outfit, system-ui, sans-serif;
      color: #a5f3fc;
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
      border: 1px solid rgba(167,139,250,0.45);
      backdrop-filter: blur(8px);
    }
    .tt-flash {
      position: fixed;
      top: 44%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.75);
      z-index: 9999;
      pointer-events: none;
      font: 900 52px/1 Outfit, system-ui, sans-serif;
      color: #FFD54F;
      opacity: 0;
      text-shadow: 0 0 32px rgba(255,213,79,0.95), 0 4px 20px rgba(0,0,0,0.9);
      transition: opacity 0.1s, transform 0.22s cubic-bezier(0.2,1.2,0.4,1);
    }
    .tt-flash.show {
      opacity: 1;
      transform: translate(-50%, -58%) scale(1.08);
    }
    #score.bump {
      transform: scale(1.28) !important;
      color: #67e8f9 !important;
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
    <div class="tt-pill">Wie hoch schaffst du? 🧱</div>
    <div class="tt-sub">Neon Stack — gratis im Browser</div>
    <div class="tt-url">jay2090x.github.io/arcade-rush</div>
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
  if (!window.__ttFrames) window.__ttFrames = { flash: 0, bump: 0 };
  const tt = window.__ttFrames;
  if (tt.flash > 0) tt.flash--;
  if (tt.bump > 0) tt.bump--;

  const part1End = 4 * 30;
  let siteOpacity = 0;
  if (frame >= part1End) {
    siteOpacity = Math.min((frame - part1End) / 18, 1);
  }
  document.documentElement.style.setProperty('--tt-site-opacity', String(siteOpacity));

  const sync = () => {
    const f = document.getElementById('tt-flash');
    const s = document.getElementById('score');
    const c = document.getElementById('combo');
    if (f) f.classList.toggle('show', tt.flash > 0);
    if (s) s.classList.toggle('bump', tt.bump > 0);
    if (c && Game.combo > 1) c.textContent = `×${Game.combo}`;
  };

  if (typeof Game === 'undefined' || Game.state !== 'playing') {
    sync();
    return { score: 0, combo: 0, state: typeof Game !== 'undefined' ? Game.state : null };
  }

  if (Game.moving && Game.blocks.length) {
    const prev = Game.blocks[Game.blocks.length - 1];
    const offset = Math.abs(Game.moving.x - prev.x);
    const movingToward = (prev.x - Game.moving.x) * Game.direction > 0;
    if (movingToward && offset <= CONFIG.PERFECT_THRESHOLD + 2) {
      Game.drop();
    }
  }

  Game.update();
  Game.renderer.draw(Game.getRenderState());

  const score = Game.score;
  const combo = Game.combo;
  const el = document.getElementById('score');
  if (el) el.textContent = String(score);

  if (score > window.__lastScore) {
    window.__lastScore = score;
    tt.flash = 12;
    tt.bump = 8;
    const f = document.getElementById('tt-flash');
    if (f) f.textContent = combo > 1 ? `PERFECT ×${combo}` : 'PERFECT!';
  }
  window.__lastCombo = combo;
  sync();
  return { score, combo, state: Game.state };
}
"""

GAME_START_JS = r"""
(() => {
  if (Game.loopId) cancelAnimationFrame(Game.loopId);
  Game.loopId = null;
  Game.start();
  Game.state = 'playing';
  window.__lastScore = 0;
  window.__lastCombo = 0;
  window.__ttFrames = { flash: 0, bump: 0 };
  document.documentElement.style.setProperty('--tt-site-opacity', '0');
  document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
  document.getElementById('hud').classList.add('visible');
  document.getElementById('score').textContent = '0';
  const combo = document.getElementById('combo');
  if (combo) combo.textContent = '';
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

        page.goto(GAME_URL, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_function("typeof Game !== 'undefined' && typeof CONFIG !== 'undefined'", timeout=15000)
        time.sleep(0.6)
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

        print(f"  Max height: {max_score}  |  Max combo: {max_combo}")
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
        "eq=brightness=0.04:contrast=1.08:saturation=1.18,"
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
    print(f"▶ Neon Stack TikTok — {TOTAL_FRAMES} frames ({total}s)")
    print(f"  Teil 1: {PART1_SEC}s Gameplay (ohne Website)")
    print(f"  Teil 2: {PART2_SEC}s Gameplay + Website oben")
    max_score, max_combo = render_frames()
    print("▶ Export MP4 …")
    export_mp4()
    shutil.rmtree(FRAMES_DIR, ignore_errors=True)
    size_mb = FINAL_MP4.stat().st_size / (1024 * 1024)
    print(f"✓ Fertig: {FINAL_MP4} ({size_mb:.1f} MB)")
    print(f"  Peak: {max_score} Blöcke · combo {max_combo}")


if __name__ == "__main__":
    main()