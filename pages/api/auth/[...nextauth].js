// pages/api/auth/[...nextauth].js
// SURGICAL FIX: Only changed import syntax to resolve SpotifyProvider function issue
const NextAuth = require("next-auth").default;
const SpotifyProvider = require("next-auth/providers/spotify").default;

export const authOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "user-read-email user-top-read user-read-recently-played user-read-private user-library-read"
        }
      },
     
    })
  ],
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true // Always true for HTTPS
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    },
    state: {
      name: `next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
        maxAge: 900 // 15 minutes
      }
    }
  },
  // Extended session duration for better user experience
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Initial sign in
      if (account && profile) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.profile = profile;
      }
      
      // Return the token if it's still valid
      if (Date.now() < token.expiresAt * 1000) {
        return token;
      }
      
      // Token has expired, try to refresh it
      try {
        const response = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(
              `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
            ).toString("base64")}`,
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: token.refreshToken,
          }),
        });

        const data = await response.json();

        if (!response.ok) throw data;

        return {
          ...token,
          accessToken: data.access_token,
          expiresAt: Math.floor(Date.now() / 1000 + data.expires_in),
          refreshToken: data.refresh_token ?? token.refreshToken,
        };
      } catch (error) {
        console.error("Error refreshing access token", error);
        // Clear token on error to force re-authentication
        return { 
          ...token, 
          error: "RefreshAccessTokenError",
          accessToken: null 
        };
      }
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      
      // Add user profile data to session if available
      if (token.profile) {
        session.user = {
          ...session.user,
          id: token.profile.id,
          name: token.profile.display_name,
          email: token.profile.email,
          image: token.profile.images?.[0]?.url
        };
      }
      
      // 🎵 Add taste collection status to session
      try {
        const { checkTasteRefreshNeeded } = require('../../../lib/firstLoginTasteCollector');
        session.needsTasteRefresh = await checkTasteRefreshNeeded(session.user?.email);
      } catch (error) {
        console.error('Error checking taste refresh status:', error);
        session.needsTasteRefresh = false;
      }
      
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to dashboard after login
      return `${baseUrl}/dashboard`;
    }
  },
  pages: {
    signIn: "/",
    error: "/auth/error" // Updated to a dedicated error page
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  // Important for Heroku deployment

  // Add event handlers for better debugging and monitoring
  events: {
    async signIn(message) {
      console.log("User signed in:", message.user.email);
      
      // 🎵 TRIGGER FIRST LOGIN TASTE COLLECTION
      try {
        const { triggerFirstLoginTasteCollection, isUserFirstLogin, checkTasteRefreshNeeded } = require('../../../lib/firstLoginTasteCollector');
        
        const isFirst = await isUserFirstLogin(message.user.email);
        const needsRefresh = await checkTasteRefreshNeeded(message.user.email);
        
        if (isFirst || needsRefresh) {
          console.log(`🚀 Triggering taste collection for ${message.user.email} - First login: ${isFirst}, Needs refresh: ${needsRefresh}`);
          
          // Queue immediate taste collection (non-blocking)
          triggerFirstLoginTasteCollection(message.user, message.account, {
            priority: isFirst ? 'highest' : 'high',
            reason: isFirst ? 'first_login' : '24h_refresh'
          }).catch(error => {
            console.error('❌ Taste collection failed:', error);
          });
        } else {
          console.log(`✅ User ${message.user.email} has fresh taste data`);
        }
        
      } catch (error) {
        console.error('❌ Error checking/triggering taste collection:', error);
      }
    },
    async signOut(message) {
      console.log("User signed out");
    },
    async error(message) {
      console.error("Authentication error:", message);
    }
  }
};

export default NextAuth(authOptions);

