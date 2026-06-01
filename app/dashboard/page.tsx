'use client';

/* eslint-disable react-hooks/purity, react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Vault, ExternalLink, AlertCircle } from 'lucide-react';
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

  return (
    <div className="dv-shell">
      <nav className="border-b border-white/10 bg-[#1f1f1e]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Vault className="w-6 h-6 text-[#f0b17a]" />
              <span className="text-lg font-semibold text-[#f1eee8]">DealVault</span>
            </Link>
            {walletAddress ? (
              <div className="px-3 py-1.5 bg-white/7 border border-white/10 text-[#f1eee8] rounded-xl text-sm font-mono">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="dv-button disabled:opacity-50"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
          <div>
            <h1 className="dv-page-title mb-2">My Vaults</h1>
            <p className="text-[#a7a29a]">Manage your confidential documents</p>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/deal-room"
              className="dv-button text-sm"
            >
              + Deal Room
            </Link>
            <Link
              href="/dead-drop"
              className="dv-button-secondary text-sm"
            >
              + Dead Drop
            </Link>
            <Link
              href="/multi-sig"
              className="dv-button-secondary text-sm"
            >
              + Multi-Sig
            </Link>
          </div>
        </div>

        {!walletAddress ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-[#212121] border border-[#2d2d2d] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-[#9b9b9b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className="text-[#e8e8e8] font-medium text-lg mb-2">Connect your wallet</p>
            <p className="text-[#9b9b9b] mb-6">Connect your wallet to view and manage your vaults</p>
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#4F9BBE] text-white font-medium rounded-lg hover:bg-[#3d8aad] transition-colors disabled:opacity-50"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>
        ) : loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-[#2d2d2d] border-t-[#4F9BBE] rounded-full animate-spin mb-4" />
            <p className="text-[#9b9b9b]">Loading vaults...</p>
          </div>
        ) : vaults.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-[#212121] border border-[#2d2d2d] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-[#9b9b9b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-[#e8e8e8] font-medium text-lg mb-2">No vaults yet</p>
            <p className="text-[#9b9b9b] mb-6">Create your first vault to get started</p>
            <Link 
              href="/"
              className="dv-button"
            >
              Get Started
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {vaults.map((vault) => (
              <div 
                key={vault.uuid}
                className="dv-panel p-6 hover:bg-white/[0.055] transition-all"
              >
                <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <h3 className="text-xl font-medium text-[#e8e8e8]">{vault.name}</h3>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#2d2d2d] text-[#e8e8e8]">
                        {typeLabel(vault.type)}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        vault.status === 'active' 
                          ? 'bg-[#1a4d1a] text-[#7dff7d]'
                          : vault.status === 'sealed'
                          ? 'bg-[#4d3d1a] text-[#ffd97d]'
                          : 'bg-[#4d1a1a] text-[#ff7d7d]'
                      }`}>
                        {vault.status}
                      </span>
                    </div>
                    
                    <div className="text-sm text-[#9b9b9b] space-y-2">
                      <p>Created {new Date(vault.createdAt).toLocaleDateString()}</p>
                      {vault.expiresAt && (
                        <p>Expires in {formatTimeRemaining(vault.expiresAt)}</p>
                      )}
                      {vault.unlockAt && (
                        <p>
                          {vault.unlockAt > now 
                            ? `Unlocks in ${formatTimeRemaining(vault.unlockAt)}`
                            : 'Unlocked'
                          }
                        </p>
                      )}
                      {vault.enforcementMode && (
                        <p>
                          CDR gate: {vault.enforcementMode === 'custom-condition-contract'
                            ? 'custom condition contract'
                            : vault.enforcementMode === 'owner-only-fallback'
                              ? 'owner-only fallback (deploy condition contract to enable shared access)'
                              : 'mock demo'}
                        </p>
                      )}
                      <div className="pt-2 border-t border-[#2d2d2d]">
                        <p className="text-xs font-mono text-[#6b6b6b] mb-1">Vault UUID:</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-[#9b9b9b] break-all">{vault.uuid.substring(0, 20)}...</code>
                          <button
                            onClick={() => copyVaultUuid(vault.uuid)}
                            className="text-[#4F9BBE] hover:text-[#3d8aad] transition-colors"
                            title="Copy UUID"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {vault.type === 'multi-sig' && (
                      <button
                        onClick={() => handleApprove(vault.uuid)}
                        className="dv-button-secondary text-sm"
                        title="Record an on-chain approval (eligible signers only)"
                      >
                        Approve (sign)
                      </button>
                    )}
                    <button
                      onClick={() => handleAccessVault(vault.uuid, vault.name, vault.fileName)}
                      disabled={vault.status === 'sealed' || vault.status === 'expired'}
                      className="dv-button disabled:bg-[#2d2d2d] disabled:cursor-not-allowed disabled:text-[#6b6b6b] text-sm"
                    >
                      {vault.status === 'sealed' ? 'Sealed' : vault.status === 'expired' ? 'Expired' : 'Access Vault'}
                    </button>
                    {getExplorerUrl(vault.txHash) && (
                      <a
                        href={getExplorerUrl(vault.txHash)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dv-button-secondary text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View on Explorer
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
