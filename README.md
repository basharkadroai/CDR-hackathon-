# 🔐 DealVault - Enterprise Confidential Deal Rooms

**Built for CDR Hackathon 2026** 🏆

> The first enterprise-grade confidential deal room platform powered by Story Protocol's Confidential Data Rails (CDR). Zero trust. Zero middlemen. Pure cryptographic guarantees.

**Live Demo:** https://dealvault-sable.vercel.app

## 🎯 What Makes DealVault Different

Unlike personal recovery vaults (like Nythera), DealVault is built for **high-stakes B2B transactions**:

- **Multi-Party Deal Rooms** - Real-time collaboration with role-based access
- **CDR Condition Contract Path** - Optional deployed condition contract gates reads/writes for Deal Rooms and Dead Drops
- **Smart Escrow Contracts** - Native IP escrow contract and frontend transaction helper for deployed escrow addresses
- **Advanced Contract Prototypes** - Multi-sig approvals and conditional document chains modeled in Solidity for the technical track
- **Revocable Access** - Emergency kill switch for failed deals
- **Immutable Audit Trail** - Every access logged on-chain for compliance

## 🚀 Two Modes

### **Deal Room** 📁 Time-limited document sharing for M&A, fundraising, due diligence
- Upload confidential documents (encrypted client-side)
- Set authorized wallet addresses
- Define authorized wallets and access windows
- Use `DealVaultCondition.sol` as the CDR read/write condition for on-chain wallet/expiry enforcement
- Access automatically expires when the configured window closes

### **Dead Drop** 🔒 Sealed documents that unlock on a future date
- Upload document that nobody can open (including you)
- Set future unlock date
- Specify recipient wallet
- `DealVaultCondition.sol` enforces recipient + unlock timestamp when deployed and configured

## 💡 Why DealVault?

**The Problem:**
- Traditional VDRs cost $99-$25,000/month (Datasite, iDeals, Firmex)
- All centralized, all require trust
- No cryptographic guarantees
- No smart contract enforcement

**The Solution:**
- DealVault: Trustless, on-chain, cryptographically secure
- No monthly fees, no trusted middleman
- CDR can enforce access control through `DealVaultCondition.sol`
- Native IP escrow helper submits real transactions when `NEXT_PUBLIC_ESCROW_MANAGER_ADDRESS` is configured

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

## 🔐 How Real CDR Works Here

DealVault uses the canonical Confidential Data Rails pattern — the access control
that matters is fully on-chain, enforced by Story's validator set:

1. A random AES-256 **data key** is generated in the browser.
2. The file is **AES-GCM encrypted client-side** with that key.
3. The data key is **threshold-encrypted to the validator DKG public key** and
   written to an **on-chain CDR vault** (`uploadCDR`), gated by read/write
   **condition contracts**. Set `NEXT_PUBLIC_DEALVAULT_CONDITION_ADDRESS` to the deployed `DealVaultCondition.sol` address to enforce Deal Room wallet/expiry and Dead Drop recipient/unlock rules directly in CDR. No single party ever holds the key.
4. To read, `accessCDR` **enforces the read condition on-chain**, collects
   **partial decryptions from the validator set**, and recovers the data key —
   which then decrypts the file. No trusted middleman.

> The plain-HTTP Story-API is reached through a same-origin Next.js proxy
> (`app/api/cdr`) so the HTTPS production app isn't blocked by mixed content.

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, TailwindCSS 4
- **Blockchain**: Story Protocol Testnet (Aeneid), Wagmi, Viem, MetaMask-compatible wallets
- **CDR**: @piplabs/cdr-sdk + Story's Confidential Data Rails
- **Smart Contracts**: Solidity (access control, escrow, multi-sig)
- **Deployment**: Vercel

## 📦 Installation

```bash
# Clone the repo
git clone https://github.com/basharkadroai/CDR-hackathon-.git
cd CDR-hackathon-

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

Create `.env.local`:

```env
# Story Aeneid Testnet
NEXT_PUBLIC_STORY_RPC_URL=https://aeneid.storyrpc.io
NEXT_PUBLIC_CHAIN_ID=1315

# Story-API REST endpoint for CDR DKG state (proxied via /api/cdr to avoid mixed-content)
NEXT_PUBLIC_CDR_API_URL=http://172.192.41.96:1317

# CDR mode: false = REAL Confidential Data Rails, true = localStorage mock demo
NEXT_PUBLIC_USE_MOCK_CDR=false

# WalletConnect (optional, get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Optional but recommended: deployed CDR condition contract
NEXT_PUBLIC_DEALVAULT_CONDITION_ADDRESS=0x...

