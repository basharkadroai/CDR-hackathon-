// Wallet connection utilities
import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { defineChain } from 'viem';

export const storyTestnet = defineChain({
  id: 1315,
  name: 'Story Aeneid Testnet',
  network: 'story-aeneid',
  nativeCurrency: {
    decimals: 18,
    name: 'IP',
    symbol: 'IP',
  },
  rpcUrls: {
    default: {
      http: ['https://aeneid.storyrpc.io'],
    },
    public: {
      http: ['https://aeneid.storyrpc.io'],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://testnet.storyscan.xyz' },
  },
});

export async function connectWallet() {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('No wallet detected. Please install MetaMask or another Web3 wallet.');
  }

  const accounts = await window.ethereum.request({ 
    method: 'eth_requestAccounts' 
  }) as string[];

  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts found');
  }

  return accounts[0];
}

export function createClients(account: `0x${string}`) {
  const publicClient = createPublicClient({
    chain: storyTestnet,
    transport: http('https://aeneid.storyrpc.io'),
  });

  const walletClient = createWalletClient({
    account,
    chain: storyTestnet,
    transport: custom(window.ethereum!),
  });

  return { publicClient, walletClient };
}
