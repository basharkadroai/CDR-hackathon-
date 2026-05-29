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
    <div className="min-h-screen bg-black">
      <nav className="fixed top-0 w-full z-50 border-b border-zinc-800 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
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
            <div className="inline-block mb-4 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
              <span className="text-blue-400 text-sm font-medium">Deal Room</span>
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">Create Deal Room</h1>
            <p className="text-zinc-400 text-lg">
              Time-limited document sharing with wallet-based access control
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Deal Room Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Series A - Q2 2026"
                  className="w-full px-4 py-3.5 bg-black border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Upload Documents
                </label>
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="w-full px-4 py-3.5 bg-black border border-zinc-800 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-medium hover:file:bg-blue-700 file:transition-colors cursor-pointer"
                  />
                </div>
                {files.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-400 font-medium">
                      {files.length} file{files.length > 1 ? 's' : ''} selected
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
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
                        className="flex-1 px-4 py-3.5 bg-black border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm"
                      />
                      {wallets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeWallet(index)}
                          className="px-4 py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all border border-red-500/20"
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
                  className="mt-3 text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Another Wallet
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Access Duration
                </label>
                <select
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                  className="w-full px-4 py-3.5 bg-black border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
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
                className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20 disabled:shadow-none mt-8"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Creating Deal Room...
                  </span>
                ) : (
                  'Create Deal Room'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
