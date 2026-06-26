#!/usr/bin/env python3
"""Test Play on WebKit (Safari) with mobile tap simulation."""
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
        browser = p.webkit.launch(headless=True)
        ctx = browser.new_context(viewport={'width': 390, 'height': 844}, has_touch=True)
        page = ctx.new_page()
        page.goto(f'http://127.0.0.1:{PORT}/games/zen-sand/', wait_until='networkidle')

        page.locator('#btn-play').tap()
        page.wait_for_timeout(600)
        if not page.evaluate('() => SandApp.running'):
            errors.append('webkit: not running after tap')

        page.wait_for_timeout(2500)
        still = page.evaluate('() => SandApp.running')
        spinning = page.evaluate('() => document.body.classList.contains("spinning")')
        a1 = page.evaluate('() => SandApp.angle')

        if not still:
            errors.append('webkit: stopped after 2.5s (double-tap bug)')
        if not spinning:
            errors.append('webkit: body.spinning missing')
        if a1 < 0.5:
            errors.append(f'webkit: angle too low {a1}')

        browser.close()
finally:
    srv.terminate()

if errors:
    for e in errors: print('FAIL:', e, file=sys.stderr)
    sys.exit(1)
print('WEBKIT OK')