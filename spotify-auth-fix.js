// Spotify Authentication Fix for User Dashboard
// This script creates and updates the necessary files for Spotify authentication

const fs = require('fs');
const path = require('path');

// Define the base directory for the user dashboard
const baseDir = process.argv[2] || '.';

// Create directories if they don't exist
const createDirIfNotExists = (dir) => {
  const fullPath = path.join(baseDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created directory: ${fullPath}`);
  }
};

// Create or update a file
const createOrUpdateFile = (filePath, content) => {
  const fullPath = path.join(baseDir, filePath);
  const dirName = path.dirname(fullPath);
  
  createDirIfNotExists(dirName);
  
  fs.writeFileSync(fullPath, content);
  console.log(`Created: ${fullPath}`);
};

// Create NextAuth API route
createOrUpdateFile('pages/api/auth/[...nextauth].js', `import NextAuth from 'next-auth';
import SpotifyProvider from 'next-auth/providers/spotify';

// Spotify scopes for API access
const scopes = [
  'user-read-email',
  'user-read-private',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-top-read',
  'user-read-recently-played'
].join(' ');

export default NextAuth({
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: { params: { scope: scopes } }
    }),
  ],
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
            ...profile,
            id: profile.id,
            email: profile.email,
            name: profile.display_name,
            image: profile.images?.[0]?.url
          }
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
      session.user = token.user;
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return \`\${baseUrl}\${url}\`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error'
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET
});
`);

// Create Sign In page
createOrUpdateFile('pages/auth/signin.js', `import { getProviders, signIn } from "next-auth/react";
import styles from '../../styles/SignIn.module.css';
import Image from 'next/image';
import Head from 'next/head';

export default function SignIn({ providers }) {
  return (
    <div className={styles.container}>
      <Head>
        <title>Sign In - Sonar EDM Platform</title>
      </Head>
      
      <div className={styles.logoContainer}>
        <h1 className={styles.logo}>SONAR</h1>
        <p className={styles.tagline}>Connect with your sound</p>
      </div>
      
      <div className={styles.authContainer}>
        <h2 className={styles.title}>Sign in to continue</h2>
        <p className={styles.description}>
          Connect your Spotify account to discover personalized EDM events and music recommendations.
        </p>
        
        {Object.values(providers).map((provider) => (
          <div key={provider.name} className={styles.providerContainer}>
            <button 
              onClick={() => signIn(provider.id, { callbackUrl: '/users/dashboard' })}
              className={styles.spotifyButton}
            >
              <svg className={styles.spotifyIcon} viewBox="0 0 24 24">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Sign in with {provider.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  const providers = await getProviders();
  return {
    props: { providers },
  };
}
`);

// Create Sign Out page
createOrUpdateFile('pages/auth/signout.js', `import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import styles from '../../styles/SignOut.module.css';
import Head from 'next/head';

export default function SignOut() {
  const [timeLeft, setTimeLeft] = useState(5);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      signOut({ callbackUrl: '/' });
    }, 5000);
    
    const interval = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Sign Out - Sonar EDM Platform</title>
      </Head>
      
      <div className={styles.content}>
        <h1 className={styles.title}>Signing you out...</h1>
        <p className={styles.message}>
          Thanks for using Sonar EDM Platform. You'll be redirected to the home page in {timeLeft} seconds.
        </p>
        <div className={styles.loader}></div>
      </div>
    </div>
  );
}
`);

