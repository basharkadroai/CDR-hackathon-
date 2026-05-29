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
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-12">
              <span className="text-xl font-bold text-gray-900">DealVault</span>
              <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a>
                <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">How it works</a>
                {walletAddress && (
                  <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Dashboard</Link>
                )}
              </div>
            </div>
            <button
              onClick={handleConnect}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
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
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full mb-8">
              <span className="text-xs font-medium text-gray-700">Powered by Story Protocol CDR</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
              Private Documents.<br />
              Zero Trust Required.
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              On-chain confidential document vault with smart contract access control. 
              No servers. No middlemen. Just cryptographic guarantees.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/deal-room"
                className="px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Create Deal Room
              </Link>
              <Link 
                href="/dead-drop"
                className="px-6 py-3 bg-white text-gray-900 font-medium rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
              >
                Create Dead Drop
              </Link>
              {walletAddress && (
                <Link 
                  href="/dashboard"
                  className="px-6 py-3 bg-white text-gray-600 font-medium rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  View Dashboard →
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Two Modes</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2">Any document. Any access pattern.</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Deal Room */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-all">
              <div className="mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Deal Room</h3>
                <p className="text-gray-600 mb-6">
                  Time-limited document sharing for fundraising, M&A, and due diligence. 
                  Set authorized wallets and expiry windows enforced on-chain.
                </p>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">Wallet-based access control</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">Automatic expiry on-chain</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">Multi-file batch upload</span>
                </div>
              </div>

              <Link 
                href="/deal-room"
                className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:gap-3 transition-all"
              >
                Create Deal Room
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            {/* Dead Drop */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-all">
              <div className="mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Dead Drop</h3>
                <p className="text-gray-600 mb-6">
                  Sealed documents that unlock automatically on a future date. 
                  Perfect for wills, succession plans, and time-locked releases.
                </p>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">Future date unlock trigger</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">Recipient wallet lock</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">Irreversible — no backdoor</span>
                </div>
              </div>

              <Link 
                href="/dead-drop"
                className="inline-flex items-center gap-2 text-purple-600 font-semibold hover:gap-3 transition-all"
              >
                Create Dead Drop
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">How it works</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2">Three simple steps</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <div className="w-10 h-10 bg-gray-900 text-white rounded-lg flex items-center justify-center font-bold mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Upload & Encrypt</h3>
              <p className="text-gray-600">
                Your document is encrypted client-side and stored in a CDR vault on Story Protocol.
              </p>
            </div>

            <div>
              <div className="w-10 h-10 bg-gray-900 text-white rounded-lg flex items-center justify-center font-bold mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Set Conditions</h3>
              <p className="text-gray-600">
                Define access rules: wallet addresses, time windows, or future unlock dates.
              </p>
            </div>

            <div>
              <div className="w-10 h-10 bg-gray-900 text-white rounded-lg flex items-center justify-center font-bold mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Contract Enforces</h3>
              <p className="text-gray-600">
                On-chain conditions control access. No company. No server. Just code.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to secure your documents?
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            Start using DealVault today. No credit card required.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/deal-room"
              className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Get Started
            </Link>
            <button
              onClick={handleConnect}
              className="px-8 py-4 bg-gray-800 text-white font-semibold rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors"
            >
              {walletAddress ? 'Wallet Connected' : 'Connect Wallet'}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              © 2026 DealVault. Built for the CDR Hackathon.
            </div>
            <div className="text-sm text-gray-600">
              Powered by Story Protocol
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
