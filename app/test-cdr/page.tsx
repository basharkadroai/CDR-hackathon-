'use client';

import { useState } from 'react';

export default function TestCDR() {
  const [status, setStatus] = useState('Not tested');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const testCDRMode = () => {
    addLog('Testing CDR mode...');
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_CDR;
    addLog(`NEXT_PUBLIC_USE_MOCK_CDR = ${useMock}`);
    
    if (useMock === 'false') {
      setStatus('✅ Real CDR Enabled');
      addLog('✅ Real CDR is enabled!');
    } else {
      setStatus('🔶 Mock CDR Enabled');
      addLog('🔶 Mock CDR is enabled');
    }
  };

  const testWallet = async () => {
    addLog('Testing wallet connection...');
    
    if (typeof window.ethereum === 'undefined') {
      setStatus('❌ No MetaMask detected');
      addLog('❌ MetaMask not installed');
      return;
    }

    try {
      addLog('Requesting wallet connection...');
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      addLog(`✅ Wallet connected: ${accounts[0]}`);
      setStatus(`✅ Connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
      
      // Check network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      addLog(`Network Chain ID: ${chainId}`);
      
      if (chainId === '0x5e9') { // 1513 in hex
        addLog('✅ On Story Testnet (Aeneid)');
      } else {
        addLog(`⚠️ Wrong network. Expected 0x5e9 (Story Testnet), got ${chainId}`);
      }
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
      setStatus('❌ Connection failed');
    }
  };

  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'monospace',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>CDR Integration Test</h1>
      
      <div style={{ 
        padding: '20px', 
        background: '#f5f5f5', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <strong>Status:</strong> {status}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={testCDRMode}
          style={{
            padding: '10px 20px',
            background: '#4F9BBE',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test CDR Mode
        </button>

        <button 
          onClick={testWallet}
          style={{
            padding: '10px 20px',
            background: '#4F9BBE',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Wallet Connection
        </button>
      </div>

      <div style={{
        background: '#1a1a1a',
        color: '#00ff00',
        padding: '20px',
        borderRadius: '8px',
        maxHeight: '400px',
        overflow: 'auto',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        <div><strong>Console Logs:</strong></div>
        {logs.length === 0 ? (
          <div style={{ color: '#666' }}>Click buttons above to test...</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} style={{ marginTop: '4px' }}>{log}</div>
          ))
        )}
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '4px' }}>
        <strong>Instructions:</strong>
        <ol style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li>Click "Test CDR Mode" to check if real CDR is enabled</li>
          <li>Click "Test Wallet Connection" to connect MetaMask</li>
          <li>Check the console logs below for details</li>
        </ol>
      </div>

      <div style={{ marginTop: '20px' }}>
        <a href="/" style={{ color: '#4F9BBE' }}>← Back to Home</a>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
