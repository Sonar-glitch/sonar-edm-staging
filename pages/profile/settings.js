// pages/profile/settings.js - Profile settings page accessible from profile button
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

const ProfileSettingsPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [cacheStatus, setCacheStatus] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    loadProfileData();
  }, [session, status]);

  const loadProfileData = async () => {
    try {
      const [profileResponse, cacheResponse] = await Promise.all([
        fetch('/api/user/profile-summary'),
        fetch('/api/user/comprehensive-cache-status')
      ]);

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setUserProfile(profileData);
      }

      if (cacheResponse.ok) {
        const cacheData = await cacheResponse.json();
        setCacheStatus(cacheData);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshCache = async () => {
    try {
      const response = await fetch('/api/user/refresh-cache', { method: 'POST' });
      if (response.ok) {
        alert('Cache refresh initiated! This may take a few minutes.');
        loadProfileData(); // Reload data
      }
    } catch (error) {
      console.error('Error refreshing cache:', error);
      alert('Failed to refresh cache');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '60vh',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p>Loading profile settings...</p>
        </div>
      </Layout>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#fff', marginBottom: '30px', fontSize: '2em' }}>
        ⚙️ Profile Settings
        </h1>

        {/* User Info Section */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.05)', 
          padding: '20px', 
          borderRadius: '10px',
          marginBottom: '30px'
        }}>
          <h2 style={{ color: '#fff', marginBottom: '15px' }}>👤 Account Information</h2>
          <p style={{ color: '#ccc', marginBottom: '10px' }}>
            <strong>Email:</strong> {session?.user?.email}
          </p>
          <p style={{ color: '#ccc', marginBottom: '10px' }}>
            <strong>Name:</strong> {session?.user?.name || 'Not set'}
          </p>
          <p style={{ color: '#ccc' }}>
            <strong>Profile Created:</strong> {userProfile?.profileCreatedAt ? 
              new Date(userProfile.profileCreatedAt).toLocaleDateString() : 'Unknown'}
          </p>
        </div>

        {/* Music Profile Section */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.05)', 
          padding: '20px', 
          borderRadius: '10px',
          marginBottom: '30px'
        }}>
          <h2 style={{ color: '#fff', marginBottom: '15px' }}>🎵 Music Profile</h2>
          <p style={{ color: '#ccc', marginBottom: '10px' }}>
            <strong>Spotify Connected:</strong> {userProfile?.spotifyConnected ? '✅ Yes' : '❌ No'}
          </p>
          <p style={{ color: '#ccc', marginBottom: '10px' }}>
            <strong>Top Artists:</strong> {userProfile?.topArtistsCount || 0} discovered
          </p>
          <p style={{ color: '#ccc', marginBottom: '10px' }}>
            <strong>Top Tracks:</strong> {userProfile?.topTracksCount || 0} analyzed
          </p>
          <p style={{ color: '#ccc' }}>
            <strong>Audio Features:</strong> {userProfile?.audioFeaturesCount || 0} tracks processed
          </p>
        </div>

        {/* Cache Status Section */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.05)', 
          padding: '20px', 
          borderRadius: '10px',
          marginBottom: '30px'
        }}>
          <h2 style={{ color: '#fff', marginBottom: '15px' }}>⚡ Cache Status</h2>
          <p style={{ color: '#ccc', marginBottom: '10px' }}>
            <strong>Profile Cache:</strong> {cacheStatus?.profile?.isActive ? '✅ Active' : '❌ Inactive'}
          </p>
          <p style={{ color: '#ccc', marginBottom: '10px' }}>
            <strong>Events Cache:</strong> {cacheStatus?.events?.isActive ? '✅ Active' : '❌ Inactive'}
          </p>
          <p style={{ color: '#ccc', marginBottom: '15px' }}>
            <strong>Last Updated:</strong> {cacheStatus?.lastUpdated ? 
              new Date(cacheStatus.lastUpdated).toLocaleString() : 'Never'}
          </p>
          
          <button
            onClick={handleRefreshCache}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🔄 Refresh Cache
          </button>
        </div>

        {/* Actions Section */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.05)', 
          padding: '20px', 
          borderRadius: '10px'
        }}>
          <h2 style={{ color: '#fff', marginBottom: '15px' }}>🔧 Actions</h2>
          
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <button
              onClick={() => router.push('/music-taste')}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              🎵 Music Taste Collection
            </button>
            
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              🏠 Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
};

export default ProfileSettingsPage;
