# DealVault CDR Hackathon Submission Runbook

Use this file as the final pre-submit checklist for the CDR Hackathon.

## 1. Deploy the CDR condition contract

DealVault only wins the technical track if judges can see CDR enforcing dynamic permissions on-chain. Deploy the condition contract before the final Vercel deployment:

```bash
npm install
DEPLOYER_PRIVATE_KEY=0xYOUR_STORY_AENEID_PRIVATE_KEY npm run deploy:condition
```

The script writes `deployments/story-aeneid.json` and prints:

```env
NEXT_PUBLIC_DEALVAULT_CONDITION_ADDRESS=0x...
```

Set that value in Vercel, then redeploy the app. Without this env var, DealVault intentionally falls back to owner-only CDR so basic upload/access still works, but the advanced shared-access demo is not active.

## 2. Smoke-test the live app

On the deployed Vercel URL:

1. Visit `/test-cdr`.
2. Run **Check Mode**.
3. Run **Test Proxy**.
4. Connect a wallet on Story Aeneid.
5. Run **Real CDR Upload**.
6. Run **Real CDR Access**.
7. Copy the vault UUID and tx hash into the submission notes.

## 3. Technical Implementation judging map

| Requirement | What to demo |
| --- | --- |
| Advanced read/write conditions | `DealVaultCondition.sol` checks Deal Room authorized wallets + expiry and Dead Drop recipient + unlock time. |
| Smart contracts enforcing conditional access | Show the deployed condition contract address and the `NEXT_PUBLIC_DEALVAULT_CONDITION_ADDRESS` Vercel env var. |
| Trustless data exchange using CDR vaults | Show encrypted file upload, CDR vault UUID, and `accessCDR` recovery/decrypt from `/test-cdr` or dashboard. |
| Dynamic permissioning | Create a Deal Room with an authorized wallet and expiry; create a Dead Drop with a recipient and future unlock. |
| Composable path | Explain that the CDR vault UUID + condition contract can be referenced by other Story contracts, while `DealRoom.sol` models multi-sig/document-chain extensions. |

## 4. Best CDR Application judging map

| Requirement | What to prepare |
| --- | --- |
| Quality and polish | Live demo link, screenshots, dashboard flow, Deal Room + Dead Drop walkthrough. |
| Real traction | Add X/Twitter and LinkedIn post links. Include Discord or DM screenshots if available. |
| Evidence users want it | Add 2-3 quotes from founders/investors/lawyers/operators who would use deal rooms. |
| End-to-end UX | Demo: landing page → connect wallet → create vault → dashboard → access/decrypt. |

## 5. Submission copy

**One-liner:** DealVault is a trustless virtual data room for M&A, fundraising, and sensitive business files, powered by Story CDR dynamic access conditions.

**Technical highlight:** DealVault turns private deal documents into programmable CDR vaults, using a custom condition contract to enforce wallet-gated, time-limited Deal Rooms and recipient/time-locked Dead Drops without a trusted middleman.

**Product highlight:** Traditional VDRs are expensive and centralized; DealVault gives founders and investors a lightweight, wallet-native alternative with cryptographic access guarantees.

## 6. Commands to run before final submit

```bash
npm test -- --runInBand --silent
npm run lint
npm run build
npm run hackathon:check
```
