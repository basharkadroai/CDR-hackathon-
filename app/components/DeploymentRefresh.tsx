'use client';

import { useEffect, useRef } from 'react';

export default function DeploymentRefresh() {
  const lastActivityRef = useRef(Date.now());
  const hasFormDataRef = useRef(false);

  useEffect(() => {
    // Track user activity to prevent refresh during active use
    const trackActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Track form interactions
    const trackFormData = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        const input = target as HTMLInputElement;
        if (input.value && input.value.length > 0) {
          hasFormDataRef.current = true;
        }
      }
    };

    // Listen for user interactions
    document.addEventListener('input', trackActivity);
    document.addEventListener('change', trackActivity);
    document.addEventListener('click', trackActivity);
    document.addEventListener('keydown', trackActivity);
    document.addEventListener('input', trackFormData);
    document.addEventListener('change', trackFormData);

    // Check for new deployments every 60 seconds (increased from 30)
    const interval = setInterval(async () => {
      // Don't refresh if user was active in last 2 minutes
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      if (timeSinceActivity < 120000) { // 2 minutes
        console.log('User is active, skipping deployment check');
        return;
      }

      // Don't refresh if there's form data
      if (hasFormDataRef.current) {
        console.log('Form data detected, skipping deployment check');
        return;
      }

      try {
        // Fetch a lightweight endpoint with cache busting
        const response = await fetch(`/_next/static/chunks/webpack.js?t=${Date.now()}`, { 
          method: 'HEAD',
          cache: 'no-store'
        });
        
        // If we get a 404, the build has changed (webpack chunk names change)
        if (response.status === 404) {
          clearInterval(interval);
          console.log('New deployment detected, refreshing...');
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
          console.log('Build ID changed, refreshing...');
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
    }, 60000); // Check every 60 seconds (increased from 30)

    // Also listen for visibility change to check when user returns
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        // Don't refresh if there's form data
        if (hasFormDataRef.current) {
          console.log('Form data detected, skipping visibility refresh');
          return;
        }

        try {
          const response = await fetch(`/_next/static/chunks/webpack.js?t=${Date.now()}`, { 
            method: 'HEAD',
            cache: 'no-store'
          });
          
          if (response.status === 404) {
            console.log('New deployment detected on visibility change, refreshing...');
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
      document.removeEventListener('input', trackActivity);
      document.removeEventListener('change', trackActivity);
      document.removeEventListener('click', trackActivity);
      document.removeEventListener('keydown', trackActivity);
      document.removeEventListener('input', trackFormData);
      document.removeEventListener('change', trackFormData);
    };
  }, []);

  // No UI - silent auto-refresh
  return null;
}
