#!/usr/bin/env python3
"""Arcade Rush TikTok — große Website-Sicht, Hub-Scroll, Vatreni-Gameplay."""
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
HUB_URL = "https://arcade-rush.netlify.app/"
GAME_URL = "https://arcade-rush.netlify.app/games/vatreni-bro/"
FPS = 30
HUB_SEC = 7
GAME_SEC = 13
TOTAL_FRAMES = FPS * (HUB_SEC + GAME_SEC)
HUB_FRAMES = FPS * HUB_SEC

HUB_SETUP_JS = r"""
(() => {
  if (document.getElementById('tt-style')) return;
  const style = document.createElement('style');
  style.id = 'tt-style';
  style.textContent = `
    html, body {
      overflow: hidden !important;
      background: #070b18 !important;
    }
    .hub-toolbar, .hub-footer, #share-modal, #share-toast { display: none !important; }
    .hub {
      transform: scale(1.28);
      transform-origin: top center;
      will-change: transform;
      padding-bottom: 120px;
    }
    .hero { padding-top: 28px !important; }
    .hero h1 { font-size: 2.6rem !important; }
    .hero-sub { font-size: 1.05rem !important; }
    .game-card.tt-pulse {
      box-shadow: 0 0 0 3px #FFD54F, 0 16px 48px rgba(255,213,79,0.35) !important;
      transform: scale(1.03) !important;
    }
    .tt-bar {
      position: fixed;
      left: 0; right: 0; bottom: 0;
      z-index: 99999;
      pointer-events: none;
      padding: 18px 16px 28px;
      background: linear-gradient(0deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 70%, transparent 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    .tt-site {
      font: 900 30px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
      color: #FFC107;
      letter-spacing: 0.06em;
      text-shadow: 0 0 24px rgba(255,193,7,0.55), 0 3px 12px rgba(0,0,0,0.9);
      padding: 12px 22px;
      border-radius: 16px;
      background: rgba(10,14,39,0.75);
      border: 2px solid rgba(255,193,7,0.45);
    }
    .tt-hook {
      font: 800 22px/1.2 Outfit, system-ui, sans-serif;
      color: #fff;
      text-align: center;
      text-shadow: 0 2px 14px rgba(0,0,0,0.9);
      padding: 0 12px;
    }
    .tt-badge {
      position: fixed;
      top: 44px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 99998;
      pointer-events: none;
      font: 800 13px Outfit, system-ui, sans-serif;
      color: #fff;
      padding: 8px 16px;
      border-radius: 999px;
      background: rgba(200,16,46,0.88);
      border: 1px solid rgba(255,255,255,0.2);
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
  `;
  document.head.appendChild(style);

  const bar = document.createElement('div');
  bar.className = 'tt-bar';
  bar.innerHTML = `
    <div class="tt-hook">4 kostenlose Spiele · kein Download 🎮</div>
    <div class="tt-site">arcade-rush.netlify.app</div>
  `;
  document.body.appendChild(bar);

  const badge = document.createElement('div');
  badge.className = 'tt-badge';
  badge.textContent = 'Arcade Rush';
  document.body.appendChild(badge);
})();
"""

HUB_TICK_JS = r"""
(frame) => {
  const hub = document.querySelector('.hub');
  const cards = [...document.querySelectorAll('.game-card')];
  if (!hub) return;

  const t = frame / 30;
  let scroll = 0;
  let pulseIdx = 0;

  if (t < 2.2) {
    scroll = t * 38;
    pulseIdx = 0;
  } else if (t < 4.2) {
    scroll = 84 + (t - 2.2) * 52;
    pulseIdx = 1;
  } else if (t < 5.8) {
    scroll = 188 + (t - 4.2) * 48;
    pulseIdx = 2;
  } else {
    scroll = 255 + Math.sin((t - 5.8) * 3) * 6;
    pulseIdx = 3;
  }

  hub.style.transform = `scale(1.28) translateY(${-scroll}px)`;
  cards.forEach((c, i) => c.classList.toggle('tt-pulse', i === pulseIdx));
  return { scroll, pulseIdx };
}
"""