// Create Error page
createOrUpdateFile('pages/auth/error.js', `import styles from '../../styles/Auth.module.css';
import Link from 'next/link';
import Head from 'next/head';

export default function Error({ error }) {
  return (
    <div className={styles.container}>
      <Head>
        <title>Authentication Error - Sonar EDM Platform</title>
      </Head>
      
      <div className={styles.errorContainer}>
        <h1 className={styles.title}>Authentication Error</h1>
        <div className={styles.errorMessage}>
          {error === "Configuration" && (
            <p>There is a problem with the server configuration. Please contact support.</p>
          )}
          {error === "AccessDenied" && (
            <p>You do not have permission to sign in.</p>
          )}
          {error === "Verification" && (
            <p>The verification link may have been used or has expired.</p>
          )}
          {!error && (
            <p>An unknown error occurred during authentication.</p>
          )}
        </div>
        <Link href="/">
          <a className={styles.button}>Return to Home</a>
        </Link>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const { error } = context.query;
  
  return {
    props: {
      error: error || null,
    },
  };
}
`);

// Create CSS files
createOrUpdateFile('styles/SignIn.module.css', `.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, var(--bg-primary) 0%, #15121E 100%);
  color: var(--text-primary);
}

.logoContainer {
  margin-bottom: 3rem;
  text-align: center;
}

.logo {
  font-family: 'Audiowide', sans-serif;
  font-size: 3.5rem;
  margin: 0;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tagline {
  font-size: 1.2rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
}

.authContainer {
  background: rgba(30, 30, 30, 0.5);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2.5rem;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.title {
  font-size: 1.8rem;
  margin-top: 0;
  margin-bottom: 1rem;
  text-align: center;
}

.description {
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.providerContainer {
  margin-top: 1.5rem;
}

.spotifyButton {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.8rem 1.5rem;
  background-color: #1DB954;
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.spotifyButton:hover {
  background-color: #1ED760;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(29, 185, 84, 0.3);
}

.spotifyIcon {
  width: 24px;
  height: 24px;
  margin-right: 10px;
  fill: white;
}

@media (max-width: 600px) {
  .authContainer {
    padding: 1.5rem;
  }
  
  .logo {
    font-size: 2.5rem;
  }
}
`);

createOrUpdateFile('styles/SignOut.module.css', `.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, var(--bg-primary) 0%, #15121E 100%);
  color: var(--text-primary);
}

.content {
  background: rgba(30, 30, 30, 0.5);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2.5rem;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.title {
  font-size: 1.8rem;
  margin-top: 0;
  margin-bottom: 1rem;
}

.message {
  color: var(--text-secondary);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.loader {
  display: inline-block;
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  border-top-color: var(--accent-primary);
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 600px) {
  .content {
    padding: 1.5rem;
  }
}
`);

createOrUpdateFile('styles/Auth.module.css', `.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, var(--bg-primary) 0%, #15121E 100%);
  color: var(--text-primary);
}

.errorContainer {
  background: rgba(30, 30, 30, 0.5);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2.5rem;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.title {
  font-size: 1.8rem;
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--accent-primary);
}

.errorMessage {
  color: var(--text-secondary);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.button {
  display: inline-block;
  padding: 0.8rem 1.5rem;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 42, 112, 0.3);
}

@media (max-width: 600px) {
  .errorContainer {
    padding: 1.5rem;
  }
}
`);

