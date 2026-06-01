'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Paperclip, ArrowUp, Loader2, X, FileText, Lock, Users, CheckCircle } from 'lucide-react';
import { cdrService, UploadVaultParams, VaultType } from '@/lib/cdr-service';
import { useWallet } from '../context/WalletContext';
import Logo from './Logo';
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

function partOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 18) return 'Afternoon';
  return 'Evening';
}

export default function Assistant() {
  const router = useRouter();
  const { walletAddress, connectWallet } = useWallet();
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [thinking, setThinking] = useState(false);
  const [creating, setCreating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const started = messages.length > 0;
  const greeting = walletAddress ? `${partOfDay()}. Your vault is ready.` : `${partOfDay()}. Let's secure a deal.`;

  // auto-grow textarea
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [input]);

  // scroll to newest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  // Keep focus in the composer across the empty→chat transition (the textarea
  // remounts when the layout switches, which would otherwise drop focus).
  useEffect(() => {
    taRef.current?.focus();
  }, [started, thinking]);

  const send = async () => {
    const text = input.trim();
    if ((!text && !file) || thinking) return;

    const noteFile = file && !messages.some((m) => m.content.includes('[user attached'));
    const userContent = noteFile
      ? `${text}${text ? '\n' : ''}[user attached a file: ${file!.name}]`
      : text || `[user attached a file: ${file?.name}]`;

    const next: Msg[] = [...messages, { role: 'user', content: userContent }];
    setMessages(next);
    setInput('');
    setThinking(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
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

  const composer = (
    <div className="dv-composer">
      {file && (
        <div className="dv-attach-pill">
          <Paperclip size={13} /> <span className="truncate">{file.name}</span>
          <button onClick={() => setFile(null)}><X size={13} /></button>
        </div>
      )}
      <textarea
        ref={taRef}
        className="dv-composer-input"
        placeholder="Describe the vault you want to create…"
        value={input}
        rows={1}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
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
  );

  // ----- empty state: centered greeting + composer (Claude home) -----
  if (!started) {
    return (
      <div className="dv-chat-empty">
        <div className="dv-hero-greeting">
          <Logo size={40} />
          <h1 className="dv-title">{greeting}</h1>
        </div>
        <div className="dv-composer-wrap">{composer}</div>
        <p className="dv-assistant-hint">
          The assistant creates real on-chain CDR vaults. Prefer to do it yourself? Use “New vault” in the sidebar.
        </p>
      </div>
    );
  }

  // ----- conversation state: scrolling thread + docked composer -----
  return (
    <div className="dv-chat-view">
      <div className="dv-chat-scroll">
        <div className="dv-chat-col">
          {messages.map((m, i) => (
            <div key={i} className={`dv-msg ${m.role}`}>
              {m.role === 'assistant' ? (
                <div className="dv-msg-content">
                  <div className="dv-msg-name">DealVault</div>
                  <div className="dv-msg-body">{m.content}</div>
                  {m.action && <ActionCard action={m.action} creating={creating} onConfirm={() => runAction(m.action!)} />}
                </div>
              ) : (
                <div className="dv-msg-body">{m.content}</div>
              )}
            </div>
          ))}
          {thinking && (
            <div className="dv-msg assistant">
              <div className="dv-msg-content">
                <div className="dv-msg-name">DealVault</div>
                <div className="dv-typing"><span></span><span></span><span></span></div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>
      <div className="dv-chat-dock">
        <div className="dv-composer-wrap">{composer}</div>
      </div>
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
