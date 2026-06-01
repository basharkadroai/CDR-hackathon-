# DealVault

DealVault is a confidential deal-room app for M&A, fundraising, diligence, and sealed disclosure workflows. It is built for the 2026 CDR Hackathon on Story's Confidential Data Rails (CDR), using real CDR vault uploads, validator threshold recovery, and deployed on-chain condition contracts on Story Aeneid.

- Live app: https://dealvault-sable.vercel.app
- Real CDR test page: https://dealvault-sable.vercel.app/test-cdr
- Repository: https://github.com/basharkadroai/CDR-hackathon-
- Network: Story Aeneid testnet, chain `1315`
- CDR SDK: `@piplabs/cdr-sdk` `0.2.1`

## What It Does

DealVault replaces centralized virtual data rooms with programmable confidential vaults:

- Deal Rooms: wallet-gated encrypted document rooms with expiry windows.
- Dead Drops: sealed files that unlock for a specific recipient after a future timestamp.
- Multi-Sig Vaults: files that unlock only after an on-chain N-of-M approval threshold.
- Pay-to-Unlock Gates: composable escrow access using an external smart contract gate.

Files are encrypted in the browser. The data key is protected by CDR, not by a server controlled by the app. Reads only work when the configured on-chain CDR condition passes.

## Why CDR Matters Here

Traditional VDR products require users to trust a centralized operator. DealVault uses CDR so the sensitive key release path is enforced by Story's validator set:

1. The browser generates a random AES-256 data key.
2. The file is encrypted client-side with AES-GCM.
3. The data key is threshold-encrypted to the validator DKG public key.
4. The encrypted key is stored in an on-chain CDR vault with read/write conditions.
5. `accessCDR` enforces the condition on-chain and collects validator partial decryptions.
6. The file decrypts only after the validator-enforced condition passes.

## Verified Real CDR Proof

A real upload and access round trip has been verified on Story Aeneid:

- CDR vault UUID: `4457`
- Allocate transaction: `0xc8f7fa593714e6537e1c612b3567166ba73e72d7adcae978ffd0d48c060587d1`
- Result: `accessCDR` recovered the original plaintext through validator partial decryptions.
- Live verifier: `/test-cdr` on the deployed app.

The live app is configured for real CDR mode with `NEXT_PUBLIC_USE_MOCK_CDR=false`.

## Deployed Contracts

Story Aeneid testnet:

- `DealVaultCondition.sol`: `0xc53ddb226481aa8a582df27ca8e525f48ef20a90`
- Deploy transaction: `0xf2a34cfbdbcdc7ea8d142ff1ef149f1214713f6bf2b0ba748b77dbfc6029c0b7`
- Explorer: https://aeneid.storyscan.io/address/0xc53ddb226481aa8a582df27ca8e525f48ef20a90

- `EscrowAccessGate.sol`: `0x052c6ae1bd931d2e3a119ba9b81ad2408f32ded0`
- Deploy transaction: `0x1bd66e280a9717c200369667898bc521ecea08a1afd03d29046205c339d3810c`
- Explorer: https://aeneid.storyscan.io/address/0x052c6ae1bd931d2e3a119ba9b81ad2408f32ded0

## Hackathon Track Fit

Technical implementation track:

- Advanced read/write conditions through wallet allowlists, time windows, unlock timestamps, and N-of-M approval thresholds.
- Smart contract enforcement through `checkReadCondition` and `checkWriteCondition`.
- Composable vault access through `EscrowAccessGate.sol` and the `IAccessGate` hook.
- Trustless data exchange using CDR-protected data keys and client-side encrypted ciphertext.
- Dynamic permissions through on-chain approval state and external gate composition.

Best application track:

- End-to-end flows for creating, sharing, accessing, and downloading confidential vault content.
- Responsive product UI for real diligence workflows.
- A live CDR diagnostic page judges can run without reading code.
- Submission materials for demo video, launch posts, and final checklist.

## Current Scope

What is production-grade for the hackathon:

- Real CDR upload/access path.
- Deployed CDR condition contracts.
- Wallet-based Story Aeneid integration.
- Client-side encryption before upload.
- Judge-ready live app and local reproduction path.

Honest demo limitation:

- Encrypted file blobs are stored in browser storage for the demo. A production deployment should move ciphertext blobs to IPFS, Storacha, or another durable content layer. The key release and access control path already uses CDR.

## Run Locally

```bash
git clone https://github.com/basharkadroai/CDR-hackathon-.git
cd CDR-hackathon-
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Required or recommended environment variables:

```env
NEXT_PUBLIC_STORY_RPC_URL=https://aeneid.storyrpc.io
NEXT_PUBLIC_CHAIN_ID=1315
NEXT_PUBLIC_CDR_API_URL=http://172.192.41.96:1317
NEXT_PUBLIC_USE_MOCK_CDR=false
NEXT_PUBLIC_DEALVAULT_CONDITION_ADDRESS=0xc53ddb226481aa8a582df27ca8e525f48ef20a90
NEXT_PUBLIC_ESCROW_GATE_ADDRESS=0x052c6ae1bd931d2e3a119ba9b81ad2408f32ded0
NEXT_PUBLIC_ESCROW_MANAGER_ADDRESS=0x0000000000000000000000000000000000000000
```

Useful checks:

```bash
npm run lint
npm run build
npm run hackathon:check
```

## Project Structure

```text
app/                         Next.js app routes and UI
app/test-cdr/                Real CDR diagnostic flow for judges
contracts/                   CDR condition and escrow gate contracts
lib/cdr-service.ts           Real/mock CDR service boundary
lib/crypto.ts                Browser encryption helpers
scripts/deploy-condition.mjs Story Aeneid condition deployment script
scripts/hackathon-readiness.mjs Submission readiness check
```

## Submission Files

- `HACKATHON_SUBMISSION.md`: concise judge-facing technical proof and track mapping.
- `DEMO_SCRIPT.md`: demo video script.
- `TRACTION_KIT.md`: launch posts and traction prompts.
- `SUBMISSION_CHECKLIST.md`: final human tasks before clicking submit.

## Final Submission Reminder

Before submitting, make this GitHub repository public, record the demo video, post the traction updates, and paste the live app plus repository links into the hackathon submission form.

## Team

Built by Bashar Kadro for the CDR Hackathon 2026.
