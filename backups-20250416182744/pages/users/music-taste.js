import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Head from 'next/head';
import Link from 'next/link';
import Navigation from '../../components/Navigation';
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
  const [showVibeQuiz, setShowVibeQuiz] = useState(false);

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

  // Handle section navigation
  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  // Toggle Vibe Quiz
  const toggleVibeQuiz = () => {
    setShowVibeQuiz(!showVibeQuiz);
  };

  // Handle Vibe Quiz submission
  const handleVibeQuizSubmit = async (preferences) => {
    try {
      await axios.post('/api/user/update-taste-preferences', { preferences });
      // Refresh music taste data
      const response = await axios.get('/api/spotify/user-taste');
      setMusicTaste(response.data);
    } catch (err) {
      console.error('Error updating taste preferences:', err);
    }
  };

  if (status === 'loading') {
    return <div className={styles.loadingContainer}>Loading...</div>;
  }

  if (!session) {
    return (
      <div className={styles.errorContainer}>
        <p>You must be signed in to view this page.</p>
        <Link href="/api/auth/signin">
          <a className={styles.signInButton}>Sign in</a>
        </Link>
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

      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Your Music Taste</h1>
          <p className={styles.subtitle}>
            Explore your EDM preferences based on your Spotify listening history
          </p>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading your music taste profile...</p>
          </div>
        ) : error ? (
          <div className={styles.errorCard}>
            <h2>Error loading music taste</h2>
            <p>{error}</p>
            <button 
              className={styles.retryButton}
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Quick Navigation */}
            <div className={styles.quickNav}>
              <button 
                className={`${styles.quickNavButton} ${activeSection === 'genres' ? styles.active : ''}`}
                onClick={() => handleSectionChange('genres')}
              >
                Genres
              </button>
              <button 
                className={`${styles.quickNavButton} ${activeSection === 'artists' ? styles.active : ''}`}
                onClick={() => handleSectionChange('artists')}
              >
                Artists
              </button>
              <button 
                className={`${styles.quickNavButton} ${activeSection === 'tracks' ? styles.active : ''}`}
                onClick={() => handleSectionChange('tracks')}
              >
                Tracks
              </button>
              <button 
                className={`${styles.quickNavButton} ${activeSection === 'seasonal' ? styles.active : ''}`}
                onClick={() => handleSectionChange('seasonal')}
              >
                Seasonal
              </button>
            </div>

            {/* Genre Radar Chart */}
            <section 
              id="genres" 
              className={`${styles.section} ${activeSection === 'genres' ? styles.active : ''}`}
            >
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Genre Affinity</h2>
                <p className={styles.sectionSubtitle}>
                  Your top EDM genres based on listening patterns
                </p>
              </div>

              <div className={styles.chartContainer}>
                {prepareChartData() && (
                  <Radar data={prepareChartData()} options={chartOptions} />
                )}
              </div>
            </section>

            {/* Top Artists */}
            <section 
              id="artists" 
              className={`${styles.section} ${activeSection === 'artists' ? styles.active : ''}`}
            >
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Top Artists</h2>
                <p className={styles.sectionSubtitle}>
                  Your most played EDM artists
                </p>
              </div>

              <div className={styles.artistsGrid}>
                {musicTaste?.topArtists?.map((artist, index) => (
                  <div key={index} className={styles.artistCard}>
                    <div className={styles.artistRank}>#{artist.rank}</div>
                    <div className={styles.artistImageContainer}>
                      <img 
                        src={artist.image} 
                        alt={artist.name} 
                        className={styles.artistImage} 
                      />
                    </div>
                    <h3 className={styles.artistName}>{artist.name}</h3>
                    <div className={styles.artistGenres}>
                      {artist.genres.join(' • ')}
                    </div>
                    
                    {artist.similarArtists && artist.similarArtists.length > 0 && (
                      <div className={styles.similarArtists}>
                        <h4 className={styles.similarTitle}>Similar Artists</h4>
                        <div className={styles.similarGrid}>
                          {artist.similarArtists.map((similar, idx) => (
                            <div key={idx} className={styles.similarArtist}>
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
                ))}
              </div>
            </section>

            {/* Top Tracks */}
            <section 
              id="tracks" 
              className={`${styles.section} ${activeSection === 'tracks' ? styles.active : ''}`}
            >
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Top Tracks</h2>
                <p className={styles.sectionSubtitle}>
                  Your most played EDM tracks
                </p>
              </div>

              <div className={styles.tracksContainer}>
                {musicTaste?.topTracks?.map((track, index) => (
                  <div key={index} className={styles.trackCard}>
                    <div className={styles.trackRank}>#{track.rank}</div>
                    <img 
                      src={track.image} 
                      alt={track.name} 
                      className={styles.trackImage} 
                    />
                    <div className={styles.trackInfo}>
                      <h3 className={styles.trackName}>{track.name}</h3>
                      <p className={styles.trackArtist}>{track.artist}</p>
                    </div>
                    {track.preview && (
                      <audio 
                        className={styles.trackPreview} 
                        controls 
                        src={track.preview}
                      ></audio>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Seasonal Mood */}
            <section 
              id="seasonal" 
              className={`${styles.section} ${activeSection === 'seasonal' ? styles.active : ''}`}
            >
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Seasonal Mood</h2>
                <p className={styles.sectionSubtitle}>
                  How your music taste changes with the seasons
                </p>
              </div>

              <div className={styles.seasonalContainer}>
                {musicTaste?.seasonalMood && (
                  <>
                    <div className={`${styles.seasonCard} ${styles.winter} ${musicTaste.seasonalMood.current === 'winter' ? styles.current : ''}`}>
                      <h3 className={styles.seasonName}>Winter</h3>
                      <div className={styles.seasonMood}>
                        <span className={styles.moodLabel}>Mood:</span> 
                        <span className={styles.moodValue}>{musicTaste.seasonalMood.winter.mood}</span>
                      </div>
                      <div className={styles.seasonGenres}>
                        <span className={styles.genresLabel}>Genres:</span>
                        <div className={styles.genresList}>
                          {musicTaste.seasonalMood.winter.genres.map((genre, idx) => (
                            <span key={idx} className={styles.genreTag}>{genre}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className={`${styles.seasonCard} ${styles.spring} ${musicTaste.seasonalMood.current === 'spring' ? styles.current : ''}`}>
                      <h3 className={styles.seasonName}>Spring</h3>
                      <div className={styles.seasonMood}>
                        <span className={styles.moodLabel}>Mood:</span> 
                        <span className={styles.moodValue}>{musicTaste.seasonalMood.spring.mood}</span>
                      </div>
                      <div className={styles.seasonGenres}>
                        <span className={styles.genresLabel}>Genres:</span>
                        <div className={styles.genresList}>
                          {musicTaste.seasonalMood.spring.genres.map((genre, idx) => (
                            <span key={idx} className={styles.genreTag}>{genre}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className={`${styles.seasonCard} ${styles.summer} ${musicTaste.seasonalMood.current === 'summer' ? styles.current : ''}`}>
                      <h3 className={styles.seasonName}>Summer</h3>
                      <div className={styles.seasonMood}>
                        <span className={styles.moodLabel}>Mood:</span> 
                        <span className={styles.moodValue}>{musicTaste.seasonalMood.summer.mood}</span>
                      </div>
                      <div className={styles.seasonGenres}>
                        <span className={styles.genresLabel}>Genres:</span>
                        <div className={styles.genresList}>
                          {musicTaste.seasonalMood.summer.genres.map((genre, idx) => (
                            <span key={idx} className={styles.genreTag}>{genre}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className={`${styles.seasonCard} ${styles.fall} ${musicTaste.seasonalMood.current === 'fall' ? styles.current : ''}`}>
                      <h3 className={styles.seasonName}>Fall</h3>
                      <div className={styles.seasonMood}>
                        <span className={styles.moodLabel}>Mood:</span> 
                        <span className={styles.moodValue}>{musicTaste.seasonalMood.fall.mood}</span>
                      </div>
                      <div className={styles.seasonGenres}>
                        <span className={styles.genresLabel}>Genres:</span>
                        <div className={styles.genresList}>
                          {musicTaste.seasonalMood.fall.genres.map((genre, idx) => (
                            <span key={idx} className={styles.genreTag}>{genre}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Vibe Quiz Card */}
            <div className={styles.vibeQuizContainer}>
              <div className={`${styles.vibeQuizCard} ${showVibeQuiz ? styles.expanded : ''}`}>
                <div className={styles.vibeQuizHeader} onClick={toggleVibeQuiz}>
                  <h3 className={styles.vibeQuizTitle}>
                    {showVibeQuiz ? 'Refine Your Taste Profile' : 'Something doesn\'t feel right?'}
                  </h3>
                  <div className={styles.toggleIcon}>
                    {showVibeQuiz ? '−' : '+'}
                  </div>
                </div>
                
                {showVibeQuiz && (
                  <div className={styles.vibeQuizContent}>
                    <p className={styles.vibeQuizDescription}>
                      Answer a few quick questions to help us fine-tune your music recommendations.
                    </p>
                    
                    <div className={styles.quizForm}>
                      <div className={styles.quizQuestion}>
                        <h4>What tempo do you prefer?</h4>
                        <div className={styles.quizOptions}>
                          <button 
                            className={styles.quizOption}
                            onClick={() => handleVibeQuizSubmit({ tempo: 'slow' })}
                          >
                            Slow & Chill
                          </button>
                          <button 
                            className={styles.quizOption}
                            onClick={() => handleVibeQuizSubmit({ tempo: 'medium' })}
                          >
                            Medium & Groovy
                          </button>
                          <button 
                            className={styles.quizOption}
                            onClick={() => handleVibeQuizSubmit({ tempo: 'fast' })}
                          >
                            Fast & Energetic
                          </button>
                        </div>
                      </div>
                      
                      <div className={styles.quizQuestion}>
                        <h4>What mood resonates with you most?</h4>
                        <div className={styles.quizOptions}>
                          <button 
                            className={styles.quizOption}
                            onClick={() => handleVibeQuizSubmit({ mood: 'dark' })}
                          >
                            Dark & Mysterious
                          </button>
                          <button 
                            className={styles.quizOption}
                            onClick={() => handleVibeQuizSubmit({ mood: 'uplifting' })}
                          >
                            Uplifting & Euphoric
                          </button>
                          <button 
                            className={styles.quizOption}
                            onClick={() => handleVibeQuizSubmit({ mood: 'melodic' })}
                          >
                            Melodic & Emotional
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Events Navigation Card */}
            <div className={styles.eventsNavContainer}>
              <div className={styles.eventsNavCard}>
                <div className={styles.eventsNavContent}>
                  <h3 className={styles.eventsNavTitle}>Discover Events That Match Your Taste</h3>
                  <p className={styles.eventsNavDescription}>
                    Find EDM events featuring artists and genres you love
                  </p>
                  <Link href="/users/events">
                    <a className={styles.eventsNavButton}>
                      Explore Events
                    </a>
                  </Link>
                </div>
                <div className={styles.eventsNavDecoration}></div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
