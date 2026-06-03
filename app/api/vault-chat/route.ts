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

  const system = `You are the DealVault assistant, answering questions about ONE confidential on-chain vault. DealVault stores documents on Story's Confidential Data Rails (CDR): files are encrypted client-side, and a threshold-encrypted data key is written to an on-chain vault gated by condition contracts. ${identityClause} ${contentsClause} Be concise, professional, and helpful.

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
- CDR enforcement: ${vault.enforcementMode === 'custom-condition-contract' ? 'on-chain condition contract (DealVaultCondition)' : vault.enforcementMode}
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
        temperature: docText ? 0.2 : 0.4, // grounded answers when reading a doc
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
