#!/usr/bin/env python3
import sys
import time
from playwright.sync_api import sync_playwright

URL = "https://arcade-rush.netlify.app/dashboard.html"


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.add_init_script("sessionStorage.setItem('arcade_admin_unlock', 'rush-at');")
        page.goto(f"{URL}?_={int(time.time())}", wait_until="domcontentloaded", timeout=30000)
        page.wait_for_selector("#last-updated:has-text('Dashboard geladen')", timeout=15000)

        text = page.locator("#last-updated").inner_text()
        counter_kpi = page.locator(".kpi").first.locator(".kpi-val").inner_text()

        if "Dashboard geladen:" not in text:
            print("FAIL: missing 'Dashboard geladen' label")
            print(text)
            sys.exit(1)
        if "Letztes Besucher-Event:" not in text:
            print("FAIL: missing event label")
            sys.exit(1)
        if "Counter-Besuche" not in text:
            print("FAIL: missing counter line")
            sys.exit(1)

        counter_val = int(counter_kpi.replace(".", "").replace("–", "0") or "0")
        if counter_val < 50:
            print(f"FAIL: counter KPI too low: {counter_val}")
            sys.exit(1)

        print("OK — dashboard shows fresh fetch + counter visits")
        print(f"  KPI counter: {counter_kpi}")
        print(f"  footer: {text[:120]}...")
        browser.close()


if __name__ == "__main__":
    main()