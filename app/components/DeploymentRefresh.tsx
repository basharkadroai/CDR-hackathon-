'use client';

import { useEffect } from 'react';

/**
 * Auto-reload ONLY when Vercel ships a new deployment.
 *
 * We poll the site's own HTML on an interval and read the Next.js build id
 * embedded in it (the `/_next/static/<buildId>/` path). That id is stable for
 * a given deployment and changes only when a new build is deployed — so this
 * never reloads during normal use, and is not tied to tab focus/clicks.
 */
export default function DeploymentRefresh() {
  useEffect(() => {
    let current: string | null = null;
    let stopped = false;

    const getBuildId = async (): Promise<string | null> => {
      try {
        const res = await fetch('/', { cache: 'no-store' });
        const html = await res.text();
        const m = html.match(/\/_next\/static\/([^/"]+)\//);
        return m ? m[1] : null;
      } catch {
        return null;
      }
    };

    const tick = async () => {
      if (stopped) return;
      const id = await getBuildId();
      if (!id) return;
      if (current === null) {
        current = id; // first read: remember the build we loaded with
        return;
      }
      if (id !== current) {
        // a new deployment is live — refresh to it
        if ('caches' in window) {
          try {
            const names = await caches.keys();
            await Promise.all(names.map((n) => caches.delete(n)));
          } catch {
            /* ignore */
          }
        }
        window.location.reload();
      }
    };

    void tick(); // establish the baseline immediately
    const interval = setInterval(tick, 60_000); // check once a minute

    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, []);

  return null;
}
