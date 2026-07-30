# TikTok Shop Scrape (temporary)

Playwright-based bridge that exposes the **same marketplace REST contract** as
`communication-service/app/tiktok-service`, so **laco-invoice** can sync orders/products
before TikTok Partner Open API credentials/docs are ready.

**Seller sessions are stored in laco-invoice Oracle** (`tiktok_seller_sessions`), not SQLite.

## Architecture

```
laco-invoice (TIKTOK_SHOP_SCRAPPING=true)
   │  HTTP /api/v1/orders|products
   ▼
tiktok-shop-scrape (:8090)
   │  read/write session via X-Gateway-Secret
   ▼
laco-invoice /api/v1/internal/tiktok-seller-sessions
   │
   ▼
Oracle table: tiktok_seller_sessions
```

## Setup

```bash
cd laco-invoice/tiktok-shop-scrape
python -m venv .venv
pip install -r requirements.txt
playwright install chromium
cp .env.example .env
# set LACO_INVOICE_URL + GATEWAY_SECRET to match invoice
```

Start **laco-invoice** first (Hibernate `ddl-auto=update` creates `tiktok_seller_sessions`).

## Save seller session (partner → shop)

Default mode is **partner** (login partner, switch shop, skip seller OTP when partner is already verified):

```bash
# laco-invoice must be running
python login.py --seller-id YOUR_SHOP_ID --display-name "My TikTok Shop"
# same as:
python login.py --seller-id YOUR_SHOP_ID --mode partner --shop-hint "My TikTok Shop"
```

Steps in the browser:
1. Sign into **Partner Center** (`TIKTOK_PARTNER_CENTER_URL`) — OTP once if asked  
2. Press Enter in the terminal  
3. Seller Center opens — switch to the target shop  
4. Press Enter when that shop’s dashboard is visible  

Direct seller login (OTP on seller account):

```bash
python login.py --seller-id YOUR_SHOP_ID --mode seller
```

Session JSON is written to Oracle via:

`POST /api/v1/internal/tiktok-seller-sessions`

(+ optional backup file under `session/`).

## Run scrape API

```bash
uvicorn app:app --host 0.0.0.0 --port 8090 --reload
```

## laco-invoice env

```text
TIKTOK_SHOP_SCRAPPING=true
TIKTOK_SCRAPE_URL=http://localhost:8090
GATEWAY_SECRET=hello
```

When Partner is ready: `TIKTOK_SHOP_SCRAPPING=false`.
