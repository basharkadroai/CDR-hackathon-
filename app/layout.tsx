import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import "./vault-delete.css";
import { WalletProvider } from "./context/WalletContext";
import { VaultsProvider } from "./context/VaultsContext";
import DeploymentRefresh from "./components/DeploymentRefresh";
import CDRModeIndicator from "./components/CDRModeIndicator";
import Sidebar from "./components/Sidebar";

export const metadata: Metadata = {
  title: "DealVault — Trustless Document Vault",
  description: "On-chain confidential document vault powered by Story Protocol CDR",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
  other: {
    'build-id': Date.now().toString(),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="preload" as="image" href="/backgrounds/winter.jpg" fetchPriority="high" />
      </head>
      <body className="min-h-full">
        <CDRModeIndicator />
        <WalletProvider>
          <VaultsProvider>
            <div className="dv-app">
              <Suspense fallback={null}>
                <Sidebar />
              </Suspense>
              <div className="dv-hub-main">
                <video
                  className="dv-bg-video"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  poster="/backgrounds/winter.jpg"
                >
                  <source src="/backgrounds/winter.mp4#t=0.001" type="video/mp4" />
                </video>
                <div className="dv-hub-overlay" />
                <div className="dv-hub-content">{children}</div>
              </div>
            </div>
            <DeploymentRefresh buildVersion={process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID || 'dev'} />
          </VaultsProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
