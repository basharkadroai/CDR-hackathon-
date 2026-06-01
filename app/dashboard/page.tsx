'use client';

/* eslint-disable react-hooks/purity, react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Vault, ExternalLink, AlertCircle, Plus, FolderOpen, Loader2, Copy } from 'lucide-react';
import { cdrService, VaultMetadata } from '@/lib/cdr-service';
import { useWallet } from '../context/WalletContext';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [vaults, setVaults] = useState<VaultMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const { walletAddress, connectWallet, isConnecting } = useWallet();

  const now = useMemo(() => Date.now(), []);

  const loadVaults = useCallback(async () => {
    if (!walletAddress) return;

    try {
      setLoading(true);
      const userVaults = await cdrService.listUserVaults(walletAddress);
      setVaults(userVaults);
    } catch (error) {
      console.error('Failed to load vaults:', error);
      toast.error('Failed to load your vaults. Please try refreshing the page.', {
        icon: <AlertCircle className="w-5 h-5" />,
      });
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      void loadVaults();
    } else {
      queueMicrotask(() => setLoading(false));
    }
  }, [walletAddress, loadVaults]);

  const formatTimeRemaining = (timestamp: number) => {
    const diff = timestamp - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const handleAccessVault = async (uuid: string, vaultName: string, fileName?: string) => {
    const loadingToast = toast.loading(
      `Accessing ${vaultName}... (collecting validator decryptions)`,
    );

    try {
      const blob = await cdrService.accessVault(uuid);
      const url = URL.createObjectURL(blob);

      toast.success('Decrypted via CDR — downloading file', {
        id: loadingToast,
      });

      // Trigger a real download with the original filename.
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || `dealvault-${uuid}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (error) {
      console.error('Failed to access vault:', error);
      
      let errorMessage = 'Failed to access vault. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          errorMessage = 'Vault not found. It may have been deleted.';
        } else if (error.message.includes('unauthorized') || error.message.includes('access denied')) {
          errorMessage = 'Access denied. You are not authorized to view this vault.';
        } else if (error.message.includes('expired')) {
          errorMessage = 'This vault has expired and is no longer accessible.';
        } else if (error.message.includes('sealed')) {
          errorMessage = 'This vault is sealed and cannot be opened yet.';
        }
      }
      
      toast.error(errorMessage, {
        id: loadingToast,
        icon: <AlertCircle className="w-5 h-5" />,
        duration: 5000,
      });
    }
  };

  const handleApprove = async (uuid: string) => {
    const t = toast.loading('Submitting on-chain approval…');
    try {
      const { approvals } = await cdrService.approveMultiSigVault(uuid);
      toast.success(`Approval recorded on-chain (${approvals} total)`, { id: t });
      void loadVaults();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Approval failed',
        { id: t, icon: <AlertCircle className="w-5 h-5" />, duration: 5000 },
      );
    }
  };

  const copyVaultUuid = (uuid: string) => {
    navigator.clipboard.writeText(uuid);
    toast.success('Vault UUID copied to clipboard!', {
      duration: 2000,
    });
  };

  // Link to the real on-chain allocate/write tx on the Aeneid explorer.
  const getExplorerUrl = (txHash?: string) => {
    if (!txHash) return null;
    return `https://aeneid.storyscan.io/tx/${txHash}`;
  };

  const typeLabel = (type: VaultMetadata['type']) =>
    type === 'deal-room' ? 'Deal Room' : type === 'dead-drop' ? 'Dead Drop' : 'Multi-Sig';

  const statusStyle = (s: VaultMetadata['status']) =>
    s === 'active'
      ? { background: 'rgba(127,170,110,0.15)', color: 'var(--dv-green)' }
      : s === 'sealed'
        ? { background: 'rgba(201,161,74,0.15)', color: 'var(--dv-amber)' }
        : { background: 'rgba(204,102,102,0.15)', color: 'var(--dv-red)' };

  return (
    <div className="dv-shell">
      <nav className="border-b" style={{ borderColor: 'var(--dv-line)' }}>
        <div className="max-w-5xl mx-auto px-6 lg:px-8 h-16 flex justify-between items-center">
          <Link href="/" className="dv-brand"><span className="dv-brand-mark"><Vault size={16} /></span>DealVault</Link>
          {walletAddress ? (
            <div className="px-3 py-1.5 rounded-xl text-sm font-mono"
              style={{ background: 'var(--dv-panel)', border: '1px solid var(--dv-line)', color: 'var(--dv-text)' }}>
              {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
            </div>
          ) : (
            <button onClick={connectWallet} disabled={isConnecting} className="dv-button">
              {isConnecting ? 'Connecting…' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
          <div>
            <h1 className="dv-page-title">My Vaults</h1>
            <p className="dv-page-subtitle">Your confidential documents, secured on-chain by CDR.</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/deal-room" className="dv-button text-sm"><Plus size={15} /> Deal Room</Link>
            <Link href="/dead-drop" className="dv-button-secondary text-sm"><Plus size={15} /> Dead Drop</Link>
            <Link href="/multi-sig" className="dv-button-secondary text-sm"><Plus size={15} /> Multi-Sig</Link>
          </div>
        </div>

        {!walletAddress ? (
          <div className="dv-panel text-center py-20 px-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'var(--dv-accent-soft)', color: 'var(--dv-accent-2)' }}>
              <Vault size={26} />
            </div>
            <p className="text-lg font-medium mb-2" style={{ color: 'var(--dv-text)' }}>Connect your wallet</p>
            <p className="mb-6" style={{ color: 'var(--dv-muted)' }}>Connect to view and manage your vaults.</p>
            <button onClick={connectWallet} disabled={isConnecting} className="dv-button">
              {isConnecting ? 'Connecting…' : 'Connect Wallet'}
            </button>
          </div>
        ) : loading ? (
          <div className="text-center py-20">
            <Loader2 className="dv-spin mx-auto mb-4" size={30} style={{ color: 'var(--dv-accent-2)' }} />
            <p style={{ color: 'var(--dv-muted)' }}>Loading vaults…</p>
          </div>
        ) : vaults.length === 0 ? (
          <div className="dv-panel text-center py-20 px-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'var(--dv-panel)', color: 'var(--dv-faint)' }}>
              <FolderOpen size={26} />
            </div>
            <p className="text-lg font-medium mb-2" style={{ color: 'var(--dv-text)' }}>No vaults yet</p>
            <p className="mb-6" style={{ color: 'var(--dv-muted)' }}>Create your first confidential vault to get started.</p>
            <Link href="/deal-room" className="dv-button">Create a Deal Room</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {vaults.map((vault) => (
              <div key={vault.uuid} className="dv-panel p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5 mb-4">
                      <h3 className="text-lg font-medium" style={{ color: 'var(--dv-text)', fontFamily: 'var(--font-serif)' }}>{vault.name}</h3>
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-medium"
                        style={{ background: 'var(--dv-panel)', color: 'var(--dv-muted)' }}>{typeLabel(vault.type)}</span>
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-medium capitalize" style={statusStyle(vault.status)}>{vault.status}</span>
                    </div>

                    <div className="text-sm space-y-1.5" style={{ color: 'var(--dv-muted)' }}>
                      <p>Created {new Date(vault.createdAt).toLocaleDateString()}</p>
                      {vault.expiresAt && <p>Expires in {formatTimeRemaining(vault.expiresAt)}</p>}
                      {vault.unlockAt && <p>{vault.unlockAt > now ? `Unlocks in ${formatTimeRemaining(vault.unlockAt)}` : 'Unlocked'}</p>}
                      {vault.enforcementMode && (
                        <p>
                          CDR enforcement: {vault.enforcementMode === 'custom-condition-contract'
                            ? 'on-chain condition contract'
                            : vault.enforcementMode === 'owner-only-fallback'
                              ? 'owner-only'
                              : 'mock demo'}
                        </p>
                      )}
                      <div className="pt-2 mt-2 flex items-center gap-2" style={{ borderTop: '1px solid var(--dv-line)' }}>
                        <code className="text-xs break-all" style={{ color: 'var(--dv-faint)' }}>UUID {vault.uuid}</code>
                        <button onClick={() => copyVaultUuid(vault.uuid)} title="Copy UUID"
                          style={{ color: 'var(--dv-accent-2)' }}><Copy size={14} /></button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 w-full lg:w-auto">
                    {vault.type === 'multi-sig' && (
                      <button onClick={() => handleApprove(vault.uuid)} className="dv-button-secondary text-sm"
                        title="Record an on-chain approval (eligible signers only)">Approve (sign)</button>
                    )}
                    <button onClick={() => handleAccessVault(vault.uuid, vault.name, vault.fileName)}
                      disabled={vault.status === 'sealed' || vault.status === 'expired'} className="dv-button text-sm">
                      {vault.status === 'sealed' ? 'Sealed' : vault.status === 'expired' ? 'Expired' : 'Access Vault'}
                    </button>
                    {getExplorerUrl(vault.txHash) && (
                      <a href={getExplorerUrl(vault.txHash)!} target="_blank" rel="noopener noreferrer" className="dv-button-secondary text-sm">
                        <ExternalLink size={14} /> Explorer
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
