# DealVault

> On-chain confidential document vault. Two modes. Zero trusted middleman.

**Live Demo:** https://dealvault-sable.vercel.app

Built for the CDR Hackathon powered by Story Protocol.

## What is DealVault?

DealVault provides trustless document storage and access control using Story Protocol's Confidential Data Rails (CDR). Access is enforced by smart contracts on-chain — no company, no server, no trust required.

### Two Modes

**Deal Room** — Time-limited document sharing for fundraising, M&A, and due diligence
- Upload confidential documents
- Set authorized wallet addresses
- Define access window (24h, 7d, 30d, custom)
- Access automatically revokes on-chain when window closes

**Dead Drop** — Sealed documents that unlock automatically on a future date
- Upload document that nobody can open (including you)
- Set future unlock date
- Specify recipient wallet
- Smart contract enforces unlock condition

## Why DealVault?

Traditional virtual data rooms (VDRs) cost $99-$25,000/month and require trusting a centralized company. DealVault replaces that trust with cryptographic guarantees and smart contracts.

**The Problem:**
- Datasite: $25,000+/year
- iDeals: ~€460/month
- Firmex: $625/month
- All centralized, all require trust

**The Solution:**
- DealVault: Trustless, on-chain, cryptographically secure
- No monthly fees, no trusted middleman
- Smart contracts enforce access control

## Tech Stack

- **Frontend:** Next.js 15 + React + Tailwind CSS
- **Blockchain:** Story Testnet (Aeneid)
- **Privacy:** @piplabs/cdr-sdk
- **Wallet:** viem + MetaMask
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- MetaMask or another Web3 wallet
- Story Testnet tokens (optional - mock mode available)

### Installation

```bash
# Clone the repository
git clone https://github.com/Smiley617/CDR-hackathon-.git
cd dealvault

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_STORY_RPC_URL=https://aeneid.storyrpc.io
NEXT_PUBLIC_CHAIN_ID=1513
NEXT_PUBLIC_USE_MOCK_CDR=true
```

**Note:** The app currently runs in mock mode for development. Set `NEXT_PUBLIC_USE_MOCK_CDR=false` when Story testnet tokens are available.

## Project Structure

```
dealvault/
├── app/
│   ├── page.tsx              # Landing page
│   ├── dashboard/            # Vault dashboard
│   ├── deal-room/            # Deal Room creation
│   └── dead-drop/            # Dead Drop creation
├── lib/
│   ├── cdr-service.ts        # CDR abstraction layer (mock + real)
│   └── wallet.ts             # Wallet connection utilities
└── types/
    └── window.d.ts           # TypeScript definitions
```

## How It Works

### 1. Upload & Encrypt
Your document is encrypted client-side and stored in a CDR vault on Story Protocol.

### 2. Set Conditions
Define access rules: wallet addresses, time windows, or future unlock dates.

### 3. Smart Contract Enforces
On-chain conditions control access. No company. No server. Just code.

## CDR Integration

The app uses a service layer (`lib/cdr-service.ts`) that switches between mock and real CDR implementations:

- **Mock mode:** Uses localStorage for development without testnet tokens
- **Real mode:** Integrates with @piplabs/cdr-sdk for on-chain vaults

### Deployed Condition Contracts (Aeneid Testnet)

| Contract | Address |
|---|---|
| `OwnerWriteCondition` | `0x4C9bFC96d7092b590D497A191826C3dA2277c34B` |
| `LicenseReadCondition` | `0xC0640AD4CF2CaA9914C8e5C44234359a9102f7a3` |

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Or deploy to production
vercel --prod
```

### Environment Variables on Vercel

Add these in your Vercel project settings:
- `NEXT_PUBLIC_STORY_RPC_URL=https://aeneid.storyrpc.io`
- `NEXT_PUBLIC_CHAIN_ID=1513`
- `NEXT_PUBLIC_USE_MOCK_CDR=true`

## Demo Video

[Coming Soon - Recording demo for submission]

## Hackathon Submission

- **Hackathon:** CDR Hackathon — Build with Confidential Data Rails
- **Presented by:** Story Protocol
- **Dates:** May 27 – June 5, 2026
- **Submission Deadline:** June 3, 2026
- **Demo Day:** June 5, 2026
- **Prize Pool:** $3,000 USD

### Tracks

**Technical Implementation ($1,000):**
- Advanced on-chain permission logic
- Time-based unlocking
- Wallet allowlists
- Composable vault systems

**Best CDR Application ($2,000):**
- Live deployed URL ✓
- Real-world usability ✓
- Polished product ✓
- Evidence of demand ✓

## Resources

- [Hackathon Page](https://build.usecdr.dev)
- [CDR SDK Docs](https://docs.usecdr.dev)
- [Story Protocol](https://www.story.foundation)
- [Discord](https://discord.gg/storyprotocol)

## License

MIT

---

Built with ❤️ for the CDR Hackathon
