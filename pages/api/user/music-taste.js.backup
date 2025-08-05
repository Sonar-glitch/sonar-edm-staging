import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Treemap } from 'recharts';
import Layout from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

          if (!liveRes.ok) throw new Error(`Failed to fetch Spotify taste data: ${liveRes.statusText}`);
          if (!profileRes.ok) throw new Error(`Failed to fetch user profile: ${profileRes.statusText}`);

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
            }).catch(err => console.error("Background update failed:", err));
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white tracking-tight">Your Music DNA</h1>
          <p className="text-lg text-gray-400 mt-2">An evolving snapshot of your unique sound.</p>
        </header>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="evolution">Taste Evolution</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab liveData={liveData} />
          </TabsContent>
          <TabsContent value="evolution" className="mt-6">
            <TasteEvolutionTab profileData={profileData} />
          </TabsContent>
          <TabsContent value="activity" className="mt-6">
            <RecentActivityTab profileData={profileData} />
          </TabsContent>
          <TabsContent value="playlists" className="mt-6">
            <PlaylistsTab profileData={profileData} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

// --- TABS & CARDS (with new GenreDeepDiveCard) ---

const OverviewTab = ({ liveData }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <TopArtistsCard liveData={liveData} />
    <TopGenresCard liveData={liveData} />
    <TopTracksCard liveData={liveData} />
    <GenreDeepDiveCard liveData={liveData} />
  </div>
);

const TasteEvolutionTab = ({ profileData }) => {
    const evolutionData = (profileData?.tasteEvolution || []).map(entry => ({
        date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ...(entry.genres || {})
    }));
    const allGenres = [...new Set((profileData?.tasteEvolution || []).flatMap(e => Object.keys(e.genres || {})))];
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F'];

    return (
        <Card className="bg-gray-800 border-gray-700">
            <CardHeader><CardTitle className="text-white">Your Top 5 Genres Over Time</CardTitle></CardHeader>
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
        </Card>
    );
};

const RecentActivityTab = ({ profileData }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-gray-800 border-gray-700">
            <CardHeader><CardTitle className="text-white">Recently Added Tracks</CardTitle></CardHeader>
            <CardContent>
                <ul className="space-y-3">
                    {(profileData?.recentActivity?.added || []).slice(0, 5).map(track => (
                        <li key={track.trackId} className="text-gray-300 flex justify-between">
                            <span>{track.name} - <span className="text-gray-500">{(track.artists || []).join(', ')}</span></span>
                            <span className="text-xs text-gray-500">{new Date(track.date).toLocaleDateString()}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
            <CardHeader><CardTitle className="text-white">Recently Liked Tracks</CardTitle></CardHeader>
            <CardContent>
                <ul className="space-y-3">
                    {(profileData?.recentActivity?.liked || []).slice(0, 5).map(track => (
                        <li key={track.trackId} className="text-gray-300 flex justify-between">
                            <span>{track.name} - <span className="text-gray-500">{(track.artists || []).join(', ')}</span></span>
                             <span className="text-xs text-gray-500">{new Date(track.date).toLocaleDateString()}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    </div>
);

const PlaylistsTab = ({ profileData }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(profileData?.playlists || []).map(p => (
            <Card key={p.id} className="bg-gray-800 border-gray-700">
                <CardHeader><CardTitle className="text-white">{p.name}</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-gray-400">{p.characteristics}</p>
                    <div className="text-sm text-gray-500 mt-4">
                        <p>{p.trackCount} tracks</p>
                        <p>Last updated: {new Date(p.lastUpdated).toLocaleDateString()}</p>
                    </div>
                </CardContent>
            </Card>
        ))}
    </div>
);

const GenreDeepDiveCard = ({ liveData }) => {
    const genreData = (liveData?.artists?.items || []).flatMap(artist => artist.genres).reduce((acc, genre) => {
        acc[genre] = (acc[genre] || 0) + 1;
        return acc;
    }, {});

    const treeData = Object.entries(genreData).map(([name, size]) => ({ name, size }));

    return (
        <Card className="bg-gray-800 border-gray-700">
            <CardHeader><CardTitle className="text-white">Genre Deep Dive</CardTitle></CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <Treemap
                        data={treeData}
                        dataKey="size"
                        ratio={4 / 3}
                        stroke="#fff"
                        fill="#8884d8"
                        content={<CustomizedContent colors={['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F']}/>}
                    />
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

const CustomizedContent = ({ root, depth, x, y, width, height, index, payload, rank, name, colors }) => {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: colors[index % colors.length],
          stroke: '#fff',
          strokeWidth: 2 / (depth + 1e-10),
          strokeOpacity: 1 / (depth + 1e-10),
        }}
      />
      {width > 80 && height > 20 ? (
        <text x={x + width / 2} y={y + height / 2 + 7} textAnchor="middle" fill="#fff" fontSize={14}>
          {name}
        </text>
      ) : null}
    </g>
  );
};


const TopArtistsCard = ({ liveData }) => (
    <Card className="bg-gray-800 border-gray-700">
        <CardHeader><CardTitle className="text-white">Your Top Artists (Last 4 Weeks)</CardTitle></CardHeader>
        <CardContent>
            <ul className="space-y-4">
                {(liveData?.artists?.items || []).slice(0, 5).map((artist, i) => (
                    <li key={artist.id} className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex-shrink-0"></div>
                        <div className="flex-grow">
                            <p className="font-semibold text-white">{i + 1}. {artist.name}</p>
                            <p className="text-sm text-gray-400">{(artist.genres || []).slice(0, 2).join(', ')}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </CardContent>
    </Card>
);

const TopTracksCard = ({ liveData }) => (
    <Card className="bg-gray-800 border-gray-700">
        <CardHeader><CardTitle className="text-white">Your Top Tracks (Last 4 Weeks)</CardTitle></CardHeader>
        <CardContent>
            <ul className="space-y-3">
                {(liveData?.tracks?.items || []).slice(0, 5).map((track, i) => (
                    <li key={track.id} className="text-gray-300">
                        {i + 1}. {track.name} - <span className="text-gray-500">{(track.artists || []).map(a => a.name).join(', ')}</span>
                    </li>
                ))}
            </ul>
        </CardContent>
    </Card>
);

const TopGenresCard = ({ liveData }) => {
    const genreData = Object.entries(liveData?.genreProfile || {}).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    return (
        <Card className="bg-gray-800 border-gray-700">
            <CardHeader><CardTitle className="text-white">Your Top Genres</CardTitle></CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={genreData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                        <XAxis type="number" stroke="#A0AEC0" />
                        <YAxis type="category" dataKey="name" width={100} stroke="#A0AEC0" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#2D3748', border: '1px solid #4A5568' }} />
                        <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default MusicTastePage;
