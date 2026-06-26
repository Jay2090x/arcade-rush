#!/usr/bin/env python3
import subprocess, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright

PORT = 8794
ROOT = Path(__file__).parent.parent.parent
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT)], cwd=ROOT,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
errors = []

try:
    with sync_playwright() as p:
        page = p.chromium.launch(headless=True).new_page(viewport={'width': 390, 'height': 844})
        page.goto(f'http://127.0.0.1:{PORT}/games/zen-sand/', wait_until='networkidle')

        box = page.locator('#sand').bounding_box()
        cx, cy = box['x'] + box['width'] * 0.58, box['y'] + box['height'] * 0.6
        page.mouse.down()
        for i in range(8):
            page.mouse.move(cx + i * 5, cy + i * 4)
        page.mouse.up()

        before = page.evaluate('() => Math.max(...SandApp.sand.h)')
        page.click('#btn-play')
        page.wait_for_timeout(300)
        if not page.evaluate('() => SandApp.running'):
            errors.append('SandApp.running false after play click')

        arm0 = page.evaluate('() => SandApp.arm.style.transform')
        page.wait_for_timeout(2000)
        arm1 = page.evaluate('() => SandApp.arm.style.transform')
        after = page.evaluate('() => Math.max(...SandApp.sand.h)')

        if arm0 == arm1:
            errors.append(f'arm did not rotate: {arm0}')
        if before > 0.5 and after >= before * 0.8:
            errors.append(f'sand not flattened {before} -> {after}')
finally:
    srv.terminate()

if errors:
    for e in errors: print('FAIL:', e, file=sys.stderr)
    sys.exit(1)
print('OK')