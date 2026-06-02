/**
 * DealVault AI assistant — turns a natural-language request into a structured
 * vault-creation action using Groq's NATIVE tool/function calling (reliable
 * parameter extraction vs. hoping the model emits valid JSON).
 *
 * The model is given one tool, `create_vault`. When it has enough info AND the
 * user has attached a document, it calls the tool; we surface that as `action`,
 * and the client shows a confirm card that runs the real on-chain CDR flow.
 * Otherwise the model just replies (asking for missing details).
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are the DealVault assistant. DealVault creates confidential, on-chain document vaults on Story Protocol's Confidential Data Rails (CDR). Your job is to help the user create a vault by gathering the needed details, then calling the create_vault tool.

Four vault types. ALWAYS refer to them by their friendly NAME below — never say the
internal id. These are FOUR DISTINCT things; "Secure Share" and "Deal Room" are NOT
the same (Secure Share is free one-way sharing; a Deal Room is a paid sale).

1. **Secure Share** (internal id "deal-room") — a free, one-way encrypted file share you give to specific wallets for a time window. Needs: name, authorizedWallets (0x addresses who may read), expiresDays (default 7). No payment.
2. **Dead Drop** (internal id "dead-drop") — a sealed file that opens for ONE recipient at/after a future date. Needs: name, recipientWallet (0x), unlockAt (ISO 8601 datetime in the future).
3. **Multi-Sig Vault** (internal id "multi-sig") — unlocks only after N-of-M signers approve on-chain. Needs: name, signers (0x addresses), threshold (number), optionally authorizedWallets (readers) + expiresDays.
4. **Deal Room** (internal id "marketplace") — a PAID sale: a buyer pays a price to unlock the document (they mint a Story license; the fee goes to the seller). This is the marketplace / two-party deal. Needs: name, priceIp (price in IP, a positive number). Optional: visibility ("public" = listed on the market for anyone, the default; or "private" = only invited wallets, then also provide authorizedWallets as the invited buyers). Use this whenever the user wants to SELL a document, set a price, or make a paid deal.

Rules:
- A document MUST be attached before creating. The client tells you with a note like "[user attached a file: name.pdf]". If no file is attached yet, do NOT call the tool — ask the user to attach the document.
- Be PROACTIVE and AUTOMATE. The moment you have a file plus the minimum to act, call create_vault — don't keep asking optional questions. Fill in sensible defaults yourself instead of asking:
  - name: infer from the request or the filename (e.g. "Series A data room", or the file's base name).
  - Secure Share: if no expiry is given, default expiresDays to 7. If the user names no readers, that's fine — the creator can always read its own vault; only add authorizedWallets the user explicitly provided.
  - Dead Drop: needs a recipient and an unlock date/time. If the user gave a relative time ("in 30 days", "next Friday"), compute the absolute ISO datetime yourself.
  - Multi-Sig Vault: needs signers and a threshold; if the user gave signers but no threshold, default threshold to a majority (e.g. 2-of-3).
  - Deal Room: needs a price (priceIp). If the user says "sell"/"for X IP", use that price and default visibility to public. Only ask for a price if they want a paid Deal Room but gave no number.
- The connected wallet (the creator) is provided to you below; it can ALWAYS read its own vault, so never ask the user for "your own address."
- Only ask a follow-up question when a TRULY required field is missing or genuinely ambiguous (e.g. a dead-drop with no recipient at all). Never re-ask for something you can reasonably default.
- Wallet addresses must look like 0x followed by exactly 40 hex chars. If an address the user gave is malformed or incomplete, DO NOT silently drop it and DO NOT proceed — reply asking the user to paste the full correct address, and do not call the tool until every address they intended is valid.
- Be concise and professional. After calling the tool, the UI shows a one-click confirmation summary — so a short confirming sentence is enough.`;

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'create_vault',
      description: 'Create a confidential on-chain CDR vault from the attached document. Only call when a file is attached and required fields are known.',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['deal-room', 'dead-drop', 'multi-sig', 'marketplace'], description: 'The vault type.' },
          name: { type: 'string', description: 'A short human-readable vault name.' },
          authorizedWallets: { type: 'array', items: { type: 'string' }, description: 'Wallet addresses allowed to read (deal-room / multi-sig), or the invited buyers for a private marketplace deal.' },
          recipientWallet: { type: 'string', description: 'The single recipient address (dead-drop only).' },
          expiresDays: { type: 'number', description: 'Days until access expires (deal-room / multi-sig).' },
          unlockAt: { type: 'string', description: 'ISO 8601 datetime when the dead-drop unlocks (must be in the future).' },
          signers: { type: 'array', items: { type: 'string' }, description: 'Approver wallet addresses (multi-sig only).' },
          threshold: { type: 'number', description: 'Number of approvals required before unlock (multi-sig only).' },
          priceIp: { type: 'number', description: 'Price in IP a buyer pays to unlock (marketplace only).' },
          visibility: { type: 'string', enum: ['public', 'private'], description: 'Marketplace listing: public (anyone) or private (invited wallets only).' },
        },
        required: ['type', 'name'],
      },
    },
  },
];

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        reply: 'The AI assistant is not configured yet (missing GROQ_API_KEY). You can still create vaults from the “New vault” menu in the sidebar.',
        action: null,
        unavailable: true,
      },
      { status: 200 },
    );
  }

  let messages: ChatMessage[] = [];
  let walletAddress = '';
  try {
    const body = await req.json();
    messages = Array.isArray(body.messages) ? body.messages : [];
    walletAddress = typeof body.walletAddress === 'string' ? body.walletAddress : '';
  } catch {
    return Response.json({ reply: 'Invalid request.', action: null }, { status: 400 });
  }

  const walletNote = walletAddress
    ? `\n\nThe connected wallet (creator, can always read its own vault) is ${walletAddress}. Today is ${new Date().toISOString()}.`
    : `\n\nNo wallet is connected yet. Today is ${new Date().toISOString()}.`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        tools: TOOLS,
        tool_choice: 'auto',
        messages: [{ role: 'system', content: SYSTEM_PROMPT + walletNote }, ...messages],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return Response.json(
        { reply: 'The assistant hit an error talking to the model. Try again, or use the sidebar.', action: null, detail: detail.slice(0, 300) },
        { status: 200 },
      );
    }

    const data = await res.json();
    const message = data.choices?.[0]?.message ?? {};
    const toolCall = message.tool_calls?.[0];

    // Only honor a create action if the user actually attached a document.
    const fileAttached = messages.some(
      (m) => m.role === 'user' && /\[user attached a file:/i.test(m.content),
    );

    if (toolCall?.function?.name === 'create_vault') {
      if (!fileAttached) {
        return Response.json({
          reply: 'Got it — attach the document you want to secure (📎), and I’ll create the vault.',
          action: null,
        });
      }
      let action: Record<string, unknown> | null = null;
      try {
        action = JSON.parse(toolCall.function.arguments || '{}');
      } catch {
        action = null;
      }

      // Deterministic safety net: the model sometimes passes malformed wallet
      // addresses (or silently drops them) and still says "ready to create".
      // Never surface an action with a bad address — ask the user to fix it.
      const isAddr = (a: unknown): a is string => typeof a === 'string' && /^0x[a-fA-F0-9]{40}$/.test(a.trim());
      const addrFields: [string, unknown][] = action
        ? [
            ...(Array.isArray(action.authorizedWallets) ? action.authorizedWallets.map((a) => ['authorized reader', a] as [string, unknown]) : []),
            ...(Array.isArray(action.signers) ? action.signers.map((a) => ['signer', a] as [string, unknown]) : []),
            ...(action.recipientWallet != null ? [['recipient', action.recipientWallet] as [string, unknown]] : []),
          ]
        : [];
      const bad = addrFields.filter(([, a]) => !isAddr(a));
      if (bad.length > 0) {
        const badList = bad.map(([role, a]) => `the ${role} "${String(a)}"`).join(' and ');
        return Response.json({
          reply: `Before I create this, ${badList} doesn't look like a valid wallet address (it should be 0x followed by 40 hex characters). Paste the full correct address and I'll set it up.`,
          action: null,
        });
      }

      const reply = (message.content && message.content.trim())
        ? message.content
        : `Ready to create your ${String(action?.type ?? 'vault').replace('-', ' ')} — review the details and confirm below.`;
      return Response.json({ reply, action });
    }

    // No tool call — just a conversational reply (e.g. asking for the file).
    return Response.json({ reply: message.content || 'Okay.', action: null });
  } catch (err) {
    return Response.json(
      { reply: 'The assistant is temporarily unavailable. Use the sidebar to create a vault.', action: null, detail: err instanceof Error ? err.message : String(err) },
      { status: 200 },
    );
  }
}
