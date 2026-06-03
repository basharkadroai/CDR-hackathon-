'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Bot, HandCoins, Loader2, Sparkles, CheckCircle2, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { VaultMetadata } from '@/lib/cdr-service';
import { useVaults } from '../context/VaultsContext';
import { useWallet } from '../context/WalletContext';

interface Turn { agent: 'buyer' | 'seller'; message: string; offer?: number }
interface NegResult { dealPossible: boolean; settlePrice: number; currency: string; ask: number; floor: number; budget: number; turns: Turn[] }

export default function AutopilotPage() {
  return (
    <Suspense fallback={<div className="dv-ap-wrap" />}>
      <AutopilotInner />
    </Suspense>
  );
}

function AutopilotInner() {
  const params = useSearchParams();
  const { walletAddress, connectWallet } = useWallet();
  const { vaults } = useVaults();

  // Only Deal Rooms (priced) can go on Autopilot — that's the sale type.
  const deals = useMemo(() => vaults.filter((v) => v.type === 'marketplace' && v.priceIp), [vaults]);
  const [selectedUuid, setSelectedUuid] = useState<string>('');
  const selected: VaultMetadata | undefined = useMemo(
    () => deals.find((d) => d.uuid === selectedUuid),
    [deals, selectedUuid],
  );

  const [abstract, setAbstract] = useState('');
  const [floor, setFloor] = useState('');
  const [budget, setBudget] = useState('');

  const [running, setRunning] = useState(false);
  const [shown, setShown] = useState<Turn[]>([]);
  const [result, setResult] = useState<NegResult | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Preselect from ?v= and hydrate defaults from the chosen Deal Room.
  useEffect(() => {
    const v = params.get('v');
    if (v && deals.some((d) => d.uuid === v)) setSelectedUuid(v);
    else if (!selectedUuid && deals[0]) setSelectedUuid(deals[0].uuid);
  }, [params, deals]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selected) return;
    const ask = Number(selected.priceIp || 1);
    setFloor(String(ask));                         // floor defaults to the list price
    setBudget(String(Math.max(ask, Math.round(ask * 1.6 * 100) / 100))); // a buyer willing to pay a bit more
    setAbstract(selected.aiSummary || `Confidential dataset "${selected.name}" (${selected.fileName || 'file'}).`);
    setShown([]); setResult(null);
  }, [selectedUuid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const run = async () => {
    if (!selected || running) return;
    timers.current.forEach(clearTimeout); timers.current = [];
    setRunning(true); setShown([]); setResult(null);
    try {
      const res = await fetch('/api/agent-negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selected.name,
          abstract,
          ask: Number(selected.priceIp),
          floor: Number(floor) || Number(selected.priceIp),
          budget: Number(budget) || Number(selected.priceIp),
          intent: 'acquire access to this confidential dataset',
        }),
      });
      const data: NegResult = await res.json();
      // Reveal turn-by-turn so it feels like a live negotiation.
      data.turns.forEach((t, i) => {
        timers.current.push(setTimeout(() => setShown((p) => [...p, t]), 850 * (i + 1)));
      });
      timers.current.push(setTimeout(() => { setResult(data); setRunning(false); }, 850 * (data.turns.length + 1)));
    } catch {
      setRunning(false);
    }
  };

  if (!walletAddress) {
    return (
      <div className="dv-ap-wrap">
        <div className="dv-ap-empty">
          <Bot size={30} />
          <h2>DealVault Autopilot</h2>
          <p>Connect your wallet to let agents sell your confidential data for you.</p>
          <button className="dv-button" onClick={connectWallet}>Connect wallet</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dv-ap-wrap">
      <header className="dv-ap-head">
        <div className="dv-ap-badge"><Bot size={15} /> Autopilot</div>
        <h1>Your data sells itself.</h1>
        <p>Pick a Deal Room. A Buyer Agent discovers it, asks about it without ever seeing the file, negotiates within your floor, and settles — autonomously.</p>
      </header>

      {deals.length === 0 ? (
        <div className="dv-ap-empty">
          <HandCoins size={26} />
          <p>You have no Deal Rooms yet. Create one to put it on Autopilot.</p>
          <Link className="dv-button" href="/marketplace">Create a Deal Room</Link>
        </div>
      ) : (
        <div className="dv-ap-grid">
          {/* Left: the listing + guardrails */}
          <section className="dv-ap-panel">
            <div className="dv-ap-label">Deal Room on autopilot</div>
            <select className="dv-input" value={selectedUuid} onChange={(e) => setSelectedUuid(e.target.value)}>
              {deals.map((d) => <option key={d.uuid} value={d.uuid}>{d.name} — {d.priceIp} IP</option>)}
            </select>

            <div className="dv-ap-label">What the agent may say about it (never the file itself)</div>
            <textarea className="dv-input dv-ap-abstract" value={abstract} onChange={(e) => setAbstract(e.target.value)} rows={4} />

            <div className="dv-ap-row">
              <div>
                <div className="dv-ap-label">Your floor (IP)</div>
                <input className="dv-input" value={floor} onChange={(e) => setFloor(e.target.value)} inputMode="decimal" />
                <span className="dv-ap-hint">Agent will never sell below this.</span>
              </div>
              <div>
                <div className="dv-ap-label">Buyer&apos;s budget (IP)</div>
                <input className="dv-input" value={budget} onChange={(e) => setBudget(e.target.value)} inputMode="decimal" />
                <span className="dv-ap-hint">The incoming buyer agent&apos;s ceiling.</span>
              </div>
            </div>

            <button className="dv-button dv-ap-run" onClick={run} disabled={running || !selected}>
              {running ? <><Loader2 size={16} className="dv-spin" /> Agents negotiating…</> : <><Sparkles size={16} /> Run Autopilot</>}
            </button>
            <div className="dv-ap-listprice">Listed at <b>{selected?.priceIp} IP</b> · ask is the list price; the agent negotiates inside your floor and the buyer&apos;s budget.</div>
          </section>

          {/* Right: the live deal theater */}
          <section className="dv-ap-theater">
            <div className="dv-ap-theater-head">
              <span className="dv-ap-actor seller"><ShieldCheck size={13} /> Seller Agent</span>
              <span className="dv-ap-vs">negotiating</span>
              <span className="dv-ap-actor buyer"><Bot size={13} /> Buyer Agent</span>
            </div>

            <div className="dv-ap-feed">
              {shown.length === 0 && !running && (
                <div className="dv-ap-placeholder">Run Autopilot to watch the agents negotiate this deal live.</div>
              )}
              {shown.map((t, i) => (
                <div key={i} className={`dv-ap-turn ${t.agent}`}>
                  <div className="dv-ap-turn-who">{t.agent === 'seller' ? 'Seller Agent' : 'Buyer Agent'}</div>
                  <div className="dv-ap-bubble">
                    {t.message}
                    {typeof t.offer === 'number' && <span className="dv-ap-offer">{t.offer} IP</span>}
                  </div>
                </div>
              ))}
              {running && shown.length < (result?.turns.length ?? 99) && (
                <div className="dv-ap-typing"><span></span><span></span><span></span></div>
              )}

              {result && (
                result.dealPossible ? (
                  <div className="dv-ap-settle ok">
                    <CheckCircle2 size={18} />
                    <div>
                      <b>Deal agreed — {result.settlePrice} {result.currency}</b>
                      <span>License mints to the buyer, payment goes to you, the vault unlocks. No human touched it.</span>
                    </div>
                  </div>
                ) : (
                  <div className="dv-ap-settle no">
                    <XCircle size={18} />
                    <div>
                      <b>No deal</b>
                      <span>The buyer&apos;s budget was below your floor of {result.floor} IP. Your data stays sealed.</span>
                    </div>
                  </div>
                )
              )}
            </div>

            {result?.dealPossible && (
              <Link className="dv-button dv-ap-settle-cta" href={`/dashboard?v=${selected?.uuid}`}>
                Open the Deal Room <ArrowRight size={15} />
              </Link>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
