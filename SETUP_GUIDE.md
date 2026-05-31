# 🚀 DealVault Setup Guide

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Story Testnet RPC
NEXT_PUBLIC_STORY_RPC_URL=https://aeneid.storyrpc.io
NEXT_PUBLIC_CHAIN_ID=1315

# CDR Mode (true = mock, false = real CDR)
NEXT_PUBLIC_USE_MOCK_CDR=true
```

### 3. Run Development Server
```bash
npm run dev
```

Open http://localhost:3000

## 🎯 Testing the App

### Mock Mode (No Tokens Required)
Currently running in **mock mode** - perfect for testing UI/UX without testnet tokens.

**What works:**
- ✅ Full UI/UX flow
- ✅ File upload simulation
- ✅ Wallet connection
- ✅ Dashboard management
- ✅ All features visible

**What's simulated:**
- 🔶 Encryption (mocked)
- 🔶 CDR storage (localStorage)
- 🔶 On-chain access control (simulated)

### Real CDR Mode (Requires Tokens)

#### Step 1: Get Testnet Tokens
1. Visit [Story Faucet](https://faucet.story.foundation)
2. Connect your wallet
3. Request testnet tokens
4. Wait for confirmation

#### Step 2: Enable Real CDR
Edit `.env.local`:
```env
NEXT_PUBLIC_USE_MOCK_CDR=false
```

#### Step 3: Restart Server
```bash
npm run dev
```

#### Step 4: Test Real CDR
1. Connect wallet with testnet tokens
2. Upload a document
3. Check console for "✅ Using REAL CDR integration"
4. Verify transaction on Story explorer

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

**Current Status:** 28/28 tests passing ✅

## 🏗️ Building for Production

```bash
# Build
npm run build

# Test production build locally
npm start
```

## 🚢 Deploying to Vercel

### Option 1: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

### Option 2: GitHub Integration
1. Push to GitHub
2. Import project in Vercel dashboard
3. Configure environment variables
4. Deploy

## 🔍 Troubleshooting

### "No wallet detected"
- Install MetaMask or another Web3 wallet
- Make sure it's unlocked

### "Wrong network"
- Switch to Story Testnet (Aeneid)
- Chain ID: 1315
- RPC: https://aeneid.storyrpc.io

### "Insufficient funds"
- Get testnet tokens from faucet
- Need tokens for gas fees

### "Build failed"
- Clear `.next` folder: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node version: `node -v` (need 18+)

### Mock mode not working
- Check `.env.local` has `NEXT_PUBLIC_USE_MOCK_CDR=true`
- Restart dev server
- Clear browser localStorage

## 📊 Monitoring

### Check CDR Mode
Open browser console and upload a file. You'll see:
- Mock mode: `🔶 Running in MOCK mode`
- Real mode: `✅ Using REAL CDR integration`

### Check Transactions
- Story Explorer: https://explorer.story.foundation
- Paste your wallet address
- View CDR vault transactions

## 🎬 Demo Script

### For Judges/Reviewers

1. **Landing Page** (10 seconds)
   - Show value proposition
   - Highlight "Zero Trust Required"

2. **Connect Wallet** (5 seconds)
   - Click "Connect Wallet"
   - Approve MetaMask

3. **Create Deal Room** (30 seconds)
   - Click "Create Deal Room"
   - Upload sample PDF
   - Add authorized wallet address
   - Set 7-day expiry
   - Click "Create Deal Room"

4. **Dashboard** (15 seconds)
   - Show vault list
   - Display status badges
   - Show expiry countdown

5. **Access Vault** (10 seconds)
   - Click "Access Vault"
   - Document opens in new tab

**Total Demo Time:** ~70 seconds

## 🏆 Hackathon Checklist

- [x] Working demo deployed
- [x] GitHub repository public
- [x] README with setup instructions
- [x] Tests passing (28/28)
- [x] Environment variables documented
- [x] Mock mode for easy testing
- [ ] Real CDR integration enabled (waiting for tokens)
- [ ] Demo video recorded
- [ ] Submission form completed

## 📞 Support

- **GitHub Issues:** https://github.com/basharkadroai/CDR-hackathon-/issues
- **Discord:** Story Protocol server
- **Email:** [Your email]

## 🎯 Next Steps

1. ✅ Get testnet tokens
2. ✅ Enable real CDR mode
3. ✅ Record demo video
4. ✅ Submit to hackathon
5. ✅ Win! 🏆
