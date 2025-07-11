// pages/api/spotify/user-taste.js - Refactored to remove audio features dependency

import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import {
  getTopArtists,
  getTopTracks,
  // getAudioFeaturesForTracks, // REMOVED
  refreshAccessToken
} from "@/lib/spotify";
import { getTopGenres, getSeasonalMood } from "@/lib/moodUtils";

const FALLBACK_DATA = {
  artists: { items: [] },
  tracks: { items: [] },
  mood: "Unavailable",
  genreProfile: {},
  source: 'fallback'
};

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    let token = session.accessToken;

    if (session.expires && new Date(session.expires) < new Date()) {
      const refreshedSession = await refreshAccessToken(session);
      if (refreshedSession && refreshedSession.accessToken) {
        token = refreshedSession.accessToken;
      } else {
        return res.status(401).json({ error: "Authentication expired" });
      }
    }

    const [topArtists, topTracks] = await Promise.all([
      getTopArtists(token),
      getTopTracks(token)
    ]);

    // Generate genre profile from artists data
    const genreProfile = topArtists?.items?.length > 0
      ? getTopGenres(topArtists.items)
      : {};

    // Mood calculation is no longer possible without audio features.
    // We can derive a simpler "vibe" from top genres later if needed.
    const mood = "Vibe (calculated from genres)";

    console.log("Successfully fetched user taste data from Spotify (no audio features)");
    return res.status(200).json({
      artists: topArtists,
      tracks: topTracks,
      // audioFeatures: null, // REMOVED
      mood,
      genreProfile,
      source: 'spotify_api'
    });

  } catch (error) {
    console.error("Error in user-taste API:", error.message);
    return res.status(200).json(FALLBACK_DATA); // Return safe fallback data on error
  }
}
