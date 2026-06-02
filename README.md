# DealVault

DealVault is a confidential deal-room app for M&A, fundraising, diligence, and sealed-disclosure workflows. It is built for the 2026 CDR Hackathon on Story's **Confidential Data Rails (CDR)** — real CDR vault uploads, validator threshold decryption, and deployed on-chain condition contracts on Story Aeneid.

- Live app: https://dealvault-sable.vercel.app
- On-chain proof (live, auto-updating): https://dealvault-sable.vercel.app/proof
- Repository: https://github.com/basharkadroai/CDR-hackathon-
- Network: Story Aeneid testnet, chain `1315`
- CDR SDK: `@piplabs/cdr-sdk` `0.2.1`

## What It Does

DealVault replaces centralized virtual data rooms with programmable, confidential, on-chain vaults — and makes them dead simple to create.

**Three vault types, each with a real on-chain CDR condition:**
- **Deal Room** — wallet-gated encrypted document room with an expiry window.
- **Dead Drop / Recovery Vault** — a sealed file that unlocks for one recipient only after a future timestamp.
- **Multi-Sig Vault** — a file that unlocks only after an on-chain N-of-M approval threshold.
- **Pay-to-Unlock** — composable escrow access, where an external contract (`EscrowAccessGate`) gates the CDR read.

**What makes it usable, not just a demo:**
- **AI assistant** — describe the vault in one sentence and attach a file; the assistant extracts the wallets, dates, and thresholds, then creates a real on-chain vault in one click. A live "thinking chain" shows the actual CDR steps (encrypt → allocate → threshold-encrypt → write).
- **Zero-friction onboarding** — connect a wallet and the app **drips free testnet gas in one click** (no external faucet trip), so anyone can create a vault in ~30 seconds.
- **Cross-device** — the wallet is the auth: the same wallet (and authorized readers) can list and open their vaults from any device, not just the browser that created them.
- **Live proof** — every vault created by anyone auto-appears on `/proof` with its wallet and on-chain transaction, verifiable on the block explorer.
- **Per-vault AI chat** — ask questions about a vault (metadata only; contents are never decrypted to the model).

Files are encrypted in the browser. The data key is protected by CDR — not by a server the app controls. Reads only succeed when the configured on-chain CDR condition passes.

## Why CDR Matters Here

Traditional VDR products require trusting a centralized operator. DealVault uses CDR so the key-release path is enforced by Story's validator set:

1. The browser generates a random AES-256 data key.
2. The file is encrypted client-side with AES-GCM.
3. The data key is threshold-encrypted to the validator DKG public key.
4. The encrypted key is written to an on-chain CDR vault with read/write conditions.
5. `accessCDR` enforces the read condition on-chain and collects validator partial decryptions.
6. The file decrypts only after the validator-enforced condition passes.

No single party ever holds the full decryption key.

## Verified Real CDR Proof

A real upload + access round trip verified on Story Aeneid:

- CDR vault UUID: `4457`
- Allocate transaction: `0xc8f7fa593714e6537e1c612b3567166ba73e72d7adcae978ffd0d48c060587d1`
- Result: `accessCDR` recovered the original plaintext through validator partial decryptions.

The live app runs real CDR (`NEXT_PUBLIC_USE_MOCK_CDR=false`). Ongoing real usage is aggregated, on-chain and verifiable, at **`/proof`**.

## Deployed Contracts (Story Aeneid)

