@echo off
setlocal
cd /d "E:\CHATGPT\projects\ai-academy"
if not exist "evidence\g5" mkdir "evidence\g5"
call npm test > "evidence\g5\revalidation-node.log" 2>&1
if errorlevel 1 (echo NODE_TEST_FAIL & exit /b 1)
echo NODE_TEST_PASS
call npm run verify > "evidence\g5\revalidation-verify.log" 2>&1
if errorlevel 1 (echo SNAPSHOT_VERIFY_FAIL & exit /b 1)
echo SNAPSHOT_VERIFY_PASS
call npm run audit:filenames > "evidence\g5\revalidation-audit.log" 2>&1
if errorlevel 1 (echo FILENAME_AUDIT_FAIL & exit /b 1)
echo FILENAME_AUDIT_PASS
call npm run study:analyze > "evidence\g5\revalidation-study-empty.log" 2>&1
if errorlevel 1 (echo EMPTY_RESEARCH_FAIL & exit /b 1)
echo EMPTY_RESEARCH_PASS
call npm run test:browser > "evidence\g5\revalidation-browser.log" 2>&1
if errorlevel 1 (echo EDGE_BROWSER_FAIL & exit /b 1)
echo EDGE_BROWSER_PASS
echo G5_REVALIDATION_COMPLETE
exit /b 0
