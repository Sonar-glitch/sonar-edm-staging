import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import EnhancedEventList from './EnhancedEventList';
import styles from '@/styles/EnhancedPersonalizedDashboard.module.css';

const MyEventsContent = () => {
  const { data: session } = useSession();
  const [savedEvents, setSavedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session?.user) {
      fetchSavedEvents();
    }
  }, [session]);

  const fetchSavedEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/interested-events');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch saved events: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract the actual event objects from the response
      const events = data.events.map(item => item.event);
      
      setSavedEvents(events);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching saved events:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleRemoveEvent = async (eventId) => {
    try {
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
      
      // Update the local state to remove the event
      setSavedEvents(savedEvents.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Error removing event:', error);
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading your saved events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>Error loading your saved events: {error}</p>
        <button 
          className={styles.retryButton}
          onClick={fetchSavedEvents}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (savedEvents.length === 0) {
    return (
      <div className={styles.emptyStateContainer}>
        <h2>No Saved Events</h2>
        <p>You haven't saved any events yet. Browse the dashboard and click the heart icon to save events you're interested in.</p>
      </div>
    );
  }

  return (
    <div className={styles.myEventsContainer}>
      <h2 className={styles.sectionTitle}>Your Saved Events</h2>
      <EnhancedEventList 
        events={savedEvents} 
        onRemoveEvent={handleRemoveEvent}
        showMatchScore={false}
      />
    </div>
  );
};

export default MyEventsContent;
