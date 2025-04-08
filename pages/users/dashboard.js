/**
 * User Dashboard Component for Sonar EDM Platform
 * 
 * This component provides music taste analysis and recommendations for end users.
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useSession, signIn } from 'next-auth/react';
import config from '../../config';

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  // Common EDM genres
  const edmGenres = [
    'house', 'techno', 'trance', 'dubstep', 'drum-and-bass',
    'electro', 'progressive-house', 'hardstyle', 'ambient',
    'trap', 'future-bass', 'deep-house', 'tech-house'
  ];

  // Fetch user profile and recommendations on component mount
  useEffect(() => {
    if (status === 'authenticated') {
      setGenres(edmGenres);
      // In a real app, we would fetch the user's Spotify profile and top artists
      // For now, we'll simulate some user data
      simulateUserProfile();
      // Default to some popular EDM genres for initial recommendations
      getRecommendations(['house', 'techno', 'trance']);
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status]);

  // Simulate user profile data
  const simulateUserProfile = () => {
    const mockProfile = {
      topGenres: ['house', 'techno', 'trance'].sort(() => Math.random() - 0.5),
      recentlyPlayed: [
        { name: 'Strobe', artist: 'deadmau5', played: '2 hours ago' },
        { name: 'Opus', artist: 'Eric Prydz', played: '5 hours ago' },
        { name: 'Satisfaction', artist: 'Benny Benassi', played: '1 day ago' },
        { name: 'Levels', artist: 'Avicii', played: '2 days ago' },
      ],
      listeningStats: {
        hoursPerWeek: Math.floor(Math.random() * 20 + 5),
        favoriteTimeOfDay: ['Morning', 'Afternoon', 'Evening', 'Night'][Math.floor(Math.random() * 4)],
        topArtists: ['deadmau5', 'Eric Prydz', 'Avicii', 'Tiesto', 'Armin van Buuren'].sort(() => Math.random() - 0.5).slice(0, 3)
      },
      tasteProfile: {
        energy: Math.floor(Math.random() * 100),
        danceability: Math.floor(Math.random() * 100),
        positivity: Math.floor(Math.random() * 100),
        tempo: Math.floor(Math.random() * 50 + 100)
      }
    };
    
    setUserProfile(mockProfile);
    setSelectedGenres(mockProfile.topGenres);
  };

  // Get recommendations based on selected genres
  const getRecommendations = async (genreList = selectedGenres) => {
    if (!genreList.length) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/spotify?type=recommendations&genres=${genreList.join(',')}`);
      const data = await response.json();
      setRecommendations(data.tracks || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle genre selection
  const toggleGenre = (genre) => {
    const newSelection = selectedGenres.includes(genre)
      ? selectedGenres.filter(g => g !== genre)
      : [...selectedGenres, genre];
    
    setSelectedGenres(newSelection);
  };

  // Handle recommendation refresh
  const refreshRecommendations = () => {
    getRecommendations();
  };

  // If not authenticated, show sign-in prompt
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-gray-900 text-white flex items-center justify-center">
        <Head>
          <title>User Dashboard | {config.app.name}</title>
          <meta name="description" content="Music taste analysis and recommendations for EDM fans" />
        </Head>

        <div className="text-center p-8 max-w-md">
          <h1 className="text-3xl font-bold mb-6">User Dashboard</h1>
          <p className="mb-8 text-gray-300">
            Sign in with your Spotify account to analyze your music taste and get personalized EDM recommendations.
          </p>
          <button
            onClick={() => signIn('spotify')}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Sign in with Spotify
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-gray-900 text-white">
      <Head>
        <title>User Dashboard | {config.app.name}</title>
        <meta name="description" content="Music taste analysis and recommendations for EDM fans" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Your Music Profile</h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* User Profile and Taste Analysis */}
          <div className="md:col-span-1">
            {userProfile ? (
              <div className="space-y-6">
                {/* Music Taste Profile */}
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Your Taste Profile</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Energy</span>
                        <span>{userProfile.tasteProfile.energy}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${userProfile.tasteProfile.energy}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Danceability</span>
                        <span>{userProfile.tasteProfile.danceability}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${userProfile.tasteProfile.danceability}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Positivity</span>
                        <span>{userProfile.tasteProfile.positivity}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${userProfile.tasteProfile.positivity}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Average Tempo</span>
                        <span>{userProfile.tasteProfile.tempo} BPM</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Listening Stats */}
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Listening Stats</h2>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Hours per week</span>
                      <span>{userProfile.listeningStats.hoursPerWeek}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Favorite time</span>
                      <span>{userProfile.listeningStats.favoriteTimeOfDay}</span>
                    </div>
                    
                    <div>
                      <div className="text-gray-400 mb-1">Top artists</div>
                      <div className="flex flex-wrap gap-2">
                        {userProfile.listeningStats.topArtists.map((artist, index) => (
                          <span key={index} className="bg-blue-900/50 px-3 py-1 rounded-full text-sm">
                            {artist}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Recently Played */}
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Recently Played</h2>
                  
                  <ul className="space-y-3">
                    {userProfile.recentlyPlayed.map((track, index) => (
                      <li key={index} className="border-b border-gray-700 pb-2 last:border-0 last:pb-0">
                        <div className="font-medium">{track.name}</div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">{track.artist}</span>
                          <span className="text-gray-500">{track.played}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800/50 rounded-lg p-8 h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <p>Loading your profile...</p>
                </div>
              </div>
            )}
          </div>

          {/* Recommendations and Genre Selection */}
          <div className="md:col-span-2">
            {/* Genre Selection */}
            <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Select Your Genres</h2>
                <button
                  onClick={refreshRecommendations}
                  disabled={selectedGenres.length === 0 || loading}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedGenres.length === 0 || loading
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Get Recommendations
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedGenres.includes(genre)
                        ? 'bg-blue-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {genre.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Recommended Tracks</h2>
              
              {loading ? (
                <div className="text-center py-8">Loading recommendations...</div>
              ) : recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.map((track) => (
                    <div key={track.id} className="bg-gray-700/30 p-4 rounded-lg">
                      <div className="flex items-center gap-4">
                        {track.album.images?.[2]?.url && (
                          <img
                            src={track.album.images[2].url}
                            alt={track.album.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        
                        <div className="flex-1">
                          <div className="font-medium">{track.name}</div>
                          <div className="text-sm text-gray-400">
                            {track.artists.map(a => a.name).join(', ')}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm text-gray-400">
                            {track.album.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(track.album.release_date).getFullYear()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  {selectedGenres.length === 0
                    ? 'Select at least one genre to get recommendations'
                    : 'No recommendations found. Try different genres.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
