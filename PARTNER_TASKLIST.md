# DealVault - Partner Continuation Tasklist

**Last Updated:** May 29, 2026  
**Submission Deadline:** June 3, 2026 (5 days remaining)  
**Current Status:** Core UI complete, CDR integration in progress with type errors

---

## 🚨 CRITICAL PATH (Must Complete First)

### 1. Fix CDR Service Type Errors (HIGH PRIORITY)
**File:** `dealvault/lib/cdr-service.ts`

The CDR integration has several TypeScript errors that need fixing:

- [ ] **Fix CDRClient initialization** (Line ~70)
  - Error: Missing `apiUrl` property
  - Solution: Add `apiUrl: 'https://aeneid.storyrpc.io'` to CDRClient config
  
- [ ] **Fix uploadCDR call** (Line ~90)
  - Error: `data` property doesn't exist
  - Check CDR SDK docs for correct property name (likely `content` or `payload`)
  
- [ ] **Fix UUID type mismatch** (Lines ~95, ~150)
  - Error: Type 'number' vs 'string' mismatch
  - Ensure UUID is consistently typed as `string`
  
- [ ] **Fix accessCDR return type** (Line ~130)
  - Error: Return type doesn't match Blob constructor
  - Check SDK docs for correct decryption return format

- [ ] **Replace deprecated `.substr()`** (Line ~180)
  - Use `.substring()` instead

**Resources:**
- CDR SDK Docs: https://docs.usecdr.dev
- CDR SDK GitHub: https://github.com/piplabs/cdr-sdk
- Workshop Replays: https://build.usecdr.dev/live

---

## 📋 MVP COMPLETION CHECKLIST

### Phase 1: Core CDR Integration (Days 1-2)

#### Deal Room Mode
- [x] UI complete (upload, wallet list, expiry selection)
- [ ] **Test real CDR vault upload** with actual file
  - [ ] Verify encryption works
  - [ ] Confirm UUID is returned
  - [ ] Store metadata correctly
  
- [ ] **Deploy or integrate time-window read condition contract**
  - Current: Using `LICENSE_READ_CONDITION` placeholder
  - Need: Custom contract checking `block.timestamp` + wallet allowlist
  - Address: Deploy on Aeneid testnet or use existing if available
  
- [ ] **Test full Deal Room flow:**
  1. Upload document with 2 authorized wallets + 7-day expiry
  2. Switch to authorized wallet → connect → decrypt → view file
  3. Try with unauthorized wallet → should fail
  4. Verify expiry works (may need to mock timestamp for testing)

#### Dead Drop Mode
- [x] UI complete (upload, recipient wallet, unlock date)
- [ ] **Deploy or integrate future time-lock read condition contract**
  - Need: Contract checking `block.timestamp >= unlockTimestamp`
  - Need: Contract checking `msg.sender == recipientWallet`
  
- [ ] **Test full Dead Drop flow:**
  1. Upload document with future unlock date (e.g., tomorrow)
  2. Try to access before unlock → should show "Vault sealed. Unlocks in X days"
  3. Mock timestamp or wait for unlock → should decrypt successfully
  4. Try with wrong wallet → should fail

#### Dashboard
- [x] UI complete (vault list, status badges, time remaining)
- [ ] **Test vault status updates**
  - [ ] Verify "sealed" status for Dead Drops before unlock
  - [ ] Verify "active" status for accessible vaults
  - [ ] Verify "expired" status for Deal Rooms past expiry
  
- [ ] **Test access button functionality**
  - [ ] Clicking "Access" should decrypt and open file
  - [ ] Button should be disabled for sealed/expired vaults

---

### Phase 2: Condition Contracts (Days 2-3)

**CRITICAL:** The hackathon judges specifically want "advanced on-chain permission logic" for the Technical Track ($1,000).

#### Option A: Deploy Custom Contracts (Recommended)
- [ ] **Write DealRoomCondition.sol**
  ```solidity
  // Checks: block.timestamp, wallet allowlist, expiry
  function canRead(address user) external view returns (bool) {
    require(block.timestamp >= accessStart, "Not yet open");
    require(block.timestamp <= accessExpiry, "Access expired");
    require(isApproved[user], "Wallet not authorized");
    return true;
  }
  ```

- [ ] **Write DeadDropCondition.sol**
  ```solidity
  // Checks: block.timestamp, recipient wallet
  function canRead(address user) external view returns (bool) {
    require(block.timestamp >= unlockTimestamp, "Vault sealed");
    require(user == recipientWallet, "Not the recipient");
    return true;
  }
  ```

- [ ] Deploy both contracts to Story Testnet (Aeneid)
- [ ] Update `cdr-service.ts` with deployed addresses
- [ ] Test that CDR SDK respects the conditions

