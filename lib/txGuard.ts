'use client';

/**
 * Global "a wallet transaction is in flight" guard.
 *
 * On-chain flows (creating a vault, paying to unlock a Deal Room, approving a
 * multi-sig, accessing a vault) are multi-step and cost real IP. We must NEVER
 * reload the page in the middle of one — a forced reload (e.g. the deployment
 * auto-refresher) would make the user repeat the flow and pay again.
 *
 * Any code running an on-chain flow wraps it with `withTxGuard(...)` (or calls
 * begin/end). While the count is > 0:
 *   - the deployment auto-refresher defers its reload, and
 *   - the browser warns before unload (manual close/refresh).
 */

let active = 0;
const listeners = new Set<() => void>();

function beforeUnload(e: BeforeUnloadEvent) {
  e.preventDefault();
  e.returnValue = ''; // shows the browser's "Leave site?" prompt
}

function notify() {
  for (const fn of listeners) {
    try { fn(); } catch { /* ignore */ }
  }
}

export function beginTx(): void {
  if (typeof window === 'undefined') return;
  if (active === 0) window.addEventListener('beforeunload', beforeUnload);
  active += 1;
  notify();
}

export function endTx(): void {
  if (typeof window === 'undefined') return;
  active = Math.max(0, active - 1);
  if (active === 0) window.removeEventListener('beforeunload', beforeUnload);
  notify();
}

export function isTxActive(): boolean {
  return active > 0;
}

/** Subscribe to changes in the in-flight state. Returns an unsubscribe fn. */
export function onTxChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Wrap an async on-chain flow so it's protected start→finish. */
export async function withTxGuard<T>(run: () => Promise<T>): Promise<T> {
  beginTx();
  try {
    return await run();
  } finally {
    endTx();
  }
}
