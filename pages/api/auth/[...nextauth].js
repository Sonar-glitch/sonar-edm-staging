import NextAuth from 'next-auth';
import SpotifyProvider from 'next-auth/providers/spotify';
import GoogleProvider from 'next-auth/providers/google';

// Environment variables should be set in Heroku
const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const secret = process.env.NEXTAUTH_SECRET;

export default NextAuth({
  providers: [
    SpotifyProvider({
      clientId: spotifyClientId,
      clientSecret: spotifyClientSecret,
      authorization: {
        params: {
          scope: 'user-read-email user-read-private user-top-read user-read-recently-played playlist-read-private playlist-read-collaborative'
        }
      }
    }),
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret
    })
  ],
  secret,
  callbacks: {
    async jwt({ token, account, profile }) {
      // Initial sign in
      if (account && profile) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at * 1000;
        token.profile = profile;
        token.provider = account.provider;
      }
      
      // Return previous token if the access token has not expired yet
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token;
      }
      
      // Access token has expired, try to refresh it
      if (token.provider === 'spotify' && token.refreshToken) {
        try {
          const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${Buffer.from(`${spotifyClientId}:${spotifyClientSecret}`).toString('base64')}`
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
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken
          };
        } catch (error) {
          console.error('Error refreshing access token', error);
          return { ...token, error: 'RefreshAccessTokenError' };
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      session.provider = token.provider;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    }
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  }
});