// Create or update the User Dashboard page
createOrUpdateFile('pages/users/dashboard.js', `import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import Head from 'next/head';
import styles from '../../styles/Dashboard.module.css';
import Link from 'next/link';

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (session?.accessToken) {
      // Fetch user profile from Spotify
      fetch('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: \`Bearer \${session.accessToken}\`
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }
        return response.json();
      })
      .then(data => {
        setUserProfile(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching user profile:', error);
        setLoading(false);
      });
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [session, status]);
  
  // If the user is not authenticated, show sign in button
  if (!session && !loading) {
    return (
      <div className={styles.container}>
        <Head>
          <title>User Dashboard - Sonar EDM Platform</title>
        </Head>
        
        <div className={styles.authPrompt}>
          <h1 className={styles.title}>Access Your EDM Experience</h1>
          <p className={styles.description}>
            Please sign in with your Spotify account to access your personalized dashboard.
          </p>
          <button 
            onClick={() => signIn('spotify')}
            className={styles.signInButton}
          >
            Sign in with Spotify
          </button>
        </div>
      </div>
    );
  }
  
  // Show loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Loading... - Sonar EDM Platform</title>
        </Head>
        
        <div className={styles.loadingContainer}>
          <div className={styles.loader}></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }
  
  // Show dashboard when authenticated
  return (
    <div className={styles.container}>
      <Head>
        <title>User Dashboard - Sonar EDM Platform</title>
      </Head>
      
      <header className={styles.header}>
        <div className={styles.logo}>SONAR</div>
        <nav className={styles.nav}>
          <Link href="/"><a className={styles.navLink}>Home</a></Link>
          <Link href="/users/dashboard"><a className={styles.navLink}>Dashboard</a></Link>
          <Link href="/auth/signout"><a className={styles.navLink}>Sign Out</a></Link>
        </nav>
        {userProfile && (
          <div className={styles.profile}>
            {userProfile.images && userProfile.images[0] && (
              <img 
                src={userProfile.images[0].url} 
                alt={userProfile.display_name} 
                className={styles.avatar}
              />
            )}
            <span className={styles.username}>{userProfile.display_name}</span>
          </div>
        )}
      </header>
      
      <main className={styles.main}>
        <section className={styles.welcomeSection}>
          <h1 className={styles.welcomeTitle}>
            Welcome, {userProfile?.display_name || 'Music Fan'}!
          </h1>
          <p className={styles.welcomeText}>
            Your personalized EDM experience awaits. Discover events that match your music taste.
          </p>
        </section>
        
        <div className={styles.dashboardGrid}>
          <section className={styles.dashboardCard}>
            <h2 className={styles.cardTitle}>Your Sonic DNA</h2>
            <p className={styles.cardDescription}>
              Take our interactive Vibe Quiz to discover your unique Sonic DNA and get personalized event recommendations.
            </p>
            <div className={styles.cardAction}>
              <button className={styles.actionButton}>Start Vibe Quiz</button>
            </div>
          </section>
          
          <section className={styles.dashboardCard}>
            <h2 className={styles.cardTitle}>Upcoming Events</h2>
            <p className={styles.cardDescription}>
              Explore EDM events that match your music taste with Spotify preview integration.
            </p>
            <div className={styles.cardAction}>
              <button className={styles.actionButton}>Explore Events</button>
            </div>
          </section>
          
          <section className={styles.dashboardCard}>
            <h2 className={styles.cardTitle}>Subgenre Visualization</h2>
            <p className={styles.cardDescription}>
              See your music preferences visualized across EDM subgenres with dynamic soundwave bars.
            </p>
            <div className={styles.cardAction}>
              <button className={styles.actionButton}>View Visualization</button>
            </div>
          </section>
          
          <section className={styles.dashboardCard}>
            <h2 className={styles.cardTitle}>Underground Map</h2>
            <p className={styles.cardDescription}>
              Discover venues and events on our interactive map filtered by your vibe preferences.
            </p>
            <div className={styles.cardAction}>
              <button className={styles.actionButton}>Open Map</button>
            </div>
          </section>
        </div>
      </main>
      
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Sonar EDM Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
`);

