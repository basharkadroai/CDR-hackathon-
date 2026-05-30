# DealVault Troubleshooting Guide

## "Failed to create Deal Room" Error - Quick Fixes

### Step 1: Check Browser Console (F12)
Open your browser's developer console (press F12) and look for detailed error messages with emojis:
- ✅ = Success
- ❌ = Error
- ⚠️ = Warning

The console will show exactly where the process is failing.

### Step 2: Verify MetaMask Setup

#### Check Network
1. Open MetaMask
2. Click the network dropdown at the top
3. Make sure you're on **Story Testnet**
4. If you don't see Story Testnet:
   - The app will try to add it automatically
   - Or add manually:
     - Network Name: `Story Testnet`
     - RPC URL: `https://aeneid.storyrpc.io`
     - Chain ID: `1513`
     - Currency Symbol: `IP`
     - Block Explorer: `https://testnet.storyscan.xyz`

#### Check IP Token Balance
1. Open MetaMask
2. Make sure you have IP tokens (the native token)
3. If you don't have IP tokens, get them from the Story faucet

### Step 3: Common Issues & Solutions

#### Issue: "No wallet detected"
**Solution:** Install MetaMask browser extension from https://metamask.io

#### Issue: "Wrong network"
**Solution:** Switch to Story Testnet in MetaMask (Chain ID: 1513)

#### Issue: "WASM initialization failed"
**Solution:** 
1. Clear browser cache
2. Refresh the page (Ctrl+F5)
3. Try a different browser (Chrome/Brave recommended)

#### Issue: "CDR initialization failed"
**Solution:**
1. Check browser console for specific error
2. Make sure MetaMask is unlocked
3. Try disconnecting and reconnecting wallet
4. Use mock mode temporarily (see below)

### Step 4: Use Mock Mode (Temporary Testing)

If real CDR keeps failing, you can test the UI with mock mode:

1. Open `.env.local` file
2. Change this line:
   ```
   NEXT_PUBLIC_USE_MOCK_CDR=true
   ```
3. Restart the dev server:
   ```bash
   npm run dev
   ```

Mock mode simulates CDR without blockchain transactions. Good for testing UI, but won't work with real IP tokens.

### Step 5: Verify Installation

Make sure all dependencies are installed:

```bash
npm install
```

Check that `@piplabs/cdr-sdk` is installed:
```bash
npm list @piplabs/cdr-sdk
```

Should show: `@piplabs/cdr-sdk@0.2.1` or similar

### Step 6: Check Environment Variables

Open `.env.local` and verify:

```env
NEXT_PUBLIC_STORY_RPC_URL=https://aeneid.storyrpc.io
NEXT_PUBLIC_CHAIN_ID=1513
NEXT_PUBLIC_USE_MOCK_CDR=false
NEXT_PUBLIC_OWNER_WRITE_CONDITION=0x4C9bFC96d7092b590D497A191826C3dA2277c34B
NEXT_PUBLIC_LICENSE_READ_CONDITION=0xC0640AD4CF2CaA9914C8e5C44234359a9102f7a3
```

### Step 7: Test with Small File First

Try uploading a small text file (< 1KB) first to rule out file size issues.

## Detailed Error Messages

### Error: "Failed to get global public key"
**Cause:** CDR network connection issue
**Solution:**
1. Check internet connection
2. Verify Story Testnet RPC is accessible: https://aeneid.storyrpc.io
3. Try again in a few minutes (network might be congested)

### Error: "Transaction failed"
**Cause:** Not enough IP tokens for gas
**Solution:**
1. Check IP token balance in MetaMask
2. Get more IP tokens from Story faucet
3. Make sure you're on Story Testnet

### Error: "User rejected request"
**Cause:** You clicked "Reject" in MetaMask
**Solution:** Click "Confirm" when MetaMask asks for permission

## Still Having Issues?

### Debug Checklist
- [ ] MetaMask installed and unlocked
- [ ] Connected to Story Testnet (Chain ID: 1513)
- [ ] Have IP tokens in wallet
- [ ] Browser console open (F12) to see detailed logs
- [ ] `.env.local` file exists with correct values
- [ ] `npm install` completed successfully
- [ ] Dev server running (`npm run dev`)

### Get Help
1. Check browser console (F12) for detailed error logs
2. Copy the full error message
3. Check if it's a known issue in the CDR SDK docs
4. Try mock mode to isolate if it's a CDR issue or UI issue

## Testing Workflow

### Recommended Testing Order:
1. **Test with Mock Mode First**
   - Set `NEXT_PUBLIC_USE_MOCK_CDR=true`
   - Verify UI works correctly
   - Test all features (create deal room, upload files, etc.)

2. **Switch to Real CDR**
   - Set `NEXT_PUBLIC_USE_MOCK_CDR=false`
   - Make sure MetaMask is on Story Testnet
   - Test with small file first
   - Check browser console for any errors

3. **Test with Your IP Tokens**
   - Verify IP token balance shows on dashboard
   - Create a real deal room
   - Upload actual documents
   - Test access control with different wallets

## Performance Tips

- **File Size:** Keep files under 10MB for best performance
- **Network:** Use stable internet connection
- **Browser:** Chrome or Brave recommended
- **Gas:** Make sure you have enough IP tokens for gas fees

## Success Indicators

When everything works correctly, you'll see in the console:
```
🔧 Initializing CDR client...
✅ WASM initialized
✅ Wallet detected
🔐 Requesting wallet connection...
✅ Wallet connected: 0x...
🌐 Checking network...
✅ Current chain ID: 1513
🔨 Creating viem clients...
✅ Viem clients created
🚀 Creating CDR client...
✅ CDR client created successfully!
⬆️ Uploading to CDR...
✅ Upload successful! UUID: 123
```

## Quick Test Script

Run this in browser console (F12) to test CDR connection:

```javascript
// Test wallet connection
if (window.ethereum) {
  window.ethereum.request({ method: 'eth_requestAccounts' })
    .then(accounts => console.log('✅ Wallet connected:', accounts[0]))
    .catch(err => console.error('❌ Wallet error:', err));
} else {
  console.error('❌ No wallet detected');
}

// Test network
window.ethereum.request({ method: 'eth_chainId' })
  .then(chainId => {
    const id = parseInt(chainId, 16);
    console.log('Current chain:', id);
    if (id === 1513) {
      console.log('✅ On Story Testnet');
    } else {
      console.log('❌ Wrong network! Switch to Story Testnet (1513)');
    }
  });
```
