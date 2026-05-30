@echo off
echo Fixing Git lock issue and pushing updates...
echo.

REM Kill any git processes
taskkill /F /IM git.exe 2>nul
timeout /t 2 /nobreak >nul

REM Remove lock files
del /F /Q ".git\index.lock" 2>nul
del /F /Q ".git\objects\pack\*.idx" 2>nul
del /F /Q ".git\objects\pack\*.pack" 2>nul

echo Git locks cleared!
echo.

REM Run git garbage collection to fix pack files
echo Running git gc...
git gc --prune=now
echo.

REM Add all changes
echo Adding changes...
git add .
echo.

REM Commit changes
echo Committing changes...
git commit -m "Fix: Enhanced CDR error handling and debugging + troubleshooting guide"
echo.

REM Push to origin branch
echo Pushing to GitHub (origin branch)...
git push origin origin
echo.

echo Done! Check https://github.com/Smiley617/CDR-hackathon-
pause
