import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Layout from '../components/Layout'; // CORRECTED: Path is now correct for a page
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Treemap } from 'recharts';
import styles from '../styles/EnhancedPersonalizedDashboard.module.css'; // CORRECTED: Path to styles

// A simple Card component to maintain visual consistency
const SimpleCard = ({ children, className }) => (
  <div className={`${styles.card} ${className || ''}`}>
    {children}
  </div>
);

const CardHeader = ({ children, title, dataStatus }) => (
    <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{title}</h2>
        <span className={styles.dataIndicator}>{dataStatus}</span>
    </div>
);

const CardContent = ({ children }) => <div className="p-6">{children}</div>;

// Helper to provide a default structure for profile data to prevent errors
const getEmptyProfile = () => ({
  tasteEvolution: [],
  recentActivity: { added: [], liked: [] },
  playlists: [],
});

// Main Component
const MusicTastePage = () => {
  const { data: session } = useSession();
  const [liveData, setLiveData] = useState(null);
  const [profileData, setProfileData] = useState(getEmptyProfile());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (session) {
        try {
          setLoading(true);
          setError(null);

          const [liveRes, profileRes] = await Promise.all([
            fetch('/api/spotify/user-taste'),
            fetch('/api/user/taste-profile')
          ]);

          if (!liveRes.ok) throw new Error(`Spotify API failed: ${liveRes.statusText}`);
          if (!profileRes.ok) throw new Error(`Profile API failed: ${profileRes.statusText}`);

          const liveJson = await liveRes.json();
          const profileJson = await profileRes.json();

          setLiveData(liveJson);
          setProfileData(profileJson || getEmptyProfile());

          if (liveJson && liveJson.source === 'spotify_api') {
            fetch('/api/user/update-taste-activity', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                artists: liveJson.artists,
                tracks: liveJson.tracks,
              }),
            }).catch(err => console.error("Background activity update failed:", err));
          }

        } catch (e) {
          setError(e.message);
          console.error(e);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [session]);

  if (loading) return <Layout><div className="text-center py-10">Loading your music DNA...</div></Layout>;
  if (error) return <Layout><div className="text-center py-10 text-red-500">Error: {error}</div></Layout>;
  if (!liveData) return <Layout><div className="text-center py-10">Could not load your music profile.</div></Layout>;

  const dataStatus = liveData.source === 'spotify_api' ? 'Real Data' : 'Demo Data';

  return (
    <Layout>
        <div className="container mx-auto px-4 py-8">
            <header className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white tracking-tight">Your Music DNA</h1>
              <p className="text-lg text-gray-400 mt-2">An evolving snapshot of your unique sound.</p>
            </header>
            <div className={styles.mainContent}>
                <div className={styles.informationalRow}>
                    <div className={styles.leftColumn}>
                        <TopArtistsCard liveData={liveData} dataStatus={dataStatus} />
                    </div>
                    <div className={styles.rightColumn}>
                        <TopGenresCard liveData={liveData} dataStatus={dataStatus} />
                    </div>
                </div>
                <div className={styles.informationalRow}>
                    <div className={styles.leftColumn}>
                        <TopTracksCard liveData={liveData} dataStatus={dataStatus} />
                    </div>
                    <div className={styles.rightColumn}>
                        <GenreDeepDiveCard liveData={liveData} dataStatus={dataStatus} />
                    </div>
                </div>
                <div className={styles.fullWidthRow}>
                     <TasteEvolutionTab profileData={profileData} dataStatus={dataStatus} />
                </div>
            </div>
        </div>
    </Layout>
  );
};

// --- NEW, FUNCTIONAL CARDS ---

const TasteEvolutionTab = ({ profileData, dataStatus }) => {
    const evolutionData = (profileData?.tasteEvolution || []).map(entry => ({
        date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ...(entry.genres || {})
    }));
    const allGenres = [...new Set((profileData?.tasteEvolution || []).flatMap(e => Object.keys(e.genres || {})))];
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F'];

    return (
        <SimpleCard>
            <CardHeader title="Your Top 5 Genres Over Time" dataStatus={dataStatus} />
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

const GenreDeepDiveCard = ({ liveData, dataStatus }) => {
    const genreData = (liveData?.artists?.items || []).flatMap(artist => artist.genres).reduce((acc, genre) => {
        acc[genre] = (acc[genre] || 0) + 1;
        return acc;
    }, {});
    const treeData = Object.entries(genreData).map(([name, size]) => ({ name, size }));
    const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <SimpleCard>
            <CardHeader title="Genre Deep Dive" dataStatus={dataStatus} />
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <Treemap
                        data={treeData}
                        dataKey="size"
                        ratio={4 / 3}
                        stroke="#fff"
                        fill="#8884d8"
                        content={<CustomizedContent colors={colors}/>}
                    />
                </ResponsiveContainer>
            </CardContent>
        </SimpleCard>
    );
};

const CustomizedContent = ({ root, depth, x, y, width, height, index, name, colors }) => (
    <g>
      <rect x={x} y={y} width={width} height={height} style={{ fill: colors[index % colors.length], stroke: '#fff', strokeWidth: 2, }} />
      {width > 70 && height > 20 && <text x={x + width / 2} y={y + height / 2 + 7} textAnchor="middle" fill="#fff" fontSize={14}>{name}</text>}
    </g>
);

const TopArtistsCard = ({ liveData, dataStatus }) => (
    <SimpleCard>
        <CardHeader title="Your Top Artists (Last 4 Weeks)" dataStatus={dataStatus} />
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

const TopTracksCard = ({ liveData, dataStatus }) => (
    <SimpleCard>
        <CardHeader title="Your Top Tracks (Last 4 Weeks)" dataStatus={dataStatus} />
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

const TopGenresCard = ({ liveData, dataStatus }) => {
    const genreData = Object.entries(liveData?.genreProfile || {}).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    return (
        <SimpleCard>
            <CardHeader title="Your Top Genres" dataStatus={dataStatus} />
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

export default MusicTastePage;
