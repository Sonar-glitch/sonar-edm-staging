import styles from '../styles/EventCard.module.css';

const EventCard = ({ event }) => {
  // Function to determine correlation strength class
  const getCorrelationClass = (correlation) => {
    if (correlation >= 80) return styles.highCorrelation;
    if (correlation >= 50) return styles.mediumCorrelation;
    return styles.lowCorrelation;
  };
  
  // Function to get correlation text
  const getCorrelationText = (correlation) => {
    if (correlation >= 80) return 'Strong Match';
    if (correlation >= 50) return 'Good Match';
    return 'Moderate Match';
  };

  return (
    <div className={styles.eventCard}>
      {/* Correlation indicator */}
      <div className={`${styles.correlationBadge} ${getCorrelationClass(event.correlation)}`}>
        {event.correlation}%
      </div>
      
      {event.image && (
        <div className={styles.eventImageContainer}>
          <img src={event.image} alt={event.name} className={styles.eventImage} />
          <div className={styles.eventOverlay}>
            <span className={`${styles.correlationLabel} ${getCorrelationClass(event.correlation)}`}>
              {getCorrelationText(event.correlation)}
            </span>
          </div>
        </div>
      )}
      
      <div className={styles.eventInfo}>
        <h3 className={styles.eventName}>{event.name}</h3>
        <div className={styles.eventDetails}>
          <p className={styles.eventVenue}>{event.venue}</p>
          <p className={styles.eventLocation}>{event.location}</p>
          <p className={styles.eventDateTime}>
            {event.date} {event.time && `• ${formatTime(event.time)}`}
          </p>
          <p className={styles.eventDistance}>
            <span className={styles.distanceIcon}>📍</span> {event.distance} miles away
          </p>
        </div>
        <a 
          href={event.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className={styles.eventButton}
        >
          Get Tickets
        </a>
      </div>
    </div>
  );
};

// Helper function to format time from 24h to 12h format
const formatTime = (time) => {
  if (!time) return '';
  
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  
  return `${hour12}:${minutes} ${ampm}`;
};

export default EventCard;
