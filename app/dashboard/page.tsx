'use client';

/* eslint-disable react-hooks/purity, react-hooks/set-state-in-effect */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Vault, ExternalLink, AlertCircle, Loader2, Copy, Check,
  FileText, Lock, Users, ArrowUp, ChevronDown,
} from 'lucide-react';
import { cdrService, VaultMetadata } from '@/lib/cdr-service';
import { useWallet } from '../context/WalletContext';


function VaultChat({ vault }: { vault: VaultMetadata }) {
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [thinking, setThinking] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, thinking]);
  useEffect(() => {
    const ta = taRef.current; if (!ta) return;
    ta.style.height = 'auto'; ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  }, [input]);

  const ask = async (text: string) => {
    const q = text.trim();
    if (!q || thinking) return;
    const next = [...msgs, { role: 'user' as const, content: q }];
    setMsgs(next);
    setInput('');
    setThinking(true);
    try {
      const res = await fetch('/api/vault-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vault, messages: next }),
      });
      const data = await res.json();
      setMsgs((p) => [...p, { role: 'assistant', content: data.reply || 'Okay.' }]);
    } catch {
      setMsgs((p) => [...p, { role: 'assistant', content: 'Something went wrong. Try again.' }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="dv-vchat">
      <div className="dv-vchat-scroll">
        <div className="dv-vchat-inner">
          {msgs.length === 0 ? (
            <div className="dv-vchat-placeholder"></div>
          ) : (
            <>
              {msgs.map((m, i) => (
                <div key={i} className={`dv-vmsg ${m.role}`}>
                  {m.role === 'assistant' && <div className="dv-msg-name">DealVault</div>}
                  <div className="dv-vmsg-body">{m.content}</div>
                </div>
              ))}
              {thinking && (
                <div className="dv-vmsg assistant">
                  <div className="dv-msg-name">DealVault</div>
                  <div className="dv-typing"><span></span><span></span><span></span></div>
                </div>
              )}
              <div ref={endRef} />
            </>
          )}
        </div>
      </div>
      <div className="dv-vchat-dock">
        <div className="dv-vchat-composer">
          <textarea
            ref={taRef}
            rows={1}
            className="dv-composer-input"
            placeholder="Ask anything about this vault…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void ask(input); } }}
          />
          <button className="dv-send-btn" onClick={() => ask(input)} disabled={thinking || !input.trim()}>
            {thinking ? <Loader2 size={16} className="dv-spin" /> : <ArrowUp size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function DashboardInner() {
  const params = useSearchParams();
  const selectedUuid = params.get('v');
  const [vaults, setVaults] = useState<VaultMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<{ kind: 'busy' | 'ok' | 'error'; msg: string } | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(true);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>('');
  const detailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!detailsOpen) return;
    const onClick = (e: MouseEvent) => {
      if (detailsRef.current && !detailsRef.current.contains(e.target as Node)) setDetailsOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [detailsOpen]);
  const { walletAddress, connectWallet, isConnecting } = useWallet();

  const now = useMemo(() => Date.now(), []);
  const selected = vaults.find((v) => v.uuid === selectedUuid) || null;

  const loadVaults = useCallback(async () => {
    if (!walletAddress) return;
    try {
      setLoading(true);
      setVaults(await cdrService.listUserVaults(walletAddress));
    } catch {
      setStatus({ kind: 'error', msg: 'Failed to load your vaults.' });
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) void loadVaults();
    else queueMicrotask(() => setLoading(false));
  }, [walletAddress, loadVaults]);

  useEffect(() => {
    if (!selected) return;
    
    // If the vault already has a stored AI summary, use it and don't regenerate
    if (selected.aiSummary) {
      setAiSummary(selected.aiSummary);
      setGeneratingSummary(false);
      return;
    }

    // Only generate if there's no stored summary
    let cancelled = false;
    setAiSummary('');
    setGeneratingSummary(true);
    fetch('/api/vault-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vault: selected,
        messages: [{ role: 'user', content: 'Provide a brief 2-3 sentence summary of this vault and its key topics or themes. Focus on what the vault contains and its main purpose.' }]
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        const text = data.reply || 'This vault contains confidential documents with time-limited access controls.';
        cdrService.setVaultSummary(selected.uuid, text); // persist across sessions
        // Also update in-memory vaults so switching back to this vault in the
        // same session reuses it (the list isn't re-read from storage on ?v= nav).
        setVaults((prev) => prev.map((v) => (v.uuid === selected.uuid ? { ...v, aiSummary: text } : v)));
        if (!cancelled) {
          setAiSummary(text);
          setGeneratingSummary(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAiSummary('This vault contains confidential documents with time-limited access controls.');
          setGeneratingSummary(false);
        }
      });
    return () => { cancelled = true; };
  }, [selected?.uuid]);

  const formatTimeRemaining = (ts: number) => {
    const diff = ts - now;
    if (diff <= 0) return 'Expired';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
  };

  const handleAccessVault = async (uuid: string, vaultName: string, fileName?: string) => {
    setStatus({ kind: 'busy', msg: 'Accessing… collecting validator decryptions' });
    try {
      const blob = await cdrService.accessVault(uuid);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || `dealvault-${uuid}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setStatus({ kind: 'ok', msg: 'Decrypted via CDR — file downloaded' });
      setTimeout(() => setStatus(null), 4000);
    } catch (error) {
      let msg = 'Failed to access vault. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('not found')) msg = 'Vault not found.';
        else if (/unauthorized|access denied/.test(error.message)) msg = 'Access denied. You are not authorized to view this vault.';
        else if (error.message.includes('expired')) msg = 'This vault has expired.';
        else if (error.message.includes('sealed')) msg = 'This vault is sealed and cannot be opened yet.';
        else msg = error.message;
      }
      setStatus({ kind: 'error', msg });
    }
  };

  const handleApprove = async (uuid: string) => {
    setStatus({ kind: 'busy', msg: 'Submitting on-chain approval…' });
    try {
      const { approvals } = await cdrService.approveMultiSigVault(uuid);
      setStatus({ kind: 'ok', msg: `Approval recorded on-chain (${approvals} total)` });
      setTimeout(() => setStatus(null), 4000);
      void loadVaults();
    } catch (error) {
      setStatus({ kind: 'error', msg: error instanceof Error ? error.message : 'Approval failed' });
    }
  };

  const copyUuid = (uuid: string) => {
    navigator.clipboard.writeText(uuid);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const explorerUrl = (txHash?: string) => (txHash ? `https://aeneid.storyscan.io/tx/${txHash}` : null);
  const typeMeta = (t: VaultMetadata['type']) =>
    t === 'deal-room' ? { label: 'Deal Room', Icon: FileText } : t === 'dead-drop' ? { label: 'Dead Drop', Icon: Lock } : { label: 'Multi-Sig', Icon: Users };
  const statusStyle = (s: VaultMetadata['status']) =>
    s === 'active' ? { background: 'rgba(127,170,110,0.15)', color: 'var(--dv-green)' }
      : s === 'sealed' ? { background: 'rgba(201,161,74,0.15)', color: 'var(--dv-amber)' }
        : { background: 'rgba(204,102,102,0.15)', color: 'var(--dv-red)' };

  // ---- states ----
  const centered = (children: React.ReactNode) => (
    <div className="dv-shell"><main className="dv-detail-empty">{children}</main></div>
  );

  if (!walletAddress) {
    return centered(
      <>
        <div className="dv-detail-icon" style={{ background: 'var(--dv-accent-soft)', color: 'var(--dv-accent-2)' }}><Vault size={26} /></div>
        <h2 className="dv-detail-empty-title">Connect your wallet</h2>
        <p className="dv-detail-empty-sub">Connect to view your confidential vaults.</p>
        <button onClick={connectWallet} disabled={isConnecting} className="dv-button">{isConnecting ? 'Connecting…' : 'Connect Wallet'}</button>
      </>,
    );
  }
  if (loading) {
    return centered(<><Loader2 className="dv-spin mb-4" size={30} style={{ color: 'var(--dv-accent-2)' }} /><p className="dv-detail-empty-sub">Loading vaults…</p></>);
  }
  // no specific vault selected, or selected one not found → prompt to pick from sidebar
  if (!selected) {
    return centered(
      <>
        <div className="dv-detail-icon" style={{ background: 'var(--dv-panel)', color: 'var(--dv-faint)' }}><Vault size={26} /></div>
        <h2 className="dv-detail-empty-title">{vaults.length ? 'Select a vault' : 'No vaults yet'}</h2>
        <p className="dv-detail-empty-sub">
          {vaults.length ? 'Choose a vault from the sidebar to view its details.' : 'Create your first confidential vault to get started.'}
        </p>
        {!vaults.length && <Link href="/deal-room" className="dv-button">Create a vault</Link>}
      </>,
    );
  }

  // ---- single-vault detail ----
  const { label, Icon } = typeMeta(selected.type);
  const sealed = selected.status === 'sealed';
  const expired = selected.status === 'expired';
  const enforcementLabel = selected.enforcementMode === 'custom-condition-contract'
    ? 'On-chain contract'
    : selected.enforcementMode === 'owner-only-fallback' ? 'Owner-only' : 'Mock demo';

  return (
    <div className="dv-vault">
      {/* ---- top header: darker glass bar with title + actions ---- */}
      <header className="dv-vault-header">
        <div className="dv-vault-bar">
          <div className="dv-vault-headtitle">
            <span className="dv-vault-typeicon"><Icon size={20} /></span>
            <div className="min-w-0">
              <h1 className="dv-vault-name">{selected.name}</h1>
              <div className="dv-vault-subline">
                <span className="dv-vault-tag">{label}</span>
                <span className="dv-dot">·</span>
                <span className="capitalize" style={{ color: statusStyle(selected.status).color }}>{selected.status}</span>
                <span className="dv-dot">·</span>
                <span>Created {new Date(selected.createdAt).toLocaleDateString()}</span>
                {selected.fileName && (<><span className="dv-dot">·</span><span className="truncate">{selected.fileName}</span></>)}
              </div>
            </div>
          </div>
          <div className="dv-vault-actions">
            {selected.type === 'multi-sig' && (
              <button onClick={() => handleApprove(selected.uuid)} className="dv-button-secondary" title="Record an on-chain approval (eligible signers only)">Approve</button>
            )}
            <button onClick={() => handleAccessVault(selected.uuid, selected.name, selected.fileName)} disabled={sealed || expired} className="dv-button">
              {sealed ? 'Sealed' : expired ? 'Expired' : 'Access Vault'}
            </button>
            {explorerUrl(selected.txHash) && (
              <a href={explorerUrl(selected.txHash)!} target="_blank" rel="noopener noreferrer" className="dv-button-secondary"><ExternalLink size={14} /> Explorer</a>
            )}
            <div className="dv-details-wrap" ref={detailsRef}>
              <button
                className={`dv-details-toggle ${detailsOpen ? 'is-open' : ''}`}
                onClick={() => setDetailsOpen((o) => !o)}
                title={detailsOpen ? 'Hide details' : 'Vault details'}
              >
                <ChevronDown size={18} />
              </button>
              {detailsOpen && (
                <div className="dv-details-menu">
                  {selected.expiresAt && (
                    <div className="dv-details-row"><span>Expires</span><b>{formatTimeRemaining(selected.expiresAt)}</b></div>
                  )}
                  {selected.unlockAt && (
                    <div className="dv-details-row"><span>Unlock</span><b>{selected.unlockAt > now ? `in ${formatTimeRemaining(selected.unlockAt)}` : 'Unlocked'}</b></div>
                  )}
                  {selected.recipientWallet && (
                    <div className="dv-details-row"><span>Recipient</span><b className="font-mono" title={selected.recipientWallet}>{selected.recipientWallet.slice(0, 6)}…{selected.recipientWallet.slice(-4)}</b></div>
                  )}
                  {selected.authorizedWallets && selected.authorizedWallets.length > 0 && (
                    <div className="dv-details-row"><span>Authorized</span><b className="font-mono" title={selected.authorizedWallets.join(', ')}>{selected.authorizedWallets.map((w) => `${w.slice(0, 6)}…${w.slice(-4)}`).join(', ')}</b></div>
                  )}
                  {selected.type === 'multi-sig' && selected.threshold ? (
                    <div className="dv-details-row"><span>Approvals</span><b>{selected.threshold}-of-{selected.signers?.length || '?'}</b></div>
                  ) : null}
                  {selected.gate && (
                    <div className="dv-details-row"><span>Escrow gate</span><b className="font-mono" title={selected.gate}>{selected.gate.slice(0, 6)}…{selected.gate.slice(-4)}</b></div>
                  )}
                  <div className="dv-details-row"><span>CDR enforcement</span><b title={enforcementLabel}>{enforcementLabel}</b></div>
                  <div className="dv-details-row">
                    <span>Vault UUID</span>
                    <b className="dv-details-uuid">
                      <span className="font-mono">{selected.uuid}</span>
                      <button onClick={() => copyUuid(selected.uuid)} className="dv-copy-inline" title="Copy UUID">{copied ? <Check size={13} /> : <Copy size={13} />}</button>
                    </b>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {status && (
          <div className={`dv-inline-status is-${status.kind}`} style={{ padding: '4px 4px 0' }}>
            {status.kind === 'busy' && <Loader2 size={14} className="dv-spin" />}
            {status.kind === 'ok' && <Check size={14} />}
            {status.kind === 'error' && <AlertCircle size={14} />}
            <span>{status.msg}</span>
          </div>
        )}
      </header>

      {/* ---- AI Summary Section ---- */}
      <div className={`dv-ai-summary-section ${summaryExpanded ? 'is-expanded' : 'is-collapsed'}`}>
        <div className="dv-ai-summary-header">
          <div className="dv-ai-summary-title">
            <span className="dv-ai-badge">AI SUMMARY</span>
            <button 
              className="dv-summary-toggle-btn" 
              onClick={() => setSummaryExpanded(!summaryExpanded)}
              title={summaryExpanded ? 'Collapse summary' : 'Expand summary'}
            >
              <ChevronDown size={16} className={`dv-summary-chevron ${summaryExpanded ? 'is-open' : ''}`} />
            </button>
          </div>
        </div>
        {summaryExpanded && (
          <div className="dv-ai-summary-content">
            {generatingSummary ? (
              <div className="dv-summary-loading">
                <Loader2 size={16} className="dv-spin" />
                <span>Generating AI summary...</span>
              </div>
            ) : (
              <p className="dv-summary-text">{aiSummary}</p>
            )}
          </div>
        )}
      </div>

      {/* ---- chat fills the rest, composer docks at bottom ---- */}
      <VaultChat key={selected.uuid} vault={selected} />
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={null}>
      <DashboardInner />
    </Suspense>
  );
}
