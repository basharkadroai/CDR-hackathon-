#!/usr/bin/env node
import fs from 'node:fs';

const deploymentPath = 'deployments/story-aeneid.json';
const deployment = fs.existsSync(deploymentPath)
  ? JSON.parse(fs.readFileSync(deploymentPath, 'utf8'))
  : null;

const hasDeployment = (name) =>
  Boolean(deployment?.contracts?.[name]?.address && deployment?.contracts?.[name]?.transactionHash);

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
    pass: hasDeployment('DealVaultCondition'),
    fix: 'Run npm run deploy:condition and set NEXT_PUBLIC_DEALVAULT_CONDITION_ADDRESS in Vercel.',
    warning: true,
  },
  {
    label: 'Escrow composability gate deployment recorded',
    pass: hasDeployment('EscrowAccessGate'),
    fix: 'Run npm run deploy:condition and set NEXT_PUBLIC_ESCROW_GATE_ADDRESS in Vercel.',
    warning: true,
  },
  {
    label: 'Real CDR proof documented',
    pass: fs.readFileSync('HACKATHON_SUBMISSION.md', 'utf8').includes('Vault UUID'),
    fix: 'Add verified CDR UUID/tx proof to HACKATHON_SUBMISSION.md.',
  },
  {
    label: 'Traction templates ready',
    pass: fs.existsSync('TRACTION_KIT.md'),
    fix: 'Add TRACTION_KIT.md with X/LinkedIn/Discord copy.',
  },
  {
    label: 'Final human checklist ready',
    pass: fs.existsSync('SUBMISSION_CHECKLIST.md'),
    fix: 'Add SUBMISSION_CHECKLIST.md.',
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

console.log('\nRepo-side readiness is complete if all checks above are green.');
console.log('Human-only next steps: record demo video, post traction links, collect screenshots/feedback, and submit the official form.');
process.exit(failed ? 1 : 0);
