'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Plus, PanelLeftClose, PanelLeft, FileText, Lock, Users,
  LogOut, Loader2, ChevronDown, KeyRound, ShieldCheck, Menu, X, HandCoins,
  MoreHorizontal, Trash2,
} from 'lucide-react';
import { cdrService, type VaultMetadata } from '@/lib/cdr-service';
import { useWallet } from '../context/WalletContext';
import { useVaults } from '../context/VaultsContext';
import AnimatedVaultIcon, { type VaultIconHandle } from './AnimatedVaultIcon';

function VaultThread({
  vault,
  active,
  menuOpen,
  onToggleMenu,
  onAskDelete,
}: {
  vault: VaultMetadata;
  active: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onAskDelete: () => void;
}) {
  const iconRef = useRef<VaultIconHandle>(null);
  return (
    <div
      className={`dv-thread-row ${active ? 'is-active' : ''} ${menuOpen ? 'is-menu-open' : ''}`}
      title={vault.name}
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
    >
      <Link href={`/dashboard?v=${vault.uuid}`} className="dv-thread">
        <AnimatedVaultIcon ref={iconRef} type={vault.type} size={16} />
        <span className="dv-thread-name">{vault.name}</span>
      </Link>
      <button
        type="button"
        className="dv-thread-menu-btn"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleMenu();
        }}
        aria-label={`Vault actions for ${vault.name}`}
        title="Vault actions"
      >
        <MoreHorizontal size={16} />
      </button>
      {menuOpen && (
        <div className="dv-thread-menu">
          <button type="button" className="dv-thread-menu-item is-danger" onClick={onAskDelete}>
            <Trash2 size={14} /> Delete vault
          </button>
          <p className="dv-thread-menu-note">Removes it from DealVault. On-chain history remains.</p>
        </div>
      )}
    </div>
  );
}

