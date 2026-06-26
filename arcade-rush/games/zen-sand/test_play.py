#!/usr/bin/env python3
import subprocess
import sys
import time
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'playwright', '-q'])
    subprocess.check_call([sys.executable, '-m', 'playwright', 'install', 'chromium'])
    from playwright.sync_api import sync_playwright

PORT = 8793
ROOT = Path(__file__).parent.parent.parent
server = subprocess.Popen(
    [sys.executable, '-m', 'http.server', str(PORT)],
    cwd=ROOT,
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

        page.click('[data-tool="pile"]')
        box = page.locator('#sand-canvas').bounding_box()
        cx = box['x'] + box['width'] * 0.55
        cy = box['y'] + box['height'] * 0.58
        page.mouse.click(cx, cy)
        page.mouse.down()
        for i in range(10):
            page.mouse.move(cx + i * 4, cy + i * 3)
        page.mouse.up()

        max_before = page.evaluate('() => window.__zenState().maxH')
        if max_before < 0.5:
            errors.append(f'pile did not raise sand ({max_before})')

        angle0 = page.evaluate('() => window.__zenState().armAngle')
        page.evaluate('window.zenTogglePlay()')
        page.wait_for_timeout(300)
        if not page.evaluate('() => document.getElementById("btn-play").classList.contains("playing")'):
            errors.append('play not active after zenTogglePlay')

        page.wait_for_timeout(2500)
        state = page.evaluate('() => window.__zenState()')
        if abs(state['armAngle'] - angle0) < 0.2:
            errors.append(f'stick did not rotate ({angle0} -> {state["armAngle"]})')
        if state['maxH'] >= max_before * 0.85:
            errors.append(f'sand not flattened ({max_before} -> {state["maxH"]})')

        stick = page.evaluate('() => window.zenTogglePlay && typeof window.zenTogglePlay === "function"')
        if not stick:
            errors.append('zenTogglePlay missing')

        browser.close()
finally:
    server.terminate()

if errors:
    for e in errors:
        print('FAIL:', e, file=sys.stderr)
    sys.exit(1)
print('OK: spinner play works')