import Link from 'next/link';
import styles from '../styles/Error.module.css';
import Head from 'next/head';

export default function Custom404() {
  return (
    <div className={styles.container}>
      <Head>
        <title>404 - Page Not Found</title>
      </Head>
      
      <div className={styles.content}>
        <h1 className={styles.title}>404</h1>
        <h2 className={styles.subtitle}>Page Not Found</h2>
        <p className={styles.description}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/" className={styles.button}>Return to Home</Link>
      </div>
    </div>
  );
}
