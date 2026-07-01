#!/usr/bin/env python3
"""Live production test for analytics dashboard."""
import sys
from playwright.sync_api import sync_playwright

URL = "https://arcade-rush.netlify.app/dashboard.html"


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.add_init_script("sessionStorage.setItem('arcade_admin_unlock', 'rush-at');")
        page.goto(URL, wait_until="networkidle", timeout=30000)

        checks = [
            ("title", page.title(), "Arcade Rush — Analytics"),
            ("kpi", page.locator(".kpi").count() >= 8, True),
            ("sources section", page.locator('h2:has-text("Traffic-Quellen")').count(), 1),
            ("referrers section", page.locator('h2:has-text("Top Referrer")').count(), 1),
            ("chart or empty", page.locator(".chart-col, .empty-state").count() >= 1, True),
        ]

        # If live data connected, status should be live
        live = page.locator("#live-status.live").count()
        print(f"live status: {live}")

        failed = [(n, a, e) for n, a, e in checks if a != e]
        if failed:
            print("FAILED:")
            for n, a, e in failed:
                print(f"  {n}: got {a}, expected {e}")
            browser.close()
            sys.exit(1)

        status_text = page.locator("#live-status .status-text").inner_text()
        visits = page.locator(".kpi").first.locator(".kpi-val").inner_text()
        print(f"OK — dashboard live at {URL}")
        print(f"  status: {status_text}")
        print(f"  global visits kpi: {visits}")
        browser.close()


if __name__ == "__main__":
    main()