#### Option B: Use Existing Conditions (Faster)
- [ ] Check CDR Discord/docs for pre-deployed time-lock conditions
- [ ] Integrate existing contracts if available
- [ ] Document which contracts you're using in README

---

### Phase 3: Testing & Polish (Days 3-4)

#### End-to-End Testing
- [ ] **Test with real Story testnet tokens**
  - [ ] Get testnet IP tokens from faucet
  - [ ] Set `useMock = false` in `cdr-service.ts`
  - [ ] Run full flow with real CDR vaults
  
- [ ] **Test wallet connection edge cases**
  - [ ] No wallet installed → show helpful error
  - [ ] Wrong network → prompt to switch to Story Testnet
  - [ ] Wallet disconnected mid-session → handle gracefully

- [ ] **Test file handling**
  - [ ] Small files (< 1MB) → should work instantly
  - [ ] Large files (10MB+) → show upload progress
  - [ ] Multiple files in Deal Room → all upload correctly
  - [ ] Different file types (PDF, DOCX, images) → all decrypt correctly

#### UI/UX Polish
- [ ] **Add loading states**
  - [ ] Spinner during wallet connection
  - [ ] Progress bar during file upload
  - [ ] Loading skeleton on dashboard while fetching vaults
  
- [ ] **Add error handling**
  - [ ] Show user-friendly error messages (not raw console errors)
  - [ ] Add retry buttons for failed operations
  - [ ] Toast notifications for success/failure
  
- [ ] **Improve time display**
  - [ ] Show countdown timer for Dead Drops ("Unlocks in 5d 3h 22m")
  - [ ] Show expiry countdown for Deal Rooms
  - [ ] Update in real-time (use setInterval)

