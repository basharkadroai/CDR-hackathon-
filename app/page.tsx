'use client';

import Link from 'next/link';
import { Vault, Shield, Zap, Check, ArrowRight, FileText, Lock } from 'lucide-react';
import { useWallet } from './context/WalletContext';

export default function Home() {
  const { walletAddress, connectWallet, isConnecting } = useWallet();

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Navigation */}
      <nav className="border-b border-[#2d2d2d] bg-[#1a1a1a]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Vault className="w-6 h-6 text-[#4F9BBE]" />
              <span className="text-lg font-semibold text-[#e8e8e8]">DealVault</span>
            </Link>
            <div className="flex items-center gap-6">
              {walletAddress && (
                <Link href="/dashboard" className="text-sm text-[#9b9b9b] hover:text-[#e8e8e8] transition-colors font-medium">
                  Dashboard
                </Link>
              )}
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="px-4 py-2 bg-[#4F9BBE] text-white text-sm font-medium rounded-lg hover:bg-[#3d8aad] transition-all hover:scale-105 disabled:opacity-50"
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
      <section className="relative pt-20 pb-32 px-6 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#4F9BBE]/5 to-transparent pointer-events-none" />
        
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#4F9BBE]/10 border border-[#4F9BBE]/20 rounded-full mb-8">
              <Zap className="w-4 h-4 text-[#4F9BBE]" />
              <span className="text-sm font-medium text-[#4F9BBE]">Powered by Story Protocol CDR</span>
            </div>

            {/* Main headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-[#e8e8e8] mb-6 leading-tight tracking-tight">
              Private Documents.<br />
              <span className="text-[#4F9BBE]">Zero Trust Required.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-[#9b9b9b] mb-12 leading-relaxed max-w-3xl mx-auto">
              On-chain confidential document vault for M&A, fundraising, and succession planning. 
              <span className="text-[#e8e8e8]"> No servers. No middlemen.</span> Just cryptographic guarantees.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <Link 
                href="/deal-room"
                className="group px-8 py-4 bg-[#4F9BBE] text-white font-semibold rounded-xl hover:bg-[#3d8aad] transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                Create Deal Room
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/dead-drop"
                className="px-8 py-4 bg-[#212121] border-2 border-[#2d2d2d] text-[#e8e8e8] font-semibold rounded-xl hover:bg-[#2a2a2a] hover:border-[#4F9BBE]/30 transition-all flex items-center justify-center gap-2"
              >
                <Lock className="w-5 h-5" />
                Create Dead Drop
              </Link>
            </div>

            {/* Social Proof */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-[#6b6b6b]">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#4F9BBE]" />
                <span>Threshold Encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#4F9BBE]" />
                <span>On-Chain Access Control</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#4F9BBE]" />
                <span>No Trusted Middleman</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-6 bg-[#0f0f0f]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#e8e8e8] mb-4">
              The $4B Problem
            </h2>
            <p className="text-lg text-[#9b9b9b] max-w-2xl mx-auto">
              Traditional document sharing for sensitive deals is broken
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-8">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">💸</span>
              </div>
              <h3 className="text-xl font-semibold text-[#e8e8e8] mb-3">Expensive</h3>
              <p className="text-[#9b9b9b] leading-relaxed">
                VDRs cost <span className="text-[#e8e8e8] font-semibold">$99-$25,000/month</span>. 
                Datasite, iDeals, Firmex — all require massive fees.
              </p>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-8">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🏢</span>
              </div>
              <h3 className="text-xl font-semibold text-[#e8e8e8] mb-3">Centralized</h3>
              <p className="text-[#9b9b9b] leading-relaxed">
                All data sits on <span className="text-[#e8e8e8] font-semibold">someone&apos;s server</span>. 
                Single point of failure. You have to trust the company.
              </p>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-8">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-xl font-semibold text-[#e8e8e8] mb-3">Trust Required</h3>
              <p className="text-[#9b9b9b] leading-relaxed">
                <span className="text-[#e8e8e8] font-semibold">No cryptographic guarantees</span>. 
                Just promises. Customer support can override anything.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#e8e8e8] mb-4">
              Two Modes. One Vault.
            </h2>
            <p className="text-lg text-[#9b9b9b] max-w-2xl mx-auto">
              Built for the moments that matter most
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Deal Room */}
            <Link href="/deal-room" className="group">
              <div className="bg-[#212121] rounded-3xl p-10 hover:bg-[#252525] transition-all border border-[#2d2d2d] hover:border-[#4F9BBE]/30 h-full">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-[#4F9BBE]/20 rounded-2xl flex items-center justify-center">
                    <FileText className="w-7 h-7 text-[#4F9BBE]" />
                  </div>
                  <ArrowRight className="w-6 h-6 text-[#4F9BBE] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>

                <h3 className="text-2xl font-bold text-[#e8e8e8] mb-4">Deal Room</h3>
                <p className="text-[#9b9b9b] mb-6 leading-relaxed text-lg">
                  Time-limited document sharing for M&A, fundraising, and due diligence. 
                  Set authorized wallets and expiry windows enforced on-chain.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-[#9b9b9b]">
                    <Check className="w-5 h-5 text-[#4F9BBE] flex-shrink-0" />
                    <span>Wallet-based access control</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#9b9b9b]">
                    <Check className="w-5 h-5 text-[#4F9BBE] flex-shrink-0" />
                    <span>Automatic expiry (24h - 90 days)</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#9b9b9b]">
                    <Check className="w-5 h-5 text-[#4F9BBE] flex-shrink-0" />
                    <span>Multi-file batch upload</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#9b9b9b]">
                    <Check className="w-5 h-5 text-[#4F9BBE] flex-shrink-0" />
                    <span>Immutable audit trail</span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-[#2d2d2d]">
                  <p className="text-sm text-[#6b6b6b]">
                    <span className="text-[#e8e8e8] font-semibold">Perfect for:</span> Founders, lawyers, deal teams
                  </p>
                </div>
              </div>
            </Link>

            {/* Dead Drop */}
            <Link href="/dead-drop" className="group">
              <div className="bg-[#212121] rounded-3xl p-10 hover:bg-[#252525] transition-all border border-[#2d2d2d] hover:border-[#4F9BBE]/30 h-full">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-[#4F9BBE]/20 rounded-2xl flex items-center justify-center">
                    <Lock className="w-7 h-7 text-[#4F9BBE]" />
                  </div>
                  <ArrowRight className="w-6 h-6 text-[#4F9BBE] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>

                <h3 className="text-2xl font-bold text-[#e8e8e8] mb-4">Dead Drop</h3>
                <p className="text-[#9b9b9b] mb-6 leading-relaxed text-lg">
                  Sealed documents that unlock automatically on a future date. 
                  Perfect for wills, succession plans, and time-locked releases.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-[#9b9b9b]">
                    <Check className="w-5 h-5 text-[#4F9BBE] flex-shrink-0" />
                    <span>Future date unlock trigger</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#9b9b9b]">
                    <Check className="w-5 h-5 text-[#4F9BBE] flex-shrink-0" />
                    <span>Recipient wallet lock</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#9b9b9b]">
                    <Check className="w-5 h-5 text-[#4F9BBE] flex-shrink-0" />
                    <span>Irreversible — no backdoor</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#9b9b9b]">
                    <Check className="w-5 h-5 text-[#4F9BBE] flex-shrink-0" />
                    <span>Nobody can override</span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-[#2d2d2d]">
                  <p className="text-sm text-[#6b6b6b]">
                    <span className="text-[#e8e8e8] font-semibold">Perfect for:</span> Wills, succession, whistleblowers
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-[#0f0f0f]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#e8e8e8] mb-4">How it works</h2>
            <p className="text-lg text-[#9b9b9b]">Cryptography, not promises</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#4F9BBE]/20 text-[#4F9BBE] rounded-2xl flex items-center justify-center font-bold text-2xl mb-6 mx-auto">
                1
              </div>
              <h3 className="text-xl font-semibold text-[#e8e8e8] mb-3">Upload & Encrypt</h3>
              <p className="text-[#9b9b9b] leading-relaxed">
                Your document is encrypted client-side with threshold encryption and stored in a CDR vault on Story Protocol.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#4F9BBE]/20 text-[#4F9BBE] rounded-2xl flex items-center justify-center font-bold text-2xl mb-6 mx-auto">
                2
              </div>
              <h3 className="text-xl font-semibold text-[#e8e8e8] mb-3">Set Conditions</h3>
              <p className="text-[#9b9b9b] leading-relaxed">
                Define access rules: wallet addresses, time windows, or future unlock dates. Smart contracts enforce them.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#4F9BBE]/20 text-[#4F9BBE] rounded-2xl flex items-center justify-center font-bold text-2xl mb-6 mx-auto">
                3
              </div>
              <h3 className="text-xl font-semibold text-[#e8e8e8] mb-3">Blockchain Enforces</h3>
              <p className="text-[#9b9b9b] leading-relaxed">
                On-chain conditions control access. No company. No server. No override. Just code.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-[#e8e8e8] mb-6">
            Ready to go trustless?
          </h2>
          <p className="text-xl text-[#9b9b9b] mb-10">
            Join the future of confidential document sharing
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/deal-room"
              className="px-8 py-4 bg-[#4F9BBE] text-white font-semibold rounded-xl hover:bg-[#3d8aad] transition-all hover:scale-105"
            >
              Create Deal Room
            </Link>
            <Link 
              href="/dead-drop"
              className="px-8 py-4 bg-[#212121] border-2 border-[#2d2d2d] text-[#e8e8e8] font-semibold rounded-xl hover:bg-[#2a2a2a] hover:border-[#4F9BBE]/30 transition-all"
            >
              Create Dead Drop
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2d2d2d] py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Vault className="w-5 h-5 text-[#4F9BBE]" />
              <span className="text-sm text-[#9b9b9b]">
                Built for the CDR Hackathon · Powered by Story Protocol
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[#6b6b6b]">
              <a href="https://github.com/Smiley617/CDR-hackathon-" target="_blank" rel="noopener noreferrer" className="hover:text-[#4F9BBE] transition-colors">
                GitHub
              </a>
              <a href="https://docs.story.foundation" target="_blank" rel="noopener noreferrer" className="hover:text-[#4F9BBE] transition-colors">
                Docs
              </a>
              <a href="https://discord.gg/storyprotocol" target="_blank" rel="noopener noreferrer" className="hover:text-[#4F9BBE] transition-colors">
                Discord
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
