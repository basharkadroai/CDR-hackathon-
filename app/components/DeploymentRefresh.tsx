'use client';

import { useEffect } from 'react';

export default function DeploymentRefresh() {
  useEffect(() => {
    // Only check for new deployments when user returns to the tab
    // This prevents any interruption during active use
    const handleVisibilityChange = async () => {
      // Only check when tab becomes visible (user returns)
      if (document.visibilityState === 'visible') {
        try {
          // Check if there's a new deployment by fetching the current page
          const response = await fetch(window.location.href, { 
            method: 'HEAD',
            cache: 'no-store'
          });
          
          // Get the deployment ID from Vercel headers
          const deploymentId = response.headers.get('x-vercel-id') || 
                              response.headers.get('x-vercel-deployment-url');
          
          // Store initial deployment ID on first load
          if (!sessionStorage.getItem('deploymentId') && deploymentId) {
            sessionStorage.setItem('deploymentId', deploymentId);
            return;
          }
          
          const storedDeploymentId = sessionStorage.getItem('deploymentId');
          
          // If deployment ID changed, there's a new deployment
          if (storedDeploymentId && deploymentId && deploymentId !== storedDeploymentId) {
            console.log('New Vercel deployment detected, refreshing...');
            
            // Clear caches
            if ('caches' in window) {
              caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
              });
            }
            
            // Update stored ID and reload
            sessionStorage.setItem('deploymentId', deploymentId);
            window.location.reload();
          }
        } catch (error) {
          console.log('Error checking for deployment updates:', error);
        }
      }
    };

    // Only listen for visibility changes (when user switches back to tab)
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Store initial deployment ID on mount
    const storeInitialDeployment = async () => {
      try {
        const response = await fetch(window.location.href, { 
          method: 'HEAD',
          cache: 'no-store'
        });
        
        const deploymentId = response.headers.get('x-vercel-id') || 
                            response.headers.get('x-vercel-deployment-url');
        
        if (deploymentId && !sessionStorage.getItem('deploymentId')) {
          sessionStorage.setItem('deploymentId', deploymentId);
        }
      } catch (error) {
        console.log('Error storing initial deployment ID:', error);
      }
    };

    storeInitialDeployment();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // No UI - silent check only on tab visibility change
  return null;
}
