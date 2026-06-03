// CDR Service - Real Confidential Data Rails integration with Story Protocol.
//
// Canonical CDR pattern used here:
//   1. Generate a random 32-byte AES-256 data key in the browser.
//   2. Encrypt the selected file client-side with AES-GCM.
//   3. Threshold-encrypt the data key to Story's DKG public key and write it to
//      an on-chain CDR vault with explicit read/write condition settings.
//   4. Upload the AES ciphertext to IPFS (Pinata) and keep only its CID on the
//      vault — CDR's hybrid model: large file off-chain, key on-chain. No size
//      limit (the browser uploads direct to Pinata via a server-signed URL).
//   5. Recover the data key with `accessCDR`, fetch the ciphertext from IPFS by
//      CID, then decrypt client-side.
import { CDRClient, initWasm, uuidToLabel } from '@piplabs/cdr-sdk';
import { StoryClient, PILFlavor, WIP_TOKEN_ADDRESS } from '@story-protocol/core-sdk';
import {
  createPublicClient,
  createWalletClient,
  custom,
  encodeAbiParameters,
  getAddress,
  http,
  isAddress,
  parseEther,
  toHex,
} from 'viem';
import { storyTestnet } from './wallet';
import { withTxGuard } from './txGuard';

// Minimal ERC-20 reads for the WIP token (idempotent pay-to-unlock prep).
const ERC20_READ_ABI = [
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'a', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'allowance', stateMutability: 'view', inputs: [{ name: 'o', type: 'address' }, { name: 's', type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const;

// Story Aeneid deployed addresses for the pay-to-unlock Deal Room flow (from the
// CDR SDK docs — these are the condition contracts the precompile DOES execute).
const OWNER_WRITE_CONDITION = '0x4C9bFC96d7092b590D497A191826C3dA2277c34B' as const;
const LICENSE_READ_CONDITION = '0xC0640AD4CF2CaA9914C8e5C44234359a9102f7a3' as const;
const LICENSE_TOKEN_ADDRESS = '0xFe3838BFb30B34170F00030B52eA4893d8aAC6bC' as const;
const PUBLIC_SPG_NFT = '0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc' as const;
const WIP_APPROVE_SPENDER = '0xD2f60c40fEbccf6311f8B47c4f2Ec6b040400086' as const; // pulls the WIP fee on mint

export type VaultType = 'deal-room' | 'dead-drop' | 'multi-sig' | 'marketplace';
export type VaultStatus = 'active' | 'expired' | 'sealed';
export type EnforcementMode = 'custom-condition-contract' | 'owner-only-fallback';

export interface VaultMetadata {
  uuid: string;
  name: string;
  type: VaultType;
  createdAt: number;
  status: VaultStatus;
  creatorWallet?: string;
  expiresAt?: number;
  unlockAt?: number;
  authorizedWallets?: string[];
  recipientWallet?: string;
  signers?: string[];
  threshold?: number;
  gate?: string;
  fileName?: string;
  fileType?: string;
  /** IPFS CID of the encrypted file (Pinata). The off-chain half of CDR's
   *  hybrid model — only this pointer + the threshold-encrypted key are on-chain. */
  cid?: string;
  /** Base64 AES-GCM IV for the IPFS-stored raw ciphertext (12 bytes). */
  iv?: string;
  txHash?: string;
  allocateTxHash?: string;
  writeTxHash?: string;
  readConditionAddress?: `0x${string}`;
  writeConditionAddress?: `0x${string}`;
  conditionData?: `0x${string}`;
  enforcementMode?: EnforcementMode;
  aiSummary?: string;
  // Deal Room (marketplace / pay-to-unlock) fields:
  priceIp?: string;          // price in IP to unlock (license mint fee)
  ipId?: `0x${string}`;      // Story IP Asset id
  licenseTermsId?: string;   // PIL license terms id
  visibility?: 'public' | 'private'; // public = listed on /market; private = invite-only
  preview?: string;          // safe sales preview (what's inside + sample), generated from the real file at listing
}

export const DEALVAULT_VAULTS_CHANGED_EVENT = 'dealvault:vaults-changed';

export interface UploadVaultParams {
  file: File;
  name: string;
  type: VaultType;
  authorizedWallets?: string[];
  expiresAt?: number;
  unlockAt?: number;
  recipientWallet?: string;
  /** Multi-sig: addresses eligible to approve a read. */
  signers?: string[];
  /** Multi-sig: number of approvals required before reads unlock. */
  threshold?: number;
  /** Composability: external IAccessGate contract that must also return true. */
  gate?: string;
  /** Deal Room (marketplace): price in IP a buyer pays to unlock. */
  priceIp?: string;
}

/** Live progress steps emitted during uploadVault (for the chat "thinking chain"). */
export type VaultStep = 'encrypt' | 'allocate' | 'protect' | 'write' | 'store' | 'done';
export interface VaultProgress {
  step: VaultStep;
  status: 'start' | 'done';
  detail?: string;
}

interface StoredBlob {
  iv: string;
  data: string;
}

interface DealVaultConditionConfig {
  writeConditionAddr: `0x${string}`;
  readConditionAddr: `0x${string}`;
  writeConditionData: `0x${string}`;
  readConditionData: `0x${string}`;
  enforcementMode: EnforcementMode;
  skipConditionValidation: boolean;
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

// Deployed DealVaultCondition on Story Aeneid. Hardcoded as the default so the
// custom-condition path works even when NEXT_PUBLIC_* env vars aren't inlined
// into the client bundle at build time (Vercel project env applies at runtime,
// not build, so process.env reads `undefined` on the client). Env still wins
// if explicitly set. These are public contract addresses — safe to commit.
const DEFAULT_CONDITION_ADDRESS = '0xc53ddb226481aa8a582df27ca8e525f48ef20a90';
const DEFAULT_ESCROW_GATE_ADDRESS = '0x052c6ae1bd931d2e3a119ba9b81ad2408f32ded0';

// Minimal ABI for DealVaultCondition multi-sig approval flow.
const DEAL_VAULT_CONDITION_ABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'conditionData', type: 'bytes' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'approvalsFor',
    stateMutability: 'view',
    inputs: [{ name: 'conditionData', type: 'bytes' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function normalizeOptionalAddress(value?: string): `0x${string}` | undefined {
  if (!value || !isAddress(value)) return undefined;
  return getAddress(value) as `0x${string}`;
}

function normalizeAddressList(values?: string[]): `0x${string}`[] {
  return Array.from(
    new Set(
      (values ?? [])
        .map((value) => normalizeOptionalAddress(value.trim()))
        .filter((value): value is `0x${string}` => Boolean(value)),
    ),
  );
}

function sameAddress(a?: string | null, b?: string | null): boolean {
  return Boolean(a && b && isAddress(a) && isAddress(b) && getAddress(a) === getAddress(b));
}

function computeStatus(metadata: Pick<VaultMetadata, 'type' | 'expiresAt' | 'unlockAt' | 'status'>): VaultStatus {
  const now = Date.now();
  if (metadata.expiresAt && metadata.expiresAt <= now) return 'expired';
  if (metadata.type === 'dead-drop' && metadata.unlockAt && metadata.unlockAt > now) return 'sealed';
  return 'active';
}

class CDRService {
  private wasmInitialized = false;
  private cdrClient: CDRClient | null = null;
  private ownerAddress: `0x${string}` | null = null;

  private async initializeCDR() {
    if (!this.wasmInitialized) {
      await initWasm();
      this.wasmInitialized = true;
    }
  }

  private async ensureCorrectNetwork(): Promise<void> {
    const eth = window.ethereum;
    if (!eth) throw new Error('No wallet detected. Please install MetaMask.');

    const targetHex = '0x523';
    const current = (await eth.request({ method: 'eth_chainId' })) as string;
    if (current?.toLowerCase() === targetHex) return;

    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetHex }],
      });
    } catch (error) {
      const walletError = error as { code?: number; data?: { originalError?: { code?: number } } };
      if (walletError.code === 4902 || walletError.data?.originalError?.code === 4902) {
        await eth.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: targetHex,
              chainName: 'Story Aeneid Testnet',
              nativeCurrency: { name: 'IP', symbol: 'IP', decimals: 18 },
              rpcUrls: ['https://aeneid.storyrpc.io'],
              blockExplorerUrls: ['https://aeneid.storyscan.io'],
            },
          ],
        });
      } else if (walletError.code === 4001) {
        throw new Error('Please switch MetaMask to Story Aeneid Testnet to continue.');
      } else {
        throw error;
      }
    }
  }

  private async getConnectedAccount(requestAccounts: boolean): Promise<`0x${string}`> {
    if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
      throw new Error('No wallet detected. Please install MetaMask.');
    }

    const accounts = (await window.ethereum.request({
      method: requestAccounts ? 'eth_requestAccounts' : 'eth_accounts',
    })) as string[];

    if (!accounts || accounts.length === 0 || !isAddress(accounts[0])) {
      throw new Error('No wallet connected. Please unlock MetaMask.');
    }

    return getAddress(accounts[0]) as `0x${string}`;
  }

  private async getCDRClient(): Promise<CDRClient> {
    if (this.cdrClient) return this.cdrClient;

    await this.initializeCDR();
    await this.ensureCorrectNetwork();

    const account = await this.getConnectedAccount(true);
    this.ownerAddress = account;

    const publicClient = createPublicClient({
      chain: storyTestnet,
      transport: http('https://aeneid.storyrpc.io'),
    });

    const walletClient = createWalletClient({
      account,
      chain: storyTestnet,
      transport: custom(window.ethereum!),
    });

    this.cdrClient = new CDRClient({
      network: 'testnet',
      publicClient,
      walletClient,
      apiUrl: `${window.location.origin}/api/cdr`,
    });

    return this.cdrClient;
  }

  /** Story Protocol client (IP assets + licensing) using the connected wallet. */
  private async getStoryClient(): Promise<StoryClient> {
    await this.ensureCorrectNetwork();
    const account = await this.getConnectedAccount(true);
    return StoryClient.newClient({
      account,
      transport: custom(window.ethereum!),
      chainId: 'aeneid',
    });
  }

  /**
   * SELLER — create a priced Deal Room. The document is registered as a Story IP
   * Asset with a commercial license whose mint fee IS the price. The CDR vault is
   * gated by OwnerWriteCondition (only the seller writes) + LicenseReadCondition
   * (only holders of a license token for this IP can read). Buyers unlock by
   * paying the mint fee.
   */
  async uploadDealRoom(
    params: { file: File; name: string; priceIp: string; visibility?: 'public' | 'private'; invitedWallets?: string[] },
    onProgress?: (p: VaultProgress) => void,
  ): Promise<VaultMetadata> {
    const emit = (step: VaultStep, status: 'start' | 'done', detail?: string) =>
      onProgress?.({ step, status, detail });

    return withTxGuard(async () => {
    const client = await this.getCDRClient();
    const story = await this.getStoryClient();
    const owner = this.ownerAddress!;

    emit('encrypt', 'start');
    const globalPubKey = await client.observer.getGlobalPubKey();
    const dataKey = crypto.getRandomValues(new Uint8Array(32));
    const fileBuffer = await params.file.arrayBuffer();
    const { iv, cipher } = await this.aesEncryptRaw(dataKey, fileBuffer);
    emit('encrypt', 'done', `AES-256-GCM · ${(fileBuffer.byteLength / 1024).toFixed(1)} KB`);

    // Register IP + priced commercial license (mint fee = price)
    emit('allocate', 'start', `Registering IP asset + ${params.priceIp} IP license`);
    const ipRes = await story.ipAsset.mintAndRegisterIpAssetWithPilTerms({
      spgNftContract: PUBLIC_SPG_NFT,
      licenseTermsData: [
        {
          terms: PILFlavor.commercialRemix({
            defaultMintingFee: parseEther(params.priceIp),
            currency: WIP_TOKEN_ADDRESS,
            commercialRevShare: 0,
          }),
        },
      ],
    });
    const ipId = ipRes.ipId as `0x${string}`;
    const licenseTermsId = (ipRes.licenseTermsIds?.[0] ?? BigInt(0)).toString();

    // Allocate the CDR vault: OwnerWrite (write) + LicenseRead (read)
    const writeConditionData = encodeAbiParameters([{ type: 'address' }], [owner]);
    const readConditionData = encodeAbiParameters(
      [{ type: 'address' }, { type: 'address' }],
      [LICENSE_TOKEN_ADDRESS, ipId],
    );
    const { uuid, txHash: allocateTx } = await client.uploader.allocate({
      updatable: false,
      writeConditionAddr: OWNER_WRITE_CONDITION,
      readConditionAddr: LICENSE_READ_CONDITION,
      writeConditionData,
      readConditionData,
      skipConditionValidation: false,
    });
    emit('allocate', 'done', `Vault #${uuid} · IP ${ipId.slice(0, 10)}…`);

    emit('protect', 'start');
    const ciphertext = await client.uploader.encryptDataKey({ dataKey, globalPubKey, label: uuidToLabel(uuid) });
    emit('protect', 'done', 'Key split across validator network');

    emit('write', 'start');
    const { txHash: writeTx } = await client.uploader.write({ uuid, accessAuxData: '0x', encryptedData: toHex(ciphertext.raw) });
    emit('write', 'done', `tx ${writeTx.slice(0, 10)}…`);

    const uuidStr = String(uuid);
    const metadata = this.enrichMetadata({
      uuid: uuidStr,
      name: params.name,
      type: 'marketplace',
      createdAt: Date.now(),
      status: 'active',
      creatorWallet: owner,
      fileName: params.file.name,
      fileType: params.file.type,
      allocateTxHash: allocateTx,
      writeTxHash: writeTx,
      readConditionAddress: LICENSE_READ_CONDITION,
      writeConditionAddress: OWNER_WRITE_CONDITION,
      enforcementMode: 'custom-condition-contract',
      priceIp: params.priceIp,
      ipId,
      licenseTermsId,
      visibility: params.visibility ?? 'public',
      // Invited buyers (private deals): listed in their own vault sidebar.
      authorizedWallets: params.visibility === 'private' ? normalizeAddressList(params.invitedWallets) : undefined,
    });
    metadata.iv = bytesToBase64(iv);
    metadata.cid = await this.storeCiphertext(uuidStr, cipher);
    this.saveVaultMetadata(metadata);
    this.logProof(metadata);
    emit('done', 'done');
    return metadata;
    });
  }

  /**
   * BUYER — pay to unlock a Deal Room: wrap IP→WIP, approve, mint a license token
   * (the fee goes to the seller), then accessCDR with the license to decrypt.
   */
  async unlockDealRoom(uuid: string, onProgress?: (p: VaultProgress) => void): Promise<Blob> {
    const emit = (step: VaultStep, status: 'start' | 'done', detail?: string) =>
      onProgress?.({ step, status, detail });

    const metadata = await this.getVaultMetadata(uuid);
    if (!metadata) throw new Error('Vault not found.');
    if (metadata.type !== 'marketplace' || !metadata.ipId || !metadata.licenseTermsId || !metadata.priceIp) {
      throw new Error('This is not a Deal Room vault.');
    }

    return withTxGuard(async () => {
      const client = await this.getCDRClient();
      const story = await this.getStoryClient();
      const account = this.ownerAddress!;
      const price = parseEther(metadata.priceIp!);
      const publicClient = createPublicClient({ chain: storyTestnet, transport: http('https://aeneid.storyrpc.io') });
      const ipId = metadata.ipId!;

      // --- Idempotent payment: only do steps that aren't already done on-chain,
      // so an accidental reload + retry never double-charges. ---
      emit('allocate', 'start', `Paying ${metadata.priceIp} IP`);

      // 1) Wrap IP→WIP only for the shortfall (skip if the buyer already holds WIP).
      const wipBal = (await publicClient.readContract({
        address: WIP_TOKEN_ADDRESS, abi: ERC20_READ_ABI, functionName: 'balanceOf', args: [account],
      })) as bigint;
      if (wipBal < price) await story.wipClient.deposit({ amount: price - wipBal });

      // 2) Approve only if the existing allowance isn't enough.
      const allowance = (await publicClient.readContract({
        address: WIP_TOKEN_ADDRESS, abi: ERC20_READ_ABI, functionName: 'allowance', args: [account, WIP_APPROVE_SPENDER],
      })) as bigint;
      if (allowance < price) await story.wipClient.approve({ spender: WIP_APPROVE_SPENDER, amount: price });

      // 3) License: reuse a license already minted for this vault+wallet instead
      // of paying to mint another one.
      const lkey = `dealvault-license-${uuid}-${account.toLowerCase()}`;
      const saved = typeof window !== 'undefined' ? localStorage.getItem(lkey) : null;
      let licenseTokenId: bigint;
      if (saved) {
        licenseTokenId = BigInt(saved);
      } else {
        const mintRes = await story.license.mintLicenseTokens({
          licensorIpId: ipId,
          licenseTermsId: BigInt(metadata.licenseTermsId!),
          amount: 1,
          maxMintingFee: price,
          maxRevenueShare: 100,
        });
        const id = mintRes.licenseTokenIds?.[0];
        if (id === undefined) throw new Error('License mint did not return a token id.');
        licenseTokenId = id;
        if (typeof window !== 'undefined') localStorage.setItem(lkey, id.toString());
      }
      emit('allocate', 'done', `License #${licenseTokenId.toString()} ready`);

      emit('protect', 'start', 'Collecting validator decryptions');
      const accessAuxData = encodeAbiParameters([{ type: 'uint256[]' }], [[licenseTokenId]]);
      // A read can fail if not enough validators respond in time, or briefly
      // after minting before the license is recognized by the read condition.
      // Per the CDR docs we retry the read — automatically, so the buyer clicks
      // once instead of re-trying themselves.
      const { dataKey } = await this.accessCDRWithRetry(client, Number(uuid), accessAuxData, (a, m) => {
        if (a > 1) emit('protect', 'start', `Collecting validator decryptions… (attempt ${a}/${m})`);
      });
      emit('protect', 'done');

      const plaintext = await this.recoverPlaintext(uuid, metadata, dataKey as Uint8Array);
      emit('done', 'done');
      return new Blob([plaintext as unknown as BlobPart], { type: metadata.fileType || 'application/octet-stream' });
    });
  }

  /**
   * accessCDR with automatic retries. Per the CDR docs a read can fail if not
   * enough validators respond before the timeout (or, just after minting a
   * license, before the read condition recognizes it). The docs say to retry —
   * so we do it for the user (short backoff) instead of making them re-click.
   */
  private async accessCDRWithRetry(
    client: CDRClient,
    uuid: number,
    accessAuxData: `0x${string}`,
    onAttempt?: (attempt: number, max: number) => void,
  ): Promise<{ dataKey: unknown }> {
    const MAX = 6;
    let lastErr: unknown;
    for (let attempt = 1; attempt <= MAX; attempt++) {
      try {
        onAttempt?.(attempt, MAX);
        return await client.consumer.accessCDR({ uuid, accessAuxData });
      } catch (err) {
        lastErr = err;
        if (attempt < MAX) await new Promise((resolve) => setTimeout(resolve, 2500));
      }
    }
    throw lastErr instanceof Error
      ? lastErr
      : new Error('Could not collect enough validator decryptions. Please try again in a moment.');
  }

  private getConditionConfig(_params: UploadVaultParams, creator: `0x${string}`): DealVaultConditionConfig {
    // Story's documented EOA condition setup (CDR SDK overview): the creator's
    // own wallet is BOTH the read and write condition, with EMPTY condition data
    // and skipConditionValidation. This is the path that actually works on
    // Aeneid — the write tx succeeds and stores the threshold-encrypted key, and
    // the owner can read + decrypt from any device:
    //
    //   writeConditionAddr: userAddress,  readConditionAddr: userAddress,
    //   writeConditionData: "0x",         readConditionData: "0x",
    //   skipConditionValidation: true
    //
    // Custom CONTRACT conditions do NOT work here: the precompile's write()/read()
    // tx reverts (empty 0x) on a contract condition, so the key is never stored
    // and accessCDR can't collect partials ("partial decryption submission not
    // found" → timeout). Story's own deployed condition contracts
    // (OwnerWriteCondition 0x4C9bFC96…, LicenseReadCondition 0xC0640AD4…) are the
    // only contract conditions the precompile executes; our DealVaultCondition is
    // deployed as a demonstration of the advanced read/write logic.
    return {
      writeConditionAddr: creator,
      readConditionAddr: creator,
      writeConditionData: '0x',
      readConditionData: '0x',
      enforcementMode: 'owner-only-fallback',
      skipConditionValidation: true,
    };
  }

  /**
   * AES-256-GCM encrypt → returns the raw IV + ciphertext bytes (NO base64).
   * Keeping the ciphertext as raw bytes (not a base64 string inside JSON) is
   * what makes big files work: base64 + JSON.stringify would create several
   * multi-hundred-MB string copies and OOM the browser tab.
   */
  private async aesEncryptRaw(dataKey: Uint8Array, plaintext: ArrayBuffer): Promise<{ iv: Uint8Array; cipher: ArrayBuffer }> {
    const key = await crypto.subtle.importKey('raw', dataKey as unknown as BufferSource, 'AES-GCM', false, ['encrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as unknown as BufferSource }, key, plaintext);
    return { iv, cipher };
  }

  /** Decrypt raw ciphertext bytes with a 12-byte IV. */
  private async aesDecryptRaw(dataKey: Uint8Array, iv: Uint8Array, cipher: ArrayBuffer | Uint8Array): Promise<Uint8Array> {
    const key = await crypto.subtle.importKey('raw', dataKey as unknown as BufferSource, 'AES-GCM', false, ['decrypt']);
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      cipher as unknown as BufferSource,
    );
    return new Uint8Array(plain);
  }

  /** Legacy decrypt for vaults stored as base64 {iv,data} (pre-IPFS migration). */
  private async aesDecrypt(dataKey: Uint8Array, blob: StoredBlob): Promise<Uint8Array> {
    return this.aesDecryptRaw(dataKey, base64ToBytes(blob.iv), base64ToBytes(blob.data));
  }

  // Only files at/under this size are cached in localStorage (base64 doubles in
  // memory and the quota is ~5MB) — IPFS is the authoritative copy regardless.
  private static readonly LOCAL_CACHE_LIMIT = 2 * 1024 * 1024;

  /**
   * Upload raw AES ciphertext to IPFS (Pinata) — the off-chain half of CDR's
   * hybrid model. Returns the CID, stored on the vault alongside the IV. Storing
   * ciphertext on public IPFS is safe: useless without the CDR-recovered key.
   * NO file-size limit (browser → Pinata via a server-signed URL). Memory-lean:
   * the raw bytes are uploaded directly, never base64-encoded or JSON-wrapped.
   */
  private async storeCiphertext(uuid: string, cipher: ArrayBuffer): Promise<string> {
    if (cipher.byteLength <= CDRService.LOCAL_CACHE_LIMIT) {
      try { localStorage.setItem(`dealvault-cipher-${uuid}`, bytesToBase64(new Uint8Array(cipher))); } catch { /* over quota — IPFS is authoritative */ }
    }
    const { uploadToIpfs } = await import('./ipfs');
    return uploadToIpfs(cipher);
  }

  /** Recover raw ciphertext bytes: local cache first, then IPFS by CID. */
  private async loadCiphertext(uuid: string, cid?: string): Promise<Uint8Array | null> {
    const cached = localStorage.getItem(`dealvault-cipher-${uuid}`);
    if (cached) return base64ToBytes(cached);
    if (cid) {
      const { downloadFromIpfs } = await import('./ipfs');
      const bytes = await downloadFromIpfs(cid);
      if (bytes.byteLength <= CDRService.LOCAL_CACHE_LIMIT) {
        try { localStorage.setItem(`dealvault-cipher-${uuid}`, bytesToBase64(bytes)); } catch { /* cache best-effort */ }
      }
      return bytes;
    }
    return null;
  }

  /**
   * Legacy loader for vaults created before the raw-bytes IPFS migration: the
   * ciphertext was a base64 {iv,data} JSON blob in localStorage / free-tier KV
   * (and, briefly, JSON-on-IPFS). Returns null for new raw-ciphertext vaults.
   */
  private async loadBlob(uuid: string, cid?: string): Promise<StoredBlob | null> {
    const raw = localStorage.getItem(`dealvault-blob-${uuid}`);
    if (raw) return JSON.parse(raw) as StoredBlob;

    if (cid) {
      try {
        const { downloadFromIpfs } = await import('./ipfs');
        const bytes = await downloadFromIpfs(cid);
        return JSON.parse(new TextDecoder().decode(bytes)) as StoredBlob;
      } catch { /* not a JSON blob (new raw vault) or unavailable — fall through */ }
    }

    try {
      const res = await fetch(`/api/blob?uuid=${encodeURIComponent(uuid)}`);
      const data = await res.json();
      if (data?.blob) return data.blob as StoredBlob;
    } catch { /* fall through */ }
    return null;
  }

  private assertLocalAccess(metadata: VaultMetadata, account: string) {
    const status = computeStatus(metadata);
    if (status === 'expired') throw new Error('This vault has expired and is no longer accessible.');
    if (status === 'sealed') throw new Error('This vault is sealed and cannot be opened yet.');

    if (sameAddress(metadata.creatorWallet, account)) return;

    if (metadata.type === 'deal-room') {
      const authorized = metadata.authorizedWallets?.some((wallet) => sameAddress(wallet, account));
      if (!authorized) throw new Error('Access denied. You are not authorized to view this vault.');
    }

    if (metadata.type === 'dead-drop' && !sameAddress(metadata.recipientWallet, account)) {
      throw new Error('Access denied. Only the configured recipient can open this dead drop.');
    }
  }

  private enrichMetadata(metadata: VaultMetadata): VaultMetadata {
    return { ...metadata, status: computeStatus(metadata) };
  }

  private filterVaultsForWallet(vaults: VaultMetadata[], walletAddress: string): VaultMetadata[] {
    return vaults
      .map((vault) => this.enrichMetadata(vault))
      .filter((vault) => {
        if (sameAddress(vault.creatorWallet, walletAddress)) return true;
        if (vault.type === 'dead-drop') return sameAddress(vault.recipientWallet, walletAddress);
        return vault.authorizedWallets?.some((wallet) => sameAddress(wallet, walletAddress));
      })
      .sort((a, b) => b.createdAt - a.createdAt); // newest first
  }

  private notifyVaultsChanged() {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new Event(DEALVAULT_VAULTS_CHANGED_EVENT));
  }

  async uploadVault(
    params: UploadVaultParams,
    onProgress?: (p: VaultProgress) => void,
  ): Promise<VaultMetadata> {
    const emit = (step: VaultStep, status: 'start' | 'done', detail?: string) =>
      onProgress?.({ step, status, detail });

    return withTxGuard(async () => {
    const client = await this.getCDRClient();
    const owner = this.ownerAddress!;
    const conditionConfig = this.getConditionConfig(params, owner);

    // 1) Encrypt the file client-side
    emit('encrypt', 'start');
    const globalPubKey = await client.observer.getGlobalPubKey();
    const dataKey = crypto.getRandomValues(new Uint8Array(32));
    const fileBuffer = await params.file.arrayBuffer();
    const { iv, cipher } = await this.aesEncryptRaw(dataKey, fileBuffer);
    emit('encrypt', 'done', `AES-256-GCM · ${(fileBuffer.byteLength / 1024).toFixed(1)} KB`);

    // 2) Allocate the on-chain vault (signature)
    emit('allocate', 'start');
    const { uuid, txHash: allocateTx } = await client.uploader.allocate({
      updatable: false,
      writeConditionAddr: conditionConfig.writeConditionAddr,
      readConditionAddr: conditionConfig.readConditionAddr,
      writeConditionData: conditionConfig.writeConditionData,
      readConditionData: conditionConfig.readConditionData,
      skipConditionValidation: conditionConfig.skipConditionValidation,
    });
    emit('allocate', 'done', `Vault #${uuid} · tx ${allocateTx.slice(0, 10)}…`);

    // 3) Threshold-encrypt the data key to the validator DKG
    emit('protect', 'start');
    const ciphertext = await client.uploader.encryptDataKey({
      dataKey,
      globalPubKey,
      label: uuidToLabel(uuid),
    });
    emit('protect', 'done', 'Key split across validator network');

    // 4) Write the protected key on-chain (signature)
    emit('write', 'start');
    const { txHash: writeTx } = await client.uploader.write({
      uuid,
      accessAuxData: '0x',
      encryptedData: toHex(ciphertext.raw),
    });
    emit('write', 'done', `tx ${writeTx.slice(0, 10)}…`);

    const uuidStr = String(uuid);
    emit('store', 'start');
    const cid = await this.storeCiphertext(uuidStr, cipher);
    emit('store', 'done', `Encrypted file on IPFS · ${cid.slice(0, 12)}…`);
    emit('done', 'done');

    const metadata = this.enrichMetadata({
      cid,
      iv: bytesToBase64(iv),
      uuid: uuidStr,
      name: params.name,
      type: params.type,
      createdAt: Date.now(),
      status: 'active',
      creatorWallet: owner,
      expiresAt: params.expiresAt,
      unlockAt: params.unlockAt,
      authorizedWallets: normalizeAddressList(params.authorizedWallets),
      recipientWallet: normalizeOptionalAddress(params.recipientWallet),
      signers: normalizeAddressList(params.signers),
      threshold: params.threshold,
      gate: normalizeOptionalAddress(params.gate),
      fileName: params.file.name,
      fileType: params.file.type,
      txHash: allocateTx,
      allocateTxHash: allocateTx,
      writeTxHash: writeTx,
      readConditionAddress: conditionConfig.readConditionAddr,
      writeConditionAddress: conditionConfig.writeConditionAddr,
      conditionData: conditionConfig.readConditionData,
      enforcementMode: conditionConfig.enforcementMode,
    });

    this.saveVaultMetadata(metadata);
    this.logProof(metadata); // auto-populate the public /proof page (fire-and-forget)
    return metadata;
    });
  }

  /**
   * Report a newly-created vault to the server-side proof log so /proof can show
   * real, distinct on-chain usage automatically. Fire-and-forget; never throws.
   */
  private logProof(meta: VaultMetadata) {
    if (typeof window === 'undefined' || !meta.creatorWallet) return;
    try {
      void fetch('/api/proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uuid: meta.uuid,
          type: meta.type,
          creator: meta.creatorWallet,
          allocateTx: meta.allocateTxHash,
        }),
      }).catch(() => { /* proof logging is best-effort */ });
    } catch { /* ignore */ }
  }

  async accessVault(uuid: string): Promise<Blob> {
    return withTxGuard(async () => {
    const metadata = await this.getVaultMetadata(uuid);
    if (!metadata) throw new Error('Vault not found.');

    const account = await this.getConnectedAccount(true);
    this.assertLocalAccess(metadata, account);

    const client = await this.getCDRClient();
    const { dataKey } = await this.accessCDRWithRetry(client, Number(uuid), '0x');

    const plaintext = await this.recoverPlaintext(uuid, metadata, dataKey as Uint8Array);
    return new Blob([plaintext as unknown as BlobPart], {
      type: metadata.fileType || 'application/octet-stream',
    });
    });
  }

  /**
   * Recover the decrypted file bytes. New vaults store raw ciphertext on IPFS
   * (CID + IV on the vault); legacy vaults store a base64 {iv,data} blob. Handles
   * both so old and new vaults open. Throws a clear error if the ciphertext is
   * genuinely unavailable.
   */
  private async recoverPlaintext(uuid: string, metadata: VaultMetadata, dataKey: Uint8Array): Promise<Uint8Array> {
    if (metadata.iv) {
      const cipher = await this.loadCiphertext(uuid, metadata.cid);
      if (!cipher) {
        throw new Error('Encrypted file unavailable. CDR access succeeded, but the ciphertext could not be fetched from IPFS.');
      }
      return this.aesDecryptRaw(dataKey, base64ToBytes(metadata.iv), cipher);
    }
    // Legacy vault (base64 {iv,data} blob).
    const blob = await this.loadBlob(uuid, metadata.cid);
    if (!blob) {
      throw new Error('Encrypted file unavailable. CDR access succeeded, but the ciphertext for this vault could not be found.');
    }
    return this.aesDecrypt(dataKey, blob);
  }

  /**
   * Multi-sig: record an on-chain approval for a vault's read condition by
   * calling DealVaultCondition.approve(conditionData). Only an eligible signer
   * (encoded in the rule) can approve; the validator set won't release the data
   * key until `threshold` approvals exist.
   */
  async approveMultiSigVault(uuid: string): Promise<{ txHash: `0x${string}`; approvals: number }> {
    const metadata = await this.getVaultMetadata(uuid);
    if (!metadata) throw new Error('Vault not found.');
    if (!metadata.conditionData || !metadata.readConditionAddress) {
      throw new Error('This vault has no on-chain condition contract to approve against.');
    }
    return withTxGuard(async () => {
    await this.ensureCorrectNetwork();
    const account = await this.getConnectedAccount(true);

    const publicClient = createPublicClient({
      chain: storyTestnet,
      transport: http('https://aeneid.storyrpc.io'),
    });
    const walletClient = createWalletClient({
      account,
      chain: storyTestnet,
      transport: custom(window.ethereum!),
    });

    const txHash = await walletClient.writeContract({
      address: metadata.readConditionAddress!,
      abi: DEAL_VAULT_CONDITION_ABI,
      functionName: 'approve',
      args: [metadata.conditionData!],
    });
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    const approvals = (await publicClient.readContract({
      address: metadata.readConditionAddress!,
      abi: DEAL_VAULT_CONDITION_ABI,
      functionName: 'approvalsFor',
      args: [metadata.conditionData!],
    })) as bigint;

    return { txHash, approvals: Number(approvals) };
    });
  }

  /** Read current on-chain approval count for a multi-sig vault. */
  async getApprovalCount(uuid: string): Promise<number> {
    const metadata = await this.getVaultMetadata(uuid);
    if (!metadata?.conditionData || !metadata.readConditionAddress) return 0;
    const publicClient = createPublicClient({
      chain: storyTestnet,
      transport: http('https://aeneid.storyrpc.io'),
    });
    const approvals = (await publicClient.readContract({
      address: metadata.readConditionAddress,
      abi: DEAL_VAULT_CONDITION_ABI,
      functionName: 'approvalsFor',
      args: [metadata.conditionData],
    })) as bigint;
    return Number(approvals);
  }

  async getVaultMetadata(uuid: string): Promise<VaultMetadata | null> {
    const local = this.getStoredVaults().find((item) => item.uuid === uuid);
    if (local) return this.enrichMetadata(local);
    // Not on this device — fetch from the server index (cross-device access).
    try {
      const res = await fetch(`/api/vaults?uuid=${encodeURIComponent(uuid)}`);
      const data = await res.json();
      if (data?.vault) {
        this.cacheVaultLocally(data.vault as VaultMetadata);
        return this.enrichMetadata(data.vault as VaultMetadata);
      }
    } catch { /* fall through */ }
    return null;
  }

  async listUserVaults(walletAddress: string): Promise<VaultMetadata[]> {
    // Merge this device's local index with the server index so the same wallet
    // sees its vaults on any device (and authorized readers see shared ones).
    const byUuid = new Map<string, VaultMetadata>();
    for (const v of this.getStoredVaults()) byUuid.set(v.uuid, v);
    try {
      const res = await fetch(`/api/vaults?wallet=${encodeURIComponent(walletAddress)}`);
      const data = await res.json();
      if (Array.isArray(data?.vaults)) {
        for (const v of data.vaults as VaultMetadata[]) {
          if (v?.uuid && !byUuid.has(v.uuid)) { byUuid.set(v.uuid, v); this.cacheVaultLocally(v); }
        }
      }
    } catch { /* offline / not configured → local only */ }

    return this.filterVaultsForWallet([...byUuid.values()], walletAddress);
  }

  getCachedUserVaults(walletAddress: string): VaultMetadata[] {
    return this.filterVaultsForWallet(this.getStoredVaults(), walletAddress);
  }

  async deleteVault(uuid: string, wallet?: string): Promise<void> {
    if (typeof window === 'undefined') return;
    if (!wallet) throw new Error('Connect the creator wallet to delete this vault.');

    const storedVaults = this.getStoredVaults();
    const localVault = storedVaults.find((vault) => vault.uuid === uuid);
    if (localVault?.creatorWallet && !sameAddress(localVault.creatorWallet, wallet)) {
      throw new Error('Only the creator wallet can delete this vault.');
    }

    const walletQs = `&wallet=${encodeURIComponent(wallet)}`;
    const blobRes = await fetch(`/api/blob?uuid=${encodeURIComponent(uuid)}${walletQs}`, { method: 'DELETE' }).catch(() => null);
    if (blobRes?.status === 403) throw new Error('Only the creator wallet can delete this vault.');

    const vaultRes = await fetch(`/api/vaults?uuid=${encodeURIComponent(uuid)}${walletQs}`, { method: 'DELETE' }).catch(() => null);
    if (vaultRes?.status === 403) throw new Error('Only the creator wallet can delete this vault.');
    if (vaultRes && !vaultRes.ok) throw new Error('Could not delete this vault. Please try again.');
    if (vaultRes) {
      const data = await vaultRes.json().catch(() => null);
      if (data?.ok === false && data?.reason === 'forbidden') {
        throw new Error('Only the creator wallet can delete this vault.');
      }
    }

    const next = storedVaults.filter((vault) => vault.uuid !== uuid);
    if (next.length !== storedVaults.length) localStorage.setItem('dealvault-metadata', JSON.stringify(next));
    localStorage.removeItem(`dealvault-blob-${uuid}`);
    this.notifyVaultsChanged();
  }

  /** Add a server-fetched vault to the local index (cache) if not already there. */
  private cacheVaultLocally(vault: VaultMetadata) {
    if (typeof window === 'undefined') return;
    const vaults = this.getStoredVaults();
    if (vaults.some((v) => v.uuid === vault.uuid)) return;
    vaults.push(vault);
    localStorage.setItem('dealvault-metadata', JSON.stringify(vaults));
  }

  private saveVaultMetadata(metadata: VaultMetadata) {
    const vaults = this.getStoredVaults();
    vaults.push(metadata);
    localStorage.setItem('dealvault-metadata', JSON.stringify(vaults));
    this.notifyVaultsChanged();
    this.syncVaultToServer(metadata); // mirror to the cross-device index
  }

  /** Mirror vault metadata to the server index (cross-device). Fire-and-forget. */
  private syncVaultToServer(metadata: Partial<VaultMetadata> & { uuid: string }) {
    if (typeof window === 'undefined') return;
    void fetch('/api/vaults', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata),
    }).catch(() => { /* best-effort */ });
  }

  /**
   * Persist a generated AI summary onto the vault's stored metadata so it is
   * computed once (at creation, or on first view) and reused forever after —
   * never regenerated on every visit. Updates whichever store holds the vault.
   */
  setVaultSummary(uuid: string, summary: string) {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('dealvault-metadata');
    if (stored) {
      try {
        const vaults = JSON.parse(stored) as VaultMetadata[];
        const i = vaults.findIndex((v) => v.uuid === uuid);
        if (i !== -1) {
          vaults[i] = { ...vaults[i], aiSummary: summary };
          localStorage.setItem('dealvault-metadata', JSON.stringify(vaults));
          this.notifyVaultsChanged();
        }
      } catch { /* ignore malformed store */ }
    }
    this.syncVaultToServer({ uuid, aiSummary: summary }); // merge-updates the server copy
  }

  /**
   * Persist a Deal Room's safe sales PREVIEW (what's inside + a redacted sample,
   * generated from the real file at listing). Buyers see this to evaluate the
   * dataset before paying — so a purchase is informed, never a blind gamble.
   */
  setVaultPreview(uuid: string, preview: string) {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('dealvault-metadata');
    if (stored) {
      try {
        const vaults = JSON.parse(stored) as VaultMetadata[];
        const i = vaults.findIndex((v) => v.uuid === uuid);
        if (i !== -1) {
          vaults[i] = { ...vaults[i], preview };
          localStorage.setItem('dealvault-metadata', JSON.stringify(vaults));
          this.notifyVaultsChanged();
        }
      } catch { /* ignore malformed store */ }
    }
    this.syncVaultToServer({ uuid, preview }); // merge-updates the server copy
  }

  private getStoredVaults(): VaultMetadata[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('dealvault-metadata');
    return stored ? (JSON.parse(stored) as VaultMetadata[]) : [];
  }
}

export const cdrService = new CDRService();

/** Resolved escrow-gate address (env override, else the deployed default). */
export const ESCROW_GATE_ADDRESS =
  process.env.NEXT_PUBLIC_ESCROW_GATE_ADDRESS || DEFAULT_ESCROW_GATE_ADDRESS;
