"use client";

import { motion } from "framer-motion";
import { Shield, Zap, Lock, TrendingUp, Users, FileCheck } from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-effect">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-vault-accent" />
              <span className="text-2xl font-bold gradient-text">DealVault</span>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/dashboard" className="hover:text-vault-accent transition">
                Dashboard
              </Link>
              <Link href="/docs" className="hover:text-vault-accent transition">
                Docs
              </Link>
              <ConnectButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-7xl font-bold mb-6">
              Enterprise Deal Rooms.
              <br />
              <span className="gradient-text">Zero Trust Required.</span>
            </h1>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
              The first confidential deal room platform for M&A, fundraising, and partnerships.
              Powered by Story Protocol's Confidential Data Rails.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/deal-room/create"
                className="px-8 py-4 bg-vault-accent hover:bg-opacity-80 rounded-lg font-semibold text-lg transition glow-effect"
              >
                Create Deal Room
              </Link>
              <Link
                href="/demo"
                className="px-8 py-4 glass-effect hover:bg-opacity-20 rounded-lg font-semibold text-lg transition"
              >
                Watch Demo
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20"
          >
            <div className="glass-effect p-6 rounded-xl">
              <div className="text-4xl font-bold text-vault-accent mb-2">$0</div>
              <div className="text-gray-400">Single Point of Failure</div>
            </div>
            <div className="glass-effect p-6 rounded-xl">
              <div className="text-4xl font-bold text-vault-accent mb-2">100%</div>
              <div className="text-gray-400">On-Chain Enforcement</div>
            </div>
            <div className="glass-effect p-6 rounded-xl">
              <div className="text-4xl font-bold text-vault-accent mb-2">∞</div>
              <div className="text-gray-400">Cryptographic Guarantees</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Built for <span className="gradient-text">High-Stakes Deals</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-effect p-8 rounded-xl hover:glow-effect transition"
              >
                <feature.icon className="w-12 h-12 text-vault-accent mb-4" />
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent to-vault-darker">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Perfect for <span className="gradient-text">Every Deal Type</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {useCases.map((useCase, index) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="glass-effect p-8 rounded-xl"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-vault-accent bg-opacity-20 rounded-lg flex items-center justify-center">
                      <useCase.icon className="w-6 h-6 text-vault-accent" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3">{useCase.title}</h3>
                    <p className="text-gray-400 mb-4">{useCase.description}</p>
                    <ul className="space-y-2">
                      {useCase.features.map((feat) => (
                        <li key={feat} className="flex items-center text-sm text-gray-300">
                          <div className="w-1.5 h-1.5 bg-vault-accent rounded-full mr-2" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="glass-effect p-12 rounded-2xl glow-effect"
          >
            <h2 className="text-4xl font-bold mb-6">
              Ready to Close Your Next Deal?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join the future of confidential business transactions.
            </p>
            <Link
              href="/deal-room/create"
              className="inline-block px-10 py-4 bg-vault-accent hover:bg-opacity-80 rounded-lg font-semibold text-lg transition"
            >
              Get Started Now
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p className="mb-2">Built for the CDR Hackathon 2026</p>
          <p className="text-sm">Powered by Story Protocol's Confidential Data Rails</p>
        </div>
      </footer>
    </main>
  );
}

const features = [
  {
    icon: Lock,
    title: "Multi-Sig Approval",
    description: "Require 2-of-3, 3-of-5, or custom signature thresholds for sensitive documents.",
  },
  {
    icon: Zap,
    title: "Smart Escrow",
    description: "Lock funds that auto-release when deal conditions are met. No middlemen.",
  },
  {
    icon: Users,
    title: "AI Negotiation",
    description: "Let AI agents negotiate terms, generate contracts, and suggest optimal rules.",
  },
  {
    icon: Shield,
    title: "Revocable Access",
    description: "Emergency kill switch to revoke all access if a deal falls through.",
  },
  {
    icon: FileCheck,
    title: "Conditional Access",
    description: "Unlock document B only after document A is signed. Chain your workflows.",
  },
  {
    icon: TrendingUp,
    title: "Deal Analytics",
    description: "Track pipeline, audit trails, and compliance reporting in real-time.",
  },
];

const useCases = [
  {
    icon: TrendingUp,
    title: "M&A Transactions",
    description: "Secure due diligence with board-level approval workflows.",
    features: [
      "3-of-5 board signature requirements",
      "Time-locked document releases",
      "Automatic escrow fund release",
      "Immutable audit trail for compliance",
    ],
  },
  {
    icon: Users,
    title: "Fundraising Rounds",
    description: "Share sensitive financials with investors under strict conditions.",
    features: [
      "Wallet-based investor access control",
      "Conditional term sheet unlocking",
      "Multi-party signature collection",
      "Revocable access for failed rounds",
    ],
  },
  {
    icon: FileCheck,
    title: "Strategic Partnerships",
    description: "Negotiate IP licensing and revenue shares with confidence.",
    features: [
      "AI-powered term negotiation",
      "Conditional access chains",
      "Smart contract enforcement",
      "Zero-knowledge compliance proofs",
    ],
  },
  {
    icon: Shield,
    title: "Legal Agreements",
    description: "NDAs, contracts, and sensitive legal documents with cryptographic guarantees.",
    features: [
      "Client-side encryption",
      "Multi-sig execution",
      "Time-based expiry",
      "Verifiable credential generation",
    ],
  },
];
