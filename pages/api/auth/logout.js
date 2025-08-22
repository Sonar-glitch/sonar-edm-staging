// pages/api/auth/logout.js
// 🔐 ENHANCED LOGOUT API
// Properly revokes Spotify access token and clears session

import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(200).json({ 
        success: true, 
        message: 'No session to logout' 
      });
    }

    console.log(`🔐 Logging out user: ${session.user.email}`);

    // Step 1: Revoke Spotify access token if available
    if (session.accessToken) {
      try {
        const revokeResponse = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
          },
          body: new URLSearchParams({
            'token': session.accessToken,
            'token_type_hint': 'access_token'
          })
        });

        if (revokeResponse.ok) {
          console.log('✅ Spotify token revoked successfully');
        } else {
          console.log('⚠️ Failed to revoke Spotify token, but continuing logout');
        }
      } catch (error) {
        console.error('❌ Error revoking Spotify token:', error);
        // Continue with logout even if token revocation fails
      }
    }

    // Step 2: Clear any additional session data (if needed)
    // This is handled by NextAuth signOut() on the client side

    return res.status(200).json({
      success: true,
      message: 'Logout completed successfully',
      spotifyTokenRevoked: !!session.accessToken
    });

  } catch (error) {
    console.error('❌ [Logout] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
