# DealVault — Demo Video Script (~2:30)

**Setup:** two browser profiles open — **Wallet A** (seller) and **Wallet B** (buyer), both
funded on Aeneid. Hard-refresh before recording so you're on the latest build. Keep clips short;
if a tx is slow, cut to the success state.

---

### [0:00–0:15] · Hook
*Screen: DealVault home (the AI greeting).*
> "Everyone has confidential files they can't safely share or sell — contracts, datasets,
> research. Upload them to the cloud and you lose control. DealVault turns any private file into
> a programmable, on-chain asset you can share, time-lock, or sell — without ever exposing it.
> Built on Story's Confidential Data Rails."

### [0:15–0:45] · Create a vault by talking
*Type:* "Secure this NDA, let only this wallet open it, expires in 7 days." *(attach a file)*
> "Just describe it. The AI builds the vault — encrypts the file in your browser,
> threshold-encrypts the key to Story's validator network, and writes it on-chain. No forms."
*Show the live chain: Encrypting → Allocating on-chain → Threshold-encrypting key → Sealed.
Click "Open vault".*
> "A real CDR vault — and a real on-chain transaction."

### [0:45–1:05] · The AI builds the product itself
*Type:* "Code me a calculator app and list it for sale for 0.1 IP."
> "Ask it to *create* the thing — it writes a working app and lists it as a paid Deal Room. The
> file the AI authored becomes the encrypted asset. No empty listings."

### [1:05–1:55] · The Deal Room + Seller Agent (the star)
*Switch to Wallet B. Open the Deal Room from the public market.*
> "Now a real buyer — a different wallet — finds it in the marketplace. They don't gamble blind:
> they see a genuine preview and sample, generated from the file with the valuable parts redacted."
*Show the PREVIEW card with the sample.*
> "And the seller's AI agent is right here, working the deal — pitching from the real sample,
> answering questions without ever leaking the file."
*Show the Deal Agent greeting + a buyer question + its answer. Click "Pay 0.1 IP to unlock" →
MetaMask → confirm.*
> "The buyer pays — that mints a Story license on-chain, the fee goes straight to the seller, and
> the vault decrypts. Access *is* the license, enforced on-chain by Story's LicenseReadCondition."
*(file downloads)*

### [1:55–2:15] · Confidential AI Q&A
*In the unlocked vault, ask:* "What's the core idea in this doc?"
> "Once you have access, the AI reads the decrypted file — in your browser — and answers about
> the real contents. Confidential inference: the file never touches our servers. It works on
> documents, images, audio, even video."

### [2:15–2:30] · Proof + close
*Open the /proof page — real contracts + tx hashes on the explorer.*
> "Every vault is a real, verifiable on-chain transaction. DealVault — your confidential files,
> finally programmable. Share them, sell them, query them — and let an agent close the deal while
> you sleep."
*End card: DealVault · dealvault-sable.vercel.app*

---

**One-liner (for the submission form / tweet):**
> DealVault: talk to an AI to turn any private file into a programmable on-chain asset on Story
> CDR — share it, time-lock it, or sell it, with an AI agent that closes the deal and confidential
> AI that answers questions about the data without ever exposing it.
