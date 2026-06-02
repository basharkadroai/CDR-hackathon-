'use client';

import { motion, type Variants } from 'motion/react';
import { FileText, Lock, Users } from 'lucide-react';
import type { VaultMetadata } from '@/lib/cdr-service';

const ICONS: Record<VaultMetadata['type'], typeof FileText> = {
  'deal-room': FileText,
  'dead-drop': Lock,
  'multi-sig': Users,
};

// Per-type micro-animations. Each plays when the parent sidebar row sets the
// "hover" variant (Framer Motion propagates the label to this child).
const VARIANTS: Record<VaultMetadata['type'], Variants> = {
  // deal room — the document lifts a touch
  'deal-room': {
    rest: { y: 0, scale: 1, rotate: 0 },
    hover: { y: -2, scale: 1.14, rotate: -4, transition: { type: 'spring', stiffness: 420, damping: 14 } },
  },
  // dead drop — the lock jiggles like it's being unlocked
  'dead-drop': {
    rest: { rotate: 0, scale: 1 },
    hover: { rotate: [0, -14, 9, -5, 0], scale: 1.1, transition: { duration: 0.5, ease: 'easeInOut' } },
  },
  // multi-sig — the group pops in
  'multi-sig': {
    rest: { scale: 1 },
    hover: { scale: [1, 1.22, 1.08], transition: { duration: 0.38, ease: 'easeOut' } },
  },
};

export default function AnimatedVaultIcon({ type, size = 14 }: { type: VaultMetadata['type']; size?: number }) {
  const Icon = ICONS[type] ?? FileText;
  return (
    <motion.span
      className="dv-thread-ic"
      variants={VARIANTS[type] ?? VARIANTS['deal-room']}
      style={{ display: 'inline-flex', flexShrink: 0, transformOrigin: 'center' }}
    >
      <Icon size={size} />
    </motion.span>
  );
}
