#!/usr/bin/env python3
"""Arcade Rush TikTok — 4s Hub-Promo, große Website, URL oben."""
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
FPS = 30
DURATION_SEC = 4
TOTAL_FRAMES = FPS * DURATION_SEC

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
      padding-top: 118px;
      padding-bottom: 40px;
    }
    .hero { padding-top: 12px !important; }
    .hero h1 { font-size: 2.5rem !important; }
    .hero-sub { font-size: 1rem !important; }
    .hero-stats { display: none !important; }
    .game-card.tt-pulse {
      box-shadow: 0 0 0 3px #FFD54F, 0 16px 48px rgba(255,213,79,0.35) !important;
      transform: scale(1.03) !important;
    }
    .tt-safe-top {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 34%;
      z-index: 9998;
      pointer-events: none;
      background: linear-gradient(180deg,
        rgba(6,12,28,0.82) 0%,
        rgba(6,12,28,0.45) 60%,
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
  `;
  document.head.appendChild(style);

  const grad = document.createElement('div');
  grad.className = 'tt-safe-top';
  document.body.appendChild(grad);

  const brand = document.createElement('div');
  brand.className = 'tt-brand';
  brand.innerHTML = `
    <div class="tt-pill">4 Spiele · kostenlos 🎮</div>
    <div class="tt-sub">Direkt im Browser — kein Download</div>
    <div class="tt-url">arcade-rush.netlify.app</div>
  `;
  document.body.appendChild(brand);
})();
"""

HUB_TICK_JS = r"""
(frame) => {
  const hub = document.querySelector('.hub');
  const cards = [...document.querySelectorAll('.game-card')];
  if (!hub) return;

  const t = frame / 30;
  const dur = 4;
  const p = Math.min(t / dur, 1);
  const scroll = p * p * 220;
  const pulseIdx = Math.min(3, Math.floor(p * 4));

  hub.style.transform = `scale(1.28) translateY(${-scroll}px)`;
  cards.forEach((c, i) => c.classList.toggle('tt-pulse', i === pulseIdx));
  return { scroll, pulseIdx };
}
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

        page.goto(HUB_URL, wait_until="networkidle", timeout=45000)
        time.sleep(0.8)
        page.evaluate(HUB_SETUP_JS)

        for i in range(TOTAL_FRAMES):
            page.evaluate(HUB_TICK_JS, i)
            page.screenshot(path=str(FRAMES_DIR / f"frame_{i:04d}.png"))

        browser.close()


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
    print(f"▶ Arcade Rush TikTok — {TOTAL_FRAMES} frames ({DURATION_SEC}s)")
    print(f"  Hub: {HUB_URL}")
    render_frames()
    print("▶ Export MP4 …")
    export_mp4()
    shutil.rmtree(FRAMES_DIR, ignore_errors=True)
    size_mb = FINAL_MP4.stat().st_size / (1024 * 1024)
    print(f"✓ Fertig: {FINAL_MP4} ({size_mb:.1f} MB)")


if __name__ == "__main__":
    main()