- `DealVaultCondition.sol` — `0xc53ddb226481aa8a582df27ca8e525f48ef20a90`
  ([explorer](https://aeneid.storyscan.io/address/0xc53ddb226481aa8a582df27ca8e525f48ef20a90), deploy tx `0xf2a34cfbdbcdc7ea8d142ff1ef149f1214713f6bf2b0ba748b77dbfc6029c0b7`).
  Implements `checkReadCondition` / `checkWriteCondition` for all three vault types plus a composable external-gate hook.
- `EscrowAccessGate.sol` — `0x052c6ae1bd931d2e3a119ba9b81ad2408f32ded0`
  ([explorer](https://aeneid.storyscan.io/address/0x052c6ae1bd931d2e3a119ba9b81ad2408f32ded0), deploy tx `0x1bd66e280a9717c200369667898bc521ecea08a1afd03d29046205c339d3810c`).
  Implements `IAccessGate` — pay-to-unlock escrow that `DealVaultCondition` calls to gate a read.

## Hackathon Track Fit

**Technical implementation:**
- Advanced read/write conditions: wallet allowlists, expiry windows, future unlock timestamps, and N-of-M approval thresholds.
- Smart-contract enforcement via `checkReadCondition` / `checkWriteCondition`.
- Composable vaults interacting with other contracts via `EscrowAccessGate` and the `IAccessGate` hook (pay-to-unlock).
- Trustless data exchange using CDR-protected keys + client-side ciphertext.
- Dynamic permissions via on-chain approval state and external gate composition.

**Best application:**
- End-to-end: describe → AI creates → access → download, with one-click testnet funding.
- Conversational creation, cross-device access, and a live, verifiable proof page.
- Real, on-chain traction anyone can audit at `/proof`.

## Architecture

- `lib/cdr-service.ts` — the CDR boundary: client-side AES encryption, `allocate` + threshold-encrypt + `write`, `accessCDR` read flow, and condition encoding. Mirrors vault index + ciphertext to a server store for cross-device access.
- `app/api/assistant` + `app/api/vault-chat` — Groq-backed AI (native tool-calling for vault creation; metadata-only Q&A).
- `app/api/vaults`, `app/api/blob`, `app/api/proof`, `app/api/fund` — Upstash Redis backed: cross-device vault index, encrypted-blob mirror, public proof log, and the in-app gas faucet.
- `contracts/` — the deployed CDR condition + escrow-gate contracts.

## Run Locally

```bash
git clone https://github.com/basharkadroai/CDR-hackathon-.git
cd CDR-hackathon-
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

Open `http://localhost:3000`.

Environment variables:

```env
# Core CDR / chain (contract addresses have safe on-chain defaults baked in)
NEXT_PUBLIC_USE_MOCK_CDR=false
NEXT_PUBLIC_CHAIN_ID=1315
NEXT_PUBLIC_STORY_RPC_URL=https://aeneid.storyrpc.io
NEXT_PUBLIC_CDR_API_URL=http://172.192.41.96:1317

# AI assistant (Groq) — needed for conversational creation + vault chat
GROQ_API_KEY=your_groq_key

# Optional: Upstash Redis powers /proof, cross-device vaults, and the in-app faucet.
# Without these the app still works (single-device, no auto-proof/faucet).
KV_REST_API_URL=...
KV_REST_API_TOKEN=...

# Optional: in-app gas faucet (testnet-only deployer key that holds Aeneid IP)
FUNDER_PRIVATE_KEY=...
```

Checks:

```bash
npm run lint
npm run build
npm run hackathon:check
```

## Project Structure

```text
app/                     Next.js app routes, UI, and API routes
app/components/          Sidebar, AI Assistant, FundGas, etc.
app/api/                 assistant, vault-chat, vaults, blob, proof, fund, cdr proxy
app/proof/               public on-chain proof page
lib/cdr-service.ts       the real/mock CDR boundary (encryption + on-chain flow)
lib/wallet.ts            Story Aeneid chain + wallet clients
contracts/               deployed CDR condition + escrow-gate contracts
scripts/                 condition deployment + submission readiness check
```

## Submission Files

- `HACKATHON_SUBMISSION.md` — judge-facing technical proof and track mapping.
- `DEMO_SCRIPT.md` — demo video script.
- `TRACTION_KIT.md` — launch + recruitment posts.
- `SUBMISSION_CHECKLIST.md` — final human tasks before submitting.

## Team

Built by Bashar Kadro for the CDR Hackathon 2026.
