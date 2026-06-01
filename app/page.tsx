'use client';

import Link from 'next/link';
import {
  ArrowRight, FileText, Lock, Users, Search, Shield, Check, Zap,
  KeyRound, Layers3, Sparkles,
} from 'lucide-react';
import { useWallet } from './context/WalletContext';

const proofCards = [
  { icon: Shield, title: 'Upload & Encrypt', copy: 'Files are AES-GCM encrypted in the browser before CDR protects the data key.' },
  { icon: KeyRound, title: 'Set Conditions', copy: 'Wallets, expiry windows, recipients, unlock dates, and multi-sig become programmable rules.' },
  { icon: Layers3, title: 'Blockchain Enforces', copy: 'Story CDR validators only release decryptions when the on-chain condition contract passes.' },
];

export default function Home() {
  const { walletAddress } = useWallet();

  return (
    <main className="dv-main">
      <div className="dv-hero">
        <div className="dv-hero-inner">
          <div className="dv-kicker"><Sparkles size={14} /> Powered by Story Protocol CDR</div>

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

          <div className="dv-chip-row" style={{ justifyContent: 'center', marginTop: 18 }}>
            <span className="dv-chip"><Shield size={14} /> Threshold Encrypted</span>
            <span className="dv-chip"><Check size={14} /> On-Chain Access Control</span>
            <span className="dv-chip"><Zap size={14} /> No Trusted Middleman</span>
          </div>

          <div className="dv-nav-label" style={{ marginTop: 34, textAlign: 'center', letterSpacing: '0.08em' }}>HOW IT WORKS</div>
          <div className="dv-card-grid">
            {proofCards.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="dv-card">
                <span className="dv-icon-pill"><Icon size={17} /></span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
