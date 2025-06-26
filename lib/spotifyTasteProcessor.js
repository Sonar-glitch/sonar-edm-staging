// lib/spotifyTasteProcessor.js - Minimal processor using existing moodUtils
import { connectToDatabase } from './mongodb';
import { getTopArtists, getTopTracks, getAudioFeaturesForTracks } from './spotify';
import { getTopGenres, getSeasonalMood } from './moodUtils';

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function processAndSaveUserTaste(session) {
  try {
    const { db } = await connectToDatabase();
    const userEmail = session.user.email;
    
    // Check 24-hour cache first
    const cached = await db.collection('user_taste_profiles').findOne({
      userEmail,
      lastUpdated: { $gte: new Date(Date.now() - CACHE_TTL) }
    });
    
    if (cached) {
      console.log('✅ Using cached taste profile');
      return cached;
    }
    
    console.log('🔄 Fetching fresh Spotify data');
    
    // Fetch Spotify data (with simple retry)
    const [artistsResult, tracksResult] = await Promise.allSettled([
      getTopArtists(session.accessToken, 'medium_term', 20),
      getTopTracks(session.accessToken, 'medium_term', 20)
    ]);
    
    const artists = artistsResult.status === 'fulfilled' ? artistsResult.value : null;
    const tracks = tracksResult.status === 'fulfilled' ? tracksResult.value : null;
    
    // Get audio features
    let audioFeatures = null;
    if (tracks?.items) {
      const trackIds = tracks.items.map(t => t.id).filter(Boolean);
      if (trackIds.length > 0) {
        try {
          audioFeatures = await getAudioFeaturesForTracks(session.accessToken, trackIds);
        } catch (error) {
          console.log('⚠️ Audio features failed, continuing without');
        }
      }
    }
    
    // Process using existing moodUtils (PRESERVE EXISTING LOGIC)
    const genreProfile = artists?.items ? getTopGenres(artists.items) : {};
    const seasonalMood = audioFeatures ? getSeasonalMood(audioFeatures) : 'Melodic Afterglow';
    
    // Create profile
    const tasteProfile = {
      userEmail,
      genreProfile,
      seasonalMood,
      topArtists: artists?.items?.slice(0, 10).map(a => ({
        name: a.name,
        genres: a.genres,
        popularity: a.popularity
      })) || [],
      topTracks: tracks?.items?.slice(0, 10).map(t => ({
        name: t.name,
        artist: t.artists[0]?.name,
        popularity: t.popularity
      })) || [],
      audioFeatures: audioFeatures ? {
        energy: audioFeatures.reduce((sum, f) => sum + (f?.energy || 0), 0) / audioFeatures.length,
        valence: audioFeatures.reduce((sum, f) => sum + (f?.valence || 0), 0) / audioFeatures.length,
        danceability: audioFeatures.reduce((sum, f) => sum + (f?.danceability || 0), 0) / audioFeatures.length
      } : null,
      lastUpdated: new Date(),
      source: 'spotify_api'
    };
    
    // Save to database
    await db.collection('user_taste_profiles').replaceOne(
      { userEmail },
      tasteProfile,
      { upsert: true }
    );
    
    console.log('✅ Taste profile saved');
    return tasteProfile;
    
  } catch (error) {
    console.error('❌ Taste processing failed:', error);
    throw error;
  }
}
