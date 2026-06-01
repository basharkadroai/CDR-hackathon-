'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle, Lock, Loader2, Clock, FileText, User } from 'lucide-react';
import { cdrService } from '@/lib/cdr-service';
import toast from 'react-hot-toast';

export default function DeadDrop() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [recipientWallet, setRecipientWallet] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const err = (m: string) => toast.error(m, { icon: <AlertCircle className="w-5 h-5" /> });

    if (!name.trim()) return err('Please name your Dead Drop');
    if (!file) return err('Please upload a document');
    if (!recipientWallet.match(/^0x[a-fA-F0-9]{40}$/)) return err('Invalid recipient address (0x...)');
    if (!unlockDate) return err('Please pick an unlock date & time');

    const unlockAt = new Date(unlockDate).getTime();
    if (unlockAt <= Date.now()) return err('Unlock date must be in the future');

    setUploading(true);
    const t = toast.loading('Sealing your Dead Drop on-chain…');
    try {
      await cdrService.uploadVault({ file, name, type: 'dead-drop', recipientWallet, unlockAt });
      const days = Math.ceil((unlockAt - Date.now()) / 86400000);
      toast.success(`Dead Drop sealed — unlocks in ${days} day${days !== 1 ? 's' : ''}`, {
        id: t, icon: <CheckCircle className="w-5 h-5" />, duration: 6000,
      });
      setTimeout(() => router.push('/dashboard'), 1600);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create Dead Drop', {
        id: t, icon: <AlertCircle className="w-5 h-5" />, duration: 6000,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="dv-create">
      <main className="dv-create-main">
        <header className="dv-create-head">
          <h1 className="dv-page-title">Create a Dead Drop</h1>
          <p className="dv-page-subtitle">
            A sealed document that opens for one recipient on a future date — not even you can open it early.
            The CDR condition contract enforces the unlock time on-chain.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="dv-create-form">
          <div className="dv-form-grid">
            {/* LEFT column */}
            <div className="dv-form-col">
              <div>
                <label className="dv-label"><FileText size={13} className="inline mr-1.5 -mt-0.5" />Document Name</label>
                <input className="dv-input" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Succession Plan" />
              </div>

              <div>
                <label className="dv-label"><User size={13} className="inline mr-1.5 -mt-0.5" />Recipient Wallet</label>
                <input className="dv-input font-mono text-[13px]" value={recipientWallet}
                  onChange={(e) => setRecipientWallet(e.target.value)} placeholder="0x..." />
              </div>

              <div>
                <label className="dv-label"><Clock size={13} className="inline mr-1.5 -mt-0.5" />Unlock Date & Time</label>
                <input type="datetime-local" className="dv-input" value={unlockDate}
                  onChange={(e) => setUnlockDate(e.target.value)} />
              </div>
            </div>

            {/* RIGHT column */}
            <div className="dv-form-col">
              <div>
                <label className="dv-label">Upload Document</label>
                <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="dv-input file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#4F9BBE] file:text-white file:text-sm file:font-medium cursor-pointer" />
                {file && <p className="mt-2 text-sm" style={{ color: 'var(--dv-muted)' }}>Selected: {file.name}</p>}
              </div>

              <div className="flex gap-3 p-4 rounded-xl"
                style={{ background: 'rgba(201,161,74,0.1)', border: '1px solid rgba(201,161,74,0.25)' }}>
                <AlertCircle size={18} style={{ color: 'var(--dv-amber)', flexShrink: 0, marginTop: 1 }} />
                <p className="text-sm leading-relaxed" style={{ color: '#d8c489' }}>
                  This is irreversible. Once sealed, nobody — including you — can open this vault until the
                  unlock date. The smart contract enforces it automatically.
                </p>
              </div>
            </div>
          </div>

          <button type="submit" disabled={uploading} className="dv-button w-full">
            {uploading ? (<><Loader2 size={17} className="dv-spin" /> Sealing…</>) : (<><Lock size={17} /> Seal Dead Drop</>)}
          </button>
        </form>
      </main>
    </div>
  );
}
