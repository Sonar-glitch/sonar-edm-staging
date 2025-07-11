// pages/api/spotify/user-data.js - Refactored to remove audio features dependency

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getTopArtists } from '@/lib/spotify';
import { getTopGenres } from '@/lib/moodUtils';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.accessToken) {
      return res.status(401).json({ message: 'Unauthorized or missing token' });
    }

    const topArtists = await getTopArtists(session.accessToken);
    const genreProfile = getTopGenres(topArtists.items);

    const processedData = {
      source: 'spotify_api',
      timestamp: new Date().toISOString(),
      topGenres: Object.entries(genreProfile || {}).map(([name, popularity]) => ({
        name, popularity
      })).slice(0, 5),
      topArtists: (topArtists?.items || []).slice(0, 5).map(a => ({ name: a.name, genres: a.genres })),
      // audioFeatures property is completely removed
    };

    return res.status(200).json(processedData);

  } catch (error) {
    console.error('Error in /api/spotify/user-data:', error.message);
    return res.status(500).json({
      source: 'error',
      message: 'Failed to fetch Spotify user data.',
      error: error.message,
    });
  }
}
