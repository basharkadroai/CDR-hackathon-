/**
 * Vision reader for the confidential AI Q&A feature. Given a base64 image (an
 * actual image file, a scanned document, or a representative video frame that
 * was decrypted IN THE BROWSER), returns a thorough plain-text reading of it
 * using Groq's multimodal Llama 4 Scout. The client downscales images first so
 * the payload stays within the serverless request limit.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

const READ_PROMPT =
  'You are reading a confidential file so an authorized user can ask questions about it. ' +
  'Transcribe ALL legible text VERBATIM — including headings, body text, tables (preserve rows/columns), ' +
  'numbers, totals, dates, names, signatures, stamps, captions and footnotes. ' +
  'Then briefly describe any charts, diagrams, photos, logos or layout elements that carry meaning. ' +
  'Output plain text only — no preamble, no commentary about being an AI.';

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return Response.json({ text: '', unavailable: true });

  let dataUrl = '';
  try {
    const body = await req.json();
    dataUrl = typeof body.dataUrl === 'string' ? body.dataUrl : '';
  } catch {
    return Response.json({ text: '' });
  }
  if (!dataUrl.startsWith('data:')) return Response.json({ text: '' });

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: VISION_MODEL,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: READ_PROMPT },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      return Response.json({ text: '', error: detail.slice(0, 200) }, { status: 200 });
    }
    const data = await res.json();
    return Response.json({ text: data.choices?.[0]?.message?.content ?? '' });
  } catch (err) {
    return Response.json({ text: '', error: err instanceof Error ? err.message : String(err) }, { status: 200 });
  }
}
