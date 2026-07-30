"""Interactive TikTok login → persist Playwright session in laco-invoice DB.

Preferred flow (avoids seller OTP when partner already verified):
  partner login → switch into seller shop → save session

Usage:
  python login.py --seller-id YOUR_SHOP_ID --mode partner
  python login.py --seller-id YOUR_SHOP_ID --mode partner --display-name "My Shop"
  python login.py --seller-id YOUR_SHOP_ID --mode seller
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

from config import BASE_DIR, get_settings
from db import init_db, upsert_session

LOGIN_MODES = ("partner", "seller")


async def _goto(page, url: str, label: str) -> None:
    print(f"→ Opening {label}: {url}")
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=90_000)
    except Exception as exc:
        print(f"  Warning: navigation issue ({exc}). Continue in the browser if the page loaded.")


async def _wait_enter(prompt: str) -> None:
    print()
    print(prompt)
    await asyncio.to_thread(input, "")


async def _login_partner_then_shop(
    page,
    *,
    seller_id: str,
    shop_hint: str | None,
) -> None:
    """Partner Center login, then switch into the target seller shop."""
    settings = get_settings()
    partner_url = settings.tiktok_partner_center_url
    seller_url = settings.tiktok_seller_center_url

    print("=" * 60)
    print("MODE: partner → shop")
    print(f"Target seller_id (session key): {seller_id}")
    if shop_hint:
        print(f"Shop hint (find this in the UI): {shop_hint}")
    print("=" * 60)

    await _goto(page, partner_url, "Partner Center")

    print(
        """
Step 1 — Partner login
  1. Sign in with your PARTNER / agency account
  2. Complete OTP if asked (once is enough for this browser session)
  3. Wait until Partner Center home is fully loaded
"""
    )
    await _wait_enter("Press Enter after partner login is complete...")

    # Land on Seller Center; partner sessions often can open/switch shops without re-OTP.
    await _goto(page, seller_url, "Seller Center")
    # Common entry points for shop switch / homepage (region UI varies).
    for path in ("/homepage", "/shop", "/account/shop", "/"):
        try:
            await page.goto(
                f"{seller_url.rstrip('/')}{path}",
                wait_until="domcontentloaded",
                timeout=45_000,
            )
            await page.wait_for_timeout(1_000)
            break
        except Exception:
            continue

    hint_line = f' named "{shop_hint}"' if shop_hint else f" for seller_id={seller_id}"
    print(
        f"""
Step 2 — Switch into the seller shop
  1. Open the shop switcher / shop list in Seller Center
  2. Select the shop{hint_line}
  3. Confirm the dashboard shows THAT shop (orders, products, shop name)
  4. Do not leave this tab on Partner-only pages — stay on Seller Center for that shop
"""
    )
    await _wait_enter(
        "Press Enter only when the correct seller shop dashboard is loaded..."
    )


async def _login_seller_direct(page, *, seller_id: str) -> None:
    """Direct seller login (OTP usually required)."""
    settings = get_settings()
    print("=" * 60)
    print("MODE: seller (direct)")
    print(f"Target seller_id (session key): {seller_id}")
    print("=" * 60)

    await _goto(page, settings.tiktok_seller_center_url, "Seller Center")
    print(
        """
Step 1 — Seller login
  1. Sign in with the SELLER account
  2. Complete OTP if asked
  3. Wait until that shop's Seller Center dashboard is loaded
"""
    )
    await _wait_enter("Press Enter when the seller dashboard is fully loaded...")


async def _login(
    seller_id: str,
    display_name: str | None,
    mode: str,
    shop_hint: str | None,
) -> None:
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print(
            "playwright is not installed.\n"
            "Run: pip install -r requirements.txt\n"
            "Then: playwright install chromium"
        )
        sys.exit(1)

    settings = get_settings()
    init_db()
    (BASE_DIR / "session").mkdir(parents=True, exist_ok=True)
    backup_path = BASE_DIR / "session" / f"{seller_id}.json"

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=False)
        context = await browser.new_context(
            viewport={"width": 1400, "height": 900},
            locale="en-US",
        )
        page = await context.new_page()

        if mode == "partner":
            await _login_partner_then_shop(
                page,
                seller_id=seller_id,
                shop_hint=shop_hint or display_name,
            )
        else:
            await _login_seller_direct(page, seller_id=seller_id)

        # Quick sanity: print final URL so operator can spot wrong page
        try:
            print(f"Final URL before save: {page.url}")
        except Exception:
            pass

        state = await context.storage_state()
        state_json = json.dumps(state)
        await browser.close()

    upsert_session(seller_id, state_json, display_name=display_name)
    backup_path.write_text(state_json, encoding="utf-8")
    print()
    print(f"Saved session to laco-invoice (tiktok_seller_sessions) seller_id={seller_id}")
    print(f"Invoice API: {settings.laco_invoice_url}")
    print(f"Backup file: {backup_path}")
    print("Start scrape API: uvicorn app:app --host 0.0.0.0 --port 8090")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Save TikTok Seller Center session (partner→shop recommended)"
    )
    parser.add_argument(
        "--seller-id",
        required=True,
        help="Stable shop/seller id key stored in tiktok_seller_sessions",
    )
    parser.add_argument("--display-name", default=None, help="Optional label")
    parser.add_argument(
        "--shop-hint",
        default=None,
        help="Shop name text to look for when switching (defaults to display-name)",
    )
    parser.add_argument(
        "--mode",
        choices=LOGIN_MODES,
        default="partner",
        help="partner = partner login then switch shop (default); seller = direct seller OTP login",
    )
    args = parser.parse_args()
    asyncio.run(
        _login(
            args.seller_id.strip(),
            args.display_name,
            args.mode,
            args.shop_hint,
        )
    )


if __name__ == "__main__":
    main()
