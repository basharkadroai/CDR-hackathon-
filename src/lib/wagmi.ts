import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";

// Story Protocol Testnet configuration
export const storyTestnet = {
  id: 1513,
  name: "Story Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "IP",
    symbol: "IP",
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_STORY_RPC_URL || "https://testnet.storyrpc.io"],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_STORY_RPC_URL || "https://testnet.storyrpc.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "Story Explorer",
      url: "https://testnet.storyscan.xyz",
    },
  },
  testnet: true,
};

export const config = getDefaultConfig({
  appName: "DealVault",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo-project-id",
  chains: [storyTestnet as any],
  transports: {
    [storyTestnet.id]: http(),
  },
  ssr: true,
});
