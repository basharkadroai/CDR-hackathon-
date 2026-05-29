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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <span className="text-white font-bold text-xl">DealVault</span>
            </Link>
            {walletAddress && (
              <div className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">My Vaults</h1>
          <div className="flex gap-3">
            <Link 
              href="/deal-room"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              + Deal Room
            </Link>
            <Link 
              href="/dead-drop"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              + Dead Drop
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading vaults...</div>
        ) : vaults.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No vaults yet</p>
            <Link 
              href="/"
              className="text-purple-400 hover:text-purple-300"
            >
              Create your first vault →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {vaults.map((vault) => (
              <div 
                key={vault.uuid}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">{vault.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        vault.type === 'deal-room' 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {vault.type === 'deal-room' ? 'Deal Room' : 'Dead Drop'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        vault.status === 'active' 
                          ? 'bg-green-500/20 text-green-400'
                          : vault.status === 'sealed'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {vault.status}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>Created: {new Date(vault.createdAt).toLocaleDateString()}</p>
                      {vault.expiresAt && (
                        <p>Expires: {formatTimeRemaining(vault.expiresAt)}</p>
                      )}
                      {vault.unlockAt && (
                        <p>
                          {vault.unlockAt > Date.now() 
                            ? `Unlocks in: ${formatTimeRemaining(vault.unlockAt)}`
                            : 'Unlocked'
                          }
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleAccessVault(vault.uuid)}
                    disabled={vault.status === 'sealed' || vault.status === 'expired'}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    {vault.status === 'sealed' ? 'Sealed' : vault.status === 'expired' ? 'Expired' : 'Access'}
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
