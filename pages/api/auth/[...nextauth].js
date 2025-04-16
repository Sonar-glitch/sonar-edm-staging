import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

// Configure scopes for Spotify API
const scopes = [
  "user-read-email",
  "user-read-private",
  "user-top-read",
  "user-read-recently-played",
  "user-library-read",
  "playlist-read-private",
  "playlist-read-collaborative",
].join(",");

const params = {
  scope: scopes,
};

// Create query string from params
const queryParamString = new URLSearchParams(params).toString();

// Configure NextAuth
export default NextAuth({
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: `https://accounts.spotify.com/authorize?${queryParamString}`,
    }) ,
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          username: account.providerAccountId,
          accessTokenExpires: account.expires_at * 1000, // Convert to milliseconds
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Access token has expired, try to update it
      return token;
    },
    async session({ session, token }) {
      session.user.accessToken = token.accessToken;
      session.user.refreshToken = token.refreshToken;
      session.user.username = token.username;

      return session;
    },
    async redirect({ url, baseUrl }) {
      // Force redirect to music-taste page after login
      if (url.includes('callback') || url === baseUrl) {
        return `${baseUrl}/users/music-taste`;
      }
      
      // Original redirect logic for other cases
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
});
