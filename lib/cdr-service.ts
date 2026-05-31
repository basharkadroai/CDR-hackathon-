// CDR Service - Real Confidential Data Rails integration with Story Protocol.
//
// How real CDR works here (the canonical CDR pattern):
//   1. We generate a random 32-byte AES-256 data key.
//   2. The file is AES-GCM encrypted in the browser with that key. The
//      ciphertext never leaves the client unencrypted.
//   3. The *data key* is threshold-encrypted to the validator DKG public key
//      and written to an on-chain CDR vault via `uploadCDR`, gated by on-chain
//      read/write condition contracts. No single party ever holds the key.
//   4. To read, `accessCDR` enforces the read condition on-chain, collects
//      partial decryptions from the validator set, and recovers the data key,
//      which we then use to AES-GCM decrypt the stored ciphertext.
//
// The encrypted blob is stored client-side (localStorage) for the demo; in
// production it would live on IPFS/Storacha. The access control that matters
// (the data key) is fully on-chain via CDR.
import { CDRClient, initWasm } from '@piplabs/cdr-sdk';
import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { storyTestnet } from './wallet';

export interface VaultMetadata {
  uuid: string;
  name: string;
  type: 'deal-room' | 'dead-drop';
  createdAt: number;
  status: 'active' | 'expired' | 'sealed';
  expiresAt?: number;
  unlockAt?: number;
  authorizedWallets?: string[];
  recipientWallet?: string;
  fileName?: string;
  fileType?: string;
  txHash?: string;
}

export interface UploadVaultParams {
  file: File;
  name: string;
  type: 'deal-room' | 'dead-drop';
  authorizedWallets?: string[];
  expiresAt?: number;
  unlockAt?: number;
  recipientWallet?: string;
}

// Deployed condition contracts on Story Aeneid Testnet.
// Override via env to point at your own deployed conditions.
const OWNER_WRITE_CONDITION = (process.env.NEXT_PUBLIC_CDR_WRITE_CONDITION ||
  '0x4C9bFC96d7092b590D497A191826C3dA2277c34B') as `0x${string}`;
const LICENSE_READ_CONDITION = (process.env.NEXT_PUBLIC_CDR_READ_CONDITION ||
  '0xC0640AD4CF2CaA9914C8e5C44234359a9102f7a3') as `0x${string}`;

// ---------- small helpers ----------

// Chunked base64 so large files don't blow the call stack.
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

interface StoredBlob {
  iv: string; // base64
  data: string; // base64 ciphertext
}

class CDRService {
  private useMock = process.env.NEXT_PUBLIC_USE_MOCK_CDR === 'true';
  private wasmInitialized = false;
  private cdrClient: CDRClient | null = null;

  private async initializeCDR() {
    if (!this.wasmInitialized) {
      await initWasm();
      this.wasmInitialized = true;
    }
  }

  private async getCDRClient(): Promise<CDRClient> {
    if (this.cdrClient) return this.cdrClient;

    await this.initializeCDR();

    if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
      throw new Error('No wallet detected. Please install MetaMask.');
    }

    const accounts = (await window.ethereum.request({
      method: 'eth_requestAccounts',
    })) as string[];

    if (!accounts || accounts.length === 0) {
      throw new Error('No wallet connected. Please unlock MetaMask.');
    }

    const account = accounts[0] as `0x${string}`;

    const publicClient = createPublicClient({
      chain: storyTestnet,
      transport: http('https://aeneid.storyrpc.io'),
    });

    const walletClient = createWalletClient({
      account,
      chain: storyTestnet,
      transport: custom(window.ethereum),
    });

    // Route the plain-HTTP Story-API through our same-origin HTTPS proxy
    // (app/api/cdr) so production (HTTPS) isn't blocked by mixed content.
    const apiUrl = `${window.location.origin}/api/cdr`;

    this.cdrClient = new CDRClient({
      network: 'testnet',
      publicClient,
      walletClient,
      apiUrl,
    } as any);

