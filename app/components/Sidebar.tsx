'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Plus, PanelLeftClose, PanelLeft, FileText, Lock, Users,
  LogOut, Loader2, ChevronDown, KeyRound,
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
  const searchParams = useSearchParams();
  const { walletAddress, connectWallet, isConnecting, setWalletAddress } = useWallet();
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('dv-sidebar-collapsed') === '1',
  );
  const [mounted] = useState(true);
  const [vaults, setVaults] = useState<VaultMetadata[]>([]);
  const [loadingVaults, setLoadingVaults] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const toggle = () => {
    setCollapsed((c) => {
      localStorage.setItem('dv-sidebar-collapsed', c ? '0' : '1');
      return !c;
    });
    setNewOpen(false);
    setProfileOpen(false);
  };

  // close profile menu on outside click
  useEffect(() => {
    if (!profileOpen) return;
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [profileOpen]);

  // close "New vault" dropdown on outside click
  const newRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!newOpen) return;
    const onClick = (e: MouseEvent) => {
      if (newRef.current && !newRef.current.contains(e.target as Node)) setNewOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [newOpen]);

  // which vault is open (from ?v=) — synced on every navigation
  const activeUuid = searchParams.get('v');

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

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadVaults(); }, [loadVaults, pathname]);

  const typeIcon = (t: VaultMetadata['type']) =>
    t === 'dead-drop' ? Lock : t === 'multi-sig' ? Users : FileText;

  const disconnect = () => {
    setWalletAddress(null);
    setProfileOpen(false);
  };

  return (
    <aside className={`dv-side ${collapsed ? 'is-collapsed' : ''} ${mounted ? 'is-ready' : ''}`}>
      {/* header */}
      <div className="dv-side-head">
        {!collapsed && (
          <Link href="/" className="dv-brand"><span className="dv-side-label">DealVault</span></Link>
        )}
        <button className="dv-icon-btn" onClick={toggle} title={collapsed ? 'Open sidebar' : 'Collapse sidebar'}>
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* new vault */}
      <div className="dv-side-section" ref={newRef}>
        {collapsed ? (
          <Link href="/deal-room" className="dv-rail-item" title="New vault"><Plus size={18} /></Link>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* vaults = threads */}
      {!collapsed && (
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
                  <Link key={v.uuid} href={`/dashboard?v=${v.uuid}`}
                    className={`dv-thread ${activeUuid === v.uuid ? 'is-active' : ''}`}
                    title={v.name}>
                    <Icon size={14} className="shrink-0" style={{ color: 'var(--dv-faint)' }} />
                    <span className="dv-thread-name">{v.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
      {collapsed && <div className="dv-side-threads" />}

      {/* wallet profile */}
      <div className="dv-side-foot" ref={profileRef}>
        {!walletAddress ? (
          collapsed ? (
            <button className="dv-rail-item" onClick={connectWallet} disabled={isConnecting} title="Connect Wallet"><KeyRound size={18} /></button>
          ) : (
            <button className="dv-button w-full" onClick={connectWallet} disabled={isConnecting}>
              {isConnecting ? 'Connecting…' : 'Connect Wallet'}
            </button>
          )
        ) : (
          <div className="relative">
            {profileOpen && !collapsed && (
              <div className="dv-profile-menu">
                <button className="dv-profile-menu-item" onClick={disconnect}>
                  <LogOut size={15} /> Disconnect wallet
                </button>
              </div>
            )}
            <button
              className={collapsed ? 'dv-rail-item' : 'dv-profile'}
              onClick={() => setProfileOpen((o) => !o)}
              title={walletAddress}
            >
              <div className="dv-avatar">{walletAddress.slice(2, 4).toUpperCase()}</div>
              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="dv-profile-addr">{walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}</div>
                    <div className="dv-profile-net">Story Aeneid</div>
                  </div>
                  <ChevronDown size={15} style={{ color: 'var(--dv-faint)', transform: profileOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
