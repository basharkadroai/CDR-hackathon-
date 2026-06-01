'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Check,
  Clock3,
  Code2,
  FileText,
  FolderLock,
  KeyRound,
  Layers3,
  Lock,
  MessageSquareText,
  Plus,
  Search,
  Shield,
  Sparkles,
  Users,
  Vault,
  Zap,
} from 'lucide-react';
import { useWallet } from './context/WalletContext';

const recentDeals = [
  'Series A diligence room',
  'Strategic IP sale packet',
  'Board-only acquisition memo',
  'Founder succession dead drop',
];

const proofCards = [
  {
    icon: Shield,
    title: 'Upload & Encrypt',
    copy: 'Files are AES-GCM encrypted in the browser before CDR protects the data key.',
  },
  {
    icon: KeyRound,
    title: 'Set Conditions',
    copy: 'Wallets, expiry windows, recipients, and unlock dates become programmable rules.',
  },
  {
    icon: Layers3,
    title: 'Blockchain Enforces',
    copy: 'Story CDR validators only release decryptions when the condition contract passes.',
  },
];

export default function Home() {
  const { walletAddress, connectWallet, isConnecting } = useWallet();

  return (
    <div className="dv-shell">
      <div className="dv-layout">
        <aside className="dv-sidebar">
          <Link href="/" className="dv-brand">
            <span className="dv-brand-mark"><Vault size={18} /></span>
            <span>DealVault</span>
          </Link>

          <div className="dv-nav-section">
            <Link href="/deal-room" className="dv-nav-item active">
              <Plus size={18} /> New deal room
            </Link>
            <Link href="/dashboard" className="dv-nav-item">
              <FolderLock size={18} /> Vaults
            </Link>
            <Link href="/dead-drop" className="dv-nav-item">
              <Lock size={18} /> Dead drops
            </Link>
            <Link href="/multi-sig" className="dv-nav-item">
              <Users size={18} /> Multi-sig vaults
            </Link>
            <Link href="/test-cdr" className="dv-nav-item">
              <Code2 size={18} /> CDR diagnostics
            </Link>
          </div>

          <div className="dv-nav-section">
            <div className="dv-nav-label">Products</div>
            <div className="dv-nav-item"><BriefcaseBusiness size={18} /> M&A diligence</div>
            <div className="dv-nav-item"><BarChart3 size={18} /> Fundraising rooms</div>
            <div className="dv-nav-item"><BookOpen size={18} /> Succession vaults</div>
          </div>

          <div className="dv-nav-section" style={{ marginTop: 'auto' }}>
            <div className="dv-nav-label">Recent</div>
            {recentDeals.map((item) => (
              <div key={item} className="dv-nav-item" title={item}>
                <MessageSquareText size={16} />
                <span className="truncate">{item}</span>
              </div>
            ))}
          </div>
        </aside>

        <main className="dv-main">
          <div className="dv-topbar">
            <Link href="/dashboard" className="dv-button-secondary">
              Dashboard
            </Link>
            <button onClick={connectWallet} disabled={isConnecting} className="dv-button">
              {walletAddress
                ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                : isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>

          <section className="dv-hero">
            <div className="dv-hero-inner">
              <div className="dv-kicker">
                <Sparkles size={15} /> Powered by Story Protocol CDR
              </div>

              <h1 className="dv-title">
                Hey there, deal team.<br />
                <span>Private documents. Zero trust.</span>
              </h1>

              <p className="dv-subtitle">
                On-chain confidential document rooms for M&A, fundraising, and succession planning.
                Zero Trust Required. No middleman, no shared server keys — just programmable CDR access control.
              </p>

              <div className="dv-command-card">
                <div className="dv-command-prompt">
                  What sensitive workflow do you want to protect today?
                </div>
                <div className="dv-command-actions">
                  <Link href="/deal-room" className="dv-button">
                    <FileText size={17} /> Create Deal Room <ArrowRight size={16} />
                  </Link>
                  <Link href="/dead-drop" className="dv-button-secondary">
                    <Lock size={17} /> Create Dead Drop
                  </Link>
                  <Link href="/multi-sig" className="dv-button-secondary">
                    <Users size={17} /> Multi-Sig Vault
                  </Link>
                  <Link href="/test-cdr" className="dv-chip">
                    <Search size={16} /> Test CDR
                  </Link>
                </div>
              </div>

              <div className="dv-chip-row" style={{ justifyContent: 'center', marginTop: 18 }}>
                <span className="dv-chip"><Shield size={15} /> Threshold Encrypted</span>
                <span className="dv-chip"><Check size={15} /> On-Chain Access Control</span>
                <span className="dv-chip"><Zap size={15} /> No Trusted Middleman</span>
              </div>

              <h2 className="dv-nav-label" style={{ marginTop: 30, textAlign: 'center' }}>How it works</h2>
              <div className="dv-card-grid" aria-label="How it works">
                {proofCards.map(({ icon: Icon, title, copy }) => (
                  <div key={title} className="dv-card">
                    <span className="dv-icon-pill"><Icon size={17} /></span>
                    <h3>{title}</h3>
                    <p>{copy}</p>
                  </div>
                ))}
              </div>

              <div className="dv-card-grid">
                <div className="dv-card">
                  <span className="dv-icon-pill"><BriefcaseBusiness size={17} /></span>
                  <h3>Deal Room</h3>
                  <p>Wallet-gated diligence packets with expiry windows and CDR condition-contract enforcement.</p>
                </div>
                <div className="dv-card">
                  <span className="dv-icon-pill"><Clock3 size={17} /></span>
                  <h3>Dead Drop</h3>
                  <p>Sealed files that open for one recipient after a future timestamp — ideal for succession plans.</p>
                </div>
                <div className="dv-card">
                  <span className="dv-icon-pill"><Layers3 size={17} /></span>
                  <h3>Composable CDR</h3>
                  <p>Vault UUIDs and condition contracts are on-chain objects other contracts can reference.</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
