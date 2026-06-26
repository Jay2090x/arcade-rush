#!/usr/bin/env python3
"""Simulate mobile ghost clicks: rapid double click + legacy onclick."""
import subprocess, sys, time
from playwright.sync_api import sync_playwright

PORT = 8795
ROOT = __import__('pathlib').Path(__file__).parent.parent.parent
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT)], cwd=ROOT,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.6)
errors = []

try:
    with sync_playwright() as p:
        page = p.chromium.launch(headless=True).new_page(viewport={'width': 390, 'height': 844})
        page.goto(f'http://127.0.0.1:{PORT}/games/zen-sand/', wait_until='networkidle')
        btn = page.locator('#btn-play')

        btn.click()
        page.wait_for_timeout(30)
        btn.click()
        page.wait_for_timeout(400)
        if not page.evaluate('() => SandApp.running'):
            errors.append('double click stopped play')

        page.evaluate('() => SandApp.stop()')
        page.evaluate('() => { SandApp.playLock = 0; }')

        page.evaluate('''() => {
          const b = document.getElementById("btn-play");
          b.setAttribute("onclick", "return zenTogglePlay(event)");
        }''')
        btn.click()
        page.wait_for_timeout(30)
        page.evaluate('() => SandApp.togglePlay()')
        page.wait_for_timeout(400)
        if not page.evaluate('() => SandApp.running'):
            errors.append('onclick+toggle stopped play')

        page.wait_for_timeout(2000)
        if not page.evaluate('() => SandApp.running'):
            errors.append('play stopped after 2s')
finally:
    srv.terminate()

if errors:
    for e in errors:
        print('FAIL:', e, file=sys.stderr)
    sys.exit(1)
print('DOUBLE-TAP OK')