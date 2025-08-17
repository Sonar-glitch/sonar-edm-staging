import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import EnhancedPersonalizedDashboard from '../../components/EnhancedPersonalizedDashboard';

// Temporary error boundary to surface offending object rendering during SSR invariant 130 investigation
function SafeRender({ children }) {
  const [error, setError] = useState(null);
  try {
    return children;
  } catch (e) {
    console.error('SafeRender catch:', e);
    setError(e);
    return (
      <div style={{ padding: '2rem', color: '#fff' }}>
        <h2>Dashboard Render Error</h2>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{String(e && e.message || e)}</pre>
      </div>
    );
  }
}

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

  return (
    <SafeRender>
      <EnhancedPersonalizedDashboard />
    </SafeRender>
  );
}
// NOTE: SSR disabled temporarily to bypass server render invariant while diagnosing object-as-child.
// If needed later, re-enable getServerSideProps once fixed.
