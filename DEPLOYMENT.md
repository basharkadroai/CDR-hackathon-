# DealVault Deployment Guide

## Quick Deploy to Vercel

### Option 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to project directory
cd dealvault

# Login to Vercel
vercel login

# Deploy (first time - creates project)
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? dealvault (or your choice)
# - Directory? ./
# - Override settings? No

# Deploy to production
vercel --prod
```

### Option 2: Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import from GitHub: `basharkadroai/CDR-hackathon-`
4. Select `dealvault` folder as root directory
5. Add environment variables (see below)
6. Click "Deploy"

---

## Environment Variables

Add these in Vercel dashboard (Settings → Environment Variables):

```
NEXT_PUBLIC_STORY_RPC_URL=https://aeneid.storyrpc.io
NEXT_PUBLIC_CHAIN_ID=1315
NEXT_PUBLIC_USE_MOCK_CDR=true
```

**Note:** Keep `NEXT_PUBLIC_USE_MOCK_CDR=true` for now. Change to `false` when you have Story testnet tokens.

---

## Post-Deployment Checklist

### Immediate (After First Deploy)

- [ ] Visit your Vercel URL
- [ ] Test wallet connection
- [ ] Create a test Deal Room
- [ ] Create a test Dead Drop
- [ ] Check dashboard displays vaults
- [ ] Test accessing a vault
- [ ] Verify mobile responsiveness

### Update Documentation

- [ ] Add Vercel URL to README.md
- [ ] Update DEMO_SCRIPT.md with live URL
- [ ] Update PROMOTION.md templates with URL
- [ ] Add URL to GitHub repo description

### Promote

- [ ] Post launch tweet with URL
- [ ] Share in CDR Discord with URL
- [ ] Update LinkedIn post with URL
- [ ] Post to Reddit with URL

---

## Custom Domain (Optional)

If you want a custom domain:

1. Go to Vercel dashboard → Your project → Settings → Domains
2. Add your domain (e.g., `dealvault.xyz`)
3. Follow DNS configuration instructions
4. Wait for DNS propagation (5-30 minutes)

---

## Monitoring

### Vercel Analytics

Vercel automatically tracks:
- Page views
- Unique visitors
- Top pages
- Referrers

View at: Vercel Dashboard → Your Project → Analytics

### What to Monitor

- [ ] Total visits
- [ ] Wallet connections (check localStorage in browser console)
- [ ] Vaults created (check localStorage)
- [ ] Bounce rate
- [ ] Time on site

---

## Troubleshooting

### Build Fails

**Error: Module not found**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Error: TypeScript errors**
```bash
# Check for type errors locally
npm run build
```

### Runtime Errors

**Error: window.ethereum is undefined**
- User needs MetaMask installed
- Add better error message in UI

**Error: Failed to connect wallet**
- Check if user is on correct network
- Add network switching prompt

### Performance Issues

**Slow page loads**
- Check Vercel Analytics for bottlenecks
- Optimize images if any
- Check bundle size: `npm run build` shows sizes

---

## Updating Deployment

### Push Updates

```bash
# Make changes locally
git add .
git commit -m "Your update message"
git push origin origin

# Vercel auto-deploys from GitHub
# Or manually deploy:
vercel --prod
```

### Rollback

If something breaks:

1. Go to Vercel Dashboard → Your Project → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

---

## Production Checklist (Before Submission)

### Functionality
- [ ] Wallet connection works
- [ ] Deal Room creation works
- [ ] Dead Drop creation works
- [ ] Dashboard displays vaults
- [ ] Vault access works
- [ ] Time remaining displays correctly
- [ ] Status badges show correctly

### UX
- [ ] All buttons visible and clickable
- [ ] Forms validate input
- [ ] Error messages are helpful
- [ ] Loading states show
- [ ] Mobile responsive
- [ ] No console errors

### Content
- [ ] README has live URL
- [ ] Demo video uploaded
- [ ] Promotion posts ready
- [ ] GitHub repo clean

### Performance
- [ ] Page loads < 3 seconds
- [ ] No JavaScript errors
- [ ] Works in Chrome, Firefox, Safari
- [ ] Works on mobile

---

## Submission Requirements

For CDR Hackathon submission, you need:

1. **Live Vercel URL** ✓
2. **GitHub repo** ✓
3. **Demo video** (record after deploy)
4. **README with setup instructions** ✓
5. **Evidence of traction** (tweets, Discord posts)

---

## Getting Story Testnet Tokens

If you want to test real CDR integration:

1. Join Story Discord: https://discord.gg/storybuilders
2. Ask in #faucet channel for testnet tokens
3. Provide your wallet address
4. Wait for tokens
5. Update `.env.local`: `NEXT_PUBLIC_USE_MOCK_CDR=false`
6. Redeploy to Vercel

---

## Support

If you run into issues:

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Story Discord:** https://discord.gg/storybuilders
- **CDR SDK Docs:** https://docs.story.foundation/developers/cdr-sdk/overview

---

## Post-Hackathon

After the hackathon, consider:

- [ ] Add analytics (PostHog, Mixpanel)
- [ ] Add error tracking (Sentry)
- [ ] Set up monitoring (Vercel, Datadog)
- [ ] Add user feedback form
- [ ] Create landing page with demo video
- [ ] Write blog post about building it
- [ ] Apply for grants/funding

---

**You're ready to deploy! 🚀**

Run `vercel --prod` and share your URL!
