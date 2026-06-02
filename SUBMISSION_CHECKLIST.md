# DealVault - Final Submission Checklist

This checklist separates what is already ready in the repo from the few items
that require Bashar/human action: recording, posting, collecting proof, and
submitting the form.

## Repo-Side Ready

- [x] Live app: https://dealvault-sable.vercel.app
- [x] GitHub repo: https://github.com/basharkadroai/CDR-hackathon-
- [x] Real CDR mode documented: `NEXT_PUBLIC_USE_MOCK_CDR=false`
- [x] Public on-chain proof page: `/proof`
- [x] Verified CDR round trip recorded in `HACKATHON_SUBMISSION.md`
- [x] Custom CDR condition contract deployed on Story Aeneid
- [x] Escrow composability gate deployed on Story Aeneid
- [x] Deal Room flow: wallet allowlist + expiry
- [x] Dead Drop flow: recipient + unlock timestamp
- [x] Multi-Sig flow: N-of-M approvals before CDR release
- [x] Dashboard shows vault metadata, CDR enforcement mode, tx links, and access/download actions
- [x] Submission narrative prepared in `HACKATHON_SUBMISSION.md`
- [x] Social templates prepared in `TRACTION_KIT.md`
- [x] Demo script prepared in `DEMO_SCRIPT.md`

## Human-Only Tasks

- [ ] Record 2-3 minute demo video and upload it unlisted
- [ ] Post the X/Twitter thread from `TRACTION_KIT.md`
- [ ] Post the LinkedIn copy from `TRACTION_KIT.md`
- [ ] Share in Story/CDR Discord and collect screenshot proof
- [ ] Ask 3-5 people to try the app and send feedback/screenshots
- [ ] Add demo video URL and traction links to `HACKATHON_SUBMISSION.md`
- [ ] Submit the official hackathon form before the deadline

## Submission Links To Use

- Live app: https://dealvault-sable.vercel.app
- On-chain proof: https://dealvault-sable.vercel.app/proof
- GitHub: https://github.com/basharkadroai/CDR-hackathon-
- Story Aeneid condition contract: https://aeneid.storyscan.io/address/0xc53ddb226481aa8a582df27ca8e525f48ef20a90
- Story Aeneid escrow gate: https://aeneid.storyscan.io/address/0x052c6ae1bd931d2e3a119ba9b81ad2408f32ded0

## Best Technical Implementation Proof

- `contracts/DealVaultCondition.sol` implements read/write hooks for CDR.
- It supports time windows, future unlocks, multi-sig approvals, and external gates.
- `contracts/EscrowAccessGate.sol` demonstrates a pay-to-unlock private data exchange.
- `lib/cdr-service.ts` wires those conditions into real CDR vault allocation and access.
- `deployments/story-aeneid.json` records deployed contract addresses and transaction hashes.

## Best CDR Application Proof

- Clear B2B use case: M&A, fundraising, diligence, succession, confidential approvals.
- End-to-end flows exist for creating, approving, viewing, and downloading vaults.
- The app is polished enough to demo live, with wallet switching, progress states, toasts, and explorer links.
- Remaining scoring gap is traction proof, which requires human posting and user outreach.
