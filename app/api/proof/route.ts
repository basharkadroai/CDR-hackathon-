/**
 * Auto proof log. Every vault creation POSTs here (fire-and-forget) so the
 * public /proof page can show real, distinct on-chain usage without anyone
 * manually copying anything. Backed by Upstash Redis (Vercel integration).
 *
 * Degrades gracefully: if no KV credentials are present (e.g. local dev), the
 * route simply no-ops / returns an empty list rather than erroring.
 */
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KEY = 'proof:vaults';

function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const isAddr = (a: unknown): a is string => typeof a === 'string' && /^0x[a-fA-F0-9]{40}$/.test(a.trim());
const isTx = (a: unknown): a is string => typeof a === 'string' && /^0x[a-fA-F0-9]{64}$/.test(a.trim());
const VALID_TYPES = new Set(['deal-room', 'dead-drop', 'multi-sig']);

export interface LoggedVault {
  uuid: string;
  type: string;
  creator: string;
  allocateTx?: string;
  ts: number;
}

export async function GET() {
  const redis = getRedis();
  if (!redis) return Response.json({ vaults: [], distinctCreators: 0, configured: false });
  try {
    const all = await redis.hgetall<Record<string, LoggedVault>>(KEY);
    const vaults = Object.values(all ?? {}).sort((a, b) => b.ts - a.ts);
    const distinctCreators = new Set(vaults.map((v) => v.creator.toLowerCase())).size;
    return Response.json({ vaults, distinctCreators, configured: true });
  } catch {
    return Response.json({ vaults: [], distinctCreators: 0, configured: true });
  }
}

export async function POST(req: Request) {
  const redis = getRedis();
  if (!redis) return Response.json({ ok: false, reason: 'not-configured' }, { status: 200 });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return Response.json({ ok: false }, { status: 400 }); }

  const uuid = typeof body.uuid === 'string' ? body.uuid.slice(0, 64) : '';
  const type = typeof body.type === 'string' ? body.type : '';
  const creator = body.creator;
  const allocateTx = body.allocateTx;

  // Only log genuinely verifiable entries: a real vault id, a known type, and a
  // valid creator wallet. Anything malformed is silently ignored.
  if (!uuid || !VALID_TYPES.has(type) || !isAddr(creator)) {
    return Response.json({ ok: false, reason: 'invalid' }, { status: 200 });
  }

  const entry: LoggedVault = {
    uuid,
    type,
    creator,
    allocateTx: isTx(allocateTx) ? allocateTx : undefined,
    ts: Date.now(),
  };

  try {
    await redis.hset(KEY, { [uuid]: entry }); // keyed by uuid → idempotent, no dupes
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, reason: 'write-failed' }, { status: 200 });
  }
}
