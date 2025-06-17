import styles from '../../styles/Auth.module.css';
import Link from 'next/link';
import Head from 'next/head';

export default function Error({ error }) {
  return (
    <div className={styles.container}>
      <Head>
        <title>Authentication Error - Sonar EDM Platform</title>
      </Head>
      
      <div className={styles.errorContainer}>
        <h1 className={styles.title}>Authentication Error</h1>
        <div className={styles.errorMessage}>
          {error === "Configuration" && (
            <p>There is a problem with the server configuration. Please contact support.</p>
          )}
          {error === "AccessDenied" && (
            <p>You do not have permission to sign in.</p>
          )}
          {error === "Verification" && (
            <p>The verification link may have been used or has expired.</p>
          )}
          {!error && (
            <p>An unknown error occurred during authentication.</p>
          )}
        </div>
        <Link href="/" className={styles.button}>Return to Home</Link>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const { error } = context.query;
  
  return {
    props: {
      error: error || null,
    },
  };
}
