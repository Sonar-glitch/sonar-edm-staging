// /c/sonar/users/sonar-edm-user/pages/api/spotify/detailed-taste.js
import { getSession } from 'next-auth/react';
import { getTopArtists, getTopTracks, getRecentlyPlayed } from '../../../lib/spotify';
import { connectToDatabase } from '../../../lib/mongodb';
import { getFallbackDetailedTasteData } from '../../../lib/fallbackData';

export default async function handler(req, res) {
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    // Get user data from Spotify API
    const [topArtistsResponse, topTracksResponse, recentlyPlayedResponse] = await Promise.allSettled([
      getTopArtists(session),
      getTopTracks(session),
      getRecentlyPlayed(session)
    ]);
    
    // Process top artists
    let artistProfile = [];
    if (topArtistsResponse.status === 'fulfilled' && topArtistsResponse.value?.items) {
      artistProfile = topArtistsResponse.value.items.slice(0, 5).map(artist => ({
        name: artist.name,
        plays: Math.floor(Math.random() * 10) + 10, // Placeholder for play count
        genre: artist.genres?.[0] || 'Electronic'
      }));
    }
    
    // Process top tracks
    let topTracks = [];
    if (topTracksResponse.status === 'fulfilled' && topTracksResponse.value?.items) {
      topTracks = topTracksResponse.value.items.slice(0, 5).map(track => ({
        name: track.name,
        artist: track.artists[0]?.name || 'Unknown Artist',
        plays: Math.floor(Math.random() * 10) + 10 // Placeholder for play count
      }));
    }
    
    // Get user's genre profile from database
    const { db } = await connectToDatabase();
    const userProfile = await db.collection('users').findOne({ email: session.user.email });
    
    // Extract genre profile or use fallback
    let genreProfile = {};
    if (userProfile && userProfile.genreProfile) {
      genreProfile = userProfile.genreProfile;
    } else {
      // Generate genre profile from top artists if available
      if (topArtistsResponse.status === 'fulfilled' && topArtistsResponse.value?.items) {
        const genres = topArtistsResponse.value.items.flatMap(artist => artist.genres || []);
        const genreCounts = genres.reduce((acc, genre) => {
          acc[genre] = (acc[genre] || 0) + 1;
          return acc;
        }, {});
        
        // Normalize to 0-100 scale
        const maxCount = Math.max(...Object.values(genreCounts));
        Object.keys(genreCounts).forEach(genre => {
          genreProfile[genre] = Math.round((genreCounts[genre] / maxCount) * 100);
        });
      } else {
        // Use fallback data
        genreProfile = getFallbackDetailedTasteData().genreProfile;
      }
    }
    
    // Generate mood profile based on audio features
    // In a real implementation, this would analyze audio features from the Spotify API
    const mood = {
      energetic: Math.floor(Math.random() * 30) + 60,
      melodic: Math.floor(Math.random() * 20) + 70,
      dark: Math.floor(Math.random() * 40) + 40,
      euphoric: Math.floor(Math.random() * 30) + 60,
      deep: Math.floor(Math.random() * 30) + 50
    };
    
    // Generate seasonal profile
    const seasonalProfile = {
      spring: ['Progressive House', 'Melodic House'],
      summer: ['Tech House', 'House'],
      fall: ['Organic House', 'Downtempo'],
      winter: ['Deep House', 'Ambient Techno']
    };
    
    // Generate listening trends
    const listeningTrends = [
      { month: 'Jan', house: 65, techno: 50, trance: 30 },
      { month: 'Feb', house: 70, techno: 60, trance: 35 },
      { month: 'Mar', house: 75, techno: 65, trance: 40 },
      { month: 'Apr', house: 72, techno: 70, trance: 45 },
      { month: 'May', house: 70, techno: 68, trance: 50 },
      { month: 'Jun', house: 65, techno: 72, trance: 48 }
    ];
    
    // Return the complete detailed taste profile
    res.status(200).json({
      genreProfile,
      artistProfile,
      topTracks,
      mood,
      seasonalProfile,
      listeningTrends
    });
    
  } catch (error) {
    console.error('Error fetching detailed taste:', error);
    res.status(500).json({ error: 'Failed to fetch detailed taste data' });
  }
}
