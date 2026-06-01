#!/usr/bin/env node
import fs from 'node:fs';

const checks = [
  {
    label: 'CDR condition contract exists',
    pass: fs.existsSync('contracts/DealVaultCondition.sol'),
    fix: 'Add contracts/DealVaultCondition.sol.',
  },
  {
    label: 'CDR service supports condition env var',
    pass: fs.readFileSync('lib/cdr-service.ts', 'utf8').includes('NEXT_PUBLIC_DEALVAULT_CONDITION_ADDRESS'),
    fix: 'Wire NEXT_PUBLIC_DEALVAULT_CONDITION_ADDRESS into lib/cdr-service.ts.',
  },
  {
    label: 'Deployment script exists',
    pass: fs.existsSync('scripts/deploy-condition.mjs'),
    fix: 'Add scripts/deploy-condition.mjs.',
  },
  {
    label: 'Submission guide exists',
    pass: fs.existsSync('HACKATHON_SUBMISSION.md'),
    fix: 'Add HACKATHON_SUBMISSION.md.',
  },
  {
    label: 'Condition contract deployment recorded',
    pass: fs.existsSync('deployments/story-aeneid.json'),
    fix: 'Run npm run deploy:condition and set NEXT_PUBLIC_DEALVAULT_CONDITION_ADDRESS in Vercel.',
    warning: true,
  },
];

let failed = false;
for (const check of checks) {
  if (check.pass) {
    console.log(`✅ ${check.label}`);
  } else if (check.warning) {
    console.log(`⚠️  ${check.label} — ${check.fix}`);
  } else {
    failed = true;
    console.log(`❌ ${check.label} — ${check.fix}`);
  }
}

console.log('\nNext human steps: deploy DealVaultCondition, set Vercel env, redeploy, record tx/address, and add traction links/screenshots.');
process.exit(failed ? 1 : 0);