const NEW_OPTIONS = [
  { href: '/deal-room', label: 'Secure Share', icon: FileText },
  { href: '/marketplace', label: 'Deal Room (paid)', icon: HandCoins },
  { href: '/dead-drop', label: 'Recovery Vault', icon: Lock },
  { href: '/multi-sig', label: 'Multi-Sig Vault', icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { walletAddress, connectWallet, isConnecting, setWalletAddress } = useWallet();
  const { vaults, loadingVaults } = useVaults();
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('dv-sidebar-collapsed') === '1',
  );
  const [mounted] = useState(true);
  const [newOpen, setNewOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [openVaultMenu, setOpenVaultMenu] = useState<string | null>(null);
  const [deleteModalVault, setDeleteModalVault] = useState<VaultMetadata | null>(null);
  const [deletingVault, setDeletingVault] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Track mobile so the drawer always renders expanded (ignore the desktop
  // collapsed preference on small screens).
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  const effectiveCollapsed = collapsed && !isMobile;

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

  // close the mobile drawer whenever the route (or selected vault) changes
  useEffect(() => { setMobileOpen(false); }, [pathname, activeUuid]);

  const threadsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!openVaultMenu) return;
    const onClick = (e: MouseEvent) => {
      if (threadsRef.current && !threadsRef.current.contains(e.target as Node)) {
        setOpenVaultMenu(null);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [openVaultMenu]);

  const deleteVault = async (vault: VaultMetadata) => {
    setDeletingVault(vault.uuid);
    try {
      await cdrService.deleteVault(vault.uuid);
      setOpenVaultMenu(null);
      setDeleteModalVault(null);
    } finally {
      setDeletingVault(null);
    }
  };

  const disconnect = () => {
    setWalletAddress(null);
    setProfileOpen(false);
  };

  return (
    <>
      {/* mobile top bar (hidden on desktop) */}
      <div className="dv-mobile-topbar">
        <button className="dv-mobile-burger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <Link href="/" className="dv-mobile-brand">DealVault</Link>
      </div>
      {mobileOpen && <div className="dv-mobile-overlay" onClick={() => setMobileOpen(false)} />}

      <aside className={`dv-side ${effectiveCollapsed ? 'is-collapsed' : ''} ${mounted ? 'is-ready' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`}>
      {/* header */}
      <div className="dv-side-head">
        {!effectiveCollapsed && (
          <Link href="/" className="dv-brand"><span className="dv-side-label">DealVault</span></Link>
        )}
        <button className="dv-icon-btn dv-side-collapse" onClick={toggle} title={collapsed ? 'Open sidebar' : 'Collapse sidebar'}>
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
        <button className="dv-icon-btn dv-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
          <X size={18} />
        </button>
      </div>

      {/* new vault */}
      <div className="dv-side-section" ref={newRef}>
        {effectiveCollapsed ? (
          <button className="dv-rail-item" onClick={() => setNewOpen((o) => !o)} title="New vault">
            <Plus size={18} />
          </button>
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

      {/* deal room market */}
      <Link href="/market" className={`dv-nav-item ${pathname === '/market' ? 'active' : ''}`} title="Deal Room market">
        <HandCoins size={effectiveCollapsed ? 18 : 16} />{!effectiveCollapsed && <span>Deal Room market</span>}
      </Link>

      {/* on-chain proof */}
      <Link href="/proof" className={`dv-nav-item ${pathname === '/proof' ? 'active' : ''}`} title="On-chain proof">
        <ShieldCheck size={effectiveCollapsed ? 18 : 16} />{!effectiveCollapsed && <span>On-chain proof</span>}
      </Link>

      {/* vaults = threads */}
      {!effectiveCollapsed && (
        <div className="dv-side-threads">
          <div className="dv-nav-label">Your vaults</div>
          {!walletAddress ? (
            <p className="dv-side-hint">Connect your wallet to see your vaults.</p>
          ) : loadingVaults && vaults.length === 0 ? (
            <div className="dv-side-hint flex items-center gap-2"><Loader2 size={14} className="dv-spin" /> Loading…</div>
          ) : vaults.length === 0 ? (
            <p className="dv-side-hint">No vaults yet. Create your first one above.</p>
          ) : (
            <div className="dv-thread-list" ref={threadsRef}>
              {vaults.map((v) => (
                <VaultThread
                  key={v.uuid}
                  vault={v}
                  active={activeUuid === v.uuid}
                  menuOpen={openVaultMenu === v.uuid}
                  onToggleMenu={() => {
                    setOpenVaultMenu((id) => (id === v.uuid ? null : v.uuid));
                  }}
                  onAskDelete={() => {
                    setDeleteModalVault(v);
                    setOpenVaultMenu(null);
                  }}
                />
              ))}
              {deletingVault && (
                <div className="dv-side-hint flex items-center gap-2"><Loader2 size={14} className="dv-spin" /> Deleting…</div>
              )}
            </div>
          )}
        </div>
      )}
      {effectiveCollapsed && <div className="dv-side-threads" />}

      {/* wallet profile */}
      <div className="dv-side-foot" ref={profileRef}>
        {!walletAddress ? (
          effectiveCollapsed ? (
            <button className="dv-rail-item" onClick={connectWallet} disabled={isConnecting} title="Connect Wallet"><KeyRound size={18} /></button>
          ) : (
            <button className="dv-button w-full" onClick={connectWallet} disabled={isConnecting}>
              {isConnecting ? 'Connecting…' : 'Connect Wallet'}
            </button>
          )
        ) : (
          <div className="relative">
            {profileOpen && !effectiveCollapsed && (
              <div className="dv-profile-menu">
                <button className="dv-profile-menu-item" onClick={disconnect}>
                  <LogOut size={15} /> Disconnect wallet
                </button>
              </div>
            )}
            <button
              className={effectiveCollapsed ? 'dv-rail-item' : 'dv-profile'}
              onClick={() => setProfileOpen((o) => !o)}
              title={walletAddress}
            >
              <div className="dv-avatar">{walletAddress.slice(2, 4).toUpperCase()}</div>
              {!effectiveCollapsed && (
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

    {/* ---- collapsed new vault menu (rendered outside to avoid overflow clipping) ---- */}
    {effectiveCollapsed && newOpen && (
      <div className="dv-new-menu dv-new-menu-collapsed">
        {NEW_OPTIONS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="dv-nav-item" onClick={() => setNewOpen(false)}>
            <Icon size={16} /> {label}
          </Link>
        ))}
      </div>
    )}

    {/* ---- delete confirmation modal ---- */}
    {deleteModalVault && (
      <div className="dv-modal-overlay" onClick={() => deletingVault === null && setDeleteModalVault(null)}>
        <div className="dv-modal" onClick={(e) => e.stopPropagation()}>
          <div className="dv-modal-icon"><Trash2 size={20} /></div>
          <h2 className="dv-modal-title">Delete this vault?</h2>
          <p className="dv-modal-text">
            This removes "{deleteModalVault.name}" from DealVault. The on-chain record and any
            already-downloaded files are unaffected.
          </p>
          <div className="dv-modal-actions">
            <button className="dv-modal-cancel" onClick={() => setDeleteModalVault(null)} disabled={deletingVault !== null}>Cancel</button>
            <button className="dv-modal-delete" onClick={() => void deleteVault(deleteModalVault)} disabled={deletingVault !== null}>
              {deletingVault === deleteModalVault.uuid ? <><Loader2 size={15} className="dv-spin" /> Deleting…</> : <><Trash2 size={15} /> Delete vault</>}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
