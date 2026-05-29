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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <nav className="border-b border-slate-200/50 bg-white/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-slate-900 font-bold text-lg tracking-tight">DealVault</span>
            </Link>
            {walletAddress && (
              <div className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-mono border border-slate-200">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-16 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
            <div>
              <h1 className="text-5xl font-bold text-slate-900 mb-2 tracking-tight">My Vaults</h1>
              <p className="text-slate-600">Manage your confidential documents</p>
            </div>
            <div className="flex gap-3">
              <Link 
                href="/deal-room"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 text-sm shadow-sm"
              >
                + Deal Room
              </Link>
              <Link 
                href="/dead-drop"
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-all duration-200 text-sm shadow-sm"
              >
                + Dead Drop
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="text-center text-slate-500 py-20">
              <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mb-4" />
              <p>Loading vaults...</p>
            </div>
          ) : vaults.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-200 shadow-sm">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-slate-600 text-lg mb-6">No vaults yet</p>
              <Link 
                href="/"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                Create your first vault
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {vaults.map((vault) => (
                <div 
                  key={vault.uuid}
                  className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <h3 className="text-2xl font-bold text-slate-900">{vault.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          vault.type === 'deal-room' 
                            ? 'bg-blue-100 text-blue-700 border-blue-200' 
                            : 'bg-purple-100 text-purple-700 border-purple-200'
                        }`}>
                          {vault.type === 'deal-room' ? 'Deal Room' : 'Dead Drop'}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          vault.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : vault.status === 'sealed'
                            ? 'bg-amber-100 text-amber-700 border-amber-200'
                            : 'bg-red-100 text-red-700 border-red-200'
                        }`}>
                          {vault.status}
                        </span>
                      </div>
                      
                      <div className="text-sm text-slate-600 space-y-2">
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
                      className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:cursor-not-allowed text-white disabled:text-slate-400 font-medium rounded-lg transition-all duration-200 text-sm shadow-sm"
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
