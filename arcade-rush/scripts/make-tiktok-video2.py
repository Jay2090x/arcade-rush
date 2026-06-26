#!/usr/bin/env python3
"""Render Sky Drift TikTok video frame-by-frame (works in headless)."""
import os
import shutil
import subprocess
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT_DIR = Path("/Users/josip/Downloads")
FRAMES_DIR = OUT_DIR / "tiktok-video2-frames"
FINAL_MP4 = OUT_DIR / "tiktok-video2-sky-drift.mp4"
FFMPEG = os.path.expanduser("~/.local/bin/ffmpeg")
URL = "https://arcade-rush.netlify.app/games/sky-drift/"
FPS = 25
DURATION_SEC = 16
TOTAL_FRAMES = FPS * DURATION_SEC

SETUP_JS = """
(() => {
  if (document.getElementById('tt-style')) return;
  const style = document.createElement('style');
  style.id = 'tt-style';
  style.textContent = `
    .tt-hook {
      position: fixed; bottom: 148px; left: 16px; right: 16px;
      text-align: center; z-index: 9999; pointer-events: none;
      font: 800 24px/1.2 Outfit, system-ui, sans-serif;
      color: #fff;
      text-shadow: 0 2px 10px rgba(0,0,0,0.9);
    }
    .tt-url {
      position: fixed; bottom: 72px; left: 12px; right: 12px;
      text-align: center; z-index: 9999; pointer-events: none;
      font: 800 16px ui-monospace, monospace;
      color: #FFC107;
      background: rgba(0,0,0,0.5);
      padding: 10px 14px;
      border-radius: 12px;
    }
    .tt-plus {
      position: fixed; top: 44%; left: 50%;
      transform: translate(-50%,-50%) scale(0.6);
      z-index: 9999; pointer-events: none;
      font: 800 64px Outfit, system-ui, sans-serif;
      color: #FFD700;
      opacity: 0;
      text-shadow: 0 0 24px rgba(255,215,0,0.9), 0 4px 16px rgba(0,0,0,0.9);
      transition: opacity 0.12s, transform 0.3s ease-out;
    }
    .tt-plus.show { opacity: 1; transform: translate(-50%,-95%) scale(1.15); }
    #score.bump { transform: scale(1.3) !important; color: #FFE082 !important; transition: transform 0.12s; }
    .overlay { display: none !important; }
    .overlay.active { display: none !important; }
    #hud { opacity: 1 !important; }
  `;
  document.head.appendChild(style);
  const hook = document.createElement('div');
  hook.className = 'tt-hook';
  hook.textContent = 'Schaffst du 10? 🐦';
  document.body.appendChild(hook);
  const url = document.createElement('div');
  url.className = 'tt-url';
  url.textContent = 'arcade-rush.netlify.app';
  document.body.appendChild(url);
  const plus = document.createElement('div');
  plus.className = 'tt-plus';
  plus.id = 'tt-plus';
  plus.textContent = '+1';
  document.body.appendChild(plus);
  window.__lastScore = 0;
})();
"""

TICK_JS = """
(() => {
  if (!window.__ttFrames) window.__ttFrames = { plus: 0, bump: 0 };
  const tt = window.__ttFrames;
  if (tt.plus > 0) tt.plus--;
  if (tt.bump > 0) tt.bump--;

  const syncOverlay = () => {
    const pop = document.getElementById('tt-plus');
    const el = document.getElementById('score');
    if (pop) pop.classList.toggle('show', tt.plus > 0);
    if (el) el.classList.toggle('bump', tt.bump > 0);
  };

  if (typeof Game === 'undefined' || Game.state !== 'playing') {
    syncOverlay();
    return { score: typeof Game !== 'undefined' ? Game.score : 0, state: typeof Game !== 'undefined' ? Game.state : null };
  }

  const bird = Game.bird;
  const pipe = Game.pipes.find(p => !p.scored && p.x + 66 > bird.x - 50);
  if (pipe && pipe.x < bird.x + 280) {
    const mid = (pipe.topH + pipe.bottomY) / 2;
    if (bird.y > mid + 12) Game.flap();
  } else if (bird.y > 300) {
    Game.flap();
  }

  Game.update();
  Game.renderer.render(Game.getRenderState());

  const score = Game.score;
  const el = document.getElementById('score');
  if (el) el.textContent = String(score);

  if (score > window.__lastScore) {
    window.__lastScore = score;
    tt.plus = 12;
    tt.bump = 6;
  }
  syncOverlay();
  return { score, state: Game.state };
})();
"""


def render_frames():
    if FRAMES_DIR.exists():
        shutil.rmtree(FRAMES_DIR)
    FRAMES_DIR.mkdir(parents=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        page.goto(URL, wait_until="networkidle", timeout=30000)
        time.sleep(0.8)

        page.evaluate(SETUP_JS)
        page.evaluate("""
          Game.start();
          Game.state = 'playing';
          window.__lastScore = 0;
          window.__ttFrames = { plus: 0, bump: 0 };
          document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
          document.getElementById('hud').classList.add('visible');
          document.getElementById('score').textContent = '0';
          Game.spawnTimer = CONFIG.PIPE_SPAWN_INTERVAL - 8;
          const gy = Game.renderer.groundY;
          const gap = Game.gap;
          const topH = Math.round(gy * 0.32);
          Game.pipes.push({
            x: Game.bird.x + 200,
            topH,
            bottomY: topH + gap,
            scored: false,
            nearMissed: false,
          });
          Game.flap();
        """)

        RESTART_JS = """
          Game.start();
          Game.state = 'playing';
          window.__lastScore = 0;
          window.__ttFrames = { plus: 0, bump: 0 };
          document.getElementById('score').textContent = '0';
          Game.spawnTimer = CONFIG.PIPE_SPAWN_INTERVAL - 8;
          const gy = Game.renderer.groundY;
          const gap = Game.gap;
          const topH = Math.round(gy * 0.32);
          Game.pipes.push({
            x: Game.bird.x + 200,
            topH,
            bottomY: topH + gap,
            scored: false,
            nearMissed: false,
          });
          Game.flap();
        """

        max_score = 0
        for i in range(TOTAL_FRAMES):
            result = page.evaluate(TICK_JS)
            if result.get("state") == "dead" and i > FPS * 2:
                page.evaluate(RESTART_JS)
                result = page.evaluate(TICK_JS)
            max_score = max(max_score, result.get("score", 0))
            page.screenshot(path=str(FRAMES_DIR / f"frame_{i:04d}.png"))

        print(f"  Max score reached: {max_score}")
        browser.close()

    return max_score


def export_mp4():
    cmd = [
        FFMPEG, "-y",
        "-framerate", str(FPS),
        "-i", str(FRAMES_DIR / "frame_%04d.png"),
        "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0x0a0e27,format=yuv420p",
        "-c:v", "libx264", "-preset", "fast", "-crf", "22",
        "-pix_fmt", "yuv420p",
        str(FINAL_MP4),
    ]
    subprocess.run(cmd, check=True)


def main():
    print(f"▶ Rendere {TOTAL_FRAMES} Frames ({DURATION_SEC}s) …")
    max_score = render_frames()
    print("▶ Export MP4 …")
    export_mp4()
    shutil.rmtree(FRAMES_DIR, ignore_errors=True)
    print(f"✓ Fertig: {FINAL_MP4}")
    print(f"  Höchster Score im Video: {max_score}")


if __name__ == "__main__":
    main()