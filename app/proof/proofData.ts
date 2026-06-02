/**
 * On-chain proof of real DealVault usage on Story Aeneid testnet.
 *
 * Everything here is independently verifiable on https://aeneid.storyscan.io —
 * the contract deployments and every vault's allocate transaction are real,
 * immutable on-chain records tied to the creator's wallet.
 *
 * HOW TO ADD A REAL USER:
 *   When someone creates a vault, the app shows a "Copy on-chain proof" button.
 *   Paste what they send you as a new VAULTS entry below (uuid + allocate tx +
 *   creator wallet + type). The /proof page and the distinct-wallet count update
 *   automatically. Keep it honest — only add real, verifiable transactions.
 */

export const EXPLORER = 'https://aeneid.storyscan.io';

export interface DeployedContract {
  name: string;
  purpose: string;
  address: `0x${string}`;
  deployTx: `0x${string}`;
}

export interface VaultProof {
  uuid: string;
  type: 'deal-room' | 'dead-drop' | 'multi-sig';
  /** The CDR allocate transaction — the on-chain record of this vault. */
  allocateTx: `0x${string}`;
  /** The wallet that created the vault (the proof of a distinct real user). */
  creator: `0x${string}`;
  /** Free-text note, e.g. "team verification" or "community tester". */
  note?: string;
}

export const CONTRACTS: DeployedContract[] = [
  {
    name: 'DealVaultCondition',
    purpose: 'Enforces read/write access on-chain — Secure Share expiry, dead-drop time-lock, and N-of-M multi-sig approvals.',
    address: '0xc53ddb226481aa8a582df27ca8e525f48ef20a90',
    deployTx: '0xf2a34cfbdbcdc7ea8d142ff1ef149f1214713f6bf2b0ba748b77dbfc6029c0b7',
  },
  {
    name: 'EscrowAccessGate',
    purpose: 'Composability demo — a pay-to-unlock contract can be used as an external read gate for a CDR vault.',
    address: '0x052c6ae1bd931d2e3a119ba9b81ad2408f32ded0',
    deployTx: '0x1bd66e280a9717c200369667898bc521ecea08a1afd03d29046205c339d3810c',
  },
];

export const VAULTS: VaultProof[] = [
  {
    uuid: '4457',
    type: 'deal-room',
    allocateTx: '0xc8f7fa593714e6537e1c612b3567166ba73e72d7adcae978ffd0d48c060587d1',
    creator: '0xdc8d53Cfd835C07cfadeD150a9dfE02f9B63e21e',
    note: 'Verified end-to-end: real threshold decryption recovered the original plaintext.',
  },
  // ↓ Append real community / tester vaults here as they come in.
];

export const CHAIN = { id: 1315, name: 'Story Aeneid Testnet' };
