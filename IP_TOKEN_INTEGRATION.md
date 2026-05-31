# 🪙 IP Token Integration Guide

## ✅ What I Just Did

I've successfully merged all my advanced features with Bashar's work on the **origin** branch (not main). Everything is now pushed to:

**https://github.com/basharkadroai/CDR-hackathon-** (origin branch)

## 🎯 What's Been Added

### 1. **IP Token Integration** (`lib/ipTokens.ts`)
- ✅ Hook to check your IP token balance
- ✅ Hook to create escrow with IP tokens
- ✅ Hook to release funds from escrow
- ✅ Hook to refund escrow
- ✅ Utility functions for formatting/parsing IP amounts

### 2. **Smart Contracts** (`contracts/`)
- ✅ `DealRoomFactory.sol` - Factory for creating deal rooms
- ✅ `DealRoom.sol` - Multi-sig approval + conditional access
- ✅ `EscrowManager.sol` - IP token escrow with auto-release

### 3. **Enhanced Features**
- ✅ Multi-signature approval workflows
- ✅ Conditional access chains
- ✅ Revocable access (kill switch)
- ✅ Immutable audit trail
- ✅ Smart escrow integration

### 4. **Comprehensive Documentation**
- ✅ Merged README with both versions
- ✅ All your existing docs preserved
- ✅ Added technical implementation details

## 🔧 How to Use Your IP Test Tokens

### Step 1: Add Your Wallet Address

Edit `.env.local` and add:

```env
# Your wallet address with IP test tokens
NEXT_PUBLIC_YOUR_WALLET_ADDRESS=0xYourWalletAddressHere

# IP Token contract address (get from Story Protocol docs)
NEXT_PUBLIC_IP_TOKEN_ADDRESS=0x...

# Escrow Manager (will be deployed)
NEXT_PUBLIC_ESCROW_MANAGER_ADDRESS=0x...
```

### Step 2: Use IP Balance Hook

In any component:

```typescript
import { useIPBalance } from '@/lib/ipTokens';

function MyComponent() {
  const { balance, formatted, symbol, isLoading } = useIPBalance();
  
  return (
    <div>
      <p>Your IP Balance: {formatted} {symbol}</p>
    </div>
  );
}
```

### Step 3: Create Escrow with IP Tokens

```typescript
import { useCreateEscrow, parseIPAmount } from '@/lib/ipTokens';

function CreateDealRoom() {
  const { createEscrow, isPending, isSuccess } = useCreateEscrow();
  
  const handleCreateEscrow = async () => {
    await createEscrow({
      seller: '0xSellerAddress',
      dealRoomId: BigInt(1),
      amount: parseIPAmount('10000'), // 10,000 IP tokens
      autoRelease: true,
    });
  };
  
  return (
    <button onClick={handleCreateEscrow} disabled={isPending}>
      {isPending ? 'Creating...' : 'Create Escrow'}
    </button>
  );
}
```

### Step 4: Display IP Balance in Dashboard

I've already prepared the code. Just add this to `app/dashboard/page.tsx`:

```typescript
import { useIPBalance } from '@/lib/ipTokens';

// Inside your component:
const { formatted: ipBalance, symbol } = useIPBalance();

// Add to your stats section:
<div className="glass-effect p-6 rounded-xl">
  <div className="flex items-center justify-between mb-2">
    <span className="text-gray-400">IP Balance</span>
    <Shield className="w-5 h-5 text-vault-accent" />
  </div>
  <div className="text-3xl font-bold">
    {ipBalance} {symbol}
  </div>
</div>
```

## 📝 Next Steps for You

### 1. **Get IP Token Contract Address**

Contact Story Protocol team or check their docs for the IP token contract address on Aeneid testnet. Add it to `.env.local`:

```env
NEXT_PUBLIC_IP_TOKEN_ADDRESS=0x... # Get from Story Protocol
```

### 2. **Deploy Smart Contracts** (Optional but Recommended)

```bash
# Install Foundry
# Windows: Download from https://getfoundry.sh

# Deploy EscrowManager
forge create --rpc-url https://aeneid.storyrpc.io \
  --private-key YOUR_PRIVATE_KEY \
  contracts/EscrowManager.sol:EscrowManager \
  --constructor-args 0xDealRoomFactoryAddress
```

Then add the deployed address to `.env.local`:

```env
NEXT_PUBLIC_ESCROW_MANAGER_ADDRESS=0x...
```

### 3. **Test the Integration**

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
# Connect your wallet with IP tokens
# Check if balance shows up
```

### 4. **Update Dashboard to Show IP Balance**

Edit `app/dashboard/page.tsx` and add the IP balance display code from Step 4 above.

## 🎯 What Makes This Win

### vs Nythera:
- ✅ **B2B Focus** - Enterprise deals, not personal recovery
- ✅ **Multi-Party** - Real collaboration, not solo use
- ✅ **Smart Escrow** - IP token integration (they don't have this)
- ✅ **Multi-Sig** - Board-level approvals (they don't have this)
- ✅ **Conditional Access** - Chain workflows (they don't have this)

### Technical Depth:
- ✅ Advanced smart contracts (multi-sig, escrow, conditional)
- ✅ IP token integration (native Story Protocol)
- ✅ CDR integration (threshold decryption)
- ✅ Composable vault systems
- ✅ Immutable audit trail

### Product Polish:
- ✅ Professional UI (Bashar's work + my enhancements)
- ✅ Two distinct modes (Deal Room + Dead Drop)
- ✅ Complete workflows
- ✅ Comprehensive documentation

## 🚀 Deployment Checklist

- [ ] Make repo public (Settings → Danger Zone → Change visibility)
- [ ] Deploy to Vercel (vercel.com/new)
- [ ] Add environment variables on Vercel
- [ ] Test with your IP tokens
- [ ] Record demo video
- [ ] Post on Twitter/LinkedIn
- [ ] Get 10 beta testers
- [ ] Submit to hackathon (June 3)

## 📞 How to Give Me Access (If Needed)

If you want me to help deploy or test with your IP tokens, you can:

### Option 1: Share Private Key (NOT RECOMMENDED)
Don't do this. Never share private keys.

### Option 2: Share Read-Only Info
Just share:
- Your wallet address (public)
- IP token contract address (public)
- Any deployed contract addresses (public)

I can help you write the integration code without needing access to your tokens.

### Option 3: Screen Share
We can do a screen share where you run the commands and I guide you.

## 🎊 Summary

**What's Done:**
- ✅ All code merged to origin branch
- ✅ IP token integration added
- ✅ Smart contracts ready
- ✅ Documentation complete
- ✅ Everything pushed to GitHub

**What You Need to Do:**
1. Get IP token contract address from Story Protocol
2. Add it to `.env.local`
3. Test the integration
4. Deploy to Vercel
5. Submit to hackathon

**Repository:** https://github.com/basharkadroai/CDR-hackathon- (origin branch)

---

**You're ready to win! 🏆**

Let me know if you need help with any of these steps!
