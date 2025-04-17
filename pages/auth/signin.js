import { useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import styles from '../../styles/signin.module.css';

export default function SignIn() {
  const router = useRouter();
  const { callbackUrl } = router.query;
  
  // Auto-redirect to Spotify auth immediately
  useEffect(() => {
    // Short timeout to ensure the component is mounted
    const timer = setTimeout(() => {
      signIn('spotify', { callbackUrl: callbackUrl || '/users/music-taste' });
    }, 100);
    
    return () => clearTimeout(timer);
  }, [callbackUrl]);
  
  return (
    <div className={styles.container}>
      <div className={styles.signinCard}>
        <div className={styles.logo}>SONAR</div>
        <p className={styles.subtitle}>Connect with your sound</p>
        
        <h1 className={styles.title}>Redirecting to Spotify...</h1>
        <p className={styles.description}>
          You'll be redirected to Spotify to authorize access to your listening data.
          This helps us create your personalized music taste profile.
        </p>
        
        <div className={styles.loadingSpinner}></div>
        
        <button 
          className={styles.manualButton}
          onClick={() => signIn('spotify', { callbackUrl: callbackUrl || '/users/music-taste' })}
        >
          Click here if you're not redirected automatically
        </button>
      </div>
    </div>
  );
}
