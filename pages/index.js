import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Sonar EDM Platform</title>
        <meta name="description" content="EDM discovery platform for promoters and music fans" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Audiowide&family=Montserrat:wght@400;700&family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          <span className="edm-title">Sonar EDM Platform</span>
        </h1>

        <p className={styles.description}>
          Discover EDM trends, analyze music preferences, and connect promoters with fans
        </p>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h2>For Promoters</h2>
            <p>Gain insights into EDM trends, predict artist popularity, and optimize event planning with data-driven analytics.</p>
            <ul className={styles.featureList}>
              <li>Artist popularity prediction</li>
              <li>Event demand forecasting</li>
              <li>Ticket price optimization</li>
            </ul>
            <Link href="/promoters/dashboard">
              <a className={styles.button}>Promoter Dashboard</a>
            </Link>
          </div>

          <div className={styles.card}>
            <h2>For Music Fans</h2>
            <p>Discover new artists based on your music taste, find events that match your preferences, and explore trending genres.</p>
            <ul className={styles.featureList}>
              <li>Music taste analysis</li>
              <li>Event recommendations</li>
              <li>Similar artist discovery</li>
            </ul>
            <Link href="/users/dashboard">
              <a className={styles.button}>User Dashboard</a>
            </Link>
          </div>
        </div>
      </main>
    </div>
  ) ;
}
