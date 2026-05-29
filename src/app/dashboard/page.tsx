"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Users,
  Shield,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface DealRoom {
  id: number;
  name: string;
  type: 'M&A' | 'Fundraising' | 'Partnership' | 'Custom';
  status: 'active' | 'completed' | 'revoked' | 'expired';
  createdAt: number;
  expiresAt: number;
  documentsCount: number;
  partiesCount: number;
  accessCount: number;
  escrowAmount?: string;
}

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const [dealRooms, setDealRooms] = useState<DealRoom[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && address) {
      loadDealRooms();
    }
  }, [isConnected, address]);

  const loadDealRooms = async () => {
    setLoading(true);
    
    // Mock data for demo - in production, fetch from smart contract
    const mockDealRooms: DealRoom[] = [
      {
        id: 1,
        name: "TechCorp Acquisition",
        type: 'M&A',
        status: 'active',
        createdAt: Date.now() - 86400000 * 5,
        expiresAt: Date.now() + 86400000 * 25,
        documentsCount: 12,
        partiesCount: 5,
        accessCount: 34,
        escrowAmount: '10,000,000 USDC',
      },
      {
        id: 2,
        name: "Series A Round",
        type: 'Fundraising',
        status: 'active',
        createdAt: Date.now() - 86400000 * 3,
        expiresAt: Date.now() + 86400000 * 27,
        documentsCount: 8,
        partiesCount: 3,
        accessCount: 15,
        escrowAmount: '5,000,000 USDC',
      },
      {
        id: 3,
        name: "IP Licensing Deal",
        type: 'Partnership',
        status: 'completed',
        createdAt: Date.now() - 86400000 * 15,
        expiresAt: Date.now() - 86400000 * 1,
        documentsCount: 6,
        partiesCount: 2,
        accessCount: 22,
      },
    ];
    
    setDealRooms(mockDealRooms);
    setLoading(false);
  };

  const filteredDealRooms = dealRooms.filter(room => {
    if (filter === 'all') return true;
    return room.status === filter;
  });

  const stats = {
    total: dealRooms.length,
    active: dealRooms.filter(r => r.status === 'active').length,
    completed: dealRooms.filter(r => r.status === 'completed').length,
    totalValue: dealRooms.reduce((sum, r) => {
      if (r.escrowAmount) {
        const amount = parseFloat(r.escrowAmount.replace(/[^0-9.]/g, ''));
        return sum + amount;
      }
      return sum;
    }, 0),
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-vault-accent mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">
            Connect your wallet to access your deal rooms
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Deal Dashboard</h1>
            <p className="text-gray-400">Manage your confidential deal rooms</p>
          </div>
          <Link
            href="/deal-room/create"
            className="flex items-center space-x-2 px-6 py-3 bg-vault-accent hover:bg-opacity-80 rounded-lg font-semibold transition glow-effect"
          >
            <Plus className="w-5 h-5" />
            <span>New Deal Room</span>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect p-6 rounded-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Total Deals</span>
              <FileText className="w-5 h-5 text-vault-accent" />
            </div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-effect p-6 rounded-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Active</span>
              <Clock className="w-5 h-5 text-vault-success" />
            </div>
            <div className="text-3xl font-bold">{stats.active}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-effect p-6 rounded-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Completed</span>
              <CheckCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold">{stats.completed}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-effect p-6 rounded-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Total Value</span>
              <TrendingUp className="w-5 h-5 text-vault-warning" />
            </div>
            <div className="text-2xl font-bold">
              ${(stats.totalValue / 1000000).toFixed(1)}M
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex space-x-4 mb-6">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === f
                  ? 'bg-vault-accent text-white'
                  : 'glass-effect hover:bg-opacity-20'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Deal Rooms List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-vault-accent border-t-transparent rounded-full mx-auto" />
          </div>
        ) : filteredDealRooms.length === 0 ? (
          <div className="glass-effect p-12 rounded-xl text-center">
            <AlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Deal Rooms Found</h3>
            <p className="text-gray-400 mb-6">
              Create your first deal room to get started
            </p>
            <Link
              href="/deal-room/create"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-vault-accent hover:bg-opacity-80 rounded-lg font-semibold transition"
            >
              <Plus className="w-5 h-5" />
              <span>Create Deal Room</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDealRooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/deal-room/${room.id}`}>
                  <div className="glass-effect p-6 rounded-xl hover:glow-effect transition cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold">{room.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            room.status === 'active' 
                              ? 'bg-vault-success bg-opacity-20 text-vault-success'
                              : room.status === 'completed'
                              ? 'bg-blue-500 bg-opacity-20 text-blue-400'
                              : 'bg-gray-500 bg-opacity-20 text-gray-400'
                          }`}>
                            {room.status}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-vault-accent bg-opacity-20 text-vault-accent">
                            {room.type}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <div className="text-sm text-gray-400 mb-1">Documents</div>
                            <div className="font-semibold">{room.documentsCount}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-400 mb-1">Parties</div>
                            <div className="font-semibold">{room.partiesCount}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-400 mb-1">Access Count</div>
                            <div className="font-semibold">{room.accessCount}</div>
                          </div>
                          {room.escrowAmount && (
                            <div>
                              <div className="text-sm text-gray-400 mb-1">Escrow</div>
                              <div className="font-semibold text-vault-warning">
                                {room.escrowAmount}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-gray-400 mb-1">
                          {room.status === 'active' ? 'Expires' : 'Expired'}
                        </div>
                        <div className="font-medium">
                          {new Date(room.expiresAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