# Optional deployed escrow contract
NEXT_PUBLIC_ESCROW_MANAGER_ADDRESS=0x...
```

### Development

```bash
# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🎮 Usage

### Creating a Deal Room with IP Tokens

1. **Connect Wallet** - Use a MetaMask-compatible wallet on Story Aeneid with IP tokens
2. **Choose Template** - Select M&A, Fundraising, or Custom
3. **Upload Documents** - Drag & drop sensitive files (encrypted client-side)
4. **Set Access Rules** - Define authorized wallets and an expiry window
5. **Deploy Condition Contract** - Set `NEXT_PUBLIC_DEALVAULT_CONDITION_ADDRESS` so CDR enforces those rules on-chain
6. **Optional IP Escrow** - Configure `NEXT_PUBLIC_ESCROW_MANAGER_ADDRESS` to lock native IP in escrow
7. **Share Vault UUID** - Counterparties can access only when CDR conditions pass and ciphertext is available

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
- ✅ Real CDR SDK upload/access path with client-side AES-GCM and validator DKG key recovery
- ✅ `DealVaultCondition.sol` CDR condition contract for Deal Room wallet/expiry and Dead Drop recipient/unlock enforcement
- ✅ Solidity Deal Room prototype with multi-signature approval, document prerequisites, expiry, revocation, and audit logs
- ✅ Native IP escrow contract plus frontend transaction helper for deployed escrow managers
- ⚠️ Multi-sig and conditional document chains are currently contract prototypes; wire them as CDR read conditions before claiming full production enforcement
- ⚠️ Demo ciphertext storage is localStorage; production sharing should move encrypted blobs to IPFS/Storacha

### Best Application Track ($2k)

**Product Excellence:**
- ✅ Professional responsive UI/UX with dark enterprise styling
- ✅ Dashboard with vault status, expiry/unlock timing, CDR gate mode, and explorer links
- ✅ Mobile-responsive design
- ✅ Two distinct modes (Deal Room + Dead Drop)
- ✅ Comprehensive documentation
- ✅ Live deployed URL

## 📊 Competitive Analysis

| Feature | DealVault | Nythera | OnScroll | Traditional VDRs |
|---------|-----------|---------|----------|------------------|
| Target Market | B2B Enterprise ($10B+) | Personal Recovery | Content Creators | Enterprise |
| Multi-party collaboration | ✅ | ❌ | ❌ | 🟡 Limited |
| Smart escrow with IP tokens | ✅ | ❌ | ❌ | ❌ |
| Multi-sig approval | ✅ | ❌ | ❌ | 🟡 Manual |
| Conditional access chains | ✅ | ❌ | ❌ | ❌ |
| Revocable access | ✅ | ❌ | ❌ | 🟡 Manual |
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

**CDR Condition Contracts (Story Aeneid Testnet, chain 1315):**
- Deploy `contracts/DealVaultCondition.sol` and set `NEXT_PUBLIC_DEALVAULT_CONDITION_ADDRESS` in Vercel for on-chain CDR gating.
- Quick deploy: `DEPLOYER_PRIVATE_KEY=0x... npm run deploy:condition`.
- Final checklist: run `npm run hackathon:check` and follow `HACKATHON_SUBMISSION.md`.
- If this env var is unset, uploads deliberately fall back to owner-only CDR so judges can still test the real CDR upload/access path.

> **Diagnostics:** visit `/test-cdr` on the live site to verify real CDR end-to-end
> (proxy → DKG key → on-chain vault upload → threshold recovery → decrypt).

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
│   ├── page.tsx                    # Landing page
│   ├── dashboard/                  # Vault dashboard
│   ├── deal-room/                  # Deal Room creation
│   └── dead-drop/                  # Dead Drop creation
├── lib/
│   ├── cdr-service.ts              # CDR abstraction (mock + real)
│   ├── wallet.ts                   # Wallet connection
│   └── ipTokens.ts                 # IP token integration
├── contracts/
│   ├── DealRoomFactory.sol         # Factory for creating deal rooms
│   ├── DealRoom.sol                # Multi-sig + conditional access
│   └── EscrowManager.sol           # IP token escrow
└── types/
    └── window.d.ts                 # TypeScript definitions
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
- [CDR SDK Docs](https://docs.story.foundation/developers/cdr-sdk/overview)
- [Story Protocol](https://www.story.foundation)
- [Discord](https://discord.gg/storybuilders)

---

**Built with ❤️ for the CDR Hackathon**

*Powered by Story Protocol's Confidential Data Rails + IP Tokens*
