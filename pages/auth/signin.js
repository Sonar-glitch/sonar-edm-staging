import React, { useEffect } from 'react';
import { getProviders, signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../../styles/signin.module.css';
import Navigation from '../../components/Navigation';

export default function SignIn({ providers }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { callbackUrl } = router.query;
  
  // Redirect authenticated users to music-taste page
  useEffect(() => {
    if (status === 'authenticated') {
      router.push(callbackUrl || '/users/music-taste');
    }
  }, [status, router, callbackUrl]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Sign In | Sonar</title>
      </Head>
      
      <Navigation />
      
      <main className={styles.main}>
        <div className={styles.signinCard}>
          <h1 className={styles.title}>Connect with Sonar</h1>
          <p className={styles.subtitle}>Unlock your sonic DNA and discover your music taste</p>
          
          {status === 'loading' ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading...</p>
            </div>
          ) : status === 'authenticated' ? (
            <div className={styles.alreadySignedIn}>
              <p>You're already signed in!</p>
              <button 
                className={styles.redirectButton}
                onClick={() => router.push('/users/music-taste')}
              >
                Go to Music Taste
              </button>
            </div>
          ) : (
            <div className={styles.providersContainer}>
              {Object.values(providers || {}).map((provider) => (
                <div key={provider.name} className={styles.providerItem}>
                  <button 
                    className={styles.providerButton}
                    onClick={() => signIn(provider.id, { callbackUrl: '/users/music-taste' })}
                  >
                    <span className={styles.providerIcon}>
                      {provider.name === 'Spotify' && '🎵'}
                    </span>
                    Connect with {provider.name}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export async function getServerSideProps() {
  const providers = await getProviders();
  return {
    props: { providers },
  };
}
