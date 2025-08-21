import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mock Spotify data for now - replace with real Spotify API calls
    const spotifyData = {
      topGenres: [
        { name: 'house', weight: 0.85 },
        { name: 'techno', weight: 0.72 },
        { name: 'progressive house', weight: 0.68 },
        { name: 'deep house', weight: 0.61 },
        { name: 'trance', weight: 0.45 }
      ],
      audioFeatures: {
        energy: 0.75,
        danceability: 0.82,
        valence: 0.65,
        acousticness: 0.15,
        instrumentalness: 0.35,
        tempo: 128
      },
      topArtists: [
        { name: 'Deadmau5', genres: ['progressive house', 'electro house'] },
        { name: 'Carl Cox', genres: ['techno', 'house'] },
        { name: 'Above & Beyond', genres: ['trance', 'progressive trance'] }
      ]
    };

    res.status(200).json(spotifyData);
  } catch (error) {
    console.error('Error in /api/spotify/user-profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
