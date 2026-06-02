'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { cdrService, DEALVAULT_VAULTS_CHANGED_EVENT, VaultMetadata } from '@/lib/cdr-service';
import { useWallet } from './WalletContext';

interface RefreshOptions {
  showSpinner?: boolean;
}

interface VaultsContextType {
  vaults: VaultMetadata[];
  loadingVaults: boolean;
  refreshVaults: (options?: RefreshOptions) => Promise<void>;
}

const VaultsContext = createContext<VaultsContextType | undefined>(undefined);

export function VaultsProvider({ children }: { children: ReactNode }) {
  const { walletAddress } = useWallet();
  const [vaults, setVaults] = useState<VaultMetadata[]>([]);
  const [vaultsWallet, setVaultsWallet] = useState<string | null>(null);
  const [loadingVaults, setLoadingVaults] = useState(false);
  const requestIdRef = useRef(0);
  const vaultsRef = useRef<VaultMetadata[]>([]);

  useEffect(() => {
    vaultsRef.current = vaults;
  }, [vaults]);

  const refreshVaults = useCallback(async (options?: RefreshOptions) => {
    const address = walletAddress;
    const requestId = ++requestIdRef.current;

    if (!address) {
      setVaults([]);
      setVaultsWallet(null);
      setLoadingVaults(false);
      return;
    }

    if (options?.showSpinner ?? vaultsRef.current.length === 0) {
      setLoadingVaults(true);
    }

    try {
      const nextVaults = await cdrService.listUserVaults(address);
      if (requestIdRef.current !== requestId) return;
      setVaults(nextVaults);
      setVaultsWallet(address);
    } catch {
      /* keep the current cached list visible */
    } finally {
      if (requestIdRef.current === requestId) setLoadingVaults(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (!walletAddress) {
      requestIdRef.current += 1;
      setVaults([]);
      setVaultsWallet(null);
      setLoadingVaults(false);
      return;
    }

    const cachedVaults = cdrService.getCachedUserVaults(walletAddress);
    setVaults(cachedVaults);
    setVaultsWallet(walletAddress);
    void refreshVaults({ showSpinner: cachedVaults.length === 0 });
  }, [walletAddress, refreshVaults]);

  useEffect(() => {
    const onVaultsChanged = () => {
      void refreshVaults({ showSpinner: false });
    };
    window.addEventListener(DEALVAULT_VAULTS_CHANGED_EVENT, onVaultsChanged);
    return () => window.removeEventListener(DEALVAULT_VAULTS_CHANGED_EVENT, onVaultsChanged);
  }, [refreshVaults]);

  const value = useMemo(
    () => ({
      vaults: walletAddress && walletAddress === vaultsWallet ? vaults : [],
      loadingVaults,
      refreshVaults,
    }),
    [walletAddress, vaultsWallet, vaults, loadingVaults, refreshVaults],
  );

  return <VaultsContext.Provider value={value}>{children}</VaultsContext.Provider>;
}

export function useVaults() {
  const context = useContext(VaultsContext);
  if (context === undefined) {
    throw new Error('useVaults must be used within a VaultsProvider');
  }
  return context;
}
