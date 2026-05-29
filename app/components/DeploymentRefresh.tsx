'use client';

import { useEffect, useState } from 'react';

export default function DeploymentRefresh() {
  const [showRefresh, setShowRefresh] = useState(false);

  useEffect(() => {
    // Store the initial build timestamp
    const initialBuildTime = Date.now();
    
    // Check for new deployments every 60 seconds
    const interval = setInterval(async () => {
      try {
        // Fetch a lightweight endpoint with cache busting
        const response = await fetch(`/_next/static/chunks/webpack.js?t=${Date.now()}`, { 
          method: 'HEAD',
          cache: 'no-store'
        });
        
        // If we get a 404, the build has changed (webpack chunk names change)
        if (response.status === 404) {
          setShowRefresh(true);
          clearInterval(interval);
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
          setShowRefresh(true);
          clearInterval(interval);
        }
      } catch (error) {
        // If fetch fails, might be a new deployment
        console.log('Checking for updates...');
      }
    }, 60000); // Check every 60 seconds

    // Also listen for visibility change to check when user returns
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const response = await fetch(`/_next/static/chunks/webpack.js?t=${Date.now()}`, { 
            method: 'HEAD',
            cache: 'no-store'
          });
          
          if (response.status === 404) {
            setShowRefresh(true);
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

  const handleRefresh = () => {
    // Clear cache and reload
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowRefresh(false);
  };

  if (!showRefresh) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className="bg-[#212121] border border-[#4F9BBE] rounded-xl shadow-2xl p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-[#4F9BBE]/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-[#4F9BBE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-[#e8e8e8] mb-1">
              New Update Available! 🚀
            </h3>
            <p className="text-xs text-[#9b9b9b] mb-3">
              A new version of DealVault has been deployed. Refresh to get the latest features.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                className="px-3 py-1.5 bg-[#4F9BBE] hover:bg-[#3d8aad] text-white text-xs font-medium rounded-lg transition-colors"
              >
                Refresh Now
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 bg-[#2d2d2d] hover:bg-[#3a3a3a] text-[#9b9b9b] text-xs font-medium rounded-lg transition-colors"
              >
                Later
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-[#6b6b6b] hover:text-[#9b9b9b] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
