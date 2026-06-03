/**
 * Pinata (IPFS) signed-upload-URL endpoint.
 *
 * This is the CDR-canonical "large file" path: the encrypted file lives off-chain
 * on IPFS, only the AES key + CID live on-chain. To let the *browser* upload
 * directly to Pinata (no Vercel ~4.5MB request-body limit, so files of any size
 * work), the server mints a short-lived signed upload URL. The Pinata JWT never
 * leaves this function.
 *
 * Required env (set in Vercel, never in git):
 *   PINATA_JWT - an Admin (or files:write) scoped Pinata API JWT.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SIGN_ENDPOINT = 'https://uploads.pinata.cloud/v3/files/sign';

export async function POST(req: Request) {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    return Response.json({ error: 'storage-not-configured' }, { status: 503 });
  }

  let filename = 'dealvault-encrypted.bin';
  try {
    const body = await req.json();
    if (typeof body?.filename === 'string' && body.filename) filename = body.filename;
  } catch {
    /* body is optional */
  }

  try {
    const res = await fetch(SIGN_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: Math.floor(Date.now() / 1000),
        expires: 60 * 60, // URL valid for 1 hour
        network: 'public',
        filename,
      }),
    });

    if (!res.ok) {
      const detail = (await res.text().catch(() => '')).slice(0, 300);
      return Response.json({ error: 'sign-failed', detail }, { status: 502 });
    }

    const json = await res.json();
    // Pinata returns the signed URL as `data` (a string).
    const url: string | undefined = json?.data ?? json?.url;
    if (!url) {
      return Response.json({ error: 'no-url' }, { status: 502 });
    }
    return Response.json({ url }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'sign-failed';
    return Response.json({ error: 'sign-failed', detail: message }, { status: 500 });
  }
}
