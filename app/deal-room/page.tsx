'use client';

import { useState, useRef, DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Vault, CheckCircle, AlertCircle, X, Plus, Upload, Clock, Shield,
  FileText, Loader2, Coins,
} from 'lucide-react';
import { cdrService } from '@/lib/cdr-service';
import toast from 'react-hot-toast';

const ESCROW_GATE = process.env.NEXT_PUBLIC_ESCROW_GATE_ADDRESS;

export default function DealRoom() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [wallets, setWallets] = useState<string[]>(['']);
  const [expiryDays, setExpiryDays] = useState('7');
  const [requirePayment, setRequirePayment] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) setFiles(Array.from(e.dataTransfer.files));
  };
  const removeFile = (i: number) => setFiles(files.filter((_, idx) => idx !== i));
  const updateWallet = (i: number, v: string) => {
    const next = [...wallets]; next[i] = v; setWallets(next);
  };
  const removeWallet = (i: number) => setWallets(wallets.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const err = (m: string) => toast.error(m, { icon: <AlertCircle className="w-5 h-5" /> });

    if (!name.trim()) return err('Please provide a name for your Deal Room');
    if (files.length === 0) return err('Please upload at least one document');
    const validWallets = wallets.filter((w) => w.trim().length > 0);
    if (validWallets.length === 0) return err('Please add at least one authorized wallet');
    if (validWallets.some((w) => !w.match(/^0x[a-fA-F0-9]{40}$/))) {
      return err('Some wallet addresses are invalid (0x...)');
    }

    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });
    const t = toast.loading(`Uploading file 1 of ${files.length}…`);

    try {
      const expiresAt = Date.now() + parseInt(expiryDays, 10) * 24 * 60 * 60 * 1000;
      for (let i = 0; i < files.length; i++) {
        setUploadProgress({ current: i + 1, total: files.length });
        toast.loading(`Uploading ${i + 1} of ${files.length}: ${files[i].name}`, { id: t });
        await cdrService.uploadVault({
          file: files[i],
          name: `${name} - ${files[i].name}`,
          type: 'deal-room',
          authorizedWallets: validWallets,
          expiresAt,
          gate: requirePayment ? ESCROW_GATE : undefined,
        });
      }
      toast.success(`Deal Room created — ${files.length} file${files.length > 1 ? 's' : ''} uploaded`, {
        id: t, icon: <CheckCircle className="w-5 h-5" />, duration: 5000,
      });
      setTimeout(() => router.push('/dashboard'), 1400);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create Deal Room', {
        id: t, icon: <AlertCircle className="w-5 h-5" />, duration: 6000,
      });
    } finally {
      setUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  const durations = [
    { value: '1', label: '24 hours' },
    { value: '7', label: '7 days' },
    { value: '30', label: '30 days' },
    { value: '90', label: '90 days' },
  ];
  const fmtSize = (b: number) =>
    b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

  return (
    <div className="dv-create">
      <main className="dv-create-main">
        <header className="dv-create-head">
          <h1 className="dv-page-title">Create a Deal Room</h1>
          <p className="dv-page-subtitle">
            Time-limited document sharing with wallet-gated access — enforced on-chain by Story CDR.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="dv-create-form">
          <div className="dv-form-grid">
            {/* LEFT column */}
            <div className="dv-form-col">
              <div>
                <label className="dv-label"><FileText size={13} className="inline mr-1.5 -mt-0.5" />Room Name</label>
                <input className="dv-input" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Series A — Q2 2026" />
              </div>

              <div>
                <label className="dv-label"><Shield size={13} className="inline mr-1.5 -mt-0.5" />Authorized Wallets</label>
                <div className="space-y-2">
                  {wallets.map((w, i) => (
                    <div key={i} className="flex gap-2">
                      <input className="dv-input font-mono text-[13px]" value={w} placeholder="0x..."
                        onChange={(e) => updateWallet(i, e.target.value)} />
                      {wallets.length > 1 && (
                        <button type="button" onClick={() => removeWallet(i)}
                          className="px-3 rounded-lg shrink-0" style={{ background: 'rgba(204,102,102,0.12)', color: 'var(--dv-red)' }}><X size={15} /></button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => setWallets([...wallets, ''])}
                  className="mt-2 text-sm inline-flex items-center gap-1.5" style={{ color: 'var(--dv-accent-2)' }}>
                  <Plus size={14} /> Add another wallet
                </button>
              </div>

              <div>
                <label className="dv-label"><Clock size={13} className="inline mr-1.5 -mt-0.5" />Access Duration</label>
                <div className="grid grid-cols-2 gap-2">
                  {durations.map((o) => (
                    <button type="button" key={o.value} onClick={() => setExpiryDays(o.value)}
                      className="py-2.5 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        background: expiryDays === o.value ? 'var(--dv-accent-soft)' : 'var(--dv-bg)',
                        border: `1px solid ${expiryDays === o.value ? 'var(--dv-accent-line)' : 'var(--dv-line)'}`,
                        color: expiryDays === o.value ? 'var(--dv-accent-2)' : 'var(--dv-muted)',
                      }}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT column — documents */}
            <div className="dv-form-col">
              <label className="dv-label"><Upload size={13} className="inline mr-1.5 -mt-0.5" />Documents</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                className="dv-dropzone"
                style={{ borderColor: isDragging ? 'var(--dv-accent)' : 'var(--dv-line)',
                         background: isDragging ? 'var(--dv-accent-soft)' : 'transparent' }}
              >
                <Upload size={22} style={{ color: 'var(--dv-accent-2)', margin: '0 auto 8px' }} />
                <p className="text-sm" style={{ color: 'var(--dv-text)' }}>
                  {isDragging ? 'Drop files here' : 'Drag & drop files, or browse'}
                </p>
                <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" />
              </div>
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                      style={{ background: 'var(--dv-bg)', border: '1px solid var(--dv-line)' }}>
                      <FileText size={15} style={{ color: 'var(--dv-green)', flexShrink: 0 }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate" style={{ color: 'var(--dv-text)' }}>{f.name}</div>
                        <div className="text-xs" style={{ color: 'var(--dv-faint)' }}>{fmtSize(f.size)}</div>
                      </div>
                      <button type="button" onClick={() => removeFile(i)} style={{ color: 'var(--dv-faint)' }}><X size={15} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Composability: pay-to-unlock escrow gate (full width) */}
          {ESCROW_GATE && (
            <button type="button" onClick={() => setRequirePayment((v) => !v)}
              className="w-full flex items-start gap-3 p-4 rounded-xl text-left transition-colors"
              style={{
                background: requirePayment ? 'var(--dv-accent-soft)' : 'var(--dv-bg)',
                border: `1px solid ${requirePayment ? 'var(--dv-accent-line)' : 'var(--dv-line)'}`,
              }}>
              <Coins size={18} style={{ color: 'var(--dv-accent-2)', marginTop: 2 }} />
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: 'var(--dv-text)' }}>
                  Require on-chain payment to unlock {requirePayment ? '· enabled' : ''}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--dv-muted)' }}>
                  Composes the vault with our EscrowAccessGate contract — readers must fund escrow on-chain
                  before CDR releases the document. Trustless pay-to-unlock.
                </div>
              </div>
              <div className="w-9 h-5 rounded-full flex items-center px-0.5 transition-all"
                style={{ background: requirePayment ? 'var(--dv-accent)' : 'var(--dv-line)' }}>
                <div className="w-4 h-4 rounded-full bg-white transition-all"
                  style={{ marginLeft: requirePayment ? '16px' : '0' }} />
              </div>
            </button>
          )}

          <button type="submit" disabled={uploading} className="dv-button w-full">
            {uploading ? (
              <><Loader2 size={17} className="dv-spin" />
                {uploadProgress.total > 0 ? `Uploading ${uploadProgress.current} of ${uploadProgress.total}…` : 'Creating…'}</>
            ) : (<><Vault size={17} /> Create Deal Room</>)}
          </button>

          {uploadProgress.total > 0 && (
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--dv-line)' }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%`, background: 'var(--dv-accent)' }} />
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
