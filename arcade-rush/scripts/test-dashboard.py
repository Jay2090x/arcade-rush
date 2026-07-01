#!/usr/bin/env python3
"""Browser test for dashboard rendering."""
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent

MOCK_REPORT = {
    "visits": 142,
    "sessions": 89,
    "gameStarts": 56,
    "conversionRate": "39.4",
    "firstEvent": 1719000000000,
    "lastEvent": 1719500000000,
    "last7": [
        {"date": f"2026-06-{22+i}", "visits": 8 + i * 4, "starts": 3 + i, "sessions": 6 + i}
        for i in range(7)
    ],
    "sources": [
        {"name": "TikTok", "count": 58, "pct": "40.8"},
        {"name": "Direkt", "count": 42, "pct": "29.6"},
        {"name": "Instagram", "count": 22, "pct": "15.5"},
        {"name": "WhatsApp", "count": 12, "pct": "8.5"},
    ],
    "referrers": [{"name": "tiktok.com", "count": 58}],
    "utm": [{"name": "tiktok · social · launch", "count": 45}],
    "countries": [{"name": "AT", "count": 72}],
    "languages": [{"name": "de-AT", "count": 80}],
    "devices": [{"name": "Mobil", "count": 98}],
    "browsers": [{"name": "Safari", "count": 62}],
    "pages": [{"name": "/", "count": 90}],
    "landingPages": [{"name": "/", "count": 110}],
    "games": [
        {"slug": "vatreni-bro", "visits": 52, "starts": 38, "conversion": "73.1"},
        {"slug": "sky-drift", "visits": 20, "starts": 10, "conversion": "50.0"},
    ],
    "recent": [
        {"t": 1719500000000, "e": "page_view", "source": "TikTok", "page": "/", "game": None, "device": "Mobil", "country": "AT"},
        {"t": 1719499400000, "e": "game_start", "source": "Direkt", "page": "/games/vatreni-bro/", "game": "vatreni-bro", "device": "Desktop", "country": "DE"},
    ],
}


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.add_init_script("""
            sessionStorage.setItem('arcade_admin_unlock', 'rush-at');
            localStorage.setItem('arcade_rush_analytics', JSON.stringify({
                visits: 12, uniqueSessions: ['a','b'], gameVisits: {}, gameStarts: { 'vatreni-bro': 3 },
                gameOvers: {}, totalPlayTimeSec: 600, events: [],
                sources: { TikTok: 5 }, referrers: {}, utm: {}, devices: { Mobil: 8 },
                browsers: { Safari: 6 }, countries: { AT: 10 },
                firstVisit: Date.now() - 432000000, lastVisit: Date.now(),
                firstSource: 'TikTok', firstReferrer: ''
            }));
        """)

        def handle_analytics(route):
            if route.request.method == "GET":
                route.fulfill(status=200, content_type="application/json", body=json.dumps(MOCK_REPORT))
            else:
                route.fulfill(status=200, content_type="application/json", body='{"ok":true,"ingested":0}')

        page.route("**/.netlify/functions/analytics", handle_analytics)
        page.route("**/.netlify/functions/stats**", lambda r: r.fulfill(
            status=200, content_type="application/json", body='{"value":142,"key":"visits"}'
        ))

        page.goto("http://127.0.0.1:8877/dashboard.html", wait_until="networkidle")

        checks = [
            ("title", page.title(), "Arcade Rush — Analytics"),
            ("kpi count", page.locator(".kpi").count(), 8),
            ("live status", page.locator("#live-status.live").count(), 1),
            ("sources rows", page.locator("#sources-table tbody tr").count(), 4),
            ("chart cols", page.locator(".chart-col").count(), 7),
            ("games rows", page.locator("#games-table tbody tr").count(), 2),
            ("activity", page.locator(".activity-item").count(), 2),
            ("traffic h2", page.locator('h2:has-text("Traffic-Quellen")').count(), 1),
        ]

        failed = [(n, a, e) for n, a, e in checks if a != e]
        if failed:
            print("FAILED:")
            for n, a, e in failed:
                print(f"  {n}: got {a}, expected {e}")
            page.screenshot(path=ROOT / "scripts/dashboard-test-fail.png", full_page=True)
            browser.close()
            sys.exit(1)

        print("OK — dashboard UI renders all sections")
        browser.close()


if __name__ == "__main__":
    main()