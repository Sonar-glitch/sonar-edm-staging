import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import styles from '@/styles/UserProfile.module.css';

export default function UserProfile({ tasteSnapshot }) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  // Handle sign out
  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };
  
  if (!session) {
    return (
      <Link href="/auth/signin" legacyBehavior className={styles.signInButton}>Sign In</Link>
    );
  }
  
  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        className={styles.profileButton}
        onClick={toggleDropdown}
        aria-expanded={isOpen}
      >
        {session.user?.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name || 'User'}
            width={36}
            height={36}
            className={styles.avatar}
          />
        ) : (
          <div className={styles.avatarPlaceholder}>
            {session.user?.name?.charAt(0) || 'U'}
          </div>
        )}
        <span className={styles.username}>
          {session.user?.name?.split(' ')[0] || 'User'}
        </span>
        <span className={`${styles.chevron} ${isOpen ? styles.chevronUp : ''}`}>
          ▼
        </span>
      </button>
      
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <h3 className={styles.profileName}>{session.user?.name}</h3>
            <p className={styles.profileEmail}>{session.user?.email}</p>
          </div>
          
          {tasteSnapshot && Object.keys(tasteSnapshot).length > 0 && (
            <div className={styles.tasteSnapshot}>
              <h4 className={styles.snapshotTitle}>Your Taste Profile</h4>
              <ul className={styles.genreList}>
                {Object.entries(tasteSnapshot)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 3)
                  .map(([genre, value]) => (
                    <li key={genre} className={styles.genreItem}>
                      <span className={styles.genreName}>{genre}</span>
                      <div className={styles.genreBar}>
                        <div
                          className={styles.genreBarFill}
                          style={{ width: `${value}%` }}
                        ></div>
                      </div>
                    </li>
                  ))}
              </ul>
              <Link href="/users/music-taste" legacyBehavior className={styles.viewMoreLink}>View Full Taste Profile</Link>
            </div>
          )}
          
          <div className={styles.menuItems}>
            <Link href="/dashboard" legacyBehavior className={styles.menuItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                Dashboard
              </Link>
            
            <Link href="/users/profile" legacyBehavior className={styles.menuItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Profile
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
  );
}