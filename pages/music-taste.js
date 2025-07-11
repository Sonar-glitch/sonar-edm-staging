import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  LineChart, 
  Line 
} from 'recharts';
import Layout from '../../components/Layout';

// Set auth requirement for this page
MusicTaste.auth = {
  requiredAuth: true
};

export default function MusicTaste() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [eventCount, setEventCount] = useState(0);

  // Fetch user data on initial load
  useEffect(() => {
    if (session) {
      fetchUserData();
      fetchEventCount();
    }
  }, [session]);

  // Fetch user taste data
  const fetchUserData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/spotify/user-taste');
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      } else {
        // If API fails, use sample data
        setSampleUserData();
      }
    } catch (error) {
      console.error('Error fetching user taste data:', error);
      setSampleUserData();
    } finally {
      setLoading(false);
    }
  };

  // Fetch event count
  const fetchEventCount = async () => {
    try {
      const response = await fetch('/api/events/count');
      if (response.ok) {
        const data = await response.json();
        setEventCount(data.count);
      } else {
        setEventCount(42); // Default count
      }
    } catch (error) {
      console.error('Error fetching event count:', error);
      setEventCount(42); // Default count
    }
  };

  // Set sample user data if API fails
  const setSampleUserData = () => {
    const tasteData = {
      genreProfile: {
        'House': 75,
        'Techno': 65,
        'Progressive House': 60,
        'Trance': 45,
        'Melodic': 55
      },
      artistProfile: [
        { name: 'Boris Brejcha', plays: 42, genre: 'Melodic Techno' },
        { name: 'Lane 8', plays: 38, genre: 'Progressive House' },
        { name: 'Tale Of Us', plays: 35, genre: 'Melodic Techno' },
        { name: 'Artbat', plays: 32, genre: 'Melodic House' },
        { name: 'Eric Prydz', plays: 28, genre: 'Progressive House' }
      ],
      listeningTrends: [
        { month: 'Jan', house: 65, techno: 55, trance: 30 },
        { month: 'Feb', house: 68, techno: 60, trance: 35 },
        { month: 'Mar', house: 75, techno: 65, trance: 40 },
        { month: 'Apr', house: 72, techno: 70, trance: 45 },
        { month: 'May', house: 70, techno: 68, trance: 50 },
        { month: 'Jun', house: 65, techno: 72, trance: 48 }
      ],
      topTracks: [
        { name: 'Realm of Consciousness', artist: 'Tale Of Us', plays: 18 },
        { name: 'Purple Noise', artist: 'Boris Brejcha', plays: 15 },
        { name: 'Atlas', artist: 'Lane 8', plays: 14 },
        { name: 'Return to Oz', artist: 'Artbat', plays: 12 },
        { name: 'Opus', artist: 'Eric Prydz', plays: 11 }
      ],
      mood: {
        energetic: 72,
        melodic: 85,
        dark: 58,
        euphoric: 76,
        deep: 68
      },
      seasonalProfile: {
        spring: ['Progressive House', 'Melodic House'],
        summer: ['Tech House', 'House'],
        fall: ['Organic House', 'Downtempo'],
        winter: ['Deep House', 'Ambient Techno']
      }
    };
    
    setUserProfile(tasteData);
  };
  
  // Get current season
  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  };

  // Prepare radar chart data
  const prepareGenreData = () => {
    if (!userProfile?.genreProfile) return [];
    
    return Object.entries(userProfile.genreProfile).map(([name, value]) => ({
      genre: name,
      value
    }));
  };

  // Prepare artist data for bar chart
  const prepareArtistData = () => {
    if (!userProfile?.artistProfile) return [];
    return userProfile.artistProfile.slice(0, 5);
  };

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-12 h-12 rounded-full border-t-4 border-b-4 border-cyan-500 animate-spin mb-4"></div>
          <p className="text-white text-lg">Analyzing your music taste...</p>
        </div>
      </Layout>
    );
  }

  // Get primary genres for summary display
  const getPrimaryGenres = () => {
    const genreProfile = userProfile?.genreProfile;
    if (!genreProfile || Object.keys(genreProfile).length === 0) return '';
    
    // Sort genres by value and take top 2
    const sortedGenres = Object.entries(genreProfile)
      .sort(([, a], [, b]) => b - a)
      .map(([genre]) => genre.toLowerCase())
      .slice(0, 2);
      
    return sortedGenres.join(' + ');
  };

  const currentSeason = getCurrentSeason();
  const genreData = prepareGenreData();
  const artistData = prepareArtistData();
  
  return (
    <Layout>
      <Head>
        <title>Your Music Taste | TIKO</title>
      </Head>
      
      <main className="max-w-5xl mx-auto px-4 pb-12">
        {/* User Summary Banner */}
        <div className="mb-8 mt-4 p-4 rounded-xl bg-gradient-to-r from-cyan-900/50 to-teal-900/50">
          <p className="text-center text-lg">
            Your music taste evolves around <span className="text-cyan-400 font-medium">{getPrimaryGenres()}</span> with 
            <span className="text-teal-400 font-medium"> {userProfile?.mood?.melodic || 85}% melodic</span> and
            <span className="text-teal-400 font-medium"> {userProfile?.mood?.energetic || 72}% energetic</span> tendencies.
            Found <span className="text-cyan-400 font-medium">{eventCount}</span> events that match your taste.
          </p>
        </div>
        
        {/* Tabs Navigation */}
        <div className="flex border-b border-gray-800 mb-6">
          <button 
            className={`px-4 py-2 font-medium ${activeTab === 'overview' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`px-4 py-2 font-medium ${activeTab === 'artists' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400'}`}
            onClick={() => setActiveTab('artists')}
          >
            Top Artists
          </button>
          <button 
            className={`px-4 py-2 font-medium ${activeTab === 'tracks' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400'}`}
            onClick={() => setActiveTab('tracks')}
          >
            Top Tracks
          </button>
          <button 
            className={`px-4 py-2 font-medium ${activeTab === 'trends' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400'}`}
            onClick={() => setActiveTab('trends')}
          >
            Listening Trends
          </button>
        </div>
        
        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Sonic Vibe Radar Chart */}
            <div className="bg-black/20 p-6 rounded-xl border border-cyan-500/20">
              <h2 className="text-xl text-cyan-500 font-semibold mb-4">Your Sonic Vibe</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius="80%" data={genreData}>
                    <PolarGrid stroke="rgba(0, 255, 255, 0.1)" />
                    <PolarAngleAxis 
                      dataKey="genre" 
                      tick={{ fill: '#00e5ff', fontSize: 12 }} 
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]} 
                      tick={{ fill: 'rgba(255, 255, 255, 0.15)', fontSize: 8 }}
                      tickCount={4}
                      axisLine={false}
                      tickFormatter={(value) => ``} // Hide the number labels
                    />
                    <Radar 
                      name="Genre Score" 
                      dataKey="value" 
                      stroke="#00e5ff" 
                      fill="#00e5ff" 
                      fillOpacity={0.3} 
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Mood Analysis */}
            <div className="bg-black/20 p-6 rounded-xl border border-cyan-500/20">
              <h2 className="text-xl text-cyan-500 font-semibold mb-4">Your Mood Preferences</h2>
              <div className="space-y-4">
                {userProfile && userProfile.mood && Object.entries(userProfile.mood).map(([mood, value]) => (
                  <div key={mood} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="capitalize text-sm">{mood}</span>
                      <span className="text-sm text-cyan-400">{value}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500" 
                        style={{ width: `${value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Seasonal Preferences */}
            <div className="bg-black/20 p-6 rounded-xl border border-cyan-500/20 lg:col-span-2">
              <h2 className="text-xl text-cyan-500 font-semibold mb-4">Your Seasonal Vibe Shifts</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {userProfile && userProfile.seasonalProfile && Object.entries(userProfile.seasonalProfile).map(([season, genres]) => (
                  <div 
                    key={season} 
                    className={`p-4 rounded-lg ${season === currentSeason ? 'bg-black/40 border border-cyan-500/50' : 'bg-black/20 border border-white/10'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="capitalize font-medium">{season}</span>
                      {season === currentSeason && (
                        <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-full">Now</span>
                      )}
                    </div>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {genres.map((genre, index) => (
                        <li key={index} className="text-gray-300">{genre}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'artists' && (
          <div className="bg-black/20 p-6 rounded-xl border border-cyan-500/20">
            <h2 className="text-xl text-cyan-500 font-semibold mb-6">Your Top Artists</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={artistData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                  <XAxis type="number" domain={[0, 'dataMax + 5']} />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip 
                    content={({ payload }) => {
                      if (payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-gray-900 p-2 rounded border border-cyan-500/30">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm text-cyan-400">{data.plays} plays</p>
                            <p className="text-sm text-gray-400">{data.genre}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="plays" fill="#00e5ff" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Artist Spotlight</h3>
              <div className="bg-black/30 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 flex items-center justify-center mr-4">
                    <span className="text-xl font-bold">BB</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-medium">Boris Brejcha</h4>
                    <p className="text-sm text-gray-400">Melodic Techno • 42 plays</p>
                  </div>
                </div>
                <p className="text-sm text-gray-300">
                  You've been listening to Boris Brejcha consistently over the last 3 months.
                  His music features strongly in your Melodic Techno and Minimal Techno preferences.
                </p>
                <div className="mt-3">
                  <Link href="/events" className="text-cyan-400 text-sm font-medium">Find events with Boris Brejcha →</Link>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'tracks' && (
          <div className="bg-black/20 p-6 rounded-xl border border-cyan-500/20">
            <h2 className="text-xl text-cyan-500 font-semibold mb-6">Your Top Tracks</h2>
            
            <div className="space-y-4">
              {userProfile?.topTracks?.map((track, index) => (
                <div key={index} className="flex items-center p-3 bg-black/30 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-lg font-bold">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{track.name}</h4>
                    <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                  </div>
                  <div className="text-right ml-4">
                    <span className="text-cyan-400 font-medium">{track.plays} plays</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 bg-black/30 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Track Analysis</h3>
              <p className="text-sm text-gray-300">
                Your top tracks show a strong preference for melodic elements and progressive structures.
                Most of your favorites have extended runtime (6+ minutes) with layered arrangements and 
                gradual progression.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-cyan-400">82%</div>
                  <div className="text-xs text-gray-400">of your top tracks are melodic</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-cyan-400">6:42</div>
                  <div className="text-xs text-gray-400">average track length</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'trends' && (
          <div className="bg-black/20 p-6 rounded-xl border border-cyan-500/20">
            <h2 className="text-xl text-cyan-500 font-semibold mb-6">Your Listening Trends</h2>
            
            <div className="h-80 mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userProfile?.listeningTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    content={({ payload, label }) => {
                      if (payload && payload.length > 0) {
                        return (
                          <div className="bg-gray-900 p-2 rounded border border-cyan-500/30">
                            <p className="font-medium">{label}</p>
                            {payload.map((entry, index) => (
                              <p key={index} className="text-sm" style={{ color: entry.color }}>
                                {entry.name}: {entry.value}%
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line type="monotone" dataKey="house" stroke="#00e5ff" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="techno" stroke="#f472b6" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="trance" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-black/30 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Trend Analysis</h3>
              <p className="text-sm text-gray-300">
                Your listening habits show an increasing interest in techno over the past 6 months,
                while maintaining a consistent appreciation for house music. Your trance listening
                has also been steadily growing, suggesting an expanding taste profile.
              </p>
              <div className="mt-4">
                <Link href="/events" className="text-cyan-400 text-sm font-medium">Discover events matching your trends →</Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
}
