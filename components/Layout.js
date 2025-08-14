import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import styles from '../styles/Layout.module.css';
import UserProfileButton from './UserProfileButton';

export default function Layout({ children, type = 'user' }) {
  const { data: session, status } = useSession();
  
  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.logo}>
              <span className={styles.logoGradient}>Sonar EDM</span>
            </Link>
        </div>
        
        <nav className={styles.navigation}>
          {type === 'user' ? (
            <>
              <Link href="/users/dashboard" className={styles.navItem}>
                  <span className={styles.navIcon}>📊</span>
                  Dashboard
                </Link>
              <Link href="/users/taste-analysis" className={styles.navItem}>
                  <span className={styles.navIcon}>🎵</span>
                  Music Taste
                </Link>
              <Link href="/users/discover" className={styles.navItem}>
                  <span className={styles.navIcon}>🔍</span>
                  Discover
                </Link>
              <Link href="/users/events" className={styles.navItem}>
                  <span className={styles.navIcon}>🎪</span>
                  Events
                </Link>
            </>
          ) : (
            <>
              <Link href="/promoters/dashboard" className={styles.navItem}>
                  <span className={styles.navIcon}>📊</span>
                  Dashboard
                </Link>
              <Link href="/promoters/analytics" className={styles.navItem}>
                  <span className={styles.navIcon}>📈</span>
                  Analytics
                </Link>
              <Link href="/promoters/events" className={styles.navItem}>
                  <span className={styles.navIcon}>🎪</span>
                  Events
                </Link>
              <Link href="/promoters/audience" className={styles.navItem}>
                  <span className={styles.navIcon}>👥</span>
                  Audience
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
              <UserProfileButton />
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
