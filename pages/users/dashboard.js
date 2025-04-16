import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Redirect to music-taste page
    if (status !== 'loading') {
      router.replace('/users/music-taste');
    }
  }, [router, status]);

  // Show loading while redirecting
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#0f0f17',
      color: 'white'
    }}>
      <p>Redirecting to your Music Taste profile...</p>
    </div>
  );
}
