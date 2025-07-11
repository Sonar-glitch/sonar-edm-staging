import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getTopArtists, getTopTracks, getAudioFeaturesForTracks } from '@/lib/spotify';
import { getTopGenres, getSeasonalMood } from '@/lib/moodUtils';

// This API endpoint now provides a simplified summary of the main user-taste endpoint.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.accessToken) {
      return res.status(401).json({ message: 'Unauthorized or missing token' });
    }

    // Fetch the primary taste data. This reuses the logic from user-taste.js for consistency.
    const [topArtists, topTracks] = await Promise.all([
      getTopArtists(session.accessToken),
      getTopTracks(session.accessToken)
    ]);

    const trackIds = topTracks?.items?.map(track => track.id).slice(0, 10) || [];
    let audioFeatures = null;
    if (trackIds.length > 0) {
        const featuresResponse = await getAudioFeaturesForTracks(session.accessToken, trackIds);
        audioFeatures = featuresResponse.audio_features;
    }

    const genreProfile = getTopGenres(topArtists.items);

    // Return a consistent, simplified data structure
    const processedData = {
      source: 'spotify_api',
      timestamp: new Date().toISOString(),
      topGenres: Object.entries(genreProfile || {}).map(([name, popularity]) => ({
        name, popularity
      })).slice(0, 5),
      topArtists: (topArtists?.items || []).slice(0, 5).map(a => ({ name: a.name, genres: a.genres })),
      audioFeatures: {
        energy: audioFeatures ? getSeasonalMood(audioFeatures).energy : 0.75,
        danceability: audioFeatures ? (audioFeatures.reduce((acc, t) => acc + t.danceability, 0) / audioFeatures.length) : 0.82,
      }
    };

    return res.status(200).json(processedData);

  } catch (error) {
    console.error('Error in /api/spotify/user-data:', error.message);
    // If any error occurs, return a structured error response
    return res.status(500).json({
      source: 'error',
      message: 'Failed to fetch Spotify user data.',
      error: error.message,
    });
  }
}
