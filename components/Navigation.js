import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import styles from '../styles/Navigation.module.css';
import { FaHome, FaUser, FaCalendarAlt, FaMapMarkerAlt, FaCog, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';

const Navigation = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleSignOut = async (e) => {
    e.preventDefault();
    await signOut({ redirect: false });
    router.push('/');
  };
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };
  
  const isActive = (path) => {
    return router.pathname === path ? styles.active : '';
  };
  
  return (
    <nav className={`${styles.navigation} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.navContainer}>
        <div className={styles.logoContainer}>
          <Link href="/">
            <a className={styles.logo} onClick={closeMobileMenu}>
              <span className={styles.logoText}>TIKO</span>
            </a>
          </Link>
        </div>
        
        <div className={styles.mobileMenuButton} onClick={toggleMobileMenu}>
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </div>
        
        <div className={`${styles.navLinks} ${mobileMenuOpen ? styles.active : ''}`}>
          <Link href="/">
            <a className={`${styles.navLink} ${isActive('/')}`} onClick={closeMobileMenu}>
              <FaHome className={styles.navIcon} />
              <span>Home</span>
            </a>
          </Link>
          
          {status === 'authenticated' && (
            <>
              <Link href="/users/music-taste">
                <a className={`${styles.navLink} ${isActive('/users/music-taste')}`} onClick={closeMobileMenu}>
                  <FaUser className={styles.navIcon} />
                  <span>Your Taste</span>
                </a>
              </Link>
              
              <Link href="/users/events">
                <a className={`${styles.navLink} ${isActive('/users/events')}`} onClick={closeMobileMenu}>
                  <FaCalendarAlt className={styles.navIcon} />
                  <span>Events</span>
                </a>
              </Link>
              
              <Link href="/users/venues">
                <a className={`${styles.navLink} ${isActive('/users/venues')}`} onClick={closeMobileMenu}>
                  <FaMapMarkerAlt className={styles.navIcon} />
                  <span>Venues</span>
                </a>
              </Link>
              
              <div className={styles.navDivider}></div>
              
              <Link href="/users/profile">
                <a className={`${styles.navLink} ${isActive('/users/profile')}`} onClick={closeMobileMenu}>
                  <FaUser className={styles.navIcon} />
                  <span>Profile</span>
                </a>
              </Link>
              
              <Link href="/users/settings">
                <a className={`${styles.navLink} ${isActive('/users/settings')}`} onClick={closeMobileMenu}>
                  <FaCog className={styles.navIcon} />
                  <span>Settings</span>
                </a>
              </Link>
              
              <a href="#" className={styles.navLink} onClick={(e) => { handleSignOut(e); closeMobileMenu(); }}>
                <FaSignOutAlt className={styles.navIcon} />
                <span>Sign Out</span>
              </a>
            </>
          )}
          
          {status === 'unauthenticated' && (
            <Link href="/api/auth/signin">
              <a className={`${styles.navLink} ${styles.signInButton}`} onClick={closeMobileMenu}>
                <span>Connect with Spotify</span>
              </a>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
