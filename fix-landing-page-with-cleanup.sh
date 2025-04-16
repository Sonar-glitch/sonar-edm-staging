#!/bin/bash

# Sonar EDM Platform - Landing Page, Flow Fix, and Cleanup Script

# Set the project root directory
cd /c/sonar/users/sonar-edm-user

# Create proper .gitignore if it doesn't exist
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

# Thorough cleanup of temporary files
echo "Cleaning up temporary files..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .vercel
rm -rf out
rm -rf build
find . -name "*.log" -type f -delete
find . -name ".DS_Store" -type f -delete

# Create backup directory
BACKUP_DIR="./backups-$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR/pages"
mkdir -p "$BACKUP_DIR/pages/api/auth"

echo "Created backup directory at $BACKUP_DIR"

# Backup existing files
echo "Backing up existing files..."
cp "./pages/index.js" "$BACKUP_DIR/pages/"
cp "./pages/api/auth/[...nextauth].js" "$BACKUP_DIR/pages/api/auth/"

# Update the landing page to use the "Unlock Your Sonic DNA" design
echo "Updating landing page..."
cat > "./pages/index.js" << 'EOF'
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Redirect to music taste page if already logged in
  useEffect(() => {
    if (session) {
      router.push('/users/music-taste');
    }
  }, [session, router]);

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.heroSection}>
          <h1 className={styles.title}>
            Unlock Your <span className={styles.highlight}>Sonic DNA</span>
          </h1>
          
          <p className={styles.description}>
            Connect your Spotify and discover events that perfectly match your
            unique music taste. No more wasted nights at venues that don't
            match your vibe.
          </p>
          
          <Link href="/api/auth/signin">
            <a className={styles.connectButton}>
              Connect with Spotify
            </a>
          </Link>
        </div>
        
        <section className={styles.howItWorks}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          
          <div className={styles.stepsContainer}>
            <div className={styles.stepCard}>
              <h3>Connect</h3>
              <p>Link your Spotify account to analyze your music preferences</p>
            </div>
            
            <div className={styles.stepCard}>
              <h3>Discover</h3>
              <p>Find events and venues that match your unique taste profile</p>
            </div>
            
            <div className={styles.stepCard}>
              <h3>Experience</h3>
              <p>Enjoy events knowing they're perfectly aligned with your preferences</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
EOF

# Update NextAuth configuration to redirect to Music Taste page after login
echo "Updating NextAuth configuration..."
if [ -f "./pages/api/auth/[...nextauth].js" ]; then
  # Check if redirect function exists and update it
  if grep -q "async redirect" "./pages/api/auth/[...nextauth].js"; then
    sed -i 's/async redirect({.*}/async redirect({ url, baseUrl }) {\n    \/\/ Force redirect to music-taste page after login\n    if (url.includes("callback") || url === baseUrl) {\n      return `${baseUrl}\/users\/music-taste`;\n    }\n    \n    \/\/ Original redirect logic for other cases\n    if (url.startsWith("\/")) return `${baseUrl}${url}`;\n    else if (new URL(url).origin === baseUrl) return url;\n    return baseUrl;\n  }/' "./pages/api/auth/[...nextauth].js"
  else
    # If redirect function doesn't exist, add it to callbacks
    if grep -q "callbacks:" "./pages/api/auth/[...nextauth].js"; then
      sed -i '/callbacks:/a \  async redirect({ url, baseUrl }) {\n    \/\/ Force redirect to music-taste page after login\n    if (url.includes("callback") || url === baseUrl) {\n      return `${baseUrl}\/users\/music-taste`;\n    }\n    \n    \/\/ Original redirect logic for other cases\n    if (url.startsWith("\/")) return `${baseUrl}${url}`;\n    else if (new URL(url).origin === baseUrl) return url;\n    return baseUrl;\n  },' "./pages/api/auth/[...nextauth].js"
    else
      echo "Could not find callbacks section in NextAuth config. Please update manually."
    fi
  fi
else
  echo "NextAuth configuration file not found. Please update manually."
fi

# Clean Git history (optional but helps with large repositories)
echo "Cleaning Git history..."
git gc --aggressive --prune=now

# Commit changes
echo "Committing changes..."
git add .
git commit -m "Fix landing page, authentication flow, and cleanup temporary files"

# Deploy to Heroku with clean push
echo "Deploying to Heroku with clean push..."
git push heroku main --force

echo "Landing page, authentication flow fix, and cleanup complete!"
echo "Your Heroku deployment should now be much cleaner and faster."
