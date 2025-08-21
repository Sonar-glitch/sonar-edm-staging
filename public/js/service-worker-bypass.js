// Service Worker Bypass Script
(function() {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return;
  
  // Function to unregister service workers
  const unregisterServiceWorkers = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          console.log('Service worker unregistered successfully');
        }
        
        // Clear caches
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
          console.log('Caches cleared successfully');
        }
        
        console.log('Service workers unregistered and caches cleared');
      } catch (error) {
        console.error('Error unregistering service workers:', error);
      }
    }
  };
  
  // Function to add cache-busting parameter to API requests
  const addCacheBustingToFetch = () => {
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      if (typeof url === 'string' && url.includes('/api/events')) {
        // Add cache-busting parameter
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}cacheBust=${Date.now()}`;
        console.log('Added cache-busting to events API request:', url);
      }
      return originalFetch.call(this, url, options);
    };
    console.log('Added cache-busting to fetch requests');
  };
  
  // Execute the functions
  unregisterServiceWorkers();
  addCacheBustingToFetch();
  
  console.log('Service worker bypass initialized');
})();
