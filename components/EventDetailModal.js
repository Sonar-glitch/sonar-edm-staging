// components/EventDetailModal.js - Event detail modal with match explanation
import React from 'react';
import styles from '../styles/EventDetailModal.module.css';

const EventDetailModal = ({ event, isOpen, onClose, spotifyData }) => {
  if (!isOpen || !event) return null;

  // Generate match explanation based on real data
  const generateMatchExplanation = (event, userData) => {
    if (!userData || !userData.enhancedGenreProfile) {
      return "Match score based on general music preferences and event characteristics.";
    }

    const userGenres = userData.enhancedGenreProfile.primary || {};
    const userAudio = userData.soundCharacteristics || {};
    
    // Find matching genres
    const eventGenres = event.genres || [];
    const matchingGenres = [];
    
    eventGenres.forEach(genre => {
      const genreLower = genre.toLowerCase();
      Object.keys(userGenres).forEach(userGenre => {
        if (userGenre.toLowerCase().includes(genreLower) || genreLower.includes(userGenre.toLowerCase())) {
          matchingGenres.push(userGenre);
        }
      });
    });

    // Build explanation
    let explanation = "";
    
    if (matchingGenres.length > 0) {
      const topMatches = matchingGenres.slice(0, 3).join(", ");
      explanation += `This event features ${topMatches}, which align with your music preferences. `;
    }
    
    if (userAudio.danceability > 70) {
      explanation += "The high-energy, danceable nature of this event matches your preference for dancefloor-ready tracks. ";
    }
    
    if (userAudio.energy > 75) {
      explanation += "This event's energetic vibe complements your taste for high-energy electronic music. ";
    }
    
    if (event.personalizedScore > 80) {
      explanation += "This is a strong match based on your listening history and preferences.";
    } else if (event.personalizedScore > 60) {
      explanation += "This event shows good compatibility with your musical taste profile.";
    } else {
      explanation += "This event offers an opportunity to explore new sounds while staying within your comfort zone.";
    }

    return explanation || "Match score based on event characteristics and your music preferences.";
  };

  const matchExplanation = generateMatchExplanation(event, spotifyData);
  const matchScore = event.vibeMatchScore || event.personalizedScore || 50;

  // Format date
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        
        <div className={styles.eventHeader}>
          <h2 className={styles.eventTitle}>{event.name}</h2>
          <div className={styles.matchScore}>
            <span className={styles.scoreValue}>{Math.round(matchScore)}%</span>
            <span className={styles.scoreLabel}>Match</span>
          </div>
        </div>

        <div className={styles.eventDetails}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>📅 Date:</span>
            <span className={styles.detailValue}>{formattedDate}</span>
          </div>
          
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>⏰ Time:</span>
            <span className={styles.detailValue}>{formattedTime}</span>
          </div>
          
          {event.venue && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>📍 Venue:</span>
              <span className={styles.detailValue}>{event.venue}</span>
            </div>
          )}
          
          {event.priceRange && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>💰 Price:</span>
              <span className={styles.detailValue}>{event.priceRange}</span>
            </div>
          )}
        </div>

        <div className={styles.matchExplanation}>
          <h3>Why This Matches Your Taste</h3>
          <p>{matchExplanation}</p>
        </div>

        {event.genres && event.genres.length > 0 && (
          <div className={styles.genreTags}>
            <h4>Genres</h4>
            <div className={styles.tags}>
              {event.genres.map((genre, index) => (
                <span key={index} className={styles.genreTag}>{genre}</span>
              ))}
            </div>
          </div>
        )}

        <div className={styles.actionButtons}>
          <button className={styles.saveButton}>
            ❤️ Save to My Events
          </button>
          
          {event.ticketUrl && (
            <a
              href={event.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ticketButton}
            >
              🎫 Get Tickets
            </a>
          )}
        </div>

        <div className={styles.feedbackSection}>
          <h4>Was this recommendation accurate?</h4>
          <div className={styles.feedbackButtons}>
            <button className={styles.feedbackYes}>👍 Yes</button>
            <button className={styles.feedbackNo}>👎 No</button>
          </div>
        </div>
      </div>
    </div>
  );
};
          <p><strong>Match Score:</strong> {event.matchScore || 'N/A'}%</p>
        </div>
        
        <div style={{ 
          padding: '1rem',
          background: '#2a2a2a',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#888' }}>
            Step 4: Full event details with AI explanations and purchase links coming soon
          </p>
        </div>
        
        <button 
          onClick={onClose}
          style={{
            background: 'linear-gradient(90deg, #00c6ff, #ff00ff)',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            color: 'white',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
