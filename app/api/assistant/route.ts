/**
 * DealVault AI assistant — turns a natural-language request into a structured
 * vault action. Uses Groq's OpenAI-compatible chat API (fast, free tier).
 *
 * Set GROQ_API_KEY in the environment. The model is instructed to reply with
 * STRICT JSON: { reply, action }. The client renders `reply` and, if `action`
 * is present, shows a confirm card that runs the real CDR flow with the user's
 * wallet + attached file.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are the DealVault assistant. DealVault creates confidential, on-chain document vaults on Story Protocol's Confidential Data Rails (CDR). You help users create vaults by talking to them.

There are three vault types:
- "deal-room": time-limited document sharing. Fields: name, authorizedWallets (array of 0x addresses who can read), expiresDays (number, default 7).
- "dead-drop": a sealed file that opens for ONE recipient after a future date. Fields: name, recipientWallet (0x), unlockAt (ISO 8601 datetime in the future).
- "multi-sig": unlocks only after N-of-M signers approve on-chain. Fields: name, authorizedWallets (readers), signers (array of 0x), threshold (number), expiresDays.

Every vault needs the user to attach a document in the chat. If they haven't attached one yet, ask them to.

You MUST reply with a single JSON object, no markdown, with this shape:
{
  "reply": "<friendly short message to the user>",
  "action": null | {
    "type": "deal-room" | "dead-drop" | "multi-sig",
    "name": "<vault name>",
    "authorizedWallets": ["0x..."],
    "recipientWallet": "0x...",
    "expiresDays": 7,
    "unlockAt": "2026-06-10T00:00:00Z",
    "signers": ["0x..."],
    "threshold": 2,
    "requirePayment": false
  }
}

Only include action fields relevant to the chosen type. Set "action" to null until you have enough info AND the user has attached a file (the client tells you with a system note like "[user attached a file: name.pdf]"). When you have a file + the required fields, fill "action" and set reply to a confirmation like "Ready to create your deal room — review and confirm below." Validate that wallet addresses look like 0x followed by 40 hex chars; if one is malformed, ask again. Keep replies concise and professional.`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        reply:
          'The AI assistant is not configured yet (missing GROQ_API_KEY). You can still create vaults from the “New vault” menu in the sidebar.',
        action: null,
        unavailable: true,
      },
      { status: 200 },
    );
  }

  let messages: ChatMessage[] = [];
  try {
    const body = await req.json();
    messages = Array.isArray(body.messages) ? body.messages : [];
  } catch {
    return Response.json({ reply: 'Invalid request.', action: null }, { status: 400 });
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
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
    const raw = data.choices?.[0]?.message?.content ?? '{}';
    let parsed: { reply?: string; action?: unknown };
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { reply: raw, action: null };
    }

    return Response.json({
      reply: parsed.reply ?? 'Okay.',
      action: parsed.action ?? null,
    });
  } catch (err) {
    return Response.json(
      { reply: 'The assistant is temporarily unavailable. Use the sidebar to create a vault.', action: null, detail: err instanceof Error ? err.message : String(err) },
      { status: 200 },
    );
  }
}
