'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask or another Web3 wallet');
        return;
      }

      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      }) as string[];

      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <span className="text-white font-bold text-xl">DealVault</span>
            </div>
            <button
              onClick={handleConnect}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              {walletAddress 
                ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                : 'Connect Wallet'
              }
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-6">
            Private Documents.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Zero Trust Required.
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            On-chain confidential document vault. Two modes. No trusted middleman.
            Access controlled by smart contracts on Story Protocol.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <Link href="/deal-room">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition-colors">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Deal Room</h2>
              <p className="text-gray-400 mb-4">
                Time-limited document sharing for fundraising, M&A, and due diligence.
                Set wallet addresses and expiry windows enforced on-chain.
              </p>
              <div className="text-blue-400 font-medium group-hover:text-blue-300">
                Create Deal Room →
              </div>
            </div>
          </Link>

          <Link href="/dead-drop">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition-colors">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Dead Drop</h2>
              <p className="text-gray-400 mb-4">
                Sealed documents that unlock automatically on a future date.
                Perfect for wills, succession plans, and time-locked releases.
              </p>
              <div className="text-purple-400 font-medium group-hover:text-purple-300">
                Create Dead Drop →
              </div>
            </div>
          </Link>
        </div>

        {walletAddress && (
          <div className="text-center mt-12">
            <Link 
              href="/dashboard"
              className="inline-block px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
            >
              View My Vaults
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
