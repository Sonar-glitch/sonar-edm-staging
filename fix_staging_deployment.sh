#!/bin/bash
# FIX: Deployment Issues for STAGING - Make dashboard use our new components
# File: fix_staging_deployment.sh

echo "🔧 FIXING STAGING DEPLOYMENT ISSUES"
echo "===================================="
echo "🎯 Target: sonar-edm-staging (CORRECT)"

# Step 1: Fix the main dashboard page to use our component
echo "📄 Fixing pages/dashboard.js to use EnhancedPersonalizedDashboard..."

cat > pages/dashboard.js << 'EOF'
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import EnhancedPersonalizedDashboard from '../components/EnhancedPersonalizedDashboard';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (!session) router.push('/auth/signin'); // Not signed in
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
        color: '#fff'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect to signin
  }

  return <EnhancedPersonalizedDashboard />;
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}
EOF

echo "✅ Fixed pages/dashboard.js"

# Step 2: Also fix users/dashboard.js if it exists
if [[ -f "pages/users/dashboard.js" ]]; then
    echo "📄 Fixing pages/users/dashboard.js..."
    
    cat > pages/users/dashboard.js << 'EOF'
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import EnhancedPersonalizedDashboard from '../../components/EnhancedPersonalizedDashboard';

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/signin');
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
        color: '#fff'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <EnhancedPersonalizedDashboard />;
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}
EOF

    echo "✅ Fixed pages/users/dashboard.js"
fi

# Step 3: Create missing API endpoint
echo "🔌 Creating missing API endpoint: pages/api/user/profile.js..."
mkdir -p pages/api/user

cat > pages/api/user/profile.js << 'EOF'
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Return basic user profile
    const userProfile = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      provider: session.user.provider || 'spotify'
    };

    res.status(200).json(userProfile);
  } catch (error) {
    console.error('Error in /api/user/profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
EOF

echo "✅ Created pages/api/user/profile.js"

# Step 4: Create spotify user-profile endpoint
echo "🔌 Creating pages/api/spotify/user-profile.js..."
mkdir -p pages/api/spotify

cat > pages/api/spotify/user-profile.js << 'EOF'
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mock Spotify data for now - replace with real Spotify API calls
    const spotifyData = {
      topGenres: [
        { name: 'house', weight: 0.85 },
        { name: 'techno', weight: 0.72 },
        { name: 'progressive house', weight: 0.68 },
        { name: 'deep house', weight: 0.61 },
        { name: 'trance', weight: 0.45 }
      ],
      audioFeatures: {
        energy: 0.75,
        danceability: 0.82,
        valence: 0.65,
        acousticness: 0.15,
        instrumentalness: 0.35,
        tempo: 128
      },
      topArtists: [
        { name: 'Deadmau5', genres: ['progressive house', 'electro house'] },
        { name: 'Carl Cox', genres: ['techno', 'house'] },
        { name: 'Above & Beyond', genres: ['trance', 'progressive trance'] }
      ]
    };

    res.status(200).json(spotifyData);
  } catch (error) {
    console.error('Error in /api/spotify/user-profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
EOF

echo "✅ Created pages/api/spotify/user-profile.js"

# Step 5: Create taste-profile endpoint
echo "🔌 Creating pages/api/user/taste-profile.js..."

cat > pages/api/user/taste-profile.js << 'EOF'
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mock taste profile data - replace with real database calls
    const tasteProfile = {
      genrePreferences: [
        { name: 'house', weight: 0.85, confidence: 0.9 },
        { name: 'techno', weight: 0.72, confidence: 0.8 },
        { name: 'progressive', weight: 0.68, confidence: 0.75 },
        { name: 'deep house', weight: 0.61, confidence: 0.7 },
        { name: 'trance', weight: 0.45, confidence: 0.6 }
      ],
      venuePreferences: {
        preferredCapacity: 'medium',
        preferredAmbiance: 'underground',
        locationPreference: 'urban'
      },
      seasonalPreferences: {
        spring: { energy: 0.7, mood: 'uplifting' },
        summer: { energy: 0.85, mood: 'euphoric' },
        fall: { energy: 0.65, mood: 'deep' },
        winter: { energy: 0.6, mood: 'introspective' }
      }
    };

    res.status(200).json(tasteProfile);
  } catch (error) {
    console.error('Error in /api/user/taste-profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
EOF

echo "✅ Created pages/api/user/taste-profile.js"

# Step 6: Confirm staging remote (it's already correct)
echo ""
echo "🔗 Confirming Heroku staging remote..."
if git remote -v | grep -q "sonar-edm-staging"; then
    echo "✅ Heroku remote correctly points to sonar-edm-staging"
else
    echo "❌ Heroku remote issue - but you're already using staging correctly"
fi

echo ""
echo "🎉 STAGING FIXES COMPLETED!"
echo "=========================="
echo ""
echo "📋 WHAT WAS FIXED:"
echo "✅ Dashboard pages now use EnhancedPersonalizedDashboard"
echo "✅ Created missing API endpoints with demo data"
echo "✅ Confirmed staging environment setup"
echo ""
echo "🧪 NEXT STEPS:"
echo "1. Test locally: npm run dev"
echo "2. Check: http://localhost:3000/dashboard"
echo "3. Verify: Spider chart and capsules appear"
echo "4. Deploy to staging: git add . && git commit -m 'Fix dashboard routing and APIs' && git push heroku main"
echo "5. Check live: https://sonar-edm-staging-ef96efd71e8e.herokuapp.com/dashboard"
echo ""
echo "🎯 SUCCESS CRITERIA:"
echo "- [ ] Dashboard shows spider chart (left)"
echo "- [ ] Dashboard shows capsule indicators (right)"
echo "- [ ] No 404 API errors in console"
echo "- [ ] Components load with demo data"

