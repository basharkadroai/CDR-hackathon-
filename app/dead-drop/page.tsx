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

  const handleSubmit = async (e: React.FormEvent) => {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <span className="text-white font-bold text-xl">DealVault</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-3">Create Dead Drop</h1>
          <p className="text-gray-400">
            Sealed document that unlocks automatically on a future date
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Document Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Succession Plan"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Upload Document
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-500 file:text-white hover:file:bg-purple-600"
              />
              {file && (
                <div className="mt-2 text-sm text-gray-400">
                  Selected: {file.name}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Recipient Wallet Address
              </label>
              <input
                type="text"
                value={recipientWallet}
                onChange={(e) => setRecipientWallet(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Unlock Date
              </label>
              <input
                type="datetime-local"
                value={unlockDate}
                onChange={(e) => setUnlockDate(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-yellow-400 text-sm">
                ⚠️ Warning: Once created, this vault cannot be opened by anyone (including you) until the unlock date.
                The smart contract enforces this automatically.
              </p>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full px-6 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white font-medium rounded-lg transition-colors"
            >
              {uploading ? 'Creating Dead Drop...' : 'Create Dead Drop'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
