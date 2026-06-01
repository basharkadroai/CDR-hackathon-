'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle, Users, Plus, X } from 'lucide-react';
import { cdrService } from '@/lib/cdr-service';
import toast from 'react-hot-toast';

export default function MultiSig() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [readers, setReaders] = useState<string[]>(['']);
  const [signers, setSigners] = useState<string[]>(['', '']);
  const [threshold, setThreshold] = useState('2');
  const [expiryDays, setExpiryDays] = useState('7');
  const [uploading, setUploading] = useState(false);
  const [vaultUuid, setVaultUuid] = useState('');

  const updateAt = (arr: string[], set: (v: string[]) => void, i: number, v: string) => {
    const next = [...arr];
    next[i] = v;
    set(next);
  };
  const removeAt = (arr: string[], set: (v: string[]) => void, i: number) =>
    set(arr.filter((_, idx) => idx !== i));

  const isAddr = (a: string) => /^0x[a-fA-F0-9]{40}$/.test(a.trim());

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const err = (m: string) => toast.error(m, { icon: <AlertCircle className="w-5 h-5" /> });

    if (!name.trim()) return err('Please name this multi-sig vault');
    if (!file) return err('Please upload a document');

    const validReaders = readers.map((r) => r.trim()).filter(Boolean);
    const validSigners = signers.map((s) => s.trim()).filter(Boolean);
    if (validReaders.some((r) => !isAddr(r))) return err('A reader address is invalid (0x...)');
    if (validSigners.length < 2) return err('Add at least two approver wallets');
    if (validSigners.some((s) => !isAddr(s))) return err('A signer address is invalid (0x...)');

    const thr = parseInt(threshold, 10);
    if (!thr || thr < 1 || thr > validSigners.length) {
      return err(`Threshold must be between 1 and ${validSigners.length}`);
    }

    setUploading(true);
    const t = toast.loading('Creating multi-sig vault on-chain…');
    try {
      const expiresAt = Date.now() + parseInt(expiryDays, 10) * 24 * 60 * 60 * 1000;
      const vault = await cdrService.uploadVault({
        file,
        name,
        type: 'multi-sig',
        authorizedWallets: validReaders,
        signers: validSigners,
        threshold: thr,
        expiresAt,
      });
      toast.success(`Multi-sig vault created — needs ${thr}-of-${validSigners.length} approvals`, {
        id: t,
        icon: <CheckCircle className="w-5 h-5" />,
        duration: 6000,
      });
      setVaultUuid(vault.uuid);
      setTimeout(() => router.push('/dashboard'), 1800);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create vault', {
        id: t,
        icon: <AlertCircle className="w-5 h-5" />,
        duration: 6000,
      });
    } finally {
      setUploading(false);
    }
  };

  const fieldCls = 'dv-input';

  return (
    <div className="dv-create">
      <main className="dv-create-main">
        <header className="dv-create-head">
          <h1 className="dv-page-title">Multi-Sig Vault</h1>
          <p className="dv-page-subtitle">
            A confidential document that unlocks only after an on-chain board approval — N-of-M signers
            must approve before CDR validators release the decryption. Enforced by the
            <code style={{ color: 'var(--dv-accent-2)' }}> DealVaultCondition</code> contract, no coordinator.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="dv-create-form space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--dv-text)] mb-2">Vault Name</label>
            <input className={fieldCls} value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Board-only acquisition memo" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--dv-text)] mb-2">Document</label>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className={`${fieldCls} file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[var(--dv-accent-2)] file:text-white file:text-sm file:font-medium file:transition-colors cursor-pointer`} />
            {file && <p className="mt-2 text-sm text-[var(--dv-muted)]">Selected: {file.name}</p>}
          </div>

          {/* Readers */}
          <div>
            <label className="block text-sm font-medium text-[var(--dv-text)] mb-2">
              Authorized Readers <span className="text-[var(--dv-faint)]">(who may open once approved)</span>
            </label>
            <div className="space-y-2">
              {readers.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <input className={`${fieldCls} font-mono text-sm`} value={r} placeholder="0x..."
                    onChange={(e) => updateAt(readers, setReaders, i, e.target.value)} />
                  {readers.length > 1 && (
                    <button type="button" onClick={() => removeAt(readers, setReaders, i)}
                      className="px-3 rounded-lg bg-[rgba(204,102,102,0.12)] text-[var(--dv-red)]"><X className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setReaders([...readers, ''])}
              className="mt-2 text-sm text-[var(--dv-accent-2)] inline-flex items-center gap-1"><Plus className="w-4 h-4" /> Add reader</button>
          </div>

          {/* Signers */}
          <div>
            <label className="block text-sm font-medium text-[var(--dv-text)] mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--dv-accent-2)]" /> Approver Wallets (signers)
            </label>
            <div className="space-y-2">
              {signers.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input className={`${fieldCls} font-mono text-sm`} value={s} placeholder="0x..."
                    onChange={(e) => updateAt(signers, setSigners, i, e.target.value)} />
                  {signers.length > 1 && (
                    <button type="button" onClick={() => removeAt(signers, setSigners, i)}
                      className="px-3 rounded-lg bg-[rgba(204,102,102,0.12)] text-[var(--dv-red)]"><X className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setSigners([...signers, ''])}
              className="mt-2 text-sm text-[var(--dv-accent-2)] inline-flex items-center gap-1"><Plus className="w-4 h-4" /> Add signer</button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--dv-text)] mb-2">Required Approvals</label>
              <input type="number" min={1} value={threshold} onChange={(e) => setThreshold(e.target.value)}
                className={fieldCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--dv-text)] mb-2">Access Window (days)</label>
              <input type="number" min={1} value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)}
                className={fieldCls} />
            </div>
          </div>

          <button type="submit" disabled={uploading}
            className="w-full dv-button disabled:bg-[var(--dv-line)] disabled:text-[var(--dv-faint)] disabled:cursor-not-allowed mt-2">
            {uploading ? (
              <span className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2"><Users className="w-5 h-5" /> Create Multi-Sig Vault</span>
            )}
          </button>

          {vaultUuid && (
            <div className="mt-2 p-4 bg-[rgba(127,170,110,0.1)] border border-[rgba(127,170,110,0.25)] rounded-lg">
              <p className="text-sm font-medium text-[#7faa6e] mb-1">Multi-Sig Vault Created!</p>
              <p className="text-xs text-[var(--dv-muted)]">Signers can now approve from the dashboard. UUID: {vaultUuid}</p>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
