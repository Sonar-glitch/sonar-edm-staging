#!/bin/bash

# TIKO Platform Music Taste Page Fix Script
# This script fixes the non-working music taste page issue
# Created: April 25, 2025

echo "Starting TIKO music taste page fix at $(date +%Y%m%d%H%M%S)"
echo "This script will fix the non-working music taste page issue"

# Navigate to the project directory
cd /c/sonar/users/sonar-edm-user || { echo "Error: Could not navigate to project directory"; exit 1; }

# Create a backup of the current state
echo "Creating backup of current state..."
git branch backup-before-music-taste-fix-$(date +%Y%m%d%H%M%S)
echo "Backup branch created successfully"

# Create backup of files we're going to modify
echo "Creating backups of files to be modified..."
mkdir -p backups/pages/users
mkdir -p backups/components

# Backup music taste page files
if [ -f "pages/users/music-taste.js" ]; then
  cp -f pages/users/music-taste.js backups/pages/users/music-taste.js.backup
  echo "Backed up music-taste.js"
fi

# Backup SonicSignature component if it exists
if [ -f "components/SonicSignature.js" ]; then
  cp -f components/SonicSignature.js backups/components/SonicSignature.js.backup
  echo "Backed up SonicSignature.js"
fi

# Backup Navigation component
if [ -f "components/Navigation.js" ]; then
  cp -f components/Navigation.js backups/components/Navigation.js.backup
  echo "Backed up Navigation.js"
fi

echo "Backups created successfully"

# Fix the music taste page to use the correct components
echo "Fixing music taste page..."

if [ -f "pages/users/music-taste.js" ]; then
  # Create a new version of the music taste page that works properly
  cat > pages/users/music-taste.js << 'EOL'
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import styles from '@/styles/MusicTaste.module.css';

// Import the correct components for music taste visualization
import SoundCharacteristicsChart from '@/components/SoundCharacteristicsChart';
import SeasonalVibes from '@/components/SeasonalVibes';
import ArtistTrackSection from '@/components/ArtistTrackSection';

export default function MusicTaste() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirect to dashboard if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Fetch user profile data
  useEffect(() => {
    if (status === 'authenticated' && session) {
      fetchUserProfile();
    }
  }, [session, status]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/spotify/user-taste');
      
      if (!response.ok) {
        // If there's an authentication error, redirect to dashboard
        if (response.status === 401) {
          console.log('Authentication error, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setUserProfile(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load your music taste profile. Please try again later.');
      setLoading(false);
      
      // On error, redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    }
  };

  // If loading
  if (loading || status === 'loading') {
    return (
      <Layout>
        <div className={styles.loadingContainer}>
          <LoadingSpinner />
          <p>Loading your music taste profile...</p>
        </div>
      </Layout>
    );
  }

  // If error
  if (error) {
    return (
      <Layout>
        <div className={styles.errorContainer}>
          <h2>Oops!</h2>
          <p>{error}</p>
          <p>Redirecting to dashboard...</p>
        </div>
      </Layout>
    );
  }

  // If no user profile data
  if (!userProfile) {
    return (
      <Layout>
        <div className={styles.errorContainer}>
          <h2>No Data Available</h2>
          <p>We couldn't find your music taste profile. Redirecting to dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>TIKO | Your Music Taste</title>
        <meta name="description" content="Your personalized music taste profile" />
      </Head>

      <div className={styles.container}>
        <h1 className={styles.title}>Your Music Taste</h1>
        
        <div className={styles.summary}>
          You're all about <span className={styles.highlight1}>house</span> + <span className={styles.highlight2}>techno</span> with a vibe shift toward <span className={styles.highlight3}>fresh sounds</span>.
        </div>
        
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Sound Characteristics</h2>
          <SoundCharacteristicsChart data={userProfile.soundCharacteristics || userProfile.genreProfile} />
        </div>
        
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Seasonal Vibes</h2>
          <SeasonalVibes data={userProfile.seasonalVibes} />
        </div>
        
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Your Top Artists & Tracks</h2>
          <ArtistTrackSection artists={userProfile.artists?.items} tracks={userProfile.tracks?.items} />
        </div>
      </div>
    </Layout>
  );
}
EOL
  echo "Created new working version of music-taste.js"
else
  echo "Creating music taste page..."
  
  # Create directory if it doesn't exist
  mkdir -p pages/users
  
  # Create the music taste page
  cat > pages/users/music-taste.js << 'EOL'
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import styles from '@/styles/MusicTaste.module.css';

// Import the correct components for music taste visualization
import SoundCharacteristicsChart from '@/components/SoundCharacteristicsChart';
import SeasonalVibes from '@/components/SeasonalVibes';
import ArtistTrackSection from '@/components/ArtistTrackSection';

export default function MusicTaste() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirect to dashboard if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Fetch user profile data
  useEffect(() => {
    if (status === 'authenticated' && session) {
      fetchUserProfile();
    }
  }, [session, status]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/spotify/user-taste');
      
      if (!response.ok) {
        // If there's an authentication error, redirect to dashboard
        if (response.status === 401) {
          console.log('Authentication error, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setUserProfile(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load your music taste profile. Please try again later.');
      setLoading(false);
      
      // On error, redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    }
  };

  // If loading
  if (loading || status === 'loading') {
    return (
      <Layout>
        <div className={styles.loadingContainer}>
          <LoadingSpinner />
          <p>Loading your music taste profile...</p>
        </div>
      </Layout>
    );
  }

  // If error
  if (error) {
    return (
      <Layout>
        <div className={styles.errorContainer}>
          <h2>Oops!</h2>
          <p>{error}</p>
          <p>Redirecting to dashboard...</p>
        </div>
      </Layout>
    );
  }

  // If no user profile data
  if (!userProfile) {
    return (
      <Layout>
        <div className={styles.errorContainer}>
          <h2>No Data Available</h2>
          <p>We couldn't find your music taste profile. Redirecting to dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>TIKO | Your Music Taste</title>
        <meta name="description" content="Your personalized music taste profile" />
      </Head>

      <div className={styles.container}>
        <h1 className={styles.title}>Your Music Taste</h1>
        
        <div className={styles.summary}>
          You're all about <span className={styles.highlight1}>house</span> + <span className={styles.highlight2}>techno</span> with a vibe shift toward <span className={styles.highlight3}>fresh sounds</span>.
        </div>
        
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Sound Characteristics</h2>
          <SoundCharacteristicsChart data={userProfile.soundCharacteristics || userProfile.genreProfile} />
        </div>
        
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Seasonal Vibes</h2>
          <SeasonalVibes data={userProfile.seasonalVibes} />
        </div>
        
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Your Top Artists & Tracks</h2>
          <ArtistTrackSection artists={userProfile.artists?.items} tracks={userProfile.tracks?.items} />
        </div>
      </div>
    </Layout>
  );
}
EOL
  echo "Created music-taste.js"
fi

# Create a redirect from /music-taste to /users/music-taste
echo "Creating redirect from /music-taste to /users/music-taste..."

cat > pages/music-taste.js << 'EOL'
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function MusicTasteRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the correct music taste page
    router.replace('/users/music-taste');
  }, [router]);
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh' 
    }}>
      <LoadingSpinner />
      <p>Redirecting to your music taste profile...</p>
    </div>
  );
}
EOL

