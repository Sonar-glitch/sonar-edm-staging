
import { getSession } from "next-auth/react";
import axios from "axios";

export default async function handler(req, res) {
  const session = await getSession({ req });

  if (!session || !session.accessToken) {
    return res.status(401).json({ error: "Unauthorized: No valid session" });
  }

  try {
    const topArtists = await axios.get("https://api.spotify.com/v1/me/top/artists", {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    const topTracks = await axios.get("https://api.spotify.com/v1/me/top/tracks", {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    res.status(200).json({
      topArtists: topArtists.data.items,
      topTracks: topTracks.data.items,
    });
  } catch (error) {
    console.error("Spotify API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch music taste from Spotify." });
  }
}
