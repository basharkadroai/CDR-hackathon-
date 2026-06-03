/**
 * Per-vault AI chat. Given a vault's metadata (NOT its decrypted contents —
 * those stay confidential) and the user's question, answers using Groq.
 * Used in the vault detail view to summarize / explain a specific vault.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface VaultCtx {
  name?: string;
  type?: string;
  status?: string;
  fileName?: string;
  createdAt?: number;
  expiresAt?: number;
  unlockAt?: number;
  recipientWallet?: string;
  authorizedWallets?: string[];
  creatorWallet?: string;
  enforcementMode?: string;
  uuid?: string;
  txHash?: string;
  priceIp?: string;
  visibility?: string;
  aiSummary?: string;
}

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json({ reply: 'The AI assistant is not configured (missing GROQ_API_KEY).' }, { status: 200 });
  }

  let vault: VaultCtx = {};
  let messages: { role: string; content: string }[] = [];
  let docText = '';
  let walletAddress = '';
  let memory = '';
  try {
    const body = await req.json();
    vault = body.vault ?? {};
    messages = Array.isArray(body.messages) ? body.messages : [];
    // Decrypted document text, extracted client-side AFTER the user unlocked the
    // vault (so they're already authorized). When present, the assistant may
    // reason over the real contents. Cap defensively.
    docText = typeof body.docText === 'string' ? body.docText.slice(0, 16_000) : '';
    walletAddress = typeof body.walletAddress === 'string' ? body.walletAddress : '';
    memory = typeof body.memory === 'string' ? body.memory.slice(0, 4_000) : '';
  } catch {
    return Response.json({ reply: 'Invalid request.' }, { status: 400 });
  }

  const fmt = (ts?: number) => (ts ? new Date(ts).toUTCString() : 'n/a');

  // Who is the assistant talking to? (memory follows the wallet)
  const sameAddr = (a?: string, b?: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase();
  const isOwner = sameAddr(walletAddress, vault.creatorWallet);
  const isReader = !!walletAddress && (vault.authorizedWallets?.some((w) => sameAddr(w, walletAddress)) || sameAddr(walletAddress, vault.recipientWallet));
  const role = isOwner ? 'the CREATOR/OWNER of this vault' : isReader ? 'an AUTHORIZED reader of this vault' : walletAddress ? 'a visitor (not yet an authorized party)' : 'a visitor with no wallet connected';
  const identityClause = walletAddress
    ? `You are talking with wallet ${walletAddress}, who is ${role}. Address them accordingly and remember this across the conversation.`
    : `No wallet is connected.`;

  // Two modes. With docText the user has the readable contents available in their
  // browser (creator at upload, or anyone who decrypted), so the assistant is a
  // private analyst over the real contents. Without it, only metadata is known.
  const contentsClause = docText
    ? `The authorized user has the readable contents of this file available in their browser, provided below for THIS question only (never uploaded or stored — confidential AI inference over CDR-protected data). The contents may be document text, an image/scan reading, or an audio/video transcript. You MAY read and analyze them and answer questions: summarize, extract figures/dates/parties/terms, quote lines, compare clauses, answer specifics. Ground every answer in the provided contents — quote or cite the relevant part. If something isn't present, say so plainly rather than guessing. Do not fabricate.`
    : `You don't currently have the file's decrypted contents loaded. Do NOT flatly refuse if the user is authorized. ${isOwner || isReader ? `This user is authorized to read this vault, so if they ask what's inside, tell them to click "${vault.type === 'marketplace' ? 'Pay & Unlock' : 'Access Vault'}" at the top — you'll read the file in their browser and answer instantly (the creator can read their own vault any time).` : `If they ask what's inside, explain the contents are confidential and only an authorized wallet can decrypt them.`} You can always explain the vault's metadata, type, access rules, status, and how its CDR protection works.`;

  // SELLER AGENT MODE: a non-owner looking at a priced Deal Room is a potential
  // BUYER. Instead of the neutral assistant, the chat becomes the seller's agent
  // — it pitches the dataset, answers questions from the safe abstract only
  // (never the file), handles objections, and drives the buyer to purchase.
  const isBuyerProspect = vault.type === 'marketplace' && !!vault.priceIp && !isOwner && !isReader;

  const system = isBuyerProspect
    ? `You are "Deal Agent" — a human-like sales rep who works on behalf of the SELLER of one confidential dataset on DealVault's Deal Room marketplace. You are NOT a help desk or a generic AI assistant. You are a sharp, warm, persuasive dealmaker with ONE goal: get this buyer to unlock the dataset. Talk like a real person closing a deal over chat.

HOW TO BEHAVE (this is what makes you an agent, not a chatbot):
- Take initiative. Don't wait to be asked — drive the conversation. Open by introducing yourself in ONE line ("Hey, I'm the seller's Deal Agent for X"), then immediately either hook them with the value or ask a sharp qualifying question ("What are you hoping to use this for?").
- Be brief and human: 1–3 short sentences per message, like texting. No bullet-point spec sheets, no walls of text.
- Sell. Lead with the value and the outcome the buyer gets. Build a little curiosity. Handle objections directly ("Totally fair — here's why it's worth 0.1 IP…"). Nudge toward the close without being pushy.
- Ask questions back. A real rep qualifies the buyer and keeps the conversation going.

NEVER do these (they make you sound like a bot):
- NEVER dump vault metadata, UUIDs, "CDR enforcement", created dates, or technical plumbing unless the buyer explicitly asks about security. They don't care; they want the data.
- NEVER use filler like "I'd be happy to help", "If you have any questions, feel free", "Is there anything else".
- NEVER list "key details" with asterisks/bullets.

HARD RULES:
- Describe the dataset ONLY from the SELLER'S ABSTRACT below. NEVER reveal, quote, or invent the actual file contents — that's exactly what they're paying for. If they push for specifics not in the abstract, tease that it's inside and unlocks on purchase.
- Be honest. Never fabricate facts, figures, or guarantees.
- Price is ${vault.priceIp} IP, fixed. When they're interested, tell them to hit the "Pay ${vault.priceIp} IP to unlock" button at the top — it mints them a Story license on-chain and instantly decrypts the file; the payment goes straight to the seller.

You're chatting with ${walletAddress ? `a prospective buyer (wallet ${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)})` : 'a prospective buyer who has not connected a wallet yet (they\'ll need to connect to pay)'}.

THE LISTING YOU'RE SELLING:
- Title: ${vault.name ?? 'Untitled dataset'}
- Price to unlock: ${vault.priceIp} IP
- SELLER'S ABSTRACT (the ONLY thing you may say about what's inside):
"""
${vault.aiSummary || `A confidential dataset titled "${vault.name ?? 'Untitled'}". The seller hasn't shared extra detail beyond the title — lean on curiosity and the fact that it unlocks instantly on purchase.`}
"""`
    : `You are the DealVault assistant, answering questions about ONE confidential on-chain vault. DealVault stores documents on Story's Confidential Data Rails (CDR): files are encrypted client-side, and a threshold-encrypted data key is written to an on-chain vault gated by condition contracts. ${identityClause} ${contentsClause} Be concise, professional, and helpful.

VAULT CONTEXT:
- Name: ${vault.name ?? 'Untitled'}
- Type: ${vault.type} (deal-room = Secure Share, a one-way wallet-gated encrypted file share; dead-drop = sealed until a future date for one recipient; multi-sig = unlocks after N-of-M on-chain approvals)
- Status: ${vault.status}
- File: ${vault.fileName ?? 'n/a'}
- Created: ${fmt(vault.createdAt)}
- Expires: ${fmt(vault.expiresAt)}
- Unlock at: ${fmt(vault.unlockAt)}
- Recipient: ${vault.recipientWallet ?? 'n/a'}
- Creator/owner: ${vault.creatorWallet ?? 'n/a'}
- Authorized wallets: ${vault.authorizedWallets?.length ? vault.authorizedWallets.join(', ') : 'n/a'}
- CDR enforcement: ${vault.type === 'marketplace' ? "Story's on-chain LicenseReadCondition (pay-to-unlock — only a paid license-holder can decrypt)" : 'owner-only on-chain CDR read; the access rules (allowlist / time-lock / N-of-M) are enforced in the app layer'}
- On-chain UUID: ${vault.uuid}
- Allocate tx: ${vault.txHash ?? 'n/a'}
- Expiry limitation: expiry blocks future CDR decryptions but cannot revoke a file already downloaded.${memory ? `

EARLIER CONVERSATION (compacted memory — treat as continuous context, do not mention it unless asked):
${memory}` : ''}${docText ? `

DECRYPTED FILE CONTENTS (authorized — text / image reading / transcript; answer using this):
"""
${docText}
"""` : ''}`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        // Sales agent gets warmth/personality; grounded/low when reading a doc.
        temperature: isBuyerProspect ? 0.7 : docText ? 0.2 : 0.4,
        messages: [{ role: 'system', content: system }, ...messages],
      }),
    });
    if (!res.ok) {
      return Response.json({ reply: 'The assistant hit an error. Please try again.' }, { status: 200 });
    }
    const data = await res.json();
    return Response.json({ reply: data.choices?.[0]?.message?.content ?? 'Okay.' });
  } catch (err) {
    return Response.json({ reply: 'The assistant is temporarily unavailable.', detail: err instanceof Error ? err.message : String(err) }, { status: 200 });
  }
}
