// pages/music-taste.js - COMPLETE VERSION WITH ALL MISSING FEATURES
import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import AppLayout from '../components/AppLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Treemap } from 'recharts';
import styles from '../styles/EnhancedPersonalizedDashboard.module.css';

// --- HELPER COMPONENTS ---

const SimpleCard = ({ children }) => <div className={styles.card}>{children}</div>;

const CardHeader = ({ title, dataStatus, verificationData, showHoverTimestamp = true }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <div className={styles.cardHeader}>
      <h2 className={styles.cardTitle}>{title}</h2>
      <div className="flex items-center space-x-2">
        <span className={styles.dataIndicator}>{dataStatus}</span>
        {dataStatus === 'Real Data' && verificationData?.timestamp && (
          <div 
            className={styles.dataVerification}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <span className={styles.verifyIcon}>✓</span>
            <span className={styles.verifyText}>Verified</span>
            {showTooltip && showHoverTimestamp && (
              <div className={styles.hoverTooltip}>
                <p>Last updated: {getTimeAgo(verificationData.timestamp)}</p>
                <p>Source: {verificationData.source}</p>
                <p>Fetched: {new Date(verificationData.timestamp).toLocaleString()}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const CardContent = ({ children }) => <div className="p-6 relative">{children}</div>;

const CustomizedContent = (props) => {
  const { root, depth, x, y, width, height, index, name, colors } = props;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} style={{ fill: colors[index % colors.length], stroke: '#fff', strokeWidth: 2 }} />
      {width > 80 && height > 25 && (
        <text x={x + width / 2} y={y + height / 2 + 7} textAnchor="middle" fill="#fff" fontSize={14} style={{ pointerEvents: 'none' }}>
          {name}
        </text>
      )}
    </g>
  );
};

const CustomTreemapTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 rounded-md" style={{ background: 'rgba(0, 0, 0, 0.8)', border: '1px solid #fff' }}>
        <p className="text-white">{`${data.name} (${data.size} artists)`}</p>
      </div>
    );
  }
  return null;
};

// --- ENHANCED CARDS WITH MISSING FEATURES ---

