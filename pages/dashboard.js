// pages/dashboard.js - TIKO Master Plan Implementation
// 🎯 Complete authentication flow with onboarding integration
import React, { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import AppLayout from '../components/AppLayout';
import EnhancedPersonalizedDashboard from '@/components/EnhancedPersonalizedDashboard';
import TasteCollectionProgress from '../components/TasteCollectionProgress';
import Head from 'next/head';

const DashboardPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboardStatus, setDashboardStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkDashboardStatus = async () => {
      if (status === 'loading') return;
      
      if (!session) {
        // Unauthenticated users: Show Spotify sign-in
        setDashboardStatus({ authenticated: false });
        setLoading(false);
        return;
      }

      try {
        // Check user's dashboard status
        const response = await fetch('/api/user/dashboard-status');
        const data = await response.json();
        setDashboardStatus(data);
        
        // If first-time user, redirect to dedicated onboarding page
        if (data.isFirstLogin && data.authenticated) {
          router.push('/onboarding');
          return;
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Dashboard status check failed:', error);
        setDashboardStatus({ authenticated: !!session, error: true });
        setLoading(false);
      }
    };

    checkDashboardStatus();
  }, [session, status, router]);

  // Loading state
  if (loading || status === 'loading') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
        color: '#fff'
      }}>
        <div>Loading TIKO...</div>
      </div>
    );
  }

  // Unauthenticated users: Spotify sign-in gate
  if (!dashboardStatus?.authenticated) {
    return (
      <>
        <Head>
          <title>TIKO - Your Music Universe</title>
          <meta name="description" content="Your personalized EDM event discovery platform" />
        </Head>
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#fff',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
        }}>
          <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
            <h1 style={{ 
              fontSize: '3.5rem', 
              fontWeight: '700', 
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #00D4FF 0%, #7B68EE 50%, #FF6B6B 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              TIKO
            </h1>
            <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.9 }}>
              Your personalized EDM event discovery platform
            </p>
            <p style={{ fontSize: '1rem', marginBottom: '2rem', opacity: 0.7 }}>
              Sign in with Spotify to discover events perfectly matched to your music taste
            </p>
            <button
              onClick={() => signIn('spotify', { callbackUrl: '/dashboard' })}
              style={{
                background: 'linear-gradient(135deg, #1DB954 0%, #1ed760 100%)',
                color: '#fff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '24px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
                boxShadow: '0 4px 15px rgba(29, 185, 84, 0.3)'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0px)'}
            >
              Sign in with Spotify
            </button>
          </div>
        </div>
      </>
    );
  }

  // Authenticated users with completed onboarding: Show main dashboard
  return (
    <AppLayout>
      <EnhancedPersonalizedDashboard />
    </AppLayout>
  );
};

export default DashboardPage;
