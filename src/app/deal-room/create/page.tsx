"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Users, Clock, Shield, Zap, ArrowRight } from "lucide-react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { encryptData, createCDRVault } from "@/lib/cdr";

export default function CreateDealRoom() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "M&A" as 'M&A' | 'Fundraising' | 'Partnership' | 'Custom',
    description: "",
    expiryDays: 30,
    authorizedParties: [""],
    requireMultiSig: false,
    requiredSignatures: 2,
    enableEscrow: false,
    escrowAmount: "",
    documents: [] as File[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Encrypt documents
      const encryptedDocs = await Promise.all(
        formData.documents.map(async (doc) => {
          const { encryptedData, encryptionKey } = await encryptData(doc);
          return { doc, encryptedData, encryptionKey };
        })
      );

      // 2. Create CDR vaults for each document
      const vaults = await Promise.all(
        encryptedDocs.map(async ({ doc, encryptedData, encryptionKey }) => {
          const vault = await createCDRVault(encryptedData, encryptionKey, [
            {
              type: 'wallet',
              params: { authorizedAddresses: formData.authorizedParties },
            },
            {
              type: 'time',
              params: { expiresAt: Date.now() + formData.expiryDays * 86400000 },
            },
          ]);
          return { fileName: doc.name, vault };
        })
      );

      // 3. Deploy smart contract (mock for demo)
      console.log('Creating deal room with vaults:', vaults);

      // 4. Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Failed to create deal room:', error);
      alert('Failed to create deal room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addParty = () => {
    setFormData({
      ...formData,
      authorizedParties: [...formData.authorizedParties, ""],
    });
  };

  const updateParty = (index: number, value: string) => {
    const updated = [...formData.authorizedParties];
    updated[index] = value;
    setFormData({ ...formData, authorizedParties: updated });
  };

  const removeParty = (index: number) => {
    const updated = formData.authorizedParties.filter((_, i) => i !== index);
    setFormData({ ...formData, authorizedParties: updated });
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-2">Create Deal Room</h1>
          <p className="text-gray-400 mb-8">
            Set up a confidential deal room with advanced access control
          </p>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-12">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                    step >= s
                      ? 'bg-vault-accent text-white'
                      : 'glass-effect text-gray-400'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-1 mx-4 transition ${
                      step > s ? 'bg-vault-accent' : 'bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="glass-effect p-8 rounded-xl">
                  <h2 className="text-2xl font-bold mb-6">Basic Information</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Deal Room Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-vault-darker border border-gray-700 rounded-lg focus:border-vault-accent focus:outline-none"
                        placeholder="e.g., TechCorp Acquisition"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Deal Type
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            type: e.target.value as any,
                          })
                        }
                        className="w-full px-4 py-3 bg-vault-darker border border-gray-700 rounded-lg focus:border-vault-accent focus:outline-none"
                      >
                        <option value="M&A">M&A Transaction</option>
                        <option value="Fundraising">Fundraising Round</option>
                        <option value="Partnership">Strategic Partnership</option>
                        <option value="Custom">Custom</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-vault-darker border border-gray-700 rounded-lg focus:border-vault-accent focus:outline-none"
                        rows={4}
                        placeholder="Describe the deal and its purpose..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Expiry (Days)
                      </label>
                      <input
                        type="number"
                        value={formData.expiryDays}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            expiryDays: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-4 py-3 bg-vault-darker border border-gray-700 rounded-lg focus:border-vault-accent focus:outline-none"
                        min="1"
                        max="365"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-vault-accent hover:bg-opacity-80 rounded-lg font-semibold transition"
                >
                  <span>Next: Access Control</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {/* Step 2: Access Control */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="glass-effect p-8 rounded-xl">
                  <h2 className="text-2xl font-bold mb-6">Access Control</h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Authorized Parties
                      </label>
                      {formData.authorizedParties.map((party, index) => (
                        <div key={index} className="flex space-x-2 mb-2">
                          <input
                            type="text"
                            value={party}
                            onChange={(e) => updateParty(index, e.target.value)}
                            className="flex-1 px-4 py-3 bg-vault-darker border border-gray-700 rounded-lg focus:border-vault-accent focus:outline-none"
                            placeholder="0x..."
                          />
                          {formData.authorizedParties.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeParty(index)}
                              className="px-4 py-3 bg-red-500 bg-opacity-20 text-red-400 rounded-lg hover:bg-opacity-30 transition"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addParty}
                        className="mt-2 px-4 py-2 glass-effect hover:bg-opacity-20 rounded-lg transition"
                      >
                        + Add Party
                      </button>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="multiSig"
                        checked={formData.requireMultiSig}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            requireMultiSig: e.target.checked,
                          })
                        }
                        className="w-5 h-5"
                      />
                      <label htmlFor="multiSig" className="font-medium">
                        Require Multi-Signature Approval
                      </label>
                    </div>

                    {formData.requireMultiSig && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Required Signatures
                        </label>
                        <input
                          type="number"
                          value={formData.requiredSignatures}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              requiredSignatures: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-4 py-3 bg-vault-darker border border-gray-700 rounded-lg focus:border-vault-accent focus:outline-none"
                          min="2"
                          max={formData.authorizedParties.length}
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="escrow"
                        checked={formData.enableEscrow}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            enableEscrow: e.target.checked,
                          })
                        }
                        className="w-5 h-5"
                      />
                      <label htmlFor="escrow" className="font-medium">
                        Enable Smart Escrow
                      </label>
                    </div>

                    {formData.enableEscrow && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Escrow Amount (ETH)
                        </label>
                        <input
                          type="text"
                          value={formData.escrowAmount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              escrowAmount: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-vault-darker border border-gray-700 rounded-lg focus:border-vault-accent focus:outline-none"
                          placeholder="0.0"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 px-6 py-4 glass-effect hover:bg-opacity-20 rounded-lg font-semibold transition"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-vault-accent hover:bg-opacity-80 rounded-lg font-semibold transition"
                  >
                    <span>Next: Upload Documents</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Upload Documents */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="glass-effect p-8 rounded-xl">
                  <h2 className="text-2xl font-bold mb-6">Upload Documents</h2>

                  <div
                    className="border-2 border-dashed border-gray-700 rounded-xl p-12 text-center hover:border-vault-accent transition cursor-pointer"
                    onClick={() => document.getElementById('fileInput')?.click()}
                  >
                    <Upload className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">
                      Drop files here or click to upload
                    </p>
                    <p className="text-sm text-gray-400">
                      All files are encrypted client-side before upload
                    </p>
                    <input
                      id="fileInput"
                      type="file"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          setFormData({
                            ...formData,
                            documents: Array.from(e.target.files),
                          });
                        }
                      }}
                      className="hidden"
                    />
                  </div>

                  {formData.documents.length > 0 && (
                    <div className="mt-6 space-y-2">
                      <h3 className="font-medium mb-3">
                        Selected Files ({formData.documents.length})
                      </h3>
                      {formData.documents.map((doc, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 glass-effect rounded-lg"
                        >
                          <span className="text-sm">{doc.name}</span>
                          <span className="text-xs text-gray-400">
                            {(doc.size / 1024).toFixed(2)} KB
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 px-6 py-4 glass-effect hover:bg-opacity-20 rounded-lg font-semibold transition"
                    disabled={loading}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || formData.documents.length === 0}
                    className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-vault-accent hover:bg-opacity-80 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5" />
                        <span>Create Deal Room</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
}
