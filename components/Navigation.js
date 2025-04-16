import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Navigation.module.css';

export default function Navigation({ activePage }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Handle sign out
  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };
  
  // Toggle profile menu
  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };
  
  // Close profile menu when clicking outside
  const closeProfileMenu = (e) => {
    if (showProfileMenu && !e.target.closest(`.${styles.profileContainer}`)) {
      setShowProfileMenu(false);
    }
  };
  
  // Navigation items
  const navItems = [
    { id: 'music-taste', label: 'Music Taste', href: '/users/music-taste', icon: '🎵' },
    { id: 'events', label: 'Events', href: '/users/events', icon: '🎪' },
    { id: 'venues', label: 'Venues', href: '/users/venues', icon: '🏢' },
    { id: 'dashboard', label: 'Dashboard', href: '/users/dashboard', icon: '📊' },
    { id: 'vibe-quiz', label: 'Vibe Quiz', href: '/users/vibe-quiz', icon: '❓' }
  ];
  
  return (
    <div className={styles.navigationContainer} onClick={closeProfileMenu}>
      {/* User taste badge - only show on certain pages */}
      {session?.user?.tasteBadge && (
        <div className={styles.tasteBadgeContainer}>
          <span className={styles.tasteBadge}>{session.user.tasteBadge}</span>
        </div>
      )}
      
      {/* Main navigation */}
      <nav className={styles.navigation}>
        {navItems.map(item => (
          <Link href={item.href} key={item.id}>
            <a className={`${styles.navItem} ${activePage === item.id ? styles.active : ''}`}>
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </a>
          </Link>
        ))}
      </nav>
      
      {/* Profile section */}
      <div className={styles.profileContainer}>
        <button 
          className={styles.profileButton}
          onClick={toggleProfileMenu}
          aria-label="Profile menu"
        >
          {session?.user?.image ? (
            <img 
              src={session.user.image} 
              alt={session.user.name || 'User'} 
              className={styles.profileImage}
            />
          ) : (
            <div className={styles.profileInitial}>
              {session?.user?.name?.charAt(0) || 'U'}
            </div>
          )}
        </button>
        
        {/* Profile dropdown menu */}
        {showProfileMenu && (
          <div className={styles.profileMenu}>
            <div className={styles.profileMenuHeader}>
              <div className={styles.profileMenuAvatar}>
                {session?.user?.image ? (
                  <img 
                    src={session.user.image} 
                    alt={session.user.name || 'User'} 
                  />
                ) : (
                  <div className={styles.profileMenuInitial}>
                    {session?.user?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <div className={styles.profileMenuInfo}>
                <p className={styles.profileMenuName}>{session?.user?.name || 'User'}</p>
                <p className={styles.profileMenuEmail}>{session?.user?.email || ''}</p>
              </div>
            </div>
            
            <div className={styles.profileMenuDivider}></div>
            
            <ul className={styles.profileMenuList}>
              <li>
                <Link href="/users/profile">
                  <a className={styles.profileMenuItem}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>Profile</span>
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/users/settings">
                  <a className={styles.profileMenuItem}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                    <span>Settings</span>
                  </a>
                </Link>
              </li>
              <li>
                <button 
                  className={styles.profileMenuSignOut}
                  onClick={handleSignOut}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  <span>Sign Out</span>
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
