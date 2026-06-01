# DealVault - Hackathon Readiness

Current status: repo-side readiness is complete. The remaining blockers are
human-facing proof tasks: demo video, social posts, user feedback, and the final
submission form.

## Technical Track Readiness

- [x] Real CDR integration is live through `@piplabs/cdr-sdk`
- [x] Real CDR upload/access proof is documented in `HACKATHON_SUBMISSION.md`
- [x] `/test-cdr` lets judges run a live CDR diagnostic flow
- [x] `DealVaultCondition.sol` is deployed on Story Aeneid
- [x] `EscrowAccessGate.sol` is deployed on Story Aeneid
- [x] Read/write conditions are encoded into CDR vault allocation
- [x] Deal Room rules enforce wallet allowlist + expiry
- [x] Dead Drop rules enforce recipient + future unlock time
- [x] Multi-Sig rules enforce N-of-M approvals before read access
- [x] External gate support demonstrates composability with other contracts

## Application Track Readiness

- [x] Live production app exists: https://dealvault-sable.vercel.app
- [x] End-to-end flows exist for Deal Room, Dead Drop, and Multi-Sig vaults
- [x] Dashboard includes vault status, enforcement mode, UUIDs, and explorer links
- [x] Wallet/network switching supports Story Aeneid
- [x] UX includes progress states, toasts, validation, and responsive layouts
- [x] B2B product story is clear: M&A, fundraising, diligence, succession, confidential approvals
- [ ] Traction proof still needs to be created by posting and collecting user feedback

## Deployed Proof

- Condition contract: `0xc53ddb226481aa8a582df27ca8e525f48ef20a90`
- Escrow gate: `0x052c6ae1bd931d2e3a119ba9b81ad2408f32ded0`
- Deployment record: `deployments/story-aeneid.json`
- Verified sample CDR vault UUID: `4457`
- Verified allocate tx: `0xc8f7fa593714e6537e1c612b3567166ba73e72d7adcae978ffd0d48c060587d1`

## Honest Scope

- The data key is protected by real CDR and released only after CDR read conditions pass.
- Demo ciphertext blobs are currently browser-local for hackathon simplicity.
- Production sharing should move encrypted blobs to IPFS, Storacha, or another durable content store.
- This does not weaken the CDR proof: the secret data key is still on-chain/Cdr-protected and threshold-recovered.

## Human-Only Remaining Tasks

1. Record the demo video using `DEMO_SCRIPT.md`.
2. Post the X/Twitter and LinkedIn copy in `TRACTION_KIT.md`.
3. Share in Story/CDR Discord and collect screenshots/reactions.
4. Ask a few people to create/test a vault and send feedback.
5. Add video and traction links to `HACKATHON_SUBMISSION.md`.
6. Submit the hackathon form.
