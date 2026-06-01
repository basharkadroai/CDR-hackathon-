'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { createContext, useCallback, useContext, useState, useEffect, ReactNode } from 'react';

interface WalletContextType {
  walletAddress: string | null;
  setWalletAddress: (address: string | null) => void;
  connectWallet: () => Promise<void>;
  isConnecting: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const checkWalletConnection = useCallback(async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        }) as string[];

        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      }
    } catch (error) {
      console.error('Failed to check wallet connection:', error);
    }
  }, []);

  // Check for existing wallet connection on mount
  useEffect(() => {
    void checkWalletConnection();
  }, [checkWalletConnection]);

  const connectWallet = async () => {
    if (isConnecting) return;
    
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
        return;
      }

      console.log('Requesting wallet connection...');
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      }) as string[];

      clearTimeout(timeout);
      
      if (accounts && accounts.length > 0) {
        console.log('Wallet connected:', accounts[0]);
        setWalletAddress(accounts[0]);
      } else {
        console.error('No accounts returned');
        alert('No accounts found. Please unlock MetaMask.');
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
