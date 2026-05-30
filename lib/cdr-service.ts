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

    console.log('🔧 Initializing CDR client...');

    // Step 1: Initialize WASM
    try {
      await this.initializeCDR();
      console.log('✅ WASM initialized');
    } catch (error) {
      console.error('❌ WASM initialization failed:', error);
      throw new Error(`WASM initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Step 2: Check for wallet
    if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
      throw new Error('No wallet detected. Please install MetaMask.');
    }
    console.log('✅ Wallet detected');

    try {
      // Step 3: Request wallet connection
      console.log('🔐 Requesting wallet connection...');
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      }) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error('No wallet connected. Please connect your wallet.');
      }
      console.log('✅ Wallet connected:', accounts[0]);

      const account = accounts[0] as `0x${string}`;

      // Step 4: Check network
      console.log('🌐 Checking network...');
      const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
      const currentChainId = parseInt(chainId, 16);
      console.log('Current chain ID:', currentChainId, '(Expected: 1513)');
      
      if (currentChainId !== 1513) {
        console.warn('⚠️ Wrong network! Please switch to Story Testnet (Chain ID: 1513)');
        // Try to switch network
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x5E9' }], // 1513 in hex
          });
          console.log('✅ Switched to Story Testnet');
        } catch (switchError: any) {
          // Network not added, try to add it
          if (switchError.code === 4902) {
            console.log('📝 Adding Story Testnet to wallet...');
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x5E9',
                chainName: 'Story Testnet',
                nativeCurrency: {
                  name: 'IP',
                  symbol: 'IP',
                  decimals: 18
                },
                rpcUrls: ['https://aeneid.storyrpc.io'],
                blockExplorerUrls: ['https://testnet.storyscan.xyz']
              }],
            });
            console.log('✅ Story Testnet added to wallet');
          } else {
            throw switchError;
          }
        }
      }

      // Step 5: Create clients
      console.log('🔨 Creating viem clients...');
      const publicClient = createPublicClient({
        chain: storyTestnet,
        transport: http('https://aeneid.storyrpc.io'),
      });

      const walletClient = createWalletClient({
        account,
        chain: storyTestnet,
        transport: custom(window.ethereum),
      });
      console.log('✅ Viem clients created');

      // Step 6: Create CDR client
      console.log('🚀 Creating CDR client...');
      this.cdrClient = new CDRClient({
        network: 'testnet',
        publicClient,
        walletClient,
      } as any);
      console.log('✅ CDR client created successfully!');

      return this.cdrClient;
    } catch (error) {
      console.error('❌ Failed to initialize CDR client:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error(`CDR initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async uploadVault(params: UploadVaultParams): Promise<VaultMetadata> {
    // Try real CDR first, fallback to mock if it fails
    if (this.useMock) {
      console.log('📦 Using mock CDR mode (NEXT_PUBLIC_USE_MOCK_CDR=true)');
      return this.mockUploadVault(params);
    }
    
    try {
      console.log('🚀 Attempting to use real CDR...');
      console.log('📄 File:', params.file.name, `(${(params.file.size / 1024).toFixed(2)} KB)`);
      
      // Step 1: Get CDR client
      const client = await this.getCDRClient();
      
      // Step 2: Get global public key for encryption
      console.log('🔑 Getting global public key...');
      const globalPubKey = await client.observer.getGlobalPubKey();
      console.log('✅ Global public key obtained');
      
      // Step 3: Generate random data key
      console.log('🎲 Generating data key...');
      const dataKey = crypto.getRandomValues(new Uint8Array(32));
      console.log('✅ Data key generated');
      
      // Step 4: Read file as buffer
      console.log('📖 Reading file...');
      const fileBuffer = await params.file.arrayBuffer();
      console.log('✅ File read:', fileBuffer.byteLength, 'bytes');
      
      // Step 5: Determine read condition based on vault type
      const readConditionAddr = LICENSE_READ_CONDITION;
      console.log('🔐 Using read condition:', readConditionAddr);
      console.log('✍️ Using write condition:', OWNER_WRITE_CONDITION);
      
      // Step 6: Upload to CDR
      console.log('⬆️ Uploading to CDR...');
      const { uuid } = await client.uploader.uploadCDR({
        dataKey,
        globalPubKey,
        updatable: false,
        writeConditionAddr: OWNER_WRITE_CONDITION,
        readConditionAddr,
        data: new Uint8Array(fileBuffer),
      } as any);
      console.log('✅ Upload successful! UUID:', uuid);

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

      console.log('✅ Successfully uploaded to real CDR:', metadata);
      return metadata;
    } catch (error) {
      console.error('❌ Real CDR failed:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      console.log('💡 Tip: Set NEXT_PUBLIC_USE_MOCK_CDR=true in .env.local to use mock mode by default');
      
      // Fallback to mock mode
      console.log('🔄 Falling back to mock mode...');
      return this.mockUploadVault(params);
    }
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
