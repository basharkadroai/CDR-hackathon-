'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Paperclip, ArrowUp, Loader2, X, FileText, Lock, Users, CheckCircle } from 'lucide-react';
import { cdrService, UploadVaultParams, VaultType } from '@/lib/cdr-service';
import { useWallet } from '../context/WalletContext';
import toast from 'react-hot-toast';

interface VaultAction {
  type: VaultType;
  name?: string;
  authorizedWallets?: string[];
  recipientWallet?: string;
  expiresDays?: number;
  unlockAt?: string;
  signers?: string[];
  threshold?: number;
  requirePayment?: boolean;
}

interface Msg {
  role: 'user' | 'assistant';
  content: string;
  action?: VaultAction | null;
}

const ESCROW_GATE = process.env.NEXT_PUBLIC_ESCROW_GATE_ADDRESS;

const TYPE_META: Record<VaultType, { label: string; icon: typeof FileText }> = {
  'deal-room': { label: 'Deal Room', icon: FileText },
  'dead-drop': { label: 'Dead Drop', icon: Lock },
  'multi-sig': { label: 'Multi-Sig Vault', icon: Users },
};

export default function Assistant() {
  const router = useRouter();
  const { walletAddress, connectWallet } = useWallet();
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [thinking, setThinking] = useState(false);
  const [creating, setCreating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const send = async () => {
    const text = input.trim();
    if (!text && !file) return;

    const userContent = file && !messages.some((m) => m.content.includes('[attached'))
      ? `${text}${text ? '\n' : ''}[user attached a file: ${file.name}]`
      : text;

    const next: Msg[] = [...messages, { role: 'user', content: userContent || `[user attached a file: ${file?.name}]` }];
    setMessages(next);
    setInput('');
    setThinking(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      // if assistant proposed an action but no file is attached, override to ask
      const action: VaultAction | null = data.action && file ? data.action : null;
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || 'Okay.', action }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Something went wrong. Try again, or use the sidebar.' }]);
    } finally {
      setThinking(false);
    }
  };

  const runAction = async (action: VaultAction) => {
    if (!walletAddress) { await connectWallet(); return; }
    if (!file) { toast.error('Attach a document first.'); return; }

    setCreating(true);
    const t = toast.loading('Creating your vault on-chain…');
    try {
      const params: UploadVaultParams = {
        file,
        name: action.name || 'Untitled vault',
        type: action.type,
        authorizedWallets: action.authorizedWallets,
        recipientWallet: action.recipientWallet,
        signers: action.signers,
        threshold: action.threshold,
        expiresAt: action.expiresDays ? Date.now() + action.expiresDays * 86400000 : undefined,
        unlockAt: action.unlockAt ? new Date(action.unlockAt).getTime() : undefined,
        gate: action.requirePayment && ESCROW_GATE ? ESCROW_GATE : undefined,
      };
      const vault = await cdrService.uploadVault(params);
      toast.success(`${TYPE_META[action.type].label} created`, { id: t, icon: <CheckCircle className="w-5 h-5" /> });
      setMessages((prev) => [...prev, { role: 'assistant', content: `✅ Created “${vault.name}”. Opening your vaults…` }]);
      setTimeout(() => router.push('/dashboard'), 1200);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create vault', { id: t });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="dv-assistant">
      {messages.length > 0 && (
        <div className="dv-chat">
          {messages.map((m, i) => (
            <div key={i} className={`dv-msg ${m.role}`}>
              <div className="dv-msg-body">{m.content}</div>
              {m.action && (
                <ActionCard action={m.action} creating={creating} onConfirm={() => runAction(m.action!)} />
              )}
            </div>
          ))}
          {thinking && (
            <div className="dv-msg assistant">
              <div className="dv-msg-body flex items-center gap-2" style={{ color: 'var(--dv-muted)' }}>
                <Loader2 size={15} className="dv-spin" /> Thinking…
              </div>
            </div>
          )}
        </div>
      )}

      <div className="dv-command-card">
        {file && (
          <div className="dv-attach-pill">
            <Paperclip size={13} /> <span className="truncate">{file.name}</span>
            <button onClick={() => setFile(null)}><X size={13} /></button>
          </div>
        )}
        <textarea
          className="dv-composer-input"
          placeholder="Describe the vault you want — e.g. “Create a deal room for our Series A, readable by 0x… for 30 days”"
          value={input}
          rows={1}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); }
          }}
        />
        <div className="dv-composer-row">
          <button className="dv-icon-btn" onClick={() => fileRef.current?.click()} title="Attach document">
            <Paperclip size={18} />
          </button>
          <input ref={fileRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <button className="dv-send-btn" onClick={send} disabled={thinking || (!input.trim() && !file)} title="Send">
            {thinking ? <Loader2 size={16} className="dv-spin" /> : <ArrowUp size={16} />}
          </button>
        </div>
      </div>
      <p className="dv-assistant-hint">
        The assistant creates real on-chain CDR vaults. Prefer to do it yourself? Use “New vault” in the sidebar.
      </p>
    </div>
  );
}

function ActionCard({ action, creating, onConfirm }: { action: VaultAction; creating: boolean; onConfirm: () => void }) {
  const meta = TYPE_META[action.type] ?? TYPE_META['deal-room'];
  const Icon = meta.icon;
  return (
    <div className="dv-action-card">
      <div className="dv-action-head"><Icon size={15} /> {meta.label}</div>
      <dl className="dv-action-grid">
        {action.name && (<><dt>Name</dt><dd>{action.name}</dd></>)}
        {action.authorizedWallets?.length ? (<><dt>Readers</dt><dd className="font-mono text-xs">{action.authorizedWallets.join(', ')}</dd></>) : null}
        {action.recipientWallet && (<><dt>Recipient</dt><dd className="font-mono text-xs">{action.recipientWallet}</dd></>)}
        {action.expiresDays && (<><dt>Expires</dt><dd>{action.expiresDays} days</dd></>)}
        {action.unlockAt && (<><dt>Unlocks</dt><dd>{new Date(action.unlockAt).toLocaleString()}</dd></>)}
        {action.signers?.length ? (<><dt>Signers</dt><dd className="font-mono text-xs">{action.signers.join(', ')}</dd></>) : null}
        {action.threshold && (<><dt>Approvals</dt><dd>{action.threshold} required</dd></>)}
        {action.requirePayment && (<><dt>Gate</dt><dd>Pay-to-unlock escrow</dd></>)}
      </dl>
      <button className="dv-button w-full" onClick={onConfirm} disabled={creating}>
        {creating ? <><Loader2 size={15} className="dv-spin" /> Creating…</> : 'Confirm & create on-chain'}
      </button>
    </div>
  );
}
