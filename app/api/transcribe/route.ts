/**
 * Speech reader for the confidential AI Q&A feature. Accepts an audio (or short
 * video) file that was decrypted IN THE BROWSER and returns a plain-text
 * transcript via Groq's Whisper Large v3 Turbo. The client downsamples audio to
 * 16 kHz mono first so the upload stays within the serverless request limit.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TRANSCRIBE_MODEL = 'whisper-large-v3-turbo';

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return Response.json({ text: '', unavailable: true });

  let file: Blob | null = null;
  try {
    const form = await req.formData();
    const f = form.get('file');
    if (f instanceof Blob) file = f;
  } catch {
    return Response.json({ text: '' });
  }
  if (!file) return Response.json({ text: '' });

  try {
    const out = new FormData();
    out.append('file', file, (file as File).name || 'audio.wav');
    out.append('model', TRANSCRIBE_MODEL);
    out.append('response_format', 'text');

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: out,
    });
    if (!res.ok) {
      const detail = await res.text();
      return Response.json({ text: '', error: detail.slice(0, 200) }, { status: 200 });
    }
    // response_format=text returns the transcript as a plain string body.
    const text = await res.text();
    return Response.json({ text });
  } catch (err) {
    return Response.json({ text: '', error: err instanceof Error ? err.message : String(err) }, { status: 200 });
  }
}
