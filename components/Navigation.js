import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles/Navigation.module.css';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';

const Navigation = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const isActive = (path) => {
    return router.pathname === path ? styles.active : '';
  };
  
  // Fixed sign-out functionality
  const handleSignOut = async () => {
    try {
      // Use callbackUrl to ensure proper redirection after sign-out
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Error signing out:', error);
      // Fallback manual redirect if signOut fails
      window.location.href = '/';
    }
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <nav className={styles.navigation}>
      <div className={styles.logoContainer}>
        <Link href="/">
          <a className={styles.logo}>SONAR</a>
        </Link>
        <span className={styles.tagline}>Connect with your sound</span>
      </div>
      
      <div className={styles.navLinks}>
        {status === 'authenticated' && (
          <>
            <Link href="/users/music-taste">
              <a className={`${styles.navLink} ${isActive('/users/music-taste')}`}>
                Music Taste
              </a>
            </Link>
            <Link href="/users/events">
              <a className={`${styles.navLink} ${isActive('/users/events')}`}>
                Events
              </a>
            </Link>
          </>
        )}
      </div>
      
      <div className={styles.authContainer}>
        {status === 'loading' ? (
          <div className={styles.loadingDots}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        ) : status === 'authenticated' ? (
          <div className={styles.profileDropdown} ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={styles.profileButton}
            >
              {session.user?.image ? (
                <img 
                  src={session.user.image} 
                  alt={session.user.name || 'User'} 
                  className={styles.profileImage}
                />
              ) : (
                <div className={styles.profileInitial}>
                  {session.user?.name ? session.user.name.charAt(0) : 'U'}
                </div>
              )}
              <span className={styles.profileName}>
                {session.user?.name ? session.user.name.split(' ')[0] : 'User'}
              </span>
              <span className={styles.dropdownArrow}>▼</span>
            </button>
            
            {dropdownOpen && (
              <div className={styles.dropdownMenu}>
                <Link href="/users/profile">
                  <a className={styles.dropdownItem}>
                    <span className={styles.dropdownIcon}>👤</span>
                    Profile
                  </a>
                </Link>
                <Link href="/users/settings">
                  <a className={styles.dropdownItem}>
                    <span className={styles.dropdownIcon}>⚙️</span>
                    Settings
                  </a>
                </Link>
                <Link href="/users/account">
                  <a className={styles.dropdownItem}>
                    <span className={styles.dropdownIcon}>🔑</span>
                    Account
                  </a>
                </Link>
                <Link href="/users/appearance">
                  <a className={styles.dropdownItem}>
                    <span className={styles.dropdownIcon}>🎨</span>
                    Appearance
                  </a>
                </Link>
                <Link href="/users/notifications">
                  <a className={styles.dropdownItem}>
                    <span className={styles.dropdownIcon}>🔔</span>
                    Notifications
                  </a>
                </Link>
                <div className={styles.dropdownDivider}></div>
                <button 
                  onClick={handleSignOut}
                  className={styles.dropdownItem}
                >
                  <span className={styles.dropdownIcon}>🚪</span>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button 
            onClick={() => signIn('spotify')}
            className={styles.authButton}
          >
            Connect
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
