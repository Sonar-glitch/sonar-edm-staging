import React from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import styles from '../styles/Layout.module.css';

export default function Layout({ children }) {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar Navigation */}
      <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/">
            <a className={styles.logo}>
              <span className={styles.logoIcon}>
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="url(#logo-gradient)" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm0 2c5.5 0 10 4.5 10 10s-4.5 10-10 10S2 17.5 2 12 6.5 2 12 2zm0 2c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 2c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6 2.7-6 6-6zm0 2c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4z" />
                  <defs>
                    <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#FF2A70" />
                      <stop offset="100%" stopColor="#00F0FF" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              <span>Sonar EDM</span>
            </a>
          </Link>
        </div>

        {session && (
          <>
            {/* User Section */}
            <div className={styles.navSection}>
              <h3 className={styles.navTitle}>Music Fan</h3>
              <Link href="/users/dashboard">
                <a className={`${styles.navItem} ${
                  typeof window !== 'undefined' && window.location.pathname === '/users/dashboard' ? styles.active : ''
                }`}>
                  <span className={styles.navIcon}>
                    <svg viewBox="0 0 24 24" width="24" height="24">
                      <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z" />
                    </svg>
                  </span>
                  Music Taste Analysis
                </a>
              </Link>
              <Link href="/users/events">
                <a className={`${styles.navItem} ${
                  typeof window !== 'undefined' && window.location.pathname === '/users/events' ? styles.active : ''
                }`}>
                  <span className={styles.navIcon}>
                    <svg viewBox="0 0 24 24" width="24" height="24">
                      <path fill="currentColor" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
                    </svg>
                  </span>
                  Event Recommendations
                </a>
              </Link>
              <Link href="/users/artists">
                <a className={`${styles.navItem} ${
                  typeof window !== 'undefined' && window.location.pathname === '/users/artists' ? styles.active : ''
                }`}>
                  <span className={styles.navIcon}>
                    <svg viewBox="0 0 24 24" width="24" height="24">
                      <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </span>
                  Similar Artists
                </a>
              </Link>
            </div>

            {/* Promoter Section */}
            <div className={styles.navSection}>
              <h3 className={styles.navTitle}>Promoter</h3>
              <Link href="/promoters/dashboard">
                <a className={`${styles.navItem} ${
                  typeof window !== 'undefined' && window.location.pathname === '/promoters/dashboard' ? styles.active : ''
                }`}>
                  <span className={styles.navIcon}>
                    <svg viewBox="0 0 24 24" width="24" height="24">
                      <path fill="currentColor" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                    </svg>
                  </span>
                  Revenue Dashboard
                </a>
              </Link>
              <Link href="/promoters/artists">
                <a className={`${styles.navItem} ${
                  typeof window !== 'undefined' && window.location.pathname === '/promoters/artists' ? styles.active : ''
                }`}>
                  <span className={styles.navIcon}>
                    <svg viewBox="0 0 24 24" width="24" height="24">
                      <path fill="currentColor" d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z" />
                    </svg>
                  </span>
                  Artist Popularity
                </a>
              </Link>
              <Link href="/promoters/events">
                <a className={`${styles.navItem} ${
                  typeof window !== 'undefined' && window.location.pathname === '/promoters/events' ? styles.active : ''
                }`}>
                  <span className={styles.navIcon}>
                    <svg viewBox="0 0 24 24" width="24" height="24">
                      <path fill="currentColor" d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                    </svg>
                  </span>
                  Event Forecasting
                </a>
              </Link>
              <Link href="/promoters/pricing">
                <a className={`${styles.navItem} ${
                  typeof window !== 'undefined' && window.location.pathname === '/promoters/pricing' ? styles.active : ''
                }`}>
                  <span className={styles.navIcon}>
                    <svg viewBox="0 0 24 24" width="24" height="24">
                      <path fill="currentColor" d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
                    </svg>
                  </span>
                  Ticket Pricing
                </a>
              </Link>
            </div>
          </>
        )}

        {/* Settings Section */}
        <div className={styles.navSection}>
          <h3 className={styles.navTitle}>Account</h3>
          {session ? (
            <>
              <Link href="/profile">
                <a className={`${styles.navItem} ${
                  typeof window !== 'undefined' && window.location.pathname === '/profile' ? styles.active : ''
                }`}>
                  <span className={styles.navIcon}>
                    <svg viewBox="0 0 24 24" width="24" height="24">
                      <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                    </svg>
                  </span>
                  Profile
                </a>
              </Link>
              <Link href="/api/auth/signout">
                <a className={styles.navItem}>
                  <span className={styles.navIcon}>
                    <svg viewBox="0 0 24 24" width="24" height="24">
                      <path fill="currentColor" d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                    </svg>
                  </span>
                  Sign Out
                </a>
              </Link>
            </>
          ) : (
            <Link href="/auth/signin">
              <a className={styles.navItem}>
                <span className={styles.navIcon}>
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z" />
                  </svg>
                </span>
                Sign In
              </a>
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <button className={styles.mobileMenuToggle} onClick={toggleMobileMenu}>
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
            </svg>
          </button>
          
          {session && (
            <div className={styles.userMenu}>
              <img 
                src={session.user.image || 'https://via.placeholder.com/40'} 
                alt={session.user.name || 'User'} 
                className={styles.userAvatar} 
              />
              <span className={styles.userName}>{session.user.name || session.user.email}</span>
            </div>
          ) }
        </header>
        
        {children}
      </main>
    </div>
  );
}
