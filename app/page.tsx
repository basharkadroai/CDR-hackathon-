'use client';

import Link from 'next/link';
import { Vault } from 'lucide-react';
import { useWallet } from './context/WalletContext';

export default function Home() {
  const { walletAddress, connectWallet, isConnecting } = useWallet();

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Navigation */}
      <nav className="border-b border-[#2d2d2d] bg-[#1a1a1a]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Vault className="w-6 h-6 text-[#4F9BBE]" />
              <span className="text-lg font-medium text-[#e8e8e8]">DealVault</span>
            </Link>
            <div className="flex items-center gap-4">
              {walletAddress && (
                <Link href="/dashboard" className="text-sm text-[#9b9b9b] hover:text-[#e8e8e8] transition-colors">
                  Dashboard
                </Link>
              )}
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="px-4 py-2 bg-[#4F9BBE] text-white text-sm font-medium rounded-lg hover:bg-[#3d8aad] transition-colors disabled:opacity-50"
              >
                {walletAddress 
                  ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                  : isConnecting ? 'Connecting...' : 'Connect Wallet'
                }
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-medium text-[#e8e8e8] mb-8 leading-tight tracking-tight">
            Private Documents.<br />
            Zero Trust Required.
          </h1>
          <p className="text-xl text-[#9b9b9b] mb-12 leading-relaxed max-w-2xl mx-auto">
            On-chain confidential document vault with smart contract access control. 
            No servers. No middlemen. Just cryptographic guarantees.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/deal-room"
              className="px-6 py-3 bg-[#4F9BBE] text-white font-medium rounded-lg hover:bg-[#3d8aad] transition-colors"
            >
              Create Deal Room
            </Link>
            <Link 
              href="/dead-drop"
              className="px-6 py-3 bg-[#212121] border border-[#2d2d2d] text-[#e8e8e8] font-medium rounded-lg hover:bg-[#2a2a2a] transition-colors"
            >
              Create Dead Drop
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Deal Room */}
            <Link href="/deal-room">
              <div className="bg-[#212121] rounded-2xl p-8 hover:bg-[#252525] transition-all border border-[#2d2d2d]">
                <div className="mb-6">
                  <div className="w-12 h-12 bg-[#2d2d2d] rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-[#4F9BBE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-medium text-[#e8e8e8] mb-3">Deal Room</h3>
                  <p className="text-[#9b9b9b] mb-6 leading-relaxed">
                    Time-limited document sharing for fundraising, M&A, and due diligence. 
                    Set authorized wallets and expiry windows enforced on-chain.
                  </p>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-[#9b9b9b]">
                    <div className="w-1.5 h-1.5 bg-[#4F9BBE] rounded-full" />
                    <span>Wallet-based access control</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#9b9b9b]">
                    <div className="w-1.5 h-1.5 bg-[#4F9BBE] rounded-full" />
                    <span>Automatic expiry on-chain</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#9b9b9b]">
                    <div className="w-1.5 h-1.5 bg-[#4F9BBE] rounded-full" />
                    <span>Multi-file batch upload</span>
                  </div>
                </div>

                <div className="text-[#4F9BBE] font-medium">
                  Create Deal Room →
                </div>
              </div>
            </Link>

            {/* Dead Drop */}
            <Link href="/dead-drop">
              <div className="bg-[#212121] rounded-2xl p-8 hover:bg-[#252525] transition-all border border-[#2d2d2d]">
                <div className="mb-6">
                  <div className="w-12 h-12 bg-[#2d2d2d] rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-[#4F9BBE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-medium text-[#e8e8e8] mb-3">Dead Drop</h3>
                  <p className="text-[#9b9b9b] mb-6 leading-relaxed">
                    Sealed documents that unlock automatically on a future date. 
                    Perfect for wills, succession plans, and time-locked releases.
                  </p>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-[#9b9b9b]">
                    <div className="w-1.5 h-1.5 bg-[#4F9BBE] rounded-full" />
                    <span>Future date unlock trigger</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#9b9b9b]">
                    <div className="w-1.5 h-1.5 bg-[#4F9BBE] rounded-full" />
                    <span>Recipient wallet lock</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#9b9b9b]">
                    <div className="w-1.5 h-1.5 bg-[#4F9BBE] rounded-full" />
                    <span>Irreversible — no backdoor</span>
                  </div>
                </div>

                <div className="text-[#4F9BBE] font-medium">
                  Create Dead Drop →
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-[#0f0f0f]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-medium text-[#e8e8e8] mb-12 text-center">How it works</h2>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#2d2d2d] text-[#4F9BBE] rounded-xl flex items-center justify-center font-medium mb-4 mx-auto">
                1
              </div>
              <h3 className="text-lg font-medium text-[#e8e8e8] mb-2">Upload & Encrypt</h3>
              <p className="text-[#9b9b9b] text-sm leading-relaxed">
                Your document is encrypted client-side and stored in a CDR vault on Story Protocol.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-[#2d2d2d] text-[#4F9BBE] rounded-xl flex items-center justify-center font-medium mb-4 mx-auto">
                2
              </div>
              <h3 className="text-lg font-medium text-[#e8e8e8] mb-2">Set Conditions</h3>
              <p className="text-[#9b9b9b] text-sm leading-relaxed">
                Define access rules: wallet addresses, time windows, or future unlock dates.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-[#2d2d2d] text-[#4F9BBE] rounded-xl flex items-center justify-center font-medium mb-4 mx-auto">
                3
              </div>
              <h3 className="text-lg font-medium text-[#e8e8e8] mb-2">Smart Contract Enforces</h3>
              <p className="text-[#9b9b9b] text-sm leading-relaxed">
                On-chain conditions control access. No company. No server. Just code.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2d2d2d] py-8 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm text-[#9b9b9b]">
            Built for the CDR Hackathon · Powered by Story Protocol
          </p>
        </div>
      </footer>
    </div>
  );
}
