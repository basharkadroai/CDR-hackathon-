/**
 * Conversation compaction for the per-vault assistant. When a chat grows long,
 * the client folds the older turns into a concise running "memory" (merged with
 * any prior memory) so the assistant keeps full context without resending every
 * message. Mirrors how Claude compacts a conversation.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM = `You compress a conversation between a user and the DealVault assistant into a concise running MEMORY that preserves continuity. Capture: the user's identity/role if mentioned, what they are trying to do, key facts/figures/names/decisions discussed, any document/vault details established, and open threads. Merge the PRIOR MEMORY with the NEW MESSAGES into one tight set of notes (a short paragraph or compact bullets, third person, no preamble). Keep only what would matter for continuing the conversation. Do not invent anything.`;

interface Msg { role: string; content: string }

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return Response.json({ memory: '' });

  let messages: Msg[] = [];
  let priorMemory = '';
  try {
    const body = await req.json();
    messages = Array.isArray(body.messages) ? body.messages : [];
    priorMemory = typeof body.priorMemory === 'string' ? body.priorMemory : '';
  } catch {
    return Response.json({ memory: priorMemory });
  }

  const transcript = messages
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n')
    .slice(0, 12_000);

  const userContent = `PRIOR MEMORY:\n${priorMemory || '(none yet)'}\n\nNEW MESSAGES TO FOLD IN:\n${transcript}\n\nReturn the updated memory only.`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: userContent },
        ],
      }),
    });
    if (!res.ok) return Response.json({ memory: priorMemory }, { status: 200 });
    const data = await res.json();
    const memory = data.choices?.[0]?.message?.content?.trim() || priorMemory;
    return Response.json({ memory });
  } catch {
    return Response.json({ memory: priorMemory }, { status: 200 });
  }
}
