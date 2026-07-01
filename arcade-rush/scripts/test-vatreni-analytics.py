#!/usr/bin/env python3
"""Test Vatreni Croatian default, game-over promo, analytics sync."""
import json
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
BASE = "http://127.0.0.1:8877"
ANALYTICS_POSTS = []


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        def on_analytics(route):
            if route.request.method == "POST":
                body = route.request.post_data or "{}"
                try:
                    ANALYTICS_POSTS.append(json.loads(body))
                except json.JSONDecodeError:
                    pass
                route.fulfill(status=200, content_type="application/json", body='{"ok":true,"ingested":1}')
            else:
                route.fulfill(status=200, content_type="application/json", body=json.dumps({
                    "visits": 10, "sessions": 5, "gameStarts": 3, "conversionRate": "30.0",
                    "lastEvent": int(time.time() * 1000), "last7": [], "sources": [], "referrers": [],
                    "utm": [], "countries": [], "languages": [], "devices": [], "browsers": [],
                    "pages": [], "landingPages": [], "games": [], "recent": [],
                }))

        page.route("**/.netlify/functions/analytics", on_analytics)
        page.route("**/.netlify/functions/stats**", lambda r: r.fulfill(
            status=200, content_type="application/json", body='{"value":10,"key":"visits"}'
        ))

        page.goto(f"{BASE}/games/vatreni-bro/", wait_until="networkidle")

        checks = [
            ("html lang hr", page.locator("html").get_attribute("lang"), "hr"),
            ("default tap play", page.locator("#btn-play").inner_text().strip(), "Tapni za igru"),
            ("lang btn shows EN", page.locator("#btn-lang").inner_text().strip(), "EN"),
            ("game over promo", page.locator(".go-game-card").count(), 2),
            ("sky link", page.locator('a.go-game-card[data-game="sky-drift"]').count(), 1),
            ("stack link", page.locator('a.go-game-card[data-game="neon-stack"]').count(), 1),
        ]

        failed = [(n, a, e) for n, a, e in checks if a != e]
        if failed:
            print("FAILED:")
            for n, a, e in failed:
                print(f"  {n}: got {repr(a)}, expected {repr(e)}")
            browser.close()
            sys.exit(1)

        # wait for analytics POST (immediate + debounced)
        page.wait_for_timeout(1500)
        if not ANALYTICS_POSTS:
            print("FAILED: no analytics POST received")
            browser.close()
            sys.exit(1)

        events = []
        for batch in ANALYTICS_POSTS:
            events.extend(batch.get("events", []))
        kinds = {e.get("e") for e in events}
        if "page_view" not in kinds:
            print("FAILED: page_view not in analytics posts", kinds)
            browser.close()
            sys.exit(1)

        print("OK — Croatian default, promo cards, analytics POST")
        print(f"  analytics batches: {len(ANALYTICS_POSTS)}, events: {kinds}")
        browser.close()


if __name__ == "__main__":
    main()