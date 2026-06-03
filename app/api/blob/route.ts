/**
 * Cross-device ciphertext store. The encrypted file blob (already AES-encrypted
 * by CDR — storing it here is safe, the key stays threshold-managed) is mirrored
 * to Upstash Redis so an authorized wallet can open the vault from any device,
 * not just the browser that created it.
 *
 * A size guard keeps us within the free tier: blobs above the cap are not
 * stored remotely (the creating device keeps its localStorage copy).
 */
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Upstash free tier caps request size around 1MB; stay comfortably under it.
const MAX_BLOB_CHARS = 800_000;
const META_KEY = 'vaults:meta';

type Vault = {
  creatorWallet?: string;
};

const eq = (a?: string | null, b?: string | null) => !!a && !!b && a.toLowerCase() === b.toLowerCase();

function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export async function GET(req: Request) {
  const redis = getRedis();
  if (!redis) return Response.json({ blob: null });
  const uuid = new URL(req.url).searchParams.get('uuid');
  if (!uuid) return Response.json({ blob: null }, { status: 400 });
  try {
    const blob = await redis.get(`blob:${uuid}`);
    return Response.json({ blob: blob ?? null });
  } catch {
    return Response.json({ blob: null });
  }
}

export async function POST(req: Request) {
  const redis = getRedis();
  if (!redis) return Response.json({ ok: false, reason: 'not-configured' });
  let body: { uuid?: string; blob?: unknown } = {};
  try { body = await req.json(); } catch { return Response.json({ ok: false }, { status: 400 }); }
  const { uuid, blob } = body;
  if (!uuid || typeof uuid !== 'string' || blob == null) {
    return Response.json({ ok: false, reason: 'invalid' }, { status: 200 });
  }
  const serialized = JSON.stringify(blob);
  if (serialized.length > MAX_BLOB_CHARS) {
    return Response.json({ ok: false, reason: 'too-large' }, { status: 200 });
  }
  try {
    await redis.set(`blob:${uuid}`, blob);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, reason: 'write-failed' }, { status: 200 });
  }
}

export async function DELETE(req: Request) {
  const redis = getRedis();
  if (!redis) return Response.json({ ok: false, reason: 'not-configured' });
  const { searchParams } = new URL(req.url);
  const uuid = searchParams.get('uuid');
  const wallet = searchParams.get('wallet');
  if (!uuid) return Response.json({ ok: false, reason: 'no-uuid' }, { status: 400 });
  if (!wallet) return Response.json({ ok: false, reason: 'wallet-required' }, { status: 403 });
  try {
    const meta = await redis.hget<Vault>(META_KEY, uuid);
    if (meta?.creatorWallet && !eq(meta.creatorWallet, wallet)) {
      return Response.json({ ok: false, reason: 'forbidden' }, { status: 403 });
    }
    await redis.del(`blob:${uuid}`);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, reason: 'delete-failed' }, { status: 200 });
  }
}
