#!/usr/bin/env python3
import sys
from pathlib import Path
ROOT = Path(__file__).parent
ok = fail = 0

def check(c, m):
    global ok, fail
    if c: ok += 1
    else: fail += 1; print('FAIL:', m, file=sys.stderr)

for f in ['index.html', 'css/style.css', 'js/main.js', 'js/sand.js', 'js/audio.js']:
    check((ROOT / f).is_file(), f'missing {f}')

html = (ROOT / 'index.html').read_text()
check('zenTogglePlay' in html, 'play handler')
check('spinner-arm' in html, 'DOM arm')

main = (ROOT / 'js/main.js').read_text()
check('setInterval' in main and 'togglePlay' in main, 'play loop')
check('drawStick' in main, 'canvas stick')

sand = (ROOT / 'js/sand.js').read_text()
check('spin(' in sand and 'flattenWedge' in sand, 'spinner physics')

print(f'\n{ok} passed, {fail} failed')
sys.exit(1 if fail else 0)