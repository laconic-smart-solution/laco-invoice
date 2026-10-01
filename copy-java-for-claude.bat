@echo off
rem Copies laco-invoice Java sources to a shallow folder so Claude can read them.
rem Read-only for the original files: nothing is moved or deleted.
cd /d "%~dp0"
set "SRC=server\src\main\java\com\laconic\lacoinvoice"
set "DST=_java_src"
if not exist "%SRC%" (
  echo [ERROR] %SRC% not found. Put this file in the laco-invoice folder.
  pause
  exit /b 1
)
robocopy "%SRC%" "%DST%" *.java /E /NFL /NDL /NJH /NP
echo.
echo [DONE] Copied to %cd%\%DST%  - you can delete that folder after Claude finishes.
pause