GAME_SETUP_JS = r"""
(() => {
  if (document.getElementById('tt-style')) return;
  const style = document.createElement('style');
  style.id = 'tt-style';
  style.textContent = `
    .overlay, .tutorial-overlay, .btn-lang, .btn-sound { display: none !important; }
    #hud { opacity: 1 !important; }
    .hud-top .best-pill { display: none !important; }
    .score-panel { margin-top: 72px !important; }
    .tt-bar {
      position: fixed;
      left: 0; right: 0; bottom: 0;
      z-index: 99999;
      pointer-events: none;
      padding: 14px 16px 26px;
      background: linear-gradient(0deg, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.5) 75%, transparent 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .tt-site {
      font: 900 32px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
      color: #FFC107;
      letter-spacing: 0.06em;
      text-shadow: 0 0 28px rgba(255,193,7,0.6), 0 3px 14px rgba(0,0,0,0.95);
      padding: 14px 24px;
      border-radius: 18px;
      background: rgba(10,14,39,0.82);
      border: 2px solid rgba(255,193,7,0.5);
    }
    .tt-hook {
      font: 800 20px/1.2 Outfit, system-ui, sans-serif;
      color: #fff;
      text-align: center;
      text-shadow: 0 2px 12px rgba(0,0,0,0.9);
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

  const bar = document.createElement('div');
  bar.className = 'tt-bar';
  bar.innerHTML = `
    <div class="tt-hook">Schaffst du 20? 🔥 Vatreni Bro</div>
    <div class="tt-site">arcade-rush.netlify.app</div>
  `;
  document.body.appendChild(bar);

  const flash = document.createElement('div');
  flash.className = 'tt-flash';
  flash.id = 'tt-flash';
  flash.textContent = 'PERFECT!';
  document.body.appendChild(flash);

  window.__lastScore = 0;
})();
"""

GAME_TICK_JS = r"""
(() => {
  if (!window.__ttFrames) window.__ttFrames = { flash: 0, bump: 0 };
  const tt = window.__ttFrames;
  if (tt.flash > 0) tt.flash--;
  if (tt.bump > 0) tt.bump--;

  const sync = () => {
    const f = document.getElementById('tt-flash');
    const s = document.getElementById('score');
    if (f) f.classList.toggle('show', tt.flash > 0);
    if (s) s.classList.toggle('bump', tt.bump > 0);
  };

  if (typeof Game === 'undefined' || Game.state !== 'playing') {
    sync();
    return { score: 0, state: typeof Game !== 'undefined' ? Game.state : null };
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
  const el = document.getElementById('score');
  if (el) el.textContent = String(score);

  if (score > window.__lastScore) {
    window.__lastScore = score;
    tt.flash = 14;
    tt.bump = 8;
  }
  sync();
  return { score, state: Game.state };
})();
"""

GAME_START_JS = r"""
(() => {
  Game.start();
  Game.state = 'playing';
  Game.resetEntities();
  Game.ball.vy = 2.6;
  window.__lastScore = 0;
  window.__ttFrames = { flash: 0, bump: 0 };
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

        print("  Phase 1: Hub (große Website)")
        page.goto(HUB_URL, wait_until="networkidle", timeout=45000)
        time.sleep(0.8)
        page.evaluate(HUB_SETUP_JS)

        for i in range(HUB_FRAMES):
            page.evaluate(HUB_TICK_JS, i)
            page.screenshot(path=str(FRAMES_DIR / f"frame_{i:04d}.png"))

        print("  Phase 2: Vatreni Bro Gameplay")
        page.goto(GAME_URL, wait_until="networkidle", timeout=45000)
        time.sleep(0.8)
        page.evaluate(GAME_SETUP_JS)
        page.evaluate(GAME_START_JS)
        time.sleep(0.25)

        max_score = 0
        for i in range(HUB_FRAMES, TOTAL_FRAMES):
            result = page.evaluate(GAME_TICK_JS)
            if result.get("state") == "dead" and i > HUB_FRAMES + FPS * 2:
                page.evaluate(GAME_START_JS)
                result = page.evaluate(GAME_TICK_JS)
            max_score = max(max_score, result.get("score", 0))
            page.screenshot(path=str(FRAMES_DIR / f"frame_{i:04d}.png"))

        print(f"  Max score: {max_score}")
        browser.close()

    return max_score


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
    print(f"▶ Arcade Rush TikTok — {TOTAL_FRAMES} frames ({HUB_SEC + GAME_SEC}s)")
    print(f"  Hub: {HUB_URL}")
    max_score = render_frames()
    print("▶ Export MP4 …")
    export_mp4()
    shutil.rmtree(FRAMES_DIR, ignore_errors=True)
    size_mb = FINAL_MP4.stat().st_size / (1024 * 1024)
    print(f"✓ Fertig: {FINAL_MP4} ({size_mb:.1f} MB)")
    print(f"  Peak score: {max_score}")


if __name__ == "__main__":
    main()