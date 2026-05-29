'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cdrService } from '@/lib/cdr-service';

export default function DealRoom() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [wallets, setWallets] = useState<string[]>(['']);
  const [expiryDays, setExpiryDays] = useState('7');
  const [uploading, setUploading] = useState(false);

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
    
    if (!name || files.length === 0) {
      alert('Please provide a name and upload at least one file');
      return;
    }

    const validWallets = wallets.filter(w => w.trim().length > 0);
    if (validWallets.length === 0) {
      alert('Please add at least one authorized wallet address');
      return;
    }

    setUploading(true);

    try {
      const expiresAt = Date.now() + (parseInt(expiryDays) * 24 * 60 * 60 * 1000);
      
      for (const file of files) {
        await cdrService.uploadVault({
          file,
          name: `${name} - ${file.name}`,
          type: 'deal-room',
          authorizedWallets: validWallets,
          expiresAt,
        });
      }

      alert('Deal Room created successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to create Deal Room');
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
          <h1 className="text-4xl font-serif font-medium text-[#1a1a18] mb-3">Create Deal Room</h1>
          <p className="font-serif text-[#5b5950] text-lg">
            Time-limited document sharing with wallet-based access control
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#E5E0D6] p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-serif font-medium text-[#1a1a18] mb-2">
                Deal Room Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Series A - Q2 2026"
                className="w-full px-4 py-3 bg-[#F0ECE0] border border-[#E5E0D6] rounded-lg font-serif text-[#1a1a18] placeholder-[#9b9b9b] focus:outline-none focus:ring-2 focus:ring-[#c96442] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-serif font-medium text-[#1a1a18] mb-2">
                Upload Documents
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="w-full px-4 py-3 bg-[#F0ECE0] border border-[#E5E0D6] rounded-lg font-serif text-[#1a1a18] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#c96442] file:text-white file:text-sm file:font-serif file:font-medium hover:file:bg-[#b85838] file:transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#c96442]"
              />
              {files.length > 0 && (
                <div className="mt-3 p-3 bg-[#F0ECE0] rounded-lg">
                  <p className="text-sm font-serif text-[#1a1a18] font-medium">
                    {files.length} file{files.length > 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-serif font-medium text-[#1a1a18] mb-2">
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
                      className="flex-1 px-4 py-3 bg-[#F0ECE0] border border-[#E5E0D6] rounded-lg text-[#1a1a18] placeholder-[#9b9b9b] focus:outline-none focus:ring-2 focus:ring-[#c96442] focus:border-transparent transition-all font-mono text-sm"
                    />
                    {wallets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWallet(index)}
                        className="px-4 py-3 bg-[#ffe6e6] hover:bg-[#ffd6d6] text-[#8b0000] rounded-lg transition-all"
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
                className="mt-3 text-[#c96442] hover:text-[#b85838] text-sm font-serif font-medium flex items-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Another Wallet
              </button>
            </div>

            <div>
              <label className="block text-sm font-serif font-medium text-[#1a1a18] mb-2">
                Access Duration
              </label>
              <select
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                className="w-full px-4 py-3 bg-[#F0ECE0] border border-[#E5E0D6] rounded-lg font-serif text-[#1a1a18] focus:outline-none focus:ring-2 focus:ring-[#c96442] focus:border-transparent transition-all cursor-pointer"
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
              className="w-full px-6 py-4 bg-[#c96442] hover:bg-[#b85838] disabled:bg-[#E5E0D6] disabled:text-[#9b9b9b] text-white font-serif font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed mt-6"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Deal Room...
                </span>
              ) : (
                'Create Deal Room'
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
