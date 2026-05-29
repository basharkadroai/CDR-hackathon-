import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "./context/WalletContext";
import DeploymentRefresh from "./components/DeploymentRefresh";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "DealVault — Trustless Document Vault",
  description: "On-chain confidential document vault powered by Story Protocol CDR",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full font-sans bg-canvas text-ink">
        <WalletProvider>
          {children}
          <DeploymentRefresh />
        </WalletProvider>
      </body>
    </html>
  );
}

