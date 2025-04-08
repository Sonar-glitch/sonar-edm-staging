/**
 * Promoter Dashboard Component for Sonar EDM Platform
 * 
 * This component provides analytics and insights for EDM event promoters.
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import config from '../../config';

export default function PromoterDashboard() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [artists, setArtists] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [artistStats, setArtistStats] = useState(null);

  // Fetch trending EDM artists on component mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetchTrendingArtists();
    }
  }, [status]);

  // Fetch trending EDM artists
  const fetchTrendingArtists = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/spotify?type=search&query=genre:edm&searchType=artist');
      const data = await response.json();
      setArtists(data.artists?.items || []);
    } catch (error) {
      console.error('Error fetching trending artists:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search for artists
  const searchArtists = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/spotify?type=search&query=${encodeURIComponent(searchQuery)}&searchType=artist`);
      const data = await response.json();
      setArtists(data.artists?.items || []);
    } catch (error) {
      console.error('Error searching artists:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get artist details and analytics
  const getArtistDetails = async (artistId) => {
    try {
      setLoading(true);
      
      // Fetch artist details
      const artistResponse = await fetch(`/api/spotify?type=artist&id=${artistId}`);
      const artistData = await artistResponse.json();
      
      // Fetch top tracks
      const tracksResponse = await fetch(`/api/spotify?type=top-tracks&id=${artistId}`);
      const tracksData = await tracksResponse.json();
      
      // Fetch related artists
      const relatedResponse = await fetch(`/api/spotify?type=related-artists&id=${artistId}`);
      const relatedData = await relatedResponse.json();
      
      // In a real app, we would fetch additional analytics from our database
      // For now, we'll simulate some analytics data
      const simulatedStats = {
        popularity: artistData.popularity,
        followers: artistData.followers.total,
        genres: artistData.genres,
        monthlyListeners: Math.floor(artistData.followers.total * (Math.random() * 0.5 + 0.5)),
        eventDemand: Math.floor(Math.random() * 100),
        ticketPriceSuggestion: Math.floor(20 + artistData.popularity * 0.8),
        conversionRate: (Math.random() * 0.1 + 0.02).toFixed(2),
        topMarkets: ['New York', 'Los Angeles', 'Miami', 'Chicago', 'Las Vegas'].sort(() => Math.random() - 0.5).slice(0, 3),
        audienceAge: {
          '18-24': Math.floor(Math.random() * 30 + 10),
          '25-34': Math.floor(Math.random() * 30 + 20),
          '35-44': Math.floor(Math.random() * 20 + 10),
          '45+': Math.floor(Math.random() * 10 + 5)
        }
      };
      
      setSelectedArtist({
        ...artistData,
        topTracks: tracksData.tracks || [],
        relatedArtists: relatedData.artists || []
      });
      
      setArtistStats(simulatedStats);
    } catch (error) {
      console.error('Error fetching artist details:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-gray-900 text-white">
      <Head>
        <title>Promoter Dashboard | {config.app.name}</title>
        <meta name="description" content="Analytics and insights for EDM event promoters" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Promoter Dashboard</h1>

        {/* Search Form */}
        <div className="bg-gray-800/50 rounded-lg p-6 mb-8">
          <form onSubmit={searchArtists} className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for artists..."
              className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Artist List */}
          <div className="md:col-span-1">
            <div className="bg-gray-800/50 rounded-lg p-6 h-full">
              <h2 className="text-xl font-semibold mb-4">
                {searchQuery ? 'Search Results' : 'Trending EDM Artists'}
              </h2>
              
              {loading && !selectedArtist ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <ul className="space-y-2">
                  {artists.map((artist) => (
                    <li key={artist.id}>
                      <button
                        onClick={() => getArtistDetails(artist.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                          selectedArtist?.id === artist.id
                            ? 'bg-purple-700'
                            : 'hover:bg-gray-700'
                        }`}
                      >
                        <div className="font-medium">{artist.name}</div>
                        <div className="text-sm text-gray-400">
                          Popularity: {artist.popularity}/100
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              
              {artists.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-400">
                  No artists found. Try a different search.
                </div>
              )}
            </div>
          </div>

          {/* Artist Details and Analytics */}
          <div className="md:col-span-2">
            {selectedArtist ? (
              <div className="bg-gray-800/50 rounded-lg p-6">
                <div className="flex items-start gap-6 mb-6">
                  {selectedArtist.images?.[0]?.url && (
                    <img
                      src={selectedArtist.images[0].url}
                      alt={selectedArtist.name}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  )}
                  
                  <div>
                    <h2 className="text-2xl font-bold">{selectedArtist.name}</h2>
                    <div className="text-gray-400 mb-2">
                      {selectedArtist.genres.join(', ')}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="bg-purple-900/50 px-3 py-1 rounded-full text-sm">
                        Popularity: {selectedArtist.popularity}/100
                      </div>
                      <div className="bg-purple-900/50 px-3 py-1 rounded-full text-sm">
                        Followers: {selectedArtist.followers.total.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analytics Dashboard */}
                {artistStats && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-4">Promoter Analytics</h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-700/50 p-4 rounded-lg">
                        <div className="text-sm text-gray-400">Monthly Listeners</div>
                        <div className="text-2xl font-semibold">{artistStats.monthlyListeners.toLocaleString()}</div>
                      </div>
                      
                      <div className="bg-gray-700/50 p-4 rounded-lg">
                        <div className="text-sm text-gray-400">Event Demand</div>
                        <div className="text-2xl font-semibold">{artistStats.eventDemand}/100</div>
                      </div>
                      
                      <div className="bg-gray-700/50 p-4 rounded-lg">
                        <div className="text-sm text-gray-400">Ticket Price Suggestion</div>
                        <div className="text-2xl font-semibold">${artistStats.ticketPriceSuggestion}</div>
                      </div>
                      
                      <div className="bg-gray-700/50 p-4 rounded-lg">
                        <div className="text-sm text-gray-400">Conversion Rate</div>
                        <div className="text-2xl font-semibold">{artistStats.conversionRate * 100}%</div>
                      </div>
                      
                      <div className="bg-gray-700/50 p-4 rounded-lg">
                        <div className="text-sm text-gray-400">Top Markets</div>
                        <div className="text-lg font-semibold">{artistStats.topMarkets.join(', ')}</div>
                      </div>
                      
                      <div className="bg-gray-700/50 p-4 rounded-lg">
                        <div className="text-sm text-gray-400">Genre Trend</div>
                        <div className="text-lg font-semibold">
                          {artistStats.genres && artistStats.genres.length > 0
                            ? artistStats.genres[0]
                            : 'Electronic'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700/50 p-4 rounded-lg mb-6">
                      <h4 className="font-semibold mb-2">Audience Age Distribution</h4>
                      <div className="flex items-end h-24 gap-1">
                        {Object.entries(artistStats.audienceAge).map(([age, percentage]) => (
                          <div key={age} className="flex flex-col items-center flex-1">
                            <div className="w-full bg-purple-600 rounded-t-sm" style={{ height: `${percentage}%` }}></div>
                            <div className="text-xs mt-1">{age}</div>
                            <div className="text-xs text-gray-400">{percentage}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Top Tracks */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-4">Top Tracks</h3>
                  <ul className="space-y-2">
                    {selectedArtist.topTracks.slice(0, 5).map((track) => (
                      <li key={track.id} className="bg-gray-700/30 p-3 rounded-lg">
                        <div className="font-medium">{track.name}</div>
                        <div className="text-sm text-gray-400">
                          Popularity: {track.popularity}/100
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Related Artists */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">Similar Artists</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedArtist.relatedArtists.slice(0, 6).map((artist) => (
                      <button
                        key={artist.id}
                        onClick={() => getArtistDetails(artist.id)}
                        className="bg-gray-700/30 p-3 rounded-lg text-left hover:bg-gray-700 transition-colors"
                      >
                        <div className="font-medium">{artist.name}</div>
                        <div className="text-sm text-gray-400">
                          Popularity: {artist.popularity}/100
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800/50 rounded-lg p-8 h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <p className="mb-4">Select an artist to view analytics and insights</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
