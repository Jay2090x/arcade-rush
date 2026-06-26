#!/usr/bin/env python3
"""Simulate mobile ghost click: pointerup + click on Play."""
import subprocess, sys, time
from playwright.sync_api import sync_playwright

PORT = 8795
ROOT = __import__('pathlib').Path(__file__).parent.parent.parent
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT)], cwd=ROOT,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.6)

with sync_playwright() as p:
    page = p.chromium.launch(headless=True).new_page(viewport={'width': 390, 'height': 844})
    page.goto(f'http://127.0.0.1:{PORT}/games/zen-sand/', wait_until='networkidle')
    btn = page.locator('#btn-play')
    btn.dispatch_event('pointerup')
    page.wait_for_timeout(50)
    btn.click()
    page.wait_for_timeout(400)
    running = page.evaluate('() => SandApp.running')
    page.wait_for_timeout(2000)
    still = page.evaluate('() => SandApp.running')
    srv.terminate()
    if not running or not still:
        print(f'FAIL: running={running} still={still}', file=sys.stderr)
        sys.exit(1)
print('DOUBLE-TAP OK')