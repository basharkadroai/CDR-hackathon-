'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HandCoins, FileText, Loader2, ArrowRight } from 'lucide-react';

interface MarketVault {
  uuid: string;
  name: string;
  type: string;
  creatorWallet?: string;
  fileName?: string;
  priceIp?: string;
  createdAt?: number;
}

const short = (a?: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '—');

export default function Market() {
  const router = useRouter();
  const [deals, setDeals] = useState<MarketVault[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/vaults?type=marketplace')
      .then((r) => r.json())
      .then((d) => setDeals(Array.isArray(d?.vaults) ? d.vaults.filter((v: MarketVault) => v.priceIp) : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...deals].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

  return (
    <div className="dv-proof">
      <header className="dv-proof-head">
        <div className="dv-proof-badge"><HandCoins size={15} /> Pay-to-unlock data deals</div>
        <h1 className="dv-proof-title">Deal Room Market</h1>
        <p className="dv-proof-sub">
          Confidential documents listed for sale on Story CDR. Pay the price to mint a license and
          decrypt — the payment goes straight to the seller. A real two-party, on-chain data deal.
        </p>
      </header>

      {loading ? (
        <div className="dv-side-hint flex items-center gap-2" style={{ justifyContent: 'center', padding: '40px 0' }}>
          <Loader2 size={16} className="dv-spin" /> Loading deals…
        </div>
      ) : sorted.length === 0 ? (
        <p className="dv-proof-foot">No Deal Rooms listed yet. Create one from “New vault → Deal Room (paid).”</p>
      ) : (
        <div className="dv-market-grid">
          {sorted.map((v) => (
            <button key={v.uuid} className="dv-market-card" onClick={() => router.push(`/dashboard?v=${v.uuid}`)}>
              <div className="dv-market-top">
                <span className="dv-market-name"><FileText size={15} /> {v.name}</span>
                <span className="dv-market-price">{v.priceIp} IP</span>
              </div>
              <div className="dv-market-meta">
                <span>{v.fileName || 'Document'}</span>
                <span className="dv-dot">·</span>
                <span>seller {short(v.creatorWallet)}</span>
              </div>
              <span className="dv-market-cta">Pay {v.priceIp} IP to unlock <ArrowRight size={14} /></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
