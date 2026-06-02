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

See the on-chain proof → https://dealvault-sable.vercel.app/proof
Try it yourself → https://dealvault-sable.vercel.app

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

---

# Recruitment posts — get real people to try it TODAY

Goal: real humans create a vault (60s, free testnet). Every vault is a real
on-chain tx from their wallet — and it **auto-appears on our proof page**
(https://dealvault-sable.vercel.app/proof) with their wallet + tx. So testers
don't have to send anything; they just create a vault and the distinct-wallet
count on /proof goes up. (There's still a "Copy on-chain proof" button if anyone
wants to share theirs in Discord, but it's optional.)

## Short "try it" tweet (standalone CTA — quote-tweet your own thread)
Looking for 10 people to break my CDR Hackathon project 🔐

DealVault = confidential deal rooms on @StoryProtocol. Encrypt a file, lock it
behind an on-chain condition, share it trustlessly.

Takes 60s on testnet (free). Try it + reply with your vault 👇
https://dealvault-sable.vercel.app

## LinkedIn short ask
I just shipped DealVault for the Story CDR Hackathon — confidential, on-chain deal
rooms with no trusted middleman.

I need real feedback before judging. If you have 60 seconds: create a vault (free,
testnet) and tell me what felt off. Live here → https://dealvault-sable.vercel.app

Every vault is a real on-chain transaction — see the proof: https://dealvault-sable.vercel.app/proof

## Discord post (Story / CDR Hackathon server)
gm — built **DealVault**, confidential deal rooms on CDR (M&A / fundraising docs).
3 real vault types: Deal Room (expiry), Dead Drop (time-lock), Multi-Sig (N-of-M
on-chain approvals) + a pay-to-unlock escrow gate for composability.

Would love if a few of you kicked the tires 🙏 60s, free on Aeneid:
→ https://dealvault-sable.vercel.app
Every vault you make auto-shows on the on-chain proof page (your wallet + tx):
→ https://dealvault-sable.vercel.app/proof

## DM script (friends / network)
hey — quick favor? I'm in a hackathon that ends tomorrow and need a few real
testers. ~2 min, free:
1) Get free testnet gas: https://aeneid.faucet.story.foundation/
2) Create a vault: https://dealvault-sable.vercel.app  (MetaMask, approve 2 popups)
That's it 🙏 it auto-shows on our proof page — no need to send me anything. (If
you've got 10s, a one-line "what felt off" would be gold.)

## IMPORTANT — testers need free testnet gas first
Creating a vault is 2 on-chain transactions, so testers need a little **Story
Aeneid testnet IP** for gas (the CDR fees themselves are 0). It's free:
- Official faucet (no mainnet balance needed): https://aeneid.faucet.story.foundation/
- Google Cloud faucet (10 IP / 24h, Google login): https://cloud.google.com/application/web3/faucet/story/aeneid
- Avoid the QuickNode faucet for fresh wallets — it requires 0.001 ETH on Ethereum mainnet.
Always include the faucet link when you ask someone to test, or they'll get
stuck with "insufficient funds." The app also shows the faucet link on the home
screen and if a creation runs out of gas.

## What to collect from each tester (for the submission)
- Nothing required — each vault auto-appears on /proof (wallet + tx, verifiable).
  Just screenshot /proof showing the distinct-wallet count climbing.
- A one-line reaction ("oh this is clean" / "confusing at step X")
- Screenshot of their reply/like if on social
→ Paste new vaults into app/proof/proofData.ts so /proof shows them.
