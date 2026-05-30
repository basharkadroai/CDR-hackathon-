# PowerShell script to fix git and push updates
Write-Host "Fixing Git and pushing updates..." -ForegroundColor Cyan
Write-Host ""

# Kill git processes
Write-Host "Stopping git processes..." -ForegroundColor Yellow
Get-Process git -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Remove lock files
Write-Host "Removing lock files..." -ForegroundColor Yellow
Remove-Item ".git\index.lock" -Force -ErrorAction SilentlyContinue
Remove-Item ".git\objects\pack\*.idx" -Force -ErrorAction SilentlyContinue

# Run git gc
Write-Host "Running git gc..." -ForegroundColor Yellow
git gc --prune=now

# Add changes
Write-Host "Adding changes..." -ForegroundColor Yellow
git add .

# Commit
Write-Host "Committing..." -ForegroundColor Yellow
git commit -m "Fix: Enhanced CDR error handling with detailed debugging logs"

# Push
Write-Host "Pushing to origin branch..." -ForegroundColor Yellow
git push origin origin

Write-Host ""
Write-Host "Done! Check: https://github.com/Smiley617/CDR-hackathon-" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Read URGENT_FIX_INSTRUCTIONS.md for testing steps" -ForegroundColor Cyan
