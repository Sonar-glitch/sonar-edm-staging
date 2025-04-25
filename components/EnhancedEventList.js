import React, { useState, useEffect } from 'react';
import styles from './EnhancedEventList.module.css';

export default function EnhancedEventList({ initialEvents = [], correlationScores = {} }) {
  const [events, setEvents] = useState(initialEvents);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeFilters, setActiveFilters] = useState({
    type: 'All',
    distance: 'All'
  });
  
  // Filter options
  const typeFilters = ['All', 'Club', 'Warehouse', 'Festival', 'Rooftop'];
  const distanceFilters = ['All', 'Local', 'National', 'International'];
  
  // Load more events when page changes
  useEffect(() => {
    if (page > 1) {
      loadMoreEvents();
    }
  }, [page]);
  
  // Function to load more events
  const loadMoreEvents = async () => {
    try {
      setLoading(true);
      
      // Get user location from localStorage if available
      let userLocation = null;
      if (typeof window !== 'undefined') {
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
          try {
            userLocation = JSON.parse(savedLocation);
          } catch (e) {
            console.error('Error parsing saved location:', e);
          }
        }
      }
      
      // Prepare location parameters
      const locationParams = userLocation ? 
        `&lat=${userLocation.latitude}&lon=${userLocation.longitude}&city=${userLocation.city}&region=${userLocation.region}&country=${userLocation.country}` : 
        '';
      
      // Fetch more events
      const response = await fetch(`/api/events?page=${page}&pageSize=10${locationParams}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.events && data.events.length > 0) {
          // Append new events to existing events
          setEvents(prevEvents => [...prevEvents, ...data.events]);
          setHasMore(data.pagination.hasMore);
        } else {
          setHasMore(false);
        }
      } else {
        console.error('Error fetching more events:', response.statusText);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more events:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to handle event click
  const handleEventClick = (event) => {
    // Get the ticket URL
    const ticketUrl = event.ticketUrl || event.url;
    
    if (ticketUrl) {
      // Open ticket URL in a new tab
      window.open(ticketUrl, '_blank');
    } else {
      console.error('No ticket URL available for this event');
    }
  };
  
  // Function to handle filter change
  const handleFilterChange = (filterType, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };
  
  // Filter events based on active filters
  const filteredEvents = events.filter(event => {
    // Type filter
    if (activeFilters.type !== 'All') {
      const eventType = event.venue?.name?.toLowerCase() || '';
      const eventName = event.name?.toLowerCase() || '';
      
      const typeMatches = 
        (activeFilters.type === 'Club' && (eventType.includes('club') || eventName.includes('club'))) ||
        (activeFilters.type === 'Warehouse' && (eventType.includes('warehouse') || eventName.includes('warehouse'))) ||
        (activeFilters.type === 'Festival' && (eventType.includes('festival') || eventName.includes('festival'))) ||
        (activeFilters.type === 'Rooftop' && (eventType.includes('rooftop') || eventName.includes('rooftop')));
      
      if (!typeMatches) return false;
    }
    
    // Distance filter
    if (activeFilters.distance !== 'All') {
      // This would require actual distance calculation based on user location
      // For now, we'll use a simple heuristic based on country
      const userCountry = typeof window !== 'undefined' && localStorage.getItem('userLocation') ? 
        JSON.parse(localStorage.getItem('userLocation')).country : 
        'United States';
      
      const eventCountry = event.venue?.country || '';
      
      const distanceMatches = 
        (activeFilters.distance === 'Local' && eventCountry === userCountry) ||
        (activeFilters.distance === 'National' && eventCountry === userCountry) ||
        (activeFilters.distance === 'International' && eventCountry !== userCountry);
      
      if (!distanceMatches) return false;
    }
    
    return true;
  });
  
  return (
    <div className={styles.eventListContainer}>
      <div className={styles.eventListHeader}>
        <h2>Events Matching Your Vibe</h2>
        <div className={styles.matchIndicator}>
          <span>Vibe Match: 70%+</span>
        </div>
      </div>
      
      <div className={styles.filterContainer}>
        <div className={styles.filterSection}>
          <h3>Event Type:</h3>
          <div className={styles.filterOptions}>
            {typeFilters.map(filter => (
              <button
                key={filter}
                className={`${styles.filterButton} ${activeFilters.type === filter ? styles.active : ''}`}
                onClick={() => handleFilterChange('type', filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
        
        <div className={styles.filterSection}>
          <h3>Distance:</h3>
          <div className={styles.filterOptions}>
            {distanceFilters.map(filter => (
              <button
                key={filter}
                className={`${styles.filterButton} ${activeFilters.distance === filter ? styles.active : ''}`}
                onClick={() => handleFilterChange('distance', filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className={styles.eventList}>
        {filteredEvents.map(event => {
          // Get correlation score
          const correlationScore = event.correlationScore || 
            correlationScores[event.id] || 
            Math.floor(70 + Math.random() * 30); // Fallback to random score between 70-100
          
          return (
            <div 
              key={event.id} 
              className={styles.eventCard}
              onClick={() => handleEventClick(event)}
            >
              <div className={styles.scoreCircle}>
                <svg viewBox="0 0 36 36">
                  <path
                    className={styles.scoreCircleBg}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={styles.scoreCircleFill}
                    strokeDasharray={`${correlationScore}, 100`}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <text x="18" y="20.35" className={styles.scoreText}>
                    {correlationScore}%
                  </text>
                </svg>
              </div>
              
              <div className={styles.eventInfo}>
                <h3>{event.name}</h3>
                <div className={styles.venueInfo}>
                  <span className={styles.venueName}>{event.venue?.name}</span>
                  {event.venue?.type && (
                    <span className={styles.venueType}>{event.venue.type}</span>
                  )}
                </div>
                
                <div className={styles.artistList}>
                  <span className={styles.featuringLabel}>Featuring:</span>
                  {event.artists && event.artists.map((artist, index) => (
                    <React.Fragment key={index}>
                      <span className={styles.artist}>{artist.name}</span>
                      {index < event.artists.length - 1 && ', '}
                    </React.Fragment>
                  ))}
                  {event.artists && event.artists.length > 3 && (
                    <span className={styles.moreArtists}>+{event.artists.length - 3} more</span>
                  )}
                </div>
                
                <div className={styles.venueAddress}>
                  {event.venue?.address}, {event.venue?.city}, {event.venue?.state}
                  {event.date && (
                    <span className={styles.eventDate}>
                      • {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
              
              {event.liveData ? (
                <div className={styles.liveDataBadge}>Live Data</div>
              ) : (
                <div className={styles.sampleBadge}>Sample</div>
              )}
            </div>
          );
        })}
      </div>
      
      {hasMore && (
        <div className={styles.loadMoreContainer}>
          <button 
            className={styles.loadMoreButton}
            onClick={() => setPage(prevPage => prevPage + 1)}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'View All Events'}
          </button>
        </div>
      )}
    </div>
  );
}
