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
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-zinc-800 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span className="text-white font-semibold text-xl tracking-tight">DealVault</span>
            </div>
            <button
              onClick={handleConnect}
              className="px-5 py-2.5 bg-white text-black font-medium rounded-xl hover:bg-zinc-100 transition-all duration-200 shadow-lg shadow-white/10"
            >
              {walletAddress 
                ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                : 'Connect Wallet'
              }
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block mb-6 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full">
              <span className="text-violet-400 text-sm font-medium">Powered by Story Protocol CDR</span>
            </div>
            <h1 className="text-7xl font-bold text-white mb-6 tracking-tight">
              Private Documents.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400">
                Zero Trust Required.
              </span>
            </h1>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
              On-chain confidential document vault with smart contract access control.
              No servers. No middlemen. Just cryptographic guarantees.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto mb-16">
            <Link href="/deal-room">
              <div className="group relative bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-3xl p-8 hover:border-blue-500/50 transition-all duration-300 cursor-pointer overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors duration-300">
                    <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-4">Deal Room</h2>
                  <p className="text-zinc-400 mb-6 leading-relaxed">
                    Time-limited document sharing for fundraising, M&A, and due diligence.
                    Wallet-based access control with automatic expiry enforced on-chain.
                  </p>
                  <div className="flex items-center text-blue-400 font-medium group-hover:text-blue-300 transition-colors">
                    <span>Create Deal Room</span>
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/dead-drop">
              <div className="group relative bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-3xl p-8 hover:border-violet-500/50 transition-all duration-300 cursor-pointer overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-14 h-14 bg-violet-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-violet-500/20 transition-colors duration-300">
                    <svg className="w-7 h-7 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-4">Dead Drop</h2>
                  <p className="text-zinc-400 mb-6 leading-relaxed">
                    Sealed documents that unlock automatically on a future date.
                    Perfect for wills, succession plans, and time-locked releases.
                  </p>
                  <div className="flex items-center text-violet-400 font-medium group-hover:text-violet-300 transition-colors">
                    <span>Create Dead Drop</span>
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Dashboard Link */}
          {walletAddress && (
            <div className="text-center">
              <Link 
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition-all duration-200 border border-zinc-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                View My Vaults
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
