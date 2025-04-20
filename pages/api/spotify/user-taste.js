import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import {
  getTopArtists,
  getTopTracks,
  getAudioFeaturesForTracks,
  getRecentlyPlayed
} from "@/lib/spotify";
import { getTopGenres, getSeasonalMood } from "@/lib/moodUtils";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const token = session.accessToken;

  try {
    // Fetch multiple time ranges for more comprehensive analysis
    const [
      shortTermArtists,
      mediumTermArtists,
      shortTermTracks,
      mediumTermTracks,
      recentlyPlayed
    ] = await Promise.all([
      getTopArtists(token, 'short_term', 20),
      getTopArtists(token, 'medium_term', 20),
      getTopTracks(token, 'short_term', 20),
      getTopTracks(token, 'medium_term', 20),
      getRecentlyPlayed(token, 30)
    ]);

    // Process track audio features
    const shortTermTrackIds = shortTermTracks?.items?.map(track => track.id) || [];
    const mediumTermTrackIds = mediumTermTracks?.items?.map(track => track.id) || [];
    const recentTrackIds = recentlyPlayed?.items?.map(item => item.track.id) || [];
    
    // Deduplicate track IDs
    const uniqueTrackIds = [...new Set([...shortTermTrackIds, ...mediumTermTrackIds, ...recentTrackIds])].slice(0, 50);
    
    // Split IDs into chunks of 20 (Spotify API limit)
    const trackIdChunks = [];
    for (let i = 0; i < uniqueTrackIds.length; i += 20) {
      trackIdChunks.push(uniqueTrackIds.slice(i, i + 20));
    }
    
    // Fetch audio features for all track chunks
    const audioFeaturePromises = trackIdChunks.map(chunk => 
      getAudioFeaturesForTracks(token, chunk)
    );
    
    const audioFeaturesResults = await Promise.all(audioFeaturePromises);
    
    // Combine all audio features
    const allAudioFeatures = audioFeaturesResults.flatMap(result => 
      result.audio_features.filter(item => item !== null)
    );

    // Generate genre profiles from artists data
    const shortTermGenres = getTopGenres(shortTermArtists?.items);
    const mediumTermGenres = getTopGenres(mediumTermArtists?.items);
    
    // Calculate seasonal mood from audio features
    const seasonalMood = getSeasonalMood(allAudioFeatures);
    
    // Calculate average audio features for data visualization
    const averageFeatures = calculateAverageFeatures(allAudioFeatures);
    
    // Create time-based comparisons for trend analysis
    const trendAnalysis = analyzeTrends(shortTermGenres, mediumTermGenres);
    
    return res.status(200).json({
      currentGenreProfile: shortTermGenres,
      historicalGenreProfile: mediumTermGenres,
      genreTrends: trendAnalysis,
      mood: seasonalMood,
      audioFeatures: allAudioFeatures,
      averageFeatures,
      topArtists: shortTermArtists?.items?.slice(0, 10) || [],
      topTracks: shortTermTracks?.items?.slice(0, 10) || [],
      recentActivity: processRecentActivity(recentlyPlayed)
    });
  } catch (error) {
    console.error("API Failure:", error);
    return res.status(500).json({ error: "Failed to fetch user taste", details: error.message });
  }
}

// Helper function to calculate average audio features
function calculateAverageFeatures(features) {
  if (!features || features.length === 0) return {};
  
  const sum = features.reduce((acc, feature) => {
    Object.keys(feature).forEach(key => {
      // Only process numerical features
      if (typeof feature[key] === 'number') {
        acc[key] = (acc[key] || 0) + feature[key];
      }
    });
    return acc;
  }, {});
  
  const result = {};
  Object.keys(sum).forEach(key => {
    result[key] = sum[key] / features.length;
  });
  
  return result;
}

// Helper function to analyze genre trends
function analyzeTrends(currentGenres, historicalGenres) {
  const trends = {};
  
  Object.keys(currentGenres).forEach(genre => {
    const currentValue = currentGenres[genre];
    const historicalValue = historicalGenres[genre] || 0;
    const change = currentValue - historicalValue;
    
    trends[genre] = {
      current: currentValue,
      historical: historicalValue,
      change,
      status: change > 5 ? 'rising' : (change < -5 ? 'falling' : 'stable')
    };
  });
  
  // Also identify genres that are disappearing
  Object.keys(historicalGenres).forEach(genre => {
    if (!trends[genre] && historicalGenres[genre] > 10) {
      trends[genre] = {
        current: 0,
        historical: historicalGenres[genre],
        change: -historicalGenres[genre],
        status: 'disappearing'
      };
    }
  });
  
  return trends;
}

// Helper function to process recent activity
function processRecentActivity(recentlyPlayed) {
  if (!recentlyPlayed || !recentlyPlayed.items) return [];
  
  // Process listening times to identify patterns
  const items = recentlyPlayed.items.map(item => {
    const playedAt = new Date(item.played_at);
    return {
      track: {
        id: item.track.id,
        name: item.track.name,
        artists: item.track.artists.map(artist => ({
          id: artist.id,
          name: artist.name
        }))
      },
      played_at: item.played_at,
      hour: playedAt.getHours(),
      day: playedAt.getDay()
    };
  });
  
  // Count by hour to identify listening peak times
  const hourCounts = items.reduce((acc, item) => {
    acc[item.hour] = (acc[item.hour] || 0) + 1;
    return acc;
  }, {});
  
  // Find peak listening hour
  let peakHour = 0;
  let peakCount = 0;
  Object.entries(hourCounts).forEach(([hour, count]) => {
    if (count > peakCount) {
      peakHour = parseInt(hour);
      peakCount = count;
    }
  });
  
  return {
    items: items.slice(0, 10),
    peakHour,
    peakCount,
    totalCount: items.length
  };
}