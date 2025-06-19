import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import EnhancedEventList from './EnhancedEventList';
import styles from '@/styles/EnhancedPersonalizedDashboard.module.css';

/**
 * Enhanced My Events Content Component
 * 
 * Displays user's saved/liked events with:
 * - Proper error handling
 * - Loading states
 * - Empty states
 * - Retry functionality
 */
const MyEventsContent = () => {
  const { data: session } = useSession();
  const [savedEvents, setSavedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState(null);

  useEffect(() => {
    if (session?.user) {
      fetchSavedEvents();
    }
  }, [session]);

  const fetchSavedEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/user/interested-events');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch saved events: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check for API-level errors
      if (data.error || !data.success) {
        throw new Error(data.message || 'Error fetching saved events');
      }
      
      // Set data source for verification
      setDataSource({
        source: data.source || 'unknown',
        timestamp: data.timestamp || new Date().toISOString()
      });
      
      // Extract the actual event objects from the response
      // Handle both array formats: [{event: {...}}, ...] and [{...}, ...]
      const events = Array.isArray(data.events) 
        ? data.events.map(item => item.event || item).filter(Boolean)
        : [];
      
      setSavedEvents(events);
    } catch (error) {
      console.error('Error fetching saved events:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveEvent = async (eventId) => {
    try {
      setError(null);
      
      const response = await fetch('/api/user/interested-events', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to remove event: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to remove event');
      }
      
      // Update the local state to remove the event
      setSavedEvents(savedEvents.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Error removing event:', error);
      setError(error.message);
    }
  };

  // Loading state with glassmorphic styling matching the theme
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.glassmorphicCard}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading your saved events...</p>
        </div>
      </div>
    );
  }

  // Error state with retry button
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.glassmorphicCard}>
          <h3 className={styles.errorTitle}>Unable to load events</h3>
          <p className={styles.errorMessage}>{error}</p>
          <button 
            className={styles.retryButton}
            onClick={fetchSavedEvents}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (savedEvents.length === 0) {
    return (
      <div className={styles.emptyStateContainer}>
        <div className={styles.glassmorphicCard}>
          <h2 className={styles.emptyStateTitle}>No Saved Events</h2>
          <p className={styles.emptyStateMessage}>
            You haven't saved any events yet. Browse the dashboard and click the heart icon to save events you're interested in.
          </p>
        </div>
      </div>
    );
  }

  // Events list
  return (
    <div className={styles.myEventsContainer}>
      <h2 className={styles.sectionTitle}>Your Saved Events</h2>
      
      {/* Data source indicator (only visible in development) */}
      {process.env.NODE_ENV === 'development' && dataSource && (
        <div className={styles.dataSourceIndicator}>
          Source: {dataSource.source} | Updated: {new Date(dataSource.timestamp).toLocaleTimeString()}
        </div>
      )}
      
      <EnhancedEventList 
        events={savedEvents} 
        onRemoveEvent={handleRemoveEvent}
        showMatchScore={false}
      />
    </div>
  );
};

export default MyEventsContent;
