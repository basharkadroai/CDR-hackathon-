# ✅ Real CDR Testing Guide

## Current Status: READY TO TEST

### ✅ What's Already Configured

1. **Real CDR Enabled** ✅
   - `.env.local` has `NEXT_PUBLIC_USE_MOCK_CDR=false`
   - App will use Story Protocol's real CDR

2. **CDR SDK Installed** ✅
   - `@piplabs/cdr-sdk` v0.2.1 in package.json
   - All dependencies installed

3. **Wallet Integration** ✅
   - MetaMask connection working
   - Story Testnet (Aeneid) configured
   - RPC: https://aeneid.storyrpc.io

4. **Condition Contracts Deployed** ✅
   - Owner Write: `0x4C9bFC96d7092b590D497A191826C3dA2277c34B`
   - License Read: `0xC0640AD4CF2CaA9914C8e5C44234359a9102f7a3`

---

## 🧪 Testing Steps

### Step 1: Start Dev Server
```bash
npm run dev
```
Open: http://localhost:3000

### Step 2: Connect Wallet
1. Click "Connect Wallet"
2. Approve MetaMask connection
3. **Verify**: You should see your wallet address in the header
4. **Verify**: You should see your IP token balance

### Step 3: Test Deal Room Upload (Real CDR)
1. Click "Create Deal Room"
2. Fill in:
   - Vault Name: "Test Deal Room"
   - Add 1-2 authorized wallet addresses
   - Set expiry: 7 days from now
   - Upload a small test file (PDF, TXT, etc.)
3. Click "Create Vault"
4. **Watch for**:
   - Progress bar showing upload
   - MetaMask popup asking to sign transaction
   - Success toast with vault UUID
   - Redirect to dashboard

### Step 4: Verify On-Chain
1. Copy the vault UUID from success message
2. Check console logs for transaction details
3. **Expected logs**:
   ```
   ✅ Using REAL CDR integration
   Uploading to CDR...
   CDR Upload successful: uuid-xxxxx
   ```

### Step 5: Test Dashboard
1. Go to Dashboard
2. **Verify**: Your new vault appears in the list
3. **Verify**: Status shows "Active"
4. **Verify**: File name is correct

### Step 6: Test Dead Drop (Sealed Vault)
1. Click "Create Dead Drop"
2. Fill in:
   - Vault Name: "Test Dead Drop"
   - Recipient wallet address
   - Unlock date: Tomorrow
   - Upload a test file
3. Click "Create Vault"
4. **Verify**: Status shows "Sealed" (not accessible yet)

---

## 🔍 What to Look For

### ✅ Success Indicators
- [ ] No "🔶 Running in MOCK mode" warning in console
- [ ] Console shows "✅ Using REAL CDR integration"
- [ ] MetaMask popup appears for transaction signing
- [ ] Vault UUID is a number (not "mock-xxxxx")
- [ ] Toast notifications appear (not browser alerts)
- [ ] Progress bar shows during upload
- [ ] Dashboard shows created vaults

### ❌ Error Indicators
- [ ] "No wallet detected" - Install MetaMask
- [ ] "Insufficient funds" - Need more IP tokens from faucet
- [ ] "Network error" - Check RPC connection
- [ ] "Transaction failed" - Check gas settings

---

## 🐛 Troubleshooting

### Issue: "No wallet detected"
**Solution**: Install MetaMask browser extension

### Issue: "Wrong network"
**Solution**: 
1. Open MetaMask
2. Add Story Testnet manually:
   - Network Name: Story Testnet (Aeneid)
   - RPC URL: https://aeneid.storyrpc.io
   - Chain ID: 1513
   - Currency: IP

### Issue: "Insufficient funds"
**Solution**: Get more tokens from Story faucet
- URL: https://faucet.story.foundation
- Or ask in Discord #faucet channel

### Issue: "Transaction failed"
**Solution**: 
1. Check you have enough IP tokens for gas
2. Try increasing gas limit in MetaMask
3. Check console for specific error

### Issue: Still seeing mock mode
**Solution**:
1. Verify `.env.local` has `NEXT_PUBLIC_USE_MOCK_CDR=false`
2. Restart dev server: `npm run dev`
3. Hard refresh browser: Ctrl+Shift+R

---

## 📊 Expected Console Output (Real CDR)

```
✅ Using REAL CDR integration
Initializing WASM...
WASM initialized
Getting CDR client...
Wallet connected: 0x1234...
Getting global public key...
Generating data key...
Reading file buffer...
Uploading to CDR...
CDR Upload successful: uuid-12345
Transaction hash: 0xabcd...
Vault created: {
  uuid: "12345",
  name: "Test Deal Room",
  type: "deal-room",
  status: "active"
}
```

---

## 🎯 Next Steps After Testing

### If Real CDR Works ✅
1. **Record demo video** showing:
   - Wallet connection
   - File upload with progress bar
   - Success toast with UUID
   - Dashboard with vaults
   - Console showing real CDR logs

2. **Take screenshots**:
   - Upload progress
   - Success notification
   - Dashboard with vaults
   - Console logs

3. **Update README** with:
   - "✅ Real CDR Integration Working"
   - Screenshots of real transactions
   - Link to Story explorer (if available)

### If Issues Occur ❌
1. Check console for specific errors
2. Verify wallet has IP tokens
3. Test with smaller files first
4. Check network connection
5. Ask in Story Discord for help

---

## 🚀 Production Deployment

Once real CDR is tested locally:

1. **Update Vercel Environment Variables**:
   ```
   NEXT_PUBLIC_USE_MOCK_CDR=false
   NEXT_PUBLIC_STORY_RPC_URL=https://aeneid.storyrpc.io
   NEXT_PUBLIC_CHAIN_ID=1513
   ```

2. **Redeploy**:
   ```bash
   git add .
   git commit -m "Enable real CDR integration"
   git push origin main
   ```

3. **Test production**:
   - Visit https://dealvault-sable.vercel.app
   - Connect wallet
   - Upload test file
   - Verify real CDR is working

---

## 📝 Testing Checklist

- [ ] Dev server running
- [ ] Wallet connected
- [ ] IP tokens in wallet
- [ ] Deal Room upload successful
- [ ] MetaMask transaction signed
- [ ] Vault UUID received (number, not "mock-")
- [ ] Dashboard shows vault
- [ ] Dead Drop created with "sealed" status
- [ ] Console shows "✅ Using REAL CDR integration"
- [ ] No mock mode warnings
- [ ] Screenshots taken
- [ ] Demo video recorded

---

## 🎬 Demo Video Talking Points

When recording, emphasize:

1. **"This is using REAL Story Protocol CDR"**
   - Show console logs
   - Show MetaMask transaction
   - Show vault UUID

2. **"Threshold encryption happening on-chain"**
   - Explain no centralized server
   - Show condition contracts

3. **"Professional UX"**
   - Show progress bar
   - Show toast notifications
   - Show dashboard

4. **"Two distinct use cases"**
   - Deal Room: Time-limited access
   - Dead Drop: Future unlock

---

**Ready to test? Run `npm run dev` and follow the steps above!** 🚀
