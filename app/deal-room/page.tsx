'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Vault, CheckCircle, AlertCircle } from 'lucide-react';
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
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
    
    // Validation with better error messages
    if (!name.trim()) {
      toast.error('Please provide a name for your Deal Room', {
        icon: <AlertCircle className="w-5 h-5" />,
      });
      return;
    }

    if (files.length === 0) {
      toast.error('Please upload at least one document', {
        icon: <AlertCircle className="w-5 h-5" />,
      });
      return;
    }

    const validWallets = wallets.filter(w => w.trim().length > 0);
    if (validWallets.length === 0) {
      toast.error('Please add at least one authorized wallet address', {
        icon: <AlertCircle className="w-5 h-5" />,
      });
      return;
    }

    // Validate wallet addresses format
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
      
      // Show progress toast
      const uploadToast = toast.loading(`Uploading file 1 of ${files.length}...`);
      
      let lastVaultUuid = '';
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress({ current: i + 1, total: files.length });
        
        toast.loading(`Uploading file ${i + 1} of ${files.length}: ${file.name}`, {
          id: uploadToast,
        });
        
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
        {
          id: uploadToast,
          icon: <CheckCircle className="w-5 h-5" />,
          duration: 5000,
        }
      );

      setVaultUuid(lastVaultUuid);
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Upload failed:', error);
      
      let errorMessage = 'Failed to create Deal Room. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('wallet')) {
          errorMessage = 'Wallet connection error. Please connect your wallet and try again.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('gas')) {
          errorMessage = 'Insufficient gas. Please add funds to your wallet.';
        }
      }
      
      toast.error(errorMessage, {
        icon: <AlertCircle className="w-5 h-5" />,
        duration: 6000,
      });
    } finally {
      setUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <nav className="border-b border-[#2d2d2d] bg-[#1a1a1a]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Vault className="w-6 h-6 text-[#4F9BBE]" />
              <span className="text-lg font-medium text-[#e8e8e8]">DealVault</span>
            </Link>
            <Link 
              href="/dashboard"
              className="text-sm text-[#9b9b9b] hover:text-[#e8e8e8] transition-colors font-medium"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-medium text-[#e8e8e8] mb-3">Create Deal Room</h1>
          <p className="text-[#9b9b9b] text-lg">
            Time-limited document sharing with wallet-based access control
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#212121] rounded-2xl border border-[#2d2d2d] p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#e8e8e8] mb-2">
                Deal Room Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Series A - Q2 2026"
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg text-[#e8e8e8] placeholder-[#6b6b6b] focus:outline-none focus:ring-2 focus:ring-[#4F9BBE] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#e8e8e8] mb-2">
                Upload Documents
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg text-[#e8e8e8] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#4F9BBE] file:text-white file:text-sm file:font-medium hover:file:bg-[#3d8aad] file:transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4F9BBE]"
              />
              {files.length > 0 && (
                <div className="mt-3 p-3 bg-[#2d2d2d] rounded-lg">
                  <p className="text-sm text-[#e8e8e8] font-medium">
                    {files.length} file{files.length > 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#e8e8e8] mb-2">
                Authorized Wallets
              </label>
              <div className="space-y-2">
                {wallets.map((wallet, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={wallet}
                      onChange={(e) => updateWallet(index, e.target.value)}
                      placeholder="0x..."
                      className="flex-1 px-4 py-3 bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg text-[#e8e8e8] placeholder-[#6b6b6b] focus:outline-none focus:ring-2 focus:ring-[#4F9BBE] focus:border-transparent transition-all font-mono text-sm"
                    />
                    {wallets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWallet(index)}
                        className="px-4 py-3 bg-[#4d1a1a] hover:bg-[#5d2020] text-[#ff7d7d] rounded-lg transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addWalletField}
                className="mt-3 text-[#4F9BBE] hover:text-[#3d8aad] text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Another Wallet
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#e8e8e8] mb-2">
                Access Duration
              </label>
              <select
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg text-[#e8e8e8] focus:outline-none focus:ring-2 focus:ring-[#4F9BBE] focus:border-transparent transition-all cursor-pointer"
              >
                <option value="1">24 hours</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full px-6 py-4 bg-[#4F9BBE] hover:bg-[#3d8aad] disabled:bg-[#2d2d2d] disabled:text-[#6b6b6b] text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed mt-6"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {uploadProgress.total > 0 
                    ? `Uploading ${uploadProgress.current} of ${uploadProgress.total}...`
                    : 'Creating Deal Room...'
                  }
                </span>
              ) : (
                'Create Deal Room'
              )}
            </button>

            {uploadProgress.total > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-[#9b9b9b] mb-2">
                  <span>Upload Progress</span>
                  <span>{Math.round((uploadProgress.current / uploadProgress.total) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-[#2d2d2d] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#4F9BBE] transition-all duration-300 ease-out"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {vaultUuid && (
              <div className="mt-4 p-4 bg-[#1a3d1a] border border-[#2d5d2d] rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#4ade80] flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#4ade80] mb-1">Deal Room Created!</p>
                    <p className="text-xs text-[#9b9b9b] font-mono break-all">Vault UUID: {vaultUuid}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
