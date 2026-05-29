'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cdrService } from '@/lib/cdr-service';

export default function DeadDrop() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [recipientWallet, setRecipientWallet] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!name || !file || !recipientWallet || !unlockDate) {
      alert('Please fill in all fields');
      return;
    }

    setUploading(true);

    try {
      const unlockAt = new Date(unlockDate).getTime();
      
      await cdrService.uploadVault({
        file,
        name,
        type: 'dead-drop',
        recipientWallet,
        unlockAt,
      });

      alert('Dead Drop created successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to create Dead Drop');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <nav className="fixed top-0 w-full z-50 border-b border-zinc-800 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span className="text-white font-semibold text-xl tracking-tight">DealVault</span>
            </Link>
            <Link 
              href="/dashboard"
              className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-10">
            <div className="inline-block mb-4 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full">
              <span className="text-violet-400 text-sm font-medium">Dead Drop</span>
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">Create Dead Drop</h1>
            <p className="text-zinc-400 text-lg">
              Sealed document that unlocks automatically on a future date
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Document Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Succession Plan"
                  className="w-full px-4 py-3.5 bg-black border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Upload Document
                </label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3.5 bg-black border border-zinc-800 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-violet-600 file:text-white file:font-medium hover:file:bg-violet-700 file:transition-colors cursor-pointer"
                  />
                </div>
                {file && (
                  <div className="mt-3 p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                    <p className="text-sm text-violet-400 font-medium">
                      Selected: {file.name}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Recipient Wallet Address
                </label>
                <input
                  type="text"
                  value={recipientWallet}
                  onChange={(e) => setRecipientWallet(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3.5 bg-black border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Unlock Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={unlockDate}
                  onChange={(e) => setUnlockDate(e.target.value)}
                  className="w-full px-4 py-3.5 bg-black border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-amber-400 text-sm font-medium mb-1">
                      Warning: This action is irreversible
                    </p>
                    <p className="text-amber-400/80 text-sm">
                      Once created, this vault cannot be opened by anyone (including you) until the unlock date. 
                      The smart contract enforces this automatically.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full px-6 py-4 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-violet-600/20 disabled:shadow-none mt-8"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Creating Dead Drop...
                  </span>
                ) : (
                  'Create Dead Drop'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
