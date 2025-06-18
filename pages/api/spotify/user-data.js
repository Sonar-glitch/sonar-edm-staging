import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Mock Spotify data
    const mockSpotifyData = {
      topGenres: [
        { name: 'house', popularity: 100 },
        { name: 'techno', popularity: 85 },
        { name: 'progressive house', popularity: 70 },
        { name: 'deep house', popularity: 65 },
        { name: 'tech house', popularity: 60 }
      ],
      topArtists: [
        { name: 'Deadmau5', genres: ['progressive house', 'electro house'] },
        { name: 'Eric Prydz', genres: ['progressive house', 'techno'] },
        { name: 'Charlotte de Witte', genres: ['techno'] },
        { name: 'Artbat', genres: ['melodic techno', 'deep house'] },
        { name: 'Boris Brejcha', genres: ['high-tech minimal', 'techno'] }
      ],
      audioFeatures: {
        energy: 0.75,
        danceability: 0.82,
        positivity: 0.65,
        acoustic: 0.15
      }
    };

    res.status(200).json(mockSpotifyData);
  } catch (error) {
    console.error('Error fetching Spotify data:', error);
    res.status(500).json({ message: 'Failed to fetch Spotify data', error: error.message });
  }
}
