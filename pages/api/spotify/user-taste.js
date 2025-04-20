import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { getTopArtists, getTopTrack } from '../../../lib/spotify';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  console.log("SESSION DATA:", session);

  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const token = session.accessToken;
  console.log("SPOTIFY TOKEN:", token);

  try {
    const [topArtists, topTracks] = await Promise.all([
      getTopArtists(token),
      getTopTracks(token),
    ]);

    console.log("ARTIST RESULT:", topArtists);
    console.log("TRACK RESULT:", topTracks);

    return res.status(200).json({ artists: topArtists, tracks: topTracks });
  } catch (error) {
    console.error("SPOTIFY API ERROR:", error);
    return res.status(500).json({ error: "Failed to fetch user taste", details: error.message });
  }
}
