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
    <div className="min-h-screen bg-black">
      <nav className="fixed top-0 w-full z-50 border-b border-zinc-800 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span className="text-white font-semibold text-xl tracking-tight">DealVault</span>
            </Link>
            {walletAddress && (
              <div className="px-4 py-2 bg-zinc-900 text-zinc-300 rounded-xl text-sm font-mono border border-zinc-800">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
            <div>
              <h1 className="text-5xl font-bold text-white mb-2">My Vaults</h1>
              <p className="text-zinc-400">Manage your confidential documents</p>
            </div>
            <div className="flex gap-3">
              <Link 
                href="/deal-room"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20"
              >
                + Deal Room
              </Link>
              <Link 
                href="/dead-drop"
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-violet-600/20"
              >
                + Dead Drop
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="text-center text-zinc-400 py-20">
              <div className="inline-block w-8 h-8 border-4 border-zinc-700 border-t-violet-500 rounded-full animate-spin mb-4" />
              <p>Loading vaults...</p>
            </div>
          ) : vaults.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-zinc-800">
                <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-zinc-400 text-lg mb-6">No vaults yet</p>
              <Link 
                href="/"
                className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 font-medium"
              >
                Create your first vault
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {vaults.map((vault) => (
                <div 
                  key={vault.uuid}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h3 className="text-xl font-semibold text-white">{vault.name}</h3>
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                          vault.type === 'deal-room' 
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                            : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                        }`}>
                          {vault.type === 'deal-room' ? 'Deal Room' : 'Dead Drop'}
                        </span>
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                          vault.status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : vault.status === 'sealed'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {vault.status}
                        </span>
                      </div>
                      
                      <div className="text-sm text-zinc-400 space-y-1.5">
                        <p className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Created {new Date(vault.createdAt).toLocaleDateString()}
                        </p>
                        {vault.expiresAt && (
                          <p className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Expires in {formatTimeRemaining(vault.expiresAt)}
                          </p>
                        )}
                        {vault.unlockAt && (
                          <p className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
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
                      className="px-6 py-2.5 bg-white hover:bg-zinc-100 disabled:bg-zinc-800 disabled:cursor-not-allowed text-black disabled:text-zinc-600 font-medium rounded-xl transition-all duration-200 shadow-lg shadow-white/10 disabled:shadow-none"
                    >
                      {vault.status === 'sealed' ? 'Sealed' : vault.status === 'expired' ? 'Expired' : 'Access'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
