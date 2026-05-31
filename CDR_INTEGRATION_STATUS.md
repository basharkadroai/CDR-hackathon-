# CDR Integration Status: ✅ WORKING (Real Confidential Data Rails)

DealVault runs on **real CDR** on the Story Aeneid testnet — not a mock.
Set `NEXT_PUBLIC_USE_MOCK_CDR=false` (the production default).

## What "real CDR" means here

The access control that matters is enforced **on-chain by Story's validator set**:

1. A random **AES-256 data key** is generated client-side.
2. The file is **AES-GCM encrypted in the browser** with that key.
3. The data key is **threshold-encrypted to the validator DKG public key** and
   written to an **on-chain CDR vault** via `uploader.uploadCDR(...)`, gated by
   read/write **condition contracts**. No single party holds the key.
4. Reading calls `consumer.accessCDR(...)`, which **enforces the read condition
   on-chain**, **collects partial decryptions from validators**, and recovers
   the data key — which then decrypts the file.

## Verify it yourself

Open **`/test-cdr`** on the live site:

1. **Check Mode** → confirms `USE_MOCK_CDR=false`.
2. **Test Proxy** → fetches the live DKG global public key (no wallet needed).
3. **Test Wallet + Network** → confirms chain `0x523` (1315).
4. **Real CDR Upload** → creates an on-chain vault (returns UUID + tx hash).
5. **Real CDR Access** → recovers the key via validator partials and decrypts.

## Config

| Setting | Value |
|---|---|
| Network | Story Aeneid testnet |
| Chain ID | **1315** (`0x523`) |
| RPC | https://aeneid.storyrpc.io |
| Story-API (DKG) | http://172.192.41.96:1317 (proxied via `/api/cdr`) |
| SDK | `@piplabs/cdr-sdk` 0.2.1 |
| Write condition | `0x4C9bFC96d7092b590D497A191826C3dA2277c34B` |
| Read condition | `0xC0640AD4CF2CaA9914C8e5C44234359a9102f7a3` |

See `CDR_SDK_ISSUE_REPORT.md` for the bugs we root-caused and fixed to get here.
