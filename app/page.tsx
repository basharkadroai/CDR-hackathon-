'use client';

import Link from 'next/link';
import { ArrowRight, FileText, Lock, Users, Search } from 'lucide-react';
import { useWallet } from './context/WalletContext';
import Logo from './components/Logo';

function partOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 18) return 'Afternoon';
  return 'Evening';
}

export default function Home() {
  const { walletAddress } = useWallet();
  const greeting = walletAddress
    ? `${partOfDay()}. Your vault is ready.`
    : `${partOfDay()}. Let's secure a deal.`;

  return (
    <main className="dv-main">
      <div className="dv-hero">
        <div className="dv-hero-inner">
          <div className="dv-hero-greeting">
            <Logo size={40} />
            <h1 className="dv-title">{greeting}</h1>
          </div>

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
