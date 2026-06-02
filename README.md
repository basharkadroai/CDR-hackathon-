<div align="center">

# 🔐 DealVault

**Confidential document sharing on Story's Confidential Data Rails.**

Encrypt a document, lock it behind a programmable on-chain condition, and share it — with no trusted middleman.

[**Live App**](https://dealvault-sable.vercel.app) · [**On-Chain Proof**](https://dealvault-sable.vercel.app/proof) · [**Repository**](https://github.com/basharkadroai/CDR-hackathon-)

![Story Aeneid](https://img.shields.io/badge/Story-Aeneid%20testnet-4F9BBE)
![Chain](https://img.shields.io/badge/chain-1315-555)
![CDR SDK](https://img.shields.io/badge/%40piplabs%2Fcdr--sdk-0.2.1-555)
![Next.js](https://img.shields.io/badge/Next.js-16-000)
![Real CDR](https://img.shields.io/badge/mode-real%20CDR-3a9)

</div>

---

## Overview

Every acquisition, fundraise, and legal disclosure depends on sharing sensitive documents — today through virtual data rooms that cost thousands a month and require you to *trust* a centralized operator with your most confidential files.

DealVault replaces that trust with cryptography. Files are encrypted in the browser; the decryption key is threshold-encrypted across Story's validator network and written to an on-chain CDR vault that **only releases access when a programmable condition passes.** No single party ever holds the key.

Built for the **2026 CDR Hackathon** on Story Aeneid, running real CDR — not a mock.

---

## Features

### Four programmable vault types

| Type | Unlocks when… | Enforced by |
| --- | --- | --- |
| **Secure Share** | caller is on the wallet allowlist, before the expiry window | `checkReadCondition` |
| **Recovery Vault / Dead Drop** | caller is the one recipient, after a future timestamp | on-chain time-lock |
| **Multi-Sig Vault** | an N-of-M signer threshold has approved on-chain | on-chain approval count |
| **Payment Gate Demo** | an external contract reports payment | `IAccessGate` composition |

### Built to actually be used

- **AI assistant** — describe the vault in one sentence, attach a file, and it extracts the wallets, dates, and thresholds and creates a real on-chain vault in one click. A live "thinking chain" surfaces each CDR step: encrypt → allocate → threshold-encrypt → write.
- **Zero-friction onboarding** — connect a wallet and the app **drips free testnet gas in one click** — no external faucet trip. Anyone can create a vault in ~30 seconds.
- **Cross-device** — the wallet is the auth: the same wallet (and authorized readers) can list and open vaults from any device, not just the browser that created them.
- **Live, verifiable proof** — every vault anyone creates auto-appears on [`/proof`](https://dealvault-sable.vercel.app/proof) with its wallet and transaction, auditable on the block explorer.
- **Per-vault AI chat** — ask questions about a vault (metadata only; contents are never exposed to the model).
- **Honest expiry model** — expiry blocks future CDR decryptions; it cannot revoke a file that a reader already downloaded.

---

## How CDR Works Here

```
1. Browser generates a random AES-256 data key
2. File is encrypted client-side (AES-GCM)
3. Data key is threshold-encrypted to the validator DKG public key
4. Encrypted key is written to an on-chain CDR vault with read/write conditions
5. accessCDR enforces the read condition on-chain + collects validator partial decryptions
6. File decrypts only after the validator-enforced condition passes
```

The key release path is enforced by Story's validator set — not by a server DealVault controls.

---

## Verified Real CDR Proof

A real upload + access round trip on Story Aeneid:

- **Vault UUID:** `4457`
- **Allocate tx:** [`0xc8f7fa59…587d1`](https://aeneid.storyscan.io/tx/0xc8f7fa593714e6537e1c612b3567166ba73e72d7adcae978ffd0d48c060587d1)
- **Result:** `accessCDR` recovered the original plaintext through validator partial decryptions.

Ongoing, real usage is aggregated live at **[`/proof`](https://dealvault-sable.vercel.app/proof)** — distinct wallets, real transactions, all verifiable.

---

## Deployed Contracts — Story Aeneid

| Contract | Address | Role |
| --- | --- | --- |
| [`DealVaultCondition.sol`](https://aeneid.storyscan.io/address/0xc53ddb226481aa8a582df27ca8e525f48ef20a90) | `0xc53ddb22…f20a90` | Read/write conditions for all vault types + composable gate hook |
| [`EscrowAccessGate.sol`](https://aeneid.storyscan.io/address/0x052c6ae1bd931d2e3a119ba9b81ad2408f32ded0) | `0x052c6ae1…2ded0` | `IAccessGate` composability demo — a payment contract can gate a CDR read |

---

## Hackathon Track Fit

**Technical Implementation**
- Advanced read/write conditions: allowlists, expiry windows, future unlock timestamps, N-of-M thresholds.
- Smart-contract enforcement via `checkReadCondition` / `checkWriteCondition`.
- Composable vaults interacting with other contracts via the `IAccessGate` hook. The current app does not expose a priced pay-to-unlock create flow; the escrow contract is deployed as a composability demo.
- Trustless data exchange using CDR-protected keys + client-side ciphertext.
- Dynamic permissions via on-chain approval state and external gate composition.

**Best Application**
- End-to-end flow: describe → AI creates → access → download, with one-click testnet funding.
- Conversational creation, cross-device access, and a live, verifiable proof page.
- Real on-chain traction anyone can audit at `/proof`.

---

## Architecture

| Path | Responsibility |
| --- | --- |
| `lib/cdr-service.ts` | CDR boundary — client-side AES encryption, `allocate` + threshold-encrypt + `write`, `accessCDR` reads, condition encoding, and cross-device mirroring |
| `app/api/assistant`, `app/api/vault-chat` | Groq-backed AI — native tool-calling for vault creation; metadata-only Q&A |
| `app/api/vaults`, `app/api/blob`, `app/api/proof`, `app/api/fund` | Upstash Redis — cross-device vault index, encrypted-blob mirror, public proof log, in-app gas faucet |
| `contracts/` | Deployed CDR condition + escrow-gate contracts |

---

## Run Locally

```bash
git clone https://github.com/basharkadroai/CDR-hackathon-.git
cd CDR-hackathon-
npm install
cp .env.example .env.local   # fill in the values below
npm run dev                  # http://localhost:3000
```

```env
# Core CDR / chain — contract addresses have safe on-chain defaults baked in
NEXT_PUBLIC_USE_MOCK_CDR=false
NEXT_PUBLIC_CHAIN_ID=1315
NEXT_PUBLIC_STORY_RPC_URL=https://aeneid.storyrpc.io
NEXT_PUBLIC_CDR_API_URL=http://172.192.41.96:1317

# AI assistant (Groq) — required for conversational creation + vault chat
GROQ_API_KEY=your_groq_key

# Optional — Upstash Redis powers /proof, cross-device vaults, and the faucet.
# Without it the app still works (single-device, no auto-proof/faucet).
KV_REST_API_URL=...
KV_REST_API_TOKEN=...

# Optional — in-app gas faucet (testnet-only wallet holding Aeneid IP)
FUNDER_PRIVATE_KEY=...
```

```bash
npm run lint            # clean
npm run build           # production build
npm run hackathon:check # submission readiness
```

---

## Project Structure

```text
app/
├─ components/      Sidebar, AI Assistant, FundGas, …
├─ api/             assistant · vault-chat · vaults · blob · proof · fund · cdr proxy
├─ proof/           public on-chain proof page
├─ dashboard/       vault detail + per-vault AI chat
└─ deal-room · dead-drop · multi-sig   manual create flows
lib/
├─ cdr-service.ts   real/mock CDR boundary (encryption + on-chain flow)
└─ wallet.ts        Story Aeneid chain + wallet clients
contracts/          deployed CDR condition + escrow-gate contracts
scripts/            condition deployment + submission readiness check
```

---

## Submission Files

| File | Purpose |
| --- | --- |
| `HACKATHON_SUBMISSION.md` | Judge-facing technical proof and track mapping |
| `DEMO_SCRIPT.md` | Demo video script |
| `TRACTION_KIT.md` | Launch + recruitment posts |
| `SUBMISSION_CHECKLIST.md` | Final human tasks before submitting |

---

<div align="center">

Built by **Bashar Kadro** for the CDR Hackathon 2026 · Powered by [Story](https://story.foundation) Confidential Data Rails

</div>
