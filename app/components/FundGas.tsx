'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPublicClient, http, parseEther } from 'viem';
import { Loader2, Check, KeyRound, Fuel } from 'lucide-react';
import { storyTestnet } from '@/lib/wallet';
import { useWallet } from '../context/WalletContext';

const RPC = 'https://aeneid.storyrpc.io';
const MIN_BALANCE = parseEther('0.1');
const client = createPublicClient({ chain: storyTestnet, transport: http(RPC) });

type Status = 'checking' | 'need-connect' | 'need-gas' | 'funding' | 'ready' | 'error';

/**
 * Zero-friction onboarding: connect → (auto) get free testnet gas → ready, all
 * without leaving the app. Self-hides once the wallet already has gas.
 */
export default function FundGas() {
  const { walletAddress, connectWallet, isConnecting } = useWallet();
  const [status, setStatus] = useState<Status>('need-connect');
  const [error, setError] = useState('');

  const checkBalance = useCallback(async (addr: string) => {
    setStatus('checking');
    try {
      const bal = await client.getBalance({ address: addr as `0x${string}` });
      setStatus(bal >= MIN_BALANCE ? 'ready' : 'need-gas');
    } catch {
      setStatus('need-gas');
    }
  }, []);

  useEffect(() => {
    if (!walletAddress) { setStatus('need-connect'); return; }
    void checkBalance(walletAddress);
  }, [walletAddress, checkBalance]);

  const fund = async () => {
    if (!walletAddress) return;
    setStatus('funding');
    setError('');
    try {
      const res = await fetch('/api/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: walletAddress }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus('ready');
      } else {
        setError(data.message || 'Could not fund your wallet.');
        setStatus('error');
      }
    } catch {
      setError('Could not reach the faucet. Try again.');
      setStatus('error');
    }
  };

  // Already has gas → don't nag.
  if (status === 'ready' || status === 'checking') {
    return status === 'ready' ? (
      <div className="dv-fund is-ready"><Check size={14} /> You’re ready — describe your vault above ☝️</div>
    ) : null;
  }

  if (status === 'need-connect') {
    return (
      <button className="dv-fund-btn" onClick={connectWallet} disabled={isConnecting}>
        <KeyRound size={15} /> {isConnecting ? 'Connecting…' : 'Connect wallet to start'}
      </button>
    );
  }

  if (status === 'funding') {
    return <div className="dv-fund"><Loader2 size={14} className="dv-spin" /> Sending you free testnet gas…</div>;
  }

  if (status === 'error') {
    const url = error.match(/https?:\/\/\S+/)?.[0];
    const text = url ? error.replace(url, '').trim() : error;
    return (
      <div className="dv-fund is-error">
        {text} {url && <a href={url} target="_blank" rel="noreferrer" className="dv-hint-link">Get IP →</a>}
        {' '}<button className="dv-fund-retry" onClick={fund}>Retry</button>
      </div>
    );
  }

  // need-gas
  return (
    <button className="dv-fund-btn" onClick={fund}>
      <Fuel size={15} /> Fund my wallet — free test gas
    </button>
  );
}
