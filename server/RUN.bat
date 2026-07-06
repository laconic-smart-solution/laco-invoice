@echo off
setlocal
cd /d "%~dp0"

if not exist "mvnw.cmd" (
  echo [ERROR] mvnw.cmd not found. Run this script from the laco-invoice\server folder.
  exit /b 1
)

rem Optional: override Oracle / SSO via environment before starting
rem set DB_URL=jdbc:oracle:thin:@//localhost:1521/FREEPDB1
rem set DB_USERNAME=lacoinvoice
rem set DB_PASSWORD=your_password
rem set SSO_JWKS_URL=https://api-auths.laconic.co.th/v1/lcn-sso/auth/jwks.json
rem set SSO_APPLICATION_CODE=laco-invoice

echo [INFO] Starting lacoinvoice (profile: dev, port: 8080)...
echo [INFO] Swagger UI: http://localhost:8080/swagger-ui.html
echo.

call mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev %*
exit /b %errorlevel%
