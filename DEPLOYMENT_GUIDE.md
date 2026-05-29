# 🚀 DealVault Deployment Guide

## ⚠️ IMPORTANT: GitHub Repository Setup

The repository `https://github.com/Smiley617/CDR-hackathon` doesn't exist yet. You need to create it first:

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `CDR-hackathon`
3. Description: "Enterprise confidential deal rooms powered by Story Protocol's CDR"
4. **Make it PUBLIC** (required for hackathon submission)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

### Step 2: Push Code to GitHub

Once the repository is created, run these commands:

```bash
cd "c:\Users\hp\Documents\two-to-ship-ai repo\CDR-hackathon"

# The code is already committed locally
# Just push to the new remote
git push -u origin main
```

If you get authentication errors, you may need to:
- Use a Personal Access Token instead of password
- Or use GitHub CLI: `gh auth login`

## 📦 Local Development Setup

### Prerequisites

- Node.js 18+ installed
- Git installed
- Story Protocol testnet wallet with IP tokens

### Installation

```bash
# Navigate to project
cd "c:\Users\hp\Documents\two-to-ship-ai repo\CDR-hackathon"

# Install dependencies
npm install

# Copy environment variables
copy .env.example .env.local

# Edit .env.local with your values:
# - NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID (get from https://cloud.walletconnect.com)
# - CDR_API_KEY (get from Story Protocol)
# - OPENAI_API_KEY (optional, for AI features)
```

### Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## 🌐 Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import from GitHub: `Smiley617/CDR-hackathon`
3. Configure:
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. Add Environment Variables:
   ```
   NEXT_PUBLIC_STORY_RPC_URL=https://testnet.storyrpc.io
   NEXT_PUBLIC_STORY_CHAIN_ID=1513
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
   CDR_API_KEY=your_cdr_api_key
   OPENAI_API_KEY=your_openai_key
   ```
5. Click "Deploy"

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

## 🔗 Smart Contract Deployment

### Deploy to Story Testnet

```bash
# Install Foundry (if not already installed)
# Windows: Download from https://getfoundry.sh

# Compile contracts
forge build

# Deploy DealRoomFactory
forge create --rpc-url https://testnet.storyrpc.io \
  --private-key YOUR_PRIVATE_KEY \
  contracts/DealRoomFactory.sol:DealRoomFactory

# Deploy EscrowManager
forge create --rpc-url https://testnet.storyrpc.io \
  --private-key YOUR_PRIVATE_KEY \
  --constructor-args DEALROOM_FACTORY_ADDRESS \
  contracts/EscrowManager.sol:EscrowManager
```

### Update Contract Addresses

After deployment, update `.env.local`:

```
NEXT_PUBLIC_DEALROOM_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_ESCROW_MANAGER_ADDRESS=0x...
```

## 🎥 Create Demo Video

### Script Outline (5 minutes)

**Intro (30 seconds)**
- "Hi, I'm [Your Name], and this is DealVault"
- "The first enterprise-grade confidential deal room platform"
- "Built on Story Protocol's Confidential Data Rails"

**Problem (1 minute)**
- "Today, M&A deals and fundraising rounds involve sharing sensitive documents"
- "Current solutions: email (insecure), Dropbox (no access control), DocuSign (centralized)"
- "We need cryptographic guarantees, not trust"

**Solution (2 minutes)**
- Show landing page
- Walk through creating a deal room:
  - "Let's say TechCorp wants to acquire StartupXYZ for $10M"
  - Create deal room with 3-of-5 board approval
  - Upload sensitive documents (financials, IP, contracts)
  - Set up $10M escrow
- Show dashboard with active deals

**Technical Deep Dive (1 minute)**
- "Here's what makes DealVault unique:"
- Show smart contract code (multi-sig, conditional access)
- Explain CDR integration (threshold decryption)
- Show audit trail

**Conclusion (30 seconds)**
- "DealVault solves a $10B+ market problem"
- "Production-ready for real M&A deals today"
- "Built for the CDR Hackathon 2026"
- Show GitHub and live demo links

### Recording Tools

- **Screen Recording:** OBS Studio (free)
- **Video Editing:** DaVinci Resolve (free)
- **Upload:** YouTube (unlisted or public)

## 📱 Social Media Launch

### Twitter Thread Template

