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
  try {
    const body = await req.json();
    vault = body.vault ?? {};
    messages = Array.isArray(body.messages) ? body.messages : [];
  } catch {
    return Response.json({ reply: 'Invalid request.' }, { status: 400 });
  }

  const fmt = (ts?: number) => (ts ? new Date(ts).toUTCString() : 'n/a');
  const system = `You are the DealVault assistant, answering questions about ONE confidential on-chain vault. DealVault stores documents on Story's Confidential Data Rails (CDR): files are encrypted client-side, and a threshold-encrypted data key is written to an on-chain vault gated by condition contracts. You CANNOT see the document's decrypted contents (that's the whole point — it's confidential and only released by validators to authorized wallets). You can explain and summarize the vault's metadata, type, access rules, status, and how its CDR protection works. Be concise, professional, and helpful. If asked about the file's actual contents, explain that they're confidential and only the authorized wallet can decrypt them via "Access Vault".

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
- Expiry limitation: expiry blocks future CDR decryptions but cannot revoke a file already downloaded.`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.4,
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
