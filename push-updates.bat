@echo off
echo Pushing latest updates to GitHub...
cd /d "c:\Users\hp\Documents\two-to-ship-ai repo\CDR-hackathon"
git add -A
git commit -m "Complete IP token integration with real CDR, dashboard updates, and testing guides"
git push origin origin --force
echo Done! Check https://github.com/Smiley617/CDR-hackathon-
pause
