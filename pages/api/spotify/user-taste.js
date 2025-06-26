// pages/api/spotify/user-taste.js - Fixed version with improved token handling

import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import {
  getTopArtists,
  getTopTracks,
  getAudioFeaturesForTracks,
  refreshAccessToken
} from "@/lib/spotify";
import { getTopGenres, getSeasonalMood } from "@/lib/moodUtils";

// Fallback data for when Spotify API is unavailable
const FALLBACK_DATA = {
  artists: {
    items: [
      {
        id: "fallback-artist-1",
        name: "Boris Brejcha",
        genres: ["melodic techno", "minimal techno"],
        images: [{ url: "/placeholder-artist.jpg" }]
      },
      {
        id: "fallback-artist-2",
        name: "Mathame",
        genres: ["tech house", "melodic house"],
        images: [{ url: "/placeholder-artist.jpg" }]
      }
    ]
  },
  tracks: {
    items: [
      {
        id: "fallback-track-1",
        name: "Realm of Consciousness",
        artists: [{ name: "Boris Brejcha" }]
      }
    ]
  },
  mood: "Late-Night Melodic Wave",
  genreProfile: {
    "Melodic Techno": 75,
    "Progressive House": 60, 
    "Dark Techno": 45,
    "Organic Grooves": 55
  }
};

export default async function handler(req, res) {
  try {
    // Get session and token
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      console.log("No session found, returning 401");
      return res.status(401).json({ error: "Not authenticated" });
    }

    let token = session.accessToken;
    
    if (!token) {
      console.log("Missing access token in session");
      return res.status(401).json({ error: "No access token available" });
    }

    // Check if token is expired and refresh if needed
    if (session.expires && new Date(session.expires) < new Date()) {
      console.log("Token expired, attempting to refresh...");
      try {
        const refreshedSession = await refreshAccessToken(session);
        if (refreshedSession && refreshedSession.accessToken) {
          token = refreshedSession.accessToken;
          console.log("Token refreshed successfully");
        } else {
          console.log("Token refresh failed");
          return res.status(401).json({ error: "Authentication expired" });
        }
      } catch (refreshError) {
        console.error("Error refreshing token:", refreshError);
        return res.status(401).json({ error: "Authentication refresh failed" });
      }
    }

    try {
      // Attempt to fetch data from Spotify
      console.log("Fetching data from Spotify API...");
      const [topArtists, topTracks] = await Promise.all([
        getTopArtists(token),
        getTopTracks(token)
      ]);

      // Extract track IDs
      const trackIds = topTracks?.items?.map(track => track.id).slice(0, 10) || [];
      
      // Attempt to get audio features only if we have track IDs
      let audioFeatures = null;
      if (trackIds.length > 0) {
        try {
          const featuresResponse = await getAudioFeaturesForTracks(token, trackIds);
          audioFeatures = featuresResponse.audio_features;
        } catch (error) {
          console.log("Error fetching audio features:", error.message);
          // Continue without audio features
        }
      }

      // Generate genre profile from artists data
      const genreProfile = topArtists?.items?.length > 0 
        ? getTopGenres(topArtists.items)
        : FALLBACK_DATA.genreProfile;

      // Determine mood from audio features
      const mood = audioFeatures
        ? getSeasonalMood(audioFeatures)
        : FALLBACK_DATA.mood;

      // Return the complete data
      console.log("Successfully fetched user taste data from Spotify");
      return res.status(200).json({
        artists: topArtists,
        tracks: topTracks,
        audioFeatures,
        mood,
        genreProfile,
  source: 'spotify_api'
      });
    } catch (error) {
      console.error("Spotify API Failure:", error);
      
      // Check for specific error types
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 401) {
          console.log("Authentication error with Spotify API");
          return res.status(401).json({ error: "Spotify authentication failed" });
        }
      }
      
      // For other errors, return fallback data with 200 status
      console.log("Using fallback data due to API error");
      return res.status(200).json(FALLBACK_DATA);
    }
  } catch (error) {
    console.error("Unhandled error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