```
🚀 Excited to launch DealVault for the @StoryProtocol CDR Hackathon!

The first enterprise-grade confidential deal room platform. Zero trust. Zero middlemen. Pure cryptographic guarantees.

🧵 Thread on what makes it special 👇

1/ The Problem:

M&A deals involve sharing sensitive documents (financials, IP, contracts) worth millions.

Current solutions:
❌ Email (insecure)
❌ Dropbox (no access control)
❌ DocuSign (centralized)

We need cryptographic guarantees, not trust.

2/ The Solution: DealVault

✅ Multi-sig approval (3-of-5 board signatures)
✅ Smart escrow (auto-release when conditions met)
✅ Conditional access (unlock B after A is signed)
✅ Revocable access (emergency kill switch)
✅ Immutable audit trail

3/ How it works:

1. Create deal room with authorized parties
2. Upload documents (encrypted client-side)
3. Set access rules (wallet, time, multi-sig)
4. Lock funds in escrow (optional)
5. Smart contracts enforce everything on-chain

No single party ever holds the full decryption key.

4/ Built on @StoryProtocol's Confidential Data Rails (CDR)

CDR uses a decentralized network of TEEs (Trusted Execution Environments) to:
- Store encrypted data
- Enforce access control
- Provide threshold decryption

It's like FHE, but production-ready today.

5/ Why DealVault beats the competition:

vs Nythera: B2B focus (not personal recovery)
vs OnScroll: Multi-party collaboration (not content paywalls)
vs Traditional: Cryptographic guarantees (not trust)

We're targeting a $10B+ market.

6/ Tech Stack:

- Next.js 14 + TypeScript
- Story Protocol Testnet
- Solidity smart contracts
- CDR SDK
- RainbowKit + Wagmi

All code is open source on GitHub.

7/ Try it now:

🌐 Live Demo: https://dealvault-sable.vercel.app
💻 GitHub: https://github.com/Smiley617/CDR-hackathon
🎥 Demo Video: [YouTube link]

Built with ❤️ for the CDR Hackathon 2026.

Feedback welcome! 🙏
```

### LinkedIn Post Template

```
🚀 Launching DealVault: Enterprise Confidential Deal Rooms

I'm excited to share DealVault, a project I built for the Story Protocol CDR Hackathon.

THE PROBLEM:
M&A transactions and fundraising rounds involve sharing highly sensitive documents (financials, IP, contracts) worth millions. Current solutions rely on trust, not cryptography.

THE SOLUTION:
DealVault provides cryptographic guarantees for confidential business transactions:

✅ Multi-signature approval workflows
✅ Smart escrow with automatic fund release
✅ Conditional access chains
✅ Revocable access (emergency kill switch)
✅ Immutable audit trail for compliance

TECHNICAL INNOVATION:
Built on Story Protocol's Confidential Data Rails (CDR), which uses a decentralized network of Trusted Execution Environments (TEEs) to:
- Encrypt data client-side
- Enforce access control on-chain
- Provide threshold decryption (no single point of failure)

TARGET MARKET:
- M&A advisory firms
- Venture capital funds
- Private equity firms
- Corporate development teams
- Law firms

This is a $10B+ market opportunity.

Try the live demo: https://dealvault-sable.vercel.app

What do you think? Would your organization use this?

#Web3 #Blockchain #Confidential Computing #M&A #Fundraising
```

## ✅ Pre-Submission Checklist

Before submitting to the hackathon:

- [ ] GitHub repository is public
- [ ] README.md is comprehensive
- [ ] Code is well-commented
- [ ] Demo video is uploaded to YouTube
- [ ] Live demo is deployed to Vercel
- [ ] Smart contracts are deployed to Story testnet
- [ ] Twitter thread is posted
- [ ] LinkedIn post is published
- [ ] HACKATHON_SUBMISSION.md is complete
- [ ] All team members are credited

## 🏆 Hackathon Submission

### Submission Form Fields

**Project Name:** DealVault

**Tagline:** Enterprise confidential deal rooms with zero trust

**Description:**
```
DealVault is the first enterprise-grade confidential deal room platform built on Story Protocol's Confidential Data Rails (CDR). Unlike personal recovery vaults, DealVault targets high-stakes B2B transactions with advanced features:

- Multi-signature approval workflows (2-of-3, 3-of-5, custom)
- Smart escrow with automatic fund release
- Conditional access chains (unlock B after A is signed)
- Revocable access (emergency kill switch)
- AI-powered deal negotiation
- Immutable audit trail for compliance

Built for M&A transactions, fundraising rounds, and strategic partnerships.
```

**Category:** Both tracks (Technical Implementation + Best Application)

**Demo URL:** https://dealvault-sable.vercel.app

**Video URL:** [Your YouTube link]

**GitHub URL:** https://github.com/Smiley617/CDR-hackathon

**Team Members:**
- Bashar (Frontend, UI/UX, Product Design)
- [Your Name] (Smart Contracts, CDR Integration, Backend)

## 🎯 Next Steps After Submission

1. **Monitor Social Media**
   - Respond to comments on Twitter/LinkedIn
   - Engage with other hackathon participants
   - Tag Story Protocol team in updates

2. **Get Beta Testers**
   - Reach out to VCs, M&A advisors, law firms
   - Collect testimonials
   - Document use cases

3. **Iterate Based on Feedback**
   - Fix bugs reported by users
   - Add requested features
   - Improve documentation

4. **Prepare for Demo Day**
   - Practice your pitch (3-5 minutes)
   - Prepare Q&A responses
   - Have backup slides ready

## 🆘 Troubleshooting

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build
```

### Wallet Connection Issues

- Make sure you're on Story Testnet (Chain ID: 1513)
- Check that RPC URL is correct
- Try different wallet (MetaMask, Rainbow, etc.)

### CDR API Errors

- Verify API key is correct
- Check API endpoint URL
- Look at browser console for detailed errors

## 📞 Support

- **GitHub Issues:** https://github.com/Smiley617/CDR-hackathon/issues
- **Story Protocol Discord:** [Link]
- **Email:** dealvault@hackathon.com

---

**Good luck crushing the hackathon! 🚀**
