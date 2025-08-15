// pages/onboarding.js
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
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // Check dashboard status to see if user needs onboarding
    const checkDashboardStatus = async () => {
      try {
        const response = await fetch('/api/user/dashboard-status');
        if (response.ok) {
          const data = await response.json();
          
          // If user already has data or doesn't need onboarding, redirect to dashboard
          if (!data.status.showTasteLoader || !data.status.isFirstLogin) {
            router.push('/users/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking dashboard status:', error);
        // On error, still allow onboarding
      }
    };

    checkDashboardStatus();
  }, [session, status, router]);

  const handleComplete = async () => {
    if (isCompleting) return;
    
    setIsCompleting(true);
    try {
      // Mark onboarding as completed
      const response = await fetch('/api/user/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        router.push('/users/dashboard');
      } else {
        console.error('Failed to complete onboarding');
        router.push('/users/dashboard');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      router.push('/users/dashboard');
    } finally {
      setIsCompleting(false);
    }
  };

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

  return (
    <div className={styles.onboardingContainer}>
      <div className={styles.onboardingHeader}>
        <h1>Welcome to TIKO</h1>
        <p>Let's set up your music taste profile</p>
      </div>

      <div className={styles.progressContainer}>
        <TasteCollectionProgress onComplete={handleComplete} />
      </div>

      <div className={styles.onboardingFooter}>
        <button 
          className={styles.skipButton}
          onClick={() => router.push('/users/dashboard')}
          disabled={isCompleting}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
