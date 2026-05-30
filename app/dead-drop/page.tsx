'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Vault, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { cdrService } from '@/lib/cdr-service';
import toast from 'react-hot-toast';

export default function DeadDrop() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [recipientWallet, setRecipientWallet] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [vaultUuid, setVaultUuid] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validation with better error messages
    if (!name.trim()) {
      toast.error('Please provide a name for your Dead Drop', {
        icon: <AlertCircle className="w-5 h-5" />,
      });
      return;
    }

    if (!file) {
      toast.error('Please upload a document', {
        icon: <AlertCircle className="w-5 h-5" />,
      });
      return;
    }

    if (!recipientWallet.trim()) {
      toast.error('Please provide a recipient wallet address', {
        icon: <AlertCircle className="w-5 h-5" />,
      });
      return;
    }

    // Validate wallet address format
    if (!recipientWallet.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast.error('Invalid wallet address format. Please use a valid Ethereum address (0x...)', {
        icon: <AlertCircle className="w-5 h-5" />,
        duration: 5000,
      });
      return;
    }

    if (!unlockDate) {
      toast.error('Please select an unlock date and time', {
        icon: <AlertCircle className="w-5 h-5" />,
      });
      return;
    }

    const unlockAt = new Date(unlockDate).getTime();
    const now = Date.now();
    
    if (unlockAt <= now) {
      toast.error('Unlock date must be in the future', {
        icon: <AlertCircle className="w-5 h-5" />,
      });
      return;
    }

    // Calculate days until unlock
    const daysUntilUnlock = Math.ceil((unlockAt - now) / (1000 * 60 * 60 * 24));

    setUploading(true);

    try {
      const uploadToast = toast.loading(
        <div className="flex flex-col gap-1">
          <div className="font-medium">Sealing your Dead Drop...</div>
          <div className="text-sm opacity-80">This may take a moment</div>
        </div>
      );
      
      const vault = await cdrService.uploadVault({
        file,
        name,
        type: 'dead-drop',
        recipientWallet,
        unlockAt,
      });

      toast.success(
        <div className="flex flex-col gap-1">
          <div className="font-medium flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Dead Drop sealed successfully!
          </div>
          <div className="text-sm opacity-80">
            Unlocks in {daysUntilUnlock} day{daysUntilUnlock !== 1 ? 's' : ''}
          </div>
        </div>,
        {
          id: uploadToast,
          icon: <CheckCircle className="w-5 h-5" />,
          duration: 6000,
        }
      );

      setVaultUuid(vault.uuid);
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Upload failed:', error);
      
      let errorMessage = 'Failed to create Dead Drop. Please try again.';
      
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
          <h1 className="text-4xl font-medium text-[#e8e8e8] mb-3">Create Dead Drop</h1>
          <p className="text-[#9b9b9b] text-lg">
            Sealed document that unlocks automatically on a future date
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#212121] rounded-2xl border border-[#2d2d2d] p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#e8e8e8] mb-2">
                Document Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Succession Plan"
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg text-[#e8e8e8] placeholder-[#6b6b6b] focus:outline-none focus:ring-2 focus:ring-[#4F9BBE] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#e8e8e8] mb-2">
                Upload Document
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg text-[#e8e8e8] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#4F9BBE] file:text-white file:text-sm file:font-medium hover:file:bg-[#3d8aad] file:transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4F9BBE]"
              />
              {file && (
                <div className="mt-3 p-3 bg-[#2d2d2d] rounded-lg">
                  <p className="text-sm text-[#e8e8e8] font-medium">
                    Selected: {file.name}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#e8e8e8] mb-2">
                Recipient Wallet Address
              </label>
              <input
                type="text"
                value={recipientWallet}
                onChange={(e) => setRecipientWallet(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg text-[#e8e8e8] placeholder-[#6b6b6b] focus:outline-none focus:ring-2 focus:ring-[#4F9BBE] focus:border-transparent transition-all font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#e8e8e8] mb-2">
                Unlock Date & Time
              </label>
              <input
                type="datetime-local"
                value={unlockDate}
                onChange={(e) => setUnlockDate(e.target.value)}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg text-[#e8e8e8] focus:outline-none focus:ring-2 focus:ring-[#4F9BBE] focus:border-transparent transition-all"
              />
            </div>

            <div className="bg-[#4d3d1a] border border-[#6d5d2a] rounded-lg p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-[#ffd97d] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-[#ffd97d] text-sm font-medium mb-1">
                    Warning: This action is irreversible
                  </p>
                  <p className="text-[#ffd97d] text-sm leading-relaxed">
                    Once created, this vault cannot be opened by anyone (including you) until the unlock date. 
                    The smart contract enforces this automatically.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full px-6 py-4 bg-[#4F9BBE] hover:bg-[#3d8aad] disabled:bg-[#2d2d2d] disabled:text-[#6b6b6b] text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed mt-6"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sealing Dead Drop...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Lock className="w-5 h-5" />
                  Seal Dead Drop
                </span>
              )}
            </button>

            {vaultUuid && (
              <div className="mt-4 p-4 bg-[#1a3d1a] border border-[#2d5d2d] rounded-lg">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-[#4ade80] flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#4ade80] mb-1">Dead Drop Sealed!</p>
                    <p className="text-xs text-[#9b9b9b] mb-2">
                      This vault is now locked until the unlock date. Nobody can access it until then.
                    </p>
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
