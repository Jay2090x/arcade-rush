#!/usr/bin/env python3
import sys
import time
from playwright.sync_api import sync_playwright

URL = 'https://arcade-rush.netlify.app/games/zen-sand/'
errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    logs = []
    page.on('pageerror', lambda e: logs.append(f'JS ERROR: {e}'))
    page.on('console', lambda m: logs.append(f'CONSOLE {m.type}: {m.text}') if m.type == 'error' else None)

    page.goto(URL, wait_until='networkidle', timeout=60000)
    page.click('#btn-dismiss', timeout=5000)
    page.wait_for_timeout(400)

    # pile sand
    page.click('[data-tool="pile"]')
    box = page.locator('#sand-canvas').bounding_box()
    cx = box['x'] + box['width'] * 0.5
    cy = box['y'] + box['height'] * 0.52
    page.mouse.click(cx, cy)
    page.mouse.down()
    for i in range(12):
        page.mouse.move(cx + i * 5, cy - i * 3)
    page.mouse.up()
    page.wait_for_timeout(300)

    snap_before = page.screenshot(full_page=False)

    page.locator('#btn-play').dispatch_event('pointerup')
    page.wait_for_timeout(200)
    state = page.evaluate('''() => ({
      playing: document.getElementById('btn-play').classList.contains('playing'),
      armVisible: document.querySelector('#sand-canvas') && true,
      label: document.querySelector('.play-label')?.textContent,
    })''')
    if not state['playing']:
        errors.append(f'play state false after click: {state}')

    page.wait_for_timeout(2000)
    snap_after = page.screenshot(full_page=False)

    metrics = page.evaluate('''() => {
      const canvas = document.getElementById('sand-canvas');
      const ctx = canvas.getContext('2d');
      const w = canvas.width, h = canvas.height;
      const d1 = ctx.getImageData(0, 0, w, h).data;
      return { w, h, bytes: d1.length };
    }''')

    # inject probe into page context via evaluate on existing scripts
    angle_delta = page.evaluate('''async () => {
      await new Promise(r => setTimeout(r, 1500));
      const btn = document.getElementById('btn-play');
      return {
        playing: btn.classList.contains('playing'),
        pressed: btn.getAttribute('aria-pressed'),
        label: document.querySelector('.play-label')?.textContent,
      };
    }''')

    if not angle_delta.get('playing'):
        errors.append(f'play stopped within 1.5s: {angle_delta}')

    if snap_before == snap_after:
        errors.append('screenshot unchanged after 2s play (no visual update)')

    for line in logs:
        errors.append(line)

    browser.close()

if errors:
    for e in errors:
        print('FAIL:', e, file=sys.stderr)
    sys.exit(1)
print('OK: live play works, visuals change')