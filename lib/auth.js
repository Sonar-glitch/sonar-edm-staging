/**
 * NextAuth configuration for Sonar EDM Platform
 * 
 * This module configures NextAuth.js authentication
 * using the centralized configuration system.
 */

const config = require('../config');
const SpotifyProvider = require('next-auth/providers/spotify');

// Spotify OAuth scopes for user authentication
const spotifyScopes = [
  'user-read-email',
  'user-read-private',
  'user-top-read',
  'user-read-recently-played',
  'playlist-read-private',
  'playlist-read-collaborative'
].join(' ');

/**
 * NextAuth configuration options
 */
const nextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: config.spotify.clientId,
      clientSecret: config.spotify.clientSecret,
      authorization: {
        params: { scope: spotifyScopes }
      }
    })
  ],
  secret: config.auth.secret,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Initial sign in
      if (account && profile) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at * 1000,
          user: {
            id: profile.id,
            name: profile.display_name,
            email: profile.email,
            image: profile.images?.[0]?.url
          }
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Access token has expired, try to refresh it
      // Note: In a production app, you would implement token refresh here
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.user = token.user;
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
};

module.exports = nextAuthOptions;
