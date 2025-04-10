import NextAuth from 'next-auth';
import SpotifyProvider from 'next-auth/providers/spotify';
import config from '../../../config';

// Configure NextAuth with Spotify provider
export default NextAuth({
  providers: [
    SpotifyProvider({
      clientId: config.spotify.clientId,
      clientSecret: config.spotify.clientSecret,
      authorization: {
        params: {
          scope: 'user-read-email user-read-private user-top-read user-read-recently-played playlist-read-private playlist-read-collaborative'
        }
      }
    })
  ],
  secret: config.auth.secret,
  callbacks: {
    async jwt({ token, account, profile }) {
      // Initial sign in
      if (account && profile) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at * 1000;
        token.profile = profile;
      }
      
      // Return previous token if the access token has not expired yet
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token;
      }
      
      // Access token has expired, try to refresh it
      try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${config.spotify.clientId}:${config.spotify.clientSecret}`) .toString('base64')}`
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: token.refreshToken
          })
        });
        
        const refreshedTokens = await response.json();
        
        if (!response.ok) {
          throw refreshedTokens;
        }
        
        return {
          ...token,
          accessToken: refreshedTokens.access_token,
          accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
          // Fall back to old refresh token, but use new one if available
          refreshToken: refreshedTokens.refresh_token ?? token.refreshToken
        };
      } catch (error) {
        console.error('Error refreshing access token', error);
        return {
          ...token,
          error: 'RefreshAccessTokenError'
        };
      }
    },
    async session({ session, token }) {
      // Send properties to the client
      session.user = session.user || {};
      session.user.id = token.profile?.id;
      session.user.name = token.profile?.display_name;
      session.user.image = token.profile?.images?.[0]?.url;
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    signOut: '/'
  },
  debug: process.env.NODE_ENV === 'development'
});
