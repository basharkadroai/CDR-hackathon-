'use client';

import { useState, useRef, DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Vault, CheckCircle, AlertCircle, X, Plus, Upload, Clock, Shield, FileText, ArrowLeft, Loader2 } from 'lucide-react';
import { cdrService } from '@/lib/cdr-service';
import toast from 'react-hot-toast';

export default function DealRoom() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [wallets, setWallets] = useState<string[]>(['']);
  const [expiryDays, setExpiryDays] = useState('7');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [vaultUuid, setVaultUuid] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const addWalletField = () => {
    setWallets([...wallets, '']);
  };

  const updateWallet = (index: number, value: string) => {
    const updated = [...wallets];
    updated[index] = value;
    setWallets(updated);
  };

  const removeWallet = (index: number) => {
    setWallets(wallets.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please provide a name for your Deal Room', { icon: <AlertCircle className="w-5 h-5" /> });
      return;
    }
    if (files.length === 0) {
      toast.error('Please upload at least one document', { icon: <AlertCircle className="w-5 h-5" /> });
      return;
    }
    const validWallets = wallets.filter(w => w.trim().length > 0);
    if (validWallets.length === 0) {
      toast.error('Please add at least one authorized wallet address', { icon: <AlertCircle className="w-5 h-5" /> });
      return;
    }
    const invalidWallets = validWallets.filter(w => !w.match(/^0x[a-fA-F0-9]{40}$/));
    if (invalidWallets.length > 0) {
      toast.error('Some wallet addresses are invalid. Please check the format (0x...)', {
        icon: <AlertCircle className="w-5 h-5" />,
        duration: 5000,
      });
      return;
    }

    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    try {
      const expiresAt = Date.now() + (parseInt(expiryDays) * 24 * 60 * 60 * 1000);
      const uploadToast = toast.loading(`Uploading file 1 of ${files.length}...`);
      let lastVaultUuid = '';

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress({ current: i + 1, total: files.length });
        toast.loading(`Uploading file ${i + 1} of ${files.length}: ${file.name}`, { id: uploadToast });
        const vault = await cdrService.uploadVault({
          file,
          name: `${name} - ${file.name}`,
          type: 'deal-room',
          authorizedWallets: validWallets,
          expiresAt,
        });
        lastVaultUuid = vault.uuid;
      }

      toast.success(
        <div className="flex flex-col gap-1">
          <div className="font-medium">Deal Room created successfully!</div>
          <div className="text-sm opacity-80">{files.length} file{files.length > 1 ? 's' : ''} uploaded</div>
        </div>,
        { id: uploadToast, icon: <CheckCircle className="w-5 h-5" />, duration: 5000 }
      );

      setVaultUuid(lastVaultUuid);
      setTimeout(() => { router.push('/dashboard'); }, 1500);
    } catch (error) {
      console.error('Upload failed:', error);
      let errorMessage = 'Failed to create Deal Room. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('wallet')) errorMessage = 'Wallet connection error. Please connect your wallet and try again.';
        else if (error.message.includes('network')) errorMessage = 'Network error. Please check your connection and try again.';
        else if (error.message.includes('gas')) errorMessage = 'Insufficient gas. Please add funds to your wallet.';
      }
      toast.error(errorMessage, { icon: <AlertCircle className="w-5 h-5" />, duration: 6000 });
    } finally {
      setUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  const durationOptions = [
    { value: '1', label: '24 hours', icon: '⚡' },
    { value: '7', label: '7 days', icon: '📅' },
    { value: '30', label: '30 days', icon: '🗓️' },
    { value: '90', label: '90 days', icon: '📆' },
  ];

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        .dr-root {
          min-height: 100vh;
          background: #171717;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Ambient glow blobs */
        .dr-root::before {
          content: '';
          position: fixed;
          top: -200px;
          left: -200px;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(217, 119, 69, 0.12) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        .dr-root::after {
          content: '';
          position: fixed;
          bottom: -200px;
          right: -200px;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(79, 155, 190, 0.10) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* NAV */
        .dr-nav {
          position: sticky;
          top: 0;
          z-index: 50;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(31, 31, 30, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .dr-nav-inner {
          max-width: 680px;
          margin: 0 auto;
          padding: 0 24px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .dr-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .dr-logo-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #d97745, #4F9BBE);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dr-logo-text {
          font-size: 15px;
          font-weight: 600;
          color: #f1f1f3;
          letter-spacing: -0.01em;
        }
        .dr-back-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.4);
          text-decoration: none;
          transition: color 0.2s;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid transparent;
        }
        .dr-back-btn:hover {
          color: rgba(255,255,255,0.85);
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.08);
        }

        /* MAIN */
        .dr-main {
          position: relative;
          z-index: 1;
          max-width: 680px;
          margin: 0 auto;
          padding: 48px 24px 80px;
        }

        /* HEADER */
        .dr-header {
          margin-bottom: 36px;
        }
        .dr-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #d97745;
          background: rgba(217, 119, 69, 0.1);
          border: 1px solid rgba(217, 119, 69, 0.22);
          padding: 4px 10px;
          border-radius: 100px;
          margin-bottom: 16px;
        }
        .dr-title {
          font-size: 32px;
          font-weight: 700;
          color: #f1f1f3;
          letter-spacing: -0.03em;
          line-height: 1.15;
          margin: 0 0 10px;
        }
        .dr-title span {
          background: linear-gradient(135deg, #f0b17a, #8fd19e);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .dr-subtitle {
          font-size: 14px;
          color: rgba(255,255,255,0.38);
          line-height: 1.6;
          margin: 0;
          font-weight: 400;
        }

        /* FORM CARD */
        .dr-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 32px;
          backdrop-filter: blur(10px);
        }

        /* FIELD */
        .dr-field {
          margin-bottom: 28px;
        }
        .dr-field:last-child {
          margin-bottom: 0;
        }
        .dr-label {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.5);
          margin-bottom: 10px;
        }
        .dr-label svg {
          opacity: 0.7;
        }

        /* INPUT */
        .dr-input {
          width: 100%;
          padding: 13px 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          color: #f1f1f3;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          outline: none;
          box-sizing: border-box;
        }
        .dr-input::placeholder {
          color: rgba(255,255,255,0.2);
        }
        .dr-input:focus {
          border-color: rgba(217, 119, 69, 0.5);
          background: rgba(217, 119, 69, 0.05);
          box-shadow: 0 0 0 3px rgba(217, 119, 69, 0.1);
        }

        /* DROP ZONE */
        .dr-dropzone {
          border: 2px dashed rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 36px 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.25s ease;
          background: rgba(255,255,255,0.02);
          position: relative;
          overflow: hidden;
        }
        .dr-dropzone::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(217, 119, 69, 0.05), rgba(79, 155, 190, 0.05));
          opacity: 0;
          transition: opacity 0.3s;
        }
        .dr-dropzone:hover {
          border-color: rgba(217, 119, 69, 0.4);
          background: rgba(217, 119, 69, 0.04);
        }
        .dr-dropzone:hover::before { opacity: 1; }
        .dr-dropzone.active {
          border-color: rgba(217, 119, 69, 0.7);
          background: rgba(217, 119, 69, 0.08);
          transform: scale(1.01);
        }
        .dr-dropzone.active::before { opacity: 1; }
        .dr-dz-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(217, 119, 69, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          transition: transform 0.3s;
          color: #f0b17a;
        }
        .dr-dropzone:hover .dr-dz-icon { transform: translateY(-2px); }
        .dr-dz-title {
          font-size: 14px;
          font-weight: 500;
          color: #f1f1f3;
          margin: 0 0 4px;
        }
        .dr-dz-sub {
          font-size: 12px;
          color: rgba(255,255,255,0.3);
          margin: 0;
        }
        .dr-dz-sub span {
          color: #f0b17a;
          font-weight: 500;
        }

        /* FILE LIST */
        .dr-file-list {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .dr-file-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          transition: background 0.2s;
        }
        .dr-file-item:hover { background: rgba(255,255,255,0.06); }
        .dr-file-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(52, 211, 153, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8fd19e;
          flex-shrink: 0;
        }
        .dr-file-info { flex: 1; min-width: 0; }
        .dr-file-name {
          font-size: 13px;
          font-weight: 500;
          color: #f1f1f3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .dr-file-size {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          margin-top: 1px;
        }
        .dr-file-remove {
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.2);
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s, background 0.2s;
        }
        .dr-file-remove:hover {
          color: #f87171;
          background: rgba(248, 113, 113, 0.1);
        }

        /* WALLET ROW */
        .dr-wallet-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .dr-wallet-input {
          flex: 1;
          font-family: 'SFMono-Regular', 'Consolas', monospace;
          font-size: 13px;
        }
        .dr-wallet-remove {
          background: rgba(248, 113, 113, 0.08);
          border: 1px solid rgba(248, 113, 113, 0.15);
          color: rgba(248, 113, 113, 0.7);
          border-radius: 10px;
          padding: 0 12px;
          height: 46px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .dr-wallet-remove:hover {
          background: rgba(248, 113, 113, 0.15);
          border-color: rgba(248, 113, 113, 0.35);
          color: #f87171;
        }
        .dr-add-wallet {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 10px;
          background: none;
          border: 1px dashed rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.4);
          font-size: 13px;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
          padding: 8px 14px;
          border-radius: 9px;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
          justify-content: center;
        }
        .dr-add-wallet:hover {
          border-color: rgba(217, 119, 69, 0.4);
          color: #f0b17a;
          background: rgba(217, 119, 69, 0.05);
        }

        /* DURATION GRID */
        .dr-duration-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }
        .dr-duration-opt {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 14px 8px;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 4px;
          align-items: center;
        }
        .dr-duration-opt:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.12);
        }
        .dr-duration-opt.selected {
          background: rgba(217, 119, 69, 0.12);
          border-color: rgba(217, 119, 69, 0.45);
        }
        .dr-duration-emoji {
          font-size: 18px;
          line-height: 1;
        }
        .dr-duration-label {
          font-size: 12px;
          font-weight: 500;
          color: rgba(255,255,255,0.5);
          transition: color 0.2s;
        }
        .dr-duration-opt.selected .dr-duration-label { color: #f0b17a; }

        /* DIVIDER */
        .dr-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 28px 0;
        }

        /* SUBMIT BUTTON */
        .dr-submit {
          width: 100%;
          padding: 15px 24px;
          border: none;
          border-radius: 14px;
          background: linear-gradient(135deg, #d97745, #4F9BBE);
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          letter-spacing: -0.01em;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 24px rgba(217, 119, 69, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .dr-submit::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .dr-submit:hover::before { opacity: 1; }
        .dr-submit:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(217, 119, 69, 0.4);
        }
        .dr-submit:active { transform: translateY(0); }
        .dr-submit:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* PROGRESS BAR */
        .dr-progress-wrap {
          margin-top: 16px;
        }
        .dr-progress-header {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: rgba(255,255,255,0.3);
          margin-bottom: 8px;
          font-weight: 500;
        }
        .dr-progress-pct { color: #f0b17a; }
        .dr-progress-track {
          height: 4px;
          background: rgba(255,255,255,0.07);
          border-radius: 100px;
          overflow: hidden;
        }
        .dr-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #d97745, #4F9BBE);
          border-radius: 100px;
          transition: width 0.35s ease-out;
        }

        /* SUCCESS BOX */
        .dr-success {
          margin-top: 16px;
          padding: 16px;
          background: rgba(52, 211, 153, 0.07);
          border: 1px solid rgba(52, 211, 153, 0.2);
          border-radius: 12px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .dr-success-icon { color: #8fd19e; flex-shrink: 0; }
        .dr-success-title {
          font-size: 13px;
          font-weight: 600;
          color: #8fd19e;
          margin: 0 0 4px;
        }
        .dr-success-uuid {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          font-family: 'SFMono-Regular', monospace;
          word-break: break-all;
          margin: 0;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .dr-spinner {
          animation: spin 0.8s linear infinite;
        }

        @media (max-width: 520px) {
          .dr-duration-grid { grid-template-columns: repeat(2, 1fr); }
          .dr-card { padding: 20px; }
          .dr-title { font-size: 26px; }
        }
      `}</style>

      <div className="dr-root">
        {/* NAV */}
        <nav className="dr-nav">
          <div className="dr-nav-inner">
            <Link href="/" className="dr-logo">
              <div className="dr-logo-icon">
                <Vault size={16} color="#fff" />
              </div>
              <span className="dr-logo-text">DealVault</span>
            </Link>
            <Link href="/dashboard" className="dr-back-btn">
              <ArrowLeft size={14} />
              Dashboard
            </Link>
          </div>
        </nav>

        {/* MAIN */}
        <main className="dr-main">
          {/* Header */}
          <div className="dr-header">
            <div className="dr-badge">
              <Shield size={10} />
              On-Chain Confidential
            </div>
            <h1 className="dr-title">
              Create a <span>Deal Room</span>
            </h1>
            <p className="dr-subtitle">
              Time-locked document sharing with wallet-gated access control — secured by Story Protocol.
            </p>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSubmit} className="dr-card">

            {/* Room Name */}
            <div className="dr-field">
              <label className="dr-label">
                <FileText size={12} />
                Room Name
              </label>
              <input
                type="text"
                className="dr-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Series A — Q2 2026"
              />
            </div>

            {/* Documents */}
            <div className="dr-field">
              <label className="dr-label">
                <Upload size={12} />
                Documents
              </label>
              <div
                className={`dr-dropzone${isDragging ? ' active' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                style={{ position: 'relative', zIndex: 1 }}
              >
                <div className="dr-dz-icon">
                  <Upload size={20} />
                </div>
                <p className="dr-dz-title">{isDragging ? 'Drop files here' : 'Drag & drop files'}</p>
                <p className="dr-dz-sub">or <span>browse from your device</span></p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>

              {files.length > 0 && (
                <div className="dr-file-list">
                  {files.map((file, i) => (
                    <div key={i} className="dr-file-item">
                      <div className="dr-file-icon">
                        <FileText size={14} />
                      </div>
                      <div className="dr-file-info">
                        <div className="dr-file-name">{file.name}</div>
                        <div className="dr-file-size">{formatFileSize(file.size)}</div>
                      </div>
                      <button type="button" className="dr-file-remove" onClick={() => removeFile(i)}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Wallets */}
            <div className="dr-field">
              <label className="dr-label">
                <Shield size={12} />
                Authorized Wallets
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {wallets.map((wallet, index) => (
                  <div key={index} className="dr-wallet-row">
                    <input
                      type="text"
                      className={`dr-input dr-wallet-input`}
                      value={wallet}
                      onChange={(e) => updateWallet(index, e.target.value)}
                      placeholder="0x..."
                    />
                    {wallets.length > 1 && (
                      <button type="button" className="dr-wallet-remove" onClick={() => removeWallet(index)}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" className="dr-add-wallet" onClick={addWalletField}>
                <Plus size={14} />
                Add another wallet
              </button>
            </div>

            {/* Duration */}
            <div className="dr-field">
              <label className="dr-label">
                <Clock size={12} />
                Access Duration
              </label>
              <div className="dr-duration-grid">
                {durationOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className={`dr-duration-opt${expiryDays === opt.value ? ' selected' : ''}`}
                    onClick={() => setExpiryDays(opt.value)}
                  >
                    <span className="dr-duration-emoji">{opt.icon}</span>
                    <span className="dr-duration-label">{opt.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="dr-divider" />

            {/* Submit */}
            <button type="submit" disabled={uploading} className="dr-submit">
              {uploading ? (
                <>
                  <Loader2 size={17} className="dr-spinner" />
                  {uploadProgress.total > 0
                    ? `Uploading ${uploadProgress.current} of ${uploadProgress.total}…`
                    : 'Creating Deal Room…'}
                </>
              ) : (
                <>
                  <Vault size={17} />
                  Create Deal Room
                </>
              )}
            </button>

            {/* Upload Progress */}
            {uploadProgress.total > 0 && (
              <div className="dr-progress-wrap">
                <div className="dr-progress-header">
                  <span>Upload Progress</span>
                  <span className="dr-progress-pct">
                    {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                  </span>
                </div>
                <div className="dr-progress-track">
                  <div
                    className="dr-progress-bar"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Success */}
            {vaultUuid && (
              <div className="dr-success">
                <CheckCircle size={18} className="dr-success-icon" />
                <div>
                  <p className="dr-success-title">Deal Room Created!</p>
                  <p className="dr-success-uuid">Vault UUID: {vaultUuid}</p>
                </div>
              </div>
            )}
          </form>
        </main>
      </div>
    </>
  );
}
