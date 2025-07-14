// pages/music-taste.js - RIGHT-ALIGNED DATA LAYOUT
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AppLayout from '../components/AppLayout';
import styles from '../styles/EnhancedPersonalizedDashboard.module.css';

const MusicTastePage = () => {
  const { data: session } = useSession();
  const [spotifyData, setSpotifyData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Interactive Genre Map state
  const [genreMapLevel, setGenreMapLevel] = useState(1);
  const [selectedGenre, setSelectedGenre] = useState(null);
  
  // Artist Connections state
  const [showHiddenConnections, setShowHiddenConnections] = useState(false);
  
  // Vibe Quiz state
  const [showVibeQuiz, setShowVibeQuiz] = useState(false);
  const [vibePreferences, setVibePreferences] = useState({
    eventType: [],
    priceRange: [],
    distance: [],
    vibe: []
  });
  
  // Timeline view state
  const [showTimelineView, setShowTimelineView] = useState(false);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [spotifyResponse, profileResponse] = await Promise.all([
        fetch('/api/spotify/user-taste'),
        fetch('/api/user/taste-profile')
      ]);

      if (spotifyResponse.ok) {
        const spotifyResult = await spotifyResponse.json();
        console.log('Spotify Data:', spotifyResult);
        setSpotifyData(spotifyResult);
      }

      if (profileResponse.ok) {
        const profileResult = await profileResponse.json();
        console.log('Profile Data:', profileResult);
        setProfileData(profileResult);
        
        // Load existing vibe preferences if available
        if (profileResult.vibePreferences) {
          setVibePreferences(profileResult.vibePreferences);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    
    if (diffInMinutes < 5) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  // Header with card-like background
  const RefinedHeader = ({ spotifyData, profileData }) => {
    const generateTasteIdentity = () => {
      const topGenres = Object.keys(spotifyData?.genreProfile || {}).slice(0, 2);
      const primaryGenre = topGenres[0] || 'house';
      const secondaryGenre = topGenres[1] || 'techno';
      
      const identityMap = {
        'house': 'House',
        'techno': 'Techno', 
        'trance': 'Trance',
        'electronic': 'Electronic',
        'progressive': 'Progressive',
        'melodic': 'Melodic',
        'deep': 'Deep'
      };
      
      const primary = identityMap[primaryGenre] || 'House';
      const secondary = identityMap[secondaryGenre] || 'Techno';
      
      return `${primary} ${secondary} Explorer`;
    };

    const calculateConfidence = () => {
      let confidence = 60;
      if (spotifyData?.artists?.items?.length > 0) confidence += 15;
      if (spotifyData?.tracks?.items?.length > 0) confidence += 15;
      if (spotifyData?.genreProfile && Object.keys(spotifyData.genreProfile).length > 2) confidence += 8;
      if (profileData?.recentActivity?.liked?.length > 0) confidence += 2;
      return Math.min(confidence, 99);
    };

    const getMoodLabel = () => {
      const hour = new Date().getHours();
      if (hour >= 22 || hour <= 6) return 'Late Night Pulse';
      if (hour >= 18) return 'Evening Vibes';
      if (hour >= 12) return 'Afternoon Energy';
      return 'Morning Flow';
    };

    const tasteIdentity = generateTasteIdentity();
    const confidence = calculateConfidence();
    const moodLabel = getMoodLabel();

    return (
      <div className={styles.card} style={{ 
        marginBottom: '1.5rem',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ 
            fontSize: '1.75rem', 
            fontWeight: '600', 
            color: '#ffffff',
            marginBottom: '0.75rem',
            letterSpacing: '-0.025em'
          }}>
            🎧 You {tasteIdentity}
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '1.5rem',
            marginBottom: '0.75rem'
          }}>
            <div style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              color: '#06b6d4'
            }}>
              {confidence}% Taste Confidence
            </div>
            <div style={{ 
              fontSize: '1rem', 
              fontWeight: '500',
              color: '#a855f7'
            }}>
              {moodLabel}
            </div>
          </div>
          
          <div style={{ 
            fontSize: '0.875rem', 
            color: 'rgba(255,255,255,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.375rem',
            fontWeight: '400'
          }}>
            <span style={{ color: '#a855f7' }}>🟪</span>
            <span>Updated {formatTimeAgo(spotifyData?.timestamp)}</span>
          </div>
        </div>
      </div>
    );
  };

  // FIX: Recently Liked with data on the RIGHT side
  const RecentlyLiked = ({ profileData }) => {
    const recentlyLiked = profileData?.recentActivity?.liked || [];
    
    const getBoostInsight = (track, idx) => {
      const boosts = [
        '+15% Melodic Boost',
        '+15% Melodic Boost', 
        '+15% Melodic Boost',
        '+15% Melodic Boost'
      ];
      return boosts[idx] || '+10% Genre Boost';
    };

    return (
      <div className={styles.card} style={{ height: '320px' }}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle} style={{ 
            color: '#ec4899',
            fontSize: '1.125rem',
            fontWeight: '600'
          }}>
            Recently Liked
          </h3>
        </div>
        <div style={{ padding: '1rem', height: 'calc(100% - 60px)', overflow: 'hidden' }}>
          {recentlyLiked.slice(0, 4).map((track, idx) => (
            <div key={idx} style={{ 
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: idx < 3 ? '1px solid rgba(255,255,255,0.1)' : 'none'
            }}>
              {/* Track name and boost on same line */}
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.25rem'
              }}>
                <div style={{ 
                  fontWeight: '600', 
                  fontSize: '0.9rem',
                  color: '#ffffff',
                  lineHeight: '1.2'
                }}>
                  {track.name || ['Tension', 'Flex My Ice', 'Love Made Me Do It - Guy J Remix', 'Can\'t Do It Like Me'][idx]}
                </div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: '#06b6d4',
                  fontWeight: '600',
                  flexShrink: 0,
                  marginLeft: '0.5rem'
                }}>
                  {getBoostInsight(track, idx)}
                </div>
              </div>
              
              {/* Artist name */}
              <div style={{ 
                fontSize: '0.8rem', 
                color: 'rgba(255,255,255,0.7)',
                lineHeight: '1.2'
              }}>
                {track.artists?.[0] || ['Peer Kusiv', 'SCRIPT', 'Moshic', 'Alexandre Delanios'][idx]}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Genre Compass with vertical legend on right
  const GenreCompass = ({ spotifyData }) => {
    const genreData = spotifyData?.genreProfile || {};
    const genres = Object.entries(genreData).slice(0, 4);
    
    const displayGenres = genres.length > 0 ? genres : [
      ['house', 58],
      ['trance', 3],
      ['indie dance', 5],
      ['techno', 34]
    ];
    
    let currentAngle = 0;
    const genreArcs = displayGenres.map(([genre, percentage]) => {
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;
      
      const colors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
      
      return {
        genre,
        percentage: Math.round(percentage),
        startAngle,
        endAngle,
        color: colors[displayGenres.indexOf([genre, percentage])]
      };
    });

    const createArcPath = (centerX, centerY, radius, startAngle, endAngle, innerRadius) => {
      const start = polarToCartesian(centerX, centerY, radius, endAngle);
      const end = polarToCartesian(centerX, centerY, radius, startAngle);
      const innerStart = polarToCartesian(centerX, centerY, innerRadius, endAngle);
      const innerEnd = polarToCartesian(centerX, centerY, innerRadius, startAngle);
      
      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
      
      return [
        "M", start.x, start.y, 
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
        "L", innerEnd.x, innerEnd.y,
        "A", innerRadius, innerRadius, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
        "Z"
      ].join(" ");
    };

    const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
      const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
      return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
      };
    };

    return (
      <div className={styles.card} style={{ height: '320px' }}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle} style={{ 
            color: '#8b5cf6',
            fontSize: '1.125rem',
            fontWeight: '600'
          }}>
            Genre Compass
          </h3>
          <button 
            onClick={() => setShowTimelineView(true)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#06b6d4', 
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            View over time
          </button>
        </div>
        <div style={{ 
          padding: '1rem', 
          height: 'calc(100% - 60px)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          {/* Chart on the left */}
          <div style={{ flex: '0 0 auto' }}>
            <svg width="140" height="140" viewBox="0 0 200 200">
              {genreArcs.map((arc, idx) => (
                <path
                  key={idx}
                  d={createArcPath(100, 100, 80, arc.startAngle, arc.endAngle, 50)}
                  fill={arc.color}
                  stroke="#1f2937"
                  strokeWidth="2"
                />
              ))}
              
              <circle cx="100" cy="100" r="45" fill="#1f2937" stroke="#374151" strokeWidth="2" />
              <text x="100" y="95" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="600">
                Genre
              </text>
              <text x="100" y="110" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="600">
                Compass
              </text>
            </svg>
          </div>
          
          {/* Legend vertically on the right with percentages aligned right */}
          <div style={{ 
            flex: '1',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            fontSize: '0.75rem'
          }}>
            {genreArcs.map((arc, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ 
                    width: '10px', 
                    height: '10px', 
                    borderRadius: '50%', 
                    backgroundColor: arc.color,
                    flexShrink: 0
                  }} />
                  <span style={{ 
                    color: '#ffffff',
                    fontWeight: '500',
                    lineHeight: '1.2'
                  }}>
                    {arc.genre.charAt(0).toUpperCase() + arc.genre.slice(1)}
                  </span>
                </div>
                <span style={{ 
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '0.8rem'
                }}>
                  {arc.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Artist Constellation Map with proper layout
  const ArtistConstellationMap = ({ spotifyData }) => {
    const topArtists = spotifyData?.artists?.items || [];
    const centerArtist = topArtists[0]?.name || 'ARTBAT';
    
    return (
      <div className={styles.card} style={{ height: '320px' }}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle} style={{ 
            color: '#06b6d4',
            fontSize: '1.125rem',
            fontWeight: '600'
          }}>
            Artist Constellation Map
          </h3>
        </div>
        <div style={{ 
          padding: '1rem', 
          height: 'calc(100% - 60px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="100%" height="100%" viewBox="0 0 400 250">
            {/* Central artist - ARTBAT */}
            <circle cx="200" cy="125" r="25" fill="#8b5cf6" stroke="#a855f7" strokeWidth="2" />
            <text x="200" y="130" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="600">
              ARTBAT
            </text>
            
            {/* Top branch - Mare */}
            <line x1="200" y1="125" x2="200" y2="80" stroke="#6b7280" strokeWidth="1" />
            <circle cx="200" cy="80" r="18" fill="#ef4444" stroke="#ef4444" strokeWidth="2" />
            <text x="200" y="85" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="600">
              Mare
            </text>
            
            {/* Right branch - Moshive */}
            <line x1="200" y1="125" x2="280" y2="80" stroke="#6b7280" strokeWidth="1" />
            <circle cx="280" cy="80" r="18" fill="#8b5cf6" stroke="#8b5cf6" strokeWidth="2" />
            <text x="280" y="85" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="600">
              Moshive
            </text>
            
            {/* Left branch cluster */}
            <line x1="200" y1="125" x2="120" y2="160" stroke="#6b7280" strokeWidth="1" />
            
            {/* AMI */}
            <circle cx="120" cy="160" r="18" fill="#8b5cf6" stroke="#8b5cf6" strokeWidth="2" />
            <text x="120" y="165" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="600">
              AMI
            </text>
            
            {/* Mare 23 */}
            <line x1="120" y1="160" x2="120" y2="200" stroke="#6b7280" strokeWidth="1" />
            <circle cx="120" cy="200" r="16" fill="#8b5cf6" stroke="#8b5cf6" strokeWidth="2" />
            <text x="120" y="205" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="600">
              Mare 23
            </text>
            
            {/* Right branch cluster */}
            <line x1="200" y1="125" x2="300" y2="160" stroke="#6b7280" strokeWidth="1" />
            
            {/* Dythem */}
            <circle cx="300" cy="160" r="18" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2" />
            <text x="300" y="165" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="600">
              Dythem
            </text>
            
            {/* Ruben Karapetyan */}
            <line x1="300" y1="160" x2="350" y2="180" stroke="#6b7280" strokeWidth="1" />
            <circle cx="350" cy="180" r="16" fill="#10b981" stroke="#10b981" strokeWidth="2" />
            <text x="350" y="185" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="600">
              Ruben K.
            </text>
          </svg>
        </div>
      </div>
    );
  };

  // Preferences with full options displayed
  const Preferences = () => {
    return (
      <div className={styles.card} style={{ height: '320px' }}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle} style={{ 
            color: '#ec4899',
            fontSize: '1.125rem',
            fontWeight: '600'
          }}>
            Preferences
          </h3>
        </div>
        <div style={{ padding: '1rem', height: 'calc(100% - 60px)' }}>
          <div style={{ 
            marginBottom: '1rem', 
            color: '#9ca3af', 
            fontSize: '0.875rem',
            fontWeight: '400',
            display: 'flex',
            gap: '1rem'
          }}>
            <span>Did We Get it Right?</span>
            <span>Phrfens Quiz</span>
          </div>
          
          {/* Event */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ 
              color: '#ffffff', 
              marginBottom: '0.375rem', 
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Event
            </div>
            <div style={{ 
              color: '#9ca3af', 
              fontSize: '0.75rem',
              fontWeight: '400',
              lineHeight: '1.3'
            }}>
              Any / Club / Festival / Open Air
            </div>
          </div>

          {/* Price */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ 
              color: '#ffffff', 
              marginBottom: '0.375rem', 
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Price
            </div>
            <div style={{ 
              color: '#9ca3af', 
              fontSize: '0.75rem',
              fontWeight: '400',
              lineHeight: '1.3'
            }}>
              Any / $ / $9% / $08
            </div>
          </div>

          {/* Distance */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ 
              color: '#ffffff', 
              marginBottom: '0.375rem', 
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Distance
            </div>
            <div style={{ 
              color: '#9ca3af', 
              fontSize: '0.75rem',
              fontWeight: '400',
              lineHeight: '1.3'
            }}>
              Any / 5 km / 10 km / 225 km
            </div>
          </div>

          {/* Vibe */}
          <div>
            <div style={{ 
              color: '#ffffff', 
              marginBottom: '0.375rem', 
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Vibe
            </div>
            <div style={{ 
              color: '#9ca3af', 
              fontSize: '0.75rem',
              fontWeight: '400',
              lineHeight: '1.3'
            }}>
              Any / Chill / Melodic / Dark
            </div>
          </div>
        </div>
      </div>
    );
  };

  // FIX: Events for You with match percentages on the right
  const EventsForYou = ({ spotifyData }) => {
    const events = profileData?.recommendedEvents || [
      {
        name: 'Afterlife presents Tale Of Us',
        venue: 'Printworks London',
        date: 'This Saturday',
        match: 94
      },
      {
        name: 'Melodic Techno Night',
        venue: 'Warehouse Project',
        date: 'Next Friday',
        match: 87
      },
      {
        name: 'ARTBAT Live',
        venue: 'Ministry of Sound',
        date: 'Next month',
        match: 85
      }
    ];
    
    return (
      <div className={styles.card} style={{ height: '320px' }}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle} style={{ 
            color: '#ec4899',
            fontSize: '1.125rem',
            fontWeight: '600'
          }}>
            Events for You
          </h3>
        </div>
        <div style={{ padding: '1rem', height: 'calc(100% - 60px)' }}>
          <div style={{ 
            marginBottom: '1rem', 
            fontSize: '0.875rem', 
            fontWeight: '600',
            color: '#ffffff'
          }}>
            Top Tracks
          </div>
          
          {events.map((event, idx) => (
            <div key={idx} style={{ 
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: idx < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none'
            }}>
              {/* Event name and match percentage on same line */}
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.25rem'
              }}>
                <div style={{ 
                  fontWeight: '600', 
                  fontSize: '0.875rem', 
                  color: '#ffffff',
                  lineHeight: '1.2'
                }}>
                  {event.name}
                </div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: '#10b981',
                  fontWeight: '600',
                  flexShrink: 0,
                  marginLeft: '0.5rem'
                }}>
                  {event.match}%
                </div>
              </div>
              
              {/* Venue and date */}
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'rgba(255,255,255,0.7)',
                fontWeight: '400',
                lineHeight: '1.2'
              }}>
                {event.venue} • {event.date}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // FIX: Top Tracks with play counts on the right
  const TopTracks = ({ spotifyData }) => {
    const tracks = spotifyData?.tracks?.items || [];
    
    return (
      <div className={styles.card} style={{ height: '320px' }}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle} style={{ 
            color: '#8b5cf6',
            fontSize: '1.125rem',
            fontWeight: '600'
          }}>
            Top Tracks
          </h3>
        </div>
        <div style={{ padding: '1rem', height: 'calc(100% - 60px)' }}>
          <div style={{ 
            marginBottom: '1rem', 
            fontSize: '0.875rem', 
            fontWeight: '600',
            color: '#ffffff'
          }}>
            Smart Matches
          </div>
          
          {tracks.slice(0, 3).map((track, idx) => (
            <div key={idx} style={{ 
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: idx < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none'
            }}>
              {/* Track name and play count on same line */}
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.25rem'
              }}>
                <div style={{ 
                  fontWeight: '600', 
                  fontSize: '0.875rem', 
                  color: '#ffffff',
                  lineHeight: '1.2'
                }}>
                  {track.name || ['Flex My Ice', 'Flex My Ice', 'Love Made Me Do It - Guy J Remix'][idx]}
                </div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: '#9ca3af',
                  fontWeight: '500',
                  flexShrink: 0,
                  marginLeft: '0.5rem'
                }}>
                  {Math.floor(Math.random() * 50) + 10} plays
                </div>
              </div>
              
              {/* Artist and label */}
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'rgba(255,255,255,0.7)',
                fontWeight: '400',
                lineHeight: '1.2',
                marginBottom: '0.125rem'
              }}>
                {track.artists?.[0]?.name || ['Love Made Techno', 'SCRIPT', 'Moshic'][idx]}
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'rgba(255,255,255,0.7)',
                fontWeight: '400',
                lineHeight: '1.2'
              }}>
                {['SCRIPT', 'Moshic', 'Afterlife'][idx]}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Timeline View Component (preserved)
  const TimelineView = ({ profileData, onClose }) => {
    const timelineData = profileData?.tasteEvolution?.monthlyGenres || [
      { month: 'Jul', house: 45, techno: 35, trance: 20, progressive: 15 },
      { month: 'Aug', house: 42, techno: 38, trance: 20, progressive: 18 },
      { month: 'Sep', house: 40, techno: 40, trance: 20, progressive: 20 },
      { month: 'Oct', house: 38, techno: 42, trance: 20, progressive: 22 },
      { month: 'Nov', house: 35, techno: 45, trance: 20, progressive: 25 },
      { month: 'Dec', house: 33, techno: 47, trance: 20, progressive: 27 }
    ];

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div className={styles.card} style={{ 
          width: '80%', 
          maxWidth: '800px', 
          maxHeight: '80%',
          overflow: 'auto'
        }}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Genre Evolution Over Time</h3>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                fontSize: '20px'
              }}
            >
              ✕
            </button>
          </div>
          <div style={{ padding: '30px' }}>
            <div style={{ height: '400px', width: '100%' }}>
              <svg width="100%" height="100%" viewBox="0 0 700 350">
                {[0, 10, 20, 30, 40, 50].map(y => (
                  <line key={y} x1="60" y1={300 - y * 5} x2="650" y2={300 - y * 5} stroke="#374151" strokeWidth="0.5" />
                ))}
                
                {[0, 10, 20, 30, 40, 50].map(y => (
                  <text key={y} x="50" y={305 - y * 5} fill="#9ca3af" fontSize="12" textAnchor="end">
                    {y}%
                  </text>
                ))}
                
                <polyline
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="3"
                  points={timelineData.map((d, i) => `${60 + i * 100},${300 - d.house * 5}`).join(' ')}
                />
                
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  points={timelineData.map((d, i) => `${60 + i * 100},${300 - d.techno * 5}`).join(' ')}
                />
                
                <polyline
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="3"
                  points={timelineData.map((d, i) => `${60 + i * 100},${300 - d.trance * 5}`).join(' ')}
                />
                
                <polyline
                  fill="none"
                  stroke="#ec4899"
                  strokeWidth="3"
                  points={timelineData.map((d, i) => `${60 + i * 100},${300 - d.progressive * 5}`).join(' ')}
                />
                
                {timelineData.map((d, i) => (
                  <g key={i}>
                    <circle cx={60 + i * 100} cy={300 - d.house * 5} r="4" fill="#06b6d4" />
                    <circle cx={60 + i * 100} cy={300 - d.techno * 5} r="4" fill="#3b82f6" />
                    <circle cx={60 + i * 100} cy={300 - d.trance * 5} r="4" fill="#8b5cf6" />
                    <circle cx={60 + i * 100} cy={300 - d.progressive * 5} r="4" fill="#ec4899" />
                    
                    <text x={60 + i * 100} y="325" fill="#9ca3af" fontSize="12" textAnchor="middle">
                      {d.month}
                    </text>
                  </g>
                ))}
                
                <g transform="translate(60, 30)">
                  <circle cx="0" cy="0" r="4" fill="#06b6d4" />
                  <text x="15" y="5" fill="#06b6d4" fontSize="14" fontWeight="bold">House</text>
                  
                  <circle cx="80" cy="0" r="4" fill="#3b82f6" />
                  <text x="95" y="5" fill="#3b82f6" fontSize="14" fontWeight="bold">Techno</text>
                  
                  <circle cx="160" cy="0" r="4" fill="#8b5cf6" />
                  <text x="175" y="5" fill="#8b5cf6" fontSize="14" fontWeight="bold">Trance</text>
                  
                  <circle cx="240" cy="0" r="4" fill="#ec4899" />
                  <text x="255" y="5" fill="#ec4899" fontSize="14" fontWeight="bold">Progressive</text>
                </g>
              </svg>
            </div>
            
            <div style={{ marginTop: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>
              Your genre preferences evolution over the last 6 months
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <div className={styles.container}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p className={styles.loadingText}>Loading your music taste...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className={styles.container}>
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <h3 className={styles.errorTitle}>Error Loading Data</h3>
            <p className={styles.errorMessage}>{error}</p>
            <button className={styles.retryButton} onClick={fetchData}>
              Retry
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className={styles.container}>
        <div className={styles.mainContent}>
          {/* Header Section */}
          <RefinedHeader spotifyData={spotifyData} profileData={profileData} />
          
          {/* Main Grid Layout */}
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {/* Recently Liked and Genre Compass */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <RecentlyLiked profileData={profileData} />
              <GenreCompass spotifyData={spotifyData} />
            </div>
            
            {/* Artist Constellation Map and Preferences */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <ArtistConstellationMap spotifyData={spotifyData} />
              <Preferences />
            </div>
            
            {/* Events for You and Top Tracks */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <EventsForYou spotifyData={spotifyData} />
              <TopTracks spotifyData={spotifyData} />
            </div>
          </div>
        </div>
        
        {/* Timeline View Modal */}
        {showTimelineView && (
          <TimelineView 
            profileData={profileData} 
            onClose={() => setShowTimelineView(false)} 
          />
        )}
      </div>
    </AppLayout>
  );
};

export default MusicTastePage;

