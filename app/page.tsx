'use client';

import Link from 'next/link';
import { ArrowRight, FileText, Lock, Users, Search } from 'lucide-react';
import { useWallet } from './context/WalletContext';

export default function Home() {
  const { walletAddress } = useWallet();

  return (
    <main className="dv-main">
      <div className="dv-hero">
        <div className="dv-hero-inner">
          <h1 className="dv-title">
            {walletAddress ? 'Welcome back.' : 'Hey there, deal team.'}<br />
            <span>Private documents. Zero trust.</span>
          </h1>

          <p className="dv-subtitle">
            On-chain confidential document rooms for M&amp;A, fundraising, and succession planning.
            No middleman, no shared server keys — just programmable CDR access control.
          </p>

          <div className="dv-command-card">
            <div className="dv-command-prompt">What sensitive workflow do you want to protect today?</div>
            <div className="dv-command-actions">
              <Link href="/deal-room" className="dv-button"><FileText size={17} /> Create Deal Room <ArrowRight size={15} /></Link>
              <Link href="/dead-drop" className="dv-button-secondary"><Lock size={16} /> Create Dead Drop</Link>
              <Link href="/multi-sig" className="dv-button-secondary"><Users size={16} /> Multi-Sig Vault</Link>
              <Link href="/test-cdr" className="dv-chip"><Search size={15} /> Test CDR</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
