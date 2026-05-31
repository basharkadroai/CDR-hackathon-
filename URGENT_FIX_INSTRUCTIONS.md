# 🚨 URGENT: Fix Git Lock & Test CDR

## What I Just Fixed

I've enhanced the CDR error handling with **detailed debugging logs** that will show you exactly where the process is failing. The console will now show step-by-step progress with emojis (✅ = success, ❌ = error).

### Files Updated:
1. **`lib/cdr-service.ts`** - Added comprehensive error logging and automatic network switching
2. **`TROUBLESHOOTING.md`** - Complete troubleshooting guide
3. **`fix-git-and-push.bat`** - Script to fix git and push updates

## Step 1: Fix Git Lock Issue (Do This First!)

There's a git process stuck asking for input. Here's how to fix it:

### Option A: Manual Fix (Recommended)
1. Open Task Manager (Ctrl+Shift+Esc)
2. Find any `git.exe` processes
3. Right-click → End Task
4. Close all terminals/command prompts
5. Open a NEW command prompt
6. Navigate to project:
   ```cmd
   cd "c:\Users\hp\Documents\two-to-ship-ai repo\CDR-hackathon"
   ```
7. Run the fix script:
   ```cmd
   fix-git-and-push.bat
   ```

### Option B: Quick Manual Commands
If the script doesn't work, run these commands one by one:

```cmd
cd "c:\Users\hp\Documents\two-to-ship-ai repo\CDR-hackathon"

REM Kill git processes
taskkill /F /IM git.exe

REM Wait 2 seconds
timeout /t 2

REM Remove lock files
del /F /Q ".git\index.lock"

REM Fix pack files
git gc --prune=now

REM Add changes
git add .

REM Commit
git commit -m "Fix: Enhanced CDR error handling and debugging"

REM Push to origin branch
git push origin origin
```

## Step 2: Test the Enhanced Error Handling

Once git is fixed and pushed, test the app:

1. **Start the dev server** (if not running):
   ```cmd
   npm run dev
   ```

2. **Open browser** to http://localhost:3000

3. **Open Developer Console** (Press F12)

4. **Try to create a Deal Room**:
   - Go to "Create Deal Room"
   - Fill in the form
   - Upload a small test file
   - Add your wallet address
   - Click "Create Deal Room"

5. **Watch the Console** - You'll see detailed logs like:
   ```
   🔧 Initializing CDR client...
   ✅ WASM initialized
   ✅ Wallet detected
   🔐 Requesting wallet connection...
   ✅ Wallet connected: 0x...
   🌐 Checking network...
   ```

6. **If it fails**, the console will show EXACTLY where it failed with a ❌ emoji

## Step 3: What to Look For

### Success Path:
```
🔧 Initializing CDR client...
✅ WASM initialized
✅ Wallet detected
✅ Wallet connected
✅ Current chain ID: 1513
✅ Viem clients created
✅ CDR client created successfully!
🚀 Attempting to use real CDR...
🔑 Getting global public key...
✅ Global public key obtained
⬆️ Uploading to CDR...
✅ Upload successful!
```

### Common Failure Points:

#### If you see: "❌ Wrong network"
**Solution:** The app will automatically try to switch to Story Testnet. Click "Approve" in MetaMask.

#### If you see: "❌ WASM initialization failed"
**Solution:** 
1. Clear browser cache (Ctrl+Shift+Delete)
2. Refresh page (Ctrl+F5)
3. Try different browser (Chrome/Brave)

#### If you see: "❌ Failed to get global public key"
**Solution:**
1. Check internet connection
2. Verify Story RPC is working: https://aeneid.storyrpc.io
3. Try again in a few minutes

## Step 4: Quick Test with Mock Mode

If real CDR keeps failing, test the UI with mock mode:

1. Open `.env.local`
2. Change to:
   ```
   NEXT_PUBLIC_USE_MOCK_CDR=true
   ```
3. Restart dev server:
   ```cmd
   npm run dev
   ```
4. Test creating a deal room - should work instantly

This proves the UI works, and the issue is with CDR connection.

## Step 5: Verify GitHub Updates

After pushing, check: https://github.com/basharkadroai/CDR-hackathon-

You should see:
- Latest commit: "Fix: Enhanced CDR error handling and debugging"
- Updated files: `lib/cdr-service.ts`, `TROUBLESHOOTING.md`

## What the Enhanced Error Handling Does

### 1. **Automatic Network Switching**
If you're on the wrong network, the app will:
- Detect it
- Try to switch to Story Testnet automatically
- If Story Testnet isn't added, it will add it for you

### 2. **Step-by-Step Logging**
Every step of the CDR initialization is logged:
- WASM initialization
- Wallet detection
- Wallet connection
- Network verification
- Client creation
- File upload

### 3. **Detailed Error Messages**
When something fails, you get:
- Error name
- Error message
- Stack trace
- Helpful tips

### 4. **Automatic Fallback**
If real CDR fails, it automatically falls back to mock mode so you can still test the UI.

## Testing Checklist

- [ ] Git lock fixed
- [ ] Changes pushed to GitHub
- [ ] Dev server running
- [ ] Browser console open (F12)
- [ ] MetaMask installed and unlocked
- [ ] Connected to Story Testnet
- [ ] Have IP tokens in wallet
- [ ] Tried creating a deal room
- [ ] Checked console logs for errors
- [ ] If failed, tried mock mode

## Next Steps After Testing

Once you identify the exact error from the console:

1. **Copy the full error message**
2. **Check `TROUBLESHOOTING.md`** for solutions
3. **If it's a network issue**: Wait and try again
4. **If it's a wallet issue**: Check MetaMask setup
5. **If it's a CDR SDK issue**: Use mock mode for now and report to Story team

## Quick Commands Reference

```cmd
# Fix git and push
cd "c:\Users\hp\Documents\two-to-ship-ai repo\CDR-hackathon"
fix-git-and-push.bat

# Start dev server
npm run dev

# Check git status
git status

# View recent commits
git log --oneline -5

# Check current branch
git branch
```

## Important Notes

- **Branch**: Make sure you're on `origin` branch (not `main`)
- **Network**: Must be on Story Testnet (Chain ID: 1513)
- **Tokens**: Need IP tokens for gas fees
- **Console**: Always keep F12 console open when testing

## Get Help

If you're still stuck after following these steps:

1. Take a screenshot of the browser console (F12)
2. Copy the full error message
3. Check which step failed (look for the last ✅ before the ❌)
4. Share the error details

The enhanced logging will make it much easier to diagnose the exact issue!
