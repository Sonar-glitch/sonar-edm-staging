import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AppLayout from '../components/AppLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Treemap } from 'recharts';
import styles from '../styles/EnhancedPersonalizedDashboard.module.css';

// --- (Card and other helper components remain the same) ---
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
const CardContent = ({ children }) => <div className="p-6 relative">{children}</div>; // Added relative positioning for tooltip

// --- (Main Page Component and other charts remain the same) ---
const MusicTastePage = () => {
  const { data: session } = useSession();
  const [liveData, setLiveData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session) {
      Promise.all([
        fetch('/api/spotify/user-taste').then(res => res.json()),
        fetch('/api/user/taste-profile').then(res => res.json())
      ]).then(([live, profile]) => {
        setLiveData(live);
        setProfileData(profile);
        if (live.source === 'spotify_api') {
          fetch('/api/user/update-taste-activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ artists: live.artists, tracks: live.tracks }),
          });
        }
      }).catch(err => setError(err.message)).finally(() => setLoading(false));
    }
  }, [session]);

  if (loading) return <AppLayout><div className="text-center py-10">Loading...</div></AppLayout>;
  if (error) return <AppLayout><div className="text-center py-10 text-red-500">{error}</div></AppLayout>;

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
          <div className={styles.leftColumn}><TopTracksCard liveData={liveData} dataStatus={dataStatus} verificationData={verificationData} /></div>
          <div className={styles.rightColumn}><GenreDeepDiveCard liveData={liveData} dataStatus={dataStatus} verificationData={verificationData} /></div>
        </div>
        <div className={styles.fullWidthRow}><TasteEvolutionTab profileData={profileData} dataStatus={dataStatus} verificationData={verificationData} /></div>
      </div>
    </AppLayout>
  );
};

// --- (Other chart components like TasteEvolutionTab, TopArtistsCard, etc. are unchanged) ---
const TasteEvolutionTab = ({ profileData, dataStatus, verificationData }) => {
    const evolutionData = (profileData?.tasteEvolution || []).map(entry => ({
        date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ...(entry.genres || {})
    }));
    const allGenres = [...new Set((profileData?.tasteEvolution || []).flatMap(e => Object.keys(e.genres || {})))];
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F'];

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
                        {allGenres.slice(0, 5).map((genre, i) => (
                            <Line key={genre} type="monotone" dataKey={genre} stroke={colors[i % colors.length]} name={genre.replace(/\b\w/g, l => l.toUpperCase())} />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </SimpleCard>
    );
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

const TopTracksCard = ({ liveData, dataStatus, verificationData }) => (
    <SimpleCard>
        <CardHeader title="Your Top Tracks (Last 4 Weeks)" dataStatus={dataStatus} verificationData={verificationData} />
        <CardContent>
            <ul className="space-y-3">
                {(liveData?.tracks?.items || []).slice(0, 5).map((track, i) => (
                    <li key={track.id} className="text-gray-300">
                        {i + 1}. {track.name} - <span className="text-gray-500">{(track.artists || []).map(a => a.name).join(', ')}</span>
                    </li>
                ))}
            </ul>
        </CardContent>
    </SimpleCard>
);

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


// --- DEFINITIVE FIX FOR GENRE DEEP DIVE ---

const GenreDeepDiveCard = ({ liveData, dataStatus, verificationData }) => {
    const [tooltip, setTooltip] = useState(null);

    const genreData = (liveData?.artists?.items || []).flatMap(artist => artist.genres).reduce((acc, genre) => {
        acc[genre] = (acc[genre] || 0) + 1;
        return acc;
    }, {});
    const treeData = Object.entries(genreData).map(([name, size]) => ({ name, size }));
    const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <SimpleCard>
            <CardHeader title="Genre Deep Dive" dataStatus={dataStatus} verificationData={verificationData} />
            <CardContent>
                {tooltip && (
                    <div style={{
                        position: 'absolute',
                        top: tooltip.y,
                        left: tooltip.x,
                        background: 'rgba(0, 0, 0, 0.8)',
                        border: '1px solid #fff',
                        color: '#fff',
                        padding: '5px 10px',
                        borderRadius: '5px',
                        pointerEvents: 'none',
                        transform: 'translate(10px, -100%)',
                        zIndex: 1000,
                    }}>
                        {tooltip.name} ({tooltip.size})
                    </div>
                )}
                <ResponsiveContainer width="100%" height={300}>
                    <Treemap
                        data={treeData}
                        dataKey="size"
                        ratio={4 / 3}
                        stroke="#fff"
                        fill="#8884d8"
                        content={<CustomizedContent colors={colors} setTooltip={setTooltip} />}
                        onMouseLeave={() => setTooltip(null)}
                    />
                </ResponsiveContainer>
            </CardContent>
        </SimpleCard>
    );
};

const CustomizedContent = React.memo(({ root, depth, x, y, width, height, index, name, colors, setTooltip, size }) => {
    const handleMouseMove = (event) => {
        setTooltip({ x: event.clientX, y: event.clientY, name, size });
    };

    return (
        <g onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>
            <rect x={x} y={y} width={width} height={height} style={{ fill: colors[index % colors.length], stroke: '#fff', strokeWidth: 2 }} />
            {width > 80 && height > 25 && (
                <text x={x + width / 2} y={y + height / 2 + 7} textAnchor="middle" fill="#fff" fontSize={14} style={{ pointerEvents: 'none' }}>
                    {name}
                </text>
            )}
        </g>
    );
});

MusicTastePage.auth = { requiredAuth: true };
export default MusicTastePage;
