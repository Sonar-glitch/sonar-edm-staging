import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import styles from '@/styles/Header.module.css';

export default function Header() {
  const { data: session } = useSession();
  
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        <span className={styles.logoText}>TIKO</span>
      </Link>
      
      <div className={styles.nav}>
        {session ? (
          <Link href="/users/profile" className={styles.profileLink}>
            <div className={styles.avatarContainer}>
              {session.user?.image ? (
                <Image 
                  src={session.user.image}
                  alt="Profile"
                  width={32}
                  height={32}
                  className={styles.avatar}
                />
              ) : (
                <div className={styles.avatarFallback}>
                  {session.user?.name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <span className={styles.profileName}>
              {session.user?.name?.split(' ')[0] || 'Profile'}
            </span>
          </Link>
        ) : (
          <Link href="/auth/signin" className={styles.signInButton}>
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}