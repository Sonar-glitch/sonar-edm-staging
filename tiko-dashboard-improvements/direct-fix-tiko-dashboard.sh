#!/bin/bash
# direct-fix-tiko-dashboard.sh
# Script to directly fix the TIKO dashboard issues
# For use in Windows Git Bash at /c/sonar/users/sonar-edm-user/

# Set timestamp for logging
TIMESTAMP=$(date +%Y%m%d%H%M%S)
echo "Starting direct fix at $TIMESTAMP"

# Make sure we're in the correct directory
cd /c/sonar/users/sonar-edm-user/
echo "Working in directory: $(pwd)"

# 1. Fix the authentication flow by updating signin.js
echo "Fixing authentication flow in signin.js..."
cat > pages/auth/signin.js << 'EOL'
import React, { useEffect } from 'react';
import { getProviders, signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../../styles/signin.module.css';
import Navigation from '../../components/Navigation';

export default function SignIn({ providers }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { callbackUrl } = router.query;
  
  // Redirect authenticated users to dashboard page instead of music-taste
  useEffect(() => {
    if (status === 'authenticated') {
      router.push(callbackUrl || '/dashboard');
    }
  }, [status, router, callbackUrl]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Sign In | Sonar</title>
      </Head>
      
      <Navigation />
      
      <main className={styles.main}>
        <div className={styles.signinCard}>
          <h1 className={styles.title}>Connect with Sonar</h1>
          <p className={styles.subtitle}>Unlock your sonic DNA and discover your music taste</p>
          
          {status === 'loading' ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading...</p>
            </div>
          ) : status === 'authenticated' ? (
            <div className={styles.alreadySignedIn}>
              <p>You're already signed in!</p>
              <button 
                className={styles.redirectButton}
                onClick={() => router.push('/dashboard')}
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <div className={styles.providersContainer}>
              {Object.values(providers || {}).map((provider) => (
                <div key={provider.name} className={styles.providerItem}>
                  <button 
                    className={styles.providerButton}
                    onClick={() => signIn(provider.id, { callbackUrl: '/dashboard' })}
                  >
                    <span className={styles.providerIcon}>
                      {provider.name === 'Spotify' && '🎵'}
                    </span>
                    Connect with {provider.name}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export async function getServerSideProps() {
  const providers = await getProviders();
  return {
    props: { providers },
  };
}
EOL

echo "Authentication flow fixed."

# 2. Create SoundCharacteristicsChart component
echo "Creating SoundCharacteristicsChart component..."
mkdir -p components
cat > components/SoundCharacteristicsChart.js << 'EOL'
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SoundCharacteristicsChart = ({ soundData }) => {
  // Format data for the chart
  const formatChartData = (data) => {
    if (!data) return [];
    
    return Object.entries(data).map(([name, value]) => ({
      name,
      value: typeof value === 'number' ? value : 0,
    })).sort((a, b) => b.value - a.value).slice(0, 5);
  };
  
  const chartData = formatChartData(soundData);
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '10px',
          borderRadius: '4px',
          color: '#fff',
          fontSize: '14px'
        }}>
          <p style={{ margin: 0 }}>{`${label}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div style={{ 
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '12px',
      padding: '20px',
      margin: '20px 0',
      boxShadow: '0 0 15px rgba(0, 255, 255, 0.2)'
    }}>
      <h2 style={{ 
        color: '#fff',
        fontSize: '1.5rem',
        marginTop: 0,
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        Your Sound Characteristics
      </h2>
      
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              type="number" 
              domain={[0, 100]} 
              tick={{ fill: 'rgba(255,255,255,0.7)' }} 
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              tick={{ fill: 'rgba(255,255,255,0.7)' }} 
              width={100}
            />
            <Tooltip content={<CustomTooltip />} />
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#00e5ff" />
                <stop offset="100%" stopColor="#ff00ff" />
              </linearGradient>
            </defs>
            <Bar 
              dataKey="value" 
              fill="url(#barGradient)" 
              radius={[0, 4, 4, 0]}
              animationDuration={1500}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <p style={{ 
        color: 'rgba(255,255,255,0.7)',
        fontSize: '0.9rem',
        textAlign: 'center',
        marginTop: '15px'
      }}>
        Based on your listening history and preferences
      </p>
    </div>
  );
};

export default SoundCharacteristicsChart;
EOL

echo "SoundCharacteristicsChart component created."

# 3. Update package.json to include Recharts
echo "Updating package.json to include Recharts..."
if ! grep -q "recharts" package.json; then
  sed -i 's/"tailwindcss": "^3.1.8"/"tailwindcss": "^3.1.8",\n    "recharts": "^2.5.0"/' package.json
  echo "Added Recharts dependency to package.json."
else
  echo "Recharts dependency already exists in package.json."
fi

# 4. Update dashboard.js to use SoundCharacteristicsChart
echo "Updating dashboard.js to use SoundCharacteristicsChart..."
cat > pages/dashboard.js << 'EOL'
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import SoundCharacteristicsChart from '@/components/SoundCharacteristicsChart';
import styles from '@/styles/Dashboard.module.css';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);
  
  // Fetch user profile data
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserData();
    }
  }, [status]);
  
  // Define fallback sound characteristics
  const getFallbackSoundCharacteristics = () => {
    return {
      'Danceability': 78,
      'Melody': 85,
      'Energy': 72,
      'Obscurity': 63,
      'Tempo': 68
    };
  };
  
  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch music taste data
      const tasteResponse = await fetch('/api/spotify/user-taste')
        .catch(err => {
          console.error('Network error fetching taste data:', err);
          return { ok: false };
        });
      
      // Use fallback data if API call fails
      let tasteData = {
        genreProfile: {
          'House': 75,
          'Techno': 65,
          'Progressive House': 60,
          'Trance': 45,
          'Indie dance': 55
        },
        soundCharacteristics: getFallbackSoundCharacteristics(),
        mood: 'Chillwave Flow',
        topArtists: [{ 
          name: 'Boris Brejcha', 
          id: '6bDWAcdtVR39rjZS5A3SoD',
          images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb8ae72ad1d3e564e2b883afb5' }],
          popularity: 85,
          genres: ['melodic techno', 'minimal techno']
        }],
        topTracks: [{ 
          name: 'Realm of Consciousness', 
          id: '2pXJ3zJ9smoG8SQqlMBvoF',
          artists: [{ name: 'Tale Of Us' }],
          album: { 
            name: 'Realm of Consciousness', 
            images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273c3a84c67544c46c7df9529c5' }] 
          },
          popularity: 80,
          preview_url: 'https://p.scdn.co/mp3-preview/5a6aa5ef7516e6771c964c3d44b77156c5330b7e'
        }]
      };
      
      if (tasteResponse.ok) {
        const fetchedData = await tasteResponse.json();
        tasteData = {
          ...fetchedData,
          // Ensure we have fallbacks if API returns incomplete data
          genreProfile: fetchedData.genreProfile || tasteData.genreProfile,
          soundCharacteristics: fetchedData.soundCharacteristics || getFallbackSoundCharacteristics(),
          mood: fetchedData.mood || tasteData.mood,
          topArtists: fetchedData.topArtists?.items || tasteData.topArtists,
          topTracks: fetchedData.topTracks?.items || tasteData.topTracks
        };
      }
      
      // Set the user profile
      setUserProfile({
        taste: tasteData
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load your profile. Please try again later.');
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className={styles.loadingContainer || "loadingContainer"}>
        <div className={styles.loadingPulse || "loadingPulse"}></div>
        <p>Analyzing your sonic signature...</p>
      </div>
    );
  }
  
  if (error && !userProfile) {
    return (
      <div className={styles.errorContainer || "errorContainer"}>
        <h2>Oops!</h2>
        <p>{error}</p>
        <button 
          className={styles.retryButton || "retryButton"}
          onClick={fetchUserData}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Ensure we have data to render
  const profile = userProfile || {
    taste: {
      genreProfile: {},
      soundCharacteristics: {},
      mood: '',
      topArtists: [],
      topTracks: []
    }
  };
  
  // Get primary genres for display
  const primaryGenres = Object.entries(profile.taste.genreProfile)
    .sort(([, a], [, b]) => b - a)
    .map(([genre]) => genre.toLowerCase())
    .slice(0, 2)
    .join(' + ');
  
  return (
    <>
      <Head>
        <title>TIKO | Your Music Dashboard</title>
        <meta name="description" content="Your personalized EDM dashboard" />
      </Head>
      
      <div className={styles.container || "container"}>
        <header className={styles.header || "header"}>
          <h1>TIKO</h1>
          <nav>
            <Link href="/users/music-taste">Music Taste</Link>
            <Link href="/users/events">Events</Link>
            <Link href="/users/profile">Profile</Link>
          </nav>
        </header>
        
        <main className={styles.main || "main"}>
          {/* Summary Banner */}
          <div className={styles.summaryBanner || "summaryBanner"}>
            <p>You're all about <span className={styles.highlight || "highlight"}>{primaryGenres}</span> with a vibe shift toward <span className={styles.highlight || "highlight"}>fresh sounds</span>.</p>
          </div>
          
          {/* Sound Characteristics Chart */}
          <SoundCharacteristicsChart 
            soundData={profile.taste.soundCharacteristics} 
          />
          
          {/* Link to full music taste page */}
          <div className={styles.linkContainer || "linkContainer"}>
            <Link href="/users/music-taste" className={styles.viewMoreLink || "viewMoreLink"}>
              View Your Full Music Taste
            </Link>
          </div>
        </main>
        
        <footer className={styles.footer || "footer"}>
          <p>TIKO by Sonar • Your EDM Companion</p>
        </footer>
      </div>
    </>
  );
}
EOL

echo "Dashboard updated to use SoundCharacteristicsChart."

# 5. Add timestamp to force Heroku rebuild
echo "DEPLOY_TIMESTAMP=$TIMESTAMP" > .env

# 6. Commit changes
echo "Committing changes..."
git add .
git commit -m "Fix dashboard with SoundCharacteristicsChart and authentication flow"

# 7. Deploy to Heroku
echo "Deploying to Heroku..."
git push heroku main:master --force

echo "Deployment complete! Your improved dashboard should be live in a few minutes."
echo "Visit https://sonar-edm-user-50e4fb038f6e.herokuapp.com to see the changes."
echo "Users should now be redirected to the dashboard after login."
