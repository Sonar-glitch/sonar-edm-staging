import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Head from 'next/head';
import Link from 'next/link';
import Navigation from '../../components/Navigation';
import VibeQuizCard from '../../components/VibeQuizCard';
import styles from '../../styles/MusicTaste.module.css';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export default function MusicTaste() {
  const { data: session, status } = useSession();
  const [musicTaste, setMusicTaste] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('genres');
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  useEffect(() => {
    const fetchMusicTaste = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/spotify/user-taste');
        setMusicTaste(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching music taste:', err);
        setError('Error fetching music taste data');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchMusicTaste();
    }
  }, [session]);

  // Handle scroll events for section highlighting and scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      // Show/hide scroll to top button
      if (window.scrollY > 300) {
        setShowScrollToTop(true);
      } else {
        setShowScrollToTop(false);
      }
      
      // Determine active section based on scroll position
      const sections = document.querySelectorAll('section[id]');
      let currentSection = null;
      
      sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;
        
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
          currentSection = section.id;
        }
      });
      
      setActiveSection(currentSection);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle taste update from Vibe Quiz
  const handleTasteUpdate = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/spotify/user-taste');
      setMusicTaste(response.data);
    } catch (err) {
      console.error('Error updating taste data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Scroll to section
  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      window.scrollTo({
        top: section.offsetTop - 80,
        behavior: 'smooth'
      });
    }
  };

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!musicTaste || !musicTaste.topGenres) return null;

    return {
      labels: musicTaste.topGenres.map(genre => genre.name),
      datasets: [
        {
          label: 'Genre Affinity',
          data: musicTaste.topGenres.map(genre => genre.value),
          backgroundColor: 'rgba(138, 43, 226, 0.2)',
          borderColor: 'rgba(138, 43, 226, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(255, 107, 107, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(255, 107, 107, 1)',
          pointRadius: 5,
          pointHoverRadius: 7
        }
      ]
    };
  };

  const chartOptions = {
    scales: {
      r: {
        angleLines: {
          color: 'rgba(255, 255, 255, 0.2)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)'
        },
        pointLabels: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 12
          }
        },
        ticks: {
          backdropColor: 'transparent',
          color: 'rgba(255, 255, 255, 0.7)'
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(30, 30, 40, 0.9)',
        titleColor: 'rgba(255, 255, 255, 1)',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
        borderColor: 'rgba(138, 43, 226, 0.5)',
        borderWidth: 1
      }
    },
    maintainAspectRatio: false
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <Navigation activePage="music-taste" />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Analyzing your sonic DNA...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.container}>
        <Navigation activePage="music-taste" />
        <div className={styles.errorContainer}>
          <h2>Error loading music taste</h2>
          <p>{error}</p>
          <button 
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // If no taste data yet
  if (!musicTaste) {
    return (
      <div className={styles.container}>
        <Navigation activePage="music-taste" />
        <div className={styles.loadingContainer}>
          <p>Preparing your music taste profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Your Music Taste | Sonar EDM</title>
        <meta name="description" content="Explore your EDM music preferences" />
      </Head>

      <Navigation activePage="music-taste" />
      
      <div className={styles.header}>
        <h1 className={styles.title}>Your Music Taste Profile</h1>
        <div className={styles.tasteLabels}>
          {musicTaste.topGenres && musicTaste.topGenres.map((genre, index) => (
            <span key={index} className={styles.tasteLabel}>{genre.name}</span>
          ))}
        </div>
      </div>
      
      {/* Quick Navigation for Mobile */}
      <div className={styles.quickNav}>
        <button 
          className={`${styles.quickNavButton} ${activeSection === 'genres' ? styles.active : ''}`}
          onClick={() => scrollToSection('genres')}
        >
          Genres
        </button>
        <button 
          className={`${styles.quickNavButton} ${activeSection === 'artists' ? styles.active : ''}`}
          onClick={() => scrollToSection('artists')}
        >
          Artists
        </button>
        <button 
          className={`${styles.quickNavButton} ${activeSection === 'tracks' ? styles.active : ''}`}
          onClick={() => scrollToSection('tracks')}
        >
          Tracks
        </button>
        <button 
          className={`${styles.quickNavButton} ${activeSection === 'seasonal' ? styles.active : ''}`}
          onClick={() => scrollToSection('seasonal')}
        >
          Seasonal
        </button>
        <button 
          className={`${styles.quickNavButton} ${activeSection === 'events' ? styles.active : ''}`}
          onClick={() => scrollToSection('events')}
        >
          Events
        </button>
      </div>
      
      {/* Spider Chart Section */}
      <section id="genres" className={styles.section}>
        <h2 className={styles.sectionTitle}>Your Genre Affinity</h2>
        <div className={styles.spiderChartContainer}>
          {musicTaste.topGenres && musicTaste.topGenres.length > 0 ? (
            <div style={{ height: '400px' }}>
              <Radar data={prepareChartData()} options={chartOptions} />
            </div>
          ) : (
            <p className={styles.noData}>No genre data available</p>
          )}
        </div>
      </section>
      
      {/* Vibe Quiz Card - Non-intrusive prompt */}
      <VibeQuizCard onTasteUpdate={handleTasteUpdate} />
      
      {/* Top Artists Section */}
      <section id="artists" className={styles.section}>
        <h2 className={styles.sectionTitle}>Your Favorite Artists</h2>
        <div className={styles.artistsGrid}>
          {musicTaste.topArtists && musicTaste.topArtists.length > 0 ? (
            musicTaste.topArtists.map((artist, index) => (
              <div key={index} className={styles.artistCard}>
                <div className={styles.artistRank}>{artist.rank}</div>
                <div className={styles.artistImageContainer}>
                  <img 
                    src={artist.image} 
                    alt={artist.name} 
                    className={styles.artistImage}
                  />
                </div>
                <div className={styles.artistInfo}>
                  <h3 className={styles.artistName}>{artist.name}</h3>
                  <div className={styles.artistGenres}>
                    {artist.genres.map((genre, i) => (
                      <span key={i} className={styles.artistGenre}>{genre}</span>
                    ))}
                  </div>
                  {artist.similarArtists && artist.similarArtists.length > 0 && (
                    <div className={styles.similarArtists}>
                      <h4 className={styles.similarTitle}>Similar Artists</h4>
                      <div className={styles.similarGrid}>
                        {artist.similarArtists.map((similar, i) => (
                          <div key={i} className={styles.similarArtist}>
                            <img 
                              src={similar.image} 
                              alt={similar.name} 
                              className={styles.similarImage}
                            />
                            <span className={styles.similarName}>{similar.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className={styles.noData}>No artist data available</p>
          )}
        </div>
      </section>
      
      {/* Top Tracks Section */}
      <section id="tracks" className={styles.section}>
        <h2 className={styles.sectionTitle}>Your Top Tracks</h2>
        <div className={styles.tracksGrid}>
          {musicTaste.topTracks && musicTaste.topTracks.length > 0 ? (
            musicTaste.topTracks.map((track, index) => (
              <div key={index} className={styles.trackCard}>
                <div className={styles.trackRank}>{track.rank}</div>
                <div className={styles.trackImageContainer}>
                  <img 
                    src={track.image} 
                    alt={track.name} 
                    className={styles.trackImage}
                  />
                  {track.preview && (
                    <button className={styles.playButton}>
                      <span className={styles.playIcon}>▶</span>
                    </button>
                  )}
                </div>
                <div className={styles.trackInfo}>
                  <h3 className={styles.trackName}>{track.name}</h3>
                  <p className={styles.trackArtist}>{track.artist}</p>
                </div>
              </div>
            ))
          ) : (
            <p className={styles.noData}>No track data available</p>
          )}
        </div>
      </section>
      
      {/* Seasonal Mood Section */}
      <section id="seasonal" className={styles.section}>
        <h2 className={styles.sectionTitle}>Your Seasonal Music Mood</h2>
        <div className={styles.seasonalMoodGrid}>
          {musicTaste.seasonalMood && Object.keys(musicTaste.seasonalMood).length > 0 ? (
            Object.entries(musicTaste.seasonalMood)
              .filter(([season]) => season !== 'current')
              .map(([season, data], index) => (
                <div 
                  key={index} 
                  className={`${styles.seasonCard} ${musicTaste.seasonalMood.current === season ? styles.currentSeason : ''}`}
                >
                  <h3 className={styles.seasonName}>
                    {season.charAt(0).toUpperCase() + season.slice(1)}
                    {musicTaste.seasonalMood.current === season && (
                      <span className={styles.currentBadge}>Current</span>
                    )}
                  </h3>
                  <div className={styles.seasonMood}>
                    <span className={styles.moodLabel}>Mood:</span>
                    <span className={styles.moodValue}>{data.mood}</span>
                  </div>
                  <div className={styles.seasonGenres}>
                    <span className={styles.genresLabel}>Top Genres:</span>
                    <div className={styles.genresList}>
                      {data.genres.map((genre, i) => (
                        <span key={i} className={styles.seasonGenre}>{genre}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
          ) : (
            <p className={styles.noData}>No seasonal mood data available</p>
          )}
        </div>
      </section>
      
      {/* Events Section */}
      <section id="events" className={styles.section}>
        <h2 className={styles.sectionTitle}>Events Based on Your Taste</h2>
        <div className={styles.eventsNavigation}>
          <p className={styles.eventsDescription}>
            Discover events that match your unique music taste profile
          </p>
          <Link href="/events">
            <a className={styles.eventsButton}>
              Explore All Events
            </a>
          </Link>
        </div>
      </section>
      
      {/* Scroll to top button */}
      {showScrollToTop && (
        <button className={styles.scrollToTopButton} onClick={scrollToTop}>
          ↑
        </button>
      )}
    </div>
  );
}
