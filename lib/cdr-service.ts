// CDR Service - Real Confidential Data Rails integration with Story Protocol.
//
// Canonical CDR pattern used here:
//   1. Generate a random 32-byte AES-256 data key in the browser.
//   2. Encrypt the selected file client-side with AES-GCM.
//   3. Threshold-encrypt the data key to Story's DKG public key and write it to
//      an on-chain CDR vault with explicit read/write condition settings.
//   4. Recover the data key with `accessCDR`, then decrypt the local encrypted
//      blob. For the hackathon demo the ciphertext blob is localStorage-backed;
//      production should move it to IPFS/Storacha so recipients can fetch it.
import { CDRClient, initWasm, uuidToLabel } from '@piplabs/cdr-sdk';
import {
  createPublicClient,
  createWalletClient,
  custom,
  encodeAbiParameters,
  getAddress,
  http,
  isAddress,
  toHex,
} from 'viem';
import { storyTestnet } from './wallet';

export type VaultType = 'deal-room' | 'dead-drop' | 'multi-sig';
export type VaultStatus = 'active' | 'expired' | 'sealed';
export type EnforcementMode = 'custom-condition-contract' | 'owner-only-fallback' | 'mock';

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
  txHash?: string;
  allocateTxHash?: string;
  writeTxHash?: string;
  readConditionAddress?: `0x${string}`;
  writeConditionAddress?: `0x${string}`;
  conditionData?: `0x${string}`;
  enforcementMode?: EnforcementMode;
  aiSummary?: string;
}

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
}

