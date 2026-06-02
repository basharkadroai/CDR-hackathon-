'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { isTxActive, onTxChange } from '@/lib/txGuard';

/**
 * Detect when Vercel ships a new deployment and apply it WITHOUT interrupting
 * the user — and never while a wallet transaction is in flight (a forced reload
 * mid-flow would make them repeat a paid, multi-step transaction).
 *
 * `buildVersion` is the commit SHA this client was built with. We compare it to
 * the live /api/version. When they differ a newer deployment is live, so we:
 *   - show a dismissible "Refresh" pill (the user updates when ready), and
 *   - auto-apply only at a SAFE moment: the tab goes to the background AND no
 *     transaction is active (so they return to a fresh page, never mid-work).
 */
export default function DeploymentRefresh({ buildVersion }: { buildVersion: string }) {
  const [updateReady, setUpdateReady] = useState(false);
  const reloading = useRef(false);

  const doReload = useCallback(async () => {
    if (reloading.current || isTxActive()) return; // never reload mid-transaction
    reloading.current = true;
    if ('caches' in window) {
      try {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      } catch { /* ignore */ }
    }
    window.location.reload();
  }, []);

  // Poll for a newer deployment.
  useEffect(() => {
    if (!buildVersion || buildVersion === 'dev') return;
    let stop = false;
    const check = async () => {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        if (!res.ok) return;
        const { version } = await res.json();
        if (!stop && version && version !== 'dev' && version !== buildVersion) setUpdateReady(true);
      } catch { /* offline / transient — ignore */ }
    };
    void check();
    const interval = setInterval(check, 45_000);
    const onVisible = () => { if (document.visibilityState === 'visible') void check(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { stop = true; clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
  }, [buildVersion]);

  // Once an update is ready, apply it the moment it's safe: when the tab is
  // hidden and nothing is in flight, or as soon as an in-flight tx finishes
  // while the tab is already hidden.
  useEffect(() => {
    if (!updateReady) return;
    const tryWhenSafe = () => { if (document.visibilityState === 'hidden' && !isTxActive()) void doReload(); };
    document.addEventListener('visibilitychange', tryWhenSafe);
    const unsub = onTxChange(tryWhenSafe);
    return () => { document.removeEventListener('visibilitychange', tryWhenSafe); unsub(); };
  }, [updateReady, doReload]);

  if (!updateReady) return null;
  return (
    <div className="dv-update-pill" role="status">
      <span>A new version is available.</span>
      <button onClick={() => void doReload()}>Refresh</button>
    </div>
  );
}
