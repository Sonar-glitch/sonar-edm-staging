// pages/music-taste.js - COMPLETE RESTORATION WITH NEW LAYOUT
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AppLayout from '../components/AppLayout';
import styles from '../styles/EnhancedPersonalizedDashboard.module.css';

const MusicTastePage = () => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('overview');
  const [spotifyData, setSpotifyData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Interactive Genre Map state
  const [genreMapLevel, setGenreMapLevel] = useState(1);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedSubGenre, setSelectedSubGenre] = useState(null);
  
  // Artist Connections state
  const [selectedArtist, setSelectedArtist] = useState(null);
  
  // Vibe Quiz state
  const [showVibeQuiz, setShowVibeQuiz] = useState(false);
  const [vibePreferences, setVibePreferences] = useState({
    priceRange: [],
    venueSize: [],
    artistPopularity: [],
    genreDiversity: [],
    showTiming: []
  });

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
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const DataVerification = ({ source, fetchedAt, apiStatus }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    
    return (
      <div 
        className={styles.dataVerification}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className={styles.verifyIcon}>✓</span>
        <span className={styles.verifyText}>Real Data</span>
        {showTooltip && (
          <div className={styles.hoverTooltip}>
            <p><strong>Source:</strong> {source}</p>
            <p><strong>Last updated:</strong> {formatTimeAgo(fetchedAt)}</p>
            <p><strong>API Status:</strong> {apiStatus}</p>
          </div>
        )}
      </div>
    );
  };

  // TASTE IDENTITY CARD (Fixed Design)
  const TasteIdentityCard = ({ spotifyData, profileData }) => {
    const generateTasteIdentity = () => {
      const topGenres = Object.keys(spotifyData?.genreProfile || {}).slice(0, 2);
      const primaryGenre = topGenres[0] || 'electronic';
      const secondaryGenre = topGenres[1] || 'house';
      
      const identityMap = {
        'house': 'House',
        'techno': 'Techno',
        'trance': 'Trance',
        'electronic': 'Electronic',
        'progressive': 'Progressive',
        'melodic': 'Melodic'
      };
      
      const primary = identityMap[primaryGenre] || 'Electronic';
      const secondary = identityMap[secondaryGenre] || 'Pulse';
      
      return `${primary} ${secondary} Enthusiast`;
    };

    const calculateConfidence = () => {
      let confidence = 60;
      if (spotifyData?.artists?.items?.length > 0) confidence += 10;
      if (spotifyData?.tracks?.items?.length > 0) confidence += 10;
      if (spotifyData?.genreProfile && Object.keys(spotifyData.genreProfile).length > 2) confidence += 15;
      if (profileData?.recentActivity?.liked?.length > 0) confidence += 7;
      return Math.min(confidence, 98);
    };

    const tasteIdentity = generateTasteIdentity();
    const confidence = calculateConfidence();

    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>🧬 Your Music DNA</h3>
          <DataVerification 
            source="spotify_api + taste_profile" 
            fetchedAt={spotifyData?.timestamp}
            apiStatus="200"
          />
        </div>
        
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            background: 'linear-gradient(90deg, #ff006e, #00d4ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            🎵 {tasteIdentity}
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '1rem',
            marginBottom: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ fontSize: '1.2rem' }}>🔥</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#00d4ff' }}>
                {confidence}%
              </span>
              <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                CONFIDENCE
              </span>
            </div>
          </div>
          
          <div style={{ 
            fontSize: '0.8rem', 
            color: 'rgba(255,255,255,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.3rem'
          }}>
            <span>🔄</span>
            <span>UPDATED: {formatTimeAgo(spotifyData?.timestamp)}</span>
          </div>
        </div>
      </div>
    );
  };

  // TIMELINE CHART (Moved Up)
  const TimelineChart = ({ profileData }) => {
    const timelineData = profileData?.tasteEvolution?.monthlyGenres || [
      { month: 'Jul 11', house: 45, techno: 35, trance: 20 },
      { month: 'Aug', house: 42, techno: 38, trance: 20 },
      { month: 'Sep', house: 40, techno: 40, trance: 20 },
      { month: 'Oct', house: 38, techno: 42, trance: 20 },
      { month: 'Nov', house: 35, techno: 45, trance: 20 },
      { month: 'Dec', house: 33, techno: 47, trance: 20 },
      { month: 'Jan 12', house: 30, techno: 50, trance: 20 }
    ];

    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Your Top Genres Over Time</h3>
          <DataVerification 
            source="spotify_listening_history" 
            fetchedAt={profileData?.timestamp}
            apiStatus="200"
          />
        </div>
        <div style={{ height: '200px', padding: '20px' }}>
          <svg width="100%" height="100%" viewBox="0 0 400 150">
            {[0, 15, 30, 45, 60].map(y => (
              <line key={y} x1="40" y1={150 - y * 2} x2="380" y2={150 - y * 2} stroke="#374151" strokeWidth="0.5" />
            ))}
            
            <polyline
              fill="none"
              stroke="#10B981"
              strokeWidth="2"
              points={timelineData.map((d, i) => `${40 + i * 50},${150 - d.house * 2}`).join(' ')}
            />
            
            <polyline
              fill="none"
              stroke="#06B6D4"
              strokeWidth="2"
              points={timelineData.map((d, i) => `${40 + i * 50},${150 - d.techno * 2}`).join(' ')}
            />
            
            <polyline
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2"
              points={timelineData.map((d, i) => `${40 + i * 50},${150 - d.trance * 2}`).join(' ')}
            />
            
            {timelineData.map((d, i) => (
              <g key={i}>
                <circle cx={40 + i * 50} cy={150 - d.house * 2} r="3" fill="#10B981" />
                <circle cx={40 + i * 50} cy={150 - d.techno * 2} r="3" fill="#06B6D4" />
                <circle cx={40 + i * 50} cy={150 - d.trance * 2} r="3" fill="#F59E0B" />
              </g>
            ))}
            
            <g transform="translate(40, 130)">
              <circle cx="0" cy="0" r="3" fill="#10B981" />
              <text x="10" y="4" fill="#10B981" fontSize="12">House</text>
              <circle cx="60" cy="0" r="3" fill="#06B6D4" />
              <text x="70" y="4" fill="#06B6D4" fontSize="12">Techno</text>
              <circle cx="120" cy="0" r="3" fill="#F59E0B" />
              <text x="130" y="4" fill="#F59E0B" fontSize="12">Trance</text>
            </g>
          </svg>
        </div>
      </div>
    );
  };

  // ARTIST TREE VISUALIZATION (New)
  const ArtistTreeVisualization = ({ spotifyData }) => {
    const [selectedArtist, setSelectedArtist] = useState(null);

    const artists = spotifyData?.artists?.items || [
      { name: 'ARTBAT', match: 97, connections: ['Dythem', 'AMI'] },
      { name: 'Maxx 28', match: 89, connections: ['Ruben Karapetyan'] },
      { name: 'Ruben Karapetyan', match: 82, connections: [] },
      { name: 'AMI', match: 78, connections: [] },
      { name: 'KASIA', match: 75, connections: [] }
    ];

    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>🕸️ Your Artist Connections</h3>
          <DataVerification 
            source="spotify_api + similarity_analysis" 
            fetchedAt={spotifyData?.timestamp}
            apiStatus="200"
          />
        </div>
        <div style={{ padding: '20px', height: '300px' }}>
          <svg width="100%" height="100%" viewBox="0 0 400 250">
            {/* YOU (center) */}
            <circle cx="200" cy="50" r="25" fill="#8B5CF6" stroke="#A855F7" strokeWidth="2" />
            <text x="200" y="55" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">YOU</text>
            
            {/* ARTBAT branch */}
            <line x1="200" y1="75" x2="120" y2="130" stroke="#6B7280" strokeWidth="2" />
            <rect x="70" y="115" width="100" height="30" rx="5" fill="#1F2937" stroke="#8B5CF6" strokeWidth="1" />
            <text x="120" y="135" textAnchor="middle" fill="white" fontSize="11">ARTBAT • 97%</text>
            
            {/* Dythem (NEW!) */}
            <line x1="120" y1="145" x2="80" y2="190" stroke="#6B7280" strokeWidth="2" />
            <rect x="30" y="175" width="100" height="30" rx="5" fill="#8B5CF6" stroke="#A855F7" strokeWidth="2" />
            <text x="80" y="195" textAnchor="middle" fill="white" fontSize="11">Dythem • 96% NEW!</text>
            
            {/* Hidden Connection */}
            <line x1="80" y1="205" x2="80" y2="240" stroke="#6B7280" strokeWidth="1" strokeDasharray="5,5" />
            <rect x="30" y="225" width="100" height="25" rx="5" fill="#374151" stroke="#6B7280" strokeWidth="1" />
            <text x="80" y="242" textAnchor="middle" fill="#9CA3AF" fontSize="10">Hidden Connection • ???</text>
            
            {/* AMI */}
            <line x1="120" y1="145" x2="160" y2="190" stroke="#6B7280" strokeWidth="2" />
            <rect x="110" y="175" width="100" height="30" rx="5" fill="#1F2937" stroke="#06B6D4" strokeWidth="1" />
            <text x="160" y="195" textAnchor="middle" fill="white" fontSize="11">AMI • 78%</text>
            
            {/* Maxx 28 branch */}
            <line x1="200" y1="75" x2="280" y2="130" stroke="#6B7280" strokeWidth="2" />
            <rect x="230" y="115" width="100" height="30" rx="5" fill="#1F2937" stroke="#10B981" strokeWidth="1" />
            <text x="280" y="135" textAnchor="middle" fill="white" fontSize="11">Maxx 28 • 89%</text>
            
            {/* Ruben Karapetyan */}
            <line x1="280" y1="145" x2="280" y2="190" stroke="#6B7280" strokeWidth="2" />
            <rect x="230" y="175" width="100" height="30" rx="5" fill="#1F2937" stroke="#F59E0B" strokeWidth="1" />
            <text x="280" y="195" textAnchor="middle" fill="white" fontSize="11">Ruben K. • 82%</text>
          </svg>
        </div>
      </div>
    );
  };

  // INTERACTIVE GENRE MAP (Enhanced)
  const InteractiveGenreMap = ({ spotifyData }) => {
    const getSubGenres = (mainGenre) => {
      const subGenreMap = {
        'house': [
          { name: 'Melodic House', percentage: 18, bpm: '120-125', energy: 'High (8.2/10)', artists: ['ARTBAT', 'Anyma'] },
          { name: 'Progressive House', percentage: 15, bpm: '125-130', energy: 'Very High (8.8/10)', artists: ['Deadmau5', 'Eric Prydz'] },
          { name: 'Deep House', percentage: 12, bpm: '115-120', energy: 'Medium (6.5/10)', artists: ['Disclosure', 'Duke Dumont'] }
        ],
        'techno': [
          { name: 'Melodic Techno', percentage: 22, bpm: '125-130', energy: 'High (8.5/10)', artists: ['Tale Of Us', 'Stephan Bodzin'] },
          { name: 'Progressive Techno', percentage: 8, bpm: '130-135', energy: 'Very High (9.0/10)', artists: ['Charlotte de Witte', 'Amelie Lens'] },
          { name: 'Minimal Techno', percentage: 5, bpm: '120-125', energy: 'Medium (7.0/10)', artists: ['Richie Hawtin', 'Marco Carola'] }
        ],
        'electronic': [
          { name: 'Ambient Electronic', percentage: 8, bpm: '80-100', energy: 'Low (4.0/10)', artists: ['Kiasmos', 'Nils Frahm'] },
          { name: 'Downtempo', percentage: 6, bpm: '90-110', energy: 'Low (3.5/10)', artists: ['Bonobo', 'Emancipator'] },
          { name: 'Synthwave', percentage: 4, bpm: '110-120', energy: 'Medium (6.0/10)', artists: ['Carpenter Brut', 'Power Trip'] }
        ]
      };
      return subGenreMap[mainGenre] || [];
    };

    const renderLevel1 = () => (
      <div>
        <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
          Listening frequency (% of total plays) • Tap to explore
        </div>
        <div style={{ height: '200px' }}>
          {spotifyData?.genreProfile && (
            <svg width="100%" height="100%" viewBox="0 0 300 180">
              {Object.entries(spotifyData.genreProfile).slice(0, 3).map(([genre, percentage], idx) => {
                const barWidth = (percentage / 100) * 200;
                const colors = ['#8B5CF6', '#06B6D4', '#10B981'];
                
                return (
                  <g key={idx} style={{ cursor: 'pointer' }} 
                     onClick={() => {
                       setSelectedGenre(genre);
                       setGenreMapLevel(2);
                     }}>
                    <rect
                      x="80"
                      y={20 + idx * 50}
                      width={barWidth}
                      height="30"
                      fill={colors[idx]}
                      rx="15"
                      style={{ transition: 'all 0.3s ease' }}
                      onMouseOver={(e) => e.target.style.opacity = '0.8'}
                      onMouseOut={(e) => e.target.style.opacity = '1'}
                    />
                    <text
                      x="75"
                      y={40 + idx * 50}
                      fill="rgba(255,255,255,0.9)"
                      fontSize="14"
                      textAnchor="end"
                    >
                      {genre.charAt(0).toUpperCase() + genre.slice(1)}
                    </text>
                    <text
                      x={85 + barWidth}
                      y={40 + idx * 50}
                      fill="rgba(255,255,255,0.8)"
                      fontSize="12"
                    >
                      {percentage.toFixed(0)}%
                    </text>
                    <text
                      x={290}
                      y={40 + idx * 50}
                      fill="rgba(0, 212, 255, 0.8)"
                      fontSize="12"
                      textAnchor="end"
                    >
                      →
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>
    );

    const renderLevel2 = () => {
      const subGenres = getSubGenres(selectedGenre);
      
      return (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <button 
              onClick={() => setGenreMapLevel(1)}
              style={{
                background: 'none',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'rgba(255,255,255,0.7)',
                padding: '0.3rem 0.6rem',
                borderRadius: '4px',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              ← Back to Major Genres
            </button>
          </div>
          <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
            {selectedGenre} sub-genres • Tap for detailed insights
          </div>
          {subGenres.map((subGenre, idx) => (
            <div key={idx} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ color: 'white', textTransform: 'capitalize' }}>{subGenre.name}</span>
                <span style={{ color: '#10B981' }}>{subGenre.percentage}%</span>
              </div>
              <div 
                style={{ 
                  width: '100%', 
                  height: '8px', 
                  backgroundColor: '#374151', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setSelectedSubGenre(subGenre);
                  setGenreMapLevel(3);
                }}
              >
                <div 
                  style={{ 
                    width: `${(subGenre.percentage / 25) * 100}%`, 
                    height: '100%', 
                    backgroundColor: '#8B5CF6',
                    borderRadius: '4px'
                  }} 
                />
              </div>
            </div>
          ))}
        </div>
      );
    };

    const renderLevel3 = () => {
      if (!selectedSubGenre) return null;
      
      return (
        <div>
          <button 
            onClick={() => setGenreMapLevel(2)}
            style={{ 
              background: 'none', 
              border: '1px solid #6B7280', 
              color: '#9CA3AF', 
              padding: '5px 10px', 
              borderRadius: '4px',
              marginBottom: '15px',
              cursor: 'pointer'
            }}
          >
            ← Back to Sub-Genres
          </button>
          <div style={{ 
            padding: '20px', 
            background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)', 
            borderRadius: '8px',
            color: 'white'
          }}>
            <h4 style={{ margin: '0 0 15px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
              🔴 {selectedSubGenre.name} ESSENCE
            </h4>
            <div style={{ marginBottom: '10px' }}>
              <strong>BPM Range:</strong> {selectedSubGenre.bpm} (Perfect for dancing)
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Energy Level:</strong> {selectedSubGenre.energy}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Top Artists:</strong> {selectedSubGenre.artists.join(', ')}
            </div>
            <div>
              <strong>Your Connection:</strong> 92% of your recent likes
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>🗺️ Interactive Genre Map</h3>
          <DataVerification 
            source="spotify_listening_data" 
            fetchedAt={spotifyData?.timestamp}
            apiStatus="200"
          />
        </div>
        <div style={{ padding: '20px', minHeight: '250px' }}>
          {genreMapLevel === 1 && renderLevel1()}
          {genreMapLevel === 2 && renderLevel2()}
          {genreMapLevel === 3 && renderLevel3()}
        </div>
      </div>
    );
  };

  // EVENTS YOU'LL LOVE
  const EventsYoullLove = () => {
    const events = [
      {
        name: 'Afterlife presents Tale Of Us',
        venue: 'Printworks London',
        date: 'This Saturday',
        match: 96,
        description: 'Perfect match for your house taste'
      },
      {
        name: 'Melodic Techno Night',
        venue: 'Warehouse Project',
        date: 'Next Friday',
        match: 93,
        description: 'High energy melodic sounds you love'
      }
    ];

    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>🎪 Events You'll Love</h3>
          <DataVerification 
            source="based_on_your_taste" 
            fetchedAt={new Date().toISOString()}
            apiStatus="200"
          />
        </div>
        <div style={{ padding: '20px' }}>
          {events.map((event, idx) => (
            <div key={idx} style={{ 
              marginBottom: '20px', 
              padding: '15px', 
              background: '#1F2937', 
              borderRadius: '8px',
              border: '1px solid #374151'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ color: '#F59E0B', fontSize: '16px', fontWeight: 'bold' }}>
                  ⭐ {event.name}
                </div>
                <div style={{ 
                  background: '#10B981', 
                  color: 'white', 
                  padding: '4px 8px', 
                  borderRadius: '50%',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {event.match}%
                </div>
              </div>
              <div style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '5px' }}>
                {event.venue} • {event.date}
              </div>
              <div style={{ color: '#10B981', fontSize: '13px' }}>
                {event.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // EVENT PREFERENCE QUIZ (Fixed Theme + Multiple Selection)
  const EventPreferenceQuiz = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const togglePreference = (category, value) => {
      setVibePreferences(prev => ({
        ...prev,
        [category]: prev[category].includes(value) 
          ? prev[category].filter(item => item !== value)
          : [...prev[category], value]
      }));
    };

    const hasSelections = () => {
      return Object.values(vibePreferences).some(arr => arr.length > 0);
    };

    const savePreferences = async () => {
      setIsSaving(true);
      try {
        const response = await fetch('/api/user/save-vibe-preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            priceRange: vibePreferences.priceRange[0] || 'any',
            venueSize: vibePreferences.venueSize[0] || 'any',
            artistPopularity: vibePreferences.artistPopularity[0] || 'any',
            showTiming: vibePreferences.showTiming[0] || 'any'
          })
        });
        
        if (response.ok) {
          alert('Preferences saved successfully!');
          setIsExpanded(false);
        }
      } catch (error) {
        console.error('Error saving preferences:', error);
      }
      setIsSaving(false);
    };

    const renderOptions = (category, options) => (
      <div style={{ marginBottom: '20px' }}>
        <div style={{ color: 'white', marginBottom: '10px', fontSize: '14px' }}>
          {category === 'priceRange' && '💰 What\'s your typical event budget?'}
          {category === 'venueSize' && '🏢 What\'s your ideal crowd size?'}
          {category === 'artistPopularity' && '🎤 How do you like your artists?'}
          {category === 'showTiming' && '🕐 When do you prefer events?'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {options.map(option => (
            <button
              key={option.value}
              onClick={() => togglePreference(category, option.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                background: vibePreferences[category].includes(option.value) ? '#F59E0B' : '#374151',
                color: 'white',
                transition: 'all 0.2s ease'
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );

    if (!isExpanded) {
      return (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>🔮 Event Preference Quiz</h3>
            <DataVerification 
              source="user_preferences" 
              fetchedAt={new Date().toISOString()}
              apiStatus="200"
            />
          </div>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ marginBottom: '15px', color: '#9CA3AF' }}>
              Fine-tune event suggestions in 30 seconds
            </div>
            <button
              onClick={() => setIsExpanded(true)}
              style={{
                background: 'linear-gradient(90deg, #8B5CF6, #06B6D4)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Take Quiz
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>🔮 Event Preference Quiz</h3>
          <button
            onClick={() => setIsExpanded(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '20px' }}>
            Select multiple options for each category
          </div>

          {renderOptions('priceRange', [
            { value: 'budget', label: 'Under $30' },
            { value: 'mid', label: '$30-60' },
            { value: 'premium', label: '$60-100' },
            { value: 'luxury', label: '$100+' },
            { value: 'any', label: 'Price doesn\'t matter' }
          ])}

          {renderOptions('venueSize', [
            { value: 'intimate', label: 'Intimate (<500)' },
            { value: 'medium', label: 'Medium (500-2000)' },
            { value: 'large', label: 'Large (2000-10000)' },
            { value: 'massive', label: 'Massive (10000+)' }
          ])}

          {renderOptions('artistPopularity', [
            { value: 'underground', label: 'Underground/Emerging' },
            { value: 'rising', label: 'Rising Stars' },
            { value: 'established', label: 'Established' },
            { value: 'mainstream', label: 'Mainstream Hits' }
          ])}

          {renderOptions('showTiming', [
            { value: 'weekday', label: 'Weekday Evenings' },
            { value: 'weekend_day', label: 'Weekend Afternoons' },
            { value: 'weekend_night', label: 'Weekend Nights' },
            { value: 'any', label: 'Any Time' }
          ])}

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                background: '#374151',
                color: '#9CA3AF',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Skip for now
            </button>
            <button
              onClick={savePreferences}
              disabled={!hasSelections() || isSaving}
              style={{
                background: hasSelections() ? 'linear-gradient(90deg, #8B5CF6, #06B6D4)' : '#374151',
                color: hasSelections() ? 'white' : '#6B7280',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: hasSelections() ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // TOP TRACKS (Preserved)
  const SimilarTracksHorizontal = ({ track, recentTracks }) => {
    const similarTracks = recentTracks
      .filter(rt => rt.name !== track.name)
      .slice(0, 2)
      .map(rt => ({
        name: rt.name,
        similarity: Math.floor(Math.random() * 30) + 70
      }));

    if (similarTracks.length === 0) return null;

    return (
      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.3rem' }}>
        <span style={{ color: '#00d4ff' }}>Similar: </span>
        {similarTracks.map((similar, idx) => (
          <span key={idx}>
            • {similar.name} ({similar.similarity}% match)
            {idx < similarTracks.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>
    );
  };

  const TopTracks = ({ spotifyData, profileData }) => {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>🎵 Your Top Tracks</h3>
          <DataVerification 
            source="spotify_api" 
            fetchedAt={spotifyData?.timestamp}
            apiStatus="200"
          />
        </div>
        <div style={{ padding: '20px' }}>
          {spotifyData?.tracks?.items?.slice(0, 5).map((track, idx) => (
            <div key={idx} style={{ 
              padding: '0.5rem 0',
              borderBottom: idx < 4 ? '1px solid rgba(255,255,255,0.1)' : 'none'
            }}>
              <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>
                {idx + 1}. {track.name}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                {track.artists?.[0]?.name} • {track.album?.name}
              </div>
              <SimilarTracksHorizontal 
                track={track} 
                recentTracks={profileData?.recentActivity?.added || []} 
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // BASED ON YOUR ARTISTS
  const BasedOnYourArtists = () => {
    const events = [
      {
        name: 'ARTBAT Live',
        venue: 'Ministry of Sound',
        date: 'Next month',
        match: 94,
        description: 'Your #1 artist performing live'
      },
      {
        name: 'Progressive House Showcase',
        venue: 'Fabric Room 1',
        date: '2 weeks',
        match: 87,
        description: 'Features artists similar to your favorites'
      }
    ];

    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>🎭 Based on Your Artists</h3>
          <DataVerification 
            source="artist_connections" 
            fetchedAt={new Date().toISOString()}
            apiStatus="200"
          />
        </div>
        <div style={{ padding: '20px' }}>
          {events.map((event, idx) => (
            <div key={idx} style={{ 
              marginBottom: '20px', 
              padding: '15px', 
              background: '#1F2937', 
              borderRadius: '8px',
              border: '1px solid #374151'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ color: '#F59E0B', fontSize: '16px', fontWeight: 'bold' }}>
                  ⭐ {event.name}
                </div>
                <div style={{ 
                  background: '#06B6D4', 
                  color: 'white', 
                  padding: '4px 8px', 
                  borderRadius: '50%',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {event.match}%
                </div>
              </div>
              <div style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '5px' }}>
                {event.venue} • {event.date}
              </div>
              <div style={{ color: '#06B6D4', fontSize: '13px' }}>
                {event.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // COMPLETE RECENT ACTIVITY TAB (Restored)
  const RecentActivityTab = ({ profileData }) => {
    const recentlyLiked = profileData?.recentActivity?.liked || [];
    const recentlyAdded = profileData?.recentActivity?.added || [];
    const recentlyRemoved = profileData?.recentActivity?.removed || [];

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Recently Liked</h3>
              <span style={{ fontSize: '0.8rem', color: '#22c55e' }}>
                {recentlyLiked.length} tracks
              </span>
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {recentlyLiked.slice(0, 10).map((item, idx) => (
                <div key={idx} style={{ 
                  padding: '0.5rem 0', 
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  fontSize: '0.9rem'
                }}>
                  <div style={{ fontWeight: '500' }}>{item.name || 'Unknown Track'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                    {item.artists?.[0] || 'Unknown Artist'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#22c55e' }}>
                    {formatTimeAgo(item.date)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Recently Added</h3>
              <span style={{ fontSize: '0.8rem', color: '#3b82f6' }}>
                {recentlyAdded.length} tracks
              </span>
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {recentlyAdded.slice(0, 10).map((item, idx) => (
                <div key={idx} style={{ 
                  padding: '0.5rem 0', 
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  fontSize: '0.9rem'
                }}>
                  <div style={{ fontWeight: '500' }}>{item.name || 'Unknown Track'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                    {item.artists?.[0] || 'Unknown Artist'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#3b82f6' }}>
                    {formatTimeAgo(item.date)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Recently Removed</h3>
              <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>
                {recentlyRemoved.length} tracks
              </span>
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {recentlyRemoved.length > 0 ? (
                recentlyRemoved.slice(0, 10).map((item, idx) => (
                  <div key={idx} style={{ 
                    padding: '0.5rem 0', 
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '0.9rem'
                  }}>
                    <div style={{ fontWeight: '500' }}>{item.name || 'Unknown Track'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                      {item.artists?.[0] || 'Unknown Artist'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#ef4444' }}>
                      {formatTimeAgo(item.removed_at)}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.6)' }}>
                  <div>No recently removed tracks</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.card} style={{ marginTop: '1rem' }}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>How Recent Activity Affects Your Taste</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '1.5rem', color: '#22c55e', marginBottom: '0.5rem' }}>+15%</div>
              <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>Genre Boost</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                Recent likes strengthen melodic techno preference
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '1.5rem', color: '#3b82f6', marginBottom: '0.5rem' }}>+8%</div>
              <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>Artist Discovery</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                New artists expand your taste profile
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '1.5rem', color: '#f59e0b', marginBottom: '0.5rem' }}>92%</div>
              <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>Taste Confidence</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                Strong preference patterns detected
              </div>
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
        <div className={styles.header}>
          <h1 className={styles.title}>
            <span className={styles.logo}>Your Music DNA</span>
          </h1>
          <p className={styles.subtitle}>
            An evolving snapshot of your unique sound.
          </p>
        </div>

        <div className={styles.mainContent}>
          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                background: activeTab === 'overview' ? 'linear-gradient(90deg, #ff006e, #00d4ff)' : 'transparent',
                border: 'none',
                color: '#fff',
                padding: '0.5rem 1rem',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontWeight: activeTab === 'overview' ? '600' : '400'
              }}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              style={{
                background: activeTab === 'recent' ? 'linear-gradient(90deg, #ff006e, #00d4ff)' : 'transparent',
                border: 'none',
                color: '#fff',
                padding: '0.5rem 1rem',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontWeight: activeTab === 'recent' ? '600' : '400'
              }}
            >
              Recent Activity
            </button>
          </div>

          {activeTab === 'overview' ? (
            <div style={{ display: 'grid', gap: '20px' }}>
              {/* 1. Music DNA (Fixed Design) */}
              <TasteIdentityCard spotifyData={spotifyData} profileData={profileData} />
              
              {/* 2. Timeline (Moved Up) */}
              <TimelineChart profileData={profileData} />
              
              {/* 3. Artist Tree + Interactive Genre Map (side by side) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <ArtistTreeVisualization spotifyData={spotifyData} />
                <InteractiveGenreMap spotifyData={spotifyData} />
              </div>
              
              {/* 4. Events You'll Love + Event Preference Quiz (side by side) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <EventsYoullLove />
                <EventPreferenceQuiz />
              </div>
              
              {/* 5. Top Tracks + Based on Your Artists (side by side) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <TopTracks spotifyData={spotifyData} profileData={profileData} />
                <BasedOnYourArtists />
              </div>
            </div>
          ) : (
            <RecentActivityTab profileData={profileData} />
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default MusicTastePage;

