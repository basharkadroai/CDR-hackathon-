'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Vault, Plus, PanelLeftClose, PanelLeft, FileText, Lock, Users,
  Code2, LogOut, Loader2, ChevronDown,
} from 'lucide-react';
import { cdrService, VaultMetadata } from '@/lib/cdr-service';
import { useWallet } from '../context/WalletContext';

const NEW_OPTIONS = [
  { href: '/deal-room', label: 'Deal Room', icon: FileText },
  { href: '/dead-drop', label: 'Dead Drop', icon: Lock },
  { href: '/multi-sig', label: 'Multi-Sig Vault', icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { walletAddress, connectWallet, isConnecting, setWalletAddress } = useWallet();
  const [collapsed, setCollapsed] = useState(false);
  const [vaults, setVaults] = useState<VaultMetadata[]>([]);
  const [loadingVaults, setLoadingVaults] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  // restore collapse preference
  useEffect(() => {
    setCollapsed(localStorage.getItem('dv-sidebar-collapsed') === '1');
  }, []);
  const toggle = () => {
    setCollapsed((c) => {
      localStorage.setItem('dv-sidebar-collapsed', c ? '0' : '1');
      return !c;
    });
  };

  const loadVaults = useCallback(async () => {
    if (!walletAddress) { setVaults([]); return; }
    try {
      setLoadingVaults(true);
      setVaults(await cdrService.listUserVaults(walletAddress));
    } catch {
      /* ignore */
    } finally {
      setLoadingVaults(false);
    }
  }, [walletAddress]);

  useEffect(() => { void loadVaults(); }, [loadVaults, pathname]);

  const typeIcon = (t: VaultMetadata['type']) =>
    t === 'dead-drop' ? Lock : t === 'multi-sig' ? Users : FileText;

  if (collapsed) {
    return (
      <aside className="dv-rail">
        <button className="dv-rail-btn" onClick={toggle} title="Open sidebar"><PanelLeft size={18} /></button>
        <Link href="/" className="dv-rail-btn" title="Home"><span className="dv-brand-mark"><Vault size={15} /></span></Link>
        <Link href="/deal-room" className="dv-rail-btn" title="New vault"><Plus size={18} /></Link>
        <Link href="/test-cdr" className="dv-rail-btn" title="CDR diagnostics"><Code2 size={18} /></Link>
      </aside>
    );
  }

  return (
    <aside className="dv-side">
      {/* header */}
      <div className="dv-side-head">
        <Link href="/" className="dv-brand"><span className="dv-brand-mark"><Vault size={16} /></span>DealVault</Link>
        <button className="dv-icon-btn" onClick={toggle} title="Collapse sidebar"><PanelLeftClose size={18} /></button>
      </div>

      {/* new vault */}
      <div className="dv-side-section">
        <button className="dv-new-btn" onClick={() => setNewOpen((o) => !o)}>
          <span className="flex items-center gap-2"><Plus size={17} /> New vault</span>
          <ChevronDown size={15} style={{ transform: newOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
        </button>
        {newOpen && (
          <div className="dv-new-menu">
            {NEW_OPTIONS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="dv-nav-item" onClick={() => setNewOpen(false)}>
                <Icon size={16} /> {label}
              </Link>
            ))}
          </div>
        )}
        <Link href="/test-cdr" className={`dv-nav-item ${pathname === '/test-cdr' ? 'active' : ''}`}>
          <Code2 size={16} /> CDR diagnostics
        </Link>
      </div>

      {/* vaults = threads */}
      <div className="dv-side-threads">
        <div className="dv-nav-label">Your vaults</div>
        {!walletAddress ? (
          <p className="dv-side-hint">Connect your wallet to see your vaults.</p>
        ) : loadingVaults ? (
          <div className="dv-side-hint flex items-center gap-2"><Loader2 size={14} className="dv-spin" /> Loading…</div>
        ) : vaults.length === 0 ? (
          <p className="dv-side-hint">No vaults yet. Create your first one above.</p>
        ) : (
          <div className="dv-thread-list">
            {vaults.map((v) => {
              const Icon = typeIcon(v.type);
              return (
                <Link key={v.uuid} href={`/dashboard?v=${v.uuid}`} className="dv-thread" title={v.name}>
                  <Icon size={14} className="shrink-0" style={{ color: 'var(--dv-faint)' }} />
                  <span className="dv-thread-name">{v.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* wallet profile */}
      <div className="dv-side-foot">
        {walletAddress ? (
          <div className="dv-profile">
            <div className="dv-avatar">{walletAddress.slice(2, 4).toUpperCase()}</div>
            <div className="min-w-0 flex-1">
              <div className="dv-profile-addr">{walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}</div>
              <div className="dv-profile-net">Story Aeneid</div>
            </div>
            <button className="dv-icon-btn" title="Disconnect" onClick={() => setWalletAddress(null)}><LogOut size={15} /></button>
          </div>
        ) : (
          <button className="dv-button w-full" onClick={connectWallet} disabled={isConnecting}>
            {isConnecting ? 'Connecting…' : 'Connect Wallet'}
          </button>
        )}
      </div>
    </aside>
  );
}
