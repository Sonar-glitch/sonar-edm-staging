import { getServerSession } from "next-auth/next";
import { authOptions } from '../auth/[...nextauth]';
import { getTopArtists, getTopTracks, getAudioFeaturesForTracks } from "../../../lib/spotify";
import { getTopGenres, getSeasonalMood } from "../../../lib/moodUtils";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.accessToken) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const token = session.accessToken;

    const [artists, tracks] = await Promise.all([
      getTopArtists(token),
      getTopTracks(token),
    ]);

    const features = await getAudioFeaturesForTracks(token, tracks.map(t => t.id));
    const genreData = getTopGenres(artists);
    const mood = getSeasonalMood(features);

    res.status(200).json({
      artists,
      tracks,
      genreData,
      mood,
    });
  } catch (err) {
    console.error("API Failure:", err);
    res.status(500).json({ error: "Failed to fetch taste data", fallback: true });
  }
}
