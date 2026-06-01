'use client';

/* eslint-disable react-hooks/purity, react-hooks/set-state-in-effect */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Vault, ExternalLink, AlertCircle, Loader2, Copy, Check,
  FileText, Lock, Users, Clock, CalendarClock, ShieldCheck, ArrowUp, Sparkles,
} from 'lucide-react';
import { cdrService, VaultMetadata } from '@/lib/cdr-service';
import { useWallet } from '../context/WalletContext';
import toast from 'react-hot-toast';

const SUGGESTIONS = [
  'Summarize this vault for me',
  'Who can access it and when?',
  'How is it protected on-chain?',
];

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
      {msgs.length === 0 ? (
        <div className="dv-vchat-suggest">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="dv-vchat-chip" onClick={() => ask(s)}>{s}</button>
          ))}
        </div>
      ) : (
        <div className="dv-vchat-thread">
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
        </div>
      )}
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
  );
}

function DashboardInner() {
  const params = useSearchParams();
  const selectedUuid = params.get('v');
  const [vaults, setVaults] = useState<VaultMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { walletAddress, connectWallet, isConnecting } = useWallet();

  const now = useMemo(() => Date.now(), []);

  const loadVaults = useCallback(async () => {
    if (!walletAddress) return;
    try {
      setLoading(true);
      setVaults(await cdrService.listUserVaults(walletAddress));
    } catch {
      toast.error('Failed to load your vaults.', { icon: <AlertCircle className="w-5 h-5" /> });
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) void loadVaults();
    else queueMicrotask(() => setLoading(false));
  }, [walletAddress, loadVaults]);

  const formatTimeRemaining = (ts: number) => {
    const diff = ts - now;
    if (diff <= 0) return 'Expired';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
  };

  const handleAccessVault = async (uuid: string, vaultName: string, fileName?: string) => {
    const t = toast.loading(`Accessing ${vaultName}… (collecting validator decryptions)`);
    try {
      const blob = await cdrService.accessVault(uuid);
      const url = URL.createObjectURL(blob);
      toast.success('Decrypted via CDR — downloading file', { id: t });
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || `dealvault-${uuid}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (error) {
      let msg = 'Failed to access vault. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('not found')) msg = 'Vault not found.';
        else if (/unauthorized|access denied/.test(error.message)) msg = 'Access denied. You are not authorized to view this vault.';
        else if (error.message.includes('expired')) msg = 'This vault has expired.';
        else if (error.message.includes('sealed')) msg = 'This vault is sealed and cannot be opened yet.';
        else msg = error.message;
      }
      toast.error(msg, { id: t, icon: <AlertCircle className="w-5 h-5" />, duration: 5000 });
    }
  };

  const handleApprove = async (uuid: string) => {
    const t = toast.loading('Submitting on-chain approval…');
    try {
      const { approvals } = await cdrService.approveMultiSigVault(uuid);
      toast.success(`Approval recorded on-chain (${approvals} total)`, { id: t });
      void loadVaults();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Approval failed', { id: t, icon: <AlertCircle className="w-5 h-5" />, duration: 5000 });
    }
  };

  const copyUuid = (uuid: string) => {
    navigator.clipboard.writeText(uuid);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success('UUID copied', { duration: 1500 });
  };

  const explorerUrl = (txHash?: string) => (txHash ? `https://aeneid.storyscan.io/tx/${txHash}` : null);
  const typeMeta = (t: VaultMetadata['type']) =>
    t === 'deal-room' ? { label: 'Deal Room', Icon: FileText } : t === 'dead-drop' ? { label: 'Dead Drop', Icon: Lock } : { label: 'Multi-Sig', Icon: Users };
  const statusStyle = (s: VaultMetadata['status']) =>
    s === 'active' ? { background: 'rgba(127,170,110,0.15)', color: 'var(--dv-green)' }
      : s === 'sealed' ? { background: 'rgba(201,161,74,0.15)', color: 'var(--dv-amber)' }
        : { background: 'rgba(204,102,102,0.15)', color: 'var(--dv-red)' };

  const selected = vaults.find((v) => v.uuid === selectedUuid) || null;

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

  return (
    <div className="dv-shell">
      <main className="dv-detail">
        <div className="dv-detail-card">
          <div className="dv-detail-head">
            <div className="dv-detail-titlewrap">
              <span className="dv-detail-typeicon"><Icon size={20} /></span>
              <div>
                <h1 className="dv-detail-title">{selected.name}</h1>
                <div className="dv-detail-tags">
                  <span className="dv-detail-tag">{label}</span>
                  <span className="dv-detail-tag capitalize" style={statusStyle(selected.status)}>{selected.status}</span>
                </div>
              </div>
            </div>
          </div>

          <dl className="dv-detail-meta">
            <div><dt>Created</dt><dd>{new Date(selected.createdAt).toLocaleString()}</dd></div>
            {selected.fileName && <div><dt>File</dt><dd>{selected.fileName}</dd></div>}
            {selected.expiresAt && <div><dt><Clock size={12} className="inline mr-1 -mt-0.5" />Expires</dt><dd>{formatTimeRemaining(selected.expiresAt)}</dd></div>}
            {selected.unlockAt && <div><dt><CalendarClock size={12} className="inline mr-1 -mt-0.5" />Unlock</dt><dd>{selected.unlockAt > now ? `in ${formatTimeRemaining(selected.unlockAt)}` : 'Unlocked'}</dd></div>}
            {selected.recipientWallet && <div><dt>Recipient</dt><dd className="font-mono text-xs">{selected.recipientWallet}</dd></div>}
            {selected.authorizedWallets && selected.authorizedWallets.length > 0 && (
              <div><dt>Authorized</dt><dd className="font-mono text-xs">{selected.authorizedWallets.join(', ')}</dd></div>
            )}
            <div>
              <dt><ShieldCheck size={12} className="inline mr-1 -mt-0.5" />CDR enforcement</dt>
              <dd>{selected.enforcementMode === 'custom-condition-contract' ? 'on-chain condition contract' : selected.enforcementMode === 'owner-only-fallback' ? 'owner-only' : 'mock demo'}</dd>
            </div>
          </dl>

          <div className="dv-detail-uuid">
            <code>UUID {selected.uuid}</code>
            <button onClick={() => copyUuid(selected.uuid)} className="dv-copy-btn" title="Copy UUID">
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>

          <div className="dv-detail-actions">
            {selected.type === 'multi-sig' && (
              <button onClick={() => handleApprove(selected.uuid)} className="dv-button-secondary" title="Record an on-chain approval (eligible signers only)">
                Approve (sign)
              </button>
            )}
            <button onClick={() => handleAccessVault(selected.uuid, selected.name, selected.fileName)} disabled={sealed || expired} className="dv-button">
              {sealed ? 'Sealed' : expired ? 'Expired' : 'Access Vault'}
            </button>
            {explorerUrl(selected.txHash) && (
              <a href={explorerUrl(selected.txHash)!} target="_blank" rel="noopener noreferrer" className="dv-button-secondary">
                <ExternalLink size={14} /> Explorer
              </a>
            )}
          </div>

          <div className="dv-detail-chat-head"><Sparkles size={13} /> Ask DealVault about this vault</div>
          <VaultChat key={selected.uuid} vault={selected} />
        </div>
      </main>
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
