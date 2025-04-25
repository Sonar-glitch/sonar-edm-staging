import { useEffect } from 'react';
import { useRouter } from 'next/router';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function MusicTasteRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the correct music taste page
    router.replace('/users/music-taste');
  }, [router]);
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh' 
    }}>
      <LoadingSpinner />
      <p>Redirecting to your music taste profile...</p>
    </div>
  );
}
