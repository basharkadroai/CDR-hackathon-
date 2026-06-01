/**
 * IP Token Integration for Story Protocol
 * Handles IP token balance, escrow, and transactions
 */

import { createWalletClient, custom, formatEther, getAddress, parseEther } from 'viem';
import { useAccount, useBalance, useWriteContract, useReadContract } from 'wagmi';
import { storyTestnet } from './wallet';

// On Story Testnet, IP is the NATIVE token (like ETH on Ethereum)
// No separate token contract needed
export const USE_NATIVE_IP = process.env.NEXT_PUBLIC_USE_NATIVE_IP === 'true';

// Escrow Manager contract address (to be deployed)
export const ESCROW_MANAGER_ADDRESS = (process.env.NEXT_PUBLIC_ESCROW_MANAGER_ADDRESS as `0x${string}` | undefined) || '0x0000000000000000000000000000000000000000';

/**
 * Hook to get user's IP token balance
 * On Story Testnet, IP is the native token (like ETH on Ethereum)
 */
export function useIPBalance() {
  const { address } = useAccount();

  // Get native balance (IP tokens on Story Testnet)
  const { data: balance, isLoading, refetch } = useBalance({
    address: address,
  });

  return {
    balance: balance ? formatEther(balance.value) : '0',
    formatted: balance ? formatEther(balance.value) : '0',
    symbol: balance?.symbol || 'IP',
    isLoading,
    refetch,
  };
}

/**
 * Create an escrow with IP tokens
 * @param amount Amount of IP tokens to lock
 * @param seller Seller's wallet address
 * @param dealRoomId Associated deal room ID
 * @param autoRelease Whether to auto-release when conditions are met
 */
export async function createEscrowWithIP({
  amount,
  seller,
  dealRoomId,
  autoRelease = true,
}: {
  amount: string;
  seller: string;
  dealRoomId: number;
  autoRelease?: boolean;
}) {
  if (ESCROW_MANAGER_ADDRESS === '0x0000000000000000000000000000000000000000') {
    throw new Error('EscrowManager is not configured. Set NEXT_PUBLIC_ESCROW_MANAGER_ADDRESS after deploying EscrowManager.sol.');
  }

  if (typeof window.ethereum === 'undefined') {
    throw new Error('No wallet detected. Please install MetaMask or another Web3 wallet.');
  }

  const [account] = (await window.ethereum.request({ method: 'eth_requestAccounts' })) as string[];
  if (!account) throw new Error('No wallet account available.');

  const amountInWei = parseEther(amount);
  const walletClient = createWalletClient({
    account: getAddress(account) as `0x${string}`,
    chain: storyTestnet,
    transport: custom(window.ethereum),
  });

  const escrowABI = [
    {
      name: 'createEscrow',
      type: 'function',
      stateMutability: 'payable',
      inputs: [
        { name: 'seller', type: 'address' },
        { name: 'dealRoomId', type: 'uint256' },
        { name: 'autoRelease', type: 'bool' },
      ],
      outputs: [{ name: 'escrowId', type: 'uint256' }],
    },
  ] as const;

  const txHash = await walletClient.writeContract({
    address: ESCROW_MANAGER_ADDRESS,
    abi: escrowABI,
    functionName: 'createEscrow',
    args: [getAddress(seller) as `0x${string}`, BigInt(dealRoomId), autoRelease],
    value: amountInWei,
  });

  return {
    txHash,
    amount: amountInWei,
    seller: getAddress(seller),
    dealRoomId,
    status: 'SUBMITTED',
    createdAt: Date.now(),
  };
}

/**
 * Hook to write to escrow contract
 */
export function useCreateEscrow() {
  const { writeContract, data, isPending, isSuccess, error } = useWriteContract();

  const createEscrow = async ({
    seller,
    dealRoomId,
    amount,
    autoRelease,
  }: {
    seller: `0x${string}`;
    dealRoomId: bigint;
    amount: bigint;
    autoRelease: boolean;
  }) => {
    const escrowABI = [
      {
        name: 'createEscrow',
        type: 'function',
        stateMutability: 'payable',
        inputs: [
          { name: 'seller', type: 'address' },
          { name: 'dealRoomId', type: 'uint256' },
          { name: 'autoRelease', type: 'bool' },
        ],
        outputs: [{ name: 'escrowId', type: 'uint256' }],
      },
    ] as const;

    return writeContract({
      address: ESCROW_MANAGER_ADDRESS,
      abi: escrowABI,
      functionName: 'createEscrow',
      args: [seller, dealRoomId, autoRelease],
      value: amount,
    });
  };

  return {
    createEscrow,
    data,
    isPending,
    isSuccess,
    error,
  };
}

/**
 * Hook to read escrow details
 */
export function useEscrowDetails(escrowId: bigint) {
  // TODO: Replace with actual ABI when contract is deployed
  const escrowABI = [
    {
      name: 'getEscrow',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'escrowId', type: 'uint256' }],
      outputs: [
        {
          name: '',
          type: 'tuple',
          components: [
            { name: 'id', type: 'uint256' },
            { name: 'buyer', type: 'address' },
            { name: 'seller', type: 'address' },
            { name: 'amount', type: 'uint256' },
            { name: 'dealRoomId', type: 'uint256' },
            { name: 'status', type: 'uint8' },
            { name: 'createdAt', type: 'uint256' },
            { name: 'releaseConditionMet', type: 'uint256' },
            { name: 'autoRelease', type: 'bool' },
          ],
        },
      ],
    },
  ] as const;

  const { data, isLoading, refetch } = useReadContract({
    address: ESCROW_MANAGER_ADDRESS,
    abi: escrowABI,
    functionName: 'getEscrow',
    args: [escrowId],
  });

  return {
    escrow: data,
    isLoading,
    refetch,
  };
}

/**
 * Release funds from escrow
 */
export function useReleaseFunds() {
  const { writeContract, data, isPending, isSuccess, error } = useWriteContract();

  const releaseFunds = async (escrowId: bigint) => {
    const escrowABI = [
      {
        name: 'releaseFunds',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'escrowId', type: 'uint256' }],
        outputs: [],
      },
    ] as const;

    return writeContract({
      address: ESCROW_MANAGER_ADDRESS,
      abi: escrowABI,
      functionName: 'releaseFunds',
      args: [escrowId],
    });
  };

  return {
    releaseFunds,
    data,
    isPending,
    isSuccess,
    error,
  };
}

/**
 * Refund buyer from escrow
 */
export function useRefundEscrow() {
  const { writeContract, data, isPending, isSuccess, error } = useWriteContract();

  const refundEscrow = async (escrowId: bigint) => {
    const escrowABI = [
      {
        name: 'refundBuyer',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'escrowId', type: 'uint256' }],
        outputs: [],
      },
    ] as const;

    return writeContract({
      address: ESCROW_MANAGER_ADDRESS,
      abi: escrowABI,
      functionName: 'refundBuyer',
      args: [escrowId],
    });
  };

  return {
    refundEscrow,
    data,
    isPending,
    isSuccess,
    error,
  };
}

/**
 * Format IP token amount for display
 */
export function formatIPAmount(amount: bigint | string): string {
  if (typeof amount === 'string') {
    return amount;
  }
  return formatEther(amount);
}

/**
 * Parse IP token amount from string
 */
export function parseIPAmount(amount: string): bigint {
  return parseEther(amount);
}
