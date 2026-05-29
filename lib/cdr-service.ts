// CDR Service - Real CDR implementation with Story Protocol
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

// Deployed condition contracts on Story Testnet (Aeneid)
const OWNER_WRITE_CONDITION = '0x4C9bFC96d7092b590D497A191826C3dA2277c34B';
const LICENSE_READ_CONDITION = '0xC0640AD4CF2CaA9914C8e5C44234359a9102f7a3';

class CDRService {
  private useMock = process.env.NEXT_PUBLIC_USE_MOCK_CDR === 'true'; // Now controlled by env var
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

    if (typeof window.ethereum === 'undefined') {
      throw new Error('No wallet detected');
    }

    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    }) as string[];

    if (!accounts || accounts.length === 0) {
      throw new Error('No wallet connected');
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

    this.cdrClient = new CDRClient({
      network: 'testnet',
      publicClient,
      walletClient,
    } as any);

    return this.cdrClient;
  }

  async uploadVault(params: UploadVaultParams): Promise<VaultMetadata> {
    if (this.useMock) {
      return this.mockUploadVault(params);
    }
    
    const client = await this.getCDRClient();
    
    // Get global public key for encryption
    const globalPubKey = await client.observer.getGlobalPubKey();
    
    // Generate random data key
    const dataKey = crypto.getRandomValues(new Uint8Array(32));
    
    // Read file as buffer
    const fileBuffer = await params.file.arrayBuffer();
    
    // Determine read condition based on vault type
    // TODO: Deploy custom time-lock conditions for Deal Room and Dead Drop
    const readConditionAddr = LICENSE_READ_CONDITION;
    
    // Upload to CDR
    const { uuid } = await client.uploader.uploadCDR({
      dataKey,
      globalPubKey,
      updatable: false,
      writeConditionAddr: OWNER_WRITE_CONDITION,
      readConditionAddr,
      data: new Uint8Array(fileBuffer),
    } as any);

    const now = Date.now();
    const metadata: VaultMetadata = {
      uuid: String(uuid),
      name: params.name,
      type: params.type,
      createdAt: now,
      status: params.type === 'dead-drop' && params.unlockAt && params.unlockAt > now 
        ? 'sealed' 
        : 'active',
      expiresAt: params.expiresAt,
      unlockAt: params.unlockAt,
      authorizedWallets: params.authorizedWallets,
      recipientWallet: params.recipientWallet,
      fileName: params.file.name,
    };

    // Store metadata in localStorage (in production, use backend/IPFS)
    this.saveVaultMetadata(metadata);

    return metadata;
  }

  async accessVault(uuid: string): Promise<Blob> {
    if (this.useMock) {
      return this.mockAccessVault(uuid);
    }
    
    const client = await this.getCDRClient();
    
    // Access CDR - will check read conditions on-chain
    const decryptedData = await client.consumer.accessCDR({ uuid: Number(uuid) } as any);
    
    return new Blob([decryptedData as any]);
  }

  async getVaultMetadata(uuid: string): Promise<VaultMetadata | null> {
    if (this.useMock) {
      return this.mockGetVaultMetadata(uuid);
    }
    
    const vaults = this.getStoredVaults();
    return vaults.find(v => v.uuid === uuid) || null;
  }

  async listUserVaults(walletAddress: string): Promise<VaultMetadata[]> {
    if (this.useMock) {
      return this.mockListUserVaults(walletAddress);
    }
    
    return this.getStoredVaults();
  }

  // Mock implementations for development without test tokens
  private async mockUploadVault(params: UploadVaultParams): Promise<VaultMetadata> {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate upload
    
    const uuid = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    const metadata: VaultMetadata = {
      uuid,
      name: params.name,
      type: params.type,
      createdAt: now,
      status: params.type === 'dead-drop' && params.unlockAt && params.unlockAt > now 
        ? 'sealed' 
        : 'active',
      expiresAt: params.expiresAt,
      unlockAt: params.unlockAt,
      authorizedWallets: params.authorizedWallets,
      recipientWallet: params.recipientWallet,
      fileName: params.file.name,
    };

    // Store in localStorage for mock persistence
    const vaults = this.getMockVaults();
    vaults.push(metadata);
    localStorage.setItem('mock-vaults', JSON.stringify(vaults));
    
    // Store file data
    const fileData = await params.file.arrayBuffer();
    localStorage.setItem(`mock-file-${uuid}`, btoa(String.fromCharCode(...new Uint8Array(fileData))));

    return metadata;
  }

  private async mockAccessVault(uuid: string): Promise<Blob> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const fileData = localStorage.getItem(`mock-file-${uuid}`);
    if (!fileData) {
      throw new Error('Vault not found');
    }

    const binary = atob(fileData);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    return new Blob([bytes]);
  }

  private async mockGetVaultMetadata(uuid: string): Promise<VaultMetadata | null> {
    const vaults = this.getMockVaults();
    return vaults.find(v => v.uuid === uuid) || null;
  }

  private async mockListUserVaults(walletAddress: string): Promise<VaultMetadata[]> {
    return this.getMockVaults();
  }

  private getMockVaults(): VaultMetadata[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('mock-vaults');
    return stored ? JSON.parse(stored) : [];
  }

  // Metadata storage helpers (use localStorage for now, move to backend later)
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