// Create Dashboard CSS
createOrUpdateFile('styles/Dashboard.module.css', `.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background-color: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  z-index: 10;
}

.logo {
  font-family: 'Audiowide', sans-serif;
  font-size: 1.8rem;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav {
  display: flex;
  gap: 1.5rem;
}

.navLink {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.3s ease;
}

.navLink:hover {
  color: var(--accent-primary);
}

.profile {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.username {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.main {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.welcomeSection {
  text-align: center;
  margin-bottom: 3rem;
}

.welcomeTitle {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcomeText {
  font-size: 1.2rem;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
}

.dashboardGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.dashboardCard {
  background: rgba(30, 30, 30, 0.5);
  backdrop-filter: blur(5px);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.dashboardCard:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.cardTitle {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: var(--accent-primary);
}

.cardDescription {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.cardAction {
  display: flex;
  justify-content: flex-end;
}

.actionButton {
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
  color: white;
  border: none;
  border-radius: 50px;
  padding: 0.6rem 1.2rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.actionButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 42, 112, 0.3);
}

.footer {
  padding: 1.5rem;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.9rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* Auth prompt styles */
.authPrompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  text-align: center;
  padding: 2rem;
}

.title {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.description {
  color: var(--text-secondary);
  margin-bottom: 2rem;
  max-width: 600px;
}

.signInButton {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.8rem 1.5rem;
  background-color: #1DB954;
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.signInButton:hover {
  background-color: #1ED760;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(29, 185, 84, 0.3);
}

/* Loading styles */
.loadingContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
}

.loader {
  display: inline-block;
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  border-top-color: var(--accent-primary);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .nav {
    width: 100%;
    justify-content: center;
  }
  
  .welcomeTitle {
    font-size: 2rem;
  }
  
  .dashboardGrid {
    grid-template-columns: 1fr;
  }
}
`);

// Update _app.js to include global styles and session provider
createOrUpdateFile('pages/_app.js', `import '../styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import Head from 'next/head';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Head>
        <title>Sonar EDM Platform</title>
        <meta name="description" content="Connect your music taste with the perfect events" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Audiowide&display=swap" rel="stylesheet" />
      </Head>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp;
`);

// Update globals.css to include CSS variables
createOrUpdateFile('styles/globals.css', `:root {
  /* Color scheme */
  --bg-primary: #121212;
  --bg-secondary: #1e1e1e;
  --text-primary: #ffffff;
  --text-secondary: #b3b3b3;
  --accent-primary: #ff2a70;
  --accent-secondary: #00f0ff;
  
  /* Font settings */
  --font-sans: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
}

html,
body {
  padding: 0;
  margin: 0;
  font-family: var(--font-sans);
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

a {
  color: inherit;
  text-decoration: none;
}

* {
  box-sizing: border-box;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--accent-primary);
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--accent-secondary);
}
`);

// Create a 404 page
createOrUpdateFile('pages/404.js', `import Link from 'next/link';
import styles from '../styles/Error.module.css';
import Head from 'next/head';

export default function Custom404() {
  return (
    <div className={styles.container}>
      <Head>
        <title>404 - Page Not Found</title>
      </Head>
      
      <div className={styles.content}>
        <h1 className={styles.title}>404</h1>
        <h2 className={styles.subtitle}>Page Not Found</h2>
        <p className={styles.description}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <a className={styles.button}>Return to Home</a>
        </Link>
      </div>
    </div>
  );
}
`);

// Create Error CSS
createOrUpdateFile('styles/Error.module.css', `.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, var(--bg-primary) 0%, #15121E 100%);
  color: var(--text-primary);
}

.content {
  text-align: center;
  max-width: 600px;
}

.title {
  font-size: 8rem;
  margin: 0;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}

.subtitle {
  font-size: 2rem;
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.description {
  color: var(--text-secondary);
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.button {
  display: inline-block;
  padding: 0.8rem 1.5rem;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 42, 112, 0.3);
}

@media (max-width: 600px) {
  .title {
    font-size: 5rem;
  }
  
  .subtitle {
    font-size: 1.5rem;
  }
}
`);

console.log('\n✨ Spotify authentication fix completed!');
console.log('\nNext steps:');
console.log('1. Commit the changes: git add . && git commit -m "Add Spotify authentication and user dashboard"');
console.log('2. Deploy to Heroku: git push heroku-user main:main');
console.log('3. Set the required environment variables:');
console.log('   - SPOTIFY_CLIENT_ID');
console.log('   - SPOTIFY_CLIENT_SECRET');
console.log('   - NEXTAUTH_URL');
console.log('   - NEXTAUTH_SECRET');
