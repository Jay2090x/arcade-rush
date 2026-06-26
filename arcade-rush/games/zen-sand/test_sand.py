#!/usr/bin/env python3
import sys
from pathlib import Path

ROOT = Path(__file__).parent
ok = 0
fail = 0

def check(cond, msg):
    global ok, fail
    if cond: ok += 1
    else:
        fail += 1
        print('FAIL:', msg, file=sys.stderr)

for f in ['index.html', 'css/style.css', 'js/main.js', 'js/sand.js', 'js/audio.js']:
    check((ROOT / f).is_file(), f'missing {f}')

html = (ROOT / 'index.html').read_text()
check('SandApp.togglePlay' in html, 'inline play handler')
check('spinner-arm' in html, 'DOM spinner arm')
check('id="sand"' in html, 'sand canvas')

main = (ROOT / 'js/main.js').read_text()
check('togglePlay' in main and 'startSpin' in main, 'play logic')
check('requestAnimationFrame' in main, 'animation loop')

sand = (ROOT / 'js/sand.js').read_text()
check('spin(' in sand and '_wedgeFlatten' in sand, 'spinner physics')

print(f'\n{ok} passed, {fail} failed')
sys.exit(1 if fail else 0)