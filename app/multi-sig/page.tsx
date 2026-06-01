'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Vault, CheckCircle, AlertCircle, Users, Plus, X } from 'lucide-react';
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

  const fieldCls =
    'w-full px-4 py-3 bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg text-[#e8e8e8] placeholder-[#6b6b6b] focus:outline-none focus:ring-2 focus:ring-[#4F9BBE] focus:border-transparent transition-all';

  return (
    <div className="dv-shell">
      <nav className="border-b border-white/10 bg-[#1f1f1e]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Vault className="w-6 h-6 text-[#f0b17a]" />
              <span className="text-lg font-semibold text-[#f1eee8]">DealVault</span>
            </Link>
            <Link href="/dashboard" className="dv-button-secondary text-sm">← Dashboard</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="dv-page-title mb-3">Multi-Sig Vault</h1>
          <p className="dv-page-subtitle">
            A confidential document that unlocks only after an on-chain board approval — N-of-M signers
            must approve before CDR validators release the decryption. Enforced by the
            <code className="text-[#f0b17a]"> DealVaultCondition</code> contract, no coordinator.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="dv-panel p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#e8e8e8] mb-2">Vault Name</label>
            <input className={fieldCls} value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Board-only acquisition memo" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#e8e8e8] mb-2">Document</label>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className={`${fieldCls} file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#4F9BBE] file:text-white file:text-sm file:font-medium hover:file:bg-[#3d8aad] file:transition-colors cursor-pointer`} />
            {file && <p className="mt-2 text-sm text-[#9b9b9b]">Selected: {file.name}</p>}
          </div>

          {/* Readers */}
          <div>
            <label className="block text-sm font-medium text-[#e8e8e8] mb-2">
              Authorized Readers <span className="text-[#6b6b6b]">(who may open once approved)</span>
            </label>
            <div className="space-y-2">
              {readers.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <input className={`${fieldCls} font-mono text-sm`} value={r} placeholder="0x..."
                    onChange={(e) => updateAt(readers, setReaders, i, e.target.value)} />
                  {readers.length > 1 && (
                    <button type="button" onClick={() => removeAt(readers, setReaders, i)}
                      className="px-3 rounded-lg bg-[#4d1a1a] text-[#ff7d7d]"><X className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setReaders([...readers, ''])}
              className="mt-2 text-sm text-[#4F9BBE] inline-flex items-center gap-1"><Plus className="w-4 h-4" /> Add reader</button>
          </div>

          {/* Signers */}
          <div>
            <label className="block text-sm font-medium text-[#e8e8e8] mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#f0b17a]" /> Approver Wallets (signers)
            </label>
            <div className="space-y-2">
              {signers.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input className={`${fieldCls} font-mono text-sm`} value={s} placeholder="0x..."
                    onChange={(e) => updateAt(signers, setSigners, i, e.target.value)} />
                  {signers.length > 1 && (
                    <button type="button" onClick={() => removeAt(signers, setSigners, i)}
                      className="px-3 rounded-lg bg-[#4d1a1a] text-[#ff7d7d]"><X className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setSigners([...signers, ''])}
              className="mt-2 text-sm text-[#4F9BBE] inline-flex items-center gap-1"><Plus className="w-4 h-4" /> Add signer</button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#e8e8e8] mb-2">Required Approvals</label>
              <input type="number" min={1} value={threshold} onChange={(e) => setThreshold(e.target.value)}
                className={fieldCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#e8e8e8] mb-2">Access Window (days)</label>
              <input type="number" min={1} value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)}
                className={fieldCls} />
            </div>
          </div>

          <button type="submit" disabled={uploading}
            className="w-full dv-button disabled:bg-[#2d2d2d] disabled:text-[#6b6b6b] disabled:cursor-not-allowed mt-2">
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
            <div className="mt-2 p-4 bg-[#1a3d1a] border border-[#2d5d2d] rounded-lg">
              <p className="text-sm font-medium text-[#4ade80] mb-1">Multi-Sig Vault Created!</p>
              <p className="text-xs text-[#9b9b9b]">Signers can now approve from the dashboard. UUID: {vaultUuid}</p>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
