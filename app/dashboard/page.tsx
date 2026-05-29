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
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-gray-900">
              DealVault
            </Link>
            {walletAddress && (
              <div className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-mono">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Vaults</h1>
            <p className="text-gray-600">Manage your confidential documents</p>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/deal-room"
              className="px-5 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors text-sm"
            >
              + Deal Room
            </Link>
            <Link 
              href="/dead-drop"
              className="px-5 py-2.5 bg-white text-gray-900 font-medium rounded-lg border border-gray-300 hover:border-gray-400 transition-colors text-sm"
            >
              + Dead Drop
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-4" />
            <p className="text-gray-600">Loading vaults...</p>
          </div>
        ) : vaults.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-900 font-semibold text-lg mb-2">No vaults yet</p>
            <p className="text-gray-600 mb-6">Create your first vault to get started</p>
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Get Started
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
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all"
              >
                <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{vault.name}</h3>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                        vault.type === 'deal-room' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {vault.type === 'deal-room' ? 'Deal Room' : 'Dead Drop'}
                      </span>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                        vault.status === 'active' 
                          ? 'bg-green-100 text-green-700'
                          : vault.status === 'sealed'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {vault.status}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-2">
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
                    className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 font-medium rounded-lg transition-colors text-sm"
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
