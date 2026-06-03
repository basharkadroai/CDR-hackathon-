'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HandCoins, AlertCircle, CheckCircle, Loader2, FileText, Coins, Upload } from 'lucide-react';
import { cdrService } from '@/lib/cdr-service';
import { cacheCreatedFileText } from '@/lib/media';

export default function Marketplace() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [price, setPrice] = useState('1');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [invited, setInvited] = useState('');
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); setDone('');
    if (!name.trim()) return setError('Give your Deal Room a name.');
    if (!file) return setError('Upload the document to sell.');
    const p = Number(price);
    if (!p || p <= 0) return setError('Set a price greater than 0 IP.');
    const invitedWallets = invited.split(',').map((w) => w.trim()).filter(Boolean);
    if (visibility === 'private') {
      if (invitedWallets.length === 0) return setError('Add at least one buyer wallet to invite, or choose Public.');
      if (invitedWallets.some((w) => !/^0x[a-fA-F0-9]{40}$/.test(w))) return setError('A buyer wallet address looks invalid (0x + 40 hex).');
    }

    setUploading(true);
    try {
      const vault = await cdrService.uploadDealRoom(
        { file, name: name.trim(), priceIp: String(price), visibility, invitedWallets },
        (pr) => setStep(pr.step === 'allocate' && pr.status === 'start' ? (pr.detail || 'Registering on-chain…') : pr.step === 'write' ? 'Writing the protected key on-chain…' : pr.step === 'encrypt' ? 'Encrypting your document…' : ''),
      );
      if (file) void cacheCreatedFileText(vault.uuid, file, file.name);
      setDone(`Deal Room live — buyers pay ${price} IP to unlock. Opening it…`);
      setTimeout(() => router.push(`/dashboard?v=${vault.uuid}`), 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create the Deal Room.');
    } finally {
      setUploading(false);
      setStep('');
    }
  };

  return (
    <div className="dv-create">
      <main className="dv-create-main">
        <header className="dv-create-head">
          <h1 className="dv-page-title">Create a Deal Room</h1>
          <p className="dv-page-subtitle">
            Sell access to a confidential document. The file is registered as a Story IP Asset
            with a price; a buyer <b>pays to unlock</b> by minting a license, and the payment goes
            straight to your wallet — a real two-party, on-chain data deal.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="dv-create-form">
          <div className="dv-form-grid">
            <div className="dv-form-col">
              <div>
                <label className="dv-label"><FileText size={13} className="inline mr-1.5 -mt-0.5" />Deal Room Name</label>
                <input className="dv-input" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Q3 revenue dataset" />
              </div>
              <div>
                <label className="dv-label"><Coins size={13} className="inline mr-1.5 -mt-0.5" />Price to unlock (IP)</label>
                <input type="number" min="0" step="0.1" className="dv-input" value={price}
                  onChange={(e) => setPrice(e.target.value)} placeholder="1" />
                <p className="mt-2 text-xs" style={{ color: 'var(--dv-muted)' }}>
                  Buyers pay this in IP to mint a license and decrypt. The fee is paid to you.
                </p>
              </div>

              <div>
                <label className="dv-label">Visibility</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setVisibility('public')}
                    className={`dv-choice ${visibility === 'public' ? 'is-active' : ''}`}>Public market</button>
                  <button type="button" onClick={() => setVisibility('private')}
                    className={`dv-choice ${visibility === 'private' ? 'is-active' : ''}`}>Private invite</button>
                </div>
                {visibility === 'private' ? (
                  <div className="mt-3">
                    <input className="dv-input font-mono text-[13px]" value={invited}
                      onChange={(e) => setInvited(e.target.value)} placeholder="Buyer wallets: 0x…, 0x…" />
                    <p className="mt-2 text-xs" style={{ color: 'var(--dv-muted)' }}>
                      Not listed publicly. Only these wallets see it in their app — share the link with them.
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs" style={{ color: 'var(--dv-muted)' }}>
                    Listed on the public Deal Room market for any buyer to discover and pay.
                  </p>
                )}
              </div>
            </div>

            <div className="dv-form-col">
              <div>
                <label className="dv-label"><Upload size={13} className="inline mr-1.5 -mt-0.5" />Document</label>
                <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="dv-input file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#4F9BBE] file:text-white file:text-sm file:font-medium cursor-pointer" />
                {file && <p className="mt-2 text-sm" style={{ color: 'var(--dv-muted)' }}>Selected: {file.name}</p>}
              </div>
              <div className="flex gap-3 p-4 rounded-xl" style={{ background: 'var(--dv-bg-2)', border: '1px solid var(--dv-line)' }}>
                <HandCoins size={18} style={{ color: 'var(--dv-muted)', flexShrink: 0, marginTop: 1 }} />
                <p className="text-sm leading-relaxed" style={{ color: 'var(--dv-muted)' }}>
                  Encrypted on Story CDR. Only a wallet that pays for a license can decrypt — enforced
                  on-chain by Story&apos;s LicenseReadCondition.
                </p>
              </div>
            </div>
          </div>

          {error && <div className="dv-form-alert is-error"><AlertCircle size={16} /> {error}</div>}
          {done && <div className="dv-form-alert is-ok"><CheckCircle size={16} /> {done}</div>}

          <button type="submit" disabled={uploading} className="dv-button w-full">
            {uploading ? (<><Loader2 size={17} className="dv-spin" /> {step || 'Creating…'}</>) : (<><HandCoins size={17} /> List Deal Room</>)}
          </button>
        </form>
      </main>
    </div>
  );
}
