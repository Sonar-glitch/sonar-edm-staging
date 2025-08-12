// components/CompactEventInsights.js
// TIKO-compliant compact event display with meaningful insights instead of useless charts

import { useState } from 'react';
import styles from '../styles/CompactEventInsights.module.css';

export default function CompactEventInsights({ event, userProfile }) {
  const [expandedInsights, setExpandedInsights] = useState(false);

  // Generate meaningful insights about why this event matches
  const generateMatchInsights = () => {
    const insights = [];
    const score = event.personalizedScore || 50;
    
    // Artist-based insights
    if (event.tasteMatch?.analysis?.insights) {
      const artistMatches = event.tasteMatch.analysis.insights.filter(i => 
        i.type === 'direct_artist_match' || i.type === 'similar_artist_match'
      );
      
      if (artistMatches.length > 0) {
        const directMatches = artistMatches.filter(i => i.type === 'direct_artist_match');
        const similarMatches = artistMatches.filter(i => i.type === 'similar_artist_match');
        
        if (directMatches.length > 0) {
          insights.push({
            type: 'artist_direct',
            text: `You follow ${directMatches[0].artists.length} of these artists`,
            strength: 'high',
            details: directMatches[0].artists.map(a => a.artist).join(', ')
          });
        }
        
        if (similarMatches.length > 0) {
          insights.push({
            type: 'artist_similar',
            text: `Similar to artists you listen to`,
            strength: 'medium',
            details: similarMatches[0].correlations.slice(0, 2).map(c => 
              `${c.eventArtist} (${c.similarity}% like ${c.userArtist})`
            ).join(', ')
          });
        }
      }
    }
    
    // Genre-based insights
    if (userProfile?.topGenres && event.genres) {
      const genreMatches = event.genres.filter(eventGenre => 
        userProfile.topGenres.some(userGenre => 
          userGenre.genre.toLowerCase().includes(eventGenre.toLowerCase()) ||
          eventGenre.toLowerCase().includes(userGenre.genre.toLowerCase())
        )
      );
      
      if (genreMatches.length > 0) {
        const genrePercentage = userProfile.topGenres
          .filter(g => genreMatches.some(m => 
            g.genre.toLowerCase().includes(m.toLowerCase()) ||
            m.toLowerCase().includes(g.genre.toLowerCase())
          ))
          .reduce((sum, g) => sum + (g.percentage || 0), 0);
          
        insights.push({
          type: 'genre_match',
          text: `${Math.round(genrePercentage)}% of your music taste`,
          strength: genrePercentage > 15 ? 'high' : genrePercentage > 8 ? 'medium' : 'low',
          details: `Matches: ${genreMatches.join(', ')}`
        });
      }
    }
    
    // Sound characteristics insights
    if (event.tasteMatch?.analysis?.insights) {
      const audioMatches = event.tasteMatch.analysis.insights.filter(i => 
        i.type === 'audio_dna_match'
      );
      
      if (audioMatches.length > 0 && audioMatches[0].features) {
        const strongFeatures = audioMatches[0].features.filter(f => f.similarity > 0.7);
        if (strongFeatures.length > 0) {
          insights.push({
            type: 'sound_dna',
            text: `Matches your sound DNA`,
            strength: 'medium',
            details: strongFeatures.map(f => 
              `${f.feature}: ${Math.round(f.similarity * 100)}% match`
            ).join(', ')
          });
        }
      }
    }
    
    // Recent listening pattern insights
    if (score > 70) {
      insights.push({
        type: 'trending',
        text: 'Trending in your recent listening',
        strength: 'high',
        details: 'Based on your current music discovery patterns'
      });
    }
    
    // Location-based insights
    if (event.location && typeof event.location === 'object' && event.location.city) {
      insights.push({
        type: 'location',
        text: `Local ${event.location.city} scene`,
        strength: 'low',
        details: `Part of the ${event.location.city} electronic music community`
      });
    }
    
    return insights.slice(0, 3); // Show max 3 insights
  };

  const insights = generateMatchInsights();
  const score = event.personalizedScore || 50;
  
  // Determine urgency and grouping
  const getEventGroup = () => {
    const eventDate = event.date ? new Date(event.date) : null;
    if (!eventDate) return { group: 'upcoming', label: 'Upcoming', urgency: 'low' };
    
    const now = new Date();
    const daysUntil = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) return { group: 'past', label: 'Past', urgency: 'none' };
    if (daysUntil === 0) return { group: 'tonight', label: 'Tonight', urgency: 'critical' };
    if (daysUntil === 1) return { group: 'tomorrow', label: 'Tomorrow', urgency: 'high' };
    if (daysUntil <= 3) return { group: 'this_weekend', label: 'This Weekend', urgency: 'high' };
    if (daysUntil <= 7) return { group: 'this_week', label: 'This Week', urgency: 'medium' };
    if (daysUntil <= 14) return { group: 'next_weekend', label: 'Next Weekend', urgency: 'medium' };
    if (daysUntil <= 30) return { group: 'this_month', label: 'This Month', urgency: 'low' };
    
    return { group: 'future', label: 'Coming Soon', urgency: 'low' };
  };

  const eventGroup = getEventGroup();
  const isHighMatch = score >= 75;
  const isInternational = event.artists?.some(artist => 
    typeof artist === 'object' ? artist.international : false
  ) || score >= 85;

  return (
    <div className={`${styles.eventCard} ${styles[eventGroup.urgency]} ${isHighMatch ? styles.highMatch : ''} ${isInternational ? styles.international : ''}`}>
      {/* Compact header with essential info */}
      <div className={styles.eventHeader}>
        <div className={styles.eventMeta}>
          <span className={`${styles.groupBadge} ${styles[eventGroup.group]}`}>
            {eventGroup.label}
          </span>
          {isInternational && (
            <span className={styles.internationalBadge}>International</span>
          )}
          {isHighMatch && (
            <span className={styles.mustSeeBadge}>Must See</span>
          )}
        </div>
        
        <div className={styles.matchScore}>
          <span className={`${styles.scoreValue} ${
            score >= 80 ? styles.excellent :
            score >= 65 ? styles.great :
            score >= 50 ? styles.good : styles.fair
          }`}>
            {Math.round(score)}%
          </span>
        </div>
      </div>

      {/* Event title and basic info */}
      <div className={styles.eventInfo}>
        <h3 className={styles.eventTitle}>{event.name || 'Untitled Event'}</h3>
        
        <div className={styles.eventDetails}>
          <div className={styles.venueLocation}>
            <span className={styles.venue}>
              {typeof event.venue === 'object' ? event.venue?.name : event.venue || 'TBD'}
            </span>
            {event.date && (
              <span className={styles.date}>
                {new Date(event.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  weekday: 'short'
                })}
              </span>
            )}
          </div>
          
          {event.artists && event.artists.length > 0 && (
            <div className={styles.artists}>
              {event.artists.slice(0, 2).map((artist, idx) => (
                <span key={idx} className={styles.artist}>
                  {typeof artist === 'object' ? artist.name : artist}
                </span>
              )).reduce((prev, curr, idx) => [prev, <span key={`sep-${idx}`} className={styles.separator}>•</span>, curr])}
              {event.artists.length > 2 && (
                <span className={styles.moreArtists}>+{event.artists.length - 2} more</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Why this matches you - meaningful insights */}
      <div className={styles.matchInsights}>
        <h4 className={styles.insightsTitle}>Why this matches you:</h4>
        <div className={styles.insightsList}>
          {insights.map((insight, idx) => (
            <div key={idx} className={`${styles.insight} ${styles[insight.strength]}`}>
              <span className={styles.insightIcon}>
                {insight.type === 'artist_direct' && '🎤'}
                {insight.type === 'artist_similar' && '🔗'}
                {insight.type === 'genre_match' && '🎵'}
                {insight.type === 'sound_dna' && '🧬'}
                {insight.type === 'trending' && '📈'}
                {insight.type === 'location' && '📍'}
              </span>
              <span className={styles.insightText}>{insight.text}</span>
            </div>
          ))}
        </div>
        
        {insights.length > 0 && (
          <button 
            className={styles.expandButton}
            onClick={() => setExpandedInsights(!expandedInsights)}
          >
            {expandedInsights ? 'Less details' : 'More details'}
          </button>
        )}
        
        {expandedInsights && (
          <div className={styles.expandedInsights}>
            {insights.map((insight, idx) => (
              <div key={idx} className={styles.expandedInsight}>
                <strong>{insight.text}:</strong> {insight.details}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className={styles.eventActions}>
        {event.ticketUrl && (
          <a
            href={event.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ticketButton}
          >
            Get Tickets
          </a>
        )}
        <div className={styles.priceInfo}>
          {event.priceRange || 'Price TBA'}
        </div>
      </div>
    </div>
  );
}