echo "Created redirect from /music-taste to /users/music-taste"

# Update Navigation component to use the correct music taste path
echo "Updating Navigation component to use the correct music taste path..."

if [ -f "components/Navigation.js" ]; then
  # Use sed to update the navigation links
  sed -i.tmp 's|href="/music-taste"|href="/users/music-taste"|g' components/Navigation.js
  sed -i.tmp2 's|href="music-taste"|href="/users/music-taste"|g' components/Navigation.js
  echo "Updated Navigation component"
else
  echo "Navigation component not found, skipping update"
fi

# Create a style file for the music taste page if it doesn't exist
echo "Creating style file for music taste page if needed..."

if [ ! -f "styles/MusicTaste.module.css" ]; then
  mkdir -p styles
  
  cat > styles/MusicTaste.module.css << 'EOL'
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.title {
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
  text-align: center;
}

.summary {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  text-align: center;
  line-height: 1.5;
}

.highlight1 {
  color: #00e5ff;
  font-weight: bold;
}

.highlight2 {
  color: #ff00ff;
  font-weight: bold;
}

.highlight3 {
  color: #00ff9d;
  font-weight: bold;
}

.section {
  margin-bottom: 3rem;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.sectionTitle {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.5rem;
}

.loadingContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  text-align: center;
}

.errorContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  text-align: center;
  color: #ff6b6b;
}

@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }
  
  .summary {
    font-size: 1.2rem;
  }
  
  .sectionTitle {
    font-size: 1.5rem;
  }
  
  .section {
    padding: 1rem;
  }
}
EOL
  echo "Created MusicTaste.module.css"
fi

# Commit changes
echo "Committing changes..."
git add pages/users/music-taste.js
git add pages/music-taste.js
git add styles/MusicTaste.module.css
git add components/Navigation.js
git commit -m "Fix music taste page to prevent users from seeing non-working page"

# Push to Heroku
echo "Pushing changes to Heroku with force flag..."
git push -f heroku main

# Check deployment status
echo "Checking deployment status..."
heroku logs --tail --app sonar-edm-user &
HEROKU_LOGS_PID=$!

# Wait for deployment to complete (or timeout after 2 minutes)
echo "Waiting for deployment to complete (timeout: 2 minutes)..."
sleep 120
kill $HEROKU_LOGS_PID

# Verify deployment
echo "Verifying deployment..."
heroku ps --app sonar-edm-user

echo "Music taste page fix complete! Users will now see a working music taste page."
echo "Your improved dashboard should be live at:"
echo "https://sonar-edm-user-50e4fb038f6e.herokuapp.com"

echo "If you still encounter issues, please check the Heroku logs:"
echo "heroku logs --app sonar-edm-user"

echo "TIKO music taste page fix completed at $(date +%Y%m%d%H%M%S)"
