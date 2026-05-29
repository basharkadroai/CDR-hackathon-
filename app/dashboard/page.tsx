'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cdrService, VaultMetadata } from '@/lib/cdr-service';

export default function Dashboard() {
  const [vaults, setVaults] = useState<VaultMetadata[]>([]);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVaults();
  }, []);

  const loadVaults = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        }) as string[];
        
        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0]);
          const userVaults = await cdrService.listUserVaults(accounts[0]);
          setVaults(userVaults);
        }
      }
    } catch (error) {
      console.error('Failed to load vaults:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (timestamp: number) => {
    const now = Date.now();
    const diff = timestamp - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const handleAccessVault = async (uuid: string) => {
    try {
      const blob = await cdrService.accessVault(uuid);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to access vault:', error);
      alert('Failed to access vault');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3ef]">
      <nav className="border-b border-[#e8e3db] bg-[#f5f3ef]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-lg font-medium text-[#2d2d2d]">
              DealVault
            </Link>
            {walletAddress && (
              <div className="px-3 py-1.5 bg-[#e8e3db] text-[#2d2d2d] rounded-lg text-sm font-mono">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-medium text-[#2d2d2d] mb-2">My Vaults</h1>
            <p className="text-[#6b6b6b]">Manage your confidential documents</p>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/deal-room"
              className="px-5 py-2.5 bg-[#2d2d2d] text-[#f5f3ef] font-medium rounded-lg hover:bg-[#1a1a1a] transition-colors text-sm"
            >
              + Deal Room
            </Link>
            <Link 
              href="/dead-drop"
              className="px-5 py-2.5 bg-[#e8e3db] text-[#2d2d2d] font-medium rounded-lg hover:bg-[#ddd8d0] transition-colors text-sm"
            >
              + Dead Drop
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-[#e8e3db] border-t-[#2d2d2d] rounded-full animate-spin mb-4" />
            <p className="text-[#6b6b6b]">Loading vaults...</p>
          </div>
        ) : vaults.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-[#e8e3db] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-[#6b6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-[#2d2d2d] font-medium text-lg mb-2">No vaults yet</p>
            <p className="text-[#6b6b6b] mb-6">Create your first vault to get started</p>
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#2d2d2d] text-[#f5f3ef] font-medium rounded-lg hover:bg-[#1a1a1a] transition-colors"
            >
              Get Started
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {vaults.map((vault) => (
              <div 
                key={vault.uuid}
                className="bg-white rounded-2xl border border-[#e8e3db] p-6 hover:shadow-md transition-all"
              >
                <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <h3 className="text-xl font-medium text-[#2d2d2d]">{vault.name}</h3>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        vault.type === 'deal-room' 
                          ? 'bg-[#e8e3db] text-[#2d2d2d]' 
                          : 'bg-[#e8e3db] text-[#2d2d2d]'
                      }`}>
                        {vault.type === 'deal-room' ? 'Deal Room' : 'Dead Drop'}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        vault.status === 'active' 
                          ? 'bg-[#d4f4dd] text-[#1a5d1a]'
                          : vault.status === 'sealed'
                          ? 'bg-[#fff4e6] text-[#8b5a00]'
                          : 'bg-[#ffe6e6] text-[#8b0000]'
                      }`}>
                        {vault.status}
                      </span>
                    </div>
                    
                    <div className="text-sm text-[#6b6b6b] space-y-2">
                      <p>Created {new Date(vault.createdAt).toLocaleDateString()}</p>
                      {vault.expiresAt && (
                        <p>Expires in {formatTimeRemaining(vault.expiresAt)}</p>
                      )}
                      {vault.unlockAt && (
                        <p>
                          {vault.unlockAt > Date.now() 
                            ? `Unlocks in ${formatTimeRemaining(vault.unlockAt)}`
                            : 'Unlocked'
                          }
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleAccessVault(vault.uuid)}
                    disabled={vault.status === 'sealed' || vault.status === 'expired'}
                    className="px-6 py-2.5 bg-[#2d2d2d] hover:bg-[#1a1a1a] disabled:bg-[#e8e3db] disabled:cursor-not-allowed text-[#f5f3ef] disabled:text-[#6b6b6b] font-medium rounded-lg transition-colors text-sm"
                  >
                    {vault.status === 'sealed' ? 'Sealed' : vault.status === 'expired' ? 'Expired' : 'Access Vault'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
