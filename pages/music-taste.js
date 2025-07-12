// pages/music-taste.js - FINAL, DEFINITIVE FIX FOR COMPONENT HOISTING CRASH
import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import AppLayout from '../components/AppLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Treemap } from 'recharts';
import styles from '../styles/EnhancedPersonalizedDashboard.module.css';

// --- 1. ALL HELPER AND CHILD COMPONENTS ARE DEFINED FIRST ---

const SimpleCard = ({ children }) => <div className={styles.card}>{children}</div>;

const CardHeader = ({ title, dataStatus, verificationData }) => (
    <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{title}</h2>
        <div className="flex items-center space-x-2">
            <span className={styles.dataIndicator}>{dataStatus}</span>
            {dataStatus === 'Real Data' && verificationData?.timestamp && (
                <div className={styles.dataVerification}>
                    <span className={styles.verifyIcon}>✓</span>
                    <span className={styles.verifyText}>Verified</span>
                    <div className={styles.verificationDetails}>
                        <p>Source: {verificationData.source}</p>
                        <p>Fetched: {new Date(verificationData.timestamp).toLocaleString()}</p>
                    </div>
                </div>
            )}
        </div>
    </div>
);

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

const TopArtistsCard = ({ liveData, dataStatus, verificationData }) => (
    <SimpleCard>
        <CardHeader title="Your Top Artists (Last 4 Weeks)" dataStatus={dataStatus} verificationData={verificationData} />
        <CardContent>
            <ul className="space-y-4">
                {(liveData?.artists?.items || []).slice(0, 5).map((artist, i) => (
                    <li key={artist.id} className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex-shrink-0"></div>
                        <div>
                            <p className="font-semibold text-white">{i + 1}. {artist.name}</p>
                            <p className="text-sm text-gray-400">{(artist.genres || []).slice(0, 2).join(', ')}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </CardContent>
    </SimpleCard>
);

const TopTracksCard = ({ liveData, profileData, dataStatus, verificationData }) => {
    const oldTrackIds = new Map((profileData?.recentActivity?.liked || []).map((track, index) => [track.trackId, index]));
    const getChangeIndicator = (trackId, currentIndex) => {
        if (!oldTrackIds.has(trackId)) { return <span className="text-xs font-bold text-green-400 ml-2">🔥 New</span>; }
        const oldIndex = oldTrackIds.get(trackId);
        if (currentIndex < oldIndex) { return <span className="text-xs text-green-400 ml-2">🔼</span>; }
        return null;
    };
    return (
        <SimpleCard>
            <CardHeader title="Your Top Tracks (Last 4 Weeks)" dataStatus={dataStatus} verificationData={verificationData} />
            <CardContent>
                <ul className="space-y-3">
                    {(liveData?.tracks?.items || []).slice(0, 5).map((track, i) => (
                        <li key={track.id} className="flex items-center text-gray-300">
                            <span>{i + 1}. {track.name} - <span className="text-gray-500">{(track.artists || []).map(a => a.name).join(', ')}</span></span>
                            {getChangeIndicator(track.id, i)}
                        </li>
                    ))}
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


// --- 2. THE MAIN PAGE COMPONENT IS DEFINED LAST, AFTER ALL ITS CHILDREN ---

const MusicTastePage = () => {
  const { data: session } = useSession();
  const [liveData, setLiveData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        <div className={styles.informationalRow}>
          <div className={styles.leftColumn}><TopArtistsCard liveData={liveData} dataStatus={dataStatus} verificationData={verificationData} /></div>
          <div className={styles.rightColumn}><TopGenresCard liveData={liveData} dataStatus={dataStatus} verificationData={verificationData} /></div>
        </div>
        <div className={styles.informationalRow}>
          <div className={styles.leftColumn}><TopTracksCard liveData={liveData} profileData={profileData} dataStatus={dataStatus} verificationData={verificationData} /></div>
          <div className={styles.rightColumn}><GenreDeepDiveCard liveData={liveData} dataStatus={dataStatus} verificationData={verificationData} /></div>
        </div>
        <div className={styles.fullWidthRow}><TasteEvolutionTab profileData={profileData} dataStatus={dataStatus} verificationData={verificationData} /></div>
      </div>
    </AppLayout>
  );
};

MusicTastePage.auth = { requiredAuth: true };
export default MusicTastePage;
