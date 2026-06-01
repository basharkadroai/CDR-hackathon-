#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import solc from 'solc';
import { createPublicClient, createWalletClient, defineChain, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const storyTestnet = defineChain({
  id: 1315,
  name: 'Story Aeneid Testnet',
  nativeCurrency: { decimals: 18, name: 'IP', symbol: 'IP' },
  rpcUrls: { default: { http: ['https://aeneid.storyrpc.io'] } },
  blockExplorers: { default: { name: 'StoryScan', url: 'https://aeneid.storyscan.io' } },
});

const CONTRACTS_DIR = path.join(process.cwd(), 'contracts');
const DEPLOYMENT_PATH = path.join(process.cwd(), 'deployments', 'story-aeneid.json');

// Contracts to compile + deploy, in order.
const TARGETS = [
  { file: 'DealVaultCondition.sol', name: 'DealVaultCondition', env: 'NEXT_PUBLIC_DEALVAULT_CONDITION_ADDRESS' },
  { file: 'EscrowAccessGate.sol', name: 'EscrowAccessGate', env: 'NEXT_PUBLIC_ESCROW_GATE_ADDRESS' },
];

function getPrivateKey() {
  const raw = process.env.DEPLOYER_PRIVATE_KEY ?? process.env.PRIVATE_KEY;
  if (!raw) {
    throw new Error('Set DEPLOYER_PRIVATE_KEY or PRIVATE_KEY to deploy the contracts');
  }
  return raw.startsWith('0x') ? raw : `0x${raw}`;
}

async function compileAll() {
  const sources = {};
  for (const t of TARGETS) {
    sources[t.file] = { content: await fs.readFile(path.join(CONTRACTS_DIR, t.file), 'utf8') };
  }

  const input = {
    language: 'Solidity',
    sources,
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
      outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = output.errors?.filter((e) => e.severity === 'error') ?? [];
  if (errors.length > 0) {
    throw new Error(errors.map((e) => e.formattedMessage).join('\n'));
  }

  const compiled = {};
  for (const t of TARGETS) {
    const c = output.contracts?.[t.file]?.[t.name];
    if (!c?.evm?.bytecode?.object) {
      throw new Error(`${t.name} bytecode was not produced by solc`);
    }
    compiled[t.name] = { abi: c.abi, bytecode: `0x${c.evm.bytecode.object}` };
  }
  return compiled;
}

async function main() {
  const compiled = await compileAll();
  const account = privateKeyToAccount(getPrivateKey());
  const rpcUrl =
    process.env.STORY_RPC_URL ?? process.env.NEXT_PUBLIC_STORY_RPC_URL ?? 'https://aeneid.storyrpc.io';

  const publicClient = createPublicClient({ chain: storyTestnet, transport: http(rpcUrl) });
  const walletClient = createWalletClient({ account, chain: storyTestnet, transport: http(rpcUrl) });

  console.log(`Deployer: ${account.address}`);
  console.log(`Network:  Story Aeneid (${storyTestnet.id})\n`);

  const deployed = {};
  const env = {};

  for (const t of TARGETS) {
    const { abi, bytecode } = compiled[t.name];
    console.log(`Deploying ${t.name}...`);
    const hash = await walletClient.deployContract({ abi, bytecode });
    console.log(`  tx: ${hash}`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (!receipt.contractAddress) {
      throw new Error(`${t.name} deployment ${hash} returned no contract address`);
    }
    console.log(`  ✅ ${t.name} @ ${receipt.contractAddress}\n`);
    deployed[t.name] = { address: receipt.contractAddress, transactionHash: hash };
    env[t.env] = receipt.contractAddress;
  }

  const deployment = {
    chainId: storyTestnet.id,
    chainName: storyTestnet.name,
    deployedAt: new Date().toISOString(),
    deployer: account.address,
    contracts: deployed,
    env,
  };

  await fs.mkdir(path.dirname(DEPLOYMENT_PATH), { recursive: true });
  await fs.writeFile(DEPLOYMENT_PATH, `${JSON.stringify(deployment, null, 2)}\n`);

  console.log('✅ All contracts deployed.');
  console.log(`Saved: ${DEPLOYMENT_PATH}\n`);
  console.log('Set these in Vercel (Project → Settings → Environment Variables) before the demo:');
  for (const [k, v] of Object.entries(env)) console.log(`${k}=${v}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
