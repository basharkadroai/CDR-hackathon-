# DealVault

> On-chain confidential document vault. Two modes. Zero trusted middleman.

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

## Tech Stack

- **Frontend:** Next.js 15 + React + Tailwind CSS
- **Blockchain:** Story Testnet (Aeneid)
- **Privacy:** @piplabs/cdr-sdk
- **Wallet:** viem + MetaMask

## Getting Started

### Prerequisites

- Node.js 18+
- MetaMask or another Web3 wallet
- Story Testnet tokens (for production use)

### Installation

```bash
npm install
```

### Development

```bash
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

Set `NEXT_PUBLIC_USE_MOCK_CDR=false` when Story testnet tokens are available.

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

## CDR Integration

The app uses a service layer (`lib/cdr-service.ts`) that switches between mock and real CDR implementations:

- **Mock mode:** Uses localStorage for development without testnet tokens
- **Real mode:** Integrates with @piplabs/cdr-sdk for on-chain vaults

Switch by changing `useMock` flag in `cdr-service.ts` when tokens arrive.

## Deployment

Deploy to Vercel:

```bash
vercel
```

## Hackathon Submission

- **Hackathon:** CDR Hackathon — Build with Confidential Data Rails
- **Dates:** May 27 – June 5, 2026
- **Submission Deadline:** June 3, 2026
- **Demo Day:** June 5, 2026

## License

MIT
