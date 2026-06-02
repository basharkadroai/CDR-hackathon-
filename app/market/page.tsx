'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HandCoins, FileText, Loader2, ArrowRight, Search } from 'lucide-react';

interface MarketVault {
  uuid: string;
  name: string;
  type: string;
  creatorWallet?: string;
  fileName?: string;
  priceIp?: string;
  createdAt?: number;
  visibility?: 'public' | 'private';
}

const short = (a?: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '—');
const fileExt = (n?: string) => (n && n.includes('.') ? n.split('.').pop()!.toUpperCase().slice(0, 4) : 'DOC');

export default function Market() {
  const router = useRouter();
  const [deals, setDeals] = useState<MarketVault[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    fetch('/api/vaults?type=marketplace')
      .then((r) => r.json())
      .then((d) => setDeals(Array.isArray(d?.vaults) ? d.vaults.filter((v: MarketVault) => v.priceIp && v.visibility !== 'private') : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = [...deals]
    .filter((v) => !q || v.name.toLowerCase().includes(q.toLowerCase()) || (v.fileName || '').toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

  return (
    <div className="dv-mkt">
      <header className="dv-mkt-head">
        <div>
          <h1 className="dv-mkt-title">Deal Room Market</h1>
          <p className="dv-mkt-sub">Confidential documents for sale on Story CDR. Pay to unlock — the fee goes to the seller.</p>
        </div>
        <div className="dv-mkt-search">
          <Search size={15} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search deals…" />
        </div>
      </header>

      <div className="dv-mkt-bar">
        <span>{filtered.length} {filtered.length === 1 ? 'deal' : 'deals'} available</span>
      </div>

      {loading ? (
        <div className="dv-mkt-empty"><Loader2 size={18} className="dv-spin" /> Loading deals…</div>
      ) : filtered.length === 0 ? (
        <div className="dv-mkt-empty">No Deal Rooms listed yet. Create one from “New vault → Deal Room (paid).”</div>
      ) : (
        <div className="dv-mkt-grid">
          {filtered.map((v) => (
            <article key={v.uuid} className="dv-mkt-card">
              <div className="dv-mkt-thumb"><FileText size={22} /><span className="dv-mkt-ext">{fileExt(v.fileName)}</span></div>
              <div className="dv-mkt-body">
                <h3 className="dv-mkt-name" title={v.name}>{v.name}</h3>
                <p className="dv-mkt-meta">Seller {short(v.creatorWallet)}</p>
              </div>
              <div className="dv-mkt-foot">
                <span className="dv-mkt-price"><HandCoins size={14} /> {v.priceIp} IP</span>
                <button className="dv-mkt-buy" onClick={() => router.push(`/dashboard?v=${v.uuid}`)}>
                  Unlock <ArrowRight size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
