/**
 * In-app gas faucet. So testers never have to leave the app to grab testnet IP,
 * the app can drip a small amount from our funded wallet to a connected wallet
 * that has ~no balance. Heavily guarded:
 *   - one drip per wallet per 24h (Redis),
 *   - only funds wallets that are actually low (skips ones that already have gas),
 *   - refuses if the funder wallet is running low (points to the public faucet).
 *
 * Requires FUNDER_PRIVATE_KEY (testnet-only deployer key) in the environment.
 */
import { Redis } from '@upstash/redis';
import { createPublicClient, createWalletClient, http, parseEther, isAddress, getAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { storyTestnet } from '@/lib/wallet';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RPC = 'https://aeneid.storyrpc.io';
const DRIP = parseEther('0.5');        // amount sent per drip
const MIN_BALANCE = parseEther('0.1'); // wallets above this don't need funding
const RESERVE = parseEther('1');       // keep at least this in the funder wallet

function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export async function POST(req: Request) {
  let address = '';
  try { address = (await req.json())?.address ?? ''; } catch { /* ignore */ }
  if (!isAddress(address)) {
    return Response.json({ ok: false, reason: 'invalid', message: 'Connect a wallet first.' }, { status: 200 });
  }
  const addr = getAddress(address);

  const pk = process.env.FUNDER_PRIVATE_KEY;
  if (!pk) {
    return Response.json({ ok: false, reason: 'not-configured', message: 'In-app faucet is not configured.' }, { status: 200 });
  }

  const publicClient = createPublicClient({ chain: storyTestnet, transport: http(RPC) });

  // Already has enough gas → nothing to do.
  const balance = await publicClient.getBalance({ address: addr });
  if (balance >= MIN_BALANCE) {
    return Response.json({ ok: true, alreadyFunded: true, message: 'You already have enough gas — go ahead and create a vault.' });
  }

  // Rate limit: one drip per wallet per 24h.
  const redis = getRedis();
  const key = `fund:${addr.toLowerCase()}`;
  if (redis) {
    const seen = await redis.get(key);
    if (seen) {
      return Response.json({
        ok: false, reason: 'rate-limited',
        message: 'You were already funded recently. If you still need gas, use the public faucet: https://aeneid.faucet.story.foundation/',
      }, { status: 200 });
    }
  }

  const account = privateKeyToAccount((pk.startsWith('0x') ? pk : `0x${pk}`) as `0x${string}`);
  const funderBalance = await publicClient.getBalance({ address: account.address });
  if (funderBalance < RESERVE + DRIP) {
    return Response.json({
      ok: false, reason: 'faucet-empty',
      message: 'The in-app faucet is temporarily out. Grab free IP here: https://aeneid.faucet.story.foundation/',
    }, { status: 200 });
  }

  try {
    const walletClient = createWalletClient({ account, chain: storyTestnet, transport: http(RPC) });
    const hash = await walletClient.sendTransaction({ to: addr, value: DRIP });
    // Mark before waiting so a slow confirmation can't be double-spent.
    if (redis) await redis.set(key, hash, { ex: 86400 });
    await publicClient.waitForTransactionReceipt({ hash, timeout: 30_000 }).catch(() => {});
    return Response.json({ ok: true, txHash: hash, amount: '0.5', message: 'Funded — you’re ready to create a vault.' });
  } catch (e) {
    return Response.json({
      ok: false, reason: 'send-failed',
      message: 'Funding failed. You can use the public faucet: https://aeneid.faucet.story.foundation/',
      detail: e instanceof Error ? e.message.slice(0, 160) : String(e),
    }, { status: 200 });
  }
}
