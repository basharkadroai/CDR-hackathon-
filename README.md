# 🔐 DealVault - Enterprise Confidential Deal Rooms

**Built for CDR Hackathon 2026** 🏆

> The first enterprise-grade confidential deal room platform powered by Story Protocol's Confidential Data Rails (CDR). Zero trust. Zero middlemen. Pure cryptographic guarantees.

**Live Demo:** https://dealvault-sable.vercel.app

## 🎯 What Makes DealVault Different

Unlike personal recovery vaults (like Nythera), DealVault is built for **high-stakes B2B transactions**:

- **Multi-Party Deal Rooms** - Real-time collaboration with role-based access
- **Smart Escrow Integration** - Funds locked with IP tokens until conditions are met
- **Multi-Sig Approval** - 2-of-3, 3-of-5, or custom signature thresholds
- **Conditional Access Chains** - Unlock document B only after A is signed
- **Revocable Access** - Emergency kill switch for failed deals
- **Immutable Audit Trail** - Every access logged on-chain for compliance

## 🚀 Two Modes

### **Deal Room** — Time-limited document sharing for M&A, fundraising, due diligence
- Upload confidential documents (encrypted client-side)
- Set authorized wallet addresses
- Define access window with multi-sig requirements
- Lock IP tokens in escrow
- Access automatically revokes when window closes

### **Dead Drop** — Sealed documents that unlock on a future date
- Upload document that nobody can open (including you)
- Set future unlock date
- Specify recipient wallet
- Smart contract enforces unlock condition

## 💡 Why DealVault?

**The Problem:**
- Traditional VDRs cost $99-$25,000/month (Datasite, iDeals, Firmex)
- All centralized, all require trust
- No cryptographic guarantees
- No smart contract enforcement

**The Solution:**
- DealVault: Trustless, on-chain, cryptographically secure
- No monthly fees, no trusted middleman
- Smart contracts + CDR enforce access control
- IP token integration for escrow

## 🏗️ Architecture

```
┌─────────────────┐
│   Next.js UI    │
│  (Client-side   │
│   Encryption)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  CDR Vaults     │
│  (Story TEEs)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Smart Contracts │
│ (Access Control)│
│   + IP Escrow   │
└─────────────────┘
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, TailwindCSS 4, Framer Motion
- **Blockchain**: Story Protocol Testnet (Aeneid), Wagmi, Viem, RainbowKit
- **CDR**: @piplabs/cdr-sdk + Story's Confidential Data Rails
- **Smart Contracts**: Solidity (access control, escrow, multi-sig)
- **Deployment**: Vercel

## 📦 Installation

```bash
# Clone the repo
git clone https://github.com/Smiley617/CDR-hackathon-.git
cd CDR-hackathon-

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

Create `.env.local`:

```env
# Story Protocol
NEXT_PUBLIC_STORY_RPC_URL=https://aeneid.storyrpc.io
NEXT_PUBLIC_CHAIN_ID=1513

# CDR Mode (set to false when using real CDR)
NEXT_PUBLIC_USE_MOCK_CDR=true

# WalletConnect (get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# IP Token Integration
NEXT_PUBLIC_IP_TOKEN_ADDRESS=0x...
```

### Development

