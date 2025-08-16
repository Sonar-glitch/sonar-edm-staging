import React, { useState, useEffect } from 'react';
import EnhancedEventList from './EnhancedEventList';
import styles from '../styles/EnhancedPersonalizedDashboard.module.css';

const MyEventsContent = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/user/interested-events', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setEvents(data.events || []);
      } else {
        throw new Error(data.message || 'Failed to fetch events');
      }
    } catch (err) {
      console.error('Error fetching my events:', err.message || err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchMyEvents();
  };

  const handleRemoveEvent = async (eventId) => {
    try {
      const response = await fetch(`/api/user/interested-events?eventId=${eventId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        setEvents(prev => prev.filter(event => event.eventId !== eventId));
      } else {
        throw new Error(data.message || 'Failed to remove event');
      }
    } catch (err) {
      console.error('Error removing event:', err.message || err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Loading your saved events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h3 className={styles.errorTitle}>Unable to Load Events</h3>
        <p className={styles.errorMessage}>{error?.message || error?.toString() || 'An unknown error occurred'}</p>
        <button 
          className={styles.retryButton}
          onClick={handleRetry}
        >
          Try Again {retryCount > 0 && `(${retryCount})`}
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyIcon}>💫</div>
        <h3 className={styles.emptyTitle}>No Saved Events Yet</h3>
        <p className={styles.emptyMessage}>
          Start exploring events in the Dashboard tab and click the heart icon to save events you're interested in.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.myEventsContainer}>
      <div className={styles.myEventsHeader}>
        <h2 className={styles.myEventsTitle}>My Saved Events</h2>
        <span className={styles.eventCount}>{events.length} event{events.length !== 1 ? 's' : ''}</span>
      </div>
      
      <EnhancedEventList 
        events={events}
        onRemoveEvent={handleRemoveEvent}
        showRemoveButton={true}
      />
    </div>
  );
};

export default MyEventsContent;
