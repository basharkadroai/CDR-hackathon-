/**
 * CDR Story-API proxy.
 *
 * The Story-API DKG REST endpoint is served over plain HTTP
 * (http://172.192.41.96:1317). A browser running our HTTPS production site
 * cannot call it directly — the request is blocked as mixed active content,
 * which surfaced as `getGlobalPubKey()` crashing on `undefined.replace(...)`
 * inside the CDR SDK.
 *
 * This route runs server-side (no mixed-content restriction) and forwards
 * every `/api/cdr/<path>?<query>` request to the upstream Story-API,
 * preserving the path, query string, status code, and JSON body.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CDR_API_BASE =
  process.env.NEXT_PUBLIC_CDR_API_URL ?? 'http://172.192.41.96:1317';

async function proxy(req: Request, path: string[]): Promise<Response> {
  const search = new URL(req.url).search; // includes leading "?" or ""
  const upstream = `${CDR_API_BASE.replace(/\/+$/, '')}/${path.join('/')}${search}`;

  try {
    const init: RequestInit = {
      method: req.method,
      headers: { Accept: 'application/json' },
      // forward a body for non-GET/HEAD methods
      ...(req.method !== 'GET' && req.method !== 'HEAD'
        ? { body: await req.text() }
        : {}),
    };

    const res = await fetch(upstream, init);
    const body = await res.text();

    return new Response(body, {
      status: res.status,
      headers: {
        'Content-Type':
          res.headers.get('Content-Type') ?? 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: 'CDR proxy failed to reach Story-API',
        detail: err instanceof Error ? err.message : String(err),
        upstream,
      }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
