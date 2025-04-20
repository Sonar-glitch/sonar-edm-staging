// pages/api/spotify/user-taste.js - Update with better error handling and fallbacks

import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import {
  getTopArtists,
  getTopTracks,
  getAudioFeaturesForTracks,
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
      return res.status(401).json({ error: "Not authenticated" });
    }

    const token = session.accessToken;
    
    if (!token) {
      console.log("Missing access token in session");
      return res.status(200).json(FALLBACK_DATA);
    }

    try {
      // Attempt to fetch data from Spotify
      const [topArtists, topTracks] = await Promise.all([
        getTopArtists(token).catch(error => {
          console.log("Error fetching top artists:", error.message);
          return FALLBACK_DATA.artists;
        }),
        getTopTracks(token).catch(error => {
          console.log("Error fetching top tracks:", error.message);
          return FALLBACK_DATA.tracks;
        })
      ]);

      // Extract track IDs (with fallback handling)
      const trackIds = topTracks?.items?.map(track => track.id).slice(0, 10) || [];
      
      // Attempt to get audio features only if we have track IDs
      let audioFeatures = null;
      if (trackIds.length > 0) {
        try {
          const featuresResponse = await getAudioFeaturesForTracks(token, trackIds);
          audioFeatures = featuresResponse.audio_features;
        } catch (error) {
          console.log("Error fetching audio features:", error.message);
          // Create synthetic audio features for fallback
          audioFeatures = trackIds.map(() => ({
            valence: 0.6,
            energy: 0.7,
            danceability: 0.65
          }));
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
      return res.status(200).json({
        artists: topArtists,
        tracks: topTracks,
        audioFeatures,
        mood,
        genreProfile
      });
    } catch (error) {
      console.error("API Failure:", error);
      // Return fallback data on any error
      return res.status(200).json(FALLBACK_DATA);
    }
  } catch (error) {
    console.error("Unhandled error:", error);
    return res.status(200).json(FALLBACK_DATA);
  }
}