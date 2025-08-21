// components/UserProfileButton.js
// 👤 USER PROFILE SUMMARY BUTTON
// Shows brief user summary with delete option as requested

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

export default function UserProfileButton() {
  const { data: session } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load profile summary
  const loadProfileSummary = async () => {
    if (!session) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/user/profile-summary');
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      }
    } catch (error) {
      console.error('Failed to load profile summary:', error);
    } finally {
      setLoading(false);
    }
  };

  // Forceful sign out: revoke token (server), clear cookies via NextAuth, then hard redirect to root
  const hardSignOut = async () => {
    try {
      setLoading(true);
      try {
        // Clear onboarding attempt so a genuinely deleted profile triggers onboarding again next login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('onboarding_attempted');
          sessionStorage.removeItem('tiko_dashboard_cache_v1');
        }
      } catch {}
      await fetch('/api/auth/logout', { method: 'POST' }); // server-side token revoke attempt
      // Clear NextAuth session cookie & redirect
      await signOut({ redirect: true, callbackUrl: '/' });
    } catch (e) {
      console.warn('Sign out encountered an issue; forcing location change');
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  // Delete profile function: remove userProfiles + user_sound_profiles to trigger onboarding again
  const deleteProfile = async () => {
    if (!confirm('Delete your profile? This removes your saved taste data and restarts onboarding. Continue?')) return;
    try {
      setLoading(true);
      const response = await fetch('/api/user/delete-account', { method: 'DELETE' });
      if (response.ok) {
        // Also remove sound profile explicitly (in case API only deletes userProfiles)
        try { await fetch('/api/user/delete-sound-profile', { method: 'DELETE' }); } catch {}
        try {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('onboarding_attempted');
            sessionStorage.removeItem('tiko_dashboard_cache_v1');
          }
        } catch {}
        alert('✅ Profile deleted. You will be logged out to restart onboarding.');
        await hardSignOut();
      } else {
        const err = await response.json();
        alert('❌ Failed to delete profile: ' + (err.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Delete profile error:', error);
      alert('❌ Error deleting profile');
    } finally {
      setLoading(false);
    }
  };

  // Refresh cache function
  const refreshCache = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/refresh-cache', {
        method: 'POST'
      });

      if (response.ok) {
        alert('✅ Cache refreshed! Reloading page...');
        window.location.reload();
      } else {
        alert('❌ Failed to refresh cache');
      }
    } catch (error) {
      console.error('Refresh cache error:', error);
      alert('❌ Error refreshing cache');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showDropdown && session) {
      loadProfileSummary();
    }
  }, [showDropdown, session]);

  if (!session) return null;

  return (
    <div className="relative">
      {/* Profile Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        disabled={loading}
      >
        <div className="w-8 h-8 bg-purple-800 rounded-full flex items-center justify-center">
          {session.user?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <span className="hidden md:block">{session.user?.name || 'User'}</span>
        <svg className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4">
            {/* User Info */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-3 mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {session.user?.name || 'User Profile'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {session.user?.email}
              </p>
            </div>

            {/* Profile Summary */}
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading profile...</p>
              </div>
            ) : profileData ? (
              <div className="space-y-2 mb-4">
                <div className="text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Taste Profile:</span>
                  <span className="ml-2 text-green-600">
                    {profileData.hasProfile ? '✅ Complete' : '❌ Missing'}
                  </span>
                </div>
                
                {profileData.hasProfile && (
                  <>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Top Genres:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {profileData.topGenres?.slice(0, 3).join(', ') || 'None'}
                      </span>
                    </div>
                    
                    <div className="text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Events Found:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {profileData.eventCount || 0} this week
                      </span>
                    </div>

                    <div className="text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Profile Updated:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {profileData.lastUpdated ? new Date(profileData.lastUpdated).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500 mb-4">
                Failed to load profile summary
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={refreshCache}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-2 rounded text-sm transition-colors"
              >
                🔄 Refresh Data Cache
              </button>
              <button
                onClick={hardSignOut}
                disabled={loading}
                className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-3 py-2 rounded text-sm transition-colors"
              >
                🚪 Sign Out
              </button>
              <button
                onClick={deleteProfile}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-2 rounded text-sm transition-colors"
              >
                🗑️ Delete Profile
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowDropdown(false)}
              className="w-full mt-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
