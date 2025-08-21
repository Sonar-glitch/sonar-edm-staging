import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import styles from '@/styles/Header.module.css';

export default function Header() {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };
  
  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };
  
  // Handle image error by hiding the image and showing the fallback
  const handleImageError = (e) => {
    // Hide the image
    if (e.target) {
      e.target.style.display = 'none';
    }
    
    // Show the fallback
    const fallbackElement = e.currentTarget.parentNode.querySelector(`.${styles.avatarFallback}`);
    if (fallbackElement) {
      fallbackElement.style.display = 'flex';
    }
  };
  
  return (
    <header className={styles.header}>
      <Link href="/dashboard" legacyBehavior className={styles.logo}>
          <span className={styles.logoText}>TIKO</span>
        </Link>
      
      <nav className={styles.nav}>
        <div className={styles.navLinks}>
          <Link href="/dashboard" legacyBehavior className={styles.navLink}>Dashboard</Link>
          <Link href="/users/music-taste" legacyBehavior className={styles.navLink}>Music Taste</Link>
          <Link href="/events" legacyBehavior className={styles.navLink}>Events</Link>
        </div>
        
        {session ? (
          <div className={styles.userMenu}>
            <button 
              className={styles.profileButton} 
              onClick={toggleDropdown}
              aria-expanded={dropdownOpen}
            >
              <div className={styles.avatarContainer}>
                {session.user?.image ? (
                  <Image 
                    src={session.user.image}
                    alt="Profile"
                    width={36}
                    height={36}
                    className={styles.avatar}
                    onError={handleImageError}
                  />
                ) : null}
                <div className={styles.avatarFallback} style={{ display: session.user?.image ? 'none' : 'flex' }}>
                  {session.user?.name?.charAt(0) || 'U'}
                </div>
              </div>
              <span className={styles.profileName}>
                {session.user?.name?.split(' ')[0] || 'Profile'}
              </span>
              <span className={`${styles.chevron} ${dropdownOpen ? styles.chevronUp : ''}`}>
                ▼
              </span>
            </button>
            
            {dropdownOpen && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownHeader}>
                  <p className={styles.profileName}>{session.user?.name}</p>
                  <p className={styles.profileEmail}>{session.user?.email}</p>
                </div>
                
                <div className={styles.menuItems}>
                  <Link href="/users/profile" legacyBehavior className={styles.menuItem}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      Your Profile
                    </Link>
                  
                  <Link href="/users/music-taste" legacyBehavior className={styles.menuItem}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18V5l12-2v13"></path>
                        <circle cx="6" cy="18" r="3"></circle>
                        <circle cx="18" cy="16" r="3"></circle>
                      </svg>
                      Music Taste
                    </Link>
                  
                  <Link href="/users/settings" legacyBehavior className={styles.menuItem}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                      </svg>
                      Settings
                    </Link>
                  
                  <button 
                    className={styles.menuItem}
                    onClick={handleSignOut}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link href="/auth/signin" legacyBehavior className={styles.signInButton}>
              Sign In
            </Link>
        )}
      </nav>
    </header>
  );
}