'use client';

import { useEffect, useRef } from 'react';

/**
 * Auto-reload ONLY when Vercel ships a new deployment.
 *
 * `buildVersion` is the commit SHA this client was BUILT with (read from
 * process.env.VERCEL_GIT_COMMIT_SHA in the server layout at build time). We
 * compare it against the live /api/version (the SHA of the deployment that's
 * currently serving). When they differ, a newer deployment is live → reload.
 *
 * Baseline = the build the client is actually running (no first-poll race).
 * We check on an interval AND whenever the tab regains focus (browsers throttle
 * background timers, so visibility is what catches most real cases).
 */
export default function DeploymentRefresh({ buildVersion }: { buildVersion: string }) {
  const reloading = useRef(false);

  useEffect(() => {
    if (!buildVersion || buildVersion === 'dev') return;

    const check = async () => {
      if (reloading.current) return;
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        if (!res.ok) return;
        const { version } = await res.json();
        if (version && version !== 'dev' && version !== buildVersion) {
          reloading.current = true;
          if ('caches' in window) {
            try {
              const names = await caches.keys();
              await Promise.all(names.map((n) => caches.delete(n)));
            } catch { /* ignore */ }
          }
          window.location.reload();
        }
      } catch { /* offline / transient — ignore */ }
    };

    const onVisible = () => { if (document.visibilityState === 'visible') void check(); };

    void check();
    const interval = setInterval(check, 45_000);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [buildVersion]);

  return null;
}
