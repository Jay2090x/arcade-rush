#!/usr/bin/env python3
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
        for label, url in [('local', f'http://127.0.0.1:{PORT}/games/zen-sand/'),
                           ('live', 'https://arcade-rush.netlify.app/games/zen-sand/')]:
            page = p.chromium.launch(headless=True).new_page(viewport={'width': 390, 'height': 844})
            page.goto(url, wait_until='networkidle', timeout=60000)
            page.wait_for_timeout(400)

            box = page.locator('#sand').bounding_box()
            page.mouse.click(box['x'] + box['width'] * 0.6, box['y'] + box['height'] * 0.62)
            page.mouse.down()
            for i in range(6):
                page.mouse.move(box['x'] + box['width'] * 0.6 + i * 6, box['y'] + box['height'] * 0.62 + i * 4)
            page.mouse.up()

            pile = page.evaluate('() => Math.max(...SandApp.sand.h)')
            if pile < 1:
                errors.append(f'{label}: pile failed ({pile})')

            a0 = page.evaluate('() => SandApp.angle')
            page.click('#btn-play')
            page.wait_for_timeout(500)
            if not page.evaluate('() => SandApp.running'):
                errors.append(f'{label}: not running')
            page.wait_for_timeout(2000)
            a1 = page.evaluate('() => SandApp.angle')
            flat = page.evaluate('() => Math.max(...SandApp.sand.h)')

            if abs(a1 - a0) < 0.5:
                errors.append(f'{label}: no rotation {a0:.2f}->{a1:.2f}')
            if pile > 2 and flat > pile * 0.5:
                errors.append(f'{label}: not flattened {pile}->{flat}')
            print(f'OK {label}: rot {a0:.1f}->{a1:.1f} pile {pile:.1f}->{flat:.1f}')
            page.close()
finally:
    srv.terminate()

if errors:
    for e in errors: print('FAIL:', e, file=sys.stderr)
    sys.exit(1)
print('ALL TESTS PASSED')