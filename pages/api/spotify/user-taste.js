import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { getTopArtists, getTopTracks } from "@/lib/spotify";

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

    return res.status(200).json({ artists: topArtists, tracks: topTracks });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch user taste", details: error.message });
  }
}