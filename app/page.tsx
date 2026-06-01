'use client';

import { useWallet } from './context/WalletContext';
import Logo from './components/Logo';
import Assistant from './components/Assistant';

function partOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 18) return 'Afternoon';
  return 'Evening';
}

export default function Home() {
  const { walletAddress } = useWallet();
  const greeting = walletAddress
    ? `${partOfDay()}. Your vault is ready.`
    : `${partOfDay()}. Let's secure a deal.`;

  return (
    <main className="dv-main">
      <div className="dv-hero">
        <div className="dv-hero-inner">
          <div className="dv-hero-greeting">
            <Logo size={40} />
            <h1 className="dv-title">{greeting}</h1>
          </div>

          <Assistant />
        </div>
      </div>
    </main>
  );
}
