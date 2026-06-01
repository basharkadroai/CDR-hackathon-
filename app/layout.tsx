import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "./context/WalletContext";
import DeploymentRefresh from "./components/DeploymentRefresh";
import CDRModeIndicator from "./components/CDRModeIndicator";
import { Toaster } from "react-hot-toast";

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
      <body className="min-h-full" style={{ fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <CDRModeIndicator />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#30302e',
              color: '#f5f4ef',
              border: '1px solid #413f3b',
              borderRadius: '12px',
            },
            success: {
              iconTheme: { primary: '#c96442', secondary: '#fff' },
            },
          }}
        />
        <WalletProvider>
          {children}
          <DeploymentRefresh />
        </WalletProvider>
      </body>
    </html>
  );
}

