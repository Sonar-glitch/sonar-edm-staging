#!/bin/bash

# Sonar EDM Platform - Final Flow Implementation and Fixes

# Set the project root directory
cd /c/sonar/users/sonar-edm-user

# Create backup directory
BACKUP_DIR="./backups-$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR/pages/users"
mkdir -p "$BACKUP_DIR/pages/api/auth"
mkdir -p "$BACKUP_DIR/components"
mkdir -p "$BACKUP_DIR/styles"

echo "Created backup directory at $BACKUP_DIR"

# Backup existing files
echo "Backing up existing files..."
cp "./pages/users/dashboard.js" "$BACKUP_DIR/pages/users/"
cp "./pages/api/auth/[...nextauth].js" "$BACKUP_DIR/pages/api/auth/"
cp "./components/Navigation.js" "$BACKUP_DIR/components/"
cp "./styles/Home.module.css" "$BACKUP_DIR/styles/"

# 1. Fix NextAuth configuration
echo "Fixing NextAuth configuration..."
cat > "./pages/api/auth/[...nextauth].js" << 'EOF'
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
EOF

# 2. Update dashboard to redirect to music-taste
echo "Updating dashboard to redirect to music-taste..."
cat > "./pages/users/dashboard.js" << 'EOF'
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Redirect to music-taste page
    if (status !== 'loading') {
      router.replace('/users/music-taste');
    }
  }, [router, status]);

  // Show loading while redirecting
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#0f0f17',
      color: 'white'
    }}>
      <p>Redirecting to your Music Taste profile...</p>
    </div>
  );
}
EOF

# 3. Update Navigation to remove unnecessary pages
echo "Updating Navigation component..."
cat > "./components/Navigation.js" << 'EOF'
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from 'next-auth/react';
import styles from '../styles/Navigation.module.css';

export default function Navigation({ activePage }) {
  const router = useRouter();
  
  // Handle sign out
  const handleSignOut = async (e) => {
    e.preventDefault();
    await signOut({ redirect: false });
    router.push('/');
  };
  
  return (
    <nav className={styles.navigation}>
      <div className={styles.navContainer}>
        <div className={styles.logoContainer}>
          <Link href="/users/music-taste">
            <a className={styles.logo}>
              <span className={styles.logoText}>Sonar</span>
              <span className={styles.logoAccent}>EDM</span>
            </a>
          </Link>
        </div>
        
        <div className={styles.navLinks}>
          <Link href="/users/music-taste">
            <a className={`${styles.navLink} ${activePage === 'music-taste' ? styles.active : ''}`}>
              <span className={styles.navIcon}>🎵</span>
              <span className={styles.navText}>Music Taste</span>
            </a>
          </Link>
          
          <Link href="/users/events">
            <a className={`${styles.navLink} ${activePage === 'events' ? styles.active : ''}`}>
              <span className={styles.navIcon}>🎭</span>
              <span className={styles.navText}>Events</span>
            </a>
          </Link>
          
          <a href="#" onClick={handleSignOut} className={styles.navLink}>
            <span className={styles.navIcon}>🚪</span>
            <span className={styles.navText}>Sign Out</span>
          </a>
        </div>
        
        <div className={styles.userMenu}>
          <div className={styles.userAvatar}>
            <span>S</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
EOF

# 4. Fix Home.module.css for landing page
echo "Fixing Home.module.css for landing page..."
cat > "./styles/Home.module.css" << 'EOF'
.container {
  min-height: 100vh;
  background-color: #0f0f17;
  color: white;
}

.main {
  padding: 2rem 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.heroSection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 1rem;
  min-height: 60vh;
}

.title {
  font-size: 3.5rem;
  margin-bottom: 1.5rem;
  font-weight: 800;
  line-height: 1.2;
}

.highlight {
  background: linear-gradient(90deg, #ff6b8b, #5e72eb);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.description {
  font-size: 1.2rem;
  line-height: 1.6;
  max-width: 700px;
  margin-bottom: 2.5rem;
  color: rgba(255, 255, 255, 0.8);
}

.connectButton {
  background: linear-gradient(90deg, #32CD32, #228B22);
  color: white;
  font-weight: 600;
  padding: 0.8rem 2rem;
  border-radius: 50px;
  font-size: 1.1rem;
  text-decoration: none;
  transition: all 0.3s ease;
  display: inline-block;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.connectButton:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

.howItWorks {
  padding: 4rem 1rem;
  text-align: center;
}

.sectionTitle {
  font-size: 2.5rem;
  margin-bottom: 3rem;
  position: relative;
  display: inline-block;
  background: linear-gradient(90deg, #ff6b8b, #5e72eb);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.sectionTitle::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #ff6b8b, #5e72eb);
}

.stepsContainer {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.stepCard {
  background-color: rgba(30, 30, 40, 0.7);
  border-radius: 12px;
  padding: 2rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.stepCard:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.stepCard h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #5e72eb;
}

.stepCard p {
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .title {
    font-size: 2.5rem;
  }
  
  .description {
    font-size: 1rem;
  }
  
  .sectionTitle {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .title {
    font-size: 2rem;
  }
  
  .heroSection {
    padding: 2rem 1rem;
  }
  
  .connectButton {
    padding: 0.7rem 1.5rem;
    font-size: 1rem;
  }
}
EOF

# 5. Create .gitignore if it doesn't exist
echo "Creating proper .gitignore file..."
cat > .gitignore << 'EOF'
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env.local
.env.development.local
.env.test.local
.env.production.local

# vercel
.vercel
EOF

# 6. Clean up temporary files
echo "Cleaning up temporary files..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .vercel
rm -rf out
rm -rf build
find . -name "*.log" -type f -delete
find . -name ".DS_Store" -type f -delete

# 7. Clean Git history
echo "Cleaning Git history..."
git gc --aggressive --prune=now

# 8. Commit changes
echo "Committing changes..."
git add .
git commit -m "Final flow implementation and fixes"

# 9. Deploy to Heroku
echo "Deploying to Heroku..."
git push heroku main --force

echo "Final flow implementation and fixes complete!"
echo "Your Sonar EDM Platform should now have the optimized flow with:"
echo "- Music Taste page as first view after login"
echo "- Streamlined navigation with only Music Taste and Events"
echo "- Properly styled landing page"
echo "- Clean deployment without unnecessary files"
