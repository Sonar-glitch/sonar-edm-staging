import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { signOut } from 'next-auth/react';
import styles from '../../styles/SignOut.module.css';

export default function SignOut() {
  const router = useRouter();
  
  useEffect(() => {
    // Automatically sign out when this page loads
    const signOutUser = async () => {
      await signOut({ redirect: false });
      // Redirect to home page after a brief delay
      setTimeout(() => {
        router.push('/');
      }, 2000);
    };
    
    signOutUser();
  }, [router]);
  
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.loadingSpinner}></div>
        <h1 className={styles.title}>Signing Out...</h1>
        <p className={styles.message}>Thank you for using Sonar EDM Platform</p>
      </div>
      
      <div className={styles.background}>
        <div className={styles.circle1}></div>
        <div className={styles.circle2}></div>
      </div>
    </div>
  );
}
