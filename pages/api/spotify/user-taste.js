import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import {
  getTopArtists,
  getTopTracks,
  getAudioFeaturesForTracks,
} from "@/lib/spotify";
import { detectSeasonalMood } from "@/lib/moodUtils";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.accessToken) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const token = session.accessToken;

  try {
    const [topArtists, topTracks] = await Promise.all([
      getTopArtists(token),
      getTopTracks(token),
    ]);

    const trackIds = topTracks?.items?.map((track) => track.id).filter(Boolean);

    let audioFeatures = [];
    if (trackIds.length > 0) {
      audioFeatures = await getAudioFeaturesForTracks(token, trackIds);
    }

    const mood = detectSeasonalMood(audioFeatures);

    return res.status(200).json({
      artists: topArtists,
      tracks: topTracks,
      audioFeatures,
      mood,
    });
  } catch (error) {
    console.error("API Failure:", error);
    return res.status(500).json({
      error: "Failed to fetch music taste data",
      details: error.message,
    });
  }
}
