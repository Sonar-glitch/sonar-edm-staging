import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import SharedAnalytics from '../../components/analytics/SharedAnalytics';
import styles from '../../styles/AnalyticsPage.module.css';

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);
  
  // Loading state
  if (status === 'loading') {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading analytics...</p>
      </div>
    );
  }
  
  // If authenticated, show analytics
  if (session) {
    return (
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Platform Analytics</h1>
          <p className={styles.pageDescription}>
            Comprehensive analytics shared between promoters and music fans
          </p>
        </div>
        
        <SharedAnalytics />
      </div>
    );
  }
  
  // Default loading state
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingSpinner}></div>
      <p>Loading analytics...</p>
    </div>
  );
}
