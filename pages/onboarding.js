// pages/onboarding.js
// 🎵 DEDICATED ONBOARDING PAGE
// First-time user onboarding without main navigation

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import TasteCollectionProgress from '../components/TasteCollectionProgress';
import styles from '../styles/TasteCollectionProgress.module.css';

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // Check if user already has a profile (shouldn't be on onboarding page)
    checkUserStatus();
  }, [session, status]);

  const checkUserStatus = async () => {
    try {
      const response = await fetch('/api/user/dashboard-status');
      if (response.ok) {
        const data = await response.json();
        
        // If user already has a profile and it's not a retry, redirect to dashboard
        if (data.status.userHasProfile && !router.query.retry) {
          console.log('User already has profile, redirecting to dashboard');
          router.push('/users/dashboard');
        }
      }
    } catch (error) {
      console.error('Error checking user status:', error);
    }
  };

  // Helper: ensure minimal or fallback profile exists (idempotent)
  const ensureProfile = async ({ fallback = false, error = null } = {}) => {
    try {
      const body = fallback ? {
        fallback: true,
        error: error || 'timeout/minimal fallback',
        confidence: { score: 10, level: 'low', factors: ['fallback profile'] }
      } : {};
      await fetch('/api/user/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    } catch (e) {
      console.warn('Failed to ensure minimal profile:', e.message);
    }
  };

  const handleOnboardingComplete = async (result) => {
    setIsCompleting(true);
    
    try {
      if (result.success && !result.skipped && !result.fallback) {
        // Real data collection completed successfully
        console.log('✅ Real onboarding completed successfully:', result);
        
        // Data is already saved by the real-taste-collection API
        // Just redirect to dashboard
        router.push('/users/dashboard');
      } else if (result.fallback || result.error) {
        // Collection failed or timed out, create minimal profile
        console.log('⚠️ Onboarding completed with fallback:', result);
        await ensureProfile({ fallback: true, error: result.error });
        
        router.push('/users/dashboard');
      } else if (result.skipped) {
        // User skipped onboarding
        console.log('⏭️ User skipped onboarding');
        await ensureProfile({ fallback: false }); // create minimal profile
        router.push('/users/dashboard');
      } else {
        // Unexpected result
        console.log('❓ Unexpected onboarding result:', result);
        await ensureProfile({ fallback: true, error: 'unexpected_result' });
        router.push('/users/dashboard');
      }
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      // Still redirect to dashboard to prevent being stuck
      router.push('/users/dashboard');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleTimeout = async () => {
    console.log('⏰ Onboarding timed out, creating fallback profile and redirecting');
    await ensureProfile({ fallback: true, error: 'timeout' });
    router.push('/users/dashboard');
  };

  if (status === 'loading') {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect to signin
  }

  return (
    <div className={styles.onboardingPageContainer}>
      <div className={styles.onboardingHeader}>
        <h1 className={styles.logo}>TIKO</h1>
        <p className={styles.subtitle}>
          {router.query.retry ? 
            'Let\'s improve your music profile with fresh data' : 
            'Let\'s create your personalized music profile'}
        </p>
      </div>
      
      <div className={styles.onboardingContent}>
        <TasteCollectionProgress 
          onComplete={handleOnboardingComplete} 
          onTimeout={handleTimeout}
        />
        
        {isCompleting && (
          <div className={styles.completingOverlay}>
            <div className={styles.spinner}></div>
            <p>Finalizing your profile...</p>
          </div>
        )}
      </div>
      
      <div className={styles.onboardingFooter}>
        <button
          className={styles.skipButton}
          onClick={async () => {
            await ensureProfile({ fallback: false });
            router.push('/users/dashboard');
          }}
        >Skip for now</button>
      </div>
    </div>
  );
}
