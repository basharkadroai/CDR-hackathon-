# ⚡ DealVault Quick Start

## 🎯 Goal: Get DealVault Running in 10 Minutes

### Step 1: Create GitHub Repository (2 minutes)

1. Go to https://github.com/new
2. Name: `CDR-hackathon`
3. Make it **PUBLIC**
4. **Don't** initialize with anything
5. Click "Create repository"

### Step 2: Push Code (1 minute)

```bash
cd "c:\Users\hp\Documents\two-to-ship-ai repo\CDR-hackathon"
git push -u origin main
```

If it asks for authentication, use a Personal Access Token from https://github.com/settings/tokens

### Step 3: Deploy to Vercel (3 minutes)

1. Go to https://vercel.com/new
2. Import `basharkadroai/CDR-hackathon`
3. Add these environment variables:
   ```
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=demo-project-id
   ```
4. Click "Deploy"
5. Wait 2-3 minutes for build

### Step 4: Test Live Demo (2 minutes)

1. Open your Vercel URL (e.g., `dealvault-xyz.vercel.app`)
2. Click "Connect Wallet"
3. Connect with MetaMask/Rainbow
4. Click "Create Deal Room"
5. Fill out the form
6. Upload a test file
7. Click "Create Deal Room"

### Step 5: Record Demo Video (2 minutes)

1. Open OBS Studio or Loom
2. Record your screen
3. Walk through:
   - Landing page
   - Creating a deal room
   - Dashboard view
4. Upload to YouTube (unlisted)

## 🚀 You're Done!

Now you have:
- ✅ Code on GitHub
- ✅ Live demo on Vercel
- ✅ Demo video on YouTube

## 📝 Submit to Hackathon

Fill out the submission form with:
- **Demo URL:** Your Vercel URL
- **Video URL:** Your YouTube link
- **GitHub URL:** https://github.com/basharkadroai/CDR-hackathon

## 🎨 Make It Better (Optional)

### Add Real CDR Integration

1. Get CDR API key from Story Protocol
2. Update `.env.local`:
   ```
   CDR_API_KEY=your_real_key
   ```
3. Test encryption/decryption flow

### Deploy Smart Contracts

1. Install Foundry
2. Deploy to Story testnet:
   ```bash
   forge create --rpc-url https://testnet.storyrpc.io \
     --private-key YOUR_KEY \
     contracts/DealRoomFactory.sol:DealRoomFactory
   ```
3. Update contract addresses in `.env.local`

### Get Beta Testers

1. Post on Twitter with #CDRHackathon
2. Share in crypto Discord servers
3. Ask friends to test and give feedback

## 🏆 Winning Strategy

**For Technical Track:**
- Emphasize multi-sig, conditional access, escrow
- Show smart contract code
- Explain CDR integration

**For Application Track:**
- Get 10+ people to test it
- Post screenshots on Twitter
- Get testimonials
- Show real traction

## 💡 Pro Tips

1. **Polish the UI** - First impressions matter
2. **Write good docs** - Judges read READMEs
3. **Show, don't tell** - Demo video > long explanations
4. **Be unique** - Focus on B2B angle (not personal use)
5. **Get traction** - Real users > perfect code

## 🆘 Need Help?

Check `DEPLOYMENT_GUIDE.md` for detailed instructions.

---

**Now go crush this hackathon! 🚀**
