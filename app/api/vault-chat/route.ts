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
  try {
    const body = await req.json();
    vault = body.vault ?? {};
    messages = Array.isArray(body.messages) ? body.messages : [];
    // Decrypted document text, extracted client-side AFTER the user unlocked the
    // vault (so they're already authorized). When present, the assistant may
    // reason over the real contents. Cap defensively.
    docText = typeof body.docText === 'string' ? body.docText.slice(0, 16_000) : '';
  } catch {
    return Response.json({ reply: 'Invalid request.' }, { status: 400 });
  }

  const fmt = (ts?: number) => (ts ? new Date(ts).toUTCString() : 'n/a');

  // Two modes. With docText, the user has ALREADY decrypted this vault in their
  // browser, so the assistant becomes a private analyst over the real contents.
  // Without it, it can only reason over metadata (contents stay confidential).
  const contentsClause = docText
    ? `The authorized user has DECRYPTED this document in their browser and shared its text with you for THIS question only (it was never uploaded or stored — confidential AI inference over CDR-protected data). You MAY read and analyze the document contents below and answer questions about them: summarize, extract figures/dates/parties/terms, compare clauses, answer specific questions. Ground every answer in the document — quote or cite the relevant part. If something isn't in the document, say so plainly rather than guessing. Do not fabricate.`
    : `You CANNOT see the document's decrypted contents (that's the whole point — it's confidential and only released by validators to authorized wallets). You can explain and summarize the vault's metadata, type, access rules, status, and how its CDR protection works. If asked about the file's actual contents, explain that they're confidential and that they become readable here only after the authorized wallet decrypts the file via "Access Vault" / "Pay & Unlock".`;

  const system = `You are the DealVault assistant, answering questions about ONE confidential on-chain vault. DealVault stores documents on Story's Confidential Data Rails (CDR): files are encrypted client-side, and a threshold-encrypted data key is written to an on-chain vault gated by condition contracts. ${contentsClause} Be concise, professional, and helpful.

VAULT CONTEXT:
- Name: ${vault.name ?? 'Untitled'}
- Type: ${vault.type} (deal-room = Secure Share, a one-way wallet-gated encrypted file share; dead-drop = sealed until a future date for one recipient; multi-sig = unlocks after N-of-M on-chain approvals)
- Status: ${vault.status}
- File: ${vault.fileName ?? 'n/a'}
- Created: ${fmt(vault.createdAt)}
- Expires: ${fmt(vault.expiresAt)}
- Unlock at: ${fmt(vault.unlockAt)}
- Recipient: ${vault.recipientWallet ?? 'n/a'}
- Authorized wallets: ${vault.authorizedWallets?.length ? vault.authorizedWallets.join(', ') : 'n/a'}
- CDR enforcement: ${vault.enforcementMode === 'custom-condition-contract' ? 'on-chain condition contract (DealVaultCondition)' : vault.enforcementMode}
- On-chain UUID: ${vault.uuid}
- Allocate tx: ${vault.txHash ?? 'n/a'}
- Expiry limitation: expiry blocks future CDR decryptions but cannot revoke a file already downloaded.${docText ? `

DECRYPTED DOCUMENT CONTENTS (authorized — answer questions using this):
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
