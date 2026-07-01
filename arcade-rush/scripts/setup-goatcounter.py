#!/usr/bin/env python3
"""GoatCounter Signup für Arcade Rush."""
import secrets
import string
from pathlib import Path

from playwright.sync_api import sync_playwright

ACCOUNT = "arcaderush"
SITE_DOMAIN = "jay2090x.github.io/arcade-rush"
EMAIL = "wohnung20@gmx.at"
PASSWORD = "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(16))
OUT = Path(__file__).resolve().parents[1] / "goatcounter-credentials.txt"


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("https://www.goatcounter.com/signup", wait_until="networkidle", timeout=60000)

        page.fill('#code', ACCOUNT)
        page.fill('#link_domain', SITE_DOMAIN)
        page.fill('#email', EMAIL)
        page.fill('#password', PASSWORD)
        page.fill('#turing_test', '9')

        page.click('button[type="submit"], input[type="submit"]')
        page.wait_for_timeout(4000)

        url = page.url
        body = page.content().lower()
        ok = "dashboard" in url or "sign in" in body or "log in" in body or "created" in body or ACCOUNT in url

        if not ok and "error" in body:
            page.screenshot(path=str(OUT.with_suffix(".png")))
            print("Signup may have failed — check screenshot")
            print("URL:", url)

        count_url = f"https://{ACCOUNT}.goatcounter.com/count"
        OUT.write_text(
            f"Dashboard: https://{ACCOUNT}.goatcounter.com/\n"
            f"Count URL: {count_url}\n"
            f"Email: {EMAIL}\n"
            f"Password: {PASSWORD}\n",
            encoding="utf-8",
        )
        print(f"COUNT_URL={count_url}")
        print(f"CREDS_FILE={OUT}")
        browser.close()


if __name__ == "__main__":
    main()