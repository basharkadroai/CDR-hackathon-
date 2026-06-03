'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { createContext, useCallback, useContext, useState, useEffect, ReactNode } from 'react';

interface WalletContextType {
  walletAddress: string | null;
  setWalletAddress: (address: string | null) => void;
  connectWallet: () => Promise<string | null>;
  isConnecting: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const STORAGE_KEY = 'dv-wallet-address';

export function WalletProvider({ children }: { children: ReactNode }) {
  // Start null on BOTH server and the first client render so hydration matches
  // (reading localStorage in the initializer makes the first client render
  // differ from the server HTML → React #418 hydration error). The stored
  // address is restored in the mount effect below.
  const [walletAddress, setWalletAddressState] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Wrap the setter so the persisted value always stays in sync.
  const setWalletAddress = useCallback((address: string | null) => {
    setWalletAddressState(address);
    if (typeof window !== 'undefined') {
      if (address) localStorage.setItem(STORAGE_KEY, address);
      else localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const checkWalletConnection = useCallback(async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = (await window.ethereum.request({ method: 'eth_accounts' })) as string[];
        // Reconcile the optimistic localStorage value with the wallet's truth.
        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setWalletAddress(null);
        }
      }
    } catch (error) {
      console.error('Failed to check wallet connection:', error);
    }
  }, [setWalletAddress]);

  // Check for existing wallet connection on mount + react to account changes.
  useEffect(() => {
    // Restore the optimistic last-known address (no flicker) — after mount, so
    // it never causes a hydration mismatch.
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setWalletAddressState(stored);
    void checkWalletConnection();
    const eth = window.ethereum;
    if (eth?.on) {
      const onAccounts = (...args: unknown[]) => {
        const accounts = args[0] as string[];
        setWalletAddress(accounts && accounts.length > 0 ? accounts[0] : null);
      };
      eth.on('accountsChanged', onAccounts);
      return () => eth.removeListener?.('accountsChanged', onAccounts);
    }
  }, [checkWalletConnection, setWalletAddress]);

  const connectWallet = async (): Promise<string | null> => {
    if (isConnecting) return null;

    setIsConnecting(true);

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setIsConnecting(false);
      alert('Connection timeout. Please check if MetaMask popup is blocked or try again.');
    }, 30000); // 30 second timeout

    try {
      if (typeof window.ethereum === 'undefined') {
        clearTimeout(timeout);
        setIsConnecting(false);
        alert('Please install MetaMask or another Web3 wallet');
        return null;
      }

      console.log('Requesting wallet connection...');
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      }) as string[];

      clearTimeout(timeout);

      if (accounts && accounts.length > 0) {
        console.log('Wallet connected:', accounts[0]);
        setWalletAddress(accounts[0]);
        return accounts[0];
      } else {
        console.error('No accounts returned');
        alert('No accounts found. Please unlock MetaMask.');
        return null;
      }
    } catch (error: unknown) {
      clearTimeout(timeout);
      console.error('Failed to connect wallet:', error);

      const walletError = error as { code?: number; message?: string };
      if (walletError.code === 4001) {
        alert('Connection rejected. Please approve the connection in MetaMask.');
      } else if (walletError.code === -32002) {
        alert('Connection request already pending. Please check MetaMask.');
      } else {
        alert(`Failed to connect wallet: ${walletError.message || 'Unknown error'}`);
      }
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <WalletContext.Provider value={{ walletAddress, setWalletAddress, connectWallet, isConnecting }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
