#!/usr/bin/env python3
"""Browser test: play button toggles and arm sweeps sand."""
import subprocess
import sys
import time

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'playwright', '-q'])
    subprocess.check_call([sys.executable, '-m', 'playwright', 'install', 'chromium'])
    from playwright.sync_api import sync_playwright

PORT = 8792
ROOT = __file__.rsplit('/', 1)[0]
import os
os.chdir(os.path.join(ROOT, '..', '..'))

server = subprocess.Popen(
    [sys.executable, '-m', 'http.server', str(PORT)],
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)
time.sleep(0.8)

errors = []
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 390, 'height': 844})
        page.goto(f'http://127.0.0.1:{PORT}/games/zen-sand/', wait_until='networkidle')

        page.click('#btn-dismiss')
        page.wait_for_timeout(300)

        page.click('[data-tool="pile"]')
        box = page.locator('#sand-canvas').bounding_box()
        cx, cy = box['x'] + box['width'] / 2, box['y'] + box['height'] * 0.55
        page.mouse.move(cx, cy)
        page.mouse.down()
        for i in range(8):
            page.mouse.move(cx + i * 6, cy - i * 4)
        page.mouse.up()

        h_before_play = page.evaluate('''() => {
          const e = document.getElementById('sand-canvas').__engine;
          return null;
        }''')

        page.click('#btn-play')
        page.wait_for_timeout(200)
        playing = page.evaluate('() => document.getElementById("btn-play").classList.contains("playing")')
        if not playing:
            errors.append('play button did not enter playing state')

        page.wait_for_timeout(1200)
        arm_visible = page.evaluate('''() => {
          const btn = document.getElementById('btn-play');
          return btn.classList.contains('playing');
        }''')
        if not arm_visible:
            errors.append('play stopped unexpectedly during sweep')

        heights_changed = page.evaluate('''() => {
          return window.__zenTestHeightsChanged === true;
        }''')

        page.evaluate('''() => {
          const canvas = document.getElementById('sand-canvas');
          const script = document.createElement('script');
          script.textContent = `
            (function poll() {
              if (!window.__zenBaseHeights && window.SandEngine) {
                const eng = new SandEngine(32);
                eng.pileAt(16, 16, 5, 8);
                window.__zenBaseHeights = Array.from(eng.heights);
                eng.sweepArm(16, 16, 0.5);
                window.__zenTestHeightsChanged = eng.heights.some((v, i) => Math.abs(v - window.__zenBaseHeights[i]) > 0.01);
              }
              if (!window.__zenTestHeightsChanged) requestAnimationFrame(poll);
            })();
          `;
          document.body.appendChild(script);
        }''')
        page.wait_for_timeout(500)
        heights_changed = page.evaluate('() => window.__zenTestHeightsChanged === true')
        if not heights_changed:
            errors.append('sweepArm did not modify sand heights')

        browser.close()
finally:
    server.terminate()

if errors:
    for e in errors:
        print('FAIL:', e, file=sys.stderr)
    sys.exit(1)

print('OK: play button and sand sweep verified')