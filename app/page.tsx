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
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-xl tracking-tight">DealVault</span>
            </div>
            <button
              onClick={handleConnect}
              className="px-5 py-2 bg-white text-black font-medium rounded-full hover:bg-white/90 transition-all duration-200 text-sm"
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
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-32">
            <div className="inline-block mb-6 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
              <span className="text-white/60 text-sm font-medium">Presented by Story Protocol</span>
            </div>
            <h1 className="text-7xl md:text-8xl font-bold text-white mb-8 tracking-tight leading-none">
              Private Documents.<br />
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-fuchsia-400 text-transparent bg-clip-text">
                Zero Trust Required.
              </span>
            </h1>
            <p className="text-xl text-white/50 max-w-3xl mx-auto leading-relaxed mb-12">
              On-chain confidential document vault. Access controlled by smart contracts.
              No servers. No middlemen. Just cryptographic guarantees.
            </p>
            {walletAddress && (
              <Link 
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all duration-200 border border-white/10 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                View My Vaults
              </Link>
            )}
          </div>

          {/* Section 01 - Deal Room */}
          <div className="mb-32">
            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-white/30 text-sm font-mono">01</span>
              <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
            </div>
            
            <Link href="/deal-room">
              <div className="group relative bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 rounded-3xl p-12 hover:border-blue-500/30 transition-all duration-500 cursor-pointer overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-transparent transition-all duration-500" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <div className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4">
                        <span className="text-blue-400 text-xs font-medium">Deal Room</span>
                      </div>
                      <h2 className="text-5xl font-bold text-white mb-4 tracking-tight">
                        Time-Limited<br />Document Sharing
                      </h2>
                    </div>
                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:bg-blue-500/20 transition-all duration-500">
                      <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                  </div>
                  
                  <p className="text-white/50 text-lg mb-8 max-w-2xl leading-relaxed">
                    For fundraising, M&A, and due diligence. Set authorized wallet addresses and expiry windows.
                    Access automatically revokes on-chain when the window closes.
                  </p>

                  <div className="grid grid-cols-3 gap-6 mb-8">
                    <div>
                      <div className="text-white/40 text-sm mb-1">Wallet Allowlist</div>
                      <div className="text-white font-medium">On-chain enforcement</div>
                    </div>
                    <div>
                      <div className="text-white/40 text-sm mb-1">Time Windows</div>
                      <div className="text-white font-medium">Auto-expiry</div>
                    </div>
                    <div>
                      <div className="text-white/40 text-sm mb-1">Multi-file</div>
                      <div className="text-white font-medium">Batch upload</div>
                    </div>
                  </div>

                  <div className="flex items-center text-blue-400 font-medium group-hover:text-blue-300 transition-colors">
                    <span>Create Deal Room</span>
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Section 02 - Dead Drop */}
          <div className="mb-32">
            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-white/30 text-sm font-mono">02</span>
              <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
            </div>
            
            <Link href="/dead-drop">
              <div className="group relative bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 rounded-3xl p-12 hover:border-violet-500/30 transition-all duration-500 cursor-pointer overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-violet-500/0 group-hover:from-violet-500/5 group-hover:to-transparent transition-all duration-500" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <div className="inline-block px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full mb-4">
                        <span className="text-violet-400 text-xs font-medium">Dead Drop</span>
                      </div>
                      <h2 className="text-5xl font-bold text-white mb-4 tracking-tight">
                        Sealed Documents<br />That Unlock Automatically
                      </h2>
                    </div>
                    <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center group-hover:bg-violet-500/20 transition-all duration-500">
                      <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                  
                  <p className="text-white/50 text-lg mb-8 max-w-2xl leading-relaxed">
                    Upload a document that nobody can open—including you—until a specific date.
                    Perfect for wills, succession plans, and time-locked releases.
                  </p>

                  <div className="grid grid-cols-3 gap-6 mb-8">
                    <div>
                      <div className="text-white/40 text-sm mb-1">Future Unlock</div>
                      <div className="text-white font-medium">Date-based trigger</div>
                    </div>
                    <div>
                      <div className="text-white/40 text-sm mb-1">Recipient Lock</div>
                      <div className="text-white font-medium">Single wallet</div>
                    </div>
                    <div>
                      <div className="text-white/40 text-sm mb-1">Irreversible</div>
                      <div className="text-white font-medium">No backdoor</div>
                    </div>
                  </div>

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

          {/* Section 03 - How it works */}
          <div>
            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-white/30 text-sm font-mono">03</span>
              <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
            </div>
            
            <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 rounded-3xl p-12">
              <h2 className="text-4xl font-bold text-white mb-12 tracking-tight">How It Works</h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div>
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 border border-white/10">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <h3 className="text-white font-semibold mb-2">Upload & Encrypt</h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    Your document is encrypted client-side and stored in a CDR vault on Story Protocol.
                  </p>
                </div>
                
                <div>
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 border border-white/10">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <h3 className="text-white font-semibold mb-2">Set Conditions</h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    Define access rules: wallet addresses, time windows, or future unlock dates.
                  </p>
                </div>
                
                <div>
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 border border-white/10">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <h3 className="text-white font-semibold mb-2">Smart Contract Enforces</h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    On-chain conditions control access. No company. No server. Just code.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-white/30 text-sm">
            Built for the CDR Hackathon · Powered by Story Protocol
          </p>
        </div>
      </footer>
    </div>
  );
}