- [ ] **Add confirmation dialogs**
  - [ ] "Are you sure?" before creating Dead Drop (can't be undone)
  - [ ] "Access will expire in X days" warning for Deal Rooms

---

### Phase 4: Deployment & Promotion (Days 4-5)

#### Vercel Deployment (REQUIRED for Application Track)
- [ ] **Deploy to Vercel**
  - [ ] Connect GitHub repo to Vercel
  - [ ] Set environment variables in Vercel dashboard
  - [ ] Test live URL works end-to-end
  - [ ] Fix any production-only bugs
  
- [ ] **Update README with live URL**
- [ ] **Test on mobile** (judges might check on phone)

#### Promotion (REQUIRED for Application Track)
Judges want "evidence of real interest" — do this while building:

- [ ] **Twitter/X post** (use this template):
  ```
  Building DealVault for the @StoryProtocol CDR Hackathon 🔐
  
  Two modes:
  • Deal Room: Time-limited docs for fundraising/M&A
  • Dead Drop: Sealed docs that unlock on a future date
  
  No trusted middleman. Access enforced by smart contracts.
  
  Live demo: [your-vercel-url]
  
  #CDRHackathon #Web3
  ```

- [ ] **Post in CDR Discord** (#hackathon channel)
  - Share progress updates
  - Ask for feedback
  - Judges are watching
  
- [ ] **Share in founder communities**
  - YC Hacker News "Show HN"
  - Indie Hackers
  - Web3 founder Discords
  
- [ ] **Get 5-10 real signups**
  - Ask friends to test
  - Share in your network
  - Screenshot any feedback for submission

---

### Phase 5: Submission (Day 6 - June 3)

#### Documentation
- [ ] **Update README.md**
  - [x] Project description (already good)
  - [ ] Add "How It Works" section with CDR flow diagram
  - [ ] Add deployed contract addresses
  - [ ] Add live Vercel URL at top
  - [ ] Add screenshots of both modes
  
- [ ] **Create DEMO.md** with:
  - [ ] Step-by-step walkthrough of Deal Room mode
  - [ ] Step-by-step walkthrough of Dead Drop mode
  - [ ] Links to deployed contracts on Story explorer
  - [ ] Evidence of traction (tweets, signups, feedback)

#### Demo Video (2-3 minutes)
- [ ] **Record screen capture** showing:
  - 0:00-0:30 — Problem statement + landing page
  - 0:30-1:15 — Deal Room full flow (create → access → show on-chain condition)
  - 1:15-2:00 — Dead Drop full flow (create → show sealed → explain unlock)
  - 2:00-2:30 — Dashboard + GitHub + live URL
  
- [ ] **Upload to YouTube** (unlisted is fine)
- [ ] **Add captions** (judges might watch on mute)

#### Final Submission
- [ ] **Submit before June 3, 2026 deadline**
- [ ] Include:
  - [ ] Live Vercel URL
  - [ ] GitHub repo link
  - [ ] Demo video link
  - [ ] Brief description (use "The Pitch in Two Sentences" from hackathon doc)
  - [ ] Evidence of traction (links to tweets, signup count, feedback)

---

## 🎯 WHAT JUDGES ARE LOOKING FOR

### Technical Track ($1,000)
✅ **You have:** Two distinct condition types (time-window + wallet allowlist, future time-lock + recipient check)  
✅ **You have:** Real CDR vaults with encryption  
⚠️ **You need:** Deployed condition contracts on Aeneid testnet  
⚠️ **You need:** Evidence that conditions are enforced on-chain (show in demo)

### Application Track ($1,000 + $1,000 runner-up)
✅ **You have:** Polished UI for both modes  
✅ **You have:** Real-world use case (every startup needs this)  
✅ **You have:** Something surprising (Dead Drop — no VDR has this)  
⚠️ **You need:** Live Vercel deployment  
⚠️ **You need:** Evidence of real interest (tweets, signups, feedback)  
⚠️ **You need:** Demo video showing end-to-end flow

---

## 📚 RESOURCES

### CDR SDK & Docs
- SDK Docs: https://docs.usecdr.dev
- SDK GitHub: https://github.com/piplabs/cdr-sdk
- Workshop Replays: https://build.usecdr.dev/live
- Example App: https://onscroll.app

### Story Testnet
- RPC: https://aeneid.storyrpc.io
- Explorer: https://testnet.storyscan.xyz
- Faucet: (check Discord for testnet IP tokens)

### Hackathon
- Hackathon Page: https://build.usecdr.dev
- Discord: https://discord.gg/storyprotocol
- Registration: https://luma.com/kjdzir6d

### Deployed Contracts (Aeneid)
- `OwnerWriteCondition`: `0x4C9bFC96d7092b590D497A191826C3dA2277c34B`
- `LicenseReadCondition`: `0xC0640AD4CF2CaA9914C8e5C44234359a9102f7a3`

---

## 🚀 QUICK WINS (If Time is Tight)

If you're running out of time, prioritize these:

1. **Fix CDR type errors** (30 min) — blocks everything else
2. **Get one real CDR vault upload working** (1 hour) — proves core tech works
3. **Deploy to Vercel** (30 min) — required for submission
4. **Record demo video** (1 hour) — judges watch this first
5. **Post on Twitter** (15 min) — easy traction evidence

Skip these if needed:
- Custom condition contracts (use existing ones)
- Multiple file upload (just do single file)
- Real-time countdown timers (static display is fine)
- Mobile optimization (desktop-first is fine)

---

## 📝 NOTES FROM CURRENT IMPLEMENTATION

### What's Already Done ✅
- Landing page with wallet connection
- Deal Room UI (upload, wallet list, expiry selection)
- Dead Drop UI (upload, recipient, unlock date)
- Dashboard with vault list and status badges
- Mock CDR service for development without tokens
- Tailwind styling (looks professional)

### What's Blocking ⚠️
- CDR SDK type errors in `cdr-service.ts`
- No deployed condition contracts yet
- Haven't tested with real CDR vaults
- No Vercel deployment yet
- No promotion/traction yet

### What's Missing 🔴
- Real CDR integration (blocked by type errors)
- Custom condition contracts (or integration with existing ones)
- End-to-end testing with real vaults
- Demo video
- Evidence of traction

---

## 💡 TIPS FOR SUCCESS

1. **Fix CDR errors first** — everything else depends on this
2. **Test with real tokens ASAP** — don't wait until last day
3. **Deploy early** — catch production bugs early
4. **Promote while building** — don't wait until submission day
5. **Keep it simple** — working > fancy
6. **Document as you go** — easier than writing README at the end
7. **Ask in Discord** — Story team is responsive during hackathon

---

## 🎬 DEMO SCRIPT (Use This for Video)

```
[0:00] "Two problems with document sharing today."

[0:10] "Problem 1: Founders pay $500/month for data rooms they have to trust."

[0:20] "Problem 2: There's no way to seal a document that unlocks automatically."

[0:30] "DealVault solves both. Built on Story Protocol's CDR."

--- DEAL ROOM ---
[0:40] "I'm raising a Series A. I create a Deal Room."
[0:50] Upload cap table, financials, term sheet
[1:00] Set 2 investor wallets, 7-day expiry
[1:10] Switch to investor wallet → connect → files decrypt
[1:20] Show condition on Story explorer: "Access enforced on-chain"
[1:30] "No Dropbox. No trust. The blockchain does it."

--- DEAD DROP ---
[1:40] "But DealVault goes further."
[1:50] Upload "Succession Plan"
[2:00] Set unlock: January 1, 2027. Recipient: co-founder wallet.
[2:10] Try to open now: "Vault sealed. Unlocks in 216 days."
[2:20] "Nobody can open this. Not me. Not Story. Not anyone."
[2:30] "The smart contract controls it. That's CDR."

[2:40] Show GitHub + live URL
[2:50] "DealVault. Private documents. Zero trust required."
```

---

**Good luck! You've got 5 days. The UI is solid — now make the CDR integration work and ship it. 🚀**
