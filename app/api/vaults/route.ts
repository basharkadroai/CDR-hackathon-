/**
 * Cross-device vault index. Vault metadata is mirrored to Upstash Redis so the
 * same wallet (and authorized readers) can list vaults from any device/browser —
 * the wallet is the auth, not the local machine.
 *
 * POST merges (so partial updates like an AI summary work); GET filters by
 * wallet, or returns a single vault by uuid. Degrades to empty if KV is absent
 * (the client still has its localStorage copy).
 */
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KEY = 'vaults:meta';

function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

type Vault = Record<string, unknown> & {
  uuid?: string;
  creatorWallet?: string;
  recipientWallet?: string;
  authorizedWallets?: string[];
  type?: string;
};

const eq = (a?: string, b?: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase();

function canSee(v: Vault, wallet: string): boolean {
  if (eq(v.creatorWallet, wallet)) return true;
  if (v.type === 'dead-drop') return eq(v.recipientWallet, wallet);
  return (v.authorizedWallets ?? []).some((w) => eq(w, wallet));
}

export async function GET(req: Request) {
  const redis = getRedis();
  if (!redis) return Response.json({ vaults: [] });
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get('wallet');
  const uuid = searchParams.get('uuid');
  const type = searchParams.get('type'); // e.g. 'marketplace' for the public market
  try {
    if (uuid) {
      const v = await redis.hget<Vault>(KEY, uuid);
      return Response.json({ vault: v ?? null });
    }
    const all = await redis.hgetall<Record<string, Vault>>(KEY);
    let vaults = Object.values(all ?? {});
    if (type) vaults = vaults.filter((v) => v.type === type); // public listing of a type
    else if (wallet) vaults = vaults.filter((v) => canSee(v, wallet));
    return Response.json({ vaults });
  } catch {
    return Response.json({ vaults: [] });
  }
}

export async function POST(req: Request) {
  const redis = getRedis();
  if (!redis) return Response.json({ ok: false, reason: 'not-configured' });
  let body: Vault = {};
  try { body = await req.json(); } catch { return Response.json({ ok: false }, { status: 400 }); }
  const uuid = typeof body.uuid === 'string' ? body.uuid : '';
  if (!uuid) return Response.json({ ok: false, reason: 'no-uuid' }, { status: 200 });
  try {
    const existing = (await redis.hget<Vault>(KEY, uuid)) ?? {};
    const merged = { ...existing, ...body };
    await redis.hset(KEY, { [uuid]: merged });
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
  try {
    // Only the creator may delete a vault. (Wallet is supplied by the client;
    // a signed-message check would harden this further, but this stops anyone
    // from deleting a vault they don't own via the UI or a stray request.)
    const existing = await redis.hget<Vault>(KEY, uuid);
    if (existing && existing.creatorWallet && !eq(existing.creatorWallet, wallet ?? '')) {
      return Response.json({ ok: false, reason: 'forbidden' }, { status: 403 });
    }
    await redis.hdel(KEY, uuid);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, reason: 'delete-failed' }, { status: 200 });
  }
}
