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
    <div className="min-h-screen bg-[#F0ECE0]">
      <nav className="border-b border-[#E5E0D6] bg-[#F0ECE0]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-lg font-serif font-medium text-[#1a1a18]">
              DealVault
            </Link>
            <Link 
              href="/dashboard"
              className="text-sm font-serif text-[#5b5950] hover:text-[#1a1a18] transition-colors font-medium"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-serif font-medium text-[#1a1a18] mb-3">Create Dead Drop</h1>
          <p className="font-serif text-[#5b5950] text-lg">
            Sealed document that unlocks automatically on a future date
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#E5E0D6] p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-serif font-medium text-[#1a1a18] mb-2">
                Document Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Succession Plan"
                className="w-full px-4 py-3 bg-[#F0ECE0] border border-[#E5E0D6] rounded-lg font-serif text-[#1a1a18] placeholder-[#9b9b9b] focus:outline-none focus:ring-2 focus:ring-[#c96442] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-serif font-medium text-[#1a1a18] mb-2">
                Upload Document
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full px-4 py-3 bg-[#F0ECE0] border border-[#E5E0D6] rounded-lg font-serif text-[#1a1a18] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#c96442] file:text-white file:text-sm file:font-serif file:font-medium hover:file:bg-[#b85838] file:transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#c96442]"
              />
              {file && (
                <div className="mt-3 p-3 bg-[#F0ECE0] rounded-lg">
                  <p className="text-sm font-serif text-[#1a1a18] font-medium">
                    Selected: {file.name}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-serif font-medium text-[#1a1a18] mb-2">
                Recipient Wallet Address
              </label>
              <input
                type="text"
                value={recipientWallet}
                onChange={(e) => setRecipientWallet(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-[#F0ECE0] border border-[#E5E0D6] rounded-lg font-serif text-[#1a1a18] placeholder-[#9b9b9b] focus:outline-none focus:ring-2 focus:ring-[#c96442] focus:border-transparent transition-all font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-serif font-medium text-[#1a1a18] mb-2">
                Unlock Date & Time
              </label>
              <input
                type="datetime-local"
                value={unlockDate}
                onChange={(e) => setUnlockDate(e.target.value)}
                className="w-full px-4 py-3 bg-[#F0ECE0] border border-[#E5E0D6] rounded-lg font-serif text-[#1a1a18] focus:outline-none focus:ring-2 focus:ring-[#c96442] focus:border-transparent transition-all"
              />
            </div>

            <div className="bg-[#fff4e6] border border-[#ffe4b3] rounded-lg p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-[#8b5a00] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-serif text-[#8b5a00] text-sm font-medium mb-1">
                    Warning: This action is irreversible
                  </p>
                  <p className="font-serif text-[#8b5a00] text-sm leading-relaxed">
                    Once created, this vault cannot be opened by anyone (including you) until the unlock date. 
                    The smart contract enforces this automatically.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full px-6 py-4 bg-[#c96442] hover:bg-[#b85838] disabled:bg-[#E5E0D6] disabled:text-[#9b9b9b] text-white font-serif font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed mt-6"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Dead Drop...
                </span>
              ) : (
                'Create Dead Drop'
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
