import { useSession, signIn } from 'next-auth/react';
import styles from '../../styles/signin.module.css';
import Layout from '../../components/Layout';

export default function SignIn() {
  const { data: session } = useSession();

  if (session) {
    return (
      <Layout>
        <div className={styles.container}>
          <h1 className={styles.title}>Already signed in</h1>
          <p className={styles.description}>
            You are already signed in as {session.user.name || session.user.email}
          </p>
          <a href="/users/music-taste" className={styles.button}>
            Go to Music Taste
          </a>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>Sign in to Sonar EDM</h1>
        <p className={styles.description}>
          Connect with Spotify to unlock your sonic DNA
        </p>
        <button
          onClick={() => signIn('spotify', { callbackUrl: '/users/music-taste' })}
          className={styles.spotifyButton}
        >
          Connect with Spotify
        </button>
      </div>
    </Layout>
  );
}
