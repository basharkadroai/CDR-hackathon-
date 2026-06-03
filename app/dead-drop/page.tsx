'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle, Lock, Loader2, Clock, FileText, User } from 'lucide-react';
import { cdrService } from '@/lib/cdr-service';
import { cacheCreatedFileText } from '@/lib/media';

type Preset = 'succession' | 'timed';

export default function DeadDrop() {
  const router = useRouter();
  const [preset, setPreset] = useState<Preset>('succession');
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [recipientWallet, setRecipientWallet] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); setDone('');
    const err = (m: string) => { setError(m); };

    if (!name.trim()) return err('Please name your Dead Drop');
    if (!file) return err('Please upload a document');
    if (!recipientWallet.match(/^0x[a-fA-F0-9]{40}$/)) return err('Invalid recipient address (0x...)');
    if (!unlockDate) return err('Please pick an unlock date & time');

    const unlockAt = new Date(unlockDate).getTime();
    if (unlockAt <= Date.now()) return err('Unlock date must be in the future');

    setUploading(true);
    try {
      const vault = await cdrService.uploadVault({ file, name, type: 'dead-drop', recipientWallet, unlockAt });
      void cacheCreatedFileText(vault.uuid, file, file.name);
      const days = Math.ceil((unlockAt - Date.now()) / 86400000);
      setDone(`Dead Drop sealed — unlocks in ${days} day${days !== 1 ? 's' : ''}. Opening dashboard…`);
      router.push(`/dashboard?v=${vault.uuid}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create Dead Drop');
    } finally {
      setUploading(false);
    }
  };

  const presetCopy = preset === 'succession'
    ? {
        heading: 'Create a Recovery Vault',
        subtitle: 'Seal a succession plan, seed-backup note, or emergency document for one recipient. CDR releases it only after the future unlock condition passes on-chain.',
        namePlaceholder: 'e.g., Founder emergency recovery packet',
        warning: 'Use this for high-stakes recovery: the recipient and unlock time are encoded into the CDR condition, so early access is rejected by the validator-enforced read rule.',
        cta: 'Seal Recovery Vault',
      }
    : {
        heading: 'Create a Dead Drop',
        subtitle: 'A sealed document that opens for one recipient on a future date. Not even you can open it early once the CDR condition is set.',
        namePlaceholder: 'e.g., Succession Plan',
        warning: 'This is irreversible. Once sealed, nobody can open this vault until the unlock date. The smart contract enforces it automatically.',
        cta: 'Seal Dead Drop',
      };

  return (
    <div className="dv-create">
      <main className="dv-create-main">
        <header className="dv-create-head">
          <div className="dv-preset-tabs" aria-label="Dead Drop presets">
            <button type="button" className={`dv-preset-tab ${preset === 'succession' ? 'is-active' : ''}`} onClick={() => setPreset('succession')}>
              Recovery Vault
            </button>
            <button type="button" className={`dv-preset-tab ${preset === 'timed' ? 'is-active' : ''}`} onClick={() => setPreset('timed')}>
              Timed Disclosure
            </button>
          </div>
          <h1 className="dv-page-title">{presetCopy.heading}</h1>
          <p className="dv-page-subtitle">{presetCopy.subtitle}</p>
        </header>

        <form onSubmit={handleSubmit} className="dv-create-form">
          <div className="dv-form-grid">
            {/* LEFT column */}
            <div className="dv-form-col">
              <div>
                <label className="dv-label"><FileText size={13} className="inline mr-1.5 -mt-0.5" />Document Name</label>
                <input className="dv-input" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder={presetCopy.namePlaceholder} />
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
                  {presetCopy.warning}
                </p>
              </div>
            </div>
          </div>

          {error && <div className="dv-form-alert is-error"><AlertCircle size={16} /> {error}</div>}
          {done && <div className="dv-form-alert is-ok"><CheckCircle size={16} /> {done}</div>}

          <button type="submit" disabled={uploading} className="dv-button w-full">
            {uploading ? (<><Loader2 size={17} className="dv-spin" /> Sealing...</>) : (<><Lock size={17} /> {presetCopy.cta}</>)}
          </button>
        </form>
      </main>
    </div>
  );
}
