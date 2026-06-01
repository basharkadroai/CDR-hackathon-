/**
 * Returns the current deployment's identity. Vercel sets
 * VERCEL_GIT_COMMIT_SHA per deployment, so this value changes only when a new
 * deployment goes live — the client polls it to auto-refresh on deploy.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const version =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.VERCEL_DEPLOYMENT_ID ||
    'dev';
  return new Response(JSON.stringify({ version }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
