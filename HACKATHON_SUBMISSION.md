# DealVault — CDR Hackathon Submission

**DealVault** turns any confidential file into a programmable, on-chain asset on Story's
Confidential Data Rails (CDR). Create a vault by *talking* to an AI; share it, time-lock it,
or **sell it** — and let an AI agent close the deal for you. No middleman, no shared server
keys: access is enforced by Story's validator set and on-chain conditions.

- **Live app:** https://dealvault-sable.vercel.app
- **Repo:** https://github.com/basharkadroai/CDR-hackathon-
- **Network:** Story Aeneid testnet (chain 1315)
- **SDKs:** `@piplabs/cdr-sdk` (CDR encrypt/allocate/access) + `@story-protocol/core-sdk` (IP assets + licensing)
- **No mocks:** the live site runs `NEXT_PUBLIC_USE_MOCK_CDR=false`; the mock code path was removed entirely.

---

## What it does

DealVault is one product with four vault types and an AI that operates it:

1. **Secure Share** — a free, wallet-gated encrypted file share with an expiry window.
2. **Dead Drop** — a sealed file that opens for one recipient after a future timestamp.
3. **Multi-Sig Vault** — unlocks after N-of-M signers approve on-chain.
4. **Deal Room** — a **paid** sale: a buyer pays to unlock; they mint a Story license, the
   fee goes to the seller, and the file decrypts. This is the marketplace / two-party deal.

On top of that:

- **AI assistant** — describe what you want in natural language; it builds the vault and runs
  the real on-chain CDR flow (encrypt in-browser → threshold-encrypt the data key → allocate
  on-chain). It can also **generate the content itself** ("code a calculator app and sell it")
  so the vaulted asset is real, never an empty listing.
- **Seller Agent** — when a *different* wallet opens a public Deal Room, the chat becomes the
  seller's AI agent: it pitches from a safe, redacted **preview/sample**, answers questions
  *without leaking the file*, handles objections, and drives the purchase. Agent-assisted,
  two-party, real-money commerce.
- **Confidential AI Q&A** — once you have access, the AI reads the **decrypted** file *in your
  browser* and answers questions about the real contents (docs, images, audio, video). The raw
  file never touches our servers — confidential inference over CDR-protected data.

---

## Maps directly to the CDR "what you can build" ideas

- **Idea 01 — On-chain private storage:** every vault type.
- **Idea 02 — Data marketplace (pay → unlock):** Deal Rooms, gated by Story licensing.
- **Idea 03 — Confidential query / private AI inference:** the in-vault AI Q&A + the Seller
  Agent answering buyer questions from a redacted preview without revealing the file.
- **Idea 04 — Agent-to-agent data deals:** the Seller Agent represents the seller and closes
  the deal with the buyer; the buyer's on-chain payment is an AP2-style signed mandate (the
  MetaMask signature) and the license mint settles on-chain.

---

## Track 1 — Technical Implementation (honest, precise)

**The genuinely on-chain conditional-access flow is the Deal Room.** A document is registered
as a **Story IP Asset** with priced PIL license terms, and the CDR vault's read condition is
Story's deployed **`LicenseReadCondition`** — decryption is released *only* to a wallet holding
a valid license token. To read, a buyer mints a license (paying the fee, which routes to the
seller) and then `accessCDR` collects validator partial decryptions. This is pay-to-unlock
enforced on-chain, with no off-chain coordinator.

| CDR / Story primitive used | Where |
| --- | --- |
| `OwnerWriteCondition` (Story) | only the IP owner can write the vault |
| `LicenseReadCondition` (Story) | only a paid license-holder can decrypt a Deal Room |
| `mintAndRegisterIpAssetWithPilTerms` | registers the file as IP with a priced license |
| `mintLicenseTokens` (+ WIP deposit/approve) | the buyer's on-chain payment → license |
| CDR `allocate` / `encryptDataKey` / `accessCDR` | threshold encryption + validator decryption |

