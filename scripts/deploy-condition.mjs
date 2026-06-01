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

const CONTRACT_PATH = path.join(process.cwd(), 'contracts', 'DealVaultCondition.sol');
const DEPLOYMENT_PATH = path.join(process.cwd(), 'deployments', 'story-aeneid.json');

function getPrivateKey() {
  const raw = process.env.DEPLOYER_PRIVATE_KEY ?? process.env.PRIVATE_KEY;
  if (!raw) {
    throw new Error('Set DEPLOYER_PRIVATE_KEY or PRIVATE_KEY to deploy DealVaultCondition.sol');
  }
  return raw.startsWith('0x') ? raw : `0x${raw}`;
}

function compileContract(source) {
  const input = {
    language: 'Solidity',
    sources: {
      'DealVaultCondition.sol': { content: source },
    },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode.object'],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = output.errors?.filter((entry) => entry.severity === 'error') ?? [];
  if (errors.length > 0) {
    throw new Error(errors.map((entry) => entry.formattedMessage).join('\n'));
  }

  const compiled = output.contracts?.['DealVaultCondition.sol']?.DealVaultCondition;
  if (!compiled?.evm?.bytecode?.object) {
    throw new Error('DealVaultCondition bytecode was not produced by solc');
  }

  return {
    abi: compiled.abi,
    bytecode: `0x${compiled.evm.bytecode.object}`,
  };
}

async function main() {
  const source = await fs.readFile(CONTRACT_PATH, 'utf8');
  const { abi, bytecode } = compileContract(source);
  const account = privateKeyToAccount(getPrivateKey());
  const rpcUrl = process.env.STORY_RPC_URL ?? process.env.NEXT_PUBLIC_STORY_RPC_URL ?? 'https://aeneid.storyrpc.io';

  const publicClient = createPublicClient({
    chain: storyTestnet,
    transport: http(rpcUrl),
  });
  const walletClient = createWalletClient({
    account,
    chain: storyTestnet,
    transport: http(rpcUrl),
  });

  console.log(`Deploying DealVaultCondition from ${account.address} to Story Aeneid (${storyTestnet.id})...`);
  const hash = await walletClient.deployContract({ abi, bytecode });
  console.log(`Deployment transaction: ${hash}`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (!receipt.contractAddress) {
    throw new Error(`Deployment transaction ${hash} did not return a contract address`);
  }

  const deployment = {
    chainId: storyTestnet.id,
    chainName: storyTestnet.name,
    contract: 'DealVaultCondition',
    address: receipt.contractAddress,
    transactionHash: hash,
    deployedAt: new Date().toISOString(),
    env: {
      NEXT_PUBLIC_DEALVAULT_CONDITION_ADDRESS: receipt.contractAddress,
    },
  };

  await fs.mkdir(path.dirname(DEPLOYMENT_PATH), { recursive: true });
  await fs.writeFile(DEPLOYMENT_PATH, `${JSON.stringify(deployment, null, 2)}\n`);

  console.log('\n✅ DealVaultCondition deployed');
  console.log(`Address: ${receipt.contractAddress}`);
  console.log(`Saved: ${DEPLOYMENT_PATH}`);
  console.log('\nSet this in Vercel before the final demo:');
  console.log(`NEXT_PUBLIC_DEALVAULT_CONDITION_ADDRESS=${receipt.contractAddress}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
