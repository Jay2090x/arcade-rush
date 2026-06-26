#!/usr/bin/env python3
import subprocess, sys, time
from playwright.sync_api import sync_playwright

errors = []
logs = []

for url in [
    'https://arcade-rush.netlify.app/games/zen-sand/',
    'http://127.0.0.1:8795/games/zen-sand/',
]:
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={'width': 390, 'height': 844})
            page.on('pageerror', lambda e: logs.append(f'ERR@{url}: {e}'))
            page.goto(url, wait_until='networkidle', timeout=60000)
            page.wait_for_timeout(500)

            has_app = page.evaluate('() => typeof SandApp !== "undefined" && SandApp.arm != null')
            if not has_app:
                errors.append(f'{url}: SandApp not ready')
                browser.close()
                continue

            page.click('#btn-play')
            page.wait_for_timeout(400)
            running = page.evaluate('() => SandApp.running')
            if not running:
                errors.append(f'{url}: not running after click')

            a0 = page.evaluate('() => SandApp.angle')
            page.wait_for_timeout(1500)
            a1 = page.evaluate('() => SandApp.angle')
            arm0 = page.evaluate('() => SandApp.arm.style.transform')
            arm1 = page.evaluate('() => getComputedStyle(SandApp.arm).transform')

            if abs(a1 - a0) < 0.3:
                errors.append(f'{url}: angle {a0:.2f}->{a1:.2f}')
            if arm0 == 'rotate(0deg)' and a0 == a1:
                pass
            print(f'OK {url}: running={running} angle {a0:.2f}->{a1:.2f} arm={arm1[:40]}')
            browser.close()
    except Exception as ex:
        errors.append(f'{url}: {ex}')

for l in logs:
    print(l)
if errors:
    for e in errors:
        print('FAIL:', e, file=sys.stderr)
    sys.exit(1)
print('ALL OK')