'use client';

import { useEffect } from 'react';

export default function DeploymentRefresh() {
  useEffect(() => {
    // Check for new deployments every 30 seconds
    const interval = setInterval(async () => {
      try {
        // Fetch a lightweight endpoint with cache busting
        const response = await fetch(`/_next/static/chunks/webpack.js?t=${Date.now()}`, { 
          method: 'HEAD',
          cache: 'no-store'
        });
        
        // If we get a 404, the build has changed (webpack chunk names change)
        if (response.status === 404) {
          clearInterval(interval);
          // Auto-refresh silently
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => caches.delete(name));
            });
          }
          window.location.reload();
          return;
        }

        // Also check the build ID from meta tag or headers
        const buildId = response.headers.get('x-vercel-id') || 
                       response.headers.get('x-vercel-deployment-url');
        
        // Store initial build ID
        if (!sessionStorage.getItem('buildId') && buildId) {
          sessionStorage.setItem('buildId', buildId);
        }
        
        const storedBuildId = sessionStorage.getItem('buildId');
        if (storedBuildId && buildId && buildId !== storedBuildId) {
          clearInterval(interval);
          // Auto-refresh silently
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => caches.delete(name));
            });
          }
          window.location.reload();
        }
      } catch (error) {
        // If fetch fails, might be a new deployment
        console.log('Checking for updates...');
      }
    }, 30000); // Check every 30 seconds

    // Also listen for visibility change to check when user returns
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const response = await fetch(`/_next/static/chunks/webpack.js?t=${Date.now()}`, { 
            method: 'HEAD',
            cache: 'no-store'
          });
          
          if (response.status === 404) {
            // Auto-refresh silently
            if ('caches' in window) {
              caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
              });
            }
            window.location.reload();
          }
        } catch (error) {
          console.log('Checking for updates on visibility change...');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // No UI - silent auto-refresh
  return null;
}
