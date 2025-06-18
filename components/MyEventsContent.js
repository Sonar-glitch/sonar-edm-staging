import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import EnhancedEventList from './EnhancedEventList';
import EventDetailModal from './EventDetailModal';
import styles from '@/styles/EnhancedPersonalizedDashboard.module.css';

const MyEventsContent = () => {
  const { data: session } = useSession();
  const [interestedEvents, setInterestedEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchInterestedEvents();
    }
  }, [session]);

  const fetchInterestedEvents = async () => {
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
        throw new Error(`Failed to fetch interested events: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setInterestedEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching interested events:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const handleRemoveEvent = async (eventId) => {
    try {
      const response = await fetch('/api/user/interested-events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });
      
      if (response.ok) {
        setInterestedEvents(prevEvents => 
          prevEvents.filter(event => (event._id || event.id) !== eventId)
        );
      }
    } catch (error) {
      console.error('Error removing event:', error);
    }
  };

  return (
    <div className={styles.mainContent}>
      <div className={styles.eventsSection}>
        <div className={styles.eventsHeader}>
          <h2 className={styles.sectionTitle}>My Saved Events</h2>
          <span className={styles.dataIndicator}>
            {interestedEvents.length} saved event{interestedEvents.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        {loading && (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading your saved events...</p>
          </div>
        )}
        
        {error && (
          <div className={styles.error}>
            <p>Error loading saved events: {error}</p>
            <button onClick={fetchInterestedEvents} className={styles.retryButton}>
              Try Again
            </button>
          </div>
        )}
        
        {!loading && !error && interestedEvents.length > 0 && (
          <EnhancedEventList 
            events={interestedEvents}
            onEventClick={handleEventClick}
            onRemoveEvent={handleRemoveEvent}
            showRemoveButton={true}
          />
        )}
        
        {!loading && !error && interestedEvents.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>💫</div>
            <h3>No saved events yet</h3>
            <p>Start exploring events on the Dashboard and save the ones you like!</p>
          </div>
        )}
      </div>

      {isEventModalOpen && selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
        />
      )}
    </div>
  );
};

export default MyEventsContent;
