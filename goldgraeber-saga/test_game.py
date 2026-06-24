#!/usr/bin/env python3
"""Browser test for Goldgräber Saga."""
import json
import time
from playwright.sync_api import sync_playwright

URL = "http://localhost:8891/"
errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.on("pageerror", lambda e: errors.append(f"PAGE ERROR: {e}"))
    page.on("console", lambda m: errors.append(f"CONSOLE {m.type}: {m.text}") if m.type == "error" else None)

    page.goto(URL, wait_until="networkidle")
    time.sleep(2.5)  # splash

    # Clear save for clean test
    page.evaluate("localStorage.removeItem('goldgraeber_saga_v1'); location.reload();")
    time.sleep(2.5)

    state = page.evaluate("""() => ({
      gold: Game.state?.gold,
      miners: Game.state?.miners,
      taps: Game.state?.totalTaps,
      income: Game.getPassiveIncome(),
      gameVisible: document.getElementById('game')?.classList.contains('active'),
      quickBuyExists: !!document.getElementById('quick-buy-btn'),
    })""")
    print("INITIAL:", json.dumps(state, indent=2))

    gold_before = page.evaluate("Game.state.gold")
    page.click("#tap-zone", force=True)
    time.sleep(0.2)
    gold_after_tap = page.evaluate("Game.state.gold")
    print(f"TAP: {gold_before} -> {gold_after_tap}")

    # Click quick buy multiple ways
    page.click("#quick-buy-btn")
    time.sleep(0.3)
    after_buy = page.evaluate("""() => ({
      gold: Game.state.gold,
      miners: Game.state.miners.apprentice,
      income: Game.getPassiveIncome(),
      workers: document.querySelectorAll('.scene-worker').length,
    })""")
    print("AFTER BUY (no force):", json.dumps(after_buy, indent=2))

    gold_start = page.evaluate("Game.state.gold")
    time.sleep(2)
    gold_passive = page.evaluate("Game.state.gold")
    print(f"PASSIVE 2s: {gold_start} -> {gold_passive} (income={after_buy.get('income')})")

    page.click('[data-panel="miners"]')
    time.sleep(0.5)
    panel_open = page.evaluate("document.getElementById('panel-miners').classList.contains('active')")
    print(f"MINERS PANEL OPEN: {panel_open}")
    if panel_open:
        page.click('#miners-list .card[data-type="miner"]')
        time.sleep(0.3)
        print(f"MINERS AFTER CARD: {page.evaluate('Game.getTotalMiners()')}")

    if errors:
        print("\nERRORS:")
        for e in errors:
            print(" ", e)

    browser.close()