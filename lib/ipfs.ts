/**
 * Browser-side IPFS upload/download for DealVault, via Pinata.
 *
 * CDR keeps large files off-chain: we AES-encrypt the file (see cdr-service.ts),
 * upload the *ciphertext* to IPFS, and store only the resulting CID + the
 * threshold-encrypted AES key on-chain. Storing ciphertext on public IPFS is
 * safe — without the CDR-recovered key it's undecryptable.
 *
 * Uploads go straight from the browser to Pinata using a short-lived signed
 * upload URL minted by /api/storage/sign (the server holds the Pinata JWT; the
 * browser never sees it). This bypasses the serverless ~4.5MB request-body cap,
 * so there is effectively NO file-size limit. Downloads are a plain gateway
 * fetch — no credentials, works for any authorized reader.
 */

// Public Pinata gateway domain (non-secret). Baked from vercel.json at build
// time; falls back to the shared Pinata gateway, then a public IPFS gateway.
const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'gateway.pinata.cloud';
const FALLBACK_GATEWAYS = ['gateway.pinata.cloud', 'ipfs.io', 'dweb.link'];

const FILENAME = 'dealvault-encrypted.bin';

/** Upload encrypted bytes to IPFS via a server-signed Pinata URL. Returns the CID.
 *  Accepts an ArrayBuffer (or Uint8Array) and Blobs it directly — no extra copy,
 *  which keeps memory flat for large files. */
export async function uploadToIpfs(data: ArrayBuffer | Uint8Array): Promise<string> {
  // 1) Ask our server for a short-lived signed upload URL (keeps the JWT server-side).
  const signRes = await fetch('/api/storage/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: FILENAME }),
  });
  if (!signRes.ok) {
    if (signRes.status === 503) {
      throw new Error('Off-chain storage is not configured yet (PINATA_JWT missing on the server).');
    }
    throw new Error(`Could not authorize the upload (HTTP ${signRes.status}).`);
  }
  const { url } = await signRes.json();
  if (!url) throw new Error('Server did not return a signed upload URL.');

  // 2) Upload the ciphertext directly to Pinata (browser → Pinata, no size cap).
  const form = new FormData();
  form.append('file', new File([data as BlobPart], FILENAME, { type: 'application/octet-stream' }));
  form.append('network', 'public');

  const upRes = await fetch(url, { method: 'POST', body: form });
  if (!upRes.ok) {
    throw new Error(`IPFS upload failed (HTTP ${upRes.status}).`);
  }
  const json = await upRes.json().catch(() => null);
  const cid: string | undefined = json?.data?.cid ?? json?.cid ?? json?.IpfsHash;
  if (!cid) throw new Error('Upload succeeded but no CID was returned.');
  return cid;
}

/** Fetch encrypted bytes back from IPFS by CID. Tries the dedicated gateway, then public ones. */
export async function downloadFromIpfs(cid: string): Promise<Uint8Array> {
  const hosts = [GATEWAY, ...FALLBACK_GATEWAYS.filter((g) => g !== GATEWAY)];
  let lastErr: unknown;
  for (const host of hosts) {
    try {
      const res = await fetch(`https://${host}/ipfs/${cid}`);
      if (res.ok) return new Uint8Array(await res.arrayBuffer());
      lastErr = new Error(`HTTP ${res.status} from ${host}`);
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(`IPFS fetch failed for ${cid}: ${lastErr instanceof Error ? lastErr.message : 'unknown error'}`);
}
