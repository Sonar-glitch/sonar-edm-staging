import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import {
  getTopArtists,
  getTopTracks,
  getAudioFeaturesForTracks,
} from "@/lib/spotify";
import { detectSeasonalMood } from "@/lib/moodUtils";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const token = session.accessToken;

  try {
    const [topArtists, topTracks] = await Promise.all([
      getTopArtists(token),
      getTopTracks(token),
    ]);

    const trackIds = topTracks?.items?.map((track) => track.id).slice(0, 10);
    const audioFeatures = trackIds?.length
      ? await getAudioFeaturesForTracks(token, trackIds)
      : null;

    const seasonalMood = audioFeatures
      ? detectSeasonalMood(audioFeatures.audio_features)
      : "Unknown Mood";

    return res.status(200).json({
      artists: topArtists,
      tracks: topTracks,
      mood: seasonalMood,
    });
  } catch (error) {
    console.error("API Failure:", error);
    return res.status(500).json({ error: "Failed to fetch user taste" });
  }
}
