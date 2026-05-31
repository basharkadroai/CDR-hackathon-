# CDR Integration: Debugging Journey & Resolution

Getting real CDR working on the Aeneid testnet took real debugging. This is the
trail — and the fixes. **All three blockers are resolved; the app runs on real CDR.**

## Symptom

`getGlobalPubKey()` threw:

```
TypeError: Cannot read properties of undefined (reading 'replace')
  at joinPath (story-api/transport.js)
  at Observer.fetchLatestActive → getGlobalPubKey
```

## Root causes (3 distinct bugs)

### 1. Mixed-content block (the real cause of the crash)
The Story-API DKG endpoint is plain HTTP (`http://172.192.41.96:1317`). Our
production site is HTTPS, so the browser **silently blocked** the cross-origin
HTTP request. The SDK received `undefined`, then `apiUrl.replace(...)` threw.

**Fix:** a same-origin Next.js proxy (`app/api/cdr/[...path]/route.ts`) forwards
DKG reads server-side. The client sets `apiUrl = ${origin}/api/cdr`, so every
request is same-origin HTTPS. Verified: `/api/cdr/dkg/global_public_key` returns
the live DKG key.

### 2. Wrong chain ID
The app used chain id **1513**. The Aeneid testnet is **1315** (`eth_chainId`
returns `0x523`). The mismatch broke viem's client/RPC alignment and every tx.

**Fix:** corrected `lib/wallet.ts`, env, and docs to **1315**.

### 3. `uploadCDR` was called incorrectly
The previous call passed a `data: fileBuffer` field that `uploadCDR` ignores, and
omitted the required `writeConditionData` / `readConditionData` / `accessAuxData`
params. `uploadCDR` protects a **data key**, not the file bytes.

**Fix:** adopted the canonical pattern — AES-GCM encrypt the file with a random
data key client-side, and use `uploadCDR` (with all required params) to put that
key under on-chain CDR access control. `accessCDR` recovers it via validator
partials on read.

## Build fixes (so real CDR ships to production)
- Installed `multiformats` (static import pulled in by the SDK storage barrel).
- Added a webpack `node:`-scheme rewrite + client fallbacks so the WASM crypto
  module (`@piplabs/cdr-crypto`) bundles for the browser.
- Added `@piplabs/cdr-crypto` to `transpilePackages`.

## Result
Real, on-chain CDR: threshold-encrypted keys, validator-enforced conditions,
no trusted middleman. Verify at **`/test-cdr`** on the live site.
