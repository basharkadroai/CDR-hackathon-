'use client';

import { forwardRef } from 'react';
import { FileTextIcon, LockIcon, UsersIcon, HandCoinsIcon } from 'lucide-animated';
import type { VaultMetadata } from '@/lib/cdr-service';

/** Imperative handle exposed by every lucide-animated icon. */
export interface VaultIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

type AnimatedIcon = React.ForwardRefExoticComponent<
  { size?: number; className?: string } & React.RefAttributes<VaultIconHandle>
>;

// Path-level animated Lucide icons (lucide-animated / pqoqubbw). The lines of
// the document draw, the lock shackle moves, the group of users animates in.
const MAP: Record<VaultMetadata['type'], AnimatedIcon> = {
  'deal-room': FileTextIcon as unknown as AnimatedIcon,
  'dead-drop': LockIcon as unknown as AnimatedIcon,
  'multi-sig': UsersIcon as unknown as AnimatedIcon,
  'marketplace': HandCoinsIcon as unknown as AnimatedIcon,
};

/**
 * The animation is driven imperatively by the parent row (see Sidebar), so the
 * icon plays when you hover anywhere on the vault row — not only over the icon.
 */
const AnimatedVaultIcon = forwardRef<VaultIconHandle, { type: VaultMetadata['type']; size?: number }>(
  function AnimatedVaultIcon({ type, size = 16 }, ref) {
    const Icon = MAP[type] ?? MAP['deal-room'];
    return <Icon ref={ref} size={size} className="dv-thread-ic" />;
  },
);

export default AnimatedVaultIcon;
