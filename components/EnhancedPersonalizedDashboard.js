import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useLocation } from './LocationProvider';
import EnhancedLocationSearch from './EnhancedLocationSearch';

export default function EnhancedPersonalizedDashboard() {
  const { data: session } = useSession();
  const { location, isLoading: locationLoading, hasLocation, displayName, setManualLocation } = useLocation();
  
  const [events, setEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Update selected location when location context changes
  useEffect(() => {
    if (hasLocation) {
      setSelectedLocation(location);
    }
  }, [location, hasLocation]);

  // Fetch events when location is available
  useEffect(() => {
    if (hasLocation && location.latitude && location.longitude) {
      fetchEvents();
    }
  }, [location.latitude, location.longitude, location.city]);

  // Function to fetch events from API
  const fetchEvents = async () => {
    if (!hasLocation || !location.latitude || !location.longitude) {
      console.log('⚠️ Cannot fetch events: location not available');
      return;
    }

    setIsLoadingEvents(true);
    setEventsError(null);

    try {
      console.log('🎫 Fetching events for location:', location);
      
      // Build API URL with proper parameters
      const params = new URLSearchParams({
        lat: location.latitude.toString(),
        lon: location.longitude.toString(),
        city: location.city || 'Unknown',
        radius: '50'
      });

      const eventsUrl = `/api/events?${params.toString()}`;
      console.log('📡 API URL:', eventsUrl);

      const response = await fetch(eventsUrl);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Events API response:', data);

      if (data.events && Array.isArray(data.events)) {
        setEvents(data.events);
        console.log(`📅 Loaded ${data.events.length} events`);
      } else {
        console.log('⚠️ No events in API response');
        setEvents([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch events:', error);
      setEventsError(error.message);
      setEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Handle manual location selection
  const handleLocationSelect = (newLocation) => {
    console.log('📍 Manual location selected:', newLocation);
    
    // Update the location context
    setManualLocation(newLocation);
    
    // Update local state
    setSelectedLocation(newLocation);
  };

  // Handle refresh events
  const handleRefreshEvents = () => {
    console.log('🔄 Refreshing events...');
    fetchEvents();
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to access your dashboard</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-cyan-400">
                Welcome back, {session.user?.name || 'Music Lover'}!
              </h1>
            </div>
            
            {/* Location Section */}
            <div className="flex items-center space-x-4">
              {locationLoading ? (
                <div className="flex items-center space-x-2 text-gray-400">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm">Detecting location...</span>
                </div>
              ) : hasLocation ? (
                <EnhancedLocationSearch
                  selectedLocation={selectedLocation}
                  onLocationSelect={handleLocationSelect}
                />
              ) : (
                <div className="text-red-400 text-sm">
                  Location unavailable
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Location Status */}
        {!locationLoading && (
          <div className="mb-6">
            {hasLocation ? (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-400 font-medium">
                    Location detected: {displayName}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-400 font-medium">
                    Unable to detect location. Please search manually.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Events Section */}
        <div className="bg-gray-900 rounded-lg shadow-lg">
          {/* Events Header */}
          <div className="px-6 py-4 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                Events Matching Your Vibe
              </h2>
              
              {hasLocation && (
                <button
                  onClick={handleRefreshEvents}
                  disabled={isLoadingEvents}
                  className="flex items-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:opacity-50 rounded-lg transition-colors"
                >
                  {isLoadingEvents ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  <span>Refresh</span>
                </button>
              )}
            </div>
          </div>

          {/* Events Content */}
          <div className="p-6">
            {!hasLocation ? (
              // No location available
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-400 mb-2">
                  Location Required
                </h3>
                <p className="text-gray-500">
                  Please allow location access or search for your city to see events.
                </p>
              </div>
            ) : isLoadingEvents ? (
              // Loading events
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-cyan-400 mx-auto mb-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <h3 className="text-lg font-medium text-gray-400 mb-2">
                  Loading Events
                </h3>
                <p className="text-gray-500">
                  Finding the best events near you...
                </p>
              </div>
            ) : eventsError ? (
              // Error loading events
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="text-lg font-medium text-red-400 mb-2">
                  Error Loading Events
                </h3>
                <p className="text-gray-500 mb-4">
                  {eventsError}
                </p>
                <button
                  onClick={handleRefreshEvents}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : events.length === 0 ? (
              // No events found
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-400 mb-2">
                  No Events Found
                </h3>
                <p className="text-gray-500">
                  No events found near {displayName}. Try searching for a different location.
                </p>
              </div>
            ) : (
              // Display events
              <div className="space-y-4">
                {events.map((event, index) => (
                  <div
                    key={event.id || index}
                    className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-cyan-500 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {event.name || 'Untitled Event'}
                        </h3>
                        
                        {event.venue && (
                          <p className="text-gray-400 mb-2">
                            📍 {event.venue}
                          </p>
                        )}
                        
                        {event.date && (
                          <p className="text-gray-400 mb-2">
                            📅 {new Date(event.date).toLocaleDateString()}
                          </p>
                        )}
                        
                        {event.city && (
                          <p className="text-gray-400 mb-2">
                            🏙️ {event.city}
                          </p>
                        )}
                        
                        {event.source && (
                          <div className="flex items-center space-x-2 mt-3">
                            <span className="px-2 py-1 bg-cyan-600 text-white text-xs rounded">
                              {event.source}
                            </span>
                            {event.source === 'emergency' && (
                              <span className="text-yellow-400 text-xs">
                                ⚠️ Fallback event
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {event.url && (
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                        >
                          View Details
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
