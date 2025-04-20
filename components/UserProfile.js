import React, { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import styles from '@/styles/UserProfile.module.css';

export default function UserProfile({ tasteSnapshot }) {
  const { data: session } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  
  const handleSignOut = (e) => {
    e.preventDefault();
    signOut({ callbackUrl: '/' });
  };
  
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };
  
  // Format taste snapshot for display
  const formatGenres = (genres) => {
    if (!genres) return [];
    
    return Object.entries(genres)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre, value]) => ({ 
        name: genre, 
        value 
      }));
  };
  
  const topGenres = formatGenres(tasteSnapshot?.genreProfile);
  
  return (
    <div className={styles.container}>
      <div className={styles.profileButton} onClick={toggleDropdown}>
        {session?.user?.image ? (
          <Image 
            src={session.user.image} 
            alt="Profile" 
            width={36} 
            height={36} 
            className={styles.avatar}
          />
        ) : (
          <div className={styles.avatarPlaceholder}>
            {session?.user?.name?.charAt(0) || 'U'}
          </div>
        )}
        <span className={styles.username}>
          {session?.user?.name || 'User'}
        </span>
        <svg 
          className={`${styles.chevron} ${showDropdown ? styles.chevronUp : ''}`} 
          width="12" 
          height="8" 
          viewBox="0 0 12 8" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M1 1.5L6 6.5L11 1.5" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
      
      {showDropdown && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <h3 className={styles.profileName}>
              {session?.user?.name || 'User Profile'}
            </h3>
            <p className={styles.profileEmail}>
              {session?.user?.email || 'user@example.com'}
            </p>
          </div>
          
          {tasteSnapshot && (
            <div className={styles.tasteSnapshot}>
              <h4 className={styles.snapshotTitle}>Your Sonic Signature</h4>
              {topGenres.length > 0 ? (
                <ul className={styles.genreList}>
                  {topGenres.map((genre, index) => (
                    <li key={index} className={styles.genreItem}>
                      <span className={styles.genreName}>{genre.name}</span>
                      <div className={styles.genreBar}>
                        <div 
                          className={styles.genreBarFill}
                          style={{ width: `${genre.value}%` }}
                        ></div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.noData}>No taste data available yet.</p>
              )}
              <Link href="/users/music-taste" className={styles.viewMoreLink}>
                View full taste profile
              </Link>
            </div>
          )}
          
          <div className={styles.menuItems}>
            <Link href="/users/profile" className={styles.menuItem}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z" fill="currentColor" />
                <path d="M8 9C5.33 9 0 10.34 0 13V14C0 14.55 0.45 15 1 15H15C15.55 15 16 14.55 16 14V13C16 10.34 10.67 9 8 9Z" fill="currentColor" />
              </svg>
              <span>My Profile</span>
            </Link>
            
            <Link href="/users/settings" className={styles.menuItem}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.2 6.4H12.56C12.36 5.76 12.04 5.16 11.6 4.64L13.28 2.96C13.68 2.56 13.68 1.92 13.28 1.52L14.48 2.72C14.16 2.32 13.68 2.32 13.28 2.72L11.6 4.4C11.08 3.96 10.48 3.64 9.84 3.44V0.8C9.84 0.36 9.48 0 9.04 0H6.96C6.52 0 6.16 0.36 6.16 0.8V3.44C5.52 3.64 4.92 3.96 4.4 4.4L2.72 2.72C2.32 2.32 1.68 2.32 1.28 2.72L0.56 3.44C0.16 3.84 0.16 4.48 0.56 4.88L2.24 6.56C1.8 7.08 1.48 7.68 1.28 8.32H0.8C0.36 8.32 0 8.68 0 9.12V11.2C0 11.64 0.36 12 0.8 12H3.44C3.64 12.64 3.96 13.24 4.4 13.76L2.72 15.44C2.32 15.84 2.32 16.48 2.72 16.88L3.44 17.6C3.84 18 4.48 18 4.88 17.6L6.56 15.92C7.08 16.36 7.68 16.68 8.32 16.88V19.52C8.32 19.96 8.68 20.32 9.12 20.32H11.2C11.64 20.32 12 19.96 12 19.52V16.88C12.64 16.68 13.24 16.36 13.76 15.92L15.44 17.6C15.84 18 16.48 18 16.88 17.6L17.6 16.88C18 16.48 18 15.84 17.6 15.44L15.92 13.76C16.36 13.24 16.68 12.64 16.88 12H19.52C19.96 12 20.32 11.64 20.32 11.2V9.12C20.32 8.68 19.96 8.32 19.52 8.32H16.88C16.68 7.68 16.36 7.08 15.92 6.56L17.6 4.88C18 4.48 18 3.84 17.6 3.44L16.88 2.72C16.48 2.32 15.84 2.32 15.44 2.72L13.76 4.4C13.24 3.96 12.64 3.64 12 3.44V0.8C12 0.36 11.64 0 11.2 0H9.12C8.68 0 8.32 0.36 8.32 0.8V3.44C7.68 3.64 7.08 3.96 6.56 4.4L4.88 2.72C4.48 2.32 3.84 2.32 3.44 2.72L2.72 3.44C2.32 3.84 2.32 4.48 2.72 4.88L4.4 6.56C3.96 7.08 3.64 7.68 3.44 8.32H0.8C0.36 8.32 0 8.68 0 9.12V11.2C0 11.64 0.36 12 0.8 12H3.44C3.64 12.64 3.96 13.24 4.4 13.76L2.72 15.44C2.32 15.84 2.32 16.48 2.72 16.88L3.44 17.6C3.84 18 4.48 18 4.88 17.6L6.56 15.92C7.08 16.36 7.68 16.68 8.32 16.88V19.52C8.32 19.96 8.68 20.32 9.12 20.32H11.2C11.64 20.32 12 19.96 12 19.52V16.88C12.64 16.68 13.24 16.36 13.76 15.92L15.44 17.6C15.84 18 16.48 18 16.88 17.6L17.6 16.88C18 16.48 18 15.84 17.6 15.44L15.92 13.76C16.36 13.24 16.68 12.64 16.88 12H19.52C19.96 12 20.32 11.64 20.32 11.2V9.12C20.32 8.68 19.96 8.32 19.52 8.32H16.88" fill="currentColor" />
              </svg>
              <span>Settings</span>
            </Link>
            
            <Link href="/users/events" className={styles.menuItem}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H13V0H11V2H5V0H3V2H2C0.9 2 0 2.9 0 4V14C0 15.1 0.9 16 2 16H14C15.1 16 16 15.1 16 14V4C16 2.9 15.1 2 14 2ZM14 14H2V7H14V14ZM14 6H2V4H14V6Z" fill="currentColor" />
              </svg>
              <span>My Events</span>
            </Link>
            
            <button onClick={handleSignOut} className={styles.menuItem}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.4 14H3.2C2.54 14 2 13.46 2 12.8V3.2C2 2.54 2.54 2 3.2 2H6.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10.4 11.2L14 8L10.4 4.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 8H6.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}