import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

/**
 * API endpoint to get preview URLs for tracks
 * This handles the case where preview_url might be null in initial track data
 */
export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const token = session.accessToken;
    
    if (!token) {
      return res.status(401).json({ error: "No valid token" });
    }

    // Get trackId from query parameters
    const { trackId } = req.query;

    if (!trackId) {
      return res.status(400).json({ error: "Track ID is required" });
    }

    // Fetch track data from Spotify
    const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ 
        error: "Failed to fetch track data", 
        details: errorData 
      });
    }

    const trackData = await response.json();
    
    return res.status(200).json({
      preview_url: trackData.preview_url,
      name: trackData.name,
      artists: trackData.artists,
      album: trackData.album
    });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ 
      error: "Failed to fetch track preview",
      message: error.message
    });
  }
}