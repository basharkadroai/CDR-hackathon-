'use client';

/* eslint-disable react-hooks/purity, react-hooks/set-state-in-effect */

import { Suspense, forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Vault, ExternalLink, Loader2, Copy, Check,
  FileText, Lock, Users, ArrowUp, ChevronDown, Trash2,
} from 'lucide-react';
import { cdrService, VaultMetadata } from '@/lib/cdr-service';
import { useWallet } from '../context/WalletContext';
import { useVaults } from '../context/VaultsContext';


export interface VaultChatHandle { notify: (text: string) => void; }

const VaultChat = forwardRef<VaultChatHandle, { vault: VaultMetadata }>(function VaultChat({ vault }, ref) {
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [thinking, setThinking] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Let the page post access/approval updates straight into this chat.
  useImperativeHandle(ref, () => ({
    notify: (text: string) => setMsgs((p) => [...p, { role: 'assistant', content: text }]),
  }), []);

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
});

function DashboardInner() {
  const router = useRouter();
  const params = useSearchParams();
  const selectedUuid = params.get('v');
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<'' | 'access' | 'approve' | 'delete'>('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const chatRef = useRef<VaultChatHandle>(null);
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
  const { vaults, loadingVaults, refreshVaults } = useVaults();

  const now = useMemo(() => Date.now(), []);
  const selected = vaults.find((v) => v.uuid === selectedUuid) || null;

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
    setBusy('access');
    chatRef.current?.notify('Accessing the vault — collecting validator decryptions…');
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
      chatRef.current?.notify('✅ Decrypted via CDR — your file just downloaded. Expiry blocks future decryptions, not copies already saved.');
    } catch (error) {
      let msg = 'Failed to access this vault. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('not found')) msg = 'Vault not found.';
        else if (/unauthorized|access denied/.test(error.message)) msg = 'Access denied — you are not authorized to open this vault.';
        else if (error.message.includes('expired')) msg = 'This vault has expired.';
        else if (error.message.includes('sealed')) msg = 'This vault is sealed and cannot be opened yet.';
        else if (/partial|timed out/i.test(error.message)) msg = 'Could not collect validator decryptions right now — please try again in a moment.';
        else msg = error.message;
      }
      chatRef.current?.notify(`⚠️ ${msg}`);
    } finally {
      setBusy('');
    }
  };

  const handleApprove = async (uuid: string) => {
    setBusy('approve');
    chatRef.current?.notify('Submitting your on-chain approval…');
    try {
      const { approvals } = await cdrService.approveMultiSigVault(uuid);
      chatRef.current?.notify(`✅ Approval recorded on-chain (${approvals} total).`);
      void refreshVaults({ showSpinner: false });
    } catch (error) {
      chatRef.current?.notify(`⚠️ ${error instanceof Error ? error.message : 'Approval failed'}`);
    } finally {
      setBusy('');
    }
  };

  const handleDeleteVault = async (vault: VaultMetadata) => {
    const ok = window.confirm(
      `Delete "${vault.name}" from DealVault?\n\nThis removes the app listing and cached encrypted file. The on-chain transaction history cannot be deleted.`,
    );
    if (!ok) return;
    setBusy('delete');
    setDetailsOpen(false);
    try {
      await cdrService.deleteVault(vault.uuid);
      router.push('/dashboard');
    } finally {
      setBusy('');
    }
  };

  const copyUuid = (uuid: string) => {
    navigator.clipboard.writeText(uuid);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const explorerUrl = (txHash?: string) => (txHash ? `https://aeneid.storyscan.io/tx/${txHash}` : null);
  const typeMeta = (t: VaultMetadata['type']) =>
    t === 'deal-room' ? { label: 'Secure Share', Icon: FileText } : t === 'dead-drop' ? { label: 'Dead Drop', Icon: Lock } : { label: 'Multi-Sig', Icon: Users };
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
  if (loadingVaults && vaults.length === 0) {
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
              <button onClick={() => handleApprove(selected.uuid)} disabled={busy !== ''} className="dv-button-secondary" title="Record an on-chain approval (eligible signers only)">
                {busy === 'approve' ? <><Loader2 size={14} className="dv-spin" /> Approving…</> : 'Approve'}
              </button>
            )}
            <button onClick={() => handleAccessVault(selected.uuid, selected.name, selected.fileName)} disabled={sealed || expired || busy !== ''} className="dv-button">
              {busy === 'access' ? <><Loader2 size={14} className="dv-spin" /> Accessing…</> : busy === 'delete' ? <><Loader2 size={14} className="dv-spin" /> Deleting…</> : sealed ? 'Sealed' : expired ? 'Expired' : 'Access Vault'}
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
                    <>
                      <div className="dv-details-row" title="Expiry stops future CDR decryptions — it can't revoke a copy already downloaded."><span>Expires</span><b>{formatTimeRemaining(selected.expiresAt)}</b></div>
                      <div className="dv-details-row"><span>Expiry limit</span><b title="Expiry blocks future CDR decryptions, but cannot claw back files already downloaded.">No clawback after download</b></div>
                    </>
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
                    <div className="dv-details-row"><span>Composable gate</span><b className="font-mono" title={selected.gate}>{selected.gate.slice(0, 6)}…{selected.gate.slice(-4)}</b></div>
                  )}
                  <div className="dv-details-row"><span>CDR enforcement</span><b title={enforcementLabel}>{enforcementLabel}</b></div>
                  <div className="dv-details-row">
                    <span>Vault UUID</span>
                    <b className="dv-details-uuid">
                      <span className="font-mono">{selected.uuid}</span>
                      <button onClick={() => copyUuid(selected.uuid)} className="dv-copy-inline" title="Copy UUID">{copied ? <Check size={13} /> : <Copy size={13} />}</button>
                    </b>
                  </div>
                  <button
                    type="button"
                    className="dv-details-delete"
                    onClick={() => void handleDeleteVault(selected)}
                    disabled={busy !== ''}
                  >
                    {busy === 'delete' ? <Loader2 size={14} className="dv-spin" /> : <Trash2 size={14} />}
                    Delete vault
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
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
      <VaultChat key={selected.uuid} ref={chatRef} vault={selected} />
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
