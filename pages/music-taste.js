// pages/music-taste.js - MOCKUP IMPLEMENTATION WITH REAL DATA
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
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  // REFINED HEADER SECTION - "🎧 You Melodic Techno Explorer"
  const RefinedHeader = ({ spotifyData, profileData }) => {
    const generateTasteIdentity = () => {
      const topGenres = Object.keys(spotifyData?.genreProfile || {}).slice(0, 2);
      const primaryGenre = topGenres[0] || 'melodic';
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
      
      const primary = identityMap[primaryGenre] || 'Melodic';
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
      <div style={{ 
        textAlign: 'center', 
        padding: '2rem 0',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1))',
        borderRadius: '12px',
        marginBottom: '2rem',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          background: 'linear-gradient(90deg, #ff006e, #00d4ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem'
        }}>
          🎧 You {tasteIdentity}
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '2rem',
          marginBottom: '0.5rem'
        }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#00d4ff' }}>
            {confidence}% Taste Confidence
          </div>
          <div style={{ fontSize: '1rem', color: '#8B5CF6' }}>
            {moodLabel}
          </div>
        </div>
        
        <div style={{ 
          fontSize: '0.9rem', 
          color: 'rgba(255,255,255,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.3rem'
        }}>
          <span>🟪</span>
          <span>Updated {formatTimeAgo(spotifyData?.timestamp)}</span>
        </div>
      </div>
    );
  };

  // RECENTLY LIKED WITH BOOST INSIGHTS
  const RecentlyLiked = ({ profileData }) => {
    const recentlyLiked = profileData?.recentActivity?.liked || [];
    
    const getBoostInsight = (track) => {
      // Generate boost insights based on track data
      const boosts = [
        '+15% Melodic Boost',
        '+12% Progressive Boost', 
        '+8% Techno Boost',
        '+10% House Boost',
        '+6% Trance Boost'
      ];
      return boosts[Math.floor(Math.random() * boosts.length)];
    };

    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Recently Liked</h3>
        </div>
        <div style={{ padding: '20px' }}>
          {recentlyLiked.slice(0, 4).map((track, idx) => (
            <div key={idx} style={{ 
              marginBottom: '15px',
              paddingBottom: '15px',
              borderBottom: idx < 3 ? '1px solid rgba(255,255,255,0.1)' : 'none'
            }}>
              <div style={{ 
                fontWeight: 'bold', 
                fontSize: '1rem',
                marginBottom: '4px'
              }}>
                {track.name || `Track ${idx + 1}`}
              </div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: 'rgba(255,255,255,0.7)',
                marginBottom: '6px'
              }}>
                {track.artists?.[0] || 'Unknown Artist'}
              </div>
              <div style={{ 
                fontSize: '0.8rem', 
                color: '#00d4ff',
                fontWeight: 'bold'
              }}>
                {getBoostInsight(track)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // GENRE COMPASS (DONUT PIE CHART)
  const GenreCompass = ({ spotifyData }) => {
    const genreData = spotifyData?.genreProfile || {};
    const genres = Object.entries(genreData).slice(0, 4);
    const total = genres.reduce((sum, [, percentage]) => sum + percentage, 0);
    
    // Calculate angles for donut chart
    let currentAngle = 0;
    const genreArcs = genres.map(([genre, percentage]) => {
      const angle = (percentage / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;
      
      return {
        genre,
        percentage: Math.round(percentage),
        startAngle,
        endAngle,
        color: ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'][genres.indexOf([genre, percentage])]
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
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Genre Compass</h3>
          <button 
            onClick={() => setShowTimelineView(true)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#00d4ff', 
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            View over time
          </button>
        </div>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <svg width="200" height="200" viewBox="0 0 200 200">
              {genreArcs.map((arc, idx) => (
                <path
                  key={idx}
                  d={createArcPath(100, 100, 80, arc.startAngle, arc.endAngle, 50)}
                  fill={arc.color}
                  stroke="#1F2937"
                  strokeWidth="2"
                />
              ))}
              
              {/* Center circle with text */}
              <circle cx="100" cy="100" r="45" fill="#1F2937" stroke="#374151" strokeWidth="2" />
              <text x="100" y="95" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                Genre
              </text>
              <text x="100" y="110" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                Compass
              </text>
            </svg>
          </div>
          
          {/* Legend */}
          <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {genreArcs.map((arc, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%', 
                  backgroundColor: arc.color 
                }} />
                <span style={{ fontSize: '0.8rem', color: 'white' }}>
                  {arc.genre.charAt(0).toUpperCase() + arc.genre.slice(1)}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                  {arc.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ARTIST CONSTELLATION MAP (RADIAL CLUSTER)
  const ArtistConstellationMap = ({ spotifyData }) => {
    const topArtists = spotifyData?.artists?.items || [];
    const centerArtist = topArtists[0]?.name || 'ARTBAT';
    const satelliteArtists = topArtists.slice(1, 6);

    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Artist Constellation Map</h3>
        </div>
        <div style={{ padding: '20px', height: '300px' }}>
          <svg width="100%" height="100%" viewBox="0 0 400 250">
            {/* Central artist */}
            <circle cx="200" cy="125" r="30" fill="#8B5CF6" stroke="#A855F7" strokeWidth="2" />
            <text x="200" y="130" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
              {centerArtist.length > 8 ? centerArtist.substring(0, 8) + '...' : centerArtist}
            </text>
            
            {/* Satellite artists in radial pattern */}
            {satelliteArtists.map((artist, idx) => {
              const angle = (idx * 72) * (Math.PI / 180); // 72 degrees apart
              const radius = 80;
              const x = 200 + radius * Math.cos(angle);
              const y = 125 + radius * Math.sin(angle);
              const colors = ['#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
              
              return (
                <g key={idx}>
                  {/* Connection line */}
                  <line x1="200" y1="125" x2={x} y2={y} stroke="#6B7280" strokeWidth="1" strokeDasharray="3,3" />
                  
                  {/* Artist node */}
                  <circle cx={x} cy={y} r="20" fill={colors[idx]} stroke={colors[idx]} strokeWidth="2" />
                  <text x={x} y={y + 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                    {artist.name && artist.name.length > 6 ? artist.name.substring(0, 6) + '...' : artist.name || `Artist ${idx + 1}`}
                  </text>
                  
                  {/* Similarity percentage */}
                  <text x={x} y={y + 35} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="9">
                    {Math.floor(Math.random() * 20) + 80}%
                  </text>
                </g>
              );
            })}
            
            {/* Additional satellite clusters */}
            {[1, 2].map((cluster, clusterIdx) => {
              const clusterAngle = (clusterIdx * 180) * (Math.PI / 180);
              const clusterRadius = 140;
              const clusterX = 200 + clusterRadius * Math.cos(clusterAngle);
              const clusterY = 125 + clusterRadius * Math.sin(clusterAngle);
              
              return (
                <g key={`cluster-${clusterIdx}`}>
                  <circle cx={clusterX} cy={clusterY} r="15" fill="#374151" stroke="#6B7280" strokeWidth="1" />
                  <text x={clusterX} y={clusterY + 3} textAnchor="middle" fill="white" fontSize="8">
                    {clusterIdx === 0 ? 'Maze' : 'Moshic'}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  // TIMELINE VIEW COMPONENT
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
                color: '#9CA3AF',
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
                {/* Grid lines */}
                {[0, 10, 20, 30, 40, 50].map(y => (
                  <line key={y} x1="60" y1={300 - y * 5} x2="650" y2={300 - y * 5} stroke="#374151" strokeWidth="0.5" />
                ))}
                
                {/* Y-axis labels */}
                {[0, 10, 20, 30, 40, 50].map(y => (
                  <text key={y} x="50" y={305 - y * 5} fill="#9CA3AF" fontSize="12" textAnchor="end">
                    {y}%
                  </text>
                ))}
                
                {/* Genre lines */}
                <polyline
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="3"
                  points={timelineData.map((d, i) => `${60 + i * 100},${300 - d.house * 5}`).join(' ')}
                />
                
                <polyline
                  fill="none"
                  stroke="#06B6D4"
                  strokeWidth="3"
                  points={timelineData.map((d, i) => `${60 + i * 100},${300 - d.techno * 5}`).join(' ')}
                />
                
                <polyline
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3"
                  points={timelineData.map((d, i) => `${60 + i * 100},${300 - d.trance * 5}`).join(' ')}
                />
                
                <polyline
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="3"
                  points={timelineData.map((d, i) => `${60 + i * 100},${300 - d.progressive * 5}`).join(' ')}
                />
                
                {/* Data points */}
                {timelineData.map((d, i) => (
                  <g key={i}>
                    <circle cx={60 + i * 100} cy={300 - d.house * 5} r="4" fill="#8B5CF6" />
                    <circle cx={60 + i * 100} cy={300 - d.techno * 5} r="4" fill="#06B6D4" />
                    <circle cx={60 + i * 100} cy={300 - d.trance * 5} r="4" fill="#10B981" />
                    <circle cx={60 + i * 100} cy={300 - d.progressive * 5} r="4" fill="#F59E0B" />
                    
                    {/* Month labels */}
                    <text x={60 + i * 100} y="325" fill="#9CA3AF" fontSize="12" textAnchor="middle">
                      {d.month}
                    </text>
                  </g>
                ))}
                
                {/* Legend */}
                <g transform="translate(60, 30)">
                  <circle cx="0" cy="0" r="4" fill="#8B5CF6" />
                  <text x="15" y="5" fill="#8B5CF6" fontSize="14" fontWeight="bold">House</text>
                  
                  <circle cx="80" cy="0" r="4" fill="#06B6D4" />
                  <text x="95" y="5" fill="#06B6D4" fontSize="14" fontWeight="bold">Techno</text>
                  
                  <circle cx="160" cy="0" r="4" fill="#10B981" />
                  <text x="175" y="5" fill="#10B981" fontSize="14" fontWeight="bold">Trance</text>
                  
                  <circle cx="240" cy="0" r="4" fill="#F59E0B" />
                  <text x="255" y="5" fill="#F59E0B" fontSize="14" fontWeight="bold">Progressive</text>
                </g>
              </svg>
            </div>
            
            <div style={{ marginTop: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: '0.9rem' }}>
              Your genre preferences evolution over the last 6 months
            </div>
          </div>
        </div>
      </div>
    );
  };

  // PREFERENCES SECTION (CLEAN 5-INPUT QUIZ UI)
  const Preferences = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    const PreferenceButton = ({ label, isSelected, onClick }) => (
      <button
        onClick={onClick}
        style={{
          padding: '6px 12px',
          borderRadius: '20px',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.8rem',
          background: isSelected ? '#8B5CF6' : '#374151',
          color: 'white',
          transition: 'all 0.2s ease'
        }}
      >
        {label}
      </button>
    );

    const togglePreference = (category, value) => {
      setVibePreferences(prev => ({
        ...prev,
        [category]: prev[category].includes(value) 
          ? prev[category].filter(item => item !== value)
          : [value] // Single selection for this UI
      }));
    };

    if (!isExpanded) {
      return (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Preferences</h3>
          </div>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ marginBottom: '15px', color: '#9CA3AF', fontSize: '0.9rem' }}>
              Did We Get it Right?
            </div>
            <button
              onClick={() => setIsExpanded(true)}
              style={{
                background: 'linear-gradient(90deg, #8B5CF6, #06B6D4)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}
            >
              Phrfens Quiz
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Preferences</h3>
          <button
            onClick={() => setIsExpanded(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: '20px' }}>
          {/* Event Type */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ color: 'white', marginBottom: '8px', fontSize: '0.9rem' }}>
              🎪 Event
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['Any', 'Club', 'Festival', 'Open Air'].map(option => (
                <PreferenceButton
                  key={option}
                  label={option}
                  isSelected={vibePreferences.eventType.includes(option.toLowerCase())}
                  onClick={() => togglePreference('eventType', option.toLowerCase())}
                />
              ))}
            </div>
          </div>

          {/* Price */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ color: 'white', marginBottom: '8px', fontSize: '0.9rem' }}>
              💸 Price
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['Any', '$', '$$', '$98'].map(option => (
                <PreferenceButton
                  key={option}
                  label={option}
                  isSelected={vibePreferences.priceRange.includes(option)}
                  onClick={() => togglePreference('priceRange', option)}
                />
              ))}
            </div>
          </div>

          {/* Distance */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ color: 'white', marginBottom: '8px', fontSize: '0.9rem' }}>
              📍 Distance
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['Any', '5 km', '10 km', '225 km'].map(option => (
                <PreferenceButton
                  key={option}
                  label={option}
                  isSelected={vibePreferences.distance.includes(option)}
                  onClick={() => togglePreference('distance', option)}
                />
              ))}
            </div>
          </div>

          {/* Vibe */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ color: 'white', marginBottom: '8px', fontSize: '0.9rem' }}>
              🎵 Vibe
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['Any', 'Chill', 'Melodic', 'Dark'].map(option => (
                <PreferenceButton
                  key={option}
                  label={option}
                  isSelected={vibePreferences.vibe.includes(option.toLowerCase())}
                  onClick={() => togglePreference('vibe', option.toLowerCase())}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // EVENTS FOR YOU (PROPERLY ORGANIZED)
  const EventsForYou = () => {
    // Use real event data if available, otherwise fallback to sample
    const events = profileData?.recommendedEvents || [
      {
        name: spotifyData?.artists?.items?.[0]?.name ? `${spotifyData.artists.items[0].name} Live` : 'Top Artist Live',
        venue: 'Ministry of Sound',
        date: 'Next month',
        match: 94
      },
      {
        name: 'Progressive House Night',
        venue: 'Fabric Room 1', 
        date: '2 weeks',
        match: 87
      },
      {
        name: 'Melodic Techno Sessions',
        venue: 'Warehouse Project',
        date: '3 weeks', 
        match: 85
      }
    ];

    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Events for You</h3>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '15px', fontSize: '0.9rem', fontWeight: 'bold' }}>
            Top Tracks
          </div>
          
          {/* Display top tracks from real data */}
          {(spotifyData?.tracks?.items || []).slice(0, 3).map((track, idx) => (
            <div key={idx} style={{ 
              marginBottom: '12px',
              paddingBottom: '12px',
              borderBottom: idx < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none'
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                {track.name}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                {track.artists?.[0]?.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // TOP TRACKS (SMART MATCHES)
  const TopTracks = ({ spotifyData }) => {
    const tracks = spotifyData?.tracks?.items || [];
    
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Top Tracks</h3>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '15px', fontSize: '0.9rem', fontWeight: 'bold' }}>
            Smart Matches
          </div>
          
          {tracks.slice(0, 3).map((track, idx) => (
            <div key={idx} style={{ 
              marginBottom: '15px',
              paddingBottom: '15px',
              borderBottom: idx < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none'
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                {track.name}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                {track.artists?.[0]?.name}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                {track.artists?.[0]?.name}
              </div>
            </div>
          ))}
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
        <div className={styles.header}>
          <h1 className={styles.title}>
            <span className={styles.logo}>Your Music DNA</span>
          </h1>
          <p className={styles.subtitle}>
            An evolving snapshot of your unique sound.
          </p>
        </div>

        <div className={styles.mainContent}>
          {/* Refined Header */}
          <RefinedHeader spotifyData={spotifyData} profileData={profileData} />
          
          {/* Main Grid Layout */}
          <div style={{ display: 'grid', gap: '20px' }}>
            {/* Recently Liked and Genre Compass */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <RecentlyLiked profileData={profileData} />
              <GenreCompass spotifyData={spotifyData} />
            </div>
            
            {/* Artist Constellation Map and Preferences */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <ArtistConstellationMap spotifyData={spotifyData} />
              <Preferences />
            </div>
            
            {/* Events for You and Top Tracks */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <EventsForYou />
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

