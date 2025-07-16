// pages/api/test-audio-features.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.accessToken) {
    return res.status(401).json({ error: "No access token" });
  }

  try {
    const response = await fetch(
      "https://api.spotify.com/v1/audio-features/4iV5W9uYEdYUVa79Axb7Rh",
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
     );

    const data = await response.json();
    
    res.json({
      status: response.status,
      hasAccess: response.status === 200,
      data: response.status === 200 ? data : null,
      error: response.status !== 200 ? data : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
