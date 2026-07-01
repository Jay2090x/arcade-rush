#!/usr/bin/env python3
"""Verify live analytics updates after page visit."""
import json
import sys
import time
import urllib.request

from playwright.sync_api import sync_playwright

SITE = "https://arcade-rush.netlify.app"
SESSION = f"live-verify-{int(time.time())}"


def get_report():
    with urllib.request.urlopen(f"{SITE}/.netlify/functions/analytics") as r:
        return json.loads(r.read())


def main():
    before = get_report()
    before_visits = before.get("visits", 0)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"{SITE}/games/vatreni-bro/?_t={int(time.time())}", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(2500)
        text = page.locator("#btn-play").inner_text().strip()
        promos = page.locator(".go-game-card").count()
        browser.close()

    if text != "Tapni za igru":
        print(f"FAILED: expected Croatian default, got {text!r}")
        sys.exit(1)
    if promos != 2:
        print(f"FAILED: expected 2 promo cards, got {promos}")
        sys.exit(1)

    after = None
    for _ in range(8):
        time.sleep(1)
        after = get_report()
        if after.get("visits", 0) > before_visits:
            break

    if not after or after.get("visits", 0) <= before_visits:
        print(f"FAILED: visits did not increase ({before_visits} -> {after.get('visits') if after else '?'})")
        sys.exit(1)

    print("OK — live site updated")
    print(f"  Croatian UI: {text}")
    print(f"  promo cards: {promos}")
    print(f"  visits: {before_visits} -> {after.get('visits')}")
    print(f"  lastEvent: {after.get('lastEvent')}")


if __name__ == "__main__":
    main()