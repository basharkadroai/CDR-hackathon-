/**
 * Deal Room PREVIEW generator. Runs on the SELLER's side at listing time (the
 * seller holds the plaintext) and produces a safe, honest teaser a buyer can use
 * to evaluate the dataset BEFORE paying — so a purchase is informed, never a
 * blind gamble. The valuable core stays gated; only a redacted taste is shown.
 *
 * This is the data-marketplace standard: free sample + metadata, value behind
 * the gate. The output is stored on the vault and shown to buyers + used by the
 * seller's Deal Agent.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM = `You write a marketplace PREVIEW for a confidential dataset a seller is listing. A buyer must be able to judge whether it's worth buying WITHOUT you giving away the valuable contents — show a taste, gate the rest.

Return STRICT JSON with these fields:
- "whatsInside": 2-3 honest sentences on what the dataset contains, who it's for, and the value a buyer gets. Concrete, not hype.
- "sample": a SHORT, safe excerpt that demonstrates format and quality — e.g. the opening lines, a couple of CSV column names with one example row, or a representative snippet. REDACT the genuinely valuable or sensitive specifics (full figures, names, keys, the core idea) with […]. This is a teaser, not the data.
- "attributes": an array of 3-6 short factual tags (e.g. "Markdown document", "~1,200 words", "Topic: product strategy", "12 columns"). Only facts you can see.

Rules: Be truthful — never invent facts, figures, or details not present. Never reveal the core value. Keep it tight. Output ONLY the JSON object.`;

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return Response.json({ preview: '' });

  let text = '';
  let name = '';
  let fileName = '';
  try {
    const body = await req.json();
    text = typeof body.text === 'string' ? body.text.slice(0, 12_000) : '';
    name = typeof body.name === 'string' ? body.name : '';
    fileName = typeof body.fileName === 'string' ? body.fileName : '';
  } catch {
    return Response.json({ preview: '' });
  }
  if (!text.trim()) return Response.json({ preview: '' });

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: `Dataset title: ${name || fileName || 'Untitled'}\nFile: ${fileName || 'n/a'}\n\nFULL CONTENT (for YOUR eyes only — never reproduce the valuable parts verbatim):\n"""\n${text}\n"""` },
        ],
      }),
    });
    if (!res.ok) return Response.json({ preview: '' }, { status: 200 });
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || '{}';
    let parsed: { whatsInside?: string; sample?: string; attributes?: string[] } = {};
    try { parsed = JSON.parse(raw); } catch { /* keep empty */ }

    // Render to a compact, human-readable preview string stored on the vault.
    const lines: string[] = [];
    if (parsed.whatsInside) lines.push(parsed.whatsInside.trim());
    if (Array.isArray(parsed.attributes) && parsed.attributes.length) {
      lines.push(`\nDetails: ${parsed.attributes.filter(Boolean).join(' · ')}`);
    }
    if (parsed.sample) lines.push(`\nSample:\n${parsed.sample.trim()}`);
    const preview = lines.join('\n').trim();
    return Response.json({ preview, structured: parsed });
  } catch {
    return Response.json({ preview: '' }, { status: 200 });
  }
}
