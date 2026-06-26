#!/usr/bin/env python3
"""Smoke tests for Zen Sand game files and engine logic."""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent
passed = 0
failed = 0


def ok(cond, msg):
    global passed, failed
    if cond:
        passed += 1
    else:
        failed += 1
        print(f"FAIL: {msg}", file=sys.stderr)


required = [
    "index.html", "css/style.css",
    "js/config.js", "js/sand-engine.js", "js/renderer.js",
    "js/audio.js", "js/i18n.js", "js/app.js",
]
for f in required:
    ok((ROOT / f).is_file(), f"missing {f}")

html = (ROOT / "index.html").read_text()
ok("sand-canvas" in html, "canvas element")
ok("btn-play" in html, "play button")
ok("sand-engine.js" in html, "engine script")
ok("analytics.js" in html, "analytics script")

for js in ["js/sand-engine.js", "js/renderer.js", "js/app.js"]:
    text = (ROOT / js).read_text()
    ok("window." in text or "class " in text, f"{js} exports code")

# Hub integration
hub = ROOT.parent.parent
ok((hub / "index.html").read_text().find("zen-sand") > 0, "hub links zen-sand")
ok("zen_name" in (hub / "js/i18n.js").read_text(), "hub i18n zen strings")

print(f"\n{passed} passed, {failed} failed")
sys.exit(1 if failed else 0)