# DealVault — CDR Hackathon Submission

**DealVault** is an enterprise-grade confidential deal-room platform built on Story's
Confidential Data Rails (CDR). It replaces $99–$25k/mo centralized virtual data rooms
(Datasite, iDeals, Firmex) with trustless, on-chain access control — no middleman,
no shared server keys, just programmable CDR conditions enforced by the validator set.

- **Live app:** https://dealvault-sable.vercel.app
- **Repo:** https://github.com/basharkadroai/CDR-hackathon-
- **Network:** Story Aeneid testnet (chain 1315)
- **SDK:** `@piplabs/cdr-sdk` 0.2.1

---

## Proof it runs on real CDR (verified on-chain)

A full upload → threshold-decrypt round trip executed on Aeneid:

- **Vault UUID:** `4457`
- **Allocate tx:** `0xc8f7fa593714e6537e1c612b3567166ba73e72d7adcae978ffd0d48c060587d1`
  (status `0x1`, calls the CDR precompile `0xcccccc0000000000000000000000000000000005`)
- **Result:** `accessCDR` collected validator partial decryptions and recovered the exact
  plaintext — confirming genuine threshold encryption, not a mock.

Anyone can reproduce this live by creating a vault in the app (AI assistant or the
sidebar "New vault" menu) and opening it — the access flow performs a real CDR
read with validator threshold decryption. On-chain proof of real usage is
aggregated at **`/proof`**. No mock mode — the live site runs
`NEXT_PUBLIC_USE_MOCK_CDR=false`.

---

## Track 1 — Technical Implementation

Everything the track asks for, implemented as **real CDR read/write condition contracts**:

| What they want | DealVault |
| --- | --- |
| Advanced read/write conditions (multi-sig, time-based, multi-step) | `DealVaultCondition.sol` implements **time-based** (Dead Drop unlock timestamp), **allowlist + expiry** (Deal Room), and **multi-sig N-of-M** (on-chain approval counting) read conditions |
| Smart contracts enforcing complex/conditional access | The CDR validator set calls `checkReadCondition`/`checkWriteCondition`; data only releases when the encoded rule passes |
| Composable vault systems interacting with other contracts | `EscrowAccessGate.sol` (pay-to-unlock escrow) plugs into any vault via the `IAccessGate` hook — a CDR read can require an **external contract's** state |
| Trustless data exchange using CDR vaults | Client-side AES-GCM + CDR-protected data key; recovered only via validator partials |
| New patterns for programmable/dynamic permissions | On-chain approval tally (`approve()` / `approvalsFor()`) + pluggable external gate = dynamic, composable permissions with no off-chain coordinator |

**Deployed on Story Aeneid (chain 1315):**
- `DealVaultCondition.sol` → **`0xc53ddb226481aa8a582df27ca8e525f48ef20a90`**
  (deploy tx `0xf2a34cfbdbcdc7ea8d142ff1ef149f1214713f6bf2b0ba748b77dbfc6029c0b7`)
- `EscrowAccessGate.sol` → **`0x052c6ae1bd931d2e3a119ba9b81ad2408f32ded0`**
  (deploy tx `0x1bd66e280a9717c200369667898bc521ecea08a1afd03d29046205c339d3810c`)

View on explorer: https://aeneid.storyscan.io/address/0xc53ddb226481aa8a582df27ca8e525f48ef20a90

The live app is configured with these addresses, so CDR conditions are enforced
on-chain (not the owner-only fallback).

**Architecture:** A random AES-256 data key encrypts the file in the browser. The data
key is threshold-encrypted to the validator DKG key and written to an on-chain CDR vault
gated by `DealVaultCondition`. Reads call `accessCDR`, which enforces the condition
on-chain and collects validator partial decryptions to recover the key.

---

## Track 2 — Best CDR Application

| What they want | DealVault |
| --- | --- |
| Quality & polish | Dark enterprise UI, drag-drop upload, progress, toasts, responsive |
| End-to-end UX someone uses twice | Create (Deal Room / Dead Drop / Multi-Sig) → dashboard → access/download, with automatic network switching to Aeneid |
| Real-world usability | Targets a real $10B+ market: M&A, fundraising, succession — flows mirror how deal teams actually work |
| Real traction | (in progress) |

**Three product flows, all on real CDR:**
- **Deal Room** — wallet-gated diligence packets with an expiry window
- **Dead Drop** — sealed file that opens for one recipient after a future timestamp
- **Multi-Sig Vault** — unlocks only after N-of-M signers approve on-chain

---

## Reproduce / judge locally

```bash
git clone https://github.com/basharkadroai/CDR-hackathon-.git
cd CDR-hackathon-
npm install
cp .env.example .env.local   # defaults already point at Aeneid + real CDR
npm run dev                   # http://localhost:3000
```

To enable on-chain condition enforcement (vs. the owner-only fallback), deploy the
condition contracts and set the address:

```bash
DEPLOYER_PRIVATE_KEY=0xYOUR_AENEID_KEY npm run deploy:condition
# prints NEXT_PUBLIC_DEALVAULT_CONDITION_ADDRESS + NEXT_PUBLIC_ESCROW_GATE_ADDRESS
# set them in Vercel (or .env.local) and redeploy
```

`npm run hackathon:check` prints a readiness checklist.

---

## What's honest about the current state

- Real CDR upload/access is **live and verified on-chain** (above).
- Condition contracts compile (`viaIR`) and deploy via `npm run deploy:condition`;
  set `NEXT_PUBLIC_DEALVAULT_CONDITION_ADDRESS` to switch from the owner-only fallback
  to full multi-party condition enforcement.
- Encrypted file blobs are stored client-side (localStorage) for the demo; production
  would move them to IPFS/Storacha. The access control that matters (the data key) is
  fully on-chain via CDR.
