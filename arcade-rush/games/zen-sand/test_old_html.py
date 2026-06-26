#!/usr/bin/env python3
"""Old cached HTML (onclick) + new main.js must keep Play running."""
import subprocess, sys, time
from playwright.sync_api import sync_playwright

PORT = 8795
ROOT = __import__('pathlib').Path(__file__).parent.parent.parent
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT)], cwd=ROOT,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.6)

try:
    with sync_playwright() as p:
        page = p.chromium.launch(headless=True).new_page(viewport={'width': 390, 'height': 844})
        page.goto(f'http://127.0.0.1:{PORT}/games/zen-sand/', wait_until='networkidle')
        page.evaluate('''() => {
          const b = document.getElementById("btn-play");
          b.setAttribute("onclick", "return zenTogglePlay(event)");
        }''')
        page.locator('#btn-play').click()
        page.wait_for_timeout(300)
        if not page.evaluate('() => SandApp.running'):
            print('FAIL: old onclick broke play', file=sys.stderr)
            sys.exit(1)
        page.wait_for_timeout(2000)
        if not page.evaluate('() => SandApp.running'):
            print('FAIL: play stopped', file=sys.stderr)
            sys.exit(1)
        print('OLD HTML OK')
finally:
    srv.terminate()