'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Paperclip, ArrowUp, Loader2, X, FileText, Lock, Users, CheckCircle, Plus, Check } from 'lucide-react';
import { cdrService, ESCROW_GATE_ADDRESS, UploadVaultParams, VaultType, VaultStep } from '@/lib/cdr-service';
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

interface ProgressItem { step: VaultStep; label: string; done: boolean; detail?: string }

interface Msg {
  role: 'user' | 'assistant';
  content: string;
  action?: VaultAction | null;   // editable plan card
  planDone?: boolean;            // plan was confirmed → hide the form
  progress?: ProgressItem[];     // live "thinking chain"
}

const STEP_LABELS: Record<VaultStep, string> = {
  encrypt: 'Encrypting the document in your browser',
  allocate: 'Allocating the vault on-chain',
  protect: 'Threshold-encrypting the key to the validator network',
  write: 'Writing the protected key on-chain',
  done: 'Vault sealed',
};

const ESCROW_GATE = ESCROW_GATE_ADDRESS;

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

function expiresAtFromDays(days?: number) {
  return days ? Date.now() + days * 86400000 : undefined;
}

export default function Assistant() {
  const router = useRouter();
  const { walletAddress, connectWallet } = useWallet();
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);        // committed file (used to create the vault)
  const [draftFile, setDraftFile] = useState<File | null>(null); // pill shown in the composer until sent
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
    if ((!text && !draftFile) || thinking) return;

    // Commit the draft file (if any) so it's available for vault creation,
    // then clear the composer (text + pill) for the next message.
    const committedFile = draftFile ?? file;
    if (draftFile) setFile(draftFile);

    const alreadyNoted = messages.some((m) => m.content.includes('[user attached'));
    const userContent = draftFile && !alreadyNoted
      ? `${text}${text ? '\n' : ''}[user attached a file: ${draftFile.name}]`
      : text || `[user attached a file: ${committedFile?.name}]`;

    const next: Msg[] = [...messages, { role: 'user', content: userContent }];
    setMessages(next);
    setInput('');
    setDraftFile(null);
    setThinking(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })), walletAddress }),
      });
      const data = await res.json();
      const action: VaultAction | null = data.action && committedFile ? data.action : null;
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || 'Okay.', action }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Something went wrong. Try again, or use the sidebar.' }]);
    } finally {
      setThinking(false);
    }
  };

  // Confirm the (possibly edited) plan and create the vault with a live chain.
  const runAction = async (planIndex: number, action: VaultAction) => {
    if (!walletAddress) { await connectWallet(); return; }
    if (!file) { toast.error('Attach a document first.'); return; }
    setCreating(true);

    // mark the plan card as confirmed and start a fresh progress message
    let progIdx = 0;
    setMessages((prev) => {
      const copy = [...prev];
      if (copy[planIndex]) copy[planIndex] = { ...copy[planIndex], planDone: true };
      progIdx = copy.length; // index where the progress message will live
      copy.push({ role: 'assistant', content: '', progress: [] });
      return copy;
    });

    const setProgress = (updater: (p: ProgressItem[]) => ProgressItem[]) => {
      setMessages((prev) => {
        const copy = [...prev];
        const m = copy[progIdx];
        if (m) copy[progIdx] = { ...m, progress: updater(m.progress ?? []) };
        return copy;
      });
    };

    try {
      const params: UploadVaultParams = {
        file,
        name: action.name || 'Untitled vault',
        type: action.type,
        authorizedWallets: action.authorizedWallets,
        recipientWallet: action.recipientWallet,
        signers: action.signers,
        threshold: action.threshold,
        expiresAt: expiresAtFromDays(action.expiresDays),
        unlockAt: action.unlockAt ? new Date(action.unlockAt).getTime() : undefined,
        gate: action.requirePayment && ESCROW_GATE ? ESCROW_GATE : undefined,
      };

      const vault = await cdrService.uploadVault(params, (p) => {
        setProgress((items) => {
          const next = [...items];
          const i = next.findIndex((it) => it.step === p.step);
          if (p.status === 'start') {
            if (i === -1) next.push({ step: p.step, label: STEP_LABELS[p.step], done: false });
          } else {
            if (i === -1) next.push({ step: p.step, label: STEP_LABELS[p.step], done: true, detail: p.detail });
            else next[i] = { ...next[i], done: true, detail: p.detail ?? next[i].detail };
          }
          return next;
        });
      });

      setMessages((prev) => {
        const copy = [...prev];
        copy[progIdx] = { ...copy[progIdx], content: `Done — your ${TYPE_META[action.type].label} “${vault.name}” is live and protected by CDR. Opening it now…` };
        return copy;
      });
      toast.success(`${TYPE_META[action.type].label} created`, { icon: <CheckCircle className="w-5 h-5" /> });
      setTimeout(() => router.push(`/dashboard?v=${vault.uuid}`), 1400);
    } catch (error) {
      setMessages((prev) => {
        const copy = [...prev];
        copy[progIdx] = { ...copy[progIdx], content: `❌ ${error instanceof Error ? error.message : 'Failed to create vault'}` };
        return copy;
      });
    } finally {
      setCreating(false);
    }
  };

  const composer = (
    <div className="dv-composer">
      {draftFile && (
        <div className="dv-attach-pill">
          <Paperclip size={13} /> <span className="truncate">{draftFile.name}</span>
          <button onClick={() => setDraftFile(null)}><X size={13} /></button>
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
        <input ref={fileRef} type="file" className="hidden" onChange={(e) => setDraftFile(e.target.files?.[0] ?? null)} />
        <button className="dv-send-btn" onClick={send} disabled={thinking || (!input.trim() && !draftFile)} title="Send">
          {thinking ? <Loader2 size={16} className="dv-spin" /> : <ArrowUp size={16} />}
        </button>
      </div>
    </div>
  );

  // ----- empty state: centered greeting + composer (Claude home) -----
  if (!started) {
    return (
      <div className="dv-chat-empty">
        <div className="dv-chat-empty-inner">
          <div className="dv-hero-greeting">
            <Logo size={40} />
            <h1 className="dv-title">{greeting}</h1>
          </div>
          <div className="dv-composer-wrap">{composer}</div>
          <p className="dv-assistant-hint">
            The assistant creates real on-chain CDR vaults. Prefer to do it yourself? Use “New vault” in the sidebar.
          </p>
        </div>
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
                  {m.progress && m.progress.length > 0 && <ProgressChain items={m.progress} />}
                  {m.content && <div className="dv-msg-body">{m.content}</div>}
                  {m.action && !m.planDone && (
                    <PlanCard
                      action={m.action}
                      hasFile={!!file}
                      creating={creating}
                      onConfirm={(edited) => runAction(i, edited)}
                    />
                  )}
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

/* Live "thinking chain" — checklist of real CDR steps as they happen */
function ProgressChain({ items }: { items: ProgressItem[] }) {
  return (
    <div className="dv-chain">
      {items.map((it) => (
        <div key={it.step} className="dv-chain-item">
          <span className="dv-chain-icon">
            {it.done ? <Check size={14} /> : <Loader2 size={13} className="dv-spin" />}
          </span>
          <div className="dv-chain-text">
            <div className={`dv-chain-label ${it.done ? '' : 'is-active'}`}>{it.label}</div>
            {it.detail && <div className="dv-chain-detail">{it.detail}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* Claude-style planning card: the AI gathers everything, the user confirms in
   one click. Defaults to a clean read-only summary; "Adjust" reveals the form
   only if the AI got something wrong. */
function PlanCard({
  action, hasFile, creating, onConfirm,
}: { action: VaultAction; hasFile: boolean; creating: boolean; onConfirm: (a: VaultAction) => void }) {
  const meta = TYPE_META[action.type] ?? TYPE_META['deal-room'];
  const Icon = meta.icon;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(action.name ?? '');
  const [readers, setReaders] = useState((action.authorizedWallets ?? []).join(', '));
  const [recipient, setRecipient] = useState(action.recipientWallet ?? '');
  const [expiresDays, setExpiresDays] = useState(String(action.expiresDays ?? (action.type === 'deal-room' ? 7 : '')));
  const [unlockAt, setUnlockAt] = useState(action.unlockAt ? toLocalInput(action.unlockAt) : '');
  const [signers, setSigners] = useState((action.signers ?? []).join(', '));
  const [threshold, setThreshold] = useState(String(action.threshold ?? (action.type === 'multi-sig' ? 2 : '')));
  const [requirePayment, setRequirePayment] = useState(!!action.requirePayment);

  const splitAddrs = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
  const valid = (a: string) => /^0x[a-fA-F0-9]{40}$/.test(a);
  const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

  const submit = () => {
    if (!hasFile) { toast.error('Attach the document first (📎).'); return; }
    if (!name.trim()) { toast.error('Give the vault a name.'); return; }
    const rd = splitAddrs(readers), sg = splitAddrs(signers);
    if ([...rd, ...sg, ...(recipient ? [recipient] : [])].some((a) => !valid(a))) {
      toast.error('A wallet address looks invalid (0x + 40 hex).'); setEditing(true); return;
    }
    if (action.type === 'dead-drop' && (!recipient || !unlockAt)) { toast.error('Dead Drop needs a recipient and unlock date.'); setEditing(true); return; }
    if (action.type === 'multi-sig' && sg.length < 2) { toast.error('Add at least two signers.'); setEditing(true); return; }

    onConfirm({
      type: action.type,
      name: name.trim(),
      authorizedWallets: rd.length ? rd : undefined,
      recipientWallet: recipient || undefined,
      expiresDays: expiresDays ? Number(expiresDays) : undefined,
      unlockAt: unlockAt ? new Date(unlockAt).toISOString() : undefined,
      signers: sg.length ? sg : undefined,
      threshold: threshold ? Number(threshold) : undefined,
      requirePayment,
    });
  };

  // ----- read-only summary (default) — the "AI did it for you" view -----
  if (!editing) {
    const rd = splitAddrs(readers), sg = splitAddrs(signers);
    const rows: { label: string; value: string }[] = [{ label: 'Name', value: name || 'Untitled vault' }];
    if (action.type === 'deal-room' || action.type === 'multi-sig') {
      rows.push({ label: 'Readers', value: rd.length ? rd.map(shortAddr).join(', ') : 'Just you (the creator)' });
    }
    if (action.type === 'dead-drop') {
      rows.push({ label: 'Recipient', value: recipient ? shortAddr(recipient) : '—' });
      rows.push({ label: 'Unlocks', value: unlockAt ? new Date(unlockAt).toLocaleString() : '—' });
    }
    if (action.type === 'multi-sig') {
      rows.push({ label: 'Approvers', value: sg.length ? sg.map(shortAddr).join(', ') : '—' });
      rows.push({ label: 'Approvals needed', value: threshold ? `${threshold}-of-${sg.length || '?'}` : '—' });
    }
    if (action.type === 'deal-room' || action.type === 'multi-sig') {
      rows.push({ label: 'Access window', value: expiresDays ? `${expiresDays} days` : 'No expiry' });
    }
    if (action.type === 'deal-room' && requirePayment) {
      rows.push({ label: 'Unlock', value: 'Requires on-chain payment (escrow)' });
    }

    return (
      <div className="dv-plan">
        <div className="dv-plan-head"><Icon size={15} /> New {meta.label} <span className="dv-plan-hint">— ready to create</span></div>
        <div className="dv-plan-summary">
          {rows.map((r) => (
            <div key={r.label} className="dv-plan-srow">
              <span className="dv-plan-skey">{r.label}</span>
              <span className="dv-plan-sval">{r.value}</span>
            </div>
          ))}
        </div>
        {!hasFile && <p className="dv-plan-warn">📎 Attach the document below before creating.</p>}
        <div className="dv-plan-actions">
          <button className="dv-button dv-plan-create" onClick={submit} disabled={creating || !hasFile}>
            {creating ? <><Loader2 size={15} className="dv-spin" /> Creating…</> : <><Plus size={15} /> Create vault on-chain</>}
          </button>
          <button className="dv-plan-adjust" onClick={() => setEditing(true)} disabled={creating}>Adjust details</button>
        </div>
      </div>
    );
  }

  // ----- editable form (only when the user clicks "Adjust") -----
  return (
    <div className="dv-plan">
      <div className="dv-plan-head"><Icon size={15} /> New {meta.label} <span className="dv-plan-hint">— review &amp; edit, then create</span></div>

      <label className="dv-plan-field"><span>Name</span>
        <input className="dv-plan-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Vault name" />
      </label>

      {(action.type === 'deal-room' || action.type === 'multi-sig') && (
        <label className="dv-plan-field"><span>Authorized readers <em>(comma-separated 0x…)</em></span>
          <input className="dv-plan-input font-mono" value={readers} onChange={(e) => setReaders(e.target.value)} placeholder="0x…, 0x…" />
        </label>
      )}

      {action.type === 'dead-drop' && (
        <>
          <label className="dv-plan-field"><span>Recipient wallet</span>
            <input className="dv-plan-input font-mono" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="0x…" />
          </label>
          <label className="dv-plan-field"><span>Unlock date &amp; time</span>
            <input type="datetime-local" className="dv-plan-input" value={unlockAt} onChange={(e) => setUnlockAt(e.target.value)} />
          </label>
        </>
      )}

      {action.type === 'multi-sig' && (
        <>
          <label className="dv-plan-field"><span>Approver wallets <em>(comma-separated 0x…)</em></span>
            <input className="dv-plan-input font-mono" value={signers} onChange={(e) => setSigners(e.target.value)} placeholder="0x…, 0x…" />
          </label>
          <label className="dv-plan-field"><span>Approvals required</span>
            <input type="number" min={1} className="dv-plan-input" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
          </label>
        </>
      )}

      {(action.type === 'deal-room' || action.type === 'multi-sig') && (
        <label className="dv-plan-field"><span>Access window (days)</span>
          <input type="number" min={1} className="dv-plan-input" value={expiresDays} onChange={(e) => setExpiresDays(e.target.value)} />
        </label>
      )}

      {action.type === 'deal-room' && ESCROW_GATE && (
        <label className="dv-plan-toggle">
          <input type="checkbox" checked={requirePayment} onChange={(e) => setRequirePayment(e.target.checked)} />
          <span>Require on-chain payment to unlock (escrow)</span>
        </label>
      )}

      {!hasFile && <p className="dv-plan-warn">📎 Attach the document below before creating.</p>}

      <button className="dv-button w-full" onClick={submit} disabled={creating || !hasFile}>
        {creating ? <><Loader2 size={15} className="dv-spin" /> Creating…</> : <><Plus size={15} /> Create vault on-chain</>}
      </button>
    </div>
  );
}

// ISO → value usable by <input type="datetime-local">
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
