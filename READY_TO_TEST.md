# Ready To Test

DealVault is ready to test locally or on the live deployment.

## Live Testing

Use:

- App: https://dealvault-sable.vercel.app
- Diagnostics: https://dealvault-sable.vercel.app/test-cdr

Recommended live test order:

1. Open `/test-cdr`.
2. Check CDR mode.
3. Test the CDR proxy.
4. Connect wallet and switch to Story Aeneid.
5. Run real CDR upload.
6. Run real CDR access.
7. Create a Deal Room from the app.
8. Create a Dead Drop from the app.
9. Create or inspect a Multi-Sig vault.

## Local Testing

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

Important: on Windows, if PowerShell blocks `npm`, use `npm.cmd`.

## Expected Configuration

```env
NEXT_PUBLIC_USE_MOCK_CDR=false
NEXT_PUBLIC_STORY_RPC_URL=https://aeneid.storyrpc.io
NEXT_PUBLIC_CHAIN_ID=1315
NEXT_PUBLIC_CDR_API_URL=http://172.192.41.96:1317
NEXT_PUBLIC_DEALVAULT_CONDITION_ADDRESS=0xc53ddb226481aa8a582df27ca8e525f48ef20a90
NEXT_PUBLIC_ESCROW_GATE_ADDRESS=0x052c6ae1bd931d2e3a119ba9b81ad2408f32ded0
```

## Known Demo Limitation

The CDR-protected data key is real and on-chain. The encrypted file blob is
stored in browser localStorage for the hackathon demo, so cross-device sharing
needs IPFS/Storacha or another durable blob store for production.