    return this.cdrClient;
  }

  // ---------- AES-GCM file encryption (key is the CDR-protected data key) ----------

  private async aesEncrypt(
    dataKey: Uint8Array,
    plaintext: ArrayBuffer,
  ): Promise<StoredBlob> {
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
    return {
      iv: bytesToBase64(iv),
      data: bytesToBase64(new Uint8Array(cipher)),
    };
  }

  private async aesDecrypt(
    dataKey: Uint8Array,
    blob: StoredBlob,
  ): Promise<Uint8Array> {
    const key = await crypto.subtle.importKey(
      'raw',
      dataKey as unknown as BufferSource,
      'AES-GCM',
      false,
      ['decrypt'],
    );
    const iv = base64ToBytes(blob.iv);
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      base64ToBytes(blob.data) as unknown as BufferSource,
    );
    return new Uint8Array(plain);
  }

  private storeBlob(uuid: string, blob: StoredBlob) {
    localStorage.setItem(`dealvault-blob-${uuid}`, JSON.stringify(blob));
  }

  private loadBlob(uuid: string): StoredBlob | null {
    const raw = localStorage.getItem(`dealvault-blob-${uuid}`);
    return raw ? (JSON.parse(raw) as StoredBlob) : null;
  }

  // ---------- public API ----------

  async uploadVault(params: UploadVaultParams): Promise<VaultMetadata> {
    if (this.useMock) {
      console.warn('🔶 MOCK mode — set NEXT_PUBLIC_USE_MOCK_CDR=false for real CDR');
      return this.mockUploadVault(params);
    }

    const client = await this.getCDRClient();

    // Threshold DKG public key (read via the proxied Story-API).
    const globalPubKey = await client.observer.getGlobalPubKey();

    // Random AES-256 data key — this is what CDR protects on-chain.
    const dataKey = crypto.getRandomValues(new Uint8Array(32));

    // Encrypt the file client-side with the data key.
    const fileBuffer = await params.file.arrayBuffer();
    const blob = await this.aesEncrypt(dataKey, fileBuffer);

    // Write the threshold-encrypted data key to an on-chain CDR vault,
    // gated by the read/write condition contracts.
    const { uuid, txHashes } = await client.uploader.uploadCDR({
      dataKey,
      globalPubKey,
      updatable: false,
      writeConditionAddr: OWNER_WRITE_CONDITION,
      readConditionAddr: LICENSE_READ_CONDITION,
      writeConditionData: '0x',
      readConditionData: '0x',
      accessAuxData: '0x',
    } as any);

    const uuidStr = String(uuid);

    // Store the encrypted blob (useless without the CDR-protected key).
    this.storeBlob(uuidStr, blob);

    const now = Date.now();
    const metadata: VaultMetadata = {
      uuid: uuidStr,
      name: params.name,
      type: params.type,
      createdAt: now,
      status:
        params.type === 'dead-drop' && params.unlockAt && params.unlockAt > now
          ? 'sealed'
          : 'active',
      expiresAt: params.expiresAt,
      unlockAt: params.unlockAt,
      authorizedWallets: params.authorizedWallets,
      recipientWallet: params.recipientWallet,
      fileName: params.file.name,
      fileType: params.file.type,
      txHash: txHashes?.allocate ?? txHashes?.write,
    };

    this.saveVaultMetadata(metadata);
    return metadata;
  }

  async accessVault(uuid: string): Promise<Blob> {
    if (this.useMock) {
      return this.mockAccessVault(uuid);
    }

    const client = await this.getCDRClient();

    // Enforce the read condition on-chain, collect validator partials,
    // and recover the original data key.
    const { dataKey } = await client.consumer.accessCDR({
      uuid: Number(uuid),
      accessAuxData: '0x',
    } as any);

    const blob = this.loadBlob(uuid);
    if (!blob) {
      throw new Error(
        'Encrypted file blob not found on this device. ' +
          'The CDR access succeeded but the ciphertext is missing (it is stored client-side for this demo).',
      );
    }

    const plaintext = await this.aesDecrypt(dataKey as Uint8Array, blob);
    const meta = await this.getVaultMetadata(uuid);
    return new Blob([plaintext as unknown as BlobPart], {
      type: meta?.fileType || 'application/octet-stream',
    });
  }

  async getVaultMetadata(uuid: string): Promise<VaultMetadata | null> {
    if (this.useMock) return this.mockGetVaultMetadata(uuid);
    const vaults = this.getStoredVaults();
    return vaults.find((v) => v.uuid === uuid) || null;
  }

  async listUserVaults(walletAddress: string): Promise<VaultMetadata[]> {
    if (this.useMock) return this.mockListUserVaults(walletAddress);
    return this.getStoredVaults();
  }

  // ---------- mock implementations (demo without on-chain txs) ----------

  private async mockUploadVault(params: UploadVaultParams): Promise<VaultMetadata> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const uuid = `mock-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const now = Date.now();

    const metadata: VaultMetadata = {
      uuid,
      name: params.name,
      type: params.type,
      createdAt: now,
      status:
        params.type === 'dead-drop' && params.unlockAt && params.unlockAt > now
          ? 'sealed'
          : 'active',
      expiresAt: params.expiresAt,
      unlockAt: params.unlockAt,
      authorizedWallets: params.authorizedWallets,
      recipientWallet: params.recipientWallet,
      fileName: params.file.name,
      fileType: params.file.type,
    };

    const vaults = this.getMockVaults();
    vaults.push(metadata);
    localStorage.setItem('mock-vaults', JSON.stringify(vaults));

    const fileData = await params.file.arrayBuffer();
    localStorage.setItem(`mock-file-${uuid}`, bytesToBase64(new Uint8Array(fileData)));

    return metadata;
  }

  private async mockAccessVault(uuid: string): Promise<Blob> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const fileData = localStorage.getItem(`mock-file-${uuid}`);
    if (!fileData) throw new Error('Vault not found');

    const meta = await this.mockGetVaultMetadata(uuid);
    return new Blob([base64ToBytes(fileData) as unknown as BlobPart], {
      type: meta?.fileType || 'application/octet-stream',
    });
  }

  private async mockGetVaultMetadata(uuid: string): Promise<VaultMetadata | null> {
    return this.getMockVaults().find((v) => v.uuid === uuid) || null;
  }

  private async mockListUserVaults(_walletAddress: string): Promise<VaultMetadata[]> {
    return this.getMockVaults();
  }

  private getMockVaults(): VaultMetadata[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('mock-vaults');
    return stored ? JSON.parse(stored) : [];
  }

  // ---------- metadata storage ----------

  private saveVaultMetadata(metadata: VaultMetadata) {
    const vaults = this.getStoredVaults();
    vaults.push(metadata);
    localStorage.setItem('dealvault-metadata', JSON.stringify(vaults));
  }

  private getStoredVaults(): VaultMetadata[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('dealvault-metadata');
    return stored ? JSON.parse(stored) : [];
  }
}

export const cdrService = new CDRService();
