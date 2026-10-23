@echo off
chcp 65001 >nul
cd /d "%~dp0"
REM If our own AI Academy service already runs, reuse it.
powershell -NoProfile -Command "try { $v=Invoke-RestMethod -Uri 'http://127.0.0.1:4386/api/status' -TimeoutSec 2; if($v.ok -and $v.version -eq '0.4.2-rc.4') { exit 0 } } catch {}; exit 1"
if not errorlevel 1 (
  start "" "http://127.0.0.1:4386/"
  exit /b 0
)
REM Never take over a different app's occupied port.
powershell -NoProfile -Command "if(Get-NetTCPConnection -LocalPort 4386 -State Listen -ErrorAction SilentlyContinue){exit 1}else{exit 0}"
if errorlevel 1 (
  echo Port 4386 occupied. AI Academy not started.
  pause
  exit /b 1
)
start "" "http://127.0.0.1:4386/"
node server.mjs
pause
