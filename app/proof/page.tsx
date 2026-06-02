'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, FileText, Lock, Users, Wallet, Boxes } from 'lucide-react';
import { CONTRACTS, VAULTS, EXPLORER, CHAIN, VaultProof } from './proofData';

const TYPE_META: Record<string, { label: string; Icon: typeof FileText }> = {
  'deal-room': { label: 'Deal Room', Icon: FileText },
  'dead-drop': { label: 'Dead Drop', Icon: Lock },
  'multi-sig': { label: 'Multi-Sig', Icon: Users },
};

const short = (a: string) => `${a.slice(0, 8)}…${a.slice(-6)}`;

interface LoggedVault { uuid: string; type: string; creator: string; allocateTx?: string; ts: number; }

export default function ProofPage() {
  const [logged, setLogged] = useState<LoggedVault[]>([]);

  useEffect(() => {
    fetch('/api/proof')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d?.vaults)) setLogged(d.vaults); })
      .catch(() => { /* fall back to seeded list */ });
  }, []);

  // Merge seeded (verified) vaults with auto-logged ones, deduped by uuid.
  const seededUuids = new Set(VAULTS.map((v) => v.uuid));
  const merged: VaultProof[] = [
    ...VAULTS,
    ...logged
      .filter((l) => !seededUuids.has(l.uuid) && TYPE_META[l.type])
      .map((l) => ({
        uuid: l.uuid,
        type: l.type as VaultProof['type'],
        allocateTx: (l.allocateTx ?? '0x') as `0x${string}`,
        creator: l.creator as `0x${string}`,
      })),
  ];
  const distinctCreators = new Set(merged.map((v) => v.creator.toLowerCase())).size;

  return (
    <div className="dv-proof">
      <header className="dv-proof-head">
        <h1 className="dv-proof-title">On-chain proof</h1>
        <p className="dv-proof-sub">
          DealVault runs on real Confidential Data Rails — not a mock. Every contract below is
          deployed on Story Aeneid, and every vault is a real on-chain transaction tied to the
          wallet that created it. Click any link to verify it yourself on the block explorer.
        </p>
      </header>

      <div className="dv-proof-stats">
        <div className="dv-proof-stat"><span className="dv-proof-num">{merged.length}</span><span className="dv-proof-lbl">vaults created on-chain</span></div>
        <div className="dv-proof-stat"><span className="dv-proof-num">{distinctCreators}</span><span className="dv-proof-lbl">distinct creator wallets</span></div>
        <div className="dv-proof-stat"><span className="dv-proof-num">{CONTRACTS.length}</span><span className="dv-proof-lbl">contracts deployed</span></div>
      </div>

      <section className="dv-proof-section">
        <h2 className="dv-proof-h2"><Boxes size={16} /> Deployed contracts</h2>
        <div className="dv-proof-list">
          {CONTRACTS.map((c) => (
            <div key={c.address} className="dv-proof-card">
              <div className="dv-proof-card-top">
                <span className="dv-proof-name">{c.name}</span>
                <a className="dv-proof-link" href={`${EXPLORER}/address/${c.address}`} target="_blank" rel="noreferrer">
                  {short(c.address)} <ExternalLink size={12} />
                </a>
              </div>
              <p className="dv-proof-purpose">{c.purpose}</p>
              <a className="dv-proof-tx" href={`${EXPLORER}/tx/${c.deployTx}`} target="_blank" rel="noreferrer">
                deploy tx {short(c.deployTx)} <ExternalLink size={11} />
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="dv-proof-section">
        <h2 className="dv-proof-h2"><Wallet size={16} /> Vaults created by real wallets</h2>
        <div className="dv-proof-list">
          {merged.map((v) => {
            const meta = TYPE_META[v.type];
            const hasTx = v.allocateTx && v.allocateTx !== '0x';
            return (
              <div key={v.uuid} className="dv-proof-card">
                <div className="dv-proof-card-top">
                  <span className="dv-proof-name"><meta.Icon size={13} /> {meta.label} · #{v.uuid}</span>
                  {hasTx && (
                    <a className="dv-proof-link" href={`${EXPLORER}/tx/${v.allocateTx}`} target="_blank" rel="noreferrer">
                      allocate tx <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                <div className="dv-proof-rowline">
                  <span className="dv-proof-rk">creator</span>
                  <a className="dv-proof-tx" href={`${EXPLORER}/address/${v.creator}`} target="_blank" rel="noreferrer">
                    {short(v.creator)} <ExternalLink size={11} />
                  </a>
                </div>
                {v.note && <p className="dv-proof-purpose">{v.note}</p>}
              </div>
            );
          })}
        </div>
      </section>

      <p className="dv-proof-foot">
        Want to add to this? <Link href="/" className="dv-proof-cta">Create your own vault →</Link>{' '}
        After it&apos;s sealed, use “Copy on-chain proof” and send it to us.
      </p>
    </div>
  );
}