**Deployed contracts on Aeneid (reference / composability):**
- `DealVaultCondition.sol` → `0xc53ddb226481aa8a582df27ca8e525f48ef20a90` — a deployed
  reference implementation of advanced read/write logic (multi-sig approvals, time-locks).
- `EscrowAccessGate.sol` → `0x052c6ae1bd931d2e3a119ba9b81ad2408f32ded0` — a composability
  demo: a pay-to-unlock contract usable as an external read gate.

**Honesty note (important):** custom condition *contracts* do not currently execute on the
Aeneid CDR precompile (their `read()`/`write()` reverts), so for the non-marketplace vault
types we use the documented **owner-only** CDR read (the creator's wallet is the condition) and
enforce the *advanced* rules (allowlist, time-lock, N-of-M) in the application layer over the
CDR-encrypted data. Multi-sig approvals are written as **real on-chain transactions** to
`DealVaultCondition.approve()`. The Deal Room (Story `LicenseReadCondition`) is the path that is
fully condition-enforced on-chain today. We deliberately do **not** claim on-chain enforcement
where it's app-layer — see `/proof` in the app, which states this precisely.

---

## Track 2 — Best CDR Application

| What they want | DealVault |
| --- | --- |
| Quality & polish | Clean dark UI, talk-to-create AI, live progress chain, per-vault chat with memory + Claude-style compaction |
| End-to-end UX someone uses twice | Create (by AI or form) → list → a real buyer discovers it in the market → Seller Agent pitches from a real sample → pay → license mints → decrypt → ask the AI about the contents |
| Real-world usability | Sell confidential datasets/research/reports without giving up the asset; informed purchase via preview/sample (no blind gamble) |
| Real traction | See `TRACTION_KIT.md` (Twitter/LinkedIn drafts) — to be posted alongside submission |

**No blind gambling:** real data marketplaces sell with a free sample + metadata, value gated
behind purchase. DealVault auto-generates a safe **preview** from the actual file (what's
inside + a redacted sample + attributes) so a buyer evaluates before paying.

---

## Reproduce / judge

- **Easiest:** open the live app, connect a wallet on Aeneid, and create a vault (AI or sidebar).
  Open `/proof` for verifiable on-chain transactions.
- **Two-party Deal Room:** create a public Deal Room with Wallet A; open it from the Deal Room
  market with Wallet B → the Seller Agent + "Pay X IP to unlock" → license mints → file decrypts.

```bash
git clone https://github.com/basharkadroai/CDR-hackathon-.git
cd CDR-hackathon- && npm install
cp .env.example .env.local   # defaults point at Aeneid + real CDR (no mock)
npm run dev                   # http://localhost:3000
```

Requires `GROQ_API_KEY` (AI), `KV_REST_API_URL`/`KV_REST_API_TOKEN` (Upstash, cross-device
index), and a testnet wallet. `FUNDER_PRIVATE_KEY` powers the in-app gas faucet (testnet-only).

---

## What's honest about the current state

- **Deal Room pay-to-unlock is real and on-chain:** Story IP + priced license + `LicenseReadCondition`,
  verified end-to-end (a buyer minted a license and the vault decrypted).
- **CDR encryption + creator decryption is real and verified** (threshold encryption, validator
  partials recover the exact plaintext).
- **Advanced conditions for Secure Share / Dead Drop / Multi-Sig are enforced in the app layer**
  over CDR-encrypted data (the on-chain read is owner-only). Multi-sig approvals are real
  on-chain txs. We state this in `/proof`.
- **Encrypted blobs** are mirrored to Upstash Redis for cross-device access; the access-control
  that matters (the data key) is CDR-protected. Production would move blobs to IPFS/Storacha.
- **The AI's confidential Q&A** runs inference over the decrypted file client-side; in production
  this would run inside CDR's TEEs so the data is never exposed even to the inference layer.
