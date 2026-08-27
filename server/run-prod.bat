@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"

if not exist "mvnw.cmd" (
  echo [ERROR] mvnw.cmd not found. Run this script from the laco-invoice\server folder.
  exit /b 1
)

if exist "C:\Program Files\Java\jdk-21\bin\java.exe" (
  set "JAVA_HOME=C:\Program Files\Java\jdk-21"
  set "PATH=%JAVA_HOME%\bin;%PATH%"
) else if exist "C:\Program Files\Eclipse Adoptium\jdk-21*\bin\java.exe" (
  for /d %%D in ("C:\Program Files\Eclipse Adoptium\jdk-21*") do (
    set "JAVA_HOME=%%D"
    set "PATH=%%D\bin;%PATH%"
  )
)

if exist ".env" (
  echo [INFO] Loading environment variables from .env...
  for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do (
    if not "%%~A"=="" set "%%~A=%%~B"
  )
) else if exist ".env.prod" (
  echo [INFO] Loading environment variables from .env.prod...
  for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env.prod") do (
    if not "%%~A"=="" set "%%~A=%%~B"
  )
)

set "SPRING_PROFILES_ACTIVE=prod"
set "JAR=target\lacoinvoice-0.0.1-SNAPSHOT.jar"

if defined SERVER_PORT (
  echo Checking for existing process on port %SERVER_PORT%...
  for /f "tokens=5" %%P in ('netstat -ano ^| findstr /C:":%SERVER_PORT% " ^| findstr LISTENING') do (
    if not "%%P"=="0" (
      echo Stopping PID %%P on port %SERVER_PORT%...
      taskkill /PID %%P /F >nul 2>&1
    )
  )
  timeout /t 1 /nobreak >nul
)

echo [INFO] Building production JAR package...
call mvnw.cmd -DskipTests package
if errorlevel 1 (
  echo [ERROR] Maven package build failed.
  exit /b 1
)

if not exist "%JAR%" (
  echo [ERROR] JAR file not found: %cd%\%JAR%
  exit /b 1
)

echo [INFO] Starting lacoinvoice in PRODUCTION mode (profile: prod)...
echo.
java -jar "%JAR%" --spring.profiles.active=prod %*
exit /b %ERRORLEVEL%
