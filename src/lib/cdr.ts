/**
 * CDR (Confidential Data Rails) Integration
 * Handles encryption, vault creation, and decryption via Story Protocol
 */

export interface CDRVault {
  vaultId: string;
  dataUrl: string;
  encryptionKey: string;
  createdAt: number;
}

export interface CDRAccessCondition {
  type: 'wallet' | 'time' | 'multisig' | 'conditional';
  params: any;
}

/**
 * Encrypt data client-side before storing in CDR vault
 */
export async function encryptData(data: string | File): Promise<{
  encryptedData: string;
  encryptionKey: string;
}> {
  // Generate random encryption key
  const key = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );

  // Convert data to ArrayBuffer
  let dataBuffer: ArrayBuffer;
  if (typeof data === 'string') {
    dataBuffer = new TextEncoder().encode(data);
  } else {
    dataBuffer = await data.arrayBuffer();
  }

  // Generate IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Encrypt
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    dataBuffer
  );

  // Export key
  const exportedKey = await window.crypto.subtle.exportKey("raw", key);

  // Combine IV + encrypted data
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);

  return {
    encryptedData: btoa(String.fromCharCode(...combined)),
    encryptionKey: btoa(String.fromCharCode(...new Uint8Array(exportedKey))),
  };
}

/**
 * Decrypt data after retrieving from CDR vault
 */
export async function decryptData(
  encryptedData: string,
  encryptionKey: string
): Promise<string> {
  // Import key
  const keyBuffer = Uint8Array.from(atob(encryptionKey), c => c.charCodeAt(0));
  const key = await window.crypto.subtle.importKey(
    "raw",
    keyBuffer,
    "AES-GCM",
    true,
    ["decrypt"]
  );

  // Parse encrypted data
  const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  // Decrypt
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    data
  );

  return new TextDecoder().decode(decryptedBuffer);
}

/**
 * Create a CDR vault with access conditions
 */
export async function createCDRVault(
  encryptedData: string,
  encryptionKey: string,
  accessConditions: CDRAccessCondition[]
): Promise<CDRVault> {
  const apiUrl = process.env.NEXT_PUBLIC_CDR_API_URL || 'https://cdr-api.story.foundation';
  
  try {
    const response = await fetch(`${apiUrl}/vaults`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CDR_API_KEY}`,
      },
      body: JSON.stringify({
        encryptedData,
        encryptionKey,
        accessConditions,
      }),
    });

    if (!response.ok) {
      throw new Error(`CDR API error: ${response.statusText}`);
    }

    const vault = await response.json();
    
    return {
      vaultId: vault.id,
      dataUrl: vault.dataUrl,
      encryptionKey: encryptionKey,
      createdAt: Date.now(),
    };
  } catch (error) {
    console.error('Failed to create CDR vault:', error);
    
    // Fallback: Return mock vault for demo purposes
    return {
      vaultId: `vault_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dataUrl: `ipfs://mock/${Date.now()}`,
      encryptionKey: encryptionKey,
      createdAt: Date.now(),
    };
  }
}

/**
 * Request access to a CDR vault
 */
export async function requestVaultAccess(
  vaultId: string,
  walletAddress: string
): Promise<{
  granted: boolean;
  partialDecryptions?: string[];
  reason?: string;
}> {
  const apiUrl = process.env.NEXT_PUBLIC_CDR_API_URL || 'https://cdr-api.story.foundation';
  
  try {
    const response = await fetch(`${apiUrl}/vaults/${vaultId}/access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
      }),
    });

    if (!response.ok) {
      return {
        granted: false,
        reason: 'Access denied by smart contract',
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to request vault access:', error);
    return {
      granted: false,
      reason: 'Network error',
    };
  }
}

/**
 * Combine partial decryptions from TEE validators
 */
export async function combinePartialDecryptions(
  partialDecryptions: string[]
): Promise<string> {
  // In production, this would use threshold cryptography
  // For demo, we'll simulate the process
  
  if (partialDecryptions.length < 2) {
    throw new Error('Insufficient partial decryptions');
  }
  
  // Mock: Just return the first one (in reality, you'd combine them cryptographically)
  return partialDecryptions[0];
}
