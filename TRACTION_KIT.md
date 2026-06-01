# DealVault Traction Kit — ready to post

Track 2 rewards **real traction across Twitter, LinkedIn, and the app**. Post these,
then drop the links in the submission form + Discord. Tag @StoryProtocol and use
#CDRHackathon so the team sees it.

---

## Twitter / X thread

**1/**
We built DealVault for the @StoryProtocol CDR Hackathon 🔐

Confidential deal rooms with ZERO trust. M&A docs, fundraising data, succession files —
encrypted, on-chain, and unlocked only when programmable conditions pass.

Live → https://dealvault-sable.vercel.app

**2/**
The problem: virtual data rooms (Datasite, iDeals) cost $99–$25k/mo, are fully
centralized, and you just *trust* them with your most sensitive documents.

DealVault replaces that trust with Confidential Data Rails — threshold encryption
enforced by Story's validator set. No middleman.

**3/**
How it works:
• File is AES-encrypted in your browser
• The key is threshold-encrypted to the validators + written to an on-chain CDR vault
• Access only releases when the on-chain condition passes
No single party ever holds the key. 🧵

**4/**
Three vault types, all real CDR conditions:
• Deal Room — wallet-gated, expires after a window
• Dead Drop — opens for one recipient after a future date
• Multi-Sig — unlocks only after N-of-M signers approve ON-CHAIN

It's programmable confidentiality.

**5/**
And it's composable. A vault's read condition can call ANOTHER contract — e.g. our
EscrowAccessGate: fund escrow → the document unlocks. Pay-to-unlock private data,
trustlessly. That's data as a programmable on-chain object.

**6/**
It's not a mockup — it's live on Story Aeneid testnet right now.
Real vault, real on-chain tx, real threshold decryption.

Try the diagnostics yourself → https://dealvault-sable.vercel.app/test-cdr

Built on @StoryProtocol #CDRHackathon

---

## LinkedIn post

🔐 Introducing DealVault — trustless confidential deal rooms on Story Protocol's
Confidential Data Rails (CDR).

Every M&A negotiation, fundraise, and succession plan depends on sharing sensitive
documents — today through virtual data rooms that cost up to $25,000/month and require
you to fully trust a centralized provider with your most confidential files.

DealVault removes that trust entirely. Files are encrypted in the browser; the
decryption key is threshold-encrypted across Story's validator network and stored in an
on-chain vault that only releases access when programmable conditions are met:

• Deal Room — wallet-gated access with an expiry window
• Dead Drop — a sealed file that opens for one recipient after a future date
• Multi-Sig — unlocks only after an N-of-M on-chain board approval

It's also composable: a vault can be gated by another smart contract — for example, a
pay-to-unlock escrow — making private data a programmable on-chain object.

Live on the Story Aeneid testnet: https://dealvault-sable.vercel.app

Built for the CDR Hackathon. #Web3 #Blockchain #StoryProtocol #ConfidentialComputing #CDRHackathon

---

## App-traction tips (the "real users" bullet)

- Share the live link in 2–3 relevant Discords/TG groups and ask people to create a
  vault + send you their wallet to be an authorized reader → real multi-user activity.
- Ask 3–5 people to actually run a Deal Room end to end and screenshot it.
- Each real on-chain vault is verifiable activity you can point judges to.
