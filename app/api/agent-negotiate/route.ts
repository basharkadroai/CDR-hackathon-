/**
 * Agent-to-agent negotiation engine for DealVault Autopilot.
 *
 * A Buyer Agent and a Seller Agent negotiate a price for a confidential dataset.
 * To stay dependable, the OUTCOME is computed in code with hard guardrails — the
 * seller can never settle below its floor, the buyer never above its budget —
 * and the LLM only writes the believable back-and-forth that converges to that
 * outcome. During the talk the seller answers buyer questions strictly from a
 * SAFE ABSTRACT, so the data is sold without ever being revealed.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const round2 = (n: number) => Math.round(n * 100) / 100;
const num = (v: unknown, fallback = 0) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : fallback;
};

interface Turn { agent: 'buyer' | 'seller'; message: string; offer?: number }

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* ignore */ }

  const title = String(body.title || 'this dataset');
  const abstract = String(body.abstract || '').slice(0, 2000);
  const ask = round2(num(body.ask, 1));
  const floor = round2(Math.min(num(body.floor, ask), ask));
  const budget = round2(num(body.budget, ask));
  const intent = String(body.intent || 'acquire access to this dataset').slice(0, 400);

  // --- Outcome decided in code (guardrails are non-negotiable) -----------------
  const dealPossible = budget >= floor;
  // Fair price sits in the overlap [floor, min(ask, budget)].
  const ceiling = Math.min(ask, budget);
  const settlePrice = dealPossible ? round2((floor + ceiling) / 2) : 0;

  const apiKey = process.env.GROQ_API_KEY;

  // Deterministic fallback transcript if the model is unavailable.
  const fallback: Turn[] = dealPossible
    ? [
        { agent: 'buyer', message: `I'm interested in "${title}". What can you tell me about it?` },
        { agent: 'seller', message: `${abstract || 'A confidential dataset.'} Asking ${ask} IP.`, offer: ask },
        { agent: 'buyer', message: `I can do ${round2(Math.max(floor, budget * 0.6))} IP.`, offer: round2(Math.max(floor, budget * 0.6)) },
        { agent: 'seller', message: `Let's meet at ${settlePrice} IP.`, offer: settlePrice },
        { agent: 'buyer', message: `Agreed — ${settlePrice} IP works. Let's settle.`, offer: settlePrice },
      ]
    : [
        { agent: 'buyer', message: `Interested in "${title}", but my budget is ${budget} IP.`, offer: budget },
        { agent: 'seller', message: `I can't go below ${floor} IP for this. No deal at that level.`, offer: floor },
      ];

  if (!apiKey) {
    return Response.json({ dealPossible, settlePrice, currency: 'IP', ask, floor, budget, turns: fallback });
  }

  const sys = `You script a SHORT, realistic negotiation between a Buyer Agent and a Seller Agent over a confidential dataset on a data marketplace. Rules:
- The Seller represents the dataset described in ABSTRACT, is asking ${ask} IP, and will NOT go below ${floor} IP.
- The Buyer wants to ${intent} and has a budget of ${budget} IP (never reveals the exact budget number; never offers above it).
- The Buyer asks 1-2 sharp questions about the data; the Seller answers ONLY using the ABSTRACT — never invent specifics, figures, or details not in it, and never reveal the raw contents.
- ${dealPossible ? `The negotiation MUST converge to a final agreed price of EXACTLY ${settlePrice} IP, with both sides confirming.` : `The numbers do NOT overlap (buyer budget below seller floor): the negotiation MUST end politely with NO agreement.`}
- 5 to 8 short, natural turns. Professional, a little bit of personality. No markdown.
ABSTRACT: """${abstract || 'A confidential dataset.'}"""
Return ONLY JSON: {"turns":[{"agent":"buyer"|"seller","message":"...","offer":<number, optional>}]}`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.6,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: sys }, { role: 'user', content: 'Generate the negotiation now.' }],
      }),
    });
    if (!res.ok) return Response.json({ dealPossible, settlePrice, currency: 'IP', ask, floor, budget, turns: fallback });
    const data = await res.json();
    let turns: Turn[] = fallback;
    try {
      const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
      if (Array.isArray(parsed.turns) && parsed.turns.length) {
        turns = parsed.turns
          .filter((t: Turn) => (t.agent === 'buyer' || t.agent === 'seller') && typeof t.message === 'string')
          .map((t: Turn) => ({ agent: t.agent, message: t.message, ...(typeof t.offer === 'number' ? { offer: round2(t.offer) } : {}) }));
      }
    } catch { /* keep fallback */ }
    // Enforce the agreed price on the final turn so the on-chain step matches.
    if (dealPossible && turns.length) turns[turns.length - 1] = { ...turns[turns.length - 1], offer: settlePrice };
    return Response.json({ dealPossible, settlePrice, currency: 'IP', ask, floor, budget, turns });
  } catch {
    return Response.json({ dealPossible, settlePrice, currency: 'IP', ask, floor, budget, turns: fallback });
  }
}
