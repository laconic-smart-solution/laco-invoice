@echo off
setlocal
cd /d "%~dp0"
if not exist .venv (
  python -m venv .venv
)
call .venv\Scripts\activate.bat
pip install -r requirements.txt
playwright install chromium
echo.
echo [INFO] Starting tiktok-shop-scrape on port 8090...
echo [INFO] Health: http://localhost:8090/api/v1/healthz
echo [INFO] Login first: python login.py --seller-id YOUR_SHOP_ID
uvicorn app:app --host 0.0.0.0 --port 8090 --reload