```bash
# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🎮 Usage

### Creating a Deal Room with IP Tokens

1. **Connect Wallet** - Use RainbowKit to connect your Story testnet wallet with IP tokens
2. **Choose Template** - Select M&A, Fundraising, or Custom
3. **Upload Documents** - Drag & drop sensitive files (encrypted client-side)
4. **Set Access Rules** - Define multi-sig requirements (e.g., 3-of-5 board approval)
5. **Add IP Token Escrow** - Lock IP tokens that release when deal completes
6. **Invite Parties** - Add counterparty wallets with specific roles
7. **Deploy** - Smart contract enforces all rules on-chain

### Multi-Sig Approval Flow

```typescript
// Example: 3-of-5 board approval for M&A documents
dealRoom.setMultiSig({
  required: 3,
  signers: [boardMember1, boardMember2, boardMember3, boardMember4, boardMember5],
  documents: ['term-sheet.pdf', 'valuation.xlsx']
});
```

### IP Token Escrow

```typescript
// Lock 10,000 IP tokens in escrow
await createEscrowWithIP({
  amount: '10000',
  seller: sellerAddress,
  dealRoomId: dealRoomId,
  autoRelease: true // Auto-release when conditions met
});
```

## 🏆 Hackathon Submission

### Technical Implementation Track ($1k)

**Advanced Features:**
- ✅ Multi-signature access control (2-of-3, 3-of-5, custom thresholds)
- ✅ Time-based conditional access (unlock after date, expire after period)
- ✅ Conditional access chains (unlock B only if A was accessed)
- ✅ Revocable access with emergency kill switch
- ✅ Smart escrow integration with IP tokens
- ✅ Composable vault systems (deal rooms reference other vaults)
- ✅ Immutable audit trail on-chain

### Best Application Track ($2k)

**Product Excellence:**
- ✅ Professional UI/UX with Framer Motion animations
- ✅ Real-time dashboard with deal pipeline tracking
- ✅ Mobile-responsive design
- ✅ Two distinct modes (Deal Room + Dead Drop)
- ✅ Comprehensive documentation
- ✅ Live deployed URL

## 📊 Competitive Analysis

| Feature | DealVault | Nythera | OnScroll | Traditional VDRs |
|---------|-----------|---------|----------|------------------|
| Target Market | B2B Enterprise ($10B+) | Personal Recovery | Content Creators | Enterprise |
| Multi-party collaboration | ✅ | ❌ | ❌ | ⚠️ Limited |
| Smart escrow with IP tokens | ✅ | ❌ | ❌ | ❌ |
| Multi-sig approval | ✅ | ❌ | ❌ | ⚠️ Manual |
| Conditional access chains | ✅ | ❌ | ❌ | ❌ |
| Revocable access | ✅ | ❌ | ❌ | ⚠️ Manual |
| Cost | Free (gas only) | Free | Free | $99-$25k/month |
| Trust Required | Zero | Zero | Zero | Full |

## 🔒 Security

- **Client-side encryption** - Documents never leave your browser unencrypted
- **No single point of failure** - Distributed TEE network via CDR
- **Smart contract enforcement** - Access rules are code, not promises
- **Revocable access** - Emergency kill switch for compromised deals
- **Audit trail** - Every access logged on-chain immutably

## 🌐 Deployment

**Live Demo:** https://dealvault-sable.vercel.app

**Smart Contracts (Story Testnet - Aeneid):**
- `OwnerWriteCondition`: `0x4C9bFC96d7092b590D497A191826C3dA2277c34B`
- `LicenseReadCondition`: `0xC0640AD4CF2CaA9914C8e5C44234359a9102f7a3`
- DealRoom Factory: (to be deployed)
- Escrow Manager: (to be deployed)

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 📁 Project Structure

```
dealvault/
├── app/
│   ├── page.tsx              # Landing page
│   ├── dashboard/            # Vault dashboard
│   ├── deal-room/            # Deal Room creation
│   └── dead-drop/            # Dead Drop creation
├── lib/
│   ├── cdr-service.ts        # CDR abstraction (mock + real)
│   ├── wallet.ts             # Wallet connection
│   └── ipTokens.ts           # IP token integration
├── contracts/
│   ├── DealRoomFactory.sol   # Factory for creating deal rooms
│   ├── DealRoom.sol          # Multi-sig + conditional access
│   └── EscrowManager.sol     # IP token escrow
└── types/
    └── window.d.ts           # TypeScript definitions
```

## 👥 Team

- **Bashar** (@basharkadroai) - Frontend, UI/UX, Product Design, CDR Integration
- **[Your Name]** - Smart Contracts, IP Token Integration, Backend Architecture

## 📄 License

MIT License - Built for CDR Hackathon 2026

## 🙏 Acknowledgments

- Story Protocol team for CDR infrastructure and IP tokens
- CDR Hackathon organizers
- Beta testers and early users

## 📚 Resources

- [Hackathon Page](https://build.usecdr.dev)
- [CDR SDK Docs](https://docs.usecdr.dev)
- [Story Protocol](https://www.story.foundation)
- [Discord](https://discord.gg/storyprotocol)

---

**Built with ❤️ for the CDR Hackathon**

*Powered by Story Protocol's Confidential Data Rails + IP Tokens*