/** Live progress steps emitted during uploadVault (for the chat "thinking chain"). */
export type VaultStep = 'encrypt' | 'allocate' | 'protect' | 'write' | 'done';
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
  private useMock = process.env.NEXT_PUBLIC_USE_MOCK_CDR === 'true';
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

  private getConditionConfig(params: UploadVaultParams, creator: `0x${string}`): DealVaultConditionConfig {
    const customConditionAddress = normalizeOptionalAddress(
      process.env.NEXT_PUBLIC_DEALVAULT_CONDITION_ADDRESS || DEFAULT_CONDITION_ADDRESS,
    );

    if (!customConditionAddress) {
      return {
        writeConditionAddr: creator,
        readConditionAddr: creator,
        writeConditionData: '0x',
        readConditionData: '0x',
        enforcementMode: 'owner-only-fallback',
        skipConditionValidation: true,
      };
    }

    const authorizedWallets = normalizeAddressList(params.authorizedWallets);
    const recipient = normalizeOptionalAddress(params.recipientWallet) ?? ZERO_ADDRESS;
    const signers = normalizeAddressList(params.signers);
    const gate = normalizeOptionalAddress(params.gate) ?? ZERO_ADDRESS;
    // 0 = deal-room, 1 = dead-drop, 2 = multi-sig
    const conditionKind =
      params.type === 'deal-room' ? 0 : params.type === 'dead-drop' ? 1 : 2;
    const threshold = BigInt(
      params.threshold && params.threshold > 0
        ? params.threshold
        : conditionKind === 2
          ? Math.max(1, signers.length) // sensible default if omitted
          : 0,
    );
    const conditionData = encodeAbiParameters(
      [
        { name: 'conditionKind', type: 'uint8' },
        { name: 'creator', type: 'address' },
        { name: 'authorizedWallets', type: 'address[]' },
        { name: 'expiresAt', type: 'uint256' },
        { name: 'recipient', type: 'address' },
        { name: 'unlockAt', type: 'uint256' },
        { name: 'threshold', type: 'uint256' },
        { name: 'signers', type: 'address[]' },
        { name: 'gate', type: 'address' },
      ],
      [
        conditionKind,
        creator,
        authorizedWallets,
        BigInt(params.expiresAt ? Math.floor(params.expiresAt / 1000) : 0),
        recipient,
        BigInt(params.unlockAt ? Math.floor(params.unlockAt / 1000) : 0),
        threshold,
        signers,
        gate,
      ],
    );

    // WRITE condition = the creator's own wallet (EOA). When msg.sender equals
    // the write-condition address, CDR bypasses the condition call entirely, so
    // the write tx succeeds cleanly (an on-chain CONTRACT write condition makes
    // CDR call checkWriteCondition during write, which reverts the write tx with
    // an empty 0x — the key still lands via calldata so vaults worked, but the
    // tx showed "Failed"). This gives owner-only write (non-creators still can't
    // write — the EOA has no checkWriteCondition, so their write reverts).
    //
    // READ condition stays our deployed contract: that's where all the real
    // enforcement lives (deal-room expiry, dead-drop time-lock, multi-sig
    // threshold, composable escrow gate), validated by the validator network.
    return {
      writeConditionAddr: creator,
      readConditionAddr: customConditionAddress,
      writeConditionData: '0x',
      readConditionData: conditionData,
      enforcementMode: 'custom-condition-contract',
      skipConditionValidation: true,
    };
  }

  private async aesEncrypt(dataKey: Uint8Array, plaintext: ArrayBuffer): Promise<StoredBlob> {
    const key = await crypto.subtle.importKey(
      'raw',
      dataKey as unknown as BufferSource,
      'AES-GCM',
      false,
      ['encrypt'],
    );
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipher = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      plaintext,
    );
    return { iv: bytesToBase64(iv), data: bytesToBase64(new Uint8Array(cipher)) };
  }

  private async aesDecrypt(dataKey: Uint8Array, blob: StoredBlob): Promise<Uint8Array> {
    const key = await crypto.subtle.importKey(
      'raw',
      dataKey as unknown as BufferSource,
      'AES-GCM',
      false,
      ['decrypt'],
    );
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToBytes(blob.iv) as unknown as BufferSource },
      key,
      base64ToBytes(blob.data) as unknown as BufferSource,
    );
    return new Uint8Array(plain);
  }

  private storeBlob(uuid: string, blob: StoredBlob) {
    localStorage.setItem(`dealvault-blob-${uuid}`, JSON.stringify(blob));
    // Mirror to the server so an authorized wallet can open the vault from any
    // device. Safe — the blob is already AES-encrypted. Fire-and-forget.
    void fetch('/api/blob', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uuid, blob }),
    }).catch(() => { /* best-effort */ });
  }

  /** Local ciphertext first; fall back to the server copy on another device. */
  private async loadBlob(uuid: string): Promise<StoredBlob | null> {
    const raw = localStorage.getItem(`dealvault-blob-${uuid}`);
    if (raw) return JSON.parse(raw) as StoredBlob;
    try {
      const res = await fetch(`/api/blob?uuid=${encodeURIComponent(uuid)}`);
      const data = await res.json();
      if (data?.blob) {
        localStorage.setItem(`dealvault-blob-${uuid}`, JSON.stringify(data.blob)); // cache locally
        return data.blob as StoredBlob;
      }
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

  async uploadVault(
    params: UploadVaultParams,
    onProgress?: (p: VaultProgress) => void,
  ): Promise<VaultMetadata> {
    const emit = (step: VaultStep, status: 'start' | 'done', detail?: string) =>
      onProgress?.({ step, status, detail });

    if (this.useMock) {
      console.warn('🔶 MOCK mode — set NEXT_PUBLIC_USE_MOCK_CDR=false for real CDR');
      return this.mockUploadVault(params);
    }

    const client = await this.getCDRClient();
    const owner = this.ownerAddress!;
    const conditionConfig = this.getConditionConfig(params, owner);

    // 1) Encrypt the file client-side
    emit('encrypt', 'start');
    const globalPubKey = await client.observer.getGlobalPubKey();
    const dataKey = crypto.getRandomValues(new Uint8Array(32));
    const fileBuffer = await params.file.arrayBuffer();
    const blob = await this.aesEncrypt(dataKey, fileBuffer);
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
    this.storeBlob(uuidStr, blob);
    emit('done', 'done');

    const metadata = this.enrichMetadata({
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
    if (this.useMock) return this.mockAccessVault(uuid);

    const metadata = await this.getVaultMetadata(uuid);
    if (!metadata) throw new Error('Vault not found.');

    const account = await this.getConnectedAccount(true);
    this.assertLocalAccess(metadata, account);

    const client = await this.getCDRClient();
    const { dataKey } = await client.consumer.accessCDR({ uuid: Number(uuid), accessAuxData: '0x' });

    const blob = await this.loadBlob(uuid);
    if (!blob) {
      throw new Error(
        'Encrypted file unavailable. CDR access succeeded, but the ciphertext for this vault could not be found (it may have been too large to sync across devices).',
      );
    }

    const plaintext = await this.aesDecrypt(dataKey as Uint8Array, blob);
    return new Blob([plaintext as unknown as BlobPart], {
      type: metadata.fileType || 'application/octet-stream',
    });
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
      address: metadata.readConditionAddress,
      abi: DEAL_VAULT_CONDITION_ABI,
      functionName: 'approve',
      args: [metadata.conditionData],
    });
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    const approvals = (await publicClient.readContract({
      address: metadata.readConditionAddress,
      abi: DEAL_VAULT_CONDITION_ABI,
      functionName: 'approvalsFor',
      args: [metadata.conditionData],
    })) as bigint;

    return { txHash, approvals: Number(approvals) };
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
    if (this.useMock) return this.mockGetVaultMetadata(uuid);
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
    if (this.useMock) return this.mockListUserVaults(walletAddress);

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

    return [...byUuid.values()]
      .map((vault) => this.enrichMetadata(vault))
      .filter((vault) => {
        if (sameAddress(vault.creatorWallet, walletAddress)) return true;
        if (vault.type === 'dead-drop') return sameAddress(vault.recipientWallet, walletAddress);
        return vault.authorizedWallets?.some((wallet) => sameAddress(wallet, walletAddress));
      });
  }

  /** Add a server-fetched vault to the local index (cache) if not already there. */
  private cacheVaultLocally(vault: VaultMetadata) {
    if (typeof window === 'undefined') return;
    const vaults = this.getStoredVaults();
    if (vaults.some((v) => v.uuid === vault.uuid)) return;
    vaults.push(vault);
    localStorage.setItem('dealvault-metadata', JSON.stringify(vaults));
  }

  private async mockUploadVault(params: UploadVaultParams): Promise<VaultMetadata> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const uuid = `mock-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    let creatorWallet: string | undefined;
    try {
      creatorWallet = await this.getConnectedAccount(false);
    } catch {
      creatorWallet = undefined;
    }

    const metadata = this.enrichMetadata({
      uuid,
      name: params.name,
      type: params.type,
      createdAt: Date.now(),
      status: 'active',
      creatorWallet,
      expiresAt: params.expiresAt,
      unlockAt: params.unlockAt,
      authorizedWallets: normalizeAddressList(params.authorizedWallets),
      recipientWallet: normalizeOptionalAddress(params.recipientWallet),
      signers: normalizeAddressList(params.signers),
      threshold: params.threshold,
      gate: normalizeOptionalAddress(params.gate),
      fileName: params.file.name,
      fileType: params.file.type,
      enforcementMode: 'mock',
    });

    const vaults = this.getMockVaults();
    vaults.push(metadata);
    localStorage.setItem('mock-vaults', JSON.stringify(vaults));

    const fileData = await params.file.arrayBuffer();
    localStorage.setItem(`mock-file-${uuid}`, bytesToBase64(new Uint8Array(fileData)));

    return metadata;
  }

  private async mockAccessVault(uuid: string): Promise<Blob> {
    await new Promise((resolve) => setTimeout(resolve, 150));

    const meta = await this.mockGetVaultMetadata(uuid);
    if (!meta) throw new Error('Vault not found');

    const account = await this.getConnectedAccount(false);
    this.assertLocalAccess(meta, account);

    const fileData = localStorage.getItem(`mock-file-${uuid}`);
    if (!fileData) throw new Error('Vault not found');

    return new Blob([base64ToBytes(fileData) as unknown as BlobPart], {
      type: meta.fileType || 'application/octet-stream',
    });
  }

  private async mockGetVaultMetadata(uuid: string): Promise<VaultMetadata | null> {
    const vault = this.getMockVaults().find((item) => item.uuid === uuid);
    return vault ? this.enrichMetadata(vault) : null;
  }

  private async mockListUserVaults(walletAddress: string): Promise<VaultMetadata[]> {
    return this.getMockVaults()
      .map((vault) => this.enrichMetadata(vault))
      .filter((vault) => {
        if (sameAddress(vault.creatorWallet, walletAddress)) return true;
        if (vault.type === 'dead-drop') return sameAddress(vault.recipientWallet, walletAddress);
        return vault.authorizedWallets?.some((wallet) => sameAddress(wallet, walletAddress));
      });
  }

  private getMockVaults(): VaultMetadata[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('mock-vaults');
    return stored ? (JSON.parse(stored) as VaultMetadata[]) : [];
  }

  private saveVaultMetadata(metadata: VaultMetadata) {
    const vaults = this.getStoredVaults();
    vaults.push(metadata);
    localStorage.setItem('dealvault-metadata', JSON.stringify(vaults));
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
    for (const key of ['dealvault-metadata', 'mock-vaults']) {
      const stored = localStorage.getItem(key);
      if (!stored) continue;
      try {
        const vaults = JSON.parse(stored) as VaultMetadata[];
        const i = vaults.findIndex((v) => v.uuid === uuid);
        if (i !== -1) {
          vaults[i] = { ...vaults[i], aiSummary: summary };
          localStorage.setItem(key, JSON.stringify(vaults));
        }
      } catch { /* ignore malformed store */ }
    }
    this.syncVaultToServer({ uuid, aiSummary: summary }); // merge-updates the server copy
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
