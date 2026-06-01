'use client';

import { useState } from 'react';
import { cdrService } from '@/lib/cdr-service';

const EXPECTED_CHAIN_HEX = '0x523'; // 1315 = Story Aeneid testnet

export default function TestCDR() {
  const [status, setStatus] = useState('Not tested');
  const [logs, setLogs] = useState<string[]>([]);
  const [lastUuid, setLastUuid] = useState<string | null>(null);

  const addLog = (msg: string) =>
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

  const testCDRMode = () => {
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_CDR;
    addLog(`NEXT_PUBLIC_USE_MOCK_CDR = ${useMock}`);
    if (useMock === 'false') {
      setStatus('✅ Real CDR Enabled');
      addLog('✅ Real CDR is enabled');
    } else {
      setStatus('🔶 Mock CDR Enabled');
      addLog('🔶 Mock mode — set NEXT_PUBLIC_USE_MOCK_CDR=false on Vercel for real CDR');
    }
  };

  // Verifies the mixed-content proxy works in production (no wallet needed).
  const testProxy = async () => {
    addLog('Fetching DKG public key via /api/cdr proxy...');
    try {
      const res = await fetch('/api/cdr/dkg/global_public_key');
      const json = await res.json();
      if (res.ok && json?.msg?.public_key) {
        setStatus('✅ Proxy + Story-API reachable');
        addLog(`✅ global_public_key = ${json.msg.public_key.slice(0, 24)}...`);
      } else {
        setStatus('❌ Proxy returned unexpected payload');
        addLog(`❌ ${JSON.stringify(json).slice(0, 200)}`);
      }
    } catch (e: any) {
      setStatus('❌ Proxy fetch failed');
      addLog(`❌ ${e.message}`);
    }
  };

  const testWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setStatus('❌ No MetaMask detected');
      addLog('❌ MetaMask not installed');
      return;
    }
    try {
      const accounts = (await window.ethereum.request({ method: 'eth_requestAccounts' })) as string[];
      addLog(`✅ Wallet connected: ${accounts[0]}`);
      setStatus(`✅ Connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
      let chainId = (await window.ethereum.request({ method: 'eth_chainId' })) as string;
      addLog(`Network Chain ID: ${chainId}`);
      if (chainId !== EXPECTED_CHAIN_HEX) {
        addLog(`⚠️ Wrong network (got ${chainId}). Requesting switch to Story Aeneid...`);
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: EXPECTED_CHAIN_HEX }],
          });
        } catch (e: any) {
          if (e?.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: EXPECTED_CHAIN_HEX,
                chainName: 'Story Aeneid Testnet',
                nativeCurrency: { name: 'IP', symbol: 'IP', decimals: 18 },
                rpcUrls: ['https://aeneid.storyrpc.io'],
                blockExplorerUrls: ['https://aeneid.storyscan.io'],
              }],
            });
          }
        }
        chainId = (await window.ethereum.request({ method: 'eth_chainId' })) as string;
      }
      if (chainId === EXPECTED_CHAIN_HEX) {
        addLog('✅ On Story Aeneid testnet (1315)');
      } else {
        addLog(`⚠️ Still on ${chainId}. Please switch to Story Aeneid manually.`);
      }
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
      setStatus('❌ Connection failed');
    }
  };

  // Full real-CDR round trip: encrypt + on-chain vault + recover + decrypt.
  const testUpload = async () => {
    addLog('Starting real CDR upload (this submits on-chain txs, ~gas)...');
    try {
      const file = new File(
        [`DealVault CDR test @ ${new Date().toISOString()}`],
        'cdr-test.txt',
        { type: 'text/plain' },
      );
      const meta = await cdrService.uploadVault({
        file,
        name: 'CDR diagnostic',
        type: 'deal-room',
      });
      setLastUuid(meta.uuid);
      setStatus(`✅ Vault created: ${meta.uuid}`);
      addLog(`✅ Vault UUID: ${meta.uuid}`);
      if (meta.txHash) addLog(`✅ tx: ${meta.txHash}`);
    } catch (e: any) {
      setStatus('❌ Upload failed');
      addLog(`❌ ${e.message}`);
    }
  };

  const testAccess = async () => {
    if (!lastUuid) {
      addLog('⚠️ Run "Test Upload" first');
      return;
    }
    addLog(`Accessing vault ${lastUuid} (enforces read condition + collects partials)...`);
    try {
      const blob = await cdrService.accessVault(lastUuid);
      const text = await blob.text();
      setStatus('✅ Decrypted via CDR');
      addLog(`✅ Recovered plaintext: "${text}"`);
    } catch (e: any) {
      setStatus('❌ Access failed');
      addLog(`❌ ${e.message}`);
    }
  };

  const btn = {
    padding: '10px 16px',
    background: '#4F9BBE',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  } as const;

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace', maxWidth: '820px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>CDR Integration Diagnostics</h1>

      <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px', marginBottom: '20px' }}>
        <strong>Status:</strong> {status}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={testCDRMode} style={btn}>1. Check Mode</button>
        <button onClick={testProxy} style={btn}>2. Test Proxy (no wallet)</button>
        <button onClick={testWallet} style={btn}>3. Test Wallet + Network</button>
        <button onClick={testUpload} style={btn}>4. Real CDR Upload</button>
        <button onClick={testAccess} style={btn}>5. Real CDR Access</button>
      </div>

      <div style={{ background: '#1a1a1a', color: '#00ff00', padding: '20px', borderRadius: '8px', maxHeight: '400px', overflow: 'auto', fontSize: '12px' }}>
        <div><strong>Console Logs:</strong></div>
        {logs.length === 0 ? (
          <div style={{ color: '#666' }}>Run the steps in order...</div>
        ) : (
          logs.map((log, i) => <div key={i} style={{ marginTop: '4px' }}>{log}</div>)
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <a href="/" style={{ color: '#4F9BBE' }}>← Back to Home</a>
      </div>
    </div>
  );
}
