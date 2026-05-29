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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Navigation */}
      <nav className="border-b border-slate-200/50 bg-white/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <span className="text-slate-900 font-bold text-lg tracking-tight">DealVault</span>
              <div className="hidden md:flex items-center gap-6 text-sm">
                <Link href="#how-it-works" className="text-slate-600 hover:text-slate-900 transition-colors">How it works</Link>
                {walletAddress && (
                  <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 transition-colors">Dashboard</Link>
                )}
              </div>
            </div>
            <button
              onClick={handleConnect}
              className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-all duration-200 text-sm"
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
      <main className="pt-20 pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-24">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 border border-slate-200 rounded-full mb-8 shadow-sm">
              <span className="text-slate-600 text-sm">Presented by</span>
              <span className="font-bold text-slate-900 text-sm">STORY</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
              Build with private data{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                without giving up composability.
              </span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-12">
              DealVault is a focused application for confidential document sharing where private data becomes 
              a programmable, composable on-chain object. Powered by Story's Confidential Data Rails.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-24 max-w-5xl mx-auto">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
              <div className="text-xs text-red-600 font-medium mb-1 uppercase tracking-wide">Tracks</div>
              <div className="text-3xl font-bold text-red-900">2</div>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6">
              <div className="text-xs text-orange-600 font-medium mb-1 uppercase tracking-wide">Prizes</div>
              <div className="text-3xl font-bold text-orange-900">3 × $1k</div>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-2xl p-6">
              <div className="text-xs text-green-600 font-medium mb-1 uppercase tracking-wide">Modes</div>
              <div className="text-3xl font-bold text-green-900">2 types</div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
              <div className="text-xs text-blue-600 font-medium mb-1 uppercase tracking-wide">Network</div>
              <div className="text-3xl font-bold text-blue-900">Story Testnet</div>
            </div>
          </div>

          {/* Main Cards - Side by Side */}
          <div className="mb-24">
            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-slate-400 text-sm font-mono">01</span>
              <h2 className="text-3xl font-bold text-slate-900">What you can build</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Deal Room Card */}
              <Link href="/deal-room">
                <div className="group bg-white border border-slate-200 rounded-3xl p-8 hover:shadow-xl hover:border-blue-300 transition-all duration-300 cursor-pointer h-full">
                  <div className="mb-6">
                    <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-4">
                      Idea 01
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">Deal Room</h3>
                    <p className="text-slate-600 leading-relaxed mb-6">
                      Time-limited document sharing for fundraising, M&A, and due diligence. 
                      Set wallet addresses and expiry windows enforced on-chain.
                    </p>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm text-slate-600">Wallet-based access control</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm text-slate-600">Automatic expiry on-chain</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm text-slate-600">Multi-file batch upload</span>
                    </div>
                  </div>

                  <div className="flex items-center text-blue-600 font-semibold group-hover:gap-3 gap-2 transition-all">
                    <span>Create Deal Room</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </Link>

              {/* Dead Drop Card */}
              <Link href="/dead-drop">
                <div className="group bg-white border border-slate-200 rounded-3xl p-8 hover:shadow-xl hover:border-purple-300 transition-all duration-300 cursor-pointer h-full">
                  <div className="mb-6">
                    <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold mb-4">
                      Idea 02
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">Dead Drop</h3>
                    <p className="text-slate-600 leading-relaxed mb-6">
                      Sealed documents that unlock automatically on a future date. 
                      Perfect for wills, succession plans, and time-locked releases.
                    </p>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm text-slate-600">Future date unlock trigger</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm text-slate-600">Recipient wallet lock</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm text-slate-600">Irreversible — no backdoor</span>
                    </div>
                  </div>

                  <div className="flex items-center text-purple-600 font-semibold group-hover:gap-3 gap-2 transition-all">
                    <span>Create Dead Drop</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* How it works */}
          <div id="how-it-works">
            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-slate-400 text-sm font-mono">02</span>
              <h2 className="text-3xl font-bold text-slate-900">How it works</h2>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-3xl p-12">
              <div className="grid md:grid-cols-3 gap-12">
                <div>
                  <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center mb-4 font-bold text-lg">
                    1
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Upload & Encrypt</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Your document is encrypted client-side and stored in a CDR vault on Story Protocol.
                  </p>
                </div>
                
                <div>
                  <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center mb-4 font-bold text-lg">
                    2
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Set Conditions</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Define access rules: wallet addresses, time windows, or future unlock dates.
                  </p>
                </div>
                
                <div>
                  <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center mb-4 font-bold text-lg">
                    3
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Smart Contract Enforces</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    On-chain conditions control access. No company. No server. Just code.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 bg-white/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-500 text-sm">
            Built for the CDR Hackathon · Powered by Story Protocol
          </p>
        </div>
      </footer>
    </div>
  );
}
