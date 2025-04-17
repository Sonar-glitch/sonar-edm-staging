import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import styles from '../styles/Layout.module.css';

export default function Layout({ children, type = 'user' }) {
  const { data: session, status } = useSession();
  
  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href="/">
            <a className={styles.logo}>
              <span className={styles.logoGradient}>Sonar EDM</span>
            </a>
          </Link>
        </div>
        
        <nav className={styles.navigation}>
          {type === 'user' ? (
            <>
              <Link href="/users/dashboard">
                <a className={styles.navItem}>
                  <span className={styles.navIcon}>📊</span>
                  Dashboard
                </a>
              </Link>
              <Link href="/users/taste-analysis">
                <a className={styles.navItem}>
                  <span className={styles.navIcon}>🎵</span>
                  Music Taste
                </a>
              </Link>
              <Link href="/users/discover">
                <a className={styles.navItem}>
                  <span className={styles.navIcon}>🔍</span>
                  Discover
                </a>
              </Link>
              <Link href="/users/events">
                <a className={styles.navItem}>
                  <span className={styles.navIcon}>🎪</span>
                  Events
                </a>
              </Link>
            </>
          ) : (
            <>
              <Link href="/promoters/dashboard">
                <a className={styles.navItem}>
                  <span className={styles.navIcon}>📊</span>
                  Dashboard
                </a>
              </Link>
              <Link href="/promoters/analytics">
                <a className={styles.navItem}>
                  <span className={styles.navIcon}>📈</span>
                  Analytics
                </a>
              </Link>
              <Link href="/promoters/events">
                <a className={styles.navItem}>
                  <span className={styles.navIcon}>🎪</span>
                  Events
                </a>
              </Link>
              <Link href="/promoters/audience">
                <a className={styles.navItem}>
                  <span className={styles.navIcon}>👥</span>
                  Audience
                </a>
              </Link>
            </>
          )}
        </nav>
        
        <div className={styles.sidebarFooter}>
          {session ? (
            <div className={styles.userInfo}>
              {session.user.image && (
                <img 
                  src={session.user.image} 
                  alt={session.user.name || 'User'} 
                  className={styles.userAvatar}
                />
              )}
              <span className={styles.userName}>
                {session.user.name || session.user.email || 'User'}
              </span>
              <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className={styles.signOutButton}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className={styles.authPrompt}>
              <p>Not signed in</p>
            </div>
          )}
        </div>
      </aside>
      
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>
            {type === 'user' ? 'Music Fan Dashboard' : 'Promoter Dashboard'}
          </h1>
          
          {session && (
            <div className={styles.userControls}>
              <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className={styles.signOutButtonSmall}
              >
                Sign Out
              </button>
            </div>
          )}
        </header>
        
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
