'use client';

import { useEffect } from 'react';

/**
 * Auto-reload ONLY when Vercel ships a new deployment.
 *
 * Polls /api/version, which returns this deployment's commit SHA
 * (VERCEL_GIT_COMMIT_SHA — stable per deployment, changes only on a new one).
 * No tab-focus or click triggers; no reload during normal use.
 */
export default function DeploymentRefresh() {
  useEffect(() => {
    let current: string | null = null;
    let stopped = false;

    const check = async () => {
      if (stopped) return;
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        const { version } = await res.json();
        if (!version || version === 'dev') return;
        if (current === null) { current = version; return; }
        if (version !== current) {
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

    void check();
    const interval = setInterval(check, 60_000);
    return () => { stopped = true; clearInterval(interval); };
  }, []);

  return null;
}