const TopArtistsCard = ({ liveData, dataStatus, verificationData }) => {
  // Calculate similar artists based on genre overlap
  const getSimilarArtists = (targetArtist, allArtists) => {
    if (!targetArtist.genres || !allArtists) return [];
    
    return allArtists.items
      .filter(artist => artist.id !== targetArtist.id && artist.genres)
      .map(artist => {
        const targetGenres = new Set(targetArtist.genres);
        const artistGenres = new Set(artist.genres);
        const overlap = [...targetGenres].filter(g => artistGenres.has(g)).length;
        const similarity = overlap / Math.max(targetGenres.size, artistGenres.size);
        return { ...artist, similarity };
      })
      .filter(artist => artist.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 2);
  };

  return (
    <SimpleCard>
      <CardHeader title="Your Top Artists + Similar Artists" dataStatus={dataStatus} verificationData={verificationData} />
      <CardContent>
        <ul className="space-y-4">
          {(liveData?.artists?.items || []).slice(0, 5).map((artist, i) => {
            const similarArtists = getSimilarArtists(artist, liveData?.artists);
            return (
              <li key={artist.id} className="space-y-2">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-white">{i + 1}. {artist.name}</p>
                    <p className="text-sm text-gray-400">{(artist.genres || []).slice(0, 2).join(', ')}</p>
                  </div>
                </div>
                {similarArtists.length > 0 && (
                  <div className="ml-16 text-sm text-gray-300">
                    <p className="text-cyan-400">Similar artists:</p>
                    {similarArtists.map(similar => (
                      <p key={similar.id} className="ml-2">
                        • {similar.name} ({Math.round(similar.similarity * 100)}% match)
                      </p>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </SimpleCard>
  );
};

const TopTracksCard = ({ liveData, profileData, dataStatus, verificationData }) => {
  const oldTrackIds = new Map((profileData?.recentActivity?.liked || []).map((track, index) => [track.trackId, index]));
  
  const getChangeIndicator = (trackId, currentIndex) => {
    if (!oldTrackIds.has(trackId)) { 
      return <span className="text-xs font-bold text-green-400 ml-2">🔥 New</span>; 
    }
    const oldIndex = oldTrackIds.get(trackId);
    if (currentIndex < oldIndex) { 
      return <span className="text-xs text-green-400 ml-2">🔼</span>; 
    }
    return null;
  };

  // Get similar tracks based on artist overlap
  const getSimilarTracks = (targetTrack, recentActivity) => {
    if (!targetTrack.artists || !recentActivity?.liked) return [];
    
    const targetArtistNames = new Set(targetTrack.artists.map(a => a.name.toLowerCase()));
    
    return recentActivity.liked
      .filter(track => track.trackId !== targetTrack.id)
      .map(track => {
        const trackArtistNames = new Set(track.artists.map(a => a.toLowerCase()));
        const overlap = [...targetArtistNames].filter(a => trackArtistNames.has(a)).length;
        const similarity = overlap / Math.max(targetArtistNames.size, trackArtistNames.size);
        return { ...track, similarity };
      })
      .filter(track => track.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 2);
  };

  return (
    <SimpleCard>
      <CardHeader title="Your Top Tracks + Similar Tracks" dataStatus={dataStatus} verificationData={verificationData} />
      <CardContent>
        <ul className="space-y-3">
          {(liveData?.tracks?.items || []).slice(0, 5).map((track, i) => {
            const similarTracks = getSimilarTracks(track, profileData?.recentActivity);
            return (
              <li key={track.id} className="space-y-2">
                <div className="flex items-center text-gray-300">
                  <span>{i + 1}. {track.name} - <span className="text-gray-500">{(track.artists || []).map(a => a.name).join(', ')}</span></span>
                  {getChangeIndicator(track.id, i)}
                </div>
                {similarTracks.length > 0 && (
                  <div className="ml-6 text-sm text-gray-400">
                    <p className="text-cyan-400">Similar in your history:</p>
                    {similarTracks.map(similar => (
                      <p key={similar.trackId} className="ml-2">
                        • {similar.name} - {similar.artists.join(', ')} ({Math.round(similar.similarity * 100)}% match)
                      </p>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </SimpleCard>
  );
};

const TopGenresCard = ({ liveData, dataStatus, verificationData }) => {
  const genreData = Object.entries(liveData?.genreProfile || {}).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  return (
    <SimpleCard>
      <CardHeader title="Your Top Genres" dataStatus={dataStatus} verificationData={verificationData} />
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={genreData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
            <XAxis type="number" stroke="#A0AEC0" />
            <YAxis type="category" dataKey="name" width={100} stroke="#A0AEC0" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#2D3748', border: '1px solid #4A5568' }} />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </SimpleCard>
  );
};

const TasteEvolutionTab = ({ profileData, dataStatus, verificationData }) => {
  const history = profileData?.tasteEvolution || [];
  const allGenres = [...new Set(history.flatMap(e => Object.keys(e.genres || {})))].slice(0, 5);
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F'];
  const evolutionData = history.map(entry => {
    const dataPoint = { date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
    allGenres.forEach(genre => { dataPoint[genre] = entry.genres?.[genre] || 0; });
    return dataPoint;
  });
  return (
    <SimpleCard>
      <CardHeader title="Your Top 5 Genres Over Time" dataStatus={dataStatus} verificationData={verificationData} />
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={evolutionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
            <XAxis dataKey="date" stroke="#A0AEC0" />
            <YAxis stroke="#A0AEC0" />
            <Tooltip contentStyle={{ backgroundColor: '#2D3748', border: '1px solid #4A5568' }} />
            <Legend />
            {allGenres.map((genre, i) => (
              <Line key={genre} type="monotone" dataKey={genre} stroke={colors[i % colors.length]} name={genre.replace(/\b\w/g, l => l.toUpperCase())} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </SimpleCard>
  );
};

const GenreDeepDiveCard = ({ liveData, dataStatus, verificationData }) => {
  const genreData = (liveData?.artists?.items || []).flatMap(artist => artist.genres).reduce((acc, genre) => { acc[genre] = (acc[genre] || 0) + 1; return acc; }, {});
  const treeData = Object.entries(genreData).map(([name, size]) => ({ name, size }));
  const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  return (
    <SimpleCard>
      <CardHeader title="Genre Deep Dive" dataStatus={dataStatus} verificationData={verificationData} />
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <Treemap data={treeData} dataKey="size" ratio={4 / 3} stroke="#fff" fill="#8884d8" content={<CustomizedContent colors={colors}/>}>
            <Tooltip content={<CustomTreemapTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </CardContent>
    </SimpleCard>
  );
};

// --- NEW MISSING FEATURES ---

const TotalPlaylistsCard = ({ profileData, dataStatus, verificationData }) => {
  // Mock playlist data since it's not in the current API
  const playlists = profileData?.playlists || [
    { id: 'pl1', name: 'Late Night Drives', characteristics: 'Deep, melodic, progressive', trackCount: 47, lastUpdated: new Date('2025-07-10T20:00:00Z') },
    { id: 'pl2', name: 'Workout Energy', characteristics: 'High-energy, techno, driving beats', trackCount: 89, lastUpdated: new Date('2025-07-08T11:00:00Z') },
    { id: 'pl3', name: 'Sunday Chill', characteristics: 'Organic house, downtempo, ambient', trackCount: 32, lastUpdated: new Date('2025-07-05T15:30:00Z') },
  ];

  const totalTracks = playlists.reduce((sum, pl) => sum + pl.trackCount, 0);

  return (
    <SimpleCard>
      <CardHeader title="Total Playlists" dataStatus="Demo Data" verificationData={verificationData} />
      <CardContent>
        <div className="space-y-4">
          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-white">{playlists.length} Playlists</p>
            <p className="text-gray-400">{totalTracks} total tracks</p>
          </div>
          
          {playlists.map(playlist => (
            <div key={playlist.id} className="border-l-4 border-cyan-500 pl-4 py-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-white">{playlist.name}</p>
                  <p className="text-sm text-gray-400">{playlist.characteristics}</p>
                  <p className="text-xs text-gray-500">{playlist.trackCount} tracks</p>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(playlist.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </SimpleCard>
  );
};

const RecentActivityTab = ({ profileData, dataStatus, verificationData }) => {
  const recentActivity = profileData?.recentActivity || { added: [], liked: [], removed: [] };
  
  const formatTimeAgo = (date) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Recently';
  };

  return (
    <SimpleCard>
      <CardHeader title="Recent Activity" dataStatus={dataStatus} verificationData={verificationData} />
      <CardContent>
        <div className="space-y-6">
          {/* Recently Liked */}
          <div>
            <h3 className="text-lg font-semibold text-cyan-400 mb-3">Recently Liked ({recentActivity.liked.length})</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {recentActivity.liked.slice(0, 10).map(track => (
                <div key={track.trackId} className="flex justify-between items-center py-1">
                  <div>
                    <p className="text-white text-sm">{track.name}</p>
                    <p className="text-gray-400 text-xs">{track.artists.join(', ')}</p>
                  </div>
                  <p className="text-gray-500 text-xs">{formatTimeAgo(track.date)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recently Added */}
          <div>
            <h3 className="text-lg font-semibold text-green-400 mb-3">Recently Added ({recentActivity.added.length})</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {recentActivity.added.slice(0, 10).map(track => (
                <div key={track.trackId} className="flex justify-between items-center py-1">
                  <div>
                    <p className="text-white text-sm">{track.name}</p>
                    <p className="text-gray-400 text-xs">{track.artists.join(', ')}</p>
                  </div>
                  <p className="text-gray-500 text-xs">{formatTimeAgo(track.date)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recently Removed */}
          {recentActivity.removed.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-red-400 mb-3">Recently Removed ({recentActivity.removed.length})</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {recentActivity.removed.slice(0, 10).map(track => (
                  <div key={track.trackId} className="flex justify-between items-center py-1">
                    <div>
                      <p className="text-white text-sm">{track.name}</p>
                      <p className="text-gray-400 text-xs">{track.artists.join(', ')}</p>
                    </div>
                    <p className="text-gray-500 text-xs">{formatTimeAgo(track.date)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </SimpleCard>
  );
};

// --- MAIN PAGE COMPONENT ---

const MusicTastePage = () => {
  const { data: session } = useSession();
  const [liveData, setLiveData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const updateUserTasteActivity = useCallback(async (live) => {
    if (live?.source === 'spotify_api') {
      try {
        await fetch('/api/user/update-taste-activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ artists: live.artists, tracks: live.tracks }),
        });
        const updatedProfile = await fetch('/api/user/taste-profile').then(res => res.json());
        setProfileData(updatedProfile);
      } catch (err) {
        console.error("Background activity update failed:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (session) {
      setLoading(true);
      Promise.all([
        fetch('/api/spotify/user-taste').then(res => res.json()),
        fetch('/api/user/taste-profile').then(res => res.json())
      ]).then(([live, profile]) => {
        setLiveData(live);
        setProfileData(profile);
        updateUserTasteActivity(live);
      }).catch(err => setError(err.message)).finally(() => setLoading(false));
    }
  }, [session, updateUserTasteActivity]);

  if (loading) return <AppLayout><div className="text-center py-10">Loading Your Music DNA...</div></AppLayout>;
  if (error) return <AppLayout><div className="text-center py-10 text-red-500">{error.toString()}</div></AppLayout>;

  const dataStatus = liveData?.source === 'spotify_api' ? 'Real Data' : 'Demo Data';
  const verificationData = { source: liveData?.source, timestamp: liveData?.timestamp };

  return (
    <AppLayout>
      <div className={styles.mainContent}>
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-4 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-medium ${activeTab === 'overview' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-2 font-medium ${activeTab === 'activity' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}
            >
              Recent Activity
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            <div className={styles.informationalRow}>
              <div className={styles.leftColumn}><TopArtistsCard liveData={liveData} dataStatus={dataStatus} verificationData={verificationData} /></div>
              <div className={styles.rightColumn}><TopGenresCard liveData={liveData} dataStatus={dataStatus} verificationData={verificationData} /></div>
            </div>
            <div className={styles.informationalRow}>
              <div className={styles.leftColumn}><TopTracksCard liveData={liveData} profileData={profileData} dataStatus={dataStatus} verificationData={verificationData} /></div>
              <div className={styles.rightColumn}><GenreDeepDiveCard liveData={liveData} dataStatus={dataStatus} verificationData={verificationData} /></div>
            </div>
            <div className={styles.informationalRow}>
              <div className={styles.leftColumn}><TotalPlaylistsCard profileData={profileData} dataStatus={dataStatus} verificationData={verificationData} /></div>
              <div className={styles.rightColumn}><TasteEvolutionTab profileData={profileData} dataStatus={dataStatus} verificationData={verificationData} /></div>
            </div>
          </>
        )}

        {activeTab === 'activity' && (
          <div className={styles.fullWidthRow}>
            <RecentActivityTab profileData={profileData} dataStatus={dataStatus} verificationData={verificationData} />
          </div>
        )}
      </div>
    </AppLayout>
  );
};

MusicTastePage.auth = { requiredAuth: true };
export default MusicTastePage;

