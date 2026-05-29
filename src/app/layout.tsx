import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DealVault - Enterprise Confidential Deal Rooms",
  description: "Zero trust. Zero middlemen. Pure cryptographic guarantees for high-stakes business transactions.",
  keywords: ["CDR", "confidential data", "deal room", "M&A", "fundraising", "blockchain"],
  authors: [{ name: "DealVault Team" }],
  openGraph: {
    title: "DealVault - Enterprise Confidential Deal Rooms",
    description: "The first enterprise-grade confidential deal room platform powered by Story Protocol's CDR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
