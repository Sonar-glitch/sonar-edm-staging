import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { getTopArtistsWithGenres, getTopTracks, getAudioFeaturesForTracks } from "@/lib/spotify";
import { detectMoodFromAudio } from "@/lib/moodUtils";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Not authenticated" });

  const token = session.accessToken;
  try {
    const [artistData, trackData] = await Promise.all([
      getTopArtistsWithGenres(token),
      getTopTracks(token)
    ]);

    const trackIds = trackData.tracks.items.map(t => t.id).slice(0, 10);
    const audioData = await getAudioFeaturesForTracks(token, trackIds);
    const mood = detectMoodFromAudio(audioData.averages);

    return res.status(200).json({
      genreWeights: artistData.genreWeights,
      mood,
      topArtist: artistData.artists[0],
      topTrack: trackData.tracks.items[0]
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
