// pages/api/spotify/user-taste.js - FINAL
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { getTopArtists, getTopTracks, refreshAccessToken } from "@/lib/spotify";
import { getTopGenres } from "@/lib/moodUtils";

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: "Not authenticated" });

    let token = session.accessToken;
    if (session.expires && new Date(session.expires) < new Date()) {
      const refreshedSession = await refreshAccessToken(session);
      token = refreshedSession?.accessToken;
      if (!token) return res.status(401).json({ error: "Authentication expired" });
    }

    const [topArtists, topTracks] = await Promise.all([getTopArtists(token), getTopTracks(token)]);
    const genreProfile = topArtists?.items?.length > 0 ? getTopGenres(topArtists.items) : {};

    return res.status(200).json({
      artists: topArtists,
      tracks: topTracks,
      mood: "Vibe (calculated from genres)",
      genreProfile,
      source: 'spotify_api',
      timestamp: new Date().toISOString(), // FIX: Add timestamp
    });
  } catch (error) {
    return res.status(200).json({ source: 'fallback', timestamp: new Date().toISOString() });
  }
}
