import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Layout from '../../components/Layout';
import EnhancedPersonalizedDashboard from '../../components/EnhancedPersonalizedDashboard';

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
    <Layout>
      <EnhancedPersonalizedDashboard />
    </Layout>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}
